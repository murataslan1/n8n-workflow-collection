Analyze Competitor Keywords with RapidAPI and Google Sheets Reporting

https://n8nworkflows.xyz/workflows/analyze-competitor-keywords-with-rapidapi-and-google-sheets-reporting-7686


# Analyze Competitor Keywords with RapidAPI and Google Sheets Reporting

### 1. Workflow Overview

This workflow automates competitor keyword analysis by capturing user input through a form, querying a competitor keyword analysis API via RapidAPI, processing the returned data, and appending the results into a Google Sheets document for tracking and reporting. It is designed to help SEO analysts, marketers, and agencies efficiently gather and store competitor keyword data without manual effort.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Captures user inputs (website and country) via a form submission trigger.
- **1.2 API Request:** Sends a POST request to the competitor keyword analysis API using the captured inputs.
- **1.3 Data Transformation:** Extracts and reformats the relevant keyword data from the API response.
- **1.4 Data Logging:** Appends the transformed keyword data into a Google Sheets document for storage and further analysis.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block captures user input from a form that requires website URL and country code, triggering the workflow upon submission.

- **Nodes Involved:**  
  - On form submission

- **Node Details:**  

  - **Node Name:** On form submission  
    - **Type:** `formTrigger`  
    - **Technical Role:** Initiates workflow on user form submission  
    - **Configuration:**  
      - Form titled "Competitor Keyword Analysis"  
      - Two fields:  
        - `website` (required)  
        - `country` (required, placeholder "in")  
      - No additional options configured  
    - **Expressions / Variables:**  
      - Captures `$json.website` and `$json.country` from form input  
    - **Input / Output Connections:**  
      - No input (trigger node)  
      - Output connected to "Competitor Keyword Analysis" node  
    - **Version-Specific Requirements:**  
      - Uses `formTrigger` node version 2.2  
    - **Potential Failures / Edge Cases:**  
      - Missing required fields (form validation handles)  
      - Network or webhook misconfiguration preventing trigger firing  
    - **Sub-Workflow Reference:** None

#### 1.2 API Request

- **Overview:**  
  Sends a POST request to the competitor keyword analysis API hosted on RapidAPI, passing the user-provided website and country parameters to retrieve SEO keyword data.

- **Nodes Involved:**  
  - Competitor Keyword Analysis

- **Node Details:**  

  - **Node Name:** Competitor Keyword Analysis  
    - **Type:** `httpRequest`  
    - **Technical Role:** Makes authenticated POST request to external API  
    - **Configuration:**  
      - URL: `https://competitor-keyword-analysis.p.rapidapi.com/web-keyoword-tool.php`  
      - Method: POST  
      - Content-Type: multipart-form-data  
      - Body parameters:  
        - `website` = `={{ $json.website }}` (from form input)  
        - `country` = `={{ $json.country }}` (from form input)  
      - Headers:  
        - `x-rapidapi-host`: `competitor-keyword-analysis.p.rapidapi.com`  
        - `x-rapidapi-key`: placeholder `"your key"` (user must replace with valid RapidAPI key)  
      - Sends both headers and body as multipart form data  
    - **Expressions / Variables:**  
      - Uses expressions to inject form data into body parameters  
    - **Input / Output Connections:**  
      - Input from "On form submission" node  
      - Output to "Reformat Code" node  
    - **Version-Specific Requirements:**  
      - Uses `httpRequest` node version 4.2  
    - **Potential Failures / Edge Cases:**  
      - API authentication failure if RapidAPI key is invalid or missing  
      - API endpoint errors or downtime  
      - Network timeout or connectivity issues  
      - Incorrect or unexpected API response structure  
    - **Sub-Workflow Reference:** None

#### 1.3 Data Transformation

- **Overview:**  
  Processes the raw API response JSON to extract the `domainOrganicSearchKeywords` array, simplifying data for downstream usage.

- **Nodes Involved:**  
  - Reformat Code

- **Node Details:**  

  - **Node Name:** Reformat Code  
    - **Type:** `code` (JavaScript)  
    - **Technical Role:** Custom data extraction and transformation  
    - **Configuration:**  
      - JavaScript code:  
        ```js
        return $input.first().json.data.semrushAPI.domainOrganicSearchKeywords;
        ```  
      - This returns the array of organic search keywords from nested API response data  
    - **Expressions / Variables:**  
      - Uses `$input.first().json` to access previous node data  
    - **Input / Output Connections:**  
      - Input from "Competitor Keyword Analysis" node  
      - Output to "Google Sheets" node  
    - **Version-Specific Requirements:**  
      - Uses `code` node v2  
    - **Potential Failures / Edge Cases:**  
      - If API response structure changes and `data.semrushAPI.domainOrganicSearchKeywords` does not exist, code will throw an error  
      - Handling empty or undefined data arrays is not explicitly coded, potential for failure if API returns no keywords  
    - **Sub-Workflow Reference:** None

#### 1.4 Data Logging

- **Overview:**  
  Appends the transformed keyword data into a Google Sheets spreadsheet for persistent storage and reporting.

- **Nodes Involved:**  
  - Google Sheets

- **Node Details:**  

  - **Node Name:** Google Sheets  
    - **Type:** `googleSheets`  
    - **Technical Role:** Appends rows to a Google Sheets document  
    - **Configuration:**  
      - Operation: Append  
      - Sheet name: `"Sheet1"` (via sheet GID `gid=0`)  
      - Document ID: (empty in JSON, user must specify)  
      - Columns mapped automatically (autoMapInputData), matching on `row_number` column (if present)  
      - Columns defined include: `competition`, `cpc`, `keyword`, `numberOfResults`, `position`, `positionDifference`, `previousPosition`, `searchVolume`, `trafficPercent`, `trafficCostPercent`, `trends`, `keywordDifficulty`  
      - Authentication via Google Service Account credentials named "Google Docs account"  
    - **Expressions / Variables:**  
      - Auto maps input data fields into sheet columns  
    - **Input / Output Connections:**  
      - Input from "Reformat Code" node  
      - No output (terminal node)  
    - **Version-Specific Requirements:**  
      - Uses Google Sheets node version 4.6  
    - **Potential Failures / Edge Cases:**  
      - Missing or incorrect Google Sheets document ID will cause failure  
      - Authentication errors with Google API credentials  
      - Google Sheets API rate limits or quota exceeded  
      - Data type mismatches if input does not conform to expected schema  
    - **Sub-Workflow Reference:** None

---

### 3. Summary Table

| Node Name                  | Node Type           | Functional Role                          | Input Node(s)             | Output Node(s)          | Sticky Note                                                                                                                                    |
|----------------------------|---------------------|----------------------------------------|---------------------------|-------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| On form submission          | formTrigger         | Captures user input on form submission | None                      | Competitor Keyword Analysis | **📝 On form submission (`formTrigger`)** Captures user input (`website` and `country`) when the form is submitted to initiate the workflow.  |
| Competitor Keyword Analysis | httpRequest         | Sends POST request to competitor keyword API | On form submission        | Reformat Code           | **🌐 Competitor Keyword Analysis (`httpRequest`)** Sends a POST request to the Competitor Keyword Analysis API using the submitted website and country to fetch SEO keyword data. |
| Reformat Code              | code                | Extracts relevant keyword data from API response | Competitor Keyword Analysis | Google Sheets           | **🔄 Reformat Code (`code`)** Extracts the relevant `domainOrganicSearchKeywords` data from the API response for easier processing and storage. |
| Google Sheets              | googleSheets        | Appends keyword data to Google Sheets | Reformat Code             | None                    | **📊 Google Sheets (`googleSheets`)** Appends the formatted keyword data into a specified Google Sheet for tracking, reporting, and analysis.  |
| Sticky Note                | stickyNote          | Documentation                          | None                      | None                    | # 🔍 Competitor Keyword Analysis & Reporting Workflow ... (detailed description in sticky note)                                               |
| Sticky Note1               | stickyNote          | Documentation                          | None                      | None                    | # 🔍 Competitor Keyword Analysis & Reporting Workflow ... (detailed description in sticky note)                                               |
| Sticky Note2               | stickyNote          | Documentation                          | None                      | None                    | **🌐 Competitor Keyword Analysis (`httpRequest`)** Sends a POST request to the Competitor Keyword Analysis API using the submitted website and country to fetch SEO keyword data. |
| Sticky Note3               | stickyNote          | Documentation                          | None                      | None                    | **🔄 Reformat Code (`code`)** Extracts the relevant `domainOrganicSearchKeywords` data from the API response for easier processing and storage. |
| Sticky Note4               | stickyNote          | Documentation                          | None                      | None                    | **📊 Google Sheets (`googleSheets`)** Appends the formatted keyword data into a specified Google Sheet for tracking, reporting, and analysis.  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Form Trigger Node**  
   - Add a `formTrigger` node named "On form submission".  
   - Configure form with title: "Competitor Keyword Analysis".  
   - Add two form fields:  
     - `website` (required)  
     - `country` (required) with placeholder "in".  
   - Leave other options default.

2. **Create an HTTP Request Node**  
   - Add an `httpRequest` node named "Competitor Keyword Analysis".  
   - Set the HTTP Method to POST.  
   - Set URL to `https://competitor-keyword-analysis.p.rapidapi.com/web-keyoword-tool.php`.  
   - Set Content-Type to `multipart-form-data`.  
   - In Body Parameters, add two parameters:  
     - `website` with value expression `={{ $json.website }}`  
     - `country` with value expression `={{ $json.country }}`  
   - In Header Parameters, add:  
     - `x-rapidapi-host`: `competitor-keyword-analysis.p.rapidapi.com`  
     - `x-rapidapi-key`: your valid RapidAPI key (replace `"your key"`)  
   - Connect output of "On form submission" node to this node's input.

3. **Create a Code Node for Data Extraction**  
   - Add a `code` node named "Reformat Code".  
   - Use the following JavaScript code to extract keyword data:  
     ```js
     return $input.first().json.data.semrushAPI.domainOrganicSearchKeywords;
     ```  
   - Connect output of "Competitor Keyword Analysis" node to this node's input.

4. **Create a Google Sheets Node**  
   - Add a `googleSheets` node named "Google Sheets".  
   - Set operation to `append`.  
   - Set Sheet Name to "Sheet1" (or use GID `gid=0`).  
   - Provide the Google Sheets Document ID (must be set to your target spreadsheet).  
   - Configure columns to auto map input data fields to columns:  
     - `competition`, `cpc`, `keyword`, `numberOfResults`, `position`, `positionDifference`, `previousPosition`, `searchVolume`, `trafficPercent`, `trafficCostPercent`, `trends`, `keywordDifficulty`  
   - Authenticate using Google Service Account credentials (create or use existing OAuth credentials with access to the spreadsheet).  
   - Connect output of "Reformat Code" node to this node's input.

5. **Arrange Connections**  
   - Connect "On form submission" → "Competitor Keyword Analysis" → "Reformat Code" → "Google Sheets".

6. **Credential Setup**  
   - Configure RapidAPI credentials by securely storing your RapidAPI key.  
   - Configure Google API credentials with appropriate service account or OAuth2 credentials authorized to modify the target Google Sheets.

7. **Test the Workflow**  
   - Submit the form with valid `website` and `country` inputs.  
   - Confirm the API request returns expected data.  
   - Confirm the Google Sheet receives appended rows with correct data.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                    | Context or Link                                                                                                    |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| This workflow automates competitor keyword analysis by combining form input, RapidAPI integration, JavaScript data transformation, and Google Sheets logging for SEO tracking and reporting.                                                      | Sticky Note1 content summarizing workflow purpose and node breakdown.                                              |
| Ensure to replace the placeholder `x-rapidapi-key` with a valid RapidAPI key for the competitor keyword analysis API to avoid authentication failures.                                                                                         | HTTP Request node configuration instructions.                                                                      |
| The Google Sheets node requires a valid Document ID and properly configured Google API credentials with Editor access to the target spreadsheet.                                                                                              | Google Sheets node authentication and configuration notes.                                                         |
| The JavaScript code node assumes the API response contains the nested path `data.semrushAPI.domainOrganicSearchKeywords`. If the API changes, update the code accordingly to prevent runtime errors.                                           | Code node operational assumptions and potential failure causes.                                                    |
| Suitable for SEO professionals and agencies who want to automate competitor keyword data collection for better SEO strategy decisions and reporting.                                                                                            | Workflow use case summary.                                                                                           |

---

**Disclaimer:** The provided text is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.