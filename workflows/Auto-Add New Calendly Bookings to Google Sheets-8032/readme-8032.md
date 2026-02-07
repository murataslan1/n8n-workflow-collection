Auto-Add New Calendly Bookings to Google Sheets

https://n8nworkflows.xyz/workflows/auto-add-new-calendly-bookings-to-google-sheets-8032


# Auto-Add New Calendly Bookings to Google Sheets

---

### 1. Workflow Overview

This workflow is designed to automatically capture new Calendly bookings and log their details into a Google Sheets spreadsheet. It targets users who want to maintain a live, accessible record of their Calendly event invitees with structured data for further processing, reporting, or integrations.

The workflow is logically divided into the following blocks:

- **1.1 Setup & Input Reception:** Receives incoming booking data via a webhook triggered by Calendly's invitee.created event.
- **1.2 Data Normalization:** Processes and normalizes the raw webhook payload into a structured format suitable for storage.
- **1.3 Data Persistence:** Appends or updates the normalized booking information into a Google Sheets document.
- **1.4 Logging & Optional Notification:** Logs a summary of the successful data insertion and suggests potential next actions such as notification or calendar integration.

---

### 2. Block-by-Block Analysis

#### 1.1 Setup & Input Reception

- **Overview:** This block provides setup instructions for users and receives incoming booking data through a webhook endpoint configured for Calendly's invitee.created event.
- **Nodes Involved:**  
  - Setup Instructions (Sticky Note)  
  - Calendly Booking Webhook (Webhook Node)

##### Node Details

- **Setup Instructions**  
  - *Type & Role:* Sticky Note; provides user-facing setup guidance.  
  - *Configuration:* Static content detailing required Google Sheet structure, webhook setup steps in Calendly, and Google Sheets OAuth connection.  
  - *Connections:* None (informational only).  
  - *Edge Cases:* None (no execution).  

- **Calendly Booking Webhook**  
  - *Type & Role:* Webhook Node; receives HTTP POST requests from Calendly when a new booking is created.  
  - *Configuration:*  
    - HTTP Method: POST  
    - Path: `/calendly-booking`  
  - *Input:* Incoming webhook payload from Calendly.  
  - *Output:* Passes webhook JSON data to the next node.  
  - *Edge Cases:*  
    - Webhook URL misconfiguration or network issues could cause missed events.  
    - Payload variations depending on Calendly API version could raise parsing errors downstream.  
  - *Version Requirements:* n8n webhook node, no special version constraints.  

---

#### 1.2 Data Normalization

- **Overview:** Transforms the raw webhook payload into a clean, consistent JSON object containing key booking details, including contact info, event type, timing, and custom form responses.
- **Nodes Involved:**  
  - Normalize Booking Data (Code Node)

##### Node Details

- **Normalize Booking Data**  
  - *Type & Role:* Code Node; executes JavaScript to parse and normalize incoming data.  
  - *Configuration Highlights:*  
    - Extracts nested properties like invitee name, email, phone, event type, start/end times, and custom questions/answers.  
    - Handles multiple webhook payload structures for backward compatibility.  
    - Computes duration in minutes and formats date/time strings.  
    - Logs key normalized values for debugging purposes.  
  - *Key Expressions/Variables:*  
    - `webhookData`, `payload`, `event`, `invitee`, `eventType` for data extraction.  
    - `questions` array for custom form parsing.  
    - Output JSON object with fields: name, email, phone, event_type, date, time, status, meeting_link, notes, duration, timezone, booking_created, calendly_event_id, invitee_id.  
  - *Input:* Raw webhook JSON.  
  - *Output:* Normalized JSON booking object.  
  - *Edge Cases:*  
    - Missing or unexpected payload fields may result in default values like 'Unknown' or empty strings.  
    - Incorrect date formats or timezone info could cause inaccurate time extraction.  
    - Custom question parsing assumes certain keywords; variations may miss phone or notes fields.  
  - *Version Requirements:* Uses n8n Code node version 2 syntax.  

---

#### 1.3 Data Persistence

- **Overview:** Appends or updates the normalized booking data into a designated Google Sheets spreadsheet for persistent record-keeping.
- **Nodes Involved:**  
  - Save Booking to Sheets (Google Sheets Node)

##### Node Details

- **Save Booking to Sheets**  
  - *Type & Role:* Google Sheets Node; performs append or update operation on a spreadsheet row.  
  - *Configuration Highlights:*  
    - Operation: `appendOrUpdate` — appends new row or updates existing based on key column(s).  
    - Sheet Name: `Sheet1` (configurable).  
    - Document ID: User must replace `YOUR_GOOGLE_SHEET_ID` with their actual Google Sheets document ID.  
    - Columns expected (per setup note): Name, Email, Phone, Event Type, Date, Time, Status, Meeting Link, Notes.  
  - *Input:* Normalized booking JSON.  
  - *Output:* Success status and appended/updated row metadata.  
  - *Edge Cases:*  
    - Incorrect or missing Google Sheets credentials can cause authentication errors.  
    - Invalid document ID or sheet name will cause operation failure.  
    - Append/update conflicts if key columns are misconfigured or duplicated.  
  - *Version Requirements:* Google Sheets node version 4 or later recommended.  
  - *Credentials:* Requires OAuth2 credentials for Google account with Sheets API enabled.  

---

#### 1.4 Logging & Optional Notification

- **Overview:** Logs a confirmation message about the successful booking save, provides a summary, and suggests possible next steps such as sending confirmation emails or calendar invites.
- **Nodes Involved:**  
  - Log Booking Success (Code Node)

##### Node Details

- **Log Booking Success**  
  - *Type & Role:* Code Node; logs booking details and returns a summary JSON.  
  - *Configuration Highlights:*  
    - Prints booking name, event type, email, and scheduled time to n8n console.  
    - Constructs a summary object with success status and next recommended actions.  
    - Comments note potential extension points for email or Slack notifications.  
  - *Input:* Output from Google Sheets node (booking data).  
  - *Output:* JSON summary with success flag and action suggestions.  
  - *Edge Cases:* Minimal risk; failure could occur if input JSON is malformed.  
  - *Version Requirements:* n8n Code node version 2 syntax.  

---

### 3. Summary Table

| Node Name               | Node Type        | Functional Role                | Input Node(s)             | Output Node(s)          | Sticky Note                                                                                                              |
|-------------------------|------------------|-------------------------------|---------------------------|-------------------------|--------------------------------------------------------------------------------------------------------------------------|
| Setup Instructions      | Sticky Note      | User setup guidance            | —                         | —                       | 📅 **SETUP REQUIRED:** Create Google Sheet with headers; configure Calendly webhook; connect Google Sheets OAuth.        |
| Calendly Booking Webhook | Webhook          | Receive new booking webhook    | —                         | Normalize Booking Data   | 📅 **SETUP REQUIRED:** Create Google Sheet with headers; configure Calendly webhook; connect Google Sheets OAuth.        |
| Normalize Booking Data  | Code             | Normalize Calendly booking data| Calendly Booking Webhook  | Save Booking to Sheets   |                                                                                                                          |
| Save Booking to Sheets  | Google Sheets    | Append or update booking data  | Normalize Booking Data    | Log Booking Success      |                                                                                                                          |
| Log Booking Success     | Code             | Log confirmation and summary   | Save Booking to Sheets    | —                       |                                                                                                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Sticky Note Node**  
   - Name: `Setup Instructions`  
   - Content: Provide instructions for users to create a Google Sheet with columns: Name, Email, Phone, Event Type, Date, Time, Status, Meeting Link, Notes. Include steps to set up Calendly webhook and Google Sheets OAuth credentials.  
   - Position: Top-left for visibility.  

2. **Create a Webhook Node**  
   - Name: `Calendly Booking Webhook`  
   - HTTP Method: POST  
   - Path: `calendly-booking` (this is the webhook endpoint)  
   - Position: Below Setup Instructions  
   - No credentials needed.  

3. **Create a Code Node for Normalization**  
   - Name: `Normalize Booking Data`  
   - Language: JavaScript  
   - Code: Implement logic to parse the incoming webhook JSON, extract invitee name, email, phone (from custom questions), event type, date/time, status, meeting link, notes, duration, timezone, and IDs. Use defensive programming to handle missing fields.  
   - Position: To the right of Webhook node  
   - Connect input from `Calendly Booking Webhook` node.  

4. **Create a Google Sheets Node to Save Data**  
   - Name: `Save Booking to Sheets`  
   - Operation: `Append or Update`  
   - Sheet Name: `Sheet1` (or your target sheet)  
   - Document ID: Replace `YOUR_GOOGLE_SHEET_ID` with your actual Google Sheets file ID  
   - Credentials: Connect with Google OAuth2 credentials authorized to access the target sheet  
   - Position: To the right of Normalize Booking Data  
   - Connect input from `Normalize Booking Data` node.  

5. **Create a Code Node for Logging Success**  
   - Name: `Log Booking Success`  
   - Language: JavaScript  
   - Code: Log booking name, event type, email, and time for confirmation. Return JSON summary with success flag and recommended next actions such as sending confirmation emails or integrating with calendars.  
   - Position: To the right of Save Booking to Sheets  
   - Connect input from `Save Booking to Sheets`.  

6. **Connect all nodes in order:**  
   - `Calendly Booking Webhook` → `Normalize Booking Data` → `Save Booking to Sheets` → `Log Booking Success`  
   - Setup Instructions node stands alone for user guidance.

7. **Deploy the workflow and copy the webhook URL from the `Calendly Booking Webhook` node.**  
   - Configure Calendly webhook integration with this URL and select the `invitee.created` event.  

8. **Test the workflow by creating a new booking in Calendly.**  
   - Verify data is appended to Google Sheets and logs appear in n8n console.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                  | Context or Link                                                                                               |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Calendly webhook event type used is `invitee.created` to capture new bookings in real time.                                                                                   | Calendly API Webhooks documentation: https://developer.calendly.com/api-docs/webhooks                      |
| Google Sheets OAuth2 credentials must have Sheets API enabled with appropriate scopes for read/write access.                                                                  | Google Cloud Console documentation on OAuth2 and Sheets API                                                  |
| The workflow supports custom question parsing but keywords like "phone", "note", "comment", and "message" are case-insensitive and basic; adjust code for other languages or fields. | Customization hint for diverse Calendly forms                                                                |
| Logging node can be extended to integrate with email, Slack, or calendar services to complete booking workflows.                                                              | n8n integrations for email and Slack                                                                         |
| Replace placeholder `YOUR_GOOGLE_SHEET_ID` in the Google Sheets node with your actual spreadsheet ID before activating the workflow.                                          | Google Sheets document ID found in the sheet URL                                                             |

---

**Disclaimer:** The provided text is generated exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects applicable content policies and contains no illegal, offensive, or protected elements. All data processed is legal and publicly accessible.