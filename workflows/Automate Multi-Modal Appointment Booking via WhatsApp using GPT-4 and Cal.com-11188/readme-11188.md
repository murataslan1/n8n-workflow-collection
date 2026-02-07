Automate Multi-Modal Appointment Booking via WhatsApp using GPT-4 and Cal.com

https://n8nworkflows.xyz/workflows/automate-multi-modal-appointment-booking-via-whatsapp-using-gpt-4-and-cal-com-11188


# Automate Multi-Modal Appointment Booking via WhatsApp using GPT-4 and Cal.com

### 1. Workflow Overview

This workflow automates multi-modal appointment booking via WhatsApp by integrating GPT-4 AI capabilities with Cal.com scheduling APIs. It supports text, audio, and image messages received through WhatsApp Business API, processes them to understand user intent, and executes appointment-related operations such as checking availability, booking, rescheduling, and canceling appointments.

The workflow is logically divided into three main blocks:

- **1.1 Input Reception & Message Routing:**  
  Captures incoming WhatsApp messages, splits multiple messages, and routes each based on type (text, audio, image).

- **1.2 Multi-Modal Message Processing:**  
  Processes each message type accordingly: transcribes audio via Whisper, analyzes images with GPT-4 Vision, or directly handles text. The output is a unified user prompt for the AI Agent.

- **1.3 AI Agent & Appointment Management:**  
  Uses GPT-4 to interpret user requests, maintain conversation memory, and invoke Cal.com tools (check availability, book, find, cancel, reschedule bookings). The agent formats responses, converts markdown bold to Unicode bold for WhatsApp display, and sends replies back via WhatsApp API.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Message Routing

- **Overview:**  
  Receives incoming WhatsApp messages via webhook, splits multi-message payloads, and routes messages by type to appropriate processing branches.

- **Nodes Involved:**  
  - WhatsApp Trigger  
  - Split out message1  
  - Identify and ReRoute Message Types1  
  - Sticky Note (for documentation)

- **Node Details:**

  - **WhatsApp Trigger**  
    - Type: WhatsApp Webhook Trigger  
    - Role: Listens for incoming WhatsApp messages (updates on "messages")  
    - Config: Uses WhatsApp Business API credentials, generates webhook URL  
    - Input: Incoming webhook HTTP requests from WhatsApp  
    - Output: JSON containing message array and metadata  
    - Failure Modes: Webhook misconfiguration, credential issues, message format changes

  - **Split out message1**  
    - Type: SplitOut  
    - Role: Splits the array of messages into single-message items for independent processing  
    - Config: Splits on the field "messages"  
    - Input: WhatsApp Trigger output (array of messages)  
    - Output: Individual message JSON objects, one per item  
    - Failure Modes: Empty or malformed "messages" field

  - **Identify and ReRoute Message Types1**  
    - Type: Switch  
    - Role: Routes messages into three branches based on type: Audio, Image, or Text (fallback)  
    - Config:  
      - Audio branch condition: `$json.type == 'audio' && Boolean($json.audio)`  
      - Image branch condition: `$json.type == 'image' && Boolean($json.image)`  
      - Fallback branch: Text Message  
    - Input: Single message items from Split out message1  
    - Output: Three branches labeled "Audio Message", "Image Message", and "Text Message"  
    - Failure Modes: Unexpected message types, missing type fields

  - **Sticky Note**  
    - Describes this block as "WhatsApp Trigger → Message Router"  
    - Explains splitting and routing logic and output branches

---

#### 2.2 Multi-Modal Message Processing

- **Overview:**  
  Processes each message type to convert content into a text prompt for the AI Agent. Audio messages get transcribed, images get analyzed for description and text extraction, and text messages are prepared directly.

- **Nodes Involved:**  
  - Audio Branch: Get Audio URL → Download Audio → Audio Transcriber → Edit Fields 3  
  - Image Branch: Get Image URL → Download Image → Analyze image → Edit Fields 2  
  - Text Branch: Edit Fields 1  
  - Sticky Note (for documentation)

- **Node Details:**

  - **Get Audio URL**  
    - Type: WhatsApp Media URL retrieval  
    - Role: Fetches a temporary download URL for audio media from WhatsApp servers  
    - Config: Extracts media ID from audio message field, uses WhatsApp API credentials  
    - Input: Audio message JSON  
    - Output: JSON with "url" field for audio file  
    - Failure Modes: Expired media URL, invalid media ID, auth errors

  - **Download Audio**  
    - Type: HTTP Request  
    - Role: Downloads audio content using the media URL with WhatsApp auth  
    - Config: Uses WhatsApp API credentials for authentication  
    - Input: URL from Get Audio URL  
    - Output: Binary audio data for transcription  
    - Failure Modes: Network errors, auth failures, invalid URLs

  - **Audio Transcriber**  
    - Type: OpenAI Whisper (Langchain node)  
    - Role: Transcribes downloaded audio into text  
    - Config: Resource set to "audio", operation "transcribe", uses OpenAI API credentials  
    - Input: Binary audio data  
    - Output: JSON with transcribed text  
    - Failure Modes: API timeouts, invalid audio format, transcription errors

  - **Edit Fields 3**  
    - Type: Set node  
    - Role: Extracts transcribed text into unified field `user_prompt`  
    - Config: Sets `user_prompt` = transcribed text (`$json.text`)  
    - Input: Transcription output  
    - Output: JSON with `user_prompt` field  
    - Failure Modes: Missing transcription text

  - **Get Image URL**  
    - Type: WhatsApp Media URL retrieval  
    - Role: Fetches download URL for image media  
    - Config: Extracts media ID from image message field, WhatsApp API credentials  
    - Input: Image message JSON  
    - Output: JSON with "url" for image file  
    - Failure Modes: Same as Get Audio URL

  - **Download Image**  
    - Type: HTTP Request  
    - Role: Downloads image binary data  
    - Config: Uses WhatsApp API credentials  
    - Input: URL from Get Image URL  
    - Output: Binary image data  
    - Failure Modes: Same as Download Audio

  - **Analyze image**  
    - Type: OpenAI GPT-4 Vision (Langchain OpenAI node)  
    - Role: Analyzes image content and extracts detailed description and visible text, in French only  
    - Config: Model set to GPT-4o, prompt instructs detailed description + transcription in French  
    - Input: Base64-encoded image binary  
    - Output: JSON text with analysis results  
    - Failure Modes: API errors, large image size, prompt failures

  - **Edit Fields 2**  
    - Type: Set node  
    - Role: Sets `user_prompt` = image analysis text (`$json.content`)  
    - Input: Analyze image output  
    - Output: JSON with `user_prompt` field  
    - Failure Modes: Missing analysis content

  - **Edit Fields 1**  
    - Type: Set node  
    - Role: Directly assigns incoming text message content to `user_prompt`  
    - Config: `user_prompt` = `$json.text.body`  
    - Input: Text message JSON  
    - Output: JSON with `user_prompt` field  
    - Failure Modes: Missing text body

  - **Sticky Note1**  
    - Describes multi-modal processing pipeline and branches  
    - Explains transformation into unified `user_prompt` field

---

#### 2.3 AI Agent & Appointment Management

- **Overview:**  
  Processes unified user prompts via GPT-4 with memory context to understand appointment intents and interact with Cal.com APIs to check availability, book, find, cancel, or reschedule appointments. Formats response text for WhatsApp and sends it.

- **Nodes Involved:**  
  - AI Agent  
  - OpenAI Chat Model (GPT-4)  
  - Simple Memory (Conversation context)  
  - Cal.com API Tool nodes: check_availability, book_appointment, find_booking, cancel_booking, reschedule_booking  
  - Code (Markdown to Unicode Bold converter)  
  - Send message (WhatsApp message sender)  
  - Sticky Note2, Sticky Note3 (documentation)

- **Node Details:**

  - **AI Agent**  
    - Type: Langchain Agent node  
    - Role: Central orchestrator that interprets user prompt (`user_prompt`), manages dialogue flow, and calls specific tools for appointment management  
    - Config:  
      - System message defines personality, context, language rules, and operation protocol (French primary, multi-language support, time conversion rules, booking/cancellation/rescheduling logic)  
      - Uses GPT-4 model and embedded date/time/timezone logic  
      - Tools integrated: check_availability, book_appointment, find_booking, cancel_booking, reschedule_booking  
    - Input: JSON with `user_prompt` and conversation context  
    - Output: JSON with `output` field containing AI-generated response text  
    - Failure Modes: API limits, incorrect tool invocation, parsing errors, network issues

  - **OpenAI Chat Model**  
    - Type: Langchain Chat Completion (GPT-4.1-mini)  
    - Role: Provides advanced natural language reasoning for AI Agent  
    - Config: GPT-4.1-mini model, OpenAI API credentials  
    - Input: Conversation context and prompt from Simple Memory  
    - Output: Language model response to AI Agent  
    - Failure Modes: API errors, rate limits

  - **Simple Memory**  
    - Type: Langchain Memory Buffer Window  
    - Role: Maintains last 10 conversation exchanges keyed by WhatsApp sender ID to preserve context across messages  
    - Config: Session key based on message sender phone number  
    - Input: Conversation messages  
    - Output: Context window for AI Agent  
    - Failure Modes: Session key missing, memory overflow (managed by length)

  - **check_availability**  
    - Type: HTTP Request Tool Node  
    - Role: Calls Cal.com API to retrieve available time slots for booking  
    - Config: Query parameters include eventTypeId, timeZone (Europe/Paris), start/end date range  
    - Headers include Authorization Bearer token and API version  
    - Input: Parameters populated by AI Agent tool invocation  
    - Output: JSON list of available slots  
    - Failure Modes: Auth errors, invalid date formats, API downtime

  - **book_appointment**  
    - Type: HTTP Request Tool Node  
    - Role: Creates appointment booking on Cal.com  
    - Config: POST JSON body includes start UTC time, eventTypeId, attendee info (name, email, phone, language), booking fields  
    - Headers: Authorization, API version, Content-Type  
    - Input: Filled from AI Agent parameters after client confirmation  
    - Output: Booking confirmation object  
    - Failure Modes: Validation errors, time conflicts, auth errors

  - **find_booking**  
    - Type: HTTP Request Tool Node  
    - Role: Retrieves bookings by attendee email to obtain booking UID before canceling or rescheduling  
    - Config: GET with attendeeEmail query parameter, headers as above  
    - Input: Email from AI Agent  
    - Output: List of user bookings with UID, start time, title  
    - Failure Modes: No bookings found, multiple bookings ambiguity

  - **cancel_booking**  
    - Type: HTTP Request Tool Node  
    - Role: Cancels a booking by UID on Cal.com  
    - Config: POST with JSON body including cancellation reason and boolean to cancel subsequent bookings  
    - Input: Booking UID, reason, cancelAll from AI Agent  
    - Output: API confirmation response  
    - Failure Modes: Missing UID, invalid cancellation, policy restrictions

  - **reschedule_booking**  
    - Type: HTTP Request Tool Node  
    - Role: Reschedules existing booking to a new UTC time  
    - Config: POST with JSON including bookingUid, newStartUtc, actorEmail, reason  
    - Input: Parameters from AI Agent  
    - Output: Updated booking confirmation  
    - Failure Modes: Conflicts, missing UID, invalid new time

  - **Code**  
    - Type: Code node (JavaScript)  
    - Role: Converts markdown bold (**bold** or *bold*) in AI output text to Unicode Bold characters for enhanced WhatsApp display, then removes asterisks  
    - Config: Processes the field named `output`  
    - Input: AI Agent output containing markdown text  
    - Output: Text with Unicode bold formatting  
    - Failure Modes: Unexpected input format, regex failures

  - **Send message**  
    - Type: WhatsApp API send message node  
    - Role: Sends final formatted response back to user on WhatsApp  
    - Config: Sends text body from `output` field, recipient from original message sender, uses WhatsApp API credentials and phone number ID from trigger metadata  
    - Input: Code node output  
    - Output: WhatsApp message delivery confirmation  
    - Failure Modes: API errors, invalid phone number, permission issues

  - **Sticky Note2**  
    - Describes AI Agent block: GPT-4 core, memory, Cal.com integration, output processing, and WhatsApp delivery.

  - **Sticky Note3**  
    - High-level project overview, setup instructions, credentials required, customization tips, deployment notes, and contact link.

---

### 3. Summary Table

| Node Name                    | Node Type                         | Functional Role                                | Input Node(s)               | Output Node(s)               | Sticky Note                                                                                                    |
|------------------------------|----------------------------------|-----------------------------------------------|-----------------------------|------------------------------|---------------------------------------------------------------------------------------------------------------|
| WhatsApp Trigger             | WhatsApp Trigger                 | Receive incoming WhatsApp messages             | -                           | Split out message1           | WhatsApp Trigger → Message Router: Receives incoming WhatsApp messages, splits and routes by type             |
| Split out message1           | SplitOut                        | Split multi-message payloads                    | WhatsApp Trigger            | Identify and ReRoute Message Types1 | WhatsApp Trigger → Message Router: Processes each message individually                                         |
| Identify and ReRoute Message Types1 | Switch                         | Route messages by type (Audio/Image/Text)      | Split out message1          | Get Audio URL, Get Image URL, Edit Fields 1 | WhatsApp Trigger → Message Router: Outputs 3 branches for different message types                              |
| Get Audio URL                | WhatsApp Media URL retrieval    | Retrieve audio media download URL               | Identify and ReRoute Message Types1 (Audio branch) | Download Audio              | Multi-Modal Processing Pipeline: Audio branch step                                                          |
| Download Audio               | HTTP Request                   | Download audio file from WhatsApp URL           | Get Audio URL               | Audio Transcriber            | Multi-Modal Processing Pipeline: Audio branch step                                                          |
| Audio Transcriber            | OpenAI Whisper (Langchain)      | Transcribe audio to text                         | Download Audio              | Edit Fields 3                | Multi-Modal Processing Pipeline: Audio branch step                                                          |
| Edit Fields 3                | Set                            | Map transcription text to `user_prompt` field | Audio Transcriber           | AI Agent                    | Multi-Modal Processing Pipeline: Audio branch step                                                          |
| Get Image URL                | WhatsApp Media URL retrieval    | Retrieve image media download URL               | Identify and ReRoute Message Types1 (Image branch) | Download Image              | Multi-Modal Processing Pipeline: Image branch step                                                          |
| Download Image              | HTTP Request                   | Download image file from WhatsApp URL           | Get Image URL               | Analyze image               | Multi-Modal Processing Pipeline: Image branch step                                                          |
| Analyze image               | OpenAI GPT-4 Vision (Langchain) | Analyze image content and transcribe visible text | Download Image              | Edit Fields 2                | Multi-Modal Processing Pipeline: Image branch step                                                          |
| Edit Fields 2                | Set                            | Map image analysis text to `user_prompt` field | Analyze image               | AI Agent                    | Multi-Modal Processing Pipeline: Image branch step                                                          |
| Edit Fields 1                | Set                            | Assign direct text message to `user_prompt`     | Identify and ReRoute Message Types1 (Text branch) | AI Agent                    | Multi-Modal Processing Pipeline: Text branch step                                                           |
| AI Agent                    | Langchain Agent                 | Interpret user prompt, manage conversation, invoke Cal.com tools | Edit Fields 1, 2, 3         | Code                       | AI Agent: Appointment management and response generation                                                     |
| OpenAI Chat Model            | Langchain Chat Completion       | Provide GPT-4 based language model response     | Simple Memory               | AI Agent                    | AI Agent core language model                                                                                |
| Simple Memory                | Langchain Memory Buffer         | Maintain conversation context                    | AI Agent                    | OpenAI Chat Model           | AI Agent conversation memory                                                                                |
| check_availability           | HTTP Request Tool               | Query Cal.com for available time slots           | AI Agent                    | AI Agent                    | AI Agent tool: Check available booking slots                                                                |
| book_appointment            | HTTP Request Tool               | Create new appointment booking                    | AI Agent                    | AI Agent                    | AI Agent tool: Book appointment                                                                             |
| find_booking                | HTTP Request Tool               | Find existing booking(s) by email                 | AI Agent                    | AI Agent                    | AI Agent tool: Find booking                                                                                  |
| cancel_booking              | HTTP Request Tool               | Cancel booking by UID                              | AI Agent                    | AI Agent                    | AI Agent tool: Cancel booking                                                                                |
| reschedule_booking          | HTTP Request Tool               | Reschedule booking to new time                     | AI Agent                    | AI Agent                    | AI Agent tool: Reschedule booking                                                                            |
| Code                        | Code (JavaScript)               | Convert markdown bold to Unicode bold for WhatsApp | AI Agent                    | Send message                | AI Agent output formatting for WhatsApp display                                                             |
| Send message                | WhatsApp API Send Message       | Send formatted response message via WhatsApp     | Code                       | -                          | AI Agent final output delivery                                                                               |
| Sticky Note                 | Sticky Note                    | Description of WhatsApp Trigger & routing block  | -                           | -                          | WhatsApp Trigger → Message Router documentation                                                              |
| Sticky Note1                | Sticky Note                    | Description of multi-modal processing block      | -                           | -                          | Multi-Modal Processing Pipeline documentation                                                                |
| Sticky Note2                | Sticky Note                    | Description of AI Agent block                      | -                           | -                          | AI Agent detailed description                                                                                 |
| Sticky Note3                | Sticky Note                    | Project overview, setup, credentials, contact     | -                           | -                          | WhatsApp AI appointment agent overview and setup notes                                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create WhatsApp Trigger Node**  
   - Type: WhatsApp Trigger  
   - Configure credentials with WhatsApp Business API (phone_number_id and access_token)  
   - Set webhook to listen for "messages" updates  

2. **Add SplitOut Node ("Split out message1")**  
   - Set to split by field "messages"  
   - Connect WhatsApp Trigger → Split out message1  

3. **Add Switch Node ("Identify and ReRoute Message Types1")**  
   - Add three outputs: Audio Message, Image Message, Text Message (fallback)  
   - Conditions:  
     - Audio: `$json.type == 'audio' && Boolean($json.audio)`  
     - Image: `$json.type == 'image' && Boolean($json.image)`  
     - Fallback: Text message  
   - Connect Split out message1 → Identify and ReRoute Message Types1  

4. **Audio Branch:**  
   - Add WhatsApp node ("Get Audio URL") to retrieve audio media URL using `$json.audio.id`  
   - Connect Identify and ReRoute Message Types1 (Audio) → Get Audio URL  
   - Add HTTP Request node ("Download Audio") configured with URL from Get Audio URL, authentication via WhatsApp credentials  
   - Connect Get Audio URL → Download Audio  
   - Add OpenAI Langchain node ("Audio Transcriber") with resource "audio" and operation "transcribe" using OpenAI credentials  
   - Connect Download Audio → Audio Transcriber  
   - Add Set node ("Edit Fields 3") to assign `user_prompt` = `$json.text` from transcription  
   - Connect Audio Transcriber → Edit Fields 3  

5. **Image Branch:**  
   - Add WhatsApp node ("Get Image URL") to retrieve image media URL using `$json.image.id`  
   - Connect Identify and ReRoute Message Types1 (Image) → Get Image URL  
   - Add HTTP Request node ("Download Image") with URL from Get Image URL, WhatsApp credentials  
   - Connect Get Image URL → Download Image  
   - Add OpenAI Langchain node ("Analyze image") with resource "image", operation "analyze", model set to GPT-4o, prompt instructing detailed description and transcription in French  
   - Connect Download Image → Analyze image  
   - Add Set node ("Edit Fields 2") to assign `user_prompt` = `$json.content` from analysis  
   - Connect Analyze image → Edit Fields 2  

6. **Text Branch:**  
   - Add Set node ("Edit Fields 1") to assign `user_prompt` = `$json.text.body`  
   - Connect Identify and ReRoute Message Types1 (Text) → Edit Fields 1  

7. **AI Agent Setup:**  
   - Add Langchain Memory Buffer Window node ("Simple Memory")  
     - Set sessionKey based on message sender phone number (e.g., `$json.from`)  
     - Context window length: 10  
   - Add Langchain Chat Completion node ("OpenAI Chat Model") with GPT-4.1-mini model and OpenAI credentials  
   - Connect Simple Memory → OpenAI Chat Model  
   - Add Langchain Agent node ("AI Agent")  
     - Paste detailed system message with appointment assistant role, time conversion rules, multi-language policy, booking/cancellation/rescheduling protocols as given  
     - Connect outputs of Edit Fields 1, 2, 3 → AI Agent (main input)  
     - Connect OpenAI Chat Model → AI Agent (language model input)  
     - Connect Simple Memory → AI Agent (memory input)  
     - Add Cal.com tool HTTP Request nodes as AI Agent tools: check_availability, book_appointment, find_booking, cancel_booking, reschedule_booking  
       - Configure each with respective URLs, methods, headers including Authorization Bearer token and cal-api-version  
       - Setup placeholders for parameters such as eventTypeId, bookingUid, email, start UTC, etc.  
       - Connect all tool outputs back to AI Agent (ai_tool input)  

8. **Output Formatting:**  
   - Add Code node ("Code") with JavaScript to convert markdown bold to Unicode bold in `output` field  
   - Connect AI Agent → Code  

9. **Send WhatsApp Message:**  
   - Add WhatsApp node ("Send message")  
   - Configure:  
     - Text body: `{{$json.output}}`  
     - Recipient phone number from original WhatsApp Trigger message sender  
     - Phone number ID from WhatsApp Trigger metadata  
     - WhatsApp API credentials  
   - Connect Code → Send message  

10. **Testing & Deployment:**  
    - Deploy webhook URL from WhatsApp Trigger to Meta WhatsApp app console  
    - Test with text, audio, and image messages  
    - Monitor logs and adjust system message or credentials as needed  

---

### 5. General Notes & Resources

| Note Content                                                                                                                     | Context or Link                                                                                       |
|---------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| WhatsApp AI Appointment Agent automates multi-language, multi-modal booking with GPT-4 and Cal.com integration.                 | Full project description and architecture overview                                                   |
| Setup requires WhatsApp Business API, Cal.com API key, and OpenAI API keys for GPT-4, Whisper, and Vision                      | Credentials configuration section                                                                    |
| Time zone is fixed at Europe/Paris; all date/time conversions handled silently by AI agent per defined rules                    | Time conversion rules detailed in AI Agent system message                                            |
| AI Agent enforces strict booking, cancellation, and rescheduling protocols to avoid errors and user confusion                   | System message "CRITICAL RULES" section                                                              |
| Helpful contact for assistance: [LinkedIn - Stéphane Bordas](https://www.linkedin.com/in/st%C3%A9phane-bordas-3439b4179/)      | Support and consultancy link                                                                          |
| Visual sticky notes embedded in workflow provide in-context documentation for easier understanding and maintenance             | Sticky notes nodes at multiple workflow sections                                                     |

---

**Disclaimer:** The provided text is derived exclusively from an n8n automated workflow respecting all content policies. It contains no illegal or offensive elements. All processed data is legal and public.