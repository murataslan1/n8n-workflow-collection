AI-Powered Telegram Task Manager with MCP Server

https://n8nworkflows.xyz/workflows/ai-powered-telegram-task-manager-with-mcp-server-3656


# AI-Powered Telegram Task Manager with MCP Server

### 1. Workflow Overview

This workflow, titled **AI-Powered Telegram Task Manager with MCP Server**, is designed to facilitate task management via Telegram messages integrated with Google Tasks, enhanced by AI assistance. It targets individuals, teams, and developers who want to manage tasks conversationally without switching apps.

The workflow is logically divided into the following blocks:

- **1.1 Incoming Message Reception and Preprocessing**  
  Captures Telegram messages (text or voice), distinguishes message types, and prepares input for AI processing.

- **1.2 Voice Note Handling and Transcription**  
  Detects voice messages, downloads audio files from Telegram, and transcribes them into text for further processing.

- **1.3 AI Processing and Memory Management**  
  Uses an AI agent with conversational memory and OpenAI language model to interpret user commands, generate task-related instructions, and manage dialogue context.

- **1.4 Task Management via Google Tasks API**  
  Performs task creation, retrieval, and updates on Google Tasks based on AI instructions, including handling today's tasks and upcoming tasks.

- **1.5 MCP Server Integration**  
  Uses MCP Server Trigger and MCP Client nodes to coordinate AI tools and task operations, enabling modular and scalable AI-driven task management.

- **1.6 Telegram Response Sending**  
  Sends AI-generated responses back to the user on Telegram, completing the interaction loop.

---

### 2. Block-by-Block Analysis

#### 2.1 Incoming Message Reception and Preprocessing

**Overview:**  
This block listens for incoming Telegram messages, distinguishes between voice notes and text messages, and routes them accordingly for processing.

**Nodes Involved:**  
- Incoming Message (Telegram Trigger)  
- Switch (Conditional routing)  
- chatInput (Set node for text messages)

**Node Details:**  

- **Incoming Message**  
  - Type: Telegram Trigger  
  - Role: Listens for new Telegram messages (updates of type "message") sent to the bot.  
  - Configuration: Uses Telegram API credentials; triggers on all message updates.  
  - Inputs: External webhook from Telegram.  
  - Outputs: Passes message JSON to Switch node.  
  - Edge Cases: Telegram API downtime, webhook misconfiguration, unsupported message types.

- **Switch**  
  - Type: Switch (Conditional routing)  
  - Role: Checks if the incoming message contains a voice note.  
  - Configuration: Condition checks if `message.voice` exists (strict type validation).  
  - Inputs: Incoming Message node output.  
  - Outputs: Routes to "Voice Note" output if voice exists; otherwise, routes to "extra" (text message path).  
  - Edge Cases: Messages without voice or text, malformed JSON.

- **chatInput**  
  - Type: Set  
  - Role: Extracts and sets text message content and user ID for AI processing.  
  - Configuration: Assigns `chatInput` from `message.text` and `id` from `message.from.id`.  
  - Inputs: Switch node output for text messages.  
  - Outputs: Passes structured input to AI Agent node.  
  - Edge Cases: Empty or malformed text messages.

---

#### 2.2 Voice Note Handling and Transcription

**Overview:**  
Processes voice messages by extracting file IDs, downloading audio from Telegram, and transcribing audio to text using OpenAI.

**Nodes Involved:**  
- audio_id (Set)  
- download_audio (Telegram)  
- transcribeAudio (OpenAI Audio Transcription)  
- audioInput (Set)  

**Node Details:**  

- **audio_id**  
  - Type: Set  
  - Role: Extracts `file_id` and `file_unique_id` from the voice message for download.  
  - Configuration: Sets `file_id` and `file_unique_id` from `message.voice`.  
  - Inputs: Switch node output for voice notes.  
  - Outputs: Passes file identifiers to download_audio node.  
  - Edge Cases: Missing or invalid file IDs.

- **download_audio**  
  - Type: Telegram  
  - Role: Downloads the voice audio file from Telegram servers using the file ID.  
  - Configuration: Uses Telegram API credentials; resource set to "file"; fileId parameter from previous node.  
  - Inputs: audio_id node output.  
  - Outputs: Provides audio file data for transcription.  
  - Edge Cases: Telegram file download failures, network issues.

- **transcribeAudio**  
  - Type: OpenAI (Audio Transcription)  
  - Role: Transcribes downloaded audio into text.  
  - Configuration: Uses OpenAI API credentials; resource set to "audio"; operation "transcribe".  
  - Inputs: download_audio node output.  
  - Outputs: Transcribed text.  
  - Edge Cases: Audio format unsupported, transcription errors, API limits.

- **audioInput**  
  - Type: Set  
  - Role: Sets the transcribed text as `chatInput` for AI processing.  
  - Configuration: Assigns `chatInput` from transcription result `text`.  
  - Inputs: transcribeAudio node output.  
  - Outputs: Passes text to AI Agent node.  
  - Edge Cases: Empty transcription results.

---

#### 2.3 AI Processing and Memory Management

**Overview:**  
Interprets user input (text or transcribed voice) using an AI agent with memory buffer and OpenAI language model, generating task management commands and responses.

**Nodes Involved:**  
- AI Agent (Langchain Agent)  
- Simple Memory (Memory Buffer Window)  
- OpenAI Chat Model (Language Model)  
- chatOutput (Set)

**Node Details:**  

- **AI Agent**  
  - Type: Langchain Agent  
  - Role: Core AI processing node that interprets user input, manages dialogue, and generates task instructions.  
  - Configuration: System message instructs the agent to call "get_tasks" tools before updating tasks; includes current date context.  
  - Inputs: Receives `chatInput` from text or audio processing nodes; connected to AI memory and AI tools.  
  - Outputs: Produces `chatOutput` with AI-generated response.  
  - Edge Cases: AI model errors, response timeouts, malformed input.

- **Simple Memory**  
  - Type: Memory Buffer Window  
  - Role: Maintains conversational context per user session (keyed by Telegram user ID).  
  - Configuration: Context window length set to 20 messages; session key derived from Telegram user ID.  
  - Inputs: Feeds memory context to AI Agent.  
  - Outputs: Updated memory state.  
  - Edge Cases: Memory overflow, session key errors.

- **OpenAI Chat Model**  
  - Type: Language Model (OpenAI GPT)  
  - Role: Provides language understanding and generation capabilities to AI Agent.  
  - Configuration: Uses GPT-4o-mini model; OpenAI API credentials configured.  
  - Inputs: AI Agent's language model requests.  
  - Outputs: Text completions for AI Agent.  
  - Edge Cases: API rate limits, authentication failures.

- **chatOutput**  
  - Type: Set  
  - Role: Prepares AI Agent's output text for sending back to Telegram.  
  - Configuration: Assigns `chatOutput` from AI Agent's `output` field.  
  - Inputs: AI Agent output.  
  - Outputs: Passes to Telegram sendMessage node.  
  - Edge Cases: Empty or invalid AI output.

---

#### 2.4 Task Management via Google Tasks API

**Overview:**  
Handles creation, retrieval, and updating of tasks in Google Tasks based on AI instructions, including managing today's tasks and upcoming tasks.

**Nodes Involved:**  
- create_todays_task (Google Tasks Tool)  
- create_upcoming_task (Google Tasks Tool)  
- complete_task (Google Tasks Tool)  
- get_todays_tasks (Google Tasks Tool)  
- get_upcoming_tasks (Google Tasks Tool)

**Node Details:**  

- **create_todays_task**  
  - Type: Google Tasks Tool  
  - Role: Creates a new task in the "Today's Tasks" list.  
  - Configuration: Task list ID fixed; title, notes, dueDate, and completed fields dynamically set via AI overrides.  
  - Inputs: AI tool calls from MCP Server Trigger.  
  - Outputs: Task creation confirmation.  
  - Edge Cases: Invalid task data, Google API auth errors.

- **create_upcoming_task**  
  - Type: Google Tasks Tool  
  - Role: Creates a new task in the "Upcoming Tasks" list.  
  - Configuration: Similar to create_todays_task but targets a different task list ID.  
  - Inputs: AI tool calls.  
  - Outputs: Confirmation of task creation.  
  - Edge Cases: Same as above.

- **complete_task**  
  - Type: Google Tasks Tool  
  - Role: Marks a specified task as completed.  
  - Configuration: Uses AI-provided Task_ID to update task status; operation set to "update".  
  - Inputs: AI tool calls.  
  - Outputs: Confirmation of task completion.  
  - Edge Cases: Invalid Task_ID, task not found.

- **get_todays_tasks**  
  - Type: Google Tasks Tool  
  - Role: Retrieves all tasks from the "Today's Tasks" list.  
  - Configuration: Operation "getAll", returns all tasks.  
  - Inputs: AI tool calls.  
  - Outputs: List of tasks for AI processing.  
  - Edge Cases: API errors, empty task list.

- **get_upcoming_tasks**  
  - Type: Google Tasks Tool  
  - Role: Retrieves all tasks from the "Upcoming Tasks" list.  
  - Configuration: Similar to get_todays_tasks but for upcoming tasks.  
  - Inputs: AI tool calls.  
  - Outputs: Task list.  
  - Edge Cases: Same as above.

---

#### 2.5 MCP Server Integration

**Overview:**  
Coordinates AI tools and task operations through MCP Server Trigger and MCP Client nodes, enabling modular AI-driven task management.

**Nodes Involved:**  
- MCP Server Trigger  
- MCP Client

**Node Details:**  

- **MCP Server Trigger**  
  - Type: MCP Trigger (Langchain)  
  - Role: Acts as an AI tool server endpoint to receive AI tool calls for task operations.  
  - Configuration: Webhook path set; receives AI tool requests from Google Tasks nodes and AI Agent.  
  - Inputs: AI tool calls from Google Tasks nodes and AI Agent.  
  - Outputs: Sends responses back to AI Agent or task nodes.  
  - Edge Cases: Network issues, webhook misconfiguration.

- **MCP Client**  
  - Type: MCP Client Tool (Langchain)  
  - Role: Sends AI tool requests to MCP Server Trigger SSE endpoint.  
  - Configuration: SSE endpoint URL configured to MCP Server Trigger webhook path.  
  - Inputs: AI Agent tool calls.  
  - Outputs: Responses from MCP Server.  
  - Edge Cases: SSE connection failures, timeout.

---

#### 2.6 Telegram Response Sending

**Overview:**  
Sends AI-generated responses back to the user on Telegram, completing the interaction.

**Nodes Involved:**  
- sendMessage (Telegram)  

**Node Details:**  

- **sendMessage**  
  - Type: Telegram  
  - Role: Sends text messages to the Telegram chat from which the original message was received.  
  - Configuration: Uses Telegram API credentials; text set from `chatOutput`; chatId from original message.  
  - Inputs: chatOutput node output.  
  - Outputs: Message delivery confirmation.  
  - Edge Cases: Telegram API errors, invalid chatId.

---

### 3. Summary Table

| Node Name           | Node Type                          | Functional Role                          | Input Node(s)               | Output Node(s)             | Sticky Note                                                                                         |
|---------------------|----------------------------------|----------------------------------------|-----------------------------|----------------------------|---------------------------------------------------------------------------------------------------|
| Incoming Message     | Telegram Trigger                 | Receives Telegram messages              | External webhook            | Switch                     | ## Main Function to Receive and Send Telegram Messages                                            |
| Switch              | Switch                          | Routes messages by type (voice/text)   | Incoming Message            | audio_id, chatInput        | ## Main Function to Receive and Send Telegram Messages                                            |
| audio_id            | Set                             | Extracts voice file IDs                  | Switch (Voice Note output)  | download_audio             | ## Main Function to Receive and Send Telegram Messages                                            |
| download_audio      | Telegram                        | Downloads voice audio file               | audio_id                   | transcribeAudio            | ## Main Function to Receive and Send Telegram Messages                                            |
| transcribeAudio     | OpenAI (Audio Transcription)    | Transcribes audio to text                | download_audio             | audioInput                 | ## Main Function to Receive and Send Telegram Messages                                            |
| audioInput          | Set                             | Sets transcribed text as chat input     | transcribeAudio            | AI Agent                  | ## Main Function to Receive and Send Telegram Messages                                            |
| chatInput           | Set                             | Sets text message as chat input          | Switch (Text output)        | AI Agent                  | ## Main Function to Receive and Send Telegram Messages                                            |
| AI Agent            | Langchain Agent                 | Processes input with AI, manages tasks  | chatInput, audioInput, Simple Memory, MCP Client | chatOutput                | ## Main Function to Receive and Send Telegram Messages                                            |
| Simple Memory       | Memory Buffer Window            | Maintains conversation context          | -                          | AI Agent                  | ## Main Function to Receive and Send Telegram Messages                                            |
| OpenAI Chat Model   | Language Model (OpenAI GPT)     | Provides language understanding          | AI Agent                   | AI Agent                  | ## Main Function to Receive and Send Telegram Messages                                            |
| chatOutput          | Set                             | Prepares AI response text                | AI Agent                   | sendMessage               | ## Main Function to Receive and Send Telegram Messages                                            |
| sendMessage         | Telegram                        | Sends response to Telegram user          | chatOutput                 | -                         | ## Main Function to Receive and Send Telegram Messages                                            |
| MCP Server Trigger  | MCP Trigger (Langchain)         | Receives AI tool calls for task ops      | complete_task, get_todays_tasks, get_upcoming_tasks, create_todays_task, create_upcoming_task | AI Agent                  | ## MCP Server to Carry Out Actions                                                                 |
| MCP Client          | MCP Client Tool (Langchain)     | Sends AI tool requests to MCP Server     | AI Agent                   | AI Agent                  | ## MCP Server to Carry Out Actions                                                                 |
| create_todays_task  | Google Tasks Tool               | Creates a task in Today's Tasks list     | MCP Server Trigger         | MCP Server Trigger        | ## MCP Server to Carry Out Actions                                                                 |
| create_upcoming_task| Google Tasks Tool               | Creates a task in Upcoming Tasks list    | MCP Server Trigger         | MCP Server Trigger        | ## MCP Server to Carry Out Actions                                                                 |
| complete_task       | Google Tasks Tool               | Marks a task as completed                 | MCP Server Trigger         | MCP Server Trigger        | ## MCP Server to Carry Out Actions                                                                 |
| get_todays_tasks    | Google Tasks Tool               | Retrieves all today's tasks               | MCP Server Trigger         | MCP Server Trigger        | ## MCP Server to Carry Out Actions                                                                 |
| get_upcoming_tasks  | Google Tasks Tool               | Retrieves all upcoming tasks              | MCP Server Trigger         | MCP Server Trigger        | ## MCP Server to Carry Out Actions                                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node ("Incoming Message")**  
   - Type: Telegram Trigger  
   - Parameters: Listen for updates of type "message"  
   - Credentials: Connect your Telegram bot API token  
   - Position: Left side, top area

2. **Add Switch Node ("Switch")**  
   - Type: Switch  
   - Condition: Check if `message.voice` exists (object exists condition)  
   - Outputs: Two outputs — "Voice Note" if true, "extra" if false  
   - Connect Incoming Message main output to Switch input

3. **Create Set Node ("audio_id")**  
   - Type: Set  
   - Assign `file_id` = `{{$json.message.voice.file_id}}`  
   - Assign `file_unique_id` = `{{$json.message.voice.file_unique_id}}`  
   - Connect Switch "Voice Note" output to audio_id input

4. **Add Telegram Node ("download_audio")**  
   - Type: Telegram  
   - Parameters: Resource = "file"; FileId = `{{$json.file_id}}`  
   - Credentials: Same Telegram bot credentials  
   - Connect audio_id output to download_audio input

5. **Add OpenAI Node ("transcribeAudio")**  
   - Type: OpenAI (Audio Transcription)  
   - Parameters: Resource = "audio"; Operation = "transcribe"  
   - Credentials: OpenAI API key  
   - Connect download_audio output to transcribeAudio input

6. **Add Set Node ("audioInput")**  
   - Type: Set  
   - Assign `chatInput` = `{{$json.text}}` (transcription result)  
   - Connect transcribeAudio output to audioInput input

7. **Add Set Node ("chatInput")**  
   - Type: Set  
   - Assign `chatInput` = `{{$json.message.text}}`  
   - Assign `id` = `{{$json.message.from.id}}`  
   - Connect Switch "extra" output (text messages) to chatInput input

8. **Add Langchain Agent Node ("AI Agent")**  
   - Type: Langchain Agent  
   - Parameters: System message instructing to call get_tasks tools before updating tasks; include current date context `{{$now}}`  
   - Connect both chatInput and audioInput outputs to AI Agent input  
   - Connect AI Agent ai_tool input to MCP Client node (to be created)  
   - Connect AI Agent ai_memory input to Simple Memory node (to be created)  
   - Connect AI Agent ai_languageModel input to OpenAI Chat Model node (to be created)

9. **Add Memory Buffer Window Node ("Simple Memory")**  
   - Type: Memory Buffer Window  
   - Parameters: Session key = `{{$('Incoming Message').item.json.message.from.id}}`  
   - Context window length = 20  
   - Connect output to AI Agent ai_memory input

10. **Add OpenAI Chat Model Node ("OpenAI Chat Model")**  
    - Type: Langchain LM Chat OpenAI  
    - Parameters: Model = "gpt-4o-mini"  
    - Credentials: OpenAI API key  
    - Connect output to AI Agent ai_languageModel input

11. **Add MCP Client Node ("MCP Client")**  
    - Type: MCP Client Tool  
    - Parameters: SSE Endpoint = URL of MCP Server Trigger webhook (to be created)  
    - Connect output to AI Agent ai_tool input

12. **Add MCP Server Trigger Node ("MCP Server Trigger")**  
    - Type: MCP Trigger  
    - Parameters: Webhook path set (unique)  
    - Connect outputs from Google Tasks nodes (below) to MCP Server Trigger ai_tool input  
    - Connect MCP Server Trigger output to AI Agent ai_tool output

13. **Add Google Tasks Tool Nodes:**  
    - **create_todays_task**: Create task in "Today's Tasks" list  
      - Task list ID: fixed string  
      - Title, notes, dueDate, completed: set via AI overrides  
      - Credentials: Google OAuth2  
      - Connect ai_tool input from MCP Server Trigger  
      - Output back to MCP Server Trigger  
    - **create_upcoming_task**: Same as above but for "Upcoming Tasks" list  
    - **complete_task**: Update task status to completed using AI-provided Task_ID  
    - **get_todays_tasks**: Retrieve all tasks from "Today's Tasks" list  
    - **get_upcoming_tasks**: Retrieve all tasks from "Upcoming Tasks" list

14. **Add Set Node ("chatOutput")**  
    - Type: Set  
    - Assign `chatOutput` = `{{$json.output}}` (AI Agent response)  
    - Connect AI Agent main output to chatOutput input

15. **Add Telegram Node ("sendMessage")**  
    - Type: Telegram  
    - Parameters: Text = `{{$json.chatOutput}}`; ChatId = `{{$('Incoming Message').item.json.message.chat.id}}`  
    - Credentials: Telegram bot API token  
    - Connect chatOutput output to sendMessage input

16. **Connect all nodes according to the logical flow:**  
    - Incoming Message → Switch  
    - Switch → audio_id (voice) or chatInput (text)  
    - audio_id → download_audio → transcribeAudio → audioInput → AI Agent  
    - chatInput → AI Agent  
    - AI Agent → chatOutput → sendMessage  
    - AI Agent ai_tool ↔ MCP Client ↔ MCP Server Trigger ↔ Google Tasks nodes

17. **Configure Credentials:**  
    - Telegram API with your bot token  
    - Google OAuth2 with Google Tasks API access  
    - OpenAI API key for language model and transcription  
    - MCP Server webhook URL for MCP Client SSE endpoint

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                                                                   |
|----------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| The workflow enables seamless task management via Telegram, integrating AI for conversational commands.  | Workflow purpose and use case description                                                        |
| Setup requires Telegram Bot API token, Google Tasks OAuth2 credentials, and OpenAI API key.              | Setup prerequisites                                                                              |
| AI Agent system message includes instructions to retrieve tasks before updating, ensuring data consistency. | AI Agent configuration detail                                                                   |
| MCP Server Trigger and MCP Client nodes enable modular AI tool integration and scalability.              | MCP Server integration explanation                                                              |
| Sticky notes in the workflow provide high-level block descriptions: "Main Function to Receive and Send Telegram Messages" and "MCP Server to Carry Out Actions". | Visual workflow annotations                                                                      |
| For further customization, users can replace Google Tasks nodes with other task management APIs or modify AI prompts to extend functionality. | Customization suggestions                                                                        |

---

This document provides a comprehensive and structured reference for understanding, reproducing, and modifying the AI-Powered Telegram Task Manager workflow. It covers all nodes, their roles, configurations, and interconnections, ensuring clarity for advanced users and automation agents alike.