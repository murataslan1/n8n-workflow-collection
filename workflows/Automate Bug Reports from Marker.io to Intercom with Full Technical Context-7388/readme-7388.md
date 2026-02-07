Automate Bug Reports from Marker.io to Intercom with Full Technical Context

https://n8nworkflows.xyz/workflows/automate-bug-reports-from-marker-io-to-intercom-with-full-technical-context-7388


# Automate Bug Reports from Marker.io to Intercom with Full Technical Context

### 1. Workflow Overview

This workflow automates the process of converting bug reports submitted through Marker.io into fully detailed conversations in Intercom, a customer support platform. It targets product, support, and development teams who need to streamline bug triage by automatically transferring rich technical context from Marker.io issues to Intercom conversations.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception**: Captures incoming Marker.io webhook data.
- **1.2 Data Formatting and Extraction**: Processes the webhook payload to extract and format relevant issue and reporter details.
- **1.3 Intercom Contact Management**: Creates or updates the reporting user’s contact profile in Intercom.
- **1.4 Conversation Initiation**: Opens a new conversation in Intercom using the formatted issue data.
- **1.5 Internal Note Addition**: Appends a detailed internal note containing technical metadata to the Intercom conversation.
- **1.6 Documentation and Troubleshooting**: Provides workflow usage instructions and troubleshooting guidance via sticky notes.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block receives bug report data from Marker.io via a POST webhook, serving as the workflow’s entry point.

- **Nodes Involved:**  
  - Webhook

- **Node Details:**

  - **Webhook**  
    - Type: Webhook Trigger (n8n-nodes-base.webhook)  
    - Configuration:  
      - HTTP Method: POST  
      - Path: Unique webhook ID path (e373c60f-8530-4368-a486-fcc41f410b6c)  
      - No additional options specified  
    - Expressions: None  
    - Input: External HTTP POST request from Marker.io webhook  
    - Output: JSON payload containing bug report data  
    - Version Requirements: n8n supporting Webhook node v2 or later  
    - Potential Failures:  
      - Webhook not triggered due to incorrect URL or event misconfiguration in Marker.io  
      - Network connectivity issues  
    - Sub-workflow: None

#### 2.2 Data Formatting and Extraction

- **Overview:**  
  Extracts, structures, and formats key information from the Marker.io webhook payload, preparing it for use in subsequent Intercom API calls.

- **Nodes Involved:**  
  - Format Marker.io Data (Code node)

- **Node Details:**

  - **Format Marker.io Data**  
    - Type: Code (JavaScript)  
    - Configuration:  
      - Parses nested webhook JSON to extract issue title, description, reporter info, priority, type, due date, browser, OS, website, context, and custom fields  
      - Constructs two message bodies:  
        - Customer-facing conversation message (title + description)  
        - Internal note with detailed technical metadata, including links to Marker.io issue and custom data fields  
      - Returns structured JSON with all extracted and formatted fields  
    - Key Expressions:  
      - Accesses `$input.first().json.body.data` for all Marker.io data  
      - Uses template literals for message construction  
      - Converts due date to locale date string if present  
      - Iterates over customData object entries for dynamic inclusion  
    - Input: JSON from Webhook node  
    - Output: Formatted JSON containing reporter email, name, message bodies, issue IDs, URLs, priority, issue type, project ID  
    - Version Requirements: n8n supporting Code node v2 or later, JavaScript runtime  
    - Potential Failures:  
      - Changes in webhook payload structure causing undefined properties  
      - JavaScript runtime errors (e.g., null references) if fields missing  
      - Date parsing errors if dueDate invalid  
    - Sub-workflow: None

#### 2.3 Intercom Contact Management

- **Overview:**  
  Creates a new contact or updates an existing one in Intercom using the reporter’s email and name, ensuring the reporter is represented before opening a conversation.

- **Nodes Involved:**  
  - Create/Update Contact (HTTP Request)

- **Node Details:**

  - **Create/Update Contact**  
    - Type: HTTP Request  
    - Configuration:  
      - Method: POST  
      - URL: `https://api.intercom.io/contacts`  
      - Authentication: Predefined Intercom API credentials  
      - Body: JSON containing role as "user", reporter’s email and name extracted from formatted data  
      - Continue on Fail enabled to prevent workflow halt if contact creation fails  
    - Key Expressions:  
      - Email: `{{$json.reporterEmail}}`  
      - Name: `{{$json.reporterName}}`  
    - Input: Formatted JSON from previous Code node  
    - Output: JSON response from Intercom API with contact details or error  
    - Version Requirements: Supports Intercom API v4.2 or later  
    - Potential Failures:  
      - Authentication errors due to invalid or expired tokens  
      - Email format validation failures  
      - API rate limits or service unavailability  
    - Sub-workflow: None

#### 2.4 Conversation Initiation

- **Overview:**  
  Opens a new conversation in Intercom associated with the reporter’s contact, using the formatted issue title and description as the message body.

- **Nodes Involved:**  
  - Create Conversation (HTTP Request)

- **Node Details:**

  - **Create Conversation**  
    - Type: HTTP Request  
    - Configuration:  
      - Method: POST  
      - URL: `https://api.intercom.io/conversations`  
      - Authentication: Predefined Intercom API credentials  
      - Body: JSON containing:  
        - `from`: user object with reporter email from formatted data  
        - `body`: message body with issue title and description  
        - `message_type`: "inapp" indicating an in-app message  
    - Key Expressions:  
      - From email: `{{$('Format Marker.io Data').item.json.reporterEmail}}`  
      - Body: `{{$('Format Marker.io Data').item.json.messageBody}}`  
    - Input: Success output from Create/Update Contact node  
    - Output: JSON response from Intercom including conversation ID  
    - Version Requirements: Intercom API v4.2 or later  
    - Potential Failures:  
      - Authentication failures  
      - Missing or invalid reporter email causing API rejection  
      - API rate limiting or downtime  
    - Sub-workflow: None

#### 2.5 Internal Note Addition

- **Overview:**  
  Adds an internal note to the newly created Intercom conversation containing comprehensive technical context and links to the Marker.io issue for support agents and developers.

- **Nodes Involved:**  
  - Add Internal Note (HTTP Request)

- **Node Details:**

  - **Add Internal Note**  
    - Type: HTTP Request  
    - Configuration:  
      - Method: POST  
      - URL: Dynamically constructed using conversation ID from previous node, e.g., `https://api.intercom.io/conversations/{{ $json.conversation_id }}/parts`  
      - Headers:  
        - Accept: application/json  
        - Intercom-Version: 2.13  
      - Authentication: Predefined Intercom API credentials  
      - Body: JSON containing:  
        - message_type: "note"  
        - body: detailed internal note from formatted data  
        - admin_id: must be set to a valid Intercom admin user ID (empty in JSON, requires setup)  
    - Key Expressions:  
      - URL conversation ID: `{{$json.conversation_id}}` from Create Conversation node output  
      - Body: `{{$('Format Marker.io Data').item.json.nodeBody}}`  
      - Admin ID: manual configuration required  
    - Input: Output from Create Conversation node  
    - Output: API response confirming note addition  
    - Version Requirements: Intercom API version 2.13 header specified for this call  
    - Potential Failures:  
      - Missing or invalid admin_id causing authorization failure  
      - Authentication errors  
      - Incorrect conversation ID causing 404 errors  
      - API throttling or downtime  
    - Sub-workflow: None

#### 2.6 Documentation and Troubleshooting

- **Overview:**  
  Provides comprehensive workflow documentation, description, benefits, prerequisites, setup instructions, and troubleshooting tips via sticky notes for users maintaining or adapting the workflow.

- **Nodes Involved:**  
  - Sticky Note (large documentation)  
  - Sticky Note1 (troubleshooting guide)

- **Node Details:**

  - **Sticky Note (Documentation)**  
    - Type: Sticky Note  
    - Configuration:  
      - Contains detailed explanation of workflow purpose, benefits, use cases, functional steps, data captured, and setup prerequisites  
      - Includes links to Marker.io webhook event documentation  
    - Input/Output: None (informational)  
    - Position: Offset visually to the left for clarity  
    - Notes: Essential for new users to understand and configure the workflow

  - **Sticky Note1 (Troubleshooting)**  
    - Type: Sticky Note  
    - Configuration:  
      - Provides common troubleshooting tips addressing webhook trigger issues, contact creation failures, missing notes, and data absence  
      - Suggests verification steps for URLs, permissions, admin IDs, and payload structure  
    - Input/Output: None (informational)  
    - Position: Placed below main nodes for visibility

---

### 3. Summary Table

| Node Name              | Node Type               | Functional Role                           | Input Node(s)           | Output Node(s)         | Sticky Note                                                                                                                     |
|------------------------|-------------------------|-----------------------------------------|-------------------------|------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| Webhook                | Webhook Trigger         | Receive Marker.io webhook data           | None                    | Format Marker.io Data   | See troubleshooting for webhook trigger issues                                                                                |
| Format Marker.io Data   | Code                    | Extract and format Marker.io payload     | Webhook                 | Create/Update Contact   | See troubleshooting for data format issues                                                                                     |
| Create/Update Contact   | HTTP Request            | Create or update Intercom contact        | Format Marker.io Data    | Create Conversation     | See troubleshooting for contact creation issues                                                                                |
| Create Conversation     | HTTP Request            | Open Intercom conversation with issue   | Create/Update Contact    | Add Internal Note       |                                                                                                                                |
| Add Internal Note       | HTTP Request            | Append detailed internal note to conversation | Create Conversation  | None                   | See troubleshooting for missing internal note and admin_id configuration                                                      |
| Sticky Note            | Sticky Note             | Workflow documentation and overview      | None                    | None                   | Contains full workflow description, benefits, setup instructions, and links                                                   |
| Sticky Note1           | Sticky Note             | Troubleshooting guidance                  | None                    | None                   | Provides troubleshooting tips for webhook, contact creation, internal notes, and data issues                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**
   - Type: Webhook (Trigger)  
   - Set HTTP Method to POST  
   - Define unique webhook path (e.g., UUID or descriptive name)  
   - Save node and copy webhook URL for Marker.io webhook configuration

2. **Add Code Node: Format Marker.io Data**
   - Type: Code (JavaScript)  
   - Paste the following logic (summary):  
     - Extract `data` from input JSON (`$input.first().json.body.data`)  
     - Extract fields: title, description, reporter email/name, priority, issue type, due date, browser, OS, website, context, Marker.io URLs, customData  
     - Construct `messageBody` string with issue title and description  
     - Construct `noteBody` string with detailed technical info and Marker.io links  
     - Return JSON with all extracted and formatted fields for downstream use  
   - Connect Webhook output to this node

3. **Add HTTP Request Node: Create/Update Contact**
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.intercom.io/contacts`  
   - Authentication: Add or select Intercom API credentials (OAuth2 or Personal Access Token with contact write scope)  
   - Body Parameters (JSON):  
     - role: "user"  
     - email: `{{$json.reporterEmail}}` (expression)  
     - name: `{{$json.reporterName}}` (expression)  
   - Enable “Continue On Fail” to prevent stoppage on errors  
   - Connect output from Code node to this node

4. **Add HTTP Request Node: Create Conversation**
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.intercom.io/conversations`  
   - Authentication: Use same Intercom credentials  
   - Body Parameters (JSON):  
     - from: `{ "type": "user", "email": {{$('Format Marker.io Data').item.json.reporterEmail}} }` (expression)  
     - body: `{{$('Format Marker.io Data').item.json.messageBody}}` (expression)  
     - message_type: "inapp"  
   - Connect output from Create/Update Contact node to this node

5. **Add HTTP Request Node: Add Internal Note**
   - Type: HTTP Request  
   - Method: POST  
   - URL: Use expression to build URL:  
     `https://api.intercom.io/conversations/{{$json.conversation_id}}/parts`  
   - Headers:  
     - Accept: application/json  
     - Intercom-Version: 2.13  
   - Authentication: Same Intercom credentials  
   - Body Parameters (JSON):  
     - message_type: "note"  
     - body: `{{$('Format Marker.io Data').item.json.nodeBody}}` (expression)  
     - admin_id: Set this manually with your Intercom admin user ID (mandatory)  
   - Connect output from Create Conversation node to this node

6. **Add Sticky Note Node: Workflow Documentation**
   - Type: Sticky Note  
   - Paste detailed workflow overview, benefits, setup instructions, and Marker.io webhook link  
   - Position near workflow start for easy reference

7. **Add Sticky Note Node: Troubleshooting**
   - Type: Sticky Note  
   - Include common troubleshooting steps for webhook triggering, contact creation, note addition, and data issues  
   - Position near relevant nodes for contextual help

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                              | Context or Link                                                                                       |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| This workflow creates a seamless bridge between Marker.io and Intercom, automating bug report transfer with rich technical context for faster triage and resolution.                                                                    | Workflow purpose                                                                                    |
| Marker.io webhook events documentation provides detailed payload descriptions and event triggers useful for adapting or debugging this workflow.                                                                                        | https://help.marker.io/en/articles/3738778-webhook-notifications                                    |
| Ensure your Intercom Access Token has write permissions for contacts and conversations, and that the admin_id used for notes corresponds to a valid Intercom admin user.                                                                  | Intercom API setup                                                                                   |
| Troubleshooting tips include verifying Marker.io webhook URLs, event selection, Intercom token validity, correct admin_id, and payload structure consistency.                                                                            | Sticky Note1 content                                                                                 |
| When updating or expanding this workflow, monitor potential API changes from Marker.io or Intercom that might affect JSON structures or authentication methods.                                                                           | Maintenance advice                                                                                   |

---

**Disclaimer:** The provided text is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected material. All manipulated data is legal and public.