Automate Medical Appointments with ElevenLabs Voice Agent & Google Calendar

https://n8nworkflows.xyz/workflows/automate-medical-appointments-with-elevenlabs-voice-agent---google-calendar-9366


# Automate Medical Appointments with ElevenLabs Voice Agent & Google Calendar

### 1. Workflow Overview

This workflow automates medical appointment scheduling via voice interactions powered by ElevenLabs and Google Calendar integration. It serves two main purposes:  
- **Availability check:** Determine if a requested date/time slot is free for booking.  
- **Appointment booking:** Create a calendar event and send confirmation email when patient details are provided.  

The workflow is structured into these logical blocks:  
- **1.1 Input Reception:** Webhook node receives incoming HTTP POST requests carrying patient and appointment data from ElevenLabs voice agent.  
- **1.2 Data Preparation:** Extracts and formats input fields, combining date and time into a single datetime string for easier processing.  
- **1.3 Routing Logic:** An IF node routes requests based on presence of patient details (name, email). If missing, triggers availability check path; otherwise, booking path.  
- **1.4 Availability Check:** Queries Google Calendar for existing events during requested slot, evaluates if slot is free, and if not, proposes alternative available slots.  
- **1.5 Booking Path:** Creates a Google Calendar event for the appointment, sends a detailed confirmation email via Gmail, and responds to the webhook with confirmation text.  
- **1.6 Response Handling:** Responds appropriately to webhook requests to confirm availability status or booking confirmation.  

Supporting nodes provide utility functions such as sorting available time slots, aggregating results, and formatting messages. Sticky notes throughout the workflow explain configuration, usage, and troubleshooting.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
Receives incoming webhook POST requests from ElevenLabs voice agent with appointment inquiry or booking data.

- **Nodes Involved:**  
  - `Webhook1` (Webhook)  
  - `Sticky Note - Webhook` (Documentation node)  

- **Node Details:**  

| Node Name | Details |
|---|---|
| Webhook1 |  
- Type: Webhook (HTTP endpoint)  
- Configuration: POST method, custom unique path for security (needs user to set a unique webhook path)  
- Inputs: HTTP request body with parameters: fullName, email, phone, date (YYYY-MM-DD), time (HH:MM), appointmentType, location  
- Query parameter: `request` can be "check availability" or blank  
- Outputs: Emits data as JSON object for downstream nodes  
- Edge cases: Incorrect/missing parameters; webhook URL misconfiguration; unauthorized requests if webhook path is guessed  
- Version: n8n 2.1+ recommended for webhook improvements  
|  
| Sticky Note - Webhook |  
- Type: Sticky Note (documentation)  
- Content details expected parameters and security advice for webhook path |  

---

#### 2.2 Data Preparation

- **Overview:**  
Sets variables by extracting and formatting input data, notably combining date and time into a single datetime string (format: `YYYY-MM-DD HH:mm`) for uniform downstream use.

- **Nodes Involved:**  
  - `Set Up Variables` (Set)  
  - `Sticky Note - Edit Fields` (Documentation)  

- **Node Details:**  

| Node Name | Details |
|---|---|
| Set Up Variables |  
- Type: Set node to assign variables  
- Configuration: Assigns fields `fullName`, `email`, `phone`, `location`, `appointmentType` from webhook body; combines `date` + `time` into single string `date` (e.g., "2025-10-08 15:00")  
- Expressions: Uses expressions like `={{ $json.body.fullName }}` to extract from webhook payload  
- Inputs: Directly from `Webhook1` output  
- Outputs: Structured variables for routing and calendar nodes  
- Edge cases: Missing fields; malformed date or time strings may break formatting downstream  
- Version: v3+ recommended for Set node features  
|  
| Sticky Note - Edit Fields |  
- Type: Sticky Note  
- Explains the data formatting logic and output datetime format |  

---

#### 2.3 Routing Logic

- **Overview:**  
Determines whether the request is an availability check or a booking request based on presence of patient name/email fields.

- **Nodes Involved:**  
  - `If` (IF)  
  - `Sticky Note - Routing` (Documentation)  

- **Node Details:**  

| Node Name | Details |
|---|---|
| If |  
- Type: IF node  
- Configuration: Checks if `fullName` or `email` fields do NOT exist or are empty — if true, route to availability check path; if false, proceed to booking path  
- Input: From `Set Up Variables`  
- Outputs:  
  - True branch: Availability check nodes  
  - False branch: Booking nodes  
- Edge cases: Partial data leading to ambiguous routing; missing fields causing false positives  
|  
| Sticky Note - Routing |  
- Describes routing criteria and logic for paths |  

---

#### 2.4 Availability Check Path

- **Overview:**  
Checks Google Calendar for existing events during requested slot; confirms if slot is free or finds alternatives.

- **Nodes Involved:**  
  - `Get availability in a calendar` (Google Calendar Get Events)  
  - `Available?1` (IF)  
  - `Check Availability Again` (Google Calendar Get Events)  
  - `Sort Available Slots` (Code)  
  - `Aggregate` (Aggregate)  
  - `Confirm Available Times` (Respond to Webhook)  
  - `Confirm The Time's Unavailable` (Respond to Webhook)  
  - `Sticky Note - Availability` (Documentation)  

- **Node Details:**  

| Node Name | Details |
|---|---|
| Get availability in a calendar |  
- Type: Google Calendar node (get events)  
- Configuration: Queries calendar for events within requested slot start and end times (30 min window)  
- Inputs: From `If` true branch  
- Outputs: Events during requested time  
- Credential: Google Calendar OAuth2 (user must configure)  
- Edge cases: Credential expiry; API quota limits; incorrect calendar selected  
|  
| Available?1 |  
- Type: IF node  
- Configuration: Checks if events returned indicate availability (`available` field true)  
- Outputs:  
  - True: Respond with "Thank you for waiting! This time is available"  
  - False: Retrieve all events for 30 days in future (`Check Availability Again`)  
|  
| Check Availability Again |  
- Type: Google Calendar node (get events)  
- Configuration: Query all booked events for next 30 days starting from requested date  
- Outputs: Passes booked events to `Sort Available Slots`  
|  
| Sort Available Slots |  
- Type: Code (JavaScript)  
- Configuration:  
  - Analyzes booked events, generates list of available 30-minute slots within business hours (7:00-17:00) over 30 days  
  - Considers timezone (+02:00 Europe/Zurich), excludes past times  
  - Returns list of available ISO8601 timeslots  
- Edge cases: Timezone mismatches; daylight saving changes; empty calendar returns all slots as available  
|  
| Aggregate |  
- Type: Aggregate node  
- Configuration: Aggregates available slots into a single response  
|  
| Confirm Available Times |  
- Type: Respond to Webhook  
- Configuration: Sends text response confirming availability  
|  
| Confirm The Time's Unavailable |  
- Type: Respond to Webhook  
- Configuration: Sends text response indicating slot unavailable, prompting alternate time  
|  
| Sticky Note - Availability |  
- Describes availability check logic and credential setup requirements |  

---

#### 2.5 Booking Path

- **Overview:**  
Creates an appointment event in Google Calendar; sends email confirmation with appointment details; responds to webhook with confirmation text.

- **Nodes Involved:**  
  - `Book Appointment` (Google Calendar Create Event)  
  - `Send a message` (Gmail Send Email)  
  - `Confirm Booking` (Respond to Webhook)  
  - `Sticky Note - Booking` (Documentation)  
  - `Sticky Note - Email` (Documentation)  

- **Node Details:**  

| Node Name | Details |
|---|---|
| Book Appointment |  
- Type: Google Calendar (create event)  
- Configuration:  
  - Creates 30-minute event starting at combined datetime variable  
  - Sets summary as "Patient Name, Appointment Type"  
  - Adds location and attendee email  
  - Disables default reminders  
- Credential: Google Calendar OAuth2  
- Edge cases: Calendar conflicts; invalid email formats; credential issues  
|  
| Send a message |  
- Type: Gmail (send email)  
- Configuration:  
  - Sends personalized confirmation email to patient email  
  - Formats date/time in user-friendly string with ordinal suffixes  
  - Includes appointment type, provider info, clinic location, preparation instructions  
- Credential: Gmail OAuth2  
- Edge cases: Invalid email; spam filtering; OAuth token expiration  
|  
| Confirm Booking |  
- Type: Respond to Webhook  
- Configuration: Sends textual confirmation including formatted appointment date/time  
|  
| Sticky Note - Booking |  
- Notes booking path creates calendar event |  
| Sticky Note - Email |  
- Notes email confirmation details and Gmail node usage |  

---

#### 2.6 Supportive Documentation and Utilities

- Contains sticky notes for quick start, troubleshooting, and other instructions to aid users setting up and maintaining the workflow.

---

### 3. Summary Table

| Node Name               | Node Type               | Functional Role            | Input Node(s)          | Output Node(s)                 | Sticky Note                                              |
|-------------------------|-------------------------|----------------------------|------------------------|-------------------------------|----------------------------------------------------------|
| Sticky Note - Webhook   | Sticky Note             | Documentation              |                        |                               | Describes webhook input parameters and security          |
| Sticky Note - Edit Fields| Sticky Note             | Documentation              |                        |                               | Explains data preparation and datetime formatting         |
| Sticky Note - Routing   | Sticky Note             | Documentation              |                        |                               | Explains routing logic based on presence of patient data  |
| Sticky Note - Availability| Sticky Note           | Documentation              |                        |                               | Explains availability check path and Google Calendar setup|
| Sticky Note - Booking   | Sticky Note             | Documentation              |                        |                               | Notes booking path creates calendar event                 |
| Sticky Note - Email     | Sticky Note             | Documentation              |                        |                               | Notes email confirmation details                           |
| Sticky Note - Quick Start| Sticky Note            | Documentation              |                        |                               | Quick start checklist for credentials and settings        |
| Sticky Note - Troubleshooting| Sticky Note         | Documentation              |                        |                               | Troubleshooting tips for common errors                     |
| Webhook1                | Webhook                 | Input reception            |                        | Set Up Variables               |                                                          |
| Set Up Variables        | Set                     | Data preparation           | Webhook1                | If                            |                                                          |
| If                      | IF                      | Routing logic              | Set Up Variables         | Get availability in a calendar, Book Appointment |                                                          |
| Get availability in a calendar| Google Calendar        | Query calendar availability | If (true branch)        | Available?1                   |                                                          |
| Available?1             | IF                      | Check if slot available    | Get availability in a calendar | Confirm Available Times, Check Availability Again |                                                          |
| Check Availability Again| Google Calendar          | Get all events next 30 days| Available?1 (false branch) | Sort Available Slots          |                                                          |
| Sort Available Slots    | Code                    | Find available timeslots  | Check Availability Again | Aggregate                     |                                                          |
| Aggregate               | Aggregate               | Aggregate available slots  | Sort Available Slots     | Confirm The Time's Unavailable|                                                          |
| Confirm Available Times | Respond to Webhook      | Respond availability OK    | Available?1 (true branch) |                              |                                                          |
| Confirm The Time's Unavailable| Respond to Webhook  | Respond availability fail  | Aggregate                |                              |                                                          |
| Book Appointment        | Google Calendar          | Create calendar event      | If (false branch)        | Send a message                |                                                          |
| Send a message          | Gmail                    | Send confirmation email   | Book Appointment         | Confirm Booking               |                                                          |
| Confirm Booking         | Respond to Webhook      | Respond booking confirmation| Send a message           |                              |                                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node:**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: Set a unique secure path (e.g., UUID string)  
   - Response Mode: Response Node  
   - Purpose: To receive appointment requests from ElevenLabs voice agent  
   - No credentials needed  
   
2. **Create Set Node ("Set Up Variables"):**  
   - Type: Set  
   - Assign variables from webhook JSON body:  
     - `fullName` = `{{$json.body.fullName}}`  
     - `email` = `{{$json.body.email}}`  
     - `phone` = `{{$json.body.phone}}`  
     - `location` = `{{$json.body.location}}`  
     - `appointmentType` = `{{$json.body.appointmentType}}`  
     - `date` = `{{$json.body.date}} {{$json.body.time}}` (combine date and time)  
   - Connect from Webhook node output  

3. **Create IF Node ("If"):**  
   - Type: IF  
   - Condition:  
     - Check if `fullName` does NOT exist OR `email` does NOT exist  
   - True branch (availability check)  
   - False branch (booking path)  
   - Connect from Set node output  

4. **Availability Check Path:**  
   a. **Google Calendar Node ("Get availability in a calendar"):**  
      - Operation: Get all events  
      - TimeMin: `={{ DateTime.fromFormat($('Set Up Variables').item.json.date, 'yyyy-MM-dd HH:mm').toISO() }}`  
      - TimeMax: `={{ DateTime.fromFormat($('Set Up Variables').item.json.date, 'yyyy-MM-dd HH:mm').plus({ minutes: 30 }).toISO() }}`  
      - Calendar: Select your booking calendar  
      - Credentials: Google Calendar OAuth2  
      - Connect from IF node True output  
      
   b. **IF Node ("Available?1"):**  
      - Condition: Check if event list empty or slot available (custom logic)  
      - True: Respond with "Thank you for waiting! This time is available"  
      - False: Continue to next steps  
   
   c. **Google Calendar Node ("Check Availability Again"):**  
      - Operation: Get all events from requested date to 30 days ahead  
      - TimeMin: `={{ $('Set Up Variables').item.json.date }}`  
      - TimeMax: `={{ DateTime.fromISO($('Webhook1').item.json.body.date).plus({ days: 30 }).toISODate() }}`  
      - Calendar: Same as above  
      - Credentials: Google Calendar OAuth2  
      - Connect from Available?1 False output  
   
   d. **Code Node ("Sort Available Slots"):**  
      - Paste JavaScript code that:  
        - Parses booked intervals  
        - Generates available 30-minute slots between 7:00 and 17:00 for 30 days  
        - Returns list of available slots  
      - Connect from "Check Availability Again" output  
   
   e. **Aggregate Node:**  
      - Aggregate available slots into list  
      - Connect from "Sort Available Slots" output  
   
   f. **Respond to Webhook Node ("Confirm The Time's Unavailable"):**  
      - Response body: "Sorry, this time slot is unavailable right now. You may have another time in your mind?"  
      - Connect from Aggregate output  
   
   g. **Respond to Webhook Node ("Confirm Available Times"):**  
      - Response body: "Thank you for waiting! This time is available"  
      - Connect from Available?1 True output  

5. **Booking Path:**  
   a. **Google Calendar Node ("Book Appointment"):**  
      - Operation: Create event  
      - Start: `={{ DateTime.fromFormat($('Set Up Variables').item.json.date, 'yyyy-MM-dd HH:mm').toISO() }}`  
      - End: Start + 30 minutes  
      - Summary: "{{fullName}}, {{appointmentType}}"  
      - Location: `{{$json.location}}`  
      - Attendees: Email addresses from `email` variable  
      - Use Default Reminders: False  
      - Credentials: Google Calendar OAuth2  
      - Connect from IF node False output  
   
   b. **Gmail Node ("Send a message"):**  
      - Operation: Send email  
      - To: Patient email  
      - Subject: Appointment type and date formatted with ordinal suffix (see example expressions)  
      - Body: HTML formatted confirmation message with appointment details and preparation instructions  
      - Credentials: Gmail OAuth2  
      - Connect from "Book Appointment" output  
   
   c. **Respond to Webhook Node ("Confirm Booking"):**  
      - Respond with confirmation message including formatted appointment date/time  
      - Connect from "Send a message" output  

6. **Configure Credentials:**  
   - Google Calendar OAuth2 with access to booking calendar  
   - Gmail OAuth2 for sending confirmation emails  

7. **Set Up Webhook Security:**  
   - Change webhook path to a unique secure string to prevent unauthorized access  

8. **Test Workflow:**  
   - Use pinned example data or send test POST requests to webhook  
   - Test both availability check and booking flows  

---

### 5. General Notes & Resources

| Note Content | Context or Link |
|--------------|-----------------|
| Quick start guide includes setup steps for credentials, calendar selection, webhook security, timezone adjustments, and clinic details customization. | See Sticky Note - Quick Start in workflow |
| Troubleshooting tips cover common issues: webhook not triggering, calendar sync errors, email sending failures, timezone problems, and slot conflicts. | See Sticky Note - Troubleshooting in workflow |
| Email templates use JavaScript expressions for date formatting with ordinal suffixes, improving user experience. | Embedded in Gmail node |
| Workflow designed for Europe/Zurich timezone (+02:00), adjust code if deploying in other timezones. | See Sort Available Slots code node |
| Workflow integrates with ElevenLabs voice agent via HTTP webhook for seamless voice-driven appointment booking. | Workflow description and Sticky Note - Webhook |

---

**Disclaimer:** This workflow was extracted and analyzed exclusively from an n8n automation JSON export. It complies fully with content policies and handles legal, public data only.