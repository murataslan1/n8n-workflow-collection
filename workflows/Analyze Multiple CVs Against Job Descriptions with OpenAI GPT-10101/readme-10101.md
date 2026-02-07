Analyze Multiple CVs Against Job Descriptions with OpenAI GPT

https://n8nworkflows.xyz/workflows/analyze-multiple-cvs-against-job-descriptions-with-openai-gpt-10101


# Analyze Multiple CVs Against Job Descriptions with OpenAI GPT

### 1. Workflow Overview

This workflow, named **"AI Recruiter – Multi-CV Analyzer"**, automates the process of analyzing multiple candidate CVs against a single Job Description (JD) using OpenAI GPT technology. It targets recruiters and HR professionals who want to efficiently evaluate many CVs for job openings, providing detailed fit scores, domain matching, and recommendations.

The workflow is logically divided into three main blocks:

- **1.1 Input Reception & File Handling:** Receives the Job Description and multiple CV files via a webhook, extracts file metadata and base64 content, and detects whether each CV PDF is text-based or scanned.

- **1.2 Text Extraction & Candidate Metadata Preparation:** Converts base64 files into binary, extracts readable text from PDFs, reattaches metadata (JD, filename, candidate name, role), and combines all CV data into a structured array for AI processing.

- **1.3 AI Processing & Output Handling:** Uses a LangChain-based AI agent with OpenAI GPT to analyze and score each CV against the JD, parses the AI output to select the top candidate, and responds to the webhook request with a comprehensive JSON result.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Input Reception & File Handling

**Overview:**  
This block accepts incoming HTTP POST requests containing a job description and multiple CV files. It extracts filenames and base64-encoded file data, then determines if each PDF is text-based or scanned, to decide the appropriate extraction approach.

**Nodes Involved:**  
- Webhook  
- List_File (Code)  
- Detect PDF Type (Code)  
- If (Conditional)

**Node Details:**

- **Webhook**  
  - *Type & Role:* HTTP POST entry point to receive JD and CV files.  
  - *Configuration:* Path `chat-new`, allows all origins, method POST, returns response after processing.  
  - *Input/Output:* Receives JSON body with JD and files; outputs body to next node.  
  - *Edge Cases:* Missing files or invalid formats may cause errors; open origin may require security considerations.

- **List_File**  
  - *Type & Role:* Code node to parse incoming JSON body, extracting JD text and file metadata (name and base64).  
  - *Key Logic:* Maps each file to an item with JD, index, filename, and base64 content.  
  - *Input/Output:* Input JSON body; outputs array of files with metadata.  
  - *Edge Cases:* Handles empty files array gracefully by outputting empty list.

- **Detect PDF Type**  
  - *Type & Role:* Code node, executed per file, detects if PDF is text-based or scanned image.  
  - *Key Logic:* Converts base64 to buffer, attempts UTF-8 text extraction, uses regex to detect readable text presence.  
  - *Outputs:* `pdf_type` field: "text", "scan", "unknown", or "error" with notes.  
  - *Edge Cases:* Base64 absence or decoding errors handled with warning notes.

- **If**  
  - *Type & Role:* Conditional filter to branch workflow based on `pdf_type === "text"`.  
  - *Usage:* Allows differentiated processing if PDF is text-based or not.  
  - *Edge Cases:* If `pdf_type` is unknown or error, the workflow follows the false branch (which here leads back to binary conversion).

---

#### 2.2 Text Extraction & Candidate Metadata Preparation

**Overview:**  
This block converts base64 PDFs to binary, extracts text from PDFs, and enriches extracted text with metadata such as JD, filename, candidate name, and inferred role type. It then aggregates all candidate CVs into a single array optimized for AI analysis.

**Nodes Involved:**  
- Convert Base64 to Binary (Code)  
- Loop Over Items (SplitInBatches)  
- Extract from File (Extract PDF Text)  
- Reattach_Metadata_After_Extract (Code)  
- Combine_Candidates_For_AI (Code)  
- Preprocess_CV_Names (Code)

**Node Details:**

- **Convert Base64 to Binary**  
  - *Role:* Transforms base64 string of each CV into binary format for PDF text extraction.  
  - *Logic:* If base64 missing, returns a note; otherwise returns binary data with MIME type and filename.  
  - *Input/Output:* Input contains base64; output includes binary data for file extraction.  
  - *Edge Cases:* Missing base64 handled with warning message.

- **Loop Over Items**  
  - *Role:* Splits processing to handle each CV file individually through subsequent nodes.  
  - *Input/Output:* Takes the list of binary files and processes them one by one.

- **Extract from File**  
  - *Role:* Natively extracts text content from PDF binary files.  
  - *Input/Output:* Receives binary PDF; outputs extracted text and metadata.  
  - *Edge Cases:* Scanned PDFs with no text layer will result in empty extraction.

- **Reattach_Metadata_After_Extract**  
  - *Role:* Code node to reattach original JD, filename, and enrich extracted text by detecting candidate name, position, and role type using regex and heuristics.  
  - *Key Expressions:*  
    - Uses regex for full names (Vietnamese and accented characters), abbreviated names, and info blocks.  
    - Extracts candidate position by matching job title keywords.  
    - Categorizes role into Manager, Functional, Technical, Admin, or Other based on position keywords.  
  - *Input/Output:* Inputs all extracted text and metadata; outputs enriched JSON per CV.  
  - *Edge Cases:* If no candidate name detected, sets to null; also handles missing or malformed text gracefully.

- **Combine_Candidates_For_AI**  
  - *Role:* Aggregates all enriched CV JSONs into a single payload with the JD and a candidates array for AI processing.  
  - *Logic:* Extracts a raw candidate name line from the first few lines of CV text, excluding common header terms like “CV”, “Thông tin cá nhân”.  
  - *Input/Output:* Combines multiple CV items into one object with JD and candidates[].  
  - *Edge Cases:* Handles empty or missing text; retains fallback candidate names.

- **Preprocess_CV_Names**  
  - *Role:* Further refines candidate names by selecting the first valid line in CV text excluding certain keywords, preserving original formatting and accents.  
  - *Logging:* Outputs debug console logs for filenames and extracted names.  
  - *Input/Output:* Receives combined candidates and updates candidate_name fields before AI analysis.  
  - *Edge Cases:* Empty or noisy CVs handled by fallback empty string.

---

#### 2.3 AI Processing & Output Handling

**Overview:**  
This block leverages OpenAI GPT (LangChain agent) to analyze the JD and each candidate CV, scoring fit and generating detailed assessments. It then parses and normalizes AI output, selects the best candidate, and responds to the original webhook request with JSON results.

**Nodes Involved:**  
- OpenAI Chat Model  
- AI Recruiter Agent (LangChain Agent)  
- Parse Recruiter Output (Code)  
- Respond to Webhook

**Node Details:**

- **OpenAI Chat Model**  
  - *Role:* Calls OpenAI GPT model (gpt-4o-mini), feeding in the AI prompt defined in AI Recruiter Agent.  
  - *Credentials:* Uses configured OpenAI API credentials.  
  - *Input/Output:* Receives prompt text; outputs raw AI response for agent.  
  - *Edge Cases:* Network or API errors, rate limits.

- **AI Recruiter Agent**  
  - *Role:* Main AI logic node that constructs the prompt with JD and candidates, instructing GPT to analyze and score each CV precisely per defined ontology and rules.  
  - *Prompt Highlights:*  
    - Detailed job and CV domain ontology and matching rules.  
    - Strict rules on candidate name extraction and no fabrication.  
    - Scoring logic and output JSON schema.  
    - Output in Vietnamese, preserving technical terms.  
  - *Input/Output:* Receives combined JD and candidates; outputs JSON array with analysis.  
  - *Edge Cases:* Model hallucination risk mitigated by strict prompt rules; malformed input data may cause parsing errors.

- **Parse Recruiter Output**  
  - *Role:* Parses AI JSON output string robustly, normalizes domain matching, and applies tie-breaker logic to select best candidate.  
  - *Key Logic:*  
    - Fixes domain_match flags if inconsistent.  
    - Filters qualified candidates (fit_score ≥ 70).  
    - Tie-breaker criteria: fit_score, domain equality, domain similarity, matched keywords count, years of experience.  
    - Builds summary text accordingly.  
  - *Input/Output:* Takes AI output; returns structured summary and candidate list.  
  - *Edge Cases:* Handles JSON parsing failures and malformed AI output gracefully.

- **Respond to Webhook**  
  - *Role:* Final node to send back the entire processed JSON result to the original HTTP POST requester.  
  - *Configuration:* Returns HTTP 200 with proper CORS headers.  
  - *Edge Cases:* Network interruptions or client disconnects.

---

### 3. Summary Table

| Node Name                    | Node Type                  | Functional Role                                 | Input Node(s)                | Output Node(s)              | Sticky Note                                                                                         |
|------------------------------|----------------------------|------------------------------------------------|-----------------------------|-----------------------------|---------------------------------------------------------------------------------------------------|
| Webhook                      | Webhook                    | Entry point for JD + CV files                   |                             | List_File                   | 🟩 Step 1: Upload Files (JD + CVs) - Webhook node receives one JD and multiple CV files.           |
| List_File                    | Code                       | Extract filenames and base64 data from files   | Webhook                     | Detect PDF Type             |                                                                                                   |
| Detect PDF Type              | Code                       | Detect PDF type: text-based or scanned          | List_File                   | If                         |                                                                                                   |
| If                          | If                         | Branch based on PDF type (text or scan)         | Detect PDF Type             | Convert Base64 to Binary    |                                                                                                   |
| Convert Base64 to Binary     | Code                       | Convert base64 strings to binary for extraction | If                         | Loop Over Items             | 🟨 Step 2: Extract & Merge Text - Convert Base64 to Binary prepares each CV for text extraction.   |
| Loop Over Items              | SplitInBatches             | Process each CV file individually                | Convert Base64 to Binary    | Extract from File, Replace Me|                                                                                                   |
| Extract from File            | ExtractFromFile             | Extract text content from PDF binary             | Loop Over Items             | Reattach_Metadata_After_Extract |                                                                                                   |
| Replace Me                  | NoOp                       | Placeholder node for connection management      | Loop Over Items             | Loop Over Items             |                                                                                                   |
| Reattach_Metadata_After_Extract | Code                   | Reattach JD/filename and extract candidate metadata | Extract from File           | Combine_Candidates_For_AI   |                                                                                                   |
| Combine_Candidates_For_AI    | Code                       | Aggregate all CVs into candidates array          | Reattach_Metadata_After_Extract | Preprocess_CV_Names       |                                                                                                   |
| Preprocess_CV_Names          | Code                       | Refine candidate names from CV text               | Combine_Candidates_For_AI   | AI Recruiter Agent          |                                                                                                   |
| OpenAI Chat Model            | LangChain OpenAI LM Chat   | Call OpenAI GPT model                             | AI Recruiter Agent (LM input) | AI Recruiter Agent (LM output) |                                                                                                   |
| AI Recruiter Agent           | LangChain Agent            | Analyze JD vs CVs using GPT prompt                | Preprocess_CV_Names         | Parse Recruiter Output      | 🟦 Step 3: AI Analysis & Output - AI Recruiter Agent compares JD vs. CVs and generates insights.   |
| Parse Recruiter Output       | Code                       | Parse and normalize AI output, select best CV    | AI Recruiter Agent          | Respond to Webhook          |                                                                                                   |
| Respond to Webhook           | RespondToWebhook           | Return JSON result to requester                    | Parse Recruiter Output      |                             |                                                                                                   |
| Sticky Note                  | StickyNote                 | Documentation notes                               |                             |                             | See above sticky note contents                                                                     |
| Sticky Note1                 | StickyNote                 | Documentation notes                               |                             |                             |                                                                                                   |
| Sticky Note2                 | StickyNote                 | Documentation notes                               |                             |                             |                                                                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `chat-new`  
   - Allowed Origins: `*`  
   - Response Mode: `responseNode` (to respond after processing)

2. **Create List_File Code Node**  
   - Purpose: Extract `jd` text and array of files from webhook body.  
   - Code: Map each file to JSON with `jd`, `index`, `filename`, and `base64` string (extracted from data URI).

3. **Create Detect PDF Type Code Node**  
   - Run for each item (one per CV)  
   - Logic: Decode base64, convert to buffer, try extracting UTF-8 text, check if text is readable to classify as `"text"` or `"scan"`.  
   - Output: Add `pdf_type` (`text`/`scan`), keep base64 for next steps.

4. **Create If Node**  
   - Condition: `$json["pdf_type"] === "text"`  
   - True branch leads to binary conversion; false branch can be handled similarly or skipped (here it continues to binary conversion).

5. **Create Convert Base64 to Binary Code Node**  
   - Run once per item  
   - Convert base64 string to binary buffer for PDF extraction.  
   - Attach metadata (`jd`, `index`, `filename`) in JSON output with binary in binary property.

6. **Create Loop Over Items Node (SplitInBatches)**  
   - Use to process each CV separately for extraction.

7. **Create Extract from File Node**  
   - Operation: PDF text extraction from binary input.

8. **Create Reattach_Metadata_After_Extract Code Node**  
   - For each extracted text:  
     - Reattach original JD and filename.  
     - Extract candidate name with regex targeting Vietnamese full names and common patterns.  
     - Extract candidate position from title keywords.  
     - Classify role type (Manager, Functional, Technical, Admin, Other).  
     - Output enriched JSON for each CV.

9. **Create Combine_Candidates_For_AI Code Node**  
   - Combine all CVs into one JSON with JD and candidates array.  
   - Extract raw candidate name line from first lines of CV text, avoiding headers like “CV” or “Thông tin cá nhân”.

10. **Create Preprocess_CV_Names Code Node**  
    - Refine candidate name extraction by filtering first valid line excluding common non-name headers.  
    - Preserve original format and accents.

11. **Create AI Recruiter Agent Node (LangChain Agent)**  
    - Input: Combined JD + candidates JSON.  
    - Configuration: Use prompt with detailed Vietnamese instructions for domain matching, scoring, and output formatting.  
    - Model: GPT-4o-mini (or equivalent capable of Vietnamese and structured reasoning).  
    - Credentials: OpenAI API configured.

12. **Create OpenAI Chat Model Node**  
    - Used internally by AI Recruiter Agent to call GPT model.

13. **Create Parse Recruiter Output Code Node**  
    - Parse AI output string robustly (handle double-encoded JSON).  
    - Normalize domain_match flags.  
    - Select best candidate using tie-break rules (fit_score, domain equality, keyword count, experience).  
    - Create summary text accordingly.

14. **Create Respond to Webhook Node**  
    - Return final JSON results with HTTP 200 and CORS headers.

15. **Connect Nodes in Order:**  
    Webhook → List_File → Detect PDF Type → If → Convert Base64 to Binary → Loop Over Items → Extract from File → Reattach_Metadata_After_Extract → Combine_Candidates_For_AI → Preprocess_CV_Names → AI Recruiter Agent → Parse Recruiter Output → Respond to Webhook

16. **Sticky Notes:**  
    - Add descriptive sticky notes for each major step for clarity and maintenance.

---

### 5. General Notes & Resources

| Note Content                                                                                                                | Context or Link                                                                                     |
|-----------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| The workflow strictly enforces no name fabrication and requires all insights to be based on actual CV content.              | Core ethical and functional guideline embedded in AI prompt.                                     |
| Vietnamese language is mandatory for all AI generated explanations, preserving technical terms untranslated.                | Ensures local language usability with accurate domain knowledge retention.                         |
| Domain ontology and scoring logic are explicitly defined in the prompt for consistent AI reasoning.                         | Detailed in the AI Recruiter Agent node prompt for robust domain matching and scoring accuracy.   |
| The workflow supports scanned PDFs by detecting file type but does not perform OCR; scanned PDFs will have empty text.     | Detect PDF Type node identifies scan vs text; scanned PDFs may result in zero fit_score.           |
| The workflow is designed with modular nodes to allow easy extension, e.g., adding OCR or other file processing nodes.       | Modular design facilitates future improvements or integration with other systems.                  |
| For detailed domain ontology and scoring rules, see the AI Recruiter Agent prompt within the workflow JSON.                  | Core knowledge base for the AI’s scoring and classification logic.                                |

---

**Disclaimer:**  
The provided text and workflow come exclusively from an automated n8n workflow. This processing strictly complies with content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.