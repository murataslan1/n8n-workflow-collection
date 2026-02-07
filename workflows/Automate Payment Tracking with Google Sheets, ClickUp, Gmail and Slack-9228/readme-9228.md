Automate Payment Tracking with Google Sheets, ClickUp, Gmail and Slack

https://n8nworkflows.xyz/workflows/automate-payment-tracking-with-google-sheets--clickup--gmail-and-slack-9228


# Automate Payment Tracking with Google Sheets, ClickUp, Gmail and Slack

### 1. Workflow Overview

This workflow automates the tracking and notification process for payment verifications using Google Sheets, ClickUp, Gmail, and Slack. It is designed to process lead payment data stored in a Google Sheet and take actions based on the payment status. The workflow is manually triggered and includes the following logical blocks:

- **1.1 Input Reception**: Manual trigger to start the workflow.
- **1.2 Data Retrieval**: Fetch lead data including payment status from Google Sheets.
- **1.3 Status Evaluation and Conditional Routing**: Check if the payment status is "Open" to determine the next steps.
- **1.4 Payment Verification Task Creation**: For open payment statuses, create a task in ClickUp and notify stakeholders via email.
- **1.5 Slack Notification for Non-Open Statuses**: For closed or non-open statuses, send a Slack notification alerting the team without creating tasks.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  Entry point for the workflow, manually triggered by a user to start processing payment verification data.

- **Nodes Involved:**  
  - When clicking ‘Execute workflow’

- **Node Details:**  
  - **Node:** When clicking ‘Execute workflow’  
    - Type: Manual Trigger  
    - Configuration: No parameters; triggers workflow execution on manual command  
    - Input: None (manual trigger)  
    - Output: Emits an event to start the workflow  
    - Potential Failures: None, except accidental missed triggers or user delay  
    - Notes: Serves as the initial activation point for the entire workflow

#### 2.2 Data Retrieval

- **Overview:**  
  Retrieves all rows from a specific Google Sheet that contains lead and payment verification data.

- **Nodes Involved:**  
  - Fetch Lead Data from Google Sheets

- **Node Details:**  
  - **Node:** Fetch Lead Data from Google Sheets  
    - Type: Google Sheets node (read operation)  
    - Configuration:  
      - Document ID: Points to the Google Sheet "GHL form submission (Responses)"  
      - Sheet Name: Sheet2 (with ID 1810805257)  
      - Operation: Read all rows to get lead data and payment verification status  
    - Inputs: Manual trigger node  
    - Outputs: JSON array of rows including columns such as Lead Name, Company Name, Payment Verification, and Status  
    - Credentials: Google Sheets OAuth2 authentication required  
    - Potential Failures:  
      - Authentication errors if credentials expire  
      - API quota limits exceeded  
      - Sheet or document ID changes breaking the link  
    - Notes: This node pulls all pending payment verifications for processing

#### 2.3 Status Evaluation and Conditional Routing

- **Overview:**  
  Checks each row’s "Status" field to determine if the payment verification is still open and routes accordingly.

- **Nodes Involved:**  
  - Check if Status is Open

- **Node Details:**  
  - **Node:** Check if Status is Open  
    - Type: If node (conditional branching)  
    - Configuration:  
      - Condition: Does the field "Status " equal the string "Open"? (case-sensitive, strict type validation)  
      - True path: For rows where status = "Open"  
      - False path: For rows where status ≠ "Open"  
    - Inputs: Output from Google Sheets node  
    - Outputs: Two branches:  
      - True branch to create ClickUp task  
      - False branch to send Slack notification  
    - Potential Failures:  
      - Expression errors if "Status " field is missing or misspelled  
      - Case sensitivity may lead to unexpected false negatives  
    - Notes: Ensures only active payment verifications proceed to task creation

#### 2.4 Payment Verification Task Creation

- **Overview:**  
  For open payment statuses, creates a new task in ClickUp and sends an email notification to the task watchers.

- **Nodes Involved:**  
  - Create ClickUp Task for Payment Verification  
  - Send Email Confirmation to Task Watcher

- **Node Details:**  
  - **Node:** Create ClickUp Task for Payment Verification  
    - Type: ClickUp node (task creation)  
    - Configuration:  
      - Team: Payment Team (ID 90161261705)  
      - Space: Payment Processing (ID 90165174252)  
      - List: Payment Verifications (ID 901611225386)  
      - Task Name: Combines Lead Name, Company Name, and Payment Verification status dynamically, e.g., "[Lead Name] [Company Name] Payment verification is [Status]"  
      - Folderless: true (task created directly under list)  
    - Inputs: True branch from If node  
    - Outputs: Newly created task JSON including task ID and watchers  
    - Credentials: ClickUp API key required  
    - Potential Failures:  
      - Authentication failures with ClickUp API  
      - Rate limits or API errors  
      - Missing or malformed input data leading to invalid task names  
    - Notes: Central task management for payment follow-up

  - **Node:** Send Email Confirmation to Task Watcher  
    - Type: Gmail node (send email)  
    - Configuration:  
      - Recipient: First watcher’s email address from created ClickUp task (expression: `{{$json.watchers[0].email}}`)  
      - Subject: Task name from ClickUp task data  
      - Message: Text message informing task creation with task ID and verification prompt  
      - Email type: Plain text  
    - Inputs: Output from ClickUp task creation node  
    - Credentials: Gmail OAuth2 credentials required  
    - Potential Failures:  
      - Missing watcher email or empty watchers array  
      - Gmail authentication or quota issues  
      - Email sending failures due to network or configuration errors  
    - Notes: Keeps stakeholders informed about new payment verification tasks

#### 2.5 Slack Notification for Non-Open Statuses

- **Overview:**  
  For non-open payment statuses, sends a Slack notification to inform the team without creating tasks.

- **Nodes Involved:**  
  - Send Slack Notification (Status Not Open)

- **Node Details:**  
  - **Node:** Send Slack Notification (Status Not Open)  
    - Type: Slack node (send message to user)  
    - Configuration:  
      - Channel/User: Direct message to user with ID "U09E375JZPA" in the workspace "n8n_workspace"  
      - Message: "Lead: [Lead Name]'s Payment Verification is :[Payment verification]" dynamically populated  
    - Inputs: False branch from If node  
    - Credentials: Slack API token required  
    - Potential Failures:  
      - Slack API rate limits or authentication failures  
      - User ID invalid or message send failure  
    - Notes: Provides fallback notification for payment verifications that are not open, avoiding task creation overload

---

### 3. Summary Table

| Node Name                           | Node Type             | Functional Role                                | Input Node(s)                     | Output Node(s)                                   | Sticky Note                                                   |
|-----------------------------------|-----------------------|-----------------------------------------------|----------------------------------|-------------------------------------------------|--------------------------------------------------------------|
| When clicking ‘Execute workflow’   | Manual Trigger        | Workflow start trigger                         | None                             | Fetch Lead Data from Google Sheets               | ## 🚀 Workflow Start<br>This workflow is triggered manually by clicking the 'Execute Workflow' button.<br>Use this when you want to process payment verification data from the Google Sheet. |
| Fetch Lead Data from Google Sheets | Google Sheets         | Retrieve lead and payment data                  | When clicking ‘Execute workflow’ | Check if Status is Open                           | ## 📊 Fetch Lead Data<br>**Purpose:** Retrieves all rows from Google Sheets containing lead information<br>**Sheet:** GHL form submission (Responses)<br>**Data Retrieved:** Lead Name, Company Name, Payment Verification Status, Status (Open/Closed)<br>This node pulls all pending payment verifications that need to be processed. |
| Check if Status is Open            | If                    | Evaluate payment status to route workflow       | Fetch Lead Data from Google Sheets | Create ClickUp Task for Payment Verification; Send Slack Notification (Status Not Open) | ## ✅ Status Filter<br>**Condition:** Checks if Status = "Open"<br>**True Path:** Creates ClickUp task & sends email<br>**False Path:** Sends Slack notification only<br>This ensures we only create tasks for active/open payment verifications. |
| Create ClickUp Task for Payment Verification | ClickUp               | Create a task in ClickUp for payment follow-up | Check if Status is Open (true)  | Send Email Confirmation to Task Watcher          | ## 📋 Create ClickUp Task<br>**Purpose:** Creates a task in ClickUp for payment verification follow-up<br>**Task Details:** Team: Payment Team, Space: Payment Processing, List: Payment Verifications<br>**Task Name Format:** [Lead Name] [Company Name] Payment verification is [Status]<br>This centralizes all payment verification tasks in one place for the team. |
| Send Email Confirmation to Task Watcher | Gmail                 | Notify task watchers via email                   | Create ClickUp Task for Payment Verification | None                                            | ## ✉️ Email Notification<br>**Purpose:** Sends confirmation email after task creation<br>**Recipient:** First watcher of the ClickUp task<br>**Content:** Task name, Task ID, Link to verify the task<br>This keeps stakeholders informed about new payment verification tasks. |
| Send Slack Notification (Status Not Open) | Slack                 | Send Slack alert for non-open payment statuses   | Check if Status is Open (false)  | None                                            | ## 💬 Slack Alert<br>**Purpose:** Notifies team via Slack when status is NOT open<br>**Channel:** n8n_workspace<br>**Message Format:** Lead: [Lead Name]'s Payment Verification is: [Status]<br>This is a fallback notification for non-open statuses that don't require task creation. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Add a Manual Trigger node named "When clicking ‘Execute workflow’"  
   - No parameters needed

2. **Add Google Sheets Node**  
   - Add a Google Sheets node named "Fetch Lead Data from Google Sheets"  
   - Set operation to read all rows from the sheet  
   - Configure:  
     - Document ID: `19Uq4JB_oKG1s-0S6kKNwJtGWBRXVtpwo9DDCM0Hlg5I` (Google Sheet URL ID)  
     - Sheet Name: `Sheet2` (or use ID 1810805257)  
   - Connect Manual Trigger node to this node  
   - Use Google Sheets OAuth2 credentials setup for authentication

3. **Add If Node for Status Check**  
   - Add an If node named "Check if Status is Open"  
   - Condition: Field `Status ` (note the trailing space) equals string `Open` (case-sensitive)  
   - Connect Google Sheets node output to this If node

4. **Add ClickUp Task Creation Node**  
   - Add ClickUp node named "Create ClickUp Task for Payment Verification"  
   - Set the following:  
     - Team: `90161261705` (Payment Team)  
     - Space: `90165174252` (Payment Processing)  
     - List: `901611225386` (Payment Verifications)  
     - Folderless: true  
     - Task Name: Use expression to combine lead data: `{{$json["Lead Name"]}} {{$json["Company Name"]}} Payment verfication is {{$json["Payement verification"]}}`  
   - Connect If node’s True output to this node  
   - Use ClickUp API credentials

5. **Add Gmail Node to Send Email**  
   - Add Gmail node named "Send Email Confirmation to Task Watcher"  
   - Configure:  
     - Send To: Expression `{{$json.watchers[0].email}}` (first watcher email from ClickUp task)  
     - Subject: Expression `{{$json.name}}` (ClickUp task name)  
     - Message: Text including task ID, e.g., "Clickup Task is created with id: {{$json.id}}. Please check"  
     - Email Type: Text  
   - Connect ClickUp task creation node output to Gmail node  
   - Use Gmail OAuth2 credentials

6. **Add Slack Node for Non-Open Status Notification**  
   - Add Slack node named "Send Slack Notification (Status Not Open)"  
   - Configure:  
     - Send message to user ID: `U09E375JZPA` (specific Slack user)  
     - Message: Expression `"Lead: {{$json["Lead Name"]}}'s Payment Verfication is :{{$json["Payement verification"]}}"`  
   - Connect If node’s False output to Slack node  
   - Use Slack API token credentials

7. **Connect Nodes According to Logic**  
   - Manual Trigger → Google Sheets → If Node  
   - If True → ClickUp → Gmail  
   - If False → Slack

8. **Verify Credentials Setup**  
   - Google Sheets OAuth2 credentials configured with access to the target spreadsheet  
   - ClickUp API key with permissions to create tasks in specified team/space/list  
   - Gmail OAuth2 credentials authorized for sending emails on behalf of the user  
   - Slack API token with permission to send messages to specified user

9. **Test the Workflow**  
   - Manually trigger the workflow  
   - Confirm data is fetched correctly  
   - Check if tasks are created for rows with Status "Open" and emails sent  
   - Confirm Slack notifications for rows with non-open status

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                | Context or Link                                                                                                          |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| Workflow is manually triggered to ensure controlled execution when payment verification data needs processing.                                                             | Workflow Start sticky note                                                                                               |
| Google Sheet data includes sensitive lead payment information; ensure OAuth2 credentials have proper access and data privacy compliance.                                    | Google Sheets sticky note                                                                                                |
| The conditional check is case-sensitive and strict; verify the exact spelling and spacing of the "Status " field in the spreadsheet to avoid logic errors.                  | Condition Check sticky note                                                                                              |
| ClickUp task naming convention centralizes payment verification tasks for easy tracking by the payment processing team.                                                    | ClickUp sticky note                                                                                                      |
| Email notifications are sent only to the first watcher of the ClickUp task to inform relevant stakeholders promptly.                                                       | Email sticky note                                                                                                        |
| Slack notifications act as fallback alerts for payment verifications that are not open, ensuring the team remains aware without task clutter.                              | Slack sticky note                                                                                                        |
| Ensure all third-party API credentials are refreshed regularly to prevent authentication failures during workflow execution.                                              | Best practice for API integrations                                                                                       |
| For dynamic fields, verify that all referenced properties exist in the incoming JSON to prevent expression evaluation failures.                                           | Common error prevention                                                                                                  |
| Slack user ID and Gmail recipient depend on accurate data; if these are missing or incorrect, notifications will fail silently or error out.                              | Integration edge case consideration                                                                                      |

---

**Disclaimer:** The content above is derived exclusively from an automated n8n workflow. It strictly complies with content policies and contains no illegal or offensive material. All handled data is legal and publicly accessible within the integration scope.