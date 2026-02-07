Automate SEO Reporting with Google Search Console, GA4, and Google Sheets

https://n8nworkflows.xyz/workflows/automate-seo-reporting-with-google-search-console--ga4--and-google-sheets-11665


# Automate SEO Reporting with Google Search Console, GA4, and Google Sheets

### 1. Workflow Overview

This workflow automates the generation of an SEO performance report by integrating data from Google Search Console (GSC), Google Analytics 4 (GA4), and structured data input/output in Google Sheets. It is designed to collect keyword and page ranking data, analyze internal and external article links, and consolidate organic reach metrics, then format and import this processed data into designated sections of a Google Sheets report for SEO monitoring.

The workflow is logically divided into the following blocks:

- **1.1 Trigger and Data Export:** Manual trigger to start the workflow and export ranking and growth data from Google Sheets.
- **1.2 Organic Reach Reporting:** Fetch and process organic search metrics from GA4.
- **1.3 Keyword Ranking Reporting:** Retrieve keyword query data from GSC, process, format, and store it.
- **1.4 Page Ranking Reporting:** Retrieve page-level data from GSC, process, format, and store it.
- **1.5 Internal Articles Reporting:** Extract and analyze internal article links by fetching URLs from a data sheet, parsing HTML content, formatting link data, and importing results into report sheets.
- **1.6 External Articles Reporting:** Similar to internal articles but focuses on external articles; fetches URLs, analyzes links, formats data via AI, and imports to the report.
- **1.7 Position Change Reporting:** Handle largest position increases and decreases based on growth data exported from Google Sheets, format, and update respective sheets.
- **1.8 Data Formatting Utilities:** Several code nodes to convert decimal points to commas for localization and to format data tables before importing to Google Sheets.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Trigger and Data Export

- **Overview:** Initiates the workflow manually and exports SEO position growth and decrease data from two Google Sheets documents.
- **Nodes Involved:**  
  - When clicking 'Test workflow' (Manual Trigger)  
  - Export Data from Document 1 (Google Sheets)  
  - Export Data from Document 2 (Google Sheets)

- **Node Details:**

  - *When clicking 'Test workflow'*  
    - Type: Manual Trigger  
    - Role: Entry point to start workflow execution manually.  
    - Configuration: Default manual trigger, no parameters.  
    - Connections: Outputs to "Export Data from Document 1" and "Export Data from Document 2".  
    - Edge Cases: No inputs; can fail if workflow is inactive.

  - *Export Data from Document 1* and *Export Data from Document 2*  
    - Type: Google Sheets (Read operation)  
    - Role: Export data related to position increases and decreases respectively.  
    - Configuration: Reads from specific sheets (sheet names and Google Sheet IDs to be configured).  
    - Keys: Document ID and Sheet Name parameters must be set correctly.  
    - Output: Raw growth/decrease data for further processing.  
    - Edge Cases: Authentication errors, incorrect sheet or document IDs, empty sheets.

---

#### 1.2 Organic Reach Reporting

- **Overview:** Fetches organic search metrics (clicks, impressions, CTR, average position) from GA4 for a specified date range, formats the data, and imports it into a Google Sheet report.
- **Nodes Involved:**  
  - Import from Google Analytics 1 (Google Analytics)  
  - Format Data 7 (Code)  
  - Import to Report 1 (Google Sheets)  
  - Sticky Note - Organic Reach (Informational)

- **Node Details:**

  - *Import from Google Analytics 1*  
    - Type: Google Analytics GA4 Node  
    - Role: Queries organic search metrics for a custom date range.  
    - Configuration: Requires GA4 Property ID, custom start and end dates, and metrics list including clicks, impressions, CTR, average position.  
    - Output: Raw metric data per day.  
    - Edge Cases: Auth failure, API rate limits, invalid date range.

  - *Format Data 7*  
    - Type: Code Node (JavaScript)  
    - Role: Sorts data by date, converts date format to DD-MM-YYYY, calculates total and average metrics, converts decimal points to commas for localization, and appends a total summary row.  
    - Key expressions: Date parsing and formatting, arithmetic calculations, string replacement for localization.  
    - Input: GA4 raw data.  
    - Output: Formatted dataset ready for Google Sheets.  
    - Edge Cases: Parsing errors, empty data arrays.

  - *Import to Report 1*  
    - Type: Google Sheets Append  
    - Role: Inserts the formatted organic reach data into the designated report sheet.  
    - Configuration: Google Sheet ID and sheet name must be configured.  
    - Edge Cases: Auth issues, permissions, invalid sheet name.

  - *Sticky Note - Organic Reach*  
    - Role: Provides setup instructions for setting date range and report document link.

---

#### 1.3 Keyword Ranking Reporting

- **Overview:** Extracts keyword query data from GSC for a specified date range, processes it into a structured table, converts decimal formatting, and appends the results to a Google Sheet report.
- **Nodes Involved:**  
  - Export Keywords from GSC 2 (HTTP Request)  
  - Create Table 2 (Code)  
  - Convert Dots to Commas 2 (Code)  
  - Organize Table 2 (Set)  
  - Import to Report 2 (Google Sheets)  
  - Sticky Note - Keyword Ranking (Informational)

- **Node Details:**

  - *Export Keywords from GSC 2*  
    - Type: HTTP Request (Google Search Console API)  
    - Role: Queries search analytics data with dimension "query" for a date range.  
    - Configuration: POST request to GSC API with JSON body specifying dates, dimensions, row limit, and OAuth2 authentication.  
    - Key expressions: Dates hardcoded (e.g., "2025-11-01" to "2025-11-25"), OAuth2 token required.  
    - Output: Raw GSC query data.  
    - Edge Cases: Token expiration, API limits, invalid parameters.

  - *Create Table 2*  
    - Type: Code Node  
    - Role: Maps raw GSC rows into a simplified table with columns: Keyword, Clicks, Impressions, CTR, Average Position.  
    - Input: Response from GSC API.  
    - Output: Simplified JSON array.  
    - Edge Cases: Missing fields in GSC response.

  - *Convert Dots to Commas 2*  
    - Type: Code Node  
    - Role: Converts decimal points in CTR and Average Position fields to commas for localization.  
    - Input: Output from Create Table 2.  
    - Output: Converted data.  
    - Edge Cases: Non-string numeric fields.

  - *Organize Table 2*  
    - Type: Set Node  
    - Role: Explicitly sets the data fields as strings, ensuring proper mapping before import.  
    - Input: Converted data.  
    - Output: Ready for Google Sheets.  
    - Edge Cases: Data type mismatches.

  - *Import to Report 2*  
    - Type: Google Sheets Append  
    - Role: Appends keyword ranking data to the configured sheet.  
    - Configuration: Google Sheet ID and sheet name required.  
    - Edge Cases: Permission or sheet access errors.

  - *Sticky Note - Keyword Ranking*  
    - Role: Setup instructions about date range, authorization, and report link updates.

---

#### 1.4 Page Ranking Reporting

- **Overview:** Similar to Keyword Ranking block but focuses on page-level data from GSC. Retrieves page impressions, clicks, CTR, and average position; formats and imports the data.
- **Nodes Involved:**  
  - Export Keywords from GSC 3 (HTTP Request)  
  - Create Table 3 (Code)  
  - Convert Dots to Commas 3 (Code)  
  - Organize Table 3 (Set)  
  - Import to Report 3 (Google Sheets)  
  - Sticky Note - Page Ranking (Informational)

- **Node Details:**

  - *Export Keywords from GSC 3*  
    - Type: HTTP Request (Google Search Console API)  
    - Role: Queries GSC with dimension "page" for a specific date range.  
    - Configuration: Similar OAuth2 based POST request, with dates set for September 2025.  
    - Edge Cases: Same as GSC API above.

  - *Create Table 3*  
    - Maps raw page data to structured format with columns: Page, Clicks, Impressions, CTR, Average Position.

  - *Convert Dots to Commas 3*  
    - Converts decimal points in CTR and Average Position to commas.

  - *Organize Table 3*  
    - Sets data fields as strings with explicit naming (Keyword field is renamed to "Page").

  - *Import to Report 3*  
    - Appends data to the respective Google Sheets report.

  - *Sticky Note - Page Ranking*  
    - Instructions about date range, authorization, and report document update.

---

#### 1.5 Internal Articles Reporting

- **Overview:** Fetches URLs from a data sheet, performs HTTP requests to get HTML content, extracts internal links and metadata, formats and imports this data into a report sheet.
- **Nodes Involved:**  
  - Export Links from Document 1 (Google Sheets)  
  - Analyze Links 1 (HTTP Request)  
  - Format Data to Table 1 (Code)  
  - Format Data for Table Paste 1 (Code)  
  - Import Data to Report 2 (Google Sheets)  
  - Sticky Note - Internal Articles (Informational)

- **Node Details:**

  - *Export Links from Document 1*  
    - Reads URLs for internal articles from a Google Sheets document.  
    - Requires correct Sheet and Document IDs.

  - *Analyze Links 1*  
    - Makes HTTP GET requests to each URL to retrieve HTML content.  
    - Retries on failure enabled.  
    - Edge Cases: Network errors, invalid URLs, timeouts.

  - *Format Data to Table 1*  
    - Parses HTML to extract the `<div class="entry-content">` section using multiple strategies.  
    - Extracts internal `<a>` links with filters to identify internal links (relative URLs, domain-based).  
    - Extracts link anchor text and rel attribute.  
    - Extracts metadata: article title (from h1 or title tag), canonical URL, publication date (from meta tag), keywords.  
    - Formats and returns structured JSON with internal links info.  
    - Edge Cases: Missing HTML sections, malformed HTML, missing meta tags.

  - *Format Data for Table Paste 1*  
    - Converts the extracted data into rows suitable for Google Sheets, splitting multiple internal links into separate rows.  
    - Converts publication date to DD-MM-YY format with multiple parsing attempts.  
    - Handles empty or missing internal links gracefully.  
    - Edge Cases: Date parsing errors, empty input data.

  - *Import Data to Report 2*  
    - Appends processed internal article link data to the configured report sheet.

  - *Sticky Note - Internal Articles*  
    - Instructions on adding article links, updating report links, verifying data accuracy, and manually adding monthly search volume.

---

#### 1.6 External Articles Reporting

- **Overview:** Similar to internal articles block but for external articles. Fetches URLs, analyzes links with user agent header, formats data using OpenAI GPT-4o for CSV conversion, and imports into a report.
- **Nodes Involved:**  
  - Export Links from Document 1 (Google Sheets) [Shared with Internal Articles]  
  - Analyze External Links 1 (HTTP Request)  
  - Proper Data Formatting (OpenAI GPT-4o)  
  - Format Data Under Table 1 (Code)  
  - Import Data to Report 3 (Google Sheets)  
  - Sticky Note - External Articles (Informational)

- **Node Details:**

  - *Analyze External Links 1*  
    - HTTP GET requests to URLs with "User-Agent" header set to "Mozilla/5.0".  
    - Retrieves raw HTML content.  
    - Edge Cases: Similar to internal links, plus potential user agent blocking.

  - *Proper Data Formatting*  
    - Uses OpenAI GPT-4o model to transform raw extracted data into CSV format with clear rows for article info and links.  
    - Prompts instruct for tabular CSV output for Google Sheets import.  
    - Edge Cases: API limits, model errors, malformed output.

  - *Format Data Under Table 1*  
    - Parses CSV formatted text from the AI output, removes Markdown markers, splits into rows and columns.  
    - Maps article info and links into structured JSON rows for Google Sheets.  
    - Edge Cases: Parsing errors, incomplete CSV data.

  - *Import Data to Report 3*  
    - Appends external articles link data into the designated report sheet.

  - *Sticky Note - External Articles*  
    - Setup instructions for adding URLs in data sheet, updating report links, and verifying data.

---

#### 1.7 Position Change Reporting

- **Overview:** Processes largest position increases and decreases from exported Google Sheets data, converts decimal points to commas, and imports the results into respective sheets.
- **Nodes Involved:**  
  - Export Data from Document 1 (Google Sheets) [Shared]  
  - Export Data from Document 2 (Google Sheets) [Shared]  
  - Format Data 12 (Code)  
  - Format Data 13 (Code)  
  - Import Data to Sheet 10 (Google Sheets)  
  - Import Data to Sheet 11 (Google Sheets)  
  - Sticky Note - Position Increases  
  - Sticky Note - Position Decreases

- **Node Details:**

  - *Format Data 12 and 13*  
    - Code nodes convert decimal points to commas in traffic and position-related metrics for localization.  
    - Input: Raw exported data from Google Sheets.  
    - Output: Formatted data ready for import.

  - *Import Data to Sheet 10 and 11*  
    - Append formatted growth and decrease data into respective sheets.  
    - Configuration: Document and sheet IDs must be set.

  - *Sticky Notes*  
    - Instructions for adding growth/decrease data in the data sheet and updating report document links.

---

#### 1.8 Data Formatting Utilities

- **Overview:** Several code nodes exist to ensure data localization (dot-to-comma conversion) and consistent formatting before importing data into Google Sheets.
- **Nodes Involved:**  
  - Convert Dots to Commas 2  
  - Convert Dots to Commas 3  
  - Format Data 12  
  - Format Data 13

- **Node Details:**  
  - Each node processes numeric string fields, converting decimal points to commas to match localized numeric formats expected in reports.  
  - Essential for consistent display and processing in Google Sheets and reporting tools.  
  - Edge Cases include non-numeric inputs or missing fields.

---

### 3. Summary Table

| Node Name                      | Node Type               | Functional Role                           | Input Node(s)                         | Output Node(s)                       | Sticky Note                                                        |
|--------------------------------|-------------------------|-----------------------------------------|-------------------------------------|------------------------------------|-------------------------------------------------------------------|
| When clicking 'Test workflow'   | Manual Trigger          | Workflow entry point                     | -                                   | Export Data from Document 1, 2      |                                                                   |
| Export Data from Document 1     | Google Sheets           | Export position increase data            | When clicking 'Test workflow'        | Format Data 12                      | Sticky Note - Position Increases                                  |
| Export Data from Document 2     | Google Sheets           | Export position decrease data            | When clicking 'Test workflow'        | Format Data 13                      | Sticky Note - Position Decreases                                  |
| Format Data 12                 | Code                    | Format and localize position increase data | Export Data from Document 1           | Import Data to Sheet 10             | Sticky Note - Position Increases                                  |
| Format Data 13                 | Code                    | Format and localize position decrease data | Export Data from Document 2           | Import Data to Sheet 11             | Sticky Note - Position Decreases                                  |
| Import Data to Sheet 10        | Google Sheets           | Import formatted position increase data | Format Data 12                      | -                                  | Sticky Note - Position Increases                                  |
| Import Data to Sheet 11        | Google Sheets           | Import formatted position decrease data | Format Data 13                      | -                                  | Sticky Note - Position Decreases                                  |
| Import from Google Analytics 1 | Google Analytics GA4    | Fetch organic reach metrics              | -                                   | Format Data 7                      | Sticky Note - Organic Reach                                       |
| Format Data 7                 | Code                    | Format and summarize GA4 organic data    | Import from Google Analytics 1      | Import to Report 1                 | Sticky Note - Organic Reach                                       |
| Import to Report 1             | Google Sheets           | Import organic reach data                 | Format Data 7                      | -                                  | Sticky Note - Organic Reach                                       |
| Export Keywords from GSC 2     | HTTP Request (GSC API)  | Fetch keyword query data                  | -                                   | Create Table 2                    | Sticky Note - Keyword Ranking                                    |
| Create Table 2                | Code                    | Structure GSC keyword data                | Export Keywords from GSC 2           | Convert Dots to Commas 2           | Sticky Note - Keyword Ranking                                    |
| Convert Dots to Commas 2      | Code                    | Localize decimal formatting               | Create Table 2                    | Organize Table 2                  | Sticky Note - Keyword Ranking                                    |
| Organize Table 2              | Set                     | Prepare data for Google Sheets import    | Convert Dots to Commas 2           | Import to Report 2                | Sticky Note - Keyword Ranking                                    |
| Import to Report 2            | Google Sheets           | Import keyword ranking data               | Organize Table 2                  | -                                  | Sticky Note - Keyword Ranking                                    |
| Export Keywords from GSC 3     | HTTP Request (GSC API)  | Fetch page ranking data                    | -                                   | Create Table 3                    | Sticky Note - Page Ranking                                       |
| Create Table 3                | Code                    | Structure GSC page data                    | Export Keywords from GSC 3           | Convert Dots to Commas 3           | Sticky Note - Page Ranking                                       |
| Convert Dots to Commas 3      | Code                    | Localize decimal formatting               | Create Table 3                    | Organize Table 3                  | Sticky Note - Page Ranking                                       |
| Organize Table 3              | Set                     | Prepare data for Google Sheets import    | Convert Dots to Commas 3           | Import to Report 3                | Sticky Note - Page Ranking                                       |
| Import to Report 3            | Google Sheets           | Import page ranking data                   | Organize Table 3                  | -                                  | Sticky Note - Page Ranking                                       |
| Export Links from Document 1  | Google Sheets           | Export internal article URLs               | -                                   | Analyze Links 1, Analyze External Links 1 | Sticky Note - Internal Articles, Sticky Note - External Articles |
| Analyze Links 1              | HTTP Request            | Fetch and analyze internal article HTML   | Export Links from Document 1        | Format Data to Table 1           | Sticky Note - Internal Articles                                  |
| Format Data to Table 1        | Code                    | Extract internal links and metadata from HTML | Analyze Links 1                   | Format Data for Table Paste 1    | Sticky Note - Internal Articles                                  |
| Format Data for Table Paste 1 | Code                    | Split and format internal links data for Google Sheets | Format Data to Table 1          | Import Data to Report 2          | Sticky Note - Internal Articles                                  |
| Import Data to Report 2       | Google Sheets           | Import internal articles data              | Format Data for Table Paste 1     | -                                  | Sticky Note - Internal Articles                                  |
| Analyze External Links 1      | HTTP Request            | Fetch external article HTML with user-agent | Export Links from Document 1      | Proper Data Formatting            | Sticky Note - External Articles                                  |
| Proper Data Formatting        | OpenAI GPT-4o           | Format external article data into CSV     | Analyze External Links 1          | Format Data Under Table 1         | Sticky Note - External Articles                                  |
| Format Data Under Table 1     | Code                    | Parse CSV output into structured JSON     | Proper Data Formatting            | Import Data to Report 3          | Sticky Note - External Articles                                  |
| Import Data to Report 3       | Google Sheets           | Import external articles data               | Format Data Under Table 1         | -                                  | Sticky Note - External Articles                                  |
| Convert Dots to Commas 2      | Code                    | Decimal point to comma localization (keywords) | Create Table 2                   | Organize Table 2                  | Sticky Note - Keyword Ranking                                    |
| Convert Dots to Commas 3      | Code                    | Decimal point to comma localization (pages) | Create Table 3                   | Organize Table 3                  | Sticky Note - Page Ranking                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a manual trigger node:**  
   - Type: Manual Trigger  
   - Name: "When clicking 'Test workflow'"  
   - No parameters needed.

2. **Add Google Sheets nodes to export position data:**  
   - Create two Google Sheets nodes named "Export Data from Document 1" and "Export Data from Document 2".  
   - Configure each to read the appropriate sheet (position increases and decreases) by specifying the Google Sheet ID and sheet name.  
   - Connect the manual trigger output to both nodes.

3. **Add code nodes for formatting growth data:**  
   - Create two Code nodes named "Format Data 12" and "Format Data 13".  
   - Paste JavaScript code that converts decimal points to commas in numeric fields like Estimated Traffic.  
   - Connect "Export Data from Document 1" to "Format Data 12", and "Export Data from Document 2" to "Format Data 13".

4. **Add Google Sheets nodes to import formatted growth data:**  
   - Create two Google Sheets nodes named "Import Data to Sheet 10" and "Import Data to Sheet 11".  
   - Configure with the target report Google Sheet IDs and sheet names.  
   - Connect "Format Data 12" to "Import Data to Sheet 10" and "Format Data 13" to "Import Data to Sheet 11".

5. **Set up GA4 organic reach block:**  
   - Create a Google Analytics GA4 node named "Import from Google Analytics 1".  
   - Configure with your GA4 Property ID and select metrics for organic search clicks, impressions, CTR, and average position.  
   - Set custom date range parameters.  
   - Add a Code node "Format Data 7" with the JavaScript code that formats, summarizes, converts decimal points, and adds a total row.  
   - Connect GA node to this code node.  
   - Add a Google Sheets node "Import to Report 1" configured with your target report sheet and connect from the code node.

6. **Set up Keyword Ranking block:**  
   - Add HTTP Request node "Export Keywords from GSC 2" configured as POST request to GSC API endpoint for search analytics with dimension "query".  
   - Set OAuth2 credentials for authentication.  
   - Add Code node "Create Table 2" to map raw GSC rows into simplified JSON.  
   - Add Code node "Convert Dots to Commas 2" for decimal localization.  
   - Add Set node "Organize Table 2" to explicitly set data fields as strings.  
   - Add Google Sheets node "Import to Report 2" configured with your report Google Sheet.  
   - Connect nodes in sequence.

7. **Set up Page Ranking block:**  
   - Repeat similar sequence as Keyword Ranking with HTTP Request node "Export Keywords from GSC 3" using dimension "page".  
   - Follow with Code nodes "Create Table 3" and "Convert Dots to Commas 3", then Set node "Organize Table 3".  
   - Add Google Sheets node "Import to Report 3" and connect accordingly.

8. **Set up Internal Articles Reporting:**  
   - Add Google Sheets node "Export Links from Document 1" to read internal article URLs.  
   - Connect to HTTP Request node "Analyze Links 1" which fetches page HTML for each URL. Enable retry on failure.  
   - Add Code node "Format Data to Table 1" to parse HTML, extract the entry-content div, internal links, metadata, and format data.  
   - Add Code node "Format Data for Table Paste 1" to split links into rows and format publication dates.  
   - Add Google Sheets node "Import Data to Report 2" to append results to the internal articles report sheet.

9. **Set up External Articles Reporting:**  
   - Use the same "Export Links from Document 1" node to export external article URLs.  
   - Connect to HTTP Request node "Analyze External Links 1" configured with User-Agent header "Mozilla/5.0" to fetch page HTML.  
   - Connect to OpenAI node "Proper Data Formatting" configured with GPT-4o model, sending the HTML data and instructing to transform into CSV format.  
   - Add Code node "Format Data Under Table 1" to parse CSV from AI output into JSON rows.  
   - Add Google Sheets node "Import Data to Report 3" to append external article link data.

10. **Add Sticky Notes:**  
    - Add sticky notes with setup instructions near corresponding nodes for internal articles, external articles, organic reach, keyword ranking, page ranking, position increases, and decreases. Include setup steps as specified.

11. **Credential Setup:**  
    - Configure Google Sheets OAuth2 credentials with required scopes for reading and writing sheets.  
    - Configure Google Analytics OAuth2 credentials with GA4 read permissions.  
    - Configure Google Search Console OAuth2 or generic OAuth2 credentials for the GSC API HTTP request node.  
    - Configure OpenAI credentials for GPT-4o node.

12. **Date Range and IDs Configuration:**  
    - Ensure all date ranges are parameterized or updated as needed (currently hardcoded).  
    - Replace placeholder Google Sheet IDs, sheet names, and GSC site URLs with actual project-specific values.

---

### 5. General Notes & Resources

| Note Content                                                                                          | Context or Link                                                                                          |
|-----------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| Setup instructions for each reporting block are provided as sticky notes inside the workflow canvas. | See sticky notes named "Sticky Note - ..." near each block for detailed setup steps.                   |
| The workflow uses Google Search Console API v3 endpoints and requires OAuth2 authentication.        | Official API docs: https://developers.google.com/webmaster-tools/search-console-api-original/v3/       |
| OpenAI GPT-4o model is used for transforming external article data into CSV format.                  | Requires OpenAI API key and n8n LangChain integration.                                                 |
| For localization, decimal points are converted to commas before importing data into Google Sheets.  | This is important for regions using comma as decimal separator to ensure correct data interpretation.  |
| The workflow assumes structured Google Sheets reports with specific columns; update sheet names and IDs accordingly. | Ensure Google Sheets templates match the expected column schema for seamless data import.               |
| Network errors or API rate limits may cause nodes to fail; HTTP Request nodes have retry enabled where appropriate. | Monitor execution logs for transient failures and adjust retry policies if needed.                      |
| The workflow can be extended or modified by adjusting date ranges, adding more metrics, or enhancing parsing code. | JavaScript code nodes contain comments and logs to ease debugging and customization.                    |

---

**Disclaimer:** The provided content is exclusively from an automated n8n workflow, adhering strictly to content policies. It contains no illegal, offensive, or protected elements. All data handled is legal and public.