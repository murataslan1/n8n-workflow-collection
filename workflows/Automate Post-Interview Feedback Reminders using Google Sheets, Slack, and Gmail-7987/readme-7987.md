Automate Post-Interview Feedback Reminders using Google Sheets, Slack, and Gmail

https://n8nworkflows.xyz/workflows/automate-post-interview-feedback-reminders-using-google-sheets--slack--and-gmail-7987


# Automate Post-Interview Feedback Reminders using Google Sheets, Slack, and Gmail

### 1. Workflow Overview

This workflow automates sending post-interview feedback reminders by integrating Google Sheets, Slack, and Gmail. It targets HR or recruitment teams who track interview feedback in Google Sheets and want to nudge interviewers to submit their feedback via Slack direct messages or email if Slack is unavailable. The workflow is scheduled to run daily in the evening.

Logical blocks:

- **1.1 Trigger and Data Fetch:** Scheduled daily trigger followed by reading interview feedback data from a Google Sheet.
- **1.2 Feedback Submission Check:** Filtering out entries where feedback is already submitted.
- **1.3 Slack ID Presence Check:** Determines if a Slack ID for the candidate exists.
- **1.4 Sending Reminders:** Sends a Slack DM reminder if Slack ID exists, otherwise sends an email reminder via Gmail.
- **1.5 Status Update:** Updates the Google Sheet to mark feedback as submitted to avoid duplicate reminders.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger and Data Fetch

- **Overview:** Initiates the workflow daily and fetches the entire interview feedback data from Google Sheets.
- **Nodes Involved:**  
  - Daily Reminder Trigger  
  - Fetch Interview Feedback Data  

##### Daily Reminder Trigger

- **Type & Role:** Schedule Trigger node; initiates workflow execution every day at 18:00 (6 PM).
- **Configuration:** Runs daily at 18:00 based on the schedule rule.
- **Expressions/Variables:** None.
- **Input/Output:** No input; outputs a trigger event to "Fetch Interview Feedback Data".
- **Version:** 1.2.
- **Potential Failures:** Scheduler misconfiguration, system downtime.
- **Sub-workflow:** None.

##### Fetch Interview Feedback Data

- **Type & Role:** Google Sheets node (Read Sheet); reads all rows from a specific sheet.
- **Configuration:** Reads the sheet named "Interview_Feedback" within the spreadsheet ID `1cQ-TBf3-dqo7njDYzYpxpASYFvEp8lIzH7vpIqTLcwc`.
- **Credentials:** Uses Google Sheets OAuth2 credentials.
- **Expressions:** Sheet and document IDs are statically set.
- **Input/Output:** Input from trigger node; outputs all rows read to "Check If Feedback Is Submitted".
- **Version:** 4.6.
- **Potential Failures:** Authentication errors, API rate limits, sheet access permission errors, empty or malformed data.
- **Sub-workflow:** None.

---

#### 1.2 Feedback Submission Check

- **Overview:** Filters out entries where feedback has already been submitted (marked "Y").
- **Nodes Involved:**  
  - Check If Feedback Is Submitted  

##### Check If Feedback Is Submitted

- **Type & Role:** IF node; filters rows based on "Feedback Submitted (Y/N)" column.
- **Configuration:** Condition checks if `Feedback Submitted (Y/N)` equals "Y". If true, row is filtered out (no further action).
- **Expressions:** `={{ $json["Feedback Submitted (Y/N)"] }} === "Y"`.
- **Input/Output:** Input from "Fetch Interview Feedback Data"; outputs to two branches:
  - True branch (feedback submitted): no further nodes connected (ends here).
  - False branch (feedback not submitted): continues to "Check for Slack ID".
- **Version:** 2.2.
- **Edge Cases:** Missing or misspelled "Feedback Submitted (Y/N)" field causing expression errors; values other than "Y" or "N".
- **Sub-workflow:** None.

---

#### 1.3 Slack ID Presence Check

- **Overview:** Determines if a Slack ID exists for each candidate to decide notification channel.
- **Nodes Involved:**  
  - Check for Slack ID  

##### Check for Slack ID

- **Type & Role:** IF node; checks if "Candidate Slack Id" field is empty.
- **Configuration:** Condition checks if `Candidate Slack Id` is empty.
- **Expressions:** `={{ $json["Candidate Slack Id"] }}` is empty.
- **Input/Output:** Input from false branch of "Check If Feedback Is Submitted".
  - True branch (Slack ID empty): routes to "Send Email Reminder".
  - False branch (Slack ID present): routes to "Send Slack Reminder".
- **Version:** 2.2.
- **Edge Cases:** Slack ID format invalid but non-empty; missing field.
- **Sub-workflow:** None.

---

#### 1.4 Sending Reminders

- **Overview:** Sends personalized reminders via Slack or email depending on Slack ID availability.
- **Nodes Involved:**  
  - Send Slack Reminder  
  - Send Email Reminder  

##### Send Slack Reminder

- **Type & Role:** Slack node; sends a direct message to the interviewer’s Slack user ID.
- **Configuration:**  
  - Message text set to the "Areas of Improvement" field from the candidate’s data.  
  - User parameter set by Slack ID from "Candidate Slack Id" field.  
- **Expressions:**  
  - Text: `={{ $json["Areas of Improvement"] }}`.  
  - User ID: `={{ $json["Candidate Slack Id"] }}`.
- **Credentials:** Uses configured Slack API credentials.
- **Input/Output:** Receives from false branch of "Check for Slack ID"; outputs to "Update Reminder Status".
- **Version:** 2.3.
- **Edge Cases:** Slack ID invalid, user not found, API rate limits, message formatting issues.
- **Sub-workflow:** None.

##### Send Email Reminder

- **Type & Role:** Gmail node; sends an email reminder to the candidate email address.
- **Configuration:**  
  - Recipient set to "Candidate Email".  
  - Subject set to "Recommendation" field.  
  - Body text set to "Areas of Improvement".  
  - Attribution disabled for cleaner message.  
- **Expressions:**  
  - To: `={{ $json["Candidate Email"] }}`.  
  - Subject: `={{ $json.Recommendation }}`.  
  - Message: `={{ $json["Areas of Improvement"] }}`.
- **Credentials:** Uses Gmail OAuth2 credentials.
- **Input/Output:** Receives from true branch of "Check for Slack ID"; outputs to "Update Reminder Status".
- **Version:** 2.1.
- **Edge Cases:** Invalid email addresses, Gmail API limits or auth errors, missing required fields.
- **Sub-workflow:** None.

---

#### 1.5 Status Update

- **Overview:** Updates the Google Sheet marking feedback as submitted to avoid duplicate reminders.
- **Nodes Involved:**  
  - Update Reminder Status  

##### Update Reminder Status

- **Type & Role:** Google Sheets node (Append or Update); updates the record with "Feedback Submitted (Y/N)" set to "Y".
- **Configuration:**  
  - Operates on the same sheet and document as data fetch.  
  - Mapping all columns from the current row, but updates "Feedback Submitted (Y/N)" to "Y".  
  - Matches rows based on "Feedback Submitted (Y/N)" column to update existing rows rather than append.  
- **Expressions:** Uses values from "Check for Slack ID" node's input JSON to populate all columns.
- **Credentials:** Same Google Sheets OAuth2 credentials.
- **Input/Output:** Inputs from both "Send Slack Reminder" and "Send Email Reminder"; no output.
- **Version:** 4.6.
- **Edge Cases:** Matching errors causing duplicate rows, permission issues, API errors.
- **Sub-workflow:** None.

---

### 3. Summary Table

| Node Name                   | Node Type               | Functional Role                       | Input Node(s)                | Output Node(s)                 | Sticky Note                                                                                                                          |
|-----------------------------|-------------------------|------------------------------------|-----------------------------|-------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| Sticky Note                 | Sticky Note             | Workflow title display              |                             |                               | ## Send Post‑Interview Feedback Nudges from Google Sheets to Slack (with Email Fallback)                                              |
| Sticky Note1                | Sticky Note             | Workflow description and explanation|                             |                               | ## Description: - The workflow starts with a Schedule Trigger node named "Daily Reminder Trigger", which runs every day at 6:00 PM... |
| Daily Reminder Trigger      | Schedule Trigger        | Starts workflow daily at 6 PM       |                             | Fetch Interview Feedback Data  |                                                                                                                                      |
| Fetch Interview Feedback Data| Google Sheets           | Reads interview feedback data       | Daily Reminder Trigger       | Check If Feedback Is Submitted |                                                                                                                                      |
| Check If Feedback Is Submitted| IF                     | Filters rows where feedback is done | Fetch Interview Feedback Data| Check for Slack ID             |                                                                                                                                      |
| Check for Slack ID          | IF                      | Checks if Slack ID exists            | Check If Feedback Is Submitted| Send Email Reminder (if empty) / Send Slack Reminder (if exists) |                                                                                                                                    |
| Send Slack Reminder         | Slack                   | Sends Slack DM reminder             | Check for Slack ID           | Update Reminder Status         |                                                                                                                                      |
| Send Email Reminder         | Gmail                   | Sends email reminder                | Check for Slack ID           | Update Reminder Status         |                                                                                                                                      |
| Update Reminder Status      | Google Sheets           | Marks feedback as submitted in sheet| Send Slack Reminder, Send Email Reminder |                               |                                                                                                                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger node**
   - Name: `Daily Reminder Trigger`
   - Type: Schedule Trigger
   - Settings: Set to run daily at 18:00 (6 PM).

2. **Add Google Sheets node to read data**
   - Name: `Fetch Interview Feedback Data`
   - Type: Google Sheets (Read Sheet)
   - Credentials: Connect Google Sheets OAuth2.
   - Parameters:
     - Document ID: `1cQ-TBf3-dqo7njDYzYpxpASYFvEp8lIzH7vpIqTLcwc`
     - Sheet Name: `Interview_Feedback`
     - Read all rows (default)
   - Connect output of `Daily Reminder Trigger` to this node.

3. **Add IF node to check feedback submission**
   - Name: `Check If Feedback Is Submitted`
   - Type: IF
   - Parameters:
     - Condition: `Feedback Submitted (Y/N)` equals `Y`
   - Connect output of `Fetch Interview Feedback Data` to this node.
   - The True branch (feedback already submitted) ends here (no connection).
   - The False branch continues to next step.

4. **Add IF node to check Slack ID presence**
   - Name: `Check for Slack ID`
   - Type: IF
   - Parameters:
     - Condition: `Candidate Slack Id` is empty (string empty check).
   - Connect False branch of `Check If Feedback Is Submitted` to this node.
   - True branch (Slack ID empty) connects to `Send Email Reminder`.
   - False branch (Slack ID present) connects to `Send Slack Reminder`.

5. **Add Slack node to send reminder**
   - Name: `Send Slack Reminder`
   - Type: Slack (Post Message)
   - Credentials: Connect Slack API credentials.
   - Parameters:
     - User: `={{ $json["Candidate Slack Id"] }}`
     - Text: `={{ $json["Areas of Improvement"] }}`
     - Send as direct message (user mode).
   - Connect False branch of `Check for Slack ID` to this node.

6. **Add Gmail node to send reminder email**
   - Name: `Send Email Reminder`
   - Type: Gmail (Send Message)
   - Credentials: Connect Gmail OAuth2 credentials.
   - Parameters:
     - Send To: `={{ $json["Candidate Email"] }}`
     - Subject: `={{ $json["Recommendation"] }}`
     - Message: `={{ $json["Areas of Improvement"] }}`
     - Email Type: Text
     - Disable attribution.
   - Connect True branch of `Check for Slack ID` to this node.

7. **Add Google Sheets node to update feedback status**
   - Name: `Update Reminder Status`
   - Type: Google Sheets (Append or Update)
   - Credentials: Google Sheets OAuth2 credentials.
   - Parameters:
     - Document ID and Sheet Name same as data fetch.
     - Mapping Mode: Define below.
     - Map all columns from previous node JSON.
     - Set `Feedback Submitted (Y/N)` field to `"Y"` to mark as submitted.
     - Matching column: `Feedback Submitted (Y/N)` to update existing rows.
   - Connect output of `Send Slack Reminder` and `Send Email Reminder` to this node.

---

### 5. General Notes & Resources

| Note Content                                                                                                       | Context or Link                                                                                  |
|--------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Workflow automates interview feedback reminder via Slack and email fallback, triggered daily at 6 PM.              | Main workflow description                                                                        |
| Google Sheets document ID and sheet name are hardcoded; ensure permissions and sheet structure remain consistent.  | Google Sheets node configuration                                                                 |
| Slack message text uses "Areas of Improvement" field for personalized feedback nudges.                              | Slack reminder message content                                                                   |
| Email fallback uses Gmail OAuth2 credentials and sends plain text emails with subject from "Recommendation" field. | Email reminder node configuration                                                                |
| The workflow marks feedback as submitted by updating the sheet to prevent duplicate reminders.                      | Update Reminder Status node functionality                                                        |
| Slack IDs and candidate emails must be valid and correctly stored in the sheet for successful reminders.            | Potential edge cases and error sources                                                           |