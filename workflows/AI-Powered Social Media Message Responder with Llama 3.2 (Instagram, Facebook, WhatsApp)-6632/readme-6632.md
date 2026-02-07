AI-Powered Social Media Message Responder with Llama 3.2 (Instagram, Facebook, WhatsApp)

https://n8nworkflows.xyz/workflows/ai-powered-social-media-message-responder-with-llama-3-2--instagram--facebook--whatsapp--6632


# AI-Powered Social Media Message Responder with Llama 3.2 (Instagram, Facebook, WhatsApp)

### 1. Workflow Overview

This workflow is designed to automatically respond to incoming messages on three major social media platforms: WhatsApp, Instagram, and Facebook Messenger. It uses Meta’s APIs to receive messages in real time, processes and normalizes message data, and then generates AI-powered replies using the Llama 3.2 language model. The responses are personalized based on the platform's style and the user’s identity. This setup is ideal for customer support, lead generation, and enhancing user engagement with smart, friendly, and context-aware automated assistants.

The workflow is logically divided into these blocks:

- **1.1 Input Reception:** Captures incoming messages from WhatsApp, Instagram, and Facebook via dedicated trigger or webhook nodes.
- **1.2 Message Processing:** Normalizes incoming message data into a unified format for downstream AI processing.
- **1.3 AI Response Generation:** Uses a LangChain agent with Llama 3.2 to generate context-aware replies tailored to each platform and user.
- **1.4 Memory Management:** Maintains session memory per user and platform to provide contextual continuity in conversations.
- **1.5 Response Routing and Sending:** Routes the AI-generated reply to the appropriate sender API endpoint (WhatsApp, Instagram, or Facebook) and sends the message.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
This block listens for incoming messages from the three supported platforms and triggers the workflow when a new message arrives.

**Nodes Involved:**  
- WhatsApp Trigger  
- Instagram Webhook  
- Facebook Webhook

**Node Details:**

- **WhatsApp Trigger**  
  - *Type:* WhatsApp Trigger node  
  - *Role:* Listens for WhatsApp messages via WhatsApp Business Cloud API webhook.  
  - *Configuration:* Listens to message updates only; credentials configured with WhatsApp API test credentials.  
  - *Inputs:* HTTP webhook call from WhatsApp cloud API.  
  - *Outputs:* Emits raw incoming WhatsApp message JSON.  
  - *Edge Cases:* Possible webhook connection failures or auth token expiration.  
  - *Notes:* Requires valid WhatsApp Business Cloud API credentials.

- **Instagram Webhook**  
  - *Type:* Webhook (HTTP POST) node  
  - *Role:* Receives Instagram Direct Message events from Instagram Graph API webhook.  
  - *Configuration:* Listens on a unique path with POST method; no authentication at webhook level.  
  - *Inputs:* HTTP POST requests from Instagram webhook.  
  - *Outputs:* Raw Instagram messaging event JSON.  
  - *Edge Cases:* Network failures, webhook verification issues, rate limiting by Instagram.  
  - *Notes:* Requires Meta Developer App webhook setup.

- **Facebook Webhook**  
  - *Type:* Webhook (HTTP POST) node  
  - *Role:* Receives Facebook Messenger message events via Facebook Graph API webhook.  
  - *Configuration:* Unique webhook path, POST method; no direct auth on webhook.  
  - *Inputs:* HTTP POST from Facebook Messenger webhook.  
  - *Outputs:* Raw Facebook Messenger event JSON.  
  - *Edge Cases:* Webhook connectivity or subscription problems, token expiration.  
  - *Notes:* Requires Facebook App webhook subscription.

---

#### 2.2 Message Processing

**Overview:**  
Processes and normalizes incoming raw webhook data from all platforms into a common JSON format containing platform, sender info, message text, and timestamps.

**Nodes Involved:**  
- Message Processor

**Node Details:**

- **Message Processor**  
  - *Type:* Code node (JavaScript)  
  - *Role:* Parses incoming JSON from any of the three platforms and outputs a unified message object with platform, senderId, senderName, message text, messageId, and timestamp.  
  - *Configuration:* Custom JavaScript that distinguishes platform based on input JSON shape and fields, handling WhatsApp, Instagram, and Facebook formats.  
  - *Key Expressions:* Uses `$input.first().json` to access raw data; returns normalized object.  
  - *Inputs:* Connected from all three webhook/trigger nodes.  
  - *Outputs:* Single normalized message object downstream.  
  - *Edge Cases:* Unexpected or malformed input JSON; missing fields; fallback to default WhatsApp-like structure if unknown.  
  - *Notes:* Essential for uniform downstream processing.

---

#### 2.3 AI Response Generation

**Overview:**  
Generates personalized AI responses using LangChain with Llama 3.2, adapting tone and style to the platform and user context.

**Nodes Involved:**  
- AI Travel Agent  
- Ollama Chat Model  
- Platform Memory

**Node Details:**

- **AI Travel Agent**  
  - *Type:* LangChain Agent node (AI agent)  
  - *Role:* Acts as the conversational AI assistant that takes the normalized message text and platform info as input and produces a relevant, friendly reply.  
  - *Configuration:* Uses a system message template defining assistant’s personality, capabilities, and platform-specific tone (friendly professional for WhatsApp, trendy casual for Instagram, warm informative for Facebook). Uses variables like `assistant_name`, `business_name`, and platform/user info.  
  - *Key Expressions:* `"={{ $json.message }}"` for input text; system message uses templated expressions for dynamic context.  
  - *Inputs:* From Message Processor; also connected to Ollama Chat Model and Platform Memory.  
  - *Outputs:* AI-generated reply text.  
  - *Edge Cases:* API call failures, model timeouts, malformed input messages.

- **Ollama Chat Model**  
  - *Type:* LangChain Ollama Chat Model node  
  - *Role:* Provides the underlying Llama 3.2 language model for AI Travel Agent.  
  - *Configuration:* Model set to `llama3.2-16000:latest`; uses Ollama API credentials.  
  - *Inputs:* Connected as language model for AI Travel Agent.  
  - *Outputs:* AI-generated text output.  
  - *Edge Cases:* API connectivity or authentication failures.

- **Platform Memory**  
  - *Type:* LangChain Memory Buffer Window node  
  - *Role:* Maintains conversational context per session identified by platform plus senderId to enable contextually aware conversations.  
  - *Configuration:* Session key is `{{ $json.platform }}_{{ $json.senderId }}`, window length 150 tokens.  
  - *Inputs:* Connected as AI memory for AI Travel Agent.  
  - *Outputs:* Provides context memory to AI Travel Agent for coherent replies.  
  - *Edge Cases:* Memory overflow or session key collisions.

---

#### 2.4 Response Routing and Sending

**Overview:**  
Based on platform, routes the AI-generated response to the appropriate sending node to dispatch the message back to the user on the correct platform.

**Nodes Involved:**  
- Response Router  
- Send message (WhatsApp)  
- Instagram Sender  
- Facebook Sender

**Node Details:**

- **Response Router**  
  - *Type:* Switch node  
  - *Role:* Routes the AI response based on platform field (`whatsapp`, `instagram`, `facebook`).  
  - *Configuration:* Uses strict string equality conditions on normalized platform from Message Processor.  
  - *Inputs:* From AI Travel Agent output.  
  - *Outputs:* Routes to one of three sending nodes.  
  - *Edge Cases:* Unknown platform strings or missing platform field.

- **Send message (WhatsApp)**  
  - *Type:* WhatsApp node (send message)  
  - *Role:* Sends the AI-generated reply to the WhatsApp user.  
  - *Configuration:* Uses WhatsApp Business Cloud API; sets message body from AI output; recipient phone number from normalized senderId; configured phoneNumberId for sending account; credentials validated.  
  - *Inputs:* From Response Router (WhatsApp branch).  
  - *Outputs:* Sends message, no further nodes downstream.  
  - *Edge Cases:* Message send failures, invalid phone numbers, auth token expiration.

- **Instagram Sender**  
  - *Type:* HTTP Request node  
  - *Role:* Sends AI response as a message via Instagram Graph API.  
  - *Configuration:* POST to `https://graph.facebook.com/v18.0/{{senderId}}/messages`; bearer token in Authorization header; Content-Type JSON; message body dynamically set; credentials use header auth.  
  - *Inputs:* From Response Router (Instagram branch).  
  - *Outputs:* Sends message, no further nodes downstream.  
  - *Edge Cases:* API errors, token expiration, rate limits.

- **Facebook Sender**  
  - *Type:* HTTP Request node  
  - *Role:* Sends AI reply through Facebook Messenger API.  
  - *Configuration:* POST to `https://graph.facebook.com/v18.0/me/messages`; bearer token header authentication; JSON content type; message body dynamically set; credentials use header auth.  
  - *Inputs:* From Response Router (Facebook branch).  
  - *Outputs:* Sends message, no further nodes downstream.  
  - *Edge Cases:* API errors, permissions, token expiration.

---

### 3. Summary Table

| Node Name         | Node Type                      | Functional Role                          | Input Node(s)                     | Output Node(s)                   | Sticky Note                                                                                                               |
|-------------------|--------------------------------|----------------------------------------|----------------------------------|---------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| WhatsApp Trigger  | WhatsApp Trigger               | Receives WhatsApp messages              | —                                | Message Processor               |                                                                                                                           |
| Instagram Webhook | Webhook                       | Receives Instagram DM webhook events   | —                                | Message Processor               |                                                                                                                           |
| Facebook Webhook  | Webhook                       | Receives Facebook Messenger webhook    | —                                | Message Processor               |                                                                                                                           |
| Message Processor | Code                         | Normalizes incoming messages            | WhatsApp Trigger, Instagram Webhook, Facebook Webhook | AI Travel Agent                |                                                                                                                           |
| AI Travel Agent   | LangChain Agent              | Generates AI reply with platform context| Message Processor                | Response Router                 |                                                                                                                           |
| Ollama Chat Model | LangChain Ollama Chat Model | Llama 3.2 language model for AI        | — (linked as LM to AI Travel Agent) | AI Travel Agent (ai_languageModel) |                                                                                                                           |
| Platform Memory   | LangChain Memory Buffer      | Maintains conversation context/session | — (linked as memory to AI Travel Agent) | AI Travel Agent (ai_memory)    |                                                                                                                           |
| Response Router   | Switch                       | Routes AI replies by platform           | AI Travel Agent                  | Send message, Instagram Sender, Facebook Sender |                                                                                                                           |
| Send message      | WhatsApp                     | Sends reply to WhatsApp user            | Response Router (WhatsApp branch) | —                               |                                                                                                                           |
| Instagram Sender  | HTTP Request                 | Sends reply to Instagram user           | Response Router (Instagram branch) | —                               |                                                                                                                           |
| Facebook Sender   | HTTP Request                 | Sends reply to Facebook user            | Response Router (Facebook branch) | —                               |                                                                                                                           |
| Sticky Note       | Sticky Note                  | Purpose & requirements overview         | —                                | —                               | ## Purpose: Enable your AI assistant to automatically respond to Instagram DMs, Facebook messages, and WhatsApp chats using Meta’s APIs—ideal for customer support, lead generation, and smart engagement at scale. <br>## Requirements: 1. Access to Meta’s Instagram Graph API, Facebook Messenger API, and WhatsApp Business Cloud API 2. Approved Meta Developer App 3. Webhook setup and persistent token management for real-time messaging |

---

### 4. Reproducing the Workflow from Scratch

1. **Create WhatsApp Trigger node**  
   - Node Type: WhatsApp Trigger  
   - Configure to listen for message updates only.  
   - Set credentials with WhatsApp Business Cloud API (test or production).  
   - Position on canvas at left top.

2. **Create Instagram Webhook node**  
   - Node Type: Webhook (HTTP POST)  
   - Set unique webhook path (e.g., a GUID or descriptive string).  
   - HTTP Method: POST  
   - No authentication on webhook.  
   - Position below WhatsApp Trigger.

3. **Create Facebook Webhook node**  
   - Node Type: Webhook (HTTP POST)  
   - Set unique webhook path.  
   - HTTP Method: POST  
   - No authentication on webhook.  
   - Position below Instagram Webhook.

4. **Create Message Processor node**  
   - Node Type: Code (JavaScript)  
   - Paste the provided JavaScript code to parse and normalize messages from all three platforms into a common JSON object with keys: platform, senderId, senderName, message, messageId, timestamp.  
   - Connect WhatsApp Trigger, Instagram Webhook, and Facebook Webhook nodes as inputs to this node (merge all inputs).  
   - Position to the right of input nodes.

5. **Create Ollama Chat Model node**  
   - Node Type: LangChain Ollama Chat Model  
   - Set Model to `llama3.2-16000:latest`.  
   - Configure credentials with Ollama API token.  
   - Position below Message Processor.

6. **Create Platform Memory node**  
   - Node Type: LangChain Memory Buffer Window  
   - Set Session Key to `={{ $json.platform }}_{{ $json.senderId }}`  
   - Session Id Type: customKey  
   - Context window length: 150 tokens  
   - Position below Ollama Chat Model.

7. **Create AI Travel Agent node**  
   - Node Type: LangChain Agent  
   - Set input text to `={{ $json.message }}` from Message Processor output.  
   - Configure system prompt with assistant personality, platform-specific tone instructions, and user/business info variables.  
   - Link Ollama Chat Model as AI language model.  
   - Link Platform Memory as AI memory.  
   - Position right of Message Processor.

8. **Create Response Router node**  
   - Node Type: Switch  
   - Add rules for routing based on `={{ $('Message Processor').item.json.platform }}`:  
     - equals 'whatsapp' → output 1  
     - equals 'instagram' → output 2  
     - equals 'facebook' → output 3  
   - Position right of AI Travel Agent.

9. **Create Send message node (WhatsApp)**  
   - Node Type: WhatsApp  
   - Operation: send  
   - Text body: `={{ $json.output }}` (AI reply)  
   - Recipient phone number: `={{ $('Message Processor').item.json.senderId }}`  
   - PhoneNumberId: set to your WhatsApp Business phone number ID.  
   - Set WhatsApp API credentials.  
   - Position right of Response Router (output 1).

10. **Create Instagram Sender node**  
    - Node Type: HTTP Request  
    - Method: POST  
    - URL: `https://graph.facebook.com/v18.0/{{ $('Message Processor').item.json.senderId }}/messages`  
    - Authentication: HTTP Header Auth with Bearer Token (Instagram Access Token)  
    - Headers: Content-Type: application/json, Authorization: Bearer token  
    - Body: JSON with message text from AI output.  
    - Position right of Response Router (output 2).

11. **Create Facebook Sender node**  
    - Node Type: HTTP Request  
    - Method: POST  
    - URL: `https://graph.facebook.com/v18.0/me/messages`  
    - Authentication: HTTP Header Auth with Bearer Token (Facebook Access Token)  
    - Headers: Content-Type: application/json, Authorization: Bearer token  
    - Body: JSON with message text from AI output.  
    - Position right of Response Router (output 3).

12. **Connect nodes in order:**  
    - WhatsApp Trigger → Message Processor  
    - Instagram Webhook → Message Processor  
    - Facebook Webhook → Message Processor  
    - Message Processor → AI Travel Agent  
    - Ollama Chat Model → AI Travel Agent (AI languageModel input)  
    - Platform Memory → AI Travel Agent (AI memory input)  
    - AI Travel Agent → Response Router  
    - Response Router (WhatsApp output) → Send message (WhatsApp)  
    - Response Router (Instagram output) → Instagram Sender  
    - Response Router (Facebook output) → Facebook Sender

13. **Test the workflow:**  
    - Ensure all credentials are valid and tokens are refreshed.  
    - Deploy webhooks and verify webhook subscriptions on Meta Developer platform.  
    - Simulate incoming messages on each platform and confirm AI replies are sent correctly.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                           | Context or Link                                                                                              |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| Purpose: Enable your AI assistant to automatically respond to Instagram DMs, Facebook messages, and WhatsApp chats using Meta’s APIs—ideal for customer support, lead generation, and smart engagement at scale.                                                                                       | See sticky note content in workflow.                                                                         |
| Requirements: 1) Access to Meta’s Instagram Graph API, Facebook Messenger API, and WhatsApp Business Cloud API 2) Approved Meta Developer App 3) Webhook setup and persistent token management for real-time messaging.                                                                                 | Meta for Developers: https://developers.facebook.com/docs/                                                     |
| The AI helper uses Llama 3.2 via Ollama integration, which requires valid API credentials and network access.                                                                                                                                                                                       | Ollama API docs: https://ollama.com/docs/                                                                    |
| Platform-specific tone adaptation is embedded into the system message prompt of the LangChain agent to improve user experience.                                                                                                                                                                    |                                                                                                             |
| For production, ensure secure storage of tokens and refresh mechanisms for all Meta APIs.                                                                                                                                                                                                            |                                                                                                             |
| The workflow currently assumes message texts are plain text; media message handling requires additional development.                                                                                                                                                                               |                                                                                                             |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected content. All data handled is legal and public.