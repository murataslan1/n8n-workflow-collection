Automate Email Bounce & Invalid Detection with Gmail, Google Sheets & Slack

https://n8nworkflows.xyz/workflows/automate-email-bounce---invalid-detection-with-gmail--google-sheets---slack-9465


# Automate Email Bounce & Invalid Detection with Gmail, Google Sheets & Slack

---

### 1. Workflow Overview

This workflow automates the detection of bounced and invalid email addresses from Gmail bounce notifications, updates a Google Sheet with the bounce status, and sends a daily Slack summary report. It is designed for email list maintainers or marketers who want to keep their contact lists clean by identifying invalid email addresses promptly.

The workflow consists of two main logical blocks:

- **1.1 Bounce Detection & Contact Update**: Triggered manually or by a schedule, it fetches bounce notifications from Gmail, extracts bounced email addresses, compares them against a Google Sheet contact list, updates contact statuses accordingly, and writes the results back.

- **1.2 Daily Reporting**: Runs daily at 7 PM, reads the updated Google Sheet, calculates summary statistics (counts of bounced and inactive emails), and posts a formatted report to a Slack channel.

---

### 2. Block-by-Block Analysis

#### 1.1 Bounce Detection & Contact Update

- **Overview:**  
  This block detects bounced emails by fetching bounce notifications from Gmail, extracting failed addresses from message snippets, merging bounce data with existing contact data from a Google Sheet, updating statuses, and saving the results back to the sheet.

- **Nodes Involved:**  
  - When clicking ‘Execute workflow’ (Manual Trigger)  
  - Fetch Bounce Notifications (Gmail)  
  - Get Latest 5 Bounces (Code)  
  - Parse Bounced Email Addresses (Function)  
  - Fetch All Email Contacts (Google Sheets)  
  - Combine Bounce & Contact Data (Merge)  
  - Match & Update Contact Status (Code)  
  - Write Status Back to Sheet (Google Sheets)

- **Node Details:**

  1. **When clicking ‘Execute workflow’**  
     - Type: Manual Trigger  
     - Role: Starts the bounce detection process on manual execution for testing or ad-hoc runs.  
     - Configuration: No special parameters.  
     - Input: None  
     - Output: Triggers "Fetch Bounce Notifications" and "Fetch All Email Contacts" nodes in parallel.  
     - Edge cases: None.  
     - Sticky note: "START HERE" explains manual or scheduled trigger options.

  2. **Fetch Bounce Notifications**  
     - Type: Gmail Node  
     - Role: Retrieves all bounce notification emails from Gmail inbox.  
     - Configuration: Filter by sender email "mailer-daemon@googlemail.com", operation set to "getAll" to fetch all matching emails.  
     - Input: Manual Trigger node.  
     - Output: List of bounce emails with snippets.  
     - Credentials: Gmail OAuth2 account required.  
     - Edge cases: Gmail API quota limits, auth errors, empty inbox.  
     - Sticky note: Explains purpose and filter criteria.

  3. **Get Latest 5 Bounces**  
     - Type: Code  
     - Role: Sorts all fetched bounce emails by date descending and keeps only the 5 newest to limit workload.  
     - Configuration: Custom JavaScript sorting by `internalDate` property, slicing top 5.  
     - Input: Bounce notifications from Gmail node.  
     - Output: Array of 5 latest bounce emails as separate items.  
     - Edge cases: Less than 5 emails available.  
     - Sticky note: Describes rationale for limiting and sorting.

  4. **Parse Bounced Email Addresses**  
     - Type: Function  
     - Role: Parses each bounce email snippet using regex to extract the failed email address and outputs relevant info (failed email, subject, id, snippet).  
     - Configuration: Uses regex `/wasn't delivered to\s+([\w.-]+@[\w.-]+\.\w+)/i` to extract email from snippet text.  
     - Input: Latest 5 bounce emails.  
     - Output: One item per extracted failed email address.  
     - Edge cases: Regex mismatch, emails not found in snippet, malformed bounce messages.  
     - Sticky note: Details regex pattern and output fields.

  5. **Fetch All Email Contacts**  
     - Type: Google Sheets  
     - Role: Reads all rows from a Google Sheet ("Fraud Email" document, "Sheet1" tab) containing contacts and their statuses.  
     - Configuration: Reads entire sheet, expects columns: Name, Email, Status, Last Updated.  
     - Input: Manual Trigger node (runs in parallel with bounce fetch).  
     - Output: List of all contact rows.  
     - Credentials: Google Sheets OAuth2 account required.  
     - Edge cases: Sheet access errors, empty sheet.  
     - Sticky note: Explains sheet data structure and parallel execution.

  6. **Combine Bounce & Contact Data**  
     - Type: Merge  
     - Role: Merges the parsed bounced email addresses and the full contact list into a single data stream for comparison.  
     - Configuration: Default merge (likely Append mode), no filters or keys set.  
     - Input: Parsed bounce addresses (main input), contact list (second input).  
     - Output: Combined dataset for next processing.  
     - Edge cases: Mismatched or missing data in either input stream.  
     - Sticky note: Describes combining two data streams.

  7. **Match & Update Contact Status**  
     - Type: Code  
     - Role: Processes merged data to update contact statuses: sets "Not Found" if the email appears in the bounce list, otherwise "Not Sent." Also updates "Last Updated" timestamp.  
     - Configuration: Custom JavaScript that filters bounced emails and contacts, matches emails, and returns updated contact objects with new status and timestamp.  
     - Input: Combined bounce and contact data.  
     - Output: Updated contact data prepared for sheet update.  
     - Edge cases: Email case sensitivity, missing emails in contact list, invalid email formats.  
     - Sticky note: Explains status update logic and output.

  8. **Write Status Back to Sheet**  
     - Type: Google Sheets  
     - Role: Updates the Google Sheet by matching on "Name" column and updating "Status" and "Last Updated" columns with new values.  
     - Configuration: Update operation, matches rows by "Name" column, updates two fields per row.  
     - Input: Updated contacts from previous node.  
     - Output: Confirmation of sheet update.  
     - Credentials: Google Sheets OAuth2 account required.  
     - Edge cases: Name duplicates, sheet write conflicts, credential expiration.  
     - Sticky note: Details update method and result.

---

#### 1.2 Daily Reporting

- **Overview:**  
  This block runs a scheduled daily trigger at 7 PM to read the updated contact data from Google Sheets, calculate summary statistics of bounced and inactive emails, and send a formatted report message to a Slack channel.

- **Nodes Involved:**  
  - Daily 7PM Report Trigger (Cron)  
  - Read Updated Sheet Data (Google Sheets)  
  - Calculate Summary Statistics (Code)  
  - Send Slack Daily Summary (Slack)

- **Node Details:**

  1. **Daily 7PM Report Trigger**  
     - Type: Cron Trigger  
     - Role: Automatically triggers the reporting workflow daily at 19:00 (7 PM).  
     - Configuration: Trigger time set to hour 19, no other filters.  
     - Input: None  
     - Output: Triggers "Read Updated Sheet Data" node.  
     - Edge cases: Timezone mismatches, missed executions if workflow inactive.  
     - Sticky note: Explains schedule and purpose.

  2. **Read Updated Sheet Data**  
     - Type: Google Sheets  
     - Role: Reads all rows from the same Google Sheet ("Fraud Email", "Sheet1") to fetch current contact statuses for reporting.  
     - Configuration: Full sheet read, no filters.  
     - Input: Cron trigger.  
     - Output: Current contact data items.  
     - Credentials: Google Sheets OAuth2 account required.  
     - Edge cases: Sheet access errors, empty data.  
     - Sticky note: Explains purpose for statistics calculation.

  3. **Calculate Summary Statistics**  
     - Type: Code  
     - Role: Counts contacts by status: "Not Found" (invalid emails) and "Not Sent" (no activity). Produces a single summarized JSON object.  
     - Configuration: Custom JavaScript looping through contacts and counting based on status.  
     - Input: Contact data from sheet.  
     - Output: One JSON item with counts for "Invalid emails" and "No activity".  
     - Edge cases: Unexpected status values, case sensitivity.  
     - Sticky note: Describes counting logic and output.

  4. **Send Slack Daily Summary**  
     - Type: Slack  
     - Role: Sends a formatted message to the Slack channel "#email-cleanup" with counts of invalid emails and no-activity emails, plus encouraging text.  
     - Configuration: Text message with placeholders for counts, channel set to "#email-cleanup".  
     - Input: Summary statistics from previous node.  
     - Output: Slack message confirmation.  
     - Credentials: Slack API token with posting permissions.  
     - Edge cases: Slack API rate limits, credential expiration, channel not found.  
     - Sticky note: Explains message format and channel.

---

### 3. Summary Table

| Node Name                     | Node Type          | Functional Role                      | Input Node(s)                    | Output Node(s)                   | Sticky Note                                                                                               |
|-------------------------------|--------------------|------------------------------------|---------------------------------|---------------------------------|-----------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger     | Starts bounce detection manually   | None                            | Fetch Bounce Notifications, Fetch All Email Contacts | START HERE: Two ways to run - manual or scheduled. Triggers main bounce detection workflow.                |
| Fetch Bounce Notifications      | Gmail              | Fetch all bounce emails from Gmail | When clicking ‘Execute workflow’ | Get Latest 5 Bounces            | FETCH BOUNCES: Retrieves all mailer-daemon bounce emails filtered by sender.                              |
| Get Latest 5 Bounces            | Code               | Sorts and limits bounce emails     | Fetch Bounce Notifications      | Parse Bounced Email Addresses   | LIMIT PROCESSING: Sort by date descending, keep newest 5.                                                |
| Parse Bounced Email Addresses   | Function           | Extracts failed email addresses    | Get Latest 5 Bounces            | Combine Bounce & Contact Data   | EXTRACT EMAILS: Regex to parse failed emails from snippet. Output includes failedEmail, subject, etc.    |
| Fetch All Email Contacts        | Google Sheets      | Reads all contacts from sheet      | When clicking ‘Execute workflow’ | Combine Bounce & Contact Data   | GET CONTACTS: Reads entire sheet "Fraud Email" > "Sheet1". Columns: Name, Email, Status, Last Updated.   |
| Combine Bounce & Contact Data   | Merge              | Merges bounce and contact data     | Parse Bounced Email Addresses, Fetch All Email Contacts | Match & Update Contact Status | MERGE DATA: Combines two data streams for comparison.                                                    |
| Match & Update Contact Status   | Code               | Updates contact status based on bounces | Combine Bounce & Contact Data | Write Status Back to Sheet      | UPDATE STATUS: Sets "Not Found" if bounced, else "Not Sent". Updates timestamp.                           |
| Write Status Back to Sheet      | Google Sheets      | Writes updated statuses to sheet   | Match & Update Contact Status   | None                           | SAVE TO SHEET: Updates sheet rows matched by Name, updating Status and Last Updated columns.             |
| Daily 7PM Report Trigger        | Cron               | Triggers daily report at 7 PM      | None                            | Read Updated Sheet Data         | DAILY SCHEDULE: Runs daily at 19:00 to start report workflow.                                            |
| Read Updated Sheet Data         | Google Sheets      | Reads current sheet data for report | Daily 7PM Report Trigger       | Calculate Summary Statistics    | READ SHEET: Fetches current contact data for statistics calculation.                                     |
| Calculate Summary Statistics    | Code               | Counts invalid and inactive emails | Read Updated Sheet Data         | Send Slack Daily Summary        | CALCULATE STATS: Counts contacts by Status "Not Found" and "Not Sent". Outputs summary object.           |
| Send Slack Daily Summary        | Slack              | Sends formatted summary to Slack  | Calculate Summary Statistics    | None                           | SEND TO SLACK: Posts report message to #email-cleanup channel with counts and motivational text.        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Name: "When clicking ‘Execute workflow’"  
   - No parameters.  
   - This node starts the bounce detection flow.

2. **Create Gmail Node to Fetch Bounce Notifications**  
   - Type: Gmail  
   - Name: "Fetch Bounce Notifications"  
   - Credentials: Set up Gmail OAuth2 credentials.  
   - Operation: "getAll"  
   - Filters: Sender = "mailer-daemon@googlemail.com"  
   - Connect output of Manual Trigger to this node.

3. **Create Code Node to Get Latest 5 Bounces**  
   - Type: Code  
   - Name: "Get Latest 5 Bounces"  
   - Code:
     ```javascript
     const emails = items.map(item => item.json);
     emails.sort((a, b) => Number(b.internalDate) - Number(a.internalDate));
     const latestFive = emails.slice(0, 5);
     return latestFive.map(email => ({ json: email }));
     ```
   - Connect output of Gmail node to this node.

4. **Create Function Node to Parse Bounced Email Addresses**  
   - Type: Function  
   - Name: "Parse Bounced Email Addresses"  
   - Code:
     ```javascript
     return items
       .map(item => {
         const snippet = item.json.snippet || "";
         const match = snippet.match(/wasn't delivered to\s+([\w.-]+@[\w.-]+\.\w+)/i);
         if (match) {
           return {
             json: {
               failedEmail: match[1],
               subject: item.json.Subject || "",
               id: item.json.id,
               snippet: snippet,
             },
           };
         }
         return null;
       })
       .filter(item => item !== null);
     ```
   - Connect output of "Get Latest 5 Bounces" to this node.

5. **Create Google Sheets Node to Fetch All Email Contacts**  
   - Type: Google Sheets  
   - Name: "Fetch All Email Contacts"  
   - Credentials: Set up Google Sheets OAuth2 credentials.  
   - Operation: Read All Rows  
   - Document ID: (Use your Google Sheet ID, e.g., "1-4TaBE0cOTO1iwrrah5y822s8KXrWWkxFmJYiGCfWx4")  
   - Sheet Name/Tab: "Sheet1"  
   - Connect output of Manual Trigger to this node (runs in parallel with bounce fetch).

6. **Create Merge Node to Combine Bounce & Contact Data**  
   - Type: Merge  
   - Name: "Combine Bounce & Contact Data"  
   - Merge Mode: Append or default (combine both inputs in one stream)  
   - Connect output of "Parse Bounced Email Addresses" to Main Input (index 0).  
   - Connect output of "Fetch All Email Contacts" to Second Input (index 1).

7. **Create Code Node to Match & Update Contact Status**  
   - Type: Code  
   - Name: "Match & Update Contact Status"  
   - Code:
     ```javascript
     const failedEmails = items.filter(i => i.json.failedEmail).map(i => i.json.failedEmail);
     const contacts = items.filter(i => i.json.Email);
     const now = new Date().toISOString();

     const updatedContacts = contacts.map(item => {
       const email = item.json.Email;
       const isFailed = failedEmails.includes(email);
       return {
         json: {
           row_number: item.json.row_number,
           Name: item.json.Name,
           Email: email,
           Status: isFailed ? "Not Found" : "Not Sent",
           "Last Updated": now,
         },
       };
     });
     return updatedContacts;
     ```
   - Connect output of "Combine Bounce & Contact Data" to this node.

8. **Create Google Sheets Node to Write Status Back**  
   - Type: Google Sheets  
   - Name: "Write Status Back to Sheet"  
   - Credentials: Use same Google Sheets OAuth2 credentials.  
   - Operation: Update  
   - Document ID: Same as above  
   - Sheet Name: "Sheet1"  
   - Match Rows On: Column "Name"  
   - Fields to Update:  
     - Status = `{{$json.Status}}`  
     - Last Updated = `{{$json["Last Updated"]}}`  
   - Connect output of "Match & Update Contact Status" to this node.

---

9. **Create Cron Trigger for Daily Report**  
   - Type: Cron  
   - Name: "Daily 7PM Report Trigger"  
   - Schedule: Every day at hour 19 (7 PM)  
   - No other filters.

10. **Create Google Sheets Node to Read Updated Sheet Data**  
    - Type: Google Sheets  
    - Name: "Read Updated Sheet Data"  
    - Credentials: Google Sheets OAuth2 credentials.  
    - Operation: Read All Rows  
    - Document ID and Sheet Name same as above.  
    - Connect output of Cron node to this node.

11. **Create Code Node to Calculate Summary Statistics**  
    - Type: Code  
    - Name: "Calculate Summary Statistics"  
    - Code:
      ```javascript
      const contacts = items.map(item => item.json);
      let invalidCount = 0;
      let noActivityCount = 0;

      for (const contact of contacts) {
        const status = (contact.Status || "").toLowerCase();
        if (status === "not found") invalidCount++;
        if (status === "not sent") noActivityCount++;
      }

      return [
        {
          json: {
            "Invalid emails": invalidCount,
            "No activity": noActivityCount,
          },
        },
      ];
      ```
    - Connect output of "Read Updated Sheet Data" to this node.

12. **Create Slack Node to Send Daily Summary**  
    - Type: Slack  
    - Name: "Send Slack Daily Summary"  
    - Credentials: Slack API token with permission to post messages.  
    - Channel: "#email-cleanup"  
    - Message Text:
      ```
      📢 *Daily Bounce Cleanup Report*  
      📧 Invalid Marked: {{$json["Invalid emails"]}}  
      📭 No Action Marked: {{$json["No activity"]}}  
      ✅ Keep your lists healthy 💪
      ```
    - Connect output of "Calculate Summary Statistics" to this node.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                           | Context or Link                           |
|--------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------|
| Workflow detects bounced emails from Gmail "mailer-daemon" notifications and updates a Google Sheet with statuses "Not Found" or "Not Sent".           | Sticky Note 1 (Main workflow overview)   |
| Daily Slack summary sent to channel "#email-cleanup" at 7 PM with counts of invalid and no-activity emails.                                            | Sticky Note 2 (Daily reporting overview) |
| Regex used to extract failed emails: `wasn't delivered to [email]` from the snippet field of bounce messages.                                          | Sticky Note 6 (Email extraction details) |
| Sheet columns expected: Name, Email, Status, Last Updated. Status values: "Not Found" (bounced), "Not Sent" (no activity).                              | Sticky Note 7 (Sheet data structure)     |
| Slack message includes emoji for visual appeal and motivational text to encourage list hygiene.                                                        | Sticky Note 14 (Slack message content)   |

---

**Disclaimer:** The provided text comes exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.

---