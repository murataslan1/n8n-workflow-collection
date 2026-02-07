Assignment Deadline Reminders with Notion and Email for Students & Teachers

https://n8nworkflows.xyz/workflows/assignment-deadline-reminders-with-notion-and-email-for-students---teachers-6999


# Assignment Deadline Reminders with Notion and Email for Students & Teachers

### 1. Workflow Overview

This workflow automates assignment deadline reminders for students and teachers by integrating Notion and email notifications. It periodically queries a Notion database for assignments due within the next three days, checks if any relevant assignments exist, and sends email reminders for each assignment individually. The workflow is designed to run on weekdays at 9 AM and handles the absence of upcoming assignments gracefully by halting further execution.

The logic is organized into three main blocks:  
- **1.1 Scheduled Trigger and Data Retrieval:** Initiates the workflow on a schedule and fetches assignments from Notion.  
- **1.2 Conditional Processing and Item Expansion:** Checks for existing assignments and prepares each assignment item for individual processing.  
- **1.3 Email Notification Dispatch:** Sends personalized email reminders for each assignment and manages cases when no assignments are found.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger and Data Retrieval

- **Overview:**  
  This block sets a scheduled trigger for the workflow to run every weekday at 9 AM and queries the Notion database to retrieve assignments due within the next three days.

- **Nodes Involved:**  
  - Set Schedule For Trigger  
  - Notion - Get Assignments  

- **Node Details:**  

  **Set Schedule For Trigger**  
  - Type: Schedule Trigger  
  - Role: Starts the workflow execution daily at a specified time on weekdays.  
  - Configuration: Triggers at 9 AM every weekday (Monday to Friday).  
  - Inputs: None (trigger node).  
  - Outputs: Connects to "Notion - Get Assignments".  
  - Version: n8n v1+ standard scheduler.  
  - Edge Cases: If the system’s timezone is incorrect, triggers may fire at unexpected times.  
  - Notes: None.

  **Notion - Get Assignments**  
  - Type: Notion node (Database Query)  
  - Role: Queries the Notion database to retrieve assignments with due dates within the next 3 days.  
  - Configuration:  
    - Resource: Database  
    - Database ID: Must be replaced with the actual Notion database ID (currently placeholder "asdcvbhuy7654344444bhju765").  
    - Filter: Implied to filter assignments by due date (though not explicitly shown in JSON, expected in production).  
  - Credentials: Uses an authorized Notion API credential ("Notion account - test").  
  - Inputs: Triggered by the scheduler.  
  - Outputs: Provides an array of assignment objects to the next node.  
  - Version: 1  
  - Edge Cases:  
    - Invalid database ID or API credentials lead to authentication or query errors.  
    - Missing or malformed 'Due Date' property in Notion causes data retrieval issues.  
  - Notes: "Due Date" property must be a valid date property in the Notion database schema.

---

#### 1.2 Conditional Processing and Item Expansion

- **Overview:**  
  This block verifies if any assignments were returned from Notion and prepares each assignment individually for email sending.

- **Nodes Involved:**  
  - IF Assignments Exist  
  - SplitOutItems itemList  
  - No Assignments  

- **Node Details:**  

  **IF Assignments Exist**  
  - Type: IF node (conditional)  
  - Role: Checks if there are any assignments from the Notion query.  
  - Configuration:  
    - Condition: Checks if the length of the results array from "Notion - Get Assignments" is greater than 0.  
    - Expression used: `{{$node['Notion - Get Assignments'].json['results'].length}} > 0`  
  - Inputs: Receives assignment list from Notion node.  
  - Outputs:  
    - True branch: Connects to "SplitOutItems itemList" for further processing.  
    - False branch: Connects to "No Assignments".  
  - Version: 1  
  - Edge Cases:  
    - Expression errors if the Notion node’s output is unexpectedly null or malformed.  
    - False negatives if the results array is empty or missing.  

  **SplitOutItems itemList**  
  - Type: Item Lists  
  - Role: Splits the list of assignments into individual items to process each separately.  
  - Configuration:  
    - Field to split out: "Name" (likely refers to the assignment name property or list)  
  - Inputs: True output from IF node.  
  - Outputs: Connects to "Send Email Reminder".  
  - Version: 1  
  - Edge Cases:  
    - If the field "Name" does not exist or is empty, splitting may fail or produce empty items.  
  - Notes: Enables sending individual emails per assignment.  

  **No Assignments**  
  - Type: NoOp (No Operation)  
  - Role: Placeholder node that terminates the workflow when no assignments are found.  
  - Configuration: None.  
  - Inputs: False output from IF node.  
  - Outputs: None (end of workflow branch).  
  - Version: 1  
  - Edge Cases: None.  
  - Notes: Indicates graceful stopping without errors or further processing.

---

#### 1.3 Email Notification Dispatch

- **Overview:**  
  This block sends email reminders for each assignment item processed individually, using fallback values if some assignment properties are missing.

- **Nodes Involved:**  
  - Send Email Reminder  

- **Node Details:**  

  **Send Email Reminder**  
  - Type: Email Send  
  - Role: Sends a personalized email reminder about the assignment deadline to the student's or teacher's email address.  
  - Configuration:  
    - Subject: "Assignment Reminder: [Assignment Name]" with fallback to 'Unnamed Assignment'.  
    - To Email: Extracted from assignment property "Email" (rich_text), fallback to "default_email@example.com".  
    - From Email: Fixed sender email "your_email@example.com" (must be updated).  
    - Email Body: Includes assignment name and due date with fallbacks for missing data.  
    - SMTP credentials: Requires valid SMTP credentials ("SMTP -test") configured.  
  - Inputs: Individual assignment item from "SplitOutItems itemList".  
  - Outputs: None (end of workflow branch).  
  - Version: 1  
  - Edge Cases:  
    - Missing or malformed email address causes failure to send email.  
    - SMTP credential misconfiguration or network issues cause sending failure.  
    - Missing assignment properties fallback gracefully but may reduce message clarity.  
  - Notes: Update 'your_email@example.com' and SMTP credentials to valid production values.

---

### 3. Summary Table

| Node Name               | Node Type            | Functional Role                                  | Input Node(s)               | Output Node(s)            | Sticky Note                                                                                                   |
|-------------------------|----------------------|-------------------------------------------------|-----------------------------|----------------------------|---------------------------------------------------------------------------------------------------------------|
| Set Schedule For Trigger | Schedule Trigger     | Starts workflow at 9 AM weekdays                  | None                        | Notion - Get Assignments    | Triggers the workflow every weekday at 9 AM to check for upcoming assignment deadlines.                        |
| Notion - Get Assignments| Notion               | Retrieves assignments due in the next 3 days      | Set Schedule For Trigger    | IF Assignments Exist        | Queries the Notion database for assignments with due dates within the next 3 days. Replace placeholder ID.     |
| IF Assignments Exist     | IF                   | Checks if assignments exist to proceed             | Notion - Get Assignments    | SplitOutItems itemList / No Assignments | Checks if any assignments returned; proceeds only if assignments exist.                                          |
| SplitOutItems itemList   | Item Lists           | Splits assignments list into individual items      | IF Assignments Exist (true) | Send Email Reminder         | Expands the list of assignments into individual items to process each one separately for sending reminders.    |
| Send Email Reminder      | Email Send           | Sends email reminders per assignment               | SplitOutItems itemList      | None                       | Sends an email reminder for each assignment with fallback values if properties are missing.                    |
| No Assignments           | No Operation (NoOp)  | Stops workflow if no assignments are due           | IF Assignments Exist (false)| None                       | Placeholder for no assignments scenario; workflow halts here.                                                 |
| Sticky Note             | Sticky Note          | Provides system architecture overview              | None                        | None                       | ## System Architecture\n- Assignment Tracking Pipeline\n- Reminder Generation Flow\n- Non-Critical Handling  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "Set Schedule For Trigger" Node**  
   - Type: Schedule Trigger  
   - Set to trigger every weekday (Monday to Friday) at 9:00 AM.  
   - No credentials needed.

2. **Create "Notion - Get Assignments" Node**  
   - Type: Notion (Database)  
   - Configure to query the Notion database resource.  
   - Set the database ID to your target Notion assignments database.  
   - Ensure the database has a "Due Date" property set as a date type.  
   - Use appropriate Notion API credentials.  
   - Connect output of "Set Schedule For Trigger" to this node.

3. **Create "IF Assignments Exist" Node**  
   - Type: IF node (conditional)  
   - Condition: Check if the length of the "results" array from the previous Notion node is greater than zero.  
     - Expression: `{{$node['Notion - Get Assignments'].json['results'].length}} > 0`  
   - Connect output of "Notion - Get Assignments" to this node.

4. **Create "SplitOutItems itemList" Node**  
   - Type: Item Lists  
   - Configure to split items by the field corresponding to assignment name or the list property holding assignments.  
   - Connect the "true" output of "IF Assignments Exist" to this node.

5. **Create "Send Email Reminder" Node**  
   - Type: Email Send  
   - Configure SMTP credentials for your email server.  
   - From Email: Set to your sender email (e.g., your_email@example.com).  
   - To Email: Use expression to extract recipient email from assignment property: `{{$json['properties']['Email']['rich_text'][0]['plain_text'] || 'default_email@example.com'}}`  
   - Subject: Use expression: `"Assignment Reminder: {{$json['properties']['Assignment Name']['title'][0]['plain_text'] || 'Unnamed Assignment'}}"`  
   - Text: Compose the email body using assignment name and due date with fallbacks:  
     ```
     Dear Student/Teacher,

     This is a reminder for the assignment '{{$json['properties']['Assignment Name']['title'][0]['plain_text'] || 'Unnamed Assignment'}}' due on {{$json['properties']['Due Date']['date']['start'] || 'No Date Set'}}. Please ensure it is completed on time.

     Best regards,
     Your School Automation System
     ```
   - Connect output of "SplitOutItems itemList" to this node.

6. **Create "No Assignments" Node**  
   - Type: No Operation (NoOp)  
   - No configuration needed.  
   - Connect the "false" output of "IF Assignments Exist" to this node.

7. **Create a "Sticky Note" Node (Optional)**  
   - Use to document the workflow architecture or instructions inside the editor for clarity.

---

### 5. General Notes & Resources

| Note Content                                                                                                                          | Context or Link                                                    |
|----------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| System Architecture overview includes assignment tracking pipeline, reminder generation, and handling no assignment cases gracefully. | See attached sticky note content inside the workflow editor.    |
| Replace all placeholder values such as Notion database ID, sender email, and SMTP credentials before production deployment.            | Workflow configuration instructions.                            |
| Ensure Notion properties ‘Assignment Name’, ‘Due Date’, and ‘Email’ match the exact property types and names in your database schema.  | Notion database setup best practices.                           |
| The workflow is intended to run on weekdays at 9 AM; adjust schedule as necessary to fit your academic calendar or timezone.           | Adjust in "Set Schedule For Trigger" node.                       |
| For SMTP setup, verify server connectivity and credentials to avoid email sending failures.                                            | Email provider documentation.                                   |

---

**Disclaimer:** The text provided derives exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to content policies and contains no illegal, offensive, or protected elements. All data handled are legal and public.