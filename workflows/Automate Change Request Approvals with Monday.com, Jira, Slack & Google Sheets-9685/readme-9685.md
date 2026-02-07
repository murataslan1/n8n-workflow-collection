Automate Change Request Approvals with Monday.com, Jira, Slack & Google Sheets

https://n8nworkflows.xyz/workflows/automate-change-request-approvals-with-monday-com--jira--slack---google-sheets-9685


# Automate Change Request Approvals with Monday.com, Jira, Slack & Google Sheets

### 1. Workflow Overview

This workflow automates the approval process for change requests using Monday.com, Jira, Slack, Google Sheets, and Gmail. It is designed for IT teams or organizations managing change requests with different risk levels and statuses, streamlining communication, ticketing, logging, and resubmission processes.

The workflow is logically divided into these blocks:

- **1.1 Scheduled Trigger & Data Fetching:** Automatically triggers on weekdays at 3:00 AM and fetches all change requests from a specified Monday.com board.
- **1.2 Data Transformation:** Extracts and maps data fields from Monday.com items to normalized JSON fields used downstream.
- **1.3 Status-Based Routing:** Routes requests based on their status ("Pending", "Approved", "Rejected").
- **1.4 Pending Requests Notification:** Sends Slack notifications for requests that are pending approval.
- **1.5 Approved Requests Processing:** For approved requests, creates Jira tickets, logs details to Google Sheets, sends Slack notifications and email confirmations.
- **1.6 Rejected Requests Handling:** For rejected requests, creates a resubmission item in Monday.com to restart the approval process.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger & Data Fetching

**Overview:** This block triggers the workflow daily on weekdays at 3:00 AM and fetches all change requests from a Monday.com board.

**Nodes Involved:**
- Schedule Trigger
- Get many items
- Edit Fields

**Node Details:**

- **Schedule Trigger**
  - Type: Schedule Trigger node
  - Configuration: Cron expression `0 3 * * 1-5` (Monday to Friday at 3:00 AM)
  - Inputs: None (start node)
  - Outputs: Connects to "Get many items"
  - Edge Cases: Workflow inactive or misconfigured cron may cause no executions.

- **Get many items**
  - Type: Monday.com node (Get All board items)
  - Configuration:
    - Board ID: `5013238363` (Monday.com change request board)
    - Group ID: `topics` (group within the board)
    - Operation: Retrieves all items
    - Credentials: Uses configured Monday.com API credentials
  - Inputs: From Schedule Trigger
  - Outputs: Connects to "Edit Fields"
  - Edge Cases: Authorization errors, invalid board/group IDs, empty board.

- **Edit Fields**
  - Type: Set node
  - Configuration: Maps Monday.com column values to normalized fields:
    - `id`: item id
    - `name`: item name
    - `Component affected`: column_values[4].text
    - `Approvers`: column_values[5].text
    - `Status`: column_values[1].text
    - `Description`: column_values[6].text
    - `Risk Level`: column_values[3].text
  - Inputs: Monday.com item data
  - Outputs: Connects to "Route by Risk Level"
  - Edge Cases: Column indices may not match if board structure changes, causing empty or incorrect data.

---

#### 1.2 Status-Based Routing

**Overview:** Routes requests by their current status to handle different workflows for pending, approved, or rejected change requests.

**Nodes Involved:**
- Route by Risk Level (IF node)
- Notify Stackholder Pending Request (Slack node)
- Route Low Risk by Component (IF node)
- Route High Risk by Component (IF node)

**Node Details:**

- **Route by Risk Level**
  - Type: IF node
  - Configuration: Checks if `Status` equals `"Pending"`
  - Inputs: From "Edit Fields"
  - Outputs:
    - True branch: To "Notify Stackholder Pending Request"
    - False branch: To "Route Low Risk by Component"
  - Edge Cases: Case sensitivity or unexpected status values can misroute items.

- **Notify Stackholder Pending Request**
  - Type: Slack node
  - Configuration:
    - Sends notification to Slack channel ID `C09GNB90TED` (e.g., #general-information)
    - Message includes request name, description, risk level, component, approvers
    - Uses Slack API credentials
  - Inputs: From true branch of Route by Risk Level
  - Outputs: None (end for pending)
  - Edge Cases: Invalid channel ID, Slack API permission issues.

- **Route Low Risk by Component**
  - Type: IF node
  - Configuration: Checks if `Status` equals `"Approved"`
  - Inputs: False branch from Route by Risk Level
  - Outputs:
    - True branch: To "Create an issue" and "Append or update row in sheet"
    - False branch: To "Route High Risk by Component"
  - Edge Cases: Unexpected status values can cause misrouting.

- **Route High Risk by Component**
  - Type: IF node
  - Configuration: Checks if `Status` equals `"Rejected"`
  - Inputs: False branch from Route Low Risk by Component
  - Outputs:
    - True branch: To "Resubmission Request"
    - False branch: No further action (workflow ends)
  - Edge Cases: Same as above.

---

#### 1.3 Approved Requests Processing

**Overview:** Handles approved requests by creating Jira issues, logging to Google Sheets, sending Slack notifications, and emailing confirmations.

**Nodes Involved:**
- Create an issue (Jira node)
- Append or update row in sheet (Google Sheets node)
- Notify Stackholder Approval Request (Slack node)
- Send a message (Gmail node)

**Node Details:**

- **Create an issue**
  - Type: Jira node
  - Configuration:
    - Project: ID `10001` (e.g., Kanban project)
    - Issue type: ID `10006` (Task)
    - Summary: change request name
    - Description: change request description
    - Credentials: Jira software cloud credentials
  - Inputs: True branch from Route Low Risk by Component
  - Outputs: Connects to "Notify Stackholder Approval Request"
  - Edge Cases: Invalid project or issue type IDs, missing required Jira fields, auth failures.

- **Append or update row in sheet**
  - Type: Google Sheets node
  - Configuration:
    - Document ID: Google Sheets document holding audit trail
    - Sheet name: specific tab for approved requests
    - Operation: append or update row matched by `id`
    - Columns mapped: id, name, Component affected, Approvers, Status, Description, Risk Level
    - Credentials: Google OAuth2 account with write access
  - Inputs: True branch from Route Low Risk by Component (parallel to Jira node)
  - Outputs: None (parallel branch)
  - Edge Cases: Sheet access permission issues, incorrect document or sheet IDs.

- **Notify Stackholder Approval Request**
  - Type: Slack node
  - Configuration:
    - Slack channel ID `C09GNB90TED`
    - Message includes change request details and Jira issue link (dynamic key)
    - Credentials: Slack API credentials
  - Inputs: From "Create an issue"
  - Outputs: Connects to "Send a message" (email)
  - Edge Cases: Slack API or channel issues.

- **Send a message**
  - Type: Gmail node
  - Configuration:
    - Recipient email: `herevivekpatidar@gmail.com`
    - Subject: "Change Request Approved"
    - Message includes request name, component, and Jira ticket link dynamically referenced
    - Credentials: Gmail OAuth2 credentials
  - Inputs: From "Notify Stackholder Approval Request"
  - Outputs: End of approved request flow
  - Edge Cases: Email send failures due to credentials or invalid recipient.

---

#### 1.4 Rejected Requests Handling

**Overview:** Manages rejected requests by creating a resubmission item in Monday.com for reprocessing.

**Nodes Involved:**
- Resubmission Request (Monday.com node)

**Node Details:**

- **Resubmission Request**
  - Type: Monday.com node (Create board item)
  - Configuration:
    - Board ID: `5013238363` (same as fetch)
    - Group ID: `topics`
    - Name: prefixed with `"ReSubmission: "` + original request name
    - Credentials: Monday.com API credentials
  - Inputs: True branch from Route High Risk by Component
  - Outputs: End of rejected request flow
  - Edge Cases: Board access errors, item creation limits, duplicate names.

---

### 3. Summary Table

| Node Name                        | Node Type          | Functional Role                            | Input Node(s)              | Output Node(s)                        | Sticky Note                                                                                                                                                       |
|---------------------------------|--------------------|------------------------------------------|----------------------------|-------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger                | Schedule Trigger   | Triggers workflow daily on weekdays at 3 AM | None                       | Get many items                      | ## ⏰ Daily Schedule<br>Runs weekdays at 3:00 AM to process change requests.<br>Customize cron as needed.                                                        |
| Get many items                 | Monday.com          | Fetches all change requests from Monday.com board | Schedule Trigger            | Edit Fields                        | ## 📋 Fetch Requests<br>Replace board ID, group ID, and connect Monday.com credentials.                                                                          |
| Edit Fields                   | Set                 | Maps Monday.com fields to normalized JSON | Get many items              | Route by Risk Level                | ## 📄 Data Transformation<br>Adjust column indices if board structure differs.                                                                                   |
| Route by Risk Level            | IF                  | Routes requests based on status = Pending or not | Edit Fields                 | Notify Stackholder Pending Request (true), Route Low Risk by Component (false) | ## 🔀 Status Router<br>Routes by status: Pending → Slack notification, else → further routing.                                                                  |
| Notify Stackholder Pending Request | Slack              | Sends Slack notification for pending requests | Route by Risk Level (true)  | None                              | ## 💬 Slack Alert - Pending<br>Replace channel ID and connect Slack credentials.<br>Sends pending approval notifications.                                       |
| Route Low Risk by Component    | IF                  | Routes requests with status = Approved or not | Route by Risk Level (false) | Create an issue, Append or update row in sheet (true), Route High Risk by Component (false) | ## ✅ Approved Router<br>True branch creates Jira ticket and logs to sheet.<br>False branch handles rejected requests.                                            |
| Create an issue               | Jira                 | Creates Jira task for approved requests   | Route Low Risk by Component (true) | Notify Stackholder Approval Request | ## 🎫 Create Jira Issue<br>Configure project, issue type, and Jira credentials.<br>Creates a task with request details.                                          |
| Append or update row in sheet | Google Sheets        | Logs approved requests to Google Sheets   | Route Low Risk by Component (true) | None                              | ## 📊 Audit Trail<br>Select Google Sheets document and sheet.<br>Connect OAuth2 credentials.<br>Logs all approved requests for compliance.                      |
| Notify Stackholder Approval Request | Slack              | Sends Slack notification for approved requests | Create an issue             | Send a message                    | ## 💬 Slack Alert - Approved<br>Use same Slack channel and credentials.<br>Sends confirmation with Jira issue key.                                              |
| Send a message               | Gmail                | Sends email confirmation with Jira ticket link | Notify Stackholder Approval Request | None                              | ## 📧 Email Confirmation<br>Replace email recipient.<br>Connect Gmail OAuth2 credentials.<br>Sends professional confirmation email.                            |
| Route High Risk by Component  | IF                   | Routes requests with status = Rejected or not | Route Low Risk by Component (false) | Resubmission Request (true)        | ## ❌ Rejected Router<br>True branch creates new resubmission item in Monday.com.<br>False branch ends workflow.                                                |
| Resubmission Request          | Monday.com           | Creates a resubmission item for rejected requests | Route High Risk by Component (true) | None                              | ## 🔄 Resubmission Handler<br>Use same board and credentials.<br>Creates new item prefixed with "ReSubmission:" for rejected requests.                          |
| Workflow Overview            | Sticky Note          | Overview and description of workflow      | None                       | None                              | ## 🎯 Change Request Approval Workflow<br>Details purpose, setup, customization, and troubleshooting information.                                               |
| Note - Schedule              | Sticky Note          | Details schedule timing and cron expression | None                       | None                              | ## ⏰ Daily Schedule<br>Runs Mon-Fri 3:00 AM by default.                                                                                                          |
| Note - Extract               | Sticky Note          | Explains data mapping from Monday.com columns | None                       | None                              | ## 📄 Data Transformation<br>Maps key Monday.com fields for processing.                                                                                          |
| Note - Pending Slack         | Sticky Note          | Instructions for Slack notification setup | None                       | None                              | ## 💬 Slack Alert - Pending<br>Setup channel ID and credentials for pending notifications.                                                                       |
| Note - Approved Route        | Sticky Note          | Explains routing logic for approved vs rejected | None                       | None                              | ## ✅ Approved Router<br>True branch creates Jira and logs to Sheets.<br>False branch handles rejected requests.                                                |
| Note - Jira                  | Sticky Note          | Jira node configuration notes             | None                       | None                              | ## 🎫 Create Jira Issue<br>Setup project, issue type, and connect Jira credentials.                                                                               |
| Note - Sheets                | Sticky Note          | Google Sheets logging setup instructions  | None                       | None                              | ## 📊 Audit Trail<br>Select document and sheet tab, connect OAuth2 credentials to log approved requests.                                                       |
| Note - Email                 | Sticky Note          | Gmail node email configuration             | None                       | None                              | ## 📧 Email Confirmation<br>Replace recipient and connect Gmail OAuth2 credentials.                                                                              |
| Note - Rejected Route        | Sticky Note          | Routing logic for rejected requests        | None                       | None                              | ## ❌ Rejected Router<br>True branch creates resubmission items in Monday.com.                                                                                   |
| Note - Resubmit              | Sticky Note          | Monday.com resubmission item creation      | None                       | None                              | ## 🔄 Resubmission Handler<br>Use same board ID and credentials.<br>Creates new items with "ReSubmission:" prefix for rejected requests.                        |
| Note - Approved Slack        | Sticky Note          | Slack notification setup for approved requests | None                       | None                              | ## 💬 Slack Alert - Approved<br>Use identical Slack channel and credentials.<br>Sends confirmation with Jira ticket key.                                        |
| Note - Status Route          | Sticky Note          | Explains status routing logic               | None                       | None                              | ## 🔀 Status Router<br>Routes based on Pending vs Approved/Rejected statuses.                                                                                    |
| Note - Fetch                | Sticky Note          | Monday.com fetch configuration instructions | None                       | None                              | ## 📋 Fetch Requests<br>Configure board and group IDs plus credentials.                                                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**
   - Type: Schedule Trigger
   - Configure cron expression: `0 3 * * 1-5` (Monday to Friday at 3:00 AM)
   - No credentials needed
   - This is the starting node.

2. **Add Monday.com Node - Get many items**
   - Type: Monday.com
   - Operation: Get All board items
   - Board ID: `5013238363` (change to your board)
   - Group ID: `topics` (change if needed)
   - Connect Monday.com API credentials
   - Connect the Schedule Trigger output to this node.

3. **Add Set Node - Edit Fields**
   - Type: Set
   - Map fields from Monday.com item:
     - `id` = `{{$json["id"]}}`
     - `name` = `{{$json["name"]}}`
     - `Component affected` = `{{$json["column_values"][4].text}}`
     - `Approvers` = `{{$json["column_values"][5].text}}`
     - `Status` = `{{$json["column_values"][1].text}}`
     - `Description` = `{{$json["column_values"][6].text}}`
     - `Risk Level` = `{{$json["column_values"][3].text}}`
   - Connect output of Monday.com node to this Set node.

4. **Add IF Node - Route by Risk Level**
   - Type: IF
   - Condition: `Status` equals `"Pending"`
   - Connect output of Set node to this IF node.

5. **Add Slack Node - Notify Stackholder Pending Request**
   - Type: Slack
   - Channel ID: `C09GNB90TED` (replace with your Slack channel ID)
   - Message: Include request details (name, description, risk level, component, approvers)
   - Connect Slack API credentials
   - Connect the True output of the IF node here.

6. **Add IF Node - Route Low Risk by Component**
   - Type: IF
   - Condition: `Status` equals `"Approved"`
   - Connect False output of previous IF node to this node.

7. **Add Jira Node - Create an issue**
   - Type: Jira
   - Project: Select your Jira project (e.g., Kanban project)
   - Issue type: e.g., Task
   - Summary: `{{$json["name"]}}`
   - Description: `{{$json["Description"]}}`
   - Connect Jira software cloud API credentials
   - Connect True output of "Route Low Risk by Component" here.

8. **Add Google Sheets Node - Append or update row in sheet**
   - Type: Google Sheets
   - Operation: Append or update
   - Document ID: Your Google Sheets spreadsheet ID for audit trail
   - Sheet Name: Select appropriate sheet/tab
   - Map columns: id, name, Component affected, Approvers, Status, Description, Risk Level
   - Connect Google OAuth2 credentials
   - Connect True output of "Route Low Risk by Component" here (parallel to Jira node).

9. **Add Slack Node - Notify Stackholder Approval Request**
   - Type: Slack
   - Channel ID: Same Slack channel as pending notification or different if desired
   - Message: Include request details and Jira issue key link dynamically
   - Connect Slack API credentials
   - Connect output of Jira node to this Slack node.

10. **Add Gmail Node - Send a message**
    - Type: Gmail
    - Recipient email: Replace with appropriate email address(es)
    - Subject: "Change Request Approved"
    - Message: Include request name, component affected, and Jira ticket link dynamically
    - Connect Gmail OAuth2 credentials
    - Connect output of Slack approval notification node here.

11. **Add IF Node - Route High Risk by Component**
    - Type: IF
    - Condition: `Status` equals `"Rejected"`
    - Connect False output of "Route Low Risk by Component" here.

12. **Add Monday.com Node - Resubmission Request**
    - Type: Monday.com
    - Operation: Create board item
    - Board ID: Same as fetch node
    - Group ID: Same as fetch node
    - Name: `ReSubmission: {{$json["name"]}}`
    - Connect Monday.com API credentials
    - Connect True output of "Route High Risk by Component" here.

13. **Final Connections**
    - Ensure outputs of all terminal nodes (Slack pending notification, Gmail send, resubmission creation) have no further connections.
    - Activate the workflow.

---

### 5. General Notes & Resources

| Note Content                                                                                           | Context or Link                                                                                          |
|------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| Workflow automates change request approvals with routing by status and risk level, integrating Monday.com, Jira, Slack, Google Sheets, and Gmail. | Workflow Overview node content                                                                             |
| Cron schedule runs Monday to Friday at 3 AM by default; modify as needed in Schedule Trigger node.     | Note - Schedule sticky note                                                                              |
| Slack notifications require correct channel IDs (start with 'C') and bot permissions.                 | Note - Pending Slack and Note - Approved Slack sticky notes                                             |
| Jira nodes require valid project and issue type IDs; ensure required fields are populated correctly.  | Note - Jira sticky note                                                                                   |
| Google Sheets node requires proper document and sheet IDs and OAuth2 credentials with write access.   | Note - Sheets sticky note                                                                                 |
| Gmail node requires OAuth2 credentials and valid recipient email addresses.                           | Note - Email sticky note                                                                                   |
| Column indices in the Edit Fields node correspond to Monday.com board structure; adjust if board changes. | Note - Extract sticky note                                                                                 |
| Resubmission items are prefixed with "ReSubmission:" to clearly mark rejected requests for follow-up. | Note - Resubmit sticky note                                                                                |

---

*Disclaimer:* The provided description and details are based exclusively on an automated workflow created using n8n, respecting all applicable content policies. All handled data is legal and publicly permissible.