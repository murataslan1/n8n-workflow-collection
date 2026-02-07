Analyze Cryptocurrency Market Data with HTX API, GPT-4o and Telegram

https://n8nworkflows.xyz/workflows/analyze-cryptocurrency-market-data-with-htx-api--gpt-4o-and-telegram-8604


# Analyze Cryptocurrency Market Data with HTX API, GPT-4o and Telegram

### 1. Workflow Overview

This workflow, titled **"Analyze Cryptocurrency Market Data with HTX API, GPT-4o and Telegram"**, is designed to provide real-time, structured cryptocurrency market data from HTX (Huobi) via Telegram. It listens for commands from an authorized Telegram user, fetches multiple detailed market data endpoints from HTX’s public REST API, processes and formats the data using GPT-4o-mini, and sends back a clean, readable HTML report directly to the Telegram chat.

The workflow is divided into the following logical blocks:

- **1.1 Input Reception & Authentication:** Receives Telegram messages, verifies authorized user, and prepares session metadata.
- **1.2 Market Data Fetching Agent:** Orchestrates calls to HTX API endpoints for comprehensive market data retrieval.
- **1.3 AI Processing & Reasoning:** Uses GPT-4o-mini and auxiliary AI tools to interpret, format, and generate the final report.
- **1.4 Message Handling & Delivery:** Splits long messages if necessary and sends the formatted report back via Telegram.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Authentication

**Overview:**  
This block listens for new Telegram messages, validates the sender against a configured Telegram user ID, then enriches the message with session metadata for downstream processing.

**Nodes Involved:**  
- Telegram Trigger  
- User Authentication (Replace Telegram ID)  
- Adds "SessionId"

**Node Details:**

- **Telegram Trigger**  
  - *Type:* Telegram Trigger  
  - *Role:* Listens for incoming Telegram messages (update type: "message").  
  - *Config:* Uses a dedicated Telegram bot credential.  
  - *Input/Output:* Input from Telegram platform, outputs raw message JSON.  
  - *Failures:* Possible webhook misconfiguration, Telegram API downtime, invalid credentials.

- **User Authentication (Replace Telegram ID)**  
  - *Type:* Code node (JavaScript)  
  - *Role:* Checks if the Telegram message sender’s ID matches the authorized user ID (must be replaced manually).  
  - *Config:* JavaScript logic returns data only if authorized; else returns `{ unauthorized: true }`.  
  - *Expressions:* `$input.first().json.message.from.id !== <<Replace>>` (replace `<<Replace>>` with actual Telegram user ID).  
  - *Input/Output:* Input from Telegram Trigger; outputs original data if authorized, else flags unauthorized.  
  - *Failures:* Incorrect or missing user ID causes all requests to be blocked.

- **Adds "SessionId"**  
  - *Type:* Set node  
  - *Role:* Adds two fields: `sessionId` (Telegram chat ID) and `message` (Telegram text).  
  - *Config:* Assignments use expressions:  
    - `sessionId = $json.message.chat.id`  
    - `message = $json.message.text`  
  - *Input/Output:* Input from authentication node; output used as session metadata for AI tools.  
  - *Failures:* If chat ID or text is missing, downstream nodes may malfunction.

---

#### 2.2 Market Data Fetching Agent

**Overview:**  
The core orchestrator block uses an AI agent node to query multiple HTX REST API endpoints, fetching raw market data (price, order book, trades, candlesticks, etc.) without analysis or predictions.

**Nodes Involved:**  
- HTX AI Agent  
- 24h Stats  
- Order Book Depth  
- Price (Latest)  
- Best Bid/Ask  
- Klines (Candles)  
- Average Price  
- Recent Trades  
- Calculator  
- Think  
- Simple Memory

**Node Details:**

- **HTX AI Agent**  
  - *Type:* LangChain Agent Node  
  - *Role:* Central orchestrator invoking HTX API tools, using a system prompt defining rules and endpoints for fetching market data only.  
  - *Config:*  
    - Model: `gpt-4.1-mini` (via OpenAI API credential)  
    - System Message: Detailed instructions restricting outputs to raw data presentation, no predictions.  
  - *Input/Output:* Input is user message text; output is structured Telegram HTML report.  
  - *Sub-Workflow:* Uses multiple AI tools for data fetch and formatting (linked via ai_tool and ai_memory connections).  
  - *Failures:* API quota limits, model latency, malformed user input.

- **24h Stats**  
  - *Type:* HTTP Request Tool  
  - *Role:* Fetches 24-hour rolling market stats (`/market/detail`).  
  - *Config:* Query param `symbol` dynamically set from AI input.  
  - *Failures:* Network errors, invalid symbol, rate limits.

- **Order Book Depth**  
  - *Type:* HTTP Request Tool  
  - *Role:* Retrieves order book bids/asks (`/market/depth`) with configurable aggregation and depth.  
  - *Config:* Query params `symbol`, `type` (step0–step5), `depth`.  
  - *Failures:* Too large depth param may cause timeouts.

- **Price (Latest)**  
  - *Type:* HTTP Request Tool  
  - *Role:* Gets latest trade price and best bid/ask snapshot (`/market/detail/merged`).  
  - *Config:* Query param `symbol`.  
  - *Failures:* As above.

- **Best Bid/Ask**  
  - *Type:* HTTP Request Tool  
  - *Role:* Returns best bid/ask snapshot same as Price (Latest) but used separately for clarity.  
  - *Config:* Query param `symbol`.  
  - *Failures:* Same as Price (Latest).

- **Klines (Candles)**  
  - *Type:* HTTP Request Tool  
  - *Role:* Retrieves candlestick (OHLCV) data (`/market/history/kline`) for variable intervals.  
  - *Config:* Query params `symbol`, `period`, `size`.  
  - *Failures:* Invalid period, exceeding max size (2000), malformed symbol.

- **Average Price**  
  - *Type:* HTTP Request Tool  
  - *Role:* Fetches merged ticker for bid/ask; used with Calculator to compute midpoint price.  
  - *Config:* Query param `symbol`.  
  - *Failures:* Same as other HTTP tools.

- **Recent Trades**  
  - *Type:* HTTP Request Tool  
  - *Role:* Retrieves the most recent trades (`/market/history/trade`).  
  - *Config:* Query params `symbol`, `size` (default 100).  
  - *Failures:* Rate limits, malformed symbol.

- **Calculator**  
  - *Type:* LangChain Calculator Tool  
  - *Role:* Performs mathematical operations like spread and percentage changes for the report.  
  - *Config:* No API calls; inputs connected from HTX API nodes via AI Agent.  
  - *Failures:* Invalid or missing numerical inputs.

- **Think**  
  - *Type:* LangChain Tool (reasoning helper)  
  - *Role:* Processes intermediate logic, cleans and formats JSON outputs before final report generation.  
  - *Config:* Connected downstream of API results and Calculator.  
  - *Failures:* Model processing errors, unexpected JSON structures.

- **Simple Memory**  
  - *Type:* LangChain Memory Buffer Window  
  - *Role:* Stores sessionId and symbol state to support multi-turn conversations and data continuity.  
  - *Config:* No special params; linked to AI Agent.  
  - *Failures:* Memory overflow if session data grows unbounded.

---

#### 2.3 AI Processing & Reasoning

**Overview:**  
This block uses the OpenAI GPT-4o-mini model to interpret raw market data from HTX, generate structured HTML reports in Telegram format, and coordinate mathematical calculations and reasoning steps.

**Nodes Involved:**  
- OpenAI Chat Model  
- Calculator  
- Think

**Node Details:**

- **OpenAI Chat Model**  
  - *Type:* LangChain OpenAI Chat Model  
  - *Role:* Formats and reasons on HTX market data to produce final user-facing reports.  
  - *Config:* Model set to `gpt-4.1-mini`.  
  - *Input/Output:* Receives raw data and instructions from the AI Agent, outputs formatted text.  
  - *Failures:* API rate limits, prompt misconfiguration.

- **Calculator**  
  - See 2.2.

- **Think**  
  - See 2.2.

---

#### 2.4 Message Handling & Delivery

**Overview:**  
Prepares the AI-generated Telegram report for delivery by splitting messages exceeding Telegram’s character limit and sending them back to the user via Telegram bot.

**Nodes Involved:**  
- Splits message is more than 4000 characters  
- Telegram

**Node Details:**

- **Splits message is more than 4000 characters**  
  - *Type:* Code node (JavaScript)  
  - *Role:* Checks if the generated message exceeds 4000 characters, splits into chunks accordingly.  
  - *Config:* Splits input string from `$json.output` into 4000-character max segments.  
  - *Input/Output:* Input from HTX AI Agent node output; outputs one or multiple message chunks.  
  - *Failures:* If `$json.output` is missing or not a string, splitting fails.

- **Telegram**  
  - *Type:* Telegram node (send message)  
  - *Role:* Sends HTML formatted messages (or chunked parts) back to the requesting Telegram chat.  
  - *Config:* Uses the Telegram Bot credential; uses chatId from original trigger.  
  - *Input/Output:* Input from splitter node; output is sent message confirmation.  
  - *Failures:* Telegram API downtime, invalid chatId, message format errors.

---

### 3. Summary Table

| Node Name                           | Node Type                             | Functional Role                                      | Input Node(s)                       | Output Node(s)                          | Sticky Note                                                                                              |
|-----------------------------------|-------------------------------------|-----------------------------------------------------|-----------------------------------|---------------------------------------|--------------------------------------------------------------------------------------------------------|
| Telegram Trigger                  | Telegram Trigger                    | Receives incoming Telegram messages                  | -                                 | User Authentication (Replace Telegram ID) | ## Trigger Incoming Telegram Command: Listens for new Telegram messages to trigger the agent            |
| User Authentication (Replace Telegram ID) | Code                              | Validates sender Telegram ID                         | Telegram Trigger                  | Adds "SessionId"                      | ## Validate User Access: Checks Telegram ID against approved user list                                  |
| Adds "SessionId"                 | Set                                | Adds sessionId and message text                      | User Authentication (Replace Telegram ID) | HTX AI Agent                        | ## Generate Session Metadata: Creates a sessionId using Telegram chat_id                               |
| HTX AI Agent                    | LangChain Agent                    | Orchestrates HTX API calls and report generation     | Adds "SessionId"                  | Splits message is more than 4000 characters | ## Main AI Agent: Data Fetcher (HTX): Core orchestrator fetching raw HTX market data                    |
| 24h Stats                       | HTTP Request Tool                  | Fetches 24h rolling market stats                      | HTX AI Agent (ai_tool)            | HTX AI Agent (returns data)           | ### 24h Stats (Ticker Detail): Returns 24h summary (open, high, low, close, volume, etc.)               |
| Order Book Depth                | HTTP Request Tool                  | Retrieves order book snapshot                         | HTX AI Agent (ai_tool)            | HTX AI Agent (returns data)           | ### Order Book Depth: Returns bids/asks order book snapshot with aggregation                            |
| Price (Latest)                  | HTTP Request Tool                  | Retrieves latest trade price and best bid/ask        | HTX AI Agent (ai_tool)            | HTX AI Agent (returns data)           | ### Price (Latest): Latest trade price and bid/ask snapshot                                           |
| Best Bid/Ask                   | HTTP Request Tool                  | Retrieves best bid/ask snapshot                        | HTX AI Agent (ai_tool)            | HTX AI Agent (returns data)           | ### Best Bid/Ask: Returns best bid/ask snapshot with latest trade price                               |
| Klines (Candles)               | HTTP Request Tool                  | Fetches OHLCV candlestick data                        | HTX AI Agent (ai_tool)            | HTX AI Agent (returns data)           | ### Klines (Candles): Candlestick data for configurable intervals                                    |
| Average Price                  | HTTP Request Tool                  | Provides merged ticker data for midpoint calculation | HTX AI Agent (ai_tool)            | HTX AI Agent (returns data)           | ### Merged Ticker: Bid/Ask/Last price for midpoint calculations                                       |
| Recent Trades                 | HTTP Request Tool                  | Retrieves recent executed trades                      | HTX AI Agent (ai_tool)            | HTX AI Agent (returns data)           | ### Recent Trades: Most recent trade batches                                                         |
| Calculator                   | LangChain Calculator Tool          | Performs math operations (spread, % change)          | HTX AI Agent (ai_tool)            | HTX AI Agent                         | ### Calculator: Math inside workflow – spreads, % changes, rounding                                  |
| Think                        | LangChain Tool (reasoning helper)  | Cleans, reshapes JSON, formats output                 | HTX AI Agent (ai_tool)            | HTX AI Agent                         | ### Think: Reasoning helper for intermediate logic and formatting                                    |
| Simple Memory                | LangChain Memory Buffer Window     | Stores session and symbol state for multi-turn dialogs | HTX AI Agent (ai_memory)          | HTX AI Agent                         | ## Short-Term Memory Module: Stores sessionId and symbol state                                       |
| Splits message is more than 4000 characters | Code                             | Splits long messages >4000 chars for Telegram         | HTX AI Agent                     | Telegram                            | ## Handle Telegram Message Limits: Splits messages exceeding Telegram length limits                   |
| Telegram                     | Telegram                           | Sends formatted HTML report to Telegram chat          | Splits message is more than 4000 characters | -                                 | ## Send Final Report to Telegram: Sends final report or split chunks to user                          |
| OpenAI Chat Model            | LangChain OpenAI Chat Model        | GPT-4o-mini for reasoning, formatting, and trade recommendations | HTX AI Agent (ai_languageModel)  | HTX AI Agent                       | ## GPT Model for Reasoning: Interprets signals, generates HTML, recommends trades                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Configure with Telegram Bot API credentials.  
   - Set trigger on "message" updates.

2. **Add Code Node for User Authentication**  
   - Type: Code  
   - JavaScript: check if `message.from.id` matches your Telegram user ID (replace placeholder).  
   - Return original data if authorized, else `{ unauthorized: true }`.

3. **Add Set Node to Add Session Metadata**  
   - Type: Set  
   - Add fields:  
     - `sessionId` = `{{$json["message"]["chat"]["id"]}}`  
     - `message` = `{{$json["message"]["text"]}}`

4. **Add LangChain Agent Node ("HTX AI Agent")**  
   - Type: LangChain Agent  
   - Provide OpenAI API credential for GPT-4.1-mini model.  
   - Set system prompt to define agent as HTX Spot Market Data Agent with access to HTX API endpoints only for data fetching (no advice).  
   - Input text set to `{{$json["message"]}}`.

5. **Add HTTP Request Tool Nodes for Each HTX API Endpoint** (to be linked as AI tools to the Agent):  
   - 24h Stats: `GET https://api.huobi.pro/market/detail` with `symbol` param from AI input.  
   - Order Book Depth: `GET https://api.huobi.pro/market/depth` with `symbol`, `type`, `depth`.  
   - Price (Latest): `GET https://api.huobi.pro/market/detail/merged` `symbol` param.  
   - Best Bid/Ask: same endpoint as Price (Latest), used separately.  
   - Klines (Candles): `GET https://api.huobi.pro/market/history/kline` with `symbol`, `period`, `size`.  
   - Average Price: same endpoint as Price, used with Calculator for midpoint.  
   - Recent Trades: `GET https://api.huobi.pro/market/history/trade` with `symbol`, `size`.

6. **Add LangChain Calculator Node**  
   - Connect outputs from relevant HTTP tools (e.g., bid/ask) for spread and percent change calculations.

7. **Add LangChain Think Node**  
   - Connect HTTP tool outputs and Calculator output to Think node for JSON cleanup and formatting.

8. **Add LangChain Memory Node (Simple Memory)**  
   - Use to store `sessionId` and symbol to support multi-turn conversations.  
   - Link memory to Agent node.

9. **Link all HTTP tools, Calculator, Think, and Memory as AI Tools and AI Memory to the Agent**  
   - Configure connections so that the Agent can invoke these tools dynamically.

10. **Add Code Node to Split Messages Over 4000 Characters**  
    - JavaScript code to split `$json.output` text into chunks of max 4000 characters each.

11. **Add Telegram Node (sendMessage)**  
    - Configure with Telegram Bot credential.  
    - Set `chatId` to `{{$json["message"]["chat"]["id"]}}` from Telegram Trigger.  
    - Send message(s) received from splitter node.  
    - Enable HTML parse mode for formatted output.

12. **Connect Nodes in This Order:**  
    - Telegram Trigger → User Authentication → Adds "SessionId" → HTX AI Agent → Splits message node → Telegram sendMessage.

13. **Set Credentials:**  
    - OpenAI API credential with GPT-4.1-mini access.  
    - Telegram Bot API credential.  
    - HTX API requires no auth (public endpoints).

14. **Update User Authentication Node** with your Telegram user ID to restrict access.

15. **Test by sending a valid symbol (e.g., "btcusdt") to your Telegram Bot.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                          | Context or Link                                                                                  |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow only fetches and formats raw market data from HTX; it does **not** provide trading signals, advice, or predictions.                                                                                                                                                                                                                                    | System design rule to prevent misuse.                                                          |
| Telegram message output is formatted with HTML tags to present a human-readable report (bold titles, bullet points).                                                                                                                                                                                                                                                | Telegram API message formatting best practices.                                               |
| Replace the Telegram user ID in the authentication code node to restrict access to authorized users only.                                                                                                                                                                                                                                                           | Security best practice.                                                                        |
| HTX API endpoints require lowercase symbols without dashes or slashes (e.g., "btcusdt").                                                                                                                                                                                                                                                                              | HTX API usage note.                                                                            |
| The AI Agent uses GPT-4o-mini model for reasoning and formatting only, not for data fetching or analysis, ensuring compliance with data integrity.                                                                                                                                                                                                                  | AI usage guideline.                                                                           |
| The system includes multiple specialized HTX API tools (HTTP Request nodes) called via the AI Agent to modularize data fetching.                                                                                                                                                                                                                                    | Modular design pattern.                                                                       |
| The Calculator and Think LangChain nodes support intermediate math and JSON formatting required for the final report.                                                                                                                                                                                                                                              | Workflow internal data transformation.                                                       |
| The Simple Memory node enables multi-turn conversation context retention, useful for extended Telegram interactions.                                                                                                                                                                                                                                                | State management feature.                                                                     |
| Telegram messages longer than 4000 characters are safely split into chunks to comply with Telegram API limits.                                                                                                                                                                                                                                                       | Telegram API constraint handling.                                                            |
| Author and licensing info: Don Jayamaha, Treasurium Capital Limited Company. The system and workflow structure are proprietary.                                                                                                                                                                                                                                      | Intellectual property notice.                                                                |
| LinkedIn profile for support and contact: [linkedin.com/in/donjayamahajr](http://linkedin.com/in/donjayamahajr)                                                                                                                                                                                                                                                       | Support and contact information.                                                             |
| Full system documentation is embedded as a large sticky note node named "Sticky Note17" within the workflow for reference.                                                                                                                                                                                                                                         | Internal documentation resource.                                                             |

---

**Disclaimer:** The text provided comes exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled are legal and public.