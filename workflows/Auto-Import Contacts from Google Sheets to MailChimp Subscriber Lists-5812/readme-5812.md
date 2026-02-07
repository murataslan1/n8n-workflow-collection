Auto-Import Contacts from Google Sheets to MailChimp Subscriber Lists

https://n8nworkflows.xyz/workflows/auto-import-contacts-from-google-sheets-to-mailchimp-subscriber-lists-5812


# Auto-Import Contacts from Google Sheets to MailChimp Subscriber Lists

### 1. Workflow Overview

This workflow automates the process of importing contacts from a Google Sheets spreadsheet into a MailChimp subscriber list. It is designed for email marketers and small businesses who maintain contacts in spreadsheets and want to synchronize them automatically with MailChimp for email campaigns.

The workflow is structured into the following logical blocks:

- **1.1 Trigger and Data Retrieval**: Manual trigger initiates the workflow and fetches all rows from a specified Google Sheet.
- **1.2 Data Preparation**: Cleans and standardizes the retrieved data fields, ensuring consistent naming and extracting necessary columns.
- **1.3 Subscriber Data Formatting**: Parses full names into first and last names, formats subscriber objects with merge fields for MailChimp.
- **1.4 MailChimp Import**: Adds each formatted subscriber to the specified MailChimp list, with error handling to continue processing if some contacts fail.
- **1.5 Import Summary Generation**: Creates a summary report of the import process with timestamp, total processed count, and individual contact statuses.

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger and Data Retrieval

- **Overview:**  
  This block starts the workflow manually and retrieves all contact data rows from the specified Google Sheet.

- **Nodes Involved:**  
  - When clicking 'Execute workflow' (Manual Trigger)  
  - Get Google Sheet Data (Google Sheets node)

- **Node Details:**

  **When clicking 'Execute workflow'**  
  - *Type & Role:* Manual trigger node; initiates the workflow on demand.  
  - *Configuration:* No parameters; simply triggers on manual execution.  
  - *Inputs:* None  
  - *Outputs:* Triggers next node  
  - *Failure Types:* None expected; manual action required to start workflow.

  **Get Google Sheet Data**  
  - *Type & Role:* Google Sheets node; fetches rows from a specified sheet.  
  - *Configuration:*  
    - Document ID: User must enter their Google Sheet ID.  
    - Sheet Name: User must specify the exact worksheet/tab name.  
    - Reads all rows by default.  
  - *Inputs:* Trigger from manual node  
  - *Outputs:* Array of rows with columns such as "Names", "Email address", "Phone Number".  
  - *Failure Types:*  
    - Authentication errors if Google Sheets API credentials are invalid or expired.  
    - Sheet not found or wrong document ID/sheet name.  
    - Empty or malformed sheets.  
  - *Version Specific:* Requires Google Sheets API credentials configured in n8n.

---

#### 2.2 Data Preparation

- **Overview:**  
  Standardizes and extracts key fields from each row to ensure consistent naming for downstream processing.

- **Nodes Involved:**  
  - Edit Fields (Set node)

- **Node Details:**

  **Edit Fields**  
  - *Type & Role:* Set node; assigns and normalizes field names for each contact.  
  - *Configuration:*  
    - Creates/overwrites the fields "Names", "Email address", and "Phone Number" by directly copying from the incoming JSON data.  
    - Ensures consistent field names for next steps.  
  - *Key Expressions:*  
    - `={{ $json.Names }}`  
    - `={{ $json['Email address'] }}`  
    - `={{ $json['Phone Number'] }}`  
  - *Inputs:* From Google Sheets data node  
  - *Outputs:* Items with normalized fields  
  - *Failure Types:* Expression errors if input JSON fields are missing or null.  
  - *Notes:* No transformation, just field reassignment.

---

#### 2.3 Subscriber Data Formatting

- **Overview:**  
  Parses the full name into first and last names, prepares the subscriber data structure expected by MailChimp API, including merge fields.

- **Nodes Involved:**  
  - Format Subscriber Data (Code node)

- **Node Details:**

  **Format Subscriber Data**  
  - *Type & Role:* Code node (JavaScript); transforms each contact into a MailChimp subscriber object.  
  - *Configuration:*  
    - Iterates over each incoming item.  
    - Splits "Names" field on the first space: first word as first name (FNAME), remainder as last name (LNAME).  
    - Includes "Phone Number" as "PHONE" merge field.  
    - Sets subscription status to "subscribed".  
  - *Key Code Snippet:*  
    ```js
    email_address: item.json["Email address"],
    status: "subscribed",
    merge_fields: {
      FNAME: item.json.Names.split(' ')[0] || '',
      LNAME: item.json.Names.split(' ').slice(1).join(' ') || '',
      PHONE: item.json["Phone Number"] || ''
    }
    ```  
  - *Inputs:* Items with normalized fields from Edit Fields node  
  - *Outputs:* Array of subscriber objects formatted for MailChimp  
  - *Failure Types:*  
    - Errors if "Names" or "Email address" fields are missing or incorrectly formatted.  
    - Empty or undefined fields gracefully handled (empty strings assigned).  
  - *Notes:* This node is critical for data shaping before the MailChimp API call.

---

#### 2.4 MailChimp Import

- **Overview:**  
  Adds subscribers one by one to the specified MailChimp list, sending merge fields for personalization. Continues processing despite individual errors.

- **Nodes Involved:**  
  - Add to MailChimp (MailChimp node)

- **Node Details:**

  **Add to MailChimp**  
  - *Type & Role:* MailChimp node; creates or updates subscribers in a MailChimp list.  
  - *Configuration:*  
    - List ID: User must replace placeholder "YOUR_MAILCHIMP_LIST_ID" with their actual list ID.  
    - Email: Set dynamically from `Format Subscriber Data` output.  
    - Status: "subscribed" (adds or updates subscriber as active).  
    - Merge Fields: FNAME, LNAME, PHONE mapped from subscriber object.  
  - *Key Expressions:*  
    - Email: `={{ $node['Format Subscriber Data'].json.email_address }}`  
    - Merge fields: mapped from current item’s JSON merge_fields properties.  
  - *Inputs:* From Format Subscriber Data node  
  - *Outputs:* Response from MailChimp API per subscriber  
  - *On Error:* Set to "continueRegularOutput" - continues processing even if some subscribers fail (e.g., duplicate email, invalid email).  
  - *Failure Types:*  
    - API authentication errors if MailChimp credentials are invalid.  
    - Invalid list ID errors.  
    - Duplicate or badly formatted email addresses.  
    - API rate limits or network timeouts.  
  - *Notes:* Must configure MailChimp OAuth2 or API key credentials in n8n.

---

#### 2.5 Import Summary Generation

- **Overview:**  
  Generates a textual summary report of the import session, including total processed contacts, timestamps, and status per contact.

- **Nodes Involved:**  
  - Create Import Summary (Set node)

- **Node Details:**

  **Create Import Summary**  
  - *Type & Role:* Set node; creates a markdown text summary for review or logging.  
  - *Configuration:*  
    - Uses expressions to insert current timestamp.  
    - Counts total items processed via `{{ $items().length }}`.  
    - Includes email and status from each processed contact.  
    - Adds a note about source (Google Sheets).  
  - *Key Expressions:*  
    ```markdown
    📊 **MailChimp Import Summary**

    **Import Date:** {{ DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss') }}
    **Total Processed:** {{ $items().length }} contacts

    **Email:** {{ $json.email_address }}
    **Status:** {{ $json.status || 'Processed' }}

    **Source:** Google Sheets Import
    ```  
  - *Inputs:* From Add to MailChimp node  
  - *Outputs:* Summary string per item (can be aggregated or logged externally)  
  - *Failure Types:* Expression errors if input data incomplete.  
  - *Notes:* Useful for monitoring or sending notification emails with import results.

---

### 3. Summary Table

| Node Name                 | Node Type             | Functional Role                           | Input Node(s)             | Output Node(s)           | Sticky Note                                                                                                                                        |
|---------------------------|-----------------------|-----------------------------------------|---------------------------|--------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| Workflow Documentation     | Sticky Note           | Provides detailed workflow overview     | None                      | None                     | # Google Sheets to MailChimp Sync Workflow<br>Features, setup requirements, process flow, and expected sheet format documented here.             |
| When clicking 'Execute workflow' | Manual Trigger       | Starts workflow manually                 | None                      | Get Google Sheet Data     |                                                                                                                                                    |
| Get Google Sheet Data      | Google Sheets         | Retrieves all rows from specified sheet | When clicking 'Execute workflow' | Edit Fields              |                                                                                                                                                    |
| Edit Fields               | Set                   | Normalizes and extracts key fields      | Get Google Sheet Data      | Format Subscriber Data    |                                                                                                                                                    |
| Format Subscriber Data    | Code                  | Parses names, formats subscriber object | Edit Fields               | Add to MailChimp          |                                                                                                                                                    |
| Add to MailChimp          | MailChimp              | Adds subscribers to MailChimp list      | Format Subscriber Data     | Create Import Summary     | Continues processing on errors, handles merge fields (FNAME, LNAME, PHONE). Must configure MailChimp list ID and credentials properly.            |
| Create Import Summary     | Set                   | Generates import summary report          | Add to MailChimp           | None                     |                                                                                                                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger Node**  
   - Add a "Manual Trigger" node named `When clicking 'Execute workflow'`.  
   - No special configuration needed.

2. **Add Google Sheets Node**  
   - Add a "Google Sheets" node named `Get Google Sheet Data`.  
   - Connect output of Manual Trigger to this node’s input.  
   - Configure credentials for Google Sheets API in n8n.  
   - Set:  
     - Document ID: Your Google Sheet ID.  
     - Sheet Name: Exact worksheet/tab name containing contacts.  
     - Operation: Read rows (default).

3. **Add a Set Node for Field Normalization**  
   - Add a "Set" node named `Edit Fields`.  
   - Connect `Get Google Sheet Data` output to this node.  
   - In Set node, add assignments:  
     - `Names` = `={{ $json.Names }}`  
     - `Email address` = `={{ $json['Email address'] }}`  
     - `Phone Number` = `={{ $json['Phone Number'] }}`  
   - This ensures consistent field names regardless of input formatting.

4. **Add a Code Node for Subscriber Formatting**  
   - Add a "Code" node named `Format Subscriber Data`.  
   - Connect `Edit Fields` output to this node.  
   - Paste the following JavaScript code:
     ```js
     const subscribers = [];

     for (const item of $input.all()) {
       subscribers.push({
         json: {
           email_address: item.json["Email address"],
           status: "subscribed",
           merge_fields: {
             FNAME: item.json.Names.split(' ')[0] || '',
             LNAME: item.json.Names.split(' ').slice(1).join(' ') || '',
             PHONE: item.json["Phone Number"] || ''
           }
         }
       });
     }

     return subscribers;
     ```
   - This formats data as required by MailChimp API.

5. **Add MailChimp Node to Add Subscribers**  
   - Add a "MailChimp" node named `Add to MailChimp`.  
   - Connect output of `Format Subscriber Data` to this node.  
   - Configure MailChimp credentials (OAuth2 or API key).  
   - Set:  
     - List ID: Replace `"YOUR_MAILCHIMP_LIST_ID"` with your actual list ID.  
     - Email: `={{ $node['Format Subscriber Data'].json.email_address }}`  
     - Status: `subscribed`  
     - Merge Fields: Map:  
       - FNAME = `={{ $json.merge_fields.FNAME }}`  
       - LNAME = `={{ $json.merge_fields.LNAME }}`  
       - PHONE = `={{ $json.merge_fields.PHONE }}`  
   - Set On Error to "Continue" to skip errors per subscriber.

6. **Add a Set Node for Import Summary**  
   - Add a "Set" node named `Create Import Summary`.  
   - Connect output of `Add to MailChimp` to this node.  
   - Add one assignment:  
     - Name: `importSummary`  
     - Type: String  
     - Value:
       ```
       📊 **MailChimp Import Summary**

       **Import Date:** {{ DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss') }}
       **Total Processed:** {{ $items().length }} contacts

       **Email:** {{ $json.email_address }}
       **Status:** {{ $json.status || 'Processed' }}

       **Source:** Google Sheets Import
       ```
   - This generates a markdown report summarizing the import.

7. **Optional:** Add a Sticky Note node to document the workflow as shown.

---

### 5. General Notes & Resources

| Note Content                                                                                                                  | Context or Link                                                                                      |
|-------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Workflow requires valid Google Sheets API and MailChimp API credentials configured in n8n credentials manager.                | Credential setup for Google Sheets and MailChimp nodes                                             |
| Expected Google Sheet format: columns named exactly "Names", "Email address", and optionally "Phone Number".                   | Input data format requirement                                                                       |
| MailChimp list ID must be updated by the user to target the correct subscriber list.                                           | MailChimp integration setup                                                                         |
| The workflow continues processing subscribers even if some fail to add (e.g., duplicate emails, invalid data).                | Error handling design                                                                               |
| For advanced usage, the summary output can be extended to send emails or notifications post-import.                           | Potential workflow enhancement                                                                      |
| More info on MailChimp API merge fields: https://mailchimp.com/developer/marketing/api/list-members/add-member-to-list/       | Official MailChimp API documentation                                                                |

---

**Disclaimer:** The provided text is generated exclusively from an automated n8n workflow designed for lawful and public data operations. It complies with current content policies and contains no illegal, offensive, or protected material.