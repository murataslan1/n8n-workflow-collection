Automate Weekly SEO Reports from Google Search Console to Email

https://n8nworkflows.xyz/workflows/automate-weekly-seo-reports-from-google-search-console-to-email-3712


# Automate Weekly SEO Reports from Google Search Console to Email

### 1. Workflow Overview

This workflow automates the generation and emailing of a weekly SEO performance report using data from Google Search Console (GSC). It is designed to run every Monday at 7 AM, fetch SEO metrics for the previous 7 days, format the data into a readable summary, and send it via email.

**Target Use Cases:**  
- Website owners, bloggers, and SEO consultants who want automated weekly insights into their site's search performance without manual data extraction or report creation.

**Logical Blocks:**

- **1.1 Scheduled Trigger:** Initiates the workflow every Monday at 7 AM.
- **1.2 Data Retrieval from Google Search Console:** Queries the GSC API for SEO metrics over the last 7 days.
- **1.3 Report Generation:** Processes raw API data into a formatted text report.
- **1.4 Email Dispatch:** Sends the generated report to a specified email address.
- **1.5 Setup Guidance:** Sticky notes provide configuration instructions for credentials and node setup.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger

- **Overview:**  
  This block triggers the workflow execution automatically every Monday at 7 AM to ensure weekly reporting.

- **Nodes Involved:**  
  - Weekly Trigger (Monday 7AM)

- **Node Details:**  

  - **Weekly Trigger (Monday 7AM)**  
    - Type: Cron Trigger  
    - Role: Initiates workflow on schedule  
    - Configuration: Default cron node set to trigger at 7:00 AM every Monday (default parameters imply this schedule)  
    - Inputs: None (trigger node)  
    - Outputs: Connects to "Get SEO Data from GSC" node  
    - Version-specific: Uses n8n Cron node version 1  
    - Potential Failures: Cron misconfiguration could cause no triggers; time zone differences may affect execution time if not accounted for in n8n instance settings.

#### 1.2 Data Retrieval from Google Search Console

- **Overview:**  
  This block performs an authenticated HTTP request to the Google Search Console API to fetch SEO analytics data for the last 7 days.

- **Nodes Involved:**  
  - Get SEO Data from GSC

- **Node Details:**  

  - **Get SEO Data from GSC**  
    - Type: HTTP Request  
    - Role: Fetch SEO data from GSC API  
    - Configuration:  
      - URL: `https://searchconsole.googleapis.com/webmasters/v3/sites/YOUR_SITE_URL/searchAnalytics/query` (replace `YOUR_SITE_URL` with your verified domain)  
      - Authentication: Generic HTTP Basic Auth (configured with Google OAuth2 credentials)  
      - Method: POST (implied by API usage, though not explicitly stated)  
      - Request Body: Not shown, but typically includes date range and metrics for GSC API  
    - Inputs: Triggered by "Weekly Trigger (Monday 7AM)"  
    - Outputs: Passes response JSON to "Generate SEO Report"  
    - Version-specific: HTTP Request node version 2  
    - Potential Failures:  
      - Authentication errors if OAuth2 credentials are invalid or expired  
      - API quota limits or rate limiting by Google  
      - Incorrect URL or missing site verification causing 403 errors  
      - Network timeouts or connectivity issues  
    - Notes: Requires Google OAuth2 credentials configured in n8n; user must replace placeholder URL with actual site URL.

#### 1.3 Report Generation

- **Overview:**  
  This block processes the raw JSON data from GSC, extracting key SEO metrics and formatting them into a human-readable weekly summary.

- **Nodes Involved:**  
  - Generate SEO Report

- **Node Details:**  

  - **Generate SEO Report**  
    - Type: Function Node  
    - Role: Transform raw API data into a formatted text report  
    - Configuration:  
      - Custom JavaScript code extracts `rows` from the API response, maps each row to a formatted string showing query, clicks, impressions, CTR, and position, and compiles a numbered list of top 10 queries.  
      - Output JSON contains a single field `report` with the formatted string.  
    - Inputs: Receives JSON data from "Get SEO Data from GSC"  
    - Outputs: Passes formatted report JSON to "Send Weekly Report by Email"  
    - Version-specific: Function node version 1  
    - Potential Failures:  
      - If `rows` is undefined or empty, report will be empty or incomplete  
      - JavaScript errors if data structure changes or unexpected null values  
      - Formatting issues if numeric fields are missing or not numbers

#### 1.4 Email Dispatch

- **Overview:**  
  This block sends the generated SEO report via email using Gmail SMTP credentials.

- **Nodes Involved:**  
  - Send Weekly Report by Email

- **Node Details:**  

  - **Send Weekly Report by Email**  
    - Type: Gmail Node  
    - Role: Email the SEO report to a specified recipient  
    - Configuration:  
      - Recipient: `rodrigue.gbadou@gmail.com` (changeable)  
      - Subject: "Send Weekly Report by Email" (customizable)  
      - Email body: Uses the `report` field from previous node as content (implied connection)  
      - Credentials: Gmail OAuth2 credentials configured in n8n  
    - Inputs: Receives formatted report JSON from "Generate SEO Report"  
    - Outputs: None (end node)  
    - Version-specific: Gmail node version 2.1  
    - Potential Failures:  
      - Authentication errors if Gmail OAuth2 token is invalid or expired  
      - Email sending limits or restrictions by Gmail  
      - Missing or malformed email content causing delivery issues

#### 1.5 Setup Guidance (Sticky Notes)

- **Overview:**  
  Sticky notes provide visual instructions and reminders for configuring the workflow nodes and credentials.

- **Nodes Involved:**  
  - 📌 Setup Instructions  
  - 📌 Google Search Console Config  
  - 📌 Email Node Setup

- **Node Details:**  

  - **📌 Setup Instructions**  
    - Type: Sticky Note  
    - Role: General setup guidance  
    - Content: Blank in JSON, but in canvas contains step-by-step instructions (see workflow description)  
    - Position: Top-left for visibility

  - **📌 Google Search Console Config**  
    - Type: Sticky Note  
    - Role: Reminds user to replace `YOUR_SITE_URL` and configure OAuth2 credentials for GSC API  
    - Content: Empty in JSON but visually present on canvas near HTTP Request node

  - **📌 Email Node Setup**  
    - Type: Sticky Note  
    - Role: Reminds user to configure SMTP/Gmail credentials and recipient email  
    - Content: Empty in JSON but visually present near Gmail node

---

### 3. Summary Table

| Node Name                 | Node Type           | Functional Role                      | Input Node(s)               | Output Node(s)                 | Sticky Note                                      |
|---------------------------|---------------------|------------------------------------|-----------------------------|-------------------------------|-------------------------------------------------|
| Weekly Trigger (Monday 7AM) | Cron Trigger        | Scheduled workflow trigger          | None                        | Get SEO Data from GSC          |                                                 |
| Get SEO Data from GSC      | HTTP Request        | Fetch SEO data from Google Search Console API | Weekly Trigger (Monday 7AM) | Generate SEO Report            | 📌 Google Search Console Config                  |
| Generate SEO Report        | Function            | Format raw SEO data into report     | Get SEO Data from GSC        | Send Weekly Report by Email    |                                                 |
| Send Weekly Report by Email| Gmail               | Send formatted SEO report via email | Generate SEO Report          | None                          | 📌 Email Node Setup                              |
| 📌 Setup Instructions      | Sticky Note         | Setup guidance and instructions     | None                        | None                          |                                                 |
| 📌 Google Search Console Config | Sticky Note    | GSC API URL and OAuth2 credential setup reminder | None                        | None                          | Covers Get SEO Data from GSC node                |
| 📌 Email Node Setup        | Sticky Note         | Email node credential and recipient setup reminder | None                        | None                          | Covers Send Weekly Report by Email node           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Cron Trigger Node:**  
   - Name: `Weekly Trigger (Monday 7AM)`  
   - Type: Cron Trigger  
   - Configure to trigger every Monday at 7:00 AM (set day of week = Monday, hour = 7, minute = 0)  
   - No credentials needed

2. **Create HTTP Request Node:**  
   - Name: `Get SEO Data from GSC`  
   - Type: HTTP Request  
   - Set HTTP Method to POST  
   - URL: `https://searchconsole.googleapis.com/webmasters/v3/sites/YOUR_SITE_URL/searchAnalytics/query` (replace `YOUR_SITE_URL` with your verified domain)  
   - Authentication: Set to OAuth2 with Google credentials (configure Google OAuth2 credentials in n8n first)  
   - Request Body: JSON including date range (last 7 days), dimensions (e.g., `query`), and metrics (clicks, impressions, ctr, position) as per Google Search Console API documentation  
   - Connect input from `Weekly Trigger (Monday 7AM)`

3. **Create Function Node:**  
   - Name: `Generate SEO Report`  
   - Type: Function  
   - Paste the following JavaScript code in the Function Code field:
     ```javascript
     const rows = items[0].json.rows || [];
     const reportLines = rows.map((row, index) => {
         return `${index + 1}. ${row.keys[0]} - Clicks: ${row.clicks}, Impressions: ${row.impressions}, CTR: ${row.ctr.toFixed(2)}, Position: ${row.position.toFixed(2)}`;
     });
     return [{
         json: {
             report: `Top 10 Search Queries (Last 7 Days):\n\n${reportLines.join("\n")}`
         }
     }];
     ```
   - Connect input from `Get SEO Data from GSC`

4. **Create Gmail Node:**  
   - Name: `Send Weekly Report by Email`  
   - Type: Gmail  
   - Set recipient email address (e.g., your email) in the `Send To` field  
   - Set subject line, e.g., "Weekly SEO Report"  
   - Set email body to use expression referencing previous node output: `{{$json["report"]}}`  
   - Configure Gmail OAuth2 credentials in n8n and select them here  
   - Connect input from `Generate SEO Report`

5. **Connect Nodes:**  
   - Connect `Weekly Trigger (Monday 7AM)` → `Get SEO Data from GSC` → `Generate SEO Report` → `Send Weekly Report by Email`

6. **Add Sticky Notes (Optional but Recommended):**  
   - Add notes near nodes to remind about replacing `YOUR_SITE_URL`, setting up Google OAuth2 credentials, and configuring Gmail credentials and recipient email.

7. **Test Workflow:**  
   - Manually trigger the workflow or wait for the scheduled time to verify data retrieval, report generation, and email sending.

---

### 5. General Notes & Resources

| Note Content                                                                                   | Context or Link                                                                                  |
|-----------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Replace `YOUR_SITE_URL` in HTTP Request node with your verified Google Search Console domain. | Critical for API access; domain must be verified in GSC.                                       |
| Google OAuth2 credentials must be created and configured in n8n for API authentication.       | See Google Cloud Console for OAuth2 setup: https://console.cloud.google.com/apis/credentials    |
| SMTP or Gmail OAuth2 credentials are required for sending emails via the Gmail node.          | Gmail OAuth2 setup guide: https://developers.google.com/identity/protocols/oauth2               |
| Estimated setup time: approximately 10 minutes.                                               | Workflow designed for quick deployment.                                                        |
| Optional customization: Modify the Function node to add more queries or output PDF reports.   | PDF generation requires additional nodes or external services.                                 |
| Sticky notes in the workflow canvas provide step-by-step guidance for configuration.          | Visual aids improve usability and reduce setup errors.                                         |

---

This document fully describes the workflow, enabling reproduction, modification, and troubleshooting by advanced users or AI agents.