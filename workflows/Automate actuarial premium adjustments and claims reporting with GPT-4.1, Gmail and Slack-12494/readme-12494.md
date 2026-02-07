Automate actuarial premium adjustments and claims reporting with GPT-4.1, Gmail and Slack

https://n8nworkflows.xyz/workflows/automate-actuarial-premium-adjustments-and-claims-reporting-with-gpt-4-1--gmail-and-slack-12494


# Automate actuarial premium adjustments and claims reporting with GPT-4.1, Gmail and Slack

## 1. Workflow Overview

**Workflow name (JSON):** Real-time actuarial premium adjustment and reporting system  
**Provided title:** Automate actuarial premium adjustments and claims reporting with GPT-4.1, Gmail and Slack

**Purpose:**  
Every 15 minutes, the workflow fetches new claims data from a claims API, uses an actuarial AI agent (GPT-4.1-mini via LangChain nodes) to derive actuarial assumptions (loss ratio, frequency, severity, reserves), computes premium adjustment recommendations, then orchestrates creation of an actuarial memo + risk assessment via two specialist AI tools. Finally, it distributes the resulting report by **Gmail** to the product team and posts a **Slack** alert to the risk team.

**Target use cases:**
- Continuous premium monitoring and adjustments based on incoming claims experience
- Automated actuarial reporting (exec-ready memo) plus risk implications for stakeholders
- Near real-time internal alerts when pricing action may be needed

### 1.1 Scheduled ingestion & configuration
- Triggered every 15 minutes
- Loads workflow constants (API URL, thresholds, recipients)

### 1.2 Claims retrieval
- HTTP request to claims system endpoint (placeholder)

### 1.3 AI actuarial analysis (assumptions extraction)
- Actuarial Analysis Agent uses:
  - OpenAI chat model
  - Calculator tool for math
  - Structured JSON output parser for assumptions

### 1.4 Premium adjustment computation (deterministic)
- Code node applies business logic (loss ratio targets, thresholding)
- Produces “adjustmentData” payload for reporting

### 1.5 AI orchestration: memo + risk assessment + final report
- Orchestrator Agent calls:
  - Memo Writer Agent Tool (structured memo)
  - Risk Assessment Agent Tool (structured risk assessment)
- Produces final structured report

### 1.6 Distribution
- Gmail email to product team
- Slack message to risk channel

---

## 2. Block-by-Block Analysis

### Block 1 — Scheduled ingestion & workflow configuration

**Overview:**  
Starts the workflow on a 15-minute cadence and sets the key runtime parameters (endpoints, threshold, recipients) used downstream.

**Nodes involved:**
- Schedule Trigger - Ingest Claims Data
- Workflow Configuration

#### Node: Schedule Trigger - Ingest Claims Data
- **Type / role:** `Schedule Trigger` — periodic entry point.
- **Key configuration:** Runs every **15 minutes**.
- **Inputs/outputs:** No inputs; outputs into **Workflow Configuration**.
- **Edge cases / failures:**
  - Overlapping executions if processing takes longer than schedule interval (depends on n8n concurrency settings).
  - Missed runs if n8n is down.
- **Version notes:** typeVersion `1.3`.

#### Node: Workflow Configuration
- **Type / role:** `Set` — centralizes constants for use via expressions.
- **Key configuration (assignments):**
  - `claimsApiUrl` (string placeholder): claims API endpoint URL
  - `premiumThreshold` (number): `0.05` (used to ignore small adjustments)
  - `productTeamEmail` (string placeholder): recipient for Gmail
  - `riskTeamSlackChannel` (string placeholder): channel ID for Slack
  - `includeOtherFields: true` so it keeps incoming fields (from trigger).
- **Key expressions/variables used downstream:**
  - `$('Workflow Configuration').first().json.claimsApiUrl`
  - `$('Workflow Configuration').first().json.premiumThreshold`
  - `$('Workflow Configuration').first().json.productTeamEmail`
  - `$('Workflow Configuration').first().json.riskTeamSlackChannel`
- **Connections:** Receives from Schedule Trigger; outputs to **Fetch New Claims Data**.
- **Edge cases / failures:**
  - Placeholders not replaced → HTTP request fails or messages go to invalid destinations.
- **Version notes:** typeVersion `3.4`.

**Sticky note context (applies to nodes in this area):**
- **“Scheduled Claims Data Ingestion”**: Automated retrieval to prevent backlogs.

---

### Block 2 — Claims retrieval

**Overview:**  
Fetches the latest claims dataset from the configured claims API endpoint.

**Nodes involved:**
- Fetch New Claims Data

#### Node: Fetch New Claims Data
- **Type / role:** `HTTP Request` — retrieves claims data.
- **Key configuration choices:**
  - `url` is dynamically set to `claimsApiUrl` from Workflow Configuration.
  - Sends header `Content-Type: application/json`.
  - `sendHeaders: true`.
- **Connections:** Input from **Workflow Configuration**; output to **Actuarial Analysis Agent**.
- **Edge cases / failures:**
  - 401/403 authentication failure (no auth configured in node; if required, must be added).
  - Non-JSON response or unexpected schema → downstream AI prompt will stringify whatever arrives; later structured parsing may fail.
  - Timeouts / rate limits on claims API.
- **Version notes:** typeVersion `4.3`.

**Sticky note context:**
- “Setup Steps” note references configuring claims database API credentials here.

---

### Block 3 — AI actuarial analysis (assumptions extraction)

**Overview:**  
An AI agent analyzes claims data, computes actuarial metrics using a calculator tool, and outputs a strictly structured assumptions object.

**Nodes involved:**
- Actuarial Analysis Agent
- OpenAI Model - Analysis
- Calculator Tool
- Structured Output - Actuarial Assumptions

#### Node: Actuarial Analysis Agent
- **Type / role:** `LangChain Agent` — coordinates model + tools + output parser to produce structured assumptions.
- **Key configuration choices:**
  - Prompt: `Analyze the following claims data... {{ JSON.stringify($json) }}`
  - System message instructs:
    - compute loss ratio / frequency / severity / reserves
    - **use Calculator tool for all mathematical computations**
    - return JSON that matches the output parser schema
  - `promptType: define`
  - `hasOutputParser: true`
- **Tools/model/parsers connected:**
  - Receives LLM from **OpenAI Model - Analysis**
  - Receives tool from **Calculator Tool**
  - Receives output parser from **Structured Output - Actuarial Assumptions**
- **Connections:** Input from **Fetch New Claims Data**; output to **Calculate Premium Adjustments**.
- **Edge cases / failures:**
  - Output parser failure if the model returns non-conforming JSON or missing required numeric fields.
  - If claims data is huge, prompt size may exceed model limits.
  - Calculator tool misuse (agent doesn’t call it) can reduce numeric accuracy; parser may still accept numbers but they could be unreliable.
- **Version notes:** typeVersion `3.1`.

#### Node: OpenAI Model - Analysis
- **Type / role:** `OpenAI Chat Model` for the actuarial agent.
- **Key configuration:** `gpt-4.1-mini`.
- **Credentials:** `OpenAi account` (OpenAI API).
- **Connections:** Provides `ai_languageModel` to **Actuarial Analysis Agent**.
- **Edge cases / failures:** invalid API key, quota exhaustion, model unavailable.
- **Version notes:** typeVersion `1.3`.

#### Node: Calculator Tool
- **Type / role:** LangChain calculator tool available to the agent.
- **Key configuration:** default (no parameters).
- **Connections:** Provides `ai_tool` to **Actuarial Analysis Agent**.
- **Edge cases:** none typical, but agent may produce invalid expressions or not call tool.
- **Version notes:** typeVersion `1`.

#### Node: Structured Output - Actuarial Assumptions
- **Type / role:** `Structured Output Parser` — validates/enforces schema.
- **Schema (manual):**
  - Required: `lossRatio`, `claimFrequency`, `averageClaimSeverity`, `reserveAdequacy` (numbers)
  - Optional: `trendAnalysis` (string), `recommendedActions` (array of strings)
- **Connections:** Provides `ai_outputParser` to **Actuarial Analysis Agent**.
- **Edge cases:** strict schema mismatch → agent execution fails at parsing stage.
- **Version notes:** typeVersion `1.3`.

**Sticky note context:**
- “Actuarial Analysis Execution”: explains why modeling/metrics are computed here.

---

### Block 4 — Premium adjustment computation (deterministic rules)

**Overview:**  
Transforms actuarial assumptions into a premium adjustment recommendation using deterministic business logic and applies a “no-change” threshold.

**Nodes involved:**
- Calculate Premium Adjustments

#### Node: Calculate Premium Adjustments
- **Type / role:** `Code` — applies premium adjustment rules and prepares data for reporting.
- **Key logic (interpreted):**
  - Reads:
    - `assumptions = $input.first().json` (expects AI assumptions object)
    - `threshold = $('Workflow Configuration').first().json.premiumThreshold`
  - Computes `premiumAdjustment`:
    - If `lossRatio > 0.75`: increase by `(lossRatio - 0.75) * 0.5`
    - Else if `lossRatio < 0.60`: decrease by `(lossRatio - 0.60) * 0.3` (negative)
    - Else: 0
  - Applies threshold: if `abs(premiumAdjustment) < threshold` then set to 0
  - Outputs:
    - original assumptions +
    - `premiumAdjustmentPercentage` rounded to 2 decimals (percentage points, not fraction)
    - `adjustmentReason`
    - `effectiveDate` (YYYY-MM-DD)
    - `timestamp` (ISO)
- **Important technical note (n8n Code node output shape):**
  - The code returns an **object**, but n8n Code nodes typically should `return [{ json: adjustmentData }]`.
  - As written (`return adjustmentData;`), this may cause runtime issues or an unexpected output format depending on n8n version/settings.
- **Connections:** Input from **Actuarial Analysis Agent**; output to **Orchestrator Agent**.
- **Edge cases / failures:**
  - Missing `lossRatio` → comparison operations break or become `false` leading to 0 adjustment.
  - Non-numeric values from AI → NaN calculations; rounding produces NaN.
  - Threshold mis-specified (e.g., 5 instead of 0.05) suppresses all adjustments.
- **Version notes:** typeVersion `2`.

---

### Block 5 — AI orchestration: memo + risk assessment + final report

**Overview:**  
An orchestrator agent delegates two parallel specialist tasks (memo writing and risk assessment) and combines them into a final structured report.

**Nodes involved:**
- Orchestrator Agent
- OpenAI Model - Orchestrator
- Structured Output - Final Report
- Memo Writer Agent Tool
- OpenAI Model - Memo Writer
- Structured Output - Memo
- Risk Assessment Agent Tool
- OpenAI Model - Risk Assessment
- Structured Output - Risk Assessment

#### Node: Orchestrator Agent
- **Type / role:** `LangChain Agent` — calls tools and returns a final report.
- **Key configuration:**
  - Prompt includes premium adjustment data: `{{ JSON.stringify($json) }}`
  - System message instructs:
    1) call Memo Writer tool  
    2) call Risk Assessor tool  
    3) combine outputs  
    4) return final report in structured JSON
  - `hasOutputParser: true`
- **Tools connected:**
  - **Memo Writer Agent Tool**
  - **Risk Assessment Agent Tool**
- **Parser/model connected:**
  - Model: **OpenAI Model - Orchestrator**
  - Output parser: **Structured Output - Final Report**
- **Connections:** Input from **Calculate Premium Adjustments**; output to **Send Email** and **Send Slack** (in parallel).
- **Edge cases / failures:**
  - Tool invocation failure if tool prompts rely on `$fromAI()` variables that are not provided.
  - Output parser failure if final JSON misses required fields.
- **Version notes:** typeVersion `3.1`.

#### Node: OpenAI Model - Orchestrator
- **Type / role:** OpenAI chat model for orchestrator.
- **Key configuration:** `gpt-4.1-mini`.
- **Credentials:** OpenAI API credential.
- **Connections:** Provides `ai_languageModel` to **Orchestrator Agent**.
- **Edge cases:** quota/model errors.
- **Version notes:** typeVersion `1.3`.

#### Node: Structured Output - Final Report
- **Type / role:** Structured output parser for the orchestrator’s final response.
- **Schema (manual):**
  - Required: `reportDate` (string), `premiumAdjustment` (number), `actuarialMemo` (object), `riskAssessment` (object)
  - Optional: `actionItems` (array of strings), `approvalRequired` (boolean)
- **Connections:** Provides `ai_outputParser` to **Orchestrator Agent**.
- **Edge cases:** orchestrator might output `premiumAdjustmentPercentage` but schema requires `premiumAdjustment` (naming mismatch risk unless orchestrator maps it).
- **Version notes:** typeVersion `1.3`.

#### Node: Memo Writer Agent Tool
- **Type / role:** `Agent Tool` — callable tool that generates an actuarial memo.
- **Key configuration:**
  - Tool text: `Generate an actuarial memo for: {{ $fromAI("context") }}`
  - System message: memo with executive summary/methodology/findings/recommendations, structured JSON.
  - Has output parser: yes.
  - Tool description provided.
- **Model/parser connected:**
  - Model: **OpenAI Model - Memo Writer**
  - Output parser: **Structured Output - Memo**
- **Connections:** Provides `ai_tool` to **Orchestrator Agent** (i.e., orchestrator calls this tool).
- **Edge cases / failures:**
  - `$fromAI("context")` must be supplied by orchestrator; if orchestrator does not pass a `context` argument, the tool prompt may be empty/undefined.
- **Version notes:** typeVersion `3`.

#### Node: OpenAI Model - Memo Writer
- **Type / role:** OpenAI chat model for memo tool.
- **Key configuration:** `gpt-4.1-mini`.
- **Credentials:** OpenAI API credential.
- **Connections:** Provides `ai_languageModel` to **Memo Writer Agent Tool**.
- **Version notes:** typeVersion `1.3`.

#### Node: Structured Output - Memo
- **Type / role:** Structured output parser for memo.
- **Schema (manual):**
  - Required: `title`, `executiveSummary`, `findings`, `recommendations` (array)
  - Optional: `methodology`, `conclusion`
- **Connections:** Provides `ai_outputParser` to **Memo Writer Agent Tool**.
- **Version notes:** typeVersion `1.3`.

#### Node: Risk Assessment Agent Tool
- **Type / role:** `Agent Tool` — callable tool that evaluates risk implications.
- **Key configuration:**
  - Tool text: `Assess risk implications for: {{ $fromAI("adjustmentData") }}`
  - System message: assess profitability, competitiveness, regulatory compliance, retention; provide mitigations; return structured JSON.
  - Has output parser: yes.
- **Model/parser connected:**
  - Model: **OpenAI Model - Risk Assessment**
  - Output parser: **Structured Output - Risk Assessment**
- **Connections:** Provides `ai_tool` to **Orchestrator Agent**.
- **Edge cases / failures:**
  - `$fromAI("adjustmentData")` must be passed by orchestrator; if missing, tool may respond generically and fail schema expectations downstream.
- **Version notes:** typeVersion `3`.

#### Node: OpenAI Model - Risk Assessment
- **Type / role:** OpenAI chat model for risk tool.
- **Key configuration:** `gpt-4.1-mini`.
- **Credentials:** OpenAI API credential.
- **Connections:** Provides `ai_languageModel` to **Risk Assessment Agent Tool**.
- **Version notes:** typeVersion `1.3`.

#### Node: Structured Output - Risk Assessment
- **Type / role:** Structured output parser for risk tool.
- **Key configuration:** **Empty parameters in JSON** (no manual schema provided).
  - This likely means either:
    - it relies on defaults, or
    - it is incomplete and should define a schema like the other parsers.
- **Connections:** Provides `ai_outputParser` to **Risk Assessment Agent Tool**.
- **Edge cases / failures:**
  - Without a schema, validation may be weak or node may error depending on n8n node behavior/version.
  - Downstream Gmail/Slack templates expect fields like `overallRiskLevel`, `profitabilityImpact`, `competitivenessImpact`—these are not guaranteed unless enforced.
- **Version notes:** typeVersion `1.3`.

**Sticky note context:**
- “Claim Memo Generation”: rationale and compliance standardization.
- “Multi-Dimensional Risk Assessment & Email”: emphasizes comprehensive risk evaluation and comms.

---

### Block 6 — Distribution (Gmail + Slack)

**Overview:**  
Sends the final report to the product team via email and notifies the risk team via Slack message.

**Nodes involved:**
- Send Email to Product Team
- Send Slack Message to Risk Team

#### Node: Send Email to Product Team
- **Type / role:** `Gmail` — outbound email with HTML body.
- **Key configuration:**
  - `sendTo`: from Workflow Configuration `productTeamEmail`
  - `subject`: `Actuarial Update: Premium Adjustment Report - {{ $json.reportDate }}`
  - `message`: HTML summarizing report fields; loops action items:
    - `{{ $json.actionItems.map(item => `<li>${item}</li>`).join("") }}`
- **Credentials:** Gmail OAuth2.
- **Connections:** Input from **Orchestrator Agent**.
- **Edge cases / failures:**
  - Missing fields (`actionItems`, `riskAssessment.overallRiskLevel`, etc.) → expression errors or blank content.
  - Gmail OAuth token expiration / insufficient scopes.
- **Version notes:** typeVersion `2.2`.

#### Node: Send Slack Message to Risk Team
- **Type / role:** `Slack` — posts message to a channel.
- **Key configuration:**
  - Authentication: OAuth2
  - Channel ID: from Workflow Configuration `riskTeamSlackChannel`
  - Message interpolates:
    - `reportDate`, `premiumAdjustment`, `riskAssessment.overallRiskLevel`
    - `riskAssessment.profitabilityImpact`, `riskAssessment.competitivenessImpact`
    - `approvalRequired` conditional text
- **Credentials:** Slack OAuth2.
- **Connections:** Input from **Orchestrator Agent**.
- **Edge cases / failures:**
  - Channel ID invalid / bot not in channel.
  - Missing `competitivenessImpact` etc. → blank or expression issues.
- **Version notes:** typeVersion `2.4`.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Schedule Trigger - Ingest Claims Data | Schedule Trigger | Periodic workflow start (every 15 min) | — | Workflow Configuration | ## Scheduled Claims Data Ingestion<br>**Why:** Automated retrieval ensures timely processing of new claims without manual data entry, maintaining consistent workflow cadence and preventing backlogs. |
| Workflow Configuration | Set | Define endpoint, thresholds, recipients | Schedule Trigger - Ingest Claims Data | Fetch New Claims Data | ## Scheduled Claims Data Ingestion<br>**Why:** Automated retrieval ensures timely processing of new claims without manual data entry, maintaining consistent workflow cadence and preventing backlogs. |
| Fetch New Claims Data | HTTP Request | Pull claims data from claims API | Workflow Configuration | Actuarial Analysis Agent | ## Setup Steps<br>1. Configure claims database API credentials in "Fetch New Claims Data" node<br>2. Input NVIDIA API key for all OpenAI Model nodes<br>3. Add OpenAI API key in Orchestrator Agent configuration<br>4. Set up Calculator Tool parameters for premium adjustment calculations<br>5. Configure Gmail credentials and recipient addresses for product team<br>6. Connect Slack workspace and specify risk team channel for alerts |
| Actuarial Analysis Agent | LangChain Agent | Analyze claims, compute actuarial assumptions (structured) | Fetch New Claims Data | Calculate Premium Adjustments | ## Actuarial Analysis Execution<br>**Why:** Statistical modeling identifies patterns and calculates risk metrics that inform pricing accuracy and reserve adequacy beyond human capacity at scale. |
| OpenAI Model - Analysis | OpenAI Chat Model | LLM for actuarial analysis agent | — | Actuarial Analysis Agent | ## Actuarial Analysis Execution<br>**Why:** Statistical modeling identifies patterns and calculates risk metrics that inform pricing accuracy and reserve adequacy beyond human capacity at scale. |
| Calculator Tool | LangChain Tool (Calculator) | Tool for agent math computations | — | Actuarial Analysis Agent | ## Actuarial Analysis Execution<br>**Why:** Statistical modeling identifies patterns and calculates risk metrics that inform pricing accuracy and reserve adequacy beyond human capacity at scale. |
| Structured Output - Actuarial Assumptions | Structured Output Parser | Enforce assumptions JSON schema | — | Actuarial Analysis Agent | ## Actuarial Analysis Execution<br>**Why:** Statistical modeling identifies patterns and calculates risk metrics that inform pricing accuracy and reserve adequacy beyond human capacity at scale. |
| Calculate Premium Adjustments | Code | Compute premium adjustment and metadata | Actuarial Analysis Agent | Orchestrator Agent | ## Claim Memo Generation<br>**Why:** Standardized documentation ensures regulatory compliance and consistent decision-making while eliminating time-consuming manual report writing. |
| Orchestrator Agent | LangChain Agent | Calls memo + risk tools; produces final report | Calculate Premium Adjustments | Send Email to Product Team; Send Slack Message to Risk Team | ## Claim Memo Generation<br>**Why:** Standardized documentation ensures regulatory compliance and consistent decision-making while eliminating time-consuming manual report writing. |
| OpenAI Model - Orchestrator | OpenAI Chat Model | LLM for orchestration | — | Orchestrator Agent | ## Claim Memo Generation<br>**Why:** Standardized documentation ensures regulatory compliance and consistent decision-making while eliminating time-consuming manual report writing. |
| Structured Output - Final Report | Structured Output Parser | Enforce final report JSON schema | — | Orchestrator Agent | ## Multi-Dimensional Risk Assessment & Email<br>**Why:** Parallel evaluation of fraud indicators, policy compliance, and financial exposure provides comprehensive risk profiles for informed adjudication. |
| Memo Writer Agent Tool | Agent Tool | Generates structured actuarial memo | — | Orchestrator Agent | ## Claim Memo Generation<br>**Why:** Standardized documentation ensures regulatory compliance and consistent decision-making while eliminating time-consuming manual report writing. |
| OpenAI Model - Memo Writer | OpenAI Chat Model | LLM for memo tool | — | Memo Writer Agent Tool | ## Claim Memo Generation<br>**Why:** Standardized documentation ensures regulatory compliance and consistent decision-making while eliminating time-consuming manual report writing. |
| Structured Output - Memo | Structured Output Parser | Enforce memo JSON schema | — | Memo Writer Agent Tool | ## Claim Memo Generation<br>**Why:** Standardized documentation ensures regulatory compliance and consistent decision-making while eliminating time-consuming manual report writing. |
| Risk Assessment Agent Tool | Agent Tool | Generates structured risk assessment | — | Orchestrator Agent | ## Multi-Dimensional Risk Assessment & Email<br>**Why:** Parallel evaluation of fraud indicators, policy compliance, and financial exposure provides comprehensive risk profiles for informed adjudication. |
| OpenAI Model - Risk Assessment | OpenAI Chat Model | LLM for risk tool | — | Risk Assessment Agent Tool | ## Multi-Dimensional Risk Assessment & Email<br>**Why:** Parallel evaluation of fraud indicators, policy compliance, and financial exposure provides comprehensive risk profiles for informed adjudication. |
| Structured Output - Risk Assessment | Structured Output Parser | (Schema not defined) parse/validate risk output | — | Risk Assessment Agent Tool | ## Multi-Dimensional Risk Assessment & Email<br>**Why:** Parallel evaluation of fraud indicators, policy compliance, and financial exposure provides comprehensive risk profiles for informed adjudication. |
| Send Email to Product Team | Gmail | Email final report to product team | Orchestrator Agent | — | ## Multi-Dimensional Risk Assessment & Email<br>**Why:** Parallel evaluation of fraud indicators, policy compliance, and financial exposure provides comprehensive risk profiles for informed adjudication. |
| Send Slack Message to Risk Team | Slack | Post alert to risk Slack channel | Orchestrator Agent | — | ## Multi-Dimensional Risk Assessment & Email<br>**Why:** Parallel evaluation of fraud indicators, policy compliance, and financial exposure provides comprehensive risk profiles for informed adjudication. |
| Sticky Note | Sticky Note | Commentary | — | — | ## Prerequisites<br>NVIDIA API access, OpenAI API key, claims management system API<br>## Use Cases<br>Auto insurance claim triage, property damage assessment automation<br>## Customization<br>Adjust risk scoring thresholds, add industry-specific analysis criteria<br>## Benefits<br>Reduces claim processing time by 85%, ensures consistent evaluation standards |
| Sticky Note1 | Sticky Note | Commentary | — | — | ## Setup Steps<br>1. Configure claims database API credentials in "Fetch New Claims Data" node<br>2. Input NVIDIA API key for all OpenAI Model nodes<br>3. Add OpenAI API key in Orchestrator Agent configuration<br>4. Set up Calculator Tool parameters for premium adjustment calculations<br>5. Configure Gmail credentials and recipient addresses for product team<br>6. Connect Slack workspace and specify risk team channel for alerts |
| Sticky Note2 | Sticky Note | Commentary | — | — | ## How It Works<br>This workflow automates insurance claims processing by deploying specialized AI agents to analyze actuarial data, draft claim memos, and perform risk assessments. Designed for insurance adjusters, underwriters, and claims managers handling high claim volumes, it solves the bottleneck of manual claim review that delays settlements and increases operational costs. The system ingests new claims data via scheduled triggers, then routes information to an actuarial analysis agent that calculates loss ratios and risk scores. A memo writer agent generates detailed claim summaries with recommendations, while a risk assessment agent evaluates fraud indicators and coverage implications. An orchestrator agent coordinates these specialists, ensuring consistent analysis standards. Final reports are automatically distributed via email to product teams and Slack notifications to risk management, creating transparent workflows while reducing claim processing time from days to hours with standardized, comprehensive evaluations. |
| Sticky Note3 | Sticky Note | Commentary | — | — | ## Actuarial Analysis Execution<br>**Why:** Statistical modeling identifies patterns and calculates risk metrics that inform pricing accuracy and reserve adequacy beyond human capacity at scale. |
| Sticky Note4 | Sticky Note | Commentary | — | — | ## Scheduled Claims Data Ingestion<br>**Why:** Automated retrieval ensures timely processing of new claims without manual data entry, maintaining consistent workflow cadence and preventing backlogs. |
| Sticky Note5 | Sticky Note | Commentary | — | — | ## Claim Memo Generation<br>**Why:** Standardized documentation ensures regulatory compliance and consistent decision-making while eliminating time-consuming manual report writing. |
| Sticky Note6 | Sticky Note | Commentary | — | — | ## Multi-Dimensional Risk Assessment & Email<br>**Why:** Parallel evaluation of fraud indicators, policy compliance, and financial exposure provides comprehensive risk profiles for informed adjudication. |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in n8n.
2. **Add Schedule Trigger**
   - Node type: *Schedule Trigger*
   - Set interval: every **15 minutes**
   - Name: `Schedule Trigger - Ingest Claims Data`

3. **Add a Set node for configuration**
   - Node type: *Set*
   - Name: `Workflow Configuration`
   - Enable **Include Other Fields**
   - Add fields:
     - `claimsApiUrl` (string): your claims endpoint URL
     - `premiumThreshold` (number): `0.05`
     - `productTeamEmail` (string): destination email
     - `riskTeamSlackChannel` (string): Slack channel ID
   - Connect: **Schedule Trigger → Workflow Configuration**

4. **Add HTTP Request to fetch claims**
   - Node type: *HTTP Request*
   - Name: `Fetch New Claims Data`
   - URL: expression `{{ $('Workflow Configuration').first().json.claimsApiUrl }}`
   - Headers: `Content-Type: application/json`
   - If your API requires auth, configure it here (API key/bearer/OAuth2).
   - Connect: **Workflow Configuration → Fetch New Claims Data**

5. **Add LangChain “OpenAI Chat Model” for analysis**
   - Node type: *OpenAI Chat Model* (LangChain)
   - Name: `OpenAI Model - Analysis`
   - Model: `gpt-4.1-mini`
   - Credentials: configure **OpenAI API** credential in n8n.

6. **Add Calculator tool**
   - Node type: *Calculator Tool* (LangChain)
   - Name: `Calculator Tool`

7. **Add Structured Output Parser for assumptions**
   - Node type: *Structured Output Parser* (LangChain)
   - Name: `Structured Output - Actuarial Assumptions`
   - Schema (manual): include numeric required fields:
     - `lossRatio`, `claimFrequency`, `averageClaimSeverity`, `reserveAdequacy`
     - Optional: `trendAnalysis`, `recommendedActions[]`

8. **Add Actuarial Analysis Agent**
   - Node type: *Agent* (LangChain)
   - Name: `Actuarial Analysis Agent`
   - Prompt: include claims JSON via `{{ JSON.stringify($json) }}`
   - System message: instruct to compute metrics and **use Calculator tool**
   - Connect model/tool/parser into the agent:
     - **OpenAI Model - Analysis → Actuarial Analysis Agent** (AI Language Model connection)
     - **Calculator Tool → Actuarial Analysis Agent** (AI Tool connection)
     - **Structured Output - Actuarial Assumptions → Actuarial Analysis Agent** (AI Output Parser connection)
   - Connect main flow: **Fetch New Claims Data → Actuarial Analysis Agent**

9. **Add Code node for premium adjustment**
   - Node type: *Code*
   - Name: `Calculate Premium Adjustments`
   - Implement the loss-ratio-based adjustment logic and thresholding.
   - Recommended n8n-safe return format:
     - `return [{ json: adjustmentData }];`
   - Connect: **Actuarial Analysis Agent → Calculate Premium Adjustments**

10. **Add OpenAI Chat Model for orchestrator**
    - Node type: *OpenAI Chat Model* (LangChain)
    - Name: `OpenAI Model - Orchestrator`
    - Model: `gpt-4.1-mini`
    - Use same OpenAI credentials.

11. **Add Memo Writer tool chain**
    - Add *OpenAI Chat Model* named `OpenAI Model - Memo Writer` (gpt-4.1-mini)
    - Add *Structured Output Parser* named `Structured Output - Memo` with schema requiring:
      - `title`, `executiveSummary`, `findings`, `recommendations[]` (+ optional `methodology`, `conclusion`)
    - Add *Agent Tool* named `Memo Writer Agent Tool`
      - Tool prompt should accept an input variable (ensure orchestrator passes it), and generate memo JSON.
      - Connect:
        - `OpenAI Model - Memo Writer` → `Memo Writer Agent Tool` (AI Language Model)
        - `Structured Output - Memo` → `Memo Writer Agent Tool` (AI Output Parser)

12. **Add Risk Assessment tool chain**
    - Add *OpenAI Chat Model* named `OpenAI Model - Risk Assessment` (gpt-4.1-mini)
    - Add *Structured Output Parser* named `Structured Output - Risk Assessment`
      - Define a schema that matches what downstream needs (recommended fields):
        - `overallRiskLevel`, `profitabilityImpact`, `competitivenessImpact`, `regulatoryComplianceImpact`, `customerRetentionImpact`, `mitigationStrategies[]`
    - Add *Agent Tool* named `Risk Assessment Agent Tool`
      - Connect:
        - `OpenAI Model - Risk Assessment` → tool (AI Language Model)
        - `Structured Output - Risk Assessment` → tool (AI Output Parser)

13. **Add Structured Output Parser for final report**
    - Node type: *Structured Output Parser*
    - Name: `Structured Output - Final Report`
    - Schema requires:
      - `reportDate` (string)
      - `premiumAdjustment` (number)
      - `actuarialMemo` (object)
      - `riskAssessment` (object)
      - Optional: `actionItems[]`, `approvalRequired` (boolean)

14. **Add Orchestrator Agent**
    - Node type: *Agent* (LangChain)
    - Name: `Orchestrator Agent`
    - Prompt: `Coordinate the generation ... {{ JSON.stringify($json) }}`
    - Connect:
      - `OpenAI Model - Orchestrator` → `Orchestrator Agent` (AI Language Model)
      - `Memo Writer Agent Tool` → `Orchestrator Agent` (AI Tool)
      - `Risk Assessment Agent Tool` → `Orchestrator Agent` (AI Tool)
      - `Structured Output - Final Report` → `Orchestrator Agent` (AI Output Parser)
    - Connect main: **Calculate Premium Adjustments → Orchestrator Agent**

15. **Add Gmail node**
    - Node type: *Gmail*
    - Name: `Send Email to Product Team`
    - Credentials: Gmail OAuth2 (grant send scope)
    - To: `{{ $('Workflow Configuration').first().json.productTeamEmail }}`
    - Subject/body: reference `reportDate`, `premiumAdjustment`, memo and risk fields.
    - Connect: **Orchestrator Agent → Send Email to Product Team**

16. **Add Slack node**
    - Node type: *Slack*
    - Name: `Send Slack Message to Risk Team`
    - Credentials: Slack OAuth2 (bot must be allowed to post)
    - Channel: `{{ $('Workflow Configuration').first().json.riskTeamSlackChannel }}`
    - Text: reference final report fields.
    - Connect: **Orchestrator Agent → Send Slack Message to Risk Team**

17. **Test with sample claims payload**
    - Verify the assumptions parser passes.
    - Verify Code node output format is correct.
    - Verify final report includes fields required by Gmail/Slack templates.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| Prerequisites: NVIDIA API access, OpenAI API key, claims management system API | From sticky note “Prerequisites” (note: workflow nodes actually use OpenAI + Gmail + Slack; NVIDIA is mentioned but not configured in nodes). |
| Use Cases: Auto insurance claim triage, property damage assessment automation | Sticky note “Use Cases” |
| Customization: Adjust risk scoring thresholds, add industry-specific analysis criteria | Sticky note “Customization” |
| Benefits: Reduces claim processing time by 85%, ensures consistent evaluation standards | Sticky note “Benefits” |
| Setup steps list (claims API creds, OpenAI keys, Gmail + Slack configuration) | Sticky note “Setup Steps” |
| High-level “How It Works” narrative | Sticky note “How It Works” |
| Disclaimer (FR): Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n… | Provided in developer instruction context (applies to the overall document). |