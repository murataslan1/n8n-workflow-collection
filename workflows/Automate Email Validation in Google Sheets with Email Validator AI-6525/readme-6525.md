Automate Email Validation in Google Sheets with Email Validator AI

https://n8nworkflows.xyz/workflows/automate-email-validation-in-google-sheets-with-email-validator-ai-6525


# Automate Email Validation in Google Sheets with Email Validator AI

### 1. Workflow Overview

This workflow automates the validation of email addresses stored in a Google Sheet by leveraging an external email validation API accessed via RapidAPI. It reads all emails from the sheet, processes each email individually through the API to determine if it is disposable or fake, and updates the same Google Sheet row with the validation results.

Logical blocks included:

- **1.1 Manual Trigger**: Starts the workflow manually.
- **1.2 Google Sheets Read**: Reads all rows and emails from a specified Google Sheet using a Google Service Account.
- **1.3 Iterative Processing (Split In Batches)**: Processes each email row one by one to avoid bulk API calls.
- **1.4 Email Validation API Call**: Sends each email via HTTP POST to the Email Validator AI endpoint on RapidAPI.
- **1.5 Google Sheets Update**: Updates the corresponding row in the Google Sheet with validation results such as whether the email is disposable.

---

### 2. Block-by-Block Analysis

#### 1.1 Manual Trigger

- **Overview:**  
  Initiates the workflow manually via the n8n editor interface. Primarily used for development or one-time executions.

- **Nodes Involved:**  
  - When clicking ‘Execute workflow’

- **Node Details:**  
  - Type: Manual Trigger  
  - Configuration: Default manual trigger with no parameters.  
  - Expressions/Variables: None.  
  - Input: None (trigger node).  
  - Output: Connects to Google Sheets Read node.  
  - Edge Cases: None specific; workflow will not proceed unless manually triggered.

---

#### 1.2 Google Sheets Read

- **Overview:**  
  Reads all rows, including emails, from a specified Google Sheet document and sheet tab using a Google Service Account for authentication.

- **Nodes Involved:**  
  - Google Sheets (Read)

- **Node Details:**  
  - Type: Google Sheets  
  - Configuration:  
    - Operation: Read rows (implicit by default).  
    - Document ID and Sheet Name are provided dynamically via URLs (secured references).  
    - Authentication: Service Account credential selected.  
  - Expressions/Variables: DocumentId and SheetName are URL-linked references.  
  - Input: Receives trigger from Manual Trigger node.  
  - Output: Passes all rows read to Split In Batches node.  
  - Edge Cases:  
    - Authentication failures if service account credentials are invalid or revoked.  
    - Empty sheet or no email column may cause downstream failures.  
    - Rate limits or API errors from Google Sheets API.

---

#### 1.3 Iterative Processing (Split In Batches)

- **Overview:**  
  Splits the full list of rows into batches of one item to process each email individually, ensuring sequential API calls for validation.

- **Nodes Involved:**  
  - Loop Over Items (Split In Batches)

- **Node Details:**  
  - Type: Split In Batches  
  - Configuration: Default batch size is 1 (implied to process one row at a time).  
  - Expressions/Variables: None explicitly configured.  
  - Input: Receives array of rows from Google Sheets Read.  
  - Output: Splits flow into individual email processing; the first main branch is empty (likely for batch start), the second main branch proceeds to HTTP Request.  
  - Edge Cases:  
    - Large datasets might slow processing due to sequential calls.  
    - If input is empty, no processing occurs.  
    - Potential errors if item structure doesn't match expected email field.

---

#### 1.4 Email Validation API Call

- **Overview:**  
  Sends a POST request to the Email Validator AI API endpoint on RapidAPI to validate each email, checking for properties like disposability.

- **Nodes Involved:**  
  - HTTP Request

- **Node Details:**  
  - Type: HTTP Request  
  - Configuration:  
    - Method: POST  
    - URL: https://email-validator-ai.p.rapidapi.com/email.php  
    - Content-Type: multipart/form-data  
    - Headers:  
      - x-rapidapi-host: email-validator-ai.p.rapidapi.com  
      - x-rapidapi-key: (user must insert their RapidAPI key)  
    - Body Parameters: Includes a single parameter named “email” with value from current batch item’s email field (`{{$json.email}}`).  
    - On Error: Continue workflow even if this node fails (important to avoid halting on single API error).  
  - Expressions/Variables: Uses `{{$json.email}}` to dynamically inject each email.  
  - Input: Receives one email item at a time from Split In Batches.  
  - Output: Sends response to Google Sheets Update Row node.  
  - Edge Cases:  
    - API key missing or invalid causes authentication errors.  
    - Network timeouts or RapidAPI service downtime.  
    - Malformed or missing email in input data.  
    - API rate limiting or quota exhaustion.  
    - Responses with unexpected formats may cause mapping errors downstream.

---

#### 1.5 Google Sheets Update

- **Overview:**  
  Updates the corresponding row in Google Sheets with validation results, specifically updating the email and its `is_disposable` status.

- **Nodes Involved:**  
  - Google Sheets (Update Row)

- **Node Details:**  
  - Type: Google Sheets  
  - Configuration:  
    - Operation: Update  
    - Document ID and Sheet Name provided via URLs (same as read node).  
    - Uses service account authentication.  
    - Columns to update:  
      - `email` mapped to `{{$json.email}}`  
      - `is_disposable` mapped to `{{$json.disposable}}` (note the API response field name aligned)  
    - Matching column for update is `email`, meaning it finds the row where the email matches to update that row only.  
    - Mapping mode: Define below with explicit columns.  
  - Expressions/Variables: Uses workflow JSON output from HTTP Request node.  
  - Input: Receives validated email data from HTTP Request node.  
  - Output: Connects back to Split In Batches node to continue processing next items.  
  - Edge Cases:  
    - If email does not exist in sheet, update may fail or create duplicates (depends on Google Sheets node behavior).  
    - Authentication or permission errors with Google Sheets.  
    - Data type mismatches if API response fields differ.  
    - Rate limits on Google Sheets API.  
    - Potential trailing spaces or case sensitivity in matching column.

---

### 3. Summary Table

| Node Name                   | Node Type            | Functional Role                      | Input Node(s)                     | Output Node(s)                   | Sticky Note                                                                                                          |
|-----------------------------|----------------------|------------------------------------|----------------------------------|---------------------------------|----------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger       | Starts workflow manually            | None                             | Google Sheets                   | 🔘 When clicking ‘Execute workflow’ - Manually starts the workflow from the n8n editor. Used during development or one-time execution. |
| Google Sheets               | Google Sheets         | Reads rows/emails from Google Sheet | When clicking ‘Execute workflow’ | Loop Over Items                 | 📄 Google Sheets (Read) - Fetches email from a specified Google Sheet. Uses a service account for authentication and reads all rows. |
| Loop Over Items             | Split In Batches      | Processes emails one at a time      | Google Sheets                   | HTTP Request, (empty branch)    | 🔁 Loop Over Items (Split In Batches) - Loops through each email one at a time. Ensures individual API processing per email. |
| HTTP Request                | HTTP Request          | Calls email validation API          | Loop Over Items                 | Google Sheets ( Update Row ), Loop Over Items (error branch) | 🌐 HTTP Request (RapidAPI) - Sends a POST request to the RapidAPI email validation endpoint.                          |
| Google Sheets ( Update Row ) | Google Sheets         | Updates validation results in Sheet | HTTP Request                   | Loop Over Items                 | 📄 Google Sheets (Update) - Updates rows in a specified Google Sheet using data from your workflow. Uses a service account for authentication to access and modify existing rows. |
| Sticky Note1                | Sticky Note           | Documentation                      | None                             | None                           | 🔘 When clicking ‘Execute workflow’ - Manually starts the workflow from the n8n editor. Used during development or one-time execution. |
| Sticky Note2                | Sticky Note           | Documentation                      | None                             | None                           | 📄 Google Sheets (Read) - Fetches email from a specified Google Sheet. Uses a service account for authentication and reads all rows. |
| Sticky Note3                | Sticky Note           | Documentation                      | None                             | None                           | 🔁 Loop Over Items (Split In Batches) - Loops through each email one at a time. Ensures individual API processing per email. |
| Sticky Note4                | Sticky Note           | Documentation                      | None                             | None                           | 🌐 HTTP Request (RapidAPI) - Sends a POST request to the RapidAPI email validation endpoint.                          |
| Sticky Note                 | Sticky Note           | Documentation                      | None                             | None                           | 📄 Google Sheets (Update) - Updates rows in a specified Google Sheet using data from your workflow. Uses a service account for authentication to access and modify existing rows. |
| Sticky Note5                | Sticky Note           | Workflow overview & use cases      | None                             | None                           | # 📊  Email Validation & Google Sheets Update ... See detailed multi-paragraph overview with use cases and node summary. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**
   - Name: When clicking ‘Execute workflow’  
   - Type: Manual Trigger  
   - No special parameters needed.

2. **Create Google Sheets Node (Read)**
   - Name: Google Sheets  
   - Type: Google Sheets (operation defaults to read)  
   - Parameters:  
     - Document ID: Provide your Google Sheet document ID or URL.  
     - Sheet Name: Provide your sheet tab name or URL.  
     - Authentication: Select or create Google Service Account credentials with appropriate permissions to read the sheet.  
   - Connect output of Manual Trigger → Google Sheets.

3. **Create Split In Batches Node**
   - Name: Loop Over Items  
   - Type: Split In Batches  
   - Parameters:  
     - Batch Size: 1 (default) to process one row at a time.  
   - Connect output of Google Sheets → Split In Batches.

4. **Create HTTP Request Node**
   - Name: HTTP Request  
   - Type: HTTP Request  
   - Parameters:  
     - HTTP Method: POST  
     - URL: https://email-validator-ai.p.rapidapi.com/email.php  
     - Content-Type: multipart/form-data  
     - Headers:  
       - x-rapidapi-host: email-validator-ai.p.rapidapi.com  
       - x-rapidapi-key: Insert your valid RapidAPI key here.  
     - Body Parameters:  
       - Name: email  
       - Value: Expression `{{$json.email}}` (extract email from current batch item)  
     - On Error: Continue (to avoid workflow halt on API errors)  
   - Connect output of Split In Batches (second main output branch) → HTTP Request.

5. **Create Google Sheets Node (Update Row)**
   - Name: Google Sheets ( Update Row )  
   - Type: Google Sheets  
   - Parameters:  
     - Operation: Update  
     - Document ID: Same as read node.  
     - Sheet Name: Same as read node.  
     - Authentication: Same Google Service Account credentials.  
     - Columns to update:  
       - email → `{{$json.email}}`  
       - is_disposable → `{{$json.disposable}}` (mapped from API response)  
     - Matching Columns: email (to locate the exact row to update)  
   - Connect output of HTTP Request → Google Sheets ( Update Row ).

6. **Connect Google Sheets ( Update Row ) Output back to Split In Batches**
   - Connect output of Google Sheets ( Update Row ) → Split In Batches input (to process next batch item).

7. **Verify and Configure Credentials**
   - Google Service Account must have sheets read/write permissions.  
   - RapidAPI key must be active and valid for the Email Validator AI API.

8. **Test Workflow**
   - Use Manual Trigger to start.  
   - Monitor each node for errors, especially API authentication and Google Sheets permissions.  
   - Ensure emails are present in the source sheet and that the update column `is_disposable` exists.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                   | Context or Link                                                                                                      |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| This workflow automates email validation by integrating Google Sheets and an external API to improve data quality in contact lists or CRM inputs. It is ideal for cleaning email lists from disposable or fake addresses.                                                                                                                                                          | Workflow purpose and use case summary.                                                                              |
| Google Sheets interactions use a Google Service Account for secure, automated access without user intervention. Ensure the Service Account has editor permissions on the target sheet.                                                                                                                                                                                         | Credential setup note.                                                                                               |
| The Email Validator AI API is accessed via RapidAPI; users must acquire their own API key. The workflow is configured to continue on API errors to avoid interruption during batch processing.                                                                                                                                                                                 | API integration and error handling note.                                                                             |
| The workflow processes emails sequentially to respect API rate limits and ensure accurate per-email validation. Bulk processing would require more complex handling.                                                                                                                                                                                                         | Performance and scalability consideration.                                                                           |
| Official documentation about n8n Google Sheets node and HTTP Request node can be found on n8n docs: https://docs.n8n.io/nodes/n8n-nodes-base.googleSheets/ and https://docs.n8n.io/nodes/n8n-nodes-base.httpRequest/                                                                                                                                                              | n8n official documentation references.                                                                               |
| For further enhancement, consider adding error handling nodes, logging, or notification triggers to alert about invalid API keys or failed updates.                                                                                                                                                                                                                         | Suggested improvements.                                                                                              |

---

**Disclaimer:** The provided text is exclusively derived from an automated n8n workflow and fully complies with current content policies. It contains no illegal, offensive, or protected material. All processed data is legal and publicly accessible.