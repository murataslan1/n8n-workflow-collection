Automate Employee Trip Expense Processing with Jotform, GPT-4.1 mini and Google Sheets

https://n8nworkflows.xyz/workflows/automate-employee-trip-expense-processing-with-jotform--gpt-4-1-mini-and-google-sheets-9579


# Automate Employee Trip Expense Processing with Jotform, GPT-4.1 mini and Google Sheets

### 1. Workflow Overview

This workflow automates the processing of employee trip expenses submitted via a Jotform form. It extracts, parses, and organizes uploaded receipts and invoices, then stores the data in Google Sheets and sends a formatted summary email to the finance team.

The workflow’s logic is divided into the following functional blocks:

- **1.1 Input Reception:** Triggered by a new Jotform submission containing employee trip details and uploaded expense files.
- **1.2 File Handling and Storage:** Extracts multiple uploaded files from the submission, uploads each to Google Drive, then extracts text content via PDF extraction.
- **1.3 AI Processing and Parsing:** Uses an AI document extraction agent (GPT-4.1 mini) to parse invoice details into structured JSON, applying a defined schema with a structured output parser.
- **1.4 Data Transformation and Storage:** Transforms parsed data and employee info into structured records, appends these expense records to a Google Sheet for tracking.
- **1.5 Email Generation and Notification:** Generates an HTML email template summarizing the employee’s trip expenses with detailed itemization and sends it to the finance team for review and reimbursement.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block listens for new submissions on the configured Jotform expense report. It captures employee and trip details plus uploaded receipt/invoice files.

**Nodes Involved:**  
- JotForm Trigger  
- Handle multiple files  
- Sticky Note1

**Node Details:**

- **JotForm Trigger**  
  - Type: JotForm Trigger (Webhook)  
  - Configuration: Listens to form ID `252815424602048` for new submissions. Uses stored Jotform API credentials.  
  - Inputs: None (Webhook trigger)  
  - Outputs: JSON with form submission data and binary files for uploaded receipts/invoices.  
  - Potential Failures: Webhook connectivity issues, API credential expiration, missing form ID, or no file upload in submission.  
  - Sticky Note1 attached, referencing Jotform signup link.

- **Handle multiple files**  
  - Type: Code  
  - Role: Extracts all uploaded receipt/invoice files from the submission binary data by filtering keys starting with `Receipts___Invoices_`. Outputs each file as a separate item with JSON metadata and binary data for processing.  
  - Key logic: Iterates over binary keys, isolates relevant file binaries.  
  - Inputs: Output of JotForm Trigger  
  - Outputs: Multiple items, each representing one uploaded file (invoice/receipt).  
  - Edge cases: No files uploaded, malformed binary keys, binary data missing for expected keys.

- **Sticky Note1**  
  - Content: Explains the Jotform trigger node and provides a signup link.

---

#### 1.2 File Handling and Storage

**Overview:**  
This block uploads each extracted file to Google Drive and extracts text from PDFs for AI processing.

**Nodes Involved:**  
- Upload file (Google Drive)  
- Transform invoice record (Code)  
- Append row in sheet (Google Sheets)  
- Extract from File  
- Sticky Note5  
- Sticky Note9

**Node Details:**

- **Upload file**  
  - Type: Google Drive  
  - Role: Uploads each invoice/receipt file to a specific Google Drive folder (`SmartSales` folder with folder ID `1IPcko8bzogO3W4mxhrW2Q017QA0Lc5MI`).  
  - Filename pattern: `invoice-YYYYMMDD-HHmmss-originalFileName` (timestamped for uniqueness).  
  - Inputs: Each file from "Handle multiple files"  
  - Outputs: Metadata JSON about uploaded file including download URL, size, name.  
  - Failures: API quota limits, folder permission errors, network issues.  
  - Sticky Note5 nearby describing invoice extraction purpose.

- **Transform invoice record**  
  - Type: Code (Run once per item)  
  - Role: Maps form submission metadata along with Google Drive upload metadata into a structured record for use in Google Sheets.  
  - Extracts employee info (Name, Department, Trip Purpose, Dates), file info (Name, Download URL, Size), and submission timestamp.  
  - Inputs: Output of Upload file node  
  - Outputs: Single JSON object per file ready for sheet insertion.  
  - Edge cases: Missing form fields, missing file metadata.

- **Append row in sheet**  
  - Type: Google Sheets  
  - Role: Appends each transformed invoice record as a new row in the "Invoices Tracking" Google Sheet (document ID `1qk6OebcuZkIRorf1k235ew88oZ-UlUJSyiHFqZYDbaU`, sheet `gid=0`).  
  - Columns include employee and file metadata fields.  
  - Inputs: Output of Transform invoice record node  
  - Outputs: Confirmation of appended rows.  
  - Failures: Sheet access permissions, incorrect document ID, API limits.

- **Extract from File**  
  - Type: Extract From File (PDF)  
  - Role: Extracts the text content from the uploaded PDF invoice/receipt for AI parsing.  
  - Inputs: Uploaded file binary from "Handle multiple files"  
  - Outputs: Text extracted from PDF file (as JSON property).  
  - Failures: Corrupt PDFs, unsupported formats, extraction timeouts.

- **Sticky Note5**  
  - Content: Describes the overall AI extraction and parsing of invoices from uploaded PDFs, emphasizing OCR and structured JSON output.

- **Sticky Note9**  
  - Content: Describes storage of invoice records in Google Sheets for tracking and auditing.

---

#### 1.3 AI Processing and Parsing

**Overview:**  
Processes extracted text content through an AI assistant to parse invoice details into a structured, normalized JSON format.

**Nodes Involved:**  
- Document Extractor (LangChain Agent)  
- Structured Output Parser  
- GPT (OpenAI GPT-4.1 mini)  
- Sticky Note10

**Node Details:**

- **Document Extractor**  
  - Type: LangChain Agent  
  - Role: Uses an AI language model to extract detailed invoice/receipt data from the text content.  
  - Configuration: System message instructs the agent to parse financial fields (vendor, invoice number, date, amounts, tax, currency, payment method, itemized descriptions) into a clean JSON with consistent field names.  
  - Input: Text extracted from PDF (from Extract from File node)  
  - Output: Parsed JSON with invoice details.  
  - Version: LangChain Agent v2.1  
  - Failures: AI timeouts, malformed text input, incomplete data extraction.

- **Structured Output Parser**  
  - Type: LangChain Structured Output Parser  
  - Role: Enforces a JSON schema on the AI output to ensure consistency and correctness of fields.  
  - JSON schema example provided specifying required expense fields and nested itemized arrays.  
  - Input: Raw AI output from GPT node  
  - Output: Validated structured JSON conforming to the schema.  
  - Failures: Parsing errors if AI output does not match schema, incomplete data.

- **GPT**  
  - Type: LangChain LM Chat OpenAI (GPT-4.1 mini)  
  - Role: The underlying language model performing the AI extraction task as per Document Extractor.  
  - Credentials: Uses OpenAI API credentials named "Klinsman OpenAI".  
  - Input: Prompt containing extracted PDF text and instructions.  
  - Output: JSON text for Structured Output Parser.  
  - Failures: API quota, network errors, model unavailability.

- **Sticky Note10**  
  - Content: Describes transforming the parsed data into an HTML email summary for the finance team.

---

#### 1.4 Data Transformation and Storage

**Overview:**  
Aggregates all parsed expense data and employee metadata into consolidated JSON, then appends detailed expense records to Google Sheets.

**Nodes Involved:**  
- Transform Output (Code)  
- Transform invoice record (Code) (also included here for record transformation)  
- Append row in sheet (Google Sheets) (also included here)  
- Sticky Note9 (relevant for sheet storage)

**Node Details:**

- **Transform Output**  
  - Type: Code  
  - Role:  
    - Extracts employee profile data from the original form submission.  
    - Aggregates all AI-parsed expense outputs from multiple files into a structured array with normalized properties (expense type, vendor, invoice number, dates, amounts, tax, currency, payment, location, notes, items).  
  - Input: Outputs from Document Extractor for all files  
  - Output: Single JSON containing employee info and array of expenses ready for email generation.  
  - Edge cases: Missing fields replaced with empty strings or zeros.  
  - Version: Code v2

- **Transform invoice record** and **Append row in sheet**: See previous block.

---

#### 1.5 Email Generation and Notification

**Overview:**  
Generates a professional HTML email summarizing the employee’s trip and all extracted expenses, then sends it to finance for reimbursement processing.

**Nodes Involved:**  
- Create HTML Email Template (Code)  
- Send a message (Gmail)  
- Sticky Note (Send Claim Summary to Finance Team)

**Node Details:**

- **Create HTML Email Template**  
  - Type: Code  
  - Role:  
    - Uses employee and expenses JSON from Transform Output.  
    - Builds an HTML email with:  
      - Employee details (name, department, trip purpose, dates)  
      - Expense summary table (type, vendor, date, amount, tax, payment method)  
      - Detailed tables for each expense itemizing categories, descriptions, quantities, unit prices, and line totals.  
    - Applies inline CSS styling for professional formatting.  
  - Input: Output of Transform Output node  
  - Output: JSON with `html` field containing full email body.  
  - Failures: Malformed JSON input, missing expense details.

- **Send a message**  
  - Type: Gmail  
  - Role: Sends the generated HTML email to the finance team.  
  - Subject dynamically composed using employee name, department, and trip purpose.  
  - Message body: HTML content from previous node.  
  - Inputs: HTML email content from Create HTML Email Template  
  - Credentials: Gmail OAuth2 credential named "Gmail account - Deepanshi"  
  - Failures: Authentication issues, Gmail sending limits, invalid email addresses.

- **Sticky Note**  
  - Content: Describes that the email contains a formatted trip and expense summary sent for finance review and reimbursement.

---

### 3. Summary Table

| Node Name               | Node Type                            | Functional Role                                  | Input Node(s)             | Output Node(s)                 | Sticky Note                                              |
|-------------------------|------------------------------------|-------------------------------------------------|---------------------------|-------------------------------|----------------------------------------------------------|
| JotForm Trigger          | JotForm Trigger                    | Triggers workflow on new form submission         | None                      | Handle multiple files          | ## Jotform Trigger; signup link: https://www.jotform.com/?partner=mediajade |
| Handle multiple files    | Code                              | Extracts all uploaded invoice/receipt files      | JotForm Trigger           | Upload file, Extract from File |                                                          |
| Upload file             | Google Drive                      | Uploads invoices to Google Drive folder           | Handle multiple files      | Transform invoice record       | ## Extract and Parse Invoices with AI Agent              |
| Transform invoice record | Code                              | Prepares invoice metadata for Google Sheets       | Upload file               | Append row in sheet            | ## Store Invoices in Google Sheet                         |
| Append row in sheet      | Google Sheets                    | Appends invoice records to tracking spreadsheet   | Transform invoice record   | None                          | ## Store Invoices in Google Sheet                         |
| Extract from File        | Extract From File (PDF)            | Extracts text content from uploaded PDFs           | Handle multiple files      | Document Extractor            | ## Extract and Parse Invoices with AI Agent              |
| Document Extractor       | LangChain Agent                   | Parses invoice text using AI into JSON format      | Extract from File          | Transform Output              |                                                          |
| Structured Output Parser | LangChain Output Parser Structured | Validates and structures AI output JSON            | GPT                       | Document Extractor            |                                                          |
| GPT                     | LangChain LM Chat OpenAI (GPT-4.1 mini) | Runs AI model to extract invoice data              | Document Extractor         | Structured Output Parser       |                                                          |
| Transform Output         | Code                              | Aggregates parsed expenses and employee info       | Document Extractor         | Create HTML Email Template     |                                                          |
| Create HTML Email Template| Code                             | Generates HTML summary email for finance team      | Transform Output           | Send a message                | ## Transform and Generate HTML Email                     |
| Send a message           | Gmail                             | Sends the expense claim summary email               | Create HTML Email Template | None                          | ## Send Claim Summary to Finance Team                     |
| Sticky Note1             | Sticky Note                      | Notes on Jotform trigger and account signup        | None                      | None                          | ## Jotform Trigger; signup link: https://www.jotform.com/?partner=mediajade |
| Sticky Note5             | Sticky Note                      | Notes on AI invoice extraction and parsing          | None                      | None                          | ## Extract and Parse Invoices with AI Agent              |
| Sticky Note9             | Sticky Note                      | Notes on storing invoices in Google Sheet           | None                      | None                          | ## Store Invoices in Google Sheet                         |
| Sticky Note10            | Sticky Note                      | Notes on transform and HTML email generation        | None                      | None                          | ## Transform and Generate HTML Email                      |
| Sticky Note              | Sticky Note                      | Notes on sending claim summary email                 | None                      | None                          | ## Send Claim Summary to Finance Team                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create JotForm Trigger node:**  
   - Type: JotForm Trigger  
   - Configure with the Jotform API credentials.  
   - Set the form ID to the expense report form (`252815424602048`).  
   - This node will start the workflow when a new form submission occurs.

2. **Create Code node "Handle multiple files":**  
   - Purpose: Extract all uploaded invoice/receipt files from the submission binary data.  
   - Code: Iterate over binary keys starting with `Receipts___Invoices_` and output each as a separate item with JSON and binary data.  
   - Connect output of JotForm Trigger to this node.

3. **Create Google Drive node "Upload file":**  
   - Type: Google Drive  
   - Configure credentials with your Google Drive OAuth2.  
   - Set target folder ID to your desired folder (e.g., `1IPcko8bzogO3W4mxhrW2Q017QA0Lc5MI`).  
   - Filename: Use expression `invoice-{{ $now.toFormat("yyyyLLdd-HHmmss") }}-{{$binary.data.fileName}}` for uniqueness.  
   - Connect "Handle multiple files" output to this node.

4. **Create Code node "Transform invoice record":**  
   - Mode: Run once for each item  
   - Purpose: Map form submission fields (Employee Name, Department, Trip Purpose, From/To Dates, submission timestamp) combined with Google Drive file metadata (name, download URL, size).  
   - Connect "Upload file" output here.

5. **Create Google Sheets node "Append row in sheet":**  
   - Configure with Google Sheets credentials and select your target spreadsheet and sheet.  
   - Set operation to "Append" with auto-mapping for columns: EmployeeName, Department, TripPurpose, FromDate, ToDate, FileName, DownloadURL, Size, SubmittedAt.  
   - Connect output of "Transform invoice record" to this node.

6. **Create Extract From File node "Extract from File":**  
   - Operation: PDF text extraction  
   - Connect output of "Handle multiple files" to this node to extract text from each binary file.

7. **Create LangChain Agent node "Document Extractor":**  
   - Configure with OpenAI GPT-4.1 mini credentials (same as below).  
   - Set system prompt to instruct AI to extract invoice details into structured JSON with consistent fields: vendor_name, invoice_number, issue_date, total_amount, tax_amount, currency, payment_method, itemized_descriptions, notes, etc.  
   - Connect output of "Extract from File" node here.

8. **Create LangChain LM Chat OpenAI node "GPT":**  
   - Model: GPT-4.1 mini  
   - Credentials: OpenAI API (create and link your OpenAI API key).  
   - Connect "Document Extractor" node as AI model for extraction.

9. **Create LangChain Structured Output Parser "Structured Output Parser":**  
   - Provide JSON schema example with detailed fields for expenses and itemized lines.  
   - Connect output of "GPT" node to this parser, output back to "Document Extractor" node.

10. **Create Code node "Transform Output":**  
    - Aggregate all AI parsed outputs into a single JSON containing:  
      - Employee profile from original form submission  
      - Array of parsed expenses with normalized properties.  
    - Connect output of "Document Extractor" here.

11. **Create Code node "Create HTML Email Template":**  
    - Generate an HTML email body summarizing employee info and detailed expenses in tables with inline CSS styling.  
    - Connect output of "Transform Output" node here.

12. **Create Gmail node "Send a message":**  
    - Configure Gmail OAuth2 credentials.  
    - Subject: Use expressions to include employee name, department, trip purpose.  
    - Message: Use the HTML content generated from "Create HTML Email Template".  
    - Connect output of "Create HTML Email Template" here.

---

### 5. General Notes & Resources

| Note Content                                                                                               | Context or Link                                      |
|------------------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| Jotform account with expense form setup [Sign up for free here](https://www.jotform.com/?partner=mediajade) | Sticky Note1 (Jotform Trigger explanation)          |
| AI document extraction assistant trained for invoices/receipts parsing to structured JSON for expense claims | Sticky Note5 (Invoice extraction purpose)           |
| Parsed invoice records are stored in Google Sheets for auditing and reimbursement tracking                  | Sticky Note9 (Google Sheets storage explanation)    |
| Email summaries include detailed expense breakdowns for finance review and reimbursement processing         | Sticky Note10 (Email generation explanation)        |
| Formatted expense claim emails sent via Gmail OAuth2                                                       | Sticky Note (Send Claim Summary to Finance Team)    |

---

**Disclaimer:**  
The text above is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.