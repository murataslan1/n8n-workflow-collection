AI-Powered WhatsApp Chatbot 🤖📲 for Text, Voice, Images & PDFs with memory 🧠

https://n8nworkflows.xyz/workflows/ai-powered-whatsapp-chatbot------for-text--voice--images---pdfs-with-memory----3586


# AI-Powered WhatsApp Chatbot 🤖📲 for Text, Voice, Images & PDFs with memory 🧠

### 1. Workflow Overview

This workflow implements an **AI-powered multimodal WhatsApp chatbot** capable of understanding and responding to various message types: text, voice, images, and PDF documents. It leverages OpenAI models (GPT-4o-mini and Whisper) combined with smart routing and memory management to provide contextual, accurate, and user-friendly replies.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Type Detection**  
  Listens for incoming WhatsApp messages and determines the message type (text, voice, image, PDF, or unsupported).

- **1.2 Media URL Retrieval & Download**  
  For non-text inputs (audio, images, files), obtains the media URL from WhatsApp and downloads the content securely.

- **1.3 Content Processing & AI Analysis**  
  Processes each input type accordingly: transcribes audio, analyzes images, extracts PDF text, or directly uses text messages. Then sends the processed content to an AI agent for response generation.

- **1.4 Response Generation & Formatting**  
  The AI agent generates replies based on the input and context. For voice inputs, the response can be converted back to audio.

- **1.5 Response Delivery**  
  Sends the AI-generated response back to the user via WhatsApp as text or audio.

- **1.6 Contextual Memory Management**  
  Maintains a session-based memory buffer for each user to enable contextual conversations over multiple interactions.

- **1.7 Error Handling & Unsupported Formats**  
  Detects unsupported message types and sends appropriate error messages.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Type Detection

- **Overview:**  
  This block triggers on incoming WhatsApp messages and routes them based on detected message type.

- **Nodes Involved:**  
  - WhatsApp Trigger  
  - Input type (Switch)  
  - Not supported (WhatsApp node)

- **Node Details:**

  - **WhatsApp Trigger**  
    - Type: WhatsApp Trigger node  
    - Role: Listens for incoming WhatsApp messages (text, audio, images, documents)  
    - Configuration: Subscribed to `messages` updates; uses WhatsApp OAuth credentials  
    - Inputs: External webhook trigger from WhatsApp API  
    - Outputs: Raw message JSON forwarded to `Input type` node  
    - Edge cases: Webhook misconfiguration, credential expiration, network issues

  - **Input type (Switch)**  
    - Type: Switch node  
    - Role: Detects message type by checking presence of keys in incoming JSON (`text.body`, `audio`, `image`, `document`)  
    - Configuration:  
      - Routes to outputs named Text, Voice, Image, Document, or fallback "extra"  
      - Conditions use strict type validation and existence checks  
    - Inputs: WhatsApp Trigger output  
    - Outputs: Routes to respective processing branches  
    - Edge cases: Messages missing expected fields, unknown media types, malformed JSON

  - **Not supported**  
    - Type: WhatsApp node (send message)  
    - Role: Sends error message if message type is unsupported  
    - Configuration: Sends fixed text "You can only send text messages, images, audio files and PDF documents." to sender  
    - Inputs: Fallback output of Input type  
    - Outputs: None  
    - Edge cases: WhatsApp API send failures, invalid phone number

---

#### 2.2 Media URL Retrieval & Download

- **Overview:**  
  For voice, image, and document inputs, this block retrieves the media URL from WhatsApp and downloads the content for processing.

- **Nodes Involved:**  
  - Get Audio Url (WhatsApp node)  
  - Download Audio (HTTP Request)  
  - Get Image Url (WhatsApp node)  
  - Download Image (HTTP Request)  
  - Get File Url (WhatsApp node)  
  - Download File (HTTP Request)  
  - Only PDF File (IF node)  
  - Incorrect format (WhatsApp node)

- **Node Details:**

  - **Get Audio Url**  
    - Type: WhatsApp node (mediaUrlGet)  
    - Role: Retrieves temporary download URL for audio message  
    - Configuration: Uses audio media ID from incoming message JSON  
    - Inputs: Voice output from Input type  
    - Outputs: URL JSON forwarded to Download Audio  
    - Edge cases: Invalid media ID, expired URL, API rate limits

  - **Download Audio**  
    - Type: HTTP Request node  
    - Role: Downloads audio file from URL  
    - Configuration: Uses HTTP Header Auth with WhatsApp credentials for authorization  
    - Inputs: URL from Get Audio Url  
    - Outputs: Binary audio data forwarded to Transcribe Audio  
    - Edge cases: Network timeouts, auth failures, corrupted downloads

  - **Get Image Url**  
    - Type: WhatsApp node (mediaUrlGet)  
    - Role: Retrieves temporary download URL for image message  
    - Configuration: Uses image media ID from incoming message JSON  
    - Inputs: Image output from Input type  
    - Outputs: URL JSON forwarded to Download Image  
    - Edge cases: Same as Get Audio Url

  - **Download Image**  
    - Type: HTTP Request node  
    - Role: Downloads image file from URL  
    - Configuration: Uses HTTP Header Auth with WhatsApp credentials  
    - Inputs: URL from Get Image Url  
    - Outputs: Binary image data forwarded to Analyze Image  
    - Edge cases: Same as Download Audio

  - **Get File Url**  
    - Type: WhatsApp node (mediaUrlGet)  
    - Role: Retrieves temporary download URL for document message  
    - Configuration: Uses document media ID from incoming message JSON  
    - Inputs: Only PDF File node output (true branch)  
    - Outputs: URL JSON forwarded to Download File  
    - Edge cases: Same as Get Audio Url

  - **Download File**  
    - Type: HTTP Request node  
    - Role: Downloads document file from URL  
    - Configuration: Uses HTTP Header Auth with WhatsApp credentials  
    - Inputs: URL from Get File Url  
    - Outputs: Binary file data forwarded to Extract from File  
    - Edge cases: Same as Download Audio

  - **Only PDF File**  
    - Type: IF node  
    - Role: Checks if document MIME type equals "application/pdf"  
    - Configuration: Strict string equality check on `$json.messages[0].document.mime_type`  
    - Inputs: Document output from Input type  
    - Outputs: True branch to Get File Url, False branch to Incorrect format  
    - Edge cases: MIME type missing or incorrect, false negatives

  - **Incorrect format**  
    - Type: WhatsApp node (send message)  
    - Role: Sends error message "Sorry but you can only send PDF files"  
    - Inputs: False branch of Only PDF File  
    - Outputs: None  
    - Edge cases: WhatsApp API send failures

---

#### 2.3 Content Processing & AI Analysis

- **Overview:**  
  Processes downloaded media or text messages into textual content suitable for AI analysis, then sends it to the AI agent node.

- **Nodes Involved:**  
  - Transcribe Audio (OpenAI node)  
  - Analyze Image (OpenAI node)  
  - Extract from File (Extract from File node)  
  - Text (Set node)  
  - Audio (Set node)  
  - Image (Set node)  
  - File (Set node)  
  - AI Agent1 (Langchain Agent node)

- **Node Details:**

  - **Transcribe Audio**  
    - Type: OpenAI node (audio transcribe)  
    - Role: Converts audio binary data into text using OpenAI Whisper  
    - Inputs: Binary audio from Download Audio  
    - Outputs: Transcribed text forwarded to Audio (Set node)  
    - Edge cases: Poor audio quality, transcription errors, API rate limits

  - **Analyze Image**  
    - Type: OpenAI node (image analysis)  
    - Role: Analyzes base64-encoded image and generates detailed description  
    - Configuration: Uses GPT-4o-mini model with a detailed system prompt for image description  
    - Inputs: Base64 image from Download Image  
    - Outputs: Description text forwarded to Image (Set node)  
    - Edge cases: Low resolution images, ambiguous content, API errors

  - **Extract from File**  
    - Type: Extract from File node  
    - Role: Extracts text content from PDF binary data  
    - Inputs: Binary PDF from Download File  
    - Outputs: Extracted text forwarded to File (Set node)  
    - Edge cases: Corrupted PDFs, unsupported PDF features

  - **Text (Set node)**  
    - Type: Set node  
    - Role: Assigns text message body to a `text` field for AI Agent input  
    - Inputs: Text output from Input type  
    - Outputs: Prepared JSON with `text` forwarded to AI Agent1  
    - Edge cases: Empty or malformed text

  - **Audio (Set node)**  
    - Type: Set node  
    - Role: Assigns transcribed audio text to `text` field for AI Agent input  
    - Inputs: Transcribed text from Transcribe Audio  
    - Outputs: Prepared JSON forwarded to AI Agent1  
    - Edge cases: Empty transcription

  - **Image (Set node)**  
    - Type: Set node  
    - Role: Combines user caption and AI-generated image description into a single `text` field for AI Agent input  
    - Inputs: Description from Analyze Image and caption from WhatsApp Trigger  
    - Outputs: Prepared JSON forwarded to AI Agent1  
    - Edge cases: Missing captions or descriptions

  - **File (Set node)**  
    - Type: Set node  
    - Role: Combines user caption and extracted PDF text into a single `text` field for AI Agent input  
    - Inputs: Extracted text from Extract from File and caption from WhatsApp Trigger  
    - Outputs: Prepared JSON forwarded to AI Agent1  
    - Edge cases: Missing captions or extracted text

  - **AI Agent1**  
    - Type: Langchain Agent node  
    - Role: Central AI processing node that receives prepared text input and generates a response  
    - Configuration:  
      - Uses GPT-4o-mini model  
      - System prompt defines capabilities for multimodal input analysis and response guidelines  
      - Connected to Simple Memory node for contextual conversation  
    - Inputs: Text from Text, Audio, Image, or File nodes  
    - Outputs: AI-generated response text forwarded to response handling  
    - Edge cases: API failures, prompt errors, memory buffer issues

---

#### 2.4 Response Generation & Formatting

- **Overview:**  
  Determines if the AI response should be sent as text or converted to audio, and prepares the response accordingly.

- **Nodes Involved:**  
  - From audio to audio? (IF node)  
  - Generate Audio Response (OpenAI node)  
  - Fix mimeType for Audio (Code node)

- **Node Details:**

  - **From audio to audio?**  
    - Type: IF node  
    - Role: Checks if the original message was an audio message to decide response format  
    - Condition: Checks existence of `audio` field in original WhatsApp message JSON  
    - Inputs: AI Agent1 output  
    - Outputs: True branch to Generate Audio Response, False branch to Send message  
    - Edge cases: Missing audio field, false positives

  - **Generate Audio Response**  
    - Type: OpenAI node (text-to-speech)  
    - Role: Converts AI text response into audio using OpenAI's TTS (voice "onyx")  
    - Inputs: AI Agent1 output text  
    - Outputs: Binary audio forwarded to Fix mimeType for Audio  
    - Edge cases: TTS API errors, unsupported voice parameters

  - **Fix mimeType for Audio**  
    - Type: Code node  
    - Role: Corrects MIME type from 'audio/mp3' to 'audio/mpeg' for WhatsApp compatibility  
    - Inputs: Binary audio from Generate Audio Response  
    - Outputs: Corrected binary audio forwarded to Send audio  
    - Edge cases: Missing binary data, unexpected MIME types

---

#### 2.5 Response Delivery

- **Overview:**  
  Sends the AI-generated response back to the user via WhatsApp, either as text or audio.

- **Nodes Involved:**  
  - Send message (WhatsApp node)  
  - Send audio (WhatsApp node)

- **Node Details:**

  - **Send message**  
    - Type: WhatsApp node (send message)  
    - Role: Sends AI text response to user’s WhatsApp number  
    - Configuration: Uses phone number from original message sender, sends text body from AI Agent1 output  
    - Inputs: AI Agent1 output (for text responses) or From audio to audio? false branch  
    - Outputs: None  
    - Edge cases: WhatsApp API send failures, invalid phone numbers

  - **Send audio**  
    - Type: WhatsApp node (send media)  
    - Role: Sends AI-generated audio response to user’s WhatsApp number  
    - Configuration: Sends audio binary with corrected MIME type, uses phone number from original message sender  
    - Inputs: Fixed audio binary from Fix mimeType for Audio  
    - Outputs: None  
    - Edge cases: Media size limits, API failures

---

#### 2.6 Contextual Memory Management

- **Overview:**  
  Maintains a sliding window memory buffer per user session to provide context-aware AI responses.

- **Nodes Involved:**  
  - Simple Memory (Langchain memoryBufferWindow)  
  - AI Agent1 (connected to memory)

- **Node Details:**

  - **Simple Memory**  
    - Type: Langchain memoryBufferWindow node  
    - Role: Stores last 10 interactions per user session keyed by WhatsApp user ID  
    - Configuration:  
      - Session key: `memory_{{user_wa_id}}`  
      - Context window length: 10 messages  
    - Inputs: Connected as AI memory input to AI Agent1  
    - Outputs: Provides conversation history context to AI Agent1  
    - Edge cases: Memory overflow, session key collisions, data privacy concerns

---

#### 2.7 Error Handling & Unsupported Formats

- **Overview:**  
  Handles unsupported message types and incorrect file formats by sending user-friendly error messages.

- **Nodes Involved:**  
  - Not supported (WhatsApp node)  
  - Incorrect format (WhatsApp node)

- **Node Details:**

  - **Not supported**  
    - Sends message: "You can only send text messages, images, audio files and PDF documents."  
    - Triggered by Input type fallback output

  - **Incorrect format**  
    - Sends message: "Sorry but you can only send PDF files"  
    - Triggered by Only PDF File IF node false branch

---

### 3. Summary Table

| Node Name           | Node Type                        | Functional Role                          | Input Node(s)           | Output Node(s)               | Sticky Note                                                                                         |
|---------------------|---------------------------------|----------------------------------------|-------------------------|-----------------------------|---------------------------------------------------------------------------------------------------|
| WhatsApp Trigger     | WhatsApp Trigger                | Entry point, receives WhatsApp messages| -                       | Input type                  | How to obtain Whatsapp API? (detailed setup steps in sticky note)                                 |
| Input type          | Switch                         | Routes messages by type                 | WhatsApp Trigger         | Text, Voice, Image, Document, Not supported |                                                                                                   |
| Text                | Set                            | Prepares text message for AI           | Input type (Text)        | AI Agent1                   | ## Text                                                                                           |
| Voice               | Set                            | Prepares transcribed audio text for AI | Transcribe Audio         | AI Agent1                   | ## Voice                                                                                          |
| Image               | Set                            | Prepares image description for AI      | Analyze Image            | AI Agent1                   | ## Image                                                                                          |
| File                | Set                            | Prepares extracted PDF text for AI     | Extract from File        | AI Agent1                   | ## Document                                                                                       |
| Not supported       | WhatsApp (send message)         | Sends error for unsupported message    | Input type (fallback)    | -                           |                                                                                                   |
| Get Audio Url       | WhatsApp (mediaUrlGet)          | Retrieves audio media URL               | Input type (Voice)       | Download Audio              |                                                                                                   |
| Download Audio      | HTTP Request                   | Downloads audio file                    | Get Audio Url            | Transcribe Audio            |                                                                                                   |
| Transcribe Audio    | OpenAI (audio transcribe)       | Transcribes audio to text               | Download Audio           | Voice                       |                                                                                                   |
| Get Image Url       | WhatsApp (mediaUrlGet)          | Retrieves image media URL               | Input type (Image)       | Download Image              |                                                                                                   |
| Download Image      | HTTP Request                   | Downloads image file                    | Get Image Url            | Analyze Image               |                                                                                                   |
| Analyze Image       | OpenAI (image analysis)          | Generates detailed image description   | Download Image           | Image                       |                                                                                                   |
| Only PDF File       | IF                             | Checks if document is PDF               | Input type (Document)    | Get File Url, Incorrect format |                                                                                                   |
| Get File Url        | WhatsApp (mediaUrlGet)          | Retrieves document media URL            | Only PDF File (true)     | Download File               |                                                                                                   |
| Download File       | HTTP Request                   | Downloads document file                 | Get File Url             | Extract from File           |                                                                                                   |
| Extract from File   | Extract from File               | Extracts text from PDF                  | Download File            | File                        |                                                                                                   |
| AI Agent1           | Langchain Agent                | Central AI processing and response     | Text, Voice, Image, File | From audio to audio?        | ## Response                                                                                       |
| Simple Memory       | Langchain memoryBufferWindow    | Maintains conversation context         | -                       | AI Agent1 (memory input)    |                                                                                                   |
| From audio to audio?| IF                             | Checks if original message was audio   | AI Agent1                | Generate Audio Response, Send message |                                                                                                   |
| Generate Audio Response | OpenAI (text-to-speech)       | Converts AI text response to audio     | From audio to audio?     | Fix mimeType for Audio      |                                                                                                   |
| Fix mimeType for Audio | Code                          | Fixes MIME type for WhatsApp audio     | Generate Audio Response  | Send audio                  |                                                                                                   |
| Send message        | WhatsApp (send message)         | Sends text response to user            | AI Agent1, From audio to audio? (false) | -                           |                                                                                                   |
| Send audio          | WhatsApp (send media)           | Sends audio response to user           | Fix mimeType for Audio   | -                           |                                                                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create WhatsApp Trigger node**  
   - Type: WhatsApp Trigger  
   - Parameters: Subscribe to `messages` updates  
   - Credentials: WhatsApp OAuth account with Meta Business API credentials  
   - Position: Entry point

2. **Add Switch node "Input type"**  
   - Type: Switch  
   - Conditions:  
     - Text: `$json.messages[0].text.body` exists  
     - Voice: `$json.messages[0].audio` exists  
     - Image: `$json.messages[0].image` exists  
     - Document: `$json.messages[0].document` exists  
   - Fallback output: "extra" (unsupported)  
   - Connect WhatsApp Trigger output to Input type input

3. **Add WhatsApp node "Not supported"**  
   - Type: WhatsApp (send message)  
   - Text: "You can only send text messages, images, audio files and PDF documents."  
   - Recipient: `{{$json.messages[0].from}}`  
   - Connect Input type fallback output to this node

4. **Text message branch:**  
   - Add Set node "Text"  
     - Assign `text` = `{{$json.messages[0].text.body}}`  
   - Connect Input type Text output to Text node

5. **Voice message branch:**  
   - Add WhatsApp node "Get Audio Url"  
     - Operation: mediaUrlGet  
     - Media ID: `{{$json.messages[0].audio.id}}`  
     - Credentials: WhatsApp API credentials  
   - Connect Input type Voice output to Get Audio Url

   - Add HTTP Request node "Download Audio"  
     - URL: `{{$json.url}}`  
     - Auth: HTTP Header Auth with WhatsApp credentials  
   - Connect Get Audio Url output to Download Audio

   - Add OpenAI node "Transcribe Audio"  
     - Resource: audio  
     - Operation: transcribe  
     - Credentials: OpenAI API key  
   - Connect Download Audio output to Transcribe Audio

   - Add Set node "Audio"  
     - Assign `text` = `{{$json.text}}` (transcribed text)  
   - Connect Transcribe Audio output to Audio node

6. **Image message branch:**  
   - Add WhatsApp node "Get Image Url"  
     - Operation: mediaUrlGet  
     - Media ID: `{{$json.messages[0].image.id}}`  
     - Credentials: WhatsApp API credentials  
   - Connect Input type Image output to Get Image Url

   - Add HTTP Request node "Download Image"  
     - URL: `{{$json.url}}`  
     - Auth: HTTP Header Auth with WhatsApp credentials  
   - Connect Get Image Url output to Download Image

   - Add OpenAI node "Analyze Image"  
     - Resource: image  
     - Operation: analyze  
     - Model: GPT-4o-mini  
     - Input: base64 image from Download Image  
     - System prompt: detailed image description prompt (as per workflow)  
     - Credentials: OpenAI API key  
   - Connect Download Image output to Analyze Image

   - Add Set node "Image"  
     - Assign `text` =  
       ```
       User request on the image:
       {{ "Describe the following image" || $json.messages[0].image.caption }}

       Image description:
       {{ $json.content }}
       ```  
   - Connect Analyze Image output to Image node

7. **Document (PDF) message branch:**  
   - Add IF node "Only PDF File"  
     - Condition: `$json.messages[0].document.mime_type` equals "application/pdf"  
   - Connect Input type Document output to Only PDF File

   - Add WhatsApp node "Incorrect format"  
     - Text: "Sorry but you can only send PDF files"  
     - Recipient: `{{$json.messages[0].from}}`  
   - Connect Only PDF File false output to Incorrect format

   - Add WhatsApp node "Get File Url"  
     - Operation: mediaUrlGet  
     - Media ID: `{{$json.messages[0].document.id}}`  
     - Credentials: WhatsApp API credentials  
   - Connect Only PDF File true output to Get File Url

   - Add HTTP Request node "Download File"  
     - URL: `{{$json.url}}`  
     - Auth: HTTP Header Auth with WhatsApp credentials  
   - Connect Get File Url output to Download File

   - Add Extract from File node "Extract from File"  
     - Operation: pdf  
   - Connect Download File output to Extract from File

   - Add Set node "File"  
     - Assign `text` =  
       ```
       User request on the file:
       {{ "Describe this file" || $json.messages[0].document.caption }}

       File content:
       {{ $json.text }}
       ```  
   - Connect Extract from File output to File node

8. **Add Langchain memory node "Simple Memory"**  
   - Session key: `memory_{{ $json.contacts[0].wa_id }}`  
   - Session ID type: customKey  
   - Context window length: 10  
   - No input connections (used as AI memory input)

9. **Add Langchain Agent node "AI Agent1"**  
   - Model: GPT-4o-mini  
   - System prompt: detailed multimodal assistant prompt (as per workflow)  
   - Connect memory input to Simple Memory  
   - Connect Text, Audio, Image, File nodes outputs to AI Agent1 input (merge branches)  

10. **Add IF node "From audio to audio?"**  
    - Condition: Check if original message contains `audio` field  
    - Connect AI Agent1 output to this node

11. **Add OpenAI node "Generate Audio Response"**  
    - Resource: audio  
    - Operation: text-to-speech  
    - Voice: onyx  
    - Input: AI Agent1 output text  
    - Credentials: OpenAI API key  
    - Connect From audio to audio? true output to this node

12. **Add Code node "Fix mimeType for Audio"**  
    - JavaScript code to fix MIME type from 'audio/mp3' to 'audio/mpeg'  
    - Connect Generate Audio Response output to this node

13. **Add WhatsApp node "Send audio"**  
    - Operation: send media (audio)  
    - Media path: use binary data from previous node  
    - Recipient: `{{$json.contacts[0].wa_id}}`  
    - Credentials: WhatsApp API credentials  
    - Connect Fix mimeType for Audio output to this node

14. **Add WhatsApp node "Send message"**  
    - Operation: send message (text)  
    - Text body: AI Agent1 output text  
    - Recipient: `{{$json.messages[0].from}}`  
    - Credentials: WhatsApp API credentials  
    - Connect From audio to audio? false output to this node

15. **Connect all nodes appropriately**  
    - WhatsApp Trigger → Input type  
    - Input type → Text, Voice, Image, Document, Not supported  
    - Text → AI Agent1  
    - Voice → Get Audio Url → Download Audio → Transcribe Audio → Audio → AI Agent1  
    - Image → Get Image Url → Download Image → Analyze Image → Image → AI Agent1  
    - Document → Only PDF File → (true) Get File Url → Download File → Extract from File → File → AI Agent1  
    - Document → Only PDF File → (false) Incorrect format  
    - AI Agent1 → From audio to audio?  
    - From audio to audio? → (true) Generate Audio Response → Fix mimeType for Audio → Send audio  
    - From audio to audio? → (false) Send message  
    - Simple Memory connected as AI memory input to AI Agent1

16. **Credential Setup**  
    - WhatsApp OAuth credentials for WhatsApp Trigger, WhatsApp nodes, HTTP Request nodes (via HTTP Header Auth)  
    - OpenAI API key for OpenAI nodes (Analyze Image, Transcribe Audio, Generate Audio Response, AI Agent1)  

17. **Test the workflow**  
    - Send test messages of each type (text, audio, image, PDF) to the WhatsApp number  
    - Verify correct AI responses and media handling  
    - Check error messages for unsupported formats

---

This completes the detailed analysis and reconstruction guide for the AI-Powered WhatsApp Chatbot workflow.