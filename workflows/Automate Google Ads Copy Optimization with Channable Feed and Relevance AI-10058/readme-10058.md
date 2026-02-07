Automate Google Ads Copy Optimization with Channable Feed and Relevance AI

https://n8nworkflows.xyz/workflows/automate-google-ads-copy-optimization-with-channable-feed-and-relevance-ai-10058


# Automate Google Ads Copy Optimization with Channable Feed and Relevance AI

### 1. Workflow Overview

This workflow automates the monthly optimization of Google Ads campaigns by integrating Google Ads performance data, Channable product feeds, and AI-driven insights from Relevance AI. Its primary use case is to continuously improve ad copy effectiveness based on empirical performance metrics and AI analysis, ultimately driving better CTR and conversions.

The workflow is logically organized into four main blocks:

- **1.1 Data Collection & Trigger**: Initiates monthly execution, fetches Google Ads performance data with GAQL, and calculates detailed performance metrics grouped by ad categories and creative themes.

- **1.2 AI Analysis & Knowledge Update**: Sends performance data to Relevance AI for advanced pattern analysis and actionable insights, updates the AI knowledge base with these insights, and retrieves the latest product feed from Channable.

- **1.3 Ad Copy Regeneration & Storage**: Processes product feeds in batches, triggers AI to regenerate ad copy using the updated performance insights, and saves the optimized ads to Google Sheets for review.

- **1.4 Reporting & Communication**: Generates a comprehensive performance report summarizing findings and AI insights, then distributes the report to the marketing team via Slack.

---

### 2. Block-by-Block Analysis

#### 1.1 Data Collection & Trigger

**Overview:**  
This block triggers the workflow monthly, collects Google Ads data using a GAQL query via HTTP, and processes it with custom JavaScript to compute performance metrics by category and theme.

**Nodes Involved:**  
- Monthly Schedule Trigger  
- Get Google Ads Performance Data  
- Calculate Performance Metrics

**Node Details:**

- **Monthly Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates workflow on the 1st day of each month at midnight, targeting a 30-day lookback period.  
  - Configuration: Cron expression `0 0 1 * *` for monthly trigger.  
  - Inputs: None (trigger node)  
  - Outputs: Triggers "Get Google Ads Performance Data"  
  - Edge cases: Incorrect timezone could cause off-schedule runs. Cron misconfiguration could stop trigger.

- **Get Google Ads Performance Data**  
  - Type: HTTP Request  
  - Role: Queries Google Ads API with GAQL to retrieve ads with >100 impressions and their metrics (impressions, clicks, CTR, conversions, cost).  
  - Configuration: POST request to Google Ads API endpoint using OAuth2 credentials; query limits to 10,000 results ordered by clicks descending.  
  - Inputs: Trigger from schedule node  
  - Outputs: JSON response with Google Ads data to "Calculate Performance Metrics"  
  - Edge cases: API rate limits, expired OAuth tokens, network timeouts (configured 60s timeout), malformed query could cause errors.

- **Calculate Performance Metrics**  
  - Type: Code (JavaScript)  
  - Role: Parses GAQL results, groups ads by ad group (category) and headline themes, calculates averages (CTR, conversion rate, CPC), identifies top and bottom 20% performers.  
  - Configuration: Custom JS code analyzing impressions, clicks, conversions, costs; themes include "vegan", "organic", "natural", etc.  
  - Expressions: Accesses `$input.all()`, `$json` properties, performs arithmetic and string operations.  
  - Inputs: Output from Google Ads HTTP request  
  - Outputs: JSON object with overall metrics, category and theme performance, and top/bottom performers arrays to AI Performance Analysis node.  
  - Edge cases: Empty or malformed GAQL data, division by zero when clicks=0, missing fields in ads data.

---

#### 1.2 AI Analysis & Knowledge Update

**Overview:**  
This block sends the computed metrics to Relevance AI for pattern analysis, updates the AI knowledge base with insights, and fetches the latest Channable product feed for ad regeneration.

**Nodes Involved:**  
- AI Performance Analysis  
- Update Knowledge Base  
- Get Updated Product Feed

**Node Details:**

- **AI Performance Analysis**  
  - Type: HTTP Request  
  - Role: Sends metrics data to Relevance AI’s `/agents/trigger` API endpoint with specified agent_id; receives AI-generated insights such as comparative CTR improvements by theme.  
  - Configuration: POST with JSON body containing user role and performance data stringified. Uses HTTP header authentication with token. Timeout set to 90s.  
  - Inputs: Data from "Calculate Performance Metrics"  
  - Outputs: AI insights forwarded to "Update Knowledge Base"  
  - Edge cases: API authentication failure, timeout, malformed input JSON, invalid agent_id environment variable.

- **Update Knowledge Base**  
  - Type: HTTP Request  
  - Role: Updates Relevance AI knowledge source with new insights, update timestamp, and top performing themes for future ad generation.  
  - Configuration: POST request with JSON body including `insights`, `updated_at` timestamp, and `top_themes` extracted from previous metrics node. Uses same HTTP header auth.  
  - Inputs: AI insights from previous node  
  - Outputs: Triggers "Get Updated Product Feed"  
  - Edge cases: Invalid knowledge source ID, network failure, data formatting errors.

- **Get Updated Product Feed**  
  - Type: HTTP Request  
  - Role: Retrieves latest product feed from Channable API to use for ad copy regeneration.  
  - Configuration: GET request to Channable feed endpoint with company, project, and feed IDs from environment variables. Uses HTTP header authentication.  
  - Inputs: Trigger from knowledge base update  
  - Outputs: Product feed JSON to "Split Into Batches"  
  - Edge cases: API failures, expired auth token, empty or malformed feed data.

---

#### 1.3 Ad Copy Regeneration & Storage

**Overview:**  
This block splits the product feed into manageable batches, regenerates ad copy for each product using Relevance AI’s tool with performance insights, and saves the optimized ads in Google Sheets for review.

**Nodes Involved:**  
- Split Into Batches  
- Regenerate Ad Copy with Insights  
- Save Optimized Ads to Sheets

**Node Details:**

- **Split Into Batches**  
  - Type: SplitInBatches  
  - Role: Processes Channable product feed in batches of 50 products to avoid overload and improve efficiency.  
  - Configuration: Batch size set to 50, default options.  
  - Inputs: Product feed JSON from Channable  
  - Outputs: Each batch sent sequentially to ad regeneration node  
  - Edge cases: Large feed sizes could increase runtime; improper batch size could cause memory issues.

- **Regenerate Ad Copy with Insights**  
  - Type: HTTP Request  
  - Role: Calls Relevance AI `/tools/{tool_id}/trigger` endpoint to generate new ad copy using product details and performance insights.  
  - Configuration: POST request including product title, description, price, category, brand, and flag to use performance insights; uses HTTP header auth with timeout 60s.  
  - Inputs: Batched product data from Split Into Batches  
  - Outputs: Optimized ad copy JSON to Google Sheets node  
  - Edge cases: API rate limits, malformed product data, missing environment variables for tool ID.

- **Save Optimized Ads to Sheets**  
  - Type: Google Sheets  
  - Role: Writes regenerated ad copies into a specified Google Sheet ("Optimized Ads" tab) for manual QA and approval.  
  - Configuration: Uses Google Sheets OAuth2 credentials, targets sheet by environment variable document ID, and named sheet.  
  - Inputs: Optimized ads JSON output from AI tool  
  - Outputs: Triggers report generation node  
  - Edge cases: Google Sheets API quota limits, authentication expiry, sheet name or ID misconfiguration.

---

#### 1.4 Reporting & Communication

**Overview:**  
Generates a detailed performance report with AI insights and theme statistics, then distributes this report to the marketing team via Slack messaging.

**Nodes Involved:**  
- Generate Performance Report  
- Email Performance Report

**Node Details:**

- **Generate Performance Report**  
  - Type: Code (JavaScript)  
  - Role: Constructs a formatted report summarizing the month’s ad performance, top/bottom performing themes, AI insights, and next scheduled optimization date. Outputs both text and HTML versions.  
  - Configuration: Accesses JSON data from AI analysis and metrics nodes; formats strings with dates, counts, and lists.  
  - Inputs: Output from "Save Optimized Ads to Sheets" (indirectly from AI Performance Analysis and Metrics nodes)  
  - Outputs: Structured report JSON to Slack node  
  - Edge cases: Missing or incomplete data could generate partial reports; date formatting errors.

- **Email Performance Report**  
  - Type: Slack (configured as message sender)  
  - Role: Sends the generated performance report text as a Slack message to the marketing team’s channel or user.  
  - Configuration: Uses Slack webhook with configured webhook ID; message content from report node.  
  - Inputs: Report JSON from previous node  
  - Outputs: None (terminal node)  
  - Edge cases: Slack webhook invalid or revoked, network issues, message formatting issues.

---

### 3. Summary Table

| Node Name                     | Node Type          | Functional Role                                             | Input Node(s)                   | Output Node(s)                       | Sticky Note                                                                                                            |
|-------------------------------|--------------------|-------------------------------------------------------------|--------------------------------|------------------------------------|------------------------------------------------------------------------------------------------------------------------|
| Monthly Schedule Trigger       | Schedule Trigger   | Monthly workflow trigger on 1st at midnight                 | None                           | Get Google Ads Performance Data    | Runs automatically on the 1st of each month at midnight to review the past 30 days.                                    |
| Get Google Ads Performance Data| HTTP Request       | Retrieves Google Ads data with GAQL query                    | Monthly Schedule Trigger       | Calculate Performance Metrics      | Retrieves Google Ads data using GAQL via the API — includes impressions, clicks, CTR, conversions, and costs.          |
| Calculate Performance Metrics  | Code (JavaScript)  | Processes raw data to calculate CTR, conversion rates, etc. | Get Google Ads Performance Data| AI Performance Analysis            | Processes raw data to compute performance metrics (CTR, conversion rate, CPC). Groups results by ad category and theme.|
| AI Performance Analysis        | HTTP Request       | Sends data to Relevance AI agent for insights               | Calculate Performance Metrics  | Update Knowledge Base              | Uses Relevance AI’s `/agents/trigger` endpoint to analyze metrics and extract actionable insights.                      |
| Update Knowledge Base          | HTTP Request       | Updates AI knowledge base with new insights                  | AI Performance Analysis        | Get Updated Product Feed           | Feeds AI-generated insights back into your Relevance AI knowledge base for future ad optimization cycles.              |
| Get Updated Product Feed       | HTTP Request       | Retrieves latest product feed from Channable                 | Update Knowledge Base          | Split Into Batches                 | Retrieves the latest Channable product feed to prepare updated ads using the new performance insights.                 |
| Split Into Batches             | SplitInBatches     | Splits product feed into batches of 50                        | Get Updated Product Feed       | Regenerate Ad Copy with Insights  | Splits the product feed into batches of 50 to optimize efficiently.                                                    |
| Regenerate Ad Copy with Insights| HTTP Request      | Regenerates ad copy using AI with performance insights       | Split Into Batches             | Save Optimized Ads to Sheets       | Uses Relevance AI `/tools/{id}/trigger` to rewrite ad copy for each product, incorporating fresh performance data.     |
| Save Optimized Ads to Sheets   | Google Sheets      | Saves optimized ads to Google Sheets                          | Regenerate Ad Copy with Insights| Generate Performance Report      | Saves optimized ads to Google Sheets for review before publishing.                                                     |
| Generate Performance Report    | Code (JavaScript)  | Generates detailed monthly performance report                 | Save Optimized Ads to Sheets   | Email Performance Report           | Generates a comprehensive monthly performance report summarizing top/bottom themes, CTR trends, and AI recommendations.|
| Email Performance Report       | Slack              | Sends performance report to marketing team                   | Generate Performance Report    | None                             | Sends performance report to team.                                                                                      |
| Sticky Note                   | Sticky Note        | Documentation and annotations                                | None                           | None                             | # 🧠 Google Ads Monthly Optimization (Channable + Google Ads + Relevance AI) Automates your monthly Google Ads optimization using Relevance AI and Channable. Analyzes ad performance, identifies top/bottom performers, generates AI insights, and refreshes ad copies with data-driven improvements. |
| Sticky Note1                  | Sticky Note        | Documentation of Stage 1                                      | None                           | None                             | ## 🟨 Stage 1 — Data Collection & Trigger: Monthly Schedule Trigger, Get Google Ads Performance Data, Calculate Performance Metrics |
| Sticky Note2                  | Sticky Note        | Documentation of Stage 2                                      | None                           | None                             | ## 🟨 Stage 2 — AI Analysis & Knowledge Update: AI Performance Analysis, Update Knowledge Base, Get Updated Product Feed |
| Sticky Note3                  | Sticky Note        | Documentation of Stage 3                                      | None                           | None                             | ## 🟨 Stage 3 — Ad Copy Regeneration & Storage: Split Into Batches, Regenerate Ad Copy with Insights, Save Optimized Ads to Sheets |
| Sticky Note4                  | Sticky Note        | Documentation of Stage 4                                      | None                           | None                             | ## 🟨 Stage 4 — Reporting & Communication: Generate Performance Report, Email Performance Report |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "Monthly Schedule Trigger" node**  
   - Type: Schedule Trigger  
   - Set Cron Expression: `0 0 1 * *` (midnight on the 1st day of each month)  
   - No credentials required  

2. **Create "Get Google Ads Performance Data" node**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://googleads.googleapis.com/{{$env.GOOGLE_ADS_API_VERSION}}/customers/{{$env.GOOGLE_ADS_CUSTOMER_ID}}/googleAds:search`  
   - Body Type: JSON  
   - JSON Body:  
     ```json
     {
       "query": "SELECT ad_group_ad.ad.id, ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.ad.responsive_search_ad.descriptions, ad_group.name, campaign.name, metrics.impressions, metrics.clicks, metrics.ctr, metrics.conversions, metrics.cost_micros FROM ad_group_ad WHERE segments.date DURING LAST_30_DAYS AND metrics.impressions > 100 ORDER BY metrics.clicks DESC LIMIT 10000"
     }
     ```  
   - Authentication: Google Ads OAuth2 (configure with Google Ads account credentials)  
   - Timeout: 60000 ms (60 seconds)  

3. **Connect "Monthly Schedule Trigger" → "Get Google Ads Performance Data"**

4. **Create "Calculate Performance Metrics" node**  
   - Type: Code (JavaScript)  
   - Paste provided JavaScript code to parse GAQL results and calculate metrics grouped by ad group and themes  
   - Handle edge cases for zero impressions or missing data  
   - Connect input from "Get Google Ads Performance Data"  

5. **Create "AI Performance Analysis" node**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `{{$env.RELEVANCE_AI_API_URL}}/agents/trigger`  
   - JSON Body:  
     ```json
     {
       "message": {
         "role": "user",
         "content": "Analyze this performance data and provide actionable insights. Data: {{$json}}"
       },
       "agent_id": "{{$env.RELEVANCE_AGENT_PERFORMANCE_ID}}"
     }
     ```  
   - Authentication: HTTP Header Auth (set up with Relevance AI token)  
   - Timeout: 90000 ms (90 seconds)  
   - Connect input from "Calculate Performance Metrics"  

6. **Create "Update Knowledge Base" node**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `{{$env.RELEVANCE_AI_API_URL}}/knowledge/{{$env.RELEVANCE_KNOWLEDGE_SOURCE_ID}}/update`  
   - JSON Body with insights from AI Performance Analysis and top themes from "Calculate Performance Metrics" node, plus current timestamp  
   - Authentication: HTTP Header Auth (same as above)  
   - Connect input from "AI Performance Analysis"  

7. **Create "Get Updated Product Feed" node**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `{{$env.CHANNABLE_API_URL}}/companies/{{$env.CHANNABLE_COMPANY_ID}}/projects/{{$env.CHANNABLE_PROJECT_ID}}/feeds/{{$env.FEED_ID}}`  
   - Authentication: HTTP Header Auth (Channable credentials)  
   - Connect input from "Update Knowledge Base"  

8. **Create "Split Into Batches" node**  
   - Type: SplitInBatches  
   - Batch Size: 50  
   - Connect input from "Get Updated Product Feed"  

9. **Create "Regenerate Ad Copy with Insights" node**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `{{$env.RELEVANCE_AI_API_URL}}/tools/{{$env.RELEVANCE_TOOL_AD_COPY_ID}}/trigger`  
   - JSON Body:  
     ```json
     {
       "params": {
         "product_title": "{{$json.title}}",
         "product_description": "{{$json.description}}",
         "price": "{{$json.price}}",
         "category": "{{$json.category}}",
         "brand": "{{$json.brand}}",
         "use_performance_insights": true
       }
     }
     ```  
   - Authentication: HTTP Header Auth (Relevance AI token)  
   - Timeout: 60000 ms (60 seconds)  
   - Connect input from "Split Into Batches"  

10. **Create "Save Optimized Ads to Sheets" node**  
    - Type: Google Sheets  
    - Operation: Append or Update rows  
    - Document ID: set from environment variable `GOOGLE_SHEET_ID`  
    - Sheet Name: "Optimized Ads"  
    - Authentication: Google Sheets OAuth2 credentials  
    - Connect input from "Regenerate Ad Copy with Insights"  

11. **Create "Generate Performance Report" node**  
    - Type: Code (JavaScript)  
    - Use provided code to generate a text and HTML report using data from "AI Performance Analysis" and "Calculate Performance Metrics"  
    - Connect input from "Save Optimized Ads to Sheets"  

12. **Create "Email Performance Report" node**  
    - Type: Slack (Message)  
    - Configure webhook ID for Slack channel  
    - Message Text: set to `{{$json.report_text}}` from previous node  
    - Connect input from "Generate Performance Report"  

13. **Verify all connections as per above sequence**

14. **Set all required environment variables:**

| Variable Name                  | Purpose                                   |
|-------------------------------|-------------------------------------------|
| GOOGLE_ADS_API_VERSION         | Google Ads API version, e.g., "v13"      |
| GOOGLE_ADS_CUSTOMER_ID         | Google Ads customer ID                     |
| RELEVANCE_AI_API_URL           | Base URL for Relevance AI API              |
| RELEVANCE_AGENT_PERFORMANCE_ID | Agent ID for performance analysis agent   |
| RELEVANCE_KNOWLEDGE_SOURCE_ID  | Knowledge source ID for updating insights |
| CHANNABLE_API_URL              | Base URL for Channable API                  |
| CHANNABLE_COMPANY_ID           | Channable company ID                        |
| CHANNABLE_PROJECT_ID           | Channable project ID                        |
| FEED_ID                       | Channable feed ID                           |
| RELEVANCE_TOOL_AD_COPY_ID      | Tool ID for ad copy regeneration            |
| GOOGLE_SHEET_ID                | Google Sheet document ID                    |

15. **Configure credentials properly:**

- Google Ads OAuth2 with required scopes for Ads API access  
- HTTP Header Auth for Relevance AI and Channable APIs with valid tokens  
- Google Sheets OAuth2 with edit permissions  

---

### 5. General Notes & Resources

| Note Content                                                                                                                          | Context or Link                                                                                      |
|----------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Workflow automates monthly Google Ads optimization using Relevance AI and Channable, enhancing ad copy and performance insights.       | Core project description from Sticky Note at workflow start                                         |
| Uses GAQL query in HTTP Request node instead of native Google Ads node for more flexible and comprehensive data retrieval.              | Sticky Note1 and node comment in "Get Google Ads Performance Data"                                 |
| AI insights example: "Vegan messaging +23% CTR vs natural" to guide ad copy improvements.                                                | Node comment in AI Performance Analysis node                                                       |
| Saves optimized ads to Google Sheets for manual review before publishing, enabling quality assurance.                                  | Node comment in Save Optimized Ads to Sheets                                                       |
| Performance report includes executive summary, top/bottom themes, AI insights, and next optimization schedule; sent via Slack.        | Sticky Note4 and report generation node comments                                                  |
| Environment variables centralize configuration for API URLs, IDs, and credentials, facilitating secure and flexible deployment.        | Workflow-wide convention                                                                             |

---

This completes the detailed structured reference for the "Automate Google Ads Copy Optimization with Channable Feed and Relevance AI" n8n workflow. It provides clarity on each node’s role, configuration, dependencies, and considerations for robust deployment and maintenance.