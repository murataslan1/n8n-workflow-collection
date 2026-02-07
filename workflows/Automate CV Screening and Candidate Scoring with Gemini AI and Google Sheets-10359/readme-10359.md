Automate CV Screening and Candidate Scoring with Gemini AI and Google Sheets

https://n8nworkflows.xyz/workflows/automate-cv-screening-and-candidate-scoring-with-gemini-ai-and-google-sheets-10359


# Automate CV Screening and Candidate Scoring with Gemini AI and Google Sheets

---
### 1. Workflow Overview

This workflow automates the screening and scoring of job candidates by comparing their form-submitted answers with their uploaded CV content using Google Gemini AI and Google Sheets. It targets HR teams or recruiters who want to streamline candidate evaluation for a Senior Software Engineer role by validating the consistency between claimed skills/experience and the actual CV, then scoring candidates for job fit.

The workflow is logically divided into these blocks:

- **1.1 Input Reception:** Captures candidate form submission including personal details, skills, job history, and CV upload.
- **1.2 CV File Handling:** Uploads the candidate's CV PDF to Google Drive, downloads it, and extracts plain text.
- **1.3 Data Merging & Preparation:** Combines form data and extracted CV text into a single data object for AI processing.
- **1.4 AI Processing & Scoring:** Sends combined data to a Google Gemini AI agent to analyze consistency and job fit, producing detailed scores and summaries.
- **1.5 AI Results Parsing:** Processes AI JSON output to extract scores and summaries.
- **1.6 Data Persistence & Ranking:** Saves candidate scores to Google Sheets, retrieves all saved data, sorts candidates by final score, clears the sheet, and rewrites sorted data for reporting.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:** Receives candidate application via a form with fields for name, email, skills, job history, and CV PDF upload.
- **Nodes Involved:**  
  - On form submission  
  - Upload CV to Drive  
  - Sticky Note9 (instruction)  
  - Sticky Note10 (instruction)

- **Node Details:**

  - **On form submission**  
    - Type: Form Trigger  
    - Role: Entry point; triggers workflow on form submission for "Senior Software Engineer Application" with required fields including a PDF CV upload  
    - Key Config: Form fields mapped for name, email, skills, job history, and one PDF file upload  
    - Input: External user form submission  
    - Output: Form data passed downstream including the CV file  
    - Failures: Missing required fields, bad file format, webhook unavailability

  - **Upload CV to Drive**  
    - Type: Google Drive node  
    - Role: Saves uploaded CV file to a specific Google Drive folder for storage and later processing  
    - Config: Uses OAuth2 credentials, targets specific Drive folder, names file based on uploaded file name from form  
    - Input: CV file from form submission  
    - Output: File metadata including Google Drive file ID  
    - Failures: Auth errors, upload failures, invalid folder ID

---

#### 1.2 CV File Handling

- **Overview:** Downloads the stored CV file from Google Drive and extracts text content from the PDF for analysis.
- **Nodes Involved:**  
  - Download CV  
  - Extract CV Text  
  - Sticky Note13 (instruction)

- **Node Details:**

  - **Download CV**  
    - Type: Google Drive node  
    - Role: Downloads the CV file using the file ID obtained from the upload step  
    - Config: Operation set to "download" with input fileId from previous upload node output  
    - Input: Google Drive file ID  
    - Output: Binary data of CV PDF  
    - Failures: File not found, permission denied, network/timeouts

  - **Extract CV Text**  
    - Type: Extract From File node  
    - Role: Converts PDF binary data into plain text for content analysis  
    - Config: Operation set to "pdf" extraction  
    - Input: Binary PDF file data from Download CV  
    - Output: Plain text string of CV content  
    - Failures: Unsupported PDF formats, extraction errors

---

#### 1.3 Data Merging & Preparation

- **Overview:** Merges form submission data and extracted CV text into a single JSON object to prepare for AI analysis.
- **Nodes Involved:**  
  - Merge Form + CV1  
  - Comparison Data (Code node)  
  - Sticky Note (Merge explanation)  
  - Sticky Note1 (Comparison explanation)

- **Node Details:**

  - **Merge Form + CV1**  
    - Type: Merge node  
    - Role: Combines two input streams — form data and CV text — using "combineAll" mode to form one output  
    - Input: Form submission data and CV extraction text  
    - Output: Combined data for further processing  
    - Failures: Missing or incomplete inputs can lead to empty or partial data

  - **Comparison Data**  
    - Type: Code node (JavaScript)  
    - Role: Extracts relevant fields from merged data; structures candidate name, email, claimed skills/job history, and actual CV content into a consolidated JSON object for AI input  
    - Key Expressions: Accesses form fields and CV text, ensures CV text length threshold for validity  
    - Input: Output from Merge node  
    - Output: JSON object with candidate data and CV content  
    - Failures: Missing form fields, CV text too short or absent

---

#### 1.4 AI Processing & Scoring

- **Overview:** Uses Google Gemini Chat Model to analyze combined candidate data, comparing form claims vs CV content, scoring consistency and job fit, and generating detailed JSON results.
- **Nodes Involved:**  
  - Google Gemini Chat Model1  
  - AI Comparison & Scoring (Langchain Agent node)  
  - Sticky Note2 (AI agent explanation)

- **Node Details:**

  - **Google Gemini Chat Model1**  
    - Type: Langchain Google Gemini LLM Chat model  
    - Role: Provides AI language model backend for the Langchain Agent node  
    - Config: Requires Google Palm API credentials configured with Gemini access  
    - Input: Prompt and context from AI Comparison & Scoring node  
    - Output: AI-generated response  
    - Failures: API auth errors, quota limits, network issues

  - **AI Comparison & Scoring**  
    - Type: Langchain Agent node  
    - Role: Core AI evaluation engine; sends detailed instructions with candidate data to Gemini model, requesting strict JSON output including consistency score, job fit score, and final score along with qualitative summary fields  
    - Config: Uses system message to enforce professional HR analyst behavior; prompt includes detailed comparison and scoring instructions  
    - Input: Combined candidate data JSON  
    - Output: AI response text with JSON embedded  
    - Failures: AI response parsing errors, no valid JSON output, timeouts

---

#### 1.5 AI Results Parsing

- **Overview:** Parses the AI output text to extract JSON scores and summaries, handling errors gracefully.
- **Nodes Involved:**  
  - Parse AI Results (Code node)  
  - Getting Score (Code node)  
  - Sticky Note3 (Parsing explanation)

- **Node Details:**

  - **Parse AI Results**  
    - Type: Code node (JavaScript)  
    - Role: Extracts JSON object from AI output text, supports parsing JSON embedded in markdown code blocks or fallback regex parsing  
    - Error Handling: On parse failure, sets default error messages in output fields  
    - Input: AI response text from AI Comparison & Scoring node  
    - Output: JSON with scores and qualitative fields  
    - Failures: Malformed AI output, empty or incomplete responses

  - **Getting Score**  
    - Type: Code node (JavaScript)  
    - Role: Reformats parsed AI result into a table-like JSON structure for easier Google Sheets mapping  
    - Input: Parsed AI result JSON  
    - Output: Structured score data including candidate name, consistency score, job fit score, final score  
    - Failures: Missing fields, empty input

---

#### 1.6 Data Persistence & Ranking

- **Overview:** Saves candidate scores to Google Sheets, retrieves all records, sorts candidates by final score descending, clears sheet, and writes sorted data back for reporting.
- **Nodes Involved:**  
  - Save to Sheets  
  - Get All Rows  
  - Sort by Final Score (Code node)  
  - Clear Sheet  
  - Write Sorted Data  
  - Sticky Note4 to Sticky Note8 (instructions for saving, sorting, clearing)

- **Node Details:**

  - **Save to Sheets**  
    - Type: Google Sheets node  
    - Role: Appends new candidate score data to Google Sheet  
    - Config: Maps candidate name, email, scores, and qualitative fields to defined columns; uses OAuth2 credentials  
    - Input: Score data from Getting Score node combined with candidate email/name from Comparison Data node  
    - Output: Confirmation of append operation  
    - Failures: Auth errors, rate limits, schema mismatch

  - **Get All Rows**  
    - Type: Google Sheets node  
    - Role: Reads all rows from the scoring sheet to allow sorting  
    - Input: None (reads whole sheet)  
    - Output: Array of all candidate rows  
    - Failures: Auth errors, empty sheet

  - **Sort by Final Score**  
    - Type: Code node  
    - Role: Sorts all fetched rows descending by final_score to rank candidates  
    - Input: Rows from Get All Rows  
    - Output: Sorted array of candidate data  
    - Failures: Missing or non-numeric final_score values

  - **Clear Sheet**  
    - Type: Google Sheets node  
    - Role: Clears existing sheet content to prepare for sorted rewrite  
    - Input: Triggered after sorting  
    - Output: Confirmation of clear operation  
    - Failures: Auth errors, concurrent edits

  - **Write Sorted Data**  
    - Type: Google Sheets node  
    - Role: Writes sorted candidate data back into Google Sheet, appending or updating records  
    - Config: Maps all relevant columns including name, email, educational qualifications, job history, skill set, justification, consistency check, and final score  
    - Input: Sorted candidate array from Sort by Final Score node  
    - Output: Updated Google Sheet with ranked candidates  
    - Failures: Auth errors, data mapping issues

---

### 3. Summary Table

| Node Name             | Node Type                        | Functional Role                          | Input Node(s)              | Output Node(s)             | Sticky Note                           |
|-----------------------|---------------------------------|----------------------------------------|----------------------------|----------------------------|-------------------------------------|
| On form submission    | Form Trigger                    | Entry point, captures candidate form   | External form submission    | Upload CV to Drive, Merge Form + CV1 | Form TRIGGER: Put answers and upload CV |
| Upload CV to Drive    | Google Drive                   | Uploads CV PDF to Google Drive folder  | On form submission          | Download CV                | UPLOAD THE FILE: Incoming CV uploaded to Drive and named from sender |
| Download CV           | Google Drive                   | Downloads CV PDF from Drive             | Upload CV to Drive          | Extract CV Text            |                                     |
| Extract CV Text       | Extract From File              | Extracts plain text from PDF CV         | Download CV                 | Merge Form + CV1           | EXTRACT FROM FILE: Converts CV PDF to text |
| Merge Form + CV1      | Merge                         | Combines form data and CV text          | Upload CV to Drive, Extract CV Text | Comparison Data           | Merge node to combine CV and form answers |
| Comparison Data       | Code                          | Prepares consolidated JSON for AI       | Merge Form + CV1            | AI Comparison & Scoring    | Compare incoming form answers and CV data |
| Google Gemini Chat Model1 | Langchain AI Model            | Provides AI language model backend      | AI Comparison & Scoring     | AI Comparison & Scoring (as language model) | AI Agent node: Write summary based on compare data |
| AI Comparison & Scoring | Langchain Agent               | Sends data to AI, gets scoring & analysis | Comparison Data             | Parse AI Results           |                                     |
| Parse AI Results      | Code                          | Parses AI output JSON, handles errors   | AI Comparison & Scoring     | Getting Score              | Code node: Get AI results and mark score |
| Getting Score         | Code                          | Formats parsed results for Sheets       | Parse AI Results            | Save to Sheets             |                                     |
| Save to Sheets        | Google Sheets                 | Saves candidate scoring data            | Getting Score, Comparison Data | Get All Rows              | Save data in Google Sheet            |
| Get All Rows          | Google Sheets                 | Reads all candidate data                 | Save to Sheets              | Sort by Final Score        | Get all the rows                    |
| Sort by Final Score   | Code                          | Sorts data by final score descending    | Get All Rows                | Clear Sheet                | Sort the data based on scoring      |
| Clear Sheet           | Google Sheets                 | Clears Google Sheet for fresh write     | Sort by Final Score         | Write Sorted Data          | Clear sheet and save data sorted    |
| Write Sorted Data     | Google Sheets                 | Writes sorted candidate data             | Clear Sheet                 |                            |                                     |
| Sticky Note9          | Sticky Note                   | Instruction: Form trigger explanation   |                            |                            | Form TRIGGER: Put the Answers of Question on the form and upload the CV |
| Sticky Note10         | Sticky Note                   | Instruction: Upload file explanation    |                            |                            | UPLOAD THE FILE: Incoming attachment (CV) is uploaded to Drive |
| Sticky Note13         | Sticky Note                   | Instruction: Extract from file explanation |                            |                            | EXTRACT FROM FILE: Extract CV to plain text |
| Sticky Note            | Sticky Note                   | Instruction: Merge explanation           |                            |                            | Merge node to combine the CV data and Answers of Question |
| Sticky Note1           | Sticky Note                   | Instruction: Comparison explanation      |                            |                            | Compare the incoming data "Answers of Question and the CV data" |
| Sticky Note2           | Sticky Note                   | Instruction: AI agent explanation        |                            |                            | AI Agent node: Write the summary on the basis of compare data |
| Sticky Note3           | Sticky Note                   | Instruction: Code node parsing results   |                            |                            | Code node: Get the AI Results and mark the score |
| Sticky Note4           | Sticky Note                   | Instruction: Save data in Sheets         |                            |                            | Save data in the google sheet       |
| Sticky Note5           | Sticky Note                   | Instruction: Get all rows                 |                            |                            | Get all the rows                    |
| Sticky Note6           | Sticky Note                   | Instruction: Sort data                    |                            |                            | Sort the data based on the scoring  |
| Sticky Note7           | Sticky Note                   | Instruction: Clear and rewrite sheet     |                            |                            | Clear the sheet and again save data based on scoring |
| Sticky Note8           | Sticky Note                   | Workflow title banner                     |                            |                            | # Automated AI-Powered CV Screening and Candidate Scoring System |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Form Trigger node**  
   - Type: Form Trigger  
   - Configure form titled "Senior Software Engineer Application" with fields: Name (required), Email (required), Skills (textarea, required), Job History (textarea, required), Upload CV (file upload, PDF only, required, single file)  
   - This node triggers on form submission.

2. **Create Google Drive node to upload CV**  
   - Type: Google Drive  
   - Operation: Upload  
   - Folder: Specify folder ID where CVs will be stored  
   - File Name: Use expression to name file after uploaded file name: `={{ $json['Upload CV'] }}`  
   - Credentials: Configure Google Drive OAuth2 credentials  
   - Connect output of Form Trigger to this node.

3. **Create Google Drive node to download CV**  
   - Type: Google Drive  
   - Operation: Download  
   - File ID: Use expression `={{ $json.id }}` from Upload CV output  
   - Credentials: Use same Google Drive OAuth2 credentials  
   - Connect Upload CV node output to this node.

4. **Create Extract From File node**  
   - Type: Extract From File  
   - Operation: PDF  
   - Input: Use binary data from Download CV node  
   - Connect Download CV output to this node.

5. **Create Merge node**  
   - Type: Merge  
   - Mode: Combine  
   - Combine By: combineAll  
   - Connect outputs of Form Trigger and Extract From File nodes to this node (Form Trigger to input 1, Extract From File to input 2).

6. **Create Code node "Comparison Data"**  
   - Type: Code  
   - Language: JavaScript  
   - Purpose: Extract candidate name, email, claimed skills and job history from form, plus extracted CV text; output a single JSON object with these fields  
   - Connect Merge node output to this node.

7. **Create Langchain Google Gemini Chat Model node**  
   - Type: Langchain LM Chat Google Gemini  
   - Credentials: Configure Google Palm API credentials with Gemini access  
   - No specific parameters needed here; this node serves as AI backend  
   - This node will be linked to the Langchain Agent node.

8. **Create Langchain Agent node "AI Comparison & Scoring"**  
   - Type: Langchain Agent  
   - Configure prompt text with detailed instructions to compare form and CV data, analyze consistency and job fit, and produce strict JSON output as per example in the prompt  
   - System message: Define professional HR analyst role, enforce JSON output  
   - Connect output of "Comparison Data" node to this agent node  
   - Link this agent node to the Google Gemini Chat Model node for LLM backend

9. **Create Code node "Parse AI Results"**  
   - Type: Code  
   - Purpose: Extract JSON from AI response text, parse scores and summaries, handle errors by fallback regex parsing  
   - Connect AI Comparison & Scoring node output to this node.

10. **Create Code node "Getting Score"**  
    - Type: Code  
    - Purpose: Format parsed AI JSON into a table-like JSON with candidate name and scores for Google Sheets  
    - Connect Parse AI Results output to this node.

11. **Create Google Sheets node "Save to Sheets"**  
    - Type: Google Sheets  
    - Operation: Append  
    - Document: Specify Google Sheets document ID for candidate data  
    - Sheet: Select sheet (gid=0 or name)  
    - Map columns: candidate_name, email_address, Answers Quality (consistency score), CV match (job fit score), Fit Summary (final score), Final Score (final score)  
    - Credentials: Configure Google Sheets OAuth2 credentials  
    - Connect Getting Score node output to this node  
    - Also connect Comparison Data node output to map email and name fields

12. **Create Google Sheets node "Get All Rows"**  
    - Type: Google Sheets  
    - Operation: Get All Rows  
    - Same doc and sheet as above  
    - Credentials: Same OAuth2 credentials  
    - Connect Save to Sheets node output to this node.

13. **Create Code node "Sort by Final Score"**  
    - Type: Code  
    - Purpose: Sort rows received from Get All Rows by final_score descending  
    - Connect Get All Rows node output to this node.

14. **Create Google Sheets node "Clear Sheet"**  
    - Type: Google Sheets  
    - Operation: Clear sheet content  
    - Same doc and sheet  
    - Credentials: Same OAuth2 credentials  
    - Connect Sort by Final Score node output to this node.

15. **Create Google Sheets node "Write Sorted Data"**  
    - Type: Google Sheets  
    - Operation: Append or Update  
    - Same doc and sheet  
    - Map all relevant columns including candidate_name, email_address, educational_qualification, Job_History, skill_set, justification, consistency_check, score (final score)  
    - Credentials: Same OAuth2 credentials  
    - Connect Clear Sheet node output to this node.

---

### 5. General Notes & Resources

| Note Content                                                                                             | Context or Link                                                                  |
|---------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| Form trigger expects a PDF CV upload and text answers on skills and job history fields                   | n8n Form Trigger node configuration                                            |
| Google Drive folder for CV storage must have correct permissions for OAuth2 account                      | Google Drive node configuration                                                |
| AI prompt explicitly demands strict JSON output to facilitate downstream parsing                         | AI Comparison & Scoring node prompt text                                       |
| Parsing code handles both markdown-embedded JSON and fallback regex extraction to avoid workflow breaks | Parse AI Results code node                                                     |
| Google Sheets document used for storing candidate evaluations should have predefined columns matching mapping | Google Sheets nodes configuration                                             |
| Sort and clear operations ensure sheet maintains sorted candidate ranking after each new submission       | Sort by Final Score, Clear Sheet, Write Sorted Data nodes                      |
| Google Gemini AI credential setup is required for Langchain AI nodes                                    | Google Palm API credentials configuration                                      |
| Workflow designed for Senior Software Engineer role with specific skill requirements encoded in prompt   | AI prompt instructions for scoring                                            |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.