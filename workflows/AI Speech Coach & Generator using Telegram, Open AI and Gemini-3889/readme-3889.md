AI Speech Coach & Generator using Telegram, Open AI and Gemini

https://n8nworkflows.xyz/workflows/ai-speech-coach---generator-using-telegram--open-ai-and-gemini-3889


# AI Speech Coach & Generator using Telegram, Open AI and Gemini

### 1. Workflow Overview

This n8n workflow named **"AI Speech Coach & Generator using Telegram, Open AI and Gemini"** serves as a personal AI-powered speechwriting coach accessible via Telegram. It facilitates interactive speech drafting, iterative AI feedback, and final speech synthesis by leveraging OpenAI and Google Gemini language models. Users can submit speech drafts either as text or voice messages, receive structured feedback on speech quality, and generate refined speeches incorporating previous inputs and critiques.

The workflow is logically organized into the following functional blocks:

- **1.1 Input Reception and Preprocessing**: Handles incoming Telegram messages, distinguishes between text and voice inputs, transcribes audio if needed, and normalizes the text data for further processing.

- **1.2 Message Content Routing and Prompt Setting**: Routes the input based on commands or content ("new speech", "generate speech", or others) and sets dynamic system prompts accordingly to guide AI behavior.

- **1.3 AI Interaction and Memory Management**: Uses Google Gemini and OpenAI models to generate feedback or speeches, manages conversation memory for context continuity, and clears memory on new speech initiation to avoid cross-contamination of sessions.

- **1.4 Output Formatting and Telegram Response**: Cleans AI-generated text from formatting that may break Telegram message parsing, splits long messages into Telegram-compatible chunks, and sends these back to the user through Telegram.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Preprocessing

- **Overview**:  
  This block receives messages from Telegram, determines if they are text or voice, and extracts the speech content in text form to be processed downstream.

- **Nodes Involved**:  
  - Recieve Telegram Message  
  - Check For Text or Voice Message  
  - If Voice Message  
  - Download Audio File  
  - Transcribe Audio File  

- **Node Details**:  

  - **Recieve Telegram Message**  
    - Type: Telegram Trigger  
    - Role: Entry point for incoming Telegram messages (text or voice).  
    - Configuration: Listens to "message" updates; uses Telegram API credentials.  
    - Input: Incoming Telegram messages.  
    - Output: Raw message JSON forwarded to next node.  
    - Edge cases: Telegram API downtime, webhook misconfigurations.

  - **Check For Text or Voice Message**  
    - Type: Set node  
    - Role: Extracts text from the message JSON or defaults to empty string.  
    - Configuration: Assigns `text = message.text || ""`.  
    - Input: Raw Telegram message JSON.  
    - Output: JSON with `text` property for routing.  
    - Edge cases: Missing `message` or `text` fields; voice with no text fallback.

  - **If Voice Message**  
    - Type: If node  
    - Role: Determines if the message is voice (i.e., `text` is empty).  
    - Configuration: Checks if `text` is empty string;  
    - Input: JSON with `text`.  
    - Output: Two branches — voice message branch if true, else text branch.  
    - Edge cases: Messages with empty text but no voice file.

  - **Download Audio File**  
    - Type: Telegram node  
    - Role: Downloads the voice message file using the `file_id` from Telegram.  
    - Configuration: Uses Telegram API; file ID from incoming voice message.  
    - Input: Voice message file_id from Telegram message JSON.  
    - Output: Binary audio file data for transcription.  
    - Edge cases: File not found, download failure, Telegram API limits.

  - **Transcribe Audio File**  
    - Type: OpenAI node (audio resource)  
    - Role: Transcribes downloaded audio to text using OpenAI's audio transcription.  
    - Configuration: Operation set to "transcribe" with OpenAI API credentials.  
    - Input: Binary audio data from previous node.  
    - Output: Transcribed text JSON.  
    - Edge cases: Audio format unsupported, transcription errors, API quota exceeded.

  - **Flow**:  
    Incoming Telegram message → Check For Text or Voice Message → If Voice Message: Download Audio File → Transcribe Audio File → Route Flow Based on Message Content.

---

#### 2.2 Message Content Routing and Prompt Setting

- **Overview**:  
  Routes the user's input text based on commands ("new speech", "generate speech") or general input, then sets the appropriate AI system prompt for the requested operation.

- **Nodes Involved**:  
  - Route Flow Based on Message Content (Switch)  
  - Wipe Conversation Memory  
  - Set prompt to start a new speech  
  - Set prompt to generate a speech based on the feedback  
  - Set prompt to provide feedback on speech  

- **Node Details**:  

  - **Route Flow Based on Message Content**  
    - Type: Switch node  
    - Role: Checks if the input text contains "new speech" (case-insensitive) or equals "generate speech". Routes accordingly, else routes to feedback.  
    - Configuration:  
      - Output "new_speech" if input text contains "new speech"  
      - Output "generate_speech" if input text equals "generate speech"  
      - Default/fallback to "extra" (feedback path)  
    - Input: Text from either transcribed audio or text message.  
    - Output: Routes to appropriate prompt nodes or memory wipe.  
    - Edge cases: Partial matches, case sensitivity handled by ignoreCase=true.

  - **Wipe Conversation Memory**  
    - Type: Langchain Memory Manager node  
    - Role: Clears all conversation memory to start fresh (used when "new speech" command received).  
    - Configuration: Mode set to "delete" all memory.  
    - Input: Routed from "new_speech" branch.  
    - Output: Triggers next node for starting new speech prompt.  
    - Edge cases: Memory deletion failure or delays causing residual context.

  - **Set prompt to start a new speech**  
    - Type: Set node  
    - Role: Defines the system prompt guiding the AI as a speech preparation assistant for new speech cycles.  
    - Configuration: Detailed prompt outlining coaching steps, areas to improve, and initial guidance questions.  
    - Input: After memory wipe.  
    - Output: System prompt JSON for AI Agent.  

  - **Set prompt to generate a speech based on the feedback**  
    - Type: Set node  
    - Role: Defines system prompt instructing AI to synthesize a new improved speech incorporating prior inputs and feedback.  
    - Configuration: Detailed instructions about merging themes, feedback, tone, and style.  
    - Input: Routed from "generate_speech" branch.  
    - Output: System prompt JSON for AI Agent.  

  - **Set prompt to provide feedback on speech**  
    - Type: Set node  
    - Role: Defines system prompt instructing AI to critically analyze a speech draft for clarity, engagement, structure, and other metrics.  
    - Configuration: Instructions requesting specific feedback on speech aspects and readiness check.  
    - Input: Routed from "extra" (default path for all other text).  
    - Output: System prompt JSON for AI Agent.

---

#### 2.3 AI Interaction and Memory Management

- **Overview**:  
  This block generates AI responses based on the system prompts and user input, leveraging Google Gemini and OpenAI Langchain nodes, and manages session memory for context retention or reset.

- **Nodes Involved**:  
  - Google Gemini Chat Model  
  - AI Agent  
  - Store Conversation Memory  

- **Node Details**:  

  - **Google Gemini Chat Model**  
    - Type: Langchain Google Gemini Chat Model node  
    - Role: Generates AI language model outputs based on user input and system prompt with Gemini-2.0-flash-001.  
    - Configuration: Uses Google Gemini API credentials; no extra options configured.  
    - Input: User text and system prompt context.  
    - Output: AI-generated text passed to AI Agent.  
    - Edge cases: API key expiry, quota limits, model availability.

  - **AI Agent**  
    - Type: Langchain Agent node  
    - Role: Processes the system prompt and user input text to produce the final AI-generated message for Telegram.  
    - Configuration:  
      - Uses system prompt dynamically set in prior nodes.  
      - Text input drawn from "Route Flow Based on Message Content" node's text.  
      - Enforces plain text output (no Markdown).  
    - Input: Text and system prompts; also receives AI model output from Gemini.  
    - Output: Raw AI response JSON.  
    - Edge cases: Prompt formatting errors, long input causing truncation, or response timeouts.

  - **Store Conversation Memory**  
    - Type: Langchain Memory Buffer Window  
    - Role: Maintains a sliding window memory buffer of last 25 messages per user session (keyed by Telegram user ID) for context continuity.  
    - Configuration: Session key is Telegram user ID; window length is 25 messages.  
    - Input: Conversation inputs and AI Agent outputs.  
    - Output: Updated memory state for future AI interactions.  
    - Edge cases: Memory overflow, session key mismatch, memory persistence failures.

---

#### 2.4 Output Formatting and Telegram Response

- **Overview**:  
  Prepares AI-generated text for Telegram compatibility by removing problematic formatting, splitting large messages into chunks under Telegram's 4000-character limit, and sends the final messages back to users via Telegram.

- **Nodes Involved**:  
  - Code to remove unwanted characters from LLM response  
  - Code to split output into chunks under 4000 characters  
  - Respond to Telegram Message  

- **Node Details**:  

  - **Code to remove unwanted characters from LLM response**  
    - Type: Code (Python) node  
    - Role: Removes Markdown and special characters that could interfere with Telegram message parsing.  
    - Configuration: Uses regex to remove characters like `*`, `_`, `~`, backticks, brackets, punctuation, etc., then trims whitespace.  
    - Input: AI Agent output JSON containing raw text.  
    - Output: JSON with cleaned text under `cleanedText`.  
    - Edge cases: Over-aggressive cleaning removing needed punctuation, or incomplete cleaning causing Telegram parse errors.

  - **Code to split output into chunks under 4000 characters**  
    - Type: Code (Python) node  
    - Role: Splits long cleaned text into multiple message chunks each under 4000 characters to comply with Telegram limits.  
    - Configuration: Attempts to split at sentence boundaries (., ?, !) when possible; otherwise splits at max length.  
    - Input: Cleaned text from prior node.  
    - Output: Multiple JSON items each with a `telegramTextChunk`.  
    - Edge cases: Very long sentences exceeding 4000 chars, unexpected characters breaking split logic.

  - **Respond to Telegram Message**  
    - Type: Telegram node  
    - Role: Sends back the AI-generated, cleaned, and chunked text messages to the user chat in Telegram.  
    - Configuration: Uses Telegram API credentials; sends messages to the chat ID from the original incoming message; disables message attribution.  
    - Input: Text chunks from splitting node.  
    - Output: Telegram message delivery confirmation.  
    - Edge cases: Telegram API limits on message frequency, network issues, chat ID mismatches.

---

### 3. Summary Table

| Node Name                                  | Node Type                                | Functional Role                                       | Input Node(s)                          | Output Node(s)                               | Sticky Note                                                                                                                                                                                     |
|--------------------------------------------|-----------------------------------------|------------------------------------------------------|--------------------------------------|----------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Recieve Telegram Message                    | Telegram Trigger                        | Entry point: Receives Telegram messages (text/voice) | None                                 | Check For Text or Voice Message               | ## Processing Telegram Messages: This section handles incoming messages from Telegram. It first checks if the message contains text. 1. Text Message: routed directly. 2. Audio Message: download & transcribe. |
| Check For Text or Voice Message             | Set                                    | Extracts text string from message JSON                | Recieve Telegram Message             | If Voice Message                              | See above                                                                                                                                                                                      |
| If Voice Message                            | If                                     | Checks if message is voice (text empty)               | Check For Text or Voice Message      | Download Audio File (voice) / Route Flow Based on Message Content (text) | See above                                                                                                                                                                                      |
| Download Audio File                         | Telegram                               | Downloads voice audio file from Telegram               | If Voice Message                    | Transcribe Audio File                         | See above                                                                                                                                                                                      |
| Transcribe Audio File                       | OpenAI (Audio Transcription)           | Transcribes audio to text                               | Download Audio File                  | Route Flow Based on Message Content           | See above                                                                                                                                                                                      |
| Route Flow Based on Message Content         | Switch                                 | Routes based on commands ("new speech", "generate speech") | Check For Text or Voice Message or Transcribe Audio File | Wipe Conversation Memory / Set Prompts       | ## Dynamic System Prompting: This node sets the AI's system prompt according to the user's request identified in the incoming message.                                                        |
| Wipe Conversation Memory                    | Langchain Memory Manager               | Clears AI conversation memory                           | Route Flow Based on Message Content | Set prompt to start a new speech               | ## Clearing AI Agent Memory: Clears short-term memory to reduce AI hallucinations and irrelevant info.                                                                                       |
| Set prompt to start a new speech            | Set                                    | Sets system prompt for new speech preparation          | Wipe Conversation Memory            | AI Agent                                      | See above                                                                                                                                                                                      |
| Set prompt to generate a speech based on feedback | Set                                    | Sets system prompt to synthesize improved speech       | Route Flow Based on Message Content | AI Agent                                      | See above                                                                                                                                                                                      |
| Set prompt to provide feedback on speech   | Set                                    | Sets system prompt to provide constructive speech feedback | Route Flow Based on Message Content | AI Agent                                      | See above                                                                                                                                                                                      |
| Google Gemini Chat Model                    | Langchain LM Chat Google Gemini        | Generates AI text output from user input and prompt    | AI Agent (ai_languageModel input)   | AI Agent                                      | ## Gemini-Powered Response and Conversation Storage: Uses Gemini model to generate responses and maintains conversation state.                                                               |
| AI Agent                                   | Langchain Agent                        | Processes prompt and input to generate final AI message | Set prompt nodes + Google Gemini    | Code to remove unwanted characters from LLM response | See above                                                                                                                                                                                      |
| Store Conversation Memory                   | Langchain Memory Buffer Window         | Manages conversation context memory per user session   | AI Agent                           | Wipe Conversation Memory (ai_memory output)  | See above                                                                                                                                                                                      |
| Code to remove unwanted characters from LLM response | Code (Python)                         | Removes Markdown and special chars from AI output      | AI Agent                            | Code to split output into chunks under 4000 characters | ## Telegram-Ready Output: Formatting and Length Management: Removes problematic chars for Telegram parsing.                                                                                   |
| Code to split output into chunks under 4000 characters | Code (Python)                         | Splits long text into chunks under Telegram limit      | Code to remove unwanted characters  | Respond to Telegram Message                    | See above                                                                                                                                                                                      |
| Respond to Telegram Message                 | Telegram                              | Sends cleaned and chunked AI response messages to user | Code to split output into chunks    | None                                         | See above                                                                                                                                                                                      |
| Sticky Note (various)                       | Sticky Note                           | Provides documentation and explanations                 | None                               | None                                         | See detailed notes in sticky note content for each relevant cluster.                                                                                                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Bot and Setup Telegram Trigger Node**  
   - Create a Telegram bot via BotFather and obtain API token.  
   - In n8n, add a **Telegram Trigger** node named "Recieve Telegram Message".  
   - Configure to listen to "message" updates with your Telegram API credentials.

2. **Add Text Extraction Node**  
   - Add a **Set** node named "Check For Text or Voice Message".  
   - Assign variable `text` with expression: `={{ $json.message.text || "" }}`.

3. **Add Conditional Branch for Voice Messages**  
   - Add an **If** node named "If Voice Message".  
   - Condition: Check if `text` is empty string (`""`).  
   - If true (voice), route to "Download Audio File"; else route to "Route Flow Based on Message Content".

4. **Add Telegram File Download Node for Voice**  
   - Add a **Telegram** node named "Download Audio File".  
   - Configure to download file by `fileId` extracted from `$node["Recieve Telegram Message"].json.message.voice.file_id`.  
   - Use Telegram API credentials.

5. **Add Audio Transcription Node**  
   - Add an **OpenAI** node named "Transcribe Audio File".  
   - Set resource to "audio" and operation to "transcribe".  
   - Use OpenAI API credentials.  
   - Input: binary audio data output from "Download Audio File".

6. **Add Switch Node for Routing Commands**  
   - Add a **Switch** node named "Route Flow Based on Message Content".  
   - Configure 3 outputs:  
     - "new_speech": input text contains "new speech" (case-insensitive).  
     - "generate_speech": input text equals "generate speech".  
     - "extra": all other inputs.

7. **Add Memory Manager Node to Clear Conversation**  
   - Add a Langchain **Memory Manager** node named "Wipe Conversation Memory".  
   - Set mode to "delete" all memory.

8. **Add Set Nodes for System Prompts**  
   - "Set prompt to start a new speech": sets detailed coaching assistant prompt.  
   - "Set prompt to generate a speech based on the feedback": sets speech synthesis prompt.  
   - "Set prompt to provide feedback on speech": sets feedback agent prompt.

9. **Add Langchain Google Gemini Chat Model Node**  
   - Add **Langchain LM Chat Google Gemini** node named "Google Gemini Chat Model".  
   - Use Google Gemini API credentials, model set to "models/gemini-2.0-flash-001".

10. **Add Langchain Agent Node for AI Response**  
    - Add **Langchain Agent** node named "AI Agent".  
    - Configure text input to be the message text from "Route Flow Based on Message Content".  
    - Use dynamic system prompt from previous Set nodes.  
    - Configure to output plain text (no Markdown).

11. **Add Langchain Memory Buffer Node**  
    - Add **Langchain Memory Buffer Window** node named "Store Conversation Memory".  
    - Configure session key as Telegram user ID: `={{ $('Recieve Telegram Message').item.json.message.from.id }}`.  
    - Set window length to 25 messages.

12. **Link Google Gemini Model Output to AI Agent**  
    - Connect "Google Gemini Chat Model" to "AI Agent" as AI language model input.

13. **Connect AI Agent Output to Cleaning Code Node**  
    - Add **Code** node "Code to remove unwanted characters from LLM response".  
    - Python code removes Markdown and special characters to avoid Telegram parsing errors.

14. **Add Code Node to Split Messages**  
    - Add **Code** node "Code to split output into chunks under 4000 characters".  
    - Python code splits cleaned text into Telegram message-sized chunks.

15. **Add Telegram Node to Respond**  
    - Add **Telegram** node "Respond to Telegram Message".  
    - Send messages to the originating chat ID from the initial Telegram message.  
    - Disable attribution.

16. **Wire Nodes Together**  
    - Connect message flow: Telegram Trigger → Text Extraction → If Voice Message → (Voice branch: Download Audio → Transcribe Audio → Switch) or (Text branch: Switch) → Switch outputs to respective prompt Set nodes → AI Agent → Cleaning → Splitting → Respond to Telegram.  
    - Connect memory nodes: AI Agent output → Store Conversation Memory → Wipe Conversation Memory (on new speech) → Set prompt to start new speech.

17. **Credential Setup**  
    - Configure credentials for Telegram API, OpenAI API, and Google Gemini (PaLM) API in n8n credential manager.  
    - Ensure all keys have correct permissions and usage quotas.

18. **Test Workflow**  
    - Send text and voice messages to Telegram bot.  
    - Validate iterative feedback and speech generation commands.  
    - Confirm messages are correctly chunked and formatted in Telegram.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                 | Context or Link                                                                                                     |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| This workflow is designed to be highly adaptable. You can switch input/output interfaces from Telegram to Slack, WhatsApp, or web by replacing the Telegram nodes. Similarly, AI models can be swapped or complemented by adjusting Langchain nodes.                                                                                                      | Workflow flexibility note                                                                                          |
| For speech transcription, OpenAI's Whisper API is used, which requires appropriate audio format and API quota.                                                                                                                                                                                                                                             | Audio transcription dependency                                                                                      |
| Google Gemini LLM is used as the primary AI language model for generating responses and speech synthesis, leveraging the latest available Google AI technology (Gemini 2.0 flash).                                                                                                                                                                            | AI model choice                                                                                                    |
| Telegram messages have a 4000-character limit; hence, messages are split into smaller chunks by the workflow to ensure delivery without truncation errors. Special characters that break Telegram Markdown parsing are removed to avoid message send failures.                                                                                           | Telegram messaging constraints                                                                                      |
| To avoid hallucination and irrelevant AI outputs, the workflow clears AI memory when starting a new speech cycle. Memory buffer length is limited to recent 25 messages for context.                                                                                                                                                                         | AI memory management                                                                                               |
| Step-by-step setup instructions for bot creation and API key generation are included in the initial workflow description for ease of deployment.                                                                                                                                                                                                           | Setup instructions                                                                                                 |
| Sticky notes embedded in the workflow provide detailed explanations on dynamic prompting, memory clearing, Telegram message processing, and output formatting.                                                                                                                                                                                             | Inline documentation in workflow                                                                                   |
| For advanced customization — such as sentiment analysis, keyword density, pacing analysis, or filler word detection — additional nodes and external services can be integrated into this workflow.                                                                                                                                                          | Customization possibilities                                                                                         |
| Official OpenAI API documentation: https://platform.openai.com/docs/                                                                                                                                                                                                                                                                                        | Reference link                                                                                                     |
| Google Gemini / PaLM API documentation: https://cloud.google.com/vertex-ai/docs/generative-ai/overview                                                                                                                                                                                                                                                     | Reference link                                                                                                     |
| Telegram Bot API documentation: https://core.telegram.org/bots/api                                                                                                                                                                                                                                                                                          | Reference link                                                                                                     |

---

This completes the comprehensive analysis and documentation of the "AI Speech Coach & Generator using Telegram, Open AI and Gemini" n8n workflow.