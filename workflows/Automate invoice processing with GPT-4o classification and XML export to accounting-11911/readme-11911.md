Automate invoice processing with GPT-4o classification and XML export to accounting

https://n8nworkflows.xyz/workflows/automate-invoice-processing-with-gpt-4o-classification-and-xml-export-to-accounting-11911


# Automate invoice processing with GPT-4o classification and XML export to accounting

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Workflow name:** Intelligent Invoice Processing with AI Classification and XML Export  
**Purpose:** End-to-end invoice processing: detect incoming invoice PDFs, extract text, parse key fields, classify/categorize via an AI agent, generate accounting XML, optionally request human approval for risky/high-value invoices, notify stakeholders, and archive results in Google Sheets.  
**Primary use cases:** Small/medium finance ops automation, AP triage, expense categorization, lightweight anomaly detection, and producing XML exports for downstream accounting systems.

### 1.1 Invoice Intake (two entry points)
- Automatically reacts to new files in a Google Drive folder.
- Allows manual uploads via HTTP webhook (for ad-hoc processing or integration from other systems).

### 1.2 File Filtering + Download
- Ensures only PDF files proceed.
- Downloads the PDF binary from Google Drive.

### 1.3 Extraction + Field Parsing
- Extracts text from the PDF.
- Uses regex-based parsing to derive invoice number, date, vendor, total, etc.

### 1.4 AI Classification + Normalization
- Calls an OpenAI chat model through a LangChain Agent node.
- Parses/normalizes the agent output into a predictable classification object and determines whether approval is required.

### 1.5 XML Export + Approval Routing + Notifications + Archival
- Converts structured JSON to XML and formats output fields (XML content, filename, full invoice payload).
- Routes invoices into “approval requested” vs “auto-approved notification”.
- Merges paths, appends a row to Google Sheets, and (if triggered via webhook) responds with JSON.

---

## 2. Block-by-Block Analysis

### Block 1 — Invoice Intake (Triggers)
**Overview:** Provides two entry points (Drive polling trigger and webhook) and merges them into a unified flow so the rest of the pipeline is identical.

**Nodes involved:**
- New Invoice Trigger
- Manual Upload Trigger
- Merge Triggers

#### Node: New Invoice Trigger
- **Type / role:** `Google Drive Trigger` — detects new files created in a folder.
- **Configuration (interpreted):**
  - Event: `fileCreated`
  - Polling: every minute
  - Trigger scope: `specificFolder` but **folderToWatch value is empty** (must be set).
- **Input/Output:**
  - Entry node (no input).
  - Output → Merge Triggers (input index 0).
- **Version notes:** typeVersion 1.
- **Edge cases / failures:**
  - Misconfigured/empty folder selection results in no events.
  - OAuth token expiration/insufficient scopes.
  - Poll-based triggers can miss rapid create/delete cycles depending on Drive behavior.

#### Node: Manual Upload Trigger
- **Type / role:** `Webhook` — manual/remote invoice submission endpoint.
- **Configuration (interpreted):**
  - Method: POST
  - Path: `/process-invoice`
  - `responseMode: responseNode` (expects a Respond to Webhook node later)
  - `onError: continueRegularOutput` (workflow continues even if the webhook node errors).
- **Input/Output:**
  - Entry node (no input).
  - Output → Merge Triggers (input index 1).
- **Version notes:** typeVersion 2.
- **Edge cases / failures:**
  - If webhook payload does not contain fields compatible with later nodes (e.g., `id`, `name`/`fileName`), the PDF filter/download steps may fail.
  - If the workflow execution doesn’t reach Respond to Webhook, the HTTP caller may time out.

#### Node: Merge Triggers
- **Type / role:** `Merge` — chooses one of the incoming branches.
- **Configuration (interpreted):**
  - Mode: `chooseBranch` (passes through whichever trigger fired).
- **Input/Output:**
  - Inputs: Drive trigger (index 0), Webhook trigger (index 1)
  - Output → Filter PDF Files
- **Version notes:** typeVersion 3.
- **Edge cases / failures:**
  - If both branches deliver different schemas, downstream expressions (`$json.id`, `$json.name`) may be missing.

---

### Block 2 — PDF Filtering, Download, and Text Extraction
**Overview:** Ensures the item is a PDF, downloads it from Drive, and extracts text for parsing.

**Nodes involved:**
- Filter PDF Files
- Download Invoice PDF
- Extract PDF Text

#### Node: Filter PDF Files
- **Type / role:** `Filter` — gate to allow only PDFs.
- **Configuration (interpreted):**
  - Condition: `endsWith(".pdf")` on `{{ $json.name || $json.fileName || '' }}`
  - Case-insensitive; loose type validation.
- **Input/Output:**
  - Input: Merge Triggers
  - Output → Download Invoice PDF (only if condition passes)
- **Version notes:** typeVersion 2.2.
- **Edge cases / failures:**
  - Google Drive trigger typically provides `name`; webhook may use `fileName`.
  - If neither exists, empty string fails filter and the workflow ends without further action.

#### Node: Download Invoice PDF
- **Type / role:** `Google Drive` — downloads the file binary.
- **Configuration (interpreted):**
  - Operation: `download`
  - File ID: `{{ $json.id }}`
- **Input/Output:**
  - Input: Filter PDF Files
  - Output → Extract PDF Text
- **Version notes:** typeVersion 3.
- **Edge cases / failures:**
  - If the webhook path doesn’t provide a Drive file `id`, this node will fail.
  - Permissions/scopes issues can cause 403/404.
  - Very large PDFs may increase execution time/memory usage.

#### Node: Extract PDF Text
- **Type / role:** `Extract From File` — parses PDF content to text.
- **Configuration (interpreted):**
  - Operation: `pdf`
- **Input/Output:**
  - Input: Download Invoice PDF (expects binary content)
  - Output → Parse Invoice Data
- **Version notes:** typeVersion 1.
- **Edge cases / failures:**
  - Scanned/image-only PDFs often yield empty/low-quality text (no OCR here).
  - Encrypted PDFs may fail extraction.

---

### Block 3 — Field Parsing (Regex)
**Overview:** Converts raw extracted text into a structured invoice object using regex patterns and defaults.

**Nodes involved:**
- Parse Invoice Data

#### Node: Parse Invoice Data
- **Type / role:** `Code` — extracts key fields from PDF text.
- **Configuration (interpreted):**
  - Reads first input item and uses `item.json.text`.
  - Regex patterns:
    - invoiceNumber: `/invoice\s*#?:?\s*([A-Z0-9-]+)/i`
    - date: `/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/`
    - total: `/total:?\s*\$?([\d,]+\.?\d*)/i`
    - vendor: `/from:?\s*([^\n]+)/i`
    - dueDate: `/due\s*date:?\s*(...)/i`
  - Outputs:
    - `rawText` (first 2000 chars)
    - `invoiceNumber` default `UNKNOWN`
    - `invoiceDate` default today (YYYY-MM-DD)
    - `totalAmount` parsed float (commas: only first comma replaced)
    - `vendorName` default `Unknown Vendor`
    - `dueDate` nullable
    - `fileName` default `invoice.pdf` (uses `item.json.fileName`, not Drive `name`)
    - `processedAt` ISO timestamp
- **Input/Output:**
  - Input: Extract PDF Text
  - Output → AI Invoice Classifier
- **Version notes:** typeVersion 2.
- **Edge cases / failures:**
  - Date regex grabs the *first* date-like string (may be invoice date, due date, or footer).
  - Total regex depends on the word “total”; may capture subtotal or total due inconsistently.
  - `replace(',', '')` only removes one comma; values like `1,234,567.89` become `1234,567.89` → parseFloat stops early.
  - Vendor extraction assumes a “From:” label; many invoices won’t match.

---

### Block 4 — AI Classification (LLM + Agent) and Result Parsing
**Overview:** Uses an OpenAI chat model via LangChain Agent to classify the invoice and then parses the output into a reliable JSON structure, computing approval flags.

**Nodes involved:**
- OpenAI Chat Model
- AI Invoice Classifier
- Parse AI Classification

#### Node: OpenAI Chat Model
- **Type / role:** `lmChatOpenAi` (LangChain) — provides the LLM backend to the agent.
- **Configuration (interpreted):**
  - Model: `gpt-4o-mini`
  - Temperature: 0.2
- **Input/Output:**
  - Output (AI language model connection) → AI Invoice Classifier
- **Version notes:** typeVersion 1.2.
- **Edge cases / failures:**
  - Missing/invalid OpenAI credentials.
  - Model availability/renaming changes.
  - Rate limits/timeouts.

#### Node: AI Invoice Classifier
- **Type / role:** `LangChain Agent` — prompts the model with invoice fields and requests strict JSON.
- **Configuration (interpreted):**
  - Prompt includes: invoice number, vendor, amount, date, and a 500-char raw text excerpt.
  - Requires output JSON schema with:
    - category (one of fixed list)
    - glCode
    - confidence (0–1)
    - requiresApproval (true if amount > 5000 or low confidence)
    - anomalyDetected + reason
    - summary
  - System message: “expert accountant AI…”
- **Input/Output:**
  - Input: Parse Invoice Data
  - Output → Parse AI Classification
  - LLM dependency: OpenAI Chat Model connected via `ai_languageModel`
- **Version notes:** typeVersion 1.7.
- **Edge cases / failures:**
  - Agent may output non-JSON or additional text; downstream parsing tries to recover.
  - If `rawText` is empty (scanned PDF), classification quality drops, possibly causing false anomalies/low confidence.

#### Node: Parse AI Classification
- **Type / role:** `Code` — extracts JSON from the agent response and merges with original invoice fields.
- **Configuration (interpreted):**
  - Reads agent output from `item.json.output || item.json.text`.
  - Extracts first `{ ... }` block via regex `/\{[\s\S]*\}/` and `JSON.parse`.
  - On failure, substitutes fallback classification:
    - category Other, glCode 6900, confidence 0.5, requiresApproval true, summary indicates failure.
  - Pulls original invoice data using node reference: `$('Parse Invoice Data').first().json`.
  - Computes:
    - `needsApproval = classification.requiresApproval || totalAmount > 5000`
    - `processingStatus = 'classified'`
- **Input/Output:**
  - Input: AI Invoice Classifier
  - Output → Convert to XML
- **Version notes:** typeVersion 2.
- **Edge cases / failures:**
  - If the agent returns multiple JSON objects, regex may capture too much or invalid JSON.
  - Node reference `$('Parse Invoice Data')...` assumes that node executed in the same run and has an item; multi-item runs can cause mismatches.
  - Approval logic duplicates the “> 5000” rule (also checked later).

---

### Block 5 — XML Generation, Approval Routing, Notifications, Archival, Webhook Response
**Overview:** Converts the structured invoice payload to XML, formats it into a convenient structure, routes approval vs notification, archives to Sheets, and responds to webhook callers.

**Nodes involved:**
- Convert to XML
- Format XML Output
- Needs Approval?
- Request Approval Email
- Slack Notification
- Merge Processing Paths
- Archive to Google Sheets
- Respond to Webhook

#### Node: Convert to XML
- **Type / role:** `XML` — converts JSON → XML string.
- **Configuration (interpreted):**
  - Mode: `jsonToxml`
  - Root element: `Invoice`
- **Input/Output:**
  - Input: Parse AI Classification (entire invoice object)
  - Output → Format XML Output
- **Version notes:** typeVersion 1.
- **Edge cases / failures:**
  - Nested objects (like `classification`) become nested XML; downstream accounting system may require a specific schema not enforced here.
  - XML encoding/escaping issues can appear with special characters in vendor names/summary.

#### Node: Format XML Output
- **Type / role:** `Set` — creates a clean payload containing XML content, a deterministic filename, and the full invoice data.
- **Configuration (interpreted):**
  - `xmlContent = {{ $json.data }}` (expects XML node output in `data`)
  - `fileName = invoice_{{ invoiceNumber }}_{{ $now.format('yyyyMMdd') }}.xml` (invoice number pulled from Parse Invoice Data)
  - `invoiceData = {{ $('Parse AI Classification').first().json }}`
- **Input/Output:**
  - Input: Convert to XML
  - Output → Needs Approval?
- **Version notes:** typeVersion 3.4.
- **Edge cases / failures:**
  - If the XML node returns the XML string under a different key than `data`, `xmlContent` will be empty.
  - Filename relies on `Parse Invoice Data` reference; if invoiceNumber is UNKNOWN, filenames collide more often.

#### Node: Needs Approval?
- **Type / role:** `If` — routes invoices based on approval requirements.
- **Configuration (interpreted):**
  - OR conditions:
    - `invoiceData.needsApproval == true`
    - `invoiceData.totalAmount > 5000`
- **Input/Output:**
  - Input: Format XML Output
  - True branch → Request Approval Email
  - False branch → Slack Notification
- **Version notes:** typeVersion 2.
- **Edge cases / failures:**
  - Duplicates high-value condition already computed earlier; inconsistent thresholds could cause confusion if later edited in only one place.
  - If `invoiceData` missing, expressions fail or evaluate unexpectedly (strict validation enabled).

#### Node: Request Approval Email
- **Type / role:** `Gmail` — emails an approver when approval is required.
- **Configuration (interpreted):**
  - To: `user@example.com` (placeholder)
  - Subject/body include invoice fields and AI summary.
- **Input/Output:**
  - Input: Needs Approval? (true branch)
  - Output → Merge Processing Paths
- **Version notes:** typeVersion 2.1.
- **Edge cases / failures:**
  - Gmail OAuth missing/expired.
  - Sending limits / spam policies.
  - Placeholder recipient must be replaced for production.

#### Node: Slack Notification
- **Type / role:** `Slack` — posts a processing notification.
- **Configuration (interpreted):**
  - Channel: `#finance-notifications` (selected by name)
  - Message includes invoice number, vendor, amount, category, and status derived from `needsApproval`.
- **Input/Output:**
  - Input: Needs Approval? (false branch)
  - Output → Merge Processing Paths
- **Version notes:** typeVersion 2.2.
- **Edge cases / failures:**
  - Slack bot token missing/expired, channel not found, bot not in channel.
  - Channel selection by name can break if renamed; channel ID is safer.

#### Node: Merge Processing Paths
- **Type / role:** `Merge` — recombines “approval email sent” and “slack notified” paths.
- **Configuration (interpreted):**
  - Default merge behavior (no explicit mode set in parameters).
- **Input/Output:**
  - Inputs: from Request Approval Email and Slack Notification
  - Output → Archive to Google Sheets
- **Version notes:** typeVersion 3.
- **Edge cases / failures:**
  - Depending on merge mode default, could wait for both branches (causing a stall). In practice, n8n merge defaults can be confusing—set an explicit mode (e.g., “Pass-through”) if you want either branch to continue independently.

#### Node: Archive to Google Sheets
- **Type / role:** `Google Sheets` — appends a row for recordkeeping.
- **Configuration (interpreted):**
  - Operation: `append`
  - `documentId` and `sheetName` are empty (must be configured).
- **Input/Output:**
  - Input: Merge Processing Paths
  - Output → Respond to Webhook
- **Version notes:** typeVersion 4.5.
- **Edge cases / failures:**
  - Missing sheet/document selection results in runtime failure.
  - Column mapping isn’t shown; append will follow node’s configured fields—must align with sheet headers.

#### Node: Respond to Webhook
- **Type / role:** `Respond to Webhook` — returns a JSON response to webhook callers.
- **Configuration (interpreted):**
  - Respond with JSON:
    - `{ success: true, invoiceNumber, status: pending_approval | processed }`
- **Input/Output:**
  - Input: Archive to Google Sheets
  - Output: ends workflow (HTTP response)
- **Version notes:** typeVersion 1.1.
- **Edge cases / failures:**
  - If the execution started from Google Drive trigger, this node still runs but has no requester; it generally won’t be used (harmless, but unnecessary).
  - If the workflow errors before reaching this node on webhook runs, the caller may not receive a proper response (despite `onError` on the webhook node).

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Sticky Note | Sticky Note | Documentation block (overview) |  |  | ## Intelligent Invoice Processing with AI Classification and XML Export; Overview; Key Features; Required Credentials; Processing Flow |
| Sticky Note1 | Sticky Note | Documentation block (Step 1) |  |  | ### Step 1: Invoice Detection; Monitor Google Drive folder; Filter for PDF files only; Download invoice content |
| Sticky Note2 | Sticky Note | Documentation block (Step 2) |  |  | ### Step 2: Data Extraction; Extract text from PDF; Parse invoice fields; Structure data for AI analysis |
| Sticky Note3 | Sticky Note | Documentation block (Step 3) |  |  | ### Step 3: AI Classification; AI Agent categorizes expense; Detects unusual patterns; Suggests GL codes; Determines approval needs |
| Sticky Note4 | Sticky Note | Documentation block (Step 4) |  |  | ### Step 4: Export & Archive; Convert to XML format; Route high-value for approval; Archive to Sheets; Send notifications |
| New Invoice Trigger | Google Drive Trigger | Detect new invoice files in Drive | — | Merge Triggers | ### Step 1: Invoice Detection; Monitor Google Drive folder; Filter for PDF files only; Download invoice content |
| Manual Upload Trigger | Webhook | Manual/API-triggered processing entry | — | Merge Triggers | ### Step 1: Invoice Detection; Monitor Google Drive folder; Filter for PDF files only; Download invoice content |
| Merge Triggers | Merge | Unify trigger paths | New Invoice Trigger; Manual Upload Trigger | Filter PDF Files | ### Step 1: Invoice Detection; Monitor Google Drive folder; Filter for PDF files only; Download invoice content |
| Filter PDF Files | Filter | Allow only PDFs | Merge Triggers | Download Invoice PDF | ### Step 1: Invoice Detection; Monitor Google Drive folder; Filter for PDF files only; Download invoice content |
| Download Invoice PDF | Google Drive | Download PDF binary | Filter PDF Files | Extract PDF Text | ### Step 1: Invoice Detection; Monitor Google Drive folder; Filter for PDF files only; Download invoice content |
| Extract PDF Text | Extract From File | Extract text from PDF | Download Invoice PDF | Parse Invoice Data | ### Step 2: Data Extraction; Extract text from PDF; Parse invoice fields; Structure data for AI analysis |
| Parse Invoice Data | Code | Regex parse invoice fields | Extract PDF Text | AI Invoice Classifier | ### Step 2: Data Extraction; Extract text from PDF; Parse invoice fields; Structure data for AI analysis |
| OpenAI Chat Model | OpenAI Chat (LangChain) | LLM provider for agent | — | AI Invoice Classifier (ai_languageModel) | ### Step 3: AI Classification; AI Agent categorizes expense; Detects unusual patterns; Suggests GL codes; Determines approval needs |
| AI Invoice Classifier | LangChain Agent | Classify invoice & suggest GL code | Parse Invoice Data; OpenAI Chat Model | Parse AI Classification | ### Step 3: AI Classification; AI Agent categorizes expense; Detects unusual patterns; Suggests GL codes; Determines approval needs |
| Parse AI Classification | Code | Parse agent output; compute approval flag | AI Invoice Classifier | Convert to XML | ### Step 3: AI Classification; AI Agent categorizes expense; Detects unusual patterns; Suggests GL codes; Determines approval needs |
| Convert to XML | XML | JSON → XML conversion | Parse AI Classification | Format XML Output | ### Step 4: Export & Archive; Convert to XML format; Route high-value for approval; Archive to Sheets; Send notifications |
| Format XML Output | Set | Build final payload (XML, filename, invoiceData) | Convert to XML | Needs Approval? | ### Step 4: Export & Archive; Convert to XML format; Route high-value for approval; Archive to Sheets; Send notifications |
| Needs Approval? | IF | Route approval vs auto-notify | Format XML Output | Request Approval Email; Slack Notification | ### Step 4: Export & Archive; Convert to XML format; Route high-value for approval; Archive to Sheets; Send notifications |
| Request Approval Email | Gmail | Email approver for review | Needs Approval? (true) | Merge Processing Paths | ### Step 4: Export & Archive; Convert to XML format; Route high-value for approval; Archive to Sheets; Send notifications |
| Slack Notification | Slack | Post processing message | Needs Approval? (false) | Merge Processing Paths | ### Step 4: Export & Archive; Convert to XML format; Route high-value for approval; Archive to Sheets; Send notifications |
| Merge Processing Paths | Merge | Rejoin branches | Request Approval Email; Slack Notification | Archive to Google Sheets | ### Step 4: Export & Archive; Convert to XML format; Route high-value for approval; Archive to Sheets; Send notifications |
| Archive to Google Sheets | Google Sheets | Append archival record | Merge Processing Paths | Respond to Webhook | ### Step 4: Export & Archive; Convert to XML format; Route high-value for approval; Archive to Sheets; Send notifications |
| Respond to Webhook | Respond to Webhook | Return JSON response to webhook caller | Archive to Google Sheets | — | ### Step 4: Export & Archive; Convert to XML format; Route high-value for approval; Archive to Sheets; Send notifications |

---

## 4. Reproducing the Workflow from Scratch

1) **Create a new workflow**
   - Name it: **Intelligent Invoice Processing with AI Classification and XML Export**
   - (Optional) Add a Sticky Note describing overview/credentials.

2) **Add Trigger A: Google Drive Trigger**
   - Node: **Google Drive Trigger**
   - Event: **File Created**
   - Trigger on: **Specific folder**
   - Polling: **Every minute**
   - Select **Folder to Watch** (required)
   - Credentials: **Google Drive OAuth2**

3) **Add Trigger B: Webhook**
   - Node: **Webhook**
   - HTTP Method: **POST**
   - Path: **process-invoice**
   - Response mode: **Using “Respond to Webhook” node**
   - Note: Define what the caller sends. If you want to reuse the Drive download step, ensure the webhook payload includes at least:
     - `id` (Drive file id)
     - `fileName` or `name` (ending with `.pdf`)

4) **Merge triggers**
   - Node: **Merge**
   - Mode: **Choose Branch**
   - Connect:
     - Google Drive Trigger → Merge (Input 1)
     - Webhook → Merge (Input 2)

5) **Filter PDFs**
   - Node: **Filter**
   - Condition (String → endsWith):
     - Left value: `{{ $json.name || $json.fileName || '' }}`
     - Right value: `.pdf`
   - Connect: Merge → Filter

6) **Download PDF from Drive**
   - Node: **Google Drive**
   - Operation: **Download**
   - File ID: `{{ $json.id }}`
   - Credentials: **Google Drive OAuth2**
   - Connect: Filter → Google Drive (download)

7) **Extract PDF text**
   - Node: **Extract From File**
   - Operation: **PDF**
   - Connect: Download → Extract

8) **Parse invoice fields (Code)**
   - Node: **Code**
   - Paste logic equivalent to:
     - Read `item.json.text`
     - Regex extract invoice number/date/total/vendor/due date
     - Output fields: `rawText`, `invoiceNumber`, `invoiceDate`, `totalAmount`, `vendorName`, `dueDate`, `fileName`, `processedAt`
   - Connect: Extract → Code

9) **Add OpenAI chat model (LangChain)**
   - Node: **OpenAI Chat Model** (LangChain)
   - Model: **gpt-4o-mini**
   - Temperature: **0.2**
   - Credentials: **OpenAI API key**

10) **Add AI Agent for classification**
   - Node: **AI Agent** (LangChain Agent)
   - System message: accountant specialization
   - User text prompt: include invoice fields and request **strict JSON** with keys:
     - `category`, `glCode`, `confidence`, `requiresApproval`, `anomalyDetected`, `anomalyReason`, `summary`
   - Connect:
     - Parse Invoice Data (Code) → Agent (main)
     - OpenAI Chat Model → Agent (ai_languageModel connection)

11) **Parse/normalize AI output (Code)**
   - Node: **Code**
   - Implement:
     - Extract JSON object from agent output text
     - Fallback classification on parse failure
     - Merge with original parsed invoice data (via node reference)
     - Compute `needsApproval`
   - Connect: Agent → Parse AI Classification

12) **Convert JSON to XML**
   - Node: **XML**
   - Mode: **JSON to XML**
   - Root name: **Invoice**
   - Connect: Parse AI Classification → XML

13) **Format XML output**
   - Node: **Set**
   - Add fields:
     - `xmlContent` = `{{ $json.data }}` (or adjust to actual XML node output key)
     - `fileName` = `invoice_{{ $('Parse Invoice Data').first().json.invoiceNumber }}_{{ $now.format('yyyyMMdd') }}.xml`
     - `invoiceData` = `{{ $('Parse AI Classification').first().json }}`
   - Connect: XML → Set

14) **Approval routing**
   - Node: **IF**
   - OR conditions:
     - `{{ $json.invoiceData.needsApproval }}` equals `true`
     - `{{ $json.invoiceData.totalAmount }}` greater than `5000`
   - Connect: Set → IF

15) **Approval email (true branch)**
   - Node: **Gmail**
   - Operation: **Send**
   - To: replace `user@example.com` with real approver(s)
   - Subject/body: include invoice fields + AI summary
   - Credentials: **Gmail OAuth2**
   - Connect: IF (true) → Gmail

16) **Slack notification (false branch)**
   - Node: **Slack**
   - Post message to channel `#finance-notifications` (or select channel ID)
   - Credentials: **Slack Bot Token**
   - Connect: IF (false) → Slack

17) **Merge the branches**
   - Node: **Merge**
   - Important: set an explicit merge mode that fits your intent (commonly **Pass-through / Wait for either** behavior).
   - Connect:
     - Gmail → Merge
     - Slack → Merge

18) **Archive to Google Sheets**
   - Node: **Google Sheets**
   - Operation: **Append**
   - Select Spreadsheet (Document ID) and Sheet name (required)
   - Map columns (typical fields):
     - processedAt, invoiceNumber, vendorName, totalAmount, category, glCode, confidence, needsApproval, anomalyDetected, summary, fileName, xmlContent
   - Credentials: **Google Sheets OAuth2**
   - Connect: Merge → Google Sheets

19) **Respond to webhook (for webhook-triggered runs)**
   - Node: **Respond to Webhook**
   - Respond with: JSON
   - Body (expression):  
     `{{ { success: true, invoiceNumber: $json.invoiceData.invoiceNumber, status: $json.invoiceData.needsApproval ? 'pending_approval' : 'processed' } }}`
   - Connect: Google Sheets → Respond to Webhook

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| Required credentials listed in the workflow notes: Google Drive OAuth, OpenAI API key, Slack Bot Token, Google Sheets OAuth, Gmail OAuth. | Credential prerequisites |
| Webhook input schema is not enforced; to reuse Drive download, webhook callers should supply a Drive file `id` and a `.pdf` filename field (`name` or `fileName`). | Integration constraint |
| PDF extraction is text-based only (no OCR). Scanned invoices may produce empty text and degrade parsing/classification. | Data quality limitation |
| Google Drive folderToWatch, Google Sheets documentId/sheetName, and Gmail recipient are empty/placeholders and must be configured. | Mandatory configuration before production use |