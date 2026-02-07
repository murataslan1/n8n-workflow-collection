Automate Medical Rep Visit Workflow with Google Sheets, Gmail & OpenAI Summaries

https://n8nworkflows.xyz/workflows/automate-medical-rep-visit-workflow-with-google-sheets--gmail---openai-summaries-11690


# Automate Medical Rep Visit Workflow with Google Sheets, Gmail & OpenAI Summaries

### 1. Workflow Overview

This workflow automates the daily routine of managing Medical Representatives’ (MR) doctor visits and reporting, integrating Google Sheets, Gmail, and OpenAI for AI-driven summarization. It targets pharmaceutical or medical sales teams that need streamlined daily visit planning, reporting, reminders, and management summaries.

The workflow is logically split into three main blocks:

- **1.1 Morning Work Assignment:**  
  Scheduled at 9 AM, it fetches the MR visit plan from a Google Sheet, filters “Pending” visits, sends personalized emails to each MR with their visit details and a Google Form link for reporting, then updates the sheet status to “Assigned.”

- **1.2 Evening Reminder for Pending Work:**  
  Triggered at 6 PM, it fetches all visit records still marked “Pending” (i.e., unreported), sends reminder emails to MRs to update their visit status via the form, and marks reminders as sent in the sheet.

- **1.3 Nightly Reporting and Summary:**  
  Scheduled at 11 PM, it fetches all form responses submitted during the day, passes each response through an AI agent that generates a structured summary for management, then emails a consolidated daily summary report to the manager.

These blocks ensure a full daily cycle: assignment, follow-up, and reporting with AI-enhanced communication.

---

### 2. Block-by-Block Analysis

#### 2.1 Morning Work Assignment

- **Overview:**  
  This block runs each morning to assign daily visits to MRs by reading the MR plan, emailing visit details and form links, and updating the plan status to “Assigned” to avoid duplication.

- **Nodes Involved:**  
  - Schedule To Assign Work  
  - Fetch MR Sheet  
  - Send Plan Email to MR  
  - Update row in sheet

- **Node Details:**

  - **Schedule To Assign Work**  
    - *Type:* Schedule Trigger  
    - *Role:* Initiates the morning assignment at 9 AM daily  
    - *Config:* Trigger at hour 9 (9:00 AM)  
    - *Connections:* Outputs to Fetch MR Sheet  
    - *Edge Cases:* Workflow will not run outside scheduled time; ensure timezone matches local time.

  - **Fetch MR Sheet**  
    - *Type:* Google Sheets  
    - *Role:* Reads the MR plan sheet, filtering rows where “Status” = “Pending”  
    - *Config:* Document ID and sheet GID configured for MR plan; filter on “Status” column for “Pending”  
    - *Connections:* Outputs filtered rows to Send Plan Email to MR  
    - *Edge Cases:* Sheet access errors, OAuth token expiration, no “Pending” rows found.

  - **Send Plan Email to MR**  
    - *Type:* Gmail (OAuth2)  
    - *Role:* Sends personalized email to each MR with their daily visit plan and form link  
    - *Config:*  
      - To: MR’s email from the sheet row  
      - Subject: “Your Visit Plan for Today – [MR_Name]”  
      - Message: HTML formatted with visit doctor, location, and Google Form link  
    - *Connections:* On success, outputs to Update row in sheet  
    - *Edge Cases:* Email sending failures (auth, quota), missing Email or MR_Name fields, malformed email content.

  - **Update row in sheet**  
    - *Type:* Google Sheets (update)  
    - *Role:* Updates the row’s “Status” field to “Assigned” to mark the assignment done  
    - *Config:* Matching on row ID; fields copied from original, “Status” overwritten to “Assigned”  
    - *Connections:* None (end of block)  
    - *Edge Cases:* Update failures due to sheet locking, permissions, or row ID mismatch.

---

#### 2.2 Evening Reminder for Pending Work

- **Overview:**  
  Each evening, the workflow checks for visits still marked “Pending,” sends reminder emails to MRs to complete their visit report, and updates the sheet to mark reminders sent.

- **Nodes Involved:**  
  - Schedule For Remind Pending work  
  - Fetch Pending Records  
  - Send Reminder Email  
  - Update row in sheet1

- **Node Details:**

  - **Schedule For Remind Pending work**  
    - *Type:* Schedule Trigger  
    - *Role:* Triggers at 6 PM to start reminder process  
    - *Config:* Trigger at hour 18 (6:00 PM)  
    - *Connections:* Outputs to Fetch Pending Records  
    - *Edge Cases:* Same as morning schedule; ensure correct timezone.

  - **Fetch Pending Records**  
    - *Type:* Google Sheets  
    - *Role:* Reads MR plan sheet filtering rows where “Status” = “Pending” (unreported visits)  
    - *Config:* Same sheet and filter as morning fetch  
    - *Connections:* Outputs to Send Reminder Email  
    - *Edge Cases:* No pending records; sheet access or auth issues.

  - **Send Reminder Email**  
    - *Type:* Gmail (OAuth2)  
    - *Role:* Sends reminder email urging MR to update visit status via Google Form  
    - *Config:*  
      - To: MR’s email from sheet  
      - Subject: “Reminder – Please Update Today's Visit Status”  
      - Message: HTML with form link (fallback to generic link if missing)  
    - *Connections:* Outputs to Update row in sheet1  
    - *Edge Cases:* Email send failures, missing email, malformed message.

  - **Update row in sheet1**  
    - *Type:* Google Sheets (update)  
    - *Role:* Updates the row to mark “Reminder” as “Yes” and changes “Status” to “Assigned”  
    - *Config:* Matches on row ID, updates fields accordingly  
    - *Connections:* None (end of reminder flow)  
    - *Edge Cases:* Update failures, missed row ID, concurrency issues.

---

#### 2.3 Nightly Reporting and Summary

- **Overview:**  
  Late at night, this block collects all submitted form responses, processes each via an AI agent to generate structured summaries, and emails a consolidated report to the manager.

- **Nodes Involved:**  
  - Schedule for Summary Update  
  - Fetch Form Responses  
  - AI Agent  
  - Send Summary to Manager  
  - OpenAI Chat Model

- **Node Details:**

  - **Schedule for Summary Update**  
    - *Type:* Schedule Trigger  
    - *Role:* Triggers the summary workflow at 11 PM daily  
    - *Config:* Trigger at hour 23 (11:00 PM)  
    - *Connections:* Outputs to Fetch Form Responses  
    - *Edge Cases:* Schedule mismatch.

  - **Fetch Form Responses**  
    - *Type:* Google Sheets  
    - *Role:* Reads Google Form responses sheet containing MR daily visit updates  
    - *Config:* Sheet ID and GID point to form response tab  
    - *Connections:* Outputs each response to AI Agent  
    - *Edge Cases:* Missing or malformed responses, sheet access issues.

  - **AI Agent**  
    - *Type:* Langchain Agent Node  
    - *Role:* Processes each form response JSON, normalizes data, infers doctor specialty, extracts key facts, and generates a structured summary JSON for manager reporting  
    - *Config:* Complex prompt instructing AI to parse fields, infer urgency, create email-ready content in JSON format only  
    - *Connections:* Outputs JSON to Send Summary to Manager  
    - *Edge Cases:* AI API failures, malformed input data, missing fields, slow response.

  - **OpenAI Chat Model**  
    - *Type:* Langchain OpenAI Chat Model  
    - *Role:* Provides the language model backend (GPT-4.1-mini) for the AI Agent  
    - *Config:* Model selection for GPT-4.1-mini, connected as AI Agent’s language model  
    - *Connections:* Feeds AI Agent  
    - *Edge Cases:* OpenAI API quota, latency, or authentication issues.

  - **Send Summary to Manager**  
    - *Type:* Gmail (OAuth2)  
    - *Role:* Sends a consolidated daily summary email to manager (fixed recipient) with formatted HTML built dynamically from AI Agent output  
    - *Config:*  
      - To: kalpitbm@weblineapps.com  
      - Subject: “MR Daily Summary Report – [Current Date]”  
      - Message: HTML constructed via complex expression that parses AI Agent JSON output, includes subject, headline, bullets, details, urgency badges, actions, and metadata  
    - *Connections:* None (end of workflow)  
    - *Edge Cases:* Email failures, invalid JSON from AI Agent, missing data fields.

---

### 3. Summary Table

| Node Name               | Node Type                 | Functional Role                        | Input Node(s)              | Output Node(s)            | Sticky Note                                                                                                                     |
|-------------------------|---------------------------|--------------------------------------|----------------------------|---------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| Schedule To Assign Work  | Schedule Trigger          | Trigger morning assignment at 9 AM   |                            | Fetch MR Sheet            | See Sticky Note "Daily Work Assignment" describing morning flow                                                                 |
| Fetch MR Sheet          | Google Sheets             | Reads MR plan sheet for "Pending"    | Schedule To Assign Work     | Send Plan Email to MR      | See Sticky Note "Daily Work Assignment"                                                                                         |
| Send Plan Email to MR    | Gmail (OAuth2)            | Emails daily visit plan to MR         | Fetch MR Sheet             | Update row in sheet        | See Sticky Note "Daily Work Assignment"                                                                                         |
| Update row in sheet      | Google Sheets (update)    | Updates row status to "Assigned"     | Send Plan Email to MR       |                           | See Sticky Note "Daily Work Assignment"                                                                                         |
| Schedule For Remind Pending work | Schedule Trigger    | Trigger evening reminder at 6 PM     |                            | Fetch Pending Records      | See Sticky Note "Reminder Flow" describing evening reminder process                                                             |
| Fetch Pending Records    | Google Sheets             | Reads MR plan for pending visits      | Schedule For Remind Pending work | Send Reminder Email   | See Sticky Note "Reminder Flow"                                                                                                 |
| Send Reminder Email      | Gmail (OAuth2)            | Sends reminder to MR for form update | Fetch Pending Records       | Update row in sheet1       | See Sticky Note "Reminder Flow"                                                                                                 |
| Update row in sheet1     | Google Sheets (update)    | Marks reminder sent and updates status | Send Reminder Email       |                           | See Sticky Note "Reminder Flow"                                                                                                 |
| Schedule for Summary Update | Schedule Trigger        | Trigger nightly summary at 11 PM     |                            | Fetch Form Responses       | See Sticky Note "Reporting and Summary" describing nightly reporting block                                                     |
| Fetch Form Responses     | Google Sheets             | Reads all form responses              | Schedule for Summary Update | AI Agent                  | See Sticky Note "Reporting and Summary"                                                                                         |
| AI Agent                | Langchain Agent Node      | Converts form data to structured summary | Fetch Form Responses      | Send Summary to Manager    | See Sticky Note "Reporting and Summary"                                                                                         |
| OpenAI Chat Model        | Langchain OpenAI Model    | Provides GPT-4.1-mini to AI Agent    |                            | AI Agent                  |                                                                                                                                |
| Send Summary to Manager  | Gmail (OAuth2)            | Sends consolidated report to manager | AI Agent                   |                           | See Sticky Note "Reporting and Summary"                                                                                         |
| Sticky Note             | Sticky Note               | Documentation nodes for user guidance |                            |                           | Multiple sticky notes provide detailed workflow explanations and setup instructions                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule To Assign Work node**  
   - Type: Schedule Trigger  
   - Set to run daily at 9:00 AM local time.

2. **Create Fetch MR Sheet node**  
   - Type: Google Sheets  
   - Credentials: OAuth2 Google Sheets account connected  
   - Document ID: Set to your MR Plan Google Sheet ID  
   - Sheet: Set to first sheet (gid=0) or appropriate tab  
   - Filter: Only rows where “Status” = “Pending”  
   - Connect output from Schedule To Assign Work.

3. **Create Send Plan Email to MR node**  
   - Type: Gmail (OAuth2)  
   - Credentials: Gmail OAuth2 account connected  
   - To: Expression `={{ $json.Email }}`  
   - Subject: Expression `=Your Visit Plan for Today – {{ $json.MR_Name }}`  
   - Message (HTML): Include MR_Name, Visit_Doctor, Visit_Location, and Form_Link with HTML formatting as in the original  
   - Connect output from Fetch MR Sheet.

4. **Create Update row in sheet node**  
   - Type: Google Sheets (update)  
   - Credentials: Same Google Sheets OAuth2 account  
   - Document ID and Sheet: Same as Fetch MR Sheet  
   - Match on row ID from input JSON  
   - Update “Status” field to “Assigned” and copy all other fields from input  
   - Connect output from Send Plan Email to MR.

5. **Create Schedule For Remind Pending work node**  
   - Type: Schedule Trigger  
   - Set to run daily at 6:00 PM local time.

6. **Create Fetch Pending Records node**  
   - Type: Google Sheets  
   - Same credentials and sheet as Fetch MR Sheet  
   - Filter rows with “Status” = “Pending”  
   - Connect output from Schedule For Remind Pending work.

7. **Create Send Reminder Email node**  
   - Type: Gmail (OAuth2)  
   - Credentials: Gmail OAuth2 account  
   - To: Expression `={{ $json.Email }}`  
   - Subject: “Reminder – Please Update Today's Visit Status”  
   - Message (HTML): Include MR_Name and Form_Link, fallback to generic form link if missing  
   - Connect output from Fetch Pending Records.

8. **Create Update row in sheet1 node**  
   - Type: Google Sheets (update)  
   - Credentials: Google Sheets OAuth2 account  
   - Document ID and Sheet: Same as Fetch MR Sheet  
   - Match on row ID  
   - Update “Status” to “Assigned”, set “Reminder” field to “Yes”, copy other fields  
   - Connect output from Send Reminder Email.

9. **Create Schedule for Summary Update node**  
   - Type: Schedule Trigger  
   - Set to run daily at 11:00 PM local time.

10. **Create Fetch Form Responses node**  
    - Type: Google Sheets  
    - Credentials: Google Sheets OAuth2 account  
    - Document ID: Same sheet  
    - Sheet: Form Responses tab GID (e.g., 2027534892)  
    - Connect output from Schedule for Summary Update.

11. **Create AI Agent node**  
    - Type: Langchain Agent Node  
    - Credentials: OpenAI API account connected  
    - Prompt: Use provided detailed prompt that instructs the AI to parse raw MR visit JSON into structured summary JSON with subject, bullets, urgency, action items, etc.  
    - Connect output from Fetch Form Responses.

12. **Create OpenAI Chat Model node**  
    - Type: Langchain OpenAI Chat Model  
    - Credentials: Same OpenAI API account  
    - Model: GPT-4.1-mini  
    - Connect output to AI Agent’s language model input.

13. **Create Send Summary to Manager node**  
    - Type: Gmail (OAuth2)  
    - Credentials: Gmail OAuth2 account  
    - To: Fixed email “kalpitbm@weblineapps.com”  
    - Subject: Expression `"MR Daily Summary Report – {{ $now.toFormat('dd MMM yyyy') }}"`  
    - Message (HTML): Use complex JavaScript expression to parse AI Agent output JSON and format a styled HTML email with subject, headline, bullets, urgency badge, details, action items, and metadata.  
    - Connect output from AI Agent.

14. **Optional:** Create Sticky Note nodes for documentation inside n8n editor for user guidance.

15. **Test Workflow:**  
    - Verify credentials for Google Sheets, Gmail, OpenAI are valid and authorized.  
    - Test each trigger manually or wait for scheduled times.  
    - Confirm emails are sent with correct dynamic content.  
    - Monitor for errors or data mismatches.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Context or Link                                                                                          |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| This workflow automates MR daily visit assignments, reminders, and manager reporting with AI-generated summaries to reduce manual coordination and improve data quality. Requires Google Sheets with MR plan and form responses, Gmail account, OpenAI API credentials, and scheduled triggers aligned to local working hours.                                                                                                                                                                                                                                                                                                                            | Workflow purpose and setup instructions                                                                |
| OpenAI prompt embedded in AI Agent node extensively parses raw form data, infers missing info, and outputs standardized JSON for reporting. Modifying the prompt can customize summary style and data extraction.                                                                                                                                                                                                                                                                                                                                                                                                 | AI prompt design                                                                                         |
| Ensure Google Sheets document IDs and sheet GIDs are updated to your actual MR Plan and Form Responses sheets. Form link must be included in MR Plan sheet for email personalization.                                                                                                                                                                                                                                                                                                                                                                                                        | Sheet ID and form link configuration                                                                    |
| Gmail OAuth2 credentials must have appropriate scopes to send emails. OpenAI API quota limits and pricing apply for AI node usage.                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Credential requirements                                                                                   |
| Sticky Notes inside the workflow provide detailed explanations per block for easier onboarding and maintenance.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Inline documentation in workflow editor                                                                  |
| Email messages use basic HTML formatting for consistent rendering across clients. The summary email uses dynamic HTML construction via JavaScript expression in n8n to handle varying AI output gracefully.                                                                                                                                                                                                                                                                                                                                                                                        | Email formatting details                                                                                   |
| For large teams, consider batching or paginating Google Sheets reads to avoid API limits. Monitor execution logs for rate limits or errors.                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Scalability and error anticipation                                                                       |

---

**Disclaimer:** The provided text is derived exclusively from an automated workflow created with n8n, adhering strictly to current content policies and containing no illegal, offensive, or protected material. All handled data is legal and public.