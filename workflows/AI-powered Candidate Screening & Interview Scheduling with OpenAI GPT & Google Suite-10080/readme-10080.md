AI-powered Candidate Screening & Interview Scheduling with OpenAI GPT & Google Suite

https://n8nworkflows.xyz/workflows/ai-powered-candidate-screening---interview-scheduling-with-openai-gpt---google-suite-10080


# AI-powered Candidate Screening & Interview Scheduling with OpenAI GPT & Google Suite

---

### 1. Workflow Overview

This workflow automates the end-to-end recruitment process for an Automation Specialist role by integrating candidate data intake, AI-driven evaluation, data storage, communication, and interview scheduling. It is designed for HR teams and recruitment automation specialists aiming to streamline candidate screening and follow-up actions.

Logical blocks include:

- **1.1 Input Reception:** Receiving job applications via webhook.
- **1.2 Data Storage:** Persisting application details in Google Sheets as an ATS.
- **1.3 AI Candidate Evaluation:** Using OpenAI GPT to score and analyze candidate fit.
- **1.4 Evaluation Processing & Decision:** Parsing AI output, deciding interview eligibility.
- **1.5 Communication:** Sending interview invitations or rejection emails accordingly.
- **1.6 Interview Scheduling:** Creating calendar events for qualified candidates.
- **1.7 Status Updates & Response:** Updating Google Sheets with candidate status and responding to the webhook source.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:** This block receives candidate applications via an HTTP webhook endpoint, capturing essential candidate data for processing.

- **Nodes Involved:**  
  - Webhook - Receive Application

- **Node Details:**

  - **Webhook - Receive Application**  
    - *Type & Role:* Webhook node acting as the primary entry point.  
    - *Configuration:* Listens on path `/job-application`. Expects JSON payload with candidate name, email, phone, resume (URL or text), cover letter, years of experience, and skills.  
    - *Key Expressions:* N/A (direct data reception).  
    - *Inputs:* External HTTP POST requests.  
    - *Outputs:* Passes raw candidate data downstream.  
    - *Edge Cases:* Missing or malformed payload, timeout if webhook not triggered correctly.  
    - *Sticky Note:* Explains expected data fields and webhook URL.

#### 1.2 Data Storage

- **Overview:** Stores all received candidate applications into a Google Sheets spreadsheet, serving as an Applicant Tracking System (ATS).

- **Nodes Involved:**  
  - Google Sheets - Store Application  
  - Sticky Note - Storage Info

- **Node Details:**

  - **Google Sheets - Store Application**  
    - *Type & Role:* Google Sheets node configured to append or update rows in the "Applications" sheet.  
    - *Configuration:* Uses a Service Account credential for authentication. Auto-maps incoming candidate data fields to sheet columns.  
    - *Key Expressions:* References Google Sheet document ID and sheet name.  
    - *Inputs:* Receives webhook output (candidate data).  
    - *Outputs:* Passes stored data downstream.  
    - *Edge Cases:* Authentication failure, sheet ID mismatch, API limits, data mapping errors.  
    - *Sticky Note:* Describes stored data fields and purpose as ATS.

#### 1.3 AI Candidate Evaluation

- **Overview:** Applies GPT-4 via OpenAI to evaluate each candidate’s qualifications against job requirements, generating a structured score and recommendation.

- **Nodes Involved:**  
  - OpenAI - AI Candidate Evaluation  
  - Sticky Note - AI Process

- **Node Details:**

  - **OpenAI - AI Candidate Evaluation**  
    - *Type & Role:* OpenAI GPT node using LangChain integration to analyze candidate data.  
    - *Configuration:* Uses GPT-4 model with temperature 0.3 for consistent responses. Prompts framed as expert recruiter evaluating an Automation Specialist role with specified requirements.  
    - *Key Expressions:* Injects candidate fields dynamically into prompt using expressions like `{{ $json.body.name }}`.  
    - *Inputs:* Google Sheets stored application data.  
    - *Outputs:* Raw AI response containing a JSON-formatted evaluation report.  
    - *Edge Cases:* API quota exceeded, malformed AI output, connection timeouts, prompt injection errors.  
    - *Sticky Note:* Details evaluation criteria and expected structured output.

#### 1.4 Evaluation Processing & Decision

- **Overview:** Parses AI output JSON, combines it with candidate data, and determines whether to proceed with an interview or reject based on score threshold.

- **Nodes Involved:**  
  - Code - Process Evaluation  
  - IF - Check Score Threshold  
  - Sticky Note - Decision Logic

- **Node Details:**

  - **Code - Process Evaluation**  
    - *Type & Role:* JavaScript code node to parse AI response and format structured data.  
    - *Configuration:* Extracts JSON from AI message content using regex and JSON.parse; handles parsing failures by assigning default values. Computes decision based on score ≥ 70. Combines evaluation with original candidate data.  
    - *Key Expressions:* Accesses prior node outputs via `$input.first()` and references webhook node data.  
    - *Inputs:* AI evaluation node output.  
    - *Outputs:* JSON with candidate info, evaluation details, and decision field ("Interview" or "Reject").  
    - *Edge Cases:* Parsing errors, missing AI response, improper JSON formatting.  
  - **IF - Check Score Threshold**  
    - *Type & Role:* Conditional node routing based on decision field.  
    - *Configuration:* Checks if decision equals "Interview".  
    - *Inputs:* Output from Code node.  
    - *Outputs:* True branch for interviews, false branch for rejection.  
    - *Edge Cases:* Unexpected decision values, null or undefined fields.  
  - *Sticky Note:* Explains scoring threshold rationale and flexibility.

#### 1.5 Communication

- **Overview:** Sends email notifications to candidates — either interview invitations for qualified candidates or rejection notices for others.

- **Nodes Involved:**  
  - Email - Interview Invitation  
  - Email - Rejection Notice  
  - Sticky Note - Email Logic

- **Node Details:**

  - **Email - Interview Invitation**  
    - *Type & Role:* SMTP email node sending personalized interview invites.  
    - *Configuration:* Uses SMTP credentials. Email content includes candidate name, evaluation score, recommendation, strengths list, and next steps. Subject line tailored to role.  
    - *Key Expressions:* Dynamic fields like `{{ $json.candidate.name }}`, `{{ $json.evaluation.score }}`.  
    - *Inputs:* IF node TRUE output (qualified candidates).  
    - *Outputs:* Passes to calendar scheduling node.  
    - *Edge Cases:* SMTP authentication failure, invalid candidate email, rate limits.  
  - **Email - Rejection Notice**  
    - *Type & Role:* SMTP email node sending professional rejection letters.  
    - *Configuration:* Uses same SMTP credentials. Polite, encouraging tone with candidate name interpolation.  
    - *Inputs:* IF node FALSE output (rejected candidates).  
    - *Outputs:* Passes to status update node.  
    - *Edge Cases:* Same as interview email.  
  - *Sticky Note:* Summarizes two email paths and content intent.

#### 1.6 Interview Scheduling

- **Overview:** Automatically schedules interviews by creating Google Calendar events 3 days from the current date, including candidate and evaluation details.

- **Nodes Involved:**  
  - Google Calendar - Schedule Interview

- **Node Details:**

  - **Google Calendar - Schedule Interview**  
    - *Type & Role:* Google Calendar node creating event invitations.  
    - *Configuration:* Event scheduled 3 days ahead at 10:00-11:00 AM. Uses OAuth2 credentials. Calendar ID specified. Invites candidate and hiring manager.  
    - *Key Expressions:* Dynamic date/time computed via expressions with `$now.plus(3, 'days')`.  
    - *Inputs:* Email - Interview Invitation node output.  
    - *Outputs:* Passes to Google Sheets status update node.  
    - *Edge Cases:* OAuth token expiration, calendar ID errors, invitee email missing, API limits.

#### 1.7 Status Updates & Response

- **Overview:** Updates candidate status in Google Sheets (Interview Scheduled or Rejected) and sends a confirmation response to the original webhook call.

- **Nodes Involved:**  
  - Update Sheet - Interview Status  
  - Update Sheet - Rejection Status  
  - Respond to Webhook  
  - Sticky Note - Completion

- **Node Details:**

  - **Update Sheet - Interview Status**  
    - *Type & Role:* Google Sheets node updating row with interview status, evaluation score, recommendation, and interview date.  
    - *Configuration:* Uses Service Account credentials, updates "Applications" sheet.  
    - *Inputs:* Google Calendar scheduling output.  
    - *Outputs:* Passes to Respond to Webhook node.  
    - *Edge Cases:* Row not found, permission errors.  
  - **Update Sheet - Rejection Status**  
    - *Type & Role:* Google Sheets node updating row with rejection status, score, recommendation, and rejection date.  
    - *Configuration:* Uses Service Account credentials, updates "Applications" sheet.  
    - *Inputs:* Email - Rejection Notice node output.  
    - *Outputs:* Passes to Respond to Webhook node.  
    - *Edge Cases:* Same as above.  
  - **Respond to Webhook**  
    - *Type & Role:* Final node that closes the webhook connection by sending JSON confirming receipt and status.  
    - *Configuration:* Returns success boolean, candidate name, and decision status dynamically.  
    - *Inputs:* Update Sheet nodes.  
    - *Outputs:* None (endpoint response).  
    - *Edge Cases:* Connection timeouts, malformed output.  
  - *Sticky Note:* Summarizes final workflow steps and key metrics to track.

---

### 3. Summary Table

| Node Name                     | Node Type                         | Functional Role                     | Input Node(s)              | Output Node(s)                         | Sticky Note                                                                                                                                                   |
|-------------------------------|----------------------------------|-----------------------------------|----------------------------|---------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Webhook - Receive Application  | Webhook                          | Entry point for applications       | External HTTP request      | Google Sheets - Store Application      | 📥 ENTRY POINT: Receives application data including name, email, phone, resume, cover letter, experience, and skills.                                         |
| Google Sheets - Store Application| Google Sheets                   | Stores application data            | Webhook - Receive Application | OpenAI - AI Candidate Evaluation      | 💾 DATA STORAGE: Persists candidate data for tracking and backup.                                                                                            |
| OpenAI - AI Candidate Evaluation| OpenAI (LangChain)              | AI evaluates candidate qualifications | Google Sheets - Store Application | Code - Process Evaluation              | 🤖 AI EVALUATION ENGINE: GPT-4 analyzes candidate fit and generates score and recommendations.                                                               |
| Code - Process Evaluation       | Code (JavaScript)                | Parses AI response & decides next step | OpenAI - AI Candidate Evaluation | IF - Check Score Threshold             | ⚙️ DATA PROCESSING: Parses AI JSON response, combines candidate data, determines decision based on score threshold (≥70).                                     |
| IF - Check Score Threshold      | If Condition                    | Routes candidates by score          | Code - Process Evaluation   | Email - Interview Invitation, Email - Rejection Notice | 🔀 DECISION POINT: Branches workflow based on candidate ranking (interview or rejection).                                                                     |
| Email - Interview Invitation    | Email Send (SMTP)               | Sends interview invitation email   | IF - Check Score Threshold  | Google Calendar - Schedule Interview   | ✉️ INTERVIEW INVITATION: Personalized email with evaluation summary and next steps.                                                                          |
| Google Calendar - Schedule Interview | Google Calendar             | Schedules interview event          | Email - Interview Invitation | Update Sheet - Interview Status        | 📅 INTERVIEW SCHEDULING: Creates calendar event 3 days ahead with candidate and evaluation details.                                                          |
| Update Sheet - Interview Status | Google Sheets                   | Updates status for interview        | Google Calendar - Schedule Interview | Respond to Webhook                     | 📝 STATUS UPDATE - INTERVIEW: Updates ATS with interview scheduled status and details.                                                                        |
| Email - Rejection Notice        | Email Send (SMTP)               | Sends rejection email               | IF - Check Score Threshold  | Update Sheet - Rejection Status        | ✉️ REJECTION NOTICE: Polite rejection email maintaining company reputation.                                                                                  |
| Update Sheet - Rejection Status | Google Sheets                   | Updates status for rejection        | Email - Rejection Notice    | Respond to Webhook                     | 📝 STATUS UPDATE - REJECTION: Logs rejection details for audit and tracking.                                                                                 |
| Respond to Webhook              | Respond to Webhook              | Sends final confirmation response  | Update Sheet - Interview Status, Update Sheet - Rejection Status | None                                  | 📤 WEBHOOK RESPONSE: Confirms receipt and processing status back to form.                                                                                    |
| Sticky Note - Workflow Overview | Sticky Note                    | Describes workflow high-level       | N/A                        | N/A                                   | 📋 Workflow Overview: Summarizes process steps and AI usage.                                                                                                |
| Sticky Note - Storage Info      | Sticky Note                    | Explains data stored in Sheets     | N/A                        | N/A                                   | 📊 Database Storage: Details fields saved for ATS functionality.                                                                                            |
| Sticky Note - AI Process        | Sticky Note                    | Details AI evaluation logic        | N/A                        | N/A                                   | 🧠 AI Evaluation: Criteria and output structure.                                                                                                            |
| Sticky Note - Decision Logic    | Sticky Note                    | Explains score threshold logic     | N/A                        | N/A                                   | 🎯 Scoring Logic: Threshold rationale for interview qualification.                                                                                          |
| Sticky Note - Email Logic       | Sticky Note                    | Summarizes email notification paths | N/A                        | N/A                                   | 📧 Email Notifications: Two paths for interview invites or rejections.                                                                                      |
| Sticky Note - Completion        | Sticky Note                    | Final workflow steps and metrics   | N/A                        | N/A                                   | 🎉 Workflow Complete!: Lists final actions and suggested KPIs.                                                                                            |
| Sticky Note - Setup Instructions| Sticky Note                    | Configuration and credential needs | N/A                        | N/A                                   | 🔧 Configuration Required: Lists environment variables and credentials needed for setup.                                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node:**  
   - Name: "Webhook - Receive Application"  
   - Type: Webhook  
   - Path: `job-application`  
   - Response Mode: Response Node  
   - Purpose: Receive candidate data including name, email, phone, resume, cover letter, experience, skills.  
   - No credentials needed.  

2. **Create Google Sheets Node to Store Applications:**  
   - Name: "Google Sheets - Store Application"  
   - Type: Google Sheets  
   - Operation: Append or Update  
   - Sheet Name: "Applications"  
   - Document ID: Your Google Sheet ID (set environment variable or hard-code)  
   - Authentication: Service Account credential for Google API  
   - Mapping Mode: Auto map input data  
   - Connect input from Webhook node output.  

3. **Configure OpenAI Node for Candidate Evaluation:**  
   - Name: "OpenAI - AI Candidate Evaluation"  
   - Type: OpenAI (LangChain)  
   - Model: GPT-4 or equivalent  
   - Temperature: 0.3  
   - Prompt: Expert recruiter role with job requirements and injected candidate info via expressions (`{{ $json.body.name }}`, etc.)  
   - Credentials: OpenAI API key  
   - Input from Google Sheets node output.  

4. **Add Code Node to Process AI Output:**  
   - Name: "Code - Process Evaluation"  
   - Type: Code (JavaScript)  
   - Function: Parse AI response JSON, handle errors, combine candidate and evaluation data, decide next step based on score threshold 70.  
   - Input from OpenAI node output.  

5. **Add IF Node to Route Based on Score:**  
   - Name: "IF - Check Score Threshold"  
   - Type: If Condition  
   - Condition: `$json.decision === "Interview"`  
   - True branch: Next steps for interview  
   - False branch: Rejection path  
   - Input from Code node output.  

6. **Configure Email Node for Interview Invitations:**  
   - Name: "Email - Interview Invitation"  
   - Type: Email Send (SMTP)  
   - To: `{{ $json.candidate.email }}`  
   - From: hr@company.com (or your email)  
   - Subject: "Interview Invitation - Automation Specialist Position"  
   - Text: Personalized message with evaluation summary, strengths, next steps  
   - SMTP credentials setup required  
   - Input from IF node TRUE output.  

7. **Configure Google Calendar Node to Schedule Interview:**  
   - Name: "Google Calendar - Schedule Interview"  
   - Type: Google Calendar  
   - Start Time: 3 days from now at 10:00 AM (expression: `$now.plus(3, 'days').set({ hour: 10, minute: 0 }).toISO()`)  
   - End Time: 3 days from now at 11:00 AM  
   - Calendar ID: Your Google Calendar ID  
   - Authentication: Google Calendar OAuth2 credentials  
   - Input from Email Interview Invitation node output.  

8. **Add Google Sheets Node to Update Interview Status:**  
   - Name: "Update Sheet - Interview Status"  
   - Type: Google Sheets  
   - Operation: Update  
   - Sheet Name: "Applications"  
   - Document ID: Your Google Sheet ID  
   - Authentication: Service Account credentials  
   - Update columns: status = "Interview Scheduled", evaluation score, recommendation, interview date  
   - Input from Google Calendar scheduling node output.  

9. **Configure Email Node for Rejection Notices:**  
   - Name: "Email - Rejection Notice"  
   - Type: Email Send (SMTP)  
   - To: `{{ $json.candidate.email }}`  
   - From: hr@company.com  
   - Subject: "Application Update - Automation Specialist Position"  
   - Text: Polite rejection message encouraging future applications  
   - SMTP credentials  
   - Input from IF node FALSE output.  

10. **Add Google Sheets Node to Update Rejection Status:**  
    - Name: "Update Sheet - Rejection Status"  
    - Type: Google Sheets  
    - Operation: Update  
    - Sheet Name: "Applications"  
    - Document ID: Your Google Sheet ID  
    - Authentication: Service Account credentials  
    - Update columns: status = "Rejected", evaluation score, recommendation, rejection date  
    - Input from Rejection Email node output.  

11. **Add Respond to Webhook Node:**  
    - Name: "Respond to Webhook"  
    - Type: Respond to Webhook  
    - Respond With: JSON  
    - Response Body: JSON with success flag, candidate name, and decision status (`{{ $json.candidate.name }}`, `{{ $json.decision }}`)  
    - Input from both Update Sheet nodes (Interview and Rejection)  

12. **Connect Nodes Sequentially:**  
    - Webhook → Google Sheets Store  
    - Google Sheets Store → OpenAI Evaluation  
    - OpenAI → Code Processing  
    - Code → IF Node  
    - IF TRUE → Email Interview → Google Calendar → Update Interview Status → Respond to Webhook  
    - IF FALSE → Email Rejection → Update Rejection Status → Respond to Webhook  

13. **Setup Credentials:**  
    - Google Sheets: Service Account credential with write access  
    - OpenAI: API Key with GPT-4 access  
    - SMTP Email: Credentials for SMTP server (e.g., Gmail, Outlook)  
    - Google Calendar: OAuth2 credentials with calendar write access  

14. **Adjust Environment Variables and Parameters:**  
    - Google Sheet IDs for storage and updates  
    - Calendar ID for scheduling  
    - Job requirements and scoring threshold embedded in AI prompt and code node  
    - Email templates customized to branding and tone  

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                                                                                                       |
|----------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| Workflow uses OpenAI GPT-4 model for unbiased, consistent candidate evaluation                      | Requires OpenAI API key with GPT-4 access                                                                                           |
| Google Sheets serves as the Applicant Tracking System (ATS)                                        | Alternative storage options: Airtable, PostgreSQL, MySQL                                                                             |
| SMTP email nodes support alternative providers such as SendGrid, Gmail, or Outlook                 | SMTP credentials must allow sending from HR email address                                                                            |
| Interview scheduling uses Google Calendar API with OAuth2 authentication                           | Calendar event invites include candidate and hiring manager                                                                          |
| Score threshold (currently 70) adjustable based on role and hiring needs                           | Modify in Code - Process Evaluation node and AI prompt                                                                               |
| AI prompt customization allows updating job requirements or candidate evaluation criteria          | Prompt embedded with dynamic candidate data injection                                                                                |
| Workflow metrics to track include application volume, average AI score, interview rate, processing time | Useful for recruitment analytics and process improvement                                                                             |
| Setup instructions sticky note summarizes required environment variables and credentials           | Important for deployment and maintenance                                                                                            |

---

**Disclaimer:** The provided content exclusively derives from an automated workflow created with n8n, adhering strictly to content policies and handling only legal, public data.

---