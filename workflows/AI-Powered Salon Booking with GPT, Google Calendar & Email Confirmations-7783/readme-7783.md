AI-Powered Salon Booking with GPT, Google Calendar & Email Confirmations

https://n8nworkflows.xyz/workflows/ai-powered-salon-booking-with-gpt--google-calendar---email-confirmations-7783


# AI-Powered Salon Booking with GPT, Google Calendar & Email Confirmations

### 1. Workflow Overview

This workflow, titled **"AI-Powered Salon Booking with GPT, Google Calendar & Email Confirmations"**, automates salon appointment scheduling via a conversational AI assistant. It is designed to handle booking requests from users, guide them through step-by-step information gathering, confirm details, create calendar events, and send email confirmations — all fully automated.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Initial Processing**  
  Receives booking requests via a Webhook and passes user messages to an AI agent for conversational processing.

- **1.2 AI Conversation Management & Memory**  
  Manages the conversational state and context using AI language models and memory buffers, ensuring smooth multi-turn dialogue.

- **1.3 Decision Routing (Booking vs Feedback)**  
  Evaluates user input to decide if the flow continues towards booking confirmation or alternative paths such as feedback handling.

- **1.4 Booking Finalization & Preparation**  
  Processes confirmed booking data, formats it, and prepares a structured booking object.

- **1.5 Booking Agent Processing**  
  Uses AI to generate a Google Calendar event object and a professional HTML confirmation email based on finalized booking details.

- **1.6 Integration with Google Calendar & Email**  
  Creates the calendar event in Google Calendar and sends the confirmation email via Gmail.

- **1.7 Webhook Responses**  
  Sends appropriate responses back to the user through the webhook depending on the booking state (confirmation, acknowledgment).

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Initial Processing

- **Overview:**  
  This block starts the workflow by listening for user booking messages through a Webhook, then forwards the messages to an AI agent for conversational understanding.

- **Nodes Involved:**  
  - Webhook  
  - Information Gathering Agent  

- **Node Details:**

  - **Webhook**  
    - *Type:* HTTP Webhook Trigger  
    - *Configuration:* Listens on POST method at a unique path; configured to respond with a node output.  
    - *Input:* External HTTP request containing user message.  
    - *Output:* JSON payload forwarded to the Information Gathering Agent.  
    - *Potential Failures:* Webhook misconfiguration, network issues, invalid HTTP payloads.

  - **Information Gathering Agent**  
    - *Type:* LangChain AI Agent (Conversation Agent)  
    - *Configuration:*  
      - Role: Salon Reservation Agent for Glow & Grace Salon.  
      - Behavior: Warm, polite, stepwise questioning to collect booking info (service type, stylist, date/time, special requests).  
      - Outputs structured JSON with booking draft or final user details.  
      - Uses prompt with detailed instructions and example responses.  
    - *Key Expressions:*  
      - User input extracted from webhook JSON paths.  
      - Outputs `is_pass_next` boolean to indicate when booking details are complete and ready to pass to next stage.  
    - *Input:* User message JSON from Webhook node.  
    - *Output:* JSON with `is_pass_next` and `message` fields.  
    - *Version Requirements:* Supports AI output parsing (v1.8).  
    - *Potential Failures:* AI model errors, prompt misunderstanding, malformed user inputs.

---

#### 1.2 AI Conversation Management & Memory

- **Overview:**  
  Maintains conversational context using memory buffers and output parsers to ensure coherent multi-turn interaction.

- **Nodes Involved:**  
  - Simple Memory  
  - OpenAI Chat Model  
  - Auto-fixing Output Parser  
  - Structured Output Parser  

- **Node Details:**

  - **Simple Memory**  
    - *Type:* LangChain Memory Buffer Window  
    - *Configuration:* Uses a session key derived from chat or webhook session ID to keep conversation context of recent 15 messages.  
    - *Input:* Output from OpenAI Chat Model.  
    - *Output:* Contextualized input to Information Gathering Agent.  
    - *Potential Failures:* Session key misidentification, memory overflow.

  - **OpenAI Chat Model**  
    - *Type:* LangChain OpenAI Chat Model Integration  
    - *Configuration:* Uses "o3-mini" model variant optimized for chat completion.  
    - *Input:* User messages and conversation history from Simple Memory.  
    - *Output:* AI-generated chat response JSON.  
    - *Potential Failures:* API key/auth errors, rate limits, network timeouts.

  - **Auto-fixing Output Parser**  
    - *Type:* LangChain Output Parser with Auto-correction  
    - *Configuration:* Automatically fixes minor output format inconsistencies from the AI model to ensure downstream compatibility.  
    - *Input:* Raw AI model output.  
    - *Output:* Cleaned and structured JSON.  
    - *Potential Failures:* Parsing errors if output is severely malformed.

  - **Structured Output Parser**  
    - *Type:* LangChain Structured Output Parser  
    - *Configuration:* Validates output against a manual schema (`is_pass_next` boolean, `message` string).  
    - *Input:* Output from Auto-fixing Output Parser.  
    - *Output:* Validated structured data for routing decisions.  
    - *Potential Failures:* Schema validation failures if AI output deviates from expected format.

---

#### 1.3 Decision Routing (Booking vs Feedback)

- **Overview:**  
  Routes the workflow logic based on whether the AI determined the input is a booking confirmation or feedback.

- **Nodes Involved:**  
  - Switch  
  - Respond to Webhook1  
  - Respond to Webhook  

- **Node Details:**

  - **Switch**  
    - *Type:* Conditional Router  
    - *Configuration:* Routes based on `output.is_pass_next` boolean from AI output:  
      - `true` → Booking path  
      - `false` → Feedback path  
    - *Input:* AI output JSON with `is_pass_next`.  
    - *Output:* Two branches for booking and feedback.  
    - *Potential Failures:* Incorrect boolean interpretation, misrouting.

  - **Respond to Webhook1** (Booking path)  
    - *Type:* Webhook Response Node  
    - *Configuration:* Sends acknowledgement text confirming receipt of booking info and next steps.  
    - *Input:* From Switch node on Booking branch.  
    - *Output:* Text response to user webhook call.  
    - *Potential Failures:* Response delivery errors.

  - **Respond to Webhook** (Feedback path)  
    - *Type:* Webhook Response Node  
    - *Configuration:* Sends the AI agent's feedback message directly as text response.  
    - *Input:* From Switch node on Feedback branch.  
    - *Output:* Text response to user webhook call.  
    - *Potential Failures:* Response delivery errors.

---

#### 1.4 Booking Finalization & Preparation

- **Overview:**  
  Prepares and formats the finalized booking details to be passed downstream for calendar and email generation.

- **Nodes Involved:**  
  - Edit Fields  

- **Node Details:**

  - **Edit Fields**  
    - *Type:* Set Node (Data Transformation)  
    - *Configuration:* Extracts the booking confirmation message from the switch node output and stores it in a new field `user_data`.  
    - *Input:* From Respond to Webhook1 node (Booking path).  
    - *Output:* Enriched JSON with `user_data` field containing booking details.  
    - *Potential Failures:* Missing or malformed booking data.

---

#### 1.5 Booking Agent Processing

- **Overview:**  
  Uses AI to generate a structured calendar event and a beautifully formatted HTML email confirmation based on booking details.

- **Nodes Involved:**  
  - Booking Agent  
  - OpenAI Chat Model2  
  - Structured Output Parser1  

- **Node Details:**

  - **Booking Agent**  
    - *Type:* LangChain AI Agent  
    - *Configuration:*  
      - Role: Booking Agent for Glow & Grace Salon.  
      - Task: Create Google Calendar event object and confirmation email HTML using input `user_data`.  
      - Output format strictly defined JSON with `calendar_event` and `email` objects.  
      - Includes business-specific logic for service durations and formatting.  
    - *Key Expressions:* Uses input from Edit Fields node (`user_data`).  
    - *Input:* Booking data JSON.  
    - *Output:* Structured JSON with calendar event and email details.  
    - *Potential Failures:* AI model misformatting, missing fields, incorrect date/time formatting.

  - **OpenAI Chat Model2**  
    - *Type:* LangChain OpenAI Chat Model  
    - *Configuration:* Uses "gpt-4.1-mini" model variant for advanced generation.  
    - *Input:* Prompt from Booking Agent node.  
    - *Output:* AI-generated booking confirmation and calendar event JSON.  
    - *Potential Failures:* API errors, rate limiting.

  - **Structured Output Parser1**  
    - *Type:* LangChain Output Parser  
    - *Configuration:* Validates AI output against an example JSON schema defining calendar event and email structure.  
    - *Input:* AI output from OpenAI Chat Model2.  
    - *Output:* Validated structured booking confirmation.  
    - *Potential Failures:* Schema mismatch, parser errors.

---

#### 1.6 Integration with Google Calendar & Email

- **Overview:**  
  Creates the appointment in Google Calendar and sends a professional email confirmation to the user.

- **Nodes Involved:**  
  - Google Calendar  
  - Send a message (Gmail)  

- **Node Details:**

  - **Google Calendar**  
    - *Type:* Google Calendar Node  
    - *Configuration:*  
      - Creates an event with start and end times from AI output.  
      - Sets event summary, attendees, and color coding.  
      - Uses a specific calendar email address (`anuj@sapahk.ai`).  
    - *Input:* Booking Agent output JSON fields for calendar event and email description.  
    - *Output:* Google Calendar event confirmation.  
    - *Potential Failures:* API authentication errors, date/time formatting issues, calendar access permissions.

  - **Send a message (Gmail)**  
    - *Type:* Gmail Send Email Node  
    - *Configuration:*  
      - Sends email to recipient address specified by AI output.  
      - Uses subject and HTML body generated by Booking Agent.  
      - Configured with Gmail credentials.  
    - *Input:* Email details from Booking Agent output.  
    - *Output:* Email sent confirmation.  
    - *Potential Failures:* SMTP authentication errors, invalid email addresses, email sending limits.

---

#### 1.7 Webhook Responses

- **Overview:**  
  Sends the final confirmation or feedback messages back to the user via the webhook response.

- **Nodes Involved:**  
  - Respond to Webhook  
  - Respond to Webhook1  

- **Node Details:**

  - These nodes are already covered under block 1.3 and serve to finalize the user interaction by delivering appropriate messages.

---

### 3. Summary Table

| Node Name                 | Node Type                               | Functional Role                                      | Input Node(s)             | Output Node(s)            | Sticky Note                                                                                                  |
|---------------------------|---------------------------------------|-----------------------------------------------------|---------------------------|---------------------------|--------------------------------------------------------------------------------------------------------------|
| Webhook                   | n8n-nodes-base.webhook                 | Receives booking requests from external users       | —                         | Information Gathering Agent |                                                                                                              |
| Information Gathering Agent| @n8n/n8n-nodes-langchain.agent        | Conversational AI for collecting booking info       | Webhook                   | Switch                    |                                                                                                              |
| Simple Memory             | @n8n/n8n-nodes-langchain.memoryBufferWindow | Maintains conversation context                        | OpenAI Chat Model          | Information Gathering Agent |                                                                                                              |
| OpenAI Chat Model          | @n8n/n8n-nodes-langchain.lmChatOpenAi | Generates AI chat completions                         | Simple Memory              | Auto-fixing Output Parser  |                                                                                                              |
| Auto-fixing Output Parser  | @n8n/n8n-nodes-langchain.outputParserAutofixing | Auto-corrects AI output format                        | OpenAI Chat Model1         | Information Gathering Agent |                                                                                                              |
| Structured Output Parser   | @n8n/n8n-nodes-langchain.outputParserStructured | Validates AI output schema                            | Auto-fixing Output Parser  | Information Gathering Agent |                                                                                                              |
| Switch                    | n8n-nodes-base.switch                  | Routes booking vs feedback based on AI decision      | Information Gathering Agent| Respond to Webhook1 / Respond to Webhook |                                                                                                              |
| Respond to Webhook1        | n8n-nodes-base.respondToWebhook        | Acknowledges booking confirmation                     | Switch (Booking path)      | Edit Fields               |                                                                                                              |
| Respond to Webhook         | n8n-nodes-base.respondToWebhook        | Sends feedback or non-booking messages                | Switch (Feedback path)     | —                         |                                                                                                              |
| Edit Fields               | n8n-nodes-base.set                     | Formats and prepares booking details for next step   | Respond to Webhook1        | Booking Agent             |                                                                                                              |
| Booking Agent             | @n8n/n8n-nodes-langchain.agent        | Generates calendar event & email confirmation content| Edit Fields                | Google Calendar, Send a message |                                                                                                              |
| OpenAI Chat Model2          | @n8n/n8n-nodes-langchain.lmChatOpenAi | AI model for booking agent                            | Booking Agent              | Structured Output Parser1  |                                                                                                              |
| Structured Output Parser1  | @n8n/n8n-nodes-langchain.outputParserStructured | Validates booking agent AI output                     | OpenAI Chat Model2         | Booking Agent             |                                                                                                              |
| Google Calendar           | n8n-nodes-base.googleCalendar          | Creates calendar event                                | Booking Agent              | Send a message            |                                                                                                              |
| Send a message            | n8n-nodes-base.gmail                   | Sends the booking confirmation email                 | Booking Agent              | —                         |                                                                                                              |
| Sticky Note               | n8n-nodes-base.stickyNote              | Documentation and overview notes                      | —                         | —                         | See sticky note content in Section 5                                                                        |
| Sticky Note1              | n8n-nodes-base.stickyNote              | Telegram Trigger & AI Agent Flow explanation          | —                         | —                         | See sticky note content in Section 5                                                                        |
| Sticky Note2              | n8n-nodes-base.stickyNote              | Switch Node & Respond/ Edit Fields explanation        | —                         | —                         | See sticky note content in Section 5                                                                        |
| Sticky Note3              | n8n-nodes-base.stickyNote              | Booking Agent, Google Calendar & Gmail explanation    | —                         | —                         | See sticky note content in Section 5                                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: `Webhook`  
   - HTTP Method: `POST`  
   - Path: Unique identifier (e.g., `1306a6cb-608a-471a-a84b-f07f981c67da`)  
   - Response Mode: `Response Node` (to respond later)  
   - This node receives booking requests from users.

2. **Add OpenAI Chat Model Node** (for conversation)  
   - Type: `@n8n/n8n-nodes-langchain.lmChatOpenAi`  
   - Model: Select `o3-mini` (lightweight chat model)  
   - No options needed  
   - Used to generate AI conversation responses.

3. **Add Simple Memory Node** (to maintain dialog context)  
   - Type: `@n8n/n8n-nodes-langchain.memoryBufferWindow`  
   - Session Key: Expression `{{$json?.message?.chat?.id || $json?.body?.sessionId}}` to identify user session  
   - Context Window Length: 15 messages  
   - Connect OpenAI Chat Model output to this memory node and then to the agent node.

4. **Add Auto-fixing Output Parser Node**  
   - Type: `@n8n/n8n-nodes-langchain.outputParserAutofixing`  
   - No special options, auto-correct AI output.

5. **Add Structured Output Parser Node**  
   - Type: `@n8n/n8n-nodes-langchain.outputParserStructured`  
   - Input Schema: JSON with `"is_pass_next": "boolean"` and `"message": "string"` fields  
   - Validates output format from AI.

6. **Add Information Gathering Agent Node**  
   - Type: `@n8n/n8n-nodes-langchain.agent`  
   - Prompt: Define role as Salon Reservation Agent, stepwise question flow (service, stylist, date/time, notes), with example messages and final output structure including `is_pass_next`.  
   - Input: Connect from Structured Output Parser  
   - Output: JSON with booking or feedback info.

7. **Add Switch Node**  
   - Type: `Switch`  
   - Condition: Check `{{$json.output.is_pass_next}}` boolean  
   - If `true`: route to booking confirmation flow  
   - If `false`: route to feedback or other flow.

8. **Add Respond to Webhook1 Node** (Booking confirmation acknowledgment)  
   - Type: `Respond to Webhook`  
   - Response Body: Text "Thank you for your confirmation! We have noted down your information. You will be getting confirmation mail soon."  
   - Connect from Switch node Booking path.

9. **Add Edit Fields Node**  
   - Type: `Set`  
   - Assign new field `user_data` with value: `{{$json.output.message}}` from Switch node output.  
   - Connect from Respond to Webhook1 node.

10. **Add Booking Agent Node**  
    - Type: `@n8n/n8n-nodes-langchain.agent`  
    - Prompt: Role as Booking Agent, task to create Google Calendar event and confirmation email HTML, with detailed instructions and output JSON format including `calendar_event` and `email` objects.  
    - Input: `user_data` field from Edit Fields node.

11. **Add OpenAI Chat Model2 Node**  
    - Type: `@n8n/n8n-nodes-langchain.lmChatOpenAi`  
    - Model: `gpt-4.1-mini` for higher quality generation.  
    - Connect from Booking Agent node.

12. **Add Structured Output Parser1 Node**  
    - Type: `@n8n/n8n-nodes-langchain.outputParserStructured`  
    - JSON Schema Example: Define calendar event and email structure as per Booking Agent's expected output.  
    - Connect from OpenAI Chat Model2.

13. **Add Google Calendar Node**  
    - Type: `Google Calendar`  
    - Calendar: Use the salon’s calendar email (e.g., `anuj@sapahk.ai`)  
    - Start and End Time: Use expressions to pull from parsed booking event JSON (`calendar_event.start_time` and `calendar_event.end_time`)  
    - Summary: Use `email.description` field  
    - Attendees: Use `email.to` array  
    - Disable default reminders.  
    - Connect from Booking Agent.

14. **Add Send a message (Gmail) Node**  
    - Type: `Gmail`  
    - Send To: `email.to` from booking output  
    - Subject: `email.subject`  
    - Message: `email.html_body` (HTML content)  
    - Connect from Booking Agent.

15. **Add Respond to Webhook Node** (Feedback path)  
    - Type: `Respond to Webhook`  
    - Response Body: Use AI output message directly for feedback or other non-booking interactions.  
    - Connect from Switch node Feedback path.

16. **Make Connections:**  
    - Connect Webhook → Information Gathering Agent  
    - Information Gathering Agent → Switch  
    - Switch Booking → Respond to Webhook1 → Edit Fields → Booking Agent → Google Calendar & Send a message  
    - Switch Feedback → Respond to Webhook  
    - Chain AI models and parsers as per memory and output parsing nodes.

17. **Configure Credentials:**  
    - OpenAI API key (or OpenRouter) for all LangChain OpenAI Chat Model nodes and Agents.  
    - Google Calendar OAuth2 credentials for Google Calendar node.  
    - Gmail OAuth2 or SMTP credentials for Send a message node.

18. **Test the Workflow:**  
    - Trigger webhook with sample booking requests.  
    - Verify conversation flow, booking confirmation, calendar event creation, and email receipt.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Context or Link                                 |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------|
| This workflow is an **AI-powered Salon Booking Assistant** automating hair, beauty, and spa appointment scheduling using conversational AI, Google Calendar, and email confirmations. It is triggered via Webhook calls, making it suitable for website or mobile app integrations.                                                                                                                                                                                                                                                                                                                                                      | See main Sticky Note in workflow.               |
| The AI conversation flow is carefully designed with a warm, polite, and professional tone, mimicking a friendly salon receptionist to enhance user experience. The AI asks step-by-step questions and confirms all details before finalizing bookings.                                                                                                                                                                                                                                                                                                                                                                               | Sticky Note1 content.                            |
| The Switch node cleanly bifurcates the flow into booking versus feedback, allowing extensibility for future feedback handling or other user intents.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Sticky Note2 content.                            |
| The Booking Agent node uses advanced AI to produce structured JSON for calendar events and email HTML, including salon-specific business logic like default service durations and formatting. This ensures bookings are accurately reflected in Google Calendar and communicated professionally via email.                                                                                                                                                                                                                                                                                                                             | Sticky Note3 content.                            |
| For proper operation, ensure all API keys and OAuth2 credentials (OpenAI, Google Calendar, Gmail) are correctly configured and have necessary permissions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Credentials requirements in main overview.      |
| Time zones are assumed to be the salon’s local time zone for all date/time processing. Inputs and outputs use ISO 8601 (RFC3339) format for interoperability.                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Mentioned in prompts for agents.                 |
| Helpful references for n8n nodes and LangChain integration:  
  - n8n Docs: https://docs.n8n.io/  
  - LangChain Node Docs: https://docs.n8n.io/integrations/nodes/langchain/  
  - OpenAI API: https://platform.openai.com/docs/api-reference/introduction  
  - Google Calendar API: https://developers.google.com/calendar/api  
  - Gmail API: https://developers.google.com/gmail/api                                                                                                                                                                                                                                                                                                                                                                                   | External API documentation links.               |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.