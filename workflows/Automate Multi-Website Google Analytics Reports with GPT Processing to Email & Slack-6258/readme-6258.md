Automate Multi-Website Google Analytics Reports with GPT Processing to Email & Slack

https://n8nworkflows.xyz/workflows/automate-multi-website-google-analytics-reports-with-gpt-processing-to-email---slack-6258


# Automate Multi-Website Google Analytics Reports with GPT Processing to Email & Slack

### 1. Workflow Overview

This workflow automates the daily retrieval of Google Analytics data from multiple websites, processes and aggregates that data into a coherent HTML report using OpenAI's GPT language model, and then distributes the report via email and Slack notifications. Its primary use case is to provide digital marketers, analysts, and website managers with consolidated, AI-enhanced daily summaries from multiple Google Analytics properties without manual data collection.

The workflow is logically divided into the following functional blocks:

- **1.1 Schedule Trigger:** Initiates the workflow daily at a specified hour.
- **1.2 Google Analytics Data Extraction:** Retrieves analytics data from eight distinct Google Analytics properties.
- **1.3 Error Checking:** Validates if the data extraction was successful per property and handles errors.
- **1.4 Data Merging and Aggregation:** Consolidates data from all properties into a unified dataset.
- **1.5 AI Report Generation:** Uses a LangChain agent with GPT-4.1-nano to create an HTML summary report.
- **1.6 Report and Notification Dispatch:** Sends the generated report via multiple email providers and posts notifications to Slack.
- **1.7 Error Notification Handling:** Sends alerts via email, Slack, and Telegram if credential or data errors occur.
- **1.8 Memory Context Management:** Maintains session context for AI processing using a sliding window memory buffer.

---

### 2. Block-by-Block Analysis

#### 1.1 Schedule Trigger

- **Overview:** Sets a daily trigger at 8:00 AM to start the entire report generation process.
- **Nodes Involved:** Schedule Trigger
- **Node Details:**
  - Type: Schedule Trigger (n8n-nodes-base.scheduleTrigger)
  - Configuration: Triggers once daily at hour 8; no other recurrence parameters.
  - Input: None (trigger node)
  - Output: Triggers downstream Google Analytics nodes simultaneously.
  - Edge Cases: If n8n server downtime occurs at trigger time, the workflow will miss the run.
  - Version: v1.2

#### 1.2 Google Analytics Data Extraction

- **Overview:** Queries Google Analytics API for eight different properties (websites), fetching yesterday’s data for key metrics.
- **Nodes Involved:** yoursite.com, yoursite.com 2, yoursite.com 3, yoursite.com 4, yoursite.com 5, yoursite.com 6, yoursite.com 7, yoursite.com 8
- **Node Details (each node similar):**
  - Type: Google Analytics (n8n-nodes-base.googleAnalytics)
  - Configuration: 
    - Date Range: Yesterday
    - Metrics: screenPageViews, eventCount, userEngagementDuration
    - Dimensions: Empty (no specific dimension filtering)
    - Property ID: Unique GA4 property ID per site (e.g., 448284312 for Gecko Design)
    - Credentials: Google Analytics OAuth2 account with read-only access
  - Input: Trigger from Schedule Trigger
  - Output: Raw analytics data JSON with key metric values for that property.
  - Edge Cases: Authentication failure, API quota exceeded, empty or incomplete data.
  - Version: v2

#### 1.3 Error Checking

- **Overview:** Validates if the "totalUsers" metric exists in the data from the first Google Analytics node; if missing, routes to error handling.
- **Nodes Involved:** Check if error
- **Node Details:**
  - Type: If (n8n-nodes-base.if)
  - Configuration: Checks if `totalUsers` field exists in the JSON data.
  - Input: Output from "yoursite.com" Google Analytics node
  - Output:
    - True branch: Data exists → proceeds to Merge node
    - False branch: Data missing → triggers error email notification
  - Edge Cases: Misnamed or missing fields, incomplete API responses
  - Version: v2.2

#### 1.4 Data Merging and Aggregation

- **Overview:** Merges outputs from all eight Google Analytics nodes into one unified dataset, then aggregates all item data into a single consolidated object.
- **Nodes Involved:** Merge, Aggregate
- **Node Details:**
  - Merge:
    - Type: Merge (n8n-nodes-base.merge)
    - Configuration: Waits for 8 inputs (all GA nodes)
    - Inputs: Connected from all 8 GA nodes or error-checked outputs
    - Output: Combined array of all sites' data
  - Aggregate:
    - Type: Aggregate (n8n-nodes-base.aggregate)
    - Configuration: Aggregates all data items into one dataset for simplified processing
    - Input: Output of Merge node
    - Output: Single aggregated item with all analytics data
  - Edge Cases: One or more GA nodes failing to provide data causes partial merges; the aggregate node expects data arrays.
  - Versions: Merge v3.2, Aggregate v1

#### 1.5 AI Report Generation

- **Overview:** Uses a LangChain agent with GPT-4.1-nano to generate a formatted HTML table report summarizing all analytics data.
- **Nodes Involved:** Simple Memory, Report maker agent, GPT 4.1 nano
- **Node Details:**
  - Simple Memory:
    - Type: LangChain Memory Buffer Window (@n8n/n8n-nodes-langchain.memoryBufferWindow)
    - Configuration: Session key based on trigger timestamp, 20 item context window
    - Input: None (triggered internally)
    - Output: Provides conversational context to Report maker agent
  - Report maker agent:
    - Type: LangChain Agent (@n8n/n8n-nodes-langchain.agent)
    - Configuration: 
      - Role: Data analyst creating HTML table
      - Task: Assemble data from all GA nodes into an HTML table with columns (Site, Date, Total Users, Page Views, Event Count, Engagement Duration)
      - Output: Structured HTML report with a title and table
      - Uses expressions referencing each GA node’s JSON data for dynamic content
    - Input: Aggregated data and memory context
    - Output: Prompt text for GPT model
  - GPT 4.1 nano:
    - Type: LangChain OpenAI Chat Model (@n8n/n8n-nodes-langchain.lmChatOpenAi)
    - Configuration: Model set to "gpt-4.1-nano"
    - Input: Text from Report maker agent
    - Output: AI-generated HTML report
    - Credentials: OpenAI API key
  - Edge Cases: API rate limits, malformed JSON fields, memory overflow, prompt size limits
  - Versions: Agent v2, LM Chat OpenAI v1.2, Memory Buffer v1.3

#### 1.6 Report and Notification Dispatch

- **Overview:** Sends the generated report as an email via SMTP and notifies Slack channel upon completion.
- **Nodes Involved:** Send report by email (SMTP), Send notification process complete on Slack
- **Node Details:**
  - Send report by email (SMTP):
    - Type: Email Send (n8n-nodes-base.emailSend)
    - Configuration:
      - To: contact@yoursite.com
      - From: contact@yoursite.com
      - Subject: "📊 Google Analytics Daily Report"
      - Body: HTML report output from GPT node
      - SMTP credentials configured
    - Input: AI-generated report
    - Output: Success confirmation
  - Send notification process complete on Slack:
    - Type: Slack (n8n-nodes-base.slack)
    - Configuration:
      - Channel: "général" (channel ID C07AZPNSDTR)
      - Text: Same HTML report content (can be plain text)
      - Slack API credentials configured
    - Input: Output of email node
    - Output: Confirmation of Slack message sent
  - Edge Cases: SMTP server rejection, Slack API token invalid, network errors
  - Versions: EmailSend v2.1, Slack v2.3

#### 1.7 Error Notification Handling

- **Overview:** Sends error notifications via multiple channels if credential or data retrieval errors occur.
- **Nodes Involved:** Send email for ERROR in credentials (SMTP), Send email for ERROR in credentials (Gmail), Send email for ERROR in credentials (Outlook), Send Slack notification for ERROR in credentials, Send Telegram notification for ERROR in credentials
- **Node Details:**
  - Email nodes (SMTP, Gmail, Outlook):
    - Send error message to contact@yoursite.com with subject indicating credential error
    - Configured with respective email service credentials
  - Slack notification node:
    - Posts error message to Slack channel "général"
  - Telegram notification node:
    - Sends error message to chat ID "ghs"
  - Input: Triggered by failure condition in "Check if error" node's false branch
  - Edge Cases: Multiple channels ensuring redundancy, failures in error notifications require monitoring
  - Versions: Gmail v2.1, Outlook v2, Slack v2.3, Telegram v1.2

#### 1.8 Memory Context Management

- **Overview:** Keeps a sliding window of previous interactions for context in AI prompting to improve response relevance.
- **Nodes Involved:** Simple Memory
- **Node Details:**
  - Session key based on the current timestamp from the schedule trigger ensures unique daily sessions
  - Context window limits memory to last 20 items
  - Supports conversation-like AI processing for cumulative data understanding
  - Version: 1.3

---

### 3. Summary Table

| Node Name                             | Node Type                             | Functional Role                         | Input Node(s)                 | Output Node(s)                                | Sticky Note                                                                                                    |
|-------------------------------------|-------------------------------------|---------------------------------------|------------------------------|-----------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| Schedule Trigger                    | Schedule Trigger                    | Starts workflow daily at 8 AM          | None                         | yoursite.com, yoursite.com 2, ... yoursite.com 8 | # Daily trigger - Daily trigger to be set according to your preferences.                                      |
| yoursite.com                       | Google Analytics                   | Fetches yesterday’s GA data (property 448284312) | Schedule Trigger             | Check if error                                | # Google Analytics "get report" nodes                                                                        |
| yoursite.com 2                    | Google Analytics                   | Fetches yesterday’s GA data (property 493257429) | Schedule Trigger             | Merge                                         | # Google Analytics "get report" nodes                                                                        |
| yoursite.com 3                    | Google Analytics                   | Fetches yesterday’s GA data (property 493243386) | Schedule Trigger             | Merge                                         | # Google Analytics "get report" nodes                                                                        |
| yoursite.com 4                    | Google Analytics                   | Fetches yesterday’s GA data (property 493361117) | Schedule Trigger             | Merge                                         | # Google Analytics "get report" nodes                                                                        |
| yoursite.com 5                    | Google Analytics                   | Fetches yesterday’s GA data (property 493361119) | Schedule Trigger             | Merge                                         | # Google Analytics "get report" nodes                                                                        |
| yoursite.com 6                    | Google Analytics                   | Fetches yesterday’s GA data (property 493384134) | Schedule Trigger             | Merge                                         | # Google Analytics "get report" nodes                                                                        |
| yoursite.com 7                    | Google Analytics                   | Fetches yesterday’s GA data (property 493373629) | Schedule Trigger             | Merge                                         | # Google Analytics "get report" nodes                                                                        |
| yoursite.com 8                    | Google Analytics                   | Fetches yesterday’s GA data (property 493372218) | Schedule Trigger             | Merge                                         | # Google Analytics "get report" nodes                                                                        |
| Check if error                    | If                                | Checks presence of totalUsers field    | yoursite.com                 | Merge (true), Send email for ERROR in credentials (false) | # Notifications if error                                                                                       |
| Merge                            | Merge                             | Combines data from all GA nodes         | GA nodes, Check if error      | Aggregate                                     | # Merge report data                                                                                           |
| Aggregate                       | Aggregate                        | Aggregates merged data into one object  | Merge                        | Report maker agent                            | # Report creation                                                                                             |
| Simple Memory                   | LangChain Memory Buffer Window   | Maintains AI session context            | None                        | Report maker agent                            |                                                                                                               |
| Report maker agent              | LangChain Agent                  | Generates prompt text for AI report     | Aggregate, Simple Memory     | Send report by email (SMTP)                    | # Report creation                                                                                             |
| GPT 4.1 nano                   | LangChain LM Chat OpenAI         | Generates HTML report from prompt       | Report maker agent           | Send report by email (SMTP)                    |                                                                                                               |
| Send report by email (SMTP)    | Email Send (SMTP)                | Sends the HTML report by SMTP email     | GPT 4.1 nano                | Send notification process complete on Slack    | # Send report                                                                                                |
| Send notification process complete on Slack | Slack                         | Posts completion notification on Slack | Send report by email (SMTP) | None                                          | # Send report                                                                                                |
| Send email for ERROR in credentials (SMTP) | Email Send (SMTP)                | Sends error alert email                  | Check if error (false branch) | Send Slack notification for ERROR in credentials | # Notifications if error                                                                                       |
| Send Slack notification for ERROR in credentials | Slack                         | Posts error alert on Slack               | Send email for ERROR (SMTP)  | None                                          | # Notifications if error                                                                                       |
| Send email for ERROR in credentials (Gmail) | Gmail                          | Sends error alert email                  | Check if error (false branch) | None                                          | # Notifications if error                                                                                       |
| Send email for ERROR in credentials (Outlook) | Microsoft Outlook              | Sends error alert email                  | Check if error (false branch) | None                                          | # Notifications if error                                                                                       |
| Send Telegram notification for ERROR in credentials | Telegram                      | Sends error alert message                | Check if error (false branch) | None                                          | # Notifications if error                                                                                       |
| Send report by email (Outlook)  | Microsoft Outlook               | Alternative email sending method         | (Not connected in main flow) | None                                          | ### 🟡 ALTERNATIVES (send report)                                                                             |
| Send report by email (Gmail)    | Gmail                          | Alternative email sending method         | (Not connected in main flow) | None                                          | ### 🟡 ALTERNATIVES (send report)                                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**
   - Type: Schedule Trigger
   - Set to trigger daily at 08:00 AM.
   - No additional parameters needed.

2. **Create eight Google Analytics nodes (one per website):**
   - Type: Google Analytics (GA4)
   - Configure each node for "yesterday" date range.
   - Metrics: screenPageViews, eventCount, userEngagementDuration.
   - Dimensions: leave empty.
   - Set the appropriate GA4 Property ID for each website.
   - Attach Google Analytics OAuth2 credentials with read-only access.
   - Connect each node's input to the Schedule Trigger output.

3. **Add an If node named "Check if error":**
   - Conditions: Check if the field `totalUsers` exists in the JSON output of the first GA node ("yoursite.com").
   - Connect "yoursite.com" output to this node.
   - True branch goes to the Merge node.
   - False branch leads to error notification nodes.

4. **Create a Merge node:**
   - Type: Merge
   - Configure to expect 8 inputs.
   - Connect True output of "Check if error" to the first input.
   - Connect outputs of the other seven GA nodes to inputs 2-8.

5. **Create an Aggregate node:**
   - Type: Aggregate
   - Set to aggregate all item data.
   - Connect Merge output to Aggregate input.

6. **Add a Simple Memory node (LangChain Memory Buffer Window):**
   - Session key: Use the timestamp from Schedule Trigger, e.g., `={{ $('Schedule Trigger').item.json.timestamp }}`
   - Session ID type: Custom key
   - Context window length: 20 items.

7. **Create a LangChain Agent node named "Report maker agent":**
   - Role: Data analyst creating data tables.
   - Task: Generate an HTML table summarizing all GA data.
   - Use expressions referencing each GA node for dynamic data insertion.
   - Connect Aggregate output and Simple Memory output as inputs.

8. **Create a LangChain OpenAI Chat model node "GPT 4.1 nano":**
   - Model: Select "gpt-4.1-nano".
   - Connect output of "Report maker agent" to AI Language Model input.
   - Configure OpenAI credentials.

9. **Create an Email Send node (SMTP) "Send report by email (SMTP)":**
   - To: contact@yoursite.com
   - From: contact@yoursite.com
   - Subject: "📊 Google Analytics Daily Report"
   - Body: Use the output of GPT node as HTML content.
   - Configure SMTP credentials.
   - Connect GPT node output to this node.

10. **Create a Slack node "Send notification process complete on Slack":**
    - Channel: Select your Slack channel (e.g., "général").
    - Text: Use the same report content or a notification message.
    - Configure Slack API credentials.
    - Connect Email node output to this node.

11. **Create error notification nodes:**
    - Email Send nodes for SMTP, Gmail, and Outlook with subjects indicating credential errors.
    - Slack notification node posting to the same Slack channel.
    - Telegram node sending to specified chat ID.
    - Connect these nodes from the False branch of the "Check if error" node to send alerts on failure.

12. **(Optional) Add alternative nodes for sending reports via Gmail or Outlook:**
    - Duplicate the Email Send node logic with relevant credentials.
    - Connect output from GPT node accordingly.

13. **Add Sticky Note nodes to document each major block for clarity.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Context or Link                                                                                 |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Before running this workflow, ensure Google Analytics API is enabled for your project and OAuth2 credentials are set up with correct scopes (`analytics.readonly` or `analytics`). Configure email credentials (SMTP, Gmail, Outlook) and Slack credentials with bot tokens. Also, set up OpenAI API credentials for GPT usage. Replace GA property IDs and site names as needed to reflect your monitored websites.                                                                                                               | Setup instructions included in Sticky Note12                                                   |
| This workflow is tailored for GA4 properties but can be adapted for Universal Analytics by changing the API and property IDs accordingly.                                                                                                                                                                                                                                                                                                                                                                                             | Sticky Note12                                                                                   |
| The LangChain Agent node uses a detailed prompt to create an HTML table summarizing all sites’ key metrics. Modify this prompt to customize report layout or add more metrics.                                                                                                                                                                                                                                                                                                                                                           | Node "Report maker agent" prompt content                                                        |
| Alternative email sending nodes (Gmail, Outlook) and alternative notification nodes (Telegram, Slack) provide flexibility to integrate with your preferred communication channels.                                                                                                                                                                                                                                                                                                                                                      | Sticky Note "ALTERNATIVES (send report)" and "ALTERNATIVES (notifications if error)"             |
| Slack channel IDs and Telegram chat IDs must be replaced with valid values from your workspace and bot configurations.                                                                                                                                                                                                                                                                                                                                                                                                                   | Refer to Slack and Telegram node configurations                                                 |
| For best results, monitor API quota limits and error notifications to maintain continuous operation and timely reports.                                                                                                                                                                                                                                                                                                                                                                                                                  | Error handling nodes and notifications                                                          |
| The workflow is inactive by default; activate after configuration and testing.                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Workflow metadata                                                                               |
| For more detailed instructions and troubleshooting, consult Google Analytics API documentation and n8n’s official documentation for OAuth2 and email node setup.                                                                                                                                                                                                                                                                                                                                                                        | https://console.cloud.google.com/ for GA API setup, https://docs.n8n.io/ for node configuration |

---

**Disclaimer:**  
The text provided is extracted exclusively from an automated n8n workflow, adhering strictly to content policies and containing no illegal, offensive, or protected elements. All data handled is legal and public.