 Automated Event Discovery with Bright Data & n8n

https://n8nworkflows.xyz/workflows/-automated-event-discovery-with-bright-data---n8n-5222


#  Automated Event Discovery with Bright Data & n8n

### 1. Workflow Overview

This workflow, titled **Automated Event Discovery with Bright Data & n8n**, is designed to automatically scrape upcoming technology-related events from Eventbrite, process the raw HTML data into structured event information, and store the results in a Google Sheet for easy access and further use. It targets use cases such as event discovery, lead generation, marketing, and calendar synchronization without manual intervention.

The workflow logically divides into three main blocks:

- **1.1 Trigger & Web Scraping:** Automatically initiate the workflow on a weekly schedule and fetch raw HTML event data from Eventbrite using Bright Data’s Web Unlocker API to bypass anti-bot protections.

- **1.2 HTML Parsing & Data Structuring:** Extract relevant event details (title, date/time) from the raw HTML and clean/filter duplicates or irrelevant entries to produce a structured JSON array of events.

- **1.3 Data Storage:** Append the cleaned, structured event data into a Google Sheet acting as a centralized database.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger & Web Scraping

**Overview:**  
This block initiates the workflow on a weekly basis and performs the web scraping by sending a POST request to Bright Data’s API to retrieve raw HTML content of event listings from Eventbrite.

**Nodes Involved:**  
- Trigger - Weekly Run (Schedule Trigger)  
- Scrape event website using bright data (HTTP Request)  

**Node Details:**

- **Trigger - Weekly Run**  
  - Type: Schedule Trigger  
  - Role: Initiates workflow execution every week on Monday at 8 AM automatically.  
  - Configuration: Interval set to trigger weekly on day 1 (Monday), hour 8.  
  - Inputs: None (trigger)  
  - Outputs: Connects to HTTP Request node.  
  - Edge cases: Workflow will not run outside the scheduled time; misconfiguration could cause missed runs.

- **Scrape event website using bright data**  
  - Type: HTTP Request  
  - Role: Sends a POST request to Bright Data’s API to scrape the event page URL through proxy/unblocker service.  
  - Configuration:  
    - URL: `https://api.brightdata.com/request`  
    - Method: POST  
    - Headers: Authorization with Bearer token (API_KEY placeholder)  
    - Body Parameters:  
      - zone: `n8n_unblocker` (Bright Data zone)  
      - url: `https://www.eventbrite.com/d/online/technology--events/` (target page)  
      - country: `us` (proxy location)  
      - format: `raw` (requesting raw HTML)  
  - Input: Trigger node  
  - Output: Raw HTML response to the HTML parsing node  
  - Edge cases:  
    - Authentication errors if API key is invalid or expired.  
    - Network timeouts or Bright Data service outages.  
    - Possible changes in Eventbrite page structure or blocking mechanisms.

---

#### 1.2 HTML Parsing & Data Structuring

**Overview:**  
This block extracts event titles and dates from the raw HTML content using CSS selectors and formats the extracted data into a clean, deduplicated JSON array.

**Nodes Involved:**  
- Parse HTML - Extract Event Cards (HTML Extract)  
- Format Event Data (Code Node)  

**Node Details:**

- **Parse HTML - Extract Event Cards**  
  - Type: HTML Extract  
  - Role: Parses raw HTML to select event relevant elements using CSS selectors, extracting titles and date/time strings.  
  - Configuration:  
    - Extraction operation: `extractHtmlContent`  
    - Extraction Values (keys and CSS selectors):  
      - Title: `h3` elements (returns array)  
      - Date and Time: `div.Stack_root__1ksk7 > p:nth-of-type(1)` (returns array)  
  - Input: Raw HTML from HTTP Request node  
  - Output: JSON object with arrays of extracted titles and dates to code node  
  - Edge cases:  
    - If the CSS selectors do not match due to website structure changes, extraction will fail or yield empty arrays.  
    - HTML content may contain duplicates or irrelevant entries.

- **Format Event Data**  
  - Type: Code (JavaScript)  
  - Role: Cleans and structures extracted data by:  
    - Removing duplicates based on event title  
    - Filtering out irrelevant entries starting with a number and dot (e.g., "1. Tickets")  
    - Omitting empty titles  
    - Producing an array of objects with `Title` and `Date and Time` keys  
  - Key Code Logic:  
    - Uses Set to track seen titles  
    - Loops through all events, applies filters, and collects cleaned events  
  - Input: JSON arrays from HTML Extract node  
  - Output: Cleaned event objects to Google Sheets node  
  - Edge cases:  
    - Mismatched array lengths for titles and dates might cause undefined values.  
    - Unexpected HTML content format can cause errors or missing data.

---

#### 1.3 Data Storage

**Overview:**  
This block appends the cleaned event data into a Google Sheet, allowing easy sharing, filtering, and database-like usage.

**Nodes Involved:**  
- Save to Google Sheet (Google Sheets Append)  

**Node Details:**

- **Save to Google Sheet**  
  - Type: Google Sheets  
  - Role: Appends each event as a new row in a specified Google Sheet.  
  - Configuration:  
    - Operation: `append`  
    - Document ID: points to a specific Google Sheet ID  
    - Sheet Name: GID of the target sheet (`gid=0`)  
    - Columns Mapped:  
      - Title → "Title" column  
      - Date and Time → "Date & Time" column  
    - Mapping Mode: Defined below (manual mapping)  
  - Credentials: Requires OAuth2 Google Sheets credentials configured in n8n  
  - Input: Clean event JSON objects from code node  
  - Output: None (terminal node)  
  - Edge cases:  
    - Credential expiration or revocation causes auth errors.  
    - Google API rate limits or quota exceeded errors.  
    - Schema mismatch if the sheet columns are renamed or missing.

---

### 3. Summary Table

| Node Name                        | Node Type               | Functional Role                  | Input Node(s)                      | Output Node(s)                | Sticky Note                                                                                                                       |
|---------------------------------|-------------------------|---------------------------------|----------------------------------|------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| Trigger - Weekly Run             | Schedule Trigger        | Initiates workflow weekly       | None                             | Scrape event website using bright data | **Section 1:** Kickstarts automation weekly at 8 AM Monday to fetch event data using Bright Data's unblocker API.               |
| Scrape event website using bright data | HTTP Request            | Fetch raw HTML via Bright Data  | Trigger - Weekly Run             | Parse HTML - Extract Event Cards | **Section 1:** Uses Bright Data API to bypass bot protections and retrieve raw HTML from Eventbrite event listings.              |
| Parse HTML - Extract Event Cards | HTML Extract            | Extracts event titles & dates   | Scrape event website using bright data | Format Event Data           | **Section 2:** Extracts event titles and dates using CSS selectors from raw HTML.                                                 |
| Format Event Data               | Code                    | Cleans & formats extracted data | Parse HTML - Extract Event Cards | Save to Google Sheet          | **Section 2:** Deduplicates and filters event data, producing clean JSON objects for storage.                                     |
| Save to Google Sheet            | Google Sheets Append    | Appends events to Google Sheet  | Format Event Data                | None                         | **Section 3:** Saves structured event data to Google Sheets for easy access and sharing.                                         |
| Sticky Note                    | Sticky Note             | Documentation                   | None                             | None                         | Section 1 explanation: Trigger and scrape Bright Data API overview.                                                              |
| Sticky Note1                   | Sticky Note             | Documentation                   | None                             | None                         | Section 2 explanation: Extract and clean event data from HTML.                                                                    |
| Sticky Note2                   | Sticky Note             | Documentation                   | None                             | None                         | Section 3 explanation: Store events in Google Sheets.                                                                              |
| Sticky Note3                   | Sticky Note             | Full workflow overview          | None                             | None                         | Comprehensive workflow description, benefits, and multi-section explanation.                                                     |
| Sticky Note4                   | Sticky Note             | Affiliate link                  | None                             | None                         | Promotional note with Bright Data affiliate link: https://get.brightdata.com/1tndi4600b25                                           |
| Sticky Note9                   | Sticky Note             | Support and contact info        | None                             | None                         | Contact and resource links for workflow assistance: YouTube and LinkedIn links for author support.                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**  
   - Name: `Trigger - Weekly Run`  
   - Set interval to weekly, triggering every Monday at 08:00 (8 AM).  
   - No credentials needed.

2. **Create an HTTP Request node:**  
   - Name: `Scrape event website using bright data`  
   - Method: POST  
   - URL: `https://api.brightdata.com/request`  
   - Headers: Add header `Authorization` with value `Bearer API_KEY` (replace `API_KEY` with your Bright Data API token).  
   - Body Parameters (as JSON):  
     - `zone`: `n8n_unblocker`  
     - `url`: `https://www.eventbrite.com/d/online/technology--events/`  
     - `country`: `us`  
     - `format`: `raw`  
   - Enable sending body and headers.  
   - Connect output of `Trigger - Weekly Run` to this node.

3. **Create an HTML Extract node:**  
   - Name: `Parse HTML - Extract Event Cards`  
   - Operation: `extractHtmlContent`  
   - Extraction Values:  
     - Key: `Title`, CSS Selector: `h3`, return array: true  
     - Key: `Date and Time`, CSS Selector: `div.Stack_root__1ksk7 > p:nth-of-type(1)`, return array: true  
   - Connect output of HTTP Request node here.

4. **Create a Code node:**  
   - Name: `Format Event Data`  
   - Language: JavaScript  
   - Paste the provided JavaScript code to:  
     - Read arrays from input JSON (`Title` and `Date and Time`).  
     - Remove duplicates and empty titles.  
     - Filter out titles starting with a digit and dot.  
     - Output cleaned array of event objects with keys `Title` and `Date and Time`.  
   - Connect output of HTML Extract node here.

5. **Create a Google Sheets node:**  
   - Name: `Save to Google Sheet`  
   - Operation: `append`  
   - Authenticate with Google OAuth2 credentials having permissions to edit the target sheet.  
   - Document ID: Use your Google Sheet ID to store events.  
   - Sheet Name: `gid=0` or sheet name as appropriate.  
   - Mapping Mode: Define below, map:  
     - `Title` → column named "Title"  
     - `Date and Time` → column named "Date & Time"  
   - Connect output of Code node here.

6. **(Optional) Add Sticky Notes:**  
   - Add descriptive sticky notes for each section to document purpose, configuration, and usage tips.

7. **Save and activate the workflow.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                | Context or Link                                               |
|---------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| Workflow assistance and support contact: Yaron@nofluff.online                                                                              | Contact email for questions                                    |
| YouTube channel with more tips and tutorials: https://www.youtube.com/@YaronBeen/videos                                                     | Video resource for n8n and automation                           |
| LinkedIn profile of author: https://www.linkedin.com/in/yaronbeen/                                                                          | Professional profile                                           |
| Bright Data affiliate link with commission: https://get.brightdata.com/1tndi4600b25                                                         | Affiliate program link                                         |
| Workflow tagline: “Your always-on assistant for discovering industry webinars — no clicks required.”                                        | Branding and project tagline                                   |
| Advantage of using Bright Data over direct scraping due to bot detection and CAPTCHA bypass                                                 | Web scraping best practice                                     |
| Google Sheets as a universal, sharable database for event data                                                                              | Recommended data storage solution                              |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow built with n8n, adhering strictly to content policies without any illegal, offensive, or protected elements. All processed data is legal and public.