Automate monthly payroll tax compliance with GPT-4, Google Sheets and Drive

https://n8nworkflows.xyz/workflows/automate-monthly-payroll-tax-compliance-with-gpt-4--google-sheets-and-drive-12034


# Automate monthly payroll tax compliance with GPT-4, Google Sheets and Drive

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Workflow name (JSON):** Revenue to Tax Compliance Automation using AI  
**User-provided title:** Automate monthly payroll tax compliance with GPT-4, Google Sheets and Drive

**Purpose:**  
Runs monthly to fetch revenue/compensation data, compute payroll (as a fixed % of revenue), apply tax withholdings (federal/state/FICA), aggregate totals, ask GPT‑4o to assess compliance risk and produce structured notes/recommendations, generate an HTML compliance report, convert it to PDF, email it to a tax agent, append/update an audit record in Google Sheets, and archive the PDF to Google Drive.

### 1.1 Scheduling & Configuration
Monthly trigger + centralized variables (API endpoint, email, sheet/drive IDs, tax rates).

### 1.2 Data Retrieval
Fetches revenue/employee data via HTTP.

### 1.3 Payroll & Withholding Computation
Derives payroll from revenue and calculates withholding + net payroll per item.

### 1.4 Aggregation & AI Compliance Review
Summarizes totals into a single item and uses a LangChain Agent with GPT‑4o + a structured output parser to produce compliance analysis.

### 1.5 Report Generation, Distribution & Archiving
Creates an HTML report embedding numeric totals and AI output, converts to PDF, then sends/records/archives.

---

## 2. Block-by-Block Analysis

### Block 1 — Scheduling & Workflow Configuration
**Overview:** Starts the workflow monthly and sets all key runtime constants (API URL, destinations, tax rates) in one place for easy maintenance.  
**Nodes involved:** `Monthly Trigger`, `Workflow Configuration`

#### Node: Monthly Trigger
- **Type / role:** Schedule Trigger (`n8n-nodes-base.scheduleTrigger`) — entry point.
- **Configuration:** Runs on an interval of **months** at **09:00** (server / workflow timezone).
- **Input/Output:**  
  - **In:** none (trigger).  
  - **Out:** to **Workflow Configuration**.
- **Version notes:** TypeVersion `1.3`.
- **Potential failures / edge cases:**
  - Timezone mismatch can cause runs at unexpected local times.
  - Missed executions if n8n is down at trigger time (behavior depends on n8n setup).

#### Node: Workflow Configuration
- **Type / role:** Set (`n8n-nodes-base.set`) — establishes configuration variables for downstream nodes.
- **Configuration choices (interpreted):**
  - Adds/overwrites fields (while **including other incoming fields**).
  - Key fields created:
    - `revenueApiUrl` (placeholder)
    - `taxAgentEmail` (placeholder)
    - `complianceSheetId` (placeholder)
    - `driveFolderId` (placeholder)
    - Tax rates: `federalTaxRate=0.22`, `stateTaxRate=0.05`, `socialSecurityRate=0.062`, `medicareRate=0.0145`
- **Key expressions/variables:** None inside this node; it *defines* variables referenced later as:
  - `$('Workflow Configuration').first().json.<field>`
- **Input/Output:**  
  - **In:** from Monthly Trigger.  
  - **Out:** to **Fetch Revenue Data**.
- **Version notes:** TypeVersion `3.4`.
- **Potential failures / edge cases:**
  - Placeholders not replaced → downstream expression resolves to invalid URL/IDs/emails.
  - If multiple items enter, `.first()` usage downstream can hide configuration mismatches (but here the trigger produces a single item).

---

### Block 2 — Revenue/Payroll Data Retrieval
**Overview:** Pulls the source data (employee name + revenue) from an external endpoint.  
**Nodes involved:** `Fetch Revenue Data`

#### Node: Fetch Revenue Data
- **Type / role:** HTTP Request (`n8n-nodes-base.httpRequest`) — retrieves input dataset.
- **Configuration choices:**
  - **URL:** `={{ $('Workflow Configuration').first().json.revenueApiUrl }}`
  - Response options left default-ish (response config object present but no explicit parsing settings shown).
- **Expected input/output:**
  - **In:** configuration item.
  - **Out:** one or many items containing at least:
    - `employeeName`
    - `revenue` (number)
- **Connections:** to **Calculate Payroll**.
- **Version notes:** TypeVersion `4.3`.
- **Potential failures / edge cases:**
  - Invalid/empty URL (placeholders) → request fails.
  - Auth not configured (if endpoint requires it).
  - Non-JSON response or unexpected schema → downstream expressions like `$json.revenue` become `undefined` causing NaN calculations.
  - Pagination/large payload not handled (no looping/pagination logic included).

---

### Block 3 — Payroll & Withholding Computation (Per Item)
**Overview:** For each employee/item, computes payroll as 30% of revenue, then computes tax components and net payroll using configured rates.  
**Nodes involved:** `Calculate Payroll`, `Apply Tax Withholding`

#### Node: Calculate Payroll
- **Type / role:** Set (`n8n-nodes-base.set`) — derives payroll fields.
- **Configuration choices:**
  - `employeeName = {{$json.employeeName}}`
  - `grossRevenue = {{$json.revenue}}`
  - `payrollAmount = {{$json.revenue * 0.30}}`
  - `payrollPercentage = 0.3`
  - **includeOtherFields:** true (retains original HTTP fields).
- **Input/Output:**  
  - **In:** items from Fetch Revenue Data.  
  - **Out:** to Apply Tax Withholding.
- **Version notes:** TypeVersion `3.4`.
- **Potential failures / edge cases:**
  - `$json.revenue` missing or string → multiplication can yield `NaN` or string coercion issues.
  - Hard-coded 30% payroll assumption may not match real payroll rules.

#### Node: Apply Tax Withholding
- **Type / role:** Set (`n8n-nodes-base.set`) — computes withholding and net.
- **Configuration choices / formulas:**
  - Uses config rates from `Workflow Configuration` via `.first().json`.
  - `federalTax = payrollAmount * federalTaxRate`
  - `stateTax = payrollAmount * stateTaxRate`
  - `socialSecurity = payrollAmount * socialSecurityRate`
  - `medicare = payrollAmount * medicareRate`
  - `totalTaxWithholding = sum(all above)`
  - `netPayroll = payrollAmount - totalTaxWithholding`
  - **includeOtherFields:** true
- **Input/Output:**  
  - **In:** per-employee payroll items.  
  - **Out:** to Aggregate Tax Summary.
- **Version notes:** TypeVersion `3.4`.
- **Potential failures / edge cases:**
  - If any rate fields are missing → expressions fail or become `undefined`, producing `NaN`.
  - No rounding strategy; payroll/tax amounts can have long decimals.
  - Social Security wage base limits / Medicare additional tax not modeled.

---

### Block 4 — Aggregation & AI Compliance Analysis
**Overview:** Aggregates all employee items into one monthly summary, then asks an AI agent (GPT‑4o) to validate calculations, assess risk, and return structured JSON used in the report.  
**Nodes involved:** `Aggregate Tax Summary`, `AI Tax Compliance Analyst`, `OpenAI GPT-4`, `Tax Analysis Output Parser`

#### Node: Aggregate Tax Summary
- **Type / role:** Summarize (`n8n-nodes-base.summarize`) — aggregates numeric fields across items.
- **Configuration choices:**
  - **Output format:** `singleItem` (critical: produces a single summary object).
  - Summations:
    - `grossRevenue`, `payrollAmount`, `federalTax`, `stateTax`, `socialSecurity`, `medicare`, `totalTaxWithholding`, `netPayroll`
- **Input/Output connections:**
  - **In:** from Apply Tax Withholding (multiple items possible).
  - **Out (main):** to **Generate Summary Document** and to **AI Tax Compliance Analyst** (parallel branches).
- **Version notes:** TypeVersion `1.1`.
- **Potential failures / edge cases:**
  - If upstream fields are missing/NaN → aggregated sums may be incorrect or null.
  - No explicit `employeeCount` aggregation is defined (but the HTML later references `employeeCount`).

#### Node: AI Tax Compliance Analyst
- **Type / role:** LangChain Agent (`@n8n/n8n-nodes-langchain.agent`) — produces compliance commentary in structured form.
- **Configuration choices:**
  - **Prompt text:** `Analyze the following tax data: {{ JSON.stringify($json) }}`
    - Here `$json` is the **single summary item** from Aggregate Tax Summary.
  - **System message:** instructs to:
    1) Review data  
    2) Calculate reporting period as current month/year  
    3) Verify calculations  
    4) Assess compliance risks  
    5) Provide recommendations  
    6) Generate compliance notes  
    - Must return **structured JSON** with required fields populated.
  - **hasOutputParser:** true (it will enforce schema via the output parser node).
- **Connections:**
  - **In (main):** from Aggregate Tax Summary.
  - **In (AI model):** from **OpenAI GPT-4** via `ai_languageModel`.
  - **In (output parser):** from **Tax Analysis Output Parser** via `ai_outputParser`.
  - **Out (main):** to **Generate Summary Document**.
- **Version notes:** TypeVersion `3.1`.
- **Potential failures / edge cases:**
  - Model output not matching schema → parsing failure.
  - Token limits if `$json` becomes large (usually small here due to summarization).
  - Hallucinated numeric fields if the model “recalculates” inconsistently.
  - Compliance guidance is informational only; should not be treated as legal advice.

#### Node: OpenAI GPT-4
- **Type / role:** OpenAI Chat Model (`@n8n/n8n-nodes-langchain.lmChatOpenAi`) — language model provider for the agent.
- **Configuration choices:**
  - **Model:** `gpt-4o`
  - No special options/tools enabled.
- **Credentials:** `openAiApi` (API key-based).
- **Connections:** outputs as `ai_languageModel` to AI Tax Compliance Analyst.
- **Version notes:** TypeVersion `1.3`.
- **Potential failures / edge cases:**
  - Invalid API key / quota exceeded.
  - Model name not available in account/region.
  - Network timeouts.

#### Node: Tax Analysis Output Parser
- **Type / role:** Structured Output Parser (`@n8n/n8n-nodes-langchain.outputParserStructured`) — enforces a JSON schema for the agent response.
- **Configuration choices:**
  - **Manual JSON schema** with fields:
    - `period` (string)
    - `totalRevenue`, `totalPayroll`, `federalTax`, `stateTax`, `socialSecurity`, `medicare`, `totalWithholding`, `netPayroll` (numbers)
    - `complianceNotes` (string)
    - `riskAssessment` (string)
    - `recommendations` (array of strings)
- **Connections:** provides `ai_outputParser` into AI Tax Compliance Analyst.
- **Version notes:** TypeVersion `1.3`.
- **Potential failures / edge cases:**
  - Schema mismatches with what the HTML expects (see next block).
  - If AI returns numbers as strings, parser may reject.

---

### Block 5 — Document Generation, Conversion, Emailing, Logging & Archiving
**Overview:** Produces an HTML report, converts it to a PDF file, then distributes and stores it (Gmail + Sheets + Drive).  
**Nodes involved:** `Generate Summary Document`, `Convert to PDF`, `Send to Tax Agent`, `Store in Compliance Sheet`, `Archive to Drive`

#### Node: Generate Summary Document
- **Type / role:** HTML (`n8n-nodes-base.html`) — renders HTML from a template using expressions.
- **Configuration choices:**
  - Large HTML template with sections (Revenue Summary, Payroll Calculation, Withholding Breakdown, AI Compliance Analysis).
  - Uses expressions like:
    - `{{ $('Aggregate Tax Summary').item.json.period }}`
    - `{{ $('AI Tax Compliance Analyst').item.json.riskAssessment }}`
    - `{{ $now.format('MMMM DD, YYYY') }}`
  - Includes a loop-like template snippet:
    - `{% for recommendation in $('AI Tax Compliance Analyst').item.json.recommendations %} ... {% endfor %}`
    - **Important:** This depends on the HTML node’s templating engine supporting that syntax (often Nunjucks-like). If unsupported, it will render literally or fail.
- **Connections:**
  - **In:** from Aggregate Tax Summary and AI Tax Compliance Analyst (both connected).
  - **Out:** to Convert to PDF.
- **Version notes:** TypeVersion `1.2`.
- **Key mismatch warnings (high impact):**
  - The HTML references many fields that **are not produced** by Aggregate Tax Summary *nor* by the AI schema, including:
    - `totalRevenue`, `taxableRevenue`, `grossPayroll`, `employeeCount`, `totalDeductions`, `totalTaxWithheld`, `netAfterTax`
  - Actual aggregated fields are named:
    - `grossRevenue`, `payrollAmount`, `totalTaxWithholding`, `netPayroll`, etc.
  - AI parser schema uses:
    - `totalWithholding` (not `totalTaxWithheld`)
    - `totalPayroll` (not `grossPayroll`)
- **Potential failures / edge cases:**
  - Expression evaluation returns `undefined` → blank fields in report.
  - Templating loop not supported → recommendations may not render.
  - Currency formatting is raw; no rounding or locale formatting.

#### Node: Convert to PDF
- **Type / role:** Convert to File (`n8n-nodes-base.convertToFile`) — converts HTML to a PDF binary.
- **Configuration choices:**
  - **Operation:** `html` (HTML → file)
  - **File name:** `Tax_Summary_{{ $now.format('yyyy-MM') }}.pdf`
- **Connections:**
  - **In:** HTML from Generate Summary Document.
  - **Out:** to Send to Tax Agent, Store in Compliance Sheet, Archive to Drive (fan-out).
- **Version notes:** TypeVersion `1.1`.
- **Potential failures / edge cases:**
  - If HTML is malformed/too large → conversion errors.
  - Binary property naming: downstream nodes must reference the correct binary field (often `data`), otherwise attachments/uploads fail.

#### Node: Send to Tax Agent
- **Type / role:** Gmail (`n8n-nodes-base.gmail`) — emails the PDF.
- **Configuration choices:**
  - **To:** `={{ $('Workflow Configuration').first().json.taxAgentEmail }}`
  - **Subject:** `Monthly Tax Summary - {{ $now.format('MMMM yyyy') }}`
  - **Message:** fixed text
  - **Attachments:** configured via `attachmentsBinary` but the JSON shows an **empty attachment entry** (`[{}]`) and no explicit binary property name.
- **Credentials:** `gmailOAuth2`
- **Connections:**  
  - **In:** from Convert to PDF.  
  - **Out:** none.
- **Version notes:** TypeVersion `2.2`.
- **Potential failures / edge cases:**
  - OAuth token expired / missing Gmail scopes.
  - Attachment not actually mapped to the PDF binary property → email sent without attachment or node fails.
  - Recipient email placeholder not replaced.

#### Node: Store in Compliance Sheet
- **Type / role:** Google Sheets (`n8n-nodes-base.googleSheets`) — audit trail storage.
- **Configuration choices:**
  - **Operation:** `appendOrUpdate`
  - **Document ID:** from config `complianceSheetId`
  - **Sheet name:** in “list” mode but value is empty in JSON (must be selected).
- **Credentials:** `googleSheetsOAuth2Api`
- **Connections:**  
  - **In:** from Convert to PDF.  
  - **Out:** none.
- **Version notes:** TypeVersion `4.7`.
- **Potential failures / edge cases:**
  - Sheet name not set → node fails at runtime.
  - `appendOrUpdate` requires a matching key column configuration (not shown) to decide update vs append; misconfiguration can overwrite wrong rows or always append.
  - Permissions / shared drive restrictions.

#### Node: Archive to Drive
- **Type / role:** Google Drive (`n8n-nodes-base.googleDrive`) — archives the PDF.
- **Configuration choices:**
  - **Name:** `Tax_Summary_yyyy-MM.pdf`
  - **Drive:** “My Drive”
  - **Folder ID:** from config `driveFolderId`
  - Upload options not explicitly shown; relies on incoming binary from Convert to PDF.
- **Credentials:** `googleDriveOAuth2Api`
- **Connections:**  
  - **In:** from Convert to PDF.  
  - **Out:** none.
- **Version notes:** TypeVersion `3`.
- **Potential failures / edge cases:**
  - Folder ID placeholder not replaced or points to non-existent/inaccessible folder.
  - Binary property mismatch (no file to upload).

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Monthly Trigger | scheduleTrigger | Monthly entry point | — | Workflow Configuration | ## Fetch Revenue Data\nWhat: Retrieves employee compensation and revenue information from source systems.\nWhy: Ensures payroll calculations are based on current |
| Workflow Configuration | set | Central config variables (API URL, recipients, IDs, tax rates) | Monthly Trigger | Fetch Revenue Data | ## Fetch Revenue Data\nWhat: Retrieves employee compensation and revenue information from source systems.\nWhy: Ensures payroll calculations are based on current |
| Fetch Revenue Data | httpRequest | Pull revenue/employee data from external API | Workflow Configuration | Calculate Payroll | ## Fetch Revenue Data\nWhat: Retrieves employee compensation and revenue information from source systems.\nWhy: Ensures payroll calculations are based on current |
| Calculate Payroll | set | Compute payroll from revenue (30%) | Fetch Revenue Data | Apply Tax Withholding | ## Calculate Payroll\nWhat: Applies payroll formulas with detailed reasoning for gross pay.\nWhy: Delivers accurate, documented payroll |
| Apply Tax Withholding | set | Compute withholding components and net payroll | Calculate Payroll | Aggregate Tax Summary | ## Calculate Payroll\nWhat: Applies payroll formulas with detailed reasoning for gross pay.\nWhy: Delivers accurate, documented payroll |
| Aggregate Tax Summary | summarize | Sum totals across employees into one item | Apply Tax Withholding | Generate Summary Document; AI Tax Compliance Analyst | ## Verify Compliance, Archives to Drive & Notifies Agents\nWhat: Uses GPT-4 tax analysis to validate payroll against compliance.\nWhy: Confirms adherence to employment tax laws and identifies compliance gaps |
| AI Tax Compliance Analyst | langchain agent | Validate calculations, assess risk, output structured compliance JSON | Aggregate Tax Summary; (AI model) OpenAI GPT-4; (parser) Tax Analysis Output Parser | Generate Summary Document | ## Verify Compliance, Archives to Drive & Notifies Agents\nWhat: Uses GPT-4 tax analysis to validate payroll against compliance.\nWhy: Confirms adherence to employment tax laws and identifies compliance gaps |
| OpenAI GPT-4 | lmChatOpenAi | LLM backend for agent (gpt-4o) | — | AI Tax Compliance Analyst | ## Verify Compliance, Archives to Drive & Notifies Agents\nWhat: Uses GPT-4 tax analysis to validate payroll against compliance.\nWhy: Confirms adherence to employment tax laws and identifies compliance gaps |
| Tax Analysis Output Parser | outputParserStructured | Enforce AI output schema | — | AI Tax Compliance Analyst | ## Verify Compliance, Archives to Drive & Notifies Agents\nWhat: Uses GPT-4 tax analysis to validate payroll against compliance.\nWhy: Confirms adherence to employment tax laws and identifies compliance gaps |
| Generate Summary Document | html | Build HTML report from totals + AI analysis | Aggregate Tax Summary; AI Tax Compliance Analyst | Convert to PDF | ## Verify Compliance, Archives to Drive & Notifies Agents\nWhat: Uses GPT-4 tax analysis to validate payroll against compliance.\nWhy: Confirms adherence to employment tax laws and identifies compliance gaps |
| Convert to PDF | convertToFile | Convert HTML report to PDF binary | Generate Summary Document | Send to Tax Agent; Store in Compliance Sheet; Archive to Drive | ## Verify Compliance, Archives to Drive & Notifies Agents\nWhat: Uses GPT-4 tax analysis to validate payroll against compliance.\nWhy: Confirms adherence to employment tax laws and identifies compliance gaps |
| Send to Tax Agent | gmail | Email PDF to tax agent | Convert to PDF | — | ## Verify Compliance, Archives to Drive & Notifies Agents\nWhat: Uses GPT-4 tax analysis to validate payroll against compliance.\nWhy: Confirms adherence to employment tax laws and identifies compliance gaps |
| Store in Compliance Sheet | googleSheets | Append/update audit record in Sheets | Convert to PDF | — | ## Verify Compliance, Archives to Drive & Notifies Agents\nWhat: Uses GPT-4 tax analysis to validate payroll against compliance.\nWhy: Confirms adherence to employment tax laws and identifies compliance gaps |
| Archive to Drive | googleDrive | Upload PDF to Drive folder | Convert to PDF | — | ## Verify Compliance, Archives to Drive & Notifies Agents\nWhat: Uses GPT-4 tax analysis to validate payroll against compliance.\nWhy: Confirms adherence to employment tax laws and identifies compliance gaps |
| Sticky Note1 | stickyNote | Comment | — | — | ## Prerequisites\nPayroll data source; OpenAI API key; Google Sheets and Drive accounts \n## Use Cases\nHR departments automating monthly payroll processing and tax compliance; \n## Customization\nAdjust withholding rules by jurisdiction \n## Benefits\nEliminates manual payroll calculations |
| Sticky Note2 | stickyNote | Comment | — | — | ## Setup Steps\n1. Connect payroll data source and configure revenue fetch parameters.\n2. Set up OpenAI GPT-4 API for tax withholding logic and compliance analysis.\n3. Configure Google Sheets for audit storage and Google Drive for long-term archiving.\n4. Define tax withholding rules, compliance thresholds, and tax agent. |
| Sticky Note3 | stickyNote | Comment | — | — | ## How It Works\nAutomates monthly payroll processing and tax compliance by calculating employee payroll, applying accurate withholdings, generating comprehensive tax summaries, and producing compliance-ready documentation. The system fetches revenue and payroll data, performs detailed payroll calculations, applies AI-driven tax withholding rules, aggregates tax summary information, and verifies compliance using GPT-4 tax analysis. It generates structured HTML documents, converts them to PDF format, stores records in Google Sheets for audit trails, archives files to Google Drive, and sends summaries to tax agents. Designed for HR departments and payroll processing teams seeking automated, accurate, and fully compliant payroll management. |
| Sticky Note4 | stickyNote | Comment | — | — | ## Verify Compliance, Archives to Drive & Notifies Agents\nWhat: Uses GPT-4 tax analysis to validate payroll against compliance.\nWhy: Confirms adherence to employment tax laws and identifies compliance gaps |
| Sticky Note5 | stickyNote | Comment | — | — | ## Calculate Payroll\nWhat: Applies payroll formulas with detailed reasoning for gross pay.\nWhy: Delivers accurate, documented payroll |
| Sticky Note6 | stickyNote | Comment | — | — | ## Fetch Revenue Data\nWhat: Retrieves employee compensation and revenue information from source systems.\nWhy: Ensures payroll calculations are based on current |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow**
   - Name it (e.g.) **Revenue to Tax Compliance Automation using AI**.
   - Keep workflow inactive until credentials and placeholders are set.

2. **Add Trigger: “Monthly Trigger”**
   - Node type: **Schedule Trigger**
   - Configure: Interval = **Months**, Time = **09:00**.

3. **Add Set node: “Workflow Configuration”**
   - Node type: **Set**
   - Enable: **Include Other Fields**
   - Add fields:
     - `revenueApiUrl` (string) → your revenue/payroll API endpoint
     - `taxAgentEmail` (string) → destination email
     - `complianceSheetId` (string) → Google Sheet file ID
     - `driveFolderId` (string) → Google Drive folder ID
     - `federalTaxRate` (number) = `0.22`
     - `stateTaxRate` (number) = `0.05`
     - `socialSecurityRate` (number) = `0.062`
     - `medicareRate` (number) = `0.0145`
   - Connect: **Monthly Trigger → Workflow Configuration**

4. **Add HTTP node: “Fetch Revenue Data”**
   - Node type: **HTTP Request**
   - URL: `{{ $('Workflow Configuration').first().json.revenueApiUrl }}`
   - Configure authentication as required by your API (not included in JSON).
   - Ensure response is JSON and yields items with at least `employeeName` and `revenue`.
   - Connect: **Workflow Configuration → Fetch Revenue Data**

5. **Add Set node: “Calculate Payroll”**
   - Node type: **Set**
   - Enable: **Include Other Fields**
   - Fields:
     - `employeeName` = `{{ $json.employeeName }}`
     - `grossRevenue` = `{{ $json.revenue }}`
     - `payrollAmount` = `{{ $json.revenue * 0.30 }}`
     - `payrollPercentage` = `0.3`
   - Connect: **Fetch Revenue Data → Calculate Payroll**

6. **Add Set node: “Apply Tax Withholding”**
   - Node type: **Set**
   - Enable: **Include Other Fields**
   - Fields (use the same expressions as in the JSON):
     - `federalTax` = `{{ $json.payrollAmount * $('Workflow Configuration').first().json.federalTaxRate }}`
     - `stateTax` = `{{ $json.payrollAmount * $('Workflow Configuration').first().json.stateTaxRate }}`
     - `socialSecurity` = `{{ $json.payrollAmount * $('Workflow Configuration').first().json.socialSecurityRate }}`
     - `medicare` = `{{ $json.payrollAmount * $('Workflow Configuration').first().json.medicareRate }}`
     - `totalTaxWithholding` = sum of the above four
     - `netPayroll` = `payrollAmount - totalTaxWithholding`
   - Connect: **Calculate Payroll → Apply Tax Withholding**

7. **Add Summarize node: “Aggregate Tax Summary”**
   - Node type: **Summarize**
   - Output format: **Single item**
   - Add fields to summarize (Aggregation = **sum**):
     - `grossRevenue`, `payrollAmount`, `federalTax`, `stateTax`, `socialSecurity`, `medicare`, `totalTaxWithholding`, `netPayroll`
   - Connect: **Apply Tax Withholding → Aggregate Tax Summary**

8. **Add AI nodes (LangChain)**
   1) **OpenAI model node: “OpenAI GPT-4”**
   - Node type: **OpenAI Chat Model (LangChain)**
   - Model: **gpt-4o**
   - Credentials: create/select **OpenAI API** credential (API key).
   2) **Output parser node: “Tax Analysis Output Parser”**
   - Node type: **Structured Output Parser**
   - Schema: use the manual schema from the workflow (fields: period, totals, notes, recommendations).
   3) **Agent node: “AI Tax Compliance Analyst”**
   - Node type: **AI Agent**
   - Prompt text: `Analyze the following tax data: {{ JSON.stringify($json) }}`
   - System message: paste the provided compliance analyst instructions.
   - Connect AI wiring:
     - **OpenAI GPT-4 (ai_languageModel) → AI Tax Compliance Analyst**
     - **Tax Analysis Output Parser (ai_outputParser) → AI Tax Compliance Analyst**
   - Connect data flow:
     - **Aggregate Tax Summary → AI Tax Compliance Analyst**

9. **Add HTML node: “Generate Summary Document”**
   - Node type: **HTML**
   - Paste the HTML template.
   - Connect:
     - **Aggregate Tax Summary → Generate Summary Document**
     - **AI Tax Compliance Analyst → Generate Summary Document**
   - Important: align field names in the HTML with your actual summary/AI output (the provided template references fields that are not produced as-is).

10. **Add Convert node: “Convert to PDF”**
   - Node type: **Convert to File**
   - Operation: **HTML**
   - File name: `Tax_Summary_{{ $now.format('yyyy-MM') }}.pdf`
   - Connect: **Generate Summary Document → Convert to PDF**

11. **Add Gmail node: “Send to Tax Agent”**
   - Node type: **Gmail**
   - Credentials: create/select **Gmail OAuth2** credential.
   - To: `{{ $('Workflow Configuration').first().json.taxAgentEmail }}`
   - Subject: `Monthly Tax Summary - {{ $now.format('MMMM yyyy') }}`
   - Message: as provided.
   - Attachments: map the PDF binary property coming from “Convert to PDF” (ensure you select the correct binary field; the default is commonly `data`).
   - Connect: **Convert to PDF → Send to Tax Agent**

12. **Add Google Sheets node: “Store in Compliance Sheet”**
   - Node type: **Google Sheets**
   - Credentials: create/select **Google Sheets OAuth2** credential.
   - Operation: **Append or Update**
   - Document ID: `{{ $('Workflow Configuration').first().json.complianceSheetId }}`
   - Sheet name: select the target sheet tab (must not be blank).
   - Configure the key column/matching behavior required by “appendOrUpdate” (UI-dependent).
   - Connect: **Convert to PDF → Store in Compliance Sheet**

13. **Add Google Drive node: “Archive to Drive”**
   - Node type: **Google Drive**
   - Credentials: create/select **Google Drive OAuth2** credential.
   - Folder ID: `{{ $('Workflow Configuration').first().json.driveFolderId }}`
   - File name: `Tax_Summary_{{ $now.format('yyyy-MM') }}.pdf`
   - Ensure it uploads the binary PDF from Convert to PDF (select correct binary property).
   - Connect: **Convert to PDF → Archive to Drive**

14. **Validate with a manual execution**
   - Temporarily replace the Schedule Trigger with a Manual Trigger or use “Execute workflow”.
   - Confirm:
     - HTTP returns expected fields
     - Summarize produces correct sums
     - AI output parses successfully
     - HTML renders with correct values
     - PDF attaches/uploads correctly
     - Sheets write works and doesn’t overwrite unintended rows

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| **Prerequisites:** Payroll data source; OpenAI API key; Google Sheets and Drive accounts. **Use cases:** HR departments automating monthly payroll processing and tax compliance. **Customization:** Adjust withholding rules by jurisdiction. **Benefits:** Eliminates manual payroll calculations. | Sticky Note “Prerequisites” |
| **Setup Steps:** 1) Connect payroll data source and configure revenue fetch parameters. 2) Set up OpenAI GPT‑4 API for tax withholding logic and compliance analysis. 3) Configure Google Sheets for audit storage and Google Drive for long-term archiving. 4) Define tax withholding rules, compliance thresholds, and tax agent. | Sticky Note “Setup Steps” |
| **How it works:** End-to-end monthly automation: fetch data → calculate payroll/withholding → aggregate → GPT‑4 analysis → HTML → PDF → email + Sheets + Drive archival. | Sticky Note “How It Works” |
| **Operational intent:** “Verify Compliance, Archives to Drive & Notifies Agents” using GPT‑4 to validate payroll compliance and identify gaps. | Sticky Note “Verify Compliance…” |
| **Known structural issue to address when reproducing:** The HTML template expects field names (e.g., `totalRevenue`, `grossPayroll`, `totalTaxWithheld`) that do not match the actual summarizer outputs (`grossRevenue`, `payrollAmount`, `totalTaxWithholding`) nor the AI parser fields (`totalWithholding`, `totalPayroll`). | Derived from node configuration review |