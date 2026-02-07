Automate Event Registration & Follow-ups with Gmail Reminders & Google Sheets

https://n8nworkflows.xyz/workflows/automate-event-registration---follow-ups-with-gmail-reminders---google-sheets-6069


# Automate Event Registration & Follow-ups with Gmail Reminders & Google Sheets

### 1. Workflow Overview

This workflow automates the registration process for an event, manages attendee data, and orchestrates email reminders leading up to the event using Gmail and Google Sheets integration. It is suited for organizers who want to streamline event signups, confirmations, and timely follow-ups without manual intervention.

Logical blocks:

- **1.1 Input Reception**: Captures registration data via a webhook.
- **1.2 Event Configuration**: Defines event parameters like date, capacity, and email templates.
- **1.3 Registration Validation and Processing**: Validates input, enriches data with unique IDs, reminder dates, and event details.
- **1.4 Confirmation & Tracking**: Sends confirmation emails and logs the registration in Google Sheets.
- **1.5 Scheduled Email Reminders**: Sends a sequence of reminder emails 7 days, 1 day, and 2 hours before the event.
- **1.6 Post-Event Follow-up (Note for extension)**: Indicates potential follow-up actions after the event (not implemented as nodes).

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
Receives event registration submissions via an HTTP POST webhook.

- **Nodes Involved:**  
  - Event Registration Webhook

- **Node Details:**

  - **Event Registration Webhook**  
    - Type: Webhook (HTTP endpoint)  
    - Role: Entry point for capturing registration data (name, email, etc.)  
    - Configuration: HTTP POST on path `/event-registration`  
    - Inputs: External POST requests with JSON payload  
    - Outputs: Passes registration data downstream  
    - Edge cases: Missing or malformed HTTP requests may cause failures; no explicit validation on webhook inputs here  
    - Version: n8n v1+ compatible  

---

#### 2.2 Event Configuration

- **Overview:**  
Sets up static event parameters such as maximum capacity, event start/end, and related settings.

- **Nodes Involved:**  
  - Sticky Note (Event Management Config)  
  - Event Settings

- **Node Details:**

  - **Sticky Note**  
    - Type: Sticky Note  
    - Role: Documentation for event configuration (no runtime effect)  
    - Content: Lists customizable elements like event details, email templates, reminder times, capacity limits  

  - **Event Settings**  
    - Type: Set  
    - Role: Defines event-specific variables for use downstream  
    - Key Configurations:  
      - `maxCapacity` = 100  
      - `eventDate` = 2025-07-25T14:00:00Z  
      - `eventEndDate` = 2025-07-25T16:00:00Z  
    - Inputs: Registration data from webhook  
    - Outputs: Event parameters passed to validation and processing  
    - Edge cases: Static values require manual update for new events; no dynamic configuration  
    - Version: n8n v1+ compatible  

---

#### 2.3 Registration Validation and Processing

- **Overview:**  
Validates essential registration fields and enriches registration data with unique identifiers, reminder timings, calendar event details, and online access credentials.

- **Nodes Involved:**  
  - Validate Registration  
  - Process Registration

- **Node Details:**

  - **Validate Registration**  
    - Type: If  
    - Role: Ensures registration has non-empty `email` and `name` and that email contains "@"  
    - Conditions:  
      - `email` is not empty  
      - `name` is not empty  
      - `email` contains "@" symbol  
    - Inputs: Event Settings node output with registration data  
    - Outputs: Passes valid registrations forward; invalid registrations would follow no path here (no else branch configured)  
    - Edge cases: No explicit handling of invalid entries (e.g., missing fallback or rejection)  
    - Version: n8n v2+ (if node version 2 used)  

  - **Process Registration**  
    - Type: Code (JavaScript)  
    - Role:  
      - Generates unique registration ID (`REG_timestamp_randomstring`)  
      - Calculates reminder dates (7 days, 1 day, 2 hours before event)  
      - Prepares calendar event data (summary, start/end, location, description)  
      - Creates access credentials for online events (e.g., Zoom meeting ID and access code)  
      - Sets registration status to "confirmed" and timestamp  
    - Key expressions:  
      - Uses `$json` for input registration data  
      - Reads event settings from `Event Settings` node  
      - Generates ISO date strings for reminders and calendar data  
    - Inputs: Validated registration data  
    - Outputs: Enriched registration object for confirmation and tracking  
    - Edge cases: Assumes event location string contains "zoom" for meeting ID inclusion; no fallback if event location missing or non-URL  
    - Version: n8n v1+ compatible  

---

#### 2.4 Confirmation & Tracking

- **Overview:**  
Sends a styled confirmation email to the registrant and records registration details in a Google Sheet.

- **Nodes Involved:**  
  - Send Confirmation Email  
  - Track Registration

- **Node Details:**

  - **Send Confirmation Email**  
    - Type: Gmail  
    - Role:  
      - Sends a rich HTML email confirming registration  
      - Includes event details, calendar invite link, access credentials if applicable, and next steps  
    - Configuration:  
      - Sends to registrant email (`{{$json.email}}`)  
      - Subject includes event title  
      - HTML content uses embedded expressions for personalized content  
    - Inputs: Processed registration data  
    - Outputs: Triggers next reminder scheduling  
    - Credentials: Requires Gmail OAuth2 or app password credentials configured in n8n  
    - Edge cases: Email sending failures possible due to auth issues, invalid email formats, or Gmail API limits  
    - Version: n8n v1+ compatible  

  - **Track Registration**  
    - Type: Google Sheets  
    - Role: Appends registration info as a new row into "Event Registrations" sheet  
    - Configuration:  
      - Document ID: placeholder `"your-google-sheet-id"` (must be replaced)  
      - Sheet name: `"Event Registrations"`  
      - Columns: `registrationId`, `name`, `email`, `company` (optional), event title, registration timestamp, status  
    - Inputs: Processed registration data  
    - Credentials: Requires Google Sheets OAuth2 credentials  
    - Edge cases: Sheet ID must be correct; API quota exceeded or invalid credentials cause failure  
    - Version: n8n v1+ compatible  

---

#### 2.5 Scheduled Email Reminders

- **Overview:**  
Sends a sequence of reminder emails at predefined intervals before the event: 7 days, 1 day, and 2 hours prior.

- **Nodes Involved:**  
  - Wait Until Week Before  
  - Send Week Reminder  
  - Wait Until Day Before  
  - Send Day Before Reminder  
  - Wait Until 2h Before  
  - Send Final Reminder  
  - Sticky Note1 (Documentation)

- **Node Details:**

  - **Wait Until Week Before**  
    - Type: Wait  
    - Role: Pauses execution until 7 days before the event based on computed reminder date  
    - Configuration: Resumes based on `{{$json.reminderDates.weekBefore}}`  
    - Inputs: After confirmation email  
    - Outputs: Triggers week reminder email  
    - Edge cases: If current time is past reminder time, resumes immediately  
    - Version: n8n v1+ compatible  

  - **Send Week Reminder**  
    - Type: Gmail  
    - Role: Sends a styled HTML reminder email 7 days prior with event agenda and preparation tips  
    - Configuration: Sends to registrant email with dynamic content and access details  
    - Inputs: Wait Until Week Before output  
    - Outputs: Triggers next wait (day before)  
    - Edge cases: Same email sending risks as confirmation email  
    - Version: n8n v1+ compatible  

  - **Wait Until Day Before**  
    - Type: Wait  
    - Role: Waits until 1 day before event, calculated via `{{$json.reminderDates.dayBefore}}`  
    - Inputs: After week reminder  
    - Outputs: Triggers day-before reminder email  
    - Edge cases: Same as other wait nodes  
    - Version: n8n v1+ compatible  

  - **Send Day Before Reminder**  
    - Type: Gmail  
    - Role: Sends an urgent reminder email the day before the event highlighting checklist and quick access info  
    - Inputs: Wait Until Day Before output  
    - Outputs: Triggers next wait (2 hours before)  
    - Edge cases: Same email sending risks  
    - Version: n8n v1+ compatible  

  - **Wait Until 2h Before**  
    - Type: Wait  
    - Role: Waits until 2 hours before event start using `{{$json.reminderDates.twoHoursBefore}}`  
    - Inputs: After day before reminder  
    - Outputs: Triggers final reminder email  
    - Edge cases: Same as other wait nodes  
    - Version: n8n v1+ compatible  

  - **Send Final Reminder**  
    - Type: Gmail  
    - Role: Sends last reminder with direct join link and access code at 2 hours before event  
    - Inputs: Wait Until 2h Before output  
    - Outputs: None (end of reminder sequence)  
    - Edge cases: Same email risks  
    - Version: n8n v1+ compatible  

  - **Sticky Note1**  
    - Type: Sticky Note  
    - Role: Documentation placeholder for potential post-event follow-ups (thank you emails, surveys, etc.)  
    - No runtime effect  

---

### 3. Summary Table

| Node Name                 | Node Type        | Functional Role                              | Input Node(s)              | Output Node(s)                    | Sticky Note                                                                                                                        |
|---------------------------|------------------|----------------------------------------------|----------------------------|---------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| Event Registration Webhook | Webhook          | Captures incoming registration data          | -                          | Event Settings                   |                                                                                                                                   |
| Sticky Note               | Sticky Note      | Documentation of event management config     | -                          | -                               | ## Event Management Config ⚙️ **Customize event settings:** - Event details and schedules - Email templates by event type - Reminder timings - Capacity limits |
| Event Settings            | Set              | Defines static event parameters               | Event Registration Webhook | Validate Registration            |                                                                                                                                   |
| Validate Registration     | If               | Validates essential registration fields      | Event Settings             | Process Registration             |                                                                                                                                   |
| Process Registration      | Code             | Enriches registration data with IDs, reminders, calendar event, access credentials | Validate Registration      | Send Confirmation Email, Track Registration |                                                                                                                                   |
| Send Confirmation Email   | Gmail            | Sends confirmation email to registrant       | Process Registration       | Wait Until Week Before           |                                                                                                                                   |
| Track Registration        | Google Sheets    | Logs registration details to Google Sheet    | Process Registration       | -                               |                                                                                                                                   |
| Wait Until Week Before    | Wait             | Waits until 7 days before event                | Send Confirmation Email    | Send Week Reminder               |                                                                                                                                   |
| Send Week Reminder        | Gmail            | Sends reminder email 7 days prior             | Wait Until Week Before     | Wait Until Day Before            |                                                                                                                                   |
| Wait Until Day Before     | Wait             | Waits until 1 day before event                  | Send Week Reminder         | Send Day Before Reminder         |                                                                                                                                   |
| Send Day Before Reminder  | Gmail            | Sends reminder email 1 day prior               | Wait Until Day Before      | Wait Until 2h Before             |                                                                                                                                   |
| Wait Until 2h Before      | Wait             | Waits until 2 hours before event                | Send Day Before Reminder   | Send Final Reminder              |                                                                                                                                   |
| Send Final Reminder       | Gmail            | Sends final reminder 2 hours before event      | Wait Until 2h Before       | -                               |                                                                                                                                   |
| Sticky Note1              | Sticky Note      | Documentation for post-event follow-up actions| -                          | -                               | ## Post-Event Follow-up 📊 **After event completion:** - Thank you email - Feedback survey - Resource sharing - Next event invitations |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Name: `Event Registration Webhook`  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `event-registration`  
   - Purpose: Receives registration submissions  

2. **Add Sticky Note (optional)**  
   - Content: Event management configuration notes  

3. **Create Set Node: `Event Settings`**  
   - Set fields:  
     - `maxCapacity` (Number): 100  
     - `eventDate` (String): "2025-07-25T14:00:00Z"  
     - `eventEndDate` (String): "2025-07-25T16:00:00Z"  
   - Connect input: From `Event Registration Webhook`  

4. **Create If Node: `Validate Registration`**  
   - Conditions:  
     - `$json.email` is not empty  
     - `$json.name` is not empty  
     - `$json.email` contains "@"  
   - Connect input: From `Event Settings`  

5. **Create Code Node: `Process Registration`**  
   - JavaScript code:  
     - Generate unique registration ID  
     - Calculate reminder dates (weekBefore, dayBefore, twoHoursBefore)  
     - Build calendar event object  
     - Create access credentials (Zoom meeting ID if applicable, access code)  
     - Add registration date/time and status "confirmed"  
   - Connect input: From `Validate Registration` (true branch)  

6. **Create Gmail Node: `Send Confirmation Email`**  
   - Recipient: `{{$json.email}}`  
   - Subject: "✅ Confirmation d'inscription - {{$json.eventDetails.eventTitle}}"  
   - Message type: HTML  
   - HTML content: Use provided styled email template with event and access details  
   - Connect input: From `Process Registration`  

7. **Create Google Sheets Node: `Track Registration`**  
   - Operation: Append Row  
   - Document ID: Replace `"your-google-sheet-id"` with actual ID  
   - Sheet Name: "Event Registrations"  
   - Values to append:  
     - `{{$json.registrationId}}`  
     - `{{$json.name}}`  
     - `{{$json.email}}`  
     - `{{$json.company}}` (optional)  
     - `{{$json.eventDetails.eventTitle}}`  
     - `{{$json.registeredAt}}`  
     - `{{$json.status}}`  
   - Connect input: From `Process Registration`  

8. **Create Wait Node: `Wait Until Week Before`**  
   - Unit: days  
   - Amount: 7  
   - Resume date: `{{$json.reminderDates.weekBefore}}`  
   - Connect input: From `Send Confirmation Email`  

9. **Create Gmail Node: `Send Week Reminder`**  
   - Recipient: `{{$json.email}}`  
   - Subject: "📅 Rappel - {{$json.eventDetails.eventTitle}} dans 7 jours"  
   - Message type: HTML  
   - Use the provided styled week reminder email content  
   - Connect input: From `Wait Until Week Before`  

10. **Create Wait Node: `Wait Until Day Before`**  
    - Unit: days  
    - Amount: 6  
    - Resume date: `{{$json.reminderDates.dayBefore}}`  
    - Connect input: From `Send Week Reminder`  

11. **Create Gmail Node: `Send Day Before Reminder`**  
    - Recipient: `{{$json.email}}`  
    - Subject: "🚨 Demain - {{$json.eventDetails.eventTitle}} - Dernières infos"  
    - Message type: HTML  
    - Use the provided styled day-before reminder email content  
    - Connect input: From `Wait Until Day Before`  

12. **Create Wait Node: `Wait Until 2h Before`**  
    - Unit: hours  
    - Amount: 22 (note: this is likely a misconfigured wait time; best practice is to use the exact date from `{{$json.reminderDates.twoHoursBefore}}`)  
    - Resume date: `{{$json.reminderDates.twoHoursBefore}}`  
    - Connect input: From `Send Day Before Reminder`  

13. **Create Gmail Node: `Send Final Reminder`**  
    - Recipient: `{{$json.email}}`  
    - Subject: "🏁 MAINTENANT - {{$json.eventDetails.eventTitle}} commence dans 2h"  
    - Message type: HTML  
    - Use the provided styled final reminder email content with direct join link  
    - Connect input: From `Wait Until 2h Before`  

14. **Add Sticky Note (optional)**  
    - Content: Post-event follow-up suggestions  

15. **Configure Credentials:**  
    - Gmail nodes: Setup OAuth2 Gmail credentials or app passwords  
    - Google Sheets node: Setup Google Sheets OAuth2 credentials with access to target spreadsheet  

16. **Test the Workflow:**  
    - Send a POST request to `/event-registration` with sample data including `name`, `email`, and optional `company`  
    - Verify email receipt and Google Sheet entry  
    - Confirm reminder emails are scheduled and sent at correct times  

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                                                                 |
|-----------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| The event date and times are hardcoded; update `Event Settings` node values for new events.                | Configuration instruction                                                                       |
| Google Sheet document ID must be replaced with your actual sheet ID to enable tracking.                    | Google Sheets integration                                                                       |
| Gmail nodes require proper OAuth2 credentials with permission to send emails on behalf of the user.       | n8n credentials setup documentation: https://docs.n8n.io/credentials/gmail/                     |
| Reminder wait times use `resume` dates calculated dynamically to handle late registrations gracefully.   | n8n Wait node documentation: https://docs.n8n.io/nodes/n8n-nodes-base.wait/                     |
| Post-event follow-up is documented as a sticky note for future expansion but not implemented in this flow. | Suggestion for adding nodes for survey, thank you emails, resource sharing, etc.                |
| Email templates are rich HTML with inline CSS for better appearance across clients.                        | Customizable templates require HTML/CSS knowledge for modification                              |

---

This structured reference provides a detailed understanding of the event registration and reminder automation workflow, enabling reproduction, customization, and troubleshooting for both users and AI automation agents.