Automate YP.com Directory Scraping to Google Sheets using BrowserAct

https://n8nworkflows.xyz/workflows/automate-yp-com-directory-scraping-to-google-sheets-using-browseract-9889


# Automate YP.com Directory Scraping to Google Sheets using BrowserAct

---

### 1. Workflow Overview

This workflow automates the process of scraping local business directory data from YP.com (Yellow Pages) using BrowserAct, then processes and saves the extracted leads directly into a Google Sheet. It is designed primarily for lead generation use cases where users want to gather business contact information by category and location and maintain an up-to-date spreadsheet.

The workflow logically divides into three main blocks:

- **1.1 Trigger & Scraping Initiation:** Starts the workflow manually and launches a BrowserAct scraping task with specified inputs (business category and location).
- **1.2 Scraping Completion & Data Parsing:** Waits for the scraping task to finish, retrieves the scraped raw data, and parses the JSON string output into individual structured items.
- **1.3 Data Storage:** Appends or updates rows in a Google Sheet with the parsed business leads, ensuring no duplicate entries by matching on company name.

Supporting these blocks are informational sticky notes that provide user guidance, instructions, and help resources.

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger & Scraping Initiation

**Overview:**  
This block initiates the workflow manually and triggers the BrowserAct scraping task using predefined search parameters (business category and city). It sends these inputs to a BrowserAct workflow that performs the actual web scraping on YP.com.

**Nodes Involved:**  
- When clicking ‘Execute workflow’ (Manual Trigger)  
- Run a workflow task (BrowserAct)

**Node Details:**  

- **When clicking ‘Execute workflow’**  
  - *Type:* Manual Trigger node  
  - *Role:* Starts the workflow execution manually. No parameters needed.  
  - *Input:* None (trigger)  
  - *Output:* Triggers the next node to start the scraping task  
  - *Edge Cases:* None significant; user must trigger workflow manually or replace with scheduled trigger.  

- **Run a workflow task**  
  - *Type:* BrowserAct Workflows node  
  - *Role:* Initiates a BrowserAct scraping workflow with input parameters specifying what to scrape.  
  - *Configuration:*  
    - `workflowId` set to the BrowserAct workflow ID for the YP.com scraper.  
    - Input parameters:  
      - `business_category` = "dentists"  
      - `city_location` = "Brooklyn"  
    - `saveBrowserData` = false (browser data not saved after task)  
  - *Credentials:* Uses BrowserAct API credentials.  
  - *Input:* Trigger from manual start node  
  - *Output:* Passes task ID to the next node for monitoring scraping status  
  - *Edge Cases:*  
    - Invalid workflow ID or API credentials may cause authentication errors.  
    - Incorrect or missing input parameters may cause scraping to fail or return no results.  
  - *Version Requirements:* BrowserAct node version 1 used.

---

#### 2.2 Scraping Completion & Data Parsing

**Overview:**  
This block monitors the scraping task until completion, retrieves the raw data output, then parses the JSON string into individual business lead items for downstream processing.

**Nodes Involved:**  
- Get details of a workflow task (BrowserAct)  
- Code in JavaScript

**Node Details:**  

- **Get details of a workflow task**  
  - *Type:* BrowserAct Workflows node  
  - *Role:* Polls the BrowserAct API to check the scraping task status, waiting until it completes or a max wait time is reached.  
  - *Configuration:*  
    - `taskId` dynamically set from previous node output (`={{ $json.id }}`)  
    - Operation: `getTask`  
    - `maxWaitTime`: 600 seconds (10 minutes)  
    - `waitForFinish`: true (poll until complete)  
    - `pollingInterval`: 20 seconds  
  - *Credentials:* BrowserAct API credentials  
  - *Input:* Task ID from Run a workflow task node  
  - *Output:* Scraping result JSON string in `output.string`  
  - *Edge Cases:*  
    - Timeout if task exceeds 10 minutes.  
    - Task failure or cancellation may cause missing or incomplete data.  
    - API errors or rate limits can cause polling failure.  

- **Code in JavaScript**  
  - *Type:* Code node (JavaScript)  
  - *Role:* Parses the raw JSON string from scraping output into separate n8n items for each business lead.  
  - *Configuration:*  
    - Reads JSON string from `input.first().json.output.string`.  
    - Validates string exists; throws error if missing.  
    - Tries to parse JSON string; throws error on malformed JSON.  
    - Checks parsed data is an array; throws error if not.  
    - Maps each array element to `{json: item}` format to split into individual items.  
    - Returns array of items for next node.  
  - *Key Expressions:*  
    - `$input.first().json.output.string`  
  - *Input:* JSON string from previous node  
  - *Output:* Array of parsed business lead objects as separate items  
  - *Edge Cases:*  
    - Missing or empty scraping output string.  
    - Malformed JSON causing parse failure.  
    - Non-array JSON output.  
    - Unexpected data structure changes from BrowserAct scraper.  
  - *Version Requirements:* Code node version 2 (JavaScript ES6+).

---

#### 2.3 Data Storage

**Overview:**  
This final block appends or updates the structured business leads into a specified Google Sheet, using company name as the matching key to avoid duplicate entries.

**Nodes Involved:**  
- Append or update row in sheet (Google Sheets)

**Node Details:**  

- **Append or update row in sheet**  
  - *Type:* Google Sheets node  
  - *Role:* Inserts or updates rows in a Google Sheet with business lead data.  
  - *Configuration:*  
    - Operation: `appendOrUpdate`  
    - Spreadsheet document: ID `18sw7io0yJOTDzvcknGmjBBqtK154CLk3k0FoWJZbfI0`  
    - Sheet name by GID: 512924235 (named "Online Directory Lead Scraper (YP.com)")  
    - Mapping columns:  
      - Company Name → `Name` from JSON  
      - Category → `Business`  
      - Phone Number → `Phone`  
      - Address → `Location`  
    - Matching column: `Company Name` (to prevent duplicates)  
    - Type conversion disabled (keeps data as strings)  
  - *Credentials:* Google Sheets OAuth2 credentials  
  - *Input:* Individual parsed business lead items from Code node  
  - *Output:* Confirmation of row append/update  
  - *Edge Cases:*  
    - Invalid or expired Google OAuth2 credentials cause authorization errors.  
    - Sheet or document ID errors cause failed writes.  
    - Data format mismatches may cause incorrect or missing data in sheet.  
  - *Version Requirements:* Google Sheets node version 4.7 used.

---

#### 2.4 Supporting Sticky Notes

**Overview:**  
Sticky notes provide user instructions, explanations, and helpful links covering the workflow’s purpose, usage, and troubleshooting resources.

**Nodes Involved:**  
- Sticky Note - Intro  
- Sticky Note - How to Use  
- Sticky Note - Need Help  
- Sticky Note - Scraping Stage  
- Sticky Note - Processing Stage  
- Sticky Note - Output Stage  
- Sticky Note - Need Help1

**Details:**  
- These nodes contain markdown content describing workflow steps, setup instructions, tips for modifying parameters, and links to BrowserAct and n8n community resources and videos.  
- Positioned visually for easy reference alongside functional nodes.

---

### 3. Summary Table

| Node Name                      | Node Type                     | Functional Role                               | Input Node(s)                  | Output Node(s)                   | Sticky Note                                                                                                   |
|-------------------------------|-------------------------------|-----------------------------------------------|--------------------------------|---------------------------------|---------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                | Starts the workflow manually                    | None                           | Run a workflow task             |                                                                                                               |
| Run a workflow task            | BrowserAct Workflows           | Launches BrowserAct scraping task               | When clicking ‘Execute workflow’ | Get details of a workflow task  | Sticky Note - Scraping Stage: explains starting scraping job and inputs                                         |
| Get details of a workflow task | BrowserAct Workflows           | Polls for scraping task completion              | Run a workflow task            | Code in JavaScript              | Sticky Note - Scraping Stage: explains waiting for task completion                                             |
| Code in JavaScript             | Code Node (JavaScript)         | Parses raw JSON string to individual items       | Get details of a workflow task | Append or update row in sheet   | Sticky Note - Processing Stage: explains parsing and splitting JSON string                                     |
| Append or update row in sheet  | Google Sheets                  | Saves or updates business leads in Google Sheet | Code in JavaScript             | None                          | Sticky Note - Output Stage: explains appendOrUpdate operation and duplicate prevention                          |
| Sticky Note - Intro            | Sticky Note                   | Provides workflow overview and requirements      | None                           | None                          | Contains detailed introduction and usage overview                                                             |
| Sticky Note - How to Use       | Sticky Note                   | Gives step-by-step usage instructions             | None                           | None                          | Instructions on credentials setup, custom parameters, and activation                                          |
| Sticky Note - Need Help        | Sticky Note                   | Lists help videos and links                        | None                           | None                          | Contains links to BrowserAct API key, n8n integration, and template customization videos                       |
| Sticky Note - Scraping Stage   | Sticky Note                   | Explains scraping nodes and their role            | None                           | None                          | Covers “Run a workflow task” and “Get details of a workflow task” nodes                                       |
| Sticky Note - Processing Stage | Sticky Note                   | Explains JSON parsing node                          | None                           | None                          | Covers “Code in JavaScript” node                                                                              |
| Sticky Note - Output Stage     | Sticky Note                   | Explains Google Sheets node and data saving        | None                           | None                          | Covers “Append or update row in sheet” node                                                                   |
| Sticky Note - Need Help1       | Sticky Note                   | Provides additional workflow guidance video link  | None                           | None                          | Link to “STOP Manual Leads! Automate Lead Gen with BrowserAct & n8n” YouTube video                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Manual Trigger Node**  
   - Add a **Manual Trigger** node named `When clicking ‘Execute workflow’`.  
   - No configuration needed. This node starts the workflow manually.

2. **Add BrowserAct ‘Run a workflow task’ Node**  
   - Add a **BrowserAct Workflows** node named `Run a workflow task`.  
   - Set `workflowId` to your BrowserAct YP.com scraping workflow ID (e.g., `"56683859462521975"`).  
   - Under `inputParameters`, add parameters:  
     - `business_category` with a default value like `"dentists"`  
     - `city_location` with a default value like `"Brooklyn"`  
   - Set `saveBrowserData` to `false`.  
   - Attach your **BrowserAct API credentials** to this node.  
   - Connect output of `When clicking ‘Execute workflow’` to this node’s input.

3. **Add BrowserAct ‘Get details of a workflow task’ Node**  
   - Add another **BrowserAct Workflows** node named `Get details of a workflow task`.  
   - Set operation to `getTask`.  
   - For `taskId`, use an expression to reference the previous node’s output: `={{ $json.id }}`.  
   - Set `maxWaitTime` to `600` (seconds).  
   - Enable `waitForFinish` to `true`.  
   - Set `pollingInterval` to `20` seconds.  
   - Attach the same **BrowserAct API credentials**.  
   - Connect output of `Run a workflow task` to this node.

4. **Add Code Node to Parse JSON String**  
   - Add a **Code** node named `Code in JavaScript`.  
   - Use JavaScript code that:  
     - Reads the JSON string from `input.first().json.output.string`.  
     - Throws an error if missing or empty.  
     - Parses the string as JSON, throws error if malformed.  
     - Ensures the parsed data is an array.  
     - Maps each element to `{json: item}` format to create separate items.  
   - Connect output of `Get details of a workflow task` to this node.

5. **Add Google Sheets Node to Append or Update Rows**  
   - Add a **Google Sheets** node named `Append or update row in sheet`.  
   - Configure operation as `appendOrUpdate`.  
   - Set the document ID to your target Google Sheet ID (e.g., `"18sw7io0yJOTDzvcknGmjBBqtK154CLk3k0FoWJZbfI0"`).  
   - Select the sheet by GID or name (e.g., GID `512924235` or sheet `"Online Directory Lead Scraper (YP.com)"`).  
   - Define columns mapping:  
     - `Company Name` → `{{$json.Name}}`  
     - `Category` → `{{$json.Business}}`  
     - `Phone Number` → `{{$json.Phone}}`  
     - `Address` → `{{$json.Location}}`  
   - Set matching columns to `Company Name` to avoid duplicates.  
   - Disable type conversion and string conversion options.  
   - Attach **Google Sheets OAuth2 credentials**.  
   - Connect output of `Code in JavaScript` to this node.

6. **(Optional) Add Sticky Notes for User Guidance**  
   - Add sticky notes with instructions, workflow description, and helpful links positioned near relevant nodes.  
   - Include notes on setup, usage instructions, troubleshooting, and external resources.

7. **Test the Workflow**  
   - Manually execute the `When clicking ‘Execute workflow’` trigger node.  
   - Verify the BrowserAct scraping task runs and completes.  
   - Confirm parsed data is correctly split and inserted or updated in Google Sheet.  
   - Adjust `business_category` and `city_location` parameters in the `Run a workflow task` node as needed for different searches.

---

### 5. General Notes & Resources

| Note Content                                                                                                      | Context or Link                                                                                      |
|------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| This n8n template helps you generate local business leads by scraping online directories and saving results to a spreadsheet. | Workflow Introduction in Sticky Note - Intro                                                       |
| Replace the manual trigger with a Cron node to automate periodic scraping jobs.                                   | Usage instructions in Sticky Note - How to Use                                                     |
| Requires active BrowserAct API account and access to the BrowserAct YP.com scraping workflow template.            | Credentials requirement note from Sticky Note - Intro                                              |
| Google Sheets OAuth2 credentials are needed to allow appending data to your spreadsheet.                         | Credentials setup instruction in Sticky Note - How to Use                                          |
| For troubleshooting and learning, several BrowserAct and n8n integration tutorial videos are linked.              | Sticky Note - Need Help and Sticky Note - Need Help1 with YouTube links                            |
| The appendOrUpdate operation with matching on Company Name avoids duplicate entries when re-running the workflow. | Explanation in Sticky Note - Output Stage                                                           |
| Workflow designed to be easily customizable by changing search parameters in 'Run a workflow task' node.          | Parameter customization instructions in Sticky Note - How to Use                                    |
| Visit [BrowserAct Blog](https://www.browseract.com/blog) or join [Discord](https://discord.com/invite/UpnCKd7GaU) for support. | Support resources from Sticky Note - Intro                                                         |
| Video: [STOP Manual Leads! Automate Lead Gen with BrowserAct & n8n](https://www.youtube.com/watch?v=W9BHL7vok6c)   | Additional workflow guidance video linked in Sticky Note - Need Help1                               |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with applicable content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.