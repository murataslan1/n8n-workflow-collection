Automate Email Marketing Campaigns with NocoDB & Brevo

https://n8nworkflows.xyz/workflows/automate-email-marketing-campaigns-with-nocodb---brevo-7134


# Automate Email Marketing Campaigns with NocoDB & Brevo

### 1. Workflow Overview

This workflow automates email marketing campaigns by integrating NocoDB as the data backend and Brevo (formerly Sendinblue) as the transactional email service. It supports scheduled batch processing of marketing flows defined in template records and manages user email dispatch with deduplication, validation, and status tracking.

The workflow is logically divided into two main blocks:

- **1.1 Insert User Records for Campaign Processing:**  
  Scheduled trigger inserts user records into a transaction table based on a selected marketing flow. It fetches flow templates, validates parameters, retrieves user data, inserts processing records, and removes duplicates.

- **1.2 Send Emails for Pending Campaign Records:**  
  Scheduled trigger every 30 minutes selects users with status "sending", validates email addresses, filters disposable emails, sends emails via Brevo, and updates statuses accordingly.

---

### 2. Block-by-Block Analysis

#### 2.1 Insert User Records for Campaign Processing

**Overview:**  
This block initiates the marketing campaign by selecting a flow, fetching its template, retrieving users, and inserting user records into the transaction table with status "processing". It ensures only unique users are processed.

**Nodes Involved:**  
- Schedule Trigger  
- Setup Flow  
- Get all flow templates from NocoDB  
- Filter Template  
- IF Template Parameters OK  
- Get user_id from dcp  
- IF user_id is not empty  
- Map Data  
- Add records By Status Processing  
- Wait  
- Insert Data By Status Processing  
- Remove Duplicates  
- Change Status to Sending

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Configuration: Triggers daily at 10:00 AM to start the insert flow process.  
  - Inputs: None  
  - Outputs: Connects to Setup Flow node  
  - Edge cases: Trigger misfires or schedule misconfiguration may delay processing.

- **Setup Flow**  
  - Type: Set  
  - Configuration: Sets a fixed numeric parameter `flow_id = 1` to choose the campaign flow.  
  - Inputs: From Schedule Trigger  
  - Outputs: To Get all flow templates from NocoDB  
  - Edge cases: Hardcoded flow_id limits flexibility unless modified.

- **Get all flow templates from NocoDB**  
  - Type: NocoDB (getAll)  
  - Configuration: Fetches all records from the `n8n-templates-ecrm` table storing flow metadata.  
  - Inputs: From Setup Flow  
  - Outputs: To Filter Template  
  - Edge cases: API token invalid or network failure causes data fetch failure.

- **Filter Template**  
  - Type: Filter  
  - Configuration: Filters flow templates where template.Id matches the selected `flow_id` from Setup Flow.  
  - Inputs: From Get all flow templates from NocoDB  
  - Outputs: To IF Template Parameters OK  
  - Edge cases: No matching template found will halt downstream processing.

- **IF Template Parameters OK**  
  - Type: If  
  - Configuration: Checks that key template fields (`flow_name`, `question_id`, `type`, `type_template_id`) are all non-empty.  
  - Inputs: From Filter Template  
  - Outputs: True branch to Get user_id from dcp  
  - Edge cases: Missing or empty template parameters stop processing.

- **Get user_id from dcp**  
  - Type: NocoDB (getAll)  
  - Configuration: Retrieves user records from the `cdp-ecrm` table filtered by `question_id` from the template.  
  - Inputs: From IF Template Parameters OK  
  - Outputs: To IF user_id is not empty  
  - Edge cases: No users found, API failures.

- **IF user_id is not empty**  
  - Type: If  
  - Configuration: Validates that `user_id` field in each user record is non-empty.  
  - Inputs: From Get user_id from dcp  
  - Outputs: True branch to Map Data  
  - Edge cases: Empty user_id skips record.

- **Map Data**  
  - Type: Set  
  - Configuration: Maps and combines user data with flow template fields into a unified format for insertion.  
  - Inputs: From IF user_id is not empty and Filter Template (for template values)  
  - Outputs: To Add records By Status Processing  
  - Edge cases: Expression failures if referenced nodes missing or empty.

- **Add records By Status Processing**  
  - Type: NocoDB (create)  
  - Configuration: Inserts a new record into `n8n-transaction-ecrm` table with combined user and flow data; sets status to `0-processing`.  
  - Inputs: From Map Data  
  - Outputs: To Wait  
  - Edge cases: Insert failures, duplicate key errors.

- **Wait**  
  - Type: Wait  
  - Configuration: Waits for 1 second to allow for data stabilization before querying.  
  - Inputs: From Add records By Status Processing  
  - Outputs: To Insert Data By Status Processing  
  - Edge cases: Delay too short or too long may cause timing issues.

- **Insert Data By Status Processing**  
  - Type: NocoDB (getAll)  
  - Configuration: Fetches all records from `n8n-transaction-ecrm` where status is `0-processing`.  
  - Inputs: From Wait  
  - Outputs: To Remove Duplicates  
  - Edge cases: Large data volumes may affect performance.

- **Remove Duplicates**  
  - Type: Remove Duplicates  
  - Configuration: Removes duplicate user entries based on `user_id`, keeping only the first occurrence.  
  - Inputs: From Insert Data By Status Processing  
  - Outputs: To Change Status to Sending  
  - Edge cases: Incorrect field specification may fail deduplication.

- **Change Status to Sending**  
  - Type: NocoDB (update)  
  - Configuration: Updates the status of selected records from `0-processing` to `1-sending`.  
  - Inputs: From Remove Duplicates  
  - Outputs: None (end of this block)  
  - Edge cases: Update failures or race conditions.

---

#### 2.2 Send Emails for Pending Campaign Records

**Overview:**  
This block periodically processes users with status "sending", validates their email addresses, filters disposable emails, sends transactional emails via Brevo, and updates the transaction status accordingly.

**Nodes Involved:**  
- Schedule Trigger1  
- Insert Data By Status Sending  
- IF Type Email  
- If email is not empty  
- Disposal Check  
- Brevo Send Email  
- Update Data  
- Status-no-email  
- Status-disposal-email

**Node Details:**

- **Schedule Trigger1**  
  - Type: Schedule Trigger  
  - Configuration: Triggers every hour (every 60 minutes) to initiate sending process.  
  - Inputs: None  
  - Outputs: To Insert Data By Status Sending  
  - Edge cases: Misconfigured interval affects timely email dispatch.

- **Insert Data By Status Sending**  
  - Type: NocoDB (getAll)  
  - Configuration: Retrieves all records from `n8n-transaction-ecrm` table where status equals `1-sending`.  
  - Inputs: From Schedule Trigger1  
  - Outputs: To IF Type Email  
  - Edge cases: Large data retrieval, API or connectivity issues.

- **IF Type Email**  
  - Type: If  
  - Configuration: Checks that the `type` field is exactly `"email"` and that `user_id` is not empty.  
  - Inputs: From Insert Data By Status Sending  
  - Outputs: True branch to If email is not empty  
  - Edge cases: Non-email types or missing user_id skip sending.

- **If email is not empty**  
  - Type: If  
  - Configuration: Checks that the `email` field is non-empty.  
  - Inputs: From IF Type Email  
  - Outputs: True branch to Disposal Check; False branch to Status-no-email  
  - Edge cases: Missing email triggers status update to "no-email".

- **Disposal Check**  
  - Type: If  
  - Configuration: Uses regex to detect disposable or temporary email domains/addresses. If match found, marks as disposable.  
  - Inputs: From If email is not empty  
  - Outputs: True branch (not disposable) to Brevo Send Email; False branch to Status-disposal-email  
  - Edge cases: Regex false positives/negatives, incomplete domain list.

- **Brevo Send Email**  
  - Type: Brevo (Sendinblue) node for sending transactional emails  
  - Configuration: Sends templated email using Brevo template ID from `type_template_id`, to `email`, with parameters like `first_name` and `discount_code`. Includes email tags for campaign tracking.  
  - Inputs: From Disposal Check (true branch)  
  - Outputs: To Update Data  
  - Edge cases: API errors, invalid template ID, rate limits, authentication failures.

- **Update Data**  
  - Type: NocoDB (update)  
  - Configuration: Updates the transaction record with the email send result (`messageId`), timestamp (`sent_at`), and sets status to `2-sent`.  
  - Inputs: From Brevo Send Email  
  - Outputs: None (end of sending process)  
  - Edge cases: Update failures, mismatched record IDs.

- **Status-no-email**  
  - Type: NocoDB (update)  
  - Configuration: For records with empty email, updates status to `3-no-email`.  
  - Inputs: From If email is not empty (false branch)  
  - Outputs: None  
  - Edge cases: Update failures, record locking.

- **Status-disposal-email**  
  - Type: NocoDB (update)  
  - Configuration: For records flagged as disposable email, updates status to `4-disposal-email`.  
  - Inputs: From Disposal Check (false branch)  
  - Outputs: None  
  - Edge cases: Update failures, concurrency issues.

---

### 3. Summary Table

| Node Name                    | Node Type                | Functional Role                             | Input Node(s)                 | Output Node(s)                    | Sticky Note                                                                                              |
|------------------------------|--------------------------|---------------------------------------------|------------------------------|----------------------------------|--------------------------------------------------------------------------------------------------------|
| Schedule Trigger             | Schedule Trigger         | Starts insert user records process daily   | None                         | Setup Flow                       |                                                                                                        |
| Setup Flow                  | Set                      | Sets selected flow_id for campaign          | Schedule Trigger             | Get all flow templates from NocoDB |                                                                                                        |
| Get all flow templates from NocoDB | NocoDB (getAll)        | Fetches all flow templates                   | Setup Flow                  | Filter Template                  |                                                                                                        |
| Filter Template             | Filter                   | Filters templates by selected flow_id       | Get all flow templates       | IF Template Parameters OK        |                                                                                                        |
| IF Template Parameters OK   | If                       | Validates required template parameters      | Filter Template             | Get user_id from dcp             |                                                                                                        |
| Get user_id from dcp         | NocoDB (getAll)          | Retrieves user records for the campaign     | IF Template Parameters OK   | IF user_id is not empty          |                                                                                                        |
| IF user_id is not empty      | If                       | Checks user_id non-empty                      | Get user_id from dcp         | Map Data                        |                                                                                                        |
| Map Data                    | Set                      | Combines user and flow template data        | IF user_id is not empty      | Add records By Status Processing |                                                                                                        |
| Add records By Status Processing | NocoDB (create)          | Inserts user-flow records with status=0-processing | Map Data                    | Wait                           |                                                                                                        |
| Wait                        | Wait                     | Waits 1 second before next fetch             | Add records By Status Processing | Insert Data By Status Processing  |                                                                                                        |
| Insert Data By Status Processing | NocoDB (getAll)          | Fetches processing records with status=0    | Wait                        | Remove Duplicates               |                                                                                                        |
| Remove Duplicates           | Remove Duplicates        | Deduplicates user records based on user_id | Insert Data By Status Processing | Change Status to Sending        |                                                                                                        |
| Change Status to Sending    | NocoDB (update)          | Updates status 0-processing → 1-sending      | Remove Duplicates            | None                           |                                                                                                        |
| Schedule Trigger1           | Schedule Trigger         | Triggers sending process every hour         | None                        | Insert Data By Status Sending   |                                                                                                        |
| Insert Data By Status Sending | NocoDB (getAll)          | Fetches records with status=1-sending        | Schedule Trigger1           | IF Type Email                  |                                                                                                        |
| IF Type Email              | If                       | Checks type=email and user_id not empty      | Insert Data By Status Sending | If email is not empty           |                                                                                                        |
| If email is not empty       | If                       | Checks email field non-empty                  | IF Type Email               | Disposal Check, Status-no-email  |                                                                                                        |
| Disposal Check             | If                       | Filters disposable emails using regex        | If email is not empty       | Brevo Send Email, Status-disposal-email |                                                                                                        |
| Brevo Send Email           | SendInBlue (Brevo)       | Sends transactional email with template     | Disposal Check (true)       | Update Data                    |                                                                                                        |
| Update Data                | NocoDB (update)          | Updates record with send result and status 2 | Brevo Send Email            | None                           |                                                                                                        |
| Status-no-email            | NocoDB (update)          | Updates status to 3-no-email for empty emails | If email is not empty (false) | None                           |                                                                                                        |
| Status-disposal-email      | NocoDB (update)          | Updates status to 4-disposal-email for disposables | Disposal Check (false)      | None                           |                                                                                                        |
| Sticky Note                | Sticky Note              | Workflow description and overview           | None                        | None                           | See detailed description in Sticky Note node content                                                   |
| Sticky Note1               | Sticky Note              | Example record from n8n-transaction table   | None                        | None                           | Contains example JSON schema of n8n-transaction-ecrm table                                            |
| Sticky Note2               | Sticky Note              | Example record from n8n-templates table      | None                        | None                           | Contains example JSON schema of n8n-templates-ecrm table                                              |
| Sticky Note3               | Sticky Note              | Example user records data                      | None                        | None                           | Contains example JSON user data from cdp-ecrm                                                         |
| Sticky Note4               | Sticky Note              | Database example header                        | None                        | None                           |                                                                                                        |
| Sticky Note5               | Sticky Note              | Detailed explanation of every node            | None                        | None                           | Contains comprehensive node-by-node explanation                                                       |
| Sticky Note6               | Sticky Note              | Section header: Insert user_id                 | None                        | None                           |                                                                                                        |
| Sticky Note7               | Sticky Note              | Section header: Sending Email                   | None                        | None                           |                                                                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger node ("Schedule Trigger")**  
   - Type: Schedule Trigger  
   - Set to trigger daily at 10:00 AM (triggerAtHour = 10).

2. **Add Set node ("Setup Flow")**  
   - Assign numeric variable `flow_id = 1`.  
   - Connect input from "Schedule Trigger".

3. **Add NocoDB node ("Get all flow templates from NocoDB")**  
   - Operation: getAll  
   - Table: `n8n-templates-ecrm` (flow templates)  
   - Project ID: your NocoDB project  
   - Authentication: NocoDB API Token credentials  
   - Connect input from "Setup Flow".

4. **Add Filter node ("Filter Template")**  
   - Condition: template `Id` equals the `flow_id` from "Setup Flow".  
   - Connect input from "Get all flow templates from NocoDB".

5. **Add If node ("IF Template Parameters OK")**  
   - Conditions: `flow_name`, `question_id`, `type`, `type_template_id` all not empty.  
   - Connect input from "Filter Template".

6. **Add NocoDB node ("Get user_id from dcp")**  
   - Operation: getAll  
   - Table: `cdp-ecrm` (user records)  
   - Use `question_id` from template as view/filter ID.  
   - Authentication: NocoDB API Token credentials  
   - Connect input from true branch of "IF Template Parameters OK".

7. **Add If node ("IF user_id is not empty")**  
   - Condition: `user_id` is not empty.  
   - Connect input from "Get user_id from dcp".

8. **Add Set node ("Map Data")**  
   - Map user and template fields into unified record: `user_id`, `question_id`, `type`, `flow_name`, `type_template_id`, `flow_id`, plus user details (`email`, `first_name`, etc.).  
   - Connect input from true branch of "IF user_id is not empty".

9. **Add NocoDB node ("Add records By Status Processing")**  
   - Operation: create  
   - Table: `n8n-transaction-ecrm`  
   - Insert combined records with `status = 0-processing`.  
   - Connect input from "Map Data".

10. **Add Wait node ("Wait")**  
    - Wait for 1 second.  
    - Connect input from "Add records By Status Processing".

11. **Add NocoDB node ("Insert Data By Status Processing")**  
    - Operation: getAll  
    - Table: `n8n-transaction-ecrm`  
    - Filter by `status = 0-processing`.  
    - Authentication: NocoDB API Token  
    - Connect input from "Wait".

12. **Add Remove Duplicates node ("Remove Duplicates")**  
    - Deduplicate on `user_id`.  
    - Connect input from "Insert Data By Status Processing".

13. **Add NocoDB node ("Change Status to Sending")**  
    - Operation: update  
    - Table: `n8n-transaction-ecrm`  
    - Update status from `0-processing` to `1-sending`.  
    - Connect input from "Remove Duplicates".

---

14. **Create Schedule Trigger node ("Schedule Trigger1")**  
    - Type: Schedule Trigger  
    - Trigger interval: every 1 hour.

15. **Add NocoDB node ("Insert Data By Status Sending")**  
    - Operation: getAll  
    - Table: `n8n-transaction-ecrm`  
    - Filter by `status = 1-sending`.  
    - Connect input from "Schedule Trigger1".

16. **Add If node ("IF Type Email")**  
    - Condition: `type` equals `"email"` and `user_id` is not empty.  
    - Connect input from "Insert Data By Status Sending".

17. **Add If node ("If email is not empty")**  
    - Condition: `email` is not empty.  
    - Connect input from true branch of "IF Type Email".

18. **Add If node ("Disposal Check")**  
    - Condition: email does NOT match regex of disposable domains (list provided in node).  
    - Connect input from true branch of "If email is not empty".

19. **Add SendInBlue (Brevo) node ("Brevo Send Email")**  
    - Operation: sendTemplate  
    - Template ID: from `type_template_id` field  
    - Recipient: `email` field  
    - Template parameters: `first_name`, `discount_code`  
    - Email tags: `flow_name`  
    - Authentication: Brevo API credentials  
    - Connect input from true branch of "Disposal Check".

20. **Add NocoDB node ("Update Data")**  
    - Operation: update  
    - Table: `n8n-transaction-ecrm`  
    - Update fields: `sent_result` with Brevo messageId, `sent_at` with current timestamp, `status` to `2-sent`.  
    - Connect input from "Brevo Send Email".

21. **Add NocoDB node ("Status-no-email")**  
    - Operation: update  
    - Table: `n8n-transaction-ecrm`  
    - Update status to `3-no-email` for missing emails.  
    - Connect input from false branch of "If email is not empty".

22. **Add NocoDB node ("Status-disposal-email")**  
    - Operation: update  
    - Table: `n8n-transaction-ecrm`  
    - Update status to `4-disposal-email` for disposable emails.  
    - Connect input from false branch of "Disposal Check".

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                   | Context or Link                                                                                                        |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| Detailed workflow node explanations, including purpose and data flow.                                                                                                                                                                          | Sticky Note node "Sticky Note5" in the workflow                                                                         |
| Example JSON data samples for `n8n-transaction-ecrm`, `n8n-templates-ecrm`, and user records from `cdp-ecrm`.                                                                                                                                  | Sticky Notes "Sticky Note1", "Sticky Note2", "Sticky Note3"                                                             |
| Workflow description highlighting two main flows: insert user records and send emails, including handling of duplicate users and email validations.                                                                                          | Sticky Note node "Sticky Note"                                                                                           |
| Regex pattern for disposable email domains used in "Disposal Check" node to identify and exclude temporary or spammy emails.                                                                                                                  | Node "Disposal Check"                                                                                                   |
| Brevo email sending requires pre-created templates in Brevo platform; their IDs must be stored in the `type_template_id` field in templates table.                                                                                             | Node "Brevo Send Email"                                                                                                |
| Ensure NocoDB API Token credentials and Brevo API credentials are configured correctly in n8n.                                                                                                                                                 | Credential settings on NocoDB and Brevo nodes                                                                           |
| To add another campaign flow, duplicate the insert user records flow and change the `flow_id` in the "Setup Flow" node accordingly.                                                                                                          | Described in workflow Sticky Note "Sticky Note"                                                                        |

---

**Disclaimer:**  
The text provided is extracted exclusively from an n8n automated workflow integration. It strictly complies with content policies and contains no illegal or protected content. All processed data is public and legal.