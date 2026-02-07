Auto-Generate WhatsApp Proposals from Voice or Text using GPT & APITemplate

https://n8nworkflows.xyz/workflows/auto-generate-whatsapp-proposals-from-voice-or-text-using-gpt---apitemplate-5656


# Auto-Generate WhatsApp Proposals from Voice or Text using GPT & APITemplate

### 1. Workflow Overview

**Purpose:**  
This workflow automates the generation of personalized business proposals delivered via WhatsApp based on incoming voice or text messages. It processes the user’s input (voice note or text), interprets the request using AI, selects relevant service packs from Airtable, generates a customized PDF proposal, and sends it back through WhatsApp.

**Target Use Cases:**  
- Businesses seeking to automate proposal generation for leads or clients via WhatsApp.  
- Handling both voice notes and text messages as input.  
- Dynamic proposal content based on service packs stored in Airtable.  
- Seamless integration between WhatsApp, OpenAI (GPT and Whisper), Airtable, and APITemplate.io.

**Logical Blocks:**  

- **1.1 Message Intake & Transcription**  
  Detect incoming WhatsApp messages, differentiate between voice and text, download voice media if applicable, and transcribe audio to text.

- **1.2 AI-Powered Proposal Drafting**  
  Analyze the cleaned text input, identify the user's intent, select the appropriate service pack from Airtable, and prepare data for proposal generation.

- **1.3 Proposal Generation & Delivery**  
  Generate a PDF proposal using APITemplate.io and send the document back to the user on WhatsApp.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Message Intake & Transcription

**Overview:**  
Capture incoming WhatsApp messages, separate components, detect message type (voice or text), retrieve and download audio files if voice, transcribe voice to text, and normalize text inputs.

**Nodes Involved:**  
- WhatsApp Trigger  
- Split Out  
- Switch  
- WhatsApp Business Cloud  
- HTTP Request  
- OpenAI (Transcribe Audio)  
- Edit Fields  
- Edit Fields1

**Node Details:**

- **WhatsApp Trigger**  
  - Type: Trigger node listening for WhatsApp messages.  
  - Configuration: Listens for message updates only.  
  - Credentials: Uses WhatsApp OAuth token.  
  - Input: Incoming WhatsApp messages.  
  - Output: Raw message JSON for further processing.  
  - Potential Failures: Authentication errors, webhook misconfigurations, message format changes.

- **Split Out**  
  - Type: Data manipulation node to split message content.  
  - Configuration: Splits based on a dynamic field (`fieldToSplitOut` from JSON).  
  - Input: WhatsApp Trigger output.  
  - Output: Individual message components for branching.  
  - Edge Cases: Unexpected message formats or missing fields.

- **Switch**  
  - Type: Conditional routing node.  
  - Configuration: Checks if the message type is "audio" (voice) or "text".  
  - Input: Split Out output.  
  - Output: Routes to voice handling or text handling path.  
  - Edge Cases: Unsupported message types, case sensitivity issues.

- **WhatsApp Business Cloud**  
  - Type: Media retrieval node.  
  - Configuration: Retrieves media URL for the voice message using media ID.  
  - Input: Voice message metadata from Switch node.  
  - Output: Media URL for download.  
  - Credentials: WhatsApp API token.  
  - Failures: Media not found, expired media URLs.

- **HTTP Request**  
  - Type: HTTP client node.  
  - Configuration: Downloads the voice media file from the URL provided.  
  - Input: Media URL from WhatsApp Business Cloud.  
  - Output: Binary audio data for transcription.  
  - Credentials: WhatsApp API credentials for authorized download.  
  - Edge Cases: Network timeouts, invalid URLs.

- **OpenAI (Transcribe Audio)**  
  - Type: OpenAI audio transcription node using Whisper model.  
  - Configuration: Transcribes audio binary to text.  
  - Input: Audio binary from HTTP Request.  
  - Output: Transcribed text.  
  - Credentials: OpenAI API key.  
  - Failures: Audio too short/long, unsupported format, API rate limits.

- **Edit Fields**  
  - Type: Set node to assign text from WhatsApp text messages.  
  - Configuration: Assigns the text body from WhatsApp message JSON to a normalized "text" field.  
  - Input: Switch node output for text messages.  
  - Output: Normalized text for AI analysis.  
  - Edge Cases: Empty text messages.

- **Edit Fields1**  
  - Type: Set node to prepare a "message_type" field from the transcribed or original text.  
  - Configuration: Sets `message_type` equal to the normalized text.  
  - Input: From Edit Fields or OpenAI transcription.  
  - Output: Final text input for AI processing.  
  - Edge Cases: Empty or malformed text.

---

#### 1.2 AI-Powered Proposal Drafting

**Overview:**  
The AI Agent interprets the cleaned text input (from voice transcription or text), selects the appropriate service pack using keyword/fuzzy matching, queries Airtable for detailed pack info, stores context in memory, and computes any needed values.

**Nodes Involved:**  
- AI Agent  
- Simple Memory  
- Calculator  
- Get Info  
- OpenAI Chat Model

**Node Details:**

- **AI Agent**  
  - Type: LangChain AI agent node.  
  - Configuration: Uses a system prompt instructing it to analyze the user’s message, query Airtable, and generate a JSON with all required proposal fields.  
  - Input: Normalized message text (`message_type`).  
  - Output: JSON with filled proposal data (e.g., pack name, pricing, booking link).  
  - Tools Used: Airtable data via Get Info, Calculator for computations, Simple Memory for session context, OpenAI Chat for language model calls.  
  - Failures: Airtable query failure, prompt errors, missing fields.

- **Simple Memory**  
  - Type: LangChain memory buffer window.  
  - Configuration: Stores context keyed by the message text to maintain session info.  
  - Input: From Edit Fields1 (message type).  
  - Output: Memory context to AI Agent.  
  - Edge Cases: Memory overflow, stale context.

- **Calculator**  
  - Type: LangChain calculator tool.  
  - Configuration: Allows AI Agent to perform calculations if needed (e.g., price computations).  
  - Input: AI Agent prompts.  
  - Output: Computed values back to AI Agent.  
  - Failures: Calculation errors.

- **Get Info**  
  - Type: Airtable tool node.  
  - Configuration: Searches Airtable "Services" table for relevant pack data based on AI Agent query/filter formula.  
  - Input: AI Agent search parameter.  
  - Output: Service pack records for AI Agent to use.  
  - Credentials: Airtable Personal Access Token.  
  - Failures: Airtable API rate limits, bad filter formula, missing records.

- **OpenAI Chat Model**  
  - Type: LangChain OpenAI Chat node.  
  - Configuration: GPT-4 Turbo Preview model used for complex language understanding and generation during AI Agent processing.  
  - Input: AI Agent's language model requests.  
  - Output: Text or JSON responses.  
  - Credentials: OpenAI API key.  
  - Failures: API rate limits, invalid prompts.

---

#### 1.3 Proposal Generation & Delivery

**Overview:**  
Generate a professional PDF proposal using APITemplate.io with the data prepared by the AI Agent, then send the PDF document via WhatsApp to the user.

**Nodes Involved:**  
- APITemplate.io  
- WhatsApp Business Cloud2

**Node Details:**

- **APITemplate.io**  
  - Type: PDF generation node.  
  - Configuration: Uses a predefined PDF template ID, sends AI Agent JSON data as properties to dynamically fill the proposal.  
  - Input: JSON from AI Agent output.  
  - Output: PDF download URL and metadata.  
  - Credentials: APITemplate.io API key.  
  - Failures: Template errors, API limits, malformed JSON.

- **WhatsApp Business Cloud2**  
  - Type: WhatsApp message sender node.  
  - Configuration: Sends the generated PDF document to the phone number from the original WhatsApp message metadata. Captions and filename are set for clarity.  
  - Input: PDF media link from APITemplate.io, phone number from WhatsApp Trigger.  
  - Output: Confirmation of message sent.  
  - Credentials: WhatsApp API token.  
  - Edge Cases: Sending failures, invalid phone numbers, media upload issues.

---

### 3. Summary Table

| Node Name              | Node Type                             | Functional Role                              | Input Node(s)            | Output Node(s)           | Sticky Note                                                                                              |
|------------------------|-------------------------------------|----------------------------------------------|--------------------------|--------------------------|--------------------------------------------------------------------------------------------------------|
| WhatsApp Trigger       | WhatsApp Trigger                    | Entry point: captures incoming WhatsApp messages | -                        | Split Out                | Part 1: Message Intake & Transcription (Voice + Text)                                                  |
| Split Out              | Split Out                          | Splits message components                      | WhatsApp Trigger          | Switch                   | Part 1: Message Intake & Transcription (Voice + Text)                                                  |
| Switch                 | Switch                            | Routes messages by type: audio or text         | Split Out                 | WhatsApp Business Cloud, Edit Fields | Part 1: Message Intake & Transcription (Voice + Text)                                                  |
| WhatsApp Business Cloud | WhatsApp Business Cloud (mediaUrlGet) | Retrieves voice media URL                       | Switch                    | HTTP Request             | Part 1: Message Intake & Transcription (Voice + Text)                                                  |
| HTTP Request           | HTTP Request                      | Downloads audio file                            | WhatsApp Business Cloud   | OpenAI                   | Part 1: Message Intake & Transcription (Voice + Text)                                                  |
| OpenAI                 | OpenAI (Audio Transcription)      | Transcribes audio to text using Whisper        | HTTP Request              | Edit Fields1             | Part 1: Message Intake & Transcription (Voice + Text)                                                  |
| Edit Fields            | Set                              | Sets text message body to a normalized field   | Switch                    | Edit Fields1             | Part 1: Message Intake & Transcription (Voice + Text)                                                  |
| Edit Fields1           | Set                              | Prepares final text field for AI processing    | OpenAI, Edit Fields       | AI Agent                 | Part 1: Message Intake & Transcription (Voice + Text)                                                  |
| AI Agent               | LangChain Agent                  | Analyzes input, selects proposal pack, generates proposal JSON | Edit Fields1, Simple Memory, Calculator, Get Info, OpenAI Chat Model | APITemplate.io            | Part 2: AI-Powered Proposal Drafting                                                                   |
| Simple Memory          | LangChain Memory Buffer Window   | Stores session context for AI Agent            | Edit Fields1              | AI Agent                 | Part 2: AI-Powered Proposal Drafting                                                                   |
| Calculator             | LangChain Tool Calculator         | Performs dynamic computations if needed        | AI Agent (ai_tool)        | AI Agent                 | Part 2: AI-Powered Proposal Drafting                                                                   |
| Get Info               | Airtable Tool                     | Searches Airtable for service pack data        | AI Agent (ai_tool)        | AI Agent                 | Part 2: AI-Powered Proposal Drafting                                                                   |
| OpenAI Chat Model      | LangChain OpenAI Chat             | Provides language model capabilities to AI Agent | AI Agent (ai_languageModel) | AI Agent                 | Part 2: AI-Powered Proposal Drafting                                                                   |
| APITemplate.io         | APITemplate.io PDF Generator      | Generates PDF proposal from JSON data           | AI Agent                  | WhatsApp Business Cloud2  | Part 3: Proposal Generation & Delivery                                                                 |
| WhatsApp Business Cloud2 | WhatsApp Business Cloud (send message) | Sends the generated PDF proposal via WhatsApp  | APITemplate.io            | -                        | Part 3: Proposal Generation & Delivery                                                                 |
| Sticky Note            | Sticky Note                      | Describes message intake & transcription block | -                        | -                        | Covers nodes from WhatsApp Trigger to Edit Fields1 (Part 1)                                           |
| Sticky Note1           | Sticky Note                      | Describes AI proposal drafting block            | -                        | -                        | Covers AI Agent, Simple Memory, Calculator, Get Info, OpenAI Chat Model (Part 2)                       |
| Sticky Note2           | Sticky Note                      | Describes proposal generation & delivery block  | -                        | -                        | Covers APITemplate.io and WhatsApp Business Cloud2 (Part 3)                                           |
| Sticky Note3           | Sticky Note                      | Full module-by-module setup guide and notes     | -                        | -                        | General overview and setup instructions for entire workflow                                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create WhatsApp Trigger Node**  
   - Type: WhatsApp Trigger  
   - Parameters: Listen for "messages" updates only.  
   - Credentials: Connect with WhatsApp OAuth2 API credentials.  
   - Purpose: Entry point for incoming WhatsApp messages.

2. **Create Split Out Node**  
   - Type: Split Out  
   - Parameters: Set `fieldToSplitOut` dynamically based on incoming JSON.  
   - Connect: From WhatsApp Trigger output.

3. **Create Switch Node**  
   - Type: Switch  
   - Parameters: Add two rules to check `{{$json.messages[0].type}}`:  
     - Equals "audio" → output "voice"  
     - Equals "text" → output "text"  
   - Connect: From Split Out output.

4. **Create WhatsApp Business Cloud Node** (Media URL Fetch)  
   - Type: WhatsApp Business Cloud (mediaUrlGet operation)  
   - Parameters: Set `mediaGetId` from voice message media ID.  
   - Credentials: WhatsApp API token.  
   - Connect: From Switch node "voice" output.

5. **Create HTTP Request Node**  
   - Type: HTTP Request  
   - Parameters: Use URL from WhatsApp Business Cloud output to download audio.  
   - Credentials: WhatsApp API credentials.  
   - Connect: From WhatsApp Business Cloud output.

6. **Create OpenAI Node for Transcription**  
   - Type: OpenAI (audio transcription)  
   - Parameters: Resource: audio, Operation: transcribe.  
   - Credentials: OpenAI API key.  
   - Connect: From HTTP Request output.

7. **Create Edit Fields Node** (for Text messages)  
   - Type: Set node  
   - Parameters: Assign `text` field to `{{$json.messages[0].text.body}}`.  
   - Connect: From Switch node "text" output.

8. **Create Edit Fields1 Node** (Normalize message text)  
   - Type: Set node  
   - Parameters: Assign `message_type` field to `{{$json.text}}` (from transcription or text).  
   - Connect: From both OpenAI transcription node and Edit Fields node outputs.

9. **Create Simple Memory Node**  
   - Type: LangChain memoryBufferWindow  
   - Parameters: Set `sessionKey` to `{{$json.message_type}}`, `sessionIdType` to "customKey".  
   - Connect: From Edit Fields1 output.

10. **Create Get Info Node (Airtable Search)**  
    - Type: Airtable Tool  
    - Parameters: Search "Services" table in Airtable base "[BlockA] - Invoice".  
      Use a formula filter dynamically passed from AI Agent.  
    - Credentials: Airtable Personal Access Token.  
    - Connect: As AI Tool input to AI Agent.

11. **Create Calculator Node**  
    - Type: LangChain Tool Calculator  
    - Parameters: Default.  
    - Connect: As AI Tool input to AI Agent.

12. **Create OpenAI Chat Model Node**  
    - Type: LangChain OpenAI Chat  
    - Parameters: Use "gpt-4-turbo-preview" model.  
    - Credentials: OpenAI API key.  
    - Connect: As AI Language Model input to AI Agent.

13. **Create AI Agent Node**  
    - Type: LangChain Agent  
    - Parameters:  
      - Input text: `{{$json.message_type}}`  
      - System prompt with detailed instructions on interpreting client requests, querying Airtable, generating JSON with proposal fields.  
      - Tools: Attach Simple Memory, Calculator, Get Info, OpenAI Chat Model.  
    - Connect: From Edit Fields1 output for main input; from tools for ai_tool and ai_languageModel inputs.

14. **Create APITemplate.io Node**  
    - Type: APITemplate.io PDF Generator  
    - Parameters:  
      - Resource: pdf  
      - PDF Template ID: "e8177b236ab07826" (predefined template)  
      - JSON properties: Pass AI Agent output JSON as dynamic fields.  
    - Credentials: APITemplate.io API key.  
    - Connect: From AI Agent output.

15. **Create WhatsApp Business Cloud2 Node**  
    - Type: WhatsApp Business Cloud (send message)  
    - Parameters:  
      - Operation: send  
      - Message type: document  
      - Media Link: `{{$json.download_url}}` from APITemplate.io  
      - Phone number ID from WhatsApp Trigger message metadata  
      - Caption and filename set with personalized text  
      - Recipient phone number hardcoded or dynamically set (replace "YOUR PHONE NUMBER")  
    - Credentials: WhatsApp API token.  
    - Connect: From APITemplate.io output.

---

### 5. General Notes & Resources

| Note Content                                                                                                                        | Context or Link                                                                                                                                                                           |
|------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Workflow created by Floyd Mahou.                                                                                                  | Author and creator credit.                                                                                                                                                               |
| Requires WhatsApp Business Cloud API with webhook configured and authorized phone number.                                         | WhatsApp API setup prerequisite.                                                                                                                                                         |
| OpenAI API key needed for both Whisper audio transcription and GPT-4 language processing.                                         | OpenAI account and API key.                                                                                                                                                              |
| APITemplate.io account required for PDF generation from templates.                                                                | https://apitemplate.io                                                                                                                                                                   |
| Airtable free plan sufficient; used to store service pack data, pricing, and client info.                                          | https://airtable.com                                                                                                                                                                     |
| Use environment variables to securely store API keys and tokens.                                                                  | Security best practice.                                                                                                                                                                  |
| Add error branches or fallback logic to handle corrupted audio, no pack matched, or Airtable query failures.                      | Recommended for production stability.                                                                                                                                                    |
| The AI Agent uses approximate keyword matching to map client requests to service packs; fuzzy matching allows for flexible input. | Enhances user experience with voice/text inputs that may be informal or incomplete.                                                                                                     |
| Proposal output strictly formatted in JSON, then converted to PDF by APITemplate.io.                                               | Ensures consistent dynamic document generation.                                                                                                                                          |
| Final WhatsApp message includes a personalized caption and file name for clarity.                                                 | Improves client communication and professionalism.                                                                                                                                      |
| Optional enhancement: add voice-generated summaries (e.g., ElevenLabs) for accessibility or user engagement.                      | Suggested future improvement.                                                                                                                                                            |

---

**Disclaimer:**  
The provided text is sourced exclusively from an automated workflow created with n8n, adhering strictly to current content policies without illegal or offensive elements. All data processed is legal and public.