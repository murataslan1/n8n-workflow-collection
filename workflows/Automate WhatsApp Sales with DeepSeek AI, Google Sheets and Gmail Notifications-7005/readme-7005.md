Automate WhatsApp Sales with DeepSeek AI, Google Sheets and Gmail Notifications

https://n8nworkflows.xyz/workflows/automate-whatsapp-sales-with-deepseek-ai--google-sheets-and-gmail-notifications-7005


# Automate WhatsApp Sales with DeepSeek AI, Google Sheets and Gmail Notifications

### 1. Workflow Overview

This workflow is designed to automate WhatsApp sales interactions using AI-powered conversational logic combined with Google Sheets data lookup and Gmail notifications. It targets ecommerce teams and sales representatives who want to efficiently manage customer inquiries on WhatsApp, provide instant, data-driven replies in Saudi dialect, and seamlessly hand off qualified purchase requests to customer service via email.

The workflow is divided into the following logical blocks:

- **1.1 Input Reception:** Listens for incoming WhatsApp messages via a webhook and filters to process only relevant messages (non-group, inbound).
- **1.2 AI Processing and Memory:** Uses a LangChain AI Agent with DeepSeek Chat Model and Postgres-backed chat memory to generate context-aware replies referencing product data from Google Sheets.
- **1.3 Google Sheets Data Lookup:** Retrieves product information from a configured Google Sheet to inform AI responses.
- **1.4 Response Dispatch:** Sends AI-generated replies back to the customer on WhatsApp.
- **1.5 Sales Notification:** Sends an email notification to customer service when the customer indicates an intent to purchase, including key customer details collected during the conversation.
- **1.6 Control Flow:** Handles message filtering and no-operation paths for irrelevant messages.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Input Reception

- **Overview:**  
Receives WhatsApp messages from customers via webhook and filters only inbound, non-group messages for processing.

- **Nodes Involved:**  
  - Webhook: WhatsApp Message Trigger  
  - If message not from group and not outbound  
  - No Operation, do nothing

- **Node Details:**

  - **Webhook: WhatsApp Message Trigger**  
    - *Type:* Webhook  
    - *Role:* Entry point to receive inbound WhatsApp messages via HTTP POST at `/whatsAppListen` path.  
    - *Configuration:* HTTP POST method, no authentication specified.  
    - *Input/Output:* Outputs the JSON payload of the incoming message.  
    - *Edge Cases:* Webhook downtime or invalid payload formats might cause failure.  
    - *Notes:* Critical to have the webhook URL configured correctly on WhatsApp integration.

  - **If message not from group and not outbound**  
    - *Type:* If node (conditional filter)  
    - *Role:* Filters messages to only allow those that are inbound (not sent by self) and not from WhatsApp groups (no `@g.us` in remoteJid).  
    - *Configuration:*  
      - Checks `body.data.key.fromMe` equals false (inbound)  
      - Checks `body.data.key.remoteJid` does **not** include "@g.us" (not group)  
    - *Input:* From Webhook node  
    - *Output:*  
      - True branch leads to AI processing  
      - False branch leads to No Operation node  
    - *Edge Cases:* If message JSON structure changes, the expressions may fail.

  - **No Operation, do nothing**  
    - *Type:* NoOp node  
    - *Role:* Ends the workflow path silently for filtered-out messages.  
    - *Configuration:* Default, does nothing.  
    - *Input:* From If node false branch  
    - *Output:* None  

---

#### 2.2 AI Processing and Memory

- **Overview:**  
Processes the incoming customer message using a LangChain AI Agent with DeepSeek Chat Model. It uses chat memory stored in Postgres to keep context, and the AI answers based on Google Sheets data.

- **Nodes Involved:**  
  - DeepSeek Chat Model  
  - Chat Memory with Postgres  
  - AI Agent

- **Node Details:**

  - **DeepSeek Chat Model**  
    - *Type:* LangChain Chat Model (DeepSeek)  
    - *Role:* Provides language generation capabilities to the AI Agent.  
    - *Configuration:* Uses DeepSeek API credentials; options default.  
    - *Input:* Connected as AI language model input to AI Agent.  
    - *Edge Cases:* API errors, rate limits, or invalid credentials could cause failures.

  - **Chat Memory with Postgres**  
    - *Type:* LangChain Memory (Postgres Chat)  
    - *Role:* Maintains conversational context keyed by WhatsApp `remoteJid` to provide continuity in chat sessions.  
    - *Configuration:*  
      - Session key uses incoming message's `remoteJid` as unique identifier.  
      - Context window length set to 1000 tokens.  
    - *Input:* Connected as AI memory input to AI Agent.  
    - *Edge Cases:* Database connection errors, session key not found, or memory overflow could affect context.

  - **AI Agent**  
    - *Type:* LangChain Agent  
    - *Role:* Core processing node that receives user input, references Google Sheets data, applies system instructions, and produces AI-generated replies.  
    - *Configuration:*  
      - Input text extracted from incoming WhatsApp message conversation.  
      - System message instructs the AI to:  
        - Represent company X as Ahmed, speak in Saudi dialect, greet with "هلا وغلا"  
        - Use only information from Google Sheets  
        - Collect customer name, phone (Saudi 10-digit starting with 05), delivery/pickup date before sending email  
        - Send email notification only when customer requests purchase  
      - Prompt type set to "define" with above instructions.  
    - *Input:* Receives from If node true branch and AI language model, memory, and Google Sheets tool.  
    - *Output:* Connects to WhatsApp message sending and Gmail email nodes.  
    - *Edge Cases:* Expression failures, missing data, or AI model errors could cause incomplete or incorrect replies.

---

#### 2.3 Google Sheets Data Lookup

- **Overview:**  
Retrieves product information from a specified Google Sheet to supply the AI agent with relevant product data.

- **Nodes Involved:**  
  - Get row(s) in sheet in Google Sheets

- **Node Details:**

  - **Get row(s) in sheet in Google Sheets**  
    - *Type:* Google Sheets Tool  
    - *Role:* Queries the Google Sheet document to fetch product data for AI reference.  
    - *Configuration:*  
      - Document ID points to the company’s product sheet  
      - Sheet name specified to "Sheet1" (gid=0)  
      - No filters or queries specified, implying full sheet or default data retrieval.  
    - *Credentials:* Google Sheets OAuth2 configured with appropriate scopes.  
    - *Input:* Connected as AI tool input to AI Agent.  
    - *Edge Cases:* API quota limits, invalid sheet ID, or permission errors.

---

#### 2.4 Response Dispatch

- **Overview:**  
Sends the AI-generated text message back to the customer’s WhatsApp number using an Evolution API node.

- **Nodes Involved:**  
  - Enviar texto

- **Node Details:**

  - **Enviar texto**  
    - *Type:* Evolution API (messages-api)  
    - *Role:* Sends WhatsApp message text to the customer.  
    - *Configuration:*  
      - `remoteJid` dynamically set from incoming WhatsApp message `remoteJid` to target correct user.  
      - Message text taken from AI Agent's output JSON property `$json.output`.  
      - Instance name configured for WhatsApp Evolution API.  
    - *Credentials:* Evolution API credentials configured.  
    - *Input:* Connected as main output from AI Agent.  
    - *Edge Cases:* API connectivity issues, invalid remoteJid formatting, or authentication failure.

---

#### 2.5 Sales Notification

- **Overview:**  
Sends an email notification to the customer service team when the customer requests to purchase an item, including customer details collected during conversation.

- **Nodes Involved:**  
  - Send a message in Gmail

- **Node Details:**

  - **Send a message in Gmail**  
    - *Type:* Gmail Tool (send email)  
    - *Role:* Sends an email notification to a fixed "Customer Service Email" address.  
    - *Configuration:*  
      - Recipient: Customer Service Email (hardcoded or from credentials/config)  
      - Subject: "New Purchase Request"  
      - Message body dynamically generated by AI Agent override output (`$fromAI('Message', '', 'string')`)  
      - Email type is plain text, no attribution appended.  
    - *Credentials:* OAuth2 Gmail credentials configured.  
    - *Input:* Connected as AI tool output from AI Agent.  
    - *Edge Cases:* OAuth token expiration, rate limiting, or invalid email address.

---

### 3. Summary Table

| Node Name                         | Node Type                          | Functional Role                          | Input Node(s)                     | Output Node(s)              | Sticky Note                                                                                                                                |
|----------------------------------|----------------------------------|----------------------------------------|----------------------------------|-----------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| Webhook: WhatsApp Message Trigger| Webhook                          | Receive inbound WhatsApp messages      | -                                | If message not from group and not outbound |                                                                                                                                            |
| If message not from group and not outbound | If node                     | Filter inbound, non-group WhatsApp messages | Webhook: WhatsApp Message Trigger | AI Agent (true), No Operation (false)    |                                                                                                                                            |
| No Operation, do nothing          | NoOp                            | End path for filtered-out messages     | If message not from group and not outbound | -                           |                                                                                                                                            |
| DeepSeek Chat Model               | LangChain Chat Model             | AI language model for generating replies| -                                | AI Agent                    |                                                                                                                                            |
| Chat Memory with Postgres         | LangChain Memory (Postgres)      | Stores and retrieves chat context      | -                                | AI Agent                    |                                                                                                                                            |
| AI Agent                         | LangChain Agent                 | Core AI processing and decision making | If message not from group and not outbound (true), DeepSeek Chat Model, Chat Memory with Postgres, Get row(s) in sheet in Google Sheets | Enviar texto (main), Send a message in Gmail (ai_tool) |                                                                                                                                            |
| Get row(s) in sheet in Google Sheets | Google Sheets Tool             | Retrieve product info from Google Sheet| -                                | AI Agent                    |                                                                                                                                            |
| Enviar texto                    | Evolution API                   | Send WhatsApp reply message             | AI Agent                        | -                           |                                                                                                                                            |
| Send a message in Gmail           | Gmail Tool                     | Send purchase notification email       | AI Agent                        | -                           |                                                                                                                                            |
| Sticky Note                     | Sticky Note                    | Documentation                          | -                                | -                           | ## 🚀 AI-Powered WhatsApp Seller Bot with Google Sheets Lookup  This workflow: - **Listens** for inbound WhatsApp messages via webhook  - **Uses** a LangChain AI Agent (DeepSeek) to answer in Saudi dialect, sourcing product info from Google Sheets  - **Welcomes** customers with “هلا وغلا” and collects name, phone, and delivery/pickup details  - **Prompts** an email notification to your service rep only when the customer is ready to purchase  - **Ensures** every conversation stays tied to your sales process without missing a lead  Ideal for ecommerce teams who want instant, data-driven replies and seamless handoff to sales staff. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook to Receive WhatsApp Messages**  
   - Add a **Webhook** node named `Webhook: WhatsApp Message Trigger`.  
   - Set HTTP Method to `POST`.  
   - Set path to `whatsAppListen`.  
   - No authentication needed (adjust as per security).  

2. **Add Conditional Filter for Incoming Messages**  
   - Add an **If** node `If message not from group and not outbound`.  
   - Connect `Webhook: WhatsApp Message Trigger` main output to this node.  
   - Set conditions:  
     - `$json.body.data.key.fromMe == false` (message is inbound)  
     - `$json.body.data.key.remoteJid` does **not** include `"@g.us"` (not group).  
   - Connect **True** output to AI processing block.  
   - Connect **False** output to no operation node.

3. **Add No Operation Node for Ignored Messages**  
   - Add **No Operation** node `No Operation, do nothing`.  
   - Connect from False output of the If node.

4. **Set Up DeepSeek Chat Model Node**  
   - Add `DeepSeek Chat Model` node.  
   - Provide DeepSeek API credentials.  
   - Leave options default.

5. **Configure Postgres Chat Memory Node**  
   - Add `Chat Memory with Postgres` node.  
   - Set `sessionKey` to expression: `{{$json.body.data.key.remoteJid}}` (unique chat session).  
   - Set `sessionIdType` to `customKey`.  
   - Set `contextWindowLength` to `1000`.  
   - Connect Postgres credentials.

6. **Add Google Sheets Lookup Node**  
   - Add `Get row(s) in sheet in Google Sheets` node.  
   - Configure with your Google Sheets OAuth2 credentials.  
   - Set `documentId` to your Google Sheet ID containing product data.  
   - Set `sheetName` to `"Sheet1"` (or your specific tab).  
   - No filters needed if you want to provide full sheet data to AI.

7. **Add AI Agent Node**  
   - Add `AI Agent` node.  
   - Configure input text as expression: `={{ $json.body.data.message.conversation }}` (incoming customer message).  
   - Configure system message with instructions:  
     - Identify as "Ahmed" from X company.  
     - Speak in Saudi dialect, greet with "هلا وغلا".  
     - Use only Google Sheets data for answers.  
     - Collect customer name, phone (10 digits starting with 05), delivery/pickup date before purchase.  
     - Only send email notification if purchase requested.  
   - Connect AI language model input from `DeepSeek Chat Model`.  
   - Connect AI memory from `Chat Memory with Postgres`.  
   - Connect AI tool input from `Get row(s) in sheet in Google Sheets`.  
   - Connect main input from the If node True output.

8. **Add WhatsApp Message Sending Node**  
   - Add `Enviar texto` node (Evolution API).  
   - Configure with Evolution API credentials.  
   - Set `remoteJid` dynamically: `={{ $('Webhook: WhatsApp Message Trigger').item.json.body.data.key.remoteJid }}`  
   - Set `messageText` to `={{ $json.output }}` (AI Agent’s output).  
   - Connect main output from AI Agent node.

9. **Add Gmail Notification Node**  
   - Add `Send a message in Gmail` node.  
   - Configure Gmail OAuth2 credentials.  
   - Set `sendTo` to your Customer Service Email address.  
   - Set `subject` to `"New Purchase Request"`.  
   - Set `message` body to AI Agent override output: `={{ $fromAI('Message', '', 'string') }}`.  
   - Set email type to `"text"`.  
   - Connect ai_tool output from AI Agent node.

10. **Arrange connections**  
    - Webhook → If condition  
    - If True → AI Agent  
    - AI Agent main output → Enviar texto  
    - AI Agent ai_tool output → Send a message in Gmail  
    - If False → No Operation  

11. **Test workflow**  
    - Send test WhatsApp message (non-group inbound).  
    - Verify AI response sent back on WhatsApp.  
    - Verify email sent to customer service on purchase intent.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                  | Context or Link                                  |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------|
| The workflow welcomes customers with "هلا وغلا" and strictly uses product info from the Google Sheet to ensure consistent, brand-aligned replies in Saudi dialect.            | Sticky Note content in workflow                  |
| Ideal for ecommerce teams seeking automated, context-aware WhatsApp sales interactions with seamless handoff to human sales representatives.                                 | Sticky Note content in workflow                  |
| DeepSeek API and Evolution API credentials require setup with valid accounts; ensure API keys and OAuth tokens are securely stored and refreshed as needed.                  | Credential setup notes                           |
| Google Sheets document must be shared with the OAuth2 service account or user to allow read access for data lookup.                                                         | Google Sheets OAuth2 setup                       |
| Gmail OAuth2 credentials must have send email permission and be authorized for the configured account.                                                                        | Gmail OAuth2 setup                               |
| Postgres database must be accessible with proper credentials; used to maintain chat memory for context-aware conversations.                                                  | Postgres credential and database setup          |

---

**Disclaimer:** The provided description and analysis are based exclusively on an n8n workflow automation exported as JSON. All data processed via this workflow complies fully with legal and content policies. No illegal, offensive, or protected content is involved.