AI Agent for realtime insights on meetings

https://n8nworkflows.xyz/workflows/ai-agent-for-realtime-insights-on-meetings-2651


# AI Agent for realtime insights on meetings

### 1. Workflow Overview

This workflow, titled **"AI Agent for realtime insights on meetings"**, is designed as an AI-powered assistant for capturing and analyzing virtual meeting conversations in real-time. It targets business professionals, project managers, and team leaders who frequently conduct remote meetings on platforms such as Google Meet and Zoom. The workflow automates meeting transcription, intelligently processes and stores dialogue, and generates actionable insights.

The workflow is logically divided into the following functional blocks:

- **1.1 Meeting Initialization and Setup:** Creating the bot that joins virtual meetings, starting an AI conversation thread, and logging meeting metadata in a database.
- **1.2 Real-Time Transcription Reception and Ingestion:** Receiving live transcription data via webhook, inserting transcription fragments into the database, and handling dialogue ordering.
- **1.3 Keyword Detection and AI Processing:** Detecting trigger words in the transcription to invoke AI processing for insights or notes generation.
- **1.4 Notes Creation and Output Management:** Storing AI-generated notes back into the database for structured meeting documentation.
- **1.5 Supporting Documentation and Credentials Management:** Sticky notes provide setup instructions, credential replacement reminders, and useful video guides.

---

### 2. Block-by-Block Analysis

#### 2.1 Meeting Initialization and Setup

**Overview:**  
This block sets up the AI meeting assistant by creating a Recall.ai bot to join a specified meeting URL and starting a corresponding OpenAI assistant thread. It then records this session data in a Supabase database, initializing structures for transcription and output.

**Nodes Involved:**  
- Scenario 1 Start - Edit Fields  
- Create Recall bot  
- Create OpenAI thread  
- Create data record

**Node Details:**

- **Scenario 1 Start - Edit Fields**  
  - Type: Set  
  - Role: Initializes the meeting URL parameter for the workflow.  
  - Configuration: Hardcoded meeting URL (e.g., Google Meet link).  
  - Input: None (start node).  
  - Output: To "Create Recall bot".  
  - Failure Modes: None critical; could fail if URL format is invalid.

- **Create Recall bot**  
  - Type: HTTP Request  
  - Role: Creates a Recall.ai bot configured to join the meeting URL with real-time transcription enabled via AssemblyAI provider.  
  - Configuration: POST request with JSON body specifying meeting URL, transcription options, real-time transcription webhook destination (n8n webhook URL), and automatic leave conditions based on silence, participant events, waiting room, etc.  
  - Authentication: Bearer Token using Recall API credentials.  
  - Input: Meeting URL from previous node.  
  - Output: To "Create OpenAI thread".  
  - Failure Modes: API authentication errors, invalid meeting URL, Recall service downtime, webhook URL misconfiguration.

- **Create OpenAI thread**  
  - Type: HTTP Request  
  - Role: Creates a new conversation thread in OpenAI’s assistant API to track the meeting discussion context.  
  - Configuration: POST to OpenAI threads endpoint with required headers (`OpenAI-Beta: assistants=v2`), authenticated with OpenAI API key.  
  - Input: Output from "Create Recall bot" triggers this.  
  - Output: To "Create data record".  
  - Failure Modes: API key invalid, network issues, OpenAI service errors.

- **Create data record**  
  - Type: Supabase node  
  - Role: Inserts initial record into the Supabase `data` table with input fields containing Recall bot ID, OpenAI thread ID, and meeting URL; output JSON initialized with empty dialog array.  
  - Configuration: Table set to `data`, fields `input` and `output` with JSON data referencing prior nodes’ outputs.  
  - Input: From "Create OpenAI thread".  
  - Output: None (end of setup chain).  
  - Failure Modes: Database connection issues, invalid credentials, schema mismatch.

---

#### 2.2 Real-Time Transcription Reception and Ingestion

**Overview:**  
This block receives live transcription fragments from the Recall.ai bot via webhook, updates the database with new dialogue parts in order, and prepares the data for subsequent AI processing.

**Nodes Involved:**  
- Scenario 2 Start - Webhook  
- Insert Transcription Part  
- If Jimmy word

**Node Details:**

- **Scenario 2 Start - Webhook**  
  - Type: Webhook  
  - Role: Endpoint that receives POST requests containing transcription data events from Recall.ai in real-time.  
  - Configuration: HTTP POST method; path set to a unique webhook ID.  
  - Input: External HTTP POST from Recall.ai.  
  - Output: To "Insert Transcription Part".  
  - Failure Modes: Misconfigured webhook URL, network issues, invalid payload format.

- **Insert Transcription Part**  
  - Type: Postgres  
  - Role: Updates the existing database record by appending the received transcription fragment to the `output.dialog` JSONB array, incrementing dialog order, and logging timestamps.  
  - Configuration: SQL UPDATE query using JSONB functions to append new dialog object with fields: order, words (joined from transcript words), speaker, language, speaker_id, and date_updated (current timestamp).  
  - Input: Transcription data from webhook.  
  - Output: Returns OpenAI thread ID; connected to "If Jimmy word".  
  - Failure Modes: SQL errors, invalid JSON handling, database downtime.

- **If Jimmy word**  
  - Type: If  
  - Role: Condition node that checks if the transcribed text contains the keyword "Jimmy" (case sensitive).  
  - Configuration: Uses expression to join all words from the latest transcription and performs substring match for "Jimmy".  
  - Input: From "Insert Transcription Part".  
  - Output: If true, passes data to "OpenAI1" for AI processing.  
  - Failure Modes: Expression errors, case sensitivity leading to misses, empty transcript.

---

#### 2.3 Keyword Detection and AI Processing

**Overview:**  
This block triggers AI assistant processing upon detecting certain keywords in meeting transcription, sending recent dialogue context to OpenAI for analysis or insights generation.

**Nodes Involved:**  
- OpenAI1

**Node Details:**

- **OpenAI1**  
  - Type: Langchain OpenAI  
  - Role: Sends filtered and sorted dialog fragments to OpenAI assistant endpoint, requesting defined AI processing on the recent conversation window.  
  - Configuration:  
    - Input text is dynamically constructed by parsing the stored dialog JSON, filtering for dialog items updated after the last recorded timestamp, sorting by order, and mapping each entry to a string combining spoken words and speaker label.  
    - Memory is keyed by thread ID to maintain session continuity.  
    - Assistant ID is set to a predefined assistant ("5minAI - Realtime Agent").  
  - Input: Condition result from "If Jimmy word" node.  
  - Output: Connected to "Create Note" for note generation.  
  - Failure Modes: JSON parse errors, API quota limits, thread context loss, network timeouts.

---

#### 2.4 Notes Creation and Output Management

**Overview:**  
This block stores AI-generated notes or summaries back to the database, appending them to the existing notes array in the output JSON for structured meeting records.

**Nodes Involved:**  
- Create Note

**Node Details:**

- **Create Note**  
  - Type: Postgres Tool  
  - Role: Updates the database record by appending a new note object into the `output.notes` JSONB array.  
  - Configuration: SQL UPDATE query similar to dialog insertion, adding a note with incremented order and text retrieved from AI processing output.  
  - Input: AI processing result (from "OpenAI1" node).  
  - Output: None (terminal node).  
  - Failure Modes: SQL errors, empty AI output, concurrency conflicts.

---

#### 2.5 Supporting Documentation and Credentials Management

**Overview:**  
Sticky note nodes provide helpful documentation, setup instructions, branding, and reminders for credential replacements.

**Nodes Involved:**  
- Sticky Note7 (Main documentation and branding)  
- Sticky Note6 (Setup steps and API key instructions)  
- Sticky Note9 (Video guide link)  
- Sticky Note, Sticky Note1 (Scenario labels)  
- Sticky Note2, Sticky Note3, Sticky Note4, Sticky Note5, Sticky Note8 (Credential and URL replacement reminders)

**Node Details:**

- **Sticky Note7**  
  - Content: Project branding, detailed overview of workflow purpose, and benefits.  
- **Sticky Note6**  
  - Content: Stepwise setup guide including API key creation, table SQL for Supabase, and development steps.  
- **Sticky Note9**  
  - Content: Embedded YouTube video guide with clickable thumbnail and link.  
- **Other Sticky Notes**  
  - Provide contextual reminders for replacing credentials (Supabase, OpenAI, Recall bot), server location, and meeting URL placeholders.

---

### 3. Summary Table

| Node Name                    | Node Type                      | Functional Role                            | Input Node(s)                | Output Node(s)                 | Sticky Note                                                                                      |
|------------------------------|--------------------------------|-------------------------------------------|-----------------------------|-------------------------------|------------------------------------------------------------------------------------------------|
| Scenario 1 Start - Edit Fields| Set                            | Initialize meeting URL parameter          | None                        | Create Recall bot              |                                                                                                |
| Create Recall bot             | HTTP Request                   | Create Recall.ai bot joining meeting      | Scenario 1 Start - Edit Fields | Create OpenAI thread          |                                                                                                |
| Create OpenAI thread          | HTTP Request                   | Create OpenAI assistant thread            | Create Recall bot            | Create data record             |                                                                                                |
| Create data record            | Supabase                       | Insert initial meeting session record     | Create OpenAI thread         | None                          | Sticky Note2 (Replace Supabase credentials)                                                    |
| Scenario 2 Start - Webhook    | Webhook                       | Receive real-time transcription data      | External (Recall.ai)         | Insert Transcription Part      |                                                                                                |
| Insert Transcription Part     | Postgres                      | Append transcription fragment to DB       | Scenario 2 Start - Webhook   | If Jimmy word                 |                                                                                                |
| If Jimmy word                | If                            | Detect keyword "Jimmy" in transcript      | Insert Transcription Part    | OpenAI1                      |                                                                                                |
| OpenAI1                      | Langchain OpenAI              | Process recent dialogue with OpenAI       | If Jimmy word               | Create Note                   | Sticky Note4 (Replace OpenAI credentials)                                                     |
| Create Note                  | Postgres Tool                 | Append AI-generated note to DB             | OpenAI1                     | None                          | Sticky Note5 (Replace credentials)                                                           |
| Sticky Note7                 | Sticky Note                   | Project branding & overview                | None                        | None                          |                                                                                                |
| Sticky Note6                 | Sticky Note                   | Setup and development instructions         | None                        | None                          |                                                                                                |
| Sticky Note9                 | Sticky Note                   | Video guide link with embedded thumbnail   | None                        | None                          |                                                                                                |
| Sticky Note                  | Sticky Note                   | Scenario 1 label                           | None                        | None                          |                                                                                                |
| Sticky Note1                 | Sticky Note                   | Scenario 2 label                           | None                        | None                          |                                                                                                |
| Sticky Note2                 | Sticky Note                   | Reminder: Replace Supabase credentials     | None                        | None                          |                                                                                                |
| Sticky Note3                 | Sticky Note                   | Reminder: Replace server location          | None                        | None                          |                                                                                                |
| Sticky Note4                 | Sticky Note                   | Reminder: Replace OpenAI credentials       | None                        | None                          |                                                                                                |
| Sticky Note5                 | Sticky Note                   | Reminder: Replace credentials               | None                        | None                          |                                                                                                |
| Sticky Note8                 | Sticky Note                   | Reminder: Replace meeting URL               | None                        | None                          |                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the “Scenario 1 Start - Edit Fields” node**  
   - Node Type: Set  
   - Add a string field named `meeting_url`.  
   - Set its value to the desired meeting URL (e.g., `https://meet.google.com/iix-vrav-kuc`).  
   - Position as the entry point for meeting initialization.

2. **Create the “Create Recall bot” node**  
   - Node Type: HTTP Request  
   - Method: POST  
   - URL: `https://us-west-2.recall.ai/api/v1/bot`  
   - Authentication: HTTP Header Auth using Recall.ai API Bearer token credentials.  
   - Body (JSON):  
     ```json
     {
       "meeting_url": "={{ $json.meeting_url }}",
       "transcription_options": {
         "provider": "assembly_ai"
       },
       "real_time_transcription": {
         "destination_url": "https://<your-n8n-domain>/webhook/<webhook-id>"
       },
       "automatic_leave": {
         "silence_detection": {
           "timeout": 300,
           "activate_after": 600
         },
         "bot_detection": {
           "using_participant_events": {
             "timeout": 600,
             "activate_after": 1200
           }
         },
         "waiting_room_timeout": 600,
         "noone_joined_timeout": 600,
         "everyone_left_timeout": 2,
         "in_call_not_recording_timeout": 600,
         "recording_permission_denied_timeout": 600
       }
     }
     ```  
   - Connect output to “Create OpenAI thread”.

3. **Create the “Create OpenAI thread” node**  
   - Node Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.openai.com/v1/threads`  
   - Authentication: OpenAI API Key Credential  
   - Headers: Add `OpenAI-Beta: assistants=v2`  
   - Connect output to “Create data record”.

4. **Create the “Create data record” node**  
   - Node Type: Supabase  
   - Table: `data`  
   - Fields:  
     - `input` set to JSON containing `openai_thread_id` (from previous node), `recall_bot_id` (from "Create Recall bot"), and `meeting_url` (from webhook input).  
     - `output` initialized with an empty `dialog` array.  
   - Credentials: Configure Supabase API credentials.  
   - End this chain.

5. **Create the webhook node “Scenario 2 Start - Webhook”**  
   - Node Type: Webhook  
   - HTTP Method: POST  
   - Path: Unique webhook ID (matches Recall.ai destination URL).  
   - This node listens for real-time transcription updates.

6. **Create the “Insert Transcription Part” node**  
   - Node Type: Postgres (or Postgres Tool depending on your setup)  
   - Query: SQL UPDATE to append new transcription fragment to `output.dialog` JSONB array in `data` table:  
     - Extract transcript words, speaker, language, speaker_id, and current timestamp from webhook payload.  
     - Increment order based on existing dialog length.  
     - Use parameterized query replacement with bot ID.  
   - Credentials: PostgreSQL with appropriate database access.  
   - Connect webhook output to this node.

7. **Create the “If Jimmy word” node**  
   - Node Type: If  
   - Condition: Check if the joined transcript text contains the keyword "Jimmy".  
   - Expression example:  
     ```js
     $('Scenario 2 Start - Webhook').item.json.body.data.transcript.words.map(w => w.text).join(' ').includes('Jimmy')
     ```  
   - Connect “Insert Transcription Part” output to this node.

8. **Create the “OpenAI1” node**  
   - Node Type: Langchain OpenAI  
   - Parameters:  
     - Text: Use expression to parse and filter dialog JSON for entries updated since last timestamp, map to formatted strings with words and speaker, join by double newline.  
     - Memory: Use current thread ID from JSON context.  
     - Assistant ID: Use your configured assistant ID.  
   - Credentials: OpenAI API key.  
   - Connect “If Jimmy word” true branch to this node.

9. **Create the “Create Note” node**  
   - Node Type: Postgres Tool  
   - Query: Update `output.notes` JSONB array in `data` table, append new note with order and text from AI output.  
   - Credentials: PostgreSQL credentials.  
   - Connect output from “OpenAI1” to this node.

10. **Add Sticky Notes**  
    - Add nodes for documentation, setup instructions, and reminders for replacing API keys, URLs, and credentials as per the original workflow’s sticky notes.  
    - Position them for easy reference.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                 | Context or Link                                                                         |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|
| Detailed video guide explaining how to build the AI-powered meeting assistant providing real-time transcription and insights.                                                                                               | [YouTube Video](https://www.youtube.com/watch?v=rtaX6BMiTeo)                            |
| Workflow created by Mark Shcherbakov from the 5minAI community, providing a scalable solution for transcription automation and AI insights in virtual meetings.                                                               | [LinkedIn](https://www.linkedin.com/in/marklowcoding/), [5minAI Community](https://www.skool.com/5minai) |
| Supabase table schema required for storing input and output JSON data, including dialog and notes arrays.                                                                                                                    | See setup SQL in Sticky Note6.                                                          |
| The workflow requires replacing placeholder credentials and URLs with valid API keys for Recall.ai, OpenAI, and Supabase, as well as configuring the webhook endpoint URL correctly.                                          | See Sticky Note2, Sticky Note3, Sticky Note4, Sticky Note5, Sticky Note8.                |
| The workflow assumes usage of the AssemblyAI transcription provider via Recall.ai for accurate, real-time speech-to-text during meetings.                                                                                   | Configured in “Create Recall bot” node.                                                 |
| OpenAI assistant thread management is used to maintain conversational context for AI responses and note generation.                                                                                                        | Managed via “Create OpenAI thread” and “OpenAI1” nodes.                                 |

---

This documentation enables a clear understanding, reproduction, and potential extension of the workflow for automating real-time meeting transcription and AI-assisted note-taking.