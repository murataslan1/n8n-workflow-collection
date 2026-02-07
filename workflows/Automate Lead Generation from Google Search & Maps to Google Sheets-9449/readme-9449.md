Automate Lead Generation from Google Search & Maps to Google Sheets

https://n8nworkflows.xyz/workflows/automate-lead-generation-from-google-search---maps-to-google-sheets-9449


# Automate Lead Generation from Google Search & Maps to Google Sheets

### 1. Workflow Overview

This workflow automates lead generation by extracting business contact information from Google Search results and Google Maps, then consolidating and saving enriched leads to a Google Sheets spreadsheet. The workflow is triggered by a chat message containing a search query (e.g., "dentists in New York") and performs multi-step data retrieval, cleaning, enrichment, and deduplication before appending unique leads to the sheet.

Logical blocks are organized as follows:

- **1.1 Trigger & Initial Setup:** Receives the user query and prepares pagination and initial data.
- **1.2 Google Custom Search Branch:** Executes multi-page Google Custom Search API calls, extracts and deduplicates initial search results.
- **1.3 Google Maps Scraping Branch:** Formats query for Google Maps, scrapes Maps results, extracts business URLs, filters and deduplicates them.
- **1.4 Website Scraping & Enrichment:** Visits business websites found in both branches to extract emails, phones, socials, and description details.
- **1.5 Validation & Deduplication:** Loads existing leads from Google Sheets, performs advanced duplicate checks, filters out non-business sites (e.g., blogs), then appends new unique leads.
- **1.6 Final Data Saving:** Writes enriched and verified leads into Google Sheets.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger & Initial Setup

**Overview:**  
Starts the workflow by capturing the user’s chat input query. Sets up pagination indices for multi-page Google Search and initiates retrieval of existing leads from Google Sheets.

**Nodes Involved:**  
- When chat message received  
- Setting Pagination  
- Get row(s) in sheet  
- Get row(s) in sheet1  
- Prepare Query for Maps  

**Node Details:**

- **When chat message received**  
  - Type: LangChain Chat Trigger  
  - Role: Entry point; listens for chat input (user’s search query)  
  - Configuration: Default, triggers on any chat message  
  - Outputs: Passes chat input text downstream as `chatInput`  
  - Edge Cases: No input or empty message could stop flow; ensure input validation upstream.

- **Setting Pagination**  
  - Type: Code  
  - Role: Generates pagination indices `[1, 11, 21, 31]` for Google Custom Search API “start” parameter  
  - Code: Returns array of objects with `.start` values  
  - Outputs: Pagination items for looping over multiple pages  
  - Edge Cases: Pagination range hardcoded; may need adjustment for more/less pages.

- **Get row(s) in sheet / Get row(s) in sheet1**  
  - Type: Google Sheets  
  - Role: Fetch all existing leads from the Google Sheet to perform deduplication before adding new leads  
  - Configuration: Reads sheet with document ID `1JvDSWt5K1Cc9wCd36MADVbh4tu4KdPAzVlMUstv_ou8`, `gid=0`  
  - Edge Cases: API errors, empty sheets, auth failures.

- **Prepare Query for Maps**  
  - Type: Code  
  - Role: Converts chat input into URL-safe format for Google Maps scraping (replaces spaces with “+”)  
  - Input: `chatInput` from trigger  
  - Output: JSON with `searchQuery` string  
  - Edge Cases: Input text encoding issues or special characters.

---

#### 1.2 Google Custom Search Branch

**Overview:**  
Performs multi-page Google Custom Search API calls with the user query to retrieve web search results, extracts and structures key business data, and removes duplicate URLs.

**Nodes Involved:**  
- Loop for Multiple Page Search  
- Custom Google Search API  
- Flatten Output Items  
- Information Extraction  
- Remove Duplicates From Searches  
- If (email check)  
- Append row in sheet / Loop Over Items1 (conditional split)

**Node Details:**

- **Loop for Multiple Page Search**  
  - Type: SplitInBatches  
  - Role: Iterates over pagination indices to request multiple pages of Google Search results  
  - Input: Pagination array from Setting Pagination  
  - Output: Single page start index per batch  
  - Edge Cases: API rate limits if too many calls.

- **Custom Google Search API**  
  - Type: HTTP Request  
  - Role: Calls Google Custom Search API with API key and Custom Search Engine ID  
  - Query Params: Includes user’s search query, country, language, and pagination start index  
  - Outputs: JSON response containing search results  
  - Edge Cases: API quota exceeded, invalid keys, network errors.

- **Flatten Output Items**  
  - Type: Code  
  - Role: Unnests the `items` array from API response into individual items for easier processing  
  - Code: Maps all items into separate output objects  
  - Edge Cases: Missing or empty items array.

- **Information Extraction**  
  - Type: Code  
  - Role: Extracts business name, email, phone, URL, description, type, and socials from each search result's metadata  
  - Logic: Parses `pagemap.metatags[0]` and other fields  
  - Edge Cases: Missing metatags or incomplete data.

- **Remove Duplicates From Searches**  
  - Type: RemoveDuplicates  
  - Role: Deduplicates results by unique `URL` field to avoid redundant processing  
  - Edge Cases: URLs with minor differences (e.g., trailing slashes) might be treated as distinct.

- **If (email check)**  
  - Type: If  
  - Role: Checks if an email address was extracted; if yes, leads proceed to be appended; if no, they are routed for website scraping enrichment  
  - Condition: `Email ID` not empty  
  - Edge Cases: False negatives if email extraction fails.

- **Append row in sheet**  
  - Type: Google Sheets  
  - Role: Appends leads that have email information directly to the sheet  
  - Columns: URL, Type, Socials, Description, Search Query, Business Name, Primary Email, Contact Number  
  - Edge Cases: Sheet write failures, schema mismatch.

- **Loop Over Items1**  
  - Type: SplitInBatches  
  - Role: Batch processing of leads lacking email for deeper website scraping enrichment  
  - Edge Cases: Large batch size may cause throttling.

---

#### 1.3 Google Maps Scraping Branch

**Overview:**  
Scrapes Google Maps search results page for business URLs, cleans irrelevant links, deduplicates, and loops over each URL for detailed website scraping and contact extraction.

**Nodes Involved:**  
- Scrape Google Maps  
- Extract URLs  
- Filter Google URLs  
- Remove Duplicates  
- Loop Over Items  
- Scrape Map Sites  
- Wait2  
- Extract Information (website content)

**Node Details:**

- **Scrape Google Maps**  
  - Type: HTTP Request  
  - Role: Fetches HTML content of Google Maps search results page for the formatted query  
  - URL: `https://www.google.com/maps/search/{{ searchQuery }}`  
  - Edge Cases: Google blocks scraping, changed page structure.

- **Extract URLs**  
  - Type: Code  
  - Role: Uses regex to extract all URLs from the Maps HTML content  
  - Regex: Matches `http(s)://` links  
  - Output: List of website URLs  
  - Edge Cases: False positives or malformed URLs.

- **Filter Google URLs**  
  - Type: Filter  
  - Role: Removes URLs containing "schema", "google", "gg", or "gstatic" to exclude irrelevant links  
  - Edge Cases: Over-filtering valid URLs.

- **Remove Duplicates**  
  - Type: RemoveDuplicates  
  - Role: Deduplicates URLs to unique list for further processing  
  - Edge Cases: URL variants with trailing slashes.

- **Loop Over Items**  
  - Type: SplitInBatches  
  - Role: Processes each unique URL individually for scraping  
  - Edge Cases: Large data sets may cause delays.

- **Scrape Map Sites**  
  - Type: HTTP Request  
  - Role: Scrapes the individual business website HTML content from the URL  
  - Config: No redirects, raw HTML response, allows insecure certs  
  - Edge Cases: Sites blocking bots, redirects, or timeouts.

- **Wait2**  
  - Type: Wait  
  - Role: Pauses for 1 second between requests to avoid IP blocking  
  - Edge Cases: Inefficient for very large batches.

- **Extract Information**  
  - Type: Code  
  - Role: Parses scraped HTML to extract emails, phones, and social links using regex  
  - Regexes: Email, phone, social media domains  
  - Output: Structured contact info  
  - Edge Cases: HTML format changes, missing data.

---

#### 1.4 Website Scraping & Enrichment

**Overview:**  
For leads without emails initially, visits their websites (from Google Search results), scrapes and extracts contact info, consolidates data.

**Nodes Involved:**  
- Loop Over Items1 (from Google Search leads needing enrichment)  
- Scrape Site2  
- If Site scrapped  
- Extract Required Fields  
- Set All Fields  

**Node Details:**

- **Loop Over Items1**  
  - Type: SplitInBatches  
  - Role: Processes each lead to scrape its website for missing contact details  
  - Edge Cases: Large number of sites.

- **Scrape Site2**  
  - Type: HTTP Request  
  - Role: Downloads HTML content of the lead’s website URL  
  - Config: No redirects, raw text response, allows insecure certs  
  - Edge Cases: Site down or blocked.

- **If Site scrapped**  
  - Type: If  
  - Role: Checks if HTML content was successfully retrieved  
  - Condition: Non-empty `data` field  
  - Edge Cases: False negatives if partial content.

- **Extract Required Fields**  
  - Type: Code  
  - Role: Uses regex extraction on HTML to find multiple emails, phones, social links, and consolidates them  
  - Logic: Returns first email as primary, others as secondary, concatenates phones/socials  
  - Edge Cases: Regex mismatches, multiple conflicting data.

- **Set All Fields**  
  - Type: Set  
  - Role: Consolidates extracted fields and enriches lead data for final processing  
  - Maps extracted emails, phones, socials, business name, URL, type, description  
  - Edge Cases: Missing or null values.

---

#### 1.5 Validation & Deduplication

**Overview:**  
Loads current leads from Google Sheets, prepares URLs for matching, merges new leads with existing data, filters out blogs and articles, removes duplicates.

**Nodes Involved:**  
- Set URL for Validation / Set URL Validaiton  
- Not Duplicate Search Results / Validating Unique Results  
- If Site Exists / If Site exists  
- Exclude Articles and Blogs  
- Remove Duplicates For Sheets / Remove Duplicates3  

**Node Details:**

- **Set URL for Validation / Set URL Validaiton**  
  - Type: Set  
  - Role: Extracts URL field from leads for matching  
  - Edge Cases: Missing URLs.

- **Not Duplicate Search Results / Validating Unique Results**  
  - Type: Merge  
  - Role: Performs fuzzy merge between new leads and existing leads in sheet based on URLs  
  - Join Mode: Keep non-matches (new unique leads)  
  - Edge Cases: URL variants causing false duplicates.

- **If Site Exists / If Site exists**  
  - Type: If  
  - Role: Checks if URL exists (valid lead) before saving  
  - Condition: URL field exists and not empty  
  - Edge Cases: Missing URLs.

- **Exclude Articles and Blogs**  
  - Type: If  
  - Role: Filters out search results that are likely articles or blogs by checking `Type` field  
  - Filters out types equal to "article" or "blog"  
  - Edge Cases: Incorrect type tagging.

- **Remove Duplicates For Sheets / Remove Duplicates3**  
  - Type: RemoveDuplicates  
  - Role: Final deduplication on leads to be appended into Google Sheets  
  - Edge Cases: Residual duplicates due to URL variations.

---

#### 1.6 Final Data Saving

**Overview:**  
Appends final enriched, unique leads into Google Sheets.

**Nodes Involved:**  
- Append row in sheet  
- Append row in sheet2  
- Add Search Results in Sheets  

**Node Details:**

- **Append row in sheet / Append row in sheet2 / Add Search Results in Sheets**  
  - Type: Google Sheets  
  - Role: Appends new lead entries to Google Sheet with complete info  
  - Columns: URL, Type, Socials, Rest Email, Description, Search Query, Business Name, Primary Email, Contact Number  
  - Edge Cases: API write errors, schema mismatches.

---

### 3. Summary Table

| Node Name                  | Node Type                     | Functional Role                                   | Input Node(s)                     | Output Node(s)                                | Sticky Note                                                                                                           |
|----------------------------|-------------------------------|-------------------------------------------------|----------------------------------|-----------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| When chat message received | LangChain Chat Trigger         | Entry trigger capturing user’s search query     | -                                | Setting Pagination, Get row(s) in sheet, Prepare Query for Maps, Get row(s) in sheet1 | Phase 1 Trigger and initial setup                                                                                      |
| Setting Pagination          | Code                          | Builds pagination indices for Google Search API | When chat message received        | Loop for Multiple Page Search                   | Phase 1 Pagination setup                                                                                               |
| Loop for Multiple Page Search | SplitInBatches               | Iterates over search pages                        | Setting Pagination                | If, Custom Google Search API                    | Phase 1 Search page looping                                                                                             |
| If                         | If                            | Checks if Email ID is present                     | Loop for Multiple Page Search     | Append row in sheet, Loop Over Items1           | Phase 1 Email presence check                                                                                           |
| Custom Google Search API    | HTTP Request                  | Calls Google Custom Search API                    | Loop for Multiple Page Search     | Flatten Output Items                            | Phase 1 Google Search API call                                                                                          |
| Flatten Output Items        | Code                          | Converts results array to individual items        | Custom Google Search API          | Information Extraction                          | Phase 1 Result flattening                                                                                               |
| Information Extraction      | Code                          | Extracts business info from search results        | Flatten Output Items              | Remove Duplicates From Searches                 | Phase 1 Data extraction                                                                                                 |
| Remove Duplicates From Searches | RemoveDuplicates           | Deduplicates search results by URL                | Information Extraction            | Loop for Multiple Page Search                    | Phase 1 Deduplication                                                                                                   |
| Append row in sheet         | Google Sheets                 | Appends leads with email info                      | If                              | -                                             | Phase 1 Direct save for leads with email                                                                                |
| Loop Over Items1            | SplitInBatches                | Processes leads needing enrichment                 | If                              | Not Duplicate Search Results, Scrape Site2     | Phase 3 Website enrichment processing                                                                                   |
| Scrape Site2                | HTTP Request                  | Scrapes website HTML for enrichment                | Loop Over Items1                 | If Site scrapped                                | Phase 3 Website scraping                                                                                                |
| If Site scrapped            | If                            | Checks if website scrape returned HTML             | Scrape Site2                    | Extract Required Fields, Loop Over Items1       | Phase 3 Scrape success check                                                                                            |
| Extract Required Fields     | Code                          | Extracts emails, phones, socials from HTML        | If Site scrapped                | Set All Fields                                  | Phase 3 Data extraction from website                                                                                     |
| Set All Fields              | Set                           | Consolidates enriched contact info                 | Extract Required Fields          | Loop Over Items1                                | Phase 3 Data consolidation                                                                                              |
| Prepare Query for Maps      | Code                          | Formats search query for Google Maps scraping     | When chat message received        | Scrape Google Maps                              | Phase 2 Maps query formatting                                                                                           |
| Scrape Google Maps          | HTTP Request                  | Scrapes Google Maps search results page            | Prepare Query for Maps           | Extract URLs                                    | Phase 2 Maps scraping                                                                                                   |
| Extract URLs                | Code                          | Extracts website URLs from Maps HTML                | Scrape Google Maps              | Filter Google URLs                              | Phase 2 URL extraction                                                                                                  |
| Filter Google URLs          | Filter                        | Removes irrelevant Google URLs                      | Extract URLs                   | Remove Duplicates                               | Phase 2 URL filtering                                                                                                   |
| Remove Duplicates           | RemoveDuplicates              | Deduplicates Maps URLs                              | Filter Google URLs              | Loop Over Items                                 | Phase 2 Deduplication                                                                                                   |
| Loop Over Items             | SplitInBatches                | Processes each Maps website URL                     | Remove Duplicates               | Validating Unique Results, Scrape Map Sites      | Phase 2 Website scraping loop                                                                                           |
| Scrape Map Sites            | HTTP Request                  | Scrapes individual Maps business websites          | Loop Over Items                | Wait2                                           | Phase 2 Website scraping                                                                                                |
| Wait2                      | Wait                          | Rate limits scraping requests                       | Scrape Map Sites               | Extract Information                             | Phase 2 Rate limiting                                                                                                   |
| Extract Information         | Code                          | Extracts emails, phones, socials from scraped HTML | Wait2                         | Loop Over Items1                                | Phase 2 Data extraction                                                                                                |
| Get row(s) in sheet         | Google Sheets                 | Loads existing leads from Google Sheets             | When chat message received        | Set URL for Validation                          | Phase 4 Load existing leads                                                                                             |
| Set URL for Validation      | Set                           | Extracts URL field for deduplication                 | Get row(s) in sheet            | Not Duplicate Search Results                     | Phase 4 URL preparation                                                                                                |
| Not Duplicate Search Results | Merge                        | Fuzzy merges new leads with existing leads           | Loop Over Items1, Set URL for Validation | If Site Exists                                  | Phase 4 Deduplication                                                                                                   |
| If Site Exists              | If                            | Checks if URL exists for new lead                    | Not Duplicate Search Results   | Exclude Articles and Blogs                       | Phase 4 URL validation                                                                                                |
| Exclude Articles and Blogs  | If                            | Filters out articles/blogs by Type field              | If Site Exists                | Remove Duplicates For Sheets                      | Phase 4 Filtering non-business results                                                                                  |
| Remove Duplicates For Sheets | RemoveDuplicates             | Final deduplication before saving                     | Exclude Articles and Blogs     | Append row in sheet2                             | Phase 4 Final deduplication                                                                                            |
| Append row in sheet2        | Google Sheets                 | Saves enriched final leads                            | Remove Duplicates For Sheets   | -                                               | Phase 4 Final saving                                                                                                    |
| Validating Unique Results   | Merge                        | Fuzzy merge for Maps URLs with existing leads          | Loop Over Items, Set URL Validaiton | If Site exists                                   | Phase 4 Deduplication for Maps leads                                                                                   |
| Set URL Validaiton          | Set                           | Prepares URLs for matching from Google Maps leads     | Get row(s) in sheet1           | Validating Unique Results                         | Phase 4 URL preparation                                                                                                |
| If Site exists              | If                            | Checks if URL exists for Maps lead                      | Validating Unique Results      | Remove Duplicates3                               | Phase 4 URL validation                                                                                                |
| Remove Duplicates3          | RemoveDuplicates              | Deduplicates final Maps leads before saving            | If Site exists                | Append row in sheet2                             | Phase 4 Final deduplication                                                                                            |
| Append row in sheet2        | Google Sheets                 | Appends final Maps leads to Google Sheets               | Remove Duplicates3             | -                                               | Phase 4 Final saving                                                                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node: "When chat message received"**  
   - Type: LangChain Chat Trigger  
   - Default settings  
   - Purpose: Receive user search query text as `chatInput`.

2. **Create "Setting Pagination" Code Node**  
   - JS code: Returns array of pagination start indices `[1,11,21,31]` in JSON format  
   - Output: Items with `.start` property.

3. **Connect "When chat message received" to "Setting Pagination"**

4. **Create "Loop for Multiple Page Search" Node**  
   - Type: SplitInBatches  
   - No special config; processes each pagination start index  
   - Connect output of "Setting Pagination" to this node.

5. **Create "Custom Google Search API" HTTP Request Node**  
   - Method: GET  
   - URL: `https://www.googleapis.com/customsearch/v1`  
   - Query parameters:  
     - `key`: Your Google API key  
     - `cx`: Your Custom Search Engine ID  
     - `q`: Expression: `={{ $('When chat message received').item.json.chatInput }}`  
     - `cr`: `countryUS`  
     - `gl`: `us`  
     - `lr`: `lang_en`  
     - `start`: Expression: `={{ $json.start }}`  
   - Connect output of "Loop for Multiple Page Search" to this node.

6. **Create "Flatten Output Items" Code Node**  
   - JS code: Extracts `.items` array and outputs each item separately  
   - Connect from "Custom Google Search API".

7. **Create "Information Extraction" Code Node**  
   - JS code: Extracts business name, email, phone, URL, description, type, socials from search result metadata  
   - Connect from "Flatten Output Items".

8. **Create "Remove Duplicates From Searches" Node**  
   - Type: RemoveDuplicates  
   - Compare by field: `URL`  
   - Connect from "Information Extraction".

9. **Connect "Remove Duplicates From Searches" back to "Loop for Multiple Page Search"**  
   - This creates a loop for cumulative pagination processing.

10. **Create "If" Node for Email Check**  
    - Condition: `Email ID` is not empty  
    - Connect from "Loop for Multiple Page Search".

11. **Create "Append row in sheet" Google Sheets Node**  
    - Document ID: Your Google Sheet ID  
    - Sheet: `gid=0` or default sheet name  
    - Operation: Append  
    - Map columns: URL, Type, Socials, Description, Search Query (from chatInput), Business Name, Primary Email, Contact Number  
    - Connect "If" true output here.

12. **Create "Loop Over Items1" Node**  
    - Type: SplitInBatches  
    - Connect "If" false output here for leads missing email.

13. **Create "Scrape Site2" HTTP Request Node**  
    - URL: Expression `={{ $json.URL }}`  
    - Method: GET  
    - Config: No redirect follow, response as text, allow unauthorized certs  
    - Connect from "Loop Over Items1".

14. **Create "If Site scrapped" Node**  
    - Condition: `data` field exists and is not empty  
    - Connect from "Scrape Site2".

15. **Create "Extract Required Fields" Code Node**  
    - JS code: Uses regex to extract emails, phones, socials from HTML content  
    - Connect from "If Site scrapped" true.

16. **Create "Set All Fields" Node**  
    - Assign extracted emails, phones, socials, along with business name, URL, type, description fields from search results  
    - Connect from "Extract Required Fields".

17. **Connect "Set All Fields" back to "Loop Over Items1" for iterative enrichment**

18. **Create "Prepare Query for Maps" Code Node**  
    - JS code: Converts chat input to URL-encoded format replacing spaces with `+`  
    - Connect from "When chat message received".

19. **Create "Scrape Google Maps" HTTP Request Node**  
    - URL: Expression `https://www.google.com/maps/search/{{ $json.searchQuery }}`  
    - Method: GET  
    - Connect from "Prepare Query for Maps".

20. **Create "Extract URLs" Code Node**  
    - JS code: Regex to extract all URLs from Maps HTML content  
    - Connect from "Scrape Google Maps".

21. **Create "Filter Google URLs" Node**  
    - Type: Filter  
    - Condition: URL does NOT contain "schema", "google", "gg", or "gstatic"  
    - Connect from "Extract URLs".

22. **Create "Remove Duplicates" Node**  
    - Deduplicate URLs  
    - Connect from "Filter Google URLs".

23. **Create "Loop Over Items" Node**  
    - SplitInBatches for processing each unique Maps URL  
    - Connect from "Remove Duplicates".

24. **Create "Scrape Map Sites" HTTP Request Node**  
    - URL: Expression `={{ $json.website }}`  
    - Method: GET  
    - No redirects, raw response, allow unauthorized certs  
    - Connect from "Loop Over Items".

25. **Create "Wait2" Node**  
    - Pause 1 second to rate limit  
    - Connect from "Scrape Map Sites".

26. **Create "Extract Information" Code Node**  
    - Regex extraction for email, phone, socials from Maps scraped HTML  
    - Connect from "Wait2".

27. **Connect "Extract Information" output to "Loop Over Items1"**  
    - For further deduplication and saving.

28. **Create validation and deduplication nodes:**  
    - "Get row(s) in sheet" (existing leads), "Set URL for Validation" (extract URL), "Not Duplicate Search Results" (merge new and existing leads by URL), "If Site Exists" (check URL exists).  
    - "Exclude Articles and Blogs" filter to discard non-business types.  
    - "Remove Duplicates For Sheets" for final deduplication.

29. **Create final Append nodes:**  
    - "Append row in sheet" for Google Search leads with email.  
    - "Append row in sheet2" for enriched leads after website scraping.  
    - "Add Search Results in Sheets" for final combined saving.

30. **Configure all Google Sheets nodes with proper document ID and sheet names.**

31. **Ensure all connections match the described flow and that error handling (e.g., continue on errors) is configured where needed.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                  | Context or Link                                                                                               |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| The workflow uses Google Custom Search API with a hardcoded API key and Custom Search Engine ID. Make sure to replace with your own credentials.                                                                             | Google Custom Search API docs: https://developers.google.com/custom-search/v1/overview                       |
| Rate limiting (1 second wait) after scraping each website ensures lower risk of IP bans or Captcha.                                                                                                                          | Best practice for web scraping                                                                                 |
| Social media extraction covers domains like Facebook, Twitter, Instagram, LinkedIn, YouTube, Yelp, Pinterest, Google Plus.                                                                                                  | Regex patterns in Extract Required Fields and Extract Information nodes                                       |
| The workflow removes URLs containing "schema", "google", "gg", "gstatic" from Maps scrape results to avoid non-business links.                                                                                              | Filtering step for Google Maps URLs                                                                            |
| The workflow performs multiple deduplication steps: after initial search, after Maps scrape, and before final sheet append to ensure uniqueness.                                                                            | Multiple RemoveDuplicates nodes                                                                                |
| The workflow excludes search results tagged as "article" or "blog" to focus on business leads.                                                                                                                              | Exclude Articles and Blogs node                                                                                 |
| The workflow requires OAuth2 credentials configured for Google Sheets API access.                                                                                                                                             | OAuth2 setup info: https://developers.google.com/identity/protocols/oauth2                                    |
| Ensure the LangChain Chat Trigger node is properly configured and deployed to receive chat messages.                                                                                                                        | n8n LangChain docs: https://docs.n8n.io/nodes/n8n-nodes-langchain/chatTrigger/                                 |
| Sticky notes in the workflow provide detailed phase-by-phase explanations and highlight key processing steps.                                                                                                               | In-workflow sticky notes                                                                                       |

---

Disclaimer: The text provided stems exclusively from an automated workflow created with n8n, an integration and automation tool. The processing strictly respects content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.