Access Real-time Binance Market Data with GPT-4o Formatting in Telegram

https://n8nworkflows.xyz/workflows/access-real-time-binance-market-data-with-gpt-4o-formatting-in-telegram-8614


# Access Real-time Binance Market Data with GPT-4o Formatting in Telegram

---

### 1. Workflow Overview

This workflow, titled **"Access Real-time Binance Market Data with GPT-4o Formatting in Telegram"**, is designed to provide real-time Binance Spot Market data to authorized Telegram users with the help of AI formatting. It integrates Binance’s REST API market endpoints, OpenAI’s GPT-4o-mini model for output formatting, and Telegram Bot messaging to deliver clean, structured reports.

**Target Use Cases:**

- Telegram users request live Binance market data for specific trading pairs.
- The workflow fetches multiple Binance endpoints in parallel.
- It uses OpenAI to format raw JSON data into readable Telegram HTML.
- Manages session memory for multi-turn conversations.
- Enforces user authentication based on Telegram ID.
- Handles Telegram message length constraints by splitting long replies.

**Logical Blocks:**

- **1.1 Input Reception & Authentication:** Receiving Telegram messages and validating authorized users.
- **1.2 Session Metadata Setup:** Creating session identifiers for memory tracking.
- **1.3 Binance Market Data Fetching:** Parallel API calls to Binance endpoints to retrieve live data.
- **1.4 AI Processing & Formatting:** Using OpenAI GPT-4o-mini and AI tools (Calculator, Think) to format and process data.
- **1.5 Message Splitting:** Ensuring Telegram message limits (4000 chars) are respected.
- **1.6 Telegram Output:** Sending formatted messages back to the user.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Authentication

- **Overview:**  
  Listens for incoming Telegram messages and filters them by authorized Telegram user ID to ensure only approved users can trigger the workflow.

- **Nodes Involved:**  
  - Telegram Trigger  
  - User Authentication (Replace Telegram ID)  
  - Sticky Note (Trigger Incoming Telegram Command)  
  - Sticky Note1 (Validate User Access)

- **Node Details:**

  - **Telegram Trigger**  
    - *Type:* Telegram Trigger  
    - *Role:* Listens for new Telegram messages (updates of type "message").  
    - *Configuration:* Uses a webhookId, Telegram credentials for bot access.  
    - *Inputs:* External Telegram messages.  
    - *Outputs:* Raw Telegram message JSON forward to authentication.  
    - *Failure modes:* Telegram API downtime, webhook misconfiguration.  
    - *Sticky Note:* Describes role as "Listens for incoming Telegram messages".

  - **User Authentication (Replace Telegram ID)**  
    - *Type:* Code (JavaScript)  
    - *Role:* Checks if the Telegram message sender ID matches a specified authorized ID (replace placeholder).  
    - *Configuration:* Compares `$input.first().json.message.from.id` to a hard-coded value; returns unauthorized flag if mismatch.  
    - *Inputs:* Telegram Trigger output.  
    - *Outputs:* Passes data downstream only if authorized; else returns unauthorized signal.  
    - *Failure modes:* Expression errors if message structure is unexpected; unauthorized users blocked.  
    - *Sticky Note:* Describes user ID validation purpose.

#### 1.2 Session Metadata Setup

- **Overview:**  
  Generates a session identifier from the Telegram chat ID and attaches the user’s message text for downstream processing and memory management.

- **Nodes Involved:**  
  - Adds "SessionId"  
  - Sticky Note2 (Generate Session Metadata)

- **Node Details:**

  - **Adds "SessionId"**  
    - *Type:* Set node  
    - *Role:* Assigns `sessionId` from `message.chat.id` and duplicates the user’s message text under `message`.  
    - *Configuration:* Uses expressions `={{ $json.message.chat.id }}` for sessionId and `={{ $json.message.text }}` for message.  
    - *Inputs:* User Authentication approved messages.  
    - *Outputs:* Passes enhanced JSON object downstream.  
    - *Failure modes:* Missing chat id or message text breaks session assignment.

#### 1.3 Binance Market Data Fetching

- **Overview:**  
  Core orchestrator node uses multiple parallel HTTP request tools to fetch real-time market data from Binance APIs for the requested symbol. Data includes latest price, 24h stats, order book depth, best bid/ask, klines, average price, and recent trades.

- **Nodes Involved:**  
  - Binance AI Agent (LangChain Agent)  
  - Price (Latest) (HTTP Request Tool)  
  - 24h Stats (HTTP Request Tool)  
  - Order Book Depth (HTTP Request Tool)  
  - Best Bid/Ask (HTTP Request Tool)  
  - Klines (Candles) (HTTP Request Tool)  
  - Average Price (HTTP Request Tool)  
  - Recent Trades (HTTP Request Tool)  
  - Calculator (LangChain Tool)  
  - Think (LangChain Tool)  
  - Sticky Note3 through Sticky Note16 (Documentation notes for each endpoint and tool)

- **Node Details:**

  - **Binance AI Agent**  
    - *Type:* LangChain Agent  
    - *Role:* Orchestrates fetching market data using Binance endpoints; uses OpenAI Chat model internally to format and control data flow.  
    - *Configuration:* System message instructs to only fetch and format data, no analysis or trading advice.  
    - *Inputs:* User message and session metadata.  
    - *Outputs:* Raw formatted report string to splitter.  
    - *Failure modes:* API request errors, symbol parameter missing or malformed, OpenAI API errors.

  - **Price (Latest)**  
    - *Type:* HTTP Request Tool  
    - *Role:* Fetches the latest trade price for the symbol.  
    - *Config:* `GET https://api.binance.com/api/v3/ticker/price?symbol=SYMBOL`  
    - *Inputs:* Symbol variable from AI parameters.  
    - *Outputs:* JSON with latest price.  
    - *Failure modes:* Symbol not provided, Binance API downtime.

  - **24h Stats**  
    - *Role:* Fetches 24h rolling stats for the symbol.  
    - *Config:* `GET /api/v3/ticker/24hr?symbol=SYMBOL`  
    - *Failure modes:* Same as above.

  - **Order Book Depth**  
    - *Role:* Fetches order book bids/asks up to `limit` (default 100).  
    - *Config:* `GET /api/v3/depth?symbol=SYMBOL&limit=100`  
    - *Failure modes:* Invalid limit, rate limits.

  - **Best Bid/Ask**  
    - *Role:* Gets best bid and ask prices/sizes.  
    - *Config:* `GET /api/v3/ticker/bookTicker?symbol=SYMBOL`  

  - **Klines (Candles)**  
    - *Role:* Fetches candlestick data for symbol with interval (default 15m) and limit (default 20).  
    - *Config:* `GET /api/v3/klines?symbol=SYMBOL&interval=15m&limit=20`

  - **Average Price**  
    - *Role:* Gets current average rolling price.  
    - *Config:* `GET /api/v3/avgPrice?symbol=SYMBOL`

  - **Recent Trades**  
    - *Role:* Gets recent trades for symbol, limit 100.  
    - *Config:* `GET /api/v3/trades?symbol=SYMBOL&limit=100`

  - **Calculator**  
    - *Type:* LangChain Calculator Tool  
    - *Role:* Performs math operations on Binance data (e.g., spreads, percent changes).

  - **Think**  
    - *Type:* LangChain Think Tool  
    - *Role:* AI helper to reshape, extract, and prepare data for final formatting.

#### 1.4 AI Processing & Formatting

- **Overview:**  
  The OpenAI Chat Model (gpt-4o-mini) is used to structure, reason about, and format the combined Binance data into human-readable Telegram HTML messages.

- **Nodes Involved:**  
  - OpenAI Chat Model  
  - Binance AI Agent (uses this internally)  
  - Sticky Note6 (GPT Model for Reasoning)

- **Node Details:**

  - **OpenAI Chat Model**  
    - *Type:* LangChain OpenAI Chat Model  
    - *Role:* Formats market data into clean HTML, interprets values, and applies reasoning rules.  
    - *Config:* Model set to `gpt-4.1-mini`, credentials linked to OpenAI account.  
    - *Inputs:* Market data JSON from Binance AI Agent.  
    - *Outputs:* Formatted string report.  
    - *Failure modes:* API rate limits, malformed input JSON, timeout.

#### 1.5 Message Splitting

- **Overview:**  
  Checks if the AI-generated message exceeds Telegram’s 4000-character limit and splits it into smaller chunks to avoid Telegram API rejection.

- **Nodes Involved:**  
  - Splits message is more than 4000 characters (Code Node)  
  - Sticky Note4 (Handle Telegram Message Limits)

- **Node Details:**

  - **Splits message is more than 4000 characters**  
    - *Type:* Code (JavaScript)  
    - *Role:* Splits long text into segments of 4000 characters max.  
    - *Config:* Uses substring slicing in a loop.  
    - *Inputs:* AI Agent output message.  
    - *Outputs:* Array of message chunks.  
    - *Failure modes:* Unexpected input format, empty message.

#### 1.6 Telegram Output

- **Overview:**  
  Sends the formatted (and possibly chunked) Telegram HTML message(s) back to the authenticated user via the Telegram bot.

- **Nodes Involved:**  
  - Telegram (Send Message)  
  - Sticky Note5 (Send Final Report to Telegram)

- **Node Details:**

  - **Telegram (Send Message)**  
    - *Type:* Telegram Node (Send Message)  
    - *Role:* Sends the text message(s) to the Telegram chat identified by chat ID.  
    - *Config:* Uses chat ID from Telegram Trigger, disables attribution footer, uses Telegram Bot credentials.  
    - *Inputs:* Split message chunks.  
    - *Outputs:* Telegram API responses.  
    - *Failure modes:* Telegram API limits, invalid chat ID, network errors.

---

### 3. Summary Table

| Node Name                           | Node Type                               | Functional Role                             | Input Node(s)                                  | Output Node(s)                            | Sticky Note                                                                                      |
|-----------------------------------|---------------------------------------|--------------------------------------------|-----------------------------------------------|------------------------------------------|------------------------------------------------------------------------------------------------|
| Telegram Trigger                  | Telegram Trigger                      | Listens for new Telegram messages          | External Telegram API                         | User Authentication                      | Listens for incoming Telegram messages from users. Triggers the full agent process.             |
| User Authentication (Replace Telegram ID) | Code                                 | Validates Telegram user ID                  | Telegram Trigger                             | Adds "SessionId"                         | Checks incoming Telegram ID against approved user list.                                         |
| Adds "SessionId"                 | Set                                  | Creates session metadata (sessionId, message) | User Authentication                          | Binance AI Agent                        | Creates a sessionId using Telegram chat.id for memory and routing.                              |
| Binance AI Agent                 | LangChain Agent                      | Orchestrates Binance data fetching and formatting | Adds "SessionId"                            | Splits message is more than 4000 characters | Core orchestrator fetching Binance market data and formatting output with OpenAI.                |
| Price (Latest)                  | HTTP Request Tool                    | Fetches latest symbol price                 | Binance AI Agent (AI Tool)                   | Binance AI Agent                        | Fetches latest trade price for the requested symbol.                                            |
| 24h Stats                      | HTTP Request Tool                    | Fetches 24h rolling stats                    | Binance AI Agent (AI Tool)                   | Binance AI Agent                        | Fetches 24-hour price change statistics and volume.                                            |
| Order Book Depth               | HTTP Request Tool                    | Fetches order book bids/asks                 | Binance AI Agent (AI Tool)                   | Binance AI Agent                        | Returns order book bids and asks up to requested limit.                                        |
| Best Bid/Ask                  | HTTP Request Tool                    | Fetches best bid and ask prices               | Binance AI Agent (AI Tool)                   | Binance AI Agent                        | Returns best bid and ask prices and sizes.                                                     |
| Klines (Candles)              | HTTP Request Tool                    | Fetches candlestick data                      | Binance AI Agent (AI Tool)                   | Binance AI Agent                        | Returns OHLC candlestick bars for symbol and interval.                                        |
| Average Price                 | HTTP Request Tool                    | Fetches current average price                 | Binance AI Agent (AI Tool)                   | Binance AI Agent                        | Returns rolling average price for symbol.                                                     |
| Recent Trades                | HTTP Request Tool                    | Fetches recent trades                          | Binance AI Agent (AI Tool)                   | Binance AI Agent                        | Returns most recent trades for symbol.                                                        |
| Calculator                   | LangChain Tool                      | Performs math operations on data              | Binance AI Agent (AI Tool)                   | Binance AI Agent                        | Calculates spreads, percentages, and other math operations.                                   |
| Think                        | LangChain Tool                      | Assists in reasoning and formatting           | Binance AI Agent (AI Tool)                   | Binance AI Agent                        | Helps reshape JSON and prepare formatted output.                                              |
| OpenAI Chat Model             | LangChain OpenAI Chat Model          | AI model for reasoning and formatting         | Binance AI Agent (AI Language Model)         | Binance AI Agent                        | GPT-4o-mini model formats and interprets market data for human-readable output.                |
| Splits message is more than 4000 characters | Code                                 | Splits long messages into Telegram-safe chunks | Binance AI Agent                            | Telegram                               | Splits messages exceeding 4000 characters into smaller chunks.                                |
| Telegram                     | Telegram Node                      | Sends formatted message back to user          | Splits message is more than 4000 characters | -                                      | Sends final HTML report or message chunks to Telegram chat.                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Configure with your Telegram Bot credentials (OAuth2 or API key).  
   - Set webhook to listen for "message" updates.

2. **Add Code Node "User Authentication (Replace Telegram ID)"**  
   - Paste JavaScript code to check `$input.first().json.message.from.id` against your Telegram user ID (replace placeholder).  
   - If unauthorized, return `{unauthorized:true}` to stop flow.

3. **Add Set Node "Adds 'SessionId'"**  
   - Assign two fields:  
     - `sessionId` = `={{ $json.message.chat.id }}`  
     - `message` = `={{ $json.message.text }}`  
   - Connect output of User Authentication to this node.

4. **Add LangChain Agent Node "Binance AI Agent"**  
   - Use OpenAI Chat Model with GPT-4o-mini as an internal language model.  
   - Configure system prompt to instruct fetching Binance REST API endpoints only, no analysis.  
   - Define available Binance endpoints and parameters inside the agent configuration.  
   - Connect output of "Adds 'SessionId'" node to this agent.

5. **Add HTTP Request Tool Nodes for Binance APIs:**  
   - Create nodes for each endpoint:  
     - Price (Latest): `GET https://api.binance.com/api/v3/ticker/price?symbol=SYMBOL`  
     - 24h Stats: `GET /api/v3/ticker/24hr?symbol=SYMBOL`  
     - Order Book Depth: `GET /api/v3/depth?symbol=SYMBOL&limit=100`  
     - Best Bid/Ask: `GET /api/v3/ticker/bookTicker?symbol=SYMBOL`  
     - Klines (Candles): `GET /api/v3/klines?symbol=SYMBOL&interval=15m&limit=20`  
     - Average Price: `GET /api/v3/avgPrice?symbol=SYMBOL`  
     - Recent Trades: `GET /api/v3/trades?symbol=SYMBOL&limit=100`  
   - Use query parameters dynamically injected from AI Agent parameters (`$fromAI` expressions).  
   - Connect all these HTTP request nodes as AI tools input to the Binance AI Agent node.

6. **Add LangChain Tools "Calculator" and "Think"**  
   - Calculator: For performing math operations on data.  
   - Think: For reshaping and extracting relevant fields.  
   - Connect these as AI tools input to Binance AI Agent for intermediate processing.

7. **Add OpenAI Chat Model Node**  
   - Use model `gpt-4o-mini` with your OpenAI credentials.  
   - This node is linked internally by Binance AI Agent for formatting the final message.

8. **Add Code Node "Splits message is more than 4000 characters"**  
   - JavaScript logic to split long messages into 4000-character chunks.  
   - Input: Output message from Binance AI Agent.  
   - Output: Array of message chunks.

9. **Add Telegram Node (Send Message)**  
   - Configure with Telegram Bot credentials.  
   - Set chatId dynamically from `Telegram Trigger` node’s `message.chat.id`.  
   - Set message text from splitter output.  
   - Disable append attribution.

10. **Connect the nodes in this order:**  
    Telegram Trigger → User Authentication → Adds "SessionId" → Binance AI Agent → Splits message node → Telegram Send Message

11. **Credential Setup:**  
    - Telegram Bot API credentials (token).  
    - OpenAI API key for GPT-4o-mini model.

12. **Testing:**  
    - Send a Telegram message from the authorized user to trigger the workflow.  
    - Confirm the workflow fetches live Binance data, formats it, and sends it back in Telegram HTML format.  
    - Check handling of messages exceeding 4000 characters.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                | Context or Link                                      |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| The workflow strictly uses Binance’s official public REST API for data fetching and does not perform any trading advice, sentiment analysis, or predictions. It only presents raw market data formatted for Telegram.                                                                                                                                                                             | Workflow design principle                            |
| Telegram messages longer than 4000 characters are automatically split into multiple messages to respect Telegram API limits.                                                                                                                                                                                                                                                                | Telegram API constraint                              |
| The AI model used is GPT-4o-mini, a lightweight OpenAI model optimized for reasoning and formatting rather than heavy analysis.                                                                                                                                                                                                                                                            | OpenAI model choice                                 |
| The system enforces user authentication by comparing Telegram user IDs; replace placeholder in the authentication code node with your own Telegram ID to restrict access.                                                                                                                                                                                                                   | Security measure                                     |
| The workflow includes comprehensive inline sticky notes documenting each node’s purpose, API endpoint details, and usage instructions.                                                                                                                                                                                                                                                     | Inline documentation within workflow                 |
| LinkedIn profile of the author for support and licensing: [linkedin.com/in/donjayamahajr](http://linkedin.com/in/donjayamahajr)                                                                                                                                                                                                                                                               | Support & licensing                                  |
| © 2025 Treasurium Capital Limited Company. The workflow and architecture are proprietary and protected by U.S. copyright law. Unauthorized reuse or resale is prohibited.                                                                                                                                                                                                                   | Legal notice                                        |

---

**Disclaimer:** The text provided is exclusively from an automated workflow created in n8n, respecting all current content policies and contains no illegal, offensive, or protected material. All data processed is legal and public.

---