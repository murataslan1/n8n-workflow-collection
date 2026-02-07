AI-Powered Crypto Analysis Using OpenRouter, Gemini, and SerpAPI

https://n8nworkflows.xyz/workflows/ai-powered-crypto-analysis-using-openrouter--gemini--and-serpapi-2906


# AI-Powered Crypto Analysis Using OpenRouter, Gemini, and SerpAPI

### 1. Workflow Overview

This workflow automates cryptocurrency market analysis by leveraging AI-powered agents and real-time data sources. It is designed to receive a user-input crypto symbol, fetch corresponding candlestick charts at daily and 5-minute intervals, analyze these charts using advanced AI models, and enrich the analysis with the latest crypto news. The final insights combine technical and fundamental analysis, delivered through a chat interface.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Captures user input of a cryptocurrency symbol in a strict format.
- **1.2 Data Retrieval:** Fetches daily and 5-minute candlestick charts for the specified crypto symbol.
- **1.3 AI Analysis:** Uses two AI agents powered by Google Gemini 2.0 Flash via OpenRouter to analyze the charts at different timeframes.
- **1.4 Memory Buffer:** Stores intermediate AI analysis results to maintain context between agents.
- **1.5 Fundamental Data Retrieval:** Obtains the latest cryptocurrency news via SerpAPI to supplement technical analysis.
- **1.6 Output Delivery:** Presents the combined analysis and news insights back to the user in a chat window.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block captures the cryptocurrency symbol input from the user in the format EXCHANGE:SYMBOL (e.g., BINANCE:BTCUSDT), ensuring the workflow targets the correct market data.

- **Nodes Involved:**  
  - Provide Crypto Symbol  
  - crypto_symbol (Set Node)

- **Node Details:**

  - **Provide Crypto Symbol**  
    - Type: Chat Trigger (LangChain Chat Trigger)  
    - Role: Entry point that waits for user input of the crypto symbol.  
    - Configuration: Default chat trigger settings; expects user to input symbol in required format.  
    - Inputs: Webhook trigger from chat interface  
    - Outputs: Passes data to `crypto_symbol` node  
    - Edge Cases: Input format errors (missing colon, invalid exchange or symbol), no input received  
    - Version: 1.1  

  - **crypto_symbol**  
    - Type: Set Node  
    - Role: Stores and formats the cryptocurrency symbol for downstream HTTP requests.  
    - Configuration: Extracts and sets the symbol value from the chat trigger output.  
    - Inputs: From `Provide Crypto Symbol`  
    - Outputs: Passes formatted symbol to `1d_Chart` node  
    - Edge Cases: Empty or malformed symbol values causing API request failures  
    - Version: 3.4  

---

#### 2.2 Data Retrieval

- **Overview:**  
  This block fetches candlestick chart images for the specified cryptocurrency at two timeframes: daily (1d) and 5-minute (5m) intervals, providing both macro and micro market perspectives.

- **Nodes Involved:**  
  - 1d_Chart (HTTP Request)  
  - 5m_Chart (HTTP Request)

- **Node Details:**

  - **1d_Chart**  
    - Type: HTTP Request  
    - Role: Retrieves the daily candlestick chart image for the crypto symbol.  
    - Configuration: Uses Chart Img API with the symbol parameter from `crypto_symbol`.  
    - Inputs: From `crypto_symbol`  
    - Outputs: Passes chart image data to `Long Term Agent`  
    - Edge Cases: API rate limits, invalid symbol causing 404 or empty response, network timeouts  
    - Version: 4.2  
    - Notes: "Get day candlestick chart."  

  - **5m_Chart**  
    - Type: HTTP Request  
    - Role: Retrieves the 5-minute interval candlestick chart image for the crypto symbol.  
    - Configuration: Uses Chart Img API similarly, but with 5-minute interval parameter.  
    - Inputs: From `Long Term Agent` (after daily analysis)  
    - Outputs: Passes chart image data to `AI Agent`  
    - Edge Cases: Same as `1d_Chart`  
    - Version: 4.2  
    - Notes: "Get 5 min candlestick chart."  

---

#### 2.3 AI Analysis

- **Overview:**  
  Two AI agents analyze the candlestick charts: the first agent interprets the daily chart for long-term trends, and the second agent analyzes the 5-minute chart in context with the daily analysis for short-term predictions.

- **Nodes Involved:**  
  - Long Term Agent (LangChain Agent)  
  - AI Agent (LangChain Agent)  
  - OpenRouter Chat Model (Language Model)  

- **Node Details:**

  - **OpenRouter Chat Model**  
    - Type: Language Model (LangChain OpenRouter Chat)  
    - Role: Provides the AI language model interface using Google Gemini 2.0 Flash via OpenRouter.  
    - Configuration: Connected as the language model for both AI agents. Requires OpenRouter API credentials.  
    - Inputs: None directly; used as a resource by agents  
    - Outputs: Feeds AI responses to agents  
    - Edge Cases: API key invalid or expired, daily usage limits reached, network errors  
    - Version: 1  

  - **Long Term Agent**  
    - Type: LangChain Agent  
    - Role: Analyzes the daily candlestick chart to detect long-term market trends and signals.  
    - Configuration: Uses OpenRouter Chat Model as language model and Window Buffer Memory for context.  
    - Inputs: Receives daily chart image from `1d_Chart`  
    - Outputs: Passes control and data to `5m_Chart` for next step  
    - Edge Cases: AI model misinterpretation, memory buffer failures, API errors  
    - Version: 1.7  

  - **AI Agent**  
    - Type: LangChain Agent  
    - Role: Performs advanced analysis combining 5-minute chart data with long-term analysis to generate refined market predictions.  
    - Configuration: Uses OpenRouter Chat Model and Window Buffer Memory for context sharing.  
    - Inputs: Receives 5-minute chart from `5m_Chart` and memory from `Window Buffer Memory`  
    - Outputs: Passes analysis results to `SerpAPI` for news enrichment  
    - Edge Cases: Same as Long Term Agent, plus potential data synchronization issues  
    - Version: 1.7  

---

#### 2.4 Memory Buffer

- **Overview:**  
  This block temporarily stores intermediate AI analysis results, enabling context sharing between the Long Term Agent and AI Agent for coherent multi-step reasoning.

- **Nodes Involved:**  
  - Window Buffer Memory (LangChain Memory Buffer Window)

- **Node Details:**

  - **Window Buffer Memory**  
    - Type: Memory Buffer (LangChain Memory Buffer Window)  
    - Role: Stores conversation and analysis context between AI agents.  
    - Configuration: Connected as memory source for both `Long Term Agent` and `AI Agent`.  
    - Inputs: Receives AI outputs from agents  
    - Outputs: Provides memory context back to agents  
    - Edge Cases: Memory overflow, data corruption, synchronization delays  
    - Version: 1.3  

---

#### 2.5 Fundamental Data Retrieval

- **Overview:**  
  This block fetches the latest cryptocurrency news using SerpAPI to provide fundamental market context, complementing the technical analysis.

- **Nodes Involved:**  
  - SerpAPI (LangChain Tool SerpApi)

- **Node Details:**

  - **SerpAPI**  
    - Type: LangChain Tool (SerpApi)  
    - Role: Queries SerpAPI for recent crypto-related news articles.  
    - Configuration: Uses SerpAPI credentials; query likely based on crypto symbol or general crypto news.  
    - Inputs: Receives AI analysis context from `AI Agent` via ai_tool connection  
    - Outputs: Passes news data to final chat output (not explicitly shown but implied)  
    - Edge Cases: API quota limits, invalid API key, no news results, network errors  
    - Version: 1  

---

#### 2.6 Output Delivery

- **Overview:**  
  The final combined insights from technical AI analysis and fundamental news are delivered back to the user through the chat interface.

- **Nodes Involved:**  
  - Provide Crypto Symbol (entry node also serves as chat output)  

- **Node Details:**

  - **Provide Crypto Symbol** (Chat Trigger)  
    - Role: Besides input, it acts as the chat interface to deliver final AI-powered insights back to the user.  
    - Configuration: Outputs the final message after all processing is complete.  
    - Inputs: Receives final combined data (implied via workflow connections)  
    - Edge Cases: Message formatting errors, chat session timeouts  

---

### 3. Summary Table

| Node Name             | Node Type                          | Functional Role                         | Input Node(s)           | Output Node(s)          | Sticky Note                                                                                 |
|-----------------------|----------------------------------|---------------------------------------|-------------------------|-------------------------|---------------------------------------------------------------------------------------------|
| Provide Crypto Symbol  | LangChain Chat Trigger            | User input and final chat output      | Webhook (external)      | crypto_symbol           |                                                                                             |
| crypto_symbol          | Set Node                         | Store and format crypto symbol        | Provide Crypto Symbol   | 1d_Chart                | Store value of cryptocurrency.                                                              |
| 1d_Chart              | HTTP Request                    | Fetch daily candlestick chart         | crypto_symbol           | Long Term Agent         | Get day candlestick chart.                                                                  |
| Long Term Agent        | LangChain Agent                 | Analyze daily chart for long-term trends | 1d_Chart                | 5m_Chart                |                                                                                             |
| 5m_Chart              | HTTP Request                    | Fetch 5-minute candlestick chart      | Long Term Agent         | AI Agent                | Get 5 min candlestick chart.                                                                |
| AI Agent              | LangChain Agent                 | Analyze 5-minute chart with context   | 5m_Chart, Window Buffer Memory | SerpAPI                 |                                                                                             |
| Window Buffer Memory  | LangChain Memory Buffer Window  | Store intermediate AI analysis context | AI Agents (Long Term Agent, AI Agent) | Long Term Agent, AI Agent |                                                                                             |
| SerpAPI               | LangChain Tool SerpApi           | Retrieve latest crypto news           | AI Agent (ai_tool)      | AI Agent (implied output) |                                                                                             |
| OpenRouter Chat Model | LangChain LM Chat OpenRouter     | Provide AI language model (Google Gemini 2.0 Flash) | None (resource node)    | Long Term Agent, AI Agent |                                                                                             |
| Sticky Note           | Sticky Note                     | Visual notes                          | None                    | None                    |                                                                                             |
| Sticky Note1          | Sticky Note                     | Visual notes                          | None                    | None                    |                                                                                             |
| Sticky Note2          | Sticky Note                     | Visual notes                          | None                    | None                    |                                                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Chat Trigger Node**  
   - Name: Provide Crypto Symbol  
   - Type: LangChain Chat Trigger  
   - Configuration: Default settings to receive user input via chat webhook.  
   - Purpose: Entry point for user to input crypto symbol in format EXCHANGE:SYMBOL.

2. **Create Set Node**  
   - Name: crypto_symbol  
   - Type: Set Node  
   - Configuration: Extract and store the crypto symbol from the chat trigger input.  
   - Connect: Output of `Provide Crypto Symbol` → Input of `crypto_symbol`.

3. **Create HTTP Request Node for Daily Chart**  
   - Name: 1d_Chart  
   - Type: HTTP Request  
   - Configuration:  
     - Method: GET  
     - URL: Chart Img API endpoint for daily candlestick chart  
     - Query Parameters: symbol from `crypto_symbol` node, interval set to daily  
     - Authentication: Use Chart Img API credentials  
   - Connect: Output of `crypto_symbol` → Input of `1d_Chart`.

4. **Create LangChain Agent Node for Long-Term Analysis**  
   - Name: Long Term Agent  
   - Type: LangChain Agent  
   - Configuration:  
     - Language Model: OpenRouter Chat Model (configured separately)  
     - Memory: Window Buffer Memory (configured separately)  
     - Purpose: Analyze daily chart image for long-term trends  
   - Connect: Output of `1d_Chart` → Input of `Long Term Agent`.

5. **Create HTTP Request Node for 5-Minute Chart**  
   - Name: 5m_Chart  
   - Type: HTTP Request  
   - Configuration:  
     - Method: GET  
     - URL: Chart Img API endpoint for 5-minute candlestick chart  
     - Query Parameters: symbol from `crypto_symbol` or passed from `Long Term Agent`, interval set to 5 minutes  
     - Authentication: Use Chart Img API credentials  
   - Connect: Output of `Long Term Agent` → Input of `5m_Chart`.

6. **Create LangChain Agent Node for Short-Term Analysis**  
   - Name: AI Agent  
   - Type: LangChain Agent  
   - Configuration:  
     - Language Model: OpenRouter Chat Model  
     - Memory: Window Buffer Memory  
     - Purpose: Analyze 5-minute chart combined with long-term context  
   - Connect: Output of `5m_Chart` → Input of `AI Agent`.

7. **Create LangChain Memory Buffer Node**  
   - Name: Window Buffer Memory  
   - Type: LangChain Memory Buffer Window  
   - Configuration: Default settings to store conversation context between AI agents.  
   - Connect:  
     - Memory input/output connected to both `Long Term Agent` and `AI Agent`.

8. **Create LangChain Language Model Node**  
   - Name: OpenRouter Chat Model  
   - Type: LangChain LM Chat OpenRouter  
   - Configuration:  
     - API Key: OpenRouter API key (Google Gemini 2.0 Flash)  
     - Model: Gemini 2.0 Flash  
   - Connect: Used as language model resource for both AI agents.

9. **Create LangChain Tool Node for News Retrieval**  
   - Name: SerpAPI  
   - Type: LangChain Tool SerpApi  
   - Configuration:  
     - API Key: SerpAPI key  
     - Query: Crypto-related news, possibly parameterized by symbol or general crypto news  
   - Connect: Output of `AI Agent` (ai_tool connection) → Input of `SerpAPI`.

10. **Connect Final Output**  
    - The final combined analysis and news results should be routed back to the chat interface for user delivery.  
    - Connect output of `SerpAPI` or `AI Agent` back to `Provide Crypto Symbol` node's chat output (or create a dedicated chat output node if preferred).

11. **Credential Setup**  
    - Add credentials for:  
      - OpenRouter (Google Gemini 2.0 Flash)  
      - SerpAPI  
      - Chart Img API  

12. **Test Workflow**  
    - Trigger the chat input with a valid crypto symbol (e.g., BINANCE:BTCUSDT).  
    - Verify each step completes successfully and final insights are delivered.

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                                                                  |
|----------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Video demonstration of the workflow is available at: [YouTube Video](https://www.youtube.com/watch?v=XW03ztGgbg0) | Video tutorial linked in workflow description.                                                  |
| OpenRouter API key required for Google Gemini 2.0 Flash model: https://openrouter.ai/               | Credential setup for AI language model.                                                        |
| SerpAPI key required for news retrieval: https://serpapi.com/                                      | Credential setup for fundamental data retrieval.                                               |
| Chart Img API key required for candlestick chart images: https://chart-img.com/                     | Credential setup for market data visualization.                                                |
| Important: Not all LLM models support image analysis; Google Gemini 2.0 Flash via OpenRouter is recommended. | Model selection note.                                                                           |
| Usage limits apply for free tiers of OpenRouter and SerpAPI; exceeding limits will halt workflow.    | Operational limitation warning.                                                                |
| This workflow is for educational and research purposes only; it does not provide financial advice.  | Legal disclaimer.                                                                              |

---

This structured documentation provides a complete understanding of the AI-Powered Crypto Analysis workflow, enabling users and developers to reproduce, modify, and troubleshoot the automation effectively.