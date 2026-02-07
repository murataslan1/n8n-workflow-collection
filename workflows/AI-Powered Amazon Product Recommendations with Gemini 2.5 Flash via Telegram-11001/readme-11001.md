AI-Powered Amazon Product Recommendations with Gemini 2.5 Flash via Telegram

https://n8nworkflows.xyz/workflows/ai-powered-amazon-product-recommendations-with-gemini-2-5-flash-via-telegram-11001


# AI-Powered Amazon Product Recommendations with Gemini 2.5 Flash via Telegram

### 1. Workflow Overview

This workflow, **Decodo Instant Shopping Insights - Amazon Product Recommender**, is designed to provide instant, AI-powered product recommendations on Amazon, delivered via Telegram. It targets users who submit product queries through Telegram, validates their input, scrapes Amazon product data using the Decodo API, processes and scores the product data, and then composes tailored recommendations using AI before sending the results back to the user on Telegram.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Validation:** Receive user messages via Telegram; validate and extract clean product keywords using AI.
- **1.2 Query Processing and Scraping:** Confirm valid input, send a status message, then query Amazon via Decodo API for product data.
- **1.3 Data Processing and Scoring:** Clean, deduplicate, parse, and enhance raw product data with calculated scores and categorizations.
- **1.4 AI Recommendation Generation:** Use AI (LangChain with Gemini 2.5 Flash) to format and generate a dynamic, user-friendly recommendation message.
- **1.5 Response Delivery:** Send the formatted recommendation back to the user on Telegram.
- **1.6 Error Handling and Notifications:** Capture and format workflow errors, then notify an admin via Telegram.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Validation

**Overview:**  
This block listens for incoming Telegram messages, validates the user’s product query with an AI model to extract a clean, core product name, and branches based on input validity.

**Nodes Involved:**  
- Telegram Trigger  
- Validate Product Input (LangChain AI)  
- Parse Validation Output (Structured AI Output Parser)  
- Check Product Validity (If)  
- Send Valid Confirmation (Telegram)  
- Send Invalid Message (Telegram)  
- Give Delay (Wait)  
- Send Processing Status (Telegram)  

**Node Details:**

- **Telegram Trigger**  
  - Type: Telegram Trigger node  
  - Role: Entry point to receive user messages from Telegram bot  
  - Config: Listens to "message" updates only; uses Telegram API credentials named "Piranusa_assistantbot"  
  - Inputs: External webhook from Telegram  
  - Outputs: Message JSON with chat and message details  
  - Edge cases: Telegram API downtime, invalid webhook setup, malformed messages  

- **Validate Product Input**  
  - Type: LangChain LLM node  
  - Role: AI-powered validation and extraction of core product name from user input  
  - Config: Uses a prompt instructing to extract a valid product keyword or mark input invalid; expects JSON output with "keyword" and "status"  
  - Key expression: Input text is dynamic from Telegram message content  
  - Inputs: Telegram message text  
  - Outputs: JSON with validation status and extracted keyword  
  - Edge cases: Ambiguous input, failure to parse, AI model errors, missing or malformed output  
  - Credentials: Uses LangChain with configured LLM  

- **Parse Validation Output**  
  - Type: LangChain structured output parser  
  - Role: Ensures the AI output conforms to expected JSON schema  
  - Config: JSON schema example for validation result  
  - Inputs: AI raw output  
  - Outputs: Structured JSON  
  - Edge cases: Parsing failures, malformed AI response  

- **Check Product Validity (If node)**  
  - Type: Conditional node to check if product input is valid  
  - Role: Routes workflow based on AI validation status ("VALID" or not)  
  - Inputs: Parsed validation output  
  - Outputs: Two branches: valid and invalid  

- **Send Valid Confirmation**  
  - Type: Telegram node  
  - Role: Notify user that their input is valid and processing will commence  
  - Config: Sends HTML formatted message with bold keyword confirmation  
  - Inputs: Telegram chat id, validation output keyword  
  - Outputs: Message sent confirmation  
  - Edge cases: Telegram API errors, invalid chat id  

- **Send Invalid Message**  
  - Type: Telegram node  
  - Role: Notify user that no valid product was detected and to retry  
  - Config: Fixed Markdown message  
  - Inputs: Telegram chat id from original message  
  - Outputs: Message sent confirmation  

- **Give Delay**  
  - Type: Wait node  
  - Role: Adds a 2-second delay to improve UX (e.g., pacing responses)  
  - Inputs: Triggered after Telegram Trigger  
  - Outputs: Passes through delay  

- **Send Processing Status**  
  - Type: Telegram node  
  - Role: Inform user that the input is being processed  
  - Config: Fixed Markdown message "Processing your input..."  
  - Inputs: Chat id from Telegram trigger  
  - Outputs: Message sent confirmation  

---

#### 1.2 Query Processing and Scraping

**Overview:**  
Once the product keyword is validated, this block formats the query, sends it to the Decodo API to scrape Amazon product search results, and prepares data for processing.

**Nodes Involved:**  
- Extract Chat & Query (Set)  
- Decodo API  

**Node Details:**

- **Extract Chat & Query**  
  - Type: Set node  
  - Role: Extracts chat ID and prepares the search query by replacing spaces with plus signs for URL encoding  
  - Config: Assigns two variables:  
    - `chatId` from Telegram message chat id  
    - `message` from validated keyword with spaces replaced by "+"  
  - Inputs: Output from Check Product Validity valid branch  
  - Outputs: Structured JSON with `chatId` and formatted `message`  
  - Edge cases: Empty keyword, missing chat ID  

- **Decodo API**  
  - Type: Decodo node (custom integration)  
  - Role: Calls Decodo scraping API to fetch Amazon search results based on query  
  - Config: URL parameter built as `https://www.amazon.com/s?k={{ $json.message }}`; operation set to "amazon"; uses Decodo credentials  
  - Inputs: Query from Extract Chat & Query  
  - Outputs: Raw Amazon product data in Decodo API format  
  - Credentials: Decodo API key configured in n8n credentials  
  - Edge cases: API rate limits, authentication errors, network failures, unexpected data format  

---

#### 1.3 Data Processing and Scoring

**Overview:**  
Transforms raw Decodo API product data by cleaning URLs, parsing sales volume, calculating scores based on rating, reviews, discounts, badges, deduplicating, and grouping into meaningful categories for AI consumption.

**Nodes Involved:**  
- Process Product Data (Code)  

**Node Details:**

- **Process Product Data**  
  - Type: Code node (JavaScript)  
  - Role:  
    - Extracts paid, organic, and Amazon’s choice products  
    - Cleans Amazon URLs to canonical form (removes UTM, extracts ASIN)  
    - Parses sales volume strings to numeric values for sorting  
    - Calculates a weighted product score combining rating, reviews, sales, discounts, and badges  
    - Removes duplicate products based on title and price  
    - Sorts products by score descending  
    - Computes overall statistics (average price, rating, total sales)  
    - Categorizes products into: top picks, budget (<$30), premium (≥$50), best rated (≥4.5 stars), best value (discounted & good rating), most popular (by sales), Amazon’s Choice  
    - Constructs a comprehensive JSON output for AI prompt consumption  
  - Inputs: Raw Decodo API data  
  - Outputs: Enhanced structured product data with metadata and categories  
  - Edge cases: Missing fields in Decodo data, malformed URLs, zero or missing sales data, division by zero in averages, undefined ratings  
  - Notes: Robust URL cleaning, numeric parsing, and scoring logic implemented  

---

#### 1.4 AI Recommendation Generation

**Overview:**  
Uses LangChain with Google Gemini 2.5 Flash LLM to generate a dynamic, Telegram Markdown-formatted product recommendation message based on processed product data.

**Nodes Involved:**  
- Generate Recommendations (LangChain chain LLM)  
- Gemini 2.5 Flash (Google Gemini LLM)  

**Node Details:**

- **Gemini 2.5 Flash**  
  - Type: LangChain Google Gemini model node  
  - Role: Provides the language model backend used by Generate Recommendations and input validation node  
  - Credentials: Google Palm API credentials configured  
  - Inputs: Prompt text and data from previous nodes  
  - Outputs: Raw AI completions for product validation and recommendations  
  - Edge cases: API quota limits, latency, malformed prompts  

- **Generate Recommendations**  
  - Type: LangChain chain LLM node  
  - Role:  
    - Constructs a prompt using detailed product statistics and categories  
    - Enforces formatting rules: Telegram Markdown legacy style, character limits, shortened product names, varied symbols  
    - Requests an output including top picks, budget and premium highlights, quick stats, and pick-by-need  
    - Dynamically adapts language based on product type  
  - Inputs: Processed product data JSON  
  - Outputs: Formatted recommendation text  
  - Edge cases: Exceeding character limits, incomplete data, AI hallucination risks  

---

#### 1.5 Response Delivery

**Overview:**  
Sends the AI-generated product recommendation message back to the user via Telegram.

**Nodes Involved:**  
- Send Final Response (Telegram)  

**Node Details:**

- **Send Final Response**  
  - Type: Telegram node  
  - Role: Sends the final formatted recommendation text to the user’s Telegram chat  
  - Config: Uses Markdown parse mode legacy style; sends to chatId extracted earlier  
  - Inputs: AI-generated formatted text, chatId from Extract Chat & Query  
  - Outputs: Confirmation of message sent  
  - Edge cases: Telegram API failures, invalid chat ID, message size limits  

---

#### 1.6 Error Handling and Notifications

**Overview:**  
Captures any workflow errors, formats a clean and informative error notification, and sends it to an admin Telegram chat for monitoring and troubleshooting.

**Nodes Involved:**  
- Error Trigger  
- Format Error Notification (Code)  
- Notify Admin (Telegram)  

**Node Details:**

- **Error Trigger**  
  - Type: Error Trigger node  
  - Role: Listens for any error in the workflow execution to start error handling  
  - Inputs: Internal error events  
  - Outputs: Error data JSON  

- **Format Error Notification**  
  - Type: Code node  
  - Role:  
    - Parses error details from the error JSON  
    - Extracts workflow name, node name, error message, description, HTTP code, main stack trace line  
    - Formats a concise Telegram HTML message including execution timestamp and ID  
  - Inputs: Error Trigger JSON  
  - Outputs: Formatted error message JSON  

- **Notify Admin**  
  - Type: Telegram node  
  - Role: Sends the formatted error notification to a predefined admin Telegram chat ID  
  - Config: Uses HTML parse mode; chat ID must be replaced with actual admin ID  
  - Inputs: Formatted error message  
  - Outputs: Confirmation of message sent  
  - Edge cases: Telegram API errors, invalid admin chat ID  

---

### 3. Summary Table

| Node Name                 | Node Type                          | Functional Role                            | Input Node(s)                      | Output Node(s)                     | Sticky Note                                                                                                           |
|---------------------------|----------------------------------|-------------------------------------------|----------------------------------|----------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| Telegram Trigger           | telegramTrigger                  | Receive Telegram messages                  | —                                | Validate Product Input, Give Delay | See Sticky Note1: Overview and setup instructions                                                                     |
| Validate Product Input     | chainLlm (LangChain LLM)         | AI validate and extract core product name | Telegram Trigger                 | Check Product Validity            | See Sticky Note4: Validate Input                                                                                      |
| Parse Validation Output    | outputParserStructured (LangChain) | Parse AI validation output JSON            | Validate Product Input           | Validate Product Input            |                                                                                                                       |
| Check Product Validity     | if                              | Branch flow on product input validity      | Parse Validation Output          | Extract Chat & Query (valid), Send Invalid Message (invalid) |                                                                                                                       |
| Send Valid Confirmation    | telegram                        | Notify user input is valid                  | Check Product Validity (valid)   | Extract Chat & Query              |                                                                                                                       |
| Send Invalid Message       | telegram                        | Notify user input invalid                   | Check Product Validity (invalid) | —                                |                                                                                                                       |
| Give Delay                 | wait                           | Add delay before status message              | Telegram Trigger                 | Send Processing Status           |                                                                                                                       |
| Send Processing Status     | telegram                        | Inform user input is being processed        | Give Delay                      | —                                |                                                                                                                       |
| Extract Chat & Query       | set                            | Extract chatId and format query string      | Check Product Validity (valid)   | Decodo API                      |                                                                                                                       |
| Decodo API                 | decodo                         | Scrape Amazon product search results        | Extract Chat & Query             | Process Product Data             | See Sticky Note2: Decodo Credentials setup                                                                             |
| Process Product Data       | code                           | Clean, parse, score, deduplicate, categorize | Decodo API                     | Generate Recommendations         | See Sticky Note: Process Data                                                                                          |
| Generate Recommendations   | chainLlm (LangChain)            | Generate AI-formatted recommendation text   | Process Product Data             | Send Final Response              |                                                                                                                       |
| Gemini 2.5 Flash           | lmChatGoogleGemini              | AI language model backend for validation & generation | Generate Recommendations, Validate Product Input | Generate Recommendations, Validate Product Input |                                                                                                                       |
| Send Final Response        | telegram                        | Send recommendation message to user         | Generate Recommendations         | —                                |                                                                                                                       |
| Error Trigger             | errorTrigger                   | Catch workflow errors                        | —                                | Format Error Notification         | See Sticky Note3: Error Handling                                                                                        |
| Format Error Notification  | code                           | Format error message for Telegram admin     | Error Trigger                   | Notify Admin                    |                                                                                                                       |
| Notify Admin               | telegram                        | Send error notification to admin             | Format Error Notification       | —                                |                                                                                                                       |
| Sticky Note1              | stickyNote                     | Overview and setup instructions              | —                                | —                                | Covers overall workflow operation and setup                                                                           |
| Sticky Note2              | stickyNote                     | Decodo API credentials setup                  | —                                | —                                |                                                                                                                       |
| Sticky Note3              | stickyNote                     | Error handling overview                        | —                                | —                                |                                                                                                                       |
| Sticky Note4              | stickyNote                     | Input validation explanation                   | —                                | —                                |                                                                                                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger**  
   - Node: Telegram Trigger  
   - Config: Listen to "message" updates only  
   - Credentials: Connect your Telegram bot credential (e.g., "Piranusa_assistantbot")  
   - Position: Start of workflow  

2. **Add Validate Product Input (LangChain LLM)**  
   - Node: chainLlm (LangChain)  
   - Prompt: Use the provided prompt to validate product name and extract core keyword in JSON format  
   - Input: Message text from Telegram Trigger  
   - Credentials: LangChain LLM or configured Google Gemini model  

3. **Add Parse Validation Output (LangChain Structured Output Parser)**  
   - Node: outputParserStructured  
   - JSON schema example matching `{ "keyword": "<product_name_or_empty>", "status": "VALID" or "INVALID" }`  
   - Input: Output from Validate Product Input  

4. **Add Check Product Validity (If Node)**  
   - Condition: Evaluate if `status` equals "VALID"  
   - Input: Parsed validation output  
   - Outputs: Branches for valid and invalid  

5. **Add Send Valid Confirmation (Telegram)**  
   - Send HTML message: "Input Valid | keyword: {{ $json.output.keyword }} processing your request..."  
   - Input: Chat id from Telegram Trigger  
   - Connect to valid branch  

6. **Add Send Invalid Message (Telegram)**  
   - Send Markdown message: "no product detected on your input, please try again"  
   - Input: Chat id from Telegram Trigger  
   - Connect to invalid branch  

7. **Add Give Delay (Wait Node)**  
   - Delay: 2 seconds  
   - Input: Telegram Trigger output (parallel with Validate Product Input)  

8. **Add Send Processing Status (Telegram)**  
   - Send Markdown message: "Processing your input..."  
   - Input: Chat id from Telegram Trigger  
   - Connect after Give Delay  

9. **Add Extract Chat & Query (Set Node)**  
   - Assign `chatId` from Telegram message chat id  
   - Assign `message` from validated keyword replacing spaces with "+"  
   - Input: Valid branch from Check Product Validity  

10. **Add Decodo API Node**  
    - Operation: "amazon"  
    - URL: `https://www.amazon.com/s?k={{ $json.message }}`  
    - Credentials: Decodo API key configured in n8n credentials  
    - Input: Output from Extract Chat & Query  

11. **Add Process Product Data (Code Node)**  
    - Paste provided JavaScript code that cleans URLs, parses sales, scores products, categorizes, and outputs enhanced JSON  
    - Input: Output from Decodo API  

12. **Add Generate Recommendations (LangChain chainLlm)**  
    - Use provided prompt with detailed instructions and data placeholders  
    - Input: Output from Process Product Data  
    - Credentials: LangChain LLM or Google Gemini 2.5 Flash model  

13. **Add Gemini 2.5 Flash (Google Gemini LLM)**  
    - Setup with Google Palm API credentials  
    - Used as AI backend for Generate Recommendations and Validate Product Input nodes  

14. **Add Send Final Response (Telegram)**  
    - Send Markdown message with AI-generated text  
    - Chat ID from Extract Chat & Query  
    - Input: Output from Generate Recommendations  

15. **Add Error Trigger Node**  
    - Catch workflow errors globally  

16. **Add Format Error Notification (Code Node)**  
    - Paste provided JavaScript code that extracts and formats error details  

17. **Add Notify Admin (Telegram)**  
    - Send HTML message with formatted error notification  
    - Chat ID: Replace with your admin Telegram chat ID  
    - Input: Output from Format Error Notification  

18. **Connect Error Trigger to Format Error Notification, then to Notify Admin**  

19. **Add Sticky Notes** (Optional but recommended):  
    - Overview and instructions  
    - Decodo credential setup  
    - Input validation explanation  
    - Error handling summary  

20. **Final Steps:**  
    - Test Telegram webhook and bot connectivity  
    - Verify Decodo API credentials and rate limits  
    - Confirm AI credentials and prompt outputs  
    - Set admin chat ID for error notifications  
    - Optionally tune scoring parameters in Process Product Data node  

---

### 5. General Notes & Resources

| Note Content                                                                 | Context or Link                                  |
|------------------------------------------------------------------------------|-------------------------------------------------|
| Decodo API credentials must be obtained at https://decodo.com under Web Advanced scraping APIs dashboard | See Sticky Note2 for setup instructions         |
| Workflow includes robust error handling that formats and sends error notifications to admin via Telegram | See Sticky Note3 for error handling details      |
| AI prompts enforce precise output formatting for Telegram Markdown legacy style with character limits | Embedded in Generate Recommendations node        |
| Workflow designed to handle ambiguous user input by extracting core product names | See Sticky Note4 regarding input validation logic|
| Setup requires Telegram bot credentials, Decodo API credentials, and AI LLM credentials (LangChain or Google Gemini) | Critical for end-to-end functionality             |
| Telegram bot webhook must be configured to forward messages to this workflow | Essential for receiving user queries             |
| Admin Telegram chat ID must be configured in Notify Admin node to receive error alerts | Replace placeholder "YOUR-CHAT-ID" accordingly  |

---

**Disclaimer:** The provided text is exclusively derived from an n8n automation workflow. All data processed is legal and public. The workflow complies strictly with content policies.