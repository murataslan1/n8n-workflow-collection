AI-Powered Candidate Shortlisting Automation for ERPNext

https://n8nworkflows.xyz/workflows/ai-powered-candidate-shortlisting-automation-for-erpnext-2757


# AI-Powered Candidate Shortlisting Automation for ERPNext

### 1. Workflow Overview

This workflow automates the shortlisting of job applicants in ERPNext using AI-powered evaluation. It integrates ERPNext with n8n and AI models (Google Gemini or OpenAI) to validate resumes, assess candidate fit against job descriptions, update ERPNext records, and notify candidates of their status. The workflow is designed to streamline recruitment by reducing manual effort and providing justifiable, data-driven decisions.

Logical blocks:

- **1.1 Input Reception & Initial Validation:** Receives webhook data from ERPNext when a job application is created; validates presence of resume and job application details.
- **1.2 Resume Processing:** Downloads and converts the resume attachment (PDF primarily) into text for AI analysis.
- **1.3 Job Description Retrieval:** Fetches the job opening details from ERPNext to provide context for AI evaluation.
- **1.4 AI-Powered Candidate Evaluation:** Uses an AI agent to compare resume text with job description, producing fit level, score, rating, and justification.
- **1.5 Data Formatting & ERPNext Update:** Parses AI output into ERPNext custom fields and updates the applicant record with evaluation results and status.
- **1.6 Decision Logic & Notifications:** Determines acceptance or rejection based on score thresholds and sends notifications via email or WhatsApp.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Initial Validation

- **Overview:**  
  This block triggers the workflow upon a new job applicant insertion in ERPNext, extracts relevant data, and validates the presence of a resume and job application against a job opening.

- **Nodes Involved:**  
  - Webhook  
  - Code  
  - ApplicantData (Set)  
  - Resume Link Provided (If)  
  - Applied Against Job (If)  
  - ERPNext - Reject if Resume not Attached (ERPNext)  
  - ERPNext - Hold Applicant (ERPNext)  
  - Reume Attachment Link (Set)  
  - Sticky Notes: Sticky Note2, Sticky Note10, Sticky Note13, Sticky Note12, Sticky Note4

- **Node Details:**

  - **Webhook**  
    - Type: Webhook  
    - Role: Entry point triggered by ERPNext on job applicant creation (HTTP POST).  
    - Config: Path `/syncbricks-com-tutorial-candidate-shortlist`, method POST.  
    - Inputs: HTTP POST data from ERPNext webhook.  
    - Outputs: Raw webhook JSON.  
    - Edge cases: Missing or malformed webhook data; ensure webhook is pinned and tested in ERPNext.

  - **Code**  
    - Type: Code (JavaScript)  
    - Role: Passes through input data, adds a dummy field `myNewField=1` (likely placeholder or for debugging).  
    - Config: Simple loop over input items, adds field.  
    - Inputs: Webhook output.  
    - Outputs: Modified JSON with additional field.  
    - Edge cases: Minimal risk; expression errors if input malformed.

  - **ApplicantData (Set)**  
    - Type: Set  
    - Role: Extracts `body` object from webhook JSON for easier access downstream.  
    - Config: Assigns `body` = `{{$json.body}}`.  
    - Inputs: Code node output.  
    - Outputs: JSON with `body` field containing applicant data.  
    - Edge cases: Missing `body` field in webhook JSON.

  - **Resume Link Provided (If)**  
    - Type: If  
    - Role: Checks if `resume_link` field in applicant data starts with "http" (valid URL).  
    - Config: Condition: `{{$json.body.resume_link}}` starts with "http".  
    - Inputs: ApplicantData output.  
    - Outputs: True branch if resume link valid; False branch if missing or invalid.  
    - Edge cases: Resume link missing or malformed; false branch triggers rejection.

  - **Applied Against Job (If)**  
    - Type: If  
    - Role: Checks if the applicant applied against a valid job opening (not "None").  
    - Config: Condition: `{{$json.body.Job_opening}}` not equals "None".  
    - Inputs: Resume Link Provided true branch.  
    - Outputs: True branch if job opening valid; False branch triggers hold status.  
    - Edge cases: Missing or invalid job opening field.

  - **ERPNext - Reject if Resume not Attached (ERPNext)**  
    - Type: ERPNext node (update)  
    - Role: Updates applicant status to "Rejected" if resume is not attached.  
    - Config: DocType: Job Applicant; update `status` field to "Rejected"; document identified by applicant name from webhook.  
    - Inputs: Resume Link Provided false branch.  
    - Outputs: None downstream (end of flow for rejection).  
    - Edge cases: API authentication errors; invalid document name.

  - **ERPNext - Hold Applicant (ERPNext)**  
    - Type: ERPNext node (update)  
    - Role: Updates applicant status to "Hold" if no job opening specified.  
    - Config: DocType: Job Applicant; update `status` to "Hold"; document identified by applicant name.  
    - Inputs: Applied Against Job false branch.  
    - Outputs: None downstream (end of flow for hold).  
    - Edge cases: API errors; invalid document name.

  - **Reume Attachment Link (Set)**  
    - Type: Set  
    - Role: Extracts and assigns the resume attachment URL to `body.resume_attachment` for downstream processing.  
    - Config: Assigns `body.resume_attachment` = `{{$json.body.resume_link}}`.  
    - Inputs: Applied Against Job true branch.  
    - Outputs: JSON with resume attachment URL.  
    - Edge cases: Missing resume link.

  - **Sticky Notes**  
    - Provide contextual instructions and reminders about webhook setup, data extraction, and validation logic.

---

#### 2.2 Resume Processing

- **Overview:**  
  Downloads the resume file (primarily PDF), converts it to text for AI analysis, with placeholders for other file types.

- **Nodes Involved:**  
  - File Type (Switch)  
  - Download PDF Resume (HTTP Request)  
  - PDF to Text (Extract from File)  
  - Txt File to Text (Extract from File)  
  - Merge1 (Merge)  
  - Sticky Notes: Sticky Note6, Sticky Note, Sticky Note12

- **Node Details:**

  - **File Type (Switch)**  
    - Type: Switch  
    - Role: Determines resume file type by checking file extension in `body.resume_attachment`.  
    - Config: Checks for `.pdf`, `.doc`, `.jpg` extensions; routes accordingly.  
    - Inputs: Reume Attachment Link output.  
    - Outputs: Routes to PDF, DOC, or JPG processing branches (only PDF branch implemented).  
    - Edge cases: Unsupported file types; no fallback branch defined.

  - **Download PDF Resume (HTTP Request)**  
    - Type: HTTP Request  
    - Role: Downloads the resume PDF from the provided URL.  
    - Config: URL from `body.resume_attachment`.  
    - Inputs: File Type PDF branch.  
    - Outputs: Binary PDF file data.  
    - Edge cases: Download failures, invalid URLs, network timeouts.

  - **PDF to Text (Extract from File)**  
    - Type: Extract from File  
    - Role: Converts downloaded PDF binary to text.  
    - Config: Operation set to PDF extraction.  
    - Inputs: Download PDF Resume output.  
    - Outputs: Extracted text content of resume.  
    - Edge cases: Scanned image PDFs not supported; extraction may fail or produce empty text.

  - **Txt File to Text (Extract from File)**  
    - Type: Extract from File  
    - Role: Example node for extracting text from plain text files (not connected in main flow).  
    - Edge cases: Not actively used; placeholder for future file types.

  - **Merge1 (Merge)**  
    - Type: Merge  
    - Role: Merges text extraction outputs (PDF or TXT) into a single stream for AI evaluation.  
    - Inputs: PDF to Text and Txt File to Text outputs.  
    - Outputs: Unified text content.  
    - Edge cases: If only one branch active, merges single input.

  - **Sticky Notes**  
    - Explain limitations of PDF text extraction and encourage adding other file type processing (e.g., Word, JPG with OCR).

---

#### 2.3 Job Description Retrieval

- **Overview:**  
  Retrieves job opening details from ERPNext to provide the job description for AI evaluation.

- **Nodes Involved:**  
  - Get Job Opening (ERPNext)  
  - Sticky Note5

- **Node Details:**

  - **Get Job Opening (ERPNext)**  
    - Type: ERPNext node (get)  
    - Role: Fetches Job Opening document by name from applicant data.  
    - Config: DocType: Job Opening; document name from `body.Job_opening`.  
    - Inputs: Merge1 output (after resume text extraction).  
    - Outputs: Job opening details including job description.  
    - Edge cases: Missing or invalid job opening name; API errors.

  - **Sticky Note5**  
    - Describes purpose of fetching job opening data for AI analysis.

---

#### 2.4 AI-Powered Candidate Evaluation

- **Overview:**  
  Uses an AI agent (LangChain agent with Google Gemini or OpenAI) to analyze resume text against job description and produce fit level, score, rating, and justification.

- **Nodes Involved:**  
  - Recruitment AI Agent (LangChain Agent)  
  - Google Gemini Chat Model (AI Model)  
  - Convert to Fields (Code)  
  - Sticky Note7, Sticky Note14

- **Node Details:**

  - **Google Gemini Chat Model**  
    - Type: LangChain Google Gemini Chat Model  
    - Role: Provides AI language model backend for the agent.  
    - Config: Model name `models/gemini-2.0-flash-exp`; credentials for Google PaLM API.  
    - Inputs: Connected as AI model for Recruitment AI Agent.  
    - Outputs: AI-generated text response.  
    - Edge cases: API quota limits, authentication errors, latency.

  - **Recruitment AI Agent**  
    - Type: LangChain Agent  
    - Role: Orchestrates AI prompt and analysis comparing job description and resume text.  
    - Config: System prompt defines recruitment specialist role, input variables for job title, description, and resume text; output format specified with FitLevel, Score, Rating, Justification.  
    - Inputs: Job opening data and resume text (merged).  
    - Outputs: AI textual evaluation.  
    - Edge cases: Prompt errors, incomplete inputs, AI hallucination.

  - **Convert to Fields (Code)**  
    - Type: Code (JavaScript)  
    - Role: Parses AI output text to extract structured fields: fit_level, score, applicant_rating, justification_by_ai.  
    - Config: Uses regex to extract each field from AI response text.  
    - Inputs: Recruitment AI Agent output.  
    - Outputs: JSON with extracted fields for ERPNext update.  
    - Edge cases: AI output format changes causing regex failures.

  - **Sticky Notes**  
    - Explain AI agent role and required ERPNext custom fields (`justification_by_ai`, `fit_level`, `score`).

---

#### 2.5 Data Formatting & ERPNext Update

- **Overview:**  
  Updates the applicant record in ERPNext with AI evaluation results and determines acceptance or rejection based on score.

- **Nodes Involved:**  
  - Update Applicant Data (HTTP Request)  
  - If score less than 80 (If)  
  - Reject Applicant (HTTP Request)  
  - Accept Applicant (HTTP Request)  
  - Sticky Note8, Sticky Note9, Sticky Note15, Sticky Note16

- **Node Details:**

  - **Update Applicant Data (HTTP Request)**  
    - Type: HTTP Request  
    - Role: Updates applicant record with AI fields: `applicant_rating`, `custom_justification_by_ai`, `custom_fit_level`, `custom_score`.  
    - Config: PUT request to ERPNext API endpoint for Job Applicant; JSON body maps extracted fields.  
    - Inputs: Convert to Fields output.  
    - Outputs: Applicant record updated; triggers score evaluation.  
    - Edge cases: API errors, invalid field names, authentication issues.

  - **If score less than 80 (If)**  
    - Type: If  
    - Role: Checks if AI score is below 80 to decide rejection or acceptance.  
    - Config: Condition: `score < 80`.  
    - Inputs: Update Applicant Data output.  
    - Outputs: True branch to Reject Applicant; False branch to Accept Applicant.  
    - Edge cases: Missing or non-numeric score.

  - **Reject Applicant (HTTP Request)**  
    - Type: HTTP Request  
    - Role: Updates applicant status to "Rejected" in ERPNext.  
    - Config: PUT request to ERPNext API; sets `status` to "Rejected".  
    - Inputs: If score less than 80 true branch.  
    - Outputs: Triggers notification.  
    - Edge cases: API errors.

  - **Accept Applicant (HTTP Request)**  
    - Type: HTTP Request  
    - Role: Updates applicant status to "Accepted" in ERPNext.  
    - Config: PUT request to ERPNext API; sets `status` to "Accepted".  
    - Inputs: If score less than 80 false branch.  
    - Outputs: Triggers notification.  
    - Edge cases: API errors.

  - **Sticky Notes**  
    - Explain update logic and acceptance criteria.

---

#### 2.6 Decision Logic & Notifications

- **Overview:**  
  Sends notification to candidates about their application status via email or WhatsApp.

- **Nodes Involved:**  
  - Microsoft Outlook (Email)  
  - WhatsApp Business Cloud (WhatsApp)  
  - Sticky Note17

- **Node Details:**

  - **Microsoft Outlook**  
    - Type: Microsoft Outlook node  
    - Role: Sends email notification to candidate.  
    - Config: Uses OAuth2 credentials; email content configurable (not detailed in JSON).  
    - Inputs: Reject Applicant output (likely for rejection notification).  
    - Outputs: Email sent confirmation.  
    - Edge cases: Authentication errors, email delivery failures.

  - **WhatsApp Business Cloud**  
    - Type: WhatsApp node  
    - Role: Sends WhatsApp message notification to candidate.  
    - Config: Uses WhatsApp API credentials; message content configurable.  
    - Inputs: Accept Applicant output (likely for acceptance notification).  
    - Outputs: Message sent confirmation.  
    - Edge cases: API token expiration, message delivery failures.

  - **Sticky Note17**  
    - Notes that notification options are flexible and can include SMS or other channels.

---

### 3. Summary Table

| Node Name                         | Node Type                     | Functional Role                                   | Input Node(s)                      | Output Node(s)                           | Sticky Note                                                                                          |
|----------------------------------|-------------------------------|-------------------------------------------------|----------------------------------|-----------------------------------------|----------------------------------------------------------------------------------------------------|
| Webhook                          | Webhook                       | Entry point triggered by ERPNext webhook         | -                                | Code                                    | Sticky Note2: Setup ERPNext webhook on Job Applicant DocType with insert trigger                    |
| Code                             | Code                          | Passes through input data with minor modification| Webhook                         | ApplicantData                           | Sticky Note4: Extract required data from webhook node                                              |
| ApplicantData                    | Set                           | Extracts `body` field from webhook JSON           | Code                            | Resume Link Provided                    | Sticky Note4                                                                                       |
| Resume Link Provided             | If                            | Checks if resume link is valid URL                 | ApplicantData                   | Applied Against Job, ERPNext - Reject if Resume not Attached | Sticky Note10: Resume availability check logic                                                    |
| Applied Against Job              | If                            | Checks if job opening is specified                 | Resume Link Provided            | Reume Attachment Link, ERPNext - Hold Applicant | Sticky Note10                                                                                       |
| ERPNext - Reject if Resume not Attached | ERPNext (update)          | Rejects applicant if no resume attached            | Resume Link Provided (false)    | -                                       | Sticky Note10                                                                                       |
| ERPNext - Hold Applicant         | ERPNext (update)              | Holds applicant if no job opening specified        | Applied Against Job (false)     | -                                       | Sticky Note10                                                                                       |
| Reume Attachment Link            | Set                           | Assigns resume attachment URL                       | Applied Against Job (true)      | File Type                              | Sticky Note12: Extract resume download link and determine attachment type                          |
| File Type                       | Switch                        | Routes based on resume file extension               | Reume Attachment Link           | Download PDF Resume                     | Sticky Note6: PDF to text conversion limitations                                                  |
| Download PDF Resume              | HTTP Request                  | Downloads resume PDF file                            | File Type (pdf)                 | PDF to Text                            | Sticky Note                                                                                       |
| PDF to Text                     | Extract from File             | Converts PDF binary to text                          | Download PDF Resume             | Merge1                                | Sticky Note6                                                                                       |
| Txt File to Text (Example)      | Extract from File             | Example node for text extraction from TXT files    | File Type (doc/jpg not connected) | Merge1                             | Sticky Note6                                                                                       |
| Merge1                         | Merge                         | Merges extracted text from resume                   | PDF to Text, Txt File to Text   | Get Job Opening                       | Sticky Note                                                                                       |
| Get Job Opening                 | ERPNext (get)                 | Retrieves job opening details                        | Merge1                         | Recruitment AI Agent                  | Sticky Note5: Get job opening data including job description                                     |
| Recruitment AI Agent            | LangChain Agent               | AI evaluation comparing resume and job description | Get Job Opening                | Convert to Fields                    | Sticky Note7: AI agent prompt and evaluation logic                                               |
| Google Gemini Chat Model        | LangChain AI Model            | Provides AI model backend                            | Recruitment AI Agent (ai_languageModel) | Recruitment AI Agent           |                                                                                                    |
| Convert to Fields              | Code                          | Parses AI output text into structured fields        | Recruitment AI Agent            | Update Applicant Data                | Sticky Note14: Create ERPNext fields from AI output                                              |
| Update Applicant Data          | HTTP Request                  | Updates applicant record with AI evaluation results | Convert to Fields              | If score less than 80                | Sticky Note8: Format and update ERPNext with AI data                                            |
| If score less than 80          | If                            | Determines acceptance or rejection based on score  | Update Applicant Data           | Reject Applicant, Accept Applicant   | Sticky Note9: Score threshold for acceptance                                                    |
| Reject Applicant              | HTTP Request                  | Updates applicant status to "Rejected"              | If score less than 80 (true)    | Microsoft Outlook                   | Sticky Note15, Sticky Note16: API call for rejection                                            |
| Accept Applicant              | HTTP Request                  | Updates applicant status to "Accepted"              | If score less than 80 (false)   | WhatsApp Business Cloud             | Sticky Note15, Sticky Note16: API call for acceptance                                           |
| Microsoft Outlook             | Microsoft Outlook             | Sends email notification to rejected applicant      | Reject Applicant               | -                                   | Sticky Note17: Notification options                                                            |
| WhatsApp Business Cloud       | WhatsApp                     | Sends WhatsApp notification to accepted applicant   | Accept Applicant               | -                                   | Sticky Note17                                                                                   |
| Sticky Note(s)                | Sticky Note                  | Provide instructions, explanations, and credits    | -                              | -                                   | Various sticky notes as detailed above                                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - Path: `syncbricks-com-tutorial-candidate-shortlist`  
   - HTTP Method: POST  
   - Purpose: Receive ERPNext Job Applicant insert event.

2. **Add Code Node**  
   - Type: Code (JavaScript)  
   - Code: Loop over input items and add `myNewField=1` (optional, for debugging).  
   - Connect Webhook output to this node.

3. **Add Set Node (ApplicantData)**  
   - Type: Set  
   - Assign `body` = `{{$json.body}}` from input.  
   - Connect Code node output here.

4. **Add If Node (Resume Link Provided)**  
   - Type: If  
   - Condition: Check if `{{$json.body.resume_link}}` starts with "http".  
   - Connect ApplicantData output here.

5. **Add If Node (Applied Against Job)**  
   - Type: If  
   - Condition: `{{$json.body.Job_opening}}` not equals "None".  
   - Connect Resume Link Provided true branch here.

6. **Add ERPNext Update Node (Reject if Resume Not Attached)**  
   - Type: ERPNext (update)  
   - DocType: Job Applicant  
   - Document Name: `{{$json.body.name}}`  
   - Update Field: `status` = "Rejected"  
   - Connect Resume Link Provided false branch here.

7. **Add ERPNext Update Node (Hold Applicant)**  
   - Type: ERPNext (update)  
   - DocType: Job Applicant  
   - Document Name: `{{$json.body.name}}`  
   - Update Field: `status` = "Hold"  
   - Connect Applied Against Job false branch here.

8. **Add Set Node (Reume Attachment Link)**  
   - Type: Set  
   - Assign `body.resume_attachment` = `{{$json.body.resume_link}}`  
   - Connect Applied Against Job true branch here.

9. **Add Switch Node (File Type)**  
   - Type: Switch  
   - Rules:  
     - PDF: if `body.resume_attachment` ends with ".pdf"  
     - DOC: if contains ".doc"  
     - JPG: if ends with ".jpg"  
   - Connect Reume Attachment Link output here.

10. **Add HTTP Request Node (Download PDF Resume)**  
    - Type: HTTP Request  
    - URL: `{{$json.body.resume_attachment}}`  
    - Connect File Type PDF branch here.

11. **Add Extract From File Node (PDF to Text)**  
    - Type: Extract from File  
    - Operation: PDF  
    - Connect Download PDF Resume output here.

12. **Add Extract From File Node (Txt File to Text - Optional)**  
    - Type: Extract from File  
    - Operation: Text  
    - Connect File Type DOC/JPG branches here if implemented.

13. **Add Merge Node (Merge1)**  
    - Type: Merge  
    - Mode: Merge inputs  
    - Connect PDF to Text and Txt File to Text outputs here.

14. **Add ERPNext Get Node (Get Job Opening)**  
    - Type: ERPNext (get)  
    - DocType: Job Opening  
    - Document Name: `{{$json.body.Job_opening}}`  
    - Connect Merge1 output here.

15. **Add LangChain Google Gemini Chat Model Node**  
    - Type: LangChain AI Model  
    - Model Name: `models/gemini-2.0-flash-exp`  
    - Credentials: Google PaLM API credentials  
    - No direct input; connected as AI model for agent.

16. **Add LangChain Agent Node (Recruitment AI Agent)**  
    - Type: LangChain Agent  
    - Prompt: System prompt defining recruitment specialist role, inputs: job title, job description, resume text.  
    - Connect Get Job Opening output and Merge1 output as inputs.  
    - Set AI model to Google Gemini Chat Model node.

17. **Add Code Node (Convert to Fields)**  
    - Type: Code  
    - JavaScript to parse AI output text and extract `fit_level`, `score`, `applicant_rating`, `justification_by_ai`.  
    - Connect Recruitment AI Agent output here.

18. **Add HTTP Request Node (Update Applicant Data)**  
    - Type: HTTP Request  
    - Method: PUT  
    - URL: `https://erpnext.syncbricks.com/api/resource/Job Applicant/{{$json.body.name}}`  
    - JSON Body: Map extracted fields to ERPNext custom fields (`applicant_rating`, `custom_justification_by_ai`, `custom_fit_level`, `custom_score`).  
    - Credentials: ERPNext API credentials  
    - Connect Convert to Fields output here.

19. **Add If Node (If score less than 80)**  
    - Type: If  
    - Condition: `{{$json.score}} < 80`  
    - Connect Update Applicant Data output here.

20. **Add HTTP Request Node (Reject Applicant)**  
    - Type: HTTP Request  
    - Method: PUT  
    - URL: `https://erpnext.syncbricks.com/api/resource/Job Applicant/{{$json.body.name}}`  
    - JSON Body: `{ "status": "Rejected" }`  
    - Credentials: ERPNext API credentials  
    - Connect If node true branch here.

21. **Add HTTP Request Node (Accept Applicant)**  
    - Type: HTTP Request  
    - Method: PUT  
    - URL: `https://erpnext.syncbricks.com/api/resource/Job Applicant/{{$json.body.name}}`  
    - JSON Body: `{ "status": "Accepted" }`  
    - Credentials: ERPNext API credentials  
    - Connect If node false branch here.

22. **Add Microsoft Outlook Node (Email Notification)**  
    - Type: Microsoft Outlook  
    - Credentials: OAuth2 credentials for Outlook  
    - Connect Reject Applicant output here (for rejection emails).  
    - Configure email content as needed.

23. **Add WhatsApp Business Cloud Node (WhatsApp Notification)**  
    - Type: WhatsApp  
    - Credentials: WhatsApp API token  
    - Connect Accept Applicant output here (for acceptance messages).  
    - Configure message content as needed.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                 | Context or Link                                                                                          |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| YouTube Tutorial for full workflow walkthrough: "Integrate AI in ERPNext: Automate Recruitment Job Applicant Shortlisting in Seconds!"                                                                                                                                                                                                                     | https://youtu.be/JsRCryrSAn0                                                                             |
| SyncBricks YouTube Channel for more automation templates and tutorials.                                                                                                                                                                                                                                                                                      | https://youtube.com/@syncbricks                                                                          |
| SyncBricks LMS for detailed guides and courses on ERPNext and AI-driven automation.                                                                                                                                                                                                                                                                         | http://lms.syncbricks.com                                                                                 |
| Developed by Amjid Ali. Support and credits: PayPal donations, LinkedIn profile, and website for further learning and support.                                                                                                                                                                                                                              | http://paypal.me/pmptraining, https://linkedin.com/in/amjidali, https://syncbricks.com                    |
| Important: N8N's PDF to Text node cannot convert scanned image PDFs; consider adding OCR or other file type processing for Word or JPG resumes.                                                                                                                                                                                                             | Sticky Note6                                                                                            |
| Ensure ERPNext custom fields exist: `justification_by_ai`, `fit_level`, `score`. The `applicant_rating` field is standard and updated with a 1-5 star rating.                                                                                                                                                                                                | Sticky Note14                                                                                           |
| Notifications can be extended beyond email and WhatsApp to SMS or other channels as needed.                                                                                                                                                                                                                                                                 | Sticky Note17                                                                                           |

---

This documentation provides a complete, structured reference for understanding, reproducing, and modifying the AI-Powered Candidate Shortlisting Automation workflow for ERPNext in n8n. It covers all nodes, logic, configurations, and integration points to ensure robust deployment and customization.