Automate offer letters & notifications with Google Sheets, Gmail & Slack

https://n8nworkflows.xyz/workflows/automate-offer-letters---notifications-with-google-sheets--gmail---slack-11916


# Automate offer letters & notifications with Google Sheets, Gmail & Slack

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Title:** Automate offer letters & notifications with Google Sheets, Gmail & Slack

**Purpose:**  
This workflow automates candidate onboarding communications by watching a Google Sheet for candidate rows and branching based on **Document Status**:
- If **Document Status = Pending** → send a reminder email about missing documents and update the candidate status in the sheet.
- Otherwise (documents complete/anything not “Pending”) → generate an offer letter (HTML → PDF via ConvertAPI), upload it to Google Drive, email it to the candidate, notify the manager on Slack, and update the candidate status in the sheet.

### 1.1 Input Reception & Polling (Google Sheets)
Monitors a spreadsheet and emits row data on a schedule.

### 1.2 Decision: Pending vs Complete
Routes the workflow to either “document reminder” or “offer letter generation”.

### 1.3 Document Reminder Path (Pending)
Sends Gmail reminder for missing documents and updates the sheet status to “Documents_Pending”.

### 1.4 Offer Letter Creation (Complete)
Builds HTML offer letter, converts it to PDF using ConvertAPI, and downloads the resulting PDF.

### 1.5 Distribution & Notifications (Complete)
Uploads the PDF to Google Drive, writes the Drive link back to the sheet, emails the PDF to the candidate, notifies manager via Slack, and marks “Offer_Sent”.

---

## 2. Block-by-Block Analysis

### Block 1 — Input Reception & Polling
**Overview:** Polls a specific Google Sheet tab every minute and outputs changed/new row data to the workflow.  
**Nodes Involved:** `Google Sheets Trigger`

#### Node: Google Sheets Trigger
- **Type / role:** `googleSheetsTrigger` — scheduled polling trigger for spreadsheet changes.
- **Configuration (interpreted):**
  - Polling: **every minute**
  - Spreadsheet: “Onboarding Workflows” (document ID `15emSCM6...`)
  - Sheet/tab: `Sheet1` (`gid=0`)
- **Key fields expected in each row (used later):**
  - `Candidate ID`, `Name`, `Email`, `Phone`, `Pending Documents`, `Document Status`, `Offer Salary`, `Profession`
- **Connections:**
  - **Output →** `Check Document Status(If Document Status is Pending)`
- **Failure/edge cases:**
  - Google credentials missing/expired (OAuth).
  - Trigger polling may re-process rows depending on trigger settings and sheet edits; consider adding a “processed flag” column if duplicates occur.
  - Missing columns (e.g., “Document Status”) can cause downstream expressions/conditions to misbehave.

---

### Block 2 — Decision: Pending vs Complete
**Overview:** Checks whether the candidate’s `Document Status` equals `Pending`. If yes, sends reminder flow; if no, generates offer letter.  
**Nodes Involved:** `Check Document Status(If Document Status is Pending)`

#### Node: Check Document Status(If Document Status is Pending)
- **Type / role:** `if` — conditional router.
- **Condition logic:**
  - String equals: `{{$json["Document Status"]}}` **equals** `Pending`
- **Connections:**
  - **True (Pending) →** `Send Missing Document Email`
  - **False (not Pending) →** `Create Offer Letter`
- **Key expressions/variables:**
  - `$json["Document Status"]`
- **Failure/edge cases:**
  - If the field name differs (e.g., `DocumentStatus`) or is blank/null, the condition evaluates false and the workflow will proceed to offer letter generation unexpectedly.
  - Case sensitivity: configured strict/case-sensitive; `pending` would not match.

---

### Block 3 — Document Reminder Path (Pending)
**Overview:** Emails the candidate about missing documents and updates the candidate status in the sheet to indicate documents are pending.  
**Nodes Involved:** `Send Missing Document Email`, `Change Status`

#### Node: Send Missing Document Email
- **Type / role:** `gmail` — sends reminder email.
- **Configuration (interpreted):**
  - To: `{{$json.Email}}`
  - Subject: `Reminder:{{ $json.Name }} Please submit your pending documents to proceed with your offer`
  - Body: plaintext; includes `{{$json['Pending Documents']}}`
- **Connections:**
  - **Input:** from IF (true path)
  - **Output →** `Change Status`
- **Failure/edge cases:**
  - Gmail credential/OAuth scope issues (send mail).
  - Invalid email address in sheet.
  - Missing `Pending Documents` value leads to an empty section in email.

#### Node: Change Status
- **Type / role:** `googleSheets` — append/update a row by key.
- **Operation:** `appendOrUpdate`
- **Match key:** `Candidate ID`
- **Writes:**
  - `Candidate ID` = `{{ $('Check Document Status(If Document Status is Pending)').item.json["Candidate ID"] }}`
  - `Candidate Status` = `Documents_Pending`
- **Connections:**
  - **Input:** from `Send Missing Document Email`
  - **Output:** none
- **Key expressions:**
  - Uses cross-node reference to the IF node item:  
    `$('Check Document Status(If Document Status is Pending)').item.json[...]`
- **Failure/edge cases:**
  - If `Candidate ID` is missing/duplicated, update may affect wrong row or create new rows.
  - Sheet schema mismatch (column names must match exactly).
  - Permissions: service account / OAuth user must have edit access.

---

### Block 4 — Offer Letter Creation (Complete)
**Overview:** Generates an HTML offer letter from row data, converts it to a PDF via ConvertAPI, and downloads the PDF file for distribution.  
**Nodes Involved:** `Create Offer Letter`, `PDF Generate`, `Get PDF`, `Download PDF`

#### Node: Create Offer Letter
- **Type / role:** `code` — builds an HTML document and attaches it as binary to the item.
- **Configuration choices:**
  - Uses `$input.first().json` as `data` (assumes single candidate row per run).
  - Creates a long-form corporate offer letter HTML with interpolated variables:
    - `data.Name`, `data.Email`, `data.Phone`, `data["Offer Salary"]`, `data.Profession`, `data["Candidate ID"]`
  - Converts HTML to base64 binary:
    - `mimeType: 'text/html'`
    - `fileName: Offer_Letter_<Candidate ID>.html`
    - Binary property name: `binary.data`
- **Connections:**
  - **Output →** `PDF Generate`
- **Failure/edge cases:**
  - If multiple rows arrive in one trigger execution, only `$input.first()` is used for HTML content, but the code returns `items` (potential mismatch). Consider generating per item if batch triggers are possible.
  - Missing fields result in empty placeholders (handled with `|| ''`).
  - n8n code node requires appropriate execution settings; very large HTML could hit memory limits.

#### Node: PDF Generate
- **Type / role:** `httpRequest` — calls ConvertAPI to convert HTML to PDF.
- **Configuration (interpreted):**
  - POST `https://v2.convertapi.com/convert/html/to/pdf`
  - Content-Type: multipart/form-data
  - Header: `Authorization: Bearer YOUR_TOKEN_HERE` (must be replaced with a real token)
  - Form parts:
    - `StoreFile=true`
    - `File` from **binary field** `data`
  - Response format: **file** (node configured to treat response as file)
- **Connections:**
  - **Input:** `Create Offer Letter` (binary HTML)
  - **Output →** `Get PDF`
- **Failure/edge cases:**
  - Invalid/expired ConvertAPI token → 401/403.
  - ConvertAPI quota exceeded → 402/429 depending on plan.
  - If binary field name differs (not `data`), request will fail.
  - HTML containing unsupported resources (remote images/fonts) may not render unless accessible publicly.

#### Node: Get PDF
- **Type / role:** `extractFromFile` — parses JSON metadata returned by ConvertAPI.
- **Operation:** `fromJson`
- **What it does here:** Interprets the returned file/metadata so the next node can access `{{$json.data.Files[0].Url}}`.
- **Connections:**
  - **Output →** `Download PDF`
- **Failure/edge cases:**
  - If ConvertAPI response structure differs, `data.Files[0].Url` may not exist.
  - If the previous node did not output valid JSON content for extraction, parsing fails.

#### Node: Download PDF
- **Type / role:** `httpRequest` — downloads the generated PDF from ConvertAPI’s hosted file URL.
- **URL expression:** `{{ $json.data.Files[0].Url }}`
- **Connections (fan-out):**
  - **Output →** `Upload Offer Letter`
  - **Output →** `Send Offer Letter To Candidate`
  - **Output →** `Send a message to Manager`
- **Failure/edge cases:**
  - File URL expired/unreachable.
  - Large PDFs may hit timeout unless HTTP node timeout is adjusted.
  - The node must output binary PDF data for Gmail attachment / Drive upload; if it returns JSON instead, downstream nodes won’t have the file.

---

### Block 5 — Distribution & Notifications (Complete)
**Overview:** Stores the PDF in Drive, records a link in the sheet, emails the PDF to the candidate, notifies Slack, and updates the sheet status to “Offer_Sent”.  
**Nodes Involved:** `Upload Offer Letter`, `Add Offer Letter in Sheet`, `Send Offer Letter To Candidate`, `Send a message to Manager`, `Change Status in Sheet`

#### Node: Upload Offer Letter
- **Type / role:** `googleDrive` — uploads the PDF to a specific Drive folder.
- **Configuration (interpreted):**
  - File name: `{{ $('Check Document Status(If Document Status is Pending)').item.json['Candidate ID'] }}`
  - Drive: `My Drive`
  - Folder ID: `1bTXRNX_XaL8qy_Z2bcGVQlPaVeFDhPRq`
- **Connections:**
  - **Input:** binary PDF from `Download PDF`
  - **Output →** `Add Offer Letter in Sheet`
- **Failure/edge cases:**
  - If no binary data is present, upload fails.
  - Folder ID invalid or permissions missing.
  - Naming collisions if Candidate ID repeats; Drive may create duplicates depending on node behavior/options.

#### Node: Add Offer Letter in Sheet
- **Type / role:** `googleSheets` — updates the candidate row with a Drive link.
- **Operation:** `update`
- **Match key:** `Candidate ID`
- **Writes:**
  - `Candidate ID` from IF node reference
  - `Offer Letter Link` = `{{$json.webViewLink}}` (from Drive upload output)
- **Connections:**
  - **Input:** `Upload Offer Letter`
  - **Output:** none
- **Failure/edge cases:**
  - If Drive node does not return `webViewLink` (depends on permissions/API response), the sheet gets blank.
  - Candidate ID mismatch prevents update (no row found).

#### Node: Send Offer Letter To Candidate
- **Type / role:** `gmail` — sends offer letter email to candidate with PDF attachment.
- **Configuration (interpreted):**
  - To: `{{ $('Check Document Status(If Document Status is Pending)').item.json.Email }}`
  - Subject: “Congratulations! Your Offer Letter…”
  - Body: onboarding congratulations text
  - Attachments: configured to use **binary attachment(s)** (but the attachment entry is empty in UI; it relies on binary data from `Download PDF`)
- **Connections:**
  - **Input:** `Download PDF`
  - **Output:** none
- **Failure/edge cases:**
  - Attachment misconfiguration: if the node is not explicitly mapped to the correct binary property (commonly `data`), email may send without attachment or fail validation.
  - Gmail sending limits / quota.
  - Invalid candidate email.

#### Node: Send a message to Manager
- **Type / role:** `slack` — posts a notification message to a channel.
- **Configuration (interpreted):**
  - Channel: `new-channel` (`C08QJL9GC3C`)
  - Message uses candidate fields from IF node reference:
    - Name and Profession
- **Connections:**
  - **Input:** `Download PDF`
  - **Output →** `Change Status in Sheet`
- **Failure/edge cases:**
  - Slack credential/token scope missing `chat:write`.
  - Channel ID invalid or bot not in channel.
  - If IF node reference is missing (unexpected execution path), expressions could fail.

#### Node: Change Status in Sheet
- **Type / role:** `googleSheets` — updates candidate status after sending notification.
- **Operation:** `update`
- **Match key:** `Candidate ID`
- **Writes:**
  - `Candidate Status` = `Offer_Sent`
- **Connections:**
  - **Input:** `Send a message to Manager`
  - **Output:** none
- **Failure/edge cases:**
  - If Slack node fails, this update never runs (status not changed).
  - Candidate ID mismatch prevents update.

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Google Sheets Trigger | googleSheetsTrigger | Poll spreadsheet rows/changes | — | Check Document Status(If Document Status is Pending) | ## Sample Sheet<br>https://docs.google.com/spreadsheets/d/15emSCM6Ui3O7oH2BXcorZJUi2BbWpZKCTcqq-Iyn0Kk/edit?gid=0#gid=0 |
| Check Document Status(If Document Status is Pending) | if | Route by Document Status | Google Sheets Trigger | Send Missing Document Email (true), Create Offer Letter (false) | ## How it works<br>This workflow automates candidate onboarding by monitoring a Google Sheet for new entries. When a candidate's document status is updated:<br><br>- **Documents Pending**: Sends a reminder email listing missing documents and updates the candidate status<br>- **Documents Complete**: Generates a personalized offer letter (HTML → PDF), uploads it to Google Drive, emails it to the candidate, and notifies the manager via Slack<br><br>## Setup steps<br>1. **Connect accounts**: Google Sheets, Gmail, Google Drive, Slack (all nodes show credential warnings)<br>2. **Configure Google Sheet**: Use the sample sheet linked in the existing sticky note or replace with your own<br>3. **Update API key**: Replace "api_key" in PDF Generate node with your ConvertAPI key<br>4. **Set Slack channel**: Verify the manager notification channel in "Send a message to Manager" node<br>5. **Set Drive folder**: Confirm the Google Drive folder ID for offer letter storage |
| Send Missing Document Email | gmail | Email reminder for missing documents | Check Document Status… (true) | Change Status | ## Send missing documents Email |
| Change Status | googleSheets | Update status to Documents_Pending | Send Missing Document Email | — | ## Send missing documents Email |
| Create Offer Letter | code | Generate HTML offer letter (binary) | Check Document Status… (false) | PDF Generate | ## Offer Letter Generation<br>Creates HTML offer letter from candidate data, converts to PDF via ConvertAPI, and downloads the final document. |
| PDF Generate | httpRequest | Convert HTML → PDF via ConvertAPI | Create Offer Letter | Get PDF | ## Offer Letter Generation<br>Creates HTML offer letter from candidate data, converts to PDF via ConvertAPI, and downloads the final document. |
| Get PDF | extractFromFile | Parse JSON metadata from conversion response | PDF Generate | Download PDF | ## Offer Letter Generation<br>Creates HTML offer letter from candidate data, converts to PDF via ConvertAPI, and downloads the final document. |
| Download PDF | httpRequest | Download resulting PDF file | Get PDF | Upload Offer Letter; Send Offer Letter To Candidate; Send a message to Manager | ## Distribution & Notifications<br>Uploads offer letter to Google Drive, emails candidate with PDF attachment, notifies manager via Slack, and updates sheet with final status. |
| Upload Offer Letter | googleDrive | Upload PDF to Drive folder | Download PDF | Add Offer Letter in Sheet | ## Distribution & Notifications<br>Uploads offer letter to Google Drive, emails candidate with PDF attachment, notifies manager via Slack, and updates sheet with final status. |
| Add Offer Letter in Sheet | googleSheets | Save Drive link back to sheet | Upload Offer Letter | — | ## Distribution & Notifications<br>Uploads offer letter to Google Drive, emails candidate with PDF attachment, notifies manager via Slack, and updates sheet with final status. |
| Send Offer Letter To Candidate | gmail | Email offer letter PDF to candidate | Download PDF | — | ## Distribution & Notifications<br>Uploads offer letter to Google Drive, emails candidate with PDF attachment, notifies manager via Slack, and updates sheet with final status. |
| Send a message to Manager | slack | Notify manager in Slack | Download PDF | Change Status in Sheet | ## Distribution & Notifications<br>Uploads offer letter to Google Drive, emails candidate with PDF attachment, notifies manager via Slack, and updates sheet with final status. |
| Change Status in Sheet | googleSheets | Update status to Offer_Sent | Send a message to Manager | — | ## Distribution & Notifications<br>Uploads offer letter to Google Drive, emails candidate with PDF attachment, notifies manager via Slack, and updates sheet with final status. |
| Sticky Note | stickyNote | Comment (sample sheet link) | — | — | ## Sample Sheet<br>https://docs.google.com/spreadsheets/d/15emSCM6Ui3O7oH2BXcorZJUi2BbWpZKCTcqq-Iyn0Kk/edit?gid=0#gid=0 |
| Workflow Overview | stickyNote | Comment (workflow explanation/setup) | — | — | ## How it works<br>… (see above) |
| Document Verification | stickyNote | Comment (section header) | — | — | ## Send missing documents Email |
| Offer Letter Generation | stickyNote | Comment (section header) | — | — | ## Offer Letter Generation<br>Creates HTML offer letter from candidate data, converts to PDF via ConvertAPI, and downloads the final document. |
| Distribution & Notifications | stickyNote | Comment (section header) | — | — | ## Distribution & Notifications<br>Uploads offer letter to Google Drive, emails candidate with PDF attachment, notifies manager via Slack, and updates sheet with final status. |

---

## 4. Reproducing the Workflow from Scratch

1) **Create Trigger: Google Sheets Trigger**
   - Add node: **Google Sheets Trigger**
   - Credentials: Google (OAuth2) with access to the target spreadsheet
   - Set:
     - Document: your onboarding spreadsheet
     - Sheet: the candidates tab (e.g., Sheet1 / gid=0)
     - Polling: every minute (or adjust)
   - Ensure your sheet has columns at least: `Candidate ID`, `Name`, `Email`, `Phone`, `Pending Documents`, `Document Status`, `Offer Salary`, `Profession`, `Candidate Status`, `Offer Letter Link`.

2) **Add router: IF**
   - Add node: **IF**
   - Condition: String → `{{$json["Document Status"]}}` equals `Pending` (case-sensitive)
   - Connect: **Google Sheets Trigger → IF**

3) **Pending branch: Send Missing Document Email (Gmail)**
   - Add node: **Gmail** (Send Email)
   - Credentials: Gmail OAuth2 with “send email” permissions
   - To: `{{$json.Email}}`
   - Subject and message: include `{{$json.Name}}` and `{{$json["Pending Documents"]}}` as in the workflow
   - Connect: **IF (true) → Send Missing Document Email**

4) **Pending branch: Update sheet status (Documents_Pending)**
   - Add node: **Google Sheets**
   - Operation: **Append or Update**
   - Match column: `Candidate ID`
   - Set values:
     - `Candidate ID` = `{{ $('Check Document Status(If Document Status is Pending)').item.json["Candidate ID"] }}`
     - `Candidate Status` = `Documents_Pending`
   - Connect: **Send Missing Document Email → Change Status**

5) **Complete branch: Create Offer Letter (HTML)**
   - Add node: **Code**
   - Paste/build code that:
     - Reads `$input.first().json` (or iterate items)
     - Produces HTML with placeholders (Name, Email, Phone, Offer Salary, Profession, Candidate ID)
     - Writes binary `items[0].binary.data` with base64, `text/html`
   - Connect: **IF (false) → Create Offer Letter**

6) **Convert HTML to PDF (ConvertAPI)**
   - Add node: **HTTP Request**
   - Method: POST
   - URL: `https://v2.convertapi.com/convert/html/to/pdf`
   - Authentication header: `Authorization: Bearer <YOUR_CONVERTAPI_TOKEN>`
   - Body: **multipart/form-data**
     - `StoreFile=true`
     - `File` = binary property `data` (from Code node)
   - Response: set to return **File**
   - Connect: **Create Offer Letter → PDF Generate**

7) **Parse conversion response**
   - Add node: **Extract From File**
   - Operation: **From JSON**
   - Connect: **PDF Generate → Get PDF**

8) **Download the generated PDF**
   - Add node: **HTTP Request**
   - URL: `{{ $json.data.Files[0].Url }}`
   - Ensure it outputs binary PDF data
   - Connect: **Get PDF → Download PDF**

9) **Upload PDF to Google Drive**
   - Add node: **Google Drive**
   - Credentials: Google OAuth2 with Drive access
   - Folder: pick your target folder (store offer letters)
   - Name: `{{ $('Check Document Status(If Document Status is Pending)').item.json['Candidate ID'] }}`
   - Binary file input: from `Download PDF`
   - Connect: **Download PDF → Upload Offer Letter**

10) **Write Drive link back to Sheet**
   - Add node: **Google Sheets**
   - Operation: **Update**
   - Match column: `Candidate ID`
   - Values:
     - `Candidate ID` = IF-node referenced Candidate ID
     - `Offer Letter Link` = `{{$json.webViewLink}}` (from Drive node)
   - Connect: **Upload Offer Letter → Add Offer Letter in Sheet**

11) **Email PDF to candidate (Gmail)**
   - Add node: **Gmail** (Send Email)
   - To: `{{ $('Check Document Status(If Document Status is Pending)').item.json.Email }}`
   - Configure **attachments** to include the binary PDF from `Download PDF` (ensure the attachment is mapped to the correct binary property, typically `data`)
   - Connect: **Download PDF → Send Offer Letter To Candidate**

12) **Notify manager via Slack**
   - Add node: **Slack** (Post message)
   - Credentials: Slack bot/user token with `chat:write`
   - Channel: select the manager channel
   - Message: reference candidate Name/Profession via IF node item, as in the workflow
   - Connect: **Download PDF → Send a message to Manager**

13) **Final status update (Offer_Sent)**
   - Add node: **Google Sheets**
   - Operation: **Update**
   - Match column: `Candidate ID`
   - Set `Candidate Status` = `Offer_Sent`
   - Connect: **Send a message to Manager → Change Status in Sheet**

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| Sample Sheet | https://docs.google.com/spreadsheets/d/15emSCM6Ui3O7oH2BXcorZJUi2BbWpZKCTcqq-Iyn0Kk/edit?gid=0#gid=0 |
| ConvertAPI authentication must be updated | In **PDF Generate** node: replace `Authorization: Bearer YOUR_TOKEN_HERE` with a valid ConvertAPI token |
| Required connected accounts | Google Sheets, Gmail, Google Drive, Slack (all must have valid credentials and permissions) |
| Drive folder must be confirmed | Update folder ID in **Upload Offer Letter** to your storage location |
| Slack channel must be verified | Ensure bot/user has access to the configured channel ID in **Send a message to Manager** |