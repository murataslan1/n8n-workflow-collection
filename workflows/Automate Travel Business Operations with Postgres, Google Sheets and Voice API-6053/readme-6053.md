Automate Travel Business Operations with Postgres, Google Sheets and Voice API

https://n8nworkflows.xyz/workflows/automate-travel-business-operations-with-postgres--google-sheets-and-voice-api-6053


# Automate Travel Business Operations with Postgres, Google Sheets and Voice API

### 1. Workflow Overview

This workflow automates the core operational processes of a travel business by integrating incoming call management, trip booking validation and updates, lead capture from Google Sheets, and outbound marketing calls via a Voice API. It is designed to handle inbound calls by validating trip details from a Postgres database and responding with organizer info, process voice input for booking updates, track new leads from a Google Sheet and initiate marketing outreach calls, and log all call interactions with detailed user input into a spreadsheet for record-keeping.

**Logical blocks:**

- **1.1 Incoming Call Handling:** Reception and validation of incoming call data, with organizer info delivery.
- **1.2 Voice Input Processing & Booking Update:** Captures voice input from calls and updates booking records.
- **1.3 Lead Capture and Marketing Outreach:** Detects new leads added to Google Sheets, formats data, and initiates outbound marketing calls.
- **1.4 Call Response Logging:** Logs detailed call responses and user input into Google Sheets for tracking and follow-up.

---

### 2. Block-by-Block Analysis

#### 1.1 Incoming Call Handling

**Overview:**  
Handles incoming webhook calls representing new customer calls, validates trip details from the database, and responds with relevant organizer information.

**Nodes Involved:**  
- Detect Incoming Call (Webhook)  
- Validate Trip Details (Postgres)  
- Deliver Organizer Info (Respond to Webhook)  

**Node Details:**

- **Detect Incoming Call**  
  - *Type:* Webhook  
  - *Role:* Entry point for incoming call data via HTTP POST at path `/get-call`.  
  - *Configuration:* Responds through a response node, uses POST method.  
  - *Input:* External call data payload.  
  - *Output:* Passes call data JSON to next node.  
  - *Failure Modes:* Webhook not triggered if path or method misconfigured; malformed payload.  
  - *Version:* v2 (latest webhook node version).

- **Validate Trip Details**  
  - *Type:* Postgres  
  - *Role:* Queries Postgres database to validate or fetch trip-related data based on incoming call info.  
  - *Configuration:* Select operation on a table identified by parameter `table_id` in schema `public`. Limit 150 rows.  
  - *Input:* Receives JSON from webhook node; likely uses input data to filter query (though the exact query is abstracted).  
  - *Output:* Query result including availability info.  
  - *Failure Modes:* DB connection issues, invalid table/schema, query errors.  
  - *Credentials:* Postgres-test.  
  - *Version:* 2.6.

- **Deliver Organizer Info**  
  - *Type:* Respond to Webhook  
  - *Role:* Sends JSON response back to caller with trip organizer info including call toolCallId and availability status.  
  - *Configuration:* Responds with JSON containing `toolCallId` extracted from the webhook payload and `available` field from DB query.  
  - *Input:* Receives DB query output.  
  - *Output:* HTTP response to the original webhook request.  
  - *Failure Modes:* Expression errors if referenced fields missing, webhook response failure.  
  - *Version:* 1.2.

---

#### 1.2 Voice Input Processing & Booking Update

**Overview:**  
Captures voice input from calls via webhook, updates booking records in Postgres, and sends confirmation response.

**Nodes Involved:**  
- Capture Voice Input (Webhook)  
- Update Booking Record (Postgres)  
- Send Booking Confirmation (Respond to Webhook)  

**Node Details:**

- **Capture Voice Input**  
  - *Type:* Webhook  
  - *Role:* Entry point for voice input data from calls, POST at `/input-data`.  
  - *Configuration:* Uses POST method and response node mode.  
  - *Input:* Voice input JSON with tool call details.  
  - *Output:* Passes data to Postgres update.  
  - *Failure Modes:* Missing or malformed input data, webhook misconfiguration.  
  - *Version:* 2.

- **Update Booking Record**  
  - *Type:* Postgres  
  - *Role:* Upsert operation to update or insert booking information based on voice input.  
  - *Configuration:* Upsert on `table_id` in schema `public`, with automatic column mapping from input data.  
  - *Input:* Voice input data from webhook.  
  - *Output:* Booking update result.  
  - *Failure Modes:* DB connection failures, data mapping errors, invalid input data.  
  - *Credentials:* Postgres-test.  
  - *Version:* 2.6.

- **Send Booking Confirmation**  
  - *Type:* Respond to Webhook  
  - *Role:* Sends JSON confirmation response containing toolCallId and status field back to the caller.  
  - *Configuration:* Uses expression to extract `toolCallId` from voice input and `status` from booking update result.  
  - *Input:* Output of booking update.  
  - *Output:* HTTP response to webhook caller.  
  - *Failure Modes:* Expression evaluation errors, webhook communication failure.  
  - *Version:* 1.2.

---

#### 1.3 Lead Capture and Marketing Outreach

**Overview:**  
Listens for new rows added to a Google Sheet containing lead information, formats phone numbers, and triggers outbound marketing calls via an external Voice API.

**Nodes Involved:**  
- Detect New Lead (Google Sheets Trigger)  
- Format Lead Information (Set)  
- Initiate Marketing Outreach (HTTP Request)  

**Node Details:**

- **Detect New Lead**  
  - *Type:* Google Sheets Trigger  
  - *Role:* Listens for new rows added to a specific Google Sheet (sheet ID and document ID provided).  
  - *Configuration:* Polls every minute, triggers on new row added event.  
  - *Input:* New lead data row from Google Sheets.  
  - *Output:* Passes row data downstream.  
  - *Failure Modes:* OAuth token expiry, connectivity issues, sheet ID mismatch.  
  - *Credentials:* Google Sheets OAuth2.  
  - *Version:* 1.

- **Format Lead Information**  
  - *Type:* Set  
  - *Role:* Formats lead phone number by prefixing with "+" sign to ensure E.164 format for calling.  
  - *Configuration:* Sets `Phone_number` field to `+{{ $json.Phone }}`.  
  - *Input:* Lead data from Sheets.  
  - *Output:* Modified JSON with formatted phone number.  
  - *Failure Modes:* Missing or malformed phone number field.  
  - *Version:* 3.4.

- **Initiate Marketing Outreach**  
  - *Type:* HTTP Request  
  - *Role:* Sends POST request to Voice API to initiate an outbound marketing call using formatted phone number.  
  - *Configuration:* URL `https://api.vapi.ai/call`, JSON body includes assistantId and phoneNumberId placeholders (to be replaced), sends customer number in array. Uses Bearer token authentication.  
  - *Input:* Formatted lead phone number.  
  - *Output:* API response.  
  - *Failure Modes:* API auth failure, network timeout, invalid API parameters, missing credential.  
  - *Credentials:* Bearer Auth.  
  - *Version:* 4.2.

---

#### 1.4 Call Response Logging

**Overview:**  
Receives webhook calls with call response data, logs detailed user input and call metadata into a Google Sheet, and finally sends a relay response.

**Nodes Involved:**  
- Receive Call Response (Webhook)  
- Log User Input (Google Sheets)  
- Relay Response to System (Respond to Webhook)  

**Node Details:**

- **Receive Call Response**  
  - *Type:* Webhook  
  - *Role:* Entry point for receiving call response data at `/call`.  
  - *Configuration:* POST method with response node mode.  
  - *Input:* Call response JSON containing detailed call arguments.  
  - *Output:* Passes data to Google Sheets logging.  
  - *Failure Modes:* Malformed payload, webhook misconfiguration.  
  - *Version:* 2.

- **Log User Input**  
  - *Type:* Google Sheets  
  - *Role:* Appends or updates rows in a Google Sheet with detailed call interaction data including call notes, outcomes, prospect information, and follow-up dates.  
  - *Configuration:* Uses sheet with ID `0oijht5tfcs3edfvgb` and sheet name `gid=0`. Maps multiple call argument fields to sheet columns, matches on `phone_number` for update or append. Uses service account authentication.  
  - *Input:* Call response JSON properties.  
  - *Output:* Confirmation of sheet append or update.  
  - *Failure Modes:* Authentication failure, missing mapping fields, API quota limits.  
  - *Credentials:* Google Sheets Service Account.  
  - *Version:* 4.5.

- **Relay Response to System**  
  - *Type:* Respond to Webhook  
  - *Role:* Final node to respond back to the source system, confirming receipt of logged data.  
  - *Configuration:* Simple response with default options, no custom body.  
  - *Input:* Output from Google Sheets node.  
  - *Output:* HTTP response.  
  - *Failure Modes:* Response failure, webhook timeout.  
  - *Version:* 1.2.

---

### 3. Summary Table

| Node Name              | Node Type            | Functional Role                              | Input Node(s)          | Output Node(s)           | Sticky Note                                                                                  |
|------------------------|----------------------|----------------------------------------------|------------------------|--------------------------|----------------------------------------------------------------------------------------------|
| Detect Incoming Call    | Webhook              | Receive incoming call data                    | -                      | Validate Trip Details     | Automates handling of incoming calls and provides trip organizer details.                     |
| Validate Trip Details   | Postgres             | Validate trip details from DB                  | Detect Incoming Call    | Deliver Organizer Info    | Processes incoming call data and facilitates trip booking creation.                          |
| Deliver Organizer Info  | Respond to Webhook   | Respond with organizer info                     | Validate Trip Details   | -                        | Automates handling of incoming calls and provides trip organizer details.                     |
| Capture Voice Input     | Webhook              | Receive voice input from call                   | -                      | Update Booking Record     | Processes incoming call data and facilitates trip booking creation.                          |
| Update Booking Record   | Postgres             | Update or insert booking record                  | Capture Voice Input     | Send Booking Confirmation | Processes incoming call data and facilitates trip booking creation.                          |
| Send Booking Confirmation| Respond to Webhook  | Send booking confirmation response               | Update Booking Record   | -                        | Processes incoming call data and facilitates trip booking creation.                          |
| Detect New Lead         | Google Sheets Trigger| Detect new lead row addition                     | -                      | Format Lead Information   | Manages outbound marketing calls to promote trip organizer services.                        |
| Format Lead Information | Set                  | Format lead phone number                         | Detect New Lead         | Initiate Marketing Outreach | Manages outbound marketing calls to promote trip organizer services.                        |
| Initiate Marketing Outreach| HTTP Request       | Call outbound marketing via Voice API            | Format Lead Information | -                        | Manages outbound marketing calls to promote trip organizer services.                        |
| Receive Call Response   | Webhook              | Receive call response data                        | -                      | Log User Input            | Captures incoming call data and stores it in an organized spreadsheet.                      |
| Log User Input          | Google Sheets        | Log detailed call/user data in spreadsheet       | Receive Call Response   | Relay Response to System  | Captures incoming call data and stores it in an organized spreadsheet.                      |
| Relay Response to System| Respond to Webhook   | Confirm logging completion                        | Log User Input          | -                        | Captures incoming call data and stores it in an organized spreadsheet.                      |
| Sticky Note             | Sticky Note          | Comment node                                     | -                      | -                        | Automates handling of incoming calls and provides trip organizer details.                     |
| Sticky Note1            | Sticky Note          | Comment node                                     | -                      | -                        | Processes incoming call data and facilitates trip booking creation.                          |
| Sticky Note2            | Sticky Note          | Comment node                                     | -                      | -                        | Manages outbound marketing calls to promote trip organizer services.                        |
| Sticky Note3            | Sticky Note          | Comment node                                     | -                      | -                        | Captures incoming call data and stores it in an organized spreadsheet.                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node "Detect Incoming Call"**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `get-call`  
   - Response Mode: Response Node  
   - Purpose: Receive incoming call data.

2. **Add Postgres Node "Validate Trip Details"**  
   - Operation: Select  
   - Table: `table_id` (replace with your actual table name)  
   - Schema: `public`  
   - Limit: 150  
   - Credentials: Link your Postgres-test credentials  
   - Input: Connect from "Detect Incoming Call"  
   - Purpose: Query trip details for validation.

3. **Add Respond to Webhook "Deliver Organizer Info"**  
   - Respond With: JSON  
   - Response Body:  
     ```json
     {
       "results": [
         {
           "toolCallId": "={{ $('Detect Incoming Call').item.json.body.message.toolCalls[0].id }}",
           "result": "={{ $json.available }}"
         }
       ]
     }
     ```  
   - Input: Connect from "Validate Trip Details"  
   - Purpose: Return organizer info to caller.

4. **Create Webhook Node "Capture Voice Input"**  
   - HTTP Method: POST  
   - Path: `input-data`  
   - Response Mode: Response Node  
   - Purpose: Receive voice input data during calls.

5. **Add Postgres Node "Update Booking Record"**  
   - Operation: Upsert  
   - Table: `table_id`  
   - Schema: `public`  
   - Columns: Auto-map input data fields for update  
   - Credentials: Postgres-test  
   - Input: Connect from "Capture Voice Input"  
   - Purpose: Update or create booking records.

6. **Add Respond to Webhook "Send Booking Confirmation"**  
   - Respond With: JSON  
   - Response Body:  
     ```json
     {
       "results": [
         {
           "toolCallId": "={{ $('Capture Voice Input').item.json.body.message.toolCalls[0].id }}",
           "result": "={{ $json.status }}"
         }
       ]
     }
     ```  
   - Input: Connect from "Update Booking Record"  
   - Purpose: Confirm booking update to caller.

7. **Add Google Sheets Trigger "Detect New Lead"**  
   - Event: Row Added  
   - Polling: Every Minute  
   - Sheet Name: Use your sheet ID (e.g., `0oijhgfr456yujhnbvcdew23erfg`)  
   - Document ID: Your Google Sheet document ID (e.g., `9iuhgft567ujm`)  
   - Credentials: Google Sheets OAuth2  
   - Purpose: Detect new leads from Google Sheets.

8. **Add Set Node "Format Lead Information"**  
   - Add Field: `Phone_number`  
   - Value: `= +{{ $json.Phone }}` (format phone number with plus sign)  
   - Input: Connect from "Detect New Lead"  
   - Purpose: Format phone number for calling.

9. **Add HTTP Request Node "Initiate Marketing Outreach"**  
   - URL: `https://api.vapi.ai/call`  
   - Method: POST  
   - Authentication: HTTP Bearer Auth (configure credentials)  
   - Body (JSON):  
     ```json
     {
       "assistantId": "add_id_here",
       "phoneNumberId": "add_id_here",
       "customers": [
         {"number": "{{ $json.Phone }}"}
       ]
     }
     ```  
   - Input: Connect from "Format Lead Information"  
   - Purpose: Initiate outbound marketing call.

10. **Add Webhook Node "Receive Call Response"**  
    - HTTP Method: POST  
    - Path: `call`  
    - Response Mode: Response Node  
    - Purpose: Receive call response data.

11. **Add Google Sheets Node "Log User Input"**  
    - Operation: Append or Update  
    - Document ID: Your Google Sheet ID (e.g., `0oijht5tfcs3edfvgb`)  
    - Sheet Name: `gid=0` (Sheet1)  
    - Map fields from incoming JSON arguments (e.g., `call_notes`, `company_name`, etc.) to sheet columns  
    - Match on column: `phone_number`  
    - Credentials: Google Sheets Service Account  
    - Input: Connect from "Receive Call Response"  
    - Purpose: Log detailed call data.

12. **Add Respond to Webhook "Relay Response to System"**  
    - Default response (no body)  
    - Input: Connect from "Log User Input"  
    - Purpose: Confirm logging success.

---

### 5. General Notes & Resources

| Note Content                                                                              | Context or Link                                                                                   |
|-------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| The workflow integrates PostgreSQL, Google Sheets, and an external Voice API for calls.   | Workflow description and integration details.                                                   |
| Authentication to Google Sheets uses both OAuth2 and Service Account depending on node.   | Ensure valid tokens and permissions are granted.                                                |
| Voice API requires valid `assistantId` and `phoneNumberId` in HTTP Request node.          | Replace placeholders with actual API credentials for outbound calls.                            |
| The workflow uses webhook nodes extensively; ensure the webhook URLs are correctly set.   | Webhook endpoints: `/get-call`, `/input-data`, `/call`.                                        |
| Sticky notes provide contextual summaries for each logical block.                         | See node sticky notes in the workflow for quick reference.                                     |
| Timezone set to Asia/Kolkata (Indian Standard Time).                                     | Important for scheduling or time-sensitive operations.                                         |

---

**Disclaimer:** The text above is generated exclusively from an automated n8n workflow and strictly adheres to valid content policies without inclusion of illegal or protected data. All data processed is public and legal.