Automate Startup Research & Profiling with Extruct.ai to Google Sheets

https://n8nworkflows.xyz/workflows/automate-startup-research---profiling-with-extruct-ai-to-google-sheets-5381


# Automate Startup Research & Profiling with Extruct.ai to Google Sheets

---

### 1. Workflow Overview

This n8n workflow automates the process of researching and profiling startups by leveraging the Extruct.ai API and recording the enriched data into a Google Sheets document. It is designed for users who want to submit a startup's name or website via a form and receive a comprehensive profile automatically populated in a spreadsheet. The workflow is structured into three logical blocks:

- **1.1 Input Reception:** Captures startup information submitted through a form and sets necessary variables.
- **1.2 Data Enrichment:** Sends the submitted startup data to Extruct.ai for enrichment, then polls the API until processing is complete.
- **1.3 Data Retrieval and Storage:** Retrieves the enriched data, formats it, and imports it into a Google Sheets document.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block collects startup information submitted by users via a form and initializes workflow variables such as the Extruct.ai table ID.

**Nodes Involved:**  
- On form submission  
- Variables

**Node Details:**  

- **On form submission**  
  - **Type:** Form Trigger  
  - **Role:** Entry point; triggers workflow on form submission  
  - **Configuration:**  
    - Listens to submissions of the form titled "Complete Startup Overview"  
    - Expects a single field: "Name" (startup name or website)  
  - **Input/Output:** No input; outputs form data JSON with the submitted "Name" field  
  - **Edge Cases:** Missing or malformed form data could cause downstream errors if the "Name" field is empty or invalid  

- **Variables**  
  - **Type:** Set node  
  - **Role:** Holds static parameters required for the workflow  
  - **Configuration:**  
    - Sets `EXTRUCT_TABLE_ID` to a placeholder string `"YOUR_EXTRUCT_TABLE_ID"` which must be replaced by the user  
  - **Input/Output:** Receives JSON from form submission, outputs JSON with the `EXTRUCT_TABLE_ID` string  
  - **Edge Cases:** Failure to replace the placeholder will cause API calls to fail  

---

#### 1.2 Data Enrichment

**Overview:**  
This block sends the startup name to Extruct.ai for enrichment, then repeatedly checks the status of the enrichment job until it is complete.

**Nodes Involved:**  
- Enrich form input  
- Wait  
- Get status  
- If running

**Node Details:**  

- **Enrich form input**  
  - **Type:** HTTP Request  
  - **Role:** Sends startup data to Extruct.ai to create a new enrichment job  
  - **Configuration:**  
    - POSTs to `https://api.extruct.ai/v1/tables/{EXTRUCT_TABLE_ID}/rows`  
    - Body contains the startup name from the form submission  
    - Uses Bearer token authentication (requires user’s Extruct API token)  
  - **Key Expressions:**  
    - URL dynamically constructed using the `EXTRUCT_TABLE_ID` from Variables node  
    - Payload: `{"rows":[{"data":{"input":"{{ 'On form submission'.Name }}"}}], "run": true}`  
  - **Edge Cases:** API authentication failure, invalid table ID, network timeouts  

- **Wait**  
  - **Type:** Wait  
  - **Role:** Pauses workflow execution to allow asynchronous processing on Extruct.ai side  
  - **Configuration:** Waits 10 seconds before next action  
  - **Edge Cases:** If Extruct takes longer to process, repeated waits may be needed (managed by If running node)  

- **Get status**  
  - **Type:** HTTP Request  
  - **Role:** Queries Extruct.ai API for current enrichment job status  
  - **Configuration:** GET request to `https://api.extruct.ai/v1/tables/{EXTRUCT_TABLE_ID}`  
  - **Authentication:** Bearer token required  
  - **Edge Cases:** API failures, invalid token, malformed response  

- **If running**  
  - **Type:** If (conditional)  
  - **Role:** Checks if enrichment job is still running  
  - **Configuration:**  
    - Checks if `status.run_status` equals `"running"`  
    - If true: loops back to Wait node to delay and re-check status  
    - If false: proceeds to data retrieval  
  - **Edge Cases:** Possible infinite loops if job never completes; no timeout or failure case handling present  

---

#### 1.3 Data Retrieval and Storage

**Overview:**  
After enrichment completes, this block fetches the enriched startup data, formats it into a flat structure, and appends or updates it in a Google Sheets document.

**Nodes Involved:**  
- Get data  
- Format last input  
- Import to Sheets

**Node Details:**  

- **Get data**  
  - **Type:** HTTP Request  
  - **Role:** Retrieves the processed enrichment data from Extruct.ai  
  - **Configuration:** GET request to `https://api.extruct.ai/v1/tables/{EXTRUCT_TABLE_ID}/data`  
  - **Authentication:** Bearer token required  
  - **Edge Cases:** API failures, malformed data, empty data sets  

- **Format last input**  
  - **Type:** Code (JavaScript)  
  - **Role:** Transforms nested API response into a flat JSON object suitable for Google Sheets import  
  - **Logic:**  
    - Extracts the last row from the API response  
    - Iterates over data keys, extracting `answer` or direct values  
    - Returns a flat JSON object with key-value pairs matching sheet columns  
  - **Edge Cases:** Missing or unexpected data structures could cause undefined errors or empty fields  

- **Import to Sheets**  
  - **Type:** Google Sheets node  
  - **Role:** Appends or updates the flattened data into the target Google Sheets document  
  - **Configuration:**  
    - Operation: appendOrUpdate  
    - Requires user to provide:  
      - Document ID (Google Sheets file)  
      - Sheet name  
    - Credentials: OAuth2 Google Sheets account must be connected  
  - **Edge Cases:**  
    - Missing or incorrect Google Sheets credentials  
    - Incorrect document or sheet name  
    - Column mapping must be configured correctly to avoid data misalignment  

---

### 3. Summary Table

| Node Name           | Node Type            | Functional Role                         | Input Node(s)       | Output Node(s)          | Sticky Note                                                                                          |
|---------------------|----------------------|---------------------------------------|---------------------|-------------------------|----------------------------------------------------------------------------------------------------|
| On form submission   | Form Trigger         | Trigger on startup form submission    | -                   | Variables                | ## Input: - User submits a company via the form. - Variables node sets up required parameters (Table ID). |
| Variables           | Set                  | Stores static variables (Extruct Table ID) | On form submission | Enrich form input         | ## Input: - User submits a company via the form. - Variables node sets up required parameters (Table ID). |
| Enrich form input    | HTTP Request         | Sends startup input to Extruct.ai     | Variables            | Wait                    | ## Enrichment: The flow sends the company data for enrichment and waits until processing is complete. It checks the status in a loop until the data is ready. |
| Wait                 | Wait                 | Pauses flow for processing delay      | Enrich form input / If running | Get status               | ## Enrichment: The flow sends the company data for enrichment and waits until processing is complete. It checks the status in a loop until the data is ready. |
| Get status           | HTTP Request         | Checks enrichment job status           | Wait                  | If running               | ## Enrichment: The flow sends the company data for enrichment and waits until processing is complete. It checks the status in a loop until the data is ready. |
| If running           | If                   | Loops if enrichment is still running  | Get status            | Wait / Get data          | ## Enrichment: The flow sends the company data for enrichment and waits until processing is complete. It checks the status in a loop until the data is ready. |
| Get data             | HTTP Request         | Retrieves enriched startup data       | If running            | Format last input        | ## Output: Once enrichment is finished, the flow retrieves the results, formats them, and updates your Google Sheet. |
| Format last input    | Code (JavaScript)    | Flattens nested API data for Sheets   | Get data              | Import to Sheets         | ## Output: Once enrichment is finished, the flow retrieves the results, formats them, and updates your Google Sheet. |
| Import to Sheets     | Google Sheets        | Appends or updates data in Google Sheets | Format last input    | -                       | ## Output: Once enrichment is finished, the flow retrieves the results, formats them, and updates your Google Sheet. |
| Sticky Note          | Sticky Note          | Quickstart Guide and instructions     | -                     | -                       | See block 1 for detailed guide and setup instructions.                                            |
| Sticky Note1         | Sticky Note          | Notes on Input block                   | -                     | -                       | ## Input: - User submits a company via the form. - Variables node sets up required parameters (Table ID). |
| Sticky Note2         | Sticky Note          | Notes on Enrichment block              | -                     | -                       | ## Enrichment: The flow sends the company data for enrichment and waits until processing is complete. It checks the status in a loop until the data is ready. |
| Sticky Note3         | Sticky Note          | Notes on Output block                   | -                     | -                       | ## Output: Once enrichment is finished, the flow retrieves the results, formats them, and updates your Google Sheet. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node:**  
   - Add a **Form Trigger** node named "On form submission".  
   - Configure to listen to form titled "Complete Startup Overview".  
   - Add a single form field: "Name".  
   - This node will trigger the workflow when a user submits a startup name or website.

2. **Add Variables Node:**  
   - Add a **Set** node named "Variables".  
   - Connect "On form submission" → "Variables".  
   - Add a string variable named `EXTRUCT_TABLE_ID`.  
   - Set its value to your Extruct.ai table ID (replace `"YOUR_EXTRUCT_TABLE_ID"`).  
   - This variable will be used dynamically in API calls.

3. **Add HTTP Request to Enrich Data:**  
   - Add an **HTTP Request** node named "Enrich form input".  
   - Connect "Variables" → "Enrich form input".  
   - Method: POST  
   - URL: `https://api.extruct.ai/v1/tables/{{ $json.EXTRUCT_TABLE_ID }}/rows`  
   - Authentication: HTTP Bearer Token (configure with your Extruct API token)  
   - Body Content Type: JSON  
   - Request Body:  
     ```json
     {
       "rows": [
         {
           "data": {
             "input": "{{ $('On form submission').item.json.Name }}"
           }
         }
       ],
       "run": true
     }
     ```  
   - This node submits the startup name for enrichment.

4. **Add Wait Node:**  
   - Add a **Wait** node named "Wait".  
   - Connect "Enrich form input" → "Wait".  
   - Set wait duration to 10 seconds.  
   - This pauses the workflow to allow Extruct.ai to start processing.

5. **Add HTTP Request to Check Status:**  
   - Add an **HTTP Request** node named "Get status".  
   - Connect "Wait" → "Get status".  
   - Method: GET  
   - URL: `https://api.extruct.ai/v1/tables/{{ $json.EXTRUCT_TABLE_ID }}`  
   - Authentication: HTTP Bearer Token (same as above)  
   - Always output data enabled (to ensure JSON output).  
   - This node polls for the enrichment job status.

6. **Add If Node to Loop While Running:**  
   - Add an **If** node named "If running".  
   - Connect "Get status" → "If running".  
   - Condition: Check if `status.run_status` equals `"running"`.  
   - If **true**: connect back to "Wait" (loop to wait and re-check).  
   - If **false**: connect to next step "Get data".  
   - Enables polling mechanism until data is ready.

7. **Add HTTP Request to Retrieve Data:**  
   - Add an **HTTP Request** node named "Get data".  
   - Connect "If running" (false output) → "Get data".  
   - Method: GET  
   - URL: `https://api.extruct.ai/v1/tables/{{ $json.EXTRUCT_TABLE_ID }}/data`  
   - Authentication: HTTP Bearer Token (same credentials)  
   - Always output data enabled.  
   - Retrieves the fully enriched startup data.

8. **Add Code Node to Format Data:**  
   - Add a **Code** node named "Format last input".  
   - Connect "Get data" → "Format last input".  
   - Language: JavaScript  
   - Code (key parts):  
     - Extract the last row from `items[0].json.rows`  
     - Flatten nested properties into a flat JSON object with keys and answers  
   - This prepares data for Google Sheets ingestion.

9. **Add Google Sheets Node:**  
   - Add a **Google Sheets** node named "Import to Sheets".  
   - Connect "Format last input" → "Import to Sheets".  
   - Operation: Append or Update  
   - Document ID: Insert your Google Sheets document ID (must be a copy of the provided template)  
   - Sheet Name: Specify your target sheet name  
   - Credentials: Connect or create Google Sheets OAuth2 credentials with your Google account  
   - Map the incoming data fields to corresponding Google Sheets columns, matching the "Company name" column as the key.  

10. **Activate Workflow:**  
    - Test the workflow with sample form submissions.  
    - Ensure all credentials are correctly configured.  
    - Replace placeholders with actual IDs and tokens.  
    - Activate the workflow for production use.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Context or Link                                                                                                     |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| Extruct.ai offers 2,500 free credits upon signup: www.extruct.ai/                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Signup link for Extruct.ai account                                                                                  |
| Extruct Table Template (with shared link): https://app.extruct.ai/tables/shared/gQlqQK4pQgPDmk81. The unique table ID is found in the URL and must be inserted into the Variables node.                                                                                                                                                                                                                                                                                                                                     | Extruct Table Template URL                                                                                          |
| Google Sheets Template: https://docs.google.com/spreadsheets/d/1lLliOAn75R81MbWSdn2W48dGKHpa-1qFwSXRDBoi4TY/edit?usp=sharing. Make a personal copy for editing and use.                                                                                                                                                                                                                                                                                                                                                        | Google Sheets Template URL                                                                                          |
| For Google Sheets node, after first run, drag input fields to corresponding columns in the sheet to ensure correct mapping. The "Column to match on" should be set to "Company name".                                                                                                                                                                                                                                                                                                                                        | Mapping instructions with screenshot reference (see sticky note)                                                  |
| Extruct API token: Obtain from Extruct web app API page; must be configured in all HTTP Request nodes using Bearer authentication.                                                                                                                                                                                                                                                                                                                                                                                          | API token setup instructions                                                                                        |
| Custom Columns: To track additional data, add columns in both Extruct table and Google Sheets template, then map accordingly in the Google Sheets node.                                                                                                                                                                                                                                                                                                                                                                    | Instructions for extending data schema                                                                              |
| Support: For questions or help, contact Extruct support via chat on their website.                                                                                                                                                                                                                                                                                                                                                                                                                                            | Extruct support contact                                                                                             |

---

**Disclaimer:**  
The provided content is exclusively derived from an automated workflow created with n8n, a workflow automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly accessible.

---