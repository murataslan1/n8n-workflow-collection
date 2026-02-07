Automate launch intelligence with Hacker News, Asana, GPT & Slack/Email digests

https://n8nworkflows.xyz/workflows/automate-launch-intelligence-with-hacker-news--asana--gpt---slack-email-digests-12105


# Automate launch intelligence with Hacker News, Asana, GPT & Slack/Email digests

## 1. Workflow Overview

**Purpose:**  
This workflow performs a daily scan of **Hacker News “Show HN”** posts to detect likely product launches, enrich them with structured metadata, **create tracking tasks in Asana**, and generate a **founder-friendly daily digest** distributed via **Slack** and **email**. It also includes a global **error handler** that alerts Slack when any run fails.

**Target use cases:**
- Founder/PM competitive intelligence (new product discovery)
- Daily market pulse reporting to Slack + leadership email
- Lightweight lead/task creation in Asana from public launch signals

### 1.1 Daily Input Reception (Scheduled collection)
Runs on a schedule and fetches the latest Show HN items.

### 1.2 Launch Signal Detection + Normalization
Filters posts for launch-like keywords, extracts/normalizes fields, and assigns a simple “signal strength” score.

### 1.3 Launch Tracking + Aggregation
Creates an Asana task per detected launch and aggregates all launches for digest generation.

### 1.4 AI Digest Generation (Slack + Email)
Uses an Azure OpenAI chat model through a LangChain Agent node to produce a compact Slack message and a structured email digest (strict formatting).

### 1.5 Distribution + Error Handling
Parses the AI output JSON and posts to Slack + sends email. Separately, a workflow-wide error trigger posts failure details to Slack.

---

## 2. Block-by-Block Analysis

### Block 1 — Daily Show HN Monitoring
**Overview:** Triggers once per day and retrieves recent Hacker News posts tagged “show_hn”. This supplies the raw dataset for later filtering and enrichment.  
**Nodes involved:**
- Trigger Daily Show HN Launch Scan
- Fetch Recent Show HN Posts from Hacker News1

#### Node: Trigger Daily Show HN Launch Scan
- **Type / role:** `Schedule Trigger` (cron-like workflow entry point)
- **Configuration (interpreted):** Runs on a repeating interval (configured via `rule.interval`). The JSON shows an interval object but not a human-readable cadence; in the UI this typically corresponds to “every day” or a similar schedule.
- **Inputs / outputs:** Entry node → outputs to **Fetch Recent Show HN Posts from Hacker News1**
- **Version notes:** `typeVersion 1.3`
- **Edge cases / failures:**
  - Misconfigured interval could run too frequently or not at all.
  - Timezone considerations: schedule runs in the n8n instance timezone unless configured otherwise.

#### Node: Fetch Recent Show HN Posts from Hacker News1
- **Type / role:** `Hacker News` node (data ingestion)
- **Configuration (interpreted):**
  - **Resource:** “all”
  - **Limit:** 30 items
  - **Tags filter:** `show_hn`
  - **Keyword:** empty (no keyword filtering at source)
- **Inputs / outputs:** From Schedule Trigger → outputs to **Filter Likely Product Launch Announcements1**
- **Version notes:** `typeVersion 1`
- **Edge cases / failures:**
  - API/network issues or rate limiting.
  - Returned fields may vary; downstream code assumes fields like `title`, `story_text`, `objectID`, `points`, etc. exist (or are handled with defaults).

**Sticky note coverage (applies to nodes in this block):**  
“## ⏰ Daily Show HN Monitoring …”

---

### Block 2 — Launch Signal Detection
**Overview:** Applies keyword heuristics to identify launch-like posts and then normalizes the metadata into a structured schema including a simple signal strength.  
**Nodes involved:**
- Filter Likely Product Launch Announcements1
- Normalize Launch Metadata and Score Signal Strength

#### Node: Filter Likely Product Launch Announcements1
- **Type / role:** `Code` node (JavaScript filtering)
- **Configuration (interpreted):**
  - Defines `LAUNCH_HINTS` keywords: `launch, released, soft launch, beta, v1, platform, tool, server, api`
  - For each item, concatenates lowercase `title` + `story_text` and keeps items that include any keyword.
- **Key expressions/variables:**
  - Uses `item.json.title`, `item.json.story_text`
  - `items.filter(...)`
- **Inputs / outputs:** From HN fetch → outputs only matching items to **Normalize Launch Metadata and Score Signal Strength**
- **Version notes:** `typeVersion 2` (code node behavior differs from v1; v2 supports multiple items cleanly)
- **Edge cases / failures:**
  - False positives: generic “tool/api/platform” can match non-launch content.
  - False negatives: launches without any of the keywords won’t pass.
  - `story_text` can be null/undefined (handled by defaulting to empty string).

#### Node: Normalize Launch Metadata and Score Signal Strength
- **Type / role:** `Code` node (JavaScript transformation/enrichment)
- **Configuration (interpreted):**
  - Extracts `product_name` from title:
    - Removes leading `Show HN:` (case-insensitive)
    - Splits on en dash (`–`) or hyphen (`-`) and takes the first segment
  - Builds HN discussion URL from `objectID`:
    - `https://news.ycombinator.com/item?id=<objectID>`
  - Creates `description` by stripping HTML tags from `story_text` and truncating to 300 chars
  - Assigns `launch_signal_strength`:
    - Default `medium`
    - If `points > 1500` → `high`
    - If text includes `soft launch` → `low` (overrides even if points are high)
  - Adds `detected_at` timestamp (ISO string)
- **Resulting output schema (per item):**
  - `source`, `launch_type`, `title`, `product_name`, `description`, `url`, `hn_item_url`, `author`, `created_at`, `points`, `num_comments`, `launch_signal_strength`, `detected_at`
- **Inputs / outputs:** From filter → outputs to:
  - **Create Asana Task for Detected Product Launch**
  - **Aggregate Launch Items for Digest Generation**
- **Version notes:** `typeVersion 2`
- **Edge cases / failures:**
  - If `objectID` missing, `hn_item_url` becomes empty string.
  - The product-name heuristic may cut too aggressively for titles with multiple hyphens/dashes.
  - `points` can be undefined; comparisons with `> 1500` may behave unexpectedly if not numeric.
  - HTML stripping is simplistic; some entities may remain.

**Sticky note coverage (applies to nodes in this block):**  
“## 🔍 Launch Signal Detection …”

---

### Block 3 — Launch Tracking & Aggregation
**Overview:** For each detected launch, creates a follow-up task in Asana with rich context. In parallel, aggregates all detected launches to prepare a single payload for AI digest generation.  
**Nodes involved:**
- Create Asana Task for Detected Product Launch
- Aggregate Launch Items for Digest Generation

#### Node: Create Asana Task for Detected Product Launch
- **Type / role:** `Asana` node (task creation / CRM-like logging)
- **Authentication:** OAuth2 (Asana OAuth2 credential)
- **Configuration (interpreted):**
  - **Task name:** `{{ $json.source }}` (will be “Hacker News” for all items as currently set)
  - **Workspace:** `1212551193156936`
  - **Project:** `1212565062132347`
  - **Due date:** tomorrow: `{{ $now.plus({ days: 1 }).toISODate() }}`
  - **Notes field:** A formatted multi-line task description including product name, author, timestamps, signal strength, points/comments, product URL, HN discussion URL, and description.
- **Inputs / outputs:** From normalization code node; no downstream connections shown (task creation is a side-effect).
- **Version notes:** `typeVersion 1`
- **Edge cases / failures:**
  - OAuth token expiration / revoked access.
  - Workspace/project IDs invalid or inaccessible.
  - Task name is not unique and not descriptive; Asana may fill with many tasks named “Hacker News” (recommend using product/title).
  - Rate limiting if many items pass the filter.

#### Node: Aggregate Launch Items for Digest Generation
- **Type / role:** `Aggregate` node (combines multiple items)
- **Configuration (interpreted):**
  - Mode: `aggregateAllItemData` (collect all incoming items into a combined structure for downstream use)
- **Inputs / outputs:** From normalization → outputs to **Generate Daily Founder Launch Digest (AI)**
- **Version notes:** `typeVersion 1`
- **Edge cases / failures:**
  - If zero items pass the filter, aggregation may output an empty aggregation; downstream AI node may produce unusable output unless handled (currently no explicit “no launches” branch).

**Sticky note coverage (applies to nodes in this block):**  
“## 📋 Launch Tracking & Aggregation …”

---

### Block 4 — Founder Digest Generation (AI)
**Overview:** Uses a LangChain Agent with an Azure OpenAI chat model to generate two deliverables: a compact Slack digest and a strict-format email digest grouped by signal strength.  
**Nodes involved:**
- Generate Daily Founder Launch Digest (AI)
- LLM Reasoning Engine for Launch Digest

#### Node: LLM Reasoning Engine for Launch Digest
- **Type / role:** `Azure OpenAI Chat Model` (LangChain language model provider)
- **Model:** `gpt-4o-mini`
- **Credentials:** Azure OpenAI (`azureOpenAiApi`)
- **Connections:** Provides the **AI Language Model** input to the Agent node via `ai_languageModel` connection.
- **Version notes:** `typeVersion 1`
- **Edge cases / failures:**
  - Azure deployment/model name mismatch (Azure uses deployments; ensure this node is mapped correctly in credentials).
  - Token limits: large input arrays could exceed context length.
  - Transient 429/5xx from Azure.

#### Node: Generate Daily Founder Launch Digest (AI)
- **Type / role:** `LangChain Agent` (prompt + orchestration)
- **Configuration (interpreted):**
  - Prompt instructs the agent to:
    1) Produce a Slack message with a header and bullet list; each bullet includes product name, ≤12-word description, signal strength, and HN link.
    2) Produce an email digest with strict headers and per-product structure.
  - **Strict output constraint:** “Return ONLY valid JSON” with keys `slack_message` and `email_digest`.
  - Injects input launches using:
    - `{{ JSON.stringify($input.all().map(i => i.json), null, 2) }}`
  - System message positions the agent as a “founder-communications assistant” and reiterates formatting goals.
- **Inputs / outputs:**
  - Main input from Aggregate node
  - AI language model input from the Azure OpenAI node
  - Main output to **Parse Digest Output into Slack and Email Payloads**
- **Version notes:** `typeVersion 2` (LangChain node versions vary significantly; ensure the same package/node set)
- **Edge cases / failures:**
  - Non-JSON output despite instruction (common LLM failure mode) → will break downstream JSON.parse.
  - Incomplete keys (`slack_message` missing) → downstream Slack/Email nodes may send empty content.
  - If launches are empty, the model may invent content unless explicitly told not to (prompt currently does not enforce “no hallucinations” / “if empty, say no launches”).

**Sticky note coverage (applies to nodes in this block):**  
“## 🧠 Founder Digest Generation …”

---

### Block 5 — Digest Distribution
**Overview:** Parses the AI JSON output into two fields and sends them to Slack and Gmail.  
**Nodes involved:**
- Parse Digest Output into Slack and Email Payloads
- Send Daily Founder Launch Digest to Slack
- Send Daily Founder Launch Digest via Email

#### Node: Parse Digest Output into Slack and Email Payloads
- **Type / role:** `Code` node (JSON parsing + field extraction)
- **Configuration (interpreted):**
  - Reads `items[0].json.output`
  - `JSON.parse(raw)` to obtain `slack_message` and `email_digest`
  - Outputs a single item with `{ slack_message, email_digest }`
- **Inputs / outputs:** From AI agent → outputs to both Slack sender and Gmail sender nodes.
- **Version notes:** `typeVersion 2`
- **Edge cases / failures:**
  - If AI output is not valid JSON → workflow fails here.
  - If the agent node outputs under a different property name than `output` (version/config dependent) → `raw` becomes undefined and parsing fails.

#### Node: Send Daily Founder Launch Digest to Slack
- **Type / role:** `Slack` node (message posting)
- **Configuration (interpreted):**
  - Posts `{{ $json.slack_message }}` to a specific channel ID: `C09GNB90TED` (cached name: “general-information”)
- **Credentials:** Slack API credential
- **Inputs / outputs:** From parse node; no downstream connections.
- **Version notes:** `typeVersion 2.1`
- **Edge cases / failures:**
  - Slack token revoked / missing scopes (e.g., `chat:write`).
  - Channel ID invalid or bot not in channel.
  - Slack message length limits (rare unless very large digest).

#### Node: Send Daily Founder Launch Digest via Email
- **Type / role:** `Gmail` node (send email)
- **Configuration (interpreted):**
  - To: `user@example.com`
  - Subject: “Daily Hacker News Launch Digest”
  - Body: converts newline to HTML line breaks:
    - `{{ $json.email_digest.replace(/\n/g, '<br>') }}`
- **Credentials:** Gmail OAuth2
- **Inputs / outputs:** From parse node; no downstream connections.
- **Version notes:** `typeVersion 2.2`
- **Edge cases / failures:**
  - OAuth token expiration / insufficient Gmail scopes.
  - HTML rendering: `<br>` works, but if the digest contains special characters they are not HTML-escaped.
  - Sending limits/quota on Gmail account.

**Sticky note coverage (applies to nodes in this block):**  
“## 📣 Digest Distribution …”

---

### Block 6 — Error Handling (Slack alert)
**Overview:** Catches any workflow execution error and posts a diagnostic alert to Slack including node name, error message, and timestamp.  
**Nodes involved:**
- Error Handler Trigger
- Slack: Send Error Alert

#### Node: Error Handler Trigger
- **Type / role:** `Error Trigger` (secondary entry point)
- **Configuration:** No parameters; triggers whenever the workflow errors.
- **Inputs / outputs:** Entry → outputs to **Slack: Send Error Alert**
- **Version notes:** `typeVersion 1`
- **Edge cases / failures:**
  - If Slack node also fails (auth/channel), error alert won’t be delivered.
  - Message references “API Error Catalog Workflow” (likely copied text) which may confuse responders.

#### Node: Slack: Send Error Alert
- **Type / role:** `Slack` node (incident notification)
- **Configuration (interpreted):**
  - Sends message:
    - Node: `{{ $json.node.name }}`
    - Message: `{{ $json.error.message }}`
    - Time: `{{ $json.timestamp }}`
  - Channel: `C09GNB90TED` (general-information)
- **Credentials:** Slack API credential
- **Version notes:** `typeVersion 2.3`
- **Edge cases / failures:**
  - Missing permissions or bot not in channel.
  - Some errors may not include the expected JSON shape; fields could be undefined.

**Sticky note coverage (applies to nodes in this block):**  
“## 🚨 Error Handling …”

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Trigger Daily Show HN Launch Scan | Schedule Trigger | Daily workflow entry point | — | Fetch Recent Show HN Posts from Hacker News1 | ## ⏰ Daily Show HN Monitoring<br>Controls when and how new launch data is collected.<br><br>• Trigger Daily Show HN Launch Scan<br>Runs the workflow automatically on a daily schedule.<br><br>• Fetch Recent Show HN Posts from Hacker News<br>Pulls the latest “Show HN” posts directly from Hacker News using native HN data. |
| Fetch Recent Show HN Posts from Hacker News1 | Hacker News | Fetch latest Show HN posts | Trigger Daily Show HN Launch Scan | Filter Likely Product Launch Announcements1 | ## ⏰ Daily Show HN Monitoring<br>Controls when and how new launch data is collected.<br><br>• Trigger Daily Show HN Launch Scan<br>Runs the workflow automatically on a daily schedule.<br><br>• Fetch Recent Show HN Posts from Hacker News<br>Pulls the latest “Show HN” posts directly from Hacker News using native HN data. |
| Filter Likely Product Launch Announcements1 | Code | Keyword-based launch detection | Fetch Recent Show HN Posts from Hacker News1 | Normalize Launch Metadata and Score Signal Strength | ## 🔍 Launch Signal Detection<br>Identifies which posts represent real product launches.<br><br>• Filter Likely Product Launch Announcements<br>Scans titles and descriptions for launch-related keywords (launch, beta, v1, API, platform, tool).<br><br>• Normalize Launch Metadata and Score Signal Strength<br>Extracts product name, description, links, author, and engagement. Assigns a launch signal strength (High / Medium / Low). |
| Normalize Launch Metadata and Score Signal Strength | Code | Normalize fields, build URLs, score signal | Filter Likely Product Launch Announcements1 | Create Asana Task for Detected Product Launch; Aggregate Launch Items for Digest Generation | ## 🔍 Launch Signal Detection<br>Identifies which posts represent real product launches.<br><br>• Filter Likely Product Launch Announcements<br>Scans titles and descriptions for launch-related keywords (launch, beta, v1, API, platform, tool).<br><br>• Normalize Launch Metadata and Score Signal Strength<br>Extracts product name, description, links, author, and engagement. Assigns a launch signal strength (High / Medium / Low). |
| Create Asana Task for Detected Product Launch | Asana | Create an Asana follow-up task per launch | Normalize Launch Metadata and Score Signal Strength | — | ## 📋 Launch Tracking & Aggregation<br>Tracks launches and prepares data for digest creation.<br><br>• Create Asana Task for Detected Product Launch<br>Creates a follow-up task with full launch context (product, author, links, engagement, signal strength).<br><br>• Aggregate Launch Items for Digest Generation<br>Combines all detected launches into a single dataset for daily digest generation. |
| Aggregate Launch Items for Digest Generation | Aggregate | Combine launches for AI input | Normalize Launch Metadata and Score Signal Strength | Generate Daily Founder Launch Digest (AI) | ## 📋 Launch Tracking & Aggregation<br>Tracks launches and prepares data for digest creation.<br><br>• Create Asana Task for Detected Product Launch<br>Creates a follow-up task with full launch context (product, author, links, engagement, signal strength).<br><br>• Aggregate Launch Items for Digest Generation<br>Combines all detected launches into a single dataset for daily digest generation. |
| Generate Daily Founder Launch Digest (AI) | LangChain Agent | Produce Slack + email digest JSON | Aggregate Launch Items for Digest Generation; (AI model via LLM Reasoning Engine for Launch Digest) | Parse Digest Output into Slack and Email Payloads | ## 🧠 Founder Digest Generation<br>Transforms raw launch data into founder-friendly insights.<br><br>• Generate Daily Founder Launch Digest (AI)<br>Creates: - A compact Slack launch digest - A clean, structured email digest - Grouped by launch signal strength<br><br>• LLM Reasoning Engine for Launch Digest<br>Provides the AI reasoning model that ensures clarity, structure, and readability. |
| LLM Reasoning Engine for Launch Digest | Azure OpenAI Chat Model | LLM provider for agent | — | Generate Daily Founder Launch Digest (AI) (ai_languageModel) | ## 🧠 Founder Digest Generation<br>Transforms raw launch data into founder-friendly insights.<br><br>• Generate Daily Founder Launch Digest (AI)<br>Creates: - A compact Slack launch digest - A clean, structured email digest - Grouped by launch signal strength<br><br>• LLM Reasoning Engine for Launch Digest<br>Provides the AI reasoning model that ensures clarity, structure, and readability. |
| Parse Digest Output into Slack and Email Payloads | Code | Parse LLM JSON output into fields | Generate Daily Founder Launch Digest (AI) | Send Daily Founder Launch Digest to Slack; Send Daily Founder Launch Digest via Email | ## 📣 Digest Distribution<br>Delivers insights to founders and teams.<br><br>• Parse Digest Output into Slack and Email Payloads<br>Separates AI output into Slack and email-ready formats.<br><br>• Send Daily Founder Launch Digest to Slack<br>Posts the daily launch summary directly to Slack.<br><br>• Send Daily Founder Launch Digest via Email<br>Delivers an email-friendly version for inbox consumption. |
| Send Daily Founder Launch Digest to Slack | Slack | Send digest to Slack channel | Parse Digest Output into Slack and Email Payloads | — | ## 📣 Digest Distribution<br>Delivers insights to founders and teams.<br><br>• Parse Digest Output into Slack and Email Payloads<br>Separates AI output into Slack and email-ready formats.<br><br>• Send Daily Founder Launch Digest to Slack<br>Posts the daily launch summary directly to Slack.<br><br>• Send Daily Founder Launch Digest via Email<br>Delivers an email-friendly version for inbox consumption. |
| Send Daily Founder Launch Digest via Email | Gmail | Send digest email | Parse Digest Output into Slack and Email Payloads | — | ## 📣 Digest Distribution<br>Delivers insights to founders and teams.<br><br>• Parse Digest Output into Slack and Email Payloads<br>Separates AI output into Slack and email-ready formats.<br><br>• Send Daily Founder Launch Digest to Slack<br>Posts the daily launch summary directly to Slack.<br><br>• Send Daily Founder Launch Digest via Email<br>Delivers an email-friendly version for inbox consumption. |
| Error Handler Trigger | Error Trigger | Global failure entry point | — | Slack: Send Error Alert | ## 🚨 Error Handling<br><br>Catches any workflow failure and posts an alert to Slack.<br>Includes node name, error message, and timestamp for quick debugging. |
| Slack: Send Error Alert | Slack | Post error details to Slack | Error Handler Trigger | — | ## 🚨 Error Handling<br><br>Catches any workflow failure and posts an alert to Slack.<br>Includes node name, error message, and timestamp for quick debugging. |
| Sticky Note | Sticky Note | Documentation only | — | — | ## 🚀 Hacker News Launch Tracker & Asana Task Manager (Show HN Intelligence)<br><br>This workflow automatically scans Hacker News “Show HN” posts every day to detect new product launches, evaluate their launch strength, and convert them into actionable founder insights.<br><br>The automation fetches recent Show HN posts, filters for real launch signals, enriches each item with structured metadata, and scores the launch based on engagement signals like points and comments.<br><br>Each detected launch is immediately logged as an Asana task for tracking, while all launches are aggregated into a clean daily digest. An AI engine then generates a Slack-ready summary and a structured email digest, allowing founders and teams to stay updated on emerging products without manually monitoring Hacker News. |
| Sticky Note1 | Sticky Note | Documentation only | — | — |  |
| Sticky Note2 | Sticky Note | Documentation only | — | — |  |
| Sticky Note3 | Sticky Note | Documentation only | — | — |  |
| Sticky Note4 | Sticky Note | Documentation only | — | — |  |
| Sticky Note5 | Sticky Note | Documentation only | — | — |  |
| Sticky Note8 | Sticky Note | Documentation only | — | — |  |

---

## 4. Reproducing the Workflow from Scratch

1) **Create a new workflow**
- Name: *Hacker News Launch Tracker & Asana Task Manager (Show HN Intelligence)*
- Ensure workflow setting **Execution Order** is `v1` (Workflow Settings → Execution).

2) **Add the schedule entry**
- Add node: **Schedule Trigger**
- Configure it to run **daily** (choose your desired time/timezone).
- Name it: **Trigger Daily Show HN Launch Scan**

3) **Fetch Show HN posts**
- Add node: **Hacker News**
- Name: **Fetch Recent Show HN Posts from Hacker News1**
- Configure:
  - Resource: **All**
  - Limit: **30**
  - Additional fields → Tags: **show_hn**
- Connect: Schedule Trigger → Hacker News

4) **Filter for likely launches**
- Add node: **Code** (JavaScript)
- Name: **Filter Likely Product Launch Announcements1**
- Paste logic implementing the `LAUNCH_HINTS` keyword filter (as described in Block 2).
- Connect: Hacker News → Filter Code

5) **Normalize and score**
- Add node: **Code** (JavaScript)
- Name: **Normalize Launch Metadata and Score Signal Strength**
- Implement:
  - `product_name` extraction from `title`
  - HN discussion URL from `objectID`
  - HTML stripping + truncation for `description`
  - signal strength rule: default medium; points > 1500 => high; if “soft launch” => low
  - `detected_at` as ISO timestamp
- Connect: Filter Code → Normalize Code

6) **Create an Asana task per launch**
- Add node: **Asana**
- Name: **Create Asana Task for Detected Product Launch**
- Credentials:
  - Create/attach **Asana OAuth2** credentials (Asana app in developer console; authorize in n8n).
- Configure:
  - Workspace: set your workspace (ID)
  - Project: set target project (ID)
  - Task name: consider using `{{$json.product_name}}` or `{{$json.title}}` (the provided workflow uses `{{$json.source}}`)
  - Notes: include the launch details (product, author, created_at, signal strength, points, comments, url, hn_item_url, description)
  - Due date: `{{$now.plus({ days: 1 }).toISODate()}}`
- Connect: Normalize Code → Asana

7) **Aggregate launches for the digest**
- Add node: **Aggregate**
- Name: **Aggregate Launch Items for Digest Generation**
- Set aggregation mode to **Aggregate All Item Data** (aggregateAllItemData).
- Connect: Normalize Code → Aggregate

8) **Add Azure OpenAI chat model node**
- Add node: **Azure OpenAI Chat Model** (LangChain)
- Name: **LLM Reasoning Engine for Launch Digest**
- Credentials:
  - Create/attach **Azure OpenAI** credentials (endpoint, API key, resource, deployment/model mapping as required by your n8n version).
- Model: set to **gpt-4o-mini** (or your available Azure deployment equivalent).

9) **Add the AI Agent that generates both digests**
- Add node: **AI Agent** (LangChain Agent)
- Name: **Generate Daily Founder Launch Digest (AI)**
- Prompt type: “Define” (or equivalent)
- Set:
  - **System message**: founder-communications assistant + formatting guidance
  - **User prompt**: instructions to return strict JSON with `slack_message` and `email_digest`, and inject input items using:
    - `{{ JSON.stringify($input.all().map(i => i.json), null, 2) }}`
- Connect:
  - Aggregate → AI Agent (main)
  - Azure OpenAI Chat Model → AI Agent (AI Language Model connection)

10) **Parse the AI JSON output**
- Add node: **Code**
- Name: **Parse Digest Output into Slack and Email Payloads**
- Implement:
  - `const raw = items[0].json.output;`
  - `const parsed = JSON.parse(raw);`
  - Output `{ slack_message: parsed.slack_message, email_digest: parsed.email_digest }`
- Connect: AI Agent → Parse Code

11) **Send to Slack**
- Add node: **Slack**
- Name: **Send Daily Founder Launch Digest to Slack**
- Credentials: Slack API token with `chat:write`
- Configure:
  - Operation: post message to channel
  - Channel ID: select your channel (the workflow uses `C09GNB90TED`)
  - Text: `{{$json.slack_message}}`
- Connect: Parse Code → Slack

12) **Send via Gmail**
- Add node: **Gmail**
- Name: **Send Daily Founder Launch Digest via Email**
- Credentials: Gmail OAuth2
- Configure:
  - To: your target recipient(s)
  - Subject: “Daily Hacker News Launch Digest”
  - Message/body: `{{$json.email_digest.replace(/\n/g, '<br>')}}`
- Connect: Parse Code → Gmail

13) **Add error handling path**
- Add node: **Error Trigger**
- Name: **Error Handler Trigger**
- Add node: **Slack**
- Name: **Slack: Send Error Alert**
- Configure Slack message text:
  - `❌ *Error in API Error Catalog Workflow* *Node:* {{$json.node.name}} *Message:* {{$json.error.message}} *Time:* {{$json.timestamp}}`
  - (Optionally rename the workflow reference in the message to match this workflow.)
- Connect: Error Trigger → Slack error alert node

14) **(Optional) Add sticky notes**
- Add sticky notes matching the blocks for maintainability (Monitoring, Detection, Tracking, AI, Distribution, Error Handling).

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques. | Disclaimer provided by the user |

