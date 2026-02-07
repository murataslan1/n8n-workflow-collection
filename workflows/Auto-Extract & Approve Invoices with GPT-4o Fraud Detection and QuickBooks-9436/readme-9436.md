Auto-Extract & Approve Invoices with GPT-4o Fraud Detection and QuickBooks

https://n8nworkflows.xyz/workflows/auto-extract---approve-invoices-with-gpt-4o-fraud-detection-and-quickbooks-9436


# Auto-Extract & Approve Invoices with GPT-4o Fraud Detection and QuickBooks

---

## 1. Workflow Overview

This workflow automates the end-to-end processing, fraud detection, approval, and logging of vendor invoices received via email attachments submitted through a JotForm. It leverages AI-powered OCR and natural language processing (NLP) with GPT-4o for highly accurate invoice data extraction and advanced fraud risk analysis. Based on risk and amount thresholds, invoices are intelligently routed for automatic approval, managerial approval, or flagged for fraud investigation. The workflow concludes by updating the accounting system and logging all invoice details for audit and analytics.

**Target Use Cases:**  
- Automated invoice intake and data extraction from email attachments  
- Fraud detection using AI pattern recognition on extracted invoice data  
- Conditional approval routing based on risk scores and invoice amounts  
- Notifications for fraud alerts and approval requests  
- Integration with QuickBooks and Google Sheets for accounting and record-keeping

**Logical Blocks:**  
- 1.1 Input Reception and Attachment Extraction  
- 1.2 AI OCR and Structured Data Extraction  
- 1.3 AI Fraud Detection and Risk Analysis  
- 1.4 Conditional Routing & Approval Workflow  
- 1.5 Notifications & Communication  
- 1.6 Logging and Audit Trail

---

## 2. Block-by-Block Analysis

### 1.1 Input Reception and Attachment Extraction

**Overview:**  
This block monitors new invoice submissions via a JotForm, checks for attached invoice files, and extracts supported invoice attachments (PDF, PNG, JPG) from the submission payload for further AI processing.

**Nodes Involved:**  
- JotForm Trigger  
- Has Invoice Attachment? (If node)  
- Extract Invoice Attachments (Code node)  
- Sticky Note - Intake (Documentation)

**Node Details:**

- **JotForm Trigger**  
  - Type: Trigger node  
  - Role: Watches for new submissions on a specified JotForm (form ID: 252815253377461)  
  - Configuration: Connected to JotForm API credential; triggers workflow on new form submission  
  - Input/Output: Receives form data including attachments, outputs JSON & binary data  
  - Failures: Possible API errors, connectivity issues  
  - Sticky Note: Describes integration with JotForm and output expectation

- **Has Invoice Attachment?**  
  - Type: If node  
  - Role: Checks if the submission contains any attachments (boolean condition)  
  - Condition: `$json.attachments?.length > 0 === true` (case-insensitive)  
  - Input: Output from JotForm Trigger  
  - Output: Routes flow to extraction only if attachments exist  
  - Failures: Expression evaluation errors if attachments field is missing or malformed

- **Extract Invoice Attachments**  
  - Type: Code node (JavaScript)  
  - Role: Filters and extracts only invoice attachments (PDF, PNG, JPG, JPEG) from the list  
  - Configuration:  
    - Iterates over all items  
    - Filters filenames by extension  
    - For each qualifying attachment, creates a new item with metadata (email from, subject, date, etc.) and binary data of the attachment  
    - Generates unique invoice_id using timestamp and random string  
  - Input: Items with attachments  
  - Output: One item per invoice attachment including binary data for OCR  
  - Failures: Possible if binary data missing or malformed, or attachments field inconsistent

- **Sticky Note - Intake**  
  - Purpose: Provides user documentation about the intake process and JotForm setup  
  - Content: Encourages using JotForm (link provided) for invoice submission

---

### 1.2 AI OCR and Structured Data Extraction

**Overview:**  
This block uses GPT-4o-mini with vision capabilities to perform OCR and extract complete, structured invoice data from the attached documents. The AI is prompted to return a precise JSON structure containing all relevant invoice fields.

**Nodes Involved:**  
- AI Invoice OCR & Extraction (OpenAI node)  
- Parse Invoice Data (Code node)  
- Sticky Note - OCR (Documentation)

**Node Details:**

- **AI Invoice OCR & Extraction**  
  - Type: Langchain OpenAI node  
  - Role: Sends invoice image/PDF to GPT-4o-mini for extraction of invoice data  
  - Configuration:  
    - Model: gpt-4o-mini  
    - Temperature: 0.1 for deterministic output  
    - Prompt: Detailed instructions to extract invoice info into a strict JSON schema with fields like vendor_name, invoice_number, line_items, totals, payment terms, category, confidence_score, etc.  
  - Input: Items with invoice attachment binary data and email context  
  - Output: AI text response with JSON string inside content field  
  - Credentials: OpenAI API credential required  
  - Failures: Possible API errors, timeouts, malformed AI responses, rate limits

- **Parse Invoice Data**  
  - Type: Code node  
  - Role: Parses AI response content to extract JSON object reliably  
  - Configuration:  
    - Cleans out markdown or code block formatting  
    - Extracts JSON substring via regex  
    - Parses JSON to object  
    - Merges with original email data  
    - Adds parsed_at timestamp and processing status  
    - On error, marks parsing_error and sets status to failed  
  - Input: AI OCR output  
  - Output: Structured invoice data object, ready for fraud analysis  
  - Failures: JSON parse errors if AI output malformed or incomplete

- **Sticky Note - OCR**  
  - Description of AI-powered OCR capabilities and expected extraction accuracy (95%+)

---

### 1.3 AI Fraud Detection and Risk Analysis

**Overview:**  
This block analyzes the extracted invoice data using a specialized fraud detection AI agent. It evaluates multiple risk factors including duplicates, anomalies, vendor trustworthiness, document quality, timing, and category-specific checks. The agent outputs a comprehensive fraud risk assessment with actionable recommendations.

**Nodes Involved:**  
- AI Fraud Detection Agent (Langchain agent node)  
- OpenAI Chat Model (LM Chat OpenAI node) — used as underlying language model  
- Structured Output Parser (Langchain output parser node)  
- Sticky Note - Fraud (Documentation)

**Node Details:**

- **AI Fraud Detection Agent**  
  - Type: Langchain agent node  
  - Role: Runs a custom fraud detection prompt analyzing invoice details for anomalies and fraud indicators  
  - Configuration:  
    - Input: Structured invoice fields (vendor, invoice number, amounts, line items, confidence score, etc.)  
    - Prompt includes detailed red flags and criteria (duplicate detection, amount anomalies, vendor verification, document quality, timing anomalies, pattern detection, category-specific checks)  
    - Output: JSON object with fields like risk_level, risk_score, red_flags array, vendor_trust_score, duplicate_risk, recommended_action, priority_level, detailed markdown analysis, etc.  
  - Input: Parsed invoice data node output  
  - Output: Fraud risk assessment JSON  
  - Failures: AI model errors, parsing errors, timeouts, incomplete input data

- **OpenAI Chat Model**  
  - Type: Langchain LM chat node  
  - Role: Provides the underlying language model (gpt-4o-mini) for the fraud detection agent  
  - Configuration: Temperature 0.2 for some variability in responses  
  - Credentials: OpenAI API required  
  - Input/Output: Connected internally from the agent node

- **Structured Output Parser**  
  - Type: Langchain structured output parser node  
  - Role: Parses AI fraud detection output into a strict JSON schema with validation  
  - Configuration: Manual JSON schema defining required fields, types, enum values, and descriptions  
  - Input: Output from AI Fraud Detection Agent  
  - Output: Validated structured fraud risk data

- **Sticky Note - Fraud**  
  - Details the purpose of AI fraud detection and expected outcomes (fraud prevention before payment)

---

### 1.4 Conditional Routing & Approval Workflow

**Overview:**  
Based on the fraud risk assessment and invoice amount thresholds, this block routes invoices to different approval paths: immediate fraud investigation, auto-approval for low-risk small invoices, or manager approval for medium/high risk or large amounts. It controls the business logic flow.

**Nodes Involved:**  
- Critical Fraud Risk? (If node)  
- Auto-Approve Eligible? (If node)  
- Amount > $5000? (If node)  
- Request Fraud Investigation (Gmail node)  
- Request Manager Approval (Gmail node)  
- Update an invoice (QuickBooks node)  
- Sticky Note - Routing (Documentation)

**Node Details:**

- **Critical Fraud Risk?**  
  - Type: If node  
  - Role: Checks if fraud risk level is "critical" OR recommended action is "fraud_investigation"  
  - Condition: OR combinator on risk_level == "critical" or recommended_action == "fraud_investigation"  
  - Input: Fraud risk assessment output  
  - Output: Routes to fraud investigation notification or further checks  
  - Failures: Expression evaluation errors possible if input missing

- **Auto-Approve Eligible?**  
  - Type: If node  
  - Role: Checks if recommended_action is "auto_approve" AND risk_level is "low"  
  - Input: Fraud risk data  
  - Output: Routes to auto-approval or further checks  
  - Failures: Expression errors if fields missing

- **Amount > $5000?**  
  - Type: If node  
  - Role: Checks if invoice total_amount is greater than 5000 USD  
  - Input: Parsed invoice data  
  - Output: Routes to manager approval (high amount) or QuickBooks update (low amount)  
  - Failures: Numeric comparison errors if amount missing or malformed

- **Request Fraud Investigation**  
  - Type: Gmail node (email sending)  
  - Role: Sends a detailed HTML email alert to finance manager about critical fraud risk invoices for immediate investigation  
  - Configuration:  
    - To: finance-manager@yourcompany.com  
    - Subject: Urgent fraud alert with vendor name  
    - HTML body includes invoice details, risk scores, red flags, and required verifications  
  - Credentials: Gmail OAuth2  
  - Failures: Email send failures, SMTP issues

- **Request Manager Approval**  
  - Type: Gmail node  
  - Role: Sends approval request email to finance manager for invoices above $5000 or medium risk  
  - Configuration:  
    - To: finance-manager@yourcompany.com  
    - Subject: Invoice approval required with vendor and amount  
    - HTML body includes invoice details, risk level, AI analysis summary, and line items  
  - Credentials: Gmail OAuth2  
  - Failures: Email send failures

- **Update an invoice**  
  - Type: QuickBooks node  
  - Role: Updates invoice status in QuickBooks after approval decision  
  - Configuration: Uses QuickBooks credentials  
  - Input: Invoice details  
  - Output: Confirmation of update  
  - Failures: QuickBooks API errors, auth failures

- **Sticky Note - Routing**  
  - Describes intelligent routing logic for approvals, emphasizing fast processing for low risk and strict checks for suspicious invoices

---

### 1.5 Notifications & Communication

**Overview:**  
This block handles communication with vendors, internal teams, and alert channels based on approval outcomes or fraud risks, including Slack alerts and vendor email notifications.

**Nodes Involved:**  
- Notify Vendor - Approved (Gmail node)  
- Send a message (Slack node)

**Node Details:**

- **Notify Vendor - Approved**  
  - Type: Gmail node  
  - Role: Sends confirmation email to vendor that invoice was approved and payment is scheduled  
  - Configuration:  
    - To: invoice sender email from parsed data  
    - Subject: Invoice received and processing confirmation  
    - HTML email with invoice summary, due date, and payment terms  
  - Credentials: Gmail OAuth2  
  - Failures: Email send failures, invalid recipient

- **Send a message**  
  - Type: Slack node  
  - Role: Posts critical fraud alert message to a configured Slack channel with invoice and risk info  
  - Configuration:  
    - ChannelId: Must be set in node configuration  
    - Message: Includes risk scores, red flags, recommended actions  
  - Failures: Slack API auth errors, invalid channel, rate limits

---

### 1.6 Logging and Audit Trail

**Overview:**  
All processed invoices, along with their risk assessments and statuses, are logged in a Google Sheet for audit, compliance, and analytics.

**Nodes Involved:**  
- Log to Invoice Database (Google Sheets node)  
- Sticky Note - Analytics (Documentation)

**Node Details:**

- **Log to Invoice Database**  
  - Type: Google Sheets node  
  - Role: Appends each invoice record with detailed fields into a Google Sheet  
  - Configuration:  
    - Document ID: Configured with the target Google Sheet ID  
    - Sheet Name: Defaults to first sheet (gid=0)  
    - Maps multiple invoice and fraud assessment fields (amount, status, category, risk scores, red flags, invoice_id, dates, recommended action, etc.)  
  - Credentials: Google Sheets API credentials required  
  - Failures: API quota exceeded, sheet access denied, malformed data

- **Sticky Note - Analytics**  
  - Describes purpose of logging for financial analytics and audit trail transparency

---

## 3. Summary Table

| Node Name                 | Node Type                       | Functional Role                                      | Input Node(s)                 | Output Node(s)                          | Sticky Note                                                                                     |
|---------------------------|--------------------------------|-----------------------------------------------------|------------------------------|----------------------------------------|------------------------------------------------------------------------------------------------|
| JotForm Trigger           | Trigger                        | Entry point: triggers on new invoice form submission | -                            | Has Invoice Attachment?                 | ## 📧 Smart Invoice Intake - Monitors invoices submitted via JotForm ([link](https://www.jotform.com/?partner=mediajade)) |
| Has Invoice Attachment?   | If                            | Checks if any invoice attachment exists             | JotForm Trigger              | Extract Invoice Attachments             |                                                                                                |
| Extract Invoice Attachments| Code                          | Filters and extracts supported invoice attachments  | Has Invoice Attachment?      | AI Invoice OCR & Extraction             |                                                                                                |
| AI Invoice OCR & Extraction| Langchain OpenAI              | Performs AI OCR and structured invoice data extraction | Extract Invoice Attachments | Parse Invoice Data                      | ## 🤖 AI-Powered OCR & Data Extraction - GPT-4o-mini with vision for high accuracy              |
| Parse Invoice Data         | Code                          | Parses AI JSON response and merges with email data  | AI Invoice OCR & Extraction  | AI Fraud Detection Agent                |                                                                                                |
| AI Fraud Detection Agent   | Langchain Agent               | Analyzes invoice data for fraud risk and anomalies  | Parse Invoice Data           | Critical Fraud Risk?, Auto-Approve Eligible?, Structured Output Parser | ## 🚨 AI Fraud Detection & Risk Analysis - Detects anomalies and fraud patterns                  |
| OpenAI Chat Model          | Langchain LM Chat OpenAI      | Underlying language model for fraud detection agent | AI Fraud Detection Agent (internal) | Structured Output Parser           |                                                                                                |
| Structured Output Parser   | Langchain Output Parser       | Validates and parses structured fraud risk output   | AI Fraud Detection Agent     | Critical Fraud Risk?, Auto-Approve Eligible? |                                                                                                |
| Critical Fraud Risk?       | If                            | Checks for critical fraud risk or recommended fraud investigation | AI Fraud Detection Agent     | Send a message, Amount > $5000?         | ## 🚦 Intelligent Routing & Approval Workflows - Routes invoices based on risk and amount       |
| Auto-Approve Eligible?     | If                            | Checks if invoice qualifies for auto-approval       | AI Fraud Detection Agent     | Update an invoice, Amount > $5000?      | ## 🚦 Intelligent Routing & Approval Workflows                                                    |
| Amount > $5000?            | If                            | Checks if invoice amount exceeds $5000              | Critical Fraud Risk?, Auto-Approve Eligible? | Request Manager Approval, Update an invoice | ## 🚦 Intelligent Routing & Approval Workflows                                                    |
| Request Fraud Investigation| Gmail                        | Sends fraud alert email to finance manager           | Critical Fraud Risk?         | Log to Invoice Database                 |                                                                                                |
| Send a message             | Slack                        | Posts critical fraud alert to Slack channel          | Critical Fraud Risk?         | Request Fraud Investigation             |                                                                                                |
| Request Manager Approval   | Gmail                        | Sends approval request email for high amount invoices | Amount > $5000?              | Log to Invoice Database                 |                                                                                                |
| Update an invoice          | QuickBooks                   | Updates invoice status after approval                 | Amount > $5000?, Auto-Approve Eligible? | Notify Vendor - Approved               |                                                                                                |
| Notify Vendor - Approved   | Gmail                        | Sends invoice approval notification to vendor        | Update an invoice            | Log to Invoice Database                 |                                                                                                |
| Log to Invoice Database    | Google Sheets                | Logs invoice and fraud data into Google Sheet         | Notify Vendor - Approved, Request Manager Approval, Request Fraud Investigation | -                                      | ## 📊 Financial Analytics & Audit Trail - For transparency and compliance                       |
| Sticky Note - Intake       | Sticky Note                  | Documentation on invoice intake                        | -                            | -                                      |                                                                                               |
| Sticky Note - OCR          | Sticky Note                  | Documentation on AI OCR extraction                     | -                            | -                                      |                                                                                               |
| Sticky Note - Fraud        | Sticky Note                  | Documentation on AI fraud detection                     | -                            | -                                      |                                                                                               |
| Sticky Note - Routing      | Sticky Note                  | Documentation on intelligent routing and approval     | -                            | -                                      |                                                                                               |
| Sticky Note - Analytics    | Sticky Note                  | Documentation on logging and analytics                 | -                            | -                                      |                                                                                               |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a JotForm Trigger Node**  
   - Type: JotForm Trigger  
   - Credential: Connect your JotForm API credentials  
   - Parameter: Select your invoice submission form by form ID (e.g., 252815253377461)  
   - Purpose: Trigger workflow on new invoice submission

2. **Add an If Node "Has Invoice Attachment?"**  
   - Condition: Check if `$json.attachments?.length > 0 === true` (boolean check)  
   - Connect input from JotForm Trigger  
   - Output: Proceed only if attachments exist

3. **Add a Code Node "Extract Invoice Attachments"**  
   - Paste JavaScript code to filter attachments for PDF/JPG/PNG and prepare items with metadata and binary data  
   - Input: From If node "Has Invoice Attachment?" (true branch)

4. **Add an OpenAI Node "AI Invoice OCR & Extraction"**  
   - Node Type: Langchain OpenAI  
   - Credential: Connect OpenAI API (with GPT-4o-mini model access)  
   - Model: gpt-4o-mini  
   - Temperature: 0.1  
   - Prompt: Provide detailed instructions to extract invoice data into strict JSON, including all required fields (vendor_name, invoice_number, line_items, totals, dates, etc.)  
   - Input: Output from "Extract Invoice Attachments" node

5. **Add a Code Node "Parse Invoice Data"**  
   - JavaScript to clean AI response, extract JSON substring, parse it, merge with original email data, and add timestamps  
   - Input: Output from "AI Invoice OCR & Extraction"

6. **Add an AI Agent Node "AI Fraud Detection Agent"**  
   - Node Type: Langchain Agent  
   - Prompt: Provide detailed fraud detection criteria including duplicate checks, anomalies, vendor verification, document quality, timing, pattern detection, and category checks  
   - Input: Output from "Parse Invoice Data"  
   - Underlying LM: Use Langchain LM Chat OpenAI node with GPT-4o-mini (temperature 0.2)  
   - Output: JSON with risk assessments and recommendations

7. **Add a Structured Output Parser Node**  
   - Define JSON schema for fraud detection output with required fields (risk_level, risk_score, vendor_trust_score, recommended_action, etc.)  
   - Input: Output from "AI Fraud Detection Agent"  
   - Output: Validated fraud risk data

8. **Add If Node "Critical Fraud Risk?"**  
   - Condition: OR of `risk_level == "critical"` or `recommended_action == "fraud_investigation"`  
   - Input: Output from Structured Output Parser

9. **Add Slack Node "Send a message"**  
   - Configure Slack credentials  
   - Channel: Set your alert channel  
   - Message: Compose message summarizing critical fraud alert with invoice and risk details (use expressions to inject data)  
   - Input: True branch from "Critical Fraud Risk?"

10. **Add Gmail Node "Request Fraud Investigation"**  
    - Configure Gmail OAuth2 credentials  
    - To: finance-manager@yourcompany.com  
    - Subject and HTML Body: Include invoice details, risk scores, red flags, required verifications, urgent alert formatting  
    - Input: True branch from "Critical Fraud Risk?"

11. **Add If Node "Auto-Approve Eligible?"**  
    - Condition: AND of `recommended_action == "auto_approve"` and `risk_level == "low"`  
    - Input: Output from Structured Output Parser

12. **Add If Node "Amount > $5000?"**  
    - Condition: Check if `total_amount > 5000` (numeric comparison)  
    - Input: Outputs from both "Critical Fraud Risk?" and "Auto-Approve Eligible?" nodes (false branches)

13. **Add Gmail Node "Request Manager Approval"**  
    - Configure Gmail OAuth2 credentials  
    - To: finance-manager@yourcompany.com  
    - Subject and HTML Body: Detailed invoice info, risk level, AI analysis, line items table  
    - Input: True branch from "Amount > $5000?"

14. **Add QuickBooks Node "Update an invoice"**  
    - Configure QuickBooks credentials  
    - Operation: Update invoice status (e.g., approved)  
    - Input: False branch from "Amount > $5000?" and True branch from "Auto-Approve Eligible?"

15. **Add Gmail Node "Notify Vendor - Approved"**  
    - Configure Gmail OAuth2 credentials  
    - To: vendor email from parsed invoice data  
    - Subject and HTML Body: Confirmation of approval, payment terms, due date  
    - Input: Output from "Update an invoice"

16. **Add Google Sheets Node "Log to Invoice Database"**  
    - Configure Google Sheets credentials  
    - Set target Google Sheet document ID and sheet name  
    - Map invoice data fields and fraud risk fields into columns  
    - Input: Outputs from "Notify Vendor - Approved", "Request Manager Approval", and "Request Fraud Investigation"

17. **Add Sticky Notes** at relevant points for documentation: Intake, OCR, Fraud, Routing, Analytics.

---

## 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                      |
|----------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| Smart invoice intake via JotForm with free form creation: https://www.jotform.com/?partner=mediajade | Intake process documentation                         |
| AI-powered OCR & data extraction with GPT-4o-mini providing 95%+ accuracy                           | AI OCR block description                            |
| AI fraud detection analyzes multiple risk factors to preempt fraudulent invoices                    | Fraud detection block description                    |
| Intelligent routing accelerates processing of low-risk invoices and rigorously flags suspicious ones | Routing and approval workflow notes                   |
| Comprehensive logging in Google Sheets enables audit trails and financial analytics                 | Logging and analytics documentation                   |

---

**Disclaimer:** The provided text is derived solely from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.

---