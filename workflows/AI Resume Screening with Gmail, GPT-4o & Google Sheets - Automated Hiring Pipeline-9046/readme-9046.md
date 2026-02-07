AI Resume Screening with Gmail, GPT-4o & Google Sheets - Automated Hiring Pipeline

https://n8nworkflows.xyz/workflows/ai-resume-screening-with-gmail--gpt-4o---google-sheets---automated-hiring-pipeline-9046


# AI Resume Screening with Gmail, GPT-4o & Google Sheets - Automated Hiring Pipeline

### 1. Workflow Overview

This n8n workflow automates the screening of job candidate resumes received via Gmail by leveraging AI-powered analysis and structured data logging. It targets HR teams, recruiting agencies, and startups to streamline resume intake, evaluation, and tracking. The workflow is logically divided into the following blocks:

- **1.1 Input Reception and File Saving:** Monitors Gmail for incoming resumes as attachments, downloads, and saves them to Google Drive.
- **1.2 File Type Routing and Processing:** Detects file formats (PDF, DOCX, TXT), converts or extracts text accordingly to standardize resume content.
- **1.3 Data Standardization:** Consolidates extracted text and metadata into a consistent format for AI analysis.
- **1.4 Job Description Setup:** Defines the target job description against which candidates are evaluated.
- **1.5 AI Recruiter Analysis:** Uses GPT-4o powered LangChain nodes for detailed candidate evaluation and structured output parsing.
- **1.6 Candidate Information Extraction:** Extracts key candidate contact and profile details from the standardized resume text.
- **1.7 Results Logging:** Appends analyzed candidate data and AI insights into a Google Sheets dashboard for tracking and collaboration.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and File Saving

- **Overview:** Watches a Gmail inbox for emails containing resume attachments, downloads these attachments, and saves them to Google Drive with a timestamped, sanitized filename.
- **Nodes Involved:** Receive Resume, Save to Drive, Email Monitoring (Sticky Note)
- **Node Details:**

  - **Receive Resume**  
    - Type: Gmail Trigger  
    - Configuration: Polls inbox every minute, downloads attachments  
    - Input: Gmail inbox messages  
    - Output: Email data with attachments  
    - Failure: Gmail auth errors, attachment download failures  
  - **Save to Drive**  
    - Type: Google Drive  
    - Configuration: Saves attachment[0] with filename derived from email subject and current timestamp, saved in root folder of "My Drive"  
    - Credentials: Google Drive OAuth2  
    - Input: Attachment from Receive Resume  
    - Output: File metadata including webViewLink  
    - Failure: Drive API errors, permission issues  
  - **Email Monitoring (Sticky Note)**  
    - Describes monitoring function and supported file types (PDF, DOCX, TXT)

#### 2.2 File Type Routing and Processing

- **Overview:** Routes saved files by MIME type to appropriate processing pipelines for text extraction or conversion, ensuring all resume content converges to plain text.
- **Nodes Involved:** Route by File Type, Extract PDF Text, Convert DOCX to Docs, Get Doc, Get Doc as Text, Download TXT, Extract TXT Content, File Processing (Sticky Note)
- **Node Details:**

  - **Route by File Type**  
    - Type: Switch  
    - Configuration: Routes based on MIME type field (`application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`)  
    - Input: File metadata from Save to Drive  
    - Output: Three outputs corresponding to PDF, DOCX, TXT  
    - Failure: Missing or unexpected MIME types  
  - **Extract PDF Text**  
    - Type: ExtractFromFile  
    - Configuration: Extracts up to 10 pages of text from PDF  
    - Input: File content of PDF  
    - Output: Extracted text field  
    - Failure: Corrupted PDF, extraction errors  
  - **Convert DOCX to Docs**  
    - Type: HTTP Request to Google Drive API  
    - Configuration: Copies DOCX file in Drive as Google Docs for conversion  
    - Input: DOCX file ID  
    - Output: New Google Doc file ID  
    - Credentials: Google Drive OAuth2  
    - Failure: API errors, quota limits  
  - **Get Doc**  
    - Type: Google Drive  
    - Configuration: Downloads Google Doc as PDF file for extraction  
    - Input: Google Doc file ID from Convert DOCX to Docs  
    - Output: PDF content  
    - Failure: Permissions, file not found  
  - **Get Doc as Text**  
    - Type: Google Drive  
    - Configuration: Downloads Google Doc converted to plain text  
    - Input: Google Doc file ID  
    - Output: Text content  
    - Failure: Conversion failures  
  - **Download TXT**  
    - Type: Google Drive  
    - Configuration: Downloads TXT file content directly  
    - Input: TXT file ID  
    - Output: Raw text  
    - Failure: File not found, permission issues  
  - **Extract TXT Content**  
    - Type: ExtractFromFile  
    - Configuration: Extracts plain text from downloaded TXT file  
    - Input: TXT content  
    - Output: Text field named `resumeText`  
    - Failure: Extraction errors  
  - **File Processing (Sticky Note)**  
    - Documents the routing logic and file type handling

#### 2.3 Data Standardization

- **Overview:** Consolidates text extracted from various file types into a unified JSON object containing the candidate's resume text, original email metadata, and Google Drive link.
- **Nodes Involved:** Standardize Resume Data, Data Standardization (Sticky Note)
- **Node Details:**

  - **Standardize Resume Data**  
    - Type: Set  
    - Configuration: Assigns three fields:  
      - `candidateResume`: text extracted from previous nodes (`text` or `data` or `resumeText`)  
      - `originalEmail`: JSON object from "Receive Resume" node containing source email data  
      - `driveLink`: Google Drive webViewLink from "Save to Drive" node  
    - Input: Text from extraction nodes and metadata  
    - Output: Standardized JSON for AI processing  
    - Failure: Missing text fields, null references  
  - **Data Standardization (Sticky Note)**  
    - Explains purpose of standardizing data for AI analysis

#### 2.4 Job Description Setup

- **Overview:** Defines the target job description text for the AI to use as a benchmark in candidate evaluation.
- **Nodes Involved:** Job Description
- **Node Details:**

  - **Job Description**  
    - Type: Set  
    - Configuration: Static multi-line string defining a Senior Software Engineer role, detailing required and preferred skills, responsibilities  
    - Input: None (static assignment)  
    - Output: Field `jobDescription`  
    - Failure: None expected

#### 2.5 AI Recruiter Analysis

- **Overview:** Uses GPT-4o via LangChain nodes to analyze the candidate’s resume relative to the job description, producing a structured JSON report with strengths, weaknesses, risk/opportunity assessments, and recommendations.
- **Nodes Involved:** AI Recruiter Analysis, GPT-4o Model, Structured Output Parser, AI Analysis Engine (Sticky Note)
- **Node Details:**

  - **AI Recruiter Analysis**  
    - Type: LangChain Agent  
    - Configuration:  
      - Input text combines candidate resume text and job description  
      - System message instructs the AI to act as an expert recruiter with detailed evaluation framework and output JSON schema  
      - Output is parsed by Structured Output Parser  
    - Input: `candidateResume` and `jobDescription` fields  
    - Output: Structured analysis JSON  
    - Failure: OpenAI API errors, parsing errors, incomplete responses  
  - **GPT-4o Model**  
    - Type: LangChain OpenAI Chat Model  
    - Configuration: Model is `gpt-4o-mini`, temperature 0.3, max tokens 2000  
    - Credentials: OpenAI API key  
    - Input: Prompt from AI Recruiter Analysis  
    - Output: Raw AI response  
    - Failure: API key issues, rate limits, timeout  
  - **Structured Output Parser**  
    - Type: LangChain Structured Output Parser  
    - Configuration: Validates and parses AI JSON output against a strict JSON schema specifying candidate strengths, weaknesses, risk/opportunity levels, scores, and recommendations  
    - Input: GPT-4o raw output  
    - Output: Clean parsed JSON for downstream use  
    - Failure: Schema mismatch, invalid JSON  
  - **AI Analysis Engine (Sticky Note)**  
    - Describes AI evaluation focus areas and expected JSON output

#### 2.6 Candidate Information Extraction

- **Overview:** Extracts key contact and profile information from the standardized resume text for CRM and spreadsheet logging.
- **Nodes Involved:** Extract Candidate Info, Data Extraction (Sticky Note)
- **Node Details:**

  - **Extract Candidate Info**  
    - Type: LangChain Information Extractor  
    - Configuration: Extracts attributes including full name (required), email (required), phone number, current title, years of experience, and top 5 key skills  
    - Input: `candidateResume` standardized text  
    - Output: Structured candidate info JSON fields  
    - Failure: Extraction errors, missing required fields  
  - **Data Extraction (Sticky Note)**  
    - Notes the use of AI to extract structured candidate data for CRM integration

#### 2.7 Results Logging

- **Overview:** Appends the candidate’s contact info, AI evaluation results, and resume links into a Google Sheets spreadsheet for tracking and team collaboration.
- **Nodes Involved:** Append row in sheet, Results Dashboard (Sticky Note)
- **Node Details:**

  - **Append row in sheet**  
    - Type: Google Sheets  
    - Configuration:  
      - Document: User-provided Google Sheets document ID (template copy recommended)  
      - Sheet: Default sheet (gid=0)  
      - Columns mapped from AI analysis and candidate info fields, including date, full name, email, strengths/weaknesses, overall score, risk and opportunity assessments, justification, key skills, and resume link  
    - Credentials: Google Sheets OAuth2  
    - Input: Combined JSON outputs from candidate info and AI analysis nodes  
    - Output: Confirmation of row appended  
    - Failure: API permission errors, incorrect spreadsheet ID, schema mismatches  
  - **Results Dashboard (Sticky Note)**  
    - Describes the tracking and collaboration capabilities enabled by the Google Sheets integration

---

### 3. Summary Table

| Node Name               | Node Type                           | Functional Role                      | Input Node(s)               | Output Node(s)                 | Sticky Note                                                                                              |
|-------------------------|-----------------------------------|------------------------------------|----------------------------|-------------------------------|--------------------------------------------------------------------------------------------------------|
| Setup Guide             | Sticky Note                       | Overview and setup instructions    |                            |                               | # 🎯 AI Resume Screening & Candidate Pipeline ... Copy the [Google Sheet Template](https://docs.google.com/spreadsheets/d/1vucZgBrULNToEQMAQrFyWczpOzXxBU6rzCX0waIZyeM/edit?gid=0#gid=0) |
| Email Monitoring        | Sticky Note                       | Explains email monitoring purpose  |                            |                               | ## 📧 Email Monitoring ... Supports multiple file formats: PDF, DOCX, TXT                              |
| Receive Resume          | Gmail Trigger                    | Watches Gmail inbox for resumes    |                            | Save to Drive                 |                                                                                                        |
| Save to Drive           | Google Drive                     | Saves attachments to Drive         | Receive Resume             | Route by File Type             |                                                                                                        |
| Route by File Type      | Switch                          | Routes files by MIME type          | Save to Drive              | Get Doc, Convert DOCX to Docs, Download TXT |                                                                                                        |
| Extract PDF Text        | ExtractFromFile                  | Extracts text from PDF             | Get Doc                   | Standardize Resume Data        |                                                                                                        |
| Convert DOCX to Docs    | HTTP Request                    | Converts DOCX to Google Docs       | Route by File Type         | Get Doc as Text               |                                                                                                        |
| Get Doc                 | Google Drive                    | Downloads Google Doc as PDF        | Convert DOCX to Docs       | Extract PDF Text              |                                                                                                        |
| Get Doc as Text         | Google Drive                    | Downloads Google Doc as plain text | Convert DOCX to Docs       | Standardize Resume Data        |                                                                                                        |
| Download TXT            | Google Drive                    | Downloads TXT file content         | Route by File Type         | Extract TXT Content           |                                                                                                        |
| Extract TXT Content     | ExtractFromFile                  | Extracts text from TXT             | Download TXT               | Standardize Resume Data        |                                                                                                        |
| Standardize Resume Data | Set                             | Consolidates text and metadata     | Extract PDF Text, Get Doc as Text, Extract TXT Content | Job Description                |                                                                                                        |
| Data Standardization    | Sticky Note                     | Explains data normalization        |                            |                               | ## 🔄 Data Standardization ... Prepares data for AI analysis                                          |
| Job Description         | Set                             | Provides job description text      | Standardize Resume Data    | AI Recruiter Analysis         |                                                                                                        |
| AI Recruiter Analysis   | LangChain Agent                 | Performs AI candidate evaluation   | Job Description            | Extract Candidate Info        | ## 🤖 AI Analysis Engine ... Powered by GPT-4o                                                        |
| GPT-4o Model           | LangChain LM Chat OpenAI        | GPT-4o model interaction           | AI Recruiter Analysis      | AI Recruiter Analysis         |                                                                                                        |
| Structured Output Parser| LangChain Structured Output Parser | Parses AI JSON output             | GPT-4o Model              | AI Recruiter Analysis         |                                                                                                        |
| Extract Candidate Info  | LangChain Information Extractor  | Extracts candidate fields          | AI Recruiter Analysis      | Append row in sheet           | ## 📊 Data Extraction ... Structured data for CRM integration                                         |
| Append row in sheet     | Google Sheets                   | Logs candidate data in spreadsheet | Extract Candidate Info     |                             | ## 📈 Results Dashboard ... Enables filtering, sorting, and team collaboration                         |
| Results Dashboard       | Sticky Note                     | Explains Google Sheets tracking    |                            |                               |                                                                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Sticky Note "Setup Guide"**  
   - Content: Overview, setup checklist, integrations, use cases, and link to Google Sheet template.  
   - Size: Width 600, Height 1152.

2. **Create Sticky Note "Email Monitoring"**  
   - Content: Describes monitoring Gmail inbox for resumes and supported file formats.  
   - Size: Width 686, Height 456.

3. **Create Gmail Trigger Node "Receive Resume"**  
   - Poll interval: Every minute  
   - Options: Download attachments enabled  
   - Credential: Connect Gmail OAuth2 account  
   - Output: Emails with attachments

4. **Create Google Drive Node "Save to Drive"**  
   - Operation: Upload file  
   - File name: Expression `{{$json.subject.replace(/[^a-zA-Z0-9]/g, '_')}}_resume_{{$now.format('yyyy-MM-dd_HH-mm')}}`  
   - Drive: "My Drive" (root folder)  
   - Input data field: attachment_0 from Gmail node  
   - Credential: Google Drive OAuth2

5. **Create Switch Node "Route by File Type"**  
   - Based on `$json.mimeType`  
   - Output keys: PDF (`application/pdf`), DOCX (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`), TXT (`text/plain`)  
   - Input: Output of Save to Drive

6. **Create ExtractFromFile Node "Extract PDF Text"**  
   - Operation: PDF text extraction  
   - Max pages: 10  
   - Input: Output from Get Doc node (PDF content)

7. **Create HTTP Request Node "Convert DOCX to Docs"**  
   - Method: POST  
   - URL: `https://www.googleapis.com/drive/v2/files/{{$json.id}}/copy`  
   - Body (JSON): `{ "title": "{{$json.name}}_converted", "mimeType": "application/vnd.google-apps.document" }`  
   - Authentication: Google Drive OAuth2 credential  
   - Input: DOCX file metadata from Route by File Type

8. **Create Google Drive Node "Get Doc"**  
   - Operation: Download  
   - File ID: `{{$json.id}}` from Convert DOCX to Docs output  
   - Convert Google Doc to PDF  
   - Credential: Google Drive OAuth2

9. **Create Google Drive Node "Get Doc as Text"**  
   - Operation: Download  
   - File ID: `{{$json.id}}` from Convert DOCX to Docs output  
   - Convert Google Doc to plain text  
   - Credential: Google Drive OAuth2

10. **Create Google Drive Node "Download TXT"**  
    - Operation: Download  
    - File ID: `{{$json.id}}` from Route by File Type output for TXT  
    - Credential: Google Drive OAuth2

11. **Create ExtractFromFile Node "Extract TXT Content"**  
    - Operation: Extract text from TXT  
    - Destination key: `resumeText`  
    - Input: Output of Download TXT

12. **Create Set Node "Standardize Resume Data"**  
    - Assign fields:  
      - `candidateResume`: `={{ $json.text || $json.data || $json.resumeText }}`  
      - `originalEmail`: `={{ $('Receive Resume').item.json }}`  
      - `driveLink`: `={{ $('Save to Drive').item.json.webViewLink }}`

13. **Create Sticky Note "Data Standardization"**  
    - Content describing the normalization of data from various file types for AI analysis.

14. **Create Set Node "Job Description"**  
    - Assign `jobDescription` field with the full job description text as static multiline string.

15. **Create LangChain Agent Node "AI Recruiter Analysis"**  
    - Text input: Concatenate candidate resume text and job description using expressions  
    - System message: Instructions for AI as expert recruiter with detailed evaluation framework and JSON output format  
    - Prompt type: Define with output parser enabled

16. **Create LangChain LM Chat OpenAI Node "GPT-4o Model"**  
    - Model: `gpt-4o-mini`  
    - Temperature: 0.3  
    - Max tokens: 2000  
    - Credential: OpenAI API key

17. **Create LangChain Structured Output Parser Node "Structured Output Parser"**  
    - Schema: JSON schema defining candidate strengths, weaknesses, risk/opportunity assessments, score, justification, and next steps  
    - Input: GPT-4o Model output

18. **Create Sticky Note "AI Analysis Engine"**  
    - Content describing AI-powered evaluation dimensions and structured output.

19. **Create LangChain Information Extractor Node "Extract Candidate Info"**  
    - Text input: `candidateResume` field from Standardize Resume Data node  
    - Attributes extracted: full_name (required), email_address (required), phone_number, current_title, years_experience, key_skills (top 5)  

20. **Create Sticky Note "Data Extraction"**  
    - Content describing AI extraction of structured candidate data for CRM.

21. **Create Google Sheets Node "Append row in sheet"**  
    - Operation: Append row  
    - Document ID: User’s copied Google Sheet template ID  
    - Sheet Name: GID 0 (default sheet)  
    - Columns mapped from AI analysis and candidate info outputs (date, email, resume link, full name, strengths, weaknesses, overall fit score, risk factor with explanation, reward factor, justification, key skills)  
    - Credential: Google Sheets OAuth2

22. **Create Sticky Note "Results Dashboard"**  
    - Content describing Google Sheets integration for tracking and collaboration.

23. **Connect nodes as follows:**  
    - Receive Resume -> Save to Drive -> Route by File Type  
    - Route by File Type:  
      - PDF -> Get Doc -> Extract PDF Text -> Standardize Resume Data  
      - DOCX -> Convert DOCX to Docs -> Get Doc as Text -> Standardize Resume Data  
      - TXT -> Download TXT -> Extract TXT Content -> Standardize Resume Data  
    - Standardize Resume Data -> Job Description -> AI Recruiter Analysis -> GPT-4o Model -> Structured Output Parser -> AI Recruiter Analysis  
    - AI Recruiter Analysis -> Extract Candidate Info -> Append row in sheet

---

### 5. General Notes & Resources

| Note Content                                                                                                                  | Context or Link                                                                                                           |
|-------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| Workflow created by David Olusola, designed for automated AI resume screening and hiring pipeline.                            | Setup Guide sticky note                                                                                                   |
| Copy the [Google Sheet Template](https://docs.google.com/spreadsheets/d/1vucZgBrULNToEQMAQrFyWczpOzXxBU6rzCX0waIZyeM/edit?gid=0#gid=0) before use. | Setup Guide sticky note                                                                                                   |
| Workflow integrates Gmail, Google Drive, Google Sheets, and OpenAI GPT-4o for end-to-end automation.                           | Setup Guide sticky note                                                                                                   |
| AI evaluation includes scoring from 1-10 with detailed justification, risk/opportunity assessments, and next steps.           | AI Analysis Engine sticky note                                                                                            |
| Supported resume formats: PDF, DOCX, TXT; DOCX files are converted to Google Docs internally for text extraction.              | File Processing sticky note                                                                                               |
| Google Sheets dashboard enables filtering, sorting, and team collaboration on candidate data.                                  | Results Dashboard sticky note                                                                                             |

---

**Disclaimer:** The text provided is extracted exclusively from an n8n automated workflow. The processing respects all current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.