Airbnb Telegram Agent - AI-powered accommodation search with voice support

https://n8nworkflows.xyz/workflows/airbnb-telegram-agent---ai-powered-accommodation-search-with-voice-support-4494


# Airbnb Telegram Agent - AI-powered accommodation search with voice support

### 1. Workflow Overview

This workflow is an AI-powered Airbnb accommodation search agent integrated with Telegram, designed to handle both text and voice user queries. It interprets user requests about Airbnb listings, interacts with a Modular Command Platform (MCP) to fetch real Airbnb data, and returns formatted, mobile-friendly responses on Telegram. It supports voice input by transcribing audio messages and generating voice responses, ensuring a seamless multimodal conversational experience.

The workflow is logically divided into these blocks:

- **1.1 Input Reception & Routing:** Receives messages from Telegram and routes based on message type (text or voice).
- **1.2 Voice Message Processing:** Downloads voice messages, transcribes them into text.
- **1.3 Text Preparation:** Prepares text input, either directly from Telegram or from voice transcription.
- **1.4 Core AI Agent Logic:** Uses LangChain with OpenAI GPT-4.1 to interpret queries, maintain conversation memory, list MCP tools, execute selected tools, and format responses for Telegram.
- **1.5 Response Generation:** Sends text responses back to Telegram and optionally generates summarized voice responses which are converted to audio and sent back.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Routing

- **Overview:** This block captures incoming Telegram messages and determines if the message is text or voice, routing the workflow accordingly.
- **Nodes Involved:** Telegram Trigger, Text or Voice (Switch)

##### Telegram Trigger
- Type: Telegram Trigger Node
- Role: Listens for new Telegram messages (text or voice).
- Configuration: Listens for update type "message" only.
- Input: Webhook from Telegram
- Output: JSON containing message object
- Credentials: Telegram Bot API token
- Edge Cases: Telegram API downtime, invalid webhook setup

##### Text or Voice (Switch)
- Type: Switch Node
- Role: Branches workflow based on whether message contains text or voice.
- Configuration:
  - Condition 1 ("Text"): Message contains non-empty text field.
  - Condition 2 ("Voice"): Message contains a voice object.
- Input: Output from Telegram Trigger
- Output: Routes to either text processing or voice processing path
- Edge Cases: Messages without text or voice are ignored (no route).

#### 2.2 Voice Message Processing

- **Overview:** Handles voice messages by downloading the voice file and transcribing it into text using OpenAI Whisper.
- **Nodes Involved:** Get Voice Message, Transcribe Voice Message

##### Get Voice Message
- Type: Telegram Node (Get File)
- Role: Downloads the voice message file from Telegram servers.
- Configuration: Uses file_id from incoming voice message.
- Input: Voice message JSON from Switch node
- Output: Binary audio file data
- Credentials: Telegram Bot API token
- Edge Cases: File not found, Telegram API errors, file download timeouts

##### Transcribe Voice Message
- Type: LangChain OpenAI Node (Audio Transcription)
- Role: Converts audio message to text using OpenAI Whisper API.
- Configuration: Resource set to "audio" with "transcribe" operation.
- Input: Audio binary data from Get Voice Message
- Output: Transcribed text in JSON
- Credentials: OpenAI API with Whisper access
- Edge Cases: Poor audio quality, API rate limits, transcription errors

#### 2.3 Text Preparation

- **Overview:** Prepares text messages for AI processing, either directly from Telegram text messages or from voice transcription output.
- **Nodes Involved:** Prepare Text Message for AI Agent

##### Prepare Text Message for AI Agent
- Type: Set Node
- Role: Assigns the text field from the Telegram message JSON to a standard `text` property for unified processing.
- Configuration: Sets `text` = incoming message text
- Input: Direct text or transcribed text JSON
- Output: JSON with `text` property
- Edge Cases: Empty or malformed input text

#### 2.4 Core AI Agent Logic

- **Overview:** Central AI agent processes user queries with conversation memory, selects and executes MCP tools for Airbnb data, and formats the response for Telegram.
- **Nodes Involved:** Simple Memory, OpenAI Chat Model, Airbnb MCP Client - List Tools, Airbnb MCP Client - Execute Tools, Airbnb Agent

##### Simple Memory
- Type: LangChain Memory Buffer Window Node
- Role: Maintains conversation context by storing past messages keyed by Telegram chat id.
- Configuration: Uses Telegram chat id as `sessionKey` with custom session ID type.
- Input: Connected to Airbnb Agent node's memory input.
- Output: Supplies memory context to AI agent.
- Edge Cases: Memory overflow, session key missing or invalid.

##### OpenAI Chat Model
- Type: LangChain OpenAI Chat Model Node
- Role: Provides GPT-4.1 chat completions for the agent.
- Configuration: Model set to "gpt-4.1" (enhanced GPT-4).
- Input: Chat messages from agent, context from memory.
- Output: AI-generated chat responses.
- Credentials: OpenAI API key
- Edge Cases: API rate limits, model errors, network failures.

##### Airbnb MCP Client - List Tools
- Type: MCP Client Tool Node
- Role: Fetches list of available MCP tools for Airbnb data access.
- Configuration: No parameters; lists all tools.
- Input: Connected as AI tool input to Airbnb Agent.
- Output: List of available tools.
- Credentials: MCP Client API key
- Edge Cases: MCP server unavailability, authentication errors.

##### Airbnb MCP Client - Execute Tools
- Type: MCP Client Tool Node
- Role: Executes selected MCP tools with parameters parsed from AI agent.
- Configuration:
  - `toolName` and `toolParameters` dynamically set from AI agent outputs.
  - Operation: executeTool
- Input: Connected as AI tool input to Airbnb Agent.
- Output: Results from executed MCP tools.
- Credentials: MCP Client API key
- Edge Cases: Tool not found, parameter errors, execution failures.

##### Airbnb Agent
- Type: LangChain Agent Node
- Role: Core AI agent integrating memory, OpenAI model, MCP tools; interprets user query, selects tools, executes them, formats results.
- Configuration:
  - System prompt defines Airbnb-specific expert agent behavior.
  - Uses MCP tools for data access.
  - Formats output for mobile-friendly Telegram viewing.
- Inputs:
  - Text input (`text`)
  - Memory (`ai_memory`) from Simple Memory node
  - Language model (`ai_languageModel`) from OpenAI Chat Model
  - Tools (`ai_tool`) from MCP Client nodes
- Outputs:
  - Formatted text output
- Edge Cases:
  - Misinterpretation of user query
  - API failures in MCP or OpenAI
  - Formatting errors affecting Telegram display
- Version-specific: Requires LangChain agent support in n8n v1.9+

#### 2.5 Response Generation

- **Overview:** Sends formatted text responses to Telegram; generates summarized voice-friendly text, converts it to speech, and sends as audio message.
- **Nodes Involved:** Send Text Response, Summarize Response for Voice, Create Voice Response, Send Voice Response

##### Send Text Response
- Type: Telegram Node (Send Message)
- Role: Sends the AI-generated text response back to the user on Telegram.
- Configuration:
  - Text from AI agent output JSON property `output`
  - Chat ID from Telegram Trigger message
  - Attribution disabled
- Credentials: Telegram Bot API token
- Edge Cases: Telegram send errors, invalid chat ID

##### Summarize Response for Voice
- Type: LangChain Chain LLM Node
- Role: Summarizes formatted text into a concise, natural-language summary optimized for audio playback.
- Configuration:
  - Prompt instructs removing emojis, links, formatting.
  - Limit word count (max 150 words for lists).
  - Focus on spoken style and key info.
- Input: AI agent text output
- Output: Summarized text for TTS
- Credentials: OpenAI GPT-4
- Edge Cases: Over-summarization or loss of key info, prompt failures

##### Create Voice Response
- Type: LangChain OpenAI Node (Text-to-Speech)
- Role: Converts summarized text into audio (speech synthesis).
- Configuration: Resource set to "audio"
- Input: Summarized text from previous node
- Output: Audio binary data
- Credentials: OpenAI API with TTS access
- Edge Cases: API errors, audio generation delays

##### Send Voice Response
- Type: Telegram Node (Send Audio)
- Role: Sends generated audio message to Telegram user.
- Configuration:
  - Chat ID from Telegram Trigger
  - Sends audio as binary data
- Credentials: Telegram Bot API token
- Edge Cases: Audio file size limits, Telegram API errors

---

### 3. Summary Table

| Node Name                      | Node Type                                      | Functional Role                         | Input Node(s)                      | Output Node(s)                   | Sticky Note                                                      |
|-------------------------------|------------------------------------------------|---------------------------------------|----------------------------------|---------------------------------|-----------------------------------------------------------------|
| Telegram Trigger               | Telegram Trigger                                | Receives incoming Telegram messages   | Webhook                           | Text or Voice                   | Welcome to my Airbnb Telegram Agent Workflow! Full sequence and setup links included. |
| Text or Voice                 | Switch                                         | Routes based on message type           | Telegram Trigger                 | Prepare Text Message, Get Voice Message |                                                                 |
| Get Voice Message              | Telegram                                        | Downloads voice audio file             | Text or Voice                   | Transcribe Voice Message        |                                                                 |
| Transcribe Voice Message       | LangChain OpenAI (Audio Transcription)         | Converts voice audio to text           | Get Voice Message               | Airbnb Agent                   |                                                                 |
| Prepare Text Message for AI Agent | Set                                          | Normalizes text input for AI           | Text or Voice                   | Airbnb Agent                   |                                                                 |
| Simple Memory                 | LangChain Memory Buffer Window                   | Maintains conversation memory          | Airbnb Agent                    | Airbnb Agent                   |                                                                 |
| OpenAI Chat Model              | LangChain OpenAI Chat Model                      | Provides GPT-4.1 chat completions      | Airbnb Agent                    | Airbnb Agent, Summarize Response for Voice |                                                                 |
| Airbnb MCP Client - List Tools | MCP Client Tool                                 | Lists available MCP Airbnb tools       | Airbnb Agent                    | Airbnb Agent                   |                                                                 |
| Airbnb MCP Client - Execute Tools | MCP Client Tool                              | Executes selected MCP Airbnb tools     | Airbnb Agent                    | Airbnb Agent                   |                                                                 |
| Airbnb Agent                  | LangChain Agent                                 | Core AI logic: interprets, runs tools, formats | Prepare Text Message, Transcribe Voice Message, Simple Memory, OpenAI Chat Model, MCP Client nodes | Send Text Response, Summarize Response for Voice |                                                                 |
| Send Text Response             | Telegram                                        | Sends text message to user             | Airbnb Agent                   | -                               |                                                                 |
| Summarize Response for Voice  | LangChain Chain LLM                              | Summarizes text for voice output       | Airbnb Agent                   | Create Voice Response          |                                                                 |
| Create Voice Response          | LangChain OpenAI (Text-to-Speech)               | Converts text summary to audio         | Summarize Response for Voice   | Send Voice Response            |                                                                 |
| Send Voice Response           | Telegram                                        | Sends audio message to user            | Create Voice Response          | -                               |                                                                 |
| Sticky Note                   | Sticky Note                                     | Documentation and instructions         | -                                | -                               | See detailed welcome note with links and workflow explanation. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node:**
   - Type: Telegram Trigger
   - Configure webhook to listen for "message" updates
   - Connect Telegram Bot API credentials (bot token)
   - Position: start of workflow

2. **Add Switch Node (Text or Voice):**
   - Type: Switch
   - Add two rules:
     - "Text": Check if `message.text` is non-empty string
     - "Voice": Check if `message.voice` object exists
   - Connect input from Telegram Trigger node

3. **Voice Processing Path:**
   - Create Telegram node "Get Voice Message":
     - Type: Telegram (Get File)
     - Parameter: fileId = `{{$json.message.voice.file_id}}`
     - Connect input from Text or Voice node (Voice output)
     - Use Telegram Bot API credentials
   - Create LangChain OpenAI node "Transcribe Voice Message":
     - Type: LangChain OpenAI
     - Set resource to "audio", operation "transcribe"
     - Connect input from Get Voice Message output
     - Use OpenAI API credentials
   - Connect output of Transcribe Voice Message to Airbnb Agent node (see below)

4. **Text Processing Path:**
   - Create Set Node "Prepare Text Message for AI Agent":
     - Assign `text` = `{{$json.message.text}}`
     - Connect input from Text or Voice node (Text output)
   - Connect output to Airbnb Agent node

5. **Add LangChain Memory Node "Simple Memory":**
   - Type: Memory Buffer Window
   - Configure `sessionKey` = `{{$json.message.chat.id}}`
   - Use custom session ID type
   - Connect input from Airbnb Agent (for memory updates)
   - Connect output to Airbnb Agent (for context)

6. **Add LangChain OpenAI Chat Model Node:**
   - Type: LangChain OpenAI Chat Model
   - Select model "gpt-4.1"
   - No special options required
   - Use OpenAI API credentials
   - Connect input/output to Airbnb Agent for language model handling

7. **Add MCP Client Nodes:**
   - "Airbnb MCP Client - List Tools":
     - Type: MCP Client Tool
     - No parameters
     - Use MCP API credentials
     - Connect as tool input to Airbnb Agent
   - "Airbnb MCP Client - Execute Tools":
     - Type: MCP Client Tool
     - Configure parameters:
       - toolName: From AI output property `tool`
       - toolParameters: From AI output property `Tool_Parameters` in JSON
       - operation: executeTool
     - Use MCP API credentials
     - Connect as tool input to Airbnb Agent

8. **Create LangChain Agent Node "Airbnb Agent":**
   - Type: LangChain Agent
   - Configure system prompt as in the workflow description:
     - Define Airbnb expert role
     - Describe MCP tools usage
     - Format output for Telegram mobile
   - Connect inputs:
     - Text input from Prepare Text Message or Transcribe Voice Message
     - Memory from Simple Memory node
     - Language model from OpenAI Chat Model node
     - Tools from MCP Client nodes
   - Connect outputs:
     - To Send Text Response node
     - To Summarize Response for Voice node

9. **Add Telegram Node "Send Text Response":**
   - Type: Telegram (Send Message)
   - Text parameter: `{{$json.output}}` from Airbnb Agent output
   - Chat ID: `{{$node["Telegram Trigger"].json.message.chat.id}}`
   - Disable attribution
   - Connect input from Airbnb Agent

10. **Add LangChain Chain LLM Node "Summarize Response for Voice":**
    - Type: LangChain Chain LLM
    - Prompt: Summarize Airbnb info for voice output (remove emojis, links, concise)
    - Use GPT-4 model with low temperature (~0.3)
    - Connect input from Airbnb Agent output

11. **Add LangChain OpenAI Node "Create Voice Response":**
    - Type: LangChain OpenAI
    - Resource: audio (text-to-speech)
    - Input: Summarized text output
    - Use OpenAI credentials
    - Connect input from Summarize Response node

12. **Add Telegram Node "Send Voice Response":**
    - Type: Telegram (Send Audio)
    - Chat ID: `{{$node["Telegram Trigger"].json.message.chat.id}}`
    - Send binary audio data from Create Voice Response
    - Use Telegram credentials
    - Connect input from Create Voice Response node

13. **Connect all nodes as per the above flow:**
    - Telegram Trigger → Text or Voice switch
    - Text output → Prepare Text Message → Airbnb Agent
    - Voice output → Get Voice Message → Transcribe Voice Message → Airbnb Agent
    - Simple Memory connected to Airbnb Agent for context
    - OpenAI Chat Model connected to Airbnb Agent
    - MCP Client nodes connected to Airbnb Agent as tools
    - Airbnb Agent → Send Text Response and Summarize Response for Voice
    - Summarize Response → Create Voice Response → Send Voice Response

14. **Credentials Setup:**
    - Telegram API bot token with webhook configured
    - OpenAI API key with access to GPT-4 and Whisper, TTS
    - MCP Client API credentials configured to access Airbnb data

15. **Final Checks:**
    - Verify webhook URL for Telegram Trigger is active
    - Test voice and text messages on Telegram bot
    - Monitor for API rate limits or errors
    - Adjust prompt and memory size if needed for conversation context

---

### 5. General Notes & Resources

| Note Content                                                                                                              | Context or Link                                                                                                  |
|---------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| This workflow supports both text and voice messages on Telegram for Airbnb accommodation queries.                         | Multimodal support                                                                                               |
| MCP Community Client Node is required for Airbnb data access and must be set up with MCP server and Airtable connection. | https://github.com/nerding-io/n8n-nodes-mcp                                                                     |
| Telegram Bot API setup requires bot creation via @BotFather and webhook configuration.                                     | https://docs.n8n.io/integrations/builtin/credentials/telegram/                                                   |
| OpenAI API is used for chat completions, speech transcription (Whisper), and text-to-speech audio generation.              | https://docs.n8n.io/integrations/builtin/credentials/openai/                                                     |
| The system prompt in the Airbnb Agent defines detailed instructions for precise Airbnb data querying and Telegram formatting. | Embedded in Airbnb Agent node parameters                                                                         |
| Voice responses are automatically summarized to improve listening experience, removing emojis and links.                   | Summarize Response for Voice node prompt                                                                         |
| Workflow creator contact: LinkedIn profile for support or questions.                                                       | https://www.linkedin.com/in/friedemann-schuetz                                                                  |

---

**Disclaimer:** The provided text is exclusively derived from an automated workflow created with n8n, complying strictly with content policies and handling only legal, public data.