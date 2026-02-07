AI-Powered Multi-Stage Web Search and Research Suite

https://n8nworkflows.xyz/workflows/ai-powered-multi-stage-web-search-and-research-suite-2539


# AI-Powered Multi-Stage Web Search and Research Suite

---
### 1. Workflow Overview

This workflow, titled **“AI-Powered Multi-Stage Web Search and Research Suite”**, is designed to intelligently process expert-level user research queries by generating refined web search queries, performing multi-layered web searches, ranking and extracting relevant information from search results, and synthesizing a detailed, expert-grade research report.

It targets advanced users seeking comprehensive, data-driven insights from the web using AI-powered reasoning and analysis. The workflow incorporates multiple logical blocks to:

- Receive and contextualize user queries
- Emulate expert analytical reasoning to generate optimized search queries
- Perform multi-stage web searches via Brave Search API
- Aggregate and rank search results with AI assistance
- Extract article content from URLs
- Synthesize and produce an APA7-compliant research report
- Respond to the initial requester with the final report

The core logical blocks are:

- **1.1 Input Reception and Initial Context Setup:** Accept user input and capture current date/time for temporal context.
- **1.2 Analyst Emulation and Initial Query Generation:** Use AI to emulate expert meta-reasoning and generate an initial refined search query.
- **1.3 First Web Search and Ranking:** Submit the initial query to Brave Search API, aggregate and rank results using AI.
- **1.4 Follow-up Query Generation and Second Web Search:** Based on initial results, produce a follow-up query, search again, and rank results.
- **1.5 Article Extraction and Webpage Content Aggregation:** Extract article content from top-ranked URLs for detailed analysis.
- **1.6 Research Report Generation:** AI synthesizes a detailed, data-driven research report tailored for expert audiences.
- **1.7 Response Delivery:** Return the final report to the user via the webhook response.

Sticky notes provide setup instructions for API keys (Google Gemini, Brave Search, Article Extractor) and overall workflow guidance.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Initial Context Setup

- **Overview:**  
  This block receives the user’s research question via a webhook and captures the current date and time to provide temporal context for downstream AI reasoning.

- **Nodes Involved:**  
  - Webhook  
  - Date & Time  
  - Date & Time1 (formatting date)

- **Node Details:**

  - **Webhook**  
    - Type: n8n HTTP Webhook node  
    - Role: Entry point accepting user POST requests with a JSON payload containing the research question under `query["Research Question"]`.  
    - Configuration: Path set to a unique webhook ID; response mode set to respond with a node downstream.  
    - Inputs: External HTTP request  
    - Outputs: JSON data with user query  
    - Edge Cases: Invalid or missing query parameters; webhook URL must be public and reachable.

  - **Date & Time**  
    - Type: n8n Date & Time node  
    - Role: Captures current timestamp (`currentDate`)  
    - Configuration: Default current datetime output  
    - Inputs: From Webhook  
    - Outputs: JSON with current datetime  
    - Edge Cases: None significant; system time dependency.

  - **Date & Time1**  
    - Type: n8n Date & Time node  
    - Role: Formats the captured current datetime to a presentable format (`formattedDate`) for AI prompt injection  
    - Configuration: Takes input from Date & Time node and applies formatting  
    - Inputs: From Date & Time node  
    - Outputs: JSON with formatted date string  
    - Edge Cases: Formatting errors rare, ensure valid input.

---

#### 2.2 Analyst Emulation and Initial Query Generation

- **Overview:**  
  This block uses an AI language model to emulate an expert analyst’s multi-chain meta-reasoning process on the user’s question, generating a detailed system prompt and then producing a structured JSON output with a reasoning summary and an optimized initial web search query.

- **Nodes Involved:**  
  - Analyst Emulator (Google Gemini Chat Model)  
  - Query Maker - 1 (Chain LLM)  
  - Auto-fixing Output Parser  
  - Structured Output Parser1  

- **Node Details:**

  - **Analyst Emulator**  
    - Type: Langchain Chain LLM node with Google Gemini model  
    - Role: Generates an advanced system prompt instructing the AI to perform three distinct chains of thought with meta-reasoning on the research question, incorporating current date awareness.  
    - Configuration: Custom prompt text with embedded date and research question variables; uses Google Gemini 1.5 Flash model with moderate temperature and safety settings disabled for blocking.  
    - Inputs: JSON from Date & Time1 and Webhook nodes  
    - Outputs: System prompt text for subsequent chain  
    - Edge Cases: Model API limits, prompt injection issues, date formatting errors.

  - **Query Maker - 1**  
    - Type: Langchain Chain LLM node  
    - Role: Uses the generated prompt to create a structured JSON output containing a meta-reasoning summary and a refined search query optimized for web search (avoiding long-tail queries).  
    - Configuration: Detailed multi-step instructions and examples embedded in prompt; outputs JSON with keys: `reasoning_summary` and `final_search_query`.  
    - Inputs: System prompt from Analyst Emulator, injected date and user question  
    - Outputs: JSON containing reasoning and search query  
    - Edge Cases: Parsing errors if output not valid JSON; token limits.

  - **Auto-fixing Output Parser**  
    - Type: Langchain Output Parser Autofixing  
    - Role: Automatically corrects minor JSON format errors from AI output to ensure valid JSON.  
    - Configuration: Default, no custom options  
    - Inputs: Output from Query Maker - 1  
    - Outputs: Fixed JSON  
    - Edge Cases: Severe format errors may fail.

  - **Structured Output Parser1**  
    - Type: Langchain Structured Output Parser  
    - Role: Enforces output JSON schema for `reasoning_summary` and `final_search_query` fields.  
    - Configuration: JSON schema example provided for validation.  
    - Inputs: From Auto-fixing Output Parser  
    - Outputs: Validated parsed JSON  
    - Edge Cases: Schema mismatch or missing fields.

---

#### 2.3 First Web Search and Ranking

- **Overview:**  
  Using the initial refined query, the workflow performs a Brave web search API call, aggregates top results, and uses AI to rank and analyze them, extracting key relevant information and deciding if a follow-up query is needed.

- **Nodes Involved:**  
  - Query 1 (HTTP Request to Brave Search API)  
  - Query-1 Combined (Code node aggregating results)  
  - Query 1 Ranker & Query 2 Maker (Chain LLM)  
  - Auto-fixing Output Parser6  
  - Structured Output Parser3

- **Node Details:**

  - **Query 1**  
    - Type: HTTP Request  
    - Role: Sends the initial refined search query to Brave Search API  
    - Configuration: URL `https://api.search.brave.com/res/v1/web/search`, query parameter `q` set to `final_search_query` from prior block, header includes `X-Subscription-Token` (user must insert API key)  
    - Inputs: From Query Maker - 1 output  
    - Outputs: JSON search results including titles, URLs, descriptions  
    - Edge Cases: API key missing/invalid, rate limits, network errors.

  - **Query-1 Combined**  
    - Type: Code node  
    - Role: Aggregates title, URL, and description from all results into a single text string for AI consumption  
    - Configuration: Loops over `web.results` array, concatenates info with formatting  
    - Inputs: From Query 1  
    - Outputs: Aggregated text string  
    - Edge Cases: Empty results array, malformed JSON.

  - **Query 1 Ranker & Query 2 Maker**  
    - Type: Chain LLM  
    - Role: AI analyzes aggregated search results, ranks top 3 URLs, extracts relevant information, and generates a follow-up search query if needed based on multi-step reasoning about user intent and result quality  
    - Configuration: Complex prompt instructing multi-step chain of thought, ranking logic, and output JSON format including chain of thought, top URLs, new query, and extracted info  
    - Inputs: Aggregated text from Query-1 Combined, original user query, current date  
    - Outputs: JSON with ranked URLs and new refined query  
    - Edge Cases: AI output format errors, insufficient results, ambiguous ranking.

  - **Auto-fixing Output Parser6 & Structured Output Parser3**  
    - Role: Fixes and validates AI output JSON schema with fields such as `chain_of_thought`, `Highest_RANKEDURL_1..3`, `New_Query`, `Information_extracted`.  
    - Configuration: JSON schema example provided.  
    - Edge Cases: Schema mismatches.

---

#### 2.4 Follow-up Query Generation and Second Web Search

- **Overview:**  
  Performs a secondary Brave search using the AI-generated follow-up query, aggregates and ranks fresh results excluding URLs identified previously, extracting further information for deeper analysis.

- **Nodes Involved:**  
  - Query 2 (HTTP Request to Brave Search API)  
  - Query-2 Combined (Code node aggregating results)  
  - Query 2 - Ranker (Chain LLM)  
  - Auto-fixing Output Parser7  
  - Structured Output Parser4  
  - Code (Code node to aggregate ranked URLs)

- **Node Details:**

  - **Query 2**  
    - Type: HTTP Request  
    - Role: Performs Brave web search API call with new refined query from previous ranking node output  
    - Configuration: Similar to Query 1 with `q` parameter set to `New_Query` from previous node, same API key required  
    - Inputs: From Query 1 Ranker & Query 2 Maker node output  
    - Outputs: JSON search results  
    - Edge Cases: Same as Query 1.

  - **Query-2 Combined**  
    - Type: Code node  
    - Role: Aggregates titles, URLs, and descriptions of Query 2 results into text for AI input  
    - Configuration: Similar to Query-1 Combined  
    - Edge Cases: Empty or malformed results.

  - **Query 2 - Ranker**  
    - Type: Chain LLM  
    - Role: Ranks top 2 URLs from second search results, excluding top 3 URLs from first search to avoid duplication. Extracts relevant info and chains reasoning.  
    - Configuration: Prompt instructs exclusion of previously ranked URLs, output JSON format with chain of thought, top 2 URLs, and information extracted.  
    - Inputs: Aggregated Query 2 text and previous top URLs  
    - Outputs: JSON with ranked URLs and extracted info  
    - Edge Cases: Output parsing errors, insufficient results.

  - **Auto-fixing Output Parser7 & Structured Output Parser4**  
    - Role: Fix and validate JSON output from Query 2 - Ranker  
    - Configured with appropriate JSON schema.

  - **Code**  
    - Type: Code node  
    - Role: Collects all 5 top URLs from both ranking nodes into an array, filtering out nulls, preparing for subsequent content extraction.  
    - Inputs: Outputs from both ranking nodes  
    - Outputs: Array of URL items for looping  
    - Edge Cases: Missing URLs, duplicates.

---

#### 2.5 Article Extraction and Webpage Content Aggregation

- **Overview:**  
  This block extracts the full article content from each of the top-ranked URLs using an article extraction API, aggregates the results, and prepares the data for comprehensive AI analysis.

- **Nodes Involved:**  
  - Loop Over Items (SplitInBatches)  
  - Article Extractor1 (HTTP Request to Article Extraction API)  
  - Delay-to-Avoid-Request-Per-Minute-Cap (Wait node)  
  - Code1 (Code node aggregating extracted content)

- **Node Details:**

  - **Loop Over Items**  
    - Type: SplitInBatches node  
    - Role: Iterates over each URL item individually for extraction, managing rate limits  
    - Inputs: Array of URLs from previous Code node  
    - Outputs: Individual URL items  
    - Edge Cases: Batch size and concurrency must be tuned to avoid API throttling.

  - **Article Extractor1**  
    - Type: HTTP Request  
    - Role: Calls RapidAPI Article Extractor API to parse full article text from URL  
    - Configuration: URL parameter `url` set dynamically from current item; header includes RapidAPI key to be inserted by user  
    - Inputs: From Loop Over Items  
    - Outputs: Parsed article content JSON  
    - Edge Cases: API quota limits, extraction failures if page structure unsupported.

  - **Delay-to-Avoid-Request-Per-Minute-Cap**  
    - Type: Wait node  
    - Role: Inserts a 15-second delay between requests to avoid rate limiting on extraction API  
    - Configuration: Wait 15 seconds per batch  
    - Inputs: From Article Extractor1  
    - Outputs: Passes on data  
    - Edge Cases: Delays add latency; balance between speed and API limits.

  - **Code1**  
    - Type: Code node  
    - Role: Aggregates all extracted article contents into a single concatenated string with metadata (title, URL, description, content) for input to final report generation  
    - Inputs: From Loop Over Items output  
    - Outputs: Single JSON with aggregated text string  
    - Edge Cases: Large text size may approach node output limits.

---

#### 2.6 Research Report Generation

- **Overview:**  
  This AI-powered block synthesizes all collected inputs—including the original question, aggregated search result text, and extracted article content—to generate a comprehensive, APA7-compliant research report tailored for expert audiences.

- **Nodes Involved:**  
  - Research Reporter (Chain LLM Google Gemini)  
  - Google Gemini Chat Model16  
  - Respond to Webhook

- **Node Details:**

  - **Research Reporter**  
    - Type: Chain LLM node with Google Gemini model  
    - Role: Combines all inputs and instructions to produce a detailed research report of at least 500 words, structured with introduction, findings, independent analysis, conclusion, and proper citations.  
    - Configuration: Complex prompt with stepwise instructions for meta-reasoning, data extraction, synthesis, citation formatting, and output style targeting expert readers.  
    - Inputs: Aggregated article text (Code1), extracted info from Query 2 ranker, and original research question  
    - Outputs: Text report (not JSON)  
    - Edge Cases: Model token limits, generation coherence, timely response.

  - **Google Gemini Chat Model16**  
    - Serves as the underlying AI language model for Research Reporter node.

  - **Respond to Webhook**  
    - Type: Respond to Webhook node  
    - Role: Sends the final generated report text as the HTTP response to the original webhook request, completing the workflow interaction  
    - Configuration: Responds with plain text format, using report output from Research Reporter  
    - Inputs: From Research Reporter  
    - Outputs: HTTP response to user  
    - Edge Cases: Network errors, timeout.

---

#### 2.7 Supporting Sticky Notes and Setup Instructions

- **Sticky Note** nodes provide important setup instructions for:

  - Obtaining and configuring **Google Gemini API keys** (free tier limits, access steps).  
  - Registering and using the **Brave Search API key** for web search.  
  - Setting up **Article Extraction API key** on RapidAPI (free tier limits, alternative APIs).  
  - Guidance on using the **Webhook Call node** to integrate this research workflow into other workflows.

- These notes are visually placed near relevant nodes to assist users in proper configuration but do not affect execution.

---

### 3. Summary Table

| Node Name                       | Node Type                             | Functional Role                                               | Input Node(s)                                  | Output Node(s)                                  | Sticky Note                                                                                      |
|--------------------------------|-------------------------------------|--------------------------------------------------------------|------------------------------------------------|------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Webhook                        | n8n-nodes-base.webhook               | Receives user research question                              | External HTTP request                           | Date & Time                                     |                                                                                                 |
| Date & Time                   | n8n-nodes-base.dateTime              | Captures current datetime                                    | Webhook                                         | Date & Time1                                    |                                                                                                 |
| Date & Time1                  | n8n-nodes-base.dateTime              | Formats current datetime for AI prompts                      | Date & Time                                     | Analyst Emulator                                |                                                                                                 |
| Analyst Emulator              | @n8n/n8n-nodes-langchain.chainLlm   | Generates system prompt for meta-reasoning                   | Date & Time1, Webhook                           | Query Maker - 1                                 |                                                                                                 |
| Query Maker - 1              | @n8n/n8n-nodes-langchain.chainLlm   | Generates optimized initial search query                     | Analyst Emulator                                | Auto-fixing Output Parser                        |                                                                                                 |
| Auto-fixing Output Parser     | @n8n/n8n-nodes-langchain.outputParserAutofixing | Fixes JSON formatting errors                                  | Query Maker - 1                                 | Structured Output Parser1                        |                                                                                                 |
| Structured Output Parser1     | @n8n/n8n-nodes-langchain.outputParserStructured | Validates output JSON schema                                  | Auto-fixing Output Parser                        | Query 1                                         |                                                                                                 |
| Query  1                     | n8n-nodes-base.httpRequest          | Executes first Brave web search with initial query           | Structured Output Parser1                        | Query-1 Combined                                | Sticky Note4 (Brave API setup instructions)                                                     |
| Query-1 Combined             | n8n-nodes-base.code                 | Aggregates search results into text for AI input             | Query  1                                         | Query 1 Ranker & Query 2 Maker                  |                                                                                                 |
| Query 1 Ranker & Query 2 Maker | @n8n/n8n-nodes-langchain.chainLlm   | Ranks Query 1 results, extracts info, creates follow-up query | Query-1 Combined, Webhook, Date & Time          | Auto-fixing Output Parser6                       | Sticky Note (Query Makers and Web Result Rankers)                                              |
| Auto-fixing Output Parser6    | @n8n/n8n-nodes-langchain.outputParserAutofixing | Fixes JSON formatting errors                                  | Query 1 Ranker & Query 2 Maker                   | Structured Output Parser3                        |                                                                                                 |
| Structured Output Parser3     | @n8n/n8n-nodes-langchain.outputParserStructured | Validates output JSON schema                                  | Auto-fixing Output Parser6                       | Query 2                                         |                                                                                                 |
| Query 2                      | n8n-nodes-base.httpRequest          | Executes second Brave web search with follow-up query        | Query 1 Ranker & Query 2 Maker                   | Query-2 Combined                                | Sticky Note4 (Brave API setup instructions)                                                     |
| Query-2 Combined             | n8n-nodes-base.code                 | Aggregates second search results into text                    | Query 2                                         | Query 2 - Ranker                                |                                                                                                 |
| Query 2 - Ranker             | @n8n/n8n-nodes-langchain.chainLlm   | Ranks Query 2 results excluding previous top URLs            | Query-2 Combined, Query 1 Ranker & Query 2 Maker | Auto-fixing Output Parser7                       |                                                                                                 |
| Auto-fixing Output Parser7    | @n8n/n8n-nodes-langchain.outputParserAutofixing | Fixes JSON formatting errors                                  | Query 2 - Ranker                                 | Structured Output Parser4                        |                                                                                                 |
| Structured Output Parser4     | @n8n/n8n-nodes-langchain.outputParserStructured | Validates output JSON schema                                  | Auto-fixing Output Parser7                       | Code                                           |                                                                                                 |
| Code                         | n8n-nodes-base.code                 | Aggregates top ranked URLs for article extraction             | Query 1 Ranker & Query 2 Maker, Query 2 - Ranker | Loop Over Items                                 |                                                                                                 |
| Loop Over Items              | n8n-nodes-base.splitInBatches       | Iterates over URLs for article extraction                     | Code                                            | Code1, Article Extractor1                        |                                                                                                 |
| Article Extractor1           | n8n-nodes-base.httpRequest          | Extracts article content from URLs using RapidAPI            | Loop Over Items                                  | Delay-to-Avoid-Request-Per-Minute-Cap           | Sticky Note3 (Article Extraction API setup instructions)                                       |
| Delay-to-Avoid-Request-Per-Minute-Cap | n8n-nodes-base.wait                 | Delays requests to avoid API rate limits                      | Article Extractor1                               | Loop Over Items                                  |                                                                                                 |
| Code1                        | n8n-nodes-base.code                 | Aggregates extracted article content into a single string    | Loop Over Items                                  | Research Reporter                               |                                                                                                 |
| Research Reporter            | @n8n/n8n-nodes-langchain.chainLlm   | Synthesizes detailed expert report from all inputs           | Code1, Query 2 - Ranker, Webhook                 | Google Gemini Chat Model16                        | Sticky Note1 (Research Reporter description)                                                   |
| Google Gemini Chat Model16    | @n8n/n8n-nodes-langchain.lmChatGoogleGemini | AI language model for report generation                        | Research Reporter                                | Respond to Webhook                               | Sticky Note (Query Makers and Web Result Rankers)                                              |
| Respond to Webhook           | n8n-nodes-base.respondToWebhook     | Sends final report text as HTTP response                      | Research Reporter                                | External HTTP response                           | Sticky Note1                                                                                   |
| Sticky Note(s)               | n8n-nodes-base.stickyNote           | Setup instructions and guidance                               | —                                               | —                                               | See individual sticky notes detailed above                                                    |

---

### 4. Reproducing the Workflow from Scratch

To recreate this workflow in n8n, follow these steps:

1. **Create Webhook Node:**
   - Name: `Webhook`
   - Type: `n8n-nodes-base.webhook`
   - Set a unique path (e.g., `962f1468-c80f-4c0c-8555-a0acf648ede4`)
   - Response Mode: `Response Node`
   - Save to generate the webhook URL for external calls.

2. **Add Date & Time Node:**
   - Name: `Date & Time`
   - Type: `n8n-nodes-base.dateTime`
   - Operation: Capture current date/time (default)
   - Connect output from `Webhook` to this node.

3. **Add Date & Time Format Node:**
   - Name: `Date & Time1`
   - Type: `n8n-nodes-base.dateTime`
   - Operation: Format date (e.g., ISO string or desired format)
   - Input: From `Date & Time`

4. **Add Langchain Chain LLM Node for Analyst Emulation:**
   - Name: `Analyst Emulator`
   - Type: `@n8n/n8n-nodes-langchain.chainLlm`
   - Model: Google Gemini 1.5 Flash (`models/gemini-1.5-flash-exp-0827`)
   - Configure prompt text to instruct meta-reasoning with embedded variables:
     - Current Date from `Date & Time1`
     - Research question from `Webhook`
   - Connect input from `Date & Time1` and `Webhook`

5. **Add Chain LLM Node for Initial Query Generation:**
   - Name: `Query Maker - 1`
   - Type: `@n8n/n8n-nodes-langchain.chainLlm`
   - Model: Google Gemini 1.5 Flash
   - Prompt: Detailed instructions to generate multi-chain reasoning and final search query in JSON format.
   - Connect output from `Analyst Emulator`

6. **Add Auto-fixing Output Parser Node:**
   - Name: `Auto-fixing Output Parser`
   - Type: `@n8n/n8n-nodes-langchain.outputParserAutofixing`
   - Connect from `Query Maker - 1`

7. **Add Structured Output Parser Node:**
   - Name: `Structured Output Parser1`
   - Type: `@n8n/n8n-nodes-langchain.outputParserStructured`
   - JSON Schema: For `reasoning_summary` and `final_search_query`
   - Connect from `Auto-fixing Output Parser`

8. **Add HTTP Request Node for First Web Search:**
   - Name: `Query  1`
   - Type: `n8n-nodes-base.httpRequest`
   - URL: `https://api.search.brave.com/res/v1/web/search`
   - Query Parameter `q`: Use expression to get `final_search_query` from `Structured Output Parser1`
   - Headers:
     - `Accept: application/json`
     - `Accept-Encoding: gzip`
     - `X-Subscription-Token: <Insert Your Brave API Key>`
   - Connect from `Structured Output Parser1`

9. **Add Code Node to Aggregate Query 1 Results:**
   - Name: `Query-1 Combined`
   - Type: `n8n-nodes-base.code`
   - Code: Loop over `web.results` to concatenate title, URL, and description into a string
   - Connect from `Query  1`

10. **Add Chain LLM Node to Rank Query 1 Results and Generate Follow-up Query:**
    - Name: `Query 1 Ranker & Query 2 Maker`
    - Type: `@n8n/n8n-nodes-langchain.chainLlm`
    - Model: Google Gemini 1.5 Flash
    - Prompt: Instruct AI to rank top 3 URLs, extract info, create a refined follow-up query, with JSON output
    - Connect from `Query-1 Combined` plus inputs from `Webhook` and `Date & Time`

11. **Add Auto-fixing and Structured Output Parser Nodes:**
    - Name: `Auto-fixing Output Parser6`
    - Name: `Structured Output Parser3`
    - Connect sequentially from `Query 1 Ranker & Query 2 Maker`

12. **Add HTTP Request Node for Second Web Search:**
    - Name: `Query 2`
    - Type: `n8n-nodes-base.httpRequest`
    - URL: `https://api.search.brave.com/res/v1/web/search`
    - Query Parameter `q`: Use expression to get `New_Query` from `Structured Output Parser3`
    - Headers: Same as first search, include Brave API key
    - Connect from `Structured Output Parser3`

13. **Add Code Node to Aggregate Query 2 Results:**
    - Name: `Query-2 Combined`
    - Type: `n8n-nodes-base.code`
    - Similar code as `Query-1 Combined` but for `Query 2`
    - Connect from `Query 2`

14. **Add Chain LLM Node to Rank Query 2 Results:**
    - Name: `Query 2 - Ranker`
    - Type: `@n8n/n8n-nodes-langchain.chainLlm`
    - Model: Google Gemini 1.5 Flash
    - Prompt: Rank top 2 URLs excluding previous top 3 from first search, extract info, output JSON
    - Connect from `Query-2 Combined` and previous ranked URLs

15. **Add Auto-fixing and Structured Output Parser Nodes:**
    - Name: `Auto-fixing Output Parser7`
    - Name: `Structured Output Parser4`
    - Connect sequentially from `Query 2 - Ranker`

16. **Add Code Node to Aggregate All Top URLs:**
    - Name: `Code`
    - Type: `n8n-nodes-base.code`
    - Aggregates 5 URLs from both rankers into an array of items
    - Connect from both `Query 1 Ranker & Query 2 Maker` and `Query 2 - Ranker`

17. **Add SplitInBatches Node to Loop Over URLs:**
    - Name: `Loop Over Items`
    - Type: `n8n-nodes-base.splitInBatches`
    - Input: From `Code`

18. **Add HTTP Request Node for Article Extraction:**
    - Name: `Article Extractor1`
    - Type: `n8n-nodes-base.httpRequest`
    - API: RapidAPI Article Extractor2 or alternative
    - Query parameter: `url` from current item URL
    - Headers: RapidAPI host and key (`X-RapidAPI-Key`) to be inserted
    - Connect from `Loop Over Items`

19. **Add Wait Node to Avoid Rate Limits:**
    - Name: `Delay-to-Avoid-Request-Per-Minute-Cap`
    - Type: `n8n-nodes-base.wait`
    - Amount: 15 seconds (adjust as needed)
    - Connect from `Article Extractor1`

20. **Add Code Node to Aggregate Extracted Articles:**
    - Name: `Code1`
    - Type: `n8n-nodes-base.code`
    - Aggregates all extracted article content into a single string
    - Connect from `Loop Over Items`

21. **Add Chain LLM Node for Final Research Report Generation:**
    - Name: `Research Reporter`
    - Type: `@n8n/n8n-nodes-langchain.chainLlm`
    - Model: Google Gemini 1.5 Flash
    - Prompt: Detailed instructions to synthesize an APA7-compliant, expert-level report using all inputs (original query, aggregated article content, extracted info)
    - Connect from `Code1` and from `Query 2 - Ranker` (for extracted info) and `Webhook`

22. **Add Respond to Webhook Node:**
    - Name: `Respond to Webhook`
    - Type: `n8n-nodes-base.respondToWebhook`
    - Respond with text content from `Research Reporter`
    - Connect from `Research Reporter`

23. **Set Credentials:**
    - Google Gemini API credentials on all Langchain nodes using Google Palm API credential with API key.
    - Brave Search API key inserted in `Query 1` and `Query 2` HTTP Request nodes header `X-Subscription-Token`.
    - Article Extractor API key inserted in `Article Extractor1` HTTP Request node headers.

24. **Test and Activate Workflow:**
    - Ensure all API keys are valid.
    - Test webhook with sample research questions.
    - Monitor rate limits and adjust delays if necessary.

---

### 5. General Notes & Resources

| Note Content                                                                                                                      | Context or Link                                                                                                                 |
|----------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| Step 1: Get free Gemini API key via Google AI Studio: https://aistudio.google.com/app/welcome                                    | Setup for Google Gemini API credentials in Langchain nodes.                                                                      |
| Step 2: Get free Brave Search API key: https://api.search.brave.com                                                                | Setup for Brave Search API keys in HTTP request nodes.                                                                           |
| Step 3: Get free RapidAPI Article Extractor key (300 free extractions/month): https://rapidapi.com/pwshub-pwshub-default/api/article-extractor2 | Setup for article content extraction API keys in HTTP request node. Alternative APIs like Scraper Tech available.                |
| Instructions for using the Webhook Call node to integrate this workflow externally.                                               | Place the webhook URL generated by the `Webhook` node in HTTP Request nodes of other workflows for research queries integration. |
| API Rate Limits: Gemini API free tier allows 15 requests per minute, 1,500 per day; adjust workflow delays accordingly.           | Prevents request rejections by respecting API quotas.                                                                             |
| Brave Search API free tier details found at Brave developer portal.                                                                | Ensure API keys and usage comply with Brave API terms.                                                                            |
| Article Extraction API may fail on unsupported sites or complex web pages; handle gracefully.                                      | Monitor and log extraction errors for resilience.                                                                                 |

---

**Disclaimer:** The provided workflow and description are based on a fully automated n8n workflow. All APIs require user-provided API keys. The AI models and APIs used are subject to their respective usage policies and rate limits. The workflow is designed to comply with legal and ethical standards.