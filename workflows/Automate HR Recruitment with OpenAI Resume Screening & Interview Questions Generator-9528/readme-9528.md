Automate HR Recruitment with OpenAI Resume Screening & Interview Questions Generator

https://n8nworkflows.xyz/workflows/automate-hr-recruitment-with-openai-resume-screening---interview-questions-generator-9528


# Automate HR Recruitment with OpenAI Resume Screening & Interview Questions Generator

### 1. Workflow Overview

This workflow automates the early stages of the HR recruitment process by leveraging AI and cloud integrations to screen job applicants and generate personalized interview questions. It targets HR teams and recruiters who want to streamline candidate evaluation, reduce manual screening efforts, and improve interview preparation quality.

The workflow is logically organized into these blocks:

- **1.1 Input Reception:** Collect candidate data and CV via a web form submission.
- **1.2 Candidate Profile Processing:** Upload CV to Google Drive, extract text from the PDF, and prepare candidate information for AI evaluation.
- **1.3 AI Qualification Agent:** Use an AI agent (GPT-4) to compare candidate data against open job positions stored in a Google Sheet, score the candidate, and determine if they are shortlisted.
- **1.4 Data Update and Conditional Branching:** Update the application status in Google Sheets and conditionally trigger interview question generation if the candidate is shortlisted.
- **1.5 Interview Question Generation:** Use a second AI agent to generate customized interview questions based on the candidate profile and job requirements.
- **1.6 Notification:** Send a notification to the HR team about the new candidate and their interview questions.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block captures applicant data including name, email, phone number, job role, and CV file through a web form.

**Nodes Involved:**  
- Application form  
- Sticky Note1

**Node Details:**

- **Application form**  
  - *Type:* Form Trigger  
  - *Role:* Entry point to receive candidate submissions via an online form.  
  - *Configuration:*  
    - Form fields: Name (text), Email (email), CV (PDF file), Job Role (dropdown with predefined roles), Phone Number (text).  
    - Custom CSS for styling.  
    - Webhook enabled to receive data asynchronously.  
  - *Inputs:* External HTTP request (form submission)  
  - *Outputs:* Form data including binary CV file  
  - *Edge cases:* Invalid file uploads, missing required fields, webhook failure.

- **Sticky Note1**  
  - *Type:* Sticky Note  
  - *Role:* Documentation for Step 1 (candidate data input).  
  - *Content:* Explains form submission context.

---

#### 1.2 Candidate Profile Processing

**Overview:**  
Uploads the candidate’s CV to a Google Drive folder and extracts the text content from the PDF for further AI processing.

**Nodes Involved:**  
- Upload to Google Drive  
- Extract profile  
- Sticky Note5

**Node Details:**

- **Upload to Google Drive**  
  - *Type:* Google Drive node  
  - *Role:* Saves the uploaded CV file to a predefined Google Drive folder for record keeping.  
  - *Configuration:*  
    - Filename composed dynamically using candidate’s name and job role.  
    - Target folder ID corresponds to a dedicated HR system folder in Google Drive.  
    - OAuth2 credentials configured for access.  
  - *Inputs:* Form submission binary file (CV)  
  - *Outputs:* File metadata with Drive URL  
  - *Edge cases:* Authentication errors, folder permission issues, file size limits.

- **Extract profile**  
  - *Type:* Extract From File node  
  - *Role:* Extracts text content from the uploaded PDF CV to convert it to plain text for AI analysis.  
  - *Configuration:* Operation set to PDF extraction, binary input from CV file.  
  - *Inputs:* Binary CV file from form submission  
  - *Outputs:* Text content of CV  
  - *Edge cases:* PDF parsing failures, corrupted files.

- **Sticky Note5**  
  - *Type:* Sticky Note  
  - *Role:* Explains the purpose of profile upload and extraction.

---

#### 1.3 AI Qualification Agent

**Overview:**  
Uses a language model agent to analyze the candidate’s profile text and compare it against job requirements stored in a Google Sheet. The agent scores the candidate and determines if they are shortlisted.

**Nodes Involved:**  
- gpt4-1 model  
- Open_Positions  
- HR_RTS_Agent  
- Structured Output Parser1  
- Sticky Note14  
- Sticky Note3 (contextual note)

**Node Details:**

- **gpt4-1 model**  
  - *Type:* Langchain OpenAI Chat Model (GPT-4.1-mini)  
  - *Role:* Provides the underlying AI model for the agents to perform natural language understanding and generation.  
  - *Configuration:* Model set to GPT-4.1-mini, OpenAI API credentials provided.  
  - *Inputs:* Prompts from agents  
  - *Outputs:* AI-generated responses  
  - *Edge cases:* API rate limits, invalid API key, response timeouts.

- **Open_Positions**  
  - *Type:* Google Sheets Tool node  
  - *Role:* Provides access to the “Open_Positions” sheet storing job roles and requirements.  
  - *Configuration:* Document and sheet ID linked to a shared Google Sheet with specified tabs.  
  - *Inputs:* Queries from AI agents  
  - *Outputs:* Job data for AI evaluation  
  - *Edge cases:* Sheet access errors, missing data.

- **HR_RTS_Agent**  
  - *Type:* Langchain Agent node  
  - *Role:* Acts as the AI resume screening assistant.  
  - *Configuration:*  
    - System message instructs the agent to parse candidate data, access the Open_Positions sheet, check if the position is open, evaluate the resume against job requirements, score from 1-5, and determine shortlist status.  
    - Output format requires a single-line JSON with candidate info and evaluation results.  
  - *Inputs:* Extracted CV text, Open_Positions tool, GPT-4 model  
  - *Outputs:* JSON evaluation of candidate data  
  - *Edge cases:* Parsing errors, tool access errors, malformed JSON output.

- **Structured Output Parser1**  
  - *Type:* Langchain Structured Output Parser  
  - *Role:* Validates and parses the AI agent’s JSON output into structured data usable downstream.  
  - *Configuration:* JSON schema example provided to enforce output format.  
  - *Inputs:* AI agent output  
  - *Outputs:* Parsed JSON fields  
  - *Edge cases:* Output format mismatch, parsing failures.

- **Sticky Note14**  
  - *Type:* Sticky Note  
  - *Role:* Describes the Qualification Agent purpose.

- **Sticky Note3**  
  - *Type:* Sticky Note  
  - *Role:* Note stating the Excel sheet can be replaced by any CRM.

---

#### 1.4 Data Update and Conditional Branching

**Overview:**  
Updates the candidate’s application data in the "Applications" Google Sheet and conditionally routes shortlisted candidates to the interview question generation block.

**Nodes Involved:**  
- Update_HR_Application_System  
- If  
- Sticky Note2

**Node Details:**

- **Update_HR_Application_System**  
  - *Type:* Google Sheets node  
  - *Role:* Append or update candidate evaluation details (name, email, score, shortlist status, etc.) in the “Applications” sheet.  
  - *Configuration:*  
    - Mapping output JSON fields from AI agent to sheet columns.  
    - Match rows based on Email column to update existing entries.  
    - OAuth2 credentials linked.  
  - *Inputs:* Parsed candidate evaluation JSON  
  - *Outputs:* Updated Google Sheets row metadata  
  - *Edge cases:* Sheet access issues, data type mismatches.

- **If**  
  - *Type:* If node (conditional)  
  - *Role:* Checks if the candidate was shortlisted (“yes”) to decide further processing.  
  - *Configuration:* Condition comparing `Shortlisted` field to “yes”.  
  - *Inputs:* Candidate evaluation output  
  - *Outputs:* Two branches: true (shortlisted) or false (not shortlisted)  
  - *Edge cases:* Missing or malformed `Shortlisted` field.

- **Sticky Note2**  
  - *Type:* Sticky Note  
  - *Role:* Describes the notification step (contextual).

---

#### 1.5 Interview Question Generation

**Overview:**  
For shortlisted candidates, this block uses an AI agent to generate tailored interview questions based on the candidate’s profile and the job requirements.

**Nodes Involved:**  
- Dynamic Question Generator Agent  
- Update_HR_Application_System1  
- Sticky Note6

**Node Details:**

- **Dynamic Question Generator Agent**  
  - *Type:* Langchain Agent node  
  - *Role:* Generates 3 relevant interview questions for the candidate based on their resume and matched job requirements.  
  - *Configuration:*  
    - System message instructs the agent to analyze candidate info and job requirements, focusing on employment history and potential red flags.  
    - Output must be a single JSON object with keys question_1 to question_3, no explanations.  
  - *Inputs:* Extracted CV text, Open_Positions tool, GPT-4 model  
  - *Outputs:* JSON with interview questions  
  - *Edge cases:* JSON formatting errors, incomplete questions.

- **Update_HR_Application_System1**  
  - *Type:* Google Sheets node  
  - *Role:* Append or update the candidate’s interview questions in the “Applications” sheet, matching by email.  
  - *Configuration:*  
    - Maps the AI-generated interview questions to the “Interview Questions” column.  
    - OAuth2 credentials configured.  
  - *Inputs:* Interview question JSON, candidate Email from the If node  
  - *Outputs:* Updated Google Sheets row metadata  
  - *Edge cases:* Sheet permission issues, data overwrites.

- **Sticky Note6**  
  - *Type:* Sticky Note  
  - *Role:* Describes the dynamic question generation agent.

---

#### 1.6 Notification

**Overview:**  
Sends a Telegram notification to the HR team when a new candidate has been processed and interview questions generated.

**Nodes Involved:**  
- Send a text to HR Team  
- Sticky Note2 (contextual)

**Node Details:**

- **Send a text to HR Team**  
  - *Type:* Telegram node  
  - *Role:* Sends a text message alerting HR about the new candidate and that interview questions are ready.  
  - *Configuration:*  
    - Fixed text message: "A New Candidate has submitted a resume"  
    - Chat ID must be configured with the HR team’s Telegram chat/group ID.  
    - Telegram API credentials configured.  
  - *Inputs:* Output of Google Sheets update node for interview questions  
  - *Outputs:* Telegram message metadata  
  - *Edge cases:* Telegram API errors, invalid chat ID.

- **Sticky Note2** (reused)  
  - *Role:* Indicates this step is the notification to HR.

---

### 3. Summary Table

| Node Name                      | Node Type                            | Functional Role                                  | Input Node(s)           | Output Node(s)                    | Sticky Note                                                                                                                         |
|--------------------------------|------------------------------------|-------------------------------------------------|-------------------------|---------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| Application form               | Form Trigger                       | Collect candidate data and CV                    | (Webhook)               | Upload to Google Drive, Extract profile | Sticky Note1: Step 1: Get Applicant Data                                                                                           |
| Upload to Google Drive         | Google Drive                      | Upload CV to Google Drive                         | Application form        | Extract profile                  | Sticky Note5: Upload candidate profile explanation                                                                                 |
| Extract profile                | Extract From File                 | Extract text from PDF CV                          | Upload to Google Drive   | HR_RTS_Agent                    | Sticky Note5                                                                                                                       |
| gpt4-1 model                  | Langchain OpenAI Chat Model       | Provides AI model for agents                      | HR_RTS_Agent, Dynamic Question Generator Agent | HR_RTS_Agent, Dynamic Question Generator Agent |                                                                                                                                    |
| Open_Positions                | Google Sheets Tool                | Access open job positions data                    | HR_RTS_Agent, Dynamic Question Generator Agent | HR_RTS_Agent, Dynamic Question Generator Agent |                                                                                                                                    |
| HR_RTS_Agent                 | Langchain Agent                   | AI resume screening and candidate qualification  | Extract profile, Open_Positions, gpt4-1 model | Structured Output Parser1, Update_HR_Application_System | Sticky Note14: Qualification Agent                                                                                               |
| Structured Output Parser1     | Langchain Output Parser Structured | Parse AI screening output JSON                    | HR_RTS_Agent            | Update_HR_Application_System    |                                                                                                                                    |
| Update_HR_Application_System  | Google Sheets                    | Update candidate evaluation in Applications sheet | Structured Output Parser1 | If                            | Sticky Note3: Excel sheet can be replaced by any CRM                                                                              |
| If                           | If Node                          | Check if candidate is shortlisted                 | Update_HR_Application_System | Dynamic Question Generator Agent | Sticky Note2: Step 5: Notify the HR Team                                                                                          |
| Dynamic Question Generator Agent | Langchain Agent                | Generate customized interview questions           | If                      | Update_HR_Application_System1   | Sticky Note6: Dynamic Questions Generator Agent                                                                                   |
| Update_HR_Application_System1 | Google Sheets                    | Update interview questions in Applications sheet | Dynamic Question Generator Agent | Send a text to HR Team          | Sticky Note2                                                                                                                       |
| Send a text to HR Team        | Telegram                        | Notify HR team about new candidate and questions | Update_HR_Application_System1 | (End)                         | Sticky Note2                                                                                                                       |
| Sticky Note                   | Sticky Note                     | Workflow overview and setup instructions          | None                    | None                          | Content includes full workflow explanation and Google Sheet template link: https://docs.google.com/spreadsheets/d/1-WXA9mB8OYukVTmr_Uf_Qtwk6LtInod5_cxxnf3CvqM/edit?usp=sharing |
| Sticky Note1                  | Sticky Note                     | Step 1 explanation                                | None                    | None                          | Step 1: Get Applicant Data                                                                                                        |
| Sticky Note2                  | Sticky Note                     | Notification step explanation                      | None                    | None                          | Step 5: Notify the HR Team                                                                                                        |
| Sticky Note3                  | Sticky Note                     | Note about replacing Excel sheet                   | None                    | None                          | Excel sheet can be replaced with any CRM of your choice                                                                          |
| Sticky Note5                  | Sticky Note                     | Candidate profile processing explanation           | None                    | None                          | Upload candidate profile to Google Drive and extract info                                                                         |
| Sticky Note6                  | Sticky Note                     | Dynamic question generation explanation            | None                    | None                          | Dynamic Questions Generator Agent                                                                                                 |
| Sticky Note14                 | Sticky Note                     | Qualification agent explanation                     | None                    | None                          | Checks for open positions and candidate shortlisting                                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Form Trigger Node:**  
   - Name: `Application form`  
   - Type: Form Trigger  
   - Configure form fields: Name (text, required), Email (email, required), CV (file, accept .pdf, required), Job Role (dropdown with options: "AI Automation Engineer (n8n)", "Voice Agent specialist (Vapi, ElevenLabs, RetellAI)", "PromptEngineer"), Phone Number (text, required)  
   - Add custom CSS for styling (optional)  
   - Enable webhook, save webhook URL for external integration.

2. **Create Google Drive Node to Upload CV:**  
   - Name: `Upload to Google Drive`  
   - Type: Google Drive  
   - Configure credentials with OAuth2 for Google Drive access  
   - Set file name as `cv-{{ $json.Name }}-{{ $json["Job Role"] }}`  
   - Set target folder ID to your HR system folder in Google Drive  
   - Map input to binary CV file from `Application form` node.

3. **Create Extract From File Node:**  
   - Name: `Extract profile`  
   - Type: Extract From File  
   - Operation: PDF  
   - Binary Property Name: CV (from `Application form`)  
   - Input: Connect from `Upload to Google Drive` node output (binary file).

4. **Set up Google Sheets Tool Node:**  
   - Name: `Open_Positions`  
   - Type: Google Sheets Tool  
   - Credentials: OAuth2 for Google Sheets  
   - Document ID: Use your HR Open Positions Google Sheet ID  
   - Sheet Name: "gid=0" (Open_Positions tab)  
   - This node will be used as a tool by AI agents to query job roles and requirements.

5. **Create GPT-4 Model Node:**  
   - Name: `gpt4-1 model`  
   - Type: Langchain OpenAI Chat Model  
   - Model: GPT-4.1-mini  
   - Credentials: OpenAI API key  
   - This will serve as the AI model backend for agents.

6. **Create Langchain Agent Node for Resume Screening:**  
   - Name: `HR_RTS_Agent`  
   - Type: Langchain Agent  
   - Inputs: Text from `Extract profile`, tools: `Open_Positions` Google Sheets and `gpt4-1 model`  
   - Configure system message with instructions to parse candidate information, lookup open positions, evaluate fit, score 1-5, and shortlist yes/no.  
   - Specify output format as single-line JSON with fields: candidate_name, email, phone_number, role_applied_for, position_open, candidate_score, shortlisted.

7. **Create Structured Output Parser Node:**  
   - Name: `Structured Output Parser1`  
   - Type: Langchain Structured Output Parser  
   - Provide JSON schema example matching expected AI output format.  
   - Input: Connect to AI output from `HR_RTS_Agent`.

8. **Create Google Sheets Node to Update Applications:**  
   - Name: `Update_HR_Application_System`  
   - Type: Google Sheets  
   - Credentials: OAuth2 for Google Sheets  
   - Document ID: Your HR Applications Google Sheet ID  
   - Sheet Name: Applications tab (gid from sheet)  
   - Operation: Append or update by matching Email column  
   - Map all candidate fields from parsed AI output.

9. **Create If Node for Shortlist Check:**  
   - Name: `If`  
   - Type: If  
   - Condition: `$json.Shortlisted` equals "yes"  
   - Input: Output from `Update_HR_Application_System`

10. **Create Langchain Agent Node for Interview Question Generation:**  
    - Name: `Dynamic Question Generator Agent`  
    - Type: Langchain Agent  
    - Input Text: Pass candidate info text from `Extract profile`  
    - Tools: `Open_Positions` Google Sheets and `gpt4-1 model`  
    - System message instructs to generate 3 interview questions based on candidate and job requirements, output JSON with question_1 to question_3 keys only.  
    - Connect from the true branch of the `If` node.

11. **Create Google Sheets Node to Update Interview Questions:**  
    - Name: `Update_HR_Application_System1`  
    - Type: Google Sheets  
    - Same credentials and document as previous Google Sheets node  
    - Operation: Append or update by Email  
    - Map Interview Questions JSON from the agent output to the corresponding column.

12. **Create Telegram Node to Notify HR:**  
    - Name: `Send a text to HR Team`  
    - Type: Telegram  
    - Credentials: Telegram API OAuth2  
    - Chat ID: Set to HR team's Telegram Chat or Group ID  
    - Message: "A New Candidate has submitted a resume"  
    - Connect output of `Update_HR_Application_System1` node.

13. **Connect Workflow:**  
    - `Application form` → `Upload to Google Drive` → `Extract profile` → `HR_RTS_Agent`  
    - `HR_RTS_Agent` output → `Structured Output Parser1` → `Update_HR_Application_System` → `If`  
    - `If` true branch → `Dynamic Question Generator Agent` → `Update_HR_Application_System1` → `Send a text to HR Team`

14. **Add Sticky Notes:**  
    - Add sticky notes at strategic points to document workflow purpose, steps, and setup instructions as per original sticky notes.

---

### 5. General Notes & Resources

| Note Content                                                                                                                       | Context or Link                                                                                                             |
|-----------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| Workflow automates screening and interview question generation with AI for HR teams.                                               | Overall workflow purpose                                                                                                   |
| Customize the form fields and job roles in the `Application form` node as needed for your positions.                             | Setup instruction                                                                                                           |
| Google Sheet template with tabs 'Open_Positions' and 'Applications' required for job data and candidate records.                 | https://docs.google.com/spreadsheets/d/1-WXA9mB8OYukVTmr_Uf_Qtwk6LtInod5_cxxnf3CvqM/edit?usp=sharing                        |
| Replace the Excel sheet with any CRM system that supports API or Google Sheets integration for candidate tracking.               | Sticky Note3                                                                                                                |
| Telegram integration requires chat ID configuration to notify HR team via chat/group message.                                    | Notification step                                                                                                           |
| Ensure OpenAI API key and Google OAuth2 credentials are correctly set up for all nodes accessing those services.                 | Credential setup                                                                                                            |

---

**Disclaimer:**  
The provided text is extracted exclusively from an automated workflow created with n8n, a platform for integration and automation. This content strictly complies with current content policies and contains no illegal, offensive, or protected elements. All processed data is legal and publicly accessible.