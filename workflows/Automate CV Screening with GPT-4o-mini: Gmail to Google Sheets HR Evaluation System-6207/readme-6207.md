Automate CV Screening with GPT-4o-mini: Gmail to Google Sheets HR Evaluation System

https://n8nworkflows.xyz/workflows/automate-cv-screening-with-gpt-4o-mini--gmail-to-google-sheets-hr-evaluation-system-6207


# Automate CV Screening with GPT-4o-mini: Gmail to Google Sheets HR Evaluation System

# 1. Workflow Overview

This workflow automates the screening of job applications received via Gmail by leveraging GPT-4o-mini for AI-powered resume analysis. It extracts candidate data from email attachments, evaluates the resume against a specific job offer, and records the results in Google Sheets for HR review. The workflow is structured into three main logical blocks:

- **1.1 Detect and Process New CV from Email**  
  Watches for new unread emails with attachments in Gmail, classifies whether the email is a job application, and branches processing accordingly.

- **1.2 Extract and Store Candidate Data**  
  Extracts text from the attached PDF resume, saves the resume file to Google Drive, and stores basic metadata in Google Sheets.

- **1.3 Evaluate and Qualify the Candidate**  
  Retrieves job offer details from Google Sheets, uses GPT-4o-mini to score the candidate and extract contact information, sends a confirmation email, and saves the evaluation result in Google Sheets.

---

# 2. Block-by-Block Analysis

## 2.1 Detect and Process New CV from Email

**Overview:**  
This block detects new unread emails with attachments (presumably CVs), classifies whether the email is a job application using AI, and filters out non-relevant emails.

**Nodes Involved:**  
- Gmail: Watch for new CV  
- OpenAI Model – Email Classifier  
- Classify Email Type  
- Skip (If not a job application)  
- Switch  
- Sticky Note (Step 1)  
- Sticky Note3 (Setup Instructions)

### Node Details

- **Gmail: Watch for new CV**  
  - *Type:* Gmail Trigger  
  - *Role:* Watches Gmail inbox for unread emails with attachments every hour.  
  - *Config:* Filters with query `has:attachment` and label `UNREAD`. Downloads attachments for processing.  
  - *Inputs:* None (trigger node)  
  - *Outputs:* Email data with attachments  
  - *Credentials:* OAuth2 Gmail account  
  - *Potential Failures:* Authentication errors, Gmail API rate limits, attachment download failures  

- **OpenAI Model – Email Classifier**  
  - *Type:* Langchain OpenAI Chat Model (gpt-4o-mini)  
  - *Role:* Runs the classification prompt on the email text to categorize it.  
  - *Config:* Model "gpt-4o-mini" with no special options.  
  - *Inputs:* Email text from Gmail node  
  - *Outputs:* JSON classification result  
  - *Credentials:* OpenAI API key  
  - *Potential Failures:* API rate limits, prompt parsing errors  

- **Classify Email Type**  
  - *Type:* Langchain Text Classifier  
  - *Role:* Parses classifier output to decide if the email is a job application or not.  
  - *Config:* Categories: "Doesn't apply" vs "Apply" (job application). Output strictly JSON.  
  - *Inputs:* Text from Gmail email body  
  - *Outputs:* Branches workflow based on classification  
  - *Potential Failures:* Classification errors, expression evaluation failures  

- **Skip (If not a job application)**  
  - *Type:* No-Op node  
  - *Role:* Terminates processing for emails not classified as job applications.  
  - *Inputs:* From Classify Email Type (negative branch)  
  - *Outputs:* None (ends branch)  

- **Switch**  
  - *Type:* Switch Node  
  - *Role:* Checks if the attachment exists ("attachment_0") to decide next processing step.  
  - *Inputs:* From Classify Email Type (positive branch)  
  - *Outputs:* Two branches:  
    - Save Resume to Google Drive (if no attachment)  
    - Extract Resume Text (PDF) (if attachment exists)  
  - *Potential Failures:* Missing attachment property, malformed data  

- **Sticky Notes (Step 1 and Setup Instructions)**  
  - Provide visual guidance and setup instructions for users.  
  - Setup notes highlight prerequisites such as n8n installation, OpenAI API key, Google Sheets and Drive API enablement, and OAuth 2.0 credentials setup.

---

## 2.2 Extract and Store Candidate Data

**Overview:**  
This block extracts text from the candidate's attached resume PDF, saves the file to a Google Drive folder designated for CVs, and logs the candidate's email and CV link in a Google Sheets database.

**Nodes Involved:**  
- Extract Resume Text (PDF)  
- Save Resume to Google Drive  
- Save CV to Google Sheets  
- Sticky Note1 (Step 2)  
- Switch (from previous block)

### Node Details

- **Extract Resume Text (PDF)**  
  - *Type:* Extract From File  
  - *Role:* Extracts text content from the PDF attachment (binary property "attachment_0").  
  - *Config:* Operation set to "pdf".  
  - *Inputs:* Attachment binary data from Gmail node via Switch branch  
  - *Outputs:* Extracted plain text of the resume  
  - *Potential Failures:* Corrupt PDF, unsupported formats, extraction errors  

- **Save Resume to Google Drive**  
  - *Type:* Google Drive Upload  
  - *Role:* Uploads the attached resume file to a specific folder ("CV - HR") in Google Drive.  
  - *Config:* Uses candidate email as file name. Folder ID is preset.  
  - *Inputs:* Binary attachment from Gmail node  
  - *Outputs:* Metadata including webViewLink to the saved file  
  - *Credentials:* Google Drive OAuth2  
  - *Potential Failures:* API authentication, permission errors, quota exceeded  

- **Save CV to Google Sheets**  
  - *Type:* Google Sheets Append  
  - *Role:* Records candidate email and link to the CV file in Google Sheets for HR tracking.  
  - *Config:* Appends new row with "Email" and "Link CV" columns.  
  - *Inputs:* Candidate email from Gmail node; file link from Google Drive node  
  - *Credentials:* Google Sheets OAuth2  
  - *Potential Failures:* API limits, document ID or sheet name misconfigurations  

- **Switch**  
  - *Role:* Connects the Extract Resume Text and Save Resume to Google Drive nodes depending on attachment presence.

---

## 2.3 Evaluate and Qualify the Candidate

**Overview:**  
This block retrieves job offer details from a Google Sheets document, analyzes the extracted resume text using GPT-4o-mini to score the candidate and extract contact details, sends a confirmation email to the candidate, and finally saves the evaluation results back to Google Sheets.

**Nodes Involved:**  
- Retrieve Job Offer Details (Google Sheets)  
- AI Agent: Score Resume  
- OpenAI Model – Resume Scoring  
- Parse Resume Evaluation Result  
- Send Confirmation Email  
- Save Score to Google Sheets  
- Sticky Note2 (Step 3)

### Node Details

- **Retrieve Job Offer Details (Google Sheets)**  
  - *Type:* Google Sheets Read  
  - *Role:* Fetches job title and description from a Google Sheets document to provide context for resume evaluation.  
  - *Config:* Document ID and sheet name configured to point to job offer data.  
  - *Inputs:* Extracted resume text (from previous block)  
  - *Outputs:* Job offer details JSON  
  - *Credentials:* Google Sheets OAuth2  
  - *Potential Failures:* Read permission errors, sheet structure changes  

- **AI Agent: Score Resume**  
  - *Type:* Langchain Agent (uses LLMs)  
  - *Role:* Core AI node that sends the resume text along with job details to GPT-4o-mini, requesting:  
    - A candidate score (0-10)  
    - Extraction of name, email, phone, location, LinkedIn profile  
    - Draft of confirmation email text to the candidate  
  - *Config:* System message sets instructions for scoring and data extraction. The user prompt includes resume text and job offer details.  
  - *Inputs:* Resume text, job offer details  
  - *Outputs:* Structured JSON output with evaluation and contact info  
  - *Requires:* Connected language model and output parser nodes  
  - *Potential Failures:* Model rate limits, misinterpretation of prompt, parsing errors  

- **OpenAI Model – Resume Scoring**  
  - *Type:* Langchain OpenAI Chat Model (o4-mini)  
  - *Role:* Provides the LLM backend for the AI Agent node.  
  - *Config:* Model "o4-mini" selected.  
  - *Inputs:* From AI Agent prompt  
  - *Outputs:* Model response streams to AI Agent node  

- **Parse Resume Evaluation Result**  
  - *Type:* Langchain Output Parser Structured  
  - *Role:* Parses the AI Agent output into structured JSON with fields: name, email, linkedin, score, phone, location.  
  - *Config:* JSON schema manually defined for these fields.  
  - *Inputs:* AI Agent output  
  - *Outputs:* Parsed structured data used for saving and email reply  

- **Send Confirmation Email**  
  - *Type:* Gmail Send Email (Gmail Tool)  
  - *Role:* Sends an automatic confirmation email to the candidate's email address with a templated message confirming receipt of application.  
  - *Config:* Subject "Application Received", recipient email extracted from the Gmail trigger. Message content is AI-generated and editable.  
  - *Credentials:* Gmail OAuth2  
  - *Potential Failures:* SMTP authentication issues, invalid email addresses  

- **Save Score to Google Sheets**  
  - *Type:* Google Sheets Append or Update  
  - *Role:* Saves the candidate’s extracted information and score, along with the resume text, into a Google Sheets database for HR evaluation.  
  - *Config:* Appends or updates by matching on candidate email. Columns include Name, Email, Phone, Score, LinkedIn, Location, Resume Text.  
  - *Credentials:* Google Sheets OAuth2  
  - *Potential Failures:* Data mismatch, API rate limits  

---

# 3. Summary Table

| Node Name                     | Node Type                          | Functional Role                              | Input Node(s)                  | Output Node(s)                      | Sticky Note                                                                                   |
|-------------------------------|----------------------------------|----------------------------------------------|-------------------------------|-----------------------------------|-----------------------------------------------------------------------------------------------|
| Gmail: Watch for new CV        | Gmail Trigger                    | Detect new unread emails with attachments    | -                             | Classify Email Type                | # 🟡 Step 1 — Detect and Process New CV from Email                                            |
| OpenAI Model – Email Classifier| Langchain OpenAI Chat Model      | AI model for email classification            | Classify Email Type            | Classify Email Type                |                                                                                               |
| Classify Email Type            | Langchain Text Classifier        | Classify email as job application or not     | Gmail: Watch for new CV        | Skip (If not a job application), Switch |                                                                                               |
| Skip (If not a job application)| No-Op                           | Ends processing for non-job applications     | Classify Email Type            | -                                 |                                                                                               |
| Switch                        | Switch                          | Branch to resume extraction or saving        | Classify Email Type            | Save Resume to Google Drive, Extract Resume Text (PDF) |                                                                                               |
| Save Resume to Google Drive    | Google Drive Upload              | Save attached resume to Google Drive folder  | Switch                        | Save CV to Google Sheets           |                                                                                               |
| Extract Resume Text (PDF)      | Extract From File (PDF)           | Extract text from PDF resume                   | Switch                        | Retrieve Job Offer Details (Google Sheets) |                                                                                               |
| Save CV to Google Sheets       | Google Sheets Append             | Log candidate email and CV link                | Save Resume to Google Drive     | -                                 | # 🔴 Step 2 — Extract and Store Candidate Data                                                |
| Retrieve Job Offer Details (Google Sheets)| Google Sheets Read     | Get job offer info for resume evaluation     | Extract Resume Text (PDF)      | AI Agent: Score Resume             |                                                                                               |
| AI Agent: Score Resume         | Langchain Agent                  | Analyze resume and score candidate             | Retrieve Job Offer Details     | Save Score to Google Sheets        | # 🟣 Step 3 — Evaluate and Qualify the Candidate                                              |
| OpenAI Model – Resume Scoring  | Langchain OpenAI Chat Model      | Backend LLM for resume scoring                 | AI Agent: Score Resume         | AI Agent: Score Resume             |                                                                                               |
| Parse Resume Evaluation Result | Langchain Output Parser Structured| Parse AI output into structured candidate data| AI Agent: Score Resume         | AI Agent: Score Resume             |                                                                                               |
| Send Confirmation Email        | Gmail Send Email (Tool)          | Send confirmation email to candidate           | AI Agent: Score Resume         | AI Agent: Score Resume (ai_tool)  |                                                                                               |
| Save Score to Google Sheets    | Google Sheets Append or Update  | Store candidate evaluation results              | AI Agent: Score Resume         | -                                 |                                                                                               |
| Sticky Note                   | Sticky Note                     | Visual guidance and workflow step annotation | -                             | -                                 | # 🟡 Step 1 — Detect and Process New CV from Email; Setup instructions and prerequisites       |
| Sticky Note1                   | Sticky Note                     | Visual guidance for data extraction step      | -                             | -                                 | # 🔴 Step 2 — Extract and Store Candidate Data                                                |
| Sticky Note2                   | Sticky Note                     | Visual guidance for candidate evaluation step | -                             | -                                 | # 🟣 Step 3 — Evaluate and Qualify the Candidate                                              |
| Sticky Note3                   | Sticky Note                     | Setup instructions for API keys and OAuth2    | -                             | -                                 | Contains setup prerequisites and links                                                       |

---

# 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger Node**  
   - Type: Gmail Trigger  
   - Configure to watch for unread emails with attachments (`has:attachment` filter, label `UNREAD`).  
   - Set polling interval (e.g., every hour).  
   - Enable "Download Attachments".  
   - Authenticate with Gmail OAuth2 credentials.

2. **Add OpenAI Model Node for Email Classification**  
   - Type: Langchain OpenAI Chat Model  
   - Model: `gpt-4o-mini`  
   - Credentials: OpenAI API key.  

3. **Add Text Classifier Node**  
   - Type: Langchain Text Classifier  
   - Input: Email text from Gmail node.  
   - Categories:  
     - "Doesn't apply": candidate not applying.  
     - "Apply": job application with attached file.  
   - Output format: JSON only (no explanation).  

4. **Add No-Op Node (Skip)**  
   - Connect the classifier node's negative branch here to stop processing non-applications.

5. **Add Switch Node**  
   - Condition: Check if attachment "attachment_0" exists.  
   - If no attachment, connect to "Save Resume to Google Drive".  
   - If attachment exists, connect to "Extract Resume Text (PDF)".  

6. **Add Google Drive Node (Save Resume)**  
   - Upload the attachment to Google Drive folder "CV - HR" (folder ID must be set).  
   - File name: Candidate's email address from Gmail node.  
   - Authenticate with Google Drive OAuth2 credentials.

7. **Add Google Sheets Node (Save CV info)**  
   - Append candidate email and Google Drive file link to Google Sheet.  
   - Configure columns: Email and Link CV.  
   - Authenticate with Google Sheets OAuth2 credentials.

8. **Add Extract From File Node**  
   - Operation: PDF text extraction.  
   - Binary input: attachment from Gmail.  

9. **Add Google Sheets Node (Retrieve Job Offer Details)**  
   - Read job offer details (Title, Description) from configured Google Sheet.  
   - Authenticate with Google Sheets OAuth2 credentials.

10. **Add Langchain Agent Node (AI Agent: Score Resume)**  
    - System prompt instructs to analyze resume, score 0–10, extract contact info, and draft confirmation email.  
    - Input text includes extracted resume and job offer details.  
    - Connect to OpenAI model and output parser nodes.  

11. **Add OpenAI Model Node (Resume Scoring)**  
    - Model: `o4-mini`  
    - Credentials: OpenAI API key.

12. **Add Output Parser Node**  
    - Schema: JSON object with fields `name`, `email`, `linkedin`, `score`, `Phone`, `Location`.  
    - Parses AI Agent output into structured data.

13. **Add Gmail Send Email Node (Send Confirmation Email)**  
    - Send to candidate email from Gmail trigger.  
    - Subject: "Application Received"  
    - Message body: AI-generated confirmation text.

14. **Add Google Sheets Node (Save Score to Sheets)**  
    - Append or update candidate evaluation results in a Google Sheet.  
    - Columns: Name, Email, Phone, Score, LinkedIn, Location, Resume Text.  
    - Match rows by Email to avoid duplicates.

15. **Connect all nodes as per logical flow:**  
    - Gmail Trigger → OpenAI Email Classifier → Text Classifier → (Skip or Switch) →  
      Switch → (Save Resume to Drive + Save CV Info to Sheets) or (Extract Resume Text → Retrieve Job Offer → AI Agent → Save Score) →  
      Send Confirmation Email.

16. **Add Sticky Notes for Documentation** (optional)  
    - Add visual notes for each step and setup instructions with links.

---

# 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                     | Context or Link                                                                                                     |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| Before running, ensure n8n is self-hosted to enable Gmail + OpenAI + Google integrations.                                                                                                                                       | https://www.hostg.xyz/SHHOJ                                                                                         |
| Obtain and set up OpenAI API key from https://platform.openai.com/api-keys                                                                                                                                                      | API Key setup                                                                                                       |
| Enable Google Sheets and Google Drive APIs in Google Cloud Console.                                                                                                                                                             | https://console.cloud.google.com/apis/api/sheets.googleapis.com/overview and https://console.cloud.google.com/apis/api/drive.googleapis.com/overview |
| Create OAuth 2.0 Client ID and Secret in Google Cloud Console for Gmail, Drive, and Sheets access.                                                                                                                             | https://console.cloud.google.com/apis/credentials                                                                    |
| The workflow assumes the first attachment is the candidate's CV in PDF format (`attachment_0`). Ensure this format to avoid extraction errors.                                                                                  | Workflow design constraint                                                                                           |
| AI model usage may incur costs and is subject to OpenAI API rate limits.                                                                                                                                                         | Operational consideration                                                                                           |
| The candidate scoring scale is 0–10, where 0 means not a good fit, and 10 means outstanding.                                                                                                                                   | Scoring interpretation                                                                                              |
| The workflow automatically sends a confirmation email to candidates acknowledging receipt of their applications.                                                                                                               | Candidate communication                                                                                            |

---

This structured documentation fully describes the workflow “Automate CV Screening with GPT-4o-mini: Gmail to Google Sheets HR Evaluation System” for efficient reuse, modification, and error anticipation.