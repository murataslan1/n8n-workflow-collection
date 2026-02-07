Automate HVAC Service Scheduling with AI Agent, Google Calendar and Gmail

https://n8nworkflows.xyz/workflows/automate-hvac-service-scheduling-with-ai-agent--google-calendar-and-gmail-9974


# Automate HVAC Service Scheduling with AI Agent, Google Calendar and Gmail

### 1. Workflow Overview

This workflow automates HVAC service appointment scheduling for ABC HVAC Services by integrating an AI scheduling agent with Google Calendar and Gmail.  
It handles customer requests received via a webhook (e.g., from a voice or text agent), processes those requests with an AI agent that orchestrates calendar checks, bookings, rescheduling, cancellations, and logging. The workflow also sends confirmation emails and internal notifications asynchronously after bookings.

**Logical blocks:**

- **1.1 Input Reception:** Receives external customer requests via a webhook.  
- **1.2 AI Processing & Decision Making:** The core AI-powered Receptionist Agent that uses memory and OpenAI language model to analyze requests and decide which calendar or logging tools to invoke.  
- **1.3 Google Calendar Operations:** Nodes to check availability, find existing events, book, reschedule, and cancel appointments on Google Calendar.  
- **1.4 Lead Logging:** Logs appointment and customer data into a Google Sheet for record-keeping and triggers the confirmation workflow.  
- **1.5 Post-Booking Confirmation Pipeline:** Triggered asynchronously by new rows in the log sheet, generates and sends personalized confirmation emails via an LLM, waits, then sends internal notifications via Google Chat.  
- **1.6 Webhook Response:** Returns AI-generated natural language responses back to the original requester.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  Waits for incoming HTTP POST requests containing customer scheduling data, typically from an external voice or chat agent.

- **Nodes Involved:**  
  - `webhook_trigger`

- **Node Details:**  
  - **webhook_trigger**  
    - Type: Webhook (HTTP POST trigger)  
    - Config: Path set to a unique webhook ID, HTTP method POST, synchronous response mode.  
    - Inputs: External HTTP requests  
    - Outputs: Forwards request data to the Receptionist Agent  
    - Edge Cases: Invalid HTTP methods, malformed JSON body, network latency or timeouts.

#### 2.2 AI Processing & Decision Making

- **Overview:**  
  The core AI logic block that interprets incoming requests, maintains conversational context, and decides which calendar or logging tools to invoke based on strict execution rules embedded in its system prompt.

- **Nodes Involved:**  
  - `simple-memory`  
  - `OpenAI Chat Model`  
  - `think`  
  - `Receptionist`

- **Node Details:**  
  - **simple-memory**  
    - Type: LangChain Memory Buffer Window  
    - Role: Maintains short-term conversation history keyed by the client IP address for context retention over multiple interactions.  
    - Config: Uses the IP address (`x-real-ip` header) as custom session key, context window length of 10 messages.  
    - Edge Cases: IP spoofing could mix sessions, memory overflow if context too large.

  - **OpenAI Chat Model**  
    - Type: LangChain OpenAI Chat Model (GPT-4o-mini)  
    - Role: Generates language understanding and responses for the AI agent.  
    - Config: Uses OpenAI API credential, model `gpt-4o-mini`.  
    - Edge Cases: API rate limits, authentication failures, model unavailability.

  - **think**  
    - Type: LangChain tool for internal reasoning  
    - Role: Used by the AI agent to carefully analyze requests before tool invocation. Mandatory before every tool call.  
    - Inputs: Invoked internally by Receptionist for reflection.  
    - Edge Cases: Tool call failures or timeouts.

  - **Receptionist**  
    - Type: LangChain Agent  
    - Role: Central AI agent that:  
      - Receives customer request data  
      - Uses system prompt with detailed roles, execution rules, and tool constraints  
      - Calls appropriate tools (`check_calendar`, `book_appointment`, `log_lead`, etc.) in sequence  
      - Ensures date/time are valid ISO 8601 strings in Asia/Kolkata timezone  
      - Handles booking, rescheduling, cancellation, verification workflows according to strict rules  
      - Returns natural language responses to the caller  
    - Configuration Highlights:  
      - System message defines role, tool access, date/time handling, and execution rules.  
      - Uses current date/time context with `$now.format()`  
      - Parses and manages tool usage count constraints  
    - Inputs: Customer request body from webhook, memory, OpenAI model, think tool  
    - Outputs: Natural language response to `respond_to_webhook` node  
    - Edge Cases: Improper request data, missing required fields, date parsing errors, tool misuse (e.g., multiple bookings), API failures.

#### 2.3 Google Calendar Operations

- **Overview:**  
  Provides all calendar-related functionality: checking availability, booking, finding existing events, rescheduling, and canceling HVAC service appointments. All operations respect the fixed 2-hour service duration and IST timezone.

- **Nodes Involved:**  
  - `check_calendar`  
  - `book_appointment`  
  - `find_old_event`  
  - `reschedule_appointment`  
  - `cancel_appointment`

- **Node Details:**  
  - **check_calendar**  
    - Type: Google Calendar Tool (get availability)  
    - Role: Checks availability for a 2-hour time slot on the technician's calendar.  
    - Config:  
      - Timezone: Asia/Kolkata  
      - Time window: Start and end times derived dynamically (end = start + 2 hours) via AI expressions  
      - Calendar: Specific Gmail calendar for HVAC appointments  
    - Inputs: Start time from AI agent  
    - Outputs: Availability info sent back to Receptionist  
    - Edge Cases: Calendar API rate limits, timezone errors, invalid time ranges.

  - **book_appointment**  
    - Type: Google Calendar Tool (create event)  
    - Role: Books a 2-hour HVAC service appointment event with customer details.  
    - Config:  
      - Start/End time from AI  
      - Summary includes customer name  
      - Attendees set to customer's email  
      - Description set to customer issue  
      - Calendar: HVAC service Gmail calendar  
    - Edge Cases: Double bookings, invalid times, API failures.

  - **find_old_event**  
    - Type: Google Calendar Tool (search events)  
    - Role: Finds existing appointment events by searching with the customer's email.  
    - Config:  
      - Query: Customer email from request body  
      - Returns all matching events ordered by start time  
    - Edge Cases: Multiple events returned, no events found, API errors.

  - **reschedule_appointment**  
    - Type: Google Calendar Tool (update event)  
    - Role: Updates the date/time of an existing appointment identified by Event ID.  
    - Config:  
      - Event ID dynamically provided by AI agent (extracted from find_old_event)  
      - New start/end times from AI agent (2 hours apart, IST)  
    - Edge Cases: Invalid Event ID, conflicting schedules, API errors.

  - **cancel_appointment**  
    - Type: Google Calendar Tool (delete event)  
    - Role: Deletes an existing appointment by Event ID.  
    - Config:  
      - Event ID from AI agent (from find_old_event)  
    - Edge Cases: Invalid Event ID, deletion failures, API errors.

#### 2.4 Lead Logging

- **Overview:**  
  Logs customer and appointment details into a centralized Google Sheet to keep records and trigger asynchronous post-booking workflows.

- **Nodes Involved:**  
  - `log_lead`  
  - `log_lead_trigger`

- **Node Details:**  
  - **log_lead**  
    - Type: Google Sheets Tool (append row)  
    - Role: Appends a new row with customer name, email, address, service issue, appointment date/time, and timestamps.  
    - Config:  
      - Document ID and sheet specified  
      - Uses dynamic values from request body and AI expressions  
      - Mapping respects defined schema columns  
    - Edge Cases: Sheet access permission errors, data format mismatches, duplicate entries.

  - **log_lead_trigger**  
    - Type: Google Sheets Trigger  
    - Role: Fires when a new row is added to the HVAC log sheet, triggering post-booking confirmation workflow.  
    - Config:  
      - Polls every minute for new rows  
      - Same document and sheet as `log_lead`  
    - Edge Cases: Delays in polling, missing rows, trigger duplication.

#### 2.5 Post-Booking Confirmation Pipeline

- **Overview:**  
  Runs asynchronously after a successful booking is logged. Generates a personalized confirmation email using the Anthropic Claude LLM, sends it via Gmail, waits 2 minutes, then alerts internal teams via Google Chat.

- **Nodes Involved:**  
  - `Compose a mail`  
  - `booking_confirmation`  
  - `Wait`  
  - `message_team`

- **Node Details:**  
  - **Compose a mail**  
    - Type: Anthropic LLM (claude-opus-4-20250514)  
    - Role: Generates the body of a customer confirmation email from logged appointment data.  
    - Config:  
      - Input template includes customer name, date, time, and service issue  
      - Output constrained to exclude subject, salutations, or signature  
      - Converts date/time to natural language format for email clarity  
    - Edge Cases: API limits, incomplete data, format errors.

  - **booking_confirmation**  
    - Type: Gmail  
    - Role: Sends the generated confirmation email to the customer’s email address.  
    - Config:  
      - Recipient email from `log_lead_trigger` output  
      - Subject preset to "re: Appointment Booked with ABC HVAC Services!"  
      - Email type: plain text  
    - Edge Cases: Gmail API authentication, spam filtering, invalid email addresses.

  - **Wait**  
    - Type: Wait/Delay node  
    - Role: Pauses workflow for 2 minutes before sending internal notifications.  
    - Config: 2 minutes delay  
    - Edge Cases: Workflow timeout if delayed excessively.

  - **message_team**  
    - Type: Google Chat message  
    - Role: Sends an internal alert message to a Google Chat space notifying the team of the new appointment.  
    - Config:  
      - Space ID (to be configured)  
      - OAuth2 authentication  
      - Message text customizable  
    - Edge Cases: Chat API auth errors, incorrect space ID.

#### 2.6 Webhook Response

- **Overview:**  
  Sends the AI agent’s natural language response back through the webhook to the original requester, closing the request loop.

- **Nodes Involved:**  
  - `respond_to_webhook`

- **Node Details:**  
  - **respond_to_webhook**  
    - Type: Respond to Webhook  
    - Role: Returns the final AI-generated message (confirmation, suggestion, or error) to the external calling client.  
    - Config: Default response mode, no additional customization.  
    - Edge Cases: Network errors, response timeouts.

---

### 3. Summary Table

| Node Name           | Node Type                         | Functional Role                                       | Input Node(s)          | Output Node(s)                       | Sticky Note                                                                                         |
|---------------------|----------------------------------|-----------------------------------------------------|------------------------|------------------------------------|---------------------------------------------------------------------------------------------------|
| webhook_trigger     | Webhook                          | Receives external customer requests                 | -                      | Receptionist                       | ## Webhook Trigger: Starting point for external HTTP POST requests.                               |
| simple-memory       | LangChain Memory Buffer Window   | Maintains short-term conversation context           | webhook_trigger        | Receptionist                       | AI Agent Core Logic & Tool Constraints: Manages conversation history keyed by client IP.          |
| OpenAI Chat Model   | LangChain OpenAI Chat Model      | Provides LLM language understanding and generation | simple-memory          | Receptionist                       | AI Agent Core Logic & Tool Constraints: Uses GPT-4o-mini model for request processing.             |
| think               | LangChain Tool                  | Internal AI reasoning before tool calls             | Receptionist (internal) | Receptionist                       | AI Agent Core Logic & Tool Constraints: Mandatory reasoning before each tool call.                 |
| Receptionist        | LangChain Agent                 | Core AI agent orchestrating logic and tools         | webhook_trigger, simple-memory, OpenAI Chat Model, think, calendar tools | respond_to_webhook | AI Agent Core Logic & Tool Constraints: Enforces strict execution rules and tool usage limits.    |
| check_calendar      | Google Calendar Tool             | Checks availability of 2-hour HVAC service slots    | Receptionist           | Receptionist                      | AI Agent Core Logic & Tool Constraints: Must find at least 2 available slots if possible.          |
| find_old_event      | Google Calendar Tool             | Finds existing appointment events by customer email | Receptionist           | Receptionist                      | Event ID Lookup: Required for reschedule, cancel, verify booking workflows.                        |
| book_appointment    | Google Calendar Tool             | Books new HVAC service appointment                   | Receptionist           | Receptionist                      | AI Agent Core Logic & Tool Constraints: Only one booking per request allowed.                      |
| reschedule_appointment | Google Calendar Tool          | Updates existing appointment time                    | Receptionist           | Receptionist                      | AI Agent Core Logic & Tool Constraints: Requires Event ID from find_old_event.                     |
| cancel_appointment  | Google Calendar Tool             | Deletes existing appointment                          | Receptionist           | Receptionist                      | AI Agent Core Logic & Tool Constraints: Requires Event ID from find_old_event.                     |
| log_lead            | Google Sheets Tool               | Logs appointment and customer info                   | Receptionist           | -                                | Lead Logging: Must be called once after successful booking or reschedule.                         |
| log_lead_trigger    | Google Sheets Trigger            | Triggers post-booking confirmation workflow         | -                      | Compose a mail, Wait              | Trigger: Fires on new row in HVAC log sheet post booking.                                         |
| Compose a mail      | Anthropic LLM                   | Generates personalized confirmation email content   | log_lead_trigger       | booking_confirmation              | Email Generation & Confirmation Send: Generates email body with correct date/time formatting.      |
| booking_confirmation | Gmail                          | Sends confirmation email to customer                 | Compose a mail         | -                                | Email Generation & Confirmation Send: Uses Gmail OAuth2 to send email.                            |
| Wait                | Wait/Delay                      | Pauses workflow before internal notification        | log_lead_trigger       | message_team                     | Internal Alert Delay & Notification: 2-minute delay before sending internal Google Chat alert.    |
| message_team        | Google Chat                     | Sends internal notification to team                  | Wait                   | -                                | Internal Alert Delay & Notification: Alerts team about new appointment in Google Chat space.       |
| respond_to_webhook  | Respond to Webhook              | Sends AI response back to original requester         | Receptionist           | -                                | Respond to Webhook: Final node sending AI's message back to external client.                      |
| Sticky Note (various) | Sticky Note                   | Documentation and explanation nodes                  | -                      | -                                | See notes section for detailed descriptions and workflow guidance.                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Trigger Node:**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: Unique identifier (e.g., "4fe15a31-6365-4b96-a3d5-3b02bbe3d31a")  
   - Response Mode: Response Node

2. **Add simple-memory Node:**  
   - Type: LangChain Memory Buffer Window  
   - Session Key: `=={{ $('webhook_trigger').item.json.headers['x-real-ip'] }}`  
   - Session ID Type: Custom Key  
   - Context Window Length: 10

3. **Add OpenAI Chat Model Node:**  
   - Type: LangChain OpenAI Chat Model  
   - Model: `gpt-4o-mini`  
   - Credentials: OpenAI API key

4. **Add think Node:**  
   - Type: LangChain Tool (Think)  
   - No additional parameters

5. **Add Receptionist Agent Node:**  
   - Type: LangChain Agent  
   - Text Input: `=## Request Data\n\n{{ JSON.stringify($json.body, null, 2)}}`  
   - System Message: Use detailed prompt specifying role, tool access, execution rules, date/time handling (as per overview)  
   - Prompt Type: Define  
   - Connect inputs:  
     - AI Language Model: OpenAI Chat Model  
     - AI Memory: simple-memory  
     - AI Tool: think  
     - AI Tool: Google Calendar Tools (to be added next)  
     - AI Tool: log_lead node (to be created)  
   - Credentials: None (uses linked credentials in tools)

6. **Add Google Calendar Tools:**  
   - check_calendar:  
     - Operation: Get availability  
     - Calendar: HVAC Gmail calendar  
     - Timezone: Asia/Kolkata  
     - TimeMin: AI expression for start time  
     - TimeMax: AI expression for end time (+2 hours)  
     - Credential: Google Calendar OAuth2  
   - find_old_event:  
     - Operation: Get all events  
     - Query: Customer email from request body  
     - Calendar: HVAC Gmail calendar  
     - Credential: Google Calendar OAuth2  
   - book_appointment:  
     - Operation: Create event  
     - Calendar: HVAC Gmail calendar  
     - Start/End: From AI expressions  
     - Summary: "Service appointment with {{ customer_name }}"  
     - Attendees: Customer email  
     - Description: Customer issue  
     - Credential: Google Calendar OAuth2  
   - reschedule_appointment:  
     - Operation: Update event  
     - Calendar: HVAC Gmail calendar  
     - Event ID: From AI expression (extracted event id)  
     - Start/End: From AI expressions  
     - Credential: Google Calendar OAuth2  
   - cancel_appointment:  
     - Operation: Delete event  
     - Calendar: HVAC Gmail calendar  
     - Event ID: From AI expression  
     - Credential: Google Calendar OAuth2  

7. **Add Google Sheets Tool (log_lead):**  
   - Operation: Append row  
   - Document ID: HVAC log lead Google Sheet  
   - Sheet Name: gid=0  
   - Columns: Date (today), Email, Address, Customer Name, Service Issue, Call Timestamp, Appointment Date & Time — all mapped from request and AI expressions  
   - Credential: Google Sheets OAuth2  

8. **Connect all above tools as AI Tools for Receptionist:**  
   - Connect check_calendar, find_old_event, book_appointment, reschedule_appointment, cancel_appointment, think, log_lead as AI tools input to Receptionist node.

9. **Add respond_to_webhook Node:**  
   - Type: Respond to Webhook  
   - Connect output of Receptionist node to respond_to_webhook input.  

10. **Create Post-Booking Confirmation Sub-Workflow:**  
    - Trigger: Google Sheets Trigger  
      - Event: rowAdded  
      - Document ID and Sheet same as log_lead  
      - Poll interval: every minute  
      - Credentials: Google Sheets OAuth2  
    - Compose a mail (Anthropic LLM):  
      - Model: `claude-opus-4-20250514`  
      - Messages configured with system prompt to generate email body from booking data  
      - Credentials: Anthropic API  
    - booking_confirmation (Gmail node):  
      - Recipient: Email from trigger output  
      - Subject: Fixed subject line  
      - Message: Output from Compose a mail  
      - Credentials: Gmail OAuth2  
    - Wait node:  
      - Duration: 2 minutes  
    - message_team (Google Chat):  
      - Space ID: Configure as per team chat  
      - Authentication: OAuth2  
      - Message: Custom text alerting internal team  
      - Credentials: Google Chat OAuth2  

11. **Connect Post-Booking Nodes:**  
    - log_lead_trigger output → Compose a mail and Wait nodes in parallel  
    - Compose a mail output → booking_confirmation  
    - Wait output → message_team  

12. **Add Sticky Notes to document each block with instructions and constraints, as per original workflow for maintainability.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                  | Context or Link                                                                                       |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| This workflow is branded as "HVAC Scheduling Agent" for ABC HVAC Services, designed to automate appointment management with strict AI tool usage rules to prevent errors.                                                                                                                                       | Workflow branding                                                                                     |
| The AI Agent uses a detailed system prompt to enforce critical execution rules for booking, rescheduling, cancellation, and availability checks, ensuring robust and predictable behavior.                                                                                                                        | System prompt in Receptionist Agent                                                                  |
| All times and dates are handled in ISO 8601 format with Asia/Kolkata timezone (IST), and all appointments are fixed to 2 hours duration.                                                                                                                                                                      | Date/time handling rules                                                                              |
| After successful booking or rescheduling, the workflow logs the lead and triggers an asynchronous confirmation email and internal notification sequence to ensure customer communication and team alerts are reliably processed.                                                                                  | Post-booking confirmation pipeline                                                                   |
| The workflow includes multiple sticky notes explaining each block and node group for maintainability and clarity.                                                                                                                                                                                             | Sticky notes included inside workflow                                                                |
| For support or questions, connect with the workflow author on LinkedIn: [https://www.linkedin.com/in/bhuvaneshhhh/](https://www.linkedin.com/in/bhuvaneshhhh/)                                                                                                                                                | Author contact                                                                                       |

---

**Disclaimer:** The provided text is exclusively derived from an n8n automated workflow. It fully complies with current content policies and contains no illegal, offensive, or protected material. All handled data is lawful and publicly available.