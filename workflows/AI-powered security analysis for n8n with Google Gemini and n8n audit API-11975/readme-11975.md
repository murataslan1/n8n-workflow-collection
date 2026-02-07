AI-powered security analysis for n8n with Google Gemini and n8n audit API

https://n8nworkflows.xyz/workflows/ai-powered-security-analysis-for-n8n-with-google-gemini-and-n8n-audit-api-11975


# AI-powered security analysis for n8n with Google Gemini and n8n audit API

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Title:** AI-powered security analysis for n8n with Google Gemini and n8n audit API

**Purpose:**  
This workflow collects security audit data from an n8n instance using the official **Audit API** (v1), converts the raw audit output into a structured risk summary, sends it to **Google Gemini** for analysis, then renders an interactive **web-based final report** via an n8n Form completion page.

**Target use cases:**
- n8n admins / DevSecOps teams auditing self-hosted or cloud n8n instances
- Quick “security posture snapshot” with prioritized remediation guidance
- Identifying unused credentials, possible SQL injection patterns, risky nodes, community packages, and filesystem-access risks

### 1.1 Ingestion (Form → Audit API)
Collects instance URL and API key through an n8n Form Trigger, then calls `/api/v1/audit` with selected categories.

### 1.2 Data Logic & AI Analysis (Code → Gemini → Structured parsing)
Transforms audit JSON into metrics and curated lists, then prompts Gemini to produce a professional report with structured output enforcement.

### 1.3 Presentation (Formatting → Interactive HTML report)
Builds final markdown + metadata, then displays a rich HTML dashboard and the full report inside an n8n Form completion page.

---

## 2. Block-by-Block Analysis

### Block 1 — Ingestion (Form input + audit fetch)

**Overview:**  
Captures the target n8n instance details via a form and fetches audit results from the instance’s Audit API endpoint using the provided API key.

**Nodes involved:**
- On form submission
- Get Audit Data

#### Node: **On form submission**
- **Type / role:** `n8n-nodes-base.formTrigger` — Entry point; serves a form UI and starts the workflow.
- **Key configuration (interpreted):**
  - Form title: “🔒 n8n Security Audit Report Generator”
  - Button label: “Generate Security Report”
  - Fields (required):
    - `n8n Instance URL` (expects something like `https://your-instance.n8n.cloud`)
    - `n8n API Key` (expects `n8n_api_...`)
  - Description explains what the user will receive and required inputs.
- **Key variables/expressions used elsewhere:**
  - `$('On form submission').item.json['n8n Instance URL']`
  - `$('On form submission').item.json['n8n API Key']`
- **Connections:**
  - **Output →** Get Audit Data (main)
- **Potential failures / edge cases:**
  - User enters URL without scheme or with trailing spaces (not sanitized here).
  - API key missing scope permissions (Audit scope required).
- **Version-specific notes:** node typeVersion `2.3` (Form Trigger UI and completion flow depend on n8n v1+).

#### Node: **Get Audit Data**
- **Type / role:** `n8n-nodes-base.httpRequest` — Calls the remote n8n instance Audit API.
- **Key configuration (interpreted):**
  - **Method:** POST
  - **URL (expression):** strips trailing `/` then appends `/api/v1/audit`
    - `{{ $('On form submission').item.json['n8n Instance URL'].replace(/\/$/, '') }}/api/v1/audit`
  - **Headers:**
    - `X-N8N-API-KEY: {{ $('On form submission').item.json['n8n API Key'] }}`
  - **JSON body:** requests categories:
    - `instance`, `credentials`, `database`, `nodes`, `filesystem`
    - `daysAbandonedWorkflow: 1` (used by audit logic to detect abandoned workflows/credentials depending on n8n implementation)
- **Connections:**
  - **Input ←** On form submission
  - **Output →** Prepare Audit Data (main)
- **Potential failures / edge cases:**
  - **401/403** if API key invalid or missing “Audit” scope.
  - **404** if instance URL incorrect or API path differs (older n8n versions).
  - **Network/TLS** issues (self-hosted instance with invalid cert).
  - **Non-JSON response** causing downstream Code node failures.
- **Version-specific notes:** HTTP Request node typeVersion `4.3`.

**Sticky note covering this block (applies to both nodes):**  
“### 1. INGESTION  
Captures instance details via an n8n Form and fetches the raw security audit data using the official n8n v1 API.”

---

### Block 2 — Data Logic & AI Analysis (prepare + LLM + structured parsing)

**Overview:**  
Normalizes the raw audit JSON into a concise “auditContext” summary with metrics and lists, then uses Gemini through the LangChain `chainLlm` node to generate a professional report with a structured JSON output enforced by a schema.

**Nodes involved:**
- Prepare Audit Data
- gemini-2.f-flash
- Structured Output Parser
- AI Report Generator

#### Node: **Prepare Audit Data**
- **Type / role:** `n8n-nodes-base.code` — Transforms audit API payload into AI-ready structured context.
- **Key configuration (interpreted):**
  - Reads audit output from `$input.first().json`
  - Extracts top-level reports by expected keys:
    - `Instance Risk Report`
    - `Credentials Risk Report`
    - `Database Risk Report`
    - `Nodes Risk Report`
    - `Filesystem Risk Report`
  - Computes counts from specific `sections[x].location.length` paths (defensive optional chaining used).
  - Creates:
    - `summary.metrics` including `riskLevel` computed from:
      - `totalIssues = unusedCredentials + sqlIssues + riskyNodes + filesystemNodes`
      - thresholds: `>20 => HIGH`, `>10 => MEDIUM`, else `LOW`
    - Lists:
      - `unusedCredentialsList` (credential names)
      - `sqlIssuesList` (workflowName + nodeName)
      - `communityPackages` (name derived from `packageUrl.split('/package/')[1]` fallback to nodeType)
      - `filesystemNodesList` (workflowName + nodeName + nodeType)
    - `riskyNodesByWorkflow` grouped map of workflows → risky node list `{name, type}`
  - Builds `auditContext` as pretty JSON: `JSON.stringify(summary, null, 2)`
  - Outputs:
    - `auditContext`, `summary`, `generatedAt` (ISO), `reportDate` (localized English long date)
- **Connections:**
  - **Input ←** Get Audit Data
  - **Output →** AI Report Generator (main)
- **Potential failures / edge cases:**
  - Audit API schema changes: missing keys like `'Instance Risk Report'` would lead to empty metrics/settings.
  - If `nodesReport.sections[1].location[].packageUrl` is missing or not containing `/package/`, name parsing may be poor (still falls back).
  - Risk scoring ignores some categories (inactive/stale credentials, community nodes) for `totalIssues`; this is intentional but could understate risk.
- **Version-specific notes:** Code node typeVersion `2` (newer Code node runtime behavior vs Function node).

#### Node: **gemini-2.f-flash**
- **Type / role:** `@n8n/n8n-nodes-langchain.lmChatGoogleGemini` — Provides the chat LLM backend (Google Gemini) to LangChain chain nodes.
- **Key configuration (interpreted):**
  - Model node labeled “gemini-2.f-flash” (the node name suggests the chosen model; actual model selection can be implicit in credential/config depending on node implementation/version).
  - Credentials: **Google PaLM / Gemini API** credential (`googlePalmApi`)
- **Connections:**
  - **Output (ai_languageModel) →** AI Report Generator
- **Potential failures / edge cases:**
  - Invalid/expired Gemini key.
  - Model not available in region/project.
  - Output variability: must match the structured schema or parser will fail.
  - Rate limits / token limits if `auditContext` becomes large.
- **Version-specific notes:** typeVersion `1` (Gemini LangChain integration in n8n).

#### Node: **Structured Output Parser**
- **Type / role:** `@n8n/n8n-nodes-langchain.outputParserStructured` — Enforces that the LLM returns a JSON object matching a schema.
- **Key configuration (interpreted):**
  - Manual JSON schema requiring:
    - `executiveSummary` (string)
    - `riskLevel` enum: `LOW|MEDIUM|HIGH`
    - `criticalFindings` array of objects `{title, severity, description, remediation}`
    - `immediateActions` array of strings
    - `shortTermActions` array of strings (optional)
    - `fullReport` (string, markdown)
  - Required fields: `executiveSummary`, `riskLevel`, `criticalFindings`, `immediateActions`, `fullReport`
- **Connections:**
  - **Output (ai_outputParser) →** AI Report Generator
- **Potential failures / edge cases:**
  - If Gemini outputs invalid JSON, missing required properties, or `riskLevel` not in enum → parsing error.
  - Large `fullReport` might push response limits depending on model/settings.
- **Version-specific notes:** typeVersion `1.2`.

#### Node: **AI Report Generator**
- **Type / role:** `@n8n/n8n-nodes-langchain.chainLlm` — Orchestrates prompt + model + parser to generate the structured report.
- **Key configuration (interpreted):**
  - Prompt is “define” type and embeds:
    - `{{ $json.auditContext }}` inside a JSON code block
    - `{{ $json.reportDate }}`
  - Provides explicit report structure with sections:
    1. Executive Summary
    2. Metrics Overview
    3. Critical Findings (unused creds, SQL injection)
    4. Medium Priority (community nodes, filesystem)
    5. Instance configuration review
    6. Remediation plan (Immediate/Short-term/Ongoing)
    7. Workflows requiring attention
  - `hasOutputParser: true` (expects structured output)
- **Connections:**
  - **Input ←** Prepare Audit Data (main)
  - **ai_languageModel ←** gemini-2.f-flash
  - **ai_outputParser ←** Structured Output Parser
  - **Output →** Format Report Output (main)
- **Potential failures / edge cases:**
  - Prompt injection risk is low since input is audit JSON, but still untrusted text could appear in names; report should be treated as advisory.
  - If the auditContext is huge (many workflows/nodes), the model may truncate or omit required fields → parser failure.
- **Version-specific notes:** typeVersion `1.4`.

**Sticky note covering this block (applies to all block nodes):**  
“### 2. Data Logic & AI ANALYSIS  
Formats raw JSON into security metrics and uses Google Gemini to perform a deep-dive risk assessment of the instance configuration.”

---

### Block 3 — Presentation (final formatting + interactive output)

**Overview:**  
Combines the structured LLM output with computed metrics, adds a metadata header and identifiers, then renders an HTML “dashboard-style” completion page summarizing risk, metrics, and detailed lists.

**Nodes involved:**
- Format Report Output
- Display Final Audit Report

#### Node: **Format Report Output**
- **Type / role:** `n8n-nodes-base.code` — Consolidates/normalizes the LLM output and prepares fields for rendering.
- **Key configuration (interpreted):**
  - Reads:
    - `const aiOutput = $input.first().json.output;` (expects AI Report Generator output under `.output`)
    - `const prepData = $('Prepare Audit Data').first().json;` (cross-node reference)
  - Constructs:
    - `reportContent = header + aiOutput.fullReport`
    - Header includes:
      - Generated date (from `prepData.reportDate`)
      - Risk level (from `aiOutput.riskLevel`)
      - Report ID `AUDIT-${Date.now()}`
    - `reportTitle`: `n8n Security Audit - YYYY-MM-DD - <risk> Risk`
  - Outputs a combined object:
    - `reportTitle`, `reportContent`
    - `aiAnalysis` (executiveSummary, riskLevel, findings, actions, fullReport)
    - `metrics` (from `prepData.summary.metrics`)
    - `auditData` (lists and instanceSettings)
- **Connections:**
  - **Input ←** AI Report Generator
  - **Output →** Display Final Audit Report
- **Potential failures / edge cases:**
  - If AI Report Generator output path differs (e.g., not under `.json.output`) this will break.
  - If parser fails upstream, this node never runs.
  - Cross-node reference `$('Prepare Audit Data')` assumes that node executed in the same run and has at least one item.
- **Version-specific notes:** Code node typeVersion `2`.

#### Node: **Display Final Audit Report**
- **Type / role:** `n8n-nodes-base.form` (operation: `completion`) — Renders final HTML content to the user as a completion screen.
- **Key configuration (interpreted):**
  - Completion title: “✅ n8n Security Audit Complete”
  - Completion message: long HTML/CSS block that:
    - Shows risk banner using dynamic colors based on `metrics.riskLevel`
    - Displays:
      - Executive summary
      - Metrics tiles (total issues, unused creds, SQL risks, community nodes, risky nodes, filesystem nodes)
      - Immediate actions + short-term actions (rendered as `<li>` list from arrays)
      - Unused credentials as “tags”
      - SQL issues table (workflow, node)
      - Community packages table with NPM link
      - Filesystem nodes table
      - Instance configuration table (feature flags and excluded nodes)
      - Full report rendered in a scrollable container with some markdown-ish transformations
    - Shows a Report ID using `Date.now()` again (note: different from earlier Report ID if times differ)
- **Connections:**
  - **Input ←** Format Report Output
  - **Output:** none (final UI)
- **Potential failures / edge cases:**
  - If `shortTermActions` missing, this HTML uses `.map` on possibly undefined. However upstream `Format Report Output` sets `shortTermActions: aiOutput.shortTermActions || []`, so it is safe **as long as** that is what Display node uses (it uses `$json.aiAnalysis.shortTermActions`, so safe).
  - If lists are very long, the completion page can be heavy/slow.
  - HTML rendering expectations: some n8n environments may sanitize or display differently depending on form implementation/version.
- **Version-specific notes:** node typeVersion `2.3` (Form completion rendering).

**Sticky note covering this block (applies to both nodes):**  
“### 3. PRESENTATION  
Finalizes the report formatting and displays an interactive, high-fidelity dashboard to the user.”

---

### Documentation / Meta Notes (non-executing)

#### Sticky Note: **Workflow Documentation**
- **Type / role:** `n8n-nodes-base.stickyNote` — Embedded human documentation for the canvas.
- **Contains:** purpose, audience, how it works, requirements (n8n v1+, Gemini key, API key with Audit scope), setup steps, customization ideas (swap LLM provider; add Slack/email delivery).

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| On form submission | n8n-nodes-base.formTrigger | Collect instance URL + API key; start workflow | — | Get Audit Data | ### 1. INGESTION<br>Captures instance details via an n8n Form and fetches the raw security audit data using the official n8n v1 API. |
| Get Audit Data | n8n-nodes-base.httpRequest | Call `/api/v1/audit` on target instance | On form submission | Prepare Audit Data | ### 1. INGESTION<br>Captures instance details via an n8n Form and fetches the raw security audit data using the official n8n v1 API. |
| Prepare Audit Data | n8n-nodes-base.code | Convert audit JSON into metrics, lists, and compact AI context | Get Audit Data | AI Report Generator | ### 2. Data Logic & AI ANALYSIS<br>Formats raw JSON into security metrics and uses Google Gemini to perform a deep-dive risk assessment of the instance configuration. |
| gemini-2.f-flash | @n8n/n8n-nodes-langchain.lmChatGoogleGemini | LLM backend (Gemini) for report generation | — (wired via ai_languageModel) | AI Report Generator | ### 2. Data Logic & AI ANALYSIS<br>Formats raw JSON into security metrics and uses Google Gemini to perform a deep-dive risk assessment of the instance configuration. |
| Structured Output Parser | @n8n/n8n-nodes-langchain.outputParserStructured | Enforce schema-based JSON output from LLM | — (wired via ai_outputParser) | AI Report Generator | ### 2. Data Logic & AI ANALYSIS<br>Formats raw JSON into security metrics and uses Google Gemini to perform a deep-dive risk assessment of the instance configuration. |
| AI Report Generator | @n8n/n8n-nodes-langchain.chainLlm | Prompt + LLM + parser to generate structured report | Prepare Audit Data | Format Report Output | ### 2. Data Logic & AI ANALYSIS<br>Formats raw JSON into security metrics and uses Google Gemini to perform a deep-dive risk assessment of the instance configuration. |
| Format Report Output | n8n-nodes-base.code | Build final report payload (title, markdown, metrics, lists) | AI Report Generator | Display Final Audit Report | ### 3. PRESENTATION<br>Finalizes the report formatting and displays an interactive, high-fidelity dashboard to the user. |
| Display Final Audit Report | n8n-nodes-base.form | Render HTML completion dashboard to user | Format Report Output | — | ### 3. PRESENTATION<br>Finalizes the report formatting and displays an interactive, high-fidelity dashboard to the user. |
| Code Explanation | n8n-nodes-base.stickyNote | Canvas comment for Stage 2 | — | — |  |
| Stage 1 | n8n-nodes-base.stickyNote | Canvas comment for Stage 1 | — | — |  |
| Stage 3 | n8n-nodes-base.stickyNote | Canvas comment for Stage 3 | — | — |  |
| Workflow Documentation | n8n-nodes-base.stickyNote | Canvas documentation block | — | — |  |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in n8n and name it:  
   **“AI-powered security analysis for n8n with Google Gemini and n8n audit API”**

2. **Add node: “On form submission”**
   - Type: **Form Trigger**
   - Configure:
     - Form title: `🔒 n8n Security Audit Report Generator`
     - Description: (use the provided text describing outputs/requirements)
     - Button label: `Generate Security Report`
     - Fields (both required):
       1) `n8n Instance URL` (placeholder: `https://your-instance.n8n.cloud`)  
       2) `n8n API Key` (placeholder: `n8n_api_xxxxxxxxxxxxxxxxxxxx`)

3. **Add node: “Get Audit Data”**
   - Type: **HTTP Request**
   - Method: **POST**
   - URL (expression):
     - `{{ $('On form submission').item.json['n8n Instance URL'].replace(/\/$/, '') }}/api/v1/audit`
   - Send Headers: **true**
   - Add header:
     - Name: `X-N8N-API-KEY`
     - Value: `{{ $('On form submission').item.json['n8n API Key'] }}`
   - Send Body: **true**
   - Body Content Type: **JSON**
   - JSON body:
     - Include `additionalOptions.daysAbandonedWorkflow = 1`
     - Include `categories = ["instance","credentials","database","nodes","filesystem"]`
   - Connect: **On form submission → Get Audit Data**

4. **Add node: “Prepare Audit Data”**
   - Type: **Code**
   - Paste the logic that:
     - Reads the audit payload
     - Computes metrics counts and `riskLevel`
     - Produces `summary`, `auditContext` (stringified JSON), `generatedAt`, `reportDate`
   - Connect: **Get Audit Data → Prepare Audit Data**

5. **Create Gemini credential**
   - In **Credentials**, add **Google Gemini / PaLM API** credential (name can be anything).
   - Paste your Gemini API key and save.

6. **Add node: “gemini-2.f-flash”**
   - Type: **Google Gemini Chat Model** (LangChain)
   - Select the Gemini credential created in step 5.
   - (Optional) choose model variant consistent with your node/version; keep default options if unsure.

7. **Add node: “Structured Output Parser”**
   - Type: **Structured Output Parser** (LangChain)
   - Schema: **Manual**
   - Paste a JSON schema that requires:
     - `executiveSummary` (string)
     - `riskLevel` enum `LOW|MEDIUM|HIGH`
     - `criticalFindings` array of objects with title/severity/description/remediation
     - `immediateActions` array of strings
     - optional `shortTermActions` array of strings
     - `fullReport` (string)

8. **Add node: “AI Report Generator”**
   - Type: **Chain LLM** (LangChain)
   - Prompt: **Define**
   - Prompt text:
     - Include the audit JSON context as:
       - ````md
         ```json
         {{ $json.auditContext }}
         ```
         ````
     - Include `{{ $json.reportDate }}`
     - Instruct the LLM to produce a markdown report with the specified sections and actionable recommendations.
   - Enable **Output Parser** usage.
   - Connect the model and parser:
     - **gemini-2.f-flash (ai_languageModel) → AI Report Generator**
     - **Structured Output Parser (ai_outputParser) → AI Report Generator**
   - Connect data input:
     - **Prepare Audit Data → AI Report Generator**

9. **Add node: “Format Report Output”**
   - Type: **Code**
   - Implement:
     - Read structured output from the AI node
     - Add a header with generated date, risk level, and a report ID
     - Create `reportTitle`
     - Output `aiAnalysis`, `metrics`, and `auditData` objects for rendering
   - Connect: **AI Report Generator → Format Report Output**

10. **Add node: “Display Final Audit Report”**
   - Type: **Form**
   - Operation: **Completion**
   - Completion Title: `✅ n8n Security Audit Complete`
   - Completion Message:
     - Paste the HTML template that renders:
       - Risk banner (colored by risk)
       - Metrics tiles
       - Action lists (immediate + short-term)
       - Tables for SQL issues, community packages, filesystem nodes
       - Instance configuration flags
       - Full report box
   - Connect: **Format Report Output → Display Final Audit Report**

11. **(Optional) Add sticky notes** on the canvas for “Stage 1/2/3” and the large “Workflow Documentation” content to preserve intent and setup requirements.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| Generates a security audit report from an n8n instance to a web form; uses native Audit API + AI analysis. | Workflow Documentation sticky note |
| Requirements: n8n v1.0+; Google Gemini API Key; n8n API Key with **Audit** scope permissions. | Workflow Documentation sticky note |
| Customization: swap Gemini node for OpenAI/Anthropic; add Slack/Email node to route report automatically. | Workflow Documentation sticky note |