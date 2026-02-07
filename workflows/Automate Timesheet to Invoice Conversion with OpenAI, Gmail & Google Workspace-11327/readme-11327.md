Automate Timesheet to Invoice Conversion with OpenAI, Gmail & Google Workspace

https://n8nworkflows.xyz/workflows/automate-timesheet-to-invoice-conversion-with-openai--gmail---google-workspace-11327


# Automate Timesheet to Invoice Conversion with OpenAI, Gmail & Google Workspace

### 1. Workflow Overview

This workflow automates the conversion of emailed timesheets into organized Google Sheets invoices. It is designed for businesses that receive timesheets via email and need to systematically extract, process, and archive invoice data for each client and employee.

The workflow is logically divided into the following blocks:

- **1.1 Email Intake and Attachment Handling**: Listens for incoming Gmail messages with timesheet attachments, downloads and separates the attachments for individual processing.
- **1.2 OCR Text Extraction**: Converts PDFs or images into searchable text via an OCR API.
- **1.3 AI Parsing of Timesheet Data**: Uses OpenAI GPT-4 to extract structured data such as employee name, client, week start/end dates, and total working hours from the extracted text.
- **1.4 Customer PO Lookup**: Looks up sender email in a Google Sheet containing customer purchase order (PO) data to retrieve invoice parameters.
- **1.5 Google Drive Folder Discovery and Creation**: Locates or creates nested client, employee, and year folders within a main Client Invoices directory for file organization.
- **1.6 Invoice Sheet Handling**: Builds invoice sheet names from employee and date info; searches for existing invoice sheets in Drive, then either appends new rows or creates new sheets accordingly.
- **1.7 Invoice Row Creation and Finalization**: Prepares and appends invoice row data into the appropriate Google Sheet.
- **1.8 Folder and File Movement**: Moves newly created sheets to the correct year folder in Google Drive.
- **1.9 Conditional Logic and Date Calculations**: Handles invoice range decisions and invoice and due date calculations based on extracted timesheet data and PO terms.

---

### 2. Block-by-Block Analysis

#### 1.1 Email Intake and Attachment Handling

- **Overview**: Listens for unread Gmail messages matching timesheet criteria, downloads attachments, and splits them for individual processing.
- **Nodes Involved**: Gmail Trigger, Split Binary Attachments, Loop: Process Each Attachment, Sticky Note7, Sticky Note6
- **Node Details**:
  - **Gmail Trigger**
    - Type: Gmail Trigger
    - Config: Polls Gmail every minute for unread emails with attachment filename or subject containing "timesheet"
    - Inputs: None (trigger node)
    - Outputs: Email items with attachments downloaded
    - Failure modes: Authentication errors, Gmail API limits, no matching emails
  - **Split Binary Attachments**
    - Type: Code Node
    - Config: Splits all binary attachments from a single email into separate items to process each file individually
    - Inputs: Email with multiple attachments
    - Outputs: One item per attachment
    - Risks: If attachments are empty or binary data corrupted, may cause failures
  - **Loop: Process Each Attachment**
    - Type: SplitInBatches
    - Config: Processes each attachment serially
    - Inputs/Outputs: Processes one attachment at a time from split binary list

#### 1.2 OCR Text Extraction

- **Overview**: Converts each attachment file (PDF/image) into plain text using an external OCR HTTP API.
- **Nodes Involved**: Extract Text from Attachment, Sticky Note (OCR extraction)
- **Node Details**:
  - **Extract Text from Attachment**
    - Type: HTTP Request
    - Config: Posts attachment binary data to https://universal-file-to-text-extractor.vercel.app/extract with multipart-form-data, requests text output
    - Inputs: One attachment binary
    - Outputs: Plain text extracted from attachment
    - Failure modes: HTTP errors, API downtime, malformed files

#### 1.3 AI Parsing of Timesheet Data

- **Overview**: Sends extracted text to OpenAI GPT-4 to parse structured timesheet fields in JSON.
- **Nodes Involved**: Extract Timesheet Data (OpenAI), Set Timesheet JSON Fields, Sticky Note9
- **Node Details**:
  - **Extract Timesheet Data (OpenAI)**
    - Type: OpenAI Node (LangChain)
    - Config: Uses GPT-4 to extract Employee Name, Week Starting/Ending Date, Total Working Hours, Client Name; specific instructions on date format and JSON output
    - Inputs: Extracted text from OCR
    - Outputs: JSON with parsed fields
    - Failure modes: API rate limits, unexpected text formats, parsing errors
  - **Set Timesheet JSON Fields**
    - Type: Set Node
    - Config: Parses OpenAI JSON response to set clean workflow variables including current year from dates
    - Inputs: OpenAI JSON output
    - Outputs: Standardized JSON fields used downstream

#### 1.4 Customer PO Lookup

- **Overview**: Matches sender email to customer PO data stored in Google Sheets to retrieve invoice parameters.
- **Nodes Involved**: Get Customer Info From PO Sheet, Sticky Note8
- **Node Details**:
  - **Get Customer Info From PO Sheet**
    - Type: Google Sheets
    - Config: Searches PO Sheet for row where "Email" matches sender email; retrieves customer account number, PO number, item name, folder names, invoice range, due date offset
    - Inputs: Sender email extracted from Gmail Trigger
    - Outputs: PO data JSON
    - Risks: Sheet ID must be correctly configured; missing or mismatched emails cause lookup failure

#### 1.5 Google Drive Folder Discovery and Creation

- **Overview**: Ensures hierarchical folder structure exists for client invoices: Client folder → Employee folder → Year folder.
- **Nodes Involved**: Search: Client Invoices Folder, Search: Client Folder by Name, Check Client Name Folder, Create Client Name Folder, Search: Employee Name Folder, Check Employee Name Folder, Create Employee Name Folder, Search: Year Folder, Check if Year Folder Exists, Create Year Folder, Create Current Year Folder, Sticky Notes10,11,12,3
- **Node Details**:
  - **Search: Client Invoices Folder**
    - Type: Google Drive Search
    - Config: Searches root "My Drive" for main client invoices directory
  - **Search: Client Folder by Name**
    - Searches inside Client Invoices folder for folder named by Client Name from timesheet
  - **Check Client Name Folder**
    - If search result exists, passes folder ID; else triggers creation
  - **Create Client Name Folder**
    - Creates folder with client name under Client Invoices folder
  - **Search: Employee Name Folder**
    - Searches inside client folder for employee folder by PO-configured folder name
  - **Check Employee Name Folder**
    - Checks existence, triggers creation if missing
  - **Create Employee Name Folder**
    - Creates employee folder inside client folder
  - **Search: Year Folder**
    - Searches inside employee folder for current year folder by extracted year
  - **Check if Year Folder Exists**
    - If year folder exists, passes ID; else triggers creation
  - **Create Year Folder**
    - Creates year folder inside employee folder
  - **Create Current Year Folder**
    - Creates current year folder inside employee folder if missing
  - **Edge cases**: Drive API rate limits, permission errors, folder naming conflicts

#### 1.6 Invoice Sheet Handling

- **Overview**: Constructs invoice sheet names from employee and date ranges, searches for existing files, and decides whether to append rows or create new sheets.
- **Nodes Involved**: Set: Invoice Range, If: Invoice Range is 15 Days?, Set Invoice Date & Due Date Days, Set: File Name from Start & End Based Date Range, Search: File By Start Date Name, Search: File By End Date Name, Merge: Combine Folder Search Results, If: File Already Exists?, Sticky Notes14,5,19,18
- **Node Details**:
  - **Set: Invoice Range**
    - Sets invoice range and year folder ID variables from PO and year folder lookup
  - **If: Invoice Range is 15 Days?**
    - Conditional branch depending on whether invoice range equals "15 days"
  - **Set Invoice Date & Due Date Days**
    - Calculates invoice date and due date by adding PO due date offset to week end date
  - **Set: File Name from Start & End Based Date Range**
    - Generates two filename variants (start date based, end date based) with employee name and date range formatted as: Employee_ MM-DD-YYYY_to_MM-DD-YYYY
  - **Search: File By Start Date Name**, **Search: File By End Date Name**
    - Searches Google Drive for files matching either filename variant
  - **Merge: Combine Folder Search Results**
    - Combines search results to check if any matching invoice sheet exists
  - **If: File Already Exists?**
    - Routes based on whether matching file found: append to existing vs create new sheet

#### 1.7 Invoice Row Creation and Finalization

- **Overview**: Prepares invoice row data and appends it into the correct Google Sheet, either new or existing.
- **Nodes Involved**: Set: Empty Row Structure, Set: Row Data, Sheets: Append Row, Sheets: Append Row1, Sheets: Final Append, Set: Spreadsheet (ID & Name), Append: Final Row to Existing Sheet, Sticky Notes4,16
- **Node Details**:
  - **Set: Empty Row Structure**
    - Initializes an empty JSON structure for invoice row fields to ensure schema consistency
  - **Set: Row Data**
    - Assigns invoice row fields with values from PO lookup and timesheet JSON fields (e.g., customer account, invoice date, PO number, description)
  - **Sheets: Append Row**, **Sheets: Append Row1**, **Sheets: Final Append**
    - Append invoice rows into Google Sheets (new or existing), mapping fields explicitly or auto-mapping
  - **Set: Spreadsheet (ID & Name)**
    - Stores spreadsheet ID and name for later operations
  - **Append: Final Row to Existing Sheet**
    - Appends new invoice row to existing sheet with calculated due date and invoice date
  - **Failure points**: API limits, schema mismatches, invalid date formats

#### 1.8 Folder and File Movement

- **Overview**: Moves newly created invoice sheets into appropriate year folders on Google Drive.
- **Nodes Involved**: Move Created Sheet to Final Folder, Drive: Move Sheet To Final Folder, Sticky Notes15
- **Node Details**:
  - Both nodes use Google Drive API to move spreadsheet files to the year folder ID determined earlier
  - Inputs: Spreadsheet ID, Target folder ID
  - Outputs: Confirmation of move operation
  - Failure modes: Drive permissions or API failures

#### 1.9 Conditional Logic and Date Calculations

- **Overview**: Supports decision making and date calculations for invoice generation.
- **Nodes Involved**: If: Invoice Range is 15 Days?, Set Invoice Date & Due Date Days, Generate Sheet Name (Employee + Week Start to End Dates), Sticky Note1
- **Node Details**:
  - Uses JavaScript expressions to add days for due dates and format invoice sheet names
  - Ensures invoice date and due date are consistent with PO terms and timesheet data

---

### 3. Summary Table

| Node Name                        | Node Type               | Functional Role                              | Input Node(s)                                | Output Node(s)                                  | Sticky Note                                                                                                         |
|---------------------------------|-------------------------|----------------------------------------------|----------------------------------------------|-------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| Gmail Trigger                   | Gmail Trigger           | Email intake trigger for timesheet emails    | None                                         | Split Binary Attachments                         | ## Email intake and loop<br>Listens to Gmail for unread timesheet emails, splits attachments for individual processing. |
| Split Binary Attachments        | Code                    | Splits attachments into separate items       | Gmail Trigger                                | Loop: Process Each Attachment                    |                                                                                                                     |
| Loop: Process Each Attachment   | SplitInBatches          | Loops over each attachment for processing    | Split Binary Attachments                      | Extract Text from Attachment (conditional)      |                                                                                                                     |
| Extract Text from Attachment    | HTTP Request            | OCR extraction of attachment to plain text   | Loop: Process Each Attachment                 | Extract Timesheet Data (OpenAI)                   | ## OCR extraction<br>Sends each attachment to OCR API for text extraction.                                          |
| Extract Timesheet Data (OpenAI) | OpenAI (LangChain)      | AI parsing timesheet text to structured JSON | Extract Text from Attachment                  | Set Timesheet JSON Fields                         | ## AI timesheet parsing<br>Extracts employee, client, dates, hours from text.                                        |
| Set Timesheet JSON Fields       | Set                     | Cleans and sets JSON fields from AI output   | Extract Timesheet Data (OpenAI)               | Get Customer Info From PO Sheet                   |                                                                                                                     |
| Get Customer Info From PO Sheet | Google Sheets           | Looks up sender in PO sheet for invoice data | Set Timesheet JSON Fields                     | Search: Client Invoices Folder                    | ## Customer and PO lookup<br>Retrieves account, PO, item, folder, invoice range, due date offset from sheet.         |
| Search: Client Invoices Folder  | Google Drive            | Searches root Drive folder for invoices dir  | Get Customer Info From PO Sheet               | Search: Client Folder by Name                      | ## Client folder discovery<br>Search or create client folder based on timesheet and PO info.                         |
| Search: Client Folder by Name   | Google Drive            | Searches for client folder by name           | Search: Client Invoices Folder                | Check Client Name Folder                           |                                                                                                                     |
| Check Client Name Folder        | If                      | Checks if client folder exists                | Search: Client Folder by Name                  | Create Client Name Folder / Search: Employee Name Folder |                                                                                                                     |
| Create Client Name Folder       | Google Drive            | Creates client folder if missing              | Check Client Name Folder                       | Create Employee Name Folder                        | ## Create new<br>Creates client, employee, and year folders if missing.                                             |
| Search: Employee Name Folder    | Google Drive            | Searches for employee folder                   | Check Client Name Folder / Create Client Name Folder | Check Employee Name Folder                        |                                                                                                                     |
| Check Employee Name Folder      | If                      | Checks if employee folder exists              | Search: Employee Name Folder                   | Create Employee Name Folder / Search: Year Folder |                                                                                                                     |
| Create Employee Name Folder     | Google Drive            | Creates employee folder if missing            | Check Employee Name Folder                      | Create Year Folder                                |                                                                                                                     |
| Search: Year Folder             | Google Drive            | Searches for year folder inside employee folder | Check Employee Name Folder                     | Check if Year Folder Exists                        |                                                                                                                     |
| Check if Year Folder Exists     | If                      | Checks if year folder exists                   | Search: Year Folder                            | Set: Invoice Range / Create Current Year Folder  |                                                                                                                     |
| Create Year Folder              | Google Drive            | Creates year folder if missing                 | Create Employee Name Folder                    | Check if Year Folder Exists                        |                                                                                                                     |
| Create Current Year Folder      | Google Drive            | Creates year folder inside employee folder    | Check if Year Folder Exists                    | Set: Invoice Range                                |                                                                                                                     |
| Set: Invoice Range              | Set                     | Sets invoice range and year folder ID          | Check if Year Folder Exists / Create Current Year Folder | If: Invoice Range is 15 Days?                     |                                                                                                                     |
| If: Invoice Range is 15 Days?  | If                      | Conditional branch on invoice range            | Set: Invoice Range                             | Set Invoice Date & Due Date Days / Set: File Name from Start & End Based Date Range |                                                                                                                     |
| Set Invoice Date & Due Date Days| Set                     | Calculates invoice and due dates               | If: Invoice Range is 15 Days? (true)          | Generate Sheet Name (Employee + Week Start to End Dates) | ## Build invoice dates<br>Calculates invoice date and due date using timesheet and PO rules.                        |
| Set: File Name from Start & End Based Date Range | Set       | Generates invoice sheet file names             | If: Invoice Range is 15 Days? (false)         | Search: File By Start Date Name / Search: File By End Date Name | ## Build file names and search<br>Generates filenames from employee and dates.                                      |
| Search: File By Start Date Name| Google Drive            | Searches Drive for file by start date filename | Set: File Name from Start & End Based Date Range | Merge: Combine Folder Search Results              |                                                                                                                     |
| Search: File By End Date Name  | Google Drive            | Searches Drive for file by end date filename  | Set: File Name from Start & End Based Date Range | Merge: Combine Folder Search Results              |                                                                                                                     |
| Merge: Combine Folder Search Results | Merge                | Combines two file search result lists          | Search: File By Start Date Name / Search: File By End Date Name | If: File Already Exists?                          | ## Decide reuse or create sheet<br>Checks merged search results for existing invoice sheets.                        |
| If: File Already Exists?        | If                      | Checks if matching invoice sheet exists        | Merge: Combine Folder Search Results           | Append: Final Row to Existing Sheet / Sheets: Create Sheet |                                                                                                                     |
| Append: Final Row to Existing Sheet | Google Sheets        | Appends invoice row to existing invoice sheet  | If: File Already Exists? (true)                 | Loop: Process Each Attachment                      | ## Write invoice row<br>Appends invoice row to existing or new sheet.                                              |
| Sheets: Create Sheet            | Google Sheets           | Creates new Google Sheet for invoice            | If: File Already Exists? (false)                | HTTP Request1(create sheet)                         | ## Create invoice sheet<br>Creates new sheet with appropriate name and timezone.                                   |
| HTTP Request1(create sheet)     | HTTP Request            | Updates new sheet timezone to America/New_York | Sheets: Create Sheet                            | Drive: Move Sheet To Final Folder                   |                                                                                                                     |
| Drive: Move Sheet To Final Folder | Google Drive          | Moves created sheet to year folder              | HTTP Request1(create sheet)                      | Set: Empty Row Structure                            |                                                                                                                     |
| Set: Empty Row Structure        | Set                     | Initializes empty invoice row JSON structure    | Drive: Move Sheet To Final Folder                | Sheets: Append Row1                                 |                                                                                                                     |
| Sheets: Append Row1             | Google Sheets           | Appends first invoice row to new sheet          | Set: Empty Row Structure                          | Set: Spreadsheet  (ID & Name)                       |                                                                                                                     |
| Set: Spreadsheet  (ID & Name)   | Set                     | Sets spreadsheet ID and name variables          | Sheets: Append Row1                               | Append: Final Row to Existing Sheet                 |                                                                                                                     |
| Set: Row Data                  | Set                     | Prepares invoice row fields for new sheet        | Move Created Sheet to Final Folder                | Sheets: Append Row                                  |                                                                                                                     |
| Sheets: Append Row              | Google Sheets           | Appends invoice row to newly created sheet       | Set: Row Data                                     | Loop: Process Each Attachment                        |                                                                                                                     |
| Sheets: Final Append            | Google Sheets           | Final append action for invoice rows              | Sheets: Append Row                                | Loop: Process Each Attachment                        |                                                                                                                     |
| Move Created Sheet to Final Folder | Google Drive          | Moves newly created invoice sheet to year folder | HTTP Request(new sheet)                           | Set: Row Data                                       |                                                                                                                     |
| HTTP Request(new sheet)         | HTTP Request            | Updates new sheet timezone                         | Create New Sheet                                  | Move Created Sheet to Final Folder                   |                                                                                                                     |
| Generate Sheet Name (Employee + Week Start to End Dates) | Set | Creates sheet name string from employee and dates | Set Invoice Date & Due Date Days                  | Create New Sheet                                    | ## Create invoice sheet<br>Generate sheet name and create Google Sheet.                                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger**
   - Node Type: Gmail Trigger
   - Poll every minute for unread emails with attachments named or with subject containing "timesheet"
   - Enable downloading attachments
   - Configure Gmail OAuth2 credentials

2. **Add Code Node to Split Binary Attachments**
   - Node Type: Code (JavaScript)
   - Code splits all attachments in the incoming email into separate items for processing

3. **Add SplitInBatches Node**
   - Node Type: SplitInBatches
   - Configure to process each attachment individually, no reset on completion

4. **Add HTTP Request Node for OCR Extraction**
   - URL: https://universal-file-to-text-extractor.vercel.app/extract
   - Method: POST, Content-Type: multipart-form-data
   - Body Parameters:
     - mode=single
     - output_type=text
     - files: binary data from current attachment
   - No authentication required

5. **Add OpenAI Node for Timesheet Data Extraction**
   - Use GPT-4 model
   - Prompt instructing extraction of Employee Name, Client Name, Week Starting/Ending Dates, Total Working Hours with specific date formatting rules
   - Input: Text from OCR node
   - Output: JSON with extracted fields
   - Configure OpenAI credentials

6. **Add Set Node to Parse and Clean AI Output**
   - Parse JSON from OpenAI response
   - Set workflow variables for Employee Name, Client Name, Week Start Date, Week End Date, Total Billable Hours, Current Year (derived from week start date)

7. **Add Google Sheets Node to Lookup Customer PO Info**
   - Configure Google Sheets OAuth2 credentials
   - Use the configured Customer PO Sheet ID
   - Filter rows where Email column matches Gmail sender
   - Retrieve fields: Account Number, PO Number, Item Name, Folder Name, Invoice Range, Due Date Calculation

8. **Add Google Drive Nodes for Folder Discovery and Creation**
   - Search for root Client Invoices folder in "My Drive"
   - Search for Client folder by client name; if missing, create it
   - Search for Employee folder inside client folder; if missing, create it
   - Search for Year folder inside employee folder by current year; if missing, create it
   - Use Drive OAuth2 credentials

9. **Add Set Node to Store Invoice Range and Year Folder ID**
   - Store invoice range from PO lookup and year folder ID for later use

10. **Add If Node to Branch Based on Invoice Range**
    - Condition: Invoice range equals "15 days"
    - True branch: Calculate invoice and due dates based on week end date + due date offset
    - False branch: Generate file names based on start and end dates

11. **Add Set Node to Calculate Invoice and Due Dates**
    - Use date manipulation to set Invoice Date as week end date
    - Calculate Due Date by adding due date offset days from PO lookup

12. **Add Set Node to Generate File Names**
    - Create two file names:
      - Start Date Based: EmployeeName_MM-DD-YYYY_to_MM-DD-YYYY (start date + 13 days)
      - End Date Based: EmployeeName_MM-DD-YYYY_to_MM-DD-YYYY (end date - 13 days)
    - Remove spaces in employee name

13. **Add Google Drive Nodes to Search for Existing Invoice Files**
    - Search by start date based file name
    - Search by end date based file name

14. **Add Merge Node to Combine Both Search Results**

15. **Add If Node to Check If File Already Exists**
    - True: Append invoice row to existing sheet
    - False: Create new invoice sheet

16. **Create New Google Sheet Node**
    - Title: Use generated sheet name from employee and dates
    - Use Google Sheets OAuth2 credentials

17. **Add HTTP Request Node to Update New Sheet Timezone**
    - URL: https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}:batchUpdate
    - Body: Set timezone to America/New_York
    - Use Google Sheets OAuth2 credentials

18. **Add Google Drive Move Node**
    - Move newly created sheet to year folder ID

19. **Add Set Node to Initialize Empty Invoice Row**
    - Create empty JSON structure with all required invoice fields

20. **Add Google Sheets Append Row Node**
    - Append the first invoice row to the new sheet
    - Use sheet ID and spreadsheet ID from created sheet

21. **Add Set Node to Prepare Invoice Row Data**
    - Fill row fields from PO lookup and timesheet JSON (Invoice Date, Due Date, Customer Account Number, PO Number, Item Name, Quantity, Description)

22. **Add Google Sheets Append Row Node**
    - Append invoice row to newly created sheet

23. **Add Google Sheets Append Row Node for Existing Sheets**
    - Append invoice row to existing sheet when file found

24. **Connect Loops and Conditional Flows Appropriately**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                        | Context or Link                                                                                  |
|-----------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Timesheet to Invoice Automation<br>Automates converting emailed timesheets into organized invoice sheets using Gmail, Google Drive, Sheets, OpenAI, and OCR. Setup includes configuring credentials and confirming Gmail filters. | Sticky Note7 (overview)                                                                          |
| OCR extraction<br>Sends each attachment to an OCR API to convert PDFs/images to machine-readable text before AI parsing.                           | Sticky Note (near OCR node)                                                                      |
| AI timesheet parsing<br>OpenAI GPT-4 extracts employee name, client name, start/end dates, total hours, and year from text.                        | Sticky Note9 (near OpenAI node)                                                                 |
| Customer and PO lookup<br>Looks up sender's email in a Google Sheet to retrieve invoice parameters such as account number, PO number, item names, folder names, invoice range, and due date offset. | Sticky Note8 (near PO lookup node)                                                              |
| Client folder discovery<br>Searches or creates the client folder inside the main Client Invoices Google Drive directory.                           | Sticky Note10 (near client folder search)                                                       |
| File naming and search<br>Searches Google Drive for existing sheets named by employee and date range to avoid duplicate invoices.                  | Sticky Note11                                                                                   |
| Create new folders<br>Creates missing client, employee, and year folders in Drive if they do not exist.                                             | Sticky Note12                                                                                   |
| Build invoice dates<br>Computes invoice date and due date based on timesheet week ending date and PO terms.                                         | Sticky Note1 (near date setting nodes)                                                          |
| Create invoice sheet<br>Generates the invoice sheet name, creates a new Google Sheet, sets timezone, and moves the sheet to the correct year folder. | Sticky Note3, Sticky Note15                                                                      |
| Write invoice row<br>Prepares and appends invoice rows to new or existing Google Sheets to record invoice data.                                    | Sticky Note4, Sticky Note16, Sticky Note (near append nodes)                                    |
| Decide reuse or create sheet<br>Checks if invoice sheet already exists and chooses whether to append or create a new sheet.                        | Sticky Note5                                                                                   |

---

**Disclaimer:** The provided text is exclusively sourced from an automated n8n workflow. It fully complies with content policies and does not contain illegal, offensive, or protected elements. All processed data is legal and publicly accessible.