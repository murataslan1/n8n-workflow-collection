AI-Powered Amazon Product Recommendations via Telegram with Gemini 2.5

https://n8nworkflows.xyz/workflows/ai-powered-amazon-product-recommendations-via-telegram-with-gemini-2-5-10805


# AI-Powered Amazon Product Recommendations via Telegram with Gemini 2.5

### 1. Workflow Overview

This workflow implements an **AI-powered Amazon product recommendation bot** that interacts with users via Telegram. It optimizes the Amazon shopping experience by providing curated product suggestions based on user queries, eliminating the need for manual searching and filtering. The workflow integrates AI validation, web scraping, data processing, and conversational response generation.

**Target Use Cases:**  
- Telegram users seeking fast, AI-curated Amazon product recommendations  
- E-commerce assistants providing personalized shopping insights  
- Automating product search, ranking, and presentation from Amazon data

**Logical Blocks:**  
- **1.1 Input Reception & Validation:** Receive user input via Telegram, validate and sanitize product queries using an LLM.  
- **1.2 User Feedback & Processing Notification:** Inform users of input processing status or invalid queries.  
- **1.3 Data Retrieval from Amazon:** Use Decodo API to scrape Amazon search results for validated queries.  
- **1.4 Product Data Processing:** Clean, deduplicate, score, and categorize product data for AI consumption.  
- **1.5 AI-Driven Recommendation Generation:** Generate formatted, Telegram-friendly product recommendations using LangChain LLM.  
- **1.6 Response Delivery:** Send curated recommendations back to the user on Telegram.  
- **1.7 Error Handling & Admin Notification:** Capture workflow errors, format detailed reports, and notify admins via Telegram.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Validation

- **Overview:** Listens to Telegram messages, extracts user input, and validates product queries using an AI model to ensure relevance and clarity.  
- **Nodes Involved:** Telegram Trigger, Validate Product Input, Parse Validation Output, Check Product Validity

##### Telegram Trigger  
- **Type:** Telegram Trigger node  
- **Role:** Entry point for user messages from Telegram bot  
- **Config:** Listens to "message" updates; uses Telegram API credentials ("Piranusa_assistantbot")  
- **Connections:** Outputs raw Telegram message to Validate Product Input and triggers a small delay node  
- **Potential Failures:** Telegram API downtime, webhook misconfiguration, invalid credentials  

##### Validate Product Input  
- **Type:** LangChain Chain LLM node  
- **Role:** Uses a language model to parse and validate the user’s product query  
- **Config:** Receives raw text, prompts LLM to extract core product name or mark input invalid; outputs structured JSON with `keyword` and `status`  
- **Key Expressions:** `={{ $json.message.text }}` — raw Telegram message text input  
- **Connections:** Outputs parsed JSON to Parse Validation Output  
- **Failures:** LLM latency, malformed input, parsing errors  

##### Parse Validation Output  
- **Type:** LangChain Output Parser Structured node  
- **Role:** Parses LLM JSON output into structured format for conditional logic  
- **Config:** JSON schema example specifying `keyword` and `status` fields  
- **Connections:** Outputs parsed data to Check Product Validity  
- **Failures:** Unexpected LLM output format  

##### Check Product Validity (If node)  
- **Type:** Conditional (If) node  
- **Role:** Branches workflow based on validity status: proceeds if `status == "VALID"`, else triggers invalid input response  
- **Config:** Checks `={{ $json.output.status }} === 'VALID'`  
- **Connections:**  
  - Valid path → Extract Chat & Query and Send Valid Confirmation nodes  
  - Invalid path → Send Invalid Message node  
- **Failures:** Expression evaluation errors  

---

#### 1.2 User Feedback & Processing Notification

- **Overview:** Provides immediate user feedback on input processing status and validity.  
- **Nodes Involved:** Give Delay, Send Processing Status, Send Valid Confirmation, Send Invalid Message

##### Give Delay  
- **Type:** Wait node  
- **Role:** Adds a 2-second pause after message reception for UX pacing  
- **Config:** 2 seconds delay  
- **Connections:** Leads to Send Processing Status node  
- **Failures:** None significant  

##### Send Processing Status  
- **Type:** Telegram node  
- **Role:** Sends “Processing your input...” message to user  
- **Config:** Uses incoming chatId from Telegram Trigger; Markdown parse mode; disables attribution  
- **Failures:** Telegram API issues  

##### Send Valid Confirmation  
- **Type:** Telegram node  
- **Role:** Confirms valid input keyword and informs user processing continues  
- **Config:** HTML parse mode, dynamic keyword insertion from validation output  
- **Failures:** Telegram API errors  

##### Send Invalid Message  
- **Type:** Telegram node  
- **Role:** Notifies user that input was invalid and prompts retry  
- **Config:** Markdown parse mode; uses original chatId  
- **Failures:** Telegram API failures  

---

#### 1.3 Data Retrieval from Amazon

- **Overview:** After extracting a validated product query, calls Decodo API to scrape Amazon search results.  
- **Nodes Involved:** Extract Chat & Query, Decodo API

##### Extract Chat & Query  
- **Type:** Set node  
- **Role:** Extracts `chatId` and prepares sanitized search query with spaces replaced by plus signs for URL encoding  
- **Config:**  
  - `chatId` assigned from Telegram message chat.id  
  - `message` assigned from validated keyword with spaces replaced by `+`  
- **Connections:** Output feeds Decodo API node  
- **Failures:** Missing Telegram message structure, empty query  

##### Decodo API  
- **Type:** Decodo node (custom)  
- **Role:** Scrapes Amazon search results for the query URL formatted as `https://www.amazon.com/s?k={{ $json.message }}`  
- **Config:** Uses "amazon" operation with Decodo credential stored in n8n  
- **Connections:** Outputs raw Amazon product data to Process Product Data node  
- **Failures:** API key invalid or expired, scraping blocked by Amazon, network timeout  

---

#### 1.4 Product Data Processing

- **Overview:** Cleans, deduplicates, scores, and categorizes Amazon product data for AI consumption.  
- **Nodes Involved:** Process Product Data (Code node)

##### Process Product Data  
- **Type:** Code node (JavaScript)  
- **Role:**  
  - Cleans URLs by removing tracking parameters and extracting ASIN  
  - Parses sales volume texts into numeric values for sorting  
  - Calculates product scores using weighted factors: rating, reviews, sales, discount, badges (Amazon’s Choice, bestseller)  
  - Removes duplicates by product title and price  
  - Sorts products by score and generates categorized lists: top picks, budget, premium, best rated, best value, popular, Amazon’s Choice  
  - Computes summary stats: average price, rating, total sales, etc.  
- **Key Logic:**  
  - Regex to extract ASIN from URLs  
  - Sales volume parsing supporting K/M suffixes  
  - Custom scoring formula balancing multiple metrics  
  - Multiple product categories filtered and sorted for AI output  
- **Input:** Raw Decodo API JSON response  
- **Output:** JSON object with query, statistics, and multiple categorized product lists ready for recommendation generation  
- **Failures:** Unexpected data structure, missing fields, malformed URLs, zero products returned  

---

#### 1.5 AI-Driven Recommendation Generation

- **Overview:** Uses a LangChain LLM node to transform processed product data into concise, Telegram-formatted product recommendations with rich formatting and symbols.  
- **Nodes Involved:** Generate Recommendations

##### Generate Recommendations  
- **Type:** LangChain Chain LLM node  
- **Role:** Generates Telegram Markdown formatted product recommendations based on categories and stats from prior node  
- **Config:**  
  - Detailed prompt specifying formatting rules: max 2500 characters, markdown legacy, bold headers only, use of symbols, product name shortening, URL placement  
  - Dynamic insertion of product data fields (price, rating, reviews, sales) and categories  
  - Instruction to adapt language to product type (electronics, apparel, etc.)  
- **Output:** Text string containing fully formatted recommendation message  
- **Failures:** LLM response too long, formatting errors, token limits, API rate limits  

---

#### 1.6 Response Delivery

- **Overview:** Sends the final AI-generated recommendation message back to the user in Telegram.  
- **Nodes Involved:** Send Final Response

##### Send Final Response  
- **Type:** Telegram node  
- **Role:** Sends the recommendation text message to the user’s chat  
- **Config:** Markdown parse mode, uses chatId from Extract Chat & Query node  
- **Failures:** Telegram API errors, network issues  

---

#### 1.7 Error Handling & Admin Notification

- **Overview:** Catches all errors triggered in the workflow, formats a clean detailed error message, and notifies an administrator via Telegram.  
- **Nodes Involved:** Error Trigger, Format Error Notification, Notify Admin

##### Error Trigger  
- **Type:** Error Trigger node  
- **Role:** Global error catcher for workflow failures  
- **Config:** No parameters  
- **Connections:** Sends error data to Format Error Notification node  
- **Failures:** None (only triggers on error)  

##### Format Error Notification  
- **Type:** Code node  
- **Role:** Parses error details: workflow name, node name, error message, HTTP code, stack trace (first line), timestamp, execution ID  
- **Output:** Clean, compact HTML-formatted error message for Telegram  
- **Failures:** Unexpected error data structure  

##### Notify Admin  
- **Type:** Telegram node  
- **Role:** Sends formatted error message to admin Telegram chat ID  
- **Config:** Uses distinct Telegram API credential ("Khairunnisa Money BOT") and configured admin chat ID  
- **Failures:** Wrong chat ID, Telegram API errors  

---

### 3. Summary Table

| Node Name               | Node Type                        | Functional Role                           | Input Node(s)                | Output Node(s)                     | Sticky Note                                                                                                                           |
|-------------------------|---------------------------------|-----------------------------------------|-----------------------------|----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| Telegram Trigger         | Telegram Trigger                | Receives user messages from Telegram    | —                           | Validate Product Input, Give Delay |                                                                                                                                       |
| Validate Product Input   | LangChain Chain LLM             | Validates and extracts product keywords | Telegram Trigger             | Parse Validation Output           | Sticky Note4: ## Validate Input                                                                                                       |
| Parse Validation Output  | LangChain Output Parser Structured | Parses LLM validation output             | Validate Product Input       | Check Product Validity            | Sticky Note4: ## Validate Input                                                                                                       |
| Check Product Validity   | If                             | Branches on validity of product input   | Parse Validation Output      | Extract Chat & Query, Send Valid Confirmation (valid path); Send Invalid Message (invalid path) | Sticky Note4: ## Validate Input                                                                                                       |
| Send Invalid Message     | Telegram                       | Notifies user of invalid input          | Check Product Validity       | —                                |                                                                                                                                       |
| Send Valid Confirmation  | Telegram                       | Confirms valid input and processing     | Check Product Validity       | Extract Chat & Query              |                                                                                                                                       |
| Give Delay               | Wait                          | Adds processing delay for UX             | Telegram Trigger             | Send Processing Status            |                                                                                                                                       |
| Send Processing Status   | Telegram                       | Sends “Processing your input...” message | Give Delay                   | —                                |                                                                                                                                       |
| Extract Chat & Query     | Set                           | Extracts chatId and prepares query       | Check Product Validity       | Decodo API                       |                                                                                                                                       |
| Decodo API               | Decodo API                    | Scrapes Amazon for product data          | Extract Chat & Query         | Process Product Data             | Sticky Note2: ## DECODO CREDENTIALS SETUP                                                                                             |
| Process Product Data     | Code                          | Cleans, scores, categorizes product data | Decodo API                  | Generate Recommendations         | Sticky Note1: ## Amazon Product Recommender Bot - workflow overview and setup instructions                                            |
| Generate Recommendations | LangChain Chain LLM             | Generates formatted Telegram recommendations | Process Product Data        | Send Final Response              | Sticky Note1: ## Amazon Product Recommender Bot - workflow overview and setup instructions                                            |
| Send Final Response      | Telegram                       | Sends recommendation message to user    | Generate Recommendations     | —                                | Sticky Note1: ## Amazon Product Recommender Bot - workflow overview and setup instructions                                            |
| Gemini 2.5 Flash         | LangChain LM Chat Google Gemini | (Configured but unused in main flow)    | —                           | Generate Recommendations, Validate Product Input |                                                                                                                                       |
| Error Trigger            | Error Trigger                 | Catches workflow errors                  | —                           | Format Error Notification        | Sticky Note3: ## Error Handling                                                                                                       |
| Format Error Notification| Code                          | Formats error details for admin alert    | Error Trigger               | Notify Admin                    | Sticky Note3: ## Error Handling                                                                                                       |
| Notify Admin             | Telegram                       | Sends error alert to admin via Telegram  | Format Error Notification    | —                                | Sticky Note3: ## Error Handling                                                                                                       |
| Sticky Note1             | Sticky Note                    | Workflow overview and instructions       | —                           | —                                | Amazon Product Recommender Bot overview, setup, and operational notes                                                                 |
| Sticky Note2             | Sticky Note                    | Decodo API credentials setup instructions | —                           | —                                | Decodo API credentials setup guide                                                                                                   |
| Sticky Note3             | Sticky Note                    | Error handling overview                   | —                           | —                                | Error handling and admin notification explanation                                                                                    |
| Sticky Note4             | Sticky Note                    | Validate Input block label                | —                           | —                                | Validation block description                                                                                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Parameters: Listen to "message" updates only  
   - Credentials: Connect your Telegram bot API credentials (e.g., "Piranusa_assistantbot")  
   - Position: Start of workflow  

2. **Create LangChain Chain LLM Node - Validate Product Input**  
   - Type: LangChain Chain LLM  
   - Input: `={{ $json.message.text }}` from Telegram Trigger  
   - Prompt: Product validator to extract core product name or mark invalid  
   - Output parser: JSON with `keyword` and `status` fields  
   - Connect Telegram Trigger output to this node  

3. **Create LangChain Output Parser Structured Node - Parse Validation Output**  
   - Type: LangChain Output Parser Structured  
   - JSON Schema Example:  
     ```json
     {
       "keyword": "<product_name_or_empty>",
       "status": "VALID or INVALID"
     }
     ```  
   - Connect from Validate Product Input node  

4. **Create If Node - Check Product Validity**  
   - Condition: `{{$json.output.status}} === "VALID"`  
   - True path: proceed to extract query and send confirmation  
   - False path: send invalid message  

5. **Create Telegram Node - Send Invalid Message**  
   - Text: "no product detected on your input, please try again"  
   - ChatId: `={{ $('Telegram Trigger').item.json.message.chat.id }}`  
   - Parse mode: Markdown  
   - Connect false output of Check Product Validity  

6. **Create Telegram Node - Send Valid Confirmation**  
   - Text (HTML):  
     ```
     Input <b>Valid</b> | keyword: <b>{{ $json.output.keyword }}</b>

     <i>processing your request...</i>
     ```  
   - ChatId: `={{ $('Telegram Trigger').item.json.message.chat.id }}`  
   - Parse mode: HTML  
   - Connect true output of Check Product Validity  

7. **Create Set Node - Extract Chat & Query**  
   - Assign `chatId` = `={{ $('Telegram Trigger').item.json.message.chat.id }}`  
   - Assign `message` = `={{ $json.output.keyword.replaceAll(' ','+') }}`  
   - Connect true output of Check Product Validity  

8. **Create Decodo API Node**  
   - Credentials: Add and select Decodo API credentials with valid API key  
   - Operation: "amazon"  
   - URL: `=https://www.amazon.com/s?k={{ $json.message }}`  
   - Connect output of Extract Chat & Query  

9. **Create Code Node - Process Product Data**  
   - Paste the provided JavaScript code for cleaning, scoring, and categorizing products (see section 2.4)  
   - Connect output of Decodo API node  

10. **Create LangChain Chain LLM Node - Generate Recommendations**  
    - Prompt: Detailed instruction to create Telegram Markdown formatted product recommendations with embedded data from Process Product Data node  
    - Connect output of Process Product Data node  

11. **Create Telegram Node - Send Final Response**  
    - Text: `={{ $json.text }}` (output of Generate Recommendations)  
    - ChatId: `={{ $('Extract Chat & Query').item.json.chatId }}`  
    - Parse mode: Markdown (legacy)  
    - Connect output of Generate Recommendations node  

12. **Create Wait Node - Give Delay**  
    - Amount: 2 seconds  
    - Connect output of Telegram Trigger  
    - Connect output to Send Processing Status  

13. **Create Telegram Node - Send Processing Status**  
    - Text: "Processing your input..."  
    - ChatId: `={{ $('Telegram Trigger').item.json.message.chat.id }}`  
    - Parse mode: Markdown  
    - Connect output of Give Delay  

14. **Create Error Trigger Node**  
    - No parameters  
    - Connect to Format Error Notification  

15. **Create Code Node - Format Error Notification**  
    - Paste the provided JavaScript code that formats error messages with workflow, node, message, and timestamp details  
    - Connect output of Error Trigger  

16. **Create Telegram Node - Notify Admin**  
    - Text: `={{ $json.message }}` (output of Format Error Notification)  
    - ChatId: Set to your admin Telegram chat ID  
    - Credentials: Setup separate Telegram API credential for admin notifications  
    - Parse mode: HTML  
    - Connect output of Format Error Notification  

17. **(Optional) Add Sticky Notes** for documentation and credential setup instructions.

---

### 5. General Notes & Resources

| Note Content                                                                                                                              | Context or Link                                    |
|-------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------|
| Amazon Product Recommender Bot speeds up product search by AI-curated recommendations via Telegram                                        | Sticky Note1 - Workflow overview                   |
| Decodo API Key Setup: Sign up at https://decodo.com → Dashboard → Scraping APIs → Web Advanced → BASIC AUTH. Token copy & n8n credential | Sticky Note2 - Decodo credentials setup            |
| Error Handling: Catches workflow failures, formats details, sends Telegram alerts to admin                                                | Sticky Note3 - Error handling explanation          |
| Input Validation: AI validates user messages to extract core product name or reject invalid input                                         | Sticky Note4 - Validation block label               |
| Telegram Markdown Legacy formatting rules for message output                                                                             | Section 1.5 prompt instructions                     |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly accessible.