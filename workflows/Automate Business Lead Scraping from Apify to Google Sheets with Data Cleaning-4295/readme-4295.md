Automate Business Lead Scraping from Apify to Google Sheets with Data Cleaning

https://n8nworkflows.xyz/workflows/automate-business-lead-scraping-from-apify-to-google-sheets-with-data-cleaning-4295


# Automate Business Lead Scraping from Apify to Google Sheets with Data Cleaning

### 1. Workflow Overview

This workflow automates the process of scraping business leads from Apify and exporting cleaned data to Google Sheets. It is designed for users who want to collect lead information such as company names, phone numbers, and addresses from an Apify actor task dataset, clean the data by formatting phone numbers and emails, and then append this data into a structured Google Sheet for further use or analysis.  

The workflow is logically divided into the following blocks:

- **1.1 Input & Initialization:** Manual start and setting up API credentials for Apify.
- **1.2 Data Retrieval:** Running the Apify scraper via HTTP request to fetch lead data.
- **1.3 Data Cleaning:** Formatting and normalizing phone numbers and emails.
- **1.4 Data Export:** Writing the cleaned data into a Google Sheet.

---

### 2. Block-by-Block Analysis

#### 2.1 Input & Initialization

- **Overview:**  
This block triggers the workflow manually and initializes required API tokens and task IDs as variables for subsequent nodes.

- **Nodes Involved:**  
  - Manual Trigger  
  - Variables  

- **Node Details:**  

  - **Manual Trigger**  
    - *Type & Role:* Trigger node to start workflow execution manually.  
    - *Configuration:* No parameters set; simple manual start.  
    - *Expressions/Variables:* None.  
    - *Connections:* Output connects to Variables node.  
    - *Version Requirements:* n8n v1 or higher supports this node.  
    - *Failure Modes:* None expected unless workflow is started unintentionally.

  - **Variables**  
    - *Type & Role:* Sets static variables for API authentication and task identification.  
    - *Configuration:*  
      - `APIFY_TOKEN`: String placeholder for user’s Apify API token.  
      - `APIFY_TASK_ID`: String placeholder for the Apify task ID to run.  
    - *Expressions/Variables:* Sets fixed string values.  
    - *Connections:* Input from Manual Trigger; output to Run Apify Scraper.  
    - *Failure Modes:* If values are incorrect or missing, downstream HTTP request will fail authentication or task execution.

---

#### 2.2 Data Retrieval

- **Overview:**  
This block executes the Apify actor task synchronously via HTTP request to fetch lead dataset items.

- **Nodes Involved:**  
  - Run Apify Scraper  

- **Node Details:**  

  - **Run Apify Scraper**  
    - *Type & Role:* HTTP Request node; calls Apify API to run a specific actor task and retrieve dataset items.  
    - *Configuration:*  
      - Method: GET (implied by URL)  
      - URL constructed dynamically using expressions:  
        `'https://api.apify.com/v2/actor-tasks/' + $json.APIFY_TASK_ID + '/run-sync-get-dataset-items?token=' + $json.APIFY_TOKEN`  
      - Option: `splitIntoItems` enabled, so response array is split into individual items for downstream processing.  
    - *Expressions/Variables:* Utilizes `APIFY_TOKEN` and `APIFY_TASK_ID` from Variables node.  
    - *Connections:* Input from Variables; output to Clean Data node.  
    - *Version Requirements:* HTTP Request node v1 or higher; `splitIntoItems` option available in v1+.  
    - *Failure Modes:*  
      - Authentication failure if token invalid.  
      - Task not found or error if task ID invalid.  
      - Network timeouts or API rate limits.  
      - Empty or malformed response data.  

---

#### 2.3 Data Cleaning

- **Overview:**  
Cleans and normalizes the scraped lead data by formatting phone numbers to digits and lowercasing/trimming emails.

- **Nodes Involved:**  
  - Clean Data  

- **Node Details:**  

  - **Clean Data**  
    - *Type & Role:* Code node (JavaScript) for data transformation and cleaning.  
    - *Configuration:*  
      - JS code processes all incoming items:  
        - For each item, copies all original JSON properties.  
        - Normalizes `phone` by removing all non-digit and non-plus characters.  
        - Normalizes `email` by converting to lowercase and trimming whitespace.  
        - Defaults to empty string if fields are missing.  
    - *Key Expressions:* Uses JavaScript regex `/[^\d+]/g` to clean phone numbers; standard string methods for email.  
    - *Connections:* Input from Run Apify Scraper; output to Export to Google Sheets.  
    - *Version Requirements:* Code node v2 or higher to support `return $input.all().map(...)` style.  
    - *Failure Modes:*  
      - JS runtime errors if input data structure does not contain expected fields.  
      - Empty dataset leads to no output.  

---

#### 2.4 Data Export

- **Overview:**  
Appends the cleaned lead data into a specific Google Sheet document and worksheet.

- **Nodes Involved:**  
  - Export to Google Sheets  

- **Node Details:**  

  - **Export to Google Sheets**  
    - *Type & Role:* Google Sheets node; appends rows with lead data.  
    - *Configuration:*  
      - Operation: `append` — adds new rows instead of overwriting.  
      - Document ID: User must replace placeholder `"YOUR_GOOGLE_SHEET_ID"` with actual spreadsheet ID.  
      - Sheet Name: `"Sheet1"` (must exist in spreadsheet).  
      - Columns mapped:  
        - `company name` from `$json.title`  
        - `phone` from cleaned `$json.phone`  
        - `Address` from `$json.address`  
      - Schema includes additional columns (`website`, `email`) but not mapped for append currently.  
      - Data types: all treated as string; no conversion attempted.  
    - *Expressions/Variables:* Expression syntax used for mapping fields dynamically from cleaned JSON.  
    - *Connections:* Input from Clean Data; no outputs (end node).  
    - *Version Requirements:* Google Sheets node v4.5 or higher recommended for schema and append support.  
    - *Failure Modes:*  
      - Authentication errors if Google OAuth2 credentials are invalid or expired.  
      - Missing or incorrect Document ID or Sheet Name causes failure.  
      - Data schema mismatch or quota exceeded errors.  

---

### 3. Summary Table

| Node Name           | Node Type           | Functional Role                     | Input Node(s)      | Output Node(s)           | Sticky Note                                                                                                    |
|---------------------|---------------------|-----------------------------------|--------------------|--------------------------|---------------------------------------------------------------------------------------------------------------|
| Manual Trigger      | Manual Trigger      | Start workflow manually            | -                  | Variables                | ## Automated Business Lead Scraper with Apify to Google Sheets Purpose and steps overview                      |
| Variables           | Set                 | Set API credentials variables      | Manual Trigger     | Run Apify Scraper         | ## Automated Business Lead Scraper with Apify to Google Sheets Purpose and steps overview                      |
| Run Apify Scraper   | HTTP Request        | Fetch leads data from Apify API    | Variables          | Clean Data                | ## Automated Business Lead Scraper with Apify to Google Sheets Purpose and steps overview                      |
| Clean Data          | Code                | Clean and normalize scraped data   | Run Apify Scraper  | Export to Google Sheets   | ## Automated Business Lead Scraper with Apify to Google Sheets Purpose and steps overview                      |
| Export to Google Sheets | Google Sheets    | Append cleaned data to spreadsheet | Clean Data         | -                        | ## Automated Business Lead Scraper with Apify to Google Sheets Purpose and steps overview                      |
| Sticky Note         | Sticky Note         | Documentation and usage notes      | -                  | -                        | ## Automated Business Lead Scraper with Apify to Google Sheets Purpose and steps overview                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node**  
   - Type: Manual Trigger  
   - No special parameters needed.

2. **Create a Set node named "Variables"**  
   - Type: Set  
   - Add two string fields:  
     - `APIFY_TOKEN` with value `"YOUR_APIFY_API_TOKEN"` (replace with actual token)  
     - `APIFY_TASK_ID` with value `"YOUR_APIFY_TASK_ID"` (replace with actual task ID)  
   - Connect Manual Trigger output to this node.

3. **Create an HTTP Request node named "Run Apify Scraper"**  
   - Type: HTTP Request  
   - Method: GET (default)  
   - URL: Use expression editor to build:  
     ```
     https://api.apify.com/v2/actor-tasks/{{$json["APIFY_TASK_ID"]}}/run-sync-get-dataset-items?token={{$json["APIFY_TOKEN"]}}
     ```  
   - Options: Enable `Split Into Items` to process each dataset item separately.  
   - Connect Variables output to this node.

4. **Create a Code node named "Clean Data"**  
   - Type: Code (JavaScript)  
   - Version: 2 or higher  
   - Code snippet:  
     ```javascript
     return $input.all().map(item => ({
       ...item.json,
       phone: item.json.phone?.replace(/[^\d+]/g, '') || '',
       email: item.json.email?.toLowerCase().trim() || '',
     }));
     ```  
   - Connect Run Apify Scraper output to this node.

5. **Create a Google Sheets node named "Export to Google Sheets"**  
   - Type: Google Sheets  
   - Operation: Append  
   - Document ID: Set to your Google Spreadsheet ID (replace `"YOUR_GOOGLE_SHEET_ID"`).  
   - Sheet Name: `"Sheet1"` (ensure this sheet exists in your spreadsheet).  
   - Columns mapping: Define columns as:  
     - `company name`: `={{ $json.title }}`  
     - `phone`: `={{ $json.phone }}`  
     - `Address`: `={{ $json.address }}`  
   - Connect Clean Data output to this node.

6. **Connect nodes in the following order:**  
   Manual Trigger → Variables → Run Apify Scraper → Clean Data → Export to Google Sheets.

7. **Credentials:**  
   - Configure Google Sheets credentials via OAuth2 in n8n for the Google Sheets node.  
   - No explicit credentials needed for HTTP Request node (token passed as URL parameter).

8. **Defaults and Constraints:**  
   - Ensure that the Google Sheet has columns matching the schema (`company name`, `phone`, `Address`).  
   - Replace placeholders for API token and task ID before running.  
   - Validate API token and task ID correctness to avoid runtime errors.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                  | Context or Link                                                                                         |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| Workflow purpose and stepwise description including Google Sheet requirements and customization tips.                                                        | See Sticky Note node content in workflow for detailed explanation.                                    |
| Google Sheet must contain a sheet named `Sheet1` with columns `company name`, `phone`, and `Address` to match appended data.                                 | Google Sheets setup prerequisite.                                                                     |
| Tips to extend: add more fields like `email`, `website` in cleaning and mapping nodes; implement conditional filtering or email alerts if needed.            | Workflow customization suggestions.                                                                   |
| Replace placeholders `YOUR_APIFY_API_TOKEN`, `YOUR_APIFY_TASK_ID`, and `YOUR_GOOGLE_SHEET_ID` with actual valid values to ensure workflow functions correctly.  | Critical for operational deployment.                                                                   |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. The processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All processed data is legal and publicly available.