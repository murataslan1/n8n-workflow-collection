Automate Client Lifecycle: Lead Intake to Onboarding with Airtable, Notion & Google Calendar

https://n8nworkflows.xyz/workflows/automate-client-lifecycle--lead-intake-to-onboarding-with-airtable--notion---google-calendar-11586


# Automate Client Lifecycle: Lead Intake to Onboarding with Airtable, Notion & Google Calendar

### 1. Workflow Overview

This workflow automates the entire client lifecycle for an agency, from lead intake through booking to payment and onboarding, integrating Airtable, Notion, Google Calendar, Slack, Gmail, and optional services like Clearbit and Twilio WhatsApp Business API. It is designed to streamline client management, scheduling, reminders, and client onboarding automation.

The workflow is logically divided into four main blocks:

- **1.1 Lead Capture & Enrichment:** Captures new leads via webhook from a website form, enriches data optionally with Clearbit, creates initial records in Airtable and Notion, and notifies the internal team via Slack.

- **1.2 Booking Automation:** Listens for calendar booking events (e.g., from Calendly) via webhook, validates the booking data, updates lead status in Airtable and Notion, creates Google Calendar events, sends a pre-call survey email to clients, and notifies Slack.

- **1.3 Daily Reminders (Cron Job):** Runs a scheduled daily check to find upcoming calls within 24 hours from Airtable and sends reminder emails to clients to reduce no-shows.

- **1.4 Payment & Onboarding:** Triggered by successful Stripe payment webhook, validates payment data, marks the lead as paid in Airtable, creates a personalized onboarding checklist in Notion, sends welcome emails and optional WhatsApp messages, logs transactions in a financial table, and notifies Slack.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Lead Capture & Enrichment

**Overview:**  
This block handles intake of new lead data from a web form webhook, performs optional data enrichment using Clearbit, creates corresponding Airtable and Notion records, and notifies the team in Slack. It also sends an auto-reply email to the lead confirming receipt.

**Nodes Involved:**  
- Webhook Trigger1 (lead-intake)  
- Validate Data (If)  
- Enrich with Clearbit (Optional)  
- Create Airtable Record  
- Create Notion Project Page  
- Send Slack Notification  
- Send Auto-Reply Email  
- Respond Success1  
- Respond Error1  
- Log Error to Slack  

**Node Details:**

- **Webhook Trigger1**  
  - Type: Webhook  
  - Role: Entry point for lead intake via HTTP POST at path `/lead-intake`  
  - Config: POST method, responds with JSON  
  - Connections: Output to Validate Data  
  - Edge Cases: Missing or malformed payload  

- **Validate Data**  
  - Type: If  
  - Role: Ensures required fields `email` and `name` are present and non-empty  
  - Config: String conditions checking `$json.email` and `$json.name`  
  - Connections: True → Enrich with Clearbit, False → Respond Error1  
  - Edge Cases: Missing fields cause error response  

- **Enrich with Clearbit (Optional)**  
  - Type: HTTP Request  
  - Role: Calls Clearbit API to enrich lead data by email (optional)  
  - Config: GET request to `https://api.clearbit.com/v2/people/find` with email query param, uses HTTP header authentication with Clearbit API key credential  
  - Connections: Output → Create Airtable Record  
  - Edge Cases: API errors, timeouts; continues on failure  

- **Create Airtable Record**  
  - Type: Airtable  
  - Role: Adds a new lead record to `tblLeads` table  
  - Config: Append operation, mapping input fields from JSON  
  - Connections: Output → Create Notion Project Page  
  - Edge Cases: API rate limits, authentication errors, retries enabled  

- **Create Notion Project Page**  
  - Type: Notion  
  - Role: Creates a new page in Notion projects database with lead info  
  - Config: Title formatted as `"Name - Company or Lead"`, target database ID set via parameter, includes UI blocks for content  
  - Connections: Output → Send Slack Notification  
  - Edge Cases: API errors, invalid database ID, retries enabled  

- **Send Slack Notification**  
  - Type: Slack (Incoming Webhook)  
  - Role: Notifies internal team about new lead intake with details and link to Notion page  
  - Config: Message template with lead details and Notion page URL, webhook URL configured via credentials  
  - Connections: Output → Send Auto-Reply Email  
  - Edge Cases: Slack webhook failures, rate limits  

- **Send Auto-Reply Email**  
  - Type: Gmail  
  - Role: Sends an automated email to the lead confirming receipt and inviting to schedule a call  
  - Config: Sends to lead's email, plain text message with customizable company/project placeholders, Gmail OAuth2 credentials used  
  - Connections: Output → Respond Success1  
  - Edge Cases: Email sending failures, invalid email addresses  

- **Respond Success1**  
  - Type: Respond to Webhook  
  - Role: Sends JSON success response for lead intake webhook  
  - Config: `{ "success": true, "message": "Lead processed successfully" }`  
  - Edge Cases: None  

- **Respond Error1**  
  - Type: Respond to Webhook  
  - Role: Sends JSON error response when validation fails  
  - Config: `{ "success": false, "error": "Invalid lead data" }`  
  - Connections: Output → Log Error to Slack  
  - Edge Cases: None  

- **Log Error to Slack**  
  - Type: Slack (Incoming Webhook)  
  - Role: Logs validation or processing errors related to lead intake to a dedicated Slack channel  
  - Config: Message includes error message, lead email (if available), and timestamp  
  - Edge Cases: Slack webhook failures, no lead email available  

---

#### 2.2 Booking Automation

**Overview:**  
Listens for booking events from calendar tools (e.g., Calendly) via webhook, validates booking data, updates lead status in Airtable and Notion, creates a Google Calendar event, sends a pre-call survey email to the client, and notifies Slack.

**Nodes Involved:**  
- Webhook Trigger (booking)  
- Validate Booking Data (If)  
- Update Airtable Lead Record  
- Update Notion Page  
- Create Google Calendar Event  
- Send Pre-Call Survey Email  
- Notify Slack  
- Respond Error  

**Node Details:**

- **Webhook Trigger**  
  - Type: Webhook  
  - Role: Receives booking event data via HTTP POST at path `/booking`  
  - Config: POST method, responds with JSON  
  - Connections: Output → Validate Booking Data  
  - Edge Cases: Missing or malformed booking data  

- **Validate Booking Data**  
  - Type: If  
  - Role: Checks that essential booking fields `email`, `calendlyEventId`, and `scheduledAt` are present and non-empty  
  - Config: String conditions on respective JSON fields  
  - Connections: True → Update Airtable Lead Record, False → Respond Error  
  - Edge Cases: Missing booking fields cause error response  

- **Update Airtable Lead Record**  
  - Type: Airtable  
  - Role: Updates existing lead record to mark status as "Booked" and add booking details  
  - Config: Update operation on `tblLeads`, fields updated: Status, Timezone, Booking Date, Last Updated timestamp, Calendly Event ID  
  - Connections: Output → Update Notion Page  
  - Edge Cases: Record not found, API errors, retries enabled, continues on fail  

- **Update Notion Page**  
  - Type: Notion  
  - Role: Updates the corresponding lead's page in Notion with booking information  
  - Config: Update operation, linked to database/page via parameters  
  - Connections: Output → Create Google Calendar Event  
  - Edge Cases: API errors, invalid page ID, retries enabled, continues on fail  

- **Create Google Calendar Event**  
  - Type: Google Calendar  
  - Role: Creates a calendar event for the scheduled booking  
  - Config: Uses specified calendar ID, creates event resource with booking details  
  - Connections: Output → Send Pre-Call Survey Email  
  - Edge Cases: Google API errors, invalid calendar ID, retries enabled  

- **Send Pre-Call Survey Email**  
  - Type: Gmail  
  - Role: Sends a personalized pre-call survey email to the client to improve call preparation  
  - Config: Sends to client email, includes dynamic date formatting for call date, Gmail OAuth2 credentials used  
  - Connections: Output → Notify Slack  
  - Edge Cases: Email failures, invalid email addresses  

- **Notify Slack**  
  - Type: Slack (Incoming Webhook)  
  - Role: Sends notification to Slack channel about new scheduled call with client details and calendar link  
  - Config: Message includes client name, email, date, time, timezone, and link to Google Calendar event  
  - Edge Cases: Slack webhook failures  

- **Respond Error**  
  - Type: Respond to Webhook  
  - Role: Sends JSON error response if booking data validation fails  
  - Config: `{ "success": false, "error": "Invalid booking data" }`  

---

#### 2.3 Daily Reminders (Cron Job)

**Overview:**  
Runs every day at 9:00 AM to fetch calls scheduled in the next 24 hours from Airtable and sends reminder emails to clients to reduce no-shows.

**Nodes Involved:**  
- Schedule Daily Check (Cron Trigger)  
- Get Upcoming Calls (24h)  
- Send 24h Reminder  
- Mark Reminder Sent  

**Node Details:**

- **Schedule Daily Check**  
  - Type: Schedule Trigger  
  - Role: Cron job that triggers workflow daily at 9:00 AM  
  - Config: Cron expression set to `0 9 * * *` (9 AM daily)  
  - Connections: Output → Get Upcoming Calls (24h)  

- **Get Upcoming Calls (24h)**  
  - Type: Airtable  
  - Role: Retrieves all records from `tblLeads` with calls scheduled within next 24 hours (filtering logic assumed to be configured externally or custom)  
  - Config: `getAllRecords` operation on `tblLeads`  
  - Connections: Output → Send 24h Reminder  

- **Send 24h Reminder**  
  - Type: Gmail  
  - Role: Sends reminder email to clients about their scheduled call the next day  
  - Config: Email content dynamically includes client name, call time formatted, and timezone; uses Gmail OAuth2 credentials  
  - Connections: Output → Mark Reminder Sent  
  - Edge Cases: Email sending errors, invalid recipient addresses  

- **Mark Reminder Sent**  
  - Type: Airtable  
  - Role: Updates lead record to mark reminder as sent with timestamp  
  - Config: Update operation on `tblLeads`, fields updated: `Reminder Sent` boolean and `Reminder Sent At` timestamp  
  - Edge Cases: Airtable API errors  

---

#### 2.4 Payment & Onboarding

**Overview:**  
Triggered by a successful Stripe payment webhook, this block validates payment data, updates the lead status to "Paid" in Airtable, creates a personalized onboarding checklist in Notion, sends welcome emails and optional WhatsApp messages, logs payments in a financial tracking table, and notifies Slack.

**Nodes Involved:**  
- Webhook Trigger2 (payment-success)  
- Validate Payment Data (If)  
- Mark Lead as Paid in Airtable  
- Create Onboarding Checklist in Notion  
- Send Welcome Email  
- Send WhatsApp Welcome (Optional)  
- Notify Slack - Payment  
- Update Financial Tracking  
- Respond Success2  
- Respond Error2  

**Node Details:**

- **Webhook Trigger2**  
  - Type: Webhook  
  - Role: Entry point for payment success events via HTTP POST at path `/payment-success`  
  - Config: POST method, responds with JSON  
  - Connections: Output → Validate Payment Data  
  - Edge Cases: Missing or malformed payment data  

- **Validate Payment Data**  
  - Type: If  
  - Role: Checks that required payment fields `leadEmail`, `amount`, and `stripePaymentIntent` are present and non-empty  
  - Config: String conditions on JSON fields  
  - Connections: True → Mark Lead as Paid in Airtable, False → Respond Error2  
  - Edge Cases: Missing payment data causes error response  

- **Mark Lead as Paid in Airtable**  
  - Type: Airtable  
  - Role: Updates lead record in `tblLeads` to mark status as "Paid" and records payment details  
  - Config: Update operation fields: Status, Payment Date (timestamp), Payment Amount (amount / 100), Payment Status, Priority Client flag, Stripe Payment Intent  
  - Connections: Output → Create Onboarding Checklist in Notion  
  - Edge Cases: Record not found, API errors, retries enabled  

- **Create Onboarding Checklist in Notion**  
  - Type: Notion  
  - Role: Creates a new onboarding checklist page in Notion onboarding database for the paid client  
  - Config: Title formatted as `"Onboarding - <Client Name>"`, with structured blocks of headings, text, and to-do items for onboarding tasks  
  - Connections: Output → Send Welcome Email  
  - Edge Cases: API errors, invalid database ID, retries enabled  

- **Send Welcome Email**  
  - Type: Gmail  
  - Role: Sends a welcome email to client confirming payment and providing onboarding portal link  
  - Config: Email to `leadEmail`, subject "🎉 Welcome! Your automation journey starts now", includes link to onboarding checklist in Notion, Gmail OAuth2 credentials used  
  - Connections: Output → Send WhatsApp Welcome (Optional), Notify Slack - Payment, Update Financial Tracking  
  - Edge Cases: Email sending failures  

- **Send WhatsApp Welcome (Optional)**  
  - Type: HTTP Request  
  - Role: Sends a WhatsApp welcome message using Twilio WhatsApp Business API (optional, requires Twilio credentials and phone number)  
  - Config: POST to Twilio API endpoint with parameters for To (lead phone), From (Twilio WhatsApp number), and welcome message body  
  - Connections: Output → Notify Slack - Payment  
  - Edge Cases: API errors, missing phone number, continues on fail  

- **Notify Slack - Payment**  
  - Type: Slack (Incoming Webhook)  
  - Role: Notifies internal Slack channel about payment receipt, onboarding checklist creation, and communications sent  
  - Config: Message includes client name, email, payment amount, payment ID, confirmation of onboarding checklist, welcome email, and optional WhatsApp message status, includes link to Notion onboarding checklist  
  - Connections: Output → Respond Success2  
  - Edge Cases: Slack webhook failures  

- **Update Financial Tracking**  
  - Type: Airtable  
  - Role: Optionally appends payment record to a separate `tblFinancials` table for finance tracking  
  - Config: Append operation, mapping payment details  
  - Edge Cases: API errors, continues on fail  

- **Respond Success2**  
  - Type: Respond to Webhook  
  - Role: Sends JSON success response for payment webhook  
  - Config: `{ "success": true, "message": "Payment processed successfully" }`  

- **Respond Error2**  
  - Type: Respond to Webhook  
  - Role: Sends JSON error response when payment validation fails  
  - Config: `{ "success": false, "error": "Invalid payment data" }`  

---

### 3. Summary Table

| Node Name                       | Node Type          | Functional Role                      | Input Node(s)                 | Output Node(s)                     | Sticky Note                                                                                                     |
|--------------------------------|--------------------|------------------------------------|------------------------------|----------------------------------|----------------------------------------------------------------------------------------------------------------|
| Webhook Trigger1               | Webhook            | Entry for lead intake              |                              | Validate Data                    | ## 1. Lead Capture & Enrichment<br>Catches new leads from your website form. It enriches data via Clearbit (optional), creates the initial project page in Notion, and notifies the team via Slack. |
| Validate Data                 | If                 | Validates lead email and name      | Webhook Trigger1              | Enrich with Clearbit, Respond Error1 |                                                                                                                |
| Enrich with Clearbit (Optional)| HTTP Request       | Optionally enriches lead data      | Validate Data (true)          | Create Airtable Record           |                                                                                                                |
| Create Airtable Record        | Airtable           | Creates lead record in Airtable    | Enrich with Clearbit          | Create Notion Project Page       |                                                                                                                |
| Create Notion Project Page    | Notion             | Creates lead project page in Notion| Create Airtable Record        | Send Slack Notification          |                                                                                                                |
| Send Slack Notification       | Slack (Webhook)    | Notifies team of new lead          | Create Notion Project Page    | Send Auto-Reply Email            |                                                                                                                |
| Send Auto-Reply Email         | Gmail              | Sends auto-reply email to lead     | Send Slack Notification       | Respond Success1                 |                                                                                                                |
| Respond Success1              | Respond to Webhook | Responds success to lead intake    | Send Auto-Reply Email         |                                  |                                                                                                                |
| Respond Error1                | Respond to Webhook | Responds error on invalid lead data| Validate Data (false)         | Log Error to Slack               |                                                                                                                |
| Log Error to Slack            | Slack (Webhook)    | Logs errors in lead intake process | Respond Error1                |                                  |                                                                                                                |
| Webhook Trigger              | Webhook            | Entry for booking events           |                              | Validate Booking Data            | ## 2. Booking Automation<br>Listens for calendar events (e.g., Calendly). It validates the data, updates the Airtable lead status to "Booked," creates a Google Calendar event, and emails a pre-call survey to the client. |
| Validate Booking Data         | If                 | Validates booking event data       | Webhook Trigger              | Update Airtable Lead Record, Respond Error |                                                                                                                |
| Update Airtable Lead Record   | Airtable           | Updates lead status to "Booked"    | Validate Booking Data (true)  | Update Notion Page               |                                                                                                                |
| Update Notion Page            | Notion             | Updates lead's Notion page          | Update Airtable Lead Record   | Create Google Calendar Event     |                                                                                                                |
| Create Google Calendar Event  | Google Calendar    | Creates Google Calendar event      | Update Notion Page            | Send Pre-Call Survey Email       |                                                                                                                |
| Send Pre-Call Survey Email    | Gmail              | Sends survey email before call     | Create Google Calendar Event  | Notify Slack                    |                                                                                                                |
| Notify Slack                 | Slack (Webhook)    | Notifies team of new booking       | Send Pre-Call Survey Email    |                                  |                                                                                                                |
| Respond Error                 | Respond to Webhook | Responds error on invalid booking  | Validate Booking Data (false) |                                  |                                                                                                                |
| Schedule Daily Check          | Schedule Trigger   | Cron job triggering daily check    |                              | Get Upcoming Calls (24h)         | ## 3. Daily Reminders (Cron Job)<br>Runs automatically every day at 9:00 AM. It checks Airtable for calls scheduled in the next 24 hours and sends a reminder email to prevent no-shows. |
| Get Upcoming Calls (24h)      | Airtable           | Retrieves calls scheduled next 24h | Schedule Daily Check          | Send 24h Reminder                |                                                                                                                |
| Send 24h Reminder             | Gmail              | Sends reminder emails for calls    | Get Upcoming Calls (24h)      | Mark Reminder Sent               |                                                                                                                |
| Mark Reminder Sent            | Airtable           | Marks reminder as sent in Airtable | Send 24h Reminder             |                                  |                                                                                                                |
| Webhook Trigger2              | Webhook            | Entry for payment success webhook  |                              | Validate Payment Data            | ## 4. Payment & Onboarding<br>Triggered by a successful Stripe payment. It reconciles the finance table, generates a personalized Notion Onboarding Checklist, and sends the client a welcome email and WhatsApp message. |
| Validate Payment Data         | If                 | Validates payment info              | Webhook Trigger2              | Mark Lead as Paid in Airtable, Respond Error2 |                                                                                                                |
| Mark Lead as Paid in Airtable | Airtable           | Marks lead as paid and records payment details | Validate Payment Data (true) | Create Onboarding Checklist in Notion |                                                                                                                |
| Create Onboarding Checklist in Notion | Notion    | Creates onboarding checklist page  | Mark Lead as Paid in Airtable | Send Welcome Email              |                                                                                                                |
| Send Welcome Email           | Gmail              | Sends welcome email post payment   | Create Onboarding Checklist   | Send WhatsApp Welcome, Notify Slack - Payment, Update Financial Tracking |                                                                                                                |
| Send WhatsApp Welcome (Optional) | HTTP Request    | Sends WhatsApp welcome message     | Send Welcome Email            | Notify Slack - Payment           |                                                                                                                |
| Notify Slack - Payment       | Slack (Webhook)    | Notifies team of payment and onboarding progress | Send Welcome Email, Send WhatsApp Welcome | Respond Success2             |                                                                                                                |
| Update Financial Tracking    | Airtable           | Logs payment to financial tracking | Send Welcome Email            | Notify Slack - Payment           |                                                                                                                |
| Respond Success2             | Respond to Webhook | Responds success to payment webhook| Notify Slack - Payment        |                                  |                                                                                                                |
| Respond Error2               | Respond to Webhook | Responds error on invalid payment  | Validate Payment Data (false) |                                  |                                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Credentials:**
   - Airtable (API key with bases and tables `tblLeads`, `tblFinancials`)
   - Notion (integration with access to Projects and Onboarding databases)
   - Gmail OAuth2 (authorized Gmail account)
   - Slack incoming webhooks (URLs for lead intake, booking, and payment notifications)
   - Optional: Clearbit API key, Twilio WhatsApp Business API credentials

2. **Lead Capture & Enrichment:**
   - Add **Webhook Trigger1** node:
     - HTTP POST at path `/lead-intake`
     - Response mode: responseNode
   - Add **Validate Data** (If) node:
     - Conditions: `$json.email` is not empty AND `$json.name` is not empty
     - Connect Webhook Trigger1 output to Validate Data input
   - On True branch:
     - Add **Enrich with Clearbit (Optional)** HTTP Request node:
       - GET `https://api.clearbit.com/v2/people/find`
       - Query param: `email` = `{{$json.email}}`
       - Authentication: HTTP Header with Clearbit API key
       - Continue on fail enabled
     - Connect Validate Data true output to this node
     - Add **Create Airtable Record** node:
       - Operation: Append to `tblLeads`
       - Map fields from incoming JSON and Clearbit response as needed
       - Retries enabled
     - Connect Clearbit node output to Create Airtable Record
     - Add **Create Notion Project Page** node:
       - Operation: Create page in Projects database
       - Title: `"{{$json.name}} - {{$json.company || 'Lead'}}"`
       - Setup content blocks for lead info
       - Retries enabled
     - Connect Airtable node output to Notion node
     - Add **Send Slack Notification** node:
       - Use Slack webhook URL for lead notifications
       - Compose message with lead details and Notion page URL
       - Retries enabled
     - Connect Notion node output to Slack node
     - Add **Send Auto-Reply Email** node:
       - Send to `{{$json.email}}`
       - Subject: "Thanks for reaching out! Let's schedule a call"
       - Message body with scheduling link
       - Gmail OAuth2 credentials
     - Connect Slack node output to Gmail node
     - Add **Respond Success1** node:
       - Respond JSON: `{ "success": true, "message": "Lead processed successfully" }`
     - Connect Gmail node output to Respond Success1
   - On False branch of Validate Data:
     - Add **Respond Error1** node:
       - Respond JSON: `{ "success": false, "error": "Invalid lead data" }`
     - Connect Validate Data false output to Respond Error1
     - Add **Log Error to Slack** node:
       - Slack webhook for error logging
       - Message includes error and lead email if available
     - Connect Respond Error1 output to Log Error node

3. **Booking Automation:**
   - Add **Webhook Trigger** node:
     - HTTP POST at path `/booking`
     - Response mode: responseNode
   - Add **Validate Booking Data** (If) node:
     - Conditions: `$json.email`, `$json.calendlyEventId`, `$json.scheduledAt` all not empty
     - Connect Webhook Trigger output to Validate Booking Data
   - On True branch:
     - Add **Update Airtable Lead Record** node:
       - Operation: Update in `tblLeads`
       - Fields: Status = "Booked", Timezone, Booking Date, Last Updated, Calendly Event ID
       - Retries enabled, continue on fail
     - Connect Validate Booking Data true output to Airtable update
     - Add **Update Notion Page** node:
       - Operation: Update page corresponding to lead
       - Retries enabled, continue on fail
     - Connect Airtable update to Notion update
     - Add **Create Google Calendar Event** node:
       - Operation: createEvent on specified calendar
       - Retries enabled
     - Connect Notion update to Google Calendar node
     - Add **Send Pre-Call Survey Email** node:
       - To: client email
       - Subject and body include call date formatted
       - Gmail OAuth2 credentials
     - Connect Google Calendar output to Gmail node
     - Add **Notify Slack** node:
       - Slack webhook for booking notification
       - Message with client and event details, link to calendar event
     - Connect Gmail output to Slack node
   - On False branch:
     - Add **Respond Error** node:
       - Respond JSON: `{ "success": false, "error": "Invalid booking data" }`

4. **Daily Reminders:**
   - Add **Schedule Daily Check** node:
     - Cron expression: `0 9 * * *` (9 AM daily)
   - Add **Get Upcoming Calls (24h)** Airtable node:
     - Operation: getAllRecords on `tblLeads` filtered for calls in next 24h (filter logic to be implemented in query or code)
     - Connect Schedule node output to Airtable node
   - Add **Send 24h Reminder** Gmail node:
     - To: lead email
     - Subject and body with call time and timezone
     - Gmail OAuth2 credentials
     - Connect Airtable output to this node
   - Add **Mark Reminder Sent** Airtable node:
     - Operation: Update lead record with `Reminder Sent` = true and current timestamp
     - Connect Gmail output to this node

5. **Payment & Onboarding:**
   - Add **Webhook Trigger2** node:
     - HTTP POST at path `/payment-success`
     - Response mode: responseNode
   - Add **Validate Payment Data** (If) node:
     - Conditions: `$json.leadEmail`, `$json.amount`, `$json.stripePaymentIntent` all not empty
     - Connect Webhook Trigger2 output to Validate Payment Data
   - On True branch:
     - Add **Mark Lead as Paid in Airtable** node:
       - Operation: Update `tblLeads`
       - Fields: Status = "Paid", Payment Date = now, Payment Amount = amount/100, Payment Status = "Completed", Priority Client = true, Stripe Payment Intent
       - Retries enabled
     - Connect Validate Payment Data true output to Airtable update
     - Add **Create Onboarding Checklist in Notion** node:
       - Operation: Create page in Onboarding database
       - Title: `"Onboarding - <Client Name>"`
       - Structured blocks with headings and to-dos for onboarding tasks
       - Retries enabled
     - Connect Airtable update output to Notion node
     - Add **Send Welcome Email** Gmail node:
       - To: lead email
       - Subject: "🎉 Welcome! Your automation journey starts now"
       - Body includes link to onboarding checklist
       - Gmail OAuth2 credentials
     - Connect Notion output to Gmail node
     - Add **Send WhatsApp Welcome (Optional)** HTTP Request node:
       - POST to Twilio API with WhatsApp message parameters (To lead phone, From Twilio number, message body)
       - Continue on fail enabled
     - Connect Gmail output to WhatsApp node
     - Add **Notify Slack - Payment** node:
       - Slack webhook for payment notification
       - Message includes payment details, onboarding checklist link, WhatsApp message status
     - Connect Gmail and WhatsApp outputs to Slack node
     - Add **Update Financial Tracking** Airtable node:
       - Operation: Append to `tblFinancials` with payment details
       - Continue on fail enabled
     - Connect Gmail output to this node, then connect its output to Slack node (to send after financial update)
     - Add **Respond Success2** node:
       - Respond JSON: `{ "success": true, "message": "Payment processed successfully" }`
     - Connect Slack output to Respond Success2
   - On False branch:
     - Add **Respond Error2** node:
       - Respond JSON: `{ "success": false, "error": "Invalid payment data" }`

---

### 5. General Notes & Resources

| Note Content                                                                                                                        | Context or Link                                  |
|------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------|
| This workflow handles the complete agency client lifecycle without manual intervention.                                             | Sticky Note at top-left                           |
| Setup requires connecting Airtable, Notion, Gmail, Slack, and Stripe credentials.                                                   | Sticky Note setup instructions                    |
| Airtable base must include tables: `tblLeads` for leads and `tblFinancials` for payment tracking.                                  | Setup instructions                                |
| Notion requires two databases: one for Projects and one for Onboarding checklists; database IDs must be configured in nodes.       | Setup instructions                                |
| Webhook URLs must be replaced in external tools (website form, Calendly, Stripe) to integrate with n8n workflow endpoints.        | Setup instructions                                |
| Optional integrations: Clearbit for lead enrichment and Twilio WhatsApp Business API for welcome messaging.                         | Optional nodes and notes                           |
| Slack notifications use incoming webhooks; multiple channels are used for lead intake, booking, and payment notifications.          | Slack webhook setup                               |
| Gmail nodes use OAuth2 credentials configured for the sending email account.                                                        | Gmail credential setup                            |
| Cron job runs daily at 9:00 AM to send reminders for next-day scheduled calls to reduce no-shows.                                   | Daily reminders sticky note                        |
| Error handling includes responding with JSON error messages and logging errors to Slack for monitoring.                            | Error response nodes and Slack error logging      |
| The workflow is modular and designed to be extended or customized by modifying individual blocks or nodes as needed.               | General best practice                             |

---

**Disclaimer:** This documentation is generated from a complete n8n workflow JSON export and respects all current content policies. It contains no illegal or protected data.