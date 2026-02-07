Analyze DEX Liquidity, Trades & Spot Pairs with CoinMarketCap AI Agent

https://n8nworkflows.xyz/workflows/analyze-dex-liquidity--trades---spot-pairs-with-coinmarketcap-ai-agent-3424


# Analyze DEX Liquidity, Trades & Spot Pairs with CoinMarketCap AI Agent

### 1. Workflow Overview

This workflow, titled **"Analyze DEX Liquidity, Trades & Spot Pairs with CoinMarketCap AI Agent"**, is designed to provide comprehensive, real-time, and historical insights into decentralized exchanges (DEXs) by leveraging CoinMarketCap’s DEXScan API suite. It is part of the CoinMarketCap AI Analyst system and can be triggered manually or as a sub-agent by a parent supervisor workflow.

The workflow’s primary purpose is to enable users or AI agents to query detailed data about DEX metadata, networks, trading pairs, liquidity, historical OHLCV (Open, High, Low, Close, Volume) data, and recent trades across multiple blockchain networks such as Ethereum, Polygon, and Solana.

**Logical Blocks:**

- **1.1 Input Reception:** Receives trigger inputs (`sessionId`, `message`) from a parent workflow or manual execution.
- **1.2 AI Processing Core:** Processes the input message using a GPT-4o Mini language model with session memory to maintain conversational context.
- **1.3 DEXScan API Tools:** Eight specialized HTTP request nodes mapped as tools to query specific CoinMarketCap DEXScan API endpoints:
  - DEX Metadata
  - DEX Networks List
  - DEX Listings Quotes
  - DEX Pair Quotes Latest
  - DEX OHLCV Historical
  - DEX OHLCV Latest
  - DEX Trades Latest
  - DEX Spot Pairs Latest
- **1.4 AI Agent Orchestration:** A LangChain AI agent node that routes user queries to the appropriate DEXScan API tool nodes and integrates responses.
- **1.5 Documentation & Support:** Sticky notes providing architecture guidance, usage examples, error handling, and licensing information.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block triggers the workflow execution, accepting inputs from a parent workflow or manual start. It captures the `sessionId` for context and the user `message` containing the query.

- **Nodes Involved:**  
  - When Executed by Another Workflow

- **Node Details:**  
  - **When Executed by Another Workflow**  
    - Type: Execute Workflow Trigger  
    - Role: Entry point that receives `sessionId` and `message` inputs.  
    - Configuration: Defines workflow inputs `sessionId` and `message` to be passed downstream.  
    - Inputs: External trigger or manual start with inputs.  
    - Outputs: Connected to the AI Agent node to process the message.  
    - Edge Cases: Missing or malformed inputs could cause downstream failures; ensure `sessionId` and `message` are provided.

#### 2.2 AI Processing Core

- **Overview:**  
  This block interprets the user’s natural language query, maintains session context, and manages the routing of requests to the appropriate API tools.

- **Nodes Involved:**  
  - DEXScan Agent Brain  
  - DEXScan Agent Memory

- **Node Details:**  
  - **DEXScan Agent Brain**  
    - Type: LangChain LM Chat OpenAI (GPT-4o Mini)  
    - Role: Processes the input message, understands intent, formulates API calls, and summarizes results.  
    - Configuration: Uses `gpt-4o-mini` model with no special options.  
    - Credentials: OpenAI API key configured.  
    - Inputs: Receives the user message from the trigger node.  
    - Outputs: Sends processed text and tool invocation commands to the AI Agent node.  
    - Edge Cases: API rate limits, model timeouts, or malformed prompts could cause failures.

  - **DEXScan Agent Memory**  
    - Type: LangChain Memory Buffer Window  
    - Role: Maintains conversational context using `sessionId` to enable multi-turn dialogue and stateful interactions.  
    - Configuration: Default buffer window, no special parameters.  
    - Inputs: Receives conversation data from the AI Agent node.  
    - Outputs: Provides memory context back to the AI Agent node.  
    - Edge Cases: Memory overflow if session data grows too large; potential context loss if sessionId is missing.

#### 2.3 DEXScan API Tools

- **Overview:**  
  This block contains eight HTTP request nodes, each representing a specific CoinMarketCap DEXScan API endpoint. These nodes act as tools the AI agent can invoke to fetch precise data based on the user’s query.

- **Nodes Involved:**  
  - DEX Metadata  
  - DEX Networks List  
  - DEX Listings Quotes  
  - DEX Pair Quotes Latest  
  - DEX OHLCV Historical  
  - DEX OHLCV Latest  
  - DEX Trades Latest  
  - DEX Spot Pairs Latest

- **Node Details:**  

  - **DEX Metadata**  
    - Type: LangChain HTTP Request Tool  
    - Role: Retrieves static metadata for one or more DEXs (name, logo, URLs, launch date, description).  
    - Configuration: Calls `/v4/dex/listings/info` with required `id` parameter and optional `aux` fields (e.g., logo, description).  
    - Credentials: CoinMarketCap API key via HTTP Header Auth.  
    - Inputs: Parameters passed dynamically from AI agent based on user query.  
    - Outputs: JSON metadata for requested DEX(s).  
    - Edge Cases: 400 error if `id` missing or invalid; large responses may exceed model context limits.

  - **DEX Networks List**  
    - Type: LangChain HTTP Request Tool  
    - Role: Lists all blockchain networks supporting DEX trading with metadata.  
    - Configuration: Calls `/v4/dex/networks/list` with optional pagination and sorting parameters.  
    - Credentials: CoinMarketCap API key.  
    - Inputs: Optional query parameters from AI agent.  
    - Outputs: Network metadata list.  
    - Edge Cases: 400 error if invalid sort or aux parameters.

  - **DEX Listings Quotes**  
    - Type: LangChain HTTP Request Tool  
    - Role: Provides ranked list of DEXs with live trading volume, market share, and other metrics.  
    - Configuration: Calls `/v4/dex/listings/quotes` with optional filters like `sort=volume_24h`.  
    - Credentials: CoinMarketCap API key.  
    - Inputs: Optional query parameters.  
    - Outputs: Paginated DEX market data.  
    - Edge Cases: 400 error if invalid parameters; rate limits.

  - **DEX Pair Quotes Latest**  
    - Type: LangChain HTTP Request Tool  
    - Role: Returns latest market quotes for one or more spot pairs, including liquidity and tax info.  
    - Configuration: Calls `/v4/dex/pairs/quotes/latest` with required identifiers like `contract_address` or `network_slug`.  
    - Credentials: CoinMarketCap API key.  
    - Inputs: Query parameters dynamically set by AI agent.  
    - Outputs: Latest pair quotes and stats.  
    - Edge Cases: 400 error if required params missing; invalid contract addresses.

  - **DEX OHLCV Historical**  
    - Type: LangChain HTTP Request Tool  
    - Role: Retrieves historical OHLCV data for spot pairs with flexible time intervals.  
    - Configuration: Calls `/v4/dex/pairs/ohlcv/historical` with parameters like `time_period`, `time_start`, `count`.  
    - Credentials: CoinMarketCap API key.  
    - Inputs: Time range and pair identifiers from AI agent.  
    - Outputs: Time-series OHLCV data.  
    - Edge Cases: 400 error if invalid time formats or missing required identifiers.

  - **DEX OHLCV Latest**  
    - Type: LangChain HTTP Request Tool  
    - Role: Fetches current-day OHLCV snapshot data for spot pairs.  
    - Configuration: Calls `/v4/dex/pairs/ohlcv/latest` with required identifiers.  
    - Credentials: CoinMarketCap API key.  
    - Inputs: Contract address or network identifiers.  
    - Outputs: Real-time OHLCV data.  
    - Edge Cases: 400 error if missing required params; data freshness depends on API update frequency.

  - **DEX Trades Latest**  
    - Type: LangChain HTTP Request Tool  
    - Role: Returns up to 100 recent trades for specified DEX pairs.  
    - Configuration: Calls `/v4/dex/pairs/trade/latest` with required contract or network identifiers.  
    - Credentials: CoinMarketCap API key.  
    - Inputs: Contract address or network slug.  
    - Outputs: Recent trade data with optional blockchain explorer links.  
    - Edge Cases: 400 error if identifiers missing; rate limits.

  - **DEX Spot Pairs Latest**  
    - Type: LangChain HTTP Request Tool  
    - Role: Lists active spot trading pairs with latest market data and filtering options.  
    - Configuration: Calls `/v4/dex/spot-pairs/latest` requiring at least one identifier (network, dex, base or quote asset).  
    - Credentials: CoinMarketCap API key.  
    - Inputs: Filtering and sorting parameters from AI agent.  
    - Outputs: Paginated spot pair data.  
    - Edge Cases: 400 error if no core identifier provided; large result sets may impact performance.

#### 2.4 AI Agent Orchestration

- **Overview:**  
  The central AI agent node orchestrates the workflow by receiving the user message, consulting the language model and memory, then invoking the appropriate DEXScan API tool nodes to fulfill the query.

- **Nodes Involved:**  
  - CoinMarketCap DEXScan Agent

- **Node Details:**  
  - **CoinMarketCap DEXScan Agent**  
    - Type: LangChain Agent Node  
    - Role: Acts as the AI agent interface, routing natural language queries to the correct API tools and aggregating responses.  
    - Configuration:  
      - Receives input text from the trigger node (`message`).  
      - Uses a detailed system message describing all 8 tools with their endpoints, parameters, and usage rules to guide the AI’s tool selection and parameter validation.  
      - Supports parameter validation to avoid 400 errors.  
    - Inputs: User message, AI language model output, and memory context.  
    - Outputs: Tool invocation commands to the 8 HTTP request nodes.  
    - Edge Cases: Misinterpretation of user intent, invalid parameter generation, or API errors could cause incomplete or failed responses.

#### 2.5 Documentation & Support

- **Overview:**  
  This block provides embedded documentation and troubleshooting guidance via sticky notes to assist users and maintainers.

- **Nodes Involved:**  
  - DEXScan Agent Guide  
  - DEX Usage + Examples  
  - DEX Errors + IP Notice

- **Node Details:**  
  - **DEXScan Agent Guide**  
    - Type: Sticky Note  
    - Content: Detailed architecture overview, tool descriptions, and agent structure.  
    - Purpose: Reference for understanding workflow design and capabilities.

  - **DEX Usage + Examples**  
    - Type: Sticky Note  
    - Content: Stepwise usage instructions, example API calls, and input recommendations.  
    - Purpose: Helps users construct valid queries and understand workflow operation.

  - **DEX Errors + IP Notice**  
    - Type: Sticky Note  
    - Content: Common API error codes, troubleshooting tips, licensing, and author credits.  
    - Purpose: Support for error resolution and legal notice.

---

### 3. Summary Table

| Node Name                   | Node Type                            | Functional Role                          | Input Node(s)                  | Output Node(s)                 | Sticky Note                                                                                  |
|-----------------------------|------------------------------------|----------------------------------------|-------------------------------|-------------------------------|----------------------------------------------------------------------------------------------|
| When Executed by Another Workflow | Execute Workflow Trigger           | Entry trigger receiving `sessionId` and `message` | External trigger              | CoinMarketCap DEXScan Agent    |                                                                                              |
| CoinMarketCap DEXScan Agent | LangChain Agent Node               | AI agent routing queries to API tools | When Executed by Another Workflow, DEXScan Agent Brain, DEXScan Agent Memory | DEX Metadata, DEX Networks List, DEX Listings Quotes, DEX Pair Quotes Latest, DEX OHLCV Historical, DEX OHLCV Latest, DEX Trades Latest, DEX Spot Pairs Latest |                                                                                              |
| DEXScan Agent Brain         | LangChain LM Chat OpenAI           | Processes user message with GPT-4o Mini | When Executed by Another Workflow | CoinMarketCap DEXScan Agent    |                                                                                              |
| DEXScan Agent Memory        | LangChain Memory Buffer Window     | Maintains session context              | CoinMarketCap DEXScan Agent   | CoinMarketCap DEXScan Agent    |                                                                                              |
| DEX Metadata                | LangChain HTTP Request Tool        | Fetches static DEX metadata            | CoinMarketCap DEXScan Agent   | CoinMarketCap DEXScan Agent    |                                                                                              |
| DEX Networks List           | LangChain HTTP Request Tool        | Lists DEX blockchain networks          | CoinMarketCap DEXScan Agent   | CoinMarketCap DEXScan Agent    |                                                                                              |
| DEX Listings Quotes         | LangChain HTTP Request Tool        | Provides ranked DEX market data         | CoinMarketCap DEXScan Agent   | CoinMarketCap DEXScan Agent    |                                                                                              |
| DEX Pair Quotes Latest      | LangChain HTTP Request Tool        | Returns latest spot pair quotes         | CoinMarketCap DEXScan Agent   | CoinMarketCap DEXScan Agent    |                                                                                              |
| DEX OHLCV Historical        | LangChain HTTP Request Tool        | Retrieves historical OHLCV data         | CoinMarketCap DEXScan Agent   | CoinMarketCap DEXScan Agent    |                                                                                              |
| DEX OHLCV Latest            | LangChain HTTP Request Tool        | Fetches current-day OHLCV snapshot      | CoinMarketCap DEXScan Agent   | CoinMarketCap DEXScan Agent    |                                                                                              |
| DEX Trades Latest           | LangChain HTTP Request Tool        | Returns recent trades for spot pairs    | CoinMarketCap DEXScan Agent   | CoinMarketCap DEXScan Agent    |                                                                                              |
| DEX Spot Pairs Latest       | LangChain HTTP Request Tool        | Lists active spot pairs with filters    | CoinMarketCap DEXScan Agent   | CoinMarketCap DEXScan Agent    |                                                                                              |
| DEXScan Agent Guide         | Sticky Note                       | Documentation: architecture and tools  | None                          | None                          | Covers entire workflow architecture and tool descriptions                                   |
| DEX Usage + Examples        | Sticky Note                       | Usage instructions and example queries | None                          | None                          | Provides setup instructions and example API calls                                           |
| DEX Errors + IP Notice      | Sticky Note                       | Error codes, fixes, licensing info      | None                          | None                          | Contains troubleshooting tips and legal/licensing information                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node:**  
   - Add **Execute Workflow Trigger** node named `When Executed by Another Workflow`.  
   - Configure inputs: `sessionId` and `message` as workflow inputs.

2. **Add AI Language Model Node:**  
   - Add **LangChain LM Chat OpenAI** node named `DEXScan Agent Brain`.  
   - Set model to `gpt-4o-mini`.  
   - Configure OpenAI API credentials.  
   - Connect input from `When Executed by Another Workflow`.

3. **Add Memory Node:**  
   - Add **LangChain Memory Buffer Window** node named `DEXScan Agent Memory`.  
   - No special parameters needed.  
   - Connect input/output to/from `CoinMarketCap DEXScan Agent` (to be created next).

4. **Add AI Agent Node:**  
   - Add **LangChain Agent Node** named `CoinMarketCap DEXScan Agent`.  
   - Configure to receive input text from `When Executed by Another Workflow` (`message` field).  
   - Provide a detailed system message describing all 8 DEXScan API tools with their endpoints, parameters, and usage rules (as per the workflow’s system message).  
   - Connect AI language model output (`DEXScan Agent Brain`) as the language model input.  
   - Connect memory node (`DEXScan Agent Memory`) for session context.  
   - Connect outputs to all 8 HTTP request tool nodes (below).

5. **Add HTTP Request Tool Nodes for Each API Endpoint:**  
   For each of the following, create a **LangChain HTTP Request Tool** node with the specified configuration:

   - **DEX Metadata:**  
     - URL: `https://pro-api.coinmarketcap.com/v4/dex/listings/info`  
     - Required query param: `id`  
     - Optional: `aux`  
     - Auth: HTTP Header Auth with CoinMarketCap API key  
     - Accept header: `application/json`

   - **DEX Networks List:**  
     - URL: `https://pro-api.coinmarketcap.com/v4/dex/networks/list`  
     - Optional query params: `start`, `limit`, `sort`, `sort_dir`, `aux`  
     - Auth and headers as above

   - **DEX Listings Quotes:**  
     - URL: `https://pro-api.coinmarketcap.com/v4/dex/listings/quotes`  
     - Optional query params: `start`, `limit`, `sort`, `sort_dir`, `type`, `aux`, `convert_id`  
     - Auth and headers as above

   - **DEX Pair Quotes Latest:**  
     - URL: `https://pro-api.coinmarketcap.com/v4/dex/pairs/quotes/latest`  
     - Required: `contract_address` or `network_id` or `network_slug`  
     - Optional: `aux`, `convert_id`, `skip_invalid`, `reverse_order`  
     - Auth and headers as above

   - **DEX OHLCV Historical:**  
     - URL: `https://pro-api.coinmarketcap.com/v4/dex/pairs/ohlcv/historical`  
     - Required: `contract_address` or `network_id` or `network_slug`  
     - Optional: `time_period`, `time_start`, `time_end`, `count`, `interval`, `aux`, `convert_id`, `skip_invalid`, `reverse_order`  
     - Auth and headers as above

   - **DEX OHLCV Latest:**  
     - URL: `https://pro-api.coinmarketcap.com/v4/dex/pairs/ohlcv/latest`  
     - Required: `contract_address` or `network_id` or `network_slug`  
     - Optional: `aux`, `convert_id`, `skip_invalid`, `reverse_order`  
     - Auth and headers as above

   - **DEX Trades Latest:**  
     - URL: `https://pro-api.coinmarketcap.com/v4/dex/pairs/trade/latest`  
     - Required: `contract_address` or `network_id` or `network_slug`  
     - Optional: `aux`, `convert_id`, `skip_invalid`, `reverse_order`  
     - Auth and headers as above

   - **DEX Spot Pairs Latest:**  
     - URL: `https://pro-api.coinmarketcap.com/v4/dex/spot-pairs/latest`  
     - Required: at least one of `network_id`, `network_slug`, `dex_id`, `dex_slug`, `base_asset_id`, `base_asset_symbol`, `base_asset_contract_address`, `quote_asset_id`, `quote_asset_symbol`, `quote_asset_contract_address`  
     - Optional: filtering, sorting, pagination params, `aux`, `convert_id`, `reverse_order`  
     - Auth and headers as above

6. **Connect the AI Agent Node Outputs:**  
   - Connect the `ai_tool` outputs of the `CoinMarketCap DEXScan Agent` node to each of the eight HTTP request tool nodes.

7. **Connect AI Language Model and Memory to Agent:**  
   - Connect `DEXScan Agent Brain` output to `CoinMarketCap DEXScan Agent` input for language model.  
   - Connect `DEXScan Agent Memory` input/output to `CoinMarketCap DEXScan Agent` for memory context.

8. **Add Sticky Notes for Documentation:**  
   - Create three sticky notes with the following contents:  
     - **DEXScan Agent Guide:** Architecture overview and tool descriptions.  
     - **DEX Usage + Examples:** Usage instructions and example API calls.  
     - **DEX Errors + IP Notice:** Error codes, fixes, and licensing info.

9. **Configure Credentials:**  
   - Set up CoinMarketCap API key as an HTTP Header Auth credential in n8n.  
   - Set up OpenAI API key for GPT-4o Mini model.

10. **Test the Workflow:**  
    - Trigger manually or via parent workflow with inputs:  
      - `sessionId`: unique session identifier  
      - `message`: natural language query (e.g., "Top 5 DEXs by 24h volume on Ethereum")  
    - Verify that the AI agent routes the query correctly and returns data.

---

### 5. General Notes & Resources

| Note Content                                                                                                                        | Context or Link                                                                                         |
|------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| This workflow is part of the CoinMarketCap AI Analyst System, which includes multiple specialized agents for crypto data analysis. | See [Creator Profile](https://n8n.io/creators/don-the-gem-dealer/) for the full suite of tools.        |
| Use `contract_address`, `network_slug`, or `network_id` in nearly all API calls to avoid 400 errors.                               | Refer to sticky note "DEX Errors + IP Notice" for detailed troubleshooting.                            |
| Avoid mixing `convert` and `convert_id` parameters in API queries to prevent errors.                                               | Detailed in system message and sticky notes.                                                          |
| API rate limits and large data requests (e.g., extensive OHLCV intervals) may cause timeouts or truncated responses.               | Consider limiting query size or pagination parameters.                                                |
| The AI agent uses a window buffer memory keyed by `sessionId` to maintain conversational context across multiple queries.         | Enables multi-turn dialogue and stateful analytics sessions.                                          |
| CoinMarketCap API documentation: [https://coinmarketcap.com/api/](https://coinmarketcap.com/api/)                                   | Official API reference for endpoint details and updates.                                              |
| Licensing: The workflow and AI architecture are intellectual property of Treasurium Capital Limited Company, unauthorized use prohibited. | See sticky note "DEX Errors + IP Notice" for legal information and author contact.                     |

---

This structured documentation enables advanced users and AI agents to fully understand, reproduce, and extend the CoinMarketCap DEXScan AI Agent workflow with confidence and precision.