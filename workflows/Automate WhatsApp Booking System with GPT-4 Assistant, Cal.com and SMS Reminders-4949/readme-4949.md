Automate WhatsApp Booking System with GPT-4 Assistant, Cal.com and SMS Reminders

https://n8nworkflows.xyz/workflows/automate-whatsapp-booking-system-with-gpt-4-assistant--cal-com-and-sms-reminders-4949


# Automate WhatsApp Booking System with GPT-4 Assistant, Cal.com and SMS Reminders

### 1. Workflow Overview

This n8n workflow automates the booking process via WhatsApp using an AI assistant powered by GPT-4, integrates with Cal.com for appointment scheduling, and sends SMS reminders before appointments. It targets service providers who want to handle client bookings conversationally and automatically while managing follow-ups through reminders.

The workflow is logically divided into three functional blocks:

- **1.1 User Interaction and Qualification:** Receives WhatsApp inputs, interprets user intent, and guides users through service selection and personal information collection via an AI assistant.
- **1.2 Appointment Booking:** Automatically books the appointment with Cal.com using collected data, updates Google Sheets with booking details, and confirms the booking with the user.
- **1.3 SMS Reminders:** Scheduled hourly trigger that reads upcoming confirmed appointments from Google Sheets, filters those occurring within the next two hours, sends SMS reminders, and marks reminders as sent.

---

### 2. Block-by-Block Analysis

#### 2.1 User Interaction and Qualification

**Overview:**  
This block handles incoming WhatsApp messages, determines if the user is chatting or confirming a booking, runs the AI assistant to qualify the user (collecting name, email, and service), and stores prospect data.

**Nodes Involved:**  
- Webhook Trigger (WhatsApp Input)  
- Switch: Confirm vs Chat Flow  
- AI Booking Assistant (Dr Firas)  
- LLM: GPT-4o Chat Model  
- AI Conversation Memory  
- Create New Prospect in Google Sheet  
- Update Prospect with Booking Details  
- Fetch Available Time Slots  
- Send Response to WhatsApp

**Node Details:**

- **Webhook Trigger (WhatsApp Input)**  
  - Type: Webhook Trigger  
  - Role: Entry point to receive WhatsApp POST requests containing user messages and metadata.  
  - Config: HTTP POST at specific path, responds via response node.  
  - Inputs: External WhatsApp API integration.  
  - Outputs: Passes JSON with user input and contact info downstream.  
  - Potential failures: Invalid webhook calls, missing data, connectivity issues.

- **Switch: Confirm vs Chat Flow**  
  - Type: Switch node  
  - Role: Routes flow based on presence of "confirm" keyword in user input.  
  - Config: Two outputs — "Discussion" if user input does not contain "confirm", "Confirm booking" if it does.  
  - Inputs: Webhook Trigger node output.  
  - Outputs: Routes to AI assistant for chat or to prospect retrieval for confirmation.  
  - Edge cases: Case sensitivity or unexpected inputs; relies on exact string matching.

- **AI Booking Assistant (Dr Firas)**  
  - Type: Langchain Agent node (AI assistant)  
  - Role: Processes user input with GPT-4o model, follows a detailed scripted conversation flow to qualify user and suggest appointments.  
  - Config: Custom system prompt instructing assistant on services, tone, conversation flow, and constraints. It collects name, email, service selection, offers time slots, and requests confirmation.  
  - Inputs: User message text.  
  - Outputs: AI-generated replies to be sent back to WhatsApp.  
  - Uses: LLM: GPT-4o Chat Model for language generation, AI Conversation Memory for session context, Fetch Available Time Slots tool to get appointment times, and Google Sheets nodes for data storage.  
  - Edge cases: AI misunderstanding, session loss, API rate limits, incomplete user data.

- **LLM: GPT-4o Chat Model**  
  - Type: Langchain OpenAI LLM node  
  - Role: Provides GPT-4o model responses for the AI assistant.  
  - Config: Model set to "gpt-4o".  
  - Credentials: OpenAI API key.  
  - Inputs: Text prompt from AI Booking Assistant.  
  - Outputs: AI text completion.  
  - Edge cases: API limits, timeout, malformed prompts.

- **AI Conversation Memory**  
  - Type: Langchain memory buffer  
  - Role: Maintains conversation state per user to enable contextual replies.  
  - Config: Uses WhatsApp contactId as session key, window length of 50 messages.  
  - Inputs/Outputs: Connects to AI Booking Assistant.  
  - Edge cases: Memory overflow, session key mismatch.

- **Create New Prospect in Google Sheet**  
  - Type: Google Sheets Tool node  
  - Role: Stores prospect data (name, email, phone, service, event ID, conversation summary) after collection.  
  - Config: Append or update mode matching on contact ID, targeting specific sheet and document.  
  - Inputs: Data from AI assistant.  
  - Credentials: Google Sheets OAuth2.  
  - Potential errors: Google API auth failure, sheet access issues.

- **Update Prospect with Booking Details**  
  - Type: Google Sheets Tool node  
  - Role: Updates existing prospect record with booking date/time and event ID after user selects a time slot.  
  - Config: Update mode with matching on contact ID.  
  - Inputs: AI assistant output.  
  - Credentials: Google Sheets OAuth2.

- **Fetch Available Time Slots**  
  - Type: HTTP Request tool node (Langchain tool)  
  - Role: Queries Cal.com API to retrieve available appointment slots for selected service.  
  - Config: GET request with parameters eventTypeId, startTime (now), endTime (+48h), max 5 slots, uses Paris timezone in ISO 8601 format.  
  - Headers: Authorization Bearer token, Content-Type JSON.  
  - Inputs: Event ID and time params from AI assistant.  
  - Outputs: Available slots data for AI to display.  
  - Potential issues: API rate limits, invalid event ID, time format errors.

- **Send Response to WhatsApp**  
  - Type: Respond to Webhook node  
  - Role: Sends AI assistant's replies back to the WhatsApp user as response to webhook call.  
  - Inputs: AI assistant output.  
  - Outputs: HTTP response containing message(s).  

---

#### 2.2 Appointment Booking

**Overview:**  
This block normalizes the user-selected booking time, sends booking data to Cal.com, checks booking success, updates Google Sheets with confirmed bookings, and responds back to the user.

**Nodes Involved:**  
- Retrieve Prospect Details  
- Normalize Booking Time (UTC Format)  
- Send Booking  
- Format Date for Readability (Display)  
- Check Booking Status (Success or Error)  
- Webhook Response: Booking Confirmed  
- Webhook Response: Booking Failed  
- Mark Booking as Confirmed in Sheet

**Node Details:**

- **Retrieve Prospect Details**  
  - Type: Google Sheets node  
  - Role: Retrieves prospect’s stored data by contact ID to use for booking creation.  
  - Config: Sheet filter on contact ID from WhatsApp input.  
  - Credentials: Google Sheets OAuth2.

- **Normalize Booking Time (UTC Format)**  
  - Type: Code node (JavaScript)  
  - Role: Converts the booking date/time string (possibly in Paris timezone) into ISO 8601 UTC format with 'Z' suffix for Cal.com API.  
  - Inputs: "Date du rendez-vous" from prospect details.  
  - Outputs: JSON with original and normalized date strings.  
  - Edge cases: Invalid or malformed date input.

- **Send Booking**  
  - Type: HTTP Request node  
  - Role: Posts booking data to Cal.com API to create an appointment.  
  - Config: POST with JSON body including eventTypeId, normalized start time, attendee info (name, email, timezone Europe/Paris), and booking field responses (summary).  
  - Headers: Authorization Bearer token, content-type JSON, Cal API version.  
  - Inputs: Normalized date, prospect details.  
  - Outputs: Booking API response including status.  
  - Failures: API errors, invalid data, network timeout.

- **Format Date for Readability (Display)**  
  - Type: Code node (JavaScript)  
  - Role: Formats the appointment date/time into a human-readable string (e.g., "June 4, 9am") for user confirmation messages.  
  - Inputs: Raw booking date from prospect details.  
  - Outputs: JSON with original and formatted date strings.  
  - Edge cases: Invalid date inputs.

- **Check Booking Status (Success or Error)**  
  - Type: Switch node  
  - Role: Routes flow based on Cal.com booking response status (success or error).  
  - Inputs: Send Booking node output.  
  - Outputs: To success or failure webhook responses.  

- **Webhook Response: Booking Confirmed**  
  - Type: Respond to Webhook node  
  - Role: Sends a JSON confirmation message to the user acknowledging successful booking.  

- **Webhook Response: Booking Failed**  
  - Type: Respond to Webhook node  
  - Role: Sends JSON error message to the user if booking failed (e.g., slot no longer available).  

- **Mark Booking as Confirmed in Sheet**  
  - Type: Google Sheets node  
  - Role: Updates the prospect’s row marking the booking as confirmed (“confirm”) for record keeping.  
  - Inputs: Contact ID from Retrieve Prospect Details.  
  - Credentials: Google Sheets OAuth2.

---

#### 2.3 SMS Reminders

**Overview:**  
This block runs on a schedule every hour, reads upcoming confirmed appointments from the sheet, filters those within the next 2 hours, sends SMS reminders to clients, and marks reminders as sent.

**Nodes Involved:**  
- Trigger: Check Appointments Every Hour  
- Read Upcoming Appointments from Sheet  
- Filter Appointments Within Next 2 Hours  
- Send SMS Reminder  
- Mark SMS as Sent in Sheet

**Node Details:**

- **Trigger: Check Appointments Every Hour**  
  - Type: Schedule Trigger node  
  - Role: Initiates the reminder flow every hour automatically.

- **Read Upcoming Appointments from Sheet**  
  - Type: Google Sheets node  
  - Role: Reads all appointment records to find candidates for reminders.  
  - Credentials: Google Sheets OAuth2.

- **Filter Appointments Within Next 2 Hours**  
  - Type: Code node (JavaScript)  
  - Role: Filters appointments that are:  
    - Confirmed ("Réservé" = "confirm")  
    - Have no reminder sent yet ("Rappel SMS envoyé" ≠ "envoyer")  
    - Scheduled within the next 2 hours according to Paris timezone.  
  - Also formats appointment time for logging and message.  
  - Outputs filtered list of appointments needing reminders.  
  - Edge cases: Invalid date formats, timezone miscalculations.

- **Send SMS Reminder**  
  - Type: sms77 node  
  - Role: Sends SMS to the prospect’s phone number with a reminder message including appointment details.  
  - Credentials: sms77 API key.  
  - Inputs: Phone number and personalized message from filtered appointments.  
  - Failures: SMS API errors, invalid phone numbers.

- **Mark SMS as Sent in Sheet**  
  - Type: Google Sheets node  
  - Role: Updates prospect’s record marking that SMS reminder has been sent ("envoyer") to prevent duplicates.  
  - Credentials: Google Sheets OAuth2.

---

### 3. Summary Table

| Node Name                         | Node Type                          | Functional Role                              | Input Node(s)                           | Output Node(s)                           | Sticky Note                                                                                         |
|----------------------------------|----------------------------------|----------------------------------------------|---------------------------------------|-----------------------------------------|--------------------------------------------------------------------------------------------------|
| Webhook Trigger (WhatsApp Input) | Webhook Trigger                  | Entry point for WhatsApp messages             | -                                     | Switch: Confirm vs Chat Flow             | # 🟫 STEP 1 — Qualify User and Suggest Appointment                                                |
| Switch: Confirm vs Chat Flow      | Switch                          | Routes chat or booking confirmation flows    | Webhook Trigger                       | AI Booking Assistant, Retrieve Prospect Details |                                                                                                  |
| AI Booking Assistant (Dr Firas)   | Langchain Agent                 | Conversational AI to qualify user & suggest appointments | Switch: Confirm vs Chat Flow          | Send Response to WhatsApp                |                                                                                                  |
| LLM: GPT-4o Chat Model            | Langchain LLM                  | Language model for AI assistant               | AI Booking Assistant                  | AI Booking Assistant                    |                                                                                                  |
| AI Conversation Memory            | Langchain Memory               | Maintains conversational context             | AI Booking Assistant                  | AI Booking Assistant                    |                                                                                                  |
| Create New Prospect in Google Sheet | Google Sheets Tool            | Stores prospect data after qualification      | AI Booking Assistant                  | AI Booking Assistant                    |                                                                                                  |
| Update Prospect with Booking Details | Google Sheets Tool            | Updates prospect with selected booking details | AI Booking Assistant                  | AI Booking Assistant                    |                                                                                                  |
| Fetch Available Time Slots        | Langchain HTTP Request Tool     | Retrieves available appointment slots from Cal.com | AI Booking Assistant                  | AI Booking Assistant                    |                                                                                                  |
| Send Response to WhatsApp         | Respond to Webhook             | Sends AI assistant's reply to WhatsApp user   | AI Booking Assistant                  | -                                       |                                                                                                  |
| Retrieve Prospect Details         | Google Sheets                  | Retrieves prospect info for booking           | Switch: Confirm vs Chat Flow          | Normalize Booking Time (UTC Format)     |                                                                                                  |
| Normalize Booking Time (UTC Format) | Code                         | Converts booking time to UTC ISO string        | Retrieve Prospect Details             | Send Booking                           |                                                                                                  |
| Send Booking                     | HTTP Request                   | Sends booking request to Cal.com API           | Normalize Booking Time                | Format Date for Readability (Display)  |                                                                                                  |
| Format Date for Readability (Display) | Code                      | Formats booking date/time to readable string  | Send Booking                        | Check Booking Status                   |                                                                                                  |
| Check Booking Status (Success or Error) | Switch                    | Routes flow on booking success or failure      | Format Date for Readability           | Webhook Response: Booking Confirmed, Webhook Response: Booking Failed |                                                                                                  |
| Webhook Response: Booking Confirmed | Respond to Webhook           | Sends confirmation message to user             | Check Booking Status                  | Mark Booking as Confirmed in Sheet      |                                                                                                  |
| Webhook Response: Booking Failed | Respond to Webhook             | Sends failure message to user                   | Check Booking Status                  | -                                       |                                                                                                  |
| Mark Booking as Confirmed in Sheet | Google Sheets                | Marks booking as confirmed in sheet             | Webhook Response: Booking Confirmed  | -                                       |                                                                                                  |
| Trigger: Check Appointments Every Hour | Schedule Trigger           | Hourly trigger to check upcoming appointments | -                                   | Read Upcoming Appointments from Sheet   | # 🟩 STEP 3 — Send SMS Reminder Before Appointment                                               |
| Read Upcoming Appointments from Sheet | Google Sheets              | Reads all appointments from sheet               | Trigger: Check Appointments Every Hour | Filter Appointments Within Next 2 Hours |                                                                                                  |
| Filter Appointments Within Next 2 Hours | Code                     | Filters appointments within next 2 hours needing reminder | Read Upcoming Appointments from Sheet | Send SMS Reminder                     |                                                                                                  |
| Send SMS Reminder                | sms77                         | Sends SMS reminders to clients                  | Filter Appointments Within Next 2 Hours | Mark SMS as Sent in Sheet              |                                                                                                  |
| Mark SMS as Sent in Sheet        | Google Sheets                 | Marks SMS reminder as sent in sheet             | Send SMS Reminder                    | -                                       |                                                                                                  |
| Sticky Note                     | Sticky Note                   | Visual step divider/label (Step 1)              | -                                   | -                                       | # 🟫 STEP 1 — Qualify User and Suggest Appointment                                                |
| Sticky Note3                    | Sticky Note                   | Visual step divider/label (Step 2)              | -                                   | -                                       | # 🟥 STEP 2 — Book Appointment Automatically                                                     |
| Sticky Note (Step 3)             | Sticky Note                   | Visual step divider/label (Step 3)              | -                                   | -                                       | # 🟩 STEP 3 — Send SMS Reminder Before Appointment                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Trigger (WhatsApp Input):**  
   - Type: Webhook Trigger  
   - Method: POST  
   - Path: Unique identifier (e.g., "6438cd95-74cb-4f40-a1a5-853706fe96f6")  
   - Response Mode: Respond via response node  
   - Purpose: Receive WhatsApp messages with JSON body containing user input and contact info.

2. **Add Switch Node (Confirm vs Chat Flow):**  
   - Type: Switch  
   - Conditions:  
     - Output "Discussion": If userInput does NOT contain "confirm" (case-sensitive).  
     - Output "Confirm booking": If userInput contains "confirm".  
   - Connect input from Webhook Trigger.

3. **Set Up AI Booking Assistant (Dr Firas):**  
   - Type: Langchain Agent node  
   - Configuration:  
     - Text input: `={{ $json.body.userInput }}`  
     - System message: Embed detailed scripted conversation in French including identity, services, tone, flow, constraints, and date.  
   - Connect input from "Discussion" output of Switch node.

4. **Configure LLM: GPT-4o Chat Model:**  
   - Type: Langchain LLM node  
   - Model: "gpt-4o"  
   - Credentials: Link to OpenAI API key  
   - Connect input from AI Booking Assistant node's LLM input.

5. **Add AI Conversation Memory:**  
   - Type: Langchain Memory Buffer  
   - Session Key: `={{ $json.body.contactId }}`  
   - Context Window Length: 50  
   - Connect input/output to AI Booking Assistant node.

6. **Add Fetch Available Time Slots Node:**  
   - Type: Langchain HTTP Request Tool  
   - URL: `https://api.cal.com/v2/slots/available`  
   - Method: GET with query parameters: eventTypeId, startTime, endTime  
   - Headers: Authorization Bearer token (Cal.com live token), Content-Type application/json  
   - Connect as AI Tool input to AI Booking Assistant node.

7. **Create New Prospect in Google Sheets:**  
   - Type: Google Sheets Tool (append or update)  
   - Document ID and Sheet Name: Your Google Sheet for appointments  
   - Matching Column: "ID du contact"  
   - Columns to capture: Nom, Courriel, Numéro de téléphone, Résumé, ID du contact  
   - Credentials: Google Sheets OAuth2  
   - Connect as AI Tool output to AI Booking Assistant node.

8. **Update Prospect with Booking Details:**  
   - Type: Google Sheets Tool (update)  
   - Columns: ID du contact, Date du rendez-vous, ID de l’événement, Nom de l’événement  
   - Matching Column: "ID du contact"  
   - Credentials: Google Sheets OAuth2  
   - Connect as AI Tool output to AI Booking Assistant node.

9. **Send Response to WhatsApp Node:**  
   - Type: Respond to Webhook  
   - Respond with: All incoming items  
   - Connect output from AI Booking Assistant main output.

10. **Retrieve Prospect Details:**  
    - Type: Google Sheets node  
    - Filter: "ID du contact" equals `={{ $json.body.contactId }}` from webhook  
    - Credentials: Google Sheets OAuth2  
    - Connect from "Confirm booking" output of Switch node.

11. **Normalize Booking Time (UTC Format) Code Node:**  
    - JavaScript to convert "Date du rendez-vous" to ISO 8601 UTC string with 'Z' suffix.  
    - Connect output from Retrieve Prospect Details.

12. **Send Booking HTTP Request Node:**  
    - URL: `https://api.cal.com/v2/bookings`  
    - Method: POST  
    - JSON Body: eventTypeId, start (normalized time), attendee (name, email, timezone Europe/Paris), bookingFieldsResponses (title)  
    - Headers: Authorization Bearer token, Content-Type application/json, cal-api-version  
    - Connect output from Normalize Booking Time node.

13. **Format Date for Readability (Display) Code Node:**  
    - JavaScript formatting date string to readable format (e.g., "June 4, 9am") using timezone Europe/Berlin (close to Paris).  
    - Connect output from Send Booking node.

14. **Check Booking Status Switch Node:**  
    - Condition:  
      - Output "succeeded" if `status` equals "success" in Send Booking response.  
      - Output "Failed" if `status` equals "error".  
    - Connect output from Format Date node.

15. **Webhook Response: Booking Confirmed Node:**  
    - Type: Respond to Webhook  
    - Respond with JSON confirming booking success message.  
    - Connect from "succeeded" output of Switch.

16. **Webhook Response: Booking Failed Node:**  
    - Type: Respond to Webhook  
    - Respond with JSON error message indicating slot unavailable.  
    - Connect from "Failed" output of Switch.

17. **Mark Booking as Confirmed in Sheet:**  
    - Type: Google Sheets node (update)  
    - Set "Réservé" column to "confirm" for matching contact ID.  
    - Credentials: Google Sheets OAuth2  
    - Connect from Webhook Response: Booking Confirmed node.

18. **Trigger: Check Appointments Every Hour:**  
    - Type: Schedule Trigger  
    - Interval: Every 1 hour

19. **Read Upcoming Appointments from Sheet:**  
    - Type: Google Sheets node  
    - Read entire sheet containing appointments.  
    - Credentials: Google Sheets OAuth2  
    - Connect from schedule trigger.

20. **Filter Appointments Within Next 2 Hours Code Node:**  
    - JavaScript filtering confirmed appointments ("Réservé" = "confirm"), no reminder sent yet ("Rappel SMS envoyé" ≠ "envoyer"), within the next 2 hours in Paris timezone.  
    - Also formats appointment display time for message.  
    - Connect from Read Upcoming Appointments node.

21. **Send SMS Reminder Node:**  
    - Type: sms77 node  
    - To: Prospect phone number from filtered items  
    - Message: Personalized reminder with name and event name, note appointment is within 2 hours.  
    - Credentials: sms77 API key  
    - Connect from filtered appointments node.

22. **Mark SMS as Sent in Sheet:**  
    - Type: Google Sheets node (update)  
    - Sets "Rappel SMS envoyé" field to "envoyer" for matching contact ID.  
    - Credentials: Google Sheets OAuth2  
    - Connect from Send SMS Reminder node.

23. **Add Sticky Notes:**  
    - Create three sticky notes for visual separation of steps in workflow:  
      - Step 1: Qualify User and Suggest Appointment  
      - Step 2: Book Appointment Automatically  
      - Step 3: Send SMS Reminder Before Appointment  

---

### 5. General Notes & Resources

| Note Content                                                                                          | Context or Link                                                                                       |
|-----------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| Workflow handles 24/7 WhatsApp bookings with AI assistant in French and English, using GPT-4o.      | Core functionality and language context.                                                            |
| Cal.com API used for scheduling availability and bookings with ISO 8601 dates in Paris timezone.    | https://cal.com/docs/api/                                                                           |
| SMS reminders sent via sms77 API every hour for upcoming appointments within 2 hours.                | https://www.sms77.io/en/docs/                                                                       |
| Google Sheets used as CRM for prospect and booking data with OAuth2 credentials.                     | Google Sheets API docs: https://developers.google.com/sheets/api                                    |
| AI assistant system prompt includes detailed conversational flow and constraints for user guidance. | Custom prompt embedded inside AI Booking Assistant node.                                            |
| Important to manage API rate limits and error handling especially for OpenAI, Cal.com, and sms77.   | Consider retry logic or alerts for failures in production.                                          |

---

**Disclaimer:**  
The provided text is extracted exclusively from an automated workflow created with n8n, a no-code automation tool. This process strictly complies with content policies and contains no illegal, offensive, or protected elements. All handled data is legal and publicly accessible.