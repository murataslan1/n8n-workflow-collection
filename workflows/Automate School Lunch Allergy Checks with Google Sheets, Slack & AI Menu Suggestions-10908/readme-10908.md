Automate School Lunch Allergy Checks with Google Sheets, Slack & AI Menu Suggestions

https://n8nworkflows.xyz/workflows/automate-school-lunch-allergy-checks-with-google-sheets--slack---ai-menu-suggestions-10908


# Automate School Lunch Allergy Checks with Google Sheets, Slack & AI Menu Suggestions

### 1. Workflow Overview

This workflow automates the process of checking school lunch menus against student allergy data, sending allergy alerts to teachers via Slack, logging notifications for auditing, and generating AI-powered menu improvement reports for nutritionists. It is designed for school nutrition management teams aiming to enhance student safety and optimize menu planning.

The workflow is logically divided into the following blocks:

- **1.1 Data Ingestion & Formatting:** Reads and formats data from multiple Google Sheets (student allergies, monthly menus, and teacher lists).
- **1.2 Allergy Matching Logic:** Merges all formatted data and detects whether any student allergies match the scheduled menu items.
- **1.3 Notifications & Logging:** Sends basic allergy alerts to teachers on Slack and logs each alert in Google Drive.
- **1.4 AI-Powered Alerts:** Generates context-aware allergy warning messages using a language model (LLM) and sends enhanced alerts to Slack.
- **1.5 AI Menu Improvement Reporting:** Analyzes menu and allergy data via AI to propose risk assessments and alternative menus, then notifies nutritionists.
- **1.6 Error Handling:** Captures workflow errors and notifies administrators via Slack immediately.

---

### 2. Block-by-Block Analysis

#### 2.1 Data Ingestion & Formatting

**Overview:**  
This block retrieves data from Google Sheets that contain student allergy records, monthly lunch menus, and teacher contact information. It formats these datasets into structured JSON objects for downstream processing.

**Nodes Involved:**  
- Manual Trigger (The Initiator)  
- Read Student Allergy List  
- Read Monthly Menu  
- Read Teacher List  
- Format Student Data  
- Format Menu Data  
- Format Teacher Data  

**Node Details:**

- **Manual Trigger (The Initiator)**  
  - Type: Manual trigger node  
  - Role: Starts the workflow manually or via API trigger  
  - Inputs: None  
  - Outputs: Initiates parallel reads of Google Sheets  
  - Failure Modes: None (manual start)  

- **Read Student Allergy List**  
  - Type: Google Sheets  
  - Role: Reads allergy data for all students  
  - Configuration: Connected to a specific Google Sheet tab containing allergy data; uses OAuth2 credentials  
  - Inputs: Trigger from manual node  
  - Outputs: Raw student allergy rows  
  - Failure Modes: Authentication errors, sheet access issues, empty data  

- **Read Monthly Menu**  
  - Type: Google Sheets  
  - Role: Reads the school lunch menu data for the upcoming month  
  - Configuration: Google Sheet tab with menu recipes; OAuth2 credentials  
  - Inputs: Trigger from manual node  
  - Outputs: Raw menu rows  
  - Failure Modes: Same as above  

- **Read Teacher List**  
  - Type: Google Sheets  
  - Role: Reads teacher contact and class assignment information  
  - Configuration: Google Sheet tab with teacher data; OAuth2 credentials  
  - Inputs: Trigger from manual node  
  - Outputs: Raw teacher rows  
  - Failure Modes: Same as above  

- **Format Student Data**  
  - Type: Code node (JavaScript)  
  - Role: Wraps raw student allergy data into a JSON object with key `"students"`  
  - Key code: `return { "students": $input.all() };`  
  - Inputs: From Read Student Allergy List  
  - Outputs: Formatted student allergy JSON  
  - Failure Modes: Code syntax errors, empty input  

- **Format Menu Data**  
  - Type: Code node  
  - Role: Wraps raw monthly menu data into a JSON object with key `"menus"`  
  - Key code: `return { "menus": $input.all() };`  
  - Inputs: From Read Monthly Menu  
  - Outputs: Formatted menu JSON  
  - Failure Modes: Code errors, empty input  

- **Format Teacher Data**  
  - Type: Code node  
  - Role: Wraps raw teacher list into a JSON object with key `"teachers"`  
  - Key code: `return { "teachers": $input.all() };`  
  - Inputs: From Read Teacher List  
  - Outputs: Formatted teacher JSON  
  - Failure Modes: Code errors, empty input  

---

#### 2.2 Allergy Matching Logic

**Overview:**  
Combines the formatted student, menu, and teacher data into one dataset and checks if any student allergies match menu items scheduled for a given day. This determines whether alerts are necessary.

**Nodes Involved:**  
- Merge All Data  
- Check for Allergy Match  

**Node Details:**

- **Merge All Data**  
  - Type: Merge node  
  - Role: Combines the three JSON inputs (students, menus, teachers) into a single unified dataset  
  - Configuration: Set to accept 3 inputs (students, menus, teachers)  
  - Inputs: Format Student Data, Format Menu Data, Format Teacher Data  
  - Outputs: Merged dataset to allergy check  
  - Failure Modes: Mismatched data inputs, missing inputs  

- **Check for Allergy Match**  
  - Type: If node  
  - Role: Checks if any allergy matches exist by evaluating if the length of matched records is greater than zero  
  - Condition: `{{$json.length}} > 0`  
  - Inputs: Merged data  
  - Outputs: If true, branches to alert generation; else workflow ends or idles  
  - Failure Modes: Expression evaluation errors, empty merged data  

---

#### 2.3 Notifications & Logging (Basic)

**Overview:**  
Generates a templated allergy alert message for affected teachers and sends a basic Slack notification. It also logs the alert details to Google Drive for audit purposes.

**Nodes Involved:**  
- Compose Basic Alert Message  
- Send Basic Slack Alert  
- Log Alert to Google Drive  

**Node Details:**

- **Compose Basic Alert Message**  
  - Type: Set node  
  - Role: Constructs a basic alert message including teacher email, subject, student name, date, menu, allergen  
  - Key expressions use JSON fields such as `teacherEmail`, `className`, `studentName`, `date`, `menuName`, `allergen`  
  - Inputs: Allergy match data  
  - Outputs: Composed message object  
  - Failure Modes: Missing fields causing undefined values  

- **Send Basic Slack Alert**  
  - Type: Slack node  
  - Role: Sends a basic notification message to the teacher’s Slack user account  
  - Configuration: Uses Slack OAuth2 credentials, selects user by ID  
  - Message text example: "【給食アレルギー警告】{{ teacherName }}先生、ご確認ください。"  
  - Inputs: From Compose Basic Alert Message  
  - Outputs: Confirmation of Slack message sent  
  - Failure Modes: Slack API rate limits, authentication failure, invalid user ID  

- **Log Alert to Google Drive**  
  - Type: Google Drive node  
  - Role: Writes a text file to a specified folder logging the alert details with timestamp  
  - Configuration: Folder ID set to a dedicated audit folder; OAuth2 credentials used  
  - Content includes student info, menu, allergen, notification timestamp, teacher notified  
  - Inputs: From Send Basic Slack Alert  
  - Outputs: Log file created confirmation  
  - Failure Modes: Google Drive API errors, permissions issues  

---

#### 2.4 AI-Powered Alerts

**Overview:**  
Uses a language model (LLM) agent to generate contextually rich and concise allergy alert messages in JSON format, then sends enhanced Slack alerts based on the severity level.

**Nodes Involved:**  
- Generate AI Alert Message (LLM Agent)  
- Send AI Slack Alert  

**Node Details:**

- **Generate AI Alert Message**  
  - Type: LangChain AI Agent node  
  - Role: Receives student name, menu name, allergen, severity; outputs a JSON object with title and body for Slack message  
  - System prompt instructs the AI to act as an experienced school nutritionist generating JSON alerts  
  - Inputs: Allergy match data  
  - Outputs: JSON alert message with fields like "title", "body", "severity"  
  - Failure Modes: AI response timeouts, malformed JSON output  

- **Send AI Slack Alert**  
  - Type: Slack node  
  - Role: Sends AI-generated alert to teacher’s Slack user with prefix depending on severity (e.g., "🚨【最重要警告】" for high severity)  
  - Uses Slack OAuth2 credentials, selects user by ID  
  - Message text dynamically constructed with expressions referencing AI alert output  
  - Inputs: From Generate AI Alert Message  
  - Outputs: Slack message confirmation  
  - Failure Modes: Slack API issues, invalid severity or user data  

---

#### 2.5 AI Menu Improvement Reporting

**Overview:**  
Analyzes the combined menu and allergy data using an AI agent to produce a detailed markdown report with risk analysis and alternative menu suggestions. The report is sent to the nutritionist via Slack.

**Nodes Involved:**  
- Generate AI Menu Report (LLM Agent)  
- Send AI Menu Report to Slack  

**Node Details:**

- **Generate AI Menu Report**  
  - Type: LangChain AI Agent node  
  - Role: Deeply analyzes two datasets (menu proposals and student allergies); performs risk analysis, identifies high-risk days, and proposes alternative menus  
  - System prompt defines tasks and markdown output format for actionable report  
  - Inputs: Allergy and menu data (from Check for Allergy Match node)  
  - Outputs: Markdown formatted menu improvement report  
  - Failure Modes: AI timeouts, large input data causing truncation, malformed markdown  

- **Send AI Menu Report to Slack**  
  - Type: Slack node  
  - Role: Notifies nutritionist that the AI analysis report is ready  
  - Uses Slack OAuth2 credentials, selects nutritionist user by ID  
  - Message text: "【献立改善レポート】AI賢者の分析が完了しました。"  
  - Inputs: From Generate AI Menu Report  
  - Outputs: Slack message confirmation  
  - Failure Modes: Slack API issues  

---

#### 2.6 Error Handling

**Overview:**  
Monitors workflow execution for errors and triggers an immediate Slack alert to notify administrators, ensuring rapid response to failures.

**Nodes Involved:**  
- On Workflow Error (Error Trigger)  
- Send Error Alert to Slack  

**Node Details:**

- **On Workflow Error**  
  - Type: Error Trigger node  
  - Role: Listens for any node failure during workflow execution  
  - Inputs: None; triggers automatically on errors  
  - Outputs: Error details passed to Slack alert node  
  - Failure Modes: None (designed to capture errors)  

- **Send Error Alert to Slack**  
  - Type: Slack node  
  - Role: Sends detailed error notification including node name, error message, timestamp, workflow name, and execution ID  
  - Uses Slack OAuth2 credentials, selects admin user by ID  
  - Inputs: From On Workflow Error node  
  - Outputs: Slack confirmation  
  - Failure Modes: Slack API failure, missing error info  

---

### 3. Summary Table

| Node Name                 | Node Type                          | Functional Role                              | Input Node(s)                     | Output Node(s)                        | Sticky Note                                                                                                  |
|---------------------------|----------------------------------|----------------------------------------------|----------------------------------|-------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Manual Trigger (The Initiator) | Manual Trigger                   | Workflow entry point                          | None                             | Read Student Allergy List, Read Monthly Menu, Read Teacher List | ## 📥 Data Ingestion & Formatting<br>Reads Menu, Student, and Teacher data from Google Sheets and formats them for processing.<br>*Note: Update the Sheet nodes with your specific file IDs.* |
| Read Student Allergy List | Google Sheets                    | Reads student allergy data                    | Manual Trigger                   | Format Student Data                  | See above                                                                                                    |
| Read Monthly Menu         | Google Sheets                    | Reads monthly menu data                        | Manual Trigger                   | Format Menu Data                    | See above                                                                                                    |
| Read Teacher List         | Google Sheets                    | Reads teacher contact data                     | Manual Trigger                   | Format Teacher Data                  | See above                                                                                                    |
| Format Student Data       | Code                            | Formats student allergy data                   | Read Student Allergy List        | Merge All Data                     | See above                                                                                                    |
| Format Menu Data          | Code                            | Formats monthly menu data                       | Read Monthly Menu                | Merge All Data                     | See above                                                                                                    |
| Format Teacher Data       | Code                            | Formats teacher list data                       | Read Teacher List                | Merge All Data                     | See above                                                                                                    |
| Merge All Data            | Merge                          | Combines all formatted data                     | Format Student Data, Format Menu Data, Format Teacher Data | Check for Allergy Match             | ## 🧠 Logic & Matching<br>Combines the datasets and checks if any student has an allergy to the scheduled menu ingredients. Matches flow to the alert branches. |
| Check for Allergy Match   | If                             | Allergy detection condition                     | Merge All Data                  | Compose Basic Alert Message, Generate AI Alert Message, Generate AI Menu Report | See above                                                                                                    |
| Compose Basic Alert Message | Set                            | Builds basic allergy alert message              | Check for Allergy Match         | Send Basic Slack Alert             | ## 📨 Standard Notification & Logging<br>Sends a template-based warning to the teacher and logs the incident details to Google Drive for audit records. |
| Send Basic Slack Alert    | Slack                          | Sends basic allergy alert to teacher via Slack | Compose Basic Alert Message     | Log Alert to Google Drive          | See above                                                                                                    |
| Log Alert to Google Drive | Google Drive                   | Logs alert details for auditing                  | Send Basic Slack Alert          | None                             | See above                                                                                                    |
| Generate AI Alert Message | LangChain AI Agent             | Creates AI-enhanced allergy alert message       | Check for Allergy Match         | Send AI Slack Alert               | ## 🤖 AI Agents (Alerts & Reports)<br>Uses an LLM to generate context-aware warnings for teachers and a strategic menu improvement report for the nutritionist. |
| Send AI Slack Alert       | Slack                          | Sends AI-generated allergy alert to teacher     | Generate AI Alert Message       | None                             | See above                                                                                                    |
| Generate AI Menu Report   | LangChain AI Agent             | Generates AI report analyzing menu & allergy data | Check for Allergy Match         | Send AI Menu Report to Slack      | See above                                                                                                    |
| Send AI Menu Report to Slack | Slack                          | Notifies nutritionist of AI menu report ready   | Generate AI Menu Report         | None                             | See above                                                                                                    |
| On Workflow Error         | Error Trigger                  | Captures workflow failures                       | None                           | Send Error Alert to Slack         | ## 🛡️ Error Handling<br>Captures any workflow failures and instantly notifies the admin via Slack to ensure system reliability. |
| Send Error Alert to Slack | Slack                          | Sends error details to admin via Slack           | On Workflow Error               | None                             | See above                                                                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node** named "Manual Trigger (The Initiator)" to start the workflow manually.

2. **Create three Google Sheets nodes:**

   - **Read Student Allergy List:**  
     - Set operation to "Read Rows" from your student allergy sheet tab.  
     - Configure Google Sheets OAuth2 credentials.  
     - Specify the Sheet ID and the tab name containing allergy data.

   - **Read Monthly Menu:**  
     - Read Rows from the monthly menu sheet tab.  
     - Use the same Google Sheets OAuth2 credentials.  
     - Specify the Sheet ID and tab name.

   - **Read Teacher List:**  
     - Read Rows from the teacher list sheet tab.  
     - Use the same Google Sheets OAuth2 credentials.  
     - Specify the Sheet ID and tab name.

3. **Connect the Manual Trigger node outputs to each of the three Google Sheets nodes** to run them in parallel upon trigger.

4. **Add three Code nodes to format data:**

   - **Format Student Data:**  
     - JavaScript code: `return { "students": $input.all() };`  
     - Connect input from Read Student Allergy List.

   - **Format Menu Data:**  
     - JavaScript code: `return { "menus": $input.all() };`  
     - Connect input from Read Monthly Menu.

   - **Format Teacher Data:**  
     - JavaScript code: `return { "teachers": $input.all() };`  
     - Connect input from Read Teacher List.

5. **Add a Merge node named "Merge All Data":**  
   - Set "Number of Inputs" to 3.  
   - Connect inputs from the three Format nodes (Student, Menu, Teacher).

6. **Add an If node named "Check for Allergy Match":**  
   - Condition: Expression `{{$json.length}} > 0` (number of allergy matches greater than zero).  
   - Connect input from Merge All Data.

7. **For the "true" branch (allergy matches found), add the following nodes:**

   - **Compose Basic Alert Message (Set node):**  
     - Assign fields for `teacher_email`, `subject`, `message` using expressions referencing allergy data fields such as `className`, `studentName`, `date`, `menuName`, `allergen`.  
     - Connect input from Check for Allergy Match.

   - **Send Basic Slack Alert (Slack node):**  
     - Configure Slack OAuth2 credentials.  
     - Set message text like `"【給食アレルギー警告】{{ $json.teacherName }}先生、ご確認ください。"`  
     - Choose user by Slack user ID.  
     - Connect input from Compose Basic Alert Message.

   - **Log Alert to Google Drive (Google Drive node):**  
     - Configure Google Drive OAuth2 credentials.  
     - Set operation to "Create from Text".  
     - Specify the folder ID for audit logs.  
     - Content: Template text logging alert details with timestamp and student/menu info.  
     - Connect input from Send Basic Slack Alert.

   - **Generate AI Alert Message (LangChain AI Agent node):**  
     - Provide system prompt instructing AI to generate JSON formatted alert messages for teachers.  
     - Inputs include allergy and menu data fields.  
     - Connect input from Check for Allergy Match.

   - **Send AI Slack Alert (Slack node):**  
     - Configure Slack OAuth2 credentials.  
     - Text message dynamically changes prefix based on severity field from AI output (`'🚨【最重要警告】'` for high severity).  
     - Choose user by Slack user ID.  
     - Connect input from Generate AI Alert Message.

   - **Generate AI Menu Report (LangChain AI Agent node):**  
     - Provide system prompt for AI to analyze menu and allergy data and generate a markdown report with risk analysis and improvement proposals.  
     - Connect input from Check for Allergy Match.

   - **Send AI Menu Report to Slack (Slack node):**  
     - Configure Slack OAuth2 credentials.  
     - Send a notification to the nutritionist that the AI menu report is ready.  
     - Connect input from Generate AI Menu Report.

8. **Add an Error Trigger node named "On Workflow Error":**  
   - Configure to capture any workflow failures.

9. **Add a Slack node named "Send Error Alert to Slack":**  
   - Configure Slack OAuth2 credentials.  
   - Compose detailed error alert message including node name, error message, timestamp, workflow and execution IDs.  
   - Connect input from On Workflow Error node.

10. **Ensure all Slack nodes use OAuth2 authentication with valid credentials and proper user/channel selections.**

11. **Replace all Google Sheets and Google Drive IDs with your actual document IDs and folder IDs.**

12. **Test the workflow manually using the Manual Trigger node and verify:**

    - Data reads correctly from Sheets.  
    - Alerts are sent to Slack users.  
    - Logs appear in Google Drive folder.  
    - AI-generated messages are appropriate and correctly formatted.  
    - Errors trigger Slack notifications.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                          | Context or Link                                                                                   |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| This workflow automates allergy checks for school lunches by cross-referencing menu items with student allergy records to prevent incidents and suggests safer menu alternatives using AI. Key features include auto-detection, dual alert systems, AI menu analysis, and audit logging. Setup requires Google (Sheets/Drive) and Slack OAuth2 credentials.                                                                                  | Sticky Note on workflow introduction                                                            |
| Slack user IDs and Google Sheet document/tab IDs must be updated to match your actual environment for correct operation.                                                                                                                                                                                                                                                                                                            | Critical setup instruction                                                                       |
| AI agents use LangChain integration with OpenRouter Chat Model and a custom system prompt to simulate an experienced school nutritionist for generating alerts and reports.                                                                                                                                                                                                                                                           | AI configuration detail                                                                          |
| The Google Drive log folder is named "School Lunch Allergy Check & Notification System, 'The Ironclad Guardian'". Ensure write permissions are granted for the OAuth2 Drive account.                                                                                                                                                                                                                                                  | Google Drive audit logging setup                                                                |
| In case of workflow errors, immediate Slack notifications are sent to the designated admin user to ensure rapid intervention and system reliability.                                                                                                                                                                                                                                                                               | Error handling note                                                                             |
| Slack authentication uses OAuth2 with user selection to send direct messages. Ensure the OAuth2 app has the necessary scopes for chat:write and users:read.                                                                                                                                                                                                                                                                         | Slack credential and permission requirements                                                    |
| The AI menu improvement report output is formatted in Markdown for easy reading and action by nutritionists, including risk summaries and alternative menu proposals.                                                                                                                                                                                                                                                               | AI output formatting guideline                                                                  |
| Video or blog resources on integrating n8n with Google Sheets, Slack, and AI agents may facilitate understanding: e.g., n8n official docs and LangChain tutorials.                                                                                                                                                                                                                                                                   | Suggested external resources for learning                                                       |

---

**Disclaimer:** The provided content is exclusively derived from an n8n automated workflow and complies with all relevant content policies. It processes only legal and public data without any illegal or protected elements.