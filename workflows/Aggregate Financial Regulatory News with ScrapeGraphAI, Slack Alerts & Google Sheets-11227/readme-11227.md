Aggregate Financial Regulatory News with ScrapeGraphAI, Slack Alerts & Google Sheets

https://n8nworkflows.xyz/workflows/aggregate-financial-regulatory-news-with-scrapegraphai--slack-alerts---google-sheets-11227


# Aggregate Financial Regulatory News with ScrapeGraphAI, Slack Alerts & Google Sheets

### 1. Workflow Overview

This workflow automates the daily aggregation of financial regulatory news from multiple regulatory agency websites (SEC, FINRA, ESMA). It extracts the latest updates using ScrapeGraphAI, filters them to keep only fresh news from the last 24 hours, archives all records into Google Sheets, and sends Slack alerts to compliance teams only when new relevant updates exist. The workflow is designed to provide compliance officers a consolidated, up-to-date view of overnight regulatory actions with minimal manual effort.

The workflow is logically divided into these main blocks:

- **1.1 Input Reception & Scheduling:** Defines when and which regulatory sources to scrape daily.
- **1.2 Data Extraction & Parsing:** Uses ScrapeGraphAI to extract structured regulatory updates from each source URL.
- **1.3 Data Flattening & Filtering:** Transforms nested updates into single entries and filters only recent (last 24h) items.
- **1.4 Data Delivery & Alerting:** Appends all updates to Google Sheets and sends Slack alerts if fresh updates exist.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Scheduling

**Overview:**  
This block triggers the workflow on a daily basis, generates the list of regulatory agency URLs to scrape, and splits these URLs for sequential processing.

**Nodes Involved:**  
- Daily Regulatory Poll  
- Regulatory Sources (Code)  
- Split URLs (SplitInBatches)  
- Source Intake Note (Sticky Note)

**Node Details:**

- **Daily Regulatory Poll**  
  - *Type:* Schedule Trigger  
  - *Role:* Initiates the workflow every 24 hours.  
  - *Configuration:* Interval set to 24 hours; timezone and start hour should be set to align with team requirements.  
  - *Inputs:* None  
  - *Outputs:* Triggers "Regulatory Sources" node.  
  - *Edge cases:* Misconfigured timezone/start hour may cause unexpected trigger times.

- **Regulatory Sources**  
  - *Type:* Code  
  - *Role:* Generates an array of regulatory URLs with agency labels.  
  - *Configuration:* Hardcoded URLs for SEC, FINRA, and ESMA; adds an `agency` property based on URL substring matching.  
  - *Outputs:* JSON objects with `url` and `agency` keys.  
  - *Input:* Triggered by "Daily Regulatory Poll".  
  - *Output:* Passes list to "Split URLs".  
  - *Edge cases:* Adding new regulators requires updating this code node. URLs must be valid and reachable.

- **Split URLs**  
  - *Type:* SplitInBatches  
  - *Role:* Processes each URL sequentially to avoid concurrent scraping issues.  
  - *Configuration:* Default batching, no special options.  
  - *Input:* List of URLs from "Regulatory Sources".  
  - *Output:* Single URL per execution to "Scrape Regulatory Updates".  
  - *Edge cases:* Large URL lists may prolong processing time.

- **Source Intake Note**  
  - *Type:* Sticky Note  
  - *Role:* Documentation block summarizing this intake stage.  
  - *Content:* Explains how daily trigger and URL splitting work.

---

#### 2.2 Data Extraction & Parsing

**Overview:**  
This block uses ScrapeGraphAI to extract structured regulatory updates from each URL, then flattens the nested updates for easier downstream processing.

**Nodes Involved:**  
- Scrape Regulatory Updates (ScrapeGraphAI)  
- Flatten Updates (Code)  
- Processing & Filter Note (Sticky Note)

**Node Details:**

- **Scrape Regulatory Updates**  
  - *Type:* ScrapeGraphAI  
  - *Role:* Extracts the five most recent regulatory or compliance updates from the given webpage URL.  
  - *Configuration:*  
    - Prompt requests JSON data with an array `updates` containing objects with fields: `title`, `summary`, `date` (ISO format), `agency`, and `source_url`.  
    - `websiteUrl` parameter dynamically set from input URL.  
  - *Inputs:* Single URL from "Split URLs".  
  - *Outputs:* JSON with `updates` array per URL.  
  - *Edge cases:*  
    - Scraper may return empty updates if no news found or page structure changed.  
    - API/credential errors could stop extraction.  
    - Date formats must be ISO compliant.

- **Flatten Updates**  
  - *Type:* Code  
  - *Role:* Converts nested arrays of updates into individual flat JSON items, adding metadata like scrape timestamp.  
  - *Configuration:* Iterates all input items, extracts each update, assigns fallback agency and source URL if missing.  
  - *Inputs:* Output from "Scrape Regulatory Updates".  
  - *Outputs:* Flattened list of update objects.  
  - *Edge cases:* Empty or malformed input arrays; missing fields handled with defaults.

- **Processing & Filter Note**  
  - *Type:* Sticky Note  
  - *Role:* Documentation explaining the extraction and flattening process.

---

#### 2.3 Data Flattening & Filtering

**Overview:**  
Filters the flattened updates to keep only those published within the last 24 hours, discarding stale or invalid data.

**Nodes Involved:**  
- Filter Recent Updates (Code)

**Node Details:**

- **Filter Recent Updates**  
  - *Type:* Code  
  - *Role:* Filters out updates older than 24 hours or with invalid dates.  
  - *Configuration:*  
    - Compares each update's `date` field with current time.  
    - Uses 24 hours (86,400,000 ms) cutoff.  
    - Discards updates with unreadable or missing dates.  
  - *Inputs:* Flattened updates from "Flatten Updates".  
  - *Outputs:* Filtered list of recent updates.  
  - *Edge cases:*  
    - Timezone differences in date fields could cause false negatives.  
    - Updates with missing or malformed `date` are excluded.

---

#### 2.4 Data Delivery & Alerting

**Overview:**  
Archives all filtered updates into a Google Sheet and triggers Slack alerts only when fresh updates exist, providing compliance with real-time notifications.

**Nodes Involved:**  
- Log to Google Sheets (Google Sheets)  
- Send Compliance Alert (Slack)  
- Delivery Note (Sticky Note)

**Node Details:**

- **Log to Google Sheets**  
  - *Type:* Google Sheets  
  - *Role:* Appends each update as a new row in a specified sheet.  
  - *Configuration:*  
    - Document ID set via environment or replaced string `{{YOUR_SPREADSHEET_ID}}` (must be configured).  
    - Sheet name: "RegUpdates".  
    - Columns mapped to update fields: Date, Title, Agency, Summary, Scraped At, Source URL.  
    - Append operation mode.  
  - *Inputs:* Filtered recent updates from "Filter Recent Updates".  
  - *Outputs:* None (terminal in this branch).  
  - *Edge cases:*  
    - Missing or incorrect document ID or sheet name causes failures.  
    - Google API quota limits may apply.  
    - Permission/authentication errors.

- **Send Compliance Alert**  
  - *Type:* Slack  
  - *Role:* Posts a message to a Slack channel when new updates exist.  
  - *Configuration:*  
    - Uses a webhook ID to post messages.  
    - Operation: postMessage.  
    - Message content not explicitly defined in node parameters (implied default or configured elsewhere).  
  - *Inputs:* Same filtered updates as Google Sheets.  
  - *Outputs:* None (terminal branch).  
  - *Edge cases:*  
    - Slack webhook misconfiguration or revoked permissions.  
    - No message content configuration may cause empty posts or failure.

- **Delivery Note**  
  - *Type:* Sticky Note  
  - *Role:* Explains that Google Sheets archives all data, Slack alerts only on fresh updates.

---

### 3. Summary Table

| Node Name               | Node Type               | Functional Role                            | Input Node(s)            | Output Node(s)                     | Sticky Note                                                                                           |
|-------------------------|-------------------------|--------------------------------------------|--------------------------|-----------------------------------|-----------------------------------------------------------------------------------------------------|
| Daily Regulatory Poll    | Schedule Trigger        | Daily workflow trigger                      | -                        | Regulatory Sources                |                                                                                                     |
| Regulatory Sources       | Code                    | Generate list of regulatory URLs            | Daily Regulatory Poll     | Split URLs                      |                                                                                                     |
| Split URLs              | SplitInBatches          | Sequentially process each URL                | Regulatory Sources        | Scrape Regulatory Updates        | Source Intake Note (documents this intake stage)                                                    |
| Scrape Regulatory Updates| ScrapeGraphAI           | Extract structured regulatory updates       | Split URLs               | Flatten Updates                  | Processing & Filter Note (explains extraction and flattening)                                       |
| Flatten Updates         | Code                    | Flatten nested updates into individual items | Scrape Regulatory Updates | Filter Recent Updates            | Processing & Filter Note                                                                             |
| Filter Recent Updates   | Code                    | Filter updates from the last 24 hours        | Flatten Updates           | Log to Google Sheets, Send Compliance Alert | Processing & Filter Note                                                                             |
| Log to Google Sheets    | Google Sheets           | Append updates to Google Sheet archive        | Filter Recent Updates     | -                               | Delivery Note (archives all data)                                                                   |
| Send Compliance Alert   | Slack                   | Send Slack alert when fresh updates exist     | Filter Recent Updates     | -                               | Delivery Note (alerts compliance only on fresh updates)                                            |
| 📝 Overview             | Sticky Note             | Workflow overview and setup instructions      | -                        | -                               | Provides overall workflow description and setup steps                                               |
| Source Intake Note      | Sticky Note             | Documents intake block                         | -                        | -                               | Explains daily trigger and URL splitting                                                           |
| Processing & Filter Note| Sticky Note             | Documents extraction and filtering process    | -                        | -                               | Explains how ScrapeGraphAI data is processed                                                       |
| Delivery Note           | Sticky Note             | Documents data delivery and alerting steps    | -                        | -                               | Explains Google Sheets archiving and Slack alerting                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Name: "Daily Regulatory Poll"  
   - Set to trigger every 24 hours (hours interval = 24).  
   - Configure timezone and start time to suit your team’s schedule.

2. **Add a Code node**  
   - Name: "Regulatory Sources"  
   - Paste JavaScript to generate an array of URLs:  
     ```js
     const urls = [
       'https://www.sec.gov/news/pressreleases',
       'https://www.finra.org/rules-guidance/notices',
       'https://www.esma.europa.eu/press-news'
     ];
     return urls.map(url => ({
       json: {
         url,
         agency: url.includes('sec.gov') ? 'SEC' : url.includes('finra.org') ? 'FINRA' : 'ESMA'
       }
     }));
     ```
   - Connect output of "Daily Regulatory Poll" to this node.

3. **Add a SplitInBatches node**  
   - Name: "Split URLs"  
   - Connect input from "Regulatory Sources".  
   - Keep default options to process one URL at a time.

4. **Add a ScrapeGraphAI node**  
   - Name: "Scrape Regulatory Updates"  
   - Configure credentials for ScrapeGraphAI.  
   - Set `websiteUrl` parameter to `={{ $json.url }}`.  
   - Use this prompt:  
     ```
     Extract the five most recent regulatory or compliance updates from this page. Respond in JSON with the following schema: {"updates": [{"title": "string", "summary": "string", "date": "ISO_DATE", "agency": "string", "source_url": "string"}]}. If no updates are found, return {"updates": []}.
     ```
   - Connect input from "Split URLs".

5. **Add a Code node**  
   - Name: "Flatten Updates"  
   - Paste this script to flatten nested updates:  
     ```js
     const output = [];
     for (const item of $input.all()) {
       const agency = item.json.agency;
       const updates = item.json.updates || [];
       for (const update of updates) {
         output.push({
           json: {
             title: update.title || '',
             summary: update.summary || '',
             date: update.date || '',
             agency: update.agency || agency,
             source_url: update.source_url || item.json.url,
             scraped_at: new Date().toISOString()
           }
         });
       }
     }
     return output;
     ```
   - Connect input from "Scrape Regulatory Updates".

6. **Add another Code node**  
   - Name: "Filter Recent Updates"  
   - Paste this script to filter only last 24h updates:  
     ```js
     const ONE_DAY_MS = 24 * 60 * 60 * 1000;
     const now = Date.now();
     return $input.all().filter(item => {
       const dateMs = Date.parse(item.json.date);
       if (isNaN(dateMs)) return false; // discard if date unreadable
       return now - dateMs <= ONE_DAY_MS;
     });
     ```
   - Connect input from "Flatten Updates".

7. **Add a Google Sheets node**  
   - Name: "Log to Google Sheets"  
   - Configure Google Sheets credentials.  
   - Set operation to "Append".  
   - Specify Google Sheet document by URL or ID (replace `{{YOUR_SPREADSHEET_ID}}` with actual ID).  
   - Set sheet name to "RegUpdates".  
   - Map columns:  
     - Date → `={{ $json.date }}`  
     - Title → `={{ $json.title }}`  
     - Agency → `={{ $json.agency }}`  
     - Summary → `={{ $json.summary }}`  
     - Scraped At → `={{ $json.scraped_at }}`  
     - Source URL → `={{ $json.source_url }}`  
   - Connect input from "Filter Recent Updates".

8. **Add a Slack node**  
   - Name: "Send Compliance Alert"  
   - Configure Slack credentials and webhook ID.  
   - Set operation to "Post Message".  
   - Define message content as desired to alert compliance (e.g., summary of new updates).  
   - Connect input from "Filter Recent Updates".

9. **Add Sticky Notes** (optional but recommended for clarity)  
   - "📝 Overview" describing workflow purpose and setup steps.  
   - "Source Intake Note" explaining initial trigger and URL splitting.  
   - "Processing & Filter Note" explaining extraction and filtering logic.  
   - "Delivery Note" explaining final data archiving and alerting.

10. **Connect nodes according to the workflow:**  
    - Daily Regulatory Poll → Regulatory Sources → Split URLs → Scrape Regulatory Updates → Flatten Updates → Filter Recent Updates → [Log to Google Sheets & Send Compliance Alert]

11. **Test-run the workflow manually first**  
    - Confirm data extraction correctness.  
    - Check Google Sheets for appended rows.  
    - Verify Slack alerts appear only when fresh data is present.

---

### 5. General Notes & Resources

| Note Content                                                                                                                               | Context or Link                                                                                      |
|--------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| The prompt used in ScrapeGraphAI can be customized to extract additional fields as needed.                                                 | ScrapeGraphAI Node configuration                                                                    |
| Ensure Google Sheets API credentials have write access to the target document and that the sheet named "RegUpdates" exists or is created. | Google Sheets node setup                                                                             |
| Slack alerts require a valid webhook URL with appropriate permissions in the target channel.                                               | Slack node configuration                                                                             |
| Timezone consistency is critical: ensure all date fields and schedule trigger timezone match team expectations to avoid missing updates.  | Schedule Trigger and code date parsing                                                              |
| Workflow designed for 3 regulatory sites; updating or scaling requires modifying the `Regulatory Sources` code node.                      | Code node "Regulatory Sources"                                                                        |
| For more on scraping with AI-based tools, see ScrapeGraphAI official docs and best practices.                                              | https://scrapegraph.ai/                                                                              |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, a tool for integration and automation. The processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and publicly accessible.