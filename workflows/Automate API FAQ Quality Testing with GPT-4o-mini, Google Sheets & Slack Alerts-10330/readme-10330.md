Automate API FAQ Quality Testing with GPT-4o-mini, Google Sheets & Slack Alerts

https://n8nworkflows.xyz/workflows/automate-api-faq-quality-testing-with-gpt-4o-mini--google-sheets---slack-alerts-10330


# Automate API FAQ Quality Testing with GPT-4o-mini, Google Sheets & Slack Alerts

### 1. Workflow Overview

This workflow automates the quality testing of API-related FAQ entries stored in a Google Sheets document. Using GPT-4o-mini via Azure OpenAI, it evaluates each FAQ’s completeness, clarity, technical accuracy, and actionability, returning scores and improvement suggestions. Results are logged back into Google Sheets, with aggregated performance tracked historically. Alerts are sent via Slack for any FAQs scoring below defined thresholds, followed by an email summary upon completion.

Logical blocks in the workflow:

- **1.1 Input Reception and Configuration**: Manual trigger starts the process, and configuration parameters (sheet IDs, thresholds, batch size, Slack channel) are set.
- **1.2 Data Retrieval and Validation**: FAQ data is fetched from a Google Sheet and validated/cleaned to remove empty or malformed entries.
- **1.3 AI Evaluation**: Each FAQ is processed by a LangChain AI agent using GPT-4o-mini to score and evaluate the answer quality.
- **1.4 Result Parsing and Enrichment**: AI output is parsed (with error handling), enriched with severity labels based on thresholds, and timestamped.
- **1.5 Result Storage**: Detailed evaluation results are appended to a “Results” sheet; aggregated summary metrics are generated and saved to a “History” sheet.
- **1.6 Alerting and Notifications**: If critical or warning-level issues are detected, a Slack alert is sent, and finally, a Gmail email summarizes the run completion.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Configuration

- **Overview:** Initiates the workflow manually and sets all necessary parameters and credentials required for downstream nodes.
- **Nodes Involved:**  
  - When clicking ‘Execute workflow’ (Manual Trigger)  
  - ⚙️ Configuration1 (Set node)  
  - 📋 Workflow Overview1 (Sticky Note)  
  - Section: Data Input (Sticky Note)  
  - Section: AI Evaluation (Sticky Note)  
  - Section: Storage (Sticky Note)  
  - Section: Alerts (Sticky Note)
  
- **Node Details:**

  - **When clicking ‘Execute workflow’**  
    - Type: Manual trigger  
    - Role: Starts the workflow on-demand  
    - Config: No parameters, triggers workflow run  
    - Inputs: None  
    - Outputs: → ⚙️ Configuration1  
    - Failures: None expected

  - **⚙️ Configuration1**  
    - Type: Set node  
    - Role: Defines all static or dynamic configuration parameters including Google Sheet ID, scoring thresholds, Slack channel, batch size, sheet names, and a run ID timestamp.  
    - Configuration highlights:  
      - `sheet_id`: Google Sheet document ID (must be replaced by user)  
      - Thresholds: critical=5, warning=7, good=8  
      - Slack channel ID: provided for alerts  
      - Batch size: 10 (controls processing granularity if batching used)  
      - Run ID: dynamically generated timestamp, e.g. 20231123-153045  
    - Inputs: Manual Trigger  
    - Outputs: → 📖 Fetch FAQs1  
    - Failures: If misconfigured (e.g., missing sheet ID), downstream nodes will fail

  - **Sticky Notes** (📋 Workflow Overview1, Section: Data Input, Section: AI Evaluation, Section: Storage, Section: Alerts)  
    - Type: Sticky Notes  
    - Role: Documentation and visual guidance for users  
    - Content: Descriptions of block purposes and instructions  
    - No inputs or outputs

---

#### 1.2 Data Retrieval and Validation

- **Overview:** Fetches the FAQ data from the specified Google Sheet and validates entries by removing empty rows or headers, standardizing question and answer fields for processing.
- **Nodes Involved:**  
  - 📖 Fetch FAQs1 (Google Sheets)  
  - 🔍 Validate & Clean Data1 (Code node)  
  
- **Node Details:**

  - **📖 Fetch FAQs1**  
    - Type: Google Sheets node  
    - Role: Reads all rows from the sheet named in config (`TestSet` by default)  
    - Configuration: Uses OAuth2 Google Sheets credentials; dynamic sheet name and document ID from config variables  
    - Inputs: From ⚙️ Configuration1  
    - Outputs: → 🔍 Validate & Clean Data1  
    - Failures: Authentication errors, invalid sheet ID, or missing sheet cause failure

  - **🔍 Validate & Clean Data1**  
    - Type: Code node (JavaScript)  
    - Role: Filters and cleans raw data rows; removes header and invalid rows; extracts question and answer fields with fallback handling; enriches with config data  
    - Key expressions:  
      - Skips rows with missing or empty question or answer  
      - Adds metadata: row number, run ID, thresholds, batch size  
      - Throws error if no valid FAQ entries found  
    - Inputs: From 📖 Fetch FAQs1  
    - Outputs: → 🤖 AI Evaluator1  
    - Failures: Throws error if no valid entries, which stops workflow

---

#### 1.3 AI Evaluation

- **Overview:** Uses GPT-4o-mini via LangChain Azure OpenAI node to evaluate each FAQ entry against defined criteria and return a JSON with score and feedback.
- **Nodes Involved:**  
  - 🤖 AI Evaluator1 (LangChain agent node)  
  - Azure OpenAI1 (Language model node)  
  
- **Node Details:**

  - **🤖 AI Evaluator1**  
    - Type: LangChain Agent node  
    - Role: Prepares prompt and calls AI model for evaluation  
    - Configuration:  
      - Prompt includes FAQ question and answer, requesting a JSON output with score and detailed evaluation on completeness, clarity, accuracy, actionability  
      - System message guides AI to be an objective technical documentation reviewer  
    - Inputs: From 🔍 Validate & Clean Data1  
    - Outputs: → 📊 Parse & Enrich Results1  
    - Failures: AI downtime, malformed AI responses, prompt errors

  - **Azure OpenAI1**  
    - Type: LangChain LM Chat Azure OpenAI node  
    - Role: Executes GPT-4o-mini calls with temperature 0.3 and max tokens 500  
    - Credentials: Azure OpenAI API  
    - Inputs: From 🤖 AI Evaluator1 (ai_languageModel connection)  
    - Outputs: Back to 🤖 AI Evaluator1 for further processing  
    - Failures: API rate limits, auth errors, timeouts

---

#### 1.4 Result Parsing and Enrichment

- **Overview:** Parses the AI’s JSON output string safely, applies severity labels based on configurable thresholds, and prepares enriched results with timestamps for storage and alerting.
- **Nodes Involved:**  
  - 📊 Parse & Enrich Results1 (Code node)  
  
- **Node Details:**

  - **📊 Parse & Enrich Results1**  
    - Type: Code node (JavaScript)  
    - Role:  
      - Parses AI JSON output even if wrapped in markdown code block  
      - Assigns severity: critical (<5), warning (<7), acceptable (<8), good (≥8)  
      - Adds severity emoji (🔴, ⚠️, 🟡, ✅)  
      - Flags entries needing attention if below warning threshold  
      - Adds timestamps in ISO and localized string  
      - Handles parsing errors by assigning score=0 and marking severity as error  
    - Inputs: From 🤖 AI Evaluator1  
    - Outputs: → 💾 Save Detailed Results1  
    - Failures: JSON parse failure handled gracefully; logs error; no workflow stop

---

#### 1.5 Result Storage

- **Overview:** Saves detailed evaluation results to the “Results” Google Sheet, generates a summary report with aggregated statistics, saves summary to “History” sheet, and prepares data for alerting.
- **Nodes Involved:**  
  - 💾 Save Detailed Results1 (Google Sheets append)  
  - 📈 Generate Summary Report1 (Code node)  
  - 📊 Save to History1 (Google Sheets append)  
  
- **Node Details:**

  - **💾 Save Detailed Results1**  
    - Type: Google Sheets node  
    - Role: Appends detailed evaluation results (score, explanation, strengths, improvements, severity, timestamps) to “Results” sheet  
    - Configuration: Dynamic sheet name and document ID from config  
    - Inputs: From 📊 Parse & Enrich Results1  
    - Outputs: → 📈 Generate Summary Report1  
    - Failures: Sheet access errors, quota exceeded

  - **📈 Generate Summary Report1**  
    - Type: Code node (JavaScript)  
    - Role: Calculates overall statistics including average score, max/min, pass rate, counts by severity level, overall status (CRITICAL, NEEDS_ATTENTION, HEALTHY), and extracts top 3 lowest scoring FAQs  
    - Returns a JSON summary object with text for alerts and downstream consumption  
    - Inputs: From 💾 Save Detailed Results1  
    - Outputs: → 📊 Save to History1  
    - Failures: Empty input array handled with error JSON returned

  - **📊 Save to History1**  
    - Type: Google Sheets node  
    - Role: Appends aggregated metrics and status from summary to “History” sheet for trend tracking  
    - Inputs: From 📈 Generate Summary Report1  
    - Outputs: → ⚠️ Check if Alerts Needed1  
    - Failures: Same as other Google Sheets nodes

---

#### 1.6 Alerting and Notifications

- **Overview:** Evaluates if alerts are needed based on summary flags, sends Slack alerts if so, then sends a completion summary email regardless of alert presence.
- **Nodes Involved:**  
  - ⚠️ Check if Alerts Needed1 (If node)  
  - 💬 Send Slack Alert1 (Slack node)  
  - ✅ Completion Summary1 (Set node)  
  - Send a message1 (Gmail node)  
  
- **Node Details:**

  - **⚠️ Check if Alerts Needed1**  
    - Type: If node  
    - Role: Checks boolean flag `needs_alert` from summary (true if critical/warning found)  
    - Inputs: From 📊 Save to History1  
    - Outputs:  
      - True branch → 💬 Send Slack Alert1 → ✅ Completion Summary1  
      - False branch → ✅ Completion Summary1 (skips Slack alert)  
    - Failures: None expected

  - **💬 Send Slack Alert1**  
    - Type: Slack node  
    - Role: Sends formatted alert message to configured Slack channel summarizing critical/warning counts and linking to the Google Sheet  
    - Configuration: Uses Slack webhook credentials, channel ID from config  
    - Inputs: From ⚠️ Check if Alerts Needed1 (true branch)  
    - Outputs: → ✅ Completion Summary1  
    - Failures: Slack API errors, webhook misconfiguration

  - **✅ Completion Summary1**  
    - Type: Set node  
    - Role: Prepares final completion message summarizing run ID, total FAQs, average score, pass rate, notes alert presence, and Google Sheet link  
    - Inputs: From ⚠️ Check if Alerts Needed1 or Slack node  
    - Outputs: → Send a message1  
    - Failures: None expected

  - **Send a message1**  
    - Type: Gmail node  
    - Role: Sends an email to configured recipient with completion summary message  
    - Credentials: Gmail OAuth2 account  
    - Inputs: From ✅ Completion Summary1  
    - Outputs: None (end of workflow)  
    - Failures: Gmail auth errors, quota exceeded

---

### 3. Summary Table

| Node Name                 | Node Type                         | Functional Role                              | Input Node(s)              | Output Node(s)                     | Sticky Note                                                                                                                        |
|---------------------------|----------------------------------|----------------------------------------------|----------------------------|-----------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                  | Initiates workflow manually                   | None                       | ⚙️ Configuration1                  |                                                                                                                                   |
| ⚙️ Configuration1          | Set                              | Sets config params (sheet IDs, thresholds)   | When clicking ‘Execute workflow’ | 📖 Fetch FAQs1                    |                                                                                                                                   |
| 📋 Workflow Overview1      | Sticky Note                      | Documentation overview                        | None                       | None                              | ## How it works... (full workflow description and setup steps)                                                                    |
| Section: Data Input        | Sticky Note                      | Describes data input block                    | None                       | None                              | ## 📥 Data Input: Fetches FAQ data from Google Sheets and validates it before processing.                                         |
| Section: AI Evaluation     | Sticky Note                      | Describes AI evaluation block                 | None                       | None                              | ## 🤖 AI Evaluation: Scores each FAQ using GPT-4o-mini based on completeness, clarity, technical accuracy, and actionability.     |
| Section: Storage           | Sticky Note                      | Describes results storage block               | None                       | None                              | ## 💾 Results Storage: Saves detailed scores to Results sheet and aggregated metrics to History sheet for trend tracking.          |
| Section: Alerts            | Sticky Note                      | Describes alerting block                       | None                       | None                              | ## 📢 Notifications: Sends Slack alerts when critical or warning-level issues are detected, then emails a completion summary.      |
| 📖 Fetch FAQs1             | Google Sheets                    | Reads FAQ rows from Google Sheet              | ⚙️ Configuration1          | 🔍 Validate & Clean Data1          |                                                                                                                                   |
| 🔍 Validate & Clean Data1  | Code                             | Cleans and validates FAQ data                  | 📖 Fetch FAQs1              | 🤖 AI Evaluator1                  |                                                                                                                                   |
| 🤖 AI Evaluator1           | LangChain Agent                  | Prepares prompt and calls GPT-4o-mini          | 🔍 Validate & Clean Data1    | 📊 Parse & Enrich Results1        |                                                                                                                                   |
| Azure OpenAI1              | LangChain LM Chat Azure OpenAI  | Executes GPT-4o-mini model call                | 🤖 AI Evaluator1 (ai_languageModel) | 🤖 AI Evaluator1 (continuation) |                                                                                                                                   |
| 📊 Parse & Enrich Results1 | Code                             | Parses AI output, assigns severity, timestamps | 🤖 AI Evaluator1            | 💾 Save Detailed Results1          |                                                                                                                                   |
| 💾 Save Detailed Results1  | Google Sheets                    | Appends detailed results to “Results” sheet   | 📊 Parse & Enrich Results1  | 📈 Generate Summary Report1        |                                                                                                                                   |
| 📈 Generate Summary Report1| Code                             | Calculates summary statistics and status       | 💾 Save Detailed Results1   | 📊 Save to History1                |                                                                                                                                   |
| 📊 Save to History1        | Google Sheets                    | Appends summary metrics to “History” sheet    | 📈 Generate Summary Report1 | ⚠️ Check if Alerts Needed1         |                                                                                                                                   |
| ⚠️ Check if Alerts Needed1 | If                               | Checks if alert conditions are met             | 📊 Save to History1         | 💬 Send Slack Alert1, ✅ Completion Summary1 |                                                                                                                                   |
| 💬 Send Slack Alert1       | Slack                            | Sends alert message to Slack channel           | ⚠️ Check if Alerts Needed1  | ✅ Completion Summary1             |                                                                                                                                   |
| ✅ Completion Summary1     | Set                              | Prepares final completion message               | ⚠️ Check if Alerts Needed1, 💬 Send Slack Alert1 | Send a message1              |                                                                                                                                   |
| Send a message1            | Gmail                            | Sends email summary of the workflow run        | ✅ Completion Summary1      | None                             |                                                                                                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: Entry point to start workflow manually.

2. **Create Configuration Set Node**  
   - Type: Set  
   - Assign variables:  
     - `sheet_id`: Your Google Sheet document ID (string)  
     - `threshold_critical`: 5 (number)  
     - `threshold_warning`: 7 (number)  
     - `threshold_good`: 8 (number)  
     - `slack_channel_id`: Slack channel ID string (e.g., "C09GNB90TED")  
     - `batch_size`: 10 (number)  
     - `test_sheet_name`: "TestSet" (string)  
     - `results_sheet_name`: "Results" (string)  
     - `history_sheet_name`: "History" (string)  
     - `run_id`: Expression `={{ $now.format('yyyyMMdd-HHmmss') }}` for timestamp

3. **Connect Manual Trigger → Configuration**

4. **Add Google Sheets Node to Fetch FAQs**  
   - Operation: Read rows from sheet  
   - Document ID: `={{ $json.sheet_id }}` (from config)  
   - Sheet Name: `={{ $json.test_sheet_name }}`  
   - Credentials: Google Sheets OAuth2  
   - Connect Configuration → Google Sheets

5. **Add Code Node to Validate & Clean Data**  
   - JavaScript code to filter empty rows, normalize question/answer fields, enrich with config data, throw error if none valid  
   - Input: Google Sheets output  
   - Output: Cleaned FAQ items  
   - Connect Google Sheets → Code node

6. **Add LangChain Agent Node for AI Evaluation**  
   - Use GPT-4o-mini (Azure OpenAI) as the language model  
   - System message: Expert technical documentation reviewer  
   - Prompt: Includes question and answer, requests JSON output with score and detailed evaluation  
   - Connect Code node → LangChain Agent node

7. **Add LangChain Azure OpenAI LM Chat Node**  
   - Model: GPT-4o-mini  
   - Max tokens: 500  
   - Temperature: 0.3  
   - Credentials: Azure OpenAI API  
   - Connect LangChain Agent node (ai_languageModel input) → Azure OpenAI node

8. **Add Code Node to Parse & Enrich Results**  
   - JavaScript code to parse AI JSON output safely, assign severity labels and emojis based on thresholds, add timestamps, flag entries needing attention, and handle errors gracefully  
   - Connect LangChain Agent node → Code node

9. **Add Google Sheets Node to Save Detailed Results**  
   - Operation: Append rows to sheet  
   - Document ID: `={{ $json.sheet_id }}`  
   - Sheet Name: `={{ $json.results_sheet_name }}`  
   - Map columns: Score, Run ID, Question, Severity, Strengths, Timestamp, Explanation, Improvements  
   - Credentials: Google Sheets OAuth2  
   - Connect Code node (parse) → Google Sheets node

10. **Add Code Node to Generate Summary Report**  
    - JavaScript code to aggregate scores, compute pass rate, count severity levels, determine overall status, pick worst performers, and generate summary text  
    - Connect Google Sheets (detailed results) → Code node

11. **Add Google Sheets Node to Save Summary to History**  
    - Operation: Append rows to sheet  
    - Document ID: `={{ $json.sheet_id }}`  
    - Sheet Name: `={{ $json.history_sheet_name }}`  
    - Map columns: Good, Run ID, Status, Warning, Critical, Pass Rate, Timestamp, Acceptable, Total FAQs, Average Score  
    - Credentials: Google Sheets OAuth2  
    - Connect Summary Report code node → Google Sheets node

12. **Add If Node to Check if Alerts Needed**  
    - Condition: `$json.needs_alert === true`  
    - Connect History Google Sheets node → If node

13. **Add Slack Node to Send Alert**  
    - Text: Formatted alert message including counts, run ID, and link to Google Sheet  
    - Channel ID: `={{ $json.slack_channel_id }}`  
    - Credentials: Slack OAuth/webhook  
    - Connect If node (true branch) → Slack node

14. **Add Set Node for Completion Summary**  
    - Assignments:  
      - `completion_message`: Summary text with run ID, total FAQs, average score, pass rate, alert status message  
      - `results_url`: Link to Google Sheet  
    - Connect Slack node (or If node false branch) → Set node

15. **Add Gmail Node to Send Completion Email**  
    - To: info@example.com (or desired recipient)  
    - Subject and Message: Use `completion_message` from Set node  
    - Credentials: Gmail OAuth2  
    - Connect Set node → Gmail node

16. **Add Sticky Notes** (optional for documentation) at relevant points describing blocks and workflow overview.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                     | Context or Link                                                                                               |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| The workflow uses GPT-4o-mini model on Azure OpenAI to balance performance and cost.                                                                                                                                                                                                             | Azure OpenAI integration                                                                                      |
| Google Sheets document must have sheets named “TestSet” for input, “Results” for detailed output, and “History” for aggregated metrics.                                                                                                                                                         | Sheet naming conventions                                                                                      |
| Slack alerts use webhook credentials and require correct channel ID configuration.                                                                                                                                                                                                              | Slack API setup                                                                                                |
| The workflow includes robust error handling for empty data, AI response parsing failures, and API errors, ensuring graceful degradation and notifications.                                                                                                                                         | Error handling details                                                                                         |
| The “run_id” timestamp allows tracking and correlating runs and results for historical trend analysis.                                                                                                                                                                                          | Run identification                                                                                            |
| Example Google Sheets URL format for configuration: https://docs.google.com/spreadsheets/d/[sheet_id]/edit                                                                                                                                                                                      | Google Sheets URL info                                                                                        |
| For deeper customization, thresholds and batch sizes can be adjusted in the Configuration node.                                                                                                                                                                                                 | Parameter tuning                                                                                               |
| Useful links and documentation:  
- [n8n Google Sheets node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlesheets/)  
- [n8n Slack node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.slack/)  
- [Azure OpenAI API](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/)                                                                                                           | Official product documentation                                                                                 |

---

This completes the comprehensive reference document for the “API Rate Limit & Auth FAQ Test” workflow, designed to enable understanding, reproduction, and modification with detailed node-level insights and best practices.