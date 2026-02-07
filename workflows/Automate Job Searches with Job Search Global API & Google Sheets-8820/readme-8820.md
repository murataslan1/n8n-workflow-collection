Automate Job Searches with Job Search Global API & Google Sheets

https://n8nworkflows.xyz/workflows/automate-job-searches-with-job-search-global-api---google-sheets-8820


# Automate Job Searches with Job Search Global API & Google Sheets

### 1. Workflow Overview

This workflow automates job searches by querying the Job Search Global API every 6 hours for a specified job keyword ("Web Developer"). It processes the API response, extracts job listings, and appends or updates these listings in a Google Sheet, ensuring no duplicates by matching on job titles. If the API request fails or returns an error status, the workflow sends an email notification to alert the administrator.

**Logical Blocks:**

- **1.1 Schedule Trigger:** Automatically triggers the workflow every 6 hours to ensure regular job search updates without manual intervention.

- **1.2 Set Search Term:** Defines the job search keyword used dynamically in the API request body.

- **1.3 Fetch Job Listings:** Sends a POST request to the Job Search Global API with pagination and the search term to retrieve job listings.

- **1.4 Check API Response:** Validates the API response status to decide whether to process data or send an alert.

- **1.5 Extract Job Data:** Parses the job listings array from the API response, preparing data for Google Sheets.

- **1.6 Save to Google Sheet:** Appends or updates job listings in a specific Google Sheet, using the job title as a unique key to avoid duplicates.

- **1.7 Send Failure Notification Email:** Sends an alert email if the API response indicates failure or an error, assisting in timely debugging.

---

### 2. Block-by-Block Analysis

#### 1.1 Schedule Trigger

- **Overview:**  
  Triggers the entire workflow automatically every 6 hours to maintain up-to-date job search results.

- **Nodes Involved:**  
  - Schedule Trigger

- **Node Details:**  
  - **Node Name:** Schedule Trigger  
  - **Type:** Schedule Trigger  
  - **Role:** Initiates the workflow at regular time intervals.  
  - **Configuration:** Set to trigger every 6 hours.  
  - **Inputs:** None (trigger node).  
  - **Outputs:** Connected to "Set Search Term".  
  - **Version Specific:** Version 1.2 (standard for schedule triggers).  
  - **Potential Failures:** Workflow may not trigger if n8n instance is down or misconfigured time zone settings.  
  - **Sticky Note Content:** "Triggers the workflow automatically every 6 hours. Ensures regular job search updates without manual execution."

#### 1.2 Set Search Term

- **Overview:**  
  Sets the job search keyword dynamically, which is used in the API request body.

- **Nodes Involved:**  
  - Set Search Term

- **Node Details:**  
  - **Node Name:** Set Search Term  
  - **Type:** Set  
  - **Role:** Defines the "Search Term" variable with the value "Web Developer".  
  - **Configuration:** Sets a single string variable named "Search Term" with value "Web Developer".  
  - **Key Expressions:** None; static assignment.  
  - **Inputs:** From Schedule Trigger.  
  - **Outputs:** To Fetch Job Listings.  
  - **Version Specific:** Version 3.4.  
  - **Potential Failures:** None typical; if changed dynamically, empty or invalid terms could cause poor API results.  
  - **Sticky Note Content:** "Defines the job search keyword (e.g., “Web Developer”). This value is dynamically inserted into the API request body."

#### 1.3 Fetch Job Listings

- **Overview:**  
  Sends a POST request to the Job Search Global API, fetching job listings based on the provided search term, limited to 10 results per request.

- **Nodes Involved:**  
  - Fetch Job Listings

- **Node Details:**  
  - **Node Name:** Fetch Job Listings  
  - **Type:** HTTP Request  
  - **Role:** Calls the external Job Search Global API to retrieve job data.  
  - **Configuration:**  
    - Method: POST  
    - URL: https://job-search-global.p.rapidapi.com/search.php  
    - Content-Type: multipart/form-data  
    - Body Parameters:  
      - pageNumber: 1 (fixed)  
      - pageSize: 10 (fixed)  
      - searchQuery: Uses expression `{{$json["Search Term"]}}` to insert the dynamic search term.  
    - Headers:  
      - x-rapidapi-host: job-search-global.p.rapidapi.com  
      - x-rapidapi-key: "your key" (to be replaced with valid API key)  
  - **Inputs:** From Set Search Term.  
  - **Outputs:** To Check API Response.  
  - **Version Specific:** Version 4.2.  
  - **Potential Failures:**  
    - Authentication errors if API key is invalid or expired.  
    - Network timeouts or connectivity issues.  
    - Invalid or malformed request payload.  
    - API rate limiting.  
  - **Sticky Note Content:** "Sends a POST request to the Job Search Global API. Fetches job data based on the search term, limited to 10 results per request."

#### 1.4 Check API Response

- **Overview:**  
  Validates the API response by checking if the status indicates success. Routes workflow to data extraction or failure notification accordingly.

- **Nodes Involved:**  
  - Check API Response

- **Node Details:**  
  - **Node Name:** Check API Response  
  - **Type:** If  
  - **Role:** Branches workflow based on API response status.  
  - **Configuration:**  
    - Condition compares `$json.status` to itself, which likely means it checks if the status field exists and is truthy (though this is unusual and may be a placeholder or error).  
    - Outputs:  
      - True (success): proceeds to Extract Job Data  
      - False (failure): proceeds to Send Failure Notification Email  
  - **Inputs:** From Fetch Job Listings.  
  - **Outputs:** Two branches: Extract Job Data (success), Send Failure Notification Email (failure).  
  - **Version Specific:** Version 2.2.  
  - **Potential Failures:**  
    - Incorrect or missing status field causing misrouting.  
    - Logic condition may need refinement to properly detect success (e.g., status === "success").  
  - **Sticky Note Content:** "Evaluates whether the API returned a successful response. Branches the workflow into success (data processing) or failure (email alert)."

#### 1.5 Extract Job Data

- **Overview:**  
  Extracts the array of job listings from the API response payload, preparing them for insertion into Google Sheets.

- **Nodes Involved:**  
  - Extract Job Data

- **Node Details:**  
  - **Node Name:** Extract Job Data  
  - **Type:** Code (JavaScript)  
  - **Role:** Parses the nested JSON response to isolate the job listings array.  
  - **Configuration:** Runs JS code: `return $input.first().json.data.data;`  
    - This assumes the API response JSON structure has `data` object containing another `data` array with job listings.  
  - **Inputs:** From Check API Response (success branch).  
  - **Outputs:** To Save to Google Sheet1.  
  - **Version Specific:** Version 2.  
  - **Potential Failures:**  
    - If API response structure changes or is empty, code may throw errors or return undefined.  
    - No error handling in JS code for missing data fields.  
  - **Sticky Note Content:** "Extracts the job listings array from the API response. Transforms it into individual records for Google Sheets."

#### 1.6 Save to Google Sheet

- **Overview:**  
  Appends or updates extracted job listings in a specified Google Sheet, using the job title as the matching column to avoid duplicate entries.

- **Nodes Involved:**  
  - Save to Google Sheet1

- **Node Details:**  
  - **Node Name:** Save to Google Sheet1  
  - **Type:** Google Sheets  
  - **Role:** Inserts data into Google Sheets, appending new or updating existing rows.  
  - **Configuration:**  
    - Operation: Append or update  
    - Authentication: Service Account credentials (Google Docs account)  
    - Document ID: Set by URL or ID (empty in JSON, must be configured)  
    - Sheet Name: `gid=0` (Sheet1)  
    - Matching Columns: `title` (to prevent duplicates)  
    - Columns mapped automatically from input JSON fields including title, url, company, postDate, jobSource, slug, sentiment, dateAdded, tags, viewCount  
  - **Inputs:** From Extract Job Data.  
  - **Outputs:** None (end of success branch).  
  - **Version Specific:** Version 4.7.  
  - **Potential Failures:**  
    - Authentication errors if Google API credentials are invalid or expired.  
    - Permissions issues on the Google Sheet.  
    - Mismatches in data schema causing insertion errors.  
  - **Sticky Note Content:**  
    - "Appends or updates job listings in a specific Google Sheet."  
    - "Uses 'title' as the matching column to prevent duplicates."

#### 1.7 Send Failure Notification Email

- **Overview:**  
  Sends an email notification alerting the admin if the API fetch fails or returns an error, aiding in prompt troubleshooting.

- **Nodes Involved:**  
  - Send Failure Notification Email

- **Node Details:**  
  - **Node Name:** Send Failure Notification Email  
  - **Type:** Email Send  
  - **Role:** Sends alert email on API failure.  
  - **Configuration:**  
    - SMTP credentials configured (SMTP account)  
    - From: itadmin@gmail.com  
    - To: dev@gmail.com  
    - Subject: "🚨 Job Search API Failure Notification"  
    - Body: Explains failure, suggests verifying API key, payload, and endpoint availability  
  - **Inputs:** From Check API Response (failure branch).  
  - **Outputs:** None (end of failure branch).  
  - **Version Specific:** Version 2.1.  
  - **Potential Failures:**  
    - SMTP authentication errors.  
    - Network issues preventing email sending.  
    - Incorrect recipient or sender email addresses.  
  - **Sticky Note Content:** "Sends an email to notify of API failure or bad response. Helps in quickly identifying issues with the API call or authentication."

---

### 3. Summary Table

| Node Name                   | Node Type           | Functional Role                                     | Input Node(s)          | Output Node(s)                     | Sticky Note                                                                                                         |
|-----------------------------|---------------------|----------------------------------------------------|------------------------|----------------------------------|---------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger            | Schedule Trigger    | Triggers workflow every 6 hours                     | None                   | Set Search Term                  | Triggers the workflow automatically every 6 hours. Ensures regular job search updates without manual execution.      |
| Set Search Term             | Set                 | Defines job search keyword ("Web Developer")        | Schedule Trigger       | Fetch Job Listings               | Defines the job search keyword (e.g., “Web Developer”). This value is dynamically inserted into the API request body.|
| Fetch Job Listings          | HTTP Request        | Calls Job Search Global API to fetch job listings   | Set Search Term        | Check API Response              | Sends a POST request to the Job Search Global API. Fetches job data based on the search term, limited to 10 results. |
| Check API Response          | If                  | Validates API response status, branches workflow    | Fetch Job Listings     | Extract Job Data, Send Failure Notification Email | Evaluates whether the API returned a successful response. Branches workflow into success or failure.                 |
| Extract Job Data            | Code (JavaScript)   | Extracts job listings array from API response       | Check API Response     | Save to Google Sheet1           | Extracts the job listings array from the API response. Transforms it into individual records for Google Sheets.      |
| Save to Google Sheet1       | Google Sheets       | Appends/updates job listings in Google Sheet        | Extract Job Data       | None                           | Appends or updates job listings in a specific Google Sheet. Uses "title" as the matching column to prevent duplicates.|
| Send Failure Notification Email | Email Send         | Sends alert email on API failure                     | Check API Response     | None                           | Sends an email to notify of API failure or bad response. Helps in quickly identifying issues with the API call.      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set to run every 6 hours (Field: Interval → Hours → 6)  
   - No credentials needed  
   - No input connections  

2. **Create a Set Node called "Set Search Term"**  
   - Type: Set  
   - Add a string variable named "Search Term" with value "Web Developer"  
   - Connect input from Schedule Trigger node  

3. **Create an HTTP Request Node called "Fetch Job Listings"**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: https://job-search-global.p.rapidapi.com/search.php  
   - Content-Type: multipart/form-data  
   - Body Parameters:  
     - pageNumber: "1"  
     - pageSize: "10"  
     - searchQuery: Use expression `{{$json["Search Term"]}}` to dynamically set from previous node  
   - Header Parameters:  
     - x-rapidapi-host: job-search-global.p.rapidapi.com  
     - x-rapidapi-key: Set your valid API key here (replace "your key")  
   - Connect input from "Set Search Term" node  

4. **Create an If Node called "Check API Response"**  
   - Type: If  
   - Condition: Check if `$json.status` equals a success value (e.g., "success")  
     - Note: Adjust condition to properly check for success status (example: `$json.status === "success"`)  
   - Connect input from "Fetch Job Listings" node  
   - True output connects to next node for data extraction  
   - False output connects to failure notification email node  

5. **Create a Code Node called "Extract Job Data"**  
   - Type: Code (JavaScript)  
   - Code snippet:  
     ```javascript
     return $input.first().json.data.data;
     ```  
   - Connect input from "Check API Response" node's True branch  

6. **Create a Google Sheets Node called "Save to Google Sheet1"**  
   - Type: Google Sheets  
   - Operation: Append or Update  
   - Authentication: Configure Google Service Account credentials (Google Docs account)  
   - Document ID: Set the ID or URL of your target Google Sheet  
   - Sheet Name: `gid=0` or "Sheet1"  
   - Set Matching Columns to "title" to prevent duplicate entries  
   - Map columns automatically or configure fields: title, url, company, postDate, jobSource, slug, sentiment, dateAdded, tags, viewCount  
   - Connect input from "Extract Job Data" node  

7. **Create an Email Send Node called "Send Failure Notification Email"**  
   - Type: Email Send  
   - Configure SMTP credentials with valid SMTP account  
   - From Email: itadmin@gmail.com  
   - To Email: dev@gmail.com  
   - Subject: "🚨 Job Search API Failure Notification"  
   - Body (HTML or plain text):  
     ```
     Hello,

     The job search automation workflow encountered a failure while attempting to fetch job listings from the API.

     Please review the API request and ensure the following:
     - API key and host are valid and not expired.
     - The request payload is correctly formatted.
     - The API endpoint is available.

     You may also want to inspect the response for further debugging.

     Regards,  
     n8n Workflow Bot
     ```  
   - Connect input from "Check API Response" node's False branch  

---

### 5. General Notes & Resources

| Note Content                                                                                                                             | Context or Link                                                                                  |
|------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Uses environment variables or secure credential management for API keys and Google authentication.                                       | Best practice for securing sensitive information in n8n workflows.                            |
| The workflow prevents duplicate job entries by using the job title as a unique key in Google Sheets.                                    | Ensures data integrity and avoids redundant rows.                                            |
| The current condition in "Check API Response" node should be verified and possibly corrected to accurately detect success status.      | Proper API response validation is critical for correct workflow branching.                    |
| Sticky notes included in the workflow provide clear explanations for each node’s purpose and help maintain workflow clarity.            | Useful for team collaboration and long-term maintenance.                                     |
| For setting up Google Sheets credentials, configure a Google Service Account with appropriate Sheet access permissions.                 | See Google Sheets API documentation for service account creation and sharing permissions.     |
| SMTP credentials must be valid and tested to ensure email notifications are reliably sent.                                               | Use secure credentials and test email functionality during setup.                             |
| Job Search Global API documentation: https://rapidapi.com/job-search-global-api/api/job-search-global                                    | Reference for API parameters, authentication, and response formats.                           |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.