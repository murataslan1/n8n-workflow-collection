Automate Etsy Data Mining with Bright Data Scrape & Google Gemini

https://n8nworkflows.xyz/workflows/automate-etsy-data-mining-with-bright-data-scrape---google-gemini-3851


# Automate Etsy Data Mining with Bright Data Scrape & Google Gemini

### 1. Workflow Overview

This workflow automates large-scale data mining of Etsy product listings by integrating Bright Data’s Web Unlocker for scraping and Google Gemini’s large language model (LLM) for intelligent data extraction and enrichment. It targets eCommerce analysts, product researchers, AI developers, and growth hackers who need scalable, structured insights from Etsy’s JavaScript-heavy, paginated product pages.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Initialization**: Manual trigger and setting the Etsy search URL and Bright Data zone.
- **1.2 Initial Etsy Data Scraping**: Using Bright Data Web Unlocker API to fetch raw Etsy page content.
- **1.3 Paginated Result Extraction**: Extracting pagination URLs from the initial scrape using Google Gemini LLM.
- **1.4 Loop Over Pagination and Data Extraction**: Iteratively scraping each paginated page and extracting product info via LLM.
- **1.5 Data Persistence and Notification**: Writing scraped data to disk and sending results via webhook.
- **1.6 Optional OpenAI Alternative Extraction**: An optional block to replace Google Gemini with OpenAI for paginated result extraction.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Initialization

- **Overview:**  
  Starts the workflow manually and sets the initial Etsy search URL and Bright Data Web Unlocker zone for scraping.

- **Nodes Involved:**  
  - When clicking ‘Test workflow’ (Manual Trigger)  
  - Set Esty Search Query (Set Node)  
  - Sticky Note (Instructional)  

- **Node Details:**  
  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Entry point to start the workflow manually.  
    - Configuration: No parameters.  
    - Connections: Outputs to "Set Esty Search Query".  
    - Edge Cases: None; manual trigger requires user action.  

  - **Set Esty Search Query**  
    - Type: Set  
    - Role: Defines the Etsy search URL and Bright Data zone name as workflow variables.  
    - Configuration:  
      - `url`: Etsy search URL with query parameters (e.g., "wall art for mum", sorted by date, page=1).  
      - `zone`: Bright Data Web Unlocker zone identifier (e.g., "web_unlocker1").  
    - Expressions: Static string assignments.  
    - Connections: Outputs to "Perform Esty Web Request".  
    - Edge Cases: URL or zone misconfiguration leads to scraping failure.  

  - **Sticky Note**  
    - Provides instructions on setting the Etsy search query and webhook URL.  
    - Covers the initial scraping setup context.

---

#### 1.2 Initial Etsy Data Scraping

- **Overview:**  
  Sends a POST request to Bright Data’s Web Unlocker API to scrape the initial Etsy search page content.

- **Nodes Involved:**  
  - Perform Esty Web Request (HTTP Request)  
  - Extract Paginated Resultset (Information Extractor using Google Gemini)  
  - Sticky Note1 (Instructional about LLM usage)  

- **Node Details:**  
  - **Perform Esty Web Request**  
    - Type: HTTP Request  
    - Role: Calls Bright Data’s API with the Etsy URL and zone to retrieve raw page content.  
    - Configuration:  
      - Method: POST  
      - URL: https://api.brightdata.com/request  
      - Body Parameters:  
        - `zone`: from input (`$json.zone`)  
        - `url`: Etsy URL with appended parameters for unlocker product and API method  
        - `format`: raw  
        - `data_format`: markdown  
      - Authentication: Generic Header Auth with Bearer token (Bright Data Web Unlocker token).  
    - Connections: Outputs raw scraped data to "Extract Paginated Resultset".  
    - Edge Cases: Authentication failure, network timeout, invalid zone or URL, API quota exceeded.  

  - **Extract Paginated Resultset**  
    - Type: Information Extractor (Langchain node using Google Gemini)  
    - Role: Parses the raw Etsy page content to extract pagination URLs and page numbers.  
    - Configuration:  
      - Text input: raw data from previous node.  
      - Schema: Manual JSON schema expecting an array of objects with `page_number` (string) and `url` (URI).  
      - Excludes non-numeric page numbers (e.g., "next").  
    - Connections: Outputs extracted pagination info to "Split Out".  
    - Edge Cases: LLM parsing errors, unexpected page content structure, incomplete pagination data.  

  - **Sticky Note1**  
    - Notes that Google Gemini Flash Exp model is used as the LLM for data extraction.

---

#### 1.3 Pagination Handling and Loop Setup

- **Overview:**  
  Splits the extracted pagination resultset into individual items and prepares for iterative processing.

- **Nodes Involved:**  
  - Split Out (Split Out node)  
  - Loop Over Items (Split In Batches)  
  - Sticky Note2 (Instructional about looping)  

- **Node Details:**  
  - **Split Out**  
    - Type: Split Out  
    - Role: Splits the array of pagination URLs into separate items for looping.  
    - Configuration: Field to split out: `output` (the extracted pagination array).  
    - Connections: Outputs to "Loop Over Items".  
    - Edge Cases: Empty or malformed pagination array leads to no loop iterations.  

  - **Loop Over Items**  
    - Type: Split In Batches  
    - Role: Iterates over each pagination page URL to perform scraping and extraction.  
    - Configuration: Default batch size (1 item per batch).  
    - Connections: Main output to "Perform Esty web request over the loop".  
    - Edge Cases: Loop termination issues if pagination data is incorrect.  

  - **Sticky Note2**  
    - Describes the loop and paginated Etsy data extraction process.

---

#### 1.4 Loop Iteration: Paginated Etsy Data Scraping and Extraction

- **Overview:**  
  For each pagination page, performs a Bright Data scrape, extracts product information using Google Gemini, and sends results downstream.

- **Nodes Involved:**  
  - Perform Esty web request over the loop (HTTP Request)  
  - Extract Item List with the Product Info (Information Extractor)  
  - Google Gemini Chat Model for product info (LLM Chat)  
  - Initiate a Webhook Notification for the extracted data (HTTP Request)  
  - Create a binary data (Function)  
  - Write the scraped content to disk (Read/Write File)  

- **Node Details:**  
  - **Perform Esty web request over the loop**  
    - Type: HTTP Request  
    - Role: Scrapes each paginated Etsy page via Bright Data API.  
    - Configuration:  
      - Method: POST  
      - URL: https://api.brightdata.com/request  
      - Body Parameters:  
        - `zone`: fixed as "web_unlocker1" (could be parameterized)  
        - `url`: current pagination URL from loop item, appended with unlocker product parameter  
        - `format`: raw  
        - `data_format`: markdown  
      - Authentication: Generic Header Auth with Bright Data token.  
    - Connections: Outputs raw page content to "Extract Item List with the Product Info".  
    - Edge Cases: Same as initial scrape; authentication, rate limits, invalid URLs.  

  - **Extract Item List with the Product Info**  
    - Type: Information Extractor (Langchain)  
    - Role: Parses scraped page content to extract structured product info in JSON format.  
    - Configuration:  
      - Text input: raw data from previous node.  
      - Schema: JSON schema example includes product image URL, name, product URL, brand info, and offer price.  
    - Connections: Outputs structured product data to:  
      - "Initiate a Webhook Notification for the extracted data"  
      - "Create a binary data"  
    - Edge Cases: LLM parsing errors, unexpected content format, incomplete product info.  

  - **Google Gemini Chat Model for product info**  
    - Type: LLM Chat (Google Gemini)  
    - Role: (Implicit) Enhances or supports product info extraction (connected as AI language model to Extract Item List node).  
    - Configuration: Uses "models/gemini-2.0-flash-exp".  
    - Credentials: Google Gemini API key.  
    - Edge Cases: API quota, response latency, malformed prompts.  

  - **Initiate a Webhook Notification for the extracted data**  
    - Type: HTTP Request  
    - Role: Sends extracted product info summary to a configured webhook endpoint for downstream processing or storage.  
    - Configuration:  
      - Method: POST (default)  
      - URL: User-configured webhook URL (default example: webhook.site URL).  
      - Body Parameters: JSON with `summary` field containing extracted product info.  
    - Edge Cases: Webhook endpoint unavailability, network errors.  

  - **Create a binary data**  
    - Type: Function  
    - Role: Converts JSON product info into base64-encoded binary data for file writing.  
    - Configuration: Custom JavaScript code encoding JSON string to base64 buffer.  
    - Connections: Outputs to "Write the scraped content to disk".  
    - Edge Cases: Encoding errors if JSON malformed.  

  - **Write the scraped content to disk**  
    - Type: Read/Write File  
    - Role: Persists each paginated page’s scraped content as a JSON file on disk.  
    - Configuration:  
      - Operation: Write  
      - File Name: Dynamic path with page number (e.g., d:\Esty-Scraped-Content-1.json).  
    - Edge Cases: File system permission errors, invalid path, disk full.  

---

#### 1.5 Optional OpenAI Alternative Extraction

- **Overview:**  
  An alternative block to use OpenAI GPT-4o-mini model instead of Google Gemini for paginated result extraction.

- **Nodes Involved:**  
  - OpenAI Chat Model (LLM Chat)  
  - Extract Paginated Resultset With OpenAI (Information Extractor)  
  - Sticky Note3 (Instructional)  

- **Node Details:**  
  - **OpenAI Chat Model**  
    - Type: LLM Chat (OpenAI)  
    - Role: Alternative language model to Google Gemini for extracting pagination URLs.  
    - Configuration: Model set to "gpt-4o-mini".  
    - Credentials: OpenAI API key.  
    - Connections: Outputs to "Extract Paginated Resultset With OpenAI".  
    - Edge Cases: API limits, latency, prompt failures.  

  - **Extract Paginated Resultset With OpenAI**  
    - Type: Information Extractor  
    - Role: Parses raw Etsy page content using OpenAI model to extract pagination URLs.  
    - Configuration: Same JSON schema as Gemini extractor.  
    - Edge Cases: Same as Gemini extractor.  

  - **Sticky Note3**  
    - Notes that this block is optional and requires OpenAI credentials.

---

### 3. Summary Table

| Node Name                                   | Node Type                           | Functional Role                                   | Input Node(s)                          | Output Node(s)                                   | Sticky Note                                                                                              |
|---------------------------------------------|-----------------------------------|--------------------------------------------------|--------------------------------------|-------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’                | Manual Trigger                    | Entry point to start workflow                      | -                                    | Set Esty Search Query                            |                                                                                                         |
| Set Esty Search Query                        | Set                               | Sets Etsy URL and Bright Data zone                | When clicking ‘Test workflow’         | Perform Esty Web Request                         | Deals with the Esty web scraping by utilizing the Bright Data Web Unlocker Product.                      |
| Perform Esty Web Request                     | HTTP Request                     | Scrapes initial Etsy page via Bright Data         | Set Esty Search Query                  | Extract Paginated Resultset                      |                                                                                                         |
| Extract Paginated Resultset                  | Information Extractor (Google Gemini) | Extracts pagination URLs from raw page content    | Perform Esty Web Request               | Split Out                                       | Google Gemini Flash Exp model is being used. Basic LLM Chain Data Extractor.                            |
| Split Out                                   | Split Out                        | Splits pagination array into individual items     | Extract Paginated Resultset            | Loop Over Items                                 |                                                                                                         |
| Loop Over Items                             | Split In Batches                 | Iterates over each pagination page                 | Split Out                            | Perform Esty web request over the loop          | Loop and Perform Paginated Esty Data Extraction                                                        |
| Perform Esty web request over the loop      | HTTP Request                     | Scrapes each paginated Etsy page                   | Loop Over Items                      | Extract Item List with the Product Info          |                                                                                                         |
| Extract Item List with the Product Info     | Information Extractor (Google Gemini) | Extracts structured product info from page content | Perform Esty web request over the loop | Initiate a Webhook Notification for the extracted data, Create a binary data |                                                                                                         |
| Google Gemini Chat Model for product info   | LLM Chat (Google Gemini)         | Supports product info extraction                    | - (AI language model for Extract Item List) | Extract Item List with the Product Info          |                                                                                                         |
| Initiate a Webhook Notification for the extracted data | HTTP Request                     | Sends extracted data to webhook endpoint           | Extract Item List with the Product Info | Loop Over Items                                 |                                                                                                         |
| Create a binary data                        | Function                        | Converts JSON data to base64 binary for file write | Extract Item List with the Product Info | Write the scraped content to disk                 |                                                                                                         |
| Write the scraped content to disk            | Read/Write File                  | Saves scraped content to disk                        | Create a binary data                  | -                                               |                                                                                                         |
| OpenAI Chat Model                           | LLM Chat (OpenAI)                | Optional alternative LLM for pagination extraction | -                                    | Extract Paginated Resultset With OpenAI          | Open AI Extraction (Optional) Note - Replace the above workflow with the Open AI Chat Model if needed.  |
| Extract Paginated Resultset With OpenAI     | Information Extractor (OpenAI)   | Alternative pagination URLs extractor               | OpenAI Chat Model                    | -                                               |                                                                                                         |
| Sticky Note                                 | Sticky Note                     | Instructional note                                  | -                                    | -                                               | Deals with the Esty web scraping by utilizing the Bright Data Web Unlocker Product.                     |
| Sticky Note1                                | Sticky Note                     | Instructional note about LLM usage                  | -                                    | -                                               | Google Gemini Flash Exp model is being used. Basic LLM Chain Data Extractor.                            |
| Sticky Note2                                | Sticky Note                     | Instructional note about looping                     | -                                    | -                                               | Loop and Perform Paginated Esty Data Extraction                                                        |
| Sticky Note3                                | Sticky Note                     | Instructional note about OpenAI alternative          | -                                    | -                                               | Open AI Extraction (Optional) Note - Replace the above workflow with the Open AI Chat Model if needed.  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: Start workflow manually.  

2. **Create Set Node: "Set Esty Search Query"**  
   - Assign variables:  
     - `url`: Etsy search URL (e.g., `https://www.etsy.com/search?q=wall+art+for+mum&order=date_desc&page=1&ref=pagination`)  
     - `zone`: Bright Data Web Unlocker zone name (e.g., `web_unlocker1`)  
   - Connect Manual Trigger → Set Node.  

3. **Create HTTP Request Node: "Perform Esty Web Request"**  
   - Method: POST  
   - URL: `https://api.brightdata.com/request`  
   - Body Parameters (as form data):  
     - `zone`: `={{ $json.zone }}`  
     - `url`: `={{ $json.url }}?product=unlocker&method=api`  
     - `format`: `raw`  
     - `data_format`: `markdown`  
   - Authentication: Generic Header Auth with Bright Data Web Unlocker token (Bearer token in header).  
   - Connect Set Node → HTTP Request.  

4. **Create Information Extractor Node: "Extract Paginated Resultset"**  
   - Text input: `={{ $json.data }}` (raw scraped content)  
   - Schema: Manual JSON schema expecting array of objects with `page_number` (string) and `url` (URI).  
   - Configure to exclude non-numeric page numbers.  
   - Use Google Gemini Chat Model as AI language model (configure credentials).  
   - Connect HTTP Request → Information Extractor.  

5. **Create Split Out Node: "Split Out"**  
   - Field to split out: `output` (the extracted pagination array)  
   - Connect Information Extractor → Split Out.  

6. **Create Split In Batches Node: "Loop Over Items"**  
   - Default batch size (1)  
   - Connect Split Out → Loop Over Items.  

7. **Create HTTP Request Node: "Perform Esty web request over the loop"**  
   - Method: POST  
   - URL: `https://api.brightdata.com/request`  
   - Body Parameters:  
     - `zone`: fixed string `"web_unlocker1"` (or parameterize)  
     - `url`: `={{ $json.url }}&product=unlocker` (pagination URL from loop)  
     - `format`: `raw`  
     - `data_format`: `markdown`  
   - Authentication: Generic Header Auth with Bright Data token.  
   - Connect Loop Over Items → HTTP Request.  

8. **Create Information Extractor Node: "Extract Item List with the Product Info"**  
   - Text input: `=Extract the product info in JSON\n\n{{ $json.data }}`  
   - Schema: JSON example with product image, name, URL, brand, offers (price and currency).  
   - Use Google Gemini Chat Model for product info extraction (configure credentials).  
   - Connect HTTP Request → Information Extractor.  

9. **Create HTTP Request Node: "Initiate a Webhook Notification for the extracted data"**  
   - Method: POST  
   - URL: User’s webhook endpoint (e.g., webhook.site URL)  
   - Body Parameters:  
     - `summary`: `={{ $json.output }}` (extracted product info)  
   - Connect Information Extractor → HTTP Request.  

10. **Create Function Node: "Create a binary data"**  
    - JavaScript code:  
      ```javascript
      items[0].binary = {
        data: {
          data: Buffer.from(JSON.stringify(items[0].json, null, 2)).toString('base64')
        }
      };
      return items;
      ```  
    - Connect Information Extractor → Function.  

11. **Create Read/Write File Node: "Write the scraped content to disk"**  
    - Operation: Write  
    - File Name: `d:\Esty-Scraped-Content-{{ $('Loop Over Items').item.json.page_number }}.json`  
    - Connect Function → Read/Write File.  

12. **Optional: Create OpenAI Chat Model Node and Alternative Extractor**  
    - Create OpenAI Chat Model node with model `gpt-4o-mini` and OpenAI credentials.  
    - Create Information Extractor node "Extract Paginated Resultset With OpenAI" with same schema as Gemini extractor.  
    - Connect OpenAI Chat Model → Extractor.  
    - Replace "Extract Paginated Resultset" and related nodes if desired.  

13. **Add Sticky Notes for documentation and instructions** at appropriate positions with content as per original workflow.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                 | Context or Link                                                                                     |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Deals with the Etsy web scraping by utilizing the Bright Data Web Unlocker Product. The Information Extraction node demonstrates n8n AI capabilities. Please set the Etsy search query and update the Webhook Notification URL. | Initial scraping setup and configuration.                                                         |
| Google Gemini Flash Exp model is used as the LLM for data extraction. Basic LLM Chain Data Extractor.                                                                                                                       | LLM usage details.                                                                                 |
| Loop and Perform Paginated Etsy Data Extraction.                                                                                                                                                                            | Explains the looping mechanism for paginated scraping.                                           |
| Open AI Extraction (Optional). Replace the Google Gemini extraction with OpenAI Chat Model if needed. Make sure OpenAI credentials are configured.                                                                           | Alternative LLM usage instructions.                                                               |
| Setup instructions for Bright Data Web Unlocker: Sign up at https://brightdata.com/, create Web Unlocker zone, configure Header Auth with Bearer token in n8n credentials.                                                   | Bright Data setup.                                                                                 |
| Google Gemini API key or access through Vertex AI or proxy is required.                                                                                                                                                      | Google Gemini API access requirements.                                                            |
| Customize input sources by replacing static URL with Google Sheets, Webhook, or Airtable inputs for multi-niche research.                                                                                                   | Workflow customization suggestions.                                                               |
| Customize Gemini prompts to extract specific insights like product features or review summaries.                                                                                                                            | Prompt customization ideas.                                                                        |
| Update Webhook notification to save data to Google Sheets, Notion, Airtable, SQL/NoSQL, Slack, or Email.                                                                                                                    | Data output customization options.                                                                |

---

This documentation provides a detailed, structured reference enabling users and AI agents to understand, reproduce, and modify the "Automate Etsy Data Mining with Bright Data Scrape & Google Gemini" workflow fully and confidently.