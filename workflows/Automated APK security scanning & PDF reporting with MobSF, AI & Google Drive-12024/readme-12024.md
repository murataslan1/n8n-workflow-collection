Automated APK security scanning & PDF reporting with MobSF, AI & Google Drive

https://n8nworkflows.xyz/workflows/automated-apk-security-scanning---pdf-reporting-with-mobsf--ai---google-drive-12024


# Automated APK security scanning & PDF reporting with MobSF, AI & Google Drive

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Title:** Automated APK security scanning & PDF reporting with MobSF, AI & Google Drive  
**Workflow name (in JSON):** APK Security Scanner & PDF Report Generator

**Purpose:**  
Automatically detect newly uploaded Android APK files in a specific Google Drive folder, scan them using **MobSF** (Mobile Security Framework) via API, summarize the scan results, generate a well-structured **HTML security report** with **OpenAI**, convert the HTML to a **PDF** using **PDF.co**, then upload the PDF back to Google Drive.

**Target use cases:**
- Automated mobile app security triage for dev teams or QA
- Reproducible security reporting for APK drops (CI-like behavior using Drive as an intake queue)
- Centralized report archiving in Google Drive

### Logical blocks
**1.1 Input reception (Google Drive intake)**  
Trigger on new file in a Drive folder → download the APK.

**1.2 MobSF upload & scan**  
Upload APK to MobSF → start/force scan → receive JSON report.

**1.3 Summarize & generate HTML report (AI)**  
Reduce MobSF JSON into a developer-oriented summary → ask OpenAI to render pure semantic HTML.

**1.4 Convert HTML to PDF & store**  
Clean HTML → convert via PDF.co → download PDF binary → upload back to Drive.

---

## 2. Block-by-Block Analysis

### 2.1 Input reception (Google Drive intake)

**Overview:**  
Watches a dedicated Google Drive folder for new APK uploads and downloads the newly created file as binary data for further processing.

**Nodes involved:**
- Watch APK Uploads
- Download APK File

#### Node: Watch APK Uploads
- **Type / role:** `googleDriveTrigger` — Poll-based trigger for new files.
- **Configuration (interpreted):**
  - Event: **fileCreated**
  - Trigger scope: **specific folder**
  - Folder watched: Google Drive folder ID `1Rcs1PQWaE2dP1IV5d-Nv1ZsdunIkTUyL` (“APK Uploads Folder”)
  - Polling cadence: **every minute**
- **Key variables / expressions:** None.
- **Inputs:** Entry node (no inputs).
- **Outputs:** Sends file metadata (including links like `webViewLink`) to **Download APK File**.
- **Credentials:** Google Drive OAuth2 required.
- **Failure / edge cases:**
  - OAuth token expired / missing scopes (Drive read access).
  - Polling may miss events if permissions change or files are moved quickly.
  - Non-APK files: trigger will still fire unless additional filtering is added (not present).

#### Node: Download APK File
- **Type / role:** `googleDrive` (operation: download) — Retrieves file content as binary.
- **Configuration (interpreted):**
  - Operation: **download**
  - File identifier is set via expression: `={{ $json.webViewLink }}`
    - This is unusual: Drive download typically expects a **fileId**, not a webViewLink URL. It may still work depending on node internals, but it is a common source of failure.
- **Key expressions:**
  - `fileId = {{ $json.webViewLink }}`
- **Inputs:** From **Watch APK Uploads**.
- **Outputs:** Binary data placed in the node’s default binary property (commonly `data`) to **Upload APK to Analyzer**.
- **Credentials:** Google Drive OAuth2 required.
- **Failure / edge cases:**
  - If `webViewLink` is absent (some Drive events/configs don’t include it), download fails.
  - If node strictly requires `fileId`, using `webViewLink` will error (“File not found” / invalid ID).
  - Large APKs can hit memory/time limits depending on n8n instance settings.

**Sticky note covering this block:**
- **Detect APK Upload & Fetch File**  
  “This part waits for a new APK file uploaded to Google Drive… downloads it for security analysis…”

---

### 2.2 MobSF upload & scan

**Overview:**  
Uploads the APK binary to a locally hosted MobSF instance and triggers a scan using the returned hash.

**Nodes involved:**
- Upload APK to Analyzer
- Start Security Scan

#### Node: Upload APK to Analyzer
- **Type / role:** `httpRequest` — POST multipart upload to MobSF.
- **Configuration (interpreted):**
  - URL: `http://localhost:8000/api/v1/upload`
  - Method: POST
  - Content-Type: **multipart/form-data**
  - Body:
    - `file` comes from binary field **data** (`formBinaryData`, `inputDataFieldName: "data"`)
  - Headers:
    - `Authorization`: configured but **empty** in the JSON (must be set to MobSF API key format expected by your MobSF deployment).
- **Key variables / expressions:**
  - Binary source field: `data`
- **Inputs:** Binary APK from **Download APK File**.
- **Outputs:** MobSF upload response (expected to include `hash`) to **Start Security Scan**.
- **Version-specific notes:** Node typeVersion `4.3` (HTTP Request node variant in newer n8n).
- **Failure / edge cases:**
  - `localhost:8000` only works if n8n runs on the same host/network namespace as MobSF (Docker networking frequently breaks this; you may need `host.docker.internal` or a container network alias).
  - Missing/invalid `Authorization` header causes 401/403.
  - If binary field name isn’t `data`, upload body is empty and MobSF returns error.
  - Large files may require increased request size limits.

#### Node: Start Security Scan
- **Type / role:** `httpRequest` — Triggers MobSF scan using uploaded hash.
- **Configuration (interpreted):**
  - URL: `http://localhost:8000/api/v1/scan`
  - Method: POST
  - Content-Type: multipart/form-data
  - Body:
    - `hash = {{ $json.hash }}`
    - `re_scan = 1` (forces re-scan)
  - Headers:
    - `Authorization`: set to `"f"` in JSON (almost certainly a placeholder; must be replaced with valid MobSF API key header value).
- **Key expressions:**
  - `hash = {{ $json.hash }}`
- **Inputs:** JSON from **Upload APK to Analyzer** containing `hash`.
- **Outputs:** MobSF scan JSON report to **Summarize MobSF Report1**.
- **Failure / edge cases:**
  - Invalid hash: scan fails.
  - MobSF may respond before analysis is fully complete depending on MobSF mode/version; if so you may need a “report/status polling” step (not present).
  - Authorization mismatch between upload vs scan (both must be valid).

**Sticky note covering this block:**
- **Upload & Scan the APK for Security Issues**  
  “The downloaded APK is uploaded to the MobSF analyzer… collects the raw JSON results…”

---

### 2.3 Summarize & generate HTML report (AI)

**Overview:**  
Transforms the large MobSF JSON into a concise summary focused on actionable risks, then uses an OpenAI model to render a structured HTML report. A small cleanup step normalizes the HTML output format for PDF conversion.

**Nodes involved:**
- Summarize MobSF Report1
- Generate HTML Report
- Clean HTML Output

#### Node: Summarize MobSF Report1
- **Type / role:** `code` — Custom JavaScript summarization/normalization.
- **Configuration (interpreted):**
  - Iterates through all input items.
  - Uses `item.json.json || item.json` to handle nesting (MobSF output sometimes embedded).
  - Constructs a new `report` object with:
    - `appInfo` (name, version, package, md5, min/target SDK)
    - `manifestAnalysis` including only severities **high** or **warning**
    - `codeAnalysis` extracts findings of severity **High** or **Medium**, adds:
      - `type` (key name)
      - `affected_files_count`
    - `dangerousPermissions` where permissions status is `"dangerous"`
    - `securityHighlights` for network security and firebase
    - `trackers` list (names + count)
  - Replaces `item.json` entirely with this summarized report.
- **Key variables / assumptions:**
  - Expects MobSF fields: `app_name`, `version_name`, `package_name`, `md5`, `min_sdk`, `target_sdk`
  - Manifest: `manifest_analysis.manifest_findings` with `severity`
  - Code analysis: `code_analysis.findings` object with `metadata.severity` and `files`
  - Permissions: `permissions[perm].status === 'dangerous'`
- **Inputs:** MobSF scan JSON from **Start Security Scan**.
- **Outputs:** Summarized JSON to **Generate HTML Report**.
- **Failure / edge cases:**
  - If MobSF schema differs (version differences), paths like `code_analysis.findings` may be missing → block silently produces partial output.
  - Severity capitalization differs across sections (`high/warning` vs `High/Medium`)—this is handled only for the exact strings used.
  - If `finding.files` is missing, `Object.keys(finding.files)` will throw; current code assumes it exists.

#### Node: Generate HTML Report
- **Type / role:** `@n8n/n8n-nodes-langchain.openAi` — Uses OpenAI chat model to generate HTML from JSON.
- **Configuration (interpreted):**
  - Model: `gpt-4.1-mini`
  - Prompt instructs:
    - Output **pure HTML only** (no Markdown, no code blocks, no scripts)
    - Use semantic HTML tags
    - Produce sections 1–7 (App info, manifest warnings, dangerous permissions, trackers, optimization notes, Play Store risks, recommendations)
  - Injects the summarized JSON: `{{JSON.stringify($json)}}`
- **Key expressions:**
  - `{{ JSON.stringify($json) }}`
- **Inputs:** Summarized report from **Summarize MobSF Report1**.
- **Outputs:** Provider-specific structured output (later parsed by the cleaning code) to **Clean HTML Output**.
- **Credentials:** OpenAI API credential required.
- **Failure / edge cases:**
  - Model may still return non-HTML or include unwanted wrappers; cleaning assumes a specific response structure.
  - Token limits: very large summaries could truncate output (less likely after summarization, but still possible).
  - If OpenAI node output schema changes between node versions, downstream parser breaks.

#### Node: Clean HTML Output
- **Type / role:** `code` — Extracts HTML text and normalizes formatting for PDF.co.
- **Configuration (interpreted):**
  - Reads HTML from: `$json["output"][0]["content"][0]["text"]`
  - Removes `\n` and `\t`
  - Unescapes `\"` and reduces double backslashes
  - Returns `{ cleaned_html: html }`
- **Key variables / assumptions:**
  - Assumes OpenAI node outputs JSON in the specific nested structure:
    - `output[0].content[0].text`
- **Inputs:** Output of **Generate HTML Report**.
- **Outputs:** `cleaned_html` field to **Generate PDF**.
- **Failure / edge cases:**
  - If the OpenAI node returns a different shape (common across versions/providers), this line throws (`Cannot read properties of undefined`).
  - Unescaping may corrupt valid HTML entities if the source isn’t escaped the way expected.

**Sticky note covering this block:**
- **Create a Clean Security Report**  
  “Processes the MobSF data… AI converts… HTML is cleaned to prepare for PDF generation…”

---

### 2.4 Convert HTML to PDF & store

**Overview:**  
Sends cleaned HTML to PDF.co for HTML→PDF conversion, downloads the resulting PDF file, then uploads it to Google Drive.

**Nodes involved:**
- Generate PDF
- Download Generated PDF
- Upload PDF to Google Drive

#### Node: Generate PDF
- **Type / role:** `httpRequest` — Calls PDF.co conversion endpoint.
- **Configuration (interpreted):**
  - URL: `https://api.pdf.co/v1/pdf/convert/from/html`
  - Method: POST
  - Body parameters:
    - `html = {{ $json.cleaned_html }}`
    - `printbackground = true`
    - `name = {{ $('Summarize MobSF Report1').item.json.appInfo.appName }}.pdf`
  - Headers:
    - `x-api-key`: empty in JSON (must be set)
- **Key expressions:**
  - `html = {{ $json.cleaned_html }}`
  - `name = {{ $('Summarize MobSF Report1').item.json.appInfo.appName }}.pdf`
- **Inputs:** `cleaned_html` from **Clean HTML Output**.
- **Outputs:** PDF.co response (expected to include a `url`) to **Download Generated PDF**.
- **Failure / edge cases:**
  - Missing/invalid `x-api-key` → 401.
  - If HTML is very large or malformed, PDF.co may return conversion errors.
  - The cross-node reference to `Summarize MobSF Report1` assumes that node executed and item linking remains stable.

#### Node: Download Generated PDF
- **Type / role:** `httpRequest` — Downloads binary PDF from the returned URL.
- **Configuration (interpreted):**
  - URL: `={{ $json.url }}`
  - Response format: **file** (binary)
- **Key expressions:**
  - `url = {{ $json.url }}`
- **Inputs:** JSON from **Generate PDF** containing `url`.
- **Outputs:** Binary PDF to **Upload PDF to Google Drive**.
- **Failure / edge cases:**
  - If PDF.co returns `error` or no `url`, this fails.
  - The URL can expire; delayed runs may break.
  - Large PDF downloads may hit timeout limits.

#### Node: Upload PDF to Google Drive
- **Type / role:** `googleDrive` — Uploads binary file to Drive.
- **Configuration (interpreted):**
  - Upload name: `={{ $('Summarize MobSF Report1').item.json.appInfo.appName }}`
    - Note: This is the **file name** field; it does not explicitly append “.pdf” here (PDF extension is used earlier in PDF.co `name`, but Drive upload naming may still need `.pdf` to be explicit).
  - Drive: “My Drive”
  - FolderId: configured in UI as “N8n workflow” but the actual `value` is empty in JSON (must be selected/set).
- **Key expressions:**
  - `name = {{ $('Summarize MobSF Report1').item.json.appInfo.appName }}`
- **Inputs:** Binary from **Download Generated PDF**.
- **Outputs:** End of workflow.
- **Credentials:** Google Drive OAuth2 required (write permission).
- **Failure / edge cases:**
  - If folderId is empty, file may upload to root or fail depending on node behavior/version.
  - If binary property name is not what the Drive node expects for upload (not shown explicitly), upload can fail; ensure binary is in the default property from the previous HTTP node.

**Sticky note covering this block:**
- **Convert to PDF & Save to Drive**  
  “HTML is sent to a PDF API… downloaded and stored back into Google Drive…”

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Watch APK Uploads | googleDriveTrigger | Trigger on new file in a specific Drive folder | — | Download APK File | ## Detect APK Upload & Fetch File\nThis part waits for a new APK file uploaded to Google Drive... |
| Download APK File | googleDrive | Download newly created APK as binary | Watch APK Uploads | Upload APK to Analyzer | ## Detect APK Upload & Fetch File\nThis part waits for a new APK file uploaded to Google Drive... |
| Upload APK to Analyzer | httpRequest | Upload APK binary to MobSF `/upload` | Download APK File | Start Security Scan | ## Upload & Scan the APK for Security Issues\nThe downloaded APK is uploaded to the MobSF analyzer... |
| Start Security Scan | httpRequest | Trigger MobSF scan `/scan` using returned hash | Upload APK to Analyzer | Summarize MobSF Report1 | ## Upload & Scan the APK for Security Issues\nThe downloaded APK is uploaded to the MobSF analyzer... |
| Summarize MobSF Report1 | code | Reduce MobSF JSON to key findings | Start Security Scan | Generate HTML Report | ## Create a Clean Security Report\nThe workflow processes the MobSF data and extracts important findings... |
| Generate HTML Report | @n8n/n8n-nodes-langchain.openAi | Generate pure HTML report from summary JSON | Summarize MobSF Report1 | Clean HTML Output | ## Create a Clean Security Report\nThe workflow processes the MobSF data and extracts important findings... |
| Clean HTML Output | code | Extract and normalize HTML string for PDF conversion | Generate HTML Report | Generate PDF | ## Create a Clean Security Report\nThe workflow processes the MobSF data and extracts important findings... |
| Generate PDF | httpRequest | Convert HTML to PDF via PDF.co | Clean HTML Output | Download Generated PDF | ## Convert to PDF & Save to Drive\nThe formatted HTML is sent to a PDF API service... |
| Download Generated PDF | httpRequest | Download PDF binary from PDF.co URL | Generate PDF | Upload PDF to Google Drive | ## Convert to PDF & Save to Drive\nThe formatted HTML is sent to a PDF API service... |
| Upload PDF to Google Drive | googleDrive | Upload final PDF back to Drive folder | Download Generated PDF | — | ## Convert to PDF & Save to Drive\nThe formatted HTML is sent to a PDF API service... |
| Sticky Note | stickyNote | Comment / documentation | — | — |  |
| Sticky Note1 | stickyNote | Comment / documentation | — | — |  |
| Sticky Note2 | stickyNote | Comment / documentation | — | — |  |
| Sticky Note3 | stickyNote | Comment / documentation | — | — |  |
| Sticky Note4 | stickyNote | Comment / documentation | — | — |  |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a new workflow**
   - Name it: **“APK Security Scanner & PDF Report Generator”** (or your preferred name).
   - Keep workflow **Inactive** until credentials and endpoints are verified.

2. **Add Google Drive Trigger: “Watch APK Uploads”**
   - Node type: **Google Drive Trigger**
   - Event: **File Created**
   - Trigger on: **Specific folder**
   - Folder to watch: choose/create a folder (e.g., “APK Uploads Folder”)
   - Poll time: **Every minute**
   - Credentials: configure **Google Drive OAuth2** (scopes for reading metadata/files).

3. **Add Google Drive node: “Download APK File”**
   - Node type: **Google Drive**
   - Operation: **Download**
   - File ID:
     - Prefer using the trigger’s file ID (recommended). In many setups this is `{{$json.id}}`.
     - The provided workflow uses `{{$json.webViewLink}}`; if you copy that, verify it works in your n8n version.
   - Credentials: same **Google Drive OAuth2**.
   - Connect: **Watch APK Uploads → Download APK File**

4. **Add HTTP Request node: “Upload APK to Analyzer” (MobSF upload)**
   - Node type: **HTTP Request**
   - Method: **POST**
   - URL: `http://localhost:8000/api/v1/upload`
   - Content-Type: **multipart/form-data**
   - Body:
     - Add parameter `file`
     - Type: **Binary File**
     - Binary property: ensure it points to the downloaded APK binary (commonly `data`)
   - Headers:
     - `Authorization: <YOUR_MOBSF_API_KEY_OR_REQUIRED_FORMAT>`
   - Connect: **Download APK File → Upload APK to Analyzer**
   - MobSF prerequisite:
     - MobSF running and reachable from n8n (Docker users often need `http://host.docker.internal:8000` instead of `localhost`).

5. **Add HTTP Request node: “Start Security Scan” (MobSF scan)**
   - Node type: **HTTP Request**
   - Method: **POST**
   - URL: `http://localhost:8000/api/v1/scan`
   - Content-Type: **multipart/form-data**
   - Body parameters:
     - `hash = {{$json.hash}}` (from upload response)
     - `re_scan = 1`
   - Headers:
     - `Authorization: <YOUR_MOBSF_API_KEY_OR_REQUIRED_FORMAT>`
   - Connect: **Upload APK to Analyzer → Start Security Scan**

6. **Add Code node: “Summarize MobSF Report1”**
   - Node type: **Code**
   - Paste the summarization logic that:
     - extracts app info
     - filters manifest findings to high/warning
     - filters code findings to High/Medium
     - lists dangerous permissions
     - reports trackers, network security, firebase highlights
   - Connect: **Start Security Scan → Summarize MobSF Report1**

7. **Add OpenAI node: “Generate HTML Report”**
   - Node type: **OpenAI (LangChain)**
   - Model: **gpt-4.1-mini** (or equivalent available in your account)
   - Prompt: instruct “pure HTML only”, semantic tags only, sections 1–7, and include `{{JSON.stringify($json)}}`.
   - Credentials: configure **OpenAI API** key/credential in n8n.
   - Connect: **Summarize MobSF Report1 → Generate HTML Report**

8. **Add Code node: “Clean HTML Output”**
   - Node type: **Code**
   - Extract the HTML string from the OpenAI node output structure and return:
     - `{ cleaned_html: "<html>...</html>" }`
   - Connect: **Generate HTML Report → Clean HTML Output**
   - Important: If your OpenAI node returns a different structure, adjust the extraction path accordingly.

9. **Add HTTP Request node: “Generate PDF” (PDF.co convert)**
   - Node type: **HTTP Request**
   - Method: **POST**
   - URL: `https://api.pdf.co/v1/pdf/convert/from/html`
   - Body parameters:
     - `html = {{$json.cleaned_html}}`
     - `printbackground = true`
     - `name = {{ $('Summarize MobSF Report1').item.json.appInfo.appName }}.pdf`
   - Headers:
     - `x-api-key: <YOUR_PDFCO_API_KEY>`
   - Connect: **Clean HTML Output → Generate PDF**

10. **Add HTTP Request node: “Download Generated PDF”**
    - Node type: **HTTP Request**
    - URL: `{{$json.url}}`
    - Response: **File** (binary)
    - Connect: **Generate PDF → Download Generated PDF**

11. **Add Google Drive node: “Upload PDF to Google Drive”**
    - Node type: **Google Drive**
    - Operation: **Upload**
    - File name:
      - Recommended: `{{ $('Summarize MobSF Report1').item.json.appInfo.appName }}.pdf`
    - Folder: select destination folder (e.g., “N8n workflow”)
    - Credentials: Google Drive OAuth2 with write access
    - Connect: **Download Generated PDF → Upload PDF to Google Drive**

12. **Test end-to-end**
    - Upload an APK into the watched Drive folder.
    - Confirm:
      - APK downloads as binary
      - MobSF upload returns `hash`
      - Scan returns a full JSON report
      - OpenAI returns HTML
      - PDF.co returns `url`
      - Final PDF is uploaded to Drive

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| “How It Works… automatically analyzes newly uploaded APK files and generates a complete security report…” | Sticky note: How It Works |
| “Set Up MobSF Using Docker… run it locally on port 8000… copy your API key.” | Sticky note: Setup Steps |
| “Add credentials for Google Drive, MobSF (API key), OpenAI, and PDF.co.” | Sticky note: Setup Steps |
| “Use two HTTP nodes: one to upload the APK to MobSF and another to trigger the scan using the returned hash.” | Sticky note: Setup Steps |
| “Clean the HTML… convert it to PDF using PDF.co… Save Final PDF…” | Sticky note: Setup Steps |

