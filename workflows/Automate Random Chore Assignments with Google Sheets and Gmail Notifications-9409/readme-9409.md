Automate Random Chore Assignments with Google Sheets and Gmail Notifications

https://n8nworkflows.xyz/workflows/automate-random-chore-assignments-with-google-sheets-and-gmail-notifications-9409


# Automate Random Chore Assignments with Google Sheets and Gmail Notifications

---

### 1. Workflow Overview

This workflow automates weekly random chore assignments by integrating Google Sheets and Gmail. It fetches task data and people information from two Google Sheets tabs, randomly assigns tasks to people with valid emails, updates the task assignments back in the sheet, and sends personalized email notifications to each assignee. The logical blocks are:

- **1.1 Scheduled Trigger:** Initiates the workflow weekly.
- **1.2 Data Retrieval:** Fetches "Tasks" and "Persons" data from Google Sheets.
- **1.3 Data Processing and Assignment:** Filters data, assigns tasks randomly, and prepares data for update and notification.
- **1.4 Task Update and Notification:** Updates the Google Sheet with assigned persons and sends customized Gmail notifications.
- **1.5 Documentation and Setup Notes:** Sticky notes provide setup instructions, examples, and customization tips.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger

- **Overview:**  
  Triggers the entire workflow to run every 7 days (weekly), ensuring chore assignments happen on a set schedule.

- **Nodes Involved:**  
  - Schedule Trigger

- **Node Details:**

  - **Schedule Trigger**  
    - *Type and Role:* n8n Schedule Trigger node, initiates workflow periodically.  
    - *Configuration:* Interval set to every 7 days.  
    - *Expressions/Variables:* None.  
    - *Input/Output:* No inputs; outputs trigger signal to "Get Tasks" node.  
    - *Version Requirements:* Standard, no special version needed.  
    - *Potential Failures:* Misconfiguration of schedule interval, system time issues.  
    - *Sub-workflow:* None.

---

#### 1.2 Data Retrieval

- **Overview:**  
  Retrieves the lists of tasks and people from specific sheets in a Google Sheets document using OAuth2 credentials.

- **Nodes Involved:**  
  - Get Tasks  
  - Get People

- **Node Details:**

  - **Get Tasks**  
    - *Type and Role:* Google Sheets node to read the "Tasks" sheet.  
    - *Configuration:*  
      - Document ID: The Google Sheets document "Chore_scheduler".  
      - Sheet Name: "Tasks" sheet via GID 0.  
      - Operation: Read rows (default).  
      - Credentials: Google Sheets OAuth2 with read permission.  
    - *Expressions/Variables:* Uses dynamic referencing of sheet and document IDs.  
    - *Input/Output:* Triggered by Schedule Trigger; outputs task data to "Get People".  
    - *Version Requirements:* Version 3 of Google Sheets node.  
    - *Potential Failures:* OAuth2 token expiration/permission issues, sheet not found, empty or malformed data.  
    - *Sub-workflow:* None.

  - **Get People**  
    - *Type and Role:* Google Sheets node to read the "Persons" sheet.  
    - *Configuration:*  
      - Document ID: Same as above.  
      - Sheet Name: "Persons" sheet via GID 307557581.  
      - Operation: Read rows.  
      - Credentials: Google Sheets OAuth2 with read permission.  
    - *Expressions/Variables:* Dynamic sheet and document referencing.  
    - *Input/Output:* Receives data from "Get Tasks"; outputs people data to "Filter Data and Assign Tasks".  
    - *Version Requirements:* Version 3.  
    - *Potential Failures:* As in Get Tasks node.  
    - *Sub-workflow:* None.

---

#### 1.3 Data Processing and Assignment

- **Overview:**  
  Filters out people without emails and tasks without names, checks for presence of valid people, randomly assigns each task to a person, and prepares assignment data for update and notification.

- **Nodes Involved:**  
  - Filter Data and Assign Tasks

- **Node Details:**

  - **Filter Data and Assign Tasks**  
    - *Type and Role:* Code node executing JavaScript for data filtering and assignment logic.  
    - *Configuration:* Custom JavaScript code that:  
      - Filters people to those with non-empty emails.  
      - Filters tasks to those with defined names.  
      - Throws error if no valid people found.  
      - Randomly assigns each task to a random person.  
      - Returns an array of objects with task info and assigned person details.  
    - *Key Expressions/Variables:*  
      - `$items('Get Tasks')` and `$items('Get People')` to access input data.  
      - Uses `Math.random()` for random assignment.  
      - Throws error with message in Spanish if no valid people.  
    - *Input/Output:* Input from "Get People"; outputs assignments to "Send a message".  
    - *Version Requirements:* Version 2 Code node.  
    - *Potential Failures:* Empty input arrays, script errors, runtime exceptions if data structure unexpected, assignment duplication (random but not weighted).  
    - *Sub-workflow:* None.

---

#### 1.4 Task Update and Notification

- **Overview:**  
  For each assigned task, sends a personalized Gmail message to the assigned person, then updates the "assigned_to" column in the "Tasks" sheet to reflect the assignment.

- **Nodes Involved:**  
  - Send a message  
  - Update assign_to in sheet

- **Node Details:**

  - **Send a message**  
    - *Type and Role:* Gmail node to send email notifications.  
    - *Configuration:*  
      - Recipient email: Dynamically set via expression from assigned person's email.  
      - Subject: Static text "Task selection".  
      - Message body: Template using assigned person’s name, task, and description fields.  
      - Credentials: Gmail OAuth2 credential with send permissions.  
    - *Key Expressions:*  
      - `={{ $('Filter Data and Assign Tasks').item.json.email }}` for recipient.  
      - Template strings for message content, including task details and greetings.  
    - *Input/Output:* Inputs assignment data from code node; outputs to "Update assign_to in sheet".  
    - *Version Requirements:* Version 2.1 Gmail node.  
    - *Potential Failures:* OAuth2 errors, quota limits, invalid email addresses, connectivity issues, template expression errors.  
    - *Sub-workflow:* None.

  - **Update assign_to in sheet**  
    - *Type and Role:* Google Sheets node to update assigned person’s name in the "Tasks" sheet.  
    - *Configuration:*  
      - Document ID and sheet name same as "Get Tasks".  
      - Operation: Update rows based on matching "row_number".  
      - Columns mapped: "row_number" for matching, "assigned_to" for update, ensuring other fields mapped but not updated.  
      - Credentials: Same Google Sheets OAuth2.  
    - *Expressions:*  
      - Uses expression to dynamically assign values for "row_number" and "assigned_to" from the code node output.  
    - *Input/Output:* Inputs from "Send a message"; no further outputs (end node).  
    - *Version Requirements:* Version 4.7 Google Sheets node.  
    - *Potential Failures:* Sheet locking, mismatched row numbers, permission errors, API limits.  
    - *Sub-workflow:* None.

---

#### 1.5 Documentation and Setup Notes

- **Overview:**  
  Contains sticky notes with visual examples, instructions, customization tips, and node-specific advice.

- **Nodes Involved:**  
  - Sticky Note1  
  - Sticky Note2  
  - Sticky Note  
  - Sticky Note3  
  - Sticky Note5  
  - Sticky Note6  
  - Sticky Note7  
  - Sticky Note8  
  - Sticky Note9

- **Node Details:**

  - **Sticky Note1:** Shows example image of the "Tasks" sheet layout.  
  - **Sticky Note2:** Setup steps before starting: creating sheets, credentials for Google Sheets and Gmail.  
  - **Sticky Note:** Image example of "Persons" sheet layout.  
  - **Sticky Note3:** Customization tips for schedule interval, email template, assignment weighting, and other notification channels.  
  - **Sticky Note5:** Notes on the "Filter Data and Assign Tasks" node, suggesting customization for weighting tasks by difficulty.  
  - **Sticky Note6:** Advice for "Send a message" node about selecting Gmail credentials and customizing emails.  
  - **Sticky Note7:** Notes on the update node to ensure correct row and column mapping.  
  - **Sticky Note8:** Instructions on selecting credentials and sheet for "Get People" node.  
  - **Sticky Note9:** Instructions for "Get Tasks" node credentials and sheet selection.

- *No inputs or outputs; purely informational.*

---

### 3. Summary Table

| Node Name                  | Node Type               | Functional Role                          | Input Node(s)              | Output Node(s)              | Sticky Note                                                                                      |
|----------------------------|-------------------------|----------------------------------------|----------------------------|-----------------------------|------------------------------------------------------------------------------------------------|
| Schedule Trigger           | Schedule Trigger        | Initiates workflow weekly               |                            | Get Tasks                   |                                                                                                |
| Get Tasks                 | Google Sheets           | Fetch task list from "Tasks" sheet      | Schedule Trigger            | Get People                  | **Get Tasks Node:** Select Google Sheets credential and Tasks sheet.                            |
| Get People                | Google Sheets           | Fetch people list from "Persons" sheet  | Get Tasks                  | Filter Data and Assign Tasks | **Get People Node:** Select Google Sheets credential and Persons sheet.                        |
| Filter Data and Assign Tasks | Code                   | Filter data and randomly assign tasks   | Get People                 | Send a message              | **Filter Data and Assign Tasks Node:** Preconfigured; customizable assignment script.          |
| Send a message            | Gmail                   | Send notification emails to assignees   | Filter Data and Assign Tasks | Update assign_to in sheet    | **Send a message node:** Select Gmail credential; customizable email subject/body.             |
| Update assign_to in sheet  | Google Sheets           | Update "assigned_to" column in sheet    | Send a message             |                             | **Update sheet assign_to in sheet node:** Uses row_number for matching to update correct row.  |
| Sticky Note1              | Sticky Note             | Example image: Tasks sheet               |                            |                             | ## Sheets Tasks Example ![](https://i.imgur.com/VHb4GQM.jpeg)                                  |
| Sticky Note2              | Sticky Note             | Setup instructions                       |                            |                             | ## Setup steps before start: create sheets, credentials for Google Sheets and Gmail.           |
| Sticky Note               | Sticky Note             | Example image: Persons sheet             |                            |                             | ## Sheet Persons ![](https://i.imgur.com/0eN0zPX.jpeg)                                         |
| Sticky Note3              | Sticky Note             | Customization tips                       |                            |                             | ## How to customise it: schedule, email, weighting, other notification channels.                |
| Sticky Note5              | Sticky Note             | Note on assignment script customization |                            |                             | **Filter Data and Assign Tasks Node (Optional):** Modifiable assignment script for weighting.  |
| Sticky Note6              | Sticky Note             | Note on Gmail node                       |                            |                             | **Send a message node:** Select Gmail credential; customize subject and body.                   |
| Sticky Note7              | Sticky Note             | Note on Google Sheets update node       |                            |                             | **Update sheet assign_to in sheet node:** Ensure correct row matching via row_number.          |
| Sticky Note8              | Sticky Note             | Note on Get People node                  |                            |                             | **Get People Node:** Select Google Sheets credential and Persons sheet.                         |
| Sticky Note9              | Sticky Note             | Note on Get Tasks node                   |                            |                             | **Get Tasks Node:** Select Google Sheets credential and Tasks sheet.                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Scheduled Trigger Node:**  
   - Add a "Schedule Trigger" node.  
   - Set the interval to every 7 days.  
   - No credentials needed.

2. **Create "Get Tasks" Google Sheets Node:**  
   - Add a "Google Sheets" node named "Get Tasks".  
   - Set operation to "Read Rows".  
   - Set Document ID to your chore scheduler Google Sheets document ID.  
   - Set Sheet Name to "Tasks" (or GID 0).  
   - Connect "Schedule Trigger" output to this node's input.  
   - Select or create Google Sheets OAuth2 credentials with read permission.

3. **Create "Get People" Google Sheets Node:**  
   - Add another "Google Sheets" node named "Get People".  
   - Set operation to "Read Rows".  
   - Use the same Document ID as above.  
   - Set Sheet Name to "Persons" (use its GID or name).  
   - Connect "Get Tasks" output to this node's input.  
   - Use the same Google Sheets OAuth2 credentials.

4. **Create "Filter Data and Assign Tasks" Code Node:**  
   - Add a "Code" node named "Filter Data and Assign Tasks".  
   - Connect "Get People" output to this node input.  
   - Paste the following JavaScript code (adapt if needed):

   ```javascript
   let tasks = $items('Get Tasks');
   let people = $items('Get People');

   // Filter persons without Email
   people = people.filter(item => {
     const email = item.json.email;
     return email && email.toString().trim() !== '';
   });

   // Filter tasks undefined
   tasks = tasks.filter(item => {
     const task = item.json.task;
     return task && task.toString().trim() !== '';
   });

   if (people.length === 0) {
     throw new Error('No hay personas con correo electrónico para asignar las tareas.');
   }

   const assignments = tasks.map((taskItem) => {
     const personItem = people[Math.floor(Math.random() * people.length)];
     return {
       json: {
         row_number: taskItem.json.row_number,
         task: taskItem.json.task,
         description: taskItem.json.description,
         assigned_to: personItem.json.name,
         email: personItem.json.email,
       }
     };
   });

   return assignments;
   ```

5. **Create "Send a message" Gmail Node:**  
   - Add a "Gmail" node named "Send a message".  
   - Connect "Filter Data and Assign Tasks" output to this node.  
   - Configure:  
     - "Send To": `={{ $('Filter Data and Assign Tasks').item.json.email }}`  
     - "Subject": `"Task selection"` (or customize)  
     - "Message":  
       ```
       Hello {{ $('Filter Data and Assign Tasks').item.json.assigned_to }}!

       The homework assigned to you this week is: {{ $('Filter Data and Assign Tasks').item.json.task }}.
       {{ $('Filter Data and Assign Tasks').item.json.description }}

       Have a good day!
       ```  
   - Select or create Gmail OAuth2 credentials with send email permission.

6. **Create "Update assign_to in sheet" Google Sheets Node:**  
   - Add a "Google Sheets" node named "Update assign_to in sheet".  
   - Connect "Send a message" output to this node.  
   - Set operation to "Update".  
   - Use same Document ID and Sheet Name as "Get Tasks".  
   - Set mapping mode to "Define Below".  
   - Map:  
     - "row_number" (matching column): `={{ $('Filter Data and Assign Tasks').item.json.row_number }}`  
     - "assigned_to" (column to update): `={{ $('Filter Data and Assign Tasks').item.json.assigned_to }}`  
   - Use same Google Sheets OAuth2 credentials.

7. **(Optional) Add Sticky Notes for Documentation:**  
   - Add sticky notes with setup instructions, example images, and customization tips for maintainability.

8. **Test the Workflow:**  
   - Run manually or wait for scheduled trigger.  
   - Verify tasks assigned randomly, emails sent, and sheet updated.

---

### 5. General Notes & Resources

| Note Content                                                                                                          | Context or Link                                                                                      |
|-----------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Setup before start: create Google Sheets with two sheets named “Tasks” and “Persons” with appropriate columns.        | Sticky Note2                                                                                       |
| Example sheet layouts for "Tasks" and "Persons" shown in Sticky Note1 and Sticky Note with Imgur image links.          | Sticky Note1: ![](https://i.imgur.com/VHb4GQM.jpeg), Sticky Note: ![](https://i.imgur.com/0eN0zPX.jpeg) |
| Customize schedule interval, email templates, and task assignment logic as needed. Consider other notification channels.| Sticky Note3                                                                                       |
| Gmail sending requires OAuth2 credential with send permissions; ensure quota limits are considered.                   | Sticky Note6                                                                                       |
| Google Sheets update uses "row_number" as a key; ensure this column exists and matches the sheet rows correctly.       | Sticky Note7                                                                                       |
| You can modify the assignment script in the code node to weight tasks by difficulty or other criteria.                | Sticky Note5                                                                                       |

---

Disclaimer: The text is exclusively from an automated n8n workflow. It complies fully with content policies and contains no illegal or offensive material. All data handled is legal and public.