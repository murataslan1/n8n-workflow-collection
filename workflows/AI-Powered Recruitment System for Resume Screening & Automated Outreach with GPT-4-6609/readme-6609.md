AI-Powered Recruitment System for Resume Screening & Automated Outreach with GPT-4

https://n8nworkflows.xyz/workflows/ai-powered-recruitment-system-for-resume-screening---automated-outreach-with-gpt-4-6609


# AI-Powered Recruitment System for Resume Screening & Automated Outreach with GPT-4

### 1. Workflow Overview

This workflow automates the recruitment process by parsing candidate resumes, screening candidates against job descriptions using AI (GPT-4), and managing candidate engagement through automated personalized outreach and follow-ups. It is designed for HR teams or recruitment agencies seeking to streamline candidate evaluation and communication.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Parsing:** Receive candidate resumes via webhook, parse files to extract structured candidate data.
- **1.2 Initial Candidate Storage:** Store parsed candidate data in Google Sheets.
- **1.3 Job Description Retrieval:** Obtain job details for screening criteria from Google Sheets.
- **1.4 AI Screening:** Prepare data and use GPT-4-powered nodes to score resumes, identify cultural fit and red flags, and generate interview questions.
- **1.5 Update Candidate Profiles:** Update Google Sheets with AI screening results and candidate statuses.
- **1.6 Conditional Outreach & Interview Scheduling:** Based on scoring, send personalized outreach emails, create calendar events for interviews, and update candidate statuses.
- **1.7 Candidate Follow-up Management:** Wait for candidate responses, check status, send gentle follow-ups if no reply, update statuses, and notify recruiters via Slack.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Parsing

- **Overview:** Accepts incoming candidate resumes via webhook, extracts key candidate data from uploaded resume files.
- **Nodes Involved:** `Webhook`, `Resume Parser`, `Extract Key Candidate Data`

##### Node: Webhook
- **Type:** HTTP Webhook Trigger
- **Role:** Entry point for candidate resume submissions.
- **Config:** Uses a unique webhook URL to receive HTTP POST requests with resume files.
- **Input:** External HTTP requests.
- **Output:** Raw resume file data forwarded to `Resume Parser`.
- **Failures:** Network issues, malformed requests, file size limits.

##### Node: Resume Parser
- **Type:** Extract From File
- **Role:** Extracts text and structured information from resume files.
- **Config:** Default extraction settings for common resume formats (PDF, DOCX).
- **Input:** Resume file from webhook.
- **Output:** Parsed resume content including raw text.
- **Failures:** Unsupported file formats, corrupted files.

##### Node: Extract Key Candidate Data
- **Type:** Code (JavaScript)
- **Role:** Processes parsed resume content to extract structured data fields: candidate name, email, phone, education, experience, skills.
- **Key Variables:** Parses `$json` data from `Resume Parser`.
- **Input:** Parsed resume text.
- **Output:** JSON object with candidate details.
- **Failures:** Parsing logic errors, missing expected fields.

---

#### 1.2 Initial Candidate Storage

- **Overview:** Stores the parsed candidate data into a Google Sheet for record-keeping and further processing.
- **Nodes Involved:** `Initial Candidate Storage`

##### Node: Initial Candidate Storage
- **Type:** Google Sheets (Append/Update)
- **Role:** Inserts candidate data into a spreadsheet with fields for status and initial match score.
- **Config:** Maps extracted candidate fields to columns such as Name, Email, Phone, Education, Experience, Skills, Raw Resume Text, Status (initially blank), Match Score (0), Cultural Fit Notes (blank), Interview Questions (blank).
- **Input:** Parsed candidate data JSON.
- **Output:** Confirmation of row insertion.
- **Failures:** Google API quota limits, authentication errors, sheet structure mismatches.

---

#### 1.3 Job Description Retrieval

- **Overview:** Retrieves job description and criteria data from Google Sheets to be used for candidate screening.
- **Nodes Involved:** `Job Description Input`, `Retrieve Candidate for Screening`, `Retrieve Job Description`

##### Node: Job Description Input
- **Type:** Google Sheets (Read)
- **Role:** Reads job listings with fields like JobID, Title, Description, Required Skills, Experience Level.
- **Input:** Triggered after candidate data storage.
- **Output:** Job description data array.
- **Failures:** Sheet access issues.

##### Node: Retrieve Candidate for Screening
- **Type:** Google Sheets (Read)
- **Role:** Filters candidates whose status is "Received - Parsing Complete" for screening.
- **Config:** Filter where Status equals "Received - Parsing Complete".
- **Input:** Job Description Input output triggers this.
- **Output:** List of candidates for screening.
- **Failures:** Filtering errors, empty data.

##### Node: Retrieve Job Description
- **Type:** Google Sheets (Read)
- **Role:** Retrieves the specific job description matching the candidate screening job.
- **Config:** Uses dynamic key lookup by JobID or Title from the `Job Description Input` node.
- **Input:** Candidate list for screening.
- **Output:** Job description for screening.
- **Failures:** Key not found, empty job data.

---

#### 1.4 AI Screening

- **Overview:** Prepares candidate and job data for AI analysis, then performs multi-step GPT-4 evaluations: scoring, cultural fit, red flags, and interview question generation.
- **Nodes Involved:** `Prepare Data for AI Screening`, `Resume Matcher & Scorer`, `Cultural Fit & Red Flag Identifier`, `Interview Question Generator`, `Consolidate AI Screening Results`

##### Node: Prepare Data for AI Screening
- **Type:** Code
- **Role:** Combines candidate and job data, formats it for input to AI nodes.
- **Input:** Candidate and job description data.
- **Output:** Formatted prompt/data.
- **Failures:** Data merge errors, null values.

##### Node: Resume Matcher & Scorer
- **Type:** OpenAI (GPT-4 via LangChain)
- **Role:** Scores candidate's resume relevance against job requirements.
- **Config:** Uses prompt templates to instruct GPT-4 on scoring criteria.
- **Input:** Prepared prompt with candidate and job data.
- **Output:** Numeric or descriptive match score.
- **Failures:** API rate limits, prompt formatting errors, timeout.

##### Node: Cultural Fit & Red Flag Identifier
- **Type:** OpenAI (GPT-4 via LangChain)
- **Role:** Analyzes candidate for cultural fit and detects potential red flags.
- **Input:** Candidate data and job description.
- **Output:** Notes on fit and red flags.
- **Failures:** Same as above.

##### Node: Interview Question Generator
- **Type:** OpenAI (GPT-4 via LangChain)
- **Role:** Generates tailored interview questions based on candidate profile and job description.
- **Input:** Candidate and job data.
- **Output:** List of questions.
- **Failures:** Same as above.

##### Node: Consolidate AI Screening Results
- **Type:** Code
- **Role:** Aggregates AI outputs into a unified JSON structure for updating records.
- **Input:** Outputs from the three AI nodes.
- **Output:** Consolidated candidate AI screening data.
- **Failures:** JSON merge issues.

---

#### 1.5 Update Candidate Profiles

- **Overview:** Updates the candidate's Google Sheets record with AI screening results and changes status accordingly.
- **Nodes Involved:** `Update Candidate Status & Scores`

##### Node: Update Candidate Status & Scores
- **Type:** Google Sheets (Update)
- **Role:** Updates candidate record fields: Match Score, Cultural Fit Notes, Red Flags, Interview Questions, Status.
- **Config:** Uses candidate email or ID as the key to update the correct row.
- **Input:** Consolidated AI screening data JSON.
- **Output:** Confirmation of update.
- **Failures:** Key mismatch, API errors.

---

#### 1.6 Conditional Outreach & Interview Scheduling

- **Overview:** Branches candidates based on high match scores to generate personalized outreach emails, send them, create interview calendar events, and update statuses.
- **Nodes Involved:** `Conditional Branching - High Score`, `Personalized Outreach Email Generator`, `Send Personalized Email`, `Create Placeholder Interview Event`, `Update Candidate Status - Invited for Screening`

##### Node: Conditional Branching - High Score
- **Type:** If
- **Role:** Checks if candidate match score meets threshold for outreach.
- **Config:** Condition on AI-generated match score.
- **Input:** Updated candidate data.
- **Output:** True branch triggers outreach; false branch ends or loops.
- **Failures:** Logic or expression errors.

##### Node: Personalized Outreach Email Generator
- **Type:** OpenAI GPT-4
- **Role:** Creates customized email content for candidate outreach.
- **Input:** Candidate info, job details.
- **Output:** Email body text.
- **Failures:** API limits.

##### Node: Send Personalized Email
- **Type:** Gmail
- **Role:** Sends outreach email to candidate.
- **Config:** Uses Gmail OAuth2 credentials.
- **Input:** Generated email content and candidate email.
- **Output:** Email sent confirmation.
- **Failures:** Auth errors, SMTP issues.

##### Node: Create Placeholder Interview Event
- **Type:** Google Calendar
- **Role:** Creates a tentative interview event on recruiter’s calendar.
- **Input:** Candidate and job info.
- **Output:** Calendar event created.
- **Failures:** Calendar API errors.

##### Node: Update Candidate Status - Invited for Screening
- **Type:** Google Sheets (Update)
- **Role:** Updates candidate status to "Invited for Screening" and logs contact date.
- **Input:** Candidate email.
- **Output:** Confirmation of update.
- **Failures:** Same as prior Google Sheets updates.

---

#### 1.7 Candidate Follow-up Management

- **Overview:** Waits for candidate response or interview scheduling, checks status, sends gentle automated follow-ups if no reply, updates statuses, and notifies recruiter via Slack.
- **Nodes Involved:** `For Candidate Response/Scheduling`, `Retrieve Candidate Status for Follow-up`, `Conditional Branching - No Reply/No Schedule`, `Gentle Follow-up Generator`, `Send Gentle Follow-up`, `Update Candidate Status - Follow-up Sent`, `Notify Recruiter for Qualified Candidates`

##### Node: For Candidate Response/Scheduling
- **Type:** Wait (Webhook)
- **Role:** Pauses workflow waiting for candidate response or scheduling confirmation via webhook.
- **Input:** Trigger from follow-up status.
- **Output:** Continues upon candidate action.
- **Failures:** Timeout or no response.

##### Node: Retrieve Candidate Status for Follow-up
- **Type:** Google Sheets (Read)
- **Role:** Reads candidate status to determine if follow-up is needed.
- **Input:** Candidate email.
- **Output:** Current status.
- **Failures:** Sheet access.

##### Node: Conditional Branching - No Reply/No Schedule
- **Type:** If
- **Role:** Checks if candidate has not replied or scheduled.
- **Input:** Status data.
- **Output:** True branch triggers follow-up email.
- **Failures:** Logic errors.

##### Node: Gentle Follow-up Generator
- **Type:** OpenAI GPT-4
- **Role:** Generates polite follow-up email content.
- **Input:** Candidate and job context.
- **Output:** Follow-up email text.
- **Failures:** API limits.

##### Node: Send Gentle Follow-up
- **Type:** Gmail
- **Role:** Sends follow-up email to candidate.
- **Input:** Generated email and candidate address.
- **Output:** Confirmation.
- **Failures:** Email delivery issues.

##### Node: Update Candidate Status - Follow-up Sent
- **Type:** Google Sheets (Update)
- **Role:** Updates candidate status to "Follow-up Sent - No Reply" and logs last contacted date.
- **Input:** Candidate email.
- **Output:** Confirmation.
- **Failures:** Sheet update issues.

##### Node: Notify Recruiter for Qualified Candidates
- **Type:** Slack
- **Role:** Sends notification message to recruitment team about candidates who have been followed up.
- **Input:** Candidate summary.
- **Output:** Slack message confirmation.
- **Failures:** Slack webhook errors.

---

### 3. Summary Table

| Node Name                           | Node Type                       | Functional Role                            | Input Node(s)                            | Output Node(s)                               | Sticky Note                                                                                             |
|-----------------------------------|--------------------------------|--------------------------------------------|-----------------------------------------|----------------------------------------------|-------------------------------------------------------------------------------------------------------|
| Webhook                           | Webhook                        | Entry point for candidate resume submission | N/A                                     | Resume Parser                                |                                                                                                       |
| Resume Parser                     | Extract From File              | Extracts text/content from resumes          | Webhook                                 | Extract Key Candidate Data                    |                                                                                                       |
| Extract Key Candidate Data        | Code                          | Extracts structured candidate data          | Resume Parser                           | Initial Candidate Storage                     |                                                                                                       |
| Initial Candidate Storage         | Google Sheets                 | Stores parsed candidate data                 | Extract Key Candidate Data              | Job Description Input                         | Value mappings to sheet columns including initial status, match score 0, and blank notes                |
| Job Description Input             | Google Sheets                 | Reads job descriptions                        | Initial Candidate Storage               | Retrieve Candidate for Screening              | Columns: JobID, Title, Description, Required Skills, Experience Level                                   |
| Retrieve Candidate for Screening  | Google Sheets                 | Retrieves candidates ready for screening     | Job Description Input                   | Retrieve Job Description                       | Filter: Status equals "Received - Parsing Complete"                                                    |
| Retrieve Job Description          | Google Sheets                 | Retrieves specific job description           | Retrieve Candidate for Screening        | Prepare Data for AI Screening                  | Key Column: JobID or Title, dynamic value from Job Description Input                                    |
| Prepare Data for AI Screening     | Code                          | Prepares combined candidate & job data       | Retrieve Job Description                 | Resume Matcher & Scorer                        |                                                                                                       |
| Resume Matcher & Scorer           | OpenAI (LangChain)            | Scores resume relevance                       | Prepare Data for AI Screening            | Cultural Fit & Red Flag Identifier             |                                                                                                       |
| Cultural Fit & Red Flag Identifier| OpenAI (LangChain)            | Analyzes cultural fit and red flags           | Resume Matcher & Scorer                  | Interview Question Generator                   |                                                                                                       |
| Interview Question Generator      | OpenAI (LangChain)            | Generates interview questions                  | Cultural Fit & Red Flag Identifier       | Consolidate AI Screening Results               |                                                                                                       |
| Consolidate AI Screening Results  | Code                          | Aggregates AI results into one object          | Interview Question Generator             | Update Candidate Status & Scores               |                                                                                                       |
| Update Candidate Status & Scores  | Google Sheets                 | Updates candidate sheet with AI results        | Consolidate AI Screening Results         | Conditional Branching - High Score             | Mapping AI-generated fields to sheet columns                                                         |
| Conditional Branching - High Score| If                            | Determines if candidate qualifies for outreach | Update Candidate Status & Scores         | Personalized Outreach Email Generator          |                                                                                                       |
| Personalized Outreach Email Generator | OpenAI (LangChain)         | Generates personalized outreach emails          | Conditional Branching - High Score       | Send Personalized Email                         |                                                                                                       |
| Send Personalized Email           | Gmail                         | Sends outreach email                            | Personalized Outreach Email Generator    | Create Placeholder Interview Event              |                                                                                                       |
| Create Placeholder Interview Event| Google Calendar              | Creates interview calendar event                | Send Personalized Email                  | Update Candidate Status - Invited for Screening|                                                                                                       |
| Update Candidate Status - Invited for Screening | Google Sheets       | Updates status to "Invited for Screening"         | Create Placeholder Interview Event       | For Candidate Response/Scheduling               |                                                                                                       |
| For Candidate Response/Scheduling | Wait (Webhook)                | Waits for candidate response or scheduling      | Update Candidate Status - Invited for Screening | Retrieve Candidate Status for Follow-up       |                                                                                                       |
| Retrieve Candidate Status for Follow-up | Google Sheets           | Reads candidate status for follow-up decision   | For Candidate Response/Scheduling         | Conditional Branching - No Reply/No Schedule   |                                                                                                       |
| Conditional Branching - No Reply/No Schedule | If                    | Checks if candidate needs follow-up              | Retrieve Candidate Status for Follow-up  | Gentle Follow-up Generator                      |                                                                                                       |
| Gentle Follow-up Generator        | OpenAI (LangChain)            | Generates polite follow-up email                  | Conditional Branching - No Reply/No Schedule | Send Gentle Follow-up                         |                                                                                                       |
| Send Gentle Follow-up             | Gmail                         | Sends follow-up email                             | Gentle Follow-up Generator               | Update Candidate Status - Follow-up Sent       |                                                                                                       |
| Update Candidate Status - Follow-up Sent | Google Sheets             | Updates status to "Follow-up Sent - No Reply"      | Send Gentle Follow-up                    | Notify Recruiter for Qualified Candidates       |                                                                                                       |
| Notify Recruiter for Qualified Candidates | Slack                   | Notifies recruiter about candidate follow-up      | Update Candidate Status - Follow-up Sent | N/A                                           |                                                                                                       |
| Sticky Notes (Multiple)           | Sticky Note                   | Comments or placeholders                           | N/A                                     | N/A                                           | Various notes present but content fields are empty                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**
   - Type: Webhook
   - Key config: Set HTTP POST method, enable file upload.
   - Purpose: Receive candidate resumes.
   - Connect output to `Resume Parser`.

2. **Create Resume Parser Node**
   - Type: Extract From File
   - Input: File from webhook.
   - Config: Enable parsing of common resume formats.
   - Connect output to `Extract Key Candidate Data`.

3. **Create Extract Key Candidate Data Node**
   - Type: Code (JavaScript)
   - Script: Extract candidate fields (name, email, phone, education, experience, skills) from parsed resume text.
   - Input: Output from `Resume Parser`.
   - Connect output to `Initial Candidate Storage`.

4. **Create Initial Candidate Storage Node**
   - Type: Google Sheets (Append)
   - Credential: Setup Google Sheets OAuth2 with access to recruitment sheet.
   - Configure columns: Name, Email, Phone, Education, Experience, Skills, Raw Resume Text, Status (initial empty), Match Score (0), Cultural Fit Notes (empty), Interview Questions (empty).
   - Input: Candidate data JSON.
   - Connect output to `Job Description Input`.

5. **Create Job Description Input Node**
   - Type: Google Sheets (Read)
   - Config: Read job description sheet columns: JobID, Title, Description, Required Skills, Experience Level.
   - Connect output to `Retrieve Candidate for Screening`.

6. **Create Retrieve Candidate for Screening Node**
   - Type: Google Sheets (Read)
   - Config: Filter rows where Status = "Received - Parsing Complete".
   - Connect output to `Retrieve Job Description`.

7. **Create Retrieve Job Description Node**
   - Type: Google Sheets (Read)
   - Config: Lookup job description by JobID or Title from `Job Description Input` data.
   - Connect output to `Prepare Data for AI Screening`.

8. **Create Prepare Data for AI Screening Node**
   - Type: Code
   - Script: Merge candidate and job description data into AI prompt format.
   - Connect output to `Resume Matcher & Scorer`.

9. **Create Resume Matcher & Scorer Node**
   - Type: OpenAI (LangChain)
   - Credential: Setup OpenAI API key with GPT-4 access.
   - Prompt: Score candidate resume relevance.
   - Connect output to `Cultural Fit & Red Flag Identifier`.

10. **Create Cultural Fit & Red Flag Identifier Node**
    - Type: OpenAI (LangChain)
    - Prompt: Analyze cultural fit and red flags.
    - Connect output to `Interview Question Generator`.

11. **Create Interview Question Generator Node**
    - Type: OpenAI (LangChain)
    - Prompt: Generate interview questions based on candidate/job.
    - Connect output to `Consolidate AI Screening Results`.

12. **Create Consolidate AI Screening Results Node**
    - Type: Code
    - Script: Aggregate AI outputs into unified result JSON.
    - Connect output to `Update Candidate Status & Scores`.

13. **Create Update Candidate Status & Scores Node**
    - Type: Google Sheets (Update)
    - Config: Use candidate email as key; map AI fields to columns; update Status accordingly.
    - Connect output to `Conditional Branching - High Score`.

14. **Create Conditional Branching - High Score Node**
    - Type: If
    - Condition: Check if match score exceeds threshold for outreach.
    - True branch to `Personalized Outreach Email Generator`.
    - False branch ends or loops as required.

15. **Create Personalized Outreach Email Generator Node**
    - Type: OpenAI (LangChain)
    - Prompt: Generate personalized email content.
    - Connect output to `Send Personalized Email`.

16. **Create Send Personalized Email Node**
    - Type: Gmail
    - Credential: Setup Gmail OAuth2 with send email permission.
    - Configure recipient, subject, and body from AI output.
    - Connect output to `Create Placeholder Interview Event`.

17. **Create Create Placeholder Interview Event Node**
    - Type: Google Calendar
    - Credential: Setup Google Calendar OAuth2.
    - Create tentative interview event with candidate and job info.
    - Connect output to `Update Candidate Status - Invited for Screening`.

18. **Create Update Candidate Status - Invited for Screening Node**
    - Type: Google Sheets (Update)
    - Update status to "Invited for Screening" and log timestamp.
    - Connect output to `For Candidate Response/Scheduling`.

19. **Create For Candidate Response/Scheduling Node**
    - Type: Wait (Webhook)
    - Wait for candidate scheduling response via webhook.
    - Connect output to `Retrieve Candidate Status for Follow-up`.

20. **Create Retrieve Candidate Status for Follow-up Node**
    - Type: Google Sheets (Read)
    - Read current candidate status by email.
    - Connect output to `Conditional Branching - No Reply/No Schedule`.

21. **Create Conditional Branching - No Reply/No Schedule Node**
    - Type: If
    - Condition: Check if candidate has not replied or scheduled.
    - True branch to `Gentle Follow-up Generator`.

22. **Create Gentle Follow-up Generator Node**
    - Type: OpenAI (LangChain)
    - Generate gentle follow-up email content.
    - Connect output to `Send Gentle Follow-up`.

23. **Create Send Gentle Follow-up Node**
    - Type: Gmail
    - Send follow-up email to candidate.
    - Connect output to `Update Candidate Status - Follow-up Sent`.

24. **Create Update Candidate Status - Follow-up Sent Node**
    - Type: Google Sheets (Update)
    - Update status to "Follow-up Sent - No Reply" and timestamp.
    - Connect output to `Notify Recruiter for Qualified Candidates`.

25. **Create Notify Recruiter for Qualified Candidates Node**
    - Type: Slack
    - Credential: Setup Slack webhook URL.
    - Send notification message about candidate follow-up.
    - Workflow ends here.

---

### 5. General Notes & Resources

| Note Content                                                                                  | Context or Link                                                                                         |
|-----------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| Google Sheets columns expected for candidates and jobs must match node mappings exactly.      | Refer to the node notes for specific column names and formulas.                                       |
| Gmail nodes require OAuth2 credentials with "Send Email" permission configured properly.      | Setup in n8n credentials panel using a Google Cloud project with Gmail API enabled.                    |
| OpenAI nodes use GPT-4 model via LangChain integration; ensure API key has sufficient quota.  | OpenAI documentation: https://platform.openai.com/docs/models/gpt-4                                   |
| Google Calendar node requires calendar write access for event creation.                       | Use OAuth2 credentials linked to recruiter's calendar.                                               |
| Slack notifications require a Slack Incoming Webhook URL configured in Slack workspace.       | Slack webhook setup guide: https://api.slack.com/messaging/webhooks                                   |
| Use stable, structured spreadsheet schemas to avoid data mismatches and errors.               | Recommended to lock column order and types in Google Sheets.                                         |
| The workflow is designed for asynchronous candidate response handling using Wait nodes.       | Adjust webhook timeout settings as needed for real-world scheduling delays.                           |

---

**Disclaimer:** The provided text is exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.