AI-Powered Personal Assistant for Telegram with Memory & Task Management

https://n8nworkflows.xyz/workflows/ai-powered-personal-assistant-for-telegram-with-memory---task-management-8837


# AI-Powered Personal Assistant for Telegram with Memory & Task Management

### 1. Workflow Overview

This workflow, titled **"AI-Powered Personal Assistant for Telegram with Memory & Task Management"**, implements a conversational AI assistant accessible via Telegram. Its purpose is to interact naturally with users, understand and remember personal preferences, manage grocery and to-do lists, and handle Google Calendar events—all powered by OpenAI GPT models and integrated with Airtable and Google Calendar.

The workflow logic is organized into the following functional blocks:

- **1.1 Input Reception & Preprocessing**: Captures incoming Telegram messages (text or voice), distinguishes message types, and transcribes voice messages.
- **1.2 Memory Retrieval & Aggregation**: Searches and aggregates user memories from Airtable to provide context-aware responses.
- **1.3 AI Processing & Response Generation**: Uses OpenAI GPT-4 based conversational AI with memory buffering to generate replies and interpret user intent for downstream tasks.
- **1.4 Memory Management**: Saves relevant new user and feedback memories back into Airtable, avoiding duplication.
- **1.5 Grocery List Management**: Searches, adds, or removes grocery items in Airtable based on user commands.
- **1.6 To-Do List Management**: Searches, adds, or deletes to-do tasks in Airtable, organized by projects or classes.
- **1.7 Calendar Event Management**: Retrieves, creates, updates, deletes, and manages recurring Google Calendar events.
- **1.8 External Tools Integration**: Includes web search via SerpAPI and audio transcription via OpenAI.
- **1.9 Response Delivery**: Sends the AI-generated response back to the Telegram user.

Sticky notes scattered in the workflow provide detailed guidelines on grocery and to-do list usage, memory handling, calendar instructions, and setup directions.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Preprocessing

- **Overview:**  
  This block listens for Telegram messages (voice or text), routes voice messages for transcription, and forwards text messages directly for processing.

- **Nodes Involved:**  
  - Telegram Trigger  
  - Switch  
  - Telegram (for voice file download)  
  - OpenAI (transcription)  
  - Sticky Note (Voice)

- **Node Details:**

  - **Telegram Trigger**  
    - *Type*: Telegram Trigger node  
    - *Role*: Entry point; listens for new Telegram messages (updates: message).  
    - *Config*: Uses Telegram API credentials.  
    - *Input/Output*: No input; outputs new message JSON.  
    - *Failures*: Telegram API connection errors, webhook issues.  
    - *Notes*: The webhook ID is unique per instance.

  - **Switch**  
    - *Type*: Switch node  
    - *Role*: Determines if incoming message is voice or text.  
    - *Config*: Two outputs: "Voice" if message.voice exists; "Text" if message.text exists.  
    - *Input*: Telegram Trigger output.  
    - *Output*: Routes to voice processing or direct text processing.  
    - *Failures*: Expression errors if message fields are missing.

  - **Telegram (voice file download)**  
    - *Type*: Telegram node (file resource)  
    - *Role*: Downloads voice message file for transcription.  
    - *Config*: Uses file_id from message.voice.file_id.  
    - *Credentials*: Telegram API.  
    - *Input*: From Switch (Voice output).  
    - *Output*: File buffer for transcription.  
    - *Failures*: File download failures, API errors.

  - **OpenAI (transcribe)**  
    - *Type*: OpenAI node (audio transcribe operation)  
    - *Role*: Transcribes downloaded voice message to text.  
    - *Config*: Operation set to "transcribe" under audio resource.  
    - *Credentials*: OpenAI API.  
    - *Input*: Telegram voice file output.  
    - *Output*: Transcribed text.  
    - *Failures*: Transcription timeout, API limits.

  - **Sticky Note (Voice)**  
    - *Type*: Sticky Note  
    - *Role*: Visual annotation for voice processing.  
    - *Content*: "# Voice"

---

#### 1.2 Memory Retrieval & Aggregation

- **Overview:**  
  Retrieves stored user memories from Airtable, sorts and aggregates them to provide context for AI response generation.

- **Nodes Involved:**  
  - Get Memories (Airtable)  
  - Aggregate  
  - Sticky Note (Memory)  
  - Sticky Note (Memory) duplicate

- **Node Details:**

  - **Get Memories**  
    - *Type*: Airtable node (search)  
    - *Role*: Searches memory base and table for user memories.  
    - *Config*: Uses dynamic Airtable base and table IDs from settings. Sorts results by "Time" field ascending.  
    - *Credentials*: Airtable API token.  
    - *Input*: From Telegram Trigger.  
    - *Output*: List of memory records.  
    - *Failures*: Airtable API errors, invalid base/table.

  - **Aggregate**  
    - *Type*: Aggregate node  
    - *Role*: Combines and filters memory data, excludes fields id, createdTime, Created.  
    - *Input*: Get Memories output.  
    - *Output*: Aggregated memory dataset.  
    - *Failures*: Data inconsistencies, empty input.

  - **Sticky Note (Memory)**  
    - *Type*: Sticky Note  
    - *Role*: Visual grouping for memory retrieval.  
    - *Content*: "## Memory"

---

#### 1.3 AI Processing & Response Generation

- **Overview:**  
  Uses OpenAI GPT-4 mini model with Langchain integration to generate concise, friendly, and context-aware responses. Utilizes a session-based window buffer memory for context retention.

- **Nodes Involved:**  
  - Window Buffer Memory  
  - OpenAI Chat Model1 (GPT-4.1-mini)  
  - Zeus Tele (Langchain Agent)  
  - Merge1

- **Node Details:**

  - **Window Buffer Memory1**  
    - *Type*: Langchain memory buffer window  
    - *Role*: Maintains last 10 interactions in session "telekey".  
    - *Config*: Custom session key, window length 10.  
    - *Input*: From Merge1 (combined inputs).  
    - *Output*: Contextual memory for AI model.  
    - *Failures*: Session key conflicts, memory state loss.

  - **OpenAI Chat Model1**  
    - *Type*: Langchain OpenAI Chat Model  
    - *Role*: GPT-4.1-mini model generating text responses.  
    - *Config*: Model set to "gpt-4.1-mini".  
    - *Credentials*: OpenAI API.  
    - *Input*: Memory buffer output merged with other inputs.  
    - *Output*: AI-generated structured response.  
    - *Failures*: API limits, model errors.

  - **Zeus Tele**  
    - *Type*: Langchain agent node  
    - *Role*: Central AI agent interpreting user text, applying rules for memory saving, task management, calendar, grocery, to-do, and news functionalities.  
    - *Config*:  
      - Uses a detailed system prompt defining role, rules for memory handling, grocery, to-do, calendar, news, and response style.  
      - Processes text input from Telegram or transcribed voice.  
    - *Input*: From Merge1 node combining memory, user message, and AI model output.  
    - *Output*: Commands to downstream nodes and final text output.  
    - *Failures*: Expression evaluation errors, AI logic faults, API latency.

  - **Merge1**  
    - *Type*: Merge node (combine mode)  
    - *Role*: Combines multiple input streams into one for processing by AI agent.  
    - *Input*: From Switch (text messages), OpenAI (transcription), Get Memories (aggregated memories).  
    - *Output*: Unified data to AI agent.  
    - *Failures*: Timing issues, data format mismatches.

---

#### 1.4 Memory Management

- **Overview:**  
  Saves relevant user information and feedback to Airtable memories, avoiding duplicates and ensuring privacy.

- **Nodes Involved:**  
  - User Tele Memory (Airtable)  
  - Zeus Text Memory (Airtable)  
  - Sticky Note (Memory)

- **Node Details:**

  - **User Tele Memory**  
    - *Type*: Airtable create record  
    - *Role*: Stores user-specific memories (preferences, habits, requests).  
    - *Config*: Inserts "User" field from Telegram username or fallback "user", "Memory" field from AI output.  
    - *Credentials*: Airtable API token.  
    - *Input*: From Zeus Tele AI agent (ai_tool output).  
    - *Failures*: Airtable errors, permission issues.

  - **Zeus Text Memory**  
    - *Type*: Airtable create record  
    - *Role*: Stores user feedback on text style and tone preferences.  
    - *Config*: Same user identification, stores feedback in "Memory" field.  
    - *Credentials*: Airtable API token.  
    - *Input*: From Zeus Tele node.  
    - *Failures*: Same as above.

  - **Sticky Note (Memory)**  
    - *Type*: Sticky Note  
    - *Role*: Visual annotation for memory saving nodes.

---

#### 1.5 Grocery List Management

- **Overview:**  
  Implements search, add, and delete operations on the grocery list stored in Airtable, coordinated by the AI agent based on user commands.

- **Nodes Involved:**  
  - Grocery Search  
  - Grocery Create  
  - Grocery Delete  
  - Sticky Note (Grocery)

- **Node Details:**

  - **Grocery Search**  
    - *Type*: Airtable search  
    - *Role*: Checks if grocery item exists or retrieves full list.  
    - *Config*: Uses Airtable base and grocery table from settings.  
    - *Input*: From Zeus Tele (ai_tool).  
    - *Output*: Matching grocery records.  
    - *Failures*: Airtable access errors.

  - **Grocery Create**  
    - *Type*: Airtable create record  
    - *Role*: Adds new grocery item if not already present.  
    - *Config*: Fields "Item" and "User" set from AI output and Telegram username.  
    - *Input*: Zeus Tele output (ai_tool).  
    - *Failures*: Duplicate entries, Airtable write errors.

  - **Grocery Delete**  
    - *Type*: Airtable delete record  
    - *Role*: Removes grocery items by record ID.  
    - *Config*: Record ID provided by AI output.  
    - *Input*: Zeus Tele output.  
    - *Failures*: Missing record ID, deletion errors.

  - **Sticky Note (Grocery)**  
    - *Type*: Sticky Note  
    - *Role*: Annotates grocery list management nodes.

---

#### 1.6 To-Do List Management

- **Overview:**  
  Performs search, creation, and deletion of to-do tasks in Airtable, grouped by projects or classes, as directed by the AI agent.

- **Nodes Involved:**  
  - To-Do Search  
  - To-Do Create  
  - To-Do Delete  
  - Sticky Note (To-Do List)

- **Node Details:**

  - **To-Do Search**  
    - *Type*: Airtable search  
    - *Role*: Checks if a to-do task or list exists.  
    - *Config*: Uses Airtable base and to-do table from settings.  
    - *Input*: Zeus Tele output.  
    - *Failures*: Airtable search errors.

  - **To-Do Create**  
    - *Type*: Airtable create record  
    - *Role*: Adds new to-do tasks.  
    - *Config*: Fields "Task", "User", and "Project or Class" from AI output and Telegram username.  
    - *Input*: Zeus Tele output.  
    - *Failures*: Duplicate or invalid data.

  - **To-Do Delete**  
    - *Type*: Airtable delete record  
    - *Role*: Removes to-do tasks by record ID.  
    - *Input*: Zeus Tele output.  
    - *Failures*: Missing record IDs.

  - **Sticky Note (To-Do List)**  
    - *Type*: Sticky Note  
    - *Role*: Visual annotation.

---

#### 1.7 Calendar Event Management

- **Overview:**  
  Manages Google Calendar events including retrieval, creation (single and recurring), update, and deletion, based on user instructions parsed by AI.

- **Nodes Involved:**  
  - Get Events  
  - Create Events  
  - Create Recurring Events  
  - Update Events  
  - Delete Events  
  - Sticky Note (Calendar)

- **Node Details:**

  - **Get Events**  
    - *Type*: Google Calendar tool (getAll)  
    - *Role*: Retrieves events within a specified time range.  
    - *Config*: Calendar ID dynamically set from settings or default "primary".  
    - *Input*: Zeus Tele output (ai_tool).  
    - *Failures*: OAuth token expiration, API rate limits.

  - **Create Events**  
    - *Type*: Google Calendar tool (create)  
    - *Role*: Creates single non-recurring calendar events.  
    - *Config*: Event properties (start, end, summary, location, description, color) from AI output.  
    - *Input*: Zeus Tele output.  
    - *Failures*: Conflicts, invalid date/time formats.

  - **Create Recurring Events**  
    - *Type*: Google Calendar tool (create recurring)  
    - *Role*: Creates recurring events without conflict checking.  
    - *Config*: Same event properties plus repeatUntil date.  
    - *Input*: Zeus Tele output.  
    - *Failures*: Recurrence rule errors.

  - **Update Events**  
    - *Type*: Google Calendar tool (update)  
    - *Role*: Updates event details using event ID.  
    - *Config*: Fields are merged with existing event data; color is numeric string.  
    - *Input*: Zeus Tele output.  
    - *Failures*: Missing event ID, permission issues.

  - **Delete Events**  
    - *Type*: Google Calendar tool (delete)  
    - *Role*: Deletes event by event ID.  
    - *Input*: Zeus Tele output.  
    - *Failures*: Missing event ID, API errors.

  - **Sticky Note (Calendar)**  
    - *Type*: Sticky Note  
    - *Role*: Grouping annotation.

---

#### 1.8 External Tools Integration

- **Overview:**  
  Integrates with SerpAPI for web search results to enhance AI responses.

- **Nodes Involved:**  
  - SerpAPI  
  - Sticky Note (Internet)

- **Node Details:**

  - **SerpAPI**  
    - *Type*: Langchain tool node for SerpAPI  
    - *Role*: Runs web searches to provide up-to-date information.  
    - *Credentials*: SerpAPI key.  
    - *Input*: Zeus Tele AI tool calls.  
    - *Output*: Search results to AI agent.  
    - *Failures*: API quota, network errors.

  - **Sticky Note (Internet)**  
    - *Type*: Sticky Note  
    - *Role*: Annotation for external web search integration.

---

#### 1.9 Response Delivery

- **Overview:**  
  Sends AI-generated text responses back to the user on Telegram.

- **Nodes Involved:**  
  - Telegram Response

- **Node Details:**

  - **Telegram Response**  
    - *Type*: Telegram node  
    - *Role*: Sends text message back to Telegram chat.  
    - *Config*: Text set to AI output field "output"; chat ID dynamically from Telegram Trigger message.  
    - *Credentials*: Telegram API.  
    - *Input*: Zeus Tele main output.  
    - *Failures*: Telegram API send message errors.

---

### 3. Summary Table

| Node Name            | Node Type                          | Functional Role                          | Input Node(s)             | Output Node(s)          | Sticky Note                                            |
|----------------------|----------------------------------|----------------------------------------|---------------------------|-------------------------|--------------------------------------------------------|
| Telegram Trigger      | Telegram Trigger                  | Entry point: listens for Telegram msgs | None                      | Get Memories, Switch     |                                                        |
| Switch               | Switch                           | Routes message type (voice/text)       | Telegram Trigger           | Telegram (voice), Merge1 |                                                        |
| Telegram             | Telegram node (file download)    | Downloads voice messages                | Switch (Voice)             | OpenAI (transcribe)      |                                                        |
| OpenAI               | OpenAI (audio transcribe)        | Transcribes voice to text               | Telegram                   | Merge1                  |                                                        |
| Get Memories         | Airtable search                  | Retrieves stored user memories          | Telegram Trigger           | Aggregate               |                                                        |
| Aggregate            | Aggregate                       | Aggregates memory records               | Get Memories               | Merge1                  |                                                        |
| Merge1               | Merge                           | Combines inputs for AI processing       | Switch (Text), OpenAI, Aggregate | Zeus Tele           |                                                        |
| Window Buffer Memory1 | Langchain memory buffer window  | Maintains conversational context       | Merge1                     | OpenAI Chat Model1       |                                                        |
| OpenAI Chat Model1    | Langchain Chat Model (GPT-4.1)  | Generates AI text responses             | Window Buffer Memory1      | Zeus Tele               |                                                        |
| Zeus Tele            | Langchain Agent                 | Main AI agent for conversation & tasks | Merge1, OpenAI Chat Model1 | Telegram Response, Airtable Tools, Google Calendar Tools | Detailed system prompt with rules and instructions     |
| User Tele Memory     | Airtable create record          | Saves user personal memories            | Zeus Tele                  | None                    | Memory management                                       |
| Zeus Text Memory     | Airtable create record          | Saves user feedback on text style       | Zeus Tele                  | None                    | Memory management                                       |
| Grocery Search       | Airtable search                | Searches grocery items                   | Zeus Tele                  | Zeus Tele                | Grocery list management                                 |
| Grocery Create       | Airtable create record          | Adds grocery items                      | Zeus Tele                  | None                    | Grocery list management                                 |
| Grocery Delete       | Airtable delete record          | Deletes grocery items                   | Zeus Tele                  | None                    | Grocery list management                                 |
| To-Do Search         | Airtable search                | Searches to-do tasks                    | Zeus Tele                  | Zeus Tele                | To-Do list management                                   |
| To-Do Create         | Airtable create record          | Adds to-do tasks                       | Zeus Tele                  | None                    | To-Do list management                                   |
| To-Do Delete         | Airtable delete record          | Deletes to-do tasks                    | Zeus Tele                  | None                    | To-Do list management                                   |
| Get Events           | Google Calendar getAll          | Retrieves calendar events               | Zeus Tele                  | Zeus Tele                | Calendar management                                    |
| Create Events        | Google Calendar create          | Creates single calendar events          | Zeus Tele                  | None                    | Calendar management                                    |
| Create Recurring Events | Google Calendar create recurring | Creates recurring events               | Zeus Tele                  | None                    | Calendar management                                    |
| Update Events        | Google Calendar update          | Updates calendar events                  | Zeus Tele                  | None                    | Calendar management                                    |
| Delete Events        | Google Calendar delete          | Deletes calendar events                  | Zeus Tele                  | None                    | Calendar management                                    |
| SerpAPI              | Langchain SerpAPI tool          | Performs web searches                    | Zeus Tele                  | Zeus Tele                | External web search integration                         |
| Telegram Response    | Telegram node                  | Sends AI response back to user          | Zeus Tele                  | None                    |                                                        |
| Sticky Note          | Sticky Note                    | Visual annotations                       | None                      | None                    | Multiple sticky notes annotate blocks (Voice, Memory, Grocery, To-Do, Calendar, Internet, Setup Instructions) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Set to listen for updates type: "message"  
   - Configure Telegram credentials (OAuth token or bot token).  
   - Position as entry point.

2. **Create Switch Node**  
   - Type: Switch  
   - Add two outputs:  
     - "Voice": Condition: `$json.message.voice` exists  
     - "Text": Condition: `$json.message.text` exists  
   - Connect Telegram Trigger output to Switch input.

3. **Create Telegram Node for Voice Download**  
   - Type: Telegram  
   - Resource: file  
   - Set fileId: `{{$json.message.voice.file_id}}`  
   - Connect Switch "Voice" output to this node.

4. **Create OpenAI Node for Transcription**  
   - Type: OpenAI  
   - Resource: audio  
   - Operation: transcribe  
   - Connect Telegram voice download node output here.  
   - Configure OpenAI credentials.

5. **Create Airtable Node to Get Memories**  
   - Type: Airtable (Search)  
   - Base and Table: use environment variables or workflow settings for memory base/table IDs  
   - Sort by "Time" ascending  
   - Connect Telegram Trigger output here.

6. **Create Aggregate Node**  
   - Aggregate all fields except: id, createdTime, Created  
   - Connect Get Memories output here.

7. **Create Merge Node (combine mode)**  
   - Mode: Combine (combine all inputs)  
   - Connect Switch "Text" output, OpenAI transcription output, and Aggregate output to Merge inputs.

8. **Create Window Buffer Memory Node**  
   - Type: Langchain Memory Buffer Window  
   - Session Key: "telekey"  
   - Context Window Length: 10  
   - Connect Merge output here.

9. **Create OpenAI Chat Model Node**  
   - Type: Langchain Chat Model (OpenAI)  
   - Model: gpt-4.1-mini  
   - Connect Window Buffer Memory output here.  
   - Use OpenAI credentials.

10. **Create Langchain Agent Node ("Zeus Tele")**  
    - Type: Langchain Agent  
    - Text input: `{{$json.message?.text ?? $json.text}}`  
    - Provide detailed system prompt as per block 1.3 overview (the whole role, rules, tools, and instructions)  
    - Connect Merge node output and OpenAI Chat Model output as ai_languageModel and ai_memory inputs  
    - Connect output to downstream nodes (below).

11. **Create Airtable Nodes for Memory Saving**  
    - User Tele Memory: create record with fields User and Memory, mapping from Telegram username and AI output.  
    - Zeus Text Memory: create record similarly for feedback memories.  
    - Connect from Zeus Tele node ai_tool output.

12. **Create Airtable Nodes for Grocery Management**  
    - Grocery Search: Airtable search node for grocery base/table.  
    - Grocery Create: Airtable create node for adding grocery items.  
    - Grocery Delete: Airtable delete node with record ID.  
    - Connect all from Zeus Tele ai_tool output.

13. **Create Airtable Nodes for To-Do Management**  
    - To-Do Search: Airtable search node for to-do base/table.  
    - To-Do Create: Airtable create node for to-do items.  
    - To-Do Delete: Airtable delete node with record ID.  
    - Connect all from Zeus Tele ai_tool output.

14. **Create Google Calendar Nodes for Event Management**  
    - Get Events: getAll operation, calendar ID from settings.  
    - Create Events: create single event.  
    - Create Recurring Events: create recurring event with repeatUntil.  
    - Update Events: update event using event ID.  
    - Delete Events: delete event by event ID.  
    - Connect all from Zeus Tele ai_tool output.  
    - Configure Google Calendar OAuth2 credentials.

15. **Create SerpAPI Node**  
    - Langchain SerpAPI tool node for web search.  
    - Connect from Zeus Tele ai_tool input.  
    - Set SerpAPI credentials.

16. **Create Telegram Response Node**  
    - Type: Telegram  
    - Text: `={{ $json.output }}`  
    - Chat ID: from incoming message chat or user ID.  
    - Connect from Zeus Tele main output.  
    - Use Telegram credentials.

17. **Add Sticky Notes**  
    - Add visual sticky notes for each functional block with summarized content, e.g., "Voice", "Memory", "Grocery", "To-Do List", "Calendar", "Internet", and "Setup Instructions".

18. **Set Workflow Settings**  
    - Execution order: v1 (default)  
    - Activate workflow after configuration.

19. **Configure Environment Variables or Workflow Settings**  
    - Store Airtable base IDs and table names for Memory, Grocery, To-Do.  
    - Store Google Calendar ID.  
    - Provide API keys and OAuth tokens for Telegram, OpenAI, Airtable, Google Calendar, SerpAPI.

20. **Test Workflow**  
    - Send Telegram messages (text and voice) to the bot.  
    - Verify transcription, AI responses, memory saving, and task/calendar management functions.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Context or Link                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Setup Instructions: After logging into all accounts (Telegram, Airtable, OpenAI, Google Calendar, SerpAPI), create an Airtable base with three tables: Memory, Grocery List, and To-Do List. Assign each table to the corresponding Airtable node in the workflow.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Sticky Note7 in the workflow (direct guidance for initial setup)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Grocery List Management: Use Grocery Search to verify if an item exists before adding or deleting. Adding duplicates is avoided. Clearing the grocery list or selective clearing after shopping is supported with clear user feedback messages.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Sticky Note2 content in the workflow describing detailed grocery list usage instructions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| To-Do List Management: Similar workflow as grocery list with searching, creating, and deleting tasks. Tasks can be associated with projects or classes. Supports full clearing and selective clearing with appropriate feedback.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Sticky Note4 content explains To-Do list management logic and user instructions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Memory Handling Guidelines: Save only new, noteworthy user information or feedback avoiding duplication. Handle privacy carefully, never storing sensitive info. Use recent memories for personalized and context-aware AI responses.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Sticky Note3 and Sticky Note5 provide detailed instructions on memory usage and AI assistant behavior.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Calendar Functionality: Manage calendar events with Google Calendar nodes for querying, creating (single and recurring), updating, and deleting events. Always check for conflicting events before creating single events; skip for recurring. Use numeric string color codes only. Confirmation messages after operations are expected.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Sticky Note1 contains detailed calendar management instructions and color codes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| AI Conversation Style: The AI assistant ("Zeus Tele") is designed to be casual, concise, and human-like, avoiding emojis and formal language. It balances naturalness with efficiency in replies. Memory and task management happens transparently without mentioning data saving to the user.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | System prompt content embedded in the Zeus Tele node configuration.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| News Management: The workflow includes detailed instructions for aggregating and summarizing daily news from multiple sources when the user requests "get daily news" or "get news". The assistant provides balanced, neutral, and concise news summaries with forecasts.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Part of the detailed system prompt in Zeus Tele node.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| External Web Search Integration: SerpAPI is integrated as an AI tool to provide real-time internet search results that the assistant can use to enhance responses.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | SerpAPI node and Sticky Note6 annotation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

---

**Disclaimer:**  
The text and workflow content originate solely from an automated workflow created with n8n, adhering strictly to current content policies without any illegal, offensive, or protected elements. All processed data is legal and public.