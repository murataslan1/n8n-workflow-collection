Amazon Product Search Scraper with BrightData, GPT-4, and Google Sheets

https://n8nworkflows.xyz/workflows/amazon-product-search-scraper-with-brightdata--gpt-4--and-google-sheets-3901


# Amazon Product Search Scraper with BrightData, GPT-4, and Google Sheets

### 1. Workflow Overview

This workflow automates the extraction of structured product data from Amazon search result pages by orchestrating a sequence of data retrieval, cleaning, AI-powered parsing, and storage steps. It is designed primarily for users needing scalable, automated scraping of Amazon product listings, such as e-commerce analysts, market researchers, data teams, and affiliate marketers.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Fetches a list of Amazon search URLs from a Google Sheets document.
- **1.2 Batch Processing:** Splits the list of URLs into manageable batches for sequential processing.
- **1.3 Web Scraping:** Uses BrightData’s Web Unlocker API to retrieve raw HTML content of each Amazon search results page.
- **1.4 HTML Cleaning:** Sanitizes the raw HTML by removing extraneous tags, scripts, styles, and attributes to isolate relevant product elements.
- **1.5 AI Extraction:** Passes cleaned HTML to a LangChain-powered GPT-4 model to extract structured product information in JSON format.
- **1.6 Data Output:** Splits the AI output into individual product records and appends them as rows into a Google Sheets results sheet.
- **1.7 Control Flow:** Loops the process over all URLs until completion.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Retrieves the list of Amazon search URLs to scrape from a Google Sheets document.
- **Nodes Involved:**  
  - `When clicking ‘Test workflow’` (Manual Trigger)  
  - `get urls to scrape` (Google Sheets)  
  - `url` (Split In Batches)

- **Node Details:**

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Starts the workflow manually for testing or execution.  
    - Inputs: None  
    - Outputs: Triggers `get urls to scrape` node.  
    - Edge Cases: None.

  - **get urls to scrape**  
    - Type: Google Sheets  
    - Role: Reads URLs from a specified sheet (`{{TRACK_SHEET_GID}}`) in the Google Sheets document (`{{WEB_SHEET_ID}}`).  
    - Configuration: Uses OAuth2 credentials for Google Sheets access.  
    - Inputs: Trigger from manual node.  
    - Outputs: Passes list of URLs to `url` node.  
    - Edge Cases: Authentication errors, empty or malformed sheet data.

  - **url**  
    - Type: Split In Batches  
    - Role: Splits the list of URLs into batches for controlled processing.  
    - Configuration: Default batch options (batch size not explicitly set, so defaults apply).  
    - Inputs: List of URLs from Google Sheets.  
    - Outputs: Sends batches sequentially to `scrap url`.  
    - Edge Cases: Batch size too large causing timeouts or API limits.

---

#### 2.2 Web Scraping

- **Overview:** Fetches raw HTML content of each Amazon search results page using BrightData’s proxy API.
- **Nodes Involved:**  
  - `scrap url` (HTTP Request)

- **Node Details:**

  - **scrap url**  
    - Type: HTTP Request  
    - Role: Sends POST requests to BrightData’s Web Unlocker API to retrieve raw HTML for each URL.  
    - Configuration:  
      - URL: `https://api.brightdata.com/request`  
      - Method: POST  
      - Body Parameters:  
        - `zone`: `"web_unlocker1"` (BrightData zone)  
        - `url`: dynamically set to current item’s URL (`={{ $json.url }}`)  
        - `format`: `"raw"` (to get raw HTML)  
      - Headers: Authorization header with `{{BRIGHTDATA_TOKEN}}` credential.  
    - Inputs: Receives URL batches from `url` node.  
    - Outputs: Passes raw HTML data to `clean html` node.  
    - Edge Cases:  
      - Authentication failure if token invalid.  
      - Rate limiting or throttling by BrightData.  
      - Network timeouts or API errors.  
      - Unexpected HTML format or empty responses.

---

#### 2.3 HTML Cleaning

- **Overview:** Sanitizes the raw HTML by removing unnecessary tags, scripts, styles, comments, and classes, leaving only a whitelist of relevant tags to simplify parsing.
- **Nodes Involved:**  
  - `clean html` (Code Function)

- **Node Details:**

  - **clean html**  
    - Type: Code (JavaScript)  
    - Role: Processes raw HTML string to remove noise and retain only relevant content tags.  
    - Configuration:  
      - Removes doctype, `<script>`, `<style>`, `<head>`, comments, and class attributes.  
      - Defines a whitelist of allowed tags: `h1-h6`, `p`, `ul`, `ol`, `li`, `strong`, `em`, `a`, `blockquote`, `code`, `pre`.  
      - Strips out all other tags.  
      - Collapses multiple blank lines into single newlines.  
      - Trims leading/trailing whitespace.  
    - Inputs: Raw HTML from `scrap url`.  
    - Outputs: Cleaned HTML string to `extract data`.  
    - Edge Cases:  
      - Malformed HTML causing regex failures.  
      - Unexpected tags not in whitelist that might contain relevant data.  
      - Very large HTML causing performance issues.

---

#### 2.4 AI Extraction

- **Overview:** Uses LangChain with OpenRouter GPT-4 to parse the cleaned HTML and extract structured product data as JSON.
- **Nodes Involved:**  
  - `OpenRouter Chat Model` (Language Model)  
  - `Structured Output Parser` (Output Parser)  
  - `extract data` (Chain LLM)

- **Node Details:**

  - **OpenRouter Chat Model**  
    - Type: LangChain LM Chat OpenRouter  
    - Role: Provides GPT-4.1 model for natural language understanding and generation.  
    - Configuration: Model set to `openai/gpt-4.1`, no additional options.  
    - Inputs: Receives prompt from `extract data` node.  
    - Outputs: Raw AI response to `extract data`.  
    - Edge Cases: API key invalid or rate limits; model response latency; unexpected output format.

  - **Structured Output Parser**  
    - Type: LangChain Output Parser Structured  
    - Role: Parses AI output into a strict JSON schema.  
    - Configuration:  
      - Schema defines an array of objects with required fields: `name` (string), `description` (string), `rating` (number), `reviews` (integer), `price` (string).  
    - Inputs: AI raw output from `extract data`.  
    - Outputs: Parsed JSON array to `extract data`.  
    - Edge Cases: Parsing failures if AI output deviates from schema; missing fields.

  - **extract data**  
    - Type: LangChain Chain LLM  
    - Role: Coordinates prompt sending and output parsing.  
    - Configuration:  
      - Prompt instructs GPT-4 to extract product info for the search term parsed from the URL.  
      - Input text is the cleaned HTML (`={{ $json.cleanedHtml }}`).  
      - Uses the above Chat Model and Output Parser nodes.  
    - Inputs: Cleaned HTML from `clean html`.  
    - Outputs: Parsed product array to `Split items`.  
    - Edge Cases: AI model errors; prompt misinterpretation; empty or malformed HTML input.

---

#### 2.5 Data Output

- **Overview:** Splits the array of extracted product objects and appends each as a row in the Google Sheets results sheet.
- **Nodes Involved:**  
  - `Split items` (Split Out)  
  - `add results` (Google Sheets)  
  - `url` (Split In Batches) [for looping]

- **Node Details:**

  - **Split items**  
    - Type: Split Out  
    - Role: Splits the array of product objects into individual items for separate processing.  
    - Configuration: Splits on the `output` field containing the array.  
    - Inputs: Parsed product array from `extract data`.  
    - Outputs: Individual product JSON objects to `add results`.  
    - Edge Cases: Empty arrays; malformed data.

  - **add results**  
    - Type: Google Sheets  
    - Role: Appends each product’s structured data as a new row in the results sheet (`{{RESULTS_SHEET_GID}}`) of the Google Sheets document (`{{WEB_SHEET_ID}}`).  
    - Configuration:  
      - Columns mapped explicitly: `name`, `price`, `rating`, `reviews`, `description`.  
      - Uses OAuth2 credentials for Google Sheets.  
      - Operation: Append.  
    - Inputs: Individual product items from `Split items`.  
    - Outputs: Triggers next batch processing by connecting back to `url`.  
    - Edge Cases: Authentication errors; sheet write failures; schema mismatches.

  - **url** (loop back)  
    - Role: Receives control from `add results` to process next batch of URLs.  
    - This looping continues until all URLs are processed.

---

### 3. Summary Table

| Node Name               | Node Type                             | Functional Role                          | Input Node(s)               | Output Node(s)            | Sticky Note                                                                                      |
|-------------------------|-------------------------------------|----------------------------------------|-----------------------------|---------------------------|------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger                      | Starts workflow manually                | None                        | get urls to scrape         |                                                                                                |
| get urls to scrape       | Google Sheets                       | Reads URLs from Google Sheets           | When clicking ‘Test workflow’ | url                       |                                                                                                |
| url                     | Split In Batches                    | Splits URL list into batches            | get urls to scrape, add results | scrap url                 |                                                                                                |
| scrap url               | HTTP Request                       | Fetches raw HTML via BrightData API     | url                         | clean html                | ## Web Scraper API [Inscription - Free Trial](https://get.brightdata.com/website-scraper)      |
| clean html              | Code (Function)                    | Cleans raw HTML to whitelist tags       | scrap url                   | extract data              |                                                                                                |
| OpenRouter Chat Model   | LangChain LM Chat OpenRouter       | Provides GPT-4 model for parsing        | extract data (ai_languageModel) | extract data              |                                                                                                |
| Structured Output Parser | LangChain Output Parser Structured | Parses AI output into JSON schema       | extract data (ai_outputParser) | extract data              |                                                                                                |
| extract data            | LangChain Chain LLM                | Sends prompt and parses AI response     | clean html, OpenRouter Chat Model, Structured Output Parser | Split items               |                                                                                                |
| Split items             | Split Out                         | Splits product array into individual items | extract data                | add results               |                                                                                                |
| add results             | Google Sheets                     | Appends product data to results sheet   | Split items                 | url                       |                                                                                                |
| Sticky Note1            | Sticky Note                       | Provides BrightData API signup link     | None                        | None                      | ## Web Scraper API [Inscription - Free Trial](https://get.brightdata.com/website-scraper)      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: To start the workflow manually.

2. **Create Google Sheets Node to Get URLs**  
   - Type: Google Sheets  
   - Operation: Read rows from sheet  
   - Parameters:  
     - Document ID: `{{WEB_SHEET_ID}}` (replace with your Google Sheet ID)  
     - Sheet Name: `{{TRACK_SHEET_GID}}` (replace with your tracking sheet GID)  
   - Credentials: Google Sheets OAuth2  
   - Connect Manual Trigger output to this node.

3. **Create Split In Batches Node**  
   - Type: Split In Batches  
   - Purpose: To process URLs in batches (default batch size or set as needed)  
   - Connect Google Sheets node output to this node.

4. **Create HTTP Request Node for BrightData Scraping**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.brightdata.com/request`  
   - Body Parameters (JSON):  
     - `zone`: `"web_unlocker1"`  
     - `url`: Expression `={{ $json.url }}` (current URL from batch)  
     - `format`: `"raw"`  
   - Headers:  
     - `Authorization`: Use credential `{{BRIGHTDATA_TOKEN}}`  
   - Credentials: HTTP Request with BrightData token  
   - Connect Split In Batches node output to this node.

5. **Create Code Node to Clean HTML**  
   - Type: Code (JavaScript)  
   - Paste the cleaning script:  
     - Remove doctype, scripts, styles, head, comments, class attributes  
     - Whitelist tags: h1-h6, p, ul, ol, li, strong, em, a, blockquote, code, pre  
     - Collapse multiple blank lines  
     - Trim whitespace  
   - Connect HTTP Request node output to this node.

6. **Create LangChain OpenRouter Chat Model Node**  
   - Type: LangChain LM Chat OpenRouter  
   - Model: `openai/gpt-4.1`  
   - Credentials: OpenRouter API key  
   - No additional options needed.

7. **Create LangChain Structured Output Parser Node**  
   - Type: LangChain Output Parser Structured  
   - Schema:  
     ```json
     {
       "type": "array",
       "items": {
         "type": "object",
         "properties": {
           "name": { "type": "string" },
           "description": { "type": "string" },
           "rating": { "type": "number" },
           "reviews": { "type": "integer" },
           "price": { "type": "string" }
         },
         "required": ["name", "description", "rating", "reviews", "price"]
       }
     }
     ```
   - No other parameters.

8. **Create LangChain Chain LLM Node**  
   - Type: LangChain Chain LLM  
   - Parameters:  
     - Text input: Expression `={{ $json.cleanedHtml }}`  
     - Prompt message:  
       ```
       You are an expert in web page scraping. Provide a structured response in JSON format. Only the response, without commentary.

       Extract the product information for {{ $('url').item.json.url.split('/s?k=')[1].split('&')[0] }} present on the page.

       name
       description
       rating
       reviews
       price
       ```
     - Prompt type: Define  
     - Link the Chat Model node as AI language model  
     - Link the Structured Output Parser node as output parser  
   - Connect Code node output to this node.

9. **Create Split Out Node**  
   - Type: Split Out  
   - Field to split out: `output` (the array of products)  
   - Connect Chain LLM node output to this node.

10. **Create Google Sheets Node to Append Results**  
    - Type: Google Sheets  
    - Operation: Append rows  
    - Document ID: `{{WEB_SHEET_ID}}`  
    - Sheet Name: `{{RESULTS_SHEET_GID}}`  
    - Columns mapping:  
      - `name`: `={{ $json.output.name }}`  
      - `price`: `={{ $json.output.price }}`  
      - `rating`: `={{ $json.output.rating }}`  
      - `reviews`: `={{ $json.output.reviews }}`  
      - `description`: `={{ $json.output.description }}`  
    - Credentials: Google Sheets OAuth2  
    - Connect Split Out node output to this node.

11. **Loop Back for Batch Processing**  
    - Connect Google Sheets append node output back to the Split In Batches node (`url`) to process the next batch.

12. **Add Sticky Note (Optional)**  
    - Add a sticky note near the HTTP Request node with content:  
      ```
      ## Web Scraper API
      [Inscription - Free Trial](https://get.brightdata.com/website-scraper)
      ```

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                               |
|-------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| This workflow uses BrightData’s Web Unlocker proxy to bypass Amazon anti-scraping measures.     | https://get.brightdata.com/Unbreakable-Web-Scraper            |
| OpenRouter GPT-4 is used via LangChain for structured data extraction from HTML content.        | Requires OpenRouter API key configured in n8n credentials     |
| Google Sheets OAuth2 credentials must be configured for reading and writing sheets.              | n8n credential setup                                          |
| Modify the whitelist tags in the cleaning code node to adapt to different website structures.    | Located in the `clean html` node JavaScript code              |
| Schema in the Structured Output Parser can be extended to include additional product fields.    | Located in the LangChain Output Parser node                    |
| Monitor API rate limits for BrightData and OpenRouter to avoid throttling or failures.           | Operational best practice                                     |
| Ensure compliance with Amazon’s terms of service and legal requirements when scraping data.      | Legal and ethical consideration                               |
| Workflow author and support: [Phil | Inforeole](https://inforeole.fr)                            | Author credit and contact                                     |

---

This document provides a detailed, structured reference for understanding, reproducing, and maintaining the Amazon Product Search Scraper workflow using n8n, BrightData, GPT-4, and Google Sheets.