:rocket: Automate LinkedIn Contact Enrichment with Surfe, Google Sheets & HubSpot

https://n8nworkflows.xyz/workflows/-rocket--automate-linkedin-contact-enrichment-with-surfe--google-sheets---hubspot-5776


# :rocket: Automate LinkedIn Contact Enrichment with Surfe, Google Sheets & HubSpot

### 1. Workflow Overview

This workflow automates the enrichment of LinkedIn contacts leveraging data stored in Google Sheets, Surfe’s enrichment API, and HubSpot CRM. It is designed to:

- Detect new Google Sheets files in a specific Google Drive folder.
- Read lead data from those Sheets.
- Batch process leads through Surfe’s bulk enrichment API.
- Check enrichment status asynchronously with polling and wait nodes.
- Extract enriched contact details from Surfe’s response.
- Filter for contacts with both phone and email.
- Create or update contacts in HubSpot with enriched data.
- Notify via Gmail when the full batch enrichment process completes.

**Logical blocks:**

- **1.1 Input Reception:** Detect new Google Sheets files via Google Drive trigger and read them.
- **1.2 Batch Preparation & Enrichment Request:** Split data into batches and prepare payloads for Surfe API.
- **1.3 Surfe Enrichment Processing:** Send enrichment requests, poll for status, and validate completion.
- **1.4 Data Extraction & Filtering:** Extract enriched peoples’ information and filter for valid contacts.
- **1.5 CRM Update:** Create or update contacts in HubSpot CRM.
- **1.6 Notification:** Send email notification upon completion of batch processing.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
Detects when a new Google Sheets file is added to a specific Google Drive folder and reads the content from the first sheet.

**Nodes Involved:**  
- Google Drive Trigger  
- Google Sheets

**Node Details:**

- **Google Drive Trigger**  
  - Type: Trigger node for Google Drive file events  
  - Config: Watches a specific folder (`folderToWatch`), triggers on file creation of Google Sheets type, polling every minute.  
  - Inputs: None (trigger)  
  - Outputs: Triggers workflow with file metadata, including file ID.  
  - Edge Cases: Permissions/auth errors on Drive, delayed triggers due to polling interval, folder ID misconfiguration.

- **Google Sheets**  
  - Type: Google Sheets node  
  - Config: Reads from the first sheet (`gid=0`) of the Google Sheets document whose ID is passed dynamically from the Drive trigger.  
  - Inputs: File ID from Drive Trigger  
  - Outputs: Rows of sheet data as JSON objects  
  - Edge Cases: Sheet name or ID errors, authentication failures, empty sheets.

---

#### 1.2 Batch Preparation & Enrichment Request

**Overview:**  
Splits the data into batches of 500, prepares payloads for Surfe API enrichment requests, then sends these requests.

**Nodes Involved:**  
- Split Batch - 500  
- Prepare JSON Payload Enrichment Request  
- Surfe Bulk Enrichments API

**Node Details:**

- **Split Batch - 500**  
  - Type: SplitInBatches  
  - Config: Batch size set to 500 items to avoid API limits or large payloads.  
  - Inputs: Sheet rows  
  - Outputs: Batches of up to 500 records  
  - Edge Cases: Uneven batch sizes, no data input.

- **Prepare JSON Payload Enrichment Request**  
  - Type: Code node  
  - Config: Creates JSON payload structure for Surfe API, mapping LinkedIn URLs from input items into the people array with empty placeholders for other fields.  
  - Key Code: Maps `linkedin_url` from input JSON to `linkedinUrl` in payload.  
  - Inputs: Batch data from Split Batch  
  - Outputs: JSON payload for API  
  - Edge Cases: Missing or malformed LinkedIn URLs, empty batches.

- **Surfe Bulk Enrichments API**  
  - Type: HTTP Request  
  - Config: POST request to Surfe API endpoint `/v2/people/enrich` with JSON body; Bearer token authorization in headers.  
  - Inputs: JSON payload from previous node  
  - Outputs: Surfe API response including `enrichmentID` for status tracking  
  - Edge Cases: API rate limits, auth token invalidity, network timeouts, malformed request payloads.

---

#### 1.3 Surfe Enrichment Processing

**Overview:**  
Polls Surfe API to check enrichment status asynchronously. If enrichment is complete, proceeds; if not, waits and retries.

**Nodes Involved:**  
- Surfe check enrichement status  
- Is enrichment complete ?  
- Wait 30 secondes

**Node Details:**

- **Surfe check enrichement status**  
  - Type: HTTP Request  
  - Config: GET request to Surfe API to check enrichment status using the `enrichmentID` from prior response. Includes JSON body with static enrichment details and authorization header.  
  - Inputs: Output from Surfe Bulk API node containing `enrichmentID`  
  - Outputs: Status response JSON  
  - Edge Cases: API errors, invalid enrichmentID, network issues.

- **Is enrichment complete ?**  
  - Type: If node  
  - Config: Checks if the `status` field in JSON equals `"COMPLETED"` to determine next step.  
  - Inputs: Status response JSON  
  - Outputs: True branch if completed, False branch otherwise  
  - Edge Cases: Unexpected status values, missing `status` field.

- **Wait 30 secondes**  
  - Type: Wait node  
  - Config: Delays next execution by 30 seconds before retrying status check.  
  - Inputs: False branch from If node  
  - Outputs: Triggers Surfe check status again  
  - Edge Cases: Workflow execution time limits, large queue buildup if many batches.

---

#### 1.4 Data Extraction & Filtering

**Overview:**  
Extracts detailed enriched people data from Surfe response, then filters only those contacts who have both phone and email.

**Nodes Involved:**  
- Extract list of peoples from Surfe API response  
- Filter: phone AND email

**Node Details:**

- **Extract list of peoples from Surfe API response**  
  - Type: Code node  
  - Config: Parses the `people` array from Surfe API JSON response and maps relevant fields (id, firstName, lastName, email, phone, jobTitle, companyName, linkedinUrl, country, status) into separate JSON objects per person.  
  - Inputs: Surfe completed enrichment JSON  
  - Outputs: Array of enriched contacts  
  - Edge Cases: Missing `people` array, empty arrays, missing fields.

- **Filter: phone AND email**  
  - Type: Filter node  
  - Config: Allows only contacts where both `phone` and `email` fields are not empty strings.  
  - Inputs: Contacts from extraction node  
  - Outputs: Filtered contacts with full contact info  
  - Edge Cases: Null or undefined values vs empty strings, inconsistent field names.

---

#### 1.5 CRM Update

**Overview:**  
Creates or updates contacts in HubSpot CRM using enriched data for valid contacts.

**Nodes Involved:**  
- HubSpot: Create or Update

**Node Details:**

- **HubSpot: Create or Update**  
  - Type: HubSpot node  
  - Config: Uses email as unique key; updates or creates contact with fields including country, jobTitle, lastName, firstName, websiteUrl (LinkedIn), companyName, phoneNumber, mobilePhoneNumber. Uses appToken authentication.  
  - Inputs: Filtered contacts with phone and email  
  - Outputs: Contacts updated/created in HubSpot  
  - Edge Cases: API auth failure, duplicate emails, field validation errors in HubSpot.

---

#### 1.6 Notification

**Overview:**  
Sends an email notification to a specified address once all batches have been processed.

**Nodes Involved:**  
- Gmail

**Node Details:**

- **Gmail**  
  - Type: Gmail node  
  - Config: Sends a simple email with subject and message indicating batch enrichment completion. Recipient email address is configured statically.  
  - Inputs: Completion signal from Split Batch node’s first output (after all batches)  
  - Outputs: Email sent confirmation  
  - Edge Cases: Gmail auth errors, quota limits, incorrect recipient address.

---

### 3. Summary Table

| Node Name                        | Node Type             | Functional Role                  | Input Node(s)                  | Output Node(s)                    | Sticky Note                                         |
|---------------------------------|-----------------------|--------------------------------|-------------------------------|---------------------------------|----------------------------------------------------|
| Google Drive Trigger             | Google Drive Trigger  | Detect new Google Sheets files | None (trigger)                 | Google Sheets                   |                                                    |
| Google Sheets                   | Google Sheets         | Read data from Google Sheets   | Google Drive Trigger           | Split Batch - 500               |                                                    |
| Split Batch - 500               | SplitInBatches        | Batch lead data into 500 items | Google Sheets, HubSpot: Create | Gmail, Prepare JSON Payload Enrichment Request |                                                    |
| Prepare JSON Payload Enrichment Request | Code               | Prepare Surfe API payload      | Split Batch - 500              | Surfe Bulk Enrichments API      |                                                    |
| Surfe Bulk Enrichments API      | HTTP Request          | Send enrichment request to Surfe | Prepare JSON Payload Enrichment Request | Surfe check enrichement status |                                                    |
| Surfe check enrichement status  | HTTP Request          | Poll Surfe enrichment status   | Surfe Bulk Enrichments API     | Is enrichment complete ?        |                                                    |
| Is enrichment complete ?         | If                    | Check if enrichment is complete | Surfe check enrichement status | Extract list of peoples from Surfe API response, Wait 30 secondes |                                                    |
| Wait 30 secondes                | Wait                  | Delay retry for enrichment status | Is enrichment complete ? (False branch) | Surfe check enrichement status |                                                    |
| Extract list of peoples from Surfe API response | Code                 | Extract enriched people data   | Is enrichment complete ? (True branch) | Filter: phone AND email         |                                                    |
| Filter: phone AND email         | Filter                | Filter contacts with phone & email | Extract list of peoples from Surfe API response | HubSpot: Create or Update       |                                                    |
| HubSpot: Create or Update       | HubSpot               | Create or update contacts in HubSpot | Filter: phone AND email       | Split Batch - 500               |                                                    |
| Gmail                          | Gmail                 | Notify end of all batches      | Split Batch - 500 (first output) | None                          | Notify end of all batches                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node: Google Drive Trigger**  
   - Type: Google Drive Trigger  
   - Configure to watch a specific folder by folder ID (e.g., `1C4ccbMW84VWzgGMsNTVEUUm3i_MH3Rlm`)  
   - Set event to `fileCreated` for Google Sheets files  
   - Poll every minute

2. **Add Google Sheets Node**  
   - Connect from Google Drive Trigger  
   - Set `Document ID` to the file ID from the trigger (`={{ $json.id }}`)  
   - Set the sheet name to first sheet (`gid=0` or "Sheet1")  
   - Read all rows

3. **Add SplitInBatches Node**  
   - Name: Split Batch - 500  
   - Connect from Google Sheets  
   - Set batch size to 500

4. **Add Code Node: Prepare JSON Payload Enrichment Request**  
   - Connect from Split Batch - 500 (second output)  
   - Code: Map batch items to Surfe API JSON structure, including only linkedinUrl from each item’s `linkedin_url` property  
   - Use empty placeholders for other fields as per example  

5. **Add HTTP Request Node: Surfe Bulk Enrichments API**  
   - Connect from Prepare JSON Payload Enrichment Request  
   - Method: POST  
   - URL: `https://api.surfe.com/v2/people/enrich`  
   - Body: JSON, use expression from previous node output  
   - Headers: Authorization: Bearer `<YOUR_SURFE_API_TOKEN>`  
   - Set to send body and headers correctly

6. **Add HTTP Request Node: Surfe check enrichement status**  
   - Connect from Surfe Bulk Enrichments API  
   - Method: GET (or POST as per original, but URL with `{{ $json.enrichmentID }}`)  
   - URL: `https://api.surfe.com/v2/people/enrich/{{ $json.enrichmentID }}`  
   - Body: JSON with enrichmentType, listName, and people array as per original  
   - Headers: Authorization: Bearer `<YOUR_SURFE_API_TOKEN>`

7. **Add If Node: Is enrichment complete ?**  
   - Connect from Surfe check enrichement status  
   - Condition: Check if `$json.status == "COMPLETED"`

8. **Add Wait Node: Wait 30 secondes**  
   - Connect from If node False branch  
   - Set delay to 30 seconds  
   - Connect back to Surfe check enrichment status (loop for retry)

9. **Add Code Node: Extract list of peoples from Surfe API response**  
   - Connect from If node True branch  
   - Code: Extract array `people` from JSON, map fields `id`, `firstName`, `lastName`, `email`, `phone`, `jobTitle`, `companyName`, `companyWebsite`, `linkedinUrl`, `country`, `status` into separate JSON items

10. **Add Filter Node: Filter: phone AND email**  
    - Connect from extraction node  
    - Filter where both `phone` and `email` are not empty (strict string not empty)

11. **Add HubSpot Node: HubSpot: Create or Update**  
    - Connect from Filter node  
    - Authentication: App Token (configure credentials)  
    - Set email as unique identifier  
    - Map additional fields: country, jobTitle, lastName, firstName, websiteUrl (LinkedIn), companyName, phoneNumber, mobilePhoneNumber from JSON data

12. **Connect HubSpot output back to Split Batch - 500**  
    - This creates a loop to continue processing remaining batches

13. **Add Gmail Node**  
    - Connect from Split Batch - 500 first output (completion signal)  
    - Configure Gmail credentials (OAuth2)  
    - Set recipient email, subject, and message to notify batch enrichment completion

---

### 5. General Notes & Resources

| Note Content                                                                                             | Context or Link                                                                                  |
|---------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow requires valid API credentials for Surfe API and HubSpot App Token authentication.         | Credential setup in n8n for HTTP Request and HubSpot nodes                                      |
| Google Drive folder ID is critical for triggering; ensure the folder is shared with the n8n service.     | Folder ID example: `1C4ccbMW84VWzgGMsNTVEUUm3i_MH3Rlm`                                         |
| Gmail node requires OAuth2 credentials setup for sending notifications.                                  | Gmail OAuth2 credential configuration in n8n                                                    |
| Surfe API documentation: https://docs.surfe.com/api/v2/reference#bulk-enrichment                        | Reference for payload and status checking                                                     |
| HubSpot API docs for contact creation/update: https://developers.hubspot.com/docs/api/crm/contacts      | Use to customize fields mapping and troubleshoot errors                                        |
| Polling with delay node (Wait 30 seconds) helps avoid hitting rate limits and overloading Surfe API.    | Adjust wait time based on API SLA and quota limits                                            |

---

**Disclaimer:** The provided text is extracted exclusively from an automated workflow built with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All handled data are legal and public.