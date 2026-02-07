Automate NGO Aid Request Management with Telegram, GPT-4, and Google Sheets

https://n8nworkflows.xyz/workflows/automate-ngo-aid-request-management-with-telegram--gpt-4--and-google-sheets-7898


# Automate NGO Aid Request Management with Telegram, GPT-4, and Google Sheets

### 1. Workflow Overview

This workflow automates the management of aid requests received by an NGO through Telegram. It processes incoming messages, either text or voice, categorizes the requests using GPT-4-powered AI, and logs structured data into Google Sheets for tracking and action. The workflow then sends a confirmation message back to the requester via Telegram.

**Target Use Cases:**  
- NGOs receiving aid requests from beneficiaries via Telegram in Arabic.  
- Automatic transcription and categorization of voice and text requests.  
- Structured logging of requests for operational follow-up.  
- Immediate feedback to the requester acknowledging receipt and category.

**Logical Blocks:**  
- **1.1 Input Reception:** Receiving Telegram messages (text or voice).  
- **1.2 Message Type Routing:** Differentiating between text and audio messages.  
- **1.3 Audio Processing:** Fetching and transcribing voice messages.  
- **1.4 Text Extraction:** Extracting plain text from Telegram messages.  
- **1.5 AI Processing:** Using GPT-4 to categorize requests and suggest actions, with structured output parsing.  
- **1.6 Data Persistence:** Saving request details to Google Sheets, with separate handling for audio and text inputs.  
- **1.7 Confirmation Messaging:** Sending a Telegram message confirming request receipt and category.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:** Listens for new messages on a specified Telegram bot and triggers the workflow.  
- **Nodes Involved:** Telegram Trigger  
- **Node Details:**  
  - **Telegram Trigger**  
    - Type: Telegram Trigger node, listens for new incoming messages (updates: message).  
    - Configured with Telegram API credentials linked to the NGO’s bot.  
    - Inputs: Telegram webhook event for incoming messages.  
    - Outputs: Raw Telegram message JSON to next node.  
    - Potential Failures: Connectivity issues with Telegram API, webhook misconfiguration, credential expiration.

#### 1.2 Message Type Routing

- **Overview:** Determines if the incoming message is text or voice to route processing accordingly.  
- **Nodes Involved:** Route Message Type  
- **Node Details:**  
  - **Route Message Type**  
    - Type: Switch node.  
    - Configuration: Checks if `message.text` exists for "Text" route; if `message.voice.file_id` exists for "Audio" route.  
    - Inputs: Output from Telegram Trigger.  
    - Outputs: Two branches — Text messages and Audio messages.  
    - Edge Cases: Messages with neither text nor voice fields; message types other than voice/text (e.g., images) are ignored.

#### 1.3 Audio Processing

- **Overview:** For voice messages, fetches the audio file from Telegram and transcribes it to text via OpenAI.  
- **Nodes Involved:** Fetch Audio File, Transcribe Voice Message  
- **Node Details:**  
  - **Fetch Audio File**  
    - Type: Telegram node (file resource).  
    - Configured to fetch file by `message.voice.file_id`.  
    - Inputs: Audio messages branch from Route Message Type.  
    - Outputs: Binary audio file to transcription node.  
    - Failures: Missing or expired file ID, Telegram API errors.  
  - **Transcribe Voice Message**  
    - Type: Langchain OpenAI node with audio resource, operation "transcribe".  
    - Uses OpenAI credentials configured for transcription.  
    - Inputs: Audio file from Fetch Audio File.  
    - Outputs: Transcribed text for AI categorization.  
    - Failures: OpenAI API timeout, transcription errors, unsupported audio format.

#### 1.4 Text Extraction

- **Overview:** For text messages, extracts the plain text content for AI processing.  
- **Nodes Involved:** Extract Text Message  
- **Node Details:**  
  - **Extract Text Message**  
    - Type: Set node to assign `text` variable from incoming message text.  
    - Inputs: Text messages branch from Route Message Type.  
    - Outputs: JSON containing `text` property for AI node.  
    - Failures: Missing or empty text field; expression evaluation errors.

#### 1.5 AI Processing

- **Overview:** Applies GPT-4 AI to categorize the request and suggest actions in Arabic, parsing the structured output.  
- **Nodes Involved:** AI Agent, Structured Output Parser, OpenAI Chat Model  
- **Node Details:**  
  - **AI Agent**  
    - Type: Langchain agent node.  
    - Configuration: Passes user text (from extracted or transcribed text) with a system prompt instructing categorization and action suggestion in Arabic JSON format.  
    - Inputs: Text from Extract Text Message or Transcribe Voice Message.  
    - Outputs: AI response including structured JSON.  
    - Failures: API rate limits, prompt parsing errors, language generation errors.  
  - **Structured Output Parser**  
    - Type: Langchain output parser node.  
    - Configured with JSON schema example for expected fields: `category` and `action`.  
    - Inputs: AI Agent output parser channel.  
    - Outputs: Parsed JSON with `category` and `action` fields.  
    - Failures: Non-conforming AI output, JSON parse errors.  
  - **OpenAI Chat Model**  
    - Type: Langchain Chat OpenAI model node.  
    - Model: GPT-4o-mini.  
    - Used internally by AI Agent.  
    - Inputs/Outputs: Connected as AI language model resource.  
    - Failures: Same as AI Agent node.

#### 1.6 Data Persistence

- **Overview:** Saves the full request details into Google Sheets, differentiating storage for audio and text requests.  
- **Nodes Involved:** Route to Appropriate Sheet, Save Audio Request to Sheet, Save Text Request to Sheet  
- **Node Details:**  
  - **Route to Appropriate Sheet**  
    - Type: Switch node.  
    - Routes based on presence of `voice.file_id` (audio) or `message.text` (text).  
    - Inputs: Output from AI Agent (processed structured data).  
    - Outputs: Two branches for audio and text saving nodes.  
  - **Save Audio Request to Sheet**  
    - Type: Google Sheets node (appendOrUpdate operation).  
    - Document: Specific Google Sheet URL, Sheet1 (gid=0).  
    - Maps data: Telegram message ID, AI-derived `action` and `category`, Telegram user info, transcription text.  
    - Inputs: Audio branch from Route to Appropriate Sheet.  
    - Outputs: Confirmation message node.  
    - Failures: Google API auth errors, sheet permission errors, rate limits.  
  - **Save Text Request to Sheet**  
    - Type: Google Sheets node (appendOrUpdate operation).  
    - Same Google Sheet and mapping as audio node, except includes raw message text instead of transcription.  
    - Inputs: Text branch from Route to Appropriate Sheet.  
    - Outputs: Confirmation message node.  
    - Failures: Same as Save Audio node.

#### 1.7 Confirmation Messaging

- **Overview:** Sends a Telegram message to the user confirming receipt of the request and its assigned category.  
- **Nodes Involved:** Send Confirmation Message  
- **Node Details:**  
  - **Send Confirmation Message**  
    - Type: Telegram node (send message).  
    - Text: Confirmation in Arabic with dynamic insertion of the AI-determined category.  
    - Chat ID: Taken from original Telegram message.  
    - Inputs: From both Save Audio and Save Text nodes.  
    - Failures: Telegram API errors, invalid chat ID, message formatting errors.

---

### 3. Summary Table

| Node Name                | Node Type                               | Functional Role                               | Input Node(s)           | Output Node(s)                 | Sticky Note                     |
|--------------------------|---------------------------------------|-----------------------------------------------|-------------------------|-------------------------------|--------------------------------|
| Telegram Trigger          | Telegram Trigger                      | Receives incoming Telegram messages           | -                       | Route Message Type             |                                |
| Route Message Type        | Switch                               | Routes message by type: Text or Audio          | Telegram Trigger         | Extract Text Message, Fetch Audio File |                                |
| Extract Text Message      | Set                                  | Extracts text content from Telegram message    | Route Message Type       | AI Agent                      |                                |
| Fetch Audio File          | Telegram (file fetch)                 | Downloads voice message audio file              | Route Message Type       | Transcribe Voice Message      |                                |
| Transcribe Voice Message  | Langchain OpenAI (audio transcribe) | Converts audio to text transcription            | Fetch Audio File         | AI Agent                      |                                |
| AI Agent                 | Langchain agent                      | Categorizes request and suggests action in Arabic | Extract Text Message, Transcribe Voice Message | Route to Appropriate Sheet     |                                |
| OpenAI Chat Model         | Langchain Chat OpenAI model          | Underlying GPT-4 chat model for AI Agent       | AI Agent (ai_languageModel) | AI Agent (ai_outputParser)     |                                |
| Structured Output Parser  | Langchain output parser structured   | Parses AI JSON output into structured fields   | AI Agent (ai_outputParser) | Route to Appropriate Sheet     |                                |
| Route to Appropriate Sheet| Switch                               | Routes processed data to audio or text sheet   | AI Agent                 | Save Audio Request to Sheet, Save Text Request to Sheet |                                |
| Save Audio Request to Sheet| Google Sheets                       | Saves audio request details to Google Sheet    | Route to Appropriate Sheet | Send Confirmation Message      |                                |
| Save Text Request to Sheet| Google Sheets                        | Saves text request details to Google Sheet     | Route to Appropriate Sheet | Send Confirmation Message      |                                |
| Send Confirmation Message | Telegram                            | Sends confirmation message back to requester   | Save Audio Request to Sheet, Save Text Request to Sheet | -                             |                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Configure with your Telegram Bot API credentials.  
   - Set "Updates" to listen for "message" events.

2. **Add Switch Node: Route Message Type**  
   - Add a Switch node connected to Telegram Trigger.  
   - Add two rules:  
     - Text: Check if `message.text` exists (string operation: exists).  
     - Audio: Check if `message.voice.file_id` exists (string operation: exists).

3. **Add Extract Text Message Node**  
   - Type: Set node.  
   - Connected to Text output of Route Message Type.  
   - Assign a new field `text` with expression: `{{$json.message.text}}`.

4. **Add Fetch Audio File Node**  
   - Type: Telegram node (file resource).  
   - Connected to Audio output of Route Message Type.  
   - Set parameter `fileId` to `{{$json.message.voice.file_id}}`.  
   - Configure with Telegram API credentials.

5. **Add Transcribe Voice Message Node**  
   - Type: Langchain OpenAI node, resource: Audio, operation: Transcribe.  
   - Connect to Fetch Audio File node.  
   - Configure with OpenAI API credentials.

6. **Add AI Agent Node**  
   - Type: Langchain agent node.  
   - Connect outputs of Extract Text Message and Transcribe Voice Message nodes to AI Agent.  
   - Set parameter `text` to: `here is request from beneficiary: {{ $json.text }}`.  
   - System message prompt: instruct the AI to act as NGO TPM team leader, categorize the request, suggest action in Arabic JSON format.  
   - Enable output parser.

7. **Add Structured Output Parser Node**  
   - Type: Langchain output parser structured node.  
   - Connect it to AI Agent’s output parser channel.  
   - Provide JSON schema example with fields: `category` and `action`.

8. **Add Route to Appropriate Sheet Node**  
   - Type: Switch node.  
   - Connected to AI Agent node.  
   - Add rules based on presence of `voice.file_id` and `message.text` from original Telegram message JSON.  
   - Outputs: Audio and Text branches.

9. **Add Save Audio Request to Sheet Node**  
   - Type: Google Sheets node, operation: appendOrUpdate.  
   - Connected to Audio output from Route to Appropriate Sheet.  
   - Configure with Google Sheets OAuth2 credentials.  
   - Set document ID and sheet name to target Google Sheet.  
   - Map columns: ID (message ID), action, category, last name, first name, Transcription (from transcription node), Telegram username.

10. **Add Save Text Request to Sheet Node**  
    - Type: Google Sheets node, operation: appendOrUpdate.  
    - Connected to Text output from Route to Appropriate Sheet.  
    - Same Google Sheet and column mapping, except include raw message text instead of transcription.

11. **Add Send Confirmation Message Node**  
    - Type: Telegram node (send message).  
    - Connect outputs of both Save Audio and Save Text nodes.  
    - Configure text: "تم استقبال طلبك انه هنالك {{ $('AI Agent').item.json.output.category }}"  
    - Chat ID from original Telegram message: `{{$json.message.chat.id}}`.  
    - Use Telegram API credentials.

12. **Verify all credentials are set up correctly:**  
    - Telegram API for sending and receiving messages.  
    - OpenAI API for transcription and AI categorization.  
    - Google Sheets OAuth2 for data persistence.

13. **Test the workflow with sample text and voice messages in Arabic to confirm correct handling, AI processing, data saving, and confirmation messaging.**

---

### 5. General Notes & Resources

| Note Content                                                                                  | Context or Link                                                                                                     |
|-----------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| The AI prompt is designed to always respond in Arabic with JSON containing "category" and "action". | Critical for consistent structured output parsing.                                                                 |
| Google Sheet URL used: https://docs.google.com/spreadsheets/d/1JKCLCjfm3xIFg5YH0EH9qK4W69jjeX673dFxaHfVRzo/edit?usp=sharing | Target spreadsheet for saving requests.                                                                            |
| Telegram Bot used: DigiSteps1_bot message (credentials named accordingly).                      | Telegram bot must have appropriate permissions and webhook configured.                                             |
| OpenAI model used: GPT-4o-mini for chat completions.                                          | Ensure OpenAI account has access to GPT-4o-mini or adjust model accordingly.                                        |

---

This documentation provides a complete understanding of the workflow’s design, node-by-node logic, and instructions for recreation or modification, facilitating operational use and future enhancements.