Analyze Crypto Markets with the AI-Powered CoinMarketCap Data Analyst

https://n8nworkflows.xyz/workflows/analyze-crypto-markets-with-the-ai-powered-coinmarketcap-data-analyst-3425


# Analyze Crypto Markets with the AI-Powered CoinMarketCap Data Analyst

---

### 1. Workflow Overview

This workflow, titled **"Analyze Crypto Markets with the AI-Powered CoinMarketCap Data Analyst,"** is designed as a **supervisor AI agent** that orchestrates a multi-agent system to provide real-time, strategic cryptocurrency market insights via Telegram. It integrates with CoinMarketCap APIs through three specialized sub-agent workflows, enabling comprehensive coverage of centralized exchanges (CEX), decentralized exchanges (DEX), and community sentiment data.

**Target Use Cases:**  
- Crypto traders seeking live market data and comparative analytics  
- Analysts and researchers requiring multi-source intelligence on tokens, exchanges, and DEX liquidity  
- Developers building crypto dashboards or automated alert systems  
- Telegram users wanting conversational access to crypto market insights

**Logical Blocks:**

- **1.1 Input Reception:** Receives user queries from Telegram and attaches session context.  
- **1.2 AI Processing Core:** Uses GPT-4o-mini to interpret queries, maintain session memory, and route requests.  
- **1.3 Sub-Agent Invocation:** Calls three specialized sub-agent workflows for crypto data, exchange & sentiment data, and DEX data.  
- **1.4 Output Delivery:** Sends the synthesized AI-generated response back to the user on Telegram.  
- **1.5 Documentation & Guidance:** Embedded sticky notes provide usage instructions, error handling, and system overview.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  Captures incoming Telegram messages, extracts chat identifiers to maintain session continuity, and prepares the input for AI processing.

- **Nodes Involved:**  
  - Telegram Input  
  - Adds SessionId

- **Node Details:**

  - **Telegram Input**  
    - Type: Telegram Trigger  
    - Role: Listens for new Telegram messages (updates of type "message").  
    - Configuration: Uses Telegram API credentials; triggers workflow on message receipt.  
    - Inputs: Telegram message updates.  
    - Outputs: Message JSON including chat and text.  
    - Edge Cases: Telegram API downtime, invalid bot token, message format changes.

  - **Adds SessionId**  
    - Type: Set Node  
    - Role: Adds a `sessionId` field to the data, set to the Telegram chat ID, enabling session-based memory.  
    - Configuration: Assigns `sessionId` = `{{$json.message.chat.id}}`; preserves other fields.  
    - Inputs: Output from Telegram Input.  
    - Outputs: JSON with added `sessionId`.  
    - Edge Cases: Missing or malformed chat ID; session collisions if multiple users share chat.

#### 1.2 AI Processing Core

- **Overview:**  
  Processes the user query text with GPT-4o-mini, maintains conversational context with windowed memory, and orchestrates routing to appropriate sub-agents based on query content.

- **Nodes Involved:**  
  - CoinMarketCap Agent Brain  
  - CoinMarketCap Memory  
  - CoinMarketCap AI Data Analyst Agent

- **Node Details:**

  - **CoinMarketCap Agent Brain**  
    - Type: LangChain LM Chat OpenAI Node  
    - Role: Runs GPT-4o-mini model to interpret user queries and generate AI responses.  
    - Configuration: Model set to `gpt-4o-mini`; no additional options specified.  
    - Inputs: Text from AI Data Analyst Agent (via LangChain agent interface).  
    - Outputs: AI-generated text responses.  
    - Edge Cases: OpenAI API rate limits, network timeouts, model context length exceeded.

  - **CoinMarketCap Memory**  
    - Type: LangChain Memory Buffer Window  
    - Role: Maintains a sliding window of conversation history keyed by `sessionId` to provide context continuity.  
    - Configuration: Default window size; no custom parameters.  
    - Inputs: Conversation data from AI Data Analyst Agent.  
    - Outputs: Contextual memory data for AI prompt enrichment.  
    - Edge Cases: Memory overflow, session ID mismatches, memory loss on workflow restart.

  - **CoinMarketCap AI Data Analyst Agent**  
    - Type: LangChain Agent Node  
    - Role: Central AI agent that receives user text and session ID, applies a detailed system prompt defining multi-agent capabilities, and routes queries to sub-agents.  
    - Configuration:  
      - Input text: `{{$json.message.text}}` (user query)  
      - Session ID: `{{$json.sessionId}}`  
      - System message: Extensive prompt describing the three sub-agents, their capabilities, validation rules, and example queries.  
      - Prompt instructs the agent to intelligently select and chain sub-agent calls.  
    - Inputs: User query text and session ID from Adds SessionId node.  
    - Outputs: Structured AI response text.  
    - Edge Cases: Prompt misinterpretation, invalid input text, failure to select correct sub-agent, exceeding model token limits.

#### 1.3 Sub-Agent Invocation

- **Overview:**  
  Executes calls to three specialized sub-agent workflows that handle distinct domains of CoinMarketCap data, passing the user query and session context for real-time data retrieval and processing.

- **Nodes Involved:**  
  - CoinMarketCap Crypto Agent Tool  
  - CoinMarketCap Exchange and Community Agent Tool  
  - CoinMarketCap DEXScan Agent Tool

- **Node Details:**

  - **CoinMarketCap Crypto Agent Tool**  
    - Type: LangChain Tool Workflow  
    - Role: Handles cryptocurrency-level data such as token prices, metadata, listings, and conversions.  
    - Configuration:  
      - References external workflow ID for Crypto Agent Tool.  
      - Inputs mapped: `message` (populated dynamically by AI agent), `sessionId`.  
    - Inputs: Routed from AI Data Analyst Agent via tool interface.  
    - Outputs: Structured crypto data for AI synthesis.  
    - Edge Cases: API key invalid or missing, invalid token symbols, API rate limits.

  - **CoinMarketCap Exchange and Community Agent Tool**  
    - Type: LangChain Tool Workflow  
    - Role: Provides exchange metadata, token holdings, Fear & Greed index, and community sentiment data.  
    - Configuration:  
      - References external workflow ID for Exchange & Community Agent Tool.  
      - Inputs: `message` and `sessionId` passed from AI agent.  
    - Inputs: Routed from AI Data Analyst Agent.  
    - Outputs: Exchange and sentiment data.  
    - Edge Cases: API errors, missing exchange IDs, data latency.

  - **CoinMarketCap DEXScan Agent Tool**  
    - Type: LangChain Tool Workflow  
    - Role: Retrieves decentralized exchange data including liquidity, trading pairs, OHLCV historical and latest data, and recent trades.  
    - Configuration:  
      - References external workflow ID for DEXScan Agent Tool.  
      - Inputs: `message` and `sessionId` from AI agent.  
    - Inputs: Routed from AI Data Analyst Agent.  
    - Outputs: DEX market data.  
    - Edge Cases: Network-specific data inconsistencies, invalid pair symbols, API throttling.

#### 1.4 Output Delivery

- **Overview:**  
  Sends the final AI-generated response text back to the Telegram user, completing the conversational loop.

- **Nodes Involved:**  
  - Telegram Send Message

- **Node Details:**

  - **Telegram Send Message**  
    - Type: Telegram Node (Send Message)  
    - Role: Posts the AI response text to the Telegram chat from which the query originated.  
    - Configuration:  
      - Text: `{{$json.output}}` (AI agent’s final output)  
      - Chat ID: `{{$('Telegram Input').item.json.message.chat.id}}` (dynamic from original message)  
      - Credentials: Telegram API credentials configured.  
    - Inputs: Output from AI Data Analyst Agent node.  
    - Outputs: Confirmation of message sent.  
    - Edge Cases: Telegram API errors, invalid chat ID, message length limits.

#### 1.5 Documentation & Guidance

- **Overview:**  
  Provides embedded sticky notes within the workflow for user guidance, error handling, and system overview.

- **Nodes Involved:**  
  - CMC Multi-Agent Guide (Sticky Note)  
  - CMC Sticky Note  
  - CMC Sticky Note2

- **Node Details:**

  - **CMC Multi-Agent Guide**  
    - Type: Sticky Note  
    - Content: Detailed overview of the multi-agent architecture, required sub-agents, AI functions, and node structure summary.  
    - Purpose: Helps users understand the workflow design and dependencies.

  - **CMC Sticky Note**  
    - Type: Sticky Note  
    - Content: Step-by-step usage instructions, example questions, and example API queries.  
    - Purpose: Guides users on how to interact with the AI analyst and what queries to ask.

  - **CMC Sticky Note2**  
    - Type: Sticky Note  
    - Content: Error handling guide for common HTTP status codes, troubleshooting tips, and contact information for support.  
    - Purpose: Assists users in diagnosing and resolving common issues.

---

### 3. Summary Table

| Node Name                              | Node Type                          | Functional Role                                  | Input Node(s)                 | Output Node(s)                  | Sticky Note                                                                                          |
|--------------------------------------|----------------------------------|-------------------------------------------------|------------------------------|--------------------------------|----------------------------------------------------------------------------------------------------|
| Telegram Input                       | Telegram Trigger                 | Receives Telegram messages                       | —                            | Adds SessionId                 | See CMC Sticky Note for usage instructions and example queries                                     |
| Adds SessionId                      | Set                             | Adds sessionId from Telegram chat ID             | Telegram Input               | CoinMarketCap AI Data Analyst Agent |                                                                                                    |
| CoinMarketCap AI Data Analyst Agent | LangChain Agent                 | Central AI agent interpreting queries and routing | Adds SessionId               | Telegram Send Message           | System prompt defines multi-agent routing and validation rules                                     |
| CoinMarketCap Agent Brain           | LangChain LM Chat OpenAI        | Runs GPT-4o-mini model for query understanding   | CoinMarketCap AI Data Analyst Agent (ai_languageModel) | CoinMarketCap AI Data Analyst Agent |                                                                                                    |
| CoinMarketCap Memory                | LangChain Memory Buffer Window  | Maintains session memory for context             | CoinMarketCap AI Data Analyst Agent (ai_memory) | CoinMarketCap AI Data Analyst Agent |                                                                                                    |
| CoinMarketCap Crypto Agent Tool     | LangChain Tool Workflow         | Handles crypto token data queries                 | CoinMarketCap AI Data Analyst Agent (ai_tool) | CoinMarketCap AI Data Analyst Agent | Requires external sub-agent workflow: Crypto Agent Tool                                            |
| CoinMarketCap Exchange and Community Agent Tool | LangChain Tool Workflow         | Handles exchange and sentiment data queries      | CoinMarketCap AI Data Analyst Agent (ai_tool) | CoinMarketCap AI Data Analyst Agent | Requires external sub-agent workflow: Exchange & Community Agent Tool                              |
| CoinMarketCap DEXScan Agent Tool    | LangChain Tool Workflow         | Handles decentralized exchange data queries      | CoinMarketCap AI Data Analyst Agent (ai_tool) | CoinMarketCap AI Data Analyst Agent | Requires external sub-agent workflow: DEXScan Agent Tool                                           |
| Telegram Send Message               | Telegram Node (Send Message)    | Sends AI response back to Telegram user          | CoinMarketCap AI Data Analyst Agent | —                              |                                                                                                    |
| CMC Multi-Agent Guide               | Sticky Note                    | Documentation: System overview and architecture  | —                            | —                              | Provides comprehensive system overview and sub-agent requirements                                 |
| CMC Sticky Note                    | Sticky Note                    | Documentation: Usage instructions and example queries | —                            | —                              | Contains step-by-step usage and example API queries                                               |
| CMC Sticky Note2                   | Sticky Note                    | Documentation: Error handling and support info   | —                            | —                              | Lists HTTP error codes and troubleshooting tips; includes contact and licensing info             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Input Node**  
   - Type: Telegram Trigger  
   - Configure to listen for `message` updates.  
   - Set Telegram API credentials (bot token).  
   - Position: Start of workflow.

2. **Add SessionId Node**  
   - Type: Set Node  
   - Add a new field `sessionId` with value `{{$json.message.chat.id}}`.  
   - Enable "Include Other Fields" to pass through all incoming data.  
   - Connect output of Telegram Input to this node.

3. **Create CoinMarketCap AI Data Analyst Agent Node**  
   - Type: LangChain Agent Node  
   - Parameters:  
     - Text input: `{{$json.message.text}}`  
     - Session ID: `{{$json.sessionId}}`  
     - System message: Paste the detailed system prompt describing the multi-agent architecture, sub-agent capabilities, validation rules, and example queries (as provided in the original workflow).  
   - Connect output of Adds SessionId node to this node.

4. **Create CoinMarketCap Agent Brain Node**  
   - Type: LangChain LM Chat OpenAI Node  
   - Model: Select `gpt-4o-mini`.  
   - No additional options needed.  
   - Connect this node to the AI Data Analyst Agent node’s `ai_languageModel` input.

5. **Create CoinMarketCap Memory Node**  
   - Type: LangChain Memory Buffer Window  
   - Default parameters.  
   - Connect this node to the AI Data Analyst Agent node’s `ai_memory` input.

6. **Create CoinMarketCap Crypto Agent Tool Node**  
   - Type: LangChain Tool Workflow  
   - Select the external workflow for Crypto Agent Tool (must be installed first).  
   - Map inputs:  
     - `message` → dynamically populated by AI agent via `{{$fromAI("message")}}`  
     - `sessionId` → `{{$json.sessionId}}`  
   - Connect this node to the AI Data Analyst Agent node’s `ai_tool` input.

7. **Create CoinMarketCap Exchange and Community Agent Tool Node**  
   - Type: LangChain Tool Workflow  
   - Select the external workflow for Exchange & Community Agent Tool.  
   - Map inputs similarly to Crypto Agent Tool.  
   - Connect to AI Data Analyst Agent node’s `ai_tool` input.

8. **Create CoinMarketCap DEXScan Agent Tool Node**  
   - Type: LangChain Tool Workflow  
   - Select the external workflow for DEXScan Agent Tool.  
   - Map inputs similarly.  
   - Connect to AI Data Analyst Agent node’s `ai_tool` input.

9. **Create Telegram Send Message Node**  
   - Type: Telegram Node (Send Message)  
   - Text: `{{$json.output}}` (output from AI Data Analyst Agent)  
   - Chat ID: `{{$('Telegram Input').item.json.message.chat.id}}`  
   - Configure Telegram API credentials.  
   - Connect output of AI Data Analyst Agent node to this node.

10. **Add Sticky Notes for Documentation** (Optional but recommended)  
    - Create sticky notes with content for:  
      - System overview and architecture  
      - Usage instructions and example queries  
      - Error handling guide and support contacts

11. **Configure Credentials**  
    - Add Telegram Bot API credentials under Telegram API.  
    - Add CoinMarketCap API key as HTTP Header Auth credential for sub-agent workflows.  
    - Ensure OpenAI API key is configured for the LangChain LM Chat OpenAI node.

12. **Install Required Sub-Agent Workflows**  
    - Import and activate the three required sub-agent workflows:  
      - CoinMarketCap Crypto Agent Tool  
      - CoinMarketCap Exchange & Community Agent Tool  
      - CoinMarketCap DEXScan Agent Tool  
    - Verify their workflow IDs and update references in the tool workflow nodes.

13. **Test the Workflow**  
    - Deploy and activate the workflow.  
    - Send test queries to the Telegram bot, e.g., “Top 10 tokens by 24h volume” or “Convert 5 ETH to USD.”  
    - Verify responses and debug any errors.

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                                                                  |
|----------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Workflow requires installation of three sub-agent templates for full functionality.                       | [Creator Profile - Don The Gem Dealer](https://n8n.io/creators/don-the-gem-dealer/)             |
| Telegram Bot creation instructions via @BotFather.                                                       | [Telegram BotFather](https://t.me/BotFather)                                                   |
| CoinMarketCap API key application.                                                                        | [CoinMarketCap API](https://coinmarketcap.com/api/)                                            |
| Error handling guide for HTTP status codes 200, 400, 401, 429, 500 with troubleshooting tips.             | Embedded sticky note "CMC Sticky Note2"                                                        |
| Example API queries for common tasks like top tokens by volume, price conversion, Fear & Greed index.     | Embedded sticky note "CMC Sticky Note"                                                         |
| Intellectual property and licensing notes: workflow design and prompts are proprietary to Treasurium Capital Limited Company. | Embedded sticky note "CMC Sticky Note2"                                                        |
| Contact for support and custom development: Don Jayamaha on LinkedIn.                                     | [LinkedIn Profile](http://linkedin.com/in/donjayamahajr)                                       |

---

This document fully describes the **CoinMarketCap AI Data Analyst Agent** workflow, enabling advanced users and AI agents to understand, reproduce, and extend the system with confidence.