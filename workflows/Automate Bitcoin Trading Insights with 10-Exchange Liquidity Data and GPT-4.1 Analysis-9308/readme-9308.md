Automate Bitcoin Trading Insights with 10-Exchange Liquidity Data and GPT-4.1 Analysis

https://n8nworkflows.xyz/workflows/automate-bitcoin-trading-insights-with-10-exchange-liquidity-data-and-gpt-4-1-analysis-9308


# Automate Bitcoin Trading Insights with 10-Exchange Liquidity Data and GPT-4.1 Analysis

---

### 1. Workflow Overview

This workflow automates the collection and analysis of Bitcoin (BTC) order book liquidity data across 10 major cryptocurrency exchanges, then uses GPT-4.1 AI to generate actionable trading insights. Its core purpose is to provide up-to-date, cross-exchange liquidity snapshots and produce structured intraday and weekly trade signals distributed via Telegram.

**Target Use Cases:**
- Automated monitoring of Bitcoin order book liquidity across multiple venues.
- Real-time generation of trade signals based on comprehensive market depth analysis.
- Delivery of human-readable liquidity reports and AI-generated trading briefs to Telegram channels.
- Support for professional traders, quant analysts, and algorithmic trading systems seeking consolidated liquidity intelligence.

**Logical Blocks:**

- **1.1 Scheduled Trigger:** Initiates the workflow every hour for continuous data refresh.
- **1.2 Multi-Exchange Orderbook Collection:** HTTP request nodes fetch BTC/USDT order book snapshots (up to 5000 levels) from 10 exchanges.
- **1.3 Per-Exchange Wranglers:** Code nodes to normalize each exchange’s raw API response into a unified JSON envelope.
- **1.4 Per-Exchange Liquidity Analysis:** Code nodes parse each normalized order book snapshot to compute key liquidity metrics, cluster support/resistance zones, and generate reports.
- **1.5 Merge Exchange Data:** Merge node consolidates all per-exchange analyses into one stream.
- **1.6 Cross-Exchange Joiners:** Two code nodes combine all data into (a) a single human-readable report string and (b) a nested JSON object for AI analysis.
- **1.7 Bitcoin Liquidity Analysis AI Agent:** GPT-4.1 driven agent processes the consolidated liquidity snapshot to produce actionable intraday and weekly trade signals.
- **1.8 Long Message Splitters:** Code nodes split overlength texts (>4000 characters) into chunks to comply with Telegram message size limits.
- **1.9 Telegram Delivery Nodes:** Two Telegram nodes publish the liquidity report and the AI-generated trading brief to a Telegram channel.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger

- **Overview:** Triggers the workflow execution every hour to ensure fresh data retrieval and analysis.
- **Nodes Involved:**  
  - Schedule Trigger
- **Node Details:**  
  - Type: Schedule Trigger  
  - Configuration: Fires every 1 hour (interval hours)  
  - Inputs: None (trigger node)  
  - Outputs: Connects to all HTTP request nodes for order book data collection  
  - Potential Failures: None typical; ensure n8n host uptime  
  - Version: 1.2  

---

#### 2.2 Multi-Exchange Orderbook Collection

- **Overview:** Collects Bitcoin-USDT order book snapshots from 10 centralized exchanges via public REST APIs, each limited to 5000 levels.
- **Nodes Involved:**  
  - Binance (Bitcoin-USDT Orderbook)  
  - Coinbase (Bitcoin-USDT Orderbook)  
  - Bybit (Bitcoin-USDT Orderbook)  
  - MEXC (Bitcoin-USDT Orderbook)  
  - Gate (Bitcoin-USDT Orderbook)  
  - Bitget (Bitcoin-USDT Orderbook)  
  - OKX (Bitcoin-USDT Orderbook)  
  - Kraken (Bitcoin-USDT Orderbook)  
  - HTX (Bitcoin-USDT Orderbook)  
  - Crypto.com (Bitcoin-USDT Orderbook)  
- **Node Details (typical for each):**  
  - Type: HTTP Request  
  - Configuration:  
    - URL: Exchange-specific public API endpoint for full BTC/USDT order book snapshot  
    - Query Parameters: symbol/pair set to BTCUSDT or equivalent, limit/count=5000 where supported  
    - Auth: None (public API)  
  - Input: Trigger from Schedule Trigger node  
  - Output: Raw JSON response with bids and asks arrays  
  - Edge Cases: API rate limits, downtime, malformed responses  
  - Version: 4.2  

---

#### 2.3 Per-Exchange Wranglers (Payload Normalizers)

- **Overview:** Normalize each exchange’s raw API response or precomputed report into a consistent envelope with keys: `data`, optional `symbol`, and optional `lastUpdateId`.
- **Nodes Involved:**  
  - Wrangle into One Data Cluster for Analysis (Binance)  
  - Wrangle into One Data Cluster for Analysis (Coinbase)  
  - Wrangle into One Data Cluster for Analysis (Bybit)  
  - Wrangle into One Data Cluster for Analysis (MEXC)  
  - Wrangle into One Data Cluster for Analysis (Gate.io)  
  - Wrangle into One Data Cluster for Analysis (Bitget)  
  - Wrangle into One Data Cluster for Analysis (OKX)  
  - Wrangle into One Data Cluster for Analysis (Kraken)  
  - Wrangle into One Data Cluster for Analysis (HTX)  
  - Wrangle into One Data Cluster for Analysis (Crypto.com)  
- **Node Details (typical):**  
  - Type: Code  
  - Configuration: JavaScript code extracts or unwraps nested fields to output JSON in the shape:  
    ```json
    {
      "data": {...},  
      "symbol": "BTCUSDT" (optional),  
      "lastUpdateId": "timestamp or sequence" (optional)
    }
    ```  
  - Input: Raw HTTP response from respective exchange node  
  - Output: Normalized JSON payload for liquidity analysis  
  - Edge Cases: Variations in API response shapes, missing fields, empty responses  
  - Version: 2  

---

#### 2.4 Per-Exchange Liquidity Analysis

- **Overview:** Each Code node processes the normalized order book snapshot to compute: best bid/ask, mid price, spread, spread in bps, total bid/ask notional liquidity, total liquidity, clusters of up to five support and resistance zones using ±0.20% price bands, and generates a human-readable report string.
- **Nodes Involved:**  
  - Calculate Liquidity, Resistance, and Support (Binance)  
  - Calculate Liquidity, Resistance, and Support (Coinbase)  
  - Calculate Liquidity, Resistance, and Support (Bybit)  
  - Calculate Liquidity, Resistance, and Support (MEXC)  
  - Calculate Liquidity, Resistance, and Support (Gate.io)  
  - Calculate Liquidity, Resistance, and Support (Bitget)  
  - Calculate Liquidity, Resistance, and Support (OKX)  
  - Calculate Liquidity, Resistance, and Support (Kraken)  
  - Calculate Liquidity, Resistance, and Support (HTX)  
  - Calculate Liquidity, Resistance, and Support (Crypto.com)  
- **Node Details (typical):**  
  - Type: Code  
  - Configuration: JavaScript performs:  
    - Converts prices and quantities to numbers  
    - Sums notional values (price * quantity) for bid and ask sides  
    - Identifies best bid/ask and computes mid price and spread (absolute and bps)  
    - Clusters liquidity levels within ±0.20% bands into support and resistance zones (max 5 each)  
    - Produces a detailed textual report summarizing liquidity metrics and zones  
  - Inputs: Normalized payload from corresponding wrangler node  
  - Outputs: JSON with detailed liquidity metrics and human-readable `report` string  
  - Edge Cases: Missing bids or asks, empty data, non-numeric values  
  - Version: 2  

---

#### 2.5 Merge Exchange Data

- **Overview:** Merges the 10 parallel streams of normalized and analyzed liquidity data into one unified stream for downstream processing.
- **Nodes Involved:**  
  - Merge Exchange Data  
- **Node Details:**  
  - Type: Merge  
  - Configuration: 10 inputs, combining all collected exchange data into a single stream  
  - Inputs: Outputs from all 10 per-exchange wrangler nodes (post-liquidity analysis)  
  - Outputs: Single array of liquidity snapshots  
  - Edge Cases: If any exchange data missing due to failure, merges remaining inputs gracefully  
  - Version: 3.2  

---

#### 2.6 Cross-Exchange Joiners: Final Report & Consolidated Analytics Input

- **Overview:** Two Code nodes:  
  - One concatenates all human-readable per-exchange reports into a single text block for Telegram.  
  - The other constructs a nested JSON object consolidating all per-exchange liquidity metrics and zones into a cross-venue snapshot for AI analysis.
- **Nodes Involved:**  
  - Join Into One Report  
  - Join Into One Input for Analysis  
- **Node Details:**  
  - Type: Code  
  - Configuration:  
    - *Join Into One Report*: Extracts `report` strings from each item, joins with separators, prepends timestamp header, outputs `text` field.  
    - *Join Into One Input for Analysis*: Normalizes inputs, parses symbols, computes cross-exchange consensus on base/quote, aggregates totals, merges overlapping support/resistance zones, outputs nested `data` object for AI.  
  - Inputs: Merged exchange data array  
  - Outputs:  
    - `Join Into One Report`: JSON with `text` field (human-readable report)  
    - `Join Into One Input for Analysis`: JSON with nested `data` object for AI  
  - Edge Cases: Missing or malformed reports, empty data arrays  
  - Version: 2  

---

#### 2.7 Bitcoin Liquidity Analysis AI Agent

- **Overview:** Uses GPT-4.1-mini model to analyze the consolidated liquidity snapshot JSON, generate structured market insights, and produce actionable intraday and weekly trade signals.
- **Nodes Involved:**  
  - OpenAI Chat Model  
  - Bitcoin Liquidity Analysis AI Agent  
- **Node Details:**  
  - OpenAI Chat Model: Calls OpenAI GPT-4.1-mini with the prompt containing the consolidated liquidity snapshot as JSON input.  
    - Model: gpt-4.1-mini  
    - Credentials: OpenAI API key required  
  - Bitcoin Liquidity Analysis AI Agent: Langchain agent configured with system message defining detailed responsibilities and expected output style for trade signal generation.  
  - Inputs: Consolidated JSON liquidity snapshot  
  - Outputs: AI-generated trading brief text  
  - Edge Cases: API rate limits, model timeout, prompt formatting errors  
  - Version: Langchain agent version 2.2  

---

#### 2.8 Long Message Splitters (4,000-Character Chunks)

- **Overview:** Two Code nodes split texts longer than 4000 characters into smaller chunks to prevent Telegram API limit errors.
- **Nodes Involved:**  
  - Split message if more than 4000 characters  
  - Splits message is more than 4000 characters  
- **Node Details:**  
  - Type: Code  
  - Configuration: JavaScript splits input text (`text` or `output` fields) into 4000-character chunks  
  - Inputs: Text strings from report joiner and AI agent outputs  
  - Outputs: Multiple items each with a chunked `message` field  
  - Edge Cases: Empty input text, exactly 4000 chars (no split)  
  - Version: 2  

---

#### 2.9 Telegram Delivery Nodes

- **Overview:** Two Telegram nodes sequentially post the liquidity report and AI trading brief messages (chunked if needed) to a specified Telegram channel.
- **Nodes Involved:**  
  - Send Bitcoin Multi-Exchange Liquidity Report to Channel  
  - Send an AI-written trading brief with actionable intraday and weekly signals  
- **Node Details:**  
  - Type: Telegram  
  - Configuration:  
    - Chat ID: Numeric channel ID (e.g., `-1003052362843`) or channel username  
    - Text: Uses chunked `message` field from splitters  
    - Parse mode: None (plain text)  
    - Append attribution: false  
  - Inputs: Chunked messages from splitters  
  - Outputs: None (final output nodes)  
  - Credentials: Telegram Bot API token required  
  - Edge Cases: Telegram API rate limits, network errors  
  - Version: 1.2  

---

### 3. Summary Table

| Node Name                                            | Node Type                    | Functional Role                                | Input Node(s)                               | Output Node(s)                                  | Sticky Note                                                                                                  |
|-----------------------------------------------------|------------------------------|-----------------------------------------------|---------------------------------------------|-------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Schedule Trigger                                    | Schedule Trigger             | Scheduled hourly trigger                       | None                                        | Binance, Coinbase, Bybit, MEXC, Gate, Bitget, OKX, Kraken, HTX, Crypto.com HTTP nodes | Scheduled Workflow Trigger: runs every hour to keep workflow continuous                                         |
| Binance (Bitcoin-USDT Orderbook))                   | HTTP Request                | Fetch Binance BTC/USDT order book             | Schedule Trigger                            | Calculate Liquidity, Resistance, and Support (Binance)           | Multi-Exchange Orderbook Collector: fetches BTC/USDT full depth orderbook                                      |
| Coinbase (Bitcoin-USDT Orderbook))                   | HTTP Request                | Fetch Coinbase BTC-USD order book             | Schedule Trigger                            | Calculate Liquidity, Resistance, and Support (Coinbase)          | Multi-Exchange Orderbook Collector: fetches BTC/USDT full depth orderbook                                      |
| Bybit (Bitcoin-USDT Orderbook))                      | HTTP Request                | Fetch Bybit BTC/USDT order book                | Schedule Trigger                            | Calculate Liquidity, Resistance, and Support (Bybit)            | Multi-Exchange Orderbook Collector: fetches BTC/USDT full depth orderbook                                      |
| MEXC (Bitcoin-USDT Orderbook)                        | HTTP Request                | Fetch MEXC BTCUSDT order book                  | Schedule Trigger                            | Calculate Liquidity, Resistance, and Support (MEXC)             | Multi-Exchange Orderbook Collector: fetches BTC/USDT full depth orderbook                                      |
| Gate (Bitcoin-USDT Orderbook)                        | HTTP Request                | Fetch Gate.io BTC_USDT order book              | Schedule Trigger                            | Calculate Liquidity, Resistance, and Support (Gate.io)          | Multi-Exchange Orderbook Collector: fetches BTC/USDT full depth orderbook                                      |
| Bitget (Bitcoin-USDT Orderbook)                      | HTTP Request                | Fetch Bitget BTCUSDT_SPBL order book           | Schedule Trigger                            | Calculate Liquidity, Resistance, and Support (Bitget)           | Multi-Exchange Orderbook Collector: fetches BTC/USDT full depth orderbook                                      |
| OKX (Bitcoin-USDT Orderbook)                         | HTTP Request                | Fetch OKX BTC-USDT full order book             | Schedule Trigger                            | Calculate Liquidity, Resistance, and Support (OKX)              | Multi-Exchange Orderbook Collector: fetches BTC/USDT full depth orderbook                                      |
| Kraken (Bitcoin-USDT Orderbook)                      | HTTP Request                | Fetch Kraken BTCUSDT order book                 | Schedule Trigger                            | Calculate Liquidity, Resistance, and Support (Kraken)           | Multi-Exchange Orderbook Collector: fetches BTC/USDT full depth orderbook                                      |
| HTX (Bitcoin-USDT Orderbook)1                        | HTTP Request                | Fetch Huobi BTCUSDT order book                  | Schedule Trigger                            | Calculate Liquidity, Resistance, and Support (HTX)              | Multi-Exchange Orderbook Collector: fetches BTC/USDT full depth orderbook                                      |
| Crypto.com (Bitcoin-USDT Orderbook)                  | HTTP Request                | Fetch Crypto.com BTC_USDT order book            | Schedule Trigger                            | Calculate Liquidity, Resistance, and Support (Crypto.com)       | Multi-Exchange Orderbook Collector: fetches BTC/USDT full depth orderbook                                      |
| Wrangle into One Data Cluster for Analysis (Binance) | Code                        | Normalize Binance response into standard data | Calculate Liquidity, Resistance, and Support (Binance) | Merge Exchange Data                                  | Orderbook Payload Normalizer: standardizes API response shape                                                  |
| Wrangle into One Data Cluster for Analysis (Coinbase) | Code                        | Normalize Coinbase response                     | Calculate Liquidity, Resistance, and Support (Coinbase) | Merge Exchange Data                                  | Orderbook Payload Normalizer: standardizes API response shape                                                  |
| Wrangle into One Data Cluster for Analysis (Bybit)  | Code                        | Normalize Bybit response                        | Calculate Liquidity, Resistance, and Support (Bybit) | Merge Exchange Data                                  | Orderbook Payload Normalizer: standardizes API response shape                                                  |
| Wrangle into One Data Cluster for Analysis (MEXC)   | Code                        | Normalize MEXC response                         | Calculate Liquidity, Resistance, and Support (MEXC) | Merge Exchange Data                                  | Orderbook Payload Normalizer: standardizes API response shape                                                  |
| Wrangle into One Data Cluster for Analysis (Gate.io) | Code                        | Normalize Gate.io response                       | Calculate Liquidity, Resistance, and Support (Gate.io) | Merge Exchange Data                                  | Orderbook Payload Normalizer: standardizes API response shape                                                  |
| Wrangle into One Data Cluster for Analysis (Bitget) | Code                        | Normalize Bitget response                       | Calculate Liquidity, Resistance, and Support (Bitget) | Merge Exchange Data                                  | Orderbook Payload Normalizer: standardizes API response shape                                                  |
| Wrangle into One Data Cluster for Analysis (OKX)    | Code                        | Normalize OKX response                          | Calculate Liquidity, Resistance, and Support (OKX) | Merge Exchange Data                                  | Orderbook Payload Normalizer: standardizes API response shape                                                  |
| Wrangle into One Data Cluster for Analysis (Kraken) | Code                        | Normalize Kraken response                       | Calculate Liquidity, Resistance, and Support (Kraken) | Merge Exchange Data                                  | Orderbook Payload Normalizer: standardizes API response shape                                                  |
| Wrangle into One Data Cluster for Analysis (HTX)    | Code                        | Normalize HTX response                          | Calculate Liquidity, Resistance, and Support (HTX) | Merge Exchange Data                                  | Orderbook Payload Normalizer: standardizes API response shape                                                  |
| Wrangle into One Data Cluster for Analysis (HTX)1   | Code                        | Normalize Crypto.com response                   | Calculate Liquidity, Resistance, and Support (Crypto.com) | Merge Exchange Data                                  | Orderbook Payload Normalizer: standardizes API response shape                                                  |
| Merge Exchange Data                                  | Merge                       | Combine all normalized exchange data           | All wrangler nodes                          | Join Into One Input for Analysis, Join Into One Report          | Multi-Source Funnel: merges all exchange data into one unified stream                                          |
| Join Into One Report                                | Code                        | Concatenate all per-exchange reports into text| Merge Exchange Data                        | Split message if more than 4000 characters                       | Cross-Venue Joiners: produces human-readable liquidity report                                                  |
| Join Into One Input for Analysis                     | Code                        | Build nested JSON object for AI analysis       | Merge Exchange Data                        | Bitcoin Liquidity Analysis AI Agent                            | Cross-Venue Joiners: prepares machine-readable liquidity snapshot for AI                                       |
| OpenAI Chat Model                                   | Langchain OpenAI Chat Model | Calls GPT-4.1-mini for AI analysis             | Join Into One Input for Analysis           | Bitcoin Liquidity Analysis AI Agent                            | Bitcoin Liquidity Analysis AI Agent (LLM Orchestration)                                                        |
| Bitcoin Liquidity Analysis AI Agent                 | Langchain Agent             | Processes liquidity snapshot, outputs trade signals| OpenAI Chat Model                         | Splits message is more than 4000 characters                     | Bitcoin Liquidity Analysis AI Agent (LLM Orchestration)                                                        |
| Split message if more than 4000 characters          | Code                        | Split long liquidity report text                | Join Into One Report                       | Send Bitcoin Multi-Exchange Liquidity Report to Channel         | Long-Message Splitter: splits long texts for Telegram compliance                                              |
| Splits message is more than 4000 characters          | Code                        | Split long AI trading brief text                 | Bitcoin Liquidity Analysis AI Agent        | Send an AI-written trading brief with actionable intraday and weekly signals | Long-Message Splitter: splits long texts for Telegram compliance                                              |
| Send Bitcoin Multi-Exchange Liquidity Report to Channel | Telegram                    | Posts liquidity report to Telegram channel      | Split message if more than 4000 characters | None                                                           | Telegram Delivery: posts consolidated liquidity report                                                        |
| Send an AI-written trading brief with actionable intraday and weekly signals | Telegram                    | Posts AI trading brief to Telegram channel      | Splits message is more than 4000 characters | None                                                           | Telegram Delivery: posts AI-generated trading brief                                                           |
| Sticky Notes (multiple)                              | Sticky Note                 | Visual documentation and explanations           | None                                        | None                                                           | Various sticky notes explain blocks, nodes, and usage                                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Scheduled Trigger node:**
   - Type: Schedule Trigger  
   - Set interval to every 1 hour.

2. **Add HTTP Request nodes for each exchange (10 total):**
   - For each exchange (Binance, Coinbase, Bybit, MEXC, Gate.io, Bitget, OKX, Kraken, HTX, Crypto.com), create an HTTP Request node.  
   - Configure the URL to the exchange’s BTC/USDT order book public API endpoint with parameters limiting depth to 5000 levels.  
   - No authentication needed for public endpoints.  
   - Connect each HTTP Request node’s input to the Schedule Trigger node.

3. **Create Per-Exchange Liquidity Analysis code nodes (10 total):**
   - After each HTTP Request node, add a Code node to parse the raw response.  
   - Implement JavaScript logic to:  
     - Convert bids/asks prices and quantities to numbers.  
     - Calculate best bid, best ask, mid price, spread (absolute and bps).  
     - Compute total bid and ask notional liquidity and total liquidity.  
     - Cluster top liquidity into up to five support and five resistance zones using ±0.20% bands.  
     - Generate a human-readable string report summarizing the liquidity snapshot.  
   - Connect each HTTP Request node’s output to its corresponding liquidity analysis Code node.

4. **Create Per-Exchange Wranglers code nodes (10 total):**
   - For each liquidity analysis node, add a Code node to normalize the output into a unified JSON envelope:  
     ```json
     {
       "data": {...},  
       "symbol": "...",  
       "lastUpdateId": "..."
     }
     ```  
   - This accounts for different API response structures and ensures consistent downstream processing.  
   - Connect each liquidity analysis node’s output to its respective wrangler node.

5. **Add a Merge node:**
   - Type: Merge  
   - Set to expect 10 inputs.  
   - Connect all Per-Exchange wrangler nodes as inputs.  
   - Output is a single array of all exchange data.

6. **Add two Code nodes for cross-exchange joining:**
   - **Join Into One Report:**  
     - Extract the `report` string from each exchange’s data.  
     - Concatenate with headers and separators into one large text block.  
     - Output field: `text`.  
   - **Join Into One Input for Analysis:**  
     - Normalize and parse all exchange data.  
     - Compute consensus symbols, weighted mid price, aggregate liquidity totals.  
     - Merge overlapping support and resistance zones from all exchanges.  
     - Produce a nested JSON object under a key `data` for AI analysis.

7. **Connect both joiner nodes’ outputs to message splitter code nodes (two nodes):**
   - Each Code node splits input text into ≤4000-character chunks to comply with Telegram limits.  
   - One splitter for the liquidity report text.  
   - One splitter for the AI trading brief text.

8. **Add two Telegram nodes for delivery:**
   - One Telegram node to send the liquidity report chunks.  
     - Configure Telegram credentials and specify the target channel/chat ID.  
     - Use `{{$json.message}}` as text input.  
   - One Telegram node to send the AI trading brief chunks.  
     - Configure similarly with the same or different chat ID.

9. **Add the AI agent nodes:**
   - **OpenAI Chat Model node:**  
     - Use GPT-4.1-mini model from OpenAI.  
     - Authenticate with OpenAI API key.  
     - Input is the nested JSON `data` object from “Join Into One Input for Analysis” node.  
   - **Bitcoin Liquidity Analysis AI Agent node:**  
     - Langchain agent configured with a system prompt specifying analysis responsibilities and output format.  
     - Input is the output of the OpenAI Chat Model node.  
     - Output is AI-generated trading brief text.

10. **Wire the AI agent output to the second message splitter node, then to the Telegram AI trading brief sender node.**

11. **Add sticky notes to document each logical block clearly in the n8n editor for maintainability and clarity.**

12. **Activate the workflow and test end-to-end.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                  | Context or Link                                                                                               |
|-------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Workflow fetches BTC/USDT order books from 10 major exchanges, normalizes, analyzes liquidity, and generates trade signals.    | Core design for cross-exchange Bitcoin liquidity monitoring and AI signal generation.                         |
| Order books fetched with limit=5000 levels where supported for deep liquidity snapshots.                                       | Ensures comprehensive liquidity data for accurate analysis.                                                  |
| Liquidity clustering uses ±0.20% price bands to identify support/resistance zones.                                            | Key parameter for meaningful zone clustering and trade signal reliability.                                    |
| AI agent uses GPT-4.1-mini with detailed system prompt to produce structured intraday and weekly trade signals.               | Provides actionable, richly formatted insights for traders.                                                  |
| Telegram messages are split into 4000-char chunks to meet platform limits and avoid errors.                                    | Critical for reliable message delivery.                                                                       |
| No API keys required for exchange HTTP nodes as all use public REST endpoints.                                                | Simplifies setup and avoids credential management for data fetching.                                         |
| Telegram Bot needs to be added to the channel and chatId replaced with actual channel ID or username.                         | Essential for message delivery.                                                                               |
| Workflow is designed to continue gracefully even if some exchange APIs fail or return incomplete data.                        | Enhances robustness and uptime.                                                                               |
| Reference: LinkedIn profile of workflow author Don Jayamaha and proprietary rights held by Treasurium Capital.                 | https://www.linkedin.com/in/donjayamahajr                                                                     |

---

# End of Document