AI-Powered Stock Market Summary Bot

https://n8nworkflows.xyz/workflows/ai-powered-stock-market-summary-bot-4867


# AI-Powered Stock Market Summary Bot

### 1. Workflow Overview

The **AI-Powered Stock Market Summary Bot** is designed to analyze selected stocks from the S&P 500 using technical indicators (RSI and MACD), summarize the analysis in plain English via a custom AI assistant, and deliver the summary to Slack users during U.S. market hours. It automates market data retrieval, technical computation, AI-based interpretation, and communication.

The workflow is logically divided into the following blocks:

- **1.1 Schedule & Market Status Check**  
  Triggers the workflow on a schedule during market hours and verifies if the market is currently open.

- **1.2 Stock Symbols Setup**  
  Defines the list of stock tickers to analyze.

- **1.3 Data Fetching**  
  Retrieves historical daily stock price data from the Alpaca Markets API for the selected tickers.

- **1.4 Technical Indicator Computation**  
  Processes the raw stock data to calculate RSI and MACD indicators and determines buy/hold/sell signals.

- **1.5 AI-Powered Summary Generation**  
  Sends the computed technical data to a custom OpenAI assistant that produces a readable, categorized market summary.

- **1.6 Summary Distribution**  
  Posts the AI-generated summary to designated Slack users.

---

### 2. Block-by-Block Analysis

#### 1.1 Schedule & Market Status Check

- **Overview:**  
  This block schedules the workflow trigger and verifies if the U.S. stock market is open before proceeding. If the market is closed, the workflow exits gracefully.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Check Market Status  
  - Check if Market is open  
  - Market is Closed (NoOp)

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Runs the workflow every hour between 6:30 AM and 2:30 PM PST, Monday through Friday, corresponding to U.S. market hours.  
    - Configuration: Cron expression `0 30 6-14 * * 1-5` triggers at minute 30 past hours 6 to 14 on weekdays.  
    - Inputs: None (trigger node)  
    - Outputs: Connects to "Check Market Status"  
    - Edge Cases: Cron misconfiguration might cause missed triggers; time zone must be set correctly to "America/Los_Angeles".  
   
  - **Check Market Status**  
    - Type: HTTP Request  
    - Role: Calls Alpaca’s `/v2/clock` endpoint to check current market status.  
    - Configuration: Uses HTTP GET with Alpaca API credentials (custom HTTP Auth).  
    - Inputs: Trigger from Schedule Trigger  
    - Outputs: Connects to "Check if Market is open"  
    - Edge Cases: API authentication failures, network timeouts, or unexpected response format may cause failure.  
   
  - **Check if Market is open**  
    - Type: If  
    - Role: Evaluates if the market is open based on `is_open` boolean field from the Alpaca response.  
    - Configuration: Condition checks if `$json.is_open` is true.  
    - Inputs: Output from "Check Market Status"  
    - Outputs:  
      - True → "Ticker List" (continue workflow)  
      - False → "Market is Closed" (exit)  
    - Edge Cases: Missing or malformed `is_open` field could cause logic failure.  
   
  - **Market is Closed**  
    - Type: NoOp (No Operation)  
    - Role: Gracefully ends the workflow if market is closed; prevents further execution.  
    - Inputs: False branch from "Check if Market is open"  
    - Outputs: None  
    - Edge Cases: None

---

#### 1.2 Stock Symbols Setup

- **Overview:**  
  Defines the list of stock tickers that the workflow will analyze.

- **Nodes Involved:**  
  - Ticker List

- **Node Details:**

  - **Ticker List**  
    - Type: Set  
    - Role: Sets a JSON property `symbols` containing a comma-separated string of stock ticker symbols.  
    - Configuration: Raw JSON mode with symbols: `"AAPL,MSFT,NVDA,TSLA,AMZN,GOOGL,META,JPM,XOM,UNH,GME"`  
    - Inputs: True branch from "Check if Market is open"  
    - Outputs: Connects to "Fetch Stock Data"  
    - Edge Cases: Improperly formatted symbol list could cause API errors downstream.  
    - Notes: This list can be updated to analyze different stocks.

---

#### 1.3 Data Fetching

- **Overview:**  
  Fetches historical daily stock bar data for the specified tickers from the Alpaca Markets API.

- **Nodes Involved:**  
  - Fetch Stock Data

- **Node Details:**

  - **Fetch Stock Data**  
    - Type: HTTP Request  
    - Role: Calls Alpaca `/v2/stocks/bars` endpoint to get daily OHLCV data for the tickers.  
    - Configuration:  
      - Query parameters include:  
        - `symbols`: from "Ticker List" node string  
        - `timeframe`: `1Day`  
        - `limit`: `1000` bars  
        - `feed`: `iex` (to avoid SIP permission errors)  
        - `start`: 100 days ago (calculated dynamically)  
        - `end`: today’s date (dynamic)  
      - Authentication: Custom HTTP Auth with Alpaca credentials  
    - Inputs: From "Ticker List"  
    - Outputs: Connects to "Interpret Data"  
    - Edge Cases: API rate limits, authentication errors, invalid date ranges, or data unavailability for symbols.  
    - Notes: Uses dynamic JavaScript expressions to calculate date range.

---

#### 1.4 Technical Indicator Computation

- **Overview:**  
  Processes the raw stock data to calculate RSI and MACD technical indicators, and determines a buy/hold/sell status per stock.

- **Nodes Involved:**  
  - Interpret Data

- **Node Details:**

  - **Interpret Data**  
    - Type: Code (Python)  
    - Role: Parses the JSON bars, calculates RSI(14) and MACD(12,26,9) indicators, and assigns status signals.  
    - Configuration:  
      - Uses pandas and numpy for calculations.  
      - Filters out stocks with fewer than 30 closing prices.  
      - Computes RSI using average gains and losses over 14 periods.  
      - Computes MACD line and signal line.  
      - Defines status:  
        - "Buy" if RSI < 30 and MACD > signal line  
        - "Sell" if RSI > 70 and MACD < signal line  
        - Otherwise, "Hold"  
      - Outputs a list of stock objects with ticker, RSI, MACD, signal, and status.  
      - Also outputs a JSON string summary for AI input.  
    - Inputs: From "Fetch Stock Data"  
    - Outputs: Connects to "Stock Analysis Assistant"  
    - Edge Cases: Missing or malformed data, Python runtime errors, library import problems.  
    - Version: Python 3 environment in n8n  
    - Notes: Efficiently handles multiple stocks in one script.

---

#### 1.5 AI-Powered Summary Generation

- **Overview:**  
  Sends the technical indicator summary to a custom OpenAI assistant to generate a user-friendly market update in Slack markdown.

- **Nodes Involved:**  
  - Stock Analysis Assistant

- **Node Details:**

  - **Stock Analysis Assistant**  
    - Type: LangChain OpenAI node  
    - Role: Uses a custom assistant to interpret technical JSON data and create a plain English summary categorizing stocks as Buy, Hold, or Sell with explanations.  
    - Configuration:  
      - Input text includes the JSON summary string from "Interpret Data" and a timestamp.  
      - Uses a pre-configured assistant ID tailored for financial summaries.  
      - Outputs a Slack-friendly markdown message.  
      - Credentials: OpenAI API key  
    - Inputs: From "Interpret Data"  
    - Outputs: Connects to "Send Summary to User(s)"  
    - Edge Cases: API quota limits, network issues, prompt formatting errors, or unexpected AI responses.  
    - Notes: The prompt encourages avoidance of technical jargon and focuses on user-friendly insights.

---

#### 1.6 Summary Distribution

- **Overview:**  
  Posts the AI-generated market summary message to designated Slack users.

- **Nodes Involved:**  
  - Send Summary to User(s)  
  - End of Flow (NoOp)

- **Node Details:**

  - **Send Summary to User(s)**  
    - Type: Slack  
    - Role: Sends text message to Slack user(s) or channel(s) with the AI summary.  
    - Configuration:  
      - Message text: uses the AI output field `$json.output`.  
      - User: Configured with Slack user ID(s) or channel(s) for direct messaging.  
      - Credentials: Slack API OAuth2 token  
    - Inputs: From "Stock Analysis Assistant"  
    - Outputs: Connects to "End of Flow"  
    - Edge Cases: Slack API rate limits, invalid tokens, user ID errors, or message delivery failures.  
    - Notes: Supports Slack markdown formatting.  

  - **End of Flow**  
    - Type: NoOp  
    - Role: Marks workflow completion gracefully.  
    - Inputs: From "Send Summary to User(s)"  
    - Outputs: None  

---

### 3. Summary Table

| Node Name               | Node Type                  | Functional Role                  | Input Node(s)              | Output Node(s)              | Sticky Note                                                                                     |
|-------------------------|----------------------------|---------------------------------|----------------------------|-----------------------------|------------------------------------------------------------------------------------------------|
| Schedule Trigger        | Schedule Trigger           | Triggers workflow on schedule   | -                          | Check Market Status          | Runs every hour between 6:30 AM and 2:30 PM (PST), Monday to Friday during market hours         |
| Check Market Status     | HTTP Request               | Checks if market is open via API| Schedule Trigger            | Check if Market is open      | Calls Alpaca `/v2/clock` endpoint to determine market status                                    |
| Check if Market is open | If                         | Routes flow based on market open| Check Market Status         | Ticker List, Market is Closed| True → continue; False → exit gracefully                                                       |
| Market is Closed       | NoOp                       | Ends workflow if market closed  | Check if Market is open (false)| -                         | Graceful exit when market is closed                                                           |
| Ticker List            | Set                        | Defines stock ticker list       | Check if Market is open (true)| Fetch Stock Data           | Sets symbols to analyze; updateable list                                                       |
| Fetch Stock Data       | HTTP Request               | Retrieves stock data from Alpaca| Ticker List                | Interpret Data               | Fetches daily bars for selected stocks; uses `iex` feed to avoid SIP errors                    |
| Interpret Data         | Code (Python)              | Calculates RSI and MACD         | Fetch Stock Data            | Stock Analysis Assistant     | Computes tech indicators and buy/hold/sell status; outputs JSON summary for AI                 |
| Stock Analysis Assistant| LangChain OpenAI           | Generates plain English summary | Interpret Data              | Send Summary to User(s)      | Custom AI assistant summarizes stocks in Slack markdown                                       |
| Send Summary to User(s)| Slack                      | Posts summary to Slack users    | Stock Analysis Assistant    | End of Flow                 | Sends AI summary message to configured Slack user/channel                                     |
| End of Flow            | NoOp                       | Marks workflow completion       | Send Summary to User(s)     | -                           | Workflow end point                                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "Schedule Trigger" Node:**  
   - Type: Schedule Trigger  
   - Set Cron expression to `0 30 6-14 * * 1-5` (6:30 AM to 2:30 PM PST, Mon-Fri)  
   - Set timezone to `America/Los_Angeles`  

2. **Create "Check Market Status" Node:**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://paper-api.alpaca.markets/v2/clock`  
   - Authentication: Generic HTTP Custom Auth (configure with Alpaca API key and secret)  
   - Connect input from "Schedule Trigger"  

3. **Create "Check if Market is open" Node:**  
   - Type: If  
   - Condition: `$json.is_open` is true (boolean check)  
   - Connect input from "Check Market Status"  
   - True output → next block; False output → "Market is Closed" node  

4. **Create "Market is Closed" Node:**  
   - Type: NoOp  
   - Connect input from false branch of "Check if Market is open"  

5. **Create "Ticker List" Node:**  
   - Type: Set  
   - Mode: Raw JSON  
   - Set JSON: `{ "symbols": "AAPL,MSFT,NVDA,TSLA,AMZN,GOOGL,META,JPM,XOM,UNH,GME" }`  
   - Connect input from true branch of "Check if Market is open"  

6. **Create "Fetch Stock Data" Node:**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://data.alpaca.markets/v2/stocks/bars`  
   - Query parameters:  
     - `symbols`: expression `{{$json.symbols}}`  
     - `timeframe`: `1Day`  
     - `limit`: `1000`  
     - `feed`: `iex`  
     - `start`: expression `={{ new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }}` (100 days ago)  
     - `end`: expression `={{ new Date().toISOString().split('T')[0] }}` (today)  
   - Authentication: Generic HTTP Custom Auth with Alpaca credentials  
   - Connect input from "Ticker List"  

7. **Create "Interpret Data" Node:**  
   - Type: Code (Python)  
   - Paste the provided Python script that:  
     - Parses bars for each symbol  
     - Calculates RSI(14) and MACD(12,26,9)  
     - Assigns "Buy", "Hold", "Sell" status  
     - Outputs JSON summary and stocks list  
   - Connect input from "Fetch Stock Data"  

8. **Create "Stock Analysis Assistant" Node:**  
   - Type: LangChain OpenAI node  
   - Set resource to "assistant"  
   - Use your custom assistant ID designed for financial summaries  
   - Set input text with template:  
     ```
     Here is the technical indicator data as JSON:
     {{ $json.summary }}
     
     Pulled as of {{ $now }}
     ```  
   - Credentials: Configure OpenAI API key  
   - Connect input from "Interpret Data"  

9. **Create "Send Summary to User(s)" Node:**  
   - Type: Slack  
   - Configure Slack API credentials (OAuth2 token)  
   - Target user or channel: set Slack user ID or channel ID  
   - Message text: `={{ $json.output }}` (output from AI assistant)  
   - Connect input from "Stock Analysis Assistant"  

10. **Create "End of Flow" Node:**  
    - Type: NoOp  
    - Connect input from "Send Summary to User(s)"  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                            | Context or Link                                                                                      |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| This workflow analyzes selected S&P 500 stocks using RSI and MACD indicators, summarizes insights into plain English, and posts updates to Slack every hour during U.S. market hours (Mon–Fri).                                                                                          | Overview sticky note at workflow start                                                             |
| Schedule Trigger runs every hour between 6:30 AM and 2:30 PM (PST), Monday to Friday, matching U.S. stock market hours. Cron expression used: `0 30 6-14 * * 1-5`.                                                                                                                        | Schedule Trigger sticky note                                                                        |
| Market status is verified via Alpaca's `/clock` endpoint. If market is closed, workflow exits gracefully without processing.                                                                                                                                                            | Market Status Check sticky note                                                                     |
| Alpaca API uses `iex` feed to avoid SIP permissions errors. Date range is dynamically set to last 100 days.                                                                                                                                                                              | Fetch Stock Data sticky note                                                                        |
| Python code calculates RSI(14) and MACD(12,26,9) indicators, determines buy/hold/sell status based on thresholds, and outputs a JSON summary for AI.                                                                                                                                     | Interpret Data sticky note                                                                          |
| The OpenAI assistant is configured with a prompt to produce user-friendly, jargon-free market summaries grouped into Buy, Hold, and Sell categories, outputting Slack markdown.                                                                                                          | AI Assistant Prompt sticky note with detailed instructions and example output format                |
| Slack node posts the summary message to specified Slack users or channels using Slack API OAuth2 credentials.                                                                                                                                                                           | Post to Slack sticky note                                                                           |
| Reminder: The workflow timezone is set to "America/Los_Angeles" to align with U.S. market hours.                                                                                                                                                                                       | Workflow settings                                                                                   |

---

**Disclaimer:**  
The text provided is extracted exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly available.