Automate Lead Meeting Scheduling with Zoho CRM, Google Calendar & Gemini AI

https://n8nworkflows.xyz/workflows/automate-lead-meeting-scheduling-with-zoho-crm--google-calendar---gemini-ai-11600


# Automate Lead Meeting Scheduling with Zoho CRM, Google Calendar & Gemini AI

### 1. Workflow Overview

This workflow automates scheduling meetings with new leads created in Zoho CRM by leveraging Zoho CRM data, Google Calendar availability, Zoom meeting creation, and AI-generated personalized email invitations via Google Gemini. It is designed to streamline the process from lead capture to meeting scheduling and communication, ensuring a high-touch, efficient sales engagement experience.

The workflow is logically divided into these functional blocks:

- **1.1 Lead Capture & Retrieval:** Triggered by a Zoho CRM webhook on new lead creation; retrieves full lead details.
- **1.2 Workflow Configuration:** Sets scheduling parameters such as meeting duration, buffers, working hours, and meeting provider.
- **1.3 Sales Rep & Availability Processing:** Fetches the assigned sales rep’s details, detects the lead’s timezone, retrieves the rep’s Google Calendar events, and computes available meeting slots considering buffers and working hours.
- **1.4 Zoom Meeting Creation:** Authenticates with Zoom, creates a scheduled meeting at the earliest available slot, and obtains the join link.
- **1.5 AI-Powered Personalized Invite & CRM Logging:** Uses Google Gemini AI to generate a warm, professional invitation email with top available slots and meeting link, sends the email via Gmail, and logs the meeting in Zoho CRM.
- **1.6 Fallback Handling:** If no slots are available, sends a polite email asking the lead to suggest preferred times.

---

### 2. Block-by-Block Analysis

#### 1.1 Lead Capture & Retrieval

- **Overview:**  
  This block listens for new lead creation events from Zoho CRM via webhook, then retrieves detailed lead information for processing.

- **Nodes Involved:**  
  - Zoho CRM Lead Webhook  
  - New Lead Trigger

- **Node Details:**  

  - **Zoho CRM Lead Webhook**  
    - Type: Webhook (HTTP POST listener)  
    - Configuration: Listens on path `/zoho-lead-webhook` for POST requests triggered by Zoho CRM lead creation automation.  
    - Inputs: Receives lead ID from Zoho CRM.  
    - Outputs: Passes lead ID to the next node.  
    - Edge Cases: Missing or malformed webhook data; webhook URL must be correctly registered in Zoho CRM.  
    - Sticky Note: Explains automatic triggering and lead ID forwarding.

  - **New Lead Trigger**  
    - Type: Zoho CRM node (get operation on lead resource)  
    - Configuration: Uses lead ID from webhook to fetch full lead details. Authenticated via Zoho OAuth2 credentials.  
    - Inputs: Lead ID from webhook node.  
    - Outputs: JSON object with complete lead data including contact and owner info.  
    - Edge Cases: API rate limits, lead not found, or auth errors.

---

#### 1.2 Workflow Configuration

- **Overview:**  
  Stores all scheduling-related parameters centrally for use across the workflow.

- **Nodes Involved:**  
  - Workflow Configuration

- **Node Details:**  

  - **Workflow Configuration**  
    - Type: Set node  
    - Configuration: Defines variables such as meetingDuration (30 min), bufferTimeBefore (15 min), bufferTimeAfter (15 min), daysToLookAhead (7), workingHoursStart (09:00), workingHoursEnd (17:00), and meetingLinkService (zoom).  
    - Inputs: Receives from New Lead Trigger node.  
    - Outputs: Provides config data to downstream nodes.  
    - Edge Cases: Ensure values are valid and realistic (e.g., working hours in 24h format).  
    - Sticky Note: Describes its role as settings repository.

---

#### 1.3 Sales Rep & Availability Processing

- **Overview:**  
  Retrieves assigned sales rep details, detects lead timezone based on location, fetches rep calendar events from Google Calendar, and calculates available meeting slots that respect buffers and working hours.

- **Nodes Involved:**  
  - Get Sales Rep Details  
  - Detect Lead Timezone  
  - Get Rep Calendar Availability  
  - Find Available Slots with Buffer  
  - Check Slots Available

- **Node Details:**  

  - **Get Sales Rep Details**  
    - Type: Zoho CRM get operation (account resource)  
    - Configuration: Retrieves sales rep details linked to the lead (e.g., calendar ID, email).  
    - Inputs: Output from Workflow Configuration.  
    - Outputs: Sales rep contact and calendar data.  
    - Edge Cases: Missing or invalid rep data in Zoho CRM.

  - **Detect Lead Timezone**  
    - Type: Code node (JavaScript)  
    - Configuration: Determines timezone string based on lead’s country and state. Defaults to America/New_York. Handles countries US, UK, Germany, Australia with specific state mappings for US.  
    - Key Expressions: Reads `Country`, `State` fields from lead data.  
    - Inputs: Sales rep details node output.  
    - Outputs: Lead data enriched with `detectedTimezone`.  
    - Edge Cases: Unlisted countries/states default to New York; missing location data leads to fallback timezone.  
    - Sticky Note: Describes timezone detection role.

  - **Get Rep Calendar Availability**  
    - Type: Google Calendar node (getAll events)  
    - Configuration: Uses sales rep’s Google Calendar ID to fetch events within the search window. Authenticated via Google OAuth2.  
    - Inputs: Output of timezone detection node.  
    - Outputs: List of calendar events for the rep.  
    - Edge Cases: Calendar access denied, invalid calendar ID, network issues.

  - **Find Available Slots with Buffer**  
    - Type: Code node (JavaScript)  
    - Configuration: Logic to find meeting slots based on working hours, meeting duration, buffer before/after, days to look ahead, and existing calendar events. Moves in 30-minute increments.  
    - Inputs: Calendar events and workflow configuration.  
    - Outputs: Up to 5 available meeting slots with start/end times and timezone.  
    - Edge Cases: No available slots found, time zone conversions must be correct.  
    - Sticky Note: Explains slot generation with buffer and working hours.

  - **Check Slots Available**  
    - Type: If node (boolean condition)  
    - Configuration: Checks if `hasSlots` flag (from previous node) is true, branching workflow accordingly.  
    - Inputs: Available slots from previous node.  
    - Outputs:  
      - True branch: Proceed to meeting creation.  
      - False branch: Trigger fallback email.  
    - Edge Cases: Expression failures or missing data.  

---

#### 1.4 Zoom Meeting Creation

- **Overview:**  
  Authenticates with Zoom using OAuth to get an access token, then creates a scheduled Zoom meeting for the earliest available time slot.

- **Nodes Involved:**  
  - Generate Meeting Link  
  - HTTP Request (Zoom Meeting Creation)

- **Node Details:**  

  - **Generate Meeting Link**  
    - Type: HTTP Request node  
    - Configuration:  
      - POST to `https://zoom.us/oauth/token` with query parameters `grant_type=account_credentials` and specific `account_id`.  
      - Uses HTTP Basic Auth credential for Zoom.  
    - Inputs: True branch from Check Slots Available node.  
    - Outputs: Zoom OAuth access token.  
    - Edge Cases: OAuth failures, token expiry, invalid account ID.  
    - Sticky Note: Describes Zoom auth and meeting creation step.

  - **HTTP Request (Zoom Meeting Creation)**  
    - Type: HTTP Request node  
    - Configuration:  
      - POST to `https://api.zoom.us/v2/users/me/meetings`  
      - Body includes meeting topic, type (scheduled), start time (earliest available slot), duration (30 min), timezone (lead timezone).  
      - Authorization header with Bearer token from previous node output.  
    - Inputs: Output from Generate Meeting Link node.  
    - Outputs: Zoom meeting join URL and details.  
    - Edge Cases: API rate limits, invalid token, start time format errors.  
    - On error: Continues execution to avoid workflow failure.

---

#### 1.5 AI-Powered Personalized Invite & CRM Logging

- **Overview:**  
  Generates a personalized email invitation using Google Gemini AI, sends it via Gmail, then logs the meeting details in Zoho CRM.

- **Nodes Involved:**  
  - Generate Personalized Invite  
  - Google Gemini Chat Model  
  - Send Meeting Invite  
  - Log Meeting in Zoho CRM

- **Node Details:**  

  - **Generate Personalized Invite**  
    - Type: LangChain Agent node (Google Gemini chat model integration)  
    - Configuration:  
      - Input text includes lead details (with detected timezone), available meeting slots, and Zoom meeting join link.  
      - System message instructs AI to create a warm, professional HTML email with subject and body, listing top 3 available time slots in lead’s timezone.  
    - Inputs: Output of HTTP Request (Zoom meeting creation).  
    - Outputs: AI-generated email content.  
    - Edge Cases: AI generation failures, malformed output.  
    - Sticky Note: Details AI email generation and CRM logging role.

  - **Google Gemini Chat Model**  
    - Type: Language model node (Google Gemini)  
    - Configuration: Authenticated with Google PaLM API credentials.  
    - Inputs: Feeds into Generate Personalized Invite node for AI processing.  
    - Outputs: AI chat completions.  
    - Edge Cases: API quota limits, auth errors.

  - **Send Meeting Invite**  
    - Type: Gmail node (send email)  
    - Configuration:  
      - Sends to sales rep’s email (extracted from lead data’s owner).  
      - Subject parsed from AI output.  
      - Body contains the AI-generated HTML email content.  
      - Authenticated via Gmail OAuth2.  
    - Inputs: Output of Generate Personalized Invite node.  
    - Outputs: Confirmation of email sent.  
    - Edge Cases: Email delivery failures, invalid email addresses.

  - **Log Meeting in Zoho CRM**  
    - Type: Zoho CRM node (update lead resource)  
    - Configuration:  
      - Updates lead record with meeting event description including scheduled time and lead name.  
      - Uses Zoho OAuth2 credentials.  
    - Inputs: Output of Send Meeting Invite node.  
    - Outputs: Confirmation of CRM update.  
    - Edge Cases: API errors, improper data mapping.

---

#### 1.6 Fallback Handling

- **Overview:**  
  Sends a polite fallback email to the lead if no meeting slots are available within the configured search window.

- **Nodes Involved:**  
  - No Slots Available Message  
  - Send No Availability Email

- **Node Details:**  

  - **No Slots Available Message**  
    - Type: Set node  
    - Configuration:  
      - Sets email subject “Unable to Schedule Meeting - Let's Connect”.  
      - Email body politely notifies no availability in next N days, invites lead to reply with preferred times.  
      - Uses lead’s full name and daysToLookAhead from workflow config.  
    - Inputs: False branch from Check Slots Available node.  
    - Outputs: Email content for fallback.  
    - Sticky Note: Describes fallback email preparation.

  - **Send No Availability Email**  
    - Type: Gmail node (send email)  
    - Configuration:  
      - Sends fallback email to fixed address `dg3avt@gmail.com` (likely placeholder, should be replaced with lead’s email).  
      - Subject and body from previous node.  
      - Authenticated with Gmail OAuth2.  
    - Inputs: Output from No Slots Available Message node.  
    - Outputs: Confirmation of email sent.  
    - Edge Cases: Email delivery failures, hardcoded recipient likely requires adjustment.

---

### 3. Summary Table

| Node Name                   | Node Type                        | Functional Role                                     | Input Node(s)                    | Output Node(s)                  | Sticky Note                                                                                                                        |
|-----------------------------|---------------------------------|----------------------------------------------------|---------------------------------|--------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| Zoho CRM Lead Webhook       | Webhook                         | Trigger on new lead creation in Zoho CRM           | —                               | New Lead Trigger                | Automatically triggers when a new lead is created in Zoho CRM; sends lead ID to n8n.                                              |
| New Lead Trigger            | Zoho CRM get lead               | Retrieve full lead details                          | Zoho CRM Lead Webhook            | Workflow Configuration          | Automatically triggers when a new lead is created in Zoho CRM.                                                                   |
| Workflow Configuration      | Set                            | Stores scheduling parameters                        | New Lead Trigger                | Get Sales Rep Details           | Stores all scheduling settings such as meeting duration, buffers, working hours, days to search, and meeting provider.           |
| Get Sales Rep Details       | Zoho CRM get account            | Fetch assigned sales rep details                    | Workflow Configuration          | Detect Lead Timezone            | Retrieves the assigned sales rep’s details.                                                                                      |
| Detect Lead Timezone        | Code                           | Detect lead’s timezone based on location           | Get Sales Rep Details           | Get Rep Calendar Availability   | Detects lead timezone by country/state for meeting scheduling.                                                                    |
| Get Rep Calendar Availability| Google Calendar getAll          | Retrieve sales rep’s calendar events                | Detect Lead Timezone            | Find Available Slots with Buffer| Retrieves sales rep’s calendar events for conflict checking.                                                                      |
| Find Available Slots with Buffer | Code                      | Calculate free meeting slots with buffer and working hours | Get Rep Calendar Availability  | Check Slots Available           | Finds conflict-free meeting slots respecting buffers and working hours.                                                           |
| Check Slots Available       | If                             | Branch based on slot availability                   | Find Available Slots with Buffer| Generate Meeting Link / No Slots Available Message | Checks if any slots are available to proceed or fallback.                                |
| Generate Meeting Link       | HTTP Request                   | Get Zoom OAuth token                                | Check Slots Available (true)    | HTTP Request (Zoom Meeting Creation) | Authenticates with Zoom to obtain access token.                                                                                   |
| HTTP Request (Zoom Meeting Creation) | HTTP Request           | Create scheduled Zoom meeting                        | Generate Meeting Link           | Generate Personalized Invite    | Creates Zoom meeting for earliest available slot.                                                                                 |
| Generate Personalized Invite| LangChain Agent (AI)           | Generate personalized HTML email invitation         | HTTP Request (Zoom Meeting Creation) | Send Meeting Invite            | Generates personalized invite email with Google Gemini AI.                                                                       |
| Google Gemini Chat Model    | Language Model (Google Gemini) | AI language model for email generation               | —                              | Generate Personalized Invite    | Supports AI email generation.                                                                                                    |
| Send Meeting Invite         | Gmail                         | Send personalized meeting invitation email          | Generate Personalized Invite    | Log Meeting in Zoho CRM         | Sends the AI-generated invite email to the lead’s sales rep.                                                                     |
| Log Meeting in Zoho CRM     | Zoho CRM update lead           | Log scheduled meeting details in Zoho CRM            | Send Meeting Invite             | —                              | Logs meeting details into the lead’s record in Zoho CRM.                                                                          |
| No Slots Available Message  | Set                           | Prepare fallback email content if no slots available | Check Slots Available (false)   | Send No Availability Email      | Prepares polite “no availability” message to send to lead.                                                                        |
| Send No Availability Email  | Gmail                         | Send fallback email when no meeting slots found      | No Slots Available Message      | —                              | Sends fallback email inviting lead to propose times; recipient currently hardcoded to a fixed address.                            |
| Sticky Note1                | Sticky Note                   | Workflow overview and setup instructions             | —                              | —                              | Describes workflow overview and setup steps.                                                                                      |
| Sticky Note                 | Sticky Note                   | Lead capture & retrieval explanation                  | —                              | —                              | Explains webhook and lead trigger nodes.                                                                                         |
| Sticky Note2                | Sticky Note                   | Workflow configuration explanation                    | —                              | —                              | Explains configuration node storing settings.                                                                                    |
| Sticky Note3                | Sticky Note                   | Sales rep & availability processing explanation      | —                              | —                              | Explains sales rep data retrieval, timezone detection, calendar event fetching, and slot calculation.                             |
| Sticky Note4                | Sticky Note                   | Zoom meeting creation explanation                      | —                              | —                              | Explains Zoom token retrieval and meeting creation process.                                                                       |
| Sticky Note5                | Sticky Note                   | Fallback email handling explanation                    | —                              | —                              | Describes fallback email preparation and sending for no available slots.                                                          |
| Sticky Note6                | Sticky Note                   | AI email & CRM logging explanation                     | —                              | —                              | Explains AI email generation, sending, and CRM logging.                                                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node: Zoho CRM Lead Webhook**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `zoho-lead-webhook`  
   - Purpose: Receive new lead ID from Zoho CRM when a lead is created.

2. **Create Zoho CRM Node: New Lead Trigger**  
   - Type: Zoho CRM  
   - Operation: Get lead  
   - Resource: Lead  
   - Credentials: Zoho OAuth2 (configured with Zoho CRM account)  
   - Input: Connect from Webhook node output (lead ID)  
   - Purpose: Fetch complete lead details.

3. **Create Set Node: Workflow Configuration**  
   - Define variables:  
     - meetingDuration: 30 (minutes)  
     - bufferTimeBefore: 15 (minutes)  
     - bufferTimeAfter: 15 (minutes)  
     - daysToLookAhead: 7  
     - workingHoursStart: "09:00" (24h format)  
     - workingHoursEnd: "17:00" (24h format)  
     - meetingLinkService: "zoom"  
   - Input: Connect from New Lead Trigger output  
   - Purpose: Central settings for scheduling logic.

4. **Create Zoho CRM Node: Get Sales Rep Details**  
   - Type: Zoho CRM  
   - Operation: Get account  
   - Resource: Account (sales rep info)  
   - Credentials: Zoho OAuth2  
   - Input: Connect from Workflow Configuration output  
   - Purpose: Obtain sales rep calendar and contact info.

5. **Create Code Node: Detect Lead Timezone**  
   - JavaScript to map lead country/state to timezone string.  
   - Input: Connect from Get Sales Rep Details output  
   - Purpose: Determine lead’s timezone for scheduling.

6. **Create Google Calendar Node: Get Rep Calendar Availability**  
   - Operation: Get all events  
   - Calendar ID: Use calendar ID from sales rep details  
   - Credentials: Google OAuth2 (Google Calendar)  
   - Input: Connect from Detect Lead Timezone output  
   - Purpose: Fetch sales rep’s calendar events for conflict checking.

7. **Create Code Node: Find Available Slots with Buffer**  
   - JavaScript logic to generate available time slots within working hours, considering buffers, meeting duration, and existing calendar events.  
   - Input: Connect from Google Calendar output + read Workflow Configuration and Detect Lead Timezone data.  
   - Purpose: Identify feasible meeting times.

8. **Create If Node: Check Slots Available**  
   - Condition: `$json.hasSlots === true`  
   - Input: Connect from Find Available Slots output  
   - Purpose: Branch workflow based on availability.

9. **Create HTTP Request Node: Generate Meeting Link (Zoom OAuth Token)**  
   - Method: POST  
   - URL: `https://zoom.us/oauth/token`  
   - Query Parameters: `grant_type=account_credentials`, `account_id=YourAccountID` (replace accordingly)  
   - Authentication: HTTP Basic Auth with Zoom API credentials  
   - Input: Connect from If node’s true branch  
   - Purpose: Obtain Zoom access token.

10. **Create HTTP Request Node: Zoom Meeting Creation**  
    - Method: POST  
    - URL: `https://api.zoom.us/v2/users/me/meetings`  
    - Headers: Authorization Bearer token from previous node  
    - Body: JSON with topic, type (2), start_time (earliest slot), duration (30), timezone  
    - Input: Connect from Generate Meeting Link node output  
    - Purpose: Create Zoom meeting and get join URL.

11. **Create LangChain Agent Node: Generate Personalized Invite**  
    - Model: Google Gemini via LangChain Agent  
    - Input Text: Include lead details, available slots, Zoom meeting link  
    - System Message: Instructions to generate professional, warm HTML email with subject and body listing top 3 slots  
    - Input: Connect from Zoom Meeting Creation node output  
    - Purpose: Generate personalized email content.

12. **Create Gmail Node: Send Meeting Invite**  
    - To: Sales rep’s email extracted from lead owner data  
    - Subject: Extracted from AI output  
    - Message: AI-generated HTML email body  
    - Credentials: Gmail OAuth2  
    - Input: Connect from Generate Personalized Invite output  
    - Purpose: Email the meeting invitation.

13. **Create Zoho CRM Node: Log Meeting in Zoho CRM**  
    - Operation: Update lead resource  
    - Fields: Add description with meeting details and scheduled time  
    - Credentials: Zoho OAuth2  
    - Input: Connect from Send Meeting Invite output  
    - Purpose: Log meeting for lead tracking.

14. **Create Set Node: No Slots Available Message**  
    - Variables:  
      - subject: "Unable to Schedule Meeting - Let's Connect"  
      - message: Polite email explaining no availability, asking lead to reply with preferred times  
    - Input: Connect from If node’s false branch  
    - Purpose: Prepare fallback email.

15. **Create Gmail Node: Send No Availability Email**  
    - To: (Replace hardcoded `dg3avt@gmail.com` with lead email)  
    - Subject & Message: from No Slots Available Message node  
    - Credentials: Gmail OAuth2  
    - Input: Connect from No Slots Available Message output  
    - Purpose: Notify lead of no available meeting slots and invite response.

16. **Activate the workflow**  
    - Test with sample lead creation in Zoho CRM.  
    - Confirm all steps run successfully: lead data fetch, timezone detection, calendar availability, Zoom meeting creation, AI email generation, email sending, and CRM update.  
    - Adjust any parameters or credentials as necessary.

---

### 5. General Notes & Resources

| Note Content                                                                                                                             | Context or Link                                                                              |
|------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------|
| This workflow integrates Zoho CRM, Google Calendar, Zoom, Gmail, and Google Gemini AI to fully automate lead meeting scheduling.         | Workflow overview sticky note details                                                     |
| Zoom OAuth uses `account_credentials` grant with a fixed account ID; update accordingly for your Zoom account.                          | Zoom Meeting Creation node config                                                         |
| The fallback email recipient is hardcoded to `dg3avt@gmail.com`; replace with dynamic lead email for production use.                    | Fallback email node configuration                                                         |
| Timezone detection logic is basic and can be extended with more countries or states as needed.                                            | Detect Lead Timezone code node                                                             |
| Google Gemini AI integration requires Google PaLM API credentials; ensure quota and billing are set up correctly.                        | Google Gemini Chat Model node                                                              |
| The workflow requires proper permissions for Zoho CRM API, Google Calendar API, Gmail API, Zoom API, and Google PaLM API.                | Integration setup instructions in Sticky Note1                                            |
| Add the Zoho webhook URL to Zoho CRM under Automation → Webhooks → Lead Created to trigger the workflow on lead creation.                | Zoho CRM webhook setup                                                                     |
| Meeting slots are generated in 30-minute increments with configurable buffers before and after meetings to avoid back-to-back overlaps. | Find Available Slots with Buffer code node                                                |
| All API credentials and OAuth tokens must be refreshed and maintained for uninterrupted operation.                                        | Credential maintenance best practices                                                     |

---

**Disclaimer:** The above documentation is extracted and interpreted solely from an n8n workflow JSON export, complying with current content policies and handling only legal, public data.