Automate Document Approvals with Multi-Level Workflows using Supabase & Gmail

https://n8nworkflows.xyz/workflows/automate-document-approvals-with-multi-level-workflows-using-supabase---gmail-8174


# Automate Document Approvals with Multi-Level Workflows using Supabase & Gmail

### 1. Workflow Overview

This workflow automates a **multi-level document approval process** using Supabase as the backend database and Gmail for email notifications. It is designed for organizations that require structured approvals for documents such as policies, contracts, or proposals with audit trail capabilities.

The workflow consists of the following logical blocks:

- **1.1 Form Submission and Document Storage**: Captures a submitted document via a form trigger, uploads it to Supabase storage, and saves document metadata to the `documents` table.

- **1.2 Initial Workflow Level and Approver Assignment**: Retrieves the first approval level, fetches users assigned to the respective role, generates unique tokens for each approver, creates approval records, and sends email notifications with approval links.

- **1.3 Approval Link Processing (Webhook Entry Point)**: Handles incoming approval or rejection decisions from approvers clicking email links. Retrieves the corresponding approval record based on the token and updates its status.

- **1.4 Decision Evaluation and Workflow Progression**: Based on the approval decision, determines whether to reject the document immediately or proceed to the next approval level. If there is a next level, assigns new approvers, generates tokens, sends emails, and logs audit events. If it is the last level, updates the document status to Approved.

- **1.5 Audit Logging**: Records all key workflow events such as approvals sent, approvals granted, and rejections in the `audit_logs` table for compliance and traceability.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Form Submission and Document Storage

**Overview:**  
This block captures document submission via a form, uploads the binary file to Supabase storage, and saves document metadata to Supabase’s `documents` table.

**Nodes Involved:**  
- `start_approval_form` (Form Trigger)  
- `upload_to_supabase_storage` (HTTP Request)  
- `save_document` (Supabase)  
- `get_workflow_level_one` (Supabase)  
- `get_user_by_role` (Supabase)  
- `create_uuid_token` (Crypto)  
- `create_record_approvals` (Supabase)  
- `fetch_file_to_review` (HTTP Request)  
- `send_email` (Gmail)  
- `audit_invites` (Supabase)  
- `end_form` (Form Completion)

**Node Details:**

- **start_approval_form**  
  - Type: Form Trigger  
  - Captures user input: Document Title (string), Description (textarea), and a PDF file upload (required).  
  - Path: `approval-process-start`  
  - Outputs form data to start the document approval process.

- **upload_to_supabase_storage**  
  - Type: HTTP Request  
  - Uploads the submitted file binary to Supabase Storage bucket `test-n8n`.  
  - Uses Supabase API credentials for authentication.  
  - URL constructed dynamically with filename from form submission.  
  - Potential failure: File upload failure, credential errors.

- **save_document**  
  - Type: Supabase node  
  - Inserts a new record into `documents` table with fields: title, content (filename), submitted_by (hardcoded as `1`), and status set to "Pending".  
  - Credentials: Supabase API  
  - Input from previous node’s binary upload metadata.

- **get_workflow_level_one**  
  - Type: Supabase  
  - Retrieves the first workflow level (where `level_number` = 1) from `workflow_levels` table.  
  - Used to determine the initial approver role.

- **get_user_by_role**  
  - Type: Supabase  
  - Fetches all users having the role ID retrieved from the workflow level.  
  - Returns all approvers for level one.

- **create_uuid_token**  
  - Type: Crypto (Generate UUID)  
  - Generates a unique token for secure approval links.

- **create_record_approvals**  
  - Type: Supabase  
  - Creates individual approval records in `approvals` table with document ID, level ID, approver ID, generated token, status set to the document status (Pending), and expiry time 48 hours ahead.  
  - Credentials: Supabase API.

- **fetch_file_to_review**  
  - Type: HTTP Request  
  - Downloads the uploaded document file from Supabase Storage for email attachment.  
  - Uses Supabase credentials.

- **send_email**  
  - Type: Gmail  
  - Sends email to each approver with approval and rejection links including their unique token.  
  - Email subject includes document title.  
  - Credentials: Gmail OAuth2.  
  - Potential failure: Email sending errors, invalid recipient email.

- **audit_invites**  
  - Type: Supabase  
  - Logs audit event in `audit_logs` indicating approval requests sent for level 1.  
  - Fields include document ID, action `approval_sent`, system actor email, and details with level and role info.

- **end_form**  
  - Type: Form Completion  
  - Marks the form submission process as complete with a confirmation message "Approval Workflow Started."

---

#### 2.2 Approval Link Processing (Webhook Entry Point)

**Overview:**  
Handles approval or rejection clicks from email links by approvers. Validates token, updates approval record status, and triggers decision logic.

**Nodes Involved:**  
- `Webhook` (Webhook)  
- `get_approval_data` (Supabase)  
- `If` (If)  
- `update_approval_data` (Supabase)  
- `check_reject_or_approve` (If)  
- `response_message`, `response_message1`, `response_message2` (Set)  
- `Respond to Webhook1` (Respond to Webhook)

**Node Details:**

- **Webhook**  
  - Type: Webhook  
  - Path: `approve`  
  - Entry point triggered by HTTP GET requests when approver clicks email links.  
  - Captures query parameters: `token` and `decision` (approved/rejected).

- **get_approval_data**  
  - Type: Supabase  
  - Fetches approval record from `approvals` table matching the token from webhook query.  
  - If no record found, triggers empty check.

- **If**  
  - Type: If  
  - Checks if approval data is empty (invalid or expired token).  
  - If empty, sends a "Not a value token" response and ends workflow.

- **update_approval_data**  
  - Type: Supabase  
  - Updates the approval record matching approver ID, status Pending, and token.  
  - Sets status to webhook decision and records `acted_at` timestamp.

- **check_reject_or_approve**  
  - Type: If  
  - Evaluates if decision is "approved".  
  - If approved, proceeds with workflow level progression; else updates document status to Rejected.

- **response_message**  
  - Type: Set  
  - Sets response text to "Not a value token" for invalid tokens.

- **response_message1**  
  - Type: Set  
  - Sets response text to "Rejected" after rejection.

- **response_message2**  
  - Type: Set  
  - Sets response text to "Approved" after approval.

- **Respond to Webhook1**  
  - Type: Respond to Webhook  
  - Sends the final textual response to the approver’s browser confirming workflow completion or errors.

---

#### 2.3 Decision Evaluation and Workflow Progression

**Overview:**  
Processes the approval decision, updates document status if rejected, or moves the approval process to the next level if approved.

**Nodes Involved:**  
- `check_reject_or_approve` (If)  
- `Final Update Document` (Supabase)  
- `get_level_details` (Supabase)  
- `get_next_level` (Supabase)  
- `is_last_level` (If)  
- `get_workflow_by_level` (Supabase)  
- `get_user_by_role1` (Supabase)  
- `generate_uuid` (Crypto)  
- `create_approval_record` (Supabase)  
- `get_document_details` (Supabase)  
- `fetch_file_to_review1` (HTTP Request)  
- `send_emai_by_level` (Gmail)  
- `Audit1` (Supabase)  
- `Audit` (Supabase)  
- `Final Update Document` (Supabase)

**Node Details:**

- **check_reject_or_approve**  
  - If node decides approval path or rejection path.  
  - Rejection path directly updates document status to "Rejected".  
  - Approval path continues workflow.

- **Final Update Document**  
  - Updates the `documents` table record status and timestamp based on approval or rejection results.

- **get_level_details**  
  - Retrieves current approval level data from `workflow_levels`.

- **get_next_level**  
  - Fetches next workflow level having level_number greater than current.

- **is_last_level**  
  - Checks if `get_next_level` returned any record.  
  - If no next level, document is approved final; else proceed to next level.

- **get_workflow_by_level**  
  - Retrieves workflow level details for next level.

- **get_user_by_role1**  
  - Fetches users assigned to the next level's role.

- **generate_uuid**  
  - Generates unique tokens for next level approvers.

- **create_approval_record**  
  - Inserts new approval records for next level approvers with token and expiry.

- **get_document_details**  
  - Retrieves document metadata for email content.

- **fetch_file_to_review1**  
  - Fetches document file from Supabase storage for attachment.

- **send_emai_by_level**  
  - Sends approval request emails to next level approvers with links.

- **Audit1**  
  - Logs audit event for approval sent at next level.

- **Audit**  
  - Logs audit event for final update (approval or rejection).

---

### 3. Summary Table

| Node Name                | Node Type             | Functional Role                        | Input Node(s)                  | Output Node(s)                      | Sticky Note                                                                                         |
|--------------------------|-----------------------|-------------------------------------|-------------------------------|-----------------------------------|--------------------------------------------------------------------------------------------------|
| Webhook                  | Webhook               | Entry point for approval decision    | —                             | get_approval_data                 | Triggered when approver clicks approval/rejection link. Captures `token` and `decision`.         |
| get_approval_data        | Supabase              | Retrieve approval record by token    | Webhook                       | If                               |                                                                                                  |
| If                       | If                    | Check if approval record exists      | get_approval_data              | update_approval_data, response_message |                                                                                                  |
| update_approval_data     | Supabase              | Update approval status and timestamp | If (approval record exists)    | check_reject_or_approve           |                                                                                                  |
| check_reject_or_approve  | If                    | Decision check approve or reject     | update_approval_data           | get_level_details, Final Update Document |                                                                                                  |
| Final Update Document    | Supabase              | Update document status and timestamp | check_reject_or_approve, is_last_level | Audit                          |                                                                                                  |
| get_level_details        | Supabase              | Get current workflow level details   | check_reject_or_approve        | get_next_level                   |                                                                                                  |
| get_next_level           | Supabase              | Get next workflow level              | get_level_details              | is_last_level                   |                                                                                                  |
| is_last_level            | If                    | Check if current level is last       | get_next_level                 | get_workflow_by_level, Final Update Document |                                                                                                  |
| get_workflow_by_level    | Supabase              | Get workflow details by level number | is_last_level (true branch)   | get_user_by_role1                |                                                                                                  |
| get_user_by_role1        | Supabase              | Get users by role for next level     | get_workflow_by_level          | generate_uuid                   |                                                                                                  |
| generate_uuid            | Crypto                | Generate unique tokens for approvals | get_user_by_role1              | create_approval_record           |                                                                                                  |
| create_approval_record   | Supabase              | Create approval records for next level | generate_uuid                 | get_document_details            |                                                                                                  |
| get_document_details     | Supabase              | Retrieve document metadata           | create_approval_record         | fetch_file_to_review1            |                                                                                                  |
| fetch_file_to_review1    | HTTP Request          | Fetch document file for email        | get_document_details           | send_emai_by_level              |                                                                                                  |
| send_emai_by_level       | Gmail                 | Send approval request emails         | fetch_file_to_review1          | Audit1                          |                                                                                                  |
| Audit1                   | Supabase              | Log audit entry for approval sent    | send_emai_by_level             | response_message2               |                                                                                                  |
| Audit                    | Supabase              | Log final audit entry (approved/rejected) | Final Update Document         | response_message1               |                                                                                                  |
| response_message         | Set                   | Response for invalid token           | If (empty approval data)       | Respond to Webhook1             |                                                                                                  |
| response_message1        | Set                   | Response message after rejection     | Audit                         | Respond to Webhook1             |                                                                                                  |
| response_message2        | Set                   | Response message after approval      | Audit1                        | Respond to Webhook1             |                                                                                                  |
| Respond to Webhook1      | Respond to Webhook     | Send HTTP response to approver       | response_message, response_message1, response_message2 | —                               |                                                                                                  |
| start_approval_form      | Form Trigger          | Capture document submission           | —                             | upload_to_supabase_storage       | User submits document via form.                                                                    |
| upload_to_supabase_storage | HTTP Request        | Upload file to Supabase storage       | start_approval_form            | save_document                   |                                                                                                  |
| save_document            | Supabase              | Save document metadata                | upload_to_supabase_storage     | get_workflow_level_one           |                                                                                                  |
| get_workflow_level_one   | Supabase              | Get first workflow level              | save_document                 | get_user_by_role                |                                                                                                  |
| get_user_by_role         | Supabase              | Get users by role for level one      | get_workflow_level_one         | create_uuid_token               |                                                                                                  |
| create_uuid_token        | Crypto                | Generate unique token                 | get_user_by_role              | create_record_approvals          |                                                                                                  |
| create_record_approvals  | Supabase              | Create approval records for level one | create_uuid_token             | fetch_file_to_review            |                                                                                                  |
| fetch_file_to_review     | HTTP Request          | Fetch document for email attachment   | create_record_approvals        | send_email                     |                                                                                                  |
| send_email               | Gmail                 | Send approval email                   | fetch_file_to_review           | audit_invites                  |                                                                                                  |
| audit_invites            | Supabase              | Log approval sent audit entry        | send_email                    | end_form                      |                                                                                                  |
| end_form                 | Form                  | Marks form completion                 | audit_invites                 | —                               |                                                                                                  |
| Sticky Note              | Sticky Note           | Workflow overview and instructions   | —                             | —                               | See note content in Section 5.                                                                    |
| Sticky Note1             | Sticky Note           | Database schema details               | —                             | —                               | See note content in Section 5.                                                                    |
| Sticky Note2             | Sticky Note           | Reminder to update Supabase storage URL | —                         | —                               |                                                                                                  |
| Sticky Note3             | Sticky Note           | Label for Form Submit flow            | —                             | —                               |                                                                                                  |
| Sticky Note4             | Sticky Note           | Label for Next Level Approval         | —                             | —                               |                                                                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Form Trigger node** (`start_approval_form`):
   - Set path to `approval-process-start`.
   - Add form fields:
     - Title (text, required)
     - Description (textarea)
     - File upload (accept `.pdf`, required)
   - Enable "Ignore Bots", set button label as "Send for Approval".

2. **Add HTTP Request node** (`upload_to_supabase_storage`):
   - Method: POST
   - URL: `https://<your_project_id>.supabase.co/storage/v1/object/test-n8n/{{ $binary.data.fileName }}`
   - Authentication: Use Supabase API credentials.
   - Send binary data from form.
   - Input field: `data`

3. **Add Supabase node** (`save_document`):
   - Operation: Insert
   - Table: `documents`
   - Fields:
     - `title`: from form Title field
     - `content`: file name from upload node
     - `submitted_by`: hardcoded `1` (can customize)
     - `status`: "Pending"
   - Use Supabase credentials.

4. **Add Supabase node** (`get_workflow_level_one`):
   - Operation: Get
   - Table: `workflow_levels`
   - Filter: `level_number` equals 1
   - Use Supabase credentials.

5. **Add Supabase node** (`get_user_by_role`):
   - Operation: Get All
   - Table: `users`
   - Filter: `role_id` equals the role_id from `get_workflow_level_one` result
   - Use Supabase credentials.

6. **Add Crypto node** (`create_uuid_token`):
   - Action: Generate UUID

7. **Add Supabase node** (`create_record_approvals`):
   - Operation: Insert
   - Table: `approvals`
   - Fields:
     - `document_id`: `save_document` ID
     - `level_id`: `get_workflow_level_one` ID
     - `approver_id`: user ID from `get_user_by_role`
     - `token`: UUID from `create_uuid_token`
     - `status`: `save_document` status
     - `expiry_time`: current time + 48 hours

8. **Add HTTP Request node** (`fetch_file_to_review`):
   - Method: GET
   - URL: file URL from Supabase storage using filename from upload node
   - Authentication: Supabase credentials

9. **Add Gmail node** (`send_email`):
   - To: email from `create_uuid_token` (assumed user email)
   - Subject: "Document Approval Request - {{document title}}"
   - Message: Include approve and reject links with tokens and decisions as URL parameters.
   - Attach the file binary from `fetch_file_to_review`.
   - Use Gmail OAuth2 credentials.

10. **Add Supabase node** (`audit_invites`):
    - Operation: Insert
    - Table: `audit_logs`
    - Fields:
      - `document_id`: from `save_document`
      - `action`: "approval_sent"
      - `actor_email`: "system@workflow"
      - `details`: level and role info

11. **Add Form node** (`end_form`):
    - Operation: Completion
    - Completion message: "Approval Workflow Started."

12. **Connect nodes sequentially from form trigger through upload, save document, get workflow level, get users, generate tokens, create approvals, fetch file, send email, audit log, to form completion.**

---

13. **Add Webhook node** (`Webhook`):
    - Path: `approve`
    - Method: GET
    - Captures query parameters: `token`, `decision`

14. **Add Supabase node** (`get_approval_data`):
    - Operation: Get
    - Table: `approvals`
    - Filter by `token` from webhook query

15. **Add If node** (`If`):
    - Condition: Check if result from `get_approval_data` is empty
    - True: Set response message "Not a value token" and respond webhook
    - False: Continue

16. **Add Supabase node** (`update_approval_data`):
    - Operation: Update
    - Table: `approvals`
    - Filter by `approver_id`, `status`=Pending, and `token`
    - Set `status` to `decision` from webhook, set `acted_at` to now

17. **Add If node** (`check_reject_or_approve`):
    - Condition: Check if `decision` = "approved"
    - If Yes: Proceed to next level workflow logic
    - If No: Update document status to "Rejected"

18. **Add Supabase node** (`Final Update Document`):
    - Operation: Update
    - Table: `documents`
    - Filter by document ID from approval data
    - Update status and updated_at timestamp

19. **Add Supabase node** (`get_level_details`):
    - Operation: Get
    - Table: `workflow_levels`
    - Filter by current approval level ID from approval data

20. **Add Supabase node** (`get_next_level`):
    - Operation: Get All (limit 1)
    - Table: `workflow_levels`
    - Filter: `level_number` > current level number

21. **Add If node** (`is_last_level`):
    - Condition: Check if `get_next_level` output is empty (last level)
    - If True: Update document status to "Approved" (connect to `Final Update Document`)
    - If False: Continue to next level approvals

22. **Add Supabase node** (`get_workflow_by_level`):
    - Operation: Get
    - Table: `workflow_levels`
    - Filter by next level number

23. **Add Supabase node** (`get_user_by_role1`):
    - Operation: Get All
    - Table: `users`
    - Filter by role ID from next level

24. **Add Crypto node** (`generate_uuid`):
    - Generate UUID for next level approvers

25. **Add Supabase node** (`create_approval_record`):
    - Insert new approval records for next level approvers with generated tokens, expiry, and status Pending

26. **Add Supabase node** (`get_document_details`):
    - Get document metadata (title, content) for email

27. **Add HTTP Request node** (`fetch_file_to_review1`):
    - Fetch document file from Supabase Storage for email attachment

28. **Add Gmail node** (`send_emai_by_level`):
    - Send approval request emails to next level approvers with approve/reject links

29. **Add Supabase node** (`Audit1`):
    - Log audit event for approvals sent at next level

30. **Add Supabase node** (`Audit`):
    - Log audit event after final document status update

31. **Add Set nodes** (`response_message`, `response_message1`, `response_message2`) to set response texts for various webhook responses.

32. **Add Respond to Webhook node** (`Respond to Webhook1`) to send final HTTP response.

33. **Connect all nodes logically as per the data flow with appropriate error checks.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Context or Link                                                                                     |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| ## Multi-Level Document Approval & Audit Workflow<br><br>This workflow automates a **document approval process** using Supabase and Gmail.<br><br>### Who it’s for<br>- Teams requiring structured multi-level approvals.<br>- Companies managing policies, contracts, or proposals.<br>- Users leveraging Supabase backend.<br><br>### How to set up<br>- Configure Supabase credentials.<br>- Adjust table and field names to your schema.<br>- Connect Gmail OAuth2.<br>- Adjust expiry time (default 48h).<br>- Deploy and test via Form Trigger.<br><br>### Customization<br>- Add multiple approval levels.<br>- Replace Gmail with other notification channels.<br>- Update endpoint URLs as per environment.<br>- Handle errors on DB interactions.<br><br>### Email Template includes approve/reject links with tokens.<br>See sticky note content in workflow. | Workflow documentation included as Sticky Note node in the workflow. See Section 1 and 2.          |
| ## Database Schema example:<br>Includes tables: roles, users, documents, workflow_levels, approvals, audit_logs.<br>Defines relationships, keys, and fields needed for workflow.<br><br>See detailed SQL schema in Sticky Note1 node.<br><br>Ensure your Supabase project tables match these structures or adjust queries accordingly.                                                                                                                                                                                                                                     | Database schema definitions provided in Sticky Note1 node inside the workflow.                     |
| Update URLs in HTTP Request nodes for Supabase Storage upload/download to match your Supabase project ID and bucket name.<br><br>Example URL: `https://<your_project_id>.supabase.co/storage/v1/object/test-n8n/{{ fileName }}`                                                                                                                                                                                                                                                                                                         | Sticky Note2 reminder for correct Supabase storage URL configuration.                              |
| The approval URLs in emails use localhost and test environment paths:<br>`http://localhost:5678/webhook-test/doc-approval?token=...&decision=...`<br><br>Update these URLs for production deployment to your actual n8n instance and remove `/webhook-test` if appropriate.                                                                                                                                                                                                                                                             | Email template links in Gmail nodes require environment-specific adjustment.                        |
| Audit logs capture detailed information about document approvals, rejections, and approval requests sent at each level.<br><br>This supports compliance and traceability requirements.                                                                                                                                                                                                                                                                                                                                                | Audit logging is performed in multiple Supabase nodes named Audit, Audit1, and audit_invites.       |

---

This documentation provides a full structured reference for understanding, reproducing, and extending the Multi-Level Document Approval & Audit Workflow implemented in n8n using Supabase and Gmail.