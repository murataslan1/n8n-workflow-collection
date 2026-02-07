Automate GST/VAT tax returns with OpenAI, Gmail and government portal integration

https://n8nworkflows.xyz/workflows/automate-gst-vat-tax-returns-with-openai--gmail-and-government-portal-integration-11900


# Automate GST/VAT tax returns with OpenAI, Gmail and government portal integration

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Workflow name:** Automated GST/VAT Tax Return Preparation and Submission System  
**Title provided:** Automate GST/VAT tax returns with OpenAI, Gmail and government portal integration

**Purpose:**  
This workflow runs on a monthly schedule to automatically gather financial data (revenue, expenses, invoices), uses an AI agent (OpenAI via LangChain nodes) to validate taxability and calculate GST/VAT, checks whether filing is required based on a configurable threshold, prepares a tax declaration payload, submits it to a government portal (HTTP API) and/or sends it to a tax agent via Gmail, then sends a payment reminder email if tax is owed.

**Target use cases:**
- Small businesses automating GST/VAT return preparation
- Accountants managing multiple entities/clients
- Finance teams wanting consistent, auditable calculations and automated notifications

### 1.1 Scheduling & Configuration
Monthly trigger → sets environment/config values (API URLs, tax rate, threshold, email recipients).

### 1.2 Data Collection (Revenue/Expenses/Invoices)
Calls three HTTP endpoints to fetch financial datasets needed for the tax period.

### 1.3 Aggregation & AI Tax Validation/Computation
Merges datasets into one object → AI agent classifies transactions (taxable/exempt/zero-rated) and computes totals using a calculator tool → structured JSON parsing ensures machine-usable output.

### 1.4 Threshold Check & Routing
Compares computed revenue to a configured filing threshold:
- If above/equal threshold: generate declaration and proceed to submission/notification
- If below threshold: output notice (no filing)

### 1.5 Submission, Confirmation Logging & Notifications
Submits to government portal and emails tax agent (currently in parallel) → logs confirmation metadata → checks if payment is owed → emails payment reminder or records “no action required”.

---

## 2. Block-by-Block Analysis

### Block A — Scheduling & Workflow Configuration
**Overview:** Starts monthly and centralizes configurable endpoints and business rules in one “Set” node so downstream nodes can reference them consistently.  
**Nodes involved:**  
- Monthly Tax Return Schedule  
- Workflow Configuration  

#### Node: Monthly Tax Return Schedule
- **Type / role:** `scheduleTrigger` — workflow entry point; triggers execution on a recurring schedule.
- **Key configuration:** Runs at **09:00** on an interval defined by `months` (monthly schedule).
- **Connections:** Outputs to **Workflow Configuration**.
- **Edge cases / failures:**
  - Timezone behavior depends on n8n instance settings; ensure the schedule aligns with the jurisdiction’s filing calendar.
  - If monthly timing is insufficient (e.g., quarterly filings), schedule must be adapted.

#### Node: Workflow Configuration
- **Type / role:** `set` — configuration injection and variable normalization.
- **Key configuration choices (interpreted):**
  - Defines placeholders for:
    - `revenueApiUrl`, `expensesApiUrl`, `invoicesApiUrl` (data source endpoints)
    - `govPortalApiUrl` (submission endpoint)
    - `taxAgentEmail`, `companyEmail` (notification recipients)
    - `taxThreshold` (filing threshold)
    - `taxRate` (e.g., `0.15`)
  - **Include other fields** enabled → keeps incoming trigger metadata if any.
- **Key expressions/variables used:** None internally; values are static placeholders to be replaced.
- **Connections:** Fans out to:
  - Fetch Revenue Data
  - Fetch Expenses Data
  - Fetch Invoices Data
- **Edge cases / failures:**
  - Placeholder values must be replaced; otherwise HTTP nodes will fail (invalid URL).
  - `taxThreshold` is configured as a **string** here, but later compared numerically; coercion may be unreliable depending on locale formatting (e.g., “10,000”).

---

### Block B — Data Collection (HTTP)
**Overview:** Pulls raw datasets from source systems for the relevant period.  
**Nodes involved:**  
- Fetch Revenue Data  
- Fetch Expenses Data  
- Fetch Invoices Data  

#### Node: Fetch Revenue Data
- **Type / role:** `httpRequest` — retrieves revenue transactions.
- **Key configuration choices:**
  - URL from `Workflow Configuration.revenueApiUrl`
  - Sends header `Content-Type: application/json`
- **Key expressions:**
  - `{{ $('Workflow Configuration').first().json.revenueApiUrl }}`
- **Connections:** Output to **Merge Financial Data**.
- **Edge cases / failures:**
  - Auth not configured in node (no credentials shown) → most real APIs will require OAuth2/API keys.
  - Pagination not handled.
  - No query params for period filtering; endpoint must default to “current period” or you must add date filters.

#### Node: Fetch Expenses Data
- **Type / role:** `httpRequest` — retrieves expense transactions.
- **Configuration:** Same pattern as revenue (URL from config, JSON header).
- **Connections:** Output to **Merge Financial Data**.
- **Edge cases:** Same as above (auth, pagination, period filtering).

#### Node: Fetch Invoices Data
- **Type / role:** `httpRequest` — retrieves invoice records.
- **Configuration:** Same pattern as revenue (URL from config, JSON header).
- **Connections:** Output to **Merge Financial Data**.
- **Edge cases:** Same as above.

---

### Block C — Aggregation & AI Tax Calculation
**Overview:** Combines the three datasets, runs an AI agent to validate tax treatment and compute totals, and enforces a strict output schema.  
**Nodes involved:**  
- Merge Financial Data  
- Tax Validation & Calculation Agent  
- OpenAI Chat Model  
- Calculator Tool  
- Tax Calculation Output Parser  

#### Node: Merge Financial Data
- **Type / role:** `set` — builds one unified JSON object for the AI agent.
- **Key configuration choices:**
  - Creates fields:
    - `revenueData` = all items from Fetch Revenue Data
    - `expensesData` = all items from Fetch Expenses Data
    - `invoicesData` = all items from Fetch Invoices Data
    - `taxRate` = config tax rate (cast to number in node)
- **Key expressions:**
  - `{{ $('Fetch Revenue Data').all() }}` (and similarly for expenses/invoices)
  - `{{ $('Workflow Configuration').first().json.taxRate }}`
- **Connections:** Output to **Tax Validation & Calculation Agent**.
- **Edge cases / failures:**
  - `.all()` returns an array of items (each item includes `json`), which can be bulky and may exceed model context limits.
  - If any fetch node returns zero items, arrays may be empty; the agent must handle it.

#### Node: Tax Validation & Calculation Agent
- **Type / role:** `@n8n/n8n-nodes-langchain.agent` — orchestrates LLM + tools + structured output.
- **Key configuration choices:**
  - Prompt text includes the merged object:  
    `Analyze the following financial data and calculate GST/VAT tax: {{ JSON.stringify($json) }}`
  - System message instructs:
    - classify transactions (taxable/exempt/zero-rated)
    - compute totals and net tax owed/refund
    - use **Calculator tool** for arithmetic
    - output structured JSON
  - `hasOutputParser: true` meaning it should comply with the attached structured parser.
- **Connected AI components:**
  - Language model: **OpenAI Chat Model**
  - Tool: **Calculator Tool**
  - Output parser: **Tax Calculation Output Parser**
- **Connections:** Main output to **Check Tax Threshold**.
- **Edge cases / failures:**
  - Model may still produce non-conformant JSON → parser failure.
  - If transaction schemas differ from what the agent expects (field names, currencies, negative amounts), calculations may be wrong.
  - Sensitive/compliance note: ensure tax rules match the jurisdiction; the system message contains generic rules only.

#### Node: OpenAI Chat Model
- **Type / role:** `lmChatOpenAi` — provides the LLM used by the agent.
- **Key configuration choices:**
  - Model: `gpt-4.1-mini`
- **Credentials:** `openAiApi` (must be configured in n8n).
- **Connections:** Supplies the agent via `ai_languageModel`.
- **Edge cases / failures:**
  - API quota limits, timeouts, or model availability changes.
  - Data volume can increase token cost and cause truncation.

#### Node: Calculator Tool
- **Type / role:** `toolCalculator` — deterministic arithmetic tool for the agent.
- **Connections:** Provided to agent via `ai_tool`.
- **Edge cases / failures:**
  - If the agent does not call the tool as instructed, arithmetic may be approximate.
  - No custom constraints (currency rounding, etc.) are enforced here.

#### Node: Tax Calculation Output Parser
- **Type / role:** `outputParserStructured` — enforces output JSON schema.
- **Schema (interpreted):** Expects an object with numeric totals and arrays for transaction lists:
  - `totalRevenue`, `totalExpenses`, `taxableRevenue`, `taxableExpenses`
  - `taxOnRevenue`, `taxOnExpenses`, `netTaxOwed`
  - `taxableTransactions`, `exemptTransactions`
  - `summary` (string)
- **Connections:** Attached to agent via `ai_outputParser`.
- **Edge cases / failures:**
  - If the model returns strings instead of numbers, parsing may fail or coerce incorrectly.
  - Arrays are untyped; downstream consumers must handle unknown item structure.

---

### Block D — Threshold Checking & Declaration Generation
**Overview:** Determines whether filing is required based on revenue threshold; if required, prepares declaration metadata for submission/communication.  
**Nodes involved:**  
- Check Tax Threshold  
- Generate Tax Declaration  
- Below Threshold Notice  

#### Node: Check Tax Threshold
- **Type / role:** `if` — conditional routing.
- **Condition:** `totalRevenue >= taxThreshold`
  - Left: `{{ $json.totalRevenue }}`
  - Right: `{{ $('Workflow Configuration').first().json.taxThreshold }}`
- **Outputs:**
  - **True** → Generate Tax Declaration
  - **False** → Below Threshold Notice
- **Edge cases / failures:**
  - `taxThreshold` is stored as string; loose validation is enabled, but formatting like `"10,000"` may break numeric comparison.
  - If `totalRevenue` missing due to AI/parser failure, condition may evaluate unexpectedly.

#### Node: Generate Tax Declaration
- **Type / role:** `set` — adds declaration metadata for submission.
- **Fields added:**
  - `declarationType`: `"GST/VAT Tax Return"`
  - `filingPeriod`: `{{ $now.format('MMMM yyyy') }}`
  - `declarationDate`: `{{ $now.toISO() }}`
  - `status`: `"Ready for Submission"`
- **Connections:** Sends to **Submit to Government Portal** and **Send to Tax Agent** (parallel).
- **Edge cases / failures:**
  - Filing period is based on execution date, not necessarily the tax period covered by transactions (important for backdated filings).

#### Node: Below Threshold Notice
- **Type / role:** `set` — produces an informational outcome when no filing required.
- **Fields added:**
  - `message`: `"Revenue below filing threshold - no tax return required"`
  - `threshold`: from configuration
  - `actualRevenue`: from AI output
- **Connections:** No downstream connections (workflow ends here for this branch).
- **Edge cases / failures:**
  - If `totalRevenue` is not numeric, `actualRevenue` may be misleading.

---

### Block E — Submission, Logging, and Notifications
**Overview:** Submits the declaration (HTTP) and emails the tax agent (Gmail), logs a confirmation code, then checks whether payment is needed and notifies the company.  
**Nodes involved:**  
- Submit to Government Portal  
- Send to Tax Agent  
- Log Confirmation  
- Check Tax Owed  
- Send Payment Reminder  
- No Action Required  

#### Node: Submit to Government Portal
- **Type / role:** `httpRequest` — POST submission to government portal API.
- **Key configuration choices:**
  - URL from `Workflow Configuration.govPortalApiUrl`
  - Method: `POST`
  - Body: JSON = entire current item (`{{ $json }}`)
  - Header: `Content-Type: application/json`
- **Connections:** Output to **Log Confirmation**.
- **Edge cases / failures:**
  - No authentication configured (most portals require OAuth2/mTLS/API keys).
  - No retry/backoff logic; transient failures can cause missed submission.
  - If the portal expects a specific schema, sending the entire object (including arrays and summary) may be rejected.

#### Node: Send to Tax Agent
- **Type / role:** `gmail` — emails declaration details to tax agent.
- **Key configuration choices:**
  - To: `Workflow Configuration.taxAgentEmail`
  - Subject: `Tax Return Declaration - <Month Year>`
  - HTML message includes serialized JSON payload in `<pre>`.
- **Credentials:** `gmailOAuth2` (must be configured).
- **Connections:** Output to **Log Confirmation**.
- **Edge cases / failures:**
  - Large JSON may exceed Gmail message size limits.
  - Gmail OAuth scopes/refresh token issues can break sending.

#### Node: Log Confirmation
- **Type / role:** `set` — normalizes a confirmation record after submission/email.
- **Key fields:**
  - `confirmationCode` = `confirmationId` OR `messageId` OR fallback `CONF-<timestamp>`
  - `submissionTimestamp` = now ISO
  - `submissionMethod` = `{{ $('Submit to Government Portal').itemMatched ? 'Government Portal' : 'Tax Agent Email' }}`
- **Connections:** Output to **Check Tax Owed**.
- **Edge cases / failures:**
  - **Parallel branch ambiguity:** both “Submit…” and “Send…” feed into this node; depending on execution, this node can run twice (once per branch) and the `itemMatched` logic may not reliably reflect the actual path for the current item.
  - If government submission fails but email succeeds, you may still log as portal submission depending on matching behavior.

#### Node: Check Tax Owed
- **Type / role:** `if` — routes based on liability.
- **Condition:** `netTaxOwed > 0`
- **Outputs:**
  - **True** → Send Payment Reminder
  - **False** → No Action Required
- **Edge cases / failures:**
  - If `netTaxOwed` missing or non-numeric, condition may route incorrectly.
  - Refund scenarios (negative net tax) are treated as “No Action Required” (may be insufficient if refund claim actions exist).

#### Node: Send Payment Reminder
- **Type / role:** `gmail` — emails internal company reminder to pay tax due.
- **Key configuration choices:**
  - To: `Workflow Configuration.companyEmail`
  - Message includes:
    - Amount owed: `{{ $json.netTaxOwed.toFixed(2) }}`
    - Confirmation code
- **Credentials:** `gmailOAuth2`.
- **Edge cases / failures:**
  - `.toFixed(2)` will throw if `netTaxOwed` is not a number.
  - Currency symbol is hard-coded as `$` (may be wrong for VAT jurisdictions).

#### Node: No Action Required
- **Type / role:** `set` — finalizes workflow for zero/refund outcomes.
- **Fields:**
  - `message`: `"No tax payment required - refund or zero balance"`
  - `completedAt`: now ISO
- **Connections:** none.
- **Edge cases / failures:** Minimal; relies on correct routing.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Monthly Tax Return Schedule | n8n-nodes-base.scheduleTrigger | Monthly workflow trigger | — | Workflow Configuration | ## How It Works… (full note about end-to-end automation); ## Data Collection – Fetches revenue, expenses, and invoice data… |
| Workflow Configuration | n8n-nodes-base.set | Central config variables (URLs, rate, threshold, emails) | Monthly Tax Return Schedule | Fetch Revenue Data; Fetch Expenses Data; Fetch Invoices Data | ## Setup Steps (1–5); ## How It Works…; ## Data Collection… |
| Fetch Revenue Data | n8n-nodes-base.httpRequest | Retrieve revenue dataset | Workflow Configuration | Merge Financial Data | ## How It Works…; ## Data Collection… |
| Fetch Expenses Data | n8n-nodes-base.httpRequest | Retrieve expenses dataset | Workflow Configuration | Merge Financial Data | ## How It Works…; ## Data Collection… |
| Fetch Invoices Data | n8n-nodes-base.httpRequest | Retrieve invoices dataset | Workflow Configuration | Merge Financial Data | ## How It Works…; ## Data Collection… |
| Merge Financial Data | n8n-nodes-base.set | Combine datasets + tax rate into one object | Fetch Revenue Data; Fetch Expenses Data; Fetch Invoices Data | Tax Validation & Calculation Agent | ## How It Works…; ## AI Validation – OpenAI processes financials… |
| Tax Validation & Calculation Agent | @n8n/n8n-nodes-langchain.agent | AI validation + GST/VAT computation with tools + structured output | Merge Financial Data | Check Tax Threshold | ## How It Works…; ## AI Validation – OpenAI processes financials… |
| OpenAI Chat Model | @n8n/n8n-nodes-langchain.lmChatOpenAi | LLM powering the agent | — (AI channel) | Tax Validation & Calculation Agent (AI) | ## Prerequisites (OpenAI API key, Gmail account, Google Sheets…); ## AI Validation… |
| Calculator Tool | @n8n/n8n-nodes-langchain.toolCalculator | Deterministic arithmetic tool for agent | — (AI channel) | Tax Validation & Calculation Agent (AI) | ## AI Validation… |
| Tax Calculation Output Parser | @n8n/n8n-nodes-langchain.outputParserStructured | Enforce JSON schema for AI output | — (AI channel) | Tax Validation & Calculation Agent (AI) | ## AI Validation… |
| Check Tax Threshold | n8n-nodes-base.if | Decide if filing required | Tax Validation & Calculation Agent | Generate Tax Declaration (true); Below Threshold Notice (false) | ## Threshold Checking & Routing – Compares calculated liability… |
| Generate Tax Declaration | n8n-nodes-base.set | Add filing metadata for submission | Check Tax Threshold (true) | Submit to Government Portal; Send to Tax Agent | ## Threshold Checking & Routing…; ## Customization / Benefits |
| Below Threshold Notice | n8n-nodes-base.set | End branch when no filing required | Check Tax Threshold (false) | — | ## Threshold Checking & Routing… |
| Submit to Government Portal | n8n-nodes-base.httpRequest | POST declaration to government API | Generate Tax Declaration | Log Confirmation | ## Customization / Benefits |
| Send to Tax Agent | n8n-nodes-base.gmail | Email declaration JSON to agent | Generate Tax Declaration | Log Confirmation | ## Automated Communication – Sends notices and reminders…; ## Prerequisites… |
| Log Confirmation | n8n-nodes-base.set | Normalize confirmation code + method | Submit to Government Portal; Send to Tax Agent | Check Tax Owed | ## Automated Communication… |
| Check Tax Owed | n8n-nodes-base.if | Decide if payment reminder needed | Log Confirmation | Send Payment Reminder (true); No Action Required (false) | ## Automated Communication… |
| Send Payment Reminder | n8n-nodes-base.gmail | Email company payment reminder | Check Tax Owed (true) | — | ## Automated Communication… |
| No Action Required | n8n-nodes-base.set | Final message for refund/zero liability | Check Tax Owed (false) | — | ## Automated Communication… |
| Sticky Note | n8n-nodes-base.stickyNote | Comment | — | — | ## Customization / Benefits (Adjust thresholds; integrate sources; reduce errors; alerts) |
| Sticky Note1 | n8n-nodes-base.stickyNote | Comment | — | — | ## Prerequisites / Use Cases |
| Sticky Note2 | n8n-nodes-base.stickyNote | Comment | — | — | ## Setup Steps (1–5) |
| Sticky Note3 | n8n-nodes-base.stickyNote | Comment | — | — | ## How It Works (long description) |
| Sticky Note4 | n8n-nodes-base.stickyNote | Comment | — | — | ## Data Collection (weekly wording) |
| Sticky Note5 | n8n-nodes-base.stickyNote | Comment | — | — | ## AI Validation |
| Sticky Note6 | n8n-nodes-base.stickyNote | Comment | — | — | ## Threshold Checking & Routing |
| Sticky Note7 | n8n-nodes-base.stickyNote | Comment | — | — | ## Automated Communication |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow**
   - Name it: **Automated GST/VAT Tax Return Preparation and Submission System**
   - (Optional) Set workflow timezone appropriately for filing jurisdiction.

2. **Add trigger: “Monthly Tax Return Schedule”**
   - Node type: **Schedule Trigger**
   - Configure interval: **Every 1 month** at **09:00** (match your filing cadence).

3. **Add configuration node: “Workflow Configuration”**
   - Node type: **Set**
   - Add fields (as top-level JSON fields):
     - `revenueApiUrl` (string)
     - `expensesApiUrl` (string)
     - `invoicesApiUrl` (string)
     - `govPortalApiUrl` (string)
     - `taxAgentEmail` (string)
     - `taxThreshold` (number recommended; if you keep string, ensure it is plain digits)
     - `taxRate` (number, e.g., `0.15`)
     - `companyEmail` (string)
   - Connect: **Schedule Trigger → Workflow Configuration**

4. **Add HTTP nodes to fetch data**
   - Create three nodes of type **HTTP Request**:
     1) **Fetch Revenue Data**
        - URL expression: `{{ $('Workflow Configuration').first().json.revenueApiUrl }}`
        - Header: `Content-Type: application/json`
     2) **Fetch Expenses Data**
        - URL expression: `{{ $('Workflow Configuration').first().json.expensesApiUrl }}`
        - Header: `Content-Type: application/json`
     3) **Fetch Invoices Data**
        - URL expression: `{{ $('Workflow Configuration').first().json.invoicesApiUrl }}`
        - Header: `Content-Type: application/json`
   - Connect: **Workflow Configuration → each Fetch node** (three outgoing connections)

   **Credential/auth setup (as needed):**
   - If your APIs require auth, configure it inside each HTTP node (API key, OAuth2, etc.).
   - Add query parameters for the tax period if your endpoints require it.

5. **Add aggregation node: “Merge Financial Data”**
   - Node type: **Set**
   - Add fields:
     - `revenueData` = `{{ $('Fetch Revenue Data').all() }}`
     - `expensesData` = `{{ $('Fetch Expenses Data').all() }}`
     - `invoicesData` = `{{ $('Fetch Invoices Data').all() }}`
     - `taxRate` = `{{ $('Workflow Configuration').first().json.taxRate }}`
   - Connect: each Fetch node → **Merge Financial Data**
     - (Three incoming connections into Merge Financial Data)

6. **Add AI components (LangChain in n8n)**
   - Add node: **OpenAI Chat Model**
     - Type: **OpenAI Chat Model (LangChain)**
     - Model: `gpt-4.1-mini`
     - Configure **OpenAI API credentials** in n8n (Settings → Credentials → OpenAI).
   - Add node: **Calculator Tool**
     - Type: **Calculator Tool (LangChain)**
   - Add node: **Tax Calculation Output Parser**
     - Type: **Structured Output Parser**
     - Set schema (manual) with fields:
       - Numbers: `totalRevenue`, `totalExpenses`, `taxableRevenue`, `taxableExpenses`, `taxOnRevenue`, `taxOnExpenses`, `netTaxOwed`
       - Arrays: `taxableTransactions`, `exemptTransactions`
       - String: `summary`
   - Add node: **Tax Validation & Calculation Agent**
     - Type: **AI Agent (LangChain)**
     - Prompt: include merged JSON, e.g. `Analyze the following financial data... {{ JSON.stringify($json) }}`
     - System message: include the GST/VAT rules and instruct tool usage (calculator).
     - Attach:
       - OpenAI Chat Model to the Agent’s **Language Model** connection
       - Calculator Tool to the Agent’s **Tools** connection
       - Output Parser to the Agent’s **Output Parser** connection
   - Connect: **Merge Financial Data → Tax Validation & Calculation Agent**

7. **Add threshold routing: “Check Tax Threshold”**
   - Node type: **IF**
   - Condition: `{{ $json.totalRevenue }}` **is greater than or equal** to `{{ $('Workflow Configuration').first().json.taxThreshold }}`
   - Connect: **Agent → Check Tax Threshold**

8. **Add “Generate Tax Declaration” (true branch)**
   - Node type: **Set**
   - Add:
     - `declarationType` = `GST/VAT Tax Return`
     - `filingPeriod` = `{{ $now.format('MMMM yyyy') }}`
     - `declarationDate` = `{{ $now.toISO() }}`
     - `status` = `Ready for Submission`
   - Connect: **Check Tax Threshold (true) → Generate Tax Declaration**

9. **Add “Below Threshold Notice” (false branch)**
   - Node type: **Set**
   - Add:
     - `message` = `Revenue below filing threshold - no tax return required`
     - `threshold` = `{{ $('Workflow Configuration').first().json.taxThreshold }}`
     - `actualRevenue` = `{{ $json.totalRevenue }}`
   - Connect: **Check Tax Threshold (false) → Below Threshold Notice**

10. **Add submission node: “Submit to Government Portal”**
    - Node type: **HTTP Request**
    - Method: `POST`
    - URL: `{{ $('Workflow Configuration').first().json.govPortalApiUrl }}`
    - Send JSON body = `{{ $json }}`
    - Header: `Content-Type: application/json`
    - Connect: **Generate Tax Declaration → Submit to Government Portal**
    - Add portal credentials/auth as required by your government API.

11. **Add email node: “Send to Tax Agent”**
    - Node type: **Gmail**
    - Operation: Send Email
    - To: `{{ $('Workflow Configuration').first().json.taxAgentEmail }}`
    - Subject: `Tax Return Declaration - {{ $now.format('MMMM yyyy') }}`
    - HTML message: include `{{ JSON.stringify($json, null, 2) }}`
    - Configure **Gmail OAuth2** credentials in n8n (Google Cloud OAuth client + refresh token).
    - Connect: **Generate Tax Declaration → Send to Tax Agent**

12. **Add “Log Confirmation”**
    - Node type: **Set**
    - Fields:
      - `confirmationCode` = `{{ $json.confirmationId || $json.messageId || 'CONF-' + $now.toMillis() }}`
      - `submissionTimestamp` = `{{ $now.toISO() }}`
      - `submissionMethod` = `{{ $('Submit to Government Portal').itemMatched ? 'Government Portal' : 'Tax Agent Email' }}`
    - Connect:
      - **Submit to Government Portal → Log Confirmation**
      - **Send to Tax Agent → Log Confirmation** (second incoming connection)

13. **Add “Check Tax Owed”**
    - Node type: **IF**
    - Condition: `{{ $json.netTaxOwed }}` **greater than** `0`
    - Connect: **Log Confirmation → Check Tax Owed**

14. **Add “Send Payment Reminder” (true)**
    - Node type: **Gmail**
    - To: `{{ $('Workflow Configuration').first().json.companyEmail }}`
    - Subject: `Payment Reminder: Tax Owed for {{ $now.format('MMMM yyyy') }}`
    - Message includes:
      - `{{ $json.netTaxOwed.toFixed(2) }}`
      - `{{ $json.confirmationCode }}`
    - Connect: **Check Tax Owed (true) → Send Payment Reminder**

15. **Add “No Action Required” (false)**
    - Node type: **Set**
    - Fields:
      - `message` = `No tax payment required - refund or zero balance`
      - `completedAt` = `{{ $now.toISO() }}`
    - Connect: **Check Tax Owed (false) → No Action Required**

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| **Prerequisites:** OpenAI API key, Gmail account, Google Sheets, accounting software or data source connectivity. | From sticky note “Prerequisites / Use Cases” (note: Google Sheets is mentioned but not implemented in nodes). |
| **Use Cases:** Quarterly tax filing automation, multi-client accountant workflows, enterprise compliance monitoring. | Sticky note “Prerequisites / Use Cases”. |
| **Setup Steps:** 1) Configure OpenAI, Gmail, and Google Sheets credentials 2) Connect revenue/expense sources 3) Define thresholds/jurisdiction 4) Map outputs to portal/agent systems 5) Create email templates. | Sticky note “Setup Steps” (Google Sheets not present in workflow). |
| **Customization:** Adjust thresholds by jurisdiction; integrate additional data sources. **Benefits:** fewer calculation errors, faster filing, automated alerts. | Sticky note “Customization / Benefits”. |
| **Design note:** Sticky note says “weekly” fetching, but the trigger is configured monthly. | Sticky note “Data Collection” vs actual Schedule Trigger. |

