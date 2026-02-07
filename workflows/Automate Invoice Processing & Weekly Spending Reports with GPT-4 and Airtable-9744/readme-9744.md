Automate Invoice Processing & Weekly Spending Reports with GPT-4 and Airtable

https://n8nworkflows.xyz/workflows/automate-invoice-processing---weekly-spending-reports-with-gpt-4-and-airtable-9744


# Automate Invoice Processing & Weekly Spending Reports with GPT-4 and Airtable

### 1. Workflow Overview

This workflow automates the processing of uploaded invoices and the generation of weekly spending reports using AI (GPT-4) and Airtable as a data store. It is designed primarily for small businesses, freelancers, or individuals who want to reduce manual invoice handling and gain clear insights into their spending patterns.

The workflow is logically divided into two main blocks:

- **1.1 Invoice Data Extraction and Storage**  
  Handles invoice upload, AI-powered extraction of invoice details, validation of the data, and storage in Airtable.

- **1.2 Weekly Spending Report Generation and Distribution**  
  Periodically triggers a report generation process that fetches recent invoices from Airtable, summarizes spending data using AI, and emails the report to a configured recipient.

---

### 2. Block-by-Block Analysis

#### 1.1 Invoice Data Extraction and Storage

**Overview:**  
This block initiates when a user uploads an invoice (PDF, PNG, JPG). The uploaded file is processed by an AI model (GPT-4) to extract structured invoice data, which is then validated and stored in Airtable if valid.

**Nodes Involved:**  
- Invoice Upload Form  
- Workflow Configuration  
- OpenAI Chat Model - Invoice Parser  
- Extract Invoice Data  
- Invoice Data Parser  
- Validate Invoice Data  
- Store Invoice in Airtable  

**Node Details:**

- **Invoice Upload Form**  
  - *Type:* Form Trigger  
  - *Role:* Entry point for invoice files uploaded by users.  
  - *Configuration:* Accepts one invoice file (PDF, PNG, JPG) and optional notes; form titled "Invoice Upload."  
  - *Connections:* Outputs to "Workflow Configuration."  
  - *Edge Cases:* File upload failures, unsupported file types, incomplete form submissions.

- **Workflow Configuration**  
  - *Type:* Set Node  
  - *Role:* Holds static configuration parameters.  
  - *Configuration:* Assigns placeholders for Airtable Base ID, Table ID, and email for reports.  
  - *Connections:* Outputs to "Extract Invoice Data."  
  - *Edge Cases:* Missing or incorrect configuration values will cause downstream failures.

- **OpenAI Chat Model - Invoice Parser**  
  - *Type:* OpenAI Chat Model (GPT-4.1-mini)  
  - *Role:* Processes text prompt to parse invoice data from uploaded files.  
  - *Configuration:* Uses GPT-4.1-mini with default options; requires OpenAI API credential.  
  - *Connections:* Outputs to "Extract Invoice Data."  
  - *Version:* Requires n8n with Langchain integration and OpenAI API access.  
  - *Edge Cases:* API rate limits, invalid API key, timeout, partial or incorrect data extraction.

- **Extract Invoice Data**  
  - *Type:* Langchain Agent  
  - *Role:* Uses a defined prompt to extract vendor, invoice date, total amount, currency, and line items.  
  - *Configuration:* Structured output parser enabled with a JSON schema example.  
  - *Connections:* Outputs to "Validate Invoice Data."  
  - *Edge Cases:* Parsing failures or unexpected invoice formats.

- **Invoice Data Parser**  
  - *Type:* Output Parser Structured  
  - *Role:* Parses AI output into the structured JSON format required.  
  - *Configuration:* Uses a provided JSON schema example for validation.  
  - *Connections:* Feeds back into "Extract Invoice Data" node as output parser.  
  - *Edge Cases:* Schema mismatches, invalid JSON output.

- **Validate Invoice Data**  
  - *Type:* If Node  
  - *Role:* Validates presence and correctness of key invoice fields:  
    - Vendor name not empty  
    - Total amount > 0  
    - Invoice date not empty  
  - *Configuration:* String and numeric checks combined with logical AND.  
  - *Connections:*  
    - If TRUE, continues to "Store Invoice in Airtable"  
    - If FALSE, the workflow halts or could be extended to error handling.  
  - *Edge Cases:* Missing fields, zero or negative amounts.

- **Store Invoice in Airtable**  
  - *Type:* Airtable Node  
  - *Role:* Inserts validated invoice data into configured Airtable base and table.  
  - *Configuration:* Maps vendor, currency, line items (as JSON string), invoice date, and total amount to Airtable columns. Requires Airtable Personal Access Token credentials.  
  - *Connections:* Terminal node for invoice processing.  
  - *Edge Cases:* Airtable API limits, invalid credentials, field mapping errors.

---

#### 1.2 Weekly Spending Report Generation and Distribution

**Overview:**  
This block runs on a scheduled weekly trigger (Sunday 6 PM), fetches invoices from the past 7 days from Airtable, generates a comprehensive spending report using AI, and emails the report to a specified recipient.

**Nodes Involved:**  
- Weekly Report Schedule  
- Fetch Weekly Invoices  
- Generate Spending Report  
- OpenAI Chat Model - Report Generator  
- Send Weekly Report Email  

**Node Details:**

- **Weekly Report Schedule**  
  - *Type:* Schedule Trigger  
  - *Role:* Automatically triggers the weekly report generation every Sunday at 18:00 (6 PM).  
  - *Configuration:* Interval set to weekly at hour 18.  
  - *Connections:* Outputs to "Fetch Weekly Invoices."  
  - *Edge Cases:* Workflow downtime at trigger time.

- **Fetch Weekly Invoices**  
  - *Type:* Airtable Node  
  - *Role:* Queries Airtable for invoices with "Invoice Date" within the last 7 days.  
  - *Configuration:* Uses Airtable Base and Table IDs from workflow configuration; filter formula: `IS_AFTER({Invoice Date}, DATEADD(TODAY(), -7, 'days'))`.  
  - *Connections:* Outputs to "Generate Spending Report."  
  - *Edge Cases:* No invoices found, Airtable API errors.

- **Generate Spending Report**  
  - *Type:* Langchain Agent  
  - *Role:* Takes invoice data and generates a detailed spending report including total weekly spending, vendor breakdown, top 5 expenses, trends, and observations.  
  - *Configuration:* Prompt customized for report generation; no output parser specified.  
  - *Connections:* Outputs to "Send Weekly Report Email."  
  - *Edge Cases:* AI API errors, incomplete data leading to poor report quality.

- **OpenAI Chat Model - Report Generator**  
  - *Type:* OpenAI Chat Model (GPT-4.1-mini)  
  - *Role:* Processes the report generation prompt.  
  - *Configuration:* Uses GPT-4.1-mini with default options; requires OpenAI API credential.  
  - *Connections:* Linked internally as AI language model for "Generate Spending Report."  
  - *Edge Cases:* API failures or rate limits.

- **Send Weekly Report Email**  
  - *Type:* Email Send Node  
  - *Role:* Sends the generated spending report email to the configured recipient.  
  - *Configuration:*  
    - Subject: includes current date  
    - HTML body: AI-generated report content  
    - Recipient: from "Workflow Configuration" node  
    - Sender email: placeholder to be replaced by user  
    - Requires SMTP or other email credentials properly configured.  
  - *Connections:* Terminal node for report sending.  
  - *Edge Cases:* Email delivery failures, invalid recipient address, SMTP credential issues.

---

### 3. Summary Table

| Node Name                    | Node Type                         | Functional Role                                    | Input Node(s)                    | Output Node(s)                      | Sticky Note                                                                                              |
|------------------------------|----------------------------------|---------------------------------------------------|---------------------------------|------------------------------------|--------------------------------------------------------------------------------------------------------|
| Invoice Upload Form           | Form Trigger                     | Entry point for invoice upload                     | —                               | Workflow Configuration              | ## **Invoice Data Extraction and Storage** * Upload your invoices (PDF, PNG, JPG) via an n8n form.     |
| Workflow Configuration        | Set                              | Holds main config variables                        | Invoice Upload Form             | Extract Invoice Data                |                                                                                                        |
| OpenAI Chat Model - Invoice Parser | OpenAI Chat Model              | GPT-4 model for invoice data extraction            | — (used internally by Extract Invoice Data) | Extract Invoice Data                | ## **AI-Powered Data Extraction** AI extracts key info such as vendor, date, amount, currency, line items. |
| Extract Invoice Data          | Langchain Agent                  | Extracts structured data from invoice via AI      | Workflow Configuration           | Validate Invoice Data               |                                                                                                        |
| Invoice Data Parser           | Output Parser Structured         | Parses AI output into JSON schema                   | OpenAI Chat Model - Invoice Parser | Extract Invoice Data                |                                                                                                        |
| Validate Invoice Data         | If                               | Validates extracted invoice data                    | Extract Invoice Data             | Store Invoice in Airtable           | ## **Data Validation** The extracted data is validated to ensure it is complete and accurate.           |
| Store Invoice in Airtable     | Airtable Node                   | Stores validated invoice data in Airtable          | Validate Invoice Data            | —                                  | ##  **Store in Airtable** Validated invoice data is saved in Airtable.                                 |
| Weekly Report Schedule        | Schedule Trigger                | Triggers weekly report generation                   | —                               | Fetch Weekly Invoices               | ## **Weekly Report Schedule** Automatically triggers every Sunday at 6 PM.                            |
| Fetch Weekly Invoices         | Airtable Node                   | Retrieves invoices from last 7 days                 | Weekly Report Schedule           | Generate Spending Report            | ## **Fetch Weekly Invoices** Retrieves all invoices stored in Airtable within the last 7 days.         |
| Generate Spending Report      | Langchain Agent                 | AI generates weekly spending report                 | Fetch Weekly Invoices            | Send Weekly Report Email            | ## **AI-Powered Spending Report Generation** AI creates total spending, vendor breakdown, top expenses, trends, observations. |
| OpenAI Chat Model - Report Generator | OpenAI Chat Model              | GPT-4 model for report generation                    | — (used internally by Generate Spending Report) | Generate Spending Report            |                                                                                                        |
| Send Weekly Report Email      | Email Send                     | Emails the generated weekly report                   | Generate Spending Report         | —                                  | ## **Send Weekly Report Email** The generated report is emailed professionally.                        |
| Sticky Note                  | Sticky Note                     | Documentation and overview notes                     | —                               | —                                  | ## Invoice Automation Kit: AI-Powered Invoice Processing and Weekly Reports (full workflow explanation) |
| Sticky Note1                 | Sticky Note                     | Highlights invoice upload form                        | —                               | —                                  | ## **Invoice Data Extraction and Storage** * Invoice Upload Form description.                          |
| Sticky Note2                 | Sticky Note                     | Highlights AI data extraction                         | —                               | —                                  | ## **AI-Powered Data Extraction** description.                                                        |
| Sticky Note3                 | Sticky Note                     | Highlights Airtable storage                           | —                               | —                                  | ##  **Store in Airtable** description.                                                                |
| Sticky Note4                 | Sticky Note                     | Highlights data validation                            | —                               | —                                  | ## **Data Validation** description.                                                                   |
| Sticky Note5                 | Sticky Note                     | Highlights fetching weekly invoices                   | —                               | —                                  | ## **Fetch Weekly Invoices** description.                                                             |
| Sticky Note6                 | Sticky Note                     | Highlights AI spending report generation              | —                               | —                                  | ## **AI-Powered Spending Report Generation** description.                                             |
| Sticky Note7                 | Sticky Note                     | Highlights sending weekly report email                 | —                               | —                                  | ## **Send Weekly Report Email** description.                                                          |
| Sticky Note8                 | Sticky Note                     | Highlights weekly report schedule                      | —                               | —                                  | ## **Weekly Report Schedule** description.                                                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "Invoice Upload Form" Node**  
   - Type: Form Trigger  
   - Configure form title: "Invoice Upload"  
   - Add fields:  
     - File upload field accepting .pdf, .png, .jpg (single file, required)  
     - Text field for "Additional Notes (Optional)"  
   - Position: left side entry node.

2. **Create "Workflow Configuration" Node**  
   - Type: Set  
   - Define string fields:  
     - airtableBaseId: Your Airtable Base ID  
     - airtableTableId: Your Airtable Table ID  
     - reportRecipientEmail: Email address to receive weekly reports  
   - Connect output from "Invoice Upload Form" to this node.

3. **Create "OpenAI Chat Model - Invoice Parser" Node**  
   - Type: OpenAI Chat Model (Langchain)  
   - Credentials: Configure OpenAI API key  
   - Model: Select GPT-4.1-mini  
   - No special options  
   - This node will be linked internally by the "Extract Invoice Data" node.

4. **Create "Invoice Data Parser" Node**  
   - Type: Output Parser Structured (Langchain)  
   - Paste the provided JSON schema example for invoice data (vendor, invoiceDate, totalAmount, currency, lineItems array)  
   - Connect this node as "ai_outputParser" to "Extract Invoice Data."

5. **Create "Extract Invoice Data" Node**  
   - Type: Langchain Agent  
   - Prompt: Define a prompt instructing extraction of vendor name, invoice date, total amount, currency, and line items with description, quantity, unit price, and total.  
   - Enable output parser and link to "Invoice Data Parser."  
   - Set "OpenAI Chat Model - Invoice Parser" as the AI language model node.  
   - Connect output from "Workflow Configuration" node into this node.

6. **Create "Validate Invoice Data" Node**  
   - Type: If (Conditional Node)  
   - Validate:  
     - vendor field is not empty (string)  
     - totalAmount is a number > 0  
     - invoiceDate is not empty (string)  
   - Connect output from "Extract Invoice Data" to this node.

7. **Create "Store Invoice in Airtable" Node**  
   - Type: Airtable  
   - Credentials: Configure Airtable Personal Access Token  
   - Set Base ID and Table ID from Workflow Configuration node variables.  
   - Map fields:  
     - Vendor ← vendor  
     - Currency ← currency  
     - Line Items ← JSON.stringify(lineItems)  
     - Invoice Date ← invoiceDate  
     - Total Amount ← totalAmount  
   - Connect TRUE output from "Validate Invoice Data" to this node.

8. **Create "Weekly Report Schedule" Node**  
   - Type: Schedule Trigger  
   - Set interval: Weekly, trigger at hour 18 (6 PM Sunday)  
   - Position on right side, separate from invoice processing.

9. **Create "Fetch Weekly Invoices" Node**  
   - Type: Airtable  
   - Credentials: Use same Airtable token as above  
   - Base ID and Table ID from Workflow Configuration  
   - Operation: Search  
   - Filter formula: `IS_AFTER({Invoice Date}, DATEADD(TODAY(), -7, 'days'))`  
   - Connect output from "Weekly Report Schedule" node.

10. **Create "OpenAI Chat Model - Report Generator" Node**  
    - Type: OpenAI Chat Model (Langchain)  
    - Credentials: OpenAI API Key  
    - Model: GPT-4.1-mini  
    - No special options  
    - Connect internally to "Generate Spending Report" node.

11. **Create "Generate Spending Report" Node**  
    - Type: Langchain Agent  
    - Prompt: Request a professional spending report summarizing total spending, vendor breakdown, top 5 expenses, trends, and any notable insights.  
    - Link output parser if needed (none specified here).  
    - Set AI language model node as "OpenAI Chat Model - Report Generator."  
    - Connect output from "Fetch Weekly Invoices" node.

12. **Create "Send Weekly Report Email" Node**  
    - Type: Email Send  
    - Configure SMTP or email sending credentials.  
    - Subject: "Weekly Spending Report - {{ $now.format('MMMM DD, YYYY') }}"  
    - To: Use reportRecipientEmail from Workflow Configuration  
    - From: Set your sender email address  
    - HTML Body: Use the output of "Generate Spending Report" node.  
    - Connect output from "Generate Spending Report" node.

13. **Connect all nodes logically as detailed above.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Context or Link                                                                                                                           |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| This n8n workflow automates invoice processing and weekly spending reports using AI and Airtable, saving time and improving data accuracy for small businesses and freelancers.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Workflow overview                                                                                                                        |
| To set up, replace placeholders in the "Workflow Configuration" node with your Airtable Base ID, Table ID, and report recipient email. Configure Airtable Personal Access Token and OpenAI API credentials in respective nodes. Also configure your SMTP/email credentials in the email node.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Setup instructions                                                                                                                      |
| Customize prompts in "Extract Invoice Data" and "Generate Spending Report" nodes to extract additional data or adjust report formatting as needed. Validation rules can be extended in the "Validate Invoice Data" node. Notifications can be added (e.g. Slack) to enhance workflow.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Customization guidance                                                                                                                  |
| Airtable table must contain columns: Vendor (text), Invoice Date (date), Total Amount (number), Currency (text), and Line Items (long text or JSON).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Airtable setup requirements                                                                                                            |
| OpenAI GPT-4.1-mini model used for both invoice parsing and report generation requires proper API key and may incur costs based on usage. Handle API errors and rate limits accordingly.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | AI usage notes                                                                                                                         |
| Weekly report trigger is set for Sundays at 6 PM; adjust schedule node as needed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Scheduling information                                                                                                                 |
| [Airtable API documentation](https://airtable.com/api) and [OpenAI API documentation](https://platform.openai.com/docs/api-reference) can be consulted for advanced integration or troubleshooting.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | External resources                                                                                                                     |

---

**Disclaimer:** The provided text stems exclusively from an n8n automated workflow created with n8n integration and automation tooling. This processing strictly adheres to applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly accessible.