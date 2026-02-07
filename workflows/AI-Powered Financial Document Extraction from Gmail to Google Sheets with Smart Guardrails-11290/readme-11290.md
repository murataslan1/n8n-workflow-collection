AI-Powered Financial Document Extraction from Gmail to Google Sheets with Smart Guardrails

https://n8nworkflows.xyz/workflows/ai-powered-financial-document-extraction-from-gmail-to-google-sheets-with-smart-guardrails-11290


# AI-Powered Financial Document Extraction from Gmail to Google Sheets with Smart Guardrails

### 1. Workflow Overview

This workflow automates the extraction and processing of financial documents (invoices, receipts, bills) received via Gmail, leveraging AI-powered OCR and smart guardrails for accuracy and relevance. It targets finance teams, freelancers, and operations managers who want to automate invoice data capture, validation, categorization, and logging in Google Sheets, while also handling errors and notifying administrators.

The workflow is logically structured into these functional blocks:

- **1.1 Email Ingestion and Filtering:** Watches Gmail inbox for new emails, retrieves full email data and attachments, and uses AI "Guardrails" to filter emails relevant to finance.
- **1.2 Financial Content Verification:** Applies a Gemini-based AI guardrail to ensure the email contains financial transaction information before continuing.
- **1.3 Finance Keyword Filtering:** Further filters emails by checking subject lines for finance-related keywords.
- **1.4 Attachment Check and Data Extraction:** Branches based on the presence of attachments. If a PDF attachment exists, it extracts text via PDF OCR AI; otherwise, it extracts data from the email body with AI.
- **1.5 Data Validation:** Validates the AI-extracted JSON data for completeness and correctness.
- **1.6 Business Logic and Categorization:** Assigns GL categories and approval statuses based on vendor names and invoice amounts.
- **1.7 Logging and Notifications:** Records validated invoices into Google Sheets, logs errors separately, sends confirmation emails on success, and error notifications on failures.
- **1.8 Metrics Logging:** Tracks success metrics including processing time and email notifications sent.

---

### 2. Block-by-Block Analysis

#### 2.1 Email Ingestion and Filtering

**Overview:**  
This block monitors the Gmail inbox for incoming emails, retrieves email content including attachments, and prepares the data for AI-based processing.

**Nodes Involved:**  
- Look for Invoices (Gmail Trigger)  
- Get Email Content (Gmail)  
- Guardrail: Is Finance? (LangChain Guardrails)  
- Configuration: User Settings (Set)  
- IF (Guardrail Passed) (If)

**Node Details:**

- **Look for Invoices**  
  - Type: Gmail Trigger  
  - Role: Watches Gmail inbox label "INBOX" every hour for new emails.  
  - Config: Poll interval set to every hour; label filter "INBOX".  
  - Input: None (trigger node)  
  - Output: Email metadata (IDs) forwarded to Get Email Content  
  - Failure Modes: Gmail auth errors, API rate limits, network issues.

- **Get Email Content**  
  - Type: Gmail  
  - Role: Fetches full email content and attachments for the new messages detected.  
  - Config: Fetch all details, download attachments enabled, limit 1 per trigger.  
  - Input: Output from Look for Invoices  
  - Output: Full email JSON including text and binary attachments  
  - Failure Modes: Authentication errors, downloading large attachments may timeout.

- **Guardrail: Is Finance?**  
  - Type: LangChain Guardrails  
  - Role: Uses Gemini AI to analyze email text for topical alignment with financial transactions.  
  - Config: Custom Gemini prompt defining scope of finance-related emails, threshold set to 0.8 for confidence.  
  - Expression: Input text bound to email's text content `={{ $('Get Email Content').item.json.text }}`  
  - Input: Email content from Get Email Content  
  - Output: Boolean flag indicating if email is finance-related  
  - Failure Modes: AI service downtime, prompt errors, misclassification risks.

- **Configuration: User Settings**  
  - Type: Set  
  - Role: Stores user-specific settings such as Google Sheet ID and admin email for notifications.  
  - Config: User must enter Google Sheet ID and admin email address.  
  - Input: Output from Guardrail  
  - Output: Passes settings downstream  
  - Failure Modes: Missing or incorrect Google Sheet ID or email may disrupt later nodes.

- **IF (Guardrail Passed)**  
  - Type: If  
  - Role: Branches workflow based on whether the Guardrail AI approved the email as finance-related.  
  - Config: Condition checks that guardrail "triggered" flag is false (meaning on-topic).  
  - Input: User Settings node output  
  - Output: Passes only finance-related emails to next block, stops others.  
  - Failure Modes: Expression evaluation errors, logical misinterpretation.

---

#### 2.2 Finance Keyword Filtering

**Overview:**  
Further narrows down finance emails by checking if the email subject contains key finance words like "Invoice", "Receipt", "Bill", or "Payment Confirmation".

**Nodes Involved:**  
- Filter Finance Keywords (Filter)

**Node Details:**

- **Filter Finance Keywords**  
  - Type: Filter  
  - Role: Checks if email subject contains finance keywords.  
  - Config: Conditions ORed for strings containing "Invoice", "Receipt", "Bill", or "Payment Confirmation" in the subject.  
  - Expression examples: `={{ $('Get Email Content').item.json.subject }}`  
  - Input: Output from IF (Guardrail Passed) node  
  - Output: Passes emails matching finance keywords forward  
  - Failure Modes: Case sensitivity issues, missing subject field in email JSON.

---

#### 2.3 Attachment Check and Data Extraction

**Overview:**  
Determines if the email has attachments. If yes, extracts PDF data via OCR; if no, extracts data from email body text. Both extraction methods normalize data into a unified JSON structure.

**Nodes Involved:**  
- Check for Attachment (If)  
- Extract PDF Data (Extract from File)  
- AI Agent (PDF OCR) (LangChain Agent)  
- AI Agent (Email OCR) (LangChain Agent)  

**Node Details:**

- **Check for Attachment**  
  - Type: If  
  - Role: Checks if the email contains any binary attachments.  
  - Config: Condition checks if binary object keys count > 0.  
  - Input: Output from Filter Finance Keywords  
  - Output: Passes to PDF extraction if attachments exist, else to email body extraction.  
  - Failure Modes: Binary property missing or malformed, false negatives if attachment not detected.

- **Extract PDF Data**  
  - Type: Extract from File  
  - Role: Extracts text from the first PDF attachment binary property.  
  - Config: Operation set to PDF, binaryPropertyName dynamically set to first binary key or "attachment_0".  
  - Input: Attachment binary data from Check for Attachment  
  - Output: Extracted text from PDF for AI processing  
  - Failure Modes: Unsupported PDF formats, extraction errors, large PDF causing timeouts.

- **AI Agent (PDF OCR)**  
  - Type: LangChain Agent (OpenAI GPT-4o-mini)  
  - Role: Processes extracted PDF text to extract structured invoice data as JSON.  
  - Config: System message instructs to return strict JSON with normalized dates and numeric amounts; fields include vendor_name, invoice_date, invoice_id, total_amount, tax_amount, currency, items_summary, vendor_tax_id.  
  - Input: Text from Extract PDF Data  
  - Output: Parsed JSON invoice data or error message  
  - Failure Modes: AI response errors, JSON parsing failures, partial or incorrect extraction.

- **AI Agent (Email OCR)**  
  - Type: LangChain Agent (OpenAI GPT-4o-mini)  
  - Role: Extracts invoice/receipt data directly from email body text in the same JSON format as PDF OCR.  
  - Config: Similar system message as PDF OCR agent; invoice_id defaults to "EMAIL-RECEIPT" if missing.  
  - Input: Email text from Get Email Content  
  - Output: JSON invoice data or error  
  - Failure Modes: Same as PDF OCR, plus email text formatting issues.

---

#### 2.4 Data Validation

**Overview:**  
Validates AI-extracted JSON data for presence of required fields and numeric correctness, and flags errors for missing or invalid data.

**Nodes Involved:**  
- Validate Extraction (Code)  
- Check for Errors (If)

**Node Details:**

- **Validate Extraction**  
  - Type: Code  
  - Role: Parses AI output JSON, checks for errors, required fields (vendor_name, total_amount, invoice_date), and that total_amount is numeric. Returns validation result.  
  - Config: Runs once per item; returns error details or validated data.  
  - Input: Output from AI Agent nodes  
  - Output: JSON indicating success or error with messages and timestamps  
  - Failure Modes: JSON parse exceptions, unexpected AI response formats.

- **Check for Errors**  
  - Type: If  
  - Role: Branches workflow on whether validation passed or failed.  
  - Config: Condition tests if `error_occurred` is false to continue processing valid data.  
  - Input: Output from Validate Extraction  
  - Output: Passes valid data to business logic or routes errors to logging.  
  - Failure Modes: Expression errors, logic inversion.

---

#### 2.5 Business Logic and Categorization

**Overview:**  
Applies company-specific rules to assign General Ledger categories based on vendors, sets approval statuses based on invoice amounts, and generates case IDs.

**Nodes Involved:**  
- Apply Finance Rules (Code)  

**Node Details:**

- **Apply Finance Rules**  
  - Type: Code  
  - Role: Uses vendor name keyword matching to assign GL codes (e.g., Amazon/AWS → Software & Hosting), applies approval thresholds (> $5000 VP Approval, > $1000 Manager Approval), adds timestamp and unique case ID.  
  - Config: Runs once per item; string matching is case-insensitive.  
  - Input: Validated extraction data from Check for Errors  
  - Output: Enriched JSON with gl_category, approval_status, case_id, processed_at timestamp  
  - Failure Modes: Incorrect keyword matching, numeric parsing errors, time zone inconsistencies.

---

#### 2.6 Logging and Notifications

**Overview:**  
Logs validated invoices to Google Sheets, sends confirmation emails, logs errors to a separate sheet, and sends admin error notifications.

**Nodes Involved:**  
- Log to Invoices Sheet (Google Sheets)  
- Send Confirmation Email (Gmail)  
- Log Error to Sheet (Google Sheets)  
- Send Error Notification (Gmail)  

**Node Details:**

- **Log to Invoices Sheet**  
  - Type: Google Sheets  
  - Role: Appends processed invoice data to "Invoices" tab in configured Google Sheet.  
  - Config: Auto-mapping input JSON fields to sheet columns; document ID and sheet name from user settings.  
  - Input: Output from Apply Finance Rules  
  - Output: Success/failure status  
  - Failure Modes: Sheet permissions, invalid sheet ID, API quota limits.

- **Send Confirmation Email**  
  - Type: Gmail  
  - Role: Sends HTML email to configured admin email confirming successful invoice processing, including vendor, amount, GL category, and approval status.  
  - Config: Email content templated with dynamic placeholders from processed data.  
  - Input: Output from Log to Invoices Sheet  
  - Output: Email sent status  
  - Failure Modes: Gmail auth errors, invalid recipient email.

- **Log Error to Sheet**  
  - Type: Google Sheets  
  - Role: Appends error details (timestamp, error type, message, original email subject, workflow run ID) to an "Error Logs" sheet.  
  - Config: Explicit mapping of error JSON fields; document ID from user settings.  
  - Input: Errors from Validate Extraction and Check for Errors failure branch  
  - Output: Logging status  
  - Failure Modes: Same as Log to Invoices Sheet.

- **Send Error Notification**  
  - Type: Gmail  
  - Role: Sends admin an error notification email with error message and original email subject.  
  - Config: HTML email templated with error details.  
  - Input: Output from Log Error to Sheet  
  - Output: Email sent status  
  - Failure Modes: Same as Send Confirmation Email.

---

#### 2.7 Metrics Logging

**Overview:**  
Tracks workflow success metrics including vendor, amount, case ID, timestamp, GL category, approval status, email sent status, and processing time.

**Nodes Involved:**  
- Log Success Metrics (Google Sheets)  

**Node Details:**

- **Log Success Metrics**  
  - Type: Google Sheets  
  - Role: Appends success metrics to a "Success Metrics" sheet in the configured Google Sheet.  
  - Config: Fields include amount, vendor, case_id, timestamp, email_sent status, GL category, approval status, and processing time in seconds (calculated from workflow start).  
  - Input: Output from Send Confirmation Email  
  - Output: Logging status  
  - Failure Modes: Same as other Google Sheets nodes.

---

### 3. Summary Table

| Node Name               | Node Type                       | Functional Role                              | Input Node(s)                  | Output Node(s)                       | Sticky Note                                                                                                            |
|-------------------------|--------------------------------|----------------------------------------------|--------------------------------|------------------------------------|------------------------------------------------------------------------------------------------------------------------|
| Look for Invoices        | Gmail Trigger                  | Watches inbox for new emails                   | None                           | Get Email Content                   |                                                                                                                        |
| Get Email Content        | Gmail                          | Fetches full email data and attachments       | Look for Invoices              | Guardrail: Is Finance?              |                                                                                                                        |
| Guardrail: Is Finance?   | LangChain Guardrails           | AI filters emails for finance relevance       | Get Email Content              | Configuration: User Settings        | ## 1. Finance Guardrails Uses Gemini/LangChain to detect if the email is actually a financial document.                 |
| Configuration: User Settings | Set                          | Stores Google Sheet ID and admin email        | Guardrail: Is Finance?         | IF (Guardrail Passed)               |                                                                                                                        |
| IF (Guardrail Passed)    | If                            | Branches on guardrail approval                  | Configuration: User Settings   | Filter Finance Keywords             |                                                                                                                        |
| Filter Finance Keywords  | Filter                        | Filters emails by finance keywords in subject | IF (Guardrail Passed)          | Check for Attachment                |                                                                                                                        |
| Check for Attachment     | If                            | Checks if email has attachments                 | Filter Finance Keywords        | Extract PDF Data / AI Agent (Email OCR) | ## 2. Dual Extraction Path If Attachment -> **PDF OCR Agent** If No Attachment -> **Email Body Agent** Both normalize data into the same JSON structure. |
| Extract PDF Data         | Extract from File             | Extracts text from PDF attachments              | Check for Attachment (true)    | AI Agent (PDF OCR)                 |                                                                                                                        |
| AI Agent (PDF OCR)       | LangChain Agent               | Extracts invoice data from PDF text             | Extract PDF Data               | Validate Extraction                |                                                                                                                        |
| AI Agent (Email OCR)     | LangChain Agent               | Extracts invoice data from email body text      | Check for Attachment (false)   | Validate Extraction                |                                                                                                                        |
| Validate Extraction      | Code                          | Validates AI extraction JSON data               | AI Agent (PDF OCR), AI Agent (Email OCR) | Check for Errors               |                                                                                                                        |
| Check for Errors         | If                            | Branches on validation success or failure       | Validate Extraction            | Apply Finance Rules / Log Error to Sheet | ## ⚠️ Error Handling Flow Any failures are logged and admins are notified                                               |
| Apply Finance Rules      | Code                          | Applies GL coding and approval thresholds       | Check for Errors (success)     | Log to Invoices Sheet              | ## 3. Business Logic - **GL Coding**: Auto-categorizes vendors (Uber -> Travel). - **Thresholds**: Flags high amounts (> $1000) for approval. |
| Log to Invoices Sheet    | Google Sheets                 | Logs validated invoices to sheet                 | Apply Finance Rules            | Send Confirmation Email           |                                                                                                                        |
| Send Confirmation Email  | Gmail                         | Sends confirmation email to admin                | Log to Invoices Sheet          | Log Success Metrics               | ## 📊 Success Metrics Logger                                                                                           |
| Log Success Metrics      | Google Sheets                 | Logs workflow success metrics                      | Send Confirmation Email        | None                             |                                                                                                                        |
| Log Error to Sheet       | Google Sheets                 | Logs extraction or validation errors              | Check for Errors (failure)     | Send Error Notification           |                                                                                                                        |
| Send Error Notification  | Gmail                         | Sends error notification email to admin           | Log Error to Sheet             | None                             |                                                                                                                        |
| Sticky Note Guardrail    | Sticky Note                   | Documentation on Finance Guardrails               | None                         | None                             | ## 1. Finance Guardrails Uses Gemini/LangChain to detect if the email is actually a financial document.                 |
| Sticky Note Extraction   | Sticky Note                   | Documentation on Dual Extraction Path              | None                         | None                             | ## 2. Dual Extraction Path If Attachment -> **PDF OCR Agent** If No Attachment -> **Email Body Agent** Both normalize data into the same JSON structure. |
| Sticky Note Logic        | Sticky Note                   | Documentation on Business Logic                     | None                         | None                             | ## 3. Business Logic - **GL Coding**: Auto-categorizes vendors (Uber -> Travel). - **Thresholds**: Flags high amounts (> $1000) for approval. |
| Sticky Note              | Sticky Note                   | Workflow overview and setup instructions            | None                         | None                             | ## Overview ... [contains detailed text and setup instructions including sheet template link](https://docs.google.com/spreadsheets/d/1IaovDHswLKbcQdEyfw-2JSYHOVX1pLNcTIYlJQzxYGU/copy) |
| Sticky Note21            | Sticky Note                   | Documentation on error handling flow                | None                         | None                             | ## ⚠️ Error Handling Flow Any failures are logged and admins are notified                                               |
| Sticky Note17            | Sticky Note                   | Documentation on success metrics logger              | None                         | None                             | ## 📊 Success Metrics Logger                                                                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger Node: "Look for Invoices"**  
   - Type: Gmail Trigger  
   - Configure to watch label "INBOX"  
   - Set polling interval to every hour

2. **Add Gmail Node: "Get Email Content"**  
   - Operation: Get All  
   - Enable downloading attachments  
   - Limit: 1 email at a time  
   - Connect input from "Look for Invoices"

3. **Add LangChain Guardrails Node: "Guardrail: Is Finance?"**  
   - Use Gemini 2.5 flash model (configured in credentials)  
   - Set input text expression to email body text: `={{ $('Get Email Content').item.json.text }}`  
   - Configure topical alignment guardrail with prompt defining financial transaction scope  
   - Set confidence threshold to 0.8  
   - Connect input from "Get Email Content"

4. **Add Set Node: "Configuration: User Settings"**  
   - Add string fields:  
     - gSheetID: *Your Google Sheet ID*  
     - adminEmailForErrors: *Your admin email*  
   - Connect input from "Guardrail: Is Finance?"

5. **Add If Node: "IF (Guardrail Passed)"**  
   - Condition: Check that guardrail triggered flag is false (`={{ $json.checks.triggered === false }}`)  
   - Connect input from "Configuration: User Settings"

6. **Add Filter Node: "Filter Finance Keywords"**  
   - Condition: OR any of these substrings exist in the email subject:  
     - "Invoice", "Receipt", "Bill", "Payment Confirmation"  
   - Input expression: `={{ $('Get Email Content').item.json.subject }}`  
   - Connect true branch from "IF (Guardrail Passed)"

7. **Add If Node: "Check for Attachment"**  
   - Condition: Check if any binary attachments exist (`Object.keys($binary || {}).length > 0`)  
   - Connect from "Filter Finance Keywords"

8. **Add Extract From File Node: "Extract PDF Data"**  
   - Operation: PDF text extraction  
   - Binary property name: dynamically set to first binary key or "attachment_0"  
   - Connect true branch from "Check for Attachment"

9. **Add LangChain Agent Node: "AI Agent (PDF OCR)"**  
   - Model: GPT-4o-mini (OpenAI)  
   - System message prompt instructing strict JSON output with normalized dates and numeric amounts  
   - Input text from "Extract PDF Data" text output  
   - Connect from "Extract PDF Data"

10. **Add LangChain Agent Node: "AI Agent (Email OCR)"**  
    - Same model and prompt as PDF OCR agent but input is email body text  
    - Input text: `={{ $('Get Email Content').item.json.text }}`  
    - Connect false branch from "Check for Attachment"

11. **Add Code Node: "Validate Extraction"**  
    - JavaScript code to parse AI JSON output, verify required fields (`vendor_name`, `total_amount`, `invoice_date`), ensure total_amount is numeric, return error details or validated data  
    - Connect from both AI Agent nodes

12. **Add If Node: "Check for Errors"**  
    - Condition: `error_occurred === false`  
    - Connect from "Validate Extraction"

13. **Add Code Node: "Apply Finance Rules"**  
    - JavaScript code:  
      - Map vendor names to GL categories (e.g., AWS/Amazon → "6000 - Software & Hosting")  
      - Set approval status based on amount thresholds (> $5000 VP Approval, > $1000 Manager Approval, else Auto-Approved)  
      - Generate unique case ID with timestamp prefix  
      - Add processing timestamp  
    - Connect true branch from "Check for Errors"

14. **Add Google Sheets Node: "Log to Invoices Sheet"**  
    - Operation: Append  
    - Sheet Name: "Invoices" (sheet ID dynamically from settings)  
    - Map invoice fields including vendor_name, invoice_date, total_amount, currency, tax_amount, gl_category, approval_status, case_id, items_summary, vendor_tax_id, processed_at  
    - Connect from "Apply Finance Rules"

15. **Add Gmail Node: "Send Confirmation Email"**  
    - Send To: `={{ $('Configuration: User Settings').item.json.adminEmailForErrors }}`  
    - HTML message includes vendor, amount, GL category, approval status, and note to check Google Sheet  
    - Subject includes vendor name and approval status  
    - Connect from "Log to Invoices Sheet"

16. **Add Google Sheets Node: "Log Success Metrics"**  
    - Operation: Append  
    - Sheet Name: "Success Metrics"  
    - Fields: amount, vendor, case_id, timestamp (current day), email_sent = "Yes", gl_category, approval_status, processing_time_seconds (calculated from workflow start time)  
    - Connect from "Send Confirmation Email"

17. **Add Google Sheets Node: "Log Error to Sheet"**  
    - Operation: Append  
    - Sheet Name: "Error Logs"  
    - Map error details: timestamp, error_type, error_message, original_subject (from initial email), workflow_execution_id  
    - Connect false branch from "Check for Errors"

18. **Add Gmail Node: "Send Error Notification"**  
    - Send To: admin email from settings  
    - HTML message includes error message and original email subject  
    - Subject prefixed with error icon and error type  
    - Connect from "Log Error to Sheet"

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                      | Context or Link                                                                                                                   |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| Manual financial reconciliation is tedious and error-prone. This workflow uses AI to automate invoice data extraction from Gmail and sync to Google Sheets with guardrails to filter non-financial emails.                          | Workflow overview sticky note                                                                                                    |
| Google Sheet template with necessary tabs (Invoices, Error Logs, Success Metrics) can be copied here: [Google Sheet Template](https://docs.google.com/spreadsheets/d/1IaovDHswLKbcQdEyfw-2JSYHOVX1pLNcTIYlJQzxYGU/copy)         | Setup instructions                                                                                                               |
| Requires n8n version 1.0+, Gmail account, OpenAI API Key (for GPT-4o-mini), and Google Gemini/PaLM API Key (for guardrails).                                                                                                       | Setup instructions                                                                                                               |
| Business logic includes vendor keyword matching for GL coding and approval thresholds to flag invoices requiring managerial or VP approval.                                                                                      | Sticky Note Logic                                                                                                                |
| Error handling ensures any failures during extraction or validation are logged and admins notified promptly, maintaining workflow reliability.                                                                                  | Sticky Note21                                                                                                                   |
| Success metrics logging helps track processing times, volumes, and approval statuses for auditing and process improvement.                                                                                                       | Sticky Note17                                                                                                                   |

---

This document fully describes the AI-Powered Financial Document Extraction workflow, enabling reproduction, modification, and troubleshooting for advanced users and automation agents alike.