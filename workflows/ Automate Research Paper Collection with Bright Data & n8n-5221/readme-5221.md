 Automate Research Paper Collection with Bright Data & n8n

https://n8nworkflows.xyz/workflows/-automate-research-paper-collection-with-bright-data---n8n-5221


#  Automate Research Paper Collection with Bright Data & n8n

### 1. Workflow Overview

This workflow automates the collection of research papers from Google Scholar based on a user-defined topic, utilizing Bright Data’s proxy API to safely scrape web content, and then storing structured results into a Google Sheet for easy access and analysis.

**Target Use Cases:**  
- Academics, researchers, or students seeking automated, up-to-date collections of papers on specific topics without manual browsing or coding.  
- Teams or individuals wanting to maintain a live, shareable spreadsheet of academic literature.  

**Logical Blocks:**  
- **1.1 Input Reception & Trigger:** User inputs a research topic via manual trigger and sets the topic variable.  
- **1.2 Web Scraping & Data Extraction:** Send the topic-based request through Bright Data’s proxy, retrieve HTML, and extract relevant metadata (title, author, abstract, PDF links).  
- **1.3 Data Cleaning & Structuring:** Clean the scraped raw HTML data, format into structured JSON objects for uniformity.  
- **1.4 Data Storage:** Append the structured results into a configured Google Sheet for persistent storage and sharing.

---

### 2. Block-by-Block Analysis

#### Block 1.1: Input Reception & Trigger

- **Overview:**  
  This initial block allows a user to start the workflow manually and specify the research topic to search for. It abstracts away URL complexity by only requiring a topic phrase.

- **Nodes Involved:**  
  - Start Scraping (Manual Trigger)  
  - Set Research topic  

- **Node Details:**  

  1. **Start Scraping (Manual Trigger)**  
     - Type: Manual Trigger  
     - Role: Entry point to initiate the workflow manually on demand.  
     - Configuration: Default manual trigger, no additional parameters.  
     - Key Variables: None.  
     - Inputs: None (trigger node).  
     - Outputs: Connects to “Set Research topic” node.  
     - Failure Modes: None inherent; user must manually trigger.  
     - Version: 1  

  2. **Set Research topic**  
     - Type: Set  
     - Role: Stores the user-defined topic string as a variable for subsequent HTTP request construction.  
     - Configuration: Assigns a string variable named “Topic” with a default value “machine+learning” (URL-encoded space).  
     - Key Expressions: The topic string is later used in the HTTP request URL construction.  
     - Inputs: Receives trigger output.  
     - Outputs: Passes data to “Send Request to Bright Data API”.  
     - Edge Cases: User might want to modify the topic string format or encoding for more complex queries.  
     - Version: 3.4  

#### Block 1.2: Web Scraping & Data Extraction

- **Overview:**  
  Uses Bright Data’s proxy API to fetch Google Scholar search results based on the topic and extracts relevant HTML elements containing paper metadata.

- **Nodes Involved:**  
  - Send Request to Bright Data API  
  - Extract Data from HTML (Title, Author, etc.)  
  - Clean & Structure Extracted Data  

- **Node Details:**  

  1. **Send Request to Bright Data API**  
     - Type: HTTP Request  
     - Role: Sends a POST request to Bright Data’s API, using the topic to dynamically generate the Google Scholar search URL.  
     - Configuration:  
       - URL: `https://api.brightdata.com/request`  
       - Method: POST  
       - Body parameters:  
         - zone: “n8n_unblocker” (Bright Data zone)  
         - url: Constructed as `https://scholar.google.com/scholar?q={{ $json.Topic }}`, dynamically injecting the topic string  
         - country: “us” (request location)  
         - format: “raw” (to get raw HTML content)  
       - Headers: Authorization Bearer token (API key included)  
     - Inputs: Receives topic variable from “Set Research topic”.  
     - Outputs: HTML content response forwarded to HTML extraction node.  
     - Edge Cases:  
       - API rate limits, invalid API key, network timeouts, or proxy zone misconfiguration may cause failure.  
       - Topic URL encoding errors could lead to malformed requests.  
     - Version: 4.2  

  2. **Extract Data from HTML (Title, Author, etc.)**  
     - Type: HTML  
     - Role: Parses the raw HTML response to extract multiple data fields (title, author, abstract, PDF link) using CSS selectors.  
     - Configuration:  
       - Operation: extractHtmlContent  
       - Extraction values:  
         - Title: CSS selector `h3.gs_rt, a.gs_rt`, return array  
         - Author: CSS selector `div.gs_a`, return array  
         - Abstract: CSS selector `div.gs_rs`, return array  
         - PDF Link: CSS selector `a[href*='pdf']`, return array, attribute value (href) extracted  
     - Inputs: Receives raw HTML from HTTP request.  
     - Outputs: JSON object with arrays of extracted values.  
     - Edge Cases:  
       - If Google Scholar changes page structure or CSS classes, extraction breaks.  
       - Empty or partial HTML responses.  
     - Version: 1.2  

  3. **Clean & Structure Extracted Data**  
     - Type: Code (JavaScript)  
     - Role: Iterates over extracted arrays, cleans strings (removes tags, trailing dashes), handles missing or malformed PDF links, and outputs a uniform array of cleaned JSON objects containing title, author, abstract, and PDF link.  
     - Configuration:  
       - Custom JS code snippet performing regex cleanup and array handling.  
     - Inputs: Receives parsed data arrays from HTML extraction node.  
     - Outputs: Structured JSON array, one item per paper.  
     - Edge Cases:  
       - Mismatched array lengths between fields  
       - Missing fields in some entries  
       - Complex PDF link structures requiring conditional handling  
     - Version: 2  

#### Block 1.3: Data Storage

- **Overview:**  
  Stores the cleaned and structured paper metadata into a designated Google Sheet, appending rows with each run.

- **Nodes Involved:**  
  - Save Results to Google Sheet  

- **Node Details:**  

  1. **Save Results to Google Sheet**  
     - Type: Google Sheets  
     - Role: Appends rows of data into a specified Google Sheets document and sheet.  
     - Configuration:  
       - Operation: append  
       - Document ID: Provided Google Sheet ID for research papers  
       - Sheet Name: “gid=0” (first sheet)  
       - Columns mapped:  
         - Topic (from earlier “Set Research topic” node)  
         - title, author, abstract, pdf link (from cleaned data)  
       - Credential: Google Sheets OAuth2 account connected.  
     - Inputs: Receives cleaned paper data array.  
     - Outputs: None (terminal node).  
     - Edge Cases:  
       - Credential expiry or permission issues  
       - API quota limits  
       - Data type mismatches or sheet schema changes  
     - Version: 4.6  

---

### 3. Summary Table

| Node Name                        | Node Type          | Functional Role                           | Input Node(s)                   | Output Node(s)                     | Sticky Note                                                                                                                     |
|---------------------------------|--------------------|-----------------------------------------|--------------------------------|----------------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| Start Scraping (Manual Trigger) | Manual Trigger     | Workflow manual start point              | None                           | Set Research topic                | Section 1: User Input & Trigger - lets users input topic easily                                                                  |
| Set Research topic              | Set                | Define research topic variable            | Start Scraping (Manual Trigger) | Send Request to Bright Data API   | Section 1: User Input & Trigger - abstracts URL complexity for user                                                              |
| Send Request to Bright Data API | HTTP Request       | Query Bright Data API with topic-based URL | Set Research topic              | Extract Data from HTML (Title, Author, etc.) | Section 2: Scrape & Parse Website - uses proxy to fetch raw HTML safely                                                         |
| Extract Data from HTML (Title, Author, etc.) | HTML               | Extract paper metadata from HTML         | Send Request to Bright Data API | Clean & Structure Extracted Data | Section 2: Scrape & Parse Website - parses HTML to extract title, author, etc.                                                  |
| Clean & Structure Extracted Data | Code               | Clean, format, and structure scraped data | Extract Data from HTML (Title, Author, etc.) | Save Results to Google Sheet    | Section 2: Scrape & Parse Website - organizes messy data into clean records                                                     |
| Save Results to Google Sheet     | Google Sheets      | Append structured data to Google Sheet   | Clean & Structure Extracted Data | None                            | Section 3: Save to Google Sheets - automates saving results in shareable spreadsheet                                              |
| Sticky Note                     | Sticky Note        | Documentation for Section 1 nodes        | None                           | None                            | Section 1: User Input & Trigger - explains node roles and benefits                                                               |
| Sticky Note1                    | Sticky Note        | Documentation for Section 2 nodes        | None                           | None                            | Section 2: Scrape & Parse Website - explains node roles and benefits                                                             |
| Sticky Note2                    | Sticky Note        | Documentation for Section 3 node         | None                           | None                            | Section 3: Save to Google Sheets - explains node role and benefits                                                               |
| Sticky Note4                    | Sticky Note        | Full workflow overview and benefits      | None                           | None                            | Full workflow summary with benefits and final result description                                                                |
| Sticky Note5                    | Sticky Note        | Affiliate link for Bright Data           | None                           | None                            | Affiliate commission disclosure and link                                                                                        |
| Sticky Note9                    | Sticky Note        | Workflow assistance and contact info     | None                           | None                            | Contact info and useful social media links                                                                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node:**  
   - Add a **Manual Trigger** node named “Start Scraping (Manual Trigger)”. No special configuration needed.

2. **Create Set Node for Research Topic:**  
   - Add a **Set** node named “Set Research topic”.  
   - In Parameters, assign a new string field called `Topic` with default value (e.g.) `machine+learning` (URL-encoded string format).  
   - Connect “Start Scraping (Manual Trigger)” to this node.

3. **Create HTTP Request Node for Bright Data API:**  
   - Add an **HTTP Request** node named “Send Request to Bright Data API”.  
   - Set method to POST.  
   - URL: `https://api.brightdata.com/request`  
   - Under Body Parameters (as JSON or form data):  
     - `zone`: `"n8n_unblocker"`  
     - `url`: Use expression to build Google Scholar URL with topic: `https://scholar.google.com/scholar?q={{ $json.Topic }}`  
     - `country`: `"us"`  
     - `format`: `"raw"`  
   - Under Headers: add Authorization as `Bearer <your_bright_data_api_token>` (replace with your real API key).  
   - Connect “Set Research topic” to this node.

4. **Create HTML Extract Node:**  
   - Add an **HTML Extract** node named “Extract Data from HTML (Title, Author, etc.)”.  
   - Set operation to “extractHtmlContent”.  
   - Add extraction fields with CSS selectors:  
     - `Title`: selector `h3.gs_rt, a.gs_rt`, return as array  
     - `Author`: selector `div.gs_a`, return as array  
     - `Abstract`: selector `div.gs_rs`, return as array  
     - `PDF Link`: selector `a[href*='pdf']`, return as array, return attribute `href`  
   - Connect “Send Request to Bright Data API” to this node.

5. **Create Code Node for Cleaning Data:**  
   - Add a **Code** node named “Clean & Structure Extracted Data”.  
   - Paste the following JavaScript code:  
     ```javascript
     const titles = items[0].json.Title || [];
     const authors = items[0].json.Author || [];
     const abstracts = items[0].json.Abstract || [];
     const pdfLinks = items[0].json["PDF Link\t"] || [];

     const output = [];

     for (let i = 0; i < titles.length; i++) {
       let title = titles[i].replace(/\[.*?\]/g, '').trim();
       let author = authors[i] ? authors[i].replace(/\s*-\s*.*/, '').trim() : '';
       let abstract = abstracts[i] || '';
       let linkObj = pdfLinks[i];
       let pdfLink = '';

       if (Array.isArray(linkObj)) {
         pdfLink = linkObj.find(obj => obj.href)?.href || '';
       } else if (linkObj?.href) {
         pdfLink = linkObj.href;
       } else if (typeof linkObj === 'string') {
         pdfLink = linkObj;
       }

       output.push({ json: { title, author, abstract, pdfLink } });
     }

     return output;
     ```  
   - Connect “Extract Data from HTML (Title, Author, etc.)” to this node.

6. **Create Google Sheets Node to Save Data:**  
   - Add a **Google Sheets** node named “Save Results to Google Sheet”.  
   - Set operation to “append”.  
   - Set Document ID to your Google Sheet’s ID where you want to save results.  
   - Set Sheet Name to the target sheet (usually “Sheet1” or use “gid=0”).  
   - Map columns as:  
     - Topic: expression: `={{ $('Set Research topic').item.json.Topic }}`  
     - title: `={{ $json.title }}`  
     - author: `={{ $json.author }}`  
     - abstract: `={{ $json.abstract }}`  
     - pdf link: `={{ $json.pdfLink }}`  
   - Connect “Clean & Structure Extracted Data” to this node.  
   - Configure Google Sheets OAuth2 credentials with edit access to your spreadsheet.

7. **Test the Workflow:**  
   - Save and execute the workflow manually.  
   - Input your desired research topic in the “Set Research topic” node if you changed the default value.  
   - Confirm results append correctly to the Google Sheet.

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                                                                 |
|----------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Workflow assistance and contact: Yaron@nofluff.online                                             | Contact email for questions or support                                                        |
| YouTube channel with related tutorials and tips: https://www.youtube.com/@YaronBeen/videos        | Video resources                                                                                |
| LinkedIn profile of author: https://www.linkedin.com/in/yaronbeen/                                 | Professional profile                                                                           |
| Affiliate disclosure for Bright Data: “I’ll receive a tiny commission if you join Bright Data...” | Affiliate link: https://get.brightdata.com/1tndi4600b25                                        |
| Workflow designed to be beginner-friendly: topic input only, no URL or coding needed               | General workflow design principle                                                             |
| Uses Bright Data proxy for safe, reliable scraping                                                  | Proxy service to avoid IP blocks and CAPTCHAs                                                 |
| Outputs saved automatically to Google Sheets for easy sharing and filtering                         | Facilitates collaboration and ongoing research management                                     |

---

**Disclaimer:**  
The text provided here is exclusively based on an automated workflow built with n8n integration and automation tool. The workflow complies fully with content policies and contains no illegal, offensive, or protected elements. All data processed is legal and publicly accessible.