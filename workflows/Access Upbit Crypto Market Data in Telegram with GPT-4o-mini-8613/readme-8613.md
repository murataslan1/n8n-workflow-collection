Access Upbit Crypto Market Data in Telegram with GPT-4o-mini

https://n8nworkflows.xyz/workflows/access-upbit-crypto-market-data-in-telegram-with-gpt-4o-mini-8613


# Access Upbit Crypto Market Data in Telegram with GPT-4o-mini

---

# 1. Workflow Overview

This workflow, titled **"Upbit AI Agent v1.02"**, is designed to serve as an AI-powered Telegram bot interface for accessing real-time spot market data from the Upbit cryptocurrency exchange. It listens to Telegram messages from an authenticated user, processes commands to query various Upbit public market endpoints, gathers and formats the data, and returns a clean, structured textual report back to the user via Telegram.

The workflow is logically divided into the following functional blocks:

- **1.1 Input Reception & Authentication**  
  Listens for Telegram messages and validates that the sender is authorized.

- **1.2 Session Metadata Generation**  
  Extracts and assigns session-related metadata such as chat ID for contextual continuity.

- **1.3 Core AI Agent Processing**  
  The central orchestrator node that interprets user input, calls Upbit API data tools in parallel, formats raw data, and prepares the textual report.

- **1.4 Upbit Market Data Tools (Parallel API Calls)**  
  Multiple HTTP request nodes fetch specific market data components (tickers, order book, recent trades, candles, etc.) from Upbit’s REST API based on AI agent parameters.

- **1.5 AI Reasoning and Calculation**  
  Includes AI-powered tools for reshaping JSON data (`Think`), performing calculations (`Calculator`), and maintaining short-term session memory (`Simple Memory`).

- **1.6 Output Handling**  
  Ensures the generated message length complies with Telegram limits, splitting it if necessary, and then sends the final report back to the user via Telegram.

- **1.7 Supporting Nodes**  
  OpenAI Chat Model node used to support the AI agent's language model for command interpretation and response formatting.

---

# 2. Block-by-Block Analysis

### 2.1 Input Reception & Authentication

**Overview:**  
This block listens for incoming Telegram messages and validates if the sender is authorized based on their Telegram user ID.

**Nodes Involved:**  
- Telegram Trigger  
- User Authentication (Replace Telegram ID)

**Node Details:**

- **Telegram Trigger**  
  - Type: `telegramTrigger` (Telegram event listener)  
  - Purpose: Listens for new Telegram messages (updates of type "message")  
  - Configuration: Uses webhook ID; credentials linked to the Telegram bot  
  - Inputs: Incoming Telegram messages  
  - Outputs: Raw message JSON to next node  
  - Potential Failures: Telegram API connectivity issues, webhook misconfiguration  

- **User Authentication (Replace Telegram ID)**  
  - Type: `code` (JavaScript node)  
  - Purpose: Compares the Telegram user ID of the message sender against a hardcoded authorized ID (must be replaced with actual ID)  
  - Configuration: JavaScript code checks if `message.from.id` equals the authorized ID, returns unauthorized flag if not  
  - Inputs: Telegram message JSON from Telegram Trigger  
  - Outputs: Passes full data downstream if authorized; returns `{unauthorized: true}` otherwise  
  - Edge Cases: If unauthorized, subsequent nodes receive no valid input; replace placeholder ID before deployment  
  - Failure Modes: Expression errors if input JSON structure changes  

---

### 2.2 Session Metadata Generation

**Overview:**  
Generates session metadata such as sessionId (Telegram chat id) and extracts the message text for downstream processing.

**Nodes Involved:**  
- Adds "SessionId"

**Node Details:**

- **Adds "SessionId"**  
  - Type: `set` node  
  - Purpose: Assigns two fields to the data payload:  
    - `sessionId` set as the Telegram chat ID (for session tracking)  
    - `message` set as the raw user message text  
  - Inputs: Authenticated Telegram message JSON  
  - Outputs: Enriched JSON with session metadata for AI agent use  
  - Failure Modes: Fails if expected input JSON structure is missing or changed  

---

### 2.3 Core AI Agent Processing

**Overview:**  
This is the central orchestrator that interprets user commands, calls Upbit API tools in parallel, processes data, and generates a formatted textual report.

**Nodes Involved:**  
- Upbit AI Agent

**Node Details:**

- **Upbit AI Agent**  
  - Type: `agent` (LangChain agent node)  
  - Purpose: Acts as a specialized AI agent for Upbit spot market data querying and formatting  
  - Configuration:  
    - Uses system message instructing the agent to only fetch and present data from Upbit public endpoints (no analysis or prediction)  
    - Has HTTP GET access to Upbit API endpoints like tickers, orderbook, trades, candles with dynamic path selection based on timeframe input  
    - Calls multiple tool nodes (Upbit data tools, Calculator, Think) to fetch and process data  
    - Returns clean, human-readable text without HTML  
  - Inputs: Session metadata and user message text  
  - Outputs: Formatted Upbit market data report as text in `output` field  
  - Edge Cases:  
    - If any API call fails, outputs `N/A` for missing data fields  
    - Handles invalid or unsupported commands gracefully by returning appropriate messages  
  - Version-specific: Uses LangChain v1.8 agent features  
  - Integration: Connected to multiple HTTP request tools and AI tools downstream for data gathering  

---

### 2.4 Upbit Market Data Tools (Parallel HTTP API Calls)

**Overview:**  
A set of HTTP Request Tool nodes that fetch distinct Upbit market data components based on parameters received from the AI agent.

**Nodes Involved:**  
- 24h Stats  
- Order Book Depth  
- Price (Latest)  
- Best Bid/Ask  
- Average Price (VWAP)  
- Recent Trades  
- Upbit Klines (Dynamic)

**Node Details (summary per node):**

- **24h Stats**  
  - Endpoint: `GET /v1/ticker`  
  - Fetches 24-hour rolling stats like open/high/low/last price, volume, price changes for one or more markets  
  - Query parameter `markets` dynamically set from AI parameters  

- **Order Book Depth**  
  - Endpoint: `GET /v1/orderbook`  
  - Returns full order book depth (bids/asks with sizes) for given markets  
  - Fixed number of levels (usually top 15) due to Upbit API limitation  

- **Price (Latest)**  
  - Endpoint: `GET /v1/ticker`  
  - Returns the latest trade price and additional stats for a market  
  - Can be used interchangeably with 24h stats depending on AI agent needs  

- **Best Bid/Ask**  
  - Endpoint: `GET /v1/orderbook`  
  - Returns the best bid and ask prices (top orderbook units) for a market  

- **Average Price (VWAP)**  
  - Endpoint: `GET /v1/trades/ticks`  
  - Retrieves recent trades for calculating volume-weighted average price (VWAP) over a count of trades  

- **Recent Trades**  
  - Endpoint: `GET /v1/trades/ticks`  
  - Fetches the most recent trades with trade price, volume, side, and timestamp  

- **Upbit Klines (Dynamic)**  
  - Dynamic URL selecting candle type based on timeframe (`seconds`, `minutes/{unit}`, `days`, `weeks`, `months`, `years`)  
  - Returns OHLCV candle data for the market with limit and optional end time  
  - Timeframe parsing and routing done with a JavaScript function inside the URL parameter  

**Common Features:**  
- All requests are HTTP GET with query parameters set via AI input overrides  
- No authentication required for Upbit public endpoints  
- Return data is JSON arrays or objects passed back to the AI agent  
- Edge Cases: API rate limits, invalid market codes, unsupported timeframes, empty responses  

---

### 2.5 AI Reasoning and Calculation

**Overview:**  
Tools to assist the AI agent in reshaping data, performing calculations, and maintaining session context.

**Nodes Involved:**  
- Calculator  
- Think  
- Simple Memory

**Node Details:**

- **Calculator**  
  - Type: `toolCalculator` (LangChain calculator node)  
  - Purpose: Performs math operations such as spread, percentage change, midpoint calculations on market data fields  
  - Inputs: Data fields from Upbit API JSON via AI agent  
  - Outputs: Computed numeric results for formatting  

- **Think**  
  - Type: `toolThink` (LangChain thinking helper node)  
  - Purpose: Helps AI agent process intermediate logic such as cleaning JSON, extracting needed fields, and preparing text output  
  - Does not perform external API calls  
  - Inputs: Raw API data  
  - Outputs: Cleaned and structured data for final report  

- **Simple Memory**  
  - Type: `memoryBufferWindow` (LangChain memory buffer)  
  - Purpose: Maintains session context across interactions, stores sessionId and other state information  
  - Supports multi-turn conversations and stateful data tracking  

---

### 2.6 Output Handling

**Overview:**  
Manages Telegram message length constraints by splitting large outputs and sends the final message(s) back to the user.

**Nodes Involved:**  
- Splits message is more than 4000 characters  
- Telegram

**Node Details:**

- **Splits message is more than 4000 characters**  
  - Type: `code` (JavaScript)  
  - Purpose: Checks if the AI agent’s output exceeds Telegram’s 4000 character limit and splits it into smaller chunks  
  - Inputs: AI agent’s formatted text output  
  - Outputs: One or more message chunks, each within Telegram’s safe size limit  
  - Edge Cases: Handles edge case where input text length is exactly at or just above limit  

- **Telegram**  
  - Type: `telegram` (Telegram sendMessage node)  
  - Purpose: Sends the final message(s) to the Telegram chat ID extracted earlier  
  - Configuration: Uses same bot credentials as trigger; sends plain text without appended attribution  
  - Inputs: One or multiple message chunks from splitter node  
  - Outputs: None (end of workflow)  
  - Potential Failures: Telegram API errors, invalid chat ID, network issues  

---

### 2.7 Supporting AI Language Model Node

**Overview:**  
Provides the underlying OpenAI GPT-4o-mini model for the LangChain agent to interpret and generate responses.

**Nodes Involved:**  
- OpenAI Chat Model

**Node Details:**

- **OpenAI Chat Model**  
  - Type: `lmChatOpenAi` (LangChain OpenAI chat model node)  
  - Purpose: Supplies GPT-4o-mini model for natural language understanding and generation tasks within the agent  
  - Configuration: Model set to `gpt-4.1-mini`; uses OpenAI API credentials  
  - Inputs: Prompt from LangChain agent  
  - Outputs: Language model responses for agent processing  
  - Version: TypeVersion 1.2  
  - Potential Failures: OpenAI API rate limits, network errors, invalid API key  

---

# 3. Summary Table

| Node Name                              | Node Type                          | Functional Role                         | Input Node(s)                          | Output Node(s)                          | Sticky Note                                                                                                         |
|--------------------------------------|----------------------------------|---------------------------------------|--------------------------------------|---------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| Telegram Trigger                     | telegramTrigger                  | Listen for Telegram messages           | -                                    | User Authentication (Replace Telegram ID) | ## Trigger Incoming Telegram Command: Listens for new Telegram messages from users.                                 |
| User Authentication (Replace Telegram ID) | code                            | Validate sender Telegram ID            | Telegram Trigger                     | Adds "SessionId"                      | ## Validate User Access: Checks incoming Telegram ID against the approved user list.                                |
| Adds "SessionId"                    | set                             | Add session metadata (chat ID, message) | User Authentication                 | Upbit AI Agent                      | ## Generate Session Metadata: Creates sessionId using Telegram chat_id for downstream tools.                        |
| Upbit AI Agent                     | LangChain Agent                 | Core orchestrator, fetch & format data | Adds "SessionId"                    | Splits message is more than 4000 characters | ### 📝 Main Agent Note: Core orchestrator using OpenAI to format and present Upbit data.                            |
| 24h Stats                          | httpRequestTool                 | Fetch 24h price and volume stats      | Upbit AI Agent (ai_tool)             | Upbit AI Agent (ai_tool)             | See sticky notes #10: 24h Stats endpoint details.                                                                    |
| Order Book Depth                   | httpRequestTool                 | Fetch full order book depth            | Upbit AI Agent (ai_tool)             | Upbit AI Agent (ai_tool)             | See sticky note #7: Order Book Depth details and limitations.                                                       |
| Price (Latest)                    | httpRequestTool                 | Fetch latest trade price & stats       | Upbit AI Agent (ai_tool)             | Upbit AI Agent (ai_tool)             | See sticky note #11: Price (Latest) endpoint info.                                                                   |
| Best Bid/Ask                     | httpRequestTool                 | Fetch best bid and ask prices           | Upbit AI Agent (ai_tool)             | Upbit AI Agent (ai_tool)             | See sticky note #8: Best Bid/Ask endpoint details.                                                                   |
| Average Price (VWAP)             | httpRequestTool                 | Fetch recent trades for VWAP calculation | Upbit AI Agent (ai_tool)             | Upbit AI Agent (ai_tool)             | See sticky note #13: Average Price (VWAP) detail.                                                                    |
| Recent Trades                   | httpRequestTool                 | Fetch most recent trades                | Upbit AI Agent (ai_tool)             | Upbit AI Agent (ai_tool)             | See sticky note #14: Recent Trades endpoint details.                                                                 |
| Upbit Klines (Dynamic)           | httpRequestTool                 | Fetch OHLCV candles for dynamic timeframes | Upbit AI Agent (ai_tool)             | Upbit AI Agent (ai_tool)             | See sticky note #12: Dynamic Klines for all timeframes.                                                              |
| Calculator                      | toolCalculator                 | Perform math operations on data        | Upbit AI Agent (ai_tool)             | Upbit AI Agent (ai_tool)             | ### Calculator: Performs math operations like spreads, % changes etc.                                               |
| Think                          | toolThink                      | Process/reshape JSON, prepare output   | Upbit AI Agent (ai_tool)             | Upbit AI Agent (ai_tool)             | ### Think: Lightweight reasoning helper for data formatting.                                                        |
| Simple Memory                  | memoryBufferWindow             | Maintain short-term session memory     | Upbit AI Agent (ai_memory)           | Upbit AI Agent (ai_memory)           | ## Short-Term Memory Module: Stores sessionId, symbol, and state for multi-turn interaction.                        |
| Splits message is more than 4000 characters | code                           | Split large messages to comply with Telegram limits | Upbit AI Agent                    | Telegram                             | ## Handle Telegram Message Limits: Splits messages over 4000 chars.                                                 |
| Telegram                       | telegram                       | Send final message(s) back to user     | Splits message is more than 4000 characters | -                                   | ## Send Final Report to Telegram: Sends formatted report or split chunks via Telegram bot.                           |
| OpenAI Chat Model               | lmChatOpenAi                   | Provide GPT-4o-mini model for AI agent | -                                  | Upbit AI Agent (ai_languageModel)    | ## GPT Model for Reasoning: Used to interpret signals, generate HTML, and recommend trades.                         |

---

# 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: `telegramTrigger`  
   - Configure webhook ID for your Telegram bot  
   - Scope: Listen to message updates only  
   - Credentials: Add your Telegram bot credentials  

2. **Add Code Node for User Authentication**  
   - Type: `code` (JavaScript)  
   - Paste code to verify Telegram ID:  
     ```js
     if ($input.first().json.message.from.id !== <<Replace>>) {
       return {unauthorized: true};
     } else {
       return $input.all();
     }
     ```  
   - Replace `<<Replace>>` with your Telegram user ID  

3. **Add Set Node to Generate Session Metadata**  
   - Type: `set`  
   - Assign:  
     - `sessionId` = `{{$json.message.chat.id}}`  
     - `message` = `{{$json.message.text}}`  

4. **Add OpenAI Chat Model Node**  
   - Type: `lmChatOpenAi` (LangChain)  
   - Set model to `gpt-4.1-mini`  
   - Provide OpenAI API credentials  

5. **Add LangChain Agent Node (Upbit AI Agent)**  
   - Type: `agent` (LangChain)  
   - Connect input from Set Node  
   - Configure system message to define agent role as Upbit Spot Market Data Agent with instructions to fetch data only from Upbit REST public endpoints (see system message in original workflow for full text)  
   - Link OpenAI Chat Model as language model node  
   - Configure agent to invoke multiple HTTP Request Tool nodes as tools (see below)  
   - Enable session memory using Simple Memory node  

6. **Add HTTP Request Tool Nodes for Upbit API**  
   For each required data endpoint:  
   - Set HTTP method: GET  
   - Base URL: `https://api.upbit.com/v1/` plus endpoint path  
   - Query parameters dynamically set from AI agent input variables (`$fromAI`) for markets, count, timeframe, etc.  
   - Nodes to create:  
     - 24h Stats (`/ticker`)  
     - Order Book Depth (`/orderbook`)  
     - Price (Latest) (`/ticker`)  
     - Best Bid/Ask (`/orderbook`)  
     - Average Price (VWAP) (`/trades/ticks`)  
     - Recent Trades (`/trades/ticks`)  
     - Upbit Klines (Dynamic) (`/candles/...` with dynamic path selection) using embedded JS function in URL parameter  

7. **Add Calculator Node**  
   - Type: `toolCalculator`  
   - Purpose: Perform math on API results (spread, percent changes) as needed by the AI agent  

8. **Add Think Node**  
   - Type: `toolThink`  
   - Purpose: Reshape and clean JSON data from API calls for final formatting  

9. **Add Simple Memory Node**  
   - Type: `memoryBufferWindow`  
   - Purpose: Maintain session context using `sessionId` and other state data for multi-turn dialogues  

10. **Connect all HTTP Request Tools, Calculator, Think, and Simple Memory as AI tools to the agent node**  
    - This allows the agent to call these nodes as tools during execution  

11. **Add Code Node to Split Long Messages**  
    - Type: `code`  
    - Paste splitting code to slice output messages exceeding 4000 characters into manageable chunks for Telegram  

12. **Add Telegram Send Message Node**  
    - Type: `telegram`  
    - Configure bot credentials  
    - Set chat ID to `{{$json.message.chat.id}}` from Telegram Trigger node  
    - Connect input from splitting code node  
    - Set message text parameter to the chunked messages  

13. **Connect workflow nodes in sequence:**  
    Telegram Trigger → User Authentication → Adds "SessionId" → Upbit AI Agent → Splits message code → Telegram sendMessage  

14. **Deploy webhook, test with authorized Telegram user**  
    - Send commands such as `upbit KRW-BTC 15m` and check replies  
    - Validate error handling and message splitting behavior  

---

# 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                            | Context or Link                                                                                      |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Full system documentation is included as a large sticky note node (#28fa8e05-0d29-4776-adea-459515f1ea00) with detailed descriptions of all endpoints, installation instructions, system behavior, and example user prompts.                                                                                                                                                                   | See sticky note "🧠 Upbit Spot Market Data AI Agent – Full System Documentation"                    |
| The system uses the LangChain framework nodes integrated into n8n for AI agent orchestration, reasoning, memory, and tool calls.                                                                                                                                                                                                                                                       | n8n LangChain integration documentation                                                             |
| The Telegram bot requires OAuth2 credentials configured properly in n8n, including webhook setup and Telegram API keys.                                                                                                                                                                                                                                                                 | Telegram Bot API and n8n credential setup guides                                                    |
| Upbit public market endpoints do not require authentication but have rate limits and fixed response sizes (e.g., order book depth fixed at ~15 levels).                                                                                                                                                                                                                                   | Upbit API official documentation: https://docs.upbit.com/reference |
| The AI agent strictly separates data fetching from analysis or trading advice to comply with ethical and legal constraints.                                                                                                                                                                                                                                                             | System message in Upbit AI Agent node                                                              |
| The workflow is designed for a single authorized Telegram user; multi-user support requires expanding authentication logic and session management.                                                                                                                                                                                                                                      | Modify User Authentication node to support multiple IDs or external user database                   |
| The dynamic candle endpoint URL is generated by a custom JavaScript function embedded in the HTTP Request Tool node, handling Upbit’s unique API path structure based on timeframes.                                                                                                                                                                                                     | Refer to Upbit Klines (Dynamic) node code logic                                                    |

---

**Disclaimer:** The provided text is solely generated from an automated workflow created with n8n, a workflow automation tool. It complies with all current content policies and contains no illegal or protected elements. All processed data is legal and publicly accessible.

---