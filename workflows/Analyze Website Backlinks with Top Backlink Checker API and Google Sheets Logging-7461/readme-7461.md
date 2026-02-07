Analyze Website Backlinks with Top Backlink Checker API and Google Sheets Logging

https://n8nworkflows.xyz/workflows/analyze-website-backlinks-with-top-backlink-checker-api-and-google-sheets-logging-7461


# Analyze Website Backlinks with Top Backlink Checker API and Google Sheets Logging

---

### 1. Workflow Overview

This workflow automates the process of analyzing website backlinks and logging the results into Google Sheets for SEO tracking. It is designed for SEO professionals or digital marketers who want to monitor website traffic and backlink profiles using the Top Backlink Checker API (powered by Semrush data) and maintain organized records in Google Sheets.

The workflow is logically divided into these functional blocks:

- **1.1 Input Reception:** Captures user input (website URL) through a form trigger.
- **1.2 API Request and Data Retrieval:** Sends a POST request to the Top Backlink Checker API to retrieve traffic and backlink data for the specified website.
- **1.3 Data Extraction and Reformatting:** Processes the raw API response to extract and restructure relevant backlink overview and detailed backlink data.
- **1.4 Data Logging:** Appends the processed backlink overview and detailed backlink data into two separate Google Sheets for ongoing SEO analysis and reporting.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block captures the website URL submitted by a user via a web form, serving as the workflow's entry point.

- **Nodes Involved:**  
  - On form submission

- **Node Details:**

  - **On form submission**  
    - Type: Form Trigger  
    - Role: Listens for form submissions with website URLs to trigger the workflow.  
    - Configuration:  
      - Form Title: "website backlink checker"  
      - Form Field: Single required field named "website"  
      - Webhook ID assigned for external form integration  
    - Key Expressions: Accesses submitted website URL via `$json.website`  
    - Input: External form submission  
    - Output: Triggers next HTTP request node  
    - Edge Cases:  
      - Missing or invalid website URL submission may cause API calls with invalid input.  
      - Webhook connectivity or permission issues may prevent triggering.  
    - Version: 2.2  

---

#### 1.2 API Request and Data Retrieval

- **Overview:**  
  Sends a POST request to the Top Backlink Checker API to fetch traffic and backlink data for the input website.

- **Nodes Involved:**  
  - Check webTraffic

- **Node Details:**

  - **Check webTraffic**  
    - Type: HTTP Request  
    - Role: Posts the website URL to the backlink API and obtains raw backlink and traffic data.  
    - Configuration:  
      - URL: `https://top-backlink-checker.p.rapidapi.com/backlink.php`  
      - Method: POST  
      - Content Type: multipart/form-data  
      - Body Parameter: `website` with value `={{ $json.website }}` (dynamic from form input)  
      - Headers include `x-rapidapi-host` and `x-rapidapi-key` (API key required, must be replaced with valid key)  
    - Input: Website URL from form submission node  
    - Output: API response JSON with backlink overview and backlinks details  
    - Edge Cases:  
      - API key missing or invalid causes authentication failure  
      - API rate limiting or downtime leads to errors or empty response  
      - Network timeouts or malformed requests cause failures  
    - Version: 4.2  

---

#### 1.3 Data Extraction and Reformatting

- **Overview:**  
  Extracts and restructures relevant data from the raw API response for easier processing and storage.

- **Nodes Involved:**  
  - Re format output  
  - Reformat

- **Node Details:**

  - **Re format output**  
    - Type: Code  
    - Role: Extracts high-level backlink overview from the API response JSON.  
    - Configuration: JavaScript code:  
      ```js
      return $input.first().json.data.semrushAPI.backlinksOverview;
      ```  
      Extracts the `backlinksOverview` object for summary metrics.  
    - Input: API response from Check webTraffic node  
    - Output: Reformatted backlink overview JSON  
    - Edge Cases:  
      - Missing or malformed `backlinksOverview` in response leads to undefined output/errors  
    - Version: 2  

  - **Reformat**  
    - Type: Code  
    - Role: Extracts detailed backlinks array from API response for logging.  
    - Configuration: JavaScript code:  
      ```js
      return $input.first().json.data.semrushAPI.backlinks;
      ```  
      Extracts the `backlinks` array for detailed backlink info.  
    - Input: API response from Check webTraffic node  
    - Output: Reformatted backlinks array  
    - Edge Cases:  
      - Missing or malformed `backlinks` data causes empty or failed outputs  
    - Version: 2  

---

#### 1.4 Data Logging

- **Overview:**  
  Appends the reformatted backlink overview and backlink details data into two separate Google Sheets documents for persistent storage and analysis.

- **Nodes Involved:**  
  - Backlink overview  
  - Backlinks

- **Node Details:**

  - **Backlink overview**  
    - Type: Google Sheets  
    - Role: Appends backlink summary data into a specific sheet for overview metrics.  
    - Configuration:  
      - Operation: Append  
      - Sheet Name: "backlink overview" (ID: 275308757)  
      - Document ID: "Seo n8n" (to be replaced with actual Google Sheet ID)  
      - Authentication: Service Account (Google API credentials)  
      - Columns configured for automatic mapping of input data fields  
    - Input: Data from Re format output node  
    - Output: Confirmation of append operation  
    - Edge Cases:  
      - Invalid or expired Google credentials cause authentication errors  
      - Missing document or sheet ID causes operation failure  
      - Schema mismatches or data type issues may cause append failure  
    - Version: 4.6  

  - **Backlinks**  
    - Type: Google Sheets  
    - Role: Appends detailed backlink records into another sheet for granular backlink tracking.  
    - Configuration:  
      - Operation: Append  
      - Sheet Name: "backlinks" (ID: 1521883577)  
      - Document ID: "Seo n8n" (to be replaced with actual Google Sheet ID)  
      - Authentication: Service Account (Google API credentials)  
      - Columns defined explicitly for: targetUrl, sourceUrl, sourceTitle, pageAscore, lastSeen, internalNum, firstSeen, externalNum, anchor, nofollow  
      - Automatic mapping enabled for these fields  
    - Input: Data from Reformat node  
    - Output: Confirmation of append operation  
    - Edge Cases:  
      - Google API authentication errors  
      - Missing or incorrect sheet/document IDs  
      - Data schema mismatches or empty backlink arrays  
    - Version: 4.6  

---

### 3. Summary Table

| Node Name          | Node Type          | Functional Role                                     | Input Node(s)           | Output Node(s)        | Sticky Note                                                                                          |
|--------------------|--------------------|---------------------------------------------------|------------------------|-----------------------|----------------------------------------------------------------------------------------------------|
| On form submission  | Form Trigger       | Captures website URL input to start workflow      | External form          | Check webTraffic       | ### 1. **On form submission**<br>Captures the website URL submitted by a form.                     |
| Check webTraffic    | HTTP Request       | Requests backlink and traffic data from API       | On form submission     | Re format output, Reformat | ### 2. **Check webTraffic**<br>Sends request to Semrush API to get website traffic info.           |
| Re format output    | Code               | Extracts and reformats backlink overview data     | Check webTraffic       | Backlink overview      | ### 3. **Re format output**<br>Extracts and cleans traffic data from API response.                  |
| Reformat           | Code               | Extracts and reformats detailed backlinks data    | Check webTraffic       | Backlinks              | ### 4. **Reformat**<br>Processes backlink data for Google Sheets storage.                           |
| Backlink overview   | Google Sheets      | Appends backlink overview data to Google Sheets   | Re format output       |                       | ### 5. **Backlink overview**<br>Stores backlink overview data in Google Sheets.                     |
| Backlinks           | Google Sheets      | Appends detailed backlinks data to Google Sheets  | Reformat               |                       | ### 6. **Backlinks**<br>Stores detailed backlink info in Google Sheets.                            |
| Sticky Note3        | Sticky Note        | Documentation note for Re format output node      |                        |                       | ### 3. **Re format output**<br>Extracts and reformats relevant traffic data from API response.      |
| Sticky Note4        | Sticky Note        | Documentation note for Check webTraffic node      |                        |                       | ### 2. **Check webTraffic**<br>Sends request to Semrush API for traffic data.                       |
| Sticky Note1        | Sticky Note        | Documentation note for On form submission node    |                        |                       | ### 1. **On form submission**<br>Captures website URL from user form.                               |
| Sticky Note2        | Sticky Note        | Documentation note for Reformat node               |                        |                       | ### 4. **Reformat**<br>Processes backlinks data for Google Sheets storage.                         |
| Sticky Note5        | Sticky Note        | Documentation note for Backlink overview node     |                        |                       | ### 5. **Backlink overview**<br>Appends backlink overview data into Google Sheets.                  |
| Sticky Note6        | Sticky Note        | Documentation note for Backlinks node              |                        |                       | ### 6. **Backlinks**<br>Appends detailed backlink data into Google Sheets.                         |
| Sticky Note         | Sticky Note        | Overall workflow description and node explanations|                        |                       | # SEO-Friendly Title:<br>**Backlink Checker with Google Sheets Logging Using Semrush API**<br>...   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Form Trigger Node:**  
   - Type: Form Trigger  
   - Configure form title as "website backlink checker"  
   - Add a required form field labeled "website"  
   - Set webhook ID (auto-generated) for external submissions  

2. **Add an HTTP Request Node:**  
   - Name: "Check webTraffic"  
   - Method: POST  
   - URL: `https://top-backlink-checker.p.rapidapi.com/backlink.php`  
   - Content Type: multipart/form-data  
   - Body Parameters: Add parameter `website` with value `={{ $json.website }}` (dynamic from form)  
   - Header Parameters:  
     - `x-rapidapi-host`: "top-backlink-checker.p.rapidapi.com"  
     - `x-rapidapi-key`: Replace with your valid RapidAPI key  
   - Connect input from Form Trigger node  

3. **Add a Code Node for Backlink Overview Extraction:**  
   - Name: "Re format output"  
   - Language: JavaScript  
   - Code:  
     ```js
     return $input.first().json.data.semrushAPI.backlinksOverview;
     ```  
   - Connect input from HTTP Request node  

4. **Add a Code Node for Detailed Backlinks Extraction:**  
   - Name: "Reformat"  
   - Language: JavaScript  
   - Code:  
     ```js
     return $input.first().json.data.semrushAPI.backlinks;
     ```  
   - Connect input from HTTP Request node  

5. **Add Google Sheets Node for Backlink Overview:**  
   - Operation: Append  
   - Authentication: Use Google API Service Account credentials  
   - Document ID: Select or enter the Google Sheet ID where overview data will be stored  
   - Sheet Name: Select the sheet named "backlink overview" (or create one)  
   - Mapping Mode: Auto map input data fields from Code node  
   - Connect input from "Re format output" Code node  

6. **Add Google Sheets Node for Detailed Backlinks:**  
   - Operation: Append  
   - Authentication: Same Google API Service Account credentials  
   - Document ID: Same or different Google Sheet ID for detailed backlinks  
   - Sheet Name: Select or create "backlinks" sheet  
   - Define columns explicitly: targetUrl, sourceUrl, sourceTitle, pageAscore, lastSeen, internalNum, firstSeen, externalNum, anchor, nofollow  
   - Mapping Mode: Auto map input data fields  
   - Connect input from "Reformat" Code node  

7. **Connect all nodes as follows:**  
   - Form Trigger → Check webTraffic → splits to two nodes:  
     - Check webTraffic → Re format output → Backlink overview (Google Sheets)  
     - Check webTraffic → Reformat → Backlinks (Google Sheets)  

8. **Credential Setup:**  
   - For HTTP Request: Obtain and configure RapidAPI key for "top-backlink-checker" API  
   - For Google Sheets: Create and configure Google Service Account credentials with access to the target Google Sheets documents  

9. **Additional Notes:**  
   - Ensure Google Sheets have appropriate sheets created with matching column headers  
   - Validate API keys and permissions before executing workflow  
   - Configure webhook access for the form trigger to receive submissions  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                      | Context or Link                                                                                      |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| This workflow uses the Top Backlink Checker API, which relies on Semrush data, to gather backlink and traffic information.                                                     | API: https://rapidapi.com/collection/backlink-checker-apis                                        |
| Google Sheets nodes use Service Account authentication for automated and secure access to sheets. Make sure the service account email is shared with the sheets.               | https://developers.google.com/identity/protocols/oauth2/service-account                              |
| The workflow form trigger node requires webhook setup accessible externally to accept website input from users or other systems.                                              | n8n Form Trigger documentation (n8n.io)                                                            |
| Replace placeholder API key `"your key"` in HTTP Request node with your actual RapidAPI key for successful API calls.                                                           | https://rapidapi.com/                                                                                 |
| The Google Sheets document IDs and sheet IDs must be set properly in the nodes to ensure data is appended to the correct locations.                                            | Google Sheets URL contains document ID; Sheet ID is obtained from the Google Sheets UI or API.      |
| This workflow is designed to be modular: code nodes extract and clean data separately for overview and detailed backlinks, allowing easy customization or extension.            |                                                                                                    |

---

**Disclaimer:**  
The text above originates exclusively from an automated workflow created with n8n, a workflow automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.

---