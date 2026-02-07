Auto-Translate Incoming Gmail Emails to English with OpenAI GPT-3.5

https://n8nworkflows.xyz/workflows/auto-translate-incoming-gmail-emails-to-english-with-openai-gpt-3-5-8031


# Auto-Translate Incoming Gmail Emails to English with OpenAI GPT-3.5

### 1. Workflow Overview

This workflow automates the translation of incoming Gmail emails to English using OpenAI's GPT-3.5 model. It is designed for users who receive emails in multiple languages and want to automatically translate non-English emails into English for easier comprehension. The workflow logically divides into the following blocks:

- **1.1 Input Reception**: Triggered by new unread Gmail emails matching criteria.
- **1.2 Email Data Normalization**: Extracts and cleans email content for processing.
- **1.3 Language Detection**: Uses OpenAI GPT-3.5 to detect the language of the email content.
- **1.4 Conditional Translation**: Checks if translation is necessary (i.e., if language is not English).
- **1.5 Translation Execution**: Uses OpenAI GPT-3.5 to translate the email to English.
- **1.6 Preparing & Sending Translated Email**: Formats the translated content and sends it via Gmail.
- **1.7 Labeling Processed Emails**: Adds a Gmail label to mark emails as translated.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:** Watches for new unread emails in Gmail and triggers the workflow upon detection.
- **Nodes Involved:** `Gmail New Email Trigger`
- **Node Details:**
  - **Type:** Gmail Trigger node
  - **Role:** Polls Gmail every minute for unread emails excluding spam and trash.
  - **Configuration:** Filter set for unread emails, poll interval every minute.
  - **Connections:** Outputs to `Normalize Email Data`.
  - **Potential Failures:** OAuth token expiry, Gmail API rate limits or quota exceeded.
  - **Notes:** Requires Gmail OAuth credentials with read and modify permissions.

#### 1.2 Email Data Normalization

- **Overview:** Extracts relevant email data including subject, sender, recipient, body text (plain or HTML), and metadata; cleans HTML if present; skips very short emails.
- **Nodes Involved:** `Normalize Email Data`
- **Node Details:**
  - **Type:** Code node (JavaScript)
  - **Role:** Normalizes and prepares email content for language detection.
  - **Configuration:** Removes HTML tags if any, concatenates body from snippet or textBody, skips if body length <10.
  - **Expressions:** Accesses properties like `email.snippet`, `email.textPlain`, `email.textHtml`.
  - **Connections:** Input from Gmail Trigger; output to `Detect Language (OpenAI)`.
  - **Edge Cases:** Emails with no body or too short to translate are skipped (workflow halts here for those).
  - **Failure Modes:** Code syntax errors or unexpected email data structure.
  - **Logs:** Outputs preview logs for debugging.

#### 1.3 Language Detection

- **Overview:** Uses OpenAI GPT-3.5-turbo chat completion to detect the language of the normalized email body.
- **Nodes Involved:** `Detect Language (OpenAI)`
- **Node Details:**
  - **Type:** OpenAI Chat Completion node
  - **Role:** Sends the email text to GPT-3.5 to identify language.
  - **Configuration:** Uses chat resource with default parameters, expects response indicating language code or name.
  - **Input:** Receives normalized email data.
  - **Output:** Language identification string in JSON path `choices[0].message.content`.
  - **Edge Cases:** Network issues, API quota exceeded, malformed responses.
  - **Credential:** Requires OpenAI API credentials.

#### 1.4 Conditional Translation

- **Overview:** Checks if the detected language is English; if not, proceeds to translate.
- **Nodes Involved:** `Need Translation?`
- **Node Details:**
  - **Type:** If node
  - **Role:** Compares detected language (lowercased and trimmed) with `"en"`.
  - **Configuration:** Condition: `detected_language != "en"`.
  - **Input:** Output from Language Detection node.
  - **Output:** Routes to `Translate to English` if true, otherwise stops.
  - **Edge Cases:** Incorrect language detection could cause unnecessary translation or skip translation.

#### 1.5 Translation Execution

- **Overview:** Uses OpenAI to translate the email body text to English.
- **Nodes Involved:** `Translate to English`
- **Node Details:**
  - **Type:** OpenAI Chat Completion node
  - **Role:** Sends the original email body for translation into English.
  - **Configuration:** Chat resource with translation prompt (not shown explicitly, but implied).
  - **Input:** Normalized email data.
  - **Output:** Translation text in `choices[0].message.content`.
  - **Edge Cases:** API errors, timeouts, inappropriate content.
  - **Credential:** OpenAI API credentials needed.

#### 1.6 Preparing & Sending Translated Email

- **Overview:** Combines original email metadata with translated content to prepare a new email and sends it via Gmail.
- **Nodes Involved:** `Prepare Translated Email`, `Send Translated Email`
- **Node Details:**
  - **Prepare Translated Email:**
    - Type: Code node (JavaScript)
    - Role: Constructs email subject prefix `[TRANSLATED]`, includes original sender, date, message ID, and translated content.
    - Variables: Uses data from original email, detected language, and translation nodes.
    - Output: JSON with `to`, `subject`, and `body` for Gmail send node.
    - Edge Cases: Missing fields or malformed translation output.
  - **Send Translated Email:**
    - Type: Gmail node
    - Role: Sends the prepared translated email.
    - Configuration: Uses Gmail OAuth, subject and body set from previous node output.
    - Output: None, endpoint action.
    - Edge Cases: Gmail API errors, send failures, auth issues.
    - Requires Gmail OAuth with send permissions.

#### 1.7 Labeling Processed Emails

- **Overview:** Adds Gmail labels "INBOX" and "Translated Emails" to the original email to mark it as processed.
- **Nodes Involved:** `Add 'Translated' Label`
- **Node Details:**
  - **Type:** Gmail node
  - **Role:** Adds labels to the original message by message ID.
  - **Configuration:** Uses `labelIds` including `"INBOX"` and `"Translated Emails"`; message ID from normalized email node.
  - **Input:** Triggered after sending email.
  - **Edge Cases:** Label not existing (user must create or customize), Gmail API errors.
  - **Notes:** Label creation is required in Gmail beforehand or adjusted in configuration.

---

### 3. Summary Table

| Node Name               | Node Type            | Functional Role                      | Input Node(s)               | Output Node(s)                   | Sticky Note                                                                                                                           |
|-------------------------|----------------------|-----------------------------------|-----------------------------|---------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| Setup Instructions      | Sticky Note          | Setup guidance                    |                             |                                 | 🌍 **SETUP REQUIRED:** Create Gmail label 'Translated Emails', add OpenAI API key, connect Gmail OAuth, auto-detect & translate emails |
| Gmail New Email Trigger  | Gmail Trigger        | Input reception                  |                             | Normalize Email Data            |                                                                                                                                         |
| Normalize Email Data     | Code                 | Normalize and clean email content | Gmail New Email Trigger      | Detect Language (OpenAI)        |                                                                                                                                         |
| Detect Language (OpenAI) | OpenAI Chat Completion | Detect email language            | Normalize Email Data         | Need Translation?               |                                                                                                                                         |
| Need Translation?        | If                   | Check if translation needed      | Detect Language (OpenAI)     | Translate to English            |                                                                                                                                         |
| Translate to English     | OpenAI Chat Completion | Translate email to English       | Need Translation?            | Prepare Translated Email        |                                                                                                                                         |
| Prepare Translated Email | Code                 | Format translated email content  | Translate to English         | Send Translated Email, Add 'Translated' Label |                                                                                                                                         |
| Send Translated Email    | Gmail Send           | Send translated email            | Prepare Translated Email     | Add 'Translated' Label          |                                                                                                                                         |
| Add 'Translated' Label   | Gmail Label Modifier  | Label original email as translated | Prepare Translated Email     |                                 |                                                                                                                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Label in Gmail:**
   - Label name: `Translated Emails`
   - Or customize name used in labeling node.

2. **Setup Credentials:**
   - In n8n, create Gmail OAuth2 credentials with read, send, and modify permissions.
   - Create OpenAI API credentials with your API key from platform.openai.com.

3. **Add Node: Gmail New Email Trigger**
   - Type: Gmail Trigger
   - Parameters:
     - Filter unread emails only.
     - Exclude spam and trash.
     - Poll interval: every 1 minute.
   - Connect to `Normalize Email Data`.

4. **Add Node: Normalize Email Data (Code)**
   - Type: Code
   - Paste JavaScript to:
     - Extract snippet, plain text, or HTML from incoming email.
     - Strip HTML tags if present.
     - Skip emails with body length less than 10.
     - Output normalized JSON with message_id, thread_id, subject, from, to, body_text, received_date, labels, attachments flag.
   - Connect output to `Detect Language (OpenAI)`.

5. **Add Node: Detect Language (OpenAI)**
   - Type: OpenAI Chat Completion
   - Use GPT-3.5-turbo model.
   - Prompt to detect language of normalized email body.
   - Connect output to `Need Translation?` node.

6. **Add Node: Need Translation? (If)**
   - Type: If
   - Condition: Check if detected language (`choices[0].message.content`) is NOT `"en"`.
   - True branch connects to `Translate to English`.
   - False branch ends workflow (no further actions).

7. **Add Node: Translate to English (OpenAI)**
   - Type: OpenAI Chat Completion
   - Use GPT-3.5-turbo.
   - Prompt to translate email body to English.
   - Input: normalized email body.
   - Connect output to `Prepare Translated Email`.

8. **Add Node: Prepare Translated Email (Code)**
   - Type: Code
   - Compose new email with:
     - Subject prefixed with `[TRANSLATED]`.
     - Body including original sender, date, message ID, and translated content.
   - Output fields: `to`, `subject`, `body`.
   - Connect outputs to both `Send Translated Email` and `Add 'Translated' Label`.

9. **Add Node: Send Translated Email (Gmail)**
   - Type: Gmail node (Send Email)
   - Parameters:
     - Message body from `Prepare Translated Email.body`.
     - Subject from `Prepare Translated Email.subject`.
     - Recipient from `Prepare Translated Email.to`.
   - Connect to `Add 'Translated' Label`.

10. **Add Node: Add 'Translated' Label (Gmail)**
    - Type: Gmail node (Add Labels)
    - Parameters:
      - Label IDs: `"INBOX"` and `"Translated Emails"`.
      - Message ID from `Normalize Email Data.message_id`.
    - Marks original email as labeled translated.

11. **Test the workflow:**
    - Send emails in various languages to Gmail inbox.
    - Confirm translations are sent and labels applied.

---

### 5. General Notes & Resources

| Note Content                                                                                  | Context or Link                                                                                                     |
|-----------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| Workflow uses OpenAI GPT-3.5-turbo for cost-effective language detection and translation.     | OpenAI platform: https://platform.openai.com                                                                        |
| Gmail label "Translated Emails" must be created manually or customized in labeling node.      | Gmail Labels documentation: https://support.google.com/mail/answer/118708?hl=en                                     |
| OAuth scopes needed: Gmail read, modify, send.                                                | n8n Gmail OAuth2 credential setup: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/          |
| Workflow auto-detects language and only translates if language differs from English ("en").   |                                                                                                                    |
| Logs in code nodes provide debugging info about email processing and language detection.      |                                                                                                                    |

---

**Disclaimer:** The text provided is exclusively from an automated workflow created with n8n, respecting all current content policies and handling only legal and public data.