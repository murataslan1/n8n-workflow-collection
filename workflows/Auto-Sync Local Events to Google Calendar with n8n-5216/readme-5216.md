Auto-Sync Local Events to Google Calendar with n8n

https://n8nworkflows.xyz/workflows/auto-sync-local-events-to-google-calendar-with-n8n-5216


# Auto-Sync Local Events to Google Calendar with n8n

---

## 1. Workflow Overview

This workflow, titled **Auto-Sync Local Events to Google Calendar with n8n**, automates the process of fetching community event data from a local government or library webpage, cleaning and structuring that data, and then creating corresponding events in a Google Calendar. It is designed to run daily, ensuring the calendar remains up-to-date without manual intervention.

### Logical Blocks:

- **1.1 Event Data Fetcher:** Trigger and fetch raw event page HTML via a proxy service to avoid bot detection.
- **1.2 Smart Event Extractor:** Parse the raw HTML to extract event details, then clean and format this data, including time conversion.
- **1.3 Auto Calendar Creator:** Create Google Calendar events based on the cleaned data.

---

## 2. Block-by-Block Analysis

### 1.1 Event Data Fetcher

**Overview:**  
This block triggers the workflow daily at a scheduled time and fetches the raw HTML content of the event page using a proxy to circumvent site protections.

**Nodes Involved:**  
- Daily Event Sync Trigger  
- Fetch Event Page (Bright Data)

#### Node: Daily Event Sync Trigger  
- **Type:** Schedule Trigger  
- **Role:** Starts the workflow daily at a specific hour (8:00 AM).  
- **Configuration:** Runs every day at 8 AM local time.  
- **Inputs:** None (trigger node).  
- **Outputs:** Triggers the next node, "Fetch Event Page (Bright Data)".  
- **Edge Cases:** If n8n server is down or paused at trigger time, workflow won't start. Timezone issues may affect trigger timing if not set properly.  
- **Sticky Note:** Explains the importance of scheduling to keep calendar updated.

#### Node: Fetch Event Page (Bright Data)  
- **Type:** HTTP Request  
- **Role:** Makes a POST request to Bright Data’s API to fetch the raw HTML of the target event page, using a proxy to bypass blocks or bot detection.  
- **Configuration:**  
  - URL: `https://api.brightdata.com/request`  
  - Method: POST  
  - Body Parameters include:  
    - zone: `n8n_unblocker` (Bright Data proxy zone)  
    - url: `https://www.nypl.org/events/calendar` (target event page)  
    - country: `us`  
    - format: `raw` (request raw HTML)  
  - Headers include Bearer token for authorization (`API_KEY` placeholder).  
- **Inputs:** Triggered by "Daily Event Sync Trigger".  
- **Outputs:** Passes raw HTML response to the next node "Extract Event Data (HTML Parser)".  
- **Edge Cases:**  
  - API key invalid or expired → auth failure.  
  - Proxy zone misconfiguration → request failure.  
  - Target URL changes or becomes inaccessible → response errors.  
  - Bright Data service downtime or rate limits.  
- **Sticky Note:** Highlights use of Bright Data proxy for reliable scraping of protected sites.

---

### 1.2 Smart Event Extractor

**Overview:**  
This block parses the fetched HTML to extract structured event data using CSS selectors, then cleans and formats this data, particularly converting times into ISO 8601 format suitable for Google Calendar.

**Nodes Involved:**  
- Extract Event Data (HTML Parser)  
- Clean & Format Event Data

#### Node: Extract Event Data (HTML Parser)  
- **Type:** HTML Parser  
- **Role:** Parses raw HTML to extract arrays of event titles, locations, audiences, and times using CSS selectors.  
- **Configuration:**  
  - Operation: Extract HTML content  
  - Extraction Values (CSS selectors):  
    - Title: `.event-title`  
    - Location: `.event-location`  
    - Audience: `.event-audience`  
    - Time: `.event-time`  
  - Returns arrays for each selector's matched elements.  
- **Inputs:** Receives raw HTML from "Fetch Event Page (Bright Data)".  
- **Outputs:** JSON object with arrays of extracted data to "Clean & Format Event Data".  
- **Edge Cases:**  
  - Selector mismatch due to website changes → missing or empty arrays.  
  - Empty pages or malformed HTML → parsing errors or empty output.  
- **Sticky Note:** Describes purpose of turning messy HTML into structured data.

#### Node: Clean & Format Event Data  
- **Type:** Code (JavaScript)  
- **Role:** Processes extracted arrays to:  
  - Remove invalid time entries (headers or placeholders).  
  - Ensure aligned counts of titles, locations, audiences, and times.  
  - Parse times like "Today @ 10 AM" into ISO 8601 strings with timezone offset.  
  - Build an array of event objects with cleaned and enriched data fields.  
- **Configuration:** Custom JavaScript code that:  
  - Filters invalid time labels.  
  - Converts times to ISO strings with timezone offset.  
  - Constructs final event JSON including title, description, location, audience, start/end times, and a source URL derived from title content.  
- **Inputs:** Receives extracted arrays from "Extract Event Data (HTML Parser)".  
- **Outputs:** Array of structured events to "Create Google Calendar Events".  
- **Edge Cases:**  
  - Unexpected time formats → parseTimeToISO returns null, resulting in null start/end times.  
  - Mismatched array lengths handled by limiting event count to smallest array size.  
  - Missing fields or empty strings handled gracefully.  
- **Sticky Note:** Emphasizes this node as the workflow's "brain" for data validation and formatting.

---

### 1.3 Auto Calendar Creator

**Overview:**  
This block creates or updates Google Calendar events based on the cleaned event data, automatically publishing them to a community calendar.

**Nodes Involved:**  
- Create Google Calendar Events

#### Node: Create Google Calendar Events  
- **Type:** Google Calendar  
- **Role:** Creates events in a specified Google Calendar using the cleaned event data.  
- **Configuration:**  
  - Calendar: Selected from Google Calendar account's calendar list (specific calendar ID used).  
  - Start: Uses `start.dateTime` from input JSON.  
  - End: Uses `end.dateTime` from input JSON.  
  - Description: Composed with event details including title, description, location, audience, and time.  
  - Additional fields: Empty attendees list.  
- **Inputs:** Receives structured event data array from "Clean & Format Event Data".  
- **Outputs:** Creates events in Google Calendar; no further nodes connected.  
- **Credentials:** Uses Google Calendar OAuth2 credentials configured in n8n.  
- **Edge Cases:**  
  - Invalid or null date/time → event creation may fail or be skipped.  
  - Credential expiration or revocation → auth errors.  
  - API quota limits or network errors.  
- **Sticky Note:** Notes this node as the final step, publishing events automatically.

---

## 3. Summary Table

| Node Name                     | Node Type            | Functional Role                      | Input Node(s)               | Output Node(s)                  | Sticky Note                                                                                  |
|-------------------------------|----------------------|------------------------------------|-----------------------------|--------------------------------|----------------------------------------------------------------------------------------------|
| Daily Event Sync Trigger       | Schedule Trigger     | Triggers workflow daily at 8 AM    | None                        | Fetch Event Page (Bright Data)  | Sets when automation runs to keep calendar updated.                                          |
| Fetch Event Page (Bright Data) | HTTP Request        | Fetches raw event page HTML via proxy | Daily Event Sync Trigger     | Extract Event Data (HTML Parser) | Uses Bright Data proxy to bypass bot protection and get raw HTML.                            |
| Extract Event Data (HTML Parser)| HTML Parser         | Extracts event details from HTML   | Fetch Event Page (Bright Data)| Clean & Format Event Data        | Parses messy HTML into structured data arrays (title, location, audience, time).             |
| Clean & Format Event Data      | Code (JavaScript)   | Cleans, matches, and formats data  | Extract Event Data (HTML Parser)| Create Google Calendar Events    | Brain node: filters invalid data, converts times to ISO, aligns arrays for event creation.   |
| Create Google Calendar Events  | Google Calendar     | Creates events in Google Calendar  | Clean & Format Event Data     | None                           | Publishes events with proper date/time and full description to Google Calendar.              |
| Sticky Note                   | Sticky Note          | Documentation and explanations     | None                        | None                           | Covers Section 1: Event Data Fetcher                                                        |
| Sticky Note1                  | Sticky Note          | Documentation and explanations     | None                        | None                           | Covers Section 2: Smart Event Extractor                                                     |
| Sticky Note2                  | Sticky Note          | Documentation and explanations     | None                        | None                           | Covers Section 3: Auto Calendar Creator                                                    |
| Sticky Note4                  | Sticky Note          | Full workflow overview and details | None                        | None                           | Full detailed documentation and summary of workflow benefits                               |
| Sticky Note5                  | Sticky Note          | Affiliate link for Bright Data     | None                        | None                           | Contains Bright Data affiliate link                                                        |
| Sticky Note9                  | Sticky Note          | Contact and support info            | None                        | None                           | Workflow assistance and contact information                                                |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Name: `Daily Event Sync Trigger`  
   - Type: Schedule Trigger  
   - Set to trigger daily at 8:00 AM local time.

2. **Create an HTTP Request node**  
   - Name: `Fetch Event Page (Bright Data)`  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.brightdata.com/request`  
   - Body Parameters (as JSON or form):  
     - `zone`: `n8n_unblocker`  
     - `url`: `https://www.nypl.org/events/calendar`  
     - `country`: `us`  
     - `format`: `raw`  
   - Header Parameters:  
     - `Authorization`: `Bearer API_KEY` (replace `API_KEY` with your actual Bright Data API token)  
   - Connect output of `Daily Event Sync Trigger` to this node.

3. **Create an HTML node**  
   - Name: `Extract Event Data (HTML Parser)`  
   - Operation: Extract HTML Content  
   - Extraction Values (add multiple):  
     - Key: `Title`, CSS Selector: `.event-title`, Return Array: true  
     - Key: `Location`, CSS Selector: `.event-location`, Return Array: true  
     - Key: `Audience`, CSS Selector: `.event-audience`, Return Array: true  
     - Key: `Time`, CSS Selector: `.event-time`, Return Array: true  
   - Connect output of `Fetch Event Page (Bright Data)` to this node.

4. **Create a Code node**  
   - Name: `Clean & Format Event Data`  
   - Language: JavaScript  
   - Paste the provided JavaScript code that:  
     - Filters invalid time labels (`"Date/Time"`, etc.)  
     - Matches array lengths to avoid overflow  
     - Parses time strings like `"Today @ 10 AM"` to ISO 8601 with timezone offset  
     - Constructs structured event objects with keys: `title`, `description`, `location`, `audience`, `time`, `start.dateTime`, `end.dateTime`, `sourceUrl`  
   - Connect output of `Extract Event Data (HTML Parser)` to this node.

5. **Create a Google Calendar node**  
   - Name: `Create Google Calendar Events`  
   - Operation: Create Event  
   - Set Calendar: Select or enter calendar ID (e.g., a shared community calendar)  
   - Set Start Time: `={{ $json.start.dateTime }}`  
   - Set End Time: `={{ $json.end.dateTime }}`  
   - Additional Fields → Description:  
     ```
     Title: {{ $json.title }}
     Description: {{ $json.description }}
     Location: {{ $json.location }}
     Audience: {{ $json.audience }}
     Time: {{ $json.time }}
     ```  
   - Set Attendees: empty array (optional)  
   - Configure Google Calendar OAuth2 credentials in n8n for this node to authenticate.  
   - Connect output of `Clean & Format Event Data` to this node.

6. **(Optional) Add Sticky Notes**  
   - Create sticky notes to document sections as per the original workflow, especially for clarity in complex workflows.

7. **Test and Activate**  
   - Test the workflow manually or wait for scheduled trigger.  
   - Monitor for errors such as auth failures, parsing errors, or empty event arrays.  
   - Adjust CSS selectors or Bright Data parameters if website structure changes.

---

## 5. General Notes & Resources

| Note Content                                                                                                        | Context or Link                                                                                           |
|---------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| The workflow uses Bright Data proxy service to bypass bot detection and access protected or dynamic web content.   | https://get.brightdata.com/1tndi4600b25 (affiliate link)                                                |
| For support or questions about this workflow, contact Yaron at Yaron@nofluff.online                                 | Contact email                                                                                            |
| Additional tips and video content for n8n automation available on YouTube and LinkedIn by Yaron Been                | - YouTube: https://www.youtube.com/@YaronBeen/videos<br>- LinkedIn: https://www.linkedin.com/in/yaronbeen/ |
| This workflow is designed to keep a public Google Calendar updated automatically with community event data.         | Useful for embedding in websites, sharing with community, or subscription.                               |

---

**Disclaimer:**  
The text provided is exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.

---