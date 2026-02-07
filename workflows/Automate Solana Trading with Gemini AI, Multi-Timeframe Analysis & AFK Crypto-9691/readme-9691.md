Automate Solana Trading with Gemini AI, Multi-Timeframe Analysis & AFK Crypto

https://n8nworkflows.xyz/workflows/automate-solana-trading-with-gemini-ai--multi-timeframe-analysis---afk-crypto-9691


# Automate Solana Trading with Gemini AI, Multi-Timeframe Analysis & AFK Crypto

---

### 1. Workflow Overview

This workflow automates Solana (SOL/USDT) trading by integrating multi-timeframe market data analysis, AI-driven trading recommendations, manual Telegram approval, and automated trade execution via the AFK Crypto API. It is designed for traders who want to leverage AI insights combined with manual control over trade execution and real-time monitoring of open positions.

**Key Use Cases:**  
- Automated technical analysis of SOL/USDT using 1-minute, 5-minute, and 1-hour candlestick data.  
- Generation of actionable trade signals (LONG, SHORT, HOLD) with detailed trading parameters (entry, stop-loss, take-profit, position sizing).  
- Manual trade approval through Telegram interactive messaging.  
- Automated execution of approved trades on Solana blockchain via AFK Crypto API.  
- Continuous monitoring of open positions for take-profit or stop-loss triggers and automatic position closure.  
- Real-time Telegram notifications about trade status and results.

**Logical Blocks:**

- **1.1 Schedule Trigger & Data Fetching:** Hourly trigger starts the workflow; fetches multi-timeframe SOL/USDT market data from Crypto Compare.  
- **1.2 Data Aggregation & Preparation:** Merges multiple timeframe data and formats it for AI input.  
- **1.3 Wallet Balance Retrieval:** Queries AFK Crypto wallet balances to inform position sizing.  
- **1.4 AI Market Analysis & Trading Recommendation:** Uses Google Gemini or LangChain AI to analyze data and generate structured trade proposals.  
- **1.5 Telegram Messaging & Approval:** Sends detailed trade analysis and recommendation to Telegram; waits for user approval or rejection.  
- **1.6 Trade Execution:** Upon approval, executes buy/sell orders through AFK Crypto API with appropriate parameters and handles confirmations.  
- **1.7 Post-Trade Monitoring:** Monitors live SOL price for take-profit or stop-loss conditions; executes closing trades accordingly and notifies via Telegram.

---

### 2. Block-by-Block Analysis

#### 2.1 Schedule Trigger & Data Fetching

**Overview:**  
This block initiates the workflow on an hourly interval and fetches historical OHLCV data for SOL/USDT across three timeframes (1m, 5m, 1h) from the Crypto Compare API.

**Nodes Involved:**  
- Hourly (Schedule Trigger)  
- Fetch_1m (HTTP Request)  
- Fetch_5m (HTTP Request)  
- Fetch_1h (HTTP Request)  
- Merge

**Node Details:**

- **Hourly**  
  - Type: Schedule Trigger  
  - Role: Triggers the workflow every hour.  
  - Config: Interval set to 1 hour.  
  - Inputs: None  
  - Outputs: Connects to Fetch_1m, Fetch_5m, Fetch_1h in parallel.  
  - Failures: Scheduling misconfiguration or downtime could delay execution.  

- **Fetch_1m**  
  - Type: HTTP Request  
  - Role: Fetches last 60 minutes of 1-minute candlestick data for SOL/USDT.  
  - Config: URL set to Crypto Compare endpoint with limit=60 for 1m candles.  
  - Inputs: Trigger from Hourly node.  
  - Outputs: Connects to Merge node (input 0).  
  - Failures: API downtime, rate limits, invalid responses.  

- **Fetch_5m**  
  - Type: HTTP Request  
  - Role: Fetches last 60 periods of 5-minute aggregated candlestick data.  
  - Config: Crypto Compare endpoint with aggregate=5 and limit=60.  
  - Inputs: Trigger from Hourly node.  
  - Outputs: Connects to Merge node (input 1).  
  - Failures: Similar to Fetch_1m.  

- **Fetch_1h**  
  - Type: HTTP Request  
  - Role: Fetches last 60 hourly candlesticks.  
  - Config: Crypto Compare endpoint for 1-hour data.  
  - Inputs: Trigger from Hourly node.  
  - Outputs: Connects to Merge node (input 2).  
  - Failures: Same as above.  

- **Merge**  
  - Type: Merge  
  - Role: Waits for all three HTTP requests to complete and combines their output.  
  - Config: Number of inputs set to 3.  
  - Inputs: From Fetch_1m, Fetch_5m, Fetch_1h nodes.  
  - Outputs: Connects to Transcribe node.  
  - Failures: Timeout if any input is missing or delayed.

---

#### 2.2 Data Aggregation & Preparation

**Overview:**  
Translates the merged multi-timeframe data into a structured JSON payload with symbol, latest price, and complete datasets for 1m, 5m, and 1h intervals to feed into the AI model.

**Nodes Involved:**  
- Transcribe (Code)

**Node Details:**

- **Transcribe**  
  - Type: Code (JavaScript)  
  - Role: Extracts latest close price and organizes multi-timeframe data into one JSON object.  
  - Config: Uses expressions to access each timeframe's data from Merge outputs.  
  - Inputs: From Merge node.  
  - Outputs: JSON object with keys: symbol (SOLUSDT), price (latest close from 1m), data_1m, data_5m, data_1h arrays.  
  - Failures: Fail if any input data missing or malformed. Expression errors possible.  

---

#### 2.3 Wallet Balance Retrieval

**Overview:**  
Queries the AFK Crypto API to get the current Solana wallet balance for position sizing and risk management.

**Nodes Involved:**  
- Get Wallet Balance (HTTP Request)

**Node Details:**

- **Get Wallet Balance**  
  - Type: HTTP Request  
  - Role: Fetches wallet balances from AFK Crypto API for Solana chain.  
  - Config: GET request to /v1/wallets/balances?chain=solana with HTTP header authentication using AFK Crypto API key.  
  - Inputs: From Transcribe node (to ensure latest market data processed).  
  - Outputs: Connects to AI Agent node.  
  - Failures: Authentication errors, API downtime, malformed response.  

---

#### 2.4 AI Market Analysis & Trading Recommendation

**Overview:**  
Feeds multi-timeframe price data and wallet balance into an AI model (Google Gemini Chat Model via LangChain agent) that performs a comprehensive technical analysis and outputs a structured JSON with detailed trade recommendations.

**Nodes Involved:**  
- AI Agent (LangChain Agent)  
- Google Gemini Chat Model (Language Model)  
- Parse AI Output (Code)

**Node Details:**

- **Google Gemini Chat Model**  
  - Type: AI Language Model (Google Gemini)  
  - Role: Provides AI inference engine for market analysis.  
  - Config: Credentials for Google Gemini API; connected as the AI backend for AI Agent.  
  - Inputs: From AI Agent (calls it internally).  
  - Outputs: AI text response.  
  - Failures: API rate limits, auth failures, latency.

- **AI Agent**  
  - Type: LangChain AI Agent  
  - Role: Constructs prompt with market data and balance; sends to Google Gemini; enforces structured JSON output in triple-backticks.  
  - Config: Prompt includes instructions for multi-timeframe analysis, position sizing (with 1% max risk), and formatting rules; system message sets professional tone.  
  - Inputs: From Get Wallet Balance and Transcribe nodes (for market data and balance).  
  - Outputs: AI raw text passed to Parse AI Output.  
  - Failures: AI output missing, invalid JSON formatting, connection issues.

- **Parse AI Output**  
  - Type: Code (JavaScript)  
  - Role: Extracts JSON payload embedded inside triple-backticks from AI text output, parses it, and returns clean JSON for downstream nodes.  
  - Config: Regex to find ```json ... ``` block, error handling for missing or invalid JSON.  
  - Inputs: From AI Agent node.  
  - Outputs: Structured JSON with analysis and trade recommendation.  
  - Failures: Parsing errors if AI response malformed or missing JSON block.

---

#### 2.5 Telegram Messaging & Approval

**Overview:**  
Sends detailed multi-timeframe analysis and trade recommendation messages to Telegram, then requests manual approval (or rejection) from the user before proceeding with trade execution.

**Nodes Involved:**  
- Send a text message (Telegram)  
- Send a text message8 (Telegram)  
- Send a text message9 (Telegram)  
- Send message and wait for response (Telegram)  
- Approved/Disapproved (If)  
- Send a text message3 (Telegram) (for cancellation)

**Node Details:**

- **Send a text message**  
  - Type: Telegram node  
  - Role: Sends formatted 1-minute analysis summary to Telegram chat.  
  - Config: Uses Markdown for formatting; references parsed AI output variables; Chat ID and Telegram API credentials required.  
  - Inputs: From Parse AI Output.  
  - Outputs: Connects to Send a text message8.  
  - Failures: Telegram API errors, invalid chat ID, formatting errors.

- **Send a text message8**  
  - Type: Telegram node  
  - Role: Sends 5-minute analysis summary.  
  - Inputs: From Send a text message.  
  - Outputs: Connects to Send a text message9.  

- **Send a text message9**  
  - Type: Telegram node  
  - Role: Sends 1-hour analysis summary.  
  - Inputs: From Send a text message8.  
  - Outputs: Connects to Send message and wait for response.

- **Send message and wait for response**  
  - Type: Telegram node (sendAndWait)  
  - Role: Sends the full market structure and trading recommendation with interactive approval buttons (✅ Approve, ❌ Decline).  
  - Config: Approval type set to double; message includes disclaimers and detailed trade parameters.  
  - Inputs: From Send a text message9.  
  - Outputs: Connects to Approved/Disapproved node.  
  - Failures: User timeout, Telegram connectivity, improper chat ID.

- **Approved/Disapproved (If)**  
  - Type: If node  
  - Role: Checks if Telegram response is approval (`data.approved` = true).  
  - Inputs: From Send message and wait for response.  
  - Outputs: On approve, routes to trade execution; on decline, sends cancellation message.  
  - Failures: Missing or malformed response.

- **Send a text message3**  
  - Type: Telegram node  
  - Role: Sends cancellation message if user declines trade.  
  - Inputs: From Approved/Disapproved (decline path).  
  - Outputs: Ends workflow.  

---

#### 2.6 Trade Execution

**Overview:**  
Upon approval, executes trades via AFK Crypto API by submitting swap requests for SOL/USDT or SOL/USDC pairs. Sends confirmation messages and handles trade status.

**Nodes Involved:**  
- If (decision node for LONG/Buy)  
- If1 (decision node for SHORT/Sell)  
- BUY SOL/USDT (HTTP POST)  
- SELL SOL/USDT (HTTP POST)  
- Buy Confirmation (Telegram)  
- Sell Confirmation (Telegram)  
- Wait 15s & Wait 15s_1 (Wait nodes)  
- Check SOL Price & Check SOL Price1 (HTTP Request for price)  
- Convert Price to Int2 & Convert Price to Int3 (Code)  
- If2, If3, If4, If5 (If nodes evaluating TP/SL conditions)  
- SELL SOL/USDC1, SELL SOL/USDC2, BUY SOL/USDC1, BUY SOL/USDC2 (HTTP POST swap requests)  
- HTTP Request, HTTP Request1, HTTP Request2, HTTP Request3 (Balance fetch nodes after trades)  
- Send a text message4, Send a text message5, Send a text message6, Send a text message7 (Telegram confirmations for TP/SL)

**Node Details:**

- **If**  
  - Type: If node  
  - Role: Checks if AI trading recommendation is LONG or equivalent buy signals.  
  - Inputs: From Approved/Disapproved (approve path).  
  - Outputs: On true, triggers BUY SOL/USDT; on false, goes to If1 (SHORT check).  

- **If1**  
  - Type: If node  
  - Role: Checks if recommendation is SHORT or sell signals.  
  - Inputs: From If node (false path).  
  - Outputs: On true, triggers SELL SOL/USDT; on false, sends no transaction message.  

- **BUY SOL/USDT / SELL SOL/USDT**  
  - Type: HTTP Request POST  
  - Role: Executes swap trades via AFK Crypto API for SOL/USDT pair.  
  - Config: POST to /v1/trade/swap with parameters chain=solana, fromToken, toToken, amount (position size), slippage=1; Idempotency-Key set uniquely per execution.  
  - Inputs: From If or If1 nodes.  
  - Outputs: Connect to Buy/Sell Confirmation nodes.  
  - Failures: API errors, incorrect parameters, insufficient balance.

- **Buy Confirmation / Sell Confirmation**  
  - Type: Telegram node  
  - Role: Sends confirmation messages after trade execution with trade details and hash.  
  - Inputs: From trade execution nodes.  
  - Outputs: Connect to Wait nodes.  

- **Wait 15s / Wait 15s_1**  
  - Type: Wait nodes  
  - Role: Pauses workflow 15 seconds to allow trade settlement before checking prices.  
  - Inputs: From Buy/Sell Confirmation nodes.  
  - Outputs: Connect to Check SOL Price / Check SOL Price1 nodes.  

- **Check SOL Price / Check SOL Price1**  
  - Type: HTTP Request  
  - Role: Fetches current SOL/USDT price from OKX API.  
  - Inputs: From Wait nodes.  
  - Outputs: Connect to Convert Price to Int nodes.  
  - Failures: API downtime, invalid responses.  

- **Convert Price to Int2 / Convert Price to Int3**  
  - Type: Code  
  - Role: Parses string price from OKX API response to numeric float for logic evaluation.  
  - Inputs: From Check SOL Price nodes.  
  - Outputs: Connect to If2 / If3 for TP/SL checks.  

- **If2 / If3**  
  - Type: If nodes  
  - Role: Evaluate if current price >= take profit TP1 or <= stop loss for closing trades.  
  - Inputs: From Convert Price nodes.  
  - Outputs: Trigger SELL/BUY SOL/USDC trades or next condition checks.  

- **If4 / If5**  
  - Type: If nodes  
  - Role: Additional price condition checks for SL/TP with alternative trade pairs (SOL/USDC).  
  - Inputs: From If2 / If3 false paths.  
  - Outputs: Trigger corresponding SELL/BUY SOL/USDC trades or wait nodes.  

- **SELL SOL/USDC1, SELL SOL/USDC2, BUY SOL/USDC1, BUY SOL/USDC2**  
  - Type: HTTP Request POST  
  - Role: Swap trades on SOL/USDC pairs for position closing or take profit execution.  
  - Config: Similar to SOL/USDT trades, with different token addresses and idempotency keys.  
  - Inputs: From If2, If3, If4, If5 nodes.  
  - Outputs: Connect to HTTP Request nodes for balance updates.  
  - Failures: API errors, insufficient balance.

- **HTTP Request, HTTP Request1, HTTP Request2, HTTP Request3**  
  - Type: HTTP Request (GET)  
  - Role: Fetch updated wallet balances after trade execution for reporting.  
  - Inputs: From trade execution nodes.  
  - Outputs: Connect to Telegram message nodes for trade result notifications.  

- **Send a text message4, Send a text message5, Send a text message6, Send a text message7**  
  - Type: Telegram node  
  - Role: Sends post-trade notifications for take-profit hits, stop-loss hits, and trade completions with balances and hashes.  
  - Inputs: From HTTP Request balance nodes.  
  - Outputs: Ends workflow or loops if monitoring continues.  

- **Send a text message2**  
  - Type: Telegram node  
  - Role: Sends notification if no trade was executed (e.g., no valid action).  
  - Inputs: From If1 false path.  

---

### 3. Summary Table

| Node Name                  | Node Type                    | Functional Role                           | Input Node(s)                          | Output Node(s)                                | Sticky Note                                                                                                                                                |
|----------------------------|------------------------------|-----------------------------------------|--------------------------------------|-----------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Hourly                     | Schedule Trigger             | Starts workflow hourly                   | None                                 | Fetch_1m, Fetch_5m, Fetch_1h                  | Executes the workflow automatically every hour. Initiates full SOL/USDT analysis cycle.                                                                  |
| Fetch_1m                   | HTTP Request                | Fetch 1-minute OHLCV data                | Hourly                              | Merge (input 0)                              | Market Data Aggregator (Crypto Compare) fetches multi-timeframe OHLCV data for SOL/USDT.                                                                  |
| Fetch_5m                   | HTTP Request                | Fetch 5-minute OHLCV data                | Hourly                              | Merge (input 1)                              | Same as above                                                                                                                                              |
| Fetch_1h                   | HTTP Request                | Fetch 1-hour OHLCV data                  | Hourly                              | Merge (input 2)                              | Same as above                                                                                                                                              |
| Merge                      | Merge                      | Combine multi-timeframe data             | Fetch_1m, Fetch_5m, Fetch_1h         | Transcribe                                   | Same as above                                                                                                                                              |
| Transcribe                 | Code                       | Aggregate and format data for AI input  | Merge                               | Get Wallet Balance                           |                                                                                                                                                            |
| Get Wallet Balance         | HTTP Request                | Get wallet balance from AFK Crypto API   | Transcribe                         | AI Agent                                     | Wallet Balance Verifier queries AFK Crypto wallet balance and calculates position size.                                                                   |
| AI Agent                   | LangChain AI Agent          | Perform multi-timeframe AI market analysis | Get Wallet Balance                 | Parse AI Output                              | Multi-Timeframe Market Analyzer processes data via AI, generating sentiment, trade recommendation, and risk parameters.                                  |
| Google Gemini Chat Model   | AI Language Model           | AI model backend                         | AI Agent                          | AI Agent                                     |                                                                                                                                                            |
| Parse AI Output            | Code                       | Extract and parse JSON from AI output    | AI Agent                          | Send a text message                          |                                                                                                                                                            |
| Send a text message        | Telegram                   | Send 1-minute analysis summary to Telegram | Parse AI Output                   | Send a text message8                         | Trade Message Composer prepares Telegram-ready message with AI insights and trade details.                                                                |
| Send a text message8       | Telegram                   | Send 5-minute analysis summary           | Send a text message               | Send a text message9                         | Same as above                                                                                                                                              |
| Send a text message9       | Telegram                   | Send 1-hour analysis summary             | Send a text message8              | Send message and wait for response           | Same as above                                                                                                                                              |
| Send message and wait for response | Telegram           | Send trade recommendation and wait for approval | Send a text message9           | Approved/Disapproved                         | Telegram Approval Request sends interactive message with Approve/Decline buttons.                                                                          |
| Approved/Disapproved       | If                         | Check Telegram trade approval response   | Send message and wait for response | If (approve), Send a text message3 (decline) | Approval Condition Filter evaluates Telegram response to proceed or cancel.                                                                               |
| Send a text message3       | Telegram                   | Send cancellation message                | Approved/Disapproved (decline)    | None                                         |                                                                                                                                                            |
| If                        | If                         | Check if trade action is LONG/Buy        | Approved/Disapproved (approve)    | BUY SOL/USDT, If1                            |                                                                                                                                                            |
| If1                       | If                         | Check if trade action is SHORT/Sell      | If                              | SELL SOL/USDT, Send a text message2          |                                                                                                                                                            |
| Send a text message2       | Telegram                   | Notify no trade executed                  | If1 (false)                     | None                                         |                                                                                                                                                            |
| BUY SOL/USDT              | HTTP Request (POST)        | Execute buy trade via AFK Crypto API     | If                              | Buy Confirmation                             | AFK Crypto Trade Executor handles on-chain trade execution using AI parameters.                                                                           |
| SELL SOL/USDT             | HTTP Request (POST)        | Execute sell trade via AFK Crypto API    | If1                             | Sell Confirmation                            | Same as above                                                                                                                                              |
| Buy Confirmation          | Telegram                   | Confirm buy trade execution               | BUY SOL/USDT                    | Wait 15s                                     |                                                                                                                                                            |
| Sell Confirmation         | Telegram                   | Confirm sell trade execution              | SELL SOL/USDT                   | Wait 15s_1                                   |                                                                                                                                                            |
| Wait 15s                  | Wait                       | Pause to allow trade settlement           | Buy Confirmation               | Check SOL Price                              |                                                                                                                                                            |
| Wait 15s_1                | Wait                       | Pause for settlement                       | Sell Confirmation              | Check SOL Price1                             |                                                                                                                                                            |
| Check SOL Price           | HTTP Request               | Get current SOL/USDT price                | Wait 15s                      | Convert Price to Int2                         | Active Position Watcher monitors live price for TP/SL triggers.                                                                                          |
| Check SOL Price1          | HTTP Request               | Get current SOL/USDT price                | Wait 15s_1                    | Convert Price to Int3                         | Same as above                                                                                                                                              |
| Convert Price to Int2     | Code                       | Parse price string to number              | Check SOL Price               | If2                                          |                                                                                                                                                            |
| Convert Price to Int3     | Code                       | Parse price string to number              | Check SOL Price1              | If3                                          |                                                                                                                                                            |
| If2                       | If                         | Check if price >= take profit TP1         | Convert Price to Int2          | SELL SOL/USDC1, If4                          |                                                                                                                                                            |
| If3                       | If                         | Check if price <= stop loss                | Convert Price to Int3          | BUY SOL/USDC1, If5                           |                                                                                                                                                            |
| If4                       | If                         | Check if price <= stop loss (alternative) | If2                          | SELL SOL/USDC2, Wait 15s                     |                                                                                                                                                            |
| If5                       | If                         | Check if price >= take profit (alternative) | If3                          | BUY SOL/USDC2, Wait 15s_1                     |                                                                                                                                                            |
| SELL SOL/USDC1           | HTTP Request (POST)        | Execute sell trade on SOL/USDC pair       | If2                          | HTTP Request2                                |                                                                                                                                                            |
| SELL SOL/USDC2           | HTTP Request (POST)        | Execute sell trade on SOL/USDC pair       | If4                          | HTTP Request1                                |                                                                                                                                                            |
| BUY SOL/USDC1            | HTTP Request (POST)        | Execute buy trade on SOL/USDC pair        | If3                          | HTTP Request3                                |                                                                                                                                                            |
| BUY SOL/USDC2            | HTTP Request (POST)        | Execute buy trade on SOL/USDC pair        | If5                          | HTTP Request                                 |                                                                                                                                                            |
| HTTP Request              | HTTP Request (GET)         | Fetch wallet balance after trade           | SELL SOL/USDC1               | Send a text message6                          | Post-Trade Summary Message sent to Telegram.                                                                                                             |
| HTTP Request1             | HTTP Request (GET)         | Fetch wallet balance after trade           | SELL SOL/USDC2               | Send a text message5                          | Same as above                                                                                                                                              |
| HTTP Request2             | HTTP Request (GET)         | Fetch wallet balance after trade           | BUY SOL/USDC1                | Send a text message4                          | Same as above                                                                                                                                              |
| HTTP Request3             | HTTP Request (GET)         | Fetch wallet balance after trade           | BUY SOL/USDC2                | Send a text message7                          | Same as above                                                                                                                                              |
| Send a text message4      | Telegram                   | Notify take profit hit                      | HTTP Request2                | None                                         |                                                                                                                                                            |
| Send a text message5      | Telegram                   | Notify stop loss hit                        | HTTP Request1                | None                                         |                                                                                                                                                            |
| Send a text message6      | Telegram                   | Notify take profit hit                      | HTTP Request                 | None                                         |                                                                                                                                                            |
| Send a text message7      | Telegram                   | Notify stop loss hit                        | HTTP Request3                | None                                         |                                                                                                                                                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger**  
   - Type: Schedule Trigger  
   - Set to execute every 1 hour.  
   - Connect outputs to three HTTP Request nodes: Fetch_1m, Fetch_5m, Fetch_1h.

2. **Create Fetch_1m HTTP Request**  
   - URL: `https://min-api.cryptocompare.com/data/v2/histominute?fsym=SOL&tsym=USDT&limit=60`  
   - Method: GET  
   - No authentication needed.  
   - Connect output to Merge node input 0.

3. **Create Fetch_5m HTTP Request**  
   - URL: `https://min-api.cryptocompare.com/data/v2/histominute?fsym=SOL&tsym=USDT&limit=60&aggregate=5`  
   - Method: GET  
   - Connect output to Merge node input 1.

4. **Create Fetch_1h HTTP Request**  
   - URL: `https://min-api.cryptocompare.com/data/v2/histohour?fsym=SOL&tsym=USDT&limit=60`  
   - Method: GET  
   - Connect output to Merge node input 2.

5. **Create Merge Node**  
   - Type: Merge  
   - Set Number of Inputs to 3 (for 1m, 5m, 1h).  
   - Connect outputs to Transcribe node.

6. **Create Transcribe Node (Code)**  
   - Type: Code (JavaScript)  
   - Code: Return JSON with symbol "SOLUSDT", latest price from Fetch_1m close, and full data arrays from each timeframe.  
   - Input connections: From Merge node.  
   - Output: Connect to Get Wallet Balance node.

7. **Create Get Wallet Balance HTTP Request**  
   - URL: `https://api.afkcrypto.com/v1/wallets/balances?chain=solana`  
   - Method: GET  
   - Authentication: HTTP Header Auth with AFK Crypto API Key credential.  
   - Connect output to AI Agent node.

8. **Create AI Agent Node (LangChain Agent)**  
   - Input parameters: Use prompt text with embedded market data and wallet balance from previous nodes.  
   - Attach Google Gemini Chat Model as AI backend (requires Google Gemini API credentials).  
   - Configure system message and prompt per prompt text in workflow.  
   - Output: Connect to Parse AI Output node.

9. **Create Parse AI Output Node (Code)**  
   - Type: Code (JavaScript)  
   - Code: Extract JSON block from AI raw output (between ```json ... ```), parse it, and pass downstream.  
   - Input: From AI Agent.  
   - Output: Connect to Send a text message node.

10. **Create Telegram Messaging Nodes**  
    - Send a text message: Format and send 1-minute analysis to Telegram chat.  
    - Send a text message8: Send 5-minute analysis.  
    - Send a text message9: Send 1-hour analysis.  
    - Send message and wait for response: Interactive message with buttons for approval.  
    - Credentials: Telegram API with Bot Token and Chat ID.  
    - Connect them sequentially ending in Approved/Disapproved If node.

11. **Create Approved/Disapproved If Node**  
    - Check if Telegram response `data.approved` is true.  
    - On true: Connect to If node for LONG/Buy check.  
    - On false: Connect to Send a text message3 node for cancellation message.

12. **Create If Node (LONG/Buy check)**  
    - Condition: Check if combined AI action string matches LONG/buy actions.  
    - True: Connect to BUY SOL/USDT HTTP Request.  
    - False: Connect to If1 node.

13. **Create If1 Node (SHORT/Sell check)**  
    - Condition: Check if combined AI action string matches SHORT/sell actions.  
    - True: Connect to SELL SOL/USDT HTTP Request.  
    - False: Connect to Send a text message2 node (no trade notification).

14. **Create BUY SOL/USDT HTTP Request**  
    - URL: `https://api.afkcrypto.com/v1/trade/swap`  
    - Method: POST  
    - Body: chain=solana, fromToken=USDT token address, toToken=SOL token address, amount=position size from AI output, slippage=1%.  
    - Authentication: HTTP Header Auth with AFK Crypto API Key.  
    - Idempotency-Key: Use execution ID.  
    - Output: Buy Confirmation Telegram node.

15. **Create SELL SOL/USDT HTTP Request**  
    - Similar to BUY SOL/USDT but reversed tokens.  
    - Output: Sell Confirmation Telegram node.

16. **Create Buy Confirmation and Sell Confirmation Telegram nodes**  
    - Send confirmation messages with trade details and hash.  
    - Connect to Wait 15s and Wait 15s_1 respectively.

17. **Create Wait 15s and Wait 15s_1 Nodes**  
    - Pause 15 seconds to allow trade settlement.  
    - Connect to Check SOL Price and Check SOL Price1 nodes.

18. **Create Check SOL Price and Check SOL Price1 HTTP Requests**  
    - URL: `https://www.okx.com/api/v5/market/ticker?instId=SOL-USDT`  
    - Method: GET  
    - Outputs: Connect to Convert Price to Int nodes.

19. **Create Convert Price to Int2 and Convert Price to Int3 Code Nodes**  
    - Parse string price from OKX to float number.  
    - Output: Connect to If2 and If3 nodes.

20. **Create If2 and If3 Nodes**  
    - If2: Check if price >= take profit TP1 (from AI output).  
    - If true: Connect to SELL SOL/USDC1 node.  
    - Else: Connect to If4 node.  
    - If3: Check if price <= stop loss.  
    - If true: Connect to BUY SOL/USDC1 node.  
    - Else: Connect to If5 node.

21. **Create If4 and If5 Nodes**  
    - Additional price condition checks with alternative trading pairs.  
    - Connect to SELL SOL/USDC2 and BUY SOL/USDC2 nodes or wait nodes accordingly.

22. **Create SELL SOL/USDC1, SELL SOL/USDC2, BUY SOL/USDC1, BUY SOL/USDC2 HTTP Requests**  
    - POST requests with appropriate token addresses for SOL/USDC pair swaps.  
    - Authentication: AFK Crypto API key.  
    - Idempotency-Key: Unique using execution ID plus suffix.  
    - Outputs: Connect to HTTP Request balance check nodes.

23. **Create HTTP Request nodes for balance queries after trades**  
    - GET request to AFK Crypto wallets balances endpoint.  
    - Outputs: Connect to post-trade Telegram notification nodes.

24. **Create post-trade Telegram notification nodes**  
    - Send a text message4, 5, 6, 7 for TP hit, SL hit, trade confirmation notifications.  
    - Use AI output and balance data for message content.

25. **Create Send a text message2 node**  
    - Notify if no trade executed.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                          | Context or Link                                      |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| This workflow integrates AI-powered multi-timeframe technical market analysis with manual Telegram approval and automated trade execution on Solana via AFK Crypto API. It balances automation and trader control.                                   | Workflow description                                |
| AFK Crypto API endpoints used: GET `/v1/wallets/balances?chain=solana`, POST `/v1/trade/swap`                                                                                                                                                          | AFK Crypto API docs                                 |
| Telegram Bot Token and Chat ID are required for messaging and approval interaction.                                                                                                                                                                   | Telegram Bot API                                     |
| AI model used is Google Gemini via LangChain integration with strict prompt instructions to produce structured JSON output.                                                                                                                           | Google Gemini API, LangChain docs                    |
| The workflow includes detailed error handling for AI output parsing and Telegram response validation to prevent execution on malformed data.                                                                                                          | Code nodes with error throws                         |
| Position sizing calculated based on 1% risk of wallet balance in lamports, with safeguards to cap position size.                                                                                                                                        | AI Agent prompt instructions                         |
| Extendable for additional trading pairs, auto-trade based on confidence scores, integration with PnL tracking systems like Notion/Airtable, or dynamic risk management.                                                                                  | Sticky Note10 content                                |
| Discord community for AFK Crypto and workflow support: https://discord.com/invite/v4DgTEUUJJ                                                                                                                                                           | Community link                                      |
| AFK Crypto website for API key registration and wallet setup: afkcrypto.com                                                                                                                                                                            | https://afkcrypto.com                                |

---

**Disclaimer:**  
The text provided is exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with applicable content policies and contains no illegal, offensive, or protected material. All data handled is legal and publicly available.

---