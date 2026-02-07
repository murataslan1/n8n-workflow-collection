AI-Powered Web Research in Google Sheets with GPT and Bright Data

https://n8nworkflows.xyz/workflows/ai-powered-web-research-in-google-sheets-with-gpt-and-bright-data-10119


# AI-Powered Web Research in Google Sheets with GPT and Bright Data

### 1. Workflow Overview

This workflow enables AI-powered web research initiated from Google Sheets, leveraging GPT models and Bright Data’s enterprise web scraping capabilities. It accepts a user prompt and a reference (e.g., cell location or entity name) via a secured webhook, then:

- Organizes and adjusts the user query for optimal web searching.
- Uses a specialized AI agent to perform a targeted Google search through Bright Data’s proxy-enabled search engine.
- Scrapes the top relevant webpage’s content via Bright Data’s scraping API.
- Employs AI models to extract and summarize relevant information from the scraped content.
- Outputs a concise summary back to the requester and simultaneously logs the interaction.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Variable Setup**: Secure webhook receives requests, sets variables from input.
- **1.2 Query Adjustment**: An AI agent refines the user prompt into an optimized search query.
- **1.3 AI-Powered Search through Bright Data**: An AI agent orchestrates a Google search via Bright Data’s MCP client, returning a relevant link.
- **1.4 Web Scraping of Target Link**: Bright Data HTTP API scrapes the target webpage content.
- **1.5 Data Extraction & Summarization**: AI chain extracts relevant data from scraped content and summarizes it.
- **1.6 Respond & Logging**: The summarized data is returned via webhook response and logged in a data table.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Variable Setup

- **Overview:**  
Receives incoming POST requests containing user prompt and cell reference via a secured webhook, then sets workflow variables for later use.

- **Nodes Involved:**  
  - Webhook Call  
  - Set Variables  
  - Respond to Webhook  

- **Node Details:**  

1. **Webhook Call**  
   - Type: `n8n-nodes-base.webhook`  
   - Role: Entry point capturing HTTP POST with authentication via header.  
   - Configuration:  
     - Path: `brightdata-search`  
     - Method: POST  
     - Auth: Header-based authentication with credential "82Labs - Webhook"  
     - Response mode: waits for a node to send response.  
   - Inputs: External HTTP POST requests  
   - Outputs: JSON body with fields `source` (user prompt) and `prompt` (reference)  
   - Edge Cases: Unauthorized requests, malformed JSON, missing fields.

2. **Set Variables**  
   - Type: `n8n-nodes-base.set`  
   - Role: Assigns variables from webhook body for easy reference downstream.  
   - Configuration:  
     - `userPrompt` = `{{$json.body.source}}`  
     - `cellReference` = `{{$json.body.prompt}}`  
     - `ouputLanguage` = `"Hebrew"` (hardcoded default output language)  
   - Inputs: From Webhook Call node  
   - Outputs: Passes variables downstream  
   - Edge Cases: Missing or malformed input JSON.

3. **Respond to Webhook**  
   - Type: `n8n-nodes-base.respondToWebhook`  
   - Role: Final node to respond to webhook caller with summary text.  
   - Configuration:  
     - Response header: Content-Type set to `text/plain; charset=utf-8`  
     - Responds with text body: `{{$json.output.summary}}` (final summarized output)  
   - Inputs: From Summarize Information node  
   - Edge Cases: Missing summary field, response timeout.

---

#### 2.2 Query Adjustment

- **Overview:**  
Transforms user-provided prompt and reference into an optimized, AI-constructed search query tailored for high-quality web searching.

- **Nodes Involved:**  
  - Adjust Query Agent  
  - GPT 4.1 Mini - 1  

- **Node Details:**  

1. **Adjust Query Agent**  
   - Type: `@n8n/n8n-nodes-langchain.agent` (AI agent)  
   - Role: Analyzes user prompt and cell reference to classify query type and build an optimized Google search query.  
   - Configuration:  
     - Input text: User prompt and cell reference from variables.  
     - System message includes detailed instructions for query type classification (news, financial, factual, analysis, general) and query construction rules (e.g., usage of quotes, dates, keywords).  
     - Output: A refined search query string.  
   - Inputs: From Set Variables node  
   - Outputs: Passes refined query to Bright Data Search Agent  
   - Edge Cases: Ambiguous queries, language issues, incorrect classification.  
   - Version: Langchain v2.2 agent node.

2. **GPT 4.1 Mini - 1**  
   - Type: `@n8n/n8n-nodes-langchain.lmChatOpenAi`  
   - Role: Language model powering Adjust Query Agent for natural language understanding and query generation.  
   - Configuration:  
     - Model: GPT-4.1 Mini  
     - Credentials: OpenAI API key (General - OpenAi)  
   - Inputs: From Adjust Query Agent node  
   - Outputs: Refined query text  
   - Edge Cases: API rate limits, network errors.

---

#### 2.3 AI-Powered Search through Bright Data

- **Overview:**  
Executes the refined query using an AI agent that leverages Bright Data’s Managed Client Platform (MCP) to perform a proxy-enabled Google search, filtering results to return a credible link.

- **Nodes Involved:**  
  - Bright Data MCP  
  - Bright Data Search Agent  
  - Structured Output Parser - 1  
  - GPT 4o - 1  

- **Node Details:**  

1. **Bright Data MCP**  
   - Type: `@n8n/n8n-nodes-langchain.mcpClientTool`  
   - Role: Connects to Bright Data MCP service for proxy-enabled search tool use.  
   - Configuration:  
     - Endpoint URL with embedded token for authentication.  
     - Includes "search_engine" tool only.  
     - Timeout set to 120 seconds.  
     - Server transport: HTTP streamable.  
   - Inputs: From Bright Data Search Agent (as AI tool)  
   - Outputs: Search results  
   - Edge Cases: Token expiry, network failures, MCP service downtime.

2. **Bright Data Search Agent**  
   - Type: `@n8n/n8n-nodes-langchain.agent`  
   - Role: Defines an AI agent specialized in web search and retrieval.  
   - Configuration:  
     - Receives refined query string.  
     - Executes Google search limited to 10 results, prioritizes reliable sources (e.g., Reuters, WSJ, official reports), filters ads, irrelevant or broken links.  
     - Returns a single JSON object with a `"link"` field containing the best URL or an empty string if none found.  
     - Includes error handling instructions and result validation.  
     - Uses GPT 4o for internal reasoning.  
   - Inputs: Refined query from Adjust Query Agent  
   - Outputs: JSON with best link  
   - Edge Cases: No results found, invalid JSON output, search failure.

3. **Structured Output Parser - 1**  
   - Type: `@n8n/n8n-nodes-langchain.outputParserStructured`  
   - Role: Validates and extracts the structured JSON output (link) from Bright Data Search Agent.  
   - Configuration: JSON schema example expects `{ "link": "" }`.  
   - Inputs: From Bright Data Search Agent  
   - Outputs: Validated JSON with link  
   - Edge Cases: Malformed JSON, empty link field.

4. **GPT 4o - 1**  
   - Type: `@n8n/n8n-nodes-langchain.lmChatOpenAi`  
   - Role: Language model used by Bright Data Search Agent to reason about search results and filtering.  
   - Configuration:  
     - Model: GPT-4o  
     - Credentials: OpenAI API key  
   - Inputs: Internal to Bright Data Search Agent  
   - Outputs: Search decision logic.

---

#### 2.4 Web Scraping of Target Link

- **Overview:**  
Makes an authenticated HTTP POST request to Bright Data’s scraping API to fetch the web page content from the link found by the search agent.

- **Nodes Involved:**  
  - Bright Data - Data Extraction  

- **Node Details:**  

1. **Bright Data - Data Extraction**  
   - Type: `n8n-nodes-base.httpRequest`  
   - Role: Sends a POST request to Bright Data API to scrape the target URL with enterprise proxies to avoid bot detection.  
   - Configuration:  
     - URL: `https://api.brightdata.com/request`  
     - Method: POST  
     - Headers: Authorization Bearer token placeholder `"Bearer YOUR_TOKEN_HERE"` (must be replaced with valid token)  
     - Body parameters:  
       - `zone`: `mcp_unlocker` (Bright Data zone for scraping)  
       - `url`: dynamic, from `link` field returned by Bright Data Search Agent  
       - `format`: `json`  
       - `method`: `GET`  
       - `country`: `il` (Israel)  
       - `data_format`: `markdown` (response format for easier parsing)  
     - Batching enabled with 1 request per 2 seconds interval.  
   - Inputs: Validated link from Structured Output Parser - 1  
   - Outputs: Scraped webpage content in JSON (with markdown content)  
   - Edge Cases: Invalid or expired API token, rate limiting, broken URLs, request timeouts, scraping failures.

---

#### 2.5 Data Extraction & Summarization

- **Overview:**  
Processes the raw scraped content with AI models to extract information relevant to the user’s original request, then summarizes the extracted data into a concise, user-friendly output.

- **Nodes Involved:**  
  - Extract Data  
  - Structured Output Parser - 2  
  - Summarize Information  
  - Structured Output Parser - 3  
  - GPT 4o Mini - 1  
  - GPT 4o Mini - 2  

- **Node Details:**  

1. **Extract Data**  
   - Type: `@n8n/n8n-nodes-langchain.chainLlm`  
   - Role: AI chain that extracts and summarizes relevant information from scraped content based on user’s original query.  
   - Configuration:  
     - Input includes original user request (prompt + cell ref) and full scraped content (`$json.body`).  
     - Instructions emphasize returning only valid JSON with a `summary` field, max 400 characters, focused on relevance, and translating if necessary.  
     - On error: continue with regular output to avoid workflow interruption.  
     - Uses GPT 4o Mini - 1 and GPT 4o Mini - 2 as AI models for extraction and summarization.  
   - Inputs: Scraped content from Bright Data - Data Extraction  
   - Outputs: JSON with extracted summary  
   - Edge Cases: Partial or corrupted content, multiple unrelated topics, different language content.

2. **Structured Output Parser - 2**  
   - Type: `@n8n/n8n-nodes-langchain.outputParserStructured`  
   - Role: Validates and extracts the JSON summary from Extract Data node.  
   - Configuration: Expects JSON schema with `{ "summary": "" }`.  
   - Inputs: From Extract Data  
   - Outputs: Validated summary JSON  
   - Edge Cases: Malformed JSON, empty summary.

3. **Summarize Information**  
   - Type: `@n8n/n8n-nodes-langchain.agent`  
   - Role: Further filters and condenses the extracted summary to generate a final conclusion in the user’s preferred output language.  
   - Configuration:  
     - System message instructs to generate a conclusion in the specified language, max 400 characters, only valid JSON output, no extra text.  
     - Input text includes scraping summary and user query.  
     - Uses GPT 4o Mini - 2 as the model.  
   - Inputs: From Extract Data output (summary)  
   - Outputs: Final summary JSON  
   - Edge Cases: Language translation issues, API errors.

4. **Structured Output Parser - 3**  
   - Type: `@n8n/n8n-nodes-langchain.outputParserStructured`  
   - Role: Validates the final summary output structure from Summarize Information.  
   - Configuration: JSON schema example includes a sample summary.  
   - Inputs: From Summarize Information  
   - Outputs: Validated summary JSON for Respond to Webhook and logging.

---

#### 2.6 Respond & Logging

- **Overview:**  
Delivers the final summarized output back to the requester via webhook response and stores the input-output pair in a data table for future reference.

- **Nodes Involved:**  
  - Respond to Webhook  
  - Update Logs  

- **Node Details:**  

1. **Respond to Webhook** (see 2.1)  
   - Returns the final summary as plain text HTTP response.

2. **Update Logs**  
   - Type: `n8n-nodes-base.dataTable`  
   - Role: Logs the user prompt and the AI-generated summary into a data table named "BrightData Test" for tracking or analytics.  
   - Configuration:  
     - Two columns: `input_prompt` (concatenation of userPrompt and cellReference), `output` (summary text).  
     - Mapping mode: define below (manual field mapping).  
   - Inputs: Final summary JSON from Summarize Information  
   - Edge Cases: Data table connectivity issues, logging failures.

---

### 3. Summary Table

| Node Name                    | Node Type                                    | Functional Role                             | Input Node(s)            | Output Node(s)                 | Sticky Note                                                                                              |
|------------------------------|----------------------------------------------|--------------------------------------------|--------------------------|-------------------------------|---------------------------------------------------------------------------------------------------------|
| Webhook Call                 | n8n-nodes-base.webhook                       | Receives authenticated HTTP POST requests | -                        | Set Variables                 |                                                                                                         |
| Set Variables                | n8n-nodes-base.set                           | Assigns variables from webhook payload     | Webhook Call             | Adjust Query Agent            |                                                                                                         |
| Adjust Query Agent           | @n8n/n8n-nodes-langchain.agent               | AI agent to generate refined search query | Set Variables            | Bright Data Search Agent      | # 1) Get Query & Organize Data                                                                           |
| GPT 4.1 Mini - 1             | @n8n/n8n-nodes-langchain.lmChatOpenAi       | Language model powering query adjustment   | Adjust Query Agent       | Adjust Query Agent            |                                                                                                         |
| Bright Data MCP              | @n8n/n8n-nodes-langchain.mcpClientTool      | Connects to Bright Data MCP search engine  | Bright Data Search Agent (ai_tool) | Bright Data Search Agent (ai_tool) | # 2) Suit Query to Brightdata                                                                             |
| Bright Data Search Agent     | @n8n/n8n-nodes-langchain.agent               | AI agent performing Google search via MCP  | Adjust Query Agent       | Bright Data - Data Extraction |                                                                                                         |
| Structured Output Parser - 1 | @n8n/n8n-nodes-langchain.outputParserStructured | Validates search agent output JSON          | Bright Data Search Agent | Bright Data - Data Extraction |                                                                                                         |
| Bright Data - Data Extraction| n8n-nodes-base.httpRequest                    | Scrapes webpage content from found link    | Structured Output Parser - 1 | Extract Data                | # 3) Brightdata's Scraping                                                                               |
| Extract Data                | @n8n/n8n-nodes-langchain.chainLlm            | Extracts relevant info from scraped content| Bright Data - Data Extraction | Summarize Information       | # 4) Infomation Extraction + Retrieving Summary & Updating Logs                                          |
| Structured Output Parser - 2 | @n8n/n8n-nodes-langchain.outputParserStructured | Validates extracted data JSON summary       | Extract Data             | Summarize Information         |                                                                                                         |
| Summarize Information       | @n8n/n8n-nodes-langchain.agent               | Produces final summary in preferred language| Extract Data             | Respond to Webhook, Update Logs|                                                                                                         |
| Structured Output Parser - 3 | @n8n/n8n-nodes-langchain.outputParserStructured | Validates final summary JSON                 | Summarize Information    | Respond to Webhook, Update Logs|                                                                                                         |
| Respond to Webhook          | n8n-nodes-base.respondToWebhook               | Sends summary response to webhook caller   | Summarize Information    | -                             |                                                                                                         |
| Update Logs                 | n8n-nodes-base.dataTable                      | Logs input and output pairs                  | Summarize Information    | -                             |                                                                                                         |
| GPT 4o - 1                  | @n8n/n8n-nodes-langchain.lmChatOpenAi       | Language model used by Bright Data Search Agent | Bright Data Search Agent | Bright Data Search Agent       |                                                                                                         |
| GPT 4o Mini - 1             | @n8n/n8n-nodes-langchain.lmChatOpenAi       | Language model used in Extract Data chain   | Extract Data             | Extract Data                  |                                                                                                         |
| GPT 4o Mini - 2             | @n8n/n8n-nodes-langchain.lmChatOpenAi       | Language model used for Summarize Information| Summarize Information    | Summarize Information         |                                                                                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Call Node**  
   - Type: `Webhook`  
   - HTTP Method: POST  
   - Path: `brightdata-search`  
   - Authentication: Header Auth (create credential, e.g., "82Labs - Webhook")  
   - Response Mode: `responseNode` (wait for explicit response)  

2. **Create Set Variables Node**  
   - Type: `Set`  
   - Connect input from Webhook Call  
   - Assign:  
     - `userPrompt` = `{{$json.body.source}}`  
     - `cellReference` = `{{$json.body.prompt}}`  
     - `ouputLanguage` = `"Hebrew"` (or desired language)  

3. **Create Adjust Query Agent Node**  
   - Type: `Langchain Agent`  
   - Connect input from Set Variables  
   - Configure prompt to:  
     - Read user prompt and cell reference  
     - Classify query type (news, financial, factual, analysis, general)  
     - Construct optimized Google search query according to detailed system instructions (including date/time context)  
   - Use GPT 4.1 Mini model for AI model credentials  
   - Connect GPT 4.1 Mini - 1 as AI language model node  

4. **Create Bright Data MCP Node**  
   - Type: `Langchain MCP Client Tool`  
   - Endpoint URL: Bright Data MCP API with your token  
   - Include only `search_engine` tool  
   - Timeout: 120000 ms  
   - Server transport: `httpStreamable`  
   - Connect input from Bright Data Search Agent (as AI tool)  

5. **Create Bright Data Search Agent Node**  
   - Type: `Langchain Agent`  
   - Connect input from Adjust Query Agent  
   - Configure prompt to:  
     - Perform Google search with limit 10, country "us" or "il"  
     - Prioritize reliable sources (news, official websites, financial reports, trusted databases)  
     - Filter out ads, irrelevant marketing, forums, broken links  
     - Return JSON with `"link": "https://..."` or empty string  
     - Use GPT 4o model  
   - Connect GPT 4o - 1 node for AI model  

6. **Create Structured Output Parser - 1**  
   - Type: `Langchain Output Parser Structured`  
   - JSON schema example: `{"link": ""}`  
   - Connect input from Bright Data Search Agent  
   - Output feeds Bright Data - Data Extraction node  

7. **Create Bright Data - Data Extraction Node**  
   - Type: `HTTP Request`  
   - Method: POST  
   - URL: `https://api.brightdata.com/request`  
   - Headers: Authorization: `Bearer YOUR_TOKEN_HERE` (replace with valid Bright Data API token)  
   - Body parameters:  
     - `zone`: `mcp_unlocker`  
     - `url`: `={{$json.output.link}}` (dynamic from previous node)  
     - `format`: `json`  
     - `method`: `GET`  
     - `country`: `il`  
     - `data_format`: `markdown`  
   - Batching: 1 request per 2000 ms  
   - Connect input from Structured Output Parser - 1  
   - Output to Extract Data node  

8. **Create Extract Data Node**  
   - Type: `Langchain Chain LLM`  
   - Input: raw scraped content and user original request variables  
   - Instructions: extract relevant info from content, return concise JSON summary (max 400 chars), translate if needed  
   - On error: continue regular output  
   - Connect GPT 4o Mini - 1 and GPT 4o Mini - 2 as AI language models  
   - Connect Structured Output Parser - 2 downstream  

9. **Create Structured Output Parser - 2**  
   - Type: `Langchain Output Parser Structured`  
   - JSON schema example: `{"summary": ""}`  
   - Connect input from Extract Data  
   - Output to Summarize Information node  

10. **Create Summarize Information Node**  
    - Type: `Langchain Agent`  
    - Input: extracted summary + user request  
    - Instructions: generate final summary in preferred output language, max 400 chars, valid JSON only  
    - Use GPT 4o Mini - 2 as AI model  
    - Connect Structured Output Parser - 3 downstream  

11. **Create Structured Output Parser - 3**  
    - Type: `Langchain Output Parser Structured`  
    - JSON schema example includes sample summary text  
    - Connect input from Summarize Information  
    - Outputs to Respond to Webhook and Update Logs nodes  

12. **Create Respond to Webhook Node**  
    - Type: `Respond to Webhook`  
    - Connect input from Summarize Information  
    - Response header: Content-Type `text/plain; charset=utf-8`  
    - Response body: `={{$json.output.summary}}`  

13. **Create Update Logs Node**  
    - Type: `Data Table`  
    - Columns:  
      - `input_prompt`: `"={{$json.userPrompt}} - {{$json.cellReference}}"`  
      - `output`: `"={{$json.output.summary}}"`  
    - Data table ID: use or create a data table for logs  
    - Connect input from Summarize Information  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                         | Context or Link                                                                                       |
|------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| AI-powered web scraping custom function for Google Sheets: `=BRIGHTDATA(cell,"prompt")` enables direct calls from sheets to this workflow          | Workflow purpose and Google Sheets integration                                                     |
| Workflow created by Elay Guez - [LinkedIn Profile](https://www.linkedin.com/in/elay-g)                                                               | Credits                                                                                            |
| Features include multi-model GPT usage (GPT-4.1 Mini, GPT-4o Mini, GPT-4o), Bright Data enterprise proxy scraping, AI-optimized queries             | Highlights of technology stack                                                                    |
| Setup requires OpenAI API keys, Bright Data API token, Google Apps Script deployment for the Sheets custom function, webhook header auth configuration| Setup prerequisites and external dependencies                                                    |
| Cost estimate per search: approx. $0.02-$0.05; typical time saved per query: 3-5 minutes                                                             | Operational metrics                                                                               |
| Bright Data MCP endpoint and tokens must be securely managed and replaced in HTTP request node                                                      | Security and credential management                                                                |

---

**Disclaimer:**  
This document is generated from an automated n8n workflow JSON export and contains only legal, publicly accessible operations respecting content policies. All external API tokens and credentials must be replaced with valid user-specific values.