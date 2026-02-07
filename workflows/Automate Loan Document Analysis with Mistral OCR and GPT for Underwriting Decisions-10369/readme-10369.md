Automate Loan Document Analysis with Mistral OCR and GPT for Underwriting Decisions

https://n8nworkflows.xyz/workflows/automate-loan-document-analysis-with-mistral-ocr-and-gpt-for-underwriting-decisions-10369


# Automate Loan Document Analysis with Mistral OCR and GPT for Underwriting Decisions

### 1. Workflow Overview

This workflow automates the processing and underwriting analysis of loan documents stored in OneDrive folders. It targets mortgage underwriters who receive heterogeneous borrower documentation (IDs, paystubs, bank statements, utility bills, tax forms) in mixed formats and naming styles. The workflow extracts text from scanned files using OCR, classifies documents via filename and content rules, aggregates data per borrower, and applies an AI agent to produce a detailed underwriting decision report.

The logical structure of the workflow is divided into these blocks:

- **1.1 Input Reception and File Retrieval:** Trigger workflow → search OneDrive for target folder → list files in folder  
- **1.2 Per-File Processing Loop:** For each file → download file → OCR extract text → classify document type  
- **1.3 Data Aggregation:** Combine classified documents into a single borrower data payload  
- **1.4 AI Underwriting Analysis:** Pass aggregated data to an AI agent with a detailed underwriting prompt → generate underwriting summary and decision  

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and File Retrieval

**Overview:**  
Starts workflow manually; fetches the OneDrive folder containing borrower documents; lists all files inside for processing.

**Nodes Involved:**  
- When clicking ‘Execute workflow’ (Manual Trigger)  
- Search a folder (Microsoft OneDrive)  
- Get items in a folder (Microsoft OneDrive)

**Node Details:**

- **When clicking ‘Execute workflow’**  
  - Type: Manual Trigger  
  - Role: Entry point for manual or test runs, starting the workflow  
  - Inputs: None  
  - Outputs: Triggers next node (Search a folder)  
  - Edge Cases: None; manual only  
  - Notes: Used for local testing and manual runs

- **Search a folder**  
  - Type: Microsoft OneDrive Node (search folder operation)  
  - Role: Finds the OneDrive folder by name where borrower documents are stored  
  - Parameters: Folder name to search (replace `<Your Folder Name>`)  
  - Credentials: Microsoft OneDrive OAuth2  
  - Input: Trigger node  
  - Output: Folder metadata including folder ID  
  - Edge Cases: Folder not found (should handle gracefully)  
  - Notes: Outputs folder ID for listing files

- **Get items in a folder**  
  - Type: Microsoft OneDrive Node (list folder contents)  
  - Role: Lists all files inside the folder identified by folder ID  
  - Parameters: `folderId` — dynamically set from Search a folder output  
  - Credentials: Microsoft OneDrive OAuth2  
  - Input: Folder info from Search a folder  
  - Output: List of file metadata items for next processing loop  
  - Edge Cases: Empty folder, permission errors

---

#### 2.2 Per-File Processing Loop

**Overview:**  
Loops over each file found; downloads the file; extracts text via OCR; classifies the document type based on filename and content.

**Nodes Involved:**  
- Loop Over Items (SplitInBatches) [disabled in JSON but noted in sticky notes]  
- Download a file (Microsoft OneDrive)  
- Extract text (Mistral AI OCR)  
- Classify the File (Code)

**Node Details:**

- **Loop Over Items**  
  - Type: SplitInBatches (loop)  
  - Role: Iterates over each file metadata item to process sequentially or in batches  
  - Parameters: Batch size (not specified here)  
  - Input: List of files from Get items in a folder  
  - Output: Single file item per iteration to Download a file  
  - Status: Disabled in JSON but described in sticky notes as central to per-file processing  
  - Edge Cases: Large folder sizes could impact performance or cost

- **Download a file**  
  - Type: Microsoft OneDrive Node (download file)  
  - Role: Downloads the binary content of the current file for OCR processing  
  - Parameters: File ID dynamically set from current file in loop  
  - Credentials: Microsoft OneDrive OAuth2  
  - Input: Current file metadata from loop  
  - Output: File binary + metadata  
  - Edge Cases: File not found, permission errors, download failures

- **Extract text**  
  - Type: Mistral AI Node (OCR service)  
  - Role: Extracts text content from the downloaded file using OCR  
  - Parameters: Default OCR options (none customized)  
  - Credentials: Mistral Cloud API key  
  - Input: Binary file from Download a file  
  - Output: Extracted text JSON field (`extractedText`)  
  - Edge Cases: OCR failure due to poor scan quality, file format unsupported, partial/incomplete text extraction

- **Classify the File**  
  - Type: Code (JavaScript) Node  
  - Role: Uses filename and OCR text to classify the document into known types (Passport, Paystub, Bank Statement, etc.) or Unknown  
  - Configuration:  
    - Priority 1: Filename-based rules (e.g., "passport", "mortgage", "t4")  
    - Priority 2: OCR text-based fallback rules (e.g., "gross pay", "bank of montreal")  
  - Input: Extracted text from OCR and filename from Download node  
  - Output: JSON with FileName, DocumentType, ExtractedText  
  - Edge Cases: Ambiguous or missing clues lead to "Unknown" classification; must be easily adjustable for new document types  
  - Notes: Key to building structured document metadata for underwriting

---

#### 2.3 Data Aggregation

**Overview:**  
Aggregates all classified documents into a single payload representing the borrower and their documents, preparing for AI underwriting analysis.

**Nodes Involved:**  
- Combine the Data (Code)

**Node Details:**

- **Combine the Data**  
  - Type: Code (JavaScript) Node  
  - Role: Collects all document objects from the loop output into an array; adds borrower name (static "Kenneth Smith" here, replaceable dynamically)  
  - Input: All items from the Loop Over Items node’s "Done" output  
  - Output: Single JSON object with BorrowerName and Documents array  
  - Edge Cases: No documents found results in empty Documents array; borrower name hardcoded, so requires dynamic injection in real use  
  - Notes: Forms the input payload for the AI underwriting agent

---

#### 2.4 AI Underwriting Analysis

**Overview:**  
Runs an AI agent (LangChain n8n node) that receives the borrower’s document data array and executes a detailed underwriting prompt to generate a structured underwriting analysis and decision.

**Nodes Involved:**  
- AI Agent (LangChain Agent)  
- OpenAI Chat Model (used internally by AI Agent)

**Node Details:**

- **AI Agent**  
  - Type: LangChain Agent Node (`@n8n/n8n-nodes-langchain.agent`)  
  - Role: Orchestrates the use of the OpenAI Chat Model to analyze documents and produce underwriting report  
  - Parameters:  
    - Prompt includes system message defining a senior mortgage underwriter role and detailed analysis steps: identity verification, employment/income verification, asset/liability review, property/loan analysis, document consistency check, and final decision.  
    - Input text includes borrower documents JSON stringified.  
  - Input: Aggregated borrower data from Combine the Data node  
  - Output: Markdown-formatted underwriting summary with a professional decision and rationale  
  - Dependencies: Uses OpenAI Chat Model node as language model backend  
  - Credentials: OpenAI API key  
  - Edge Cases: AI model token limit, prompt truncation, ambiguous input data, API call failures, costs associated with LLM usage

- **OpenAI Chat Model**  
  - Type: LangChain OpenAI Chat Model Node (`@n8n/n8n-nodes-langchain.lmChatOpenAi`)  
  - Role: Provides the language model (LLM) backend to the AI Agent  
  - Parameters: Model name placeholder `<Your LLM Model Name>` (e.g., "gpt-4.1-mini")  
  - Credentials: OpenAI API Key  
  - Input: Receives prompt from AI Agent node  
  - Output: Language model completions passed back to AI Agent  
  - Edge Cases: API key invalid, rate limits, network errors

---

### 3. Summary Table

| Node Name                  | Node Type                         | Functional Role                                  | Input Node(s)            | Output Node(s)              | Sticky Note                                                                                                                      |
|----------------------------|----------------------------------|-------------------------------------------------|--------------------------|-----------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                   | Entry trigger for manual/test run                | None                     | Search a folder             | Entry trigger used for local testing and manual runs; it simply starts the pipeline and hands off to the OneDrive folder search.|
| Search a folder            | Microsoft OneDrive (search folder) | Finds borrower documents folder in OneDrive     | When clicking ‘Execute workflow’ | Get items in a folder       | Finds the target borrower documents container in OneDrive and outputs the folder id that downstream nodes use.                  |
| Get items in a folder       | Microsoft OneDrive (list folder)  | Lists files inside found folder                   | Search a folder           | Loop Over Items             | Finds the target borrower documents container in OneDrive and outputs the folder id that downstream nodes use, then lists files.|
| Loop Over Items             | SplitInBatches (loop) [disabled] | Iterates over files to process individually      | Get items in a folder     | Combine the Data, Download a file | Drives per-file processing: downloads, OCR, classification, aggregates results.                                                  |
| Download a file             | Microsoft OneDrive (download)     | Downloads file binary for OCR                     | Loop Over Items           | Extract text                | Fetches the actual file binary (plus metadata) for the current item so OCR can read its contents.                                |
| Extract text               | Mistral AI OCR                   | Extracts text from scanned file                   | Download a file           | Classify the File           | Runs OCR on the downloaded file and emits the extracted text that classification and later analysis depend on.                  |
| Classify the File           | Code (JavaScript)                 | Classifies document type using filename and text | Extract text              | Loop Over Items             | Uses filename clues and OCR text to assign document type; forwards compact record per file.                                      |
| Combine the Data            | Code (JavaScript)                 | Aggregates all file records into borrower payload| Loop Over Items           | AI Agent                   | Aggregates all per-file records into a single borrower payload ready for underwriting analysis.                                 |
| AI Agent                   | LangChain Agent Node              | Performs underwriting analysis and decision      | Combine the Data          | None                       | Consumes consolidated documents, applies underwriting prompt, produces markdown decision summary.                              |
| OpenAI Chat Model          | LangChain OpenAI Chat Model       | Provides LLM backend for AI Agent                 | AI Agent (as language model) | AI Agent                   | Provides the language model (gpt-4.1-mini) that the AI Agent uses to generate the underwriting summary and decision.           |
| Sticky Note                | Sticky Note                      | Informative comments                              | None                     | None                       | **Solution:** Trigger run, grab files from OneDrive, loop, OCR, classify, aggregate, then LLM analyze and decide.               |
| Sticky Note1               | Sticky Note                      | Informative comments                              | None                     | None                       | **Problem Statement:** Manual document handling is slow, error-prone, and inconsistent in underwriting.                         |
| Sticky Note2               | Sticky Note                      | Informative comments                              | None                     | None                       | ***Constraints***: Variable folder naming, OCR quality issues, classification transparency, PII protection, cost control.       |
| Sticky Note3               | Sticky Note                      | Informative comments                              | None                     | None                       | Entry trigger used for local testing and manual runs; it simply starts the pipeline and hands off to the OneDrive folder search.|
| Sticky Note4               | Sticky Note                      | Informative comments                              | None                     | None                       | Finds target borrower folder and lists files inside for processing.                                                             |
| Sticky Note5               | Sticky Note                      | Informative comments                              | None                     | None                       | Loop over files: drive download, OCR, classification, and aggregate results.                                                    |
| Sticky Note6               | Sticky Note                      | Informative comments                              | None                     | None                       | Combines file records and sends to AI Agent for detailed underwriting decision.                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger node**  
   - Type: Manual Trigger  
   - Purpose: Start workflow manually for testing or execution

2. **Create Microsoft OneDrive node "Search a folder"**  
   - Operation: Search folder  
   - Parameter: Set query to the target folder name containing borrower documents (replace `<Your Folder Name>`)  
   - Credentials: Configure Microsoft OneDrive OAuth2 credentials with appropriate API key  
   - Connect Manual Trigger node output to this node input

3. **Create Microsoft OneDrive node "Get items in a folder"**  
   - Operation: List folder contents  
   - Parameter: `folderId` set dynamically from `Search a folder` node output (`={{ $json.id }}`)  
   - Credentials: Use same Microsoft OneDrive OAuth2 credentials  
   - Connect "Search a folder" output to this node input

4. **Create SplitInBatches node "Loop Over Items"**  
   - Purpose: Loop through each file metadata item to process individually  
   - Parameters: Leave default or set appropriate batch size for performance  
   - Connect "Get items in a folder" output to this node input

5. **Create Microsoft OneDrive node "Download a file"**  
   - Operation: Download file  
   - Parameter: `fileId` set dynamically from current loop item (`={{ $('Loop Over Items').item.json.id }}` or in practice from the current batch item)  
   - Credentials: Microsoft OneDrive OAuth2 same as before  
   - Connect "Loop Over Items" output to this node input

6. **Create Mistral AI node "Extract text"**  
   - Operation: OCR extraction (default options)  
   - Credentials: Mistral Cloud API key (configure with your OCR API key)  
   - Connect "Download a file" output to this node input

7. **Create Code node "Classify the File"**  
   - Purpose: Classify document type using filename and OCR text  
   - Code: Implement JavaScript logic that:  
     - Reads filename (from Download node)  
     - Reads extracted OCR text (from Extract text node)  
     - Applies filename-based and text-based rules to assign a document type string (Passport, Driving License, Mortgage Application, Proof of Funds Letter, Employee Pay Statement, T4 Statement, Electricity Bill, Internet Bill, Account Statement, Bank Statement, or Unknown)  
   - Connect "Extract text" output to this node input

8. **Connect "Classify the File" output back to "Loop Over Items" input**  
   - This looping structure continues until all files are processed

9. **Create Code node "Combine the Data"**  
   - Purpose: Aggregate all classified documents into one JSON object for the borrower  
   - Code: Collect all items, build an array of documents with FileName, DocumentType, ExtractedText, add `BorrowerName` (hardcoded or dynamic)  
   - Connect "Loop Over Items" final output (all processed items) to this node input

10. **Create LangChain Agent node "AI Agent"**  
    - Purpose: Run underwriting analysis on aggregated borrower documents  
    - Parameters:  
      - System message defines underwriting role and detailed analysis steps (identity, employment, assets, property, document consistency, decision)  
      - Text prompt includes JSON stringified documents array  
    - Credentials: OpenAI API key configured  
    - Connect "Combine the Data" output to this node input

11. **Create LangChain OpenAI Chat Model node "OpenAI Chat Model"**  
    - Purpose: Provide LLM backend for AI Agent  
    - Parameters: Select or enter your LLM model name (e.g., "gpt-4.1-mini")  
    - Credentials: OpenAI API key  
    - Connect this node as AI language model input for the AI Agent node

12. **Validate all connections**  
    - Trigger → Search a folder → Get items in folder → Loop Over Items (per file processing) → Download a file → Extract text → Classify the File → Loop Over Items continuation → Combine the Data → AI Agent → OpenAI Chat Model (language model backend)

13. **Set default parameter values and test**  
    - Replace placeholders (`<Your Folder Name>`, API keys, model names) with real values  
    - Ensure OneDrive permissions allow file access  
    - Verify Mistral OCR API key is active  
    - Confirm OpenAI API key and model availability  
    - Run manual trigger and monitor logs for errors or missing data

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                         | Context or Link                                                                                                      |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| **Solution Overview:** The workflow automates file retrieval from OneDrive, OCR extraction, classification with fallback rules, data aggregation, and AI underwriting decision generation. Includes suggestions to add filters, retries, bucketing unknown docs, logging counts/costs, and PII protection.                                                                                                   | Sticky Note near start of workflow                                                                                   |
| **Problem Statement:** Manual document handling is slow, error-prone, and inconsistent due to mixed formats and naming conventions, lacking audit trails and increasing turnaround times.                                                                                                                                                                                                             | Sticky Note1                                                                                                         |
| **Constraints:** Files in variable OneDrive folders, OCR quality varies, classification must be transparent and adjustable, PII must be protected, and operational costs must be controlled.                                                                                                                                                                                                          | Sticky Note2                                                                                                         |
| **Entry Trigger:** Manual trigger used mainly for local testing and manual workflow runs.                                                                                                                                                                                                                                                                                                            | Sticky Note3                                                                                                         |
| **Loop Over Items Disabled in Export:** The loop node is disabled in JSON but is conceptually central. When reproducing, enable and configure it properly to process all files sequentially or in batches.                                                                                                                                                                                          | Observed from JSON and sticky notes                                                                                  |
| **Underwriting AI Agent Prompt:** Detailed system message defines underwriting analysis steps and output format to ensure professional, auditable results.                                                                                                                                                                                                                                         | AI Agent node parameters                                                                                            |
| **API Credential Setup:** Ensure all API credentials (OneDrive OAuth2, Mistral OCR, OpenAI) are properly configured in n8n credentials manager before running.                                                                                                                                                                                                                                      | Across Microsoft OneDrive, Mistral AI, and LangChain/OpenAI nodes                                                  |
| **Performance & Cost Considerations:** Large folders and many pages increase OCR and LLM token costs; consider batch sizes and filtering.                                                                                                                                                                                                                                                           | Sticky Note2 and Sticky Note5                                                                                        |

---

**Disclaimer:** The provided analysis is based exclusively on the n8n workflow JSON and associated sticky notes. All data processed is assumed legal and public. The workflow adheres to current content policies and contains no illegal or protected content.