AI-Powered E-commerce Customer Support Chatbot with GPT-4 & Supabase

https://n8nworkflows.xyz/workflows/ai-powered-e-commerce-customer-support-chatbot-with-gpt-4---supabase-7256


# AI-Powered E-commerce Customer Support Chatbot with GPT-4 & Supabase

### 1. Workflow Overview

This workflow is an **AI-powered customer support chatbot for e-commerce** platforms, leveraging GPT-4 and Supabase for backend data management. It handles various customer queries including order status, support tickets, and product recommendations. The workflow is designed to:

- Receive and classify user queries using AI.
- Branch logic based on query intent.
- Interact with Supabase databases for order and ticket management.
- Generate unique ticket IDs.
- Retrieve or create support tickets.
- Provide product or category-based recommendations.
- Respond back to the user via webhook with structured or natural language answers.

**Logical blocks:**

- **1.1 Input Reception and Intent Classification:** Receives user input and classifies its intent using AI.
- **1.2 Intent-based Routing:** Routes flow according to the classified intent.
- **1.3 Order Status Handling:** Extracts order details, queries Supabase for order info, and responds.
- **1.4 Support Ticket Management:** Creates new tickets or queries existing ones, including email notifications.
- **1.5 Product Recommendation:** Provides product or category-based recommendations using AI and Supabase.
- **1.6 Response Handling:** Sends appropriate responses back to the user via webhook.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Intent Classification

**Overview:**  
This block captures the incoming HTTP POST request with the user message and classifies the query intent and product mentioned using a GPT-4 powered AI agent.

**Nodes Involved:**  
- Webhook  
- AI Agent  
- Code (JSON parse)  
- Switch  
- Simple Memory1  

**Node Details:**

- **Webhook**  
  - Type: HTTP Webhook (POST)  
  - Role: Entry point receiving user chat messages with session info.  
  - Config: Path set; responds dynamically based on downstream nodes.  
  - Connections: Output to AI Agent node.  
  - Edge Cases: Missing or malformed requests, HTTP errors.

- **AI Agent** (`@n8n/n8n-nodes-langchain.agent`)  
  - Role: Classifies user query into intents (`order_status`, `support_ticket`, `product_recommendation`, `general`) and extracts product names, outputs strict JSON.  
  - Configuration: Custom system prompt with examples; uses input expression `Here is the query of user {{ $json.body.message }}`.  
  - Connections: Output JSON to Code node.  
  - Edge Cases: AI misclassification, invalid JSON output, rate limits on OpenAI API.

- **Code**  
  - Role: Parses AI Agent JSON output into a usable JSON object named `category`.  
  - Config: Parses `output` string to JSON, returns as `category`.  
  - Connections: Output to Switch node.  
  - Edge Cases: JSON parse errors if AI output malformed.

- **Switch**  
  - Role: Routes workflow based on `category.intent` value among 4 possible intents.  
  - Config: Exact string matches for intents: `order_status`, `product_recommendation`, `support_ticket`, `general`.  
  - Connections: Routes to Order Queries, Recommendations, AI Agent1 (support tickets), or Respond to Webhook3 (general).  
  - Edge Cases: Unexpected or missing intents.

- **Simple Memory1**  
  - Role: Maintains conversation context (7 message window) keyed by session_id from webhook.  
  - Connections: AI Agent input memory, enabling context-aware classification.  
  - Edge Cases: Memory overflow or session key missing.

---

#### 1.2 Intent-based Routing

**Overview:**  
This block dispatches the workflow to specialized branches based on the intent determined in 1.1.

**Nodes Involved:**  
- Switch  
- Order Queries (for `order_status`)  
- Recommendations (for `product_recommendation`)  
- AI Agent1 (for `support_ticket`)  
- Respond to Webhook3 (for `general`)  

**Node Details:**

- **Order Queries**: Handles order status queries.  
- **Recommendations**: Handles product/category recommendation queries.  
- **AI Agent1**: Handles support ticket creation or status queries.  
- **Respond to Webhook3**: Returns a generic response for general intent without specific classification.

---

#### 1.3 Order Status Handling

**Overview:**  
Processes order status inquiries by extracting order or product info, querying Supabase orders table, and responding with order status.

**Nodes Involved:**  
- Order Queries (AI Agent)  
- getOrderStatus (Supabase Tool)  
- OpenAI Chat Model1  
- Simple Memory  
- Respond to Webhook  

**Node Details:**

- **Order Queries** (`@n8n/n8n-nodes-langchain.agent`)  
  - Role: Extracts order_id, product, or customer_name; calls `getOrderStatus` tool; generates human-friendly status responses.  
  - Configuration: System prompt instructs detailed extraction and tool calling logic; input message tied to webhook user query.  
  - Connections: Calls getOrderStatus, then OpenAI Chat Model1 for response generation, then Respond to Webhook.  
  - Edge Cases: Missing order_id/product, Supabase query failures.

- **getOrderStatus** (Supabase Tool)  
  - Role: Queries Supabase `orders` table filtering by `order_id` or product.  
  - Credentials: Supabase API credentials.  
  - Edge Cases: Data not found, connection failures.

- **OpenAI Chat Model1**  
  - Role: Generates natural language response about order status using GPT-4o-mini.  
  - Credentials: OpenAI API.  
  - Edge Cases: API rate limits, response delays.

- **Simple Memory**  
  - Role: Maintains context of order query session with 7-turn window keyed by session_id.

- **Respond to Webhook**  
  - Role: Sends final order status response JSON back to the user.  
  - Configuration: Cleans whitespace and formats string response.

---

#### 1.4 Support Ticket Management

**Overview:**  
Manages support ticket creation and status checks by interacting with Supabase support_tickets table, generates unique ticket IDs, and notifies support team via email.

**Nodes Involved:**  
- AI Agent1 (Support Ticket AI Agent)  
- Code Tool (ticket ID generator)  
- createSupportTicket (Supabase Tool)  
- getTicketStatus (Supabase Tool)  
- Send (Gmail Tool)  
- handle support tickets (OpenAI Chat Model)  
- Simple Memory2  
- Respond to Webhook2  

**Node Details:**

- **AI Agent1** (`@n8n/n8n-nodes-langchain.agent`)  
  - Role: Handles support ticket creation or status queries with multi-step logic including info gathering, ticket ID generation, and tool calls.  
  - Configuration: Detailed multi-purpose system prompt instructing extraction of user_email, product, issue, ticket_id. Calls Code Tool for ticket ID. Calls createSupportTicket or getTicketStatus accordingly.  
  - Connections: Calls Code Tool, createSupportTicket, getTicketStatus, sends email via Send node, outputs final user message.  
  - Edge Cases: Missing user email, invalid ticket IDs, API failures, email sending failures.

- **Code Tool** (`@n8n/n8n-nodes-langchain.toolCode`)  
  - Role: Generates unique support ticket IDs in format `TKT-YYYYMMDD-RANDOM4DIGITS`.  
  - Edge Cases: Date/time sync issues, code collisions (very unlikely).

- **createSupportTicket** (Supabase Tool)  
  - Role: Inserts new support ticket record with collected fields and status "open".  
  - Credentials: Supabase API.  
  - Edge Cases: Database write failures.

- **getTicketStatus** (Supabase Tool)  
  - Role: Retrieves support ticket status/details by `ticket_id`.  
  - Credentials: Supabase API.  
  - Edge Cases: Ticket ID not found, query errors.

- **Send** (Gmail Tool)  
  - Role: Sends email notification to support team when a new ticket is created.  
  - Credentials: Gmail OAuth2.  
  - Edge Cases: SMTP or OAuth errors, email address issues.

- **handle support tickets** (OpenAI Chat Model)  
  - Role: NLP model used internally by AI Agent1 to interpret and generate responses.  
  - Credentials: OpenAI API.

- **Simple Memory2**  
  - Role: Maintains conversation context for support ticket interactions keyed by session_id.

- **Respond to Webhook2**  
  - Role: Sends final support ticket related responses back to the user in JSON format.

---

#### 1.5 Product Recommendation

**Overview:**  
Handles product or category recommendation queries by extracting relevant information, querying Supabase, and returning suggested items.

**Nodes Involved:**  
- Recommendations (AI Agent)  
- getProductRecommendations (Supabase Tool)  
- getCategoryRecommendations (Supabase Tool)  
- OpenAI Chat Model2  
- Simple Memory3  
- Respond to Webhook1  

**Node Details:**

- **Recommendations** (`@n8n/n8n-nodes-langchain.agent`)  
  - Role: Parses user input to identify if recommendation is product-based or category-based; calls appropriate Supabase tools accordingly.  
  - Configuration: System message defines rules for input interpretation and tool invocation; waits for tool response before replying.  
  - Connections: Calls getProductRecommendations or getCategoryRecommendations; outputs result via Respond to Webhook1.  
  - Edge Cases: Missing product/category info, ambiguous queries.

- **getProductRecommendations** (Supabase Tool)  
  - Role: Queries Supabase `products` table filtered by product name.  
  - Credentials: Supabase API.

- **getCategoryRecommendations** (Supabase Tool)  
  - Role: Queries Supabase `products` table filtered by category name.  
  - Credentials: Supabase API.

- **OpenAI Chat Model2**  
  - Role: Generates natural language responses presenting recommended products.  
  - Credentials: OpenAI API.

- **Simple Memory3**  
  - Role: Stores session context for recommendation conversations.

- **Respond to Webhook1**  
  - Role: Sends product recommendation results back to the user as JSON.

---

#### 1.6 Response Handling

**Overview:**  
Finalizes communication by sending AI-generated or processed responses back to the user via webhook response nodes, formatted as JSON.

**Nodes Involved:**  
- Respond to Webhook  
- Respond to Webhook1  
- Respond to Webhook2  
- Respond to Webhook3  

**Node Details:**

- **Respond to Webhook** (multiple instances)  
  - Role: Return JSON responses to the incoming webhook request.  
  - Configuration: Cleans and formats output strings or JSON stringifies structured data.  
  - Edge Cases: Response timeout, malformed output from upstream nodes.

---

### 3. Summary Table

| Node Name            | Node Type                               | Functional Role                         | Input Node(s)           | Output Node(s)             | Sticky Note                                                                                      |
|----------------------|---------------------------------------|---------------------------------------|------------------------|----------------------------|------------------------------------------------------------------------------------------------|
| Webhook              | n8n-nodes-base.webhook                 | Entry point receiving user messages   | -                      | AI Agent                   |                                                                                                |
| AI Agent             | @n8n/n8n-nodes-langchain.agent        | Classifies intent and extracts product| Webhook                 | Code                       |                                                                                                |
| Code                 | n8n-nodes-base.code                    | Parses AI JSON output                  | AI Agent                | Switch                     |                                                                                                |
| Switch               | n8n-nodes-base.switch                  | Routes by intent                      | Code                    | Order Queries, Recommendations, AI Agent1, Respond to Webhook3 | Sticky Note: "order_status\nproduct_recommendations\nsupport_ticket"                            |
| Simple Memory1       | @n8n/n8n-nodes-langchain.memoryBufferWindow | Maintains session memory for AI Agent | -                      | AI Agent                   |                                                                                                |
| Order Queries        | @n8n/n8n-nodes-langchain.agent        | Handles order status queries           | Switch                  | getOrderStatus             |                                                                                                |
| getOrderStatus       | n8n-nodes-base.supabaseTool            | Queries order info from Supabase       | Order Queries           | Order Queries              |                                                                                                |
| OpenAI Chat Model1   | @n8n/n8n-nodes-langchain.lmChatOpenAi | Generates order status response        | getOrderStatus          | Respond to Webhook         |                                                                                                |
| Simple Memory        | @n8n/n8n-nodes-langchain.memoryBufferWindow | Maintains context for order queries    | -                      | Order Queries              |                                                                                                |
| Respond to Webhook   | n8n-nodes-base.respondToWebhook        | Sends order status response            | OpenAI Chat Model1      | -                          |                                                                                                |
| AI Agent1            | @n8n/n8n-nodes-langchain.agent        | Manages support ticket creation/status| Switch                  | Respond to Webhook2        |                                                                                                |
| Code Tool            | @n8n/n8n-nodes-langchain.toolCode     | Generates unique ticket IDs            | AI Agent1               | AI Agent1                  |                                                                                                |
| createSupportTicket  | n8n-nodes-base.supabaseTool            | Inserts support ticket in Supabase     | AI Agent1               | AI Agent1                  |                                                                                                |
| getTicketStatus      | n8n-nodes-base.supabaseTool            | Retrieves ticket status by ID          | AI Agent1               | AI Agent1                  |                                                                                                |
| Send                 | n8n-nodes-base.gmailTool               | Sends email notification for new ticket| AI Agent1               | -                          |                                                                                                |
| handle support tickets| @n8n/n8n-nodes-langchain.lmChatOpenAi | AI model used by AI Agent1              | -                      | AI Agent1                  |                                                                                                |
| Simple Memory2       | @n8n/n8n-nodes-langchain.memoryBufferWindow | Maintains session context for support tickets| -                  | AI Agent1                  |                                                                                                |
| Respond to Webhook2  | n8n-nodes-base.respondToWebhook        | Sends support ticket response          | AI Agent1               | -                          |                                                                                                |
| Recommendations     | @n8n/n8n-nodes-langchain.agent        | Handles product/category recommendations| Switch                  | Respond to Webhook1        |                                                                                                |
| getProductRecommendations | n8n-nodes-base.supabaseTool         | Queries product recommendations        | Recommendations         | Recommendations            |                                                                                                |
| getCategoryRecommendations | n8n-nodes-base.supabaseTool         | Queries category recommendations       | Recommendations         | Recommendations            |                                                                                                |
| OpenAI Chat Model2   | @n8n/n8n-nodes-langchain.lmChatOpenAi | Generates recommendation responses     | getProductRecommendations, getCategoryRecommendations | Respond to Webhook1 |                                                                                                |
| Simple Memory3       | @n8n/n8n-nodes-langchain.memoryBufferWindow | Maintains session context for recommendations| -                  | Recommendations            |                                                                                                |
| Respond to Webhook1  | n8n-nodes-base.respondToWebhook        | Sends product recommendation response  | Recommendations         | -                          |                                                                                                |
| Respond to Webhook3  | n8n-nodes-base.respondToWebhook        | Sends generic response for 'general' intent| Switch              | -                          |                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: `Webhook`  
   - HTTP Method: POST  
   - Path: e.g., `4cdaa2e9-be46-4f60-83f6-8d7bd4a6ad5d`  
   - No authentication  
   - Set response mode to wait for response node.

2. **Create AI Agent Node (Intent Classifier)**  
   - Type: `@n8n/n8n-nodes-langchain.agent`  
   - Input: Expression `Here is the query of user {{ $json.body.message }}`  
   - System prompt: Detailed classification system message with intents and examples (as described in 2.1).  
   - Prompt Type: Define  
   - Connect Webhook output to this node input.

3. **Create Code Node (JSON Parser)**  
   - Type: `Code`  
   - JavaScript code:  
     ```js
     response = JSON.parse($input.first().json.output);
     return { category: response };
     ```  
   - Connect AI Agent output to Code input.

4. **Create Switch Node (Intent Router)**  
   - Type: `Switch`  
   - Rules: Match `category.intent` equals one of `order_status`, `product_recommendation`, `support_ticket`, `general`.  
   - Connect Code output to Switch input.

5. **Create Simple Memory Node (Context for Intent Classifier)**  
   - Type: `@n8n/n8n-nodes-langchain.memoryBufferWindow`  
   - Session key: `={{ $json.body.session_id }}`  
   - Context window length: 7  
   - Connect node to AI Agent’s ai_memory input.

6. **Build Order Status Branch:**

   6.1. **Order Queries AI Agent**  
   - Type: `@n8n/n8n-nodes-langchain.agent`  
   - System message: Detailed prompt to extract order_id/product/customer_name and call getOrderStatus tool.  
   - Input expression: `=The query of the user is this .{{ $('Webhook').item.json.body.message }}`  
   - Connect Switch `order_status` output to this node.

   6.2. **Supabase getOrderStatus Node**  
   - Type: `Supabase Tool`  
   - Table: `orders`  
   - Operation: `get`  
   - Filter: By `order_id` or `product` extracted from AI Agent.  
   - Credentials: Supabase API credentials.  
   - Connect Order Queries output to this node.

   6.3. **OpenAI Chat Model1**  
   - Type: `@n8n/n8n-nodes-langchain.lmChatOpenAi`  
   - Model: `gpt-4o-mini`  
   - Credentials: OpenAI API  
   - Connect getOrderStatus output to this node.

   6.4. **Simple Memory for Order Queries**  
   - Type: `@n8n/n8n-nodes-langchain.memoryBufferWindow`  
   - Session key: `={{ $('Webhook').item.json.body.session_id }}`  
   - Context window length: 7  
   - Connect to Order Queries ai_memory input.

   6.5. **Respond to Webhook Node**  
   - Type: `Respond to Webhook`  
   - Response body: JSON with cleaned AI output string.  
   - Connect OpenAI Chat Model1 output to this node.

7. **Build Support Ticket Branch:**

   7.1. **AI Agent1 (Support Ticket Handler)**  
   - Type: `@n8n/n8n-nodes-langchain.agent`  
   - System message: Detailed instructions on ticket creation, status checking, info gathering, calling Code Tool, createSupportTicket, getTicketStatus.  
   - Input: User message from webhook.  
   - Connect Switch `support_ticket` output.

   7.2. **Code Tool (Ticket ID Generator)**  
   - Type: `@n8n/n8n-nodes-langchain.toolCode`  
   - JS code:  
     ```js
     const now = new Date();
     const dateStr = now.toISOString().slice(0,10).replace(/-/g, '');
     const random = Math.floor(1000 + Math.random() * 9000);
     const ticket_id = `TKT-${dateStr}-${random}`;
     return ticket_id;
     ```  
   - Connect AI Agent1 `ai_tool` output to Code Tool.

   7.3. **createSupportTicket (Supabase Tool)**  
   - Type: `Supabase Tool`  
   - Table: `support_tickets`  
   - Operation: `insert` (create)  
   - Fields: ticket_id, user_email, product, issue, status = "open" (all from AI Agent1 fields)  
   - Credentials: Supabase API  
   - Connect AI Agent1 `ai_tool` output.

   7.4. **getTicketStatus (Supabase Tool)**  
   - Type: `Supabase Tool`  
   - Table: `support_tickets`  
   - Operation: `get`  
   - Filter by ticket_id  
   - Credentials: Supabase API  
   - Connect AI Agent1 `ai_tool` output.

   7.5. **Send (Gmail Tool)**  
   - Type: `gmailTool`  
   - Send to support team email (e.g. `seharn314@gmail.com`)  
   - Subject: `New Support Ticket Created - {{ticket_id}}`  
   - Message: Includes user_email, product, issue  
   - Credentials: Gmail OAuth2  
   - Connect AI Agent1 `ai_tool` output.

   7.6. **handle support tickets (OpenAI Chat Model)**  
   - Type: `@n8n/n8n-nodes-langchain.lmChatOpenAi`  
   - Model: `gpt-4o-mini`  
   - Credentials: OpenAI API  
   - Support AI Agent1’s internal NLP.

   7.7. **Simple Memory2**  
   - Type: `@n8n/n8n-nodes-langchain.memoryBufferWindow`  
   - Session key: `={{ $('Webhook').item.json.body.session_id }}`  
   - Connect to AI Agent1 ai_memory input.

   7.8. **Respond to Webhook2**  
   - Type: `Respond to Webhook`  
   - Sends JSON response with ticket status or creation confirmation.

8. **Build Product Recommendation Branch:**

   8.1. **Recommendations AI Agent**  
   - Type: `@n8n/n8n-nodes-langchain.agent`  
   - System message: Instructions to detect product/category recommendation requests and call corresponding Supabase tools.  
   - Input: User message from webhook.  
   - Connect Switch `product_recommendation` output.

   8.2. **getProductRecommendations (Supabase Tool)**  
   - Table: `products`  
   - Operation: `get`  
   - Filter by product name  
   - Credentials: Supabase API  
   - Connect Recommendations `ai_tool` output.

   8.3. **getCategoryRecommendations (Supabase Tool)**  
   - Table: `products`  
   - Operation: `get`  
   - Filter by category name  
   - Credentials: Supabase API  
   - Connect Recommendations `ai_tool` output.

   8.4. **OpenAI Chat Model2**  
   - Type: `@n8n/n8n-nodes-langchain.lmChatOpenAi`  
   - Model: `gpt-4o-mini`  
   - Credentials: OpenAI API  
   - Connect from both Supabase tools to this node.

   8.5. **Simple Memory3**  
   - Type: `@n8n/n8n-nodes-langchain.memoryBufferWindow`  
   - Session key: `={{ $('Webhook').item.json.body.session_id }}`  
   - Connect to Recommendations ai_memory input.

   8.6. **Respond to Webhook1**  
   - Type: `Respond to Webhook`  
   - Sends product recommendations JSON back.

9. **Build General Intent Response:**

   9.1. **Respond to Webhook3**  
   - Sends a polite generic response in JSON format showing the `product` field from classification.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                    | Context or Link                                      |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| The workflow uses GPT-4o-mini model for all AI language generation and classification tasks to balance cost and performance.                                                  | OpenAI GPT-4o-mini model                             |
| Ticket ID format is `TKT-YYYYMMDD-RANDOM4DIGITS` generated via custom JavaScript code node to ensure uniqueness without external dependencies.                                | Code Tool node                                       |
| Supabase is used as the primary database for storing orders, support tickets, and product catalog for recommendations.                                                        | Supabase API credentials                             |
| Gmail OAuth2 credentials must be configured for sending support ticket notification emails.                                                                                    | Gmail OAuth2 integration                             |
| Sticky Note reminder on Switch node: handles main intents "order_status", "product_recommendations", and "support_ticket".                                                   | Sticky Note near Switch node                         |
| The workflow maintains session context across user conversations using `memoryBufferWindow` nodes keyed by `session_id`. This improves AI context and response relevance.     | Simple Memory nodes                                  |
| System prompts are crafted to require strict JSON format outputs from AI to facilitate seamless parsing and routing in the workflow.                                         | System message details in AI Agent nodes             |
| Ensure all Supabase tables (`orders`, `support_tickets`, `products`) are structured to support the fields queried and inserted by the workflow.                              | Supabase table schema requirements                   |
| For troubleshooting, check OpenAI API usage limits and Supabase connection health to avoid timeouts or failures in live user sessions.                                       | API and DB monitoring                                |

---

**Disclaimer:**  
The provided text and workflow represent an automation built exclusively with the n8n platform, strictly adhering to content policies. It contains no illegal, offensive, or protected material. All data handled is public and lawful.