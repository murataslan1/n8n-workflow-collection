Automate Employee Onboarding with Slack, Jira, and Google Workspace Integration

https://n8nworkflows.xyz/workflows/automate-employee-onboarding-with-slack--jira--and-google-workspace-integration-3860


# Automate Employee Onboarding with Slack, Jira, and Google Workspace Integration

### 1. Workflow Overview

This workflow automates employee onboarding by integrating Slack, Jira, Google Workspace (Sheets, Drive, Gmail), and optionally HubSpot. It is designed for HR teams, startups, and remote-first companies to streamline the onboarding process from new hire data entry to task creation, folder sharing, email notification, and Slack messaging.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception**: Detects new hires either via Google Sheets updates or Slack user join events.
- **1.2 Data Extraction & Validation**: Cleans and extracts relevant new hire data for downstream processing.
- **1.3 Jira Onboarding Task Creation**: Creates a Jira Epic for the new hire and generates role-based subtasks.
- **1.4 Google Drive Folder Setup**: Creates and shares a personalized onboarding folder with the new hire.
- **1.5 Communication Delivery**: Sends a personalized welcome email via Gmail and posts Slack messages (channel + DM).
- **1.6 Logging & Status Update**: Logs onboarding progress and links back into Google Sheets.
- **1.7 Optional & Manual Subtask Configuration**: Allows manual setting or AI-assisted generation of subtasks based on role/team.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block triggers the workflow when a new hire is added or updated in Google Sheets or when a new user joins Slack.

- **Nodes Involved:**  
  - Google Sheets Trigger  
  - Slack Trigger (Activate on new Slack User)  
  - HubSpot Trigger (disabled)

- **Node Details:**  
  - **Google Sheets Trigger**  
    - Type: Trigger node monitoring Google Sheets for new or updated rows.  
    - Configuration: Watches a specific sheet for changes, filtering for hires marked as "Hired".  
    - Inputs: None (trigger).  
    - Outputs: New hire data row.  
    - Edge cases: Missing or malformed data, multiple simultaneous updates.  
  - **Slack Trigger (Activate on new Slack User)**  
    - Type: Slack event trigger for new team member join events.  
    - Configuration: Listens for `team_join` events.  
    - Inputs: None (trigger).  
    - Outputs: Slack user profile data.  
    - Edge cases: Slack API rate limits, incomplete user profiles.  
  - **HubSpot Trigger** (disabled)  
    - Type: Webhook trigger for HubSpot events.  
    - Disabled by default; can be enabled for HubSpot integration.

---

#### 1.2 Data Extraction & Validation

- **Overview:**  
  Extracts and sanitizes new hire data from triggers, preparing it for task creation and communication.

- **Nodes Involved:**  
  - If (conditional check)  
  - Extract & Clean Hire Data (Set node)  
  - Extract New Hire data (Set node)  
  - Merge (merges Slack and Jira data)  
  - Extract Needed Data (Set node)

- **Node Details:**  
  - **If**  
    - Type: Conditional node to check if the new hire status is "Hired".  
    - Configuration: Filters trigger data to proceed only for hires.  
    - Inputs: Google Sheets Trigger output.  
    - Outputs: True branch proceeds, false branch stops.  
    - Edge cases: Status field missing or misspelled.  
  - **Extract & Clean Hire Data**  
    - Type: Set node to normalize fields (role, team, email, notes, manager, fullName).  
    - Uses expressions to map raw data into consistent variables.  
  - **Extract New Hire data**  
    - Similar Set node for Slack trigger data, extracting email, real name, user ID.  
  - **Merge**  
    - Combines data from Slack and Jira user info for comprehensive hire profile.  
  - **Extract Needed Data**  
    - Final Set node extracting Jira ID, Slack ID, email, real name, and subtask keys for downstream use.

---

#### 1.3 Jira Onboarding Task Creation

- **Overview:**  
  Creates a Jira Epic for the new hire and generates subtasks based on role/team, either manually or via AI.

- **Nodes Involved:**  
  - Jira Software (create Epic)  
  - If1 (conditional for subtask creation method)  
  - Subtask Manual Setting (Set node)  
  - Task Splitter Code (Code node)  
  - Create Sub-tasks on Jira (Jira node)  
  - Aggregate (aggregates created subtasks)  
  - Get New Jira Account Id (HTTP Request)  
  - Merge (merges subtask data)  
  - Task Splitter Code1 (Code node)  
  - Create Sub-tasks for New Hire (Jira node)  
  - Aggregate1 (aggregates subtasks created for Slack messaging)

- **Node Details:**  
  - **Jira Software**  
    - Creates the main onboarding Epic issue in Jira using configured project and issue type IDs.  
    - Inputs: Cleaned hire data.  
    - Outputs: Jira issue ID and key.  
    - Edge cases: Jira API auth errors, invalid project/issue type IDs.  
  - **If1**  
    - Decides whether to create subtasks manually or via AI (manual is default).  
  - **Subtask Manual Setting**  
    - Set node defining manual subtasks with summaries and assignees.  
  - **Task Splitter Code**  
    - JavaScript code node that converts manual subtask definitions into Jira issue creation payloads.  
  - **Create Sub-tasks on Jira**  
    - Creates each subtask under the Epic in Jira.  
  - **Aggregate**  
    - Collects all created subtasks for further processing.  
  - **Get New Jira Account Id**  
    - HTTP Request node to fetch Jira user account ID for assignee mapping.  
  - **Task Splitter Code1**  
    - Code node preparing subtasks for Slack messaging with user IDs and summaries.  
  - **Create Sub-tasks for New Hire**  
    - Creates subtasks for Slack notification purposes.  
  - **Aggregate1**  
    - Aggregates subtasks for Slack messaging and logging.

---

#### 1.4 Google Drive Folder Setup

- **Overview:**  
  Creates a personalized onboarding folder on Google Drive, copies onboarding documents into it, and shares it with the new hire.

- **Nodes Involved:**  
  - Get Full Name (Set node)  
  - Create Onboarding Folder on Drive (Google Drive node)  
  - Copy Onboarding File to New Folder on Drive (Google Drive node)  
  - Share New Folder with New Hire's private email to start (Google Drive node)

- **Node Details:**  
  - **Create Onboarding Folder on Drive**  
    - Creates a new folder named with the new hire’s full name.  
    - Inputs: Full name from previous node.  
    - Outputs: Folder ID.  
    - Edge cases: Google Drive API quota limits, permission errors.  
  - **Copy Onboarding File to New Folder on Drive**  
    - Copies a template onboarding document into the new folder.  
  - **Share New Folder with New Hire's private email to start**  
    - Shares folder with the new hire’s email with owner or editor permissions.

---

#### 1.5 Communication Delivery

- **Overview:**  
  Sends a personalized welcome email via Gmail and posts messages in Slack channels and direct messages to the new hire.

- **Nodes Involved:**  
  - Write Welcome Email here (Set node)  
  - Gmail (Gmail node)  
  - Slack (Slack node)  
  - DM new hire via Slack (Slack node)

- **Node Details:**  
  - **Write Welcome Email here**  
    - Constructs an HTML-formatted email body with Jira task links and Drive folder link.  
    - Uses expressions to insert dynamic data like names and URLs.  
  - **Gmail**  
    - Sends the email using Gmail API or SMTP credentials.  
    - Edge cases: Auth failures, email delivery issues.  
  - **Slack**  
    - Posts a welcome message in the #onboarding Slack channel.  
  - **DM new hire via Slack**  
    - Sends a direct message to the new hire with onboarding task links and welcome text.

---

#### 1.6 Logging & Status Update

- **Overview:**  
  Logs onboarding status, Jira links, and Drive folder links back into Google Sheets for tracking.

- **Nodes Involved:**  
  - Get Drive & Jira links (Set node)  
  - Log to Sheets (Google Sheets node)  
  - Log "Onboarding started" (Google Sheets node)

- **Node Details:**  
  - **Get Drive & Jira links**  
    - Collects URLs for Jira Epic and Drive folder to log.  
  - **Log to Sheets**  
    - Updates the Google Sheet row with onboarding links and status.  
  - **Log "Onboarding started"**  
    - Writes a status update entry for the new hire.

---

#### 1.7 Optional & Manual Subtask Configuration

- **Overview:**  
  Provides flexibility for manual subtask definitions and future upgrades like AI-generated subtasks.

- **Nodes Involved:**  
  - Subtask Manual Setting (Set node)  
  - Sticky Notes (guidance and customization hints)

- **Node Details:**  
  - Manual subtask definitions are editable in the Set node.  
  - Sticky Notes provide color-coded guidance: green for main steps, blue for customization, yellow for optional logic, gray for final notes.

---

### 3. Summary Table

| Node Name                             | Node Type                      | Functional Role                          | Input Node(s)                      | Output Node(s)                        | Sticky Note                                                                                      |
|-------------------------------------|--------------------------------|----------------------------------------|----------------------------------|-------------------------------------|------------------------------------------------------------------------------------------------|
| Google Sheets Trigger                | Google Sheets Trigger          | Trigger on new hire data in Sheets     | None                             | If                                  | 🟩 Main automation step                                                                        |
| If                                  | If                           | Filter for hires with status "Hired"   | Google Sheets Trigger            | Extract & Clean Hire Data            | 🟩 Main automation step                                                                        |
| Extract & Clean Hire Data            | Set                          | Normalize and extract hire data        | If                              | Jira Software                       | 🟩 Main automation step                                                                        |
| Jira Software                       | Jira                         | Create Jira Epic for new hire           | Extract & Clean Hire Data        | If1                                | 🟩 Main automation step                                                                        |
| If1                                 | If                           | Choose manual or AI subtask creation   | Jira Software                   | Subtask Manual Setting               | 🟩 Main automation step                                                                        |
| Subtask Manual Setting               | Set                          | Define manual subtasks                  | If1                             | Task Splitter Code                   | 🟦 Customize subtasks here                                                                    |
| Task Splitter Code                  | Code                         | Prepare Jira subtask payloads           | Subtask Manual Setting           | Create Sub-tasks on Jira             | 🟦 Customize subtasks here                                                                    |
| Create Sub-tasks on Jira            | Jira                         | Create subtasks under Epic              | Task Splitter Code               | Aggregate                          | 🟩 Main automation step                                                                        |
| Aggregate                          | Aggregate                    | Aggregate created subtasks              | Create Sub-tasks on Jira         | Get Full Name                      |                                                                                                |
| Get Full Name                      | Set                          | Prepare full name for Drive folder      | Aggregate                      | Create Onboarding Folder on Drive   |                                                                                                |
| Create Onboarding Folder on Drive   | Google Drive                 | Create personalized onboarding folder   | Get Full Name                   | Copy Onboarding File to New Folder on Drive | 🟩 Main automation step                                                                        |
| Copy Onboarding File to New Folder on Drive | Google Drive                 | Copy onboarding docs into folder        | Create Onboarding Folder on Drive | Share New Folder with New Hire's private email to start |                                                                                                |
| Share New Folder with New Hire's private email to start | Google Drive                 | Share folder with new hire               | Copy Onboarding File to New Folder on Drive | Get Drive & Jira links              |                                                                                                |
| Get Drive & Jira links              | Set                          | Collect Jira and Drive URLs              | Share New Folder with New Hire's private email to start | Log to Sheets                     |                                                                                                |
| Log to Sheets                      | Google Sheets                | Log onboarding links and status          | Get Drive & Jira links          | None                              | 🟩 Main automation step                                                                        |
| Extract New Hire data               | Set                          | Extract Slack trigger user data          | Activate on new Slack User      | Slack, Get New Jira Account Id, Merge |                                                                                                |
| Slack                             | Slack                        | Post welcome message in #onboarding     | Extract New Hire data           | None                              | 🟩 Main automation step                                                                        |
| Get New Jira Account Id             | HTTP Request                 | Fetch Jira user account ID               | Extract New Hire data           | Set new hire sub-tasks manually here, Merge |                                                                                                |
| Merge                             | Merge                        | Combine data from Slack and Jira         | Slack, Get New Jira Account Id, Extract New Hire data | Extract Needed Data               |                                                                                                |
| Extract Needed Data                | Set                          | Extract IDs and keys for subtasks        | Merge                         | DM new hire via Slack, Log "Onboarding started", Read Sheet Data on Hire |                                                                                                |
| DM new hire via Slack              | Slack                        | Send direct welcome message to hire      | Extract Needed Data            | None                              | 🟩 Main automation step                                                                        |
| Log "Onboarding started"           | Google Sheets                | Log onboarding start status               | Extract Needed Data            | None                              |                                                                                                |
| Read Sheet Data on Hire            | Google Sheets                | Read updated hire data for email         | Extract Needed Data            | Write Welcome Email here            |                                                                                                |
| Write Welcome Email here           | Set                          | Compose personalized welcome email       | Read Sheet Data on Hire        | Gmail                             | 🟩 Main automation step                                                                        |
| Gmail                            | Gmail                        | Send welcome email                        | Write Welcome Email here       | None                              |                                                                                                |
| Task Splitter Code1                | Code                         | Prepare subtasks for Slack messaging      | Set new hire sub-tasks manually here | Create Sub-tasks for New Hire       |                                                                                                |
| Create Sub-tasks for New Hire      | Jira                         | Create subtasks for Slack notifications   | Task Splitter Code1            | Aggregate1                        |                                                                                                |
| Aggregate1                       | Aggregate                    | Aggregate subtasks for Slack messaging    | Create Sub-tasks for New Hire  | None                              |                                                                                                |
| Activate on new Slack User          | Slack Trigger                | Trigger on new Slack user join event      | None                         | Extract New Hire data              |                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Sheets Trigger node**  
   - Type: Google Sheets Trigger  
   - Configure to watch the onboarding sheet for new or updated rows.  
   - Filter rows where "Status" column equals "Hired".

2. **Add If node**  
   - Condition: Check if "Status" field equals "Hired".  
   - Connect Google Sheets Trigger → If (true branch).

3. **Add Set node "Extract & Clean Hire Data"**  
   - Map raw sheet fields to normalized variables: role, team, email, notes, manager, fullName.  
   - Connect If → Extract & Clean Hire Data.

4. **Add Jira node "Jira Software"**  
   - Configure credentials for Jira Cloud.  
   - Set to create an Epic issue in the onboarding project with new hire info.  
   - Connect Extract & Clean Hire Data → Jira Software.

5. **Add If node "If1"**  
   - Condition: Choose manual subtask creation (default).  
   - Connect Jira Software → If1 (true branch).

6. **Add Set node "Subtask Manual Setting"**  
   - Define subtasks summaries and assignees manually.  
   - Connect If1 → Subtask Manual Setting.

7. **Add Code node "Task Splitter Code"**  
   - JavaScript to convert manual subtasks into Jira issue creation payloads.  
   - Connect Subtask Manual Setting → Task Splitter Code.

8. **Add Jira node "Create Sub-tasks on Jira"**  
   - Create subtasks under the Epic using payloads from code node.  
   - Connect Task Splitter Code → Create Sub-tasks on Jira.

9. **Add Aggregate node**  
   - Aggregate created subtasks for further processing.  
   - Connect Create Sub-tasks on Jira → Aggregate.

10. **Add Set node "Get Full Name"**  
    - Prepare full name for folder naming.  
    - Connect Aggregate → Get Full Name.

11. **Add Google Drive node "Create Onboarding Folder on Drive"**  
    - Create a folder named "Onboarding: [Full Name]".  
    - Connect Get Full Name → Create Onboarding Folder on Drive.

12. **Add Google Drive node "Copy Onboarding File to New Folder on Drive"**  
    - Copy template onboarding document into new folder.  
    - Connect Create Onboarding Folder on Drive → Copy Onboarding File to New Folder on Drive.

13. **Add Google Drive node "Share New Folder with New Hire's private email to start"**  
    - Share folder with new hire’s email with appropriate permissions.  
    - Connect Copy Onboarding File to New Folder on Drive → Share New Folder with New Hire's private email to start.

14. **Add Set node "Get Drive & Jira links"**  
    - Collect Jira Epic and Drive folder URLs for logging.  
    - Connect Share New Folder with New Hire's private email to start → Get Drive & Jira links.

15. **Add Google Sheets node "Log to Sheets"**  
    - Update onboarding sheet row with Jira and Drive links and status.  
    - Connect Get Drive & Jira links → Log to Sheets.

16. **Add Slack Trigger node "Activate on new Slack User"**  
    - Listen for Slack `team_join` events.  
    - Extract user data on new join.

17. **Add Set node "Extract New Hire data"**  
    - Extract Slack user email, real name, and ID.  
    - Connect Slack Trigger → Extract New Hire data.

18. **Add Slack node "Slack"**  
    - Post welcome message in #onboarding channel.  
    - Connect Extract New Hire data → Slack.

19. **Add HTTP Request node "Get New Jira Account Id"**  
    - Query Jira API for user account ID using email.  
    - Connect Extract New Hire data → Get New Jira Account Id.

20. **Add Merge node**  
    - Combine Slack user data and Jira user account ID.  
    - Connect Slack, Get New Jira Account Id, and Extract New Hire data → Merge.

21. **Add Set node "Extract Needed Data"**  
    - Extract Jira ID, Slack ID, email, real name, and subtask keys.  
    - Connect Merge → Extract Needed Data.

22. **Add Slack node "DM new hire via Slack"**  
    - Send direct welcome message with onboarding task links.  
    - Connect Extract Needed Data → DM new hire via Slack.

23. **Add Google Sheets node "Log 'Onboarding started'"**  
    - Log onboarding start status for the new hire.  
    - Connect Extract Needed Data → Log "Onboarding started".

24. **Add Google Sheets node "Read Sheet Data on Hire"**  
    - Read updated hire data for email composition.  
    - Connect Extract Needed Data → Read Sheet Data on Hire.

25. **Add Set node "Write Welcome Email here"**  
    - Compose personalized HTML email with Jira and Drive links.  
    - Connect Read Sheet Data on Hire → Write Welcome Email here.

26. **Add Gmail node "Gmail"**  
    - Send welcome email via Gmail API or SMTP.  
    - Connect Write Welcome Email here → Gmail.

27. **Add Code node "Task Splitter Code1"**  
    - Prepare subtasks for Slack messaging.  
    - Connect Set new hire sub-tasks manually here → Task Splitter Code1.

28. **Add Jira node "Create Sub-tasks for New Hire"**  
    - Create subtasks for Slack notifications.  
    - Connect Task Splitter Code1 → Create Sub-tasks for New Hire.

29. **Add Aggregate node "Aggregate1"**  
    - Aggregate subtasks for Slack messaging and logging.  
    - Connect Create Sub-tasks for New Hire → Aggregate1.

30. **Credential Setup:**  
    - Slack OAuth2 credentials for Slack nodes and triggers.  
    - Google API credentials for Sheets, Drive, Gmail nodes.  
    - Jira Cloud API credentials for Jira nodes.  
    - Gmail API or SMTP credentials for email sending.

31. **Customization:**  
    - Replace placeholder IDs (Jira project, issue types, folder IDs).  
    - Customize onboarding messages, email HTML, and subtasks in Set and Code nodes.  
    - Optionally enable HubSpot trigger or AI subtask generation.

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                                                                 |
|-------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Workflow uses Innovatio’s sticky note system with color codes: 🟩 main steps, 🟦 customization, 🟨 optional logic, 🟫 final notes | Visual guidance embedded in workflow nodes                                                    |
| Template created by Velebit from Innovatio, designed for modularity and scalability              | Contact: velebit@innovatio.design                                                              |
| Commercial license applies for Gumroad purchase including extended rights                        | No affiliate or sponsored content                                                             |
| Suggested customizations: Airtable swap, Google Calendar check-ins, OpenAI for subtask generation, SlackBot reminders, Notion logging | Enhancements to extend workflow functionality                                                  |
| Official links only, no tracking                                                                | Ensures privacy and security                                                                   |
| Workflow includes mock data for quick testing and scaling                                       | Facilitates onboarding process validation                                                     |

---

This documentation provides a comprehensive understanding of the onboarding automation workflow, enabling users and AI agents to reproduce, customize, and troubleshoot the process effectively.