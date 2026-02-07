Automate Client Renewal Alerts from GoHighLevel to Gmail, Slack & Google Sheets

https://n8nworkflows.xyz/workflows/automate-client-renewal-alerts-from-gohighlevel-to-gmail--slack---google-sheets-10147


# Automate Client Renewal Alerts from GoHighLevel to Gmail, Slack & Google Sheets

### 1. Workflow Overview

This workflow, titled **"Automate Client Renewal Alerts from GoHighLevel to Gmail, Slack & Google Sheets"**, is designed to automate the process of notifying clients and internal teams about upcoming contract renewals. Its use cases focus on improving client retention by timely reminders and ensuring internal stakeholders are informed for follow-up.

The workflow runs **daily at 9 AM**, fetches client data from the GoHighLevel CRM, filters clients whose contracts expire within the next 10 days, and then sends personalized renewal emails to clients via Gmail. Simultaneously, it notifies account managers and relevant teams through Slack. All actions and summaries are logged into Google Sheets for tracking and analysis.

Logical blocks include:

- **1.1 Scheduled Trigger:** Initiates the workflow daily at 9 AM.
- **1.2 Data Retrieval:** Fetches all contacts from GoHighLevel CRM.
- **1.3 Data Validation:** Checks presence of necessary custom fields.
- **1.4 Contract Expiry Filtering:** Filters clients with contracts expiring within 0-10 days.
- **1.5 Notification Dispatch:** Sends renewal emails to clients and Slack alerts to teams.
- **1.6 Results Aggregation and Logging:** Summarizes actions and logs the data into Google Sheets.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger

- **Overview:** Initiates the workflow every day at 9:00 AM server time to ensure timely execution of renewal alerts.
- **Nodes Involved:**  
  - `Schedule Daily at 9 AM`  
  - `Sticky Note1` (contextual information)
- **Node Details:**

  - **Schedule Daily at 9 AM**  
    - Type: Schedule Trigger  
    - Configuration: Cron expression `0 9 * * *` (fires daily at 9:00 AM)  
    - Input: None (trigger node)  
    - Output: Starts the workflow chain by connecting to fetching contacts  
    - Edge Cases: Server time zone differences may cause timing shifts; consider server timezone settings.  
    - Version: 1.1

  - **Sticky Note1**  
    - Type: Sticky Note (documentation only)  
    - Content explains rationale for 9 AM execution time.

#### 1.2 Data Retrieval

- **Overview:** Fetches all contacts from GoHighLevel CRM to process for contract renewals.
- **Nodes Involved:**  
  - `Fetch Contacts from GoHighLevel`  
  - `Sticky Note2` (setup instructions)
- **Node Details:**

  - **Fetch Contacts from GoHighLevel**  
    - Type: GoHighLevel Node (official integration node)  
    - Configuration:  
      - Operation: `getAll` (fetch all contacts)  
      - Filters: none applied (fetch all contacts)  
      - Limit: default 50 (adjustable as per note)  
    - Credentials: Connected via OAuth2 (`HighLevel account 2`)  
    - Input: Trigger from schedule  
    - Output: List of contacts with full data including custom fields  
    - Edge Cases: API rate limits, missing permissions, large data sets may require pagination or increased limits  
    - Version: 2

  - **Sticky Note2**  
    - Contains instructions regarding required custom fields (Contract End Date and Account Manager)  
    - Notes on adjusting fetch limit for large datasets.

#### 1.3 Data Validation

- **Overview:** Ensures that each contact has the required custom fields before further processing to avoid errors.
- **Nodes Involved:**  
  - `Check Has Custom Fields` (IF node)  
  - `Sticky Note3` (validation importance)
- **Node Details:**

  - **Check Has Custom Fields**  
    - Type: IF node (conditional check)  
    - Configuration: Checks that the `customFields` array is not empty for each contact  
    - Input: Contacts from GoHighLevel node  
    - Output: Passes only contacts with non-empty custom fields to next block  
    - Edge Cases: Missing custom fields will filter out contacts silently, which may cause missed renewals if fields are not set properly  
    - Version: 2.2

  - **Sticky Note3**  
    - Explains importance of data quality validation for workflow reliability.

#### 1.4 Contract Expiry Filtering

- **Overview:** Filters contacts to those whose contract end dates fall within the next 10 days.
- **Nodes Involved:**  
  - `Filter Renewals Code` (Code node)  
  - `Verify Expiring Within 10 Days` (Filter node)  
  - `Sticky Note4` (filter logic explanation)
- **Node Details:**

  - **Filter Renewals Code**  
    - Type: Code node (JavaScript)  
    - Configuration:  
      - Retrieves contract end date and account manager custom fields by their IDs (placeholders `YOUR_CONTRACT_END_DATE_FIELD_ID` and `YOUR_ACCOUNT_MANAGER_FIELD_ID` must be replaced)  
      - Calculates days until expiry by comparing contract end date with current date  
      - Filters contacts with 0-10 days remaining  
      - Formats contract end date for display  
      - Outputs enriched contact information including account manager and tags  
    - Input: Contacts with custom fields  
    - Output: Filtered contacts with enriched data  
    - Edge Cases:  
      - Missing or incorrect custom field IDs will cause no contacts to pass filter  
      - Date parsing errors if field format is inconsistent  
      - Timezone differences may affect day calculation  
    - Version: 2

  - **Verify Expiring Within 10 Days**  
    - Type: Filter node  
    - Configuration:  
      - Confirms `daysUntilExpiry` ≤ 10 and non-empty `contractEndDate` string  
    - Input: Output from code node  
    - Output: Contacts confirmed to expire within 10 days to next nodes  
    - Edge Cases: If the code node outputs unexpected data, this may filter out valid contacts  
    - Version: 1

  - **Sticky Note4**  
    - Explains filtering logic and customization options for reminder window length.

#### 1.5 Notification Dispatch

- **Overview:** Sends personalized renewal reminder emails to clients and sends Slack notifications to internal teams.
- **Nodes Involved:**  
  - `Send Renewal Email via Gmail` (Gmail node)  
  - `Send Slack Alert to Team` (Slack node)  
  - `Merge Email and Slack Results` (Merge node)  
  - `Sticky Note5` (email setup)  
  - `Sticky Note6` (Slack setup)
- **Node Details:**

  - **Send Renewal Email via Gmail**  
    - Type: Gmail node (email sending)  
    - Configuration:  
      - Recipient: dynamic email `={{ $json.email }}`  
      - Subject: "Important: Your Contract Renewal is Coming Up"  
      - Message: Personalized with first name, last name, contract end date, company name, and a friendly reminder  
      - Credentials: Gmail account connected  
    - Input: Filtered contacts expiring soon  
    - Output: Email sent confirmation data  
    - Edge Cases:  
      - Missing or invalid email address will cause send failure  
      - Gmail API quota or auth errors  
      - Template variables must be present, or message may have placeholders  
    - Version: 2.1

  - **Send Slack Alert to Team**  
    - Type: Slack node  
    - Configuration:  
      - Channel: Specified by Slack channel ID (placeholder `YOUR_SLACK_CHANNEL_ID`)  
      - Message: Includes client name, email, company, contract expiry details, days remaining, account manager, and confirmation of email sent  
      - Credentials: Connected Slack workspace  
    - Input: Same filtered contacts as email node  
    - Output: Slack message confirmation  
    - Edge Cases:  
      - Invalid channel ID or permissions cause failure  
      - Slack API rate limits or connectivity issues  
    - Version: 2.1

  - **Merge Email and Slack Results**  
    - Type: Merge node  
    - Configuration: Combines outputs of email and Slack nodes by position to synchronize results  
    - Input: Outputs from Gmail and Slack nodes  
    - Output: Combined results forwarded for reporting  
    - Edge Cases: If one path fails or data mismatches, merge may cause errors or incomplete data  
    - Version: 2.1

  - **Sticky Note5 & Sticky Note6**  
    - Provide setup instructions, recommended channels, and best practices for email and Slack notifications.

#### 1.6 Results Aggregation and Logging

- **Overview:** Summarizes the workflow execution and logs the results into Google Sheets for audit and tracking.
- **Nodes Involved:**  
  - `Generate Summary Report` (Code node)  
  - `Log Results to Google Sheets` (Google Sheets node)  
  - `Sticky Note7` (summary explanation)  
  - `Sticky Note8` (Google Sheets setup)
- **Node Details:**

  - **Generate Summary Report**  
    - Type: Code node  
    - Configuration:  
      - Counts total reminders sent (based on merged results)  
      - Generates timestamp and success message  
      - Outputs summary JSON object  
    - Input: Merged email and Slack results  
    - Output: Summary data for logging  
    - Edge Cases: If previous nodes fail or output empty data, summary may be inaccurate  
    - Version: 2

  - **Log Results to Google Sheets**  
    - Type: Google Sheets node  
    - Configuration:  
      - Operation: Append or update rows in specified sheet  
      - Columns mapped: summary, totalRemindersSent, timestamp, message  
      - Spreadsheet and sheet specified by user (`YOUR_GOOGLE_SHEET_ID`, `Sheet1`)  
      - Credentials: Google account connected  
    - Input: Summary report data  
    - Output: Confirmation of logging  
    - Edge Cases:  
      - Missing or incorrect spreadsheet ID or sheet name causes errors  
      - Google API quota or auth failures  
    - Version: 4.7

  - **Sticky Note7 & Sticky Note8**  
    - Explain the purpose of reporting and provide setup steps for Google Sheets logging.

---

### 3. Summary Table

| Node Name                       | Node Type              | Functional Role                               | Input Node(s)                   | Output Node(s)                     | Sticky Note                                                                                           |
|--------------------------------|------------------------|-----------------------------------------------|--------------------------------|----------------------------------|------------------------------------------------------------------------------------------------------|
| Sticky Note                    | Sticky Note            | Documentation overview of entire workflow    | None                           | None                             | ## 🔄 Client Retention Renewal Reminder Workflow ... (full content as above)                         |
| Sticky Note1                   | Sticky Note            | Explains schedule trigger setup and rationale| None                           | None                             | ## ⏰ Schedule Trigger Setup ... (runs daily at 9 AM explanation)                                   |
| Schedule Daily at 9 AM         | Schedule Trigger       | Triggers workflow daily at 9 AM               | None                           | Fetch Contacts from GoHighLevel  |                                                                                                      |
| Sticky Note2                   | Sticky Note            | Instructions for fetching contacts and required fields | None                     | None                             | ## 📥 Fetch Contacts from CRM ... (custom fields info and setup)                                    |
| Fetch Contacts from GoHighLevel| GoHighLevel Node       | Retrieves all contacts from GoHighLevel CRM   | Schedule Daily at 9 AM         | Check Has Custom Fields           |                                                                                                      |
| Sticky Note3                   | Sticky Note            | Explains importance of data validation        | None                           | None                             | ## 🔍 Validate Data Quality ... (why validate custom fields)                                        |
| Check Has Custom Fields        | IF Node                | Filters contacts missing custom fields        | Fetch Contacts from GoHighLevel| Filter Renewals Code              |                                                                                                      |
| Sticky Note4                   | Sticky Note            | Explains filtering logic for expiring contracts| None                        | None                             | ## 🎯 Filter Expiring Contracts ... (0-10 days filter explanation)                                  |
| Filter Renewals Code           | Code Node              | Filters contacts with contracts expiring soon | Check Has Custom Fields        | Verify Expiring Within 10 Days    |                                                                                                      |
| Verify Expiring Within 10 Days | Filter Node            | Confirms contacts expire within 10 days       | Filter Renewals Code           | Send Renewal Email via Gmail, Send Slack Alert to Team |                                                                                                      |
| Sticky Note5                   | Sticky Note            | Instructions for sending renewal emails       | None                           | None                             | ## 📧 Send Client Email ... (Gmail setup and variables)                                             |
| Send Renewal Email via Gmail   | Gmail Node             | Sends personalized renewal emails to clients | Verify Expiring Within 10 Days | Merge Email and Slack Results     |                                                                                                      |
| Sticky Note6                   | Sticky Note            | Explains Slack notification setup             | None                           | None                             | ## 📢 Slack Team Notification ... (channel and message setup)                                      |
| Send Slack Alert to Team       | Slack Node             | Sends Slack notifications for renewals        | Verify Expiring Within 10 Days | Merge Email and Slack Results     |                                                                                                      |
| Merge Email and Slack Results  | Merge Node             | Combines email and Slack send results         | Send Renewal Email via Gmail, Send Slack Alert to Team | Generate Summary Report          |                                                                                                      |
| Sticky Note7                   | Sticky Note            | Explains summary report generation             | None                           | None                             | ## 📊 Generate Summary Report ... (tracking workflow performance)                                  |
| Generate Summary Report        | Code Node              | Creates summary of reminders sent and timestamp| Merge Email and Slack Results | Log Results to Google Sheets      |                                                                                                      |
| Sticky Note8                   | Sticky Note            | Explains Google Sheets logging setup           | None                           | None                             | ## 📝 Log to Google Sheets ... (setup instructions)                                                |
| Log Results to Google Sheets   | Google Sheets Node     | Logs summary data to Google Sheets             | Generate Summary Report        | None                             |                                                                                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n and name it accordingly.**

2. **Add a Schedule Trigger node:**
   - Type: Schedule Trigger  
   - Cron Expression: `0 9 * * *` to run daily at 9 AM server time  
   - Position appropriately (start of workflow).

3. **Add a GoHighLevel node to fetch contacts:**
   - Operation: `getAll`  
   - Connect OAuth2 credentials for GoHighLevel account  
   - Set limit (default 50, increase if needed)  
   - Connect output of Schedule Trigger to this node.

4. **Add an IF node to check for the presence of custom fields:**
   - Condition: `customFields` array **not empty**  
   - Connect output from GoHighLevel node to this IF node.  
   - Pass contacts having custom fields to the next node.

5. **Add a Code node to filter contacts with expiring contracts:**
   - Paste JavaScript code that:  
     - Gets current date at midnight  
     - Iterates over input contacts  
     - Finds `Contract End Date` and `Account Manager` custom fields (replace placeholders with your actual field IDs)  
     - Parses and compares contract end date to current date  
     - Filters contacts expiring in 0-10 days  
     - Formats and enriches contact data  
   - Connect the IF node's "true" output to this node.

6. **Add a Filter node to confirm expiry within 10 days:**
   - Conditions:  
     - `daysUntilExpiry` ≤ 10  
     - `contractEndDate` is not empty  
   - Connect output of Code node to this node.

7. **Add Gmail node to send renewal emails:**
   - Connect Gmail OAuth2 credentials  
   - Set recipient email to `={{ $json.email }}`  
   - Customize subject and body text using variables like `firstName`, `lastName`, `contractEndDate`, `companyName`  
   - Connect Filter node output to this node.

8. **Add Slack node to send renewal alerts:**
   - Connect Slack credentials  
   - Select appropriate Slack channel by ID (replace placeholder)  
   - Customize message with client and contract details and confirmation of email sent  
   - Connect Filter node output to this node.

9. **Add a Merge node:**
   - Mode: Combine  
   - Combination mode: Merge by position  
   - Connect Gmail node output to Merge node input 1  
   - Connect Slack node output to Merge node input 2

10. **Add a Code node to generate a summary report:**
    - JavaScript to count total reminders sent, generate timestamp, and create a message string  
    - Connect Merge node output to this node.

11. **Add Google Sheets node to log the summary:**
    - Connect Google OAuth2 credentials  
    - Set operation to append or update rows  
    - Select the spreadsheet and sheet (e.g., `Sheet1`)  
    - Map columns: summary, totalRemindersSent, timestamp, message  
    - Connect summary report node output to this node.

12. **Add Sticky Notes throughout the workflow to document each step** (optional but recommended for clarity).

13. **Replace all placeholder values:**
    - GoHighLevel custom field IDs for Contract End Date and Account Manager  
    - Slack channel ID for renewal notifications  
    - Google Sheets spreadsheet ID and sheet name

14. **Test the workflow with sample data:**
    - Verify emails are sent correctly  
    - Slack messages appear in the correct channel  
    - Google Sheets logs data as expected  
    - Check error handling (e.g., missing emails or custom fields).

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                 | Context or Link                                                                                 |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow is designed to run daily at 9 AM to maximize business hour engagement for contract renewal communications.                                                                                                                   | Sticky Note1                                                                                   |
| Replace all placeholder IDs (`YOUR_CONTRACT_END_DATE_FIELD_ID`, `YOUR_ACCOUNT_MANAGER_FIELD_ID`, `YOUR_SLACK_CHANNEL_ID`, `YOUR_GOOGLE_SHEET_ID`) with actual values from your environment before activating the workflow.                   | Multiple Sticky Notes including 2, 4, 6, and node parameters                                   |
| Gmail and Slack credentials must have appropriate permissions to send messages; ensure OAuth2 tokens are valid and refreshed.                                                                                                              | Relevant nodes (Gmail, Slack)                                                                |
| Google Sheets must have columns matching the workflow schema (summary, totalRemindersSent, timestamp, message) in the selected sheet for logging to work correctly.                                                                       | Sticky Note8                                                                                   |
| Test with a small data set or a single contact first to verify message formatting and connectivity before scaling up.                                                                                                                      | Sticky Note5 (email best practice)                                                            |
| Consider handling API rate limits and adding error handling or retries for production deployments if client base is large.                                                                                                                | Best practice suggestion (not in workflow)                                                   |
| The contract end date is expected to be stored as a timestamp or ISO date string in the GoHighLevel custom field; inconsistent formats may cause filtering errors.                                                                         | Sticky Note4 and Code node comments                                                           |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created using n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.