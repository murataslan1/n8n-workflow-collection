Automate Assignee Payroll Calculations with Dart, Gemini AI, and Google Sheets

https://n8nworkflows.xyz/workflows/automate-assignee-payroll-calculations-with-dart--gemini-ai--and-google-sheets-11257


# Automate Assignee Payroll Calculations with Dart, Gemini AI, and Google Sheets

### 1. Workflow Overview

This workflow automates the calculation of payroll for assignees based on task time tracking data from Dart and rate information stored in a Google Sheet. It is designed for project managers, agencies, or companies who want to automate billing or payroll by correlating completed tasks and hourly rates, then updating the results back into a Google Sheet.

**Target Use Cases:**  
- Automating payroll or client invoicing based on task completion and time tracking  
- Cross-referencing task logs with rate cards for accurate billing  
- Scheduled batch processing (e.g., weekly payroll calculations)

**Logical Blocks:**  
- **1.1 Schedule Trigger & Task Retrieval:** Periodic trigger to start the workflow and fetch tasks from Dart API  
- **1.2 Rate Card Retrieval:** Fetch assignee rate data from Google Sheets  
- **1.3 Data Aggregation:** Combine rate card and task data for processing  
- **1.4 AI Payroll Calculation:** Use Google Gemini AI agent to analyze tasks and rates, calculate total hours and pay  
- **1.5 Output Parsing:** Parse AI JSON output to structured data  
- **1.6 Data Append:** Append calculated payroll data to Google Sheet  

---

### 2. Block-by-Block Analysis

#### 2.1 Schedule Trigger & Task Retrieval

**Overview:**  
This block initiates the workflow on a set schedule (weekly) and retrieves all tasks from a specified Dartboard using the Dart API.

**Nodes Involved:**  
- Schedule Trigger  
- List tasks

**Node Details:**  

- **Schedule Trigger**  
  - *Type:* scheduleTrigger  
  - *Role:* Starts the workflow weekly at 7 AM  
  - *Configuration:* Interval set to every 1 week, trigger hour at 7  
  - *Connections:* Output → List tasks  
  - *Edge Cases:* Missed triggers if n8n server down; time zone considerations  
  - *Version:* 1.2  

- **List tasks**  
  - *Type:* dart (n8n-nodes-dart.dart)  
  - *Role:* Fetches task list from Dartboard  
  - *Configuration:* Resource = Task, Operation = List Tasks, Dartboard ID set to target board  
  - *Credential:* Dart API credentials named "Sam-Test-Acc"  
  - *Input:* Trigger from Schedule Trigger  
  - *Output:* JSON array of tasks  
  - *Edge Cases:* API auth failure, network timeout, empty task lists  
  - *Version:* 1  

---

#### 2.2 Rate Card Retrieval

**Overview:**  
This block retrieves the rate card data (assignee names and hourly rates) from a Google Sheet.

**Nodes Involved:**  
- Get row(s) in sheet

**Node Details:**  

- **Get row(s) in sheet**  
  - *Type:* googleSheets  
  - *Role:* Reads all rows from the configured Google Sheet containing rate card data  
  - *Configuration:* Document ID and Sheet name set to specific Google Sheet (gid=0)  
  - *Credential:* Google Sheets OAuth2 API account  
  - *Input:* Output from List tasks  
  - *Output:* JSON array of rows with rate card data  
  - *Edge Cases:* API limit exceeded, permission denied, empty sheet  
  - *Version:* 4.7  

---

#### 2.3 Data Aggregation

**Overview:**  
This block prepares the data by aggregating all fetched spreadsheet rows into a single data structure for AI processing.

**Nodes Involved:**  
- Aggregate

**Node Details:**  

- **Aggregate**  
  - *Type:* aggregate  
  - *Role:* Aggregates all rows from the spreadsheet into one combined dataset  
  - *Configuration:* Aggregate all item data without additional filters  
  - *Input:* Rows from Get row(s) in sheet  
  - *Output:* Single aggregated JSON data object for AI input  
  - *Edge Cases:* Empty input data, aggregation errors  
  - *Version:* 1  

---

#### 2.4 AI Payroll Calculation

**Overview:**  
This block uses a Google Gemini AI agent to analyze the rate card and Dart tasks, filter completed tasks, sum hours, calculate pay, and output aggregated payroll data as JSON.

**Nodes Involved:**  
- AI SCANNER (Google Gemini LM Chat)  
- Assignee & Time Scanner (Langchain Agent)

**Node Details:**  

- **AI SCANNER**  
  - *Type:* lmChatGoogleGemini  
  - *Role:* Provides foundational AI model access (Gemini Flash Latest)  
  - *Configuration:* Model name set to "models/gemini-flash-latest"  
  - *Credential:* Google Palm API account  
  - *Input:* None directly; output connected to Assignee & Time Scanner AI role  
  - *Output:* AI language model context for agent  
  - *Edge Cases:* API quota, rate-limiting, auth errors  
  - *Version:* 1  

- **Assignee & Time Scanner**  
  - *Type:* langchain.agent  
  - *Role:* Main AI agent that processes inputs to calculate payroll  
  - *Configuration:*  
    - Custom prompt instructs it to:  
      - Analyze Rate Card for assignees and rates  
      - Analyze Task Logs for "Done" tasks only, with fuzzy matching of assignee names  
      - Sum durations, convert minutes to hours  
      - Calculate total pay per assignee  
      - Output strictly valid JSON array with fields: Name, TotalHours, TotalPay, DateCalculated  
    - Inputs embedded via expressions referencing previous nodes:  
      - Rate Card JSON from aggregated spreadsheet data  
      - Dart task list JSON from List tasks node  
      - Current date for DateCalculated field  
  - *Input:* AI SCANNER (language model context)  
  - *Output:* Raw JSON string as AI output  
  - *Edge Cases:* AI model misinterpretation, invalid JSON output, API timeouts  
  - *Version:* 3  

---

#### 2.5 Output Parsing

**Overview:**  
This block cleans and parses the AI agent's raw JSON output string into a structured JSON object suitable for further processing.

**Nodes Involved:**  
- Parse Output

**Node Details:**  

- **Parse Output**  
  - *Type:* code  
  - *Role:* JavaScript code node to clean AI output of markdown artifacts and parse JSON  
  - *Configuration:*  
    - Removes leading/trailing triple backticks (``` or ```json) if present  
    - Tries parsing JSON; throws error if parsing fails with detailed message  
  - *Input:* Raw AI output string from Assignee & Time Scanner  
  - *Output:* Parsed JSON array of payroll objects  
  - *Edge Cases:* Malformed AI output, parsing exceptions  
  - *Version:* 2  

---

#### 2.6 Data Append

**Overview:**  
This block appends the parsed payroll data as new rows into the target Google Sheet for record-keeping and further use.

**Nodes Involved:**  
- Append row in sheet

**Node Details:**  

- **Append row in sheet**  
  - *Type:* googleSheets  
  - *Role:* Appends calculated payroll entries to the Google Sheet  
  - *Configuration:*  
    - Document ID and Sheet name set to the same sheet as rate card  
    - Columns mapped automatically to Name, HourlyRate, TotalHours, TotalPay, Currency, Status  
  - *Credential:* Google Sheets OAuth2 API account  
  - *Input:* Parsed JSON payroll array from Parse Output node  
  - *Edge Cases:* API quota, permission issues, schema mismatch  
  - *Version:* 4.7  

---

### 3. Summary Table

| Node Name           | Node Type                         | Functional Role                     | Input Node(s)          | Output Node(s)           | Sticky Note                                                                                                                                            |
|---------------------|----------------------------------|-----------------------------------|-----------------------|--------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger     | scheduleTrigger                  | Initiates workflow on weekly timer | -                     | List tasks               | ## 1. Workflow launch through schedule; Triggered by a preferred schedule; Scans Dartboard tasks to identify done tasks with time logs                  |
| List tasks          | n8n-nodes-dart.dart              | Fetch tasks from Dartboard         | Schedule Trigger       | Get row(s) in sheet      | ## 1. Workflow launch through schedule; Scans Dartboard tasks to identify done tasks with time logs                                                    |
| Get row(s) in sheet | googleSheets                    | Retrieve rate card from Google Sheet | List tasks             | Aggregate                | ## 2. Gathering of data in the target Spreadsheet; Scans spreadsheet for assignee names and hourly rates                                               |
| Aggregate            | aggregate                       | Aggregate spreadsheet rows for AI   | Get row(s) in sheet    | Assignee & Time Scanner  | ## 2. Gathering of data in the target Spreadsheet; Scans spreadsheet for assignee names and hourly rates                                               |
| AI SCANNER           | lmChatGoogleGemini              | Provides AI model context           | -                     | Assignee & Time Scanner  | ## 3. AI time tracking calculator agent; Calculates payroll based on completed tasks and rates                                                        |
| Assignee & Time Scanner | langchain.agent               | AI agent for payroll calculation    | Aggregate, AI SCANNER  | Parse Output             | ## 3. AI time tracking calculator agent; Calculates payroll based on completed tasks and rates                                                        |
| Parse Output         | code                           | Parses AI output string to JSON     | Assignee & Time Scanner| Append row in sheet      | ## 4. Parsing the AI output; Converts AI string output into structured JSON                                                                             |
| Append row in sheet  | googleSheets                    | Append payroll data to Google Sheet | Parse Output           | -                        | ## 5. Push output into the target Spreadsheet; Output each assignee with total hours, pay, and calculation date                                         |
| Sticky Note          | stickyNote                     | Documentation and instructions      | -                     | -                        | ## Task-YOUR_OPENAI_KEY_HERE Assignee billing via Time Tracking; Overview, setup, and customization instructions                                       |
| Sticky Note1         | stickyNote                     | Documentation                      | -                     | -                        | ## 1. Workflow launch through schedule; Explains task scanning step                                                                                     |
| Sticky Note2         | stickyNote                     | Documentation                      | -                     | -                        | ## 2. Gathering of data in the target Spreadsheet; Explains spreadsheet data fetching                                                                 |
| Sticky Note3         | stickyNote                     | Documentation                      | -                     | -                        | ## 3. AI time tracking calculator agent; Explains AI calculation step                                                                                   |
| Sticky Note4         | stickyNote                     | Documentation                      | -                     | -                        | ## 4. Parsing the AI output; Explains JSON parsing step                                                                                                |
| Sticky Note5         | stickyNote                     | Documentation                      | -                     | -                        | ## 5. Push output into the target Spreadsheet; Explains appending payroll data                                                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: `scheduleTrigger`  
   - Set interval to trigger weekly at 7 AM  
   - No credentials needed  

2. **Create List tasks Node**  
   - Type: `n8n-nodes-dart.dart`  
   - Resource: Task  
   - Operation: List Tasks  
   - Parameters: Set Dartboard ID to your target Dartboard (replace dummy value)  
   - Credentials: Select or create Dart API credentials with access to your Dartboard  
   - Connect Schedule Trigger output to this node input  

3. **Create Get row(s) in sheet Node**  
   - Type: `googleSheets`  
   - Operation: Get Rows  
   - Parameters:  
     - Document ID: Your Google Spreadsheet ID containing rate card data  
     - Sheet Name: Set to the appropriate sheet or gid (usually "Sheet1" or gid=0)  
   - Credentials: Configure Google Sheets OAuth2 credentials with read access  
   - Connect output from List tasks to this node  

4. **Create Aggregate Node**  
   - Type: `aggregate`  
   - Parameters: Aggregate all item data without filters  
   - Connect output from Get row(s) in sheet to Aggregate input  

5. **Create AI SCANNER Node**  
   - Type: `lmChatGoogleGemini` (Google Gemini model node)  
   - Parameters: Model name = "models/gemini-flash-latest"  
   - Credentials: Google Palm API credentials with Gemini access  
   - No direct input connection (used as language model provider)  

6. **Create Assignee & Time Scanner Node**  
   - Type: `langchain.agent`  
   - Parameters:  
     - Prompt with detailed instructions for AI to:  
       - Analyze Rate Card (Input A) from aggregated spreadsheet data  
       - Analyze Task Logs (Input B) from Dart tasks (use fuzzy matching and filter by status "Done")  
       - Calculate total hours (convert minutes to decimal hours)  
       - Calculate total pay per assignee based on hourly rate  
       - Use current date (Input C) for DateCalculated field  
       - Output strictly valid JSON array with fields Name, TotalHours, TotalPay, DateCalculated  
     - Use expressions to inject:  
       - `{{ JSON.stringify($json.data) }}` from Aggregate node for Rate Card  
       - `{{ JSON.stringify($('List tasks').item.json.results) }}` from List tasks node for Task Logs  
       - `{{ $now.toFormat('yyyy-MM-dd') }}` for current date  
   - Credentials: Use the same Google Palm API credentials as AI SCANNER  
   - Connect AI SCANNER output to this node's language model input  
   - Connect Aggregate node output to this node as data input  

7. **Create Parse Output Node**  
   - Type: `code`  
   - Parameters: Use provided JavaScript code to remove markdown formatting and parse JSON output  
   - Connect output from Assignee & Time Scanner to this node  

8. **Create Append row in sheet Node**  
   - Type: `googleSheets`  
   - Operation: Append Rows  
   - Parameters:  
     - Document ID and Sheet Name: Same as rate card sheet  
     - Columns: Name, HourlyRate, TotalHours, TotalPay, Currency, Status  
     - Enable auto mapping from input data  
   - Credentials: Same Google Sheets OAuth2 credentials as before  
   - Connect output from Parse Output node to this node  

9. **Optional: Create Sticky Notes**  
   - Add sticky notes near corresponding nodes to provide documentation and setup instructions as per original workflow  

10. **Save and Activate Workflow**  
    - Test each step individually to ensure proper data flow and error handling  
    - Schedule workflow to run as needed  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                             | Context or Link                                                                                                             |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| This workflow requires you to have a Google Sheet with exact headers: `Name`, `HourlyRate`, `TotalHours`, `TotalPay`, `DateCalculated`. Pre-fill `Name` and `HourlyRate` columns to match Dart assignee names exactly.                     | Setup instructions in Sticky Note                                                                                           |
| Replace the dummy Dartboard ID in the List tasks node with your actual Dartboard ID where tasks are tracked.                                                                                                                            | https://help.dartai.com/en/articles/12313191-n8n-integration                                                                |
| AI parameters and prompt can be customized to fit different billing rules or task filtering.                                                                                                                                              | AI prompt in "Assignee & Time Scanner" node                                                                                  |
| For optimal accuracy, ensure the Dart task statuses are consistent and that task durations are reliably recorded in Dart.                                                                                                               | Workflow assumptions                                                                                                         |
| The workflow uses Google Gemini AI (PaLM) through n8n's Langchain integration, providing advanced natural language understanding for payroll calculations.                                                                             | Requires Google Palm API credentials                                                                                         |
| Consider adding error handling or alerting (e.g., email node) for failures such as API limits, authentication errors, or JSON parsing exceptions to ensure robustness.                                                                   | Recommended best practice for production workflows                                                                           |

---

**Disclaimer:** The provided text is exclusively generated from an automated n8n workflow. It complies strictly with current content policies and contains no illegal, offensive, or protected material. All handled data is legal and public.