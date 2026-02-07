Anonymize & Reformat CVs with Gemini AI, Google Sheets & Apps Script

https://n8nworkflows.xyz/workflows/anonymize---reformat-cvs-with-gemini-ai--google-sheets---apps-script-4708


# Anonymize & Reformat CVs with Gemini AI, Google Sheets & Apps Script

### 1. Workflow Overview

This workflow automates the anonymization and reformatting of CVs (resumes) using Google Gemini AI, Google Sheets, Google Drive, and Apps Script. It targets use cases where batches of CV PDFs need to be processed to extract relevant information, cleanse sensitive data, reformat fields, and log processed documents for tracking.

The workflow is logically divided into the following blocks:

- **1.1 Input Trigger and File Acquisition:** Detect new or updated CV files in Google Drive and retrieve the list of PDF documents to process.
- **1.2 Data Comparison and Filtering:** Compare newly found files against previously processed ones to avoid duplicates.
- **1.3 File Extraction and Batch Processing:** Extract content from each PDF file and process the CVs one by one.
- **1.4 AI Processing and Data Extraction:** Use the Google Gemini Chat Model as an AI agent to extract targeted information from the CV text.
- **1.5 Output Cleaning and Formatting:** Clean and reformat the AI output to a structured format.
- **1.6 Update Sheets and Logging:** Write the reformatted CV data back into Google Sheets and log the processing status.
- **1.7 Auxiliary and Support Nodes:** Include HTTP requests and code nodes for additional cleansing and API interactions.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Trigger and File Acquisition

- **Overview:** This block detects new or changed files in Google Drive, retrieves a list of PDF CV files, and triggers the workflow.
- **Nodes Involved:** Google Drive Trigger, Get list of pdf files, Cleans output
- **Node Details:**

  - **Google Drive Trigger**
    - *Type:* Trigger node for Google Drive changes
    - *Role:* Initiates workflow when files are added or updated in a specified Drive folder
    - *Config:* Default Google Drive OAuth2 credentials; monitors target folder for changes
    - *Inputs:* External trigger (Drive events)
    - *Outputs:* File metadata for changed files
    - *Edge Cases:* Missed trigger events if Drive API quota limits exceeded or network issues; requires valid Google OAuth credentials

  - **Get list of pdf files**
    - *Type:* HTTP Request
    - *Role:* Retrieves a list of PDF files to process (possibly via API or internal endpoint)
    - *Config:* Custom HTTP request parameters (method, URL, headers) not explicitly detailed
    - *Inputs:* Trigger from Google Drive Trigger
    - *Outputs:* Raw list of files
    - *Edge Cases:* HTTP failures, invalid response format, authentication errors

  - **Cleans output**
    - *Type:* Code node
    - *Role:* Cleans and formats the HTTP response from the file list request for further processing
    - *Config:* Custom JavaScript code to parse and sanitize file list data
    - *Inputs:* Output from Get list of pdf files
    - *Outputs:* Structured cleaned list of files
    - *Edge Cases:* Parsing errors, unexpected data structure

---

#### 2.2 Data Comparison and Filtering

- **Overview:** This block compares the newly retrieved file list against records of already processed CVs from Google Sheets, to identify new files needing processing.
- **Nodes Involved:** Read processed docs, Compare Datasets, Google Drive
- **Node Details:**

  - **Read processed docs**
    - *Type:* Google Sheets node
    - *Role:* Reads previously processed CV records from a Google Sheet
    - *Config:* Reads specified sheet/tab with processed document metadata
    - *Inputs:* Trigger outputs from Google Drive Trigger
    - *Outputs:* List of processed document identifiers
    - *Edge Cases:* Sheet access errors, permission issues, empty or malformed sheet data

  - **Compare Datasets**
    - *Type:* Compare Datasets node
    - *Role:* Compares file list vs. processed docs to identify new files
    - *Config:* Default settings to find differences between datasets
    - *Inputs:* 
      - Dataset A: Cleaned new file list (from Cleans output)
      - Dataset B: Processed docs (from Read processed docs)
    - *Outputs:* Dataset of new files to process, filtered to avoid duplicates
    - *Edge Cases:* Mismatched keys for comparison causing false positives/negatives

  - **Google Drive**
    - *Type:* Google Drive node
    - *Role:* Fetches file details for new files identified by the comparison step
    - *Config:* Retrieves file metadata and content for extraction
    - *Inputs:* Output of Compare Datasets node (new files)
    - *Outputs:* Files metadata/content for extraction
    - *Edge Cases:* Drive API errors, permissions, invalid file references

---

#### 2.3 File Extraction and Batch Processing

- **Overview:** Extracts text and data from each CV PDF and splits the batch to process each document individually.
- **Nodes Involved:** Extract from File, Loop Over Items
- **Node Details:**

  - **Extract from File**
    - *Type:* Extract From File node
    - *Role:* Extracts text content from PDF files for AI processing
    - *Config:* Uses built-in PDF text extraction capabilities
    - *Inputs:* Files from Google Drive node
    - *Outputs:* Extracted text data per file
    - *Edge Cases:* Extraction failures on corrupted or scanned PDFs, empty text extraction

  - **Loop Over Items**
    - *Type:* SplitInBatches node
    - *Role:* Processes extracted files one by one or in small batches for sequential AI processing
    - *Config:* Batch size set to 1 (likely) to process each CV individually
    - *Inputs:* Extracted text data from Extract from File
    - *Outputs:* Single CV data item per iteration
    - *Edge Cases:* Batch size misconfiguration, long processing time per item causing timeout

---

#### 2.4 AI Processing and Data Extraction

- **Overview:** Sends each CV’s extracted text to Google Gemini AI to identify targeted elements (e.g., anonymized fields), using an AI Agent node.
- **Nodes Involved:** HTTP Request, AI Agent - get targeted elements from text, Google Gemini Chat Model, Clean output
- **Node Details:**

  - **HTTP Request**
    - *Type:* HTTP Request node
    - *Role:* Possibly sends pre-processing or metadata requests related to the AI call or external API integration
    - *Config:* Custom request set to execute once per batch
    - *Inputs:* Loop Over Items (first output)
    - *Outputs:* Response data possibly used for AI input or control
    - *Edge Cases:* API failures, rate limits, invalid responses

  - **AI Agent - get targeted elements from text**
    - *Type:* Langchain Agent node
    - *Role:* Orchestrates AI interaction to extract structured elements from CV text
    - *Config:* Uses Google Gemini Chat Model as language model backend
    - *Inputs:* Loop Over Items (second output)
    - *Outputs:* Raw AI output with extracted targeted elements
    - *Edge Cases:* AI model errors, response timeouts, malformed AI output

  - **Google Gemini Chat Model**
    - *Type:* Language Model node (Google Gemini)
    - *Role:* Provides AI completions and chat interactions to the Agent node
    - *Config:* Requires Google Gemini AI credentials; used as backend for agent
    - *Inputs:* AI Agent node’s language model input
    - *Outputs:* AI-generated text data
    - *Edge Cases:* Credential expiration, API limits, incorrect prompt formatting

  - **Clean output**
    - *Type:* Code node
    - *Role:* Cleans and formats AI agent’s raw output into structured data fields
    - *Config:* Custom JavaScript parsing and cleaning logic
    - *Inputs:* Output from AI Agent node
    - *Outputs:* Structured, cleaned CV data ready for storage
    - *Edge Cases:* Parsing errors, unexpected AI output format

---

#### 2.5 Update Sheets and Logging

- **Overview:** Writes cleaned and structured CV data fields back to Google Sheets and logs the processing event for each CV.
- **Nodes Involved:** Update CV Fields, Log the processing of the doc, Loop Over Items
- **Node Details:**

  - **Update CV Fields**
    - *Type:* Google Sheets node
    - *Role:* Updates or appends anonymized and reformatted CV fields to a Google Sheet
    - *Config:* Target spreadsheet and worksheet for CV data storage
    - *Inputs:* Clean output from code node
    - *Outputs:* Confirmation of data writing
    - *Edge Cases:* Write permission errors, concurrent write conflicts

  - **Log the processing of the doc**
    - *Type:* Google Sheets node
    - *Role:* Logs metadata and processing status for audit and tracking
    - *Config:* Target spreadsheet/sheet for logging processing events
    - *Inputs:* Output of Update CV Fields
    - *Outputs:* Confirmation of log entry
    - *Edge Cases:* Sheet access issues, excessive log size

  - **Loop Over Items** (in this context)
    - *Role:* Loops back to continue processing next batch item after logging
    - *Inputs:* From Log the processing of the doc, loops to next item in Loop Over Items node

---

#### 2.6 Auxiliary and Support Nodes

- **Overview:** These nodes provide supporting functionality such as additional code cleansing, retry logic, or informational sticky notes.
- **Nodes Involved:** Cleans output (earlier in flow), Cleans output (later), Sticky Notes (various)
- **Node Details:**

  - **Cleans output** (earlier)
    - *Type:* Code node
    - *Role:* Cleans the initial HTTP response from file listing
    - *Edge Cases:* Parsing errors

  - **Cleans output** (later)
    - *Type:* Code node
    - *Role:* Final cleanup of AI output before updating sheets
    - *Edge Cases:* Data inconsistencies

  - **Sticky Note nodes**
    - *Type:* Sticky Note
    - *Role:* Provide contextual comments or reminders; content mostly empty or minimal here
    - *Positioned* near logical blocks for user reference

---

### 3. Summary Table

| Node Name                         | Node Type                              | Functional Role                                | Input Node(s)                     | Output Node(s)                   | Sticky Note          |
|----------------------------------|--------------------------------------|-----------------------------------------------|----------------------------------|---------------------------------|----------------------|
| Google Drive Trigger              | Google Drive Trigger                  | Starts workflow on Drive file changes         | External Trigger                 | Get list of pdf files, Read processed docs |                      |
| Get list of pdf files             | HTTP Request                         | Retrieves list of PDF files                    | Google Drive Trigger             | Cleans output                   |                      |
| Cleans output                    | Code                                 | Cleans HTTP response with file list           | Get list of pdf files            | Compare Datasets                |                      |
| Read processed docs              | Google Sheets                        | Reads processed CV records                     | Google Drive Trigger             | Compare Datasets                |                      |
| Compare Datasets                 | Compare Datasets                     | Compares new files vs processed records       | Cleans output, Read processed docs | Google Drive                   |                      |
| Google Drive                    | Google Drive                        | Gets file details for new files                | Compare Datasets                 | Extract from File              |                      |
| Extract from File                | Extract From File                    | Extracts text from PDFs                        | Google Drive                    | Loop Over Items                |                      |
| Loop Over Items                 | SplitInBatches                      | Processes CVs one by one                       | Extract from File               | HTTP Request, AI Agent - get targeted elements from text |                      |
| HTTP Request                   | HTTP Request                       | Sends auxiliary API request                    | Loop Over Items                 | (feeds AI processing)          |                      |
| AI Agent - get targeted elements from text | Langchain Agent                    | Extracts targeted CV data using AI            | Loop Over Items                 | Clean output                  |                      |
| Google Gemini Chat Model         | Langchain LM Chat Google Gemini     | Provides AI chat completions                    | AI Agent - get targeted elements | AI Agent - get targeted elements |                      |
| Clean output                   | Code                                 | Cleans AI output                               | AI Agent - get targeted elements | Update CV Fields               |                      |
| Update CV Fields                | Google Sheets                        | Updates anonymized CV data in sheet            | Clean output                   | Log the processing of the doc |                      |
| Log the processing of the doc   | Google Sheets                        | Logs processing event                           | Update CV Fields               | Loop Over Items               |                      |
| Sticky Note                    | Sticky Note                         | Provides contextual notes                       | N/A                           | N/A                           |                      |
| Sticky Note1                   | Sticky Note                         | Provides contextual notes                       | N/A                           | N/A                           |                      |
| Sticky Note2                   | Sticky Note                         | Provides contextual notes                       | N/A                           | N/A                           |                      |
| Sticky Note3                   | Sticky Note                         | Provides contextual notes                       | N/A                           | N/A                           |                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Drive Trigger node**
   - Configure with Google OAuth2 credentials
   - Monitor the folder where CV PDFs are uploaded
   - Set to trigger on file creation or update events

2. **Create HTTP Request node named "Get list of pdf files"**
   - Configure with the HTTP method and URL endpoint to list PDF files (API or internal)
   - Use appropriate headers or auth if needed

3. **Create Code node named "Cleans output"**
   - Write JavaScript to parse and sanitize the HTTP response from the previous node
   - Output structured array of file metadata

4. **Create Google Sheets node named "Read processed docs"**
   - Set up to read the sheet/tab containing records of already processed CV files
   - Use appropriate Google Sheets OAuth2 credentials

5. **Create Compare Datasets node**
   - Feed the cleaned list of files and the processed docs list as datasets A and B
   - Configure to find differences (new files only)

6. **Create Google Drive node**
   - Retrieve metadata and content of new files identified from comparison
   - Use same Google Drive credentials

7. **Create Extract From File node**
   - Configure to extract text from PDF files received from Google Drive node

8. **Create SplitInBatches node named "Loop Over Items"**
   - Connect to the Extract From File node output
   - Set batch size to 1 to process each CV individually

9. **Create HTTP Request node**
   - Configure for any required auxiliary API calls per CV
   - Set "Execute Once" if needed based on workflow logic

10. **Create Langchain Agent node named "AI Agent - get targeted elements from text"**
    - Configure to use Google Gemini Chat Model as language model backend
    - Design prompt to extract targeted CV info and anonymize sensitive data

11. **Create Langchain LM Chat Google Gemini node**
    - Provide Google Gemini AI credentials
    - Connect as language model input for the AI Agent node

12. **Create Code node named "Clean output"**
    - Write JS code to parse and clean AI agent’s raw output into structured fields

13. **Create Google Sheets node named "Update CV Fields"**
    - Configure to update or append anonymized CV fields into target spreadsheet

14. **Create Google Sheets node named "Log the processing of the doc"**
    - Configure to log each processed CV’s metadata and status for audit

15. **Connect Log the processing node output back to the SplitInBatches node**
    - Loop to next item until all CVs processed

16. **Add Sticky Note nodes at appropriate positions for documentation or reminders**

17. **Test the workflow end-to-end with sample CV PDFs to verify the pipeline**

---

### 5. General Notes & Resources

| Note Content                                                                                  | Context or Link                                                             |
|-----------------------------------------------------------------------------------------------|----------------------------------------------------------------------------|
| Workflow integrates Google Gemini AI for advanced CV anonymization and targeted extraction    | Uses n8n Langchain Google Gemini Chat Model node                           |
| Google Drive Trigger ensures automation on new or updated CV files                            | Google Drive OAuth2 credentials required                                  |
| Google Sheets used both as source of processed document records and as output data store      | Sheets OAuth2 credentials required                                        |
| Careful error handling recommended for PDF extraction and AI response parsing                 | Watch for corrupted files, API rate limits, and response format changes   |
| For more on n8n Langchain AI nodes, see https://n8n.io/integrations/n8n-nodes-langchain       | Official n8n Langchain integration documentation                          |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly adheres to applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.