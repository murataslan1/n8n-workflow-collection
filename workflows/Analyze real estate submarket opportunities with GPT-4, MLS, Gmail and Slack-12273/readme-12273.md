Analyze real estate submarket opportunities with GPT-4, MLS, Gmail and Slack

https://n8nworkflows.xyz/workflows/analyze-real-estate-submarket-opportunities-with-gpt-4--mls--gmail-and-slack-12273


# Analyze real estate submarket opportunities with GPT-4, MLS, Gmail and Slack

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Workflow name:** Intelligent Submarket Trend & Investment Opportunity Analyzer  
**Stated title:** Analyze real estate submarket opportunities with GPT-4, MLS, Gmail and Slack

**Purpose:**  
Runs on a daily schedule, pulls real estate signals from multiple APIs (MLS, public records, demographics, macro), aggregates them, asks GPT‑4o to identify and score submarket investment opportunities using a structured schema, filters high-priority items by a configurable score threshold, and notifies stakeholders via **Gmail** (acquisition team) and **Slack** (investors).

**Target use cases:**
- Investment teams screening multiple markets daily
- Automated “market radar” for emerging submarkets
- Rapid triage of opportunities by ROI/risk score

### Logical Blocks
1. **1.1 Scheduling & Configuration**
2. **1.2 Parallel Data Collection (4 sources)**
3. **1.3 Data Consolidation**
4. **1.4 AI Analysis (GPT‑4o + calculator + structured output)**
5. **1.5 Prioritization & Alerts (Gmail + Slack)**

---

## 2. Block-by-Block Analysis

### 2.1 Scheduling & Configuration

**Overview:**  
Starts the workflow at a fixed time daily and defines all runtime configuration variables (API endpoints, markets, thresholds, notification targets) in one place.

**Nodes involved:**
- Daily Analysis Schedule
- Workflow Configuration

#### Node: Daily Analysis Schedule
- **Type / role:** `Schedule Trigger` — workflow entry point.
- **Configuration (interpreted):** Runs every day at **06:00** (server / n8n instance timezone).
- **Connections:**  
  - **Output →** Workflow Configuration
- **Edge cases / failures:**
  - Timezone mismatch (n8n instance timezone vs expected business timezone).
  - Missed executions if instance is down at trigger time (depends on n8n setup).

#### Node: Workflow Configuration
- **Type / role:** `Set` — central config object for downstream expressions.
- **Configuration (interpreted):** Sets:
  - `mlsApiUrl` (placeholder)
  - `publicRecordsApiUrl` (placeholder)
  - `demographicApiUrl` (placeholder)
  - `macroeconomicApiUrl` (placeholder)
  - `targetMarkets` (comma-separated placeholder string)
  - `minInvestmentScore` = **75**
  - `acquisitionTeamEmail` (placeholder)
  - `investorSlackChannel` (placeholder Slack channel ID)
- **Key expressions / variables used elsewhere:** referenced via  
  - `$('Workflow Configuration').first().json.<field>`
- **Connections:**  
  - **Output →** Fetch MLS Data, Fetch Public Records, Fetch Demographic Data, Fetch Macroeconomic Data (fan-out)
- **Edge cases / failures:**
  - Leaving placeholders unchanged causes HTTP failures and/or invalid Slack/Gmail routing.
  - `targetMarkets` format depends on your APIs (comma-separated string may not match required format).

---

### 2.2 Parallel Data Collection (4 sources)

**Overview:**  
Fetches data in parallel for the configured markets from four endpoints. Each request forwards results to a single aggregation node.

**Nodes involved:**
- Fetch MLS Data
- Fetch Public Records
- Fetch Demographic Data
- Fetch Macroeconomic Data

#### Node: Fetch MLS Data
- **Type / role:** `HTTP Request` — pulls MLS listing/market data.
- **Configuration choices:**
  - URL from `mlsApiUrl`
  - Query parameter: `markets = targetMarkets`
  - Auth: **predefinedCredentialType** (you must attach an HTTP credential type supported by your API)
- **Connections:**  
  - **Input ←** Workflow Configuration  
  - **Output →** Combine All Data Sources
- **Edge cases / failures:**
  - 401/403 due to missing/incorrect credentials
  - API rate limits (429), timeouts, pagination not handled
  - Response shape may not match what the AI expects later

#### Node: Fetch Public Records
- **Type / role:** `HTTP Request` — pulls deeds/tax/ownership/permit-style data (depending on your provider).
- **Configuration:** same pattern as above, using `publicRecordsApiUrl`.
- **Connections:** Workflow Configuration → Combine All Data Sources
- **Edge cases:** same as above (auth, rate limits, schema mismatch).

#### Node: Fetch Demographic Data
- **Type / role:** `HTTP Request` — pulls population/income/household shifts, etc.
- **Configuration:** same pattern as above, using `demographicApiUrl`.
- **Connections:** Workflow Configuration → Combine All Data Sources
- **Edge cases:** same as above.

#### Node: Fetch Macroeconomic Data
- **Type / role:** `HTTP Request` — pulls employment, business growth, macro indicators.
- **Configuration:** same pattern as above, using `macroeconomicApiUrl`.
- **Connections:** Workflow Configuration → Combine All Data Sources
- **Edge cases:** same as above.

---

### 2.3 Data Consolidation

**Overview:**  
Combines outputs from all four HTTP branches into one aggregated payload for AI analysis.

**Nodes involved:**
- Combine All Data Sources

#### Node: Combine All Data Sources
- **Type / role:** `Aggregate` — merges item data across incoming streams.
- **Configuration choices:**
  - Mode: **aggregateAllItemData** (collects all incoming item JSON into a single aggregated structure)
- **Connections:**  
  - **Inputs ←** Fetch MLS Data / Fetch Public Records / Fetch Demographic Data / Fetch Macroeconomic Data  
  - **Output →** Investment Opportunity Analyzer
- **Edge cases / failures:**
  - If one branch returns zero items or errors (and you don’t enable “continue on fail”), downstream may receive partial data or nothing.
  - Large payload sizes can cause memory/performance issues and may exceed LLM context limits later.

---

### 2.4 AI Analysis (GPT‑4o + calculator + structured output)

**Overview:**  
Sends the aggregated dataset into a LangChain Agent using **OpenAI GPT‑4o**, with access to a calculator tool, and enforces a strict JSON schema via a structured output parser.

**Nodes involved:**
- Investment Opportunity Analyzer
- OpenAI GPT-4
- Calculator Tool
- Structured Output Parser

#### Node: Investment Opportunity Analyzer
- **Type / role:** `LangChain Agent` — orchestrates reasoning with tool use and structured output.
- **Configuration choices (interpreted):**
  - Prompt includes a detailed **system message**: analyze trends, identify opportunities, score 0–100, forecast 12–24 months, provide recommendations.
  - Input text set to: `={{ $json.data }}`
  - Output parser enabled: **true** (expects the structured schema output)
- **Important note on input mapping:**  
  The node references `$json.data`. Whether this exists depends on what **Aggregate** outputs. If the Aggregate node produces a different field name (common), the agent may get `undefined`/empty input.
- **Connections:**  
  - **Main input ←** Combine All Data Sources  
  - **Main output →** Filter High-Priority Opportunities  
  - **AI language model input ←** OpenAI GPT‑4  
  - **AI tool input ←** Calculator Tool  
  - **AI output parser input ←** Structured Output Parser
- **Edge cases / failures:**
  - Schema validation failures if the model returns non-conforming JSON.
  - Token/context overflow if aggregated data is too large.
  - Wrong input field (`$json.data`) leading to poor/empty analysis.
  - Tool invocation errors are rare for Calculator, but can happen if agent formats calls unexpectedly.

#### Node: OpenAI GPT-4
- **Type / role:** `LM Chat (OpenAI)` — provides the chat model to the agent.
- **Configuration choices:**
  - Model: **gpt-4o**
  - Temperature: **0.3** (more deterministic/analytical)
- **Credentials:** OpenAI API credential required.
- **Connections:** **AI language model →** Investment Opportunity Analyzer
- **Edge cases / failures:**
  - Invalid API key, quota exceeded, model not available in your account/region.
  - Organizational policy restrictions / rate limits.

#### Node: Calculator Tool
- **Type / role:** `LangChain Tool` — arithmetic for ROI projections.
- **Configuration:** default.
- **Connections:** **AI tool →** Investment Opportunity Analyzer
- **Edge cases:** minimal; mostly dependent on agent’s tool-call formatting.

#### Node: Structured Output Parser
- **Type / role:** `Structured Output Parser` — enforces output schema.
- **Configuration choices:**
  - Manual JSON schema requiring:
    - `opportunities[]` objects with fields like `submarket`, `investmentScore`, `expectedROI`, `riskLevel`, etc.
    - `marketSummary` string
    - `topOpportunities[]` list
- **Connections:** **AI outputParser →** Investment Opportunity Analyzer
- **Edge cases / failures:**
  - If the model outputs fields that don’t match the schema, parsing can fail.
  - The schema does not mark required fields explicitly; downstream nodes assume different fields (see next block).

---

### 2.5 Prioritization & Alerts (Gmail + Slack)

**Overview:**  
Filters opportunities above a minimum score threshold, sorts them, then sends notifications. Current notification templates assume a different data shape than the parser schema, so adjustments are likely required.

**Nodes involved:**
- Filter High-Priority Opportunities
- Email Acquisition Team
- Notify Investors on Slack

#### Node: Filter High-Priority Opportunities
- **Type / role:** `Code` — normalizes agent output and filters by score.
- **Key logic (interpreted):**
  - Reads threshold: `minInvestmentScore` from Workflow Configuration (defaults to 70 if missing).
  - Reads agent output: `$('Investment Opportunity Analyzer').item.json`
  - Extracts `opportunities` from possible shapes:
    - `agentOutput.opportunities`
    - `agentOutput.output.opportunities`
    - or `agentOutput` if it’s an array
  - Filters by `investmentScore` (or fallback `investment_score`)
  - Sorts descending by score
  - **Returns one item per opportunity** (`[{json: opp}, ...]`)
- **Connections:**  
  - **Input ←** Investment Opportunity Analyzer  
  - **Output →** Email Acquisition Team and Notify Investors on Slack (both receive *items per opportunity*)
- **Edge cases / failures:**
  - If the agent returns only the schema object (with `marketSummary`, etc.), this code will work only if `opportunities` exists in the expected place.
  - Downstream nodes (Gmail/Slack) currently render as if `$json.opportunities` exists, but this Code node returns a single opportunity per item; `$json.opportunities` will be undefined.
  - If `investmentScore` is a string, comparisons may behave unexpectedly unless coerced.

#### Node: Email Acquisition Team
- **Type / role:** `Gmail` — sends HTML email to acquisition team.
- **Configuration choices:**
  - To: `acquisitionTeamEmail` from Workflow Configuration
  - Subject: “High-Priority Investment Opportunities - <date>”
  - HTML body loops: `{{ $json.opportunities.map(...) }}`
- **Connections:**  
  - **Input ←** Filter High-Priority Opportunities
- **Major schema mismatch to fix:**  
  This node expects **one item** containing `$json.opportunities[]`, but it actually receives **multiple items**, each being a single opportunity (e.g., `$json.address`, `$json.investmentScore`). As written, the email rendering will likely fail or produce empty content.
- **Edge cases / failures:**
  - Gmail OAuth2 token expired/invalid, insufficient scopes.
  - HTML template errors (calling `.map` on undefined; calling `toLocaleString()` on undefined).
  - Fields referenced (`address`, `projectedROI`, `marketValue`, `recommendation`, `keyInsights`) are **not** in the structured output schema provided to the agent (schema uses `expectedROI`, `recommendations`, `keyDrivers`, etc.).

#### Node: Notify Investors on Slack
- **Type / role:** `Slack` — posts formatted alert message.
- **Configuration choices:**
  - Target: channel selected by ID from config: `investorSlackChannel`
  - Message loops: `{{ $json.opportunities.map(...) }}`
  - Includes link to workflow: enabled
  - Auth: Slack OAuth2
- **Connections:**  
  - **Input ←** Filter High-Priority Opportunities
- **Major schema mismatch to fix:**  
  Same as Gmail: expects `$json.opportunities` plus summary fields (`totalOpportunities`, `highPriorityCount`, `avgScore`) that are not produced by the current Code node nor guaranteed by the AI schema.
- **Edge cases / failures:**
  - Slack OAuth2 token invalid, missing `chat:write` scopes, channel not found, bot not in channel.
  - Template errors due to missing fields (`estimatedROI`, `capRate`, etc.).

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Daily Analysis Schedule | Schedule Trigger | Daily workflow entry point | — | Workflow Configuration | ## **Automated Investment Analysis**<br><br>Delivers end-to-end real estate evaluation with AI, eliminating manual research for investors |
| Workflow Configuration | Set | Central configuration variables | Daily Analysis Schedule | Fetch MLS Data; Fetch Public Records; Fetch Demographic Data; Fetch Macroeconomic Data | ## **Automated Investment Analysis**<br><br>Delivers end-to-end real estate evaluation with AI, eliminating manual research for investors |
| Fetch MLS Data | HTTP Request | Pull MLS data for target markets | Workflow Configuration | Combine All Data Sources | ## **Unified Data Collection**<br><br>Aggregates MLS listings, public records, demographic trends, and macroeconomic indicators |
| Fetch Public Records | HTTP Request | Pull public records data | Workflow Configuration | Combine All Data Sources | ## **Unified Data Collection**<br><br>Aggregates MLS listings, public records, demographic trends, and macroeconomic indicators |
| Fetch Demographic Data | HTTP Request | Pull demographic data | Workflow Configuration | Combine All Data Sources | ## **Unified Data Collection**<br><br>Aggregates MLS listings, public records, demographic trends, and macroeconomic indicators |
| Fetch Macroeconomic Data | HTTP Request | Pull macroeconomic data | Workflow Configuration | Combine All Data Sources | ## **Unified Data Collection**<br><br>Aggregates MLS listings, public records, demographic trends, and macroeconomic indicators |
| Combine All Data Sources | Aggregate | Consolidate all API outputs into one dataset | Fetch MLS Data; Fetch Public Records; Fetch Demographic Data; Fetch Macroeconomic Data | Investment Opportunity Analyzer | ## **Unified Data Collection**<br><br>Aggregates MLS listings, public records, demographic trends, and macroeconomic indicators |
| Investment Opportunity Analyzer | LangChain Agent | AI analysis, scoring, forecasting, structured output | Combine All Data Sources (+ AI inputs) | Filter High-Priority Opportunities | ## **AI-Driven Insights**<br><br>Combines all data into a single dataset and analyzes it with OpenAI GPT-4 |
| OpenAI GPT-4 | OpenAI Chat Model | Provides GPT‑4o to the agent | — | Investment Opportunity Analyzer (AI languageModel) | ## **AI-Driven Insights**<br><br>Combines all data into a single dataset and analyzes it with OpenAI GPT-4 |
| Calculator Tool | LangChain Tool (Calculator) | Enables numeric/ROI calculations | — | Investment Opportunity Analyzer (AI tool) | ## **AI-Driven Insights**<br><br>Combines all data into a single dataset and analyzes it with OpenAI GPT-4 |
| Structured Output Parser | LangChain Output Parser (Structured) | Enforces response schema | — | Investment Opportunity Analyzer (AI outputParser) | ## **AI-Driven Insights**<br><br>Combines all data into a single dataset and analyzes it with OpenAI GPT-4 |
| Filter High-Priority Opportunities | Code | Filter + sort opportunities by score threshold | Investment Opportunity Analyzer | Email Acquisition Team; Notify Investors on Slack | ## **Real-Time Alerts**<br><br>Triggers email and Slack notifications for high-priority opportunities |
| Email Acquisition Team | Gmail | Email report to acquisitions | Filter High-Priority Opportunities | — | ## **Real-Time Alerts**<br><br>Triggers email and Slack notifications for high-priority opportunities |
| Notify Investors on Slack | Slack | Post investor alert to Slack channel | Filter High-Priority Opportunities | — | ## **Real-Time Alerts**<br><br>Triggers email and Slack notifications for high-priority opportunities |
| Sticky Note1 | Sticky Note | Workspace notes (prereqs/use cases/customization/benefits) | — | — | ## Prerequisites<br>OpenAI API key, MLS data service access, public records API credentials<br>## Use Cases<br>Real estate investment firms screening multiple markets simultaneously<br>## Customization<br>Modify AI prompts to adjust investment criteria priorities, add custom financial metrics<br>## Benefits<br>Reduces investment analysis time from hours to minutes, eliminates manual data aggregation errors |
| Sticky Note2 | Sticky Note | Workspace notes (setup steps) | — | — | ## Setup Steps<br>1. Configure HTTP nodes with your MLS API<br>2. Connect Gmail account for acquisition team notifications<br>3. Integrate Slack workspace and specify investor notification channel<br>4. Set schedule trigger frequency in Schedule node |
| Sticky Note3 | Sticky Note | Workspace notes (how it works narrative) | — | — | ## How It Works<br>This workflow automates end-to-end real estate investment analysis by aggregating data from multiple sources and applying AI-driven evaluation. It is designed for real estate investors, analysts, and portfolio managers seeking data-backed decisions without manual research overhead. The solution addresses the time-consuming challenge of collecting and analyzing fragmented real estate data such as MLS listings, public records, demographic trends, and macroeconomic indicators and transforms it into actionable insights using AI. Data is collected in parallel across four streams: MLS property data, public records, demographic information, and macroeconomic signals. These streams are consolidated into a unified dataset and processed by OpenAI GPT-4, using calculator tools and structured output parsing for quantitative analysis. |
| Sticky Note | Sticky Note | Workspace header note | — | — | ## **Automated Investment Analysis**<br><br>Delivers end-to-end real estate evaluation with AI, eliminating manual research for investors |
| Sticky Note4 | Sticky Note | Workspace header note | — | — | ## **Unified Data Collection**<br><br>Aggregates MLS listings, public records, demographic trends, and macroeconomic indicators |
| Sticky Note5 | Sticky Note | Workspace header note | — | — | ## **AI-Driven Insights**<br><br>Combines all data into a single dataset and analyzes it with OpenAI GPT-4 |
| Sticky Note6 | Sticky Note | Workspace header note | — | — | ## **Real-Time Alerts**<br><br>Triggers email and Slack notifications for high-priority opportunities |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow**
   - Name: *Intelligent Submarket Trend & Investment Opportunity Analyzer*
   - Keep it inactive until credentials and endpoints are tested.

2. **Add trigger**
   - Node: **Schedule Trigger**
   - Set it to run **daily at 06:00** (adjust timezone as needed).

3. **Add configuration node**
   - Node: **Set** (name it *Workflow Configuration*)
   - Add fields:
     - `mlsApiUrl` (string)
     - `publicRecordsApiUrl` (string)
     - `demographicApiUrl` (string)
     - `macroeconomicApiUrl` (string)
     - `targetMarkets` (string, comma-separated or per your API)
     - `minInvestmentScore` (number, default 75)
     - `acquisitionTeamEmail` (string)
     - `investorSlackChannel` (string Slack channel ID)
   - Connect: **Schedule Trigger → Workflow Configuration**

4. **Add 4 HTTP Request nodes (parallel)**
   - Create nodes named:
     - Fetch MLS Data
     - Fetch Public Records
     - Fetch Demographic Data
     - Fetch Macroeconomic Data
   - For each node:
     - **URL**: expression `$('Workflow Configuration').first().json.<correspondingUrl>`
     - Enable **Send Query Parameters**
     - Add query parameter:
       - `markets` = `$('Workflow Configuration').first().json.targetMarkets`
     - Configure **Authentication** according to your provider:
       - If using “predefinedCredentialType”, select or create the correct HTTP credential (API key / OAuth2 / header auth).
   - Connect: **Workflow Configuration → all 4 HTTP nodes**

5. **Aggregate**
   - Add node: **Aggregate** (name it *Combine All Data Sources*)
   - Set mode to **Aggregate All Item Data**
   - Connect each HTTP node output into this Aggregate node.

6. **Add AI components**
   - Add node: **OpenAI Chat Model** (name it *OpenAI GPT-4*)
     - Select model: **gpt-4o**
     - Temperature: **0.3**
     - Credentials: create/select **OpenAI API** credential.
   - Add node: **Calculator Tool**
   - Add node: **Structured Output Parser**
     - Schema: paste/define the schema used in your workflow (object with `opportunities`, `marketSummary`, `topOpportunities`, etc.).
   - Add node: **AI Agent** (name it *Investment Opportunity Analyzer*)
     - Input text currently set to `{{ $json.data }}`  
       - **Important:** adjust this to match the Aggregate output. Common fixes:
         - Use `{{ JSON.stringify($json) }}` to pass the whole aggregated object, or
         - Reference the correct aggregated field name.
     - System message: use the provided analyst instructions (scoring, forecasting, recommendations).
     - Enable structured output (output parser).
   - Wire AI internals:
     - **OpenAI GPT‑4 → Investment Opportunity Analyzer** (AI language model connection)
     - **Calculator Tool → Investment Opportunity Analyzer** (AI tool connection)
     - **Structured Output Parser → Investment Opportunity Analyzer** (AI output parser connection)
   - Main flow:
     - **Combine All Data Sources → Investment Opportunity Analyzer**

7. **Add filtering**
   - Add node: **Code** (name it *Filter High-Priority Opportunities*)
   - Paste the filtering JS logic (threshold from config, extract opportunities, filter/sort).
   - Connect: **Investment Opportunity Analyzer → Filter High-Priority Opportunities**

8. **Add Gmail notification**
   - Node: **Gmail** (name it *Email Acquisition Team*)
   - Credential: connect Gmail OAuth2 credential (must allow sending email).
   - To: `{{ $('Workflow Configuration').first().json.acquisitionTeamEmail }}`
   - Subject: `High-Priority Investment Opportunities - {{ $now.format('MMMM d, yyyy') }}`
   - Body: build HTML.
   - Connect: **Filter High-Priority Opportunities → Email Acquisition Team**
   - **Recommended adjustment:** decide whether to send:
     - one email per opportunity (works with current Code output), or
     - one consolidated email (requires adding an Aggregate/Item Lists step after filtering).

9. **Add Slack notification**
   - Node: **Slack** (name it *Notify Investors on Slack*)
   - Auth: Slack OAuth2 credential with posting permissions.
   - Channel ID: `{{ $('Workflow Configuration').first().json.investorSlackChannel }}`
   - Text: build message.
   - Connect: **Filter High-Priority Opportunities → Notify Investors on Slack**
   - **Recommended adjustment:** like Gmail, ensure the Slack message template matches the actual item shape (single opportunity vs list).

10. **Test end-to-end**
   - Manually execute from *Workflow Configuration* with test values.
   - Verify:
     - All HTTP nodes return expected JSON
     - Aggregate output is passed correctly into the agent (no empty prompt)
     - Parser produces the schema successfully
     - Filter outputs what Gmail/Slack templates expect

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| OpenAI API key, MLS data service access, public records API credentials | Prerequisites (Sticky Note1) |
| Real estate investment firms screening multiple markets simultaneously | Use cases (Sticky Note1) |
| Modify AI prompts to adjust investment criteria priorities, add custom financial metrics | Customization (Sticky Note1) |
| Reduces investment analysis time from hours to minutes, eliminates manual data aggregation errors | Benefits (Sticky Note1) |
| Configure HTTP nodes with your MLS API; Connect Gmail; Integrate Slack; Set schedule frequency | Setup steps (Sticky Note2) |
| Workflow narrative: parallel collection of 4 streams → consolidation → GPT‑4 processing with calculator + structured output parsing | How it works (Sticky Note3) |