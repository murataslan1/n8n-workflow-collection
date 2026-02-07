Automate Google Maps Lead Generation with Perplexity AI and Email Verification

https://n8nworkflows.xyz/workflows/automate-google-maps-lead-generation-with-perplexity-ai-and-email-verification-8904


# Automate Google Maps Lead Generation with Perplexity AI and Email Verification

### 1. Workflow Overview

This workflow automates the process of generating leads from Google Maps data by querying the Serper API for Google Places results, extracting and enriching place details with AI via Perplexity, verifying email addresses, and managing the data within Google Sheets. It is designed for lead generation use cases where users want to gather business information, validate contact details, and maintain a clean, updated spreadsheet of prospects.

The workflow’s logic is divided into two main functional blocks:

**1.1 Google Places Data Extraction and Storage**  
- Receives search parameters and pages through Google Places results via Serper API  
- Maps and normalizes place data  
- Appends the extracted places as rows into a designated Google Sheet  
- Loops until no more places are returned or page limit is reached

**1.2 Contact Details Enrichment and Email Verification**  
- Triggered on new rows added to the Google Sheet  
- Uses Perplexity AI to fetch missing contact details (email and company background)  
- Parses AI response, filters valid entries  
- Verifies email addresses via Verificaremails.com service  
- Updates the Google Sheet with enriched and verified contact data

---

### 2. Block-by-Block Analysis

#### 2.1 Google Places Data Extraction and Storage

**Overview:**  
This block manages querying Google Places data through Serper API, paginates results, processes place information, and appends each place as a row to a Google Sheet.

**Nodes Involved:**  
- When clicking ‘Execute workflow’ (Manual Trigger)  
- Set parameters  
- JavaScript - Page Management  
- Split In Batches  
- HTTP Request  
- If End Batch  
- JavaScript1 - Places Objects  
- Append row in sheet (Resultados)  

**Node Details:**

- **When clicking ‘Execute workflow’**  
  - Type: Manual Trigger  
  - Role: Starts the workflow manually  
  - Configuration: No parameters; triggers the process on demand  
  - Inputs: None  
  - Outputs: To ‘Set parameters’  
  - Edge Cases: None  

- **Set parameters**  
  - Type: Set  
  - Role: Defines all input parameters such as query (`q`), geographic locale (`gl`), language (`hl`), number of results per page (`num`), page start and limit, and Google Sheets configuration (sheet names)  
  - Parameters:  
    - `q`: "librerías Vic" (example query)  
    - `gl`: "es" (country code Spain)  
    - `hl`: "es" (language Spanish)  
    - `num`: 10 (results per page)  
    - `pageStart`: 1  
    - `pageLimit`: 100  
    - `resultsSheetName`: "Resultados"  
    - `logSheetName`: "Log"  
    - `language`: "spanish"  
  - Inputs: From Manual Trigger  
  - Outputs: To ‘JavaScript - Page Management’  
  - Edge Cases: Missing or invalid query parameters may cause API errors  

- **JavaScript - Page Management**  
  - Type: Code  
  - Role: Generates an array of pagination objects `{ page: n }` from `pageStart` to `pageLimit` to iterate over pages  
  - Key Code: Loops from `pageStart` to `pageLimit`, emitting `{ page }` objects  
  - Inputs: From ‘Set parameters’  
  - Outputs: To ‘Split In Batches’  
  - Edge Cases: If `pageLimit` < `pageStart`, no pages generated  

- **Split In Batches**  
  - Type: Split In Batches  
  - Role: Processes one page object per batch to throttle API calls and handle paging  
  - Parameters: batch size = 1  
  - Inputs: From ‘JavaScript - Page Management’  
  - Outputs: To ‘HTTP Request’  
  - Edge Cases: Batching failures or empty inputs may halt pagination  

- **HTTP Request**  
  - Type: HTTP Request  
  - Role: Sends POST request to Serper’s Google Places API with search parameters and current page number  
  - Config:  
    - URL: `https://google.serper.dev/places`  
    - Method: POST  
    - Body includes `q`, `gl`, `hl`, `num`, and current `page`  
    - Auth: HTTP Header Auth (credential required)  
  - Inputs: From ‘Split In Batches’  
  - Outputs: To ‘If End Batch’  
  - Edge Cases: Network issues, authentication errors, API rate limits, or invalid parameters  

- **If End Batch**  
  - Type: If  
  - Role: Checks if the response contains any places (`places.length > 0`) to decide whether to continue pagination or stop  
  - Inputs: From ‘HTTP Request’  
  - Outputs:  
    - True (places present): To ‘JavaScript1 - Places Objects’  
    - False (no places): Ends loop (no output)  
  - Edge Cases: Empty or malformed API response  

- **JavaScript1 - Places Objects**  
  - Type: Code  
  - Role: Maps each place object to a normalized JSON row with fields: UUID, Name, Address, Website, Rating, Email (empty), Phone (normalized), Opening Hours (empty)  
  - Input: Places array from ‘If End Batch’  
  - Output: Array of place rows  
  - Edge Cases: Missing fields in API response may produce empty strings  

- **Append row in sheet (Resultados)**  
  - Type: Google Sheets  
  - Role: Appends the mapped place rows as new rows to the specified Google Sheet and tab (“Resultados”)  
  - Config: Spreadsheet ID and Sheet name set; columns mapped explicitly  
  - Inputs: From ‘JavaScript1 - Places Objects’  
  - Outputs: Loops back to ‘Split In Batches’ for next page iteration  
  - Edge Cases: Google Sheets API errors, permission issues, quota limits  

---

#### 2.2 Contact Details Enrichment and Email Verification

**Overview:**  
Triggered by new rows in the Google Sheet, this block uses Perplexity AI to enrich place data with email and company background, verifies email addresses using Verificaremails.com, and updates the sheet accordingly.

**Nodes Involved:**  
- Google Sheets Trigger  
- Filter  
- Loop Over Items  
- Get Contact Details via Perplexity  
- Convert to JSON Object1  
- If  
- VerificarEmails (Email Verification node)  
- Update row in sheet  

**Node Details:**

- **Google Sheets Trigger**  
  - Type: Google Sheets Trigger  
  - Role: Watches for new rows added in the “Resultados” sheet to start enrichment  
  - Parameters: Polls every minute, triggers on row addition  
  - Inputs: None (trigger node)  
  - Outputs: To ‘Filter’  
  - Edge Cases: Polling delays, missed events if Google API unstable  

- **Filter**  
  - Type: Filter  
  - Role: Filters out rows where the Name field is empty or equals “Name” (header row) to avoid processing invalid data  
  - Inputs: From ‘Google Sheets Trigger’  
  - Outputs: To ‘Loop Over Items’  
  - Edge Cases: Malformed rows may bypass filters  

- **Loop Over Items**  
  - Type: Split In Batches  
  - Role: Processes each filtered row individually, allowing asynchronous enrichment and verification  
  - Inputs: From ‘Filter’  
  - Outputs:  
    - Output 1 (empty): ends branch for invalid items  
    - Output 2: to ‘Get Contact Details via Perplexity’  
  - Edge Cases: Large batch sizes may cause performance issues; no explicit batch size set  

- **Get Contact Details via Perplexity**  
  - Type: HTTP Request  
  - Role: Calls Perplexity AI API to retrieve company email and background info based on place name, address, and website  
  - Config:  
    - URL: `https://api.perplexity.ai/chat/completions`  
    - Method: POST  
    - Body: JSON with system prompt (research assistant) and user query referencing place name, address, website  
    - Response format specified as JSON schema with Email and Background fields  
    - Auth: Bearer token (credential required)  
  - Inputs: From ‘Loop Over Items’  
  - Outputs: To ‘Convert to JSON Object1’  
  - Edge Cases: API errors, rate limits, parsing errors, incomplete AI responses  

- **Convert to JSON Object1**  
  - Type: Code  
  - Role: Extracts and parses the JSON string response from Perplexity to structured JSON object for further processing  
  - Key Code: Removes markdown-style code block markers and parses JSON  
  - Inputs: From ‘Get Contact Details via Perplexity’  
  - Outputs: To ‘If’ node  
  - Edge Cases: JSON parsing errors if AI response malformed  

- **If**  
  - Type: If  
  - Role: Checks if the returned Email value equals "N/A" (indicating no valid email found)  
  - Inputs: From ‘Convert to JSON Object1’  
  - Outputs:  
    - True (Email = N/A): to ‘Update row in sheet’ (skip verification)  
    - False (valid Email): to ‘VerificarEmails’  
  - Edge Cases: Case sensitivity or unexpected email formats may affect branching  

- **VerificarEmails**  
  - Type: Verificaremails proprietary node  
  - Role: Verifies the email address format, domain, and inbox validity  
  - Inputs: From ‘If’ (when Email is valid)  
  - Outputs: To ‘Update row in sheet’  
  - Auth: Requires Verificaremails.com API credentials  
  - Edge Cases: API quota exceeded, invalid email formats, network errors  

- **Update row in sheet**  
  - Type: Google Sheets  
  - Role: Updates the existing row in the sheet with enriched Email, Summary (background), and verification status (“Valid Email” field)  
  - Matching: Uses UUID to identify the row to update  
  - Inputs: From both verification and skip branches  
  - Outputs: Loops back to ‘Loop Over Items’ for next row  
  - Edge Cases: Google Sheets permission errors, concurrency issues  

---

### 3. Summary Table

| Node Name                    | Node Type                          | Functional Role                              | Input Node(s)                   | Output Node(s)                    | Sticky Note                                                                                               |
|------------------------------|----------------------------------|----------------------------------------------|--------------------------------|----------------------------------|----------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                   | Starts the extraction process manually       | None                           | Set parameters                   |                                                                                                          |
| Set parameters                | Set                              | Defines query and pagination parameters      | When clicking ‘Execute workflow’ | JavaScript - Page Management      |                                                                                                          |
| JavaScript - Page Management  | Code                             | Generates page numbers for pagination         | Set parameters                 | Split In Batches                 |                                                                                                          |
| Split In Batches              | Split In Batches                 | Processes one page per batch                   | JavaScript - Page Management   | HTTP Request                    |                                                                                                          |
| HTTP Request                 | HTTP Request                     | Calls Serper API to get Google Places results | Split In Batches               | If End Batch                   |                                                                                                          |
| If End Batch                | If                               | Checks if places returned to continue paging | HTTP Request                  | JavaScript1 - Places Objects (true branch) |                                                                                                          |
| JavaScript1 - Places Objects | Code                             | Normalizes place data to row format            | If End Batch (true)             | Append row in sheet (Resultados) |                                                                                                          |
| Append row in sheet (Resultados) | Google Sheets                  | Appends place rows to Google Sheet             | JavaScript1 - Places Objects   | Split In Batches               |                                                                                                          |
| Google Sheets Trigger        | Google Sheets Trigger            | Triggers on new row added in Google Sheet     | None                          | Filter                         |                                                                                                          |
| Filter                      | Filter                           | Filters out invalid or header rows            | Google Sheets Trigger          | Loop Over Items                |                                                                                                          |
| Loop Over Items             | Split In Batches                 | Processes each place row individually          | Filter                        | Get Contact Details via Perplexity (valid items) |                                                                                                          |
| Get Contact Details via Perplexity | HTTP Request                 | Calls AI to enrich data with Email & Background | Loop Over Items             | Convert to JSON Object1         |                                                                                                          |
| Convert to JSON Object1     | Code                             | Parses AI JSON response                         | Get Contact Details via Perplexity | If                           |                                                                                                          |
| If                         | If                               | Checks if AI returned Email = "N/A"            | Convert to JSON Object1        | Update row in sheet (true), VerificarEmails (false) |                                                                                                          |
| VerificarEmails             | Verificaremails                  | Verifies email validity                         | If (false branch)              | Update row in sheet            |                                                                                                          |
| Update row in sheet         | Google Sheets                   | Updates Google Sheet with enriched and verified data | If (true), VerificarEmails  | Loop Over Items               |                                                                                                          |
| Sticky Note2                | Sticky Note                     | Describes Google Maps Data Extraction block    | None                         | None                          | ## Google Maps Data Extraction\nPages through Serper’s **Google Places** results, ...                     |
| Sticky Note3                | Sticky Note                     | Describes overall workflow from Maps to Email Verification | None                    | None                          | **Workflow: Maps → Sheet → Email Verification**\n\n1. **Search & save:** Find places on Google Maps ...    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger node**: Name it “When clicking ‘Execute workflow’”. No parameters.

2. **Add Set node**: Name “Set parameters”. Configure to set variables:  
   - `q` (string): "librerías Vic"  
   - `gl` (string): "es"  
   - `hl` (string): "es"  
   - `num` (number): 10  
   - `pageStart` (number): 1  
   - `pageLimit` (number): 100  
   - `resultsSheetName` (string): "Resultados"  
   - `logSheetName` (string): "Log"  
   - `language` (string): "spanish"  
   Connect “When clicking ‘Execute workflow’” → “Set parameters”.

3. **Add Code node**: Name “JavaScript - Page Management”. Paste code to generate pages from `pageStart` to `pageLimit`. Connect “Set parameters” → “JavaScript - Page Management”.

4. **Add Split In Batches node**: Name “Split In Batches”, batch size = 1. Connect “JavaScript - Page Management” → “Split In Batches”.

5. **Add HTTP Request node**: Name “HTTP Request”. Configure:  
   - Method: POST  
   - URL: https://google.serper.dev/places  
   - Body parameters: `q`, `gl`, `hl`, `num` from Set parameters; `page` from batch item  
   - Authentication: HTTP Header Auth (create/set credential with Serper API key)  
   Connect “Split In Batches” → “HTTP Request”.

6. **Add If node**: Name “If End Batch”. Condition: `places` array exists and length > 0 (expression: `={{ Array.isArray($json.places) && $json.places.length > 0 }}`). Connect “HTTP Request” → “If End Batch”.

7. **Add Code node**: Name “JavaScript1 - Places Objects”. Code to map each place object to normalized fields (UUID, Name, Address, Website, Rating, Email empty, Phone normalized, Opening Hours empty). Connect “If End Batch” true → “JavaScript1 - Places Objects”.

8. **Add Google Sheets node**: Name “Append row in sheet (Resultados)”. Configure to append rows to the “Resultados” sheet with columns matching place fields. Use OAuth2 credentials for Google Sheets. Connect “JavaScript1 - Places Objects” → “Append row in sheet (Resultados)”.

9. **Loop back**: Connect “Append row in sheet (Resultados)” → “Split In Batches” to continue paging.

10. **Add Google Sheets Trigger node**: Name “Google Sheets Trigger”. Configure to watch for new rows added in “Resultados” sheet, polling every minute. Use OAuth2 credentials. This is a separate trigger branch.

11. **Add Filter node**: Name “Filter”. Filter out rows where Name is empty or equals “Name” (header). Connect “Google Sheets Trigger” → “Filter”.

12. **Add Split In Batches node**: Name “Loop Over Items” with default batch settings. Connect “Filter” → “Loop Over Items”.

13. **Add HTTP Request node**: Name “Get Contact Details via Perplexity”. Configure POST request to `https://api.perplexity.ai/chat/completions` with body including system/user prompts requesting Email and Background for the company. Use Bearer Auth credential (Perplexity API key). Connect “Loop Over Items” → “Get Contact Details via Perplexity”.

14. **Add Code node**: Name “Convert to JSON Object1”. Script to remove markdown code block wrappers and parse JSON response from AI. Connect “Get Contact Details via Perplexity” → “Convert to JSON Object1”.

15. **Add If node**: Name “If”. Condition: Check if Email equals "N/A". Connect “Convert to JSON Object1” → “If”.

16. **Add Google Sheets node**: Name “Update row in sheet”. Configure to update row in “Resultados” sheet by matching UUID. Map Email, Summary (Background), and Valid Email status. Use Google Sheets OAuth2 credentials. Connect both “If” true branch → “Update row in sheet” and “VerificarEmails” output → “Update row in sheet”.

17. **Add Verificaremails node**: Name “VerificarEmails”. Configure with Verificaremails.com API credentials. Email input from AI response. Connect “If” false branch → “VerificarEmails”.

18. **Connect “Update row in sheet” → “Loop Over Items”** to continue processing remaining rows.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                        | Context or Link                                                                                      |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| ## Google Maps Data Extraction: Pages through Serper’s Google Places results, turns each place into a row, appends to Google Sheets, and stops when places array is empty.                                                                            | Sticky Note2 in workflow                                                                           |
| Workflow: Maps → Sheet → Email Verification. Ensures clean, reliable contact data by enriching emails and verifying them before updating the sheet. Requires Verificaremails.com account.                                                             | Sticky Note3 in workflow                                                                           |
| Official Serper.dev API documentation: https://serper.dev/docs                                                                                                                                                                                     | Recommended for API parameter details and limits                                                  |
| Perplexity AI API docs and JSON schema usage: https://api.perplexity.ai/docs                                                                                                                                                                        | Useful for customizing AI enrichment queries                                                      |
| Verificaremails.com API and n8n node documentation: https://verificaremails.com/n8n                                                                                                                                                                 | For email verification credential setup and quota management                                      |
| Google Sheets API limits and OAuth2 setup: https://developers.google.com/sheets/api                                                                                                                                                                 | Important for handling large data writes and avoiding quota errors                                |

---

**Disclaimer:** The provided text originates solely from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.