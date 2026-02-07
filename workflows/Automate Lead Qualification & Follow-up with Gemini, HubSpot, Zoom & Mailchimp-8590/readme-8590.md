Automate Lead Qualification & Follow-up with Gemini, HubSpot, Zoom & Mailchimp

https://n8nworkflows.xyz/workflows/automate-lead-qualification---follow-up-with-gemini--hubspot--zoom---mailchimp-8590


# Automate Lead Qualification & Follow-up with Gemini, HubSpot, Zoom & Mailchimp

### 1. Workflow Overview

This workflow automates lead qualification and follow-up processes by integrating Google Gemini AI, HubSpot CRM, Zoom, Mailchimp, Google Calendar, and a voice AI phone calling service (VAPI). It is designed to capture leads from either a WordPress form webhook or a native form trigger, classify leads as QUALIFIED or NOT QUALIFIED using AI, and then execute tailored follow-up actions based on the classification.

Logical blocks:

- **1.1 Input Reception:** Captures lead data via webhook or form submission.
- **1.2 Lead Qualification via AI:** Uses Google Gemini to classify incoming leads.
- **1.3 Decision Branching:** Routes leads to qualified or not qualified paths.
- **1.4 Qualified Lead Handling:** Initiates phone call, schedules meetings (Google Calendar + Zoom), updates Mailchimp and HubSpot, and sends confirmation emails.
- **1.5 Not Qualified Lead Handling:** Initiates phone call, adds to Mailchimp follow-up audience, sends follow-up email, updates HubSpot, and schedules a 30-day follow-up calendar event.
- **1.6 Call Result Retrieval:** Fetches call outcomes from VAPI for both qualified and not qualified leads.
- **1.7 Documentation:** Sticky note with full flow explanation and setup instructions.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
This block captures lead data submitted via either a WordPress form webhook or n8n’s built-in form trigger node. It serves as the entry point for the workflow.

**Nodes Involved:**  
- WordPress Form Trigger  
- On form submission  
- Initial Delay

**Node Details:**  

- **WordPress Form Trigger**  
  - Type: Webhook  
  - Role: Entry point capturing POST requests from WordPress form submissions at path `/wordpress-form`.  
  - Configuration: HTTP POST method, custom webhook path.  
  - Expressions: Extracts `name`, `email`, and `message` fields from payload.  
  - Connections: Outputs to Initial Delay node.  
  - Potential Failures: Webhook misconfiguration, incoming data missing expected fields, HTTP errors.  
  - Notes: Alternate trigger to "On form submission" node; only one should be active in production.

- **On form submission**  
  - Type: Form Trigger  
  - Role: Alternative entry point using n8n's built-in form capture.  
  - Configuration: Form titled "Contact us" with fields "Ajay", "email", and "Phone Number".  
  - Connections: Outputs to Initial Delay node.  
  - Potential Failures: Misconfigured form fields, missing data.  
  - Notes: Only one trigger node should be active in production.

- **Initial Delay**  
  - Type: Wait node  
  - Role: Introduces a minimal delay before processing to ensure data availability and avoid race conditions.  
  - Configuration: Default wait time (not explicitly set, defaults to immediate).  
  - Connections: Outputs to AI Lead Qualification node.  
  - Potential Failures: Delay misconfiguration or unnecessary wait; minimal risk.

---

#### 2.2 Lead Qualification via AI

**Overview:**  
Uses Google Gemini AI (PaLM API) to classify the lead as either QUALIFIED or NOT QUALIFIED based on submitted form data.

**Nodes Involved:**  
- AI Lead Qualification

**Node Details:**  

- **AI Lead Qualification**  
  - Type: Google Gemini (PaLM) via LangChain node  
  - Role: AI model evaluates lead info and outputs one of two strings: "QUALIFIED" or "NOT QUALIFIED".  
  - Configuration: Uses `models/gemini-2.5-flash`, system prompt defines role and output format strictly; messages include name, email, and message extracted dynamically from the form trigger node using expressions.  
  - Expressions:  
    - `{{$node['WordPress Form Trigger'].json.body.name || ''}}` for name  
    - Similar for email and message  
  - Connections: Outputs to Lead Decision node.  
  - Potential Failures: API quota limits, authentication errors, unexpected AI output, connection timeouts, malformed input.  
  - Credential: Google Gemini API credential required.

---

#### 2.3 Decision Branching

**Overview:**  
This block routes workflow execution based on AI classification result.

**Nodes Involved:**  
- Lead Decision

**Node Details:**  

- **Lead Decision**  
  - Type: If node  
  - Role: Checks AI output and routes to qualified or not qualified paths.  
  - Configuration: Compares AI output to string "QUALIFIED" (case sensitive, strict validation).  
  - Expressions: The condition is dynamically set to check the AI Lead Qualification result output (though actual condition leftValue and rightValue in JSON are blank—correct implementation should compare AI node output).  
  - Connections:  
    - True branch: Qualified Lead Delay node  
    - False branch: VAPI AI Call - Not Qualified node  
  - Potential Failures: Misconfigured condition leading to incorrect routing, expression evaluation failure.

---

#### 2.4 Qualified Lead Handling

**Overview:**  
Handles follow-up for qualified leads: initiates a phone call, schedules meetings, updates Mailchimp and HubSpot, and sends confirmation emails.

**Nodes Involved:**  
- Qualified Lead Delay  
- VAPI AI Call - Qualified  
- Get Qualified Call Results  
- Post-Call Delay  
- Schedule Meeting  
- Create Zoom Meeting  
- Qualified Lead Campaign  
- Meeting Confirmation Email  
- Update CRM - Qualified

**Node Details:**  

- **Qualified Lead Delay**  
  - Type: Wait node  
  - Role: Optional delay before initiating phone call.  
  - Configuration: Default wait time (not explicitly set).  
  - Connections: Outputs to VAPI AI Call - Qualified node.  
  - Potential Failures: Delay misconfiguration.

- **VAPI AI Call - Qualified**  
  - Type: HTTP Request  
  - Role: Initiates AI phone call outreach to qualified lead via VAPI service.  
  - Configuration: POST request to `https://api.vapi.ai/call/phone` with authorization header using VAPI API token credential. Timeout 30s, JSON response expected.  
  - Connections: Outputs to Get Qualified Call Results and Post-Call Delay nodes.  
  - Potential Failures: API errors, authentication failures, network timeouts.

- **Get Qualified Call Results**  
  - Type: HTTP Request  
  - Role: Polls VAPI API to retrieve results of the qualified lead call, using call ID from previous node.  
  - Configuration: GET request to `https://api.vapi.ai/call/{callId}`, headers include Authorization token.  
  - Connections: None downstream specified (end of call tracking).  
  - Potential Failures: Call ID missing, API errors.

- **Post-Call Delay**  
  - Type: Wait node  
  - Role: Delay after call before scheduling meeting.  
  - Configuration: Default or specified wait time.  
  - Connections: Outputs to Schedule Meeting node.  
  - Potential Failures: Delay misconfiguration.

- **Schedule Meeting**  
  - Type: Google Calendar node  
  - Role: Creates a calendar event for the sales consultation scheduled one day ahead from now, 10 am to 11 am.  
  - Configuration:  
    - Start: Now +1 day, 10:00 AM  
    - End: Now +1 day, 11:00 AM  
    - Calendar: linked to specific email account `aj@iovista.com`  
  - Credential: Google Calendar OAuth2 required.  
  - Connections: Outputs to Create Zoom Meeting node.  
  - Potential Failures: Calendar API errors, invalid timezones, credential errors.

- **Create Zoom Meeting**  
  - Type: Zoom node  
  - Role: Creates Zoom meeting for the sales consultation with topic including lead’s name.  
  - Configuration: Topic dynamically set using lead’s name from form data.  
  - Connections: Outputs to Qualified Lead Campaign node.  
  - Credential: Zoom OAuth required.  
  - Potential Failures: Zoom API rate limits, authentication failures.

- **Qualified Lead Campaign**  
  - Type: Mailchimp node  
  - Role: Adds qualified lead’s email to Mailchimp audience list for qualified leads.  
  - Configuration: Uses environment variable `MAILCHIMP_LIST_ID_QUALIFIED` for list ID, subscribes email from form data.  
  - Connections: Outputs to Meeting Confirmation Email node.  
  - Credential: Mailchimp API key required.  
  - Potential Failures: Invalid list ID, API key issues, email format errors.

- **Meeting Confirmation Email**  
  - Type: Gmail node  
  - Role: Sends personalized meeting confirmation email including Zoom link and meeting details to lead.  
  - Configuration:  
    - Recipient: `aj@iovista.com` (likely internal notification or sender alias)  
    - Message: Dynamic template with lead first name, meeting date/time, Zoom join URL, meeting ID, passcode.  
    - Subject: Includes meeting date one day from now.  
  - Credential: Gmail OAuth2 required.  
  - Connections: Outputs to Update CRM - Qualified node.  
  - Potential Failures: Email sending limits, invalid email addresses.

- **Update CRM - Qualified**  
  - Type: HubSpot node  
  - Role: Updates or creates contact in HubSpot CRM with qualified lead email.  
  - Configuration: Uses lead email from form data, authenticates via OAuth2.  
  - Connections: None downstream; end of qualified lead flow.  
  - Potential Failures: OAuth token expiration, API quota, contact update errors.

---

#### 2.5 Not Qualified Lead Handling

**Overview:**  
Handles follow-up for not qualified leads: initiates phone outreach, adds to follow-up Mailchimp list, sends follow-up email, updates HubSpot CRM, and schedules a 30-day follow-up calendar event.

**Nodes Involved:**  
- VAPI AI Call - Not Qualified  
- Get Follow-up Call Results  
- Follow-up Campaign  
- Follow-up Email  
- Update CRM - Not Qualified  
- Schedule Follow-up Calendar

**Node Details:**  

- **VAPI AI Call - Not Qualified**  
  - Type: HTTP Request  
  - Role: Initiates AI phone call outreach to not qualified leads via VAPI service.  
  - Configuration: Similar to qualified call node, sends request with authentication.  
  - Connections: Outputs to Get Follow-up Call Results and Follow-up Campaign nodes.  
  - Potential Failures: API errors, auth failures.

- **Get Follow-up Call Results**  
  - Type: HTTP Request  
  - Role: Polls VAPI API for call results using call ID from previous node.  
  - Configuration: GET request with authorization header, uses call ID from call node.  
  - Connections: None further downstream.  
  - Potential Failures: Missing call ID, API errors.

- **Follow-up Campaign**  
  - Type: Mailchimp node  
  - Role: Adds not qualified lead email to Mailchimp audience list for follow-up campaigns.  
  - Configuration: Uses environment variable `MAILCHIMP_LIST_ID_FOLLOWUP`, subscribes lead email.  
  - Connections: Outputs to Follow-up Email node.  
  - Potential Failures: Invalid list ID, API limits.

- **Follow-up Email**  
  - Type: Gmail node  
  - Role: Sends a nurturing follow-up email to not qualified lead.  
  - Configuration:  
    - Recipient: lead email from form submission  
    - Message: Thank you note with encouragement to stay connected and follow on social media.  
    - Subject: "Thank you for your interest - Stay connected"  
  - Credential: Gmail OAuth2 required.  
  - Connections: Outputs to Update CRM - Not Qualified node.  
  - Potential Failures: Email limits, invalid email.

- **Update CRM - Not Qualified**  
  - Type: HubSpot node  
  - Role: Updates or creates contact in HubSpot CRM for not qualified lead.  
  - Configuration: Uses lead email, OAuth2 authentication.  
  - Connections: Outputs to Schedule Follow-up Calendar node.  
  - Potential Failures: API quota, token expiration.

- **Schedule Follow-up Calendar**  
  - Type: Google Calendar node  
  - Role: Schedules a calendar event 30 days later as a reminder to follow up with not qualified lead.  
  - Configuration:  
    - Start: Now + 30 days, 14:00  
    - End: Now + 30 days, 14:30  
    - Calendar: No calendar explicitly set (empty string, needs setup).  
  - Credential: Google Calendar OAuth2 required.  
  - Connections: End of not qualified lead flow.  
  - Potential Failures: Missing calendar configuration, API errors.

---

#### 2.6 Call Result Retrieval

**Overview:**  
Separately queries the VAPI API for detailed outcomes of phone calls made to both qualified and not qualified leads.

**Nodes Involved:**  
- Get Qualified Call Results  
- Get Follow-up Call Results

**Node Details:**  

- Both nodes are HTTP Request types performing GET requests to VAPI API with call IDs obtained from respective call initiation nodes.  
- Configuration includes authentication using VAPI API token.  
- Purpose is to track call completion status and results for reporting or further automation (not explicitly connected downstream).  
- Potential Failures: Missing or invalid call IDs, API errors.

---

#### 2.7 Documentation

**Overview:**  
Contains detailed sticky note documentation embedded in the workflow, describing all workflow blocks, setup instructions, testing steps, and owner information.

**Nodes Involved:**  
- Flow Documentation (Sticky Note)

**Node Details:**  

- Type: Sticky Note  
- Content: Multi-section documentation covering overview, qualified and not qualified paths, credentials, environment variables, testing instructions, error handling tips, and contact info.  
- Position: Top-left corner as a reference node.  
- No connections.  
- Useful for maintainers and testers.

---

### 3. Summary Table

| Node Name                | Node Type             | Functional Role                                  | Input Node(s)             | Output Node(s)                    | Sticky Note                                                                                      |
|--------------------------|-----------------------|-------------------------------------------------|---------------------------|---------------------------------|------------------------------------------------------------------------------------------------|
| WordPress Form Trigger   | Webhook               | Capture lead data via webhook POST               | —                         | Initial Delay                   | Template: Lead Qualification & Follow‑up (Gemini)... Setup instructions inside.                 |
| On form submission       | Form Trigger          | Alternative form data capture                     | —                         | Initial Delay                   | Template: Lead Qualification & Follow‑up (Gemini)... Setup instructions inside.                 |
| Initial Delay            | Wait                  | Brief delay before AI processing                   | WordPress Form Trigger, On form submission | AI Lead Qualification          |                                                                                                |
| AI Lead Qualification    | Google Gemini (PaLM)  | AI classifies lead as QUALIFIED or NOT QUALIFIED | Initial Delay              | Lead Decision                  |                                                                                                |
| Lead Decision            | If                    | Routes based on AI classification                 | AI Lead Qualification      | Qualified Lead Delay (true), VAPI AI Call - Not Qualified (false) |                                                                                                |
| Qualified Lead Delay     | Wait                  | Optional delay before qualified lead call         | Lead Decision (true)       | VAPI AI Call - Qualified        |                                                                                                |
| VAPI AI Call - Qualified | HTTP Request          | Initiate phone call to qualified lead             | Qualified Lead Delay       | Get Qualified Call Results, Post-Call Delay |                                                                                                |
| Get Qualified Call Results| HTTP Request          | Fetch results of qualified lead phone call        | VAPI AI Call - Qualified  | —                               |                                                                                                |
| Post-Call Delay          | Wait                  | Delay after qualified lead call                    | VAPI AI Call - Qualified  | Schedule Meeting                |                                                                                                |
| Schedule Meeting         | Google Calendar       | Create calendar event for sales consultation      | Post-Call Delay            | Create Zoom Meeting             |                                                                                                |
| Create Zoom Meeting      | Zoom                  | Create Zoom meeting for consultation               | Schedule Meeting           | Qualified Lead Campaign         |                                                                                                |
| Qualified Lead Campaign  | Mailchimp             | Add qualified lead email to Mailchimp list        | Create Zoom Meeting        | Meeting Confirmation Email      | Adds qualified lead to Mailchimp audience. Replace {{$env.MAILCHIMP_LIST_ID_QUALIFIED}} with your list ID. |
| Meeting Confirmation Email| Gmail                 | Send meeting confirmation email                    | Qualified Lead Campaign    | Update CRM - Qualified          |                                                                                                |
| Update CRM - Qualified   | HubSpot               | Update/create qualified lead contact in CRM       | Meeting Confirmation Email | —                               |                                                                                                |
| VAPI AI Call - Not Qualified| HTTP Request        | Initiate phone call to not qualified lead          | Lead Decision (false)      | Get Follow-up Call Results, Follow-up Campaign |                                                                                                |
| Get Follow-up Call Results| HTTP Request          | Fetch results of not qualified lead phone call     | VAPI AI Call - Not Qualified| —                              |                                                                                                |
| Follow-up Campaign       | Mailchimp             | Add not qualified lead to Mailchimp follow-up list | VAPI AI Call - Not Qualified| Follow-up Email               | Adds not-qualified lead to Mailchimp audience. Replace {{$env.MAILCHIMP_LIST_ID_FOLLOWUP}} with your list ID. |
| Follow-up Email          | Gmail                 | Send nurturing follow-up email                      | Follow-up Campaign         | Update CRM - Not Qualified       |                                                                                                |
| Update CRM - Not Qualified| HubSpot               | Update/create not qualified lead contact in CRM    | Follow-up Email            | Schedule Follow-up Calendar      |                                                                                                |
| Schedule Follow-up Calendar| Google Calendar      | Schedule 30-day follow-up calendar reminder         | Update CRM - Not Qualified | —                               |                                                                                                |
| Flow Documentation       | Sticky Note           | Detailed workflow documentation                     | —                         | —                               | Full flow documentation, setup, testing, owner info, and notes.                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node:**
   - Create a **Webhook** node named `WordPress Form Trigger`.
   - Set HTTP Method to `POST`.
   - Set path to `/wordpress-form`.
   - Alternatively, create a **Form Trigger** node named `On form submission` with form title "Contact us" and fields: "Ajay", "email", "Phone Number".
   - Ensure only one of these triggers is active in production.

2. **Add Initial Delay:**
   - Add a **Wait** node named `Initial Delay`.
   - Connect trigger output to this node.
   - No specific wait time needed; default is acceptable.

3. **Add AI Lead Qualification:**
   - Add a **Google Gemini (PaLM)** node named `AI Lead Qualification`.
   - Use model ID: `models/gemini-2.5-flash`.
   - Set system prompt: "You are a lead qualification assistant. Based on the form submission, decide if the lead is QUALIFIED or NOT QUALIFIED. Output exactly one of: QUALIFIED or NOT QUALIFIED."
   - Include messages with dynamic content from trigger, e.g.,  
     - Name: `{{$node['WordPress Form Trigger'].json.body.name || ''}}`  
     - Email and Message similarly.
   - Connect `Initial Delay` to this node.
   - Configure with Google Gemini API credentials.

4. **Add Decision Branching:**
   - Add an **If** node named `Lead Decision`.
   - Configure condition: check if AI Lead Qualification output equals "QUALIFIED" (case sensitive, strict).
   - Connect AI Lead Qualification output to this node.

5. **Qualified Lead Path:**

   a. Add a **Wait** node named `Qualified Lead Delay` connected from the true output of `Lead Decision`.

   b. Add an **HTTP Request** node named `VAPI AI Call - Qualified`.
      - POST to `https://api.vapi.ai/call/phone`.
      - Add HTTP header: Authorization with Bearer token from VAPI API credentials.
      - Content-Type: application/json.
      - Connect `Qualified Lead Delay` to this node.

   c. Add an **HTTP Request** node `Get Qualified Call Results`.
      - GET from `https://api.vapi.ai/call/{{ $node['VAPI AI Call - Qualified'].json.id }}`.
      - Include Authorization header.
      - Connect from `VAPI AI Call - Qualified`.

   d. Add a **Wait** node `Post-Call Delay` connected from `VAPI AI Call - Qualified`.

   e. Add a **Google Calendar** node `Schedule Meeting`.
      - Set start time: now +1 day, 10:00 AM.
      - Set end time: now +1 day, 11:00 AM.
      - Select calendar (e.g., `aj@iovista.com`).
      - Connect from `Post-Call Delay`.
      - Use Google Calendar OAuth2 credentials.

   f. Add a **Zoom** node `Create Zoom Meeting`.
      - Set topic dynamically: "Sales Consultation - {{ $node['WordPress Form Trigger'].json.body.name }}".
      - Connect from `Schedule Meeting`.
      - Authenticate with Zoom OAuth.

   g. Add a **Mailchimp** node `Qualified Lead Campaign`.
      - Add subscriber to list `{{$env.MAILCHIMP_LIST_ID_QUALIFIED}}`.
      - Email from lead data.
      - Connect from `Create Zoom Meeting`.
      - Use Mailchimp API key credential.

   h. Add a **Gmail** node `Meeting Confirmation Email`.
      - Send email to lead or internal address (`aj@iovista.com`).
      - Subject: "Your Sales Consultation is Scheduled - {{ DateTime.now().plus({ days: 1 }).toFormat('MMM dd') }}".
      - Body includes meeting details and Zoom link from previous nodes.
      - Connect from `Qualified Lead Campaign`.
      - Use Gmail OAuth credentials.

   i. Add a **HubSpot** node `Update CRM - Qualified`.
      - Update or create contact using lead email.
      - Connect from `Meeting Confirmation Email`.
      - Authenticate with HubSpot OAuth2.

6. **Not Qualified Lead Path:**

   a. Add an **HTTP Request** node `VAPI AI Call - Not Qualified`.
      - Same configuration as qualified call node.
      - Connect from false output of `Lead Decision`.

   b. Add an **HTTP Request** node `Get Follow-up Call Results`.
      - GET from `https://api.vapi.ai/call/{{ $node['VAPI AI Call - Not Qualified'].json.id }}`.
      - Connect from `VAPI AI Call - Not Qualified`.

   c. Add a **Mailchimp** node `Follow-up Campaign`.
      - Add subscriber to list `{{$env.MAILCHIMP_LIST_ID_FOLLOWUP}}`.
      - Email from lead data.
      - Connect from `VAPI AI Call - Not Qualified`.

   d. Add a **Gmail** node `Follow-up Email`.
      - Send nurturing follow-up email to lead email.
      - Subject: "Thank you for your interest - Stay connected".
      - Connect from `Follow-up Campaign`.
      - Use Gmail OAuth credentials.

   e. Add a **HubSpot** node `Update CRM - Not Qualified`.
      - Update/create contact with lead email.
      - Connect from `Follow-up Email`.
      - Authenticate with HubSpot OAuth2.

   f. Add a **Google Calendar** node `Schedule Follow-up Calendar`.
      - Schedule event 30 days later, 14:00-14:30.
      - Connect from `Update CRM - Not Qualified`.
      - Use Google Calendar OAuth2.

7. **Add Sticky Note:**
   - Add a sticky note node named `Flow Documentation`.
   - Paste detailed workflow overview, setup instructions, testing steps, owner info, and notes.

8. **Set Environment Variables:**
   - `MAILCHIMP_LIST_ID_QUALIFIED` with Mailchimp list ID for qualified leads.
   - `MAILCHIMP_LIST_ID_FOLLOWUP` with Mailchimp list ID for follow-up leads.

9. **Configure Credentials:**
   - Google Gemini (PaLM) API with appropriate API key.
   - VAPI API token.
   - Gmail OAuth2 account.
   - HubSpot OAuth2 credentials.
   - Zoom OAuth.
   - Google Calendar OAuth2.
   - Mailchimp API key.

10. **Activate workflow and conduct tests:**
    - Submit test data via webhook or form.
    - Verify AI classification and branching.
    - Confirm phone call initiation, calendar events, emails, CRM updates, and Mailchimp subscriptions.
    - Monitor logs for errors or timeouts.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                  | Context or Link                                                                                                      |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| Template: Lead Qualification & Follow-up (Gemini) captures leads via webhook or form, qualifies with Gemini, and branches to qualified/not qualified paths.  | Workflow overview in sticky note node.                                                                               |
| Setup requires credentials for Google Gemini, Gmail, HubSpot, Zoom, Google Calendar, and VAPI.                                                                | Workflow prerequisites.                                                                                              |
| Environment variables `MAILCHIMP_LIST_ID_QUALIFIED` and `MAILCHIMP_LIST_ID_FOLLOWUP` must be set for Mailchimp integration.                                 | Environment setup.                                                                                                   |
| Only one trigger node (Webhook or Form Trigger) should be active in production to prevent double processing.                                                  | Important deployment note.                                                                                           |
| Testing instructions: submit test data, check AI decision, verify all downstream actions (calls, calendar, emails, CRM, Mailchimp).                          | Testing and debugging guidance.                                                                                      |
| Emails and delays should be adjusted to your timezone and personal preferences.                                                                                | Customization advice.                                                                                                |
| For errors, review execution logs and expand error messages per node.                                                                                        | Troubleshooting advice.                                                                                              |
| Owner: Ajay Yadav (ackm04@gmail.com)                                                                                                                         | Contact for support or questions.                                                                                   |
| Workflow last updated: 2025-09-15                                                                                                                             | Versioning information.                                                                                              |

---

**Disclaimer:** This text is extracted exclusively from an n8n automated workflow. It complies fully with applicable content policies and contains no illegal, offensive, or protected material. All data processed is legal and public.