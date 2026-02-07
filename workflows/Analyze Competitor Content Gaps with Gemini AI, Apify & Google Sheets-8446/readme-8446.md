Analyze Competitor Content Gaps with Gemini AI, Apify & Google Sheets

https://n8nworkflows.xyz/workflows/analyze-competitor-content-gaps-with-gemini-ai--apify---google-sheets-8446


# Analyze Competitor Content Gaps with Gemini AI, Apify & Google Sheets

---

### 1. Workflow Overview

This workflow is designed to automate competitor content gap analysis by crawling competitor websites, extracting structured semantic data, and delivering actionable insights into Google Sheets and via email reports. It targets SEO specialists, content strategists, digital marketers, and agencies who want to systematically map competitor content hierarchies, identify key topics and keywords, and streamline competitive research.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Validation:** Receives competitor crawl requests via webhook, normalizes input, and checks for required data.
- **1.2 Crawl Preparation & Execution:** Prepares inputs for Apify's website content crawler, initiates crawl, and fetches crawl results.
- **1.3 Content Metadata Extraction:** Extracts page metadata like title, word count, and reading time from crawled markdown content.
- **1.4 AI Content Analysis:** Sends markdown content to Google Gemini AI to parse and extract semantic JSON data about topics, entities, and content depth.
- **1.5 Data Normalization & Sheet Naming:** Parses and normalizes the AI JSON output, formats topic trees, and derives safe Google Sheets tab names.
- **1.6 Google Sheets Integration:** Creates or updates Google Sheets tabs to store crawl requests and analyzed data.
- **1.7 Reporting:** Sends an email report with competitor content analysis summaries if valid data present.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Validation

**Overview:**  
Handles incoming webhook POST requests containing competitor URLs/domains and crawl configuration. Parses and validates data, normalizes domains, and decides if the crawl should proceed.

**Nodes Involved:**  
- Start Here (Webhook)  
- Submission form (Respond to Webhook)  
- Prepare Apify Input (Code)  
- Check if the data exist (If)

**Node Details:**

- **Start Here**  
  - *Type:* Webhook  
  - *Role:* Receives POST/GET requests on path `/competitors`. Entry point of the workflow.  
  - *Key:* Accepts multiple HTTP methods, returns response via downstream node.  
  - *Input/Output:* No input; outputs form data JSON.  
  - *Failures:* Network issues, invalid payloads.  
  - *Notes:* Share webhook URL with external forms/apps.

- **Submission form**  
  - *Type:* RespondToWebhook  
  - *Role:* Returns an HTML form for data submission.  
  - *Config:* Custom HTML form with inputs for competitor URL, include/exclude paths, crawl limits, email, and name.  
  - *Input/Output:* Receives webhook data; responds with HTML form.  
  - *Failures:* N/A (front-end form).  
  - *Notes:* Form includes client-side validation, normalization, and POSTs JSON to webhook.

- **Prepare Apify Input**  
  - *Type:* Code  
  - *Role:* Parses incoming JSON, normalizes domain names, extracts crawl parameters, builds start URLs and crawl options for Apify.  
  - *Key Expressions:* Domain normalization, splitting include/exclude paths into globs, default max pages=20, crawl depth=1.  
  - *Input/Output:* Takes JSON from webhook; outputs normalized crawl config JSON for Apify.  
  - *Edge Cases:* Missing or invalid competitor URL triggers early exit with error message.  
  - *Failures:* JSON parse errors, invalid input fields.

- **Check if the data exist**  
  - *Type:* If  
  - *Role:* Checks if the start URL method is 'GET' (valid for crawling).  
  - *Input/Output:* Input from Prepare Apify Input; if true, proceeds to crawl and save request data; else stops.  
  - *Failures:* Logic errors if input malformed.

---

#### 2.2 Crawl Preparation & Execution

**Overview:**  
Runs the Apify website content crawler actor with the given parameters, fetches the crawled dataset, and initiates metadata extraction.

**Nodes Involved:**  
- Crawl Competitor Website (Apify)  
- Save Data Of The request (Google Sheets)  
- Fetch Crawled Dataset (HTTP Request)  
- Extract Page Metadata (Code)

**Node Details:**

- **Crawl Competitor Website**  
  - *Type:* Apify Actor  
  - *Role:* Runs `apify/website-content-crawler` with configured start URLs, crawl depth, max pages, and crawler options.  
  - *Config:* Uses Apify API credentials; crawlerType=cheerio; saves markdown; ignores HTTPS errors; respects robots.txt; blocks media and removes UI elements.  
  - *Input/Output:* Receives crawl config; outputs crawl run metadata including datasetId.  
  - *Failures:* Network timeout, API auth errors, crawl limits exceeded.

- **Save Data Of The request**  
  - *Type:* Google Sheets  
  - *Role:* Appends crawl request parameters to a Google Sheet tab named "CONFIG".  
  - *Config:* Uses Google Sheets OAuth2 credentials; writes fields like client_name, competitor_domain, crawl depth, notification email.  
  - *Input/Output:* Input from Prepare Apify Input; no outputs.  
  - *Failures:* Google Sheets API errors, credential expiry.

- **Fetch Crawled Dataset**  
  - *Type:* HTTP Request  
  - *Role:* Retrieves the first item from the Apify dataset of the crawl run (limit=1, clean JSON).  
  - *Config:* URL dynamically built using datasetId from crawl output.  
  - *Input/Output:* Input from crawl actor output; outputs raw crawl data JSON.  
  - *Failures:* Dataset not ready, API errors.

- **Extract Page Metadata**  
  - *Type:* Code  
  - *Role:* Extracts title, word count, reading time, excerpt, and markdown content from the crawled page markdown.  
  - *Key Expressions:* Title extraction prioritizes H1 heading, else first meaningful line, else URL path.  
  - *Input/Output:* Input raw crawl JSON; outputs normalized page metadata JSON.  
  - *Failures:* Empty markdown, malformed URLs.

---

#### 2.3 AI Content Analysis

**Overview:**  
Sends extracted markdown content to Google Gemini AI to analyze and return a structured JSON representing page topics, subtopics, content type, entities, and depth score.

**Nodes Involved:**  
- Analyze Page Content (Google Gemini)  
- AI Agent (Langchain Agent)  
- Parse and Normalize Gemini JSON (Code)

**Node Details:**

- **Analyze Page Content**  
  - *Type:* Langchain LM Chat (Google Gemini)  
  - *Role:* Sends markdown to Gemini AI for semantic content analysis.  
  - *Config:* Uses Google Gemini API credentials; no additional options set.  
  - *Input/Output:* Input markdown JSON from Extract Page Metadata; outputs raw AI response.  
  - *Failures:* API quota exceeded, response timeout, malformed input.

- **AI Agent**  
  - *Type:* Langchain Agent (Custom prompt)  
  - *Role:* Enforces strict JSON output with schema for competitor page analysis (page_url, title, content_type, main_topics hierarchy, key_entities, depth_score).  
  - *Config:* Custom prompt defining JSON output schema and rules for hierarchical topics.  
  - *Input/Output:* Input markdown text; outputs JSON-constrained AI response.  
  - *Failures:* AI may output malformed JSON if prompt misunderstood.

- **Parse and Normalize Gemini JSON**  
  - *Type:* Code  
  - *Role:* Cleans AI output from code fences, safely parses JSON, normalizes topic trees with levels, flattens main topics and key entities into bullet lists, and chooses best page URL.  
  - *Key Expressions:* Regex to strip markdown code fences; recursive topic tree normalization; fallback URL selection.  
  - *Input/Output:* Input raw AI JSON; outputs structured and flattened topic and keyword strings.  
  - *Failures:* Parsing errors, missing or incomplete AI output.

---

#### 2.4 Data Normalization & Sheet Naming

**Overview:**  
Generates a safe and unique Google Sheets tab name from the page URL by sanitizing characters and appending random digits to avoid duplicates.

**Nodes Involved:**  
- Derive Sheet Name (Code)  
- Create sheet for the data (Google Sheets)  
- Merge (Merge node)

**Node Details:**

- **Derive Sheet Name**  
  - *Type:* Code  
  - *Role:* Converts URLs into sanitized sheet tab names, truncates to max length (90 chars), appends 5 random digits suffix.  
  - *Key Expressions:* URL parsing with fallback, character replacement for invalid sheet name chars, random digit generation.  
  - *Input/Output:* Input page URLs; output sheet_name string.  
  - *Failures:* Invalid URLs, name collisions.

- **Create sheet for the data**  
  - *Type:* Google Sheets  
  - *Role:* Creates a new tab in the target Google Sheets document with the derived sheet name for storing page analysis data.  
  - *Config:* Uses Google Sheets OAuth2 credentials; document ID fixed for the project.  
  - *Input/Output:* Input sheet_name from Derive Sheet Name; no outputs.  
  - *Failures:* API quota, sheet name conflicts.

- **Merge**  
  - *Type:* Merge  
  - *Role:* Merges outputs from Create sheet and Derive Sheet Name to flow into the next processing node.  
  - *Input/Output:* Inputs from both nodes; outputs merged data.  
  - *Failures:* Misaligned input/output indices.

---

#### 2.5 Google Sheets Integration & Reporting

**Overview:**  
Prepares the final data row, saves analyzed page content to the respective Google Sheets tab, checks if content is valid for email, and sends report emails.

**Nodes Involved:**  
- Prepare Sheet Row (Set)  
- Save the data collected (Google Sheets)  
- Has content to email (If)  
- Send report (Gmail)

**Node Details:**

- **Prepare Sheet Row**  
  - *Type:* Set  
  - *Role:* Maps normalized fields (page_url, main_topics_flat, key_entities_flat) to Google Sheets columns.  
  - *Input/Output:* Input from Merge node; outputs mapped JSON for sheet write.  
  - *Failures:* Missing input fields.

- **Save the data collected**  
  - *Type:* Google Sheets  
  - *Role:* Appends or updates analyzed page data in the dynamically named sheet tab.  
  - *Config:* Uses Google Sheets OAuth2 credentials; auto-maps input data to columns.  
  - *Input/Output:* Input from Prepare Sheet Row; no outputs.  
  - *Failures:* API write errors, sheet not found.

- **Has content to email**  
  - *Type:* If  
  - *Role:* Checks if page_url is valid HTTP URL, and main_topics and key_words are non-empty to decide if email report should be sent.  
  - *Input/Output:* Input from Save the data collected; if true, triggers email node.  
  - *Failures:* Logic errors if input missing.

- **Send report**  
  - *Type:* Gmail  
  - *Role:* Sends formatted HTML email report to the notification email with page URL, main topics, and keywords.  
  - *Config:* Uses Gmail OAuth2 credentials; subject includes page URL; message uses HTML with inline styling.  
  - *Input/Output:* Input from Has content to email; no outputs.  
  - *Failures:* SMTP auth errors, invalid email addresses.

---

### 3. Summary Table

| Node Name                 | Node Type                          | Functional Role                              | Input Node(s)                 | Output Node(s)                         | Sticky Note                                                                                                                                                                                                                      |
|---------------------------|----------------------------------|----------------------------------------------|------------------------------|---------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Start Here                | Webhook                          | Receives competitor crawl requests           |                              | Submission form, Prepare Apify Input  | ### Webhook — Start Here \n\n**Production URL**\nCopy the **Production** URL from the Webhook node and share it with your form/app.\n                                                                                              |
| Submission form           | RespondToWebhook                 | Returns HTML submission form                  | Start Here                   | None                                  | ### Submission form\n**POST (required)**\n- `competitor` (domain or URL; aliases: `competitors`, `url`)\n- `notify_email` (recipient; alias: `email`)\n\n**Optional**\n- `include_paths`\n- `exclude_paths`\n- `max_pages` (default 20)\n- `crawl_depth` (default 1)\n\n**Webhook URL**\nSet `webhookUrl` to your n8n endpoint (e.g. `https://<host>/webhook/competitors`).\n                                                                                                             |
| Prepare Apify Input       | Code                            | Normalizes input, prepares crawl config       | Start Here                   | Check if the data exist                |                                                                                                                                                                                                                                |
| Check if the data exist   | If                              | Validates if crawl can proceed                 | Prepare Apify Input          | Crawl Competitor Website, Save Data Of The request |                                                                                                                                                                                                                                |
| Crawl Competitor Website  | Apify                           | Runs Apify crawler actor with configuration   | Check if the data exist      | Fetch Crawled Dataset                  | ### Crawl Competitor Website\nRun apify/website-content-crawler with startUrls; saveMarkdown: true.\nCredentials: Use **Apify API** credential.                                                                                   |
| Save Data Of The request  | Google Sheets                   | Saves crawl request parameters in CONFIG sheet | Check if the data exist      | None                                  | ### Save Data Of The request\nAppend sheet.\nUse **Google Sheets OAuth2** credential                                                                                                                                           |
| Fetch Crawled Dataset     | HTTP Request                   | Fetches crawled data from Apify dataset       | Crawl Competitor Website     | Extract Page Metadata                 |                                                                                                                                                                                                                                |
| Extract Page Metadata     | Code                           | Extracts title, word count, reading time      | Fetch Crawled Dataset        | AI Agent, Analyze Page Content        |                                                                                                                                                                                                                                |
| Analyze Page Content      | Langchain LM Chat (Google Gemini) | Sends markdown to Gemini AI for semantic analysis | Extract Page Metadata        | AI Agent                             | ### Analyze Page Send markdown; expect strict JSON back.\nCredentials:  \nUse **Google Gemini/PaLM** credential.                                                                                                               |
| AI Agent                 | Langchain Agent                | Enforces strict JSON output schema             | Extract Page Metadata, Analyze Page Content | Parse and Normalize Gemini JSON        |                                                                                                                                                                                                                                |
| Parse and Normalize Gemini JSON | Code                     | Parses AI JSON output, normalizes topic tree  | AI Agent                    | Derive Sheet Name                    |                                                                                                                                                                                                                                |
| Derive Sheet Name         | Code                           | Generates safe Google Sheets tab name          | Parse and Normalize Gemini JSON | Create sheet for the data, Merge      |                                                                                                                                                                                                                                |
| Create sheet for the data | Google Sheets                   | Creates new sheet tab for page data             | Derive Sheet Name            | Merge                               | ### Create sheet for the data\nCredentials:\nUse **Google Sheets OAuth2** credential.                                                                                                                                          |
| Merge                    | Merge                          | Merges sheet creation and naming outputs        | Derive Sheet Name, Create sheet for the data | Prepare Sheet Row                   |                                                                                                                                                                                                                                |
| Prepare Sheet Row         | Set                            | Maps AI data fields to Google Sheets columns    | Merge                       | Save the data collected              |                                                                                                                                                                                                                                |
| Save the data collected   | Google Sheets                   | Saves analyzed page data to named sheet tab     | Prepare Sheet Row            | Has content to email                 |                                                                                                                                                                                                                                |
| Has content to email      | If                             | Checks if data valid for sending email          | Save the data collected      | Send report                        |                                                                                                                                                                                                                                |
| Send report              | Gmail                          | Sends email report with analysis results          | Has content to email         | None                                  | ### Send report \nSend Email\nCredentials: Use **Gmail OAuth2** credential. (required).                                                                                                                                         |
| Sticky Note               | Sticky Note                    | Information, notes                              |                              |                                       | ## Competitor Content Gap Analyzer: Automated Website Topic Mapping\nStay ahead of competitors by uncovering their content strategies automatically. This workflow crawls competitor websites, extracts structured topic hierarchies, entities, and depth scores, and delivers actionable insights directly into Google Sheets—no more manual browsing, just clean, analyzable data you can act on. |
| Sticky Note1              | Sticky Note                    | Benefits                                       |                              |                                       | \n## Benefits\n- **Competitor mapping at scale**  Automatically map sites into hierarchical topics and entities.\n- **Data-driven content strategy**  Identify gaps, weak spots, and opportunities to stand out.\n- **Seamless integration**  Results flow straight into Google Sheets for filtering, charting, or export.\n- **Time & resource savings**  Eliminate copy-paste research and focus on strategy.\n |
| Sticky Note2              | Sticky Note                    | Save Data Of The request notes                  |                              |                                       | ### Save Data Of The request\nAppend sheet.\nUse **Google Sheets OAuth2** credential                                                                                                                                           |
| Sticky Note3              | Sticky Note                    | Crawl Competitor Website notes                   |                              |                                       | ### Crawl Competitor Website\nRun apify/website-content-crawler with startUrls; saveMarkdown: true.\nCredentials: Use **Apify API** credential.                                                                                   |
| Sticky Note4              | Sticky Note                    | Analyze Page Content notes                       |                              |                                       | ### Analyze Page Send markdown; expect strict JSON back.\nCredentials:  \nUse **Google Gemini/PaLM** credential.                                                                                                               |
| Sticky Note5              | Sticky Note                    | Send report notes                               |                              |                                       | ### Send report \nSend Email\nCredentials: Use **Gmail OAuth2** credential. (required).                                                                                                                                         |
| Sticky Note6              | Sticky Note                    | Target audience description                      |                              |                                       | ## Target audience\n- SEO specialists and digital marketers\n- Content strategists and copywriters\n- Agencies running content audits\n- SaaS startups monitoring competition\n- E-commerce teams benchmarking rivals                                                             |
| Sticky Note7              | Sticky Note                    | Required API credentials                         |                              |                                       | ## Required APIs\n- Google Sheets credentials (trigger & save)\n- Apify API token (crawler)\n- Gemini (Google Generative AI) key (content parsing)\n- Gmail OAuth2 credentials (send report emails)                        |
| Sticky Note8              | Sticky Note                    | Customization hints                             |                              |                                       | ## Easy customization\n- **Competitor domains:** Update in the Google Sheets config.\n- **Crawl depth & limits:** Adjust `max_pages_num` and `crawl_depth_num`.\n- **Output format:** Modify the Code node to add or remove Google Sheets columns.\n- **Delivery channels:** Add Slack or Email nodes for instant audit reports.                                  |
| Sticky Note9              | Sticky Note                    | Create sheet for the data notes                  |                              |                                       | ### Create sheet for the data\nCredentials:\nUse **Google Sheets OAuth2** credential.                                                                                                                                          |
| Sticky Note10             | Sticky Note                    | Webhook start info                              |                              |                                       | ### Webhook — Start Here\n\n**Production URL**\nCopy the **Production** URL from the Webhook node and share it with your form/app.\n                                                                                          |
| Sticky Note11             | Sticky Note                    | Submission form field and behavior details       |                              |                                       | ### Submission form\n**POST (required)**\n- `competitor` (domain or URL; aliases: `competitors`, `url`)\n- `notify_email` (recipient; alias: `email`)\n\n**Optional**\n- `include_paths` (e.g. `/blog/`, `/services/*`)\n- `exclude_paths` (e.g. `/login`, `/wp-admin/*`)\n- `max_pages` (default 20)\n- `crawl_depth` (default 1)\n\n**Webhook URL**\nSet `webhookUrl` to your n8n endpoint (e.g. `https://<host>/webhook/competitors`). |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node ("Start Here")**  
   - Type: Webhook  
   - Path: `competitors`  
   - Methods: POST and GET enabled  
   - Response Mode: Response Node  

2. **Create RespondToWebhook Node ("Submission form")**  
   - Connect from "Start Here" main output  
   - Response: Custom HTML form with fields: competitor URL/domain, name, email, include_paths (multi-select + custom input), exclude_paths (multi-select + custom input), max_pages (select), crawl_depth (select)  
   - Enable retry on fail and execute once false  

3. **Create Code Node ("Prepare Apify Input")**  
   - Connect from "Start Here" main output (parallel to Submission form)  
   - Paste JavaScript to parse JSON body, normalize domains, build crawl parameters (startUrls, include/exclude arrays, max_pages, crawl_depth)  
   - Early exit if processed flag true or competitor domain empty  

4. **Create If Node ("Check if the data exist")**  
   - Connect from "Prepare Apify Input"  
   - Condition: Check if `startUrls[0].method` equals "GET" (string, case sensitive)  

5. **Create Apify Node ("Crawl Competitor Website")**  
   - Connect from "Check if the data exist" true output  
   - Actor ID: `aYG0l9s7dbB7j3gbS` (Apify website-content-crawler)  
   - Set custom body with parameters from previous node: startUrls, crawl_depth_num, max_pages_num, crawlerType=cheerio, saveMarkdown=true, blockMedia=true, proxy enabled  
   - Use Apify API credentials  

6. **Create Google Sheets Node ("Save Data Of The request")**  
   - Connect from "Check if the data exist" true output (parallel to Apify node)  
   - Operation: Append to sheet named `gid=0` (CONFIG tab)  
   - Map fields: client_name, competitor_domain, includeArr, excludeArr, max_pages_num, crawl_depth_num, notify_email  
   - Use Google Sheets OAuth2 credentials  

7. **Create HTTP Request Node ("Fetch Crawled Dataset")**  
   - Connect from "Crawl Competitor Website"  
   - URL: `https://api.apify.com/v2/datasets/{{defaultDatasetId}}/items?clean=true&format=json&offset=0&limit=1`  
   - Dynamic datasetId from crawl output JSON  
   - Method: GET  

8. **Create Code Node ("Extract Page Metadata")**  
   - Connect from "Fetch Crawled Dataset"  
   - Extract title from markdown (prefer H1), word count, reading time (word_count/200), excerpt (first 600 chars), markdown text  
   - Output normalized JSON  

9. **Create Langchain LM Chat Node ("Analyze Page Content")**  
   - Connect from "Extract Page Metadata"  
   - Use Google Gemini API credentials  
   - Send markdown content for analysis  

10. **Create Langchain Agent Node ("AI Agent")**  
    - Connect from "Extract Page Metadata" main and from "Analyze Page Content" ai_languageModel output  
    - Use custom prompt enforcing strict JSON schema for page topics, entities, depth score  

11. **Create Code Node ("Parse and Normalize Gemini JSON")**  
    - Connect from "AI Agent"  
    - Clean AI output from code fences, safe JSON parse, normalize hierarchical topic tree with levels, flatten topics and entities into bullet lists, choose best page URL  

12. **Create Code Node ("Derive Sheet Name")**  
    - Connect from "Parse and Normalize Gemini JSON"  
    - Convert URL to safe sheet name, sanitize invalid characters, truncate to max 90 chars, append 5 random digits suffix  

13. **Create Google Sheets Node ("Create sheet for the data")**  
    - Connect from "Derive Sheet Name"  
    - Operation: Create sheet with title from sheet_name  
    - Use same Google Sheets OAuth2 credentials  

14. **Create Merge Node ("Merge")**  
    - Connect from "Derive Sheet Name" and from "Create sheet for the data"  
    - Merge outputs to single stream  

15. **Create Set Node ("Prepare Sheet Row")**  
    - Connect from "Merge"  
    - Map fields: page_url, main_topics_flat, key_words from parsed AI JSON  

16. **Create Google Sheets Node ("Save the data collected")**  
    - Connect from "Prepare Sheet Row"  
    - Operation: Append or update into dynamically named sheet (sheet_name)  
    - Auto-map input data  
    - Use Google Sheets OAuth2 credentials  

17. **Create If Node ("Has content to email")**  
    - Connect from "Save the data collected"  
    - Condition: page_url matches regex `^https?://`, main_topics is not empty, key_words is not empty  

18. **Create Gmail Node ("Send report")**  
    - Connect from "Has content to email" true output  
    - Send email to notify_email from initial input  
    - Subject: `SEO Audit Report: {{ page_url }}`  
    - HTML message includes page URL, main topics, keywords in styled blocks  
    - Use Gmail OAuth2 credentials  

---

### 5. General Notes & Resources

| Note Content                                                                                  | Context or Link                                                                                     |
|-----------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Benefits: Automate competitor mapping at scale, identify content gaps, seamless Google Sheets integration, saves time and resources. | See Sticky Note1                                                                                   |
| Target audience: SEO specialists, content strategists, agencies, SaaS startups, e-commerce teams. | See Sticky Note6                                                                                   |
| Required APIs: Google Sheets OAuth2, Apify API Token, Google Gemini AI key, Gmail OAuth2.      | See Sticky Note7                                                                                   |
| Customization tips: Modify competitors domain in Google Sheets config, adjust crawl depth and max pages, change output columns, add Slack/email notifications. | See Sticky Note8                                                                                   |
| Webhook usage: Use production webhook URL for real deployments, share with forms or apps.      | See Sticky Note10                                                                                  |
| Submission form details: POST fields `competitor(s)`, `notify_email`, optional include/exclude paths, max_pages, crawl_depth. | See Sticky Note11                                                                                  |
| Crawl configuration: Uses `apify/website-content-crawler` actor with cheerio crawler, saves markdown content, respects robots.txt, uses Apify proxy. | See Sticky Note3                                                                                   |
| AI analysis: Uses Google Gemini (PaLM) for strict JSON output describing content topic hierarchy and entities. | See Sticky Note4                                                                                   |
| Email reports: Sends styled HTML email via Gmail OAuth2 when valid content extracted.          | See Sticky Note5                                                                                   |

---

This detailed breakdown enables understanding, reproduction, and extension of the "Competitor Content Gap Analyzer" workflow by advanced users and AI agents alike. It highlights node roles, data flow, configurations, failure modes, and integration details without exposing raw JSON.