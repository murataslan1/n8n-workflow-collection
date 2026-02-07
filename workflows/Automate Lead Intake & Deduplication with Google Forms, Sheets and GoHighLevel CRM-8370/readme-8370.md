Automate Lead Intake & Deduplication with Google Forms, Sheets and GoHighLevel CRM

https://n8nworkflows.xyz/workflows/automate-lead-intake---deduplication-with-google-forms--sheets-and-gohighlevel-crm-8370


# Automate Lead Intake & Deduplication with Google Forms, Sheets and GoHighLevel CRM

### 1. Workflow Overview

This n8n workflow automates the intake and deduplication of leads submitted via Google Forms, integrating data storage in Google Sheets and contact management in GoHighLevel CRM. It is designed for businesses or marketing teams that collect leads through forms and need to efficiently manage duplicates while maintaining an up-to-date CRM database.

The workflow is logically divided into these main blocks:

- **1.1 Input Reception:** Monitoring new lead submissions from a Google Form responses sheet.
- **1.2 Duplicate Detection:** Checking whether a submitted lead already exists in a master leads database.
- **1.3 Duplicate Decision:** Routing leads based on duplication status (new or existing).
- **1.4 CRM Contact Management:** Creating new contacts or updating existing ones in GoHighLevel.
- **1.5 Lead Logging:** Recording new leads or updating duplicate lead records in Google Sheets.
- **1.6 Data Processing:** Extracting and formatting contact information for logging and further processing.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block continuously monitors a Google Sheets document linked to a Google Form. It triggers the workflow each time a new lead submission appears, capturing all relevant form data for further processing.

**Nodes Involved:**  
- Google Sheets Trigger1

**Node Details:**

- **Google Sheets Trigger1**  
  - *Type:* Trigger Node  
  - *Role:* Monitors Google Sheets for new rows added, specifically the Google Forms response sheet.  
  - *Configuration:* Polls every minute using OAuth2 credentials for Google Sheets. Monitors a specific Google Sheets URL and sheet ID representing the form response tab.  
  - *Key Expressions:* Captures all form submission data (e.g., first name, last name, email, phone, source).  
  - *Input/Output:* No input; triggers workflow outputting new row data.  
  - *Edge Cases:* Potential OAuth token expiration, Google Sheets API rate limits, or connectivity issues.  
  - *Notes:* This is the entry point that ensures near-real-time response to new leads.

---

#### 1.2 Duplicate Detection

**Overview:**  
Checks the master leads database spreadsheet to determine if the submitted lead's email already exists, thereby detecting duplicates before CRM operations.

**Nodes Involved:**  
- Lookup Lead1

**Node Details:**

- **Lookup Lead1**  
  - *Type:* Google Sheets - Read Operation  
  - *Role:* Searches existing leads in a master spreadsheet by email.  
  - *Configuration:* Reads from a specified lead database spreadsheet and sheet using OAuth2 credentials. Looks up rows matching the incoming lead's email.  
  - *Key Expressions:* Uses incoming email from trigger data to query sheet rows.  
  - *Input:* Connected from Google Sheets Trigger1.  
  - *Output:* Returns matching lead data if found; empty if no match.  
  - *Edge Cases:* Spreadsheet access denial, incorrect sheet ID, empty or malformed email data, API throttling.  
  - *Notes:* Critical for preventing duplicate CRM entries.

---

#### 1.3 Duplicate Decision

**Overview:**  
Routes the workflow based on whether the lead is new or a duplicate using conditional logic comparing the incoming email and lookup results.

**Nodes Involved:**  
- Check from the data base?1  
- Check the duplication

**Node Details:**

- **Check from the data base?1**  
  - *Type:* If Node (Conditional Logic)  
  - *Role:* Determines if the lead email exists in the database.  
  - *Configuration:* Compares the email from the Google Sheets Trigger1 to the email found in Lookup Lead1.  
  - *Key Expressions:* `{{$json["Email address"]}}` vs `{{$('Google Sheets Trigger1').item.json['Email address']}}`  
  - *Input:* From Lookup Lead1  
  - *Output:* True branch for duplicates, False branch for new leads.  
  - *Edge Cases:* Case sensitivity mismatches, missing email fields, or lookup failure.  

- **Check the duplication**  
  - *Type:* Filter Node  
  - *Role:* Further validates the uniqueness of the email before creating new CRM contact.  
  - *Configuration:* Filters leads where emails do not match to confirm new lead status.  
  - *Input:* False branch from Check from the data base?1  
  - *Output:* Leads to creation of new contact or stopping duplication.  
  - *Edge Cases:* Misconfigured filters or unexpected empty data.

---

#### 1.4 CRM Contact Management

**Overview:**  
Handles contact creation for new leads and updates existing contacts for duplicates in GoHighLevel CRM via HTTP API requests.

**Nodes Involved:**  
- Create Contact (GHL)1  
- Update Contact (GHL)1  
- Field extraction (Code node)

**Node Details:**

- **Create Contact (GHL)1**  
  - *Type:* HTTP Request Node  
  - *Role:* Creates a new contact in GoHighLevel CRM with full lead details.  
  - *Configuration:* Sends POST request with JSON body composed from Google Sheets Trigger1 data, including first name, last name, email, phone, source, custom fields (lead score, submission date), and tags. Uses GoHighLevel API credentials.  
  - *Input:* True branch from Check the duplication filter (new leads).  
  - *Output:* Contact creation response sent forward for logging.  
  - *Edge Cases:* API authentication failure, malformed request, rate limiting, missing mandatory fields.

- **Update Contact (GHL)1**  
  - *Type:* HTTP Request Node  
  - *Role:* Updates existing contact in GoHighLevel CRM with the latest form submission data.  
  - *Configuration:* Sends GET or PATCH request (appears as GET in URL with query param email) to retrieve contact(s) by email; uses header authentication with GoHighLevel API credentials.  
  - *Input:* True branch from Check from the data base?1 (duplicate leads).  
  - *Output:* Passes response to Field extraction node.  
  - *Edge Cases:* API limit errors, invalid contact ID, network errors.

- **Field extraction**  
  - *Type:* Code Node (JavaScript)  
  - *Role:* Processes response from GoHighLevel API to extract contacts matching the target email.  
  - *Configuration:* Filters contacts array to those matching the email (case-insensitive). Returns matching contact JSONs or an error message if none found.  
  - *Input:* From Update Contact (GHL)1  
  - *Output:* List of matching contacts forwarded to Log Duplicate Lead1 node.  
  - *Edge Cases:* Missing or malformed API response, empty contacts array, no target email found.

---

#### 1.5 Lead Logging

**Overview:**  
Records incoming leads into the master lead database or updates duplicate lead records with timestamps and counters for tracking purposes.

**Nodes Involved:**  
- Log New Lead1  
- Log Duplicate Lead1

**Node Details:**

- **Log New Lead1**  
  - *Type:* Google Sheets - Append Operation  
  - *Role:* Adds new lead data along with GoHighLevel contact ID to master lead database sheet.  
  - *Configuration:* Appends a new row in the designated Google Sheets document using OAuth2 credentials.  
  - *Input:* From Create Contact (GHL)1 output.  
  - *Output:* Final workflow step for new leads.  
  - *Edge Cases:* Append failures, invalid spreadsheet ID, permission issues.

- **Log Duplicate Lead1**  
  - *Type:* Google Sheets - Update Operation  
  - *Role:* Updates existing lead record to track duplicate submissions by updating timestamps and incrementing counters.  
  - *Configuration:* Uses auto-mapping of input data to update rows in a separate "Leads duplicate" spreadsheet.  
  - *Input:* From Field extraction node.  
  - *Output:* Final workflow step for duplicates.  
  - *Edge Cases:* Update conflicts, spreadsheet access errors.

---

### 3. Summary Table

| Node Name               | Node Type               | Functional Role                | Input Node(s)             | Output Node(s)           | Sticky Note                                                                                                         |
|-------------------------|-------------------------|-------------------------------|---------------------------|--------------------------|---------------------------------------------------------------------------------------------------------------------|
| Google Sheets Trigger1   | Google Sheets Trigger   | Lead Form Monitor (Trigger)    | -                         | Lookup Lead1              | Monitors Google Forms responses sheet for new submissions every minute. Triggers when new lead data is added.        |
| Lookup Lead1            | Google Sheets           | Duplicate Detection Scanner    | Google Sheets Trigger1     | Check from the data base?1 | Searches the leads database spreadsheet to check if an email already exists. Helps identify duplicate leads.         |
| Check from the data base?1 | If                     | Duplicate Decision Router      | Lookup Lead1               | Check the duplication, Update Contact (GHL)1 | Routes based on whether the lead is new or duplicate.                                                               |
| Check the duplication    | Filter                  | New Lead Validator             | Check from the data base?1 | Create Contact (GHL)1     | Validates leads to ensure new before CRM creation.                                                                  |
| Create Contact (GHL)1    | HTTP Request            | New Contact Creator (CRM)      | Check the duplication      | Log New Lead1             | Creates new contact in GoHighLevel CRM with form submission data.                                                    |
| Log New Lead1            | Google Sheets           | New Lead Database Writer       | Create Contact (GHL)1      | -                        | Records new lead info and CRM contact ID in master lead database spreadsheet.                                        |
| Update Contact (GHL)1    | HTTP Request            | Duplicate Contact Updater      | Check from the data base?1 | Field extraction          | Updates existing contact in GoHighLevel with new submission information.                                            |
| Field extraction         | Code                    | Contact Data Processor         | Update Contact (GHL)1      | Log Duplicate Lead1       | Extracts and filters contacts from API response to prepare for duplicate logging.                                   |
| Log Duplicate Lead1      | Google Sheets           | Duplicate Activity Logger      | Field extraction           | -                        | Updates existing lead record to track duplicate submissions with timestamps and counters.                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node: Google Sheets Trigger1**  
   - Type: Google Sheets Trigger  
   - Purpose: Monitor Google Forms response sheet for new lead submissions.  
   - Config:  
     - Poll every minute  
     - Select Google Sheets OAuth2 credential  
     - Enter the Google Sheets document URL and sheet tab for form responses  
   - Output: Triggers workflow on new rows.

2. **Create Node: Lookup Lead1**  
   - Type: Google Sheets (Read)  
   - Purpose: Check if the lead email exists in master lead database.  
   - Config:  
     - Use Google Sheets OAuth2 credential  
     - Select master lead database spreadsheet and sheet  
     - Query rows to find matching email addresses equal to the incoming email from trigger  
   - Connect input from Google Sheets Trigger1.

3. **Create Node: Check from the data base?1**  
   - Type: If  
   - Purpose: Decide if lead is new or duplicate based on email presence.  
   - Config:  
     - Condition: If email from trigger != email from lookup  
   - Connect input from Lookup Lead1.

4. **Create Node: Check the duplication**  
   - Type: Filter  
   - Purpose: Validate truly new leads before CRM creation.  
   - Config:  
     - Filter condition: Email address from trigger not equal to email from lookup  
   - Connect False output from Check from the data base?1.

5. **Create Node: Create Contact (GHL)1**  
   - Type: HTTP Request  
   - Purpose: Create new contact in GoHighLevel CRM.  
   - Config:  
     - URL: https://rest.gohighlevel.com/v1/contacts/  
     - Method: POST  
     - Body type: JSON  
     - Body: Map fields from Google Sheets Trigger1 data (first name, last name, email, phone, source, custom fields, tags)  
     - Authentication: GoHighLevel API credential  
   - Connect input from Check the duplication.

6. **Create Node: Log New Lead1**  
   - Type: Google Sheets (Append)  
   - Purpose: Append new lead info and CRM contact ID to master database.  
   - Config:  
     - Use Google Sheets OAuth2 credential  
     - Select master lead database spreadsheet and sheet  
     - Append new row with lead data and GHL contact ID from Create Contact (GHL)1 response  
   - Connect input from Create Contact (GHL)1.

7. **Create Node: Update Contact (GHL)1**  
   - Type: HTTP Request  
   - Purpose: Update existing contact data in GoHighLevel for duplicates.  
   - Config:  
     - URL: https://rest.gohighlevel.com/v1/contacts?email={{ $json["Email address"] }}  
     - Method: GET or appropriate update method  
     - Authentication: Header Auth with GoHighLevel API credentials  
   - Connect True output from Check from the data base?1.

8. **Create Node: Field extraction**  
   - Type: Code (JavaScript)  
   - Purpose: Extract contact(s) matching target email from API response.  
   - Config: Use provided JavaScript code that filters contacts array by email (case-insensitive).  
   - Connect input from Update Contact (GHL)1.

9. **Create Node: Log Duplicate Lead1**  
   - Type: Google Sheets (Update)  
   - Purpose: Update duplicate lead record with timestamp and increment counter.  
   - Config:  
     - Use Google Sheets OAuth2 credential  
     - Select duplicate leads tracking spreadsheet and sheet  
     - Map input data for update operation (auto map)  
   - Connect input from Field extraction.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                    | Context or Link                                                                                         |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| The workflow is optimized for near real-time lead processing with a 1-minute polling interval on Google Sheets.                                                | Google Sheets Trigger1 node configuration                                                             |
| GoHighLevel API integration requires valid API keys and proper OAuth or header authentication setup.                                                           | Nodes: Create Contact (GHL)1, Update Contact (GHL)1                                                   |
| Duplicate detection relies on exact email matching; consider normalization for case or whitespace to improve accuracy.                                         | Duplicate Detection block                                                                              |
| Google Sheets API rate limits and Google Forms submission spikes can impact performance; monitor logs and errors.                                               | General workflow operation                                                                              |
| This workflow can be extended with error handling nodes to manage API failures or data validation errors robustly.                                             | Recommended workflow enhancement                                                                       |

---

**Disclaimer:** The text provided is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.