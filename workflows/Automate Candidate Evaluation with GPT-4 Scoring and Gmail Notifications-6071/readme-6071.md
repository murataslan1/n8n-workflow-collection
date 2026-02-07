Automate Candidate Evaluation with GPT-4 Scoring and Gmail Notifications

https://n8nworkflows.xyz/workflows/automate-candidate-evaluation-with-gpt-4-scoring-and-gmail-notifications-6071


# Automate Candidate Evaluation with GPT-4 Scoring and Gmail Notifications

### 1. Workflow Overview

This n8n workflow automates candidate evaluation by parsing CVs submitted via a webhook, scoring candidates using GPT-4 AI based on job requirements, and sending appropriate Gmail notifications depending on the evaluation outcome. It targets recruitment teams aiming to streamline candidate screening and communication, leveraging AI to enhance decision-making and automate follow-ups.

The workflow logic is organized into these main blocks:

- **1.1 Input Reception:** Receives CV submissions via a webhook.
- **1.2 Job Requirements Setup:** Defines job-specific criteria for candidate evaluation.
- **1.3 AI-Powered CV Parsing:** Uses GPT-4 to extract structured candidate data from CV text.
- **1.4 Candidate Scoring:** Applies a customized scoring algorithm to evaluate candidates on skills, experience, education, and role relevance.
- **1.5 Decision Branching:** Routes candidates into recommendation categories: top candidates, interview worthy, rejected.
- **1.6 Notification Dispatch:** Sends tailored Gmail emails to HR or candidates based on decisions.

Two sticky notes provide configuration guidance and summarize AI-powered decision logic for clarity.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:** Starts the workflow by receiving incoming CV submissions via HTTP POST request.
- **Nodes Involved:** CV Submission Webhook
- **Node Details:**
  - **CV Submission Webhook**
    - Type: Webhook
    - Role: Entrypoint that listens for POST requests at path `/cv-received`.
    - Configuration:
      - HTTP Method: POST
      - Path: `cv-received`
      - No additional options configured.
    - Inputs: External HTTP request with candidate CV data (`cv_content` expected in payload).
    - Outputs: JSON data with submitted CV content.
    - Edge Cases: Invalid HTTP methods, missing CV content, or malformed request bodies could cause failures.
    - Version: n8n typeVersion 1.

#### 1.2 Job Requirements Setup

- **Overview:** Sets static job requirements and thresholds that guide candidate scoring.
- **Nodes Involved:** Job Requirements, Sticky Note (Recruitment AI Config)
- **Node Details:**
  - **Job Requirements**
    - Type: Set
    - Role: Defines key parameters such as minimum experience, passing score, and required technical skills.
    - Configuration:
      - Numeric values: `minExperience`=5 years, `passingScore`=75 points.
      - String value: `requiredSkills`="JavaScript,React,Node.js,Python"
      - (Note: No `jobTitle` or `hrEmail` set here; may be expected to be added for email nodes.)
    - Inputs: Receives from CV Submission Webhook.
    - Outputs: JSON with job criteria.
    - Edge Cases: Missing or incorrectly formatted skills string could affect scoring.
  - **Sticky Note ("Recruitment AI Config")**
    - Provides guidance to customize scoring weights and criteria.
    - Related to Job Requirements node.

#### 1.3 AI-Powered CV Parsing

- **Overview:** Sends CV content to OpenAI GPT-4 to parse and extract candidate details into structured JSON.
- **Nodes Involved:** Parse CV with AI
- **Node Details:**
  - **Parse CV with AI**
    - Type: HTTP Request
    - Role: Calls OpenAI Chat Completion API with GPT-4 model to parse CV.
    - Configuration:
      - URL: `https://api.openai.com/v1/chat/completions`
      - Method: POST
      - Headers: Content-Type `application/json`, Authorization with OpenAI API key from credentials.
      - Body:
        - Model: `gpt-4`
        - Messages: System prompt to act as CV parsing expert, user prompt includes CV content interpolation `{{ $json.cv_content }}`
        - Response format: JSON object.
    - Inputs: Receives job requirements JSON (though primarily uses CV content from previous webhook JSON).
    - Outputs: Parsed candidate information as JSON string inside GPT response.
    - Edge Cases:
      - API key invalid or rate-limited.
      - GPT response errors or malformed JSON.
      - Missing CV content.
    - Version: n8n typeVersion 1.

#### 1.4 Candidate Scoring

- **Overview:** Processes parsed candidate data with a custom JavaScript scoring algorithm that assigns weighted scores for skills, experience, education, and role relevance, then generates a recommendation.
- **Nodes Involved:** Score Candidate
- **Node Details:**
  - **Score Candidate**
    - Type: Code (JavaScript)
    - Role: Calculates total candidate score and recommendation based on job requirements and parsed data.
    - Configuration:
      - Reads parsed JSON from GPT-4 output.
      - Weights:
        - Skills matching: 40%
        - Experience: 30%
        - Education: 20%
        - Role relevance: 10%
      - Skills matching compares required skills to candidate skills ignoring case.
      - Experience thresholds: full points at ≥5 years, partial below.
      - Education scored higher for Master's/PhD, lower for Bachelor's/degree.
      - Role relevance checks for ‘engineer’ or ‘developer’ in previous roles.
      - Recommendations:
        - `hire` if score ≥85 (priority: high)
        - `interview` if score ≥ passingScore (default 75) (priority: medium)
        - `phone_screen` if score ≥60 (priority: low)
        - `reject` otherwise (priority: low)
      - Returns detailed scoring breakdown and metadata.
    - Inputs: Parsed candidate JSON, job requirements JSON.
    - Outputs: JSON with candidate info, scores, recommendation, priority, evaluated timestamp.
    - Edge Cases:
      - Malformed candidate JSON causing parse errors.
      - Missing fields in candidate data.
      - Division by zero if requiredSkills empty.
    - Version: n8n typeVersion 1.

#### 1.5 Decision Branching

- **Overview:** Routes candidate evaluation results into three branches to trigger respective email notifications.
- **Nodes Involved:** Check If Top Candidate, Check If Interview Worthy, Check If Rejected, Sticky Note (AI-Powered Decisions)
- **Node Details:**
  - **Check If Top Candidate**
    - Type: If
    - Role: Checks if recommendation equals `hire`.
    - Configuration: String equality check on `{{ $json.scoring.recommendation }}` == 'hire'.
    - Outputs: True → Alert HR Team; False → next condition.
  - **Check If Interview Worthy**
    - Type: If
    - Role: Checks if recommendation equals `interview`.
    - Configuration: String equality check == 'interview'.
    - Outputs: True → Send Interview Invitation; False → next condition.
  - **Check If Rejected**
    - Type: If
    - Role: Checks if recommendation equals `reject`.
    - Configuration: String equality check == 'reject'.
    - Outputs: True → Send Rejection Email.
    - (Note: The `phone_screen` recommendation branch is defined in scoring but not explicitly handled in this workflow.)
  - **Sticky Note ("AI-Powered Decisions")**
    - Summarizes automation actions:
      - Top candidates → HR alert
      - Interview worthy → auto-invite
      - Rejected → polite decline
      - Phone screen → initial contact (not implemented here)
    - Offers clear reference for decision logic.

#### 1.6 Notification Dispatch

- **Overview:** Sends formatted HTML emails via Gmail to HR or candidates based on evaluation outcomes.
- **Nodes Involved:** Alert HR Team, Send Interview Invitation, Send Rejection Email
- **Node Details:**
  - **Alert HR Team**
    - Type: Gmail
    - Role: Sends email alert about exceptional candidates to HR.
    - Configuration:
      - Recipient: `{{ $node['Job Requirements'].json.hrEmail }}` (requires this field in Job Requirements JSON)
      - Subject: "🌟 Top Candidate Alert - {{ $json.jobTitle }}"
      - HTML body: Richly formatted email with candidate profile, score breakdown, and call-to-action links.
    - Inputs: Candidate scoring JSON with detailed data.
    - Outputs: Email sent confirmation.
    - Edge Cases: Missing HR email address, Gmail authentication errors.
  - **Send Interview Invitation**
    - Type: Gmail
    - Role: Emails candidate an interview invitation.
    - Configuration:
      - Recipient: Candidate email `{{ $json.candidateData.email }}`
      - Subject: "Interview Invitation - {{ $json.jobTitle }} Position"
      - HTML body: Friendly invitation with next steps and scheduling link.
    - Edge Cases: Invalid candidate email, Gmail API errors.
  - **Send Rejection Email**
    - Type: Gmail
    - Role: Sends polite rejection email to candidate.
    - Configuration:
      - Recipient: Candidate email
      - Subject: "Thank you for your application - {{ $json.jobTitle }}"
      - HTML body: Appreciation message with future opportunity tips.
    - Edge Cases: Same as above.

---

### 3. Summary Table

| Node Name               | Node Type          | Functional Role                       | Input Node(s)            | Output Node(s)                          | Sticky Note                                                                                                          |
|-------------------------|--------------------|------------------------------------|--------------------------|---------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| CV Submission Webhook   | Webhook            | Receive CV submission via HTTP POST | -                        | Job Requirements                      |                                                                                                                      |
| Job Requirements        | Set                | Define job criteria and thresholds | CV Submission Webhook     | Parse CV with AI                      | Recruitment AI Config: Customize scoring weights and criteria                                                        |
| Parse CV with AI        | HTTP Request       | Parse CV text to structured JSON   | Job Requirements          | Score Candidate                      |                                                                                                                      |
| Score Candidate         | Code               | Evaluate candidate and score        | Parse CV with AI          | Check If Top Candidate, Check If Interview Worthy, Check If Rejected |                                                                                                                      |
| Check If Top Candidate  | If                 | Determine if candidate is 'hire'   | Score Candidate           | Alert HR Team                        | AI-Powered Decisions: Automated actions for top candidates, interview worthy, rejected, phone screen                 |
| Alert HR Team           | Gmail              | Notify HR of exceptional candidate | Check If Top Candidate    | -                                   |                                                                                                                      |
| Check If Interview Worthy | If                | Determine if candidate is 'interview' | Score Candidate           | Send Interview Invitation            | AI-Powered Decisions sticky note also applies here                                                                   |
| Send Interview Invitation | Gmail             | Invite candidate for interview      | Check If Interview Worthy | -                                   |                                                                                                                      |
| Check If Rejected       | If                 | Determine if candidate is 'reject' | Score Candidate           | Send Rejection Email                 | AI-Powered Decisions sticky note also applies here                                                                   |
| Send Rejection Email    | Gmail              | Send polite rejection email         | Check If Rejected         | -                                   |                                                                                                                      |
| Sticky Note             | Sticky Note        | Guidance on AI scoring config       | -                        | -                                   | Recruitment AI Config: Customize scoring weights and criteria                                                        |
| Sticky Note1            | Sticky Note        | Summary of AI decision automation   | -                        | -                                   | AI-Powered Decisions: Automated actions summary                                                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node: "CV Submission Webhook"**
   - Type: Webhook
   - HTTP Method: POST
   - Path: `cv-received`
   - Purpose: Entry point to receive CV submissions as HTTP POST requests.
   - Save credentials if required.
   
2. **Create Set Node: "Job Requirements"**
   - Connect from "CV Submission Webhook".
   - Add fields:
     - Numeric: `minExperience` = 5
     - Numeric: `passingScore` = 75
     - String: `requiredSkills` = "JavaScript,React,Node.js,Python"
     - (Add `jobTitle` string and `hrEmail` string here as needed for emails)
   - Purpose: Define job criteria for scoring.

3. **Create HTTP Request Node: "Parse CV with AI"**
   - Connect from "Job Requirements".
   - Method: POST
   - URL: `https://api.openai.com/v1/chat/completions`
   - Authentication: Use OpenAI API key credential.
   - Headers:
     - Content-Type: `application/json`
     - Authorization: `Bearer {{ $credentials.openai.apiKey }}`
   - Body (JSON):
     - `model`: `"gpt-4"`
     - `messages`: Array with:
       - System role: "You are a CV parsing expert. Extract key information from CVs and return structured JSON data."
       - User role: `Parse this CV and extract: name, email, phone, skills, experience_years, education, previous_roles. CV content: {{ $json.cv_content }}`
     - `response_format`: `{ "type": "json_object" }`
   - Purpose: Use GPT-4 to parse CV content.

4. **Create Code Node: "Score Candidate"**
   - Connect from "Parse CV with AI".
   - Code (JavaScript) to:
     - Parse candidate JSON from GPT response.
     - Extract required skills from job requirements.
     - Calculate weighted scores for skills, experience, education, and role relevance.
     - Assign recommendation and priority.
     - Return structured scoring and candidate data.
   - Purpose: Implement customized candidate scoring logic.

5. **Create If Node: "Check If Top Candidate"**
   - Connect from "Score Candidate".
   - Condition: `{{ $json.scoring.recommendation }}` equals "hire".
   - True output: Connect to "Alert HR Team".
   - False output: Connect to next If node.

6. **Create If Node: "Check If Interview Worthy"**
   - Connect from "Score Candidate" (or from false output of previous If).
   - Condition: `{{ $json.scoring.recommendation }}` equals "interview".
   - True output: Connect to "Send Interview Invitation".
   - False output: Connect to next If node.

7. **Create If Node: "Check If Rejected"**
   - Connect from "Score Candidate" (or from false output of previous If).
   - Condition: `{{ $json.scoring.recommendation }}` equals "reject".
   - True output: Connect to "Send Rejection Email".

8. **Create Gmail Node: "Alert HR Team"**
   - Connect from "Check If Top Candidate" (true output).
   - Send To: `{{ $node['Job Requirements'].json.hrEmail }}`
   - Subject: `"🌟 Top Candidate Alert - {{ $json.jobTitle }}"`
   - Message (HTML):
     - Use provided rich HTML template including candidate profile, scores, and CTAs.
   - Credentials: Setup Gmail OAuth2 credentials.
   - Purpose: Notify HR of top candidates.

9. **Create Gmail Node: "Send Interview Invitation"**
   - Connect from "Check If Interview Worthy" (true output).
   - Send To: `{{ $json.candidateData.email }}`
   - Subject: `"Interview Invitation - {{ $json.jobTitle }} Position"`
   - Message (HTML):
     - Use provided interview invitation HTML template with scheduling link.
   - Credentials: Gmail OAuth2.
   - Purpose: Invite candidates for interviews.

10. **Create Gmail Node: "Send Rejection Email"**
    - Connect from "Check If Rejected" (true output).
    - Send To: `{{ $json.candidateData.email }}`
    - Subject: `"Thank you for your application - {{ $json.jobTitle }}"`
    - Message (HTML):
      - Use provided polite rejection email template.
    - Credentials: Gmail OAuth2.
    - Purpose: Politely decline candidates.

11. **Add Sticky Notes for Documentation**
    - One near Job Requirements: Explain scoring customization.
    - One near decision nodes: Summarize AI-powered automated actions.

12. **Test Workflow**
    - Deploy webhook.
    - Submit test CV data as POST request.
    - Verify parsing, scoring, and appropriate email dispatch.

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                                                                 |
|----------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| Workflow automates recruitment candidate evaluation leveraging OpenAI GPT-4 for CV parsing.         | Workflow project description                                                                  |
| Gmail OAuth2 credentials are required for sending emails via Gmail nodes.                          | Gmail OAuth2 setup in n8n credentials                                                         |
| Customize scoring weights and job criteria in "Job Requirements" node as per recruitment needs.   | Sticky Note "Recruitment AI Config"                                                           |
| The workflow does not handle the "phone_screen" recommendation branch; consider adding if needed. | AI-Powered Decisions sticky note                                                             |
| Email templates use rich HTML with inline CSS for professional formatting and CTAs.                | Gmail nodes' message parameters                                                               |
| OpenAI API key must have access to GPT-4 model and sufficient quota.                               | OpenAI account and API key management                                                         |

---

**Disclaimer:** The text provided stems exclusively from an automated n8n workflow. It complies fully with all applicable content policies and contains no illegal or protected material. All processed data is legal and publicly permissible.