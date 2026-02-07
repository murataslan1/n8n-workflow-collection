AI-Powered Restaurant Booking System with Telegram, Calendar & Email Notifications

https://n8nworkflows.xyz/workflows/ai-powered-restaurant-booking-system-with-telegram--calendar---email-notifications-7769


# AI-Powered Restaurant Booking System with Telegram, Calendar & Email Notifications

### 1. Workflow Overview

This workflow is an **AI-powered Restaurant Booking System** designed to automate restaurant table reservations via **Telegram**, with integration for **Google Calendar** event creation and **email notifications**. It uses AI to conduct a natural conversational booking experience, collecting reservation details in multiple steps, confirming the booking with the user, then finalizing and notifying through calendar and email.

The workflow consists of these logical blocks:

- **1.1 Input Reception & AI Processing:** Captures user messages from Telegram and processes them with AI agents to understand intent and gather booking information.

- **1.2 Conversation Management and Decision Routing:** Uses AI memory and output parsers to maintain context, parse structured data, and decide between booking or feedback flows.

- **1.3 Booking Finalization:** Once booking details are confirmed, this block formats the data, creates a Google Calendar event, sends a confirmation email, and notifies the user on Telegram.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & AI Processing

**Overview:**  
This block receives Telegram messages and employs AI language models and memory to engage the user in a stepwise conversational flow to collect reservation details.

**Nodes Involved:**  
- Telegram Trigger  
- Information Gathering Agent  
- Simple Memory  
- OpenAI Chat Model  
- OpenAI Chat Model1  
- Auto-fixing Output Parser  
- Structured Output Parser

**Node Details:**

- **Telegram Trigger**  
  - Type: Telegram Trigger node  
  - Role: Listens for new user messages in the Telegram bot to initiate the workflow.  
  - Config: Listens for "message" updates only.  
  - Inputs: None (trigger)  
  - Outputs: User message JSON to AI agent  
  - Failure Modes: Telegram API connectivity or webhook issues  
  - Notes: Requires Telegram Bot Token credentials and webhook setup.

- **Information Gathering Agent**  
  - Type: Langchain AI Agent node  
  - Role: Acts as the conversational agent to interact step-by-step with the user, gathering booking details.  
  - Config: Custom prompt defining behavior as a warm, polite restaurant concierge. Outputs structured JSON with booking progress and messages.  
  - Inputs: Telegram Trigger output, AI memory, and language models  
  - Outputs: JSON with `is_pass_next` flag and message content for next step or booking confirmation  
  - Failure Modes: AI API failures, parsing errors, unexpected user input  
  - Version: 1.8  
  - Notes: Uses input expressions like `{{ $json.message.text }}` and timestamps for time zone assumptions.

- **Simple Memory**  
  - Type: Langchain Memory Buffer Window node  
  - Role: Maintains conversational context per Telegram chat session (using chat id as session key).  
  - Config: Context window length 15 messages  
  - Inputs: Telegram Trigger  
  - Outputs: Memory context to Information Gathering Agent  
  - Failure Modes: Memory overflow or session key collision

- **OpenAI Chat Model**  
  - Type: Langchain OpenAI Chat Model node  
  - Role: Provides AI language understanding and response generation (using model "o3-mini").  
  - Config: Model selected as "o3-mini" for efficient chat completions  
  - Inputs: Information Gathering Agent (ai_languageModel)  
  - Outputs: AI-generated text  
  - Failure Modes: API key/auth errors, rate limits, network issues

- **OpenAI Chat Model1**  
  - Type: Langchain OpenAI Chat Model node  
  - Role: Another AI model instance (model "gpt-4.1-mini") for refined output generation.  
  - Inputs: Auto-fixing Output Parser (ai_languageModel)  
  - Outputs: Text passed to Structured Output Parser  
  - Failure Modes: Same as above

- **Auto-fixing Output Parser**  
  - Type: Langchain Output Parser Autofixing node  
  - Role: Attempts to correct AI-generated output automatically to meet schema expectations.  
  - Inputs: OpenAI Chat Model1 output  
  - Outputs: Cleaned JSON for Information Gathering Agent  
  - Failure Modes: Parsing failures if output badly formatted

- **Structured Output Parser**  
  - Type: Langchain Output Parser Structured node  
  - Role: Validates and enforces output schema (boolean `is_pass_next` and string `message`).  
  - Inputs: OpenAI Chat Model1 output  
  - Outputs: Parsed JSON for next flow decision  
  - Failure Modes: Schema mismatch or parsing errors

---

#### 2.2 Conversation Management and Decision Routing

**Overview:**  
This block decides whether the user's message corresponds to a booking or feedback, sends appropriate Telegram responses, and prepares booking data for final processing.

**Nodes Involved:**  
- Switch  
- Telegram1  
- Telegram  
- Edit Fields

**Node Details:**

- **Switch**  
  - Type: Switch node  
  - Role: Routes workflow based on the boolean `is_pass_next` value from AI output:  
    - `true` → Booking path  
    - `false` → Feedback path  
  - Inputs: Information Gathering Agent output  
  - Outputs: Two branches: Booking and Feedback  
  - Failure Modes: Missing or malformed input JSON

- **Telegram1**  
  - Type: Telegram node  
  - Role: Sends acknowledgment message for feedback or non-booking flow.  
  - Config: Fixed text thanking user for confirmation and indicating email to follow  
  - Inputs: Switch node (Feedback branch)  
  - Outputs: Edit Fields node initiation for booking fallback (rare)  
  - Failure Modes: Telegram API or chat ID missing

- **Telegram**  
  - Type: Telegram node  
  - Role: Sends message with booking draft summary for user confirmation.  
  - Config: Text dynamically pulled from Information Gathering Agent's output message  
  - Inputs: Switch node (Booking branch)  
  - Outputs: None further in this branch  
  - Failure Modes: Telegram API failures

- **Edit Fields**  
  - Type: Set node  
  - Role: Prepares and assigns booking data as stringified JSON (`user_data`) for downstream processing.  
  - Config: Assigns `user_data` from Switch output's message field  
  - Inputs: Telegram1 node  
  - Outputs: Booking Agent node  
  - Failure Modes: Expression evaluation errors if message field missing

---

#### 2.3 Booking Finalization

**Overview:**  
This block finalizes the booking by generating calendar events and confirmation emails, creating calendar entries, sending emails, and confirming completion on Telegram.

**Nodes Involved:**  
- Booking Agent  
- OpenAI Chat Model2  
- Structured Output Parser1  
- Google Calendar  
- Send a message (Gmail)  
- Telegram3

**Node Details:**

- **Booking Agent**  
  - Type: Langchain AI Agent node  
  - Role: Processes finalized booking details, generates a structured calendar event and formatted confirmation email HTML body.  
  - Config: Custom prompt defining output JSON with calendar_event and email objects including ISO 8601 timestamps, email formatting, and default 2-hour duration.  
  - Inputs: Edit Fields output (`user_data`)  
  - Outputs: JSON structured data for calendar and email  
  - Failure Modes: AI API errors, output parsing issues  
  - Version: 1.8

- **OpenAI Chat Model2**  
  - Type: Langchain OpenAI Chat Model node  
  - Role: Supports Booking Agent with AI language generation (model "gpt-4.1-mini").  
  - Inputs: Booking Agent ai_languageModel input  
  - Outputs: Structured Output Parser1 input  
  - Failure Modes: API issues

- **Structured Output Parser1**  
  - Type: Langchain Output Parser Structured node  
  - Role: Validates and parses Booking Agent's AI output JSON against expected schema with calendar_event and email fields.  
  - Inputs: OpenAI Chat Model2 output  
  - Outputs: Google Calendar and Send a message nodes  
  - Failure Modes: Parsing or schema validation errors

- **Google Calendar**  
  - Type: Google Calendar node  
  - Role: Creates a calendar event with start/end times, summary, color, and attendees based on booking data.  
  - Config: Uses calendar "techcupid28@gmail.com", disables default reminders, sets event color "7".  
  - Inputs: Structured Output Parser1 output  
  - Outputs: None (side effect)  
  - Failure Modes: Google API auth errors, event creation failures

- **Send a message (Gmail)**  
  - Type: Gmail node  
  - Role: Sends the confirmation email to the user with subject and HTML body from Booking Agent output.  
  - Config: Uses Gmail credentials, dynamically sets recipient, subject, and message body.  
  - Inputs: Structured Output Parser1 output  
  - Outputs: Telegram3 for final user notification  
  - Failure Modes: SMTP auth errors, invalid email address

- **Telegram3**  
  - Type: Telegram node  
  - Role: Sends a final confirmation message to the user on Telegram indicating successful booking completion.  
  - Config: Static message praising the booking success and inviting further contact.  
  - Inputs: Send a message (Gmail) output  
  - Outputs: None  
  - Failure Modes: Telegram API or chat ID missing

---

### 3. Summary Table

| Node Name               | Node Type                                    | Functional Role                                  | Input Node(s)               | Output Node(s)                       | Sticky Note                                                                                                                |
|-------------------------|----------------------------------------------|-------------------------------------------------|-----------------------------|------------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| Telegram Trigger        | Telegram Trigger                             | Receives user messages from Telegram             | None                        | Information Gathering Agent        | See "Telegram Trigger & AI Agent Flow" sticky note                                                                        |
| Information Gathering Agent | Langchain AI Agent                          | Conversational AI agent gathering booking info   | Telegram Trigger, Simple Memory, OpenAI Chat Model, Auto-fixing Output Parser | Switch                             | See "Telegram Trigger & AI Agent Flow" sticky note                                                                        |
| Simple Memory           | Langchain Memory Buffer Window               | Maintains conversational context per session     | Telegram Trigger            | Information Gathering Agent (ai_memory) | See "Telegram Trigger & AI Agent Flow" sticky note                                                                        |
| OpenAI Chat Model       | Langchain OpenAI Chat Model                   | Provides AI language generation                    | Information Gathering Agent  | Information Gathering Agent (ai_languageModel) | See "Telegram Trigger & AI Agent Flow" sticky note                                                                        |
| OpenAI Chat Model1      | Langchain OpenAI Chat Model                   | AI model for output refinement                     | Auto-fixing Output Parser   | Auto-fixing Output Parser (ai_languageModel) | See "Telegram Trigger & AI Agent Flow" sticky note                                                                        |
| Auto-fixing Output Parser | Langchain Output Parser Autofixing           | Autocorrects AI output to expected schema          | OpenAI Chat Model1          | Information Gathering Agent (ai_outputParser) | See "Telegram Trigger & AI Agent Flow" sticky note                                                                        |
| Structured Output Parser | Langchain Output Parser Structured            | Validates AI output schema                          | OpenAI Chat Model1          | Auto-fixing Output Parser (ai_outputParser) | See "Telegram Trigger & AI Agent Flow" sticky note                                                                        |
| Switch                  | Switch                                        | Routes flow based on booking confirmation flag    | Information Gathering Agent | Telegram1 (Feedback), Telegram (Booking) | See "Switch, Telegram & Edit Fields" sticky note                                                                          |
| Telegram1               | Telegram                                      | Sends feedback acknowledgment on Telegram          | Switch                     | Edit Fields                        | See "Switch, Telegram & Edit Fields" sticky note                                                                          |
| Telegram                | Telegram                                      | Sends booking draft message on Telegram            | Switch                     | None                             | See "Switch, Telegram & Edit Fields" sticky note                                                                          |
| Edit Fields             | Set                                           | Prepares booking data for final processing          | Telegram1                  | Booking Agent                     | See "Switch, Telegram & Edit Fields" sticky note                                                                          |
| Booking Agent           | Langchain AI Agent                            | Finalizes booking, generates calendar and email data | Edit Fields                | Google Calendar, Send a message   | See "Booking Agent, Google Calendar, Gmail & Telegram" sticky note                                                       |
| OpenAI Chat Model2      | Langchain OpenAI Chat Model                   | AI model for final booking data generation          | Booking Agent              | Structured Output Parser1          | See "Booking Agent, Google Calendar, Gmail & Telegram" sticky note                                                       |
| Structured Output Parser1 | Langchain Output Parser Structured            | Validates booking agent output schema                | OpenAI Chat Model2          | Google Calendar, Send a message   | See "Booking Agent, Google Calendar, Gmail & Telegram" sticky note                                                       |
| Google Calendar         | Google Calendar                              | Creates calendar event for booking                   | Structured Output Parser1   | None                             | See "Booking Agent, Google Calendar, Gmail & Telegram" sticky note                                                       |
| Send a message          | Gmail                                         | Sends confirmation email                             | Structured Output Parser1   | Telegram3                        | See "Booking Agent, Google Calendar, Gmail & Telegram" sticky note                                                       |
| Telegram3               | Telegram                                      | Sends final confirmation message to user            | Send a message             | None                             | See "Booking Agent, Google Calendar, Gmail & Telegram" sticky note                                                       |
| Sticky Note             | Sticky Note                                   | Documentation / overview                             | None                      | None                             | Contains full workflow overview and instructions                                                                          |
| Sticky Note1            | Sticky Note                                   | Explains Telegram Trigger & AI Agent flow           | None                      | None                             | See Telegram Trigger & AI Agent Flow                                                                                      |
| Sticky Note2            | Sticky Note                                   | Details Switch, Telegram & Edit Fields logic         | None                      | None                             | See Switch, Telegram & Edit Fields                                                                                         |
| Sticky Note3            | Sticky Note                                   | Describes Booking Agent, Google Calendar, Gmail & Telegram finalization | None                      | None                             | See Booking Agent, Google Calendar, Gmail & Telegram                                                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node:**  
   - Type: Telegram Trigger  
   - Configure to listen for message updates only.  
   - Connect Telegram Bot credentials.  
   - Position: Start of workflow.

2. **Create Simple Memory Node:**  
   - Type: Langchain Memory Buffer Window  
   - Set session key to `={{ $json.message.chat.id }}`  
   - Context window length: 15  
   - Connect output of Telegram Trigger to Simple Memory's input (ai_memory).

3. **Create OpenAI Chat Model Node:**  
   - Type: Langchain OpenAI Chat Model  
   - Select model: "o3-mini" or equivalent lightweight model  
   - Connect Simple Memory output to this node's input (ai_languageModel).

4. **Create Auto-fixing Output Parser Node:**  
   - Type: Langchain Output Parser Autofixing  
   - Use default options.  
   - Connect OpenAI Chat Model output to this node.

5. **Create OpenAI Chat Model1 Node:**  
   - Type: Langchain OpenAI Chat Model  
   - Select model: "gpt-4.1-mini" or equivalent powerful model  
   - Connect Auto-fixing Output Parser output to this node (ai_languageModel).

6. **Create Structured Output Parser Node:**  
   - Type: Langchain Output Parser Structured  
   - Define schema: `{ "is_pass_next": "boolean", "message": "string" }`  
   - Connect OpenAI Chat Model1 output to this node.

7. **Create Information Gathering Agent Node:**  
   - Type: Langchain AI Agent  
   - Configure with prompt text (per workflow) to conduct a polite, stepwise reservation conversation.  
   - Set output parser to the Auto-fixing Output Parser node.  
   - Connect:  
     - Telegram Trigger main output → Agent main input  
     - Simple Memory ai_memory output → Agent ai_memory input  
     - OpenAI Chat Model ai_languageModel output → Agent ai_languageModel input  
     - Auto-fixing Output Parser ai_outputParser output → Agent ai_outputParser input

8. **Create Switch Node:**  
   - Type: Switch  
   - Set condition on `={{ $json.output.is_pass_next }}` boolean:  
     - True → "Booking" output  
     - False → "Feedback" output  
   - Connect Information Gathering Agent main output to Switch input.

9. **Create Telegram1 Node (Feedback Path):**  
   - Type: Telegram  
   - Static text: "Thank you for your confirmation! We have noted down your information. You will be getting confirmation mail soon."  
   - Use `={{ $json.message.chat.id }}` for chatId.  
   - Connect Switch "Feedback" output to Telegram1 input.

10. **Create Edit Fields Node:**  
    - Type: Set  
    - Assign `user_data` field: `={{ $json.output.message }}` from Switch output.  
    - Connect Telegram1 main output to Edit Fields input.

11. **Create Booking Agent Node:**  
    - Type: Langchain AI Agent  
    - Configure prompt with instructions to generate a structured calendar event and formatted email HTML using input `user_data`.  
    - Output parser: Structured Output Parser1 (to be created).  
    - Connect Edit Fields main output to Booking Agent main input.

12. **Create OpenAI Chat Model2 Node:**  
    - Type: Langchain OpenAI Chat Model  
    - Model: "gpt-4.1-mini"  
    - Connect Booking Agent ai_languageModel input.

13. **Create Structured Output Parser1 Node:**  
    - Type: Langchain Output Parser Structured  
    - Example JSON schema includes calendar_event and email objects with fields such as start_time, end_time, to, subject, html_body, description.  
    - Connect OpenAI Chat Model2 output to this node.

14. **Create Google Calendar Node:**  
    - Type: Google Calendar  
    - Configure calendar with your calendar email (e.g., "techcupid28@gmail.com").  
    - Map start and end times from parsed output calendar_event.  
    - Set event summary to email description.  
    - Add attendees from email to field.  
    - Disable default reminders.  
    - Connect Structured Output Parser1 output to Google Calendar input.

15. **Create Send a message Node (Gmail):**  
    - Type: Gmail  
    - Configure credentials for Gmail SMTP.  
    - Set recipient to `={{ $json.output.email.to }}`  
    - Subject from `={{ $json.output.email.subject }}`  
    - Message body from `={{ $json.output.email.html_body }}` (HTML format)  
    - Connect Structured Output Parser1 output to Gmail node.

16. **Create Telegram3 Node:**  
    - Type: Telegram  
    - Static confirmation message indicating successful booking and prompting user for questions.  
    - Chat ID from `={{ $('Telegram Trigger').item.json.message.chat.id }}`  
    - Connect Gmail node main output to Telegram3 input.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                            | Context or Link                                                                                         |
|---------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| This workflow is an end-to-end AI-powered restaurant reservation assistant integrating Telegram, AI language models, Google Calendar, and Gmail SMTP.   | Workflow Overview Sticky Note                                                                          |
| Telegram messages trigger the conversation with an AI agent that remembers prior context using a memory buffer window.                                  | Sticky Note1                                                                                           |
| Switch node routes user input to either booking or feedback flows, with messaging adapted accordingly.                                                  | Sticky Note2                                                                                           |
| Final booking details are formatted by an AI agent, creating calendar events and professional confirmation emails, followed by final Telegram notice.  | Sticky Note3                                                                                           |
| Requires credentials setup: Telegram Bot Token, OpenAI or OpenRouter API Key, Google Calendar API access, and Gmail SMTP credentials.                   | Workflow Overview Sticky Note                                                                          |
| For best results, ensure time zone consistency in AI prompts and calendar configurations.                                                              | AI prompt notes inside Information Gathering Agent and Booking Agent nodes                             |
| Email confirmation includes a fully formatted HTML body with reservation details and special instructions.                                             | Booking Agent prompt example                                                                            |
| For further customization, adjust AI model parameters and prompt texts within the Langchain agent nodes.                                               | See AI agent nodes configuration                                                                       |

---

**Disclaimer:** The provided text is extracted exclusively from an automated n8n workflow. The content complies strictly with content policies and includes no illegal, offensive, or protected elements. All data handled is legal and public.