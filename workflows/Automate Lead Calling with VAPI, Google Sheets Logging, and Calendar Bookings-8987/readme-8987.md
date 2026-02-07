Automate Lead Calling with VAPI, Google Sheets Logging, and Calendar Bookings

https://n8nworkflows.xyz/workflows/automate-lead-calling-with-vapi--google-sheets-logging--and-calendar-bookings-8987


# Automate Lead Calling with VAPI, Google Sheets Logging, and Calendar Bookings

### 1. Workflow Overview

This workflow automates outbound lead calling using VAPI’s voice assistant API, logs call outcomes into Google Sheets, and manages appointment bookings in Google Calendar. It is designed for real estate or sales teams that want to streamline lead engagement and follow-up scheduling with minimal manual intervention.

The workflow is organized into four main logical blocks:

- **1.1 Intake & Preparation:** Detect new leads from a Google Sheets document and prepare lead phone data for dialing.
- **1.2 Outbound Calling via VAPI:** Process leads in batches and initiate calls through VAPI’s API with proper authentication.
- **1.3 Capture Call Results:** Receive call outcome data asynchronously from VAPI via webhook, then append or update the lead records in Google Sheets.
- **1.4 Booking & Acknowledgment:** Parse appointment date/time from the call response, schedule an event in Google Calendar, and send confirmation back to VAPI.

---

### 2. Block-by-Block Analysis

#### 2.1 Intake & Preparation

- **Overview:**  
  This block triggers when a new lead row is added in the Google Sheets document (specifically the "call_list" sheet). It formats the phone number field to ensure consistent string type and prepares each lead for processing.

- **Nodes Involved:**  
  - New Lead Trigger (Excel)  
  - Prepare Lead Data  
  - Loop Through Leads

- **Node Details:**

  - **New Lead Trigger (Excel)**  
    - Type: Google Sheets Trigger  
    - Role: Watches for newly added rows in the "call_list" sheet of a specific Google Sheets document.  
    - Configuration: Polls every minute for new rows; uses OAuth2 credentials for Google Sheets.  
    - Inputs: None (trigger node)  
    - Outputs: New row JSON data including lead info such as phone number.  
    - Edge cases: Potential auth failures, Google API rate limits, or network issues.  
    - Notes: The sheet and document IDs are hardcoded; changes to sheet structure require updating configuration.

  - **Prepare Lead Data**  
    - Type: Set Node  
    - Role: Formats the phone number from the incoming lead row by prefixing it with a plus sign as a string (e.g., `=+{{ $json.Phone }}`) to avoid numeric coercion.  
    - Configuration: Uses an expression to convert phone numbers to string with a leading plus.  
    - Inputs: Output from the New Lead Trigger.  
    - Outputs: JSON with prepared "Phone" field.  
    - Edge cases: Phone field missing or incorrectly formatted input may cause malformed dialing numbers.

  - **Loop Through Leads**  
    - Type: SplitInBatches  
    - Role: Processes leads in batches to pace calls and avoid overloading the outbound call API.  
    - Configuration: Default batching options (batch size not explicitly set, so defaults apply).  
    - Inputs: Prepared lead data.  
    - Outputs: One lead item per batch iteration.  
    - Edge cases: Large lead volumes may need batch size tuning; errors in individual items do not halt entire batch.

#### 2.2 Outbound Calling via VAPI

- **Overview:**  
  This block sends API requests to VAPI to initiate outbound marketing calls to the prepared phone numbers. It authenticates with a bearer token and requires assistant and phone number IDs.

- **Nodes Involved:**  
  - Start Marketing Call (VAPI)

- **Node Details:**

  - **Start Marketing Call (VAPI)**  
    - Type: HTTP Request  
    - Role: Sends POST requests to VAPI’s `/call` endpoint to start calls with specified assistant and phone number IDs.  
    - Configuration:  
      - Uses HTTP Bearer Authentication with predefined credentials.  
      - JSON body dynamically fills the "customers" array with the phone number from the lead JSON.  
      - Requires pre-configured `assistantId` and `phoneNumberId` (placeholders shown, must be replaced).  
    - Inputs: Batches from Loop Through Leads.  
    - Outputs: HTTP response from VAPI (call initiation status).  
    - Edge cases: API throttling, authentication failures, invalid phone numbers, network timeouts.  
    - Notes: Recommended to implement retry/backoff on throttling or carrier errors.

#### 2.3 Capture Call Results

- **Overview:**  
  Receives asynchronous webhook callbacks from VAPI containing call results and detailed customer responses. It updates or appends these results into the main Google Sheets document, keyed on prospect name.

- **Nodes Involved:**  
  - VAPI Call Response Webhook  
  - Store User Response (Sheet)

- **Node Details:**

  - **VAPI Call Response Webhook**  
    - Type: Webhook  
    - Role: Receives POST requests from VAPI containing call outcome data and prospect responses.  
    - Configuration:  
      - Public webhook path set.  
      - Responds with data from downstream nodes.  
    - Inputs: External VAPI POST requests asynchronously.  
    - Outputs: JSON payload with detailed call data.  
    - Edge cases: Webhook URL exposure risks, malformed payloads, handling retries if VAPI resends.

  - **Store User Response (Sheet)**  
    - Type: Google Sheets node  
    - Role: Appends or updates rows in the main Google Sheets document with parsed call data.  
    - Configuration:  
      - Maps multiple fields (e.g., call notes, outcome, prospect info, appointment datetime, follow-up date) from webhook payload.  
      - Uses `matchingColumns` set to `prospect_name` to determine if a row should be updated or appended.  
      - Uses OAuth2 credentials.  
    - Inputs: Payload from webhook node.  
    - Outputs: Confirmation of sheet update.  
    - Edge cases: If `prospect_name` is not unique, duplicates or overwrites may occur; recommend using more stable keys like phone or email.  
    - Notes: Schema and fields extensive to capture detailed call insights.

#### 2.4 Booking & Acknowledgment

- **Overview:**  
  Parses user-provided booking date/time from the call response, formats it to Indian Standard Time (IST), creates a Google Calendar event for the appointment, and sends a 200 OK response back to VAPI.

- **Nodes Involved:**  
  - Extract Booking/Order Info (Code)  
  - Schedule Delivery/Table Booking (Google Calendar)  
  - Send Response to VAPI (Respond to Webhook)

- **Node Details:**

  - **Extract Booking/Order Info**  
    - Type: Code (JavaScript)  
    - Role: Parses `date_input` and `time_input` fields from the call response JSON, normalizes to IST timezone, and calculates start and end appointment times.  
    - Configuration:  
      - Implements custom date formatting using `Intl.DateTimeFormat` with `Asia/Kolkata` timezone.  
      - Defaults to "today" and "17:00" (5 PM) if inputs missing.  
      - Converts 12-hour AM/PM format to 24-hour time.  
      - Adds 1 hour to start time for end time.  
      - Adds fields `appointment_datetime_parsed` and `appointment_end_datetime` to item JSON.  
    - Inputs: Call result data from Sheet update node.  
    - Outputs: JSON with parsed appointment datetime fields.  
    - Edge cases: Invalid date/time strings, missing fields, malformed input may cause parsing errors.

  - **Schedule Delivery/Table Booking**  
    - Type: Google Calendar  
    - Role: Creates an event on a Google Calendar for the appointment duration derived from the parsed datetime fields.  
    - Configuration:  
      - Uses OAuth2 credentials for Google Calendar access.  
      - Event start and end times set from code node outputs (ISO 8601 format with IST timezone suffix).  
      - Calendar ID configured (example uses an email ID).  
    - Inputs: Parsed datetime from the code node.  
    - Outputs: Confirmation of calendar event creation.  
    - Edge cases: Calendar permission errors, invalid datetime formats, overlapping events not handled.

  - **Send Response to VAPI**  
    - Type: Respond to Webhook  
    - Role: Sends a 200 OK HTTP response back to VAPI confirming receipt and processing of the callback.  
    - Configuration: Default response; no custom data sent.  
    - Inputs: Output of calendar event creation node.  
    - Outputs: HTTP 200 response to webhook caller.  
    - Edge cases: Failures here prevent VAPI from knowing processing succeeded, possible retries.

---

### 3. Summary Table

| Node Name                     | Node Type              | Functional Role                          | Input Node(s)                  | Output Node(s)                 | Sticky Note                                                                                                           |
|-------------------------------|------------------------|----------------------------------------|-------------------------------|-------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| New Lead Trigger (Excel)       | Google Sheets Trigger  | Detect new lead rows in Google Sheets  | None                          | Prepare Lead Data              | STEP 1 · Intake & Prep: Sheets Trigger fires on new row in `call_list`. Format phone before dialing.                   |
| Prepare Lead Data              | Set                    | Format phone number for dialing         | New Lead Trigger (Excel)       | Loop Through Leads             | STEP 1 · Intake & Prep: Sheets Trigger fires on new row in `call_list`. Format phone before dialing.                   |
| Loop Through Leads            | SplitInBatches          | Batch processing of leads for calls     | Prepare Lead Data              | Start Marketing Call (VAPI), Loop Through Leads | STEP 2 · Dial (VAPI): Split In Batches paces calls. HTTP with Bearer auth to VAPI /call. Retry recommended.             |
| Start Marketing Call (VAPI)    | HTTP Request           | Initiate outbound calls via VAPI API    | Loop Through Leads            | None                          | STEP 2 · Dial (VAPI): Split In Batches paces calls. HTTP with Bearer auth to VAPI /call. Retry recommended.             |
| VAPI Call Response Webhook     | Webhook                | Receive call response asynchronously    | None (external trigger)        | Store User Response (Sheet)   | STEP 3 · Capture Results: Webhook receives VAPI call payload. Sheets appendOrUpdate stores parsed call data.            |
| Store User Response (Sheet)    | Google Sheets          | Append/update call results in Sheets    | VAPI Call Response Webhook    | Extract Booking/Order Info     | STEP 3 · Capture Results: Webhook receives VAPI call payload. Sheets appendOrUpdate stores parsed call data.            |
| Extract Booking/Order Info     | Code                   | Parse booking date/time, format to IST  | Store User Response (Sheet)   | Schedule Delivery/Table Booking| STEP 4 · Book & Acknowledge: Code parses date/time; use ISO 8601 for Calendar.                                         |
| Schedule Delivery/Table Booking| Google Calendar        | Create appointment event in Calendar    | Extract Booking/Order Info    | Send Response to VAPI          | STEP 4 · Book & Acknowledge: Code parses date/time; use ISO 8601 for Calendar.                                         |
| Send Response to VAPI          | Respond to Webhook     | Send 200 OK response back to VAPI       | Schedule Delivery/Table Booking| None                         | STEP 4 · Book & Acknowledge: Code parses date/time; use ISO 8601 for Calendar.                                         |
| Sticky Note                   | Sticky Note            | Documentation / guidance notes           | None                          | None                          | Various notes covering steps 1-4 as described in sticky note content.                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Sheets Trigger Node:**
   - Type: Google Sheets Trigger  
   - Configure to watch the "call_list" sheet in your Google Sheets document (use your document ID).  
   - Set event to "Row Added".  
   - Poll every minute.  
   - Connect OAuth2 credentials for Google Sheets API access.

2. **Add Set Node "Prepare Lead Data":**
   - Add a Set node to format the phone number.  
   - Create a field "Phone" with the value: `=+{{ $json.Phone }}` (string concatenation to keep phone number as string).  
   - Connect from Google Sheets Trigger node.

3. **Add SplitInBatches Node "Loop Through Leads":**
   - Use default batch size or customize as needed.  
   - Connect from the "Prepare Lead Data" node.

4. **Add HTTP Request Node "Start Marketing Call (VAPI)":**
   - Method: POST  
   - URL: `https://api.vapi.ai/call`  
   - Authentication: HTTP Bearer Auth with your VAPI token.  
   - JSON Body:
     ```json
     {
       "assistantId": "your_assistant_id_here",
       "phoneNumberId": "your_phone_number_id_here",
       "customers": [
         {
           "number": "{{ $json.Phone }}"
         }
       ]
     }
     ```
   - Connect from "Loop Through Leads" node.

5. **Create Webhook Node "VAPI Call Response Webhook":**
   - HTTP Method: POST  
   - Path: unique webhook path (e.g., auto-generated or custom)  
   - Response mode: response node  
   - No inputs (external trigger).

6. **Add Google Sheets Node "Store User Response (Sheet)":**
   - Operation: Append or Update  
   - Use the same Google Sheets document, targeting the main sheet (e.g., "Sheet1").  
   - Map all relevant fields from webhook JSON body to sheet columns, including: prospect_name, prospect_role, company_name, phone_number, email_address, call_outcome, call_notes, next_step, appointment_datetime, and others as per schema.  
   - Set `matchingColumns` to prospect_name (recommend updating to more stable keys like phone or email).  
   - Connect from the webhook node.

7. **Add Code Node "Extract Booking/Order Info":**
   - Paste the JavaScript code provided to parse and convert `date_input` and `time_input` into IST time format and calculate end time (+1 hour).  
   - Connect from the Google Sheets node.

8. **Add Google Calendar Node "Schedule Delivery/Table Booking":**
   - Operation: Create Event  
   - Calendar ID: your Google Calendar email or ID  
   - Event Start: `{{ $json.appointment_datetime_parsed }}`  
   - Event End: `{{ $json.appointment_end_datetime }}`  
   - OAuth2 credentials for Google Calendar API.  
   - Connect from the Code node.

9. **Add Respond to Webhook Node "Send Response to VAPI":**
   - Configure default 200 OK response.  
   - Connect from the Google Calendar node.

10. **Link all nodes according to the flow:**  
    - Google Sheets Trigger → Prepare Lead Data → Loop Through Leads → Start Marketing Call (VAPI)  
    - VAPI Call Response Webhook → Store User Response (Sheet) → Extract Booking/Order Info → Schedule Delivery/Table Booking → Send Response to VAPI

11. **Add Sticky Notes for documentation:**  
    - Add descriptive sticky notes near each block for future maintenance and clarity.

---

### 5. General Notes & Resources

| Note Content                                                                                                          | Context or Link                                                                                   |
|-----------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Use stable keys like phone number or email instead of prospect_name for matching in Google Sheets to avoid duplicates.| Sticky Note on "Store User Response (Sheet)" node advises this best practice.                    |
| Implement retry and exponential backoff on HTTP Request (Start Marketing Call) to handle throttling and carrier errors.| Sticky Note on "Loop Through Leads" and "Start Marketing Call (VAPI)" nodes.                     |
| Appointment times must be formatted in ISO 8601 with timezone info (IST) for Google Calendar compatibility.            | Sticky Note on "Extract Booking/Order Info" and "Schedule Delivery/Table Booking" nodes.        |
| Webhook path must be publicly accessible and secured appropriately to avoid unauthorized access or spam requests.      | General webhook security best practice; not explicitly documented but essential for production. |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All manipulated data are legal and public.