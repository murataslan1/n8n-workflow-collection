Auto-Audit SEO Traffic Drops with AI & Google Search Console to Slack

https://n8nworkflows.xyz/workflows/auto-audit-seo-traffic-drops-with-ai---google-search-console-to-slack-11401


# Auto-Audit SEO Traffic Drops with AI & Google Search Console to Slack

### 1. Workflow Overview

This workflow automates the SEO audit process by detecting and analyzing drops in web traffic using Google Search Console (GSC) data and AI-driven content analysis. Its primary use case is for SEO specialists or digital marketers who want automated, actionable insights about pages experiencing declines in clicks and search rankings, delivered directly via Slack.

The workflow is logically divided into three main blocks:

- **1.1 Data Collection:** Scheduled weekly, it fetches comparative GSC data (last month vs previous month) for a configured website property and filters pages with negative performance trends.

- **1.2 Deep Analysis:** For each underperforming page, it fetches related search queries, scrapes live page content (title and H2 headings), and sends this combined data to an AI model for detailed SEO improvement recommendations.

- **1.3 Reporting:** Formats the AI-generated insights into a Slack-friendly message and posts it to a specified Slack channel.

---

### 2. Block-by-Block Analysis

#### 2.1 Data Collection

**Overview:**  
This block triggers the workflow weekly, sets the target website property, retrieves GSC comparative data for that property, and filters pages experiencing drops in clicks and worsening search positions.

**Nodes Involved:**  
- Weekly Schedule  
- 📝 Edit Me: Config  
- GSC: Compare Period  
- Filter: Drops

**Node Details:**

- **Weekly Schedule**  
  - *Type:* Schedule Trigger  
  - *Role:* Starts the workflow every Monday at 9:00 AM.  
  - *Config:* Interval set to weekly on Monday at 9:00.  
  - *Input:* None (trigger node).  
  - *Output:* Triggers next node.  
  - *Errors:* Trigger failures unlikely unless system downtime occurs.

- **📝 Edit Me: Config**  
  - *Type:* Set  
  - *Role:* Stores configurable parameters, primarily the GSC property URL (`target_site_property`).  
  - *Config:* Hardcoded string with default example URL (https://www.example.com/).  
  - *Input:* Triggered by schedule node.  
  - *Output:* Supplies configuration data downstream.  
  - *Errors:* Misconfiguration (wrong URL) may cause GSC nodes to fail.

- **GSC: Compare Period**  
  - *Type:* Google Search Console node  
  - *Role:* Retrieves page-level comparative insights between two time periods for the configured property.  
  - *Config:* Operation set to "comparePageInsights"; site URL dynamically linked to config node.  
  - *Credentials:* Requires OAuth2 Google Search Console credentials.  
  - *Input:* Receives `target_site_property` URL.  
  - *Output:* List of pages with traffic and position diffs.  
  - *Errors:* Authentication errors, API quota exceeded, invalid property URL.

- **Filter: Drops**  
  - *Type:* Filter  
  - *Role:* Filters pages where clicks have decreased (`clicks_diff < 0`) and rank position has worsened (`pos_diff > 0`).  
  - *Config:* Conditions set on JSON properties `clicks_diff` and `pos_diff`.  
  - *Input:* Output from GSC compare node.  
  - *Output:* Only pages with negative performance continue.  
  - *Errors:* Expression evaluation failures if expected fields missing.

---

#### 2.2 Deep Analysis

**Overview:**  
Processes each filtered page by batching through them, waits briefly between requests, queries GSC for associated search queries, scrapes live page content, and sends all inputs to AI for SEO recommendations.

**Nodes Involved:**  
- Loop Pages  
- Wait 1s  
- GSC: Get Queries  
- Format Queries  
- Scrape Page  
- Extract Content  
- AI Analyst

**Node Details:**

- **Loop Pages**  
  - *Type:* SplitInBatches  
  - *Role:* Iterates over filtered pages individually for sequential processing.  
  - *Config:* Default batch size (1) to handle one page at a time.  
  - *Input:* Filtered pages from "Filter: Drops".  
  - *Output:* Sends one page per batch downstream.  
  - *Errors:* Batch handling errors if input is empty.

- **Wait 1s**  
  - *Type:* Wait  
  - *Role:* Pauses execution 1 second before next API call to avoid rate limits.  
  - *Config:* Wait time set to 1 second.  
  - *Input:* Triggered on the secondary branch of Loop Pages.  
  - *Output:* Triggers "GSC: Get Queries".  
  - *Errors:* Minimal, unless workflow interrupted.

- **GSC: Get Queries**  
  - *Type:* Google Search Console node  
  - *Role:* Retrieves queries related to the current page URL for detailed user demand analysis.  
  - *Config:* Operation "getPageInsights"; filters set to current page URL from Loop Pages; dimensions include `page` and `query`.  
  - *Credentials:* Uses same GSC OAuth2 credentials.  
  - *Input:* Receives page URL from Loop Pages.  
  - *Output:* List of queries per page.  
  - *Errors:* Same as other GSC nodes; also, empty query results possible.

- **Format Queries**  
  - *Type:* Code (JavaScript)  
  - *Role:* Formats queries into a readable bullet list summarizing query text, rank, clicks, impressions; combines with page URL and drop metrics for AI input.  
  - *Config:* JS code extracts up to 20 queries, includes clicks_diff and pos_diff from Loop Pages node.  
  - *Input:* Data from GSC: Get Queries and Loop Pages.  
  - *Output:* JSON with `target_url`, `query_summary`, `clicks_diff`, and `pos_diff`.  
  - *Errors:* Code errors if input structure unexpected or empty.

- **Scrape Page**  
  - *Type:* HTTP Request  
  - *Role:* Fetches live HTML content of the target page URL.  
  - *Config:* URL dynamically set to `target_url` from Format Queries; response format text (HTML).  
  - *Input:* Receives formatted URL from Format Queries.  
  - *Output:* Raw HTML content of the page.  
  - *Errors:* HTTP errors (404, 500), timeouts, network issues.

- **Extract Content**  
  - *Type:* HTML Extract  
  - *Role:* Parses HTML to extract the page `<title>` and all `<h2>` tags as an array.  
  - *Config:* CSS selectors `title` and `h2`; returns array for h2 tags.  
  - *Input:* Raw HTML from Scrape Page.  
  - *Output:* JSON with `page_title` and `h2_tags`.  
  - *Errors:* Parsing errors if HTML malformed or selectors missing elements.

- **AI Analyst**  
  - *Type:* OpenAI (Langchain)  
  - *Role:* Uses GPT-4o-mini to analyze SEO drops combining search queries and page content; outputs tailored improvement recommendations.  
  - *Config:*  
    - Model: GPT-4o-mini (a variant optimized for this task).  
    - Prompt: Detailed instructions emphasizing no markdown, no clichés, human tone, with structured output including alert, queries, title ideas, missing H2 heading.  
    - Variables injected from Format Queries and Extract Content nodes.  
  - *Credentials:* OpenAI API key required.  
  - *Input:* Combined page and query data.  
  - *Output:* AI-generated SEO audit text.  
  - *Errors:* API errors, rate limits, model timeouts, prompt errors.

---

#### 2.3 Reporting

**Overview:**  
Formats the AI's textual analysis for Slack readability and posts it to a specified Slack channel.

**Nodes Involved:**  
- Format for Slack  
- Notify Slack

**Node Details:**

- **Format for Slack**  
  - *Type:* Code (JavaScript)  
  - *Role:* Cleans and extracts AI response text, removes markdown bolding, creates a Slack message header with URL and report title, and formats the message for Slack.  
  - *Config:* JS code handles various AI response formats and normalizes text.  
  - *Input:* AI Analyst node output.  
  - *Output:* JSON containing `slack_message`.  
  - *Errors:* Parsing errors if unexpected AI response format.

- **Notify Slack**  
  - *Type:* Slack node  
  - *Role:* Sends the formatted SEO improvement report message to a Slack channel via OAuth2.  
  - *Config:*  
    - Channel name: hardcoded "example" (should be customized).  
    - Text: from Format for Slack node.  
    - Authentication: Slack OAuth2 credentials.  
  - *Input:* Receives Slack message text.  
  - *Output:* Slack API response.  
  - *Errors:* Authentication failures, invalid channel, rate limits.

---

### 3. Summary Table

| Node Name          | Node Type                         | Functional Role                         | Input Node(s)          | Output Node(s)       | Sticky Note                                                                                                               |
|--------------------|----------------------------------|---------------------------------------|------------------------|----------------------|---------------------------------------------------------------------------------------------------------------------------|
| Weekly Schedule    | Schedule Trigger                  | Triggers workflow weekly at set time  | None                   | 📝 Edit Me: Config    |                                                                                                                           |
| 📝 Edit Me: Config | Set                              | Holds target GSC property URL          | Weekly Schedule        | GSC: Compare Period   |                                                                                                                           |
| GSC: Compare Period| Google Search Console             | Retrieves comparative page data        | 📝 Edit Me: Config     | Filter: Drops         |                                                                                                                           |
| Filter: Drops      | Filter                           | Filters pages with drops in clicks and rank | GSC: Compare Period | Loop Pages            |                                                                                                                           |
| Loop Pages         | SplitInBatches                   | Processes pages one by one              | Filter: Drops          | Wait 1s (secondary), Wait 1s -> GSC: Get Queries (main) |                                                                                                                           |
| Wait 1s            | Wait                            | Pauses 1 second between requests       | Loop Pages (secondary) | GSC: Get Queries      |                                                                                                                           |
| GSC: Get Queries   | Google Search Console             | Fetches queries related to page URL    | Wait 1s                | Format Queries        |                                                                                                                           |
| Format Queries     | Code (JavaScript)                 | Formats query data for AI input         | GSC: Get Queries       | Scrape Page           |                                                                                                                           |
| Scrape Page        | HTTP Request                    | Retrieves live HTML content             | Format Queries         | Extract Content       |                                                                                                                           |
| Extract Content    | HTML Extract                    | Extracts title and H2 tags              | Scrape Page            | AI Analyst            |                                                                                                                           |
| AI Analyst         | OpenAI (Langchain)               | Analyzes SEO drops, generates report   | Extract Content        | Format for Slack      |                                                                                                                           |
| Format for Slack   | Code (JavaScript)                 | Formats AI output for Slack message    | AI Analyst             | Notify Slack          |                                                                                                                           |
| Notify Slack       | Slack                           | Sends SEO report to Slack channel      | Format for Slack       | Loop Pages            |                                                                                                                           |
| Sticky Note        | Sticky Note                     | Workflow overview and explanation      | None                   | None                 | ## 💡 About this workflow\nThis workflow automatically audits your website for SEO performance drops. It compares last month's data with the previous month using Google Search Console, identifies pages with declining traffic, and uses AI to prescribe specific content fixes.\n\n### How it works\n1. **Monitor:** Checks GSC for pages where clicks & rank have dropped.\n2. **Analyze:** Scrapes the live page content and compares it against actual search queries.\n3. **Report:** Sends a detailed Slack report with specific Title & H2 improvement ideas.\n\n### Setup steps\n1. **Config:** Add your GSC Property URL in the `📝 Edit Me: Config` node.\n2. **Credentials:** Connect your Google Search Console, OpenAI, and Slack accounts.\n3. **Schedule:** By default, it runs every Monday at 9:00 AM. |
| Sticky Note1       | Sticky Note                     | Data Collection block description      | None                   | None                 | ## 1. Data Collection\nFetch GSC data and filter for pages with negative performance.                                     |
| Sticky Note2       | Sticky Note                     | Deep Analysis block description        | None                   | None                 | ## 2. Deep Analysis\nFetch queries per URL, scrape the page content, and send to AI.                                      |
| Sticky Note3       | Sticky Note                     | Reporting block description            | None                   | None                 | ## 3. Report\nFormat the AI insight and alert Slack.                                                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node named "Weekly Schedule":**  
   - Set interval to weekly, trigger on Monday at 09:00.

2. **Create a Set node named "📝 Edit Me: Config":**  
   - Add string field `target_site_property` with your Google Search Console website URL (e.g., `https://www.example.com/`).

3. **Create a Google Search Console node named "GSC: Compare Period":**  
   - Operation: `comparePageInsights`  
   - Site URL: Use expression referencing `target_site_property` from the Config node.  
   - Connect Google Search Console OAuth2 credentials.

4. **Create a Filter node named "Filter: Drops":**  
   - Add two conditions (AND):  
     - `clicks_diff` < 0  
     - `pos_diff` > 0  
   - Connect input from "GSC: Compare Period".

5. **Create a SplitInBatches node named "Loop Pages":**  
   - Default batch size 1.  
   - Connect input from "Filter: Drops".

6. **Create a Wait node named "Wait 1s":**  
   - Set wait time to 1 second.  
   - Connect secondary output of "Loop Pages" to "Wait 1s".

7. **Create a Google Search Console node named "GSC: Get Queries":**  
   - Operation: `getPageInsights`  
   - Site URL: Expression referencing `target_site_property` from Config.  
   - Add filter: dimension `page` equals current batch page URL (`Loop Pages` node JSON path).  
   - Dimensions: `page`, `query`.  
   - Connect credentials.  
   - Connect input from "Wait 1s".

8. **Create a Code node named "Format Queries":**  
   - Language: JavaScript  
   - Paste the provided JS code which formats queries to bullet points, includes clicks and rank changes, and adds the page URL.  
   - Input from "GSC: Get Queries".

9. **Create an HTTP Request node named "Scrape Page":**  
   - URL: Use expression referencing `target_url` from "Format Queries".  
   - Response Format: Text (HTML).  
   - Input from "Format Queries".

10. **Create an HTML Extract node named "Extract Content":**  
    - Operation: Extract HTML content.  
    - Extraction values:  
      - Key: `page_title`, CSS selector: `title`  
      - Key: `h2_tags`, CSS selector: `h2`, return array: true  
    - Input from "Scrape Page".

11. **Create an OpenAI node named "AI Analyst":**  
    - Model: `gpt-4o-mini` (or equivalent GPT-4 variant).  
    - Input prompt: Use the full prompt text provided, injecting variables for URL, click/rank diffs, search queries, title, and H2 tags from prior nodes.  
    - Connect OpenAI credentials.  
    - Input from "Extract Content".

12. **Create a Code node named "Format for Slack":**  
    - Language: JavaScript  
    - Paste the provided code that cleans AI output and formats it with a Slack header including the URL.  
    - Input from "AI Analyst".

13. **Create a Slack node named "Notify Slack":**  
    - Authentication: Slack OAuth2 credentials.  
    - Channel: Specify your Slack channel name (e.g., "example").  
    - Text: Use expression referencing `slack_message` from "Format for Slack".  
    - Input from "Format for Slack".

14. **Connect "Notify Slack" output back to the main output of "Loop Pages"** to allow batch processing to continue.

15. **Add Sticky Note nodes to document each major workflow block:**  
    - One for Workflow Overview (explaining purpose and flow).  
    - One for Data Collection block.  
    - One for Deep Analysis block.  
    - One for Reporting block.

16. **Configure credentials:**  
    - Google Search Console OAuth2 API credentials with permission to access the target site property.  
    - OpenAI API key with access to GPT-4 or equivalent.  
    - Slack OAuth2 app credentials, authorized for the target workspace and channel.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                    | Context or Link                                                                                  |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| This workflow automatically audits your website for SEO performance drops by comparing last month's Google Search Console data with the previous month, identifying pages with declining traffic, and using AI to prescribe specific content fixes.                  | Sticky Note content in workflow overview.                                                       |
| Scheduling is set to every Monday at 9:00 AM by default to ensure timely weekly monitoring.                                                                                                                                                                      | Workflow default schedule configuration.                                                        |
| The AI prompt is carefully designed to avoid markdown bolding and AI clichés for better Slack readability and engagement. It specifically instructs the AI to provide actionable SEO improvement ideas and missing content suggestions.                         | AI Analyst node prompt details.                                                                 |
| Ensure the Slack channel name in "Notify Slack" node matches your intended destination channel and that the OAuth2 credentials have appropriate permissions to post messages.                                                                                   | Slack node configuration advice.                                                                |
| Google Search Console API quota limits and OAuth token refresh handling should be monitored to prevent workflow failures.                                                                                                                                       | Common integration consideration.                                                               |
| For best results, update the `target_site_property` URL in the Config node to your actual verified GSC property URL.                                                                                                                                              | User configuration requirement.                                                                 |
| The workflow relies on relatively stable page structure (title and H2 tags) for content extraction. If pages have dynamic content loading or non-standard HTML, consider adapting the HTML Extract node or adding additional scraping logic.                     | Scraping limitations note.                                                                       |
| Link to n8n official docs for Google Search Console node: https://docs.n8n.io/integrations/builtin/nodes/n8n-nodes-google-search-console/                                                                                                                    | n8n Google Search Console node documentation.                                                   |
| Link to n8n official docs for Slack node: https://docs.n8n.io/integrations/builtin/nodes/n8n-nodes-slack/                                                                                                                                                         | n8n Slack node documentation.                                                                   |
| Link to OpenAI API documentation for prompt design and usage: https://platform.openai.com/docs/api-reference                                                                                                                                                     | OpenAI API docs.                                                                                |

---

**Disclaimer:** This content is derived exclusively from an automated workflow constructed in n8n, a tool for integration and automation. It complies fully with current content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.