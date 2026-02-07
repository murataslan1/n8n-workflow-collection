Automate Deep Research with ScrapeGraphAI, GPT-4 & Google Sheets

https://n8nworkflows.xyz/workflows/automate-deep-research-with-scrapegraphai--gpt-4---google-sheets-6437


# Automate Deep Research with ScrapeGraphAI, GPT-4 & Google Sheets

### 1. Workflow Overview

This workflow automates deep research by integrating ScrapeGraphAI, GPT-4, and Google Sheets to collect, analyze, and store multi-source research data. It is designed for users needing comprehensive, structured insights on specified topics, suitable for market research, academic literature review, or business intelligence.

The workflow includes these logical blocks:

- **1.1 Input Reception:** Receives and validates research requests via a webhook.
- **1.2 Configuration & Query Generation:** Processes input parameters, sets defaults, and generates multiple search queries.
- **1.3 Multi-Source AI Scraping:** Executes parallel AI-powered scraping from general web, news, and academic sources using ScrapeGraphAI.
- **1.4 Data Merging & Processing:** Combines scraped data, processes it into a unified structured format, and prepares it for analysis.
- **1.5 Data Storage & Response:** Saves the processed research data into Google Sheets and responds to the webhook with completion status and metadata.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block receives incoming research requests via an HTTP POST webhook, initiating the workflow.

- **Nodes Involved:**  
  - Research Request Webhook

- **Node Details:**

  - **Research Request Webhook**  
    - Type: Webhook  
    - Role: Entry point for research requests  
    - Configuration:  
      - HTTP Method: POST  
      - Path: `/research-trigger`  
      - Response Mode: Responds with a separate response node  
      - Optional API key authentication and configurable rate limiting (mentioned in sticky notes)  
    - Inputs: External HTTP POST requests  
    - Outputs: JSON payload containing research parameters  
    - Edge cases: Invalid/malformed JSON inputs, missing mandatory fields, unauthorized requests if API key enforced  
    - Sticky Note: Provides detailed request format and configuration guidelines, including example JSON, depth levels, and source types.

#### 1.2 Configuration & Query Generation

- **Overview:**  
  Processes received parameters, applies defaults, validates inputs, and generates a list of search queries based on topic and depth.

- **Nodes Involved:**  
  - Research Configuration Processor  
  - Split Search Queries  
  - Query Selector

- **Node Details:**

  - **Research Configuration Processor**  
    - Type: Code  
    - Role: Sanitizes and validates input, sets defaults, generates search queries, creates unique session ID  
    - Configuration: JavaScript code extracts input body, sets defaults for parameters like topic, depth, sources, timeframe, language, maxSources, analysisType. Generates base queries and adds depth-specific queries if comprehensive.  
    - Inputs: Raw webhook JSON  
    - Outputs: JSON with researchConfig object, searchQueries array, timestamp, sessionId  
    - Edge cases: Missing or empty fields, incorrect data types, unexpected input structure  
    - Sticky Note: Explains validation, default setting, query generation strategy, and customization options.

  - **Split Search Queries**  
    - Type: SplitInBatches  
    - Role: Splits the generated queries into batches for sequential processing  
    - Configuration: Default batching, no explicit batch size configured (defaults to 1)  
    - Inputs: Output from configuration processor (containing searchQueries)  
    - Outputs: Batches of individual queries for downstream nodes  
    - Edge cases: Empty query list, batch size impact on execution time

  - **Query Selector**  
    - Type: Code  
    - Role: Selects the current query from the batch and attaches batch index  
    - Configuration: JavaScript code accesses current batch index and extracts corresponding query from searchQueries array  
    - Inputs: Batch data from Split Search Queries and original item  
    - Outputs: JSON including currentQuery and batchIndex fields  
    - Edge cases: Index out of bounds if batches and queries mismatch, null or empty queries

#### 1.3 Multi-Source AI Scraping

- **Overview:**  
  Executes three parallel scraping operations using ScrapeGraphAI nodes focused on general web research, news, and academic literature.

- **Nodes Involved:**  
  - AI Research Scraper  
  - News Sources Scraper  
  - Academic Sources Scraper

- **Node Details:**

  - **AI Research Scraper**  
    - Type: ScrapeGraphAI  
    - Role: General web research; extracting key findings, statistics, expert opinions, source credibility  
    - Configuration:  
      - User prompt requests structured JSON including title, summary, keyPoints, statistics, quotes, sources, credibilityScore, datePublished, relevanceScore  
      - Website URL set dynamically to the current query string  
    - Inputs: Current query JSON  
    - Outputs: Structured research results JSON  
    - Edge cases: Scraping failures, invalid query URLs, API quota limits, timeout, unstructured or incomplete results  
    - Sticky Note: Details purpose, focus, output structure, and ScrapeGraphAI benefits.

  - **News Sources Scraper**  
    - Type: ScrapeGraphAI  
    - Role: Extracts recent news articles related to the query  
    - Configuration:  
      - User prompt requests headline, publication date, source, summary, URL for recent credible news in last 6 months  
      - Website URL is a Google News search for the encoded current query (`https://www.google.com/search?q={query}&tbm=nws`)  
    - Inputs: Current query JSON  
    - Outputs: JSON with news articles array  
    - Edge cases: Google search rate limiting, incomplete data, outdated news, API failures

  - **Academic Sources Scraper**  
    - Type: ScrapeGraphAI  
    - Role: Extracts academic papers and research studies  
    - Configuration:  
      - User prompt requests title, authors, year, journal/conference, citations, abstract, DOI/URL, focusing on peer-reviewed sources and recent publications  
      - Website URL is Google Scholar search for the encoded current query (`https://scholar.google.com/scholar?q={query}`)  
    - Inputs: Current query JSON  
    - Outputs: JSON with academic papers array  
    - Edge cases: Google Scholar scraping restrictions, incomplete metadata, API timeouts

#### 1.4 Data Merging & Processing

- **Overview:**  
  Merges the parallel source outputs and processes them into a unified, structured research data format for storage and analysis.

- **Nodes Involved:**  
  - Merge Research Sources  
  - Research Data Processor

- **Node Details:**

  - **Merge Research Sources**  
    - Type: Merge  
    - Role: Combines outputs from the three AI scrapers into a single data set  
    - Configuration: Mode set to "combine" (concatenates inputs)  
    - Inputs: Outputs from AI Research Scraper, News Sources Scraper, Academic Sources Scraper  
    - Outputs: Combined array of research source JSON objects  
    - Edge cases: Missing inputs from any scraper, out-of-sync data, merge failures

  - **Research Data Processor**  
    - Type: Code  
    - Role: Processes combined data, structures findings, aggregates metadata, and prepares final research data object  
    - Configuration: JavaScript code extracts and organizes general findings, news articles, academic papers, computes total sources, adds meta info like sessionId, query, batchIndex, timestamp  
    - Inputs: Merged research JSON array  
    - Outputs: Single JSON object containing processed research data ready for storage  
    - Edge cases: Missing or empty fields in inputs, inconsistent data structures, processing errors  
    - Sticky Note: Describes processing steps including combination, validation, enrichment, and structuring.

#### 1.5 Data Storage & Response

- **Overview:**  
  Appends the processed research data into a Google Sheets document and sends a JSON response to confirm completion.

- **Nodes Involved:**  
  - Research Data Storage  
  - Research Complete Response

- **Node Details:**

  - **Research Data Storage**  
    - Type: Google Sheets  
    - Role: Stores structured research data entries for historical tracking and analysis  
    - Configuration:  
      - Operation: Append  
      - Sheet name: "Research_Data"  
      - Columns mapped to sessionId, query, timestamp, AI analysis (not explicitly shown in code, presumably full analysis text), totalSources  
      - Uses OAuth2 credentials (must be preconfigured)  
    - Inputs: Processed research data JSON  
    - Outputs: Confirmation of data append operation  
    - Edge cases: Credential failures, API quota limits, Google Sheets unavailability, schema mismatch  
    - Sticky Note: Explains sheet structure, data retention, access control, and use cases.

  - **Research Complete Response**  
    - Type: Respond to Webhook  
    - Role: Sends final JSON response to the initial webhook caller indicating status and metadata  
    - Configuration: Responds with JSON including status, sessionId, message, totalSources, timestamp  
    - Inputs: Output from Google Sheets node containing research metadata  
    - Outputs: HTTP response to webhook client  
    - Edge cases: Delays causing timeout, malformed response, webhook client disconnection

---

### 3. Summary Table

| Node Name                   | Node Type                    | Functional Role                              | Input Node(s)                     | Output Node(s)                        | Sticky Note                                                                                              |
|-----------------------------|------------------------------|----------------------------------------------|----------------------------------|-------------------------------------|--------------------------------------------------------------------------------------------------------|
| Research Request Webhook     | Webhook                      | Receives incoming research requests          | —                                | Research Configuration Processor    | # Step 1: Research Request Webhook 🎯: Details request format, method, path, auth, source & depth info    |
| Research Configuration Processor | Code                      | Validates input, sets defaults, generates queries | Research Request Webhook          | Split Search Queries                 | # Step 2: Research Configuration Processor 🔧: Explains validation, defaults, query generation strategy  |
| Split Search Queries         | SplitInBatches               | Splits queries into batches for processing    | Research Configuration Processor | Query Selector                      |                                                                                                        |
| Query Selector              | Code                         | Selects current query from batch               | Split Search Queries              | AI Research Scraper, News Sources Scraper, Academic Sources Scraper |                                                                                                        |
| AI Research Scraper          | ScrapeGraphAI                | Scrapes general web research data              | Query Selector                   | Merge Research Sources              | # Step 3: Multi-Source AI Scraping 🤖: Describes AI scraping nodes, focus, outputs                        |
| News Sources Scraper         | ScrapeGraphAI                | Scrapes recent news articles                    | Query Selector                   | Merge Research Sources              |                                                                                                        |
| Academic Sources Scraper     | ScrapeGraphAI                | Scrapes academic papers and studies             | Query Selector                   | Merge Research Sources              |                                                                                                        |
| Merge Research Sources       | Merge                        | Combines all scraping results                    | AI Research Scraper, News Sources Scraper, Academic Sources Scraper | Research Data Processor             |                                                                                                        |
| Research Data Processor      | Code                         | Processes and structures merged research data  | Merge Research Sources           | Research Data Storage               | # Step 4: Data Processing & AI Analysis 🧠: Explains data combination, validation, enrichment            |
| Research Data Storage        | Google Sheets                | Stores processed research data                   | Research Data Processor          | Research Complete Response          | # Step 5: Data Storage & Response 📊: Details sheet structure, data retention, OAuth2, response format   |
| Research Complete Response   | Respond to Webhook           | Sends final completion response to webhook     | Research Data Storage            | —                                   |                                                                                                        |
| Webhook Trigger Guide        | Sticky Note                  | Documentation for webhook setup and use         | —                                | —                                   | Detailed documentation for Step 1                                                                      |
| Configuration Guide          | Sticky Note                  | Documentation for configuration processing      | —                                | —                                   | Detailed documentation for Step 2                                                                      |
| AI Scraping Guide            | Sticky Note                  | Documentation for AI scraping nodes             | —                                | —                                   | Detailed documentation for Step 3                                                                      |
| Processing & Analysis Guide  | Sticky Note                  | Documentation for data processing and analysis  | —                                | —                                   | Detailed documentation for Step 4                                                                      |
| Storage & Response Guide     | Sticky Note                  | Documentation for storage and webhook response  | —                                | —                                   | Detailed documentation for Step 5                                                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node:**  
   - Type: Webhook  
   - Name: "Research Request Webhook"  
   - HTTP Method: POST  
   - Path: `research-trigger`  
   - Response Mode: Use separate response node  
   - (Optional) Set API key authentication and rate limiting if needed  

2. **Add Code Node for Configuration:**  
   - Name: "Research Configuration Processor"  
   - Type: Code (JavaScript)  
   - Input: Output from webhook  
   - Code:  
     - Extract `body` from input JSON  
     - Set defaults for topic, depth (basic/detailed/comprehensive), sources (web, academic, news), timeframe, language, maxSources, analysisType  
     - Generate search queries based on topic and depth, including base and additional queries for comprehensive depth  
     - Add timestamp and sessionId (`research_${Date.now()}`)  
   - Output: JSON with researchConfig and searchQueries

3. **Add SplitInBatches Node:**  
   - Name: "Split Search Queries"  
   - Input: Output from configuration processor  
   - Purpose: Split searchQueries array into batches (default batch size = 1)  

4. **Add Code Node to Select Query:**  
   - Name: "Query Selector"  
   - Input: Batch item from split node + original JSON  
   - Code: Select current query using batch index from searchQueries array  
   - Output: JSON containing currentQuery and batchIndex  

5. **Add Three Parallel ScrapeGraphAI Nodes:**  
   - **AI Research Scraper:**  
     - User Prompt: Request structured JSON with key findings, stats, quotes, sources, credibility  
     - Website URL: `={{ $json.currentQuery }}`  
   - **News Sources Scraper:**  
     - User Prompt: Extract recent news articles with headline, date, source, summary, URL  
     - Website URL: `https://www.google.com/search?q={{ encodeURIComponent($json.currentQuery) }}&tbm=nws`  
   - **Academic Sources Scraper:**  
     - User Prompt: Extract academic papers with title, authors, year, journal, citations, abstract, DOI/URL  
     - Website URL: `https://scholar.google.com/scholar?q={{ encodeURIComponent($json.currentQuery) }}`  

6. **Add Merge Node:**  
   - Name: "Merge Research Sources"  
   - Mode: Combine (concatenate outputs from the three ScrapeGraphAI nodes)  

7. **Add Code Node to Process Data:**  
   - Name: "Research Data Processor"  
   - Code:  
     - Extract merged data arrays from general, news, academic sources  
     - Structure into `processedData` object with meta fields (sessionId, query, batchIndex, timestamp)  
     - Summarize generalFindings, newsFindings, academicFindings  
     - Calculate totalSources  
   - Output: Structured JSON for storage  

8. **Add Google Sheets Node:**  
   - Name: "Research Data Storage"  
   - Operation: Append  
   - Document ID: Set OAuth2 credential with access to Google Sheets  
   - Sheet Name: "Research_Data"  
   - Columns: Map to sessionId, query, timestamp, AI analysis (if available), totalSources  

9. **Add Respond to Webhook Node:**  
   - Name: "Research Complete Response"  
   - Respond With: JSON  
   - Response Body: JSON string with status, sessionId, message, totalSources, timestamp  

10. **Connect Nodes Sequentially:**  
    - Research Request Webhook → Research Configuration Processor → Split Search Queries → Query Selector  
    - Query Selector → AI Research Scraper, News Sources Scraper, Academic Sources Scraper (parallel)  
    - Scrapers → Merge Research Sources → Research Data Processor → Research Data Storage → Research Complete Response  

11. **Configure Credentials:**  
    - Set up credentials for ScrapeGraphAI nodes (API keys)  
    - Configure Google Sheets OAuth2 credentials with access to the target spreadsheet  

12. **Test Flow:**  
    - Send test POST requests to `/research-trigger` with JSON body matching expected schema  
    - Validate data flow, check Google Sheets for appended rows  
    - Verify webhook response correctness  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                     | Context or Link                                                                                                                                                        |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Workflow automates multi-source deep research combining AI scraping and structured data storage for scalable, repeatable insights.                                                                                             | Workflow purpose summary                                                                                                                                               |
| Request format example and webhook setup details are documented in "Webhook Trigger Guide" sticky note.                                                                                                                         | In-workflow documentation node                                                                                                                                       |
| ScrapeGraphAI nodes leverage AI for intelligent content extraction with credibility scoring and multi-language support.                                                                                                        | Sticky note "AI Scraping Guide"                                                                                                                                        |
| Google Sheets node uses OAuth2 for secure access; ensure proper credential configuration to avoid authentication errors.                                                                                                        | Sticky note "Storage & Response Guide"                                                                                                                                |
| Error handling considerations: malformed input, API timeouts, rate limits, empty query results, Google Sheets quota limits.                                                                                                   | General edge cases summarized from node analyses                                                                                                                     |
| Potential enhancements: Add retry logic on ScrapeGraphAI API calls, implement caching for repeated queries, enrich analysis with GPT-4 summarization (not present but recommended).                                              | Advanced workflow improvement suggestions                                                                                                                            |
| For customization, modify the JavaScript code in Research Configuration Processor to adapt query generation or add industry-specific logic.                                                                                   | Configuration guide note                                                                                                                                               |
| Rate limiting and authentication on webhook endpoints recommended for production deployments to prevent abuse.                                                                                                                | Webhook sticky note recommendations                                                                                                                                  |

---

**Disclaimer:**  
The provided content is exclusively derived from an automated n8n workflow. This processing strictly adheres to content policies and contains no illegal, offensive, or protected material. All data handled is legal and publicly accessible.