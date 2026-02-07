Automate Web Research with GPT-4, Claude & Apify for Content Analysis and Insights

https://n8nworkflows.xyz/workflows/automate-web-research-with-gpt-4--claude---apify-for-content-analysis-and-insights-6822


# Automate Web Research with GPT-4, Claude & Apify for Content Analysis and Insights

---

## 1. Workflow Overview

This workflow automates intelligent web research by transforming user queries into optimized web search commands, scraping relevant content, filtering and analyzing it with AI models (GPT-4 and Claude), and extracting structured insights and summaries. It is designed for use cases such as market research, competitive analysis, regulatory compliance, academic research, and business intelligence, where authoritative, up-to-date information is needed from the web.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Query Preparation:** Accepts user research questions via manual trigger or external workflow, sets initial parameters, and optimizes the query for effective retrieval.
- **1.2 Web Scraping with Apify RAG Browser:** Executes optimized search queries via Apify's RAG Web Browser actor to scrape relevant documents.
- **1.3 Content Cleaning & Duplicate Detection:** Cleans the scraped markdown text, normalizes it, and checks for duplicates in a Qdrant vector database to avoid redundant processing.
- **1.4 Early Content Filtering (Claude AI):** Quickly evaluates scraped articles for relevance and quality to decide which documents proceed to full processing.
- **1.5 Full Content Processing & AI Analysis:** For filtered articles, extracts detailed insights, claims, and generates concise summaries using GPT-4 AI agents.
- **1.6 Aggregation and Ranking of Outputs:** Aggregates and ranks extracted claims and summaries to select top 3 most relevant and credible findings.
- **1.7 Storage in Vector Database:** Splits processed text into chunks, generates embeddings using Ollama, and stores them in Qdrant for future semantic search and reference.

---

## 2. Block-by-Block Analysis

### 2.1 Input Reception & Query Preparation

**Overview:**  
This block initiates the workflow by receiving the user’s research query either manually or from another workflow. It sets essential parameters and optimizes the query with advanced search operators tailored for retrieval-augmented generation (RAG) systems.

**Nodes Involved:**  
- When clicking ‘Execute workflow’ (Manual Trigger)  
- When Executed by Another Workflow (Execute Workflow Trigger)  
- Set Node (Parameter Initialization)  
- Smart Query Builder (AI Agent for Query Optimization)  
- Structured Output Parser (Parsing optimized query in Apify format)  

**Node Details:**

- **When clicking ‘Execute workflow’**  
  - Type: Manual Trigger  
  - Role: Entry point for manual research question input.  
  - Configuration: No parameters; triggered manually.  
  - Outputs: Passes input to Set Node.

- **When Executed by Another Workflow**  
  - Type: Execute Workflow Trigger  
  - Role: Entry point for external workflow invocation with a "query" input parameter.  
  - Configuration: Defines "query" as expected input.  
  - Outputs: Passes input to Set Node.

- **Set Node**  
  - Type: Set  
  - Role: Initializes workflow variables including the research query, Qdrant URL, collection name, max results, and relevance threshold.  
  - Key Variables:  
    - `query`: passed from trigger nodes  
    - `qdrant_url`: "http://qdrant:6333" (local vector DB)  
    - `collection_name`: "web_pages"  
    - `max_results`: 10  
    - `relevance_threshold`: 70  
  - Outputs: Passes variables to Smart Query Builder.

- **Smart Query Builder**  
  - Type: LangChain Agent (AI prompt-driven node)  
  - Role: Transforms the user query into an optimized Google search query applying advanced search operators and exclusions (e.g., excluding low-quality domains).  
  - Key expressions: Uses prompt templating with the research query; outputs a JSON object in Apify search format.  
  - AI Model: GPT-4.1 Mini via OpenAI API.  
  - Error Handling: Retries on failure.  
  - Outputs: Optimized query JSON passed to Structured Output Parser.

- **Structured Output Parser**  
  - Type: LangChain Output Parser Structured  
  - Role: Parses optimized search query JSON into usable format for Apify API.  
  - Configuration: Uses JSON schema example matching Apify query format.  
  - Outputs: Passes JSON to RAG Web Browser node.

**Edge Cases & Notes:**  
- Invalid or empty query inputs may cause failures in query optimization.  
- Network or API errors with OpenAI or Apify API require retries.  
- The exclusion lists in the prompt are critical to avoid low-value results.  

---

### 2.2 Web Scraping with Apify RAG Web Browser

**Overview:**  
Executes the optimized query using Apify’s RAG Web Browser actor to retrieve relevant web pages in markdown format.

**Nodes Involved:**  
- RAG Web Browser (HTTP Request to Apify API)  
- Continue of No Error (Conditional flow check)  
- Markdown Cleaner (Code for cleaning raw markdown)  

**Node Details:**

- **RAG Web Browser**  
  - Type: HTTP Request  
  - Role: Calls Apify RAG Web Browser actor API with optimized query to scrape web pages synchronously.  
  - Method: POST  
  - Authentication: Uses predefined Apify API credentials and Bearer token.  
  - Query Parameters: Memory (4096MB), Timeout (500s)  
  - Body: JSON containing optimized Apify query from previous block.  
  - Retry: Enabled on failure.  
  - Outputs: Scraped pages with metadata and markdown content.

- **Continue of No Error**  
  - Type: If Condition  
  - Role: Checks if HTTP status code of response is not 500 (server error).  
  - Output: Proceeds if no error.

- **Markdown Cleaner**  
  - Type: Code  
  - Role: Cleans raw markdown content by removing navigation, boilerplate, images, references, HTML tags, and normalizes whitespace.  
  - Input: Raw markdown from Apify scraping.  
  - Output: Cleaned markdown for further processing.

**Edge Cases & Notes:**  
- Apify actor failures or timeouts should trigger retries.  
- 500 HTTP errors are filtered out to avoid processing failed scrapes.  
- Cleaning is essential to prevent irrelevant content affecting AI analysis.  

---

### 2.3 Content Cleaning & Duplicate Detection

**Overview:**  
Normalizes cleaned markdown text and checks for duplicates by querying the Qdrant vector database using URLs to avoid redundant processing of identical content.

**Nodes Involved:**  
- Normalize text (Code)  
- Duplicate Check (Code)  
- Set Values (Set node for passing flags and metadata)  
- Processing (If node to gate further processing)  

**Node Details:**

- **Normalize text**  
  - Type: Code  
  - Role: Converts cleaned markdown to a normalized lowercased text without punctuation for embedding and duplicate comparison.  
  - Output: Adds `cleaned_text` and `normalized_text` fields.

- **Duplicate Check**  
  - Type: Code  
  - Role: Calls Qdrant collection search API to find existing items with matching URLs.  
  - Logic: If found, marks the item as duplicate, sets skipProcessing flag to true.  
  - Handles HTTP errors gracefully by assuming no duplicate.  
  - Output: Adds flags: `isDuplicate`, `duplicateType`, `existingDocId`, `skipProcessing`.

- **Set Values**  
  - Type: Set  
  - Role: Assigns multiple fields including metadata, cleaned and normalized text, duplicate flags, and original query for downstream processing.

- **Processing**  
  - Type: If Condition  
  - Role: Checks if `skipProcessing` is false to continue full processing; otherwise skips.

**Edge Cases & Notes:**  
- Qdrant API errors should not block the workflow; assume no duplicate on error.  
- URL-based duplicate detection may miss duplicates with URL variations or content changes.  
- Normalization strategy impacts embedding quality and duplicate detection accuracy.  

---

### 2.4 Early Content Filtering (Claude AI)

**Overview:**  
Uses Anthropic Claude Sonnet 4 model to rapidly assess each scraped article’s relevance and quality based on provided metadata and preview text. Outputs structured evaluation to decide if article merits full processing.

**Nodes Involved:**  
- Early Content Filter (LangChain Agent with Claude)  
- Structured Output Parser1 (Parsing Claude’s structured JSON output)  
- Continue Processing (If node gating further processing based on Claude decision)  

**Node Details:**

- **Early Content Filter**  
  - Type: LangChain Agent  
  - Role: Receives research query and article metadata (title, URL, description, preview) and scores relevance and quality 0-100.  
  - Prompt: System message defines criteria for relevance and quality evaluation including source credibility, content depth, freshness.  
  - Output: Structured JSON with scores and decision flag `process_further`.  
  - AI Model: Claude Sonnet 4 via Anthropic API.  
  - Error Handling: Continues on error, preventing workflow halt.

- **Structured Output Parser1**  
  - Type: LangChain Output Parser Structured  
  - Role: Parses Claude’s JSON output into fields such as relevance score, quality score, reasoning, and final decision.

- **Continue Processing**  
  - Type: If Condition  
  - Role: Checks if `process_further` is true to continue full content processing.  
  - Output: Sends valid articles forward, filters out low-value content.

**Edge Cases & Notes:**  
- Claude API transient failures are gracefully handled; may result in false positives or negatives.  
- Quality of prompt and metadata strongly impacts filtering accuracy.  
- Early filtering saves API costs by avoiding processing irrelevant content.  

---

### 2.5 Full Content Processing & AI Analysis

**Overview:**  
Processes filtered articles to extract detailed insights (claims) and create focused article summaries, both directly answering the research question. Uses GPT-4 AI agents for analysis.

**Nodes Involved:**  
- Edit Fields5 (Set node to prepare inputs for AI agents)  
- Insight Extraction (LangChain Agent with GPT-4)  
- Structured Output Parser3 (Parsing extracted claims JSON)  
- Summarization (LangChain Agent with GPT-4)  
- Structured Output Parser7 (Parsing summarization JSON)  

**Node Details:**

- **Edit Fields5**  
  - Type: Set  
  - Role: Maps metadata, cleaned text, normalized text, query, and relevance scores to fields used by AI agents.  
  - Passes both article data and AI evaluation results.

- **Insight Extraction**  
  - Type: LangChain Agent  
  - Role: Extracts explicit claims, statements, and recommendations from article text that answer the research question.  
  - Instructions include identifying external sources and citing URLs.  
  - AI Model: GPT-4.1 Mini.  
  - Output: JSON array of claims with claim text, evidence, source URL, external source flags.

- **Structured Output Parser3**  
  - Parses claims array JSON into usable structured data.

- **Summarization**  
  - Type: LangChain Agent  
  - Role: Produces a concise 2–3 sentence summary focused on the research question from the article.  
  - Output: JSON object with title, url, and summary fields.

- **Structured Output Parser7**  
  - Parses summary JSON output.

**Edge Cases & Notes:**  
- AI might omit relevant claims or produce hallucinations; prompt design is critical.  
- Claims extraction and summarization run in parallel for efficiency.  
- External source detection depends on article text clarity.  

---

### 2.6 Aggregation and Ranking of Outputs

**Overview:**  
Aggregates all extracted claims and summaries from processed articles, ranks and deduplicates them to select the top 3 most relevant and credible insights and summaries.

**Nodes Involved:**  
- Aggregate Output (Code to collect claims)  
- Aggregate Summaries (Code to collect summaries)  
- aggregation and ranking of extracted claims (LangChain Agent)  
- aggregation and ranking of extracted summaries (LangChain Agent)  
- Structured Output Parser9 (Parsing ranked summaries)  
- Structured Output Parser10 (Parsing ranked claims)  
- Merge (Merges ranked claims and summaries)  

**Node Details:**

- **Aggregate Output**  
  - Type: Code  
  - Role: Collects all claims from Insight Extraction into a single array.

- **Aggregate Summaries**  
  - Type: Code  
  - Role: Collects all summaries from Summarization into a single array.

- **aggregation and ranking of extracted claims**  
  - Type: LangChain Agent  
  - Role: Reviews all claims, removes duplicates by clustering similar points, ranks top 3 by relevance, evidence strength, and source credibility.  
  - Output: JSON array of top claims with rank and ranking reasons.

- **aggregation and ranking of extracted summaries**  
  - Type: LangChain Agent  
  - Role: Similar to claims ranking but for summaries; returns top 3 summaries ranked.

- **Structured Output Parser9 & Parser10**  
  - Parse the respective ranked arrays into structured data.

- **Merge**  
  - Type: Merge  
  - Role: Combines ranked claims and summaries outputs into final result.

**Edge Cases & Notes:**  
- Ranking depends on AI judgment; inconsistencies possible.  
- Duplicate detection based on semantic meaning may miss nuanced differences.  
- Output is designed for easy downstream consumption or display.  

---

### 2.7 Storage in Vector Database

**Overview:**  
Chunks processed article texts, creates embeddings using Ollama local model, and stores these in the Qdrant vector database for future semantic search and duplicate detection.

**Nodes Involved:**  
- Character Text Splitter2 (Splits text into chunks)  
- Default Data Loader2 (Prepares document data with metadata)  
- Embeddings Ollama1 (Generates vector embeddings)  
- Save (VectorStore Qdrant node for insertion)  

**Node Details:**

- **Character Text Splitter2**  
  - Type: Text Splitter  
  - Role: Splits normalized text into chunks of 3000 characters with 200 overlap to preserve context.

- **Default Data Loader2**  
  - Type: Document Data Loader  
  - Role: Prepares document chunks with metadata (url, title, description) for embedding.  
  - Input: Split normalized text.

- **Embeddings Ollama1**  
  - Type: Embeddings Generator  
  - Role: Uses Ollama API with "nomic-embed-text" model to generate embeddings for chunks.  
  - Credentials: Ollama API credentials required.

- **Save**  
  - Type: VectorStore Qdrant  
  - Role: Inserts embeddings and metadata into Qdrant collection specified in Set Node.  
  - Credentials: Qdrant API credentials required.  
  - Inserts are batched (batch size 1).

**Edge Cases & Notes:**  
- Large texts are chunked to avoid exceeding embedding size limits.  
- Ollama model must be available and responsive.  
- Qdrant must be configured and accessible at specified URL.  
- Failed insertions should be retried for data integrity.

---

## 3. Summary Table

| Node Name                           | Node Type                                     | Functional Role                                     | Input Node(s)                       | Output Node(s)                              | Sticky Note                                                                                                                       |
|-----------------------------------|-----------------------------------------------|----------------------------------------------------|-----------------------------------|---------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’  | Manual Trigger                                | Manual input of research query                      | -                                 | Set Node                                    |                                                                                                                                  |
| When Executed by Another Workflow | Execute Workflow Trigger                       | Input from external workflow with query parameter  | -                                 | Set Node                                    |                                                                                                                                  |
| Set Node                          | Set                                           | Initialize variables and parameters                 | When clicking ‘Execute workflow’, When Executed by Another Workflow | Smart Query Builder                         |                                                                                                                                  |
| Smart Query Builder               | LangChain Agent (AI)                           | Optimize research query into advanced search string| Set Node                          | Structured Output Parser                     | This node transforms user research queries into optimized Google search strings specifically designed for RAG systems.           |
| Structured Output Parser          | LangChain Output Parser Structured             | Parse optimized query JSON format                    | Smart Query Builder               | RAG Web Browser                             |                                                                                                                                  |
| RAG Web Browser                   | HTTP Request                                  | Scrape web pages with Apify RAG Web Browser actor  | Structured Output Parser          | Continue of No Error                         |                                                                                                                                  |
| Continue of No Error              | If Condition                                  | Check for HTTP 500 errors before continuing        | RAG Web Browser                  | Markdown Cleaner                            |                                                                                                                                  |
| Markdown Cleaner                 | Code                                          | Clean raw markdown content from scraped pages      | Continue of No Error             | Normalize text                              |                                                                                                                                  |
| Normalize text                   | Code                                          | Normalize cleaned markdown to plain text            | Markdown Cleaner                 | Duplicate Check                             |                                                                                                                                  |
| Duplicate Check                 | Code                                          | Check for duplicate URLs in Qdrant vector DB       | Normalize text                  | Set Values                                  |                                                                                                                                  |
| Set Values                      | Set                                           | Assign flags, metadata and query for processing     | Duplicate Check                 | Processing                                  |                                                                                                                                  |
| Processing                     | If Condition                                  | Gate: proceed only if not duplicate or skipped     | Set Values                     | Early Content Filter                        |                                                                                                                                  |
| Early Content Filter            | LangChain Agent (Claude AI)                     | Filter articles by relevance and quality            | Processing                     | Structured Output Parser1                    | This node quickly evaluates scraped web articles for relevance and quality.                                                      |
| Structured Output Parser1      | LangChain Output Parser Structured             | Parse Claude AI filtering results                    | Early Content Filter            | Continue Processing                         |                                                                                                                                  |
| Continue Processing            | If Condition                                  | Gate: proceed only if content should be processed  | Structured Output Parser1       | Edit Fields5                               |                                                                                                                                  |
| Edit Fields5                  | Set                                           | Prepare article metadata and text for AI analysis  | Continue Processing            | Insight Extraction, Summarization           |                                                                                                                                  |
| Insight Extraction            | LangChain Agent (GPT-4)                         | Extract detailed claims and insights from article  | Edit Fields5                  | Aggregate Output                            |                                                                                                                                  |
| Structured Output Parser3     | LangChain Output Parser Structured             | Parse extracted claims JSON                          | Insight Extraction             | Aggregate Output                            |                                                                                                                                  |
| Summarization                | LangChain Agent (GPT-4)                         | Generate concise article summaries                   | Edit Fields5                  | Aggregate Summaries                         |                                                                                                                                  |
| Structured Output Parser7     | LangChain Output Parser Structured             | Parse summary JSON                                   | Summarization                 | Aggregate Summaries                         |                                                                                                                                  |
| Aggregate Output              | Code                                          | Collect all extracted claims                         | Insight Extraction             | aggregation and ranking of extracted claims |                                                                                                                                  |
| Aggregate Summaries           | Code                                          | Collect all summaries                                | Summarization                 | aggregation and ranking of extracted summaries |                                                                                                                                  |
| aggregation and ranking of extracted claims | LangChain Agent (GPT-4)                | Rank and deduplicate claims, select top 3           | Aggregate Output              | Merge                                       |                                                                                                                                  |
| aggregation and ranking of extracted summaries | LangChain Agent (GPT-4)              | Rank and deduplicate summaries, select top 3        | Aggregate Summaries           | Merge                                       |                                                                                                                                  |
| Structured Output Parser9     | LangChain Output Parser Structured             | Parse ranked summaries                               | aggregation and ranking of extracted summaries | Merge                                       |                                                                                                                                  |
| Structured Output Parser10    | LangChain Output Parser Structured             | Parse ranked claims                                  | aggregation and ranking of extracted claims | Merge                                       |                                                                                                                                  |
| Merge                        | Merge                                          | Combine ranked claims and summaries outputs         | aggregation and ranking of extracted claims, aggregation and ranking of extracted summaries | -                                           |                                                                                                                                  |
| Character Text Splitter2      | Text Splitter                                  | Split text into chunks for embedding                 | Set Values (article text)       | Default Data Loader2                        |                                                                                                                                  |
| Default Data Loader2          | Document Data Loader                           | Prepare documents with metadata for embedding       | Character Text Splitter2        | Embeddings Ollama1                         |                                                                                                                                  |
| Embeddings Ollama1            | Embeddings Generator (Ollama API)               | Generate text embeddings for chunks                  | Default Data Loader2            | Save                                        |                                                                                                                                  |
| Save                         | VectorStore Qdrant                             | Insert embeddings into Qdrant vector database        | Embeddings Ollama1              | -                                           | Save Page for later reference                                                                                                   |

---

## 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**  
   - Add a **Manual Trigger** node named "When clicking ‘Execute workflow’" to allow manual input.  
   - Add an **Execute Workflow Trigger** node named "When Executed by Another Workflow" with an input parameter `query` (string).  

2. **Initialize Parameters:**  
   - Add a **Set** node named "Set Node" connected from both trigger nodes.  
   - Configure fields:  
     - `query`: `={{ $json.query }}` (from trigger input)  
     - `qdrant_url`: `"http://qdrant:6333"`  
     - `collection_name`: `"web_pages"`  
     - `max_results`: `10`  
     - `relevance_threshold`: `70`  

3. **Build Optimized Search Query:**  
   - Add a **LangChain Agent** node named "Smart Query Builder" connected to "Set Node".  
   - Use OpenAI GPT-4.1 Mini as language model (OpenAI API credentials required).  
   - Configure prompt to optimize the `query` into advanced Google search query JSON for Apify.  
   - Enable retry on failure.

4. **Parse Optimized Query:**  
   - Add a **LangChain Output Parser Structured** node named "Structured Output Parser".  
   - Configure with JSON schema matching Apify query format.  
   - Connect from "Smart Query Builder".

5. **Scrape Web Pages:**  
   - Add an **HTTP Request** node named "RAG Web Browser".  
   - Connect from "Structured Output Parser".  
   - POST request to `https://api.apify.com/v2/acts/apify~rag-web-browser/run-sync-get-dataset-items`.  
   - Use JSON body from the parsed optimized query.  
   - Set query parameters: `memory=4096`, `timeout=500`.  
   - Authenticate using Apify API credentials and Bearer token.  
   - Enable retry on failure.

6. **Check for API Errors:**  
   - Add an **If** node named "Continue of No Error".  
   - Condition: `$json.crawl.httpStatusCode != 500`.  
   - Connect from "RAG Web Browser".

7. **Clean Markdown Content:**  
   - Add a **Code** node named "Markdown Cleaner".  
   - Connect from "Continue of No Error".  
   - Implement JS code to clean markdown by removing navigation, images, references, HTML tags, and normalize whitespace.

8. **Normalize Text:**  
   - Add a **Code** node named "Normalize text".  
   - Connect from "Markdown Cleaner".  
   - Normalize cleaned markdown to lowercase plain text without punctuation.

9. **Duplicate Detection:**  
   - Add a **Code** node named "Duplicate Check".  
   - Connect from "Normalize text".  
   - Query Qdrant collection for existing entries by URL.  
   - Set flags `isDuplicate`, `skipProcessing` accordingly.

10. **Set Metadata and Flags:**  
    - Add a **Set** node named "Set Values".  
    - Connect from "Duplicate Check".  
    - Assign all relevant fields including metadata, cleaned and normalized text, duplicate flags, and original query.

11. **Gate Processing:**  
    - Add an **If** node named "Processing".  
    - Condition: `skipProcessing == false`.  
    - Connect from "Set Values".

12. **Early Content Filtering:**  
    - Add a **LangChain Agent** node named "Early Content Filter".  
    - Connect from "Processing".  
    - Use Anthropic Claude Sonnet 4 model (Anthropic API credentials required).  
    - Provide prompt to assess relevance and quality, output structured JSON with scores and decision.  
    - Enable retry and continue on error.

13. **Parse Filtering Output:**  
    - Add a **LangChain Output Parser Structured** node named "Structured Output Parser1".  
    - Connect from "Early Content Filter".  
    - Use JSON schema matching filtering output.

14. **Gate Full Processing:**  
    - Add an **If** node named "Continue Processing".  
    - Condition: `output.decision.process_further == true`.  
    - Connect from "Structured Output Parser1".

15. **Prepare Article Data:**  
    - Add a **Set** node named "Edit Fields5".  
    - Connect from "Continue Processing".  
    - Map article metadata, cleaned text, normalized text, query, and filtering outputs for AI analysis.

16. **Insight Extraction:**  
    - Add a **LangChain Agent** node named "Insight Extraction".  
    - Connect from "Edit Fields5".  
    - Use GPT-4.1 Mini with prompt to extract claims addressing the research question.  
    - Enable retry and continue on error.

17. **Parse Claims:**  
    - Add a **LangChain Output Parser Structured** node named "Structured Output Parser3".  
    - Connect from "Insight Extraction".

18. **Summarization:**  
    - Add a **LangChain Agent** node named "Summarization".  
    - Connect from "Edit Fields5".  
    - Use GPT-4.1 Mini with prompt for concise summaries focused on the research question.  
    - Enable retry and continue on error.

19. **Parse Summaries:**  
    - Add a **LangChain Output Parser Structured** node named "Structured Output Parser7".  
    - Connect from "Summarization".

20. **Aggregate Claims and Summaries:**  
    - Add two **Code** nodes named "Aggregate Output" and "Aggregate Summaries".  
    - Connect "Aggregate Output" from "Insight Extraction" output; collects all claims.  
    - Connect "Aggregate Summaries" from "Summarization" output; collects all summaries.

21. **Rank and Deduplicate Claims:**  
    - Add a **LangChain Agent** node named "aggregation and ranking of extracted claims".  
    - Connect from "Aggregate Output".  
    - Use GPT-4.1 Mini with prompt to rank and cluster claims, returning top 3.

22. **Rank and Deduplicate Summaries:**  
    - Add a **LangChain Agent** node named "aggregation and ranking of extracted summaries".  
    - Connect from "Aggregate Summaries".  
    - Use GPT-4.1 Mini with prompt to rank and cluster summaries, returning top 3.

23. **Parse Ranked Results:**  
    - Add **Structured Output Parser9** and **Structured Output Parser10** nodes.  
    - Connect from respective aggregation and ranking nodes.

24. **Merge Final Outputs:**  
    - Add a **Merge** node named "Merge".  
    - Connect from both ranking parser nodes.

25. **Text Chunking for Storage:**  
    - Add a **Character Text Splitter** node named "Character Text Splitter2".  
    - Connect from "Set Values" or appropriate node with normalized text.  
    - Configure chunk size 3000, overlap 200.

26. **Prepare Documents:**  
    - Add a **Default Data Loader** node named "Default Data Loader2".  
    - Connect from "Character Text Splitter2".  
    - Set metadata fields: url, title, description from article metadata.

27. **Generate Embeddings:**  
    - Add an **Embeddings Ollama** node named "Embeddings Ollama1".  
    - Connect from "Default Data Loader2".  
    - Use Ollama API credentials with "nomic-embed-text:latest" model.

28. **Store in Qdrant:**  
    - Add a **VectorStore Qdrant** node named "Save".  
    - Connect from "Embeddings Ollama1".  
    - Use Qdrant API credentials.  
    - Set insert mode and collection name as from "Set Node".

---

## 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Context or Link                                                                                      |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| This workflow demonstrates a sophisticated AI-powered research pipeline integrating multiple services (OpenAI GPT-4, Anthropic Claude, Apify, Qdrant, Ollama) to deliver credible and up-to-date insights automatically from the web. It is ideal for business intelligence, compliance, content research, consulting, and academic projects.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Workflow purpose description                                                                        |
| Security note: Replace hardcoded Apify API key and local URLs with secure credentials and real service endpoints before production use.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Sticky Note7 content                                                                                |
| Helpful community and support are available via [n8n Discord](https://discord.com/invite/XPKeKXeB7d) and [n8n Forum](https://community.n8n.io/).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Sticky Note7 content                                                                                |
| The Smart Query Builder node applies advanced search operators and excludes many low-quality domains (social media, forums, marketplaces) to maximize the quality of retrieved documents. This is crucial for effective research.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Sticky Note content on Smart Query Builder                                                        |
| Early Content Filter uses Claude Sonnet 4 AI to rapidly evaluate relevance and quality, saving API costs by skipping irrelevant or low-quality articles.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Sticky Note2                                                                                       |
| Content Analysis block extracts concrete claims and summaries focused on answering the research question, then ranks them intelligently to provide concise, actionable research outputs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Sticky Note3                                                                                       |
| Qdrant vector database is used for both duplicate detection and storage of vector embeddings for semantic search and future reuse. Ollama provides local embeddings to reduce dependency on external API calls.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Sticky Note1 and general Qdrant/Ollama usage notes                                                 |

---

**Disclaimer:**  
The provided text is extracted exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to applicable content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.

---