Automate Event Scheduling from Emails with Gmail & Google Calendar Keywords

https://n8nworkflows.xyz/workflows/automate-event-scheduling-from-emails-with-gmail---google-calendar-keywords-7218


# Automate Event Scheduling from Emails with Gmail & Google Calendar Keywords

### 1. Workflow Overview

This workflow automates the process of scheduling events on Google Calendar by monitoring incoming emails in a Gmail inbox. It targets users who frequently receive event invitations or meeting requests via email and want to eliminate manual calendar entry.

The automation consists of four logical blocks:

- **1.1 Input Reception:** Watches for new emails arriving in the Gmail inbox.
- **1.2 Keyword Filtering:** Filters emails by checking if the subject or body contains specific keywords indicating an event.
- **1.3 Event Detail Extraction:** Uses a code node to parse the email body and extract event details such as date, time, and title.
- **1.4 Event Creation:** Creates a corresponding event on Google Calendar using extracted details.

Supporting these blocks are two sticky notes that provide project context and instructions.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  Monitors the Gmail inbox continuously for any new emails, triggering the workflow each time an email arrives.

- **Nodes Involved:**  
  - Watch for New Emails

- **Node Details:**  
  - **Watch for New Emails**  
    - *Type:* Gmail Trigger  
    - *Role:* Initiates the workflow on new Gmail messages.  
    - *Configuration:* Polls the Gmail inbox every minute for new emails. No specific filters are set, so all inbox emails trigger the workflow.  
    - *Expressions/Variables:* Outputs the full email JSON, including subject and body.  
    - *Input Connections:* None (trigger node).  
    - *Output Connections:* Connected to "Check for Keywords" node.  
    - *Version:* 1.2  
    - *Potential Failures:* OAuth authentication errors if credentials expire or are misconfigured; API rate limits; network timeouts.  
    - *Credentials:* Uses OAuth2 credentials for Gmail with the name "temp".  

#### 2.2 Keyword Filtering

- **Overview:**  
  Filters incoming emails to process only those likely to be event-related by checking for keywords "Meeting" in the subject or "Appointment" in the body.

- **Nodes Involved:**  
  - Check for Keywords

- **Node Details:**  
  - **Check for Keywords**  
    - *Type:* If node  
    - *Role:* Conditional branching to continue workflow only if email contains relevant keywords.  
    - *Configuration:*  
      - Logical OR condition.  
      - Checks if the email subject contains the string "Meeting" (case sensitive, strict type).  
      - Checks if the email body exactly equals the string "Appointment" (case sensitive, strict type).  
    - *Expressions:*  
      - Uses expressions like `{{$json.subject}}` and `{{$json.body}}` to access email content.  
    - *Input Connections:* From "Watch for New Emails".  
    - *Output Connections:* True branch connected to "Extract Event Details". False branch is unconnected (terminates workflow).  
    - *Version:* 2.2  
    - *Potential Failures:* Expression evaluation errors if email JSON is malformed; keyword matching may miss variations (e.g., lowercase or partial matches).  
    - *Note:* The keyword check for "Appointment" uses an equality check on the entire body, which may cause false negatives if the body contains more text.

#### 2.3 Event Detail Extraction

- **Overview:**  
  Parses the email body text to extract tentative event details such as title, date, and time using simple regex patterns.

- **Nodes Involved:**  
  - Extract Event Details

- **Node Details:**  
  - **Extract Event Details**  
    - *Type:* Code (JavaScript) node  
    - *Role:* Extracts event metadata for calendar event creation.  
    - *Configuration:*  
      - Uses regex to find a month and day pattern (e.g., "Jan 15") for the date.  
      - Uses regex to find time pattern (e.g., "9:00am" or "14:30").  
      - Defaults to "today" for date and "9:00am" for time if no match is found.  
      - Sets event title from the email subject.  
    - *Expressions/Variables:*  
      - Accesses `$json.body` and `$json.subject`.  
      - Returns an object with keys: `title`, `date`, and `time`.  
    - *Input Connections:* From "Check for Keywords" (true branch).  
    - *Output Connections:* To "Create Event".  
    - *Version:* 2  
    - *Potential Failures:* Regex may fail or produce incorrect matches for non-standard date/time formats; emails without clear date/time info fall back to default values which may cause inaccurate events.  

#### 2.4 Event Creation

- **Overview:**  
  Creates a new event on a specified Google Calendar using the extracted date, time, and title details.

- **Nodes Involved:**  
  - Create Event

- **Node Details:**  
  - **Create Event**  
    - *Type:* Google Calendar node  
    - *Role:* Inserts a new calendar event.  
    - *Configuration:*  
      - Both start and end times are set to the same combined date and time string (`{{ $json.date }} {{ $json.time }}`).  
      - Calendar ID must be set to the target Google Calendar.  
      - Event summary is set to the extracted title.  
    - *Expressions:* Uses expressions to dynamically assign start, end, and summary fields.  
    - *Input Connections:* From "Extract Event Details".  
    - *Output Connections:* None (end of workflow).  
    - *Version:* 1.3  
    - *Potential Failures:* Credential errors with Google OAuth2; invalid or missing calendar ID; malformed date/time strings causing API rejection; API quota or rate limits.  
    - *Credentials:* Uses Google Calendar OAuth2 credentials named "temp".  

#### 2.5 Sticky Notes

- **Overview:**  
  Provide documentation and workflow overview inside the canvas for user reference.

- **Nodes Involved:**  
  - Sticky Note  
  - Sticky Note1

- **Node Details:**  
  - **Sticky Note**  
    - *Type:* Sticky Note  
    - *Role:* Title or section header labeled "## Flow".  
    - *Position:* Top-left of canvas.  
  - **Sticky Note1**  
    - *Type:* Sticky Note  
    - *Role:* Contains a detailed workflow note explaining the problem, solution, target users, scope, and setup instructions.  
    - *Key content includes:*  
      - Problem statement: manual calendar event creation is tedious.  
      - Solution: automated event creation via keywords and code extraction.  
      - Intended audience: busy professionals, project managers.  
      - Setup steps and scope details.  
    - *Position:* Near the bottom-left of the canvas.  
    - *Color:* Blue shade (color code 3).  
    - *Size:* Large to accommodate detailed text.  

---

### 3. Summary Table

| Node Name           | Node Type               | Functional Role                      | Input Node(s)           | Output Node(s)         | Sticky Note                                                                                                                    |
|---------------------|-------------------------|------------------------------------|------------------------|-----------------------|-------------------------------------------------------------------------------------------------------------------------------|
| Watch for New Emails | Gmail Trigger           | Watches for new incoming emails    | —                      | Check for Keywords     | Part of the overall flow automating event scheduling.                                                                          |
| Check for Keywords   | If                      | Filters emails by keywords          | Watch for New Emails    | Extract Event Details  | Keywords checked: "Meeting" in subject, "Appointment" equals body. May miss partial matches.                                   |
| Extract Event Details| Code                    | Parses email body to extract event data | Check for Keywords      | Create Event           | Uses regex to find date/time; defaults if not found. May not handle complex date/time formats.                                  |
| Create Event        | Google Calendar          | Creates event on Google Calendar   | Extract Event Details   | —                     | Requires Google Calendar ID; sets start/end time same; potential failures if date/time invalid or auth issues occur.           |
| Sticky Note         | Sticky Note              | Visual documentation header        | —                      | —                     | Contains "## Flow" header.                                                                                                     |
| Sticky Note1        | Sticky Note              | Detailed workflow notes and setup  | —                      | —                     | Large note explaining problem, solution, audience, scope, and setup instructions.                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger Node ("Watch for New Emails")**  
   - Node Type: Gmail Trigger  
   - Configure:  
     - Set to watch the inbox folder.  
     - Poll interval: every minute.  
   - Add Gmail OAuth2 credentials with appropriate access scopes (read email).  
   - Position at the left side of the canvas.

2. **Create If Node ("Check for Keywords")**  
   - Node Type: If  
   - Configure Conditions:  
     - Set combinator to OR.  
     - Condition 1: Check if email subject contains the string "Meeting" (case sensitive).  
     - Condition 2: Check if email body equals the string "Appointment" (case sensitive).  
   - Connect "Watch for New Emails" output to this node input.

3. **Create Code Node ("Extract Event Details")**  
   - Node Type: Code (JavaScript)  
   - Paste the following code in the editor:

   ```javascript
   const emailBody = $json.body;

   // Simple regex to find a date and time.
   // This is a basic example; more complex logic may be needed.
   const dateMatch = emailBody.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}/i);
   const timeMatch = emailBody.match(/\d{1,2}:\d{2}\s?(am|pm)?/i);

   const eventDetails = {
       title: $json.subject,
       date: dateMatch ? dateMatch[0] : 'today',
       time: timeMatch ? timeMatch[0] : '9:00am'
   };

   return [{ json: eventDetails }];
   ```

   - Connect the True output of "Check for Keywords" to this node input.

4. **Create Google Calendar Node ("Create Event")**  
   - Node Type: Google Calendar  
   - Configure:  
     - Enter your Google Calendar ID in the Calendar field.  
     - For Start and End times, use expressions: `{{$json.date}} {{$json.time}}` for both.  
     - Under Additional Fields, set Summary to `{{$json.title}}`.  
   - Add Google Calendar OAuth2 credentials with event creation permission.  
   - Connect "Extract Event Details" output to this node input.

5. **Create Sticky Notes for Documentation**  
   - Create one sticky note with the content "## Flow" positioned near the top left.  
   - Create a second large sticky note with detailed workflow notes including problem, solution, audience, scope, and setup instructions positioned below the first. Use color code 3 (blue shade).

6. **Final Steps**  
   - Save the workflow.  
   - Activate the workflow to start monitoring emails and creating calendar events automatically.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                        | Context or Link                                                                                           |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| Manual calendar event creation is tedious; this workflow automates scheduling by parsing emails with keywords and regex extraction. It is designed for busy professionals and project managers seeking simple automation without complex NLP.                                                                                                                                           | Workflow note inside Sticky Note1 node on canvas                                                         |
| The regex used for date/time extraction is a simple example and may require enhancements for handling diverse email formats or international date/time expressions.                                                                                                                                                                                                                 | Code node "Extract Event Details"                                                                        |
| Google Calendar Node requires correct Calendar ID; ensure correct OAuth2 scopes and credentials are configured with event creation permissions.                                                                                                                                                                                                                                   | Google Calendar API documentation                                                                        |
| Gmail Trigger node requires OAuth2 with Gmail API scopes for reading emails; ensure token validity to avoid authentication errors.                                                                                                                                                                                                                                                 | Gmail API OAuth2 setup guidelines                                                                         |
| For more advanced event extraction, consider integrating NLP tools or third-party services to parse complex natural language date/time references.                                                                                                                                                                                                                                | External enhancement suggestion                                                                           |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and publicly accessible.