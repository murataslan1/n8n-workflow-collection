Automate Personalized Cold Emails with Apollo Lead Scraping and GPT-4.1

https://n8nworkflows.xyz/workflows/automate-personalized-cold-emails-with-apollo-lead-scraping-and-gpt-4-1-6749


# Automate Personalized Cold Emails with Apollo Lead Scraping and GPT-4.1

### 1. Workflow Overview

This workflow automates the generation of personalized cold email icebreakers and subject lines by scraping business leads from Apollo, crawling their websites for content, summarizing that content using GPT-4.1, and then writing natural, conversational email openers and subject lines using AI. It captures all generated leads and their personalized messages into a Google Sheets spreadsheet and notifies a Slack channel once the process completes. The workflow is suited for outbound sales or marketing teams aiming to scale personalized outreach efficiently.

The workflow is divided into these logical blocks:

- **1.1 Lead Acquisition & Preparation**: Scrapes leads from Apollo using an Apify scraper, filters leads with valid emails and websites, and keeps essential fields for processing.
- **1.2 Website Content Extraction**: Crawls each lead’s website, converts HTML to clean plain text for AI processing.
- **1.3 AI Content Summarization**: Summarizes the scraped website content into concise paragraphs highlighting unique aspects.
- **1.4 AI Personalized Email Writing**: Generates a personalized cold email icebreaker and matching subject line using GPT-4.1.
- **1.5 Result Saving & Notification**: Saves all generated data to a Google Sheet and sends a Slack notification upon completion.
- **1.6 Workflow Initialization & Configuration**: Creates the spreadsheet and sets the Apollo scraping parameters.

---

### 2. Block-by-Block Analysis

#### 2.1 Lead Acquisition & Preparation

- **Overview**: This block triggers the workflow manually, creates a Google Sheets spreadsheet to store leads, sets Apollo scraping parameters, calls the Apify Apollo scraper, receives scraped data, filters out leads missing emails or websites, and extracts relevant fields for downstream processing.

- **Nodes Involved**:  
  - When clicking ‘Execute workflow’  
  - Create spreadsheet  
  - EDIT Apollo URL + Amount  
  - Call Apify Scraper  
  - Receive Scraper's Data  
  - Filter URL + Email  
  - Keep Fields  
  - Loop Over Items

- **Node Details**:

  - **When clicking ‘Execute workflow’**  
    - *Type*: Manual Trigger  
    - *Role*: Initiates the workflow manually.  
    - *Inputs*: None  
    - *Outputs*: Triggers "Create spreadsheet" node.  
    - *Potential Failures*: None.

  - **Create spreadsheet**  
    - *Type*: Google Sheets (Spreadsheet creation)  
    - *Role*: Creates a new Google Sheets spreadsheet titled "Scraped Leads" to store the lead data and generated messages.  
    - *Credentials*: Requires Google Sheets OAuth2 credentials.  
    - *Inputs*: Manual trigger  
    - *Outputs*: Passes spreadsheet info to "EDIT Apollo URL + Amount".  
    - *Potential Failures*: Authentication errors, quota limits.

  - **EDIT Apollo URL + Amount**  
    - *Type*: Set  
    - *Role*: User inputs the Apollo URL to scrape leads from and the number of leads to scrape (minimum 500).  
    - *Inputs*: Spreadsheet creation output.  
    - *Outputs*: Passes parameters to "Call Apify Scraper".  
    - *Potential Failures*: Empty or incorrect URL or amount inputs.  
    - *Sticky Note*: Instructs user to insert Apollo URL and amount to scrape.

  - **Call Apify Scraper**  
    - *Type*: HTTP Request (POST)  
    - *Role*: Calls Apify’s "🔥Apollo Scraper - Scrape up to 50k Leads" API synchronously with user parameters to scrape lead data.  
    - *Inputs*: Parameters from "EDIT Apollo URL + Amount".  
    - *Outputs*: Passes response to "Receive Scraper's Data".  
    - *Potential Failures*: API errors, timeouts, incorrect API endpoint or credentials.  
    - *Sticky Note*: Explains need to insert API endpoints in API settings.

  - **Receive Scraper's Data**  
    - *Type*: HTTP Request (GET)  
    - *Role*: Retrieves the dataset items from the last run of the Apify scraper.  
    - *Inputs*: Output of "Call Apify Scraper".  
    - *Outputs*: Passes scraped leads to "Filter URL + Email".  
    - *Potential Failures*: API errors, empty datasets.

  - **Filter URL + Email**  
    - *Type*: Filter  
    - *Role*: Filters out leads missing an email or organization website URL to ensure only valid contacts continue.  
    - *Inputs*: Scraper data.  
    - *Outputs*: Passes filtered leads to "Keep Fields".  
    - *Potential Failures*: Eliminates entries with missing data; if all leads filtered out, downstream nodes receive no data.

  - **Keep Fields**  
    - *Type*: Set  
    - *Role*: Extracts and keeps only essential fields for the workflow: first name, last name, email, organization name, website URL, and city.  
    - *Inputs*: Filtered leads.  
    - *Outputs*: Passes cleaned data to "Loop Over Items".  
    - *Potential Failures*: Missing or malformed fields.

  - **Loop Over Items**  
    - *Type*: Split In Batches  
    - *Role*: Processes leads one at a time to allow sequential handling by downstream nodes.  
    - *Inputs*: Clean lead data.  
    - *Outputs*: Passes single lead items to "Send a message" and "Crawl Website Content" in parallel.  
    - *Potential Failures*: Large batch sizes may cause delays or memory issues.

---

#### 2.2 Website Content Extraction

- **Overview**: For each lead, crawls their website URL to retrieve HTML content, then converts that HTML into clean plain text suitable for AI processing.

- **Nodes Involved**:  
  - Crawl Website Content  
  - HTTP -> Plain Text

- **Node Details**:

  - **Crawl Website Content**  
    - *Type*: HTTP Request (GET)  
    - *Role*: Fetches the full HTML content from the lead’s organization website URL.  
    - *Inputs*: Lead data from "Loop Over Items".  
    - *Outputs*: Passes raw HTML to "HTTP -> Plain Text".  
    - *Error Handling*: Configured to continue on error (to avoid breaking workflow if website is down).  
    - *Potential Failures*: Request timeouts, 404/500 errors, blocked by website security.

  - **HTTP -> Plain Text**  
    - *Type*: Code (JavaScript)  
    - *Role*: Converts fetched HTML content into clean plain text by stripping tags, decoding HTML entities, and formatting text for readability.  
    - *Inputs*: Raw HTML from "Crawl Website Content".  
    - *Outputs*: Clean plain text content passed to "Website Summary".  
    - *Potential Failures*: Missing HTML content, malformed HTML causing parsing issues.

---

#### 2.3 AI Content Summarization

- **Overview**: Uses GPT-4.1 to summarize the plain text website content into a short paragraph emphasizing what the agency offers and highlights a unique feature or achievement.

- **Nodes Involved**:  
  - Website Summary

- **Node Details**:

  - **Website Summary**  
    - *Type*: OpenAI (LangChain)  
    - *Role*: Receives plain text website content and agency name; produces a concise summary with a unique compliment or notable achievement for personalized outreach.  
    - *Model*: GPT-4.1-mini  
    - *Inputs*: Website plain text, agency name from "Keep Fields".  
    - *Outputs*: Summarized content to "Icebreaker Writer".  
    - *Credentials*: OpenAI API key required.  
    - *Potential Failures*: API rate limits, model errors, incomplete input data.

---

#### 2.4 AI Personalized Email Writing

- **Overview**: Generates a personalized cold email icebreaker and a matching subject line designed to feel natural, personal, and conversational without salesy language, based on the summary and lead details.

- **Nodes Involved**:  
  - Icebreaker Writer  
  - Subject Line Writer

- **Node Details**:

  - **Icebreaker Writer**  
    - *Type*: OpenAI (LangChain)  
    - *Role*: Creates a short, casual cold email opening sentence including a personalized comment derived from the website summary and lead details (first name, city, agency name).  
    - *Model*: GPT-4.1-mini  
    - *Inputs*: Summary from "Website Summary", lead’s first name, agency name, city from "Keep Fields".  
    - *Outputs*: Icebreaker text to "Subject Line Writer".  
    - *Credentials*: OpenAI API key.  
    - *Potential Failures*: API errors, banned words in input causing rephrasing loops.

  - **Subject Line Writer**  
    - *Type*: OpenAI (LangChain)  
    - *Role*: Generates a short, natural subject line under 40 characters that complements the icebreaker and encourages email opens without sales hype.  
    - *Model*: GPT-4.1-mini  
    - *Inputs*: Lead’s first name, website summary, and icebreaker content.  
    - *Outputs*: Subject line text to "Save To Spreadsheet".  
    - *Credentials*: OpenAI API key.  
    - *Potential Failures*: API limits, subject line too long or off-tone.

---

#### 2.5 Result Saving & Notification

- **Overview**: Saves the generated personalized email data for each lead into the Google Sheets spreadsheet, then sends a Slack notification after each processed lead.

- **Nodes Involved**:  
  - Save To Spreadsheet  
  - Append or update row in sheet  
  - Send a message

- **Node Details**:

  - **Save To Spreadsheet**  
    - *Type*: Set  
    - *Role*: Prepares a structured data object including lead info, icebreaker, and subject line for saving.  
    - *Inputs*: Lead fields from "Keep Fields", icebreaker from "Icebreaker Writer", subject line from "Subject Line Writer".  
    - *Outputs*: Passes data to "Append or update row in sheet".  
    - *Potential Failures*: Missing fields.

  - **Append or update row in sheet**  
    - *Type*: Google Sheets (Append or Update)  
    - *Role*: Appends or updates a row in the created Google Sheets spreadsheet with the structured lead and generated email data.  
    - *Credentials*: Google Sheets OAuth2.  
    - *Inputs*: Data from "Save To Spreadsheet".  
    - *Outputs*: Loops back to "Loop Over Items" for next lead.  
    - *Potential Failures*: Authentication errors, API quotas, write conflicts.

  - **Send a message**  
    - *Type*: Slack  
    - *Role*: Sends a Slack notification message after processing each lead as a progress indicator or alert.  
    - *Inputs*: Lead data from "Loop Over Items".  
    - *Credentials*: Slack webhook URL configured.  
    - *Potential Failures*: Slack webhook errors, rate limits.

---

#### 2.6 Workflow Initialization & Configuration Notes

- **Sticky Notes**:  
  - Create Spreadsheet: Guidance to create and configure Google Sheets credentials.  
  - Edit Apollo URL + Amount: Instructions to input Apollo lead scraping URL and minimum amount.  
  - Apollo Scraper: Details on setting Apify API endpoints for scraping.  
  - Crawl Website Content and Convert to Plain Text: Marks the content extraction section.  
  - Write Icebreaker and Subject Line: Marks AI generation nodes.  
  - Summarise Website's Content: Marks summarization step.  
  - Save to Spreadsheet: Marks saving output data.  
  - Send Slack Notification Once Done: Marks Slack integration.

---

### 3. Summary Table

| Node Name                | Node Type                          | Functional Role                                   | Input Node(s)                  | Output Node(s)                  | Sticky Note                                                                                                 |
|--------------------------|----------------------------------|--------------------------------------------------|-------------------------------|--------------------------------|-------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                  | Initiates workflow                               | -                             | Create spreadsheet             |                                                                                                             |
| Create spreadsheet        | Google Sheets (Spreadsheet)       | Creates spreadsheet to store leads                | When clicking ‘Execute workflow’ | EDIT Apollo URL + Amount        | Create Spreadsheet To Capture Leads - add credentials                                                        |
| EDIT Apollo URL + Amount  | Set                              | Sets Apollo URL and scrape amount input           | Create spreadsheet            | Call Apify Scraper              | Edit This - insert Apollo URL and amount (min 500)                                                          |
| Call Apify Scraper        | HTTP Request (POST)               | Calls Apify API to scrape leads                    | EDIT Apollo URL + Amount      | Receive Scraper's Data          | Apollo Scraper - insert API endpoints                                                                        |
| Receive Scraper's Data    | HTTP Request (GET)                | Gets dataset from Apify scraper                    | Call Apify Scraper            | Filter URL + Email              | Apollo Scraper                                                                                               |
| Filter URL + Email        | Filter                           | Filters leads missing email or website             | Receive Scraper's Data        | Keep Fields                    | Apollo Scraper                                                                                               |
| Keep Fields              | Set                              | Extracts essential lead fields                      | Filter URL + Email            | Loop Over Items                |                                                                                                             |
| Loop Over Items           | Split In Batches                 | Processes leads one by one                          | Keep Fields                  | Send a message, Crawl Website Content |                                                                                                             |
| Send a message            | Slack                           | Sends Slack notification per lead processed        | Loop Over Items              | -                              | Send Slack Notification Once Done                                                                           |
| Crawl Website Content     | HTTP Request (GET)                | Crawls lead’s website for HTML content             | Loop Over Items              | HTTP -> Plain Text             | Crawl Website Content and Convert to Plain Text                                                             |
| HTTP -> Plain Text        | Code (JS)                       | Converts HTML to clean plain text                   | Crawl Website Content        | Website Summary                | Crawl Website Content and Convert to Plain Text                                                             |
| Website Summary           | OpenAI (LangChain)                | Summarizes website content                          | HTTP -> Plain Text           | Icebreaker Writer             | Summarise Website's Content                                                                                   |
| Icebreaker Writer         | OpenAI (LangChain)                | Writes personalized cold email icebreaker          | Website Summary              | Subject Line Writer            | Write Icebreaker and Subject Line                                                                             |
| Subject Line Writer       | OpenAI (LangChain)                | Generates cold email subject line                   | Icebreaker Writer            | Save To Spreadsheet            | Write Icebreaker and Subject Line                                                                             |
| Save To Spreadsheet       | Set                              | Prepares data object for saving                     | Subject Line Writer          | Append or update row in sheet  | Save to Spreadsheet                                                                                           |
| Append or update row in sheet | Google Sheets (Append/Update)    | Saves lead and email data in Google Sheets          | Save To Spreadsheet          | Loop Over Items                | Save to Spreadsheet                                                                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - No parameters needed.

2. **Create Google Sheets Node to Create Spreadsheet**  
   - Type: Google Sheets (resource: spreadsheet, operation: create)  
   - Set spreadsheet title to "Scraped Leads".  
   - Connect credentials for Google Sheets OAuth2.

3. **Create Set Node to Configure Apollo Scraping Parameters**  
   - Type: Set  
   - Add two fields:  
     - Apollo URL (string): User-input URL to scrape leads.  
     - Amount to Scrape (string): Number of leads to scrape (minimum 500).  
   - Connect from "Create spreadsheet".

4. **Create HTTP Request Node to Call Apify Scraper**  
   - Type: HTTP Request (POST)  
   - URL: Apify "Run Actor synchronously" endpoint for Apollo scraper.  
   - Body (JSON): Include "cleanOutput": true, "totalRecords": amount, and "url": Apollo URL.  
   - Send body as JSON.  
   - Connect from "EDIT Apollo URL + Amount".  
   - Configure API endpoint in n8n API settings as per Apify docs.

5. **Create HTTP Request Node to Receive Scraper's Data**  
   - Type: HTTP Request (GET)  
   - URL: Apify "Get last run dataset items" endpoint.  
   - Connect from "Call Apify Scraper".

6. **Create Filter Node to Filter Leads**  
   - Type: Filter  
   - Condition: Keep only leads where email exists and organization_website_url exists.  
   - Connect from "Receive Scraper's Data".

7. **Create Set Node to Keep Essential Fields**  
   - Type: Set  
   - Fields: first_name, last_name, email, organization_name, organization_website_url, city.  
   - Map from filtered lead JSON.  
   - Connect from "Filter URL + Email".

8. **Create Split In Batches Node**  
   - Type: Split In Batches  
   - Default batch size (e.g., 1) to process leads one by one.  
   - Connect from "Keep Fields".

9. **Create Slack Node to Send Notification**  
   - Type: Slack  
   - Configure Slack webhook URL credentials.  
   - Connect from "Loop Over Items" (main output 0).

10. **Create HTTP Request Node to Crawl Website Content**  
    - Type: HTTP Request (GET)  
    - URL: Use lead’s organization_website_url.  
    - Configure error handling to continue on error.  
    - Connect from "Loop Over Items" (main output 1).

11. **Create Code Node to Convert HTML to Plain Text**  
    - Type: Code (JavaScript)  
    - Paste conversion code to strip HTML and decode entities.  
    - Input: HTML from "Crawl Website Content".  
    - Connect from "Crawl Website Content".

12. **Create OpenAI Node to Summarize Website Content**  
    - Type: OpenAI (LangChain)  
    - Model: GPT-4.1-mini  
    - System prompt: Instruct summarization of website content into short paragraph with unique compliment.  
    - Inputs: Plain text content and agency name.  
    - Connect from "HTTP -> Plain Text".  
    - Set OpenAI credentials.

13. **Create OpenAI Node to Write Icebreaker**  
    - Type: OpenAI (LangChain)  
    - Model: GPT-4.1-mini  
    - System prompt: Write short, natural cold email icebreaker with personalization rules.  
    - Inputs: Summary, first name, agency name, city.  
    - Connect from "Website Summary".  
    - Set OpenAI credentials.

14. **Create OpenAI Node to Write Subject Line**  
    - Type: OpenAI (LangChain)  
    - Model: GPT-4.1-mini  
    - System prompt: Write short, casual subject line under 40 characters, including first name if natural.  
    - Inputs: First name, summary content, icebreaker content.  
    - Connect from "Icebreaker Writer".  
    - Set OpenAI credentials.

15. **Create Set Node to Prepare Data for Spreadsheet**  
    - Type: Set  
    - Fields: Map first name, last name, email, business name, website URL, icebreaker, subject line from previous nodes.  
    - Connect from "Subject Line Writer".

16. **Create Google Sheets Node to Append or Update Row**  
    - Type: Google Sheets (append or update operation)  
    - Document ID and sheet name: Use outputs from spreadsheet creation node.  
    - Map fields from "Save To Spreadsheet".  
    - Connect from "Save To Spreadsheet".  
    - Set Google Sheets OAuth2 credentials.

17. **Connect "Append or update row in sheet" main output back to "Loop Over Items"**  
    - Enables processing next lead.

---

### 5. General Notes & Resources

| Note Content                                                                                                          | Context or Link                                                                                           |
|-----------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| The Apollo Scraper uses Apify's "Run Actor synchronously" and "Get last run dataset items" APIs.                      | Apify API documentation - https://docs.apify.com/api/v2/actors/run-actor-synchronously                    |
| Google Sheets credentials must be OAuth2 with appropriate permissions to create and edit spreadsheets.                | Google Sheets API documentation - https://developers.google.com/sheets/api                              |
| Slack webhook URL must be configured to send notifications.                                                           | Slack Incoming Webhooks - https://api.slack.com/messaging/webhooks                                       |
| Banned words in icebreaker generation prevent salesy or marketing jargon to keep emails conversational and natural.  | See "Icebreaker Writer" system prompt for full banned words list.                                        |
| HTML to plain text conversion code removes scripts/styles and decodes entities for clean AI input.                    | JavaScript code embedded in "HTTP -> Plain Text" node.                                                   |
| Workflow designed to process large lead batches; adjust batch size for performance and API rate limits.                | Use Split In Batches node settings accordingly.                                                          |

---

**Disclaimer:** The provided content is extracted exclusively from an automated workflow created with n8n, respecting all applicable content policies. It contains only legal and public data.