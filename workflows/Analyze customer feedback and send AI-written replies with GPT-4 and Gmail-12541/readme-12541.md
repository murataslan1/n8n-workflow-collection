Analyze customer feedback and send AI-written replies with GPT-4 and Gmail

https://n8nworkflows.xyz/workflows/analyze-customer-feedback-and-send-ai-written-replies-with-gpt-4-and-gmail-12541


# Analyze customer feedback and send AI-written replies with GPT-4 and Gmail

## 1. Workflow Overview

**Workflow name (JSON):** AI-Powered Customer Feedback Analysis & Response System  
**Provided title:** Analyze customer feedback and send AI-written replies with GPT-4 and Gmail (note: the workflow actually uses a generic **Email Send** node, not a dedicated Gmail node)

**Purpose:**  
This workflow ingests omnichannel customer events (feedback/support/sales signals) via webhook, normalizes them into a unified schema, deduplicates and rate-limits processing, enriches the event with customer history and features from PostgreSQL, runs GPT‑4o-based intent/sentiment analysis, computes a priority score, applies suppression policies, then uses a second GPT‑4o decision agent to select an action (marketing/sales/support/no action). Finally, it executes the chosen action (email, Salesforce lead creation, HubSpot update, Slack alert) and logs provenance and analytics.

### 1.1 Input Reception & Normalization
Receives an event via HTTP webhook and converts heterogeneous payloads into a consistent internal schema.

### 1.2 Deduplication Guard (Redis)
Checks a Redis key derived from `eventId` to prevent reprocessing duplicates, then stores the event ID with TTL.

### 1.3 Data Enrichment (PostgreSQL + Merge)
Pulls recent interaction history, feature-store data, and segmentation rules, then merges them for downstream AI analysis.

### 1.4 Intent & Sentiment AI Analysis (GPT‑4o + Structured Parser)
Uses a LangChain Agent powered by GPT‑4o with a JSON schema output parser to generate structured analytics fields.

### 1.5 Priority Scoring & Routing
Computes a “priorityScore/priorityLevel” and routes events; then applies per-customer rate limiting and channel suppression.

### 1.6 Decision Policy AI (GPT‑4o + Structured Parser)
A second agent produces a structured decision (`actionType`, `actionChannel`, details, expected outcome).

### 1.7 Action Execution (Email/Salesforce/HubSpot/Slack)
Executes the chosen action and aggregates results.

### 1.8 Logging, Feedback Loop & Analytics
Writes provenance + outcome tracking to Postgres and appends an analytics row to Google Sheets.

---

## 2. Block-by-Block Analysis

### Block 1 — Input Reception & Normalization
**Overview:** Receives a POST event and standardizes channel, IDs, timestamps, payload, and metadata so downstream nodes operate on a stable schema.  
**Nodes involved:** Event Ingestion Webhook, Workflow Configuration, Event Normalization

#### Node: Event Ingestion Webhook
- **Type / role:** `Webhook` trigger; entry point.
- **Config choices:**  
  - HTTP Method: `POST`  
  - Path: `omnichannel-events`  
  - Response mode: `lastNode` (the final node’s output is returned to the caller).
- **Inputs / outputs:** No input; outputs to **Workflow Configuration**.
- **Edge cases / failures:** Incorrect payload shape, large payloads, missing required identifiers (mitigated by normalization), webhook authentication not configured (none present).
- **Version notes:** `typeVersion 2.1`.

#### Node: Workflow Configuration
- **Type / role:** `Set` node; centralizes environment/config values.
- **Configuration choices (interpreted):**
  - Sets:
    - `redisHost` (placeholder)
    - `redisTTL` = 3600 seconds
    - `postgresHost` (placeholder)
    - `rateLimitThreshold` = 100
    - `rateLimitWindow` = 60
  - `includeOtherFields: true` (preserves incoming webhook fields).
- **Key variables used downstream:**
  - `$('Workflow Configuration').first().json.redisTTL`
  - `rateLimitThreshold`, `rateLimitWindow`
- **Inputs / outputs:** From webhook; to **Event Normalization**.
- **Edge cases:** Placeholders are not used directly by credentialed nodes (Redis/Postgres nodes depend on n8n credentials/connection settings), so these values may be informational unless referenced.
- **Version notes:** `typeVersion 3.4`.

#### Node: Event Normalization
- **Type / role:** `Code` node; transforms input into canonical event format.
- **Configuration choices (interpreted):**
  - Runs per item (`runOnceForEachItem`)
  - Builds:
    - `eventId` (from `eventId` or `id`, else generated)
    - `timestamp` (from multiple candidate fields, else now)
    - `channel` detection heuristics (email/voice/chat/crm/telemetry/unknown)
    - `userId`, `customerId` extraction heuristics
    - `eventType`
    - `payload` and `metadata` (including `rawData`)
- **Key expressions/variables:** uses `$input.item.json`, `Date.now()`, `new Date().toISOString()`
- **Inputs / outputs:** From **Workflow Configuration**; to **Check Deduplication Cache**.
- **Edge cases:**
  - If `customerId` can’t be derived, downstream Postgres queries will run with `$1 = null` (likely returning none or error depending on schema).
  - Payload may become very large because it spreads `...item` into `payload`.
- **Version notes:** `typeVersion 2`.

---

### Block 2 — Deduplication Guard (Redis)
**Overview:** Prevents duplicate processing for the same `eventId` by checking a Redis key; if not found, sets it with TTL.  
**Nodes involved:** Check Deduplication Cache, Is Duplicate Event?, Store Event in Cache

#### Node: Check Deduplication Cache
- **Type / role:** `Redis` GET; checks if `dedup:<eventId>` exists.
- **Config choices:**
  - Operation: `get`
  - Key: `dedup:{{$json.eventId}}`
- **Inputs / outputs:** From **Event Normalization**; to **Is Duplicate Event?**
- **Edge cases:** Redis connectivity/auth issues; key collisions if eventId isn’t truly unique.
- **Version notes:** `typeVersion 1`.

#### Node: Is Duplicate Event?
- **Type / role:** `IF`; intended to branch based on cache hit/miss.
- **Config choices (interpreted):**
  - Condition attempts to check whether the Redis GET result exists.
  - **Important:** The condition is unusual: it uses `notExists` against `{{ $('Check Deduplication Cache').item.json }}`. Depending on how the Redis node returns data, this may invert behavior.
- **Connections:**
  - **True branch:** not connected (drops items)
  - **False branch:** to **Store Event in Cache**
- **Likely intended behavior:** If cache value exists → treat as duplicate and stop; else continue.
- **Edge cases:** Misconfigured condition can cause either:
  - all events treated as duplicates (nothing proceeds), or
  - duplicates not filtered (all proceed).
- **Version notes:** `typeVersion 2.3`.

#### Node: Store Event in Cache
- **Type / role:** `Redis` SET with TTL; marks event as seen.
- **Config choices:**
  - Key: `dedup:{{$json.eventId}}`
  - Value: `{{$json.timestamp}}`
  - TTL: `{{$('Workflow Configuration').first().json.redisTTL}}` (3600)
  - Expire: enabled
- **Outputs / connections:** Splits to four parallel paths:
  - **Merge Enrichment Data** (main index 0)
  - **Fetch Historical Interactions**
  - **Fetch Feature Store Data**
  - **Fetch Segmentation Rules**
- **Edge cases:** If Redis SET fails, nothing continues.
- **Version notes:** `typeVersion 1`.

---

### Block 3 — Data Enrichment (PostgreSQL + Merge)
**Overview:** Retrieves customer context (recent interactions, features, segmentation rules) and combines it for AI analysis.  
**Nodes involved:** Fetch Historical Interactions, Fetch Feature Store Data, Fetch Segmentation Rules, Merge Enrichment Data

#### Node: Fetch Historical Interactions
- **Type / role:** `Postgres` query; gets last 10 interactions.
- **Config choices:**
  - `SELECT * FROM customer_interactions WHERE customer_id = $1 ORDER BY timestamp DESC LIMIT 10`
  - Replacement: `[$json.customerId]`
- **Connections:** Output goes to **Merge Enrichment Data** (input index 1).
- **Edge cases:** Missing table/column, null customerId, large row payloads, DB connection issues.
- **Version notes:** `typeVersion 2.6`.

#### Node: Fetch Feature Store Data
- **Type / role:** `Postgres` query; gets feature-store row(s) for customer.
- **Config:** `SELECT * FROM feature_store WHERE customer_id = $1`
- **Connection status:** **Not connected to Merge** in the JSON (it is triggered from Store Event in Cache, but its output is not used).
- **Impact:** Feature data is *requested* but never merged into the item as shown.
- **Edge cases:** same as above.
- **Version notes:** `typeVersion 2.6`.

#### Node: Fetch Segmentation Rules
- **Type / role:** `Postgres` query; gets active rules.
- **Config:** `SELECT * FROM segmentation_rules WHERE active = true`
- **Connection status:** **Not connected to Merge** in the JSON (triggered but unused).
- **Impact:** Segmentation rules referenced later may be missing in the working item.
- **Version notes:** `typeVersion 2.6`.

#### Node: Merge Enrichment Data
- **Type / role:** `Merge` node; combines streams.
- **Config choices:**
  - Mode: `combine`
  - Combine by: `combineAll`
- **Inputs / outputs:**
  - Input 0: from **Store Event in Cache**
  - Input 1: from **Fetch Historical Interactions**
  - (No configured inputs from feature store / segmentation in current connections)
  - Output to **Intent & Sentiment Analysis Agent**
- **Edge cases:** If one branch returns no item, combine behavior can produce empty/partial merges depending on execution timing.
- **Version notes:** `typeVersion 3.2`.

---

### Block 4 — Intent & Sentiment AI Analysis (GPT‑4o)
**Overview:** Uses GPT‑4o to classify intent, sentiment, emotional state, churn risk, and purchase readiness, enforcing a structured JSON output.  
**Nodes involved:** Intent & Sentiment Analysis Agent, OpenAI GPT-4 Model, Analysis Output Parser

#### Node: OpenAI GPT-4 Model
- **Type / role:** LangChain Chat Model (`lmChatOpenAi`); provides GPT‑4o.
- **Config choices:** Model = `gpt-4o`
- **Credentials:** OpenAI API credential “OpenAi account”.
- **Connections:** Feeds the agent via `ai_languageModel`.
- **Edge cases:** API quota, rate limits, model access restrictions, timeouts.
- **Version notes:** `typeVersion 1.3`.

#### Node: Analysis Output Parser
- **Type / role:** Structured output parser; enforces JSON schema for analysis.
- **Schema fields:** `intent`, `sentimentScore`, `emotionalState`, `churnRiskScore`, `purchaseReadinessScore`, `confidence`, `reasoning`
- **Connections:** Feeds the agent via `ai_outputParser`.
- **Edge cases:** Model returns invalid JSON or wrong types; parser fails and stops execution.
- **Version notes:** `typeVersion 1.3`.

#### Node: Intent & Sentiment Analysis Agent
- **Type / role:** LangChain Agent; prompts model and returns parsed structured output.
- **Config choices:**
  - Input text template includes: event payload, channel, “Customer History”, “Feature Data”
  - System message defines scoring ranges and required outputs.
  - Output parser enabled.
- **Important data-shape concern:** The template references:
  - `{{$json.historicalInteractions}}`
  - `{{$json.featureData}}`
  But the workflow does not clearly map Postgres results into these properties (Postgres node returns rows, usually under `json` fields per item). Without an intermediate mapping step, these fields may be undefined.
- **Output connection:** to **Calculate Priority Score**
- **Edge cases:** Hallucinated fields, partial parse failures, missing enrichment context reduces quality.
- **Version notes:** `typeVersion 3.1`.

---

### Block 5 — Priority Scoring & Routing + Rate Limit + Suppression
**Overview:** Transforms AI scores into an operational priority, then applies rate limiting and channel suppression to avoid over-contacting customers.  
**Nodes involved:** Calculate Priority Score, Route by Priority & Intent, Check Rate Limit, Rate Limit Exceeded?, Check Cross-Channel Suppression, Is Suppressed?

#### Node: Calculate Priority Score
- **Type / role:** `Code` node; computes `priorityScore` and `priorityLevel`.
- **Logic (interpreted):**
  - Uses: `churnRiskScore`, `purchaseReadinessScore`, `sentimentScore`, `intentUrgency`
  - Maps `intentUrgency` string to numeric (critical/high/medium/low)
  - Weighted sum intended 0–100, but the formula mixes 0–1 scores with 25–100 urgency; then multiplies by 100 only in rounding step is **not** done. Resulting scale can be inconsistent.
  - Sets `priorityCalculatedAt`
- **Edge cases:**
  - `intentUrgency` is never produced by the analysis schema, so defaults to `low`.
  - `sentimentScore` may be negative; reduces priority even for urgent support cases.
- **Output:** to **Route by Priority & Intent**
- **Version notes:** `typeVersion 2`.

#### Node: Route by Priority & Intent
- **Type / role:** `Switch`; routes by `priorityLevel`.
- **Config:** Outputs: Critical/High/Medium/Low; fallback “extra”.
- **Connections:** Only one downstream path is connected (all levels go to **Check Rate Limit** via the single switch output connection in JSON).
- **Edge cases:** If fallback used, might not be connected (it isn’t explicitly connected).
- **Version notes:** `typeVersion 3.4`.

#### Node: Check Rate Limit
- **Type / role:** `Redis` INCR; counts events per customer per minute.
- **Config:**
  - Key: `ratelimit:<customerId>:<currentMinute>` (minute bucket uses `Math.floor(Date.now()/60000)`)
  - TTL: `rateLimitWindow` (60) with expire enabled
- **Output:** to **Rate Limit Exceeded?**
- **Edge cases:** customerId null → key contains “null”; cross-customer collisions possible if IDs missing.
- **Version notes:** `typeVersion 1`.

#### Node: Rate Limit Exceeded?
- **Type / role:** `IF`; checks if INCR count exceeds threshold.
- **Condition:** `$('Check Rate Limit').item.json.count > rateLimitThreshold`
- **Connections:**
  - True branch: not connected (drops item)
  - False branch: to **Check Cross-Channel Suppression**
- **Edge cases:** Redis INCR output field name varies by node version; if `count` is missing, expression errors or always-false.
- **Version notes:** `typeVersion 2.3`.

#### Node: Check Cross-Channel Suppression
- **Type / role:** `Postgres` query; verifies if channel is suppressed for customer.
- **Config:**  
  `SELECT * FROM channel_suppression WHERE customer_id = $1 AND channel = $2 AND suppressed_until > NOW()`
- **Output:** to **Is Suppressed?**
- **Edge cases:** table missing, customerId/channel null.
- **Version notes:** `typeVersion 2.6`.

#### Node: Is Suppressed?
- **Type / role:** `IF`; stops if suppression row exists.
- **Condition:** `$('Check Cross-Channel Suppression').all().length > 0`
- **Connections:**
  - True branch: not connected (drops item)
  - False branch: to **Decision Policy Agent**
- **Edge cases:** If query returns empty but as a single empty item, `.all().length` might be 1; depends on Postgres node behavior.
- **Version notes:** `typeVersion 2.3`.

---

### Block 6 — Decision Policy AI (Action Selection)
**Overview:** Uses GPT‑4o to decide whether to do marketing/sales/support/no action and provides structured action details.  
**Nodes involved:** Decision Policy Agent, OpenAI GPT-4 Decision Model, Decision Output Parser, Route by Action Type

#### Node: OpenAI GPT-4 Decision Model
- **Type / role:** OpenAI chat model for decisioning.
- **Config:** Model = `gpt-4o`
- **Credentials:** same OpenAI credential.
- **Connections:** to **Decision Policy Agent** as `ai_languageModel`.
- **Version notes:** `typeVersion 1.3`.

#### Node: Decision Output Parser
- **Type / role:** Structured parser.
- **Schema fields:** `actionType`, `actionChannel`, `actionDetails` (object), `expectedOutcome`, `confidence`, `reasoning`
- **Connections:** to **Decision Policy Agent** as `ai_outputParser`.
- **Edge cases:** Parser fails if agent produces non-JSON or wrong types.
- **Version notes:** `typeVersion 1.3`.

#### Node: Decision Policy Agent
- **Type / role:** LangChain Agent that applies described decision framework.
- **Prompt references:** `analysis`, `priorityLevel`, `intent`, `churnRiskScore`, `purchaseReadinessScore`, `segmentationRules`
- **Data-shape concern:** The workflow doesn’t clearly create `$json.analysis` or `$json.segmentationRules` fields; unless n8n agent merges its own analysis into those keys, these may be undefined.
- **Output:** to **Route by Action Type**
- **Version notes:** `typeVersion 3.1`.

#### Node: Route by Action Type
- **Type / role:** `Switch`; routes by `actionType` (marketing/sales/support); fallback renamed to “No Action”.
- **Connections:**
  - Marketing → Send Marketing Email
  - Sales → Create Salesforce Lead AND Update HubSpot Contact (two nodes in parallel)
  - Support → Send Support Alert
  - Fallback “No Action” → not connected
- **Edge cases:** If `actionType` is “no_action”, it will go to fallback and then effectively end without logging actions unless separately connected.
- **Version notes:** `typeVersion 3.4`.

---

### Block 7 — Action Execution
**Overview:** Executes the decision: sends an email, creates CRM objects, or alerts support; then aggregates the action results.  
**Nodes involved:** Send Marketing Email, Create Salesforce Lead, Update HubSpot Contact, Send Support Alert, Aggregate Action Results

#### Node: Send Marketing Email
- **Type / role:** `Email Send`; sends outbound email (SMTP/Email configuration), not necessarily Gmail.
- **Config:**
  - To: `{{$json.customerEmail}}`
  - From: placeholder sender email
  - Subject: `{{$json.actionDetails.subject}}`
  - HTML body: `{{$json.actionDetails.messageBody}}`
- **Edge cases:** Missing `customerEmail`, SMTP credential issues, HTML injection if actionDetails not sanitized.
- **Version notes:** `typeVersion 2.1`.

#### Node: Create Salesforce Lead
- **Type / role:** `Salesforce`; creates a lead.
- **Config:**
  - `company`: `customerCompany`
  - `lastname`: `customerName` (note: Salesforce requires LastName; mapping name here is okay but may not be last name)
  - Additional: email, leadSource, description from actionDetails.notes
- **Edge cases:** Required Salesforce fields missing; auth/permission errors; duplicates rules in Salesforce.
- **Version notes:** `typeVersion 1`.

#### Node: Update HubSpot Contact
- **Type / role:** `HubSpot` update operation.
- **Config:** Operation = `update` (no properties shown; likely incomplete and will fail without contact ID/email mapping).
- **Edge cases:** Missing required identifiers for update; auth scopes; API limits.
- **Version notes:** `typeVersion 2.2`.

#### Node: Send Support Alert
- **Type / role:** `Slack` message; alerts support channel.
- **Config:**
  - OAuth2 auth
  - Channel ID: placeholder
  - Message text includes customer and `actionDetails` fields
- **Edge cases:** Missing Slack scopes, invalid channel ID, message formatting issues.
- **Version notes:** `typeVersion 2.4`.

#### Node: Aggregate Action Results
- **Type / role:** `Aggregate`; combines action outputs into `actionResult`.
- **Config:** `aggregateAllItemData` into field `actionResult`.
- **Inputs:** Receives from Email/Salesforce/HubSpot/Slack paths.
- **Output:** to **Log Decision Provenance**
- **Edge cases:** Parallel branches may produce different item shapes; aggregate can create large nested objects.
- **Version notes:** `typeVersion 1`.

---

### Block 8 — Logging, Feedback Loop & Analytics
**Overview:** Logs decision details for traceability, stores an outcome record for later evaluation, and appends summary data to Google Sheets.  
**Nodes involved:** Log Decision Provenance, Store Outcome for Feedback Loop, Update Analytics Dashboard

#### Node: Log Decision Provenance
- **Type / role:** `Postgres` insert into `public.decision_provenance`.
- **Config:** Uses “define below” mapping with many fields.
- **Major data-mapping risks:** The mapping references snake_case keys like:
  - `$json.event_id`, `$json.action_type`, `$json.customer_id`, etc.
  But earlier nodes use camelCase like `eventId`, `customerId`, `priorityLevel`, etc. Unless a mapping/conversion exists (it doesn’t), this insert will write nulls or fail.
- **Edge cases:** Column types mismatch (many mapped as strings), missing columns, constraint violations.
- **Version notes:** `typeVersion 2.6`.

#### Node: Store Outcome for Feedback Loop
- **Type / role:** `Postgres` insert into `public.outcome_feedback`.
- **Config:** Writes pending feedback row with `actual_outcome = null`.
- **Same mapping risk:** references `$json.event_id`, `$json.customer_id`, `$json.action_taken`, `$json.expected_outcome`.
- **Output:** to **Update Analytics Dashboard**
- **Version notes:** `typeVersion 2.6`.

#### Node: Update Analytics Dashboard
- **Type / role:** `Google Sheets` append row to “Real-Time Events”.
- **Config:**
  - Document ID placeholder
  - Sheet name: “Real-Time Events”
  - Appends mapped columns (intent, timestamp, churn_risk, event_type, etc.)
- **Mapping risk:** again uses snake_case fields (`churn_risk`, `event_type`, `priority_level`, `sentiment_score`) not produced earlier unless transformed.
- **Credentials:** Google Sheets OAuth2.
- **Edge cases:** Sheet not found, permissions, rate limits, mismatched column headers.
- **Version notes:** `typeVersion 4.7`.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Event Ingestion Webhook | Webhook | Ingest omnichannel events via HTTP POST | — | Workflow Configuration | ## Feedback Ingestion & Data Normalization / **Why:** Captures feedback from multiple sources (forms, emails, surveys), standardizes data structure, and enriches with metadata for consistent downstream processing across all channels. |
| Workflow Configuration | Set | Define runtime config values (TTL, thresholds) | Event Ingestion Webhook | Event Normalization | ## Feedback Ingestion & Data Normalization / **Why:** Captures feedback from multiple sources (forms, emails, surveys), standardizes data structure, and enriches with metadata for consistent downstream processing across all channels. |
| Event Normalization | Code | Normalize event schema (IDs/channel/payload/metadata) | Workflow Configuration | Check Deduplication Cache | ## Feedback Ingestion & Data Normalization / **Why:** Captures feedback from multiple sources (forms, emails, surveys), standardizes data structure, and enriches with metadata for consistent downstream processing across all channels. |
| Check Deduplication Cache | Redis (get) | Detect duplicate events by eventId | Event Normalization | Is Duplicate Event? | ## Feedback Ingestion & Data Normalization / **Why:** Captures feedback from multiple sources (forms, emails, surveys), standardizes data structure, and enriches with metadata for consistent downstream processing across all channels. |
| Is Duplicate Event? | IF | Branch: stop duplicates / continue new | Check Deduplication Cache | Store Event in Cache (false branch only) | ## Feedback Ingestion & Data Normalization / **Why:** Captures feedback from multiple sources (forms, emails, surveys), standardizes data structure, and enriches with metadata for consistent downstream processing across all channels. |
| Store Event in Cache | Redis (set) | Mark event processed for TTL | Is Duplicate Event? | Merge Enrichment Data; Fetch Historical Interactions; Fetch Feature Store Data; Fetch Segmentation Rules | ## Feedback Ingestion & Data Normalization / **Why:** Captures feedback from multiple sources (forms, emails, surveys), standardizes data structure, and enriches with metadata for consistent downstream processing across all channels. |
| Fetch Historical Interactions | Postgres | Pull last 10 interactions | Store Event in Cache | Merge Enrichment Data | ## Parallel Sentiment & Topic Analysis / **Why:** Simultaneously evaluates emotional tone, identifies key themes, and assesses urgency using AI models, enabling intelligent routing and response prioritization without sequential processing delays. |
| Fetch Feature Store Data | Postgres | Pull feature-store data (currently unused downstream) | Store Event in Cache | — | ## Parallel Sentiment & Topic Analysis / **Why:** Simultaneously evaluates emotional tone, identifies key themes, and assesses urgency using AI models, enabling intelligent routing and response prioritization without sequential processing delays. |
| Fetch Segmentation Rules | Postgres | Pull active segmentation rules (currently unused downstream) | Store Event in Cache | — | ## Parallel Sentiment & Topic Analysis / **Why:** Simultaneously evaluates emotional tone, identifies key themes, and assesses urgency using AI models, enabling intelligent routing and response prioritization without sequential processing delays. |
| Merge Enrichment Data | Merge | Combine base event + history | Store Event in Cache; Fetch Historical Interactions | Intent & Sentiment Analysis Agent | ## Parallel Sentiment & Topic Analysis / **Why:** Simultaneously evaluates emotional tone, identifies key themes, and assesses urgency using AI models, enabling intelligent routing and response prioritization without sequential processing delays. |
| Intent & Sentiment Analysis Agent | LangChain Agent | Produce structured intent/sentiment/risk scores | Merge Enrichment Data | Calculate Priority Score | ## Parallel Sentiment & Topic Analysis / **Why:** Simultaneously evaluates emotional tone, identifies key themes, and assesses urgency using AI models, enabling intelligent routing and response prioritization without sequential processing delays. |
| OpenAI GPT-4 Model | OpenAI Chat Model | LLM backing for analysis agent | — | Intent & Sentiment Analysis Agent (ai_languageModel) | ## Parallel Sentiment & Topic Analysis / **Why:** Simultaneously evaluates emotional tone, identifies key themes, and assesses urgency using AI models, enabling intelligent routing and response prioritization without sequential processing delays. |
| Analysis Output Parser | Structured Output Parser | Enforce JSON schema for analysis | — | Intent & Sentiment Analysis Agent (ai_outputParser) | ## Parallel Sentiment & Topic Analysis / **Why:** Simultaneously evaluates emotional tone, identifies key themes, and assesses urgency using AI models, enabling intelligent routing and response prioritization without sequential processing delays. |
| Calculate Priority Score | Code | Compute priorityScore/priorityLevel | Intent & Sentiment Analysis Agent | Route by Priority & Intent | ## Parallel Sentiment & Topic Analysis / **Why:** Simultaneously evaluates emotional tone, identifies key themes, and assesses urgency using AI models, enabling intelligent routing and response prioritization without sequential processing delays. |
| Route by Priority & Intent | Switch | Route by priority level | Calculate Priority Score | Check Rate Limit | ## Parallel Sentiment & Topic Analysis / **Why:** Simultaneously evaluates emotional tone, identifies key themes, and assesses urgency using AI models, enabling intelligent routing and response prioritization without sequential processing delays. |
| Check Rate Limit | Redis (incr) | Per-customer per-minute throttling | Route by Priority & Intent | Rate Limit Exceeded? |  |
| Rate Limit Exceeded? | IF | Stop if above threshold | Check Rate Limit | Check Cross-Channel Suppression (false branch only) |  |
| Check Cross-Channel Suppression | Postgres | Prevent contacting suppressed channels | Rate Limit Exceeded? | Is Suppressed? |  |
| Is Suppressed? | IF | Stop if suppression exists | Check Cross-Channel Suppression | Decision Policy Agent (false branch only) | ## Contextual AI Response Generation / **Why:** Creates personalized, empathetic responses using customer history and feedback context, maintaining brand voice while addressing specific concerns raised in the feedback. |
| Decision Policy Agent | LangChain Agent | Choose best action type/details | Is Suppressed? | Route by Action Type | ## Contextual AI Response Generation / **Why:** Creates personalized, empathetic responses using customer history and feedback context, maintaining brand voice while addressing specific concerns raised in the feedback. |
| OpenAI GPT-4 Decision Model | OpenAI Chat Model | LLM backing for decision agent | — | Decision Policy Agent (ai_languageModel) | ## Contextual AI Response Generation / **Why:** Creates personalized, empathetic responses using customer history and feedback context, maintaining brand voice while addressing specific concerns raised in the feedback. |
| Decision Output Parser | Structured Output Parser | Enforce JSON schema for decision | — | Decision Policy Agent (ai_outputParser) | ## Contextual AI Response Generation / **Why:** Creates personalized, empathetic responses using customer history and feedback context, maintaining brand voice while addressing specific concerns raised in the feedback. |
| Route by Action Type | Switch | Route marketing/sales/support/no action | Decision Policy Agent | Send Marketing Email; Create Salesforce Lead; Update HubSpot Contact; Send Support Alert | ## Smart Escalation & Automated Distribution / **Why:** Routes negative sentiment or complex issues to human agents via support tickets while sending standard responses automatically, optimizing resource allocation and ensuring critical cases receive immediate attention. |
| Send Marketing Email | Email Send | Send automated response email | Route by Action Type (Marketing) | Aggregate Action Results | ## Smart Escalation & Automated Distribution / **Why:** Routes negative sentiment or complex issues to human agents via support tickets while sending standard responses automatically, optimizing resource allocation and ensuring critical cases receive immediate attention. |
| Create Salesforce Lead | Salesforce | Create lead for sales follow-up | Route by Action Type (Sales) | Aggregate Action Results | ## Smart Escalation & Automated Distribution / **Why:** Routes negative sentiment or complex issues to human agents via support tickets while sending standard responses automatically, optimizing resource allocation and ensuring critical cases receive immediate attention. |
| Update HubSpot Contact | HubSpot | Update existing CRM contact | Route by Action Type (Sales) | Aggregate Action Results | ## Smart Escalation & Automated Distribution / **Why:** Routes negative sentiment or complex issues to human agents via support tickets while sending standard responses automatically, optimizing resource allocation and ensuring critical cases receive immediate attention. |
| Send Support Alert | Slack | Alert support channel for intervention | Route by Action Type (Support) | Aggregate Action Results | ## Smart Escalation & Automated Distribution / **Why:** Routes negative sentiment or complex issues to human agents via support tickets while sending standard responses automatically, optimizing resource allocation and ensuring critical cases receive immediate attention. |
| Aggregate Action Results | Aggregate | Combine action outputs for logging | Send Marketing Email; Create Salesforce Lead; Update HubSpot Contact; Send Support Alert | Log Decision Provenance |  |
| Log Decision Provenance | Postgres | Persist decision traceability | Aggregate Action Results | Store Outcome for Feedback Loop |  |
| Store Outcome for Feedback Loop | Postgres | Create “pending” outcome record | Log Decision Provenance | Update Analytics Dashboard |  |
| Update Analytics Dashboard | Google Sheets | Append analytics row | Store Outcome for Feedback Loop | — |  |
| Sticky Note | Sticky Note | Comment | — | — | ## Prerequisites … (content node) |
| Sticky Note1 | Sticky Note | Comment | — | — | ## Setup Steps … (content node) |
| Sticky Note2 | Sticky Note | Comment | — | — | ## How It Works … (content node) |
| Sticky Note4 | Sticky Note | Comment | — | — | ## Contextual AI Response Generation … (content node) |
| Sticky Note5 | Sticky Note | Comment | — | — | ## Parallel Sentiment & Topic Analysis … (content node) |
| Sticky Note6 | Sticky Note | Comment | — | — | ## Feedback Ingestion & Data Normalization … (content node) |
| Sticky Note7 | Sticky Note | Comment | — | — | ## Smart Escalation & Automated Distribution … (content node) |

---

## 4. Reproducing the Workflow from Scratch

1) **Create Webhook trigger**
   - Add node: **Webhook**
   - Method: `POST`
   - Path: `omnichannel-events`
   - Response: `Last Node`

2) **Add configuration Set node**
   - Add node: **Set** named “Workflow Configuration”
   - Add fields:
     - `redisTTL` (number) = `3600`
     - `rateLimitThreshold` (number) = `100`
     - `rateLimitWindow` (number) = `60`
     - (Optional placeholders) `redisHost`, `postgresHost`
   - Enable **Include Other Fields**

3) **Add normalization Code node**
   - Add node: **Code** named “Event Normalization”
   - Mode: “Run once for each item”
   - Paste logic to produce: `eventId, timestamp, channel, userId, customerId, eventType, payload, metadata`

4) **Add Redis GET for dedup**
   - Add node: **Redis** “Check Deduplication Cache”
   - Operation: `Get`
   - Key expression: `="dedup:" + $json.eventId`
   - Configure Redis credentials/connection in n8n

5) **Add IF for dedup decision**
   - Add node: **IF** “Is Duplicate Event?”
   - Configure to detect a cache hit and stop duplicates.
   - Recommended robust approach:
     - Check if Redis value **is not empty** / **exists** and route to a “stop” branch.
   - Connect:
     - Webhook → Set → Code → Redis Get → IF

6) **Add Redis SET to store dedup marker**
   - Add node: **Redis** “Store Event in Cache”
   - Operation: `Set`
   - Key: `="dedup:" + $json.eventId`
   - Value: `={{$json.timestamp}}`
   - Expire: enabled
   - TTL: `={{$('Workflow Configuration').first().json.redisTTL}}`
   - Connect from IF “not duplicate” branch.

7) **Add Postgres enrichment queries**
   - Add node: **Postgres** “Fetch Historical Interactions”
     - Query: last 10 by customer_id
     - Parameter replacement: `[$json.customerId]`
   - Add node: **Postgres** “Fetch Feature Store Data”
     - Query: `SELECT * FROM feature_store WHERE customer_id = $1`
   - Add node: **Postgres** “Fetch Segmentation Rules”
     - Query: `SELECT * FROM segmentation_rules WHERE active = true`
   - Configure Postgres credentials in n8n

8) **Merge enrichment into a single item**
   - Add node: **Merge** “Merge Enrichment Data”
   - Mode: `Combine`, Combine by: `Combine All`
   - Connect:
     - Store Event in Cache → Merge (Input 0)
     - Fetch Historical Interactions → Merge (Input 1)
   - If you want featureData and segmentationRules available, add additional merge/mapping steps (the provided workflow does not correctly connect these outputs).

9) **Create GPT‑4o model + structured parser for analysis**
   - Add node: **OpenAI Chat Model** (`lmChatOpenAi`) “OpenAI GPT-4 Model”
     - Model: `gpt-4o`
     - Credentials: OpenAI API key
   - Add node: **Structured Output Parser** “Analysis Output Parser”
     - Schema: fields intent/sentimentScore/emotionalState/churnRiskScore/purchaseReadinessScore/confidence/reasoning
   - Add node: **AI Agent** “Intent & Sentiment Analysis Agent”
     - System message: as provided (intent types, ranges)
     - User text template referencing event/payload/history/features
     - Enable output parser
   - Connect model + parser to agent via their AI ports; connect Merge → Agent.

10) **Add priority scoring Code node**
   - Add node: **Code** “Calculate Priority Score”
   - Compute `priorityScore`, `priorityLevel`
   - Connect Agent → Code.

11) **Add priority routing Switch**
   - Add node: **Switch** “Route by Priority & Intent”
   - Rules for `priorityLevel` equals critical/high/medium/low
   - Connect Code → Switch
   - Connect each desired output to the next step (the JSON effectively funnels onward).

12) **Add Redis INCR rate limit**
   - Add node: **Redis** “Check Rate Limit”
   - Operation: `Incr`
   - Key: `="ratelimit:" + $json.customerId + ":" + Math.floor(Date.now()/60000)`
   - TTL: `={{$('Workflow Configuration').first().json.rateLimitWindow}}`
   - Expire enabled
   - Connect Switch → Redis.

13) **Add IF for rate limit exceeded**
   - Add node: **IF** “Rate Limit Exceeded?”
   - Condition: count > threshold
   - Connect Redis → IF
   - Continue only on “not exceeded”.

14) **Add Postgres suppression check + IF**
   - Add node: **Postgres** “Check Cross-Channel Suppression”
   - Query with `$1 customer_id` and `$2 channel`
   - Add node: **IF** “Is Suppressed?”
     - Condition: result length > 0
   - Connect rate-limit pass → suppression query → IF
   - Continue only on “not suppressed”.

15) **Create GPT‑4o model + structured parser for decisioning**
   - Add node: **OpenAI Chat Model** “OpenAI GPT-4 Decision Model” (gpt-4o)
   - Add node: **Structured Output Parser** “Decision Output Parser” with action schema
   - Add node: **AI Agent** “Decision Policy Agent”
     - System message defines decision framework and required structured fields
   - Connect model + parser to agent AI ports; connect “Is Suppressed?” pass → Decision agent.

16) **Route by action type**
   - Add node: **Switch** “Route by Action Type”
   - Rules: `actionType` equals marketing/sales/support; fallback = no action
   - Connect Decision agent → Switch.

17) **Implement action nodes**
   - Marketing:
     - Add **Email Send** “Send Marketing Email”
     - Map `toEmail`, `subject`, `html` from `actionDetails`
     - Configure SMTP (or Gmail via SMTP / or replace with a Gmail node if desired)
   - Sales:
     - Add **Salesforce** “Create Salesforce Lead” (configure OAuth/credentials)
     - Add **HubSpot** “Update HubSpot Contact” (ensure you set identifier + properties)
   - Support:
     - Add **Slack** “Send Support Alert” (OAuth2 credential; channel ID)
   - Connect Switch outputs to these nodes.

18) **Aggregate results**
   - Add node: **Aggregate** “Aggregate Action Results”
   - Aggregate all item data into `actionResult`
   - Connect each action node → Aggregate.

19) **Logging + feedback loop + Sheets**
   - Add **Postgres** “Log Decision Provenance” insert into `decision_provenance`
   - Add **Postgres** “Store Outcome for Feedback Loop” insert into `outcome_feedback`
   - Add **Google Sheets** “Update Analytics Dashboard” append row to “Real-Time Events”
   - Connect: Aggregate → Provenance → Outcome → Sheets
   - Ensure your field names match your actual item structure (camelCase vs snake_case).

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| **Prerequisites:** OpenAI API key, Anthropic Claude API key (optional), Google Workspace account (Sheets, Gmail). **Use Cases:** Product feedback management, customer support automation. **Customization:** Adjust sentiment thresholds, modify response templates. **Benefits:** Responds to feedback 95% faster, consistent response quality. | From “Prerequisites” sticky note |
| **Setup Steps:** configure webhook URL; add OpenAI key; connect Claude (optional); set up Google Sheets; configure Gmail OAuth2 for automated delivery; integrate support ticketing (Zendesk/Freshdesk) for escalation. | From “Setup Steps” sticky note (note: this workflow uses Email Send + Slack/Salesforce/HubSpot, not Zendesk/Freshdesk) |
| **How it works:** ingest → analyze sentiment/topics → generate response → validate → escalate critical → log provenance → send automated replies via email. | From “How It Works” sticky note |
| **Parallel Sentiment & Topic Analysis (why):** simultaneous evaluation to reduce sequential delays. | Sticky note |
| **Contextual AI Response Generation (why):** personalized empathetic responses using history/context/brand voice. | Sticky note |
| **Smart Escalation & Automated Distribution (why):** route complex/negative to humans, standard responses automated. | Sticky note |

Disclaimer: Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.