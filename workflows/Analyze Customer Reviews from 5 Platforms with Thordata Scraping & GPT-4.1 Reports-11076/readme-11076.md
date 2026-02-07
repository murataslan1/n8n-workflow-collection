Analyze Customer Reviews from 5 Platforms with Thordata Scraping & GPT-4.1 Reports

https://n8nworkflows.xyz/workflows/analyze-customer-reviews-from-5-platforms-with-thordata-scraping---gpt-4-1-reports-11076


# Analyze Customer Reviews from 5 Platforms with Thordata Scraping & GPT-4.1 Reports

### 1. Workflow Overview

This n8n workflow automates the process of collecting, standardizing, deduplicating, and analyzing customer reviews from five major platforms: Trustpilot, Capterra, Chrome Web Store, TrustRadius, and Product Hunt. It leverages the Thordata scraping API to safely fetch JavaScript-rendered pages with proxy rotation, processes raw HTML to extract structured reviews, and then uses GPT-4.1 to perform advanced sentiment and thematic analysis on the aggregated review dataset. Finally, it generates and sends a polished, responsive HTML email report summarizing insights, sentiment, churn risk, and actionable recommendations.

**Target Use Cases:**  
- Product managers and founders seeking consolidated customer feedback  
- Marketing and growth teams analyzing product reputation  
- Customer success and support leads monitoring sentiment and issues  
- Agencies providing review intelligence reports   

**Logical Blocks:**  
- **1.1 Input Reception:** Supports manual trigger, webhook POST, or form submission to receive product review source URLs or identifiers.  
- **1.2 Review Source Preparation:** Normalizes inputs into standardized source objects for each platform.  
- **1.3 Pagination and Scraping Loop:** Iterates over each source and paginates through review pages, building URLs, scraping HTML via Thordata API with proxy and JS rendering, and respecting rate limits and pagination stopping conditions.  
- **1.4 Review Parsing & Standardization:** Uses a universal parser node that applies platform-specific HTML parsers and standardizes review fields with unique IDs for deduplication.  
- **1.5 Deduplication & Aggregation:** Collects all scraped reviews into global static storage, removes duplicates by unique ID, and compiles summaries and error reports.  
- **1.6 AI Analysis:** Prepares formatted review text and metadata, sends it as a single batch to GPT-4.1 for deep sentiment, theme extraction, churn risk assessment, and actionable insights.  
- **1.7 Report Rendering & Delivery:** Generates a beautifully formatted responsive HTML email with AI insights, and sends it via Gmail OAuth2.  
- **1.8 Response Handling:** For webhook or form triggers, returns the raw data summary and reviews as JSON to the requester.  

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
Receives trigger to start the workflow. Supports three entry points: manual execution, webhook POST, or form submission, allowing flexible integration and user input.

**Nodes Involved:**  
- Manual Trigger  
- Webhook Trigger  
- Form Trigger – Submit Sources

**Node Details:**

- **Manual Trigger**  
  - Type: Manual start node  
  - Role: Allows quick testing or manual execution with default values.  
  - Inputs: None  
  - Outputs: One output to "Prepare Review Sources"  
  - Edge cases: None  

- **Webhook Trigger**  
  - Type: HTTP webhook POST listener  
  - Role: Accepts JSON POST from external sources (e.g., Zapier, Make) with product and source URLs.  
  - Inputs: HTTP POST request with JSON body  
  - Outputs: One output to "Prepare Review Sources"  
  - Edge cases: Must handle missing or malformed JSON gracefully; no explicit validation node.  

- **Form Trigger – Submit Sources**  
  - Type: Web form submission  
  - Role: Provides user-friendly UI form to enter product name and review source URLs/identifiers.  
  - Configuration: Fields for productName (required), domain, capterraUrl, chromeStoreUrl, trustRadius, producthunt  
  - Outputs: One output to "Prepare Review Sources"  
  - Edge cases: Required productName enforced; other fields optional.  

---

#### 1.2 Review Source Preparation

**Overview:**  
Consolidates and standardizes input data into a uniform list of review sources objects, each containing product name, source type, and source URL. Resets global storage of scraped reviews.

**Nodes Involved:**  
- Prepare Review Sources (Code)

**Node Details:**  

- **Prepare Review Sources**  
  - Type: Code (JavaScript)  
  - Role:  
    - Resets global static storage array `allScrapedReviews` for deduplication accumulation.  
    - Reads inputs from manual, webhook, or form trigger, with fallback defaults.  
    - Constructs an array of source objects with normalized keys: product_name, source_type, source_url.  
    - Supports five platforms: trustpilot (domain-based URL), capterra, chromewebstore, trustradius, producthunt (slug-based URL).  
  - Expressions/Variables: Reads `$input.first().json` for input data, handles multiple input types gracefully.  
  - Outputs: Array of source JSON objects, each emitted separately.  
  - Edge cases: If URLs or slugs are empty or missing, that source is omitted.  
  - Failure modes: No explicit error handling; malformed inputs may result in no sources emitted.  

---

#### 1.3 Pagination and Scraping Loop

**Overview:**  
Iterates over each source and paginates through review pages using a rate-limit safe batch splitter; constructs paginated URLs, scrapes pages with Thordata API, and manages loop continuation based on review presence and platform-specific logic.

**Nodes Involved:**  
- Loop Through Sources (Rate Limit Safe) (SplitInBatches)  
- Initialize Pagination (Set)  
- URL Builder (Code)  
- Scrape Page (Robust) via Thordata API (HTTP Request)  
- Universal Safe Parser (Code)  
- Has More Pages? (IF)  
- Increment Page Counter (Set)  
- Rate Limit Delay (2s) (Wait)

**Node Details:**

- **Loop Through Sources (Rate Limit Safe)**  
  - Type: SplitInBatches  
  - Role: Loops through each review source one at a time to avoid rate limits.  
  - Inputs: Array of sources from "Prepare Review Sources"  
  - Outputs: Each source passed to pagination initialization  
  - Edge cases: Handles empty source list gracefully.  

- **Initialize Pagination**  
  - Type: Set  
  - Role: Sets initial page_number = 1 on each source item before pagination loop.  
  - Inputs: Single source JSON  
  - Outputs: To URL Builder node  

- **URL Builder**  
  - Type: Code  
  - Role: Builds the full URL to scrape, adding `?page=` parameter for paginated platforms, except for Chrome Web Store which does not support traditional pagination.  
  - Logic:  
    - If page = 1, returns base URL unmodified  
    - For page > 1, appends `?page=page_number` or uses `&page=page_number` if URL already has parameters  
  - Inputs: source JSON with page_number  
  - Outputs: Adds `target_url` for scraping  

- **Scrape Page (Robust) via Thordata API**  
  - Type: HTTP Request  
  - Role: Calls Thordata universal scraping API with options: JS rendering enabled, CSS cleaning, proxy rotation via configured HTTP header auth credentials.  
  - Configuration: POST to `https://universalapi.thordata.com/request` with form-urlencoded body including target_url, type=html, js_render=True, clean_content=css  
  - Timeout: 120 seconds  
  - Error Handling: On error, continues workflow without failing  
  - Inputs: Receives target_url from URL Builder  
  - Outputs: Raw HTML response JSON to Universal Safe Parser  
  - Failure modes: Network errors, proxy blocking, Cloudflare challenges (handled downstream).  

- **Universal Safe Parser**  
  - Type: Code  
  - Role: Parses raw HTML from Thordata response using platform-specific parsers (Trustpilot, Capterra, Chrome Web Store, Product Hunt, TrustRadius).  
  - Functionality:  
    - Detects source type from URL or HTML signature if unknown.  
    - Parses reviews extracting author, rating, title, text, date, verified status, and other metadata.  
    - Standardizes reviews with clean fields and generates unique deterministic IDs based on source, author, date, and text snippet to enable deduplication.  
    - Handles errors such as blocked pages or unexpected HTML gracefully, logs error messages.  
    - Saves all parsed reviews into global static storage `allScrapedReviews` to accumulate across pagination and sources.  
  - Inputs: JSON with html content and meta from Thordata  
  - Outputs: Parsed reviews to Has More Pages? node  
  - Failure modes: Cloudflare blocks, HTML structure changes causing parse failures, unknown sources.  

- **Has More Pages?**  
  - Type: IF  
  - Role: Decides whether to paginate further or end loop.  
  - Logic:  
    - If reviews found on current page (length > 0 or review_count > 0) and source is not Chrome Web Store or Product Hunt (which do not paginate traditionally), continue pagination.  
    - Else stops looping for that source.  
  - Inputs: Parsed review JSON from parser  
  - Outputs:  
    - True branch to Increment Page Counter (next page)  
    - False branch back to Loop Through Sources (next source)  

- **Increment Page Counter**  
  - Type: Set  
  - Role: Increases page_number by 1 for pagination.  
  - Outputs: To Rate Limit Delay  

- **Rate Limit Delay (2s)**  
  - Type: Wait  
  - Role: Enforces a 2-second delay between page requests to avoid rate limits or bans.  
  - Outputs: Loops back to URL Builder to scrape next page  

---

#### 1.4 Deduplication & Aggregation

**Overview:**  
After scraping completes for all sources/pages, this block collects all stored reviews from global static data, deduplicates by unique ID, compiles summary stats, and gathers any scraping errors.

**Nodes Involved:**  
- Deduplicate & Summarize All Reviews (Code)

**Node Details:**

- **Deduplicate & Summarize All Reviews**  
  - Type: Code  
  - Role:  
    - Reads global static storage `allScrapedReviews` array.  
    - Iterates all items, checks for success status, collects errors for failed sources.  
    - Deduplicates reviews by unique_id using a Set.  
    - Creates summary object with total unique reviews, sources attempted, sources failed, and scrape timestamp.  
  - Inputs: Completion of scraping loop outputs  
  - Outputs: JSON with summary, deduplicated reviews array, and errors if any  
  - Edge cases: Handles malformed or empty data gracefully  

---

#### 1.5 AI Analysis

**Overview:**  
Transforms the deduplicated reviews into a formatted text prompt with calculated statistics, sends the entire batch to GPT-4.1 for collective sentiment and thematic analysis, receiving structured JSON insights.

**Nodes Involved:**  
- Prepare Data for AI Analysis (Code)  
- AI Review Sentiment Analysis (OpenAI GPT-4.1)

**Node Details:**

- **Prepare Data for AI Analysis**  
  - Type: Code  
  - Role:  
    - Formats reviews into a human-readable concatenated string including author, date, rating, title, and text.  
    - Calculates average rating and distribution counts for each star level.  
    - Extracts unique source platforms and date range.  
    - Packages all info plus original reviews and summary into JSON for AI prompt.  
  - Outputs: JSON with `product`, `total_reviews`, `avg_rating`, `all_reviews_text`, `rating_distribution`, `sources`, `date_range`, `original_reviews`, `original_summary`  

- **AI Review Sentiment Analysis**  
  - Type: OpenAI GPT-4.1 via Langchain node  
  - Role: Sends prompt with full review text batch and metadata requesting JSON-only response containing: collective sentiment score and label, confidence, overall emotion, urgency, batch analysis (praises, complaints, critical issues, feature mentions, pricing sentiment, support quality), trend direction, recommended actions for product/sales/support teams, overall health, and churn risk.  
  - Configuration: Model gpt-4.1-2025-04-14, no additional options, prompt uses expressions to insert dynamic data.  
  - Outputs: AI generated JSON analysis to "Render Elegant Email Template"  
  - Failure modes: API call failure, rate limits, JSON parse errors handled downstream.  

---

#### 1.6 Report Rendering & Delivery

**Overview:**  
Parses AI JSON output, generates a responsive HTML email report with styled sentiment badges, statistics, sections for praises, complaints, critical issues, recommended actions, and sends this report automatically via Gmail OAuth2.

**Nodes Involved:**  
- Render Elegant Email Template (Code)  
- Send Executive Summary Email (Gmail)

**Node Details:**

- **Render Elegant Email Template**  
  - Type: Code  
  - Role:  
    - Parses raw AI JSON string response, fails workflow if missing or unparsable.  
    - Extracts summary metrics, sentiment labels, and colors.  
    - Builds a fully responsive, branded HTML email with CSS styles.  
    - Includes: product name, report date, sentiment badge, review stats, product health, churn risk, top praises, complaints, critical issues with severity badges, and recommended actions.  
  - Outputs: JSON with `email_html`, product info, and AI analysis object  

- **Send Executive Summary Email**  
  - Type: Gmail OAuth2 node  
  - Role: Sends email to fixed recipient (`nchoudhary110792@gmail.com`) with the generated HTML email as body, subject containing product name and current date.  
  - Credentials: Configured Gmail OAuth2 credentials  
  - Edge cases: Email sending failures, invalid credentials  

---

#### 1.7 Response Handling

**Overview:**  
For external webhook or form submissions, sends a JSON response containing the collected product name, summary stats, and all review data.

**Nodes Involved:**  
- Return Final Results (Respond to Webhook)

**Node Details:**

- **Return Final Results**  
  - Type: Respond to Webhook  
  - Role: Sends back a JSON response with the product name, summary statistics, and raw review data (deduplicated) for API consumers.  
  - Inputs: From "Prepare Data for AI Analysis"  
  - Outputs: HTTP response to webhook caller  
  - Edge cases: Only active for webhook-triggered executions  

---

### 3. Summary Table

| Node Name                         | Node Type                  | Functional Role                           | Input Node(s)                             | Output Node(s)                             | Sticky Note                                                                                                                    |
|----------------------------------|----------------------------|------------------------------------------|------------------------------------------|--------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| Manual Trigger                   | Manual Trigger             | Start trigger for manual execution       | None                                     | Prepare Review Sources                      | ### 🔄 STEP 1: Choose your input  • Manual Trigger → quick test with defaults  • Form Trigger → user-friendly UI  • Webhook → integrate with Zapier/Make/etc. |
| Webhook Trigger                 | Webhook                   | HTTP POST trigger for external calls     | None                                     | Prepare Review Sources                      | ### 🔄 STEP 1: Choose your input  • Manual Trigger → quick test with defaults  • Form Trigger → user-friendly UI  • Webhook → integrate with Zapier/Make/etc. |
| Form Trigger – Submit Sources   | Form Trigger              | Web form for user input of product URLs  | None                                     | Prepare Review Sources                      | ### 🔄 STEP 1: Choose your input  • Manual Trigger → quick test with defaults  • Form Trigger → user-friendly UI  • Webhook → integrate with Zapier/Make/etc. |
| Prepare Review Sources          | Code                      | Normalize inputs, reset global storage, create source list | Manual Trigger, Webhook Trigger, Form Trigger | Loop Through Sources (Rate Limit Safe)     | ### 🛠️ STEP 2: Build source list  Accepts Trustpilot domain, full URLs for Capterra/Chrome/TrustRadius, and Product Hunt slug → creates clean source objects. |
| Loop Through Sources (Rate Limit Safe) | SplitInBatches            | Iterate over each review source safely   | Prepare Review Sources                    | Deduplicate & Summarize All Reviews, Initialize Pagination | ### 🔄 STEP 3: Smart pagination loop (rate-limit safe)  • Handles all 5 sites differently  • Builds correct ?page= URLs  • Scrapes via Thordata (JS-rendered + proxy rotation)  • Stops when no more reviews on page  • 2-second polite delay between requests |
| Initialize Pagination           | Set                       | Set initial page number = 1              | Loop Through Sources                      | URL Builder                                | ### 🔄 STEP 3: Smart pagination loop (rate-limit safe)  • Handles all 5 sites differently  • Builds correct ?page= URLs  • Scrapes via Thordata (JS-rendered + proxy rotation)  • Stops when no more reviews on page  • 2-second polite delay between requests |
| URL Builder                    | Code                      | Build paginated target URL for scraping  | Initialize Pagination, Rate Limit Delay  | Scrape Page (Robust) via Thordata API      | ### 🔄 STEP 3: Smart pagination loop (rate-limit safe)  • Handles all 5 sites differently  • Builds correct ?page= URLs  • Scrapes via Thordata (JS-rendered + proxy rotation)  • Stops when no more reviews on page  • 2-second polite delay between requests |
| Scrape Page (Robust) via Thordata API | HTTP Request              | Fetch HTML content safely with JS rendering and proxy | URL Builder                              | Universal Safe Parser                      | ### 🔄 STEP 3: Smart pagination loop (rate-limit safe)  • Handles all 5 sites differently  • Builds correct ?page= URLs  • Scrapes via Thordata (JS-rendered + proxy rotation)  • Stops when no more reviews on page  • 2-second polite delay between requests |
| Universal Safe Parser           | Code                      | Parse HTML, extract and standardize reviews with unique IDs | Scrape Page (Robust)                     | Has More Pages?                            | ### 🧹 STEP 4: Global storage + deduplication  Collects reviews from every source & page → unique IDs prevent duplicates even if formatting changes. |
| Has More Pages?                 | IF                        | Determine if pagination should continue  | Universal Safe Parser                     | Increment Page Counter, Loop Through Sources | ### 🔄 STEP 3: Smart pagination loop (rate-limit safe)  • Handles all 5 sites differently  • Builds correct ?page= URLs  • Scrapes via Thordata (JS-rendered + proxy rotation)  • Stops when no more reviews on page  • 2-second polite delay between requests |
| Increment Page Counter          | Set                       | Increment page number for pagination      | Has More Pages? (true branch)             | Rate Limit Delay (2s)                      | ### 🔄 STEP 3: Smart pagination loop (rate-limit safe)  • Handles all 5 sites differently  • Builds correct ?page= URLs  • Scrapes via Thordata (JS-rendered + proxy rotation)  • Stops when no more reviews on page  • 2-second polite delay between requests |
| Rate Limit Delay (2s)           | Wait                      | Enforce 2-second delay between requests  | Increment Page Counter                     | URL Builder                                | ### 🔄 STEP 3: Smart pagination loop (rate-limit safe)  • Handles all 5 sites differently  • Builds correct ?page= URLs  • Scrapes via Thordata (JS-rendered + proxy rotation)  • Stops when no more reviews on page  • 2-second polite delay between requests |
| Deduplicate & Summarize All Reviews | Code                      | Aggregate all reviews from global storage, deduplicate, summarize | Loop Through Sources (false branch), Loop Through Sources (true branch) | Prepare Data for AI Analysis               | ### 🧹 STEP 4: Global storage + deduplication  Collects reviews from every source & page → unique IDs prevent duplicates even if formatting changes. |
| Prepare Data for AI Analysis    | Code                      | Format reviews and stats for AI prompt    | Deduplicate & Summarize All Reviews       | Return Final Results, AI Review Sentiment Analysis | ### 🤖 STEP 5: AI analysis & beautiful report  • All reviews sent together to GPT-4.1  • Structured insights + sentiment scoring  • Renders responsive HTML email  • Sends executive summary automatically |
| AI Review Sentiment Analysis   | OpenAI GPT-4.1 (Langchain) | Perform deep sentiment and thematic analysis on all reviews | Prepare Data for AI Analysis               | Render Elegant Email Template              | ### 🤖 STEP 5: AI analysis & beautiful report  • All reviews sent together to GPT-4.1  • Structured insights + sentiment scoring  • Renders responsive HTML email  • Sends executive summary automatically |
| Render Elegant Email Template   | Code                      | Parse AI JSON, generate responsive HTML email report | AI Review Sentiment Analysis               | Send Executive Summary Email               | ### 🤖 STEP 5: AI analysis & beautiful report  • All reviews sent together to GPT-4.1  • Structured insights + sentiment scoring  • Renders responsive HTML email  • Sends executive summary automatically |
| Send Executive Summary Email    | Gmail OAuth2              | Send the generated HTML report to fixed recipient | Render Elegant Email Template               | None                                       | ### 🤖 STEP 5: AI analysis & beautiful report  • All reviews sent together to GPT-4.1  • Structured insights + sentiment scoring  • Renders responsive HTML email  • Sends executive summary automatically |
| Return Final Results            | Respond to Webhook         | Return JSON response with summary and reviews | Prepare Data for AI Analysis               | None                                       |                                                                                                                               |
| Sticky Note                    | Sticky Note               | Overview and instructions for entire workflow | None                                     | None                                       | ## 🌟 Scrape & AI-Analyze Reviews from 5 Platforms in One Click  Automatically collect hundreds of customer reviews from Trustpilot, Capterra, Chrome Web Store, TrustRadius, and Product Hunt → deduplicate → let GPT-4.1 analyze sentiment, praises, complaints, churn risk, and give actionable recommendations → receive a beautiful executive email report.  ### Who’s it for  - Product managers & founders  - Growth/marketing teams  - Customer success & support leads  - Agencies delivering review reports  ### How it works  1. Submit product URLs (form, webhook or defaults)  2. Smart pagination + Cloudflare-safe scraping  3. Universal parser standardizes all reviews  4. AI collective analysis (not review-by-review)  5. Gorgeous HTML summary emailed automatically  ### Requirements  - Thordata API key (free tier OK) → HTTP Header Auth credential  - OpenAI API key  - Gmail (or swap for any email node)  ### How to set up  1. Add your Thordata key → create HTTP Header Auth credential  2. Add OpenAI credential  3. Connect Gmail  4. Test instantly with defaults (Thordata reviews)  ### Customize easily  - Change default product in “Prepare Review Sources”  - Edit AI prompt for different analysis style  - Tweak the email design in “Render Elegant Email Template”  Plug-and-play · No browser automation · Fully deduplicated · Rate-limit safe |
| Sticky Note1                   | Sticky Note               | Input method explanation                  | None                                     | None                                       | ### 🔄 STEP 1: Choose your input  • Manual Trigger → quick test with defaults  • Form Trigger → user-friendly UI  • Webhook → integrate with Zapier/Make/etc. |
| Sticky Note2                   | Sticky Note               | Source list preparation explanation       | None                                     | None                                       | ### 🛠️ STEP 2: Build source list  Accepts Trustpilot domain, full URLs for Capterra/Chrome/TrustRadius, and Product Hunt slug → creates clean source objects. |
| Sticky Note3                   | Sticky Note               | Pagination and scraping loop explanation  | None                                     | None                                       | ### 🔄 STEP 3: Smart pagination loop (rate-limit safe)  • Handles all 5 sites differently  • Builds correct ?page= URLs  • Scrapes via Thordata (JS-rendered + proxy rotation)  • Stops when no more reviews on page  • 2-second polite delay between requests |
| Sticky Note4                   | Sticky Note               | Deduplication explanation                  | None                                     | None                                       | ### 🧹 STEP 4: Global storage + deduplication  Collects reviews from every source & page → unique IDs prevent duplicates even if formatting changes. |
| Sticky Note5                   | Sticky Note               | AI analysis and report explanation         | None                                     | None                                       | ### 🤖 STEP 5: AI analysis & beautiful report  • All reviews sent together to GPT-4.1  • Structured insights + sentiment scoring  • Renders responsive HTML email  • Sends executive summary automatically |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Triggers:**  
   - Add a **Manual Trigger** node for quick tests.  
   - Add a **Webhook Trigger** node configured for POST requests on path `/c35353c9-a0e5-4f0a-86a4-cc5466bd83fd` with responseMode set to "responseNode".  
   - Add a **Form Trigger** node with path `/sources` and form fields: productName (required), domain, capterraUrl, chromeStoreUrl, trustRadius, producthunt.

2. **Prepare Review Sources (Code Node):**  
   - Create a Code node to:  
     - Reset global static data named `allScrapedReviews` to empty array.  
     - Read inputs from any trigger (manual/webhook/form).  
     - Normalize product and source URLs/domains/slugs for Trustpilot, Capterra, Chrome Web Store, TrustRadius, and Product Hunt.  
     - Build array of source objects containing `product_name`, `source_type`, and `source_url`.  
     - Output one JSON per source.

3. **Loop Through Sources (SplitInBatches):**  
   - Add a SplitInBatches node configured with default batch size = 1 to process one source at a time.

4. **Initialize Pagination (Set Node):**  
   - Add a Set node to add a field `page_number` initialized to 1 to each source item.

5. **URL Builder (Code Node):**  
   - Add a Code node that:  
     - Reads current `page_number`, `source_url`, and `source_type`.  
     - For page 1, returns base URL as `target_url`.  
     - For pages > 1, appends `?page=number` or `&page=number` as appropriate, except for Chrome Web Store which does not paginate traditionally (returns base URL).  
     - Outputs updated item with `target_url`.

6. **Scrape Page (HTTP Request Node):**  
   - Add an HTTP Request node:  
     - POST to `https://universalapi.thordata.com/request`.  
     - Content-Type: `application/x-www-form-urlencoded`  
     - Body parameters: `url = target_url`, `type=html`, `js_render=True`, `clean_content=css`.  
     - Add HTTP Header Auth credentials for Thordata proxy with your API key and proxy details.  
     - Timeout: 120 seconds.  
     - On error: continue workflow (do not fail).  

7. **Universal Safe Parser (Code Node):**  
   - Add a Code node implementing platform-specific parsers for Trustpilot, Capterra, Chrome Web Store, Product Hunt, TrustRadius.  
   - Detect source type from URL or HTML signature if unknown.  
   - Parse reviews extracting author, rating, title, text, date, verified, and other metadata.  
   - Standardize fields and generate unique deterministic IDs for deduplication.  
   - Append parsed reviews to global static storage field `allScrapedReviews`.  
   - Output parsed review data and metadata for the current page.

8. **Has More Pages? (IF Node):**  
   - Add an IF node to check:  
     - If reviews exist on this page (`$json.reviews.length > 0 || $json.review_count > 0`) AND source_type is not 'chromewebstore' or 'producthunt', then continue pagination.  
     - Else stop pagination for this source.

9. **Increment Page Counter (Set Node):**  
   - If continuing pagination, increment `page_number` by 1.

10. **Rate Limit Delay (Wait Node):**  
    - Add a Wait node for 2 seconds delay before fetching next page.

11. **Loop back:**  
    - Connect the output of Rate Limit Delay back to URL Builder to build next page URL and continue scraping.

12. **Deduplicate & Summarize All Reviews (Code Node):**  
    - After all sources/pages processed, add a Code node that:  
      - Reads `allScrapedReviews` global static data.  
      - Deduplicates reviews by `unique_id`.  
      - Compiles summary info including total unique reviews, sources attempted/failed, errors.  
      - Outputs deduplicated review array and summary.

13. **Prepare Data for AI Analysis (Code Node):**  
    - Format deduplicated reviews into a concatenated text string including author, rating, title, text.  
    - Calculate average rating, rating distribution, date range, and sources.  
    - Output JSON with all these fields plus original review array and summary.

14. **Return Final Results (Respond to Webhook Node):**  
    - Configure to send a JSON response containing product name, summary stats, and original review data, used only for webhook-triggered executions.

15. **AI Review Sentiment Analysis (OpenAI Node):**  
    - Add OpenAI GPT-4.1 node with your OpenAI API credentials.  
    - Configure model `gpt-4.1-2025-04-14`.  
    - Use a prompt that includes the formatted reviews, summary stats, and requests JSON-only sentiment and thematic analysis with specific fields described above.  
    - Output AI JSON for further processing.

16. **Render Elegant Email Template (Code Node):**  
    - Parse AI JSON output safely.  
    - Generate a responsive, styled HTML email report including:  
      - Product name and report date  
      - Sentiment badge colored by sentiment label  
      - Review stats (count, average rating)  
      - Product health and churn risk color-coded  
      - Sections for top praises, common complaints, critical issues with severity badges, and recommended actions.  
    - Output HTML and summary data.

17. **Send Executive Summary Email (Gmail Node):**  
    - Configure Gmail OAuth2 credentials.  
    - Send email to fixed recipient with subject: `{{product_name}} Review Analysis – {{current date}}`.  
    - Email body contains the generated HTML from previous node.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                  | Context or Link                                                                                      |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| This workflow collects customer reviews from 5 major platforms with safe scraping via Thordata API (including proxy rotation and JS rendering). It deduplicates reviews by unique deterministic IDs to handle formatting variations or re-scrapes. The AI analysis uses GPT-4.1 to provide structured sentiment scoring, theme extraction, churn risk assessment, and actionable insights. | Sticky Note overview node in workflow.                                                             |
| The Thordata API key is required with HTTP Header Auth credentials configured in n8n. The OpenAI API key must be connected via credential for GPT-4.1 calls. Gmail OAuth2 credentials are used to send the final email report.                                                                                                                                               | Sticky Note and node parameters.                                                                    |
| The AI prompt instructs GPT-4.1 to return ONLY JSON (no markdown) with a structure including sentiment, themes, critical issues, trend, recommended actions, and health metrics. The email template uses responsive design and brand colors.                                                                                                                                       | Review AI analysis and Render Email Template nodes.                                                |
| The workflow avoids browser automation by using Thordata API for scraping, which handles Cloudflare and JS rendering challenges safely. Pagination is handled with platform-specific logic and rate limiting with a 2-second delay between requests.                                                                                                                               | Sticky Notes and pagination code node.                                                             |
| To customize for other products, update the default values in “Prepare Review Sources” or submit different URLs via form or webhook. The AI prompt can be edited for different analysis styles, and the email design is fully modifiable in the template code node.                                                                                                               | Sticky Note and relevant code nodes.                                                               |
| For more information on setting up Thordata API keys and usage, refer to https://thordata.com/ and n8n credential docs.                                                                                                                                                                                                                                                     | External resource reference (implied).                                                             |

---

**Disclaimer:** The text and workflow details provided derive exclusively from an automated n8n workflow designed for legal and ethical data processing. The workflow complies with content policies and handles only publicly accessible data.