Automate Invoice Data Extraction from Google Drive to Airtable using Nanonets OCR & Command-R

https://n8nworkflows.xyz/workflows/automate-invoice-data-extraction-from-google-drive-to-airtable-using-nanonets-ocr---command-r-10405


# Automate Invoice Data Extraction from Google Drive to Airtable using Nanonets OCR & Command-R

### 1. Workflow Overview

This workflow automates the extraction of invoice data from newly uploaded files in a specific Google Drive folder, processes the files using Optical Character Recognition (OCR) and AI-based data cleaning, and finally stores the structured invoice data into Airtable. It also organizes processed files by moving them into success or failure folders to maintain a clean input folder.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Trigger:** Watches a Google Drive folder for new invoice files.
- **1.2 Batch Processing:** Handles multiple files in batches and extracts necessary metadata.
- **1.3 File Download:** Downloads the triggered invoice file from Google Drive for processing.
- **1.4 OCR Processing:** Uses an AI OCR model to extract raw text and tables from the document.
- **1.5 Data Cleaning & Structuring:** Applies an AI model to clean and strictly format the OCR output into a validated JSON schema suitable for Airtable.
- **1.6 Airtable Data Insertion:** Creates a new record in Airtable with the cleaned invoice data.
- **1.7 File Management:** Moves files to “Done” or “Failed” folders based on processing success or failure.
- **1.8 Workflow Control & Completion:** Manages flow control and signals completion of batch processing.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Trigger

- **Overview:** This block continuously monitors a specified Google Drive folder for any new files added, triggering the workflow when files appear.
- **Nodes Involved:**  
  - OCR folder (Google Drive Trigger)
- **Node Details:**  
  - **OCR folder**  
    - *Type:* Google Drive Trigger  
    - *Role:* Watches a specific Google Drive folder for newly created files.  
    - *Configuration:*  
      - Trigger event: `fileCreated`  
      - File type: All  
      - Poll frequency: Every minute  
      - Folder: Specified by ID (`1Zld3XYxC1kYYm_rMla3tuqeZsAaol9DS`)  
      - Credentials: Google Drive OAuth2 account  
    - *Inputs:* None (trigger node)  
    - *Outputs:* Triggers next node “Loop Over Items” with metadata about new files  
    - *Failure modes:* Authentication errors, folder permission issues, API rate limits  
    - *Notes:* See Sticky Note1 for setup instructions.

#### 2.2 Batch Processing

- **Overview:** Handles multiple files in batches for scalable processing and extracts file metadata for downstream processing.
- **Nodes Involved:**  
  - Loop Over Items (SplitInBatches)  
  - file name & ID (Set)
- **Node Details:**  
  - **Loop Over Items**  
    - *Type:* SplitInBatches  
    - *Role:* Processes files one by one or in configured batch sizes.  
    - *Configuration:* Default batch size (single file processing implied)  
    - *Input:* Output from Google Drive Trigger  
    - *Output:* Splits data to downstream nodes, including “file name & ID” and “Done!” node  
    - *Failure modes:* Expression errors if input is empty, batch misconfiguration  
  - **file name & ID**  
    - *Type:* Set  
    - *Role:* Extracts and sets file metadata fields (`fileId` and `orfilename`) for use in downstream nodes.  
    - *Configuration:* Uses expressions to assign `fileId` (`{{$json.id}}`) and `orfilename` (`{{$json.originalFilename}}`)  
    - *Input:* From Loop Over Items  
    - *Output:* Passes data to “Download file” node  
    - *Failure modes:* Missing fields in input JSON  

#### 2.3 File Download

- **Overview:** Downloads the actual invoice file from Google Drive for OCR processing.
- **Nodes Involved:**  
  - Download file (Google Drive)
- **Node Details:**  
  - **Download file**  
    - *Type:* Google Drive (download file)  
    - *Role:* Downloads the file binary data by file ID received from “file name & ID”.  
    - *Configuration:*  
      - File ID set dynamically from `{{$json.id}}`  
      - Binary Property Name: `data`  
      - Credentials: Google Drive OAuth2 account  
    - *Input:* From “file name & ID”  
    - *Output:* Sends binary file data to “AI Agent-OCR”  
    - *Failure modes:* File not found, permission errors, network timeouts  

#### 2.4 OCR Processing

- **Overview:** Processes the downloaded invoice file with an AI OCR model to extract raw text, tables (as HTML), and equations (LaTeX).
- **Nodes Involved:**  
  - AI Agent-OCR (LangChain Agent node)
- **Node Details:**  
  - **AI Agent-OCR**  
    - *Type:* LangChain Agent Node  
    - *Role:* Runs an AI prompt to extract full text, tables, and equations from the document binary.  
    - *Configuration:*  
      - Prompt text: Extract full text, tables as HTML, equations as LaTeX.  
      - System message: “You are a helpful assistant.”  
      - Retry on fail enabled for robustness  
      - On error: Continue with error output for downstream handling  
      - Model backend: Connected to “OpenAI Chat Model” node referencing the Nanonets OCR model  
    - *Input:* Binary file data from “Download file”  
    - *Output:* OCR raw output JSON to “Data Cleaner” or error to “Move failed”  
    - *Failure modes:* Model API errors, prompt failures, malformed outputs  
    - *Notes:* See Sticky Note2 for setup instructions.  

- **OpenAI Chat Model**  
  - *Type:* LangChain LM Chat OpenAI  
  - *Role:* Supplies the AI OCR model backend for AI Agent-OCR  
  - *Configuration:*  
    - Model: `benhaotang/Nanonets-OCR-s:F16`  
    - Response format: text  
    - Credentials: OpenAI-compatible API (can be Ollama local endpoint)  
  - *Input/Output:* Connected as AI language model input for “AI Agent-OCR”  
  - *Failure modes:* Connectivity or auth errors  

#### 2.5 Data Cleaning & Structuring

- **Overview:** Cleans the raw OCR output and restructures the data into a strict JSON schema suitable for Airtable insertion.
- **Nodes Involved:**  
  - Data Cleaner (OpenAI Node)
- **Node Details:**  
  - **Data Cleaner**  
    - *Type:* LangChain OpenAI Node  
    - *Role:* Cleans and validates extracted invoice data against a predefined JSON schema with strict rules for number formatting and missing fields.  
    - *Configuration:*  
      - Model: `command-r7b:7b-12-2024-q8_0` (Command-R model)  
      - Prompt: Expert financial data entry agent instructions with JSON output schema including InvoiceNumber, IssueDate, SupplierName, TotalAmount, Currency, Address, and LineItems array with detailed fields.  
      - On error: Continue with error output  
      - JSON output enabled for structured data  
      - Credentials: OpenAI API  
      - Input: Raw OCR text from “AI Agent-OCR” output (`{{$json.output}}`)  
    - *Output:* Cleaned JSON invoice data to “AirTable - Create a record1” or error to “Move failed”  
    - *Failure modes:* Model misinterpretation, malformed JSON output, API errors  
    - *Notes:* See Sticky Note3 for setup instructions.

#### 2.6 Airtable Data Insertion

- **Overview:** Inserts the cleaned and structured invoice data as a new record into a specified Airtable base and table.
- **Nodes Involved:**  
  - AirTable - Create a record1 (Airtable node)
- **Node Details:**  
  - **AirTable - Create a record1**  
    - *Type:* Airtable (Create Record)  
    - *Role:* Creates a record in the "Invoices" table of the specified Airtable base.  
    - *Configuration:*  
      - Base: `ocr_base` (ID: apptHu8glutmVeMb5)  
      - Table: `Invoices`  
      - Fields mapped explicitly: InvoiceNumber, IssueDate (formatted to ISO date), SupplierName, TotalAmount, Currency, Address, LineItems, FileID, FileName  
      - Typecast enabled for correct date handling  
      - Credentials: Airtable Personal Access Token  
    - *Input:* Cleaned JSON data from “Data Cleaner” and file metadata from “file name & ID”  
    - *Output:* On success, passes to “Move successful” node; on failure, triggers “Move failed”  
    - *Failure modes:* API errors, field mapping errors, data type mismatches  
    - *Notes:* See Sticky Note4 for setup instructions.

#### 2.7 File Management

- **Overview:** Moves processed files to “Done” or “Failed” folders in Google Drive to organize processed data and maintain a clean working folder.
- **Nodes Involved:**  
  - Move successful (Google Drive)  
  - Move failed (Google Drive)
- **Node Details:**  
  - **Move successful**  
    - *Type:* Google Drive (move file)  
    - *Role:* Moves processed files to “Done” folder after successful Airtable record creation.  
    - *Configuration:*  
      - File ID: taken dynamically from `$('file name & ID').first().json.fileId`  
      - Drive: “My Drive”  
      - Folder ID: `1nZDoVJjKTITGSmb8BMu09TtHX8QGUkhr` (Done folder)  
      - Credentials: Google Drive OAuth2  
    - *Input:* From “AirTable - Create a record1” success output  
    - *Output:* Loops back to “Loop Over Items” for next file processing  
    - *Failure modes:* Permissions, API errors  
  - **Move failed**  
    - *Type:* Google Drive (move file)  
    - *Role:* Moves files that failed OCR or data cleaning to “Failed” folder for manual inspection.  
    - *Configuration:*  
      - File ID: from `$('file name & ID').first().json.fileId`  
      - Drive: “My Drive”  
      - Folder ID: `1lhpEYJrR0ZpQ6yjsf_fa6Ob5X7Ms28ED` (Failed folder)  
      - Credentials: Google Drive OAuth2  
    - *Input:* From errors in “AI Agent-OCR” and “Data Cleaner” nodes  
    - *Output:* Loops back to “Loop Over Items”  
    - *Failure modes:* Same as above  
    - *Notes:* See Sticky Note5 for setup instructions.

#### 2.8 Workflow Control & Completion

- **Overview:** Signals the completion of batch processing and idles awaiting new trigger events.
- **Nodes Involved:**  
  - Done! (NoOp)
- **Node Details:**  
  - **Done!**  
    - *Type:* NoOp node  
    - *Role:* Marks the end of the processing batch loop, indicating all files in the current batch have been handled.  
    - *Input:* From “Loop Over Items” (main output)  
    - *Output:* None (workflow idles)  
    - *Notes:* See Sticky Note6 for confirmation message.

---

### 3. Summary Table

| Node Name            | Node Type                          | Functional Role                         | Input Node(s)           | Output Node(s)           | Sticky Note                                                                                                   |
|----------------------|----------------------------------|---------------------------------------|-------------------------|--------------------------|--------------------------------------------------------------------------------------------------------------|
| OCR folder           | Google Drive Trigger              | Watches Google Drive folder for new files | None                    | Loop Over Items          | See Sticky Note1: Configure new file trigger with Google Drive credentials and folder to watch.              |
| Loop Over Items       | SplitInBatches                   | Processes files in batches             | OCR folder, Move failed, Move successful | Done!, file name & ID    |                                                                                                              |
| file name & ID        | Set                              | Extracts fileId and filename metadata | Loop Over Items          | Download file            |                                                                                                              |
| Download file         | Google Drive (Download)           | Downloads actual file binary           | file name & ID           | AI Agent-OCR             |                                                                                                              |
| AI Agent-OCR          | LangChain Agent                   | Performs OCR on downloaded file        | Download file            | Data Cleaner, Move failed | See Sticky Note2: Configure OCR AI model with credentials and model `benhaotang/Nanonets-OCR-s:F16`.          |
| OpenAI Chat Model     | LangChain LM Chat OpenAI          | AI model backend for OCR node          | AI Agent-OCR (ai_languageModel) | AI Agent-OCR (ai_languageModel) |                                                                                                              |
| Data Cleaner          | LangChain OpenAI Node             | Cleans OCR output & formats JSON       | AI Agent-OCR             | AirTable - Create a record1, Move failed | See Sticky Note3: Configure Data Cleaning AI model with credentials and model `command-r7b:7b-12-2024-q8_0`.  |
| AirTable - Create a record1 | Airtable (Create Record)       | Inserts cleaned invoice data into Airtable | Data Cleaner             | Move successful          | See Sticky Note4: Configure Airtable output with duplicated base, credentials, and field mappings.           |
| Move successful       | Google Drive (Move File)          | Moves successfully processed files     | AirTable - Create a record1 | Loop Over Items          | See Sticky Note5: Configure Done folder and Google Drive credentials.                                        |
| Move failed           | Google Drive (Move File)          | Moves files that failed processing     | AI Agent-OCR, Data Cleaner | Loop Over Items          | See Sticky Note5: Configure Failed folder and Google Drive credentials.                                      |
| Done!                 | NoOp                             | Signals batch completion                | Loop Over Items          | None                     | See Sticky Note6: Signals workflow is idle awaiting next trigger.                                            |
| Sticky Note            | Sticky Note                      | Documentation and user guidance         | None                    | None                     | See all sticky notes combined for detailed instructions and setup guidance.                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Google Drive Trigger Node (“OCR folder”):**  
   - Type: Google Drive Trigger  
   - Set event to `fileCreated` for all file types.  
   - Set folder to watch by selecting the specific folder ID for incoming invoices.  
   - Authenticate with Google Drive OAuth2 credentials.  
   - Set polling interval to every minute.

2. **Create a SplitInBatches Node (“Loop Over Items”):**  
   - Connect input from “OCR folder”.  
   - Use default batch size (1 item per batch).

3. **Create a Set Node (“file name & ID”):**  
   - Connect input from “Loop Over Items”.  
   - Add two fields:  
     - `fileId` with expression `{{$json.id}}`  
     - `orfilename` with expression `{{$json.originalFilename}}`  
   - Pass through other fields unchanged.

4. **Create a Google Drive Node (“Download file”):**  
   - Connect input from “file name & ID”.  
   - Operation: Download file by ID.  
   - Set file ID dynamically with expression `{{$json.id}}`.  
   - Set binary property name to `data`.  
   - Authenticate with Google Drive OAuth2 credentials.

5. **Create a LangChain Agent Node (“AI Agent-OCR”):**  
   - Connect input from “Download file”.  
   - Set prompt to: “Extract the full text as output from the document as if you were reading it. Return the tables in html format. Return the equations in LaTeX representation.”  
   - Set system message to: “You are a helpful assistant.”  
   - Enable retry on fail and continue on error output.  
   - Configure the AI model backend to use the “OpenAI Chat Model” node.  
   - Credentials: OpenAI-compatible API (can be Ollama endpoint).

6. **Create a LangChain LM Chat OpenAI Node (“OpenAI Chat Model”):**  
   - Model: `benhaotang/Nanonets-OCR-s:F16`  
   - Response format: text  
   - Credentials: OpenAI API (or compatible Ollama API).  
   - Connect as AI model backend for “AI Agent-OCR”.

7. **Create a LangChain OpenAI Node (“Data Cleaner”):**  
   - Connect input from “AI Agent-OCR” (main output).  
   - Use model `command-r7b:7b-12-2024-q8_0` (Command-R).  
   - Set prompt as an expert financial data entry agent with strict JSON schema instructions:  
     - JSON schema includes InvoiceNumber, IssueDate, SupplierName, TotalAmount, Currency, Address, and LineItems array with specified keys.  
     - Include number formatting rules and set missing values to null.  
   - Enable JSON output.  
   - On error: continue with error output.  
   - Credentials: OpenAI API.

8. **Create an Airtable Node (“AirTable - Create a record1”):**  
   - Connect input from “Data Cleaner”.  
   - Operation: Create record.  
   - Choose Airtable base (duplicated copy of `ocr_base`) and table (`Invoices`).  
   - Map fields explicitly:  
     - FileID ← `$('file name & ID').item.json.id`  
     - Address ← cleaned JSON field Address  
     - Currency ← cleaned JSON field Currency  
     - FileName ← `$('file name & ID').item.json.name`  
     - IssueDate ← format cleaned JSON IssueDate to ISO date using DateTime library  
     - LineItems ← cleaned JSON LineItems  
     - TotalAmount ← cleaned JSON TotalAmount  
     - SupplierName ← cleaned JSON SupplierName  
     - InvoiceNumber ← cleaned JSON InvoiceNumber  
   - Enable Typecast option to convert date strings automatically.  
   - Authenticate using Airtable Personal Access Token.

9. **Create Google Drive Move File Node (“Move successful”):**  
   - Connect input from “AirTable - Create a record1” success output.  
   - Configure to move file to “Done” folder by ID.  
   - File ID from `$('file name & ID').first().json.fileId`.  
   - Authenticate with Google Drive OAuth2.

10. **Create Google Drive Move File Node (“Move failed”):**  
    - Connect inputs from “AI Agent-OCR” and “Data Cleaner” error outputs.  
    - Configure to move file to “Failed” folder by ID.  
    - File ID from `$('file name & ID').first().json.fileId`.  
    - Authenticate with Google Drive OAuth2.

11. **Connect “Move successful” and “Move failed” nodes to “Loop Over Items”**  
    - Loop back to continue processing remaining files.

12. **Create a NoOp Node (“Done!”):**  
    - Connect main output from “Loop Over Items” to signal completion of batch processing.

---

### 5. General Notes & Resources

| Note Content                                                                                                                        | Context or Link                                                                                             |
|------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| 🚀 **Welcome: OCR to Airtable Pipeline**: Automates invoice processing from Google Drive to Airtable using AI OCR and cleaning.   | Main Sticky Note with setup instructions and dataset credit ([SROIE datasetv2](https://www.kaggle.com/datasets/urbikn/sroie-datasetv2)) |
| ⚠️ **Before you start:** Duplicate Airtable base from [this link](https://airtable.com/apptHu8glutmVeMb5/shrpowsDMM5r8mj1T) and get access token. | Main Sticky Note                                                                                           |
| **AI Models (Ollama):** Pull these local models via terminal: `benhaotang/Nanonets-OCR-s:F16` for OCR and `command-r7b:7b-12-2024-q8_0` for cleaning. | Main Sticky Note instructions                                                                              |
| **Pro-tip:** You can swap the OCR model for a cloud model like GPT-4o with vision for better accuracy.                            | Sticky Note2                                                                                                |
| **Data Cleaning AI:** Prompt is optimized for complex invoices with strict JSON output.                                            | Sticky Note3                                                                                                |
| **Airtable Output:** Typecast option enabled for correct date handling.                                                            | Sticky Note4                                                                                                |
| **File Management:** Use “Done” and “Failed” folders to keep your Google Drive inbox clean.                                        | Sticky Note5                                                                                                |
| **Workflow Completion:** Workflow idles after processing all files, waiting for new input.                                         | Sticky Note6                                                                                                |

---

**Disclaimer:** The text provided is exclusively derived from an automated n8n workflow. It fully complies with current content policies and contains no illegal, offensive, or protected material. All data processed are legal and public.