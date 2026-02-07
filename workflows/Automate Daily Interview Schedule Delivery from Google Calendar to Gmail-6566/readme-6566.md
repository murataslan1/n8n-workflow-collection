Automate Daily Interview Schedule Delivery from Google Calendar to Gmail

https://n8nworkflows.xyz/workflows/automate-daily-interview-schedule-delivery-from-google-calendar-to-gmail-6566


# Automate Daily Interview Schedule Delivery from Google Calendar to Gmail

### 1. Workflow Overview

This workflow automates the daily delivery of interview schedules from a Google Calendar to individual interviewers via Gmail. It is designed to run every day at 8:00 AM, fetch all interview events scheduled for the day from a specified Google Calendar, group these events by interviewer email (determined by the event organizer or creator), and send a personalized email to each interviewer. The email contains an HTML-formatted table listing the interview details such as title, timing, description, meeting links, and attendee statuses.

The workflow is logically divided into these blocks:

- **1.1 Scheduled Trigger**: Initiates the workflow daily at a fixed time.
- **1.2 Fetch Interview Events**: Retrieves all relevant events from Google Calendar.
- **1.3 Process & Format Events**: Groups events by interviewer and formats them into personalized HTML emails.
- **1.4 Email Delivery**: Sends the generated emails to each interviewer’s email address.
- **1.5 Documentation Notes**: Contains sticky notes describing the workflow and its purpose.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger

- **Overview:**  
  This block triggers the entire workflow once daily at 8:00 AM.

- **Nodes Involved:**  
  - Schedule Trigger

- **Node Details:**  
  - **Schedule Trigger**  
    - Type: Schedule Trigger (n8n-nodes-base.scheduleTrigger)  
    - Configuration: Set to trigger daily at 8:00 AM (server time).  
    - Inputs: None (trigger node).  
    - Outputs: Starts the workflow by passing control to the next node.  
    - Edge Cases: Timezone differences could cause unexpected trigger time if server timezone differs from expected; no fallback if the node fails to trigger.  
    - Version: 1.2

#### 1.2 Fetch Interview Events

- **Overview:**  
  Retrieves all interview events from the configured Google Calendar to be processed.

- **Nodes Involved:**  
  - Google Calendar(Fetch Interview Events)

- **Node Details:**  
  - **Google Calendar(Fetch Interview Events)**  
    - Type: Google Calendar (n8n-nodes-base.googleCalendar)  
    - Configuration:  
      - Operation: Get all events from the specified calendar (email: pythontech3.wli@gmail.com).  
      - Return all events without limit.  
      - Mode: List mode for calendar selection.  
    - Inputs: Receives trigger from Schedule Trigger.  
    - Outputs: Emits an array of event objects for downstream processing.  
    - Credentials: Uses OAuth2 credential to access Google Calendar API.  
    - Edge Cases:  
      - API authorization issues (expired or revoked token).  
      - Large number of events could cause performance delays.  
      - If no events exist, downstream processing must handle empty input gracefully.  
    - Version: 1.3

#### 1.3 Process & Format Events

- **Overview:**  
  This block groups the fetched events by interviewer email (from organizer or creator), then formats each group into an HTML table summarizing the day's interviews for that interviewer.

- **Nodes Involved:**  
  - HTML Table

- **Node Details:**  
  - **HTML Table**  
    - Type: Code Node (n8n-nodes-base.code)  
    - Configuration:  
      - JavaScript code groups events by interviewer email.  
      - For each interviewer, builds an HTML table including columns for Title, Start Time, End Time, Description, Meeting Link, and Attendees with response status.  
      - Uses India Standard Time (Asia/Kolkata) for date formatting.  
      - Outputs an array of JSON objects, each containing the recipient email, email subject, and HTML content.  
    - Inputs: Receives event array from Google Calendar node.  
    - Outputs: Emits multiple items, each representing an individualized email to one interviewer.  
    - Edge Cases:  
      - Events missing organizer or creator email are skipped.  
      - Null or missing fields are substituted with default placeholders.  
      - Timezone formatting depends on server locale; could be inconsistent if server timezone changes.  
      - If no attendees or meeting links exist, placeholders are used.  
    - Version: 2

#### 1.4 Email Delivery

- **Overview:**  
  Sends personalized emails containing the interview schedule to each interviewer using Gmail.

- **Nodes Involved:**  
  - Gmail

- **Node Details:**  
  - **Gmail**  
    - Type: Gmail node (n8n-nodes-base.gmail)  
    - Configuration:  
      - Sends email to recipient specified by `interviewer_email` from previous node.  
      - Email subject is statically set to "Interview Reminder".  
      - Email body contains HTML content passed from the previous node.  
      - No attachments or additional options set.  
    - Inputs: Receives email content and recipient address from the HTML Table node.  
    - Outputs: Emits success or failure status per email sent.  
    - Credentials: Uses OAuth2 credentials for Gmail access.  
    - Edge Cases:  
      - Authentication errors if credentials expire or revoked.  
      - Gmail API rate limits or sending quota exceeded.  
      - Invalid recipient email addresses might cause sending failure.  
    - Version: 2.1

#### 1.5 Documentation Notes

- **Overview:**  
  Provides descriptive sticky notes within the workflow for human readers and maintainers.

- **Nodes Involved:**  
  - About this template (sticky note)  
  - Sticky Note (sticky note)

- **Node Details:**  
  - **About this template**  
    - Type: Sticky Note (n8n-nodes-base.stickyNote)  
    - Content: A detailed description of what the workflow does, including trigger time, data sources, and email personalization.  
  - **Sticky Note**  
    - Type: Sticky Note  
    - Content: Brief title/summary of the workflow purpose.  
  - Both have no inputs or outputs and serve documentation purposes only.

---

### 3. Summary Table

| Node Name                        | Node Type           | Functional Role                                   | Input Node(s)                   | Output Node(s)                  | Sticky Note                                                                                      |
|---------------------------------|---------------------|-------------------------------------------------|--------------------------------|--------------------------------|------------------------------------------------------------------------------------------------|
| Schedule Trigger                 | Schedule Trigger    | Triggers workflow daily at 8:00 AM               | -                              | Google Calendar(Fetch Interview Events) |                                                                                                |
| Google Calendar(Fetch Interview Events) | Google Calendar     | Fetches all interview events from calendar       | Schedule Trigger               | HTML Table                     |                                                                                                |
| HTML Table                      | Code                | Groups events by interviewer and formats HTML email | Google Calendar(Fetch Interview Events) | Gmail                         |                                                                                                |
| Gmail                          | Gmail               | Sends personalized interview schedule emails      | HTML Table                    | -                              |                                                                                                |
| About this template             | Sticky Note         | Workflow description and purpose                   | -                              | -                              | ## Description\nThis workflow automatically sends daily interview schedules to each interviewer via email. It is triggered every day at 8:00 AM, fetches all interview events from a specified Google Calendar, and groups them by interviewer email (based on the event organizer or creator). Each interviewer then receives a personalized HTML-formatted email listing their interview schedule for the day, including event titles, start and end times. |
| Sticky Note                    | Sticky Note         | Brief workflow summary                             | -                              | -                              | ## Send today’s interview schedule from Google Calendar to each interviewer via email          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Configure to trigger once daily at 8:00 AM (local time or server time).  
   - No inputs. Outputs to Google Calendar node.

2. **Create Google Calendar Node**  
   - Type: Google Calendar  
   - Operation: Get all events  
   - Calendar: Select or enter the calendar email (e.g., pythontech3.wli@gmail.com).  
   - Return all events (no limit).  
   - Connect input from Schedule Trigger node.  
   - Set up OAuth2 credentials for Google Calendar API access.

3. **Create Code Node "HTML Table"**  
   - Type: Code  
   - Paste the provided JavaScript code which:  
     - Groups events by organizer or creator email.  
     - Constructs an HTML table for each interviewer with event details.  
   - Input: Connect from Google Calendar node.  
   - Output: Emits multiple items, one per interviewer.  
   - Ensure timezone in code is set to 'Asia/Kolkata' or adjust as needed.

4. **Create Gmail Node**  
   - Type: Gmail  
   - Set "Send To" field as expression: `{{$json.interviewer_email}}` to dynamically use email from code node output.  
   - Subject: Can be "Interview Reminder" or derived from JSON.  
   - Message: Use expression to insert HTML content: `{{$json.htmlContent}}`.  
   - Connect input from "HTML Table" code node.  
   - Configure Gmail OAuth2 credentials for sending email.

5. **Add Sticky Notes for Documentation** (Optional but recommended)  
   - Create two sticky notes:  
     - One with the workflow description to aid future maintainers.  
     - Another with a brief summary.  
   - Place visually near the start or center of your canvas.

6. **Save and Activate Workflow**  
   - Validate all credentials are working.  
   - Test with sample events to ensure emails are correctly generated and sent.  
   - Activate workflow for daily operation.

---

### 5. General Notes & Resources

| Note Content                                                                                                                        | Context or Link                                   |
|------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------|
| The workflow sends personalized interview schedules via email daily at 8:00 AM based on Google Calendar events grouped by interviewer email. | Workflow purpose summary (sticky note content)   |
| Timezone is set to 'Asia/Kolkata' in the code node; adjust as needed to fit your local timezone.                                   | Important for date/time display in emails         |
| Gmail and Google Calendar OAuth2 credentials must be properly configured and authorized prior to workflow activation.             | Credential setup requirement                       |
| JavaScript code handles missing data gracefully by substituting default placeholders for missing titles, descriptions, or links.  | Code robustness note                               |
| Ensure Gmail sending quotas and Google API usage limits are monitored to avoid interruptions in email delivery.                   | Operational consideration                          |

---

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.