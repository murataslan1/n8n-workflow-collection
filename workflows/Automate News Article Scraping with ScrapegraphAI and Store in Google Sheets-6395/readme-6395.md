Automate News Article Scraping with ScrapegraphAI and Store in Google Sheets

https://n8nworkflows.xyz/workflows/automate-news-article-scraping-with-scrapegraphai-and-store-in-google-sheets-6395


# Automate News Article Scraping with ScrapegraphAI and Store in Google Sheets

---

### 1. Workflow Overview

This workflow automates the process of scraping news articles from a specified news website using an AI-powered scraping service (ScrapeGraphAI) and stores the extracted article data in a Google Sheets document. It is designed for users who want to regularly collect and archive news content for analysis or tracking without manual intervention.

The workflow is logically divided into the following blocks:

- **1.1 Automated Trigger:** Periodically triggers the workflow to initiate the news scraping process automatically at defined intervals.
- **1.2 AI-Powered News Article Scraping:** Uses ScrapeGraphAI to extract structured news article data from the target news website based on a natural language prompt.
- **1.3 Data Formatting and Processing:** Processes and formats the raw scraped data into a structured format compatible with Google Sheets.
- **1.4 Google Sheets Storage:** Appends the processed news article data into a designated Google Sheets document for persistent storage and future analysis.

---

### 2. Block-by-Block Analysis

#### 2.1 Automated Trigger

- **Overview:**  
  This block automatically triggers the workflow based on a schedule, allowing news scraping to occur regularly without manual intervention.

- **Nodes Involved:**  
  - Automated News Collection Trigger

- **Node Details:**  

  **Automated News Collection Trigger**  
  - Type: Schedule Trigger (n8n-nodes-base.scheduleTrigger)  
  - Role: Initiates the workflow at set time intervals  
  - Configuration:  
    - Interval set to default (appears as empty in JSON, typically means every minute or needs user customization)  
    - Can be configured to run daily, hourly, or at custom frequencies  
  - Inputs: None (trigger node)  
  - Outputs: Connects to "AI-Powered News Article Scraper" node  
  - Edge Cases / Failures:  
    - Misconfigured interval may cause too frequent or too sparse execution  
    - Time zone issues can affect expected run times  
    - Trigger failures may result in missed data collection cycles  
  - Notes: See Sticky Note3 for best practices on scheduling frequency and execution timing  

#### 2.2 AI-Powered News Article Scraping

- **Overview:**  
  This block queries ScrapeGraphAI with a natural language prompt to extract news articles from a specified news website, returning structured JSON data for each article.

- **Nodes Involved:**  
  - AI-Powered News Article Scraper  
  - Sticky Note1 (documentation for this block)

- **Node Details:**  

  **AI-Powered News Article Scraper**  
  - Type: ScrapeGraphAI Node (n8n-nodes-scrapegraphai.scrapegraphAi)  
  - Role: Uses AI to extract article data from a target website according to user-defined instructions  
  - Configuration:  
    - Website URL: https://www.bbc.com/  
    - User Prompt: Natural language instruction to extract all articles with a specified JSON schema  
    - API Credentials: Requires valid ScrapeGraphAI API key (self-hosting note applies)  
  - Inputs: Triggered by "Automated News Collection Trigger"  
  - Outputs: Raw JSON response with articles array, connected to "News Data Formatting and Processing"  
  - Edge Cases / Failures:  
    - API authentication errors if invalid or missing credentials  
    - Network timeouts or API limits may cause failures  
    - Incorrect prompt or site structure changes may affect extraction accuracy  
    - Output may be malformed if AI response deviates from expected schema  
  - Notes: See Sticky Note1 for detailed usage and configuration instructions  

#### 2.3 Data Formatting and Processing

- **Overview:**  
  Transforms the raw JSON response from ScrapeGraphAI into a clean, structured format by extracting relevant fields (title, url, category) for each article to prepare data for Google Sheets.

- **Nodes Involved:**  
  - News Data Formatting and Processing  
  - Sticky Note2 (documentation for this block)

- **Node Details:**  

  **News Data Formatting and Processing**  
  - Type: Code Node (n8n-nodes-base.code)  
  - Role: JavaScript code to parse and map the scraped articles into standardized objects  
  - Configuration:  
    - Custom JavaScript code extracts `articles` array from the response under `result.articles`  
    - Maps each article to a JSON object with keys: `title`, `url`, `category`  
  - Inputs: Raw data from "AI-Powered News Article Scraper"  
  - Outputs: Formatted array of article objects, connected to "Google Sheets News Storage"  
  - Edge Cases / Failures:  
    - If `result.articles` is missing or undefined, code may throw errors or return empty output  
    - Malformed input JSON may cause runtime exceptions  
    - Additional data fields require code modification  
  - Notes: Sticky Note2 explains data structure and possibilities to extend or customize this node  

#### 2.4 Google Sheets Storage

- **Overview:**  
  Stores the formatted news article data into a Google Sheets document, appending new entries for historical tracking and analysis.

- **Nodes Involved:**  
  - Google Sheets News Storage  
  - Sticky Note (final one, describing this storage step)

- **Node Details:**  

  **Google Sheets News Storage**  
  - Type: Google Sheets Node (n8n-nodes-base.googleSheets)  
  - Role: Appends processed news article data as rows into a Google Sheet  
  - Configuration:  
    - Operation: Append mode to add rows without overwriting existing data  
    - Spreadsheet Document ID: Must be set by user (via URL mode)  
    - Sheet Name: "Sheet1" (default)  
    - Column Mapping: Automatically maps `title`, `url`, and `category` fields to columns in sheet  
    - Credentials: Requires valid Google Sheets OAuth2 credentials  
  - Inputs: Receives formatted article array from "News Data Formatting and Processing"  
  - Outputs: None (terminal node)  
  - Edge Cases / Failures:  
    - OAuth2 token expiration or invalid credentials cause authentication failure  
    - Incorrect document ID or sheet name leads to write errors  
    - Google API quota limits can interrupt data appending  
    - Data type mismatches may affect row insertion  
  - Notes: See Sticky Note (last in flow) for configuration and data management best practices  

---

### 3. Summary Table

| Node Name                     | Node Type                         | Functional Role                         | Input Node(s)                     | Output Node(s)                    | Sticky Note                                                                                                                                                  |
|-------------------------------|----------------------------------|---------------------------------------|----------------------------------|----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Automated News Collection Trigger | Schedule Trigger (n8n-nodes-base.scheduleTrigger) | Initiates workflow periodically       | None                             | AI-Powered News Article Scraper  | # Step 1: Automated News Collection Trigger ⏱️<br>Frequency and timing configuration best practices.                                                         |
| AI-Powered News Article Scraper | ScrapeGraphAI (n8n-nodes-scrapegraphai.scrapegraphAi) | Extracts news articles from website   | Automated News Collection Trigger | News Data Formatting and Processing | # Step 2: AI-Powered News Article Scraper 🤖<br>Setup with website URL, natural language prompt, and API credentials.                                          |
| News Data Formatting and Processing | Code Node (n8n-nodes-base.code)  | Formats raw scraped data for Sheets   | AI-Powered News Article Scraper  | Google Sheets News Storage       | # Step 3: News Data Formatting and Processing 🧱<br>Transforms articles array to structured data with title, url, and category fields.                        |
| Google Sheets News Storage     | Google Sheets (n8n-nodes-base.googleSheets) | Stores formatted article data in Sheets | News Data Formatting and Processing | None                             | # Step 4: Google Sheets News Storage 📊<br>Appends new rows; requires OAuth2 credentials and correct sheet setup.                                            |
| Sticky Note1                  | Sticky Note (n8n-nodes-base.stickyNote) | Documentation for AI scraping block   | None                             | None                             | # Step 2: AI-Powered News Article Scraper 🤖<br>This is the core AI node for extracting news articles.                                                        |
| Sticky Note2                  | Sticky Note (n8n-nodes-base.stickyNote) | Documentation for data formatting block | None                             | None                             | # Step 3: News Data Formatting and Processing 🧱<br>Details about data transformation and customization.                                                      |
| Sticky Note3                  | Sticky Note (n8n-nodes-base.stickyNote) | Documentation for scheduling trigger  | None                             | None                             | # Step 1: Automated News Collection Trigger ⏱️<br>Scheduling configuration and best practices.                                                               |
| Sticky Note                   | Sticky Note (n8n-nodes-base.stickyNote) | Documentation for Google Sheets storage block | None                             | None                             | # Step 4: Google Sheets News Storage 📊<br>Instructions for storing data in Google Sheets with OAuth2 and append operation.                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Automated Trigger Node**  
   - Add a **Schedule Trigger** node named `Automated News Collection Trigger`.  
   - Set the interval to desired frequency (e.g., daily, hourly).  
   - Configure time zone if needed.

2. **Add AI-Powered News Article Scraper Node**  
   - Add a **ScrapeGraphAI** node named `AI-Powered News Article Scraper`.  
   - Set **Website URL** to the target news site (e.g., `https://www.bbc.com/`).  
   - Enter a **User Prompt** with natural language instructions to extract articles, e.g.:  
     ```
     Extract all the articles from this site. Use the following schema for response {   
       "request_id": "unique-id",   
       "status": "completed",   
       "website_url": "https://www.bbc.com/",   
       "user_prompt": "Extract all the articles from this site.",   
       "title": "Article Title",   
       "url": "Article URL",   
       "category": "Article Category" 
     }
     ```  
   - Configure ScrapeGraphAI API credentials (ScrapeGraphAI API Key).  
   - Connect output of `Automated News Collection Trigger` to this node.

3. **Create News Data Formatting and Processing Node**  
   - Add a **Code** node named `News Data Formatting and Processing`.  
   - Use JavaScript code to:  
     - Read the input JSON from ScrapeGraphAI response at `result.articles`.  
     - Map each article to an object containing `title`, `url`, and `category`.  
   - Sample code:  
     ```javascript
     const inputData = $input.all()[0].json;
     const articles = inputData.result.articles;
     return articles.map(article => ({
       json: {
         title: article.title,
         url: article.url,
         category: article.category
       }
     }));
     ```  
   - Connect output of AI-Powered News Article Scraper node to this node.

4. **Add Google Sheets Node for Storage**  
   - Add a **Google Sheets** node named `Google Sheets News Storage`.  
   - Set operation to **Append**.  
   - Provide the **Spreadsheet Document ID** (via URL mode).  
   - Set **Sheet Name** to `Sheet1` or desired worksheet name.  
   - Configure column mapping to automatically map `title`, `url`, and `category` fields.  
   - Set up Google Sheets OAuth2 credentials with appropriate access rights.  
   - Connect output of `News Data Formatting and Processing` node to this node.

5. **Optional: Add Sticky Notes for Documentation**  
   - Add Sticky Note nodes near each main block to document purpose and usage.  
   - Include key instructions and tips as shown in the original workflow for clarity.

6. **Activate the Workflow**  
   - Save and activate the workflow.  
   - Monitor executions and logs to ensure successful scraping and storage.

---

### 5. General Notes & Resources

| Note Content                                                                                                                      | Context or Link                                                                                         |
|-----------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| ScrapeGraphAI node requires self-hosting and valid API credentials to function properly.                                           | See Sticky Note1 for detailed AI scraper setup instructions                                           |
| Schedule Trigger should be configured considering API rate limits and news site update frequency to avoid excessive calls.        | See Sticky Note3 for scheduling best practices                                                        |
| Google Sheets OAuth2 credentials must have write access to the target spreadsheet and be refreshed periodically if needed.       | See Sticky Note for Google Sheets node configuration                                                   |
| The JavaScript code in the formatting node can be extended to include additional article metadata or error handling as required. | See Sticky Note2 for customization guidelines                                                          |
| For detailed documentation on ScrapeGraphAI and node maintenance, refer to the official ScrapeGraphAI community resources.      | https://docs.scrapegraph.ai/ (community node reference)                                               |

---

**Disclaimer:** The provided content originates solely from an automated workflow created using n8n, an integration and automation tool. This processing strictly complies with content policies and contains no illegal, offensive, or protected material. All data handled is legal and publicly available.