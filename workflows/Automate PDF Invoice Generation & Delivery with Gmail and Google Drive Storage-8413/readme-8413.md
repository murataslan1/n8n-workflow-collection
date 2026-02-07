Automate PDF Invoice Generation & Delivery with Gmail and Google Drive Storage

https://n8nworkflows.xyz/workflows/automate-pdf-invoice-generation---delivery-with-gmail-and-google-drive-storage-8413


# Automate PDF Invoice Generation & Delivery with Gmail and Google Drive Storage

### 1. Workflow Overview

This workflow automates the generation and delivery of PDF invoices using data received via a webhook. It targets businesses seeking to streamline their invoicing process by automatically creating professional invoices, emailing them to customers, and storing the invoices securely in Google Drive. The workflow is organized into the following logical blocks:

- **1.1 Input Reception and Data Preparation**: Receives invoice data via webhook, validates and formats it, calculates totals and taxes.
- **1.2 Invoice HTML Generation**: Creates a styled HTML invoice template based on processed data.
- **1.3 PDF Generation**: Converts the HTML invoice into a PDF document using an external API.
- **1.4 Email Delivery**: Sends the generated PDF invoice to the customer via email.
- **1.5 Google Drive Storage**: Uploads the PDF invoice to Google Drive for record-keeping.
- **1.6 Success Confirmation and Webhook Response**: Confirms the successful operations and responds to the original webhook request.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Data Preparation

- **Overview:**  
  This block triggers the workflow upon receiving an HTTP POST request at a webhook endpoint. It processes and validates the incoming invoice data, calculates subtotals, taxes, and totals, formats dates, and prepares all necessary details for invoice generation.

- **Nodes Involved:**  
  - Webhook Trigger  
  - Process Invoice Data (Code)  
  - Sticky Note4 (Comment)

- **Node Details:**  
  - **Webhook Trigger**  
    - *Type:* Webhook  
    - *Role:* Entry point receiving invoice data via POST request at path `/generate-invoice`  
    - *Configuration:* HTTP POST method, responseMode set to `responseNode` for delayed response  
    - *Input:* HTTP request body containing invoice data (customer info, items, tax rate, etc.)  
    - *Output:* Passes raw request data to next node  
    - *Potential Failures:* Missing or malformed POST data, invalid JSON, network issues  
  - **Process Invoice Data**  
    - *Type:* Code node executing JavaScript  
    - *Role:* Validates and processes raw input data, generates invoice number if missing, calculates line totals, subtotal, tax (default 10%), total amount; formats invoice and due dates  
    - *Key Logic:*  
      - Extracts and normalizes invoice items  
      - Calculates subtotal by summing line totals  
      - Applies tax rate and calculates tax amount  
      - Defaults: tax rate 10%, due date 30 days after current date  
      - Uses environment variables for company info fallback  
      - Returns a structured JSON with all invoice details and summary numbers  
    - *Input:* Raw JSON from webhook  
    - *Output:* Structured invoice data JSON for HTML generation  
    - *Edge Cases:* Missing required fields (customerEmail), invalid numeric values, empty items array  
  - **Sticky Note4**  
    - *Content Summary:* Describes the invoice preparation logic and validation steps in this block.

#### 2.2 Invoice HTML Generation

- **Overview:**  
  Converts the structured invoice data into a professional, branded HTML invoice template with inline CSS styling. Constructs an itemized table, company and customer details, totals, payment terms, and footer notes.

- **Nodes Involved:**  
  - Generate HTML Template (Code)  
  - Sticky Note3 (Comment)

- **Node Details:**  
  - **Generate HTML Template**  
    - *Type:* Code node executing JavaScript  
    - *Role:* Builds an HTML string representing the invoice, including styling and data embedding  
    - *Key Logic:*  
      - Maps each invoice item to a table row with description, quantity, unit price, and total  
      - Applies company branding colors (#007bff as primary) and layout styles  
      - Includes invoice header, customer section, totals summary, payment terms, and footer with notes and generation date  
      - Returns the full HTML content and a filename (invoice-<invoiceNumber>.pdf)  
    - *Input:* Processed invoice JSON from previous node  
    - *Output:* JSON including `htmlContent` and `filename` for PDF generation  
    - *Edge Cases:* HTML injection if inputs are not sanitized (not handled here), very large number of items may cause rendering issues  
  - **Sticky Note3**  
    - *Content Summary:* Highlights the creation of a professional HTML invoice with branding and detailed itemization.

#### 2.3 PDF Generation

- **Overview:**  
  Sends the HTML invoice to a third-party PDF conversion API, generating a PDF document.

- **Nodes Involved:**  
  - Generate PDF (HTTP Request)

- **Node Details:**  
  - **Generate PDF**  
    - *Type:* HTTP Request node  
    - *Role:* Converts HTML content to PDF by calling an external API (default: PDFShift)  
    - *Configuration:*  
      - URL: from environment variable `PDF_API_URL` or default PDFShift endpoint  
      - Method: POST  
      - Headers: Content-Type application/json, Authorization Basic with API key from env variable `PDF_API_KEY`  
      - Body: JSON containing the HTML content (populated in code, though bodyParameters is shown empty in JSON, likely set dynamically)  
    - *Input:* JSON with `htmlContent` and `filename`  
    - *Output:* PDF binary data to be attached or saved  
    - *Edge Cases:* API key missing or invalid, API rate limits, network timeouts, invalid HTML content causing conversion errors

#### 2.4 Email Delivery

- **Overview:**  
  Emails the generated PDF invoice to the customer with a professional HTML email template including invoice details and payment instructions.

- **Nodes Involved:**  
  - Send Email to Customer (Email Send)  
  - Sticky Note2 (Comment)

- **Node Details:**  
  - **Send Email to Customer**  
    - *Type:* Email Send node  
    - *Role:* Sends the invoice PDF as an attachment to the customer’s email address  
    - *Configuration:*  
      - HTML email body uses expressions to personalize greeting and invoice details  
      - Subject: includes invoice number and company name  
      - Recipient: customer email from invoice data  
      - Sender: company email from environment variable  
      - Attachment: PDF generated in prior node (assumed configured)  
    - *Input:* PDF binary and invoice data  
    - *Output:* Confirmation of email sent status  
    - *Edge Cases:* Invalid customer email, SMTP or credential errors, attachment missing, email delivery failures  
  - **Sticky Note2**  
    - *Content Summary:* Describes email sending features including attachment, professional formatting, and delivery confirmation.

#### 2.5 Google Drive Storage

- **Overview:**  
  Saves the generated PDF invoice file into Google Drive for backup and accounting records, organizing with automated file naming in the root folder.

- **Nodes Involved:**  
  - Save to Google Drive (Google Drive node)  
  - Sticky Note1 (Comment)

- **Node Details:**  
  - **Save to Google Drive**  
    - *Type:* Google Drive node  
    - *Role:* Uploads the PDF invoice file to Google Drive's root folder  
    - *Configuration:*  
      - File name set dynamically using invoice number (e.g., invoice-INV-xxxxxx.pdf)  
      - Drive ID: “My Drive” (default)  
      - Folder ID: root folder  
    - *Input:* PDF binary data and filename  
    - *Output:* Google Drive file metadata confirming upload  
    - *Edge Cases:* Authentication failure, insufficient permissions, API quota exceeded, filename conflicts  
  - **Sticky Note1**  
    - *Content Summary:* Outlines the cloud storage benefits, file naming, and backup rationale.

#### 2.6 Success Confirmation and Webhook Response

- **Overview:**  
  Consolidates success information from email and file storage operations, and sends a JSON response back to the original webhook caller confirming the invoice processing status.

- **Nodes Involved:**  
  - Success Response (Code)  
  - Respond Webhook (Respond to Webhook)  
  - Sticky Note (Comment)

- **Node Details:**  
  - **Success Response**  
    - *Type:* Code node  
    - *Role:* Constructs a JSON object indicating success, including invoice number, customer email, total amount, filename, timestamp, and flags for email sent and file saved  
    - *Input:* Data from previous nodes (email, Google Drive)  
    - *Output:* JSON success message for client  
    - *Edge Cases:* Missing data propagation from prior nodes could lead to incomplete response  
  - **Respond Webhook**  
    - *Type:* Respond to Webhook node  
    - *Role:* Sends HTTP 200 response with JSON success message to originator of webhook request  
    - *Input:* JSON from Success Response node  
    - *Output:* HTTP response  
    - *Edge Cases:* Network issues or timeout causing response failure  
  - **Sticky Note**  
    - *Content Summary:* Details the comprehensive success response content including invoice confirmation, email and storage status.

---

### 3. Summary Table

| Node Name          | Node Type            | Functional Role                                | Input Node(s)           | Output Node(s)            | Sticky Note                                                                                  |
|--------------------|----------------------|-----------------------------------------------|------------------------|---------------------------|----------------------------------------------------------------------------------------------|
| Webhook Trigger    | Webhook              | Receives invoice data via HTTP POST            | —                      | Process Invoice Data       |                                                                                              |
| Process Invoice Data | Code                 | Validates and processes invoice data           | Webhook Trigger         | Generate HTML Template     | ⚙️ **PREPARING INVOICE** - Extracts data, validates, calculates totals, applies tax, formats dates |
| Generate HTML Template | Code               | Generates HTML invoice template with styling   | Process Invoice Data    | Generate PDF               | 📄 **INVOICE GENERATION** - Creates professional HTML invoice with branding and itemization  |
| Generate PDF       | HTTP Request         | Converts HTML invoice to PDF via API            | Generate HTML Template  | Send Email to Customer     |                                                                                              |
| Send Email to Customer | Email Send         | Sends invoice PDF to customer by email          | Generate PDF            | Success Response           | 📧 **SENDS TO CUSTOMER** - Emails PDF, professional template, payment instructions, confirms delivery |
| Save to Google Drive | Google Drive         | Uploads PDF invoice to Google Drive              | Send Email to Customer  | Success Response           | ☁️ **SAVE TO DRIVE** - Uploads PDF, organized folder, automated naming, backup, cloud storage  |
| Success Response   | Code                 | Creates success confirmation JSON                | Send Email to Customer, Save to Google Drive | Respond Webhook  | ✅ **SUCCESS RESPONSE** - Confirms invoice generated, email & storage status, operation summary |
| Respond Webhook    | Respond to Webhook    | Sends HTTP response with success JSON            | Success Response        | —                         |                                                                                              |
| Sticky Note        | Sticky Note          | Comment node                                      | —                      | —                         | Covers success response node                                                                 |
| Sticky Note1       | Sticky Note          | Comment node                                      | —                      | —                         | Covers Google Drive storage node                                                             |
| Sticky Note2       | Sticky Note          | Comment node                                      | —                      | —                         | Covers email sending node                                                                    |
| Sticky Note3       | Sticky Note          | Comment node                                      | —                      | —                         | Covers HTML generation node                                                                  |
| Sticky Note4       | Sticky Note          | Comment node                                      | —                      | —                         | Covers invoice data processing node                                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Trigger node**  
   - Type: Webhook  
   - Set HTTP Method to POST  
   - Set path to `generate-invoice`  
   - Set response mode to `responseNode` for deferred response  

2. **Add Code node "Process Invoice Data"**  
   - Connect output of Webhook Trigger to this node  
   - Paste JavaScript code that:  
     - Extracts invoice data from webhook body  
     - Generates invoice number if missing (`INV-YYYY-xxxxxx`)  
     - Processes items to calculate line totals and subtotal  
     - Applies tax rate (default 10%) and calculates tax amount and total  
     - Formats dates (invoiceDate as today, dueDate default 30 days later)  
     - Uses environment variables for fallback company info  
     - Returns structured JSON with all invoice details  

3. **Add Code node "Generate HTML Template"**  
   - Connect output of "Process Invoice Data" to this node  
   - Paste JavaScript code that:  
     - Builds HTML string with inline CSS for invoice layout  
     - Generates itemized table rows dynamically  
     - Includes company info, invoice details, customer info, totals, payment terms, and footer notes  
     - Returns JSON with `htmlContent` and `filename`  

4. **Add HTTP Request node "Generate PDF"**  
   - Connect output of "Generate HTML Template" to this node  
   - Set method to POST  
   - Set URL to environment variable `PDF_API_URL` or default `https://api.pdfshift.io/v3/convert/pdf`  
   - Set headers:  
     - Content-Type: application/json  
     - Authorization: Basic with API key from `PDF_API_KEY` env variable  
   - Set body to include the `htmlContent` from previous node (ensure JSON body includes HTML to convert)  
   - Ensure response is received as binary data (PDF)  

5. **Add Email Send node "Send Email to Customer"**  
   - Connect output of "Generate PDF" to this node  
   - Set To Email to `{{$json.customerEmail}}`  
   - Set From Email to company email from environment variable (`COMPANY_EMAIL`)  
   - Compose HTML email body with invoice details using expressions  
   - Set Subject to include invoice number and company name  
   - Attach PDF binary from previous node output  
   - Configure email credentials (SMTP or integrated email service)  

6. **Add Google Drive node "Save to Google Drive"**  
   - Connect output of "Send Email to Customer" to this node  
   - Set file name dynamically: `{{$json.filename}}`  
   - Select Drive ID as "My Drive"  
   - Set folder ID to root or desired folder  
   - Map binary PDF data to upload  
   - Configure Google Drive OAuth2 credentials  

7. **Add Code node "Success Response"**  
   - Connect outputs of both "Send Email to Customer" and "Save to Google Drive" to this node (use merge if needed)  
   - Return JSON object summarizing success status, invoice number, email, total amount, filename, timestamp, flags for email sent and saved to drive  

8. **Add Respond to Webhook node "Respond Webhook"**  
   - Connect output of "Success Response" to this node  
   - Set response code to 200  
   - Set response type to JSON  
   - Use success JSON as response body  

9. **Add Sticky Notes as comments for clarity**  
   - Place notes near related nodes describing their roles and key points  

10. **Set environment variables:**  
    - `COMPANY_NAME`, `COMPANY_ADDRESS`, `COMPANY_EMAIL`, `COMPANY_PHONE` for default company info  
    - `PDF_API_URL` and `PDF_API_KEY` for PDF conversion API  
    - `COMPANY_EMAIL` for sender email in email node  

11. **Test the workflow**  
    - Send a POST request with invoice JSON to `/generate-invoice` webhook  
    - Verify PDF generation, email delivery, Google Drive upload, and webhook response  

---

### 5. General Notes & Resources

| Note Content                                                                                                     | Context or Link                                                                                       |
|-----------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Uses PDFShift API for HTML to PDF conversion; requires API key.                                                  | See https://pdfshift.io/ for API documentation and key registration                                |
| Environment variables for company info enable easy customization without workflow changes                        | COMPANY_NAME, COMPANY_ADDRESS, COMPANY_EMAIL, COMPANY_PHONE                                         |
| Email node requires configured SMTP or integrated email credentials for sending emails                           | Ensure valid credentials and permissions for email delivery                                        |
| Google Drive node requires OAuth2 credentials with permission to upload files in the target Drive folder        | Configure Google API credentials and enable Drive API in Google Cloud Console                       |
| The webhook uses deferred response mode to wait for completion before responding, suitable for longer workflows | n8n webhook configuration documentation for response modes                                         |
| Attachments in email node must be mapped from previous node’s binary data (PDF)                                  | Ensure proper binary property mapping in n8n nodes                                                 |

---

This structured reference document provides a complete understanding of the workflow’s logic, configuration, and operational considerations, enabling reproduction, modification, and troubleshooting.