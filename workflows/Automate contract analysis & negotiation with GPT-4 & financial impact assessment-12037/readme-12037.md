Automate contract analysis & negotiation with GPT-4 & financial impact assessment

https://n8nworkflows.xyz/workflows/automate-contract-analysis---negotiation-with-gpt-4---financial-impact-assessment-12037


# Automate contract analysis & negotiation with GPT-4 & financial impact assessment

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Workflow name:** *Intelligent Contract Lifecycle & Vendor Optimization System*  
**User-provided title:** *Automate contract analysis & negotiation with GPT-4 & financial impact assessment*

**Purpose:**  
This workflow runs on a daily schedule to pull active vendor contracts from a contract system, analyze them with an LLM for risks/opportunities (expiring soon, pricing anomalies, renewal risks), route problematic contracts to a negotiation strategy agent, then compute financial impact (CAPEX/OPEX, ROI, payback) and finally update a financial planning system.

**Target use cases:**
- Legal/procurement teams monitoring a portfolio of vendor contracts
- Automated detection of expiring contracts and price hikes vs market/previous terms
- AI-assisted negotiation preparation and executive-ready financial impact summaries
- Updating budget plans based on negotiated recommendations

### 1.1 Daily Trigger & Configuration
Runs every day and sets reusable parameters (API endpoints, thresholds).

### 1.2 Contract Retrieval
Fetches active contracts from the contract management system.

### 1.3 AI Contract Risk Analysis (GPT)
Analyzes contract data with a contract-specialist agent and enforces structured JSON output via a schema parser.

### 1.4 Issue Routing
If issues are detected, route to negotiation; otherwise log “no issues”.

### 1.5 AI Negotiation Strategy (GPT)
Generates negotiation strategy, leverage factors, alternatives, savings estimates, and a draft vendor message (structured output).

### 1.6 AI Financial Impact Assessment (GPT) + Budget Update
Turns negotiation recommendation into financial projections and pushes results to the financial planning system (CAPEX/OPEX update).

---

## 2. Block-by-Block Analysis

### Block 1 — Daily Trigger & Workflow Configuration

**Overview:**  
Starts the workflow daily and establishes configuration variables (API URLs and thresholds) used by later nodes via expressions.

**Nodes involved:**
- Daily Contract Monitor
- Workflow Configuration

#### Node: Daily Contract Monitor
- **Type / role:** `Schedule Trigger` — time-based entry point.
- **Configuration (interpreted):** Triggers daily at **06:00** (server timezone).
- **Connections:**
  - **Output →** Workflow Configuration
- **Edge cases / failures:**
  - Timezone mismatch vs business expectation (n8n instance timezone vs local).
  - If n8n is down at trigger time, depending on n8n setup, the run may be missed.

#### Node: Workflow Configuration
- **Type / role:** `Set` — creates/overrides configuration fields.
- **Configuration (interpreted):**
  - `contractApiUrl` = placeholder for Contract Management System API base URL
  - `financialSystemApiUrl` = placeholder for Financial Planning System API base URL
  - `expirationThresholdDays` = **90**
  - `pricingAnomalyThreshold` = **15** (percent)
  - “Include other fields” enabled (keeps incoming fields; though trigger provides minimal data).
- **Key expressions/variables used downstream:**
  - Referenced as: `$('Workflow Configuration').first().json.<field>`
- **Connections:**
  - **Input ←** Daily Contract Monitor
  - **Output →** Fetch Contract Data
- **Edge cases / failures:**
  - Placeholder URLs not replaced → HTTP nodes will fail or hit invalid endpoints.
  - If multiple items ever reach this node, `.first()` may not reflect desired item (here it’s safe due to schedule trigger producing one item).

---

### Block 2 — Fetch & Monitor Contracts

**Overview:**  
Calls the contract system API to retrieve **active** contracts for analysis.

**Nodes involved:**
- Fetch Contract Data

#### Node: Fetch Contract Data
- **Type / role:** `HTTP Request` — retrieves contract data from external system.
- **Configuration (interpreted):**
  - **URL:** `{{ $('Workflow Configuration').first().json.contractApiUrl }}/contracts`
  - **Query param:** `status=active`
  - **Authentication:** predefined credential type (exact credential not shown in JSON; must be configured in n8n)
  - Sends query string enabled.
- **Connections:**
  - **Input ←** Workflow Configuration
  - **Output →** Contract Analysis Agent
- **Edge cases / failures:**
  - Auth failure (401/403) if credentials missing/expired.
  - Wrong base URL, missing scheme (`https://`), trailing slash issues.
  - Response shape mismatch: if API returns an array vs object, downstream agent will receive whatever n8n emits (commonly one item with body, or multiple items if “Split into Items” is used—**not configured here**).
  - Large payloads may exceed model/context limits when stringified later.

---

### Block 3 — Analyze Contract Terms (AI legal/risk analysis)

**Overview:**  
Uses GPT model via LangChain Agent to detect expiring contracts, pricing anomalies, and renewal risks; enforces a strict structured output schema.

**Nodes involved:**
- Contract Analysis Agent
- OpenAI Chat Model
- Contract Analysis Output Parser

#### Node: OpenAI Chat Model
- **Type / role:** `lmChatOpenAi` — provides the chat model to the agent.
- **Configuration (interpreted):**
  - Model: **gpt-4.1-mini**
  - Credentials: `openAiApi Credential`
- **Connections:**
  - Connected to **Contract Analysis Agent** via the `ai_languageModel` channel.
- **Version-specific notes:**
  - Requires n8n’s LangChain nodes package (`@n8n/n8n-nodes-langchain`) and compatible node versions.
- **Edge cases / failures:**
  - OpenAI credential missing/invalid; quota/rate limiting.
  - Model availability changes in OpenAI account/region.

#### Node: Contract Analysis Output Parser
- **Type / role:** `outputParserStructured` — validates and parses LLM output into a typed JSON structure.
- **Configuration (interpreted):**
  - Manual JSON schema requiring an object with properties:
    - `contractId` (string), `vendorName` (string)
    - `issueDetected` (boolean)
    - `issueType` enum: `expiring | pricing_anomaly | renewal_risk`
    - `severity` enum: `critical | high | medium | low`
    - `expirationDate` (string)
    - `currentPrice` (number), `pricingChange` (number)
    - `recommendation` (string)
    - `requiresAction` (boolean)
- **Connections:**
  - Connected to **Contract Analysis Agent** via the `ai_outputParser` channel.
- **Edge cases / failures:**
  - If the model outputs non-JSON or violates enum/typing, parser can throw an error and stop execution.
  - Schema does not mark fields as “required”; the agent may omit fields—downstream logic relies mainly on `issueDetected`.

#### Node: Contract Analysis Agent
- **Type / role:** `LangChain Agent` — orchestrates prompt + model + output parser to produce structured analysis.
- **Configuration (interpreted):**
  - **Input text to analyze:**  
    `Contract data to analyze: {{ JSON.stringify($json) }}`
  - **System message (dynamic thresholds):**
    - Review expirations within `expirationThresholdDays` (90)
    - Detect price increases exceeding `pricingAnomalyThreshold`% (15)
    - Categorize issues by severity
    - Return in the structured format defined by the output parser
  - `promptType=define`, `hasOutputParser=true`
- **Key expressions:**
  - `{{ JSON.stringify($json) }}`
  - `{{ $('Workflow Configuration').first().json.expirationThresholdDays }}`
  - `{{ $('Workflow Configuration').first().json.pricingAnomalyThreshold }}`
- **Connections:**
  - **Input ←** Fetch Contract Data
  - **AI language model ←** OpenAI Chat Model
  - **AI output parser ←** Contract Analysis Output Parser
  - **Output →** Check for Issues
- **Edge cases / failures:**
  - If `Fetch Contract Data` returns a large list, stringifying entire dataset may exceed token limits; consider splitting per contract.
  - If contract data lacks fields (expiration date, pricing), agent may hallucinate unless instructed to mark unknowns.
  - `$json.contractId` may not exist at this stage depending on API response shape.

---

### Block 4 — Route Based on Detected Issues

**Overview:**  
Branches workflow: issue → negotiation; no issue → status log.

**Nodes involved:**
- Check for Issues
- No Issues - Log Status

#### Node: Check for Issues
- **Type / role:** `IF` — boolean routing gate.
- **Configuration (interpreted):**
  - Condition: `$json.issueDetected` **equals** `true`
  - Loose type validation enabled (tolerant of string/boolean mismatches)
- **Connections:**
  - **Input ←** Contract Analysis Agent
  - **True output →** Negotiation Agent
  - **False output →** No Issues - Log Status
- **Edge cases / failures:**
  - If `issueDetected` is missing/null, condition evaluates false → negotiation skipped unintentionally.
  - If parser failed but node still produced partial output (unlikely), routing may misbehave.

#### Node: No Issues - Log Status
- **Type / role:** `Set` — creates a log/status payload (does not persist externally in this workflow).
- **Configuration (interpreted):**
  - `status = "no_issues_detected"`
  - `message = "Contract analysis completed - no issues requiring action"`
  - `timestamp = {{ $now.toISO() }}`
  - `contractId = {{ $json.contractId }}`
- **Connections:**
  - **Input ←** Check for Issues (false branch)
  - **No downstream node** (ends branch)
- **Edge cases / failures:**
  - If `$json.contractId` is absent, `contractId` becomes null/empty; consider fallback mapping.
  - This “log” is only in execution data; if you need audit history, add a DB/Sheet/Slack/Email node.

---

### Block 5 — Negotiation Strategy Generation (AI)

**Overview:**  
For flagged contracts, generates negotiation approach (extend/replace/renegotiate), alternatives, leverage, estimated savings, and a draft communication.

**Nodes involved:**
- Negotiation Agent
- OpenAI Chat Model1
- Negotiation Output Parser

#### Node: OpenAI Chat Model1
- **Type / role:** `lmChatOpenAi` — model provider for negotiation agent.
- **Configuration (interpreted):**
  - Model: **gpt-4.1-mini**
  - Credentials: `openAiApi Credential`
- **Connections:**
  - **ai_languageModel →** Negotiation Agent
- **Edge cases / failures:** Same as other OpenAI model node (auth/quota/rate limit).

#### Node: Negotiation Output Parser
- **Type / role:** `outputParserStructured` — enforces structured negotiation plan output.
- **Configuration (interpreted):**
  - Schema properties include:
    - `contractId` (string)
    - `negotiationStrategy` enum: `extend | replace | renegotiate`
    - `marketRate` (number)
    - `competitiveAlternatives` (array of strings)
    - `leverageFactors` (array of strings)
    - `estimatedSavings` (number)
    - `riskLevel` (string)
    - `recommendedAction` (string)
    - `draftCommunication` (string)
    - `timeline` (string)
- **Connections:**
  - **ai_outputParser →** Negotiation Agent
- **Edge cases / failures:**
  - Enum mismatch for `negotiationStrategy` will fail parsing.
  - Numbers may be returned as strings by the model → parser may error depending on strictness.

#### Node: Negotiation Agent
- **Type / role:** `LangChain Agent` — creates structured negotiation recommendations.
- **Configuration (interpreted):**
  - Input text: `Contract requiring negotiation: {{ JSON.stringify($json) }}`
  - System message: negotiation specialist instructions (market rates, leverage, savings, draft outreach)
  - Has structured output parser enabled
- **Connections:**
  - **Input ←** Check for Issues (true branch)
  - **AI language model ←** OpenAI Chat Model1
  - **AI output parser ←** Negotiation Output Parser
  - **Output →** Financial Impact Agent
- **Edge cases / failures:**
  - If prior analysis output lacks commercial details (current price/terms), savings estimate may be speculative.
  - Market rate “research” is not actually connected to any external data source—LLM will infer unless you add tools/HTTP lookups.

---

### Block 6 — Financial Impact Assessment + CAPEX/OPEX Update

**Overview:**  
Converts negotiation output into financial metrics and pushes the results to a financial planning/budget system API endpoint.

**Nodes involved:**
- Financial Impact Agent
- OpenAI Chat Model2
- Financial Impact Output Parser
- Update CAPEX/OPEX Plans

#### Node: OpenAI Chat Model2
- **Type / role:** `lmChatOpenAi` — model provider for financial agent.
- **Configuration (interpreted):**
  - Model: **gpt-4.1-mini**
  - Credentials: `openAiApi Credential`
- **Connections:**
  - **ai_languageModel →** Financial Impact Agent
- **Edge cases / failures:** Same OpenAI considerations (quota, rate limits).

#### Node: Financial Impact Output Parser
- **Type / role:** `outputParserStructured` — validates financial analysis output.
- **Configuration (interpreted):**
  - Key fields:
    - `currentAnnualCost`, `projectedAnnualCost`, `netSavings`, `savingsPercentage`
    - `capexImpact`, `opexImpact`
    - `paybackPeriodMonths`, `roi`
    - `budgetAdjustments` object `{ quarter, amount, category }`
    - `riskAdjustedSavings`
    - `executiveSummary`
    - `recommendApproval` (boolean)
- **Connections:**
  - **ai_outputParser →** Financial Impact Agent
- **Edge cases / failures:**
  - Parser expects numeric types; LLM may output formatted currency strings.
  - `budgetAdjustments` is a single object, not an array; if multiple adjustments are needed, schema may be too limiting.

#### Node: Financial Impact Agent
- **Type / role:** `LangChain Agent` — produces structured CAPEX/OPEX and ROI analysis.
- **Configuration (interpreted):**
  - Input text: `Negotiation recommendation to analyze: {{ JSON.stringify($json) }}`
  - System message: financial analyst instructions (multi-year implications, CAPEX vs OPEX, payback, exec summary)
  - Structured output required
- **Connections:**
  - **Input ←** Negotiation Agent
  - **AI language model ←** OpenAI Chat Model2
  - **AI output parser ←** Financial Impact Output Parser
  - **Output →** Update CAPEX/OPEX Plans
- **Edge cases / failures:**
  - If negotiation output lacks baseline costs, financial metrics are guesswork.
  - CAPEX/OPEX classification may require internal accounting rules not encoded here.

#### Node: Update CAPEX/OPEX Plans
- **Type / role:** `HTTP Request` — pushes financial analysis into financial system.
- **Configuration (interpreted):**
  - **Method:** POST
  - **URL:** `{{ $('Workflow Configuration').first().json.financialSystemApiUrl }}/budget/update`
  - **Headers:** `Content-Type: application/json`
  - **Body:** JSON = entire current `$json` from Financial Impact Agent (structured financial payload)
  - **Authentication:** predefined credential type
- **Connections:**
  - **Input ←** Financial Impact Agent
  - **No downstream node** (ends workflow on this branch)
- **Edge cases / failures:**
  - Auth failure to financial system.
  - API contract mismatch: endpoint may expect different field names/structure than produced by the agent.
  - Idempotency: daily runs may repeatedly “update” the same budget item; consider including a unique run ID or using PUT/upsert.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Daily Contract Monitor | scheduleTrigger | Daily entry point at 06:00 | — | Workflow Configuration | ## Fetch & Monitor Contracts\nWhat: Retrieves contract data daily and tracks status across portfolio.\nWhy: Enables proactive monitoring and early identification of critical issues. |
| Workflow Configuration | set | Central config variables (URLs, thresholds) | Daily Contract Monitor | Fetch Contract Data | ## Fetch & Monitor Contracts\nWhat: Retrieves contract data daily and tracks status across portfolio.\nWhy: Enables proactive monitoring and early identification of critical issues. |
| Fetch Contract Data | httpRequest | Retrieve active contracts from contract system | Workflow Configuration | Contract Analysis Agent | ## Fetch & Monitor Contracts\nWhat: Retrieves contract data daily and tracks status across portfolio.\nWhy: Enables proactive monitoring and early identification of critical issues. |
| Contract Analysis Agent | @n8n/n8n-nodes-langchain.agent | GPT-based contract risk analysis | Fetch Contract Data; OpenAI Chat Model (AI); Contract Analysis Output Parser (AI) | Check for Issues | ## Analyze Contract Terms\nWhat: Uses GPT-4 to analyze clauses, identify risks, flag problematic terms.\nWhy: Surfaces legal risks and negotiation opportunities |
| OpenAI Chat Model | @n8n/n8n-nodes-langchain.lmChatOpenAi | LLM provider for contract analysis | — | Contract Analysis Agent (AI) | ## Analyze Contract Terms\nWhat: Uses GPT-4 to analyze clauses, identify risks, flag problematic terms.\nWhy: Surfaces legal risks and negotiation opportunities |
| Contract Analysis Output Parser | @n8n/n8n-nodes-langchain.outputParserStructured | Enforce structured JSON for contract analysis | — | Contract Analysis Agent (AI) | ## Analyze Contract Terms\nWhat: Uses GPT-4 to analyze clauses, identify risks, flag problematic terms.\nWhy: Surfaces legal risks and negotiation opportunities |
| Check for Issues | if | Route items with detected issues | Contract Analysis Agent | Negotiation Agent (true); No Issues - Log Status (false) | ## Route to Negotiation & Assess Financial Impact with Updating\nWhat: Forwards analysis to negotiation agent for strategic discussion.\nWhy: Enables intelligent, context-aware negotiation strategy based on legal analysis. |
| Negotiation Agent | @n8n/n8n-nodes-langchain.agent | Generate negotiation strategy & draft vendor message | Check for Issues (true); OpenAI Chat Model1 (AI); Negotiation Output Parser (AI) | Financial Impact Agent | ## Route to Negotiation & Assess Financial Impact with Updating\nWhat: Forwards analysis to negotiation agent for strategic discussion.\nWhy: Enables intelligent, context-aware negotiation strategy based on legal analysis. |
| OpenAI Chat Model1 | @n8n/n8n-nodes-langchain.lmChatOpenAi | LLM provider for negotiation | — | Negotiation Agent (AI) | ## Route to Negotiation & Assess Financial Impact with Updating\nWhat: Forwards analysis to negotiation agent for strategic discussion.\nWhy: Enables intelligent, context-aware negotiation strategy based on legal analysis. |
| Negotiation Output Parser | @n8n/n8n-nodes-langchain.outputParserStructured | Enforce structured JSON for negotiation plan | — | Negotiation Agent (AI) | ## Route to Negotiation & Assess Financial Impact with Updating\nWhat: Forwards analysis to negotiation agent for strategic discussion.\nWhy: Enables intelligent, context-aware negotiation strategy based on legal analysis. |
| Financial Impact Agent | @n8n/n8n-nodes-langchain.agent | Financial modeling (CAPEX/OPEX, ROI, payback) | Negotiation Agent; OpenAI Chat Model2 (AI); Financial Impact Output Parser (AI) | Update CAPEX/OPEX Plans | ## Route to Negotiation & Assess Financial Impact with Updating\nWhat: Forwards analysis to negotiation agent for strategic discussion.\nWhy: Enables intelligent, context-aware negotiation strategy based on legal analysis. |
| OpenAI Chat Model2 | @n8n/n8n-nodes-langchain.lmChatOpenAi | LLM provider for financial analysis | — | Financial Impact Agent (AI) | ## Route to Negotiation & Assess Financial Impact with Updating\nWhat: Forwards analysis to negotiation agent for strategic discussion.\nWhy: Enables intelligent, context-aware negotiation strategy based on legal analysis. |
| Financial Impact Output Parser | @n8n/n8n-nodes-langchain.outputParserStructured | Enforce structured JSON for financial outputs | — | Financial Impact Agent (AI) | ## Route to Negotiation & Assess Financial Impact with Updating\nWhat: Forwards analysis to negotiation agent for strategic discussion.\nWhy: Enables intelligent, context-aware negotiation strategy based on legal analysis. |
| Update CAPEX/OPEX Plans | httpRequest | Push budget updates to financial planning system | Financial Impact Agent | — | ## Route to Negotiation & Assess Financial Impact with Updating\nWhat: Forwards analysis to negotiation agent for strategic discussion.\nWhy: Enables intelligent, context-aware negotiation strategy based on legal analysis. |
| No Issues - Log Status | set | Create “no issues” status payload | Check for Issues (false) | — | ## Route to Negotiation & Assess Financial Impact with Updating\nWhat: Forwards analysis to negotiation agent for strategic discussion.\nWhy: Enables intelligent, context-aware negotiation strategy based on legal analysis. |
| Sticky Note | stickyNote | Documentation / prerequisites | — | — | ## Prerequisites\nContract management system or data source; OpenAI API key; negotiation agent access \n\n## Use Cases\nCorporate legal departments automating contract risk assessment across portfolios |
| Sticky Note1 | stickyNote | Documentation / setup steps | — | — | ## Setup Steps\n1. Configure contract data source and set up daily monitoring schedule.\n2. Connect OpenAI GPT-4 API  \n3. Set up negotiation agent credentials and financial modeling system connections.\n4. Define contract risk thresholds |
| Sticky Note2 | stickyNote | Documentation / how it works | — | — | ## How It Works\nThis workflow automates daily contract monitoring, analysis, and negotiation by retrieving contract data, applying AI-driven legal analysis, identifying potential issues and risks, coordinating multi-agent negotiation workflows, and updating strategic plans. It continuously monitors contracts, performs GPT-4–based contract analysis with detailed risk identification, and flags problematic clauses and unfavorable terms. The system routes identified items to a negotiation agent for structured strategic discussion, applies financial impact analysis to evaluate deal implications, determines negotiation outcomes, logs decisions and results, and updates CAPEX and OPEX planning systems accordingly. Designed for legal departments, procurement teams, corporate counsel, and contract management offices, it supports automated contract risk assessment, informed negotiations, and data-driven strategic planning. |
| Sticky Note3 | stickyNote | Documentation / customization & benefits | — | — | ## Customization\nAdjust contract analysis criteria and risk thresholds \n\n## Benefits\nEliminates manual contract review, identifies hidden risks automatically |
| Sticky Note4 | stickyNote | Documentation / block label | — | — | ## Fetch & Monitor Contracts\nWhat: Retrieves contract data daily and tracks status across portfolio.\nWhy: Enables proactive monitoring and early identification of critical issues. |
| Sticky Note5 | stickyNote | Documentation / block label | — | — | ## Route to Negotiation & Assess Financial Impact with Updating\nWhat: Forwards analysis to negotiation agent for strategic discussion.\nWhy: Enables intelligent, context-aware negotiation strategy based on legal analysis. |
| Sticky Note6 | stickyNote | Documentation / block label | — | — | ## Analyze Contract Terms\nWhat: Uses GPT-4 to analyze clauses, identify risks, flag problematic terms.\nWhy: Surfaces legal risks and negotiation opportunities |

---

## 4. Reproducing the Workflow from Scratch

1) **Create workflow**
   - Name it: *Intelligent Contract Lifecycle & Vendor Optimization System* (or your preferred name).

2) **Add Trigger: “Daily Contract Monitor”**
   - Node type: **Schedule Trigger**
   - Set schedule to **Daily at 06:00**.

3) **Add Set node: “Workflow Configuration”**
   - Node type: **Set**
   - Add fields:
     - `contractApiUrl` (string): your contract system base URL (e.g., `https://contracts.example.com/api`)
     - `financialSystemApiUrl` (string): your finance system base URL (e.g., `https://finance.example.com/api`)
     - `expirationThresholdDays` (number): `90`
     - `pricingAnomalyThreshold` (number): `15`
   - Enable **Include Other Fields**.
   - Connect: **Daily Contract Monitor → Workflow Configuration**

4) **Add HTTP node: “Fetch Contract Data”**
   - Node type: **HTTP Request**
   - Method: **GET**
   - URL: `={{ $('Workflow Configuration').first().json.contractApiUrl }}/contracts`
   - Query parameters: `status` = `active`
   - Authentication: choose the credential type your contract system requires (API key / OAuth2 / etc.) and select/create credentials in n8n.
   - Connect: **Workflow Configuration → Fetch Contract Data**

5) **Add LangChain Chat Model: “OpenAI Chat Model”**
   - Node type: **OpenAI Chat Model (LangChain)**
   - Model: `gpt-4.1-mini`
   - Credentials: create/select **OpenAI API** credential in n8n.

6) **Add Output Parser: “Contract Analysis Output Parser”**
   - Node type: **Structured Output Parser**
   - Schema: create a manual schema with the fields/enums shown in section 2 (contract analysis schema).

7) **Add Agent: “Contract Analysis Agent”**
   - Node type: **LangChain Agent**
   - Prompt type: **Define**
   - Text: `=Contract data to analyze: {{ JSON.stringify($json) }}`
   - System message: include expiration and pricing anomaly thresholds using expressions:
     - `{{ $('Workflow Configuration').first().json.expirationThresholdDays }}`
     - `{{ $('Workflow Configuration').first().json.pricingAnomalyThreshold }}`
   - Attach:
     - **Language Model** input: connect **OpenAI Chat Model → Contract Analysis Agent** (AI language model connection)
     - **Output Parser** input: connect **Contract Analysis Output Parser → Contract Analysis Agent** (AI output parser connection)
   - Connect: **Fetch Contract Data → Contract Analysis Agent**

8) **Add IF node: “Check for Issues”**
   - Node type: **IF**
   - Condition: boolean `={{ $json.issueDetected }}` equals `true`
   - Connect: **Contract Analysis Agent → Check for Issues**

9) **Add Set node: “No Issues - Log Status”**
   - Node type: **Set**
   - Fields:
     - `status` = `no_issues_detected`
     - `message` = `Contract analysis completed - no issues requiring action`
     - `timestamp` = `={{ $now.toISO() }}`
     - `contractId` = `={{ $json.contractId }}`
   - Connect: **Check for Issues (false) → No Issues - Log Status**

10) **Add negotiation LLM + parser + agent**
   - Add **OpenAI Chat Model1** (same config: `gpt-4.1-mini`, OpenAI credentials).
   - Add **Negotiation Output Parser** with schema from section 2.
   - Add **Negotiation Agent**:
     - Text: `=Contract requiring negotiation: {{ JSON.stringify($json) }}`
     - System message: negotiation instructions
     - Connect AI:
       - **OpenAI Chat Model1 → Negotiation Agent** (ai_languageModel)
       - **Negotiation Output Parser → Negotiation Agent** (ai_outputParser)
   - Connect: **Check for Issues (true) → Negotiation Agent**

11) **Add financial LLM + parser + agent**
   - Add **OpenAI Chat Model2** (same model/credentials).
   - Add **Financial Impact Output Parser** with schema from section 2.
   - Add **Financial Impact Agent**:
     - Text: `=Negotiation recommendation to analyze: {{ JSON.stringify($json) }}`
     - System message: financial analysis instructions
     - Connect AI:
       - **OpenAI Chat Model2 → Financial Impact Agent** (ai_languageModel)
       - **Financial Impact Output Parser → Financial Impact Agent** (ai_outputParser)
   - Connect: **Negotiation Agent → Financial Impact Agent**

12) **Add HTTP node: “Update CAPEX/OPEX Plans”**
   - Node type: **HTTP Request**
   - Method: **POST**
   - URL: `={{ $('Workflow Configuration').first().json.financialSystemApiUrl }}/budget/update`
   - Body content type: **JSON**
   - Body: `={{ $json }}`
   - Header: `Content-Type: application/json`
   - Authentication: select/create finance system credentials (predefined credential type).
   - Connect: **Financial Impact Agent → Update CAPEX/OPEX Plans**

13) **(Optional but recommended) Hardening**
   - Add error workflows or “Continue On Fail” where appropriate for external APIs.
   - Add persistence: write outcomes to a DB/Sheet/Ticketing system.
   - If `/contracts` returns many contracts, add a **Split Out** / **Item Lists** step so each contract is analyzed independently.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| ## How It Works: daily contract monitoring → AI legal analysis → issue routing → negotiation strategy → financial impact → budget update | From sticky note “How It Works” (internal documentation) |
| ## Prerequisites: contract management data source; OpenAI API key; negotiation agent access | From sticky note “Prerequisites” |
| ## Setup Steps: configure data source + schedule; connect OpenAI; connect negotiation/financial systems; define thresholds | From sticky note “Setup Steps” |
| ## Customization: adjust analysis criteria and thresholds; Benefit: eliminates manual review and finds hidden risks | From sticky note “Customization” |

