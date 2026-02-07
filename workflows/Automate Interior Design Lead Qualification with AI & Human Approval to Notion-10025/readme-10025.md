Automate Interior Design Lead Qualification with AI & Human Approval to Notion

https://n8nworkflows.xyz/workflows/automate-interior-design-lead-qualification-with-ai---human-approval-to-notion-10025


# Automate Interior Design Lead Qualification with AI & Human Approval to Notion

### 1. Workflow Overview

This workflow automates the process of qualifying interior design leads using AI-based classification and human approval, then manages outreach communications and client record keeping in Notion. It targets interior design firms aiming to efficiently prioritize client inquiries and personalize follow-up emails based on lead quality.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception**: Capture client intake form submissions via an embedded or hosted form.
- **1.2 AI Lead Classification**: Analyze intake data using AI agents to classify leads as HOT, WARM, or COLD based on project scope, budget, and commitment.
- **1.3 Classification Routing & Notifications**: Route leads based on classification, notify sales teams with detailed summaries.
- **1.4 Personalized Outreach Email Generation**: Generate customized client emails tailored to lead type with AI assistance.
- **1.5 Human-in-the-Loop Email Approval**: Send generated emails to a human reviewer via Telegram for approval or revision.
- **1.6 Email Revision (if needed)**: Allow AI-based revision of emails based on human feedback.
- **1.7 Client Email Delivery**: Send approved emails to clients via Gmail.
- **1.8 Lead Data Storage**: Log all client and classification data into a Notion database for tracking and analytics.

---

### 2. Block-by-Block Analysis

---

#### Block 1.1: Input Reception

- **Overview:**  
Captures lead data from a custom interior design client intake form, collecting detailed project and client information for evaluation.

- **Nodes Involved:**  
  - Form Trigger  
  - Sticky Note (Client Intake Form Trigger)

- **Node Details:**

1. **Form Trigger**  
   - **Type:** n8n native form trigger node  
   - **Role:** Captures form submissions at webhook path `interior-design-form`.  
   - **Configuration:**  
     - Form titled "Interior Design Client Intake Questionnaire"  
     - Fields: First Name, Second Name, Contact Number (number), Email (email), Project Address, Project Type (multi-select dropdown), Spaces Included, Estimated Project Budget (dropdown), Target Completion Date (date), Desired Style (text), Dislikes (textarea), Decision-Making & Involvement (dropdown), Prior Design Experience (checkbox), Inspiration Links (textarea)  
     - All required fields appropriately set  
   - **Input/Output:**  
     - Input from external clients submitting the form  
     - Outputs form data JSON for downstream processing  
   - **Edge Cases:**  
     - Missing required fields will prevent submission  
     - Multiselect Project Type requires careful parsing downstream  
   - **Sticky Note:** Highlights intake data sources and collected fields.

---

#### Block 1.2: AI Lead Classification

- **Overview:**  
Processes intake form data with an AI agent to classify leads into HOT, WARM, or COLD categories based on strict business rules considering budget, project scope, and client commitment.

- **Nodes Involved:**  
  - Classification Agent (Langchain Agent node using Google Gemini Chat Model)  
  - Google Gemini Chat Model (for AI processing)  
  - Structured Output Parser (to enforce JSON output schema)  
  - Classification Router (Switch node)  
  - Sticky Note (Interior Design Lead Classification Agent)

- **Node Details:**

1. **Google Gemini Chat Model (linked to Classification Agent)**  
   - **Type:** Langchain Google Gemini LLM node  
   - **Role:** Provides natural language understanding and reasoning for classification  
   - **Credentials:** Google PaLM API  
   - **Version:** v1  
   - **Edge Cases:** API limits, latency, or authentication errors

2. **Classification Agent**  
   - **Type:** Langchain Agent node  
   - **Role:** Core AI logic for lead qualification  
   - **Configuration:**  
     - System prompt defines classification rules with detailed criteria for HOT, WARM, and COLD leads  
     - Input template pulls all form fields and embeds them into text for AI context  
     - Outputs structured JSON with fields: lead_classification, confidence, reasoning, key_factors, estimated_project_value, recommended_action, notes  
   - **Edge Cases:**  
     - Ambiguous or missing budget/space data defaults to WARM or COLD as per rules  
     - Complex multi-project types handled conservatively  
   - **Output:** JSON parsed by structured output parser

3. **Structured Output Parser**  
   - **Type:** Langchain Output Parser  
   - **Role:** Validates and extracts structured JSON from AI response using a defined schema  
   - **Edge Cases:** Parsing errors if AI output deviates from schema

4. **Classification Router**  
   - **Type:** Switch node  
   - **Role:** Routes leads into three branches based on classification output: HOT, WARM, COLD  
   - **Configuration:**  
     - Switch conditions exactly match lead_classification string: "HOT", "WARM", "COLD"  
   - **Edge Cases:** Unexpected classification values may cause no routing

---

#### Block 1.3: Classification Routing & Notifications

- **Overview:**  
Sends email notifications to sales team members containing lead details and AI classification results for immediate awareness and action.

- **Nodes Involved:**  
  - Email Notifier (Gmail node)  
  - Sticky Note (Lead Classification Router)  
  - Sticky Note (Sales Team Email Notifier)

- **Node Details:**

1. **Email Notifier**  
   - **Type:** Gmail node (OAuth2)  
   - **Role:** Sends detailed lead summary emails to sales reps  
   - **Configuration:**  
     - Recipient: Uses client email from form data (likely for test/demo; can be adjusted to internal sales emails)  
     - Subject: "POTENTIAL {{ lead_classification }} CLIENT"  
     - Message: Includes classification data (lead_classification, confidence, reasoning, key_factors, etc.) and raw form data fields for reference  
   - **Edge Cases:** Gmail API quota, authentication errors, invalid email addresses

---

#### Block 1.4: Personalized Outreach Email Generation

- **Overview:**  
Generates a tailored client outreach email based on lead classification, intake form data, and AI reasoning, using an AI agent trained for warm, professional communication.

- **Nodes Involved:**  
  - Outreach Email Generator (Langchain Agent with Google Gemini Chat Model)  
  - Structured Output Parser1 (validates email JSON output)  
  - Set Email (sets extracted subject and body into named fields)  
  - Sticky Note (Personalized Client Outreach Email Generator)

- **Node Details:**

1. **Outreach Email Generator**  
   - **Type:** Langchain Agent node  
   - **Role:** Creates personalized email subject lines and body text per lead details  
   - **Configuration:**  
     - System prompt instructs to compose warm, professional, concise emails with clear CTAs  
     - Input includes form data and classification results  
     - Outputs JSON with "subject" and "email_body" fields  
   - **Edge Cases:** AI output format errors, model rate limits

2. **Structured Output Parser1**  
   - **Type:** Langchain Output Parser  
   - **Role:** Parses AI JSON email content, enforces schema correctness

3. **Set Email**  
   - **Type:** Set node  
   - **Role:** Extracts and assigns parsed subject and email body to variables `Email Subject` and `Email body` for downstream processing

---

#### Block 1.5: Human-in-the-Loop Email Approval

- **Overview:**  
Enables a designated team member to review the AI-generated outreach email via Telegram, approving or requesting revision before client delivery.

- **Nodes Involved:**  
  - Human Approval (Telegram node)  
  - Decision Router (If node)  
  - Sticky Note (Human-in-the-Loop Email Approval)  
  - Sticky Note (Approval Decision Router)

- **Node Details:**

1. **Human Approval**  
   - **Type:** Telegram node with "send and wait" operation  
   - **Role:** Sends email subject and body to Telegram chat ID, waits for free-text response ("Approved" or otherwise)  
   - **Configuration:** Message template includes lead type, email subject, and body for full context  
   - **Edge Cases:** Telegram API limits, incorrect chat ID, no response timeout

2. **Decision Router**  
   - **Type:** If node  
   - **Role:** Evaluates human response text for approval keyword (case-insensitive match on "Approved")  
   - **Branches:**  
     - If approved: route to Send to Client  
     - Else: route to Email Revision Agent for corrections

---

#### Block 1.6: Email Revision (if needed)

- **Overview:**  
Processes human feedback to revise the outreach email using AI, preserving personalization and brand voice, then resubmits for approval.

- **Nodes Involved:**  
  - Email Revision Agent (Langchain Agent with Google Gemini Chat Model)  
  - Structured Output Parser2 (validates revised email JSON output)  
  - Set Email (stores revised email output)  
  - Sticky Note (Email Revision Agent)

- **Node Details:**

1. **Email Revision Agent**  
   - **Type:** Langchain Agent node  
   - **Role:** Edits and improves original email based on human revision notes from Telegram  
   - **Input:**  
     - Original email JSON (subject and body)  
     - Human revision notes text  
     - Client form data for context  
   - **Output:** Revised email JSON object with same fields  
   - **Edge Cases:** Ambiguous feedback, formatting errors

2. **Structured Output Parser2**  
   - **Type:** Langchain Output Parser  
   - **Role:** Enforces JSON schema on revised email output

3. **Set Email (second use)**  
   - **Role:** Stores revised email subject and body for further approval

---

#### Block 1.7: Client Email Delivery

- **Overview:**  
Sends the final approved personalized email to the potential client via Gmail.

- **Nodes Involved:**  
  - Send to Client (Gmail node)  
  - Sticky Note (Client Email Delivery)

- **Node Details:**

1. **Send to Client**  
   - **Type:** Gmail node (OAuth2)  
   - **Role:** Sends email to client address from form data  
   - **Configuration:**  
     - Subject and message body taken from the latest approved email version set node  
     - Plain text format without attribution  
   - **Edge Cases:** Email sending failures, invalid client email, Gmail API limits

---

#### Block 1.8: Lead Data Storage

- **Overview:**  
Stores all client intake data and AI classification results in a Notion database for centralized tracking and future analysis.

- **Nodes Involved:**  
  - Store in Notion Database (Notion node)  
  - Sticky Note (Notion Lead Database Manager)

- **Node Details:**

1. **Store in Notion Database**  
   - **Type:** Notion database page create node  
   - **Role:** Adds a new client record with comprehensive details  
   - **Configuration:**  
     - Database ID set to "Clients" database in Notion  
     - Maps all intake form fields, classification result, and submission timestamp to appropriate Notion properties (titles, rich text, select, multi-select, date, email, phone number)  
   - **Edge Cases:** Notion API rate limits, permission errors, data type mismatches

---

### 3. Summary Table

| Node Name                | Node Type                        | Functional Role                             | Input Node(s)              | Output Node(s)               | Sticky Note                                                                                     |
|--------------------------|---------------------------------|---------------------------------------------|----------------------------|-----------------------------|------------------------------------------------------------------------------------------------|
| Form Trigger             | n8n-nodes-base.formTrigger       | Captures client intake form data            | -                          | Classification Agent         | Client Intake Form Trigger: captures lead data from forms and embeds                               |
| Google Gemini Chat Model | Langchain LLM node               | AI model for classification                  | -                          | Classification Agent         |                                                                                                 |
| Classification Agent     | Langchain Agent                  | AI lead classification logic                 | Form Trigger, Google Gemini | Classification Router        | Interior Design Lead Classification Agent: intelligent qualification with detailed rules       |
| Structured Output Parser | Langchain Output Parser          | Parses classification JSON output            | Classification Agent        | Classification Agent         |                                                                                                 |
| Classification Router    | n8n-nodes-base.switch            | Routes leads based on classification         | Classification Agent        | Email Notifier, Outreach Email Generator | Lead Classification Router: routes HOT/WARM/COLD leads accordingly                             |
| Email Notifier           | n8n-nodes-base.gmail             | Emails sales team detailed lead info         | Classification Router       | Outreach Email Generator     | Sales Team Email Notifier: sends detailed lead summaries                                       |
| Outreach Email Generator | Langchain Agent                  | Generates personalized client outreach email | Classification Router       | Structured Output Parser1    | Personalized Client Outreach Email Generator: AI-powered warm, professional emails              |
| Structured Output Parser1| Langchain Output Parser          | Parses generated email JSON                   | Outreach Email Generator    | Set Email                   |                                                                                                 |
| Set Email                | n8n-nodes-base.set               | Stores email subject and body                 | Structured Output Parser1   | Human approval              |                                                                                                 |
| Human approval           | n8n-nodes-base.telegram          | Sends email to human for approval             | Set Email                  | Decision Router             | Human-in-the-Loop Email Approval: Telegram review for quality control                           |
| Decision Router          | n8n-nodes-base.if                | Routes based on approval decision             | Human approval             | Send to Client, Email Revision Agent | Approval Decision Router: routes approved or revision-requested emails                       |
| Email Revision Agent     | Langchain Agent                  | Revises email per human feedback               | Decision Router            | Structured Output Parser2    | Email Revision Agent: AI-based refinement of emails based on reviewer notes                    |
| Structured Output Parser2| Langchain Output Parser          | Parses revised email JSON                      | Email Revision Agent       | Set Email                  |                                                                                                 |
| Set Email (revised)      | n8n-nodes-base.set               | Stores revised email subject and body         | Structured Output Parser2   | Human approval             | Latest Email Version Controller: ensures only final approved email proceeds                    |
| Send to Client           | n8n-nodes-base.gmail             | Sends final approved email to client          | Decision Router            | Store in notion database    | Client Email Delivery: sends warm, personalized emails to clients                             |
| Store in notion database | n8n-nodes-base.notion            | Logs client and classification data to Notion| Send to Client             | -                           | Notion Lead Database Manager: centralized tracking of client leads                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Form Trigger Node**  
   - Type: `formTrigger`  
   - Configure path: `interior-design-form`  
   - Title: "Interior Design Client Intake Questionnaire"  
   - Add fields: first/second name (text, required), contact number (number, required), email (email, required), project address (text, required), project type (multi-select dropdown), spaces included (text, required), estimated project budget (dropdown, required), target completion date (date), style description (text), dislikes (textarea), decision-making involvement (dropdown, required), prior designer experience (checkbox, exact 1 selection), inspiration links (textarea)  
   - Ensure required fields set properly

2. **Add AI Language Model Node (Google Gemini Chat Model)**  
   - Type: `@n8n/n8n-nodes-langchain.lmChatGoogleGemini`  
   - Model: "models/gemini-2.5-pro"  
   - Credentials: Google PaLM API with valid API key

3. **Add Classification Agent Node**  
   - Type: `@n8n/n8n-nodes-langchain.agent`  
   - Input: Form Trigger JSON data, formatted into a multi-line string template with all form fields  
   - System prompt: Use provided detailed classification criteria and instructions for HOT/WARM/COLD lead scoring  
   - Connect AI model node as language model input  
   - Enable structured output with defined JSON schema including lead_classification, confidence, reasoning, key_factors, estimated_project_value, recommended_action, notes

4. **Add Structured Output Parser**  
   - Type: `@n8n/n8n-nodes-langchain.outputParserStructured`  
   - Provide JSON schema example matching classification output  
   - Connect output of Classification Agent to this parser

5. **Add Classification Router (Switch)**  
   - Type: `switch`  
   - Rules: Match `lead_classification` field exactly for "HOT", "WARM", "COLD"  
   - Connect output from Classification Agent via Structured Output Parser

6. **Add Email Notifier (Gmail)**  
   - Type: `gmail` node with OAuth2 credentials  
   - Configure to send to sales team email addresses (or client email for demo)  
   - Subject: "POTENTIAL {{ lead_classification }} CLIENT"  
   - Body: Include detailed classification results and raw intake form data for review

7. **Add Outreach Email Generator (Langchain Agent)**  
   - Type: `@n8n/n8n-nodes-langchain.agent`  
   - System prompt: Use detailed instructions for writing personalized outreach emails based on lead classification and intake data  
   - Input: Include all form fields and classification results  
   - Output: JSON object with "subject" and "email_body" fields  
   - Connect AI model (Google Gemini Chat Model1) as language model input

8. **Add Structured Output Parser1**  
   - For parsing email JSON output with fields `subject` and `email_body`

9. **Add Set Email Node**  
   - Assign `Email Subject` and `Email body` from parsed JSON output fields  
   - Connect output from Structured Output Parser1

10. **Add Human Approval Node (Telegram)**  
    - Type: `telegram` node with "send and wait" operation  
    - Configure with chat ID for human reviewer  
    - Message includes lead classification, email subject, and body from Set Email node

11. **Add Decision Router (If Node)**  
    - Condition: Check if Telegram reply text equals any case-insensitive variant of "Approved"  
    - True branch: connect to Send to Client node  
    - False branch: connect to Email Revision Agent

12. **Add Email Revision Agent (Langchain Agent)**  
    - Inputs: Human revision notes from Telegram, original email JSON, client form data  
    - System prompt: Use detailed instructions for revising emails preserving brand voice and personalization  
    - Output: revised JSON email object with `subject` and `email_body`

13. **Add Structured Output Parser2**  
    - Parse revised email JSON output

14. **Add Set Email Node (revised)**  
    - Store revised email fields for next approval cycle  
    - Connect output of Structured Output Parser2

15. **Connect revised Set Email back to Human Approval node**  
    - Enables iterative human-in-the-loop approval

16. **Add Send to Client Node (Gmail)**  
    - Sends final approved email to client email from form data  
    - Subject and body from Set Email node  
    - Ensure Gmail OAuth2 credentials configured

17. **Add Store in Notion Database Node**  
    - Type: `notion` node, resource: `databasePage`  
    - Database ID: set to your Notion "Clients" database  
    - Map all intake form fields and classification results to corresponding Notion properties (titles, rich text, select, multi-select, date, phone, email)  
    - Connect output of Send to Client node

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                          | Context or Link                                                   |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| Client Intake Form Trigger captures data from embedded website forms and n8n native forms, including contact info, project details, budget, style, and timeline, feeding directly into the AI classifier for instant lead scoring.                                                                                                                                                      | Sticky Note near Form Trigger node                              |
| Interior Design Lead Classification Agent uses a multi-step AI evaluation with strict budget and scope rules to assign HOT, WARM, or COLD scores, providing confidence levels, reasoning, and actionable sales recommendations.                                                                                                                                                        | Sticky Note near Classification Agent                            |
| Lead Classification Router directs leads into distinct workflows, ensuring sales resources match lead urgency and value—HOT leads get priority, WARM leads standard follow-up, COLD leads nurturing sequences.                                                                                                                                                                        | Sticky Note near Classification Router                          |
| Sales Team Email Notifier delivers comprehensive lead reports to sales staff for immediate action, including AI reasoning and client details.                                                                                                                                                                                                                                        | Sticky Note near Email Notifier                                 |
| Personalized Client Outreach Email Generator creates tailored emails emphasizing client understanding, style preferences, and timeline, adjusting tone by lead type to maximize engagement and conversion.                                                                                                                                                                            | Sticky Note near Outreach Email Generator                       |
| Human-in-the-Loop Email Approval via Telegram ensures quality control of AI-generated emails, requiring explicit approval before sending to clients.                                                                                                                                                                                                                                 | Sticky Notes near Human Approval and Decision Router            |
| Email Revision Agent refines outreach emails per human feedback, maintaining brand voice while addressing specific reviewer notes, and loops back for re-approval.                                                                                                                                                                                                                   | Sticky Note near Email Revision Agent                           |
| Client Email Delivery node sends final approved emails to clients, completing the automated outreach cycle.                                                                                                                                                                                                                                                                           | Sticky Note near Send to Client node                            |
| Notion Lead Database Manager logs all client intake and classification data into Notion for centralized CRM, pipeline management, and analytics.                                                                                                                                                                                                                                     | Sticky Note near Store in Notion node                           |
| Workflow uses Google Gemini (PaLM) LLM via Langchain nodes for AI processing, and Gmail OAuth2 for email sending. Credentials must be securely configured with API keys and OAuth tokens.                                                                                                                                                                                            | Credential references in AI and Gmail nodes                     |
| The workflow enforces strict classification rules, including hard stops for budget under 100,000 AED and single-space projects, ensuring qualification accuracy and sales efficiency. Comprehensive system prompts and JSON schemas maintain consistent AI outputs for automation and human review.                                                                                   | Classification Agent System Message                             |
| Email generation and revision system prompts include detailed instructions for tone, length, personalization, and call-to-action, differentiated by lead classification to optimize client engagement and conversion rates.                                                                                                                                                            | Outreach Email Generator and Email Revision Agent System Messages|

---

**Disclaimer:** The content analyzed and described here originates exclusively from an n8n automated workflow. All processes comply with current content policies and handle only lawful, public data.