Automate Email Follow-Ups with Gmail & Google Sheets Using Multi-Stage Sequences

https://n8nworkflows.xyz/workflows/automate-email-follow-ups-with-gmail---google-sheets-using-multi-stage-sequences-10696


# Automate Email Follow-Ups with Gmail & Google Sheets Using Multi-Stage Sequences

### 1. Workflow Overview

This workflow automates the process of sending email follow-ups to leads using Gmail and Google Sheets, following a predefined multi-stage sequence (Day 1, Day 3, Day 7, Day 14). Its primary use case is to maintain consistent, timely contact with prospects without manual intervention, improving lead nurturing and conversion rates.

The workflow is logically divided into these blocks:

- **1.1 Scheduled Trigger and Data Retrieval**: Runs daily at 9 AM, fetching all leads from the Google Sheet tracker.
- **1.2 Filtering and Queueing Leads**: Filters leads due for follow-up today and queues them to process individually.
- **1.3 Routing and Sending Stage-Specific Emails**: Routes each lead to the correct follow-up stage and sends the corresponding email template.
- **1.4 Updating Lead Status and Scheduling Next Follow-Up**: Updates the last sent date and calculates the next follow-up date and stage in the Google Sheet.
- **1.5 Setup and Customization Guidance**: Embedded sticky notes provide instructions, customization options, and troubleshooting tips.

---

### 2. Block-by-Block Analysis

#### Block 1.1: Scheduled Trigger and Data Retrieval

- **Overview**: This block initiates the workflow daily at 9 AM and reads the entire list of follow-up leads from a specified Google Sheet.
- **Nodes Involved**:  
  - `Daily at 9 AM`  
  - `Read All Follow-Up Leads`

##### Node: Daily at 9 AM
- **Type & Role**: Schedule Trigger — starts the workflow automatically every day at 9:00 AM.
- **Configuration**: Uses a cron expression `0 9 * * *` for daily trigger.
- **Input/Output**: No input; outputs trigger event to the next node.
- **Edge Cases**: Workflow won’t run if the n8n instance is offline at trigger time.
- **Version**: 1.2

##### Node: Read All Follow-Up Leads
- **Type & Role**: Google Sheets — reads all rows from the "Follow-Up Tracker" sheet.
- **Configuration**: 
  - Document ID: User to replace `"YOUR_GOOGLE_SHEET_ID"`.
  - Sheet Name: `"Follow-Up Tracker"`
  - Credentials: Google Sheets OAuth2 (`xavtwl`).
- **Input/Output**: Input from Schedule Trigger; outputs all lead rows.
- **Edge Cases**:  
  - Authentication failures on Google Sheets API.  
  - Missing or invalid Sheet ID or sheet name.  
  - Empty or malformed data rows.
- **Version**: 4.7

---

#### Block 1.2: Filtering and Queueing Leads

- **Overview**: Filters leads whose "Next Follow-Up Date" matches today's date and whose status is "Active." Then processes these leads one at a time to avoid rate limits.
- **Nodes Involved**:  
  - `Filter Today's Follow-Ups`  
  - `Process One at a Time`

##### Node: Filter Today's Follow-Ups
- **Type & Role**: Filter — selects leads scheduled for follow-up today and with "Active" status.
- **Configuration**:  
  - Conditions:  
    - `Next Follow-Up Date` equals today’s date (`$now.format('yyyy-MM-dd')`).  
    - `Status` equals `"Active"`.
  - Case sensitive and strict validation enabled.
- **Input/Output**: Inputs all leads; outputs filtered leads.
- **Edge Cases**:  
  - Date format mismatches causing filter failure.  
  - Variations in "Status" field spelling or casing.
- **Version**: 2.2

##### Node: Process One at a Time
- **Type & Role**: SplitInBatches — splits the filtered leads into single-item batches for sequential processing.
- **Configuration**: Default batch size (1).
- **Input/Output**: Inputs filtered leads; outputs one lead item at a time.
- **Edge Cases**: Large lead volumes may slow processing; batch size can be adjusted.
- **Version**: 3

---

#### Block 1.3: Routing and Sending Stage-Specific Emails

- **Overview**: Routes each queued lead to the correct follow-up stage (Day 1, 3, 7, or 14) and sends the appropriate Gmail email template.
- **Nodes Involved**:  
  - `Route by Follow-Up Stage`  
  - `Send Day 1 Follow-Up`  
  - `Send Day 3 Follow-Up`  
  - `Send Day 7 Follow-Up`  
  - `Send Day 14 Final Follow-Up`

##### Node: Route by Follow-Up Stage
- **Type & Role**: Switch — routes leads based on the "Stage" field.
- **Configuration**:  
  - Four outputs corresponding to stages `"Day 1"`, `"Day 3"`, `"Day 7"`, and `"Day 14"`.
  - Exact string matching on `$json['Stage']` (case sensitive).
- **Input/Output**: Input from batch processor; routes to one of four email nodes.
- **Edge Cases**:  
  - Mismatched stage strings causing leads to be dropped.  
  - Missing or empty "Stage" field.
- **Version**: 3.2

##### Node: Send Day 1 Follow-Up (similar for Day 3, Day 7, Day 14)
- **Type & Role**: Gmail — sends personalized follow-up email for the given stage.
- **Configuration**:  
  - Recipient: `$json['Email']`  
  - Subject and HTML message use templated expressions interpolating lead details (`Name`, `Project/Interest`, `Timeline`, `Next Step`).  
  - Gmail OAuth2 credentials (`XavEasyScalers`).  
  - Customizable placeholders for calendar/resource links (`YOUR_CALENDAR_LINK`, `YOUR_RESOURCE_LINK`).  
- **Input/Output**: Inputs lead data; outputs to `Update Last Sent Date` node.
- **Edge Cases**:  
  - Gmail API/credential errors.  
  - Missing or malformed email addresses.  
  - Template expression errors if fields missing.  
  - Gmail sending limits (500/day for free accounts).
- **Version**: 2.1

---

#### Block 1.4: Updating Lead Status and Scheduling Next Follow-Up

- **Overview**: After sending an email, updates the Google Sheet with the current date as the last sent date, updates the Stage to the next step, and schedules the next follow-up date; marks the sequence complete after Day 14.
- **Nodes Involved**:  
  - `Update Last Sent Date`  
  - `Calculate Next Follow-Up`

##### Node: Update Last Sent Date
- **Type & Role**: Google Sheets — updates `"Last Sent Date"` to today for the lead.
- **Configuration**:  
  - Matches lead by `"Email"`.  
  - Writes current date (`$now.format('yyyy-MM-dd')`) to `"Last Sent Date"`.  
  - Uses Google Sheets OAuth2 credentials.
- **Input/Output**: Input from Gmail send node; outputs to next update node.
- **Edge Cases**:  
  - Sheet update failures due to incorrect ID or OAuth2 issues.  
  - Email not found in sheet.
- **Version**: 4.7

##### Node: Calculate Next Follow-Up
- **Type & Role**: Google Sheets — updates lead's `"Stage"`, `"Status"`, and `"Next Follow-Up Date"` based on the current stage.
- **Configuration**:  
  - Logic for next stage:  
    - Day 1 → Day 3  
    - Day 3 → Day 7  
    - Day 7 → Day 14  
    - Day 14 → Complete  
  - Status set to `"Completed"` after Day 14, else `"Active"`.  
  - Next Follow-Up Date set by adding days: 2 after Day 1, 4 after Day 3, 7 after Day 7, 0 after Day 14.  
  - Matches by `"Email"`.
- **Input/Output**: Input from last sent date update; no direct output.
- **Edge Cases**:  
  - Date calculation errors if stage value unexpected.  
  - Failures updating Google Sheet.
- **Version**: 4.7

---

#### Block 1.5: Setup and Customization Guidance (Sticky Notes)

- **Overview**: Several sticky notes provide detailed setup instructions, block purpose explanations, customization options, and troubleshooting tips.
- **Nodes Involved**: Sticky Notes:  
  - `Sticky Note` (Main overview and setup)  
  - `Sticky Note1` (Step 1 explanation)  
  - `Sticky Note2` (Step 2 explanation)  
  - `Sticky Note3` (Step 3 explanation)  
  - `Sticky Note4` (Step 4 explanation)  
  - `Sticky Note5` (Customization and troubleshooting)

---

### 3. Summary Table

| Node Name               | Node Type               | Functional Role                           | Input Node(s)           | Output Node(s)                 | Sticky Note                                                                                       |
|-------------------------|-------------------------|-----------------------------------------|-------------------------|-------------------------------|-------------------------------------------------------------------------------------------------|
| Daily at 9 AM           | Schedule Trigger        | Starts workflow daily at 9 AM           | —                       | Read All Follow-Up Leads       | Sticky Note1: Purpose: Trigger daily and load leads.                                            |
| Read All Follow-Up Leads| Google Sheets           | Reads all leads from tracker sheet      | Daily at 9 AM           | Filter Today's Follow-Ups      | Sticky Note1                                                                                     |
| Filter Today's Follow-Ups| Filter                  | Filters leads due for follow-up today   | Read All Follow-Up Leads| Process One at a Time          | Sticky Note2: Filter active leads for today.                                                    |
| Process One at a Time    | SplitInBatches          | Queues leads individually                | Filter Today's Follow-Ups| Route by Follow-Up Stage       | Sticky Note2                                                                                     |
| Route by Follow-Up Stage | Switch                  | Routes leads based on current stage     | Process One at a Time    | Send Day 1/3/7/14 Follow-Ups  | Sticky Note3: Route leads to correct follow-up email.                                           |
| Send Day 1 Follow-Up     | Gmail                   | Sends Day 1 follow-up email              | Route by Follow-Up Stage | Update Last Sent Date          | Sticky Note3                                                                                     |
| Send Day 3 Follow-Up     | Gmail                   | Sends Day 3 follow-up email              | Route by Follow-Up Stage | Update Last Sent Date          | Sticky Note3                                                                                     |
| Send Day 7 Follow-Up     | Gmail                   | Sends Day 7 follow-up email              | Route by Follow-Up Stage | Update Last Sent Date          | Sticky Note3                                                                                     |
| Send Day 14 Final Follow-Up| Gmail                 | Sends final Day 14 follow-up email      | Route by Follow-Up Stage | Update Last Sent Date          | Sticky Note3                                                                                     |
| Update Last Sent Date    | Google Sheets           | Updates last sent date in tracker sheet | Send Day X Follow-Up     | Calculate Next Follow-Up       | Sticky Note4: Logs last email sent date.                                                        |
| Calculate Next Follow-Up | Google Sheets           | Updates next stage, status, next date   | Update Last Sent Date    | —                             | Sticky Note4: Calculates next follow-up timing and stage.                                      |
| Sticky Note              | Sticky Note             | Overview, setup instructions             | —                       | —                             | Full workflow explanation, setup, customization, troubleshooting, enhancement ideas.            |
| Sticky Note1             | Sticky Note             | Step 1 description                       | —                       | —                             | Step 1: Start daily run and load leads.                                                        |
| Sticky Note2             | Sticky Note             | Step 2 description                       | —                       | —                             | Step 2: Filter and queue today’s leads.                                                        |
| Sticky Note3             | Sticky Note             | Step 3 description                       | —                       | —                             | Step 3: Send stage-specific emails.                                                            |
| Sticky Note4             | Sticky Note             | Step 4 description                       | —                       | —                             | Step 4: Update timeline and next follow-up.                                                    |
| Sticky Note5             | Sticky Note             | Customization and troubleshooting tips  | —                       | —                             | Customization options, troubleshooting, and enhancement suggestions.                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set cron expression to `0 9 * * *` (runs daily at 9 AM).  
   - Connect output to next node.

2. **Create Google Sheets Node to Read Leads**  
   - Type: Google Sheets  
   - Operation: Read All Rows  
   - Document ID: set to your Google Sheet ID (replace `"YOUR_GOOGLE_SHEET_ID"`).  
   - Sheet Name: `"Follow-Up Tracker"`  
   - Credentials: Google Sheets OAuth2 (configure OAuth2 with access to the sheet).  
   - Connect output from schedule trigger.

3. **Create Filter Node to Select Today's Leads**  
   - Type: Filter  
   - Conditions (AND):  
     - Field `"Next Follow-Up Date"` equals expression `{{$now.format('yyyy-MM-dd')}}`  
     - Field `"Status"` equals `"Active"`  
   - Connect input from Google Sheets read node.

4. **Create SplitInBatches Node to Process One Lead at a Time**  
   - Type: SplitInBatches  
   - Batch Size: 1 (default)  
   - Connect input from Filter node.

5. **Create Switch Node to Route by Stage**  
   - Type: Switch  
   - Rules:  
     - Output 'Day 1' if `"Stage" == "Day 1"`  
     - Output 'Day 3' if `"Stage" == "Day 3"`  
     - Output 'Day 7' if `"Stage" == "Day 7"`  
     - Output 'Day 14' if `"Stage" == "Day 14"`  
   - Connect input from SplitInBatches node.

6. **Create Four Gmail Send Nodes for Each Follow-Up Stage**  
   - Type: Gmail  
   - Credential: Gmail OAuth2 (configure with your Gmail account).  
   - For each node, set:  
     - `Send To`: `{{$json["Email"]}}`  
     - `Subject` and `Message`: Use provided HTML templates with placeholders for `Name`, `Project/Interest`, etc.  
     - Replace placeholder links (`YOUR_CALENDAR_LINK`, `YOUR_RESOURCE_LINK`) with actual URLs.  
   - Connect each output of Switch node to corresponding Gmail node.

7. **Create Google Sheets Node to Update Last Sent Date**  
   - Type: Google Sheets  
   - Operation: Update  
   - Sheet Name: `"Follow-Up Tracker"`  
   - Document ID: same as read node  
   - Matching Column: `"Email"`  
   - Columns to update: `"Last Sent Date"` = `{{$now.format('yyyy-MM-dd')}}`  
   - Connect outputs of all Gmail send nodes to this node.

8. **Create Google Sheets Node to Calculate Next Follow-Up**  
   - Type: Google Sheets  
   - Operation: Update  
   - Sheet Name: `"Follow-Up Tracker"`  
   - Document ID: same as above  
   - Matching Column: `"Email"`  
   - Columns to update with expressions:  
     - `"Stage"`:  
       ```js
       {{$json["Stage"] === "Day 1" ? "Day 3" : $json["Stage"] === "Day 3" ? "Day 7" : $json["Stage"] === "Day 7" ? "Day 14" : "Complete"}}
       ```  
     - `"Status"`:  
       ```js
       {{$json["Stage"] === "Day 14" ? "Completed" : "Active"}}
       ```  
     - `"Next Follow-Up Date"`:  
       ```js
       {{$now.plus({days: $json["Stage"] === "Day 1" ? 2 : $json["Stage"] === "Day 3" ? 4 : $json["Stage"] === "Day 7" ? 7 : 0}).format("yyyy-MM-dd")}}
       ```  
   - Connect input from Update Last Sent Date node.

9. **Add Sticky Notes for Documentation**  
   - Optional but recommended: Add sticky notes describing each block, setup instructions, customization options, and troubleshooting tips.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Context or Link                                                                                                           |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| This workflow automatically manages multi-stage email follow-ups using Gmail and Google Sheets, preventing manual tracking errors and improving lead engagement. Replace all placeholder IDs and URLs before running.                                                                                                                                                                                                                                                                                                                  | Main workflow purpose and customization reminder.                                                                           |
| Google Sheet must have tab named `"Follow-Up Tracker"` with columns: `Name`, `Email`, `Project/Interest`, `Timeline`, `Next Step`, `Stage`, `Next Follow-Up Date`, `Last Sent Date`, `Status`. Ensure `Email` is unique.                                                                                                                                                                                                                                                                                                                   | Sheet setup instructions.                                                                                                  |
| Gmail sending limits (500/day for free accounts) may cause failures if volume is high. Monitor usage accordingly.                                                                                                                                                                                                                                                                                                                                                                                                                   | Gmail usage constraints.                                                                                                   |
| Customize email templates with your branding, calendar links, and resource URLs. Use correct casing in stage and status fields to avoid filtering issues.                                                                                                                                                                                                                                                                                                                                                                            | Template customization notes.                                                                                              |
| Enhancement ideas include adding email open tracking, adding a "Responded" status to pause sequence, Slack notifications, SMS integration via Twilio, and reporting dashboards.                                                                                                                                                                                                                                                                                                                                                        | Suggested workflow improvements.                                                                                           |
| Troubleshooting tips: Verify date formats and exact string matches, check OAuth2 credentials, ensure unique email identifiers, and review sheet permissions.                                                                                                                                                                                                                                                                                                                                                                         | Common issues and solutions.                                                                                               |
| Setup video walkthrough and detailed blog post available at: https://www.n8n.io/workflows/automate-email-follow-ups-with-gmail-google-sheets-multi-stage-sequences                                                                                                                                                                                                                                                                                                                                                                  | Official n8n workflow resource link.                                                                                       |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated n8n workflow. It complies fully with content policies, contains no illegal or offensive material, and processes only legal and public data.