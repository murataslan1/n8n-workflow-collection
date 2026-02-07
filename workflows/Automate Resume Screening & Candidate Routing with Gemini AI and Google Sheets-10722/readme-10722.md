Automate Resume Screening & Candidate Routing with Gemini AI and Google Sheets

https://n8nworkflows.xyz/workflows/automate-resume-screening---candidate-routing-with-gemini-ai-and-google-sheets-10722


# Automate Resume Screening & Candidate Routing with Gemini AI and Google Sheets

### 1. Workflow Overview

This workflow automates the recruitment process by intelligently screening candidate resumes submitted via a job application form and routing them based on their suitability for different positions using Google Gemini AI models and Google Sheets as a CRM.

It replaces traditional keyword-based Applicant Tracking Systems (ATS) with AI-powered in-depth resume analysis, considering candidate qualifications, certifications, experience, and even online project validation.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & File Management:** Receives job applications via a form, uploads resumes to Google Drive, and extracts text from PDFs.

- **1.2 Position-Based Routing & AI Analysis:** Routes resumes to position-specific AI agents (ICT, Customer Care, Accounting, HR) that analyze candidate fit using Google Gemini AI, supported by structured output parsing and memory buffering.

- **1.3 Data Consolidation & Logging:** Merges AI analysis results with resume metadata, then appends candidate data to Google Sheets as a CRM.

- **1.4 Candidate Communication & CRM Update:** Monitors the sheet for new entries, filters already contacted candidates, sends interview invitations or rejection emails based on AI scores, and updates the CRM accordingly.

- **1.5 Supporting Utilities & Controls:** Includes HTTP requests for external internet searches to enrich candidate profiles, conditional checks to prevent duplicate emails, and no-operation nodes for logical flow control.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & File Management

- **Overview:**  
  This block handles candidate form submission, uploads resumes to Google Drive, and extracts text from submitted PDF resumes for further processing.

- **Nodes Involved:**  
  - On form submission  
  - Upload file  
  - Extract from File (four variants for different positions)  
  - Sticky Note1 (description)  
  - Sticky Note5 (upload info)

- **Node Details:**  

  - **On form submission**  
    - Type: `Form Trigger`  
    - Receives job applications via a form titled "Job Application (HR Digital Consulting)".  
    - Captures candidate's full name, email, application position (dropdown: Accounting, ICT, Customer Care, HR), and resume file (PDF required).  
    - Parameters ensure bot submissions are ignored.  
    - Outputs JSON data including the file binary.

  - **Upload file**  
    - Type: `Google Drive`  
    - Uploads the candidate's PDF resume to a specific Google Drive folder (folderId provided).  
    - Filename matches the uploaded file's original name.  
    - Credentials: Google Drive OAuth2 account.  
    - Outputs the file metadata including webViewLink for sharing.

  - **Extract from File** (and variants `Extract from File1`, `Extract from File2`, `Extract from File3`)  
    - Type: `Extract From File`  
    - Extracts text content from the PDF resume binary named `Resume_CV`.  
    - Multiple nodes exist to process resumes routed to different position paths.  
    - Outputs extracted plain text to be analyzed by position-specific AI agents.

- **Edge Cases & Potential Failures:**  
  - Form submission might have incomplete or malformed inputs.  
  - Resume upload can fail due to Google Drive auth issues or file size/type mismatch.  
  - PDF extraction can fail if the file is corrupted or not a valid PDF.  
  - Bot submissions are ignored but care needed to ensure no false positives.

- **Sticky Notes:**  
  - Sticky Note1 explains the workflow automates deep resume analysis vs traditional keyword ATS.  
  - Sticky Note5 highlights uploading resumes to Google Drive for review.

---

#### 2.2 Position-Based Routing & AI Analysis

- **Overview:**  
  Routes resumes based on the position applied for, extracts the resume text, and sends it through position-specific AI agents built on Google Gemini Chat models. These agents score candidates from 1 to 10 and provide structured summaries.

- **Nodes Involved:**  
  - Switch based on position  
  - ICT Analysis (AI Agent)  
  - Customer Care Agent (AI Agent)  
  - Accountant (AI Agent)  
  - HR Analysis (AI Agent)  
  - Google Gemini Chat Model  
  - Structured Output Parser (and variants 1-3)  
  - Simple Memory (and Simple Memory1)  
  - Searches the internet (HTTP Request Tool)  
  - Sticky Note (technical merge instructions)  
  - Sticky Note6 (workflow summary)

- **Node Details:**  

  - **Switch based on position**  
    - Type: `Switch`  
    - Routes workflow paths based on the submitted "Application Position" field.  
    - Outputs: ICT, Customer Care, Accounting, HR.

  - **Position-specific Extract from File nodes**  
    - Extract text from resume PDF specifically for each position route.

  - **Google Gemini Chat Model**  
    - Type: `LangChain Google Gemini Chat Model`  
    - Provides the LLM backend for all AI agents with model "models/gemini-2.5-pro".  
    - Credentials: Google Palm API with valid token.  
    - Supports multi-turn conversations and streaming.

  - **AI Agent Nodes (ICT Analysis, Customer Care Agent, Accountant, HR Analysis)**  
    - Type: `LangChain Agent`  
    - Each agent receives extracted resume text and applies a detailed prompt focused on the position's requirements.  
    - System prompts specify evaluation criteria, required skills, certifications, experience, and scoring rules (1–10).  
    - Agents output strictly valid JSON with fields "resume summary" and "Score" (or "Total Score" as normalized).  
    - Use structured output parsers to enforce JSON schema.  
    - Use simple memory nodes with session keys based on candidate email to maintain context if needed.  
    - Connected to the "Searches the internet" HTTP Request tool for candidate online profile verification.

  - **Structured Output Parsers**  
    - Enforce JSON schema on AI outputs, ensuring structured, consistent data for downstream usage.

  - **Simple Memory Nodes**  
    - Buffer past interactions in a sliding window keyed by candidate email, supporting context retention for AI agents.

  - **Searches the internet**  
    - HTTP POST to external API (Tavily.com) to enrich candidate info by querying online projects or profiles mentioned in resumes.  
    - Authenticated by HTTP header (Bearer token).

- **Edge Cases & Potential Failures:**  
  - Position field missing or invalid leads to routing failure.  
  - AI model API failures include quota exhaustion, auth errors, or latency timeouts.  
  - AI output parsing can fail if the LLM response is malformed or does not comply with JSON schema.  
  - External HTTP request failures (network issues, auth errors) can degrade enrichment quality.  
  - Memory buffer overflow or key collisions if candidate emails are not unique.

- **Sticky Notes:**  
  - Sticky Note explains merge options to combine resume upload data and AI scores before CRM update.  
  - Sticky Note6 provides a detailed workflow summary and configuration instructions.

---

#### 2.3 Data Consolidation & Logging

- **Overview:**  
  Merges AI analysis output with resume metadata and uploads combined data as new rows into a Google Sheets CRM for tracking and further processing.

- **Nodes Involved:**  
  - Merge  
  - Append row in sheet

- **Node Details:**  

  - **Merge**  
    - Type: `Merge`  
    - Combines outputs from AI agents and resume upload metadata by position (combineByPosition mode).  
    - Ensures one consolidated record per candidate with both AI scores and Google Drive resume links.

  - **Append row in sheet**  
    - Type: `Google Sheets`  
    - Appends a new row to a specific Google Sheet ("Job pool sheet").  
    - Columns include candidate email, position, timestamp, AI summary, HR comment placeholder, resume link, resume score, candidate name, and a "Sent = 1" flag initialized to 0 (as empty string multiplied by 1).  
    - Credentials: Google Sheets OAuth2.

- **Edge Cases & Potential Failures:**  
  - Merge node misconfiguration can produce duplicate or incomplete records.  
  - Google Sheets API limits or authentication failures can block record insertion.  
  - Data schema mismatches may cause append failures or corrupt CRM data.

---

#### 2.4 Candidate Communication & CRM Update

- **Overview:**  
  Monitors the Google Sheets CRM for new candidate entries, prevents duplicate email sends, filters candidates based on AI scores, sends interview invitation or rejection emails, and updates the CRM row accordingly.

- **Nodes Involved:**  
  - Google Sheets Trigger  
  - If the application is sent (filter)  
  - Filters based on the score (filter)  
  - Send email  
  - Rejection mail  
  - Update row in sheet (two variants)  
  - No Operation, do nothing  
  - Sticky Note2, Sticky Note3, Sticky Note4

- **Node Details:**  

  - **Google Sheets Trigger**  
    - Type: `Google Sheets Trigger`  
    - Watches the specified sheet for new rows added (poll every minute).  
    - Triggers downstream logic when a candidate is added.

  - **If the application is sent**  
    - Type: `If`  
    - Checks if "Sent = 1" flag equals 1 to prevent resending emails.  
    - If true, sends flow to No Operation node (do nothing).  
    - If false, proceeds to score filtering.

  - **Filters based on the score**  
    - Type: `If`  
    - Checks if "Resume Score" is greater than 5 (threshold for interviews).  
    - If true, routes to Send email node (interview invitation).  
    - Else, routes to Rejection mail node.

  - **Send email**  
    - Type: `Email Send`  
    - Sends a plain text invitation email with interview details to candidate email.  
    - Subject: "Invitation for interview"  
    - From: info@customcx.com  
    - Credentials: SMTP IONOS account.

  - **Rejection mail**  
    - Type: `Email Send`  
    - Sends a rejection notification email to candidate email.  
    - Subject: "Invitation for interview" (likely should be "Rejection" subject, potential misconfiguration).  
    - From: info@customcx.com  
    - Credentials: SMTP IONOS account.

  - **Update row in sheet (two variants)**  
    - Type: `Google Sheets`  
    - Updates the existing CRM row to mark "Sent = 1" indicating email sent.  
    - Writes back all candidate info to prevent data loss.  
    - Matching is done by unique Timestamp column.  
    - Credentials: Google Sheets OAuth2.

  - **No Operation, do nothing**  
    - Type: `NoOp`  
    - Pass-through node to stop flow when email already sent.

- **Edge Cases & Potential Failures:**  
  - Email sending can fail due to SMTP errors, invalid email addresses, or quota limits.  
  - Google Sheets update may fail if row not found or API error.  
  - Potential subject line copy-paste error in rejection mail node.  
  - Race conditions if multiple edits happen simultaneously in sheet.

- **Sticky Notes:**  
  - Sticky Note2 describes the CRM update and email sending logic with thresholds.  
  - Sticky Note3 explains filtering to prevent repeated emails.  
  - Sticky Note4 clarifies candidate routing based on score thresholds.

---

#### 2.5 Supporting Utilities & Controls

- **Overview:**  
  Miscellaneous nodes that enhance workflow robustness, monitoring, and maintain clear documentation for users.

- **Nodes Involved:**  
  - Sticky Note nodes (multiple)  
  - No Operation, do nothing  

- **Node Details:**  

  - **Sticky Notes**  
    - Provide descriptive information, technical tips, workflow summaries, and user instructions.  
    - Appear at strategic points to clarify function or provide configuration advice.

  - **No Operation node**  
    - Used to halt processing branches gracefully without errors.

- **Edge Cases & Potential Failures:**  
  - None functional; purely for documentation and flow control.

---

### 3. Summary Table

| Node Name              | Node Type                           | Functional Role                                        | Input Node(s)          | Output Node(s)                        | Sticky Note                                                                                      |
|------------------------|-----------------------------------|-------------------------------------------------------|-----------------------|-------------------------------------|-------------------------------------------------------------------------------------------------|
| On form submission     | Form Trigger                      | Receive job application form data                      | —                     | Switch based on position, Upload file | Sticky Note1: Automates deep resume analysis vs traditional ATS                                  |
| Upload file            | Google Drive                      | Upload resume PDF to Google Drive                      | On form submission    | Merge                               | Sticky Note5: Candidates resume gets uploaded to google drive for later review                  |
| Extract from File       | Extract From File                 | Extract text from resume PDF (ICT path)                | Switch based on position | ICT Analysis                       |                                                                                                 |
| Extract from File1      | Extract From File                 | Extract text from resume PDF (Customer Care path)      | Switch based on position | Customer Care Agent               |                                                                                                 |
| Extract from File2      | Extract From File                 | Extract text from resume PDF (Accounting path)         | Switch based on position | Accountant                       |                                                                                                 |
| Extract from File3      | Extract From File                 | Extract text from resume PDF (HR path)                 | Switch based on position | HR Analysis                     |                                                                                                 |
| Switch based on position| Switch                           | Route based on application position                    | On form submission    | Extract from File*, Upload file     |                                                                                                 |
| ICT Analysis            | LangChain Agent                  | AI analysis for ICT resumes                            | Extract from File     | Merge                               |                                                                                                 |
| Customer Care Agent     | LangChain Agent                  | AI analysis for Customer Care resumes                  | Extract from File1    | Merge                               |                                                                                                 |
| Accountant             | LangChain Agent                  | AI analysis for Accounting resumes                     | Extract from File2    | Merge                               |                                                                                                 |
| HR Analysis             | LangChain Agent                  | AI analysis for HR resumes                             | Extract from File3    | Merge                               |                                                                                                 |
| Google Gemini Chat Model| LangChain Language Model         | LLM backend for all AI agents                          | —                     | ICT Analysis, Customer Care Agent, Accountant, HR Analysis |                                                                                                 |
| Structured Output Parser| LangChain Output Parser          | Enforce JSON schema on ICT analysis output            | ICT Analysis          | ICT Analysis                        |                                                                                                 |
| Structured Output Parser1| LangChain Output Parser         | Enforce JSON schema on Customer Care output           | Customer Care Agent   | Customer Care Agent                |                                                                                                 |
| Structured Output Parser2| LangChain Output Parser         | Enforce JSON schema on Accounting output              | Accountant            | Accountant                        |                                                                                                 |
| Structured Output Parser3| LangChain Output Parser         | Enforce JSON schema on HR output                       | HR Analysis           | HR Analysis                      |                                                                                                 |
| Simple Memory           | LangChain Memory Buffer Window   | Session memory for ICT AI agent                        | On form submission    | ICT Analysis                       |                                                                                                 |
| Simple Memory1          | LangChain Memory Buffer Window   | Session memory for HR AI agent                         | On form submission    | HR Analysis                       |                                                                                                 |
| Searches the internet   | HTTP Request Tool                | External API call for online profile enrichment       | —                     | ICT Analysis, Customer Care Agent, Accountant, HR Analysis |                                                                                                 |
| Merge                  | Merge                            | Combine resume upload data and AI analysis             | ICT Analysis, Customer Care Agent, Accountant, HR Analysis, Upload file | Append row in sheet                  | Sticky Note: Merge By Position consolidates resume URL + agent scores before sheet update       |
| Append row in sheet     | Google Sheets                    | Append candidate data to CRM sheet                      | Merge                 | —                                   |                                                                                                 |
| Google Sheets Trigger   | Google Sheets Trigger            | Watch sheet for new candidate rows                     | —                     | If the application is sent          |                                                                                                 |
| If the application is sent | If                            | Prevent duplicate email sends                           | Google Sheets Trigger | No Operation, Filters based on the score | Sticky Note3: prevents sending repeated emails                                                  |
| Filters based on the score| If                             | Route candidates by AI score threshold                  | If the application is sent | Send email, Rejection mail        | Sticky Note4: Candidates with higher score get invitation letter; others get rejection          |
| Send email              | Email Send                      | Send interview invitation to qualified candidates     | Filters based on the score | Update row in sheet              |                                                                                                 |
| Rejection mail          | Email Send                      | Send rejection email to candidates below threshold    | Filters based on the score | Update row in sheet1             |                                                                                                 |
| Update row in sheet     | Google Sheets                   | Mark candidate as contacted in CRM                     | Send email             | —                                   |                                                                                                 |
| Update row in sheet1    | Google Sheets                   | Mark candidate as contacted in CRM                     | Rejection mail         | —                                   |                                                                                                 |
| No Operation, do nothing| NoOp                           | Pass-through to stop flow on duplicates                | If the application is sent (true) | —                             |                                                                                                 |
| Sticky Note             | Sticky Note                    | Technical merge instructions                            | —                     | —                                   |                                                                                                 |
| Sticky Note1            | Sticky Note                    | Workflow description                                   | —                     | —                                   |                                                                                                 |
| Sticky Note2            | Sticky Note                    | CRM update & email sending logic description            | —                     | —                                   |                                                                                                 |
| Sticky Note3            | Sticky Note                    | Prevents repeated emails explanation                    | —                     | —                                   |                                                                                                 |
| Sticky Note4            | Sticky Note                    | Candidate routing based on score explanation            | —                     | —                                   |                                                                                                 |
| Sticky Note5            | Sticky Note                    | Resume upload confirmation                              | —                     | —                                   |                                                                                                 |
| Sticky Note6            | Sticky Note                    | Full workflow summary and usage instructions            | —                     | —                                   |                                                                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "On form submission" node**  
   - Type: `Form Trigger`  
   - Form Title: "Job Application (HR Digital Consulting)"  
   - Fields:  
     - Full Name (text, required)  
     - Application Position (dropdown: Accounting, ICT, Customer Care, HR; required)  
     - Email (text, required)  
     - Resume/CV (file upload, PDF only, single file, required)  
   - Options: Ignore bots enabled.

2. **Create "Switch based on position" node**  
   - Type: `Switch`  
   - Rules:  
     - ICT: Application Position equals "ICT"  
     - Customer Care: equals "Customer Care"  
     - Accounting: equals "Accounting"  
     - HR: equals "HR"  
   - Connect "On form submission" → "Switch based on position".

3. **Create four "Extract from File" nodes**  
   - Type: `Extract From File`  
   - Operation: PDF extraction  
   - Binary Property Name: `Resume_CV`  
   - Connect Switch outputs:  
     - ICT → Extract from File (ICT)  
     - Customer Care → Extract from File1  
     - Accounting → Extract from File2  
     - HR → Extract from File3

4. **Create "Upload file" node**  
   - Type: `Google Drive`  
   - Folder ID: target folder for resumes  
   - File name: `={{ $json['Resume/CV'].filename }}`  
   - Input data field: `Resume_CV`  
   - Credentials: Google Drive OAuth2  
   - Connect "On form submission" → "Upload file"

5. **Create "Google Gemini Chat Model" node**  
   - Type: `LangChain Google Gemini Chat Model`  
   - Model: `models/gemini-2.5-pro`  
   - Credentials: Google Palm API (Gemini)  
   - Connect to all AI agents (ICT, Customer Care, Accountant, HR) as language model input.

6. **Create AI agent nodes for each position:**  
   - Type: `LangChain Agent`  
   - Input text: extracted resume text from respective Extract from File node  
   - Use provided detailed system prompt per position (ICT, Customer Care, Accountant, HR) including scoring criteria and strict JSON output rules.  
   - Enable output parser with structured JSON schema: `{ "resume summary": "", "Score": <integer> }`  
   - Connect each Extract from File node → corresponding AI agent node.

7. **Create "Structured Output Parser" nodes (4 total)**  
   - Type: `LangChain Output Parser Structured`  
   - JSON schema example: `{ "resume summary": "", "Total Score": "" }`  
   - Connect each AI agent output → corresponding parser.

8. **Create "Simple Memory" nodes (for ICT and HR agents)**  
   - Type: `LangChain Memory Buffer Window`  
   - Session key: candidate email from form submission  
   - Connect "On form submission" → Simple Memory → AI agent memory input.

9. **Create "Searches the internet" node**  
   - Type: `HTTP Request`  
   - POST to `https://api.tavily.com/search`  
   - Body: JSON with "query" param  
   - Header: Authorization Bearer token (replace YOUR_TOKEN_HERE)  
   - Connect AI agents → HTTP Request as AI tool input.

10. **Create "Merge" node**  
    - Type: `Merge`  
    - Mode: Combine by Position (combineByPosition)  
    - Inputs: AI agents outputs and Upload file node output  
    - Connect all AI agents and Upload file → Merge node.

11. **Create "Append row in sheet" node**  
    - Type: `Google Sheets`  
    - Operation: Append  
    - Document ID: your Google Sheet ID  
    - Sheet Name: appropriate sheet (gid=0)  
    - Columns mapping: Candidate Name, Email, Position, Timestamp (current), AI Summary, Resume Score, Resume Link, HR Comment (empty), Sent = 1 (init 0)  
    - Credentials: Google Sheets OAuth2  
    - Connect Merge → Append row in sheet.

12. **Create "Google Sheets Trigger" node**  
    - Type: `Google Sheets Trigger`  
    - Document ID and Sheet Name same as above  
    - Event: Row Added  
    - Poll interval: every minute  
    - Credentials: Google Sheets Trigger OAuth2

13. **Create "If the application is sent" node**  
    - Type: `If`  
    - Condition: "Sent = 1" equals 1  
    - Connect Google Sheets Trigger → If node  
    - True output → No Operation (stop)  
    - False output → Filters based on the score

14. **Create "Filters based on the score" node**  
    - Type: `If`  
    - Condition: Resume Score > 5  
    - Connect If application sent (false output) → Filters based on the score  
    - True output → Send email  
    - False output → Rejection mail

15. **Create "Send email" node**  
    - Type: `Email Send`  
    - Subject: "Invitation for interview"  
    - From: info@customcx.com  
    - To: candidate email from sheet row  
    - Text body: interview invitation message  
    - Credentials: SMTP (e.g., IONOS)  
    - Connect Filters based on the score (true) → Send email

16. **Create "Rejection mail" node**  
    - Type: `Email Send`  
    - Subject: should be rejection (correct if needed)  
    - From: info@customcx.com  
    - To: candidate email from sheet row  
    - Text body: polite rejection message  
    - Credentials: SMTP  
    - Connect Filters based on the score (false) → Rejection mail

17. **Create "Update row in sheet" nodes (two variants)**  
    - Type: `Google Sheets`  
    - Operation: Update  
    - Match by Timestamp column  
    - Update all candidate data including setting "Sent = 1" to mark email sent  
    - Connect Send email → Update row in sheet  
    - Connect Rejection mail → Update row in sheet1

18. **Create "No Operation, do nothing" node**  
    - Type: `NoOp`  
    - Connect If application sent (true) → No Operation

19. **Add Sticky Notes**  
    - Add descriptive notes aligned with workflow blocks as per original sticky note contents for clarity and documentation.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                         | Context or Link                                                                                  |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow automates recruitment by analyzing resumes in-depth using AI rather than simple keyword matching.                                                                                                                    | Sticky Note1 content                                                                            |
| Candidates who score above 7 receive interview invitations; those scoring 6 or below get rejection emails. Thresholds can be adjusted as needed.                                                                                   | Sticky Note2 content                                                                            |
| The workflow merges resume upload and AI analysis results into a single record before updating Google Sheets, using 'Merge By Position' mode to avoid duplicate entries.                                                           | Sticky Note (technical merge instructions)                                                    |
| The AI agents use detailed prompts specifying evaluation criteria, scoring methodology, and output formatting to ensure consistent and objective candidate assessment.                                                             | AI Agent node descriptions                                                                     |
| The rejection email node has the same subject line as the invitation email, which may be a misconfiguration and should be corrected to avoid confusion.                                                                           | Analysis of Rejection mail node                                                                |
| External enrichment of candidate data is performed via an HTTP POST to Tavily API to verify online projects or profiles mentioned in resumes. Tokens must be securely stored and rotated as needed.                               | Searches the internet node description                                                        |
| Workflow configuration requires valid credentials for Google Drive, Google Sheets, Google Gemini API (PaLM), and SMTP email service.                                                                                            | Credentials references in various nodes                                                       |
| HR can stop the workflow at any time without manual screening, as AI agents provide automated candidate scoring and comments, enabling efficient hiring decisions.                                                               | Sticky Note6 workflow summary                                                                 |
| For more information on setting up Google Gemini API and LangChain nodes, consult n8n documentation and Google Cloud API references.                                                                                            | External resources (not linked in workflow, recommended for implementers)                      |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.