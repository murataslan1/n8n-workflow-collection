AI-Powered Stock Analysis with Danelfin, TwelveData and Alpha Vantage

https://n8nworkflows.xyz/workflows/ai-powered-stock-analysis-with-danelfin--twelvedata-and-alpha-vantage-7261


# AI-Powered Stock Analysis with Danelfin, TwelveData and Alpha Vantage

### 1. Workflow Overview

This workflow, titled **AI-Powered Stock Analysis with Danelfin, TwelveData and Alpha Vantage**, is designed to provide comprehensive stock market insights by combining technical analysis, trend evaluation, and news data processing. It integrates multiple financial data sources and leverages AI models and vector stores to generate insightful, AI-enhanced reports on stock performance.

The workflow is structured into the following logical blocks:

- **1.1 Input Reception:** Multiple triggers capture incoming messages from Gmail, Slack, Telegram, and chat interfaces.
- **1.2 Message Preparation:** Incoming messages are normalized and prepared for processing.
- **1.3 AI Contextual Processing:** LangChain AI components including vectors stores, embeddings, and rerankers process textual data and enrich the context.
- **1.4 Financial Data Retrieval:** HTTP requests fetch stock data from APIs (e.g., price history, Bollinger Bands, MACD).
- **1.5 Technical and Trend Analysis:** AI agents and workflows perform specialized stock analysis using the retrieved data.
- **1.6 Data Aggregation and Formatting:** Collected data is merged, organized, and formatted into a JSON structure.
- **1.7 Report Generation and Delivery:** The final report is converted to HTML and sent via Gmail.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block listens for incoming stock analysis requests from various communication platforms and sets up the initial message variable.

**Nodes Involved:**  
- Gmail Trigger  
- Slack Trigger  
- Telegram Trigger  
- WhatsApp Trigger (disabled)  
- When chat message received  
- Set message variable

**Node Details:**

- **Gmail Trigger**  
  - *Type:* Trigger node for Gmail email reception  
  - *Config:* Uses Gmail OAuth2 credentials, listens for new emails to trigger workflow  
  - *Input:* Incoming emails  
  - *Output:* Email content forwarded for message extraction  
  - *Failure:* Auth errors, connection timeouts  

- **Slack Trigger**  
  - *Type:* Trigger node for Slack message reception  
  - *Config:* Connected via Slack OAuth2, listens for specific Slack events  
  - *Input:* Slack messages  
  - *Output:* Slack message content  
  - *Failure:* Token expiry, API rate limits  

- **Telegram Trigger**  
  - *Type:* Trigger node for Telegram messages  
  - *Config:* Uses Telegram Bot API token  
  - *Input:* Telegram messages  
  - *Output:* Message content forwarded  
  - *Failure:* Invalid bot token, connectivity issues  

- **WhatsApp Trigger** (disabled)  
  - *Type:* Trigger node for WhatsApp messages (disabled)  
  - *Note:* Currently inactive, no input processed  

- **When chat message received**  
  - *Type:* LangChain chat trigger node  
  - *Config:* Listens to chat input for stock analysis requests  
  - *Input:* Chat messages  
  - *Output:* Normalized chat message content  

- **Set message variable**  
  - *Type:* Set node  
  - *Role:* Extracts and standardizes the message content from all triggers into a unified variable  
  - *Input:* Data from triggers  
  - *Output:* Unified message to feed AI agents  
  - *Edge Cases:* Empty or malformed messages should be handled gracefully  

---

#### 1.2 Message Preparation and AI Contextual Processing

**Overview:**  
Processes the input message, creates embeddings, interacts with vector stores, and uses AI tools for contextual understanding and reranking.

**Nodes Involved:**  
- Think  
- Grok 4  
- MAIN AGENT  
- Supabase Vector Store  
- Supabase Vector Store1  
- Embeddings OpenAI  
- Embeddings OpenAI1  
- Reranker Cohere  
- Default Data Loader  
- Recursive Character Text Splitter

**Node Details:**

- **Think**  
  - *Type:* LangChain Think tool node  
  - *Role:* Acts as an AI interface to process and interpret input queries  
  - *Input:* Message variable  
  - *Output:* AI-processed context to MAIN AGENT  
  - *Edge Cases:* AI model timeout or API key issues  

- **Grok 4**  
  - *Type:* LangChain OpenRouter Chat Model  
  - *Role:* AI chat model to interpret complex queries and provide context  
  - *Input:* Message content  
  - *Output:* Enriched AI context to MAIN AGENT  

- **MAIN AGENT**  
  - *Type:* LangChain Agent node  
  - *Role:* Central AI agent coordinating tools and workflows for stock analysis  
  - *Input:* AI context from Think and Grok 4  
  - *Output:* Processed data for report generation  
  - *Edge Cases:* Expression evaluation failures, API limits  

- **Supabase Vector Store & Supabase Vector Store1**  
  - *Type:* LangChain Vector Store nodes  
  - *Role:* Store and query vectorized document embeddings for contextual retrieval  
  - *Input:* Embeddings from OpenAI nodes  
  - *Output:* Relevant documents or data snippets to AI agents  
  - *Edge Cases:* Database connection failures, schema mismatches  

- **Embeddings OpenAI & Embeddings OpenAI1**  
  - *Type:* LangChain Embeddings nodes using OpenAI  
  - *Role:* Convert text data into vector embeddings for semantic search  
  - *Input:* Text from Default Data Loader or Splitter  
  - *Output:* Embeddings to Supabase Vector Stores  
  - *Config:* Uses OpenAI API key; ensure rate limits and tokens are valid  

- **Reranker Cohere**  
  - *Type:* LangChain Reranker node using Cohere API  
  - *Role:* Re-ranks retrieved documents for relevance  
  - *Input:* Candidate documents from Supabase Vector Store1  
  - *Output:* Ranked documents for AI processing  

- **Default Data Loader**  
  - *Type:* LangChain Document Loader  
  - *Role:* Loads default documents for embedding and search  
  - *Input:* Text data (possibly static or preloaded)  
  - *Output:* Documents to embedding nodes  

- **Recursive Character Text Splitter**  
  - *Type:* LangChain Text Splitter  
  - *Role:* Splits large texts into manageable chunks for embeddings  
  - *Input:* Raw text documents  
  - *Output:* Smaller text pieces to Embeddings OpenAI  

---

#### 1.3 Financial Data Retrieval

**Overview:**  
Fetches real-time and historical financial data, including price history, technical indicators, and market sector information using HTTP requests to APIs.

**Nodes Involved:**  
- Set Stock Symbol and API Key  
- Get Price History  
- Get Bollinger Bands  
- Get MACD  
- sectors  
- industries  
- ranking

**Node Details:**

- **Set Stock Symbol and API Key**  
  - *Type:* Set node  
  - *Role:* Defines the stock symbol and API keys required for subsequent API calls  
  - *Output:* Variables for API requests  

- **Get Price History**  
  - *Type:* HTTP Request  
  - *Role:* Retrieves historical price data from a financial API (e.g., Alpha Vantage, TwelveData)  
  - *Input:* Stock symbol, API key  
  - *Output:* Price history JSON  

- **Get Bollinger Bands**  
  - *Type:* HTTP Request  
  - *Role:* Fetches Bollinger Bands indicator data  
  - *Input:* Stock symbol, API key  
  - *Output:* Bollinger Bands data  

- **Get MACD**  
  - *Type:* HTTP Request  
  - *Role:* Retrieves MACD (Moving Average Convergence Divergence) indicator data  
  - *Input:* Stock symbol, API key  
  - *Output:* MACD data  

- **sectors, industries, ranking**  
  - *Type:* HTTP Request Tool  
  - *Role:* Fetches metadata about sectors, industries, and rankings related to stocks  
  - *Input:* API parameters as needed  
  - *Output:* Corresponding metadata for AI processing  

- *Edge Cases:* API rate limits, invalid symbols, network errors, malformed responses  

---

#### 1.4 Technical and Trend Analysis

**Overview:**  
Performs AI-driven analysis on the retrieved financial data using specialized workflows and agents for technical and trend analysis.

**Nodes Involved:**  
- Technical Analysis Tool1  
- Trends Analysis Tool1  
- Trend + Technical Agent  
- Call trend + technical Agent  
- First Technical Analysis  
- Edit Fields1  
- Edit Fields  
- Think2  
- OpenRouter Chat Model2  
- d28d6fda-d277-40fb-8ced-bee5ad68b469 (Get Price History connected here as well)  

**Node Details:**

- **Technical Analysis Tool1 & Trends Analysis Tool1**  
  - *Type:* LangChain Tool Workflow nodes  
  - *Role:* Invoke sub-workflows dedicated to technical and trend analysis respectively  
  - *Input:* Processed financial data  
  - *Output:* Analytical insights  

- **Trend + Technical Agent**  
  - *Type:* LangChain Agent node  
  - *Role:* Coordinates the tools for combined trend and technical analysis  
  - *Input:* Data from Edit Fields1 and other nodes  
  - *Output:* Consolidated analysis data  

- **Call trend + technical Agent**  
  - *Type:* LangChain Tool Workflow  
  - *Role:* Invokes the MAIN AGENT with trend and technical analysis capabilities  
  - *Input:* Combined data sets  
  - *Output:* AI-processed results  

- **First Technical Analysis**  
  - *Type:* LangChain OpenAI node  
  - *Role:* Initial technical analysis prompt to OpenAI model using stock data  
  - *Output:* Analysis summary  

- **Edit Fields and Edit Fields1**  
  - *Type:* Set nodes  
  - *Role:* Format and prepare data fields for further processing and AI input  
  - *Output:* Cleaned and structured data for agents  

- **Think2**  
  - *Type:* LangChain Think tool node  
  - *Role:* AI processing for secondary thought and refinement  
  - *Output:* Data to Trend + Technical Agent  

- **OpenRouter Chat Model2**  
  - *Type:* LangChain Chat Model  
  - *Role:* AI language model used within Trend + Technical Agent for chat-based responses  

- *Edge Cases:* Sub-workflow failures, API timeouts, AI model rate limits, unexpected data formats  

---

#### 1.5 Data Aggregation and Formatting

**Overview:**  
Combines and organizes all retrieved and analyzed data into unified JSON structures and formats textual responses into HTML.

**Nodes Involved:**  
- Merge  
- Calculate Support Resistance  
- Organizing Data  
- Merge-2  
- Warp as JSON for GPT  
- Set Final Response  
- Markdown to HTML

**Node Details:**

- **Merge & Merge-2**  
  - *Type:* Merge nodes  
  - *Role:* Combine multiple data streams (e.g., technical indicators, news, analysis) into single items  
  - *Input:* Outputs from multiple HTTP requests and AI agents  
  - *Output:* Unified data sets  

- **Calculate Support Resistance**  
  - *Type:* Code node (JavaScript)  
  - *Role:* Custom calculation of support and resistance levels based on price history data  
  - *Input:* Price history data  
  - *Output:* Calculated key levels for technical analysis  

- **Organizing Data**  
  - *Type:* Code node  
  - *Role:* Formats and structures the combined data for report generation  

- **Warp as JSON for GPT**  
  - *Type:* Code node  
  - *Role:* Converts aggregated data into a JSON structure optimized for GPT consumption  

- **Set Final Response**  
  - *Type:* Set node  
  - *Role:* Prepares the final response payload including text and metadata  

- **Markdown to HTML**  
  - *Type:* Markdown node  
  - *Role:* Converts the AI-generated markdown report into HTML for email delivery  

- *Edge Cases:* Data mismatch, code execution errors, malformed JSON, markdown rendering issues  

---

#### 1.6 Report Generation and Delivery

**Overview:**  
Sends the final formatted stock analysis report via email.

**Nodes Involved:**  
- Send report  

**Node Details:**

- **Send report**  
  - *Type:* Gmail node  
  - *Role:* Sends the generated HTML report email to recipients  
  - *Config:* Uses Gmail OAuth2 credentials with sender and recipient details configured  
  - *Input:* HTML content from Markdown to HTML node  
  - *Output:* Email delivery confirmation  
  - *Edge Cases:* Email sending failures, SMTP errors, invalid recipient addresses  

---

### 3. Summary Table

| Node Name                    | Node Type                                  | Functional Role                          | Input Node(s)                         | Output Node(s)                  | Sticky Note                       |
|------------------------------|--------------------------------------------|----------------------------------------|-------------------------------------|--------------------------------|---------------------------------|
| Gmail Trigger                 | gmailTrigger                              | Incoming email trigger                   | -                                   | Set message variable            |                                 |
| Slack Trigger                | slackTrigger                             | Incoming Slack message trigger           | -                                   | Set message variable            |                                 |
| Telegram Trigger             | telegramTrigger                          | Incoming Telegram message trigger        | -                                   | Set message variable            |                                 |
| WhatsApp Trigger             | whatsAppTrigger (disabled)                | Incoming WhatsApp trigger (disabled)     | -                                   | Set message variable            |                                 |
| When chat message received   | langchain.chatTrigger                      | Chat message trigger                     | -                                   | Set message variable            |                                 |
| Set message variable          | set                                       | Normalizes message variable              | Gmail Trigger, Slack Trigger, Telegram Trigger, WhatsApp Trigger, When chat message received | MAIN AGENT                     |                                 |
| Think                        | langchain.toolThink                        | AI thinking process                      | Set message variable                 | MAIN AGENT                     |                                 |
| Grok 4                       | langchain.lmChatOpenRouter                 | AI chat model                           | Set message variable                 | MAIN AGENT                     |                                 |
| MAIN AGENT                   | langchain.agent                            | Central AI agent                        | Think, Grok 4, ranking, sectors, industries | Markdown to HTML              |                                 |
| Supabase Vector Store         | langchain.vectorStoreSupabase              | Vector store for document retrieval    | Embeddings OpenAI1, Default Data Loader | MAIN AGENT                     |                                 |
| Supabase Vector Store1        | langchain.vectorStoreSupabase              | Vector store for document retrieval    | Embeddings OpenAI, Reranker Cohere  | MAIN AGENT                     |                                 |
| Embeddings OpenAI             | langchain.embeddingsOpenAi                 | Generates text embeddings               | Default Data Loader                  | Supabase Vector Store1         |                                 |
| Embeddings OpenAI1            | langchain.embeddingsOpenAi                 | Generates text embeddings               | Recursive Character Text Splitter   | Supabase Vector Store          |                                 |
| Reranker Cohere               | langchain.rerankerCohere                   | Reranks documents                      | Supabase Vector Store1               | Supabase Vector Store1         |                                 |
| Default Data Loader           | langchain.documentDefaultDataLoader        | Loads documents                        | Recursive Character Text Splitter   | Embeddings OpenAI1             |                                 |
| Recursive Character Text Splitter | langchain.textSplitterRecursiveCharacterTextSplitter | Splits text for embedding              | -                                   | Default Data Loader            |                                 |
| Set Stock Symbol and API Key  | set                                       | Sets API keys and stock symbol          | -                                   | Get Price History, Get Bollinger Bands, Get MACD |                                 |
| Get Price History             | httpRequest                               | Fetches historical price data           | Set Stock Symbol and API Key         | Calculate Support Resistance, Edit Fields |                                 |
| Get Bollinger Bands           | httpRequest                               | Fetches Bollinger Bands indicator       | Set Stock Symbol and API Key         | Merge                         |                                 |
| Get MACD                     | httpRequest                               | Fetches MACD indicator                   | Set Stock Symbol and API Key         | Merge                         |                                 |
| Calculate Support Resistance  | code                                      | Calculates support/resistance levels    | Get Price History                   | Merge                         |                                 |
| Edit Fields                  | set                                       | Prepares data for chart URL retrieval   | Get Price History                   | Get Chart URL                 |                                 |
| Get Chart URL                | httpRequest                               | Retrieves chart URL                      | Edit Fields                        | Download Chart                |                                 |
| Download Chart               | httpRequest                               | Downloads chart image                    | Get Chart URL                      | First Technical Analysis      |                                 |
| First Technical Analysis      | langchain.openAi                           | Performs initial technical analysis     | Download Chart                    | Set Variable                  |                                 |
| Set Variable                 | set                                       | Sets variables for final merging        | First Technical Analysis           | Merge-2                       |                                 |
| Merge                        | merge                                     | Merges technical indicators              | Get MACD, Get Bollinger Bands, Calculate Support Resistance | Organizing Data             |                                 |
| Organizing Data              | code                                      | Organizes merged data                    | Merge                            | Merge-2                       |                                 |
| Merge-2                      | merge                                     | Merges all data streams                   | Organizing Data, Set Variable      | Warp as JSON for GPT          |                                 |
| Warp as JSON for GPT         | code                                      | Prepares JSON for GPT consumption        | Merge-2                         | Set Final Response            |                                 |
| Set Final Response           | set                                       | Sets final output message                 | Warp as JSON for GPT              | Markdown to HTML             |                                 |
| Markdown to HTML             | markdown                                  | Converts markdown report to HTML          | Set Final Response               | Send report                  |                                 |
| Send report                 | gmail                                     | Sends final report email                   | Markdown to HTML                 | -                            |                                 |
| sectors                     | httpRequestTool                           | Retrieves sectors metadata                 | -                               | MAIN AGENT                   |                                 |
| industries                  | httpRequestTool                           | Retrieves industries metadata              | -                               | MAIN AGENT                   |                                 |
| ranking                     | httpRequestTool                           | Retrieves stock rankings                    | -                               | MAIN AGENT                   |                                 |
| Technical Analysis Tool1     | langchain.toolWorkflow                     | Sub-workflow for technical analysis       | Edit Fields1                    | Trend + Technical Agent      |                                 |
| Trends Analysis Tool1        | langchain.toolWorkflow                     | Sub-workflow for trend analysis           | Edit Fields1                    | Trend + Technical Agent      |                                 |
| Trend + Technical Agent      | langchain.agent                            | Combines trend and technical analysis     | Edit Fields1, Think2, OpenRouter Chat Model2 | -                     |                                 |
| Call trend + technical Agent | langchain.toolWorkflow                     | Invokes MAIN AGENT for trend+technical    | -                               | MAIN AGENT                   |                                 |
| Think2                      | langchain.toolThink                        | Secondary AI processing                     | -                               | Trend + Technical Agent      |                                 |
| OpenRouter Chat Model2       | langchain.lmChatOpenRouter                 | AI model for chat in trend+technical agent | -                               | Trend + Technical Agent      |                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Input Triggers:**  
   - Add Gmail Trigger node, configure with Gmail OAuth2 credentials to listen for new emails.  
   - Add Slack Trigger node, connect Slack OAuth2 and configure relevant events.  
   - Add Telegram Trigger node, enter Telegram Bot API token.  
   - Add "When chat message received" LangChain Chat Trigger node.  
   - Optionally add WhatsApp Trigger but disable it if not used.  
   - Connect all triggers to a single Set node named "Set message variable" to normalize incoming message content.

2. **Set up AI Context Nodes:**  
   - Add LangChain Think tool node named "Think" connected to "Set message variable".  
   - Add LangChain OpenRouter Chat Model node "Grok 4" connected to "Set message variable".  
   - Add LangChain Agent node "MAIN AGENT" receiving inputs from "Think", "Grok 4", and HTTP request nodes (sectors, industries, ranking).  
   - Configure LangChain Vector Store nodes ("Supabase Vector Store" and "Supabase Vector Store1") for your Supabase instance with appropriate API keys and database info.  
   - Add OpenAI Embeddings nodes connected to document loaders and text splitters.  
   - Add Cohere Reranker node connected to one of the Supabase Vector Stores.  
   - Add Recursive Character Text Splitter and Default Data Loader nodes for document preprocessing.

3. **Configure Financial Data Retrieval:**  
   - Create a Set node "Set Stock Symbol and API Key" with variables for stock symbol and API keys for financial APIs.  
   - Add HTTP Request nodes: "Get Price History", "Get Bollinger Bands", and "Get MACD" connected from the Set node, configured with appropriate API URLs and query parameters.  
   - Add HTTP Request nodes for "sectors", "industries", and "ranking" metadata with relevant API endpoints.

4. **Build Technical and Trend Analysis Sub-Workflows:**  
   - Create LangChain Tool Workflow nodes "Technical Analysis Tool1" and "Trends Analysis Tool1" linking to respective sub-workflows for detailed analysis.  
   - Add LangChain Agent "Trend + Technical Agent" to combine and manage these analyses.  
   - Add nodes "Edit Fields" and "Edit Fields1" to format data for these agents.  
   - Add LangChain Think tool "Think2" and OpenRouter Chat Model "OpenRouter Chat Model2" to assist the Trend + Technical Agent.

5. **Aggregate and Format Data:**  
   - Add Merge nodes "Merge" and "Merge-2" to combine data streams from technical indicators, news, and AI analysis.  
   - Add Code nodes "Calculate Support Resistance" and "Organizing Data" to compute technical levels and prepare data structures.  
   - Add Code node "Warp as JSON for GPT" to prepare final JSON for GPT processing.  
   - Add a Set node "Set Final Response" to finalize output data.  
   - Add Markdown node "Markdown to HTML" to convert markdown reports to HTML.

6. **Send Final Report:**  
   - Add Gmail node "Send report" configured with Gmail OAuth2 credentials to send the HTML report to recipients.

7. **Connect all nodes according to the flow:**  
   - From triggers to message variable, to AI processing, to data retrieval, to analysis, to aggregation, and finally to report sending.

8. **Credential Setup:**  
   - Configure credentials for Gmail, Slack, Telegram, OpenAI, Cohere, Supabase, and financial data APIs (Alpha Vantage, TwelveData).  
   - Ensure API rate limits and key permissions are valid.

9. **Sub-workflow Setup:**  
   - Implement "Technical Analysis" and "Trends Analysis" sub-workflows as separate n8n workflows that accept input parameters such as stock data and return analysis results.  
   - Define input/output expectations clearly for integration with the main workflow.

---

### 5. General Notes & Resources

| Note Content                                                                                       | Context or Link                                                                                      |
|--------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Workflow uses multiple AI platforms: OpenAI, Cohere, and OpenRouter for enhanced language models | n8n nodes: langchain.embeddingsOpenAi, langchain.rerankerCohere, langchain.lmChatOpenRouter          |
| Supabase vector stores are used for semantic document retrieval and context enrichment             | Supabase Vector Store nodes with embeddings and reranker integration                               |
| Financial data is sourced using APIs like Alpha Vantage and TwelveData                             | HTTP Request nodes "Get Price History", "Get Bollinger Bands", "Get MACD"                           |
| Final reports are formatted in Markdown and converted to HTML for email delivery                   | Markdown to HTML node before Gmail send                                                           |
| Slack, Telegram, Gmail triggers allow flexible input channels for user requests                    | Multi-platform input reception ensures extensibility                                              |
| Disabled WhatsApp trigger is present for possible future use                                       | Can be enabled and configured if WhatsApp integration is required                                 |

---

This structured document provides a comprehensive reference for the AI-Powered Stock Analysis workflow, enabling reproduction, troubleshooting, and further enhancement by advanced users and automation agents alike.

---

*Disclaimer:* The provided content is exclusively derived from an automated n8n workflow. It complies strictly with applicable content policies and contains no illegal, offensive, or protected elements. All processed data is legal and publicly available.