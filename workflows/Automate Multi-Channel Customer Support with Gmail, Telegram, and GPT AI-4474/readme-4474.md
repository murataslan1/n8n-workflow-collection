Automate Multi-Channel Customer Support with Gmail, Telegram, and GPT AI

https://n8nworkflows.xyz/workflows/automate-multi-channel-customer-support-with-gmail--telegram--and-gpt-ai-4474


# Automate Multi-Channel Customer Support with Gmail, Telegram, and GPT AI

### 1. Workflow Overview

This workflow, titled **"🤖 Smart Customer Support AI Agent"**, automates multi-channel customer support by integrating Gmail and Telegram with GPT-based AI agents. It is tailored for small to medium businesses, e-commerce stores, SaaS companies, and other service providers seeking to streamline customer support operations. The workflow reduces response times, handles repetitive queries automatically, provides 24/7 support, maintains brand voice consistency, escalates complex issues to human agents, and logs all interactions for analysis.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception**: Triggers that listen for incoming customer messages from Gmail and Telegram.
- **1.2 Message Processing**: Nodes that extract and structure key information from incoming messages, differentiating between channels.
- **1.3 AI Processing**: Channel-specific AI agents that interpret queries using GPT, enriched by knowledge base access and conversation memory.
- **1.4 Reply Dispatch and Logging**: Sending personalized replies back to customers via the appropriate channels and logging interactions into Google Sheets.
- **1.5 Escalation Logging**: Records escalation-worthy inquiries for human follow-up.
- **1.6 Error Handling**: Captures workflow errors, notifies admins via Slack, and logs for debugging.
- **1.7 Workflow Guide and Documentation**: A sticky note outlining purpose, setup, and customization.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block listens for new customer inquiries on Gmail and Telegram, triggering the workflow upon receiving new messages.

**Nodes Involved:**  
- 📧 Gmail Customer Inquiry Trigger  
- 💬 Telegram Customer Message Trigger  

**Node Details:**

- **📧 Gmail Customer Inquiry Trigger**  
  - *Type:* Gmail Trigger  
  - *Role:* Polls Gmail inbox for unread personal emails every minute.  
  - *Configuration:* Filters set to labelIds `INBOX` and `CATEGORY_PERSONAL`, unread status only.  
  - *Expression/Variables:* None.  
  - *Connections:* Outputs to 📋 Process Gmail Message.  
  - *Version:* 1  
  - *Potential Failures:* OAuth token expiry or Gmail API limits.  

- **💬 Telegram Customer Message Trigger**  
  - *Type:* Telegram Trigger  
  - *Role:* Listens for new Telegram messages (updates of type "message") via webhook.  
  - *Configuration:* Uses Telegram bot token credential.  
  - *Expression/Variables:* None.  
  - *Connections:* Outputs to 📋 Process Telegram Message.  
  - *Version:* 1.1  
  - *Potential Failures:* Webhook misconfiguration, Telegram API downtime or invalid bot token.  

---

#### 1.2 Message Processing

**Overview:**  
Extracts relevant data from incoming messages and assigns standardized fields for downstream processing, differentiated by channel.

**Nodes Involved:**  
- 📋 Process Gmail Message  
- 📋 Process Telegram Message  

**Node Details:**

- **📋 Process Gmail Message**  
  - *Type:* Set Node  
  - *Role:* Parses Gmail message JSON to extract customer email, name, subject, message content, message and thread IDs.  
  - *Configuration:* Uses expressions to parse "From" field into email and name, extracts subject, message snippet or full text. Assigns channel = "gmail".  
  - *Variables:*  
    - `customer_email` from regex on From field.  
    - `customer_name` from From field split before email.  
    - `message_content` from `text` or `snippet`.  
  - *Connections:* Outputs to 🤖 Gmail AI Agent.  
  - *Version:* 3.4  
  - *Edge Cases:* Malformed From header, missing text content, empty subject.  

- **📋 Process Telegram Message**  
  - *Type:* Set Node  
  - *Role:* Extracts Telegram message details: customer name (first + last), customer ID, chat ID, message content, message ID, and hardcoded subject. Channel set to "telegram".  
  - *Configuration:* Uses expressions from Telegram message JSON.  
  - *Variables:*  
    - `customer_name` from message.from fields.  
    - `chat_id` and `message_id` for replies.  
  - *Connections:* Outputs to 🤖 Telegram AI Agent.  
  - *Version:* 3.4  
  - *Edge Cases:* Missing last name, non-text messages, deleted messages.  

---

#### 1.3 AI Processing

**Overview:**  
Uses channel-specific AI agents powered by OpenAI GPT models and enhanced by conversation memory and access to knowledge base stored in Google Sheets. This block interprets queries, formulates responses, and decides on escalation.

**Nodes Involved:**  
- 🤖 Gmail AI Agent  
- 🤖 Telegram AI Agent  
- 🧠 OpenAI Chat Model - Gmail  
- 🧠 OpenAI Chat Model - Telegram  
- 🧠 Gmail Memory  
- 🧠 Telegram Memory  
- knowledge base (Google Sheets Tool)  
- knowledge base1 (Google Sheets Tool)  
- Gmail Escalation Logger (Google Sheets Tool)  
- Telegram Escalation Logger (Google Sheets Tool)  

**Node Details:**

- **🤖 Gmail AI Agent**  
  - *Type:* LangChain Agent (AI Agent)  
  - *Role:* Processes Gmail message content with system prompt tailored for email customer support; uses knowledge base and memory.  
  - *Configuration:* System message instructs empathy, clarity, escalation rules, and professional tone for email.  
  - *Connections:*  
    - Input: from 📋 Process Gmail Message  
    - AI Tool: knowledge base  
    - AI Memory: 🧠 Gmail Memory  
    - AI Language Model: 🧠 OpenAI Chat Model - Gmail  
    - Output: 📧 Send Gmail Reply and Gmail Escalation Logger  
  - *Version:* 1.7  
  - *Edge Cases:* API errors, knowledge base unavailability, memory key collisions.  

- **🤖 Telegram AI Agent**  
  - *Type:* LangChain Agent (AI Agent)  
  - *Role:* Similar to Gmail AI Agent but tailored for Telegram inquiries with channel-specific prompts.  
  - *Configuration:* Friendly, professional tone with Telegram-specific context.  
  - *Connections:*  
    - Input: from 📋 Process Telegram Message  
    - AI Tool: knowledge base1  
    - AI Memory: 🧠 Telegram Memory  
    - AI Language Model: 🧠 OpenAI Chat Model - Telegram  
    - Output: 💬 Send Telegram Reply and Telegram Escalation Logger  
  - *Version:* 1.7  
  - *Edge Cases:* Telegram message length limits, API rate limits, memory management.  

- **🧠 OpenAI Chat Model - Gmail / Telegram**  
  - *Type:* LangChain OpenAI Chat Model  
  - *Role:* Provides GPT model responses to AI agents.  
  - *Configuration:*  
    - Gmail: maxTokens=1000, temperature=0.3  
    - Telegram: maxTokens=100, temperature=0.3  
  - *Connections:* Input from AI Agent, output back to AI Agent.  
  - *Version:* 1.1  
  - *Edge Cases:* API rate limits, token limits exceeded, authentication errors.  

- **🧠 Gmail Memory / Telegram Memory**  
  - *Type:* LangChain Memory Buffer Window  
  - *Role:* Maintains conversation context per customer session using custom keys (`gmail_{{customer_email}}` and `telegram_{{customer_id}}`).  
  - *Configuration:* Session keys constructed dynamically from customer identifiers.  
  - *Connections:* Input/output linked to respective AI Agents.  
  - *Version:* 1.3  
  - *Edge Cases:* Memory overflow, session key collisions, data persistence issues.  

- **knowledge base / knowledge base1**  
  - *Type:* Google Sheets Tool  
  - *Role:* Provides access to company knowledge base stored in Google Sheets to enrich AI responses for both channels.  
  - *Configuration:* Reads from the "Knowledge_Base" sheet of a specified Google Sheets document.  
  - *Connections:* Linked as AI Tool input to respective AI Agents.  
  - *Version:* 4.5  
  - *Edge Cases:* Sheet access permissions, data format changes, Google Sheets quota limits.  

- **Gmail Escalation Logger / Telegram Escalation Logger**  
  - *Type:* Google Sheets Tool  
  - *Role:* Logs escalated inquiries to a "Customer_Inquiries" sheet for human follow-up.  
  - *Configuration:* Appends escalation-worthy entries including customer info, message, and AI response.  
  - *Connections:* Linked as AI Tool outputs from AI Agents.  
  - *Version:* 4.5  
  - *Edge Cases:* Logging failures, permission issues, slow sheet writes.  

---

#### 1.4 Reply Dispatch and Logging

**Overview:**  
Sends AI-generated replies back to customers via Gmail or Telegram and logs all interactions into a Google Sheet for analysis.

**Nodes Involved:**  
- 📧 Send Gmail Reply  
- ✅ Mark Gmail as Read  
- 📊 Log Gmail Interaction  
- 💬 Send Telegram Reply  
- 📊 Log Telegram Interaction  

**Node Details:**

- **📧 Send Gmail Reply**  
  - *Type:* Gmail Node  
  - *Role:* Sends AI-generated reply as a direct reply to the original email message.  
  - *Configuration:* Uses "replyToSenderOnly" option, references original message ID for threading.  
  - *Connections:* Input from 🤖 Gmail AI Agent, outputs to ✅ Mark Gmail as Read and 📊 Log Gmail Interaction.  
  - *Version:* 2  
  - *Edge Cases:* Gmail API quota, invalid message ID, authentication errors.  

- **✅ Mark Gmail as Read**  
  - *Type:* Gmail Node  
  - *Role:* Marks the original Gmail message as read after replying to avoid duplicate processing.  
  - *Configuration:* Uses message ID from processed Gmail message.  
  - *Connections:* Input from 📧 Send Gmail Reply.  
  - *Version:* 2  
  - *Edge Cases:* API rate limits, message ID invalidation.  

- **📊 Log Gmail Interaction**  
  - *Type:* Google Sheets  
  - *Role:* Appends interaction details (timestamp, channel, customer info, AI response, status, etc.) to the "AI_Responses" sheet.  
  - *Configuration:* Maps fixed schema columns with dynamic data from nodes.  
  - *Connections:* Input from 📧 Send Gmail Reply.  
  - *Version:* 4.2  
  - *Edge Cases:* Sheet access issues, schema changes, large data volumes.  

- **💬 Send Telegram Reply**  
  - *Type:* Telegram Node  
  - *Role:* Sends AI-generated reply message in Markdown format to the Telegram chat, replying to the original message.  
  - *Configuration:* Uses chat ID and message ID for reply threading, sets parse_mode to Markdown.  
  - *Connections:* Input from 🤖 Telegram AI Agent, outputs to 📊 Log Telegram Interaction.  
  - *Version:* 1.2  
  - *Edge Cases:* Message length limits, bot permissions, network errors.  

- **📊 Log Telegram Interaction**  
  - *Type:* Google Sheets  
  - *Role:* Logs Telegram customer support interaction similarly to Gmail logs.  
  - *Configuration:* Uses shared "AI_Responses" sheet with mapped columns.  
  - *Connections:* Input from 💬 Send Telegram Reply.  
  - *Version:* 4.2  
  - *Edge Cases:* Google Sheets API errors, formatting issues.  

---

#### 1.5 Escalation Logging

**Overview:**  
Records escalated messages requiring human agent attention into a dedicated Google Sheets log.

**Nodes Involved:**  
- Gmail Escalation Logger  
- Telegram Escalation Logger  

**Node Details:**  

Both nodes log escalation data to the "Customer_Inquiries" sheet in the same Google Sheets document used for the knowledge base and logs. They capture inquiry details when the AI agent flags the need for escalation.

- *Type:* Google Sheets Tool  
- *Configuration:* Append mode, specific sheet and document ID.  
- *Connections:* Inputs from respective AI Agents.  
- *Version:* 4.5  
- *Edge Cases:* Sheet permission issues, concurrent writes, data consistency.  

---

#### 1.6 Error Handling

**Overview:**  
Captures any errors during workflow execution, notifies the admin team via Slack webhook, and logs errors for debugging.

**Nodes Involved:**  
- 🚨 Error Trigger  
- 📢 Notify Admin of Error  
- ⚠️ Error Handling Info (sticky note)  

**Node Details:**

- **🚨 Error Trigger**  
  - *Type:* Error Trigger Node  
  - *Role:* Activated on any workflow error.  
  - *Connections:* Outputs to 📢 Notify Admin of Error.  
  - *Version:* 1  
  - *Edge Cases:* Failures in error notification itself.  

- **📢 Notify Admin of Error**  
  - *Type:* HTTP Request  
  - *Role:* Sends formatted Slack message with error details to admin Slack channel via webhook.  
  - *Configuration:* POST request with dynamic message including error message, node name, and timestamp.  
  - *Connections:* None (end node).  
  - *Version:* 4.2  
  - *Edge Cases:* Slack webhook downtime, network issues, invalid webhook URL.  

- **⚠️ Error Handling Info**  
  - *Type:* Sticky Note  
  - *Role:* Documents the error handling strategy for admins and maintainers.  

---

#### 1.7 Workflow Guide and Documentation

**Overview:**  
Provides comprehensive instructions, use cases, feature highlights, and setup guidance for users and maintainers.

**Nodes Involved:**  
- 📋 Workflow Guide (sticky note)  

**Node Details:**  
- *Type:* Sticky Note  
- *Role:* Explains who the workflow is for, problems solved, what it does, fixes applied, setup instructions, and tips for customization.  
- *Position:* Central visual anchor in the workflow canvas.  

---

### 3. Summary Table

| Node Name                    | Node Type                 | Functional Role                           | Input Node(s)                      | Output Node(s)                        | Sticky Note                                                                                                               |
|------------------------------|---------------------------|------------------------------------------|----------------------------------|-------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| 📧 Gmail Customer Inquiry Trigger | Gmail Trigger             | Watches Gmail inbox for new emails       |                                  | 📋 Process Gmail Message             |                                                                                                                           |
| 📋 Process Gmail Message       | Set                       | Extracts and formats Gmail message data | 📧 Gmail Customer Inquiry Trigger | 🤖 Gmail AI Agent                   |                                                                                                                           |
| 🤖 Gmail AI Agent              | LangChain Agent           | AI agent for Gmail queries                | 📋 Process Gmail Message           | 🧠 OpenAI Chat Model - Gmail, knowledge base, Gmail Memory, 📧 Send Gmail Reply, Gmail Escalation Logger |                                                                                                                           |
| 🧠 OpenAI Chat Model - Gmail   | LangChain OpenAI Model    | GPT model for Gmail AI agent              | 🤖 Gmail AI Agent                  | 🤖 Gmail AI Agent                   |                                                                                                                           |
| knowledge base                | Google Sheets Tool        | Provides knowledge base data for Gmail   |                                  | 🤖 Gmail AI Agent                   |                                                                                                                           |
| 🧠 Gmail Memory               | LangChain Memory Buffer   | Maintains Gmail conversation context     | 🤖 Gmail AI Agent                  | 🤖 Gmail AI Agent                   |                                                                                                                           |
| 📧 Send Gmail Reply            | Gmail                     | Sends AI reply email                      | 🤖 Gmail AI Agent                  | ✅ Mark Gmail as Read, 📊 Log Gmail Interaction |                                                                                                                           |
| ✅ Mark Gmail as Read          | Gmail                     | Marks email as read after reply           | 📧 Send Gmail Reply                |                                     |                                                                                                                           |
| 📊 Log Gmail Interaction       | Google Sheets             | Logs Gmail interactions                    | 📧 Send Gmail Reply                |                                     |                                                                                                                           |
| Gmail Escalation Logger       | Google Sheets Tool        | Logs escalated Gmail inquiries             | 🤖 Gmail AI Agent                  |                                     |                                                                                                                           |
| 💬 Telegram Customer Message Trigger | Telegram Trigger          | Watches Telegram for new messages          |                                  | 📋 Process Telegram Message         |                                                                                                                           |
| 📋 Process Telegram Message    | Set                       | Extracts Telegram message details          | 💬 Telegram Customer Message Trigger | 🤖 Telegram AI Agent               |                                                                                                                           |
| 🤖 Telegram AI Agent           | LangChain Agent           | AI agent for Telegram queries              | 📋 Process Telegram Message        | 🧠 OpenAI Chat Model - Telegram, knowledge base1, Telegram Memory, 💬 Send Telegram Reply, Telegram Escalation Logger |                                                                                                                           |
| 🧠 OpenAI Chat Model - Telegram | LangChain OpenAI Model    | GPT model for Telegram AI agent            | 🤖 Telegram AI Agent               | 🤖 Telegram AI Agent               |                                                                                                                           |
| knowledge base1               | Google Sheets Tool        | Provides knowledge base data for Telegram |                                  | 🤖 Telegram AI Agent               |                                                                                                                           |
| 🧠 Telegram Memory            | LangChain Memory Buffer   | Maintains Telegram conversation context   | 🤖 Telegram AI Agent               | 🤖 Telegram AI Agent               |                                                                                                                           |
| 💬 Send Telegram Reply         | Telegram                  | Sends AI reply message on Telegram         | 🤖 Telegram AI Agent               | 📊 Log Telegram Interaction         |                                                                                                                           |
| 📊 Log Telegram Interaction    | Google Sheets             | Logs Telegram interactions                  | 💬 Send Telegram Reply             |                                     |                                                                                                                           |
| Telegram Escalation Logger    | Google Sheets Tool        | Logs escalated Telegram inquiries           | 🤖 Telegram AI Agent               |                                     |                                                                                                                           |
| 🚨 Error Trigger              | Error Trigger             | Captures workflow errors                    |                                  | 📢 Notify Admin of Error             |                                                                                                                           |
| 📢 Notify Admin of Error       | HTTP Request              | Sends Slack notification on errors          | 🚨 Error Trigger                  |                                     |                                                                                                                           |
| 📋 Workflow Guide             | Sticky Note               | Documentation and setup instructions        |                                  |                                     | **Workflow Guide:** Purpose, setup, fixes, customization tips.                                                             |
| ⚠️ Error Handling Info        | Sticky Note               | Explains error handling strategy             |                                  |                                     | **Error Handling:** Captures errors, notifies admin, logs for debugging, fallback responses.                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the workflow and add credentials:**  
   - Configure Gmail OAuth2 credentials with sufficient scopes to read inbox, send emails, and mark as read.  
   - Configure Telegram bot token credentials with permissions to receive and send messages.  
   - Configure OpenAI API key credentials.  
   - Configure Google Sheets OAuth2 credentials with read/write access to the knowledge base and log sheets.  
   - Prepare Google Sheets documents:  
     - "Knowledge_Base" sheet for FAQs and info.  
     - "AI_Responses" sheet for logging AI replies.  
     - "Customer_Inquiries" sheet for escalation logging.

2. **Input Reception Nodes:**  
   - Add **Gmail Customer Inquiry Trigger** node:  
     - Set filters to `INBOX` and `CATEGORY_PERSONAL`, readStatus = unread.  
     - Poll every minute.  
   - Add **Telegram Customer Message Trigger** node:  
     - Set to listen to "message" updates.  
     - Link to Telegram bot credentials.

3. **Message Processing Nodes:**  
   - Add **Process Gmail Message** (Set node):  
     - Extract customer email from `From` header using regex.  
     - Extract customer name from `From` field text.  
     - Extract subject, message content (`text` or `snippet`), message ID, thread ID.  
     - Assign channel = "gmail".  
   - Add **Process Telegram Message** (Set node):  
     - Extract customer name from Telegram message `from.first_name` and `from.last_name`.  
     - Extract customer ID, chat ID, message content, message ID.  
     - Assign channel = "telegram" and subject = "Customer Support Inquiry".

4. **AI Processing Nodes:**  
   For Gmail channel:  
   - Add **Gmail Memory** (LangChain Memory Buffer Window):  
     - Session key: `gmail_{{ $json.customer_email }}`  
   - Add **knowledge base** (Google Sheets Tool):  
     - Configure to read "Knowledge_Base" sheet from Google Sheets document.  
   - Add **OpenAI Chat Model - Gmail** (LangChain OpenAI Chat Model):  
     - maxTokens=1000, temperature=0.3.  
   - Add **Gmail AI Agent** (LangChain Agent):  
     - Input: message_content from processed Gmail node.  
     - System prompt tailored for email support (empathetic, clear, escalation rules).  
     - Link AI Tool: knowledge base.  
     - Link AI Memory: Gmail Memory.  
     - Link AI Language Model: OpenAI Chat Model - Gmail.  

   For Telegram channel:  
   - Add **Telegram Memory** (LangChain Memory Buffer Window):  
     - Session key: `telegram_{{ $json.customer_id }}`  
   - Add **knowledge base1** (Google Sheets Tool):  
     - Same as knowledge base but linked for Telegram AI Agent.  
   - Add **OpenAI Chat Model - Telegram** (LangChain OpenAI Chat Model):  
     - maxTokens=100, temperature=0.3.  
   - Add **Telegram AI Agent** (LangChain Agent):  
     - Input: message_content from processed Telegram node.  
     - System prompt tailored for Telegram support.  
     - Link AI Tool: knowledge base1.  
     - Link AI Memory: Telegram Memory.  
     - Link AI Language Model: OpenAI Chat Model - Telegram.

5. **Reply Dispatch and Logging Nodes:**  
   For Gmail:  
   - Add **Send Gmail Reply** node:  
     - Message: AI Agent output.  
     - Reply to original message using message_id.  
     - replyToSenderOnly enabled.  
   - Add **Mark Gmail as Read** node:  
     - Mark original message as read using message_id.  
   - Add **Log Gmail Interaction** node (Google Sheets):  
     - Append to "AI_Responses" sheet.  
     - Map fields: Timestamp, Channel="Email", Customer_Name, Customer_Contact, Inquiry_Subject, Customer_Message, AI_Response, Response_Time, Status="Completed".  

   For Telegram:  
   - Add **Send Telegram Reply** node:  
     - Send text from AI Agent output.  
     - Use chat_id and reply_to_message_id for threading.  
     - Parse mode Markdown.  
   - Add **Log Telegram Interaction** node (Google Sheets):  
     - Append to "AI_Responses" sheet with similar fields, Channel dynamically set to "telegram".  

6. **Escalation Logging Nodes:**  
   - Add **Gmail Escalation Logger** (Google Sheets Tool):  
     - Append escalation data to "Customer_Inquiries" sheet.  
     - Connect as AI Tool output to Gmail AI Agent.  
   - Add **Telegram Escalation Logger** (Google Sheets Tool):  
     - Append escalation data similarly for Telegram AI Agent.  

7. **Error Handling Setup:**  
   - Add **Error Trigger** node to catch workflow errors.  
   - Add **Notify Admin of Error** node (HTTP Request):  
     - POST to Slack webhook URL.  
     - Compose message with error details and timestamp.  
   - Connect Error Trigger output to Notify Admin of Error.  

8. **Documentation:**  
   - Add **Workflow Guide** sticky note with setup, purpose, and customization info.  
   - Add **Error Handling Info** sticky note describing error strategy.  

9. **Finalize Connections:**  
   - Connect triggers to process nodes.  
   - Process nodes to AI agents.  
   - AI agents to language models, memory, knowledge bases, and escalation loggers.  
   - AI agents to reply nodes.  
   - Reply nodes to logging and marking nodes.  
   - Ensure error trigger is set globally.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                   | Context or Link                                                                                                           |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| Workflow is designed for multi-channel customer support automation using Gmail, Telegram, and GPT AI.                                                                                                                        | Workflow purpose and use case.                                                                                            |
| Setup requires OAuth2 credentials for Gmail and Google Sheets, Telegram Bot token, and OpenAI API key.                                                                                                                        | Credential configuration instructions.                                                                                   |
| Knowledge base must be maintained in a Google Sheets document accessible by the workflow.                                                                                                                                     | Google Sheets setup for knowledge base and logs.                                                                          |
| Slack webhook URL must be configured for real-time error notifications to admins.                                                                                                                                              | Error handling and admin alerting.                                                                                        |
| The workflow separates Gmail and Telegram message processing paths with dedicated AI agents and conversation memory to maintain context.                                                                                    | Design principle to handle channel-specific nuances.                                                                      |
| The AI prompts include instructions for empathy, escalation, and brand voice consistency for professional customer support.                                                                                                  | AI behavior customization.                                                                                                |
| For customization, update knowledge base FAQs, adjust AI system prompts, and add new communication channels as needed.                                                                                                        | Workflow extensibility.                                                                                                   |
| Reference Google Sheets document link: https://docs.google.com/spreadsheets/d/1rEZ1A0Gd5ejT_b2F5tcYy9Xk4i0JvTrjss_oolf6WD8                                                                                                   | Primary knowledge base and logging spreadsheet.                                                                           |
| Slack webhook example placeholder: https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK                                                                                                                                        | Replace with your actual Slack webhook URL for notifications.                                                            |
| Sticky notes in the workflow provide detailed documentation and error handling insights to aid maintainers.                                                                                                                   | Inline documentation.                                                                                                     |

---

**Disclaimer:** The provided text is derived exclusively from an n8n automated workflow. It strictly complies with applicable content policies and contains no illegal, offensive, or protected material. All handled data is legal and public.