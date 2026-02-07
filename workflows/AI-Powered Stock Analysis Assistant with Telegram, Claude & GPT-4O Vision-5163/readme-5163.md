AI-Powered Stock Analysis Assistant with Telegram, Claude & GPT-4O Vision

https://n8nworkflows.xyz/workflows/ai-powered-stock-analysis-assistant-with-telegram--claude---gpt-4o-vision-5163


# AI-Powered Stock Analysis Assistant with Telegram, Claude & GPT-4O Vision

---

### 1. Workflow Overview

This workflow, named **"AI-Powered Stock Analysis Assistant with Telegram, Claude & GPT-4O Vision"**, is designed to deliver comprehensive, AI-driven technical stock analysis via Telegram chat interface. It targets traders and investors who want detailed, data-driven insights and actionable recommendations on stock tickers using advanced AI language models and financial analysis tools.

The workflow is logically divided into the following functional blocks:

- **1.1 Input Reception & Preprocessing**: Handles incoming Telegram messages, extracting user queries and preparing environment variables.
- **1.2 AI Conversation Management**: Engages the user with an AI agent embodying a senior financial analyst persona, managing conversational memory and language model interactions.
- **1.3 Stock Chart Generation & Download**: Retrieves detailed stock charts from an external API based on the ticker symbol and downloads the chart image.
- **1.4 Technical Analysis Processing**: Uses OpenAI’s GPT-4O Vision model to analyze the downloaded chart image and generate a detailed technical analysis report.
- **1.5 Response Delivery**: Sends the AI-generated analysis and chart image back to the user on Telegram, ensuring a seamless conversational experience.
- **1.6 Workflow Trigger & Integration**: Supports workflow activation via Telegram webhook or manual execution input trigger.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Preprocessing

- **Overview:**  
  Receives Telegram messages, extracts text input, sets up initial context variables, and manages typing indicators to improve user experience.

- **Nodes Involved:**  
  - Telegram Trigger1  
  - PreProcessing  
  - Settings  
  - Send Typing action  
  - Merge

- **Node Details:**

  - **Telegram Trigger1**  
    - Type: Telegram Trigger  
    - Role: Entry point for user messages from Telegram  
    - Config: Watches all types of updates, focusing on incoming messages  
    - Inputs: Telegram webhook events  
    - Outputs: Raw Telegram message JSON  
    - Possible failure: Network issues, invalid webhook setup

  - **PreProcessing**  
    - Type: Set  
    - Role: Extracts message text from Telegram JSON payload and stores it as `message.text` in dot notation  
    - Config: Uses expression `{{$json?.message?.text || ""}}` to safely extract text  
    - Inputs: Telegram Trigger1 output  
    - Outputs: JSON with normalized `message.text` property  
    - Edge cases: Empty or undefined messages handled gracefully

  - **Settings**  
    - Type: Set  
    - Role: Sets conversation-related variables such as model temperature (0.8), token length (500), system command for chatbot behavior, and typing action depending on user input  
    - Configuration: Uses expressions to detect commands starting with "/image" to switch typing action to "upload_photo"  
    - Inputs: PreProcessing outputs  
    - Outputs: JSON enriched with `model_temperature`, `token_length`, `system_command`, and `bot_typing` properties  
    - Edge cases: If message text is missing, default typing action is "typing"

  - **Send Typing action**  
    - Type: Telegram Node (sendChatAction)  
    - Role: Sends typing or upload_photo action to Telegram chat to indicate bot activity  
    - Config: Uses `bot_typing` and `message.from.id` from previous node outputs  
    - Inputs: Settings output  
    - Outputs: Telegram API response  
    - Failure modes: Telegram API rate limits or invalid chat ID

  - **Merge**  
    - Type: Merge (chooseBranch)  
    - Role: Merges branches of workflow ensuring the typing action and AI Agent branches are properly synchronized  
    - Inputs:  
      - From Send Typing action  
      - From AI Agent (downstream)  
    - Outputs: Coordinates flow for sending analysis

---

#### 2.2 AI Conversation Management

- **Overview:**  
  Manages the AI agent’s conversation, maintaining memory buffers per session and directing input through the Claude 3.5 language model, with a detailed persona simulating a 50-year-experienced financial analyst named Ade.

- **Nodes Involved:**  
  - AI Agent  
  - Simple Memory  
  - OpenRouter Chat Model  
  - Get Chart (Langchain toolWorkflow node)

- **Node Details:**

  - **AI Agent**  
    - Type: Langchain Agent Node  
    - Role: Core conversational AI entity simulating "Ade", the senior financial analyst  
    - Config:  
      - Uses input from user message text (`{{$json.message.text}}`)  
      - Defines a comprehensive system message outlining Ade’s persona, behavior protocols, analysis framework (candlestick, MACD, volume, support/resistance), and final verdict communication  
      - Integrates tools: calls "getChart" tool workflow when a stock ticker is detected  
      - Uses memory buffer (Simple Memory) and language model (OpenRouter Chat Model) connections  
    - Inputs:  
      - User message text  
      - AI tool (Get Chart)  
      - AI memory (Simple Memory)  
      - AI language model (OpenRouter Chat Model)  
    - Outputs:  
      - Message text analysis for sending to Telegram  
    - Version: v1.7 of Langchain agent node  
    - Failure modes: Expression errors, API failures, memory buffer issues, language model latency or quota limits

  - **Simple Memory**  
    - Type: Langchain Memory Buffer Window  
    - Role: Maintains conversational context keyed by user message text for session continuity  
    - Config: Session key equal to current message text to isolate context  
    - Inputs: User message text JSON  
    - Outputs: Memory context for AI Agent  
    - Edge cases: Memory overflow or reset conditions

  - **OpenRouter Chat Model**  
    - Type: Langchain OpenRouter Chat Model  
    - Role: Provides the AI language model backend using Anthropic Claude 3.5 Sonnet model  
    - Inputs: Text prompts from AI Agent  
    - Outputs: Model-generated text responses  
    - Edge cases: API key failures, rate limits, model unavailability

  - **Get Chart**  
    - Type: Langchain Tool Workflow  
    - Role: Calls a sub-workflow ("getChart") to generate stock chart URL based on ticker  
    - Inputs: Empty initially, called by AI Agent tool integration passing ticker symbol  
    - Outputs: URL string of the generated stock chart in markdown format  
    - Failure modes: Sub-workflow errors, API key issues in sub-workflow

---

#### 2.3 Stock Chart Generation & Download

- **Overview:**  
  Converts ticker symbol to a stock chart image URL via an external API, then downloads the chart image for analysis.

- **Nodes Involved:**  
  - Set Stock Ticker  
  - Get Chart1 (HTTP Request to chart-img.com)  
  - Download Chart

- **Node Details:**

  - **Set Stock Ticker**  
    - Type: Set  
    - Role: Extracts the ticker symbol from workflow input query and sets it as `ticker` variable  
    - Config: Sets `ticker` from `{{$json.query}}` (manual trigger or external input)  
    - Inputs: Workflow Input Trigger output or external data  
    - Outputs: JSON containing `ticker` string  
    - Edge cases: Missing or malformed ticker input

  - **Get Chart1**  
    - Type: HTTP Request  
    - Role: Calls the chart-img.com TradingView advanced chart API to generate a stock chart image URL  
    - Config:  
      - POST request with JSON body specifying:  
        - theme: dark  
        - interval: 1W (weekly)  
        - symbol: "NASDAQ:{{ticker}}"  
        - studies: Volume and MACD with visual overrides  
      - Headers include API key and content-type  
      - Returns JSON with chart URL  
    - Inputs: `ticker` from Set Stock Ticker  
    - Outputs: JSON containing chart image URL under `url`  
    - Edge cases: API key errors, invalid ticker symbols, network timeouts

  - **Download Chart**  
    - Type: HTTP Request  
    - Role: Downloads the chart image file from the URL obtained by Get Chart1  
    - Config: GET request to the URL in `{{$json.url}}`  
    - Inputs: Chart URL JSON from Get Chart1  
    - Outputs: Binary image data or base64 encoded content for analysis  
    - Edge cases: Download failures, invalid URLs, timeouts

---

#### 2.4 Technical Analysis Processing

- **Overview:**  
  Applies GPT-4O Vision capabilities to analyze the downloaded stock chart image and generate an expert-level technical analysis report.

- **Nodes Involved:**  
  - Technical Analysis  
  - Send Chart  
  - response (Set)

- **Node Details:**

  - **Technical Analysis**  
    - Type: Langchain OpenAI node (GPT-4O Vision)  
    - Role: Performs image-based technical analysis using the downloaded chart image as input  
    - Config:  
      - Model: GPT-4O Vision  
      - Input type: base64 image (from Download Chart)  
      - Prompt: Detailed expert instructions mirroring Ade’s persona, including candlestick, MACD, volume, support/resistance analysis and final verdict  
      - Output: Full textual technical analysis and recommendation  
    - Inputs: Chart image data from Download Chart  
    - Outputs: JSON with detailed analysis text in `choices[0].message.content`  
    - Edge cases: Image decoding errors, model API limits, prompt processing errors

  - **Send Chart**  
    - Type: Telegram Node (sendPhoto)  
    - Role: Sends the stock chart image back to the user on Telegram  
    - Config: Uses the chart URL from Get Chart1 node, sending to a fixed chat ID (likely for testing or admin)  
    - Inputs: Chart URL JSON  
    - Outputs: Telegram API response  
    - Edge cases: Invalid chat ID, API errors

  - **response**  
    - Type: Set  
    - Role: Extracts the textual analysis content from Technical Analysis node output and prepares it for sending  
    - Config: Sets `response` string to the content inside `choices[0].message.content`  
    - Inputs: Technical Analysis output  
    - Outputs: JSON containing `response` string  
    - Edge cases: Missing or malformed AI response

---

#### 2.5 Response Delivery

- **Overview:**  
  Sends the final technical analysis text message back to the Telegram user, closing the loop of interaction.

- **Nodes Involved:**  
  - Send Analysis

- **Node Details:**

  - **Send Analysis**  
    - Type: Telegram Node (sendMessage)  
    - Role: Delivers the AI-generated analysis message text to the user who sent the original query  
    - Config:  
      - Text: `{{$json.output}}` (the analysis text from AI Agent)  
      - Chat ID: dynamically set from the Telegram Trigger1 user ID (`{{$('Telegram Trigger1').item.json.message.from.id}}`)  
      - AdditionalFields: disables attribution to avoid extra text  
    - Inputs: AI Agent output  
    - Outputs: Telegram API message confirmation  
    - Edge cases: Invalid or missing chat ID, Telegram API quota exceeded

---

#### 2.6 Workflow Trigger & Integration

- **Overview:**  
  Enables manual triggering of the workflow with stock ticker input, supporting testing or external automation.

- **Nodes Involved:**  
  - Workflow Input Trigger

- **Node Details:**

  - **Workflow Input Trigger**  
    - Type: Execute Workflow Trigger  
    - Role: Allows manual or programmatic triggering of the workflow with passthrough input  
    - Config: Input source is passthrough, allowing external input injection  
    - Inputs: External trigger or manual start  
    - Outputs: Passes input JSON downstream to Set Stock Ticker  
    - Edge cases: Missing input payload, improper input format

---

### 3. Summary Table

| Node Name           | Node Type                                  | Functional Role                               | Input Node(s)                  | Output Node(s)               | Sticky Note                             |
|---------------------|--------------------------------------------|-----------------------------------------------|-------------------------------|-----------------------------|---------------------------------------|
| Telegram Trigger1    | Telegram Trigger                           | Entry point for Telegram messages             | -                             | PreProcessing               |                                       |
| PreProcessing       | Set                                        | Extracts and normalizes message text           | Telegram Trigger1             | Settings                    |                                       |
| Settings            | Set                                        | Sets conversation context and typing action   | PreProcessing                | Send Typing action, Merge   |                                       |
| Send Typing action  | Telegram (sendChatAction)                   | Sends typing indicator to Telegram             | Settings                     | Merge                      |                                       |
| Merge               | Merge (chooseBranch)                        | Synchronizes branches (typing & AI response)  | Send Typing action, AI Agent  | AI Agent output to Send Analysis |                                       |
| AI Agent            | Langchain Agent                            | Core conversational AI agent "Ade"             | Merge, Simple Memory, Get Chart, OpenRouter Chat Model | Send Analysis               | # AI Agent                           |
| Simple Memory       | Langchain Memory Buffer Window              | Maintains conversational memory buffer        | AI Agent                     | AI Agent                   |                                       |
| OpenRouter Chat Model | Langchain OpenRouter Chat Model            | Provides Claude 3.5 language model backend    | AI Agent                     | AI Agent                   |                                       |
| Get Chart           | Langchain Tool Workflow                     | Generates stock chart URL via sub-workflow    | AI Agent                     | AI Agent                   |                                       |
| Workflow Input Trigger | Execute Workflow Trigger                   | Manual or external workflow start              | -                           | Set Stock Ticker           |                                       |
| Set Stock Ticker    | Set                                        | Sets ticker symbol from input                   | Workflow Input Trigger       | Get Chart1                 |                                       |
| Get Chart1          | HTTP Request                               | Calls stock chart image API                     | Set Stock Ticker             | Download Chart             |                                       |
| Download Chart      | HTTP Request                               | Downloads stock chart image                      | Get Chart1                   | Technical Analysis         |                                       |
| Technical Analysis  | Langchain OpenAI (GPT-4O Vision)           | Analyzes stock chart image and generates report | Download Chart               | Send Chart, response       |                                       |
| Send Chart          | Telegram (sendPhoto)                        | Sends stock chart image to Telegram             | Technical Analysis           | response                   |                                       |
| response            | Set                                        | Extracts AI analysis text for sending           | Technical Analysis           | -                          |                                       |
| Send Analysis       | Telegram (sendMessage)                      | Sends AI analysis text message to user         | AI Agent                    | -                          |                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node:**
   - Type: Telegram Trigger
   - Configure webhook to listen for all message updates.
   - Position at the start of the workflow.

2. **Add PreProcessing Node:**
   - Type: Set
   - Extract `message.text` from Telegram message JSON using expression: `={{ $json?.message?.text || "" }}`
   - Dot notation enabled.
   - Connect Telegram Trigger to PreProcessing.

3. **Add Settings Node:**
   - Type: Set
   - Set variables:
     - `model_temperature` = 0.8
     - `token_length` = 500
     - `system_command` = `=You are a friendly chatbot. User name is {{ $json?.message?.from?.first_name }}. User system language is {{ $json?.message?.from?.language_code }}. First, detect user text language. Next, provide your reply in the same language. Include several suitable emojis in your answer.`
     - `bot_typing` = `={{ $json?.message?.text.startsWith('/image') ? "upload_photo" : "typing" }}`
   - Connect PreProcessing to Settings.

4. **Create Send Typing action Node (Telegram):**
   - Type: Telegram (sendChatAction)
   - Parameters:
     - `action`: Use `{{$json.bot_typing}}`
     - `chatId`: Use `{{$json.message.from.id}}`
   - Connect Settings to Send Typing action.

5. **Add Merge Node:**
   - Type: Merge (chooseBranch)
   - Connect Send Typing action into first input.
   - Will later merge with AI Agent output branch.

6. **Set up Langchain AI Agent Node:**
   - Type: Langchain Agent
   - Configure input text as `={{ $json.message.text }}`
   - Add detailed system message defining "Ade" persona with all instructions, analysis framework, SOP, and communication style.
   - Integrate tools:
     - Add tool "getChart" linked to sub-workflow with ID `gKbTaYYXbDqlQySQ` (Ade’s helper for chart generation)
   - Connect:
     - AI tool input to Get Chart node
     - AI language model input to OpenRouter Chat Model node
     - AI memory input to Simple Memory node
   - Connect Merge node output to AI Agent input.
   - Connect AI Agent output to Send Analysis node.

7. **Create Simple Memory Node:**
   - Type: Langchain Memory Buffer Window
   - Session key: `={{ $json?.message?.text || "" }}`
   - Session ID type: customKey
   - Connect Simple Memory output to AI Agent (ai_memory input).

8. **Create OpenRouter Chat Model Node:**
   - Type: Langchain OpenRouter Chat Model
   - Model: `anthropic/claude-3.5-sonnet`
   - Connect this node output to AI Agent (ai_languageModel input).

9. **Create Get Chart Node (Langchain Tool Workflow):**
   - Name: "Get Chart"
   - Tool workflow ID: `gKbTaYYXbDqlQySQ`
   - Description: Calls sub-workflow to get stock chart URL; expects ticker input.
   - Connect AI Agent tool input to this node.

10. **Create Workflow Input Trigger Node:**
    - Type: Execute Workflow Trigger
    - Input source: passthrough
    - Connect output to Set Stock Ticker node.

11. **Set Stock Ticker Node:**
    - Type: Set
    - Assign `ticker` variable as `={{ $json.query }}`
    - Connect Workflow Input Trigger to this node.

12. **Get Chart1 Node:**
    - Type: HTTP Request
    - Method: POST
    - URL: `https://api.chart-img.com/v2/tradingview/advanced-chart/storage`
    - Headers: Include your API key and content-type application/json
    - JSON Body:
      ```json
      {
        "theme": "dark",
        "interval": "1W",
        "symbol": "NASDAQ:{{ $json.ticker }}",
        "override": {
          "showStudyLastValue": false
        },
        "studies": [
          { "name": "Volume", "forceOverlay": true },
          { "name": "MACD", "override": { "Signal.linewidth": 2, "Signal.color": "rgb(255,65,129)" } }
        ]
      }
      ```
    - Connect Set Stock Ticker to Get Chart1.

13. **Download Chart Node:**
    - Type: HTTP Request
    - Method: GET
    - URL: `={{ $json.url }}`
    - Connect Get Chart1 to Download Chart.

14. **Technical Analysis Node:**
    - Type: Langchain OpenAI (GPT-4O Vision)
    - Model: gpt-4o
    - Input Type: base64 image (from Download Chart)
    - Prompt: Use detailed technical analysis instructions matching Ade’s persona including candlestick, MACD, volume, support/resistance, and verdict.
    - Connect Download Chart to Technical Analysis.

15. **Send Chart Node:**
    - Type: Telegram (sendPhoto)
    - File: `={{ $('Get Chart1').item.json.url }}`
    - Chat ID: Set to desired Telegram chat ID (or dynamically from user if preferred)
    - Connect Technical Analysis to Send Chart.

16. **response Node:**
    - Type: Set
    - Assign `response` string from Technical Analysis output at `choices[0].message.content`
    - Connect Technical Analysis to response node.

17. **Send Analysis Node:**
    - Type: Telegram (sendMessage)
    - Text: `={{ $json.output }}`
    - Chat ID: `={{ $('Telegram Trigger1').item.json.message.from.id }}`
    - Connect AI Agent output to Send Analysis.

18. **Finalize Connections:**
    - Connect Merge node outputs properly to maintain typing indicator and AI response flow.
    - Ensure all credentials (Telegram OAuth2, OpenAI API, Chart API Key, OpenRouter API) are configured and tested.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Context or Link                         |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------|
| Workflow persona "Ade" simulates a senior financial analyst with 50+ years of experience at NYSE and LSE, designed to deliver highly credible, data-driven technical stock analysis with conversational tone and personalized user engagement.                                                                                                                                                                                                                                                         | Workflow design                        |
| Uses Langchain agent node with integrated tool workflow for chart generation and Claude 3.5 for conversational AI, plus GPT-4O Vision for advanced image-based analysis.                                                                                                                                                                                                                                                                                                                           | AI integration architecture           |
| Telegram nodes include typing indicators and sendPhoto capability to improve UX by showing activity and delivering charts visually.                                                                                                                                                                                                                                                                                                                                                               | Telegram UX                           |
| Chart image generation uses chart-img.com API with TradingView advanced chart configuration, requiring API key and proper symbol formatting.                                                                                                                                                                                                                                                                                                                                                      | https://chart-img.com                 |
| OpenRouter Chat Model node configured for Anthropic Claude 3.5 Sonnet model, requiring OpenRouter API credentials.                                                                                                                                                                                                                                                                                                                                                                                | https://openrouter.ai/                |
| Final analysis prompt is highly detailed, demanding comprehensive technical breakdowns (candlestick, MACD, volume, support/resistance) and a clear BUY/SELL/HOLD verdict with reasoning, addressing user by name, and emphasizing non-financial advice disclaimer.                                                                                                                                                                                                                                 | Prompt engineering best practices    |
| Workflow supports both Telegram-triggered and manual/external input triggers, enabling testing and integration with other automation systems.                                                                                                                                                                                                                                                                                                                                                     | Workflow flexibility                  |
| Sticky notes in workflow highlight AI Agent block and Ade’s Technical Analyst workflow, useful for future maintenance or onboarding new developers.                                                                                                                                                                                                                                                                                                                                               | Workflow documentation best practice |

---

**Disclaimer:** The provided text is derived exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected material. All data handled is legal and publicly accessible.

---