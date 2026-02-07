Automate Bitget Spot Trading with GPT-4o-mini AI Agent via Telegram

https://n8nworkflows.xyz/workflows/automate-bitget-spot-trading-with-gpt-4o-mini-ai-agent-via-telegram-9842


# Automate Bitget Spot Trading with GPT-4o-mini AI Agent via Telegram

### 1. Workflow Overview

This workflow automates spot trading on the Bitget exchange by leveraging a GPT-4o-mini AI agent interfaced through Telegram. It enables secure, intelligent trading commands, account information retrieval, and order management via conversational interaction on Telegram, combined with Bitget's API for execution.

The workflow is logically divided into the following major blocks:

- **1.1 Telegram Input Reception and User Authentication**: Receives user messages from Telegram, authenticates users by Telegram ID, and determines message type (text, image, sound).
- **1.2 AI Trading Agent and Language Model Interaction**: Utilizes GPT-4o-mini and Langchain agents to process trading commands, perform calculations, and interact with Bitget API tools.
- **1.3 API Request Signing and Communication with Bitget**: Handles authentication and signing for Bitget API requests, sending HTTP requests to retrieve account data, trade information, place/cancel orders, and manage planned orders.
- **1.4 Webhook Endpoints for External and Internal Triggers**: Exposes webhook endpoints for retrieving account info, assets, deposit addresses, order info, and managing orders/plans externally.
- **1.5 Message Formatting and Telegram Response**: Processes AI-generated or system responses, splitting large messages if needed, and sends formatted replies back to Telegram users.

---

### 2. Block-by-Block Analysis

#### 2.1 Telegram Input Reception and User Authentication

**Overview:**  
This block captures incoming Telegram messages, authenticates the user by their Telegram ID, and routes the message based on its type (text, image, sound).

**Nodes Involved:**  
- Telegram Trigger  
- User Authentication (Replace Telegram ID)  
- Message Format Selector  
- Telegram Image Download  
- Telegram Sound Download  
- Set Message  
- Splits message is more than 4000 characters  
- Telegram (Send Response)

**Node Details:**

- **Telegram Trigger**  
  - Type: Telegram Trigger node  
  - Role: Entry point for Telegram messages via webhook.  
  - Configuration: Standard Telegram credentials, listening for all messages.  
  - Input: Incoming Telegram updates  
  - Output: Message data forwarded for authentication  
  - Edge Cases: Unauthorized users, unsupported message types.

- **User Authentication (Replace Telegram ID)**  
  - Type: Code node  
  - Role: Verifies Telegram user ID against allowed users; replaces or modifies Telegram ID to enforce authentication.  
  - Configuration: Custom JavaScript code; likely includes user ID whitelisting.  
  - Input: Telegram message object  
  - Output: Routed message for formatting  
  - Edge Cases: Unauthorized user messages are rejected or ignored.

- **Message Format Selector**  
  - Type: Switch node  
  - Role: Routes message based on content type: image, sound, or text.  
  - Configuration: Evaluates message data properties to distinguish type.  
  - Output Connections:  
    - Image → Telegram Image Download  
    - Sound → Telegram Sound Download  
    - Text → Set Message

- **Telegram Image Download**  
  - Type: Telegram node  
  - Role: Downloads images sent by user for further processing.  
  - Output: Image file forwarded to "Get Image Info" node.  
  - Edge Cases: Large images, unsupported formats.

- **Telegram Sound Download**  
  - Type: Telegram node  
  - Role: Downloads audio messages for analysis or transcription.  
  - Output: Audio file forwarded to AI model (OpenAI2).  
  - Edge Cases: Unsupported audio formats or links.

- **Set Message**  
  - Type: Set node  
  - Role: Prepares text message for AI processing.  
  - Output: Message to AI agent node.

- **Splits message is more than 4000 characters**  
  - Type: Code node  
  - Role: Splits long AI-generated messages exceeding Telegram limits into chunks.  
  - Output: Message chunks for Telegram node.

- **Telegram**  
  - Type: Telegram node  
  - Role: Sends messages back to users on Telegram.  
  - Input: Message chunks or normal responses.  
  - Edge Cases: Telegram API rate limits, message size limits.

---

#### 2.2 AI Trading Agent and Language Model Interaction

**Overview:**  
This block contains Langchain-powered AI agents and tools that process user commands, execute calculations, and perform intelligent trading decisions by interfacing with Bitget API tools.

**Nodes Involved:**  
- OpenAI Chat Model (multiple instances)  
- Bitget AI Trader Agent (Agent node)  
- Account and Wallet Agent tool  
- Spot Order Trading Agent tool  
- Trigger Order Agent tool  
- Calculator (multiple instances)  
- Think (toolThink node)  
- Simple Memory (multiple instances)

**Node Details:**

- **OpenAI Chat Model** (various)  
  - Type: Langchain OpenAI Chat model node  
  - Role: Processes natural language inputs and generates AI responses.  
  - Configuration: GPT-4o-mini model; parameters tuned for trading context.  
  - Connected to: AI agent tools or "Set Message" node.  
  - Edge Cases: API rate limits, prompt truncation.

- **Bitget AI Trader Agent**  
  - Type: Langchain Agent node  
  - Role: Central AI agent orchestrating trading logic and using agent tools.  
  - Configuration: Uses OpenAI Chat Model, Calculator, and Think tools as sub-agents.  
  - Input: User messages or agent tool outputs.  
  - Output: Trading commands or message responses.  
  - Edge Cases: Logic errors, AI hallucination risk.

- **Account and Wallet Agent tool**  
  - Type: Agent Tool node  
  - Role: Dedicated tool within the AI agent to query account and wallet info via Bitget API.  
  - Input/Output: Interfaces with HTTP request nodes for account data.  
  - Edge Cases: API errors, authentication failure.

- **Spot Order Trading Agent tool**  
  - Type: Agent Tool node  
  - Role: Handles spot order trading tasks such as placing/canceling orders, fetching order data.  
  - Integration: Uses various HTTP requests to Bitget.  
  - Edge Cases: Market order failures, insufficient balance.

- **Trigger Order Agent tool**  
  - Type: Agent Tool node  
  - Role: Manages trigger orders and plan orders operations.  
  - Connected to HTTP requests managing plan orders.  
  - Edge Cases: Timing issues, order modification errors.

- **Calculator**  
  - Type: Langchain calculator tool nodes  
  - Role: Performs complex arithmetic or financial calculations needed by the AI agent.  
  - Input: Numeric or expression data from AI or trading logic.  
  - Edge Cases: Division by zero, invalid expressions.

- **Think**  
  - Type: Langchain Think tool  
  - Role: Facilitates advanced reasoning or step-by-step thought processing for AI agent.  
  - Connected to the Bitget AI Trader Agent.  
  - Edge Cases: Logic timeouts or infinite loops.

- **Simple Memory (multiple instances)**  
  - Type: Memory Buffer Window  
  - Role: Maintains conversation or task memory context for each agent/tool to improve interactions and state management.  
  - Edge Cases: Memory overflow or irrelevant context retention.

---

#### 2.3 API Request Signing and Communication with Bitget

**Overview:**  
This block handles the creation of authenticated requests to the Bitget API, including HMAC-SHA256 signing, adding API keys, and sending HTTP requests to perform trading operations and data queries.

**Nodes Involved:**  
- Add API Keys (multiple Set nodes)  
- Create Signed String (Code nodes, various types)  
- Crypto (HMAC-SHA256 → base64) (multiple nodes)  
- HTTP Request nodes for:  
  - Get Account Information  
  - Get Account Assets  
  - Get Deposit Address  
  - Place Order  
  - Cancel Order  
  - Get Order Info  
  - Get Current Orders  
  - Place Plan Order  
  - Modify Plan Order  
  - Cancel Plan Order  
  - Get Current Plan Orders

- Format Response (Code nodes, multiple)

**Node Details:**

- **Add API Keys & Inputs**  
  - Type: Set nodes  
  - Role: Inserts necessary authentication parameters and request inputs (API key, secret, timestamp, body/query).  
  - Edge Cases: Missing or invalid credentials cause request failures.

- **Create Signed String**  
  - Type: Code nodes  
  - Role: Constructs the canonical string to be signed for API request authentication; varies for GET, POST, with or without query parameters.  
  - Output: String to be signed by Crypto node.  
  - Edge Cases: Incorrect string format breaks signature validation.

- **Crypto (HMAC-SHA256 → base64)**  
  - Type: Crypto node  
  - Role: Signs the string generated with HMAC-SHA256 and encodes in base64 as required by Bitget API.  
  - Output: Signature for HTTP request header.  
  - Edge Cases: Key misconfiguration; invalid signature.

- **HTTP Request Nodes**  
  - Type: HTTP Request nodes  
  - Role: Sends signed requests to Bitget API endpoints for various operations (account info, placing/canceling orders, getting order status).  
  - Configuration: Configured with authentication headers, signed requests, and appropriate HTTP methods.  
  - Output: API JSON responses.  
  - Edge Cases: API downtime, rate limiting, invalid parameters.

- **Format Response**  
  - Type: Code nodes  
  - Role: Parses and formats API responses into user-friendly JSON or text to be consumed by AI agents or returned to webhook callers.  
  - Edge Cases: API response errors, unexpected data formats.

---

#### 2.4 Webhook Endpoints for External and Internal Triggers

**Overview:**  
This block exposes multiple webhook endpoints enabling external systems or internal processes to trigger functions such as retrieving account data, placing or cancelling orders, and querying order status.

**Nodes Involved:**  
- Multiple Webhook nodes:  
  - Get Account Information Webhook  
  - Get Account Assets Webhook  
  - Get Deposit Address Webhook  
  - Place Order Webhook  
  - Cancel Order Webhook  
  - Get Order Info Webhook  
  - Get Current Orders Webhook  
  - Place Plan Order Webhook  
  - Modify Plan Order Webhook  
  - Cancel Plan Order Webhook  
  - Get Current Plan Orders Webhook

- Corresponding Respond to Webhook nodes  
- Nodes from Block 3 (Add API Keys, Create Signed String, Crypto, HTTP Requests, Format Response) linked downstream from webhook nodes.

**Node Details:**

- **Webhook Nodes**  
  - Type: Webhook nodes  
  - Role: Listen for incoming HTTP requests at specific endpoints corresponding to Bitget API functions.  
  - Configuration: Unique webhook IDs, HTTP methods (mostly POST or GET).  
  - Output: Incoming request data forwarded to authentication and request preparation.

- **Respond to Webhook**  
  - Type: Respond to Webhook nodes  
  - Role: Sends back formatted JSON or text responses after processing API calls.  
  - Edge Cases: Timeout if downstream nodes fail; malformed response data.

- **Downstream API Signing and Request Nodes**  
  - Same as in Block 3, these nodes prepare, sign, and send Bitget API requests based on webhook inputs.

---

#### 2.5 Message Formatting and Telegram Response

**Overview:**  
Processes AI and API responses, formats messages for Telegram, handles splitting of long messages, and sends replies back to the user.

**Nodes Involved:**  
- Splits message is more than 4000 characters  
- Telegram (send node)  
- Set Message  
- Format Response nodes (from API responses)

**Node Details:**

- **Splits message is more than 4000 characters**  
  - Type: Code node  
  - Role: Splits large messages from AI or API to comply with Telegram's 4000-character message limit.  
  - Output: Array of message chunks.

- **Telegram**  
  - Type: Telegram node  
  - Role: Sends messages or message chunks to Telegram users.  
  - Edge Cases: Rate limits, network errors.

- **Set Message**  
  - Prepares outgoing response messages for sending.

- **Format Response**  
  - Formats API results into readable text or JSON to be sent.

---

### 3. Summary Table

| Node Name                           | Node Type                              | Functional Role                               | Input Node(s)                              | Output Node(s)                             | Sticky Note                                                          |
|-----------------------------------|--------------------------------------|-----------------------------------------------|--------------------------------------------|--------------------------------------------|----------------------------------------------------------------------|
| Telegram Trigger                  | Telegram Trigger                     | Entry point for Telegram message reception     | —                                          | User Authentication (Replace Telegram ID) |                                                                      |
| User Authentication (Replace Telegram ID) | Code                               | Authenticates Telegram user by ID              | Telegram Trigger                           | Message Format Selector                     |                                                                      |
| Message Format Selector           | Switch                              | Routes by message type (text, image, sound)    | User Authentication                       | Telegram Image Download, Telegram Sound Download, Set Message |                                                                      |
| Telegram Image Download           | Telegram                            | Downloads images for processing                  | Message Format Selector                    | Get Image Info                             |                                                                      |
| Telegram Sound Download           | Telegram                            | Downloads audio messages for AI processing      | Message Format Selector                    | OpenAI2                                   |                                                                      |
| Set Message                      | Set                                 | Prepares text message for AI agent              | Message Format Selector                    | Bitget AI Trader Agent                     |                                                                      |
| Splits message is more than 4000 characters | Code                            | Splits long messages into Telegram-compatible chunks | Bitget AI Trader Agent                    | Telegram                                   |                                                                      |
| Telegram                        | Telegram                            | Sends messages back to Telegram users            | Splits message is more than 4000 characters | —                                        |                                                                      |
| OpenAI Chat Model (various)       | Langchain LM Chat OpenAI            | Processes natural language inputs with GPT-4o-mini | —                                          | Linked Agent Tools                         |                                                                      |
| Bitget AI Trader Agent            | Langchain Agent                    | Core AI agent orchestrating trading logic       | Set Message, Calculator, Think, etc.      | Splits message is more than 4000 characters | Sticky Note — Bitget AI Trader Agent                                |
| Account and Wallet Agent tool     | Langchain Agent Tool               | Queries account and wallet info via Bitget API  | OpenAI Chat Model1                         | Bitget AI Trader Agent                     | Sticky Note — Account & Wallet Agent Tool                            |
| Spot Order Trading Agent tool     | Langchain Agent Tool               | Executes spot order trading commands             | OpenAI Chat Model2                         | Bitget AI Trader Agent                     | Sticky Note — Spot Order Trading Agent Tool                         |
| Trigger Order Agent tool          | Langchain Agent Tool               | Manages trigger/plan orders                       | OpenAI Chat Model3                         | Bitget AI Trader Agent                     | Sticky Note — Trigger Order Agent Tool                              |
| Calculator (multiple)             | Langchain Tool Calculator          | Performs calculations                             | —                                          | Agent Tools                               | Sticky Note — Calculator Utility                                    |
| Think                           | Langchain ToolThink                | Performs reasoning/thinking steps                 | —                                          | Bitget AI Trader Agent                     | Sticky Note — Think                                                 |
| Simple Memory (multiple)          | Langchain Memory Buffer Window     | Maintains conversation context                    | —                                          | Corresponding Agent Tools                  |                                                                      |
| Add API Keys (multiple)            | Set                               | Adds API keys and request parameters              | Webhook nodes or previous Set nodes       | Create Signed String nodes                  |                                                                      |
| Create Signed String (multiple)   | Code                              | Constructs string to sign for authentication       | Add API Keys                              | Crypto (HMAC-SHA256 → base64)              |                                                                      |
| Crypto (HMAC-SHA256 → base64) (multiple) | Crypto                         | Signs the string with HMAC-SHA256                  | Create Signed String                      | HTTP Request nodes                         |                                                                      |
| HTTP Request nodes (various)      | HTTP Request                      | Sends signed API requests to Bitget                | Crypto nodes                             | Format Response nodes                       |                                                                      |
| Format Response (multiple)         | Code                              | Formats API JSON responses for downstream use      | HTTP Request nodes                       | Respond to Webhook nodes or AI agents      |                                                                      |
| Webhook nodes (various)            | Webhook                           | Provides HTTP endpoints for external/internal triggers | External HTTP requests                   | Add API Keys nodes                         |                                                                      |
| Respond to Webhook nodes (various) | Respond to Webhook                | Returns formatted responses to webhook callers     | Format Response nodes                    | —                                         |                                                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger node**  
   - Set up credentials with Telegram bot.  
   - Configure to receive all incoming messages.

2. **Add a Code node named "User Authentication (Replace Telegram ID)"**  
   - Write JavaScript to verify Telegram user ID against allowed list.  
   - Pass only authenticated messages downstream.

3. **Add a Switch node "Message Format Selector"**  
   - Route messages based on content type: image, audio, or text.

4. **Add Telegram nodes "Telegram Image Download" and "Telegram Sound Download"**  
   - Download media content for images and sounds respectively.

5. **Add a Set node "Set Message"**  
   - Prepare text messages for AI processing.

6. **Add Langchain OpenAI Chat Model nodes (several instances)**  
   - Configure each for GPT-4o-mini with appropriate prompt templates for different agent tools.

7. **Create Langchain Agent nodes:**  
   - **Bitget AI Trader Agent:** Central trading AI logic  
   - **Account and Wallet Agent tool:** For account info  
   - **Spot Order Trading Agent tool:** For spot order management  
   - **Trigger Order Agent tool:** For plan and trigger order management

8. **Add Langchain Tool nodes:**  
   - Calculator nodes for math operations  
   - Think node for reasoning steps  
   - Simple Memory nodes to maintain context per agent/tool

9. **Connect Telegram "Set Message" output to "Bitget AI Trader Agent" input**  
   - Connect AI model outputs and tools appropriately.

10. **Add "Splits message is more than 4000 characters" Code node**  
    - Implement logic to split long text messages into 4000-char chunks.

11. **Add Telegram node to send messages back to users**  
    - Connect output of splitter to Telegram send node.

12. **Create HTTP Request nodes for Bitget API endpoints:**  
    - Get Account Information  
    - Get Account Assets  
    - Get Deposit Address  
    - Place Order  
    - Cancel Order  
    - Get Order Info  
    - Get Current Orders  
    - Place Plan Order  
    - Modify Plan Order  
    - Cancel Plan Order  
    - Get Current Plan Orders

13. **For each HTTP Request, add preceding nodes:**  
    - Set node to add API keys and inputs  
    - Code node to create signed strings (different for GET/POST with/without query)  
    - Crypto node to sign with HMAC-SHA256 and base64 encode

14. **Add Code nodes to format responses for API calls**  
    - Parse JSON, handle errors, and prepare output.

15. **Create Webhook nodes to expose the API functionality externally:**  
    - One webhook for each API function above  
    - Connect to API signing and HTTP request nodes

16. **Add Respond to Webhook nodes to return results back to callers**

17. **Connect all nodes according to the logical flow:**  
    - Telegram Trigger → Authentication → Message Format Selector → (Media download / Set Message) → AI Agents → Message splitting → Telegram send  
    - Webhooks → API signing → HTTP Requests → Format Response → Respond to Webhook

18. **Configure credentials:**  
    - Telegram Bot credentials for Telegram nodes  
    - OpenAI API credentials for Langchain OpenAI nodes  
    - Bitget API Key and Secret credentials securely stored and used in Set nodes for authentication

19. **Test all endpoints and Telegram interactions for correct behavior, error handling, and rate limiting**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                 | Context or Link                                                      |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------|
| Bitget API uses HMAC-SHA256 with base64 encoding for request signing. Proper string construction is critical for authentication success.                     | Bitget API Documentation (official)                               |
| Telegram messages have a 4000-character limit; long AI responses must be split to avoid send errors.                                                         | Telegram Bot API limits                                            |
| The AI agents use Langchain toolkit integrating GPT-4o-mini model for advanced understanding and trading logic.                                              | Langchain Documentation                                            |
| The workflow exposes multiple webhooks for modular access to Bitget API functions, enabling integration with other systems or manual REST calls.             | n8n Webhook node documentation                                    |
| User authentication is enforced by Telegram ID filtering to secure the bot from unauthorized users.                                                         | Telegram user management best practices                            |
| The workflow has sticky notes (in the original editor) to organize sections and provide contextual information on agent tools and API request nodes.          | Useful for maintainers to understand node roles                   |
| For further customization, review Bitget’s API limits and error codes to handle edge cases in HTTP Request nodes.                                            | Bitget API error handling guidelines                              |

---

This reference document fully describes the structure, logic, and details of the "Automate Bitget Spot Trading with GPT-4o-mini AI Agent via Telegram" workflow, enabling reproduction, modification, and troubleshooting by advanced users and automation agents.