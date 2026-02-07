Auto-Sync Easy Redmine Tasks to Microsoft To-Do

https://n8nworkflows.xyz/workflows/auto-sync-easy-redmine-tasks-to-microsoft-to-do-8628


# Auto-Sync Easy Redmine Tasks to Microsoft To-Do

### 1. Workflow Overview

This workflow automates synchronization of filtered tasks from Easy Redmine into a specific Microsoft To Do list, ensuring the To Do list stays current and devoid of duplicates. It is designed for users or teams using Easy Redmine for project management and Microsoft To Do for daily task tracking.

The workflow logic is divided into the following blocks:

- **1.1 Schedule Trigger:** Initiates the workflow at a scheduled time daily.
- **1.2 Microsoft To Do Cleanup:** Retrieves all tasks from a chosen Microsoft To Do list and deletes them to prepare for fresh sync.
- **1.3 Deletion Confirmation:** Confirms completion of task deletions before proceeding.
- **1.4 Easy Redmine Task Retrieval:** Fetches tasks from Easy Redmine using a predefined filter.
- **1.5 Task Processing:** Splits the batch of tasks into individual items.
- **1.6 Task Description Enrichment:** Adds direct Easy Redmine issue URLs to the task descriptions.
- **1.7 Task Creation in Microsoft To Do:** Creates new tasks in Microsoft To Do with enriched descriptions and due dates.

---

### 2. Block-by-Block Analysis

#### 1.1 Schedule Trigger

- **Overview:**  
  Triggers the entire workflow every day at 9 AM, initiating the synchronization process.

- **Nodes Involved:**  
  - Schedule Trigger

- **Node Details:**  
  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Starts the workflow on a time-based schedule  
    - Configuration: Set to trigger once daily at 9:00 AM (hour-based trigger)  
    - Connections: Outputs to "Get To-Do in Specific List"  
    - Edge Cases:  
      - Timezone mismatches if not configured correctly in n8n instance  
      - Workflow not triggered if n8n instance is offline at scheduled time  

#### 1.2 Microsoft To Do Cleanup

- **Overview:**  
  Retrieves all existing tasks from the specified Microsoft To Do list and deletes them to avoid duplication when syncing new tasks.

- **Nodes Involved:**  
  - Get To-Do in Specific List  
  - Clean To-Do List

- **Node Details:**  
  - **Get To-Do in Specific List**  
    - Type: Microsoft To Do node (operation: getAll)  
    - Role: Fetches all tasks from a targeted Microsoft To Do list  
    - Configuration: Uses a specific taskListId identifying the To Do list  
    - Input: Trigger from Schedule Trigger  
    - Output: List of tasks to "Clean To-Do List" for deletion  
    - Edge Cases:  
      - API rate limits or auth errors if Microsoft credentials expire  
      - Empty list returns zero tasks, handled gracefully  

  - **Clean To-Do List**  
    - Type: Microsoft To Do node (operation: delete)  
    - Role: Deletes each task retrieved from the To Do list  
    - Configuration: Uses the same taskListId; taskId dynamically set from input JSON (`={{ $json.id }}`)  
    - Input: From "Get To-Do in Specific List"  
    - Output: On success, forwards to "Just One Output after Deletion"; on error, continues workflow (onError: continueErrorOutput)  
    - Edge Cases:  
      - Partial deletion failures (e.g., permissions issues or transient API errors) handled by continuing workflow  
      - Deleting tasks concurrently or limits on batch deletions  

#### 1.3 Deletion Confirmation

- **Overview:**  
  Aggregates the deletion results to ensure all tasks have been processed before moving forward.

- **Nodes Involved:**  
  - Just One Output after Deletion (Code Node)

- **Node Details:**  
  - **Just One Output after Deletion**  
    - Type: Code Node (JavaScript)  
    - Role: Receives multiple deletion outputs, aggregates task titles into a summary string  
    - Configuration: Maps all deleted task titles into a newline-separated list  
    - Input: From "Clean To-Do List"  
    - Output: Passes summary JSON to "Get Easy Redmine Task by Filter"  
    - Edge Cases:  
      - Empty input array if no tasks to delete (summary will be empty or blank)  
      - Expression errors if input data malformed  

#### 1.4 Easy Redmine Task Retrieval

- **Overview:**  
  Pulls tasks from Easy Redmine based on a saved filter query, focusing on relevant active or assigned tasks.

- **Nodes Involved:**  
  - Get Easy Redmine Task by Filter

- **Node Details:**  
  - **Get Easy Redmine Task by Filter**  
    - Type: Easy Redmine node (custom integration)  
    - Role: Fetches filtered issues/tasks from Easy Redmine API  
    - Configuration: Uses a preset filter ID (`issueQueryId: 5342`) to specify task subset  
    - Credentials: Uses Easy Redmine API credentials named "Name of Credentials"  
    - Input: From "Just One Output after Deletion"  
    - Output: Issues array to "Split Out Tasks"  
    - Edge Cases:  
      - API authentication errors if credentials invalid or expired  
      - Empty result sets if no tasks match filter  
      - Network or API downtime errors  

#### 1.5 Task Processing

- **Overview:**  
  Splits the array of tasks returned from Easy Redmine into individual items for per-task processing.

- **Nodes Involved:**  
  - Split Out Tasks

- **Node Details:**  
  - **Split Out Tasks**  
    - Type: Split Out node  
    - Role: Breaks down the "issues" array into individual workflow items  
    - Configuration: Splits on field `issues` and includes all other fields for context  
    - Input: From "Get Easy Redmine Task by Filter"  
    - Output: Sends each task individually to "Add Easy Redmine Task Link to To-Do Description"  
    - Edge Cases:  
      - No issues returned leads to no downstream items  
      - Data structure changes in Easy Redmine API could break splitting  

#### 1.6 Task Description Enrichment

- **Overview:**  
  Enhances each task's description by adding a direct clickable link to the corresponding Easy Redmine issue.

- **Nodes Involved:**  
  - Add Easy Redmine Task Link to To-Do Description

- **Node Details:**  
  - **Add Easy Redmine Task Link to To-Do Description**  
    - Type: Code Node (JavaScript)  
    - Role: Constructs task description combining Easy Redmine URL and original description  
    - Configuration:  
      - Hardcoded base URL: `"https://es.easyproject.com/issues/"` (user must update to their own Redmine URL)  
      - Extracts `id` and `description` from the split task JSON  
      - Returns enriched text as `enrichedText`  
    - Input: From "Split Out Tasks"  
    - Output: Passes enriched text to "Create To-Do Tasks"  
    - Edge Cases:  
      - Missing or malformed task fields (id or description) causing errors  
      - User forgetting to update base URL leads to incorrect links  
      - Empty descriptions handled by prepending URL only  

#### 1.7 Task Creation in Microsoft To Do

- **Overview:**  
  Creates a new task in the Microsoft To Do list for each Easy Redmine task, using enriched descriptions and due dates.

- **Nodes Involved:**  
  - Create To-Do Tasks

- **Node Details:**  
  - **Create To-Do Tasks**  
    - Type: Microsoft To Do node (operation: create)  
    - Role: Adds a new task to the specified Microsoft To Do list  
    - Configuration:  
      - Task title from Easy Redmine issue subject  
      - Task content from `enrichedText` (includes Redmine URL and original description)  
      - Due date set from Easy Redmine issue `due_date` field  
      - Uses same `taskListId` as cleanup steps  
    - Input: From "Add Easy Redmine Task Link to To-Do Description"  
    - Output: Final output; no further nodes  
    - Edge Cases:  
      - Microsoft Graph API auth failures or limits  
      - Invalid or missing due dates handled gracefully (may create task without due date)  
      - Title or content length limits in Microsoft To Do  

---

### 3. Summary Table

| Node Name                                   | Node Type                  | Functional Role                                  | Input Node(s)                           | Output Node(s)                          | Sticky Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
|---------------------------------------------|----------------------------|-------------------------------------------------|---------------------------------------|----------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger                            | Schedule Trigger            | Starts workflow daily at 9 AM                    | —                                     | Get To-Do in Specific List              |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Get To-Do in Specific List                  | Microsoft To Do             | Retrieves all tasks in target To Do list         | Schedule Trigger                      | Clean To-Do List                       |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Clean To-Do List                           | Microsoft To Do             | Deletes all tasks in the To Do list to avoid duplicates | Get To-Do in Specific List           | Just One Output after Deletion, Get Easy Redmine Task by Filter |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Just One Output after Deletion              | Code Node                  | Aggregates deleted tasks confirmation            | Clean To-Do List                     | Get Easy Redmine Task by Filter         |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Get Easy Redmine Task by Filter             | Easy Redmine API node      | Fetches filtered tasks from Easy Redmine          | Just One Output after Deletion       | Split Out Tasks                        |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Split Out Tasks                            | Split Out                  | Splits issues array into individual tasks         | Get Easy Redmine Task by Filter       | Add Easy Redmine Task Link to To-Do Description |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Add Easy Redmine Task Link to To-Do Description | Code Node                  | Adds direct Redmine URL to task description       | Split Out Tasks                      | Create To-Do Tasks                     | You need to add your Easy Redmine URL in this node: `https://your-redmine-url.com/issues/{{ $json.id }}`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Create To-Do Tasks                         | Microsoft To Do             | Creates a task in Microsoft To Do with enriched description | Add Easy Redmine Task Link to To-Do Description | —                                      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Sticky Note2                              | Sticky Note                 | Workflow overview and detailed description        | —                                     | —                                      | ## Auto-Sync Easy Redmine Tasks to Microsoft To-Do  \n**Automatically sync filtered Easy Redmine tasks into a specific Microsoft To Do list...** (full content as provided)                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Sticky Note3                              | Sticky Note                 | Brief workflow step summary                        | —                                     | —                                      | ## Auto-Sync Easy Redmine Tasks to Microsoft To-Do  \n**1) \"Schedule Trigger\" – run the workflow daily at a chosen time**  \n**2) \"Get all tasks from Microsoft To Do list\" – clear existing tasks to avoid duplication**  \n**3) \"Code Node\" – confirm deletion before continuing**  \n**4) \"Get Easy Redmine tasks by filter\" – pull tasks using predefined Redmine filters (e.g. assigned to me, open status)**  \n**5) \"Split\" – process each task individually**  \n**6) \"Format description with Redmine link\" – enrich the task with a direct issue URL**  \n**7) \"Create task in Microsoft To Do\" – sync each Redmine task to your To Do list** |
| Sticky Note4                              | Sticky Note                 | Final example of Microsoft To Do task             | —                                     | —                                      | ## Final Output Example (Microsoft To-Do)\n\nA new task will be created in Microsoft To-Do with the following fields synced from Easy Redmine:\n\n---\n\n### 📝 **Task:** Test  \n**🆔 Redmine Issue ID:** [1354](https://your-redmine-url.com/issues/1354)  \n**📅 Due Date:** 13.02.2025\n**⭐ Priority:** Important (starred)                                                                                                                                                                                                                                                                                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Configuration: Set to run daily at 9:00 AM (adjust hour as needed)  
   - Connect to next node: Get To-Do in Specific List  

2. **Create a Microsoft To Do node (Get To-Do in Specific List):**  
   - Type: Microsoft To Do  
   - Operation: getAll  
   - Set `taskListId` to the target Microsoft To Do list ID where tasks will be synced  
   - Connect input from Schedule Trigger  
   - Connect output to Clean To-Do List  

3. **Create a Microsoft To Do node (Clean To-Do List):**  
   - Type: Microsoft To Do  
   - Operation: delete  
   - Set `taskListId` same as above  
   - Set `taskId` expression to `={{ $json.id }}` to delete each task individually  
   - Set "On Error" to "Continue" to handle partial failures gracefully  
   - Connect input from Get To-Do in Specific List  
   - Connect outputs to:  
     - Just One Output after Deletion  
     - Get Easy Redmine Task by Filter (parallel continuation)  

4. **Create a Code node (Just One Output after Deletion):**  
   - Type: Code node (JavaScript)  
   - Code snippet:  
     ```javascript
     const allTasks = items.map(item => item.json);
     const summary = allTasks.map(task => `- ${task.title}`).join('\n');
     return [{ json: { summary } }];
     ```  
   - Connect input from Clean To-Do List  
   - Connect output to Get Easy Redmine Task by Filter  

5. **Create an Easy Redmine node (Get Easy Redmine Task by Filter):**  
   - Type: Easy Redmine node (custom integration)  
   - Operation: get-many (issues)  
   - Configure with the saved filter ID (`issueQueryId`), e.g., 5342  
   - Attach Easy Redmine API credentials with necessary permissions  
   - Connect input from Just One Output after Deletion  
   - Connect output to Split Out Tasks  

6. **Create a Split Out node (Split Out Tasks):**  
   - Type: Split Out node  
   - Field to split: `issues` (the array containing tasks)  
   - Include all other fields for context  
   - Connect input from Get Easy Redmine Task by Filter  
   - Connect output to Add Easy Redmine Task Link to To-Do Description  

7. **Create a Code node (Add Easy Redmine Task Link to To-Do Description):**  
   - Type: Code node (JavaScript)  
   - Mode: Run once for each item  
   - Code snippet:  
     ```javascript
     // Update baseUrl to your Easy Redmine domain
     const baseUrl = "https://your-redmine-url.com/issues/";

     const issue = $('Split Out Tasks').item.json.issues;
     const fullLink = `${baseUrl}${issue.id}`;
     const originalDescription = issue.description || "";

     const enrichedText = `${fullLink}\n\n${originalDescription}`;

     return { json: { enrichedText } };
     ```  
   - Connect input from Split Out Tasks  
   - Connect output to Create To-Do Tasks  

8. **Create a Microsoft To Do node (Create To-Do Tasks):**  
   - Type: Microsoft To Do  
   - Operation: create  
   - Set `taskListId` same as previous Microsoft To Do nodes  
   - Set `title` to expression: `={{ $('Split Out Tasks').item.json.issues.subject }}`  
   - Set additional fields:  
     - `content`: `={{ $json.enrichedText }}`  
     - `dueDateTime`: `={{ $('Split Out Tasks').item.json.issues.due_date }}` (ensure date format compatibility)  
   - Connect input from Add Easy Redmine Task Link to To-Do Description  

9. **Credential Setup:**  
   - Configure Microsoft To Do credentials (Microsoft Graph OAuth2) with permissions to read and write tasks  
   - Configure Easy Redmine API credentials with appropriate API key/token and permissions to access issues and filters  

10. **Adjust and Verify:**  
    - Update base URL in the description enrichment code node to your Easy Redmine domain  
    - Set Microsoft To Do list ID in all Microsoft To Do nodes identically  
    - Adjust schedule trigger timezone if necessary  
    - Test workflow manually before enabling schedule  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Context or Link                                                 |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------|
| Workflow automatically clears and refills Microsoft To Do list daily to keep tasks synchronized without duplicates. Useful for personal or team daily planning and sprint execution.                                                                                                                                                                                                                                                                                                              | Overall workflow purpose                                        |
| Update the code node with your actual Easy Redmine URL to make issue links valid (`https://your-redmine-url.com/issues/{{ $json.id }}`).                                                                                                                                                                                                                                                                                                                                                      | Code node "Add Easy Redmine Task Link to To-Do Description"    |
| Ensure Microsoft To Do OAuth2 credentials have scope to read/write tasks and lists for smooth operation.                                                                                                                                                                                                                                                                                                                                                                                       | Microsoft To Do API credential requirements                     |
| Easy Redmine API user should have permissions to access filtered tasks and issue details. Use a technical user account if possible.                                                                                                                                                                                                                                                                                                                                                             | Easy Redmine API credential requirements                        |
| For support or customization, reach out on the n8n community: https://community.n8n.io/u/easy8.ai or Easy8.ai team directly. Video tutorials and updates are available at https://www.youtube.com/@easy8ai                                                                                                                                                                                                                                                                                        | Support and community resources                                 |
| Final task appearance example in Microsoft To-Do: task title, direct clickable link to Redmine issue ID, due date, and priority indicated by starred tasks.                                                                                                                                                                                                                                                                                                                                   | Sticky Note4 content (Final Output Example)                     |

---

**Disclaimer:** The provided text originates solely from an automated workflow created with n8n, respecting all current content policies and containing no illegal, offensive, or protected elements. All data processed is legal and public.