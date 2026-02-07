Automate Job Search & Curation with JSearch API & Google Sheets

https://n8nworkflows.xyz/workflows/automate-job-search---curation-with-jsearch-api---google-sheets-7040


# Automate Job Search & Curation with JSearch API & Google Sheets

### 1. Workflow Overview

This workflow automates the process of searching for job listings based on roles pending in a Google Sheet, fetching matching job data from the JSearch API, filtering and formatting the results, and then writing valid job listings back to another Google Sheet. It also updates the source sheet to mark searched roles as "Scraped," enabling an ongoing, automated job curation system.

Logical blocks:

- **1.1 Trigger & Input**  
  Initiates the workflow on a daily schedule and reads one pending job search role (position + location) from a Google Sheet.

- **1.2 Job Search & Processing**  
  Queries the JSearch API using the input role, extracts individual job listings from the response, and filters out invalid or empty job entries.

- **1.3 Output & Status Update**  
  Writes the curated job listings to an output Google Sheet and marks the original input row as "Scraped" to prevent duplicate processing.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger & Input

**Overview:**  
This block triggers the workflow every day at 9 AM and fetches a single pending job role to search for from the source Google Sheet.

**Nodes Involved:**  
- ⏰ Schedule: Trigger Every Day  
- 📄 Read Pending Job Role from Sheet  

**Node Details:**

- **⏰ Schedule: Trigger Every Day**  
  - Type: Schedule Trigger  
  - Role: Initiates workflow execution daily at 9:00 AM.  
  - Configuration: Trigger set to run daily at hour 9 (9:00 AM).  
  - Inputs: None (starting point).  
  - Outputs: Triggers the next node to read input data.  
  - Edge cases: Workflow won’t run if the n8n instance is offline at trigger time. No retries configured here.  
  - Notes: Timezone defaults to n8n system time unless otherwise configured.

- **📄 Read Pending Job Role from Sheet**  
  - Type: Google Sheets (Read)  
  - Role: Reads the first row where "Status" column equals "Pending" from the "Job Scraper" Google Sheet.  
  - Configuration:  
    - Sheet: Sheet with `gid=0` (first sheet).  
    - Document ID: Parameterized by user (replace `Your_Sheet_ID`).  
    - Filter: Only rows with `Status = "Pending"`.  
    - Return first match only.  
  - Credentials: Google Sheets OAuth2 with "Google Sheets account - (DEV)".  
  - Inputs: Trigger node.  
  - Outputs: One row with fields including Position, Location, Status, and row_number.  
  - Edge cases:  
    - No rows with "Pending" status → output empty, downstream nodes may fail or do nothing.  
    - Auth errors if credentials expire or are revoked.  
  - Notes: Relies on the sheet having proper column headers exactly named "Status", "Position", "Location".

#### 1.2 Job Search & Processing

**Overview:**  
This block sends a constructed query (Position + Location) to the JSearch API, extracts job listings from the API response, and filters out invalid jobs.

**Nodes Involved:**  
- 🌐 Search Jobs via JSearch API  
- 🧠 Extract Job Data from API Response  
- 🔍 Filter Valid Job Listings  

**Node Details:**

- **🌐 Search Jobs via JSearch API**  
  - Type: HTTP Request  
  - Role: Queries the JSearch API hosted on RapidAPI with the job search query.  
  - Configuration:  
    - URL: `https://jsearch.p.rapidapi.com/search`  
    - Query parameters:  
      - `query`: dynamically constructed as `"Position in Location"` using expression `={{ $json.Position + ' in ' + $json.Location }}`  
      - `page`: 1  
      - `num_pages`: 1  
    - Headers:  
      - `X-RapidAPI-Key`: placeholder `YOUR_RAPIDAPI_KEY` (must be replaced)  
      - `X-RapidAPI-Host`: `jsearch.p.rapidapi.com`  
  - Inputs: Google Sheets read node output (Position + Location).  
  - Outputs: Raw API response JSON.  
  - Edge cases:  
    - Missing or invalid API key → 401 Unauthorized.  
    - API rate limits exceeded → 429 Too Many Requests.  
    - Network timeouts or connectivity issues.  
    - Empty or malformed API response.  

- **🧠 Extract Job Data from API Response**  
  - Type: Code (JavaScript)  
  - Role: Parses the API response, extracts relevant job fields, and formats them into individual job items.  
  - Configuration:  
    - Loops over each item's `data` array from the response.  
    - For each job, extracts `job_title`, `employer_name`, formatted location, apply link, remote status, and posted date.  
    - Returns flat array of job objects.  
  - Inputs: HTTP Request node output.  
  - Outputs: Array of job listing JSON objects with standardized fields.  
  - Edge cases:  
    - API response missing `data` property → returns empty array, no error thrown.  
    - Unexpected data structure → potential code failure.  
  - Version: Uses v2 of Code node (supports JS).  

- **🔍 Filter Valid Job Listings**  
  - Type: Filter  
  - Role: Filters out any job listings where the `title` field does not exist or is empty.  
  - Configuration:  
    - Condition: `title` field must exist (non-empty string).  
  - Inputs: Code node output.  
  - Outputs: Only valid job listings.  
  - Edge cases: Jobs without title filtered out silently; if all jobs filtered, downstream nodes get empty input.

#### 1.3 Output & Status Update

**Overview:**  
This block writes the filtered job listings to an output Google Sheet and updates the original row in the source sheet to mark it as processed.

**Nodes Involved:**  
- 📊 Write Jobs to Output Sheet  
- ✅ Mark Job as Scraped in Source Sheet  

**Node Details:**

- **📊 Write Jobs to Output Sheet**  
  - Type: Google Sheets (Append or Update)  
  - Role: Writes job listings into the "Job Listing" Google Sheet, appending new entries or updating existing ones based on the apply link.  
  - Configuration:  
    - Document ID: Parameterized (replace `Your_Sheet_ID`).  
    - Sheet: First sheet (`gid=0`).  
    - Columns mapped: Title, Company, Location, Is Remote, Posted On, Apply Link.  
    - Matching column for update: `Apply Link`.  
    - Operation: Append or update existing rows to avoid duplicates.  
  - Credentials: Same Google Sheets OAuth2 account.  
  - Inputs: Filter node output (validated job listings).  
  - Outputs: Passes data to next node.  
  - Edge cases:  
    - Google Sheets API limits or quota exceeded.  
    - Data type mismatch or invalid values (e.g., null fields).  

- **✅ Mark Job as Scraped in Source Sheet**  
  - Type: Google Sheets (Update)  
  - Role: Updates the original pending job role row by setting `Status` to "Scraped" to avoid reprocessing.  
  - Configuration:  
    - Document ID: Parameterized (replace `Your_Sheet_ID`).  
    - Sheet: First sheet (`gid=0`).  
    - Operation: Update row matching on `row_number` field from the original read row.  
    - Columns updated: Status = "Scraped".  
    - `executeOnce`: true (ensures only one update per workflow).  
  - Credentials: Same Google Sheets OAuth2 account.  
  - Inputs: Output sheet write node output (though it only needs the original row number).  
  - Outputs: None downstream (final node).  
  - Edge cases:  
    - If `row_number` is missing or wrong, update may fail or update wrong row.  
    - Auth or quota errors on Google Sheets.  

---

### 3. Summary Table

| Node Name                         | Node Type             | Functional Role                        | Input Node(s)                   | Output Node(s)                 | Sticky Note                                                                                                  |
|----------------------------------|-----------------------|-------------------------------------|-------------------------------|-------------------------------|--------------------------------------------------------------------------------------------------------------|
| ⏰ Schedule: Trigger Every Day    | Schedule Trigger      | Initiates workflow daily at 9 AM    | None                          | 📄 Read Pending Job Role from Sheet | ## Trigger & Input • Triggers the workflow on a defined hourly interval. • Fetches a single row from the "Job Scraper" sheet where Status = "Pending". • This row includes 'Position' and 'Location' values for the job search. |
| 📄 Read Pending Job Role from Sheet | Google Sheets (Read)  | Reads a pending job role from sheet | ⏰ Schedule: Trigger Every Day | 🌐 Search Jobs via JSearch API  | ## Trigger & Input • Triggers the workflow on a defined hourly interval. • Fetches a single row from the "Job Scraper" sheet where Status = "Pending". • This row includes 'Position' and 'Location' values for the job search. |
| 🌐 Search Jobs via JSearch API    | HTTP Request          | Queries JSearch API with Position + Location | 📄 Read Pending Job Role from Sheet | 🧠 Extract Job Data from API Response | ## Job Search & Processing • Sends query (Position + Location) to the JSearch API. • Parses the API response and extracts individual job listings. • Filters out empty or invalid results to ensure clean output. |
| 🧠 Extract Job Data from API Response | Code (JavaScript)     | Extracts and formats job listings from API response | 🌐 Search Jobs via JSearch API | 🔍 Filter Valid Job Listings    | ## Job Search & Processing • Sends query (Position + Location) to the JSearch API. • Parses the API response and extracts individual job listings. • Filters out empty or invalid results to ensure clean output. |
| 🔍 Filter Valid Job Listings      | Filter                | Filters out invalid/empty job listings | 🧠 Extract Job Data from API Response | 📊 Write Jobs to Output Sheet   | ## Job Search & Processing • Sends query (Position + Location) to the JSearch API. • Parses the API response and extracts individual job listings. • Filters out empty or invalid results to ensure clean output. |
| 📊 Write Jobs to Output Sheet     | Google Sheets (Append/Update) | Writes valid jobs to output sheet    | 🔍 Filter Valid Job Listings    | ✅ Mark Job as Scraped in Source Sheet | ## Output & Status Update • Writes valid jobs to the "Job Listing" sheet with fields like title, location, company, etc. • Marks the original row in the source sheet as "Scraped" using the row number for tracking. |
| ✅ Mark Job as Scraped in Source Sheet | Google Sheets (Update) | Marks original job role as "Scraped" | 📊 Write Jobs to Output Sheet   | None                          | ## Output & Status Update • Writes valid jobs to the "Job Listing" sheet with fields like title, location, company, etc. • Marks the original row in the source sheet as "Scraped" using the row number for tracking. |
| Sticky Note                      | Sticky Note           | Documentation for Trigger & Input   | None                          | None                          | ## Trigger & Input • Triggers the workflow on a defined hourly interval. • Fetches a single row from the "Job Scraper" sheet where Status = "Pending". • This row includes 'Position' and 'Location' values for the job search. |
| Sticky Note1                     | Sticky Note           | Documentation for Job Search & Processing | None                          | None                          | ## Job Search & Processing • Sends query (Position + Location) to the JSearch API. • Parses the API response and extracts individual job listings. • Filters out empty or invalid results to ensure clean output. |
| Sticky Note2                     | Sticky Note           | Documentation for Output & Status Update | None                          | None                          | ## Output & Status Update • Writes valid jobs to the "Job Listing" sheet with fields like title, location, company, etc. • Marks the original row in the source sheet as "Scraped" using the row number for tracking. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger node**  
   - Name: `⏰ Schedule: Trigger Every Day`  
   - Type: Schedule Trigger  
   - Set to trigger daily at 9:00 AM (hour 9, no minutes).  
   - Connect no input, output connects to next node.

2. **Add Google Sheets node to read pending job role**  
   - Name: `📄 Read Pending Job Role from Sheet`  
   - Type: Google Sheets (Read)  
   - Credentials: Connect your Google Sheets OAuth2 account.  
   - Document ID: Enter your source sheet ID (where job roles are stored).  
   - Sheet Name: Use sheet with `gid=0` (first sheet).  
   - Filters: Set filter to only fetch rows where column "Status" equals "Pending".  
   - Return only the first match (single row).  
   - Connect input from Schedule Trigger node.

3. **Add HTTP Request node for JSearch API query**  
   - Name: `🌐 Search Jobs via JSearch API`  
   - Type: HTTP Request  
   - URL: `https://jsearch.p.rapidapi.com/search`  
   - Method: GET  
   - Query Parameters:  
     - `query`: Use expression `{{$json.Position + ' in ' + $json.Location}}`  
     - `page`: 1  
     - `num_pages`: 1  
   - Header Parameters:  
     - `X-RapidAPI-Key`: Your RapidAPI key for JSearch API  
     - `X-RapidAPI-Host`: `jsearch.p.rapidapi.com`  
   - Connect input from Google Sheets read node.

4. **Add Code node to extract job data**  
   - Name: `🧠 Extract Job Data from API Response`  
   - Type: Code (JavaScript)  
   - Paste the following JS code:

     ```javascript
     const allItems = [];

     for (const item of items) {
       const jobs = item.json.data || [];
       for (const job of jobs) {
         allItems.push({
           json: {
             title: job.job_title,
             company: job.employer_name,
             location: `${job.job_city}, ${job.job_country}`,
             apply_link: job.job_apply_link,
             is_remote: job.job_is_remote,
             posted_date: job.job_posted_at_datetime_utc,
           }
         });
       }
     }

     return allItems;
     ```

   - Connect input from HTTP Request node.

5. **Add Filter node to validate job listings**  
   - Name: `🔍 Filter Valid Job Listings`  
   - Type: Filter  
   - Condition: Check that field `title` exists and is not empty (exists operator).  
   - Connect input from Code node.

6. **Add Google Sheets node to write jobs to output sheet**  
   - Name: `📊 Write Jobs to Output Sheet`  
   - Type: Google Sheets (Append or Update)  
   - Credentials: Use Google Sheets OAuth2 account.  
   - Document ID: Enter your output sheet ID where jobs will be listed.  
   - Sheet Name: Use first sheet (`gid=0`).  
   - Mapping: Map fields as follows:  
     - Title → `title`  
     - Company → `company`  
     - Location → `location`  
     - Is Remote → `is_remote`  
     - Posted On → `posted_date`  
     - Apply Link → `apply_link`  
   - Set "Matching Columns" to `Apply Link` to avoid duplicates.  
   - Operation: Append or Update.  
   - Connect input from Filter node.

7. **Add Google Sheets node to mark original job role as scraped**  
   - Name: `✅ Mark Job as Scraped in Source Sheet`  
   - Type: Google Sheets (Update)  
   - Credentials: Use same Google Sheets OAuth2 account.  
   - Document ID: Same as source sheet ID.  
   - Sheet Name: First sheet (`gid=0`).  
   - Operation: Update row matching on `row_number` (use expression to get original row number: `{{$node["📄 Read Pending Job Role from Sheet"].json["row_number"]}}`).  
   - Set field `Status` to "Scraped".  
   - Enable `Execute Once` to avoid multiple updates if multiple job listings are processed.  
   - Connect input from Write Jobs node.

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                                                                   |
|-------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| The workflow requires a valid RapidAPI key for the JSearch API. Replace `YOUR_RAPIDAPI_KEY` accordingly. | https://rapidapi.com/apidojo/api/jsearch/                                                      |
| Google Sheets document IDs must be replaced with your actual sheet IDs in the nodes.             | Google Sheets URL pattern: `https://docs.google.com/spreadsheets/d/<DOCUMENT_ID>/edit`          |
| Time zone of schedule trigger defaults to server local time; adjust if needed in node settings.  | n8n schedule trigger documentation                                                               |
| The "Status" and "row_number" columns are essential in source sheet for filtering and updates.  | Ensure correct spelling and data format in your Google Sheets columns.                            |
| For best reliability, monitor API quotas and handle possible errors by adding error workflows or retries. | n8n documentation on error handling and retries                                                  |

---

**Disclaimer:** This document is derived solely from an n8n workflow JSON export. It respects content policies and contains no illegal or protected data. All data used are publicly accessible or user-provided.