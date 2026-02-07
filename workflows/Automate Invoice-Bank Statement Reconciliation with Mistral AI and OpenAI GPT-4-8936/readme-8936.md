Automate Invoice-Bank Statement Reconciliation with Mistral AI and OpenAI GPT-4

https://n8nworkflows.xyz/workflows/automate-invoice-bank-statement-reconciliation-with-mistral-ai-and-openai-gpt-4-8936


# Automate Invoice-Bank Statement Reconciliation with Mistral AI and OpenAI GPT-4

---

# 1. Workflow Overview

**Purpose:**  
This workflow automates the reconciliation of invoices against bank statements by leveraging OCR and AI models (Mistral AI and OpenAI GPT-4). It aims to streamline the time-consuming and error-prone process of cash reconciliation in accounts receivable. By automating data extraction, matching, and classification, it improves accuracy, reduces manual effort, and provides near real-time visibility into cash flow status.

**Target Use Cases:**  
- Accounts Receivable teams handling daily bank statements and invoice data.  
- Organizations seeking to accelerate month-end close and reduce unapplied cash backlog.  
- Businesses requiring scalable, AI-assisted reconciliation with confidence scoring and detailed reasons.

**Logical Blocks:**

- **1.1 Input Reception and Data Extraction:**  
  Fetch invoice and bank statement data from Microsoft Excel and OneDrive respectively, then extract raw text from bank statement files using Mistral OCR.

- **1.2 Data Transformation and Preparation:**  
  Parse invoice data into structured ledger entries, and prepare bank statement text for AI processing.

- **1.3 AI Processing and Matching:**  
  Send structured invoice ledger and raw bank transaction text to OpenAI Chat model to perform parsing, matching, classification, and generate a reconciliation summary.

- **1.4 Post-Processing and Output Formatting:**  
  Parse AI output JSON to create a structured reconciliation table showing matched and unmatched transactions with confidence scores and reasons.

- **1.5 Manual Execution and Workflow Controls:**  
  Workflow is triggered manually to start the process.

- **1.6 Documentation and Notes:**  
  Sticky notes provide problem context, value proposition, input-output overview, AI processing explanation, post-processing details, and possible future enhancements.

---

# 2. Block-by-Block Analysis

---

### 2.1 Input Reception and Data Extraction

**Overview:**  
This block retrieves the source data required for reconciliation: open invoices from an Excel workbook and the daily bank statement file from OneDrive. The bank statement file is downloaded and its text extracted using OCR.

**Nodes Involved:**  
- When clicking ‘Execute workflow’  
- Get Invoice Data (Microsoft Excel)  
- Code in JavaScript (Transform Invoice Data)  
- Get Bank Statement (Microsoft OneDrive)  
- Extract the Data from Unstructured File (OneDrive download)  
- Extract text (Mistral AI OCR)

**Node Details:**

- **When clicking ‘Execute workflow’**  
  - Type: Manual Trigger  
  - Role: Starting point for manual execution  
  - Config: No parameters  
  - Connections: Outputs to “Get Invoice Data”  
  - Edge Cases: None (manual trigger)  

- **Get Invoice Data**  
  - Type: Microsoft Excel  
  - Role: Fetch invoice data rows from Excel table on OneDrive  
  - Config: Retrieves all rows from specified worksheet and table in an Excel file stored on OneDrive  
  - Credentials: Microsoft Excel OAuth2  
  - Connections: Outputs JSON rows to “Code in JavaScript”  
  - Edge Cases: File or worksheet missing, credential failure, empty data  

- **Code in JavaScript**  
  - Type: Code node  
  - Role: Transform raw Excel rows into structured ERP ledger entries  
  - Config: Extracts customer name, invoice number, due date, amount; converts amount to number; creates `erpLedger` JSON array  
  - Key Expressions: accesses `items[0].json.data` array, maps and filters rows  
  - Connections: Outputs transformed data to “Get Bank Statement”  
  - Edge Cases: Missing or malformed rows, data type conversion errors  

- **Get Bank Statement**  
  - Type: Microsoft OneDrive  
  - Role: Retrieve daily bank statement file (PDF or other) by fileId  
  - Config: Operation “get” to fetch file metadata  
  - Credentials: Microsoft OneDrive OAuth2  
  - Connections: Outputs file metadata (id) to “Extract the Data from Unstructured File”  
  - Edge Cases: File not found, permission issues, API rate limits  

- **Extract the Data from Unstructured File**  
  - Type: Microsoft OneDrive (download)  
  - Role: Download the bank statement file as binary data  
  - Config: Uses fileId from previous node, downloads file content to binary property named “Data”  
  - Credentials: Microsoft OneDrive OAuth2  
  - Connections: Outputs binary file to “Extract text”  
  - Edge Cases: Download failure, corrupted file, timeout  

- **Extract text**  
  - Type: Mistral AI (OCR)  
  - Role: Extract raw text from bank statement binary file using OCR AI service  
  - Config: Binary property input “Data”, batch processing disabled  
  - Credentials: Mistral Cloud API key  
  - Connections: Outputs extracted text to “Process the Invoice Vs Bank Statement Data”  
  - Edge Cases: OCR failure, low-quality scan, API errors, rate limits  

---

### 2.2 Data Transformation and Preparation

**Overview:**  
Prepares and formats the extracted invoice and bank statement data to be consumed by the AI reconciliation agent.

**Nodes Involved:**  
- (This block is mainly covered by data output from “Code in JavaScript” and “Extract text” passed as inputs to AI agent in next block)

**Node Details:**  
No specific nodes solely dedicated here; data preparation is embedded in node outputs feeding the AI agent.

---

### 2.3 AI Processing and Matching

**Overview:**  
This block leverages an OpenAI GPT-4 powered chat model to parse bank statement text into structured transactions, match them against ERP ledger invoices, classify unmatched items, propose partial matches, and produce summary metrics with confidence scores.

**Nodes Involved:**  
- Process the Invoice Vs Bank Statement Data (Langchain Agent)  
- OpenAI Chat Model1 (GPT-4.1-mini)

**Node Details:**

- **Process the Invoice Vs Bank Statement Data**  
  - Type: Langchain Agent node (n8n)  
  - Role: Formulates prompt and sends invoice and bank data to AI for reconciliation analysis  
  - Config:  
    - Prompt includes instructions as cash reconciliation specialist  
    - Input: raw bank transactions extracted text and JSON ERP ledger entries  
    - Tasks cover parsing, matching with criteria (amount, date ±2 days, reference similarity), classification, partial matches, summary metrics, and confidence scoring  
    - Constraints enforce JSON-only output, candidate limits, confidence thresholds  
    - Output expected in tabular JSON format  
  - Connections: Input from “Extract text” and “Code in JavaScript” outputs; outputs AI JSON to “Get Transaction, Matches, Summary”  
  - Edge Cases: AI response errors, malformed output, API errors, token limits, latency  

- **OpenAI Chat Model1**  
  - Type: OpenAI Chat (GPT-4.1-mini) via Langchain integration  
  - Role: The underlying AI language model called by Langchain Agent  
  - Config: Model set to “gpt-4.1-mini” with temperature=0 for deterministic output  
  - Credentials: OpenAI API key  
  - Connections: Input from Langchain Agent node; outputs to Langchain Agent node  
  - Edge Cases: API rate limits, network errors, invalid API key  

---

### 2.4 Post-Processing and Output Formatting

**Overview:**  
Parses the AI-generated JSON output into a structured reconciliation table, generating one item per transaction row with detailed fields including match status, confidence, and reasons.

**Nodes Involved:**  
- Get Transaction, Matches, Summary (Code node)

**Node Details:**

- **Get Transaction, Matches, Summary**  
  - Type: Code node  
  - Role: Parse AI JSON output string containing transactions, matches, and summary blocks  
  - Config:  
    - Safely parses AI output by normalizing separators and splitting JSON blocks  
    - Builds an index of matches keyed by transaction_id  
    - Constructs a reconciliation table of rows with fields:  
      - Bank Transaction Date (formatted string)  
      - Bank Transaction Description  
      - Bank Amount  
      - ERP Invoice Number(s)  
      - ERP Customer Name(s) (not provided in AI output, set to “N/A”)  
      - ERP Amount(s)  
      - Match Status (matched/unmatched/unapplied with classification)  
      - Confidence Score  
      - Reason for match or unmatched classification  
    - Returns a list of structured items for downstream consumption or display  
  - Inputs: AI JSON output from “Process the Invoice Vs Bank Statement Data”  
  - Outputs: Structured reconciliation items  
  - Edge Cases: JSON parse errors, missing data fields, inconsistent AI output  

---

### 2.5 Manual Execution and Workflow Controls

**Overview:**  
Facilitates manual triggering of the workflow to start the entire reconciliation process.

**Nodes Involved:**  
- When clicking ‘Execute workflow’

**Node Details:**  
- Covered under 2.1 Input Reception

---

### 2.6 Documentation and Notes

**Overview:**  
Sticky notes provide essential contextual information for users and maintainers about problem statement, value, inputs, AI processing logic, post-processing, and future improvements.

**Nodes Involved:**  
- Sticky Note, Sticky Note1, Sticky Note2, Sticky Note3, Sticky Note4, Sticky Note5

**Node Details:**

- **Sticky Note (Problem Statement)**  
  - Describes challenges in manual cash reconciliation including volume, complexity, and error potential.

- **Sticky Note1 (Value Proposition)**  
  - Highlights time savings, improved cash flow visibility, error reduction, and scalability benefits.

- **Sticky Note2 (Input Overview)**  
  - Summarizes inputs: open invoices from Excel, bank statement from OneDrive, OCR extraction.

- **Sticky Note3 (AI Processing Overview)**  
  - Explains AI tasks: matching, scoring, classification, and summary generation.

- **Sticky Note4 (Post-Processing and Output)**  
  - Details parsing of AI output and reconciliation table structure for AR specialists.

- **Sticky Note5 (Possible Enhancements)**  
  - Suggests improvements such as connecting to data tables (Snowflake, Databricks), direct bank APIs, and ERP integration for posting matched invoices.

---

# 3. Summary Table

| Node Name                          | Node Type                          | Functional Role                                  | Input Node(s)                   | Output Node(s)                             | Sticky Note                                                                                                                                                                                 |
|-----------------------------------|----------------------------------|-------------------------------------------------|--------------------------------|--------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’  | Manual Trigger                   | Manual workflow start                            | —                              | Get Invoice Data                           | ***Input***: Open invoices loaded from Excel. Daily bank statement fetched from OneDrive. OCR extracts transaction data.                                                                     |
| Get Invoice Data                  | Microsoft Excel                  | Retrieve invoice rows from Excel on OneDrive    | When clicking ‘Execute workflow’| Code in JavaScript                        | ***Input***: Open invoices loaded from Excel. Daily bank statement fetched from OneDrive. OCR extracts transaction data.                                                                     |
| Code in JavaScript                | Code                            | Transform invoice Excel data into structured ledger | Get Invoice Data               | Get Bank Statement                        | ***Input***: Open invoices loaded from Excel. Daily bank statement fetched from OneDrive. OCR extracts transaction data.                                                                     |
| Get Bank Statement               | Microsoft OneDrive               | Fetch bank statement file metadata               | Code in JavaScript             | Extract the Data from Unstructured File  | ***Input***: Open invoices loaded from Excel. Daily bank statement fetched from OneDrive. OCR extracts transaction data.                                                                     |
| Extract the Data from Unstructured File | Microsoft OneDrive (download) | Download bank statement file binary data         | Get Bank Statement             | Extract text                             | ***Input***: Open invoices loaded from Excel. Daily bank statement fetched from OneDrive. OCR extracts transaction data.                                                                     |
| Extract text                    | Mistral AI (OCR)                 | Extract raw text from bank statement file        | Extract the Data from Unstructured File | Process the Invoice Vs Bank Statement Data| ***Input***: Open invoices loaded from Excel. Daily bank statement fetched from OneDrive. OCR extracts transaction data.                                                                     |
| Process the Invoice Vs Bank Statement Data | Langchain Agent                | AI reconciliation logic: parse, match, classify | Extract text                   | Get Transaction, Matches, Summary        | ***AI Processing***: Invoice and bank data passed to OpenAI chat model for transaction-invoice matching, confidence scoring, unmatched classification, and summary metrics.                  |
| OpenAI Chat Model1              | OpenAI Chat (GPT-4.1-mini)       | Underlying AI language model                      | Process the Invoice Vs Bank Statement Data | Process the Invoice Vs Bank Statement Data| ***AI Processing***: Invoice and bank data passed to OpenAI chat model for transaction-invoice matching, confidence scoring, unmatched classification, and summary metrics.                  |
| Get Transaction, Matches, Summary| Code                            | Parse AI JSON output into structured reconciliation table | Process the Invoice Vs Bank Statement Data | —                                         | ***Post-Processing***: Parses AI output JSON into table with bank transaction date, description, amount, ERP invoice numbers, match status, confidence, and reason fields.                     |
| Sticky Note                    | Sticky Note                     | Documentation: Problem Statement                  | —                              | —                                          | Cash reconciliation is time-consuming, error-prone. Challenges: volume, complexity, accuracy, speed.                                                                                        |
| Sticky Note1                   | Sticky Note                     | Documentation: Value Proposition                   | —                              | —                                          | Time saved, improved cash flow visibility, error reduction, scalability.                                                                                                                   |
| Sticky Note2                   | Sticky Note                     | Documentation: Input Summary                        | —                              | —                                          | Open invoices from Excel; bank statement from OneDrive; OCR extraction.                                                                                                                     |
| Sticky Note3                   | Sticky Note                     | Documentation: AI Processing Summary               | —                              | —                                          | AI matches transactions to invoices with confidence scores, unmatched classification, reconciliation summary.                                                                               |
| Sticky Note4                   | Sticky Note                     | Documentation: Post-Processing and Output          | —                              | —                                          | Parses AI output into detailed reconciliation table for Accounts Receivable specialists.                                                                                                    |
| Sticky Note5                   | Sticky Note                     | Documentation: Possible Enhancements                | —                              | —                                          | Suggestions: connect to Snowflake/Databricks for invoices; direct bank feeds; ERP posting of matched invoices.                                                                               |

---

# 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Node Type: Manual Trigger  
   - Name: `When clicking ‘Execute workflow’`  
   - No parameters required  
   - This node starts the workflow when manually triggered.

2. **Create Microsoft Excel Node for Invoice Data**  
   - Node Type: Microsoft Excel  
   - Name: `Get Invoice Data`  
   - Operation: `Get Rows`  
   - Workbook: Select or specify the Excel file containing open invoices on OneDrive (requires OneDrive Microsoft OAuth2 credentials).  
   - Worksheet: Select the relevant worksheet containing invoice data.  
   - Table: Specify the table or range with invoice rows.  
   - Return All Rows: Enabled  
   - Connect output from Manual Trigger node.

3. **Create JavaScript Code Node for Invoice Data Transformation**  
   - Node Type: Code  
   - Name: `Code in JavaScript`  
   - Language: JavaScript  
   - Purpose: Transform Excel rows into structured ledger entries.  
   - Code: Map rows extracting customer name, invoice number, due date, amount (converted to number), and create JSON array property `erpLedger`.  
   - Connect input from `Get Invoice Data`.

4. **Create Microsoft OneDrive Node to Get Bank Statement Metadata**  
   - Node Type: Microsoft OneDrive  
   - Name: `Get Bank Statement`  
   - Operation: `Get`  
   - File ID: Specify the OneDrive file ID for the daily bank statement file.  
   - Connect input from `Code in JavaScript`.

5. **Create Microsoft OneDrive Node to Download Bank Statement File**  
   - Node Type: Microsoft OneDrive  
   - Name: `Extract the Data from Unstructured File`  
   - Operation: `Download`  
   - Binary Property Name: `Data` (name the binary payload property)  
   - File ID: Use expression to get file ID from previous node output (`={{ $json.id }}`)  
   - Connect input from `Get Bank Statement`.

6. **Create Mistral AI Node for OCR Extraction**  
   - Node Type: Mistral AI  
   - Name: `Extract text`  
   - Binary Property: `Data` (input binary from downloaded bank statement)  
   - Batch: Disabled  
   - Credentials: Configure with valid Mistral Cloud API key  
   - Connect input from `Extract the Data from Unstructured File`.

7. **Create Langchain Agent Node for AI Reconciliation**  
   - Node Type: Langchain Agent  
   - Name: `Process the Invoice Vs Bank Statement Data`  
   - Prompt: Define detailed instruction including input of bank text and ERP ledger JSON, tasks to parse, match, classify, score, summarize, constraints for JSON-only output, top-3 candidate limit, confidence threshold 0.6  
   - Input Variables:  
     - Bank transactions raw text from `Extract text` node output property `extractedText`  
     - ERP ledger JSON stringified from `Code in JavaScript` node output property `erpLedger`  
   - Output Parser: Enabled (to parse JSON output)  
   - Connect input from `Extract text`.

8. **Create OpenAI Chat Model Node**  
   - Node Type: OpenAI Chat (GPT-4.1-mini) via Langchain integration  
   - Name: `OpenAI Chat Model1`  
   - Model: `gpt-4.1-mini`  
   - Temperature: 0 (for deterministic output)  
   - Credentials: Configure with OpenAI API key  
   - Connect input from `Process the Invoice Vs Bank Statement Data` (AI Language Model input).

9. **Connect OpenAI Chat Model output back to Langchain Agent input**  
   - Ensures AI model outputs feed back into the agent node.

10. **Create JavaScript Code Node for Post-Processing AI Output**  
    - Node Type: Code  
    - Name: `Get Transaction, Matches, Summary`  
    - Purpose: Parse AI JSON output string, split into transactions, matches, and summary; build reconciliation rows with fields for date, description, amounts, invoice numbers, match status, confidence, and reason.  
    - Connect input from `Process the Invoice Vs Bank Statement Data`.

11. **Add Sticky Note nodes as needed for documentation**  
    - Create several Sticky Note nodes to document problem statement, value, input summary, AI processing, post-processing, and possible enhancements.  
    - Place notes logically near their respective functional blocks for clarity.

**Credential Setup:**  
- Microsoft Excel OAuth2 (with access to OneDrive Excel files)  
- Microsoft OneDrive OAuth2 (access to bank statement files)  
- Mistral Cloud API key for OCR service  
- OpenAI API key for GPT-4 model  

**Default values and constraints:**  
- Batch processing disabled on OCR extraction  
- AI model temperature set to 0 for deterministic results  
- Confidence threshold of 0.6 for matches in AI prompt constraints  
- Top 3 matching candidates per transaction limited  

**Sub-workflows:**  
- No sub-workflows invoked; all logic contained in main workflow.

---

# 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                             | Context or Link                                                                                                     |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| Cash reconciliation is one of the most time-consuming and error-prone processes for Accounts Receivable. Challenges include volume, complexity, accuracy and speed.                                                                       | Problem statement sticky note                                                                                       |
| The workflow saves time, improves cash flow visibility, reduces errors, and scales to daily volumes without extra staff.                                                                                                               | Value sticky note                                                                                                   |
| Inputs include open invoices loaded from Excel, daily bank statement retrieved from OneDrive, with OCR extracting transaction data.                                                                                                   | Input summary sticky note                                                                                           |
| AI processing uses GPT-4 chat model to parse transactions, match invoices, score confidence, classify unmatched items, and deliver reconciliation summary metrics.                                                                       | AI processing sticky note                                                                                           |
| Post-processing node parses AI JSON output into a detailed reconciliation table for AR specialists, showing match status and confidence.                                                                                                | Post-processing sticky note                                                                                         |
| Possible future enhancements include: connecting invoice data from Snowflake or Databricks, bank statements from direct bank APIs, and posting matched invoices back into ERP systems to update cash flow.                               | Possible enhancements sticky note                                                                                   |
| For further details on Langchain integration in n8n and AI prompt configuration, consult the n8n documentation and Langchain resources.                                                                                                | n8n docs and Langchain official sites                                                                                |
| The workflow requires valid API keys and OAuth2 credentials for Microsoft services, Mistral OCR, and OpenAI. Proper permission scopes must be granted for file access and AI calls.                                                      | Credential setup notes                                                                                               |

---

**Disclaimer:**  
The text provided is extracted exclusively from an automated workflow created with n8n, a workflow automation tool. This processing strictly adheres to prevailing content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.

---