Automate Restaurant Marketing & Booking with Excel, VAPI Voice Agent & Calendar

https://n8nworkflows.xyz/workflows/automate-restaurant-marketing---booking-with-excel--vapi-voice-agent---calendar-5890


# Automate Restaurant Marketing & Booking with Excel, VAPI Voice Agent & Calendar

---

### 1. Workflow Overview

This workflow automates restaurant marketing and booking management by integrating Google Sheets (Excel equivalent), a Voice AI platform (VAPI), and Google Calendar. It targets restaurant marketing teams aiming to streamline lead generation, campaign outreach through voice calls, conversational response tracking, and booking scheduling.

The workflow is logically structured into two main functional blocks:

- **1.1 Lead Acquisition and Marketing Campaign Execution**  
  Captures new leads from a Google Sheets spreadsheet, formats and loops through lead data, and initiates personalized voice marketing calls via the VAPI platform.

- **1.2 Voice Response Handling and Booking Management**  
  Receives and processes customer responses from VAPI webhooks, stores detailed call and booking data back into Google Sheets, extracts booking/order information, schedules bookings in Google Calendar, and sends confirmation responses through VAPI.

---

### 2. Block-by-Block Analysis

#### 2.1 Lead Acquisition and Marketing Campaign Execution

**Overview:**  
This block triggers when a new customer lead is added in Google Sheets. It prepares the lead data, processes leads in batches, and initiates personalized marketing calls through the VAPI voice agent.

**Nodes Involved:**  
- New Lead Trigger (Excel)  
- Prepare Lead Data  
- Loop Through Leads  
- Start Marketing Call (VAPI)

**Node Details:**

- **New Lead Trigger (Excel)**  
  - *Type & Role:* Google Sheets Trigger – listens for new rows added in a specified Google Sheets document and sheet.  
  - *Configuration:* Polls every minute on the lead list sheet (`call_list`) within the spreadsheet identified by a specific Google Sheet ID.  
  - *Expressions:* Uses Google Sheets OAuth2 credentials to authenticate.  
  - *Connections:* Outputs to Prepare Lead Data node.  
  - *Edge Cases:* Potential API rate limits or authentication expiry; new rows might have incomplete data.  
  - *Version:* v1.

- **Prepare Lead Data**  
  - *Type & Role:* Set node – formats and normalizes lead data fields, specifically formatting the phone number with a prefix `+`.  
  - *Configuration:* Uses expression `=+{{ $json.Phone }}` to ensure phone is in international format.  
  - *Connections:* Feeds into Loop Through Leads node.  
  - *Edge Cases:* Malformed phone numbers or missing phone fields may cause call failures.  
  - *Version:* v3.4.

- **Loop Through Leads**  
  - *Type & Role:* SplitInBatches – processes leads one by one (or in batches) to avoid API overload.  
  - *Configuration:* Defaults with no batch size explicitly set, implied single or default batch size.  
  - *Connections:* First output to Start Marketing Call (VAPI), second output loops back to itself to process next batch.  
  - *Edge Cases:* Infinite loop potential if batch completion is not handled correctly or leads are continuously added.  
  - *Version:* v3.

- **Start Marketing Call (VAPI)**  
  - *Type & Role:* HTTP Request node – calls VAPI's REST API to initiate a voice call to each lead.  
  - *Configuration:* POST request to `https://api.vapi.ai/call` with JSON body including assistantId, phoneNumberId, and the customer's phone number from lead data. Authentication via Bearer token credential.  
  - *Expressions:* Injects `{{ $json.Phone }}` dynamically as the phone number.  
  - *Connections:* No direct outputs; response is handled asynchronously by webhook.  
  - *Edge Cases:* API authentication failure, invalid phone numbers, VAPI service downtime, or call rejection.  
  - *Version:* v4.2.

---

#### 2.2 Voice Response Handling and Booking Management

**Overview:**  
Handles incoming responses from customers via the VAPI webhook, stores detailed customer feedback and booking preferences into Google Sheets, extracts and formats booking date/time, schedules the booking in Google Calendar, and sends confirmation back through VAPI.

**Nodes Involved:**  
- VAPI Call Response Webhook  
- Store User Response (Sheet)  
- Extract Booking/Order Info  
- Schedule Delivery/Table Booking  
- Send Response to VAPI

**Node Details:**

- **VAPI Call Response Webhook**  
  - *Type & Role:* Webhook node – receives POST callbacks from VAPI containing customer responses after voice calls.  
  - *Configuration:* Listens on path `/a34ac7ac-7ea4-4942-8dbf-f9ce3f0986e4`, HTTP POST method, responds using RespondToWebhook node downstream.  
  - *Connections:* Outputs to Store User Response (Sheet).  
  - *Edge Cases:* Unauthorized or malformed webhook payloads, webhook URL exposure risk, missing fields in payload.  
  - *Version:* v2.

- **Store User Response (Sheet)**  
  - *Type & Role:* Google Sheets node – appends or updates response data from VAPI into a master spreadsheet.  
  - *Configuration:* Maps multiple columns from JSON body arguments such as prospect_name, call_outcome, appointment_datetime, and others to corresponding Google Sheets columns. Uses 'appendOrUpdate' operation keyed by `prospect_name`. Authenticated via Google Sheets service account.  
  - *Connections:* Outputs to Extract Booking/Order Info.  
  - *Edge Cases:* Data mismatch, Google Sheets API quota limits, missing mandatory fields, concurrency conflicts.  
  - *Version:* v4.5.

- **Extract Booking/Order Info**  
  - *Type & Role:* Code node – custom JavaScript to parse and normalize booking date/time from user responses.  
  - *Configuration:*  
    - Parses `date_input` and `time_input` fields, supports keywords like 'today', 'tomorrow', or explicit dates.  
    - Converts time with AM/PM to 24-hour format.  
    - Calculates appointment start and end times (default duration 1 hour) in IST timezone with formatted string.  
  - *Connections:* Outputs to Schedule Delivery/Table Booking.  
  - *Edge Cases:* Invalid or ambiguous date/time inputs, missing fields, incorrect time zone conversions.  
  - *Version:* v2.

- **Schedule Delivery/Table Booking**  
  - *Type & Role:* Google Calendar node – schedules the extracted booking as a calendar event.  
  - *Configuration:* Uses parsed start and end datetime fields to create an event in the specified Google Calendar (email `abc@gmail.com`). Authenticated via Google Calendar OAuth2.  
  - *Connections:* Outputs to Send Response to VAPI.  
  - *Edge Cases:* Calendar permission errors, event conflicts, malformed datetime values.  
  - *Version:* v1.3.

- **Send Response to VAPI**  
  - *Type & Role:* RespondToWebhook node – sends confirmation or follow-up responses back to VAPI to complete webhook communication.  
  - *Configuration:* Default response to acknowledge webhook processing.  
  - *Connections:* Terminal node; ends the response flow.  
  - *Edge Cases:* Failures in responding could cause webhook timeouts or retries.  
  - *Version:* v1.2.

---

### 3. Summary Table

| Node Name                  | Node Type              | Functional Role                       | Input Node(s)                 | Output Node(s)                      | Sticky Note                                                                                                    |
|----------------------------|------------------------|------------------------------------|------------------------------|-----------------------------------|---------------------------------------------------------------------------------------------------------------|
| New Lead Trigger (Excel)    | Google Sheets Trigger  | Detect new lead in spreadsheet      |                              | Prepare Lead Data                  | Lead Management & Marketing Automation Workflow: New Lead Trigger captures new leads from spreadsheet          |
| Prepare Lead Data           | Set                    | Format and normalize lead data      | New Lead Trigger (Excel)      | Loop Through Leads                | Lead Management & Marketing Automation Workflow: Lead Preparation processes lead data                          |
| Loop Through Leads          | SplitInBatches          | Batch processing of leads           | Prepare Lead Data             | Start Marketing Call (VAPI), Loop Through Leads | Lead Management & Marketing Automation Workflow: Campaign Loop processes leads in batches                |
| Start Marketing Call (VAPI) | HTTP Request           | Initiate voice marketing calls      | Loop Through Leads            |                                   | Lead Management & Marketing Automation Workflow: Voice Marketing Call initiates personalized calls            |
| VAPI Call Response Webhook  | Webhook                | Receive customer voice responses    |                              | Store User Response (Sheet)       | Booking & Order Processing Workflow: Voice Response Capture triggers on customer responses                    |
| Store User Response (Sheet) | Google Sheets          | Store call results and feedback     | VAPI Call Response Webhook    | Extract Booking/Order Info        | Booking & Order Processing Workflow: Response Storage saves customer data                                     |
| Extract Booking/Order Info  | Code                   | Parse & format booking date/time    | Store User Response (Sheet)   | Schedule Delivery/Table Booking   | Booking & Order Processing Workflow: Information Extraction processes booking details                          |
| Schedule Delivery/Table Booking | Google Calendar    | Schedule booking in calendar        | Extract Booking/Order Info    | Send Response to VAPI             | Booking & Order Processing Workflow: Calendar Integration schedules bookings                                  |
| Send Response to VAPI       | RespondToWebhook       | Acknowledge and respond to webhook  | Schedule Delivery/Table Booking |                                 | Booking & Order Processing Workflow: Confirmation Loop finalizes communication                                |
| Sticky Note                | Sticky Note             | Documentation                      |                              |                                   | ## Lead Management & Marketing Automation Workflow (covers initial lead handling and marketing call nodes)     |
| Sticky Note1               | Sticky Note             | Documentation                      |                              |                                   | ## Booking & Order Processing Workflow (covers webhook, storage, extraction, calendar, and response nodes)     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Sheets Trigger Node: "New Lead Trigger (Excel)"**  
   - Type: Google Sheets Trigger  
   - Credentials: OAuth2 with Google Sheets API access  
   - Settings: Trigger on new row added in sheet `call_list` of spreadsheet with ID `1mkHJIhSFXdh1n65GKPwzEzFw0QasunyYm9BDglnXeiI`  
   - Polling: Every minute

2. **Add Set Node: "Prepare Lead Data"**  
   - Type: Set  
   - Configuration: Assign field `Phone` with expression `=+{{ $json.Phone }}` to format phone numbers internationally  
   - Connect input from "New Lead Trigger (Excel)"

3. **Add SplitInBatches Node: "Loop Through Leads"**  
   - Type: SplitInBatches  
   - Default batch size (or set explicitly if preferred)  
   - Connect input from "Prepare Lead Data"  
   - Configure first output to continue to next node, second output loops back to itself for batch processing

4. **Add HTTP Request Node: "Start Marketing Call (VAPI)"**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.vapi.ai/call`  
   - Authentication: Bearer Token OAuth2 with VAPI credentials  
   - Body: JSON with `assistantId`, `phoneNumberId`, and dynamic phone number `{{ $json.Phone }}`  
   - Connect input from first output of "Loop Through Leads"

5. **Add Webhook Node: "VAPI Call Response Webhook"**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `/a34ac7ac-7ea4-4942-8dbf-f9ce3f0986e4` (or custom path)  
   - Connect output to next node

6. **Add Google Sheets Node: "Store User Response (Sheet)"**  
   - Type: Google Sheets  
   - Credentials: Service Account with write access  
   - Operation: Append or Update  
   - Target sheet: Sheet1 in spreadsheet ID `1mkHJIhSFXdh1n65GKPwzEzFw0QasunyYm9BDglnXeiI`  
   - Map columns from webhook JSON body fields (`prospect_name`, `call_notes`, `appointment_datetime`, etc.)  
   - Connect input from "VAPI Call Response Webhook"

7. **Add Code Node: "Extract Booking/Order Info"**  
   - Type: Code  
   - Language: JavaScript  
   - Purpose: Parse `date_input` and `time_input` from stored responses, convert to IST timezone, create start and end datetime strings  
   - Connect input from "Store User Response (Sheet)"

8. **Add Google Calendar Node: "Schedule Delivery/Table Booking"**  
   - Type: Google Calendar  
   - Credentials: OAuth2 with Google Calendar access  
   - Calendar ID: `abc@gmail.com` (replace with actual calendar email)  
   - Start time: `{{ $json.appointment_datetime_parsed }}`  
   - End time: `{{ $json.appointment_end_datetime }}`  
   - Connect input from "Extract Booking/Order Info"

9. **Add RespondToWebhook Node: "Send Response to VAPI"**  
   - Type: RespondToWebhook  
   - Default settings  
   - Connect input from "Schedule Delivery/Table Booking"

10. **Add Sticky Note Nodes for Documentation**  
    - Create two Sticky Notes to document Lead Management & Marketing Automation and Booking & Order Processing blocks as per content in original workflow.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                              | Context or Link                                                                                     |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Workflow timezone is set to Asia/Kolkata to align with IST for appointment scheduling.                                                                                                                                                    | n8n Workflow Settings                                                                              |
| VAPI API requires Bearer token authentication and specific assistantId and phoneNumberId values for calls. These must be obtained from VAPI platform dashboard.                                                                          | https://docs.vapi.ai/api/                                                                         |
| Google Sheets API access requires OAuth2 or Service Account credentials with sufficient permissions for reading and writing.                                                                                                            | https://developers.google.com/sheets/api                                                          |
| Google Calendar integration requires OAuth2 with calendar modification scopes. Calendar ID must be correct to schedule events.                                                                                                         | https://developers.google.com/calendar/api                                                        |
| The custom JavaScript for datetime parsing assumes input strings in English and formats output explicitly with IST timezone and 24-hour format.                                                                                         | Code Node "Extract Booking/Order Info"                                                           |
| Sticky Notes in the workflow provide high-level documentation and can be used as in-editor references.                                                                                                                                  | Inline within workflow editor                                                                     |

---

**Disclaimer:** The provided text results exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly accessible.