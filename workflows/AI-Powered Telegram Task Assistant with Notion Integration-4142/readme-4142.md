AI-Powered Telegram Task Assistant with Notion Integration

https://n8nworkflows.xyz/workflows/ai-powered-telegram-task-assistant-with-notion-integration-4142


# AI-Powered Telegram Task Assistant with Notion Integration

---

### 1. Workflow Overview

This workflow is an AI-powered Telegram assistant designed to manage tasks integrated with Notion. It enables users to interact with their Notion task database via Telegram messages, supporting both voice and text inputs. The workflow leverages OpenAI language models and LangChain agents to interpret user commands and perform task management operations, such as listing tasks, adding new tasks, completing/uncompleting tasks, and setting task deadlines.

The workflow’s logic is organized into the following primary blocks:

- **1.1 Telegram Input Handling:** Receives user inputs from Telegram, distinguishing between voice and text messages, and processes voice messages by transcription.
- **1.2 AI Processing:** Uses LangChain AI agents with OpenAI models and memory buffers to interpret the user’s text commands and invoke appropriate task management tools.
- **1.3 Notion Task Management:** Contains the logic for interacting with the Notion API to perform task operations like listing, adding, updating completion status, and setting task times.
- **1.4 Response Construction and Delivery:** Formats task data into user-friendly messages and sends responses back to the Telegram chat.
- **1.5 Workflow Control and Setup:** Supports manual triggering and inter-workflow execution for testing and debugging, and sets up configuration variables such as the Notion database ID.

---

### 2. Block-by-Block Analysis

#### 1.1 Telegram Input Handling

**Overview:**  
This block listens for incoming Telegram messages, distinguishes between voice and text messages, downloads voice files if needed, and obtains transcription for voice inputs.

**Nodes Involved:**  
- Telegram Trigger  
- Voice or Text Message (Switch)  
- Download Voice File  
- Transcribe (OpenAI audio transcription)  
- Transribation (Telegram message sender for transcription feedback)  
- Set text  
- Set text1

**Node Details:**  

- **Telegram Trigger**  
  - Type: Telegram Trigger  
  - Role: Listens for incoming Telegram updates of type "message." Credentials linked to the Telegram bot.  
  - Input: External Telegram webhook  
  - Output: Raw Telegram message JSON  
  - Edge cases: Telegram API errors, webhook misconfiguration, unsupported message types.

- **Voice or Text Message**  
  - Type: Switch  
  - Role: Branches processing based on message content — distinguishes voice messages from text messages by checking for presence of `message.voice` or `message.text`.  
  - Input: Telegram Trigger output  
  - Output: Two branches: "audio" (voice messages) and "text" (text messages)  
  - Edge cases: Messages without voice or text fields; unexpected message formats.

- **Download Voice File**  
  - Type: Telegram node (file download)  
  - Role: Downloads the voice file from Telegram using the `file_id` provided in the voice message.  
  - Input: "audio" branch from Voice or Text Message  
  - Output: Binary audio file data  
  - Edge cases: File not found, network failures, Telegram API rate limits.

- **Transcribe**  
  - Type: OpenAI (audio transcription)  
  - Role: Sends the downloaded voice audio to OpenAI’s transcription API to get text transcript.  
  - Input: Download Voice File’s binary audio  
  - Output: Transcription text in JSON  
  - Credentials: OpenAI API  
  - Edge cases: Audio format issues, API timeouts, transcription errors.

- **Transribation**  
  - Type: Telegram message sender  
  - Role: Sends back the transcription text to the user in the Telegram chat for confirmation.  
  - Input: Transcribe node output text  
  - Output: Confirmation message sent to Telegram chat  
  - Edge cases: Telegram message failures, text encoding problems.

- **Set text1**  
  - Type: Set node  
  - Role: Extracts the transcription text from the previous step into a simplified JSON property `text` for downstream use.  
  - Input: Transribation output  
  - Output: JSON with `text` field containing transcription  
  - Edge cases: Missing or empty transcription text.

- **Set text**  
  - Type: Set node  
  - Role: For text messages, extracts the text directly from Telegram message JSON into a `text` property.  
  - Input: "text" branch from Voice or Text Message  
  - Output: JSON with `text` property  
  - Edge cases: Empty or invalid text messages.

---

#### 1.2 AI Processing

**Overview:**  
This block processes the extracted text input using LangChain AI agents combining OpenAI chat models and a memory buffer to maintain conversational context. It uses an AI tool workflow to handle task management commands.

**Nodes Involved:**  
- Simple Memory  
- OpenAI Chat Model  
- AI Agent  
- Notion Tasks Manager Tool  
- Response user

**Node Details:**  

- **Simple Memory**  
  - Type: LangChain memoryBufferWindow  
  - Role: Maintains a sliding window of the last 10 messages per Telegram chat session to provide conversational context. Uses chat ID as session key.  
  - Input: Context from Telegram Trigger chat ID  
  - Output: Session context for AI Agent  
  - Edge cases: Memory overflow, session key errors.

- **OpenAI Chat Model**  
  - Type: LangChain OpenAI chat model node  
  - Role: Provides the AI language model (GPT-4.1-mini) to process natural language inputs.  
  - Credentials: OpenAI API  
  - Input: Text from Set text or Set text1 nodes  
  - Output: AI-generated responses or command interpretations  
  - Edge cases: API rate limits, model unavailability, input size limits.

- **AI Agent**  
  - Type: LangChain agent node  
  - Role: Coordinates prompt processing using the chat model, context memory, and external tools. Parses user commands and decides on actions.  
  - Input: Text from Set text or Set text1, memory context, AI language model, and AI tool workflow  
  - Output: Decision and response text  
  - Edge cases: Prompt parsing errors, tool invocation failures.

- **Notion Tasks Manager Tool**  
  - Type: LangChain toolWorkflow node  
  - Role: Implements the interface to Notion task management operations as an AI tool. Receives method and parameters from AI Agent and performs corresponding actions on Notion.  
  - Input: Parameters `method`, `task_name`, `when`, `task_id`  
  - Output: List of task resource objects or confirmation messages  
  - Edge cases: Notion API failures, invalid parameters, missing database ID.

- **Response user**  
  - Type: Telegram message sender  
  - Role: Sends the AI Agent’s output text back to the originating Telegram chat.  
  - Input: AI Agent output text  
  - Output: Telegram message to user  
  - Edge cases: Telegram API errors, message formatting issues.

---

#### 1.3 Notion Task Management

**Overview:**  
This block handles all interactions with the Notion API for task management, including task listing, creation, updating completion status, and setting task deadlines.

**Nodes Involved:**  
- SETUP (Set node)  
- Choose Method (Switch)  
- Get Tasks  
- Add Task  
- Complete Task  
- Set Task Time  
- Response (Code node)

**Node Details:**  

- **SETUP**  
  - Type: Set node  
  - Role: Sets the Notion database ID (`NOTION_DATABASE_ID`) used by downstream Notion nodes.  
  - Input: Workflow inputs or triggers  
  - Output: JSON with `NOTION_DATABASE_ID` property  
  - Edge cases: Incorrect or missing database ID can cause API errors.

- **Choose Method**  
  - Type: Switch  
  - Role: Routes workflow based on the `method` parameter to the correct Notion operation branch. Supports: `list_tasks`, `add_task`, `complete_task`, `uncomplete_task`, `set_task_time`.  
  - Input: SETUP output (with method parameter)  
  - Output: One of five branches for respective operations  
  - Edge cases: Unexpected or unsupported method values.

- **Get Tasks**  
  - Type: Notion node (databasePage, getAll)  
  - Role: Retrieves all pages (tasks) from the Notion database.  
  - Input: SETUP output (database ID)  
  - Output: List of tasks in Notion page format  
  - Credentials: Notion API  
  - Edge cases: API rate limits, empty database, permission errors.

- **Add Task**  
  - Type: Notion node (databasePage, create)  
  - Role: Adds a new task page in Notion with specified title and "When" property. Checkbox defaults unchecked.  
  - Input: Task name and when parameters  
  - Credentials: Notion API  
  - Edge cases: Missing task name, invalid property values.

- **Complete Task**  
  - Type: Notion node (databasePage, update)  
  - Role: Updates the completion checkbox of a specified task page based on `method` value (`complete_task` or `uncomplete_task`).  
  - Input: Task ID and method  
  - Credentials: Notion API  
  - Edge cases: Invalid task ID, update conflicts.

- **Set Task Time**  
  - Type: Notion node (databasePage, update)  
  - Role: Updates the "When" select property of a task page to change its scheduled time.  
  - Input: Task ID and new "when" value  
  - Credentials: Notion API  
  - Edge cases: Invalid select option, missing task ID.

- **Response**  
  - Type: Code node  
  - Role: Formats the Notion task data into a structured object including id, URI, formatted name with emoji indicators for completion and deadline, and description. Used to prepare user-friendly task lists.  
  - Input: Output from Notion nodes (tasks or updated task)  
  - Output: Structured task representation  
  - Edge cases: Missing or malformed task properties.

---

#### 1.4 Response Construction and Delivery

**Overview:**  
This block constructs user-readable responses based on AI and Notion outputs and sends them back to Telegram.

**Nodes Involved:**  
- Response (Code node from Notion Task Management)  
- Response user (Telegram message sender)

**Node Details:**  

- **Response**  
  - See above in Notion Task Management.

- **Response user**  
  - See above in AI Processing.

---

#### 1.5 Workflow Control and Setup

**Overview:**  
Facilitates manual testing and external workflow invocation, and holds configuration parameters.

**Nodes Involved:**  
- When clicking ‘Test workflow’ (Manual Trigger)  
- Input for debuging (Set node)  
- When Executed by Another Workflow (Execute Workflow Trigger)  
- SETUP (already described)  
- Sticky Note

**Node Details:**  

- **When clicking ‘Test workflow’**  
  - Type: Manual Trigger  
  - Role: Allows manual start of the workflow for testing purposes.  
  - Output: Triggers downstream nodes for debugging.

- **Input for debuging**  
  - Type: Set node  
  - Role: Provides static JSON inputs simulating task management commands for testing.  
  - Output: JSON with example parameters (`method`, `task_name`, `when`, `task_id`).

- **When Executed by Another Workflow**  
  - Type: Execute Workflow Trigger  
  - Role: Allows this workflow to be triggered by another workflow with inputs passed as parameters for task management.  
  - Input: External workflow calls with parameters  
  - Output: Triggers downstream SETUP node.

- **Sticky Note**  
  - Type: Sticky Note  
  - Content: Provides setup instructions and links for configuring the Notion database ID, including guide and Notion template URL.  
  - Context: Visible as a comment to assist users in setup.

---

### 3. Summary Table

| Node Name                    | Node Type                             | Functional Role                                 | Input Node(s)                  | Output Node(s)                | Sticky Note                                                                                                   |
|------------------------------|-------------------------------------|------------------------------------------------|-------------------------------|------------------------------|--------------------------------------------------------------------------------------------------------------|
| Telegram Trigger              | Telegram Trigger                    | Receives Telegram messages                      | -                             | Voice or Text Message          |                                                                                                              |
| Voice or Text Message         | Switch                             | Distinguishes voice or text message             | Telegram Trigger              | Download Voice File, Set text  |                                                                                                              |
| Download Voice File           | Telegram (file)                    | Downloads voice audio file from Telegram        | Voice or Text Message (audio) | Transcribe                   |                                                                                                              |
| Transcribe                   | OpenAI (audio transcription)       | Transcribes audio to text                        | Download Voice File           | Transribation                |                                                                                                              |
| Transribation                | Telegram message sender             | Sends transcription text back to user           | Transcribe                   | Set text1                    |                                                                                                              |
| Set text1                   | Set                                | Extracts transcription text as 'text' property  | Transribation                | AI Agent                    |                                                                                                              |
| Set text                     | Set                                | Extracts text from Telegram message              | Voice or Text Message (text)  | AI Agent                    |                                                                                                              |
| Simple Memory                | LangChain Memory Buffer             | Maintains conversation context                   | Telegram Trigger (chat id)    | AI Agent                    |                                                                                                              |
| OpenAI Chat Model            | LangChain OpenAI Chat Model         | Processes natural language with GPT-4.1-mini    | Set text, Set text1           | AI Agent                    |                                                                                                              |
| AI Agent                    | LangChain Agent                    | Parses commands, orchestrates AI tools           | Set text, Set text1, Simple Memory, OpenAI Chat Model, Notion Tasks Manager Tool | Response user              |                                                                                                              |
| Notion Tasks Manager Tool    | LangChain Tool Workflow             | Executes Notion task operations via AI tool     | AI Agent                    | AI Agent                    |                                                                                                              |
| Response user               | Telegram message sender             | Sends AI response back to Telegram chat          | AI Agent                    | -                            |                                                                                                              |
| SETUP                       | Set                                | Sets Notion database ID                          | Input for debuging, When Executed by Another Workflow | Choose Method             |                                                                                                              |
| Choose Method               | Switch                             | Routes task operations based on 'method'        | SETUP                       | Get Tasks, Add Task, Complete Task, Set Task Time |                                                                                                              |
| Get Tasks                   | Notion (getAll databasePage)       | Retrieves all tasks from Notion                   | Choose Method               | Response                   |                                                                                                              |
| Add Task                    | Notion (create databasePage)       | Adds a new task in Notion                         | Choose Method               | Response                   |                                                                                                              |
| Complete Task               | Notion (update databasePage)       | Updates task completion status                    | Choose Method               | Response                   |                                                                                                              |
| Set Task Time               | Notion (update databasePage)       | Updates the scheduled time for a task             | Choose Method               | Response                   |                                                                                                              |
| Response                    | Code                              | Formats Notion task data for user-friendly output| Get Tasks, Add Task, Complete Task, Set Task Time | Response user              |                                                                                                              |
| When clicking ‘Test workflow’| Manual Trigger                    | Allows manual execution for testing               | -                           | Input for debuging          |                                                                                                              |
| Input for debuging          | Set                                | Provides static sample input for testing          | When clicking ‘Test workflow’ | SETUP                      |                                                                                                              |
| When Executed by Another Workflow | Execute Workflow Trigger          | Allows invocation from other workflows with parameters | -                           | SETUP                      |                                                                                                              |
| Sticky Note                 | Sticky Note                       | Setup instructions and helpful links              | -                           | -                          | **Setup DATABASE_ID from your Notion** [Guide](https://docs.n8n.io/workflows/sticky-notes/) [Notion template](https://www.notion.so/1f30e2a31ff0808c9c64ea31b24e1bba?v=1f30e2a31ff08100bf66000c3800bdbb) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger node**  
   - Type: Telegram Trigger  
   - Parameters: Listen for "message" updates only  
   - Credentials: Link to your Telegram bot API credentials  
   - Position: Start of workflow  

2. **Add Switch node "Voice or Text Message"**  
   - Type: Switch  
   - Rule 1 (audio): Check if `$json.message.voice` exists  
   - Rule 2 (text): Check if `$json.message.text` exists  
   - Connect Telegram Trigger output to this node  

3. **Add Telegram node "Download Voice File"**  
   - Type: Telegram  
   - Parameters: `fileId` = `{{$json.message.voice.file_id}}`  
   - Credentials: Same Telegram bot API  
   - Connect "audio" output of Switch to this node  

4. **Add OpenAI node "Transcribe"**  
   - Type: OpenAI (Audio transcription)  
   - Parameters: Resource = "audio", Operation = "transcribe"  
   - Credentials: OpenAI API credentials  
   - Connect Download Voice File output to this node  

5. **Add Telegram node "Transribation"**  
   - Type: Telegram  
   - Parameters: Text = `=#Transribation:\n\n{{ $json.text }}`, Chat ID = `{{$json.message.chat.id}}`  
   - Credentials: Telegram API  
   - Connect Transcribe output to this node  

6. **Add Set node "Set text1"**  
   - Type: Set  
   - Assign variable: `text` = `{{$json.text}}` from Transribation output  
   - Connect Transribation output to this node  

7. **Add Set node "Set text"**  
   - Type: Set  
   - Assign variable: `text` = `{{$json.message.text}}`  
   - Connect "text" output of Switch to this node  

8. **Add LangChain Memory node "Simple Memory"**  
   - Type: memoryBufferWindow  
   - Session key: `{{$json.message.chat.id}}`  
   - Context window length: 10  
   - Connect Telegram Trigger output to this node  

9. **Add LangChain OpenAI Chat Model "OpenAI Chat Model"**  
   - Model: GPT-4.1-mini (or suitable GPT-4 variant)  
   - Credentials: OpenAI API  
   - Connect Set text and Set text1 outputs to this node  

10. **Add LangChain Agent "AI Agent"**  
    - Parameters: `text` = `{{$json.text}}`  
    - Setup agent to use OpenAI Chat Model, Simple Memory, and Tool Workflow  
    - Connect Set text, Set text1, Simple Memory, OpenAI Chat Model, and Notion Tasks Manager Tool to agent inputs accordingly  

11. **Create Sub-Workflow "Notion Tasks Manager Tool"**  
    - Input parameters: `method` (string), `task_name` (string), `when` (string), `task_id` (string)  
    - Inside sub-workflow:  
      - Add Set node "SETUP" to assign Notion database ID from input or environment  
      - Add Switch "Choose Method" to route based on `method` parameter with cases: `list_tasks`, `add_task`, `complete_task`, `uncomplete_task`, `set_task_time`  
      - Add Notion nodes for each operation:  
        - Get Tasks (getAll pages)  
        - Add Task (create page) with properties title and When select, Checkbox unchecked by default  
        - Complete Task (update page checkbox to true or false)  
        - Set Task Time (update page When select)  
      - Add Code node "Response" to format Notion task data into structured output with status and emoji indicators  
      - Connect outputs of Notion nodes to Response node, then Response node to sub-workflow output  
    - Connect sub-workflow as a LangChain tool workflow node in main workflow  

12. **Add Telegram node "Response user"**  
    - Type: Telegram  
    - Text: `{{$json.output}}` from AI Agent response  
    - Chat ID: `{{$json.message.chat.id}}`  
    - Credentials: Telegram API  
    - Connect AI Agent output to this node  

13. **Add Manual Trigger "When clicking ‘Test workflow’"**  
    - For manual testing purposes  
    - Connect to a Set node "Input for debuging" with example JSON input (e.g., method=complete_task, task_name, when, task_id)  

14. **Add Execute Workflow Trigger "When Executed by Another Workflow"**  
    - Configure to accept inputs: method, task_name, when, task_id  
    - Connect output to SETUP node  

15. **Add Sticky Note**  
    - Include setup instructions for Notion database ID and links to the official guide and Notion template  

**Credential Setup:**  
- Telegram API credentials for bot interaction  
- OpenAI API credentials for chat and transcription models  
- Notion API credentials for database access and task management  

---

### 5. General Notes & Resources

| Note Content                                                                                                           | Context or Link                                                                                      |
|------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Setup DATABASE_ID from your Notion                                                                                     | See sticky note in workflow; essential for Notion integration                                      |
| Guide to Sticky Notes in n8n                                                                                           | https://docs.n8n.io/workflows/sticky-notes/                                                        |
| Notion template for task database                                                                                      | https://www.notion.so/1f30e2a31ff0808c9c64ea31b24e1bba?v=1f30e2a31ff08100bf66000c3800bdbb           |

---

**Disclaimer:** The provided text is extracted exclusively from an automated workflow created using n8n, a tool for integration and automation. This processing strictly respects applicable content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.

---