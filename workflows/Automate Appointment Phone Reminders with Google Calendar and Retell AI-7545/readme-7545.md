Automate Appointment Phone Reminders with Google Calendar and Retell AI

https://n8nworkflows.xyz/workflows/automate-appointment-phone-reminders-with-google-calendar-and-retell-ai-7545


# Automate Appointment Phone Reminders with Google Calendar and Retell AI

### 1. Workflow Overview

This workflow automates appointment phone reminders by integrating Google Calendar with Retell AI’s phone call API. It is designed for businesses, clinics, or service providers who want to automatically call customers to remind them about upcoming appointments.

The workflow consists of the following logical blocks:

- **1.1 Scheduled Trigger**: Runs the workflow daily at a configured time (default 9 AM).
- **1.2 Calendar Event Retrieval**: Fetches all upcoming Google Calendar events within the next 12 hours.
- **1.3 Appointment Detail Extraction**: Parses event descriptions to extract customer details required for the call.
- **1.4 Configuration Setup**: Loads Retell AI configuration parameters (phone number and agent ID) to be used in the call.
- **1.5 API Call to Retell AI**: Sends an HTTP request to Retell AI to initiate the phone call reminder using dynamic appointment variables.

The workflow is linear, triggered by the schedule, progressing through event retrieval, data extraction, configuration injection, and finally the API call.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger

- **Overview:** Initiates the workflow automatically every day at 9 AM (configurable).
- **Nodes Involved:** `Schedule Trigger (9 AM)`, `Sticky Note` (explanatory)
- **Node Details:**

  - **Schedule Trigger (9 AM)**
    - *Type:* Schedule Trigger
    - *Role:* Starts workflow daily at a specific hour.
    - *Config:* Set to trigger at 9:00 AM every day.
    - *Inputs:* None (trigger node).
    - *Outputs:* Triggers `Get Upcoming Events`.
    - *Edge Cases:* If n8n server downtime occurs during the trigger time, the execution may be skipped.
    - *Sticky Note:* Explains how to change trigger time.

#### 1.2 Calendar Event Retrieval

- **Overview:** Retrieves all Google Calendar events scheduled within the next 12 hours from a specified calendar.
- **Nodes Involved:** `Get Upcoming Events`, `Sticky Note1`
- **Node Details:**

  - **Get Upcoming Events**
    - *Type:* Google Calendar node
    - *Role:* Fetch all events from the configured calendar within the next 12 hours.
    - *Config:* 
      - Calendar: User’s calendar email (replace placeholder).
      - TimeMax: Current time + 12 hours.
      - Operation: Get all events.
      - Return all events.
    - *Inputs:* Triggered by `Schedule Trigger (9 AM)`.
    - *Outputs:* Passes event data to `Extract Appointment Details`.
    - *Credentials:* Requires Google Calendar OAuth2 credentials.
    - *Edge Cases:* 
      - Credential expiration or revocation.
      - No events found results in empty output.
      - Permission issues on calendar access.

#### 1.3 Appointment Detail Extraction

- **Overview:** Parses each event’s description field to extract appointment-specific details such as customer name, phone number, reason for appointment, and event start/end times.
- **Nodes Involved:** `Extract Appointment Details`, `Sticky Note2`
- **Node Details:**

  - **Extract Appointment Details**
    - *Type:* Code Node (JavaScript)
    - *Role:* Extract structured data from event descriptions.
    - *Config:* Custom JS code:
      - Normalizes newlines.
      - Splits multiple bookings if present.
      - Uses regex to extract fields: Name, Email (optional), Phone Number, Reason.
      - Extracts event start and end times from calendar event.
    - *Inputs:* Receives event data from `Get Upcoming Events`.
    - *Outputs:* Outputs an array of appointment objects with extracted fields.
    - *Edge Cases:*
      - Missing or malformed description fields.
      - Phone numbers not in E.164 format may cause downstream issues.
      - Empty or missing description leads to empty extraction.
    - *Sticky Note:* Specifies expected description format and example.

#### 1.4 Configuration Setup

- **Overview:** Provides Retell AI configuration parameters required for the API call, including the “from” phone number and the agent identifier.
- **Nodes Involved:** `Set Config (Retell Setup)`, `Sticky Note3`
- **Node Details:**

  - **Set Config (Retell Setup)**
    - *Type:* Set Node
    - *Role:* Sets static configuration variables for Retell AI.
    - *Config:* 
      - `from_number`: Your registered Retell phone number (placeholder to be replaced).
      - `agent_id`: Your Retell agent ID (placeholder to be replaced).
    - *Inputs:* Receives appointment details from `Extract Appointment Details`.
    - *Outputs:* Passes data to `Send Reminder Call ( Retell Api)`.
    - *Edge Cases:* If values are not updated, API calls will fail.
    - *Sticky Note:* Instructions to update these values before use.

#### 1.5 API Call to Retell AI

- **Overview:** Sends a POST request to Retell AI’s API to initiate an automated phone call reminder, passing extracted appointment and configuration details as dynamic variables.
- **Nodes Involved:** `Send Reminder Call ( Retell Api)`, `Sticky Note4`
- **Node Details:**

  - **Send Reminder Call ( Retell Api)**
    - *Type:* HTTP Request Node
    - *Role:* Issues the API call to Retell AI’s endpoint for creating a phone call.
    - *Config:*
      - URL: `https://api.retellai.com/v2/create-phone-call`
      - Method: POST
      - Authentication: HTTP Header Auth with Retell API credentials stored securely in n8n.
      - Request Body: JSON with fields:
        - `from_number`: From `Set Config`.
        - `to_number`: Extracted phone number.
        - `retell_llm_dynamic_variables`: Object with name, phone_number, reason, start_time, end_time.
        - `override_agent_id`: Agent ID from config.
      - Headers: Content-Type application/json.
    - *Inputs:* Receives configuration and appointment details from `Set Config (Retell Setup)`.
    - *Outputs:* API response (not connected further).
    - *Credentials:* Uses Retell AI API key stored securely in n8n credentials.
    - *Edge Cases:* 
      - Authentication failure if credentials are invalid.
      - API rate limits or timeouts.
      - Missing or invalid phone number format.
      - Network errors.
    - *Sticky Note:* Emphasizes use of credentials instead of hardcoding and explains dynamic variables.

---

### 3. Summary Table

| Node Name                     | Node Type          | Functional Role               | Input Node(s)               | Output Node(s)           | Sticky Note                                                                                                               |
|-------------------------------|--------------------|------------------------------|-----------------------------|--------------------------|---------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger (9 AM)        | Schedule Trigger   | Starts workflow daily at 9 AM | None                        | Get Upcoming Events       | This node triggers the workflow every day at 9 AM. You can change the trigger time in the settings if you want calls at a different hour. |
| Get Upcoming Events            | Google Calendar    | Fetch upcoming events         | Schedule Trigger (9 AM)      | Extract Appointment Details | This node fetches all events from your Google Calendar in the next 12 hours. Replace the calendar email with your own calendar. Make sure your Google Calendar OAuth2 credential is connected. |
| Extract Appointment Details    | Code Node          | Parse event descriptions      | Get Upcoming Events          | Set Config (Retell Setup) | This Code node extracts: - Name - Phone number - Reason - Start and End time ➡️ These fields must be present in the Google Calendar event description. ➡️ Example description format: Name: John Doe Phone Number: +14155552671 Reason: Consultation |
| Set Config (Retell Setup)      | Set Node           | Load Retell AI config         | Extract Appointment Details  | Send Reminder Call ( Retell Api) | This node stores your Retell setup: - from_number (your registered Retell number) - agent_id (your Retell agent ID) ➡️ Update these values before using the workflow. ➡️ They will be passed to the Retell API. |
| Send Reminder Call ( Retell Api) | HTTP Request       | Call Retell AI API            | Set Config (Retell Setup)    | None                     | This node sends the API request to Retell AI to make the phone call. -It uses your Retell API key stored in n8n credentials. -Do NOT hardcode your API key — always use credentials. -The call includes dynamic variables: name, phone, reason, start_time, end_time. |
| Sticky Note                   | Sticky Note        | Explanation for trigger       | None                        | None                     | This node triggers the workflow every day at 9 AM. You can change the trigger time in the settings if you want calls at a different hour. |
| Sticky Note1                  | Sticky Note        | Explanation for calendar node | None                        | None                     | This node fetches all events from your Google Calendar in the next 12 hours. Replace the calendar email with your own calendar. Make sure your Google Calendar OAuth2 credential is connected. |
| Sticky Note2                  | Sticky Note        | Explanation for code node     | None                        | None                     | This Code node extracts: - Name - Phone number - Reason - Start and End time ➡️ These fields must be present in the Google Calendar event description. ➡️ Example description format: Name: John Doe Phone Number: +14155552671 Reason: Consultation |
| Sticky Note3                  | Sticky Note        | Explanation for config node   | None                        | None                     | This node stores your Retell setup: - from_number (your registered Retell number) - agent_id (your Retell agent ID) ➡️ Update these values before using the workflow. |
| Sticky Note4                  | Sticky Note        | Explanation for API call node | None                        | None                     | This node sends the API request to Retell AI to make the phone call. -It uses your Retell API key stored in n8n credentials. -Do NOT hardcode your API key — always use credentials. -The call includes dynamic variables: name, phone, reason, start_time, end_time. |
| Sticky Note5                  | Sticky Note        | General workflow overview     | None                        | None                     | ## Appointment Reminder Agent ### Who's it for Businesses, clinics, and service providers who want to automate **phone call reminders** for upcoming appointments. ### How it works This workflow: 1. Runs daily at 9 AM (can be changed). 2. Pulls upcoming events from Google Calendar. 3. Extracts details (name, phone, reason, time). 4. Calls the customer using Retell AI’s API. ### How to set up 1. Add your **Retell API key** in n8n credentials (do not hardcode). 2. Add your **Google Calendar account** in credentials. 3. Update the `from_number` (your Retell-registered number). 4. Update the `agent_id` (your Retell agent ID). 5. Ensure phone numbers are in **E.164 format** (e.g. `+14155552671`). ### Requirements - Retell AI account + API key  - Registered Retell phone number  - Google Calendar account  ### How to customize - Adjust trigger time.  - Add logging (Google Sheets / Airtable).  - Modify Retell agent script for different appointment types. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n and name it appropriately (e.g., "Appointment Reminder Agent").**

2. **Add a Schedule Trigger node:**
   - Name: `Schedule Trigger (9 AM)`
   - Type: Schedule Trigger
   - Set the trigger to run daily at 9:00 AM (adjust hour as needed).
   - No credentials needed.

3. **Add a Google Calendar node:**
   - Name: `Get Upcoming Events`
   - Type: Google Calendar
   - Operation: Get All
   - Calendar: Enter your calendar email address.
   - TimeMax: Use expression `{{$now.plus(12, 'hours')}}` to get events up to 12 hours from now.
   - Return all events: True
   - Connect input to `Schedule Trigger (9 AM)` output.
   - Credentials: Connect Google Calendar OAuth2 credentials.

4. **Add a Code node:**
   - Name: `Extract Appointment Details`
   - Type: Code
   - Language: JavaScript
   - Paste the following code (adapted for n8n v2):

```javascript
return items.flatMap(item => {
  const description = item.json.description || "";
  const cleaned = description.replace(/\r?\n/g, '\n').trim();
  const bookings = cleaned.split(/\n\s*\n/);

  return bookings.map(booking => {
    const flat = booking.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ');
    const nameMatch = flat.match(/Name:\s*(.+?)(?=\s+[A-Za-z]+:|$)/i);
    const emailMatch = flat.match(/Email:\s*(.+?)(?=\s+[A-Za-z]+:|$)/i);
    const phoneMatch = flat.match(/Phone Number:\s*(.+?)(?=\s+[A-Za-z]+:|$)/i);
    const reasonMatch = flat.match(/Reason:\s*(.+?)(?=\s+[A-Za-z]+:|$)/i);

    return {
      json: {
        name: nameMatch ? nameMatch[1].trim() : "",
        email: emailMatch ? emailMatch[1].trim() : "",
        phone: phoneMatch ? phoneMatch[1].trim() : "",
        reason: reasonMatch ? reasonMatch[1].trim() : "",
        startTime: item.json.start?.dateTime || "",
        endTime: item.json.end?.dateTime || ""
      }
    };
  });
});
```

   - Connect input from `Get Upcoming Events`.

5. **Add a Set node:**
   - Name: `Set Config (Retell Setup)`
   - Type: Set
   - Add two string fields:
     - `from_number`: Set to your Retell-registered phone number (e.g., `+14155552671`).
     - `agent_id`: Set to your Retell agent ID.
   - Connect input from `Extract Appointment Details`.

6. **Add an HTTP Request node:**
   - Name: `Send Reminder Call ( Retell Api)`
   - Type: HTTP Request
   - HTTP Method: POST
   - URL: `https://api.retellai.com/v2/create-phone-call`
   - Authentication: HTTP Header Auth
     - Create credentials with your Retell AI API key (do **not** hardcode in the node).
   - Headers:
     - `Content-Type`: `application/json`
   - Body Content Type: JSON
   - Body Parameters (use expression mode where necessary):
```json
{
  "from_number": "{{ $json.from_number }}",
  "to_number": "{{ $json.phone }}",
  "retell_llm_dynamic_variables": {
    "name": "{{ $json.name }}",
    "phone_number": "{{ $json.phone }}",
    "reason": "{{ $json.reason }}",
    "start_time": "{{ $json.startTime }}",
    "end_time": "{{ $json.endTime }}"
  },
  "override_agent_id": "{{ $json.agent_id }}"
}
```
   - Connect input from `Set Config (Retell Setup)`.

7. **Verify all connections:**
   - `Schedule Trigger (9 AM)` → `Get Upcoming Events`
   - `Get Upcoming Events` → `Extract Appointment Details`
   - `Extract Appointment Details` → `Set Config (Retell Setup)`
   - `Set Config (Retell Setup)` → `Send Reminder Call ( Retell Api)`

8. **Credentials Setup:**
   - Set up Google Calendar OAuth2 credentials with appropriate scopes.
   - Create HTTP Header Auth credentials in n8n with your Retell AI API key.

9. **Update placeholders:**
   - Replace `from_number` and `agent_id` in `Set Config (Retell Setup)` with your actual Retell account data.
   - Replace calendar email in `Get Upcoming Events`.

10. **Test:**
    - Run the workflow manually or wait for scheduled trigger.
    - Confirm that calls are placed successfully and data is extracted correctly.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Context or Link                                                                                  |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| This workflow automates phone call reminders by leveraging Retell AI’s API and Google Calendar events. It assumes event descriptions follow a strict format with fields like Name, Phone Number, and Reason. Phone numbers must be in E.164 format (e.g., +14155552671) for proper dialing. Ensure credentials for both Google Calendar and Retell AI are configured securely in n8n. You can adjust the daily trigger time or extend functionality with logging or alternative notification methods. | Workflow description and customization notes                                                    |
| Retell AI API documentation and credential setup: https://docs.retellai.com/                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Retell AI official docs                                                                           |
| Google Calendar OAuth2 setup guide: https://developers.google.com/calendar/api/quickstart/js                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Google Calendar API documentation                                                               |
| Example description format for Google Calendar event to be parsed by the workflow: <br> Name: John Doe <br> Phone Number: +14155552671 <br> Reason: Consultation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Description format requirement for appointment extraction                                        |
| Do NOT hardcode API keys in HTTP Request nodes; always use n8n credentials to protect sensitive data.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Security best practice                                                                           |

---

This documentation fully describes the automated appointment reminder workflow, enabling advanced users or automation agents to understand, reproduce, and maintain it effectively.