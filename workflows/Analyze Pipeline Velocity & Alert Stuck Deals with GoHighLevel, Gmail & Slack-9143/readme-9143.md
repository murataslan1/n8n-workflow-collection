Analyze Pipeline Velocity & Alert Stuck Deals with GoHighLevel, Gmail & Slack

https://n8nworkflows.xyz/workflows/analyze-pipeline-velocity---alert-stuck-deals-with-gohighlevel--gmail---slack-9143


# Analyze Pipeline Velocity & Alert Stuck Deals with GoHighLevel, Gmail & Slack

### 1. Workflow Overview

This workflow automates the monitoring of sales pipeline velocity in GoHighLevel (GHL) and issues alerts for deals that become stuck in any stage for longer than a configurable threshold (default 7+ days). It runs on a scheduled basis (weekly, Monday at 8 AM) and performs the following logical blocks:

- **1.1 Scheduled Trigger & Data Fetch:** Starts the workflow on a weekly schedule, then fetches all current opportunities from GoHighLevel’s pipeline.
- **1.2 Data Validation:** Checks if data was successfully retrieved; if not, sends an error alert email.
- **1.3 Data Transformation & Storage:** Calculates the time each deal has spent in its current stage, transforms data into a suitable format, and logs it to Google Sheets for historical tracking.
- **1.4 Metrics Aggregation & Reporting:** Aggregates overall pipeline stage metrics, identifies bottlenecks, and generates a weekly report in HTML and text formats.
- **1.5 Stuck Deal Filtering & Alerting:** Filters deals stuck in the same stage for over 7 days, generates alert emails, sends notifications via Gmail and Slack.
- **1.6 Communication:** Sends the weekly pipeline performance report email to sales leadership.

Together, these blocks enable sales managers to track pipeline velocity trends, identify bottlenecks, and promptly intervene on stuck deals.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger & Data Fetch

- **Overview:** Initiates the workflow weekly on Monday 8 AM, then fetches pipeline opportunity data from GoHighLevel.
- **Nodes Involved:**  
  - Weekly Trigger - Monday 8AM  
  - Fetch GHL Pipeline Data  
  - If (data validation node)

- **Node Details:**

  - **Weekly Trigger - Monday 8AM**  
    - Type: Schedule Trigger  
    - Configuration: Triggers workflow every Monday at 08:00 AM.  
    - Input: None (start node)  
    - Output: Triggers next node Fetch GHL Pipeline Data  
    - Edge cases: Missed trigger if n8n instance down.

  - **Fetch GHL Pipeline Data**  
    - Type: GoHighLevel node (API integration)  
    - Configuration: Retrieves all opportunities from GoHighLevel; pipeline filter can be configured if needed.  
    - Input: Trigger from schedule node  
    - Output: Passes data to If node  
    - Edge cases: API authentication failures, rate limits, empty data response.

  - **If**  
    - Type: If node (conditional branching)  
    - Configuration: Checks if the fetched data is non-empty (successful fetch)  
    - Input: Output of Fetch GHL Pipeline Data  
    - Output:  
      - True branch: proceeds to Transform Stage Data  
      - False branch: triggers Send Error Alert  
    - Edge cases: Expression failures if data structure changes.

#### 2.2 Data Transformation & Storage

- **Overview:** Converts raw pipeline data into stage duration metrics, then logs these to Google Sheets for trend tracking.
- **Nodes Involved:**  
  - Transform Stage Data  
  - Log to Google Sheets  
  - Filter Stuck Deals (7+ Days)

- **Node Details:**

  - **Transform Stage Data**  
    - Type: Code node (JavaScript)  
    - Configuration: Calculates time spent in each stage per deal, prepares data format compatible with Google Sheets.  
    - Input: Output from If node (true branch)  
    - Output: Two outputs - one to Log to Google Sheets and another to Filter Stuck Deals  
    - Edge cases: Data parsing errors; date/time inconsistencies.

  - **Log to Google Sheets**  
    - Type: Google Sheets node  
    - Configuration: Appends transformed data rows into a designated Google Sheet for historical storage.  
    - Input: From Transform Stage Data  
    - Output: Passes to Calculate Stage Metrics  
    - Edge cases: Authentication issues with Google API, sheet access permissions, quota limits.

  - **Filter Stuck Deals (7+ Days)**  
    - Type: If node  
    - Configuration: Filters deals that have been in the current stage for more than 7 days (threshold configurable).  
    - Input: From Transform Stage Data  
    - Output: True branch leads to Generate Stuck Deal Alert  
    - Edge cases: Date calculation errors, deals with missing timestamps.

#### 2.3 Metrics Aggregation & Reporting

- **Overview:** Aggregates pipeline metrics, identifies bottleneck stages, and creates weekly performance report content.
- **Nodes Involved:**  
  - Calculate Stage Metrics  
  - Generate Weekly Report  
  - Send Weekly Report Email

- **Node Details:**

  - **Calculate Stage Metrics**  
    - Type: Code node (JavaScript)  
    - Configuration: Aggregates collected data to compute metrics like average time in stage, counts, bottlenecks.  
    - Input: Output from Log to Google Sheets  
    - Output: Passes aggregated metrics to Generate Weekly Report  
    - Edge cases: Data aggregation errors, empty datasets.

  - **Generate Weekly Report**  
    - Type: Code node (JavaScript)  
    - Configuration: Generates the weekly report as HTML and plain text for email delivery.  
    - Input: From Calculate Stage Metrics  
    - Output: Passes to Send Weekly Report Email  
    - Edge cases: Formatting errors, encoding issues.

  - **Send Weekly Report Email**  
    - Type: Gmail node  
    - Configuration: Sends the weekly report email to sales leadership list. Requires Gmail OAuth2 credentials.  
    - Input: From Generate Weekly Report  
    - Output: None (end node)  
    - Edge cases: Gmail API rate limits, authentication expiration, email delivery failures.

#### 2.4 Stuck Deal Filtering & Alerting

- **Overview:** For deals stuck longer than threshold, creates alert emails and pushes notifications via Gmail and Slack.
- **Nodes Involved:**  
  - Generate Stuck Deal Alert  
  - Send Stuck Deal Alert  
  - Send a message (Slack)

- **Node Details:**

  - **Generate Stuck Deal Alert**  
    - Type: Code node (JavaScript)  
    - Configuration: Builds alert email content for each stuck deal.  
    - Input: From Filter Stuck Deals (7+ Days) true branch  
    - Output: Passes alert content to Send Stuck Deal Alert and Send a message (Slack)  
    - Edge cases: Empty alert content if input malformed.

  - **Send Stuck Deal Alert**  
    - Type: Gmail node  
    - Configuration: Sends alert emails to sales manager(s) only; customer emails excluded for security. Uses Gmail OAuth2.  
    - Input: From Generate Stuck Deal Alert  
    - Output: None  
    - Edge cases: Authentication, sending limits, incorrect recipient setup.

  - **Send a message**  
    - Type: Slack node  
    - Configuration: Sends Slack notification message about stuck deals to designated channel/webhook.  
    - Input: From Generate Stuck Deal Alert  
    - Output: None  
    - Edge cases: Slack webhook URL invalid, network failures.

#### 2.5 Error Handling

- **Overview:** Sends an email alert if any upstream node fails or if the pipeline data fetch returns empty.
- **Nodes Involved:**  
  - Send Error Alert

- **Node Details:**

  - **Send Error Alert**  
    - Type: Gmail node  
    - Configuration: Sends error notification email to administrator or monitoring address on workflow failure or empty data fetch.  
    - Input: From If node false branch  
    - Output: None  
    - Edge cases: Email sending issues, unreliable error detection if upstream failures aren’t caught.

---

### 3. Summary Table

| Node Name                  | Node Type                 | Functional Role                        | Input Node(s)                | Output Node(s)                      | Sticky Note                                                                                      |
|----------------------------|---------------------------|-------------------------------------|------------------------------|-----------------------------------|------------------------------------------------------------------------------------------------|
| Weekly Trigger - Monday 8AM | Schedule Trigger          | Starts workflow weekly               | None                         | Fetch GHL Pipeline Data           |                                                                                                |
| Fetch GHL Pipeline Data     | GoHighLevel API           | Retrieves pipeline data              | Weekly Trigger - Monday 8AM  | If                               | Retrieves all opportunities from GoHighLevel. Configure pipeline filter if needed.              |
| If                         | If Node                  | Validates data fetch success         | Fetch GHL Pipeline Data       | Transform Stage Data, Send Error Alert |                                                                                                |
| Send Error Alert            | Gmail                     | Sends email if data fetch fails      | If (false branch)             | None                             | Sends an email when the workflow fails                                                         |
| Transform Stage Data        | Code                      | Calculates time in each stage        | If (true branch)              | Log to Google Sheets, Filter Stuck Deals (7+ Days) | Calculates time spent in each stage and prepares data for Google Sheets                         |
| Log to Google Sheets        | Google Sheets             | Stores historical pipeline data      | Transform Stage Data          | Calculate Stage Metrics           | Stores historical pipeline data for tracking trends over time                                  |
| Filter Stuck Deals (7+ Days)| If Node                  | Filters deals stuck 7+ days          | Transform Stage Data          | Generate Stuck Deal Alert         | Triggers if deal is in current stage for more than 7 days (configurable)                       |
| Calculate Stage Metrics     | Code                      | Aggregates metrics, bottleneck IDs  | Log to Google Sheets          | Generate Weekly Report            | Aggregates metrics and identifies bottleneck stages                                            |
| Generate Weekly Report      | Code                      | Generates email report content       | Calculate Stage Metrics       | Send Weekly Report Email          | Generates HTML and text versions of the weekly report                                         |
| Send Weekly Report Email    | Gmail                     | Sends weekly report to leadership    | Generate Weekly Report        | None                             | Delivers weekly performance report to sales leadership                                        |
| Generate Stuck Deal Alert   | Code                      | Creates alert email content          | Filter Stuck Deals (7+ Days)  | Send Stuck Deal Alert, Send a message (Slack) | Creates alert email for deals stuck longer than threshold                                     |
| Send Stuck Deal Alert       | Gmail                     | Sends stuck deal alert email         | Generate Stuck Deal Alert     | None                             | Sends alert to sales manager when deals are stuck (SECURITY FIX: no longer sends to customer email) |
| Send a message             | Slack                     | Sends Slack notification             | Generate Stuck Deal Alert     | None                             |                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set to trigger weekly on Monday at 08:00 AM.

2. **Create GoHighLevel Node**  
   - Type: GoHighLevel  
   - Configure API credentials.  
   - Set action to fetch all pipeline opportunities (optionally filter by pipeline).  
   - Connect Schedule Trigger output to this node’s input.

3. **Create If Node for Data Validation**  
   - Check if the data from GoHighLevel node exists and is non-empty (e.g., `{{$json["length"] > 0}}`).  
   - Connect GoHighLevel node output to this node.

4. **Create Gmail Node for Error Alert**  
   - Configure Gmail OAuth2 credentials.  
   - Configure to send an email alert to admin if data fetch failed.  
   - Connect If node’s false output to this node.

5. **Create Code Node to Transform Stage Data**  
   - Write JavaScript code to calculate how long each deal has been in its current pipeline stage and prepare data formatted for Google Sheets.  
   - Connect If node’s true output to this node.

6. **Create Google Sheets Node**  
   - Configure credentials and target spreadsheet/tab for storing pipeline data.  
   - Set operation to append rows.  
   - Connect Transform Stage Data node output to this node.

7. **Create If Node to Filter Stuck Deals**  
   - Logic to filter deals where time in current stage exceeds 7 days (adjustable parameter).  
   - Connect Transform Stage Data node output (second output) to this node.

8. **Create Code Node to Calculate Stage Metrics**  
   - Aggregate historical data, calculate averages, counts, and identify bottleneck stages.  
   - Connect Google Sheets node output to this node.

9. **Create Code Node to Generate Weekly Report**  
   - Generate report content in both HTML and plain text using aggregated metrics.  
   - Connect Calculate Stage Metrics output to this node.

10. **Create Gmail Node to Send Weekly Report Email**  
    - Configure Gmail OAuth2 credentials.  
    - Set recipients to sales leadership.  
    - Connect Generate Weekly Report output to this node.

11. **Create Code Node to Generate Stuck Deal Alert Content**  
    - Create alert message content for deals stuck longer than threshold.  
    - Connect Filter Stuck Deals (7+ Days) node’s true output to this node.

12. **Create Gmail Node to Send Stuck Deal Alert**  
    - Configure Gmail OAuth2 credentials.  
    - Set recipients to sales manager(s) (exclude customer emails).  
    - Connect Generate Stuck Deal Alert output to this node.

13. **Create Slack Node to Send Notification**  
    - Configure Slack webhook URL or OAuth credentials.  
    - Send message alerting stuck deals.  
    - Connect Generate Stuck Deal Alert output to this node.

14. **Connect Nodes in Proper Order**  
    - Schedule Trigger → Fetch GHL Pipeline Data → If →  
      - True → Transform Stage Data → Log to Google Sheets → Calculate Stage Metrics → Generate Weekly Report → Send Weekly Report Email  
      - True → Transform Stage Data (second output) → Filter Stuck Deals (7+ Days) → Generate Stuck Deal Alert → Send Stuck Deal Alert & Slack message  
      - False → Send Error Alert

15. **Test Entire Workflow**  
    - Validate credentials for GoHighLevel, Google Sheets, Gmail, Slack.  
    - Run workflow manually to verify data fetch, transformation, alerting, and reporting.

---

### 5. General Notes & Resources

| Note Content                                                                                  | Context or Link                                                                                  |
|-----------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| SECURITY FIX: Stuck deal alert email no longer sends to customer email addresses.             | Important security improvement in Send Stuck Deal Alert node.                                  |
| GoHighLevel API documentation: https://developers.gohighlevel.com/reference                   | Reference for configuring GoHighLevel node.                                                    |
| Gmail OAuth2 setup guide: https://developers.google.com/gmail/api/quickstart/js                | Necessary for Gmail nodes authentication.                                                      |
| Slack webhook setup: https://api.slack.com/messaging/webhooks                                  | Required to configure Slack node for notifications.                                            |
| Sample Google Sheets template recommended for storing pipeline data with appropriate columns. | Facilitates consistent historical data logging for trend analysis.                             |

---

**Disclaimer:** The provided text is derived exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects applicable content policies and contains no illegal, offensive or protected elements. All handled data is legal and public.