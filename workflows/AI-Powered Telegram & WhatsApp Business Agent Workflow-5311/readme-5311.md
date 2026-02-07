AI-Powered Telegram & WhatsApp Business Agent Workflow

https://n8nworkflows.xyz/workflows/ai-powered-telegram---whatsapp-business-agent-workflow-5311


# AI-Powered Telegram & WhatsApp Business Agent Workflow

### 1. Workflow Overview

This workflow is an AI-powered customer service agent designed to automate interactions on Telegram and WhatsApp Business platforms. It receives incoming messages from users on either platform, normalizes and enriches the message data with customer history, then uses an AI assistant (OpenAI) to generate contextual responses. The responses are routed back to the correct messaging platform (Telegram or WhatsApp), logged, and customer records are updated accordingly. It also includes escalation checks to notify support teams if needed.

**Logical blocks:**

- **1.1 Input Reception:** Receives incoming messages from Telegram and WhatsApp via webhook triggers.
- **1.2 Message Normalization:** Standardizes message data to a common format for processing.
- **1.3 Customer Data Enrichment:** Retrieves customer history from Google Sheets to build conversational context.
- **1.4 AI Processing:** Uses code to build context, calls OpenAI for response generation, and processes AI replies.
- **1.5 Response Routing & Delivery:** Routes the AI response to the appropriate platform and sends the message.
- **1.6 Logging & Customer Data Update:** Logs conversations and updates customer records in Google Sheets.
- **1.7 Escalation Handling:** Checks if the conversation requires escalation and notifies the support team.
- **1.8 Webhook Final Response:** Sends the final HTTP response to close the webhook requests.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
Captures incoming messages from Telegram and WhatsApp Business via their respective webhook triggers.

**Nodes Involved:**  
- Telegram Bot  
- WhatsApp Webhook

**Node Details:**

- **Telegram Bot**  
  - Type: Telegram Trigger  
  - Role: Listens for incoming messages/events on Telegram Bot API.  
  - Configuration: Uses webhook with ID "telegram-ai-agent".  
  - Inputs: External Telegram platform messages.  
  - Outputs: Forwards message data to normalization.  
  - Edge Cases: Telegram API downtime, webhook misconfiguration, message format variations.

- **WhatsApp Webhook**  
  - Type: Webhook  
  - Role: Receives WhatsApp Business messages via custom webhook endpoint.  
  - Configuration: Webhook ID "whatsapp-ai-webhook".  
  - Inputs: HTTP POST requests from WhatsApp Business API.  
  - Outputs: Passes raw message data downstream.  
  - Edge Cases: Webhook endpoint availability, message payload inconsistencies, auth validation if implemented outside workflow.

---

#### 1.2 Message Normalization

**Overview:**  
Transforms different incoming message formats into a unified data structure for consistent processing.

**Nodes Involved:**  
- Normalize Message Data

**Node Details:**

- **Normalize Message Data**  
  - Type: Set node  
  - Role: Maps and standardizes fields such as sender ID, message text, timestamp, and platform.  
  - Configuration: Uses expressions to extract and unify data fields from Telegram or WhatsApp payloads.  
  - Inputs: Raw messages from Telegram Bot and WhatsApp Webhook nodes.  
  - Outputs: Sends normalized data to retrieve customer history.  
  - Edge Cases: Unexpected message content formats, missing fields, unsupported message types.

---

#### 1.3 Customer Data Enrichment

**Overview:**  
Fetches previous interaction history and customer details from Google Sheets to provide context for AI processing.

**Nodes Involved:**  
- Get Customer History

**Node Details:**

- **Get Customer History**  
  - Type: Google Sheets  
  - Role: Queries a Google Sheets document to retrieve stored conversation history and customer metadata.  
  - Configuration: Reads based on sender ID or unique customer key extracted in normalization.  
  - Inputs: Normalized message data.  
  - Outputs: Passes combined data (message + history) for context building.  
  - Edge Cases: Google API rate limits, missing or inconsistent customer records, access permission errors.

---

#### 1.4 AI Processing

**Overview:**  
Builds an AI context from customer data and message, calls OpenAI API to generate a response, and processes AI output.

**Nodes Involved:**  
- Build AI Context  
- AI Business Assistant  
- Process AI Response

**Node Details:**

- **Build AI Context**  
  - Type: Code (JavaScript)  
  - Role: Constructs a prompt for the AI model incorporating customer history, current message, and any business rules.  
  - Configuration: Custom code to concatenate and format context strings, handle edge cases like empty history.  
  - Inputs: Customer data and normalized message.  
  - Outputs: AI prompt string to OpenAI node.  
  - Edge Cases: Script errors, empty or malformed inputs, prompt size exceeding limits.

- **AI Business Assistant**  
  - Type: OpenAI  
  - Role: Sends prompt to OpenAI GPT model to generate natural language response.  
  - Configuration: Uses appropriate OpenAI credentials, likely GPT-4 or GPT-3.5, with tuned parameters (temperature, max tokens).  
  - Inputs: Prompt from Build AI Context.  
  - Outputs: Raw AI-generated text.  
  - Edge Cases: API timeouts, quota exceeded, malformed prompts, network errors.

- **Process AI Response**  
  - Type: Code (JavaScript)  
  - Role: Parses and formats the AI response to prepare for platform-specific delivery.  
  - Configuration: Extracts text, handles multiline replies, inserts dynamic variables if needed.  
  - Inputs: AI response text.  
  - Outputs: Structured message payload for routing.  
  - Edge Cases: Unexpected AI output format, empty responses.

---

#### 1.5 Response Routing & Delivery

**Overview:**  
Determines the message platform and sends the AI response via the corresponding API.

**Nodes Involved:**  
- Platform Router  
- Send Telegram Message  
- Send WhatsApp Message

**Node Details:**

- **Platform Router**  
  - Type: If node  
  - Role: Evaluates message source platform (Telegram or WhatsApp) to route response accordingly.  
  - Configuration: Conditions based on normalized platform field.  
  - Inputs: Processed AI response with platform metadata.  
  - Outputs: Directs flow to Send Telegram or Send WhatsApp nodes.  
  - Edge Cases: Unknown platform identifiers, missing metadata.

- **Send Telegram Message**  
  - Type: Telegram  
  - Role: Sends message back to Telegram user via bot API.  
  - Configuration: Uses Telegram credentials linked to bot, message text from Process AI Response, recipient ID.  
  - Inputs: Routed from Platform Router.  
  - Outputs: Confirmation of message sent, passed to logging.  
  - Edge Cases: Telegram rate limits, invalid chat IDs, message formatting issues.

- **Send WhatsApp Message**  
  - Type: HTTP Request  
  - Role: Sends message via WhatsApp Business API using HTTP POST.  
  - Configuration: HTTP request configured for WhatsApp API endpoint, with authentication headers and JSON body containing recipient and message.  
  - Inputs: Routed from Platform Router.  
  - Outputs: API response for logging.  
  - Edge Cases: WhatsApp API errors, authentication failure, invalid payload.

---

#### 1.6 Logging & Customer Data Update

**Overview:**  
Logs the conversation details and updates customer records in Google Sheets to keep track of interactions.

**Nodes Involved:**  
- Log Conversation  
- Update Customer Record

**Node Details:**

- **Log Conversation**  
  - Type: Google Sheets  
  - Role: Appends the conversation entry (incoming message + AI reply) to a Google Sheet log.  
  - Configuration: Writes timestamp, user ID, message contents, platform.  
  - Inputs: Confirmation from message sending nodes.  
  - Outputs: Triggers update to customer record.  
  - Edge Cases: Google Sheets API limits, data format issues.

- **Update Customer Record**  
  - Type: Google Sheets  
  - Role: Updates or inserts customer metadata or last interaction details in a master customer sheet.  
  - Configuration: Matches customer by ID, updates last message date, status, or flags.  
  - Inputs: From Log Conversation node.  
  - Outputs: Leads to webhook final response node.  
  - Edge Cases: Concurrency issues, data overwrites, permission errors.

---

#### 1.7 Escalation Handling

**Overview:**  
Checks if conversation requires escalation (e.g., specific keywords or AI flags) and notifies support team via HTTP request.

**Nodes Involved:**  
- Check Escalation  
- Notify Support Team

**Node Details:**

- **Check Escalation**  
  - Type: If node  
  - Role: Evaluates conditions on AI response or message content to determine if escalation is needed.  
  - Configuration: Custom expressions checking for escalation triggers.  
  - Inputs: Process AI Response output.  
  - Outputs: Yes branch triggers notification; No branch continues normal flow.  
  - Edge Cases: False positives/negatives, missing criteria.

- **Notify Support Team**  
  - Type: HTTP Request  
  - Role: Sends notification (e.g., to Slack, email API, or internal system) alerting human agents of escalation need.  
  - Configuration: HTTP POST with appropriate headers and payload.  
  - Inputs: From Check Escalation node’s true branch.  
  - Outputs: None (side effect).  
  - Edge Cases: Notification failures, endpoint unavailability.

---

#### 1.8 Webhook Final Response

**Overview:**  
Sends the final HTTP response back to the WhatsApp webhook request to acknowledge receipt and processing.

**Nodes Involved:**  
- Webhook Response

**Node Details:**

- **Webhook Response**  
  - Type: Respond to Webhook  
  - Role: Sends HTTP 200 or appropriate status to confirm successful processing of incoming WhatsApp message.  
  - Configuration: Usually empty JSON or standard success message.  
  - Inputs: From Update Customer Record node.  
  - Outputs: Ends workflow execution for the WhatsApp trigger.  
  - Edge Cases: Delay in response causing webhook timeout, malformed responses.

---

### 3. Summary Table

| Node Name              | Node Type             | Functional Role                   | Input Node(s)          | Output Node(s)                         | Sticky Note                        |
|------------------------|-----------------------|---------------------------------|-----------------------|--------------------------------------|----------------------------------|
| intro_sticky           | Sticky Note           | Informative/organizational note |                       |                                      |                                  |
| telegram_trigger       | Telegram Trigger      | Incoming Telegram messages       |                       | normalize_message                    |                                  |
| whatsapp_webhook       | Webhook               | Incoming WhatsApp messages       |                       | normalize_message                    |                                  |
| normalize_message      | Set                   | Normalize incoming message data  | telegram_trigger, whatsapp_webhook | get_customer_data                |                                  |
| processing_sticky      | Sticky Note           | Informative/organizational note  |                       |                                      |                                  |
| get_customer_data      | Google Sheets         | Retrieve customer history        | normalize_message      | build_context                       |                                  |
| build_context          | Code                  | Build AI prompt context          | get_customer_data      | ai_assistant                       |                                  |
| intelligence_sticky    | Sticky Note           | Informative/organizational note  |                       |                                      |                                  |
| ai_assistant           | OpenAI                | Generate AI response             | build_context          | process_response                   |                                  |
| ai_sticky              | Sticky Note           | Informative/organizational note  |                       |                                      |                                  |
| process_response       | Code                  | Process AI output for delivery   | ai_assistant           | platform_router, check_escalation  |                                  |
| platform_router        | If                    | Route response to platform       | process_response       | send_telegram, send_whatsapp       |                                  |
| send_telegram          | Telegram              | Send message to Telegram         | platform_router        | log_conversation                   |                                  |
| send_whatsapp          | HTTP Request          | Send message to WhatsApp         | platform_router        | log_conversation                   |                                  |
| delivery_sticky        | Sticky Note           | Informative/organizational note  |                       |                                      |                                  |
| log_conversation       | Google Sheets         | Log conversation details         | send_telegram, send_whatsapp | update_customer                  |                                  |
| update_customer        | Google Sheets         | Update customer record           | log_conversation       | webhook_response                  |                                  |
| check_escalation       | If                    | Check if conversation escalates | process_response       | notify_team (true branch), (false branch no output) |                                  |
| notify_team            | HTTP Request          | Notify support team              | check_escalation (true)|                                      |                                  |
| analytics_sticky       | Sticky Note           | Informative/organizational note  |                       |                                      |                                  |
| webhook_response       | Respond to Webhook    | Final HTTP response to WhatsApp  | update_customer        |                                      |                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Configure webhook with ID "telegram-ai-agent"  
   - No additional parameters needed; set up Telegram Bot credentials in n8n credentials manager.

2. **Create WhatsApp Webhook Node**  
   - Type: Webhook  
   - Configure webhook with ID "whatsapp-ai-webhook"  
   - Set method to POST; no authentication by default but ensure secure endpoint externally.

3. **Create Normalize Message Data Node**  
   - Type: Set  
   - Connect both Telegram Trigger and WhatsApp Webhook outputs to this node.  
   - Configure to extract and unify fields like:  
     - senderId (from Telegram chat.id or WhatsApp sender)  
     - messageText (actual text content)  
     - timestamp  
     - platform (set as "telegram" or "whatsapp" based on source)

4. **Create Get Customer History Node**  
   - Type: Google Sheets  
   - Configure to read rows filtering by senderId  
   - Use Google Sheets credentials with access to customer history sheet.

5. **Create Build AI Context Node**  
   - Type: Code (JavaScript)  
   - Input: normalized message + customer history  
   - Build prompt by concatenating historical messages and current input in a conversational format suitable for OpenAI.

6. **Create AI Business Assistant Node**  
   - Type: OpenAI  
   - Use OpenAI credentials with appropriate API key.  
   - Model: GPT-4 or GPT-3.5  
   - Input prompt from previous code node  
   - Tune parameters (temperature ~0.7, max tokens ~500)

7. **Create Process AI Response Node**  
   - Type: Code (JavaScript)  
   - Parse OpenAI response JSON or text output  
   - Format for delivery: plain text or platform-specific formatting if needed.

8. **Create Platform Router Node**  
   - Type: If  
   - Condition: Check if platform field equals "telegram"  
   - True branch connects to Send Telegram Message  
   - False branch connects to Send WhatsApp Message

9. **Create Send Telegram Message Node**  
   - Type: Telegram  
   - Use Telegram credentials  
   - Recipient chat ID from normalized message  
   - Message text from Process AI Response

10. **Create Send WhatsApp Message Node**  
    - Type: HTTP Request  
    - Configure POST request to WhatsApp Business API endpoint  
    - Add authentication headers (Bearer token or OAuth)  
    - JSON body includes recipient phone number and message text

11. **Create Log Conversation Node**  
    - Type: Google Sheets  
    - Append new row with timestamp, senderId, message sent and received, platform  
    - Use appropriate sheet for logging

12. **Create Update Customer Record Node**  
    - Type: Google Sheets  
    - Update last interaction timestamp or customer status fields  
    - Use senderId as lookup key

13. **Create Check Escalation Node**  
    - Type: If  
    - Condition: check if AI response or message contains escalation keywords or flags

14. **Create Notify Support Team Node**  
    - Type: HTTP Request  
    - POST to internal or external notification endpoint (e.g., Slack webhook) with escalation details

15. **Create Webhook Response Node**  
    - Type: Respond to Webhook  
    - Send HTTP 200 OK with empty or confirmation JSON  
    - Connect output of Update Customer Record to this node (for WhatsApp webhook response)

**Connect nodes in the order outlined in the overview** ensuring that outputs flow correctly:
- Telegram Trigger & WhatsApp Webhook → Normalize Message Data → Get Customer History → Build AI Context → AI Business Assistant → Process AI Response → Platform Router → Send Telegram/WhatsApp → Log Conversation → Update Customer Record → Webhook Response  
- Process AI Response → Check Escalation → Notify Support Team (conditional)

---

### 5. General Notes & Resources

| Note Content                                                                                   | Context or Link                          |
|-----------------------------------------------------------------------------------------------|----------------------------------------|
| Use Telegram Bot API and WhatsApp Business API credentials configured securely in n8n          | Platform API credential setup           |
| Google Sheets used for customer data and conversation logs must have proper access permissions | Google Sheets API documentation         |
| OpenAI API key and usage limits can impact workflow reliability                               | https://platform.openai.com/docs/api-reference |
| Escalation criteria should be periodically reviewed and updated to reduce false alerts         | Business rules tuning                    |
| Ensure webhook URLs are correctly configured and publicly accessible for Telegram and WhatsApp | n8n webhook configuration               |

---

**Disclaimer:**  
The provided information comes exclusively from an automated workflow created with n8n, a no-code integration and automation tool. The process fully complies with content policies and contains no illegal, offensive, or protected elements. All data handled are legal and public.