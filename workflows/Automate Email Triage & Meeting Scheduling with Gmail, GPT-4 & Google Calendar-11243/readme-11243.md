Automate Email Triage & Meeting Scheduling with Gmail, GPT-4 & Google Calendar

https://n8nworkflows.xyz/workflows/automate-email-triage---meeting-scheduling-with-gmail--gpt-4---google-calendar-11243


# Automate Email Triage & Meeting Scheduling with Gmail, GPT-4 & Google Calendar

### 1. Workflow Overview

This workflow is an AI-powered inbound email assistant designed to automate the triage and response process for Gmail-based outreach. It targets sales, support, or lead qualification teams who want to streamline email handling by automatically classifying incoming messages, scheduling meetings, sending polite declines, or following up on unclear leads.

The workflow divides logically into five main blocks:

- **1.1 Ingestion & Filtering:** Monitors Gmail for new emails, parses their content, and verifies senders against a whitelist in Google Sheets. Filters out automated calendar responses to avoid loops.

- **1.2 AI Analysis & Routing:** Uses GPT-4 to analyze the email content, classify the lead’s intent into three categories (schedule meeting, auto-reply, needs review), and routes accordingly.

- **1.3 Booking & Confirmation:** For meeting requests, automatically creates Google Calendar events, sends personalized HTML confirmation emails, and notifies the user via Telegram.

- **1.4 Polite Decline:** Generates and sends courteous AI-driven responses to leads who are not interested, without calendar links.

- **1.5 Re-engagement:** For unclear or unresponsive leads, waits a configurable delay and then sends a gentle, personalized follow-up email.


---

### 2. Block-by-Block Analysis

#### 1.1 Ingestion & Filtering 📥

**Overview:**  
This block triggers on incoming Gmail messages, parses email content for key fields, and verifies if the sender is allowed by cross-checking a Google Sheets whitelist. It also filters out calendar response emails to prevent workflow loops.

**Nodes Involved:**  
- Gmail Trigger  
- Function Node: Parse Email Content  
- Get row(s) in sheet  
- Merge (Allowed)  
- If  

**Node Details:**

- **Gmail Trigger**  
  - *Type:* Trigger node listening for new Gmail emails (polls every minute).  
  - *Configuration:* Uses Gmail OAuth2 credentials.  
  - *Input/Output:* Outputs raw Gmail email JSON.  
  - *Failure Modes:* OAuth token expiry, Gmail API rate limits.  
  - *Notes:* Entry point for the workflow.

- **Function Node: Parse Email Content**  
  - *Type:* Code node to extract and decode email sender, subject, and body from Gmail payload.  
  - *Configuration:* Decodes base64 email body, falls back to snippet if body missing. Extracts clean sender email and lead name.  
  - *Expressions:* Uses `$json.payload`, `$json.headers`, regex for email/name extraction.  
  - *Input:* Gmail Trigger output.  
  - *Output:* JSON with `lead_name`, `from_email`, `subject`, `last_message`, `context_language` (default "en"), and `calendar_link`.  
  - *Failure Modes:* Invalid base64 data, missing email parts.  
  - *Notes:* Ensures consistent email data for downstream AI processing.

- **Get row(s) in sheet**  
  - *Type:* Google Sheets node to retrieve whitelist rows.  
  - *Configuration:* Requires Google Sheets OAuth2 credentials, configured with whitelist spreadsheet document ID and sheet name.  
  - *Input:* Output of email parsing node.  
  - *Output:* Rows from Google Sheets.  
  - *Failure Modes:* Credential issues, sheet access denied, missing sheet data.

- **Merge (Allowed)**  
  - *Type:* Merge node combining whitelist data with parsed email data.  
  - *Configuration:* Merges by matching `email` from sheet with `from_email` from parsed email.  
  - *Input:* Parsed email and whitelist rows.  
  - *Output:* Combined data only if sender email exists in whitelist.  
  - *Failure Modes:* No matching whitelist entry leads to empty output, blocking further processing.

- **If**  
  - *Type:* Conditional node filtering calendar automated replies.  
  - *Configuration:* Checks if email subject contains keywords like "Accepted", "Declined", "Tentative" in multiple languages to filter out auto-responses.  
  - *Input:* Merged allowed sender data.  
  - *Output:* Passes only if subject does **not** contain these keywords.  
  - *Failure Modes:* False negatives/positives if subject variations occur.

---

#### 1.2 AI Analysis & Routing 🧠

**Overview:**  
This block sends the parsed email content to GPT-4 via LangChain OpenAI node for intent classification and drafting an AI-generated reply. Based on GPT-4’s output action, the workflow routes the flow to schedule meetings, send auto-replies, or flag for follow-up.

**Nodes Involved:**  
- Message a model  
- Merge  
- Switch  

**Node Details:**

- **Message a model**  
  - *Type:* LangChain OpenAI node using GPT-4.1-mini model.  
  - *Configuration:* System prompt instructs GPT-4 to classify email intent into three categories and generate a professional reply under 150 words.  
  - *Input:* Filtered email data with `lead_name`, `last_message`, etc.  
  - *Output:* JSON containing `reply`, `summary`, and `action` (schedule_meeting, auto_reply, needs_review).  
  - *Failure Modes:* API rate limits, malformed prompt, incomplete email data causing "needs_review" fallback.

- **Merge**  
  - *Type:* Combines original email data with GPT-4 response.  
  - *Configuration:* Combines by position (1:1).  
  - *Input:* Original parsed email and GPT-4 response.  
  - *Output:* Unified JSON with original and AI message content.

- **Switch**  
  - *Type:* Routing node branching by GPT-4 `action` field.  
  - *Configuration:* Switches on `message.content.action` to one of three outputs: schedule_meeting, auto_reply, needs_review.  
  - *Input:* Merged data.  
  - *Output:* Routes to corresponding downstream logic blocks.  
  - *Failure Modes:* Unexpected or missing `action` values could cause workflow stall.

---

#### 1.3 Booking & Confirmation 📅

**Overview:**  
For emails classified as meeting requests, this block creates a Google Calendar event, sends a personalized AI-crafted confirmation email, and notifies the user via Telegram.

**Nodes Involved:**  
- Create an event  
- Personalize AI Reply  
- Send AI Reply (schedule_meeting)  
- Send a text message (New Meeting)  

**Node Details:**

- **Create an event**  
  - *Type:* Google Calendar node creating an event.  
  - *Configuration:* Uses Google Calendar OAuth2 credentials and calendar ID. Sets event start as now, end two hours later, summary and description from email and AI summary, attendee as sender email.  
  - *Input:* Switch output for schedule_meeting.  
  - *Output:* Event details including links.  
  - *Failure Modes:* Calendar access errors, invalid email format, event conflicts.

- **Personalize AI Reply**  
  - *Type:* Code node to generate styled HTML email confirming meeting.  
  - *Configuration:* Uses lead name, calendar link, and AI reply text to build a professional message with embedded calendar link.  
  - *Input:* Output of calendar event node.  
  - *Output:* JSON with `finalMessage` HTML and subject line.  
  - *Failure Modes:* Missing calendar link or lead name can cause incomplete emails.

- **Send AI Reply (schedule_meeting)**  
  - *Type:* Gmail node sending email.  
  - *Configuration:* Uses Gmail OAuth2, sends to lead’s email, with the personalized HTML message and subject.  
  - *Input:* Personalized reply node output.  
  - *Failure Modes:* Gmail send failures, quota limits.

- **Send a text message (New Meeting)**  
  - *Type:* Telegram node sending notification to user.  
  - *Configuration:* Sends a formatted message with lead name, meeting time, subject, and calendar link.  
  - *Input:* Calendar event node output.  
  - *Failure Modes:* Telegram API failures, invalid chat ID.

---

#### 1.4 Polite Decline 💬

**Overview:**  
For leads who decline or are not interested, this block generates a polite, AI-personalized decline email and sends it without including any calendar links.

**Nodes Involved:**  
- Personalize Auto Reply  
- Send AI Reply (auto_reply)  

**Node Details:**

- **Personalize Auto Reply**  
  - *Type:* Code node generating HTML email body with a polite thank-you message.  
  - *Configuration:* Uses lead name and AI reply content to create a professional, friendly message without calendar links.  
  - *Input:* Switch output for auto_reply.  
  - *Output:* JSON with `finalMessage` HTML and subject.  
  - *Failure Modes:* Missing lead name or reply text can cause generic messages.

- **Send AI Reply (auto_reply)**  
  - *Type:* Gmail node sending the decline email.  
  - *Configuration:* Uses Gmail OAuth2, sends to lead email with personalized message and subject prefixed with "Re:".  
  - *Failure Modes:* Gmail send failures.

---

#### 1.5 Re-engagement ⏳

**Overview:**  
For leads whose intent is unclear or require human review, this block waits a configurable delay (default 3 minutes for testing, meant as days in production), then sends a personalized AI-generated follow-up email to re-engage them.

**Nodes Involved:**  
- Wait  
- AI Reminder Generator  
- Personalize Greeting  
- Send AI Reminder Email  

**Node Details:**

- **Wait**  
  - *Type:* Delay node waiting a preset time before continuing.  
  - *Configuration:* Waits 3 minutes (configurable to days).  
  - *Input:* Switch output for needs_review.  
  - *Failure Modes:* Workflow paused, potential timeout if delay too long.

- **AI Reminder Generator**  
  - *Type:* LangChain OpenAI node generating a re-engagement email.  
  - *Configuration:* GPT-4.1-mini model instructed to send a concise, friendly follow-up without calendar links. Outputs JSON with `subject` and `body`.  
  - *Input:* Wait node output.  
  - *Failure Modes:* API errors, incomplete input data.

- **Personalize Greeting**  
  - *Type:* Code node formatting the AI-generated follow-up into styled HTML.  
  - *Configuration:* Uses lead name, subject, and AI message body to create a warm, professional HTML email.  
  - *Input:* AI Reminder Generator output.  
  - *Failure Modes:* Missing fields causing generic messages.

- **Send AI Reminder Email**  
  - *Type:* Gmail node sending the follow-up email.  
  - *Configuration:* Uses Gmail OAuth2, sends to lead’s email with personalized HTML message and subject.  
  - *Failure Modes:* Gmail send failures.

---

### 3. Summary Table

| Node Name                      | Node Type                       | Functional Role                                   | Input Node(s)                    | Output Node(s)                          | Sticky Note                                                                                                                                                                                                                                                                           |
|--------------------------------|--------------------------------|-------------------------------------------------|---------------------------------|----------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Gmail Trigger                  | Gmail Trigger                  | Entry point: triggers on new incoming Gmail email | None                            | Function Node: Parse Email Content     | ## 1.  Ingestion & Filtering 📥<br>Monitors your inbox, verifies sender whitelist, filters calendar auto-replies.                                                                                                                                                                        |
| Function Node: Parse Email Content | Code                         | Parses and cleans email content                   | Gmail Trigger                   | Merge, Merge (Allowed)                  | ## 1.  Ingestion & Filtering 📥<br>Monitors your inbox, verifies sender whitelist, filters calendar auto-replies.                                                                                                                                                                        |
| Get row(s) in sheet            | Google Sheets                  | Retrieves whitelist of allowed senders            | Function Node: Parse Email Content | Merge (Allowed)                        | ## 1.  Ingestion & Filtering 📥<br>Monitors your inbox, verifies sender whitelist, filters calendar auto-replies.                                                                                                                                                                        |
| Merge (Allowed)                | Merge                         | Merges parsed email with whitelist rows by email | Function Node, Get row(s) in sheet | If                                  | ## 1.  Ingestion & Filtering 📥<br>Monitors your inbox, verifies sender whitelist, filters calendar auto-replies.                                                                                                                                                                        |
| If                            | If                            | Filters out calendar auto-reply emails            | Merge (Allowed)                 | Send a text message (meet accepted), Message a model | ## 1.  Ingestion & Filtering 📥<br>Monitors your inbox, verifies sender whitelist, filters calendar auto-replies.                                                                                                                                                                        |
| Message a model               | LangChain OpenAI (GPT-4.1-mini) | AI analyzes email intent, drafts reply             | If                            | Merge                                  | ##  2. AI Analysis & Routing 🧠<br>Classifies intent and generates AI reply.                                                                                                                                                                                                            |
| Merge                         | Merge                         | Combines original and AI response data            | Function Node, Message a model  | Switch                                 | ##  2. AI Analysis & Routing 🧠<br>Classifies intent and generates AI reply.                                                                                                                                                                                                            |
| Switch                        | Switch                        | Routes flow based on AI-determined action          | Merge                         | Create an event, Personalize Auto Reply, Wait | ##  2. AI Analysis & Routing 🧠<br>Classifies intent and generates AI reply.                                                                                                                                                                                                            |
| Create an event               | Google Calendar               | Creates calendar event for meeting requests       | Switch (schedule_meeting)       | Personalize AI Reply, Send a text message (New Meeting) | ##  3. Booking & Confirmation 📅<br>Creates event, sends confirmation email, Telegram notification.                                                                                                                                                                                     |
| Personalize AI Reply          | Code                         | Generates personalized HTML meeting confirmation email | Create an event               | Send AI Reply (schedule_meeting)        | ##  3. Booking & Confirmation 📅<br>Creates event, sends confirmation email, Telegram notification.                                                                                                                                                                                     |
| Send AI Reply (schedule_meeting) | Gmail                        | Sends personalized meeting confirmation email      | Personalize AI Reply            | None                                  | ##  3. Booking & Confirmation 📅<br>Creates event, sends confirmation email, Telegram notification.                                                                                                                                                                                     |
| Send a text message (New Meeting) | Telegram                     | Sends Telegram notification of new booking         | Create an event                | None                                  | ##  3. Booking & Confirmation 📅<br>Creates event, sends confirmation email, Telegram notification.                                                                                                                                                                                     |
| Personalize Auto Reply        | Code                         | Generates polite AI decline email                   | Switch (auto_reply)             | Send AI Reply (auto_reply)              | ## 4. Polite Decline 💬<br>Generates polite AI replies without calendar links.                                                                                                                                                                                                         |
| Send AI Reply (auto_reply)    | Gmail                        | Sends polite decline email                           | Personalize Auto Reply          | None                                  | ## 4. Polite Decline 💬<br>Generates polite AI replies without calendar links.                                                                                                                                                                                                         |
| Wait                         | Wait                         | Delays to allow time before follow-up               | Switch (needs_review)           | AI Reminder Generator                   | ##  5. Re-engagement ⏳<br>Waits then sends personalized follow-up email.                                                                                                                                                                                                              |
| AI Reminder Generator        | LangChain OpenAI (GPT-4.1-mini) | Generates friendly, concise follow-up email         | Wait                         | Personalize Greeting                    | ##  5. Re-engagement ⏳<br>Waits then sends personalized follow-up email.                                                                                                                                                                                                              |
| Personalize Greeting          | Code                         | Formats AI follow-up email into styled HTML          | AI Reminder Generator          | Send AI Reminder Email                  | ##  5. Re-engagement ⏳<br>Waits then sends personalized follow-up email.                                                                                                                                                                                                              |
| Send AI Reminder Email       | Gmail                        | Sends personalized follow-up email                   | Personalize Greeting            | None                                  | ##  5. Re-engagement ⏳<br>Waits then sends personalized follow-up email.                                                                                                                                                                                                              |
| Send a text message (meet accepted) | Telegram                     | Notifies user on Telegram of calendar response       | If                            | None                                  | ## 1.  Ingestion & Filtering 📥<br>Monitors your inbox, verifies sender whitelist, filters calendar auto-replies.                                                                                                                                                                        |
| Sticky Note                  | Sticky Note                  | Documentation: Overall workflow description          | None                           | None                                  | ## AI-Powered Inbound Email Assistant with Smart Classification & Auto-Response<br>This workflow acts as your personal email assistant...                                                                                                                                              |
| Sticky Note1                 | Sticky Note                  | Documentation: Block 1 description                    | None                           | None                                  | ## 1.  Ingestion & Filtering 📥<br>Monitors your inbox, verifies sender whitelist, filters calendar auto-replies.                                                                                                                                                                        |
| Sticky Note2                 | Sticky Note                  | Documentation: Block 2 description                    | None                           | None                                  | ##  2. AI Analysis & Routing 🧠<br>Classifies intent and generates AI reply.                                                                                                                                                                                                            |
| Sticky Note3                 | Sticky Note                  | Documentation: Block 3 description                    | None                           | None                                  | ##  3. Booking & Confirmation 📅<br>Creates event, sends confirmation email, Telegram notification.                                                                                                                                                                                     |
| Sticky Note4                 | Sticky Note                  | Documentation: Block 4 description                    | None                           | None                                  | ## 4. Polite Decline 💬<br>Generates polite AI replies without calendar links.                                                                                                                                                                                                         |
| Sticky Note5                 | Sticky Note                  | Documentation: Block 5 description                    | None                           | None                                  | ##  5. Re-engagement ⏳<br>Waits then sends personalized follow-up email.                                                                                                                                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger node:**  
   - Type: Gmail Trigger  
   - Credentials: Connect Gmail OAuth2 account  
   - Settings: Poll every minute for new emails  
   - Output: Raw Gmail email JSON  

2. **Create Function Node: Parse Email Content:**  
   - Type: Code  
   - Purpose: Decode base64 email body, extract sender name/email, subject, and last message text.  
   - Use provided JavaScript to handle multipart email structure and fallback to snippet if needed.  
   - Output fields: `lead_name`, `from_email`, `subject`, `last_message`, `context_language` ("en"), `calendar_link`.  
   - Connect Gmail Trigger output to this node input.

3. **Create Google Sheets node: Get row(s) in sheet:**  
   - Type: Google Sheets  
   - Credentials: Connect Google Sheets OAuth2 account  
   - Parameters: Specify whitelist spreadsheet document ID and sheet name  
   - Output: Rows containing allowed email list (`email`, `first_name`, `company`)  
   - Connect Function Node output to this node input.

4. **Create Merge (Allowed) node:**  
   - Type: Merge  
   - Mode: Combine  
   - Advanced: Merge by fields: `email` (sheet) and `from_email` (email)  
   - Inputs: Connect outputs of Function Node and Google Sheets node  
   - Output: Only emails present in whitelist proceed.

5. **Create If node:**  
   - Type: If  
   - Condition: Check if email subject contains any calendar auto-reply keywords (e.g., "Accepted", "Declined", "Tentative" in English and Turkish)  
   - Passes if subject **does not** contain these keywords  
   - Input: Merge (Allowed) output  
   - Output 1: For non-calendar replies (continue workflow)  
   - Output 2: For calendar replies (send Telegram notification)

6. **Create Telegram node: Send a text message (meet accepted):**  
   - Type: Telegram  
   - Credentials: Connect Telegram API with chat ID  
   - Message: Notify user of calendar response received, including lead info and meeting status  
   - Input: If node output for calendar replies

7. **Create LangChain OpenAI node: Message a model:**  
   - Type: LangChain OpenAI (OpenAI credentials required)  
   - Model: GPT-4.1-mini  
   - Parameters: System prompt instructing AI to classify email intent into schedule_meeting, auto_reply, or needs_review and draft reply  
   - Input: If node output for valid emails  
   - Output: JSON with `reply`, `summary`, `action`

8. **Create Merge node:**  
   - Type: Merge  
   - Mode: Combine by position  
   - Inputs: Function Node parsed email data and Message a model output

9. **Create Switch node:**  
   - Type: Switch  
   - Condition: Switch on `message.content.action` field  
   - Outputs: 3 branches for `schedule_meeting`, `auto_reply`, `needs_review`  
   - Input: Merge output

10. **For schedule_meeting branch:**  
    - Create Google Calendar node: Create an event  
      - Credentials: Google Calendar OAuth2  
      - Settings: Use current time for event start, plus 2 hours for end, summary and description from email and AI summary, attendee from sender email  
    - Connect Switch output schedule_meeting to this node input.

    - Create Code node: Personalize AI Reply  
      - Purpose: Generate HTML email with calendar link and personalized message  
      - Input: Calendar event output  
    - Create Gmail node: Send AI Reply (schedule_meeting)  
      - Credentials: Gmail OAuth2  
      - Send to lead email with personalized HTML message and subject  
    - Create Telegram node: Send a text message (New Meeting)  
      - Notify user about new meeting booking with details

    - Connect nodes in order: Create an event → Personalize AI Reply → Send AI Reply (schedule_meeting) and Send a text message (New Meeting)

11. **For auto_reply branch:**  
    - Create Code node: Personalize Auto Reply  
      - Generates polite decline email HTML without calendar links  
    - Create Gmail node: Send AI Reply (auto_reply)  
      - Sends the personalized decline email  
    - Connect Switch output auto_reply → Personalize Auto Reply → Send AI Reply (auto_reply)

12. **For needs_review branch:**  
    - Create Wait node: Delay for follow-up (default 3 minutes for testing, adjust to days in production)  
    - Create LangChain OpenAI node: AI Reminder Generator  
      - Generates friendly, concise follow-up email without calendar links  
    - Create Code node: Personalize Greeting  
      - Formats AI reply into styled HTML  
    - Create Gmail node: Send AI Reminder Email  
      - Sends follow-up email to lead  
    - Connect nodes: Switch → Wait → AI Reminder Generator → Personalize Greeting → Send AI Reminder Email

13. **Final setup:**  
    - Configure all credentials for Gmail OAuth2, Google Sheets OAuth2, Google Calendar OAuth2, OpenAI API, Telegram API.  
    - Create Google Sheets whitelist with columns: `email`, `first_name`, `company`.  
    - Update calendar and sheet IDs in relevant nodes.  
    - Adjust Wait node delay as needed for production.  
    - Test workflow thoroughly for error handling and edge cases.

---

### 5. General Notes & Resources

| Note Content                                                                                                              | Context or Link                                                                                     |
|---------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| This workflow acts as a personal email assistant automating lead triage, scheduling, polite declines, and follow-ups.    | Sticky Note on overall workflow documentation                                                    |
| Setup requires OpenAI GPT-4 API access, Gmail, Google Sheets, Google Calendar, and Telegram API credentials.              | Credential setup instructions in Sticky Note                                                     |
| Whitelist Google Sheet must contain columns: `email`, `first_name`, `company` to validate allowed senders.               | Workflow configuration prerequisite                                                              |
| The Wait node is set to minutes for testing but should be configured to days for realistic follow-up timing.              | Sticky Note5 describing Re-engagement block                                                      |
| Telegram notifications provide real-time alerts for meeting bookings and calendar responses to keep user informed.       | Booking & confirmation block and calendar response notification nodes                             |
| AI prompts are carefully designed to ensure replies are polite, concise, and context-aware, avoiding accidental spamming. | Prompts embedded in LangChain OpenAI nodes                                                       |
| Check for Gmail API rate limits and OAuth token expiry to prevent workflow interruptions.                                 | Common failure modes, credential validity                                                        |
| For better localization, email language detection can be enhanced beyond the fixed "en" context_language field.          | Potential enhancement area                                                                         |
| For detailed usage and customization tips, visit the n8n community forums and official documentation on LangChain nodes. | https://community.n8n.io/ and https://docs.n8n.io/integrations/builtin/nodes/n8n-nodes-langchain/  |

---

**Disclaimer:** The provided documentation is based exclusively on an automated workflow created with n8n. The workflow adheres strictly to content policies and contains no illegal or protected elements. All data processed is legal and public.