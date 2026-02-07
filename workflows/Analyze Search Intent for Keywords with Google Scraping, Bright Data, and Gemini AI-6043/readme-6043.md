Analyze Search Intent for Keywords with Google Scraping, Bright Data, and Gemini AI

https://n8nworkflows.xyz/workflows/analyze-search-intent-for-keywords-with-google-scraping--bright-data--and-gemini-ai-6043


# Analyze Search Intent for Keywords with Google Scraping, Bright Data, and Gemini AI

### 1. Workflow Overview

This workflow automates the process of analyzing search intent for a list of keywords by leveraging Google Search scraping, Bright Data proxy services, and AI-powered intent classification via Google Gemini AI and Langchain. It is designed primarily for SEO analysts, digital marketers, and content strategists aiming to understand the intent behind top-ranking search results for targeted keywords.

The workflow is divided into the following logical blocks:

- **1.1 Input Reception:** Trigger and keyword ingestion from Google Sheets.
- **1.2 Search Results Retrieval:** Scraping Google Search results using Bright Data.
- **1.3 Data Preparation:** Formatting and splitting search results data for processing.
- **1.4 AI-based Intent Classification:** Classifying search intent of top-ranking pages using Google Gemini AI and Langchain’s text classifier.
- **1.5 Intent Output Processing:** Mapping AI classifications to intent labels and merging results.
- **1.6 Results Persistence:** Appending or updating results in Google Sheets for further analysis.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:** Starts the workflow manually and fetches the keywords and country codes from a Google Sheet.
- **Nodes Involved:**  
  - When clicking ‘Execute workflow’  
  - Get Keywords  
  - Loop Over Items  
  - set keyword

- **Node Details:**

  - **When clicking ‘Execute workflow’**  
    - *Type:* Manual Trigger  
    - *Role:* Entry point allowing manual start of the workflow.  
    - *Config:* No parameters needed.  
    - *Input/Output:* No input; outputs trigger downstream nodes.  
    - *Edge cases:* None; manual trigger only.

  - **Get Keywords**  
    - *Type:* Google Sheets  
    - *Role:* Reads keywords and associated country codes from a predefined Google Sheet.  
    - *Config:* Reads from sheet gid=0 of the Google Sheets document with ID "1QU9rwawCZLiYW8nlYYRMj-9OvAUNZoe2gP49KbozQqw". Uses Google Sheets OAuth2 credentials.  
    - *Key variables:* Reads columns "Keyword" and "country code".  
    - *Input:* Trigger from manual node.  
    - *Output:* List of keywords and countries for processing.  
    - *Edge cases:* Auth failures, empty sheet, or rate limits.

  - **Loop Over Items**  
    - *Type:* Split In Batches  
    - *Role:* Processes keywords one-by-one to manage API limits and sequential processing.  
    - *Config:* Default single-item batch size (default).  
    - *Input:* Keywords list from Google Sheets.  
    - *Output:* Single keyword and country code per iteration.  
    - *Edge cases:* Empty input list; batch processing errors.

  - **set keyword**  
    - *Type:* Set  
    - *Role:* Maps current keyword and country code for use in HTTP request.  
    - *Config:* Sets two fields: `search_term` from `Keyword`, and `country code` from input data.  
    - *Input:* One keyword item from Loop Over Items.  
    - *Output:* Sets variables for next node.  
    - *Edge cases:* Missing keyword or country code fields.

---

#### 1.2 Search Results Retrieval

- **Overview:** Scrapes Google Search results for each keyword using Bright Data’s SERP API.
- **Nodes Involved:**  
  - Fetch Google Search Results JSON  
  - Split Out

- **Node Details:**

  - **Fetch Google Search Results JSON**  
    - *Type:* HTTP Request  
    - *Role:* Calls Bright Data API to scrape Google Search results JSON.  
    - *Config:*  
      - POST to `https://api.brightdata.com/request`  
      - Sends body parameters including zone `serp_api1`, URL constructed with the keyword query (spaces replaced with `+`), country code, and format `raw`.  
      - Uses HTTP header auth with preconfigured Bright Data credentials.  
      - Query parameter `async=true` to enable asynchronous scraping.  
      - Accept header set to `application/json`.  
    - *Input:* Keyword and country code from "set keyword".  
    - *Output:* Raw SERP JSON response.  
    - *Edge cases:* Auth errors, rate limits, network timeouts, malformed responses, unsupported country codes.

  - **Split Out**  
    - *Type:* Split Out  
    - *Role:* Splits the `organic` array of top-ranking search results into individual items for separate processing.  
    - *Config:* Splits on field `organic` from JSON response.  
    - *Input:* Output of HTTP Request node.  
    - *Output:* Individual organic search result entries (pages).  
    - *Edge cases:* Missing or empty `organic` field.

---

#### 1.3 Data Preparation

- **Overview:** Formats the individual search result items to a structured format and enriches with keyword context.
- **Nodes Involved:**  
  - format fields

- **Node Details:**

  - **format fields**  
    - *Type:* Set  
    - *Role:* Extracts and maps important fields from each search result item and adds the keyword context for intent classification.  
    - *Config:*  
      - Sets fields:  
        - `Keyword` from the keyword variable  
        - `ranking page` from `link` field of search result  
        - `title` from `title` field  
        - `Meta description` from `description` field  
        - `extensions` as JSON string of optional extensions  
        - `position` from `rank` field  
    - *Input:* One organic search result item.  
    - *Output:* Structured data for AI classification.  
    - *Edge cases:* Missing fields, null descriptions.

---

#### 1.4 AI-based Intent Classification

- **Overview:** Uses Langchain's text classifier node powered by Google Gemini AI to classify each search result's intent into predefined categories.
- **Nodes Involved:**  
  - Google Gemini Chat Model2  
  - Intent Classifier  
  - informational, Navigational, Commercial, Transactional, Mixed

- **Node Details:**

  - **Google Gemini Chat Model2**  
    - *Type:* Langchain Google Gemini Chat  
    - *Role:* Invokes Google Gemini AI to process input text for intent classification.  
    - *Config:* Uses Google PaLM API credentials.  
    - *Input:* Receives text to classify from "Intent Classifier".  
    - *Output:* AI response for classification.  
    - *Edge cases:* API rate limiting, credential expiration, API errors.

  - **Intent Classifier**  
    - *Type:* Langchain Text Classifier  
    - *Role:* Defines intent categories and classifies the input text into one of five intents: Informational, Navigational, Commercial, Transactional, Mixed.  
    - *Config:*  
      - Input text: includes keyword, page title, meta description.  
      - Categories with descriptions for classification.  
    - *Input:* Text from "format fields".  
    - *Output:* Classification result routed to one of the five subsequent nodes.  
    - *Edge cases:* Ambiguous classifications, AI errors.

  - **informational, Navigational, Commercial, Transactional, Mixed**  
    - *Type:* Set nodes  
    - *Role:* Assign the classified intent label as a string field `intent` to the item.  
    - *Config:* Each node sets the `intent` field to its respective category name.  
    - *Input:* Routed from Intent Classifier output.  
    - *Output:* Labeled data forwarded to merge node.  
    - *Edge cases:* None expected.

---

#### 1.5 Intent Output Processing

- **Overview:** Merges all classified intent data streams into a single stream for final processing.
- **Nodes Involved:**  
  - Merge intents

- **Node Details:**

  - **Merge intents**  
    - *Type:* Merge  
    - *Role:* Combines the five separate intent-labeled data streams into one unified output stream.  
    - *Config:* Set to handle 5 input connections.  
    - *Input:* From informational, Navigational, Commercial, Transactional, Mixed nodes.  
    - *Output:* Unified data stream for appending.  
    - *Edge cases:* Missing input streams, synchronization issues.

---

#### 1.6 Results Persistence

- **Overview:** Appends or updates the processed search result data with intent labels into a Google Sheet for review and further analysis.
- **Nodes Involved:**  
  - append ranking result

- **Node Details:**

  - **append ranking result**  
    - *Type:* Google Sheets  
    - *Role:* Appends or updates rows in a specific Google Sheet tab with the enriched data.  
    - *Config:*  
      - Document ID: same as input sheet.  
      - Sheet name: GID 1031244896 (Sheet2).  
      - Operation: appendOrUpdate using `ranking page` as matching column.  
      - Columns mapped: title, position, ranking page, Meta description, Keyword, extensions, intent.  
      - Uses Google Sheets OAuth2 credentials.  
    - *Input:* Unified intent-labeled data from Merge node.  
    - *Output:* Appended/updated data in Google Sheet.  
    - *Edge cases:* Auth failures, rate limits, update conflicts.

---

### 3. Summary Table

| Node Name                      | Node Type                           | Functional Role                          | Input Node(s)                      | Output Node(s)                     | Sticky Note                                                                                                  |
|--------------------------------|-----------------------------------|----------------------------------------|----------------------------------|----------------------------------|--------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’| Manual Trigger                    | Manual workflow start                   | -                                | Get Keywords                     |                                                                                                              |
| Get Keywords                   | Google Sheets                     | Reads keywords and country codes       | When clicking ‘Execute workflow’ | Loop Over Items                  | - Make a copy of this [G sheet](https://docs.google.com/spreadsheets/d/1QU9rwawCZLiYW8nlYYRMj-9OvAUNZoe2gP49KbozQqw/edit?usp=sharing) - Add your desired keywords |
| Loop Over Items               | Split In Batches                  | Processes keywords one-by-one           | Get Keywords                    | set keyword / Loop Over Items    | - We loop over each item one at a time                                                                       |
| set keyword                   | Set                              | Maps keyword and country code           | Loop Over Items                 | Fetch Google Search Results JSON | - Map keyword and country code - Update the Zone name to match your zone on Bright Data - Run the scraper     |
| Fetch Google Search Results JSON| HTTP Request                    | Scrapes Google Search via Bright Data  | set keyword                    | Split Out                      |                                                                                                              |
| Split Out                    | Split Out                        | Splits organic search results           | Fetch Google Search Results JSON| format fields                  |                                                                                                              |
| format fields                | Set                              | Extracts and formats search result data | Split Out                     | Intent Classifier              |                                                                                                              |
| Google Gemini Chat Model2    | Langchain Google Gemini Chat     | AI processing for text classification   | Intent Classifier (ai_languageModel) | Intent Classifier            |                                                                                                              |
| Intent Classifier            | Langchain Text Classifier        | Classifies search intent                 | format fields / Google Gemini Chat Model2 | informational, Navigational, Commercial, Transactional, Mixed | ## Analyze intent of the top ranking pages - We use AI to analyze each title and its intent as informational, Commercial, transactional, navigational or Mixed in the case it doesn't fall into any of those |
| informational               | Set                              | Labels intent as informational           | Intent Classifier              | Merge intents                  |                                                                                                              |
| Navigational               | Set                              | Labels intent as navigational             | Intent Classifier              | Merge intents                  |                                                                                                              |
| Commercial               | Set                              | Labels intent as commercial               | Intent Classifier              | Merge intents                  |                                                                                                              |
| Transactional             | Set                              | Labels intent as transactional             | Intent Classifier              | Merge intents                  |                                                                                                              |
| Mixed                     | Set                              | Labels intent as mixed                     | Intent Classifier              | Merge intents                  |                                                                                                              |
| Merge intents             | Merge                            | Merges all intents into one stream         | informational, Navigational, Commercial, Transactional, Mixed | append ranking result |                                                                                                              |
| append ranking result      | Google Sheets                    | Appends or updates results in Google Sheet | Merge intents               | -                            | - Append the top pages to the G sheet for further analysis                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node** named "When clicking ‘Execute workflow’" — no parameters.

2. **Add a Google Sheets node** named "Get Keywords" to read keyword data:  
   - Document ID: `1QU9rwawCZLiYW8nlYYRMj-9OvAUNZoe2gP49KbozQqw`  
   - Sheet GID: `0`  
   - Authentication: Google Sheets OAuth2 (configure your credentials).  
   - Connect output of manual trigger to this node.

3. **Add a Split In Batches node** named "Loop Over Items" to process keywords one at a time:  
   - Default batch size (1) is sufficient.  
   - Connect output of "Get Keywords" to this node.

4. **Add a Set node** named "set keyword":  
   - Map `search_term` to `={{ $json.Keyword }}`  
   - Map `country code` to `={{ $json['country code'] }}`  
   - Connect output of "Loop Over Items" (main) to this node.

5. **Add an HTTP Request node** named "Fetch Google Search Results JSON":  
   - Method: POST  
   - URL: `https://api.brightdata.com/request`  
   - Authentication: HTTP Header Auth with Bright Data API key.  
   - Query Parameters: `async=true`  
   - Headers: Accept: application/json  
   - Body Parameters (JSON):  
     - zone: `serp_api1` (or your configured zone name)  
     - url: `=https://www.google.com/search?q={{ $json.search_term.replaceAll(" ", "+") }}&start=0&brd_json=1`  
     - country: `={{ $json['country code'] }}`  
     - format: `raw`  
   - Connect output of "set keyword" to this node.

6. **Add a Split Out node** named "Split Out":  
   - Field to split: `organic`  
   - Connect output of HTTP Request node to this node.

7. **Add a Set node** named "format fields":  
   - Map fields:  
     - `Keyword` = `={{ $('set keyword').item.json.search_term }}`  
     - `ranking page` = `={{ $json.link }}`  
     - `title` = `={{ $json.title }}`  
     - `Meta description` = `={{ $json.description }}`  
     - `extensions` = `={{ $json.extensions?.toJsonString() }}`  
     - `position` = `={{ $json.rank }}`  
   - Connect output of "Split Out" to this node.

8. **Add a Langchain Google Gemini Chat node** named "Google Gemini Chat Model2":  
   - Set credentials with Google PaLM API key.  
   - Connect output of "Intent Classifier" node (see next step) as AI language model input.

9. **Add a Langchain Text Classifier node** named "Intent Classifier":  
   - Input text:  
     ```
     Keyword: {{ $json.Keyword }}

     Top pages title  : {{ $json.title }}

     meta descriptions : {{ $json.description }}
     ```
   - Define categories: Informational, Navigational, Commercial, Transactional, Mixed (each with a description).  
   - Connect output of "format fields" to this node as input.  
   - Connect AI language model input to "Google Gemini Chat Model2".

10. **Add five Set nodes** named "informational", "Navigational", "Commercial", "Transactional", and "Mixed":  
    - Each sets `intent` field to its corresponding category string (e.g., `"informational"`).  
    - Connect respective outputs from "Intent Classifier" to each Set node.

11. **Add a Merge node** named "Merge intents":  
    - Number of inputs: 5  
    - Connect outputs of all five intent Set nodes to this Merge node.

12. **Add a Google Sheets node** named "append ranking result":  
    - Document ID: same as "Get Keywords" node.  
    - Sheet GID: `1031244896` (Sheet2).  
    - Operation: Append or Update  
    - Match by column: `ranking page`  
    - Map columns: title, position, ranking page, Meta description, Keyword, extensions, intent.  
    - Use Google Sheets OAuth2 credentials.  
    - Connect output of "Merge intents" to this node.

13. **Configure credentials:**  
    - Google Sheets OAuth2 for both Google Sheets nodes.  
    - Bright Data HTTP Header Auth for the HTTP Request node.  
    - Google PaLM API credentials for Google Gemini Chat node.

14. **Test the workflow:** Run manually, verify keywords are read, Google SERP scraped, AI classifies intent, and results append to Google Sheet.

---

### 5. General Notes & Resources

| Note Content                                                                                   | Context or Link                                                                                         |
|------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| Make a copy of this Google Sheet to add your own keywords: https://docs.google.com/spreadsheets/d/1QU9rwawCZLiYW8nlYYRMj-9OvAUNZoe2gP49KbozQqw/edit?usp=sharing | Source Google Sheet for keywords and results storage                                                   |
| Setting up SERP scraper in Bright Data: 1) Go to [Proxies & Scraping](https://brightdata.com/cp/zones) tab, 2) Create zone under SERP API, 3) Name and configure zone accordingly | Bright Data zone setup instructions                                                                     |
| Analyze intent of the top ranking pages: We use AI to categorize pages as informational, commercial, transactional, navigational, or mixed | Intent classification logic description                                                                |
| Loop over each keyword item one at a time to avoid API limits or processing bottlenecks        | Processing note                                                                                         |
| Map keyword and country code, update Zone name to match your Bright Data zone before running scraper | Configuration note                                                                                      |
| Append the top pages with their intents to the Google Sheet for further analysis               | Data persistence note                                                                                   |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled are legal and publicly available.