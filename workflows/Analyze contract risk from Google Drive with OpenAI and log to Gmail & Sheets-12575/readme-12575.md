Analyze contract risk from Google Drive with OpenAI and log to Gmail & Sheets

https://n8nworkflows.xyz/workflows/analyze-contract-risk-from-google-drive-with-openai-and-log-to-gmail---sheets-12575


# Analyze contract risk from Google Drive with OpenAI and log to Gmail & Sheets

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Title:** Analyze contract risk from Google Drive with OpenAI and log to Gmail & Sheets

This workflow monitors a specific Google Drive folder for newly uploaded contract files, downloads each file, extracts/constructs text content, sends it to an OpenAI model for structured legal/commercial risk analysis, then routes email notifications via Gmail based on risk criteria and logs the structured output to Google Sheets for audit tracking.

### 1.1 Contract Intake (Trigger → Download)
- Detect new file in a watched Drive folder and download it as binary content.

### 1.2 Text Extraction / Preparation
- Convert text-based files to readable UTF-8 text.
- For non-text files (PDF/DOCX/etc.), forward “raw” content (still base64-decoded bytes interpreted as UTF-8) with an instruction preface.

### 1.3 AI Contract Analysis (OpenAI via LangChain node)
- Send the contract text to an AI legal analyst prompt.
- Force a **strict JSON-only** response with explicit vs inferred risks.

### 1.4 Output Normalization + Risk Routing
- Parse AI output JSON safely (with fallback extraction).
- Flatten the structure for email + sheet columns.
- IF logic decides whether to send a “risk alert” email or an “info only” email.

### 1.5 Audit Logging (Google Sheets)
- Build a final row payload with timestamps and all key fields.
- Append a row into a specified Google Sheet tab.

---

## 2. Block-by-Block Analysis

### Block 1 — Contract Ingestion & Download
**Overview:** Watches a Google Drive folder and downloads newly created files for downstream processing.  
**Nodes Involved:** `Google Drive Trigger1`, `Download file1`

#### Node: Google Drive Trigger1
- **Type / Role:** Google Drive Trigger (`n8n-nodes-base.googleDriveTrigger`) — entry point that polls for new files.
- **Configuration (interpreted):**
  - Event: **fileCreated**
  - Trigger on: **specificFolder**
  - Polling: **everyHour**
  - Folder to watch: selected via UI list picker (currently empty in JSON export).
- **Inputs/Outputs:**
  - **Output:** emits file metadata for the created file (includes fileId used downstream).
  - **Connected to:** `Download file1`
- **Version notes:** TypeVersion `1` (older trigger version; behavior is polling-based, not push/webhook).
- **Edge cases / failures:**
  - Missing/invalid folder selection → trigger won’t detect files.
  - Drive credential scope issues → auth/permission errors.
  - Poll interval means up to 1-hour latency.
  - Burst uploads: multiple items emitted; downstream nodes must handle multiple items (they generally do).

#### Node: Download file1
- **Type / Role:** Google Drive (`n8n-nodes-base.googleDrive`) — downloads the file binary by ID.
- **Configuration (interpreted):**
  - Operation: **download**
  - File ID: intended to come from trigger output, but the exported JSON shows an empty UI field. In a working workflow, this should be mapped to the trigger’s file ID (e.g., `{{$json.id}}` or the appropriate Drive trigger field).
- **Inputs/Outputs:**
  - **Input:** file metadata including fileId.
  - **Output:** binary data (file content), plus some metadata fields.
  - **Connected to:** `Extract Text From Downloaded File1`
- **Version notes:** TypeVersion `3`.
- **Edge cases / failures:**
  - Incorrect fileId mapping → “file not found”.
  - Large files → download timeouts/memory limits.
  - Google-native docs (Docs/Sheets) may require “export” rather than raw download depending on node behavior and file type.

---

### Block 2 — Text Extraction / Contract Text Preparation
**Overview:** Converts downloaded binary to contract text for the AI step. Text files become readable text; other formats are forwarded as “raw extracted content” text.  
**Nodes Involved:** `Extract Text From Downloaded File1`

#### Node: Extract Text From Downloaded File1
- **Type / Role:** Code node (`n8n-nodes-base.code`) — transforms binary into `contractText`.
- **Configuration (interpreted):**
  - Reads the first available binary property from each item (`Object.keys(item.binary)`).
  - Extracts:
    - `fileName` from binary metadata
    - `mimeType` from binary metadata
    - `contractText`:
      - If `mimeType` contains `text` or file ends with `.txt/.md/.html`: `buffer.toString('utf-8')`
      - Else: prefixes an instruction line and appends `buffer.toString('utf-8')` (best-effort for PDF/DOCX).
- **Key variables/fields produced:**
  - `$json.fileName`
  - `$json.mimeType`
  - `$json.contractText`
- **Inputs/Outputs:**
  - **Input:** binary file from `Download file1`
  - **Output:** JSON-only item with above fields (binary not forwarded)
  - **Connected to:** `AI Contract Analysis1`
- **Version notes:** TypeVersion `2`.
- **Edge cases / failures:**
  - No binary data → outputs “No file found in binary data.”
  - PDFs/DOCX are not truly extracted; decoding bytes as UTF-8 often yields gibberish. For reliable PDF/DOCX extraction you typically need a dedicated extractor (PDF parser, LibreOffice conversion, OCR, etc.).
  - Very large buffers may exceed memory or OpenAI token limits downstream.

---

### Block 3 — AI Contract Analysis (OpenAI)
**Overview:** Sends the prepared contract text to an OpenAI model with a strict system/user prompt that demands JSON output and explicit vs inferred risks.  
**Nodes Involved:** `AI Contract Analysis1`

#### Node: AI Contract Analysis1
- **Type / Role:** OpenAI (LangChain) node (`@n8n/n8n-nodes-langchain.openAi`) — LLM call for structured analysis.
- **Configuration (interpreted):**
  - Model: set via `modelId` (cached name shows **GPT-4O-MINI**, but the stored value is `model-name`; in practice you must pick an actual available model ID in your n8n instance).
  - Messages:
    - **System prompt:** defines persona “senior legal contract analyst AI”, requires cautious inference, no fabrication, explicit vs inferred labeling.
    - **User prompt:** provides detailed extraction tasks + mandates **JSON only** with a fixed schema and “Never return empty arrays.”
  - Inserts contract content: `{{ $json.contractText }}`
- **Inputs/Outputs:**
  - **Input:** `{ fileName, mimeType, contractText }`
  - **Output:** LangChain-structured response object (not plain text), used by next code node.
  - **Connected to:** `Format AI Output1`
- **Version notes:** TypeVersion `2.1`.
- **Edge cases / failures:**
  - Model misconfiguration (`model-name` not resolvable) → request fails.
  - Token limits: long contracts may be truncated or rejected.
  - Output may violate JSON-only rule; next node attempts recovery but can still fail.
  - Legal-risk inference: model may output arrays empty despite instruction; formatter expects non-empty but handles empties by returning “No significant risks identified”.

---

### Block 4 — Parse, Flatten, and Evaluate Risk
**Overview:** Extracts AI output text, safely parses JSON, flattens into email/sheet-ready fields, then decides which email template to send.  
**Nodes Involved:** `Format AI Output1`, `Alert Teams Automatically1`

#### Node: Format AI Output1
- **Type / Role:** Code node (`n8n-nodes-base.code`) — normalizes LLM output.
- **Configuration (interpreted):**
  - Attempts to locate the AI textual output at:
    - `item.json.output?.[0]?.content?.find(c => c.type === "output_text")?.text`
  - `safeJsonParse()`:
    - First tries `JSON.parse(text)`
    - If it fails, tries to regex-extract the first `{...}` block and parse that
  - Flattens nested JSON into single-level fields used by Gmail and Sheets.
  - Formats risks arrays into a semicolon-separated string. If array items are objects, expects `{ classification, risk }` and outputs `"classification: risk"`.
- **Key outputs (examples):**
  - `contractType`, `partiesInvolved`, `effectiveDate`, `contractDuration`
  - `fees`, `billingCycle`, `latePaymentPenalties`
  - `renewalType`, `noticePeriod`, `terminationConditions`
  - `obligationsPartyA`, `obligationsPartyB`
  - `financialRisks`, `legalRisks`, `operationalRisks`
  - `importantDatesAndDeadlines`, `overallRiskLevel`, `stakeholderSummary`
- **Inputs/Outputs:**
  - **Input:** LangChain OpenAI response structure
  - **Output:** flattened JSON (or `{error, rawResponse}` on parse failure)
  - **Connected to:** `Alert Teams Automatically1`
- **Version notes:** TypeVersion `2`.
- **Edge cases / failures:**
  - If LangChain output format differs (different node version/model/provider), `rawText` extraction may return empty string → parse fails.
  - If parse fails, downstream IF node will evaluate missing fields; this may route to the “false” branch and still email/log incorrect/empty data unless guarded.

#### Node: Alert Teams Automatically1
- **Type / Role:** IF node (`n8n-nodes-base.if`) — routes notifications.
- **Configuration (interpreted):**
  - Condition group (AND):
    1. `overallRiskLevel` equals **"Medium"**
    2. `financialRisks` does **not** contain `"No significant risks identified"`
    3. `operationalRisks` does **not** contain `"No significant risks identified"`
  - If TRUE → sends “risk alert” email (`Send a message2`)
  - If FALSE → sends “info only” email (`Send a message3`)
- **Inputs/Outputs:**
  - **Input:** flattened fields from `Format AI Output1`
  - **Output (true):** to `Send a message2`
  - **Output (false):** to `Send a message3`
- **Version notes:** TypeVersion `2.3` with conditions version `3`.
- **Edge cases / failures:**
  - Only flags **Medium** (not High). High-risk contracts would go to the FALSE path unless changed.
  - Requires both financial and operational risks to be “significant” (not containing the placeholder). A contract with serious legal risk only may not alert.
  - String containment checks depend on the exact placeholder text from formatter; any changes break routing.

---

### Block 5 — Gmail Notifications (Alert vs Info)
**Overview:** Sends one of two HTML emails summarizing the contract analysis.  
**Nodes Involved:** `Send a message2`, `Send a message3`

#### Node: Send a message2
- **Type / Role:** Gmail (`n8n-nodes-base.gmail`) — sends the “risk alert” style email.
- **Configuration (interpreted):**
  - To: `gmail-id` (placeholder)
  - Subject: `Contract Risk Summary – {{contractType}} | Risk Level: {{overallRiskLevel}}`
  - Message: Large HTML email body with inserted fields (overview, payment, renewal, obligations, risks, dates, summary).
- **Inputs/Outputs:**
  - **Input:** flattened contract fields
  - **Output:** Gmail send result
  - **Connected to:** `Get The Data To Save In google Sheet2`
- **Version notes:** TypeVersion `2.2`.
- **Edge cases / failures:**
  - Gmail credentials not configured / OAuth expired.
  - HTML contains a fenced code block marker ``` in the middle of the template (as literal text in the stored string). This may render oddly in email clients; remove those triple backticks for cleaner HTML.
  - Sending limits/quota issues.

#### Node: Send a message3
- **Type / Role:** Gmail (`n8n-nodes-base.gmail`) — sends the “informational” completion email.
- **Configuration (interpreted):**
  - To: `gmail-id` (placeholder)
  - Subject: `Contract Review Completed – No Immediate Action Required | {{contractType}}`
  - Message: HTML email focused on “no immediate action required”.
- **Inputs/Outputs:**
  - **Input:** flattened contract fields
  - **Output:** Gmail send result
  - **Connected to:** `Get The Data To Save In google Sheet3`
- **Version notes:** TypeVersion `2.2`.
- **Edge cases / failures:**
  - Same Gmail auth/quota risks as above.
  - Also includes ``` markers embedded in HTML which may break formatting.

---

### Block 6 — Prepare Row Payload & Append to Google Sheets
**Overview:** Builds a consistent row structure for the Google Sheet and appends it. The TRUE-path builder is fully implemented; the FALSE-path builder currently adds a dummy field and passes data through, which can break logging consistency.  
**Nodes Involved:** `Get The Data To Save In google Sheet2`, `Get The Data To Save In google Sheet3`, `Append row in sheet1`

#### Node: Get The Data To Save In google Sheet2
- **Type / Role:** Code node — constructs row payload (TRUE/risk-alert path).
- **Configuration (interpreted):**
  - Fetches data directly from the IF node using: `$('Alert Teams Automatically1').first().json`
    - This is designed to work “regardless of which path was taken”, but this node only runs on the TRUE path. It still works, but the comment is misleading.
  - Adds:
    - `processedDate` as ISO string
    - `processedDateTime` localized to `en-IN` with timezone `Asia/Kolkata`
  - Copies all flattened fields into consistent names expected by Sheets mapping.
  - Sets `emailType` to `'Risk Alert'` if overallRiskLevel is Medium, else `'Info Only'`.
- **Inputs/Outputs:**
  - **Input:** Gmail send result from `Send a message2` (not used)
  - **Output:** single item with fields for Sheets
  - **Connected to:** `Append row in sheet1`
- **Version notes:** TypeVersion `2`.
- **Edge cases / failures:**
  - If `Alert Teams Automatically1` has no items (e.g., upstream parse failure stops flow), `.first()` may throw.
  - Locale/timezone formatting depends on runtime ICU support in your n8n environment.

#### Node: Get The Data To Save In google Sheet3
- **Type / Role:** Code node — currently a placeholder transformation (FALSE/info path).
- **Configuration (interpreted):**
  - Loops over input items, adds `myNewField = 1`, returns them.
  - Does **not** build the structured sheet payload (unlike the TRUE path).
- **Inputs/Outputs:**
  - **Input:** Gmail send result from `Send a message3` (not used meaningfully)
  - **Output:** same items + `myNewField`
  - **Connected to:** `Append row in sheet1`
- **Version notes:** TypeVersion `2`.
- **Edge cases / failures:**
  - Because it doesn’t output the required fields, the Sheets append will likely append blank columns or fail schema expectations depending on node settings.
  - This is the main functional inconsistency in the workflow as exported.

#### Node: Append row in sheet1
- **Type / Role:** Google Sheets (`n8n-nodes-base.googleSheets`) — audit logging.
- **Configuration (interpreted):**
  - Operation: **append**
  - Document: `google-sheet-id` (placeholder)
  - Sheet tab: `Sheet1` (`gid=0`)
  - Mapping mode: “defineBelow” with explicit column mappings.
  - Maps many columns to expressions like `={{ $json.fees }}`, `={{ $json.emailType }}`, etc.
- **Inputs/Outputs:**
  - **Input:** prepared row JSON (should come from a builder node)
  - **Output:** append operation result
- **Version notes:** TypeVersion `4.7` (newer Sheets node).
- **Edge cases / failures:**
  - Missing fields on input (especially from the FALSE path) → empty cells or failed mapping expectations.
  - Permission issues to the spreadsheet.
  - Sheet columns must exist and match names exactly (case/spacing).

---

### Block 7 — Documentation / Annotations (Sticky Notes)
**Overview:** In-canvas notes describing purpose and setup steps.  
**Nodes Involved:** `Sticky Note`, `Sticky Note7`, `Sticky Note8`  
(Sticky notes do not execute.)

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Google Drive Trigger1 | googleDriveTrigger | Poll Drive folder for new files | — | Download file1 | ## AI Contract Summary Bot  \nThis workflow automates end-to-end contract analysis using AI. When a new contract is uploaded to a monitored Google Drive folder, the system automatically downloads the file, extracts its contents, analyzes legal and commercial terms, identifies risks, and notifies stakeholders when action is required. All results are logged for audit and compliance tracking.\n\n### How it works\n- Monitors a specific Google Drive folder for newly uploaded contract files\n- Automatically downloads the contract document\n- Extracts readable text from TXT/HTML/MD files and prepares raw content for PDF/DOCX\n- Sends contract content to an AI model trained for legal and commercial analysis\n- Extracts key terms, obligations, payment clauses, renewal and termination details\n- Identifies financial, legal, and operational risks (Explicit and Inferred)\n- Assigns an overall risk level (Low / Medium | High)\n- Sends a risk alert email for medium-risk contracts\n- Sends an informational summary email when no action is required\n- Logs structured contract data, risks, and timestamps into Google Sheets\n\n### Setup steps\n1. Connect Google Drive credentials and select the folder to monitor\n2. Configure Gmail for alert and summary emails\n3. Connect Google Sheets for audit logging\n4. Activate the workflow and upload a contract to test\n\n## Step 1: Contract Ingestion & AI Analysis\nTriggers on new contract upload, downloads the file, extracts text, and sends it to AI for detailed legal and commercial analysis. |
| Download file1 | googleDrive | Download newly created file as binary | Google Drive Trigger1 | Extract Text From Downloaded File1 | (same as above) |
| Extract Text From Downloaded File1 | code | Convert binary to contractText | Download file1 | AI Contract Analysis1 | (same as above) |
| AI Contract Analysis1 | @n8n/n8n-nodes-langchain.openAi | LLM contract analysis to JSON | Extract Text From Downloaded File1 | Format AI Output1 | (same as above) |
| Format AI Output1 | code | Parse JSON from LLM + flatten fields | AI Contract Analysis1 | Alert Teams Automatically1 | ## Step 2: Risk Alerts & Audit Logging\nEvaluates contract risk, sends alert or info emails, and logs structured results with timestamps into Google Sheets. |
| Alert Teams Automatically1 | if | Decide alert vs info path | Format AI Output1 | Send a message2; Send a message3 | (same as above) |
| Send a message2 | gmail | Send risk alert email (Medium + risk conditions) | Alert Teams Automatically1 (true) | Get The Data To Save In google Sheet2 | (same as above) |
| Get The Data To Save In google Sheet2 | code | Build structured row payload + timestamps (true path) | Send a message2 | Append row in sheet1 | (same as above) |
| Send a message3 | gmail | Send informational email (non-alert path) | Alert Teams Automatically1 (false) | Get The Data To Save In google Sheet3 | (same as above) |
| Get The Data To Save In google Sheet3 | code | Placeholder transform (adds myNewField) | Send a message3 | Append row in sheet1 | (same as above) |
| Append row in sheet1 | googleSheets | Append audit row to Sheet1 | Get The Data To Save In google Sheet2; Get The Data To Save In google Sheet3 | — | (same as above) |
| Sticky Note | stickyNote | Canvas documentation | — | — |  |
| Sticky Note7 | stickyNote | Canvas section header (Step 1) | — | — |  |
| Sticky Note8 | stickyNote | Canvas section header (Step 2) | — | — |  |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in n8n.
2. **Add node: Google Drive Trigger**
   - Event: **File Created**
   - Trigger on: **Specific Folder**
   - Choose the folder to monitor
   - Polling interval: **Every hour** (or adjust to your needs)
   - **Credentials:** Add/connect Google Drive OAuth2 credentials with access to that folder.
3. **Add node: Google Drive**
   - Operation: **Download**
   - File ID: map from the trigger output (commonly `{{$json.id}}` depending on trigger payload)
   - **Credentials:** reuse the same Google Drive credentials.
   - Connect: **Google Drive Trigger → Download**
4. **Add node: Code** named “Extract Text From Downloaded File”
   - Paste the extraction logic (binary → `contractText`, plus `fileName`, `mimeType`)
   - Connect: **Download → Extract Text**
5. **Add node: OpenAI (LangChain)**
   - Select a model (e.g., **gpt-4o-mini** or the model available in your environment)
   - Add **System** and **User** messages:
     - System: legal analyst persona + inference rules
     - User: tasks + strict JSON schema + include `{{$json.contractText}}`
   - **Credentials:** Configure OpenAI (API key) or your provider credentials as required by the node.
   - Connect: **Extract Text → OpenAI**
6. **Add node: Code** named “Format AI Output”
   - Implement:
     - Extract LLM output text from the LangChain response object
     - Safe JSON parse with fallback `{...}` extraction
     - Flatten to fields used for notifications and Sheets
   - Connect: **OpenAI → Format AI Output**
7. **Add node: IF** named “Alert Teams Automatically”
   - Conditions (AND):
     - `{{$json.overallRiskLevel}}` equals `"Medium"` (consider expanding to include `"High"`)
     - `{{$json.financialRisks}}` not contains `"No significant risks identified"`
     - `{{$json.operationalRisks}}` not contains `"No significant risks identified"`
   - Connect: **Format AI Output → IF**
8. **Add node: Gmail** named “Send a message (Alert)”
   - Operation: Send email
   - To: your stakeholder email(s)
   - Subject: `Contract Risk Summary – {{$json.contractType}} | Risk Level: {{$json.overallRiskLevel}}`
   - Body: the HTML template referencing flattened fields
   - **Credentials:** Connect Gmail OAuth2 credentials (ensure scopes allow sending).
   - Connect: **IF (true) → Gmail (Alert)**
9. **Add node: Gmail** named “Send a message (Info)”
   - To: your stakeholder email(s)
   - Subject: `Contract Review Completed – No Immediate Action Required | {{$json.contractType}}`
   - Body: informational HTML template
   - Connect: **IF (false) → Gmail (Info)**
10. **Add node: Code** named “Get The Data To Save In Google Sheet (Alert path)”
    - Build a single JSON item with:
      - timestamps (`processedDate`, `processedDateTime`)
      - all flattened fields
      - `emailType` = `Risk Alert` / `Info Only`
    - Connect: **Gmail (Alert) → Sheet Data Builder (Alert)**
11. **Add node: Code** named “Get The Data To Save In Google Sheet (Info path)”
    - Important: do **the same structured payload** as step 10 (do not leave it as a placeholder), otherwise logging will be incomplete.
    - Connect: **Gmail (Info) → Sheet Data Builder (Info)**
12. **Add node: Google Sheets** named “Append row in sheet”
    - Operation: **Append**
    - Select Spreadsheet (Document ID) and Sheet tab (e.g., Sheet1)
    - Use “Define Below” mapping and map each column to the corresponding JSON field (fees, risk strings, obligations, summary, timestamps, emailType, etc.).
    - **Credentials:** Connect Google Sheets OAuth2 credentials with edit access.
    - Connect both builders:
      - **Sheet Data Builder (Alert) → Append row**
      - **Sheet Data Builder (Info) → Append row**
13. **Test**
    - Upload a contract file to the watched Drive folder
    - Confirm:
      - download works
      - AI returns parseable JSON
      - correct email route triggers
      - a row is appended in the sheet

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| The workflow is described as “AI Contract Summary Bot” with end-to-end automation: Drive monitoring → AI analysis → conditional Gmail notifications → Google Sheets audit logging. | From the canvas sticky note content |
| Text extraction is best-effort for PDF/DOCX; for reliable extraction you typically need a dedicated parser/converter/OCR step before the AI call. | Operational consideration based on current extraction approach |
| The Gmail HTML templates contain literal triple-backtick markers (```), which may cause rendering artifacts; remove them for cleaner HTML emails. | Applies to both Gmail nodes’ message bodies |
| The “Info path” Sheets-prep node is a placeholder (adds `myNewField`) and should be replaced with a proper payload builder matching the alert path to keep logs consistent. | Applies to `Get The Data To Save In google Sheet3` |