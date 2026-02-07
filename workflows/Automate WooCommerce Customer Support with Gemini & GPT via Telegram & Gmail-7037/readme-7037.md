Automate WooCommerce Customer Support with Gemini & GPT via Telegram & Gmail

https://n8nworkflows.xyz/workflows/automate-woocommerce-customer-support-with-gemini---gpt-via-telegram---gmail-7037


# Automate WooCommerce Customer Support with Gemini & GPT via Telegram & Gmail

### 1. Workflow Overview

This workflow automates customer support for a WooCommerce store by integrating real-time queries from Telegram and Gmail, leveraging advanced AI language models (Google Gemini and OpenAI GPT-4.1 mini) to interpret customer requests and retrieve order information. It is designed to handle order-related inquiries, fetch order details from WooCommerce via API, and respond back on the originating platform, either Telegram or Gmail, maintaining conversation context.

Logical blocks identified:

- **1.1 Input Reception:** Captures incoming customer messages from Telegram and Gmail.
- **1.2 Data Normalization:** Unifies different input formats into a standard structure for processing.
- **1.3 AI Processing:** Uses an AI Agent with language models and memory to interpret queries and handle conversation logic.
- **1.4 WooCommerce Integration:** Fetches customer order data as a tool accessible by the AI Agent.
- **1.5 Response Routing:** Routes AI-generated responses back to the correct platform (Telegram or Gmail).
- **1.6 Post-Processing:** Marks processed Gmail messages as read to avoid duplicate handling.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
This block listens for new customer support queries from two channels: Telegram messages via webhook and Gmail unread emails polled every minute. It triggers the workflow on new inputs.

**Nodes Involved:**  
- Fetch user query (Telegram trigger)  
- Fetch support mail (Gmail trigger)  
- Merge

**Node Details:**

- **Fetch user query**  
  - Type: Telegram Trigger  
  - Role: Real-time capture of Telegram messages using webhook subscription to all message updates.  
  - Config: Listens to all message types, no additional filters.  
  - Input: None (trigger node)  
  - Output: Raw Telegram message data including chat ID and text.  
  - Failures: Possible webhook or auth issues, Telegram API rate limits.  
  - Sticky Note: Describes real-time webhook entry, captures chat ID/message.

- **Fetch support mail**  
  - Type: Gmail Trigger  
  - Role: Polls Gmail inbox every minute, retrieving unread emails including full body and headers.  
  - Config: Filters unread emails only, polling interval set to every minute.  
  - Input: None (trigger node)  
  - Output: Raw Gmail email data with sender, message body, thread ID.  
  - Failures: Gmail OAuth token expiration, Gmail API limits.  
  - Sticky Note: Highlights polling setup and unread filtering.

- **Merge**  
  - Type: Merge  
  - Role: Combines inputs from Telegram and Gmail triggers into a single unified stream for downstream processing.  
  - Config: Default merge settings (union).  
  - Input: From Telegram trigger and Gmail trigger nodes.  
  - Output: Unified data stream for next processing steps.  
  - Failures: Misconfiguration can cause data loss or blocking.  
  - Sticky Note: Explains unification of inputs.

---

#### 2.2 Data Normalization

**Overview:**  
Transforms Telegram and Gmail incoming data into a common schema with fields such as platform type, sender ID, query text, reply message ID, and conversation ID, enabling channel-agnostic processing downstream.

**Nodes Involved:**  
- Set Manual Fields

**Node Details:**

- **Set Manual Fields**  
  - Type: Set  
  - Role: Creates normalized fields including:  
    - `platform`: 'telegram' or 'gmail' based on input presence  
    - `sender_id`: Telegram chat ID or Gmail sender email address  
    - `query_text`: Message text from Telegram or email snippet/body from Gmail  
    - `reply_to_id`: Original message ID (Telegram message ID or Gmail thread ID)  
    - `conversation_id`: Chat ID or Gmail thread ID to track conversation  
  - Key expressions: Conditional expressions to detect platform and extract fields accordingly.  
  - Input: Merged data stream from triggers.  
  - Output: Enriched JSON with standard fields used for AI processing.  
  - Failures: Expression errors if expected fields missing; must handle both Telegram and Gmail formats gracefully.  
  - Sticky Note: Emphasizes platform-agnostic normalization.

---

#### 2.3 AI Processing

**Overview:**  
This is the core logic block where the AI Customer Support Agent interprets the user query, manages conversation memory, and invokes tools to retrieve order information. It uses a primary AI language model (Google Gemini) with a fallback to OpenAI GPT 4.1 mini, and maintains conversation context with short-term memory.

**Nodes Involved:**  
- WooCommerce Customer support Agent1 (Langchain Agent node)  
- Primary Model [Gemini 2.5 Flash] (Google Gemini LM)  
- Fallback Model [GPT 4.1 mini] (OpenAI LM)  
- Conversation Memory

**Node Details:**

- **WooCommerce Customer support Agent1**  
  - Type: Langchain Agent  
  - Role: Acts as the AI brain responding strictly to order-related customer queries. It uses conversational context and tools: mainly the WooCommerce order retrieval tool.  
  - Configuration:  
    - Prompt defines strict rules for processing queries:  
      - If Order ID is provided, fetch order details via the WooCommerce tool  
      - If order status asked without ID, ask user to provide Order ID  
      - For unrelated questions, politely decline with a fixed message  
    - Accepts normalized `query_text` and conversation memory input.  
    - Outputs a JSON object with `output` text for reply.  
    - Has fallback enabled to OpenAI model if Gemini model fails.  
  - Input: Normalized data from "Set Manual Fields", AI memory, language models, and tools.  
  - Output: Final AI-generated reply text.  
  - Failures: AI model API failures, prompt processing errors, tool invocation errors, fallback triggers.  
  - Sticky Note: Describes AI role as conversational brain enforcing strict order inquiry rules.

- **Primary Model [Gemini 2.5 Flash]**  
  - Type: Google Gemini LM (Langchain)  
  - Role: Primary language model for natural language understanding and generation.  
  - Configuration: Default options, authenticated via Google PaLM API credentials.  
  - Input: Text prompt from agent.  
  - Output: AI-generated text completion returned to agent.  
  - Failures: API quota, latency, auth errors.  
  - Sticky Note: Part of AI language engines block with fallback.

- **Fallback Model [GPT 4.1 mini]**  
  - Type: OpenAI GPT-4.1 mini LM (Langchain)  
  - Role: Backup language model used if primary Gemini model fails.  
  - Configuration: Model set to "gpt-4.1-mini" with default options.  
  - Input: Same prompt forwarded from agent.  
  - Output: AI-generated completion returned to agent fallback.  
  - Failures: Similar to primary model; fallback triggered on primary failure.

- **Conversation Memory**  
  - Type: Langchain Memory Buffer Window  
  - Role: Maintains short-term conversation context keyed by `conversation_id` to support multi-turn dialogues.  
  - Configuration: Uses a custom key from the normalized `conversation_id` field.  
  - Input: Conversation messages from agent.  
  - Output: Contextual memory passed back to the agent.  
  - Failures: Memory storage errors, key misalignment causing context loss.  
  - Sticky Note: Notes importance for handling follow-ups.

---

#### 2.4 WooCommerce Integration

**Overview:**  
A specialized tool node that the AI agent can invoke with an Order ID to retrieve detailed order information from WooCommerce via API.

**Nodes Involved:**  
- Get an order in WooCommerce

**Node Details:**

- **Get an order in WooCommerce**  
  - Type: WooCommerce Tool Node  
  - Role: Fetches order details for a given Order ID supplied by the AI agent.  
  - Configuration:  
    - Operation: "get" order by ID  
    - Order ID parameter dynamically passed from agent’s tool invocation input.  
    - Uses WooCommerce API credentials configured with API key and secret.  
  - Input: Order ID from AI Agent tool call.  
  - Output: Order JSON data returned to AI Agent for reply generation.  
  - Failures: Invalid or missing order ID, WooCommerce API downtime, auth errors.  
  - Sticky Note: Describes as a tool accessible only to agent.

---

#### 2.5 Response Routing

**Overview:**  
Routes the AI agent’s final textual response to the correct customer platform, either Telegram or Gmail.

**Nodes Involved:**  
- Reply to Specific Platform (Switch)  
- Send Telegram Response  
- Send Response via Mail

**Node Details:**

- **Reply to Specific Platform**  
  - Type: Switch  
  - Role: Checks the normalized `platform` field and routes output accordingly.  
  - Configuration: Two outputs named “Telegram” and “Mail” based on platform equality checks.  
  - Input: AI agent output JSON with reply text and metadata.  
  - Output: Routes to Telegram or Gmail response nodes.  
  - Failures: Incorrect platform field value causing routing failures.  
  - Sticky Note: Explains routing logic based on platform.

- **Send Telegram Response**  
  - Type: Telegram Node (Send Message)  
  - Role: Sends AI-generated text reply to Telegram chat ID.  
  - Configuration:  
    - `chatId` set to normalized `sender_id` (Telegram chat ID)  
    - `text` set to AI output text  
    - Uses Telegram API credentials.  
  - Input: Routed from Switch node.  
  - Output: Confirmation of sent message.  
  - Failures: Telegram API rate limits, invalid chat ID, auth errors.  
  - Sticky Note: Notes final delivery step for Telegram.

- **Send Response via Mail**  
  - Type: Gmail Node (Send Email)  
  - Role: Replies to the original Gmail email thread with AI-generated text.  
  - Configuration:  
    - `message` set to AI output text  
    - `operation` set to reply  
    - `messageId` set to original email’s ID for threading  
    - Uses Gmail OAuth2 credentials.  
  - Input: Routed from Switch node.  
  - Output: Confirmation of sent email reply.  
  - Failures: Gmail API errors, OAuth token expiration, threading failures.  
  - Sticky Note: Describes reply via email maintaining thread.

---

#### 2.6 Post-Processing

**Overview:**  
Marks processed Gmail emails as read to prevent reprocessing and infinite reply loops.

**Nodes Involved:**  
- Mark received mail as read

**Node Details:**

- **Mark received mail as read**  
  - Type: Gmail Node (Mark as Read)  
  - Role: After sending reply, marks the original incoming Gmail message as read.  
  - Configuration:  
    - Uses `messageId` from normalized data for the original email to mark read.  
    - Uses Gmail OAuth2 credentials.  
  - Input: Output from Send Response via Mail node.  
  - Output: Confirmation of email status update.  
  - Failures: Gmail API limits, invalid message ID, OAuth token expiration.  
  - Sticky Note: Highlights critical role to prevent infinite reply loops.

---

### 3. Summary Table

| Node Name                      | Node Type                      | Functional Role                        | Input Node(s)                   | Output Node(s)                    | Sticky Note                                                                                   |
|--------------------------------|--------------------------------|-------------------------------------|---------------------------------|---------------------------------|-----------------------------------------------------------------------------------------------|
| Fetch user query                | Telegram Trigger               | Entry point for Telegram messages   | -                               | Merge                           | Acts as the real-time entry point for Telegram. Uses webhook for instant triggering.          |
| Fetch support mail             | Gmail Trigger                 | Entry point for Gmail unread mails  | -                               | Merge                           | Polls Gmail inbox every minute. Filters unread emails only. "Get Message" ON for full body.  |
| Merge                         | Merge                         | Combines Telegram & Gmail inputs    | Fetch user query, Fetch support mail | Set Manual Fields               | Unifies inputs from all triggers into a single data stream.                                  |
| Set Manual Fields             | Set                           | Normalize input data fields         | Merge                           | WooCommerce Customer support Agent1 | Normalizes data to standard fields: platform, sender_id, query_text, etc.                    |
| WooCommerce Customer support Agent1 | Langchain Agent              | AI brain interpreting queries       | Set Manual Fields, Conversation Memory, Primary Model, Fallback Model, Get an order in WooCommerce | Reply to Specific Platform       | Specialized AI agent strictly handling order inquiries with WooCommerce tool access.          |
| Primary Model [Gemini 2.5 Flash] | Google Gemini LM            | Primary AI language model            | WooCommerce Customer support Agent1 | WooCommerce Customer support Agent1 | Provides primary AI language understanding power. Uses Google PaLM API.                      |
| Fallback Model [GPT 4.1 mini]  | OpenAI GPT LM                 | Fallback AI language model           | WooCommerce Customer support Agent1 | WooCommerce Customer support Agent1 | Backup AI language model if Gemini fails.                                                     |
| Conversation Memory           | Langchain Memory Buffer Window | Short-term conversation memory      | WooCommerce Customer support Agent1 | WooCommerce Customer support Agent1 | Maintains conversation context keyed by conversation_id.                                    |
| Get an order in WooCommerce    | WooCommerce Tool              | Fetch WooCommerce order details     | WooCommerce Customer support Agent1 | WooCommerce Customer support Agent1 | Tool node invoked by agent to get order info with Order ID.                                  |
| Reply to Specific Platform     | Switch                       | Routes response by platform         | WooCommerce Customer support Agent1 | Send Telegram Response, Send Response via Mail | Routes AI replies to Telegram or Gmail based on platform field.                              |
| Send Telegram Response         | Telegram                      | Send reply message to Telegram      | Reply to Specific Platform       | -                               | Sends AI’s response text to Telegram chat ID.                                                |
| Send Response via Mail         | Gmail                        | Reply to Gmail email thread         | Reply to Specific Platform       | Mark received mail as read       | Sends AI’s response as threaded email reply.                                                 |
| Mark received mail as read     | Gmail                        | Marks Gmail email as read after reply | Send Response via Mail           | -                               | Prevents infinite reply loops by marking processed emails as read.                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger "Fetch user query"**  
   - Type: Telegram Trigger  
   - Configure webhook ID (auto-generated)  
   - Set updates to listen to: "message" and all message types  
   - Connect output to Merge node.  
   - Set Telegram API credentials with valid Bot token.

2. **Create Gmail Trigger "Fetch support mail"**  
   - Type: Gmail Trigger  
   - Filter unread emails only (`readStatus: unread`)  
   - Polling interval: every minute  
   - Enable full message retrieval (body + headers).  
   - Connect output to Merge node.  
   - Set Gmail OAuth2 credentials with valid scopes.

3. **Add Merge node "Merge"**  
   - Type: Merge  
   - Connect inputs from "Fetch user query" and "Fetch support mail" triggers.  
   - Output connects to "Set Manual Fields".

4. **Add Set node "Set Manual Fields"**  
   - Create the following fields with expressions:  
     - `platform`: if Telegram message exists then 'telegram' else 'gmail'  
     - `sender_id`: Telegram chat ID or Gmail sender email address  
     - `query_text`: Telegram message text or Gmail email snippet/body  
     - `reply_to_id`: Telegram message ID or Gmail message ID/thread ID  
     - `conversation_id`: Telegram chat ID or Gmail thread ID  
   - Connect output to AI Agent node.

5. **Add Langchain Agent node "WooCommerce Customer support Agent1"**  
   - Role: AI conversational agent with tool access  
   - Set prompt with strict rules:  
     - Use WooCommerce order retrieval tool with Order ID if provided  
     - Ask for Order ID if missing and user asks about order status  
     - Decline all non-order-related queries politely  
   - Enable fallback model usage.  
   - Connect input from "Set Manual Fields".  
   - Connect AI memory input from "Conversation Memory".  
   - Connect AI language model inputs from "Primary Model [Gemini]" and "Fallback Model [GPT 4.1 mini]".  
   - Connect AI tool input from "Get an order in WooCommerce".  
   - Connect output to "Reply to Specific Platform".

6. **Add Google Gemini LM node "Primary Model [Gemini 2.5 Flash]"**  
   - Configure with Google PaLM API credentials.  
   - Use default options.  
   - Connect output to Agent node’s primary AI model input.

7. **Add OpenAI LM node "Fallback Model [GPT 4.1 mini]"**  
   - Configure with OpenAI API credentials.  
   - Set model to "gpt-4.1-mini".  
   - Connect output to Agent node’s fallback AI model input.

8. **Add Langchain Memory node "Conversation Memory"**  
   - Set `sessionKey` to expression referencing `conversation_id` from "Set Manual Fields".  
   - Connect AI memory input/output to Agent node.

9. **Add WooCommerce Tool node "Get an order in WooCommerce"**  
   - Operation: Get order by ID  
   - Order ID driven dynamically from AI Agent tool invocation.  
   - Connect tool output back to Agent node.  
   - Configure with WooCommerce API credentials.

10. **Add Switch node "Reply to Specific Platform"**  
    - Add two outputs: "Telegram" and "Mail"  
    - Condition on normalized field `platform`: equals "telegram" → Telegram output; equals "gmail" → Mail output  
    - Connect Agent node output to this switch.

11. **Add Telegram node "Send Telegram Response"**  
    - Configure to send message with text from AI output field.  
    - Set chat ID from normalized `sender_id`.  
    - Connect from Switch node Telegram output.  
    - Use Telegram API credentials.

12. **Add Gmail node "Send Response via Mail"**  
    - Operation: Reply to email thread  
    - Message text from AI output field  
    - `messageId` set to original email `reply_to_id` for threading  
    - Connect from Switch node Mail output.  
    - Use Gmail OAuth2 credentials.

13. **Add Gmail node "Mark received mail as read"**  
    - Operation: Mark as read  
    - `messageId` set to original email `reply_to_id`  
    - Connect output from "Send Response via Mail".  
    - Use Gmail OAuth2 credentials.

---

### 5. General Notes & Resources

| Note Content                                                                                                          | Context or Link                                                  |
|-----------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------|
| The AI Agent strictly limits its scope to order-related inquiries, improving focus and avoiding off-topic questions.  | Node "WooCommerce Customer support Agent1" Sticky Note          |
| Gmail emails are polled every minute but Telegram messages trigger instantly via webhook for real-time interaction.  | "Fetch user query" and "Fetch support mail" Sticky Notes         |
| Conversation memory is essential for follow-up questions and multi-turn dialogs, keyed on unique conversation ID.    | "Conversation Memory" Sticky Note                                |
| The workflow uses a fallback AI model to ensure high availability and reliability of responses.                       | "AI Language Engines" Sticky Note                                |
| Critical to mark Gmail messages as read after processing to prevent infinite reply loops.                             | "Mark received mail as read" Sticky Note                         |
| WooCommerce API credentials require proper permissions and configured API keys for order retrieval.                   | Node "Get an order in WooCommerce" Sticky Note                   |
| Telegram and Gmail credentials must be valid and authorized with necessary scopes for messaging and reading emails.   | Credential configurations for Telegram and Gmail nodes           |

---

**Disclaimer:** The provided text is exclusively derived from an automated workflow created with n8n, respecting content policies. All handled data is legal and public, and no illegal or offensive content is included.