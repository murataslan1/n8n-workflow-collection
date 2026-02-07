Airtable - Automate Recurring Tasks

https://n8nworkflows.xyz/workflows/airtable---automate-recurring-tasks-2070


# Airtable - Automate Recurring Tasks

### 1. Workflow Overview

This workflow is designed as a support automation for managing recurring tasks within an Airtable Base. Its main purpose is to create new task records in Airtable automatically on a recurring schedule, based on configurations defined in the base. This enables users to automate task creation, track task timelines, assignments, and client relationships without manual intervention.

The workflow consists of the following logical blocks:

- **1.1 Input Reception:** Triggering based on updates in a specific Airtable view that flags a task to be created.
- **1.2 Configuration Retrieval:** Fetching base and table identifiers, and detailed records like task templates, assignees, and clients.
- **1.3 Date Calculations:** Computing kickoff, soft due, hard due, and next task creation dates based on task parameters.
- **1.4 Task Creation:** Creating the new task record in Airtable using HTTP request.
- **1.5 Record Update:** Updating the automation control record with flags and dates to track progress.
- **1.6 Notification (Disabled):** Optional Slack notification to the assignee, currently disabled.
- **1.7 Documentation and Setup Guidance:** Sticky notes providing setup instructions and resource links.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block triggers the workflow when a record in a specific Airtable view is updated, indicating a recurring task to process.

- **Nodes Involved:**  
  - Entered View "First Task - Create Task"  
  - Airtable Base ID's (Set node)

- **Node Details:**  

  - **Entered View "First Task - Create Task"**  
    - Type: Airtable Trigger  
    - Role: Starts the workflow when a record in the "First Task - Create Task" view is updated, polling every minute.  
    - Configuration:  
      - Base ID and Table ID are hardcoded for the template but can be changed.  
      - Trigger field: `updated_at` (field must be visible in the view).  
      - View: "First Task - Create Task" (restricts triggering to relevant records).  
    - Inputs: External Airtable record updates.  
    - Outputs: Emits updated record data with fields for further processing.  
    - Potential Failures: Connectivity issues with Airtable, incorrect base/table/view IDs, missing trigger field.  
    - Version: 1.

  - **Airtable Base ID's**  
    - Type: Set  
    - Role: Defines and stores all Airtable Base and Table IDs required downstream, making the workflow adaptable to different bases.  
    - Configuration: Contains key-value pairs for base_id and various table IDs (`table_task_id`, `table_template_id`, etc.).  
    - Inputs: Receives data from the trigger node.  
    - Outputs: Provides IDs for downstream nodes.  
    - Potential Failures: Incorrect IDs will cause subsequent Airtable API calls to fail.  
    - Version: 3.2.

---

#### 2.2 Configuration Retrieval

- **Overview:**  
  This block fetches detailed records needed to create the new task, including the automated task control record, task template, assigned team member, and client details.

- **Nodes Involved:**  
  - Get Automated Task  
  - Get Task Template  
  - Get Assignee  
  - Get Client

- **Node Details:**  

  - **Get Automated Task**  
    - Type: Airtable  
    - Role: Retrieves the control record for the current recurring task based on the ID from the trigger view.  
    - Configuration:  
      - Uses ID from the trigger's selected record.  
      - Uses base and table IDs from the "Airtable Base ID's" node.  
      - Operation: Get by ID.  
    - Inputs: From "Airtable Base ID's".  
    - Outputs: JSON record containing fields like Template, Assigned Team Member, Client, Start Date, etc.  
    - Potential Failures: Invalid or missing record ID, permission or API quota issues.  
    - Version: 2.

  - **Get Task Template**  
    - Type: Airtable  
    - Role: Retrieves the task template record referenced in the automated task for field values like name and description.  
    - Configuration:  
      - Uses Template ID from "Get Automated Task" record.  
      - Uses base and table IDs from "Airtable Base ID's".  
      - Operation: Get by ID.  
    - Inputs: From "Get Automated Task".  
    - Outputs: Task template details (e.g., Template Name, Description).  
    - Potential Failures: Missing or invalid template ID.  
    - Version: 2.

  - **Get Assignee**  
    - Type: Airtable  
    - Role: Retrieves the team member record assigned to the task for use in task creation.  
    - Configuration:  
      - Uses Assigned Team Member ID from "Get Automated Task".  
      - Uses base and table IDs from "Airtable Base ID's".  
      - Operation: Get by ID.  
    - Inputs: From "Get Task Template".  
    - Outputs: Assignee details including ID.  
    - Potential Failures: Missing or invalid assignee ID.  
    - Version: 2.

  - **Get Client**  
    - Type: Airtable  
    - Role: Retrieves the client record linked to the task for association.  
    - Configuration:  
      - Uses Client ID from "Get Automated Task".  
      - Uses base and table IDs from "Airtable Base ID's".  
      - Operation: Get by ID.  
    - Inputs: From "Get Assignee".  
    - Outputs: Client details including ID.  
    - Potential Failures: Missing or invalid client ID.  
    - Version: 2.

---

#### 2.3 Date Calculations

- **Overview:**  
  This block calculates all relevant dates for the new task including kickoff, soft due, hard due, and next creation dates based on the retrieved task parameters.

- **Nodes Involved:**  
  - Calculate Dates (Code node)

- **Node Details:**  

  - **Calculate Dates**  
    - Type: Code (JavaScript)  
    - Role: Uses logic to compute dates dynamically based on whether the first task was created and other parameters.  
    - Configuration:  
      - Reads fields from "Get Automated Task": `First Task Created`, `Start Date`, `Last Task Created`, `Time Value`, `Days for Soft Due Date`.  
      - Calculates:  
        - Kickoff Date: start date or last task created date + time value.  
        - Soft Due Date: kickoff date + (time value - days for soft due date).  
        - Hard Due Date: kickoff date + time value.  
        - Next Task Creation Date: hard due date - 1 day.  
        - Today’s date for updating control record.  
      - Date formatting in MM/DD/YYYY.  
    - Inputs: From "Get Client".  
    - Outputs: JSON containing all calculated dates.  
    - Potential Failures: Invalid date formats, missing input fields leading to runtime errors.  
    - Version: 2.

---

#### 2.4 Task Creation

- **Overview:**  
  This block creates the new task record in Airtable with all relevant fields populated from the template, calculated dates, assignee, and client.

- **Nodes Involved:**  
  - Create Task (HTTP Request)

- **Node Details:**  

  - **Create Task**  
    - Type: HTTP Request  
    - Role: Sends a POST request directly to Airtable API to create a new task record.  
    - Configuration:  
      - URL constructed dynamically using base and task table IDs.  
      - JSON body includes fields: Status ("Todo"), Task Name, Task Description (with line breaks escaped), Kickoff Date, Soft Due Date, Hard Due Date, Assignee (array of IDs), Template (array), Client (array).  
      - Authentication via predefined Airtable API token credential.  
      - Content-Type header: application/json.  
    - Inputs: From "Calculate Dates" (date fields) and other nodes for template, assignee, client.  
    - Outputs: Response from Airtable API with created record details.  
    - Potential Failures: API authentication errors, field validation errors, network timeouts.  
    - Version: 4.1.

---

#### 2.5 Record Update

- **Overview:**  
  Updates the original automated task control record to mark that the first task has been created and updates tracking dates.

- **Nodes Involved:**  
  - Update Automated Record (HTTP Request)

- **Node Details:**  

  - **Update Automated Record**  
    - Type: HTTP Request  
    - Role: Sends a PATCH request to Airtable API to update fields in the automation control record.  
    - Configuration:  
      - URL built dynamically with base and automate table IDs.  
      - JSON body updates:  
        - `First Task Created` set to "true"  
        - `Last Task Created` set to today’s date  
        - `Next Task Creation Date` set to calculated next creation date  
      - Uses Airtable API token credential.  
      - Content-Type header: application/json.  
    - Inputs: From "Create Task".  
    - Outputs: Airtable API response confirming update.  
    - Potential Failures: API errors, missing record ID, concurrency conflicts.  
    - Version: 4.1.

---

#### 2.6 Notification (Disabled)

- **Overview:**  
  Intended to notify the assignee on Slack when a task is created, but this node is currently disabled.

- **Nodes Involved:**  
  - Notify Assignee (Slack)

- **Node Details:**  

  - **Notify Assignee**  
    - Type: Slack  
    - Role: Sends a message to a Slack channel or user notifying about the new task.  
    - Configuration:  
      - Channel ID is not set (blank), requiring configuration.  
      - Node is disabled and will not run.  
    - Inputs: From "Update Automated Record".  
    - Potential Failures: Missing Slack credentials, invalid channel ID, Slack API rate limits.  
    - Version: 2.1.

---

#### 2.7 Documentation and Setup Guidance (Sticky Notes)

- **Overview:**  
  Provides helpful notes, links, and setup instructions embedded in the workflow.

- **Nodes Involved:**  
  - Sticky Note  
  - Sticky Note1  
  - Sticky Note2  
  - Sticky Note3

- **Node Details:**  

  - **Sticky Note**  
    - Content: Link to Airtable recurring tasks template (Airtable Universe).  
    - Purpose: Resource reference for understanding the base schema.

  - **Sticky Note1**  
    - Content: Warning to adapt nodes to custom Airtable base fields and types.  
    - Purpose: Setup caution to avoid field mismatches.

  - **Sticky Note2**  
    - Content: Link to a walkthrough video on YouTube.  
    - Purpose: Visual guide for users to understand workflow operation.

  - **Sticky Note3**  
    - Content: Setup checklist with steps to copy base, configure trigger, and test automation live.  
    - Purpose: Stepwise onboarding instructions.

---

### 3. Summary Table

| Node Name                   | Node Type            | Functional Role                              | Input Node(s)                             | Output Node(s)                    | Sticky Note                                                                                                      |
|-----------------------------|----------------------|----------------------------------------------|------------------------------------------|----------------------------------|-----------------------------------------------------------------------------------------------------------------|
| Entered View "First Task - Create Task" | Airtable Trigger     | Starts workflow on record update in Airtable view | None                                     | Airtable Base ID's                | Setup checklist covers this node                                                                                 |
| Airtable Base ID's           | Set                  | Stores Airtable base and table IDs for reuse  | Entered View "First Task - Create Task" | Get Automated Task               | Setup checklist covers this node                                                                                 |
| Get Automated Task           | Airtable             | Fetches control record for automation          | Airtable Base ID's                       | Get Task Template                | Warning about adapting nodes to custom base                                                                      |
| Get Task Template            | Airtable             | Retrieves task template referenced in control record | Get Automated Task                       | Get Assignee                    | Warning about adapting nodes to custom base                                                                      |
| Get Assignee                 | Airtable             | Retrieves assigned team member record          | Get Task Template                       | Get Client                     | Warning about adapting nodes to custom base                                                                      |
| Get Client                  | Airtable             | Retrieves client record linked to task         | Get Assignee                           | Calculate Dates                 | Warning about adapting nodes to custom base                                                                      |
| Calculate Dates              | Code                 | Calculates task kickoff and due dates           | Get Client                             | Create Task                    | Warning about adapting nodes to custom base                                                                      |
| Create Task                  | HTTP Request         | Creates new task record in Airtable             | Calculate Dates                        | Update Automated Record        | Warning about adapting nodes to custom base                                                                      |
| Update Automated Record      | HTTP Request         | Updates automation control record with status   | Create Task                           | Notify Assignee                | Warning about adapting nodes to custom base                                                                      |
| Notify Assignee             | Slack (disabled)     | Sends notification to assignee on Slack         | Update Automated Record                | None                         | Warning about adapting nodes to custom base                                                                      |
| Sticky Note                 | Sticky Note          | Provides Airtable template resource link        | None                                  | None                         | Provides link to Airtable Universe template                                                                      |
| Sticky Note1                | Sticky Note          | Advises adapting nodes to custom Airtable base  | None                                  | None                         | Notes about adapting nodes and field names                                                                       |
| Sticky Note2                | Sticky Note          | Contains walkthrough video link                  | None                                  | None                         | Link to YouTube walkthrough video                                                                                |
| Sticky Note3                | Sticky Note          | Setup checklist instructions                      | None                                  | None                         | Stepwise setup instructions for the workflow                                                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Airtable Trigger Node**  
   - Name: `Entered View "First Task - Create Task"`  
   - Type: Airtable Trigger  
   - Configure:  
     - Select your Airtable Base and Table corresponding to automation control.  
     - Set trigger field to `updated_at`.  
     - Set view to "First Task - Create Task".  
     - Poll every minute or as needed.  
   - Set Airtable API credentials (token).  
   - Connect output to next node.

2. **Create Set Node for Airtable Base IDs**  
   - Name: `Airtable Base ID's`  
   - Type: Set  
   - Add fields with string values for:  
     - base_id (your Airtable base ID)  
     - table_task_id (tasks table ID)  
     - table_template_id (task templates table ID)  
     - table_clients_id (clients table ID)  
     - table_team_id (team members table ID)  
     - table_automate_id (automation control table ID)  
   - Connect input from Airtable Trigger node.  
   - Output connects to "Get Automated Task".

3. **Create Airtable Node to Get Automated Task**  
   - Name: `Get Automated Task`  
   - Type: Airtable  
   - Operation: Get (by ID)  
   - ID: Use expression to reference the record ID from trigger node.  
   - Base/Table: Use expressions to reference IDs from "Airtable Base ID's" node.  
   - Connect input from "Airtable Base ID's".  
   - Output connects to "Get Task Template".

4. **Create Airtable Node to Get Task Template**  
   - Name: `Get Task Template`  
   - Type: Airtable  
   - Operation: Get (by ID)  
   - ID: Extract first Template ID from "Get Automated Task" output.  
   - Base/Table: Use from "Airtable Base ID's".  
   - Connect input from "Get Automated Task".  
   - Output connects to "Get Assignee".

5. **Create Airtable Node to Get Assignee**  
   - Name: `Get Assignee`  
   - Type: Airtable  
   - Operation: Get (by ID)  
   - ID: Use Assigned Team Member ID from "Get Automated Task".  
   - Base/Table: Use from "Airtable Base ID's".  
   - Connect input from "Get Task Template".  
   - Output connects to "Get Client".

6. **Create Airtable Node to Get Client**  
   - Name: `Get Client`  
   - Type: Airtable  
   - Operation: Get (by ID)  
   - ID: Use Client ID from "Get Automated Task".  
   - Base/Table: Use from "Airtable Base ID's".  
   - Connect input from "Get Assignee".  
   - Output connects to "Calculate Dates".

7. **Create Code Node to Calculate Dates**  
   - Name: `Calculate Dates`  
   - Type: Code (JavaScript)  
   - Paste the JavaScript code provided in the original workflow, ensuring it accesses values from "Get Automated Task" and formats dates as MM/DD/YYYY.  
   - Connect input from "Get Client".  
   - Output connects to "Create Task".

8. **Create HTTP Request Node for Task Creation**  
   - Name: `Create Task`  
   - Type: HTTP Request  
   - Method: POST  
   - URL: Construct dynamically using expressions for base_id and table_task_id from "Airtable Base ID's".  
   - Body Content-Type: application/json  
   - Body: JSON with fields `Status`, `Task Name`, `Task Description` (with newline characters escaped), `Kickoff Date`, `Soft Due Date`, `Hard Due Date`, `Assignee` (array with assignee ID), `Template` (array with template ID), and `Client` (array with client ID). Use expressions to inject values from respective nodes.  
   - Authentication: Use Airtable token credential.  
   - Connect input from "Calculate Dates".  
   - Output connects to "Update Automated Record".

9. **Create HTTP Request Node for Updating Automation Record**  
   - Name: `Update Automated Record`  
   - Type: HTTP Request  
   - Method: PATCH  
   - URL: Use expressions for base_id and table_automate_id from "Airtable Base ID's".  
   - Body Content-Type: application/json  
   - Body: JSON to update fields `First Task Created` (true), `Last Task Created` (today’s date), and `Next Task Creation Date` (calculated next creation date) in the automation control record. Use expressions to get record ID and dates.  
   - Authentication: Airtable token credential.  
   - Connect input from "Create Task".  
   - Output connects optionally to notification node.

10. **(Optional) Create Slack Node for Notification**  
    - Name: `Notify Assignee`  
    - Type: Slack  
    - Configure with Slack OAuth2 credentials.  
    - Set channel ID or user to notify.  
    - Message content to notify about task creation.  
    - Connect input from "Update Automated Record".  
    - Enable node as required.

11. **Add Sticky Notes**  
    - Create Sticky Note nodes with content for:  
      - Airtable template resource link  
      - Adaptation warnings  
      - Walkthrough video link  
      - Setup checklist instructions

---

### 5. General Notes & Resources

| Note Content                                                                                                                           | Context or Link                                                                                     |
|----------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|
| The Airtable template can be found here - https://www.airtable.com/universe/expDZ9rbZ9ZwZuTmX/recurring-tasks-automation                  | Airtable Universe recurring tasks template                                                        |
| These nodes should be adapted to your custom Airtable Base. The field names and types correspond to the template fields, but may differ | Setup caution to avoid errors due to schema mismatch                                               |
| Walkthrough and Overview video: https://www.youtube.com/watch?v=if3wr0tY-gk                                                               | Visual guide to understand workflow operation                                                     |
| Setup Checklist: Copy base, configure trigger fields and views, input Airtable IDs, test with start date as today                       | Stepwise instructions to set up and test the workflow                                            |
| Contact support or ask questions at http://sidetool.co                                                                                   | Support channel                                                                                   |

---

**End of Documentation**