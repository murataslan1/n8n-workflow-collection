Automate end-to-end contract signatures with Google Docs, Drive and SignNow

https://n8nworkflows.xyz/workflows/automate-end-to-end-contract-signatures-with-google-docs--drive-and-signnow-11984


# Automate end-to-end contract signatures with Google Docs, Drive and SignNow

## 1. Workflow Overview

**Title:** Automate end-to-end contract signatures with Google Docs, Drive and SignNow

**Purpose:**  
This workflow orchestrates an end-to-end contract signature process. It collects request data via n8n Forms, consults/updates a Google Sheet, prepares files in Google Drive/Google Docs, then uses HTTP calls (intended for SignNow API operations) to send or manage a signature flow.

**Logical blocks**
1. **1.1 Intake & Lookup (Forms → Google Sheets → Routing)**  
   Receives a submission, checks data in Google Sheets, and branches depending on a condition.
2. **1.2 Data Collection & Persistence (Forms → Set → Google Sheets)**  
   Collects additional information, normalizes it, and writes/updates it in Google Sheets.
3. **1.3 File Preparation (Set → Google Drive → Google Drive)**  
   Prepares/locates contract files in Drive (copy/move/rename depending on configuration).
4. **1.4 Document Generation + External Signature API (Google Docs/Drive → HTTP Requests)**  
   Generates/updates a Google Doc, exports or fetches it from Drive, then calls external HTTP endpoints (SignNow operations) in sequence.

---

## 2. Block-by-Block Analysis

### 2.1 Intake & Lookup (Forms → Google Sheets → Routing)

**Overview:**  
This block starts the workflow from an n8n Form trigger and looks up related records in Google Sheets. An IF node then routes the execution to either the main “workflow path” or an alternate path.

**Nodes involved:** `S`, `S1`, `S2`, `B`

#### Node: **S**
- **Type / role:** `Form Trigger` (n8n-nodes-base.formTrigger) — entry point (webhook-based) for initial submission.
- **Configuration (interpreted):** Uses an n8n-hosted form endpoint (via internal webhook). No explicit fields are visible in JSON (parameters empty), so fields are configured in the UI.
- **Input / Output:** No inputs (trigger). Outputs form submission JSON to `S1`.
- **Version-specific notes:** typeVersion **2.3**.
- **Failure/edge cases:**
  - Form not published or disabled; webhook not reachable.
  - Missing expected fields → later expressions/conditions can fail.

#### Node: **S1**
- **Type / role:** `Google Sheets` — reads from or writes to a sheet to retrieve context for the submission (exact operation not provided in JSON).
- **Configuration:** Parameters are empty in provided JSON; in practice this node must be configured with:
  - Google Sheets credentials
  - Document & sheet/tab
  - Operation (e.g., “Lookup”, “Read”, “Append”, “Update”)
  - Matching key(s) (if lookup)
- **Special setting:** `alwaysOutputData: true`  
  Ensures the node outputs an item even if the operation returns no rows (helps avoid downstream node not executing).
- **Input / Output:** Input from `S` (and also from `B`), output to `S2`.
- **Version-specific notes:** typeVersion **4.7**.
- **Failure/edge cases:**
  - OAuth scope/consent or permission issues on the sheet.
  - Lookup returning empty; IF node must handle “no data” safely.
  - Rate limits/quota.

#### Node: **S2**
- **Type / role:** `IF` — branches based on a condition (not defined in JSON).
- **Configuration:** Condition(s) must be configured in UI (e.g., “row exists?”, “status == pending?”, etc.).
- **Input / Output:** Input from `S1`.  
  - **True/First output** → `W`  
  - **False/Second output** → `B`
- **Version-specific notes:** typeVersion **2.2**.
- **Failure/edge cases:**
  - Conditions referencing missing paths (e.g., `{{$json.someField}}`) cause evaluation issues.
  - AlwaysOutputData on `S1` means IF must distinguish between “empty lookup” and “found record”.

#### Node: **B**
- **Type / role:** `Form` — alternate form step (likely used when IF condition fails, e.g., missing record → collect more data).
- **Configuration:** Webhook-backed form endpoint. Parameters empty in JSON; actual fields defined in UI.
- **Input / Output:** Input from `S2` (false branch). Output to `S1` (loops back into Google Sheets).
- **Version-specific notes:** typeVersion **2.3**.
- **Failure/edge cases:**
  - Creates a **loop** (`S2 → B → S1 → S2`). If the IF condition never becomes true, the workflow can cycle logically (user repeatedly prompted / process repeats).
  - Form submissions missing data needed to satisfy IF condition.

---

### 2.2 Data Collection & Persistence (Forms → Set → Google Sheets)

**Overview:**  
Once routed to the main path, the workflow gathers additional details through one or more forms, normalizes fields with a Set node, then writes/updates data in Google Sheets.

**Nodes involved:** `W`, `W1`, `W2`, `D`

#### Node: **W**
- **Type / role:** `Form` — first form step in the main path.
- **Configuration:** Webhook-based form; fields configured in UI.
- **Input / Output:** Input from `S2` (true branch). Output to `W1`.
- **Version-specific notes:** typeVersion **2.3**.
- **Failure/edge cases:** Missing fields used later in `W2`/`D` mapping.

#### Node: **W1**
- **Type / role:** `Form` — second form step (often used for multi-step data capture).
- **Configuration:** Webhook-based form; fields configured in UI.
- **Input / Output:** Input from `W`. Output to `W2`.
- **Version-specific notes:** typeVersion **2.3**.
- **Failure/edge cases:** User abandonment between steps; partial data.

#### Node: **W2**
- **Type / role:** `Set` — shapes/renames/derives fields for storage and downstream processing.
- **Configuration:** Not visible in JSON (empty parameters). Typically used to:
  - Select only required fields
  - Rename to canonical names (e.g., `clientEmail`, `companyName`, `templateId`)
  - Compute derived values (dates, IDs)
- **Input / Output:** Input from `W1`. Output to `D`.
- **Version-specific notes:** typeVersion **3.4**.
- **Failure/edge cases:** If it uses expressions referencing missing form fields, it can output null/empty values or fail.

#### Node: **D**
- **Type / role:** `Google Sheets` — persists the collected/normalized data.
- **Configuration:** Not shown; typically “Append row” or “Update row” using a key from earlier lookup.
- **Input / Output:** Input from `W2`. Output to `D1`.
- **Version-specific notes:** typeVersion **4.7**.
- **Failure/edge cases:** Permissions, invalid range mapping, concurrency (two requests updating same row).

---

### 2.3 File Preparation (Set → Google Drive → Google Drive)

**Overview:**  
Prepares the contract file(s) in Google Drive—commonly by building file names/paths and copying a template into a per-client folder.

**Nodes involved:** `D1`, `F`, `F1`

#### Node: **D1**
- **Type / role:** `Set` — prepares file metadata (names, folder IDs, template IDs) for Drive actions.
- **Configuration:** Not visible; usually sets:
  - Drive folder IDs
  - Document/template file ID
  - Output file name (e.g., `Contract - {{$json.clientName}}.docx`)
- **Input / Output:** Input from `D`. Output to `F`.
- **Version-specific notes:** typeVersion **3.4**.
- **Failure/edge cases:** Missing folder/file IDs lead to Drive failures downstream.

#### Node: **F**
- **Type / role:** `Google Drive` — first Drive operation (often “Copy file”, “Create folder”, “Move file”, etc.).
- **Configuration:** Empty in JSON; must be configured in UI with:
  - Operation
  - File/folder IDs from `D1`
- **Input / Output:** Input from `D1`. Output to `F1`.
- **Version-specific notes:** typeVersion **3**.
- **Failure/edge cases:** 404 file not found, insufficient permissions, shared drive access settings.

#### Node: **F1**
- **Type / role:** `Google Drive` — second Drive operation (often follow-up: rename, set permissions, export, etc.).
- **Configuration:** Empty in JSON; depends on your intended flow.
- **Input / Output:** Input from `F`. Output to `G`.
- **Version-specific notes:** typeVersion **3**.
- **Failure/edge cases:** Permission propagation delays; wrong MIME type for export operations.

---

### 2.4 Document Generation + External Signature API (Google Docs/Drive → HTTP Requests)

**Overview:**  
Generates or updates a Google Doc (contract), then interacts with Drive to retrieve/share/export it, and finally calls external HTTP endpoints (intended SignNow API calls) in sequence.

**Nodes involved:** `G`, `G1`, `G2`, `G3`

#### Node: **G**
- **Type / role:** `Google Docs` — creates or updates a Google Doc (e.g., fill a template with client details).
- **Configuration:** Empty in JSON; typically includes:
  - Operation (Create/Update)
  - Document ID (from Drive step) or template merge strategy
  - Replacement variables from prior nodes (`W2`/`D1`)
- **Input / Output:** Input from `F1`. Output to `G1`.
- **Version-specific notes:** typeVersion **2**.
- **Failure/edge cases:** Invalid doc ID, placeholder mismatch, insufficient permissions.

#### Node: **G1**
- **Type / role:** `Google Drive` — post-processing of the doc (export to PDF, fetch file metadata, set sharing, etc.).
- **Configuration:** Empty in JSON; must align with what SignNow expects (often a PDF binary upload).
- **Input / Output:** Input from `G`. Output to `G2`.
- **Version-specific notes:** typeVersion **3**.
- **Failure/edge cases:** Export produces empty/invalid binary if wrong MIME type or doc not ready.

#### Node: **G2**
- **Type / role:** `HTTP Request` — external API call (intended SignNow step 1, e.g., upload document or create signature request).
- **Configuration:** Empty in JSON; must be set in UI:
  - Method (POST/GET/etc.)
  - URL (SignNow endpoint)
  - Auth (Bearer token / OAuth2 / API key)
  - Body (metadata) and possibly binary file upload (multipart/form-data)
- **Input / Output:** Input from `G1`. Output to `G3`.
- **Version-specific notes:** typeVersion **4.2**.
- **Failure/edge cases:** 401/403 auth errors, 400 schema errors, multipart misconfiguration, timeouts.

#### Node: **G3**
- **Type / role:** `HTTP Request` — external API call (intended SignNow step 2, e.g., invite signer(s), get signing link, send email).
- **Configuration:** Empty in JSON; configured similarly to `G2`.
- **Input / Output:** Input from `G2`. Terminal node (no further connections).
- **Version-specific notes:** typeVersion **4.2**.
- **Failure/edge cases:** Missing document ID from previous response, invalid recipient emails, rate limiting.

---

### 2.5 Notes / Comments

**Nodes involved:** `Sticky Note`

#### Node: **Sticky Note**
- **Type / role:** `Sticky Note` — documentation annotation.
- **Content:** *(empty)*
- **Failure/edge cases:** None.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Sticky Note | Sticky Note | Annotation / documentation |  |  |  |
| S | Form Trigger | Entry point: initial intake form submission |  | S1 |  |
| S1 | Google Sheets | Lookup/read/update sheet data for routing/context | S, B | S2 |  |
| S2 | IF | Branching decision based on Sheets result | S1 | W, B |  |
| W | Form | Main-path form step 1 | S2 | W1 |  |
| W1 | Form | Main-path form step 2 | W | W2 |  |
| W2 | Set | Normalize/prepare fields for persistence | W1 | D |  |
| D | Google Sheets | Persist collected data (append/update) | W2 | D1 |  |
| D1 | Set | Prepare Drive-related IDs/filenames | D | F |  |
| F | Google Drive | Drive operation #1 (copy/move/create/etc.) | D1 | F1 |  |
| F1 | Google Drive | Drive operation #2 (rename/export/share/etc.) | F | G |  |
| G | Google Docs | Generate/update contract document from data | F1 | G1 |  |
| G1 | Google Drive | Export/fetch/share doc for signature step | G | G2 |  |
| G2 | HTTP Request | SignNow API call #1 (e.g., upload/create request) | G1 | G3 |  |
| G3 | HTTP Request | SignNow API call #2 (e.g., invite signer / send) | G2 |  |  |
| B | Form | Alternate form path; loops back to Sheets | S2 | S1 |  |

---

## 4. Reproducing the Workflow from Scratch

1. **Create Trigger: “S” (Form Trigger)**
   - Add **Form Trigger** node.
   - Build the initial form fields (e.g., requester email, contract type, customer identifier).
   - Save and note the generated form URL.
   - Connect **S → S1**.

2. **Add “S1” (Google Sheets) for lookup/context**
   - Add **Google Sheets** node.
   - Configure **Google credentials** (OAuth2) with access to the target spreadsheet.
   - Select Spreadsheet + Sheet/tab.
   - Choose an operation appropriate for routing:
     - Common choice: **Lookup** by an identifier collected in **S**.
   - Enable/keep **Always Output Data** (matches workflow).
   - Connect **S1 → S2**.
   - Also later connect **B → S1** (step 5).

3. **Add “S2” (IF) to branch**
   - Add **IF** node.
   - Define the condition (examples):
     - “Lookup row exists” (e.g., `{{$json.id}}` is not empty)
     - or “status == ready”
   - Connect **S2 (true) → W**
   - Connect **S2 (false) → B**

4. **Main path forms: “W” and “W1”**
   - Add **Form** node named **W**; configure fields for additional contract info.
   - Add **Form** node named **W1**; configure second-step fields (signer details, address, etc.).
   - Connect **W → W1 → W2**.

5. **Alternate path form: “B”**
   - Add **Form** node named **B** for missing/extra data when IF fails.
   - Connect **S2 (false) → B → S1** to re-check Sheets after new data.

6. **Normalize data: “W2” (Set)**
   - Add a **Set** node.
   - Map all required fields into consistent keys (for Sheets + Docs + SignNow), e.g.:
     - `client_name`, `client_email`, `signer_name`, `signer_email`, `contract_type`, `sheet_row_id`
   - Connect **W2 → D**.

7. **Persist: “D” (Google Sheets)**
   - Add **Google Sheets** node.
   - Operation: **Append** or **Update** (recommended: update the row located in S1).
   - Map columns from **W2** outputs.
   - Connect **D → D1**.

8. **Prepare Drive metadata: “D1” (Set)**
   - Add **Set** node.
   - Set keys like:
     - `template_file_id`, `destination_folder_id`, `output_filename`
   - Connect **D1 → F**.

9. **Drive operations: “F” and “F1”**
   - Add **Google Drive** node **F**:
     - Typical operation: **Copy file** (template → destination folder), naming with `output_filename`.
   - Add **Google Drive** node **F1**:
     - Typical operation: **Export** to PDF or **Get** file binary / set permissions.
   - Connect **F → F1 → G**.

10. **Generate/merge doc: “G” (Google Docs)**
   - Add **Google Docs** node.
   - Configure to **create/update** the contract doc and replace placeholders with fields from earlier steps.
   - Connect **G → G1**.

11. **Prepare file for SignNow: “G1” (Google Drive)**
   - Add **Google Drive** node.
   - Common configuration:
     - **Export** the Google Doc to **PDF** and output **Binary** data (so it can be uploaded).
   - Connect **G1 → G2**.

12. **SignNow API calls: “G2” and “G3” (HTTP Request)**
   - Add **HTTP Request** node **G2**:
     - Configure SignNow authentication (commonly Bearer token).
     - Configure endpoint for **document upload / create document** (multipart with PDF binary).
     - Parse response JSON to capture `document_id` (or equivalent).
   - Add **HTTP Request** node **G3**:
     - Configure endpoint to **create invite / send signature request**, using the `document_id` from G2 response and signer info from earlier nodes.
   - Connect **G2 → G3**.

13. **Credentials checklist**
   - **Google Sheets / Drive / Docs:** Google OAuth2 credential with relevant scopes; ensure access to spreadsheet and Drive folders/templates.
   - **SignNow:** API credential method supported by your account (token/OAuth2). Store secrets in n8n credentials, not in node parameters.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques. | Disclaimer provided with the request |
| Sticky note present but empty. | Workflow annotation node |

