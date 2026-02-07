AI Talent Screener – CV Parser, Job Fit Evaluator & Email Notifier

https://n8nworkflows.xyz/workflows/ai-talent-screener---cv-parser--job-fit-evaluator---email-notifier-4055


# AI Talent Screener – CV Parser, Job Fit Evaluator & Email Notifier

---

## 1. Workflow Overview

This workflow, **AI Talent Screener – CV Parser, Job Fit Evaluator & Email Notifier**, automates the recruitment pipeline from candidate CV submission through to shortlisting decisions and notifications. It is designed for HR teams, recruiters, and hiring managers seeking to streamline and enhance the candidate evaluation process using AI.

The workflow is logically divided into the following functional blocks:

**1.1 Candidate Submission & File Handling**  
Receives CV submissions via an embedded form, uploads the CV to Google Drive, and extracts raw content for processing.

**1.2 Applicant Data Extraction & Storage**  
Uses AI to parse and extract detailed applicant information from the CV content, then records this data into a Google Sheet.

**1.3 Applicant Profile Summarization**  
Summarizes the detailed applicant profile using AI to create a concise representation for evaluation.

**1.4 Job Description Retrieval & Summarization**  
Fetches the relevant job description from Google Sheets and summarizes it using AI.

**1.5 AI-powered Semantic Fit Evaluation**  
Performs an advanced AI evaluation comparing applicant profile and job description, analyzing job fit, red flags, and soft skills.

**1.6 Result Recording & Talent Acquisition Notification**  
Updates the evaluation results into Google Sheets and notifies the Talent Acquisition (TA) team via email for approval.

**1.7 Approval Decision & Candidate Notification**  
Based on TA approval, sends either a shortlist or rejection email to the candidate.

---

## 2. Block-by-Block Analysis

### 2.1 Candidate Submission & File Handling

**Overview:**  
Captures CV submissions from candidates through a form, saves the CV file to Google Drive, and extracts its content for further AI processing.

**Nodes Involved:**  
- On form submission  
- Upload CV  
- Extract from File  

**Node Details:**  

- **On form submission**  
  - Type: Form Trigger  
  - Role: Entry point, triggers workflow on form submission with candidate data and CV file.  
  - Configuration: Default webhook listens for form submissions; configurable form fields expected (e.g., CV upload, candidate name).  
  - Input: HTTP request payload from embedded form.  
  - Output: CV file data and form fields forwarded to Upload CV.  
  - Edge cases: Missing file upload, malformed form data.  

- **Upload CV**  
  - Type: Google Drive node  
  - Role: Stores the submitted CV file into a designated Google Drive folder.  
  - Configuration: Uses Google Drive credentials; configured with specific folder ID to save CVs.  
  - Input: File data from form submission.  
  - Output: File metadata (including Drive file ID) passed to Extract from File.  
  - Edge cases: Google Drive API quota limits, permission errors.  

- **Extract from File**  
  - Type: Extract From File  
  - Role: Extracts text content from the uploaded CV file for processing.  
  - Configuration: Default extraction settings for text extraction from common document types (PDF, DOCX).  
  - Input: File metadata from Upload CV.  
  - Output: Extracted raw text of CV forwarded to Add Applicant's Details in Google Sheet.  
  - Edge cases: Unsupported file formats, extraction failures due to corrupt files.  

---

### 2.2 Applicant Data Extraction & Storage

**Overview:**  
Processes the extracted CV text using AI to extract structured applicant details, then stores these details into a Google Sheet for record-keeping.

**Nodes Involved:**  
- Add Applicant's Details in Google Sheet  
- Applicant's Details  

**Node Details:**  

- **Add Applicant's Details in Google Sheet**  
  - Type: Google Sheets node  
  - Role: Inserts a new row with applicant metadata and extracted details into a Google Sheet.  
  - Configuration: Connected to the Google Sheets credential; configured with spreadsheet ID and sheet name for applicants.  
  - Input: Raw extracted CV text from Extract from File.  
  - Output: Triggers Applicant's Details node to perform AI extraction.  
  - Edge cases: Sheet access issues, row insertion failures due to invalid data.  

- **Applicant's Details**  
  - Type: Information Extractor (LangChain)  
  - Role: Uses AI to parse and extract structured candidate information such as name, skills, experience, education, and contact details from CV text.  
  - Configuration: Predefined prompts and extraction schema tailored for resume parsing.  
  - Input: Data from Google Sheets insertion node.  
  - Output: Structured applicant details passed to Summarize Applicant's Profile node.  
  - Expressions: Uses AI language model outputs; model version and prompt tuning affect accuracy.  
  - Edge cases: Ambiguous data causing extraction errors, incomplete CV information, AI API timeouts.  

---

### 2.3 Applicant Profile Summarization

**Overview:**  
Condenses the extracted applicant information into a concise summary to facilitate efficient evaluation.

**Nodes Involved:**  
- Summarize Applicant's Profile  

**Node Details:**  

- **Summarize Applicant's Profile**  
  - Type: Chain Summarization (LangChain)  
  - Role: Summarizes structured applicant details into a readable brief.  
  - Configuration: Uses OpenAI language model with summarization prompt tailored for recruitment context.  
  - Input: Structured applicant details from Applicant's Details node.  
  - Output: Summary passed to Get Job Description from Google Sheets node.  
  - Edge cases: AI summarization inconsistencies, API latency.  

---

### 2.4 Job Description Retrieval & Summarization

**Overview:**  
Retrieves the job description from a centralized Google Sheet and summarizes it for comparison with applicant data.

**Nodes Involved:**  
- Get Job Description from Google Sheets  
- Summarize Job Role Description  

**Node Details:**  

- **Get Job Description from Google Sheets**  
  - Type: Google Sheets node  
  - Role: Fetches job description text corresponding to the job role selected in the form.  
  - Configuration: Uses Google Sheets credentials; configured with spreadsheet ID and sheet range where job descriptions are stored.  
  - Input: Triggered after applicant profile summarization.  
  - Output: Raw job description text passed to Summarize Job Role Description.  
  - Edge cases: Missing or outdated job descriptions, permission errors.  

- **Summarize Job Role Description**  
  - Type: Chain Summarization (LangChain)  
  - Role: Summarizes the job description text into a concise format for AI evaluation.  
  - Configuration: OpenAI language model with summarization prompts specific to job descriptions.  
  - Input: Raw job description from Google Sheets.  
  - Output: Summarized job profile passed to Semantic Fit & Evaluation node.  
  - Edge cases: Summarization errors, incomplete job description data.  

---

### 2.5 AI-powered Semantic Fit Evaluation

**Overview:**  
Performs a detailed AI-based comparison between applicant and job summaries to evaluate job fit, detect red flags, and assess soft skills.

**Nodes Involved:**  
- Semantic Fit & Evaluation by HR Expert  
- Structured Output Parser  

**Node Details:**  

- **Semantic Fit & Evaluation by HR Expert**  
  - Type: Chain LLM (LangChain)  
  - Role: Runs AI prompt combining applicant and job summaries to generate a structured evaluation report.  
  - Configuration: Uses OpenAI chat language model with a prompt designed by HR experts, considering semantic matching and qualitative assessment.  
  - Input: Summarized applicant profile and job role description.  
  - Output: Raw AI evaluation output forwarded to Structured Output Parser.  
  - Edge cases: API rate limiting, ambiguous AI responses, prompt tuning required for accuracy.  

- **Structured Output Parser**  
  - Type: Output Parser (LangChain)  
  - Role: Parses the AI evaluation output into structured data for downstream processing.  
  - Configuration: Defined JSON schema extraction to convert textual AI response into discrete fields.  
  - Input: Raw AI evaluation from Semantic Fit node.  
  - Output: Structured evaluation data sent to Update Evaluation Results in Google Sheets.  
  - Edge cases: Parsing failures if AI output deviates from expected format.  

---

### 2.6 Result Recording & Talent Acquisition Notification

**Overview:**  
Updates the Google Sheet with the AI evaluation results and sends an email notification to the Talent Acquisition team to review and approve the candidate.

**Nodes Involved:**  
- Update Evaluation Results in Google Sheets  
- Notify TA for Approval via Email  

**Node Details:**  

- **Update Evaluation Results in Google Sheets**  
  - Type: Google Sheets node  
  - Role: Updates existing or inserts new row with AI evaluation results for the applicant.  
  - Configuration: Uses Google Sheets credentials; targets the evaluation results sheet and precise cell ranges for updates.  
  - Input: Structured evaluation data from Structured Output Parser.  
  - Output: Triggers notification email to TA.  
  - Edge cases: Data overwrite, concurrent access issues.  

- **Notify TA for Approval via Email**  
  - Type: Email Send (SMTP or configured email)  
  - Role: Sends an email to the Talent Acquisition team containing summary and evaluation results, requesting approval decision.  
  - Configuration: SMTP credentials configured; customizable sender and recipient addresses; email template includes evaluation summary and approval link or instructions.  
  - Input: Data from Google Sheets update confirmation.  
  - Output: Triggers Approval Check IF Condition node upon response.  
  - Edge cases: Email delivery failures, spam filtering, missing recipient configuration.  

---

### 2.7 Approval Decision & Candidate Notification

**Overview:**  
Handles the approval decision from the TA team and sends either a shortlist or rejection email to the candidate accordingly.

**Nodes Involved:**  
- Approval Check - IF Condition  
- Send Shortlist Email to Candidate  
- Send Rejection Email to Candidate  

**Node Details:**  

- **Approval Check - IF Condition**  
  - Type: If condition node  
  - Role: Checks boolean or status field indicating TA approval or rejection.  
  - Configuration: Evaluates specific data field from TA feedback (e.g., "approved" = true).  
  - Input: Triggered by TA notification email completion or manual input.  
  - Output: Routes to either shortlist email node (true) or rejection email node (false).  
  - Edge cases: Missing or ambiguous approval status, timing issues.  

- **Send Shortlist Email to Candidate**  
  - Type: Email Send  
  - Role: Sends an email to the candidate informing them of shortlisting and next steps.  
  - Configuration: SMTP credentials; customizable email content; uses form data for candidate email address.  
  - Input: Approval condition true path.  
  - Output: Workflow end.  
  - Edge cases: Email failures, incorrect email addresses.  

- **Send Rejection Email to Candidate**  
  - Type: Email Send  
  - Role: Sends a polite rejection email to the candidate.  
  - Configuration: Similar to shortlist email node with rejection template.  
  - Input: Approval condition false path.  
  - Output: Workflow end.  
  - Edge cases: Same as shortlist email node.  

---

## 3. Summary Table

| Node Name                         | Node Type                          | Functional Role                       | Input Node(s)                    | Output Node(s)                       | Sticky Note                                                                                   |
|----------------------------------|----------------------------------|------------------------------------|---------------------------------|------------------------------------|---------------------------------------------------------------------------------------------|
| On form submission               | Form Trigger                     | Entry point for candidate submission| -                               | Upload CV                          |                                                                                             |
| Upload CV                       | Google Drive                    | Save CV file                       | On form submission              | Extract from File                  |                                                                                             |
| Extract from File               | Extract From File               | Extract raw text from CV           | Upload CV                      | Add Applicant's Details in Google Sheet |                                                                                             |
| Add Applicant's Details in Google Sheet | Google Sheets                  | Store applicant metadata           | Extract from File              | Applicant's Details                |                                                                                             |
| Applicant's Details             | Information Extractor (LangChain)| Parse and extract structured data | Add Applicant's Details in Google Sheet | Summarize Applicant's Profile     |                                                                                             |
| Summarize Applicant's Profile  | Chain Summarization (LangChain) | Summarize applicant profile        | Applicant's Details            | Get Job Description from Google Sheets |                                                                                             |
| Get Job Description from Google Sheets | Google Sheets                  | Fetch job description               | Summarize Applicant's Profile | Summarize Job Role Description    |                                                                                             |
| Summarize Job Role Description  | Chain Summarization (LangChain) | Summarize job description          | Get Job Description from Google Sheets | Semantic Fit & Evaluation by HR Expert |                                                                                             |
| Semantic Fit & Evaluation by HR Expert | Chain LLM (LangChain)          | AI evaluation of applicant-job fit | Summarize Job Role Description | Update Evaluation Results in Google Sheets |                                                                                             |
| Structured Output Parser         | Output Parser (LangChain)        | Parse AI evaluation output         | Semantic Fit & Evaluation by HR Expert | Semantic Fit & Evaluation by HR Expert (ai_outputParser connection) |                                                                                             |
| Update Evaluation Results in Google Sheets | Google Sheets                  | Record AI evaluation results       | Structured Output Parser       | Notify TA for Approval via Email  |                                                                                             |
| Notify TA for Approval via Email | Email Send                      | Email notification to TA team      | Update Evaluation Results in Google Sheets | Approval Check - IF Condition     |                                                                                             |
| Approval Check - IF Condition    | If Condition                    | Check TA approval decision         | Notify TA for Approval via Email | Send Shortlist Email to Candidate, Send Rejection Email to Candidate |                                                                                             |
| Send Shortlist Email to Candidate | Email Send                      | Send shortlist notification to candidate | Approval Check - IF Condition | -                                  |                                                                                             |
| Send Rejection Email to Candidate | Email Send                      | Send rejection email to candidate  | Approval Check - IF Condition | -                                  |                                                                                             |
| Sticky Note                     | Sticky Note                    | Annotation                       | -                               | -                                  |                                                                                             |
| Sticky Note1                    | Sticky Note                    | Annotation                       | -                               | -                                  |                                                                                             |
| Sticky Note2                    | Sticky Note                    | Annotation                       | -                               | -                                  |                                                                                             |
| Sticky Note3                    | Sticky Note                    | Annotation                       | -                               | -                                  |                                                                                             |
| Sticky Note4                    | Sticky Note                    | Annotation                       | -                               | -                                  |                                                                                             |
| Sticky Note5                    | Sticky Note                    | Annotation                       | -                               | -                                  |                                                                                             |
| Sticky Note6                    | Sticky Note                    | Annotation                       | -                               | -                                  |                                                                                             |
| Sticky Note7                    | Sticky Note                    | Annotation                       | -                               | -                                  |                                                                                             |
| Sticky Note8                    | Sticky Note                    | Annotation                       | -                               | -                                  |                                                                                             |
| Sticky Note9                    | Sticky Note                    | Annotation                       | -                               | -                                  |                                                                                             |
| Sticky Note10                   | Sticky Note                    | Annotation                       | -                               | -                                  |                                                                                             |
| Sticky Note11                   | Sticky Note                    | Annotation                       | -                               | -                                  |                                                                                             |
| Sticky Note12                   | Sticky Note                    | Annotation                       | -                               | -                                  |                                                                                             |
| Sticky Note13                   | Sticky Note                    | Annotation                       | -                               | -                                  |                                                                                             |

---

## 4. Reproducing the Workflow from Scratch

1. **Create Form Trigger node**  
   - Type: Form Trigger  
   - Configure webhook to receive candidate submissions with fields including CV file upload and job role selection.  
   - No special parameters initially; adjust form fields as needed.  

2. **Add Google Drive node to upload CV**  
   - Type: Google Drive  
   - Configure credentials with Google Drive OAuth2.  
   - Set action to "Upload File" and specify target folder ID for CV storage.  
   - Connect output of Form Trigger to this node.  

3. **Add Extract From File node**  
   - Type: Extract From File  
   - Use default settings to extract text from uploaded CV files (supports PDF, DOCX).  
   - Connect output of Google Drive upload node here.  

4. **Add Google Sheets node to add applicant details row**  
   - Type: Google Sheets (Append Row)  
   - Configure Google Sheets OAuth2 credentials.  
   - Set spreadsheet ID and sheet name where applicant data is stored.  
   - Connect output of Extract From File node here.  

5. **Add Information Extractor node (LangChain)**  
   - Type: Information Extractor  
   - Configure OpenAI credentials.  
   - Use prompts designed for resume parsing to extract structured fields (name, skills, contact, experience).  
   - Connect output of Google Sheets append node here.  

6. **Add Chain Summarization node for applicant profile**  
   - Type: Chain Summarization  
   - Configure OpenAI credentials.  
   - Use summarization prompt to create a concise applicant profile summary.  
   - Connect output of Information Extractor here.  

7. **Add Google Sheets node to get job description**  
   - Type: Google Sheets (Read Rows)  
   - Use the same Google Sheets credentials.  
   - Specify spreadsheet and range where job descriptions are stored.  
   - Connect output of applicant profile summarization node here.  

8. **Add Chain Summarization node for job description**  
   - Type: Chain Summarization  
   - Configure OpenAI credentials.  
   - Use prompt to summarize job description into concise format.  
   - Connect output of Google Sheets job description node here.  

9. **Add Chain LLM node for semantic fit evaluation**  
   - Type: Chain LLM  
   - Configure OpenAI credentials.  
   - Use an HR expert-designed prompt comparing applicant and job summaries, evaluating fit, red flags, and soft skills.  
   - Connect output of job role summarization node here.  

10. **Add Output Parser node (LangChain)**  
    - Type: Output Parser  
    - Configure with schema to parse AI evaluation output into structured data (JSON).  
    - Connect output of semantic fit evaluation node here (ai_outputParser connection).  

11. **Add Google Sheets node to update evaluation results**  
    - Type: Google Sheets (Update Row)  
    - Configure to update specific rows in the spreadsheet with evaluation results.  
    - Connect output of Output Parser node here.  

12. **Add Email Send node to notify Talent Acquisition team**  
    - Type: Email Send  
    - Configure SMTP credentials or use integrated email service.  
    - Set sender and TA team recipient emails; include evaluation summary and approval request.  
    - Connect output of Google Sheets update node here.  

13. **Add IF Condition node to check TA approval**  
    - Type: IF Condition  
    - Configure condition to check boolean or status field indicating TA approval from input data.  
    - Connect output of Email Send node here.  

14. **Add Email Send nodes for candidate notification**  
    - Type: Email Send (two nodes)  
    - Configure one to send shortlist email; customize content and recipient candidate email.  
    - Configure second to send rejection email similarly.  
    - Connect true branch of IF node to shortlist email node.  
    - Connect false branch of IF node to rejection email node.  

15. **Test each stage thoroughly**  
    - Verify form submission triggers workflow correctly.  
    - Confirm CV uploads and text extraction work for various file formats.  
    - Validate AI extraction and summarization accuracy.  
    - Ensure Google Sheets updates reflect data correctly.  
    - Confirm email notifications are sent and received as expected.  

---

## 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                                                                             |
|-------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| This workflow template is ideal for HR teams and recruiters automating candidate screening.    | Provided workflow description                                                                                 |
| Setup requires connecting credentials for Google Sheets, Google Drive, OpenAI API, and SMTP.   | Setup instructions section                                                                                   |
| Customize job roles by editing form dropdown options and evaluation criteria in AI prompts.    | Customization instructions                                                                                   |
| Consider integrating with ATS or Slack for extended workflows.                                 | Suggested integrations                                                                                         |
| Sticky notes in workflow guide users through each block’s purpose and configuration tips.     | Embedded in workflow JSON                                                                                      |
| For further reading on AI-based recruitment automation, see relevant HR tech blogs and OpenAI documentation. | External resource suggestion                                                                                   |

---

**Disclaimer:**  
The provided text is derived exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.

---