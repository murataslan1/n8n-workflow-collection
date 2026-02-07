Automate Marketing Leads Import from Google Sheets to Airtable CRM

https://n8nworkflows.xyz/workflows/automate-marketing-leads-import-from-google-sheets-to-airtable-crm-11046


# Automate Marketing Leads Import from Google Sheets to Airtable CRM

### 1. Workflow Overview

This workflow automates the import of marketing leads from a Google Sheets spreadsheet into an Airtable CRM database. It is designed to handle lead data efficiently by checking if the company already exists in the CRM and then either creating new company records, updating existing ones, or logging data quality issues related to duplicates. The workflow also tracks and reports the number of records processed, created, or updated.

The workflow is logically divided into three main blocks:

- **1.1 Initialization:** Setup of counters and preparation for the import process using an internal Data Table.
- **1.2 Lead Data Import Loop:** Iterative processing of each lead from Google Sheets, determining the existence of the company in Airtable, and handling creation, update, or logging accordingly.
- **1.3 Import Reporting:** Finalization by aggregating counters and sending a summary report via email.

---

### 2. Block-by-Block Analysis

#### 1.1 Initialization

**Overview:**  
This block initializes the workflow run by inserting a new record into an internal Data Table to track counts of records read, created, and updated. It then fetches this initialization row for subsequent updates during processing.

**Nodes Involved:**  
- When clicking ‘Execute workflow’ (Manual Trigger)  
- Insert row (Data Table)  
- Get row(s) (Data Table)  
- Update row(s) (Data Table)  
- Sticky Note (Overview instructions)  
- Sticky Note6 (Initialization heading)

**Node Details:**

- **When clicking ‘Execute workflow’**  
  - Node Type: Manual Trigger  
  - Role: Entry point to start the workflow manually  
  - Configuration: Default manual trigger without parameters  
  - Inputs: None  
  - Outputs: Output to “Insert row” node  
  - Edge cases: None (manual trigger)  

- **Insert row**  
  - Node Type: Data Table (Insert operation)  
  - Role: Creates an initial record in the internal Data Table named "EML_Import" to hold counters (executionId, recordsRead, recorsCreated, recordsUpdated) all starting at zero or execution ID  
  - Configuration: Sets `executionId` to current execution ID, counters to zero  
  - Inputs: From manual trigger  
  - Outputs: To “Get row(s) Leads” node  
  - Edge cases: Data Table access errors, ID mismatches  

- **Get row(s)**  
  - Node Type: Data Table (Get operation)  
  - Role: Retrieves the row just inserted to read and update counters later  
  - Configuration: Filters on the inserted row's ID  
  - Inputs: From “Insert row”  
  - Outputs: To “Update row(s)”  
  - Edge cases: Missing or deleted row, filter failure  

- **Update row(s)**  
  - Node Type: Data Table (Update operation)  
  - Role: Updates the counters in the Data Table as the workflow progresses  
  - Configuration: Increment `recordsRead` by 1; linked to “Insert row” ID  
  - Inputs: From “Get row(s)”  
  - Outputs: To “Search Company” node in import loop  
  - Edge cases: Concurrency issues if multiple runs, update conflicts  

- **Sticky Note (Overview instructions)**  
  - Node Type: Sticky Note  
  - Role: Provides detailed explanation of workflow logic, setup instructions, and usage notes  

- **Sticky Note6 (Initialization heading)**  
  - Node Type: Sticky Note  
  - Role: Marks the initialization section visually in the workflow canvas  

---

#### 1.2 Lead Data Import Loop

**Overview:**  
This block handles the core logic of iterating over each lead from Google Sheets, searching for the corresponding company in Airtable, and deciding whether to create a new company record, update an existing one, or log data quality issues if duplicates are found.

**Nodes Involved:**  
- Get row(s) Leads (Google Sheets)  
- Loop Over Items (Split In Batches)  
- Limit  
- Get row(s)1 (Data Table)  
- Search Company (Airtable Search)  
- Code (JavaScript conditional logic)  
- Switch (Routing based on search result)  
- Create Company (Airtable Create)  
- Update Company (Airtable Update)  
- Create row(s) Logs (Google Sheets Append)  
- Update row(s) - Creation (Data Table Update)  
- Update row(s) - Update (Data Table Update)  
- Wait1 (Wait node for pacing)  
- Sticky Note1 (Explanation of search result types)  
- Sticky Note2 (Creation process)  
- Sticky Note3 (Update process)  
- Sticky Note4 (Data quality logging)  
- Sticky Note5 (Import loop heading)

**Node Details:**

- **Get row(s) Leads**  
  - Node Type: Google Sheets (Get Rows)  
  - Role: Fetches leads from Google Sheets where “Valid Email” equals "OK"  
  - Configuration: Filters on column “Valid Email” with value “OK”  
  - Inputs: From “Insert row” (initialization)  
  - Outputs: To “Loop Over Items” for batch processing  
  - Edge cases: Google Sheets API limits, auth errors, no data returned  

- **Loop Over Items**  
  - Node Type: SplitInBatches  
  - Role: Processes leads in batches (default batch size) to avoid overload and manage flow  
  - Inputs: From “Get row(s) Leads”  
  - Outputs: Two connections: to “Limit” and “Get row(s)”  
  - Edge cases: Batch size too large causing timeouts  

- **Limit**  
  - Node Type: Limit  
  - Role: Keeps only the last item in the batch (likely for synchronization or control)  
  - Inputs: From “Loop Over Items”  
  - Outputs: To “Get row(s)1”  
  - Edge cases: Misconfigured limit could skip items  

- **Get row(s)1**  
  - Node Type: Data Table (Get operation)  
  - Role: Fetches current counters row from Data Table for reporting  
  - Inputs: From “Limit”  
  - Outputs: To “Send a message” (reporting)  
  - Edge cases: Missing row issues  

- **Search Company**  
  - Node Type: Airtable (Search operation)  
  - Role: Searches the Airtable CRM “COMPANY” table for a company matching both Company name and Email from the current lead  
  - Configuration: Uses Airtable filter formula with AND condition on Company and Email fields dynamically from current item  
  - Inputs: From “Update row(s)” (which increments read count)  
  - Outputs: To “Code” node for result interpretation  
  - Edge cases: Airtable API errors, rate limiting, filter formula syntax errors  

- **Code**  
  - Node Type: Code (JavaScript)  
  - Role: Interprets search results into three categories: none, one, multiple  
  - Logic:  
    - No results or empty ID → "none"  
    - Exactly one result with ID → "one"  
    - More than one result → "multiple"  
  - Inputs: From “Search Company”  
  - Outputs: To “Switch” node  
  - Edge cases: Unexpected data structure, empty arrays, script errors  

- **Switch**  
  - Node Type: Switch  
  - Role: Routes flow depending on `resultType` from Code node: none → create, one → update, multiple → log issue  
  - Inputs: From “Code”  
  - Outputs: To “Create Company”, “Update Company”, or “Create row(s) Logs” nodes respectively  
  - Edge cases: Unknown `resultType` values, missing outputs  

- **Create Company**  
  - Node Type: Airtable (Create operation)  
  - Role: Creates a new company record in Airtable CRM with all fields copied from the current lead item  
  - Configuration: Maps fields such as City, Email, Company, Address, Activity, Phone Number, Valid Email status, Business Leader, URL Site, ZIP Code  
  - Inputs: From “Switch” when `resultType` is none  
  - Outputs: To “Update row(s) - Creation” node  
  - Edge cases: Airtable creation errors, missing mandatory fields, type casting issues  

- **Update Company**  
  - Node Type: Airtable (Update operation)  
  - Role: Updates the existing company record in Airtable CRM with current lead data  
  - Configuration: Similar field mapping as Create Company, but includes matching on Company and Email for record update  
  - Inputs: From “Switch” when `resultType` is one  
  - Outputs: To “Update row(s) - Update” node  
  - Edge cases: Update conflicts, Airtable errors, missing record ID  

- **Create row(s) Logs**  
  - Node Type: Google Sheets (Append Row)  
  - Role: Logs data quality issues by appending a row to a “Logs” sheet in the same Google Sheets document, noting duplicates for investigation  
  - Configuration: Adds Company, Email, and a remark message about duplicates  
  - Inputs: From “Switch” when `resultType` is multiple  
  - Outputs: To “Wait1” node  
  - Edge cases: Google Sheets append errors, data mismatch  

- **Update row(s) - Creation**  
  - Node Type: Data Table (Update operation)  
  - Role: Increments the `recorsCreated` counter by 1 in the internal Data Table  
  - Inputs: From “Create Company”  
  - Outputs: To “Wait1” node  
  - Edge cases: Update concurrency  

- **Update row(s) - Update**  
  - Node Type: Data Table (Update operation)  
  - Role: Increments the `recordsUpdated` counter by 1 in the internal Data Table  
  - Inputs: From “Update Company”  
  - Outputs: To “Wait1” node  
  - Edge cases: Update concurrency  

- **Wait1**  
  - Node Type: Wait  
  - Role: Pauses the workflow for 1 second between iterations to avoid API rate limits or overload  
  - Inputs: From logging or update nodes  
  - Outputs: To “Loop Over Items” (iterative continuation)  
  - Edge cases: Unnecessary delay if fast processing desired  

- **Sticky Notes (1,2,3,4,5)**  
  - Provide visual and contextual explanations for:  
    - Result types and their meaning  
    - Creation and update processes  
    - Logging data quality issues  
    - Import loop section heading  

---

#### 1.3 Import Reporting

**Overview:**  
After processing all leads, this block generates and sends an import report email summarizing the counts of records read, created, and updated during this workflow run.

**Nodes Involved:**  
- Get row(s)1 (Data Table)  
- Send a message (Gmail)  
- Sticky Note8 (Report heading)

**Node Details:**

- **Get row(s)1**  
  - Node Type: Data Table (Get operation)  
  - Role: Retrieves the counters record from the Data Table to collect final statistics for reporting  
  - Inputs: From “Limit” node which filters data for the last processed item  
  - Outputs: To “Send a message” node  
  - Edge cases: Missing or stale data  

- **Send a message**  
  - Node Type: Gmail (Send Email)  
  - Role: Sends a plain text email report to a specified address with counts of records read, created, and updated  
  - Configuration:  
    - Recipient: `email-address@gmail.com` (example placeholder)  
    - Subject: "REPORT EML IMPORT DE LEADS"  
    - Message body: includes dynamic values from counters (recordsRead, recorsCreated, recordsUpdated)  
  - Inputs: From “Get row(s)1”  
  - Outputs: Workflow ends here  
  - Credential: OAuth2 Gmail credential configured for sending email  
  - Edge cases: Email sending failure, auth errors, incorrect recipient  

- **Sticky Note8**  
  - Marks the reporting section visually in the workflow canvas  

---

### 3. Summary Table

| Node Name              | Node Type            | Functional Role                                     | Input Node(s)                    | Output Node(s)                        | Sticky Note                                                    |
|------------------------|----------------------|----------------------------------------------------|---------------------------------|-------------------------------------|---------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger       | Entry point to start the workflow manually          | None                            | Insert row                          |                                                               |
| Insert row             | Data Table (Insert)   | Initialize counters record in internal Data Table   | When clicking ‘Execute workflow’ | Get row(s) Leads                   |                                                               |
| Get row(s) Leads       | Google Sheets         | Retrieve leads with valid emails for processing     | Insert row                      | Loop Over Items                    |                                                               |
| Loop Over Items        | SplitInBatches        | Process leads in batches                             | Get row(s) Leads                | Limit, Get row(s)                  |                                                               |
| Limit                  | Limit                 | Keep last item in batch (for synchronization)       | Loop Over Items                 | Get row(s)1                       |                                                               |
| Get row(s)1            | Data Table (Get)      | Fetch counters row for reporting                     | Limit                          | Send a message                    |                                                               |
| Send a message         | Gmail                 | Send email report with import stats                  | Get row(s)1                    | None                             |                                                               |
| Get row(s)             | Data Table (Get)      | Retrieve counters row for updating                    | Insert row                     | Update row(s)                    |                                                               |
| Update row(s)          | Data Table (Update)   | Increment recordsRead counter                         | Get row(s)                     | Search Company                   |                                                               |
| Search Company         | Airtable (Search)     | Search for company in CRM by Company and Email       | Update row(s)                  | Code                            |                                                               |
| Code                   | Code (JavaScript)     | Determine search result type                          | Search Company                 | Switch                         |                                                               |
| Switch                 | Switch                | Route flow based on search result type               | Code                          | Create Company, Update Company, Create row(s) Logs |                                                               |
| Create Company         | Airtable (Create)     | Create new company record                             | Switch                        | Update row(s) - Creation        | Sticky Note2: "Creation of a new company"                      |
| Update Company         | Airtable (Update)     | Update existing company record                        | Switch                        | Update row(s) - Update          | Sticky Note3: "Update of existing company"                     |
| Create row(s) Logs     | Google Sheets (Append)| Log duplicate company data quality issues            | Switch                        | Wait1                          | Sticky Note4: "Data Quality Issue ➡️ Log"                      |
| Update row(s) - Creation | Data Table (Update)  | Increment records created counter                     | Create Company                | Wait1                          |                                                               |
| Update row(s) - Update | Data Table (Update)   | Increment records updated counter                     | Update Company                | Wait1                          |                                                               |
| Wait1                  | Wait                  | Wait 1 second between iterations                      | Update row(s) - Creation, Update row(s) - Update, Create row(s) Logs | Loop Over Items                |                                                               |
| Sticky Note            | Sticky Note           | Workflow overview and setup instructions             | None                         | None                           | See detailed content in Section 1.1                            |
| Sticky Note1           | Sticky Note           | Explanation of search result types                    | None                         | None                           | Explains none/one/multiple results                             |
| Sticky Note5           | Sticky Note           | Import loop heading                                   | None                         | None                           |                                                               |
| Sticky Note6           | Sticky Note           | Initialization heading                                | None                         | None                           |                                                               |
| Sticky Note8           | Sticky Note           | Reporting heading                                     | None                         | None                           |                                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Manual Trigger Node:**  
   - Name: “When clicking ‘Execute workflow’”  
   - Type: Manual Trigger  
   - No special parameters.

2. **Setup Internal Data Table for Counters:**  
   - Create or use a Data Table named “EML_Import” with columns:  
     - executionId (string)  
     - recordsRead (number)  
     - recorsCreated (number)  
     - recordsUpdated (number)  
   - Create an “Insert row” Data Table node:  
     - Operation: Insert  
     - Set executionId to `{{$execution.id}}`  
     - Initialize counters (recordsRead, recorsCreated, recordsUpdated) to 0  
   - Connect manual trigger output to this node.

3. **Retrieve Leads from Google Sheets:**  
   - Create a Google Sheets node named “Get row(s) Leads”:  
     - Document ID: Google Sheet with leads data  
     - Sheet Name: “Sheet1” (or relevant sheet)  
     - Filter rows where column “Valid Email” equals “OK”  
   - Connect “Insert row” output to “Get row(s) Leads”.

4. **Batch Processing Setup:**  
   - Add a SplitInBatches node named “Loop Over Items” connected to “Get row(s) Leads”.  
   - Default batch size is acceptable.

5. **Setup Loop Control and Reporting Preparation:**  
   - Add a Limit node named “Limit” with parameter to keep last item only; connect from “Loop Over Items”.  
   - Add a Data Table “Get row(s)1” node to retrieve the counters row by ID; connect from “Limit”.  
   - Add “Send a message” Gmail node to send report email:  
     - Recipient: your email  
     - Subject: “REPORT EML IMPORT DE LEADS”  
     - Message: Include counters from Data Table (e.g., `{{ $json.recordsRead }}`)  
   - Connect “Get row(s)1” output to Gmail node.

6. **Setup Counters Retrieval and Update:**  
   - Add Data Table “Get row(s)” node to fetch counters row by ID; connect from “Insert row”.  
   - Add Data Table “Update row(s)” node to increment `recordsRead` by 1; connect from “Get row(s)”.  
   - Connect “Update row(s)” output to “Search Company”.

7. **Company Search in Airtable:**  
   - Create an Airtable “Search Company” node:  
     - Base and Table: Your CRM base and company table  
     - FilterByFormula: `AND({Company} = "{{ $('Loop Over Items').item.json.Company }}", {Email} = "{{ $('Loop Over Items').item.json.Email }}")`  
   - Connect from “Update row(s)”.

8. **Interpret Search Results:**  
   - Add a Code node with JavaScript logic:  
     - Categorize search results as none, one, or multiple  
   - Connect from “Search Company”.

9. **Branch Logic with Switch:**  
   - Add a Switch node to route by `resultType` field from Code node with outputs: none, one, multiple.  
   - Connect from Code node.

10. **Handle Creation of Companies:**  
    - Add Airtable “Create Company” node:  
      - Map all relevant fields from current lead item  
    - Connect Switch’s “none” output to this node.

11. **Handle Updating of Companies:**  
    - Add Airtable “Update Company” node:  
      - Map fields similarly to Create node  
      - Use matching columns “Company” and “Email” for update  
    - Connect Switch’s “one” output here.

12. **Log Data Quality Issues:**  
    - Add Google Sheets node “Create row(s) Logs” to append a row to a Logs sheet:  
      - Columns: Company, Email, Remark (e.g., “Data quality Issue : Presence of duplicate(s) => to be investigated”)  
    - Connect Switch’s “multiple” output here.

13. **Update Counters After Creation and Update:**  
    - Add Data Table “Update row(s) - Creation” to increment `recorsCreated`; connected from “Create Company”.  
    - Add Data Table “Update row(s) - Update” to increment `recordsUpdated`; connected from “Update Company”.

14. **Add Wait Node:**  
    - Add a Wait node “Wait1” with 1 second delay, connected from all three update or log nodes.  
    - Connect “Wait1” output back to “Loop Over Items” to continue batch processing.

15. **Credential Setup:**  
    - For Google Sheets nodes: Configure Google Sheets OAuth2 credentials.  
    - For Airtable nodes: Configure Airtable API token credentials.  
    - For Gmail node: Configure OAuth2 Gmail credentials for sending emails.

16. **Add Sticky Notes (Optional):**  
    - For clarity, add sticky notes as per original workflow to label Initialization, Import Loop, Reporting, and explain key logic.

---

### 5. General Notes & Resources

| Note Content                                                                                                     | Context or Link                                                                                     |
|-----------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Workflow automates lead import with counters and logs for data quality issues.                                   | Provides reliable import with audit trail and error handling in marketing lead automation          |
| Setup requires Airtable and Google credentials for access.                                                      | Credentials for Airtable API and Google Sheets OAuth2 must be configured before running workflow   |
| Airtable Search Conditions use dynamic filtering with AND on Company and Email fields.                           | Example formula: `AND({Company} = "{{ ... }}", {Email} = "{{ ... }}")`                              |
| Duplicate companies in Airtable indicate data quality issues and are logged to a Google Sheet “Logs” tab.       | Helps marketing teams identify and clean duplicate CRM entries                                    |
| Email report sent after workflow completes with summary statistics.                                              | Gmail OAuth2 credential required for sending automated email reports                               |
| Wait node of 1 second controls API rate limits and pacing during batch processing.                               | Prevents throttling errors or timeouts during Airtable and Google Sheets API calls                  |
| Internal Data Table “EML_Import” tracks execution ID and counts of records read/created/updated for reporting.  | Acts as persistent state container within the workflow for accurate reporting                      |

---

**Disclaimer:** The provided text is derived exclusively from an automated workflow created with n8n, an integration and automation tool. The processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.