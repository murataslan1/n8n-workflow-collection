Auto-Generate Developer Invoices & Compliance Reminders with Jira and Gmail

https://n8nworkflows.xyz/workflows/auto-generate-developer-invoices---compliance-reminders-with-jira-and-gmail-9837


# Auto-Generate Developer Invoices & Compliance Reminders with Jira and Gmail

### 1. Workflow Overview

This n8n workflow automates the process of generating developer invoices and compliance reminders by integrating Jira issue time tracking data with Gmail email delivery. It targets software development teams and project managers who need to streamline billing and ensure accurate time logging compliance.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Manual trigger to start the workflow.
- **1.2 Data Retrieval:** Fetch all Jira project issues including time tracking details.
- **1.3 Data Aggregation:** Group issues by assignee and sum logged hours.
- **1.4 Compliance Check:** Identify issues with missing time logs per user.
- **1.5 Invoice Generation:** Create detailed text invoices for users with logged hours.
- **1.6 Data Merging:** Combine reminder and invoice data streams into unified records.
- **1.7 Data Reconciliation:** Align JSON user data with corresponding binary invoice attachments.
- **1.8 Email Dispatch:** Send personalized emails with invoices and reminders via Gmail.

Each block builds on the previous, ensuring a structured flow from raw data extraction to communication delivery.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:** Initiates the workflow manually by a user.
- **Nodes Involved:** 
  - When clicking ‘Execute workflow’ (Manual Trigger)
- **Node Details:**
  - **Type:** Manual Trigger
  - **Role:** Starts the workflow on demand.
  - **Configuration:** No parameters; simple manual activation.
  - **Inputs:** None
  - **Outputs:** Triggers next node: Fetch All Project Issues with Time Data
  - **Edge Cases:** None; user-dependent activation.
  - **Sub-workflow:** No

#### 1.2 Data Retrieval

- **Overview:** Retrieves all Jira project issues with time tracking information.
- **Nodes Involved:** 
  - Fetch All Project Issues with Time Data (Jira)
- **Node Details:**
  - **Type:** Jira Node
  - **Role:** Queries Jira Cloud API to fetch all issues using `getAll` operation with `returnAll` enabled.
  - **Configuration:**
    - Operation: `getAll`
    - Return All: true
    - Credentials: Jira Software Cloud API (OAuth)
  - **Inputs:** Trigger from manual node
  - **Outputs:** List of Jira issues with fields: key, summary, timespent, assignee, project, sprint, priority.
  - **Edge Cases:** API rate limits, authentication failures.
  - **Sub-workflow:** No

#### 1.3 Data Aggregation

- **Overview:** Groups Jira issues by assignee and calculates total logged hours.
- **Nodes Involved:** 
  - Aggregate Hours by Team Member (Code)
- **Node Details:**
  - **Type:** Code Node (JavaScript)
  - **Role:** Processes raw Jira issues, grouping them by assignee, summing hours, and compiling issue details.
  - **Configuration:**
    - Extracts assignee name, email, project name, sprint, time spent (converted from seconds to hours).
    - Handles missing assignee or time data by using default placeholders.
  - **Expressions:** None; pure JS processing.
  - **Inputs:** Jira issues from previous node.
  - **Outputs:** Array of user objects with total hours and detailed issues.
  - **Edge Cases:** Missing assignee leads to "Unassigned"; time spent null or zero handled gracefully.
  - **Sub-workflow:** No

#### 1.4 Compliance Check

- **Overview:** Detects issues where no time has been logged and generates HTML reminders.
- **Nodes Involved:** 
  - Identify Issues with Missing Time Logs (Code)
- **Node Details:**
  - **Type:** Code Node (JavaScript)
  - **Role:** Filters each user's issues to find those with zero hours, then creates an HTML-formatted reminder message listing missing logs.
  - **Configuration:**
    - Generates HTML table with issue key, summary, status, priority, and sprint.
    - Only creates reminders if missing issues exist.
  - **Inputs:** Aggregated user-hour data.
  - **Outputs:** Reminder messages per user with missing logs.
  - **Edge Cases:** Users without missing logs produce no output; HTML injection risk low (data from Jira).
  - **Sub-workflow:** No

#### 1.5 Invoice Generation

- **Overview:** Creates plain-text invoice summaries with billing calculations and outputs as base64 text attachments.
- **Nodes Involved:** 
  - Generate Invoice Summary with Text Attachment (Code)
- **Node Details:**
  - **Type:** Code Node (JavaScript)
  - **Role:** For each user with hours > 0, generates a detailed invoice text listing issues, hours, and total amount based on a $50/hr rate. Encodes invoice as base64 binary for attachment.
  - **Configuration:**
    - Skips users with zero hours.
    - Constructs invoice with aligned columns: issue key, summary, hours, status.
    - Produces JSON metadata and binary text file.
  - **Inputs:** Aggregated user data.
  - **Outputs:** JSON + binary invoice files per user.
  - **Edge Cases:** Users with zero hours skipped; text encoding errors unlikely.
  - **Sub-workflow:** No

#### 1.6 Data Merging

- **Overview:** Merges the two data streams—missing time reminders and invoice data—into a single unified stream.
- **Nodes Involved:** 
  - Combine Reminder & Invoice Data Streams (Merge)
- **Node Details:**
  - **Type:** Merge Node
  - **Role:** Combines outputs from the compliance reminder node and the invoice generation node.
  - **Configuration:** Defaults to simple merge (no specified mode).
  - **Inputs:** Two inputs (reminders and invoices).
  - **Outputs:** Single combined output stream.
  - **Edge Cases:** Potential mismatch if streams differ in length; handled by next node.
  - **Sub-workflow:** No

#### 1.7 Data Reconciliation

- **Overview:** Aligns JSON user data with their corresponding binary invoice attachments ensuring completeness before sending.
- **Nodes Involved:** 
  - Reconcile JSON & Binary Attachments (Code)
- **Node Details:**
  - **Type:** Code Node (JavaScript)
  - **Role:** Matches JSON records (email, assignee) with their binary invoice files by assignee name. Handles cases with missing JSON or binary data.
  - **Configuration:** Iterates all items and attempts to pair JSON and binary data based on assignee.
  - **Inputs:** Merged stream of reminders and invoices.
  - **Outputs:** Complete records with both JSON and binary data.
  - **Edge Cases:** Missing binary or JSON data handled gracefully; prevents email failures.
  - **Sub-workflow:** No

#### 1.8 Email Dispatch

- **Overview:** Sends personalized emails to each developer with invoices and compliance reminders attached.
- **Nodes Involved:** 
  - Send Invoices & Reminders to Team (Gmail)
- **Node Details:**
  - **Type:** Gmail Node
  - **Role:** Sends email to each assignee’s email address with dynamic subject and HTML content, attaching the invoice text file.
  - **Configuration:**
    - Recipient: Dynamic from JSON.email
    - Subject: Project name dynamically inserted
    - Message: HTML format greeting, total hours, and signoff
    - Attachments: Binary invoice file attached
    - Credentials: OAuth2 Gmail account
  - **Inputs:** Reconciled JSON + binary items
  - **Outputs:** Emails sent
  - **Edge Cases:** Email delivery failures, invalid addresses, OAuth token expiry.
  - **Sub-workflow:** No

---

### 3. Summary Table

| Node Name                          | Node Type             | Functional Role                                | Input Node(s)                            | Output Node(s)                        | Sticky Note                                                                                         |
|-----------------------------------|-----------------------|-----------------------------------------------|-----------------------------------------|-------------------------------------|---------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’  | Manual Trigger        | Starts the workflow manually                   | None                                    | Fetch All Project Issues with Time Data |                                                                                                   |
| Fetch All Project Issues with Time Data | Jira                  | Retrieves all Jira issues with time info      | When clicking ‘Execute workflow’         | Aggregate Hours by Team Member       | Fetch All Project Issues with Time Data: Retrieves all Jira issues with time tracking info.         |
| Aggregate Hours by Team Member     | Code                  | Groups issues by assignee, sums hours          | Fetch All Project Issues with Time Data | Identify Issues with Missing Time Logs, Generate Invoice Summary with Text Attachment | Aggregate Hours by Team Member: Groups Jira issues by user and totals hours.                        |
| Identify Issues with Missing Time Logs | Code                  | Detects issues with zero logged hours, creates reminders | Aggregate Hours by Team Member           | Combine Reminder & Invoice Data Streams | Identify Issues with Missing Time Logs: Generates HTML reminders for missing time logs.            |
| Generate Invoice Summary with Text Attachment | Code                  | Generates detailed invoice text attachments    | Aggregate Hours by Team Member           | Combine Reminder & Invoice Data Streams | Generate Invoice Summary with Text Attachment: Creates user invoices with billing details.          |
| Combine Reminder & Invoice Data Streams | Merge                 | Merges reminders and invoices into one stream | Identify Issues with Missing Time Logs, Generate Invoice Summary with Text Attachment | Reconcile JSON & Binary Attachments  | Combine Reminder & Invoice Data Streams: Combines reminder & invoice outputs for unified processing. |
| Reconcile JSON & Binary Attachments | Code                  | Aligns JSON data with invoice files            | Combine Reminder & Invoice Data Streams | Send Invoices & Reminders to Team    | Reconcile JSON & Binary Attachments: Matches JSON and binary invoice data to avoid send failures.  |
| Send Invoices & Reminders to Team | Gmail                 | Sends personalized emails with attachments    | Reconcile JSON & Binary Attachments      | None                                | Send Invoices & Reminders to Team: Sends invoices and reminders to developers via email.           |
| Sticky Note                       | Sticky Note           | Comment block                                  | None                                    | None                                | Combine Reminder & Invoice Data Streams: Merges reminder and invoice outputs for unified processing. |
| Sticky Note1                      | Sticky Note           | Comment block                                  | None                                    | None                                | Identify Issues with Missing Time Logs: Detects zero-hour issues and creates reminders.            |
| Sticky Note2                      | Sticky Note           | Comment block                                  | None                                    | None                                | Aggregate Hours by Team Member: Groups Jira issues and totals hours by user.                       |
| Sticky Note3                      | Sticky Note           | Comment block                                  | None                                    | None                                | Fetch All Project Issues with Time Data: Retrieves all Jira issues with time tracking info.         |
| Sticky Note4                      | Sticky Note           | Comment block                                  | None                                    | None                                | Generate Invoice Summary with Text Attachment: Creates detailed user invoices as text files.       |
| Sticky Note5                      | Sticky Note           | Comment block                                  | None                                    | None                                | Send Invoices & Reminders to Team: Sends personalized emails with attachments.                     |
| Sticky Note6                      | Sticky Note           | Comment block                                  | None                                    | None                                | Reconcile JSON & Binary Attachments: Aligns JSON data with invoice files to prevent send failures. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**
   - Name: `When clicking ‘Execute workflow’`
   - Type: Manual Trigger
   - No parameters.
   - Connect output to next node.

2. **Create Jira Node**
   - Name: `Fetch All Project Issues with Time Data`
   - Type: Jira
   - Operation: `getAll`
   - Return All: true
   - Credentials: Configure Jira Software Cloud API OAuth2 credentials.
   - Connect input from Manual Trigger node.

3. **Create Code Node**
   - Name: `Aggregate Hours by Team Member`
   - Type: Code (JavaScript)
   - Code:
     - Group Jira issues by assignee.
     - Sum logged hours (convert seconds to hours).
     - Collect issue details: key, summary, status, priority, sprint.
     - Handle missing assignee/time data.
   - Connect input from Jira node.
   - Outputs to two subsequent nodes.

4. **Create Code Node for Missing Time Logs**
   - Name: `Identify Issues with Missing Time Logs`
   - Type: Code (JavaScript)
   - Code:
     - For each user, filter issues with zero hours.
     - Generate HTML table with issue details.
     - Create reminder messages only if missing issues exist.
   - Connect input from `Aggregate Hours by Team Member`.

5. **Create Code Node for Invoice Generation**
   - Name: `Generate Invoice Summary with Text Attachment`
   - Type: Code (JavaScript)
   - Code:
     - For each user with hours > 0, generate plain-text invoice.
     - Calculate total amount using $50/hr rate.
     - Create base64 encoded text file binary attachment.
   - Connect input from `Aggregate Hours by Team Member`.

6. **Create Merge Node**
   - Name: `Combine Reminder & Invoice Data Streams`
   - Type: Merge
   - Inputs: Two inputs from `Identify Issues with Missing Time Logs` and `Generate Invoice Summary with Text Attachment`.
   - Default merge mode.

7. **Create Code Node for Data Reconciliation**
   - Name: `Reconcile JSON & Binary Attachments`
   - Type: Code (JavaScript)
   - Code:
     - Iterate all merged items.
     - Match JSON records with corresponding binary data by assignee.
     - Handle partial data cases gracefully.
   - Connect input from Merge node.

8. **Create Gmail Node**
   - Name: `Send Invoices & Reminders to Team`
   - Type: Gmail
   - Parameters:
     - Send To: `={{ $json.email }}`
     - Subject: `={{ $json.project_name }}`
     - Message (HTML): Personalized greeting with name, project, total hours.
     - Attachments: Attach binary invoice file.
   - Credentials: Configure Gmail OAuth2 credentials.
   - Connect input from Reconcile node.

9. **Create Sticky Notes**
   - Add sticky notes per logical block for documentation and clarity following the content in the original workflow.

10. **Connect Nodes**
    - Manual Trigger → Jira Node
    - Jira Node → Aggregate Hours by Team Member
    - Aggregate Hours → Identify Issues with Missing Time Logs
    - Aggregate Hours → Generate Invoice Summary with Text Attachment
    - Identify Issues with Missing Time Logs + Generate Invoice Summary → Merge Node
    - Merge Node → Reconcile JSON & Binary Attachments
    - Reconcile Node → Gmail Node

11. **Save and Activate Workflow**

---

### 5. General Notes & Resources

| Note Content                                                                                   | Context or Link                                                                                     |
|------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| The workflow is designed for Jira Cloud and Gmail integrations using OAuth2 credentials.       | Jira Software Cloud API & Gmail OAuth2 setup required.                                            |
| Hourly rate is hardcoded at $50/hr in the invoice generation code; adjust as needed.           | Modify the RATE constant in the "Generate Invoice Summary with Text Attachment" code node.        |
| Email messages include HTML tables for reminders and plain-text attachments for invoices.      | Ensures clear communication and proper invoice formatting.                                       |
| This automation helps enforce time logging compliance and automates billing communication.     | Useful for project managers, finance teams, and development leads.                               |
| Workflow tested on n8n v1.112.6 and above for compatibility with JSON-binary reconciliation.   | Reconciliation code safe for recent n8n versions.                                                |
| For reference, see n8n documentation on Jira node: https://docs.n8n.io/integrations/n8n-nodes-base.jira/ | Detailed Jira node configuration and credential setup.                                            |
| Gmail node OAuth2 setup instructions: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/ | Required for secure email sending.                                                                |