Automate Weekly SEO Report with GPT-4 Insights and Slack Delivery

https://n8nworkflows.xyz/workflows/automate-weekly-seo-report-with-gpt-4-insights-and-slack-delivery-5891


# Automate Weekly SEO Report with GPT-4 Insights and Slack Delivery

### 1. Workflow Overview

This workflow automates the generation of a weekly SEO report by extracting Google Search Console data, analyzing it with AI insights (GPT-4), formatting the results into a professional PDF report, and delivering it to a Slack channel. It is designed for SEO professionals and digital marketers who want automated, data-driven performance summaries and actionable insights without manual data crunching.

The workflow is logically divided into the following blocks:

- **1.1 Scheduling & Configuration:** Triggers the workflow weekly and sets the parameters (site URL, date ranges).
- **1.2 Data Retrieval:** Queries Google Search Console for various metrics (overview, queries, pages, devices, countries) for the current and previous months.
- **1.3 Data Processing & Formatting:** Splits and reformats raw API responses into structured data sets for analysis.
- **1.4 Data Aggregation & Analysis:** Combines all formatted data into a single structured report object, including comparative metrics.
- **1.5 AI Insight Generation:** Uses GPT-4 via LangChain to produce a concise, actionable SEO insights paragraph based on the report data.
- **1.6 Report Generation & Delivery:** Generates a PDF report using pdforge with a predefined SEO report template, downloads it, and sends it via Slack.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduling & Configuration

- **Overview:** Defines when the workflow runs and sets configuration variables such as site URL and date ranges for data queries.
- **Nodes Involved:**  
  - Weekly at monday 8am  
  - Configuration  
  - Sticky Note1  

- **Node Details:**

  - **Weekly at monday 8am**  
    - Type: Schedule Trigger  
    - Configured to trigger weekly on Mondays at 8 AM.  
    - Output connects to Configuration node.  
    - Failure modes: Trigger misconfiguration, time zone issues.

  - **Configuration**  
    - Type: Set  
    - Sets static and dynamic variables:  
      - `site_url` (Google Search Console site identifier)  
      - `date_start` (start of current month minus one month)  
      - `date_end` (today’s date)  
      - `date_prev_month_start` and `date_prev_month_end` (date range for previous month)  
    - Uses expressions with `$now` to calculate dates dynamically.  
    - Outputs to multiple HTTP Request nodes for data retrieval.  
    - Failure modes: Expression evaluation errors, incorrect site URL.

  - **Sticky Note1**  
    - Provides user instructions to configure site URL and date range.  
    - No connections.

#### 2.2 Data Retrieval

- **Overview:** Queries Google Search Console API for multiple datasets covering current and previous months: overview metrics, queries, pages, devices, countries.
- **Nodes Involved:**  
  - Multiple HTTP Request nodes (9 total):  
    - HTTP Request - Google Search Console - Overview  
    - HTTP Request - Google Search Console - Overview - Previous Month  
    - HTTP Request - Google Search Console - Query  
    - HTTP Request - Google Search Console - Query - Previous Month  
    - HTTP Request - Google Search Console - Page  
    - HTTP Request - Google Search Console - Page - Previous month  
    - HTTP Request - Google Search Console - Device  
    - HTTP Request - Google Search Console - Country  
    - HTTP Request - Google Search Console - Date  
  - HTTP Request - Google Search Console - List SiteUrls I'm Responsable (optional helper)  
  - Sticky Note2 (Google OAuth2 setup instructions)  
  - Sticky Note3 (siteUrl troubleshooting tip)

- **Node Details:**

  - Each HTTP Request node:  
    - Type: HTTP Request  
    - Method: POST  
    - URL: Constructed dynamically with `site_url` for Search Console API `searchAnalytics/query` endpoint.  
    - Body: JSON with `startDate`, `endDate`, and dimension filters (e.g., query, page, device, country, date).  
    - Authentication: OAuth2 with Google credentials (configured externally).  
    - On error: Continue workflow (graceful degradation).  
    - Outputs raw JSON responses with metrics and rows.  
    - Failure modes: OAuth token expiry, API quota limits, malformed requests, network errors.  
    - The “List SiteUrls” node helps identify accessible site URLs, useful for initial configuration.

#### 2.3 Data Processing & Formatting

- **Overview:** Processes raw Search Console API data by splitting rows and formatting each item into a consistent structure with relevant fields for reporting.
- **Nodes Involved:**  
  - Multiple Split Out nodes (one per dataset):  
    - Split Out Overview, Split Out Overview - Previous month  
    - Split Out Query, Split Out Query - Previous month  
    - Split Out Page, Split Out Page - Previous month  
    - Split Out Devices  
    - Split Out Country  
    - Split Out Date  
  - Multiple Set nodes formatting each split item:  
    - Format Overview, Format Overview - Previous month  
    - Format Query, Format Query - Previous month  
    - Format Page, Format Page - Previous month  
    - Format Devices  
    - Format Country  
    - Format Date  
  - Merge node (combines formatted datasets)

- **Node Details:**

  - **Split Out nodes:**  
    - Type: Split Out  
    - Splits the field `rows` arrays from the HTTP responses into separate items for granular processing.  
    - Outputs to corresponding Format nodes.  
    - Failure modes: Empty or missing `rows` fields.

  - **Format nodes:**  
    - Type: Set  
    - Extract specific fields (e.g., clicks, impressions, ctr, position) and rename keys for clarity.  
    - Use expressions like `{{$json.keys[0]}}` to extract dimension keys (e.g., query, page, device).  
    - Output uniform JSON objects for downstream aggregation.  
    - Failure modes: Missing fields or unexpected data structure.

  - **Merge node:**  
    - Type: Merge  
    - Consolidates all formatted data streams into one output for aggregation.  
    - Configured with 9 inputs (one per dataset).  
    - Failure modes: Mismatched input counts, node execution order issues.

#### 2.4 Data Aggregation & Analysis

- **Overview:** Aggregates all formatted data into a single comprehensive report object, computing comparative metrics and generating structured data for the SEO report.
- **Nodes Involved:**  
  - Format data (Code node)  
  - Sticky Note (Welcome and workflow explanation)  

- **Node Details:**

  - **Format data:**  
    - Type: Code (JavaScript)  
    - Runs once per workflow execution (`executeOnce: false` but processes merged input).  
    - Reads all formatted datasets from previous nodes.  
    - Creates helper functions for percentage and number comparisons with arrows and color-coded HTML subtitles.  
    - Strips URL to path only for cleaner display.  
    - Calculates:  
      - Overview metrics with month-over-month comparisons  
      - Performance trend arrays by date  
      - Top 10 countries and devices by clicks  
      - Organic keywords rankings grouped by position brackets with comparisons to previous month  
      - Top 5 pages and keywords sorted by clicks  
      - Pages with biggest traffic loss versus previous month  
      - Top 5 new keywords not present last month  
    - Outputs a single JSON object with all these fields, ready for report generation.  
    - Failure modes: JavaScript errors, missing data arrays, undefined values.

  - **Sticky Note (Welcome):**  
    - Explains overall workflow logic, required credentials, and contact info for support.

#### 2.5 AI Insight Generation

- **Overview:** Generates a concise, actionable SEO insights paragraph from the aggregated report data using GPT-4 via LangChain.
- **Nodes Involved:**  
  - Generating Insights for SEO Results  
  - OpenAI Chat Model  

- **Node Details:**

  - **OpenAI Chat Model:**  
    - Type: LangChain OpenAI Chat Model  
    - Model: GPT-4.1  
    - Credentials: OpenAI API key  
    - Connected as an AI language model input to "Generating Insights" node.  
    - Failure modes: API rate limits, authentication failure, network issues.

  - **Generating Insights for SEO Results:**  
    - Type: LangChain Agent  
    - Receives JSON stringified report data as input text.  
    - System prompt instructs the AI to:  
      - Analyze structured Search Console metrics and prior period comparisons.  
      - Output a single 300-400 character paragraph summarizing key trends and actionable recommendations.  
      - Use professional idiomatic English, no JSON or bullet points.  
    - Outputs plain text insight.  
    - Connected to "Generate variables" node for further processing.  
    - Failure modes: AI output format errors, timeout, incomplete input data.

#### 2.6 Report Generation & Delivery

- **Overview:** Transforms the enriched data and AI insight into a PDF report via pdforge, downloads the file, and sends it as a Slack message with the PDF attached.
- **Nodes Involved:**  
  - Generate variables  
  - Pdforge  
  - Download Binary  
  - Slack - Send Message with File  

- **Node Details:**

  - **Generate variables:**  
    - Type: Code  
    - Combines the formatted data with AI-generated insight (`insights_content`), preparing final variables for report generation.  
    - Returns a merged JSON object.  
    - Output feeds into Pdforge node.  
    - Failure modes: Data mapping errors.

  - **Pdforge:**  
    - Type: pdforge node (PDF generation service)  
    - Uses pre-made SEO report template identified by `template_seo_report`.  
    - Accepts report variables as JSON string.  
    - Requires pdforge API credentials.  
    - Outputs signed URL for the generated PDF.  
    - Failure modes: API connectivity, template errors, credential issues.

  - **Download Binary:**  
    - Type: HTTP Request  
    - Fetches the PDF file from the signed URL returned by Pdforge.  
    - Outputs binary file data for Slack upload.  
    - Failure modes: URL expiration, download failure.

  - **Slack - Send Message with File:**  
    - Type: Slack node  
    - Sends a message with the PDF file attached to a specified Slack channel.  
    - Uses OAuth2 Slack credentials.  
    - Message includes a comment and dynamic filename with report date.  
    - Failure modes: Slack API limits, authentication failure, channel permission issues.

---

### 3. Summary Table

| Node Name                                           | Node Type                | Functional Role                                | Input Node(s)                                      | Output Node(s)                          | Sticky Note                                                                                                                   |
|-----------------------------------------------------|--------------------------|-----------------------------------------------|----------------------------------------------------|---------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| Weekly at monday 8am                                | Schedule Trigger         | Triggers workflow weekly                       | -                                                  | Configuration                         |                                                                                                                              |
| Configuration                                       | Set                      | Sets site URL and date ranges                  | Weekly at monday 8am                               | Multiple HTTP Requests                | "Here you'll configure: Site URL, Date range"                                                                                 |
| Sticky Note1                                       | Sticky Note              | Instruction for config parameters              | -                                                  | -                                     | "Here you'll configure: Site URL, Date range"                                                                                 |
| HTTP Request - Google Search Console - Overview    | HTTP Request             | Fetch current month overview metrics           | Configuration                                       | Split Out Overview                    |                                                                                                                              |
| HTTP Request - Google Search Console - Overview - Previous Month | HTTP Request             | Fetch previous month overview metrics          | Configuration                                       | Split Out Overview - Previous month   |                                                                                                                              |
| HTTP Request - Google Search Console - Query       | HTTP Request             | Fetch current month query metrics               | Configuration                                       | Split Out Query                      |                                                                                                                              |
| HTTP Request - Google Search Console - Query - Previous Month | HTTP Request             | Fetch previous month query metrics             | Configuration                                       | Split Out Query - Previous month      |                                                                                                                              |
| HTTP Request - Google Search Console - Page        | HTTP Request             | Fetch current month page metrics                | Configuration                                       | Split Out Pages                      |                                                                                                                              |
| HTTP Request - Google Search Console - Page - Previous month | HTTP Request             | Fetch previous month page metrics               | Configuration                                       | Split Out Pages - Previous month      |                                                                                                                              |
| HTTP Request - Google Search Console - Device      | HTTP Request             | Fetch current month device metrics              | Configuration                                       | Split Out Devices                    |                                                                                                                              |
| HTTP Request - Google Search Console - Country     | HTTP Request             | Fetch current month country metrics             | Configuration                                       | Split Out Country                   |                                                                                                                              |
| HTTP Request - Google Search Console - Date        | HTTP Request             | Fetch current month daily metrics                | Configuration                                       | Split Out Date                      |                                                                                                                              |
| HTTP Request - Google Search Console - List SiteUrls I'm Responsable | HTTP Request             | Helper: list accessible site URLs               | -                                                  | -                                     | "If you're unsure of your siteUrl, use this node to check the list of siteUrls your user have access"                         |
| Split Out Overview                                 | Split Out                | Split overview rows into individual items       | HTTP Request - Google Search Console - Overview    | Format Overview                     |                                                                                                                              |
| Split Out Overview - Previous month                | Split Out                | Split previous month overview rows              | HTTP Request - Google Search Console - Overview - Previous Month | Format Overview - Previous month     |                                                                                                                              |
| Split Out Query                                    | Split Out                | Split query rows into individual items          | HTTP Request - Google Search Console - Query       | Format Query                       |                                                                                                                              |
| Split Out Query - Previous month                   | Split Out                | Split previous month query rows                  | HTTP Request - Google Search Console - Query - Previous Month | Format Query - Previous month        |                                                                                                                              |
| Split Out Pages                                   | Split Out                | Split page rows into individual items           | HTTP Request - Google Search Console - Page        | Format Page                        |                                                                                                                              |
| Split Out Pages - Previous month                   | Split Out                | Split previous month page rows                   | HTTP Request - Google Search Console - Page - Previous month | Format Page - Previous month         |                                                                                                                              |
| Split Out Devices                                 | Split Out                | Split device rows into individual items         | HTTP Request - Google Search Console - Device      | Format Devices                    |                                                                                                                              |
| Split Out Country                                | Split Out                | Split country rows into individual items        | HTTP Request - Google Search Console - Country     | Format Country                   |                                                                                                                              |
| Split Out Date                                    | Split Out                | Split date rows into individual items           | HTTP Request - Google Search Console - Date        | Format Date                      |                                                                                                                              |
| Format Overview                                   | Set                      | Format current month overview data               | Split Out Overview                                  | Merge                            |                                                                                                                              |
| Format Overview - Previous month                  | Set                      | Format previous month overview data              | Split Out Overview - Previous month                 | Merge                            |                                                                                                                              |
| Format Query                                      | Set                      | Format current month query data                   | Split Out Query                                    | Merge                            |                                                                                                                              |
| Format Query - Previous month                     | Set                      | Format previous month query data                  | Split Out Query - Previous month                     | Merge                            |                                                                                                                              |
| Format Page                                       | Set                      | Format current month page data                    | Split Out Pages                                    | Merge                            |                                                                                                                              |
| Format Page - Previous month                      | Set                      | Format previous month page data                   | Split Out Pages - Previous month                     | Merge                            |                                                                                                                              |
| Format Devices                                    | Set                      | Format device data                                | Split Out Devices                                  | Merge                            |                                                                                                                              |
| Format Country                                   | Set                      | Format country data                               | Split Out Country                                  | Merge                            |                                                                                                                              |
| Format Date                                      | Set                      | Format date-dimension data                         | Split Out Date                                    | Merge                            |                                                                                                                              |
| Merge                                            | Merge                    | Combine all formatted datasets                     | Multiple Format nodes                               | Format data                      |                                                                                                                              |
| Format data                                      | Code                     | Aggregate and analyze all formatted data into report object | Merge                                            | Generating Insights for SEO Results |                                                                                                                              |
| Generating Insights for SEO Results              | LangChain Agent          | Generate concise AI SEO insights paragraph        | Format data                                        | Generate variables              |                                                                                                                              |
| OpenAI Chat Model                                | LangChain OpenAI Model   | AI language model (GPT-4) for insight generation | Input to Generating Insights for SEO Results       | -                             |                                                                                                                              |
| Generate variables                               | Code                     | Merge AI insights with report data for PDF generation | Generating Insights for SEO Results               | Pdforge                         |                                                                                                                              |
| Pdforge                                          | pdforge Node             | Generate PDF report from template and data         | Generate variables                                | Download Binary                |                                                                                                                              |
| Download Binary                                  | HTTP Request             | Download generated PDF file                         | Pdforge                                           | Slack - Send Message with File |                                                                                                                              |
| Slack - Send Message with File                   | Slack Node               | Send PDF report as Slack message with file attachment | Download Binary                                   | -                             | "You can change it to send an e-mail, whatsapp or telegram message"                                                           |
| Sticky Note                                       | Sticky Note              | Workflow welcome and summary information            | -                                                  | -                             | Contains links and requirements for Google OAuth2, pdforge, AI API, Slack connection; LinkedIn contact link included.         |
| Sticky Note2                                      | Sticky Note              | Instructions for Google OAuth2 setup                 | -                                                  | -                             | Detailed step-by-step guide on configuring Google Search Console OAuth2 credentials and n8n OAuth2 setup with links.           |
| Sticky Note3                                      | Sticky Note              | Tip to find siteUrl if unsure                         | -                                                  | -                             | Suggests using the “List SiteUrls I’m Responsable” node to check accessible site URLs.                                         |

---

### 4. Reproducing the Workflow from Scratch

To rebuild this workflow in n8n, follow these steps:

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set to trigger weekly on Monday at 8 AM.

2. **Create Configuration Set Node**  
   - Type: Set  
   - Define variables:  
     - `site_url`: string, e.g., `"sc-domain:your-domain.com"`  
     - `date_start`: Expression: `{{$now.minus(1,'month').format('yyyy-LL-dd')}}`  
     - `date_end`: Expression: `{{$now.format('yyyy-LL-dd')}}`  
     - `date_prev_month_start`: Expression: `{{$now.minus(2,'month').minus(1,'day').format('yyyy-LL-dd')}}`  
     - `date_prev_month_end`: Expression: `{{$now.minus(1,'month').minus(1,'day').format('yyyy-LL-dd')}}`  
   - Connect Schedule Trigger output to this node.

3. **Create HTTP Request Nodes for Google Search Console Data**  
   - For each metric group, create an HTTP Request node configured as:  
     - Method: POST  
     - URL: `https://www.googleapis.com/webmasters/v3/sites/{{ $json.site_url }}/searchAnalytics/query`  
     - Headers: `Content-Type: application/json`  
     - Authentication: OAuth2 with Google credentials  
     - Body (JSON): Customize `startDate`, `endDate`, and `dimensions` per metric:  
       - Overview: no dimensions, full date range  
       - Overview - Previous Month: same with previous month dates  
       - Query: dimensions: ["query"]  
       - Query - Previous Month: dimensions: ["query"] with previous month dates  
       - Page: dimensions: ["page"]  
       - Page - Previous Month: dimensions: ["page"] with previous month dates  
       - Device: dimensions: ["device"]  
       - Country: dimensions: ["country"]  
       - Date: dimensions: ["date"]  
   - Connect Configuration output to all these HTTP Request nodes.

4. **Create Split Out Nodes for Each Dataset**  
   - Create Split Out nodes that split the `rows` field from each HTTP Request output.  
   - Connect each HTTP Request node to its corresponding Split Out node.

5. **Create Set Nodes to Format Each Split Item**  
   - For each Split Out node, add a Set node that extracts relevant fields and renames keys for clarity:  
     - For example, for queries: set `query` to `{{$json.keys[0]}}`, `clicks`, `impressions`, `ctr`, `position` from the JSON fields.  
   - Connect each Split Out node to its corresponding Set node.

6. **Create Merge Node**  
   - Type: Merge  
   - Configure with 9 inputs, one for each formatted dataset stream.  
   - Connect all Format nodes to the Merge node.

7. **Create Code Node to Aggregate and Analyze Data**  
   - Type: Code  
   - Paste the provided JavaScript code that:  
     - Collects all formatted data arrays  
     - Computes month-over-month comparisons  
     - Builds the report object with structured insights, top lists, and metrics  
   - Connect Merge node output to this node.

8. **Create LangChain OpenAI Chat Model Node**  
   - Type: LangChain OpenAI Chat Model  
   - Set model to GPT-4.1  
   - Provide OpenAI API credentials.  
   - Connect Code node output as input to this AI node.

9. **Create LangChain Agent Node for Insight Generation**  
   - Type: LangChain Agent  
   - Set prompt as per the detailed instructions to generate a concise SEO insights paragraph.  
   - Input text is the JSON stringified report from the Code node.  
   - Connect OpenAI Chat Model output to this node’s AI language model input.

10. **Create Code Node to Prepare PDF Variables**  
    - Type: Code  
    - Merge AI insights with report JSON into final variables object.  
    - Connect LangChain Agent output to this node.

11. **Create pdforge Node for PDF Generation**  
    - Type: pdforge  
    - Use `templateId` set to your SEO Report Template (e.g., `template_seo_report`).  
    - Pass final variables JSON as string.  
    - Provide pdforge API credentials.  
    - Connect previous Code node output to this node.

12. **Create HTTP Request Node to Download PDF**  
    - Type: HTTP Request  
    - Set URL to `{{$json.signedUrl}}` from pdforge output.  
    - No authentication needed.  
    - Connect pdforge node output.

13. **Create Slack Node to Send PDF**  
    - Type: Slack  
    - Resource: File  
    - Authentication: OAuth2 with Slack credentials.  
    - Channel ID: Set to your Slack channel.  
    - File name: Dynamic with report date, e.g., `"SEO Report - {{$json.report_date}}"`  
    - Initial comment: Provide message text (e.g., "📊 *Here's your Weekly SEO Report*").  
    - Connect HTTP Request (download) output.

14. **Optional: Add Helper Nodes and Sticky Notes**  
    - Add HTTP Request node to list site URLs for troubleshooting.  
    - Add Sticky Notes with instructions, OAuth2 setup guides, and workflow overview.

15. **Configure Credentials**  
    - Google OAuth2 with scopes for Search Console read-only access.  
    - OpenAI API key.  
    - pdforge API credentials.  
    - Slack OAuth2 credentials.

16. **Test Workflow**  
    - Run manually or wait for scheduled trigger.  
    - Verify data retrieval, AI insight generation, PDF creation, and Slack delivery.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                   | Context or Link                                                                                                               |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| The workflow requires enabling Google Search Console API and creating OAuth2 credentials in Google Cloud Console. Follow the detailed steps in Sticky Note2 to configure OAuth2 in n8n.                                                            | Google Cloud Console, n8n OAuth2 documentation                                                                                |
| The pdforge service is used for PDF generation with a pre-made SEO report template. Signup and template creation instructions are at https://app.pdforge.com/auth/sign-up.                                                                      | https://app.pdforge.com/auth/sign-up                                                                                          |
| AI insights are generated with LangChain using GPT-4. Ensure your OpenAI API key has sufficient quota and GPT-4 access.                                                                                                                      | OpenAI API documentation                                                                                                      |
| Slack delivery is configured via OAuth2. Refer to n8n Slack integration docs for OAuth2 setup.                                                                                                                                                | https://docs.n8n.io/integrations/builtin/credentials/slack                                                                    |
| The workflow is designed to be modular and extensible. You can replace Slack node with other communication nodes (email, Telegram, WhatsApp) by swapping the final delivery node.                                                                 | n8n node marketplace and docs                                                                                                 |
| Contact Marcelo A. Miranda on LinkedIn for support or customization requests: https://www.linkedin.com/in/marceloamiranda                                                                                                                     | LinkedIn profile                                                                                                              |

---

**Disclaimer:** The provided text is exclusively derived from an automated n8n workflow and complies strictly with content policies. All handled data is public and legal.