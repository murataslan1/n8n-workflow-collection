Amazon Price Drop Analysis with Decodo, GPT-4.1-mini & Google Sheets Integration

https://n8nworkflows.xyz/workflows/amazon-price-drop-analysis-with-decodo--gpt-4-1-mini---google-sheets-integration-10962


# Amazon Price Drop Analysis with Decodo, GPT-4.1-mini & Google Sheets Integration

---
### 1. Workflow Overview

This workflow automates the extraction, summarization, and sentiment analysis of Amazon product price drop data sourced via Decodo web scraping tools and enhanced with OpenAI’s GPT-4.1-mini model. It targets e-commerce analysts and marketing teams who want to monitor price drops, product details, and customer sentiment with structured outputs pushed into Google Sheets for easy tracking and further automation.

**Logical blocks:**

- **1.1 Input Reception & Initial Data Retrieval**: Manual trigger starts the workflow, sets the URL for scraping, and uses Decodo to scrape the Amazon price drop listing page.
  
- **1.2 Structured Data Extraction**: Processes raw scraped data with GPT-4.1-mini to extract structured product details (title, price, savings, link).
  
- **1.3 Iterative Deep Product Analysis Loop**: Splits extracted items and processes each product URL individually with Decodo scraping and OpenAI analysis to generate product summaries and sentiment analysis.
  
- **1.4 Data Aggregation and Output**: Merges and aggregates all processed results and updates a connected Google Sheet with the final structured data.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Initial Data Retrieval

- **Overview:**  
  Starts the workflow manually, sets the target Amazon price drop URL, and scrapes the page using Decodo’s web scraper node.

- **Nodes Involved:**  
  - When clicking ‘Test workflow’ (Manual Trigger)  
  - Set input fields  
  - Decodo

- **Node Details:**

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Entry point to start workflow on demand.  
    - Configuration: Default manual trigger; no parameters.  
    - Input: None  
    - Output: Triggers next node.  
    - Edge Cases: None typical; user must trigger workflow manually.

  - **Set input fields**  
    - Type: Set  
    - Role: Defines workflow input variable `price_drop_url` with the URL: `https://camelcamelcamel.com/top_drops?t=daily`  
    - Configuration: Assigns a string URL to `price_drop_url`.  
    - Input: Trigger from manual node  
    - Output: Passes JSON with `price_drop_url`  
    - Edge Cases: URL must be valid and reachable; network failures possible.

  - **Decodo**  
    - Type: Decodo Web Scraper (community node)  
    - Role: Scrapes the price drop page at the URL provided by `price_drop_url`.  
    - Configuration:  
      - URL parameter set by expression `={{ $json.price_drop_url }}`  
      - Geo and headless browser options: default (`geo` empty, `headless` false)  
      - Output format: markdown enabled  
    - Input: URL from Set node  
    - Output: Raw scraped content in markdown format  
    - Credentials: Requires Decodo API credentials configured  
    - Edge Cases:  
      - Decodo API limits or failures  
      - Site structure changes may break scraping  
      - Network or rate limit errors

---

#### 2.2 Structured Data Extraction

- **Overview:**  
  Converts unstructured Decodo scraped content into a normalized structured JSON array of product data using OpenAI GPT-4.1-mini.

- **Nodes Involved:**  
  - OpenAI Chat Model  
  - Structured Output Parser  
  - Structure Data Extract Using LLM  
  - Split Out

- **Node Details:**

  - **OpenAI Chat Model**  
    - Type: LangChain OpenAI Chat Model  
    - Role: Processes raw scraped content to generate structured data output prompt.  
    - Configuration: Model set to `gpt-4.1-mini`.  
    - Input: Raw Decodo scrape content  
    - Output: LLM response with structured data in JSON-string format  
    - Credentials: OpenAI API key required  
    - Edge Cases:  
      - API rate limits or failures  
      - Prompt or parsing errors  
      - Model version consistency required

  - **Structured Output Parser**  
    - Type: LangChain Structured Output Parser  
    - Role: Parses OpenAI response into validated JSON objects matching example schema  
    - Configuration: JSON schema example includes fields like `id`, `title`, `price`, `savings`, `link`  
    - Input: LLM output from OpenAI Chat Model  
    - Output: Parsed JSON array of product items  
    - Edge Cases: Parsing failures if model output deviates from schema

  - **Structure Data Extract Using LLM**  
    - Type: LangChain Chain LLM  
    - Role: Orchestrates the OpenAI model and output parser to extract structured product data  
    - Configuration: Prompt for extracting structured data from Decodo content  
    - Input: Decodo raw content  
    - Output: JSON array of structured products  
    - Retry on failure enabled  
    - Edge Cases: Same as OpenAI model and parser above

  - **Split Out**  
    - Type: Split Out  
    - Role: Splits the array of structured products into individual items for further processing  
    - Configuration: Splits on `output` field containing the products array  
    - Input: Structured data array  
    - Output: Individual product JSON objects  
    - Edge Cases: Empty or malformed arrays will result in no further processing

---

#### 2.3 Iterative Deep Product Analysis Loop

- **Overview:**  
  Iterates over each product, performs a deep scrape of the individual product page via Decodo, and executes two parallel OpenAI tasks: summarization and sentiment analysis.

- **Nodes Involved:**  
  - Loop Over Items (SplitInBatches)  
  - Decodo Loop Web Scraper  
  - Sentiment Analysis (LangChain Information Extractor)  
  - Summarize Content (LangChain Information Extractor)  
  - OpenAI Chat Model for Sentiment Analysis  
  - OpenAI Chat Model for Summarize Content  
  - Merge  
  - Aggregate

- **Node Details:**

  - **Loop Over Items**  
    - Type: SplitInBatches  
    - Role: Processes each product item individually in batches (defaults)  
    - Input: Individual product JSON from Split Out  
    - Output: One product per iteration  
    - Edge Cases: Large datasets may cause long processing times; batch size adjustments may be necessary.

  - **Decodo Loop Web Scraper**  
    - Type: Decodo Web Scraper  
    - Role: Scrapes detailed content from each product’s URL (`{{ $json.link }}`)  
    - Configuration: URL set dynamically per product link, headless false, markdown true  
    - Credentials: Decodo API required  
    - Input: Product item JSON including `link` field  
    - Output: Detailed product page content in markdown  
    - Edge Cases: Page structure changes or anti-scraping measures by Amazon may cause failures.

  - **Sentiment Analysis**  
    - Type: LangChain Information Extractor  
    - Role: Performs sentiment analysis on the scraped detailed product content  
    - Configuration:  
      - Text prompt: "Perform sentiment analysis of {{ $json.results[0].content }}"  
      - Schema expecting sentiment category, sentiment score, and topics array  
      - Retry enabled  
    - Input: Detailed content from Decodo Loop Web Scraper  
    - Output: Sentiment structured data  
    - Edge Cases: Model interpretation errors or incomplete content

  - **Summarize Content**  
    - Type: LangChain Information Extractor  
    - Role: Generates a comprehensive summary of the detailed product content  
    - Configuration:  
      - Text prompt: "Comprehensive Summary of the following content - {{ $json.results[0].content }}"  
      - Schema expects a single string field `comprehensive_summary`  
      - Retry enabled  
    - Input: Detailed content from Decodo Loop Web Scraper  
    - Output: Summary text  
    - Edge Cases: Summarization quality depends on content length and model accuracy

  - **OpenAI Chat Model for Sentiment Analysis**  
    - Type: LangChain OpenAI Chat Model  
    - Role: Provides underlying AI model for Sentiment Analysis node  
    - Configuration: Model `gpt-4.1-mini`  
    - Credentials: OpenAI API  
    - Input: Sentiment Analysis prompt text  
    - Output: Sentiment analysis response

  - **OpenAI Chat Model for Summarize Content**  
    - Type: LangChain OpenAI Chat Model  
    - Role: Provides underlying AI model for Summarize Content node  
    - Configuration: Model `gpt-4.1-mini`  
    - Credentials: OpenAI API  
    - Input: Summary prompt text  
    - Output: Summary response

  - **Merge**  
    - Type: Merge  
    - Role: Combines outputs of Sentiment Analysis and Summarize Content (parallel branches) into a single item  
    - Input: From Sentiment Analysis and Summarize Content nodes  
    - Output: Merged JSON object per product with both summary and sentiment

  - **Aggregate**  
    - Type: Aggregate  
    - Role: Collects all merged product items into a single consolidated dataset  
    - Configuration: Aggregate all item data  
    - Input: Merged items from Loop Over Items  
    - Output: Single aggregated dataset for final output

---

#### 2.4 Data Aggregation and Output

- **Overview:**  
  Takes the aggregated results and appends or updates them into a specified Google Sheet for persistence and future use.

- **Nodes Involved:**  
  - Update Google Sheets

- **Node Details:**

  - **Update Google Sheets**  
    - Type: Google Sheets  
    - Role: Appends or updates rows in a Google Sheet with the aggregated product data  
    - Configuration:  
      - Operation: `appendOrUpdate`  
      - Sheet name: Sheet1 (gid=0)  
      - Document ID: `1a1yb4XSMQ0Vs0Rg2RCwrcIVXwDN3ImXW_4OUebURKZI`  
      - Columns mapping: Maps entire JSON dataset as a single string in column `output`  
      - Attempts to convert types: False  
      - Convert fields to string: False  
    - Credentials: Google Sheets OAuth2 required and configured  
    - Input: Aggregated product data JSON  
    - Output: Confirmation of write operation  
    - Edge Cases:  
      - Google API rate limits  
      - Sheet access permissions  
      - Data formatting issues

---

### 3. Summary Table

| Node Name                        | Node Type                                     | Functional Role                          | Input Node(s)                 | Output Node(s)                         | Sticky Note                                                                                                                          |
|---------------------------------|-----------------------------------------------|----------------------------------------|------------------------------|---------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’    | Manual Trigger                                | Workflow manual start                   | None                         | Set input fields                      |                                                                                                                                      |
| Set input fields                | Set                                           | Defines input URL for scraping          | When clicking ‘Test workflow’ | Decodo                               |                                                                                                                                      |
| Decodo                         | Decodo Web Scraper                             | Scrapes price drop listing page         | Set input fields              | OpenAI Chat Model                     |                                                                                                                                      |
| OpenAI Chat Model              | LangChain OpenAI Chat Model                    | Processes raw scrape to structured data | Decodo                       | Structured Output Parser              |                                                                                                                                      |
| Structured Output Parser       | LangChain Output Parser                        | Parses OpenAI response to JSON          | OpenAI Chat Model            | Structure Data Extract Using LLM      |                                                                                                                                      |
| Structure Data Extract Using LLM | LangChain Chain LLM                           | Orchestrates structured extraction      | Structured Output Parser     | Split Out                           | Sticky Note4: Explains structured data extraction with GPT-4.1-mini converting Decodo raw scrape into normalized product data         |
| Split Out                     | Split Out                                       | Splits product array into individual items | Structure Data Extract Using LLM | Loop Over Items                   | Sticky Note6: Explains loop and extraction of summary & sentiment analysis per product                                                |
| Loop Over Items               | SplitInBatches                                  | Iterates over individual products       | Split Out                    | Decodo Loop Web Scraper (2nd output) | Sticky Note6: Details per-item processing with Decodo and OpenAI                                                                       |
| Decodo Loop Web Scraper       | Decodo Web Scraper                             | Scrapes detailed product page            | Loop Over Items (2nd output) | Sentiment Analysis, Summarize Content |                                                                                                                                      |
| Sentiment Analysis             | LangChain Information Extractor                | Performs sentiment analysis              | Decodo Loop Web Scraper      | Merge                               |                                                                                                                                      |
| Summarize Content             | LangChain Information Extractor                | Generates comprehensive product summary | Decodo Loop Web Scraper      | Merge                               |                                                                                                                                      |
| OpenAI Chat Model for Sentiment Analysis | LangChain OpenAI Chat Model          | AI model for sentiment analysis          | Sentiment Analysis           | Sentiment Analysis                   |                                                                                                                                      |
| OpenAI Chat Model for Summarize Content | LangChain OpenAI Chat Model           | AI model for content summarization       | Summarize Content            | Summarize Content                   |                                                                                                                                      |
| Merge                         | Merge                                          | Combines sentiment and summary outputs  | Sentiment Analysis, Summarize Content | Aggregate                       | Sticky Note7: Describes merging, aggregating, and output handling to Google Sheets                                                    |
| Aggregate                    | Aggregate                                       | Aggregates all merged items               | Merge                        | Update Google Sheets                 | Sticky Note7: See above                                                                                                               |
| Update Google Sheets          | Google Sheets                                  | Writes aggregated data to Google Sheets  | Aggregate                    | Loop Over Items (loop back)          |                                                                                                                                      |
| Sticky Note (multiple)        | Sticky Note                                    | Provides documentation and disclaimers   | None                        | None                              | Sticky Note3: How it works and setup instructions; Sticky Note5: Disclaimer for Decodo community node usage                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Name: `When clicking ‘Test workflow’`  
   - No special config needed.

2. **Add Set Node**  
   - Type: Set  
   - Name: `Set input fields`  
   - Add a string field named `price_drop_url` with value `https://camelcamelcamel.com/top_drops?t=daily`  
   - Connect from Manual Trigger node.

3. **Add Decodo Node (Initial Scrape)**  
   - Type: Decodo Web Scraper (community node)  
   - Name: `Decodo`  
   - Set `url` parameter via expression: `={{ $json.price_drop_url }}`  
   - `headless` = false, `markdown` = true  
   - Connect from Set input fields node  
   - Configure Decodo API credentials.

4. **Add OpenAI Chat Model Node**  
   - Type: LangChain OpenAI Chat Model  
   - Name: `OpenAI Chat Model`  
   - Model: `gpt-4.1-mini`  
   - Connect input from Decodo node output  
   - Configure OpenAI API credentials.

5. **Add Structured Output Parser Node**  
   - Type: LangChain Output Parser Structured  
   - Name: `Structured Output Parser`  
   - Provide JSON schema example for product fields (id, title, price, savings, link)  
   - Connect from OpenAI Chat Model node output.

6. **Add Chain LLM Node**  
   - Type: LangChain Chain LLM  
   - Name: `Structure Data Extract Using LLM`  
   - Prompt: `=Extract structured data from  {{ $json.results[0].content }}`  
   - Enable output parser with the above Structured Output Parser  
   - Enable retry on failure  
   - Connect from Structured Output Parser output.

7. **Add Split Out Node**  
   - Type: Split Out  
   - Name: `Split Out`  
   - Set `fieldToSplitOut`: `output` (the array of products)  
   - Connect from Chain LLM node output.

8. **Add SplitInBatches Node**  
   - Type: SplitInBatches  
   - Name: `Loop Over Items`  
   - Use default batch size or configure as needed  
   - Connect from Split Out output.

9. **Add Decodo Node (Product Page Scraper)**  
   - Type: Decodo Web Scraper  
   - Name: `Decodo Loop Web Scraper`  
   - Set `url` parameter via expression: `={{ $json.link }}`  
   - `headless` = false, `markdown` = true  
   - Connect from second output of Loop Over Items node (batch output)  
   - Use same Decodo credentials.

10. **Add Sentiment Analysis Node**  
    - Type: LangChain Information Extractor  
    - Name: `Sentiment Analysis`  
    - Text: `=Perform sentiment analysis of  {{ $json.results[0].content }}`  
    - Schema: expects `sentiment` (enum), `sentimentScore` (number), `topics` (array of strings)  
    - Retry on failure enabled  
    - Connect from Decodo Loop Web Scraper output.

11. **Add Summarize Content Node**  
    - Type: LangChain Information Extractor  
    - Name: `Summarize Content`  
    - Text: `=Comprehensive Summary of the following content - {{ $json.results[0].content }}`  
    - Schema: expects `comprehensive_summary` string  
    - Retry on failure enabled  
    - Connect from Decodo Loop Web Scraper output.

12. **Add OpenAI Chat Model for Sentiment Analysis Node**  
    - Type: LangChain OpenAI Chat Model  
    - Name: `OpenAI Chat Model for Sentiment Analysis`  
    - Model: `gpt-4.1-mini`  
    - Connect to Sentiment Analysis node as AI language model

13. **Add OpenAI Chat Model for Summarize Content Node**  
    - Type: LangChain OpenAI Chat Model  
    - Name: `OpenAI Chat Model for Summarize Content`  
    - Model: `gpt-4.1-mini`  
    - Connect to Summarize Content node as AI language model

14. **Add Merge Node**  
    - Type: Merge  
    - Name: `Merge`  
    - Connect two inputs: from Sentiment Analysis and Summarize Content nodes  
    - Output combined item per product.

15. **Add Aggregate Node**  
    - Type: Aggregate  
    - Name: `Aggregate`  
    - Set to aggregate all item data into a single dataset  
    - Connect from Merge node output.

16. **Add Google Sheets Node**  
    - Type: Google Sheets  
    - Name: `Update Google Sheets`  
    - Operation: `appendOrUpdate`  
    - Document ID: your target spreadsheet ID (e.g., `1a1yb4XSMQ0Vs0Rg2RCwrcIVXwDN3ImXW_4OUebURKZI`)  
    - Sheet Name: `Sheet1` (gid=0)  
    - Columns: map single column `output` with expression `={{ $json.data.toJsonString() }}`  
    - Connect from Aggregate node output  
    - Configure Google Sheets OAuth2 credentials.

17. **Connect Update Google Sheets back to Loop Over Items (main output)**  
    - Ensures flow completes the batch loop.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                            | Context or Link                                                                                                                                                   |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| This workflow is only available on n8n self-hosted as it uses the community node for Decodo Web Scraping.                                                                                                                                               | Sticky Note5, with Decodo community node disclaimer.                                                                                                            |
| Workflow pulls daily Amazon price-drop data from Decodo, extracts structured product info, then for each product scrapes the detailed page for summary and sentiment. Results are merged and sent to Google Sheets.                                       | Sticky Note3 explains overall workflow logic.                                                                                                                   |
| Setup requires adding your Decodo API and OpenAI credentials, updating `price_drop_url` if needed, and configuring Google Sheets OAuth. Customize extraction schema and prompts for summary/sentiment as desired.                                       | Sticky Note3 setup instructions.                                                                                                                                |
| Change `price_drop_url` in Set Input Fields node to adjust source page. Modify structured extraction schemas and OpenAI prompts for summaries or sentiment to tune output detail.                                                                         | Sticky Note3 customization tips.                                                                                                                                |
| Structured Data Extraction block uses OpenAI GPT-4.1-mini to normalize Decodo scrape into consistent product objects with fields like title, price, savings, and link.                                                                                   | Sticky Note4 explains structured extraction block.                                                                                                             |
| Iterative loop performs per-product Decodo scraping and OpenAI summarization & sentiment analysis to provide deep insights on each item.                                                                                                               | Sticky Note6 describes loop and extraction process.                                                                                                            |
| Final Merge and Aggregate nodes consolidate all item-level data before writing to Google Sheets.                                                                                                                                                         | Sticky Note7 describes output data handling block.                                                                                                             |
| Decodo credentials must be configured with valid API keys; Google Sheets OAuth2 credentials must have write access to the target spreadsheet. OpenAI API keys should have access to GPT-4.1-mini model variant.                                           | Credential requirements throughout the workflow.                                                                                                               |
| Workflow depends on external websites (camelcamelcamel.com and Amazon product pages). Changes to these sites’ HTML structure or blocking mechanisms may require updating Decodo scraping logic or workflows.                                             | General note on integration dependencies and fragility.                                                                                                       |
| Branding logo and disclaimer image included in Sticky Note5 for workflow documentation.                                                                                                                                                                | Sticky Note5 contains embedded logo image URL for branding.                                                                                                   |

---

**Disclaimer:**  
The text provided is exclusively from an automated n8n workflow. It strictly follows content policies and contains no illegal, offensive, or protected material. All manipulated data are legal and publicly accessible.

---