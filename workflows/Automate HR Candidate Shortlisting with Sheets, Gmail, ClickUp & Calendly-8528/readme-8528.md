Automate HR Candidate Shortlisting with Sheets, Gmail, ClickUp & Calendly

https://n8nworkflows.xyz/workflows/automate-hr-candidate-shortlisting-with-sheets--gmail--clickup---calendly-8528


# Automate HR Candidate Shortlisting with Sheets, Gmail, ClickUp & Calendly

### 1. Workflow Overview

This workflow automates the shortlisting and progression of HR candidates by integrating Google Sheets, Gmail, ClickUp, and Calendly. It is designed to streamline hiring by automatically filtering candidates based on their evaluation scores, notifying qualified candidates via personalized emails, and creating corresponding screening tasks in ClickUp for the HR team. The workflow includes the following logical blocks:

- **1.1 Manual Trigger Initiation:** Starts the workflow manually to process all candidate records.
- **1.2 Candidate Data Retrieval:** Fetches all candidate data from a Google Sheets spreadsheet.
- **1.3 Candidate Qualification Filtering:** Filters candidates with scores above a defined threshold to identify those eligible for progression.
- **1.4 Candidate Notification:** Sends personalized congratulatory emails with Calendly scheduling links to qualified candidates.
- **1.5 Task Creation in ClickUp:** Automatically creates screening tasks assigned to HR team members for follow-up actions.

---

### 2. Block-by-Block Analysis

#### 2.1 Manual Trigger Initiation

- **Overview:**  
  This block starts the workflow manually, allowing HR users to initiate the shortlisting process on demand, typically after candidate scores have been updated.

- **Nodes Involved:**  
  - When clicking ‘Execute workflow’

- **Node Details:**  
  - **When clicking ‘Execute workflow’**  
    - Type: Manual Trigger  
    - Configuration: No parameters; serves as a manual start point  
    - Expressions/Variables: None  
    - Input: None  
    - Output: Triggers the next node to fetch candidate records  
    - Edge Cases: None typical; user must manually execute  
    - Sub-workflow: None  

#### 2.2 Candidate Data Retrieval

- **Overview:**  
  Fetches the complete candidate dataset from a Google Sheets spreadsheet including names, scores, contact details, and evaluation summaries for batch processing.

- **Nodes Involved:**  
  - Fetch All Candidate Records

- **Node Details:**  
  - **Fetch All Candidate Records**  
    - Type: Google Sheets (Read)  
    - Configuration:  
      - Document: "Resume store" spreadsheet (ID: 1JlXxy90s0we_IqErHyvomrJSijb8pd4H91hOUCH6xCA)  
      - Sheet: Sheet2 (gid: 1424038785)  
      - Reads all rows without filters  
    - Expressions/Variables: None  
    - Input: Trigger from manual start  
    - Output: Array of candidate records with full profile data  
    - Credentials: Google Sheets OAuth2 account  
    - Edge Cases:  
      - API rate limits or authorization failures  
      - Large datasets causing timeouts or memory issues  
      - Changes in sheet structure causing data misalignment  
    - Sub-workflow: None  

#### 2.3 Candidate Qualification Filtering

- **Overview:**  
  Filters candidates whose scores exceed the threshold of 70 points, ensuring only suitably qualified candidates advance for further processing.

- **Nodes Involved:**  
  - Filter High-Score Candidates

- **Node Details:**  
  - **Filter High-Score Candidates**  
    - Type: If (conditional filtering)  
    - Configuration: Checks if candidate’s “Score” field > 70  
    - Expressions/Variables: `={{ $json.Score }} > 70`  
    - Input: Candidate records array  
    - Output: Passes only candidates meeting criteria to next node  
    - Edge Cases:  
      - Missing or non-numeric Score values causing evaluation errors  
      - Incorrect data field names or case sensitivity issues  
    - Sub-workflow: None  

#### 2.4 Candidate Notification

- **Overview:**  
  Sends personalized congratulatory emails to qualified candidates, including a Calendly link for scheduling interviews, enhancing candidate experience and engagement.

- **Nodes Involved:**  
  - Send Congratulations Email

- **Node Details:**  
  - **Send Congratulations Email**  
    - Type: Gmail (Send Email)  
    - Configuration:  
      - Recipient: `{{ $json.receiver_email }}` from candidate data  
      - Subject: "Congratulations! {{ $json.Name }} for moving forward"  
      - Message: Personalized text including candidate name and Calendly scheduling link  
      - Email Type: Plain text  
    - Expressions/Variables: Uses candidate’s Name and receiver_email from JSON  
    - Input: Qualified candidates from filter node  
    - Output: Triggers task creation node  
    - Credentials: Gmail OAuth2 account with send permissions  
    - Edge Cases:  
      - Invalid or missing email addresses causing send failures  
      - Gmail API quota limits or authentication errors  
      - Network or SMTP issues  
    - Sub-workflow: None  

#### 2.5 Task Creation in ClickUp

- **Overview:**  
  Automatically creates a screening task in ClickUp assigned to a specific HR team member, linking candidate progression to project management workflows.

- **Nodes Involved:**  
  - Create Screening Task in ClickUp

- **Node Details:**  
  - **Create Screening Task in ClickUp**  
    - Type: ClickUp (Task Create)  
    - Configuration:  
      - Team ID: 9016683627  
      - Space ID: 90162844741  
      - Folder ID: 90164394824  
      - List ID: 901610812551  
      - Task Name: `"Screening {{ $('Filter High-Score Candidates').item.json.Name }} TO BE DONE"`  
      - Assignee: User ID 95074494  
    - Expressions/Variables: Uses candidate name dynamically for task title  
    - Input: Output from Send Congratulations Email node  
    - Output: None further in this workflow  
    - Credentials: ClickUp API key with task creation permissions  
    - Edge Cases:  
      - API failures or authentication errors  
      - Invalid team/list IDs or permission issues  
      - Rate limits or network interruptions  
    - Sub-workflow: None  

---

### 3. Summary Table

| Node Name                  | Node Type             | Functional Role                          | Input Node(s)                 | Output Node(s)               | Sticky Note                                                                                                                                                                                                                                         |
|----------------------------|-----------------------|----------------------------------------|------------------------------|------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger         | Manual start of the workflow            | None                         | Fetch All Candidate Records   | ## 🚀 START PROCESS  Start Auto Candidate Shortlisting; Purpose: manual initiation; Trigger: manual click; Best Practice: run during business hours for immediate follow-ups                                                                                     |
| Fetch All Candidate Records | Google Sheets         | Retrieve all candidate records          | When clicking ‘Execute workflow’ | Filter High-Score Candidates  | ## 📊 DATA RETRIEVAL  Retrieves full candidate database from Google Sheets; handles large data sets efficiently                                                                                                                                    |
| Filter High-Score Candidates| If                    | Filter candidates scoring above 70     | Fetch All Candidate Records   | Send Congratulations Email    | ## 🔍 QUALIFICATION FILTER  Filters candidates with Score > 70; ensures only qualified candidates proceed                                                                                                                                          |
| Send Congratulations Email  | Gmail                 | Notify qualified candidates             | Filter High-Score Candidates  | Create Screening Task in ClickUp | ## 📧 CANDIDATE NOTIFICATION  Sends personalized congrats emails with Calendly link                                                                                                                                                                    |
| Create Screening Task in ClickUp | ClickUp               | Create screening tasks for HR           | Send Congratulations Email   | None                         | ## 📋 TASK MANAGEMENT  Creates screening tasks assigned to HR; links hiring process to project management                                                                                                                                           |
| Sticky Note1               | Sticky Note           | Describes manual trigger block          | None                         | None                         | See "When clicking ‘Execute workflow’" for content                                                                                                                                                                                                  |
| Sticky Note2               | Sticky Note           | Describes candidate data retrieval      | None                         | None                         | See "Fetch All Candidate Records" for content                                                                                                                                                                                                        |
| Sticky Note3               | Sticky Note           | Describes qualification filter          | None                         | None                         | See "Filter High-Score Candidates" for content                                                                                                                                                                                                       |
| Sticky Note4               | Sticky Note           | Describes candidate notification        | None                         | None                         | See "Send Congratulations Email" for content                                                                                                                                                                                                         |
| Sticky Note5               | Sticky Note           | Describes ClickUp task creation         | None                         | None                         | See "Create Screening Task in ClickUp" for content                                                                                                                                                                                                   |
| Sticky Note6               | Sticky Note           | Overall workflow purpose and process    | None                         | None                         | ## 🎯 AUTO SHORTLIST & STAGE MOVEMENT WORKFLOW  Detailed overview of workflow purpose, process steps, scoring thresholds, benefits, and integrations                                                                                                   |
| Sticky Note7               | Sticky Note           | Configuration and maintenance notes     | None                         | None                         | ## ⚙️ CONFIGURATION SETTINGS  Describes customizable parameters, email templates, ClickUp integration details, and maintenance guidance                                                                                                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node:**  
   - Add a Manual Trigger node named **"When clicking ‘Execute workflow’"**. No additional configuration required.

2. **Add Google Sheets Node to Fetch Candidates:**  
   - Add a Google Sheets node named **"Fetch All Candidate Records"**.  
   - Set **Operation** to "Read Rows".  
   - Configure the **Document ID** with your candidate spreadsheet ID (e.g., `1JlXxy90s0we_IqErHyvomrJSijb8pd4H91hOUCH6xCA`).  
   - Set **Sheet Name** to the appropriate sheet (e.g., "Sheet2").  
   - Connect the Manual Trigger node output to this node’s input.  
   - Set credentials to a Google Sheets OAuth2 credential with read access.

3. **Add If Node to Filter Candidates by Score:**  
   - Add an If node named **"Filter High-Score Candidates"**.  
   - Configure the condition:  
     - Set type to "Number" with operation "Greater than".  
     - Left Value: Expression `{{ $json.Score }}`  
     - Right Value: `70` (this is the qualification threshold).  
   - Connect the Google Sheets node output to this node’s input.

4. **Add Gmail Node to Send Congratulatory Emails:**  
   - Add a Gmail node named **"Send Congratulations Email"**.  
   - Set **Operation** to "Send Email".  
   - Configure:  
     - **To:** `{{ $json.receiver_email }}`  
     - **Subject:** `Congratulations! {{ $json.Name }} for moving forward`  
     - **Message:**  
       ```
       Hii {{ $json.Name }}!

       Congratulations for moving forward.
       Please book your calendly time slot.
       https://calendly.com/anuj-techdome/30min
       ```  
     - Set Email Type to "Plain Text".  
   - Connect the "true" output of the If node to this node’s input.  
   - Set Gmail OAuth2 credentials with send permissions.

5. **Add ClickUp Node to Create Screening Tasks:**  
   - Add a ClickUp node named **"Create Screening Task in ClickUp"**.  
   - Set **Operation** to "Create Task".  
   - Configure fields:  
     - Team: `9016683627`  
     - Space: `90162844741`  
     - Folder: `90164394824`  
     - List: `901610812551`  
     - Task Name: Use expression `Screening {{ $('Filter High-Score Candidates').item.json.Name }} TO BE DONE`  
     - Assignees: `[95074494]`  
   - Connect the Gmail node output to this node’s input.  
   - Use ClickUp API credentials with task creation rights.

6. **Connect Nodes Accordingly:**  
   - Manual Trigger → Fetch All Candidate Records → Filter High-Score Candidates → Send Congratulations Email → Create Screening Task in ClickUp.

7. **Test the Workflow:**  
   - Execute the manual trigger during business hours for best results.  
   - Monitor logs for errors related to API limits, authentication, or data issues.

---

### 5. General Notes & Resources

| Note Content                                                                                                                        | Context or Link                                                                                   |
|-----------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| The workflow is designed to be executed manually, preferably during business hours for timely follow-ups.                        | Sticky Note1                                                                                     |
| Candidate data is sourced from a Google Sheets document named "Resume store," specifically from "Sheet2".                         | Sticky Note2; Google Sheets integration                                                         |
| Qualification threshold (score > 70) is adjustable to fit different role requirements and seniority levels.                      | Sticky Note3; See workflow configuration for parameter adjustments                               |
| Email notifications include personalized content and a Calendly link to streamline interview scheduling and improve candidate experience. | Sticky Note4; Calendly link: https://calendly.com/anuj-techdome/30min                            |
| Screening tasks are systematically created in ClickUp to ensure accountability and track HR follow-ups.                         | Sticky Note5; ClickUp integration settings detailed in Sticky Note7                              |
| The overall workflow enhances hiring speed, consistency, organization, and candidate experience through automation.              | Sticky Note6                                                                                     |
| Key configuration parameters such as score threshold, email templates, ClickUp IDs, and assignees should be regularly reviewed and updated. | Sticky Note7                                                                                     |

---

**Disclaimer:**  
The content above is derived solely from an automated n8n workflow. It adheres strictly to applicable content policies and contains no illegal, offensive, or protected material. All data processed is legal and public.