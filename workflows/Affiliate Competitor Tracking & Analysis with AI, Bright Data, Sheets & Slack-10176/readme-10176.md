Affiliate Competitor Tracking & Analysis with AI, Bright Data, Sheets & Slack

https://n8nworkflows.xyz/workflows/affiliate-competitor-tracking---analysis-with-ai--bright-data--sheets---slack-10176


# Affiliate Competitor Tracking & Analysis with AI, Bright Data, Sheets & Slack

### 1. Workflow Overview

This workflow is designed to continuously monitor affiliate competitor programs by scraping competitor affiliate pages, analyzing their offers with AI logic, and reporting competitive intelligence to internal teams. Its primary use case is to maintain an up-to-date understanding of competitor affiliate commission structures, cookie durations, average order values, and payout terms, enabling proactive strategic responses.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger & Data Scraping:** Automatically fetches competitor affiliate data twice daily using the Bright Data API.
- **1.2 AI Competitive Offer Analysis:** Processes scraped data to calculate competitive threat levels and generate actionable insights.
- **1.3 Threat Routing & Logging:** Routes analyzed data by threat severity, logs results into Google Sheets for tracking and archiving.
- **1.4 Alerting & Reporting:** Sends immediate Slack alerts for critical threats, routine updates for lower threats, and detailed email reports to the affiliate management team.
- **1.5 Market Position Summary:** Aggregates all competitor data to provide a summary of the competitive landscape.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger & Data Scraping

**Overview:**  
Triggers the workflow twice daily to initiate competitor data scraping via the Bright Data API.

**Nodes Involved:**  
- Schedule Competitor Check  
- Scrape Competitor Sites

**Node Details:**

- **Schedule Competitor Check**  
  - *Type:* Schedule Trigger  
  - *Role:* Initiates workflow execution every 12 hours automatically.  
  - *Configuration:* Interval set to 12 hours.  
  - *Input/Output:* No input, output triggers the HTTP request node.  
  - *Edge cases:* Workflow will not run if n8n instance is down. No retry logic here.  
  - *Sticky Note:* "Runs twice daily to monitor competitor offers automatically"

- **Scrape Competitor Sites**  
  - *Type:* HTTP Request  
  - *Role:* Calls Bright Data API to scrape competitor affiliate pages.  
  - *Configuration:*  
    - POST request to `https://api.brightdata.com/datasets/v3/trigger`  
    - Sends JSON body with dataset ID and competitor URL from incoming data.  
    - Uses HTTP header authentication with generic credentials (expects Bright Data API key).  
  - *Key Expressions:* Pulls competitor URL dynamically from `{{$json.competitorUrl}}` on input.  
  - *Input:* Trigger from schedule node with competitor URLs as input data.  
  - *Output:* Raw scraped data JSON passed to AI analysis.  
  - *Edge cases:* Authentication failure, API limits, network timeouts, malformed URLs.  
  - *Sticky Note:* "Uses Bright Data API to scrape competitor affiliate pages"

---

#### 2.2 AI Competitive Offer Analysis

**Overview:**  
Analyzes competitor affiliate offers extracted from scraping to calculate a competitive score, threat level, and generate insights and recommendations.

**Nodes Involved:**  
- AI Offer Analysis

**Node Details:**

- **AI Offer Analysis**  
  - *Type:* Code (JavaScript)  
  - *Role:* Processes scraped data to:  
    - Compare competitor commission rates, cookie durations, average order values (AOV), conversion rates, payout thresholds with your own program metrics.  
    - Calculate a competitive score and classify threat levels (Low, Medium, High, Critical).  
    - Generate detailed insights and actionable recommendations.  
  - *Configuration:* Hardcoded your program's parameters: commission (10%), cookie duration (30 days), AOV (150), assumed 3% conversion rate for EPC calculation.  
  - *Key Expressions:* Uses JavaScript to iterate all input items and produce enriched output with threat assessments.  
  - *Input:* Scraped competitor data JSON.  
  - *Output:* Enriched JSON with threat metrics, insights, and recommendations.  
  - *Edge cases:* Missing data fields, parsing errors, division by zero, future-proofing assumptions (conversion rate fixed at 3%).  
  - *Sticky Note:* "Analyzes competitor offers and identifies threats to your program"

---

#### 2.3 Threat Routing & Logging

**Overview:**  
Separates critical/high threats from medium/low threats, logs all data to Google Sheets for ongoing tracking and historical analysis.

**Nodes Involved:**  
- Route by Threat Level  
- Log to Competitor Dashboard  
- Archive All Data

**Node Details:**

- **Route by Threat Level**  
  - *Type:* If  
  - *Role:* Routes items based on threatLevel field: "Critical" or "High" go to urgent path; others to routine path.  
  - *Configuration:* Checks if `{{$json.threatLevel}}` equals "Critical" or "High".  
  - *Input:* AI Offer Analysis output.  
  - *Output:* Two branches: critical/high threat and medium/low threat.  
  - *Edge cases:* Unexpected threatLevel values, missing field.  
  - *Sticky Note:* "Separates critical threats from routine competitive intelligence"

- **Log to Competitor Dashboard**  
  - *Type:* Google Sheets  
  - *Role:* Appends or updates competitor intelligence data in a centralized sheet for current tracking.  
  - *Configuration:*  
    - Appends data including date, score, AOV, EPC, commission details, threat level, and cookies to sheet named "Competitor Analysis" (gid=0).  
    - Uses spreadsheet ID placeholder "your-competitor-tracking-spreadsheet-id".  
  - *Input:* Both threat routing branches feed into this node.  
  - *Output:* Passes data downstream.  
  - *Edge cases:* Authentication errors, API limits, sheet access permissions.  
  - *Sticky Note:* "Records all competitive intelligence to centralized tracking sheet"

- **Archive All Data**  
  - *Type:* Google Sheets  
  - *Role:* Maintains a historical log of all competitor data for trend analysis.  
  - *Configuration:*  
    - Appends data with timestamp, competitor, commission, cookies, AOV, EPC, alert, and threat level to "Historical Log" sheet (gid=1).  
    - Uses same spreadsheet ID as above.  
  - *Input:* Same as Log to Competitor Dashboard.  
  - *Output:* Passes data downstream.  
  - *Edge cases:* Same as above.  
  - *Sticky Note:* "Maintains historical record for trend analysis over time"

---

#### 2.4 Alerting & Reporting

**Overview:**  
Sends Slack alerts and emails to notify the affiliate team about competitive threats and updates.

**Nodes Involved:**  
- URGENT: Competitive Threat Alert  
- Routine Monitoring Alert  
- Generate Strategic Report  
- Email Affiliate Team

**Node Details:**

- **URGENT: Competitive Threat Alert**  
  - *Type:* Slack  
  - *Role:* Sends immediate notifications to Slack channel for critical or high competitive threats.  
  - *Configuration:*  
    - Slack webhook with templated message including competitor, threat level, scores, detailed commission/cookie/AOV/EPC comparisons, insights, and recommendations.  
    - Emphasizes urgent action with 48-hour response deadline.  
  - *Input:* Critical/high threat branch from Route node.  
  - *Edge cases:* Slack webhook failures, rate limiting.  
  - *Sticky Note:* "Immediate alert for critical competitive threats needing action"

- **Routine Monitoring Alert**  
  - *Type:* Slack  
  - *Role:* Sends regular updates to Slack for medium or low threats, emphasizing ongoing monitoring with no immediate action required.  
  - *Configuration:* Similar templated message with summary metrics and low urgency.  
  - *Input:* Medium/low threat branch from Route node.  
  - *Edge cases:* Slack webhook failures, rate limiting.  
  - *Sticky Note:* "Regular updates for medium/low threats requiring ongoing monitoring"

- **Generate Strategic Report**  
  - *Type:* Code (JavaScript)  
  - *Role:* Builds detailed competitive intelligence email reports, customized by threat severity.  
  - *Configuration:*  
    - Generates subject line and body text with formatted competitive data, critical insights, and recommended action items.  
    - Escalates priority and action items for high/critical threats.  
  - *Input:* Both threat branches downstream after logging.  
  - *Output:* JSON including emailSubject, emailBody, priority, and urgency flags.  
  - *Edge cases:* String formatting errors, missing fields.  
  - *Sticky Note:* "Creates detailed competitive intelligence reports for email distribution"

- **Email Affiliate Team**  
  - *Type:* Email Send  
  - *Role:* Sends the generated strategic reports to affiliate management team via SMTP.  
  - *Configuration:*  
    - From: affiliate-intelligence@yourcompany.com  
    - To: affiliate-team@yourcompany.com  
    - Reply-To: affiliate-manager@yourcompany.com  
    - Subject and body use expressions from previous node output.  
  - *Input:* From Generate Strategic Report node.  
  - *Edge cases:* SMTP failures, invalid email addresses.  
  - *Sticky Note:* "Sends comprehensive competitive analysis reports to affiliate management team"

---

#### 2.5 Market Position Summary

**Overview:**  
Aggregates all competitor data to produce a summary of the overall competitive landscape with counts of threat levels and average competitive score.

**Nodes Involved:**  
- Calculate Market Position

**Node Details:**

- **Calculate Market Position**  
  - *Type:* Set  
  - *Role:* Calculates total competitors monitored, counts of threats by level (Critical, High, Medium, Low), average competitive score, and formats a summary message.  
  - *Configuration:* Uses expressions on all input items to compute counts and averages, builds a string summary with emoji indicators.  
  - *Input:* From Log to Competitor Dashboard node (all processed competitor data).  
  - *Output:* Market position summary JSON for further use or display.  
  - *Edge cases:* Division by zero if no competitors, inconsistent threatLevel values.  
  - *Sticky Note:* "Aggregates competitive intelligence into market position summary metrics"

---

### 3. Summary Table

| Node Name                      | Node Type              | Functional Role                                       | Input Node(s)             | Output Node(s)                                         | Sticky Note                                                                                          |
|-------------------------------|------------------------|-----------------------------------------------------|---------------------------|-------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Schedule Competitor Check      | Schedule Trigger       | Triggers workflow twice daily                        |                           | Scrape Competitor Sites                               | Runs twice daily to monitor competitor offers automatically                                         |
| Scrape Competitor Sites        | HTTP Request           | Scrapes competitor affiliate pages via Bright Data | Schedule Competitor Check  | AI Offer Analysis                                     | Uses Bright Data API to scrape competitor affiliate pages                                          |
| AI Offer Analysis              | Code                   | Analyzes competitor offers, calculates threat levels | Scrape Competitor Sites    | Route by Threat Level                                 | Analyzes competitor offers and identifies threats to your program                                  |
| Route by Threat Level          | If                     | Routes data by threat severity                       | AI Offer Analysis          | Log to Competitor Dashboard, Archive All Data, URGENT..., Routine Monitoring Alert, Generate Report | Separates critical threats from routine competitive intelligence                                   |
| Log to Competitor Dashboard    | Google Sheets          | Logs current competitor intelligence                 | Route by Threat Level      | Calculate Market Position                             | Records all competitive intelligence to centralized tracking sheet                                 |
| Archive All Data               | Google Sheets          | Archives competitor data for historical analysis     | Route by Threat Level      |                                                       | Maintains historical record for trend analysis over time                                          |
| URGENT: Competitive Threat Alert | Slack                 | Sends immediate Slack alert for critical threats     | Route by Threat Level (critical branch) |                                                       | Immediate alert for critical competitive threats needing action                                    |
| Routine Monitoring Alert       | Slack                  | Sends routine Slack updates for medium/low threats  | Route by Threat Level (routine branch) |                                                       | Regular updates for medium/low threats requiring ongoing monitoring                                |
| Generate Strategic Report      | Code                   | Builds detailed email reports                         | Route by Threat Level      | Email Affiliate Team                                 | Creates detailed competitive intelligence reports for email distribution                          |
| Email Affiliate Team           | Email Send             | Emails affiliate team detailed reports                | Generate Strategic Report  | Calculate Market Position                             | Sends comprehensive competitive analysis reports to affiliate management team                     |
| Calculate Market Position      | Set                    | Aggregates and summarizes overall market position    | Log to Competitor Dashboard, Email Affiliate Team |                                                       | Aggregates competitive intelligence into market position summary metrics                          |
| Sticky Note                   | Sticky Note            | Informational notes                                  |                           |                                                       | # 🎯 Affiliate Competitor Intelligence System ... (see notes section for full content)            |
| Sticky Note1                  | Sticky Note            | Informational note                                   |                           |                                                       | Runs twice daily to monitor competitor offers automatically                                        |
| Sticky Note2                  | Sticky Note            | Informational note                                   |                           |                                                       | Uses Bright Data API to scrape competitor affiliate pages                                         |
| Sticky Note3                  | Sticky Note            | Informational note                                   |                           |                                                       | Analyzes competitor offers and identifies threats to your program                                 |
| Sticky Note4                  | Sticky Note            | Informational note                                   |                           |                                                       | Separates critical threats from routine competitive intelligence                                  |
| Sticky Note5                  | Sticky Note            | Informational note                                   |                           |                                                       | Immediate alert for critical competitive threats needing action                                   |
| Sticky Note6                  | Sticky Note            | Informational note                                   |                           |                                                       | Maintains historical record for trend analysis over time                                         |
| Sticky Note7                  | Sticky Note            | Informational note                                   |                           |                                                       | Records all competitive intelligence to centralized tracking sheet                                |
| Sticky Note8                  | Sticky Note            | Informational note                                   |                           |                                                       | Creates detailed competitive intelligence reports for email distribution                         |
| Sticky Note9                  | Sticky Note            | Informational note                                   |                           |                                                       | Sends comprehensive competitive analysis reports to affiliate management team                    |
| Sticky Note10                 | Sticky Note            | Informational note                                   |                           |                                                       | Regular updates for medium/low threats requiring ongoing monitoring                               |
| Sticky Note11                 | Sticky Note            | Informational note                                   |                           |                                                       | Aggregates competitive intelligence into market position summary metrics                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Name: "Schedule Competitor Check"  
   - Type: Schedule Trigger  
   - Set interval to every 12 hours.

2. **Create HTTP Request Node**  
   - Name: "Scrape Competitor Sites"  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.brightdata.com/datasets/v3/trigger`  
   - Authentication: HTTP Header Auth with API key credential for Bright Data  
   - Headers: Content-Type = application/json  
   - Body Parameters (JSON):  
     ```json
     {
       "dataset_id": "gd_l7q7dkf244hwjntr0",
       "url": "={{$json.competitorUrl}}",
       "format": "json"
     }
     ```  
   - Connect output of Schedule node to this node input.

3. **Create Code Node for AI Analysis**  
   - Name: "AI Offer Analysis"  
   - Type: Code  
   - Paste the provided JavaScript code that processes competitor data, calculates scores, threat levels, insights, and recommendations.  
   - Connect output of HTTP Request node to this node.

4. **Create If Node to Route by Threat Level**  
   - Name: "Route by Threat Level"  
   - Type: If  
   - Condition: Check if `{{$json.threatLevel}}` equals "Critical" OR "High"  
   - Connect output of AI node to this node.

5. **Create Google Sheets Node for Current Logging**  
   - Name: "Log to Competitor Dashboard"  
   - Type: Google Sheets  
   - Operation: Append or Update  
   - Spreadsheet ID: Your Google Sheets ID for competitor tracking  
   - Sheet Name: Competitor Analysis (gid=0)  
   - Map columns for date, score, AOV, EPC, commission, cookies, competitor name, threat level, etc.  
   - Connect both outputs (true and false) of If node to this node.

6. **Create Google Sheets Node for Archiving Data**  
   - Name: "Archive All Data"  
   - Type: Google Sheets  
   - Operation: Append or Update  
   - Spreadsheet ID: Same as above  
   - Sheet Name: Historical Log (gid=1)  
   - Map columns for timestamp, competitor, commission, cookies, AOV, EPC, alert and threat levels.  
   - Connect both outputs (true and false) of If node to this node.

7. **Create Slack Node for Urgent Alerts**  
   - Name: "URGENT: Competitive Threat Alert"  
   - Type: Slack  
   - Configure Slack webhook (Incoming Webhook URL) for critical alerts channel  
   - Message: Use templated message with competitor name, threat level, score, detailed comparisons, insights, and recommendations.  
   - Connect true branch (Critical/High) from If node to this node.

8. **Create Slack Node for Routine Alerts**  
   - Name: "Routine Monitoring Alert"  
   - Type: Slack  
   - Configure Slack webhook for routine updates channel  
   - Message: Summary message with competitor, threat level, score, and quick comparison.  
   - Connect false branch (Medium/Low) from If node to this node.

9. **Create Code Node for Report Generation**  
   - Name: "Generate Strategic Report"  
   - Type: Code  
   - Paste JavaScript code that generates email subject and body based on threat level with detailed insights and recommended actions.  
   - Connect outputs from both Slack alert nodes to this node.

10. **Create Email Send Node**  
    - Name: "Email Affiliate Team"  
    - Type: Email Send  
    - Configure SMTP credentials (company mail server)  
    - From: affiliate-intelligence@yourcompany.com  
    - To: affiliate-team@yourcompany.com  
    - Reply-To: affiliate-manager@yourcompany.com  
    - Subject: Expression from previous node `{{$json.emailSubject}}`  
    - Body: Expression from previous node `{{$json.emailBody}}`  
    - Connect output of Report Generation node to this node.

11. **Create Set Node for Market Summary**  
    - Name: "Calculate Market Position"  
    - Type: Set  
    - Use expressions to calculate total competitors, count of threats by level, average score, and format a summary string.  
    - Connect output of Log to Competitor Dashboard and Email Affiliate Team node to this node.

12. **Optional:** Add Sticky Notes for documentation and clarity at relevant points.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                             | Context or Link                                          |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------|
| 🎯 Affiliate Competitor Intelligence System automatically monitors competitor affiliate programs using Bright Data API, analyzing commissions, cookies, and payout terms, then alerts your team about competitive threats. AI analysis compares key metrics and identifies critical advantages/disadvantages. Setup includes API credentials, Google Sheets, Slack, and SMTP. Benefits include rapid response and data-driven strategy. Built by Daniel Shashko. [Connect on LinkedIn](https://www.linkedin.com/in/daniel-shashko/) | Workflow overview and project credits                    |
| For detailed Bright Data API documentation and dataset configuration, refer to https://brightdata.com/docs                                                                                                                                                                                            | Bright Data API reference                                 |
| Slack webhook URLs must be configured securely and tested prior to deployment for alert nodes.                                                                                                                                                                                                           | Slack integration instructions                            |
| Ensure Google Sheets API credentials have proper access rights to the specified spreadsheet and sheets (Competitor Analysis and Historical Log).                                                                                                                                                         | Google Sheets API setup                                   |
| SMTP server must support sending from affiliate-intelligence@yourcompany.com and allow relay to affiliate-team@yourcompany.com.                                                                                                                                                                         | Email sending configuration                               |
| The AI analysis code assumes fixed your program parameters (commission 10%, cookie 30 days, AOV 150, conversion 3%). Modify these hardcoded values in the AI Offer Analysis node to reflect your actual program metrics for accuracy.                                                                      | Customization note for AI logic                           |
| To maintain workflow stability, consider adding error handling nodes or retry mechanisms for HTTP calls, Google Sheets, Slack, and email sending to handle API limits or network issues gracefully.                                                                                                       | Recommended workflow robustness improvements             |

---

This structured documentation captures the full logic, configuration, and integration points of the "Affiliate Competitor Tracking & Analysis with AI, Bright Data, Sheets & Slack" workflow, enabling proficient users or AI agents to understand, reproduce, and maintain it effectively.