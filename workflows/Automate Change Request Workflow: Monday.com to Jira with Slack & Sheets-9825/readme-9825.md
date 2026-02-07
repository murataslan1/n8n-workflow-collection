Automate Change Request Workflow: Monday.com to Jira with Slack & Sheets

https://n8nworkflows.xyz/workflows/automate-change-request-workflow--monday-com-to-jira-with-slack---sheets-9825


# Automate Change Request Workflow: Monday.com to Jira with Slack & Sheets

### 1. Workflow Overview

This automated workflow streamlines the change request approval process by integrating Monday.com, Jira, Slack, Google Sheets, and Gmail. It is designed primarily for IT teams managing change requests, automating request routing based on status and risk level, notifying stakeholders, creating Jira tickets for approved requests, logging data for audit purposes, and handling rejected requests via resubmission.

**Logical Blocks:**

- **1.1 Scheduling & Triggering:** Daily execution to fetch change requests.
- **1.2 Data Extraction & Transformation:** Extracts and maps Monday.com data into structured fields.
- **1.3 Status-Based Routing:** Routes requests based on their status: Pending, Approved, or Rejected.
- **1.4 Pending Requests Handling:** Notifies stakeholders via Slack about requests awaiting approval.
- **1.5 Approved Requests Handling:** Creates Jira tickets, logs requests to Google Sheets, sends Slack notifications, and emails confirmations.
- **1.6 Rejected Requests Handling:** Creates resubmission items in Monday.com for rejected requests.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduling & Triggering

- **Overview:**  
  This block triggers the workflow execution every weekday at 3:00 AM to process new or updated change requests.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Note - Schedule

- **Node Details:**

  - **Schedule Trigger**  
    - *Type & Role:* Cron-based trigger node to initiate workflow.  
    - *Configuration:* Runs at 03:00 AM Monday through Friday (Cron expression: `0 3 * * 1-5`).  
    - *Input/Output:* No input; output triggers the next node.  
    - *Edge Cases:* Misconfigured cron expression or server time zone mismatch could cause incorrect trigger times.  
    - *Sticky Note:* Note - Schedule explains schedule and how to customize it.

  - **Note - Schedule**  
    - *Type:* Sticky Note for documentation.  
    - *Content:* Explains schedule timing and customization instructions.  
    - *No input/output connections.*

#### 1.2 Data Extraction & Transformation

- **Overview:**  
  Fetches all change requests from a specified Monday.com board and extracts relevant fields into a clean format for downstream processing.

- **Nodes Involved:**  
  - Fetch Change Requests  
  - Extract Request Data  
  - Note - Fetch  
  - Note - Extract

- **Node Details:**

  - **Fetch Change Requests**  
    - *Type:* Monday.com node to retrieve board items.  
    - *Configuration:* Fetches all items from board ID `YOUR_BOARD_ID` and group `topics`.  
    - *Input:* Trigger from Schedule Trigger.  
    - *Output:* JSON array of change request items with full metadata.  
    - *Edge Cases:* Invalid board ID, invalid credentials, API rate limits, empty boards.  
    - *Sticky Note:* Note - Fetch explains required setup including board ID and credentials.

  - **Extract Request Data**  
    - *Type:* Set node for data transformation.  
    - *Configuration:* Maps Monday.com column values to named fields: id, name, Component affected, Approvers, Status, Description, Risk Level. Uses expressions referencing specific column indices (`column_values[1]`, `column_values[3]`, etc.).  
    - *Input:* Output of Fetch Change Requests.  
    - *Output:* Cleaned JSON objects with key fields.  
    - *Edge Cases:* Board column structure changes (column indices), missing data.  
    - *Sticky Note:* Note - Extract explains the mapping and advises adjusting indices if board structure differs.

#### 1.3 Status-Based Routing

- **Overview:**  
  Routes each request according to its Status field ("Pending", "Approved", "Rejected") to appropriate handling blocks.

- **Nodes Involved:**  
  - Filter Pending Requests  
  - Filter Approved Requests  
  - Filter Rejected Requests  
  - Note - Status Route  
  - Note - Approved Route  
  - Note - Rejected Route

- **Node Details:**

  - **Filter Pending Requests**  
    - *Type:* If node filtering by `Status == "Pending"`.  
    - *Input:* Extract Request Data output.  
    - *Outputs:*  
      - True branch: Pending requests.  
      - False branch: Not pending (either Approved or Rejected).  
    - *Edge Cases:* Status field misspelled or missing.  
    - *Sticky Note:* Note - Status Route explains routing logic.

  - **Filter Approved Requests**  
    - *Type:* If node filtering by `Status == "Approved"`.  
    - *Input:* False branch of Filter Pending Requests.  
    - *Outputs:*  
      - True branch: Approved requests.  
      - False branch: Rejected requests.  
    - *Edge Cases:* Same as above.  
    - *Sticky Note:* Note - Approved Route explains next steps on approval.

  - **Filter Rejected Requests**  
    - *Type:* If node filtering by `Status == "Rejected"`.  
    - *Input:* False branch of Filter Approved Requests.  
    - *Output:* True branch for rejected requests; false branch (other statuses) ends workflow.  
    - *Sticky Note:* Note - Rejected Route explains handling of rejected requests.

#### 1.4 Pending Requests Handling

- **Overview:**  
  Sends Slack notifications to stakeholders for change requests awaiting approval.

- **Nodes Involved:**  
  - Notify Pending Request  
  - Note - Pending Slack

- **Node Details:**

  - **Notify Pending Request**  
    - *Type:* Slack node sending message to channel.  
    - *Configuration:* Sends formatted message with request details (Name, Description, Risk Level, Component affected, Approver). Uses Slack channel ID `YOUR_CHANNEL_ID`.  
    - *Input:* True branch of Filter Pending Requests.  
    - *Edge Cases:* Invalid Slack credentials, incorrect channel ID, message formatting errors.  
    - *Sticky Note:* Note - Pending Slack explains setup requirements.

#### 1.5 Approved Requests Handling

- **Overview:**  
  For approved requests, this block creates Jira issues, logs data to Google Sheets, sends Slack notifications, and emails confirmation.

- **Nodes Involved:**  
  - Create Jira Ticket  
  - Log to Google Sheets  
  - Notify Approval  
  - Send Confirmation Email  
  - Note - Jira  
  - Note - Sheets  
  - Note - Approved Slack  
  - Note - Email

- **Node Details:**

  - **Create Jira Ticket**  
    - *Type:* Jira node creating an issue.  
    - *Configuration:*  
      - Project ID: `YOUR_PROJECT_ID`  
      - Issue Type: Task (ID 10006)  
      - Summary: Request name  
      - Description: Request description  
    - *Input:* True branch of Filter Approved Requests.  
    - *Output:* Jira ticket JSON including ticket key.  
    - *Edge Cases:* Invalid Jira credentials, project ID, issue type, Jira API limits.  
    - *Sticky Note:* Note - Jira explains setup.

  - **Log to Google Sheets**  
    - *Type:* Google Sheets node to append or update rows.  
    - *Configuration:*  
      - Document ID: `YOUR_SHEET_ID`  
      - Sheet GID: `YOUR_SHEET_GID`  
      - Matching column: "id"  
      - Auto-maps fields: id, name, Component affected, Approvers, Status, Description, Risk Level  
    - *Input:* True branch of Filter Approved Requests (runs in parallel with Create Jira Ticket).  
    - *Edge Cases:* Google OAuth2 credential issues, sheet access permissions, rate limits.  
    - *Sticky Note:* Note - Sheets explains setup.

  - **Notify Approval**  
    - *Type:* Slack node sending confirmation message.  
    - *Configuration:*  
      - Channel: `YOUR_CHANNEL_ID` (same as pending)  
      - Message includes request details and Jira ticket key.  
    - *Input:* Output of Create Jira Ticket.  
    - *Edge Cases:* Slack API issues, missing Jira ticket data.  
    - *Sticky Note:* Note - Approved Slack explains configuration.

  - **Send Confirmation Email**  
    - *Type:* Gmail node sending email.  
    - *Configuration:*  
      - Recipient: `YOUR_EMAIL@example.com`  
      - Subject: "Change Request Approved"  
      - Body: Includes request name, affected component, Jira ticket key.  
    - *Input:* Output of Notify Approval (which is downstream of Create Jira Ticket).  
    - *Credentials:* Gmail OAuth2.  
    - *Edge Cases:* Gmail API errors, invalid recipient email.  
    - *Sticky Note:* Note - Email explains setup.

#### 1.6 Rejected Requests Handling

- **Overview:**  
  Automatically creates resubmission items in Monday.com prefixed with "Resubmission:" for rejected requests to facilitate further review or correction.

- **Nodes Involved:**  
  - Create Resubmission Item  
  - Note - Resubmit

- **Node Details:**

  - **Create Resubmission Item**  
    - *Type:* Monday.com node creating a new board item.  
    - *Configuration:*  
      - Board ID: `YOUR_BOARD_ID` (same as fetch node)  
      - Group ID: `topics`  
      - Item name prefixed with "Resubmission:" followed by original request name.  
    - *Input:* True branch of Filter Rejected Requests.  
    - *Edge Cases:* Invalid board ID or credentials, API rate limit.  
    - *Sticky Note:* Note - Resubmit explains setup.

---

### 3. Summary Table

| Node Name             | Node Type          | Functional Role                         | Input Node(s)            | Output Node(s)               | Sticky Note                                                                                                    |
|-----------------------|--------------------|---------------------------------------|--------------------------|-----------------------------|---------------------------------------------------------------------------------------------------------------|
| Workflow Overview     | Sticky Note        | Documentation overview                 | -                        | -                           | Describes workflow purpose, use case, and required setup                                                      |
| Schedule Trigger      | Schedule Trigger   | Triggers workflow daily at 3 AM       | -                        | Fetch Change Requests        | See Note - Schedule                                                                                            |
| Note - Schedule       | Sticky Note        | Explains schedule timing               | -                        | -                           | Explains schedule and customization                                                                           |
| Fetch Change Requests | Monday.com         | Fetches all change requests from board| Schedule Trigger          | Extract Request Data         | See Note - Fetch                                                                                               |
| Note - Fetch          | Sticky Note        | Explains Monday.com fetch setup        | -                        | -                           | Setup instructions for Monday.com node                                                                        |
| Extract Request Data  | Set                | Maps Monday.com columns to fields      | Fetch Change Requests     | Filter Pending Requests      | See Note - Extract                                                                                            |
| Note - Extract        | Sticky Note        | Explains data mapping                   | -                        | -                           | Advises adjusting column indices                                                                               |
| Filter Pending Requests| If                 | Routes requests with Status "Pending"  | Extract Request Data      | Notify Pending Request, Filter Approved Requests | See Note - Status Route                                                                                         |
| Filter Approved Requests| If                | Routes requests with Status "Approved" | Filter Pending Requests   | Create Jira Ticket, Log to Google Sheets, Filter Rejected Requests | See Note - Approved Route                                                                                       |
| Filter Rejected Requests| If                 | Routes requests with Status "Rejected" | Filter Approved Requests  | Create Resubmission Item     | See Note - Rejected Route                                                                                       |
| Notify Pending Request| Slack               | Sends Slack alert for pending requests | Filter Pending Requests   | -                           | See Note - Pending Slack                                                                                       |
| Note - Pending Slack  | Sticky Note        | Slack alert setup instructions         | -                        | -                           | Setup Slack channel and credentials                                                                            |
| Create Jira Ticket    | Jira                | Creates Jira issue for approved requests| Filter Approved Requests  | Notify Approval             | See Note - Jira                                                                                                |
| Note - Jira           | Sticky Note        | Jira creation setup instructions       | -                        | -                           | Setup Jira credentials and project ID                                                                          |
| Log to Google Sheets  | Google Sheets       | Logs approved requests to audit sheet  | Filter Approved Requests  | -                           | See Note - Sheets                                                                                              |
| Note - Sheets         | Sticky Note        | Google Sheets logging setup             | -                        | -                           | Setup Google OAuth2 credentials, document and sheet IDs                                                       |
| Notify Approval       | Slack               | Sends Slack notification for approvals | Create Jira Ticket        | Send Confirmation Email      | See Note - Approved Slack                                                                                      |
| Note - Approved Slack | Sticky Note        | Slack notification setup for approvals  | -                        | -                           | Use same Slack channel and credentials as pending alerts                                                      |
| Send Confirmation Email| Gmail               | Sends email confirmation for approvals  | Notify Approval           | -                           | See Note - Email                                                                                                |
| Note - Email          | Sticky Note        | Email setup instructions                | -                        | -                           | Setup Gmail OAuth2 credentials and email recipient                                                            |
| Create Resubmission Item| Monday.com         | Creates resubmission item for rejected requests | Filter Rejected Requests | -                           | See Note - Resubmit                                                                                            |
| Note - Resubmit       | Sticky Note        | Resubmission handling instructions      | -                        | -                           | Setup Monday.com credentials and board ID                                                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node:**  
   - Type: Schedule Trigger  
   - Configure cron expression: `0 3 * * 1-5` (3 AM Monday to Friday)  
   - No credentials required.

2. **Create Monday.com Fetch Node:**  
   - Type: Monday.com  
   - Operation: Get All board items  
   - Board ID: Replace `YOUR_BOARD_ID` with your actual board ID  
   - Group ID: `topics` (or your group name)  
   - Connect Monday.com OAuth2 credentials.

3. **Connect Schedule Trigger → Fetch Change Requests**

4. **Create Set Node to Extract Request Data:**  
   - Map fields from Monday.com output to:  
     - `id` = `{{$json.id}}`  
     - `name` = `{{$json.name}}`  
     - `Component affected` = `{{$json.column_values[4].text}}`  
     - `Approvers` = `{{$json.column_values[5].text}}`  
     - `Status` = `{{$json.column_values[1].text}}`  
     - `Description` = `{{$json.column_values[6].text}}`  
     - `Risk Level` = `{{$json.column_values[3].text}}`  
   - Connect Fetch Change Requests → Extract Request Data.

5. **Create If Node - Filter Pending Requests:**  
   - Condition: `Status == "Pending"`  
   - Connect Extract Request Data → Filter Pending Requests.

6. **Create Slack Node - Notify Pending Request:**  
   - Channel ID: Replace `YOUR_CHANNEL_ID`  
   - Message text: Include Name, Request, Risk Level, Component, Approver  
   - Connect Filter Pending Requests True → Notify Pending Request.

7. **Create If Node - Filter Approved Requests:**  
   - Condition: `Status == "Approved"`  
   - Connect Filter Pending Requests False → Filter Approved Requests.

8. **Create Jira Node - Create Jira Ticket:**  
   - Project ID: Replace `YOUR_PROJECT_ID`  
   - Issue Type: Task (or your preferred type)  
   - Summary: Use request name  
   - Description: Use request description  
   - Connect Filter Approved Requests True → Create Jira Ticket.

9. **Create Google Sheets Node - Log to Google Sheets:**  
   - Operation: Append or update row  
   - Document ID: Replace `YOUR_SHEET_ID`  
   - Sheet GID: Replace `YOUR_SHEET_GID`  
   - Matching Column: `id`  
   - Map fields accordingly  
   - Connect Filter Approved Requests True → Log to Google Sheets (parallel to Create Jira Ticket).

10. **Create Slack Node - Notify Approval:**  
    - Channel ID: Same as pending alert  
    - Message includes request details and Jira ticket key (`{{$json.key}}`)  
    - Connect Create Jira Ticket → Notify Approval.

11. **Create Gmail Node - Send Confirmation Email:**  
    - Recipient: Replace `YOUR_EMAIL@example.com`  
    - Subject: "Change Request Approved"  
    - Body text: Include request name, component, Jira ticket key  
    - Connect Notify Approval → Send Confirmation Email.  
    - Connect Gmail OAuth2 credentials.

12. **Create If Node - Filter Rejected Requests:**  
    - Condition: `Status == "Rejected"`  
    - Connect Filter Approved Requests False → Filter Rejected Requests.

13. **Create Monday.com Node - Create Resubmission Item:**  
    - Board ID: Same as fetch node  
    - Group ID: `topics`  
    - Name: `"Resubmission: {{ $json.name }}"`  
    - Connect Filter Rejected Requests True → Create Resubmission Item.

14. **Add Sticky Notes:**  
    - Add documentation sticky notes near each logical block as per workflow overview and node roles.

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                                   |
|----------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| The workflow requires Monday.com, Jira, Google Sheets, Slack, and Gmail credentials to function.   | Setup of OAuth2 credentials per service is mandatory.            |
| Adjust column indices in the Extract Request Data node if your Monday.com board structure differs. | Column indices are currently hardcoded (e.g., `column_values[4]`).|
| Slack channel IDs and Jira project/issue type IDs must be replaced with your actual environment IDs.| Refer to your Slack workspace and Jira project settings.          |
| Gmail OAuth2 credentials must be configured for sending emails.                                    | Use Google Cloud Console to create OAuth2 credentials.           |
| The daily schedule can be customized by editing the cron expression in the Schedule Trigger node. |                                                                |
| Slack notification messages use template expressions to dynamically populate request details.      | Uses n8n expression syntax, e.g., `{{ $json.name }}`.             |
| Google Sheets node uses "append or update" operation to maintain audit trail without duplicates.   | Matching done on unique request ID field.                         |

---

**Disclaimer:** The provided workflow content is exclusively generated from an automated n8n workflow. It complies with all current content policies and contains only legal and public data.