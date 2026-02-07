Automate Task Deadline Reminders with Google Sheets and Gmail (Today/3-Day/7-Day)

https://n8nworkflows.xyz/workflows/automate-task-deadline-reminders-with-google-sheets-and-gmail--today-3-day-7-day--10825


# Automate Task Deadline Reminders with Google Sheets and Gmail (Today/3-Day/7-Day)

### 1. Workflow Overview

This workflow automates task deadline reminders using Google Sheets and Gmail. It targets teams and organizations managing multiple deadlines in spreadsheets and needing timely notifications to avoid missed tasks. The workflow runs every morning at 9:00, fetches all tasks from a Google Sheets spreadsheet, evaluates each task’s deadline against today’s date, the next 3 days, and the next 7 days, then sends customized email notifications to the responsible individuals based on urgency.

Logical blocks:
- **1.1 Schedule Trigger**: Automatically runs the workflow every day at 9:00 AM.
- **1.2 Fetch Tasks from Google Sheets**: Loads all task data including task name, deadline, assignee, and email address.
- **1.3 Loop Over Tasks**: Processes each task row individually.
- **1.4 Deadline Checks**: Three conditional checks determine if the task is due today, within 3 days, or within 7 days.
- **1.5 Email Notifications**: Sends Gmail reminders for tasks due today, within 3 days, or within 7 days.
- **1.6 Loop Continuation**: Ensures the workflow cycles through all tasks until complete.

---

### 2. Block-by-Block Analysis

#### 1.1 Schedule Trigger  
- **Overview:** Triggers the workflow daily at 9:00 AM to perform automated deadline checks.  
- **Nodes Involved:** Schedule Trigger  
- **Node Details:**  
  - Type: Schedule Trigger  
  - Configuration: Set to trigger every day at hour 9 (9:00 AM)  
  - Input/Output: No input; output triggers “Get row(s) in sheet” node  
  - Edge cases: If the n8n instance is offline at trigger time, execution will be delayed or missed  
  - Version: 1.2

#### 1.2 Fetch Tasks from Google Sheets  
- **Overview:** Retrieves the full list of tasks from a specified Google Sheets document and sheet.  
- **Nodes Involved:** Get row(s) in sheet  
- **Node Details:**  
  - Type: Google Sheets node  
  - Configuration: Reads from the first sheet (gid=0) of the spreadsheet with ID `14s5wt4rWj8pPn9kbpirrhX3wU2s5x8T_JEvj3uQlI1U`  
  - Credentials: Google Sheets OAuth2 named “n8n中級”  
  - Input: Triggered by Schedule Trigger  
  - Output: Outputs all rows as JSON array for iteration  
  - Edge cases: Authorization failure, API rate limits, empty or malformed sheets  
  - Version: 4.7

#### 1.3 Loop Over Tasks  
- **Overview:** Iterates through each task row to evaluate deadlines individually.  
- **Nodes Involved:** Loop Over Items (SplitInBatches)  
- **Node Details:**  
  - Type: SplitInBatches node  
  - Configuration: Default batch size (processes tasks one by one)  
  - Input: Receives all rows from Google Sheets node  
  - Output: Sends one item at a time to “Check Due Today (IF)” node  
  - Edge cases: Empty input dataset results in no execution downstream  
  - Version: 3

#### 1.4 Deadline Checks  
- **Overview:** Contains three If nodes checking if the task deadline matches today, falls within 3 days, or within 7 days. These conditions route the workflow accordingly.  
- **Nodes Involved:** Check Due Today (IF), 3日以内 (3-Day IF), Check Within 7 Days (IF)  
- **Node Details:**  
  - **Check Due Today (IF)**  
    - Type: If node  
    - Condition: Task deadline string equals today’s date (calculated with timezone offset +9h)  
    - Input: From Loop Over Items (false path)  
    - Output: True → Send Today Reminder (Gmail) (not explicitly present in this workflow, likely routed back to loop), False → 3日以内 node  
    - Edge cases: Date format mismatch, timezone issues causing false negatives  
    - Version: 2.2  

  - **3日以内 (3-Day IF)**  
    - Type: If node  
    - Condition: Task deadline timestamp >= today 00:00 and <= today + 3 days 00:00  
    - Input: From Check Due Today (IF) false branch  
    - Output: True → Send 3-Day Reminder (Gmail), False → Check Within 7 Days (IF)  
    - Edge cases: Timestamp conversion errors, missing deadline field  
    - Version: 2.2  

  - **Check Within 7 Days (IF)**  
    - Type: If node  
    - Condition: Task deadline timestamp >= today 00:00 and <= today + 7 days 00:00  
    - Input: From 3日以内 node false branch  
    - Output: True → Send 7-Day Reminder (Gmail), False → Loop Over Items (to process next task)  
    - Edge cases: Same as 3-Day IF node, plus potential logical overlap if deadlines are not normalized  
    - Version: 2.2

#### 1.5 Email Notifications  
- **Overview:** Sends email reminders to the responsible person with task details based on urgency level.  
- **Nodes Involved:** Send 3-Day Reminder (Gmail), Send 7-Day Reminder (Gmail)  
- **Node Details:**  
  - **Send 3-Day Reminder (Gmail)**  
    - Type: Gmail node  
    - Configuration: Sends email to the address in “メールアドレス” field, subject “タスク期限が三日前となりました”, message includes task name, deadline, and assignee  
    - Credentials: Gmail OAuth2 “n8n中級”  
    - Input: From 3日以内 node true branch  
    - Output: Loops back to Loop Over Items  
    - Edge cases: Gmail API limits, invalid email addresses, auth errors  
    - Version: 2.1  

  - **Send 7-Day Reminder (Gmail)**  
    - Type: Gmail node  
    - Configuration: Similar to 3-Day Reminder but subject “タスクの期限が一週間以内です”  
    - Credentials: Same as above  
    - Input: From Check Within 7 Days node true branch  
    - Output: Loops back to Loop Over Items  
    - Edge cases: Same as above  
    - Version: 2.1  

**Note:** The workflow does not explicitly show a “Send Today Reminder” Gmail node, but based on sticky notes and flow logic, it is likely intended or could be added similarly.

#### 1.6 Loop Continuation  
- **Overview:** After each notification or check, the workflow loops back to process the next task until all rows are handled.  
- **Nodes Involved:** Loop Over Items (SplitInBatches), If nodes routing outputs back  
- **Node Details:**  
  - The main output paths from each condition and email node loop back into “Loop Over Items” node input  
  - Ensures continuous processing until no more tasks remain  
  - Edge cases: Infinite loops if conditions or connections misconfigured

---

### 3. Summary Table

| Node Name              | Node Type           | Functional Role                             | Input Node(s)            | Output Node(s)                  | Sticky Note                                                                                                                        |
|------------------------|---------------------|---------------------------------------------|--------------------------|---------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger       | Schedule Trigger    | Triggers workflow every day at 9:00 AM      | (none)                   | Get row(s) in sheet             | Runs the workflow every morning at the specified time so task deadlines are checked automatically without manual execution.     |
| Get row(s) in sheet    | Google Sheets       | Fetches all task rows from Google Sheets    | Schedule Trigger          | Loop Over Items                 | Loads all task records from the Google Sheets task table, including task name, deadline, person in charge, and email address.    |
| Loop Over Items        | SplitInBatches      | Iterates over each task individually         | Get row(s) in sheet       | Check Due Today (IF)            | Iterates through each task row one by one so the workflow can evaluate deadlines individually.                                    |
| Check Due Today (IF)   | If                  | Checks if task deadline is today             | Loop Over Items           | Loop Over Items, 3日以内        | Checks whether the task deadline matches today’s date to identify tasks that are due today and require immediate notification.    |
| 3日以内                | If                  | Checks if task deadline is within 3 days    | Check Due Today (IF)      | Send 3-Day Reminder, Check Within 7 Days (IF) | Determines whether the task deadline falls within the next three days, allowing early reminders before the final due date.        |
| Check Within 7 Days (IF) | If                | Checks if task deadline is within 7 days    | 3日以内                   | Send 7-Day Reminder, Loop Over Items | Checks if the task deadline is within seven days from today to provide weekly reminder notifications.                            |
| Send 3-Day Reminder (Gmail)  | Gmail           | Sends 3-day reminder email to assignee      | 3日以内                   | Loop Over Items                | Sends an email to notify the responsible person that the task deadline is approaching within three days.                         |
| Send 7-Day Reminder (Gmail)  | Gmail           | Sends 7-day reminder email to assignee      | Check Within 7 Days (IF)  | Loop Over Items                | Sends a weekly deadline reminder email to the assigned person for tasks that are due within the next seven days.                 |
| Sticky Note            | Sticky Note         | Explanatory notes for Schedule Trigger      | (none)                   | (none)                        | Runs the workflow every morning at the specified time so task deadlines are checked automatically without manual execution.     |
| Sticky Note1           | Sticky Note         | Overview and detailed description of workflow | (none)                   | (none)                        | See detailed workflow description including purpose, use cases, and setup instructions.                                          |
| Sticky Note2           | Sticky Note         | Explains fetching tasks from Google Sheets  | (none)                   | (none)                        | Loads all task records from the Google Sheets task table, including task name, deadline, person in charge, and email address.    |
| Sticky Note3           | Sticky Note         | Explains looping over task items             | (none)                   | (none)                        | Iterates through each task row one by one so the workflow can evaluate deadlines individually.                                    |
| Sticky Note4           | Sticky Note         | Explains Check Due Today condition           | (none)                   | (none)                        | Checks whether the task deadline matches today’s date to identify tasks that are due today and require immediate notification.    |
| Sticky Note5           | Sticky Note         | Explains sending reminder email for today   | (none)                   | (none)                        | Sends an email to the responsible person informing them that their task is due today, including task details and assignee info.  |
| Sticky Note6           | Sticky Note         | Explains Check Within 3 Days condition       | (none)                   | (none)                        | Determines whether the task deadline falls within the next three days, allowing early reminders before the final due date.        |
| Sticky Note7           | Sticky Note         | Explains sending 3-day reminder email        | (none)                   | (none)                        | Sends an email to notify the responsible person that the task deadline is approaching within three days.                         |
| Sticky Note8           | Sticky Note         | Explains Check Within 7 Days condition       | (none)                   | (none)                        | Checks if the task deadline is within seven days from today to provide weekly reminder notifications.                            |
| Sticky Note9           | Sticky Note         | Explains sending 7-day reminder email        | (none)                   | (none)                        | Sends a weekly deadline reminder email to the assigned person for tasks that are due within the next seven days.                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set to trigger daily at 9:00 AM (triggerAtHour: 9)  
   - No credentials needed  
   - Connect output to next node

2. **Create Google Sheets Node to Get Rows**  
   - Type: Google Sheets  
   - Operation: Get rows from sheet  
   - Credentials: Setup Google Sheets OAuth2 with appropriate permission  
   - Document ID: `14s5wt4rWj8pPn9kbpirrhX3wU2s5x8T_JEvj3uQlI1U` (replace with your own)  
   - Sheet Name: Use sheet gid=0 or actual sheet name  
   - Connect input to Schedule Trigger output  
   - Output goes to Loop Over Items node

3. **Create Loop Over Items Node (SplitInBatches)**  
   - Type: SplitInBatches  
   - Default batch size 1 (process one task at a time)  
   - Connect input to Google Sheets node output  
   - Output goes to “Check Due Today (IF)” node

4. **Create “Check Due Today” If Node**  
   - Type: If node  
   - Condition: Check if task deadline field (`期限`) string equals today’s date string (adjusted to JST +9h)  
   - Expression example: `{{$json["期限"]}} === (new Date(Date.now() + 9*60*60*1000).toISOString().split("T")[0])`  
   - Connect input to Loop Over Items output  
   - True branch: (Ideally) send “Today Reminder” email node (not present in original, optional)  
   - False branch: connect to 3-Day If node

5. **Create “3日以内 (3-Day)” If Node**  
   - Type: If node  
   - Condition: Task deadline timestamp >= today 00:00 and <= today + 3 days 00:00  
   - Expression example:  
     - Left: `new Date($json["期限"]).getTime()`  
     - Right min: `new Date().setHours(0,0,0,0)`  
     - Right max: `new Date().setHours(0,0,0,0) + 3*24*60*60*1000`  
   - Connect input from “Check Due Today” false branch  
   - True branch: Send 3-Day Reminder Gmail node  
   - False branch: Connect to Check Within 7 Days node

6. **Create “Check Within 7 Days” If Node**  
   - Type: If node  
   - Condition: Task deadline timestamp >= today 00:00 and <= today + 7 days 00:00  
   - Expressions similar to 3-Day node but max 7 days  
   - Connect input from 3-Day node false branch  
   - True branch: Send 7-Day Reminder Gmail node  
   - False branch: Connect back to Loop Over Items to process next task

7. **Create “Send 3-Day Reminder” Gmail Node**  
   - Type: Gmail  
   - Credentials: Gmail OAuth2 setup with sending account  
   - To: `{{$json["メールアドレス"]}}`  
   - Subject: “タスク期限が三日前となりました”  
   - Message: Combine task name, deadline, and assignee fields, e.g.  
     `{{$json["タスク"]}}\n{{$json["期限"]}}\n{{$json["担当"]}}`  
   - Connect input from 3-Day If node true branch  
   - Output connects back to Loop Over Items

8. **Create “Send 7-Day Reminder” Gmail Node**  
   - Type: Gmail  
   - Credentials: Same as 3-Day reminder  
   - To: `{{$json["メールアドレス"]}}`  
   - Subject: “タスクの期限が一週間以内です”  
   - Message: Similar concatenation of fields  
   - Connect input from 7-Day If node true branch  
   - Output connects back to Loop Over Items

9. **(Optional) Create “Send Today Reminder” Gmail Node**  
   - If desired, add a Gmail node for tasks due today with subject “本日が締め切りです” and similar message content  
   - Connect input from Check Due Today true branch  
   - Output connects back to Loop Over Items

10. **Final Loop Handling**  
    - Ensure all false branches from conditions and email nodes connect back to Loop Over Items for processing next task  
    - When no tasks remain, workflow ends automatically

11. **Credentials Setup**  
    - Google Sheets OAuth2 credentials with read access to the specified spreadsheet  
    - Gmail OAuth2 credentials for sending email with required scopes

12. **Data Preparation**  
    - Spreadsheet must have columns:  
      - タスク (Task name)  
      - 期限 (Deadline in ISO date format or consistent date string)  
      - 担当 (Assignee)  
      - メールアドレス (Email address)  

---

### 5. General Notes & Resources

| Note Content                                                                                                                               | Context or Link                                                                                                                         |
|--------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| This workflow automates task deadline reminders for teams relying on spreadsheets and email notifications, reducing manual follow-up.      | Workflow description sticky note included in the workflow for comprehensive explanation.                                                |
| Recommended to customize or extend with Slack, Chatwork, or LINE notifications, overdue detection, priority sorting, or summary reports.    | See “How to customize” section in workflow description.                                                                                 |
| Requires n8n instance with Google Sheets API and Gmail API OAuth2 credentials properly configured.                                           | Credentials must have appropriate scopes and permissions for reading sheets and sending emails.                                          |
| Timezone is handled with a +9 hours offset to align with JST (Japan Standard Time). Adjust if using other time zones.                      | Expressions in If nodes use timezone offset for date comparison.                                                                         |
| Google Sheets columns must be consistent and contain valid date formats for correct deadline evaluation.                                    | Date parsing relies on ISO date strings or compatible formats in the “期限” field.                                                       |

---

**Disclaimer:** The text above is generated exclusively from an automated n8n workflow export. It strictly complies with content policies and contains no illegal or offensive elements. All data manipulated is legal and public.