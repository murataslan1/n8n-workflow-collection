AI Resume Screening & Evaluation for HR with GPT-4 & Google Workspace

https://n8nworkflows.xyz/workflows/ai-resume-screening---evaluation-for-hr-with-gpt-4---google-workspace-6612


# AI Resume Screening & Evaluation for HR with GPT-4 & Google Workspace

---
### 1. Workflow Overview

This workflow, titled **"AI Resume Screening & Evaluation for HR with GPT-4 & Google Workspace"**, automates the process of candidate resume screening and evaluation for HR teams. It integrates candidate application submission, resume extraction and structured parsing, job description retrieval, AI-driven candidate-job matching, and final evaluation result distribution and tracking.

The workflow is logically grouped into five main blocks:

- **1.1 Candidate Application Intake**: Collect candidate data and CV via a web form.
- **1.2 Candidate Profile Extraction and Structuring**: Upload the CV to Google Drive, extract text from PDF, and parse it into a structured JSON profile using GPT-4.
- **1.3 Job Description Retrieval and Extraction**: Based on the candidate's selected job role, retrieve the corresponding job description PDF from Google Drive and extract its content.
- **1.4 AI-driven Candidate Evaluation**: Use GPT-4 to evaluate candidate suitability against the job description and produce a structured assessment.
- **1.5 Result Distribution and Tracking**: Store evaluation results in a Google Sheet and notify either the candidate or the hiring team via email or Slack, depending on qualification.

---

### 2. Block-by-Block Analysis

#### 2.1 Candidate Application Intake

- **Overview:**  
Captures candidate information and CV upload through a customizable web form. This triggers the workflow with submitted data.

- **Nodes Involved:**  
  - Application form  
  - Sticky Note1 (documentation)

- **Node Details:**  
  - **Application form**  
    - Type: Form Trigger  
    - Role: Entry point; collects candidate name, email, CV (PDF), and job role selection via dropdown.  
    - Config: Custom CSS for styling; required CV upload and job role selection.  
    - Inputs: Webhook HTTP POST from form submission.  
    - Outputs: JSON with form fields and binary CV file.  
    - Edge cases: Missing required fields, invalid email format, or unsupported CV file type may cause failures or incomplete data.  
    - Notes: Form fields must match job roles in the Google Sheet "Positions".
  - **Sticky Note1**  
    - Role: Describes this block as candidate form submission.

---

#### 2.2 Candidate Profile Extraction and Structuring

- **Overview:**  
Uploads the candidate CV to Google Drive for storage, extracts text from the PDF, and processes it using GPT-4 to generate a structured candidate profile in JSON format.

- **Nodes Involved:**  
  - Upload to Google Drive  
  - Extract profile  
  - gpt4-1 model  
  - json parser  
  - Profile Analyzer Agent  
  - Sticky Note (Candidate profile analyzer)  
  - Sticky Note3 (Form screenshot)

- **Node Details:**  
  - **Upload to Google Drive**  
    - Type: Google Drive node  
    - Role: Uploads candidate CV file to a designated Google Drive folder (`/cv`) with timestamped filename.  
    - Config: Folder ID set to specific Google Drive folder; uses OAuth2 credentials.  
    - Inputs: Binary file from Application form node.  
    - Outputs: Metadata including file ID and name.  
    - Edge cases: Google Drive API failure, insufficient permissions, or file size limits.  
  - **Extract profile**  
    - Type: Extract from File  
    - Role: Extract text from uploaded CV PDF.  
    - Config: PDF operation on binary CV file.  
    - Inputs: Binary file from Application form node.  
    - Outputs: Extracted text of CV.  
    - Edge cases: PDF parsing failures if file is corrupted or scanned image PDF without text layer.  
  - **gpt4-1 model**  
    - Type: LangChain OpenAI GPT-4 chat model  
    - Role: Processes extracted CV text to interpret and transform it into structured data.  
    - Config: Model "gpt-4.1-mini" with OpenAI API credentials.  
    - Inputs: Extracted CV text.  
    - Outputs: AI-generated candidate information (unstructured).  
    - Edge cases: API quota exceedance, network timeout, or unexpected response format.  
  - **json parser**  
    - Type: LangChain JSON output parser  
    - Role: Parses AI output into a strict JSON schema representing candidate profile fields (name, education, skills, etc.).  
    - Config: Uses detailed JSON schema example for strict formatting.  
    - Inputs: Raw AI output from GPT-4.  
    - Outputs: Structured JSON candidate profile.  
    - Edge cases: Parsing errors if AI output deviates from schema.  
  - **Profile Analyzer Agent**  
    - Type: LangChain agent node  
    - Role: Encapsulates the above GPT-4 model and parser to produce final structured candidate profile.  
    - Inputs: Extract profile text.  
    - Outputs: Structured candidate profile JSON.  
    - Edge cases: Same as GPT-4 and JSON parser; also dependent on input text quality.  
  - **Sticky Note**  
    - Role: Documents the candidate profile extraction logic and Google Drive upload.  
  - **Sticky Note3**  
    - Role: Visual reference of the candidate form UI.

---

#### 2.3 Job Description Retrieval and Extraction

- **Overview:**  
Uses the candidate’s selected job role to lookup the corresponding job description file URL in a Google Sheet, downloads the job description PDF from Google Drive, and extracts its text content.

- **Nodes Involved:**  
  - Get position JD  
  - Download file  
  - Extract Job Description  
  - Sticky Note2  
  - Sticky Note5

- **Node Details:**  
  - **Get position JD**  
    - Type: Google Sheets  
    - Role: Finds the job description URL by matching the job role from the form submission.  
    - Config: Filters by job role column exact match; outputs job description file link.  
    - Inputs: Candidate job role from Profile Analyzer Agent.  
    - Outputs: Job description file URL.  
    - Edge cases: No matching job role, incorrect sheet permissions, or API errors.  
  - **Download file**  
    - Type: Google Drive node  
    - Role: Downloads the job description PDF file using URL fetched from Google Sheet.  
    - Config: File ID extracted from URL; uses Google Drive OAuth2.  
    - Inputs: File ID from Get position JD.  
    - Outputs: Binary PDF file.  
    - Edge cases: File not found, access denied, or invalid file URL.  
  - **Extract Job Description**  
    - Type: Extract from File  
    - Role: Extracts text content from the downloaded job description PDF.  
    - Config: PDF operation on binary file.  
    - Inputs: Binary PDF from Download file.  
    - Outputs: Plain text job description.  
    - Edge cases: Same PDF extraction issues as candidate CV extraction.  
  - **Sticky Note2 & Sticky Note5**  
    - Role: Document the logic and output expectations for job description retrieval and evaluation preparation.

---

#### 2.4 AI-driven Candidate Evaluation

- **Overview:**  
Compares the structured candidate profile against the extracted job description using GPT-4 to generate a detailed evaluation with an overall fit score, recommendations, strengths, concerns, and notes.

- **Nodes Involved:**  
  - HR Expert Agent  
  - gpt-4-1 model 2  
  - json parser 2  
  - Map Columns  
  - Candidate qualified?  
  - Sticky Note6  
  - Sticky Note8

- **Node Details:**  
  - **HR Expert Agent**  
    - Type: LangChain Chain LLM  
    - Role: Combines extracted candidate profile and job description text to perform AI evaluation.  
    - Config: Prompt includes job role, job description, and candidate profile JSON; GPT-4 model "gpt-4.1-mini" used.  
    - Inputs: Extracted job description text and candidate profile structured JSON.  
    - Outputs: Nested JSON with evaluation metrics including overall fit score and textual recommendations.  
    - Edge cases: GPT-4 API failures, malformed inputs, or unexpected output format.  
  - **gpt-4-1 model 2** and **json parser 2**  
    - Used internally by HR Expert Agent to generate and parse AI output.  
    - json parser 2 expects a JSON schema with evaluation fields (score, recommendation, strengths, gaps).  
  - **Map Columns**  
    - Type: Code node  
    - Role: Reformats and maps AI evaluation output and candidate profile data into a simplified JSON structure for storage and notification.  
    - Inputs: Outputs from HR Expert Agent and Profile Analyzer Agent.  
    - Outputs: JSON with key fields like full_name, email, position, overall_fit_score, recommendation, and notes.  
    - Edge cases: Missing fields in AI output or profile causing undefined values.  
  - **Candidate qualified?**  
    - Type: If node  
    - Role: Determines if candidate's overall fit score is ≥ 8 to branch notification logic.  
    - Inputs: overall_fit_score from HR Expert Agent output.  
    - Outputs: Two possible paths — qualified or unqualified.  
    - Edge cases: Missing or invalid score values could cause faulty branching.  
  - **Sticky Note6 & Sticky Note8**  
    - Document the evaluation output usage, notification logic, and sample evaluation sheet data.

---

#### 2.5 Result Distribution and Tracking

- **Overview:**  
Stores final evaluation results in a Google Sheet and sends notifications either by Slack to the hiring team (qualified candidates) or email to the candidate (unqualified). Email and Slack nodes are initially disabled and require configuration.

- **Nodes Involved:**  
  - Update evaluation sheet  
  - Send email to candidate about the result (disabled)  
  - Send message via Slack to the hiring team (disabled)  
  - Sticky Note6

- **Node Details:**  
  - **Update evaluation sheet**  
    - Type: Google Sheets  
    - Role: Appends a new row with evaluation data into a Google Sheet for record keeping.  
    - Config: Maps fields such as overall_fit_score, recommendation, strengths, concerns, etc. to corresponding sheet columns.  
    - Inputs: Mapped evaluation JSON from Map Columns node.  
    - Outputs: None (append operation).  
    - Edge cases: Sheet access issues, quota limits, or schema mismatch.  
  - **Send email to candidate about the result**  
    - Type: SendGrid email node  
    - Role: Sends rejection email to candidate if unqualified.  
    - Config: HTML email template with personalized placeholders; disabled by default.  
    - Inputs: Candidate email and name from Map Columns.  
    - Edge cases: Email delivery failures, invalid email addresses, or SendGrid quota issues.  
  - **Send message via Slack to the hiring team**  
    - Type: Slack node  
    - Role: Sends message with candidate evaluation summary to a predefined Slack channel if candidate qualified.  
    - Config: Slack webhook and channel name configured; disabled by default.  
    - Inputs: Candidate name, position, fit score, and recommendations.  
    - Edge cases: Slack API permission errors, network failures.  
  - **Sticky Note6**  
    - Describes final distribution logic and evaluation tracking.

---

### 3. Summary Table

| Node Name                     | Node Type                          | Functional Role                                | Input Node(s)                 | Output Node(s)                          | Sticky Note                                                                                       |
|-------------------------------|----------------------------------|------------------------------------------------|------------------------------|---------------------------------------|------------------------------------------------------------------------------------------------|
| Sticky Note1                  | Sticky Note                      | Document candidate form submission              |                              |                                       | ## 1. Candidate submit application form (profile & position)                                   |
| Application form              | Form Trigger                    | Candidate data & CV intake                       |                              | Upload to Google Drive, Extract profile |                                                                                                |
| Upload to Google Drive        | Google Drive                    | Store candidate CV on Google Drive              | Application form             | Extract profile                       |                                                                                                |
| Extract profile               | Extract from File               | Extract text from CV PDF                         | Application form             | Profile Analyzer Agent                |                                                                                                |
| gpt4-1 model                 | LangChain GPT-4 model            | Process extracted CV text into structured data | Extract profile              | json parser                          |                                                                                                |
| json parser                  | LangChain JSON parser            | Parse GPT-4 output to structured JSON           | gpt4-1 model                 | Profile Analyzer Agent                |                                                                                                |
| Profile Analyzer Agent        | LangChain Agent                 | Generate structured candidate profile           | Extract profile, json parser | Get position JD                      | ## 2. Candidate profile analyzer                                                               |
| Sticky Note                  | Sticky Note                      | Document candidate profile analysis              |                              |                                       | ## 2. Candidate profile analyzer                                                               |
| Sticky Note3                 | Sticky Note                      | Visual form screenshot                           |                              |                                       | ![Alt text](https://wisestackai.s3.ap-southeast-1.amazonaws.com/SmartHR+form.png)               |
| Get position JD               | Google Sheets                   | Lookup job description URL by job role          | Profile Analyzer Agent       | Download file                       |                                                                                                |
| Download file                | Google Drive                   | Download job description PDF                     | Get position JD              | Extract Job Description             |                                                                                                |
| Extract Job Description       | Extract from File               | Extract text from job description PDF            | Download file               | HR Expert Agent                    |                                                                                                |
| Sticky Note2                 | Sticky Note                      | Document job description download & extraction  |                              |                                       | ## 3. Download selected job description                                                        |
| Sticky Note5                 | Sticky Note                      | Document HR AI evaluation step                    |                              |                                       | ## 4. HR AI Agent evaluate candidate matching                                                  |
| HR Expert Agent              | LangChain Chain LLM             | AI evaluation of candidate vs job description   | Extract Job Description      | Map Columns                       |                                                                                                |
| gpt-4-1 model 2             | LangChain GPT-4 model            | Internal GPT-4 model for HR Expert Agent        |                              | json parser 2                      |                                                                                                |
| json parser 2               | LangChain JSON parser            | Parse HR Expert Agent output JSON                | gpt-4-1 model 2             | HR Expert Agent                    |                                                                                                |
| Map Columns                  | Code                           | Map AI evaluation and profile to flat JSON      | HR Expert Agent, Profile Analyzer Agent | Update evaluation sheet, Candidate qualified? |                                                                                                |
| Candidate qualified?          | If                             | Branch based on fit score ≥ 8                     | Map Columns                 | Send Slack message / Send email     |                                                                                                |
| Update evaluation sheet       | Google Sheets                   | Append evaluation results to spreadsheet        | Map Columns                 |                                       | ## 5. Update evaluation result to target platform                                              |
| Send message via Slack to the hiring team | Slack                          | Notify hiring team of qualified candidate         | Candidate qualified? (true) |                                       | ## 5. Update evaluation result to target platform                                              |
| Send email to candidate about the result | SendGrid                      | Notify candidate of rejection                      | Candidate qualified? (false)|                                       | ## 5. Update evaluation result to target platform                                              |
| Sticky Note6                 | Sticky Note                      | Document final evaluation and notification logic |                              |                                       | ## 5. Update evaluation result to target platform                                              |
| Sticky Note7                 | Sticky Note                      | Full workflow introduction and instructions      |                              |                                       | Detailed project overview, usage instructions, and links                                      |
| Sticky Note8                 | Sticky Note                      | Sample evaluation sheet data visualization        |                              |                                       | ![Alt text](https://wisestackai.s3.ap-southeast-1.amazonaws.com/SmartHR+form+3.jpg)            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Form Trigger node ("Application form"):**  
   - Set up a webhook to receive candidate applications.  
   - Configure form fields: Name (text), Email (email), CV (file, required, accept PDF), Job Role (dropdown with predefined job options).  
   - Apply custom CSS styling if desired.

2. **Add a Google Drive node ("Upload to Google Drive"):**  
   - Configure to upload the received CV file to a specific folder (e.g., `/cv`) in Google Drive.  
   - Use OAuth2 credentials linked to your Google Drive account.  
   - Filename pattern: `cv-<timestamp>-<original filename>`.

3. **Add an Extract From File node ("Extract profile"):**  
   - Configure to extract text from the uploaded CV PDF.  
   - Input binary file from the Form Trigger node.

4. **Add GPT-4 OpenAI node ("gpt4-1 model"):**  
   - Use GPT-4 model variant (e.g., "gpt-4.1-mini").  
   - Pass extracted CV text for processing.  
   - Use OpenAI API credentials.

5. **Add LangChain JSON Output Parser node ("json parser"):**  
   - Provide an example JSON schema for candidate profile structure.  
   - Parse GPT-4 output into structured JSON.

6. **Add LangChain Agent node ("Profile Analyzer Agent"):**  
   - Connect output of "Extract profile" as input.  
   - Use the GPT-4 model and JSON parser configured above to produce structured candidate profile JSON.

7. **Add Google Sheets node ("Get position JD"):**  
   - Configure to read from a Google Sheet containing Job Role to Job Description URL mapping.  
   - Filter rows to match candidate's job role from "Profile Analyzer Agent".  
   - Use Google Sheets OAuth2 credentials.

8. **Add Google Drive node ("Download file"):**  
   - Configure to download the job description PDF using the URL/file ID from the previous step.  
   - Use Google Drive OAuth2 credentials.

9. **Add Extract From File node ("Extract Job Description"):**  
   - Extract text content from the downloaded job description PDF.

10. **Add LangChain Chain LLM node ("HR Expert Agent"):**  
    - Create a prompt combining job description text and candidate profile JSON.  
    - Use GPT-4 model "gpt-4.1-mini" with OpenAI credentials.  
    - Configure to output structured evaluation JSON.

11. **Add LangChain JSON Output Parser node ("json parser 2"):**  
    - Provide example schema for evaluation results (fit score, recommendation, strengths, concerns, notes).  
    - Parse HR Expert Agent output.

12. **Add a Code node ("Map Columns"):**  
    - Extract and map relevant fields from candidate profile and evaluation JSON into a flat JSON structure for storage and notification.

13. **Add Google Sheets node ("Update evaluation sheet"):**  
    - Append mapped evaluation data as new rows to an evaluation tracking Google Sheet.  
    - Use Google Sheets OAuth2 credentials.

14. **Add If node ("Candidate qualified?"):**  
    - Check if overall_fit_score ≥ 8.  
    - Branch to two paths: qualified or unqualified.

15. **Add Slack node ("Send message via Slack to the hiring team"):**  
    - Configure to send a message with candidate evaluation summary to a hiring Slack channel.  
    - Use Slack credentials.  
    - Connect as true branch from If node.  
    - Initially disable until Slack setup is complete.

16. **Add SendGrid node ("Send email to candidate about the result"):**  
    - Configure to send a rejection email to the candidate if unqualified.  
    - Use SendGrid API credentials.  
    - Connect as false branch from If node.  
    - Initially disable until email template and credentials are configured.

17. **Add Sticky Notes throughout to document each block and provide helpful visuals or instructions.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Context or Link                                                                                          |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| This workflow automates AI-driven resume screening and evaluation, ideal for HR teams wanting to reduce manual effort by integrating form submission, resume parsing, job description matching, and AI evaluation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Workflow purpose summary                                                                                |
| Google Drive folder structure recommended: `/jd` for job descriptions PDFs, `/cv` for candidate CV uploads.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Folder setup instructions                                                                               |
| Google Sheet "Positions" contains Job Role and Job Description PDF URL mapping. Must match dropdown options in the application form.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | https://docs.google.com/spreadsheets/d/1pW0muHp1NXwh2GiRvGVwGGRYCkcMR7z8NyS9wvSPYjs/edit?usp=sharing   |
| Final evaluation stored in a Google Sheet named "Evaluation form" (example provided).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Google Sheets tracking                                                                                   |
| Requires OpenAI GPT-4 API key with access to chat/completions endpoint.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | OpenAI API requirement                                                                                   |
| Requires Google Workspace APIs enabled: Drive API and Sheets API with OAuth2 credentials.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Google API requirement                                                                                   |
| Optional integrations for notifications: SendGrid for email, Slack for team messaging. Both nodes are disabled by default and require configuration.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Notification setup                                                                                        |
| Join the [n8n Discord](https://discord.com/invite/XPKeKXeB7d) or ask in the [n8n Forum](https://community.n8n.io/) for community support.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Community support links                                                                                   |
| Workflow includes detailed embedded documentation within Sticky Notes explaining each block and providing screenshots and instructions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Inline documentation                                                                                      |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to applicable content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.