AI-Powered CV Filtering with Llama3.1 LLM, Google Drive & Sheets

https://n8nworkflows.xyz/workflows/ai-powered-cv-filtering-with-llama3-1-llm--google-drive---sheets-6696


# AI-Powered CV Filtering with Llama3.1 LLM, Google Drive & Sheets

---

### 1. Workflow Overview

This workflow, titled **AI-Powered CV Filtering with Llama3.1 LLM, Google Drive & Sheets**, automates the process of evaluating candidate CVs by leveraging AI language models to score and analyze resumes against predefined criteria. It targets recruitment and HR teams seeking to streamline candidate assessment by automatically extracting CV content, applying AI-driven evaluation, and recording results in a Google Sheet.

The workflow is logically structured into these blocks:

- **1.1 Input Reception and File Retrieval:** Handles incoming POST webhook requests to trigger the workflow, searches a specified Google Drive folder for candidate CV files, and downloads them.

- **1.2 Data Extraction and Criteria Loading:** Extracts text from downloaded PDF CVs and retrieves evaluation criteria from a Google Sheet.

- **1.3 AI-Powered Candidate Evaluation:** Sends extracted CV text and criteria to a Llama 3.1 language model chain to generate structured assessments, parsing and auto-fixing outputs for reliable data extraction.

- **1.4 Data Aggregation and Formatting:** Aggregates AI outputs, reformats them into tabular data with dynamic question fields, and appends the final evaluation results into a designated Google Sheet.

- **1.5 Workflow Control and Response:** Manages batch processing of multiple candidate files, merges data streams, and sends a completion response to the webhook caller.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Input Reception and File Retrieval

**Overview:**  
This block receives an external trigger with candidate data, searches a specific Google Drive folder for CV files, and initiates batch processing by splitting the file list.

**Nodes Involved:**  
- Webhook  
- Folder-search (Google Drive)  
- Loop Over Items (Split in Batches)  
- Download-file (Google Drive)  

**Node Details:**

- **Webhook**  
  - *Type:* HTTP Webhook  
  - *Role:* Entry point accepting POST requests to trigger the workflow.  
  - *Configuration:* Path set to a unique webhook ID; HTTP method POST; responds after completion.  
  - *Connections:* Output → Folder-search; also → Respond to Webhook.  
  - *Edge Cases:* Failure if webhook receives malformed requests or if the webhook path is changed without update.  

- **Folder-search**  
  - *Type:* Google Drive Search  
  - *Role:* Lists files within a specified Google Drive folder containing candidate CVs.  
  - *Configuration:* Filters by folder ID `"1z0DTQL4nfB7lQFETQw8-fnxg1YaOpgoL"`.  
  - *Connections:* Output → Loop Over Items.  
  - *Credentials:* Requires Google Drive OAuth2 account with folder access.  
  - *Edge Cases:* Access denied errors if credentials lack permissions; empty folder leads to no files processed.  

- **Loop Over Items**  
  - *Type:* Split in Batches  
  - *Role:* Processes files one (or few) at a time to avoid overload and control flow.  
  - *Configuration:* Default batching options (likely batch size 1).  
  - *Connections:* One output branch → Download-file (to download each CV), another branch → Input-criteria (to fetch criteria per file).  
  - *Edge Cases:* Batch processing failure may halt workflow; large number of files increases runtime.  

- **Download-file**  
  - *Type:* Google Drive Download  
  - *Role:* Downloads the candidate CV file, converting Google Docs/Slides/Drawings to PDF if needed.  
  - *Configuration:* Uses dynamic file ID from Loop Over Items input; converts to PDF format if applicable.  
  - *Connections:* Output → Extract from PDF.  
  - *Credentials:* Requires Google Drive OAuth2 credentials.  
  - *Edge Cases:* Download failures due to revoked access or missing files. Conversion to PDF may fail on unsupported formats.

---

#### 2.2 Data Extraction and Criteria Loading

**Overview:**  
Extracts raw text from downloaded PDF CVs and retrieves evaluation criteria from a Google Sheet for use in AI assessment.

**Nodes Involved:**  
- Extract from PDF  
- Input-criteria (Google Sheets)  
- Merge  

**Node Details:**

- **Extract from PDF**  
  - *Type:* File Content Extractor  
  - *Role:* Extracts textual content from the downloaded candidate PDF CV.  
  - *Configuration:* Operation set to 'pdf'.  
  - *Connections:* Output → Merge (branch 2).  
  - *Edge Cases:* Extraction may fail on scanned images or encrypted PDFs. Text quality may vary.

- **Input-criteria**  
  - *Type:* Google Sheets Read  
  - *Role:* Reads filtering and scoring criteria from a defined Google Sheet tab.  
  - *Configuration:* Sheet `"Search_Criteria_t2"` in document ID `"1VoJbCMXbgQm8lO37h1kAp-wFo_7rC_xthL7H4PXCNxg"`.  
  - *Connections:* Output → Merge (branch 1).  
  - *Credentials:* Requires Google Sheets OAuth2 with read access.  
  - *Edge Cases:* Missing or malformed criteria data; permission errors.

- **Merge**  
  - *Type:* Data Merge  
  - *Role:* Combines extracted CV text and criteria data into one stream for AI processing.  
  - *Configuration:* Mode set to "chooseBranch" to merge two different input branches.  
  - *Connections:* Output → Aggregate.  
  - *Edge Cases:* Mismatch in data synchronization between criteria and CV text; incomplete merges.

---

#### 2.3 AI-Powered Candidate Evaluation

**Overview:**  
Aggregates merged data and uses a LangChain LLM pipeline with Llama 3.1 model to analyze candidate CVs against criteria. Includes output parsing and auto-fixing for structured results.

**Nodes Involved:**  
- Aggregate  
- Basic LLM Chain (LangChain)  
- Ollama Model (Llama 3.1)  
- Auto-fixing Output Parser  
- Structured Output Parser  

**Node Details:**

- **Aggregate**  
  - *Type:* Data Aggregation  
  - *Role:* Aggregates all input data items into a single batch for the AI chain.  
  - *Configuration:* Aggregates all item data in one set.  
  - *Connections:* Output → Basic LLM Chain.  
  - *Edge Cases:* Large input data may cause performance issues.

- **Basic LLM Chain**  
  - *Type:* LangChain LLM Chain Node  
  - *Role:* Sends prompt combining candidate profile text and criteria questions to the AI model, requesting evaluation in a structured format.  
  - *Configuration:*  
    - Prompt dynamically includes extracted CV text, criteria questions with matching criteria and output types, and instructions for scoring.  
    - Uses output parser (hasOutputParser=true).  
  - *Connections:*  
    - AI Language Model input → Ollama Model and Auto-fixing Output Parser (concurrently).  
    - Output → Code node for formatting results.  
  - *Edge Cases:*  
    - AI generation failures, timeout, or unexpected response formats.  
    - Expression errors in prompt generation if data missing.

- **Ollama Model**  
  - *Type:* AI Language Model (Llama 3.1)  
  - *Role:* Executes the Llama 3.1 inference with prompt and returns AI-generated candidate evaluation.  
  - *Configuration:*  
    - Model: "llama3.1:latest"  
    - Temperature: 0.1 (low randomness)  
  - *Credentials:* Ollama API credentials required.  
  - *Connections:* Output → Auto-fixing Output Parser.  
  - *Edge Cases:* API authentication errors, rate limits, or model unavailability.

- **Auto-fixing Output Parser**  
  - *Type:* LangChain Output Parser (Auto-fixing)  
  - *Role:* Attempts to parse and correct AI output to conform to expected structured format.  
  - *Connections:* Output → Basic LLM Chain (output parser input), also linked to Structured Output Parser.  
  - *Edge Cases:* Parsing failures if AI output deviates too much; infinite loop risk if auto-fixing misconfigured.

- **Structured Output Parser**  
  - *Type:* LangChain Output Parser (Structured)  
  - *Role:* Validates AI output against a detailed JSON schema defining expected evaluation form fields: candidate file name, candidate name, array of questions (with question and answer), overall points.  
  - *Configuration:* JSON Schema manually defined for precise structure enforcement.  
  - *Connections:* Output → Auto-fixing Output Parser.  
  - *Edge Cases:* Schema validation failures on malformed AI output.

---

#### 2.4 Data Aggregation and Formatting

**Overview:**  
Transforms the AI evaluation results into a spreadsheet-friendly table format dynamically accounting for variable question sets, then appends to the output Google Sheet.

**Nodes Involved:**  
- Code  
- Output-sheet (Google Sheets)  

**Node Details:**

- **Code**  
  - *Type:* JavaScript Code  
  - *Role:* Processes all AI outputs; dynamically extracts all question fields from the AI evaluation, creates rows with candidate name, file name, each question's score, and total points.  
  - *Key Logic:*  
    - Collects all unique questions from all candidate evaluations.  
    - Builds an array of objects where each object corresponds to one candidate's evaluation row with all question scores (empty string if missing).  
  - *Connections:* Output → Output-sheet.  
  - *Edge Cases:* Invalid or missing AI output may cause runtime exceptions; empty question sets.

- **Output-sheet**  
  - *Type:* Google Sheets Append  
  - *Role:* Appends processed evaluation data to a specified Google Sheet tab for archival and reporting.  
  - *Configuration:*  
    - Document ID: `"1TvYZwuCeTVImsXdd3cNh6zYf7neJbHvCkqLjNzsCk5w"`  
    - Sheet: `"Sheet2"`  
    - Columns predefined with candidate info and expected question categories (e.g., Business Analysis, Project Management, Banking, Communication Skills, Overall Points).  
  - *Connections:* Output → Loop Over Items (to continue batch processing).  
  - *Credentials:* Google Sheets OAuth2 credentials required.  
  - *Edge Cases:* Append failures due to access issues or schema mismatch.

---

#### 2.5 Workflow Control and Response

**Overview:**  
Controls the iterative processing of multiple candidates and sends a confirmation response to the webhook sender upon workflow completion.

**Nodes Involved:**  
- Loop Over Items (second branch)  
- Respond to Webhook  

**Node Details:**

- **Loop Over Items** (second output branch)  
  - *Role:* After appending data, signals completion by triggering the webhook response.  
  - *Connections:* Output → Respond to Webhook.  

- **Respond to Webhook**  
  - *Type:* HTTP Response Node  
  - *Role:* Sends a JSON response confirming successful workflow execution to the original POST request.  
  - *Configuration:* Response body set to `{"Status": "Workflow Completed!"}` using JSON format.  
  - *Edge Cases:* Response failure if workflow interrupted or webhook token invalid.

---

### 3. Summary Table

| Node Name               | Node Type                        | Functional Role                        | Input Node(s)           | Output Node(s)                  | Sticky Note                              |
|-------------------------|---------------------------------|-------------------------------------|------------------------|-------------------------------|-----------------------------------------|
| Webhook                 | HTTP Webhook                    | Entry point for workflow trigger    | —                      | Folder-search, Respond to Webhook |                                         |
| Folder-search           | Google Drive Search             | Lists CV files in target folder     | Webhook                 | Loop Over Items                |                                         |
| Loop Over Items         | Split in Batches                | Batch processing per file            | Folder-search           | Download-file, Input-criteria; Respond to Webhook (second branch) |                                         |
| Download-file           | Google Drive Download           | Downloads candidate CV files         | Loop Over Items         | Extract from PDF               |                                         |
| Extract from PDF        | File Extractor                  | Extracts text content from PDFs      | Download-file           | Merge                        |                                         |
| Input-criteria          | Google Sheets Read              | Reads evaluation criteria            | Loop Over Items         | Merge                        |                                         |
| Merge                   | Data Merge                     | Combines criteria and CV text        | Extract from PDF, Input-criteria | Aggregate                  |                                         |
| Aggregate               | Data Aggregation               | Aggregates merged data               | Merge                   | Basic LLM Chain              |                                         |
| Ollama Model            | LangChain LLM (Llama 3.1)      | AI model inference                   | Basic LLM Chain (ai_languageModel) | Auto-fixing Output Parser |                                         |
| Auto-fixing Output Parser | LangChain Output Parser (Auto) | Parses and corrects AI output        | Ollama Model, Structured Output Parser | Basic LLM Chain (ai_outputParser) |                                         |
| Structured Output Parser | LangChain Output Parser (Schema) | Validates AI output against JSON schema | Auto-fixing Output Parser (ai_outputParser) | Auto-fixing Output Parser |                                         |
| Basic LLM Chain         | LangChain LLM Chain             | Constructs prompt and processes AI response | Aggregate, Auto-fixing Output Parser | Code                    |                                         |
| Code                    | JavaScript Code                | Formats AI results for spreadsheet  | Basic LLM Chain          | Output-sheet                 |                                         |
| Output-sheet            | Google Sheets Append           | Appends formatted data              | Code                     | Loop Over Items              |                                         |
| Respond to Webhook      | HTTP Response                  | Sends completion confirmation       | Loop Over Items          | —                           |                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook node:**  
   - Type: HTTP Webhook  
   - Method: POST  
   - Path: Unique webhook ID (e.g., `"6751c9a2-4bf9-416e-8e98-905498867431"`)  

2. **Create Google Drive Folder Search node ("Folder-search"):**  
   - Operation: Search files/folders  
   - Filter: Folder ID = `"1z0DTQL4nfB7lQFETQw8-fnxg1YaOpgoL"`  
   - Credentials: Google Drive OAuth2 with access to the folder  
   - Connect Webhook output to this node input  

3. **Create SplitInBatches node ("Loop Over Items"):**  
   - Default batch size (1 or as needed)  
   - Connect Folder-search output to this node input  

4. **Create Google Drive Download node ("Download-file"):**  
   - Operation: Download  
   - File ID: Set dynamically from Loop Over Items output (`{{$json["id"]}}`)  
   - Enable Google file conversion to PDF format for Docs/Slides/Drawings  
   - Credentials: Google Drive OAuth2  
   - Connect Loop Over Items output branch 1 to this node  

5. **Create Extract from File node ("Extract from PDF"):**  
   - Operation: PDF extract  
   - Connect Download-file output to this node  

6. **Create Google Sheets Read node ("Input-criteria"):**  
   - Document ID: `"1VoJbCMXbgQm8lO37h1kAp-wFo_7rC_xthL7H4PXCNxg"`  
   - Sheet Name: `"Search_Criteria_t2"`  
   - Credentials: Google Sheets OAuth2 with read access  
   - Connect Loop Over Items output branch 2 to this node  

7. **Create Merge node ("Merge"):**  
   - Mode: "chooseBranch"  
   - Connect Extract from PDF output to branch 2, Input-criteria output to branch 1  

8. **Create Aggregate node:**  
   - Operation: Aggregate all items  
   - Connect Merge output to this node  

9. **Create LangChain Ollama Model node ("Ollama Model"):**  
   - Model: `llama3.1:latest`  
   - Temperature: 0.1  
   - Credentials: Ollama API credentials  
   - Connect this node to Basic LLM Chain (see below) as ai_languageModel input  

10. **Create LangChain Auto-fixing Output Parser node:**  
    - Default configuration  
    - Connect Ollama Model output to this parser node  
    - Connect parser output to Basic LLM Chain as ai_outputParser input  

11. **Create LangChain Structured Output Parser node:**  
    - Input Schema: JSON schema defining candidate evaluation form (as detailed in the workflow)  
    - Connect parser output to Auto-fixing Output Parser input  

12. **Create LangChain LLM Chain node ("Basic LLM Chain"):**  
    - Configure prompt to include:  
      - Candidate profile text (from Extract from PDF)  
      - Questions and criteria (from Input-criteria)  
      - Instructions on scoring and output format  
    - Enable output parser, linking to Auto-fixing Output Parser and Ollama Model as above  
    - Connect Aggregate output to this chain input  
    - Connect chain output to Code node  

13. **Create Code node:**  
    - JavaScript code to:  
      - Collect all question keys from AI output dynamically  
      - Build rows with candidate file name, candidate name, question scores, overall points  
    - Connect Basic LLM Chain output to Code node  

14. **Create Google Sheets Append node ("Output-sheet"):**  
    - Document ID: `"1TvYZwuCeTVImsXdd3cNh6zYf7neJbHvCkqLjNzsCk5w"`  
    - Sheet Name: `"Sheet2"`  
    - Columns: Candidate File Name, Candidate Name, Business Analysis, Project Management (PMO), Banking, Communication Skills, Overall Points (adjust as needed)  
    - Credentials: Google Sheets OAuth2 with write access  
    - Connect Code node output to Output-sheet  

15. **Connect Output-sheet output to Loop Over Items (second output branch):**  
    - To continue batch processing  

16. **Create Respond to Webhook node:**  
    - Respond with JSON: `{"Status": "Workflow Completed!"}`  
    - Connect Loop Over Items second output branch to Respond to Webhook  

---

### 5. General Notes & Resources

| Note Content                                                                                                  | Context or Link                                                                                  |
|---------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| The workflow uses Llama 3.1 via Ollama model integration with temperature set to 0.1 for deterministic output. | Ensures consistent AI scoring with minimal randomness.                                         |
| Google Drive folder and Google Sheets document IDs must be updated to match user environment and permissions. | Essential for correct file access and data reading/writing.                                    |
| The JSON schema for the Structured Output Parser is critical to validate AI outputs and avoid parsing errors. | See JSON Schema: https://json-schema.org/                                                       |
| Batch processing via SplitInBatches node prevents overload and handles multiple candidates efficiently.       | Useful for scaling to large candidate pools.                                                    |
| Conversion of Google Docs/Slides to PDF ensures consistent text extraction across file formats.               | Conversion enabled in Download-file node options.                                              |
| The AI prompt dynamically pulls criteria from Google Sheets, allowing easy updates to evaluation questions.   | Enables flexible and maintainable evaluation logic.                                            |

---

**Disclaimer:** This documentation is generated from an n8n workflow automation and strictly complies with content policies. It processes legal and public data only, without including any protected or offensive content.