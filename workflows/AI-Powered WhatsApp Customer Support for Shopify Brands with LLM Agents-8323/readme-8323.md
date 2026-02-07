AI-Powered WhatsApp Customer Support for Shopify Brands with LLM Agents

https://n8nworkflows.xyz/workflows/ai-powered-whatsapp-customer-support-for-shopify-brands-with-llm-agents-8323


# AI-Powered WhatsApp Customer Support for Shopify Brands with LLM Agents

---

### 1. Workflow Overview

This workflow, titled **"🚀 AI-Powered WhatsApp Customer Support for Shopify Brands"**, is designed to automate and streamline customer support interactions over WhatsApp for Shopify-based e-commerce stores. It leverages large language models (LLMs) and API integrations to:

- Receive and categorize customer messages from WhatsApp.
- Retrieve customer profile and order data from Shopify.
- Provide intelligent responses about order status and product availability.
- Escalate complex or unsupported queries to a human support team via Slack.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Customer Identification**  
  Captures incoming WhatsApp messages and identifies the customer in Shopify using their WhatsApp number.

- **1.2 Input Normalization and Intent Classification**  
  Cleans and categorizes the incoming messages into distinct intent categories such as greetings, order status, product queries, or support requests.

- **1.3 Intent Routing via Switch Node**  
  Routes the flow based on the classified intent to dedicated agents or actions.

- **1.4 Order Status Handling (Orders Agent)**  
  Uses a LangChain agent combined with Shopify API calls to retrieve order status and send detailed WhatsApp replies.

- **1.5 Product Availability Handling (Products Agent)**  
  Invokes Shopify APIs to fetch and filter product inventory data, then uses a LangChain agent to formulate WhatsApp messages listing in-stock items.

- **1.6 Support Escalation**  
  Sends unresolved or support-related queries to a Slack channel for human customer support intervention.

- **1.7 Message Sending and No-Op Endings**  
  Sends WhatsApp messages for welcome, order status, and product info; includes no-operation nodes to gracefully end branches.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Input Reception and Customer Identification

**Overview:**  
This block listens for incoming WhatsApp messages, extracts sender information, and fetches customer details from Shopify to personalize subsequent interactions.

**Nodes Involved:**  
- WhatsApp Trigger  
- Get Customer from Shopify  
- Customer Details  

**Node Details:**

- **WhatsApp Trigger**  
  - Type: `whatsAppTrigger`  
  - Role: Listens for new incoming WhatsApp messages (webhook).  
  - Config: Triggers on message updates only; uses OAuth credentials for WhatsApp API.  
  - Inputs: Webhook event from WhatsApp API.  
  - Outputs: JSON containing message text, sender ID, and metadata.  
  - Failure Modes: OAuth token expiry, webhook misconfiguration, connectivity issues.

- **Get Customer from Shopify**  
  - Type: `httpRequest`  
  - Role: Queries Shopify Admin API to find customer profile by WhatsApp phone number.  
  - Config: Uses Shopify Admin API endpoint `/customers/search.json` with query parameter `phone:<wa_id>` extracted from WhatsApp contact. Authenticated via HTTP header token.  
  - Inputs: WhatsApp sender ID from previous node.  
  - Outputs: Customer JSON data including name and last order ID.  
  - Failure Modes: API rate limits, invalid token, no customer found, malformed phone number.  
  - Sticky Note: "**Get Customer details from shopify** retrieves user information based on their WhatsApp number. It fetches profile and order-related data from Shopify to identify the customer. The details are then normalized..."

- **Customer Details**  
  - Type: `set` node  
  - Role: Normalizes and extracts key customer details into standardized fields for downstream use.  
  - Config: Sets variables `customerID`, `customerName`, `lastOrderID`, and `CustomerPhone` from Shopify response and WhatsApp trigger.  
  - Inputs: Shopify customer search response.  
  - Outputs: JSON with normalized customer info.  
  - Failure Modes: Missing or empty customer data arrays.  

---

#### 2.2 Input Normalization and Intent Classification

**Overview:**  
Prepares the raw customer message text for processing by cleaning, normalizing, and categorizing the input into defined intents.

**Nodes Involved:**  
- Normalize Input  
- Switch  

**Node Details:**

- **Normalize Input**  
  - Type: `set` node  
  - Role: Processes incoming message text to lowercase, trims whitespace, removes punctuation (except `#`), and categorizes the text into intents (`Starter`, `Order status`, `Products`, `Support`).  
  - Key Logic: Uses JavaScript expressions with regex matching to classify messages by keywords and patterns (e.g., order status keywords, product queries, greetings).  
  - Inputs: Customer message text from WhatsApp trigger and customer details node.  
  - Outputs: Adds normalized text and intent category to JSON (`categorized` field).  
  - Failure Modes: Expression errors, unexpected message formats, empty messages.  
  - Sticky Note: "**Normalize Input** ensures user queries are cleaned, standardized, and free of noise. It also categorizes the input, preparing it for accurate intent detection..."

- **Switch**  
  - Type: `switch` node  
  - Role: Routes workflow based on the normalized `categorized` field: `"Starter"`, `"Order status"`, `"Products"`, or `"Support"`.  
  - Config: Four outputs for the four categories; fallback directs to Support.  
  - Inputs: Normalized and categorized message JSON.  
  - Outputs: Routes to welcome message, order agent, product agent, or support escalation nodes.  
  - Failure Modes: Unmatched categories, expression evaluation errors.

---

#### 2.3 Welcome Message Block

**Overview:**  
Handles greeting messages by sending a personalized welcome response to the customer.

**Nodes Involved:**  
- Welcome message  
- No Operation, do nothing3  

**Node Details:**

- **Welcome message**  
  - Type: `whatsApp` node  
  - Role: Sends a personalized greeting message via WhatsApp using customer's name.  
  - Config: Message template: `"Hello {{ customerName }}! Welcome. How can I assist you today?"`  
  - Inputs: Customer name from `Customer Details` node, recipient phone from WhatsApp trigger.  
  - Outputs: Sends message; proceeds to no-op.  
  - Failure Modes: WhatsApp API errors, invalid phone numbers.  
  - Sticky Note: Includes welcome message screenshot preview.

- **No Operation, do nothing3**  
  - Type: `noOp` node  
  - Role: Ends this branch gracefully without further action.

---

#### 2.4 Order Status Handling Block

**Overview:**  
Processes order status queries by calling Shopify APIs via an LLM agent, parsing order fulfillment data, and sending detailed status updates through WhatsApp.

**Nodes Involved:**  
- Orders Agent  
- Get Customer Orders  
- Structured Output Parser  
- Send Order Status  
- No Operation, do nothing2  

**Node Details:**

- **Orders Agent**  
  - Type: `langchain.agent`  
  - Role: Acts as an AI assistant to interpret user queries about orders and call tools to fetch order data.  
  - Config: Uses system prompt describing task and response format; uses fallback if needed; applies structured output parsing.  
  - Inputs: User message text from WhatsApp trigger.  
  - Outputs: Parsed structured JSON including order status and tracking URL.  
  - Failure Modes: API call failures, unexpected Shopify data structures, parsing errors.

- **Get Customer Orders**  
  - Type: `httpRequestTool`  
  - Role: Fetches orders for a customer from Shopify Admin API `/customers/{customerID}/orders.json`.  
  - Config: Uses customerID from `Customer Details`; authenticated with Shopify token.  
  - Inputs: Triggered as a tool by Orders Agent.  
  - Outputs: JSON array of orders with fulfillment details.  

- **Structured Output Parser**  
  - Type: `langchain.outputParserStructured`  
  - Role: Ensures the agent’s response adheres to a JSON schema with `status` and `tracking_url` fields.  
  - Inputs: Raw agent output.  
  - Outputs: Clean structured JSON for downstream use.

- **Send Order Status**  
  - Type: `whatsApp` node  
  - Role: Sends a formatted WhatsApp message to the customer with order status and tracking link, using customer name and parsed order info.  
  - Message Template:  
    ```
    Hi {customerName},
    I’ve checked your order and it is currently {status} 🚚.
    You can follow its journey anytime using this link: {tracking_url}.
    Thank you for your patience — your package is on the way! 💙
    ```  
  - Inputs: Parsed order info and customer details.  
  - Outputs: WhatsApp message sent.  
  - Failure Modes: WhatsApp API errors, missing order data.  
  - Sticky Note: Includes order status WhatsApp message preview.

- **No Operation, do nothing2**  
  - Type: `noOp` node  
  - Role: Ends this branch.

---

#### 2.5 Product Availability Handling Block

**Overview:**  
Handles product-related queries by fetching product data from Shopify, filtering for availability, and composing WhatsApp responses listing available sizes and products.

**Nodes Involved:**  
- Products Agent  
- Get Products from Shopify  
- Structured Output Parser1  
- Send Products message  
- No Operation, do nothing1  

**Node Details:**

- **Products Agent**  
  - Type: `langchain.agent`  
  - Role: AI assistant that interprets product availability queries, calls the Shopify products API tool, filters data, and formats the reply.  
  - Config: Extended system prompt detailing roles, tools, policies, and strict output format. Uses fallback and output parsing.  
  - Inputs: User message text from WhatsApp trigger.  
  - Outputs: Structured JSON list of products with sizes in stock.  
  - Failure Modes: API failures, filtering logic errors, no matching products.

- **Get Products from Shopify**  
  - Type: `httpRequestTool`  
  - Role: Retrieves product catalog from Shopify Admin API `/products.json`.  
  - Config: Authenticated with Shopify token.  
  - Inputs: Invoked by Products Agent as a tool.  
  - Outputs: JSON array of products with variants, inventory, tags, etc.

- **Structured Output Parser1**  
  - Type: `langchain.outputParserStructured`  
  - Role: Validates agent output to conform to expected JSON array with product names and sizes.  
  - Inputs: Raw agent output.  
  - Outputs: Structured JSON for messaging.

- **Send Products message**  
  - Type: `whatsApp` node  
  - Role: Sends a WhatsApp message listing available products and sizes, formatted for readability.  
  - Message Template: Starts with greeting, then lists products with sizes or out-of-stock note.  
  - Inputs: Structured product list from agent output.  
  - Outputs: WhatsApp message sent.  
  - Failure Modes: WhatsApp API errors, empty product list.  
  - Sticky Note: Includes product info WhatsApp message preview.

- **No Operation, do nothing1**  
  - Type: `noOp` node  
  - Role: Ends this branch.

---

#### 2.6 Support Escalation Block

**Overview:**  
Routes queries categorized under “Support” to a human team via Slack messaging for manual handling.

**Nodes Involved:**  
- Send a message to support  
- No Operation, do nothing  

**Node Details:**

- **Send a message to support**  
  - Type: `slack` node  
  - Role: Posts the original customer WhatsApp message text to a designated Slack channel for customer support.  
  - Config: Posts as the customer name user, to specific Slack channel ID, disables workflow link inclusion.  
  - Credentials: Slack OAuth credentials.  
  - Inputs: Original WhatsApp message text and customer name.  
  - Outputs: Slack message posted successfully.  
  - Failure Modes: Slack API rate limit, auth errors, invalid channel ID.  
  - Sticky Note: Includes Slack message screenshot preview.

- **No Operation, do nothing**  
  - Type: `noOp` node  
  - Role: Ends this branch.

---

### 3. Summary Table

| Node Name                  | Node Type                       | Functional Role                              | Input Node(s)                | Output Node(s)                 | Sticky Note                                                     |
|----------------------------|--------------------------------|----------------------------------------------|------------------------------|-------------------------------|----------------------------------------------------------------|
| WhatsApp Trigger           | whatsAppTrigger                | Receives incoming WhatsApp messages          | —                            | Get Customer from Shopify      | "**WhatsApp Trigger** listens for incoming customer messages on WhatsApp..." |
| Get Customer from Shopify  | httpRequest                   | Fetches customer profile from Shopify        | WhatsApp Trigger             | Customer Details               | "**Get Customer details from shopify** retrieves user information based on their WhatsApp number..." |
| Customer Details           | set                           | Normalizes and extracts customer info        | Get Customer from Shopify    | Normalize Input               |                                                                |
| Normalize Input            | set                           | Cleans and categorizes user input             | Customer Details             | Switch                       | "**Normalize Input** ensures user queries are cleaned, standardized..."   |
| Switch                    | switch                        | Routes flow based on user intent              | Normalize Input              | Welcome message, Orders Agent, Products Agent, Send a message to support |                                                                |
| Welcome message            | whatsApp                      | Sends personalized welcome message            | Switch ("Starter" output)    | No Operation, do nothing3     | Welcome message screenshot preview                             |
| No Operation, do nothing3  | noOp                         | Ends welcome message branch                    | Welcome message              | —                            |                                                                |
| Orders Agent               | langchain.agent               | Manages order status queries and API calls    | Switch ("OrderStatusQuery")  | Send Order Status            |                                                                |
| Get Customer Orders        | httpRequestTool               | Fetches customer's orders from Shopify        | Orders Agent (tool)          | Orders Agent (tool output)     |                                                                |
| Structured Output Parser   | langchain.outputParserStructured | Parses order status response into JSON      | Orders Agent                 | Send Order Status            |                                                                |
| Send Order Status          | whatsApp                      | Sends order status update to customer         | Structured Output Parser     | No Operation, do nothing2     | Order status WhatsApp message preview                          |
| No Operation, do nothing2  | noOp                         | Ends order status branch                        | Send Order Status            | —                            |                                                                |
| Products Agent             | langchain.agent               | Handles product availability queries          | Switch ("ProductsQuery")     | Send Products message        |                                                                |
| Get Products from Shopify  | httpRequestTool               | Retrieves product catalog from Shopify        | Products Agent (tool)        | Products Agent (tool output)   |                                                                |
| Structured Output Parser1  | langchain.outputParserStructured | Parses product availability response         | Products Agent               | Send Products message        |                                                                |
| Send Products message      | whatsApp                      | Sends product availability info to customer   | Structured Output Parser1    | No Operation, do nothing1     | Products info WhatsApp message preview                         |
| No Operation, do nothing1  | noOp                         | Ends product info branch                        | Send Products message        | —                            |                                                                |
| Send a message to support  | slack                        | Posts unresolved queries to Slack support     | Switch ("SupportQuery")      | No Operation, do nothing      | Slack message screenshot preview                              |
| No Operation, do nothing   | noOp                         | Ends support escalation branch                  | Send a message to support    | —                            |                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "WhatsApp Trigger" node**  
   - Type: `whatsAppTrigger`  
   - Configure webhook to trigger on message updates.  
   - Set credentials with WhatsApp OAuth account.  

2. **Create "Get Customer from Shopify" node**  
   - Type: `httpRequest`  
   - Method: GET  
   - URL: `https://<YourStore>.myshopify.com/admin/api/2025-07/customers/search.json`  
   - Query Parameter: `query=phone:{{ $json.contacts[0].wa_id }}`  
   - Authentication: HTTP Header Auth with Shopify Admin API token.  
   - Connect input from "WhatsApp Trigger".

3. **Create "Customer Details" node**  
   - Type: `set`  
   - Assign:  
     - `customerID` = `{{$json.customers[0].id}}`  
     - `customerName` = `{{$json.customers[0].first_name}} {{$json.customers[0].last_name}}`  
     - `lastOrderID` = `{{$json.customers[0].last_order_id}}`  
     - `CustomerPhone` = `{{$('WhatsApp Trigger').item.json.contacts[0].wa_id}}`  
   - Connect input from "Get Customer from Shopify".

4. **Create "Normalize Input" node**  
   - Type: `set`  
   - Assign:  
     - `normalized`: Lowercase, trimmed, punctuation-removed message text (except `#`).  
     - `messages[0].text.body`: Lowercase, trimmed, punctuation-removed original message text.  
     - `categorized`: Use JavaScript with regex to classify message into `"Starter"`, `"Order status"`, `"Products"`, or `"Support"`.  
   - Connect input from "Customer Details".

5. **Create "Switch" node**  
   - Type: `switch`  
   - Rules: Match `{{$json.categorized}}` exactly to one of: `"Starter"`, `"Order status"`, `"Products"`, `"Support"`.  
   - Fallback: outputs to `"Support"` branch.  
   - Connect input from "Normalize Input".

6. **Create Welcome Message Branch**  
   - Node: "Welcome message" (`whatsApp`)  
   - Parameters:  
     - Text: `"Hello {{ $json.customerName }}! Welcome. How can I assist you today?"`  
     - Recipient: Phone number from WhatsApp Trigger contacts.  
     - Credentials: WhatsApp API token.  
   - Connect from Switch output `"Starter"`.  
   - Add "No Operation, do nothing3" (`noOp`) connected after.

7. **Create Order Status Branch**  
   - Node: "Orders Agent" (`langchain.agent`)  
     - Text: Original WhatsApp message.  
     - System Prompt: Define order status assistant with instructions for API calls and response formatting.  
     - Enable fallback and output parser.  
   - Node: "Get Customer Orders" (`httpRequestTool`)  
     - URL: `https://<YourStore>.myshopify.com/admin/api/2025-07/customers/{{ $json.customerID }}/orders.json`  
     - Authentication: Shopify token.  
     - Connected as tool node to Orders Agent.  
   - Node: "Structured Output Parser" (`langchain.outputParserStructured`)  
     - JSON schema: `{ "status": "fulfilled", "tracking_url": "/123254" }`  
   - Node: "Send Order Status" (`whatsApp`)  
     - Text: Personalized message including customer name, order status, and tracking URL.  
     - Credentials: WhatsApp API token.  
   - Node: "No Operation, do nothing2" (`noOp`) connected after.  
   - Connect Switch output `"OrderStatusQuery"` to "Orders Agent".

8. **Create Product Availability Branch**  
   - Node: "Products Agent" (`langchain.agent`)  
     - Text: Original WhatsApp message.  
     - System Prompt: Detailed instructions to filter Shopify products, variants, tags, and format reply.  
     - Enable fallback and output parser.  
   - Node: "Get Products from Shopify" (`httpRequestTool`)  
     - URL: `https://<YourStore>.myshopify.com/admin/api/2025-07/products.json`  
     - Authentication: Shopify token.  
     - Connected as tool node to Products Agent.  
   - Node: "Structured Output Parser1" (`langchain.outputParserStructured`)  
     - JSON schema example: array of product objects with `productName` and `sizes`.  
   - Node: "Send Products message" (`whatsApp`)  
     - Text: Dynamic message listing products and available sizes or out-of-stock notice.  
     - Credentials: WhatsApp API token.  
   - Node: "No Operation, do nothing1" (`noOp`) connected after.  
   - Connect Switch output `"ProductsQuery"` to "Products Agent".

9. **Create Support Escalation Branch**  
   - Node: "Send a message to support" (`slack`)  
     - Text: Forward the original customer message.  
     - Channel ID: Slack customer support channel.  
     - Send as user: Customer name from Shopify data.  
     - Credentials: Slack OAuth.  
   - Node: "No Operation, do nothing" (`noOp`) connected after.  
   - Connect Switch output `"SupportQuery"` and fallback to this node.

10. **Credential Setup**  
    - WhatsApp OAuth for trigger and message sending nodes.  
    - Shopify Admin API token for HTTP request nodes.  
    - OpenAI or OpenRouter API keys for LangChain agents (as applicable).  
    - Slack OAuth for support escalation node.

11. **Test and Validate**  
    - Send WhatsApp messages with greetings, order queries, product questions, and support requests.  
    - Verify proper routing, API calls, and WhatsApp replies.  
    - Check Slack for escalated messages.

---

### 5. General Notes & Resources

| Note Content                                                                                                                             | Context or Link                                                                                                              |
|-----------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| This n8n template demonstrates an AI-powered WhatsApp & Shopify Support Copilot integrating WhatsApp Business API, Shopify API, LLM Agents, and Slack for human escalation. | Sticky Note at workflow start with detailed usage and configuration instructions.                                            |
| Always configure WhatsApp Business API, Shopify Admin API, OpenAI/OpenRouter API keys, and Slack OAuth credentials before running.     | Workflow prerequisites.                                                                                                       |
| Example WhatsApp messages to test: “Where is my order?”, “Show me best sellers”, “Hello”.                                                | Usage suggestions from workflow description.                                                                                  |
| Contact info for improvements and support: info@zenithworks.ai                                                                           | Email provided in the introductory sticky note.                                                                               |
| Visual references for WhatsApp messages and Slack escalation are provided in sticky notes with image links for quick UI validation.     | Sticky notes titled Welcome whatsapp message, Order status whatsapp message, Products Info whatsapp message, Slack message.    |

---

**Disclaimer:** The provided text is exclusively derived from an automated n8n workflow, adhering strictly to content policies. It contains only legal, public, and non-offensive data.

---