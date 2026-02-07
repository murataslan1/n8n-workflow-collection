Automate Invoice Processing with Gmail, OCR.space, Slack & Xero

https://n8nworkflows.xyz/workflows/automate-invoice-processing-with-gmail--ocr-space--slack---xero-9905


# Automate Invoice Processing with Gmail, OCR.space, Slack & Xero

### 1. Workflow Overview

This workflow automates the entire invoice processing pipeline from receiving invoices by email to posting approved invoices in Xero accounting software, including validation, approval via Slack, logging, and email labeling. It is designed for finance teams and businesses that receive invoices as PDF/image attachments by email and want to reduce manual data entry and approval bottlenecks.

The workflow logically divides into three main blocks:

- **1.1 Invoice Extraction & Parsing**  
  Watches Gmail for incoming invoice emails with attachments, extracts and validates invoice data using OCR.space API and custom parsing logic.

- **1.2 Approval Process and Logging**  
  Logs invoice data in Google Sheets, sends Slack messages for approval or rejection, and updates status based on Slack responses.

- **1.3 Posting to Xero and Final Notifications**  
  For approved invoices, creates draft invoices in Xero, updates Gmail labels, and notifies the team on Slack. For rejected invoices, updates status and labels accordingly.

---

### 2. Block-by-Block Analysis

#### 2.1 Invoice Extraction & Parsing

**Overview:**  
This block triggers on new Gmail emails with PDF/image attachments, extracts the attachment, sends it to OCR.space for text extraction, and parses invoice fields with validation.

**Nodes Involved:**  
- Gmail Trigger  
- Code in JavaScript (extract attachment & encode)  
- Has Valid Attachment? (If node)  
- Extract Text (HTTP Request to OCR.space)  
- Parse Invoice Data (JavaScript parsing & validation)  
- Check Qualification (If node)

**Node Details:**  

- **Gmail Trigger**  
  - Type: Trigger node  
  - Watches Gmail inbox every minute for emails with PDF attachments (`has:attachment filename:pdf`)  
  - Downloads attachments for further processing  
  - Credential: Gmail OAuth2  
  - Failure cases: Auth expiry, Gmail API rate limits, missing or malformed attachments

- **Code in JavaScript**  
  - Extracts first valid PDF or image attachment (pdf, png, jpg)  
  - Converts binary data to base64 string  
  - Constructs a data URL for OCR API consumption  
  - Outputs email metadata and encoded attachment  
  - Edge cases: No attachments, no PDF/image attachments, corrupted binary data

- **Has Valid Attachment?** (If)  
  - Checks if previous node returned an error (absence of attachment or invalid)  
  - Routes flow accordingly to avoid processing invalid inputs

- **Extract Text** (HTTP Request)  
  - Sends attachment data to OCR.space API for text extraction  
  - Uses `ocrspaceApi` credential for API key  
  - Posts JSON body with base64-encoded attachment  
  - Failure modes: API rate limit, invalid API key, network errors, malformed data

- **Parse Invoice Data** (Code in JavaScript)  
  - Parses OCR text to extract vendor, invoice number, amount, currency, invoice date, due date, description  
  - Uses regex patterns targeted at typical invoice formats  
  - Includes validation: missing fields, invalid amounts, high-value flags (> $10,000)  
  - Adds `qualified` boolean and `redFlags` array to indicate parsing success or failure and issues  
  - Edge cases: Unreadable OCR output, unexpected invoice formats, timezone date parsing issues

- **Check Qualification** (If)  
  - Checks if invoice is qualified for processing (boolean flag)  
  - Routes to either log and approval or rejection path

---

#### 2.2 Approval Process and Logging

**Overview:**  
Logs the parsed invoice into Google Sheets and sends a Slack message requesting manual approval. Depending on Slack approval response, routes for posting or rejection.

**Nodes Involved:**  
- Append or update row in sheet (Google Sheets)  
- Format for Slack (JavaScript)  
- Clean Invoice Payload (JavaScript)  
- Slack Approval Request (Slack node with approval)  
- Was Approved? (If node)

**Node Details:**  

- **Append or update row in sheet**  
  - Logs invoice data (vendor, amount, currency, invoice number, dates, description, email ID, status "Pending", timestamp) into Google Sheets  
  - Matches rows by invoice number to append or update  
  - Credential: Google Sheets OAuth2  
  - Edge cases: Sheet ID misconfiguration, network issues, data type mismatches

- **Format for Slack** (Code in JavaScript)  
  - Prepares clean invoice fields for Slack message templating  
  - Extracts key invoice data from Google Sheets response  
  - Ensures invoiceDate field is included for downstream Xero posting

- **Clean Invoice Payload** (Code in JavaScript)  
  - Removes unwanted fields (vendor, itemCode) from Slack-formatted invoice data for downstream use  
  - Outputs sanitized invoice data

- **Slack Approval Request**  
  - Sends Slack message to a finance team channel (`invoice-approvals`) requesting approval with invoice details  
  - Uses Slack OAuth2 with interactive approval buttons (double approval type)  
  - Waits for user response to continue flow  
  - Edge cases: Slack API errors, no response, OAuth expiry

- **Was Approved?** (If)  
  - Checks Slack approval response boolean (`approved`)  
  - Routes to approved or rejected branches accordingly

---

#### 2.3 Posting to Xero and Final Notifications

**Overview:**  
If approved, fetches contacts from Xero, creates a draft invoice via API, updates Gmail labels and Google Sheets status, and sends Slack success message. If rejected, updates status, applies Gmail label, and notifies Slack channel.

**Nodes Involved:**  
- Get many contacts (Xero)  
- Create invoice (HTTP Request to Xero API)  
- Add Processed label (Gmail)  
- Update Approved Status (Google Sheets)  
- Success message (Slack)  
- Add Rejected label (Gmail)  
- Update Rejected Status (Google Sheets)  
- Rejection message (Slack)

**Node Details:**  

- **Get many contacts**  
  - Retrieves contacts from Xero (limited to 1 for this template, typically filtered by vendor)  
  - Credential: Xero OAuth2  
  - Failure modes: Auth issues, API limits, missing contact

- **Create invoice** (HTTP Request)  
  - Posts a draft invoice to Xero API with invoice data: contact ID, dates, invoice number, line items, amount  
  - Uses Xero OAuth2 and tenant ID header for authentication  
  - Edge cases: API validation errors, connection issues, missing contact

- **Add Processed label** (Gmail)  
  - Adds a Gmail label "Processed" to the original email to mark it handled  
  - Credential: Gmail OAuth2

- **Update Approved Status** (Google Sheets)  
  - Updates invoice status to "Approved" in the Google Sheet row matched by invoice number

- **Success message** (Slack)  
  - Sends confirmation message to Slack channel indicating invoice posted to Xero

- **Add Rejected label** (Gmail)  
  - Adds a Gmail label "Rejected" to emails for rejected invoices

- **Update Rejected Status** (Google Sheets)  
  - Updates invoice status to "Rejected" for corresponding invoice number in Google Sheets

- **Rejection message** (Slack)  
  - Sends Slack message explaining invoice was auto-rejected with details and red flags

---

### 3. Summary Table

| Node Name               | Node Type                     | Functional Role                                    | Input Node(s)                  | Output Node(s)                  | Sticky Note                                                                                                    |
|-------------------------|-------------------------------|---------------------------------------------------|-------------------------------|-------------------------------|----------------------------------------------------------------------------------------------------------------|
| Gmail Trigger           | Gmail Trigger                 | Triggers on new invoice emails                     |                               | Code in JavaScript             | See Sticky Note2: Explains Gmail trigger and extraction setup with Google client setup link                    |
| Code in JavaScript      | Code                         | Extracts first PDF/image attachment and encodes   | Gmail Trigger                 | Has Valid Attachment?          |                                                                                                                |
| Has Valid Attachment?   | If                           | Checks presence of valid attachment                | Code in JavaScript            | Extract Text                  |                                                                                                                |
| Extract Text            | HTTP Request                 | Sends attachment to OCR.space API                   | Has Valid Attachment?         | Parse Invoice Data            |                                                                                                                |
| Parse Invoice Data      | Code                         | Parses OCR text, extracts and validates invoice    | Extract Text                  | Check Qualification           |                                                                                                                |
| Check Qualification     | If                           | Determines if invoice passes validation             | Parse Invoice Data            | Append or update row in sheet / Slack Rejection message |                                                                                                                |
| Append or update row in sheet | Google Sheets              | Logs invoice data, append or update row             | Check Qualification           | Format for Slack              |                                                                                                                |
| Slack Rejection message | Slack                        | Sends Slack message about rejection                 | Check Qualification           |                               |                                                                                                                |
| Format for Slack        | Code                         | Prepares data for Slack notification                 | Append or update row in sheet | Clean Invoice Payload         |                                                                                                                |
| Clean Invoice Payload   | Code                         | Cleans invoice data before Slack approval           | Format for Slack              | Slack Approval Request        |                                                                                                                |
| Slack Approval Request  | Slack                        | Sends Slack approval message, waits for response   | Clean Invoice Payload         | Was Approved?                 | See Sticky Note1: Explains Slack approval workflow with setup link                                            |
| Was Approved?           | If                           | Checks Slack approval response                       | Slack Approval Request        | Get many contacts / Add Rejected label |                                                                                                                |
| Get many contacts       | Xero                         | Retrieves contacts from Xero                          | Was Approved?                 | Create invoice               |                                                                                                                |
| Create invoice          | HTTP Request                 | Creates draft invoice in Xero API                    | Get many contacts             | Add Processed label           |                                                                                                                |
| Add Processed label     | Gmail                        | Labels email as processed                            | Create invoice                | Update Approved Status        |                                                                                                                |
| Update Approved Status  | Google Sheets                | Updates invoice status to Approved                   | Add Processed label           | Success message              |                                                                                                                |
| Success message         | Slack                        | Sends Slack confirmation of successful posting      | Update Approved Status        |                               |                                                                                                                |
| Add Rejected label      | Gmail                        | Labels email as rejected                             | Was Approved? (rejection)     | Update Rejected Status        |                                                                                                                |
| Update Rejected Status  | Google Sheets                | Updates invoice status to Rejected                   | Add Rejected label            | Rejection message            |                                                                                                                |
| Rejection message       | Slack                        | Sends Slack message explaining rejection            | Update Rejected Status        |                               |                                                                                                                |
| Sticky Note             | Sticky Note                  | Describes entire workflow with detailed overview    |                               |                               | See full content in section 5                                                                                  |
| Sticky Note1            | Sticky Note                  | Explains Slack approval block                        |                               |                               | See Slack approval workflow link: https://docs.n8n.io/integrations/slack/                                     |
| Sticky Note2            | Sticky Note                  | Explains Gmail & OCR extraction block               |                               |                               | See Gmail and HTTP Request docs link: https://docs.n8n.io/integrations/builtin/email-read-imap/                |
| Sticky Note3            | Sticky Note                  | Explains Xero posting & notification block          |                               |                               | See Xero and Gmail automation docs: https://docs.n8n.io/integrations/xero/                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger node**  
   - Type: Gmail Trigger  
   - Poll interval: Every minute  
   - Filter query: `has:attachment filename:pdf`  
   - Enable attachment download  
   - Connect Gmail OAuth2 credentials  
   
2. **Add "Code in JavaScript" node** (extract attachment)  
   - Input: Gmail Trigger  
   - JavaScript: Extract first PDF or image attachment, base64 encode, build data URL  
   - Outputs email metadata and attachment data for OCR  
   
3. **Add "If" node Has Valid Attachment?**  
   - Condition: Check if `error` field exists in previous node output (attachment missing or invalid)  
   - True: proceed to Extract Text  
   - False: (handle error or halt)  
   
4. **Add HTTP Request node Extract Text**  
   - Input: Has Valid Attachment? (true branch)  
   - Method: POST  
   - URL: `https://api.ocr.space/parse/image`  
   - Body: JSON, pass base64 data and API key from OCR.space credential named `ocrspaceApi`  
   - Credential: ocrspaceApi (HTTP Credentials in n8n)  
   
5. **Add "Code in JavaScript" node Parse Invoice Data**  
   - Input: Extract Text  
   - Parse OCR text using regex for vendor, invoice number, amount, currency, invoice date, due date, description  
   - Validate fields, set `qualified` flag and `redFlags` array  
   
6. **Add "If" node Check Qualification**  
   - Condition: `qualified` equals true  
   - True branch: proceed to logging and approval  
   - False branch: trigger Slack rejection message and stop approval flow  
   
7. **Add Google Sheets node Append or update row in sheet**  
   - Input: Check Qualification (true)  
   - Operation: appendOrUpdate by Invoice Number  
   - Columns: map invoice data fields including "Status" as "Pending" and timestamp  
   - Credential: Google Sheets OAuth2  
   - Specify your spreadsheet ID and sheet name (e.g., gid=0 / Sheet1)  
   
8. **Add "Code in JavaScript" node Format for Slack**  
   - Input: Append or update row in sheet  
   - Extract invoice fields to prepare for Slack message (vendor, amount, currency, invoiceNumber, invoiceDate, dueDate, description)  
   
9. **Add "Code in JavaScript" node Clean Invoice Payload**  
   - Input: Format for Slack  
   - Remove unwanted fields (vendor, itemCode) for clean downstream data  
   
10. **Add Slack node Slack Approval Request**  
    - Input: Clean Invoice Payload  
    - Channel: finance approval channel (e.g., `invoice-approvals`)  
    - Message template with invoice details  
    - Approval type: double approval  
    - OAuth2 Slack credential  
    - Wait for user response  
   
11. **Add "If" node Was Approved?**  
    - Condition: Slack approval response `approved` equals true  
    - True branch: proceed to Xero posting  
    - False branch: proceed to rejection handling  
   
12. **Add Xero node Get many contacts**  
    - Input: Was Approved? (true)  
    - Resource: Contact, operation: getAll (optionally filter by vendor)  
    - Credential: Xero OAuth2  
   
13. **Add HTTP Request node Create invoice**  
    - Input: Get many contacts  
    - POST to `https://api.xero.com/api.xro/2.0/Invoices`  
    - Body: JSON invoice draft with contact ID, invoice details, line items, amount  
    - Headers include `xero-tenant-id` from credential  
    - Credential: Xero OAuth2  
   
14. **Add Gmail node Add Processed label**  
    - Input: Create invoice  
    - Add Gmail label "Processed" to original email ID  
    - Credential: Gmail OAuth2  
   
15. **Add Google Sheets node Update Approved Status**  
    - Input: Add Processed label  
    - Update row with Status = "Approved" matching Invoice Number  
    - Credential: Google Sheets OAuth2  
   
16. **Add Slack node Success message**  
    - Input: Update Approved Status  
    - Sends confirmation to Slack channel about invoice posted to Xero  
    - Credential: Slack OAuth2  
   
17. **Add Gmail node Add Rejected label**  
    - Input: Was Approved? (false)  
    - Adds label "Rejected" to original email  
    - Credential: Gmail OAuth2  
   
18. **Add Google Sheets node Update Rejected Status**  
    - Input: Add Rejected label  
    - Update row with Status = "Rejected" matching Invoice Number  
    - Credential: Google Sheets OAuth2  
   
19. **Add Slack node Rejection message**  
    - Input: Update Rejected Status  
    - Sends Slack message explaining rejection reason with red flags  
    - Credential: Slack OAuth2  

20. **Add Slack node Slack Rejection message** (alternative rejection path)  
    - Input: Check Qualification (false branch)  
    - Sends Slack message about auto-rejection due to qualification failure

21. **Add Sticky Note nodes** (optional)  
    - Add for documentation within workflow for overview, Slack approval, Gmail/OCR section, and Xero integration

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                             | Context or Link                                                                                           |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| This n8n template automates invoice extraction, validation, approval, and syncing to Xero, reducing manual processing and errors. It includes Gmail triggers, OCR.space integration, Slack approval workflows, Google Sheets logging, and Xero invoice creation.                                                                                                           | Main sticky note within workflow (node "Sticky Note")                                                    |
| Slack approval workflow uses Slack OAuth2 with interactive messages and double approval setup. Replace your Slack Client ID and configure accordingly.                                                                                                                                                                                                                   | Sticky Note1 with link: https://docs.n8n.io/integrations/slack/                                         |
| Gmail trigger listens for email attachments and downloads them to process. Setup requires Google Cloud Console for OAuth2 credentials.                                                                                                                                                                                                                                   | Sticky Note2 with link: https://docs.n8n.io/integrations/builtin/email-read-imap/                        |
| Xero integration uses OAuth2 to fetch contacts and post draft invoices. Workflow labels emails in Gmail to track processed vs rejected invoices.                                                                                                                                                                                                                         | Sticky Note3 with link: https://docs.n8n.io/integrations/xero/                                           |
| Customize by changing approval channels, invoice thresholds, or replacing Google Sheets with Airtable or Notion. Add reminders if no approval received in 24h.                                                                                                                                                                                                         | General customization notes in main sticky note                                                         |
| Requires secure credential management via n8n credential types for Gmail, OCR.space, Slack, Google Sheets, and Xero. No hardcoded sensitive data.                                                                                                                                                                                                                       | Security note in main sticky note                                                                        |
| OCR.space API key must be added as HTTP Credential named `ocrspaceApi` in n8n.                                                                                                                                                                                                                                                                                           | Credential setup note                                                                                     |
| Google Sheets spreadsheet ID and sheet name must be configured in Append/Update and Update nodes.                                                                                                                                                                                                                                                                       | Configuration note                                                                                        |
| Slack channel used is named "invoice-approvals" with channel ID configured in Slack nodes.                                                                                                                                                                                                                                                                               | Slack configuration note                                                                                  |
| Gmail labels "Processed" and "Rejected" must exist in Gmail account or be created beforehand.                                                                                                                                                                                                                                                                           | Gmail label setup note                                                                                    |

---

This documentation fully describes the workflow structure, node configuration, logic flow, and integration points, allowing advanced users or AI agents to understand, reproduce, and extend the invoice processing system efficiently.