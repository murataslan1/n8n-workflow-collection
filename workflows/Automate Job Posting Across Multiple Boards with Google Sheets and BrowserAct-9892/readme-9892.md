Automate Job Posting Across Multiple Boards with Google Sheets and BrowserAct

https://n8nworkflows.xyz/workflows/automate-job-posting-across-multiple-boards-with-google-sheets-and-browseract-9892


# Automate Job Posting Across Multiple Boards with Google Sheets and BrowserAct

### 1. Workflow Overview

This workflow automates the posting of job listings across multiple job boards by integrating Google Sheets as the control panel and BrowserAct for browser automation. It targets HR teams or recruiters who maintain job data in Google Sheets and want to automate posting jobs to various online job boards without manual data entry on each site.

The workflow is logically divided into three main blocks:

- **1.1 Input Reception & Trigger Control:** Listens for real-time updates to Google Sheets rows or manual execution to fetch job data for posting.
- **1.2 Browser Automation Engine:** Uses BrowserAct nodes to log in and post job details on target job boards automatically.
- **1.3 Feedback Loop & Sheet Update:** Parses the automation results, updates the Google Sheet with posting status and live URL, and sends Slack notifications.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Trigger Control

**Overview:**  
This block receives input either from a manual trigger or a Google Sheets trigger listening for row updates. It fetches job data rows from a specified Google Sheet and filters only those with a "Ready to Post" status.

**Nodes Involved:**  
- When clicking ‘Execute workflow’ (Manual Trigger)  
- Google Sheets Trigger  
- Get row(s) in sheet (Google Sheets)  
- If (Conditional filter)  
- Sticky Note - Input & Triggers (Documentation)

**Node Details:**

- **When clicking ‘Execute workflow’**  
  - Type: Manual Trigger  
  - Role: Allows manual initiation of the workflow to process all jobs in the sheet.  
  - Config: No parameters.  
  - Input: None  
  - Output: Triggers "Get row(s) in sheet".  
  - Edge Cases: None.  
  - Notes: Enables batch processing, useful for bulk posting.

- **Google Sheets Trigger**  
  - Type: Google Sheets Trigger  
  - Role: Watches for updates to rows in the Google Sheet, triggering the workflow for the specific updated row.  
  - Config: Monitors the "Job Example" sheet (gid: 1104319058) in the specified Google Sheets document. Polls every minute.  
  - Credentials: Google Sheets Trigger OAuth2 (user-specific).  
  - Input: Triggered on row update event.  
  - Output: Passes updated row data downstream.  
  - Edge Cases: Possible delays due to polling; failures due to auth errors.

- **Get row(s) in sheet**  
  - Type: Google Sheets  
  - Role: Retrieves job rows from the Google Sheet for processing.  
  - Config: Reads all rows from "Job Example" sheet in the specified document.  
  - Credentials: Google Sheets OAuth2.  
  - Input: Trigger from manual or Google Sheets trigger.  
  - Output: Array of job row objects.  
  - Edge Cases: API quota limits, permission errors.

- **If**  
  - Type: Conditional (If node)  
  - Role: Filters jobs to process only those with `Posting_Status` equal to "Ready to Post".  
  - Config: Checks `$json.Posting_Status == "Ready to Post"`.  
  - Input: Job row(s) from "Get row(s) in sheet".  
  - Output: Passes filtered rows to BrowserAct automation.  
  - Edge Cases: Potential for misformatted status strings; case sensitivity.

- **Sticky Note - Input & Triggers**  
  - Type: Sticky Note  
  - Role: Documentation on input methods and trigger logic.  
  - Content: Explains manual and automatic triggers and the role of the If node.

---

#### 2.2 Browser Automation Engine

**Overview:**  
This block executes the core automation using BrowserAct to post jobs on target job boards. It sends job information and login credentials to a BrowserAct workflow template, waits for the task to complete, and fetches the task's result.

**Nodes Involved:**  
- Run a workflow task (BrowserAct)  
- Get details of a workflow task (BrowserAct)  
- Sticky Note - Automation Core (Documentation)

**Node Details:**

- **Run a workflow task**  
  - Type: BrowserAct workflow node  
  - Role: Executes a BrowserAct workflow that automates job posting on a specified job board.  
  - Config:  
    - Workflow ID set to a BrowserAct workflow named "Automated Job Posting to Niche Job Site (Custom Site)".  
    - Inputs mapped from Google Sheet columns including: Target_Site (Job_Board_URL), Job_Title, Job_Description, Phone_Number, Address, tags, Company, Login_Username, Login_Password.  
    - Does not save browser data after execution.  
  - Credentials: BrowserAct API.  
  - Input: Filtered job row JSON.  
  - Output: Task ID and initial task metadata.  
  - Edge Cases: Auth failures, workflow execution errors, network timeouts.

- **Get details of a workflow task**  
  - Type: BrowserAct workflow node  
  - Role: Polls and waits for the BrowserAct task to finish, retrieving detailed results of the automation run.  
  - Config: Uses the task ID from the previous node, waits synchronously for task completion (`waitForFinish: true`), continues on error without stopping workflow.  
  - Credentials: BrowserAct API.  
  - Input: Task ID from "Run a workflow task".  
  - Output: Detailed task result including status and output data.  
  - Edge Cases: Task may fail or timeout; node configured to continue on error.

- **Sticky Note - Automation Core**  
  - Type: Sticky Note  
  - Role: Documentation describing the BrowserAct nodes and their role in automating job posting.

---

#### 2.3 Feedback Loop & Sheet Update

**Overview:**  
This block parses the BrowserAct task results, updates the Google Sheet row with the job’s live URL and updated status, and sends Slack alerts to notify the team about the posting results or errors.

**Nodes Involved:**  
- If1 (Conditional)  
- Code in JavaScript  
- Update row in sheet (Google Sheets)  
- Send a message (Slack)  
- Send a message1 (Slack)  
- Sticky Note - Feedback Loop (Documentation)

**Node Details:**

- **If1**  
  - Type: Conditional (If node)  
  - Role: Checks if the BrowserAct task output string is non-empty (indicating success).  
  - Config: Evaluates whether `$json.output.string` is not empty.  
  - Input: Task details JSON from "Get details of a workflow task".  
  - Output:  
    - True branch for successful output (goes to Code).  
    - False branch for failure (goes to error Slack notification).  
  - Edge Cases: Output might be undefined or empty due to task failure.

- **Code in JavaScript**  
  - Type: Code node (JavaScript)  
  - Role: Parses the JSON string from BrowserAct output to extract job posting details and transforms it into n8n items.  
  - Config:  
    - Reads JSON string from `$input.first().json.output.string`.  
    - Throws errors if missing or malformed.  
    - Returns an array of JSON objects representing parsed data.  
  - Input: Successful BrowserAct output string.  
  - Output: Parsed job posting info as new items for updating the sheet.  
  - Edge Cases: JSON parsing errors, empty or malformed data.

- **Update row in sheet**  
  - Type: Google Sheets  
  - Role: Updates the original row in Google Sheets with the new `Status` (e.g., "Posted") and `Live_URL` from the parsed BrowserAct output.  
  - Config:  
    - Matches rows by `Job_ID`.  
    - Updates columns: Job_ID (unchanged), Status, Live_URL.  
    - Writes to the same "Job Example" sheet.  
  - Credentials: Google Sheets OAuth2.  
  - Input: Parsed job posting data from Code node.  
  - Output: Updated row confirmation.  
  - Edge Cases: Matching errors, API write failures.

- **Send a message**  
  - Type: Slack  
  - Role: Sends a Slack message notifying that the job posting was successful with job ID and status.  
  - Config:  
    - Sends to channel "all-browseract-workflow-test".  
    - Message includes Job_ID and Status dynamically from data.  
  - Credentials: Slack OAuth2.  
  - Input: Output from "Update row in sheet".  
  - Edge Cases: Slack API failures, invalid channel.

- **Send a message1**  
  - Type: Slack  
  - Role: Sends an error notification to Slack if the BrowserAct task failed or output was empty.  
  - Config:  
    - Sends to same Slack channel.  
    - Message includes job ID and error instructions.  
  - Credentials: Slack OAuth2.  
  - Input: Error branch from "Get details of a workflow task" or failed condition from "If1".  
  - Edge Cases: Same as above.

- **Sticky Note - Feedback Loop**  
  - Type: Sticky Note  
  - Role: Describes the feedback mechanism including parsing results, updating Google Sheets, and sending alerts.

---

### 3. Summary Table

| Node Name                    | Node Type                      | Functional Role                                   | Input Node(s)                  | Output Node(s)                 | Sticky Note                                                                                                                                    |
|------------------------------|--------------------------------|-------------------------------------------------|-------------------------------|-------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                 | Manual start of workflow to batch process jobs   | None                          | Get row(s) in sheet            | See Sticky Note - Input & Triggers                                                                                                             |
| Google Sheets Trigger          | Google Sheets Trigger          | Automatically triggers workflow on row update    | None                          | Get row(s) in sheet            | See Sticky Note - Input & Triggers                                                                                                             |
| Get row(s) in sheet           | Google Sheets                  | Reads job rows from Google Sheet                  | Manual Trigger, Sheets Trigger | If                            | See Sticky Note - Input & Triggers                                                                                                             |
| If                           | Conditional (If)               | Filters rows where Posting_Status = 'Ready to Post' | Get row(s) in sheet           | Run a workflow task            | See Sticky Note - Input & Triggers                                                                                                             |
| Run a workflow task           | BrowserAct workflow            | Starts BrowserAct automation to post job          | If                            | Get details of a workflow task | See Sticky Note - Automation Core                                                                                                              |
| Get details of a workflow task | BrowserAct workflow            | Waits for BrowserAct task completion               | Run a workflow task            | If1, Send a message1           | See Sticky Note - Automation Core                                                                                                              |
| If1                          | Conditional (If)               | Checks if BrowserAct output is valid               | Get details of a workflow task | Code in JavaScript, Send a message1 | See Sticky Note - Feedback Loop                                                                                                                |
| Code in JavaScript           | Code                          | Parses BrowserAct JSON output string                | If1 (true)                    | Update row in sheet            | See Sticky Note - Feedback Loop                                                                                                                |
| Update row in sheet          | Google Sheets                  | Updates job row with posting status and live URL  | Code in JavaScript            | Send a message                 | See Sticky Note - Feedback Loop                                                                                                                |
| Send a message               | Slack                         | Sends success notification to Slack channel       | Update row in sheet           | None                          | See Sticky Note - Feedback Loop                                                                                                                |
| Send a message1              | Slack                         | Sends error notification to Slack channel         | Get details of a workflow task, If1 (false) | None                          | See Sticky Note - Feedback Loop                                                                                                                |
| Sticky Note - Intro          | Sticky Note                   | Introductory documentation                         | None                          | None                          | Contains overview and usage instructions                                                                                                      |
| Sticky Note - How to Use     | Sticky Note                   | Step-by-step user instructions                      | None                          | None                          | Detailed instructions for credentials and setup                                                                                               |
| Sticky Note - Need Help      | Sticky Note                   | Help resources and video links                      | None                          | None                          | Contains multiple helpful video tutorial links                                                                                                |
| Sticky Note - Input & Triggers | Sticky Note                   | Documentation on triggers and input methods        | None                          | None                          | See section 2.1                                                                                                                                |
| Sticky Note - Automation Core | Sticky Note                   | Documentation on BrowserAct automation nodes       | None                          | None                          | See section 2.2                                                                                                                                |
| Sticky Note - Feedback Loop  | Sticky Note                   | Documentation on feedback and update logic          | None                          | None                          | See section 2.3                                                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: Allows manual workflow start.

2. **Create Google Sheets Trigger Node**  
   - Type: Google Sheets Trigger  
   - Set event to `rowUpdate`.  
   - Configure to poll every minute.  
   - Select the Google Sheets document by ID and the sheet tab "Job Example" (gid: 1104319058).  
   - Authenticate with Google Sheets Trigger OAuth2 credentials.

3. **Create Google Sheets Node "Get row(s) in sheet"**  
   - Operation: Read rows.  
   - Configure to the same Google Sheets document and sheet as the trigger.  
   - Authenticate with Google Sheets OAuth2 credentials.  
   - Connect outputs of Manual Trigger and Google Sheets Trigger to this node.

4. **Add an If Node for Filtering**  
   - Condition: Check if field `Posting_Status` equals `"Ready to Post"`.  
   - Connect output of "Get row(s) in sheet" to this If node.

5. **Create BrowserAct Node "Run a workflow task"**  
   - Operation: Run workflow task.  
   - Set Workflow ID to the BrowserAct workflow "Automated Job Posting to Niche Job Site (Custom Site)".  
   - Map inputs from Google Sheet columns:  
     - Target_Site = ` Job_Board_URL`  
     - Job_Title = `Job_Title`  
     - Job_Description = `Job_Description`  
     - Phone_Number = `Phone_Number`  
     - Address = `Address`  
     - tags = `tags`  
     - Company = `Company`  
     - Login_Username = `Login_Username`  
     - Login_Password = `Login_Password`  
   - Disable saving browser data.  
   - Authenticate with BrowserAct API credentials.  
   - Connect the True output of If node to this node.

6. **Create BrowserAct Node "Get details of a workflow task"**  
   - Operation: Get task details.  
   - Set Task ID dynamically to the output task ID from the previous node.  
   - Set to wait for task finish (`waitForFinish: true`).  
   - Set error handling to "Continue on error".  
   - Authenticate with BrowserAct API credentials.  
   - Connect output of "Run a workflow task" to this node.

7. **Add If Node "If1" to Validate BrowserAct Output**  
   - Condition: Check that `output.string` is not empty.  
   - Connect output of "Get details of a workflow task" to this node.

8. **Create Code Node "Code in JavaScript"**  
   - Paste the provided JavaScript code that parses the JSON string from BrowserAct output, validates it, and converts it into an array of n8n items.  
   - Connect True output of "If1" to this node.

9. **Create Google Sheets Node "Update row in sheet"**  
   - Operation: Update a row.  
   - Target the same Google Sheets document and sheet.  
   - Set matching column as `Job_ID`.  
   - Update columns:  
     - Job_ID (unchanged)  
     - Status (from parsed data)  
     - Live_URL (from parsed data)  
   - Authenticate with Google Sheets OAuth2 credentials.  
   - Connect output of Code node to this node.

10. **Create Slack Node "Send a message"**  
    - Operation: Send a message to Slack channel `"all-browseract-workflow-test"`.  
    - Configure message text with job ID and status from updated Google Sheet row.  
    - Authenticate with Slack OAuth2 credentials.  
    - Connect output of "Update row in sheet" to this node.

11. **Create Slack Node "Send a message1"**  
    - Operation: Send error message to the same Slack channel.  
    - Configure with static message indicating error for the job ID.  
    - Authenticate with Slack OAuth2 credentials.  
    - Connect the False output of "If1" and the error output of "Get details of a workflow task" to this node.

12. **Connect the Manual Trigger node to "Get row(s) in sheet".**

13. **Add Sticky Notes** for documentation at appropriate positions:  
    - Intro, How to Use, Need Help, Input & Triggers, Automation Core, Feedback Loop.

14. **Final Workflow Activation:**  
    - Enable the Google Sheets Trigger node for automatic operation.  
    - Ensure all credentials (Google Sheets OAuth2, Google Sheets Trigger OAuth2, BrowserAct API, Slack OAuth2) are correctly configured.

---

### 5. General Notes & Resources

| Note Content                                                                                                                        | Context or Link                                                                                     |
|------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| This workflow uses a BrowserAct template named **“Automated Job Posting to Niche Job Site (Custom Site)”** for job posting automation. | BrowserAct workflow template requirement.                                                         |
| Join the BrowserAct Discord for support and community: [Discord](https://discord.com/invite/UpnCKd7GaU)                             | Support community for BrowserAct and n8n users.                                                   |
| Visit BrowserAct Blog for tutorials and updates: [BrowserAct Blog](https://www.browseract.com/blog)                                 | Official blog with additional resources.                                                          |
| Helpful video tutorials on configuring BrowserAct and n8n integration:                                                               |                                                                                                   |
| - How to Find Your BrowseAct API Key & Workflow ID: https://www.youtube.com/watch?v=pDjoZWEsZlE                                      |                                                                                                   |
| - How to Connect n8n to Browseract: https://www.youtube.com/watch?v=RoYMdJaRdcQ                                                     |                                                                                                   |
| - How to Use & Customize BrowserAct Templates: https://www.youtube.com/watch?v=CPZHFUASncY                                           |                                                                                                   |
| - How to Use the BrowserAct N8N Community Node: https://youtu.be/j0Nlba2pRLU                                                       |                                                                                                   |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This process strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.