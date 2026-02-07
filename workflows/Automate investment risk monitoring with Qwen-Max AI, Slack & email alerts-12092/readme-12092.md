Automate investment risk monitoring with Qwen-Max AI, Slack & email alerts

https://n8nworkflows.xyz/workflows/automate-investment-risk-monitoring-with-qwen-max-ai--slack---email-alerts-12092


# Automate investment risk monitoring with Qwen-Max AI, Slack & email alerts

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Workflow name:** *AI Qwen-Max Investor Portfolio Risk & Compliance Dashboard*  
**Stated title:** *Automate investment risk monitoring with Qwen-Max AI, Slack & email alerts*

**Purpose:**  
Runs on a schedule to fetch portfolio-related data from five sources (financial, operational, legal, insurance, regulatory), consolidates it, uses Qwen-Max (via OpenRouter) to generate structured risk scores and compliance findings per property, then:
- **If high risk or compliance issues exist:** triggers a correction workflow and alerts Slack.
- **Otherwise:** formats and emails an investor report.

**Target use cases (from sticky notes):** banking risk audits, insurance compliance monitoring, portfolio risk tracking—designed for financial institutions, compliance teams, risk managers, and investment firms.

### 1.1 Logical Blocks
1. **Schedule + Configuration**
2. **Data Fetching (5 APIs) + Merge**
3. **AI Risk Assessment (OpenRouter Qwen-Max + Agent + Structured Output Parser)**
4. **Decisioning (High-risk / compliance gate)**
5. **Corrective Action Path (code → webhook → Slack)**
6. **Investor Reporting Path (format → Gmail)**

---

## 2. Block-by-Block Analysis

### Block 1 — Schedule + Workflow Configuration
**Overview:** Triggers the workflow daily (configured hour-based) and sets all runtime configuration values (API endpoints, thresholds, recipients).  
**Nodes involved:** `Schedule Trigger`, `Workflow Configuration`

#### Node: Schedule Trigger
- **Type / role:** `n8n-nodes-base.scheduleTrigger` — entry point that starts executions automatically.
- **Configuration (interpreted):** Runs at **06:00** (based on `triggerAtHour: 6`). Sticky notes describe “hourly/daily”; actual JSON uses an hourly rule with hour constraint.
- **Outputs:** To **Workflow Configuration**.
- **Edge cases / failures:**
  - Instance timezone affects “6 AM”.
  - If n8n is down at trigger time, execution may be skipped depending on scheduler behavior/version.

#### Node: Workflow Configuration
- **Type / role:** `n8n-nodes-base.set` — centralizes environment variables and settings.
- **Key fields set:**
  - `financialApiUrl`, `operationalApiUrl`, `legalApiUrl`, `insuranceApiUrl`, `regulatoryApiUrl` (placeholders)
  - `correctionWorkflowUrl` (webhook URL to another workflow)
  - `investorEmails` (comma-separated)
  - `slackChannel` (channel ID)
  - `riskThreshold` = **70**
- **Expressions used elsewhere:** Many downstream nodes reference this node via `$('Workflow Configuration').first().json.<field>`.
- **Outputs:** Fans out to 5 HTTP Request nodes.
- **Edge cases / failures:**
  - Placeholder values not replaced → downstream HTTP nodes fail (invalid URL).
  - `investorEmails` formatting issues can cause Gmail send failures.
  - Incorrect Slack channel ID causes Slack post errors.

---

### Block 2 — Fetch 5 Data Sources + Merge
**Overview:** Pulls portfolio data from five systems in parallel and merges them into a single payload to feed the AI risk analysis.  
**Nodes involved:** `Fetch Financial Data`, `Fetch Operational Data`, `Fetch Legal Data`, `Fetch Insurance Data`, `Fetch Regulatory Data`, `Merge`

#### Node: Fetch Financial Data
- **Type / role:** `n8n-nodes-base.httpRequest` — fetch financial dataset.
- **Config:** `url = {{ $('Workflow Configuration').first().json.financialApiUrl }}`
- **Outputs:** To `Merge` input index 0.
- **Failure modes:** 401/403 auth, 404 endpoint, 429 rate limits, timeouts, non-JSON responses (if later assumed to be JSON).

#### Node: Fetch Operational Data
- **Type / role:** HTTP Request — fetch operational dataset.
- **Config:** `url = {{ ...operationalApiUrl }}`
- **Outputs:** To `Merge` input index 1.
- **Failure modes:** same as above.

#### Node: Fetch Legal Data
- **Type / role:** HTTP Request — fetch legal dataset.
- **Config:** `url = {{ ...legalApiUrl }}`
- **Outputs:** To `Merge` input index 2.
- **Failure modes:** same as above.

#### Node: Fetch Insurance Data
- **Type / role:** HTTP Request — fetch insurance dataset.
- **Config:** `url = {{ ...insuranceApiUrl }}`
- **Outputs:** To `Merge` input index 3.
- **Failure modes:** same as above.

#### Node: Fetch Regulatory Data
- **Type / role:** HTTP Request — fetch regulatory dataset.
- **Config:** `url = {{ ...regulatoryApiUrl }}`
- **Outputs:** To `Merge` input index 4.
- **Failure modes:** same as above.

#### Node: Merge
- **Type / role:** `n8n-nodes-base.merge` — combines data from 5 inputs into a unified dataset.
- **Configuration:** `numberInputs: 5` (expects five inbound connections).
- **Output:** To `Risk Assessment AI Agent`.
- **Important behavior note:** The Merge node’s exact merge strategy isn’t specified in the JSON beyond number of inputs. In n8n, merge behavior can differ depending on mode; verify in UI that it’s producing the consolidated object/array you expect.
- **Edge cases / failures:**
  - If one API returns zero items while others return items, merge alignment may produce unexpected pairing.
  - Large payloads can increase memory usage and LLM token load downstream.

---

### Block 3 — AI Risk Assessment (Qwen-Max via OpenRouter)
**Overview:** Uses OpenRouter’s Qwen-Max model with a LangChain Agent node; enforces structured JSON output via a schema parser.  
**Nodes involved:** `OpenRouter Chat Model`, `Risk Assessment AI Agent`, `Risk Score Output Parser`

#### Node: OpenRouter Chat Model
- **Type / role:** `@n8n/n8n-nodes-langchain.lmChatOpenRouter` — provides the LLM backend.
- **Configuration:**
  - Model: `qwen/qwen-max`
- **Credentials:** `openRouterApi` (API key required).
- **Connections:** Outputs to `Risk Assessment AI Agent` via `ai_languageModel`.
- **Failure modes:**
  - Invalid/expired OpenRouter API key.
  - Model not available or renamed.
  - Rate limiting / context length exceeded (large merged payload).

#### Node: Risk Score Output Parser
- **Type / role:** `@n8n/n8n-nodes-langchain.outputParserStructured` — enforces structured output schema.
- **Configuration:** Manual JSON schema with fields:
  - `propertyId`, `propertyName`
  - `overallRiskScore`, plus category scores (`financialRisk`, `operationalRisk`, `legalRisk`, `insuranceRisk`, `regulatoryRisk`)
  - `complianceIssues` (array of strings)
  - `recommendations` (array of strings)
- **Connections:** Feeds into `Risk Assessment AI Agent` via `ai_outputParser`.
- **Failure modes:**
  - Model returns non-conforming JSON → parsing errors.
  - Missing required fields in practice (schema has no “required” array; downstream expressions may still assume fields exist).

#### Node: Risk Assessment AI Agent
- **Type / role:** `@n8n/n8n-nodes-langchain.agent` — prompts model to analyze consolidated data and produce risk/compliance outputs.
- **Key configuration:**
  - Input text: `={{ $json }}` (whatever comes out of `Merge`)
  - System message: detailed instructions for scoring (0–100), category breakdown, weighted overall score, compliance issues, and recommendations.
  - `hasOutputParser: true` with the structured parser node attached.
- **Connections:**
  - Input: from `Merge`
  - Uses LLM: from `OpenRouter Chat Model`
  - Output parser: `Risk Score Output Parser`
  - Output: to `Check for High Risk or Compliance Issues`
- **Edge cases / failures:**
  - If merged data is not serialized as expected, the agent may receive an object rendering like `[object Object]` in some contexts; ensure actual text content is meaningful.
  - Token bloat from large merged JSON → truncation → incomplete analysis and schema parse failures.
  - Ambiguity: The schema appears designed for **one property** at a time, but the merged dataset may represent multiple properties. If so, the agent needs to output multiple items or an array—currently schema is a single object.

---

### Block 4 — Decisioning (High Risk / Compliance Gate)
**Overview:** Routes results depending on whether risk threshold is exceeded or any compliance issues exist.  
**Nodes involved:** `Check for High Risk or Compliance Issues`

#### Node: Check for High Risk or Compliance Issues
- **Type / role:** `n8n-nodes-base.if` — conditional routing.
- **Condition logic (OR):**
  1. `overallRiskScore >= riskThreshold`  
     - Left: `={{ $('Risk Assessment AI Agent').item.json.overallRiskScore }}`
     - Right: `={{ $('Workflow Configuration').first().json.riskThreshold }}`
  2. `complianceIssues length > 0`  
     - Left: `={{ $('Risk Assessment AI Agent').item.json.complianceIssues }}`
     - Right: `0`
- **Outputs:**
  - **True path (index 0):** `Generate Corrective Actions`
  - **False path (index 1):** `Format Report Data`
- **Edge cases / failures:**
  - Using `$('Risk Assessment AI Agent').item.json...` references a specific node by name; if renamed, expressions break.
  - If `complianceIssues` is missing or not an array, `lengthGt` may error or evaluate unexpectedly.
  - If the agent outputs strings for scores, loose validation is enabled, but comparisons may still be unreliable.

---

### Block 5 — Corrective Action Path (Code → Webhook → Slack)
**Overview:** For high-risk items, builds a corrective action payload, triggers a downstream correction workflow, then posts a Slack alert.  
**Nodes involved:** `Generate Corrective Actions`, `Trigger Correction Workflow`, `Send Alert to Slack`

#### Node: Generate Corrective Actions
- **Type / role:** `n8n-nodes-base.code` — transforms AI output into an action object for downstream automation.
- **Key logic (JS):**
  - Iterates over `$input.all()`
  - Constructs:
    - `urgency`: `critical` if `overallRiskScore >= 80`, else `high`
    - `timestamp`: ISO string
    - `actionType`: `risk_mitigation`
    - Carries through `propertyId`, `propertyName`, `overallRiskScore`, plus `complianceIssues`/`recommendations` defaulting to `[]`
- **Output:** Items shaped as `{ json: action }` to `Trigger Correction Workflow`.
- **Edge cases / failures:**
  - If incoming item lacks `overallRiskScore`, urgency logic becomes incorrect.
  - If AI returns arrays as strings, `.join()` later in Slack node will fail.

#### Node: Trigger Correction Workflow
- **Type / role:** `n8n-nodes-base.httpRequest` — calls an external webhook to initiate corrections/secondary investigations.
- **Config:**
  - `url = {{ $('Workflow Configuration').first().json.correctionWorkflowUrl }}`
  - `method: POST`
  - Sends JSON body: `={{ $json }}`
- **Output:** To `Send Alert to Slack`.
- **Sub-workflow reference:** This node **invokes another workflow via webhook URL** (`correctionWorkflowUrl`). That downstream workflow must accept the posted JSON and respond in a reasonable time.
- **Edge cases / failures:**
  - Webhook URL invalid/unreachable → request fails and Slack alert won’t send.
  - If webhook requires auth headers, none are configured here.
  - Long-running correction workflow could cause HTTP timeout.

#### Node: Send Alert to Slack
- **Type / role:** `n8n-nodes-base.slack` — sends real-time alert.
- **Authentication:** OAuth2 (`slackOAuth2Api` credential).
- **Config highlights:**
  - Channel is selected by ID: `={{ $('Workflow Configuration').first().json.slackChannel }}`
  - Message uses:
    - `{{ $json.complianceIssues.join("\n") }}`
    - `{{ $json.recommendations.join("\n") }}`
- **Input:** From `Trigger Correction Workflow` output (note: it will pass through the action JSON unless HTTP node output overwrites; ensure HTTP node is configured to *keep input data* if needed).
- **Edge cases / failures:**
  - If `Trigger Correction Workflow` returns a different JSON and n8n overwrites item data, Slack template fields may be missing.
  - If `complianceIssues` is empty, `.join()` returns empty string (ok).
  - Missing Slack scopes (chat:write) or wrong channel ID.

---

### Block 6 — Investor Reporting Path (Format → Gmail)
**Overview:** For non-high-risk items, formats a human-readable report and emails investors.  
**Nodes involved:** `Format Report Data`, `Send Report to Investors via Email`

#### Node: Format Report Data
- **Type / role:** `n8n-nodes-base.set` — maps AI outputs into report fields and precomputes risk level labels.
- **Key assignments:**
  - `reportTitle`: “Portfolio Risk & Compliance Report”
  - `reportDate`: `{{ $now.format('MMMM dd, yyyy') }}`
  - `riskLevel`: computed:
    - Critical if score ≥ 80
    - High if ≥ 60
    - Medium if ≥ 40
    - else Low
  - `complianceIssues`: string via `{{ $json.complianceIssues.join(', ') }}`
  - `recommendations`: string via `{{ $json.recommendations.join(', ') }}`
- **Output:** To Gmail node.
- **Edge cases / failures:**
  - If `complianceIssues` is undefined, `.join()` throws. (Unlike the Code node path, there’s no defaulting.)
  - Locale/timezone influences the date format.

#### Node: Send Report to Investors via Email
- **Type / role:** `n8n-nodes-base.gmail` — sends HTML report.
- **Credentials:** `gmailOAuth2`.
- **To:** `={{ $('Workflow Configuration').first().json.investorEmails }}`
- **Subject:** `Portfolio Risk & Compliance Report - {{ $json.reportDate }}`
- **Body:** Rich HTML including risk breakdown and colored risk level.
- **Edge cases / failures:**
  - Gmail OAuth token expired / insufficient permissions.
  - `investorEmails` must be a valid list; commas are typical, but invalid addresses can fail the send.
  - If the workflow should send one consolidated email for all properties, current design appears to send per item.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Schedule Trigger | scheduleTrigger | Scheduled entry point | — | Workflow Configuration | ## Schedule Trigger and Fetch Data<br>- Initiates assessment hourly for continuous monitoring.<br>- Aggregates five data types into unified dataset. |
| Workflow Configuration | set | Central config variables | Schedule Trigger | Fetch Financial Data; Fetch Operational Data; Fetch Legal Data; Fetch Insurance Data; Fetch Regulatory Data | ## Setup Steps<br>1. Configure hourly/daily schedule trigger.<br>2. Authenticate all five data APIs.<br>3. Set OpenRouter credentials.<br>4. Configure Slack webhook.<br>5. Set Gmail for email distribution.<br>6. Define risk thresholds and compliance rules.<br><br>## Schedule Trigger and Fetch Data<br>- Initiates assessment hourly for continuous monitoring.<br>- Aggregates five data types into unified dataset. |
| Fetch Financial Data | httpRequest | Retrieve financial data | Workflow Configuration | Merge | ## Schedule Trigger and Fetch Data<br>- Initiates assessment hourly for continuous monitoring.<br>- Aggregates five data types into unified dataset. |
| Fetch Operational Data | httpRequest | Retrieve operational data | Workflow Configuration | Merge | ## Schedule Trigger and Fetch Data<br>- Initiates assessment hourly for continuous monitoring.<br>- Aggregates five data types into unified dataset. |
| Fetch Legal Data | httpRequest | Retrieve legal data | Workflow Configuration | Merge | ## Schedule Trigger and Fetch Data<br>- Initiates assessment hourly for continuous monitoring.<br>- Aggregates five data types into unified dataset. |
| Fetch Insurance Data | httpRequest | Retrieve insurance data | Workflow Configuration | Merge | ## Schedule Trigger and Fetch Data<br>- Initiates assessment hourly for continuous monitoring.<br>- Aggregates five data types into unified dataset. |
| Fetch Regulatory Data | httpRequest | Retrieve regulatory data | Workflow Configuration | Merge | ## Schedule Trigger and Fetch Data<br>- Initiates assessment hourly for continuous monitoring.<br>- Aggregates five data types into unified dataset. |
| Merge | merge | Consolidate 5 source payloads | Fetch Financial Data; Fetch Operational Data; Fetch Legal Data; Fetch Insurance Data; Fetch Regulatory Data | Risk Assessment AI Agent | ## Schedule Trigger and Fetch Data<br>- Initiates assessment hourly for continuous monitoring.<br>- Aggregates five data types into unified dataset. |
| OpenRouter Chat Model | lmChatOpenRouter | LLM provider (Qwen-Max) | — | Risk Assessment AI Agent (ai_languageModel) | ## Prerequisites<br>OpenRouter API key, five data source APIs, Slack access, Gmail account, investor contacts<br><br>## Use Cases<br>Banking risk audits, insurance compliance monitoring, portfolio risk tracking<br><br>## Customization<br>Swap AI models, modify data sources, adjust thresholds<br><br>## Benefits<br>90% faster risk assessment, eliminates manual aggregation |
| Risk Score Output Parser | outputParserStructured | Enforce structured AI JSON | — | Risk Assessment AI Agent (ai_outputParser) | ## Risk Assessment AI & Scoring<br>- Evaluates risk; generates numerical scores.<br>- Extracts structured output; identifies severity. |
| Risk Assessment AI Agent | langchain.agent | Perform risk/compliance analysis | Merge | Check for High Risk or Compliance Issues | ## Risk Assessment AI & Scoring<br>- Evaluates risk; generates numerical scores.<br>- Extracts structured output; identifies severity. |
| Check for High Risk or Compliance Issues | if | Gate for high-risk routing | Risk Assessment AI Agent | Generate Corrective Actions; Format Report Data | ## Trigger Corrections & Alert<br>- Implements automated responses.<br>- Generates reports; sends Slack notifications. |
| Generate Corrective Actions | code | Build corrective action payload | Check for High Risk or Compliance Issues (true) | Trigger Correction Workflow | ## Trigger Corrections & Alert<br>- Implements automated responses.<br>- Generates reports; sends Slack notifications. |
| Trigger Correction Workflow | httpRequest | Call correction webhook/workflow | Generate Corrective Actions | Send Alert to Slack | ## Trigger Corrections & Alert<br>- Implements automated responses.<br>- Generates reports; sends Slack notifications. |
| Send Alert to Slack | slack | Slack notification | Trigger Correction Workflow | — | ## Trigger Corrections & Alert<br>- Implements automated responses.<br>- Generates reports; sends Slack notifications. |
| Format Report Data | set | Prepare email report fields | Check for High Risk or Compliance Issues (false) | Send Report to Investors via Email | ## Trigger Corrections & Alert<br>- Implements automated responses.<br>- Generates reports; sends Slack notifications. |
| Send Report to Investors via Email | gmail | Email investor report | Format Report Data | — | ## Setup Steps<br>1. Configure hourly/daily schedule trigger.<br>2. Authenticate all five data APIs.<br>3. Set OpenRouter credentials.<br>4. Configure Slack webhook.<br>5. Set Gmail for email distribution.<br>6. Define risk thresholds and compliance rules. |
| Sticky Note | stickyNote | Comment / instructions | — | — | ## Setup Steps<br>1. Configure hourly/daily schedule trigger.<br>2. Authenticate all five data APIs.<br>3. Set OpenRouter credentials.<br>4. Configure Slack webhook.<br>5. Set Gmail for email distribution.<br>6. Define risk thresholds and compliance rules. |
| Sticky Note2 | stickyNote | Comment / high-level description | — | — | ## How It Works<br>Automates financial risk evaluation by intelligently consolidating information from five critical sources: financial, operational, legal, insurance, and regulatory systems. Hourly triggers enable continuous, AI-driven risk assessment using the OpenRouter Chat Model, producing dynamic risk scores while simultaneously identifying emerging compliance gaps and potential exposure areas. High-risk findings automatically initiate corrective actions, trigger secondary investigations, and send real-time alerts through Slack notifications as well as investor email updates. Designed for financial institutions, compliance teams, risk managers, and investment firms, it provides continuous, scalable, and fully data-driven monitoring of risk across complex regulatory and operational environments. |
| Sticky Note3 | stickyNote | Comment / prerequisites and benefits | — | — | ## Prerequisites<br>OpenRouter API key, five data source APIs, Slack access, Gmail account, investor contacts<br><br>## Use Cases<br>Banking risk audits, insurance compliance monitoring, portfolio risk tracking<br><br>## Customization<br>Swap AI models, modify data sources, adjust thresholds<br><br>## Benefits<br>90% faster risk assessment, eliminates manual aggregation |
| Sticky Note4 | stickyNote | Comment / AI scoring block | — | — | ## Risk Assessment AI & Scoring<br>- Evaluates risk; generates numerical scores.<br>- Extracts structured output; identifies severity. |
| Sticky Note5 | stickyNote | Comment / corrections & alert block | — | — | ## Trigger Corrections & Alert<br>- Implements automated responses.<br>- Generates reports; sends Slack notifications. |
| Sticky Note6 | stickyNote | Comment / schedule & fetch block | — | — | ## Schedule Trigger and Fetch Data<br>- Initiates assessment hourly for continuous monitoring.<br>- Aggregates five data types into unified dataset. |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** named “AI Qwen-Max Investor Portfolio Risk & Compliance Dashboard”.

2. **Add `Schedule Trigger`**
   - Node type: *Schedule Trigger*
   - Set it to run at **06:00** (adjust timezone/schedule to your needs).
   - This is the workflow entry.

3. **Add `Workflow Configuration` (Set node)**
   - Add fields:
     - `financialApiUrl` (string)
     - `operationalApiUrl` (string)
     - `legalApiUrl` (string)
     - `insuranceApiUrl` (string)
     - `regulatoryApiUrl` (string)
     - `correctionWorkflowUrl` (string)
     - `investorEmails` (string, comma-separated)
     - `slackChannel` (string, Slack channel ID)
     - `riskThreshold` (number, default **70**)
   - Connect: `Schedule Trigger` → `Workflow Configuration`.

4. **Add five `HTTP Request` nodes**:
   - Names:
     - Fetch Financial Data
     - Fetch Operational Data
     - Fetch Legal Data
     - Fetch Insurance Data
     - Fetch Regulatory Data
   - For each node:
     - URL expression:
       - Financial: `{{ $('Workflow Configuration').first().json.financialApiUrl }}`
       - Operational: `{{ $('Workflow Configuration').first().json.operationalApiUrl }}`
       - Legal: `{{ $('Workflow Configuration').first().json.legalApiUrl }}`
       - Insurance: `{{ $('Workflow Configuration').first().json.insuranceApiUrl }}`
       - Regulatory: `{{ $('Workflow Configuration').first().json.regulatoryApiUrl }}`
     - Configure authentication/headers as required by your APIs (not defined in JSON).
   - Connect `Workflow Configuration` to all 5 HTTP nodes.

5. **Add `Merge` node**
   - Node type: *Merge*
   - Set **Number of Inputs = 5**
   - Connect each HTTP node to Merge inputs in order (0..4).

6. **Add `OpenRouter Chat Model`**
   - Node type: *OpenRouter Chat Model (LangChain)*
   - Model: `qwen/qwen-max`
   - Credentials: create and select **OpenRouter API** credential (API key).
   - This node connects via the special AI port to the agent.

7. **Add `Risk Score Output Parser`**
   - Node type: *Structured Output Parser*
   - Schema: create a manual schema with fields:
     - propertyId (string), propertyName (string)
     - overallRiskScore (number)
     - financialRisk, operationalRisk, legalRisk, insuranceRisk, regulatoryRisk (numbers)
     - complianceIssues (array of strings)
     - recommendations (array of strings)

8. **Add `Risk Assessment AI Agent`**
   - Node type: *AI Agent (LangChain Agent)*
   - Input text: `{{ $json }}` (from Merge)
   - System message: paste the provided risk/compliance instructions (scoring + recommendations).
   - Attach:
     - Language model: connect `OpenRouter Chat Model` → Agent (AI language model connection)
     - Output parser: connect `Risk Score Output Parser` → Agent (AI output parser connection)
   - Connect `Merge` → `Risk Assessment AI Agent` (main connection).

9. **Add `Check for High Risk or Compliance Issues` (IF node)**
   - Condition group: **OR**
   - Condition A: Number **>=**
     - Left: `{{ $('Risk Assessment AI Agent').item.json.overallRiskScore }}`
     - Right: `{{ $('Workflow Configuration').first().json.riskThreshold }}`
   - Condition B: Array **length > 0**
     - Left: `{{ $('Risk Assessment AI Agent').item.json.complianceIssues }}`
     - Right: `0`
   - Connect Agent → IF.

10. **High-risk path: add `Generate Corrective Actions` (Code node)**
    - Paste the JS that builds:
      - urgency (critical if score ≥ 80 else high)
      - timestamp
      - actionType = risk_mitigation
      - carry complianceIssues/recommendations arrays
    - Connect IF (true) → Code.

11. **Add `Trigger Correction Workflow` (HTTP Request)**
    - Method: **POST**
    - URL: `{{ $('Workflow Configuration').first().json.correctionWorkflowUrl }}`
    - Body: send JSON body = `{{ $json }}`
    - Connect Code → HTTP.

12. **Add `Send Alert to Slack`**
    - Node type: *Slack*
    - Auth: OAuth2; create/select Slack OAuth2 credential with `chat:write` scope (and channel access).
    - Post to channel by ID: `{{ $('Workflow Configuration').first().json.slackChannel }}`
    - Message template uses `$json.propertyName`, `$json.propertyId`, `$json.overallRiskScore`, `$json.urgency`, and joins arrays with newline.
    - Connect `Trigger Correction Workflow` → Slack.
    - **Important:** ensure the HTTP node is not overwriting the item with only the HTTP response if you still need the original action fields in Slack (enable “Include Input Data” / “Keep input data” depending on node options).

13. **Non-high-risk path: add `Format Report Data` (Set node)**
    - Create fields:
      - reportTitle, reportDate (`{{ $now.format('MMMM dd, yyyy') }}`)
      - propertyId, propertyName, overallRiskScore
      - riskLevel formula (Critical/High/Medium/Low)
      - category scores
      - complianceIssues: `{{ $json.complianceIssues.join(', ') }}`
      - recommendations: `{{ $json.recommendations.join(', ') }}`
    - Connect IF (false) → Set.

14. **Add `Send Report to Investors via Email` (Gmail node)**
    - Credentials: Gmail OAuth2 (configure in n8n; requires Google project/app or n8n’s supported OAuth flow).
    - To: `{{ $('Workflow Configuration').first().json.investorEmails }}`
    - Subject: `Portfolio Risk & Compliance Report - {{ $json.reportDate }}`
    - Body: HTML using the formatted fields.
    - Connect `Format Report Data` → Gmail.

15. **(Optional) Add sticky notes** for operational guidance (not required for execution).

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “Automates financial risk evaluation by intelligently consolidating information from five critical sources…” | Sticky Note “How It Works” (high-level intent and audience) |
| “Prerequisites: OpenRouter API key, five data source APIs, Slack access, Gmail account, investor contacts” | Sticky Note “Prerequisites” |
| “Customization: Swap AI models, modify data sources, adjust thresholds” | Sticky Note “Customization” |
| “Setup Steps: … Authenticate all five data APIs … Configure Slack … Set Gmail … Define risk thresholds…” | Sticky Note “Setup Steps” |
| “Risk Assessment AI & Scoring – Evaluates risk; generates numerical scores; Extracts structured output” | Sticky Note “Risk Assessment AI & Scoring” |
| “Trigger Corrections & Alert – Implements automated responses; Generates reports; sends Slack notifications.” | Sticky Note “Trigger Corrections & Alert” |
| Note on design intent vs current branching: despite “investor email updates” wording, **email is only sent on the IF false path** in this JSON. | Implementation detail to review |

