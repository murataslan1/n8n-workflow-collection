Automate SEO Keyword Analysis with RapidAPI and Log to Google Sheets

https://n8nworkflows.xyz/workflows/automate-seo-keyword-analysis-with-rapidapi-and-log-to-google-sheets-7484


# Automate SEO Keyword Analysis with RapidAPI and Log to Google Sheets

### 1. Workflow Overview

This workflow automates SEO keyword research by accepting user input through a form, querying an external keyword analysis API, and logging the resulting SEO data into a Google Sheets document for tracking and analysis. It is designed for marketers, SEO specialists, or content creators who want to streamline keyword research and maintain an organized database of keyword metrics. The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Captures user inputs (country and keyword) via a form submission trigger.
- **1.2 Keyword Data Retrieval:** Sends input data to an external SEO API via HTTP request to fetch detailed keyword analysis.
- **1.3 Data Transformation:** Reformats the API response to a structure compatible with Google Sheets.
- **1.4 Data Logging:** Appends the transformed keyword data into a specified Google Sheets document.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block initiates the workflow by capturing keyword research parameters from a user-submitted form.

- **Nodes Involved:**  
  - On form submission

- **Node Details:**

  - **On form submission**  
    - **Type:** Form Trigger  
    - **Role:** Starts the workflow upon form submission  
    - **Configuration:**  
      - Form Title: "Keyword Analysis"  
      - Form Description: "Keyword Analysis"  
      - Fields:  
        - `country` (required)  
        - `keyword` (required)  
    - **Expressions/Variables:** Output JSON contains the `country` and `keyword` fields submitted by the user.  
    - **Input/Output:** No input; outputs the form data to the next node.  
    - **Version Requirements:** Version 2.2 or later recommended for formTrigger node stability.  
    - **Potential Failures:**  
      - User submits incomplete form or invalid inputs.  
      - Webhook trigger errors if webhook URL is not correctly set or accessible.  
    - **Sub-workflow:** None

#### 2.2 Keyword Data Retrieval

- **Overview:**  
  This block calls an external SEO API to fetch detailed keyword metrics based on user input.

- **Nodes Involved:**  
  - Keyword Analysis

- **Node Details:**

  - **Keyword Analysis**  
    - **Type:** HTTP Request  
    - **Role:** Sends POST request to the RapidAPI SEO keyword tool endpoint to retrieve keyword analysis data.  
    - **Configuration:**  
      - URL: `https://keyword-research-tool3.p.rapidapi.com/keyword-tool.php`  
      - Method: POST  
      - Content-Type: multipart/form-data  
      - Body Parameters:  
        - `country` from form input (`={{ $json.country }}`)  
        - `keyword` from form input (`={{ $json.keyword }}`)  
      - Headers:  
        - `x-rapidapi-host: keyword-research-tool3.p.rapidapi.com`  
        - `x-rapidapi-key: your key` (replace with actual RapidAPI key)  
      - Sends form data and headers accordingly.  
    - **Expressions/Variables:** Uses expressions to map form input fields dynamically.  
    - **Input/Output:** Receives form data from trigger, outputs API response JSON.  
    - **Version Requirements:** Version 4.2 or higher recommended for multipart support.  
    - **Potential Failures:**  
      - API authentication errors if API key is invalid or missing.  
      - Network timeouts or rate limits from RapidAPI.  
      - Unexpected API response format changes.  
      - Invalid input data causing API errors.  
    - **Sub-workflow:** None

#### 2.3 Data Transformation

- **Overview:**  
  Reformats the raw API response to extract relevant keyword data array for Google Sheets insertion.

- **Nodes Involved:**  
  - Re format output

- **Node Details:**

  - **Re format output**  
    - **Type:** Code (JavaScript)  
    - **Role:** Extracts the array of broad match keywords from the nested API response for further processing.  
    - **Configuration:**  
      - Code: `return $input.first().json.data.semrushAPI.broadMatchKeywords;`  
      - This accesses the first input JSON, navigates to `data.semrushAPI.broadMatchKeywords` to return only this array.  
    - **Expressions/Variables:** Uses `$input.first().json` to access data from previous node.  
    - **Input/Output:** Input is the full API response JSON; output is the extracted array of keyword data objects.  
    - **Version Requirements:** Version 2 or higher for code node.  
    - **Potential Failures:**  
      - If API response structure changes or missing `data.semrushAPI.broadMatchKeywords`, the code will fail or return undefined.  
      - Null or empty responses causing errors.  
    - **Sub-workflow:** None

#### 2.4 Data Logging

- **Overview:**  
  Appends the structured keyword data into a Google Sheets document for record-keeping and further analysis.

- **Nodes Involved:**  
  - Google Sheets

- **Node Details:**

  - **Google Sheets**  
    - **Type:** Google Sheets (Append)  
    - **Role:** Adds rows of keyword analysis data to a specified Google Sheets spreadsheet and sheet.  
    - **Configuration:**  
      - Operation: Append  
      - Document ID: Set via variable (linked to Google Sheets document "Seo n8n")  
      - Sheet Name/ID: 150500408 (represents the specific sheet named "keyword")  
      - Columns: Auto-mapped from input data fields:  
        - competition, cpc, keyword, keywordsSerpFeatures, numberOfResults, searchVolume, trends, keywordDifficultyIndex, intent  
      - Authentication: Service Account credential configured (`Google Docs account`)  
    - **Expressions/Variables:** Auto-mapping columns from input JSON keys.  
    - **Input/Output:** Input is the array of keyword data objects from the previous code node; output is the append operation result.  
    - **Version Requirements:** Version 4.6 or higher recommended for Google Sheets node.  
    - **Potential Failures:**  
      - Authentication errors if service account credentials are invalid or lack permissions.  
      - Google Sheets API quota exceeded or network issues.  
      - Mismatch between input data fields and sheet columns causing mapping errors.  
    - **Sub-workflow:** None

---

### 3. Summary Table

| Node Name          | Node Type       | Functional Role                         | Input Node(s)       | Output Node(s)     | Sticky Note                                                                                                                                                                                                                                   |
|--------------------|-----------------|---------------------------------------|---------------------|--------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| On form submission  | Form Trigger    | Captures user input (country, keyword) | None                | Keyword Analysis    | **On form submission (Trigger)** - **Purpose:** This node triggers the workflow when the user submits the form with "country" and "keyword" as inputs. - **Explanation:** Initiates process passing input to next node.                        |
| Keyword Analysis    | HTTP Request    | Fetches keyword data from SEO API      | On form submission  | Re format output   | **Keyword Analysis (HTTP Request)** - **Purpose:** Sends a request to an external SEO API to analyze the provided keyword, fetching data like search volume, trends, and competition. - **Explanation:** Calls API with user inputs.            |
| Re format output    | Code            | Extracts relevant keyword data array   | Keyword Analysis    | Google Sheets      | **Re-format output (Code)** - **Purpose:** Processes and reformats the API response for Google Sheets. - **Explanation:** Extracts keyword data like competition, CPC, etc., into structure compatible with Google Sheets columns.                |
| Google Sheets       | Google Sheets   | Logs keyword data into a spreadsheet   | Re format output    | None               | **Google Sheets (Append)** - **Purpose:** Appends keyword data into Google Sheets document. - **Explanation:** Logs SEO insights (search volume, trends, competition) for ongoing analysis.                                                    |
| Sticky Note         | Sticky Note     | Documentation comment                  | None                | None               | ## **"Automated Keyword Analysis and Google Sheets Logging with n8n"** Description and node-by-node explanations provided.                                                                                                                  |
| Sticky Note1        | Sticky Note     | Documentation comment                  | None                | None               | **On form submission (Trigger)** - Purpose and explanation of form trigger node.                                                                                                                                                            |
| Sticky Note2        | Sticky Note     | Documentation comment                  | None                | None               | **Keyword Analysis (HTTP Request)** - Purpose and explanation of HTTP request node.                                                                                                                                                         |
| Sticky Note3        | Sticky Note     | Documentation comment                  | None                | None               | **Re-format output (Code)** - Purpose and explanation of code node.                                                                                                                                                                        |
| Sticky Note4        | Sticky Note     | Documentation comment                  | None                | None               | **Google Sheets (Append)** - Purpose and explanation of Google Sheets append node.                                                                                                                                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node: "On form submission"**  
   - Node Type: Form Trigger  
   - Configure Form:  
     - Title: "Keyword Analysis"  
     - Description: "Keyword Analysis"  
     - Fields:  
       - `country` (required)  
       - `keyword` (required)  
   - Save and activate webhook URL.

2. **Create HTTP Request Node: "Keyword Analysis"**  
   - Node Type: HTTP Request  
   - Method: POST  
   - URL: `https://keyword-research-tool3.p.rapidapi.com/keyword-tool.php`  
   - Content-Type: multipart/form-data  
   - Headers:  
     - `x-rapidapi-host`: `keyword-research-tool3.p.rapidapi.com`  
     - `x-rapidapi-key`: *Your RapidAPI Key* (replace `"your key"` with valid key)  
   - Body Parameters:  
     - `country` = Expression: `{{$json["country"]}}`  
     - `keyword` = Expression: `{{$json["keyword"]}}`  
   - Connect output of "On form submission" to this node.

3. **Create Code Node: "Re format output"**  
   - Node Type: Code  
   - Language: JavaScript  
   - Code:  
     ```javascript
     return $input.first().json.data.semrushAPI.broadMatchKeywords;
     ```  
   - Connect output of "Keyword Analysis" node to this node.

4. **Create Google Sheets Node: "Google Sheets"**  
   - Node Type: Google Sheets  
   - Operation: Append  
   - Document: Select or enter ID of your Google Sheets document (example: "Seo n8n")  
   - Sheet Name/ID: Use sheet ID `150500408` or the name "keyword"  
   - Columns: Auto-map the following keys from input JSON:  
     - competition, cpc, keyword, keywordsSerpFeatures, numberOfResults, searchVolume, trends, keywordDifficultyIndex, intent  
   - Authentication: Use Google Service Account credentials with appropriate spreadsheet permissions.  
   - Connect output of "Re format output" node to this node.

5. **Test the workflow** by submitting the form with valid country and keyword values.  
6. **Verify data logging** in the specified Google Sheets document.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                | Context or Link                                               |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| This workflow simplifies SEO keyword research by automating data retrieval and logging to Google Sheets, enabling continuous tracking of SEO metrics.                                                                                                                                                                      | Workflow purpose                                              |
| Ensure your RapidAPI key is valid and has access to `keyword-research-tool3.p.rapidapi.com`. API rate limits or quota may affect workflow execution.                                                                                                                                                                       | API credentials and limits                                    |
| Google Service Account credentials must be set up with permission to append rows to the target Google Sheets document.                                                                                                                                                                                                      | Google Sheets authentication                                  |
| The extracted data is mapped from the API response field `data.semrushAPI.broadMatchKeywords`. If the API response structure changes, you will need to update the Code node accordingly.                                                                                                                                   | API response dependency                                       |
| For more details on n8n form triggers, visit: [n8n Form Trigger Documentation](https://docs.n8n.io/nodes/n8n-nodes-base.formTrigger/)                                                                                                                                                                                     | Official n8n documentation                                    |
| For Google Sheets node usage and authentication: [Google Sheets n8n Node](https://docs.n8n.io/nodes/n8n-nodes-base.googleSheets/)                                                                                                                                                                                         | Official n8n documentation                                    |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with applicable content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.