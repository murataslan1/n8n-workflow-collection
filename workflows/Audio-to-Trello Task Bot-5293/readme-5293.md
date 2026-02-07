Audio-to-Trello Task Bot

https://n8nworkflows.xyz/workflows/audio-to-trello-task-bot-5293


# Audio-to-Trello Task Bot

---

### 1. Workflow Overview

This workflow, named **"Telegram tasker bot"**, automates the creation of Trello tasks from audio messages sent via Telegram. It targets users who want to convert voice notes into structured Trello cards seamlessly, leveraging AI to parse natural language into task details with dates.

The workflow is logically divided into these blocks:

- **1.1 Input Reception:** Listens for incoming Telegram messages containing voice notes, then downloads the audio file.
- **1.2 Audio Transcription:** Uses OpenAI’s API to transcribe the audio message into text.
- **1.3 AI Task Parsing:** Processes the transcribed text with an AI agent that extracts structured task information (task name, description, start and end dates) formatted as JSON.
- **1.4 Task Creation & Validation:** Parses the AI output JSON, creates a Trello card with the extracted details, and verifies successful creation.
- **1.5 User Notification:** Sends confirmation or error messages back to the Telegram user according to success or failure.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block triggers the workflow on new Telegram messages, extracts voice note file IDs, and downloads the audio file.

- **Nodes Involved:**  
  - Telegram Trigger  
  - Get audio

- **Node Details:**

  - **Telegram Trigger**  
    - *Type:* Telegram Trigger node  
    - *Role:* Entry point listening for Telegram updates of type "message"  
    - *Configuration:* Listens specifically for all incoming messages. Uses stored Telegram API credentials.  
    - *Input:* None (Webhook trigger)  
    - *Output:* Telegram message JSON, including voice note metadata if present  
    - *Failure Modes:* Telegram API connection errors, webhook misconfiguration, missing permissions for voice messages

  - **Get audio**  
    - *Type:* Telegram node (file download)  
    - *Role:* Downloads the voice message audio file using file_id from Telegram message  
    - *Configuration:* Reads `file_id` from `{{$json.message.voice.file_id}}` to fetch the file  
    - *Input:* Telegram Trigger output  
    - *Output:* Binary audio file for transcription  
    - *Failure Modes:* File not found, Telegram API limits, expired file URLs, missing file_id field

---

#### 2.2 Audio Transcription

- **Overview:**  
  Transcribes the downloaded audio into Russian text using OpenAI’s audio transcription capability.

- **Nodes Involved:**  
  - Transcriber

- **Node Details:**

  - **Transcriber**  
    - *Type:* OpenAI node (audio transcription)  
    - *Role:* Converts audio binary data to text  
    - *Configuration:* Language set to Russian (`ru`), temperature 0 for deterministic output, operation set to "transcribe"  
    - *Input:* Binary audio file from Get audio  
    - *Output:* Transcribed text as JSON property `text`  
    - *Credentials:* OpenAI API key required  
    - *Failure Modes:* Audio format unsupported, OpenAI API timeout or quota exceeded, poor audio quality causing transcription errors

---

#### 2.3 AI Task Parsing

- **Overview:**  
  Parses the transcribed text into a structured JSON task object with fields for task name, description, and date range.

- **Nodes Involved:**  
  - AI Agent  
  - Simple Memory  
  - Groq Chat Model (configured but not connected in this workflow)

- **Node Details:**

  - **AI Agent**  
    - *Type:* LangChain AI Agent node  
    - *Role:* Receives plain text and outputs precisely formatted JSON describing the task  
    - *Configuration:*  
      - Input text: from transcription `$json.text`  
      - System prompt instructs the agent to:  
        - Output exactly one JSON string with keys `name`, `description`, `date_start`, and `date_end`  
        - Extract and normalize dates relative to the current date (`$today`) with specific rules for relative days and ranges  
        - Limit `name` to 8–10 words or default to "Общая задача" ("General task")  
        - Place the entire original text in `description`  
        - No extra text or line breaks outside JSON  
      - Prompt is in Russian, tailored for parsing tasks with date extraction  
    - *Input:* Transcribed text from Transcriber  
    - *Output:* JSON string in text field (needs parsing)  
    - *Memory:* Connected to Simple Memory node for session-based context via Telegram username  
    - *Failure Modes:* AI model errors, malformed outputs, rate limits

  - **Simple Memory**  
    - *Type:* LangChain memory buffer node  
    - *Role:* Maintains a conversational memory window keyed by Telegram user's username to provide context continuity  
    - *Configuration:* Session key set to Telegram username extracted via expression `{{$('Telegram Trigger').item.json.message.from.username}}`  
    - *Input:* None directly; connected as `ai_memory` to AI Agent  
    - *Failure Modes:* Missing username in Telegram message, memory overflow, data loss

  - **Groq Chat Model**  
    - *Type:* LangChain Chat Model node  
    - *Role:* Alternative AI language model configured but not actively used in connections  
    - *Configuration:* Credentials set for Groq API  
    - *Note:* Present in workflow but no active links; possibly reserved for future use or fallback

---

#### 2.4 Task Creation & Validation

- **Overview:**  
  Parses AI output JSON string, creates a Trello card, and confirms card creation.

- **Nodes Involved:**  
  - Parse to json  
  - Create Trello Card  
  - If trello card id exists

- **Node Details:**

  - **Parse to json**  
    - *Type:* Code node (JavaScript)  
    - *Role:* Converts AI Agent’s JSON string output into actual JSON object for Trello  
    - *Code:* `const data = JSON.parse($input.first().json.output); return [{ json: data }];`  
    - *Input:* AI Agent output (string JSON in `output` property)  
    - *Output:* Parsed JSON with fields `name`, `description`, `date_start`, `date_end`  
    - *Failure Modes:* JSON parse errors if AI output malformed or missing

  - **Create Trello Card**  
    - *Type:* Trello node  
    - *Role:* Creates a new card in a specified Trello list with task details  
    - *Configuration:*  
      - Card name: `{{$json.name}}`  
      - Description: `{{$json.description}}`  
      - List ID: fixed Trello list ID `"64a39a922fd043526af50b36"`  
      - Max 5 retry attempts with retry enabled  
    - *Credentials:* Trello API credentials required  
    - *Input:* Parsed JSON task object  
    - *Output:* Trello card JSON including card ID and URL  
    - *Failure Modes:* Trello API errors, authentication failures, invalid list ID

  - **If trello card id exists**  
    - *Type:* If node  
    - *Role:* Checks if Trello card creation succeeded by testing existence of `id` property  
    - *Configuration:* Condition: string existence check `{{$json.id}}`  
    - *Input:* Output of Create Trello Card  
    - *Outputs:*  
      - True branch: card created successfully  
      - False branch: card creation failed  
    - *Failure Modes:* Empty or missing ID due to API failure or malformed response

---

#### 2.5 User Notification

- **Overview:**  
  Sends a success message with Trello card link or an error message back to the Telegram user.

- **Nodes Involved:**  
  - Send task message  
  - Send error message  
  - Stop and Error

- **Node Details:**

  - **Send task message**  
    - *Type:* Telegram node (send message)  
    - *Role:* Notifies user that task was successfully created  
    - *Configuration:*  
      - Text includes task name and Trello card URL, e.g.:  
        ```
        Создана задача:  {{ $json.name }}
        Ссылка на задачу: {{ $('Create Trello Card').item.json.url }}
        ```  
      - Chat ID: from original Telegram message chat  
      - Replies to original message ID  
      - Notifications enabled  
    - *Input:* True branch output from If trello card id exists  
    - *Failure Modes:* Telegram API errors, invalid chat ID

  - **Send error message**  
    - *Type:* Telegram node (send message)  
    - *Role:* Informs the user about failure in task creation  
    - *Configuration:* Sends fixed message: `"Ошибка при создании задачи"` ("Error creating task")  
      - Chat ID and reply set to original message context  
    - *Input:* False branch output from If trello card id exists  
    - *Output:* Feeds into Stop and Error node  
    - *Failure Modes:* Telegram API errors

  - **Stop and Error**  
    - *Type:* Stop and Error node  
    - *Role:* Explicitly halts workflow with error message `"Task creation failed"`  
    - *Input:* From Send error message node  
    - *Failure Modes:* N/A (intended to stop workflow)

---

### 3. Summary Table

| Node Name              | Node Type                      | Functional Role                  | Input Node(s)         | Output Node(s)                  | Sticky Note                                   |
|------------------------|--------------------------------|---------------------------------|-----------------------|---------------------------------|-----------------------------------------------|
| Telegram Trigger       | Telegram Trigger               | Entry point listening to Telegram messages | None                  | Get audio                       |                                               |
| Get audio              | Telegram (file download)       | Downloads voice note audio file  | Telegram Trigger      | Transcriber                    |                                               |
| Transcriber            | OpenAI Audio Transcription     | Transcribes audio to text        | Get audio             | AI Agent                      |                                               |
| AI Agent               | LangChain AI Agent             | Parses text into structured task JSON | Transcriber, Simple Memory (memory), Groq Chat Model (lang model, unused) | Parse to json                  |                                               |
| Simple Memory          | LangChain Memory Buffer        | Maintains session memory keyed by Telegram username | None (used as ai_memory input) | AI Agent                      |                                               |
| Groq Chat Model        | LangChain Chat Model           | Alternative AI model (not connected) | None                  | AI Agent (ai_languageModel input) |                                               |
| Parse to json          | Code Node                     | Parses AI Agent output JSON string into JSON object | AI Agent              | Create Trello Card             |                                               |
| Create Trello Card     | Trello Node                   | Creates Trello card with task details | Parse to json         | If trello card id exists       |                                               |
| If trello card id exists | If Node                      | Checks if Trello card was created | Create Trello Card     | Send task message (true), Send error message (false) |                                               |
| Send task message      | Telegram (send message)        | Sends success confirmation to user | If trello card id exists (true) | None                          |                                               |
| Send error message     | Telegram (send message)        | Sends error notification to user | If trello card id exists (false) | Stop and Error                |                                               |
| Stop and Error         | Stop and Error                 | Halts workflow on error          | Send error message     | None                          |                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger node:**  
   - Type: Telegram Trigger  
   - Configure to listen for "message" updates  
   - Set up Telegram API credentials with bot token  
   - Position this as the workflow entry point.

2. **Add Get audio node:**  
   - Type: Telegram node (file download)  
   - Set `fileId` parameter to `{{$json.message.voice.file_id}}` to get voice note audio file from incoming message  
   - Use same Telegram credentials  
   - Connect Telegram Trigger output to Get audio input.

3. **Add Transcriber node:**  
   - Type: OpenAI node (audio transcription)  
   - Operation: Transcribe audio  
   - Language: Russian ("ru")  
   - Temperature: 0 (deterministic)  
   - Provide OpenAI API credentials  
   - Connect Get audio output to Transcriber input.

4. **Add AI Agent node:**  
   - Type: LangChain AI Agent node  
   - Input text: `{{$json.text}}` from Transcriber output  
   - Configure system message prompt in Russian instructing:  
     - Output exactly one JSON string with keys: `name`, `description`, `date_start`, `date_end`  
     - Parsing rules for dates relative to current date `$today`  
     - Task name limited to 8–10 words or default "Общая задача"  
     - Description equals original text  
     - No extra text outside JSON  
   - Connect Transcriber output to AI Agent input.

5. **Add Simple Memory node:**  
   - Type: LangChain memory buffer window node  
   - Session key: `{{$('Telegram Trigger').item.json.message.from.username}}` to link memory to user  
   - Connect Simple Memory node as `ai_memory` input to AI Agent node.

6. **(Optional) Add Groq Chat Model node:**  
   - Type: LangChain Chat Model node  
   - Configure Groq API credentials  
   - (Note: Not connected in this workflow; can be omitted or reserved for future use)

7. **Add Parse to json node:**  
   - Type: Code node (JavaScript)  
   - Code:  
     ```javascript
     const data = JSON.parse($input.first().json.output);
     return [{ json: data }];
     ```  
   - Connect AI Agent output to Parse to json input.

8. **Add Create Trello Card node:**  
   - Type: Trello node  
   - Card name: `{{$json.name}}`  
   - Card description: `{{$json.description}}`  
   - List ID: `"64a39a922fd043526af50b36"` (replace with your Trello list ID)  
   - Set retries: max 5 attempts with retry enabled  
   - Provide Trello API credentials  
   - Connect Parse to json output to Create Trello Card input.

9. **Add If trello card id exists node:**  
   - Type: If node  
   - Condition: Check if string `{{$json.id}}` exists  
   - Connect Create Trello Card output to If node input.

10. **Add Send task message node:**  
    - Type: Telegram (send message)  
    - Text:  
      ```
      Создана задача:  {{ $json.name }}
      Ссылка на задачу: {{ $('Create Trello Card').item.json.url }}
      ```  
    - Chat ID: `{{$('Telegram Trigger').item.json.message.chat.id}}`  
    - Reply to message ID: `{{$('Telegram Trigger').item.json.message.message_id}}`  
    - Use Telegram API credentials  
    - Connect If node "true" output to Send task message input.

11. **Add Send error message node:**  
    - Type: Telegram (send message)  
    - Text: `"Ошибка при создании задачи"`  
    - Chat ID and reply to message ID same as above  
    - Use Telegram credentials  
    - Connect If node "false" output to Send error message input.

12. **Add Stop and Error node:**  
    - Type: Stop and Error node  
    - Error message: `"Task creation failed"`  
    - Connect Send error message output to Stop and Error input.

---

### 5. General Notes & Resources

| Note Content                                                                                                                      | Context or Link                                            |
|-----------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------|
| The workflow uses a custom Russian-language prompt to parse tasks with relative date expressions, ensuring tasks are date-aware. | System message in AI Agent node                             |
| Trello list ID is hardcoded; replace with your own Trello list ID to deploy in a different environment.                           | Create Trello Card node parameter                           |
| Telegram bot must have permissions to read messages and download voice messages.                                                  | Telegram Trigger and Get audio nodes                        |
| OpenAI API key with audio transcription enabled is required.                                                                      | Transcriber node                                           |
| The workflow includes retry logic on Trello API calls to improve reliability.                                                     | Create Trello Card node configuration                       |
| The "Groq Chat Model" node is present but not connected; consider removing or integrating depending on AI provider preferences.   | Workflow node list                                          |

---

**Disclaimer:**  
The provided text exclusively originates from an automated n8n workflow. All processing complies strictly with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.