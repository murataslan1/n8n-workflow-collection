Auto-Sort Support Emails with OpenAI and Route to Teams with Jira Integration

https://n8nworkflows.xyz/workflows/auto-sort-support-emails-with-openai-and-route-to-teams-with-jira-integration-6639


# Auto-Sort Support Emails with OpenAI and Route to Teams with Jira Integration

### 1. Workflow Overview

This workflow automates the processing and routing of incoming support emails using AI classification and integrates with Jira for task management. It targets customer support teams that receive varied email requests—billing, bugs, or feature suggestions—and need to forward them to the appropriate teams while creating Jira tasks for tracking. The workflow also sends an autoresponse to confirm receipt.

**Logical Blocks:**

- **1.1 Input Reception:** Reads incoming emails from an IMAP mailbox.
- **1.2 AI Processing:** Sends email content to OpenAI to classify the email into categories.
- **1.3 Routing Decision:** Uses a Switch node to route emails based on classification.
- **1.4 Email Forwarding:** Sends the email to the corresponding team inbox (billing, bugs, or features).
- **1.5 Jira Integration:** Creates a Jira task corresponding to the email.
- **1.6 Autoresponse:** Sends a confirmation email back to the original sender.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  Captures incoming support emails from a designated IMAP mailbox to trigger the workflow.

- **Nodes Involved:**  
  - IMAP Email

- **Node Details:**  
  - **IMAP Email**  
    - Type: Email Read (IMAP) node  
    - Configuration: Uses IMAP credentials to monitor a mailbox (no special options set)  
    - Key Variables: Outputs standard email fields including `subject`, `from`, and `text` (email body)  
    - Input: None (trigger node)  
    - Output: Passes email data to "OpenAI" node  
    - Potential Failures: Authentication errors with IMAP server, connection timeouts, no new emails detected  
    - Version: Compatible with n8n v1+  

#### 1.2 AI Processing

- **Overview:**  
  Sends the raw email content to OpenAI’s Chat Completion API to classify the email by topic (billing, bug, or feature).

- **Nodes Involved:**  
  - OpenAI

- **Node Details:**  
  - **OpenAI**  
    - Type: OpenAI Chat node  
    - Configuration: Chat operation using an OpenAI API key credential; default request options (no advanced parameters)  
    - Key Expressions: Receives the entire email JSON, likely sends the email text as prompt (explicit prompt not shown)  
    - Input: Receives email data from "IMAP Email"  
    - Output: Classification result sent to "Switch"  
    - Potential Failures: API rate limits, invalid API key, network issues, prompt formatting errors  
    - Version: n8n v1+  
    - Credentials: Requires valid OpenAI API key  

#### 1.3 Routing Decision

- **Overview:**  
  Routes the email to the appropriate forwarding email node based on the classification result from OpenAI.

- **Nodes Involved:**  
  - Switch

- **Node Details:**  
  - **Switch**  
    - Type: Switch node  
    - Configuration: Branches based on classification output from OpenAI node (implied logic, specific conditions not shown)  
    - Input: Receives classification text from "OpenAI"  
    - Output: 3 branches to: "Send Billing Email", "Send Bug Email", and "Send Feature Email"  
    - Potential Failures: Missing or unexpected classification values, expression evaluation errors  
    - Version: Standard n8n v1+  

#### 1.4 Email Forwarding

- **Overview:**  
  Forwards the original support email to the respective team inbox depending on classification.

- **Nodes Involved:**  
  - Send Billing Email  
  - Send Bug Email  
  - Send Feature Email

- **Node Details:**  
  - **Send Billing Email**  
    - Type: Email Send (SMTP)  
    - Configuration: Forwards email content with subject and from extracted from "IMAP Email", sent to billing@yourdomain.com from support@yourdomain.com  
    - Inputs: From "Switch" (billing branch), references "IMAP Email" fields for email content  
    - Potential Failures: SMTP authentication errors, invalid recipient address, connection timeouts  
    - Credentials: SMTP credentials required  
  - **Send Bug Email**  
    - Same structure as above, recipient: bugs@yourdomain.com  
  - **Send Feature Email**  
    - Same structure as above, recipient: features@yourdomain.com  

#### 1.5 Jira Integration

- **Overview:**  
  Creates a new Jira task for each email forwarded to track support requests within the Jira project management system.

- **Nodes Involved:**  
  - Create Jira Task

- **Node Details:**  
  - **Create Jira Task**  
    - Type: Jira node  
    - Configuration: Creates a Task issue type in Jira project with ID 12346; summary includes email subject prefixed with "Support Request:"  
    - Input: From any of the "Send * Email" nodes after forwarding  
    - Output: Passes to "Send Autoresponse"  
    - Potential Failures: Jira API authentication errors, invalid project ID, network issues, permission errors  
    - Credentials: Jira Software Cloud API token required  

#### 1.6 Autoresponse

- **Overview:**  
  Sends a confirmation email back to the original sender stating the email category and acknowledging receipt.

- **Nodes Involved:**  
  - Send Autoresponse

- **Node Details:**  
  - **Send Autoresponse**  
    - Type: Email Send (SMTP)  
    - Configuration: Sends a thank you email to the original sender's address extracted from "IMAP Email" node; references classification from "OpenAI" node in the email body  
    - Input: From "Create Jira Task"  
    - Potential Failures: SMTP errors, missing sender email, network issues  
    - Credentials: SMTP credentials required  

---

### 3. Summary Table

| Node Name          | Node Type                | Functional Role                    | Input Node(s)          | Output Node(s)                             | Sticky Note                                                                                      |
|--------------------|--------------------------|----------------------------------|-----------------------|--------------------------------------------|-------------------------------------------------------------------------------------------------|
| IMAP Email         | Email Read (IMAP)         | Input Reception - fetch emails   | None                  | OpenAI                                    | ## Main Components<br>- **IMAP Email** - Monitors incoming support emails via IMAP                |
| OpenAI             | OpenAI Chat               | AI Processing - classify emails  | IMAP Email            | Switch                                    | - **OpenAI** - Classifies emails into categories (billing, bug, feature)                        |
| Switch             | Switch                    | Routing decision based on AI     | OpenAI                | Send Billing Email, Send Bug Email, Send Feature Email | - **Switch** - Routes emails based on the classified category                                   |
| Send Billing Email | Email Send (SMTP)          | Forward billing emails           | Switch (billing branch)| Create Jira Task                          | - **Send Billing Email** - Forwards billing-related emails to the billing inbox                  |
| Send Bug Email     | Email Send (SMTP)          | Forward bug emails               | Switch (bug branch)    | Create Jira Task                          | - **Send Bug Email** - Forwards bug-related emails to the bugs inbox                            |
| Send Feature Email | Email Send (SMTP)          | Forward feature request emails   | Switch (feature branch)| Create Jira Task                          | - **Send Feature Email** - Forwards feature-related emails to the features inbox                |
| Create Jira Task   | Jira                      | Create Jira task for tracking    | Send Billing Email, Send Bug Email, Send Feature Email | Send Autoresponse                      | - **Create Jira Task** - Creates a task in Jira for each classified email                       |
| Send Autoresponse  | Email Send (SMTP)          | Confirmation email to sender     | Create Jira Task       | None                                      | - **Send Autoresponse** - Sends a confirmation email to the sender                              |
| Sticky Note        | Sticky Note               | Documentation                   | None                  | None                                      | See all above components                                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create IMAP Email node:**  
   - Type: Email Read (IMAP)  
   - Configure IMAP credentials (host, port, username, password)  
   - Set to monitor your support mailbox with default options  
   - This is the trigger node for new emails

2. **Create OpenAI node:**  
   - Type: OpenAI Chat  
   - Configure OpenAI API credentials (API key)  
   - Set operation to "Chat"  
   - Input: Connect output of IMAP Email node  
   - Configure prompt to classify the email content (e.g., send `{{$node["IMAP Email"].json["text"]}}` as prompt) asking for category (billing, bug, feature)  

3. **Create Switch node:**  
   - Type: Switch  
   - Input: Connect OpenAI node output  
   - Add three rules to check classification result (e.g., equals "billing", "bug", "feature") based on OpenAI response text or parsed JSON  
   - Create three outputs accordingly  

4. **Create Send Billing Email node:**  
   - Type: Email Send (SMTP)  
   - Configure SMTP credentials (host, port, username, password)  
   - Set "To Email" to billing@yourdomain.com  
   - Set "From Email" to support@yourdomain.com  
   - Email Subject: `Fwd: {{$node["IMAP Email"].json["subject"]}}`  
   - Email Body: Include subject, from, and content fields from IMAP Email node  
   - Connect to Switch node’s billing output  

5. **Create Send Bug Email node:**  
   - Same as Send Billing Email but:  
   - "To Email": bugs@yourdomain.com  
   - Connect to Switch node’s bug output  

6. **Create Send Feature Email node:**  
   - Same as above but:  
   - "To Email": features@yourdomain.com  
   - Connect to Switch node’s feature output  

7. **Create Create Jira Task node:**  
   - Type: Jira  
   - Configure Jira Software Cloud API credentials (API token)  
   - Set Project ID to your Jira project (e.g., 12346)  
   - Issue Type: Task  
   - Summary: `Support Request: {{$node["IMAP Email"].json["subject"]}}`  
   - Connect outputs of all three Send Email nodes to this node  

8. **Create Send Autoresponse node:**  
   - Type: Email Send (SMTP)  
   - Use same SMTP credentials as email forwarding nodes  
   - Set "To Email" dynamically: `{{$node["IMAP Email"].json["from"]}}`  
   - Subject: `Re: {{$node["IMAP Email"].json["subject"]}}`  
   - Body: Thank the sender, include classification from OpenAI node (`{{$node["OpenAI"].json["text"]}}`)  
   - Connect output of Create Jira Task node to this node  

9. **Optional: Add Sticky Note node:**  
   - For documentation and clarity within the workflow editor  

10. **Activate the workflow** and test by sending emails to the monitored mailbox.

---

### 5. General Notes & Resources

| Note Content                                                                                                    | Context or Link                                                                                          |
|----------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| The workflow depends on valid credentials for IMAP, SMTP, OpenAI, and Jira connections; ensure these are tested | Credential setup in n8n is required for email servers, OpenAI API, and Jira Cloud API                    |
| Emails are forwarded as plain text with original subject and from fields for context                            | Can be customized to include attachments or richer formatting if required                               |
| OpenAI prompt engineering is critical for accurate classification; adjust prompt and parsing logic accordingly | Adjust the prompt in the OpenAI node to improve classification accuracy                                 |
| Jira integration requires correct project and permission settings                                             | Verify Jira project ID and user permissions before running the workflow                                 |
| The Switch node’s conditions must match exactly the OpenAI response; consider normalization or parsing          | Handle edge cases where the classification is ambiguous or unexpected                                  |
| Autoresponse email reassures customers their request is logged and assigned                                     | Can be enhanced with dynamic links to Jira tickets or support portals                                  |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created with n8n, a workflow automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.