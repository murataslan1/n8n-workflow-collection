Automate SEO Keyword & SERP Analysis with DataForSEO and Google Sheets

https://n8nworkflows.xyz/workflows/automate-seo-keyword---serp-analysis-with-dataforseo-and-google-sheets-10137


# Automate SEO Keyword & SERP Analysis with DataForSEO and Google Sheets

### 1. Workflow Overview

This workflow automates SEO keyword and SERP (Search Engine Results Page) analysis by integrating DataForSEO API services with Google Sheets. It enables users to submit a keyword, select location and language, and choose among multiple SEO-related operations, such as finding related keywords, keyword suggestions, autocomplete results, subtopics, or "people also ask" queries. The workflow processes the user input, calls the appropriate DataForSEO API endpoint, parses the returned data, and stores the results in dynamically created Google Sheets tabs for organized analysis.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Validation:** Handles user input via a form, checks for completeness, and prepares data fields.
- **1.2 Operation Selection (Switch):** Routes the workflow based on the SEO operation chosen by the user.
- **1.3 API Request and Response Handling:** Sends requests to DataForSEO endpoints depending on the operation, receives and parses the data.
- **1.4 Data Preparation:** Formats and filters the API response data for clarity and usability.
- **1.5 Google Sheets Integration:** Creates specific sheets for each operation and appends the processed data.
- **1.6 Special Data Filtering:** Includes filtering logic for "people also ask" data for refined storage.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Input Reception and Validation

**Overview:**  
This block captures user input from a web form, validates that all required fields (keyword, location, language, operation) are filled, and sets up consistent field names for downstream processing.

**Nodes Involved:**  
- On form submission  
- Check If fields not empty  
- Edit Fields  
- Add operation to main sheet in Google Sheets

**Node Details:**

- **On form submission**  
  - Type: Form Trigger  
  - Role: Entry point; captures keyword, location_name, language_name, and operation from user input form.  
  - Key Config: Custom CSS styles for UI, form fields include keyword (text), location_name (dropdown), language_name (dropdown), and operation (dropdown with 5 options).  
  - Input: Webhook trigger on form submit  
  - Output: JSON with user inputs  
  - Edge cases: User submits incomplete form; handled later by validation node.  
  - Version: 2.2

- **Check If fields not empty**  
  - Type: If node  
  - Role: Validates that keyword, location_name, language_name, and operation fields are not empty before proceeding.  
  - Conditions: All four fields must be non-empty strings.  
  - Input: Output from form submission  
  - Output: True/False paths; only proceeds if all fields valid.  
  - Edge cases: Missing or empty fields abort workflow early.

- **Edit Fields**  
  - Type: Set node  
  - Role: Normalizes input JSON fields to consistent names for downstream nodes (assigns keyword, location_name, language_name, operation).  
  - Key Expressions: Assigns operation = Operation from input (case sensitive), keyword, location_name, language_name.  
  - Input: From validation node (true path)  
  - Output: Cleaned JSON for further processing.

- **Add operation to main sheet in Google Sheets**  
  - Type: Google Sheets (Append)  
  - Role: Logs each query with timestamp, keyword, operation, language, and location into a summary sheet.  
  - Config: Appends new row to sheet "summary" in document ID "1Ndz3PLihy9k96_S-uvjUGK9f9TQulIwtn1-mo53D2LQ" using Service Account authentication.  
  - Input: Edited fields JSON  
  - Output: Passes data to Switch node.  
  - Edge cases: Google API credential errors, quota limits.

---

#### 2.2 Operation Selection (Switch)

**Overview:**  
Routes workflow execution based on the user's chosen SEO operation. Each operation corresponds to a specific DataForSEO API call and subsequent processing steps.

**Nodes Involved:**  
- Switch

**Node Details:**

- **Switch**  
  - Type: Switch node  
  - Role: Routes workflow into one of five outputs based on the operation string: related keywords, keyword suggestion, autocomplete, subtopics, or people also ask.  
  - Conditions: Exact string match of operation field.  
  - Input: From "Add operation to main sheet" node  
  - Output: Five branches corresponding to the five operations.  
  - Edge cases: Unrecognized operation strings cause no branch to trigger (workflow halts).  
  - Version: 3.2

---

#### 2.3 API Request and Response Handling

**Overview:**  
Sends HTTP POST requests to DataForSEO API endpoints based on the selected operation and captures the raw response.

**Nodes Involved:**  
- related keyword  
- keyword suggestion  
- get autocomplete  
- get subtopics  
- people also ask

**Node Details:**

- Each node is an HTTP Request node configured with:  
  - Method: POST  
  - URL: Specific DataForSEO endpoint per operation  
  - Authentication: HTTP Basic Auth with "Data for SEO" credentials  
  - JSON Body: Includes keyword, location_name, language_name, plus operation-specific parameters (e.g., depth, limit)  
  - Sends request and expects JSON response.  
- Input: From respective sheet creation node (see next block)  
- Output: Raw API response JSON.  
- Edge cases: API authentication failures, timeouts, malformed responses, rate limits.

---

#### 2.4 Data Preparation

**Overview:**  
Processes and restructures the API response data by splitting complex arrays and mapping relevant fields to simplified output objects tailored for Google Sheets.

**Nodes Involved:**  
- Split Out (and variants: Split Out1, Split Out2, etc.)  
- Edit Fields1, Edit Fields2, Edit Fields4, Edit Fields5, Edit Fields6  
- Filter people also ask

**Node Details:**

- **Split Out nodes**  
  - Type: Split Out  
  - Role: Extracts nested arrays from API response (mostly from `tasks[0].result[0].items` or `sub_topics`) into individual items for processing.  
  - Input: API response JSON  
  - Output: One item per execution for downstream processing.

- **Edit Fields nodes**  
  - Type: Set nodes  
  - Role: Map and rename fields from API response items into a unified structure for Google Sheets.  
  - Key Fields:  
    - For related keywords: keyword, keyword difficulty, search intent, last update, SERP analysis, search volume, CPC, competition, type  
    - For keyword suggestions: keyword, search intent, suggested keyword, last update, search volume, CPC, competition, type  
    - For autocomplete: primary keyword, type, suggestions  
    - For subtopics: primary keyword, type ("sub_topics"), sub topics list  
    - For people also ask: title, type, description, url, domain name  
  - Input: Split Out node outputs  
  - Output: Structured JSON for appending to sheets.

- **Filter people also ask**  
  - Type: Filter  
  - Role: Ensures only data items with type "people_also_ask" pass through for further processing.  
  - Input: Split Out4 node output  
  - Output: Filtered subset of items.

- Edge cases: Unexpected data structures in API response, missing fields, empty arrays.

---

#### 2.5 Google Sheets Integration

**Overview:**  
Creates dedicated sheets for each operation with dynamic titles and appends prepared data rows into these sheets for user access and analysis.

**Nodes Involved:**  
- related keyword sheet  
- keyword suggestion sheet  
- get autocomplete sheet  
- get subtopics sheet  
- people also ask sheet  
- Add to Sheet, Add to Sheet1, Add to Sheet2, Add to Sheet3, Add to Sheet4

**Node Details:**

- **Sheet Creation nodes** (e.g., related keyword sheet)  
  - Type: Google Sheets (Create Sheet)  
  - Role: Creates a new sheet tab inside a specific Google Sheets document, titled as "{keyword} [{operation}]" (e.g., "SEO [related keywords]").  
  - Config: Uses a fixed spreadsheet document ID, Service Account authentication, tab color varies by operation.  
  - Input: From Switch node (user input)  
  - Output: Sheet creation info including sheetId.

- **Add to Sheet nodes** (e.g., Add to Sheet, Add to Sheet1, etc.)  
  - Type: Google Sheets (Append)  
  - Role: Appends processed data rows into the specific sheet tab created earlier.  
  - Config: Uses sheetId from the respective sheet creation node to append data dynamically.  
  - Input: From Edit Fields nodes (structured data)  
  - Edge cases: Google API errors, permission issues, sheet creation delays.

---

#### 2.6 Special Data Filtering

**Overview:**  
Refines the "people also ask" data by filtering only relevant entries before appending to Google Sheets.

**Nodes Involved:**  
- Filter people also ask

**Node Details:**

- See section 2.4 for detailed behavior.  
- This filter ensures data integrity by preventing unrelated data from being stored in the "people also ask" sheet.

---

### 3. Summary Table

| Node Name                       | Node Type            | Functional Role                                      | Input Node(s)                     | Output Node(s)                  | Sticky Note                                                                                           |
|--------------------------------|----------------------|----------------------------------------------------|----------------------------------|--------------------------------|-----------------------------------------------------------------------------------------------------|
| On form submission             | Form Trigger         | Captures user inputs (keyword, location, language, operation) | -                                | Check If fields not empty       | Get keyword: Get keyword, location, language and operation from user.                                |
| Check If fields not empty      | If                   | Validates all required fields are filled           | On form submission               | Edit Fields                    |                                                                                                     |
| Edit Fields                   | Set                  | Normalizes input fields for processing              | Check If fields not empty        | Add operation to main sheet    |                                                                                                     |
| Add operation to main sheet in Google Sheets | Google Sheets (Append) | Logs user queries with timestamp                     | Edit Fields                     | Switch                        |                                                                                                     |
| Switch                       | Switch               | Routes workflow to correct operation branch         | Add operation to main sheet      | related keyword sheet, keyword suggestion sheet, get autocomplete sheet, get subtopics sheet, people also ask sheet | Choose what operation to do. It gets the operation from user.                                        |
| related keyword sheet         | Google Sheets (Create) | Creates sheet tab for related keywords               | Switch                         | related keyword                | Create a sheet: It creates a sheet titled {keyword}{operation} for each operation.                   |
| keyword suggestion sheet      | Google Sheets (Create) | Creates sheet tab for keyword suggestions            | Switch                         | keyword suggestion             | Create a sheet (see above).                                                                         |
| get autocomplete sheet        | Google Sheets (Create) | Creates sheet tab for autocomplete results           | Switch                         | get autocomplete              | Create a sheet (see above).                                                                         |
| get subtopics sheet           | Google Sheets (Create) | Creates sheet tab for subtopics                       | Switch                         | get subtopics                 | Create a sheet (see above).                                                                         |
| people also ask sheet         | Google Sheets (Create) | Creates sheet tab for "people also ask" data         | Switch                         | people also ask               | Create a sheet (see above).                                                                         |
| related keyword               | HTTP Request         | Calls related keywords API endpoint                   | related keyword sheet           | Split Out                    | DataforSEO API Request: Send request to DataforSEO with operation, keyword, location_name, and language_name. |
| keyword suggestion            | HTTP Request         | Calls keyword suggestions API endpoint                | keyword suggestion sheet        | Split Out1                   | DataforSEO API Request (see above).                                                                |
| get autocomplete             | HTTP Request         | Calls autocomplete API endpoint                       | get autocomplete sheet          | Split Out2                   | DataforSEO API Request (see above).                                                                |
| get subtopics                | HTTP Request         | Calls subtopics API endpoint                           | get subtopics sheet             | Split Out3                   | DataforSEO API Request (see above).                                                                |
| people also ask              | HTTP Request         | Calls "people also ask" API endpoint                   | people also ask sheet           | Split Out4                   | DataforSEO API Request (see above).                                                                |
| Split Out                   | Split Out            | Splits related keywords response array                | related keyword                 | Edit Fields1                 | Get the Data from API call: It gets the data needed and ignores other fields.                       |
| Split Out1                  | Split Out            | Splits keyword suggestions response array             | keyword suggestion              | Edit Fields2                 | Get the Data from API call (see above).                                                             |
| Split Out2                  | Split Out            | Splits autocomplete response array                     | get autocomplete               | Edit Fields4                 | Get the Data from API call (see above).                                                             |
| Split Out3                  | Split Out            | Splits subtopics response array                         | get subtopics                  | Edit Fields6                 | Get the Data from API call (see above).                                                             |
| Split Out4                  | Split Out            | Splits "people also ask" response array                 | people also ask                | Filter people also ask        | Get the Data from API call (see above).                                                             |
| Filter people also ask       | Filter               | Filters data items with type "people_also_ask"         | Split Out4                    | Split Out6                  |                                                                                                     |
| Split Out6                  | Split Out            | Splits filtered "people also ask" items                 | Filter people also ask         | Edit Fields5                 |                                                                                                     |
| Edit Fields1                | Set                  | Maps related keywords fields for sheet append          | Split Out                    | Add to Sheet                | Append data to sheet: This node appends data to the created sheet.                                  |
| Edit Fields2                | Set                  | Maps keyword suggestions fields for sheet append       | Split Out1                   | Add to Sheet1               | Append data to sheet (see above).                                                                   |
| Edit Fields4                | Set                  | Maps autocomplete fields for sheet append               | Split Out2                   | Add to Sheet2               | Append data to sheet (see above).                                                                   |
| Edit Fields6                | Set                  | Maps subtopics fields for sheet append                   | Split Out3                   | Add to Sheet3               | Append data to sheet (see above).                                                                   |
| Edit Fields5                | Set                  | Maps "people also ask" fields for sheet append           | Split Out6                   | Add to Sheet4               | Append data to sheet (see above).                                                                   |
| Add to Sheet                | Google Sheets (Append) | Appends related keywords data to created sheet          | Edit Fields1                 | -                          |                                                                                                     |
| Add to Sheet1               | Google Sheets (Append) | Appends keyword suggestions data to created sheet       | Edit Fields2                 | -                          |                                                                                                     |
| Add to Sheet2               | Google Sheets (Append) | Appends autocomplete data to created sheet              | Edit Fields4                 | -                          |                                                                                                     |
| Add to Sheet3               | Google Sheets (Append) | Appends subtopics data to created sheet                  | Edit Fields6                 | -                          |                                                                                                     |
| Add to Sheet4               | Google Sheets (Append) | Appends "people also ask" data to created sheet          | Edit Fields5                 | -                          |                                                                                                     |
| Sticky Note                 | Sticky Note           | Various notes describing blocks and nodes               | -                            | -                          | See notes in section 5.                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the form trigger node ("On form submission"):**  
   - Use Form Trigger node with fields:  
     - `keyword` (text, required)  
     - `location_name` (dropdown, required, with country list)  
     - `language_name` (dropdown, required, with language list)  
     - `Operation` (dropdown, optional, with options: related keywords🔑, keyword suggestion💡, get autocomplete🧩, get subtopics📚, people also ask🔍)  
   - Customize the form CSS as per the provided style for UI polish.

2. **Add an If node ("Check If fields not empty"):**  
   - Conditions: keyword, location_name, language_name, Operation all not empty.  
   - Connect main output of Form Trigger to this node.

3. **Add a Set node ("Edit Fields"):**  
   - Map incoming fields:  
     - operation = `Operation` (case sensitive)  
     - keyword = `keyword`  
     - location_name = `location_name`  
     - language_name = `language_name`  
   - Connect the true output of the If node to this node.

4. **Add a Google Sheets Append node ("Add operation to main sheet in Google Sheets"):**  
   - Connect to "Edit Fields" node.  
   - Configure to append to the summary sheet (sheet ID and document ID as specified).  
   - Map columns: Time (from submission timestamp), keyword, operation, language_name, location_name.  
   - Use Service Account credentials.

5. **Add a Switch node ("Switch"):**  
   - Connect from the Google Sheets append node.  
   - Create 5 outputs with rules matching `operation` field exactly to:  
     - "related keywords🔑"  
     - "keyword suggestion💡"  
     - "get autocomplete🧩"  
     - "get subtopics📚"  
     - "people also ask🔍"

6. **For each Switch output:**

   a. **Create a Google Sheets Create Sheet node** (one per operation):  
      - Title: `={{ $json.keyword }} [{{ $json.operation }}]`  
      - Assign different tab colors per operation for ease of identification.  
      - Use the same spreadsheet document ID and Service Account credentials.

   b. **Add an HTTP Request node** (specific to operation):  
      - POST to the corresponding DataForSEO API endpoint:  
        - related keywords → `/v3/dataforseo_labs/google/related_keywords/live`  
        - keyword suggestion → `/v3/dataforseo_labs/google/keyword_suggestions/live`  
        - autocomplete → `/v3/serp/google/autocomplete/live/advanced`  
        - subtopics → `/v3/content_generation/generate_sub_topics/live`  
        - people also ask → `/v3/serp/google/organic/live/advanced`  
      - Use HTTP Basic Auth credentials for DataForSEO.  
      - Body: JSON with keyword, location_name, language_name, and operation-specific parameters (depth, limit, etc.).  
      - Connect Google Sheets Create Sheet node to respective HTTP Request node.

   c. **Add a Split Out node** to extract the array of results from API response:  
      - Field to split varies by operation (mostly `tasks[0].result[0].items` or `sub_topics`).  
      - Connect HTTP Request node output to Split Out node.

   d. **For "people also ask" operation, add a Filter node** after Split Out:  
      - Condition: `type` equals `"people_also_ask"`.  
      - Connect Split Out to Filter node.

   e. **Add Set nodes** to map fields from API response items into simplified JSON for sheets:  
      - For each operation, map fields as per section 2.4.  
      - Connect Split Out (or Filter for PAA) node to respective Set node.

   f. **Add Google Sheets Append nodes** to append mapped data into the newly created sheet:  
      - Use the sheetId from the corresponding sheet creation node dynamically for sheetName.  
      - Connect Set nodes to Google Sheets Append nodes.

7. **Connect all Add to Sheet nodes to end the workflow.**

8. **Configure all credentials:**  
   - DataForSEO HTTP Basic Auth credentials with valid username and password.  
   - Google Sheets Service Account with proper permissions on the target spreadsheet.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                         | Context or Link                                                                                                      |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| The workflow UI form is styled with a custom dark neon theme for enhanced user experience.                                                                                                                                         | Custom CSS embedded in On form submission node.                                                                     |
| DataForSEO API documentation for endpoints used can be found at https://docs.dataforseo.com/                                                                                                                                       | Use for understanding API parameters and response structures.                                                       |
| Google Sheets document referenced: "SEO Related Keyword Finder🚀 | n8n" with ID `1Ndz3PLihy9k96_S-uvjUGK9f9TQulIwtn1-mo53D2LQ` must be accessible by the Service Account used.                                                                                  | Google Sheets integration.                                                                                           |
| The workflow includes detailed sticky notes for clarity on each block's purpose and node function.                                                                                                                                 | Embedded in the workflow nodes for user reference.                                                                   |
| For best performance, monitor API rate limits and handle errors gracefully by extending workflow with error handling nodes if needed.                                                                                            | Suggested improvement.                                                                                               |

---

**Disclaimer:**  
The provided text originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly respects content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.