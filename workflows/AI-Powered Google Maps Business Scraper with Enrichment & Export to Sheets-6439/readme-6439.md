AI-Powered Google Maps Business Scraper with Enrichment & Export to Sheets

https://n8nworkflows.xyz/workflows/ai-powered-google-maps-business-scraper-with-enrichment---export-to-sheets-6439


# AI-Powered Google Maps Business Scraper with Enrichment & Export to Sheets

### 1. Workflow Overview

This workflow automates the process of discovering, extracting, enriching, and exporting detailed business information from Google Maps search queries. It is designed for use cases such as lead generation, local business research, digital marketing, and automated outreach. The workflow performs keyword-driven Google Maps searches, scrapes business website URLs, enriches the data using an AI-powered scraper and language model, and stores the results in Google Sheets for further use.

The workflow is logically divided into the following blocks:

- **1.1 Trigger & Input Reception:** Scheduled trigger initiates the workflow periodically and reads search queries from a Google Sheet.
- **1.2 Google Maps Search & URL Extraction:** Performs Google Maps searches for each query and scrapes business URLs from the results.
- **1.3 URL Filtering & Deduplication:** Filters out irrelevant or internal URLs and removes duplicates to ensure clean input for enrichment.
- **1.4 Business Data Scraping & Enrichment:** For each unique URL, checks for existing records, scrapes business details via APIFY, and enriches data with an AI agent.
- **1.5 Data Processing & Storage:** Converts AI responses to structured JSON, aggregates data, and saves enriched business profiles to a Google Sheet.
- **1.6 Query State Management & Execution Control:** Marks queries as processed and controls execution pacing with wait nodes.

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger & Input Reception

**Overview:**  
This block starts the workflow on a scheduled hourly basis and retrieves unprocessed search queries from a Google Sheet named `keywords`.

**Nodes Involved:**  
- Schedule Trigger  
- Get row(s) in sheet  
- Loop over queries

**Node Details:**  
- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates workflow every hour automatically.  
  - Configuration: Runs on an hourly interval.  
  - Inputs: None  
  - Outputs: Passes trigger event to subsequent node.  
  - Edge Cases: Missed triggers if n8n instance is offline.

- **Get row(s) in sheet**  
  - Type: Google Sheets (Read)  
  - Role: Reads rows from the `keywords` tab of a Google Sheet filtering for unprocessed queries.  
  - Configuration: Filters rows where `processed` column is empty.  
  - Credentials: Google Sheets OAuth2  
  - Inputs: Trigger from scheduler  
  - Outputs: Array of query rows to process  
  - Edge Cases: API errors, empty query set, rate limits.

- **Loop over queries**  
  - Type: SplitInBatches  
  - Role: Processes each query individually in batches.  
  - Configuration: Default batch options, iterates over queries.  
  - Inputs: Queries array from sheet  
  - Outputs: One query item per iteration  
  - Edge Cases: Large query sets may cause long runtime.

---

#### 2.2 Google Maps Search & URL Extraction

**Overview:**  
Performs Google Maps search HTTP requests for each query, parses the HTML response to extract business URLs.

**Nodes Involved:**  
- Starts scraper workflow  
- Search Google Maps with query  
- Scrape URLs from results

**Node Details:**  
- **Starts scraper workflow**  
  - Type: Execute Workflow Trigger  
  - Role: Entry point for scraping workflow; initiated with initial query data.  
  - Inputs: From Loop over queries  
  - Outputs: Triggers the Google Maps search node.

- **Search Google Maps with query**  
  - Type: HTTP Request  
  - Role: Sends HTTP GET request to Google Maps search URL constructed from query.  
  - Configuration: URL template `https://www.google.com/maps/search/{{ $json.query }}`  
  - Inputs: Query string from previous node  
  - Outputs: Raw HTML data of search results  
  - Edge Cases: Google blocking, CAPTCHA, request timeouts.

- **Scrape URLs from results**  
  - Type: Code (JavaScript)  
  - Role: Parses raw HTML response using regex to extract URLs.  
  - Configuration: Uses regex `/https?:\/\/[^\/]+/g` to match URLs.  
  - Inputs: Raw HTML string  
  - Outputs: List of extracted URLs in JSON format  
  - Edge Cases: Incorrect parsing if Google changes page structure, regex misses URLs.

---

#### 2.3 URL Filtering & Deduplication

**Overview:**  
Filters out irrelevant URLs such as Google-owned domains and removes duplicate URLs to prepare for further processing.

**Nodes Involved:**  
- Filter irrelevant URLs  
- Remove Duplicate URLs

**Node Details:**  
- **Filter irrelevant URLs**  
  - Type: Filter  
  - Role: Excludes URLs matching patterns like google.com, gstatic.com, example.com, etc.  
  - Configuration: Negative regex match on domain names including `google|gstatic|ggpht|schema.org|example.com|sentry-next.wixpress.com|imli.com|sentry.wixpress.com|ingest.sentry.io`  
  - Inputs: Extracted URLs  
  - Outputs: Filtered URLs only  
  - Edge Cases: False negatives if domain patterns evolve.

- **Remove Duplicate URLs**  
  - Type: Remove Duplicates  
  - Role: Removes duplicate URLs from the filtered list.  
  - Configuration: Default deduplication on `url` field  
  - Inputs: Filtered URLs  
  - Outputs: Unique URLs only  
  - Edge Cases: Case sensitivity or URL variants may cause missed duplicates.

---

#### 2.4 Business Data Scraping & Enrichment

**Overview:**  
For each unique business URL, this block checks for existing data in the Google Sheet, scrapes detailed business information using APIFY, and uses an AI agent to generate enriched business insights.

**Nodes Involved:**  
- Loop over URLs  
- get records if exist  
- Aggregate1  
- Code1  
- Merge  
- If  
- use APIFY  
- Aggregate  
- Code  
- AI Agent  
- OpenRouter Chat Model  
- convert string to json object

**Node Details:**  
- **Loop over URLs**  
  - Type: SplitInBatches  
  - Role: Iterates over each unique URL batch for processing.  
  - Configuration: Batch processing, continues on error.  
  - Inputs: Unique URLs  
  - Outputs: One URL item per iteration  
  - Edge Cases: Large URL sets may increase runtime.

- **get records if exist**  
  - Type: Google Sheets (Read)  
  - Role: Checks if the business URL already exists in the output Google Sheet to prevent duplication.  
  - Configuration: Reads all rows from `Sheet1`.  
  - Credentials: Google Sheets OAuth2  
  - Inputs: Current URL  
  - Outputs: Existing matching rows or empty  
  - Edge Cases: API errors, large sheet size.

- **Aggregate1**  
  - Type: Aggregate  
  - Role: Aggregates website URLs from existing records for comparison.  
  - Configuration: Aggregation on `website_url` field.  
  - Inputs: Data from previous node  
  - Outputs: Aggregated URL list  
  - Edge Cases: None significant.

- **Code1**  
  - Type: Code (JavaScript)  
  - Role: Compares current URL domain to existing URLs to set `dontExist` flag indicating if URL is new.  
  - Inputs: Aggregated URLs, current URL  
  - Outputs: JSON with boolean `dontExist`  
  - Edge Cases: Invalid URLs, domain extraction failures.

- **Merge**  
  - Type: Merge (SQL Combine)  
  - Role: Combines current URL data with existing records for conditional branching.  
  - Inputs: Current URL and existing record checks  
  - Outputs: Combined data  
  - Edge Cases: Data mismatch.

- **If**  
  - Type: If Condition  
  - Role: Branches workflow based on whether URL does not exist in sheet (`dontExist == true`).  
  - Inputs: Merge output  
  - Outputs: True branch (new URL), False branch (existing URL)  
  - Edge Cases: Expression evaluation errors.

- **use APIFY**  
  - Type: HTTP Request  
  - Role: Calls APIFY Actor API to scrape detailed business data from the website URL.  
  - Configuration: POST request with JSON body including URL and prompt for scraper.  
  - Inputs: New URL (true branch)  
  - Outputs: Raw business data JSON  
  - Edge Cases: API token issues, rate limits, scraper failures.

- **Aggregate**  
  - Type: Aggregate  
  - Role: Aggregates the data array returned by APIFY for further processing.  
  - Inputs: APIFY response data  
  - Outputs: Aggregated business data  
  - Edge Cases: Empty or malformed data.

- **Code**  
  - Type: Code (JavaScript)  
  - Role: Concatenates AI prompt results into a single string for AI agent input.  
  - Inputs: Aggregated APIFY data  
  - Outputs: Combined prompt string  
  - Edge Cases: Empty data.

- **AI Agent**  
  - Type: LangChain AI Agent (OpenRouter Gemini 2.5)  
  - Role: Generates a detailed JSON business profile and insights based on the prompt from APIFY data.  
  - Configuration: System message instructing detailed business analysis; outputs JSON only.  
  - Credentials: OpenRouter API key  
  - Inputs: Concatenated prompt text  
  - Outputs: AI-generated JSON string (business profile)  
  - Edge Cases: API errors, malformed output, rate limits.

- **OpenRouter Chat Model**  
  - Type: LangChain LM Chat OpenRouter  
  - Role: Language model used by AI Agent for generation.  
  - Credentials: OpenRouter account  
  - Inputs/Outputs: Controlled by AI Agent node.  
  - Edge Cases: Same as AI Agent.

- **convert string to json object**  
  - Type: Code (JavaScript)  
  - Role: Parses AI agent text output into JSON object, handling markdown code blocks and JSON parsing errors gracefully.  
  - Inputs: AI Agent output text  
  - Outputs: Structured JSON object or error JSON  
  - Edge Cases: Invalid JSON, parsing failures.

---

#### 2.5 Data Processing & Storage

**Overview:**  
Stores the final enriched business data into the output Google Sheet and continues processing subsequent URLs.

**Nodes Involved:**  
- Save DATA to Google Sheet1  
- Loop over URLs (second connection)

**Node Details:**  
- **Save DATA to Google Sheet1**  
  - Type: Google Sheets (Append)  
  - Role: Appends the enriched business data fields into the main output sheet (`Sheet1`).  
  - Configuration: Auto-mapping of all business data fields to columns such as Business Name, Website URL, Email, Phone, etc., including AI description.  
  - Credentials: Google Sheets OAuth2  
  - Inputs: Parsed JSON from AI Agent  
  - Outputs: Confirmation of append operation  
  - Edge Cases: API quota, column mismatch, data truncation.

- **Loop over URLs**  
  - Role: Iterates over all URLs to process saving results.  
  - Inputs: Enriched business data  
  - Outputs: Continues loop or ends iteration.

---

#### 2.6 Query State Management & Execution Control

**Overview:**  
Marks each processed search query as completed in the original Google Sheet and controls pacing between query executions.

**Nodes Involved:**  
- Execute scraper for query  
- Update row in sheet  
- Wait between executions

**Node Details:**  
- **Execute scraper for query**  
  - Type: Execute Workflow  
  - Role: Executes the scraping and enrichment sub-workflow for each query.  
  - Configuration: Runs without waiting for sub-workflow completion to allow concurrency.  
  - Inputs: One query item  
  - Outputs: Triggers sub-workflow execution.

- **Update row in sheet**  
  - Type: Google Sheets (Update)  
  - Role: Marks the `processed` column as TRUE for the current query to prevent reprocessing.  
  - Configuration: Matches rows based on query string; updates `processed` to TRUE.  
  - Credentials: Google Sheets OAuth2  
  - Inputs: Query item  
  - Outputs: Confirmation of update.

- **Wait between executions**  
  - Type: Wait  
  - Role: Adds a 20-minute delay between batches of query processing to avoid rate limits or throttling.  
  - Configuration: Waits 20 minutes per execution cycle  
  - Inputs: Update confirmation  
  - Outputs: Triggers next batch of queries.  
  - Edge Cases: Potential workflow idling or timeout.

---

### 3. Summary Table

| Node Name               | Node Type                         | Functional Role                                    | Input Node(s)             | Output Node(s)                      | Sticky Note                                                                                                                                    |
|-------------------------|----------------------------------|---------------------------------------------------|---------------------------|-----------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger        | Schedule Trigger                 | Initiates workflow hourly                          | -                         | Get row(s) in sheet               | Overview: This workflow automates the discovery, extraction, enrichment, and storage of business information from Google Maps search queries... |
| Get row(s) in sheet    | Google Sheets                   | Reads unprocessed queries from sheet               | Schedule Trigger           | Loop over queries                 | Same as above                                                                                                                                   |
| Loop over queries       | SplitInBatches                  | Iterates over each query                            | Get row(s) in sheet        | Execute scraper for query         | Same as above                                                                                                                                   |
| Execute scraper for query| Execute Workflow                | Runs scraper sub-workflow per query                 | Loop over queries          | Update row in sheet               | Same as above                                                                                                                                   |
| Update row in sheet     | Google Sheets                   | Marks query as processed                            | Execute scraper for query  | Wait between executions           | Same as above                                                                                                                                   |
| Wait between executions | Wait                           | Pauses workflow between query batches               | Update row in sheet        | Loop over queries                 | Same as above                                                                                                                                   |
| Starts scraper workflow | Execute Workflow Trigger        | Entry point for Google Maps search                  | Loop over queries          | Search Google Maps with query     | Same as above                                                                                                                                   |
| Search Google Maps with query | HTTP Request                 | Performs Google Maps search                         | Starts scraper workflow    | Scrape URLs from results          | Same as above                                                                                                                                   |
| Scrape URLs from results| Code                           | Extracts URLs from search HTML                       | Search Google Maps with query | Filter irrelevant URLs           | Same as above                                                                                                                                   |
| Filter irrelevant URLs  | Filter                         | Filters out unwanted domains                        | Scrape URLs from results   | Remove Duplicate URLs             | Same as above                                                                                                                                   |
| Remove Duplicate URLs   | Remove Duplicates              | Removes duplicate URLs                              | Filter irrelevant URLs     | Loop over URLs                   | Same as above                                                                                                                                   |
| Loop over URLs          | SplitInBatches                | Iterates over each unique URL                       | Remove Duplicate URLs      | Merge, get records if exist       | Same as above                                                                                                                                   |
| get records if exist    | Google Sheets                 | Checks if URL already exists in output sheet        | Loop over URLs             | Aggregate1                      | Same as above                                                                                                                                   |
| Aggregate1              | Aggregate                     | Aggregates website URLs from existing data          | get records if exist       | Code1                          | Same as above                                                                                                                                   |
| Code1                   | Code                          | Compares URL domains to set existence flag          | Aggregate1                 | Merge                          | Same as above                                                                                                                                   |
| Merge                   | Merge (SQL Combine)            | Combines current URL with existing record data      | Loop over URLs, Code1      | If                            | Same as above                                                                                                                                   |
| If                      | If Condition                  | Branches based on whether URL is new                 | Merge                      | use APIFY (true), Loop over URLs (false) | Same as above                                                                                                                                   |
| use APIFY               | HTTP Request                 | Calls APIFY API to scrape detailed business data    | If (true branch)           | Aggregate                      | Same as above                                                                                                                                   |
| Aggregate               | Aggregate                     | Aggregates APIFY scraped data                        | use APIFY                  | Code                          | Same as above                                                                                                                                   |
| Code                    | Code                          | Concatenates prompt results for AI input            | Aggregate                  | AI Agent                      | Same as above                                                                                                                                   |
| AI Agent                | LangChain AI Agent            | Generates AI-enriched business profile in JSON      | Code                       | convert string to json object   | Same as above                                                                                                                                   |
| OpenRouter Chat Model   | LangChain LM Chat             | Language model used by AI Agent                       | AI Agent                   | AI Agent                      | Same as above                                                                                                                                   |
| convert string to json object | Code                      | Parses AI text output to JSON                          | AI Agent                   | Save DATA to Google Sheet1      | Same as above                                                                                                                                   |
| Save DATA to Google Sheet1 | Google Sheets                | Appends enriched business data to output sheet       | convert string to json object | Loop over URLs                 | Same as above                                                                                                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Set to run every hour.

2. **Add a Google Sheets node (Get row(s) in sheet)**  
   - Set operation to "Read Rows" from the `keywords` sheet/tab.  
   - Set filter to select rows where `processed` column is empty.  
   - Connect Schedule Trigger output to this node.

3. **Add a SplitInBatches node (Loop over queries)**  
   - Connect input from Google Sheets node.  
   - Use default batch size to process each query individually.

4. **Add an Execute Workflow Trigger node (Starts scraper workflow)**  
   - Connect input from Loop over queries.  
   - This node triggers the scraping sub-workflow for each query.

5. **Inside the scraper sub-workflow, create an HTTP Request node (Search Google Maps with query)**  
   - URL: `https://www.google.com/maps/search/{{ $json.query }}`  
   - Method: GET  
   - Connect input from Execute Workflow Trigger node.

6. **Add a Code node (Scrape URLs from results)**  
   - Use JavaScript to extract URLs from HTML using regex `/https?:\/\/[^\/]+/g`.  
   - Connect input from HTTP Request node.

7. **Add a Filter node (Filter irrelevant URLs)**  
   - Filter out domains matching `google|gstatic|ggpht|schema.org|example.com|sentry-next.wixpress.com|imli.com|sentry.wixpress.com|ingest.sentry.io`.  
   - Connect input from Code node.

8. **Add a Remove Duplicates node (Remove Duplicate URLs)**  
   - Remove duplicates based on `url` field.  
   - Connect input from Filter node.

9. **Add a SplitInBatches node (Loop over URLs)**  
   - Connect input from Remove Duplicates node.  
   - Configure to continue on error.

10. **Add a Google Sheets node (get records if exist)**  
    - Reads rows from output sheet (`Sheet1`) to check for existing URLs.  
    - Connect input from Loop over URLs.

11. **Add an Aggregate node (Aggregate1)**  
    - Aggregate website URLs from existing data.  
    - Connect input from get records if exist node.

12. **Add a Code node (Code1)**  
    - Compare domain of current URL to aggregated URLs; set boolean `dontExist`.  
    - Connect input from Aggregate1.

13. **Add a Merge node**  
    - Combine current URL data and existence check.  
    - Connect inputs from Loop over URLs and Code1.

14. **Add an If node (If)**  
    - Condition: `dontExist == true` (URL is new).  
    - Connect input from Merge node.

15. **Add an HTTP Request node (use APIFY)**  
    - POST to APIFY API with business URL and scraping prompt.  
    - Use token credential for authorization.  
    - Connect to true branch of If node.

16. **Add an Aggregate node (Aggregate)**  
    - Aggregate APIFY response items.  
    - Connect input from use APIFY.

17. **Add a Code node (Code)**  
    - Concatenate prompt results for AI input text.  
    - Connect input from Aggregate.

18. **Add an AI Agent node (AI Agent)**  
    - Use OpenRouter Gemini 2.5 model.  
    - Configure system message with business analysis prompt.  
    - Connect input from Code node.  
    - Set OpenRouter API credentials.

19. **Add a Code node (convert string to json object)**  
    - Parse AI output text removing markdown wrappers.  
    - Connect input from AI Agent.

20. **Add a Google Sheets node (Save DATA to Google Sheet1)**  
    - Append enriched business data to output sheet (`Sheet1`).  
    - Map all fields automatically.  
    - Connect input from convert string to json object.

21. **Connect false branch of If node**  
    - Back to Loop over URLs node to continue processing next URLs.

22. **Back to main workflow:**  
    - Add a Google Sheets node (Update row in sheet)  
      - Update the `processed` column to TRUE for each query after processing.  
      - Connect from Execute scraper for query node.

23. **Add a Wait node (Wait between executions)**  
    - Set to wait 20 minutes between processing batches of queries.  
    - Connect input from Update row in sheet and output back to Loop over queries to continue next batch.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Context or Link                                                                                  |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow automates the discovery, extraction, enrichment, and storage of business information from Google Maps search queries using AI tools, scrapers, and Google Sheets. It is ideal for lead generation agencies, local business researchers, digital marketing firms, and automation specialists. The process includes scheduled triggers, Google Sheets integration, URL scraping, AI enrichment with LangChain Gemini 2.5, and data storage.                                                                                                  | Workflow overview sticky note in the source workflow.                                          |
| Uses APIFY actor `firescraper-ai-prompt-website-content-markdown-scraper` to extract website content with a prompt designed for expert business analysis and JSON output.                                                                                                                                                                                                                                                                                                                                                                   | APIFY actor API call.                                                                           |
| AI Agent uses OpenRouter API with Gemini 2.5 Flash Lite model to generate detailed business profiles with insights on services, market position, technology, and possible collaboration points.                                                                                                                                                                                                                                                                                                                                            | OpenRouter Chat Model and AI Agent nodes.                                                      |
| Google Sheets document ID: `1si2IQusnIF-Br8JdXSVd_Z9QvnXrKcieXOkxI0Xz9ks` with tabs `keywords` (for queries) and `Sheet1` (for output data). Credentials require Google Sheets OAuth2 authorization.                                                                                                                                                                                                                                                                                                                                           | Google Sheets nodes configuration.                                                            |
| The workflow handles errors gracefully with continue on error on key nodes such as URL looping and APIFY requests to ensure robust long-running execution.                                                                                                                                                                                                                                                                                                                                                                              | Error handling notes.                                                                           |
| Contact for custom AI-powered automation workflows: msaidwolfltd@gmail.com                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Contact email in sticky note.                                                                  |

---

**Disclaimer:** The provided text is exclusively derived from an automated workflow created with n8n, a workflow automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected material. All handled data is legal and publicly available.