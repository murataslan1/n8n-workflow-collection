Automate Call Scheduling with Voice AI Receptionist using Vapi, Google Calendar & Airtable

https://n8nworkflows.xyz/workflows/automate-call-scheduling-with-voice-ai-receptionist-using-vapi--google-calendar---airtable-3427


# Automate Call Scheduling with Voice AI Receptionist using Vapi, Google Calendar & Airtable

### 1. Workflow Overview

This workflow automates appointment scheduling and call management using a voice AI receptionist integrated with Vapi (Twilio), Google Calendar, and Airtable. It targets small businesses, agencies, and solo professionals who want to streamline inbound call handling, appointment booking, rescheduling, cancellations, and call logging without manual intervention.

The workflow is logically divided into the following blocks:

- **1.1 Get Slots:** Receives requests to check available appointment slots, queries Google Calendar for existing events, computes free slots, and responds with formatted availability.
- **1.2 Book Slot:** Handles booking requests by validating input, converting times, creating Google Calendar events, logging bookings in Airtable, and responding with confirmation or error.
- **1.3 Update Slot:** Manages rescheduling requests by validating input, finding original appointments, updating Google Calendar events and Airtable records, and responding accordingly.
- **1.4 Cancel Slot:** Processes cancellation requests by validating input, locating appointments, deleting Google Calendar events, updating Airtable records, and sending confirmation or error responses.
- **1.5 Call Results Logging:** Receives post-call summaries and recordings from Vapi, extracting relevant data and saving it into Airtable for record-keeping.
- **1.6 Shared Utilities and Error Handling:** Common nodes for input argument extraction, response formatting, error message handling, and time zone conversions.

---

### 2. Block-by-Block Analysis

#### 1.1 Get Slots

- **Overview:**  
  This block receives a webhook call to check calendar availability for a requested time range. It fetches existing events from Google Calendar, processes them to find free 30-minute slots during business hours (Mon-Fri, 9 AM - 6 PM CST), formats the available times and wide-open ranges, and responds to Vapi with the availability data.

- **Nodes Involved:**  
  - Getslot_tool (Webhook)  
  - Input Arguments (Set)  
  - Check Availability (Google Calendar)  
  - Check if time is available or not (If)  
  - Time available (true) & Call_id (Set)  
  - Response (Respond to Webhook)  
  - Get All Calendar Events (Google Calendar)  
  - Extract start, end and name (Set)  
  - Sort (Item Lists)  
  - Format response (Item Lists)  
  - Available Start Times & Ranges (Code)  
  - Flatten Slots (Code)  
  - Enrich Date (Code)  
  - Build Response Payload (Set)  
  - Convert into Json format for Vapi (Code)  
  - Response to Vapi (Respond to Webhook)

- **Node Details:**

  - **Getslot_tool**  
    - Type: Webhook (POST /getslots)  
    - Role: Entry point for availability requests from Vapi.  
    - Input: JSON body with starttime, endtime, and call info.  
    - Output: Passes raw input to "Input Arguments" node.  
    - Edge Cases: Missing or malformed input JSON.

  - **Input Arguments**  
    - Type: Set  
    - Role: Extracts and assigns key variables like starttime, endtime, timezone, call ID, and customer number from webhook payload.  
    - Configuration: Uses expressions to pull data from incoming JSON.  
    - Output: Feeds into "Check Availability".  
    - Edge Cases: Missing or invalid date/time strings.

  - **Check Availability**  
    - Type: Google Calendar (List events)  
    - Role: Queries Google Calendar for events within requested time window.  
    - Configuration: Uses starttime and endtime from input, calendar set to user email.  
    - Output: Event list to "Check if time is available or not".  
    - Edge Cases: Google API auth errors, empty calendar, API rate limits.

  - **Check if time is available or not**  
    - Type: If  
    - Role: Checks if availability flag is true.  
    - Output: If true, goes to "Time available (true) & Call_id"; else to "Get All Calendar Events".  
    - Edge Cases: Unexpected or missing availability flag.

  - **Time available (true) & Call_id**  
    - Type: Set  
    - Role: Packages toolCallId and availability boolean for response.  
    - Output: To "Response".  

  - **Response**  
    - Type: Respond to Webhook  
    - Role: Sends JSON response back to Vapi confirming availability.  

  - **Get All Calendar Events**  
    - Type: Google Calendar (Get All)  
    - Role: Retrieves all events for next week to analyze free slots.  
    - Output: To "Extract start, end and name".  
    - Edge Cases: Large event sets, API limits.

  - **Extract start, end and name**  
    - Type: Set  
    - Role: Extracts and formats event start/end times and summary, adds a sort key.  
    - Output: To "Sort".  

  - **Sort**  
    - Type: Item Lists  
    - Role: Sorts events by start time ascending.  
    - Output: To "Format response".  

  - **Format response**  
    - Type: Item Lists  
    - Role: Concatenates sorted event data into a single list.  
    - Output: To "Available Start Times & Ranges".  

  - **Available Start Times & Ranges**  
    - Type: Code  
    - Role: Core logic to compute available 30-minute slots during business hours, excluding weekends, and detect wide-open ranges (3+ consecutive slots).  
    - Output: JSON with formatted availability strings.  
    - Edge Cases: Invalid date parsing, empty event lists.

  - **Flatten Slots**  
    - Type: Code  
    - Role: Flattens nested slot arrays into a single array for easier processing.  

  - **Enrich Date**  
    - Type: Code  
    - Role: Formats slot start times into human-readable strings in America/Chicago timezone.  

  - **Build Response Payload**  
    - Type: Set  
    - Role: Constructs the final response payload with toolCallId and availability message.  

  - **Convert into Json format for Vapi**  
    - Type: Code  
    - Role: Cleans and formats the availability message string to remove unwanted whitespace and escape characters for Vapi compatibility.  

  - **Response to Vapi**  
    - Type: Respond to Webhook  
    - Role: Sends the cleaned availability message back to Vapi.  

- **Version Requirements:**  
  - Google Calendar nodes require OAuth2 credentials configured in n8n.  
  - Code nodes use JavaScript with Luxon for date/time handling.  
  - n8n version supporting webhook response nodes and item lists (v0.190+ recommended).  

- **Potential Failures:**  
  - Invalid or missing input parameters.  
  - Google Calendar API errors (auth, quota).  
  - Timezone conversion errors.  
  - Empty or malformed calendar events.  

---

#### 1.2 Book Slot

- **Overview:**  
  This block handles booking requests. It validates required inputs (name, email, start/end times, notes), converts times to America/Chicago timezone, creates a Google Calendar event with conferencing enabled, logs booking details to Airtable, and responds to Vapi with confirmation or error messages.

- **Nodes Involved:**  
  - bookslots_tool (Webhook)  
  - Input Arguments from booking tools (Set)  
  - Has all information (If)  
  - Escape Json (Code)  
  - Convert time to CST America / Chicago (Code)  
  - Create Event (Google Calendar)  
  - Booking Payload (Set)  
  - Success Response (Set)  
  - Add Friendly Error (Code)  
  - Error Response (Set)  
  - Respond to Vapi (Respond to Webhook)  
  - Information to be Saved in Airtable (Set)  
  - Logs the confirmed booking details (Airtable)

- **Node Details:**

  - **bookslots_tool**  
    - Type: Webhook (POST /bookslots)  
    - Role: Entry point for booking requests.  
    - Input: JSON with booking details and call info.  

  - **Input Arguments from booking tools**  
    - Type: Set  
    - Role: Extracts booking parameters (name, email, notes, start/end times, title, customer number).  
    - Defaults name to "John Smith" if missing (should be avoided).  

  - **Has all information**  
    - Type: If  
    - Role: Checks if email is valid (using isEmail expression).  
    - True: Proceeds to "Escape Json".  
    - False: Goes to "Build Error Response Payload".  

  - **Escape Json**  
    - Type: Code  
    - Role: Escapes special characters in notes to ensure JSON compatibility.  

  - **Convert time to CST America / Chicago**  
    - Type: Code  
    - Role: Converts start and end times from UTC to America/Chicago timezone using Luxon.  
    - Handles conversion errors gracefully.  

  - **Create Event**  
    - Type: Google Calendar (Create)  
    - Role: Creates calendar event with summary, attendees, description, and Google Meet conferencing.  
    - On error, continues to "Add Friendly Error".  

  - **Booking Payload**  
    - Type: Set  
    - Role: Extracts event details from Google Calendar response for logging and response.  

  - **Success Response**  
    - Type: Set  
    - Role: Builds success response with toolCallId and confirmed status.  

  - **Add Friendly Error**  
    - Type: Code  
    - Role: Converts technical errors (e.g., no available users) into user-friendly messages.  

  - **Error Response**  
    - Type: Set  
    - Role: Builds error response payload with toolCallId and friendly error message.  

  - **Respond to Vapi**  
    - Type: Respond to Webhook  
    - Role: Sends confirmation or error response back to Vapi.  

  - **Information to be Saved in Airtable**  
    - Type: Set  
    - Role: Prepares booking data for Airtable logging, including event ID, attendee info, call ID, and status.  

  - **Logs the confirmed booking details**  
    - Type: Airtable (Create)  
    - Role: Inserts booking record into "Appointments" table.  
    - Requires Airtable credentials and correct base/table setup.  

- **Potential Failures:**  
  - Missing or invalid booking info (email, name, times).  
  - Time conversion failures.  
  - Google Calendar API errors (auth, quota, conflicts).  
  - Airtable API errors or schema mismatches.  

---

#### 1.3 Update Slot

- **Overview:**  
  This block manages appointment rescheduling. It validates inputs (name, email, old and new start/end times), finds the original appointment in Airtable by phone number, updates the Google Calendar event with new times, updates the Airtable record status to "Updated/Rescheduled", and responds with confirmation or error.

- **Nodes Involved:**  
  - Updateslots_tool (Webhook)  
  - Input Arguments from updateslot tool (Set)  
  - Checks if required info is provided. (If)  
  - Finds original appointment (Airtable Search)  
  - Build Error Response Payload2 (Set)  
  - Update Event (Google Calendar)  
  - Updates Airtable record (Airtable Update)  
  - Response & call_id (Set)  
  - Respond to Vapi about Updating slots (Respond to Webhook)

- **Node Details:**

  - **Updateslots_tool**  
    - Type: Webhook (POST /updateslots)  
    - Role: Entry point for update requests.  

  - **Input Arguments from updateslot tool**  
    - Type: Set  
    - Role: Extracts old and new booking times, name, email, call ID, customer number.  

  - **Checks if required info is provided.**  
    - Type: If  
    - Role: Validates presence of name, email, old and new start/end times.  
    - False: Sends error response.  

  - **Finds original appointment**  
    - Type: Airtable (Search)  
    - Role: Searches "Appointments" table by phone number to get event ID.  

  - **Build Error Response Payload2**  
    - Type: Set  
    - Role: Builds error message if required info missing.  

  - **Update Event**  
    - Type: Google Calendar (Update)  
    - Role: Updates event start/end times using event ID from Airtable.  
    - Continues on error to next node.  

  - **Updates Airtable record**  
    - Type: Airtable (Update)  
    - Role: Updates record with new times and status "Updated/Rescheduled".  

  - **Response & call_id**  
    - Type: Set  
    - Role: Prepares response with toolCallId and update status or error.  

  - **Respond to Vapi about Updating slots**  
    - Type: Respond to Webhook  
    - Role: Sends update confirmation or error back to Vapi.  

- **Potential Failures:**  
  - Missing required fields.  
  - Airtable search failure or no matching record.  
  - Google Calendar update failure.  
  - Airtable update failure.  

---

#### 1.4 Cancel Slot

- **Overview:**  
  This block processes appointment cancellations. It validates required inputs (name, email, start time), finds the appointment record by phone number in Airtable, deletes the event from Google Calendar, updates the Airtable record status to "Canceled", and sends confirmation or error response.

- **Nodes Involved:**  
  - CancelSlots_tool (Webhook)  
  - Input Arguments from cancelslot tool (Set)  
  - Checks if required info is provided for cancelation (If)  
  - Finds the appointment record (Airtable Search)  
  - Build Error Response (Set)  
  - Delete Event (Google Calendar)  
  - Update Airtable record (Airtable Update)  
  - Call_id & Response (Set)  
  - Respond to Vapi about cancelation (Respond to Webhook)

- **Node Details:**

  - **CancelSlots_tool**  
    - Type: Webhook (POST /cancelslots)  
    - Role: Entry point for cancellation requests.  

  - **Input Arguments from cancelslot tool**  
    - Type: Set  
    - Role: Extracts cancellation parameters including Cancelnotes, name, email, starttime, call ID, customer number.  

  - **Checks if required info is provided for cancelation**  
    - Type: If  
    - Role: Validates presence of name, email, starttime.  
    - False: Sends error response.  

  - **Finds the appointment record**  
    - Type: Airtable (Search)  
    - Role: Searches "Appointments" table by phone number to get event ID.  

  - **Build Error Response**  
    - Type: Set  
    - Role: Builds error message if required info missing.  

  - **Delete Event**  
    - Type: Google Calendar (Delete)  
    - Role: Deletes event from calendar using event ID.  
    - Continues on error.  

  - **Update Airtable record**  
    - Type: Airtable (Update)  
    - Role: Updates record status to "Canceled".  

  - **Call_id & Response**  
    - Type: Set  
    - Role: Prepares response with toolCallId and cancellation status or error.  

  - **Respond to Vapi about cancelation**  
    - Type: Respond to Webhook  
    - Role: Sends cancellation confirmation or error back to Vapi.  

- **Potential Failures:**  
  - Missing required fields.  
  - Airtable search failure or no matching record.  
  - Google Calendar delete failure.  
  - Airtable update failure.  

---

#### 1.5 Call Results Logging

- **Overview:**  
  This block receives post-call data from Vapi, including call transcript, recording URL, summary, cost, and call metadata. It extracts relevant fields and upserts them into Airtable's "Call Recording" table for record-keeping and analysis.

- **Nodes Involved:**  
  - call_results (Webhook)  
  - All Input Arguments (Set)  
  - Save all information (Airtable Upsert)

- **Node Details:**

  - **call_results**  
    - Type: Webhook (POST /callresults)  
    - Role: Receives call summary and recording details after call ends.  

  - **All Input Arguments**  
    - Type: Set  
    - Role: Extracts transcript, recording URL, summary, cost, call IDs, assistant info, timestamps, and customer number.  

  - **Save all information**  
    - Type: Airtable (Upsert)  
    - Role: Inserts or updates call recording data keyed by call recording ID.  
    - Requires Airtable credentials and correct base/table setup.  

- **Potential Failures:**  
  - Missing or malformed call data.  
  - Airtable API errors.  

---

#### 1.6 Shared Utilities and Error Handling

- **Overview:**  
  This includes nodes used across blocks for input extraction, validation, error message construction, time zone conversion, and response formatting.

- **Key Nodes:**  
  - Escape Json (Code): Escapes special characters in text fields.  
  - Add Friendly Error (Code): Converts technical error messages to user-friendly text.  
  - Build Error Response Payload / Build Error Response Payload2 (Set): Constructs error responses for missing parameters.  
  - Convert time to CST America / Chicago (Code): Converts UTC times to America/Chicago timezone using Luxon.  
  - Various If nodes to validate presence and correctness of required inputs.

- **Potential Failures:**  
  - Expression evaluation errors.  
  - Timezone conversion errors.  
  - Missing or invalid input data causing workflow branches to error.

---

### 3. Summary Table

| Node Name                          | Node Type             | Functional Role                                   | Input Node(s)                        | Output Node(s)                          | Sticky Note                                                                                      |
|-----------------------------------|-----------------------|-------------------------------------------------|------------------------------------|---------------------------------------|------------------------------------------------------------------------------------------------|
| Getslot_tool                      | Webhook               | Entry point for GetSlots requests                | -                                  | Input Arguments                       | # Get Slots                                                                                     |
| Input Arguments                   | Set                   | Extracts input parameters for GetSlots           | Getslot_tool                      | Check Availability                    |                                                                                                |
| Check Availability                | Google Calendar       | Queries calendar events in requested time window | Input Arguments                   | Check if time is available or not     | ## Check Availability                                                                           |
| Check if time is available or not | If                    | Branches based on availability flag               | Check Availability                | Time available (true) & Call_id, Get All Calendar Events |                                                                                                |
| Time available (true) & Call_id   | Set                   | Prepares positive availability response           | Check if time is available or not | Response                            |                                                                                                |
| Response                        | Respond to Webhook    | Sends availability response to Vapi               | Time available (true) & Call_id   | -                                   | ## If time available Respond                                                                    |
| Get All Calendar Events           | Google Calendar       | Retrieves all events for next week                 | Check if time is available or not | Extract start, end and name          | ## Get All Events                                                                               |
| Extract start, end and name       | Set                   | Extracts and formats event details                 | Get All Calendar Events           | Sort                               |                                                                                                |
| Sort                            | Item Lists            | Sorts events by start time                          | Extract start, end and name       | Format response                    |                                                                                                |
| Format response                  | Item Lists            | Concatenates sorted event data                      | Sort                            | Available Start Times & Ranges      |                                                                                                |
| Available Start Times & Ranges    | Code                  | Computes available slots and wide-open ranges      | Format response                  | Flatten Slots                      | ## Get Available Slots                                                                          |
| Flatten Slots                   | Code                  | Flattens nested slot arrays                         | Available Start Times & Ranges    | Enrich Date                      |                                                                                                |
| Enrich Date                    | Code                  | Formats slot times into readable strings            | Flatten Slots                   | Build Response Payload             |                                                                                                |
| Build Response Payload           | Set                   | Builds response payload with toolCallId and result | Enrich Date                    | Convert into Json format for Vapi  |                                                                                                |
| Convert into Json format for Vapi | Code                  | Cleans and formats response message for Vapi       | Build Response Payload           | Response to Vapi                  |                                                                                                |
| Response to Vapi                | Respond to Webhook    | Sends final availability response to Vapi          | Convert into Json format for Vapi | -                               | ## Respond to Vapi                                                                             |
| bookslots_tool                  | Webhook               | Entry point for booking requests                    | -                              | Input Arguments from booking tools | # Book Slot                                                                                   |
| Input Arguments from booking tools | Set                   | Extracts booking parameters                          | bookslots_tool                 | Has all information               |                                                                                                |
| Has all information             | If                    | Validates presence of required booking info         | Input Arguments from booking tools | Escape Json, Build Error Response Payload | Checks if required booking info (email, name, etc.) is provided.                              |
| Escape Json                    | Code                  | Escapes special characters in notes                  | Has all information             | Convert time to CST America / Chicago |                                                                                                |
| Convert time to CST America / Chicago | Code                  | Converts UTC times to America/Chicago timezone       | Escape Json                   | Create Event                    |                                                                                                |
| Create Event                   | Google Calendar       | Creates Google Calendar event                         | Convert time to CST America / Chicago | Booking Payload, Add Friendly Error | Books the appointment in Google Calendar.                                                    |
| Booking Payload               | Set                   | Extracts event details for response and logging      | Create Event                  | Success Response                |                                                                                                |
| Success Response             | Set                   | Builds success confirmation response                  | Booking Payload              | Respond to Vapi                |                                                                                                |
| Add Friendly Error           | Code                  | Converts technical errors to user-friendly messages   | Create Event                 | Error Response               | Handles potential booking errors (e.g., slot taken).                                         |
| Error Response              | Set                   | Builds error response payload                          | Add Friendly Error           | Respond to Vapi                | If info missing, sends error back.                                                           |
| Respond to Vapi             | Respond to Webhook    | Sends booking confirmation or error response          | Success Response, Error Response | -                             | ## Respond to Vapi                                                                             |
| Information to be Saved in Airtable | Set                   | Prepares booking data for Airtable logging            | If the booking is confirmed then true | Logs the confirmed booking details | Logs the confirmed booking details to Airtable.                                              |
| Logs the confirmed booking details | Airtable              | Inserts booking record into Airtable                   | Information to be Saved in Airtable | -                             |                                                                                                |
| Updateslots_tool             | Webhook               | Entry point for update (reschedule) requests           | -                              | Input Arguments from updateslot tool | # Update Slots                                                                              |
| Input Arguments from updateslot tool | Set                   | Extracts update parameters                              | Updateslots_tool             | Checks if required info is provided. |                                                                                                |
| Checks if required info is provided. | If                    | Validates presence of required update info             | Input Arguments from updateslot tool | Finds original appointment, Build Error Response Payload2 | Checks if required info (email, name, old/new times) is provided.                            |
| Finds original appointment    | Airtable              | Searches Airtable for original appointment record      | Checks if required info is provided. | Update Event                  | Finds original appointment in Airtable by phone number.                                    |
| Build Error Response Payload2 | Set                   | Builds error message for missing update info            | Checks if required info is provided. | Response with Error           |                                                                                                |
| Update Event                 | Google Calendar       | Updates Google Calendar event times                      | Finds original appointment    | Updates Airtable record         | Updates the event time in Google Calendar.                                                  |
| Updates Airtable record       | Airtable              | Updates Airtable record with new times and status       | Update Event                 | Response & call_id             | Updates Airtable record with new times & 'Updated' status.                                 |
| Response & call_id           | Set                   | Prepares update confirmation or error response          | Updates Airtable record       | Respond to Vapi about Updating slots |                                                                                                |
| Respond to Vapi about Updating slots | Respond to Webhook    | Sends update confirmation or error back to Vapi          | Response & call_id           | -                             |                                                                                                |
| CancelSlots_tool             | Webhook               | Entry point for cancellation requests                    | -                              | Input Arguments from cancelslot tool | # Cancel Slots                                                                             |
| Input Arguments from cancelslot tool | Set                   | Extracts cancellation parameters                          | CancelSlots_tool             | Checks if required info is provided for cancelation |                                                                                                |
| Checks if required info is provided for cancelation | If                    | Validates presence of required cancellation info         | Input Arguments from cancelslot tool | Finds the appointment record, Build Error Response | Checks if required info (email, name, start time) is provided.                             |
| Finds the appointment record  | Airtable              | Searches Airtable for appointment record                  | Checks if required info is provided for cancelation | Delete Event                  | Finds the appointment record in Airtable by phone number.                                 |
| Build Error Response          | Set                   | Builds error message for missing cancellation info        | Checks if required info is provided for cancelation | Respond with Error           |                                                                                                |
| Delete Event                 | Google Calendar       | Deletes Google Calendar event                              | Finds the appointment record  | Update Airtable record         | Deletes the event from Google Calendar using event ID.                                    |
| Update Airtable record        | Airtable              | Updates Airtable record status to "Canceled"              | Delete Event                 | Call_id & Response            | Updates Airtable record status to 'Canceled'.                                             |
| Call_id & Response           | Set                   | Prepares cancellation confirmation or error response      | Update Airtable record        | Respond to Vapi about cancelation |                                                                                                |
| Respond to Vapi about cancelation | Respond to Webhook    | Sends cancellation confirmation or error back to Vapi      | Call_id & Response           | -                             |                                                                                                |
| call_results                 | Webhook               | Receives post-call summary and recording details           | -                              | All Input Arguments           | # Call Result logs                                                                        |
| All Input Arguments          | Set                   | Extracts call summary, transcript, recording URL, cost     | call_results                | Save all information          |                                                                                                |
| Save all information         | Airtable              | Upserts call recording data into Airtable                   | All Input Arguments          | -                             | Logs call transcript, recording URL, summary, cost, customer number to Airtable.          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node "Getslot_tool"**  
   - HTTP Method: POST  
   - Path: `/getslots`  
   - Response Mode: Response Node  

2. **Create Set Node "Input Arguments"**  
   - Extract from webhook JSON:  
     - `timeZone`: "America/Chicago"  
     - `starttime`: `{{$json.body.message.toolCalls[0].function.arguments.starttime}}`  
     - `endtime`: `{{$json.body.message.toolCalls[0].function.arguments.endtime}}`  
     - `toolCallId`: `{{$json.body.message.toolCalls[0].id}}`  
     - `customer.number`: `{{$json.body.message.call.customer.number}}`  
   - Connect from "Getslot_tool"  

3. **Create Google Calendar Node "Check Availability"**  
   - Operation: List Events  
   - Calendar: Your Google Calendar email  
   - Time Min: `{{$json.starttime.toDateTime()}}`  
   - Time Max: `{{$json.endtime.toDateTime() || $now.plus(1, 'hour').toISO()}}`  
   - Connect from "Input Arguments"  

4. **Create If Node "Check if time is available or not"**  
   - Condition: `$json.available` is true  
   - Connect from "Check Availability"  

5. **Create Set Node "Time available (true) & Call_id"**  
   - Assign:  
     - `body.message.toolCalls[0].id` = `{{$('Input Arguments').item.json.body.message.toolCalls[0].id}}`  
     - `available` = `{{$json.available}}`  
   - Connect from If True branch  

6. **Create Respond to Webhook Node "Response"**  
   - Respond with JSON:  
     ```json
     {
       "results": [
         {
           "toolCallId": "{{ $('Getslot_tool').first().json.body.message.toolCalls[0].id }}",
           "result": "available:{{ $json.available }}"
         }
       ]
     }
     ```  
   - Connect from "Time available (true) & Call_id"  

7. **Create Google Calendar Node "Get All Calendar Events"**  
   - Operation: Get All Events  
   - Calendar: Your Google Calendar email  
   - Time Min: `{{$now.toISO()}}`  
   - Time Max: `{{$now.plus(1, 'week').toISO()}}`  
   - Return All: true  
   - Connect from If False branch of "Check if time is available or not"  

8. **Create Set Node "Extract start, end and name"**  
   - Extract and format event start, end, summary, and add sort key using expressions with Luxon.  
   - Connect from "Get All Calendar Events"  

9. **Create Item Lists Node "Sort"**  
   - Operation: Sort by `sort` ascending  
   - Connect from "Extract start, end and name"  

10. **Create Item Lists Node "Format response"**  
    - Operation: Concatenate all items into one list excluding `sort` field  
    - Connect from "Sort"  

11. **Create Code Node "Available Start Times & Ranges"**  
    - Implement logic to compute available 30-minute slots during business hours, excluding weekends, and detect wide-open ranges.  
    - Connect from "Format response"  

12. **Create Code Node "Flatten Slots"**  
    - Flatten nested slot arrays into a single array.  
    - Connect from "Available Start Times & Ranges"  

13. **Create Code Node "Enrich Date"**  
    - Format slot start times into human-readable strings in America/Chicago timezone.  
    - Connect from "Flatten Slots"  

14. **Create Set Node "Build Response Payload"**  
    - Assign:  
      - `results[0].toolCallId` = `{{$('Input Arguments').item.json.body.message.toolCalls[0].id}}`  
      - `results[0].result` = `{{$json.availableTimes}}`  
    - Connect from "Enrich Date"  

15. **Create Code Node "Convert into Json format for Vapi"**  
    - Clean and format the availability message string for Vapi compatibility (remove newlines, trim spaces).  
    - Connect from "Build Response Payload"  

16. **Create Respond to Webhook Node "Response to Vapi"**  
    - Respond with JSON:  
      ```json
      {
        "results": [
          {
            "toolCallId": "{{ $('Getslot_tool').first().json.body.message.toolCalls[0].id }}",
            "result": "The original time is not available, here are available slots:{{ $json.message }}"
          }
        ]
      }
      ```  
    - Connect from "Convert into Json format for Vapi"  

17. **Create Webhook Node "bookslots_tool"**  
    - HTTP Method: POST  
    - Path: `/bookslots`  
    - Response Mode: Response Node  

18. **Create Set Node "Input Arguments from booking tools"**  
    - Extract booking parameters: name, email, notes, starttime, endtime, Title, customer_number, toolCallId.  
    - Connect from "bookslots_tool"  

19. **Create If Node "Has all information"**  
    - Condition: Check if email is valid (using `.isEmail()` expression).  
    - True: Continue to "Escape Json"  
    - False: Go to "Build Error Response Payload"  

20. **Create Code Node "Escape Json"**  
    - Escape special characters in notes field.  
    - Connect from "Has all information" True branch  

21. **Create Code Node "Convert time to CST America / Chicago"**  
    - Convert starttime and endtime from UTC to America/Chicago timezone using Luxon.  
    - Connect from "Escape Json"  

22. **Create Google Calendar Node "Create Event"**  
    - Create event with converted times, summary, attendees, description, and Google Meet conferencing.  
    - Connect from "Convert time to CST America / Chicago"  

23. **Create Set Node "Booking Payload"**  
    - Extract event details from Google Calendar response.  
    - Connect from "Create Event"  

24. **Create Set Node "Success Response"**  
    - Build success response with toolCallId and "confirmed" status.  
    - Connect from "Booking Payload"  

25. **Create Code Node "Add Friendly Error"**  
    - Convert technical errors to user-friendly messages.  
    - Connect from "Create Event" on error output  

26. **Create Set Node "Error Response"**  
    - Build error response payload with toolCallId and friendly error message.  
    - Connect from "Add Friendly Error"  

27. **Create Respond to Webhook Node "Respond to Vapi"**  
    - Respond with booking confirmation or error.  
    - Connect from "Success Response" and "Error Response"  

28. **Create Set Node "Information to be Saved in Airtable"**  
    - Prepare booking data for Airtable logging.  
    - Connect from "If the booking is confirmed then true" (If node checking success response)  

29. **Create Airtable Node "Logs the confirmed booking details"**  
    - Insert booking record into "Appointments" table.  
    - Connect from "Information to be Saved in Airtable"  

30. **Create Webhook Node "Updateslots_tool"**  
    - HTTP Method: POST  
    - Path: `/updateslots`  
    - Response Mode: Response Node  

31. **Create Set Node "Input Arguments from updateslot tool"**  
    - Extract update parameters including old and new times, name, email, call ID, customer number.  
    - Connect from "Updateslots_tool"  

32. **Create If Node "Checks if required info is provided."**  
    - Validate presence of name, email, old and new times.  
    - True: Continue to "Finds original appointment"  
    - False: Go to "Build Error Response Payload2"  

33. **Create Airtable Node "Finds original appointment"**  
    - Search "Appointments" table by phone number to get event ID.  
    - Connect from "Checks if required info is provided."  

34. **Create Set Node "Build Error Response Payload2"**  
    - Build error message for missing update info.  
    - Connect from "Checks if required info is provided." False branch  

35. **Create Google Calendar Node "Update Event"**  
    - Update event start/end times using event ID.  
    - Connect from "Finds original appointment"  

36. **Create Airtable Node "Updates Airtable record"**  
    - Update record with new times and status "Updated/Rescheduled".  
    - Connect from "Update Event"  

37. **Create Set Node "Response & call_id"**  
    - Prepare update confirmation or error response.  
    - Connect from "Updates Airtable record"  

38. **Create Respond to Webhook Node "Respond to Vapi about Updating slots"**  
    - Send update confirmation or error back to Vapi.  
    - Connect from "Response & call_id"  

39. **Create Webhook Node "CancelSlots_tool"**  
    - HTTP Method: POST  
    - Path: `/cancelslots`  
    - Response Mode: Response Node  

40. **Create Set Node "Input Arguments from cancelslot tool"**  
    - Extract cancellation parameters including Cancelnotes, name, email, starttime, call ID, customer number.  
    - Connect from "CancelSlots_tool"  

41. **Create If Node "Checks if required info is provided for cancelation"**  
    - Validate presence of name, email, starttime.  
    - True: Continue to "Finds the appointment record"  
    - False: Go to "Build Error Response"  

42. **Create Airtable Node "Finds the appointment record"**  
    - Search "Appointments" table by phone number to get event ID.  
    - Connect from "Checks if required info is provided for cancelation"  

43. **Create Set Node "Build Error Response"**  
    - Build error message for missing cancellation info.  
    - Connect from "Checks if required info is provided for cancelation" False branch  

44. **Create Google Calendar Node "Delete Event"**  
    - Delete event from calendar using event ID.  
    - Connect from "Finds the appointment record"  

45. **Create Airtable Node "Update Airtable record"**  
    - Update record status to "Canceled".  
    - Connect from "Delete Event"  

46. **Create Set Node "Call_id & Response"**  
    - Prepare cancellation confirmation or error response.  
    - Connect from "Update Airtable record"  

47. **Create Respond to Webhook Node "Respond to Vapi about cancelation"**  
    - Send cancellation confirmation or error back to Vapi.  
    - Connect from "Call_id & Response"  

48. **Create Webhook Node "call_results"**  
    - HTTP Method: POST  
    - Path: `/callresults`  

49. **Create Set Node "All Input Arguments"**  
    - Extract call transcript, recording URL, summary, cost, call metadata, customer number.  
    - Connect from "call_results"  

50. **Create Airtable Node "Save all information"**  
    - Upsert call recording data into "Call Recording" table keyed by call recording ID.  
    - Connect from "All Input Arguments"  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Context or Link                                                                                           |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| This workflow is optimized for cloud-hosted n8n instances. Self-hosted users should verify webhook and credential setups carefully.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Disclaimer from workflow description                                                                      |
| Duplicate Airtable Base: Use the provided Airtable base template to ensure correct table and field structure.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Airtable base template link (placeholder in description)                                                  |
| Connect Google Calendar and Airtable credentials in n8n before activating the workflow.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Setup instructions                                                                                        |
| Paste the provided system prompt into Vapi Assistant to configure the AI receptionist’s behavior, including business rules, tone, and tool usage guidelines.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Sticky Note7 content                                                                                       |
| Configure Vapi tools with webhook URLs from n8n for Getslots, Bookslots, Updateslots, Cancelslots, and call results.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Setup instructions                                                                                        |
| Video walkthrough available: [🎥 Watch set up video (~2min)](https://www.loom.com/share/d379895004374ddc85dc9171ca37c139?sid=0996f0d2-aff2-45a7-aae9-c62df4fb0799)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Setup video link                                                                                          |
| The workflow enforces business hours (Mon-Fri, 8 AM to 5 PM or 9 AM to 6 PM CST depending on node) and excludes weekends and holidays from booking.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | System prompt and code node logic                                                                         |
| Email validation is performed using n8n expression `.isEmail()`. The workflow requires correct name, email, and timing before proceeding with bookings or updates.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Validation nodes                                                                                          |
| Timezone conversion uses Luxon library to convert UTC input times to America/Chicago timezone, handling errors gracefully.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Code nodes "Convert time to CST America / Chicago"                                                        |
| Error handling includes user-friendly messages for common errors like unavailable slots or missing information, sent back to Vapi for caller feedback.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Add Friendly Error, Build Error Response nodes                                                           |
| Airtable tables used: "Appointments" for bookings and updates, "Call Recording" for call logs. The workflow assumes specific field names and schema; ensure your Airtable base matches these.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Airtable node configurations                                                                              |

---

This comprehensive documentation provides a detailed understanding of the workflow’s structure, logic, and integration points, enabling advanced users and AI agents to reproduce, modify, or troubleshoot the workflow effectively.