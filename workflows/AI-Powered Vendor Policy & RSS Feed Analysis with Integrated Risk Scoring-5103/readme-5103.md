AI-Powered Vendor Policy & RSS Feed Analysis with Integrated Risk Scoring

https://n8nworkflows.xyz/workflows/ai-powered-vendor-policy---rss-feed-analysis-with-integrated-risk-scoring-5103


# AI-Powered Vendor Policy & RSS Feed Analysis with Integrated Risk Scoring

---

## 1. Workflow Overview

This workflow, titled **AI-Powered Vendor Policy & RSS Feed Analysis with Integrated Risk Scoring**, automates comprehensive monitoring and risk analysis of vendor-related information from both RSS feeds and direct vendor policy webpages. It is designed for compliance, security, and executive teams who need timely, AI-curated insights about vendor risk updates.

### Purpose & Use Cases

- **Automated Vendor Monitoring:** Pulls updates from multiple RSS feeds and direct vendor policy URLs.
- **AI-Driven Risk Analysis:** Uses AI agents to analyze content and assign risk ratings (High, Medium, Low, Informational).
- **Update Detection:** Filters recent updates using HTTP headers, HTML content scanning, and published dates.
- **Email Digests:** Sends clean, styled HTML emails summarizing risk assessments separately for RSS feeds and webpage changes.

### Logical Blocks

- **1.1 Scheduled Trigger**  
  Initiates workflow daily at 3 AM to start monitoring jobs.

- **1.2 RSS Feed Monitoring**  
  Fetches vendor-related RSS feeds, filters recent posts, merges content, and sends to AI for risk categorization.

- **1.3 Direct Vendor Webpage Monitoring**  
  Processes a list of vendor policy URLs, fetches pages, checks HTTP headers and scrapes HTML body for update detection, cleans HTML content, and sends to AI for summarization and risk scoring.

- **1.4 AI Analysis and Risk Scoring**  
  Two AI agents analyze RSS feed entries and webpage content separately to assign risk levels and create summaries.

- **1.5 Formatting and Email Dispatch**  
  Formats AI outputs into styled HTML grouped by risk levels and sends separate email digests for RSS and webpage analyses.

---

## 2. Block-by-Block Analysis

---

### 1.1 Scheduled Trigger

- **Overview:**  
  Triggers the entire workflow once a day at 3 AM to initiate monitoring.

- **Nodes Involved:**  
  - Daily Trigger

- **Node Details:**  
  - **Daily Trigger**  
    - Type: Schedule Trigger  
    - Configured to trigger daily at 3 AM local time.  
    - Output triggers two parallel branches: one for vendor URLs and one for RSS feed list.  
    - Potential failures: Timezone misconfiguration, trigger not firing if n8n instance is down.

---

### 1.2 RSS Feed Monitoring

- **Overview:**  
  Reads multiple RSS feeds, filters recent posts from the last 24 hours, merges entries, sends them to AI for risk analysis, formats the results, and sends an email digest.

- **Nodes Involved:**  
  - RSS Feed List  
  - Splitting the Feeds  
  - Vendor RSS Feed Read  
  - Filtering last 24hrs feed  
  - Sort the feeds  
  - Merge the content for AI  
  - Google Gemini Chat Model (language model)  
  - AI Agent  
  - Formatting the Content for Mail  
  - Gmail1

- **Node Details:**  

  - **RSS Feed List**  
    - Type: Code  
    - Role: Provides a static list of RSS feed URLs (TechCrunch, The Verge, Smashing Magazine).  
    - Outputs an array of feed objects with `name` and `feedUrl` fields.  
    - Edge case: Hardcoded feeds require manual update for new sources.

  - **Splitting the Feeds**  
    - Type: Split Out  
    - Splits the array of RSS feed URLs into individual items for parallel processing.  
    - Input: Array of feeds; Output: Single feed per execution.

  - **Vendor RSS Feed Read**  
    - Type: RSS Feed Read  
    - Reads RSS feed content for each feed URL.  
    - Input: Single feed URL; Output: Feed entries.  
    - Failure modes: Feed unavailable, malformed RSS, network timeout.

  - **Filtering last 24hrs feed**  
    - Type: Filter  
    - Filters feed entries to retain only those published within the last 24 hours, checking both `isoDate` and `pubDate` fields.  
    - Edge cases: Missing or malformed date fields may cause entries to be excluded.

  - **Sort the feeds**  
    - Type: Sort  
    - Sorts filtered feed entries by `pubDate` ascending for consistent processing order.  
    - Input: Filtered feed entries.

  - **Merge the content for AI**  
    - Type: Code  
    - Merges entries into a single payload containing an array of objects with `link` and `content` fields for AI input.  
    - Output: Single JSON object with `entries` array.

  - **Google Gemini Chat Model**  
    - Type: Langchain LM Chat Google Gemini  
    - Uses the Google Gemini PaLM API (model `gemini-2.0-flash-001`) as the language model backend for the AI agent.  
    - Requires Google Palm API credentials.  
    - Input: Text prompt from AI Agent node.

  - **AI Agent**  
    - Type: Langchain Agent  
    - Analyzes grouped RSS feeds for risk categorization and summarization.  
    - System message instructs the agent to deduplicate by `link`, assign risk ratings (High, Medium, Low, Informational), and output structured JSON grouped by risk level.  
    - Input: Merged RSS entries; Output: JSON risk categorized summaries.

  - **Formatting the Content for Mail**  
    - Type: Code  
    - Parses AI output JSON, aggregates entries by risk category, and generates styled HTML for email digest.  
    - Uses inline CSS with Google Fonts and color-coded sections for risk levels.  
    - Error handling for invalid JSON input.  
    - Output: Single item with `html` field.

  - **Gmail1**  
    - Type: Gmail  
    - Sends the formatted RSS feed summary HTML email to specified recipients.  
    - Requires OAuth2 Gmail credentials.  
    - Configured with subject including current date/time.  
    - Possible failure: Auth issues, email quota limits.

---

### 1.3 Direct Vendor Webpage Monitoring

- **Overview:**  
  Processes a list of direct vendor policy URLs, fetches each page, checks HTTP headers for recent updates, scrapes HTML body for update dates, cleans HTML content, analyzes content via AI for risk scoring, merges outputs, formats summary, and sends an email digest.

- **Nodes Involved:**  
  - Vendor URLs  
  - Splitting the Urls  
  - HTTP Request  
  - Check the headers (IF filter)  
  - Scrapping inside the Webpage content (Code)  
  - Cleaning up the code (Code)  
  - Google Gemini Chat Model1  
  - AI Agent1  
  - Format the Summary for Email  
  - Gmail

- **Node Details:**

  - **Vendor URLs**  
    - Type: Code  
    - Provides a hardcoded list of vendor policy page URLs to monitor (example URLs given).  
    - Outputs array of objects with `name` and `feedUrl` (used here as page URL).  
    - Edge case: Must be manually updated for new vendor pages.

  - **Splitting the Urls**  
    - Type: Split Out  
    - Splits the array of URLs into individual items for sequential processing.

  - **HTTP Request**  
    - Type: HTTP Request  
    - Fetches the full HTTP response for each vendor policy URL.  
    - Configured to request the URL from input JSON's `feedUrl`.  
    - Output includes headers and body data for further processing.  
    - Failures: Network errors, 404/500 responses.

  - **Check the headers**  
    - Type: IF Filter  
    - Checks if HTTP headers contain any keys matching “update” or “modified” with a parsable date within last 24 hours.  
    - Branches:  
      - If true: Passes output to "Merge" node.  
      - If false: Moves to "Scrapping inside the Webpage content" for HTML body inspection.  
    - Potential failure: Missing headers, date parsing errors.

  - **Scrapping inside the Webpage content**  
    - Type: Code  
    - Scans HTML body content for date patterns related to update/modification keywords using regex.  
    - Detects recent updates via exact dates, relative terms like "today" or "yesterday", or fallback proximity of keyword and date.  
    - Outputs entries only if recent updates are detected.  
    - Edge case: False negatives if update phrases differ or are obfuscated.

  - **Merge**  
    - Type: Merge  
    - Combines outputs from header detection and webpage scraping paths to unify update signals before AI analysis.

  - **Cleaning up the code**  
    - Type: Code  
    - Cleans raw HTML body by stripping scripts, styles, iframes, SVG, noscript tags, comments, and HTML tags.  
    - Decodes HTML entities and trims excessive whitespace.  
    - Truncates content to 30,000 characters to fit AI token limits.  
    - Extracts canonical or og:url meta tags to assign final URL.  
    - Outputs cleaned text content for AI input.

  - **Google Gemini Chat Model1**  
    - Type: Langchain LM Chat Google Gemini  
    - Uses Google Gemini PaLM API as language model for AI Agent1.  
    - Required credentials same as Gemini Chat Model.

  - **AI Agent1**  
    - Type: Langchain Agent  
    - Analyzes individual webpage content, generates a 2-line summary, categorizes risk (High, Medium, Low, Informational), and outputs a clean JSON with summary, risk, title, vendor name, and URL.  
    - Input: Cleaned webpage content and URL.

  - **Format the Summary for Email**  
    - Type: Code  
    - Parses AI output JSON, groups entries by risk category, and creates styled HTML email content similar to RSS feed formatter.  
    - Ensures consistent branding and risk coloring.

  - **Gmail**  
    - Type: Gmail  
    - Sends the formatted webpage summary email to designated recipients.  
    - Requires Gmail OAuth2 credentials.  
    - Failure modes: Auth failure, email quota exceeded.

---

### 1.4 AI Analysis and Risk Scoring

- **Overview:**  
  Two AI agents powered by Google Gemini (PaLM) perform natural language analysis to assign risk levels and generate concise compliance and risk summaries.

- **Nodes Involved:**  
  - AI Agent (RSS feed analysis)  
  - AI Agent1 (Webpage policy analysis)  
  - Google Gemini Chat Model / Google Gemini Chat Model1 (LM providers)

- **Node Details:**  

  - **AI Agent (RSS)**  
    - Role: Deduplicates RSS entries, assigns risk levels, outputs grouped JSON by risk.  
    - Uses structured system prompt emphasizing no hallucination and JSON-only output.  
    - Input: Merged RSS feed entries array.

  - **AI Agent1 (Webpage)**  
    - Role: Summarizes webpage content with risk rating, outputs single JSON objects per page.  
    - Structured prompt includes vendor name, title, and URL for context.

  - **Google Gemini Chat Model(s)**  
    - Acts as the underlying language model for both AI agents, interfaced via n8n Langchain nodes.  
    - Credentials required for Google Palm API.  
    - Model: `models/gemini-2.0-flash-001` used for fast, cost-effective inference.

---

### 1.5 Formatting and Email Dispatch

- **Overview:**  
  Formats AI outputs into styled, branded HTML emails grouped by risk levels and sends them to configured recipients.

- **Nodes Involved:**  
  - Formatting the Content for Mail (RSS)  
  - Format the Summary for Email (Webpage)  
  - Gmail1 (RSS email)  
  - Gmail (Webpage email)

- **Node Details:**  

  - **Formatting the Content for Mail (RSS)**  
    - Processes AI JSON output for RSS feeds.  
    - Generates HTML with Google Fonts 'Inter', colored risk headings, and cards for each summary.  
    - Includes clickable "Read more" links.

  - **Format the Summary for Email (Webpage)**  
    - Similar function tailored for webpage analysis output.  
    - Consistent styling and grouping by risk category.

  - **Gmail1 and Gmail**  
    - Send emails with generated HTML content.  
    - Configure recipient email addresses in node parameters.  
    - OAuth2 credentials for Gmail required and must be valid.

---

## 3. Summary Table

| Node Name                    | Node Type                             | Functional Role                                   | Input Node(s)                  | Output Node(s)                 | Sticky Note                                         |
|------------------------------|-------------------------------------|-------------------------------------------------|-------------------------------|-------------------------------|----------------------------------------------------|
| Daily Trigger                 | Schedule Trigger                    | Triggers workflow daily at 3 AM                  | —                             | Vendor URLs, RSS Feed List     | ⏰ Triggers the workflow every day at 3 AM          |
| Vendor URLs                  | Code                                | Provides list of vendor policy URLs               | Daily Trigger                 | Splitting the Urls             | ⬆️  Provide your vendor URLs here                   |
| Splitting the Urls           | Split Out                          | Splits vendor URLs into individual items          | Vendor URLs                  | HTTP Request                  | 🔀 Split array of vendor URLs to process individually |
| HTTP Request                 | HTTP Request                      | Fetches vendor policy webpages                     | Splitting the Urls            | Check the headers             | 🌐 Requests vendor policy pages for content inspection |
| Check the headers            | IF Filter                         | Checks headers for recent updates                  | HTTP Request                 | Merge, Scrapping inside the Webpage content | 🕵️‍♂️ Checks vendor page headers for recent updates (last modified) |
| Scrapping inside the Webpage content | Code                       | Extracts update/modified dates from HTML body     | Check the headers             | Merge                        | 🔍 Inspects webpage HTML body for update/modified dates |
| Merge                       | Merge                              | Merges header and body-based update detection     | Check the headers, Scrapping inside the Webpage content | Cleaning up the code         | 🔀 Merge both page meta and body-based content analysis |
| Cleaning up the code         | Code                               | Cleans and strips raw HTML for AI processing      | Merge                        | AI Agent1                    | 🧹 Cleans and strips raw HTML into readable content |
| Google Gemini Chat Model1    | Langchain LM Chat Google Gemini    | Language model interface for AI Agent1            | AI Agent1                    | AI Agent1                    |                                                    |
| AI Agent1                   | Langchain Agent                   | Summarizes individual webpage content and scores risk | Cleaning up the code          | Format the Summary for Email  | 🧠 Summarizes individual webpage content into short risk summaries |
| Format the Summary for Email | Code                               | Formats webpage summary into styled HTML email    | AI Agent1                    | Gmail                       | 🧾 Formats webpage summary output into email-ready HTML |
| Gmail                       | Gmail                              | Sends webpage summary email                        | Format the Summary for Email | —                           | 📨 Sends summary email for webpage policy updates  |
| RSS Feed List               | Code                               | Provides list of RSS feeds                          | Daily Trigger                | Splitting the Feeds          | 📰 Provide a list of RSS feeds (Security, Privacy, Compliance) |
| Splitting the Feeds         | Split Out                         | Splits RSS feed list for individual fetching      | RSS Feed List                | Vendor RSS Feed Read         | 🔀 Split RSS list so each feed can be fetched individually |
| Vendor RSS Feed Read        | RSS Feed Read                    | Reads RSS feed content for each URL                | Splitting the Feeds          | Filtering last 24hrs feed    | 📥 Reads RSS feed content per URL                   |
| Filtering last 24hrs feed   | Filter                            | Filters RSS entries from last 24 hours             | Vendor RSS Feed Read         | Sort the feeds              | ⏳ Filters RSS articles published in the last 24 hours |
| Sort the feeds             | Sort                              | Sorts RSS feed entries by publish date             | Filtering last 24hrs feed    | Merge the content for AI     | 🔃 Sort the RSS entries by pubDate for consistent order |
| Merge the content for AI    | Code                               | Merges RSS entries into one payload for AI         | Sort the feeds              | AI Agent                   | 🧩 Merges cleaned RSS entries into one payload for the AI agent |
| Google Gemini Chat Model    | Langchain LM Chat Google Gemini    | Language model interface for AI Agent              | AI Agent                    | AI Agent                    |                                                    |
| AI Agent                   | Langchain Agent                   | Analyzes grouped RSS feeds, assigns risk and summarizes | Merge the content for AI     | Formatting the Content for Mail | 🤖 Analyzes grouped RSS feeds and categorizes risks using structured JSON |
| Formatting the Content for Mail | Code                          | Formats AI RSS output as styled HTML email         | AI Agent                    | Gmail1                      | 💌 Formats AI response as styled HTML grouped by risk category |
| Gmail1                     | Gmail                              | Sends RSS feed summary email                        | Formatting the Content for Mail | —                         | 📧 Sends HTML newsletter summary email for RSS feeds |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a Scheduled Trigger node**  
   - Type: Schedule Trigger  
   - Configure to trigger daily at 3 AM local time.

2. **Create a Code node named "Vendor URLs"**  
   - Type: Code  
   - Provide an array of vendor policy URLs with fields `name` and `feedUrl` (the URL).  
   - Output: Map each entry to `{ json: { name, feedUrl } }`.

3. **Create a Split Out node "Splitting the Urls"**  
   - Type: Split Out  
   - Field to split out: `feedUrl`  
   - Input: Output from "Vendor URLs".

4. **Create an HTTP Request node "HTTP Request"**  
   - Type: HTTP Request  
   - URL: `={{ $json.feedUrl }}`  
   - Configure to return full response including headers and body.

5. **Create an IF node "Check the headers"**  
   - Condition: Check if any HTTP header key matches `/update|modified/i` and its value is a valid date within last 24 hours.  
   - If true: Connect to Merge node (step 9).  
   - If false: Connect to scraping node (step 6).

6. **Create a Code node "Scrapping inside the Webpage content"**  
   - Type: Code  
   - Implement regex-based extraction of update/modified dates from HTML body to detect recent changes (within 24 hours).  
   - Output only matched entries.

7. **Create a Merge node "Merge"**  
   - Type: Merge  
   - Merge outputs from "Check the headers" (true branch) and "Scrapping inside the Webpage content".  
   - Configure to merge data streams.

8. **Create a Code node "Cleaning up the code"**  
   - Type: Code  
   - Strip scripts, styles, noscript, iframes, SVG, comments, and HTML tags from the webpage body content.  
   - Decode HTML entities.  
   - Truncate content to max 30,000 characters.  
   - Extract canonical or og:url for final URL field.  
   - Output cleaned text and URL.

9. **Create a Langchain LM Chat Google Gemini node "Google Gemini Chat Model1"**  
   - Type: Langchain LM Chat Google Gemini  
   - Model name: `models/gemini-2.0-flash-001`  
   - Set Google Palm API credentials.  
   - Connect from AI Agent1 node.

10. **Create a Langchain Agent node "AI Agent1"**  
    - Type: Langchain Agent  
    - Input text: `{{$json.content}} & {{$json.url}}`  
    - System prompt instructing to generate 2-line summary and risk rating (High, Medium, Low, Informational) with JSON output including summary, risk, title, vendor name, and url.  
    - Connect input from "Cleaning up the code" and LM node.  
    - Output connects to formatting node.

11. **Create a Code node "Format the Summary for Email"**  
    - Type: Code  
    - Parse AI JSON output, group entries by risk level, and build styled HTML email with risk-colored sections and clickable links.

12. **Create a Gmail node "Gmail"**  
    - Type: Gmail  
    - Configure with OAuth2 credentials for Gmail account.  
    - Set recipient email in “Send To” field.  
    - Subject: e.g., `Vendor Webpage Change {{$now}}`  
    - Message content: Use HTML from formatting node.

---

13. **Create a Code node "RSS Feed List"**  
    - Type: Code  
    - Provide array of RSS feeds with `name` and `feedUrl` fields (e.g., TechCrunch, The Verge, Smashing Magazine).  
    - Output as array of JSON objects.

14. **Create a Split Out node "Splitting the Feeds"**  
    - Type: Split Out  
    - Field to split out: `feedUrl`  
    - Input from "RSS Feed List".

15. **Create an RSS Feed Read node "Vendor RSS Feed Read"**  
    - Type: RSS Feed Read  
    - Read RSS feed from `{{$json.feedUrl}}`.

16. **Create a Filter node "Filtering last 24hrs feed"**  
    - Type: Filter  
    - Filter items where `isoDate` or `pubDate` is within last 24 hours.

17. **Create a Sort node "Sort the feeds"**  
    - Type: Sort  
    - Sort entries by `pubDate` ascending.

18. **Create a Code node "Merge the content for AI"**  
    - Type: Code  
    - Merge RSS entries into a single JSON object with an array named `entries` containing `link` and `content` fields.

19. **Create a Langchain LM Chat Google Gemini node "Google Gemini Chat Model"**  
    - Same configuration as step 9.

20. **Create a Langchain Agent node "AI Agent"**  
    - Type: Langchain Agent  
    - Input: `{{$json.entries}}`  
    - System prompt instructs to deduplicate by link, assign risk rating, produce grouped JSON by risk level (High, Medium, Low, Informational), and output structured JSON only.

21. **Create a Code node "Formatting the Content for Mail"**  
    - Type: Code  
    - Parses AI agent output, groups by risk category, generates styled HTML email content.

22. **Create a Gmail node "Gmail1"**  
    - Type: Gmail  
    - Configure OAuth2 credentials and recipient email.  
    - Subject: e.g., `Vendor RSS Feed Monitoring as on {{$now}}`  
    - Message: HTML from formatting node.

---

23. **Connect the nodes as follows:**  
- Daily Trigger → Vendor URLs → Splitting the Urls → HTTP Request → Check the headers → Merge → Cleaning up the code → Google Gemini Chat Model1 → AI Agent1 → Format the Summary for Email → Gmail  
- Daily Trigger → RSS Feed List → Splitting the Feeds → Vendor RSS Feed Read → Filtering last 24hrs feed → Sort the feeds → Merge the content for AI → Google Gemini Chat Model → AI Agent → Formatting the Content for Mail → Gmail1

---

## 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                      | Context or Link                                                                                         |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| This workflow automates monitoring, analyzing, and scoring vendor-related updates using RSS feeds and direct web scraping. It leverages AI agents to produce actionable, risk-categorized summaries delivered via email in a clean, styled HTML format.                                                                                                                                          | Workflow Description sticky note                                                                         |
| Uses Google Gemini (PaLM) API as the AI language model backend for natural language understanding and summarization. Requires valid Google Palm API credentials.                                                                                                                                                                                                                                   | AI Agent nodes and Google Gemini Chat Model nodes                                                        |
| Email sending uses Gmail OAuth2 credentials; ensure proper authentication and API quota to avoid failures.                                                                                                                                                                                                                                                                                        | Gmail nodes                                                                                            |
| The system prompt for AI agents strictly enforces JSON-only output with no additional prose or formatting for easy downstream parsing.                                                                                                                                                                                                                                                           | AI Agent and AI Agent1 nodes                                                                            |
| Date extraction from webpages uses complex regex patterns to detect updated/modified dates in multiple formats, including relative dates like "today" or "yesterday". This makes update detection robust but may miss unusual or obfuscated formats.                                                                                                                                           | Scrapping inside the Webpage content code node                                                         |
| RSS feeds and vendor URLs are hardcoded in respective Code nodes; customize these lists based on your monitoring needs.                                                                                                                                                                                                                                                                          | RSS Feed List and Vendor URLs code nodes                                                                |
| Styling uses Google Fonts 'Inter' with color-coded risk categories and clickable "Read more" links in emails for clear, professional presentation.                                                                                                                                                                                                                                               | Formatting the Content for Mail and Format the Summary for Email code nodes                              |
| Ensure n8n instance has internet access and API access for Google Gemini and Gmail services. Consider error handling for network failures and API rate limits in production environments.                                                                                                                                                                                                        | General operational considerations                                                                      |

---

**Disclaimer**: The text provided above is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to content policies and contains no illegal, offensive, or protected material. All data handled is legal and publicly available.

---