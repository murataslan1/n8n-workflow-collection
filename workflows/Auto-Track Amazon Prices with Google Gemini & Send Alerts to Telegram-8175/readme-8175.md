Auto-Track Amazon Prices with Google Gemini & Send Alerts to Telegram

https://n8nworkflows.xyz/workflows/auto-track-amazon-prices-with-google-gemini---send-alerts-to-telegram-8175


# Auto-Track Amazon Prices with Google Gemini & Send Alerts to Telegram

### 1. Workflow Overview

This workflow automates the monitoring of Amazon product prices by periodically fetching product pages, extracting and cleaning HTML content, and utilizing Google Gemini AI to analyze price information. When the price is at or below a configured target, it sends an alert via Telegram. It also handles error messaging through Telegram if any step fails. The workflow is structured into the following logical blocks:

- **1.1 Scheduling and Configuration:** Regularly triggers the workflow and sets up product and alert parameters.
- **1.2 Data Retrieval and Cleaning:** Fetches the Amazon product HTML and cleans it for AI processing.
- **1.3 AI Processing:** Uses Google Gemini chat model with memory and structured output parsing to extract price data.
- **1.4 Price Evaluation:** Compares extracted price against the target and sets success or error messages accordingly.
- **1.5 Notification Dispatch:** Sends success or error alerts to Telegram based on price evaluation outcomes.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduling and Configuration

- **Overview:** Periodically initiates the workflow and configures key parameters for the product and alert conditions.
- **Nodes Involved:** Schedule Trigger1, Config: Product & Alert

**Schedule Trigger1**  
- *Type & Role:* Cron trigger node that initiates workflow runs at defined intervals (default unspecified).  
- *Configuration:* Default cron settings, likely periodic (e.g., hourly/daily).  
- *Input/Output:* No input; outputs trigger signal to Config node.  
- *Edge Cases:* Misconfigured cron expression could prevent triggers.  
- *Version:* n8n base cron node v1.

**Config: Product & Alert**  
- *Type & Role:* Set node initializing variables such as product URL, target price, alert thresholds.  
- *Configuration:* Sets key-value pairs for product URL, target price, and possibly Telegram chat IDs.  
- *Input/Output:* Receives trigger from Schedule; outputs configured parameters to Fetch HTML node.  
- *Edge Cases:* Missing or malformed product URL or target price leads to downstream failures.

---

#### 2.2 Data Retrieval and Cleaning

- **Overview:** Fetches raw HTML from the Amazon product page and cleans it to isolate relevant content for AI analysis.  
- **Nodes Involved:** Fetch HTML, Parse and clean HTML

**Fetch HTML**  
- *Type & Role:* HTTP Request node fetching the product page HTML.  
- *Configuration:* HTTP GET request to the URL set in Config node parameters.  
- *Input/Output:* Input: product URL; Output: raw HTML content.  
- *Edge Cases:* HTTP errors (e.g., 403 Forbidden, 404 Not Found), timeouts, anti-bot measures.  
- *Version:* n8n base HTTP Request v4.2.

**Parse and clean HTML**  
- *Type & Role:* Code node that processes raw HTML to extract and sanitize price-relevant sections.  
- *Configuration:* Custom JavaScript code likely uses regex or DOM parsing to clean.  
- *Input/Output:* Input: raw HTML; Output: cleaned HTML snippet or text for AI.  
- *Edge Cases:* HTML structure changes breaking parsing logic, empty or invalid HTML input.

---

#### 2.3 AI Processing

- **Overview:** Uses Google Gemini AI with memory and structured output parsing to analyze and extract structured pricing data from cleaned HTML.  
- **Nodes Involved:** Google Gemini Chat Model1, Memory, Structured Output Parser, AI Agent

**Google Gemini Chat Model1**  
- *Type & Role:* Language model node interfacing with Google Gemini chat API to process input text.  
- *Configuration:* Uses configured Google credentials and model parameters to generate AI responses.  
- *Input/Output:* Input: cleaned HTML and prompt; Output: AI-generated chat response.  
- *Edge Cases:* API authentication failures, rate limits, unexpected model output format.  
- *Version:* Langchain Google Gemini node v1.

**Memory**  
- *Type & Role:* Memory buffer node maintaining conversational context for AI agent.  
- *Configuration:* Buffer window strategy storing recent interactions to maintain context.  
- *Input/Output:* Connects AI conversation data into AI Agent node for stateful processing.  
- *Edge Cases:* Memory overflow or stale context may affect AI response quality.

**Structured Output Parser**  
- *Type & Role:* Parses AI response to enforce structured output (e.g., JSON with price fields).  
- *Configuration:* Defined schema or parsing rules to extract price data cleanly.  
- *Input/Output:* Takes AI raw output, outputs structured data to AI Agent.  
- *Edge Cases:* AI output deviating from expected schema causing parsing errors.

**AI Agent**  
- *Type & Role:* Central node orchestrating AI model, memory, and output parsing for price extraction.  
- *Configuration:* Connects Google Gemini model, memory, and structured output parser to run AI logic.  
- *Input/Output:* Input: cleaned HTML; Output: structured price data.  
- *Edge Cases:* Failure in any connected AI components propagates error here.

---

#### 2.4 Price Evaluation

- **Overview:** Compares the extracted product price to the configured target price and branches workflow accordingly.  
- **Nodes Involved:** If, IF: Price <= Target?, Set: Success Message, Set: Error Message

**If**  
- *Type & Role:* Decision node branching based on the outcome of price comparison.  
- *Configuration:* Routes success path if price data is valid, else error path.  
- *Input/Output:* Input: AI Agent output; Outputs: IF: Price <= Target? or Set: Error Message.  
- *Edge Cases:* Missing or malformed price data causes error path.

**IF: Price <= Target?**  
- *Type & Role:* Conditional node checking if extracted price is less than or equal to target price.  
- *Configuration:* Numeric comparison expression.  
- *Input/Output:* Input: structured price and target; Outputs: Set: Success Message if true.  
- *Edge Cases:* Non-numeric values or missing fields cause logical failure.

**Set: Success Message**  
- *Type & Role:* Set node preparing a success notification message with price details.  
- *Configuration:* Constructs message text including current price and product info.  
- *Input/Output:* Input: price data; Output: message text for Telegram.  
- *Edge Cases:* Missing price or product info results in incomplete messages.

**Set: Error Message**  
- *Type & Role:* Set node preparing an error notification message detailing failure reasons.  
- *Configuration:* Includes error context such as HTTP failure, parsing error, or AI failure.  
- *Input/Output:* Input: error context; Output: message text for Telegram.  
- *Edge Cases:* Unclear error context may confuse recipients.

---

#### 2.5 Notification Dispatch

- **Overview:** Sends the prepared success or error messages to a Telegram chat to alert users.  
- **Nodes Involved:** Send Success, Send Error

**Send Success**  
- *Type & Role:* Telegram node sending the success alert message.  
- *Configuration:* Uses Telegram Bot credentials and configured chat ID.  
- *Input/Output:* Input: success message text; Output: Telegram message sent confirmation.  
- *Edge Cases:* Telegram API errors, invalid bot token, chat permissions.

**Send Error**  
- *Type & Role:* Telegram node sending the error alert message.  
- *Configuration:* Same Telegram credentials as success node.  
- *Input/Output:* Input: error message text; Output: Telegram message sent confirmation.  
- *Edge Cases:* Same as Send Success node.

---

### 3. Summary Table

| Node Name                | Node Type                                 | Functional Role                  | Input Node(s)           | Output Node(s)            | Sticky Note |
|--------------------------|-------------------------------------------|---------------------------------|------------------------|---------------------------|-------------|
| Schedule Trigger1         | Cron Trigger                              | Initiates workflow periodically | —                      | Config: Product & Alert   |             |
| Config: Product & Alert   | Set                                       | Sets product URL, target price  | Schedule Trigger1       | Fetch HTML                |             |
| Fetch HTML               | HTTP Request                             | Retrieves product HTML          | Config: Product & Alert | Parse and clean HTML      |             |
| Parse and clean HTML     | Code                                      | Cleans and extracts HTML parts  | Fetch HTML              | AI Agent                  |             |
| AI Agent                 | Langchain AI Agent                        | Coordinates AI price extraction | Parse and clean HTML    | If                        |             |
| Memory                   | Langchain Memory Buffer                   | Maintains AI conversational state | —                    | AI Agent (ai_memory)      |             |
| Google Gemini Chat Model1| Langchain Google Gemini LM                | Language model processing       | —                      | AI Agent (ai_languageModel)|             |
| Structured Output Parser | Langchain Output Parser                    | Parses AI output into structured data | —                 | AI Agent (ai_outputParser)|             |
| If                       | If                                        | Branches on AI output validity  | AI Agent                | IF: Price <= Target?, Set: Error Message |             |
| IF: Price <= Target?     | If                                        | Checks if price <= target       | If                      | Set: Success Message      |             |
| Set: Success Message     | Set                                       | Prepares success alert message  | IF: Price <= Target?    | Send Success              |             |
| Set: Error Message       | Set                                       | Prepares error alert message    | If                      | Send Error                |             |
| Send Success             | Telegram                                  | Sends success notification      | Set: Success Message    | —                         |             |
| Send Error               | Telegram                                  | Sends error notification        | Set: Error Message      | —                         |             |
| Sticky Note1             | Sticky Note                              | (No content)                    | —                      | —                         |             |
| Sticky Note2             | Sticky Note                              | (No content)                    | —                      | —                         |             |
| Sticky Note3             | Sticky Note                              | (No content)                    | —                      | —                         |             |
| Sticky Note4             | Sticky Note                              | (No content)                    | —                      | —                         |             |
| Sticky Note5             | Sticky Note                              | (No content)                    | —                      | —                         |             |
| Sticky Note6             | Sticky Note                              | (No content)                    | —                      | —                         |             |
| Sticky Note7             | Sticky Note                              | (No content)                    | —                      | —                         |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Cron Trigger node** named `Schedule Trigger1`:
   - Set the schedule (e.g., every hour or as desired).
   - No input required.

2. **Add a Set node** named `Config: Product & Alert`:
   - Connect from `Schedule Trigger1`.
   - Define parameters:
     - `productUrl`: Amazon product page URL (string).
     - `targetPrice`: Numeric price threshold.
     - Any Telegram chat ID or bot token parameters if needed.

3. **Add an HTTP Request node** named `Fetch HTML`:
   - Connect from `Config: Product & Alert`.
   - Method: GET.
   - URL: Use expression referencing `productUrl` from previous node.
   - Optional: Set headers/user-agent to mimic browser to avoid blocking.

4. **Add a Code node** named `Parse and clean HTML`:
   - Connect from `Fetch HTML`.
   - Write JavaScript code to parse the HTML string to extract clean price-related content.
   - Use DOM parsing or regex as appropriate.
   - Output cleaned text for AI processing.

5. **Add a Langchain AI Agent node** named `AI Agent`:
   - Connect from `Parse and clean HTML`.
   - Link internally to:
     - `Google Gemini Chat Model1` node (configured below) via `ai_languageModel`.
     - `Memory` node (configured below) via `ai_memory`.
     - `Structured Output Parser` node (configured below) via `ai_outputParser`.

6. **Add a Google Gemini Chat Model node** named `Google Gemini Chat Model1`:
   - Configure Google API credentials.
   - Set model parameters (e.g., temperature, max tokens).
   - Connect output to `AI Agent` as language model.

7. **Add a Memory Buffer Window node** named `Memory`:
   - Configure buffer size for conversation context.
   - Connect to `AI Agent` memory input.

8. **Add a Structured Output Parser node** named `Structured Output Parser`:
   - Define expected structured output schema (e.g., JSON with `price` field).
   - Connect to `AI Agent` output parser input.

9. **Add an If node** named `If`:
   - Connect from `AI Agent`.
   - Condition: Check if AI output is valid (e.g., price field exists).
   - True path connects to next If node; False path to error handling.

10. **Add an If node** named `IF: Price <= Target?`:
    - Connect from `If` true output.
    - Condition: Extract `price` from AI output and compare to `targetPrice` from Config node.
    - True path connects to success message; False path ends or no action.

11. **Add Set nodes**:
    - `Set: Success Message`: Connect from `IF: Price <= Target?` true output.
      - Compose Telegram message text with product name, current price, and alert.
    - `Set: Error Message`: Connect from `If` false output.
      - Compose error message text explaining failure cause.

12. **Add Telegram nodes**:
    - `Send Success`: Connect from `Set: Success Message`.
      - Configure Telegram Bot credentials and chat ID.
      - Map message text to message parameter.
    - `Send Error`: Connect from `Set: Error Message`.
      - Configure same Telegram credentials.
      - Map error message text accordingly.

13. **Test the workflow** end-to-end, ensure credentials for Google Gemini and Telegram are correctly set up.

---

### 5. General Notes & Resources

| Note Content                                                                                  | Context or Link                                      |
|-----------------------------------------------------------------------------------------------|-----------------------------------------------------|
| Workflow uses Google Gemini AI via Langchain integration for advanced natural language parsing | Requires Google API credentials and Langchain nodes |
| Telegram notifications require Bot Token and chat ID setup for message dispatch               | Telegram Bot API documentation                       |
| Consider adding user-agent headers in HTTP Request node to avoid Amazon anti-bot detection    | Amazon may block scraping without proper headers    |
| Structured Output Parser schema must align with Google Gemini's response format               | Use JSON schema validation to prevent parsing errors|

---

**Disclaimer:** The provided text is extracted exclusively from an automated workflow created using n8n, a tool for integration and automation. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All manipulated data are legal and public.