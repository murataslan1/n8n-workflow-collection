Automate Niche Research with Wikipedia, GPT-4o-mini, and Google Sheets

https://n8nworkflows.xyz/workflows/automate-niche-research-with-wikipedia--gpt-4o-mini--and-google-sheets-11482


# Automate Niche Research with Wikipedia, GPT-4o-mini, and Google Sheets

### 1. Workflow Overview

This workflow automates niche research by retrieving and processing Wikipedia content for a given topic. It is designed for content creators, marketers, researchers, or anyone needing structured historical information on a niche subject. The workflow orchestrates Wikipedia search, page scraping, AI-powered summarization, and data storage in Google Sheets.

Logical blocks:

- **1.1 Input Reception**: Accept user topic input manually.
- **1.2 Wikipedia Search & URL Construction**: Search Wikipedia API for the relevant page and construct URLs.
- **1.3 Page Scraping**: Use ScrapeOps to fetch the full Wikipedia page HTML.
- **1.4 History Section Extraction**: Extract the "History" or equivalent section from the raw HTML.
- **1.5 AI Processing**: Send extracted history and metadata to GPT-4o-mini to generate structured JSON with summary and timeline.
- **1.6 Output Storage**: Parse AI response and append the structured data into a Google Sheet.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview**  
  This block triggers the workflow execution and sets the initial research topic.

- **Nodes Involved**  
  - When clicking "Execute Workflow" (Manual Trigger)  
  - Set Topic

- **Node Details**

  1. **When clicking "Execute Workflow"**  
     - Type: Manual Trigger  
     - Role: Starts the workflow manually on user demand.  
     - Configuration: No parameters; default manual trigger.  
     - Input: None  
     - Output: Triggers "Set Topic" node.  
     - Edge cases: None applicable; fails only if the user does not trigger.

  2. **Set Topic**  
     - Type: Set  
     - Role: Defines the research topic parameter for downstream nodes.  
     - Configuration: Hardcoded string value `"n8n"` as the default topic. User can modify this to any keyword.  
     - Key Variables: `topic` field with string value.  
     - Input: Trigger from manual node.  
     - Output: Passes `topic` to "Wikipedia Search API".  
     - Edge cases: If left empty or invalid topic string, Wikipedia search may fail or return empty results.

#### 2.2 Wikipedia Search & URL Construction

- **Overview**  
  Queries Wikipedia's search API to find the best matching page for the topic and constructs the Wikipedia page URL to be used for scraping.

- **Nodes Involved**  
  - Wikipedia Search API  
  - Construct Page URL

- **Node Details**

  1. **Wikipedia Search API**  
     - Type: HTTP Request  
     - Role: Calls Wikipedia's API to search pages by topic.  
     - Configuration:  
       - URL: `https://en.wikipedia.org/w/api.php`  
       - Query parameters: `action=query`, `list=search`, `srsearch={{ $json.topic }}`, `format=json`  
       - Headers: User-Agent set to identify requests from n8n.  
     - Inputs: Receives `topic` from "Set Topic".  
     - Outputs: Wikipedia search results JSON.  
     - Edge cases:  
       - Empty or invalid topic returns no search results.  
       - Network or API rate limiting errors possible.  
       - Wikipedia API changes may break query parameters.

  2. **Construct Page URL**  
     - Type: Code  
     - Role: Extracts the first search result title and builds Wikipedia page and search URLs.  
     - Configuration:  
       - Reads search results from previous node.  
       - Throws error if no pages found.  
       - Encodes page title for URL usage.  
       - Outputs:  
         - `topic` (original)  
         - `wikipedia_page_title` (first matched title)  
         - `wikipedia_page_url` (full Wikipedia URL)  
         - `search_query_url` (original Wikipedia search API URL for reference)  
     - Inputs: Wikipedia Search API results.  
     - Outputs: JSON with URLs and metadata.  
     - Edge cases:  
       - No search results triggers explicit error stopping workflow.

#### 2.3 Page Scraping

- **Overview**  
  Uses ScrapeOps scraper node to retrieve the full HTML content of the Wikipedia page reliably, rendering JavaScript if needed.

- **Nodes Involved**  
  - ScrapeOps Scraper

- **Node Details**

  1. **ScrapeOps Scraper**  
     - Type: ScrapeOps node (custom integration)  
     - Role: Scrapes the Wikipedia page HTML content using ScrapeOps API with JS rendering enabled to bypass protections.  
     - Configuration:  
       - URL: `={{ $json.wikipedia_page_url }}` from previous node  
       - Advanced option: `render_js` set true  
       - Credential: ScrapeOps API key (required)  
     - Inputs: Receives Wikipedia page URL from "Construct Page URL"  
     - Outputs: Full HTML content of the page  
     - Edge cases:  
       - API quota exceeded or invalid API key causes failures.  
       - Network errors or page not found errors.  
       - Page structure change can affect downstream extraction.  
     - Notes: Requires ScrapeOps account and configured credentials.

#### 2.4 History Section Extraction

- **Overview**  
  Extracts the relevant "History", "Origins", or "Background" section text from the raw HTML obtained via ScrapeOps.

- **Nodes Involved**  
  - Extract History Section (Code)

- **Node Details**

  1. **Extract History Section**  
     - Type: Code  
     - Role: Parses the HTML string, cleans it by removing scripts, styles, tables, references, and extracts paragraphs under relevant headers.  
     - Configuration:  
       - Regex-based extraction searching `<h2>` or `<h3>` headers containing keywords (History, Origins, Background).  
       - Extracts paragraphs until next header.  
       - Fallback: extracts first 5 paragraphs if specific section not found.  
       - Cleans HTML tags and special characters/entities.  
       - Removes citation/references in square brackets.  
       - Returns raw concatenated history text with paragraphs separated by double newlines.  
       - Also retains metadata from "Construct Page URL" node.  
     - Inputs: HTML content from ScrapeOps Scraper, plus metadata.  
     - Outputs: JSON containing raw history text (`history_raw`) and metadata fields.  
     - Edge cases:  
       - If Wikipedia page format changes or no relevant headers found, fallback extracts first paragraphs.  
       - HTML malformed or incomplete content may affect extraction.  
     - Version: Requires n8n supporting code node v2 features (regex, string methods).

#### 2.5 AI Processing

- **Overview**  
  Sends the extracted raw history and metadata to OpenAI GPT-4o-mini model, requesting a strictly formatted JSON object with cleaned summaries and timeline.

- **Nodes Involved**  
  - Message a model (OpenAI)  
  - Format AI Output (Code)

- **Node Details**

  1. **Message a model**  
     - Type: OpenAI (LangChain integration)  
     - Role: Sends prompt to GPT-4o-mini instructing it to return a single valid JSON object containing specific keys: Topic, Search_Query_URL, Wikipedia_Page_Title, Wikipedia_PAGE_URL, History_Raw, History_Cleaned, History_Summary, Timeline.  
     - Configuration:  
       - Model: `gpt-4o-mini`  
       - Messages:  
         - System message instructing strict JSON-only output, no extra text or markdown.  
         - User message includes topic, Wikipedia page title & URL, search query URL, and raw history text.  
       - Credentials: OpenAI API key required.  
       - Execute Once: true (to avoid repeated calls if multiple items)  
     - Inputs: JSON with raw history and metadata.  
     - Outputs: AI response JSON text.  
     - Edge cases:  
       - API call failures, rate limits, or invalid key errors.  
       - Model output malformed or not JSON compliant, requiring fallback handling.

  2. **Format AI Output**  
     - Type: Code  
     - Role: Parses AI response to extract and normalize the JSON object, handling various possible response shapes and escaping issues.  
     - Configuration:  
       - Tries multiple known JSON locations in AI response payload.  
       - Removes backticks, extracts first JSON block.  
       - Parses string with fallback for escaped newlines.  
       - Extracts required keys with tolerant key lookup (case-insensitive).  
       - Converts Timeline array or string into newline-separated string.  
       - Unescapes double-escaped newlines for readability.  
     - Inputs: AI raw response JSON.  
     - Outputs: Cleaned JSON with fields: Topic, Search_Query_URL, Wikipedia_Page_Title, Wikipedia_PAGE_URL, History_Raw, History_Cleaned, History_Summary, Timeline.  
     - Edge cases:  
       - Parsing errors return JSON with parse_error and raw text for diagnostics.

#### 2.6 Output Storage

- **Overview**  
  Appends the final structured data into a specified Google Sheet for historical record keeping and further use.

- **Nodes Involved**  
  - Append row in sheet (Google Sheets)

- **Node Details**

  1. **Append row in sheet**  
     - Type: Google Sheets  
     - Role: Adds a new row to a Google Sheet with columns matching the structured data fields.  
     - Configuration:  
       - Operation: Append  
       - Document ID: URL of the target Google Sheet (template provided).  
       - Sheet Name: `gid=0` (default first sheet)  
       - Columns mapped to keys: Topic, Timeline, History_Raw, History_Cleaned, History_Summary, Search_Query_URL, Wikipedia_Page_URL, Wikipedia_Page_Title  
       - Credential: Google OAuth2 account connected for access  
     - Inputs: Cleaned JSON from AI output formatting node.  
     - Outputs: Confirmation of row appended.  
     - Edge cases:  
       - Authorization failure if Google credentials invalid or expired.  
       - Sheet ID or permissions issues prevent append.  
       - Data type mismatches if any column expects different type.

---

### 3. Summary Table

| Node Name               | Node Type                     | Functional Role                      | Input Node(s)               | Output Node(s)             | Sticky Note                                                                                                                           |
|-------------------------|-------------------------------|------------------------------------|-----------------------------|----------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| When clicking "Execute Workflow" | Manual Trigger                | Starts workflow manually            | None                        | Set Topic                  | ## 1. Input Define your research topic here.                                                                                         |
| Set Topic               | Set                           | Defines the research topic          | When clicking "Execute Workflow" | Wikipedia Search API        | ## 1. Input Define your research topic here.                                                                                         |
| Wikipedia Search API    | HTTP Request                  | Searches Wikipedia for topic        | Set Topic                   | Construct Page URL         | ## 2. Search & Scrape Find and retrieve the Wikipedia page using ScrapeOps.                                                          |
| Construct Page URL      | Code                          | Builds Wikipedia page and query URLs| Wikipedia Search API        | ScrapeOps Scraper          | ## 2. Search & Scrape Find and retrieve the Wikipedia page using ScrapeOps.                                                          |
| ScrapeOps Scraper       | ScrapeOps Scraper             | Retrieves full Wikipedia page HTML  | Construct Page URL          | Extract History Section    | ## 2. Search & Scrape Find and retrieve the Wikipedia page using ScrapeOps. See https://scrapeops.io/docs/n8n/overview/               |
| Extract History Section | Code                          | Extracts and cleans history section | ScrapeOps Scraper           | Message a model            | ## 3. Process & Analyze Extract history sections and use AI to summarize.                                                             |
| Message a model         | OpenAI (LangChain integration)| Requests structured summary and timeline | Extract History Section     | Format AI Output           | ## 3. Process & Analyze Extract history sections and use AI to summarize.                                                             |
| Format AI Output        | Code                          | Parses and normalizes AI response   | Message a model             | Append row in sheet        | ## 4. Output Save the structured data to Google Sheets.                                                                               |
| Append row in sheet     | Google Sheets                 | Saves data to Google Sheet          | Format AI Output            | None                      | ## 4. Output Save the structured data to Google Sheets. See https://docs.google.com/spreadsheets/d/1P0wZ449wVNndhSa6cJtK3VA3Aulv1k18zdpwWYY13gE/edit?gid=0#gid=0 |
| Sticky Note             | Sticky Note                   | Documentation and instructions      | None                        | None                      | # 📜 Wikipedia Niche History Generator ... See full note in workflow overview.                                                       |
| Sticky Note1            | Sticky Note                   | Label for Input section             | None                        | None                      | ## 1. Input Define your research topic here.                                                                                         |
| Sticky Note2            | Sticky Note                   | Label for Search & Scrape section   | None                        | None                      | ## 2. Search & Scrape Find and retrieve the Wikipedia page using ScrapeOps.                                                          |
| Sticky Note3            | Sticky Note                   | Label for Process & Analyze section | None                        | None                      | ## 3. Process & Analyze Extract history sections and use AI to summarize.                                                             |
| Sticky Note4            | Sticky Note                   | Label for Output section            | None                        | None                      | ## 4. Output Save the structured data to Google Sheets.                                                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - No parameters required.

2. **Create Set Node ("Set Topic")**  
   - Connect manual trigger to this node.  
   - Add a field `topic` (string) with default value `"n8n"` (modifiable).  
   - This sets the research topic.

3. **Create HTTP Request Node ("Wikipedia Search API")**  
   - Connect "Set Topic" output to this node.  
   - Set HTTP Method to GET.  
   - URL: `https://en.wikipedia.org/w/api.php`  
   - Query Parameters:  
     - `action`: `query`  
     - `list`: `search`  
     - `srsearch`: Expression referencing `{{$json["topic"]}}`  
     - `format`: `json`  
   - Add header:  
     - `User-Agent`: `n8n-workflow/1.0 (https://n8n.io; contact@n8n.io)`  
   - This searches Wikipedia for the topic.

4. **Create Code Node ("Construct Page URL")**  
   - Connect from "Wikipedia Search API".  
   - Paste code that extracts first search result title and builds:  
     - `wikipedia_page_title`  
     - `wikipedia_page_url` (encoded)  
     - `search_query_url` (original API URL)  
   - Throws error if no results found.

5. **Create ScrapeOps Scraper Node ("ScrapeOps Scraper")**  
   - Connect from "Construct Page URL".  
   - URL: Expression referencing `{{$json["wikipedia_page_url"]}}`  
   - Enable JS rendering (`render_js: true`) for dynamic content.  
   - Configure credentials with a valid ScrapeOps API key.  
   - This node scrapes the full Wikipedia page HTML.

6. **Create Code Node ("Extract History Section")**  
   - Connect from "ScrapeOps Scraper".  
   - Paste provided JavaScript code that:  
     - Extracts and cleans the History/Origins/Background section paragraphs from HTML.  
     - Falls back to first 5 paragraphs if no relevant header found.  
     - Removes HTML tags and references.  
     - Returns `history_raw` plus metadata from previous URL construction node.

7. **Create OpenAI Node ("Message a model")**  
   - Connect from "Extract History Section".  
   - Model: `gpt-4o-mini` (or equivalent GPT-4o-mini model)  
   - Messages:  
     - System message instructing strict JSON output with keys: Topic, Search_Query_URL, Wikipedia_Page_Title, Wikipedia_PAGE_URL, History_Raw, History_Cleaned, History_Summary, Timeline.  
     - User message providing:  
       - Topic  
       - Wikipedia Page Title & URL  
       - Search Query URL  
       - Raw History Text  
   - Use OpenAI credentials.  
   - Set `executeOnce` to true to avoid multiple calls if multiple items.

8. **Create Code Node ("Format AI Output")**  
   - Connect from "Message a model".  
   - Paste JavaScript code that robustly parses AI JSON output, handles escaped newlines, and extracts the defined keys into normalized fields.  
   - Returns clean JSON for appending.

9. **Create Google Sheets Node ("Append row in sheet")**  
   - Connect from "Format AI Output".  
   - Operation: Append  
   - Document ID: Use your Google Sheet URL (make a copy of the provided template).  
   - Sheet Name: `gid=0` (default sheet)  
   - Map columns:  
     - Topic  
     - Timeline  
     - History_Raw  
     - History_Cleaned  
     - History_Summary  
     - Search_Query_URL  
     - Wikipedia_Page_URL  
     - Wikipedia_Page_Title  
   - Use Google OAuth2 credentials with access to the target sheet.

10. **Optional: Add Sticky Notes for Documentation**  
    - Add descriptive sticky notes for each block to improve clarity.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                      | Context or Link                                                                                                                |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| This workflow automates Wikipedia niche research by scraping, extracting history, summarizing with GPT-4o-mini, and saving to Google Sheets for easy access and further use.                                                    | General workflow description                                                                                                  |
| Setup your free ScrapeOps API key here and configure the node: https://scrapeops.io/app/register/n8n                                                                                                                           | ScrapeOps setup                                                                                                                |
| Duplicate the Google Sheets template here to use with this workflow: https://docs.google.com/spreadsheets/d/1P0wZ449wVNndhSa6cJtK3VA3Aulv1k18zdpwWYY13gE/edit?gid=0#gid=0                                                         | Google Sheets template                                                                                                        |
| Read ScrapeOps n8n integration docs for advanced scraping options: https://scrapeops.io/docs/n8n/overview/                                                                                                                      | ScrapeOps documentation                                                                                                       |
| The AI prompt instructs GPT-4o-mini to produce strictly formatted JSON to ensure machine-readability and avoid parsing errors.                                                                                                | AI prompt design                                                                                                              |
| If parsing errors occur on AI output, the Format AI Output node returns `parse_error` with raw content for troubleshooting.                                                                                                    | AI output error handling                                                                                                      |
| The workflow uses a regex-based approach for history extraction to avoid heavy dependencies like Cheerio, improving performance and simplicity but requires Wikipedia's HTML structure to remain consistent.                    | Extraction approach note                                                                                                      |
| Timeline entries are expected to be single-line, starting with `- **YYYY:**` for clear chronological presentation.                                                                                                            | Timeline format expectation                                                                                                   |

---

**Disclaimer:** The provided text is exclusively generated from an automated n8n workflow. It adheres strictly to content policies and contains no illegal, offensive, or protected material. All data processed is lawful and publicly accessible.