AI marketing report (Google Analytics & Ads, Meta Ads), sent via email/Telegram

https://n8nworkflows.xyz/workflows/ai-marketing-report--google-analytics---ads--meta-ads---sent-via-email-telegram-2783


# AI marketing report (Google Analytics & Ads, Meta Ads), sent via email/Telegram

### 1. Workflow Overview

This workflow, titled **"AI marketing report (Google Analytics & Ads, Meta Ads), sent via email/Telegram"**, automates the weekly retrieval, analysis, and reporting of online marketing data from multiple sources. It targets marketing analysts and managers who require consolidated insights from Google Analytics (multiple domains), Google Ads, and Meta Ads, comparing the last 7 days with the same period in the previous year. The workflow leverages AI to summarize and format the data, delivering a detailed email report and a concise Telegram message.

**Logical Blocks:**

- **1.1 Schedule Trigger:** Initiates the workflow weekly (e.g., every Monday at 7 a.m.).
- **1.2 Data Retrieval (Current Period):** Fetches marketing data from Google Analytics (5 domains), Google Ads, and Meta Ads for the last 7 days using sub-workflows or API calls.
- **1.3 Data Retrieval (Previous Year Period):** Calculates the corresponding dates for the previous year and fetches the same data sets for comparison.
- **1.4 Data Formatting and Summarization:** Processes raw data into summarized metrics, formats numbers, and prepares structured data for AI analysis.
- **1.5 AI Analysis and Report Generation:** Uses OpenAI GPT models to analyze data, create tables, and generate textual summaries for each data source.
- **1.6 Email Report Assembly and Sending:** Aggregates all summaries and tables into a well-formatted HTML email and sends it via SMTP.
- **1.7 Telegram Report Preparation and Sending:** Converts the email report into a concise plain-text summary suitable for Telegram and sends it optionally.

---

### 2. Block-by-Block Analysis

#### 2.1 Schedule Trigger

- **Overview:** Triggers the workflow automatically every Monday at 7 a.m.
- **Nodes Involved:**  
  - Schedule Trigger
- **Node Details:**  
  - **Schedule Trigger**  
    - Type: `n8n-nodes-base.scheduleTrigger`  
    - Configuration: Weekly interval, triggers on Monday at 7:00 AM.  
    - Input: None (trigger node).  
    - Output: Starts the workflow chain by triggering the "Weekly Report Agent" node.  
    - Potential Failures: Workflow not triggered if n8n instance is down or misconfigured timezone.

#### 2.2 Data Retrieval (Current Period)

- **Overview:** Retrieves marketing data for the last 7 days from Google Analytics (five domains), Google Ads, and Meta Ads using sub-workflows or API calls.
- **Nodes Involved:**  
  - Execute Workflow Trigger  
  - Analytics_Domain_1 to Analytics_Domain_5 (sub-workflows)  
  - Google_Ads (sub-workflow)  
  - Meta_Ads (sub-workflow)  
  - Call Google Analytics data: Last 7 days (node in sub-workflows)  
  - Call Google Ads Data: Last 7 days (HTTP Request)  
  - Call Meta Ads Data: Last 7 days (Facebook Graph API)  
  - Calculate date format for Google Ads request (code)  
  - Calculate date format for meta ads request s (code)  
- **Node Details:**  
  - **Execute Workflow Trigger**  
    - Type: `n8n-nodes-base.executeWorkflowTrigger`  
    - Role: Executes sub-workflows for Google Analytics data retrieval.  
  - **Analytics_Domain_1 to Analytics_Domain_5**  
    - Type: `@n8n/n8n-nodes-langchain.toolWorkflow`  
    - Role: Calls respective Google Analytics sub-workflows for each domain.  
    - Configuration: Each references a specific workflow ID for domain-specific data.  
  - **Google_Ads**  
    - Type: `@n8n/n8n-nodes-langchain.toolWorkflow`  
    - Role: Calls Google Ads sub-workflow for last 7 days data.  
  - **Meta_Ads**  
    - Type: `@n8n/n8n-nodes-langchain.toolWorkflow`  
    - Role: Calls Meta Ads sub-workflow for last 7 days data.  
  - **Call Google Ads Data: Last 7 days**  
    - Type: `n8n-nodes-base.httpRequest`  
    - Role: Sends POST request to Google Ads API with date range and metrics query.  
    - Configuration: Uses Google Ads OAuth2 credentials, developer token header, and dynamic date parameters.  
    - Potential Failures: API rate limits, auth errors, malformed queries.  
  - **Call Meta Ads Data: Last 7 days**  
    - Type: `n8n-nodes-base.facebookGraphApi`  
    - Role: Queries Facebook Graph API for Meta Ads insights with dynamic date range.  
    - Configuration: Uses Facebook Graph API credentials, version v20.0, and dynamic time_range parameters.  
    - Potential Failures: Token expiration, API limits, invalid parameters.  
  - **Calculate date format for Google Ads request (last 7 days)**  
    - Type: `n8n-nodes-base.code`  
    - Role: Calculates start and end dates for last 7 days in YYYYMMDD format for Google Ads API.  
  - **Calculate date format for meta ads request s**  
    - Type: `n8n-nodes-base.code`  
    - Role: Calculates start and end dates for last 7 days and previous year period in YYYY-MM-DD format for Meta Ads API.

#### 2.3 Data Retrieval (Previous Year Period)

- **Overview:** Calculates the same 7-day period from the previous year and retrieves corresponding data from Google Analytics, Google Ads, and Meta Ads.
- **Nodes Involved:**  
  - Calculation same period previous year (code)  
  - Calculation same period previous year1 (code)  
  - Call Google Analytics data: Last 7 days (previous year)  
  - Call Google Ads Data: Last 7 days (previous year)  
  - Call Meta Ads Data: Last 7 days (previous year)  
- **Node Details:**  
  - **Calculation same period previous year**  
    - Type: `n8n-nodes-base.code`  
    - Role: Calculates start and end dates for previous year period in YYYYMMDD format for Google Ads.  
  - **Calculation same period previous year1**  
    - Type: `n8n-nodes-base.code`  
    - Role: Calculates start and end dates for previous year period in ISO date format for Google Analytics.  
  - **Call Google Analytics data: Last 7 days (previous year)**  
    - Type: `n8n-nodes-base.googleAnalytics`  
    - Role: Queries Google Analytics API for previous year data using calculated dates.  
    - Configuration: Uses Google Analytics OAuth2 credentials.  
  - **Call Google Ads Data: Last 7 days (previous year)**  
    - Type: `n8n-nodes-base.httpRequest`  
    - Role: Queries Google Ads API for previous year data with dynamic date parameters.  
  - **Call Meta Ads Data: Last 7 days (previous year)**  
    - Type: `n8n-nodes-base.facebookGraphApi`  
    - Role: Queries Facebook Graph API for previous year Meta Ads data with dynamic date parameters.

#### 2.4 Data Formatting and Summarization

- **Overview:** Processes raw data from APIs into summarized metrics, calculates derived values (e.g., CPM, ROAS), formats numbers for readability, and prepares data for AI analysis.
- **Nodes Involved:**  
  - Format data input (current year) (code)  
  - Format data input (previous year) (code)  
  - Assign data from input (current year) (set)  
  - Assign input (previous year) (set)  
  - Summarize input (current year) (summarize)  
  - Summarize input (previous year) (summarize)  
  - Format all Google data for LLM (code)  
  - Format all Meta data for LLM (code)  
  - Assign Meta data from input (current year) (set)  
  - Assign Meta data input (previous year) (set)  
  - Summarize Meta input (current year) (summarize)  
  - Summarize Meta data input (previous year) (summarize)  
  - Assign Google Analytics data input (current year) (set)  
  - Assign Google Analytics data input (previous year) (set)  
  - Summarize Google Analytics input (current year) (summarize)  
  - Summarize Google Analytics input (previous year) (summarize)  
- **Node Details:**  
  - **Format data input (current year / previous year)**  
    - Type: `n8n-nodes-base.code`  
    - Role: Aggregates campaign metrics (impressions, clicks, conversions, cost, ROAS) from Google Ads raw data.  
    - Edge Cases: Division by zero in CPM or ROAS calculations; missing or malformed data.  
  - **Assign data from input (current year) / Assign input (previous year)**  
    - Type: `n8n-nodes-base.set`  
    - Role: Maps aggregated metrics to named fields for further processing.  
  - **Summarize input (current year / previous year)**  
    - Type: `n8n-nodes-base.summarize`  
    - Role: Aggregates data fields across items, calculating sums and averages as needed.  
  - **Format all Google data for LLM**  
    - Type: `n8n-nodes-base.code`  
    - Role: Formats summarized Google Ads data into localized number strings and calculates CPM.  
  - **Format all Meta data for LLM**  
    - Type: `n8n-nodes-base.code`  
    - Role: Formats summarized Meta Ads data into localized number strings and prepares for AI input.  
  - **Assign Meta data from input (current year) / Assign Meta data input (previous year)**  
    - Type: `n8n-nodes-base.set`  
    - Role: Maps Meta Ads API response fields to named variables.  
  - **Summarize Meta input (current year) / Summarize Meta data input (previous year)**  
    - Type: `n8n-nodes-base.summarize`  
    - Role: Aggregates Meta Ads metrics for current and previous year.  
  - **Assign Google Analytics data input (current year / previous year)**  
    - Type: `n8n-nodes-base.set`  
    - Role: Maps Google Analytics metrics to named fields.  
  - **Summarize Google Analytics input (current year / previous year)**  
    - Type: `n8n-nodes-base.summarize`  
    - Role: Aggregates Google Analytics metrics for current and previous year.

#### 2.5 AI Analysis and Report Generation

- **Overview:** Uses OpenAI GPT models to analyze the formatted data, generate tables comparing current and previous year metrics with percentage changes, and produce concise textual summaries.
- **Nodes Involved:**  
  - Processing for Google Ads report (OpenAI)  
  - Processing for Meta Ads Report (OpenAI)  
  - Processing for Google Analytics Report (OpenAI)  
  - Weekly Report Agent (Langchain Agent)  
- **Node Details:**  
  - **Processing for Google Ads report**  
    - Type: `@n8n/n8n-nodes-langchain.openAi`  
    - Role: Generates a summary and comparison table for Google Ads data.  
    - Configuration: Uses GPT-4o model, prompts specify number formatting and output constraints.  
    - Edge Cases: AI response errors, rate limits, malformed input data.  
  - **Processing for Meta Ads Report**  
    - Type: `@n8n/n8n-nodes-langchain.openAi`  
    - Role: Generates a summary and comparison table for Meta Ads data.  
    - Configuration: Similar to Google Ads processing node.  
  - **Processing for Google Analytics Report**  
    - Type: `@n8n/n8n-nodes-langchain.openAi`  
    - Role: Generates a summary and comparison table for Google Analytics data.  
  - **Weekly Report Agent**  
    - Type: `@n8n/n8n-nodes-langchain.agent`  
    - Role: Orchestrates collection of summaries and tables from all sub-workflows (Analytics domains, Google Ads, Meta Ads), formats them into a single HTML email report.  
    - Configuration: Detailed prompt instructing the agent to build a structured HTML email with sections for each data source.  
    - Input: Summaries and tables from all data sources.  
    - Output: Complete HTML email content.

#### 2.6 Email Report Assembly and Sending

- **Overview:** Sends the AI-generated HTML report via email to a specified recipient.
- **Nodes Involved:**  
  - Send mail report (Email Send)  
- **Node Details:**  
  - **Send mail report**  
    - Type: `n8n-nodes-base.emailSend`  
    - Role: Sends the HTML email report.  
    - Configuration: Uses SMTP credentials; email subject and recipient are predefined.  
    - Input: HTML content from Weekly Report Agent.  
    - Potential Failures: SMTP authentication errors, network issues.

#### 2.7 Telegram Report Preparation and Sending

- **Overview:** Converts the detailed HTML email report into a concise plain-text summary for Telegram and sends it to a specified chat.
- **Nodes Involved:**  
  - Processing for Telegram Report (OpenAI)  
  - Send Telegram report (Telegram node)  
- **Node Details:**  
  - **Processing for Telegram Report**  
    - Type: `@n8n/n8n-nodes-langchain.openAi`  
    - Role: Converts HTML report to plain text, restructures content into paragraphs per data source, and extracts only summaries with embedded numbers.  
    - Model: GPT-4o-mini for faster, lighter processing.  
  - **Send Telegram report**  
    - Type: `n8n-nodes-base.telegram`  
    - Role: Sends the processed text message to a Telegram chat ID.  
    - Configuration: Uses Telegram API credentials; chat ID is predefined.  
    - Optional: This step can be disabled if Telegram reporting is not required.

---

### 3. Summary Table

| Node Name                                | Node Type                                   | Functional Role                                  | Input Node(s)                                   | Output Node(s)                                  | Sticky Note                                                                                              |
|-----------------------------------------|---------------------------------------------|-------------------------------------------------|------------------------------------------------|------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| Schedule Trigger                        | n8n-nodes-base.scheduleTrigger              | Triggers workflow weekly                         | None                                           | Weekly Report Agent                             |                                                                                                        |
| Weekly Report Agent                     | @n8n/n8n-nodes-langchain.agent              | Aggregates summaries, builds HTML email         | Schedule Trigger, Analytics_Domain_1..5, Google_Ads, Meta_Ads, OpenAI Chat Model | Processing for Telegram Report, Send mail report | ## Main Workflow: Weekly Report Assistant                                                              |
| Execute Workflow Trigger                | n8n-nodes-base.executeWorkflowTrigger       | Executes Google Analytics sub-workflows          | None                                           | Call Google Analytics data: Last 7 days        | ## Sub-Workflow: Google Analytics Data                                                                 |
| Analytics_Domain_1 to Analytics_Domain_5 | @n8n/n8n-nodes-langchain.toolWorkflow       | Calls GA sub-workflows for each domain           | Execute Workflow Trigger                        | Weekly Report Agent                             | ## Sub-Workflow: Google Analytics Data                                                                 |
| Google_Ads                             | @n8n/n8n-nodes-langchain.toolWorkflow       | Calls Google Ads sub-workflow                     | Weekly Report Agent                             | Weekly Report Agent                             | ## Sub-Workflow: Google Ads Data                                                                        |
| Meta_Ads                              | @n8n/n8n-nodes-langchain.toolWorkflow       | Calls Meta Ads sub-workflow                        | Weekly Report Agent                             | Weekly Report Agent                             | ## Sub-Workflow: Meta Ads Data                                                                          |
| Call Google Analytics data: Last 7 days | n8n-nodes-base.googleAnalytics               | Retrieves GA data for current period              | Execute Workflow Trigger                        | Assign Google Analytics data input (current year) |                                                                                                        |
| Call Google Analytics data: Last 7 days (previous year) | n8n-nodes-base.googleAnalytics               | Retrieves GA data for previous year period        | Calculation same period previous year1          | Assign Google Analytics data input (previous year) |                                                                                                        |
| Assign Google Analytics data input (current year) | n8n-nodes-base.set                           | Maps GA metrics for current period                | Call Google Analytics data: Last 7 days        | Summarize Google Analytics input (current year) |                                                                                                        |
| Assign Google Analytics data input (previous year) | n8n-nodes-base.set                           | Maps GA metrics for previous year period          | Call Google Analytics data: Last 7 days (previous year) | Summarize Google Analytics input (previous year) |                                                                                                        |
| Summarize Google Analytics input (current year) | n8n-nodes-base.summarize                      | Aggregates GA metrics current period              | Assign Google Analytics data input (current year) | Calculation same period previous year1          |                                                                                                        |
| Summarize Google Analytics input (previous year) | n8n-nodes-base.summarize                      | Aggregates GA metrics previous year               | Assign Google Analytics data input (previous year) | Processing for Google Analytics Report          |                                                                                                        |
| Calculation same period previous year1 | n8n-nodes-base.code                           | Calculates previous year dates for GA             | Summarize Google Analytics input (current year) | Call Google Analytics data: Last 7 days (previous year) |                                                                                                        |
| Calculate date format for Google Ads request (last 7 days) | n8n-nodes-base.code                           | Calculates last 7 days dates for Google Ads API   | None                                           | Call Google Ads Data: Last 7 days               |                                                                                                        |
| Call Google Ads Data: Last 7 days       | n8n-nodes-base.httpRequest                    | Retrieves Google Ads data for current period      | Calculate date format for Google Ads request (last 7 days) | Format data input (current year)                |                                                                                                        |
| Call Google Ads Data: Last 7 days (previous year) | n8n-nodes-base.httpRequest                    | Retrieves Google Ads data for previous year       | Calculation same period previous year           | Format data input (previous year)                |                                                                                                        |
| Format data input (current year)        | n8n-nodes-base.code                           | Aggregates and calculates Google Ads metrics      | Call Google Ads Data: Last 7 days               | Assign data from input (current year)            |                                                                                                        |
| Format data input (previous year)       | n8n-nodes-base.code                           | Aggregates and calculates Google Ads metrics      | Call Google Ads Data: Last 7 days (previous year) | Assign input (previous year)                      |                                                                                                        |
| Assign data from input (current year)   | n8n-nodes-base.set                            | Maps Google Ads metrics for current period        | Format data input (current year)                | Summarize input (current year)                    |                                                                                                        |
| Assign input (previous year)             | n8n-nodes-base.set                            | Maps Google Ads metrics for previous year          | Format data input (previous year)               | Summarize input (previous year)                   |                                                                                                        |
| Summarize input (current year)           | n8n-nodes-base.summarize                      | Aggregates Google Ads metrics current period      | Assign data from input (current year)           | Calculation same period previous year             |                                                                                                        |
| Summarize input (previous year)          | n8n-nodes-base.summarize                      | Aggregates Google Ads metrics previous year       | Assign input (previous year)                     | Format all Google data for LLM                     |                                                                                                        |
| Format all Google data for LLM           | n8n-nodes-base.code                           | Formats Google Ads data for AI input               | Summarize input (previous year)                  | Processing for Google Ads report                   |                                                                                                        |
| Processing for Google Ads report          | @n8n/n8n-nodes-langchain.openAi               | AI analysis and summary generation for Google Ads | Format all Google data for LLM                    | Weekly Report Agent                                |                                                                                                        |
| Calculate date format for meta ads request s | n8n-nodes-base.code                           | Calculates last 7 days and previous year dates for Meta Ads API | None                                           | Call Meta Ads Data: Last 7 days                    |                                                                                                        |
| Call Meta Ads Data: Last 7 days           | n8n-nodes-base.facebookGraphApi                | Retrieves Meta Ads data for current period         | Calculate date format for meta ads request s     | Assign Meta data from input (current year)         |                                                                                                        |
| Call Meta Ads Data: Last 7 days (previous year) | n8n-nodes-base.facebookGraphApi                | Retrieves Meta Ads data for previous year          | Summarize Meta input (current year)               | Assign Meta data input (previous year)             |                                                                                                        |
| Assign Meta data from input (current year) | n8n-nodes-base.set                            | Maps Meta Ads metrics for current period           | Call Meta Ads Data: Last 7 days                    | Summarize Meta input (current year)                |                                                                                                        |
| Assign Meta data input (previous year)    | n8n-nodes-base.set                            | Maps Meta Ads metrics for previous year            | Call Meta Ads Data: Last 7 days (previous year)   | Summarize Meta data input (previous year)          |                                                                                                        |
| Summarize Meta input (current year)       | n8n-nodes-base.summarize                      | Aggregates Meta Ads metrics current period         | Assign Meta data from input (current year)         | Call Meta Ads Data: Last 7 days (previous year)    |                                                                                                        |
| Summarize Meta data input (previous year) | n8n-nodes-base.summarize                      | Aggregates Meta Ads metrics previous year          | Assign Meta data input (previous year)              | Format all Meta data for LLM                         |                                                                                                        |
| Format all Meta data for LLM               | n8n-nodes-base.code                           | Formats Meta Ads data for AI input                  | Summarize Meta data input (previous year)           | Processing for Meta Ads Report                       |                                                                                                        |
| Processing for Meta Ads Report             | @n8n/n8n-nodes-langchain.openAi               | AI analysis and summary generation for Meta Ads    | Format all Meta data for LLM                         | Weekly Report Agent                                  |                                                                                                        |
| Assign Google Analytics data input (current year) | n8n-nodes-base.set                            | Maps GA metrics for current period                  | Call Google Analytics data: Last 7 days             | Summarize Google Analytics input (current year)     |                                                                                                        |
| Assign Google Analytics data input (previous year) | n8n-nodes-base.set                            | Maps GA metrics for previous year                    | Call Google Analytics data: Last 7 days (previous year) | Summarize Google Analytics input (previous year)     |                                                                                                        |
| Summarize Google Analytics input (current year) | n8n-nodes-base.summarize                      | Aggregates GA metrics current period                | Assign Google Analytics data input (current year)   | Calculation same period previous year1                |                                                                                                        |
| Summarize Google Analytics input (previous year) | n8n-nodes-base.summarize                      | Aggregates GA metrics previous year                 | Assign Google Analytics data input (previous year)  | Processing for Google Analytics Report                |                                                                                                        |
| Processing for Google Analytics Report     | @n8n/n8n-nodes-langchain.openAi               | AI analysis and summary generation for GA data     | Summarize Google Analytics input (previous year)    | Weekly Report Agent                                  |                                                                                                        |
| Send mail report                           | n8n-nodes-base.emailSend                      | Sends the final HTML email report                    | Weekly Report Agent                                  | None                                               |                                                                                                        |
| Processing for Telegram Report             | @n8n/n8n-nodes-langchain.openAi               | Converts HTML report to plain text summary for Telegram | Weekly Report Agent                                  | Send Telegram report                                |                                                                                                        |
| Send Telegram report                       | n8n-nodes-base.telegram                       | Sends the Telegram message                           | Processing for Telegram Report                        | None                                               |                                                                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: `Schedule Trigger`  
   - Configure to trigger weekly on Monday at 7:00 AM.  
   - No credentials required.

2. **Create Execute Workflow Trigger Node**  
   - Type: `Execute Workflow Trigger`  
   - Purpose: To call Google Analytics sub-workflows for multiple domains.

3. **Set Up Google Analytics Sub-Workflows**  
   - Create five separate workflows for each domain's GA data retrieval.  
   - Each should query GA API for last 7 days data with appropriate property IDs.  
   - Use Google Analytics OAuth2 credentials.  
   - Return summarized data and summary text.  
   - In main workflow, add five `Tool Workflow` nodes named `Analytics_Domain_1` to `Analytics_Domain_5`, referencing these workflows.

4. **Set Up Google Ads Sub-Workflow**  
   - Create a workflow to query Google Ads API for last 7 days data.  
   - Use HTTP Request node with Google Ads OAuth2 credentials and developer token.  
   - Return summarized campaign metrics.  
   - Add a `Tool Workflow` node named `Google_Ads` referencing this workflow.

5. **Set Up Meta Ads Sub-Workflow**  
   - Create a workflow to query Facebook Graph API for Meta Ads insights for last 7 days.  
   - Use Facebook Graph API credentials.  
   - Return summarized metrics.  
   - Add a `Tool Workflow` node named `Meta_Ads` referencing this workflow.

6. **Add Date Calculation Code Nodes**  
   - Add a `Code` node to calculate last 7 days date range for Google Ads in YYYYMMDD format.  
   - Add a `Code` node to calculate last 7 days and previous year date ranges for Meta Ads in YYYY-MM-DD format.  
   - Add a `Code` node to calculate previous year date range for Google Analytics in ISO format.

7. **Add Google Analytics Data Retrieval Nodes**  
   - Add `Google Analytics` nodes to fetch data for current and previous year periods for each domain.  
   - Use Google Analytics OAuth2 credentials.

8. **Add Google Ads Data Retrieval Nodes**  
   - Add HTTP Request nodes to fetch Google Ads data for current and previous year periods.  
   - Use Google Ads OAuth2 credentials and developer token.

9. **Add Meta Ads Data Retrieval Nodes**  
   - Add Facebook Graph API nodes to fetch Meta Ads data for current and previous year periods.  
   - Use Facebook Graph API credentials.

10. **Add Data Formatting Code Nodes**  
    - Add `Code` nodes to aggregate and calculate metrics (impressions, clicks, CPM, ROAS, etc.) for Google Ads current and previous year data.  
    - Add `Code` nodes to format Meta Ads data similarly.  
    - Add `Code` nodes to format Google Analytics data.

11. **Add Set Nodes for Data Assignment**  
    - Add `Set` nodes to map raw and aggregated data fields to named variables for Google Ads, Meta Ads, and Google Analytics for both current and previous year.

12. **Add Summarize Nodes**  
    - Add `Summarize` nodes to aggregate data fields (sum, average) for all data sources and periods.

13. **Add AI Processing Nodes**  
    - Add OpenAI nodes (GPT-4o) to analyze and generate summaries and tables for Google Ads, Meta Ads, and Google Analytics data.  
    - Configure prompts to produce tables comparing current and previous year data with percentage changes and brief summaries.

14. **Add Langchain Agent Node (Weekly Report Agent)**  
    - Add Langchain Agent node to collect all summaries and tables from sub-workflows and AI nodes.  
    - Configure prompt to assemble a clean, structured HTML email with sections for each data source.  
    - Use OpenAI API credentials.

15. **Add Email Send Node**  
    - Add `Email Send` node to send the HTML report via SMTP.  
    - Configure SMTP credentials, recipient, sender, and subject.

16. **Add Telegram Report Preparation Node**  
    - Add OpenAI node (GPT-4o-mini) to convert the HTML email report into a concise plain-text summary for Telegram.  
    - Configure prompt to format each data source as a paragraph with embedded numbers.

17. **Add Telegram Send Node**  
    - Add `Telegram` node to send the Telegram message.  
    - Configure Telegram API credentials and chat ID.

18. **Connect Nodes According to Workflow Logic**  
    - Connect Schedule Trigger → Weekly Report Agent  
    - Weekly Report Agent → Send mail report and Processing for Telegram Report  
    - Processing for Telegram Report → Send Telegram report  
    - Execute Workflow Trigger → Call Google Analytics data nodes  
    - Call Google Analytics data nodes → Assign and Summarize nodes → AI Processing nodes  
    - Similarly connect Google Ads and Meta Ads data retrieval, formatting, summarization, and AI nodes to Weekly Report Agent.

19. **Set Credentials**  
    - Google Analytics OAuth2 for GA nodes.  
    - Google Ads OAuth2 and developer token for Google Ads HTTP Request nodes.  
    - Facebook Graph API credentials for Meta Ads nodes.  
    - OpenAI API credentials for AI nodes.  
    - SMTP credentials for email sending.  
    - Telegram API credentials for Telegram sending.

20. **Test Workflow**  
    - Run manually or wait for scheduled trigger.  
    - Verify data retrieval, AI summaries, email formatting, and message sending.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                         | Context or Link                                                                                         |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| Workflow requires multiple API credentials: Google Analytics, Google Ads, Facebook Graph API, OpenAI, SMTP, Telegram (optional).                                                                                                  | See respective n8n credential documentation links in the description.                                |
| Sub-workflows for each Google Analytics domain, Google Ads, and Meta Ads must be created separately and referenced via Tool Workflow nodes.                                                                                      | Workflow modularity allows easy addition/removal of domains or data sources.                          |
| AI prompts enforce strict formatting rules: no introductions or conclusions, specific number formatting (German style), and concise summaries limited to 3 sentences.                                                               | Ensures consistent, clean report output.                                                             |
| Telegram reporting is optional and designed to provide a brief, plain-text summary suitable for mobile consumption.                                                                                                                | Can be disabled by removing or disconnecting Telegram nodes.                                         |
| Contact the workflow author for support or customization via LinkedIn: https://www.linkedin.com/in/friedemann-schuetz                                                                                                            | Useful for troubleshooting or extending workflow functionality.                                      |
| The workflow uses Langchain nodes for AI integration, which requires n8n version supporting these nodes and compatible OpenAI API credentials.                                                                                    | Ensure n8n is updated to support Langchain nodes and AI integrations.                                |
| Google Ads API requests require a developer token and OAuth2 credentials with appropriate permissions.                                                                                                                             | See https://docs.n8n.io/integrations/builtin/credentials/google/                                     |
| Facebook Graph API requests require a valid access token with ads_read permissions.                                                                                                                                                 | See https://docs.n8n.io/integrations/builtin/credentials/facebookgraph/                              |
| SMTP credentials must allow sending emails from the configured sender address.                                                                                                                                                      | Use verified SMTP accounts to avoid delivery issues.                                                |
| Date calculations in code nodes handle dynamic date ranges for current and previous year periods, ensuring accurate comparisons.                                                                                                   | Adjust code if different reporting periods are needed.                                              |

---

This structured documentation enables advanced users and AI agents to fully understand, reproduce, and maintain the workflow, anticipate potential errors, and extend it as needed.