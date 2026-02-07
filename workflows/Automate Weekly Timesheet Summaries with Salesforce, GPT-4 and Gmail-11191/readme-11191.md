Automate Weekly Timesheet Summaries with Salesforce, GPT-4 and Gmail

https://n8nworkflows.xyz/workflows/automate-weekly-timesheet-summaries-with-salesforce--gpt-4-and-gmail-11191


# Automate Weekly Timesheet Summaries with Salesforce, GPT-4 and Gmail

---
### 1. Workflow Overview

This workflow automates the generation and distribution of weekly timesheet summaries using Salesforce data, GPT-4 AI summarization, and Gmail for email delivery. It targets HR and management teams needing consolidated insights into employee timesheet submissions, including detailed work summaries for submitted timesheets and a list of employees who have not submitted their timesheets.

The workflow is logically divided into these blocks:

- **1.1 Schedule & Timesheet Fetching:** Triggered weekly (every Friday) to fetch all timesheets for the previous week from Salesforce.
- **1.2 Submitted Timesheet Processing & AI Summary:** Processes submitted timesheets by extracting detailed line items and generating short AI-created summaries of work performed.
- **1.3 Employee Data Enrichment & Submitted Summary Preparation:** Attaches employee profile details to timesheets and prepares a detailed summary section for submitted timesheets.
- **1.4 Pending Timesheet Tracking:** Identifies employees with “New” (not submitted) timesheet status, fetches their details, and prepares a pending submissions list.
- **1.5 Final Report Creation & Manager Notification:** Merges submitted and pending sections into a single report and sends it via Gmail to managers.

---

### 2. Block-by-Block Analysis

#### 1.1 Schedule & Timesheet Fetching

**Overview:**  
Runs every Friday to retrieve all timesheets from the previous week from Salesforce.

**Nodes Involved:**  
- Schedule Trigger  
- Timesheet  

**Node Details:**  
- **Schedule Trigger**  
  - Type: Schedule trigger  
  - Configuration: Weekly trigger set to Friday (week interval, triggerAtDay=5)  
  - Inputs: None (start node)  
  - Outputs: Triggers Timesheet node  
  - Edge cases: Missed triggers if n8n instance is down; time zone considerations for exact day trigger  
- **Timesheet**  
  - Type: Salesforce node (custom object query)  
  - Configuration: Fetches all timesheets for previous week matching name pattern "Timesheet for [start date] to [end date]" dynamically computed using current date minus one week and ISO date formatting  
  - Fields retrieved: Timesheet metadata including employee ref, dates, status, hours, etc.  
  - Credentials: Salesforce OAuth2  
  - Inputs: Triggered by Schedule Trigger  
  - Outputs: Sends timesheet records downstream for further processing  
  - Edge cases: Salesforce API errors, incomplete data, no timesheets found  

#### 1.2 Submitted Timesheet Processing & AI Summary

**Overview:**  
Filters submitted timesheets, fetches their line items, converts them to an HTML table, and sends the data to GPT-4 to generate a concise JSON summary of the employee’s weekly work.

**Nodes Involved:**  
- If Submitted Timesheet  
- Loop Over Items  
- Get Timesheet Line Items  
- Generate HTML Table  
- OpenAI1  
- Merge AI Summary  

**Node Details:**  
- **If Submitted Timesheet**  
  - Type: If node  
  - Condition: Checks if timesheet status equals “Submitted”  
  - Inputs: Timesheet node output  
  - Outputs: Only “Submitted” timesheets pass down this branch  
  - Edge cases: Status field missing or unexpected value  
- **Loop Over Items**  
  - Type: SplitInBatches  
  - Configuration: Processes each submitted timesheet individually for line item extraction and summarization  
  - Inputs: Filtered submitted timesheets  
  - Outputs: Each timesheet item is processed independently  
- **Get Timesheet Line Items**  
  - Type: Salesforce node (custom object query)  
  - Configuration: Fetches all line items linked to current timesheet by timesheet Id  
  - Inputs: Single timesheet from Loop Over Items  
  - Outputs: Line items data array  
  - Edge cases: No line items for timesheet, API failures  
- **Generate HTML Table**  
  - Type: Code node  
  - Role: Converts line items array into an HTML table with columns: Activity, Type, Billable, Billable Amount, Date, Duration, Description  
  - Inputs: Line items from Salesforce  
  - Outputs: JSON object containing `employeeId` and `html` string  
  - Edge cases: Empty line items, null fields  
- **OpenAI1**  
  - Type: OpenAI Langchain node (GPT-4)  
  - Configuration: Uses GPT-4.1 model with system prompt instructing to output JSON summary points about project activities only (no hours/dates/meetings); input includes employeeId and HTML table  
  - Inputs: JSON with employeeId and HTML table string  
  - Outputs: AI JSON summary with max 4 short points including positive/negative notes  
  - Credentials: OpenAI API key  
  - Edge cases: API rate limits, invalid JSON outputs, network issues  
- **Merge AI Summary**  
  - Type: Merge node (combine mode)  
  - Configuration: Merges AI summary results back with original timesheet data by matching employeeId fields  
  - Inputs: AI summaries and employee timesheet data  
  - Outputs: Combined data for preparing submitted section report  
  - Edge cases: Mismatched keys, missing data  

#### 1.3 Employee Data Enrichment & Submitted Summary Preparation

**Overview:**  
Enriches submitted timesheets with employee profile details, links AI summaries, and composes a well-structured textual summary section for all submitted employees.

**Nodes Involved:**  
- Salesforce - Get Employee Details  
- Merge  
- Prepare Submitted Section  

**Node Details:**  
- **Salesforce - Get Employee Details**  
  - Type: Salesforce node (custom object get)  
  - Configuration: Retrieves employee profile data (e.g., name, email) by employee Id from timesheet record  
  - Inputs: Timesheet data  
  - Outputs: Employee details JSON  
  - Credentials: Salesforce OAuth2  
  - Edge cases: Missing employee record, API errors  
- **Merge**  
  - Type: Merge node (combine mode)  
  - Configuration: Joins employee details with timesheet data by employee Id field  
  - Inputs: Timesheet and employee data  
  - Outputs: Combined enriched timesheet records  
  - Edge cases: Missing join keys, partial data  
- **Prepare Submitted Section**  
  - Type: Code node  
  - Role: Generates a multi-line plain text summary for each submitted employee, including timesheet period, status, hours breakdown, weekly requirement met, and AI-generated summary points. Prepares email subject and body, sets manager email list.  
  - Inputs: Combined enriched timesheet + AI summary data  
  - Outputs: JSON with emailSubject, emailBody, managerEmail string  
  - Edge cases: Missing summary points, empty timesheets  

#### 1.4 Pending Timesheet Tracking

**Overview:**  
Identifies employees with “New” timesheet status (not submitted), fetches their contact details, and prepares a list of pending submissions for manager visibility.

**Nodes Involved:**  
- If New Timesheet  
- Salesforce - Get Employee Details1  
- Merge Pending Info  
- Prepare Pending Section  

**Node Details:**  
- **If New Timesheet**  
  - Type: If node  
  - Condition: Checks timesheet status equals “New” (meaning not submitted)  
  - Inputs: Timesheet node output  
  - Outputs: Timesheets with “New” status for further processing  
  - Edge cases: Unexpected status values  
- **Salesforce - Get Employee Details1**  
  - Type: Salesforce node (custom object get)  
  - Configuration: Gets employee profile data for pending timesheets  
  - Inputs: Timesheet data with “New” status  
  - Outputs: Employee details JSON  
  - Credentials: Salesforce OAuth2  
  - Edge cases: Missing employee data  
- **Merge Pending Info**  
  - Type: Merge node (combine mode)  
  - Configuration: Combines employee details with timesheet data on employee Id  
  - Inputs: Employee details and “New” timesheet records  
  - Outputs: Enriched pending submissions data  
  - Edge cases: Key mismatches  
- **Prepare Pending Section**  
  - Type: Code node  
  - Role: Creates a plain-text list of employees who have not submitted their timesheets, including email contacts and week period. Sets email subject and manager recipients.  
  - Inputs: Enriched pending employee data  
  - Outputs: JSON with emailSubject, emailBody, managerEmail string  
  - Edge cases: No pending employees, missing emails  

#### 1.5 Final Report Creation & Manager Notification

**Overview:**  
Merges submitted and pending sections into a single consolidated report and sends the final email to the list of managers.

**Nodes Involved:**  
- Merge Submitted + Pending  
- Create Final Email  
- Send a message  

**Node Details:**  
- **Merge Submitted + Pending**  
  - Type: Merge node (default mode)  
  - Configuration: Combines the prepared submitted and pending sections into a single data set for final report assembly  
  - Inputs: Prepare Submitted Section output, Prepare Pending Section output  
  - Outputs: Combined data set for final email creation  
  - Edge cases: Missing one of the sections, empty inputs  
- **Create Final Email**  
  - Type: Code node  
  - Role: Concatenates submitted summary and pending submissions sections into one professional email body with a clear separator and a final subject line. Preserves manager email list.  
  - Inputs: Combined sections data  
  - Outputs: Final email JSON with consolidated subject, body, and recipients  
  - Edge cases: Missing sections, formatting issues  
- **Send a message**  
  - Type: Gmail node  
  - Configuration: Sends plain text email to manager list with final report subject and body  
  - Inputs: Final email JSON  
  - Credentials: Gmail OAuth2  
  - Outputs: None (end node)  
  - Edge cases: Gmail API throttling, credential expiration, invalid email addresses  

---

### 3. Summary Table

| Node Name                  | Node Type                          | Functional Role                               | Input Node(s)                       | Output Node(s)                       | Sticky Note                                                                                                                                                                                                                  |
|----------------------------|----------------------------------|-----------------------------------------------|-----------------------------------|------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger            | Schedule Trigger                 | Weekly trigger to start workflow               | None                              | Timesheet                         | ## Schedule & Timesheet Fetching<br>This section runs every Friday and fetches all employee timesheets for the previous week from Salesforce.                                                                                |
| Timesheet                  | Salesforce (customObject getAll) | Fetches last week's timesheets                  | Schedule Trigger                  | Salesforce - Get Employee Details, If New Timesheet, If Submitted Timesheet, Merge Pending Info |                                                                                                                                                                                                                              |
| If Submitted Timesheet      | If                              | Filters timesheets with status “Submitted”     | Timesheet                        | Loop Over Items                   | ## Submitted Timesheet Processing & AI Summary<br>This section processes only submitted timesheets. It collects detailed project line items, converts them into a readable structure, and uses AI to generate a short summary. |
| Loop Over Items             | SplitInBatches                  | Processes submitted timesheets individually     | If Submitted Timesheet            | Merge AI Summary, Get Timesheet Line Items |                                                                                                                                                                                                                              |
| Get Timesheet Line Items    | Salesforce (customObject getAll) | Fetches line items for each submitted timesheet | Loop Over Items                  | Generate HTML Table               |                                                                                                                                                                                                                              |
| Generate HTML Table         | Code                            | Converts line items into an HTML table          | Get Timesheet Line Items          | OpenAI1                          |                                                                                                                                                                                                                              |
| OpenAI1                    | OpenAI GPT-4                     | Generates AI summary JSON from HTML timesheet   | Generate HTML Table               | Merge AI Summary                 |                                                                                                                                                                                                                              |
| Merge AI Summary            | Merge                           | Combines AI summary with timesheet data         | Loop Over Items, OpenAI1          | Prepare Submitted Section         |                                                                                                                                                                                                                              |
| Salesforce - Get Employee Details | Salesforce (customObject get)       | Retrieves employee profile details                | Timesheet                       | Merge                          | ## Employee Data & Submitted Summary Preparation<br>This section attaches employee profile details to each submitted timesheet, links AI summaries, and prepares the full submitted employees report section.                 |
| Merge                      | Merge                           | Joins employee details with timesheet info       | Salesforce - Get Employee Details, Timesheet | Prepare Submitted Section         |                                                                                                                                                                                                                              |
| Prepare Submitted Section   | Code                            | Generates textual summary for submitted timesheets | Merge                          | Merge Submitted + Pending         |                                                                                                                                                                                                                              |
| If New Timesheet            | If                              | Filters timesheets with status “New” (not submitted) | Timesheet                       | Salesforce - Get Employee Details1 | ## Pending Timesheet Tracking<br>This section identifies employees who have not submitted their timesheet. It fetches their contact details and prepares a clean list of pending submissions for manager visibility.           |
| Salesforce - Get Employee Details1 | Salesforce (customObject get)       | Retrieves employee profile details for pending submissions | If New Timesheet               | Merge Pending Info               |                                                                                                                                                                                                                              |
| Merge Pending Info          | Merge                           | Combines employee data with pending timesheet info | Salesforce - Get Employee Details1, If New Timesheet | Prepare Pending Section           |                                                                                                                                                                                                                              |
| Prepare Pending Section     | Code                            | Generates textual list of pending timesheet employees | Merge Pending Info             | Merge Submitted + Pending         |                                                                                                                                                                                                                              |
| Merge Submitted + Pending   | Merge                           | Combines submitted and pending summary sections | Prepare Submitted Section, Prepare Pending Section | Create Final Email               | ## Final Report Creation & Manager Notification<br>This section merges both submitted and pending timesheet sections into one final weekly report and automatically sends the combined email to managers.                   |
| Create Final Email          | Code                            | Concatenates full report and prepares final email | Merge Submitted + Pending       | Send a message                   |                                                                                                                                                                                                                              |
| Send a message             | Gmail                           | Sends final report email to managers             | Create Final Email               | None                            |                                                                                                                                                                                                                              |
| Salesforce - Get Employee Details1 | Salesforce (customObject get)       | Retrieves employee details for pending timesheets | If New Timesheet               | Merge Pending Info               |                                                                                                                                                                                                                              |
| If Submitted Timesheet      | If                              | Filters timesheets by submitted status           | Timesheet                       | Loop Over Items                 |                                                                                                                                                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger node**  
   - Type: Schedule Trigger  
   - Configure: Weekly interval, trigger on Friday (day=5)  
   - Position: Start of workflow  

2. **Create Salesforce node “Timesheet”**  
   - Type: Salesforce (customObject getAll)  
   - Configure: Query `dbt__Timesheet__c` objects  
   - Fields: Name, Employee Id, Start/End Date, Status, Hours, etc.  
   - Conditions: Name equals dynamically computed string "Timesheet for [last week start] to [last week end]" using expression:  
     `={{ "Timesheet for " + DateTime.now().minus({ weeks: 1 }).startOf('week').toISODate() + " to " + DateTime.now().minus({ weeks: 1 }).endOf('week').toISODate() }}`  
   - Credentials: Salesforce OAuth2  
   - Connect Schedule Trigger → Timesheet  

3. **Create two If nodes to filter by timesheet status**  
   - “If Submitted Timesheet”: Condition `dbt__Status__c == "Submitted"`  
   - “If New Timesheet”: Condition `dbt__Status__c == "New"`  
   - Connect Timesheet output to both If nodes  

4. **Submitted Timesheet Branch:**  
   a. Create SplitInBatches node “Loop Over Items”  
      - No special config, processes one item at a time  
      - Connect If Submitted Timesheet (true) → Loop Over Items  

   b. Create Salesforce node “Get Timesheet Line Items”  
      - Type: Salesforce getAll for `dbt__Timesheet_Line_Item__c`  
      - Condition: `dbt__Timesheet__c == current timesheet Id`  
      - Connect Loop Over Items output → Get Timesheet Line Items  

   c. Create Code node “Generate HTML Table”  
      - JS code to render line items array as HTML table including relevant columns (Activity, Type, Billable, Billable Amount, Date, Duration, Description)  
      - Output JSON: `{ employeeId: ..., html: ... }`  
      - Connect Get Timesheet Line Items → Generate HTML Table  

   d. Create OpenAI node “OpenAI1”  
      - Model: GPT-4.1  
      - Messages: System message with instructions to output JSON summary points; User message with HTML table and employee Id  
      - Output: JSON summary with up to 4 short points describing project activities  
      - Credentials: OpenAI API  
      - Connect Generate HTML Table → OpenAI1  

   e. Create Merge node “Merge AI Summary”  
      - Mode: Combine, advanced enabled  
      - Merge by fields: AI summary employeeId with timesheet employee Id  
      - Connect Loop Over Items main output (original timesheet data) to Merge input 1  
      - Connect OpenAI1 output to Merge input 2  

5. **Employee Details Enrichment for Submitted Timesheets:**  
   a. Create Salesforce node “Salesforce - Get Employee Details”  
      - Type: Salesforce get (custom object) for `dbt__Employee__c`  
      - Parameter: Record Id from timesheet employee Id  
      - Credentials: Salesforce OAuth2  
      - Connect Timesheet output → Salesforce - Get Employee Details  

   b. Create Merge node “Merge”  
      - Mode: Combine, advanced enabled  
      - Merge by employee Id fields (timesheet employee Id and employee Id)  
      - Connect Salesforce - Get Employee Details output to Merge input 1  
      - Connect Timesheet output to Merge input 2 (or as per actual structure)  

   c. Connect Merge output → Prepare Submitted Section Code node  

   d. Prepare Submitted Section Code node:  
      - JS code to build a plain text report for each submitted employee including timesheet period, status, hours breakdown, weekly requirement met (✓/✗), and AI summary points if available  
      - Sets email subject "📊 Weekly Timesheet Summary – All Employees"  
      - Sets email body with detailed report  
      - Sets manager email list (string, comma-separated)  
      - Connect Merge AI Summary output → Prepare Submitted Section  
      - Connect Merge output → Prepare Submitted Section (depending on workflow connections)  

6. **Pending Timesheet Branch:**  
   a. Connect If New Timesheet (true) → Salesforce node “Salesforce - Get Employee Details1”  
      - Same configuration as previous employee details retrieval but for pending employees  
      - Credentials: Salesforce OAuth2  

   b. Create Merge node “Merge Pending Info”  
      - Mode: Combine, advanced enabled  
      - Merge by employee Id fields  
      - Connect Salesforce - Get Employee Details1 output and If New Timesheet output  

   c. Create Code node “Prepare Pending Section”  
      - JS code to create a plain text list of employees who did not submit timesheets, including employee names and emails, and week period  
      - Sets email subject "⚠️ Timesheet Not Submitted – Previous Week"  
      - Sets manager email list (same as above)  

7. **Final Report Assembly:**  
   a. Create Merge node “Merge Submitted + Pending”  
      - Default mode, joining outputs from Prepare Submitted Section and Prepare Pending Section nodes  

   b. Create Code node “Create Final Email”  
      - Concatenates submitted summary and pending list with separator and clear headings  
      - Sets final email subject "📊 Weekly Timesheet Report + Pending Submissions ⚠️"  
      - Sets manager email list  
      - Connect Merge Submitted + Pending → Create Final Email  

   c. Create Gmail node “Send a message”  
      - Sends plain text email using Gmail OAuth2 credentials  
      - To: managerEmail from final email JSON  
      - Subject and message from final email JSON  
      - Connect Create Final Email → Send a message  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                  | Context or Link                                                                                                                                                                  |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Weekly Timesheet Automation — Overview: This workflow runs weekly to fetch timesheet statuses, generate AI summaries of work, prepare detailed and pending submission sections, and send a consolidated email report to managers automatically. | Full project overview sticky note at workflow start.                                                                                                                           |
| Salesforce Timesheet App installation from AppExchange required to use custom timesheet objects: [Salesforce Timesheet App](https://appexchange.salesforce.com/appxListingDetail?listingId=a077704c-2e99-4653-8bde-d32e1fafd8c6)            | Setup prerequisite for Salesforce data integration.                                                                                                                             |
| Ensure Salesforce OAuth2 credentials are set up in n8n for access to custom objects.                                                                                                                                                          | Credential configuration requirement.                                                                                                                                            |
| Gmail OAuth2 credentials must be configured for sending emails via Gmail node.                                                                                                                                                                | Credential configuration requirement.                                                                                                                                            |
| OpenAI API key configured with access to GPT-4.1 model.                                                                                                                                                                                      | Required for AI summarization step.                                                                                                                                               |
| Manager email list hardcoded in code nodes; modify as necessary for recipients.                                                                                                                                                               | Can be customized per organization needs.                                                                                                                                        |
| AI summarization rules enforce JSON-only output with no markdown or extra text to ensure clean parsing.                                                                                                                                       | Important for robustness of OpenAI node outputs.                                                                                                                                 |
| The workflow handles edge cases such as no timesheets submitted, missing employee records, and API errors primarily by node design but no explicit error handling nodes are included.                                                        | Consider adding error handling or alerting for production environments.                                                                                                          |

---

*Disclaimer: The provided text originates exclusively from an automated n8n workflow. All data processed is legal and public. The workflow respects content policies and contains no illegal or offensive material.*