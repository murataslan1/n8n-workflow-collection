Automate Company Data Enrichment with ZoomInfo, Serper & Oxylabs to Google Sheets

https://n8nworkflows.xyz/workflows/automate-company-data-enrichment-with-zoominfo--serper---oxylabs-to-google-sheets-7030


# Automate Company Data Enrichment with ZoomInfo, Serper & Oxylabs to Google Sheets

### 1. Workflow Overview

This n8n workflow automates the enrichment of company data based on a list of unprocessed company domains stored in a Google Sheet. Its primary purpose is to gather detailed business information from ZoomInfo by leveraging the Serper Google Search API and the Oxylabs web scraping proxy. The enriched data is then updated back into the Google Sheet for further use.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Triggering the workflow manually and loading unprocessed domains from Google Sheets.
- **1.2 Domain Processing Loop:** Processing each domain in batches sequentially.
- **1.3 ZoomInfo Data Retrieval:** Searching ZoomInfo via Serper API and extracting relevant URLs.
- **1.4 Data Validation and Scraping:** Validating the retrieved URLs and scraping detailed company data using Oxylabs.
- **1.5 Data Parsing and Saving:** Parsing extracted data and updating the Google Sheet with enriched company details.
- **1.6 Workflow Control and Error Handling:** Managing delays for rate limiting, marking domains as processed regardless of success, and ensuring robustness.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
This block initiates the workflow manually and loads unprocessed company domains from a Google Sheet for enrichment.

**Nodes Involved:**  
- Manual Trigger  
- Load Unprocessed Domains

**Node Details:**

- **Manual Trigger**  
  - Type: `manualTrigger`  
  - Role: Starts the workflow manually on user demand.  
  - Config: No parameters configured.  
  - Connections: Outputs to "Load Unprocessed Domains".  
  - Edge cases: None; manual start ensures controlled execution.

- **Load Unprocessed Domains**  
  - Type: `googleSheets`  
  - Role: Reads rows from Google Sheets where the `processed` column is empty (unprocessed domains).  
  - Config:  
    - Document ID and sheet configured for the source Google Sheet.  
    - Filter applied on `processed` column to only fetch unprocessed rows.  
  - Credentials: Google Sheets OAuth2.  
  - Inputs: From "Manual Trigger".  
  - Outputs: To "Process Each Domain".  
  - Edge cases:  
    - API authorization errors if credentials expire.  
    - No unprocessed domains available results in no further processing.

---

#### 2.2 Domain Processing Loop

**Overview:**  
Splits the loaded domains into batches and processes each domain sequentially to respect API rate limits.

**Nodes Involved:**  
- Process Each Domain

**Node Details:**

- **Process Each Domain**  
  - Type: `splitInBatches`  
  - Role: Iterates over each domain, processing them one at a time.  
  - Config: Default batch size (1) to ensure sequential processing.  
  - Inputs: From "Load Unprocessed Domains".  
  - Outputs: Two branches: main success path and error or empty path (second output unused).  
  - Edge cases:  
    - Empty input stops the loop.  
    - Potential delays or errors can halt batch processing.

---

#### 2.3 ZoomInfo Data Retrieval

**Overview:**  
Performs a Google search query via Serper API to locate the ZoomInfo page related to the domain's headquarters in the Czech Republic.

**Nodes Involved:**  
- Search ZoomInfo via Serper  
- Check Search Results Found  
- Extract Domain and ZoomInfo URL  
- Validate if Domain Matches

**Node Details:**

- **Search ZoomInfo via Serper**  
  - Type: `httpRequest`  
  - Role: Executes a POST request to Serper Google Search API to find ZoomInfo pages.  
  - Config:  
    - URL: `https://google.serper.dev/search`  
    - Body: Query string formatted as `where is "{domain}" Czech Republic headquarter? site:zoominfo.com` where `{domain}` is dynamically injected from batch item data.  
    - Authentication: HTTP Header with API key for Serper.  
  - Inputs: From "Process Each Domain".  
  - Outputs: To "Check Search Results Found".  
  - Edge cases:  
    - API key invalid or expired.  
    - No search results returned.

- **Check Search Results Found**  
  - Type: `if`  
  - Role: Checks if the `organic` search results array is non-empty (indicating search success).  
  - Config: Condition verifies `organic` array is not empty.  
  - Inputs: From "Search ZoomInfo via Serper".  
  - Outputs:  
    - True branch to "Extract Domain and ZoomInfo URL".  
    - False branch to "Processing Delay" (to mark domain processed and skip).  
  - Edge cases: No results triggers skipping domain.

- **Extract Domain and ZoomInfo URL**  
  - Type: `code`  
  - Role: Parses the snippet text of the first organic search result to extract URLs using regex. Outputs all matched URLs along with the original link.  
  - Config: Custom JavaScript regex extraction from snippet text on first search result.  
  - Inputs: From "Check Search Results Found" (true branch).  
  - Outputs: To "Validate if Domain Matches".  
  - Edge cases: No URLs matched results in empty output.

- **Validate if Domain Matches**  
  - Type: `if`  
  - Role: Checks if any extracted URL contains the domain being processed to confirm relevance.  
  - Config: Condition checks if URL string contains the domain string from the batch item.  
  - Inputs: From "Extract Domain and ZoomInfo URL".  
  - Outputs:  
    - True branch to "Scrape ZoomInfo Page".  
    - False branch back to "Process Each Domain" (skips current domain).  
  - Edge cases: False negatives may skip valid entries.

---

#### 2.4 Data Validation and Scraping

**Overview:**  
Scrapes the ZoomInfo page using Oxylabs proxy service to bypass anti-scraping protections and extract raw company data in HTML.

**Nodes Involved:**  
- Scrape ZoomInfo Page  
- Extract Company Data

**Node Details:**

- **Scrape ZoomInfo Page**  
  - Type: `httpRequest`  
  - Role: Sends a POST request to Oxylabs Real-Time Crawler API with the ZoomInfo URL to retrieve page content.  
  - Config:  
    - URL: `https://realtime.oxylabs.io/v1/queries`  
    - Body: JSON parameters including `"source": "universal"` and `"url"` dynamically injected from the validated ZoomInfo link.  
    - Authentication: HTTP Basic Auth with Oxylabs credentials.  
  - Inputs: From "Validate if Domain Matches" (true branch).  
  - Outputs: To "Extract Company Data".  
  - Edge cases:  
    - Proxy/authentication failure causes scraping errors.  
    - Rate limits enforced by Oxylabs may cause delays/failures.

- **Extract Company Data**  
  - Type: `html` (HTML Extract)  
  - Role: Extracts the `#ng-state` element content from the scraped HTML, which contains JSON with company data.  
  - Config:  
    - Extraction configured to trim and clean text.  
    - CSS selector: `#ng-state`.  
    - Data property containing the content is `results[0].content`.  
  - Inputs: From "Scrape ZoomInfo Page".  
  - Outputs: To "Parse JSON Company Info".  
  - Edge cases: If selector fails or content is missing, output will be empty.

---

#### 2.5 Data Parsing and Saving

**Overview:**  
Parses the JSON data extracted from the HTML and updates the Google Sheet with enriched company information. It also manages rate limiting and loops back for the next domain.

**Nodes Involved:**  
- Parse JSON Company Info  
- Rate Limit Delay  
- Save Company Details  
- Mark Domain as Processed  
- Processing Delay

**Node Details:**

- **Parse JSON Company Info**  
  - Type: `code`  
  - Role: Parses the `company_info` JSON string to extract the `pageData` object containing structured company details.  
  - Config: JavaScript code that executes `JSON.parse` on the input.  
  - Inputs: From "Extract Company Data".  
  - Outputs: To "Rate Limit Delay".  
  - Error Handling: Continues workflow output even if parsing fails.  
  - Edge cases: Malformed JSON causes parsing errors; handled gracefully.

- **Rate Limit Delay**  
  - Type: `wait`  
  - Role: Introduces a delay to respect API and scraping service rate limits before saving data.  
  - Config: Default wait parameters (can be adjusted).  
  - Inputs: From "Parse JSON Company Info".  
  - Outputs: To "Save Company Details".

- **Save Company Details**  
  - Type: `googleSheets`  
  - Role: Updates the Google Sheet row corresponding to the domain with extracted company details such as company name, address, phone, revenue, employees, industry, LinkedIn URL, and marks it as processed.  
  - Config:  
    - Document and sheet IDs matched to source sheet.  
    - Columns mapped explicitly from parsed JSON fields.  
    - Update operation based on matching `domain` column.  
  - Credentials: Google Sheets OAuth2.  
  - Inputs: From "Rate Limit Delay".  
  - Outputs: Loops back to "Process Each Domain" to continue processing next domain.  
  - Edge cases: Partial or missing data fields; Google Sheets API errors.

- **Mark Domain as Processed**  
  - Type: `googleSheets`  
  - Role: Marks domains as processed in the sheet even if no data was found or scraping failed, preventing infinite loops.  
  - Config: Updates `processed` column to `"true"` matching domain.  
  - Credentials: Google Sheets OAuth2.  
  - Inputs: From "Processing Delay" (triggered when no search results).  
  - Outputs: Loops back to "Process Each Domain".  
  - Edge cases: Sheet update failures.

- **Processing Delay**  
  - Type: `wait`  
  - Role: Waits before marking a domain as processed when no ZoomInfo results are found to avoid rate limit violations.  
  - Config: Default wait parameters.  
  - Inputs: From "Check Search Results Found" (false branch).  
  - Outputs: To "Mark Domain as Processed".

---

#### 2.6 Workflow Control and Error Handling (Sticky Notes)

**Overview:**  
Sticky notes embedded in the workflow provide documentation on setup, search strategy, data extraction, and error handling best practices.

**Notes Summary:**

- Workflow purpose and process flow overview.
- Setup requirements: Google Sheet structure, credentials for Serper and Oxylabs.
- Search query format and success/failure logic.
- Data extraction targets and parsing details.
- Error handling: continues on errors, always marks domains processed, and includes rate limiting to avoid blocking.

---

### 3. Summary Table

| Node Name                 | Node Type         | Functional Role                         | Input Node(s)           | Output Node(s)               | Sticky Note                                                                                             |
|---------------------------|-------------------|---------------------------------------|------------------------|-----------------------------|-------------------------------------------------------------------------------------------------------|
| Manual Trigger            | manualTrigger     | Starts workflow manually               | —                      | Load Unprocessed Domains     | 🔧 SETUP REQUIREMENTS — Google Sheet and API credentials details                                      |
| Load Unprocessed Domains  | googleSheets      | Loads unprocessed domains from sheet  | Manual Trigger          | Process Each Domain          | 🔧 SETUP REQUIREMENTS — Google Sheet and API credentials details                                      |
| Process Each Domain       | splitInBatches    | Processes each domain sequentially    | Load Unprocessed Domains| Search ZoomInfo via Serper   | 🏢 ZOOMINFO COMPANY DATA SCRAPER — Workflow purpose and flow                                         |
| Search ZoomInfo via Serper| httpRequest       | Queries Serper Google API for ZoomInfo| Process Each Domain     | Check Search Results Found   | 🔍 SEARCH STRATEGY — Query format and success/failure logic                                         |
| Check Search Results Found| if                | Checks if search results exist         | Search ZoomInfo via Serper| Extract Domain and ZoomInfo URL, Processing Delay | 🔍 SEARCH STRATEGY — Query format and success/failure logic                                         |
| Extract Domain and ZoomInfo URL | code         | Extracts URLs from search snippet      | Check Search Results Found| Validate if Domain Matches   | 🔍 SEARCH STRATEGY — Query format and success/failure logic                                         |
| Validate if Domain Matches| if                | Validates extracted URLs match domain | Extract Domain and ZoomInfo URL | Scrape ZoomInfo Page, Process Each Domain | 🔍 SEARCH STRATEGY — Query format and success/failure logic                                         |
| Scrape ZoomInfo Page      | httpRequest       | Scrapes ZoomInfo page via Oxylabs proxy| Validate if Domain Matches| Extract Company Data         | 📊 DATA EXTRACTION — Oxylabs usage and data extraction details                                       |
| Extract Company Data      | html              | Extracts JSON data from scraped HTML  | Scrape ZoomInfo Page    | Parse JSON Company Info      | 📊 DATA EXTRACTION — Oxylabs usage and data extraction details                                       |
| Parse JSON Company Info   | code              | Parses JSON string to structured data | Extract Company Data    | Rate Limit Delay             | ⚠️ ERROR HANDLING — Continue on error, prevent infinite loops                                        |
| Rate Limit Delay          | wait              | Enforces delay for rate limiting       | Parse JSON Company Info | Save Company Details         | ⚠️ ERROR HANDLING — Continue on error, prevent infinite loops                                        |
| Save Company Details      | googleSheets      | Updates sheet with enriched data       | Rate Limit Delay        | Process Each Domain          | ⚠️ ERROR HANDLING — Continue on error, prevent infinite loops                                        |
| Processing Delay          | wait              | Delay before marking domain processed  | Check Search Results Found (false) | Mark Domain as Processed    | ⚠️ ERROR HANDLING — Continue on error, prevent infinite loops                                        |
| Mark Domain as Processed  | googleSheets      | Marks domain as processed in sheet     | Processing Delay        | Process Each Domain          | ⚠️ ERROR HANDLING — Continue on error, prevent infinite loops                                        |
| Sticky Note               | stickyNote        | Documentation and instructions         | —                      | —                           | General workflow purpose and flow description                                                        |
| Sticky Note1              | stickyNote        | Setup requirements                      | —                      | —                           | Credential and sheet setup instructions                                                              |
| Sticky Note2              | stickyNote        | Search strategy details                 | —                      | —                           | Search query and logic explanation                                                                   |
| Sticky Note3              | stickyNote        | Data extraction details                 | —                      | —                           | Explanation of Oxylabs scraping and JSON parsing                                                    |
| Sticky Note4              | stickyNote        | Error handling strategy                 | —                      | —                           | Workflow robustness and error continuation notes                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: `Manual Trigger`  
   - Purpose: Start workflow on demand.  
   - No parameters needed.

2. **Create Google Sheets Node "Load Unprocessed Domains"**  
   - Operation: Read rows.  
   - Spreadsheet: Set Google Sheets document ID (your domain list).  
   - Sheet name: Select the sheet with domain data.  
   - Filters: Add filter where `processed` column is empty (unprocessed domains).  
   - Credentials: Set up Google Sheets OAuth2 credentials.  
   - Connect Manual Trigger output to this node.

3. **Create SplitInBatches Node "Process Each Domain"**  
   - Batch Size: 1 (to process domains sequentially).  
   - Connect "Load Unprocessed Domains" output to this node.

4. **Create HTTP Request Node "Search ZoomInfo via Serper"**  
   - Method: POST  
   - URL: `https://google.serper.dev/search`  
   - Body: JSON with parameter `"q"` set to:  
     `where is "{{ $json.domain }}" Czech Republic headquarter? site:zoominfo.com` (use expression to inject domain).  
   - Authentication: HTTP Header Auth with Serper API key.  
   - Connect true output from "Process Each Domain" to this node.

5. **Create IF Node "Check Search Results Found"**  
   - Condition: Check if `$json.organic` array is not empty.  
   - True branch: Connect to next node for data extraction.  
   - False branch: Connect to a wait node for processing delay.

6. **Create Code Node "Extract Domain and ZoomInfo URL"**  
   - JavaScript: Parse snippet text from first organic result and extract URLs using regex.  
   - Output: Each URL as separate item with original ZoomInfo link.  
   - Connect true branch of previous IF node to this node.

7. **Create IF Node "Validate if Domain Matches"**  
   - Condition: Check if extracted URL contains the current domain string.  
   - True branch: Proceed to scrape ZoomInfo page.  
   - False branch: Loop back to "Process Each Domain" to skip domain.  
   - Connect output of code node to this node.

8. **Create HTTP Request Node "Scrape ZoomInfo Page"**  
   - Method: POST  
   - URL: `https://realtime.oxylabs.io/v1/queries`  
   - Body: JSON with `{ "source": "universal", "url": "<ZoomInfo link>" }` (inject validated link).  
   - Authentication: HTTP Basic Auth with Oxylabs credentials.  
   - Connect true branch of validation IF node to this node.

9. **Create HTML Extract Node "Extract Company Data"**  
   - Operation: Extract HTML content.  
   - CSS Selector: `#ng-state` (target JSON data container).  
   - Data property: `results[0].content` from HTTP response.  
   - Enable trimming and cleaning text.  
   - Connect "Scrape ZoomInfo Page" output to this node.

10. **Create Code Node "Parse JSON Company Info"**  
    - JavaScript: Parse the `company_info` JSON string to extract `.pageData` object.  
    - Continue on error to avoid stopping workflow.  
    - Connect "Extract Company Data" output to this node.

11. **Create Wait Node "Rate Limit Delay"**  
    - Configure delay (default or custom to respect API limits).  
    - Connect "Parse JSON Company Info" output to this node.

12. **Create Google Sheets Node "Save Company Details"**  
    - Operation: Update row by matching `domain` column.  
    - Map extracted fields: company name, address, phone, revenue, employees, industry, LinkedIn URL, city, state, postcode, country, processed = true.  
    - Credentials: Google Sheets OAuth2.  
    - Connect "Rate Limit Delay" output to this node.

13. **Connect output of "Save Company Details" back to "Process Each Domain"**  
    - Enables sequential processing of next domain.

14. **Create Wait Node "Processing Delay"**  
    - Delay used when no search results found (to avoid rapid retries).  
    - Connect false branch of "Check Search Results Found" IF node to this wait node.

15. **Create Google Sheets Node "Mark Domain as Processed"**  
    - Operation: Update row, setting `processed` to true for current domain.  
    - Credentials: Google Sheets OAuth2.  
    - Connect output of "Processing Delay" to this node.

16. **Connect output of "Mark Domain as Processed" back to "Process Each Domain"**  
    - Ensures domains with no results are marked processed to prevent looping.

17. **Add Sticky Notes (optional but recommended) to document:**
    - Workflow purpose, setup requirements, search strategy, data extraction, and error handling instructions as per the original workflow.

---

### 5. General Notes & Resources

| Note Content                                                                                             | Context or Link                                                                                   |
|--------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| 🏢 ZOOMINFO COMPANY DATA SCRAPER: Automatically enriches company domains with ZoomInfo business data.   | General workflow overview documented in sticky note.                                            |
| 🔧 Setup Requirements: Google Sheet must have specific columns; Serper and Oxylabs credentials required.| Credential setup instructions and sheet structure details.                                      |
| 🔍 Search Strategy: Queries use domain and country-specific headquarter search on ZoomInfo site.        | Search query example: `where is "{domain}" Czech Republic headquarter? site:zoominfo.com`       |
| 📊 Data Extraction: Uses Oxylabs to bypass anti-scraping protections and parse JSON data from HTML.     | Target CSS selector `#ng-state` contains JSON company data.                                     |
| ⚠️ Error Handling: Workflow continues on errors, marks domains as processed regardless of success.      | Prevents infinite loops and manages rate limiting for APIs and scraping services.                |

---

**Disclaimer:**  
The text above is derived exclusively from an n8n automated workflow. It complies with content policies and contains no illegal or protected information. All data processed is legal and publicly accessible.