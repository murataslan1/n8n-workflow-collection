Automate Product Training & Customer Support via WhatsApp, GPT-4 & Google Sheets

https://n8nworkflows.xyz/workflows/automate-product-training---customer-support-via-whatsapp--gpt-4---google-sheets-3379


# Automate Product Training & Customer Support via WhatsApp, GPT-4 & Google Sheets

### 1. Workflow Overview

This workflow automates product data training and customer support interactions via WhatsApp, leveraging GPT-4 AI and Google Sheets for data storage and retrieval. It is designed primarily for eCommerce founders, product managers, and customer support teams who want to streamline product data entry and provide fast, AI-driven customer support directly through WhatsApp messages.

The workflow is logically divided into four main blocks:

- **1.1 Incoming Message Detection:** Listens for WhatsApp messages and routes them based on whether they start with the keyword `train:` (product training) or not (customer support).

- **1.2 Product Data Training:** Extracts product URLs from messages, fetches and cleans HTML content, saves raw data to Google Sheets, uses GPT-4 to enhance product details (name, price, topic, FAQs), and updates the product sheet accordingly.

- **1.3 Customer Support Flow:** Uses GPT-4 to analyze customer queries, fetches relevant product data from Google Sheets, detects issues, suggests solutions, logs the interaction, and prepares a response.

- **1.4 Client Response:** Sends the AI-generated response back to the customer via WhatsApp, ensuring clear and professional communication.

---

### 2. Block-by-Block Analysis

#### 2.1 Incoming Message Detection

**Overview:**  
This block listens for incoming WhatsApp messages and routes them based on the presence of the prefix `train:`. Messages starting with `train:` trigger the product training flow; all others trigger the customer support flow.

**Nodes Involved:**  
- Incoming Message Trigger  
- Check If Training  
- Sticky Note (documentation)

**Node Details:**

- **Incoming Message Trigger**  
  - *Type:* WhatsApp Trigger  
  - *Role:* Entry point listening for new WhatsApp messages.  
  - *Configuration:* Listens for message updates only. Uses OAuth credentials for WhatsApp Business API.  
  - *Input/Output:* No input; outputs incoming message JSON.  
  - *Edge Cases:* Possible webhook connectivity issues, message format variations, or API rate limits.

- **Check If Training**  
  - *Type:* Switch  
  - *Role:* Routes messages based on whether they start with `train:`.  
  - *Configuration:* Uses string operation `startsWith` on the message body. Case-sensitive.  
  - *Input:* Incoming message JSON from trigger.  
  - *Output:* Two branches — `train` for messages starting with `train:`, `text` for others.  
  - *Edge Cases:* Messages without text or malformed messages may cause routing errors.

- **Sticky Note**  
  - *Role:* Documentation for this block.  
  - *Content:* Explains the routing logic and links to WhatsApp Business Cloud node documentation.

---

#### 2.2 Product Data Training

**Overview:**  
Triggered by messages starting with `train:`, this block extracts product URLs, fetches and cleans HTML content, saves raw product info to Google Sheets, enhances product details using GPT-4, and updates the product sheet with structured data.

**Nodes Involved:**  
- Extract URL from Text  
- Fetch HTML Page  
- Clean HTML Content  
- Save Raw Product Info  
- AI Agent - Enhance Product Details  
- OpenAI Model  
- Short-Term Memory  
- Update Product Sheet  
- Sticky Note (documentation)

**Node Details:**

- **Extract URL from Text**  
  - *Type:* Code  
  - *Role:* Extracts URLs from the WhatsApp message text using regex.  
  - *Configuration:* Regex matches URLs with or without protocols; returns all found URLs as separate items.  
  - *Input:* Message text JSON.  
  - *Output:* Items containing extracted URLs or original input if none found.  
  - *Edge Cases:* Messages without URLs, malformed URLs, or multiple URLs.

- **Fetch HTML Page**  
  - *Type:* HTTP Request  
  - *Role:* Retrieves the HTML content of the extracted URL.  
  - *Configuration:* GET request to the URL from previous node; expects text response.  
  - *Input:* URL from previous node.  
  - *Output:* HTML content as text.  
  - *Edge Cases:* HTTP errors (404, 500), timeouts, redirects, or blocked requests.

- **Clean HTML Content**  
  - *Type:* Code  
  - *Role:* Cleans and extracts readable text from raw HTML.  
  - *Configuration:* Removes links, scripts, styles, comments; replaces certain tags with line breaks; strips all remaining HTML tags; normalizes whitespace and special characters.  
  - *Input:* Raw HTML content.  
  - *Output:* Cleaned product description text.  
  - *Edge Cases:* Non-string input, malformed HTML, or very large pages causing performance issues.

- **Save Raw Product Info**  
  - *Type:* Google Sheets (Append)  
  - *Role:* Saves the product URL and cleaned description into the "Products" sheet.  
  - *Configuration:* Appends new row with columns "Product Link" and "Product Description".  
  - *Input:* URL and cleaned text.  
  - *Output:* Confirmation of append operation.  
  - *Edge Cases:* Google Sheets API quota limits, authentication errors, or invalid sheet ID.

- **AI Agent - Enhance Product Details**  
  - *Type:* Langchain Agent  
  - *Role:* Uses GPT-4 to extract structured product details (name, price, topic, FAQs) from the description and URL.  
  - *Configuration:* System prompt instructs the agent to extract and structure data without mentioning Google Sheets.  
  - *Input:* Product description and URL.  
  - *Output:* Structured product data fields.  
  - *Edge Cases:* API rate limits, incomplete or ambiguous product descriptions, or AI misinterpretation.

- **OpenAI Model**  
  - *Type:* Langchain OpenAI Chat Model  
  - *Role:* Provides GPT-4 language model backend for the AI Agent.  
  - *Configuration:* Uses GPT-4o-mini model variant.  
  - *Input/Output:* Connected to AI Agent node.  
  - *Edge Cases:* API key invalidation, network issues, or model unavailability.

- **Short-Term Memory**  
  - *Type:* Langchain Memory Buffer Window  
  - *Role:* Maintains conversation context for the AI Agent during product enhancement.  
  - *Configuration:* Session key based on incoming message ID; context window length 50.  
  - *Input/Output:* Connected to AI Agent node.  
  - *Edge Cases:* Memory overflow or session key collisions.

- **Update Product Sheet**  
  - *Type:* Google Sheets Tool (Append or Update)  
  - *Role:* Updates the product row in the "Products" sheet with enhanced details (Name, Price, Topic, FAQs).  
  - *Configuration:* Matches rows by "Product Link" and updates or appends columns accordingly.  
  - *Input:* Structured product data from AI Agent.  
  - *Output:* Confirmation of update.  
  - *Edge Cases:* Sheet locking, API errors, or mismatched product links.

- **Sticky Note2**  
  - *Role:* Documentation for this block.  
  - *Content:* Detailed explanation of each step in product data training and a link to OpenAI API keys.

---

#### 2.3 Customer Support Flow

**Overview:**  
Handles all incoming WhatsApp messages that do not start with `train:`. The AI analyzes the message, fetches relevant product data, detects issues, suggests solutions, logs the interaction, and prepares a response.

**Nodes Involved:**  
- AI Agent - Customer Support Agent  
- OpenAI Model1  
- Conversation Memory  
- Read Product Sheet  
- Log Customer Issues  
- Sticky Note1 (documentation)

**Node Details:**

- **AI Agent - Customer Support Agent**  
  - *Type:* Langchain Agent  
  - *Role:* Acts as an intelligent customer support assistant analyzing user messages and generating responses.  
  - *Configuration:* System prompt instructs the agent to use Google Sheets data silently, detect problems, suggest solutions, and log issues professionally.  
  - *Input:* User message text.  
  - *Output:* AI-generated response text and structured data for logging.  
  - *Edge Cases:* Ambiguous user queries, API failures, or incomplete product data.

- **OpenAI Model1**  
  - *Type:* Langchain OpenAI Chat Model  
  - *Role:* GPT-4 backend for the customer support AI Agent.  
  - *Configuration:* Uses GPT-4o-mini model.  
  - *Input/Output:* Connected to AI Agent node.  
  - *Edge Cases:* Same as OpenAI Model.

- **Conversation Memory**  
  - *Type:* Langchain Memory Buffer Window  
  - *Role:* Maintains conversation context for customer support interactions.  
  - *Configuration:* Session key based on message ID; context window length 50.  
  - *Input/Output:* Connected to AI Agent node.  
  - *Edge Cases:* Same as Short-Term Memory.

- **Read Product Sheet**  
  - *Type:* Google Sheets Tool (Read)  
  - *Role:* Reads product data from the "Products" sheet to provide context for AI responses.  
  - *Configuration:* Reads all rows until the first empty row, auto-detects range.  
  - *Input:* Triggered by AI Agent tool request.  
  - *Output:* Product data rows.  
  - *Edge Cases:* Large sheets causing latency, API limits, or data inconsistency.

- **Log Customer Issues**  
  - *Type:* Google Sheets Tool (Append)  
  - *Role:* Logs detected customer problems, suggested solutions, and categories into the "Customer Issues" sheet.  
  - *Configuration:* Appends new rows with columns "Support Problem", "Solution", and "Category" based on AI output.  
  - *Input:* Structured data from AI Agent.  
  - *Output:* Confirmation of append.  
  - *Edge Cases:* API limits, authentication errors, or malformed data.

- **Sticky Note1**  
  - *Role:* Documentation for this block.  
  - *Content:* Stepwise explanation of the customer support flow.

---

#### 2.4 Client Response

**Overview:**  
Sends the AI-generated response back to the customer via WhatsApp, ensuring communication is fast, clear, and professional.

**Nodes Involved:**  
- WhatsApp Business Cloud  
- Sticky Note3 (documentation)

**Node Details:**

- **WhatsApp Business Cloud**  
  - *Type:* WhatsApp Send Message  
  - *Role:* Sends text messages to customers on WhatsApp.  
  - *Configuration:* Sends the AI-generated response text to the recipient's phone number using WhatsApp Business Cloud API credentials.  
  - *Input:* Text output from either product training or customer support AI agents.  
  - *Output:* Confirmation of message sent.  
  - *Edge Cases:* API rate limits, invalid phone numbers, or message formatting issues.

- **Sticky Note3**  
  - *Role:* Documentation for this block.  
  - *Content:* Describes the final step of sending responses to clients.

---

### 3. Summary Table

| Node Name                     | Node Type                          | Functional Role                        | Input Node(s)               | Output Node(s)                      | Sticky Note                                                                                              |
|-------------------------------|----------------------------------|--------------------------------------|----------------------------|-----------------------------------|--------------------------------------------------------------------------------------------------------|
| Incoming Message Trigger       | WhatsApp Trigger                 | Entry point for incoming WhatsApp messages | None                       | Check If Training                  | ## 🟡 STEP 1 – Incoming WhatsApp Message Listens for new WhatsApp messages. If the message starts with train:, it triggers the product training flow. Otherwise, it goes to the customer support flow. **WhatsApp Business Cloud node** : [Here](https://www.notion.so/automatisation/WHATSAPP-WORKFLOW-1c63d6550fd980559679e7535938a68d?pvs=4#1c63d6550fd980f9a2a5e25a3654da82) |
| Check If Training              | Switch                          | Routes messages to training or support flow | Incoming Message Trigger    | Extract URL from Text, AI Agent - Customer Support Agent |                                                                                                        |
| Extract URL from Text          | Code                            | Extracts URLs from training messages | Check If Training (train)  | Fetch HTML Page                   |                                                                                                        |
| Fetch HTML Page                | HTTP Request                   | Fetches HTML content of product URL  | Extract URL from Text       | Clean HTML Content                |                                                                                                        |
| Clean HTML Content             | Code                            | Cleans HTML to readable text          | Fetch HTML Page             | Save Raw Product Info            |                                                                                                        |
| Save Raw Product Info          | Google Sheets (Append)          | Saves raw product link and description | Clean HTML Content          | AI Agent - Enhance Product Details |                                                                                                        |
| AI Agent - Enhance Product Details | Langchain Agent               | Extracts structured product details using GPT-4 | Save Raw Product Info       | Update Product Sheet, WhatsApp Business Cloud |                                                                                                        |
| OpenAI Model                  | Langchain OpenAI Chat Model     | GPT-4 model backend for product enhancement | AI Agent - Enhance Product Details | AI Agent - Enhance Product Details |                                                                                                        |
| Short-Term Memory             | Langchain Memory Buffer Window  | Maintains AI context for product enhancement | AI Agent - Enhance Product Details | AI Agent - Enhance Product Details |                                                                                                        |
| Update Product Sheet          | Google Sheets Tool (Append/Update) | Updates product sheet with enhanced data | AI Agent - Enhance Product Details | WhatsApp Business Cloud          |                                                                                                        |
| AI Agent - Customer Support Agent | Langchain Agent               | Analyzes customer queries and generates responses | Check If Training (text)   | WhatsApp Business Cloud, Log Customer Issues |                                                                                                        |
| OpenAI Model1                 | Langchain OpenAI Chat Model     | GPT-4 model backend for customer support | AI Agent - Customer Support Agent | AI Agent - Customer Support Agent |                                                                                                        |
| Conversation Memory           | Langchain Memory Buffer Window  | Maintains AI context for customer support | AI Agent - Customer Support Agent | AI Agent - Customer Support Agent |                                                                                                        |
| Read Product Sheet            | Google Sheets Tool (Read)        | Reads product data for AI context    | AI Agent - Customer Support Agent | AI Agent - Customer Support Agent |                                                                                                        |
| Log Customer Issues           | Google Sheets Tool (Append)      | Logs customer issues and solutions   | AI Agent - Customer Support Agent | AI Agent - Customer Support Agent |                                                                                                        |
| WhatsApp Business Cloud       | WhatsApp Send Message            | Sends AI-generated response to client | AI Agent - Enhance Product Details, AI Agent - Customer Support Agent | None                            | ## 🟢 STEP 4 – Client Response Final step of the flow. Sends the AI-generated response back to the customer via WhatsApp. Ensures the message is clear, helpful, and personalized. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create WhatsApp Trigger Node**  
   - Type: WhatsApp Trigger  
   - Configure to listen for incoming message updates.  
   - Connect WhatsApp OAuth credentials.  
   - Position as the workflow entry point.

2. **Add Switch Node "Check If Training"**  
   - Type: Switch  
   - Condition: Check if incoming message text starts with `train:` (case-sensitive).  
   - Two outputs: `train` and `text`.  
   - Connect input from WhatsApp Trigger node.

3. **Product Training Branch**

   3.1 **Add Code Node "Extract URL from Text"**  
       - Extract URLs from the message text using regex that matches URLs with or without protocols.  
       - Input: message text from `train` output of Switch node.

   3.2 **Add HTTP Request Node "Fetch HTML Page"**  
       - Method: GET  
       - URL: Use extracted URL from previous node.  
       - Response format: Text.

   3.3 **Add Code Node "Clean HTML Content"**  
       - Implement HTML cleaning script to remove tags, scripts, styles, and normalize text.  
       - Input: HTML content from HTTP Request node.

   3.4 **Add Google Sheets Node "Save Raw Product Info"**  
       - Operation: Append  
       - Sheet: "Products" (configure with your Google Sheet ID and sheet name)  
       - Columns: "Product Link" (from extracted URL), "Product Description" (from cleaned text).  
       - Connect Google Sheets OAuth credentials.

   3.5 **Add Langchain Agent Node "AI Agent - Enhance Product Details"**  
       - Input text: Product description and URL.  
       - System prompt: Instruct to extract product name, price (subscription or one-time), topic, and FAQs.  
       - Connect to OpenAI GPT-4 model node (see next step).  
       - Connect Short-Term Memory node for context.

   3.6 **Add Langchain OpenAI Node "OpenAI Model"**  
       - Model: GPT-4o-mini or equivalent GPT-4 variant.  
       - Connect credentials for OpenAI API.

   3.7 **Add Langchain Memory Node "Short-Term Memory"**  
       - Session key: Use incoming message ID.  
       - Context window length: 50.

   3.8 **Add Google Sheets Tool Node "Update Product Sheet"**  
       - Operation: Append or Update  
       - Sheet: "Products"  
       - Matching column: "Product Link"  
       - Columns to update: Product Name, Product Price, Product Topic, FAQs (mapped from AI Agent output).  
       - Connect Google Sheets OAuth credentials.

   3.9 **Connect output of Update Product Sheet to WhatsApp Send Node (see step 5).**

4. **Customer Support Branch**

   4.1 **Add Langchain Agent Node "AI Agent - Customer Support Agent"**  
       - Input text: User message text.  
       - System prompt: Define assistant role to analyze user requests, fetch product info silently, detect issues, suggest solutions, and log problems.  
       - Connect to OpenAI GPT-4 model node (see next step).  
       - Connect Conversation Memory node for context.  
       - Connect Google Sheets Tool nodes for reading product data and logging issues.

   4.2 **Add Langchain OpenAI Node "OpenAI Model1"**  
       - Model: GPT-4o-mini or equivalent.  
       - Connect OpenAI API credentials.

   4.3 **Add Langchain Memory Node "Conversation Memory"**  
       - Session key: Use incoming message ID.  
       - Context window length: 50.

   4.4 **Add Google Sheets Tool Node "Read Product Sheet"**  
       - Operation: Read rows until first empty row.  
       - Sheet: "Products"  
       - Connect Google Sheets OAuth credentials.

   4.5 **Add Google Sheets Tool Node "Log Customer Issues"**  
       - Operation: Append  
       - Sheet: "Customer Issues"  
       - Columns: Support Problem, Solution, Category (mapped from AI Agent output).  
       - Connect Google Sheets OAuth credentials.

   4.6 **Connect output of AI Agent - Customer Support Agent to WhatsApp Send Node (see step 5).**

5. **Client Response**

   5.1 **Add WhatsApp Node "WhatsApp Business Cloud"**  
       - Operation: Send message  
       - Phone Number ID: Your WhatsApp Business phone number ID.  
       - Recipient Phone Number: Extract from incoming message or configure statically for testing.  
       - Text Body: Use AI-generated response text from either product training or customer support AI agents.  
       - Connect WhatsApp API credentials.

6. **Connect all nodes accordingly:**  
   - Incoming Message Trigger → Check If Training  
   - Check If Training (train) → Extract URL from Text → Fetch HTML Page → Clean HTML Content → Save Raw Product Info → AI Agent - Enhance Product Details → Update Product Sheet → WhatsApp Business Cloud  
   - Check If Training (text) → AI Agent - Customer Support Agent → Log Customer Issues, Read Product Sheet → WhatsApp Business Cloud

7. **Credential Setup:**  
   - WhatsApp Business Cloud: WhatsApp Business API credentials or OAuth.  
   - OpenAI API: API key with GPT-4 access.  
   - Google Sheets OAuth2: Access to Google Sheets with read/write permissions.

8. **Testing:**  
   - Send a WhatsApp message starting with `train:` followed by a product URL to test product training.  
   - Send a regular WhatsApp message to test customer support flow.  
   - Monitor logs and Google Sheets for data correctness.

---

### 5. General Notes & Resources

| Note Content                                                                                          | Context or Link                                                                                                         |
|-----------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|
| Workflow screenshot and detailed explanation available at: ![Workflow Screenshot](https://www.dr-firas.com/workflow_Automate_Product.png) | Visual overview of workflow architecture.                                                                               |
| WhatsApp Business Cloud node documentation: [Here](https://www.notion.so/automatisation/WHATSAPP-WORKFLOW-1c63d6550fd980559679e7535938a68d?pvs=4#1c63d6550fd980f9a2a5e25a3654da82) | Useful for configuring WhatsApp integration.                                                                            |
| OpenAI API keys setup guide: [OpenAI API Keys](https://platform.openai.com/api-keys)                 | Required for GPT-4 access.                                                                                              |
| Recommended to customize AI prompts to fit product type, language, and tone for better results.     | Enhances user experience and response relevance.                                                                        |
| Consider expanding Google Sheets structure to include additional product fields (stock, images, etc.) | For richer product data management.                                                                                      |
| Slack or email notifications can be added post product updates or issue logging for team alerts.    | Useful for operational monitoring and escalation.                                                                       |

---

This document provides a comprehensive understanding of the workflow, enabling reproduction, modification, and troubleshooting by advanced users and AI agents alike.