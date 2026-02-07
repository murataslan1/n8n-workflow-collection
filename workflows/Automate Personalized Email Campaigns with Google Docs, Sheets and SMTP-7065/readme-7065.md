Automate Personalized Email Campaigns with Google Docs, Sheets and SMTP

https://n8nworkflows.xyz/workflows/automate-personalized-email-campaigns-with-google-docs--sheets-and-smtp-7065


# Automate Personalized Email Campaigns with Google Docs, Sheets and SMTP

### 1. Workflow Overview

This workflow automates personalized email campaigns by integrating Google Docs, Google Sheets, and an SMTP server. It targets users who want to send customized emails to a list of contacts stored in Google Sheets, using a Google Docs document as an email template. The workflow dynamically replaces placeholders in the template with contact-specific data, sends the emails one by one respecting SMTP provider quotas, and updates the sheet to track sent emails.

Logical blocks:

- **1.1 Trigger and Settings Initialization:** Starts the workflow periodically and sets up campaign parameters.
- **1.2 Template and Contacts Retrieval:** Fetches the email template from Google Docs and the contact list from Google Sheets.
- **1.3 Filtering Contacts for Emailing:** Filters contacts who have not yet been processed or errored out.
- **1.4 Email Content Personalization:** Merges contact data into the template to create personalized email bodies.
- **1.5 Batch Processing and Email Sending:** Sends emails individually with delays to respect SMTP quota.
- **1.6 Post-Sending Update:** Updates the Google Sheet to mark contacts as processed after successful email sending.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger and Settings Initialization

- **Overview:** Periodically triggers the workflow and initializes static campaign settings including subject, and document IDs.
- **Nodes Involved:** Schedule Trigger, settings
- **Node Details:**

  - **Schedule Trigger**
    - Type: Schedule Trigger
    - Configuration: Interval trigger every few seconds (configured as "seconds" interval, actual value unspecified)
    - Input/Output: No inputs; outputs trigger signal to "settings"
    - Edge Cases: Misconfiguration of interval could cause unwanted frequency; ensure reasonable interval to avoid overloading SMTP.
  
  - **settings**
    - Type: Set
    - Role: Defines campaign parameters: email subject, Google Docs ID (template), Google Sheets ID (contacts)
    - Key Expressions: Static string values for subject and document IDs; placeholders to be replaced by user.
    - Output: Feeds "template" and "contacts" nodes
    - Edge Cases: If IDs or subject are missing or incorrect, subsequent nodes will fail fetching data.

#### 1.2 Template and Contacts Retrieval

- **Overview:** Retrieves the email template content from Google Docs and loads the contacts list from Google Sheets.
- **Nodes Involved:** template (Google Docs), contacts (Google Sheets)
- **Node Details:**

  - **template**
    - Type: Google Docs
    - Operation: Get document content by URL (from settings.googledocid)
    - Execute Once: true (runs once per trigger)
    - Input: receives document ID from "settings"
    - Output: outputs raw document content for merging
    - Edge Cases: Authentication errors or invalid document URL cause failure; document content must be plain text containing placeholders.
  
  - **contacts**
    - Type: Google Sheets
    - Operation: Read rows from the specified sheet (sheetName: "contacts" assumed)
    - Document ID: from settings.googlesheetid
    - Output: array of contact objects with columns like email, firstname, lastname, company, process, err, row_number
    - Edge Cases: Authentication failures; if sheet or columns missing, data retrieval will fail.

#### 1.3 Filtering Contacts for Emailing

- **Overview:** Filters out contacts that have already been processed or have error flags to avoid re-emailing.
- **Nodes Involved:** notemailed (Filter)
- **Node Details:**

  - **notemailed**
    - Type: Filter
    - Conditions: Only passes contacts where both 'process' and 'err' fields are empty strings
    - Input: contacts list
    - Output: filtered contacts for emailing
    - Edge Cases: If fields are missing or misnamed, filtering may not work; empty string check is strict and case-sensitive.

#### 1.4 Email Content Personalization

- **Overview:** Combines the template with contact data by replacing placeholders with actual values.
- **Nodes Involved:** merge (Merge), updatebody (Set)
- **Node Details:**

  - **merge**
    - Type: Merge
    - Mode: Combine all inputs (template + filtered contacts)
    - Input: template content and filtered contacts
    - Output: Combined data for personalization
    - Edge Cases: Mismatch in input data arrays could cause unexpected output.
  
  - **updatebody**
    - Type: Set
    - Role: Replaces template placeholders with contact-specific values:
      - Replaces `{{email}}`, `{{company}}`, `{{firstname}}`, `{{lastname}}` in template content with respective contact fields
    - Key Expressions: Uses JavaScript replaceAll with regex to substitute placeholders globally and case-insensitively.
    - Output: Emits personalized email text plus contact’s email address for sending.
    - Edge Cases: If any contact field is missing, placeholders remain unreplaced; template syntax errors could cause failures.

#### 1.5 Batch Processing and Email Sending

- **Overview:** Processes emails one by one, sending each email and waiting between sends to respect SMTP quotas.
- **Nodes Involved:** Loop Over Items (SplitInBatches), sendemail (Email Send), Wait, No Operation
- **Node Details:**

  - **Loop Over Items**
    - Type: SplitInBatches
    - Configuration: Batch size 1 (process emails individually)
    - Input: personalized email data from updatebody
    - Output: sends each item sequentially to sendemail and No Operation nodes
    - Edge Cases: Large contact lists will slow down processing; batch size of 1 is deliberate to manage SMTP limits.
  
  - **sendemail**
    - Type: Email Send
    - Configuration:
      - Text body: personalized template content
      - Subject: from settings node’s emailsubject
      - To: contact’s email field
      - From: configured with static email sender string (must be updated by user)
      - Email format: plain text
    - Credential: SMTP account (e.g., OVHCloud)
    - Notes: SMTP quota management is critical, see Wait node
    - Edge Cases: SMTP authentication failure, quota exceeded, invalid email addresses.
  
  - **Wait**
    - Type: Wait
    - Configuration: Waits 20 seconds between email sends
    - Purpose: To throttle email sending respecting SMTP quotas (e.g., 200 emails/hour ≈ 3 emails/minute)
    - Edge Cases: If wait time too short, may hit SMTP limits; user must adjust based on provider.
  
  - **No Operation, do nothing**
    - Type: NoOp
    - Role: Placeholder node allowing parallel connection; no action performed.
    - Edge Cases: None.

#### 1.6 Post-Sending Update

- **Overview:** Updates the Google Sheet to mark contacts as processed by setting the process timestamp.
- **Nodes Involved:** updatecontacts (Google Sheets)
- **Node Details:**

  - **updatecontacts**
    - Type: Google Sheets
    - Operation: Update row matching contact by "row_number"
    - Fields updated:
      - process: current timestamp formatted as 'yyyy-MM-dd, hh:mm:ss a'
    - Document ID and sheet name from settings
    - Input: after sendemail success
    - Edge Cases: If row_number is missing or mismatches, update may fail; sheet permissions must allow edits.

---

### 3. Summary Table

| Node Name               | Node Type           | Functional Role                          | Input Node(s)          | Output Node(s)         | Sticky Note                                                                                                    |
|-------------------------|---------------------|----------------------------------------|------------------------|------------------------|---------------------------------------------------------------------------------------------------------------|
| Schedule Trigger        | Schedule Trigger    | Periodically triggers workflow          | -                      | settings               |                                                                                                               |
| settings                | Set                 | Defines campaign parameters             | Schedule Trigger       | template, contacts     | Set the Subject of your emailing campaign, define the Google Docs & Sheet ID you want to use                  |
| template                | Google Docs         | Retrieves email template content        | settings               | merge                  | Your Google Docs template containing the message with the {{firstname}}, {{lastname}} {{company}}, {{email}} variables. [Google Docs Template](https://docs.google.com/document/d/1sR1Mjee0heur6CgEV_ssYzOUbFNaDnyEnPSt1CFEMWI/edit?usp=sharing) |
| contacts                | Google Sheets       | Retrieves contacts list                  | settings               | notemailed             | *row_number* is used for matching and should contain {{ $('contacts').item.json.row_number }}; *process* is set with current timestamp. [Google Sheet Template](https://docs.google.com/spreadsheets/d/1mFKp3wmbV9qp2tpGGsN72zdiC32y8H1nhjdgP885y-U/edit?usp=sharing) |
| notemailed              | Filter              | Filters contacts not processed or errored | contacts               | merge                  | We only select rows with *process* and *err* columns empty                                                     |
| merge                   | Merge               | Combines template and contacts          | template, notemailed   | updatebody             |                                                                                                               |
| updatebody              | Set                 | Personalizes email body per contact     | merge                  | Loop Over Items        | Replace Google Docs template placeholders with real contact content                                            |
| Loop Over Items         | SplitInBatches      | Processes emails one by one              | updatebody              | sendemail, No Operation |                                                                                                               |
| sendemail               | Email Send          | Sends personalized email                 | Loop Over Items         | updatecontacts         | OVHCloud SMTP; Update with your own SMTP details and adapt the "From Email" field                             |
| updatecontacts          | Google Sheets       | Updates contact row marking process done | sendemail               | Wait                   | *row_number* used for matching; updates *process* column with timestamp                                       |
| Wait                    | Wait                | Waits between sends to throttle quota   | updatecontacts          | Loop Over Items        | SMTP providers have quotas. Example: 200 emails/hour means 3 emails/min. Wait 20 seconds suggested.           |
| No Operation, do nothing | NoOp               | Placeholder node, no action              | Loop Over Items         | -                      |                                                                                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "Schedule Trigger" node**  
   - Type: Schedule Trigger  
   - Set interval trigger on seconds (e.g., every 10 seconds or appropriate frequency)  

2. **Create "settings" node**  
   - Type: Set  
   - Add fields:  
     - emailsubject (string): "Emailing Template - Email Subject" (replace with your subject)  
     - googledocid (string): your Google Docs document ID for the email template  
     - googlesheetid (string): your Google Sheets document ID for contacts  

3. **Connect Schedule Trigger → settings**

4. **Create "template" node**  
   - Type: Google Docs  
   - Operation: Get  
   - Document URL: Use expression `={{ $json.googledocid }}` from settings node  
   - Set "Execute Once" to true  

5. **Connect settings → template**

6. **Create "contacts" node**  
   - Type: Google Sheets  
   - Operation: Read rows from sheet named "contacts"  
   - Document ID: Use expression `={{ $json.googlesheetid }}` from settings node  
   - Credentials: Configure with Google Sheets OAuth2 account  

7. **Connect settings → contacts**

8. **Create "notemailed" node**  
   - Type: Filter  
   - Conditions:  
     - process field is empty string  
     - err field is empty string  

9. **Connect contacts → notemailed**

10. **Create "merge" node**  
    - Type: Merge  
    - Mode: Combine (combine all inputs)  

11. **Connect template → merge (input 1)**  
12. **Connect notemailed → merge (input 2)**

13. **Create "updatebody" node**  
    - Type: Set  
    - Add assignments:  
      - email = `={{ $json.email }}`  
      - template = template content with placeholders replaced by contact fields:  
        ```
        ={{ $json.content
          .replaceAll(/\{\{ ?email ?\}\}/gm, $json["email"])
          .replaceAll(/\{\{ ?company ?\}\}/gm, $json["company"])
          .replaceAll(/\{\{ ?firstname ?\}\}/gm, $json["firstname"])
          .replaceAll(/\{\{ ?lastname ?\}\}/gm, $json["lastname"])
        }}
        ```  

14. **Connect merge → updatebody**

15. **Create "Loop Over Items" node**  
    - Type: SplitInBatches  
    - Batch size: 1 (to send emails individually)  

16. **Connect updatebody → Loop Over Items**

17. **Create "sendemail" node**  
    - Type: Email Send  
    - Text: `={{ $json.template }}`  
    - Subject: `={{ $('settings').item.json.emailsubject }}`  
    - To Email: `={{ $json.email }}`  
    - From Email: e.g., "myfirstname / mycompany<myemail@mydomain.com>" (replace with your sender info)  
    - Email format: text  
    - Credentials: configure with your SMTP account (e.g., OVHCloud)  

18. **Connect Loop Over Items → sendemail**

19. **Create "updatecontacts" node**  
    - Type: Google Sheets  
    - Operation: Update row  
    - Document ID: `={{ $('settings').item.json.googlesheetid }}`  
    - Sheet Name: "contacts"  
    - Matching Columns: ["row_number"]  
    - Columns to update:  
      - process = `={{ $now.format('yyyy-MM-dd, hh:mm:ss a') }}`  
      - row_number = `={{ $('contacts').item.json.row_number }}` (for matching)  
    - Credentials: Google Sheets OAuth2 account  

20. **Connect sendemail → updatecontacts**

21. **Create "Wait" node**  
    - Type: Wait  
    - Amount: 20 seconds (adjust based on SMTP quota)  

22. **Connect updatecontacts → Wait**

23. **Connect Wait → Loop Over Items** (to continue processing next email)

24. **Create "No Operation, do nothing" node**  
    - Type: NoOp  

25. **Connect Loop Over Items → No Operation** (parallel output to maintain workflow structure)

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                       | Context or Link                                                                                                  |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| SMTP providers (like OVHcloud) have quota limits. For example, 200 emails/hour means max 3 emails/minute. A 20-second wait between emails is recommended to avoid being blocked.                                                                                                                                                                                                                    | Sticky Note on Wait node                                                                                         |
| The Google Docs template email can include placeholders: `{{firstname}}`, `{{lastname}}`, `{{company}}`, `{{email}}` that will be replaced dynamically with contact data.                                                                                                                                                                                                                         | Sticky Note on updatebody node                                                                                   |
| The Google Sheet must contain columns: email, firstname, lastname, company, process, err, row_number. The row_number is used to match contacts when updating, and process is updated with a timestamp after sending.                                                                                                                                                                               | Sticky Note on contacts node                                                                                      |
| Use the provided [Google Docs Template](https://docs.google.com/document/d/1sR1Mjee0heur6CgEV_ssYzOUbFNaDnyEnPSt1CFEMWI/edit?usp=sharing) and [Google Sheet Template](https://docs.google.com/spreadsheets/d/1mFKp3wmbV9qp2tpGGsN72zdiC32y8H1nhjdgP885y-U/edit?usp=sharing) as starting points for your campaign.                                                                 | Documentation sticky note                                                                                        |
| Credentials required: Google OAuth2 for Sheets and Docs access, SMTP credentials for email sending. Ensure these are properly set up in n8n before running the workflow.                                                                                                                                                                                                                            | General setup note                                                                                               |
| Tested on n8n version 1.105.2 (Ubuntu). Adjust node versions or parameters if using different versions.                                                                                                                                                                                                                                                                                            | Version compatibility note                                                                                       |
| For support or questions, contact the author on [LinkedIn](https://www.linkedin.com/in/stephaneheckel/) or the [n8n Community Forum](https://community.n8n.io/).                                                                                                                                                                                                                                    | Support resources                                                                                                |

---

**Disclaimer:** The text provided is generated exclusively from an automated workflow created with n8n, respecting all content policies. It contains no illegal, offensive, or protected content. All data processed is legal and public.