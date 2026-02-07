Automate Peer Review Assignments with Sonar Pro AI & Multi-Channel Deadline Reminders

https://n8nworkflows.xyz/workflows/automate-peer-review-assignments-with-sonar-pro-ai---multi-channel-deadline-reminders-10312


# Automate Peer Review Assignments with Sonar Pro AI & Multi-Channel Deadline Reminders

### 1. Workflow Overview

This workflow automates the process of peer review assignment evaluation using AI-powered analysis and manages multi-channel deadline reminders for reviewers. It targets educators and training coordinators who manage peer assessments, enabling them to automate assignment submission intake, AI-based technical evaluation, reviewer notification via Teams, Discord, and email, as well as deadline monitoring and reminders.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Data Extraction**: Receives assignment submissions via webhook, extracts relevant submission data, and reads the submitted assignment PDF.
- **1.2 AI-Powered Evaluation**: Uses a LangChain conversational AI agent with a custom prompt to evaluate engineering assignments based on detailed technical criteria.
- **1.3 Evaluation Storage & Peer Reviewer Preparation**: Parses the AI evaluation output, stores results in Google Sheets, splits peer reviewers for individual notifications, and creates personalized evaluation templates.
- **1.4 Multi-Channel Reviewer Notification**: Sends notification messages to reviewers through Microsoft Teams, Discord, and email, including evaluation templates and deadlines.
- **1.5 Deadline Monitoring & Reminders**: Periodically checks review deadlines from Google Sheets, filters assignments with approaching deadlines, and sends reminder notifications across Teams, Discord, and email.
- **1.6 Workflow Control & Response**: Supports manual and scheduled triggers for deadline checks and responds to webhook submissions with a summary JSON confirming workflow initiation.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Data Extraction

- **Overview:**  
  This block receives peer review assignment submissions via a webhook, extracts key metadata fields, and reads the assignment content from an uploaded PDF file for AI evaluation.

- **Nodes Involved:**  
  - Webhook - Assignment Submission  
  - Extract Submission Data  
  - Read Assignment File

- **Node Details:**

  1. **Webhook - Assignment Submission**  
     - *Type:* Webhook (HTTP POST listener)  
     - *Role:* Entry point accepting incoming assignment submission data via POST request  
     - *Configuration:* HTTP POST method, path set to `engineering-peer-eval`, responds with a node-based response  
     - *Input/Output:* Receives JSON body with fields like `student_id`, `assignment_file` (binary), `course_code`, `assignment_title`, `peer_reviewers`, `deadline`  
     - *Potential Failures:* Missing fields in payload, invalid file upload, webhook endpoint unreachable

  2. **Extract Submission Data**  
     - *Type:* Set node  
     - *Role:* Extracts and maps submission fields into well-defined JSON properties for later use  
     - *Configuration:* Assigns values from webhook JSON body to fields such as `student_id`, `assignment_file`, `course_code`, `assignment_title`, `peer_reviewers`, `deadline`  
     - *Expressions:* Uses expressions like `{{$json.body.student_id}}` to pull data dynamically  
     - *Input/Output:* Takes webhook JSON input, outputs structured data for PDF reading node  
     - *Edge Cases:* Null or malformed fields, missing binary data for PDF

  3. **Read Assignment File**  
     - *Type:* Read PDF node  
     - *Role:* Extracts text content from the uploaded assignment PDF file  
     - *Configuration:* Uses the binary property named dynamically from extracted submission data (`{{$json.assignment_file}}`)  
     - *Input/Output:* Reads PDF binary input, outputs extracted text content for AI evaluation  
     - *Failures:* Corrupt or unreadable PDF files, empty documents

#### 2.2 AI-Powered Evaluation

- **Overview:**  
  This block performs an AI-driven evaluation of the assignment content using a LangChain conversational AI agent configured with engineering-specific grading criteria.

- **Nodes Involved:**  
  - AI Evaluation - Technical Criteria  
  - Structured Output Parser  
  - OpenRouter Chat Model

- **Node Details:**

  1. **AI Evaluation - Technical Criteria**  
     - *Type:* LangChain Agent node  
     - *Role:* Sends assignment text to AI for detailed scoring and feedback based on engineering criteria  
     - *Configuration:* Defines a prompt with weighted criteria including Technical Accuracy, Problem-Solving, Documentation, Analysis, and Code Quality  
     - *Variables:* Injects extracted assignment text as `{{$json.data}}` in prompt, system message establishes expert evaluator persona  
     - *Output:* Structured JSON with scores, strengths, improvement areas, overall summary  
     - *Potential Issues:* API rate limiting, malformed AI response, prompt injection risks, timeout

  2. **Structured Output Parser**  
     - *Type:* LangChain Structured Output Parser  
     - *Role:* Parses AI agent’s textual output into structured JSON format for downstream processing  
     - *Input/Output:* Takes AI text output, outputs parsed JSON data with grading breakdown  
     - *Failures:* Parsing errors if AI output is malformed or unexpected

  3. **OpenRouter Chat Model**  
     - *Type:* LangChain OpenRouter LM Chat node  
     - *Role:* Provides the language model backend ("perplexity/sonar-pro") for AI evaluation agent  
     - *Credentials:* Requires OpenRouter API key credential  
     - *Potential Failures:* Credential expiry, API errors, model unavailability

#### 2.3 Evaluation Storage & Peer Reviewer Preparation

- **Overview:**  
  Stores the AI evaluation results with metadata, splits the list of peer reviewers for individualized processing, and constructs personalized evaluation templates for each reviewer.

- **Nodes Involved:**  
  - Store Evaluation Results  
  - Split Peer Reviewers  
  - Create Evaluation Template  
  - Save to Google Sheets - Grading

- **Node Details:**

  1. **Store Evaluation Results**  
     - *Type:* Set node  
     - *Role:* Combines submission data with AI evaluation output, timestamps the evaluation, and prepares data for storage and notifications  
     - *Configuration:* Assigns fields like student ID, course code, AI evaluation JSON, evaluation date (ISO timestamp), total score, peer reviewers, deadline  
     - *Input:* Parsed AI evaluation results and extracted submission data  
     - *Output:* Structured evaluation record for downstream nodes

  2. **Split Peer Reviewers**  
     - *Type:* Split Out node  
     - *Role:* Splits the `peer_reviewers` array into individual items for sending personalized notifications  
     - *Input:* Evaluation record containing peer_reviewers list  
     - *Output:* One item per reviewer for parallel processing  
     - *Edge Cases:* Empty or null peer reviewer arrays

  3. **Create Evaluation Template**  
     - *Type:* Set node  
     - *Role:* Builds a detailed textual evaluation template per reviewer with assignment info, criteria descriptions, AI preliminary scores, strengths, improvement areas, and submission deadline  
     - *Configuration:* Uses expressions to dynamically insert assignment details and AI evaluation data  
     - *Output:* Reviewer-specific evaluation form content ready to send  
     - *Failures:* Missing reviewer email or incomplete evaluation data

  4. **Save to Google Sheets - Grading**  
     - *Type:* Google Sheets node  
     - *Role:* Appends a new row to a Google Sheet tracking peer evaluations with status, scores, analysis, and metadata  
     - *Configuration:* Maps multiple columns like status, student_id, course_code, AI scores per criterion, evaluation date, assignment title  
     - *Credentials:* Requires Google Sheets access with appropriate permissions  
     - *Failures:* Google API quota limits, network errors, sheet or document ID misconfiguration

#### 2.4 Multi-Channel Reviewer Notification

- **Overview:**  
  Sends notifications to peer reviewers through Microsoft Teams, Discord, and email, including assignment details, AI preliminary scores, and evaluation templates.

- **Nodes Involved:**  
  - Send Teams Notification  
  - Send Discord Notification  
  - Send Email with Template

- **Node Details:**

  1. **Send Teams Notification**  
     - *Type:* Microsoft Teams node  
     - *Role:* Posts a message to reviewers’ Teams channels notifying them of their peer evaluation assignment  
     - *Configuration:* Uses the message resource, message content includes assignment title, student ID, deadline, and AI score  
     - *Credentials:* Microsoft Teams OAuth2 credentials required  
     - *Failures:* Unauthorized access, incorrect webhook URL, Teams API errors

  2. **Send Discord Notification**  
     - *Type:* Discord node  
     - *Role:* Sends a notification message tagging the reviewer’s email (assumed linked to Discord user) with assignment and deadline info  
     - *Configuration:* Content includes an @mention, assignment details, AI preliminary score, and instructions  
     - *Credentials:* Discord bot token or webhook URL needed  
     - *Edge Cases:* Reviewer Discord ID mismatch, channel or guild misconfiguration

  3. **Send Email with Template**  
     - *Type:* Email Send node  
     - *Role:* Sends a detailed email to each reviewer containing the peer evaluation form and submission instructions  
     - *Configuration:* Subject dynamically includes assignment title, from email fixed as `course-admin@engineering.edu`, to email set to reviewer’s address  
     - *Failures:* SMTP server errors, invalid email addresses, spam filtering

#### 2.5 Deadline Monitoring & Reminders

- **Overview:**  
  Periodically triggered block that checks for peer review assignments with deadlines approaching within 48 hours and sends reminder notifications via Teams, Discord, and email.

- **Nodes Involved:**  
  - Manual Trigger  
  - Schedule Trigger  
  - Check Review Deadlines  
  - Filter Approaching Deadlines  
  - Send Deadline Reminder - Teams  
  - Send Deadline Reminder - Discord  
  - Send Deadline Reminder - Email

- **Node Details:**

  1. **Manual Trigger** and **Schedule Trigger**  
     - *Type:* Trigger nodes  
     - *Role:* Manual trigger allows on-demand execution; schedule trigger runs every 24 hours to check deadlines  
     - *Configuration:* Schedule trigger set to 24-hour interval  
     - *Output:* Starts the deadline checking process

  2. **Check Review Deadlines**  
     - *Type:* Google Sheets node (read)  
     - *Role:* Reads rows with status "Pending Peer Review" from the Peer Evaluations sheet  
     - *Configuration:* Uses filter for `status = "Pending Peer Review"`  
     - *Output:* Lists pending assignments with deadlines

  3. **Filter Approaching Deadlines**  
     - *Type:* Filter node  
     - *Role:* Filters assignments whose deadlines are less than 48 hours (172,800,000 ms) away but not overdue  
     - *Conditions:* `(deadline_timestamp - now) < 172800000` AND `(deadline_timestamp - now) > 0`  
     - *Failures:* Time zone misalignment, malformed dates

  4. **Send Deadline Reminder - Teams, Discord, Email**  
     - *Types:* Microsoft Teams, Discord, Email nodes respectively  
     - *Role:* Sends deadline reminder messages to reviewers via all three channels  
     - *Content:* Assignment title, student ID, deadline, reminder note urging prompt review  
     - *Credentials:* Same as notification nodes above  
     - *Edge Cases:* Network failures, incorrect recipient IDs, email bounces

#### 2.6 Workflow Control & Response

- **Overview:**  
  Finalizes the workflow by responding to the initial webhook submission with a JSON summary and provides sticky notes with documentation and use cases.

- **Nodes Involved:**  
  - Webhook Response  
  - Sticky Note  
  - Sticky Note1

- **Node Details:**

  1. **Webhook Response**  
     - *Type:* Respond to Webhook node  
     - *Role:* Sends JSON response confirming workflow initiation with details such as student ID, assignment, AI score, number of reviewers notified, and deadline  
     - *Output:* Structured JSON for client confirmation  
     - *Failures:* Empty or missing data if prior nodes fail

  2. **Sticky Note** and **Sticky Note1**  
     - *Type:* Sticky Note nodes  
     - *Role:* Provide detailed workflow documentation, use cases, customization tips, benefits, and setup instructions within the n8n editor canvas  
     - *Content:*  
       - Sticky Note: Introduction, workflow steps, setup prerequisites  
       - Sticky Note1: Use cases, customization options, benefits  
     - *No input/output connections*; purely informational  

---

### 3. Summary Table

| Node Name                     | Node Type                          | Functional Role                                   | Input Node(s)                  | Output Node(s)                                      | Sticky Note                                                                                         |
|-------------------------------|----------------------------------|-------------------------------------------------|-------------------------------|----------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Manual Trigger                | Manual Trigger                   | Manual start for deadline check                  |                               | Check Review Deadlines                             |                                                                                                   |
| Schedule Trigger             | Schedule Trigger                 | Scheduled start every 24h for deadline check    |                               | Check Review Deadlines                             |                                                                                                   |
| Webhook - Assignment Submission | Webhook                         | Receives assignment submission via HTTP POST    |                               | Extract Submission Data                            |                                                                                                   |
| Extract Submission Data       | Set                             | Extracts and maps submission data                | Webhook - Assignment Submission| Read Assignment File                               |                                                                                                   |
| Read Assignment File          | Read PDF                        | Extracts text from uploaded assignment PDF       | Extract Submission Data         | AI Evaluation - Technical Criteria                  |                                                                                                   |
| AI Evaluation - Technical Criteria | LangChain Agent               | Performs AI-based assignment evaluation          | Read Assignment File            | Store Evaluation Results                            |                                                                                                   |
| Structured Output Parser      | LangChain Output Parser         | Parses AI evaluation output into structured JSON| AI Evaluation - Technical Criteria | AI Evaluation - Technical Criteria (output parser) |                                                                                                   |
| Store Evaluation Results      | Set                             | Combines AI evaluation with submission metadata | AI Evaluation - Technical Criteria | Split Peer Reviewers, Save to Google Sheets - Grading |                                                                                                   |
| Split Peer Reviewers          | Split Out                      | Splits peer reviewers array for individual notifications | Store Evaluation Results       | Create Evaluation Template                          |                                                                                                   |
| Create Evaluation Template    | Set                             | Builds personalized evaluation templates         | Split Peer Reviewers            | Send Teams Notification, Send Discord Notification, Send Email with Template |                                                                                                   |
| Send Teams Notification       | Microsoft Teams                 | Notifies reviewers via Microsoft Teams           | Create Evaluation Template      |                                                    |                                                                                                   |
| Send Discord Notification     | Discord                        | Notifies reviewers via Discord                     | Create Evaluation Template      |                                                    |                                                                                                   |
| Send Email with Template      | Email Send                     | Emails evaluation template to reviewers           | Create Evaluation Template      | Webhook Response                                   |                                                                                                   |
| Save to Google Sheets - Grading | Google Sheets                 | Stores evaluation data in grading spreadsheet    | Store Evaluation Results        |                                                    |                                                                                                   |
| Check Review Deadlines        | Google Sheets                  | Reads peer evaluations with status pending       | Manual Trigger, Schedule Trigger | Filter Approaching Deadlines                       |                                                                                                   |
| Filter Approaching Deadlines  | Filter                        | Filters assignments with deadlines <48h away     | Check Review Deadlines          | Send Deadline Reminder - Teams, Discord, Email    |                                                                                                   |
| Send Deadline Reminder - Teams| Microsoft Teams                 | Sends deadline reminders via Teams                | Filter Approaching Deadlines    |                                                    |                                                                                                   |
| Send Deadline Reminder - Discord | Discord                      | Sends deadline reminders via Discord              | Filter Approaching Deadlines    |                                                    |                                                                                                   |
| Send Deadline Reminder - Email| Email Send                    | Sends deadline reminders via email                | Filter Approaching Deadlines    |                                                    |                                                                                                   |
| Webhook Response             | Respond to Webhook             | Sends JSON confirmation to webhook submission     | Send Email with Template        |                                                    |                                                                                                   |
| Sticky Note                  | Sticky Note                   | Workflow introduction and setup instructions      |                               |                                                    | ## Introduction\nAutomate peer review assignment and grading with AI-powered evaluation...        |
| Sticky Note1                 | Sticky Note                   | Use cases, customization, and benefits            |                               |                                                    | ## Use Cases\n- University peer review assignments\n- Corporate training evaluations...           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Webhook Node**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `engineering-peer-eval`  
   - Response Mode: Response Node  
   - Purpose: Receive assignment submission with fields: `student_id`, `assignment_file` (binary), `course_code`, `assignment_title`, `peer_reviewers` (array), `deadline`

2. **Add a Set Node to Extract Submission Data**  
   - Map the webhook body fields to new JSON properties:  
     - `student_id` = `{{$json.body.student_id}}`  
     - `assignment_file` = `{{$json.body.assignment_file}}` (binary)  
     - `course_code`, `assignment_title`, `peer_reviewers`, `deadline` similarly mapped

3. **Add a Read PDF Node**  
   - Binary Property Name: `{{$json.assignment_file}}`  
   - Purpose: Extract text content from uploaded assignment PDF

4. **Set Up LangChain Conversational Agent Node for AI Evaluation**  
   - Use node type: `@n8n/n8n-nodes-langchain.agent`  
   - Prompt: Detailed engineering evaluation criteria with 5 scoring categories  
   - Inject extracted PDF text as `{{$json.data}}` in prompt  
   - System Message: Persona of expert engineering educator  
   - Attach an output parser node (structured output parser) to parse AI response JSON  
   - Configure language model node: OpenRouter Chat Model with the `perplexity/sonar-pro` model and OpenRouter API credentials

5. **Add a Set Node to Store Evaluation Results**  
   - Assign: student ID, course code, assignment title, AI evaluation JSON output, current ISO timestamp as evaluation date, total score, peer reviewers, deadline  
   - Inputs: AI evaluation parsed output and extracted submission data

6. **Add a Split Out Node to Split Peer Reviewers**  
   - Field to split: `peer_reviewers` array from stored evaluation results

7. **Add a Set Node to Create Evaluation Template Per Reviewer**  
   - Compose an evaluation template string with placeholders for course code, assignment title, student ID, reviewer email, deadline, AI preliminary scores, strengths, and areas for improvement  
   - Include detailed evaluation criteria descriptions  
   - Use expressions to dynamically insert data from stored evaluation results and current reviewer

8. **Add Notification Nodes to Alert Reviewers**  
   - Microsoft Teams Node: Send message with assignment details and AI score  
   - Discord Node: Send message tagging reviewer email with assignment and deadline info  
   - Email Send Node: Email the evaluation template to reviewers using `course-admin@engineering.edu` as sender

9. **Add Google Sheets Node to Save Evaluation Data**  
   - Operation: Append  
   - Sheet Name: `Peer Evaluations`  
   - Document ID: Your Google Sheets document ID  
   - Map columns: status ("Pending Peer Review"), AI scores per criterion, student ID, course code, evaluation date, assignment title, analysis, documentation, problem solving, implementation

10. **Create Triggers for Deadline Monitoring**  
    - Manual Trigger for on-demand checks  
    - Schedule Trigger set to run every 24 hours

11. **Add Google Sheets Node to Read Evaluations with Status Pending**  
    - Filter rows where `status = "Pending Peer Review"`

12. **Add Filter Node to Select Assignments with Deadlines < 48 Hours but Not Passed**  
    - Condition: `(deadline_timestamp - now) < 172800000` and `(deadline_timestamp - now) > 0`

13. **Add Deadline Reminder Notifications**  
    - Microsoft Teams Node: Send reminder message with assignment title, student ID, deadline  
    - Discord Node: Send reminder message with same content  
    - Email Send Node: Send email reminder with subject including assignment title, from `course-admin@engineering.edu`

14. **Add Respond to Webhook Node**  
    - Respond with JSON containing status, message, student ID, assignment title, AI total score, number of peer reviewers notified, and deadline

15. **Add Sticky Notes in Canvas**  
    - One for Introduction and Setup Instructions  
    - One for Use Cases, Benefits, and Customization Tips

---

### 5. General Notes & Resources

| Note Content | Context or Link |
|--------------|-----------------|
| Automate peer review assignment and grading with AI-powered evaluation. Designed for educators managing collaborative assessments efficiently. | Workflow introduction sticky note |
| Use cases include university peer review assignments, corporate training evaluations, and research paper assessments. | Sticky note on use cases and benefits |
| Requires OpenAI or OpenRouter API key, Gmail account for email sending, Microsoft Teams and Discord credentials for notifications, and Google Sheets for data storage. | Setup instructions in introduction sticky note |
| Customizable for multi-round review cycles, custom scoring algorithms, and LMS integrations such as Canvas or Moodle. | Use cases sticky note |
| Benefits include elimination of manual distribution, consistent evaluation, and instant feedback with analytics. | Use cases sticky note |

---

**Disclaimer:**  
The content provided is derived solely from an automated n8n workflow. It complies with all relevant content policies and does not contain illegal, offensive, or protected material. All processed data is legal and publicly accessible.