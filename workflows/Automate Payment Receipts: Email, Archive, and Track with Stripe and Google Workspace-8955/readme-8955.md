Automate Payment Receipts: Email, Archive, and Track with Stripe and Google Workspace

https://n8nworkflows.xyz/workflows/automate-payment-receipts--email--archive--and-track-with-stripe-and-google-workspace-8955


# Automate Payment Receipts: Email, Archive, and Track with Stripe and Google Workspace

### 1. Workflow Overview

This workflow automates the processing of recent payment invoices from Stripe by fetching invoices, filtering for paid and non-receipted invoices, downloading invoice PDFs, emailing receipts to customers, archiving the PDFs in Google Drive, and logging invoice details in a Google Sheets ledger. It also includes error logging for monitoring failed API calls or data issues.

The workflow is structured into the following logical blocks:

- **1.1 Input Trigger:** Manual trigger to start the workflow.
- **1.2 Data Fetching:** Retrieves the latest invoices from Stripe.
- **1.3 Data Validation & Expansion:** Validates API response and splits invoice list into individual invoices.
- **1.4 Conditional Filtering:** Checks invoice payment status and whether a receipt email was already sent.
- **1.5 File Download:** Downloads the invoice PDF from Stripe.
- **1.6 Email Sending:** Sends a payment receipt email with the invoice PDF attached.
- **1.7 File Archiving:** Uploads the invoice PDF to Google Drive.
- **1.8 Ledger Update:** Appends invoice metadata to a Google Sheets ledger.
- **1.9 Error Handling:** Logs errors to a dedicated Google Sheets document.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Trigger

- **Overview:** Starts the workflow manually.
- **Nodes Involved:** `When clicking ‘Execute workflow’`
- **Node Details:**
  - **Type:** Manual Trigger
  - **Role:** Entry point to initiate workflow execution.
  - **Configuration:** No parameters; just user-initiated.
  - **Inputs:** None
  - **Outputs:** Connects to `Fetch Invoices`
  - **Edge Cases:** None; manual trigger only.
  - **Version:** 1

#### 1.2 Data Fetching

- **Overview:** Fetches the 5 most recent invoices from Stripe using authenticated API requests.
- **Nodes Involved:** `Fetch Invoices`, `Sticky Note` (Documentation)
- **Node Details:**
  - **Fetch Invoices**
    - **Type:** HTTP Request
    - **Role:** Calls Stripe API endpoint `/v1/invoices?limit=5` to retrieve invoices.
    - **Configuration:** Uses Bearer token from Stripe credentials; limit set to 5.
    - **Inputs:** Triggered by manual trigger.
    - **Outputs:** JSON response containing invoices list.
    - **Edge Cases:** API failures, invalid credentials, empty response.
    - **Version:** 4.2
  - **Sticky Note**
    - Documents the purpose of the Fetch Invoices node.

#### 1.3 Data Validation & Expansion

- **Overview:** Validates the API response to ensure invoice data exists, then splits the list into individual invoices for processing.
- **Nodes Involved:** `Check API Response`, `Expand List`, `Sticky Note5`, `Sticky Note9`
- **Node Details:**
  - **Check API Response**
    - **Type:** IF Node
    - **Role:** Checks if `data` array exists in Stripe API response.
    - **Config:** Condition checks for existence of `$json.data`.
    - **Inputs:** Output of `Fetch Invoices`
    - **Outputs:** If true, proceeds to `Expand List`; if false, routes to `Error Logging`.
    - **Edge Cases:** Empty or malformed API responses.
    - **Version:** 2.2
  - **Expand List**
    - **Type:** SplitOut
    - **Role:** Splits the invoices array into individual invoice JSON objects.
    - **Config:** Splits on `data` field.
    - **Inputs:** Output of `Check API Response` (true branch)
    - **Outputs:** Individual invoices to `IF (Paid?)`.
    - **Edge Cases:** Empty arrays, unexpected data structure.
    - **Version:** 1

#### 1.4 Conditional Filtering

- **Overview:** Filters invoices to only process those that are paid and have not had a receipt sent.
- **Nodes Involved:** `IF (Paid?)`, `IF (Already Receipted?)`, `Sticky Note4`, `Sticky Note3`
- **Node Details:**
  - **IF (Paid?)**
    - **Type:** IF Node
    - **Role:** Routes invoices based on payment status (`status == "paid"`).
    - **Inputs:** Individual invoices from `Expand List`.
    - **Outputs:** Paid invoices to `IF (Already Receipted?)`; others skipped.
    - **Edge Cases:** Missing or unexpected `status` field.
    - **Version:** 2.2
  - **IF (Already Receipted?)**
    - **Type:** IF Node
    - **Role:** Checks invoice metadata field `receipt_sent` equals `"false"`.
    - **Inputs:** Paid invoices from `IF (Paid?)`.
    - **Outputs:** If `receipt_sent` is false, continues to `Download File`; else skips.
    - **Edge Cases:** Missing metadata, inconsistent data types.
    - **Version:** 2.2

#### 1.5 File Download

- **Overview:** Downloads the invoice PDF from the Stripe-hosted URL to obtain the binary file for email attachment and archiving.
- **Nodes Involved:** `Download File`, `Sticky Note2`
- **Node Details:**
  - **Download File**
    - **Type:** HTTP Request
    - **Role:** Downloads the invoice PDF binary from the URL in `$json.invoice_pdf`.
    - **Config:** Response format set to file (binary).
    - **Inputs:** Filtered invoices from `IF (Already Receipted?)`.
    - **Outputs:** Binary PDF file output to `Send Receipt Email` and `Upload Invoice PDF`.
    - **Edge Cases:** Broken URLs, network errors, missing PDF link.
    - **Version:** 4.2

#### 1.6 Email Sending

- **Overview:** Sends an email to the customer with the invoice PDF attached.
- **Nodes Involved:** `Send Receipt Email`, `Sticky Note1`
- **Node Details:**
  - **Send Receipt Email**
    - **Type:** Gmail Node
    - **Role:** Sends payment receipt email with invoice attachment.
    - **Config:** 
      - Recipient: `$json.customer_email`
      - Subject: `"Payment Receipt - Invoice {{$json.number}}"`
      - Message body includes customer name, invoice number, currency, and total.
      - Attachment: Binary PDF from `Download File`.
    - **Inputs:** PDF file from `Download File`.
    - **Outputs:** None (endpoint).
    - **Credentials:** Gmail OAuth2.
    - **Edge Cases:** Email sending failures, invalid email addresses.
    - **Version:** 2.1

#### 1.7 File Archiving

- **Overview:** Uploads the invoice PDF to a designated Google Drive folder named by the invoice number.
- **Nodes Involved:** `Upload Invoice PDF`, `Sticky Note7`
- **Node Details:**
  - **Upload Invoice PDF**
    - **Type:** Google Drive Node
    - **Role:** Uploads invoice PDF with filename `${number}.pdf` to specified Drive folder.
    - **Config:** Folder ID and Drive ID set via URLs (replace placeholders).
    - **Inputs:** PDF file from `Download File`.
    - **Outputs:** File metadata to `Append to Ledger`.
    - **Credentials:** Google Drive OAuth2.
    - **Edge Cases:** Permission errors, folder not found, upload failures.
    - **Version:** 3

#### 1.8 Ledger Update

- **Overview:** Appends invoice and uploaded file metadata to a Google Sheets ledger for accounting and tracking.
- **Nodes Involved:** `Append to Ledger`, `Sticky Note6`
- **Node Details:**
  - **Append to Ledger**
    - **Type:** Google Sheets Node
    - **Role:** Adds a new row with invoice date, number, file name, Drive link, file ID, file size, etc.
    - **Config:** Spreadsheet ID and sheet name provided via URLs (replace placeholders).
    - **Inputs:** File metadata from `Upload Invoice PDF`.
    - **Outputs:** None (endpoint).
    - **Credentials:** Google Sheets OAuth2.
    - **Edge Cases:** Spreadsheet access errors, schema mismatches.
    - **Version:** 4.6

#### 1.9 Error Handling

- **Overview:** Logs any errors or failures detected during the workflow execution to a dedicated Google Sheets error log.
- **Nodes Involved:** `Error Logging`, `Sticky Note8`
- **Node Details:**
  - **Error Logging**
    - **Type:** Google Sheets Node
    - **Role:** Appends error details as rows in an error tracking spreadsheet.
    - **Config:** Spreadsheet and sheet name via URLs (replace placeholders).
    - **Inputs:** Triggered by failed `Check API Response`.
    - **Outputs:** None.
    - **Credentials:** Google Sheets OAuth2.
    - **Edge Cases:** Failure to log errors due to spreadsheet permissions.
    - **Version:** 4.6

---

### 3. Summary Table

| Node Name                   | Node Type          | Functional Role                                 | Input Node(s)                | Output Node(s)                                | Sticky Note                                                                                             |
|-----------------------------|--------------------|------------------------------------------------|-----------------------------|-----------------------------------------------|-------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger     | Starts workflow manually                        | None                        | Fetch Invoices                                |                                                                                                       |
| Fetch Invoices              | HTTP Request       | Fetches 5 most recent Stripe invoices          | When clicking ‘Execute workflow’ | Check API Response                            | Fetch Invoices: Makes authenticated request to Stripe API to retrieve 5 invoices                       |
| Check API Response          | IF                 | Validates presence of data array in API response | Fetch Invoices              | Expand List, Error Logging                     | Validates Stripe API returned proper data array                                                        |
| Expand List                | SplitOut           | Splits invoices list into individual invoices   | Check API Response          | IF (Paid?)                                    | Splits Stripe’s invoice list into single invoice items                                                 |
| IF (Paid?)                 | IF                 | Checks if invoice status is “paid”               | Expand List                 | IF (Already Receipted?)                        | Routes invoices based on payment status                                                                |
| IF (Already Receipted?)    | IF                 | Checks if receipt already sent (metadata)        | IF (Paid?)                  | Download File                                 | Filters out invoices that already have a receipt sent                                                  |
| Download File              | HTTP Request       | Downloads invoice PDF binary                      | IF (Already Receipted?)     | Send Receipt Email, Upload Invoice PDF        | Downloads the invoice PDF from Stripe                                                                  |
| Send Receipt Email         | Gmail              | Sends receipt email with PDF attached             | Download File               | None                                          | Sends payment receipt email with the PDF attached                                                     |
| Upload Invoice PDF         | Google Drive       | Uploads invoice PDF to Google Drive folder        | Download File               | Append to Ledger                              | Stores the invoice PDF in Google Drive                                                                 |
| Append to Ledger           | Google Sheets      | Logs invoice and file metadata in ledger sheet    | Upload Invoice PDF          | None                                          | Updates Google Sheet with invoice + Drive file metadata                                               |
| Error Logging              | Google Sheets      | Logs workflow errors in error tracking sheet      | Check API Response (fail)   | None                                          | Logs workflow errors and failures for monitoring                                                      |
| Sticky Note                | Sticky Note        | Documentation node                                |                             |                                               | Various sticky notes documenting node purposes                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**
   - Name: `When clicking ‘Execute workflow’`
   - Type: Manual Trigger
   - No parameters.
   - Connect output to next node.

2. **Create HTTP Request Node to Fetch Invoices**
   - Name: `Fetch Invoices`
   - Type: HTTP Request
   - HTTP Method: GET
   - URL: `https://api.stripe.com/v1/invoices?limit=5`
   - Add header: `Authorization` with value: `Bearer {{$credentials.stripe.secret.key}}`
   - Credential: Stripe API key (set up Stripe API credentials with secret key).
   - Connect input from Manual Trigger.

3. **Create IF Node to Check API Response**
   - Name: `Check API Response`
   - Type: IF
   - Condition: Check if `$json.data` exists (array exists, single value true).
   - Connect input from `Fetch Invoices`.
   - On True, connect to next node; on False, connect to Error Logging node.

4. **Create SplitOut Node to Expand Invoices List**
   - Name: `Expand List`
   - Type: SplitOut
   - Field to split out: `data`
   - Connect input from `Check API Response` (true branch).

5. **Create IF Node to Check Paid Status**
   - Name: `IF (Paid?)`
   - Type: IF
   - Condition: `$json.status == "paid"`
   - Connect input from `Expand List`.
   - True branch connects to next IF node; False branch ends or skips.

6. **Create IF Node to Check if Receipt Already Sent**
   - Name: `IF (Already Receipted?)`
   - Type: IF
   - Condition: `$json.metadata.receipt_sent == "false"`
   - Connect input from `IF (Paid?)`.
   - True branch connects to File Download node; False branch ends or skips.

7. **Create HTTP Request Node to Download Invoice PDF**
   - Name: `Download File`
   - Type: HTTP Request
   - Method: GET
   - URL: `{{$json["invoice_pdf"]}}`
   - Response format: File (binary)
   - Connect input from `IF (Already Receipted?)`.

8. **Create Gmail Node to Send Receipt Email**
   - Name: `Send Receipt Email`
   - Type: Gmail
   - Credential: Gmail OAuth2 configured with valid account.
   - Send To: `{{$json.customer_email}}`
   - Subject: `Payment Receipt - Invoice {{$json.number}}`
   - Message: 
     ```
     Hi {{$json.customer_name}},  
     
     Thanks for your payment.  
     Attached is your receipt for invoice {{$json.number}} (Total: {{$json.currency}} {{$json.total}}).  
     
     Regards,  
     Your Company
     ```
   - Attachments: Binary data from `Download File`.
   - Connect input from `Download File`.

9. **Create Google Drive Node to Upload Invoice PDF**
   - Name: `Upload Invoice PDF`
   - Type: Google Drive
   - Credential: Google Drive OAuth2 configured.
   - File Name: `{{$json["number"]}}.pdf`
   - Folder ID: Set to your designated Google Drive folder ID.
   - Connect input from `Download File`.

10. **Create Google Sheets Node to Append to Ledger**
    - Name: `Append to Ledger`
    - Type: Google Sheets
    - Credential: Google Sheets OAuth2 configured.
    - Operation: Append
    - Spreadsheet ID: Your ledger spreadsheet ID
    - Sheet Name: Ledger sheet name
    - Columns: Map to invoice date, invoice number, file name, Drive file link, file ID, file size.
    - Connect input from `Upload Invoice PDF`.

11. **Create Google Sheets Node for Error Logging**
    - Name: `Error Logging`
    - Type: Google Sheets
    - Credential: Google Sheets OAuth2 configured.
    - Operation: Append
    - Spreadsheet ID: Your error log spreadsheet ID
    - Sheet Name: Error log sheet name
    - Columns: Map error details (error message, node, timestamp).
    - Connect input from `Check API Response` false branch.

12. **Connect Nodes According to the logical flow described above.**

13. **Replace placeholders for URLs and credentials with your actual account details:**
    - Stripe API key in credentials.
    - Google Drive folder ID and Drive ID.
    - Google Sheets spreadsheet IDs and sheet names.
    - Gmail OAuth2 credentials.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                              | Context or Link                                                                                   |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| The workflow assumes that the Stripe invoice metadata field `receipt_sent` is manually or programmatically set to `"false"` before receipt sending.       | Important for filtering invoices that need receipt emails.                                       |
| Replace all placeholders such as `{{YOUR_GOOGLE_DRIVE_URL}}` and `{{YOUR_SPREADSHEET_URL}}` with actual URLs or IDs from your Google Workspace setup.      | Credentials and parameters for Google Drive and Sheets must be configured correctly.             |
| Gmail node requires OAuth2 credentials with access to send emails on behalf of the configured account.                                                     | Set up Gmail OAuth2 credentials in n8n credentials panel.                                        |
| The workflow is designed for manual execution but can be adapted for scheduled triggers to automate recurring invoice processing.                         | Consider setting up a Cron node for automation if needed.                                        |
| Error logging is critical for monitoring failures in API calls or data processing; ensure the error log sheet is accessible and has sufficient permissions.|                                                                                                 |
| For advanced use, update the `receipt_sent` metadata on Stripe invoices after successful email dispatch to avoid duplicate emails. This requires an additional API call not included here. | Stripe API documentation: https://stripe.com/docs/api/invoices/update                             |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled are legal and public.