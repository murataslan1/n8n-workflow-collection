Automate WhatsApp Customer Support with Voice Transcription, FAQ & Appointment Scheduling

https://n8nworkflows.xyz/workflows/automate-whatsapp-customer-support-with-voice-transcription--faq---appointment-scheduling-8454


# Automate WhatsApp Customer Support with Voice Transcription, FAQ & Appointment Scheduling

### 1. Workflow Overview

This workflow automates WhatsApp customer support by handling voice transcription, FAQ responses, service information delivery, and appointment scheduling via Google Calendar. It is designed for businesses such as clinics, salons, repair shops, or consultants that want to streamline customer interactions on WhatsApp without manual intervention.

The workflow is logically divided into these blocks:

- **1.1 Input Reception and Routing:** Receives incoming WhatsApp messages and routes them based on content type (text vs voice).
- **1.2 Voice Message Processing:** Downloads and transcribes voice notes into text for further AI processing.
- **1.3 Context Setting:** Extracts and sets conversation metadata needed for personalized responses.
- **1.4 AI Customer Service Agent:** Uses a LangChain-based AI agent with integrated tools to handle FAQs, service inquiries, scheduling, and booking.
- **1.5 Data Lookup Tools:** Google Sheets nodes that provide FAQ and service details databases.
- **1.6 Appointment Scheduling:** Google Calendar nodes to check for availability and create bookings.
- **1.7 WhatsApp Reply Sending:** Sends all AI-generated replies back to the customer on WhatsApp.
- **1.8 Memory Management:** Maintains conversation context history for better AI interaction.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Routing

**Overview:**  
This block listens for all incoming WhatsApp messages and filters out non-message events. It routes messages to different branches depending on whether they are text or audio messages.

**Nodes Involved:**  
- WhatsApp Message Received  
- Is Message?  
- Chat Router  
- No Operation, do nothing

**Node Details:**  
- **WhatsApp Message Received**  
  - Type: WhatsApp Trigger  
  - Role: Entry point webhook that triggers on any WhatsApp message or status update.  
  - Config: Listens to all message status updates; filters on "messages" update type.  
  - Credentials: WhatsApp API credentials required.  
  - Outputs: Connects to "Is Message?" node.  
  - Potential Issues: Webhook misconfiguration, credential expiration, WhatsApp API limits.

- **Is Message?**  
  - Type: If node  
  - Role: Checks if the incoming webhook event contains a message (filters out non-message events).  
  - Config: Condition verifies if a "from" field exists in the first message object.  
  - Outputs: True branch leads to "Chat Router", false branch to "No Operation, do nothing".  
  - Edge Cases: Messages without "from" field, malformed JSON.

- **Chat Router**  
  - Type: Switch node  
  - Role: Routes incoming messages based on type - "text" or "audio".  
  - Config: Switches on message type field `$json.messages[0].type`.  
  - Outputs: "text" branch to "Agent Context"; "voice" branch to "Download Voice".  
  - Edge Cases: Unsupported message types, missing type field.

- **No Operation, do nothing**  
  - Type: NoOp  
  - Role: Terminates workflow silently for non-message events.

---

#### 2.2 Voice Message Processing

**Overview:**  
Handles voice notes by downloading the audio from WhatsApp, then transcribing it into text using OpenAI’s audio transcription model for downstream AI processing.

**Nodes Involved:**  
- Download Voice  
- Get Audio  
- Transcribe audio  
- Agent Context (used after transcription to unify flow)

**Node Details:**  
- **Download Voice**  
  - Type: WhatsApp node  
  - Role: Retrieves media URL for the audio message using media ID from WhatsApp message.  
  - Config: Uses media ID from `$json.messages[0].audio.id`.  
  - Credentials: WhatsApp API credentials.  
  - Output: JSON with audio URL for next node.  
  - Error Risks: Media ID missing, WhatsApp API errors, network issues.

- **Get Audio**  
  - Type: HTTP Request  
  - Role: Downloads the actual audio file from the URL obtained.  
  - Config: Uses predefined WhatsApp API credential for authentication.  
  - Output: Audio file stream sent to transcription node.  
  - Edge Cases: Download failures, auth errors.

- **Transcribe audio**  
  - Type: OpenAI Audio Transcription (LangChain node)  
  - Role: Converts audio file to text.  
  - Config: Uses OpenAI transcription model with raw audio input.  
  - Credentials: OpenAI API key required.  
  - Output: Transcribed text attached to JSON for next node.  
  - Failure Modes: Audio format unsupported, API rate limits, transcription errors.

- **Agent Context**  
  - Context setting node, reused after transcription for uniform downstream processing.

---

#### 2.3 Context Setting

**Overview:**  
Extracts key metadata from the incoming message (phone number, sender, text content) to prepare inputs for the AI agent.

**Nodes Involved:**  
- Agent Context

**Node Details:**  
- **Agent Context**  
  - Type: Set node  
  - Role: Extracts and assigns `chat_id` (phone_number_id), `from` (sender’s WhatsApp ID), `text` (message body or transcribed text).  
  - Config: Uses expressions to pull data from the original or transcribed message JSON.  
  - Output: Structured JSON with essential context fields for AI agent.  
  - Edge Cases: Missing fields, empty text.

---

#### 2.4 AI Customer Service Agent

**Overview:**  
Central AI node that handles customer queries by invoking integrated tools for FAQ lookup, service info, scheduling, and appointment creation. Uses system prompt to ensure consistent, professional replies.

**Nodes Involved:**  
- Customer Service Agent  
- ai_memory (Memory Buffer)  
- ai_chat (optional language model node used by agent)  
- faq_base (FAQ lookup)  
- get_services (Service info lookup)  
- get_schedule (Appointment slot retrieval)  
- set_appointment (Appointment creation)

**Node Details:**  
- **Customer Service Agent**  
  - Type: LangChain Agent node  
  - Role: Core AI agent that processes input text using system prompt and calls tools as needed.  
  - Config:  
    - System message defines behavior as polite WhatsApp service assistant, with explicit instructions on tool usage and response rules.  
    - Tools connected: `faq_base`, `get_services`, `get_schedule`, `set_appointment`, plus `agent_reply` for sending messages.  
    - Uses session-based memory keyed by `chat_id`.  
  - Credentials: Depends on connected nodes (Google Sheets, Google Calendar, WhatsApp, OpenAI, Google Palm).  
  - Failure Modes: API outages, tool errors, prompt misconfiguration, session key missing.

- **ai_memory**  
  - Type: Memory buffer window  
  - Role: Stores recent conversation history keyed by chat ID for context retention.  
  - Config: Session key from chat_id, custom key type.  
  - Output: Provides context to AI agent.

- **ai_chat**  
  - Type: Google Gemini language model node  
  - Role: Optional auxiliary LM used by AI agent for chat completions.  
  - Credentials: Google Palm API key.

- **faq_base**  
  - Type: Google Sheets Tool  
  - Role: Retrieves FAQ data from Google Sheet to answer common questions.  
  - Config: Reads sheet with columns: id | question | answer from a specified Google Sheets document.  
  - Credentials: Google Sheets OAuth2.  
  - Edge Cases: Sheet access denied, missing data.

- **get_services**  
  - Type: Google Sheets Tool  
  - Role: Provides detailed service info including pricing from Google Sheet.  
  - Config: Reads a separate sheet with columns: id | service_name | service_description | price.  
  - Credentials: Google Sheets OAuth2.

- **get_schedule**  
  - Type: Google Calendar Tool  
  - Role: Retrieves available appointment slots from Google Calendar.  
  - Config: Returns up to 3 available slots between provided timeMin and timeMax fields.  
  - Credentials: Google Calendar OAuth2.  
  - Edge Cases: Calendar access denied, no availability.

- **set_appointment**  
  - Type: Google Calendar Tool  
  - Role: Creates new appointment event in Google Calendar with customer details.  
  - Config: Uses start and end times, calendar ID, and additional customer info.  
  - Credentials: Google Calendar OAuth2.  
  - Failure Modes: Event conflicts, permission issues.

---

#### 2.5 WhatsApp Reply Sending

**Overview:**  
Sends all AI-generated responses back to the user on WhatsApp, ensuring the customer receives answers, slot options, and confirmations directly in chat.

**Nodes Involved:**  
- Send message

**Node Details:**  
- **Send message**  
  - Type: WhatsApp node  
  - Role: Sends text messages back to the customer.  
  - Config: Uses output text from AI agent, sends to phone number and phoneNumberId stored in context.  
  - Credentials: WhatsApp API.  
  - Edge Cases: Message send failure, wrong recipient number.

---

#### 2.6 Sticky Notes (Documentation Nodes)

**Overview:**  
Sticky notes provide descriptive documentation within the workflow UI for maintainers and users.

**Nodes Involved:**  
- Sticky Note (Overview)  
- Sticky Note1 (FAQ handling)  
- Sticky Note2 (Service information)  
- Sticky Note3 (Schedule availability)  
- Sticky Note4 (Appointment confirmation)  
- Sticky Note5 (WhatsApp replies)  
- Sticky Note6 (Voice transcription)

---

### 3. Summary Table

| Node Name               | Node Type                                 | Functional Role                          | Input Node(s)                   | Output Node(s)                  | Sticky Note                                                                                                    |
|-------------------------|-------------------------------------------|----------------------------------------|--------------------------------|--------------------------------|---------------------------------------------------------------------------------------------------------------|
| WhatsApp Message Received| WhatsApp Trigger                          | Entry point for incoming WhatsApp msgs | -                              | Is Message?                    |                                                                                                               |
| Is Message?             | If                                        | Checks if incoming event has a message | WhatsApp Message Received       | Chat Router, No Operation       |                                                                                                               |
| Chat Router             | Switch                                    | Routes based on message type (text/voice)| Is Message?                    | Agent Context, Download Voice   |                                                                                                               |
| No Operation, do nothing| NoOp                                      | Terminates flow for non-message events | Is Message?                    | -                              |                                                                                                               |
| Download Voice          | WhatsApp node                             | Gets media URL for audio messages       | Chat Router (voice branch)      | Get Audio                      |                                                                                                               |
| Get Audio               | HTTP Request                             | Downloads audio file from URL           | Download Voice                 | Transcribe audio               |                                                                                                               |
| Transcribe audio        | OpenAI Audio Transcription (LangChain)   | Transcribes audio file to text           | Get Audio                     | Agent Context                  | Sticky Note6: Voice notes sent by customers are transformed into text for AI processing                        |
| Agent Context           | Set                                       | Extracts chat metadata and text          | Chat Router (text branch), Transcribe audio | Customer Service Agent     |                                                                                                               |
| Customer Service Agent  | LangChain Agent                           | AI bot that handles queries using tools | Agent Context                 | Send message                  | Sticky Note5: All communication with user done via agent_reply node                                          |
| ai_memory               | Memory Buffer Window                      | Maintains conversation context          | -                            | Customer Service Agent          |                                                                                                               |
| ai_chat                 | Google Gemini Chat LM                     | LM used internally by AI agent          | -                            | Customer Service Agent          |                                                                                                               |
| faq_base                | Google Sheets Tool                        | FAQ data lookup                          | -                            | Customer Service Agent          | Sticky Note1: FAQ handling from Google Sheet                                                                |
| get_services            | Google Sheets Tool                        | Service info lookup                      | -                            | Customer Service Agent          | Sticky Note2: Service information from Google Sheet                                                          |
| get_schedule            | Google Calendar Tool                      | Retrieves available appointment slots   | -                            | Customer Service Agent          | Sticky Note3: Schedule availability query                                                                    |
| set_appointment         | Google Calendar Tool                      | Creates appointment in calendar          | -                            | Customer Service Agent          | Sticky Note4: Appointment confirmation and creation                                                          |
| Send message            | WhatsApp node                            | Sends AI response to user on WhatsApp   | Customer Service Agent         | -                              | Sticky Note5: Ensures customer gets replies directly in chat                                                  |
| Sticky Note             | Sticky Note                              | Documentation                           | -                            | -                              | Sticky Note overview on workflow purpose and requirements                                                    |
| Sticky Note1            | Sticky Note                              | Documentation                           | -                            | -                              | FAQ handling explanation                                                                                       |
| Sticky Note2            | Sticky Note                              | Documentation                           | -                            | -                              | Service information explanation                                                                                |
| Sticky Note3            | Sticky Note                              | Documentation                           | -                            | -                              | Schedule availability explanation                                                                              |
| Sticky Note4            | Sticky Note                              | Documentation                           | -                            | -                              | Appointment confirmation explanation                                                                           |
| Sticky Note5            | Sticky Note                              | Documentation                           | -                            | -                              | WhatsApp replies explanation                                                                                   |
| Sticky Note6            | Sticky Note                              | Documentation                           | -                            | -                              | Voice note transcription explanation                                                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create WhatsApp Message Received Node**  
   - Type: WhatsApp Trigger  
   - Configure webhook to listen for messages and status updates.  
   - Credential: Set WhatsApp API credentials.  

2. **Add an If Node "Is Message?"**  
   - Condition: Check if `{{$json.messages?.[0]?.from}}` exists (boolean true).  
   - True output connects to Chat Router; false output connects to No Operation node.

3. **Add Switch Node "Chat Router"**  
   - Switch on `$json.messages[0].type` equals "text" or "audio".  
   - Route "text" to "Agent Context" node, "audio" to "Download Voice" node.

4. **Add No Operation Node "No Operation, do nothing"**  
   - Connect from "Is Message?" false output to silently terminate non-message events.

5. **Add WhatsApp Node "Download Voice"**  
   - Operation: Get media URL  
   - MediaGetId: `{{$json.messages[0].audio.id}}`  
   - Credential: WhatsApp API.

6. **Add HTTP Request Node "Get Audio"**  
   - URL: `{{$json.url}}` (from previous node output)  
   - Authentication: Use WhatsApp API credential.

7. **Add OpenAI Node "Transcribe audio"**  
   - Resource: Audio  
   - Operation: Transcribe  
   - Credential: OpenAI API key.

8. **Add Set Node "Agent Context"**  
   - Assignments:  
     - chat_id = `{{$json.metadata.phone_number_id}}` from "WhatsApp Message Received" node.  
     - from = `{{$json.messages[0].from}}`  
     - text = `{{$json.text || $json.messages[0]?.text?.body || ''}}` (handle transcribed or text messages).

9. **Add LangChain Agent Node "Customer Service Agent"**  
   - Parameters:  
     - Text input: `{{$json.text}}`  
     - System prompt includes: behavior rules, tool usage instructions, polite tone.  
   - Connect tools for FAQ, services, scheduling, appointment, and reply sending.  
   - Credential: OpenAI or Google Palm API, Google Sheets, Google Calendar, WhatsApp API.

10. **Add Memory Buffer Node "ai_memory"**  
    - SessionKey: `{{$json.chat_id}}`  
    - Connect output to AI agent node.

11. **Add Google Sheets Node "faq_base"**  
    - Document ID: Set your FAQ Google Sheet ID.  
    - Sheet Name/ID: Set FAQ sheet (id, question, answer).  
    - Credential: Google Sheets OAuth2.

12. **Add Google Sheets Node "get_services"**  
    - Document ID: Same Google Sheet or different with service data.  
    - Sheet Name/ID: Services sheet with columns (id, service_name, service_description, price).  
    - Credential: Google Sheets OAuth2.

13. **Add Google Calendar Node "get_schedule"**  
    - Operation: Get all events  
    - Set timeMin and timeMax dynamically (from user input or AI).  
    - Credential: Google Calendar OAuth2.

14. **Add Google Calendar Node "set_appointment"**  
    - Operation: Create event  
    - Input start and end time, customer details.  
    - Credential: Google Calendar OAuth2.

15. **Add WhatsApp Node "Send message"**  
    - Operation: Send  
    - Text body: AI agent output.  
    - Recipient: phone number from context.  
    - Credential: WhatsApp API.

16. **Connect nodes:**  
    - WhatsApp Message Received → Is Message?  
    - Is Message? True → Chat Router  
    - Chat Router text → Agent Context → Customer Service Agent → Send message  
    - Chat Router audio → Download Voice → Get Audio → Transcribe audio → Agent Context → Customer Service Agent → Send message

17. **Add sticky notes in workflow UI** for documentation.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                        | Context or Link                                                                                           |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| WhatsApp customer service bot with FAQ and appointment scheduling. Designed for businesses providing support and appointment services via WhatsApp.                                                                                                                 | Sticky Note overview node.                                                                                |
| FAQ handling queries a Google Sheet (id | question | answer) for customer questions.                                                                                                                                                                               | Sticky Note1.                                                                                            |
| Service information step queries Google Sheet (id | service_name | service_description | price) for service/pricing details.                                                                                                                                                    | Sticky Note2.                                                                                            |
| Scheduling block queries Google Calendar for available slots and offers 3 options to the customer.                                                                                                                                                                | Sticky Note3.                                                                                            |
| Appointment confirmation collects customer contact details and creates calendar event.                                                                                                                                                                             | Sticky Note4.                                                                                            |
| All replies sent through WhatsApp integration node to ensure direct communication.                                                                                                                                                                                 | Sticky Note5.                                                                                            |
| Voice notes from customers are transcribed to text using OpenAI audio transcription for AI to process.                                                                                                                                                            | Sticky Note6.                                                                                            |

---

**Disclaimer:**  
The text provided is extracted exclusively from an automated workflow created with n8n, a workflow automation tool. This processing strictly adheres to content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly accessible.