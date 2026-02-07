AI-Powered Invoice Data Extraction & Approval Workflow with ScrapeGraphAI & Telegram

https://n8nworkflows.xyz/workflows/ai-powered-invoice-data-extraction---approval-workflow-with-scrapegraphai---telegram-6628


# AI-Powered Invoice Data Extraction & Approval Workflow with ScrapeGraphAI & Telegram

### 1. Workflow Overview

This workflow automates the extraction, validation, and approval routing of invoice documents using AI-powered OCR and business logic rules. It supports flexible invoice intake via email attachments or direct file uploads, processes files to extract structured invoice data, validates that data against business rules, and routes invoices for approval if necessary. Finally, it integrates approved invoices into an accounting system and sends notifications through Telegram.

**Target Use Cases:**  
- Automated invoice data extraction from diverse file formats (PDF, images)  
- Validation of invoice data including duplicate detection and business rule compliance  
- Multi-stage approval routing based on invoice risk factors  
- Integration with accounting systems for seamless bookkeeping  
- Real-time alerts and approval requests via Telegram

**Logical Blocks:**  
- 1.1 Input Reception (Email Trigger, File Upload Webhook)  
- 1.2 File Processing (File Processor)  
- 1.3 AI Data Extraction (ScrapeGraphAI - Invoice Extractor)  
- 1.4 Data Cleaning & Enhancement (Data Extractor & Cleaner)  
- 1.5 Business Rules Validation (Validation Rules Engine)  
- 1.6 Approval Routing Decision (Approval Required?)  
- 1.7 Approval Workflow Generation (Approval Workflow Generator)  
- 1.8 Notification & Integration (Approval Notification, Accounting System Integration)  

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block provides multi-channel triggers to ingest invoice documents either from incoming emails or direct file uploads via webhook.

**Nodes Involved:**  
- Email Trigger  
- File Upload Webhook

**Node Details:**  
- **Email Trigger**  
  - Type: IMAP Email Read Trigger  
  - Role: Polls email inbox every 30 seconds for incoming emails with attachments  
  - Configuration: Default IMAP settings, no advanced options  
  - Output: JSON with email metadata and binary attachments  
  - Edge cases: Authentication failure, no attachments, unsupported file types  
- **File Upload Webhook**  
  - Type: Webhook (HTTP POST)  
  - Role: Receives direct file uploads at `/invoice-upload` endpoint  
  - Configuration: Raw body enabled, responds with node output  
  - Output: Binary file(s) plus metadata indicating upload source  
  - Edge cases: Missing file in request, invalid HTTP method, large file uploads  

---

#### 1.2 File Processing

**Overview:**  
Processes incoming files from either email attachments or direct uploads, filters for supported invoice file types, extracts key metadata, and prepares data for AI extraction.

**Nodes Involved:**  
- File Processor

**Node Details:**  
- **File Processor**  
  - Type: Code (JavaScript)  
  - Role: Filters files to PDF and common image formats, extracts metadata (sender, subject, dates), generates unique invoice IDs  
  - Key logic: Distinguishes between email attachments and direct uploads, normalizes metadata fields, outputs one execution per file  
  - Input: Email JSON or webhook binary data  
  - Output: JSON with invoice metadata and binary file data attached, processing status 'pending'  
  - Edge cases: Missing metadata fields, unsupported file types, malformed binary data  

---

#### 1.3 AI Data Extraction

**Overview:**  
Uses ScrapeGraphAI node to run AI-powered OCR and structured data extraction from invoice files.

**Nodes Involved:**  
- ScrapeGraphAI - Invoice Extractor

**Node Details:**  
- **ScrapeGraphAI - Invoice Extractor**  
  - Type: ScrapeGraphAI integration node  
  - Role: Extracts detailed invoice fields (invoice number, dates, vendor info, line items, amounts) from PDFs and images  
  - Configuration: Uses "scrapeSmartScraper" resource preset for invoice data  
  - Input: Binary invoice file with metadata  
  - Output: JSON containing extracted `invoice_data` structure  
  - Edge cases: OCR failures, low image quality, unsupported invoice layouts, API rate limits  

---

#### 1.4 Data Cleaning & Enhancement

**Overview:**  
Cleans and standardizes AI-extracted invoice data, validates field formats, calculates confidence scores, and prepares data for validation.

**Nodes Involved:**  
- Data Extractor & Cleaner

**Node Details:**  
- **Data Extractor & Cleaner**  
  - Type: Code (JavaScript)  
  - Role:  
    - Cleans string fields, standardizes dates (ISO format), validates emails and phone numbers  
    - Parses numeric amounts, normalizes line items with validation  
    - Calculates confidence scores based on presence of required fields  
    - Assesses data completeness percentage  
  - Input: JSON with raw extracted invoice_data plus metadata  
  - Output: JSON with cleaned `extracted_invoice_data`, updated status 'extracted'  
  - Edge cases: Missing or malformed fields, unparsable dates, invalid emails, empty line items  

---

#### 1.5 Business Rules Validation

**Overview:**  
Applies comprehensive business rules and validation logic to the cleaned invoice data, identifies errors, warnings, and flags business rule compliance.

**Nodes Involved:**  
- Validation Rules Engine

**Node Details:**  
- **Validation Rules Engine**  
  - Type: Code (JavaScript)  
  - Role:  
    - Validates required fields presence (invoice number, vendor, total amount, invoice date)  
    - Checks date logic (due date after invoice date)  
    - Validates amount calculations and flags high-value invoices (>$10,000)  
    - Simulates vendor whitelist verification  
    - Validates line items for description, quantity, price correctness  
    - Simulates duplicate invoice number detection  
    - Calculates validation score and confidence level  
    - Determines if approval is required based on errors, warnings, or business rules  
  - Input: JSON with cleaned invoice data  
  - Output: JSON with `validation_results`, validation score, confidence level, approval flags, updated status  
  - Edge cases: False positives in duplicate detection, vendor name mismatches, amount rounding errors, missing line items  

---

#### 1.6 Approval Routing Decision

**Overview:**  
Decision node that routes invoices either towards an approval workflow or downstream processing based on validation results.

**Nodes Involved:**  
- Approval Required?

**Node Details:**  
- **Approval Required?**  
  - Type: Switch  
  - Role: Checks if invoice requires approval based on boolean flags  
  - Configuration: Checks the `requires_approval` field (expected true/false)  
  - Input: JSON with validation results  
  - Output: Routes to approval workflow if true, else (not connected here) would route to accounting integration  
  - Edge cases: Misconfigured conditions, missing approval flag  

---

#### 1.7 Approval Workflow Generation

**Overview:**  
Generates detailed, multi-stage approval requests including priorities, validation context, and formatted Telegram messages.

**Nodes Involved:**  
- Approval Workflow Generator

**Node Details:**  
- **Approval Workflow Generator**  
  - Type: Code (JavaScript)  
  - Role:  
    - Constructs approval request object with invoice summary, reasons for approval, validation score, and confidence level  
    - Defines multi-step approval workflow based on amount thresholds and vendor verification status  
    - Generates rich approval message formatted in Markdown for Telegram  
  - Input: JSON with invoice data and validation context  
  - Output: JSON with `approval_request` object, updated status 'pending_approval'  
  - Edge cases: Missing invoice data fields, incorrect priority assignment, message formatting errors  

---

#### 1.8 Notification & Integration

**Overview:**  
Sends approval requests to Telegram channel and integrates validated invoices into the accounting system via REST API.

**Nodes Involved:**  
- Approval Notification  
- Accounting System Integration

**Node Details:**  
- **Approval Notification**  
  - Type: Telegram Node  
  - Role: Sends approval message to specified Telegram channel `@invoice_approvals`  
  - Configuration: Uses Markdown parse mode to format message content dynamically from approval request  
  - Input: JSON with approval message  
  - Output: Telegram message sent confirmation  
  - Edge cases: Telegram API errors, invalid chat ID, message size limits  

- **Accounting System Integration**  
  - Type: HTTP Request  
  - Role: Posts cleaned invoice data and validation results to external accounting API endpoint  
  - Configuration:  
    - URL: `https://your-accounting-system.com/api/invoices` (placeholder)  
    - Authentication: Predefined HTTP header credentials  
    - Payload: JSON including invoice data, validation results, and processing metadata  
  - Input: JSON with final invoice data post-approval or direct processing  
  - Output: HTTP response from accounting system  
  - Edge cases: Network errors, authentication failure, API validation errors, retry logic not shown  

---

### 3. Summary Table

| Node Name                    | Node Type                    | Functional Role                      | Input Node(s)             | Output Node(s)              | Sticky Note                                                                                         |
|------------------------------|------------------------------|------------------------------------|---------------------------|-----------------------------|---------------------------------------------------------------------------------------------------|
| Email Trigger                | Email Read IMAP Trigger       | Incoming email invoice ingestion   | —                         | File Processor              | Step 1: Multi-Input Triggers 📧📁 Flexible Invoice Reception via Email and Webhook                  |
| File Upload Webhook          | Webhook                      | Direct file upload ingestion       | —                         | File Processor              | Step 1: Multi-Input Triggers 📧📁 Flexible Invoice Reception via Email and Webhook                  |
| File Processor              | Code                        | File filtering and metadata prep   | Email Trigger, File Upload | ScrapeGraphAI - Invoice Extractor | Step 2: File Processing 🔄 Smart File Handler for multi-source files, metadata extraction          |
| ScrapeGraphAI - Invoice Extractor | ScrapeGraphAI Node             | AI-powered invoice data extraction | File Processor            | Data Extractor & Cleaner    | Step 3: AI Invoice Extraction 🤖 Advanced OCR and structured JSON extraction                        |
| Data Extractor & Cleaner    | Code                        | Data cleaning and enhancement      | ScrapeGraphAI - Invoice Extractor | Validation Rules Engine     | Step 4: Data Cleaning & Enhancement 🧹 Standardizes and validates extracted invoice data           |
| Validation Rules Engine     | Code                        | Business rules validation          | Data Extractor & Cleaner  | Approval Required?          | Step 5: Business Rules Validation ✅ Applies complex validation and flags approval needs           |
| Approval Required?          | Switch                      | Approval routing decision          | Validation Rules Engine   | Approval Workflow Generator | Step 6: Approval Routing 🔀 Routes invoices based on validation and business rules                 |
| Approval Workflow Generator | Code                        | Approval request generation        | Approval Required?        | Approval Notification       | Step 7: Approval Workflow 👥 Multi-stage approval creation with detailed context and messaging      |
| Approval Notification       | Telegram                    | Sends approval request notification | Approval Workflow Generator | Accounting System Integration | Step 8: System Integration 🔗 Telegram notification of approvals, real-time user alerts             |
| Accounting System Integration | HTTP Request                | Sends invoice data to accounting   | Approval Notification     | —                           | Step 8: System Integration 🔗 API integration with accounting systems for automated processing      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Email Trigger Node**  
   - Type: Email Read IMAP Trigger  
   - Poll every 30 seconds  
   - Configure IMAP credentials for your email inbox  
   - Accept emails with attachments (PDF, PNG, JPG, JPEG, TIFF, BMP)  

2. **Create File Upload Webhook Node**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `/invoice-upload`  
   - Options: Enable raw body processing  
   - Configure response mode to send node output as HTTP response  

3. **Create File Processor Node**  
   - Type: Code  
   - Input: Connect from both Email Trigger and File Upload Webhook  
   - Paste JavaScript code that:  
     - Filters attachments/files for supported types  
     - Extracts metadata (sender, subject, dates)  
     - Generates unique invoice IDs (`INV_${timestamp}_${index}`)  
     - Outputs one execution per file with JSON metadata and binary file data  

4. **Create ScrapeGraphAI - Invoice Extractor Node**  
   - Type: ScrapeGraphAI integration  
   - Resource: Use `scrapeSmartScraper` preset for invoice extraction  
   - Input: Connect from File Processor node  
   - Ensure credentials/API key for ScrapeGraphAI are configured  

5. **Create Data Extractor & Cleaner Node**  
   - Type: Code  
   - Input: Connect from ScrapeGraphAI node  
   - Paste JavaScript code that:  
     - Cleans and standardizes extracted invoice data fields  
     - Validates emails, phone numbers  
     - Converts amounts and dates to standardized formats  
     - Calculates confidence scores and completeness percentage  
     - Outputs cleaned data and updates processing status to 'extracted'  

6. **Create Validation Rules Engine Node**  
   - Type: Code  
   - Input: Connect from Data Extractor & Cleaner node  
   - Paste JavaScript code that:  
     - Validates required fields presence  
     - Checks dates and amounts consistency  
     - Validates vendor against whitelist  
     - Checks for line item correctness  
     - Simulates duplicate invoice number detection  
     - Calculates validation score and determines if approval is needed  
     - Outputs validation results and updated status  

7. **Create Approval Required? Node**  
   - Type: Switch  
   - Input: Connect from Validation Rules Engine  
   - Configure rule to check if `requires_approval` flag is true (equals true)  
   - Connect True output to Approval Workflow Generator  
   - (Optional) Connect False output to Accounting System Integration for auto-processing  

8. **Create Approval Workflow Generator Node**  
   - Type: Code  
   - Input: Connect from Approval Required? (true branch)  
   - Paste JavaScript code that:  
     - Builds approval request object with priority, invoice summary, validation context  
     - Defines multi-stage approval steps (finance manager, procurement, department head)  
     - Generates a Markdown-formatted approval message for Telegram  
     - Outputs approval request and updates status to 'pending_approval'  

9. **Create Approval Notification Node**  
   - Type: Telegram  
   - Input: Connect from Approval Workflow Generator  
   - Configure Telegram credentials and chat ID (e.g., `@invoice_approvals`)  
   - Set message text to use `{{$json.approval_request.approval_message}}`  
   - Set parse mode to Markdown for rich text formatting  

10. **Create Accounting System Integration Node**  
    - Type: HTTP Request  
    - Input: Connect from Approval Notification (or from Approval Required? false branch if implemented)  
    - Configure URL to your accounting system API endpoint  
    - Configure authentication (e.g., HTTP Header Auth) with credentials  
    - Set method to POST, content-type JSON  
    - Send body parameters with:  
      - `invoice_data`: JSON stringified cleaned invoice data  
      - `validation_results`: JSON stringified validation results  
      - `processing_metadata`: JSON stringified metadata (invoice_id, source, processed_at)  
    - Handle response and errors as needed  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                               | Context or Link                                                                                     |
|------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Flexible multi-input triggers allow invoice ingestion via email or direct uploads, supporting diverse operational scenarios.                            | Sticky Note - Triggers (Step 1)                                                                    |
| AI-powered extraction with ScrapeGraphAI enhances accuracy and reduces manual data entry, handling multiple file formats with OCR capabilities.           | Sticky Note - AI Extraction (Step 3)                                                               |
| Data cleaning includes rigorous format standardization and confidence scoring to ensure quality before validation.                                         | Sticky Note - Data Cleaning (Step 4)                                                               |
| Validation engine enforces business rules including duplicate detection and amount thresholds to ensure compliance and reduce errors.                     | Sticky Note - Validation (Step 5)                                                                  |
| Approval routing automates decision-making, focusing human attention on exceptions and high-risk invoices.                                                | Sticky Note - Approval Routing (Step 6)                                                            |
| Multi-stage approval workflow with detailed context and Telegram notifications streamline the approval process and maintain audit trails.                 | Sticky Note - Approval Workflow (Step 7)                                                           |
| Seamless integration with accounting systems via API eliminates duplicate data entry and supports real-time reconciliation.                              | Sticky Note - System Integration (Step 8)                                                          |
| Telegram messages use Markdown formatting for clarity and include interactive approval details.                                                           | Approval Notification node configuration                                                           |
| This workflow uses multiple code nodes requiring JavaScript knowledge for customization and maintenance.                                                  |                                                                                                   |
| Consider implementing retry and error handling in HTTP request node for robust accounting integration.                                                    |                                                                                                   |

---

**Disclaimer:** The provided text is extracted exclusively from a workflow automated with n8n, respecting all content policies. It contains no illegal or protected content. Data processed is lawful and public.