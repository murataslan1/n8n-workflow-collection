Automate Real Estate Listing Scraper with Scrapeless and Google Sheets

https://n8nworkflows.xyz/workflows/automate-real-estate-listing-scraper-with-scrapeless-and-google-sheets-5878


# Automate Real Estate Listing Scraper with Scrapeless and Google Sheets

### 1. Workflow Overview

This workflow automates the extraction of commercial real estate listings from a specified website (LoopNet) and appends the structured data into a Google Sheets spreadsheet. It is designed for real estate professionals or analysts who want to keep their property data updated automatically on a weekly basis without manual scraping.

The workflow is divided into the following logical blocks:

- **1.1 Schedule Trigger:** Automates periodic execution to keep data fresh.
- **1.2 Data Crawling (Scrapeless Crawler):** Uses Scrapeless API to fetch the webpage content in Markdown format.
- **1.3 Data Parsing:** Extracts structured property listing information from the Markdown content.
- **1.4 Data Storage:** Appends or updates the parsed data into a Google Sheets spreadsheet.

---

### 2. Block-by-Block Analysis

#### 2.1 Block 1: Schedule Trigger — Automate Workflow

- **Overview:**  
  This block triggers the entire workflow automatically every week on Monday at 9 AM, ensuring the data collection process happens regularly without manual intervention.

- **Nodes Involved:**  
  - `Weekly Market Trigger`

- **Node Details:**  
  - **Node Name:** Weekly Market Trigger  
  - **Type:** Schedule Trigger (n8n-nodes-base.scheduleTrigger)  
  - **Configuration:**  
    - Interval set to weekly  
    - Triggers on Monday (day 1) at 9:00 AM  
  - **Input Connections:** None (trigger node)  
  - **Output Connections:** Connected to the `Crawl` node  
  - **Edge Cases / Failures:**  
    - Scheduling misconfiguration could cause missed or multiple triggers  
    - Timezone considerations if n8n instance timezone differs from expected  
  - **Version:** 1.2  

#### 2.2 Block 2: Scrapeless Crawler — Fetch Webpage Data

- **Overview:**  
  This block calls the Scrapeless API to crawl the target LoopNet webpage and retrieves the page content in Markdown format for easier parsing.

- **Nodes Involved:**  
  - `Crawl`

- **Node Details:**  
  - **Node Name:** Crawl  
  - **Type:** Scrapeless API node (n8n-nodes-scrapeless.scrapeless)  
  - **Configuration:**  
    - URL set to `https://www.loopnet.com/search/commercial-real-estate/los-angeles-ca/for-lease/`  
    - Operation: crawl  
    - Limit set to 2 pages for crawl depth  
    - Uses Scrapeless API credentials for authentication  
  - **Input Connections:** Receives trigger from `Weekly Market Trigger`  
  - **Output Connections:** Sends output to `Parse Listings` node  
  - **Edge Cases / Failures:**  
    - API authentication failure or quota limits  
    - Network timeouts or Scrapeless service downtime  
    - Incomplete or malformed responses from Scrapeless  
  - **Version:** 1  

#### 2.3 Block 3: Parse Listings — Extract Property Data

- **Overview:**  
  This block processes the Markdown content returned by Scrapeless, extracting key property information such as title, link, size, year built, and image URL through regex and string manipulation. It returns clean, structured JSON objects.

- **Nodes Involved:**  
  - `Parse Listings`

- **Node Details:**  
  - **Node Name:** Parse Listings  
  - **Type:** Code node (n8n-nodes-base.code)  
  - **Configuration:**  
    - JavaScript code iterates over all Markdown data received  
    - Uses regex to find real estate listings following the pattern: `[More details for ...](...)`  
    - Extracts fields:  
      - `title` (property title)  
      - `link` (property URL)  
      - `size` (e.g., "10,000 - 20,000 SF")  
      - `yearBuilt` (e.g., "Built in 1988")  
      - `image` (URL to property image)  
    - If no matches found, outputs an error object with raw Markdown for debugging  
  - **Input Connections:** Receives Markdown data from `Crawl`  
  - **Output Connections:** Sends structured data to `Append or update row in sheet` node  
  - **Edge Cases / Failures:**  
    - Regex may fail if website markup changes and pattern differs  
    - Missing fields in listings could result in null values  
    - Large or malformed Markdown input could cause performance issues or errors  
  - **Version:** 2  

#### 2.4 Block 4: Append to Google Sheets — Save Data

- **Overview:**  
  This block appends or updates real estate listings in a Google Sheets spreadsheet, enabling easy review and analysis of the latest market data.

- **Nodes Involved:**  
  - `Append or update row in sheet`

- **Node Details:**  
  - **Node Name:** Append or update row in sheet  
  - **Type:** Google Sheets node (n8n-nodes-base.googleSheets)  
  - **Configuration:**  
    - Operation: appendOrUpdate  
    - Sheet: Sheet1 (gid=0) in spreadsheet with ID `1of_9PIseDnbwGYiJ5SLx3bSU5m8TTXpBN6haS2f7EBY`  
    - Matching column: Title (to update existing rows if titles match)  
    - Columns mapped: Title, Link, Size, YearBuilt, Image  
    - Does not convert field types, values passed as strings  
  - **Input Connections:** Receives parsed listings JSON from `Parse Listings`  
  - **Output Connections:** None (end node)  
  - **Edge Cases / Failures:**  
    - Google API authentication errors (credential expiry)  
    - Sheet or document ID changes or access permission issues  
    - Duplicate titles causing unintended overwrites  
  - **Version:** 4.6  

---

### 3. Summary Table

| Node Name                  | Node Type                    | Functional Role                     | Input Node(s)           | Output Node(s)           | Sticky Note                                                                                                        |
|----------------------------|------------------------------|-----------------------------------|-------------------------|--------------------------|--------------------------------------------------------------------------------------------------------------------|
| Weekly Market Trigger       | Schedule Trigger             | Automates weekly workflow trigger | None                    | Crawl                    | ## 🔹 **SECTION 1: 🔁 Schedule Trigger — Automate Workflow**<br>Automatically triggers the workflow every 6 hours, no manual intervention needed. Keeps your data fresh and updated regularly. |
| Crawl                      | Scrapeless API               | Fetches webpage data in Markdown  | Weekly Market Trigger    | Parse Listings           | ## 🔹 **SECTION 2: 🌐 Scrapeless Crawler — Fetch Webpage Data**<br>Uses Scrapeless API to crawl the target real estate webpage and returns Markdown content for parsing.                   |
| Parse Listings             | Code                        | Parses and extracts listing data  | Crawl                   | Append or update row in sheet | ## 🔹 **SECTION 4: 🕵️ Parse Listings — Extract Property Data**<br>Extracts text, parses listings, and cleans data in one step, producing structured data ready for export.                    |
| Append or update row in sheet | Google Sheets               | Saves structured data to spreadsheet | Parse Listings          | None                     | ## 🔹 **SECTION 6: 📊 Append to Google Sheets — Save Data**<br>Appends parsed property data into Google Sheets for review and analysis.                                                   |
| Sticky Note3               | Sticky Note                 | Documentation                     | None                    | None                     | ## 🔹 **SECTION 1: 🔁 Schedule Trigger — Automate Workflow**<br>Automatically triggers the workflow every 6 hours, no manual intervention needed. Keeps your data fresh and updated regularly.<br>---<br>## 🔹 **SECTION 2: 🌐 Scrapeless Crawler — Fetch Webpage Data**<br>Leverage powerful scraping as a service — no need to write complicated crawler code yourself. |
| Sticky Note                | Sticky Note                 | Documentation                     | None                    | None                     | ## 🔹 **SECTION 4: 🕵️ Parse Listings — Extract Property Data**<br>Extracts text, parses listings, and cleans data in one step, saving time and reducing node complexity.                        |
| Sticky Note1               | Sticky Note                 | Documentation                     | None                    | None                     | ## 🔹 **SECTION 6: 📊 Append to Google Sheets — Save Data**<br>Automatically keeps your spreadsheet up-to-date with fresh listings — no copy/paste required.                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a Schedule Trigger node:**
   - Name: `Weekly Market Trigger`
   - Type: Schedule Trigger (Base node)
   - Configure:  
     - Set Interval to weekly  
     - Trigger on Monday (day 1)  
     - Trigger at Hour 9 (9:00 AM)  
   - No credentials needed.

3. **Add a Scrapeless node to crawl the webpage:**
   - Name: `Crawl`
   - Type: Scrapeless API node (Requires Scrapeless integration)
   - Configure:  
     - Operation: `crawl`  
     - URL: `https://www.loopnet.com/search/commercial-real-estate/los-angeles-ca/for-lease/`  
     - Limit crawl pages to 2  
   - Credentials: Connect your Scrapeless API credentials  
   - Connect output of `Weekly Market Trigger` to input of `Crawl`.

4. **Add a Code node to parse listings:**
   - Name: `Parse Listings`
   - Type: Code node (JavaScript)
   - Configure:  
     - Paste the JavaScript code below in the code editor:
```javascript
const markdownData = [];
$input.all().forEach((item) => {
    item.json.forEach((c) => {
        markdownData.push(c.markdown);
    });
});

const results = [];

function dataExtact(md) {
    const re = /\[More details for ([^\]]+)\]\((https:\/\/www\.loopnet\.com\/Listing\/[^\)]+)\)/g;

    let match;

    while ((match = re.exec(md))) {
        const title = match[1].trim();
        const link = match[2].trim()?.split(' ')[0];

        const context = md.slice(match.index, match.index + 500);

        const sizeMatch = context.match(/([\d,]+)\s*-\s*([\d,]+)\s*SF/);
        const sizeRange = sizeMatch ? `${sizeMatch[1]} - ${sizeMatch[2]} SF` : null;

        const yearMatch = context.match(/Built in\s*(\d{4})/i);
        const yearBuilt = yearMatch ? yearMatch[1] : null;

        const imageMatch = context.match(/!\[[^\]]*\]\((https:\/\/images1\.loopnet\.com[^\)]+)\)/);
        const image = imageMatch ? imageMatch[1] : null;

        results.push({
            json: {
                title,
                link,
                size: sizeRange,
                yearBuilt,
                image,
            },
        });
    }

    if (results.length === 0) {
        return [
            {
                json: {
                    error: 'No listings matched',
                    raw: md,
                },
            },
        ];
    }
}

markdownData.forEach((item) => {
    dataExtact(item);
});

return results;
```
   - Connect output of `Crawl` to input of `Parse Listings`.

5. **Add a Google Sheets node to append or update rows:**
   - Name: `Append or update row in sheet`
   - Type: Google Sheets node
   - Configure:  
     - Operation: `appendOrUpdate`  
     - Document ID: `1of_9PIseDnbwGYiJ5SLx3bSU5m8TTXpBN6haS2f7EBY`  
     - Sheet Name: `Sheet1` (gid=0)  
     - Matching Columns: `Title` (to update existing entries)  
     - Columns Mapping:  
       - Title: `={{ $json.title }}`  
       - Link: `={{ $json.link }}`  
       - Size: `={{ $json.size }}`  
       - YearBuilt: `={{ $json.yearBuilt }}`  
       - Image: `={{ $json.image }}`  
     - Ensure type conversion is off; pass all as strings  
   - Credentials: Connect your Google Sheets OAuth2 credentials  
   - Connect output of `Parse Listings` to input of this node.

6. **Save and activate the workflow.**

7. **Test the workflow manually or wait for the scheduled trigger to execute.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                | Context or Link                                                                                                           |
|-----------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| The workflow uses Scrapeless API, a scraping-as-a-service tool, to simplify crawling without writing custom scrapers.       | https://scrapeless.com/                                                                                                   |
| The target website for scraping is LoopNet, a commercial real estate listing platform.                                       | https://www.loopnet.com/search/commercial-real-estate/los-angeles-ca/for-lease/                                            |
| Google Sheets is used as the final data repository for easy access and sharing of the extracted listings.                   | Google Sheets API documentation: https://developers.google.com/sheets/api                                                  |
| The parsing logic depends heavily on the specific Markdown format returned by Scrapeless — any changes on LoopNet or Scrapeless could require regex/code updates. | Ensure to monitor source formatting changes and adjust parsing logic accordingly.                                          |
| This workflow is designed to run autonomously once scheduled, but manual triggering is possible for testing or immediate updates. | n8n schedule trigger node documentation: https://docs.n8n.io/nodes/n8n-nodes-base.scheduleTrigger/                         |

---

**Disclaimer:**  
The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly complies with content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.