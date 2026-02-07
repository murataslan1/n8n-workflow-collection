Automate Real Estate Property Tours with Google Calendar, Slack & Calendly

https://n8nworkflows.xyz/workflows/automate-real-estate-property-tours-with-google-calendar--slack---calendly-6377


# Automate Real Estate Property Tours with Google Calendar, Slack & Calendly

---
### 1. Workflow Overview

This workflow automates the scheduling of real estate property tours by integrating form submissions, scheduling tools, calendar events, email notifications, and team communication platforms. It is designed for real estate agents, agencies, and property managers to efficiently manage tour requests, confirmations, and reminders with minimal manual intervention.

The workflow is divided into two main logical blocks:

**1.1 Property Tour Request & Automated Scheduling**  
- Captures prospect information via a web form.  
- Extracts and prepares prospect and property data.  
- Generates a personalized scheduling link for the prospect using a scheduling service (e.g., Calendly).  
- Sends the scheduling link to the prospect by email.

**1.2 Tour Confirmation & Reminders**  
- Listens for scheduling confirmation webhooks from the scheduling tool.  
- Adds the confirmed tour event to the agent’s Google Calendar.  
- Sends a notification about the new tour to the agent via Slack.  
- Waits until one hour before the tour to send a reminder email to the prospect.

---

### 2. Block-by-Block Analysis

#### Block 1.1: Property Tour Request & Automated Scheduling

**Overview:**  
This block captures initial property tour requests from prospects, extracts relevant details, generates a personalized scheduling link, and sends it to the prospect via email for convenient tour booking.

**Nodes Involved:**  
- 0. Form Trigger (Property Tour Request)  
- 1. Extract Prospect Data  
- 2. Generate Scheduling Link  
- 3. Send Scheduling Link (Gmail)

---

**Node: 0. Form Trigger (Property Tour Request)**  
- **Type:** Form Trigger  
- **Role:** Entry point; triggers workflow when a new form submission is received from the prospect.  
- **Configuration:**  
  - Webhook path: `prospect-tour-request`  
  - Form title: “Property Tour Request”  
  - Form fields: Full Name, Email, Phone Number, Interested Property ID, Property Name (optional)  
- **Expressions:** Receives form data as JSON in the request body.  
- **Connections:** Outputs to “1. Extract Prospect Data” node.  
- **Potential Failures:** Invalid or incomplete form submissions; webhook connectivity issues; missing required fields.  
- **Version:** v1  
- **Notes:** Must integrate this webhook URL into the website form. The form must submit data in JSON format matching expected field labels.

---

**Node: 1. Extract Prospect Data**  
- **Type:** Function  
- **Role:** Parses the raw form data to extract and normalize prospect and property details for downstream usage.  
- **Configuration:**  
  - Reads JSON body from incoming form data.  
  - Extracts: Full Name, Email, Phone Number, Interested Property ID, Property Name (optional).  
  - Defaults Property Name to “Property #[ID]” if not provided.  
- **Expressions:** Uses JavaScript code to safely access fields and prepare clean output JSON.  
- **Connections:** Outputs to “2. Generate Scheduling Link” node.  
- **Potential Failures:** Missing or malformed form fields causing undefined variables; mismatched field names between form and code.  
- **Version:** v1  
- **Notes:** Adjust field names in code if the form field labels change.

---

**Node: 2. Generate Scheduling Link**  
- **Type:** Function  
- **Role:** Builds a personalized scheduling URL for the prospect to book a property tour with the agent.  
- **Configuration:**  
  - Uses a base Calendly (or similar) URL placeholder (`YOUR_CALENDLY_BASE_LINK_FOR_AGENT`).  
  - Adds URL parameters for prospect name, email, and property name to pre-fill scheduling form fields.  
  - Constructs email subject and email body with scheduling link embedded as HTML anchor.  
- **Expressions:** Template literals with `encodeURIComponent` for safe URL parameter encoding.  
- **Connections:** Outputs to “3. Send Scheduling Link (Gmail)” node.  
- **Potential Failures:** Missing or incorrect Calendly base link; URL encoding issues; prospect data missing causing invalid links.  
- **Version:** v1  
- **Notes:** Replace placeholder Calendly link with actual agent’s scheduling URL.

---

**Node: 3. Send Scheduling Link (Gmail)**  
- **Type:** Gmail  
- **Role:** Sends an email to the prospect containing the personalized scheduling link.  
- **Configuration:**  
  - Subject and body dynamically populated from previous function node outputs.  
  - Uses Gmail OAuth2 credentials for authentication.  
  - Recipient email inferred from the extracted prospect email.  
- **Expressions:** Subject: `={{ $json.emailSubject }}`; Body: HTML formatted from previous node.  
- **Connections:** No further nodes connected; end of this branch.  
- **Potential Failures:** Authentication errors; invalid email addresses; Gmail API rate limits or quota issues.  
- **Version:** v1  
- **Notes:** Can be replaced by SMS node for text messaging alternative.

---

#### Block 1.2: Tour Confirmation & Reminders

**Overview:**  
This block handles confirmed tour bookings by listening for webhook notifications, adding events to the agent's calendar, notifying agents via Slack, and sending timely reminders to prospects.

**Nodes Involved:**  
- 4. Webhook: Schedule Confirmation (Waiting for Confirmation)  
- 5. Add Event to Agent's Calendar (Google Calendar)  
- 6. Send Confirmation Notification (Slack to Agent)  
- 7. Wait (For Tour Reminder)  
- 8. Send Tour Reminder (Gmail)

---

**Node: 4. Webhook: Schedule Confirmation (Waiting for Confirmation)**  
- **Type:** Webhook  
- **Role:** Receives webhook callbacks from the scheduling tool (e.g., Calendly) confirming the tour booking.  
- **Configuration:**  
  - Webhook path: `calendly-tour-confirm`  
  - Listens for POST requests with event data from scheduling service.  
- **Expressions:** JSON payload expected to contain event and invitee details.  
- **Connections:** Outputs to “5. Add Event to Agent's Calendar (Google Calendar)” node.  
- **Potential Failures:** Missing webhook calls due to misconfiguration; invalid or incomplete webhook payload; connectivity issues.  
- **Version:** v1  
- **Notes:** Scheduling tool must be configured to send webhook notifications to this endpoint.

---

**Node: 5. Add Event to Agent's Calendar (Google Calendar)**  
- **Type:** Google Calendar  
- **Role:** Creates a calendar event for the confirmed property tour on the agent's Google Calendar.  
- **Configuration:**  
  - Calendar ID must be set to the agent's calendar.  
  - Event details (name, start time, end time, description) dynamically extracted from webhook payload.  
  - Uses Google Calendar OAuth2 credential.  
- **Expressions:** Event properties use expressions like `{{ $json.payload.event.start_time }}` to map webhook data.  
- **Connections:** Outputs to “6. Send Confirmation Notification (Slack to Agent)” node.  
- **Potential Failures:** Authentication errors; invalid calendar ID; malformed event data; API quota limits.  
- **Version:** v1.3  
- **Notes:** Ensure calendar ID and credentials are correctly configured.

---

**Node: 6. Send Confirmation Notification (Slack to Agent)**  
- **Type:** Slack  
- **Role:** Sends a notification message to the agent’s Slack channel informing about the new scheduled tour.  
- **Configuration:**  
  - Slack channel configured (ID or name).  
  - Message text dynamically composed with prospect name, email, property, date/time, and event URL from webhook payload.  
  - Uses OAuth2 Slack credentials.  
- **Expressions:** Uses JS date formatting inside message text for human-readable event time.  
- **Connections:** Outputs to “7. Wait (For Tour Reminder)” node.  
- **Potential Failures:** Slack API auth errors; invalid channel ID; message formatting errors.  
- **Version:** v1  
- **Notes:** Can be switched to email notification if preferred.

---

**Node: 7. Wait (For Tour Reminder)**  
- **Type:** Wait  
- **Role:** Pauses workflow execution until one hour before the scheduled tour start time to trigger reminders.  
- **Configuration:**  
  - Waits until timestamp calculated as 1 hour before `{{ $json.payload.event.start_time }}`.  
  - Timezone must be explicitly configured (e.g., replace placeholder `YOUR_TIMEZONE_LIKE_Asia/Jakarta` with actual timezone).  
- **Expressions:** Uses scheduling event start time from webhook payload.  
- **Connections:** Outputs to “8. Send Tour Reminder (Gmail)” node.  
- **Potential Failures:** Incorrect timezone causing mistimed reminders; missing event time in payload; workflow execution limits on wait duration.  
- **Version:** v1  
- **Notes:** Accurate timezone configuration is critical.

---

**Node: 8. Send Tour Reminder (Gmail)**  
- **Type:** Gmail  
- **Role:** Sends a reminder email to the prospect about the upcoming property tour.  
- **Configuration:**  
  - Subject: `Reminder: Your Property Tour for {{ $json.payload.event.name }}`  
  - Uses Gmail OAuth2 credentials.  
  - Email body can be customized as needed.  
- **Expressions:** Uses event name from webhook payload for subject.  
- **Connections:** End of workflow branch.  
- **Potential Failures:** Authentication errors; email sending failures; invalid prospect email; Gmail API limits.  
- **Version:** v1  
- **Notes:** Can be replaced by SMS node for text reminders.

---

### 3. Summary Table

| Node Name                           | Node Type          | Functional Role                                 | Input Node(s)                 | Output Node(s)                            | Sticky Note                                                                                                                     |
|-----------------------------------|--------------------|------------------------------------------------|------------------------------|------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| 0. Form Trigger (Property Tour Request)  | Form Trigger       | Trigger workflow on tour request form submission | None                         | 1. Extract Prospect Data                  | Must integrate webhook URL into property tour request form; form fields must match expected labels.                             |
| 1. Extract Prospect Data           | Function           | Parse and extract prospect/property data         | 0. Form Trigger              | 2. Generate Scheduling Link               | Adjust variable names to match form field labels precisely.                                                                     |
| 2. Generate Scheduling Link        | Function           | Create personalized scheduling URL and email content | 1. Extract Prospect Data     | 3. Send Scheduling Link (Gmail)           | Replace placeholder Calendly base URL with actual scheduling link.                                                              |
| 3. Send Scheduling Link (Gmail)    | Gmail              | Send scheduling link email to prospect            | 2. Generate Scheduling Link  | None                                     | Select and configure Gmail OAuth2 credentials; can be replaced with SMS node.                                                  |
| 4. Webhook: Schedule Confirmation (Waiting for Confirmation) | Webhook            | Receive scheduling confirmation webhook            | None                         | 5. Add Event to Agent's Calendar          | Scheduling tool must send webhook to this endpoint on booking confirmation.                                                     |
| 5. Add Event to Agent's Calendar (Google Calendar) | Google Calendar    | Add confirmed tour event to agent’s calendar       | 4. Webhook                   | 6. Send Confirmation Notification (Slack to Agent) | Configure calendar ID and Google OAuth2 credentials properly.                                                                    |
| 6. Send Confirmation Notification (Slack to Agent) | Slack              | Notify agent of new scheduled tour                  | 5. Add Event to Agent's Calendar | 7. Wait (For Tour Reminder)                | Replace Slack channel ID/name with actual channel; ensure Slack OAuth2 credentials.                                              |
| 7. Wait (For Tour Reminder)        | Wait               | Wait until 1 hour before tour to send reminder     | 6. Send Confirmation Notification | 8. Send Tour Reminder (Gmail)             | Set correct timezone to avoid mistimed reminders.                                                                                |
| 8. Send Tour Reminder (Gmail)      | Gmail              | Send reminder email to prospect                      | 7. Wait                     | None                                     | Configure Gmail credentials; can be replaced by SMS notification.                                                               |
| Sticky Note                       | Sticky Note        | Workflow overview, instructions, and setup notes   | None                         | None                                     | Contains detailed documentation and setup instructions.                                                                         |
| Sticky Note1                      | Sticky Note        | Marks “Property Tour Request & Automated Scheduling” block | None                         | None                                     |                                                                                                                                |
| Sticky Note2                      | Sticky Note        | Marks “Tour Confirmation & Reminders” block        | None                         | None                                     |                                                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a Form Trigger node:**  
   - Name: `0. Form Trigger (Property Tour Request)`  
   - Set webhook path to `prospect-tour-request`.  
   - Add form fields: Full Name, Email, Phone Number, Interested Property ID, Property Name (optional).  
   - Activate the node (which generates the webhook URL).  
   - Integrate this URL with your website or landing page form that submits JSON data.

3. **Add a Function node:**  
   - Name: `1. Extract Prospect Data`  
   - Connect input from Form Trigger node.  
   - Paste the following JavaScript code to extract form data fields:
   ```javascript
   const formData = items[0].json.body;

   const clientName = formData['Full Name'] || '';
   const clientEmail = formData['Email'] || '';
   const clientPhone = formData['Phone Number'] || '';
   const propertyId = formData['Interested Property ID'] || '';
   const propertyName = formData['Property Name (optional)'] || `Property #${propertyId}`;

   return [
     {
       json: {
         clientName,
         clientEmail,
         clientPhone,
         propertyId,
         propertyName,
       },
     },
   ];
   ```
   - Adjust field names if your form uses different labels.

4. **Add another Function node:**  
   - Name: `2. Generate Scheduling Link`  
   - Connect input from previous function node.  
   - Insert JavaScript code that constructs the scheduling link, subject, and email body:
   ```javascript
   const prospectData = items[0].json;
   const calendlyBaseLink = 'YOUR_CALENDLY_BASE_LINK_FOR_AGENT'; // Replace with your Calendly URL

   const schedulingLink = `${calendlyBaseLink}?name=${encodeURIComponent(prospectData.clientName)}&email=${encodeURIComponent(prospectData.clientEmail)}&a1=${encodeURIComponent(prospectData.propertyName || '')}`;

   return [
     {
       json: {
         ...prospectData,
         schedulingLink,
         emailSubject: `Schedule Your Property Tour for ${prospectData.propertyName}`,
         emailBody: `Hello ${prospectData.clientName},\n\nThank you for your interest in our property: ${prospectData.propertyName}.\n\nPlease use the link below to schedule your property tour at your most convenient time:\n\n<a href="${schedulingLink}">${schedulingLink}</a>\n\nWe look forward to meeting you!\n\nSincerely,\nYour Property Agent Team`,
       },
     },
   ];
   ```
   - Replace `YOUR_CALENDLY_BASE_LINK_FOR_AGENT` with your actual scheduling URL.

5. **Add a Gmail node:**  
   - Name: `3. Send Scheduling Link (Gmail)`  
   - Connect input from the previous function node.  
   - Select OAuth2 Gmail credentials.  
   - Set "To Email" dynamically using expression: `{{$json.clientEmail}}`  
   - Subject: `={{ $json.emailSubject }}`  
   - Body (HTML): `={{ $json.emailBody }}`  
   - Configure sender email address in credentials or node settings.

6. **Add a Webhook node:**  
   - Name: `4. Webhook: Schedule Confirmation (Waiting for Confirmation)`  
   - Set webhook path: `calendly-tour-confirm`  
   - Activate node to generate webhook URL.  
   - Configure your scheduling tool (e.g., Calendly) to send event confirmation webhooks to this URL.

7. **Add a Google Calendar node:**  
   - Name: `5. Add Event to Agent's Calendar (Google Calendar)`  
   - Connect input from the webhook node.  
   - Select Google OAuth2 credentials.  
   - Set calendar ID to your agent's calendar.  
   - Configure event details using webhook payload, for example:  
     - Event Summary: `={{ $json.payload.event.name }}`  
     - Start Date/Time: `={{ $json.payload.event.start_time }}`  
     - End Date/Time: Calculate or use `={{ $json.payload.event.end_time }}` if available.  
     - Description: Include prospect and property details.  
   - Adjust fields to match incoming webhook JSON structure.

8. **Add a Slack node:**  
   - Name: `6. Send Confirmation Notification (Slack to Agent)`  
   - Connect input from Google Calendar node.  
   - Select Slack OAuth2 credentials.  
   - Set Slack channel ID or name where agents receive notifications (e.g., `#tour-bookings`).  
   - Compose message using expressions to include prospect name, email, property, date/time, and event link from webhook payload.

9. **Add a Wait node:**  
   - Name: `7. Wait (For Tour Reminder)`  
   - Connect input from Slack node.  
   - Set wait until timestamp to 1 hour before tour start time:  
     - Use expression: `{{ new Date(new Date($json.payload.event.start_time).getTime() - 60*60*1000).toISOString() }}`  
   - Set correct timezone in node parameters (e.g., `America/New_York`).

10. **Add a Gmail node:**  
    - Name: `8. Send Tour Reminder (Gmail)`  
    - Connect input from Wait node.  
    - Select Gmail OAuth2 credentials.  
    - Set recipient email dynamically from webhook payload (prospect email).  
    - Subject: `Reminder: Your Property Tour for {{ $json.payload.event.name }}`  
    - Body: Customize with reminder message as needed.

11. **Review all nodes and parameters:**  
    - Replace all placeholders (`YOUR_...`) with actual values.  
    - Verify credentials are properly authorized and active.  
    - Save and activate the workflow.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                             | Context or Link                                                                                                           |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| Managing property tours manually leads to lost leads, scheduling conflicts, time consumption, and no-shows. This workflow automates the entire property tour scheduling process to reduce these issues.                                   | Sticky Note documentation attached to the workflow.                                                                       |
| The workflow requires integration with external services: Calendly (or similar), Gmail, Google Calendar, Slack. Proper OAuth2 credentials and webhook configurations are essential for smooth operation.                                 | See setup instructions in detailed sticky note.                                                                            |
| Timezone accuracy in the Wait node is critical to ensure reminders are sent at the correct local time. Always replace the placeholder timezone with your actual timezone.                                                                | Setup step 9 in reproduction instructions.                                                                                  |
| Slack notifications can be replaced with email notifications if preferred by swapping the Slack node with an email node. Similarly, emails can be replaced with SMS by integrating Twilio or similar SMS services.                        | Flexible communication channel options noted in node analysis.                                                             |
| For detailed setup, testing, and troubleshooting, use the n8n execution logs and “Test Workflow” feature after submitting sample form entries and scheduling events to verify data flow and expressions.                                  | Best practices for workflow validation.                                                                                    |
| This workflow is designed for real estate professionals aiming to enhance client experience and operational efficiency by automating repetitive tasks in property tour scheduling.                                                       | Workflow purpose and target audience.                                                                                       |

---

**Disclaimer:**  
The provided content originates exclusively from an automated workflow created with n8n, a workflow automation tool. It complies fully with current content policies and contains no illegal, offensive, or protected material. All processed data is legal and public.