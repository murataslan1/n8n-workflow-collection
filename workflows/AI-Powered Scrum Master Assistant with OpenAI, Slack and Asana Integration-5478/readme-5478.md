AI-Powered Scrum Master Assistant with OpenAI, Slack and Asana Integration

https://n8nworkflows.xyz/workflows/ai-powered-scrum-master-assistant-with-openai--slack-and-asana-integration-5478


# AI-Powered Scrum Master Assistant with OpenAI, Slack and Asana Integration

---

### 1. Workflow Overview

This workflow, titled **"AI-Powered Scrum Master Assistant with OpenAI, Slack and Asana Integration"**, functions as a virtual Scrum Master to assist Agile teams by aggregating, analyzing, and reporting on project status daily. It integrates Slack and Asana to collect recent communications, task updates, and developer feedback, and uses OpenAI’s language model to generate actionable Scrum Master insights and summaries, which are then posted back to Slack.

The workflow is logically divided into these main blocks:

- **1.1 Trigger and Initialization**: Start either manually or scheduled on every workday morning; define project and Slack channel context.
- **1.2 Data Retrieval from Asana**: Fetch project sections and tasks modified since yesterday.
- **1.3 Slack Channel Data Collection**: Retrieve Slack channel history and channel member details.
- **1.4 User Interaction for Daily Scrum Input**: Loop over Slack channel users to send Scrum Master questions and collect their answers.
- **1.5 Data Formatting and Preparation**: Convert raw data into HTML tables and string fields for AI input.
- **1.6 AI-Based Scrum Master Analysis**: Use OpenAI language model to analyze combined data and generate a Scrum Master report.
- **1.7 Reporting Back to Slack**: Post the AI-generated summary to the designated Slack channel.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger and Initialization

**Overview:**  
Starts the workflow manually or on a scheduled basis, setting key variables such as project and Slack channel IDs.

**Nodes Involved:**  
- When clicking ‘Test workflow’ (Manual Trigger)  
- Every Workday Trigger (Schedule Trigger)  
- Asana Project and Slack Channel (Set)

**Node Details:**

- **When clicking ‘Test workflow’**  
  - Type: Manual Trigger  
  - Role: Allows manual execution for testing  
  - Input: None  
  - Output: Triggers workflow start  
  - Failures: None expected  

- **Every Workday Trigger**  
  - Type: Schedule Trigger  
  - Role: Automatically triggers workflow at 9 AM Monday to Friday  
  - Parameters: Cron expression "0 0 9 * * 1-5"  
  - Input: None  
  - Output: Triggers workflow start  
  - Failures: Cron misconfiguration, timezone issues  

- **Asana Project and Slack Channel**  
  - Type: Set  
  - Role: Defines constants for Slack channel ID and Asana project ID  
  - Key Variables Set:  
    - slack_channel_id (string, placeholder)  
    - asana_project_id (string, placeholder)  
  - Input: Trigger node output  
  - Output: Supplies IDs downstream  
  - Failures: Missing or incorrect IDs will cause downstream failures  

---

#### 1.2 Data Retrieval from Asana

**Overview:**  
Fetches project structure by retrieving project sections and gathers tasks modified since yesterday.

**Nodes Involved:**  
- Get Asana Project Sections (HTTP Request)  
- Split Columns Manually (Code)  
- Tasks Modified Since Yesterday (Asana)  
- Tasks Details (Asana)  
- Keep Details for Analysis (Set)  
- HTML Asana Sections (HTML)  
- HTML Tasks Modified (HTML)  
- Asana Sections column name (Set)  
- Tasks Modified column name (Set)

**Node Details:**

- **Get Asana Project Sections**  
  - Type: HTTP Request  
  - Role: Requests sections of a project via Asana API v1.0  
  - Configuration: URL templated with `asana_project_id`  
  - Credential: Asana OAuth2  
  - Input: Project ID from initialization  
  - Output: JSON array of sections  
  - Failures: HTTP errors, auth token expiration, invalid project ID  

- **Split Columns Manually**  
  - Type: Code (JavaScript)  
  - Role: Transforms the Asana sections JSON array into simplified objects with `gid` and `name`  
  - Input: Output from previous node  
  - Output: Array of cleaned section objects  
  - Failures: JSON parsing errors, empty data  

- **Tasks Modified Since Yesterday**  
  - Type: Asana node  
  - Role: Retrieves all tasks in the project modified since 24 hours ago  
  - Filters: `project` ID and `modified_since` (dynamic date)  
  - Credential: Asana OAuth2  
  - Output: List of tasks with metadata  
  - Failures: API rate limits, auth errors, invalid project ID  

- **Tasks Details**  
  - Type: Asana node  
  - Role: Fetches detailed info for each task by `gid`  
  - Input: Tasks from previous node (split in batches implied)  
  - Output: Detailed task info including assignee, status, due dates  
  - Failures: Missing task IDs, API errors  

- **Keep Details for Analysis**  
  - Type: Set  
  - Role: Extracts and keeps relevant task details (assignee name, completion, task name, due date)  
  - Output: Simplified task info for analysis  
  - Failures: Missing fields in JSON causing expression failures  

- **HTML Asana Sections**  
  - Type: HTML node  
  - Role: Converts Asana sections data into an HTML table string for AI input  
  - Output: HTML string named `table`  
  - Failures: HTML conversion issues  

- **HTML Tasks Modified**  
  - Type: HTML node  
  - Role: Converts modified tasks data into an HTML table string  
  - Output: HTML string named `table`  
  - Failures: Same as above  

- **Asana Sections column name**  
  - Type: Set  
  - Role: Renames or assigns the HTML table string under the variable `asana_sections`  
  - Output: Sets the variable for merging later  

- **Tasks Modified column name**  
  - Type: Set  
  - Role: Similar to above, assigns HTML table string to `tasks_modified`  

---

#### 1.3 Slack Channel Data Collection

**Overview:**  
Retrieves Slack channel history and member details to understand team communications.

**Nodes Involved:**  
- Get Channel Details (Slack)  
- All Users on Channel (Slack)  
- Loop Over Channel Users (SplitInBatches)  
- Channel History (Slack)  
- Only Content For Analysis (Set)  
- HTML Channel History (HTML)  
- Channel History column name (Set)

**Node Details:**

- **Get Channel Details**  
  - Type: Slack node  
  - Role: Fetches details (e.g., members) of the specified Slack channel  
  - Parameters: `channelId` from input JSON  
  - Auth: Slack OAuth2  
  - Output: List of member IDs  
  - Failures: Channel not found, auth errors  

- **All Users on Channel**  
  - Type: Slack node  
  - Role: Fetches details for each member from the channel (user profiles)  
  - Uses member IDs from "Get Channel Details"  
  - Output: User profile info  
  - Failures: User not found, rate limits  

- **Loop Over Channel Users**  
  - Type: SplitInBatches  
  - Role: Processes each user individually for interaction  
  - Output: Sends individual user data downstream  

- **Channel History**  
  - Type: Slack node  
  - Role: Retrieves Slack channel messages from last 24 hours  
  - Parameters: `channelId` and `latest` filter to last day  
  - Output: Messages array  
  - Failures: Channel access denied, API rate limits  

- **Only Content For Analysis**  
  - Type: Set  
  - Role: Extracts just `user` and `text` fields from Slack messages to reduce payload  
  - Output: Simplified message content  

- **HTML Channel History**  
  - Type: HTML node  
  - Role: Converts Slack message content into an HTML table string for AI input  
  - Output: HTML string named `table`  

- **Channel History column name**  
  - Type: Set  
  - Role: Assigns HTML string to `channel_history` for merging  

---

#### 1.4 User Interaction for Daily Scrum Input

**Overview:**  
Sends daily Scrum Master questions to each team member via Slack and collects their answers.

**Nodes Involved:**  
- Get Scrum Master Answers (Slack)  
- Merge Users with Answers (Merge)  
- Only Users and their Answers (Set)  
- HTML User Answers (HTML)  
- Developer Answers column name (Set)

**Node Details:**

- **Get Scrum Master Answers**  
  - Type: Slack node  
  - Role: Sends a custom form to each user asking daily Scrum questions (e.g., sprint goal status, blockers)  
  - Parameters:  
    - Message text addressed to user real name  
    - Form fields: dropdown "Are you on track?" (Yes/No), text for blockers  
    - Waits for response synchronously  
  - Auth: Slack OAuth2  
  - Output: User responses  

- **Merge Users with Answers**  
  - Type: Merge  
  - Role: Combines user profiles and their responses by position for aligned data  
  - Output: Combined user data and answers  

- **Only Users and their Answers**  
  - Type: Set  
  - Role: Extracts user ID, name, and serialized answers for analysis  
  - Output: Simplified user answer dataset  

- **HTML User Answers**  
  - Type: HTML node  
  - Role: Converts user answers to an HTML table string for AI input  
  - Output: HTML string named `table`  

- **Developer Answers column name**  
  - Type: Set  
  - Role: Assigns HTML string to `developer_answears` (note: spelling preserved from original) for merging  

---

#### 1.5 Data Formatting and Preparation

**Overview:**  
Merges all collected data sources into a single combined dataset for the AI agent.

**Nodes Involved:**  
- Merge All Sources of Information (Merge)  
- Sticky Notes related to this block

**Node Details:**

- **Merge All Sources of Information**  
  - Type: Merge  
  - Role: Combines four inputs: Asana sections, tasks modified, Slack channel history, developer answers  
  - Mode: Combine by position, includes unpaired items  
  - Output: Single JSON object with all relevant fields for AI input  
  - Failures: Misaligned inputs may cause missing data  

---

#### 1.6 AI-Based Scrum Master Analysis

**Overview:**  
Uses a configured OpenAI language model to analyze the consolidated data and produce a Scrum Master report highlighting blockers, bottlenecks, and recommendations.

**Nodes Involved:**  
- Suggested Model: o4-mini (OpenAI LM Chat)  
- Virtual Scrum Master (LangChain Agent)  
- Sticky Notes describing the AI prompt and function

**Node Details:**

- **Suggested Model: o4-mini**  
  - Type: OpenAI LM Chat node  
  - Role: Provides the language model to be invoked by LangChain agent  
  - Model: "o4-mini" (custom or predefined smaller model)  
  - Credential: OpenAI API key  
  - Output: Language model responses  

- **Virtual Scrum Master**  
  - Type: LangChain Agent node  
  - Role: Defines prompt and calls the language model to analyze the input and generate report  
  - Prompt: Detailed instructions describing Scrum Master role, what to analyze, and expected output (blockers, bottlenecks, cooperation needs, overdue tasks, improvements)  
  - Input Variables: HTML tables and text from merged data  
  - Output: Text report in `output` field  
  - Failures: API rate limits, malformed prompt, input size limits  

---

#### 1.7 Reporting Back to Slack

**Overview:**  
Sends the AI-generated Scrum Master summary back to the designated Slack channel.

**Nodes Involved:**  
- Send Summary to Slack (Slack)

**Node Details:**

- **Send Summary to Slack**  
  - Type: Slack node  
  - Role: Posts the generated summary text to the Slack channel identified by `slack_channel_id`  
  - Input: AI output text  
  - Auth: Slack OAuth2  
  - Failures: Channel access denied, message length limits  

---

### 3. Summary Table

| Node Name                     | Node Type                          | Functional Role                          | Input Node(s)                              | Output Node(s)                              | Sticky Note                                                                                                        |
|-------------------------------|----------------------------------|----------------------------------------|-------------------------------------------|---------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’  | Manual Trigger                   | Manual start trigger                    | None                                      | Asana Project and Slack Channel             |                                                                                                                    |
| Every Workday Trigger          | Schedule Trigger                 | Scheduled workflow start                | None                                      | Asana Project and Slack Channel             |                                                                                                                    |
| Asana Project and Slack Channel| Set                             | Define project and Slack channel IDs   | When clicking ‘Test workflow’, Every Workday Trigger | Get Asana Project Sections, Tasks Modified Since Yesterday, Channel History, Get Channel Details |                                                                                                                    |
| Get Asana Project Sections     | HTTP Request                    | Retrieve Asana project sections         | Asana Project and Slack Channel           | Split Columns Manually                       |                                                                                                                    |
| Split Columns Manually         | Code                            | Simplify Asana sections data            | Get Asana Project Sections                 | HTML Asana Sections                          |                                                                                                                    |
| Tasks Modified Since Yesterday | Asana                           | Get tasks modified in last 24h          | Asana Project and Slack Channel            | Tasks Details                               |                                                                                                                    |
| Tasks Details                 | Asana                           | Get detailed info for each task         | Tasks Modified Since Yesterday              | Keep Details for Analysis                    |                                                                                                                    |
| Keep Details for Analysis      | Set                             | Extract relevant task fields            | Tasks Details                              | HTML Tasks Modified                          |                                                                                                                    |
| HTML Asana Sections            | HTML                            | Convert sections to HTML table          | Split Columns Manually                      | Asana Sections column name                   |                                                                                                                    |
| HTML Tasks Modified            | HTML                            | Convert tasks to HTML table             | Keep Details for Analysis                   | Tasks Modified column name                    |                                                                                                                    |
| Asana Sections column name     | Set                             | Rename HTML output as asana_sections    | HTML Asana Sections                        | Merge All Sources of Information              |                                                                                                                    |
| Tasks Modified column name     | Set                             | Rename HTML output as tasks_modified    | HTML Tasks Modified                        | Merge All Sources of Information              |                                                                                                                    |
| Get Channel Details            | Slack                           | Get Slack channel members               | Asana Project and Slack Channel            | All Users on Channel                         |                                                                                                                    |
| All Users on Channel           | Slack                           | Get user info for each channel member   | Get Channel Details                         | Loop Over Channel Users                      |                                                                                                                    |
| Loop Over Channel Users        | SplitInBatches                  | Process each user individually          | All Users on Channel                       | Merge Users with Answers, Get Scrum Master Answers |                                                                                                                    |
| Get Scrum Master Answers       | Slack                           | Send Scrum questions and get answers    | Loop Over Channel Users                     | Loop Over Channel Users (loop back)          |                                                                                                                    |
| Merge Users with Answers       | Merge                           | Combine user profiles with answers      | All Users on Channel, Loop Over Channel Users | Only Users and their Answers                 |                                                                                                                    |
| Only Users and their Answers   | Set                             | Simplify user answers for analysis      | Merge Users with Answers                    | HTML User Answers                            |                                                                                                                    |
| HTML User Answers              | HTML                            | Convert user answers to HTML table      | Only Users and their Answers                | Developer Answers column name                 |                                                                                                                    |
| Developer Answers column name  | Set                             | Rename HTML output as developer_answears| HTML User Answers                          | Merge All Sources of Information              |                                                                                                                    |
| Channel History               | Slack                           | Fetch Slack channel message history     | Asana Project and Slack Channel            | Only Content For Analysis                     |                                                                                                                    |
| Only Content For Analysis      | Set                             | Reduce Slack messages to user and text  | Channel History                            | HTML Channel History                         |                                                                                                                    |
| HTML Channel History           | HTML                            | Convert Slack messages to HTML table    | Only Content For Analysis                   | Channel History column name                   |                                                                                                                    |
| Channel History column name    | Set                             | Rename HTML output as channel_history   | HTML Channel History                       | Merge All Sources of Information              |                                                                                                                    |
| Merge All Sources of Information| Merge                          | Combine all HTML tables and answers     | Asana Sections column name, Tasks Modified column name, Channel History column name, Developer Answers column name | Virtual Scrum Master                         |                                                                                                                    |
| Suggested Model: o4-mini       | OpenAI LM Chat                  | Language model for AI analysis          | None (used by Virtual Scrum Master)        | Virtual Scrum Master (ai_languageModel input) |                                                                                                                    |
| Virtual Scrum Master           | LangChain Agent                 | Analyze combined data, generate report  | Merge All Sources of Information            | Send Summary to Slack                        |                                                                                                                    |
| Send Summary to Slack          | Slack                          | Post AI Scrum Master report to channel | Virtual Scrum Master                        | None                                        |                                                                                                                    |
| Sticky Note                   | Sticky Note                    | Slack app permissions note               | None                                      | None                                        | ## Slack app permissions - channels:history - chat:write - groups:history - im:history - mpim:history - users.profile:write - users:write |
| Sticky Note1                  | Sticky Note                    | Get Asana content for analysis note      | None                                      | None                                        | ## Get Asana content for analysis                                                                                   |
| Sticky Note2                  | Sticky Note                    | Ask Users Daily ScrumMaster Questions note | None                                      | None                                        | ## Ask Users Daily ScrumMaster Questions                                                                             |
| Sticky Note3                  | Sticky Note                    | Get Slack Channel Discussions note       | None                                      | None                                        | ## Get Slack Channel Discussions                                                                                      |
| Sticky Note4                  | Sticky Note                    | Select, prepare and parse Data note      | None                                      | None                                        | ## Select, prepare and parse Data                                                                                     |
| Sticky Note5                  | Sticky Note                    | Virtual Scrum Master section note        | None                                      | None                                        | ## Virtual Scrum Master section                                                                                        |
| Sticky Note6                  | Sticky Note                    | Change Scrum Master questions note       | None                                      | None                                        | ## Use this node to change Scrum Master questions                                                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes**  
   - Add a **Manual Trigger** node named "When clicking ‘Test workflow’". No parameters needed.  
   - Add a **Schedule Trigger** node named "Every Workday Trigger" with cron expression `0 0 9 * * 1-5` for 9 AM Monday-Friday.

2. **Set Project Context**  
   - Add a **Set** node "Asana Project and Slack Channel".  
   - Add two string fields: `slack_channel_id` (set to your Slack channel ID), `asana_project_id` (set to your Asana project ID).  
   - Connect both trigger nodes to this node.

3. **Retrieve Asana Project Sections**  
   - Add an **HTTP Request** node "Get Asana Project Sections".  
   - Set URL to `https://app.asana.com/api/1.0/projects/{{ $json.asana_project_id }}/sections`.  
   - Use Asana OAuth2 credentials.  
   - Connect from "Asana Project and Slack Channel".

4. **Parse Sections Data**  
   - Add a **Code** node "Split Columns Manually" with JavaScript code to extract `gid` and `name` from sections data.  
   - Connect from "Get Asana Project Sections".

5. **Fetch Tasks Modified Since Yesterday**  
   - Add an **Asana** node "Tasks Modified Since Yesterday" with operation "Get All".  
   - Filter by `project` = `asana_project_id` and `modified_since` = `{{$now.minus(1, 'day')}}`.  
   - Use Asana OAuth2 credentials.  
   - Connect from "Asana Project and Slack Channel".

6. **Get Details for Each Task**  
   - Add an **Asana** node "Tasks Details" with operation "Get" using `gid` from previous node.  
   - Use Asana OAuth2 credentials.  
   - Connect from "Tasks Modified Since Yesterday".

7. **Extract Relevant Task Fields**  
   - Add a **Set** node "Keep Details for Analysis".  
   - Extract fields: `assignee.name`, `completed` (string and boolean), `name`, `due_at`.  
   - Connect from "Tasks Details".

8. **Convert Asana Sections to HTML**  
   - Add an **HTML** node "HTML Asana Sections" with operation "Convert to HTML Table".  
   - Connect from "Split Columns Manually".

9. **Convert Modified Tasks to HTML**  
   - Add an **HTML** node "HTML Tasks Modified" with operation "Convert to HTML Table".  
   - Connect from "Keep Details for Analysis".

10. **Set HTML Variables for Asana Data**  
    - Add two **Set** nodes: "Asana Sections column name" and "Tasks Modified column name".  
    - Assign `asana_sections` and `tasks_modified` variables respectively with the HTML tables.  
    - Connect from "HTML Asana Sections" and "HTML Tasks Modified" respectively.

11. **Retrieve Slack Channel Details**  
    - Add a **Slack** node "Get Channel Details" with operation "Member" for `channelId` = `slack_channel_id`.  
    - Use Slack OAuth2 credentials.  
    - Connect from "Asana Project and Slack Channel".

12. **Fetch Each User Profile**  
    - Add a **Slack** node "All Users on Channel" with operation "Get User" by user ID from channel members.  
    - Use Slack OAuth2 credentials.  
    - Connect from "Get Channel Details".

13. **Split Users for Interaction**  
    - Add a **SplitInBatches** node "Loop Over Channel Users" to process each user individually.  
    - Connect from "All Users on Channel".

14. **Send Scrum Master Questions and Collect Answers**  
    - Add a **Slack** node "Get Scrum Master Answers" with operation "Send and Wait".  
    - Set channel ID from context.  
    - Configure form fields: dropdown for sprint goal status, text input for blockers.  
    - Use Slack OAuth2 credentials.  
    - Connect from "Loop Over Channel Users" (input index 0).  
    - Connect output back to "Loop Over Channel Users" (input index 1) for looping.

15. **Merge Users with Their Answers**  
    - Add a **Merge** node "Merge Users with Answers" in combine mode by position.  
    - Connect inputs from "All Users on Channel" and "Loop Over Channel Users" (output index 1).

16. **Simplify User Answers Data**  
    - Add a **Set** node "Only Users and their Answers".  
    - Extract `id`, `real_name` as `name`, and serialize answers JSON as `answers`.  
    - Connect from "Merge Users with Answers".

17. **Convert User Answers to HTML**  
    - Add an **HTML** node "HTML User Answers" to convert to HTML table.  
    - Connect from "Only Users and their Answers".

18. **Set Developer Answers Variable**  
    - Add a **Set** node "Developer Answers column name", assign `developer_answears` with HTML table.  
    - Connect from "HTML User Answers".

19. **Retrieve Slack Channel Message History**  
    - Add a **Slack** node "Channel History" with operation "History" for last 24 hours messages in `slack_channel_id`.  
    - Use Slack OAuth2 credentials.  
    - Connect from "Asana Project and Slack Channel".

20. **Reduce Slack Messages to User and Text**  
    - Add a **Set** node "Only Content For Analysis" to keep only `user` and `text` fields.  
    - Connect from "Channel History".

21. **Convert Slack Messages to HTML**  
    - Add an **HTML** node "HTML Channel History".  
    - Connect from "Only Content For Analysis".

22. **Set Channel History Variable**  
    - Add a **Set** node "Channel History column name" to assign `channel_history` variable.  
    - Connect from "HTML Channel History".

23. **Merge All Data Sources**  
    - Add a **Merge** node "Merge All Sources of Information" in combine mode by position with 4 inputs:  
      - From "Asana Sections column name"  
      - From "Tasks Modified column name"  
      - From "Channel History column name"  
      - From "Developer Answers column name"  

24. **Set Up OpenAI Model Node**  
    - Add an **LM Chat OpenAI** node "Suggested Model: o4-mini" with model "o4-mini".  
    - Add OpenAI API credentials.

25. **Configure LangChain Agent Node**  
    - Add a **LangChain Agent** node "Virtual Scrum Master".  
    - Set prompt to instruct as professional Scrum Master analyzing all input tables and text to report blockers, bottlenecks, overdue tasks, cooperation needs, and propose solutions.  
    - Use input variables from merged data.  
    - Connect AI model node "Suggested Model: o4-mini" as `ai_languageModel` input.

26. **Send Summary to Slack**  
    - Add a **Slack** node "Send Summary to Slack" to post AI output text to Slack channel `slack_channel_id`.  
    - Use Slack OAuth2 credentials.  
    - Connect from "Virtual Scrum Master".

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                  | Context or Link                                                                                             |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| Slack app requires the following OAuth scopes: `channels:history`, `chat:write`, `groups:history`, `im:history`, `mpim:history`, `users.profile:write`, `users:write`.           | Sticky Note attached near "When clicking ‘Test workflow’" node                                              |
| The node "Get Scrum Master Answers" form fields can be customized in the workflow to adapt Scrum questions as needed.                                                        | Sticky Note near "Loop Over Channel Users" and "Get Scrum Master Answers" nodes                             |
| The AI prompt is designed to simulate a professional Scrum Master analyzing multiple data sources to identify project issues and provide actionable recommendations.          | Sticky Note near "Virtual Scrum Master" node                                                                |
| This workflow depends on valid Asana and Slack OAuth2 credentials properly set up in n8n credentials manager. Ensure tokens have necessary permissions and are refreshed.    | General integration requirement                                                                             |
| The Slack "Send and Wait" operation may time out or fail if users do not respond; consider error handling or fallback mechanisms if used in production.                       | Potential edge case for user interaction block                                                             |
| HTML conversion nodes package data into tables for easier AI comprehension; changes in data format may require prompt adjustments.                                           | General design choice for AI input formatting                                                               |
| The workflow uses n8n version supporting LangChain agent nodes and OpenAI LM Chat nodes; verify compatibility if upgrading n8n or LangChain packages.                        | Version-specific node requirements                                                                          |

---

**Disclaimer:**  
The provided text is exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.

---