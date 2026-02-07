Analyze Customer Feedback with Azure GPT-4, Jira Tasks & Outlook Reports from Monday.com

https://n8nworkflows.xyz/workflows/analyze-customer-feedback-with-azure-gpt-4--jira-tasks---outlook-reports-from-monday-com-9836


# Analyze Customer Feedback with Azure GPT-4, Jira Tasks & Outlook Reports from Monday.com

### 1. Workflow Overview

This workflow automates the processing and analysis of customer feedback collected from Monday.com boards, applying AI-driven classification and sentiment analysis via Azure GPT-4. It generates actionable Jira tasks for the product team based on priority scoring, logs feedback data into Google Sheets for analytics, and sends weekly summary reports via Outlook email. The workflow includes error handling to notify administrators on failure.

**Target Use Cases:**  
- Companies wishing to automate customer feedback triage and reporting  
- Product teams needing prioritized Jira tasks from qualitative data  
- Business analysts requiring structured feedback data and historical tracking  
- Customer success managers wanting weekly executive summaries  

**Logical Blocks:**  
- **1.1 Trigger and Data Retrieval:** Scheduled trigger and Monday.com feedback fetch  
- **1.2 Data Normalization:** Standardization of raw Monday.com data fields  
- **1.3 AI-Based Analysis:** Azure OpenAI GPT-4 classification and sentiment analysis  
- **1.4 Data Structuring & Scoring:** Formatting AI output and calculating business impact score  
- **1.5 Jira Task Creation:** Creating Jira issues for high-impact feedback  
- **1.6 Data Logging:** Appending feedback data into Google Sheets  
- **1.7 Reporting:** Generating and sending weekly HTML email reports via Outlook  
- **1.8 Error Handling:** Workflow error detection and email alerting  

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger and Data Retrieval

**Overview:**  
Starts the workflow every Monday at 9:00 AM and fetches all customer feedback entries from a specified Monday.com board group.

**Nodes Involved:**  
- Weekly Schedule Trigger  
- Fetch Monday.com Feedback  

**Node Details:**  

- **Weekly Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Workflow initiator based on cron schedule  
  - Configuration: Runs every Monday at 09:00 AM (cron expression `0 9 * * 1`)  
  - Outputs to: Fetch Monday.com Feedback  
  - Edge cases: Scheduler misconfiguration, time zone issues  

- **Fetch Monday.com Feedback**  
  - Type: Monday.com API node  
  - Role: Retrieves all board items from Monday.com group `topics`  
  - Configuration:  
    - `boardId`: placeholder `"YOUR_BOARD_ID"` must be replaced  
    - `groupId`: `"topics"` (ensure group matches your board)  
    - Returns all items (`returnAll: true`)  
  - Credentials: Monday.com API configured  
  - Outputs to: Normalize Feedback Fields  
  - Failure types: API auth errors, rate limits, invalid board/group IDs  

---

#### 1.2 Data Normalization

**Overview:**  
Extracts relevant columns from raw Monday.com feedback items and maps them into consistent field names.

**Nodes Involved:**  
- Normalize Feedback Fields  

**Node Details:**  

- **Normalize Feedback Fields**  
  - Type: Set node  
  - Role: Extracts and renames columns for downstream processing  
  - Configuration:  
    - Maps Monday.com JSON structure fields to:  
      - Title (feedback text)  
      - Account Name  
      - ARR (Annual Recurring Revenue)  
      - NPS Before, NPS After  
      - Feedback Type  
      - Contact Email  
      - Submitted On (date)  
  - Uses expressions to access JSON path fields like `$json.column_values[index].text`  
  - Inputs from: Fetch Monday.com Feedback  
  - Outputs to: AI Theme Classifier (main output), Merge AI Results with Feedback (secondary output)  
  - Edge cases: Missing or malformed column values, indexing errors  

---

#### 1.3 AI-Based Analysis

**Overview:**  
Uses Azure OpenAI GPT-4 to classify feedback into themes, label them, and detect sentiment in structured JSON format.

**Nodes Involved:**  
- Azure OpenAI Chat Model1  
- AI Theme Classifier  
- Conversation Memory Buffer  
- Structured JSON Output Parser  
- Merge AI Results with Feedback  

**Node Details:**  

- **Azure OpenAI Chat Model1**  
  - Type: Langchain Azure OpenAI node  
  - Role: Executes GPT-4o model for AI text generation  
  - Configuration: Model set to `"gpt-4o"`  
  - Credentials: Azure OpenAI API configured  
  - Outputs to: AI Theme Classifier (as language model input)  
  - Failure types: API quota limits, auth errors, network timeouts  

- **AI Theme Classifier**  
  - Type: Langchain Agent node  
  - Role: Sends normalized feedback JSON to GPT-4 with prompt to classify theme key, label, and sentiment  
  - Configuration:  
    - Prompt includes examples and strict JSON-only output requirement  
    - Output parsed by Structured JSON Output Parser  
  - Inputs from: Normalize Feedback Fields (main input), Azure OpenAI Chat Model1 (language model), Conversation Memory Buffer (memory), Structured JSON Output Parser (output parser)  
  - Outputs to: Merge AI Results with Feedback  
  - Edge cases: Unexpected AI output, malformed JSON, prompt failure  

- **Conversation Memory Buffer**  
  - Type: Langchain Memory Buffer Window  
  - Role: Provides context window of last 7 classification interactions per day  
  - Configuration: Session key based on date (`"feedback_classification_" + date`)  
  - Feeds AI Theme Classifier with memory context  

- **Structured JSON Output Parser**  
  - Type: Langchain output parser  
  - Role: Parses AI response into structured JSON according to schema with keys `theme_key`, `theme_label`, and `sentiment`  

- **Merge AI Results with Feedback**  
  - Type: Merge node  
  - Role: Combines normalized feedback data with AI classification results by their position in the input arrays  
  - Inputs from: Normalize Feedback Fields (secondary output) and AI Theme Classifier output  
  - Outputs to: Structure AI Classification Output  

---

#### 1.4 Data Structuring & Scoring

**Overview:**  
Formats the merged AI and feedback data for numeric processing and calculates a business impact score prioritizing feedback items.

**Nodes Involved:**  
- Structure AI Classification Output  
- Calculate Business Impact Score  

**Node Details:**  

- **Structure AI Classification Output**  
  - Type: Set node  
  - Role: Converts string fields to numbers and restructures JSON with combined data  
  - Configuration:  
    - Converts ARR, NPS Before/After to numbers  
    - Preserves AI output theme and sentiment fields  
    - Preserves original feedback text  
  - Inputs from: Merge AI Results with Feedback  
  - Outputs to: Calculate Business Impact Score  

- **Calculate Business Impact Score**  
  - Type: Set node  
  - Role: Calculates weighted impact score using formula:  
    - 50% weight on normalized ARR (divided by 50,000)  
    - 30% weight on NPS stability (inverse of absolute NPS change scaled over 10)  
    - 20% weight on sentiment severity (negative=1, neutral=0.5, positive=0.2)  
  - Outputs to:  
    - Create Jira Task for Feedback  
    - Log to Google Sheets  
    - Generate HTML Report  

---

#### 1.5 Jira Task Creation

**Overview:**  
Creates Jira tasks for each feedback item with detailed metadata for product team prioritization.

**Nodes Involved:**  
- Create Jira Task for Feedback  

**Node Details:**  

- **Create Jira Task for Feedback**  
  - Type: Jira node  
  - Role: Creates new Jira issues  
  - Configuration:  
    - Project ID placeholder `"YOUR_PROJECT_ID"` must be replaced  
    - Issue type set to Task (ID `10006`)  
    - Summary formed as `"Theme: [theme_label] ([theme_key])"`  
    - Description includes feedback, ARR, sentiment, NPS before/after, impact score, and labels  
  - Credentials: Jira Software Cloud credentials configured  
  - Inputs from: Calculate Business Impact Score  
  - Edge cases: Jira API auth errors, invalid project/issue type IDs, rate limits  

---

#### 1.6 Data Logging

**Overview:**  
Appends or updates processed feedback entries into a Google Sheet for analytics and historical tracking.

**Nodes Involved:**  
- Log to Google Sheets  

**Node Details:**  

- **Log to Google Sheets**  
  - Type: Google Sheets node  
  - Role: Appends or updates rows in a specified Google Sheet  
  - Configuration:  
    - Document ID placeholder `"YOUR_SHEET_ID"` must be replaced  
    - Sheet name set to `"gid=0"` corresponding to "Customer Feedback" sheet  
    - Auto-maps columns based on `"theme_key"` for update or append  
  - Credentials: Google Sheets OAuth2  
  - Inputs from: Calculate Business Impact Score  
  - Failure types: OAuth token expiration, permission errors, sheet not found, column mismatch  

---

#### 1.7 Reporting

**Overview:**  
Generates a weekly HTML report summarizing customer feedback metrics and sends it via Outlook email.

**Nodes Involved:**  
- Generate HTML Report  
- Send a message  

**Node Details:**  

- **Generate HTML Report**  
  - Type: Code node (JavaScript)  
  - Role: Processes all feedback items of the week to compute:  
    - Total ARR  
    - Sentiment counts (positive, neutral, negative)  
    - NPS improvements or declines  
    - Critical issues (high ARR or NPS drop and negative sentiment)  
    - Customer wins (positive sentiment with NPS improvement)  
  - Builds a styled HTML email body including executive summary, key metrics, critical issues, and wins sections  
  - Outputs subject and body content for email  
  - Inputs from: Calculate Business Impact Score (triggered for all feedback items)  
  - Edge cases: Large data sets may affect performance, malformed data entries  

- **Send a message**  
  - Type: Microsoft Outlook node  
  - Role: Sends the generated HTML report email  
  - Configuration:  
    - To recipient placeholder `"YOUR_EMAIL@example.com"` must be replaced  
    - Subject and body content taken from previous node's output  
    - Body content type set to HTML  
  - Credentials: Microsoft Outlook OAuth2  
  - Inputs from: Generate HTML Report  
  - Failure types: OAuth errors, SMTP issues, invalid recipient address  

---

#### 1.8 Error Handling

**Overview:**  
Catches any workflow error and sends an alert email with details for quick troubleshooting.

**Nodes Involved:**  
- On Workflow Error  
- Send Error Alert Email  

**Node Details:**  

- **On Workflow Error**  
  - Type: Error Trigger  
  - Role: Activated when any node in the workflow fails  
  - Outputs to: Send Error Alert Email  

- **Send Error Alert Email**  
  - Type: Gmail node  
  - Role: Sends an error notification email  
  - Configuration:  
    - Recipient email set via environment variable `ERROR_ALERT_EMAIL`  
    - Email subject includes workflow name  
    - Body includes workflow name, execution ID, failed node name, error message, and timestamp  
  - Credentials: Gmail OAuth2  
  - Edge cases: Missing or invalid environment variable, Gmail auth failures  

---

### 3. Summary Table

| Node Name                      | Node Type                        | Functional Role                      | Input Node(s)                      | Output Node(s)                   | Sticky Note                                                                                   |
|--------------------------------|---------------------------------|------------------------------------|----------------------------------|---------------------------------|------------------------------------------------------------------------------------------------|
| Workflow Overview              | Sticky Note                     | Documentation overview              | -                                | -                               | ## 📊 Customer Feedback Intelligence Workflow (Detailed purpose, features, data flow, schedule) |
| Setup: Data Source             | Sticky Note                     | Instructions for data fetch setup  | -                                | -                               | ## Step 1: Fetch Feedback Data (Setup instructions for Monday.com boardId, API credentials)     |
| Fetch Monday.com Feedback      | Monday.com API                  | Retrieve all feedback items         | Weekly Schedule Trigger           | Normalize Feedback Fields         |                                                                                            |
| Setup: Data Normalization      | Sticky Note                     | Instructions for normalization     | -                                | -                               | ## Step 2: Normalize Data (Mapped fields explanation)                                         |
| Normalize Feedback Fields      | Set                            | Standardize feedback fields         | Fetch Monday.com Feedback         | AI Theme Classifier, Merge AI Results with Feedback |                                                                                            |
| Setup: AI Analysis             | Sticky Note                     | AI classification setup            | -                                | -                               | ## Step 3: AI Theme Classification (Azure OpenAI config, model, output format)                 |
| Azure OpenAI Chat Model1       | Langchain Azure OpenAI          | Runs GPT-4 model                   | AI Theme Classifier (ai_languageModel) | AI Theme Classifier             |                                                                                            |
| AI Theme Classifier            | Langchain Agent                 | Classify theme and sentiment       | Normalize Feedback Fields, Azure OpenAI Chat Model1, Conversation Memory Buffer, Structured JSON Output Parser | Merge AI Results with Feedback |                                                                                            |
| Conversation Memory Buffer     | Langchain Memory Buffer Window  | Provides AI classification context | -                                | AI Theme Classifier (ai_memory) |                                                                                            |
| Structured JSON Output Parser  | Langchain Output Parser          | Parses AI JSON response             | -                                | AI Theme Classifier (ai_outputParser) |                                                                                            |
| Merge AI Results with Feedback | Merge                          | Combines AI and feedback data      | Normalize Feedback Fields, AI Theme Classifier | Structure AI Classification Output |                                                                                            |
| Setup: Data Structuring        | Sticky Note                     | Instructions for data structuring  | -                                | -                               | ## Step 3b: Structure AI Output (Extract numbers, prepare data for impact scoring)            |
| Structure AI Classification Output | Set                        | Format combined data with numeric types | Merge AI Results with Feedback    | Calculate Business Impact Score   |                                                                                            |
| Setup: Impact Scoring          | Sticky Note                     | Instructions for impact score calc | -                                | -                               | ## Step 3c: Calculate Impact Score (Weighted formula explanation)                            |
| Calculate Business Impact Score| Set                            | Compute priority score              | Structure AI Classification Output | Create Jira Task for Feedback, Log to Google Sheets, Generate HTML Report |                                                                                            |
| Setup: Jira Integration        | Sticky Note                     | Jira issue creation setup          | -                                | -                               | ## Step 4: Create Jira Issues (Project ID and issue type config instructions)                 |
| Create Jira Task for Feedback  | Jira                           | Creates Jira tasks from feedback   | Calculate Business Impact Score   | -                               |                                                                                            |
| Setup: Data Logging            | Sticky Note                     | Google Sheets logging setup        | -                                | -                               | ## Step 5: Log to Google Sheets (Sheet ID and OAuth2 config instructions)                     |
| Log to Google Sheets           | Google Sheets                  | Append/update feedback in Sheets   | Calculate Business Impact Score   | -                               |                                                                                            |
| Setup: Email Reports           | Sticky Note                     | Weekly report generation setup     | -                                | -                               | ## Step 6: Weekly Email Report (Outlook OAuth2, recipient config instructions)                |
| Generate HTML Report           | Code (JavaScript)              | Formats weekly summary HTML email  | Calculate Business Impact Score   | Send a message                  |                                                                                            |
| Send a message                 | Microsoft Outlook              | Sends weekly report email          | Generate HTML Report              | -                               |                                                                                            |
| Setup: Schedule               | Sticky Note                     | Cron schedule explanation          | -                                | -                               | ## Trigger: Weekly Schedule (Cron details)                                                   |
| Setup: Error Alerts            | Sticky Note                     | Error alert email setup            | -                                | -                               | ## Error Handling (Env var and Gmail OAuth2 setup)                                           |
| On Workflow Error              | Error Trigger                  | Catches workflow execution errors  | -                                | Send Error Alert Email           |                                                                                            |
| Send Error Alert Email         | Gmail                          | Sends error notification email     | On Workflow Error                | -                               |                                                                                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Configure Cron expression: `0 9 * * 1` (Every Monday at 9 AM)  
   - Name: `Weekly Schedule Trigger`  

3. **Add Monday.com node:**  
   - Type: Monday.com  
   - Operation: Get All Board Items  
   - Resource: `boardItem`  
   - Board ID: Replace `"YOUR_BOARD_ID"` with your Monday.com board ID  
   - Group ID: `"topics"` (adjust if your board groups differ)  
   - Credentials: Set up Monday.com API credentials  
   - Connect `Weekly Schedule Trigger` output to this node input  

4. **Add Set node for data normalization:**  
   - Name: `Normalize Feedback Fields`  
   - Map fields from Monday.com item JSON:  
     - Title: `={{ $json.name }}`  
     - Account Name: `={{ $json.column_values[1].text }}`  
     - ARR(USD): `={{ $json.column_values[2].text }}`  
     - NPS Before: `={{ $json.column_values[3].text }}`  
     - NPS After: `={{ $json.column_values[4].text }}`  
     - FeedBack Type: `={{ $json.column_values[5].text }}`  
     - Contact Email: `={{ $json.column_values[6].text }}`  
     - Submitted On: `={{ $json.column_values[7].text }}`  
   - Connect Monday.com node output to this node  

5. **Add Langchain Azure OpenAI node:**  
   - Name: `Azure OpenAI Chat Model1`  
   - Model: `gpt-4o`  
   - Credentials: Configure Azure OpenAI API credentials  
   - Connect to next AI classifier node  

6. **Add Langchain Agent node:**  
   - Name: `AI Theme Classifier`  
   - Prompt: Include instructions and examples to classify feedback into a JSON with keys `theme_key`, `theme_label`, `sentiment`  
   - Use the normalized feedback JSON as input (via expression)  
   - Integrate AI output parser and memory buffer nodes as inputs for structured response and context  
   - Connect `Normalize Feedback Fields` (main), `Azure OpenAI Chat Model1` (language model), `Conversation Memory Buffer` (memory), `Structured JSON Output Parser` (output parser) to this node  

7. **Add Conversation Memory Buffer node:**  
   - Name: `Conversation Memory Buffer`  
   - Session Key: `="feedback_classification_" + $now.format('yyyy-MM-dd')`  
   - Context window length: 7 entries  

8. **Add Structured JSON Output Parser node:**  
   - Configure with JSON schema expecting `theme_key`, `theme_label`, `sentiment`  

9. **Add Merge node:**  
   - Name: `Merge AI Results with Feedback`  
   - Mode: Combine  
   - Combination mode: Merge by Position  
   - Connect `Normalize Feedback Fields` (secondary output) and `AI Theme Classifier` (main output)  

10. **Add Set node to structure AI output:**  
    - Name: `Structure AI Classification Output`  
    - JSON output mode with code converting ARR, NPS values to numbers and combining AI classification fields with original feedback text  

11. **Add Set node to calculate impact score:**  
    - Name: `Calculate Business Impact Score`  
    - Formula:  
      ```
      (0.5 * (arr_usd / 50000)) + 
      (0.3 * ((10 - abs(nps_after - nps_before)) / 10)) + 
      (0.2 * (sentiment == 'negative' ? 1 : sentiment == 'neutral' ? 0.5 : 0.2))
      ```  
    - Assign result to `impact_score` field  

12. **Add Jira node to create tasks:**  
    - Name: `Create Jira Task for Feedback`  
    - Configure with your Jira project ID and issue type (Task)  
    - Map summary as `Theme: {{theme_label}} ({{theme_key}})`  
    - Description includes feedback details, ARR, sentiment, NPS, impact score, and labels  
    - Credentials: Jira Software Cloud API  

13. **Add Google Sheets node to log feedback:**  
    - Name: `Log to Google Sheets`  
    - Operation: Append or Update  
    - Document ID: Replace `"YOUR_SHEET_ID"` with your Google Sheet ID  
    - Sheet name: `"gid=0"` or your target sheet name  
    - Map columns with auto mapping, matching on `"theme_key"`  
    - Credentials: Google Sheets OAuth2  

14. **Add Code node to generate HTML report:**  
    - Name: `Generate HTML Report`  
    - Insert JavaScript code to summarize feedback data, count sentiments, identify critical issues and wins, and format a professional HTML email body with styling  
    - Output JSON with `subject` and `body` fields  

15. **Add Microsoft Outlook node to send email:**  
    - Name: `Send a message`  
    - Configure with your Outlook OAuth2 credentials  
    - Set recipient email (`toRecipients`) to your desired address, replacing placeholder  
    - Use inputs for `subject` and `bodyContent` from previous node, set `bodyContentType` to HTML  

16. **Error Handling:**  
    - Add Error Trigger node named `On Workflow Error`  
    - Add Gmail node named `Send Error Alert Email`  
    - Configure Gmail OAuth2 credentials  
    - Set recipient email via environment variable `ERROR_ALERT_EMAIL`  
    - Compose email body with workflow name, execution ID, node name, error message, and timestamp  
    - Connect Error Trigger to Gmail node  

17. **Connect all nodes according to data flow:**  
    - Schedule Trigger → Fetch Monday.com Feedback → Normalize Feedback Fields  
    - Normalize Feedback Fields → AI Theme Classifier (main)  
    - Normalize Feedback Fields → Merge AI Results with Feedback (secondary)  
    - AI Theme Classifier → Merge AI Results with Feedback  
    - Merge AI Results with Feedback → Structure AI Classification Output → Calculate Business Impact Score  
    - Calculate Business Impact Score → Create Jira Task for Feedback, Log to Google Sheets, Generate HTML Report  
    - Generate HTML Report → Send a message  

18. **Validate all credentials are correctly configured and tested before activating workflow.**

---

### 5. General Notes & Resources

| Note Content | Context or Link |
|--------------|-----------------|
| Workflow runs every Monday at 9:00 AM by default, adjust cron as needed in the Schedule Trigger node. | Scheduling instructions in Setup: Schedule sticky note. |
| Replace all placeholder IDs and email addresses (`YOUR_BOARD_ID`, `YOUR_PROJECT_ID`, `YOUR_SHEET_ID`, `YOUR_EMAIL@example.com`) with your actual values before running. | Setup sticky notes across workflow. |
| The AI prompt is designed to enforce strict JSON-only output to prevent parsing errors. | Setup: AI Analysis sticky note and AI Theme Classifier node. |
| Error alerts require environment variable `ERROR_ALERT_EMAIL` to be set for recipient address. | Setup: Error Alerts sticky note. |
| Jira issue type "Task" uses ID `10006` by default; verify in your Jira instance if different. | Setup: Jira Integration sticky note. |
| Google Sheets must have matching columns for auto-mapping based on `theme_key`. | Setup: Data Logging sticky note. |
| The HTML report includes executive summary, key metrics, critical issues, and customer wins, styled for Outlook compatibility. | Setup: Email Reports sticky note. |
| For more on Monday.com API usage, refer to: https://monday.com/developers/v2/ | External resource for API reference. |
| Azure OpenAI GPT-4 model requires separate subscription and API key; see https://azure.microsoft.com/en-us/products/cognitive-services/openai-service/ | Azure OpenAI documentation. |
| Jira Software Cloud API documentation: https://developer.atlassian.com/cloud/jira/software/rest/ | Jira API reference. |
| Google Sheets API and OAuth2 setup guide: https://developers.google.com/sheets/api/guides/authorizing | Google Sheets docs. |
| Microsoft Outlook OAuth2 setup: https://docs.microsoft.com/en-us/graph/auth-v2-user | Outlook API docs. |

---

This completes the detailed analysis and documentation of the "AI-Driven Feedback Classification and Reporting from Monday.com and Jira to Outlook" workflow.