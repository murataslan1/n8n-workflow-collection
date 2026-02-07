 Automated Investor Intelligence: CrunchBase to Google Sheets Data Harvester

https://n8nworkflows.xyz/workflows/-automated-investor-intelligence--crunchbase-to-google-sheets-data-harvester-4731


#  Automated Investor Intelligence: CrunchBase to Google Sheets Data Harvester

---

### 1. Workflow Overview

This workflow, titled **Automated Investor Intelligence: CrunchBase to Google Sheets Data Harvester**, is designed to **automatically extract, process, and store investor data from Crunchbase into a Google Sheets spreadsheet on a daily basis**. Its main purpose is to provide an up-to-date, clean dataset of investor profiles for market research, outreach planning, or competitive analysis without manual intervention.

The workflow is logically divided into two principal blocks:

- **1.1 Data Acquisition**  
  Scheduled triggering and fetching of raw investor data from Crunchbase via its API.

- **1.2 Data Processing & Storage**  
  Cleaning and formatting the fetched data followed by appending it into a specified Google Sheets document for further use.

---

### 2. Block-by-Block Analysis

#### 1.1 Data Acquisition

**Overview:**  
This block initiates the workflow on a scheduled basis and makes an API call to Crunchbase to retrieve investor organization data filtered by specific fields and criteria.

**Nodes Involved:**  
- Daily Investor Data Trigger  
- Fetch Crunchbase Investor Data

---

**Node: Daily Investor Data Trigger**  
- **Type & Role:** Schedule Trigger node; initiates workflow execution automatically at a defined time daily.  
- **Configuration:** Set to trigger once per day at 9:00 AM server time.  
- **Expressions/Variables:** None used; fixed interval trigger.  
- **Input/Output:** No input; output triggers next node.  
- **Version Requirements:** Uses v1.2 of schedule trigger node, no special requirements.  
- **Edge Cases/Potential Failures:** Workflow will not run if n8n is offline or if system time is misconfigured.  
- **Sub-workflow:** None.

---

**Node: Fetch Crunchbase Investor Data**  
- **Type & Role:** HTTP Request node; performs POST request to Crunchbase API to retrieve investor data.  
- **Configuration:**  
  - URL: `https://api.crunchbase.com/api/v4/searches/organizations`  
  - HTTP Method: POST  
  - Request Body (JSON): Filters for organizations of type `investor` with fields `identifier`, `name`, `short_description`, `location_identifiers`, `investment_stage`. Limit set to 5 results.  
  - Headers: Authorization Bearer token header with placeholder `YOUR_CRUNCHBASE_API_KEY` (must be replaced with valid API key).  
  - Sends JSON body and headers.  
- **Expressions/Variables:** Static JSON body; authorization token must be updated with valid credentials.  
- **Input/Output:** Input from Schedule Trigger; output is JSON response containing investor entities.  
- **Version Requirements:** Node version 4.2 used, compatible with n8n recent versions.  
- **Edge Cases/Potential Failures:**  
  - Authentication failure if API key invalid or missing.  
  - API rate limits or downtime causing HTTP errors.  
  - Empty or malformed JSON response.  
- **Sub-workflow:** None.

---

#### 1.2 Data Processing & Storage

**Overview:**  
This block takes the raw Crunchbase data, extracts relevant fields using JavaScript code, and appends the cleaned data rows into a Google Sheets document for persistent storage and further analysis.

**Nodes Involved:**  
- Extract Investor Fields  
- Append to Investor Sheet

---

**Node: Extract Investor Fields**  
- **Type & Role:** Code node running JavaScript to parse and transform API response data.  
- **Configuration:**  
  - JavaScript code extracts the array `entities` from the first item’s JSON, then maps each entity to an object containing:  
    - `name`  
    - `short_description`  
    - `location_identifiers`  
    - `investment_stage`  
- **Expressions/Variables:** Accesses `items[0].json.entities` from incoming data.  
- **Input/Output:** Input from HTTP Request (Crunchbase data); output is an array of cleaned JSON objects, each corresponding to an investor.  
- **Version Requirements:** Uses JavaScript runtime; requires node version 2.  
- **Edge Cases/Potential Failures:**  
  - If `entities` is undefined or empty, output will be empty array.  
  - Unexpected data formats may cause runtime errors.  
- **Sub-workflow:** None.

---

**Node: Append to Investor Sheet**  
- **Type & Role:** Google Sheets node; appends data rows to a specific Google Sheet.  
- **Configuration:**  
  - Operation: Append rows.  
  - Spreadsheet ID: `1XOUvOgrhDdOorEj0-TL4EiVygMd1wpD3cktI2_bm-Ww` (must have edit access).  
  - Sheet Name / GID: `gid=0` (Sheet1).  
  - Columns mapped explicitly:  
    - Name → `{{$json.name}}`  
    - Location → `{{$json.location_identifiers}}`  
    - Investment Stage → `{{$json.investment_stage}}`  
    - Short description → `{{$json.short_description}}`  
  - Mapping mode: Manual definition below.  
- **Credentials:** Uses OAuth2 credentials for Google Sheets (`Google Sheets account`).  
- **Expressions/Variables:** Field values mapped from incoming JSON data.  
- **Input/Output:** Input is cleaned investor data from Code node; output is appended rows in the spreadsheet.  
- **Version Requirements:** Node version 4.5 used, compatible with current n8n versions.  
- **Edge Cases/Potential Failures:**  
  - Authentication failure if OAuth token expired or revoked.  
  - Spreadsheet ID or Sheet name incorrect or inaccessible.  
  - Data type mismatches or empty fields.  
- **Sub-workflow:** None.

---

### 3. Summary Table

| Node Name                  | Node Type           | Functional Role                     | Input Node(s)               | Output Node(s)          | Sticky Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|----------------------------|---------------------|-----------------------------------|-----------------------------|-------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Daily Investor Data Trigger | Schedule Trigger    | Triggers workflow daily at 9 AM   | None                        | Fetch Crunchbase Investor Data | 🔷 **SECTION 1: Getting the Data from Crunchbase**<br>Starts workflow automatically at scheduled time to pull investor data without manual effort.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Fetch Crunchbase Investor Data | HTTP Request       | Fetches investor data from Crunchbase API | Daily Investor Data Trigger | Extract Investor Fields  | 🔷 **SECTION 1: Getting the Data from Crunchbase**<br>Sends POST request filtering organizations of type investor and retrieves key fields as JSON.<br> https://data.crunchbase.com/docs                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Extract Investor Fields     | Code                | Parses and extracts relevant fields from API data | Fetch Crunchbase Investor Data | Append to Investor Sheet | 🔷 **SECTION 2: Processing and Saving the Data**<br>Transforms raw JSON to clean format containing name, description, location, and investment stage for each investor.<br>                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Append to Investor Sheet    | Google Sheets       | Adds extracted investor data as rows in Google Sheet | Extract Investor Fields      | None                    | 🔷 **SECTION 2: Processing and Saving the Data**<br>Appends clean investor data into a Google Sheet for ongoing tracking and analysis.<br>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Sticky Note                 | Sticky Note         | Documentation and explanations for sections 1 & 2 of workflow | None                        | None                    | See above notes for detailed explanations of Section 1 and Section 2 nodes and their roles.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Sticky Note1                | Sticky Note         | Detailed overview of data processing and storage | None                        | None                    | See above notes detailing Section 2 processing and storage benefits.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Sticky Note4                | Sticky Note         | Full workflow narrative and step explanations | None                        | None                    | Comprehensive description of both sections, benefits, and final outcomes for the workflow.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Sticky Note9                | Sticky Note         | Support and contact information   | None                        | None                    | Workflow assistance contact: Yaron@nofluff.online<br>YouTube: https://www.youtube.com/@YaronBeen/videos<br>LinkedIn: https://www.linkedin.com/in/yaronbeen/                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Add a **Schedule Trigger** node named `Daily Investor Data Trigger`.  
   - Set to trigger daily at 9:00 AM (server time).  
   - No inputs; this node starts the workflow.

2. **Create HTTP Request Node**  
   - Add an **HTTP Request** node named `Fetch Crunchbase Investor Data`.  
   - Connect output of `Daily Investor Data Trigger` to this node’s input.  
   - Configure:  
     - Method: POST  
     - URL: `https://api.crunchbase.com/api/v4/searches/organizations`  
     - Headers: Add header `Authorization: Bearer YOUR_CRUNCHBASE_API_KEY` (replace `YOUR_CRUNCHBASE_API_KEY` with your actual Crunchbase API key).  
     - Body Content Type: JSON  
     - JSON Body:  
       ```json
       {
         "field_ids": [
           "identifier",
           "name",
           "short_description",
           "location_identifiers",
           "investment_stage"
         ],
         "query": [
           {
             "type": "predicate",
             "field_id": "organization_types",
             "operator_id": "includes",
             "values": ["investor"]
           }
         ],
         "limit": 5
       }
       ```  
     - Ensure "Send Body" and "Send Headers" are enabled.

3. **Add Code Node for Data Extraction**  
   - Add a **Code** node named `Extract Investor Fields`.  
   - Connect output of `Fetch Crunchbase Investor Data` to this node.  
   - Configure JavaScript code as:  
     ```javascript
     const entities = items[0].json.entities || [];

     return entities.map(entity => {
       return {
         json: {
           name: entity.name,
           short_description: entity.short_description,
           location_identifiers: entity.location_identifiers,
           investment_stage: entity.investment_stage
         }
       };
     });
     ```  
   - This converts raw API data into an array of cleaned objects.

4. **Add Google Sheets Node to Append Data**  
   - Add a **Google Sheets** node named `Append to Investor Sheet`.  
   - Connect output of `Extract Investor Fields` to this node.  
   - Configure:  
     - Operation: Append  
     - Document ID: `1XOUvOgrhDdOorEj0-TL4EiVygMd1wpD3cktI2_bm-Ww` (replace with your own spreadsheet ID if needed).  
     - Sheet Name: Use sheet with GID `gid=0` (usually the first sheet named "Sheet1").  
     - Columns mapping:  
       - Name → `={{ $json.name }}`  
       - Location → `={{ $json.location_identifiers }}`  
       - Investment Stage → `={{ $json.investment_stage }}`  
       - Short description → `={{ $json.short_description }}`  
     - Mapping mode: Define columns explicitly.  
   - Under Credentials, select or create OAuth2 credentials for Google Sheets API access.

5. **Validate Credentials & Test**  
   - Ensure Crunchbase API key is valid and authorized for your account.  
   - Ensure Google Sheets OAuth2 credentials have edit permission on the target spreadsheet.  
   - Run workflow manually or wait for scheduled trigger to ensure data flows correctly.

6. **Optional: Add Sticky Notes for Documentation**  
   - Add Sticky Note nodes to document workflow sections as per the original.  
   - This improves maintainability and clarity.

---

### 5. General Notes & Resources

| Note Content                                                                                 | Context or Link                                                                                      |
|----------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Crunchbase API documentation for custom queries and data fields.                            | https://data.crunchbase.com/docs                                                                   |
| Google Sheets OAuth2 setup instructions and API scopes needed for n8n integration.          | https://developers.google.com/sheets/api/guides/authorizing                                        |
| Workflow assistance and contact: Yaron@nofluff.online                                      | Support contact for workflow questions                                                             |
| YouTube Channel with n8n workflow tips and automation strategies:                            | https://www.youtube.com/@YaronBeen/videos                                                          |
| LinkedIn profile with professional automation insights:                                     | https://www.linkedin.com/in/yaronbeen/                                                             |

---

**Disclaimer:**  
The content provided is derived solely from an automated n8n workflow. It adheres strictly to content policies and contains no illegal, offensive, or protected elements. All data processed is legal and publicly accessible.

---