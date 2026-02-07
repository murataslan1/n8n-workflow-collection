Advanced Multi-Source AI Research with Bright Data, OpenAI, Redis

https://n8nworkflows.xyz/workflows/advanced-multi-source-ai-research-with-bright-data--openai--redis-10349


# Advanced Multi-Source AI Research with Bright Data, OpenAI, Redis

### 1. Workflow Overview

This workflow implements an advanced AI-powered multi-source research system that accepts natural language queries and returns comprehensive, structured research summaries. It is designed for enterprise-grade web research use cases involving complex queries that require decomposition, multi-source search, parallel data scraping, AI-driven data extraction, source validation, aggregation, and multi-channel output notifications. The logical flow is organized into five main blocks:

- **1.1 Input Handling and Caching**: Receives incoming webhook requests, sets operational variables, checks Redis cache for existing results, and returns cached data if available to optimize efficiency.

- **1.2 Query Decomposition and Optimization**: Applies rate limiting, uses AI to analyze query complexity, breaks down complex queries into sub-queries, and optimizes each sub-query for search relevance with contextual enhancements.

- **1.3 Multi-Source Search and Parallel Scraping**: Executes AI-driven search for top credible URLs using Bright Data MCP Tool, splits URLs for parallel scraping of structured content, focusing on authoritative sources.

- **1.4 Data Extraction, Validation, and Synthesis**: Extracts structured information (facts, entities, sentiment) from scraped data using AI, validates source credibility, filters valid sources, aggregates results, and generates a comprehensive summary with confidence scoring.

- **1.5 Output and Notifications**: Caches final summary, prepares webhook responses, sends Slack notifications and email reports, and logs results in a data table for tracking and auditing.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Input Handling and Caching

**Overview:**  
This block handles incoming HTTP POST requests via webhook, extracts and sets essential variables (such as prompt, source, language, cache key, and request ID), checks Redis cache for precomputed results, and returns cached results immediately if found to reduce redundant processing.

**Nodes Involved:**  
- Webhook Entry  
- Set Variables  
- Cache Check (Redis)  
- Check Cache Hit (If)  
- Return Cached Result (respond to webhook)  
- Log Cache Hit (Data Table)

**Node Details:**  

- **Webhook Entry**  
  - Type: Webhook  
  - Role: Entry point to receive external requests with HTTP POST method at path `/advanced-brightdata-search`.  
  - Auth: Header authentication via configured credentials.  
  - Input: HTTP request body expected with JSON including `prompt`, `source`, `language`, `notifyEmail`.  
  - Output: Forwards to Set Variables node.  
  - Edge Cases: Authentication failure, malformed requests.

- **Set Variables**  
  - Type: Set  
  - Role: Assigns workflow variables from webhook body, including:  
    - `userPrompt`: from `source` field  
    - `cellReference`: from `prompt` field  
    - `outputLanguage`: from `language` or defaults to "English"  
    - `cacheKey`: MD5 hash of concatenated `prompt` + `source` for caching  
    - `requestId`: Timestamp + random hex for request tracking  
  - Input: Webhook JSON  
  - Output: To Cache Check node.  
  - Edge Cases: Missing fields defaulting.

- **Cache Check**  
  - Type: Redis node  
  - Role: Checks Redis cache for existing results keyed by `cacheKey`.  
  - Input: `cacheKey` from Set Variables.  
  - Output: To Check Cache Hit.  
  - Edge Cases: Redis connection errors, cache miss.

- **Check Cache Hit**  
  - Type: If node  
  - Role: Determines if cache hit occurred by checking if Redis returned a value.  
  - Input: Redis node output.  
  - Outputs:  
    - True branch: Return Cached Result and Log Cache Hit.  
    - False branch: Proceed to Rate Limit Check.  
  - Edge Cases: Expression evaluation failure.

- **Return Cached Result**  
  - Type: Respond to Webhook  
  - Role: Returns cached JSON response immediately with HTTP header `X-Cache: HIT`.  
  - Input: Cached JSON string parsed.  
  - Edge Cases: Malformed cached data.

- **Log Cache Hit**  
  - Type: Data Table  
  - Role: Logs cache hit event for monitoring.  
  - Input: Cache hit context.

---

#### 1.2 Query Decomposition and Optimization

**Overview:**  
This block enforces rate limiting, analyzes query complexity with AI, breaks down complex queries into sub-queries, and optimizes each sub-query for relevance using AI agents.

**Nodes Involved:**  
- Rate Limit Check (Code)  
- Multi-Step Reasoning Agent (LangChain Agent)  
- GPT-4o (Reasoning)  
- Reasoning Output Parser  
- Split Sub-Queries  
- Query Optimizer Agent (LangChain Agent)  
- GPT-4o Mini (Optimizer)  
- Optimizer Output Parser

**Node Details:**  

- **Rate Limit Check**  
  - Type: Code  
  - Role: Implements per-minute rate limiting (max 60 requests/min) using Redis increment and expiration keys keyed by minute.  
  - Input: From Check Cache Hit false branch.  
  - Output: To Multi-Step Reasoning Agent.  
  - Edge Cases: Redis connectivity failures, concurrency issues.

- **Multi-Step Reasoning Agent**  
  - Type: LangChain Agent  
  - Role: Uses GPT-4o model to analyze if the query is complex and needs decomposition into sub-queries (2-5).  
  - Prompt: Includes user prompt and context, instructs logical breakdown.  
  - Input: Rate Limit Check output variables.  
  - Output: JSON with `isComplex`, `subQueries`, `reasoning`.  
  - Edge Cases: AI model latency or errors, parsing errors.

- **GPT-4o (Reasoning)**  
  - Type: Language Model (OpenAI GPT-4o)  
  - Role: Provides model backbone for reasoning agent.  
  - Configuration: Temperature 0.3 for moderate creativity.  
  - Input: Text from Multi-Step Reasoning Agent.  
  - Output: To Reasoning Output Parser.

- **Reasoning Output Parser**  
  - Type: Structured Output Parser  
  - Role: Parses AI JSON output into structured data.  
  - Edge Cases: Malformed JSON output.

- **Split Sub-Queries**  
  - Type: SplitOut  
  - Role: Splits array of sub-queries for parallel processing.  
  - Input: Parsed reasoning output.  
  - Output: To Query Optimizer Agent.

- **Query Optimizer Agent**  
  - Type: LangChain Agent  
  - Role: Optimizes each sub-query for search relevance, adding keywords, temporal context, synonyms.  
  - Prompt: Includes original context, target language, and current date.  
  - Output: JSON with optimized queries and metadata.  
  - Edge Cases: AI errors, parsing failures.

- **GPT-4o Mini (Optimizer)**  
  - Type: Language Model (OpenAI GPT-4o-mini)  
  - Role: Provides efficient optimization model with low temperature 0.1.  
  - Input: Query optimizer prompts.  
  - Output: To Optimizer Output Parser.

- **Optimizer Output Parser**  
  - Type: Structured Output Parser  
  - Role: Parses optimized query JSON.  
  - Edge Cases: Parsing errors.

---

#### 1.3 Multi-Source Search and Parallel Scraping

**Overview:**  
This block performs authoritative multi-source search for top 5 URLs using Bright Data MCP Tool, splits URLs for parallel web scraping, and extracts markdown-formatted content from sources.

**Nodes Involved:**  
- Multi-Source Search Agent (LangChain Agent)  
- Bright Data MCP Tool  
- GPT-4o (Search)  
- Search Output Parser  
- Split URLs for Parallel Scraping  
- Parallel Web Scraping (HTTP Request)

**Node Details:**  

- **Multi-Source Search Agent**  
  - Type: LangChain Agent  
  - Role: Searches for 5 highly credible URLs based on optimized query, country, and expected source types.  
  - Prompt: Specifies priority and avoidance criteria for sources.  
  - Output: JSON with array of 5 URLs including metadata (title, sourceType, credibilityScore).  
  - Edge Cases: AI search errors, incomplete results.

- **Bright Data MCP Tool**  
  - Type: MCP Client Tool (Bright Data)  
  - Role: Provides search engine integration via Bright Data MCP with a timeout of 120s.  
  - Configuration: Uses `search_engine` tool in MCP with API token placeholder.  
  - Edge Cases: API token invalid, network issues.

- **GPT-4o (Search)**  
  - Type: Language Model (OpenAI GPT-4o)  
  - Role: Supports Multi-Source Search Agent with GPT-4o model.  
  - Edge Cases: API errors, throttling.

- **Search Output Parser**  
  - Type: Structured Output Parser  
  - Role: Parses search results JSON to extract links array.  
  - Edge Cases: Malformed search results.

- **Split URLs for Parallel Scraping**  
  - Type: SplitOut  
  - Role: Splits 5 URLs for concurrent scraping.  
  - Edge Cases: None.

- **Parallel Web Scraping**  
  - Type: HTTP Request  
  - Role: Sends POST requests to Bright Data API to scrape each URL content in markdown format.  
  - Configuration:  
    - Zone: `mcp_unlocker`  
    - Country: from query optimizer suggested country  
    - Authorization: Bearer token placeholder  
    - Timeout: 30 seconds, batch size 5 for concurrency  
  - Output: Scraped content for further extraction.  
  - Edge Cases: API failures, timeouts, blocked requests.

---

#### 1.4 Data Extraction, Validation, and Synthesis

**Overview:**  
This block extracts structured data from scraped content, validates source credibility, filters valid sources, aggregates all extracted data, and synthesizes a comprehensive summary using AI.

**Nodes Involved:**  
- Advanced Data Extraction & Analysis (LangChain Chain LLM)  
- GPT-4o (Extraction)  
- Extraction Output Parser  
- Source Validation Agent (LangChain Agent)  
- GPT-4o Mini (Validation)  
- Validation Output Parser  
- Filter Valid Sources (If)  
- Aggregate All Results  
- Smart Summarizer with Context (LangChain Agent)  
- GPT-4o (Summarizer)  
- Summary Output Parser

**Node Details:**  

- **Advanced Data Extraction & Analysis**  
  - Type: LangChain Chain LLM  
  - Role: Extracts answer, key facts, entities, sentiment, data tables, quotes, dates, and relevance score from scraped markdown content.  
  - Prompt: Detailed instructions to ensure precision, no hallucination, translation if needed.  
  - Input: Scraped content, source metadata, original query.  
  - Edge Cases: AI output errors, parsing issues.

- **GPT-4o (Extraction)**  
  - Type: Language Model (OpenAI GPT-4o)  
  - Role: Extracts structured data from text.  
  - Output: Parsed by Extraction Output Parser.

- **Extraction Output Parser**  
  - Type: Structured Output Parser  
  - Role: Parses extraction JSON.

- **Source Validation Agent**  
  - Type: LangChain Agent  
  - Role: Validates source credibility, consistency, flags red flags, and recommends inclusion.  
  - Input: Extracted data and source metadata.  
  - Output: JSON with validity, trust level, flags, and inclusion boolean.  
  - Edge Cases: AI errors.

- **GPT-4o Mini (Validation)**  
  - Type: Language Model (OpenAI GPT-4o-mini)  
  - Role: Provides efficient validation model.

- **Validation Output Parser**  
  - Type: Structured Output Parser  
  - Role: Parses validation results.

- **Filter Valid Sources**  
  - Type: If node  
  - Role: Filters only sources marked with `"shouldInclude": true`.  
  - Output: To Aggregate All Results.

- **Aggregate All Results**  
  - Type: Aggregate  
  - Role: Aggregates all valid extracted data into one composite dataset.

- **Smart Summarizer with Context**  
  - Type: LangChain Agent  
  - Role: Synthesizes aggregated data into a concise, confidence-scored summary answering the original query, noting consensus and conflicts.  
  - Input: Aggregated extracted data, user variables.  
  - Output: JSON summary.

- **GPT-4o (Summarizer)**  
  - Type: Language Model  
  - Role: Underlying model for summarization with temperature 0.3.

- **Summary Output Parser**  
  - Type: Structured Output Parser  
  - Role: Parses final summary output.

---

#### 1.5 Output and Notifications

**Overview:**  
This block caches the final summary result with TTL, prepares formatted outputs for webhook response, Slack notification, and email report, and logs the final result to a data table.

**Nodes Involved:**  
- Store in Cache (Redis)  
- Prepare Outputs (Set)  
- Respond to Webhook  
- Send Slack Notification  
- Send Email Report  
- Log to DataTable

**Node Details:**  

- **Store in Cache**  
  - Type: Redis node  
  - Role: Stores final JSON summary result with 1-hour TTL keyed by cacheKey.  
  - Edge Cases: Redis failures.

- **Prepare Outputs**  
  - Type: Set  
  - Role: Constructs multiple outputs:  
    - `webhookResponse`: main answer text  
    - `slackMessage`: formatted Slack message with key info and request ID  
    - `emailSubject` and `emailBody`: HTML formatted email content including detailed results  
  - Input: Summary output JSON.

- **Respond to Webhook**  
  - Type: Respond to Webhook  
  - Role: Sends final answer to original requester with content-type `text/plain; charset=utf-8`.  

- **Send Slack Notification**  
  - Type: Slack  
  - Role: Sends Slack message to configured channel.  
  - On error: continues workflow.

- **Send Email Report**  
  - Type: Email Send  
  - Role: Sends detailed email report to user-provided or default email.  
  - From: noreply@yourdomain.com  
  - On error: continues workflow.

- **Log to DataTable**  
  - Type: Data Table  
  - Role: Appends final summary and metadata to configured n8n DataTable for logging and audit.  
  - On error: continues workflow.

---

### 3. Summary Table

| Node Name                    | Node Type                         | Functional Role                                    | Input Node(s)               | Output Node(s)                               | Sticky Note                                                                                                                        |
|------------------------------|----------------------------------|--------------------------------------------------|-----------------------------|----------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| Webhook Entry                | Webhook                          | Entry point, receives HTTP POST requests          |                             | Set Variables                                | # Input Handling and Caching: Receives webhook request, sets variables, checks cache                                               |
| Set Variables                | Set                              | Assigns variables from request body               | Webhook Entry               | Cache Check                                  | # Input Handling and Caching                                                                                                      |
| Cache Check                 | Redis                            | Checks for cached result in Redis                  | Set Variables               | Check Cache Hit                              | # Input Handling and Caching                                                                                                      |
| Check Cache Hit             | If                               | Determines if cached result exists                  | Cache Check                 | Return Cached Result, Log Cache Hit, Rate Limit Check | # Input Handling and Caching                                                                                                      |
| Return Cached Result        | Respond to Webhook                | Returns cached response immediately                 | Check Cache Hit (true)      |                                              | # Input Handling and Caching                                                                                                      |
| Log Cache Hit               | Data Table                       | Logs cache hits                                    | Check Cache Hit (true)      |                                              | # Input Handling and Caching                                                                                                      |
| Rate Limit Check            | Code                             | Implements 60 requests/minute rate limiting        | Check Cache Hit (false)     | Multi-Step Reasoning Agent                   | # Query Decomposition and Optimization                                                                                           |
| Multi-Step Reasoning Agent  | LangChain Agent                  | Analyzes query complexity, breaks into sub-queries| Rate Limit Check            | Split Sub-Queries                            | # Query Decomposition and Optimization                                                                                           |
| GPT-4o (Reasoning)          | Language Model (OpenAI GPT-4o)   | AI model for reasoning                             | Multi-Step Reasoning Agent  | Reasoning Output Parser                      | # Query Decomposition and Optimization                                                                                           |
| Reasoning Output Parser     | Output Parser                    | Parses reasoning agent output                      | GPT-4o (Reasoning)          | Split Sub-Queries                            | # Query Decomposition and Optimization                                                                                           |
| Split Sub-Queries           | SplitOut                        | Splits array of sub-queries for parallel optimization| Reasoning Output Parser  | Query Optimizer Agent                        | # Query Decomposition and Optimization                                                                                           |
| Query Optimizer Agent       | LangChain Agent                  | Optimizes sub-queries for search                   | Split Sub-Queries           | Multi-Source Search Agent                    | # Query Decomposition and Optimization                                                                                           |
| GPT-4o Mini (Optimizer)     | Language Model (GPT-4o-mini)     | AI model for query optimization                    | Query Optimizer Agent       | Optimizer Output Parser                      | # Query Decomposition and Optimization                                                                                           |
| Optimizer Output Parser     | Output Parser                    | Parses optimized query output                       | GPT-4o Mini (Optimizer)     | Multi-Source Search Agent                    | # Query Decomposition and Optimization                                                                                           |
| Multi-Source Search Agent   | LangChain Agent                  | Searches top 5 relevant URLs                        | Query Optimizer Agent       | Split URLs for Parallel Scraping             | # Multi-Source Search and Scraping                                                                                              |
| Bright Data MCP Tool        | MCP Tool                        | Integrates Bright Data search engine                | Multi-Source Search Agent   |                                              | # Multi-Source Search and Scraping                                                                                              |
| GPT-4o (Search)             | Language Model (OpenAI GPT-4o)   | AI model for search agent                           | Multi-Source Search Agent   | Search Output Parser                         | # Multi-Source Search and Scraping                                                                                              |
| Search Output Parser        | Output Parser                    | Parses search agent output                          | GPT-4o (Search)             | Split URLs for Parallel Scraping             | # Multi-Source Search and Scraping                                                                                              |
| Split URLs for Parallel Scraping | SplitOut                  | Splits URLs for concurrent scraping                | Multi-Source Search Agent   | Parallel Web Scraping                        | # Multi-Source Search and Scraping                                                                                              |
| Parallel Web Scraping       | HTTP Request                    | Scrapes content from URLs in parallel               | Split URLs for Parallel Scraping | Advanced Data Extraction & Analysis       | # Multi-Source Search and Scraping                                                                                              |
| Advanced Data Extraction & Analysis | LangChain Chain LLM        | Extracts structured info from scraped content      | Parallel Web Scraping       | Source Validation Agent                      | # Data Extraction, Validation, and Synthesis                                                                                     |
| GPT-4o (Extraction)          | Language Model (OpenAI GPT-4o)   | AI model for data extraction                        | Advanced Data Extraction & Analysis | Extraction Output Parser                  | # Data Extraction, Validation, and Synthesis                                                                                     |
| Extraction Output Parser    | Output Parser                    | Parses extraction AI output                         | GPT-4o (Extraction)         | Source Validation Agent                      | # Data Extraction, Validation, and Synthesis                                                                                     |
| Source Validation Agent     | LangChain Agent                  | Validates source credibility and consistency       | Advanced Data Extraction & Analysis | Filter Valid Sources                      | # Data Extraction, Validation, and Synthesis                                                                                     |
| GPT-4o Mini (Validation)   | Language Model (GPT-4o-mini)     | AI model for source validation                      | Source Validation Agent     | Validation Output Parser                     | # Data Extraction, Validation, and Synthesis                                                                                     |
| Validation Output Parser   | Output Parser                    | Parses validation results                           | GPT-4o Mini (Validation)    | Filter Valid Sources                         | # Data Extraction, Validation, and Synthesis                                                                                     |
| Filter Valid Sources       | If                               | Filters sources based on validation                 | Source Validation Agent     | Aggregate All Results                        | # Data Extraction, Validation, and Synthesis                                                                                     |
| Aggregate All Results      | Aggregate                       | Aggregates data from all valid sources              | Filter Valid Sources        | Smart Summarizer with Context                | # Data Extraction, Validation, and Synthesis                                                                                     |
| Smart Summarizer with Context | LangChain Agent              | Synthesizes aggregated data into final summary     | Aggregate All Results       | Store in Cache                              | # Data Extraction, Validation, and Synthesis                                                                                     |
| GPT-4o (Summarizer)        | Language Model (OpenAI GPT-4o)   | AI model for summary generation                     | Smart Summarizer with Context | Summary Output Parser                      | # Data Extraction, Validation, and Synthesis                                                                                     |
| Summary Output Parser      | Output Parser                    | Parses final summary output                          | GPT-4o (Summarizer)         | Store in Cache                              | # Data Extraction, Validation, and Synthesis                                                                                     |
| Store in Cache             | Redis                            | Caches final summary result for 1 hour              | Smart Summarizer with Context | Prepare Outputs                           | # Output and Notifications                                                                                                       |
| Prepare Outputs            | Set                              | Prepares webhook, Slack, email, and log outputs    | Store in Cache              | Respond to Webhook, Send Slack Notification, Send Email Report, Log to DataTable | # Output and Notifications                                                                                                       |
| Respond to Webhook         | Respond to Webhook               | Sends final answer to webhook request               | Prepare Outputs             |                                              | # Output and Notifications                                                                                                       |
| Send Slack Notification    | Slack                            | Sends notification message to Slack                 | Prepare Outputs             |                                              | # Output and Notifications                                                                                                       |
| Send Email Report          | Email Send                      | Sends detailed email report                          | Prepare Outputs             |                                              | # Output and Notifications                                                                                                       |
| Log to DataTable           | Data Table                      | Logs final results for audit                         | Prepare Outputs             |                                              | # Output and Notifications                                                                                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Entry Node**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `advanced-brightdata-search`  
   - Authentication: Header Auth with configured credentials  
   - Purpose: Receive query requests with JSON body including `prompt`, `source`, `language`, `notifyEmail`.

2. **Add Set Variables Node**  
   - Extract and assign:  
     - `userPrompt`: from JSON `body.source`  
     - `cellReference`: from JSON `body.prompt`  
     - `outputLanguage`: from `body.language` or default `"English"`  
     - `cacheKey`: MD5 hash of `prompt + source` using `$crypto.createHash('md5')`  
     - `requestId`: Current timestamp + random hex string  
   - Connect Webhook Entry → Set Variables.

3. **Add Redis Cache Check Node**  
   - Operation: `get`  
   - Key: `{{$json.cacheKey}}`  
   - Connect Set Variables → Cache Check.

4. **Add If Node: Check Cache Hit**  
   - Condition: Check if `$('Cache Check').item.json.value` exists (non-empty).  
   - True branch: Connect to Return Cached Result and Log Cache Hit.  
   - False branch: Connect to Rate Limit Check.

5. **Add Respond to Webhook Node (Return Cached Result)**  
   - Response headers: `X-Cache: HIT`  
   - Body: Parse cached JSON string.  
   - Connect If True branch → Respond to Webhook.

6. **Add Data Table Node (Log Cache Hit)**  
   - Append operation, configured DataTable ID for logging.  
   - Connect If True branch → Log Cache Hit.

7. **Add Code Node (Rate Limit Check)**  
   - Implement Redis-based rate limiting (max 60 requests per minute).  
   - Use `ioredis` with credentials.  
   - Throw error if rate exceeded.  
   - Connect If False branch → Rate Limit Check.

8. **Add Multi-Step Reasoning Agent (LangChain Agent)**  
   - Model: GPT-4o  
   - Prompt: Analyze if query complex, break into sub-queries or return as-is.  
   - Connect Rate Limit Check → Multi-Step Reasoning Agent.

9. **Add GPT-4o Node (Reasoning Model)**  
   - Model: GPT-4o  
   - Temperature: 0.3  
   - Connect to Multi-Step Reasoning Agent.

10. **Add Output Parser Node (Reasoning Output Parser)**  
    - Configure JSON schema for reasoning output.  
    - Connect GPT-4o Reasoning → Reasoning Output Parser.

11. **Add SplitOut Node (Split Sub-Queries)**  
    - Splits array of sub-queries for parallel processing.  
    - Connect Reasoning Output Parser → Split Sub-Queries.

12. **Add Query Optimizer Agent (LangChain Agent)**  
    - Model: GPT-4o-mini  
    - Prompt: Optimize sub-query for relevancy, keywords, temporal context.  
    - Temperature: 0.1  
    - Connect Split Sub-Queries → Query Optimizer Agent.

13. **Add Output Parser Node (Optimizer Output Parser)**  
    - Parses optimized query results.  
    - Connect GPT-4o Mini (Optimizer) → Optimizer Output Parser.

14. **Add Multi-Source Search Agent (LangChain Agent)**  
    - Model: GPT-4o  
    - Uses Bright Data MCP Tool for search.  
    - Prompt: Find top 5 credible URLs based on optimized query, country, source types.  
    - Connect Optimizer Output Parser → Multi-Source Search Agent.

15. **Add Bright Data MCP Tool Node**  
    - Endpoint URL with valid Bright Data token.  
    - Include tool: `search_engine`.  
    - Timeout: 120000 ms.  
    - Connect to Multi-Source Search Agent.

16. **Add GPT-4o Node (Search Model)**  
    - Model: GPT-4o  
    - Connect to Multi-Source Search Agent.

17. **Add Output Parser Node (Search Output Parser)**  
    - Parses search results JSON (5 URLs).  
    - Connect GPT-4o Search → Search Output Parser.

18. **Add SplitOut Node (Split URLs for Parallel Scraping)**  
    - Splits 5 URLs for parallel scraping.  
    - Connect Multi-Source Search Agent → Split URLs for Parallel Scraping.

19. **Add HTTP Request Node (Parallel Web Scraping)**  
    - POST to Bright Data API `https://api.brightdata.com/request`  
    - Body parameters: zone `mcp_unlocker`, URL from split, format `json`, method `GET`, country from Query Optimizer, data_format `markdown`  
    - Headers: Authorization Bearer token  
    - Batch size: 5  
    - Timeout: 30000 ms  
    - Connect Split URLs for Parallel Scraping → Parallel Web Scraping.

20. **Add Advanced Data Extraction & Analysis (LangChain Chain LLM)**  
    - Model: GPT-4o  
    - Prompt: Extract structured data (answer, facts, entities, sentiment, tables, quotes, dates).  
    - Connect Parallel Web Scraping → Advanced Data Extraction & Analysis.

21. **Add Output Parser Node (Extraction Output Parser)**  
    - Parses extraction JSON output.  
    - Connect GPT-4o Extraction → Extraction Output Parser.

22. **Add Source Validation Agent (LangChain Agent)**  
    - Model: GPT-4o-mini  
    - Prompt: Validate source credibility, consistency, red flags.  
    - Connect Advanced Data Extraction & Analysis → Source Validation Agent.

23. **Add Output Parser Node (Validation Output Parser)**  
    - Parses validation result JSON.  
    - Connect GPT-4o Mini Validation → Validation Output Parser.

24. **Add If Node (Filter Valid Sources)**  
    - Condition: `shouldInclude` is true.  
    - Connect Source Validation Agent → Filter Valid Sources.

25. **Add Aggregate Node (Aggregate All Results)**  
    - Aggregates all valid extracted data.  
    - Connect Filter Valid Sources → Aggregate All Results.

26. **Add Smart Summarizer with Context (LangChain Agent)**  
    - Model: GPT-4o  
    - Prompt: Synthesize aggregated data into concise summary, highlight consensus and conflicts, produce confidence score.  
    - Connect Aggregate All Results → Smart Summarizer with Context.

27. **Add Output Parser Node (Summary Output Parser)**  
    - Parses final summary JSON.  
    - Connect GPT-4o Summarizer → Summary Output Parser.

28. **Add Redis Node (Store in Cache)**  
    - Operation: `set` with TTL 3600 seconds (1 hour)  
    - Key: cacheKey  
    - Value: JSON.stringify(summary output)  
    - Connect Smart Summarizer with Context → Store in Cache.

29. **Add Set Node (Prepare Outputs)**  
    - Prepare multiple response formats: webhookResponse, slackMessage, emailSubject, emailBody with variables and formatted HTML/Markdown.  
    - Connect Store in Cache → Prepare Outputs.

30. **Add Respond to Webhook Node (Final Response)**  
    - Response headers: Content-Type `text/plain; charset=utf-8`  
    - Body: webhookResponse from Prepare Outputs.  
    - Connect Prepare Outputs → Respond to Webhook.

31. **Add Slack Node (Send Slack Notification)**  
    - Text: slackMessage from Prepare Outputs.  
    - Connect Prepare Outputs → Send Slack Notification.

32. **Add Email Send Node (Send Email Report)**  
    - Subject: emailSubject from Prepare Outputs.  
    - To: from webhook notifyEmail or default.  
    - From: noreply@yourdomain.com.  
    - Body: emailBody (HTML).  
    - Connect Prepare Outputs → Send Email Report.

33. **Add Data Table Node (Log to DataTable)**  
    - Append operation for logging final results.  
    - Connect Prepare Outputs → Log to DataTable.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                  | Context or Link                                                                                                                                                                           |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Workflow created by [Daniel Shashko](https://linkedin.com/in/daniel-shashko)**. Enterprise-grade AI web research system combining GPT-4o, Redis caching, Bright Data search and scraping, multi-source validation, and multi-channel notification.                                                                                                                                           | Author credit and workflow description.                                                                                                                                                   |
| This workflow is designed to accompany a [Google Apps Script integration](https://gist.github.com/danishashko/fb509b733aebf5538676ca80b19fa28b) for seamless Google Sheets usage.                                                                                                                                                                                                             | Companion file for Google Sheets integration.                                                                                                                                            |
| API Input JSON format example: `{"prompt":"Your question here","source":"context or cell reference","language":"English","notifyEmail":"user@domain.com"}`. Response includes main answer (≤400 chars), confidence score, key insights, entities, extended summary, and data highlights.                                                                                                                | Input and output data format specification for API clients.                                                                                                                              |
| The Redis cache uses a 1-hour TTL for caching results based on an MD5 hash of the combined prompt and source to ensure identical queries reuse previous computations. Rate limiting is enforced at 60 requests per minute to prevent overloading.                                                                                                                                               | Performance and rate limiting design notes.                                                                                                                                               |
| Bright Data API tokens must be configured securely in HTTP Request and MCP Tool nodes to enable web search and scraping functionalities.                                                                                                                                                                                                                                                     | Integration requirements for Bright Data API usage.                                                                                                                                        |
| AI models used include GPT-4o for reasoning, search, extraction, summarization; GPT-4o-mini for optimization and validation, balancing cost and performance.                                                                                                                                                                                                                                   | AI model usage notes.                                                                                                                                                                      |
| Output is sent via webhook response, Slack notifications, email reports, and logged to n8n DataTable for auditing. Errors in notification nodes are set to continue workflow without interruption.                                                                                                                                                                                              | Multi-channel output and error handling.                                                                                                                                                   |

---

**Disclaimer:**  
The content provided here is exclusively derived from an automated workflow created with n8n, respecting all applicable content policies. No illegal, offensive, or protected elements are included. All data processed is legal and public.