Automate Stock Trades with AI-Driven Technical Analysis & Alpaca Trading

https://n8nworkflows.xyz/workflows/automate-stock-trades-with-ai-driven-technical-analysis---alpaca-trading-7240


# Automate Stock Trades with AI-Driven Technical Analysis & Alpaca Trading

### 1. Workflow Overview

This workflow automates stock trading decisions by leveraging AI-driven technical analysis combined with market data and trading execution via Alpaca API. It is designed for traders or automated trading systems aiming to integrate advanced AI analysis with real-time financial data to generate actionable trade signals and execute orders.

The workflow’s logic is grouped into the following blocks:

- **1.1 Input Reception & Scheduling:** Receives scheduled triggers and initial market data requests.
- **1.2 Data Acquisition & Preprocessing:** Fetches stock price history, technical indicators (MACD, Bollinger Bands), news, and organizes this data.
- **1.3 Vector Embeddings & Document Retrieval:** Manages embeddings and vector stores for knowledge base interactions using OpenAI and Supabase.
- **1.4 AI Agents for Analysis & Strategy:** Multiple LangChain AI agents perform technical analysis, trend evaluation, and strategy formulation.
- **1.5 Trade Execution & Management:** Interfaces with Alpaca API for current trades, cash balances, placing orders, and saving order info.
- **1.6 Reporting:** Generates and sends email reports with trade and analysis summaries.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Scheduling

- **Overview:**  
  This block initiates the workflow on a schedule and filters incoming market data requests to start the process.

- **Nodes Involved:**  
  - Schedule Trigger  
  - HTTP Request1  
  - Filter

- **Node Details:**  
  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Starts workflow at configured intervals (e.g., market open).  
    - Config: Standard scheduling parameters (not explicitly shown).  
    - Inputs: None  
    - Outputs: HTTP Request1

  - **HTTP Request1**  
    - Type: HTTP Request Tool  
    - Role: Fetches initial market or stock data from an external API.  
    - Config: URL and auth as per API provider (details not shown).  
    - Inputs: Schedule Trigger  
    - Outputs: Filter

  - **Filter**  
    - Type: Filter  
    - Role: Ensures only valid or relevant data requests pass through.  
    - Config: Conditional expressions to validate data (e.g., check for null or specific fields).  
    - Inputs: HTTP Request1  
    - Outputs: MAIN AGENT (AI agent for main processing)

- **Potential Failures:**  
  - HTTP request failure (network, auth)  
  - Filter expression errors if data structure changes  
  - Schedule misconfiguration

#### 1.2 Data Acquisition & Preprocessing

- **Overview:**  
  Retrieves detailed price history and technical indicators from APIs, calculates support/resistance, and organizes data for AI consumption.

- **Nodes Involved:**  
  - Set Stock Symbol and API Key  
  - Get Price History  
  - Get Bollinger Bands  
  - Get MACD  
  - Calculate Support Resistance  
  - Edit Fields  
  - Merge  
  - Organizing Data

- **Node Details:**  
  - **Set Stock Symbol and API Key**  
    - Type: Set  
    - Role: Defines stock ticker symbol and API credentials for subsequent requests.  
    - Config: Static or dynamic values for symbol and keys.  
    - Outputs: Get Price History, Get Bollinger Bands, Get MACD

  - **Get Price History / Get Bollinger Bands / Get MACD**  
    - Type: HTTP Request  
    - Role: API calls to fetch historical price data and technical indicators.  
    - Config: Endpoints, query parameters include symbol and API keys.  
    - Outputs: Merge

  - **Calculate Support Resistance**  
    - Type: Code (JavaScript)  
    - Role: Custom logic to compute support and resistance levels from price data.  
    - Inputs: Get Price History  
    - Outputs: Merge

  - **Merge**  
    - Type: Merge  
    - Role: Combines outputs from technical indicators and calculations into one dataset.  
    - Inputs: Get Bollinger Bands, Get MACD, Calculate Support Resistance  
    - Outputs: Organizing Data

  - **Organizing Data**  
    - Type: Code  
    - Role: Formats and cleans merged data to a structure suitable for AI analysis.  
    - Inputs: Merge  
    - Outputs: Merge-2 (next stage)

- **Potential Failures:**  
  - API key invalid or rate limits  
  - Data missing or malformed from APIs  
  - Code execution errors if data shape unexpected

#### 1.3 Vector Embeddings & Document Retrieval

- **Overview:**  
  Implements vector store management and document embeddings to enrich AI context with stored knowledge and data.

- **Nodes Involved:**  
  - Recursive Character Text Splitter  
  - Default Data Loader  
  - Embeddings OpenAI (2 nodes)  
  - Supabase Vector Store (2 nodes)  
  - Reranker Cohere

- **Node Details:**  
  - **Recursive Character Text Splitter**  
    - Type: Text Splitter  
    - Role: Splits documents into chunks for efficient embedding.  
    - Inputs: Default Data Loader  
    - Outputs: Default Data Loader

  - **Default Data Loader**  
    - Type: Document Loader  
    - Role: Loads documents for vector embedding.  
    - Inputs: Recursive Character Text Splitter  
    - Outputs: Supabase Vector Store

  - **Embeddings OpenAI (two nodes)**  
    - Type: OpenAI Embeddings  
    - Role: Converts text chunks into vector embeddings.  
    - Inputs: Recursive Character Text Splitter, and another input for second node.  
    - Outputs: Supabase Vector Store nodes

  - **Supabase Vector Store (two nodes)**  
    - Type: Vector Store  
    - Role: Stores and queries vector embeddings in Supabase.  
    - Inputs: Embeddings OpenAI, Reranker Cohere  
    - Outputs: MAIN AGENT

  - **Reranker Cohere**  
    - Type: Reranker  
    - Role: Re-ranks vector search results for relevancy using Cohere API.  
    - Inputs: Supabase Vector Store1  
    - Outputs: Supabase Vector Store1

- **Potential Failures:**  
  - API quota exceeded (OpenAI, Cohere, Supabase)  
  - Network or auth errors  
  - Data size issues causing embedding errors

#### 1.4 AI Agents for Analysis & Strategy

- **Overview:**  
  Multiple AI agents analyze technical data, trends, and generate trading strategies by invoking AI language models and custom workflows.

- **Nodes Involved:**  
  - MAIN AGENT  
  - strategy agent  
  - Trader Agent  
  - Trend + Technical Agent  
  - Strategy Agent (agentTool)  
  - Call trend + technical Agent  
  - Think (multiple instances)  
  - OpenRouter Chat Model (multiple instances)  
  - Anthropic Chat Model  
  - Technical Analysis Tool1  
  - Trends Analysis Tool1  
  - First Technical Analysis  
  - Calculator (multiple)  
  - Edit Fields (multiple)  
  - Set Variable  
  - Warp as JSON for GPT  
  - Set Final Response  
  - HTTP Request Tools for endpoints (GET endpoints, POST endpoints)

- **Node Details:**  
  - **Agents (MAIN AGENT, strategy agent, Trader Agent, Trend + Technical Agent, Strategy Agent)**  
    - Type: LangChain Agent or agentTool  
    - Role: Each agent focuses on a particular domain: technical analysis, strategy formulation, trade execution, or trend evaluation.  
    - Inputs: Various data sources and AI models.  
    - Outputs: Other agents or next steps in workflow (e.g., edit nodes).

  - **Think nodes**  
    - Type: Think Tool  
    - Role: Intermediate AI reasoning steps for agents before invoking models.  
    - Inputs: Previous AI step or data  
    - Outputs: Agents or models

  - **OpenRouter Chat Model / Anthropic Chat Model**  
    - Type: Language Model (Chat)  
    - Role: Provides natural language understanding and response generation for agents. Different models are used for robustness or task-specific capabilities.  
    - Inputs: Think nodes or agents  
    - Outputs: Agents or next workflow nodes

  - **Technical Analysis Tool1, Trends Analysis Tool1, First Technical Analysis**  
    - Type: Tool Workflow or OpenAI Node  
    - Role: Run complex analysis sub-workflows or OpenAI completions for detailed insights.  
    - Inputs: Organized data or charts  
    - Outputs: Agents or Set Variable node

  - **Calculator nodes**  
    - Type: Calculator Tool  
    - Role: Performs numeric computations or trading calculations.  
    - Inputs: Agent outputs  
    - Outputs: Next agent or node

  - **Edit Fields and Set Variable nodes**  
    - Type: Set  
    - Role: Transform and prepare data fields for downstream nodes.  
    - Inputs: Agents or analysis nodes  
    - Outputs: Subsequent agents or merging nodes

  - **Warp as JSON for GPT and Set Final Response**  
    - Type: Code, Set  
    - Role: Format final output into structured JSON for GPT consumption and prepare response for reporting or execution.  
    - Inputs: Merge-2  
    - Outputs: Send report

  - **HTTP Request Tools (GET endpoints, POST endpoints)**  
    - Type: HTTP Request Tool  
    - Role: Interact with external APIs for trading data, orders, or cash balance.  
    - Inputs: Agents or Set nodes  
    - Outputs: Agents or next steps

- **Potential Failures:**  
  - AI model rate limits or timeouts  
  - Misconfiguration of prompts or inputs causing unexpected outputs  
  - API endpoint failures or auth errors  
  - Data formatting errors causing agent failures

#### 1.5 Trade Execution & Management

- **Overview:**  
  Handles communication with Alpaca trading API including fetching current trades, cash balances, placing orders, and persisting trade info.

- **Nodes Involved:**  
  - GET cash, GET cash1  
  - current trades, current trades1  
  - POST endpoints  
  - save order info

- **Node Details:**  
  - **GET cash / GET cash1**  
    - Type: HTTP Request Tool  
    - Role: Retrieves current cash balance from Alpaca API.  
    - Inputs: Agents  
    - Outputs: strategy agent or Strategy Agent nodes

  - **current trades / current trades1**  
    - Type: Postgres Tool  
    - Role: Queries current open trades from database or Alpaca.  
    - Inputs: Agents  
    - Outputs: strategy agent or Strategy Agent nodes

  - **POST endpoints**  
    - Type: HTTP Request Tool  
    - Role: Sends order placement or modification requests to Alpaca API.  
    - Inputs: Trader Agent  
    - Outputs: Trader Agent

  - **save order info**  
    - Type: Postgres Tool  
    - Role: Persists order details to database for record keeping.  
    - Inputs: Trader Agent  
    - Outputs: Trader Agent

- **Potential Failures:**  
  - API authentication or rate limiting errors  
  - Database connection failures  
  - Order rejection due to invalid parameters or insufficient funds

#### 1.6 Reporting

- **Overview:**  
  Converts final analysis and trading summary into an email report and sends it out.

- **Nodes Involved:**  
  - Markdown to HTML  
  - Send report (Gmail node)

- **Node Details:**  
  - **Markdown to HTML**  
    - Type: Markdown  
    - Role: Converts markdown formatted report text into HTML email body.  
    - Inputs: MAIN AGENT output (final analysis)  
    - Outputs: Send report

  - **Send report**  
    - Type: Gmail  
    - Role: Sends email report via configured Gmail account.  
    - Inputs: Markdown to HTML  
    - Outputs: None (end node)

- **Potential Failures:**  
  - Email sending failures (auth, quota)  
  - Formatting issues in markdown causing broken HTML

---

### 3. Summary Table

| Node Name                   | Node Type                                | Functional Role                          | Input Node(s)                   | Output Node(s)                  | Sticky Note                         |
|-----------------------------|-----------------------------------------|----------------------------------------|--------------------------------|---------------------------------|-----------------------------------|
| Schedule Trigger            | Schedule Trigger                        | Initiate workflow on schedule           | None                           | HTTP Request1                   |                                   |
| HTTP Request1              | HTTP Request Tool                       | Fetch initial market data                | Schedule Trigger               | Filter                         |                                   |
| Filter                     | Filter                                 | Filter relevant data                     | HTTP Request1                 | MAIN AGENT                     |                                   |
| MAIN AGENT                 | LangChain Agent                        | Central AI processing agent              | Filter, Agents                 | Edit Fields5, Markdown to HTML |                                   |
| Edit Fields5               | Set                                    | Prepare data for strategy agent          | MAIN AGENT                    | strategy agent                 |                                   |
| strategy agent             | LangChain Agent                        | Strategy formulation                      | Edit Fields5, GET cash, current trades | Trader Agent             |                                   |
| Trader Agent               | LangChain Agent                        | Trade execution and management           | strategy agent, POST endpoints | POST endpoints, save order info |                                   |
| POST endpoints             | HTTP Request Tool                       | Submit trade orders                       | Trader Agent                  | Trader Agent                   |                                   |
| save order info            | Postgres Tool                          | Save order details in DB                  | Trader Agent                  | Trader Agent                   |                                   |
| GET cash                   | HTTP Request Tool                       | Fetch cash balance                        | strategy agent                | strategy agent                 |                                   |
| current trades             | Postgres Tool                          | Retrieve current trades                   | strategy agent                | strategy agent                 |                                   |
| Recursive Character Text Splitter | Text Splitter                      | Split documents for embedding            | Default Data Loader           | Default Data Loader            |                                   |
| Default Data Loader        | Document Loader                       | Load documents for vector store           | Recursive Character Text Splitter | Supabase Vector Store         |                                   |
| Embeddings OpenAI          | Embeddings OpenAI                      | Generate vector embeddings                | Recursive Character Text Splitter | Supabase Vector Store1        |                                   |
| Supabase Vector Store      | Vector Store                          | Store and query embeddings                 | Embeddings OpenAI1            | MAIN AGENT                    |                                   |
| Reranker Cohere            | Reranker                              | Re-rank vector search results              | Supabase Vector Store1        | Supabase Vector Store1        |                                   |
| Set Stock Symbol and API Key | Set                                  | Set stock symbol and API keys             | None                         | Get Price History, Bollinger, MACD |                                   |
| Get Price History          | HTTP Request Tool                      | Fetch historical price data                | Set Stock Symbol and API Key  | Calculate Support Resistance, Edit Fields |
| Get Bollinger Bands        | HTTP Request Tool                      | Fetch Bollinger Bands data                  | Set Stock Symbol and API Key  | Merge                         |                                   |
| Get MACD                   | HTTP Request Tool                      | Fetch MACD data                            | Set Stock Symbol and API Key  | Merge                         |                                   |
| Calculate Support Resistance | Code                                  | Compute support/resistance levels           | Get Price History             | Merge                         |                                   |
| Merge                      | Merge                                 | Combine technical indicators data           | Bollinger, MACD, Support Resistance | Organizing Data              |                                   |
| Organizing Data            | Code                                  | Format and clean merged data                 | Merge                        | Merge-2                       |                                   |
| Merge-2                    | Merge                                 | Final data merge for AI input               | Organizing Data, Set Variable | Warp as JSON for GPT          |                                   |
| Set Variable               | Set                                   | Define variables for AI prompt               | First Technical Analysis      | Merge-2                       |                                   |
| Warp as JSON for GPT       | Code                                  | Format AI input as JSON                       | Merge-2                      | Set Final Response            |                                   |
| Set Final Response         | Set                                   | Prepare final AI response                     | Warp as JSON for GPT          | Markdown to HTML              |                                   |
| Markdown to HTML           | Markdown                              | Convert markdown to HTML                        | Set Final Response            | Send report                  |                                   |
| Send report                | Gmail                                | Send email report                              | Markdown to HTML              | None                         |                                   |
| Technical Analysis Tool1   | Tool Workflow                        | Sub-workflow for technical analysis           | Download Chart               | Trend + Technical Agent       |                                   |
| Trends Analysis Tool1      | Tool Workflow                        | Sub-workflow for trend analysis                | Edit Fields1                 | Trend + Technical Agent       |                                   |
| Trend + Technical Agent    | LangChain Agent                     | Agent for trend and technical evaluation       | Technical Analysis Tool1, Trends Analysis Tool1 | Merge-2                   |                                   |
| First Technical Analysis   | OpenAI                              | Initial technical analysis via OpenAI          | Download Chart               | Set Variable                 |                                   |
| Download Chart             | HTTP Request Tool                   | Download stock chart image                      | Get Chart URL                | First Technical Analysis      |                                   |
| Get Chart URL              | HTTP Request Tool                   | Retrieve URL for stock chart                     | Edit Fields                  | Download Chart               |                                   |
| Edit Fields                | Set                                 | Prepare data for chart URL retrieval             | Get Price History            | Get Chart URL                |                                   |
| Edit Fields1               | Set                                 | Prepare data for Trends Analysis Tool1           | Trend + Technical Agent      | Trends Analysis Tool1         |                                   |
| Edit Fields3               | Set                                 | Prepare fields for news data retrieval            | Split Out3                  | Get News Data1               |                                   |
| Get News Data1             | HTTP Request Tool                   | Retrieve news data for stock                       | Edit Fields3                | Aggregate1                  |                                   |
| Aggregate1                 | Aggregate                           | Aggregate news data results                        | Get News Data1              | Code                        |                                   |
| Code                       | Code                                | Process aggregated news data                       | Aggregate1                  | Code1                       |                                   |
| Code1                      | Code                                | Further processing and preparation                  | Code                       | Split Out2                  |                                   |
| Split Out2                 | Split Out                          | Split aggregated data into components                | Code1                      | Edit Fields4                |                                   |
| Edit Fields4               | Set                                 | Prepare limited news data for next steps            | Split Out2                  | Limit1                      |                                   |
| Limit1                     | Limit                              | Limit number of news items processed                  | Edit Fields4                | Aggregate2                  |                                   |
| Aggregate2                 | Aggregate                          | Aggregate limited news items                           | Limit1                      | Edit Fields5                |                                   |
| Edit Fields5               | Set                                 | Prepare final news data for strategy agent            | Aggregate2                  | strategy agent              |                                   |
| Split Out3                 | Split Out                          | Split variables for API calls                          | Generate Variables For API1 | Edit Fields3                |                                   |
| Generate Variables For API1 | Code                                | Generate parameters/variables for API calls            | None                       | Split Out3                  |                                   |
| GET endpoints              | HTTP Request Tool                   | Retrieve Alpaca API endpoints                          | Trader Agent                | Trader Agent                |                                   |
| POST endpoints             | HTTP Request Tool                   | Submit trade orders to Alpaca API                       | Trader Agent                | Trader Agent                |                                   |
| current trades             | Postgres Tool                      | Fetch current trades from DB or API                     | strategy agent              | strategy agent              |                                   |
| current trades1            | Postgres Tool                      | Fetch current trades for strategy agent                  | Strategy Agent              | Strategy Agent              |                                   |
