Audit & Monitor SEO Performance with GPT-4 Advisor, PageSpeed Insights & Slack Alerts

https://n8nworkflows.xyz/workflows/audit---monitor-seo-performance-with-gpt-4-advisor--pagespeed-insights---slack-alerts-6730


# Audit & Monitor SEO Performance with GPT-4 Advisor, PageSpeed Insights & Slack Alerts

---
### 1. Workflow Overview

This workflow, titled **"Audit & Monitor SEO Performance with GPT-4 Advisor, PageSpeed Insights & Slack Alerts"**, automates comprehensive SEO and Core Web Vitals auditing for a list of monitored websites and provides actionable insights through AI analysis and real-time alerts. It also supports interactive chatbot queries for on-demand SEO advice and audits.

The workflow is logically divided into the following blocks:  
- **1.1 Scheduled Website Auditing:** Periodic crawling and analysis of predefined websites for on-page SEO, technical SEO, and Core Web Vitals data.  
- **1.2 AI-Powered SEO Analysis & Reporting:** AI-driven evaluation of collected SEO data with recommendations, logging results to Google Sheets, and triggering alerts via Slack.  
- **1.3 Chatbot Query Processing & Response:** Receives SEO-related user queries via webhook, extracts intent and entities, performs targeted data retrieval or full audits as needed, and provides AI-generated responses.  

Each block contains interconnected nodes orchestrated to handle specific roles from data acquisition, parsing, validation, AI analysis, to reporting and interaction.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Website Auditing

- **Overview:**  
  Periodically triggers audit cycles for a list of monitored websites, fetching raw HTML, parsing critical SEO elements, validating on-page and technical SEO aspects, and retrieving Core Web Vitals metrics.

- **Nodes Involved:**  
  Start, Scheduled SEO & Core Web Vitals Audit, Monitored Websites List, HTTP Crawler, Cheerio HTML Parser (On-Page SEO), On-Page SEO Validator, Fetch Robots.txt, Check Sitemap.xml Presence, Technical SEO Validator, Google PageSpeed Insights API.

- **Node Details:**

  - **Start**  
    - Type: Start node  
    - Role: Entry point for workflow execution  
    - Configuration: Default, no parameters  
    - Connections: Triggers Scheduled SEO & Core Web Vitals Audit and Chatbot Webhook Listener  
    - Potential Failures: None inherent, but downstream failures can occur.

  - **Scheduled SEO & Core Web Vitals Audit (Cron)**  
    - Type: Cron Trigger  
    - Role: Initiates audit every 4 hours to keep SEO data fresh  
    - Configuration: Every 4 hours interval  
    - Connections: Outputs to Monitored Websites List  
    - Failures: Cron misconfiguration or execution delays.

  - **Monitored Websites List (Set)**  
    - Type: Set node  
    - Role: Defines websites to audit, with URLs and friendly names  
    - Configuration: Hardcoded list with two entries (Main Site, Blog Site)  
    - Connections: Output feeds into HTTP Crawler and Google PageSpeed Insights API  
    - Failures: Empty or malformed URLs will cause downstream errors.

  - **HTTP Crawler (HTTP Request)**  
    - Type: HTTP Request  
    - Role: Fetches raw HTML content of each website URL  
    - Configuration: Redirects allowed, full response with array format, no auth  
    - Inputs: URL from Monitored Websites List  
    - Outputs: Raw HTML data to Cheerio HTML Parser  
    - Failures: Network errors, 4xx/5xx responses, timeouts.

  - **Cheerio HTML Parser (On-Page SEO) (Cheerio)**  
    - Type: HTML Parser  
    - Role: Extracts on-page SEO elements: title, meta description, H1/H2 tags, links, alt tags, canonical, robots meta, JSON-LD schema  
    - Configuration: Multiple selectors targeting SEO-relevant tags and attributes  
    - Inputs: HTML body from HTTP Crawler  
    - Outputs: Parsed SEO data to On-Page SEO Validator  
    - Failures: Parsing errors if HTML malformed or structure unexpected.

  - **On-Page SEO Validator (Function)**  
    - Type: Function (JavaScript)  
    - Role: Checks for common on-page SEO issues such as missing titles, meta description length, multiple H1s, alt text missing, canonical presence, noindex tags, and schema presence  
    - Configuration: Custom JS script analyzing parsed data and producing boolean flags and counts  
    - Inputs: Parsed SEO data from Cheerio node  
    - Outputs: Enhanced JSON including issue flags to Technical SEO Validator  
    - Failures: Script errors if data null or unexpected formats.

  - **Fetch Robots.txt (HTTP Request)**  
    - Type: HTTP Request  
    - Role: Retrieves robots.txt file content from the site root  
    - Configuration: URL constructed by appending '/robots.txt' to base URL, response as string  
    - Inputs: URL from Monitored Websites List  
    - Outputs: robots.txt content to Technical SEO Validator  
    - Failures: 404 if file absent, network errors.

  - **Check Sitemap.xml Presence (HTTP Request)**  
    - Type: HTTP Request  
    - Role: Checks if sitemap.xml file exists at site root  
    - Configuration: URL constructed by appending '/sitemap.xml' to base URL  
    - Inputs: URL from Monitored Websites List  
    - Outputs: HTTP status code to Technical SEO Validator  
    - Failures: 404 or network errors indicate absence.

  - **Technical SEO Validator (Function)**  
    - Type: Function (JavaScript)  
    - Role: Validates HTTPS usage, robots.txt content availability, sitemap.xml presence; placeholder for broken links check  
    - Configuration: Reads URL protocol, robots.txt content, and sitemap check results; compiles technical issue flags  
    - Inputs: On-Page SEO Validator output, Fetch Robots.txt output, Check Sitemap.xml Presence output  
    - Outputs: Combined JSON with technical issues appended to SEO data for AI analysis  
    - Failures: Access issues to robots.txt or sitemap.xml cause fallback values; parsing errors possible.

  - **Google PageSpeed Insights API (Google PageSpeed Insights node)**  
    - Type: Google PageSpeed Insights API  
    - Role: Retrieves Core Web Vitals and other performance/SEO metrics (LCP, INP, CLS, etc.) for each URL  
    - Configuration: Desktop strategy, categories: performance, SEO, best-practices, accessibility; requires Google API credentials  
    - Inputs: URL from Monitored Websites List  
    - Outputs: Performance metrics to Save Comprehensive SEO Report to Google Sheet and Overall SEO Health Check  
    - Failures: API quota exceeded, auth errors, network timeouts.

---

#### 1.2 AI-Powered SEO Analysis & Reporting

- **Overview:**  
  Combines on-page and technical SEO data with Core Web Vitals metrics, submits to GPT-4 for advanced analysis and recommendations, logs data to Google Sheets, and triggers alerts via Slack if critical issues are detected.

- **Nodes Involved:**  
  AI SEO Audit & Recommendations, Save Comprehensive SEO Report to Google Sheet, Overall SEO Health Check (Alert Trigger), Send Comprehensive SEO Audit Alert (Slack).

- **Node Details:**

  - **AI SEO Audit & Recommendations (OpenAI)**  
    - Type: OpenAI GPT-4 node  
    - Role: Deeply analyzes combined SEO and technical data, including content snippet, to generate human-friendly audit summary and actionable SEO recommendations  
    - Configuration: Model gpt-4o, prompt includes URL, on-page and technical issues JSON, content excerpt; maxTokens 1500, temperature 0.7  
    - Inputs: Output from Technical SEO Validator and HTTP Crawler (for content snippet)  
    - Outputs: AI-generated audit and recommendations text  
    - Failures: API rate limits, auth errors, prompt formatting issues.

  - **Save Comprehensive SEO Report to Google Sheet (Google Sheets)**  
    - Type: Google Sheets Append operation  
    - Role: Logs all key SEO metrics, issue flags, Core Web Vitals, and AI recommendations into a structured Google Sheet for historical tracking  
    - Configuration: Spreadsheet ID and sheet name set; data serialized as JSON string with relevant fields; user-entered input mode; requires Google OAuth2 credentials  
    - Inputs: Combines outputs from AI node, on-page and technical validators, and Google PageSpeed Insights node  
    - Outputs: None (append only)  
    - Failures: Auth errors, API quota exceeded, invalid spreadsheet ID.

  - **Overall SEO Health Check (Alert Trigger) (If node)**  
    - Type: If (conditional) node  
    - Role: Evaluates combined conditions for critical SEO problems or poor Core Web Vitals metrics to decide if alerting is needed  
    - Configuration: Logical OR of multiple on-page SEO issues, HTTPS status, sitemap presence, LCP > 2500 ms, INP > 200 ms  
    - Inputs: SEO issues from On-Page SEO Validator and Technical SEO Validator, metrics from Google PageSpeed Insights API  
    - Outputs: True branch triggers Slack alert; false branch disables alert  
    - Failures: Expression evaluation errors if data missing.

  - **Send Comprehensive SEO Audit Alert (Slack)**  
    - Type: Slack node (Webhook)  
    - Role: Sends a detailed, formatted alert message to a Slack channel with all critical SEO issues, Core Web Vitals data, and AI recommendations snippet  
    - Configuration: Slack webhook URL configured; rich text with conditionally formatted fields and excerpts; includes truncated AI recommendations  
    - Inputs: Receives data from Overall SEO Health Check true branch  
    - Outputs: None  
    - Failures: Invalid webhook URL, Slack API downtime.

---

#### 1.3 Chatbot Query Processing & Response

- **Overview:**  
  Manages incoming chatbot queries via webhook, extracts relevant entities and intents, optionally triggers on-demand audits or data fetches (Google Search Console), processes queries with AI, and returns concise expert responses.

- **Nodes Involved:**  
  Chatbot Webhook Listener, Extract Chatbot Entities & Intent, If Chatbot Requests Full Audit, Execute SEO Audit Workflow (Chatbot Trigger), AI Chatbot NLP & Response, Google Search Console API - Query Data (Chatbot), Respond to Chatbot Webhook, Re-Crawl for Chatbot Audit.

- **Node Details:**

  - **Chatbot Webhook Listener (Webhook)**  
    - Type: Webhook Listener (POST)  
    - Role: Entry point for chatbot queries, listens on path `/chatbot-query`  
    - Configuration: HTTP POST method, webhook ID set  
    - Outputs: Passes query data to entity extraction  
    - Failures: Request format issues, webhook misconfiguration.

  - **Extract Chatbot Entities & Intent (Function)**  
    - Type: Function (JavaScript)  
    - Role: Parses natural language queries to detect URLs, keywords, SEO topics (title, meta description, H1, alt text, canonical, noindex, schema), technical topics (robots.txt, sitemap.xml, HTTPS), and performance metrics (LCP, INP, Core Web Vitals). Also detects if user requests a full audit  
    - Configuration: Regex and keyword-based extraction from lowercase query string  
    - Inputs: Webhook JSON body  
    - Outputs: JSON enriched with `entities` object indicating detected parameters and trigger flags  
    - Failures: Incorrect parsing if input malformed.

  - **If Chatbot Requests Full Audit (If)**  
    - Type: If node  
    - Role: Checks if extracted entities indicate a demand for a full SEO audit  
    - Configuration: Boolean check on `entities.trigger_full_audit`  
    - Inputs: Entity extraction output  
    - Outputs: True branch triggers main audit workflow; false branch proceeds to AI response generation  
    - Failures: Expression failures if field missing.

  - **Execute SEO Audit Workflow (Chatbot Trigger) (Execute Workflow)**  
    - Type: Execute Workflow  
    - Role: Triggers the main SEO audit workflow (self-reference) for real-time audit based on chatbot request  
    - Configuration: Calls workflow by ID `advanced_seo_core_web_vitals_chatbot_automation_suite` starting at AI SEO Audit & Recommendations node  
    - Inputs: Conditioned on full audit request  
    - Outputs: None (sub-workflow executes independently)  
    - Failures: Circular execution risks, workflow ID mismatches.

  - **AI Chatbot NLP & Response (OpenAI)**  
    - Type: OpenAI GPT-4 node  
    - Role: Analyzes user query context and intent, generates concise, actionable SEO or website performance responses, including definitions, best practices, or troubleshooting tips  
    - Configuration: Model gpt-4o, prompt includes user query and example intents, maxTokens 300, temperature 0.7  
    - Inputs: Query JSON and optionally Google Search Console data  
    - Outputs: AI-generated chatbot response text  
    - Failures: API limits, prompt errors.

  - **Google Search Console API - Query Data (Chatbot) (Google Search Console)**  
    - Type: Google Search Console API node  
    - Role: Fetches keyword query performance data for chatbot queries referencing keywords and URLs  
    - Configuration: Filters on extracted keyword, date range from Jan 1, 2024 to today, max 10 rows, dimension "query"  
    - Inputs: Entities from extraction node  
    - Outputs: Keyword performance data to AI response node  
    - Failures: Auth errors, quota limits, no data found.

  - **Respond to Chatbot Webhook (Respond to Webhook)**  
    - Type: Respond to Webhook node  
    - Role: Sends back AI-generated response JSON to the chatbot platform as webhook reply  
    - Configuration: JSON mode with response field populated from AI Chatbot NLP & Response node  
    - Inputs: AI response node output  
    - Outputs: HTTP response to webhook caller  
    - Failures: Response timeout, malformed JSON.

  - **Re-Crawl for Chatbot Audit (HTTP Request)**  
    - Type: HTTP Request  
    - Role: Performs on-demand crawl of URL for audit if requested by chatbot  
    - Configuration: Redirects enabled, full response, array format  
    - Inputs: URL from chatbot query entities  
    - Outputs: To Cheerio HTML Parser for further analysis  
    - Failures: Network errors, bad URLs.

---

### 3. Summary Table

| Node Name                             | Node Type                  | Functional Role                                      | Input Node(s)                          | Output Node(s)                                         | Sticky Note                                                                                         |
|-------------------------------------|----------------------------|-----------------------------------------------------|--------------------------------------|-------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Start                               | Start                      | Workflow entry point                                | None                                 | Scheduled SEO & Core Web Vitals Audit, Chatbot Webhook Listener |                                                                                                   |
| Scheduled SEO & Core Web Vitals Audit | Cron                       | Triggers audit every 4 hours                        | Start                                | Monitored Websites List                                | Triggers comprehensive SEO and Core Web Vitals check every 4 hours                                |
| Chatbot Webhook Listener            | Webhook                    | Receives user queries from chatbot                  | Start                                | Extract Chatbot Entities & Intent                      | Receives user queries from external chatbot platforms                                             |
| Monitored Websites List             | Set                        | Defines websites to audit                            | Scheduled SEO & Core Web Vitals Audit | HTTP Crawler, Google PageSpeed Insights API            | List of websites to monitor for SEO and performance                                              |
| HTTP Crawler                       | HTTP Request               | Fetches raw HTML of websites                         | Monitored Websites List              | Cheerio HTML Parser (On-Page SEO)                      | Fetches raw HTML content for parsing                                                             |
| Cheerio HTML Parser (On-Page SEO)  | Cheerio                    | Extracts SEO elements from HTML                      | HTTP Crawler                        | On-Page SEO Validator, Re-Crawl for Chatbot Audit     | Extracts critical on-page SEO elements from HTML                                                 |
| On-Page SEO Validator              | Function                   | Validates common on-page SEO issues                  | Cheerio HTML Parser                 | Technical SEO Validator                                | Checks for common on-page SEO issues                                                             |
| Fetch Robots.txt                   | HTTP Request               | Retrieves robots.txt content                         | Monitored Websites List              | Technical SEO Validator                                | Fetches the robots.txt file for analysis                                                          |
| Check Sitemap.xml Presence          | HTTP Request               | Checks sitemap.xml availability                      | Monitored Websites List              | Technical SEO Validator                                | Checks if sitemap.xml exists (will fail if 404)                                                  |
| Technical SEO Validator            | Function                   | Validates HTTPS, robots.txt, sitemap.xml presence   | On-Page SEO Validator, Fetch Robots.txt, Check Sitemap.xml Presence | AI SEO Audit & Recommendations                        | Validates HTTPS, robots.txt presence/content, and sitemap.xml                                    |
| AI SEO Audit & Recommendations     | OpenAI (GPT-4)             | AI analysis and actionable SEO recommendations      | Technical SEO Validator, HTTP Crawler | Save Comprehensive SEO Report to Google Sheet, Overall SEO Health Check | Uses AI to deeply analyze combined SEO data and provide smart recommendations                     |
| Google PageSpeed Insights API      | Google PageSpeed Insights  | Retrieves Core Web Vitals and performance metrics   | Monitored Websites List              | Save Comprehensive SEO Report to Google Sheet, Overall SEO Health Check | Fetches Core Web Vitals (LCP, INP, CLS) and other performance/SEO metrics                         |
| Save Comprehensive SEO Report to Google Sheet | Google Sheets             | Logs SEO audit data and AI recommendations          | AI SEO Audit & Recommendations, Google PageSpeed Insights API | None                                                  | Logs detailed on-page, technical, and Core Web Vitals data to a Google Sheet                     |
| Overall SEO Health Check (Alert Trigger) | If                        | Determines if alert conditions are met               | Save Comprehensive SEO Report to Google Sheet, Google PageSpeed Insights API | Send Comprehensive SEO Audit Alert (Slack)           | Triggers alert if any critical SEO or CWV issue is found                                         |
| Send Comprehensive SEO Audit Alert (Slack) | Slack (Webhook)            | Sends detailed alerts to Slack                       | Overall SEO Health Check             | None                                                  | Sends detailed audit findings and AI recommendations to Slack                                   |
| Extract Chatbot Entities & Intent  | Function                   | Extracts entities and intent from chatbot queries   | Chatbot Webhook Listener             | If Chatbot Requests Full Audit, AI Chatbot NLP & Response, Google Search Console API - Query Data (Chatbot) | Extracts key information and intent from chatbot queries                                        |
| If Chatbot Requests Full Audit     | If                         | Checks if full audit requested by chatbot           | Extract Chatbot Entities & Intent   | Execute SEO Audit Workflow (Chatbot Trigger), AI Chatbot NLP & Response | Checks if the chatbot query explicitly asks for a full SEO audit                                |
| Execute SEO Audit Workflow (Chatbot Trigger) | Execute Workflow           | Triggers main SEO audit workflow from chatbot       | If Chatbot Requests Full Audit       | None                                                  | Triggers the main SEO audit workflow from chatbot request                                      |
| AI Chatbot NLP & Response          | OpenAI (GPT-4)             | Generates chatbot responses based on query intent   | Extract Chatbot Entities & Intent, Google Search Console API - Query Data (Chatbot) | Respond to Chatbot Webhook                             | Processes chatbot query, understands intent, and generates intelligent response                 |
| Google Search Console API - Query Data (Chatbot) | Google Search Console API  | Retrieves keyword performance data for chatbot      | Extract Chatbot Entities & Intent   | AI Chatbot NLP & Response                             | Fetches keyword performance data for chatbot queries                                            |
| Respond to Chatbot Webhook         | Respond to Webhook         | Sends AI-generated response back to chatbot         | AI Chatbot NLP & Response            | None                                                  | Sends the AI-generated response back to the chatbot platform                                   |
| Re-Crawl for Chatbot Audit         | HTTP Request               | Performs on-demand crawl for chatbot audit           | N/A (triggered within logic)         | Cheerio HTML Parser (On-Page SEO)                      | Performs an on-demand crawl if requested by chatbot                                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow named:**  
   "Advanced SEO, Core Web Vitals & Chatbot Automation Suite"

2. **Add a Start node:**  
   - Default configuration.

3. **Add a Cron node ("Scheduled SEO & Core Web Vitals Audit"):**  
   - Set Mode: Every 4 hours (unit: hours, value: 4)  
   - Connect Start node output to this node.

4. **Add a Set node ("Monitored Websites List"):**  
   - Define values array with objects containing `url` and `name` for each monitored website (e.g., main site and blog site).  
   - Connect Cron node output to this node.

5. **Add HTTP Request node ("HTTP Crawler"):**  
   - URL parameter: `={{ $json.url }}`  
   - Options: Redirects enabled, full response true, response format array  
   - Authentication: None  
   - Connect Monitored Websites List output to this node.

6. **Add Cheerio node ("Cheerio HTML Parser (On-Page SEO)"):**  
   - Extract data: title, meta description, H1 tags (all), H2 tags (all), all anchor hrefs, all image alt attributes, canonical link href, robots meta content, JSON-LD scripts (all)  
   - Data selector: body  
   - Connect HTTP Crawler output to this node.

7. **Add Function node ("On-Page SEO Validator"):**  
   - Paste provided JavaScript code to check common SEO issues (missing titles, length checks, multiple H1s, alt text missing, canonical presence, noindex tag, schema presence).  
   - Connect Cheerio node output to this node.

8. **Add HTTP Request node ("Fetch Robots.txt"):**  
   - URL: `={{ new URL('/robots.txt', $json.url).href }}`  
   - Response format: string  
   - Authentication: None  
   - Connect Monitored Websites List output to this node.

9. **Add HTTP Request node ("Check Sitemap.xml Presence"):**  
   - URL: `={{ new URL('/sitemap.xml', $json.url).href }}`  
   - Authentication: None  
   - Connect Monitored Websites List output to this node.

10. **Add Function node ("Technical SEO Validator"):**  
    - Paste provided JavaScript that analyzes HTTPS, robots.txt content, sitemap.xml presence, and marks placeholder for broken links.  
    - Connect three inputs in the order: On-Page SEO Validator output, Fetch Robots.txt output, Check Sitemap.xml Presence output.

11. **Add Google PageSpeed Insights API node ("Google PageSpeed Insights API"):**  
    - URL: `={{ $json.url }}`  
    - Categories: performance, seo, best-practices, accessibility  
    - Strategy: desktop  
    - Resource: pagespeed  
    - Operation: run  
    - Authentication: Google API credentials (set up OAuth2 or API key)  
    - Connect Monitored Websites List output to this node.

12. **Add OpenAI node ("AI SEO Audit & Recommendations"):**  
    - Model: gpt-4o  
    - Prompt: Use the template that includes URL, serialized on-page and technical issues, and first 1000 chars of crawled content.  
    - Options: maxTokens 1500, temperature 0.7  
    - Connect Technical SEO Validator output as main input; HTTP Crawler output for content snippet context.

13. **Add Google Sheets node ("Save Comprehensive SEO Report to Google Sheet"):**  
    - Operation: append  
    - Spreadsheet ID: your Google Sheet ID  
    - Sheet name: "Comprehensive SEO Reports"  
    - Data: JSON string including URL, date, SEO flags, Core Web Vitals, AI recommendations excerpt (as per example)  
    - Authentication: Google OAuth2 API  
    - Connect AI SEO Audit node output as main input; Google PageSpeed Insights node as secondary input.

14. **Add If node ("Overall SEO Health Check (Alert Trigger)")**  
    - Conditions: OR logic combining any critical SEO issues from on-page and technical validators plus thresholds for LCP > 2500 ms and INP > 200 ms from PageSpeed Insights.  
    - Connect Save Report node and PageSpeed Insights node outputs to this node.

15. **Add Slack node ("Send Comprehensive SEO Audit Alert (Slack)"):**  
    - Text: Richly formatted message including all detected SEO issues, Core Web Vitals data, snippet of AI recommendations.  
    - Webhook URL: Your Slack webhook URL  
    - Connect true branch from If node to Slack node.

16. **Add Webhook node ("Chatbot Webhook Listener"):**  
    - Path: chatbot-query  
    - HTTP Method: POST  
    - Webhook ID: seo_chatbot_listener  
    - Connect Start node output here.

17. **Add Function node ("Extract Chatbot Entities & Intent"):**  
    - Paste JavaScript that extracts URLs, keywords, SEO topics, technical topics, performance metrics, and checks if full audit requested.  
    - Connect Chatbot Webhook Listener output here.

18. **Add If node ("If Chatbot Requests Full Audit"):**  
    - Condition: boolean check if `entities.trigger_full_audit` is true  
    - Connect entity extraction output to this node.

19. **Add Execute Workflow node ("Execute SEO Audit Workflow (Chatbot Trigger)"):**  
    - Workflow ID: advanced_seo_core_web_vitals_chatbot_automation_suite (self-reference)  
    - Node: AI SEO Audit & Recommendations or appropriate entry  
    - Connect true branch of If node here.

20. **Add OpenAI node ("AI Chatbot NLP & Response"):**  
    - Model: gpt-4o  
    - Prompt: Template to analyze user query and provide concise SEO/performance responses or troubleshooting tips  
    - Max tokens: 300, temperature: 0.7  
    - Connect false branch of If node and Google Search Console API node outputs here.

21. **Add Google Search Console API node ("Google Search Console API - Query Data (Chatbot)"):**  
    - Operation: get  
    - Site URL: from extracted entities or default site  
    - Filters: query equals extracted keyword  
    - Date range: start 2024-01-01 to today  
    - Row limit: 10  
    - Authentication: Google API credentials  
    - Connect entity extraction output to this node.

22. **Add Respond to Webhook node ("Respond to Chatbot Webhook"):**  
    - Mode: JSON  
    - JSON Body: response field from AI Chatbot NLP & Response node output  
    - Connect AI Chatbot NLP & Response node output here.

23. **Add HTTP Request node ("Re-Crawl for Chatbot Audit"):**  
    - URL: `={{ $json.url }}`  
    - Options: redirects enabled, full response, array format  
    - Connect as needed for on-demand crawling triggered from chatbot logic.

24. **Connect all nodes according to functional flows described in Section 2.**

25. **Set workflow execution timeout to 3600000 ms (1 hour) to allow for long-running audits.**

26. **Configure all necessary credentials:**  
    - Google API OAuth2 for Google Sheets, PageSpeed Insights, and Search Console nodes.  
    - OpenAI API key for GPT-4 nodes.  
    - Slack Webhook URL for Slack node.

27. **Activate the workflow.**

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                                                                   |
|-------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Workflow name inspired by advanced SEO and Core Web Vitals monitoring needs with AI assistance. | General project branding.                                                                        |
| Slack alert formatting includes truncated AI recommendations for concise notifications.          | Slack best practices for message length and readability.                                        |
| AI prompts carefully crafted to ensure actionable and relevant SEO advice and chatbot responses. | OpenAI GPT-4 prompt engineering techniques.                                                    |
| Google Sheet structure should be pre-created with appropriate headers matching logged fields.    | Facilitates historical tracking and external analysis.                                          |
| Google API credentials require enabling respective APIs and OAuth2 setup in Google Cloud Console.| https://console.cloud.google.com/apis/dashboard                                                     |
| Slack webhook setup instructions available at https://api.slack.com/messaging/webhooks          | For configuring Slack alert destination.                                                        |
| Chatbot webhook path `/chatbot-query` should be registered in external chatbot platforms.        | Allows external systems to send SEO/performance queries to this workflow.                       |
| Circular workflow execution triggered by chatbot requires careful monitoring to avoid infinite loops. | Best practice to limit audit frequency or add safeguards.                                      |

---

This structured documentation provides full insight into the workflow’s design, logic, and components, enabling advanced users and AI agents to understand, reproduce, customize, and troubleshoot the SEO audit automation and chatbot integration seamlessly.

---

**Disclaimer:** The provided text originates solely from an n8n automation workflow. All content complies with applicable content policies and only handles legal and public data.