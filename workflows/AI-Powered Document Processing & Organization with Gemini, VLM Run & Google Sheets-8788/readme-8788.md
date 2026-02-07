AI-Powered Document Processing & Organization with Gemini, VLM Run & Google Sheets

https://n8nworkflows.xyz/workflows/ai-powered-document-processing---organization-with-gemini--vlm-run---google-sheets-8788


# AI-Powered Document Processing & Organization with Gemini, VLM Run & Google Sheets

### 1. Workflow Overview

This workflow automates document processing and organization by leveraging AI-powered extraction and dynamic storage in Google Sheets. It is designed for scenarios involving various document types—such as receipts, resumes, healthcare claims, physician orders, and construction blueprints—uploaded to a Google Drive folder. The workflow automatically detects new files, identifies the document type using Google Gemini, extracts structured data using VLM Run’s agent, and dynamically appends the extracted data to appropriate Google Sheets based on document type mappings managed by an AI agent.

**Logical Blocks:**

- **1.1 Input Reception & Download:** Watches a specific Google Drive folder for new files and downloads them for processing.
- **1.2 Document Type Classification:** Uses Google Gemini AI to classify the uploaded document’s type.
- **1.3 Data Extraction:** Executes a VLM Run agent on the file to extract structured OCR data and layout-aware fields.
- **1.4 Data Reception Webhook:** Receives the extracted data asynchronously from the VLM Run agent.
- **1.5 Intelligent Data Storage:** An AI Agent dynamically determines the target Google Sheet based on document type, ensures headers exist, and appends new rows accordingly.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Download

- **Overview:**  
Monitors a dedicated Google Drive folder for new documents (receipts, images, PDFs), triggering the workflow upon new file creation. It downloads the detected file for further AI processing.

- **Nodes Involved:**  
  - Monitor Uploads (Google Drive Trigger)  
  - Download File (Google Drive)  

- **Node Details:**  

  - **Monitor Uploads**  
    - *Type:* Google Drive Trigger  
    - *Role:* Watches a specific Google Drive folder (ID: `1E8rvLEWKguorMT36yCD1jY78G0u8g6g7`) for new file uploads every minute.  
    - *Input:* Monitors folder events, triggers on new file creation.  
    - *Output:* Provides metadata of the newly uploaded file including file ID.  
    - *Failure Cases:* API rate limits, folder permissions, or credential issues may prevent trigger activation.

  - **Download File**  
    - *Type:* Google Drive node (download operation)  
    - *Role:* Downloads the file identified by `Monitor Uploads` node (`fileId` from newly uploaded file) as binary data property `data`.  
    - *Input:* File ID from trigger node.  
    - *Output:* Binary file content for AI processing.  
    - *Failure Cases:* File not found, permission errors, download timeouts.

---

#### 2.2 Document Type Classification

- **Overview:**  
Uses Google Gemini AI to analyze the downloaded document and classify its type (e.g., receipt, resume, claim). This classification informs downstream extraction and storage logic.

- **Nodes Involved:**  
  - Check Document Type (Google Gemini)  
  - Download File2 (Google Drive)  

- **Node Details:**  

  - **Check Document Type**  
    - *Type:* Google Gemini AI (Google PaLM API)  
    - *Role:* Receives document binary content, analyzes text/layout, returns document type as a simple string.  
    - *Input:* Binary data from `Download File`.  
    - *Output:* JSON containing detected document type.  
    - *Config:* Model `models/gemini-2.5-flash` selected.  
    - *Failure Cases:* API quota exceeded, unrecognized document, format errors.

  - **Download File2**  
    - *Type:* Google Drive node (download)  
    - *Role:* Downloads the same file again (using file ID from `Monitor Uploads`) but places binary data in `data2` property for subsequent VLM Run extraction.  
    - *Input:* File ID from trigger.  
    - *Output:* Binary content under `data2`.  
    - *Note:* Separate download ensures compatibility with VLM Run node input.  
    - *Failure Cases:* Same as Download File node.

---

#### 2.3 Data Extraction

- **Overview:**  
Runs the VLM Run Execute Agent to perform OCR, layout parsing, and structured data extraction from the binary document. This step produces JSON with extracted fields keyed by document type schema.

- **Nodes Involved:**  
  - VLM Run for Extraction  

- **Node Details:**  

  - **VLM Run for Extraction**  
    - *Type:* VLM Run node (`executeAgent` operation)  
    - *Role:* Sends the downloaded file (`data2` binary) to VLM Run with a prompt instructing to extract data according to the document type detected by Gemini.  
    - *Input:* Binary data from `Download File2`.  
    - *Output:* JSON with structured extracted data.  
    - *Config:*  
      - `agentPrompt` dynamically references content text from Gemini classification.  
      - Uses VLM Run API credentials.  
    - *Failure Cases:* Agent timeout, API errors, unsupported file formats, corrupted files.

---

#### 2.4 Data Reception Webhook

- **Overview:**  
Receives the asynchronous HTTP POST callback from the VLM Run agent containing the extracted structured data.

- **Nodes Involved:**  
  - Receives Extracted Data (Webhook)  

- **Node Details:**  

  - **Receives Extracted Data**  
    - *Type:* Webhook (HTTP POST endpoint)  
    - *Role:* Accepts the VLM Run agent’s JSON response of extracted data to feed into the AI agent for storage logic.  
    - *Input:* JSON payload from VLM Run callback.  
    - *Output:* Triggers the AI Agent block.  
    - *Failure Cases:* Webhook misconfiguration, network failures, security restrictions.

---

#### 2.5 Intelligent Data Storage

- **Overview:**  
The AI Agent processes the extracted JSON data, queries a master Google Sheet index to find the correct target sheet for the document type, checks or creates headers if missing, and appends extracted data rows. If the document type is unknown, it logs a new entry with empty spreadsheet ID.

- **Nodes Involved:**  
  - AI Agent for Storing Dynamically (LangChain Agent)  
  - Get row(s) from sheets (Google Sheets)  
  - Append row (HTTP Request to Google Sheets API)  
  - OpenAI Chat Model (used by AI Agent internally)  

- **Node Details:**  

  - **AI Agent for Storing Dynamically**  
    - *Type:* LangChain Agent node  
    - *Role:* Orchestrates logic based on extracted JSON data:  
      - Analyzes document type  
      - Searches master index sheet (`1-e3vUMW_xJ8Gqj7Ifp7hlESl726tnHaqqFf9DYc_1kE`) for matching document type row  
      - Fetches target spreadsheet ID if found  
      - Uses `Get row(s) from sheets` to check headers in target sheet  
      - Invokes `Append row` HTTP node to add headers if missing and then append data rows accordingly  
      - If no matching document type, appends a new general row with document name and empty ID  
    - *Inputs:* JSON from webhook node `Receives Extracted Data`  
    - *Outputs:* Triggers Google Sheets nodes to perform read/append operations  
    - *Config:*  
      - Detailed system prompt controls mapping logic for multiple document types with exact JSON formats and column mappings  
      - Max 10 iterations for internal agent processing  
    - *Failure Cases:* AI prompt errors, API failures, JSON parsing problems, sheet access issues.

  - **Get row(s) from sheets**  
    - *Type:* Google Sheets Tool node (read rows)  
    - *Role:* Fetches existing header rows from the target sheet to verify column structure before appending data.  
    - *Input:* Spreadsheet ID dynamically passed from AI Agent.  
    - *Output:* Sheet rows for header verification.  
    - *Failure Cases:* Sheet not found, permission errors.

  - **Append row**  
    - *Type:* HTTP Request node (Google Sheets API v4)  
    - *Role:* Appends rows to the target Google Sheet via Sheets API: either headers or data rows.  
    - *Input:* Dynamic URL and JSON body constructed by AI Agent.  
    - *Config:*  
      - Uses `valueInputOption=RAW` and `insertDataOption=INSERT_ROWS` query params  
      - Content-Type `application/json` header  
    - *Failure Cases:* API quota, malformed body, authentication failure.

  - **OpenAI Chat Model**  
    - *Type:* LangChain OpenAI Chat node  
    - *Role:* Used internally by AI Agent for natural language understanding and decision making.  
    - *Config:* Model `gpt-4.1`.  
    - *Failure Cases:* API limits, network issues.

---

### 3. Summary Table

| Node Name                   | Node Type                       | Functional Role                              | Input Node(s)          | Output Node(s)                   | Sticky Note                                                                                                                                |
|-----------------------------|--------------------------------|----------------------------------------------|------------------------|---------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| 🧾 Workflow Overview        | Sticky Note                    | Overview description of entire workflow     |                        |                                 | ## 🧾 AI Data Extraction Workflow Uploads land in Google Drive → Gemini labels doc type → VLM Run extracts structured fields...            |
| 📁 Input Processing Documentation | Sticky Note                    | Description of input monitoring and formats |                        |                                 | ## 📁 Input Processing Monitors & downloads receipt files from Google Drive...                                                              |
| 🤖 AI Extraction Documentation | Sticky Note                    | Description of AI extraction capabilities   |                        |                                 | ## 🤖 VLM Run Execute Agent Uses Gemini to detect document type and VLM Run Execute Agent node to extract structured data...                 |
| 📊 Storage Documentation     | Sticky Note                    | Description of data storage logic            |                        |                                 | ## 📊 Data Storage Structures and stores extracted data in Google Sheets according to document type automatically...                          |
| Monitor Uploads              | Google Drive Trigger           | Watches Drive folder for new files            |                        | Download File                   | Monitors Google Drive folder for new receipt uploads and triggers processing automatically.                                                  |
| Download File               | Google Drive                   | Downloads file for AI processing              | Monitor Uploads         | Check Document Type             | Downloads receipt files from Google Drive for AI processing.                                                                                |
| Check Document Type         | Google Gemini AI               | Classifies document type from binary input   | Download File           | Download File2                  |                                                                                                                                             |
| Download File2              | Google Drive                   | Downloads file again for VLM Run extraction   | Check Document Type     | VLM Run for Extraction          | Downloads receipt files from Google Drive for AI processing.                                                                                |
| VLM Run for Extraction      | VLM Run Agent                 | Extracts structured data using OCR and layout| Download File2          |                                 |                                                                                                                                             |
| Receives Extracted Data     | Webhook                       | Receives extracted JSON data from VLM Run    |                         | AI Agent for Storing Dynamically|                                                                                                                                             |
| AI Agent for Storing Dynamically | LangChain Agent               | AI-driven logic to map, verify, and store data| Receives Extracted Data | Get row(s) from sheets, Append row|                                                                                                                                             |
| Get row(s) from sheets      | Google Sheets Tool             | Reads header rows from target sheet           | AI Agent for Storing Dynamically | AI Agent for Storing Dynamically |                                                                                                                                             |
| Append row                 | HTTP Request (Google Sheets API) | Appends headers or data rows to Google Sheets | AI Agent for Storing Dynamically | AI Agent for Storing Dynamically |                                                                                                                                             |
| OpenAI Chat Model           | LangChain OpenAI Chat          | Provides language model support for AI Agent |                         | AI Agent for Storing Dynamically |                                                                                                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "Monitor Uploads" node**  
   - Type: Google Drive Trigger  
   - Configuration: Trigger on file creation in folder ID `1E8rvLEWKguorMT36yCD1jY78G0u8g6g7`  
   - Poll interval: Every minute  
   - Credentials: Google Drive OAuth2 with access to folder

2. **Create "Download File" node**  
   - Type: Google Drive  
   - Operation: Download file  
   - File ID: `={{ $json.id }}` from trigger node  
   - Binary Property Name: `data`  
   - Credentials: Same Google Drive OAuth2

3. **Create "Check Document Type" node**  
   - Type: Google Gemini (Google PaLM API)  
   - Input: Binary from `Download File` node (`data`)  
   - Model ID: `models/gemini-2.5-flash`  
   - Prompt: "analyze the document and reply the document type only"  
   - Credentials: Google Gemini API OAuth2

4. **Create "Download File2" node**  
   - Type: Google Drive  
   - Operation: Download file  
   - File ID: `={{ $('Monitor Uploads').item.json.id }}`  
   - Binary Property Name: `data2`  
   - Credentials: Google Drive OAuth2

5. **Create "VLM Run for Extraction" node**  
   - Type: VLM Run Execute Agent  
   - File Input: Binary data `data2` from `Download File2`  
   - Agent Prompt: `=check the {{ $json.content.parts[0].text }} document and extract data according to the document type.`  
   - Credentials: VLM Run API credentials

6. **Create "Receives Extracted Data" node**  
   - Type: Webhook (HTTP POST)  
   - Path: `auto` (or custom)  
   - This node receives the asynchronous callback from VLM Run agent  
   - No credentials needed but ensure webhook URL is publicly accessible

7. **Create "AI Agent for Storing Dynamically" node**  
   - Type: LangChain Agent  
   - Input: JSON from `Receives Extracted Data` webhook body  
   - System Prompt: Detailed instructions for:  
     - Searching master index Google Sheet (ID: `1-e3vUMW_xJ8Gqj7Ifp7hlESl726tnHaqqFf9DYc_1kE`) for document type  
     - Using `Get row(s) from sheets` node to read headers  
     - Using `Append row` HTTP Request node to add headers if missing, then append data rows  
     - Handling unknown document types by appending general rows with empty spreadsheet IDs  
   - Max Iterations: 10  
   - Use OpenAI Chat Model node internally with `gpt-4.1` model  
   - Credentials: OpenAI API

8. **Create "Get row(s) from sheets" node**  
   - Type: Google Sheets Tool (read rows)  
   - Document ID: dynamically provided by AI Agent (spreadsheet ID found in index sheet)  
   - Sheet Name: `Sheet1` (or as per structure)  
   - Credentials: Google Sheets OAuth2

9. **Create "Append row" node**  
   - Type: HTTP Request Node  
   - Method: POST  
   - URL: Constructed dynamically by AI Agent, e.g.  
     `https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/Sheet1!A:Z:append`  
   - Headers: `Content-Type: application/json`  
   - Query Parameters:  
     - `valueInputOption=RAW`  
     - `insertDataOption=INSERT_ROWS`  
     - `includeValuesInResponse=true`  
   - Body: JSON with `majorDimension: ROWS` and `values` as an array of arrays containing either header keys or values  
   - Credentials: Google Sheets OAuth2

10. **Connect nodes in sequence:**  
    - Monitor Uploads → Download File → Check Document Type → Download File2 → VLM Run for Extraction → Receives Extracted Data → AI Agent for Storing Dynamically → (parallel) Get row(s) from sheets & Append row (triggered by AI Agent)  
    - OpenAI Chat Model node configured to be used internally by AI Agent node

---

### 5. General Notes & Resources

| Note Content                                                                                                                         | Context or Link                                                                                           |
|--------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| Workflow supports dynamic mapping of document types to sheets via editable prompt, enabling easy expansion to new document schemas. | Workflow Overview sticky note                                                                             |
| Supported document types include receipts, resumes, claims, physician orders, and construction blueprints with custom schemas.       | Storage Documentation sticky note                                                                         |
| Input files can be images (JPG, PNG, WEBP), PDFs, mobile photos, or scanned documents.                                                | Input Processing Documentation sticky note                                                                |
| VLM Run agent performs OCR with layout parsing to provide high precision structured extraction, even on poor quality images.         | AI Extraction Documentation sticky note                                                                   |
| AI Agent uses natural language and structured prompts to manage sheet header validation, appending data, and handling missing types. | AI Agent for Storing Dynamically node system prompt (detailed in node config)                              |
| Google Sheets API v4 is used directly via HTTP request node for appending rows, allowing flexible schema updates via prompt logic.   | Append row node configuration                                                                              |
| Ensure all OAuth2 credentials for Google Drive, Google Sheets, Google Gemini (PaLM), OpenAI, and VLM Run are properly set and scoped. | Credential configuration notes                                                                             |

---

**Disclaimer:**  
The provided content originates solely from an automated n8n workflow designed to comply with applicable content policies and does not contain illegal or protected material. All data processed is legal and publicly accessible.