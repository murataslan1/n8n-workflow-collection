Auto-Detect Actionable Emails with OpenAI & Get Alert Message on Teams via Flow

https://n8nworkflows.xyz/workflows/auto-detect-actionable-emails-with-openai---get-alert-message-on-teams-via-flow-7167


# Auto-Detect Actionable Emails with OpenAI & Get Alert Message on Teams via Flow

### 1. Workflow Overview

This workflow automates the process of detecting whether incoming emails are actionable using OpenAI's GPT-4 model and, if so, sends an alert message to a Microsoft Teams user via a Power Automate flow. It targets scenarios where users want to prioritize emails requiring immediate attention and receive notifications in Teams with convenient links to the original emails.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception (Email Trigger)**: Listens for new incoming emails via IMAP.
- **1.2 AI Processing (OpenAI Evaluation)**: Sends the email content to OpenAI to classify it as actionable or non-actionable.
- **1.3 Data Extraction**: Extracts relevant email fields from the AI response.
- **1.4 Decision Making**: Checks if the email is actionable.
- **1.5 Alert Preparation and Sending**: Builds a Gmail search URL and posts an alert to Microsoft Teams via a Power Automate webhook.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception (Email Trigger)

- **Overview:**  
  This block triggers the workflow automatically upon receiving a new email in the configured Gmail account via IMAP.

- **Nodes Involved:**  
  - Email Trigger (IMAP)  
  - Sticky Note (Trigger on Email Received)

- **Node Details:**

  - **Email Trigger (IMAP)**  
    - Type: Email Read IMAP trigger node  
    - Configuration: Uses IMAP credentials for a Gmail account. Listens continuously for new emails. No special post-processing action configured.  
    - Key Expressions: None; triggers on new mail.  
    - Inputs: None (trigger node)  
    - Outputs: Emits full email data including from, to, subject, body, date, etc.  
    - Version: 2  
    - Potential Failures: Authentication errors, connection timeouts, mailbox access issues.  
    - Sticky Note Content: "Automatically runs the workflow when a new email is received from the configured Gmail account."

#### 2.2 AI Processing (OpenAI Evaluation)

- **Overview:**  
  This block sends the received email’s key elements to OpenAI GPT-4.1-mini to determine whether the email is actionable based on a detailed 10-point criteria list. The response is expected in a strict JSON format.

- **Nodes Involved:**  
  - OpenAI  
  - Sticky Note1 (Analyze Email Content and Extract Fields)

- **Node Details:**

  - **OpenAI**  
    - Type: OpenAI node (LangChain integration)  
    - Configuration:  
      - Model: gpt-4.1-mini  
      - Messages: System prompt defines the role as a Personal Email Evaluator with explicit criteria for classifying emails.  
      - Input to AI includes email details: from, to, date, subject, body (textPlain).  
      - Output: JSON-formatted assessment containing date, subject, sender, recipientEmail, and actionable status ("Actionable" or "Non-Actionable").  
    - Key Expressions: Uses n8n expressions to inject email fields into the system prompt dynamically (`{{ $json.from }}`, `{{ $json.subject }}`, etc.).  
    - Inputs: Email data from Email Trigger  
    - Outputs: AI evaluation result with JSON payload  
    - Version: 1.8  
    - Potential Failures: API authentication errors, model timeouts, malformed prompts, non-JSON responses.  
    - Sticky Note Content: "Evaluate whether the email content qualifies as actionable based on predefined criteria using OpenAI. Retrieves essential details such as subject, sender, recipient, and actionable status from the OpenAI evaluation result."

#### 2.3 Data Extraction

- **Overview:**  
  Extracts relevant fields (date, subject, from, to, actionable) from the OpenAI JSON response for further processing.

- **Nodes Involved:**  
  - Extract mail details

- **Node Details:**

  - **Extract mail details**  
    - Type: Set node  
    - Configuration: Selects and includes fields from the OpenAI response JSON (`choices[0].message.content.date`, `.subject`, `.from`, `.to`, `.actionable`). Includes other fields by default (email body, metadata).  
    - Inputs: OpenAI node output  
    - Outputs: Simplified JSON with key email details and actionable status  
    - Version: 3.4  
    - Potential Failures: Missing or malformed fields if OpenAI output deviates from expected JSON format.

#### 2.4 Decision Making

- **Overview:**  
  Checks if the email is classified as "Actionable" by OpenAI and routes the workflow accordingly.

- **Nodes Involved:**  
  - Is mail actionable  
  - Sticky Note2 (Check Is Email Actionable?)

- **Node Details:**

  - **Is mail actionable**  
    - Type: If node  
    - Configuration: Condition checks if `{{$json.actionable}}` equals `"Actionable"` (case-sensitive, strict comparison).  
    - Inputs: Extract mail details node  
    - Outputs: True branch proceeds if actionable; false branch does nothing (no connection).  
    - Version: 2.2  
    - Potential Failures: Condition failure if field missing or casing differs.  
    - Sticky Note Content: "Proceeds only if the email is classified as “Actionable” by OpenAI."

#### 2.5 Alert Preparation and Sending

- **Overview:**  
  For actionable emails, builds a Gmail search URL using the encoded subject line and posts the email alert to Microsoft Teams by triggering a Power Automate flow via its webhook.

- **Nodes Involved:**  
  - Build gmail search URL  
  - Send alert to MS team  
  - Sticky Note3 (Send Alert to MS Teams)  
  - Sticky Note4 (Power Automate flow description)

- **Node Details:**

  - **Build gmail search URL**  
    - Type: Code node (JavaScript)  
    - Configuration:  
      - Iterates over all input items.  
      - Extracts the subject, URL-encodes it (spaces replaced with '+'), and constructs a Gmail search URL of format: `https://mail.google.com/mail/u/0/#search/{encodedSubject}`.  
      - Adds this URL as `searchLink` field in JSON.  
    - Inputs: True branch of If node (Is mail actionable)  
    - Outputs: JSON with searchLink added  
    - Version: 2  
    - Potential Failures: Missing subject, encoding errors, malformed URLs.

  - **Send alert to MS team**  
    - Type: HTTP Request node  
    - Configuration:  
      - Method: POST  
      - Body: JSON containing `date`, `subject`, `sender` (with angle brackets replaced by parentheses to avoid parsing issues), `recipientEmail`, and `searchLink`.  
      - Sends to a Power Automate webhook URL (configured in credentials or node parameters, not explicitly shown in JSON).  
    - Inputs: Output of Build gmail search URL node  
    - Outputs: HTTP response from Power Automate flow  
    - Version: 4.2  
    - Potential Failures: HTTP failures, invalid webhook URL, network issues, malformed payload.  
    - Sticky Note Content:  
      - "Builds a direct Gmail search URL using the encoded subject to help locate the email easily"  
      - "Posts the email details to Microsoft Teams by triggering a Power Automate flow via its webhook URL."

  - **Sticky Note4** (Power Automate flow description)  
    - Explains the external Power Automate flow triggered by this workflow:  
      1. Triggered by webhook reception from n8n.  
      2. Parses JSON payload to extract email fields.  
      3. Gets mention token for a Teams user.  
      4. Sends a rich HTML message with email details and a clickable Gmail search link to the user via the Flow bot in Teams.

---

### 3. Summary Table

| Node Name               | Node Type                         | Functional Role                          | Input Node(s)           | Output Node(s)           | Sticky Note                                                                                           |
|-------------------------|----------------------------------|----------------------------------------|-------------------------|--------------------------|-----------------------------------------------------------------------------------------------------|
| Email Trigger (IMAP)     | Email Read IMAP Trigger           | Trigger workflow on new email          | -                       | OpenAI                   | Automatically runs the workflow when a new email is received from the configured Gmail account.     |
| OpenAI                  | OpenAI (LangChain)                | Evaluate email content as actionable   | Email Trigger (IMAP)     | Extract mail details      | Evaluate whether the email content qualifies as actionable based on predefined criteria using OpenAI. Retrieves essential details such as subject, sender, recipient, and actionable status from the OpenAI evaluation result. |
| Extract mail details     | Set                              | Extract relevant fields from AI output | OpenAI                  | Is mail actionable        |                                                                                                     |
| Is mail actionable       | If                               | Check if email is actionable           | Extract mail details     | Build gmail search URL    | Proceeds only if the email is classified as “Actionable” by OpenAI.                                 |
| Build gmail search URL   | Code                             | Construct Gmail search URL              | Is mail actionable      | Send alert to MS team     | Builds a direct Gmail search URL using the encoded subject to help locate the email easily          |
| Send alert to MS team    | HTTP Request                     | Send actionable email alert to Teams   | Build gmail search URL  | -                        | Posts the email details to Microsoft Teams by triggering a Power Automate flow via its webhook URL |
| Sticky Note              | Sticky Note                      | Workflow trigger explanation            | -                       | -                        | Automatically runs the workflow when a new email is received from the configured Gmail account.     |
| Sticky Note1             | Sticky Note                      | AI processing explanation                | -                       | -                        | Evaluate whether the email content qualifies as actionable based on predefined criteria using OpenAI. Retrieves essential details such as subject, sender, recipient, and actionable status from the OpenAI evaluation result. |
| Sticky Note2             | Sticky Note                      | Decision making explanation              | -                       | -                        | Proceeds only if the email is classified as “Actionable” by OpenAI.                                 |
| Sticky Note3             | Sticky Note                      | Alert sending explanation                 | -                       | -                        | Builds a direct Gmail search URL using the encoded subject to help locate the email easily. Posts the email details to Microsoft Teams by triggering a Power Automate flow via its webhook URL. |
| Sticky Note4             | Sticky Note                      | Power Automate flow explanation          | -                       | -                        | Describes the Power Automate flow that receives webhook, parses JSON, gets mention token, and sends Teams message. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Email Trigger (IMAP) Node**  
   - Node type: Email Read IMAP trigger  
   - Configure with Gmail IMAP credentials (OAuth2 recommended).  
   - No special post-processing action; listen continuously for new emails.

2. **Create OpenAI Node**  
   - Node type: OpenAI (LangChain)  
   - Set model to `gpt-4.1-mini`.  
   - Add system message with the detailed prompt specifying actionable email criteria and output JSON format.  
   - Use dynamic expressions to insert email fields:  
     - From: `{{ $json.from }}`  
     - To: `{{ $json.to }}`  
     - Date: `{{ $json.date }}`  
     - Subject: `{{ $json.subject }}`  
     - Body: `{{ $json.textPlain }}`  
   - Configure OpenAI API credentials.  
   - Connect Email Trigger output to OpenAI node input.

3. **Create Set Node (Extract mail details)**  
   - Node type: Set  
   - Include fields from OpenAI response JSON:  
     - `choices[0].message.content.date`  
     - `choices[0].message.content.subject`  
     - `choices[0].message.content.from`  
     - `choices[0].message.content.to`  
     - `choices[0].message.content.actionable`  
   - Include other fields as needed.  
   - Connect OpenAI output to this node.

4. **Create If Node (Is mail actionable)**  
   - Node type: If  
   - Condition: Check if `{{$json.actionable}}` equals `"Actionable"` (case-sensitive).  
   - Connect Set node output to this If node.

5. **Create Code Node (Build gmail search URL)**  
   - Node type: Code (JavaScript)  
   - For each input item, URL-encode the `subject` field, replacing spaces with `+`.  
   - Build Gmail search URL: `https://mail.google.com/mail/u/0/#search/{encodedSubject}`.  
   - Add this as `searchLink` in JSON.  
   - Connect If node’s True branch to this node.

6. **Create HTTP Request Node (Send alert to MS team)**  
   - Node type: HTTP Request (POST)  
   - Configure URL to your Power Automate webhook URL that sends Teams messages.  
   - Set method to POST.  
   - Body parameters as JSON:  
     - `date`: `{{$json.date}}`  
     - `subject`: `{{$json.subject}}`  
     - `sender`: `{{$json.from.replace('<', '(').replace('>', ')')}}` (to avoid angle brackets)  
     - `recipientEmail`: `{{$json.to}}`  
     - `searchLink`: `{{$json.searchLink}}`  
   - Connect Code node output to HTTP Request node.

7. **Optional: Add Sticky Notes**  
   - Add descriptive sticky notes at strategic points to explain each block: trigger, AI processing, decision making, alert sending, and external Power Automate flow.

8. **Power Automate Flow Setup** (External to n8n)  
   - Create a flow triggered by an HTTP Webhook.  
   - Parse incoming JSON with fields: subject, from, to, date, searchLink.  
   - Retrieve mention token for the user in Microsoft Teams.  
   - Post a rich HTML message in Teams including email details and clickable Gmail search URL.

---

### 5. General Notes & Resources

| Note Content                                                                                                                   | Context or Link                                                                                                   |
|--------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| The Power Automate flow integrates with Microsoft Teams to post messages including @mentions and clickable email search URLs | Described in Sticky Note4, enables rich alert notifications from n8n via webhook                                 |
| Gmail search URL format uses URL encoding with spaces replaced by '+' to ensure compatibility with Gmail's search syntax     | Implemented in Build gmail search URL code node                                                                  |
| OpenAI model used is `gpt-4.1-mini` via LangChain integration, requiring valid OpenAI API credentials                         | Ensure API key is set up and has quota to support GPT-4 usage                                                    |
| Email Trigger uses IMAP with OAuth2 for Gmail; ensure credentials have read access to mailbox                                  | Credentials must be configured securely and tested to avoid workflow failures due to auth issues                 |

---

**Disclaimer:**  
The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.