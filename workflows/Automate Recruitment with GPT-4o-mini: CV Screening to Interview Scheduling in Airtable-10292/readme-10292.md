Automate Recruitment with GPT-4o-mini: CV Screening to Interview Scheduling in Airtable

https://n8nworkflows.xyz/workflows/automate-recruitment-with-gpt-4o-mini--cv-screening-to-interview-scheduling-in-airtable-10292


# Automate Recruitment with GPT-4o-mini: CV Screening to Interview Scheduling in Airtable

### 1. Workflow Overview

This workflow automates the recruitment pipeline from CV submission to interview scheduling using GPT-4o-mini AI and Airtable integration. It is designed for HR teams and recruiters to streamline candidate screening, qualification assessment, communication, and interview scheduling with minimal manual intervention.

The logical blocks include:

- **1.1 Input Reception and Data Storage:** Receives candidate CV submissions via webhook, stores candidate data in Airtable, and downloads the CV for processing.

- **1.2 Data Extraction and Job Requirements Retrieval:** Extracts structured candidate data from the CV using AI, and retrieves job requirements from Airtable based on the applied position.

- **1.3 AI-Based Qualification Assessment:** Uses AI agents to analyze candidate fit against job requirements, generates a detailed qualification report, and updates Airtable records accordingly.

- **1.4 Candidate Filtering and Communication:** Filters candidates based on AI recommendations, generates personalized emails via AI, and sends outreach emails to candidates.

- **1.5 Interview Scheduling and Notifications:** Filters candidates recommended for interviews, schedules interviews in Google Calendar, updates Airtable with interview details, sends Slack notifications to recruitment team, and responds to the original webhook call with results.

- **1.6 Workflow Metadata and Setup Notes:** Contains sticky notes with introduction, overview, prerequisites, benefits, and setup instructions for users.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Data Storage

**Overview:**  
Receives candidate CV data from external sources via webhook, stores candidate basic information in Airtable, and downloads the CV document for further processing.

**Nodes Involved:**  
- Webhook - Receive CV  
- Airtable - Store Candidate  
- HTTP Request - Download CV  

**Node Details:**  

- **Webhook - Receive CV**  
  - Type: Webhook  
  - Role: Entry point, receives HTTP POST requests containing candidate CV data.  
  - Configuration: HTTP POST on path `/candidate-cv`, response mode set to respond node.  
  - Inputs: External HTTP request with JSON body (candidate info including name, email, phone, CV URL, position).  
  - Outputs: Passes candidate data to Airtable storage and CV download nodes.  
  - Edge Cases: Missing required fields in payload, invalid CV URL, network issues.  

- **Airtable - Store Candidate**  
  - Type: Airtable node  
  - Role: Creates new candidate record in Airtable with received data.  
  - Configuration: Uses OAuth2 authentication; fields mapped from webhook payload (Name, Email, Phone, CV_URL, Status = "New Application", Application_Date = current ISO timestamp, Position_Applied).  
  - Inputs: Candidate data from webhook node.  
  - Outputs: Candidate record data for downstream use.  
  - Edge Cases: Airtable API errors, authentication failures, rate limits.  

- **HTTP Request - Download CV**  
  - Type: HTTP Request  
  - Role: Downloads CV file from provided URL for AI processing.  
  - Configuration: URL dynamically taken from webhook CV URL field.  
  - Inputs: CV URL from webhook.  
  - Outputs: Binary CV content to AI extraction node.  
  - Edge Cases: Broken URL, download timeout, unsupported formats.  

---

#### 1.2 Data Extraction and Job Requirements Retrieval

**Overview:**  
Processes the downloaded CV to extract structured candidate information (skills, education, experience). Simultaneously, fetches the job requirements from Airtable matching the candidate's applied position.

**Nodes Involved:**  
- AI - Extract CV Data  
- Airtable - Get Job Requirements  

**Node Details:**  

- **AI - Extract CV Data**  
  - Type: LangChain Information Extractor  
  - Role: Parses CV content to extract structured data such as skills, education, years of experience.  
  - Configuration: Default extraction options, processes binary CV data.  
  - Inputs: CV binary data from HTTP Request node.  
  - Outputs: JSON with extracted candidate profile details.  
  - Edge Cases: Poor CV formatting, unsupported languages, incomplete extraction.  

- **Airtable - Get Job Requirements**  
  - Type: Airtable node  
  - Role: Searches Airtable "Job Requirements" table for active job requirements matching candidate's applied position.  
  - Configuration: OAuth2 authentication, filter formula dynamically uses position from webhook payload, only active requirements.  
  - Inputs: Candidate position from webhook node.  
  - Outputs: Job requirement details (position, required experience, skills, education, nice to have).  
  - Edge Cases: No matching job found, Airtable query errors.  

---

#### 1.3 AI-Based Qualification Assessment

**Overview:**  
Evaluates candidate qualifications against job requirements using AI agents, producing a detailed JSON report with scores, strengths, gaps, and recommendations.

**Nodes Involved:**  
- AI Agent - Qualification Assessment  
- OpenAI Chat Model Assessment  
- Structured Output Parser  
- Airtable - Update Assessment  

**Node Details:**  

- **AI Agent - Qualification Assessment**  
  - Type: LangChain AI Agent  
  - Role: Performs qualification assessment based on candidate profile and job requirements.  
  - Configuration: Custom prompt instructing the agent to produce a JSON with match score, status, strengths, gaps, recommendation, and reasoning. System message sets expert recruitment AI context.  
  - Inputs: Candidate data from AI extraction, job data from Airtable.  
  - Outputs: Raw AI-generated qualification JSON.  
  - Edge Cases: AI misinterpretation, malformed JSON outputs, API timeouts.  

- **OpenAI Chat Model Assessment**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Underlying language model (gpt-4o) used by AI agent for candidate assessment.  
  - Configuration: Model set to "gpt-4o" with temperature 0.3 for balanced responses.  
  - Inputs: Prompt from AI Agent node.  
  - Outputs: AI textual response to be parsed.  
  - Edge Cases: API quota limits, latency, model response errors.  

- **Structured Output Parser**  
  - Type: LangChain Output Parser  
  - Role: Parses AI textual response into structured JSON format to be used downstream.  
  - Inputs: AI chat model output.  
  - Outputs: Parsed JSON with fields for match score, status, strengths, gaps, recommendation, reasoning.  
  - Edge Cases: Parsing failures due to unexpected format.  

- **Airtable - Update Assessment**  
  - Type: Airtable node  
  - Role: Updates candidate record with AI assessment results including skills, status, gaps, education, match score, reasoning, strengths, years of experience, recommendation, and qualification status.  
  - Configuration: Uses OAuth2; conditional logic to set Status to “Rejected” or “Qualified” based on recommendation.  
  - Inputs: Parsed AI assessment JSON and extracted candidate data.  
  - Outputs: Updated Airtable record for filtering.  
  - Edge Cases: Airtable update failures, data mismatches.  

---

#### 1.4 Candidate Filtering and Communication

**Overview:**  
Filters candidates based on AI recommendations, generates personalized recruitment emails using AI, and sends emails to candidates.

**Nodes Involved:**  
- Filter - Qualified Candidates  
- AI Agent - Generate Email  
- OpenAI Chat Model Email  
- Send Email - Candidate Outreach  

**Node Details:**  

- **Filter - Qualified Candidates**  
  - Type: Filter  
  - Role: Allows only candidates who are not rejected to proceed for email generation.  
  - Configuration: Filters where recommendation is not "Reject".  
  - Inputs: Airtable updated candidate data.  
  - Outputs: Qualified candidates for email generation.  
  - Edge Cases: Filtering errors, missing recommendation field.  

- **AI Agent - Generate Email**  
  - Type: LangChain AI Agent  
  - Role: Creates a personalized, professional recruitment email based on candidate profile, match score, recommendation, and strengths.  
  - Configuration: Prompt specifies email style, length constraints, and content inclusions (congratulations, strengths, next steps). System message sets recruitment communications specialist persona.  
  - Inputs: Candidate name and position from Airtable and webhook, AI assessment data.  
  - Outputs: JSON with email subject and body.  
  - Edge Cases: AI output format errors, tone mismatches.  

- **OpenAI Chat Model Email**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Underlying OpenAI model used by AI agent to generate the email text.  
  - Configuration: Default options, authenticated with OpenAI API credentials.  
  - Inputs: Prompt from AI Agent node.  
  - Outputs: Generated email content.  
  - Edge Cases: API limits, response delays.  

- **Send Email - Candidate Outreach**  
  - Type: Email Send node  
  - Role: Sends the generated email to the candidate’s email address.  
  - Configuration: Uses fixed from address "recruitment@company.com", subject and body from AI output, recipient email from Airtable.  
  - Inputs: Email content JSON, candidate email address.  
  - Outputs: Email sent confirmation.  
  - Edge Cases: SMTP issues, invalid email addresses, delivery failures.  

---

#### 1.5 Interview Scheduling and Notifications

**Overview:**  
Filters candidates recommended for interviews, schedules Google Calendar events, updates Airtable with interview details, sends Slack notifications, and responds back to the webhook caller with processing results.

**Nodes Involved:**  
- Filter - Interview Candidates  
- Google Calendar - Schedule Interview  
- Airtable - Update Interview Details  
- Slack - Send Notification  
- Respond to Webhook  

**Node Details:**  

- **Filter - Interview Candidates**  
  - Type: Filter  
  - Role: Passes only candidates recommended for an interview.  
  - Configuration: Filters where AI recommendation equals "Interview".  
  - Inputs: AI assessment data post-email sending.  
  - Outputs: Candidates qualified for interview scheduling.  
  - Edge Cases: Filtering logic errors.  

- **Google Calendar - Schedule Interview**  
  - Type: Google Calendar node  
  - Role: Schedules an interview event 3 days from now, lasting 1 hour, on the primary Google Calendar.  
  - Configuration: Start and end times calculated dynamically; no additional event fields set.  
  - Inputs: Filtered candidates for interview.  
  - Outputs: Calendar event details including event ID and hangout link (if applicable).  
  - Edge Cases: Calendar auth errors, conflicts, quota limits.  

- **Airtable - Update Interview Details**  
  - Type: Airtable node  
  - Role: Updates candidate record with interview scheduling details including status, calendar event ID, hangout link, and scheduled time.  
  - Configuration: OAuth2 authentication; sets Status to "Interview Scheduled".  
  - Inputs: Calendar event data.  
  - Outputs: Updated Airtable record.  
  - Edge Cases: Airtable update failures.  

- **Slack - Send Notification**  
  - Type: Slack node  
  - Role: Sends a formatted notification to a recruitment Slack channel summarizing candidate status, match score, recommendation, and next steps.  
  - Configuration: Sends to channel ID "C0123456789" (e.g., #recruitment), message includes dynamic candidate data and links to Airtable record.  
  - Inputs: Candidate data from Airtable and AI assessment.  
  - Outputs: Slack message confirmation.  
  - Edge Cases: Slack webhook failures, permission issues.  

- **Respond to Webhook**  
  - Type: Respond to Webhook node  
  - Role: Sends a final JSON response to the original webhook caller confirming candidate processing and assessment results.  
  - Configuration: Responds with candidate ID, name, match score, status, recommendation, and success message.  
  - Inputs: Data from Airtable, AI assessment nodes.  
  - Outputs: HTTP response to external system.  
  - Edge Cases: Timeout, malformed response, connection issues.  

---

#### 1.6 Workflow Metadata and Setup Notes

**Overview:**  
Contains informational sticky notes with workflow introduction, high-level explanation, prerequisites, customization options, and benefits.

**Nodes Involved:**  
- Sticky Note  
- Sticky Note1  

**Node Details:**  

- **Sticky Note**  
  - Type: Sticky Note  
  - Role: Provides detailed introduction, workflow template, steps, and setup instructions for users.  
  - Content Highlights: Describes end-to-end candidate evaluation automation, stepwise workflow summary, and key setup steps including webhook URL, Airtable tables, AI configuration, and communication integrations.  
  - Position: Top-left area of canvas for visibility.  

- **Sticky Note1**  
  - Type: Sticky Note  
  - Role: Lists prerequisites (Airtable, OpenAI API, Gmail, Google Calendar, Slack), customization options (multi-stage scheduling, ATS integrations), and benefits (screening time reduction, uniform evaluation, time-to-hire decrease).  
  - Positioned near AI and assessment nodes as guidance for users.  

---

### 3. Summary Table

| Node Name                      | Node Type                                  | Functional Role                         | Input Node(s)                     | Output Node(s)                            | Sticky Note                                                                                                                        |
|--------------------------------|--------------------------------------------|---------------------------------------|----------------------------------|-------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| Webhook - Receive CV            | Webhook                                    | Receives candidate CV data             | External HTTP                    | Airtable - Store Candidate, HTTP Request - Download CV | See Sticky Note for workflow intro and setup                                                                                      |
| Airtable - Store Candidate      | Airtable                                   | Stores candidate basic info            | Webhook - Receive CV             | Airtable - Get Job Requirements            | See Sticky Note for workflow intro and setup                                                                                      |
| HTTP Request - Download CV      | HTTP Request                               | Downloads candidate CV file            | Webhook - Receive CV             | AI - Extract CV Data                       | See Sticky Note for workflow intro and setup                                                                                      |
| AI - Extract CV Data            | LangChain Information Extractor            | Extracts structured candidate data    | HTTP Request - Download CV       | AI Agent - Qualification Assessment        | See Sticky Note for workflow intro and setup                                                                                      |
| Airtable - Get Job Requirements | Airtable                                   | Fetches job requirements based on position | Airtable - Store Candidate       | AI Agent - Qualification Assessment        | See Sticky Note for workflow intro and setup                                                                                      |
| AI Agent - Qualification Assessment | LangChain AI Agent                      | Analyzes candidate fit and scores      | AI - Extract CV Data, Airtable - Get Job Requirements | Airtable - Update Assessment              | See Sticky Note for workflow intro and setup                                                                                      |
| OpenAI Chat Model Assessment    | LangChain OpenAI Chat Model                 | Provides language model for assessment | AI Agent - Qualification Assessment | AI Agent - Qualification Assessment        | See Sticky Note for workflow intro and setup                                                                                      |
| Structured Output Parser        | LangChain Output Parser                      | Parses AI assessment output             | OpenAI Chat Model Assessment    | AI Agent - Qualification Assessment        | See Sticky Note for workflow intro and setup                                                                                      |
| Airtable - Update Assessment    | Airtable                                   | Updates candidate record with AI results | AI Agent - Qualification Assessment | Filter - Qualified Candidates, Slack - Send Notification | See Sticky Note for workflow intro and setup                                                                                      |
| Filter - Qualified Candidates   | Filter                                     | Filters candidates not rejected        | Airtable - Update Assessment    | AI Agent - Generate Email                   | See Sticky Note for workflow intro and setup                                                                                      |
| AI Agent - Generate Email       | LangChain AI Agent                          | Generates personalized recruitment email | Filter - Qualified Candidates   | Send Email - Candidate Outreach             | See Sticky Note for workflow intro and setup                                                                                      |
| OpenAI Chat Model Email         | LangChain OpenAI Chat Model                 | Provides language model for email generation | AI Agent - Generate Email       | AI Agent - Generate Email                    | See Sticky Note for workflow intro and setup                                                                                      |
| Send Email - Candidate Outreach | Email Send                                 | Sends recruitment email to candidate  | AI Agent - Generate Email       | Filter - Interview Candidates                | See Sticky Note for workflow intro and setup                                                                                      |
| Filter - Interview Candidates   | Filter                                     | Filters candidates recommended for interview | Send Email - Candidate Outreach | Google Calendar - Schedule Interview         | See Sticky Note for workflow intro and setup                                                                                      |
| Google Calendar - Schedule Interview | Google Calendar                         | Schedules interview event              | Filter - Interview Candidates   | Airtable - Update Interview Details          | See Sticky Note for workflow intro and setup                                                                                      |
| Airtable - Update Interview Details | Airtable                               | Updates Airtable with interview info  | Google Calendar - Schedule Interview | Respond to Webhook                          | See Sticky Note for workflow intro and setup                                                                                      |
| Slack - Send Notification       | Slack                                      | Sends notification to recruitment team | Airtable - Update Assessment    | Respond to Webhook                          | See Sticky Note for workflow intro and setup                                                                                      |
| Respond to Webhook              | Respond to Webhook                         | Sends final processing response        | Airtable - Update Interview Details, Slack - Send Notification | None                                   | See Sticky Note for workflow intro and setup                                                                                      |
| Sticky Note                    | Sticky Note                                | Workflow introduction and setup notes | None                          | None                                      | Contains detailed workflow overview, steps, and setup instructions                                                              |
| Sticky Note1                   | Sticky Note                                | Prerequisites, benefits, and customization notes | None                          | None                                      | Lists requirements, benefits, and customization options                                                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Name: "Webhook - Receive CV"  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `candidate-cv`  
   - Response Mode: Response Node  

2. **Create Airtable Node to Store Candidate**  
   - Name: "Airtable - Store Candidate"  
   - Type: Airtable (Create operation)  
   - Base: Your Airtable base ID (e.g., `appXXXXXXXXXXXXXX`)  
   - Table: Candidates table ID (e.g., `tblCandidates`)  
   - Credentials: OAuth2 with Airtable  
   - Fields mapping:  
     - Name = `{{$json.body.name}}`  
     - Email = `{{$json.body.email}}`  
     - Phone = `{{$json.body.phone}}`  
     - CV_URL = `{{$json.body.cv_url}}`  
     - Status = `"New Application"`  
     - Application_Date = `{{$now.toISO()}}`  
     - Position_Applied = `{{$json.body.position}}`  

3. **Create HTTP Request Node to Download CV**  
   - Name: "HTTP Request - Download CV"  
   - Type: HTTP Request  
   - URL: `={{$('Webhook - Receive CV').item.json.body.cv_url}}`  
   - Method: GET (default)  

4. **Create AI Information Extractor Node**  
   - Name: "AI - Extract CV Data"  
   - Type: LangChain Information Extractor  
   - Input: Binary data from HTTP Request node  
   - Use default extraction options or configure as needed  

5. **Create Airtable Node to Get Job Requirements**  
   - Name: "Airtable - Get Job Requirements"  
   - Type: Airtable (Search operation)  
   - Base and Table: same base, "Job Requirements" table  
   - Credentials: OAuth2  
   - Filter formula:  
     `=AND({Position}='{{ $('Webhook - Receive CV').item.json.body.position }}', {Active}=TRUE())`  

6. **Create AI Agent Node for Qualification Assessment**  
   - Name: "AI Agent - Qualification Assessment"  
   - Type: LangChain Agent  
   - Text prompt: Use detailed prompt template with candidate profile and job requirements (as in workflow)  
   - System message: Recruitment AI expert context  
   - Connect inputs: Candidate profile from AI Extract CV Data, job requirements from Airtable  

7. **Create OpenAI Chat Model Node for Assessment**  
   - Name: "OpenAI Chat Model Assessment"  
   - Type: LangChain OpenAI Chat Model  
   - Model: `gpt-4o`  
   - Temperature: 0.3  
   - Connect as AI language model for AI Agent node  

8. **Create Structured Output Parser Node**  
   - Name: "Structured Output Parser"  
   - Type: LangChain Output Parser Structured  
   - Connect AI Chat Model Assessment output to parser  
   - Connect parser output back to AI Agent node  

9. **Create Airtable Node to Update Assessment**  
   - Name: "Airtable - Update Assessment"  
   - Type: Airtable (Update operation)  
   - Base/Table: Candidates  
   - Credentials: OAuth2  
   - Map all AI assessment fields (skills, status, AI gaps, education, match score, reasoning, strengths, years experience, recommendation, qualification status)  
   - Use conditional expression to set `Status` to "Rejected" or "Qualified" based on recommendation  

10. **Create Filter Node for Qualified Candidates**  
    - Name: "Filter - Qualified Candidates"  
    - Type: Filter  
    - Condition: `recommendation != 'Reject'`  

11. **Create AI Agent Node to Generate Email**  
    - Name: "AI Agent - Generate Email"  
    - Type: LangChain Agent  
    - Prompt: Personalized recruitment email template including candidate name, position, strengths, and next steps  
    - System message: Recruitment communications specialist context  

12. **Create OpenAI Chat Model Node for Email Generation**  
    - Name: "OpenAI Chat Model Email"  
    - Type: LangChain OpenAI Chat Model  
    - Credentials: OpenAI API key  
    - Connect as AI language model for AI Agent - Generate Email node  

13. **Create Email Send Node**  
    - Name: "Send Email - Candidate Outreach"  
    - Type: Email Send  
    - From: recruitment@company.com  
    - To: Candidate email from Airtable  
    - Subject & Body: From AI Agent - Generate Email output  

14. **Create Filter Node for Interview Candidates**  
    - Name: "Filter - Interview Candidates"  
    - Type: Filter  
    - Condition: `recommendation == 'Interview'`  

15. **Create Google Calendar Node to Schedule Interview**  
    - Name: "Google Calendar - Schedule Interview"  
    - Type: Google Calendar  
    - Credentials: OAuth2 Google Calendar  
    - Calendar: Primary  
    - Start: Now + 3 days  
    - End: Start + 1 hour  

16. **Create Airtable Node to Update Interview Details**  
    - Name: "Airtable - Update Interview Details"  
    - Type: Airtable (Update operation)  
    - Update candidate record with interview status, calendar event ID, hangout link, and scheduled time  

17. **Create Slack Node to Send Notification**  
    - Name: "Slack - Send Notification"  
    - Type: Slack  
    - Credentials: Slack webhook or OAuth2  
    - Channel: Recruitment channel ID (e.g., `C0123456789`)  
    - Message: Formatted candidate summary with status, score, recommendation, strengths, and Airtable link  

18. **Create Respond to Webhook Node**  
    - Name: "Respond to Webhook"  
    - Type: Respond to Webhook  
    - Response: JSON including success, candidate ID, name, match score, status, recommendation, and message  

19. **Connect nodes following the data flow as detailed in the overview and summary table.**

20. **Add Sticky Notes**  
    - Add workflow introduction and instructions at top-left.  
    - Add prerequisites and benefits note near AI nodes.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                     | Context or Link                                                                                         |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| Automates candidate evaluation from CV submission to interview booking, reducing screening time by 90% and time-to-hire by 60%.                               | Workflow introduction sticky note.                                                                    |
| Prerequisites include Airtable account with configured tables, OpenAI API key for GPT-4o model, Gmail and Google Calendar OAuth2 credentials, Slack workspace. | Sticky note near AI nodes.                                                                             |
| Customization options include multi-stage scheduling and integration with ATS systems like Greenhouse or Lever.                                               | Sticky note near AI nodes.                                                                             |
| Workflow steps: Webhook → Airtable storage → CV download → AI extraction → AI qualification → Filtering → Email generation → Email sending → Interview scheduling → Slack notification → Webhook response | Sticky note summary.                                                                                   |
| Airtable base and table IDs must be replaced with actual IDs specific to your setup.                                                                             | Critical for Airtable nodes configuration.                                                            |
| OpenAI API credentials must use GPT-4o or GPT-4o-mini model for best results as per node configuration.                                                        | Important for AI nodes.                                                                                |
| Slack notifications include direct Airtable record links for easy access by recruitment teams.                                                                 | Slack - Send Notification node message formatting.                                                   |
| Google Calendar interview scheduling sets default interview 3 days ahead for 1 hour; adjust timing as per organizational needs.                              | Google Calendar - Schedule Interview node configuration.                                              |

---

**Disclaimer:** The provided text is generated exclusively from an n8n automated workflow. It adheres strictly to content policies and contains no illegal or sensitive information. All data processed is legal and public.