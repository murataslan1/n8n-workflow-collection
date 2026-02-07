Automated Academic Paper Metadata & Variable Extraction with Gemini to Google Sheets

https://n8nworkflows.xyz/workflows/automated-academic-paper-metadata---variable-extraction-with-gemini-to-google-sheets-9994


# Automated Academic Paper Metadata & Variable Extraction with Gemini to Google Sheets

### 1. Workflow Overview

This n8n workflow automates the extraction, normalization, and enrichment of academic paper metadata and research variable information from uploaded bibliographic files (CSV, XLS, XLSX), then stores and classifies the results in Google Sheets. It integrates Google Gemini (LLM) for metadata extraction and variable identification, and uses Gmail for notification.

**Target Use Cases:**  
- Researchers or academic analysts wanting to batch process academic paper metadata and extract study variables automatically.  
- Teams needing to maintain a structured, versioned Google Sheets database of paper metadata and extracted variables including journal rankings.

**Logical Blocks:**

- **1.1 File Intake & Type Routing:** Handles file upload, file type detection, and initial parsing into structured records. Creates a Google Sheets spreadsheet as output container.  
- **1.2 Per-Record Metadata Extraction:** Processes parsed records in batches, extracting normalized bibliographic metadata via LLM and saving progress in a "Checkpoint" sheet. Sends progress notifications.  
- **1.3 Journal Ranking & Study Variable Extraction:** Reads checkpoint data, classifies journals by rank, extracts study variables (IV, DV, etc.) using LLM, merges results, writes final enriched data to the "FinalResult" sheet, and sends completion notifications.  

---

### 2. Block-by-Block Analysis

#### 1.1 File Intake & Type Routing

**Overview:**  
Receives academic paper files uploaded via chat, detects file type (CSV, XLS, XLSX), parses the file accordingly, and creates a Google Sheets spreadsheet named by user chat input with two sheets: `Checkpoint` and `FinalResult`.

**Nodes Involved:**  
- File Upload Trigger  
- Create spreadsheet  
- File Type Router (Switch)  
- CSV Data Extractor  
- XLS Data Extractor  
- XLSX Data Extractor  
- Error Message Handler

**Node Details:**

- **File Upload Trigger**  
  - Type: `chatTrigger` with file upload enabled  
  - Config: Accepts file uploads with MIME types for CSV/XLS/XLSX  
  - Output: Binary file data and chat input text (used as spreadsheet title)  
  - Error cases: Upload of unsupported file types or no file uploaded (handled downstream)  

- **Create spreadsheet**  
  - Type: Google Sheets node (create spreadsheet)  
  - Config: Creates new spreadsheet titled with chat input message; includes two sheets `Checkpoint` and `FinalResult`  
  - Credentials: Google Sheets OAuth2  
  - Output: Spreadsheet ID and sheet info for downstream use  

- **File Type Router (Switch)**  
  - Type: Switch node  
  - Config: Routes flow based on file extension extracted from uploaded file (lowercased)  
  - Conditions: Routes to CSV, XLS, XLSX extractors or Error Message Handler if unsupported  
  - Key expression: `={{ ( $('File Upload Trigger').item.json.files?.[0]?.fileExtension || '' ).toLowerCase() }}`  

- **CSV Data Extractor**  
  - Type: ExtractFromFile node  
  - Config: Extracts CSV data from binary property `data0`, UTF-8 encoding  
  - On error: `continueRegularOutput` to avoid stopping workflow  
  - Output: Parsed JSON records array  

- **XLS Data Extractor**  
  - Type: ExtractFromFile node  
  - Config: Extracts XLS data from binary property `data0`  
  - On error: `continueRegularOutput`  

- **XLSX Data Extractor**  
  - Type: ExtractFromFile node  
  - Config: Extracts XLSX data from binary property `data0`  
  - On error: `continueRegularOutput`  

- **Error Message Handler**  
  - Type: Set node  
  - Config: Outputs JSON with string `"Pls attach a file"` if file type unsupported or missing  

**Edge Cases:**  
- Missing file or unsupported file type triggers error message.  
- File parsing errors are caught and flow continues.  
- Spreadsheet creation failure due to auth or quota issues.  

---

#### 1.2 Per-Record Metadata Extraction

**Overview:**  
Processes parsed records in batches of 10, extracting normalized metadata fields (`authors`, `title`, `abstract`, `publication_date`, `source`) from each record using Google Gemini LLM with a strict JSON schema. Saves normalized results to the `Checkpoint` sheet and sends a progress notification email.

**Nodes Involved:**  
- Loop Over Items (SplitInBatches)  
- Paper Metadata Extractor (LLM Agent)  
- Auto-fixing Output Parser  
- Structured Output Parser  
- Data Formatter (Code)  
- Save to Checkpoint Sheet (Google Sheets Append)  
- Wait for 3s  
- Read Write in Data (Google Sheets, reading checkpoint sheet)  
- Send process notication (Gmail)

**Node Details:**

- **Loop Over Items**  
  - Type: SplitInBatches  
  - Config: Batch size = 10 records for efficient LLM API usage and sheet writing  
  - Input: Parsed records from file extractor  
  - Output: Batches sent sequentially downstream  

- **Paper Metadata Extractor**  
  - Type: LangChain Agent node using Google Gemini Chat model  
  - Config: System prompt instructs extracting fields into a strict JSON schema with validation and auto-fixing  
  - Input: Individual record JSON stringified  
  - Output: JSON with fields: authors (array of `{name}`), title, abstract, publication_date, source  
  - Credentials: Google Gemini API  
  - Version: 2.2  

- **Auto-fixing Output Parser**  
  - Type: LangChain output parser with auto-fixing retries  
  - Config: Validates output JSON; on failure, prompts LLM to fix output without extra explanation  

- **Structured Output Parser**  
  - Type: LangChain structured output parser  
  - Config: JSON schema matching expected metadata fields for robust validation  

- **Data Formatter**  
  - Type: Code node (JavaScript)  
  - Function: Converts authors array into semicolon-separated string; ensures null for missing fields  
  - Input: LLM output JSON from Paper Metadata Extractor  
  - Output: Flattened JSON with string fields for saving to sheet  

- **Save to Checkpoint Sheet**  
  - Type: Google Sheets append operation  
  - Config: Appends normalized metadata columns to `Checkpoint` sheet of created spreadsheet  
  - Credentials: Google Sheets OAuth2  
  - Input: Flattened metadata JSON  

- **Wait for 3s**  
  - Type: Wait node  
  - Config: Pause 3 seconds between batches to avoid API rate limits  

- **Read Write in Data**  
  - Type: Google Sheets read (dynamic sheet name and document ID)  
  - Config: Reads the `Checkpoint` sheet after batch append  
  - Credentials: Google Sheets OAuth2  

- **Send process notication**  
  - Type: Gmail node  
  - Config: Sends email notification on metadata normalization completion including count of processed papers and timestamp  
  - Credentials: Gmail OAuth2  
  - Executes once after batch processing  

**Edge Cases:**  
- LLM output validation failure triggers auto-fixing retries.  
- Sheet write failures due to quota or credential issues.  
- Network/API timeouts causing batch retry or failure.  
- Missing abstracts impact extraction quality.  

---

#### 1.3 Journal Ranking & Study Variable Extraction

**Overview:**  
Reads normalized metadata from the `Checkpoint` sheet, maps fields for LLM input, classifies journals against UTD24/FT50 ranked lists, performs a second LLM pass to extract study variables (DV, IV, mediator, moderator, overarching theory) plus a summary. Merges all data and appends or updates to the `FinalResult` sheet, then sends a completion notification email.

**Nodes Involved:**  
- When Executed by Another Workflow (ExecuteWorkflowTrigger)  
- Get Sheet id (Set)  
- Read Checkpoint Data (Google Sheets Read)  
- WOS Field Mapper (Set)  
- Batch Processor (SplitInBatches)  
- Journal Rank Classifier (Code)  
- Academic Variables Extractor (LLM Agent)  
- Auto-fixing Output Parser1  
- Structured Output Parser1  
- Final Data Mapper (Set)  
- Save Final Results (Google Sheets AppendOrUpdate)  
- Wait for 3s (Wait)  
- Send done notication (Gmail)  
- Google Gemini Chat Model / Google Gemini Chat Model1 (LLM nodes)

**Node Details:**

- **When Executed by Another Workflow**  
  - Type: ExecuteWorkflowTrigger  
  - Config: Accepts `GoogleSheetID` input parameter to start workflow from checkpoint  

- **Get Sheet id**  
  - Type: Set  
  - Config: Sets `ID` variable from input parameter `GoogleSheetID`  

- **Read Checkpoint Data**  
  - Type: Google Sheets Read  
  - Config: Reads `Checkpoint` sheet by document ID  
  - Credentials: Google Sheets OAuth2  

- **WOS Field Mapper**  
  - Type: Set node  
  - Config: Maps raw sheet fields (authors, title, publication_date, source, abstract) to consistent keys expected by LLM  

- **Batch Processor**  
  - Type: SplitInBatches  
  - Config: Batch size = 10 for stable API calls  

- **Journal Rank Classifier**  
  - Type: Code node  
  - Config: Compares `Source` field against uppercase journal lists UTD24 and FT50, assigns rank flags: `UTD24`, `FT50`, `UTD24 & FT50`, or `Not listed`  

- **Academic Variables Extractor**  
  - Type: LangChain Agent with Google Gemini LLM  
  - Config: Extracts study variables and summary from Title & Abstract with strict JSON output, validated and autofixed  
  - Output fields: Summary, DV, IV, Mediator, Moderator, Overarching_theory  

- **Auto-fixing Output Parser1 & Structured Output Parser1**  
  - Type: LangChain output parsers for validation and auto-correction of LLM output  

- **Final Data Mapper**  
  - Type: Set node  
  - Config: Merges metadata, journal rank, and AI-extracted variables into final JSON structure for Google Sheets  

- **Save Final Results**  
  - Type: Google Sheets appendOrUpdate operation  
  - Config: Writes enriched records to `FinalResult` sheet  
  - Credentials: Google Sheets OAuth2  

- **Wait for 3s**  
  - Type: Wait node to reduce rate limits  

- **Send done notication**  
  - Type: Gmail node  
  - Config: Sends email notification indicating study variable extraction completion  

**Edge Cases:**  
- Journal name mismatches or missing source field lead to "Not listed" rank.  
- LLM output validation failures handled by auto-fixing parser.  
- Sheet update failures due to concurrency or quota.  
- Workflow manual restart possible from checkpoint in case of failure.  

---

### 3. Summary Table

| Node Name                  | Node Type                               | Functional Role                                      | Input Node(s)                | Output Node(s)                 | Sticky Note                                                                                                                           |
|----------------------------|---------------------------------------|-----------------------------------------------------|------------------------------|-------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| File Upload Trigger         | chatTrigger (LangChain)                | Receive uploaded bibliographic file and chat input |                              | Create spreadsheet             | ## 1) File Intake & Type Routing: Receives files and creates spreadsheet for processing                                                |
| Create spreadsheet          | Google Sheets                         | Create Google Sheets file with Checkpoint & FinalResult sheets | File Upload Trigger           | File Type Router               | ## 1) File Intake & Type Routing                                                                                                    |
| File Type Router            | Switch                               | Route file processing based on file extension       | Create spreadsheet            | CSV Data Extractor, XLS Data Extractor, XLSX Data Extractor, Error Message Handler | ## 1) File Intake & Type Routing                                                                                                    |
| CSV Data Extractor          | ExtractFromFile                      | Parse CSV file into JSON records                     | File Type Router              | Loop Over Items                | ## 1) File Intake & Type Routing                                                                                                    |
| XLS Data Extractor          | ExtractFromFile                      | Parse XLS file into JSON records                      | File Type Router              | Loop Over Items                | ## 1) File Intake & Type Routing                                                                                                    |
| XLSX Data Extractor         | ExtractFromFile                      | Parse XLSX file into JSON records                     | File Type Router              | Loop Over Items                | ## 1) File Intake & Type Routing                                                                                                    |
| Error Message Handler       | Set                                 | Output error message for unsupported/missing files  | File Type Router              |                               | ## 1) File Intake & Type Routing                                                                                                    |
| Loop Over Items             | SplitInBatches                      | Batch processing of parsed records                    | CSV/XLS/XLSX Data Extractors  | Read Write in Data, Paper Metadata Extractor | ## 2) Per-Record Metadata Extraction: Batch process records                                                                     |
| Paper Metadata Extractor    | LangChain Agent (Google Gemini)     | Extract normalized metadata fields with LLM          | Loop Over Items               | Data Formatter                | ## 2) Per-Record Metadata Extraction                                                                                               |
| Auto-fixing Output Parser   | LangChain Output Parser              | Validate and auto-fix LLM output JSON                | Paper Metadata Extractor      | Paper Metadata Extractor      | ## 2) Per-Record Metadata Extraction                                                                                               |
| Structured Output Parser    | LangChain Output Parser              | Schema validation of metadata extraction             | Paper Metadata Extractor      | Auto-fixing Output Parser     | ## 2) Per-Record Metadata Extraction                                                                                               |
| Data Formatter             | Code                               | Format LLM output to semicolon-separated strings     | Paper Metadata Extractor      | Save to Checkpoint Sheet      | ## 2) Per-Record Metadata Extraction                                                                                               |
| Save to Checkpoint Sheet    | Google Sheets Append                | Append normalized metadata to Checkpoint sheet       | Data Formatter               | Wait for 3s.                 | ## 2) Per-Record Metadata Extraction                                                                                               |
| Wait for 3s.               | Wait                               | Pause 3 seconds between batches                       | Save to Checkpoint Sheet      | Loop Over Items               | ## 2) Per-Record Metadata Extraction                                                                                               |
| Read Write in Data          | Google Sheets Read                  | Read checkpoint data after batch append               | Loop Over Items               | Send process notication       | ## 2) Per-Record Metadata Extraction                                                                                               |
| Send process notication     | Gmail                              | Notify user on metadata normalization completion      | Read Write in Data            | call                         | ## 2) Per-Record Metadata Extraction                                                                                               |
| call                       | ExecuteWorkflow                    | Trigger next workflow step for variable extraction    | Send process notication       |                               |                                                                                                                                      |
| When Executed by Another Workflow | ExecuteWorkflowTrigger          | Trigger workflow from external call                   |                              | Get Sheet id                 | ## 3) Journal Ranking & Study Variable Extraction                                                                                   |
| Get Sheet id               | Set                                | Set sheet ID parameter for checkpoint read            | When Executed by Another Workflow | Read Checkpoint Data         | ## 3) Journal Ranking & Study Variable Extraction                                                                                   |
| Read Checkpoint Data       | Google Sheets Read                  | Read normalized metadata from checkpoint sheet        | Get Sheet id                 | WOS Field Mapper             | ## 3) Journal Ranking & Study Variable Extraction                                                                                   |
| WOS Field Mapper           | Set                                | Map fields to consistent keys for LLM input           | Read Checkpoint Data         | Batch Processor              | ## 3) Journal Ranking & Study Variable Extraction                                                                                   |
| Batch Processor            | SplitInBatches                     | Batch processing for stable LLM calls                  | WOS Field Mapper             | Journal Rank Classifier, Send done notication | ## 3) Journal Ranking & Study Variable Extraction                                                                                   |
| Journal Rank Classifier    | Code                               | Assign journal ranking flags based on source           | Batch Processor              | Academic Variables Extractor | ## 3) Journal Ranking & Study Variable Extraction                                                                                   |
| Academic Variables Extractor| LangChain Agent (Google Gemini)     | Extract study variables and summary using LLM          | Journal Rank Classifier      | Final Data Mapper            | ## 3) Journal Ranking & Study Variable Extraction                                                                                   |
| Auto-fixing Output Parser1 | LangChain Output Parser              | Validate and auto-fix LLM output JSON for variables    | Academic Variables Extractor  | Academic Variables Extractor | ## 3) Journal Ranking & Study Variable Extraction                                                                                   |
| Structured Output Parser1  | LangChain Output Parser              | Validate structured output JSON schema for variables   | Academic Variables Extractor  | Auto-fixing Output Parser1   | ## 3) Journal Ranking & Study Variable Extraction                                                                                   |
| Final Data Mapper          | Set                                | Merge metadata, rank, and variables to final structure | Academic Variables Extractor  | Save Final Results           | ## 3) Journal Ranking & Study Variable Extraction                                                                                   |
| Save Final Results         | Google Sheets AppendOrUpdate       | Append or update enriched records to FinalResult sheet | Final Data Mapper            | Wait for 3s                  | ## 3) Journal Ranking & Study Variable Extraction                                                                                   |
| Wait for 3s               | Wait                               | Pause 3 seconds to reduce API rate limiting             | Save Final Results           | Send done notication          | ## 3) Journal Ranking & Study Variable Extraction                                                                                   |
| Send done notication       | Gmail                              | Notify user of study variable extraction completion     | Wait for 3s                  |                               | ## 3) Journal Ranking & Study Variable Extraction                                                                                   |
| Sticky Note                | Sticky Note                       | Quick start and overview instructions                    |                              |                               | Contains comprehensive workflow summary and setup instructions                                                                     |
| Sticky Note1               | Sticky Note                       | Describes Block 1: File Intake & Type Routing            |                              |                               | Covers nodes for file ingestion and initial parsing                                                                                |
| Sticky Note2               | Sticky Note                       | Describes Block 2: Per-Record Metadata Extraction        |                              |                               | Covers nodes for batch metadata extraction and checkpoint saving                                                                  |
| Sticky Note3               | Sticky Note                       | Describes Block 3: Journal Ranking & Variable Extraction |                              |                               | Covers nodes for ranking, variable extraction, final mapping, and saving                                                          |
| Sticky Note5               | Sticky Note                       | Tips for resuming workflow from checkpoint on failure    |                              |                               | Advises manual trigger usage and checkpoint adjustment for recovery                                                                |
| manual trigger             | Manual Trigger                   | Manual start for recovery or rerun                         |                              | Read Checkpoint Data          | Used for manual continuation from checkpoint                                                                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create `File Upload Trigger` node**  
   - Type: LangChain Chat Trigger  
   - Enable file uploads with allowed MIME types: `text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`  
   - Output includes uploaded file binary and chat input text (used as spreadsheet title).  

2. **Create `Create spreadsheet` Google Sheets node**  
   - Operation: Create new spreadsheet  
   - Title: Use expression `={{ $json.chatInput }}` (from chat input)  
   - Sheets: Create two sheets named `Checkpoint` and `FinalResult`  
   - Connect credentials for Google Sheets OAuth2.  

3. **Create `File Type Router` Switch node**  
   - Add rules to check file extension (lowercased): `csv`, `xls`, `xlsx`  
   - Route to corresponding extractor nodes or error handler if unmatched  
   - Expression example: `={{ ( $('File Upload Trigger').item.json.files?.[0]?.fileExtension || '' ).toLowerCase() }}`  

4. **Create `CSV Data Extractor` node**  
   - Type: ExtractFromFile  
   - Operation: `csv`  
   - Binary property: `={{ $('File Upload Trigger').item.binary.data0 }}`  
   - Encoding: UTF-8  
   - On error: Continue regular output  

5. **Create `XLS Data Extractor` node**  
   - Type: ExtractFromFile  
   - Operation: `xls`  
   - Binary property: same as above  
   - On error: Continue regular output  

6. **Create `XLSX Data Extractor` node**  
   - Type: ExtractFromFile  
   - Operation: `xlsx`  
   - Binary property: same as above  
   - On error: Continue regular output  

7. **Create `Error Message Handler` node**  
   - Type: Set  
   - Set field `output` to string `"Pls attach a file"`  

8. **Connect `File Upload Trigger` → `Create spreadsheet` → `File Type Router`**  
   - Connect each router output to corresponding extractor or error handler node  

9. **Create `Loop Over Items` node**  
   - Type: SplitInBatches  
   - Batch size: 10  
   - Connect extractor nodes to this node  

10. **Create `Paper Metadata Extractor` node**  
    - Type: LangChain Agent (Google Gemini)  
    - Prompt text: JSON stringify each record  
    - System prompt: Extract `authors`, `title`, `abstract`, `publication_date`, `source` as strict JSON, with rules for missing values and validation  
    - Enable output parser and auto-fixing output parser  
    - Credentials: Google Gemini API  

11. **Create `Auto-fixing Output Parser` and `Structured Output Parser` nodes**  
    - Configure parsers to validate the exact JSON schema for metadata  
    - Connect parsers in chain to `Paper Metadata Extractor`  

12. **Create `Data Formatter` node**  
    - Type: Code node with JS to convert authors array to semicolon-separated string and ensure null defaults for missing fields  
    - Input: Output from `Paper Metadata Extractor`  

13. **Create `Save to Checkpoint Sheet` node**  
    - Type: Google Sheets Append  
    - Sheet name: Use expression for `Checkpoint` tab in created spreadsheet  
    - Document ID: Use expression from created spreadsheet  
    - Map metadata columns automatically  

14. **Create `Wait for 3s.` node**  
    - Type: Wait  
    - Amount: 3 seconds  

15. **Connect `Loop Over Items` → `Paper Metadata Extractor` → parsers → `Data Formatter` → `Save to Checkpoint Sheet` → `Wait for 3s.` → back to `Loop Over Items`**  
    - This creates the processing batch loop  

16. **Create `Read Write in Data` node**  
    - Type: Google Sheets Read  
    - Read from `Checkpoint` sheet of created spreadsheet  
    - Connect from `Loop Over Items` for notification  

17. **Create `Send process notication` Gmail node**  
    - Send email on completion of metadata normalization with summary info and timestamp  
    - Use Gmail OAuth2 credentials  

18. **Create `call` ExecuteWorkflow node**  
    - Trigger next workflow step for variable extraction, passing `GoogleSheetID`  

19. **Create second workflow or extend current with:**  

20. **Create `When Executed by Another Workflow` trigger node**  
    - Accept input `GoogleSheetID` parameter  

21. **Create `Get Sheet id` Set node**  
    - Set variable `ID` from input `GoogleSheetID`  

22. **Create `Read Checkpoint Data` Google Sheets Read node**  
    - Read `Checkpoint` sheet by document ID  

23. **Create `WOS Field Mapper` Set node**  
    - Map raw checkpoint fields to consistent keys for LLM input (Authors, Title, Publication_date, Source, Abstract)  

24. **Create `Batch Processor` SplitInBatches node**  
    - Batch size: 10  

25. **Create `Journal Rank Classifier` Code node**  
    - Implement journal name uppercase matching against built-in UTD24 and FT50 sets  
    - Output `Rank` field with values: `UTD24`, `FT50`, `UTD24 & FT50`, `Not listed`  

26. **Create `Academic Variables Extractor` LangChain Agent node**  
    - Input: Title and Abstract fields  
    - System prompt: Extract study variables and summary as strict JSON schema  
    - Use output parser and auto-fixing parser nodes configured similarly to metadata extractor  

27. **Create `Final Data Mapper` Set node**  
    - Merge metadata, rank, and extracted variables into final output JSON for Google Sheets  

28. **Create `Save Final Results` Google Sheets AppendOrUpdate node**  
    - Target `FinalResult` sheet  
    - Append or update rows from final data  

29. **Create `Wait for 3s` Wait node after saving**  

30. **Create `Send done notication` Gmail node**  
    - Notify user of study variable extraction completion  

31. **Connect nodes from `When Executed by Another Workflow` → `Get Sheet id` → `Read Checkpoint Data` → `WOS Field Mapper` → `Batch Processor` → `Journal Rank Classifier` → `Academic Variables Extractor` → parsers → `Final Data Mapper` → `Save Final Results` → `Wait for 3s` → `Send done notication`**

32. **Add manual trigger node for workflow recovery with instructions**  
    - To restart from checkpoint in case of failure, disable auto trigger and run manually  

---

### 5. General Notes & Resources

| Note Content                                                                                                                        | Context or Link                                                                                 |
|------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| 🚀 Quick start and workflow overview with credential setup instructions and usage tips.                                            | Sticky Note at position [-2848,208]                                                             |
| Warning: Make sure uploaded files include abstracts for meaningful variable extraction.                                            | Sticky Note and general workflow note                                                           |
| If CSV files yield no parsed records, consider encoding issues; converting to XLS/XLSX may resolve.                               | Sticky Note                                                                                     |
| To avoid token waste and interruptions during multiple LLM calls, a `checkpoint` sheet is used for incremental saving and recovery.| Sticky Note at position [-2800,1168]                                                             |
| Journal ranking uses hard-coded UTD24 and FT50 journal lists for classification in code node.                                      | See Journal Rank Classifier code node                                                           |
| Google Gemini API credentials required for LLM nodes; Google Sheets OAuth2 for sheet access; Gmail OAuth2 for notification emails.| Credentials setup required                                                                      |
| For more details on n8n nodes and LangChain integration see https://docs.n8n.io/ and https://js.langchain.com/docs/               | External documentation resources                                                                |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected material. All data handled is legal and publicly available.