Automate Weekly US Trademark Reports with USPTO API and Google Drive CSV Export

https://n8nworkflows.xyz/workflows/automate-weekly-us-trademark-reports-with-uspto-api-and-google-drive-csv-export-7024


# Automate Weekly US Trademark Reports with USPTO API and Google Drive CSV Export

### 1. Workflow Overview

This workflow automates the weekly retrieval of recent US trademark data from the USPTO API, processes it into CSV files, and uploads the resulting reports to Google Drive. Its primary use case is to enable legal teams, brand managers, or IP professionals to receive updated trademark reports without manual data fetching or formatting.

The workflow is logically structured into the following blocks:

- **1.1 Scheduled Trigger and Date Preparation:** Initiates the workflow on a schedule and prepares the date range for the last 7 days.
- **1.2 USPTO API Request:** Fetches the latest trademark records filed within the last 7 days.
- **1.3 Data Processing:** Splits the fetched array of trademark records into individual items and converts them into CSV files.
- **1.4 File Upload:** Uploads the generated CSV files to a designated Google Drive folder.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger and Date Preparation

- **Overview:**  
  This block triggers the workflow automatically on a set schedule (e.g., weekly) and prepares the date/time context needed to query the USPTO API for data from the last 7 days.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Date & Time  
  - Manual

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Trigger  
    - Role: Initiates the workflow on a predefined schedule (likely weekly, though exact cron or interval not specified).  
    - Configuration: Default parameters, likely set to weekly intervals.  
    - Inputs: None (trigger node)  
    - Outputs: Connects to "Date & Time" node.  
    - Edge Cases: Scheduling misconfigurations may cause missed runs. Timezone considerations may affect date calculations.

  - **Date & Time**  
    - Type: Date & Time node  
    - Role: Calculates or formats date information, presumably to define the "last 7 days" window.  
    - Configuration: Not explicitly detailed, but likely configured to subtract 7 days from the current execution date.  
    - Inputs: From Schedule Trigger  
    - Outputs: Connects to "Manual" node.  
    - Edge Cases: Incorrect date calculations could cause wrong API queries or empty results.

  - **Manual**  
    - Type: Set (used as manual input or data setting)  
    - Role: Likely sets or passes parameters (such as date range) downstream for the API request node.  
    - Configuration: Not detailed; might be used to override or test with manual input data.  
    - Inputs: From "Date & Time"  
    - Outputs: Connects to "Get Latest TradeMarks ~ 7 days" node.  
    - Edge Cases: If manual input is missing or incorrect, API queries might fail.

---

#### 2.2 USPTO API Request

- **Overview:**  
  Performs an HTTP request to the USPTO API to retrieve trademark data filed within the last 7 days.

- **Nodes Involved:**  
  - Get Latest TradeMarks ~ 7 days

- **Node Details:**

  - **Get Latest TradeMarks ~ 7 days**  
    - Type: HTTP Request  
    - Role: Queries the USPTO trademark API endpoint to fetch recent trademark applications.  
    - Configuration: Not fully detailed, but expected to use parameters (e.g., date range) from the "Manual" node as query parameters.  
    - Inputs: From "Manual" node  
    - Outputs: Connects to "Split the array into individual items" node.  
    - Edge Cases:  
      - Network errors/timeouts.  
      - API rate limits or quota exceeded.  
      - Improper date formatting leading to empty or invalid responses.  
      - API authentication issues if needed.  
    - Version-specific: HTTP Request node version 4.2, features like retry and authentication available.

---

#### 2.3 Data Processing

- **Overview:**  
  Processes the array of trademark records by splitting them into individual items and converting each item into a CSV file for easier handling and export.

- **Nodes Involved:**  
  - Split the array into individual items  
  - Convert to File

- **Node Details:**

  - **Split the array into individual items**  
    - Type: Code (JavaScript)  
    - Role: Takes the array of trademark records and splits it into single records for individual processing.  
    - Configuration: Custom JavaScript code that iterates over the fetched array and outputs single items.  
    - Inputs: From "Get Latest TradeMarks ~ 7 days"  
    - Outputs: Connects to "Convert to File" node.  
    - Edge Cases:  
      - Input data not an array or empty array.  
      - Code errors in splitting logic.  
      - Large datasets may impact performance.

  - **Convert to File**  
    - Type: Convert To File  
    - Role: Converts individual trademark record JSON data into CSV file format.  
    - Configuration: Default settings assumed; converts JSON to CSV.  
    - Inputs: From "Split the array into individual items"  
    - Outputs: Connects to "Upload file" node.  
    - Edge Cases:  
      - Malformed data could cause conversion errors.  
      - Large fields or nested objects may cause CSV formatting issues.

---

#### 2.4 File Upload

- **Overview:**  
  Uploads the converted CSV files containing trademark data into a Google Drive folder for storage and sharing.

- **Nodes Involved:**  
  - Upload file

- **Node Details:**

  - **Upload file**  
    - Type: Google Drive  
    - Role: Uploads the CSV files generated by "Convert to File" into Google Drive.  
    - Configuration:  
      - Operation: Upload file  
      - Destination folder: Not specified but should be configured to a target folder.  
      - Credentials: Requires Google Drive OAuth2 credentials.  
    - Inputs: From "Convert to File"  
    - Outputs: None (terminal node)  
    - Edge Cases:  
      - Authentication failures (expired tokens).  
      - Insufficient permissions on Drive folder.  
      - Network failures.  
      - File overwrite if naming conflicts occur.

---

### 3. Summary Table

| Node Name                     | Node Type            | Functional Role                          | Input Node(s)                  | Output Node(s)                  | Sticky Note                          |
|-------------------------------|----------------------|----------------------------------------|-------------------------------|--------------------------------|------------------------------------|
| Schedule Trigger               | Schedule Trigger     | Initiates workflow on schedule         | None                          | Date & Time                    |                                    |
| Date & Time                   | Date & Time          | Prepares date range for API query      | Schedule Trigger              | Manual                        |                                    |
| Manual                       | Set                  | Sets parameters for API request        | Date & Time                  | Get Latest TradeMarks ~ 7 days |                                    |
| Get Latest TradeMarks ~ 7 days | HTTP Request         | Fetches recent trademark data from USPTO API | Manual                        | Split the array into individual items |                                    |
| Split the array into individual items | Code           | Splits trademark records array into single items | Get Latest TradeMarks ~ 7 days | Convert to File               |                                    |
| Convert to File               | Convert To File      | Converts trademark records to CSV files | Split the array into individual items | Upload file                 |                                    |
| Upload file                  | Google Drive          | Uploads CSV files to Google Drive folder | Convert to File               | None                          | Requires Google Drive OAuth2 credential |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a "Schedule Trigger" node:**
   - Set it to trigger weekly (or desired interval).
   - Position it as the workflow’s start.

3. **Add a "Date & Time" node:**
   - Connect the output of "Schedule Trigger" to this node.
   - Configure it to calculate the date 7 days ago from the current execution date.
     - Example: Use “Add/Subtract Time” operation with -7 days.
   - This date will serve as the start date for the USPTO API query.

4. **Add a "Set" node named "Manual":**
   - Connect from "Date & Time" node.
   - Use this node to prepare or set parameters for the next HTTP request.
   - Set key-value pairs such as:
     - `startDate`: The date calculated by the Date & Time node (use expression referencing previous node).
     - `endDate`: Current date (or use the trigger date).
   - This allows flexibility to override parameters manually if needed.

5. **Add an "HTTP Request" node named "Get Latest TradeMarks ~ 7 days":**
   - Connect from the "Manual" node.
   - Configure the node to query the USPTO trademark API endpoint.
   - Method: GET  
   - URL: Use the USPTO API endpoint for trademark search (e.g., https://developer.uspto.gov/endpoint or relevant URL).
   - Query Parameters:  
     - Include date filters using the `startDate` and `endDate` from the Set node via expressions.
     - Add any required API keys or authentication if necessary.
   - Set the node to expect JSON response.
   - Enable retries if needed.

6. **Add a "Code" node named "Split the array into individual items":**
   - Connect from the HTTP Request node.
   - Configure JavaScript code to:
     - Read the array of trademark records from the HTTP response.
     - Output each trademark record as an individual item for further processing.
   - Example snippet:
     ```javascript
     return items[0].json.records.map(record => ({ json: record }));
     ```
   - Handle edge cases where records might be missing or empty.

7. **Add a "Convert To File" node named "Convert to File":**
   - Connect from the Code node.
   - Set "Binary Property" to output CSV.
   - Configure it to convert JSON data to CSV format.
   - Choose CSV as the output file type.
   - Filename can be dynamic (e.g., trademark_{{ $json.id }}.csv).

8. **Add a "Google Drive" node named "Upload file":**
   - Connect from "Convert to File" node.
   - Set operation to "Upload File".
   - Configure the destination folder on Google Drive.
   - Use OAuth2 credentials configured in n8n.
   - Map the binary data from "Convert to File" node as the file content.
   - Set the filename appropriately.

9. **Save and activate the workflow.**

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                      |
|-------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| The USPTO developer portal provides detailed API documentation for trademark data access.       | https://developer.uspto.gov/                         |
| Ensure Google Drive OAuth2 credentials have appropriate scopes for file upload and folder access.| https://developers.google.com/drive/api/v3/about-auth|
| Consider adding error handling nodes or workflows to catch and alert on API or upload failures. | Best practice for production workflows               |
| The workflow can be enhanced by batching files or aggregating reports rather than individual files.| Performance optimization suggestion                   |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created using n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.