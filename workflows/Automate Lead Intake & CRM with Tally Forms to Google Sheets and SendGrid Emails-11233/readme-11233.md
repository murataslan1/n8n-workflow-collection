Automate Lead Intake & CRM with Tally Forms to Google Sheets and SendGrid Emails

https://n8nworkflows.xyz/workflows/automate-lead-intake---crm-with-tally-forms-to-google-sheets-and-sendgrid-emails-11233


# Automate Lead Intake & CRM with Tally Forms to Google Sheets and SendGrid Emails

### 1. Workflow Overview

This workflow automates lead intake from a Tally form submission into a CRM built on Google Sheets, tags leads based on their interests, schedules follow-ups, and sends personalized welcome emails through SendGrid. It is designed for marketing or sales teams wanting to streamline lead capture, organization, and initial engagement.

Logical blocks:

- **1.1 Lead Reception and Identification**: Receiving form data via webhook, extracting and structuring lead information, and generating a unique lead ID.
- **1.2 Lead Tagging and Scoring**: Automatically tagging leads based on services and keywords, and calculating follow-up dates and lead scores according to interest levels.
- **1.3 CRM Update and Activity Logging**: Appending or updating lead data in Google Sheets CRM and logging lead capture activity.
- **1.4 Email Generation and Delivery**: Creating personalized welcome emails based on lead tags and sending them via SendGrid.
- **1.5 Lead Status Update**: Updating the lead status to "Nurturing" in the CRM after email delivery.

---

### 2. Block-by-Block Analysis

#### 1.1 Lead Reception and Identification

**Overview:**  
This block captures incoming lead data from a Tally form submission webhook, extracts key lead details, and generates a unique lead ID and structured lead object.

**Nodes Involved:**  
- Receive Lead from Tally Form (Webhook)  
- Generate Unique Lead ID (Code)

**Node Details:**

- **Receive Lead from Tally Form**  
  - Type: Webhook  
  - Role: Entry point to receive HTTP POST requests from Tally form submissions.  
  - Configuration: Path is fixed to webhook ID; method POST; response mode set to last node.  
  - Inputs: External HTTP POST from Tally on form submission.  
  - Outputs: Raw JSON form data with nested fields array.  
  - Edge Cases: Network issues, webhook misconfiguration, unexpected payload format.

- **Generate Unique Lead ID**  
  - Type: Code (JavaScript)  
  - Role: Parses form response fields, extracts name, email, business type, interest level, and services; generates a unique lead ID using timestamp and random number.  
  - Configuration: Uses helper function to find fields by label or key; processes multiple choice and checkbox fields for human-readable text.  
  - Inputs: JSON from webhook node.  
  - Outputs: Structured JSON object with extracted lead data and generated leadId.  
  - Edge Cases: Missing or malformed fields, labels not matching expected strings, empty arrays.

#### 1.2 Lead Tagging and Scoring

**Overview:**  
This block assigns tags to leads based on selected services or keywords and calculates follow-up scheduling and lead scoring based on interest level.

**Nodes Involved:**  
- Auto-Tag Lead by Services (Code)  
- Calculate Follow-up Date & Lead Score (Code)

**Node Details:**

- **Auto-Tag Lead by Services**  
  - Type: Code (JavaScript)  
  - Role: Maps selected services to predefined tags; performs keyword detection fallback on business type and services fields; ensures at least one tag is assigned ("General Lead").  
  - Configuration: Uses dictionaries for service to tag mapping and keyword detection; combines detected tags into a string.  
  - Inputs: Structured lead JSON from previous node.  
  - Outputs: JSON enriched with tags string and detectedTags array.  
  - Edge Cases: Empty or unexpected service arrays, missing fields, text case sensitivity.

- **Calculate Follow-up Date & Lead Score**  
  - Type: Code (JavaScript)  
  - Role: Sets next follow-up date based on interest level with variable days offset; assigns an initial lead score; initializes various lead state fields such as status, nurture stage, and engagement metrics.  
  - Configuration: Uses current date, parses interest level strings, defaults for unknown levels.  
  - Inputs: JSON with tags and lead data.  
  - Outputs: JSON enriched with scheduling dates, status "New Lead", scoring, and tracking fields.  
  - Edge Cases: Interest level missing or malformed; timezone considerations for date calculations.

#### 1.3 CRM Update and Activity Logging

**Overview:**  
This block appends the newly created lead to the Google Sheets CRM and logs the activity in an activity tracker sheet.

**Nodes Involved:**  
- Save Lead to CRM Sheet (Google Sheets)  
- Log Activity to Tracker (Google Sheets)

**Node Details:**

- **Save Lead to CRM Sheet**  
  - Type: Google Sheets (Append)  
  - Role: Adds new lead data to a "Leads" sheet with detailed columns including tags, score, contact dates, and status.  
  - Configuration: Columns mapped to lead JSON properties; uses a predefined Google Sheets OAuth2 credential; appends data to the sheet with gid=0.  
  - Inputs: JSON with complete lead data including calculated fields.  
  - Outputs: Confirmation of append operation; passes data forward.  
  - Edge Cases: Credential expiry, sheet access permission, data type mismatches.

- **Log Activity to Tracker**  
  - Type: Google Sheets (Append)  
  - Role: Logs the lead capture event with timestamp, lead ID, name, and tags in an "Activity Log" sheet.  
  - Configuration: Maps form submission details and current timestamp; uses same Google Sheets OAuth2 credential; appends to a sheet with specific gid.  
  - Inputs: Same lead data as previous node.  
  - Outputs: Confirmation of append operation.  
  - Edge Cases: Same as above plus timestamp formatting issues.

#### 1.4 Email Generation and Delivery

**Overview:**  
This block crafts a customized welcome email based on lead tags and sends it through SendGrid.

**Nodes Involved:**  
- Generate Personalized Welcome Email (Code)  
- Send Welcome Email via SendGrid (SendGrid)

**Node Details:**

- **Generate Personalized Welcome Email**  
  - Type: Code (JavaScript)  
  - Role: Builds a personalized email subject and body text referencing detected lead tags to mention relevant services; includes introductory text and next steps.  
  - Configuration: Conditional logic selecting service mention based on tags; fixed email template with placeholders for name and tags.  
  - Inputs: Lead JSON with detectedTags and name.  
  - Outputs: JSON carrying emailSubject and emailBody properties.  
  - Edge Cases: Missing name or tags, encoding issues in email body.

- **Send Welcome Email via SendGrid**  
  - Type: SendGrid node  
  - Role: Sends the constructed welcome email to the lead’s email address.  
  - Configuration: Uses SendGrid API credential; email subject and body are expressions referencing previous node outputs; sends to lead’s email.  
  - Inputs: JSON with emailSubject, emailBody, and email address.  
  - Outputs: Confirmation of mail send.  
  - Edge Cases: API key invalidity, email delivery failures, invalid email addresses.

#### 1.5 Lead Status Update

**Overview:**  
After sending the welcome email, this block updates the lead’s status in the CRM to "Nurturing," records the nurture stage and last email sent date.

**Nodes Involved:**  
- Update Lead Status to Nurturing (Google Sheets)

**Node Details:**

- **Update Lead Status to Nurturing**  
  - Type: Google Sheets (Update)  
  - Role: Updates existing lead row identified by Lead ID to set "Status" to "Nurturing," "Nurture Stage" to 0, and records the current date as the "Last Email Sent".  
  - Configuration: Uses Lead ID as matching column; mapping mode set to update specific fields; uses same Google Sheets OAuth2 credential.  
  - Inputs: JSON with leadId and current date.  
  - Outputs: Confirmation of update.  
  - Edge Cases: Lead ID not found, concurrent updates, sheet permission errors.

---

### 3. Summary Table

| Node Name                      | Node Type         | Functional Role                     | Input Node(s)                | Output Node(s)                           | Sticky Note                                                                                                                                                          |
|--------------------------------|-------------------|-----------------------------------|-----------------------------|-----------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Sticky Note                    | Sticky Note       | Documentation note                |                             |                                         | ## LEAD INTAKE & CRM AUTOMATION... Setup instructions and template link: https://docs.google.com/spreadsheets/d/1U6PG53V2IDjax3eDurufyvM8iSn_Su_YOfOCDC_M3lY/edit?usp=sharing |
| Sticky Note1                   | Sticky Note       | Section title                     |                             |                                         | ## 1. Arrange lead(s)                                                                                                                                               |
| Sticky Note6                   | Sticky Note       | Section title                     |                             |                                         | ## 2. Save to CRM                                                                                                                                                   |
| Sticky Note9                   | Sticky Note       | Section title                     |                             |                                         | ## 3. Send email & update CRM                                                                                                                                      |
| Receive Lead from Tally Form   | Webhook           | Entry point receiving form data   |                             | Generate Unique Lead ID                  |                                                                                                                                                                    |
| Generate Unique Lead ID        | Code              | Extracts lead info & generates ID | Receive Lead from Tally Form | Auto-Tag Lead by Services                |                                                                                                                                                                    |
| Auto-Tag Lead by Services      | Code              | Assigns tags based on services    | Generate Unique Lead ID      | Calculate Follow-up Date & Lead Score   |                                                                                                                                                                    |
| Calculate Follow-up Date & Lead Score | Code        | Calculates follow-up dates and lead score | Auto-Tag Lead by Services    | Save Lead to CRM Sheet                   |                                                                                                                                                                    |
| Save Lead to CRM Sheet         | Google Sheets     | Saves lead data to CRM sheet      | Calculate Follow-up Date & Lead Score | Log Activity to Tracker, Generate Personalized Welcome Email |                                                                                                                                                                    |
| Log Activity to Tracker        | Google Sheets     | Logs lead capture activity        | Save Lead to CRM Sheet       |                                         |                                                                                                                                                                    |
| Generate Personalized Welcome Email | Code          | Generates customized welcome email | Save Lead to CRM Sheet       | Send Welcome Email via SendGrid          |                                                                                                                                                                    |
| Send Welcome Email via SendGrid| SendGrid          | Sends welcome email               | Generate Personalized Welcome Email |                                         |                                                                                                                                                                    |
| Update Lead Status to Nurturing | Google Sheets    | Updates lead status to "Nurturing" | Send Welcome Email via SendGrid |                                         |                                                                                                                                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node "Receive Lead from Tally Form"**  
   - Type: Webhook (HTTP POST)  
   - Path: Unique webhook ID (e.g., "953a8fef-50bf-46a6-b17c-305d79a6ee07")  
   - Response Mode: Last Node  
   - Purpose: Receive form submissions from Tally.

2. **Create Code Node "Generate Unique Lead ID"**  
   - Connect from "Receive Lead from Tally Form"  
   - JavaScript extracts lead fields (name, email, business type, interest level, services) from input JSON.  
   - Generates unique lead ID using current timestamp + random number.  
   - Returns structured JSON with lead data.

3. **Create Code Node "Auto-Tag Lead by Services"**  
   - Connect from "Generate Unique Lead ID"  
   - Maps selected services to tags, falls back to keyword detection in business type and services.  
   - Ensures at least one tag ("General Lead") is assigned.  
   - Outputs updated JSON with tags array and string.

4. **Create Code Node "Calculate Follow-up Date & Lead Score"**  
   - Connect from "Auto-Tag Lead by Services"  
   - Uses interest level to calculate nextTouch date and initial lead score.  
   - Initializes lead status as "New Lead" and other lead tracking fields.

5. **Create Google Sheets Node "Save Lead to CRM Sheet"**  
   - Connect from "Calculate Follow-up Date & Lead Score"  
   - Operation: Append  
   - Document ID: Your Google Sheet containing CRM ("Complete Mini CRM")  
   - Sheet Name: "Leads" (gid=0)  
   - Map columns: Name, Tags, Email, Notes, Status, Lead ID, Services (joined string), Lead Score, Next Touch, Email Opens, Lead Source, Created Date, Email Clicks, Last Contact, Business Type, Days Inactive, Nurture Stage, Interest Level, Meeting Booked, Last Email Sent, Calendly Clicked, Lead Magnet Sent.  
   - Credentials: Google Sheets OAuth2 with proper access.

6. **Create Google Sheets Node "Log Activity to Tracker"**  
   - Connect from "Save Lead to CRM Sheet" main output  
   - Operation: Append  
   - Document ID: Same as above  
   - Sheet Name: "Activity Log" (gid=1376113895)  
   - Map columns: Timestamp (current ISO timestamp), Lead ID, Name, Activity Type ("Lead Captured"), Details (summary string including tags).  
   - Credentials: Same Google Sheets OAuth2.

7. **Create Code Node "Generate Personalized Welcome Email"**  
   - Connect from "Save Lead to CRM Sheet" main output (parallel with Log Activity)  
   - JavaScript: Generates email subject and body tailored to lead tags, inserts lead name and relevant service mentions, includes next steps and contact info.

8. **Create SendGrid Node "Send Welcome Email via SendGrid"**  
   - Connect from "Generate Personalized Welcome Email"  
   - Subject: Expression referencing emailSubject from previous node.  
   - To Email: Expression referencing lead's email.  
   - Content: Expression referencing emailBody.  
   - Credentials: SendGrid API key properly configured.

9. **Create Google Sheets Node "Update Lead Status to Nurturing"**  
   - Connect from "Send Welcome Email via SendGrid"  
   - Operation: Update  
   - Document ID and Sheet: Same as above, "Leads" sheet.  
   - Matching Column: Lead ID  
   - Columns to update: Status ("Nurturing"), Nurture Stage (0), Last Email Sent (today's date).  
   - Credentials: Same Google Sheets OAuth2.

10. **Add Sticky Notes for Documentation**  
    - Add sticky notes to describe the workflow overview, blocks, and instructions as per the original layout.

11. **Test the Workflow**  
    - Submit test data from the Tally form to the webhook URL.  
    - Verify that data is processed correctly, lead is saved to Google Sheets, email is sent, and status updated.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                   | Context or Link                                                                                                      |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| Setup instructions: Copy all "GET THE TEMPLATE" sheets; Create Tally form and add webhook URL; Configure Google Sheets and SendGrid credentials properly before activating the workflow.                                                       | Sticky Note content; Template Setup                                                                                  |
| Google Sheets Mini CRM Template available here for easy setup: https://docs.google.com/spreadsheets/d/1U6PG53V2IDjax3eDurufyvM8iSn_Su_YOfOCDC_M3lY/edit?usp=sharing                                                                              | Template reference link                                                                                            |
| The workflow uses a combination of service-based tagging and keyword detection for flexibility in lead classification. Edge cases should be handled by ensuring forms maintain consistent field labels and values.                               | Best practice note                                                                                                  |
| Email personalization is conditional on lead tags and includes clear next steps to improve lead engagement and reduce no-shows.                                                                                                            | Email generation logic                                                                                              |
| Google Sheets operations require OAuth2 credentials with edit access to the specified sheets; SendGrid requires a valid API key with mail sending permissions.                                                                                | Credentials setup note                                                                                              |
| Date and time handling assumes UTC timezone and ISO date formatting for consistency across systems.                                                                                                                                          | Date handling note                                                                                                  |

---

This completes the comprehensive documentation and analysis of the "Automate Lead Intake & CRM with Tally Forms to Google Sheets and SendGrid Emails" workflow.