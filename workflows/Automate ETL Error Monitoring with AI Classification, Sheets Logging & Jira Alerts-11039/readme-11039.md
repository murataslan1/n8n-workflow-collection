Automate ETL Error Monitoring with AI Classification, Sheets Logging & Jira Alerts

https://n8nworkflows.xyz/workflows/automate-etl-error-monitoring-with-ai-classification--sheets-logging---jira-alerts-11039


# Automate ETL Error Monitoring with AI Classification, Sheets Logging & Jira Alerts

### 1. Workflow Overview

This workflow automates the monitoring and alerting of ETL (Extract, Transform, Load) job failures by integrating AI-based error classification, logging to Google Sheets, and alerting via Jira and Slack. Its main purpose is to streamline the detection, categorization, documentation, and notification of ETL errors, enabling teams to respond quickly and maintain data pipeline health.

Logical blocks:

- **1.1 Input Reception**: Receive ETL failure logs via webhook.
- **1.2 Error Preparation & AI Classification**: Extract key error details, create log previews, and classify error severity using an AI agent.
- **1.3 Parsing AI Output & Data Preparation**: Parse AI JSON output and prepare data for logging and alerts.
- **1.4 Data Logging**: Append structured error data to Google Sheets for tracking.
- **1.5 Issue Creation & Alerting**: Create Jira issues for critical/high errors and send notifications through Slack and email.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block starts the workflow by receiving ETL failure error logs through a webhook endpoint.

**Nodes Involved:**  
- Get ETL Error  
- Prepare ETL Logs  
- Sticky Note (comment)

**Node Details:**

- **Get ETL Error**  
  - *Type:* Webhook  
  - *Role:* Receives POST requests with ETL failure logs at path `/etl-failure`.  
  - *Config:* HTTP method POST; response mode set to last node.  
  - *Input/Output:* Triggers workflow on request; outputs raw error log JSON to next node.  
  - *Failures:* Invalid or missing POST data; webhook misconfiguration.

- **Prepare ETL Logs**  
  - *Type:* Function  
  - *Role:* Extracts and summarizes relevant fields from raw ETL logs; creates a 2000-character preview of the log and generates a URL link to the full log file.  
  - *Key Logic:* Extracts `job_id`, `pipeline_name`, `error_message`, creates `logPreview` substring, and constructs `fullLogLink` URL.  
  - *Input:* Output from webhook node.  
  - *Output:* JSON with summarized log data.  
  - *Failures:* Input missing expected fields; malformed log content.  

- **Sticky Note**  
  - *Content:* "Starts the workflow whenever a new ETL error log is received."  
  - *Role:* Documentation aid only.

---

#### 1.2 Error Preparation & AI Classification

**Overview:**  
This block uses AI to analyze the error message and log preview to classify severity, root cause, and actionable recommendations.

**Nodes Involved:**  
- AI Severity Classification  
- OpenAI Chat Model  
- Sticky Note4 (comment)

**Node Details:**

- **AI Severity Classification**  
  - *Type:* Langchain Agent (AI agent)  
  - *Role:* Uses GPT-4.1-mini model to analyze the error details and classify severity, ticket creation necessity, root cause, summary, and recommendation in a strict JSON format.  
  - *Config:* Prompt instructs to return only pure JSON with fields like severity, should_create_ticket, root_cause, summary, recommendation. Severity levels follow defined rules.  
  - *Input:* Error message and log preview from "Prepare ETL Logs".  
  - *Output:* JSON string with AI classification.  
  - *Failures:* AI response is not valid JSON; API failures; incorrect or ambiguous input data.

- **OpenAI Chat Model**  
  - *Type:* Langchain OpenAI Language Model  
  - *Role:* Provides the GPT-4.1-mini language model instance for the AI Severity Classification agent.  
  - *Config:* Uses OpenAI API credentials.  
  - *Input/Output:* Connects to AI Severity Classification node as the language model provider.

- **Sticky Note4**  
  - *Content:* Describes the step's function: extracting error details, creating previews and links, AI analysis, and structuring output fields.

---

#### 1.3 Parsing AI Output & Data Preparation

**Overview:**  
This block parses the AI’s JSON output and prepares the complete dataset by combining original log data and AI classification results for logging and alerts.

**Nodes Involved:**  
- Parse Output  
- Prepare Data for logging  
- Sticky Note3 (comment)

**Node Details:**

- **Parse Output**  
  - *Type:* Code  
  - *Role:* Parses raw JSON string returned by AI model into structured JSON fields.  
  - *Code Logic:* Tries to JSON.parse the AI output; if fails, returns an error object.  
  - *Input:* AI Severity Classification raw JSON string.  
  - *Output:* Parsed JSON or error JSON.  
  - *Failures:* Invalid JSON from AI; expression errors.

- **Prepare Data for logging**  
  - *Type:* Set  
  - *Role:* Aggregates fields from "Prepare ETL Logs" and parsed AI output into a unified data object containing job_id, pipeline_name, severity, root_cause, summary, recommendation, and fullLogLink.  
  - *Input:* Output of Parse Output and Prepare ETL Logs nodes.  
  - *Output:* Fully prepared data object for logging and alerting.  
  - *Failures:* Missing fields due to prior node failure.

- **Sticky Note3**  
  - *Content:* Explains these steps save and report issues by organizing details and creating Jira tickets if needed.

---

#### 1.4 Data Logging

**Overview:**  
This block appends the prepared ETL error data into a Google Sheets spreadsheet for persistent tracking.

**Nodes Involved:**  
- store ETL logs  
- Sticky Note3 (comment, shared with previous block)

**Node Details:**

- **store ETL logs**  
  - *Type:* Google Sheets  
  - *Role:* Appends a new row into a specific Google Sheet tab with columns job_id, pipeline_name, severity, root_cause, summary, recommendation, and fullLogLink.  
  - *Config:* Uses OAuth2 credentials; auto-maps input data to column schema; target sheet and document IDs predefined.  
  - *Input:* Data from "Prepare Data for logging".  
  - *Output:* Confirmation of append.  
  - *Failures:* Credential issues; sheet access denied; schema mismatch.

---

#### 1.5 Issue Creation & Alerting

**Overview:**  
This block creates Jira issues for critical/high severity ETL errors and sends notifications to Slack and email to alert the team.

**Nodes Involved:**  
- Create Jira Task  
- ETL Failure Alert (Slack)  
- ETL Failure Notify (Gmail)  
- Sticky Note1, Sticky Note2 (comments)

**Node Details:**

- **Create Jira Task**  
  - *Type:* Jira  
  - *Role:* Creates a Jira issue in a predefined project with summary, description including job ID, error message, log preview, AI summary and recommendation, and a link to full logs.  
  - *Config:* Uses Jira Software Cloud API credentials; project and issue type set; description fields use expressions from prior nodes.  
  - *Input:* Output from "store ETL logs".  
  - *Output:* Newly created Jira issue key and metadata.  
  - *Failures:* Jira API authentication errors; invalid project or issue type; rate limits.

- **ETL Failure Alert (Slack)**  
  - *Type:* Slack  
  - *Role:* Sends a Slack message to a specific channel notifying about the ETL failure, including pipeline name, job ID, severity, summary, and Jira ticket link.  
  - *Config:* Webhook ID configured; channel selected; message text contains dynamic expressions from "Prepare Data for logging" and Jira issue key.  
  - *Input:* Output from "Create Jira Task".  
  - *Failures:* Slack webhook or token errors; message formatting issues.

- **ETL Failure Notify (Gmail)**  
  - *Type:* Gmail  
  - *Role:* Sends an email alert to a designated address with critical ETL failure details and Jira ticket link.  
  - *Config:* OAuth2 Gmail credentials; plain text email with dynamic expressions for pipeline name, job ID, summary, and Jira ticket link.  
  - *Input:* Output from "Create Jira Task".  
  - *Failures:* Gmail OAuth expiration; quota limits; invalid recipient email.

- **Sticky Note1**  
  - *Content:* "Sends a Slack message to notify the team about the issue."

- **Sticky Note2**  
  - *Content:* "Sends an email with full error details to the team."

---

### 3. Summary Table

| Node Name               | Node Type                       | Functional Role                                  | Input Node(s)           | Output Node(s)                  | Sticky Note                                                                                  |
|-------------------------|--------------------------------|-------------------------------------------------|-------------------------|--------------------------------|----------------------------------------------------------------------------------------------|
| Get ETL Error           | Webhook                        | Receive ETL error logs to trigger workflow       | —                       | Prepare ETL Logs               | Starts the workflow whenever a new ETL error log is received.                               |
| Prepare ETL Logs        | Function                      | Extract and summarize log details, create preview | Get ETL Error           | AI Severity Classification     |                                                                                                |
| AI Severity Classification | Langchain Agent (AI)          | Analyze error log, classify severity and cause   | Prepare ETL Logs         | Parse Output                   | Analyze & Classify the Error: steps extract details, create preview, classify with AI       |
| OpenAI Chat Model       | Langchain OpenAI Model         | Provide GPT-4.1-mini model for AI classification | — (used by AI node)      | AI Severity Classification     |                                                                                                |
| Parse Output            | Code                          | Parse AI JSON output into structured data        | AI Severity Classification | Prepare Data for logging       | Save & Report the Issue: organize error details, save to Sheets, create Jira if needed       |
| Prepare Data for logging | Set                           | Aggregate original and AI data for logging/alerts| Parse Output             | store ETL logs                |                                                                                                |
| store ETL logs          | Google Sheets                 | Append error data row to Google Sheets            | Prepare Data for logging | Create Jira Task               |                                                                                                |
| Create Jira Task        | Jira                          | Create Jira ticket for critical/high issues       | store ETL logs           | ETL Failure Alert, ETL Failure Notify |                                                                                                |
| ETL Failure Alert       | Slack                         | Notify team on Slack about ETL failure             | Create Jira Task         | —                              | Sends a Slack message to notify the team about the issue.                                   |
| ETL Failure Notify      | Gmail                         | Send email alert with full error details           | Create Jira Task         | —                              | Sends an email with full error details to the team.                                         |
| Sticky Note             | Sticky Note                   | Documentation                                      | —                       | —                              | Starts the workflow whenever a new ETL error log is received.                               |
| Sticky Note1            | Sticky Note                   | Documentation                                      | —                       | —                              | Sends a Slack message to notify the team about the issue.                                  |
| Sticky Note2            | Sticky Note                   | Documentation                                      | —                       | —                              | Sends an email with full error details to the team.                                        |
| Sticky Note3            | Sticky Note                   | Documentation                                      | —                       | —                              | Save & Report the Issue: organize error, save to Sheets, create Jira ticket                 |
| Sticky Note4            | Sticky Note                   | Documentation                                      | —                       | —                              | Analyze & Classify the Error: extract details, AI classify, structure output                |
| Sticky Note5            | Sticky Note                   | Documentation                                      | —                       | —                              | Explanation of workflow and setup steps                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node: "Get ETL Error"**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `etl-failure`  
   - Response Mode: Last node  
   - Purpose: Receive incoming ETL failure logs as JSON payload.

2. **Add Function Node: "Prepare ETL Logs"**  
   - Extract `job_id`, `pipeline_name`, `error_message` from webhook JSON payload (`$json.body`).  
   - Create a `logPreview` substring of the first 2000 characters of the log field.  
   - Construct a URL `fullLogLink` based on job_id (e.g., `https://s3.amazonaws.com/full-log/{job_id}.log`).  
   - Output object with these fields.

3. **Add Langchain OpenAI Model Node: "OpenAI Chat Model"**  
   - Select GPT-4.1-mini model (or equivalent).  
   - Configure OpenAI API credentials.

4. **Add Langchain Agent Node: "AI Severity Classification"**  
   - Connect to "Prepare ETL Logs" output.  
   - Use the "OpenAI Chat Model" as its language model.  
   - Configure prompt with instructions to analyze error_message and logPreview, returning pure JSON with keys: severity, should_create_ticket, root_cause, summary, recommendation.  
   - Strictly enforce JSON-only response.

5. **Add Code Node: "Parse Output"**  
   - Input: Raw string output from AI Severity Classification.  
   - Use JS code to parse JSON safely. If parse fails, output error object.

6. **Add Set Node: "Prepare Data for logging"**  
   - Combine fields from "Prepare ETL Logs" and parsed AI output.  
   - Assign job_id, pipeline_name, severity, root_cause, summary, recommendation, fullLogLink into output JSON.

7. **Add Google Sheets Node: "store ETL logs"**  
   - Operation: Append  
   - Document: Select or create Google Sheet for ETL logs.  
   - Sheet: Select or create a specific sheet/tab (e.g., "ETL log").  
   - Map columns for job_id, pipeline_name, severity, root_cause, summary, recommendation, fullLogLink.  
   - Configure Google Sheets OAuth2 credentials.

8. **Add Jira Node: "Create Jira Task"**  
   - Project: Select target Jira project.  
   - Issue Type: Bug or task (e.g., 10003).  
   - Summary: Format as `[ETL FAILED] {{pipeline_name}}`.  
   - Description: Include job_id, error_message, logPreview, AI summary, recommendation, full log link.  
   - Connect to Jira Software Cloud credentials.

9. **Add Slack Node: "ETL Failure Alert"**  
   - Send message to designated Slack channel.  
   - Content includes pipeline_name, job_id, severity, summary, and Jira ticket URL.  
   - Configure Slack API credentials and webhook/channel.

10. **Add Gmail Node: "ETL Failure Notify"**  
    - Recipient: designated email (e.g., mobile1.wli@gmail.com).  
    - Subject: Critical ETL Failure with pipeline name.  
    - Message body: Include pipeline_name, job_id, summary, and Jira ticket link.  
    - Configure Gmail OAuth2 credentials.

11. **Connect Nodes in Order:**  
    - Get ETL Error → Prepare ETL Logs → AI Severity Classification (linked to OpenAI Chat Model) → Parse Output → Prepare Data for logging → store ETL logs → Create Jira Task → ETL Failure Alert & ETL Failure Notify

12. **Add Sticky Notes for Documentation:**  
    - Add descriptive sticky notes near each logical block to clarify function and usage.

13. **Testing & Validation:**  
    - Test the webhook by sending sample ETL failure payloads.  
    - Validate AI classification correctness and JSON parsing.  
    - Check Google Sheets row creation.  
    - Confirm Jira ticket creation and Slack/email notifications.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Context or Link                                                                                         |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| This workflow is designed to fully automate ETL error handling by connecting error logs, AI classification, persistent logging, and team alerting through Jira and Slack. It reduces manual overhead and speeds up incident response.                                                                                                                                                                                                                                                                                                                        | Workflow Purpose                                                                                        |
| Setup requires valid credentials for OpenAI API, Google Sheets (OAuth2), Jira Software Cloud, Slack API, and Gmail OAuth2. Ensure these are configured before enabling the workflow.                                                                                                                                                                                                                                                                                                                                                                           | Credential Setup                                                                                        |
| The AI prompt is carefully crafted to enforce pure JSON response without formatting or markdown, ensuring smooth downstream parsing. Incorrect AI responses can cause parsing errors.                                                                                                                                                                                                                                                                                                                                                                        | AI Prompt Design                                                                                       |
| Links to full logs are constructed assuming logs are stored on AWS S3 with a consistent URL pattern. Adjust the URL template if logs are hosted elsewhere.                                                                                                                                                                                                                                                                                                                                                                                                     | Log Link Construction                                                                                   |
| Slack notifications include a direct clickable link to the Jira ticket for quick access. The email alert is plain text for compatibility and includes critical info and the Jira link.                                                                                                                                                                                                                                                                                                                                                                        | Notification Content                                                                                     |
| For further customization, users can update the AI prompt with additional rules or keywords relevant to their ETL pipelines, or modify Google Sheets columns to track more data.                                                                                                                                                                                                                                                                                                                                                                             | Customization Suggestions                                                                               |
| The workflow is inactive by default; enable it once all credentials and mappings are verified.                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Workflow Activation                                                                                      |
| Workflow inspired by industry best practices for incident management and integrates AI for intelligent error triage.                                                                                                                                                                                                                                                                                                                                                                                                                                        | Project Credits                                                                                        |
| For more on n8n and AI integration workflows, visit: https://n8n.io/blog/ai-automation-workflows                                                                                                                                                                                                                                                                                                                                                                                                                                                           | External Resource                                                                                       |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is lawful and public.