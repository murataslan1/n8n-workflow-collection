Automate AWS IAM User Management Through Email Commands

https://n8nworkflows.xyz/workflows/automate-aws-iam-user-management-through-email-commands-7241


# Automate AWS IAM User Management Through Email Commands

---

### 1. Workflow Overview

This workflow automates AWS IAM user management triggered via email commands. It interprets incoming emails with specific instructions about IAM user operations, executes the corresponding AWS IAM API calls, and replies to the sender with success or failure notifications.

The workflow is logically structured into the following blocks:

- **1.1 Input Reception:** Receives and reads incoming emails matching the subject criteria.
- **1.2 Email Data Extraction:** Parses the email content to identify the IAM task type and relevant parameters (usernames, group names).
- **1.3 Task Routing and Execution:** Routes the request to the appropriate AWS IAM operation node based on the parsed task type.
- **1.4 Result Messaging:** Generates a human-readable success or failure message for the executed task.
- **1.5 Email Response:** Sends the generated message back to the requester via email.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Captures incoming emails from a configured IMAP mailbox filtered by unread status and subject containing "iam". This initiates the workflow.
- **Nodes Involved:**  
  - **GET Email Request** (emailReadImap)

- **Node Details:**

  - **GET Email Request**  
    - Type: Email Read (IMAP)  
    - Role: Watches for new emails matching specific criteria.  
    - Configuration:  
      - Filters: Unseen emails with subject containing "iam"  
      - Credentials: IMAP email account (configured with OAuth2 or username/password).  
    - Inputs: None (trigger node).  
    - Outputs: Email message JSON including sender, subject, and plaintext body.  
    - Error cases: Connection/authentication failures; malformed emails; no matching emails.  
    - Notes: Ensures only relevant emails trigger IAM operations.

#### 2.2 Email Data Extraction

- **Overview:** Parses the email body text to extract the intended IAM command type and parameters such as usernames and group names.
- **Nodes Involved:**  
  - **Extract Data from Email** (Code node)

- **Node Details:**

  - **Extract Data from Email**  
    - Type: Code (JavaScript)  
    - Role: Extracts structured data from free-text email content.  
    - Configuration:  
      - Parses `textPlain` field from email JSON.  
      - Uses regex patterns to find `userName` and `groupName`.  
      - Detects the task type by searching for key phrases (e.g., "create user", "delete user").  
    - Inputs: Output from GET Email Request.  
    - Outputs: JSON object with `userName`, `groupName`, and `task_type`.  
    - Edge cases: Missing or malformed data; ambiguous or unsupported commands; case sensitivity handled.  
    - Failure modes: No match returns null fields, which downstream nodes must handle.

#### 2.3 Task Routing and Execution

- **Overview:** Routes the extracted task type to the corresponding AWS IAM operation node to perform the requested user management action.
- **Nodes Involved:**  
  - **Check Type Of Task** (Switch node)  
  - AWS IAM operation nodes:  
    - Create user  
    - Delete user  
    - Add user to group  
    - Remove user from group  
    - Get user  
    - Get many users  
    - Update user

- **Node Details:**

  - **Check Type Of Task**  
    - Type: Switch  
    - Role: Routes workflow execution based on `task_type` field.  
    - Configuration:  
      - Seven cases matching task types like `create_user`, `delete_user`, `add_user_to_group`, etc.  
      - Uses expression `{{ json.task_type }}` for comparison.  
    - Inputs: Output of Extract Data from Email.  
    - Outputs: One output branch per task type leading to corresponding AWS IAM node.  
    - Edge cases: Unrecognized task types cause no branch to trigger (could be extended with default branch).  

  - **Create user**  
    - Type: AWS IAM  
    - Role: Creates new IAM user.  
    - Configuration:  
      - Operation: `create`  
      - UserName: from `{{ $json.username }}` extracted from email.  
      - Credentials: AWS IAM credentials configured with appropriate permissions.  
    - Inputs: Switch node output.  
    - Outputs: AWS response JSON.  
    - Errors: AWS permission issues, user already exists, invalid username formats.

  - **Delete user**  
    - Type: AWS IAM  
    - Role: Deletes existing IAM user.  
    - Configuration:  
      - Operation: `delete`  
      - User: username from input JSON.  
      - Credentials: AWS IAM credentials.  
    - Errors: User not found, permission denied.

  - **Add user to group**  
    - Type: AWS IAM  
    - Role: Adds a user to an IAM group.  
    - Configuration:  
      - Operation: `addToGroup`  
      - User and Group: extracted usernames and group names.  
      - Credentials: AWS IAM credentials.  
    - Errors: Nonexistent user/group, permission denied.

  - **Remove user from group**  
    - Type: AWS IAM  
    - Role: Removes a user from an IAM group.  
    - Configuration:  
      - Operation: `removeFromGroup`  
      - Parameters similar to add user to group.  
    - Errors: User not in group, permission denied.

  - **Get user**  
    - Type: AWS IAM  
    - Role: Retrieves details about a specific IAM user.  
    - Configuration:  
      - Operation: `get`  
      - User: username from input.  
    - Errors: User not found, permission denied.

  - **Get many users**  
    - Type: AWS IAM  
    - Role: Lists multiple IAM users.  
    - Configuration:  
      - Operation: default list operation (no username needed).  
    - Errors: Permission denied.

  - **Update user**  
    - Type: AWS IAM  
    - Role: Updates IAM user details, e.g., username.  
    - Configuration:  
      - Operation: `update`  
      - User: current username.  
      - NewUserName: from `{{ $json.newusername }}` (may be empty if not provided).  
    - Errors: User not found, invalid new username, permission denied.

#### 2.4 Result Messaging

- **Overview:** Formats a clear, human-readable status message summarizing the success or failure of the AWS IAM operation.
- **Nodes Involved:**  
  - **Make massage For Email** (Code node)

- **Node Details:**

  - **Make massage For Email**  
    - Type: Code (JavaScript)  
    - Role: Creates email subject and body based on task results.  
    - Configuration:  
      - Reads fields: `task_type`, `userName`, `groupName`, `status`, `error` from input JSON.  
      - Maps task types to readable names.  
      - Constructs success or failure messages with checkmarks or crosses.  
      - Includes error messages if failure occurred.  
    - Inputs: Output of each AWS IAM operation node (transformed to include status info).  
    - Outputs: JSON with `subject` and `body` for email.  
    - Edge cases: Missing status or error messages handled gracefully.

#### 2.5 Email Response

- **Overview:** Sends a confirmation email back to the original sender with the result of the requested IAM operation.
- **Nodes Involved:**  
  - **Send Email Response** (Email Send node)

- **Node Details:**

  - **Send Email Response**  
    - Type: Email Send  
    - Role: Sends the formatted response email.  
    - Configuration:  
      - To: original sender email extracted from the initial email (`$('GET Email Request').item.json.from`).  
      - From: statically configured sender email (e.g., abc@gmail.com).  
      - Subject and Text: from `Make massage For Email` output.  
      - Reply-To: set to original sender.  
      - Credentials: SMTP credentials configured.  
    - Inputs: Message content from previous node.  
    - Errors: SMTP connection failures, invalid email addresses.

---

### 3. Summary Table

| Node Name             | Node Type           | Functional Role                          | Input Node(s)           | Output Node(s)         | Sticky Note                                                                                          |
|-----------------------|---------------------|----------------------------------------|-------------------------|------------------------|----------------------------------------------------------------------------------------------------|
| GET Email Request      | emailReadImap       | Receive incoming email requests         | None                    | Extract Data from Email | Captures incoming email requests.                                                                  |
| Extract Data from Email| Code                | Parse email body to extract commands    | GET Email Request       | Check Type Of Task      | Parses email content to extract user management commands.                                          |
| Check Type Of Task     | Switch              | Route to correct IAM operation           | Extract Data from Email | Create user, Delete user, Add user to group, Get user, Get many users, Remove user from group, Update user | Validates the type of task (e.g., create, delete, update).                                          |
| Create user           | AWS IAM             | Create IAM user                         | Check Type Of Task      | Make massage For Email  | Creates a new IAM user.                                                                             |
| Delete user           | AWS IAM             | Delete IAM user                        | Check Type Of Task      | Make massage For Email  | Deletes an existing IAM user.                                                                       |
| Add user to group     | AWS IAM             | Add user to IAM group                   | Check Type Of Task      | Make massage For Email  | Assigns a user to a group.                                                                          |
| Remove user from group| AWS IAM             | Remove user from IAM group              | Check Type Of Task      | Make massage For Email  | Removes a user from a group.                                                                        |
| Get user              | AWS IAM             | Retrieve IAM user details                | Check Type Of Task      | Make massage For Email  | Retrieves user details from AWS IAM.                                                               |
| Get many users        | AWS IAM             | Retrieve multiple IAM users              | Check Type Of Task      | Make massage For Email  | Fetches multiple user details if required.                                                         |
| Update user           | AWS IAM             | Update IAM user details                  | Check Type Of Task      | Make massage For Email  | Updates user details.                                                                               |
| Make massage For Email| Code                | Generate email response content          | Create/Delete/Add/Remove/Get nodes | Send Email Response | Prepares a confirmation email.                                                                     |
| Send Email Response   | emailSend           | Send confirmation email back to requester| Make massage For Email  | None                   | Sends the confirmation email.                                                                       |
| Sticky Note           | Sticky Note         | Workflow summary and block explanation  | None                    | None                   | See block descriptions in documentation section 2.                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Trigger Node**  
   - Add an **Email Read (IMAP)** node named `GET Email Request`.  
   - Configure credentials for your IMAP account.  
   - Set options to filter unseen emails with the subject containing `"iam"` (custom email config: `["UNSEEN", ["SUBJECT", "iam"]]`).

2. **Add Code Node to Extract Data**  
   - Add a **Code** node named `Extract Data from Email`.  
   - Connect `GET Email Request` → `Extract Data from Email`.  
   - Paste the JavaScript code that extracts:  
     - `userName` using regex for "user:" or "username" patterns.  
     - `groupName` using regex for "group:" or "groupname".  
     - `task_type` by detecting keywords like "create user", "delete user", etc.

3. **Add Switch Node to Route Task**  
   - Add a **Switch** node named `Check Type Of Task`.  
   - Connect `Extract Data from Email` → `Check Type Of Task`.  
   - Configure rules to check `{{json.task_type}}` against values:  
     - `create_user`, `delete_user`, `add_user_to_group`, `remove_user_from_group`, `get_user`, `get_many_users`, `update_user`.  
   - Create one output per task type.

4. **Add AWS IAM Nodes for Each Operation**  
   - For each task type, add one **AWS IAM** node configured with:  
     - Credentials for AWS account with proper IAM permissions.  
     - Operation set according to task:  
       - `create` for Create user (parameter: `userName = {{$json.username}}`)  
       - `delete` for Delete user (`user = {{$json.username}}`)  
       - `addToGroup` for Add user to group (`user`, `group` from JSON)  
       - `removeFromGroup` for Remove user from group (`user`, `group`)  
       - `get` for Get user (`user`)  
       - List operation for Get many users (no user parameter)  
       - `update` for Update user (`user`, `userName` for new username if provided).  
   - Connect each output from the switch to the corresponding AWS IAM node.

5. **Add Code Node to Generate Response Message**  
   - Add a **Code** node named `Make massage For Email`.  
   - Connect all AWS IAM nodes outputs to this Code node.  
   - Paste JavaScript code that reads `task_type`, `userName`, `groupName`, `status`, and `error` fields and generates a user-friendly email subject and body reporting success or failure.

6. **Add Email Send Node to Reply**  
   - Add an **Email Send** node named `Send Email Response`.  
   - Connect `Make massage For Email` → `Send Email Response`.  
   - Configure SMTP credentials for sending email.  
   - Set "To" email to the original sender extracted from `GET Email Request` node (`{{$node["GET Email Request"].json.from}}`).  
   - Set "From" email and "Reply-To" accordingly.  
   - Use the subject and body generated by the previous node.

7. **(Optional) Add Sticky Note**  
   - Add a sticky note summarizing workflow logic for documentation.

---

### 5. General Notes & Resources

| Note Content                                                                                                  | Context or Link                                                  |
|--------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------|
| The workflow uses regex patterns to extract usernames and group names — ensure emails follow expected formats.| Email parsing depends on clear, consistent command syntax.      |
| AWS IAM credentials must have permissions for all operations used (create, delete, update users and groups). | AWS IAM policy configuration is critical for smooth operation.  |
| SMTP and IMAP credentials require valid email accounts with necessary access and permissions.                 | Email server setup must allow programmatic reading and sending. |
| Reply emails are sent to the original sender, ensuring feedback loops.                                        | Useful for audit and confirmation of requested actions.         |
| This workflow assumes English-language commands in the email body.                                           | Localization would require code adjustments.                     |
| Sticky note in the workflow provides a quick summary of node roles and logic flow.                            | See workflow Sticky Note content in section 3.                   |

---

**Disclaimer:** The content was extracted from a fully automated n8n workflow. It complies with all applicable content policies and does not include any offensive, illegal, or protected information. All data processed is public and legal.

---