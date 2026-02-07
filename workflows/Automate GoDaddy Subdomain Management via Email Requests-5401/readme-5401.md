Automate GoDaddy Subdomain Management via Email Requests

https://n8nworkflows.xyz/workflows/automate-godaddy-subdomain-management-via-email-requests-5401


# Automate GoDaddy Subdomain Management via Email Requests

### 1. Workflow Overview

This workflow automates the management of GoDaddy subdomains by processing email requests. It listens to incoming emails with commands to create or delete subdomains and then interacts with the GoDaddy API to perform the requested actions. The workflow is targeted at developers or technical teams who want to delegate routine DNS subdomain management tasks without involving DevOps teams, streamlining domain management via simple email commands.

The workflow logic is organized into these blocks:

- **1.1 Input Reception:** Polls an IMAP email inbox for new, unread emails containing the keyword "subdomain" in the subject.
- **1.2 Data Extraction and Task Parsing:** Extracts domain, subdomain, IP address, and requested action (create/delete) from the email body using custom code.
- **1.3 Action Decision and API Request:** Routes the workflow based on the requested action to either create or delete the subdomain by calling the GoDaddy API.
- **1.4 Response Notification:** Sends an email back to the requester confirming the success of the requested action.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block listens for new emails in an IMAP inbox, filtering for unseen messages with "subdomain" in the subject line to trigger the workflow.

- **Nodes Involved:**  
  - Start Workflow (GET Request)

- **Node Details:**

  - **Start Workflow (GET Request)**  
    - *Type:* Email Read (IMAP)  
    - *Role:* Polls an IMAP inbox for new emails matching specific criteria.  
    - *Configuration:*  
      - Custom email filter: `[ "UNSEEN", ["SUBJECT", "subdomain"] ]` to fetch only unread emails with "subdomain" in the subject.  
      - Credentials: IMAP account with necessary access permissions.  
    - *Input/Output:* No input; outputs email data JSON objects.  
    - *Edge Cases / Failures:*  
      - Network or authentication errors connecting to IMAP server.  
      - No new emails leading to no workflow trigger.  
      - Emails without expected format or missing body content.  
    - *Version Requirements:* n8n version supporting IMAP node v2.

#### 1.2 Data Extraction and Task Parsing

- **Overview:**  
  Parses the email body to extract the domain, subdomain, IP address, and determine the requested action type (create or delete subdomain).

- **Nodes Involved:**  
  - Extract Data from Email

- **Node Details:**

  - **Extract Data from Email**  
    - *Type:* Code (JavaScript)  
    - *Role:* Uses regex patterns to parse key fields from the email plain text.  
    - *Configuration:*  
      - Extracts domain from lines containing "domain:" or "on domain".  
      - Extracts subdomain from lines containing "subdomain:" or "create subdomain".  
      - Extracts IP address from patterns like "IP Address:" or "with IP".  
      - Determines task type by searching for "delete" or "create" keywords, defaulting to "create".  
    - *Key Expressions:* Uses regex match groups for extraction. Returns an object with `domain`, `subdomain`, `ip`, and `task_type`.  
    - *Input/Output:* Input is email JSON from IMAP node; output is parsed JSON for downstream use.  
    - *Edge Cases / Failures:*  
      - Missing or malformed fields in email body causing null values.  
      - Case sensitivity or unexpected phrasing not matching regex patterns.  
      - Task type not clearly specified, defaulting to create may cause unintended actions.  
    - *Version Requirements:* Compatible with n8n Code node v2.

#### 1.3 Action Decision and API Request

- **Overview:**  
  Routes based on the parsed task type to either create or delete a subdomain via GoDaddy API using HTTP requests.

- **Nodes Involved:**  
  - Validate Action Type  
  - Create Subdomain  
  - Delete Subdomain

- **Node Details:**

  - **Validate Action Type**  
    - *Type:* If node  
    - *Role:* Checks if `task_type` equals "create" to decide the subsequent branch.  
    - *Configuration:*  
      - Condition: `$json.task_type === 'create'` (strict equality, case sensitive).  
    - *Input:* Parsed JSON from code node.  
    - *Output:* Two outputs:  
      - Output 1: If true (create) → routes to Create Subdomain node.  
      - Output 2: If false (delete) → routes to Delete Subdomain node.  
    - *Edge Cases:*  
      - `task_type` value outside expected values (e.g., misspellings) will trigger the delete path by default, which may be unintended.  
      - Case sensitivity may cause mismatches.  
    - *Version Requirements:* n8n If node v2.2 or higher.

  - **Create Subdomain**  
    - *Type:* HTTP Request  
    - *Role:* Sends a POST request to GoDaddy API to create a subdomain DNS record.  
    - *Configuration:*  
      - Method: POST  
      - URL: GoDaddy API endpoint (placeholder "api_url").  
      - Body: JSON containing domain, subdomain, and IP extracted from email.  
      - Headers: Content-Type set to application/json.  
      - Authentication: HTTP Basic Auth using stored credentials.  
    - *Input:* JSON with domain, subdomain, ip from previous node.  
    - *Output:* API response JSON passed to the next node.  
    - *Edge Cases / Failures:*  
      - Authentication failure with GoDaddy API.  
      - API rate limits or downtime.  
      - Invalid domain or subdomain causing API errors.  
      - IP address missing or malformed.  
    - *Version Requirements:* HTTP Request node v4.2.

  - **Delete Subdomain**  
    - *Type:* HTTP Request  
    - *Role:* Sends DELETE request to GoDaddy API to remove a subdomain DNS record.  
    - *Configuration:*  
      - Method: DELETE  
      - URL: GoDaddy API endpoint (placeholder "api_url").  
      - Body: JSON with domain, subdomain, and IP.  
      - Headers: Content-Type application/json.  
      - Authentication: HTTP Basic Auth with stored credentials.  
    - *Input:* JSON with domain, subdomain, ip.  
    - *Output:* API response JSON for confirmation.  
    - *Edge Cases / Failures:*  
      - Same as Create Subdomain, plus handling case where subdomain does not exist.  
    - *Version Requirements:* HTTP Request node v4.2.

#### 1.4 Response Notification

- **Overview:**  
  Sends an email response to the requestor confirming whether the subdomain was created or deleted successfully, including a link to verify DNS changes.

- **Nodes Involved:**  
  - Send Email Response

- **Node Details:**

  - **Send Email Response**  
    - *Type:* Email Send (SMTP)  
    - *Role:* Sends a confirmation email to the original request sender.  
    - *Configuration:*  
      - Recipient: Email address extracted from the original email's `from` field.  
      - Subject: Dynamic based on action type (e.g., "Subdomain Created Successfully" or "Subdomain Deleted Successfully").  
      - Body: Text message with confirmation and a link to https://www.nslookup.io/ to verify DNS.  
      - Reply-To: Set to original sender email.  
      - From: Fixed sender email (xyz@gmail.com).  
      - Credentials: SMTP account configured with authentication.  
    - *Input:* JSON containing the API action result and original sender email.  
    - *Output:* None (terminal node).  
    - *Edge Cases / Failures:*  
      - SMTP authentication failure or network issues.  
      - Missing or malformed sender email address.  
    - *Version Requirements:* Email Send node v2.1.

---

### 3. Summary Table

| Node Name               | Node Type             | Functional Role                        | Input Node(s)                 | Output Node(s)           | Sticky Note                                                                                                    |
|-------------------------|-----------------------|-------------------------------------|------------------------------|--------------------------|---------------------------------------------------------------------------------------------------------------|
| Start Workflow (GET Request) | Email Read (IMAP)      | Polls IMAP inbox for triggering emails | None                         | Extract Data from Email   |                                                                                                               |
| Extract Data from Email  | Code (JavaScript)      | Parses email body for domain, subdomain, IP, task_type | Start Workflow (GET Request) | Validate Action Type      |                                                                                                               |
| Validate Action Type     | If Node               | Routes based on task_type (create/delete) | Extract Data from Email       | Create Subdomain, Delete Subdomain |                                                                                                               |
| Create Subdomain         | HTTP Request           | Calls GoDaddy API to create subdomain | Validate Action Type          | Send Email Response       |                                                                                                               |
| Delete Subdomain         | HTTP Request           | Calls GoDaddy API to delete subdomain | Validate Action Type          | Send Email Response       |                                                                                                               |
| Send Email Response      | Email Send (SMTP)      | Sends confirmation email to requester | Create Subdomain, Delete Subdomain | None                     |                                                                                                               |
| Sticky Note             | Sticky Note            | Provides workflow overview explanation | None                         | None                     | This n8n workflow automates subdomain creation and deletion on GoDaddy using their API, triggered via email requests. This empowers developers to manage subdomains directly without involving DevOps for minor tasks. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create IMAP Email Read Node:**  
   - Type: Email Read (IMAP)  
   - Name: Start Workflow (GET Request)  
   - Configure credentials with your IMAP email account.  
   - Set options to fetch unread emails with subject containing "subdomain":  
     `["UNSEEN", ["SUBJECT", "subdomain"]]`  
   - Position it as the workflow trigger node.

2. **Add Code Node to Extract Data:**  
   - Type: Code (JavaScript)  
   - Name: Extract Data from Email  
   - Connect input from the IMAP node.  
   - Paste the provided JS code to parse domain, subdomain, IP, and task_type from email body.  
   - Ensure output returns JSON object with these fields.

3. **Add If Node to Validate Action:**  
   - Type: If  
   - Name: Validate Action Type  
   - Connect input from the Code node.  
   - Set condition: `task_type` equals "create" (strict equality, case sensitive).  
   - Configure two outputs: Output 1 for create, Output 2 for delete.

4. **Create HTTP Request Node for Creating Subdomain:**  
   - Type: HTTP Request  
   - Name: Create Subdomain  
   - Connect input from If node's 'true' output.  
   - Set method: POST  
   - URL: Enter GoDaddy API endpoint for creating a DNS record (replace placeholder "api_url").  
   - Authentication: HTTP Basic Auth, configured with GoDaddy API credentials.  
   - Headers: Content-Type = application/json.  
   - Body (JSON):  
     ```json
     {
       "domain": "{{ $json.domain }}",
       "subdomain": "{{ $json.subdomain }}",
       "ip": "{{ $json.ip }}"
     }
     ```
   - Enable sending body and headers.

5. **Create HTTP Request Node for Deleting Subdomain:**  
   - Type: HTTP Request  
   - Name: Delete Subdomain  
   - Connect input from If node's 'false' output.  
   - Set method: DELETE  
   - URL: GoDaddy API endpoint for deleting DNS record (replace "api_url").  
   - Authentication: HTTP Basic Auth using same credentials as above.  
   - Headers: Content-Type = application/json.  
   - Body (JSON) same as create node.

6. **Create Email Send Node for Response:**  
   - Type: Email Send (SMTP)  
   - Name: Send Email Response  
   - Connect input from both Create and Delete HTTP Request nodes.  
   - Configure SMTP credentials.  
   - Set recipient email to the original sender of the email (`{{$node["Start Workflow (GET Request)"].json.from}}`).  
   - Subject: Conditional based on task_type, e.g.:  
     - If create: "Subdomain Created Successfully"  
     - If delete: "Subdomain Deleted Successfully"  
   - Text body: Include confirmation message and link to https://www.nslookup.io/ for DNS verification.  
   - From email: Your configured sender address (e.g., xyz@gmail.com).  
   - Reply-To: Set to the original sender email.

7. **Add Sticky Note:**  
   - Content: "This n8n workflow automates subdomain creation and deletion on GoDaddy using their API, triggered via email requests. This empowers developers to manage subdomains directly without involving DevOps for minor tasks."  
   - Place it prominently near the start node for overview context.

8. **Final Checks:**  
   - Verify all connections match described flow: IMAP → Code → If → HTTP Request (Create/Delete) → Email Send.  
   - Ensure credentials for IMAP, GoDaddy API (HTTP Basic Auth), and SMTP are properly configured and tested.  
   - Replace all placeholder URLs and emails with actual production values.  
   - Test with sample emails containing domain, subdomain, IP, and task instructions.

---

### 5. General Notes & Resources

| Note Content                                                                                                      | Context or Link                         |
|------------------------------------------------------------------------------------------------------------------|---------------------------------------|
| This workflow allows DNS subdomain management via email commands, reducing DevOps dependency for minor changes. | Workflow purpose overview              |
| Verification of DNS changes can be done at https://www.nslookup.io/                                              | Included in confirmation email body   |

---

**Disclaimer:** The provided content is derived exclusively from an automated workflow created with n8n, complying fully with content policies. No illegal, offensive, or protected elements are present. All data processed is legal and public.