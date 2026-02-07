Automate Instagram Influencer Lead Collection with Apify, GPT and PostgreSQL

https://n8nworkflows.xyz/workflows/automate-instagram-influencer-lead-collection-with-apify--gpt-and-postgresql-9885


# Automate Instagram Influencer Lead Collection with Apify, GPT and PostgreSQL

### 1. Workflow Overview

This workflow automates the process of generating Instagram influencer leads focused on a specific niche (e.g., beauty & hair) and target country (e.g., USA). It uses AI to generate optimized Google search queries, scrapes relevant Instagram profiles via Apify APIs, extracts email addresses from user biographies, and stores the collected leads into a PostgreSQL database.

The workflow is logically organized into these blocks:

- **1.1 Input Specification:** Define target niche and location parameters.
- **1.2 AI Query Generation:** Use an AI agent (LangChain) to create a custom Google search query tailored to the niche and location.
- **1.3 Query Preparation:** Escape the generated query string for API compatibility.
- **1.4 Google Search Scraping:** Fetch Google search results using Apify’s Google Search Scraper API.
- **1.5 Results Processing:** Split the search results into individual items and batch process them.
- **1.6 Instagram Profile Scraping:** For each URL, scrape detailed Instagram profile data via Apify Instagram Scraper API.
- **1.7 Email Extraction:** Extract email addresses from the Instagram user biography using AI extraction.
- **1.8 Data Storage:** Insert or update the extracted lead data in a PostgreSQL database.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Specification

- **Overview:** This block sets the core input parameters defining the niche ("beauty & hair") and target country ("USA") for the lead search.
- **Nodes Involved:**  
  - When clicking ‘Test workflow’ (Manual Trigger)  
  - Edit Fields (Set)
- **Node Details:**

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Initiates the workflow manually for testing or execution  
    - Configuration: No parameters needed  
    - Inputs: None  
    - Outputs: Connects to "Edit Fields"  
    - Edge cases: None typical; manual trigger is user-dependent

  - **Edit Fields**  
    - Type: Set  
    - Role: Defines fixed input fields for the workflow  
    - Configuration: Sets three string fields:  
      - `site` = "instagram"  
      - `field_of_interest` = "beauty & hair"  
      - `target_country` = "USA"  
    - Inputs: From Manual Trigger  
    - Outputs: To "AI Agent"  
    - Edge cases: Hardcoded values; to modify niche or country, user must edit these fields

- **Sticky Note:**  
  "Specifying Our Target Niche"

---

#### 2.2 AI Query Generation

- **Overview:** Uses an AI agent to generate a clean, optimized Google search query string that targets Instagram profiles matching the niche and country parameters.
- **Nodes Involved:**  
  - AI Agent (LangChain Agent)  
  - OpenAI Chat Model
- **Node Details:**

  - **AI Agent**  
    - Type: LangChain Agent  
    - Role: Generates Google search query strings based on inputs  
    - Configuration:  
      - Prompt includes fields: `field_of_interest` and `target_country` injected dynamically  
      - System message guides the AI to produce a query filtering Instagram URLs, niche keywords, location keywords, email providers, and excludes media pages (`/p/`, `/reel/`, `/tv/`)  
      - Output: Raw Google search query string only  
    - Inputs: From "Edit Fields"  
    - Outputs: To "Code" node (via OpenAI Chat Model)  
    - Edge cases: AI misinterpretation of niche or location; malformed queries if input fields are empty or invalid  
    - Version: Requires LangChain agent integration and OpenAI GPT-4o-mini

  - **OpenAI Chat Model**  
    - Type: LangChain OpenAI Chat Model  
    - Role: Supplies the language model backend (GPT-4o-mini) for the AI Agent  
    - Configuration: Model set to `gpt-4o-mini`, no special options  
    - Credentials: OpenAI API key required  
    - Inputs: From AI Agent node (as language model call)  
    - Outputs: Back to AI Agent  
    - Edge cases: API rate limits, authentication failures, model downtime

- **Sticky Note:**  
  "Generating Custom Optimized Search Engine Query for finding Instagram Accounts"

---

#### 2.3 Query Preparation

- **Overview:** Escapes special characters in the AI-generated Google search query to ensure it can be safely sent in an HTTP request body.
- **Nodes Involved:**  
  - Code (Function)
- **Node Details:**

  - **Code**  
    - Type: Function  
    - Role: Escapes double quotes `"` in the query string by replacing them with `\"` to prevent JSON parsing errors  
    - Code logic: Accesses AI Agent output (`output` field), replaces `"` with `\\\"`, and outputs `escapedQuery`  
    - Inputs: From AI Agent  
    - Outputs: To HTTP Request (Google Search API)  
    - Edge cases: If AI output is empty or malformed, escape logic may fail or produce invalid query

- **Sticky Note:**  
  "Extracting Search Results Using Apify Api"

---

#### 2.4 Google Search Scraping

- **Overview:** Queries Apify’s Google Search Scraper using the escaped Google query string, returning organic search results related to Instagram influencer profiles.
- **Nodes Involved:**  
  - HTTP Request (Google Search API)  
  - Split Out
- **Node Details:**

  - **HTTP Request**  
    - Type: HTTP Request  
    - Role: Calls Apify Google Search Scraper API synchronously with JSON body containing parameters:  
      - `focusOnPaidAds`: false  
      - `maxPagesPerQuery`: 20  
      - `queries`: Escaped query string from previous node  
      - `resultsPerPage`: 100  
      - Other flags for filtering and saving HTML disabled  
    - Inputs: From Code (escaped query)  
    - Outputs: To Split Out  
    - Edge cases: API token invalid or missing (`apify_api_YOUR_TOKEN_HERE` placeholder must be replaced), network timeouts, rate limiting, malformed request body

  - **Split Out**  
    - Type: Split Out  
    - Role: Splits the array of `organicResults` from the HTTP response into individual items for further processing  
    - Field to split out: `organicResults`  
    - Inputs: From HTTP Request  
    - Outputs: To Loop Over Items  
    - Edge cases: If `organicResults` is empty or missing, no items proceed downstream

---

#### 2.5 Results Processing and Batching

- **Overview:** Batches the individual search result items for controlled, sequential Instagram profile scraping.
- **Nodes Involved:**  
  - Loop Over Items (SplitInBatches)
- **Node Details:**

  - **Loop Over Items**  
    - Type: SplitInBatches  
    - Role: Processes items one-by-one or in small batches to avoid overloading API calls or hitting rate limits  
    - Inputs: From Split Out  
    - Outputs: Main output to Code1; second output to terminate or handle batch ends  
    - Edge cases: Empty input list; batch size defaults or limits not explicitly defined (default batch size is 1)

---

#### 2.6 Instagram Profile Scraping

- **Overview:** Cleans each URL from the Google search results and requests detailed Instagram profile data using Apify Instagram Scraper API.
- **Nodes Involved:**  
  - Code1 (Function)  
  - HTTP Request1 (Apify Instagram Scraper)
- **Node Details:**

  - **Code1**  
    - Type: Function  
    - Role: Cleans Instagram URLs by removing trailing slashes to ensure consistent API input  
    - Logic: Regex removes trailing `/` from the URL string from the current item  
    - Inputs: From Loop Over Items  
    - Outputs: To HTTP Request1  
    - Edge cases: Missing or malformed URL fields

  - **HTTP Request1**  
    - Type: HTTP Request  
    - Role: Calls Apify Instagram Scraper API synchronously with JSON body specifying:  
      - `directUrls`: Array including cleaned URL  
      - Limits on results, type of search, and detail level (e.g., `resultsLimit`: 2, `resultsType`: "details")  
    - Inputs: From Code1  
    - Outputs: To Information Extractor  
    - Edge cases: API token invalid or missing, network errors, empty results

- **Sticky Note:**  
  "Going Through Each of the Accounts & Extracting Leads From User's Bio"

---

#### 2.7 Email Extraction

- **Overview:** Extracts email addresses from Instagram user biographies using an AI-powered information extraction node.
- **Nodes Involved:**  
  - Information Extractor (LangChain)  
  - OpenAI Chat Model1
- **Node Details:**

  - **Information Extractor**  
    - Type: LangChain Information Extractor  
    - Role: Parses the biography text (`biography` field from Instagram data) to extract email addresses in lowercase  
    - Configuration:  
      - System prompt instructs to extract email or assign "N/A" if none found  
      - Output schema defines JSON with single attribute `Email` (email format)  
    - Inputs: From HTTP Request1 (Instagram profile data)  
    - Outputs: To Postgres node  
    - Edge cases: No email found results in "N/A", malformed bio text, extraction errors

  - **OpenAI Chat Model1**  
    - Type: LangChain OpenAI Chat Model  
    - Role: Language model backend for Information Extractor using GPT-3.5-turbo  
    - Inputs: From Information Extractor node  
    - Outputs: To Information Extractor (as language model call)  
    - Edge cases: API limits, auth errors

---

#### 2.8 Data Storage

- **Overview:** Inserts or updates the extracted lead data in a PostgreSQL table dedicated to Instagram leads in the selected niche.
- **Nodes Involved:**  
  - Postgres
- **Node Details:**

  - **Postgres**  
    - Type: PostgreSQL node  
    - Role: Upserts lead data into `Instagram_Leads_Beauty&Hair` table in `public` schema  
    - Data fields mapped:  
      - `email` from extracted Email attribute  
      - `user_name` from Instagram username  
      - `account_link` from Instagram profile URL  
      - `follower_count` from Instagram follower count  
      - `target_country` and `field_of_interest` from initial input fields  
    - Matching column on `user_name` to avoid duplicates  
    - Inputs: From Information Extractor  
    - Credentials: PostgreSQL account configured  
    - Edge cases: DB connection failure, data type mismatches, unique constraint conflicts

- **Sticky Note:**  
  "Storing Leads In PostgreSQL"

---

### 3. Summary Table

| Node Name                  | Node Type                             | Functional Role                                  | Input Node(s)                  | Output Node(s)                 | Sticky Note                                                        |
|----------------------------|-------------------------------------|-------------------------------------------------|-------------------------------|-------------------------------|-------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger                      | Workflow start trigger                           | None                          | Edit Fields                   | Specifying Our Target Niche                                       |
| Edit Fields                | Set                                 | Define niche and target country input fields    | When clicking ‘Test workflow’ | AI Agent                     | Specifying Our Target Niche                                       |
| AI Agent                   | LangChain Agent                     | Generate Google search query string              | Edit Fields                   | Code                         | Generating Custom Optimized Search Engine Query for finding Instagram Accounts |
| OpenAI Chat Model          | LangChain OpenAI Chat Model         | Provide GPT-4o-mini model for AI Agent           | AI Agent (as LM)              | AI Agent (back)               | Generating Custom Optimized Search Engine Query for finding Instagram Accounts |
| Code                       | Function                           | Escape quotes in generated Google query           | AI Agent                     | HTTP Request                 | Extracting Search Results Using Apify Api                         |
| HTTP Request               | HTTP Request                       | Call Apify Google Search Scraper API              | Code                         | Split Out                    | Extracting Search Results Using Apify Api                         |
| Split Out                  | Split Out                         | Split search results into individual items       | HTTP Request                 | Loop Over Items              | Extracting Search Results Using Apify Api                         |
| Loop Over Items            | SplitInBatches                    | Batch process each search result item             | Split Out                   | Code1 (main), (second output unused) | Going Through Each of the Accounts & Extracting Leads From User's Bio |
| Code1                      | Function                         | Clean URLs for Instagram scraper input            | Loop Over Items              | HTTP Request1               | Going Through Each of the Accounts & Extracting Leads From User's Bio |
| HTTP Request1              | HTTP Request                     | Call Apify Instagram Scraper API                   | Code1                       | Information Extractor       | Going Through Each of the Accounts & Extracting Leads From User's Bio |
| Information Extractor      | LangChain Information Extractor   | Extract email from Instagram biography             | HTTP Request1               | Postgres                   | Going Through Each of the Accounts & Extracting Leads From User's Bio |
| OpenAI Chat Model1         | LangChain OpenAI Chat Model        | Provide GPT-3.5-turbo model for extraction         | Information Extractor (as LM) | Information Extractor       | Going Through Each of the Accounts & Extracting Leads From User's Bio |
| Postgres                  | PostgreSQL                        | Upsert lead data into PostgreSQL database          | Information Extractor       | Loop Over Items             | Storing Leads In PostgreSQL                                       |
| Sticky Note               | Sticky Note                      | Comment/annotation node                             | None                        | None                        | Specifying Our Target Niche                                       |
| Sticky Note1              | Sticky Note                      | Comment/annotation node                             | None                        | None                        | Generating Custom Optimized Search Engine Query for finding Instagram Accounts |
| Sticky Note2              | Sticky Note                      | Comment/annotation node                             | None                        | None                        | Extracting Search Results Using Apify Api                         |
| Sticky Note3              | Sticky Note                      | Comment/annotation node                             | None                        | None                        | Going Through Each of the Accounts & Extracting Leads From User's Bio |
| Sticky Note4              | Sticky Note                      | Comment/annotation node                             | None                        | None                        | Storing Leads In PostgreSQL                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node:**  
   - Name: `When clicking ‘Test workflow’`  
   - Type: Manual Trigger (no parameters)  
   - Position: Start node

2. **Create Set Node:**  
   - Name: `Edit Fields`  
   - Type: Set  
   - Parameters:  
     - `site` = "instagram" (string)  
     - `field_of_interest` = "beauty & hair" (string)  
     - `target_country` = "USA" (string)  
   - Connect: from `When clicking ‘Test workflow’` main output

3. **Create LangChain Agent Node:**  
   - Name: `AI Agent`  
   - Type: LangChain Agent  
   - Parameters:  
     - Text input:  
       ```
       =field of interest: {{ $json.field_of_interest }}
       target country: {{ $json.target_country }}
       ```  
     - System message instructing to output a Google search query with filters for Instagram and email domains, excluding media URLs, replacing niche and location dynamically (as described in overview)  
     - Prompt Type: Define  
   - Connect: from `Edit Fields` main output

4. **Create LangChain OpenAI Chat Model Node:**  
   - Name: `OpenAI Chat Model`  
   - Type: LangChain OpenAI Chat Model  
   - Parameters: Model: `gpt-4o-mini`  
   - Credentials: Configure OpenAI API credentials  
   - Connect: To `AI Agent` under ai_languageModel input

5. **Create Function Node:**  
   - Name: `Code`  
   - Type: Function  
   - Code:  
     ```javascript
     const inputQuery = $input.first().json.output;
     const escapedQuery = inputQuery.replace(/"/g, '\\"');
     return [{ json: { escapedQuery } }];
     ```  
   - Connect: from `AI Agent` main output

6. **Create HTTP Request Node (Google Search API):**  
   - Name: `HTTP Request`  
   - Type: HTTP Request  
   - Parameters:  
     - URL: `https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync-get-dataset-items?token=apify_api_YOUR_TOKEN_HERE` (replace token with valid Apify token)  
     - Method: POST  
     - Body Content-Type: JSON  
     - JSON Body:  
       ```json
       {
         "focusOnPaidAds": false,
         "forceExactMatch": false,
         "includeIcons": false,
         "includeUnfilteredResults": false,
         "maxPagesPerQuery": 20,
         "mobileResults": false,
         "queries": "{{ $json.escapedQuery }}",
         "resultsPerPage": 100,
         "saveHtml": false,
         "saveHtmlToKeyValueStore": true
       }
       ```  
   - Connect: from `Code` node main output

7. **Create Split Out Node:**  
   - Name: `Split Out`  
   - Type: Split Out  
   - Field to split out: `organicResults`  
   - Connect: from `HTTP Request` main output

8. **Create SplitInBatches Node:**  
   - Name: `Loop Over Items`  
   - Type: SplitInBatches  
   - Batch size: default (1) or set as needed  
   - Connect: from `Split Out` main output

9. **Create Function Node:**  
   - Name: `Code1`  
   - Type: Function  
   - Code:  
     ```javascript
     const inputUrl = $input.first().json.url;
     const cleanedUrl = inputUrl.replace(/\/$/, "");
     return [{ json: { cleanedUrl } }];
     ```  
   - Connect: from `Loop Over Items` main output (main output connection)

10. **Create HTTP Request Node (Instagram Scraper API):**  
    - Name: `HTTP Request1`  
    - Type: HTTP Request  
    - Parameters:  
      - URL: `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=apify_api_YOUR_TOKEN_HERE` (replace token)  
      - Method: POST  
      - Body Content-Type: JSON  
      - JSON Body:  
        ```json
        {
          "addParentData": false,
          "directUrls": ["{{ $json.cleanedUrl }}"],
          "enhanceUserSearchWithFacebookPage": false,
          "isUserReelFeedURL": false,
          "isUserTaggedFeedURL": false,
          "resultsLimit": 2,
          "resultsType": "details",
          "searchLimit": 1,
          "searchType": "hashtag"
        }
        ```  
    - Connect: from `Code1` main output

11. **Create LangChain Information Extractor Node:**  
    - Name: `Information Extractor`  
    - Type: LangChain Information Extractor  
    - Parameters:  
      - Text input: `={{ $json.biography }}`  
      - System Prompt: Extract email from text as JSON attribute `Email`; if none, assign "N/A"; always lowercase emails  
      - Schema Type: Manual  
      - Input Schema: JSON schema specifying `Email` as string with email format  
    - Connect: from `HTTP Request1` main output

12. **Create LangChain OpenAI Chat Model Node:**  
    - Name: `OpenAI Chat Model1`  
    - Type: LangChain OpenAI Chat Model  
    - Parameters:  
      - Model: `gpt-3.5-turbo`  
    - Credentials: Configure OpenAI API credentials  
    - Connect: to `Information Extractor` under ai_languageModel input

13. **Create PostgreSQL Node:**  
    - Name: `Postgres`  
    - Type: PostgreSQL  
    - Parameters:  
      - Operation: Upsert  
      - Table: `Instagram_Leads_Beauty&Hair`  
      - Schema: `public`  
      - Columns mapped:  
        - `email` = `={{ $('Information Extractor').item.json.output[0].Email }}`  
        - `user_name` = `={{ $('HTTP Request1').item.json.username }}`  
        - `account_link` = `={{ $('HTTP Request1').item.json.inputUrl }}`  
        - `follower_count` = `={{ $('HTTP Request1').item.json.followsCount }}`  
        - `target_country` = `={{ $('Edit Fields').item.json.target_country }}`  
        - `field_of_interest` = `={{ $('Edit Fields').item.json.field_of_interest }}`  
      - Matching Columns: `user_name`  
    - Credentials: Configure PostgreSQL credentials  
    - Connect: from `Information Extractor` main output

14. **Connect PostgreSQL Node back to SplitInBatches node:**  
    - Connect `Postgres` main output to `Loop Over Items` second input to continue batch processing

15. **Add Sticky Notes:**  
    - Add notes as per the workflow logic to document each block for visual clarity

---

### 5. General Notes & Resources

| Note Content                                                                                           | Context or Link                                                                                  |
|------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Replace placeholder `apify_api_YOUR_TOKEN_HERE` with your actual Apify API token for scraping APIs.  | Apify API Authentication                                                                        |
| OpenAI API credentials must be configured for GPT-4o-mini and GPT-3.5-turbo models in n8n credentials. | OpenAI API account setup                                                                        |
| PostgreSQL database table `Instagram_Leads_Beauty&Hair` must exist with columns: `email`, `user_name`, `account_link`, `follower_count`, `target_country`, `field_of_interest`. | Database schema setup                                                                           |
| The workflow assumes Instagram biographies contain publicly available emails, which may be rare or inconsistent. | Data privacy and ethical considerations                                                        |
| Rate limits and API quotas for Apify and OpenAI should be monitored to avoid failures during batch processing. | API usage monitoring                                                                            |
| Sticky Notes in the workflow provide visual documentation for each logical block.                     | Workflow documentation convenience                                                             |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly available.