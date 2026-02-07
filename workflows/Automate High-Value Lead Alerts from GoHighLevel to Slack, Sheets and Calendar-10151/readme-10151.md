Automate High-Value Lead Alerts from GoHighLevel to Slack, Sheets and Calendar

https://n8nworkflows.xyz/workflows/automate-high-value-lead-alerts-from-gohighlevel-to-slack--sheets-and-calendar-10151


# Automate High-Value Lead Alerts from GoHighLevel to Slack, Sheets and Calendar

### 1. Workflow Overview

This workflow automates the process of identifying and alerting sales teams about high-value leads from the HighLevel CRM system on a daily basis. It performs scheduled data retrieval, lead scoring, filtering, and multi-channel notifications and logging.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Scheduling**  
  Automatically triggers every day at 8:00 AM to start the lead processing.

- **1.2 Data Fetching from HighLevel CRM**  
  Retrieves all contacts from HighLevel CRM via API.

- **1.3 Data Validation and Transformation**  
  Filters contacts to ensure they have necessary custom fields, then extracts and transforms key data such as lead score and assigned sales rep.

- **1.4 Lead Qualification Filtering**  
  Checks if each contact's lead score exceeds a threshold (default: 80), marking them as high-value leads.

- **1.5 Multi-Channel Notification and Logging**  
  For qualified leads: sends an alert message to a Slack sales channel, logs the lead's details to Google Sheets, and creates a follow-up event in Google Calendar.

Each block is connected in sequence to enable automated, streamlined lead alerting and tracking.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Scheduling

- **Overview:**  
  Initiates the workflow daily at 8 AM.

- **Nodes Involved:**  
  - Daily 8AM Trigger  
  - Schedule Setup Note (sticky note)

- **Node Details:**

  - **Daily 8AM Trigger**  
    - Type: Schedule Trigger  
    - Role: Starts workflow execution every day at 08:00  
    - Configuration: Interval set to trigger at hour 8 daily  
    - Inputs: None  
    - Outputs: Connects to "Fetch HighLevel Contacts" node  
    - Edge cases: Trigger misconfiguration could cause missed runs or multiple runs; time zone considerations apply.

  - **Schedule Setup Note**  
    - Type: Sticky Note  
    - Role: Documentation for scheduling setup and customization  
    - Contains instructions to adjust trigger time as needed.

#### 2.2 Data Fetching from HighLevel CRM

- **Overview:**  
  Retrieves all contacts from HighLevel CRM using OAuth2 credentials.

- **Nodes Involved:**  
  - Fetch HighLevel Contacts  
  - HighLevel Setup Note (sticky note)

- **Node Details:**

  - **Fetch HighLevel Contacts**  
    - Type: HighLevel node  
    - Role: API call to fetch all contacts  
    - Configuration: Operation "getAll", no filters applied  
    - Inputs: From "Daily 8AM Trigger"  
    - Outputs: To "Filter Valid Contacts"  
    - Version-specific: Uses HighLevel node version 2  
    - Edge cases: Large datasets may cause timeouts or API rate limiting; OAuth2 token expiry issues possible.

  - **HighLevel Setup Note**  
    - Type: Sticky Note  
    - Role: Instructions for setting up OAuth2 and API access, caution about large data volumes.

#### 2.3 Data Validation and Transformation

- **Overview:**  
  Filters out contacts lacking custom fields, then extracts key information including lead score and assigned rep from custom fields.

- **Nodes Involved:**  
  - Filter Valid Contacts (IF node)  
  - Transform Contact Data (Code node)  
  - Filter Logic Note (sticky note)  
  - Code Configuration Note (sticky note)

- **Node Details:**

  - **Filter Valid Contacts**  
    - Type: IF node  
    - Role: Check that contact has non-empty "customFields" array  
    - Configuration: Condition tests if `customFields` is not empty  
    - Inputs: From "Fetch HighLevel Contacts"  
    - Outputs: Passes valid contacts to "Transform Contact Data"  
    - Edge cases: Contacts missing custom fields are excluded, preventing errors downstream.

  - **Transform Contact Data**  
    - Type: Code node (JavaScript)  
    - Role: Extract and reformat contact data, including parsing lead score and assigned rep from custom fields  
    - Configuration:  
      - Custom field IDs for lead score and assigned rep must be replaced with actual IDs from HighLevel setup.  
      - Outputs JSON with fields: contact_id, contact_name, first_name, last_name, email, phone, company_name, lead_score (float), assigned_rep, assigned_rep_slack_id (currently same as assigned_rep, to be mapped), location_id, source, tags (comma-separated), country, date_added, date_updated, is_high_priority (boolean if lead_score > 80)  
    - Inputs: From "Filter Valid Contacts"  
    - Outputs: To "Check If High-Value Lead"  
    - Edge cases: Failure if custom field IDs are incorrect or missing; expression errors if input data structure is unexpected.

  - **Filter Logic Note**  
    - Type: Sticky Note  
    - Role: Explains importance of filtering contacts with populated custom fields.

  - **Code Configuration Note**  
    - Type: Sticky Note  
    - Role: Instructions to update custom field IDs for lead score and assigned rep.

#### 2.4 Lead Qualification Filtering

- **Overview:**  
  Filters leads for those with lead score strictly greater than 80.

- **Nodes Involved:**  
  - Check If High-Value Lead (IF node)  
  - Score Threshold Note (sticky note)

- **Node Details:**

  - **Check If High-Value Lead**  
    - Type: IF node  
    - Role: Pass only contacts with lead_score > 80  
    - Configuration: Numeric comparison of lead_score against 80  
    - Inputs: From "Transform Contact Data"  
    - Outputs: Passes qualified leads to notification and logging nodes  
    - Edge cases: Threshold can be adjusted; borderline leads excluded.

  - **Score Threshold Note**  
    - Type: Sticky Note  
    - Role: Explains the threshold and encourages customization.

#### 2.5 Multi-Channel Notification and Logging

- **Overview:**  
  For high-value leads, sends Slack alerts, logs data to Google Sheets, and schedules a calendar event for follow-up.

- **Nodes Involved:**  
  - Send Slack Alert to Sales Team  
  - Log to Google Sheets Tracker  
  - Create Follow-up Calendar Event  
  - Slack Configuration Note (sticky note)  
  - Google Sheets Setup Note (sticky note)  
  - Calendar Setup Note (sticky note)

- **Node Details:**

  - **Send Slack Alert to Sales Team**  
    - Type: Slack node  
    - Role: Sends formatted alert message to a designated Slack channel  
    - Configuration:  
      - Uses Slack API with chat:write permission  
      - Message includes contact name, lead score, contact details, assigned rep, location, and tags  
      - Slack channel ID must be replaced with actual channel ID  
    - Inputs: From "Check If High-Value Lead" (true branch)  
    - Outputs: To "Create Follow-up Calendar Event"  
    - Edge cases: Slack API rate limits, invalid or missing channel ID, credential expiry.

  - **Log to Google Sheets Tracker**  
    - Type: Google Sheets node  
    - Role: Appends lead data to a designated Google Sheet tab "High Priority Leads"  
    - Configuration:  
      - Auto-mapping of input data to columns such as contact_id, lead_score, assigned_rep, tags, dates, etc.  
      - Google Sheet ID must be specified  
      - Requires OAuth2 credentials with write access  
    - Inputs: From "Check If High-Value Lead" (true branch)  
    - Outputs: None (end of branch)  
    - Edge cases: Sheet permission errors, invalid Sheet ID, quota limitations.

  - **Create Follow-up Calendar Event**  
    - Type: Google Calendar node  
    - Role: Creates a calendar event starting 1 hour from execution, ending 1.5 hours from execution, for immediate follow-up  
    - Configuration:  
      - Uses OAuth2 credentials for Google Calendar  
      - Calendar email must be set to team/shared calendar  
      - Event description includes lead details and follow-up instructions  
      - Sends updates to attendee(s)  
    - Inputs: From "Send Slack Alert to Sales Team"  
    - Outputs: None (workflow end)  
    - Edge cases: Calendar permission issues, invalid calendar email, API failures.

  - **Slack Configuration Note**  
    - Type: Sticky Note  
    - Role: Explains Slack App setup, permissions, and channel ID retrieval.

  - **Google Sheets Setup Note**  
    - Type: Sticky Note  
    - Role: Instructions for Google Sheets preparation, sharing, and Sheet ID replacement.

  - **Calendar Setup Note**  
    - Type: Sticky Note  
    - Role: Guidance on Google Calendar connection and event timing adjustment.

---

### 3. Summary Table

| Node Name                    | Node Type           | Functional Role                         | Input Node(s)             | Output Node(s)                      | Sticky Note                                                                                                      |
|------------------------------|---------------------|---------------------------------------|---------------------------|-----------------------------------|-----------------------------------------------------------------------------------------------------------------|
| Workflow Overview            | Sticky Note         | Workflow purpose & setup instructions | None                      | None                              | Describes overall workflow purpose and setup requirements                                                      |
| Schedule Setup Note          | Sticky Note         | Daily trigger documentation           | None                      | None                              | Explains daily 8 AM trigger scheduling and customization                                                       |
| HighLevel Setup Note         | Sticky Note         | HighLevel API setup instructions      | None                      | None                              | Instructions for OAuth2 and API access                                                                         |
| Filter Logic Note            | Sticky Note         | Filtering contacts with custom fields | None                      | None                              | Emphasizes importance of filtering contacts with populated custom fields                                        |
| Code Configuration Note      | Sticky Note         | Custom field ID configuration         | None                      | None                              | Instructs to replace placeholder custom field IDs with actual ones from HighLevel                              |
| Score Threshold Note         | Sticky Note         | Lead score threshold explanation      | None                      | None                              | Explains lead score filter threshold                                                                           |
| Slack Configuration Note     | Sticky Note         | Slack app and channel setup            | None                      | None                              | Slack app creation, permissions, and channel ID retrieval guidance                                             |
| Google Sheets Setup Note     | Sticky Note         | Google Sheets logging setup            | None                      | None                              | How to prepare Google Sheet and configure access                                                              |
| Calendar Setup Note          | Sticky Note         | Google Calendar follow-up event setup | None                      | None                              | Configuration of calendar event timing and calendar email                                                     |
| Daily 8AM Trigger            | Schedule Trigger    | Starts workflow daily at 8 AM          | None                      | Fetch HighLevel Contacts          |                                                                                                                 |
| Fetch HighLevel Contacts     | HighLevel           | Fetches all contacts                   | Daily 8AM Trigger         | Filter Valid Contacts             |                                                                                                                 |
| Filter Valid Contacts        | IF                  | Filters contacts with valid custom fields | Fetch HighLevel Contacts  | Transform Contact Data            |                                                                                                                 |
| Transform Contact Data       | Code                | Extracts and transforms contact data  | Filter Valid Contacts     | Check If High-Value Lead          |                                                                                                                 |
| Check If High-Value Lead     | IF                  | Filters leads with score > 80          | Transform Contact Data    | Send Slack Alert; Log to Sheets   |                                                                                                                 |
| Send Slack Alert to Sales Team | Slack              | Sends alert message to Slack channel  | Check If High-Value Lead  | Create Follow-up Calendar Event  |                                                                                                                 |
| Log to Google Sheets Tracker | Google Sheets       | Logs lead data in tracking sheet      | Check If High-Value Lead  | None                            |                                                                                                                 |
| Create Follow-up Calendar Event | Google Calendar    | Schedules follow-up calendar event    | Send Slack Alert          | None                            |                                                                                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "Daily 8AM Trigger" node**  
   - Type: Schedule Trigger  
   - Set to trigger at 8:00 AM daily (adjust time zone as needed)  
   - No credentials required.

2. **Create "Fetch HighLevel Contacts" node**  
   - Type: HighLevel node  
   - Operation: getAll contacts  
   - Connect OAuth2 credentials for HighLevel  
   - No filters initially (can add filters for large datasets)  
   - Connect input from "Daily 8AM Trigger".

3. **Create "Filter Valid Contacts" node**  
   - Type: IF node  
   - Condition: customFields array is not empty  
   - Configure condition as: `{{$json["customFields"]}}` is not empty  
   - Connect input from "Fetch HighLevel Contacts".

4. **Create "Transform Contact Data" node**  
   - Type: Code (JavaScript) node  
   - Paste the provided script with custom field ID placeholders replaced by your actual HighLevel custom field IDs for:  
     - Lead Score Field  
     - Assigned Rep Field  
   - Output a JSON object with the mapped fields (contact_id, lead_score, assigned_rep, etc.)  
   - Connect input from "Filter Valid Contacts" (true branch).

5. **Create "Check If High-Value Lead" node**  
   - Type: IF node  
   - Condition: `lead_score` > 80 (number comparison)  
   - Connect input from "Transform Contact Data".

6. **Create "Send Slack Alert to Sales Team" node**  
   - Type: Slack node  
   - Connect Slack API credentials with chat:write permission  
   - Set message text with placeholders for lead info as in the workflow  
   - Replace the Slack Channel ID with your actual Slack channel ID  
   - Connect input from "Check If High-Value Lead" (true branch).

7. **Create "Log to Google Sheets Tracker" node**  
   - Type: Google Sheets node  
   - Operation: Append row  
   - Authenticate with Google Sheets OAuth2 credentials  
   - Specify Sheet ID and sheet/tab name (e.g., "High Priority Leads")  
   - Map columns to fields as per the workflow's schema  
   - Connect input from "Check If High-Value Lead" (true branch).

8. **Create "Create Follow-up Calendar Event" node**  
   - Type: Google Calendar node  
   - Authenticate with Google Calendar OAuth2 credentials  
   - Set event start time to 1 hour from now, end time 1.5 hours from now using expressions  
   - Set calendar email to your team/shared calendar  
   - Fill event description with lead details and follow-up instructions  
   - Connect input from "Send Slack Alert to Sales Team".

9. **Connect nodes as follows:**  
   - Daily 8AM Trigger → Fetch HighLevel Contacts → Filter Valid Contacts → Transform Contact Data → Check If High-Value Lead  
   - Check If High-Value Lead (true) → Send Slack Alert to Sales Team → Create Follow-up Calendar Event  
   - Check If High-Value Lead (true) → Log to Google Sheets Tracker  

10. **Add sticky notes for documentation** (optional but recommended):  
    - Workflow Overview  
    - Schedule Setup Note  
    - HighLevel Setup Note  
    - Filter Logic Note  
    - Code Configuration Note  
    - Score Threshold Note  
    - Slack Configuration Note  
    - Google Sheets Setup Note  
    - Calendar Setup Note

11. **Test the workflow with a small subset of contacts first to validate data extraction and alerting.**

---

### 5. General Notes & Resources

| Note Content                                                                                                  | Context or Link                                                                                         |
|---------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| Replace all placeholder IDs (custom field IDs, Slack channel ID, Google Sheet ID, Google Calendar email) with actual values from your environment. | Critical for correct integration and data mapping.                                                    |
| Slack App requires `chat:write` permission and must be installed in your workspace before sending messages. | Slack API setup instructions included in Slack Configuration Note.                                    |
| Google Sheets must be shared with your service account or OAuth2 user and contain columns as specified.       | See Google Sheets Setup Note for detailed column layout and sharing.                                  |
| Google Calendar events are created 1 to 1.5 hours after workflow trigger to ensure immediate follow-up timing. | Adjust times in Calendar node parameters if needed.                                                  |
| Large HighLevel contact databases may require additional filters or pagination to avoid API limits or timeouts. | Advisable to test with small batches initially as noted in HighLevel Setup Note.                       |
| Mapping of assigned rep Slack IDs is a TODO item in the code and should be implemented to link reps properly. | Currently, assigned_rep_slack_id equals assigned_rep; customize as needed in the code node.           |
| Workflow inactive by default; activate after proper credential and configuration setup.                        | Workflow activation controlled in n8n UI.                                                             |

---

**Disclaimer:**  
The provided workflow and documentation originate exclusively from an automated workflow created with n8n, respecting all current content policies. It contains no illegal, offensive, or protected material. All manipulated data is legal and public.