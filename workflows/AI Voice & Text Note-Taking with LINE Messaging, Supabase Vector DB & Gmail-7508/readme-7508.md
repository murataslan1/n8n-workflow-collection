AI Voice & Text Note-Taking with LINE Messaging, Supabase Vector DB & Gmail

https://n8nworkflows.xyz/workflows/ai-voice---text-note-taking-with-line-messaging--supabase-vector-db---gmail-7508


# AI Voice & Text Note-Taking with LINE Messaging, Supabase Vector DB & Gmail

### 1. Workflow Overview

This workflow, titled **AI Voice & Text Note-Taking with LINE Messaging, Supabase Vector DB & Gmail**, is designed to capture, process, store, and retrieve notes from LINE chat messages—both text and audio. It leverages AI for transcription, semantic search, and content generation, and integrates with Supabase for vector database storage and Gmail for automated email delivery.

**Target Use Cases:**
- Capture user notes via LINE messaging (text or voice)
- Automatically transcribe voice messages
- Store notes semantically in Supabase Vector DB for efficient retrieval
- Trigger note saving by a custom keyword (default “Diane”)
- Retrieve and summarize recent notes daily via email
- Use AI to generate ideas, quizzes, or insights from stored notes

**Logical Blocks:**

- **1.1 Input Reception & Filtering:** Receives LINE webhook events, filters by message type (text/audio/image), and user ID.
- **1.2 Audio Download & Transcription:** Downloads audio messages from LINE and transcribes them using OpenAI.
- **1.3 Keyword Detection & Content Cleaning:** Detects trigger keyword in messages and cleans the message by removing it before storage.
- **1.4 Text Processing & Storage:** Converts raw text into embeddings, splits content if necessary, and stores it in Supabase vector DB.
- **1.5 AI Interaction & Memory Management:** Uses LangChain AI agents with Postgres memory and Supabase tools for chat and retrieval.
- **1.6 LINE Response:** Sends processed AI-generated replies back to LINE.
- **1.7 Scheduled Note Retrieval & Emailing:** Daily trigger to fetch recent notes, generate summaries or responses, and send them via Gmail.
- **1.8 Auxiliary Nodes:** Sticky notes provide documentation and configuration guidance.

---

### 2. Block-by-Block Analysis

#### Block 1.1: Input Reception & Filtering

- **Overview:** Receives webhook POST requests from LINE, checks message type, and validates the user ID for processing.
- **Nodes Involved:**  
  - LINE input (Webhook)  
  - If (User ID check)  
  - Switch (Message type filter)
  
- **Node Details:**

1. **LINE input**  
   - Type: Webhook (HTTP POST)  
   - Role: Entry point for LINE events  
   - Config: Listens on path "9010aea3-7129-4700-b79c-314b4e9f989b"  
   - Outputs: JSON containing LINE event data  
   - Failure cases: Webhook misconfiguration, invalid payloads

2. **If**  
   - Type: Conditional (If)  
   - Role: Filters messages to process only those from a specific user (replace `YOUR_USERID`)  
   - Condition: Compares JSON path `$json.body.events[0].source.userId` with configured user ID  
   - Output: Passes only if userId matches; else workflow stops  
   - Edge cases: User ID missing or malformed

3. **Switch**  
   - Type: Switch node  
   - Role: Routes based on message type (`text`, `audio`, or `image`) from LINE event  
   - Routes:  
     - `text` → further text processing  
     - `audio` → audio download & transcription  
     - `image` → no connection (unused)  
   - Edge cases: Unsupported message types routed to fallback ("extra"), which discards them

---

#### Block 1.2: Audio Download & Transcription

- **Overview:** For audio messages, downloads content from LINE API then transcribes using OpenAI.
- **Nodes Involved:**  
  - Download (HTTP Request)  
  - Transcribe (OpenAI Audio Transcription)  
  
- **Node Details:**

1. **Download**  
   - Type: HTTP Request  
   - Role: Downloads audio content from LINE using message ID  
   - Config:  
     - URL dynamically built from `$json.body.events[0].message.id`  
     - Authorization header with LINE channel access token  
   - Edge cases: Network errors, expired tokens, invalid message IDs  

2. **Transcribe**  
   - Type: OpenAI Audio Transcription  
   - Role: Converts audio binary to text using OpenAI’s transcription API  
   - Credentials: OpenAI API  
   - Edge cases: Audio format unsupported, API rate limits, transcription errors

---

#### Block 1.3: Keyword Detection & Content Cleaning

- **Overview:** Detects if the message starts with a trigger keyword (default “Diane”). If yes, removes it before storing.
- **Nodes Involved:**  
  - If1 (Keyword Detection)  
  - Code (JS for Cleaning)  
  
- **Node Details:**

1. **If1**  
   - Type: Conditional (If)  
   - Role: Checks if the `text` field starts with “Diane” (case sensitive)  
   - Logic: OR condition, allowing expansion for multiple keywords  
   - Output: Only messages starting with “Diane” proceed to storage  

2. **Code**  
   - Type: Code (JavaScript)  
   - Role: Removes the keyword prefix “Diane” and any following Japanese comma “、”  
   - Logic: Iterates over items, trims prefix and whitespace  
   - Output: Sets cleaned text under `text` field  
   - Edge cases: Messages without the keyword pass through unchanged

---

#### Block 1.4: Text Processing & Storage

- **Overview:** Converts cleaned text into AI document format, splits long text, generates embeddings, and inserts into Supabase vector DB.
- **Nodes Involved:**  
  - Default Data Loader  
  - Recursive Character Text Splitter  
  - Embeddings OpenAI  
  - Add to Supabase Table  
  - Edit Fields1 (Confirmation message)  
  
- **Node Details:**

1. **Default Data Loader**  
   - Type: LangChain Document Loader  
   - Role: Wraps raw text into document format for LangChain  
   - Input: Cleaned `text`  
   - Output: Document JSON  

2. **Recursive Character Text Splitter**  
   - Type: LangChain Text Splitter  
   - Role: Splits documents recursively into chunks for embedding  
   - Default config, no custom parameters  

3. **Embeddings OpenAI**  
   - Type: OpenAI Embeddings  
   - Role: Converts text chunks into vector embeddings  
   - Credential: OpenAI API  

4. **Add to Supabase Table**  
   - Type: Supabase Vector Store Node  
   - Role: Inserts new document embeddings into `documents` table in Supabase  
   - Config: Insert mode, target table “documents”  
   - Credential: Supabase API  
   - Edge cases: DB connectivity, insert conflicts, credential expiry  

5. **Edit Fields1**  
   - Type: Set node  
   - Role: Sets output text to “Notes saved.” for confirmation reply  
   - Output: Contains fixed message  

---

#### Block 1.5: AI Interaction & Memory Management

- **Overview:** Uses LangChain AI Agents with OpenAI chat models, Postgres chat memory for session context, and Supabase vector search tool for retrieval-augmented generation.
- **Nodes Involved:**  
  - AI Agent  
  - OpenAI Chat Model  
  - Postgres Chat Memory  
  - Supabase Vector Store  
  
- **Node Details:**

1. **AI Agent**  
   - Type: LangChain Agent Node  
   - Role: Routes user text to relevant tools (memory, vector DB) for response generation  
   - Prompt: System message sets AI assistant capabilities and tools (SupabaseVectorStore)  
   - Input: Text from user message  
   - Output: AI-generated response  

2. **OpenAI Chat Model**  
   - Type: LangChain Chat Model  
   - Role: Uses GPT-5 to compose responses  
   - Credential: OpenAI API  
   - Model: “gpt-5”  

3. **Postgres Chat Memory**  
   - Type: LangChain Memory Node  
   - Role: Maintains conversational context per user session (keyed by userId)  
   - Credential: Postgres (Supabase)  
   - Parameter: Context window length 50 (tokens/messages)  

4. **Supabase Vector Store**  
   - Type: LangChain Vector Store Tool  
   - Role: Provides semantic search over stored notes for context retrieval  
   - Credential: Supabase API  
   - Table: “documents”  
   - Tool description explains usage in prompt  

- **Connections:** OpenAI model, memory, and vector store feed into AI Agent node for enriched responses.

---

#### Block 1.6: LINE Response

- **Overview:** Sends the AI-generated reply back to the user on LINE using the replyToken.
- **Nodes Involved:**  
  - Edit Fields (sets output)  
  - LINE output (HTTP Request)  
  
- **Node Details:**

1. **Edit Fields**  
   - Type: Set node  
   - Role: Prepares the reply message content from AI Agent output  
   - Output: JSON with `output` text  

2. **LINE output**  
   - Type: HTTP Request  
   - Role: Calls LINE Messaging API to send reply message  
   - Config:  
     - URL: `https://api.line.me/v2/bot/message/reply`  
     - Method: POST  
     - Headers: Authorization Bearer with LINE token, Content-Type application/json  
     - Body: JSON with replyToken and message text  
   - Edge cases: Token expiry, invalid replyToken, API rate limits

---

#### Block 1.7: Scheduled Note Retrieval & Emailing

- **Overview:** Automatically triggers every day at 7 AM to generate a request to fetch recent notes and email them via Gmail.
- **Nodes Involved:**  
  - Schedule Trigger  
  - Edit Fields2 (compose request text)  
  - AI Agent1  
  - OpenAI Chat Model1  
  - Supabase Vector Store1  
  - Embeddings1  
  - Send a message in Gmail1  
  
- **Node Details:**

1. **Schedule Trigger**  
   - Type: Schedule node  
   - Role: Fires at 7:00 AM daily  

2. **Edit Fields2**  
   - Type: Set node  
   - Role: Sets prompt text: “最新のメモ内容を3件拾って内容をメールしてください。” (Please pick the latest 3 notes and send them by email)  

3. **AI Agent1**  
   - Similar to AI Agent in block 1.5, but with additional tool for Gmail email sending  
   - Tools listed: Gmail message sending, Supabase vector store  

4. **OpenAI Chat Model1**  
   - GPT-5 chat model for response generation  

5. **Supabase Vector Store1 & Embeddings1**  
   - Used for retrieval and embedding in this scheduled flow  

6. **Send a message in Gmail1**  
   - Type: Gmail node (OAuth2)  
   - Role: Sends the generated email to configured address (`YOUR_EMAIL_ADDRESS`)  
   - Parameters: Subject and message dynamically generated by AI  
   - Edge cases: Gmail OAuth token expiry, quota limits, invalid email address  

---

#### Block 1.8: Auxiliary Nodes (Documentation)

- **Overview:** Provide user guidance, system notes, and configuration help.
- **Nodes Involved:**  
  - Sticky Note  
  - Sticky Note1  
  - Sticky Note2  

- **Node Details:**

1. **Sticky Note**  
   - Content: Email delivery schedule, prompt examples for note generation  
   - Location: Near schedule trigger block  

2. **Sticky Note1**  
   - Content: Explanation of trigger keyword usage and cleaning logic  
   - Location: Near keyword detection and code nodes  

3. **Sticky Note2**  
   - Content: Full workflow overview, requirements, key features, references  
   - Location: Near workflow entry nodes  

---

### 3. Summary Table

| Node Name               | Node Type                                    | Functional Role                             | Input Node(s)             | Output Node(s)           | Sticky Note                                                                                 |
|-------------------------|----------------------------------------------|--------------------------------------------|---------------------------|--------------------------|---------------------------------------------------------------------------------------------|
| LINE input              | Webhook                                      | Entry point for LINE webhook events         |                           | If                       | See Sticky Note2 for overview and setup notes                                              |
| If                      | Conditional                                  | Filters messages by user ID                  | LINE input                | Switch                   |                                                                                             |
| Switch                  | Switch                                       | Routes by message type (text/audio/image)   | If                        | only message, Download   |                                                                                             |
| only message            | Set                                          | Extracts message text from event             | Switch                    | AI Agent                 |                                                                                             |
| AI Agent                | LangChain Agent                              | Routes user input to AI tools for response  | only message, If1          | Edit Fields              |                                                                                             |
| Edit Fields             | Set                                          | Prepares reply output text                    | AI Agent                  | LINE output              |                                                                                             |
| LINE output             | HTTP Request                                 | Sends reply message via LINE API             | Edit Fields               |                          |                                                                                             |
| Download                | HTTP Request                                 | Downloads audio content from LINE            | Switch                    | Transcribe               |                                                                                             |
| Transcribe              | OpenAI Audio Transcription                    | Transcribes audio to text                     | Download                  | If1                      |                                                                                             |
| If1                     | Conditional                                  | Detects trigger keyword in text              | Transcribe                | Code, AI Agent           | See Sticky Note1 for trigger keyword usage                                                 |
| Code                    | Code (JavaScript)                            | Removes trigger keyword before storage       | If1                       | Add to Supabase Table    | See Sticky Note1                                                                            |
| Default Data Loader     | LangChain Document Loader                    | Wraps text into document format               | Code                      | Recursive Character Text Splitter |                                                                                             |
| Recursive Character Text Splitter | LangChain Text Splitter                  | Splits text into chunks                       | Default Data Loader        | Embeddings OpenAI        |                                                                                             |
| Embeddings OpenAI       | OpenAI Embeddings                            | Generates vector embeddings                    | Recursive Character Text Splitter | Add to Supabase Table |                                                                                             |
| Add to Supabase Table   | Supabase Vector Store                        | Inserts documents into Supabase vector DB    | Embeddings OpenAI, Default Data Loader | Edit Fields1          |                                                                                             |
| Edit Fields1            | Set                                          | Confirmation message “Notes saved.”           | Add to Supabase Table     | LINE output              |                                                                                             |
| Postgres Chat Memory    | LangChain Memory                            | Maintains conversational memory/session       |                           | AI Agent                 |                                                                                             |
| Supabase Vector Store   | LangChain Vector Store Tool                  | Semantic search tool for AI agent             |                           | AI Agent                 |                                                                                             |
| OpenAI Chat Model       | LangChain Chat Model                         | GPT-5 model for AI response                    |                           | AI Agent                 |                                                                                             |
| Schedule Trigger        | Schedule                                     | Triggers daily note retrieval & emailing      |                           | Edit Fields2             | See Sticky Note for scheduled email delivery guidelines                                   |
| Edit Fields2            | Set                                          | Sets prompt text for daily note retrieval     | Schedule Trigger          | AI Agent1                |                                                                                             |
| AI Agent1               | LangChain Agent                              | Routes scheduled prompt to tools (Gmail, Supabase) | Edit Fields2           |                          |                                                                                             |
| OpenAI Chat Model1      | LangChain Chat Model                         | GPT-5 model for scheduled emailing            |                           | AI Agent1                |                                                                                             |
| Supabase Vector Store1  | LangChain Vector Store Tool                  | Vector search tool for scheduled flow         |                           | AI Agent1                |                                                                                             |
| Embeddings1             | OpenAI Embeddings                            | Embeddings for scheduled flow                  |                           | Supabase Vector Store1   |                                                                                             |
| Send a message in Gmail1 | Gmail Tool                                  | Sends generated email to configured address   | AI Agent1                 |                          |                                                                                             |
| Sticky Note             | Sticky Note                                  | Notes on email delivery and prompt examples   |                           |                          | See content in section 2.8                                                                 |
| Sticky Note1            | Sticky Note                                  | Notes on trigger keyword detection and cleaning |                           |                          | See content in section 2.3                                                                 |
| Sticky Note2            | Sticky Note                                  | Workflow overview, features, requirements     |                           |                          | See content in section 2.8                                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook (POST)  
   - Name: `LINE input`  
   - Configure path (unique identifier string)  
   - This node receives LINE webhook events  

2. **Add If Node**  
   - Name: `If`  
   - Condition: Check if `$json.body.events[0].source.userId` equals your LINE user ID (`YOUR_USERID`)  
   - Connect `LINE input` → `If`  

3. **Add Switch Node**  
   - Name: `Switch`  
   - Condition: Evaluate `$json.body.events[0].message.type` with cases: `text`, `audio`, `image`  
   - Connect `If` main output → `Switch`  

4. **For Text Messages:**  
   a. Add Set Node `only message`  
      - Assign `text` from `$json.body.events[0].message.text`  
      - Connect `Switch` → `only message` (text branch)  
   b. Add LangChain Agent Node `AI Agent`  
      - Text input: `={{ $json.text }}`  
      - System message: Define tools including `SupabaseVectorStore`  
      - Connect `only message` → `AI Agent`  

5. **For Audio Messages:**  
   a. Add HTTP Request `Download`  
      - URL: `https://api-data.line.me/v2/bot/message/{{ $json.body.events[0].message.id }}/content`  
      - Header: Authorization Bearer `LINE_CHANNELACCESS_TOKEN`  
      - Connect `Switch` → `Download` (audio branch)  
   b. Add OpenAI Audio Transcription Node `Transcribe`  
      - Connect `Download` → `Transcribe`  

6. **Keyword Detection:**  
   a. Add If Node `If1`  
      - Condition: Check if `text` starts with “Diane”  
      - Connect `Transcribe` and `only message` → `If1`  
   b. Add Code Node `Code`  
      - JS script to remove prefix “Diane” and following “、”  
      - Connect `If1` true output → `Code`  

7. **Text Processing to Supabase:**  
   a. Add LangChain Default Data Loader `Default Data Loader`  
      - Input text from `Code` output  
      - Connect `Code` → `Default Data Loader`  
   b. Add LangChain Recursive Character Text Splitter `Recursive Character Text Splitter`  
      - Connect `Default Data Loader` → `Recursive Character Text Splitter`  
   c. Add OpenAI Embeddings Node `Embeddings OpenAI`  
      - Connect `Recursive Character Text Splitter` → `Embeddings OpenAI`  
   d. Add Supabase Vector Store Node `Add to Supabase Table`  
      - Mode: Insert  
      - Table: `documents`  
      - Connect `Embeddings OpenAI` → `Add to Supabase Table`  
   e. Add Set Node `Edit Fields1`  
      - Set output JSON with message: “Notes saved.”  
      - Connect `Add to Supabase Table` → `Edit Fields1`  

8. **LINE Reply:**  
   - Add HTTP Request Node `LINE output`  
   - URL: `https://api.line.me/v2/bot/message/reply`  
   - Method: POST  
   - Header: Authorization Bearer `LINE_CHANNELACCESS_TOKEN` and Content-Type: application/json  
   - Body: JSON with replyToken and message text from previous node  
   - Connect `Edit Fields1` and `AI Agent` → `LINE output`  

9. **AI Agent Configuration:**  
   - Add LangChain Chat Model Node `OpenAI Chat Model`  
   - Model: `gpt-5`  
   - Credential: OpenAI API  
   - Connect `OpenAI Chat Model` → `AI Agent`  

10. **Memory Integration:**  
    - Add LangChain Postgres Chat Memory Node `Postgres Chat Memory`  
    - Session key: userId from LINE event  
    - Credential: Postgres (Supabase)  
    - Connect `Postgres Chat Memory` → `AI Agent`  

11. **Supabase Vector Store Tool:**  
    - Add LangChain Supabase Vector Store Node `Supabase Vector Store`  
    - Configure to use `documents` table  
    - Credential: Supabase API  
    - Connect `Supabase Vector Store` → `AI Agent`  

12. **Scheduled Email Flow:**  
    a. Add Schedule Trigger Node `Schedule Trigger`  
       - Trigger at 7 AM daily  
    b. Add Set Node `Edit Fields2`  
       - Set fixed text prompt for latest 3 notes email  
       - Connect `Schedule Trigger` → `Edit Fields2`  
    c. Add LangChain Agent `AI Agent1`  
       - Add tools: Gmail message sending and Supabase Vector Store  
       - Connect `Edit Fields2` → `AI Agent1`  
    d. Add OpenAI Chat Model `OpenAI Chat Model1` (GPT-5)  
       - Connect to `AI Agent1`  
    e. Add Supabase Vector Store `Supabase Vector Store1` and Embeddings `Embeddings1`  
       - Connect `Embeddings1` to `Supabase Vector Store1`  
       - Connect to `AI Agent1`  
    f. Add Gmail Node `Send a message in Gmail1`  
       - Set recipient email (`YOUR_EMAIL_ADDRESS`)  
       - Subject and message dynamically from AI Agent1  
       - Credential: Gmail OAuth2  
       - Connect `AI Agent1` → `Send a message in Gmail1`  

13. **Add Sticky Notes**  
    - Add descriptive sticky notes in canvas for user guidance (optional but recommended)

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                           | Context or Link                                                                                                             |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| The default trigger keyword “Diane” is a homage to the TV series Twin Peaks, where the protagonist records memos starting with “Diane.” You can customize this keyword in the If and Code nodes.                                                                        | Section 2.3, Sticky Note1                                                                                                   |
| Email delivery is set to trigger every morning at 7 AM, sending the latest 3 notes automatically via Gmail. Sample prompts include idea generation, suspect prediction, and quiz question creation from notes.                                                         | Section 2.8, Sticky Note                                                                                                    |
| Requirements include a Supabase account (free plan supported), LINE Messaging API setup, and Gmail OAuth2 credentials configured in n8n. Replace placeholders such as LINE access token, user ID, and email address with your actual values.                            | Section 2.8, Sticky Note2                                                                                                   |
| Supabase Vector Store documentation: https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstoresupabase/?utm_source=n8n_app&utm_medium=node_settings_modal-credential_link&utm_campaign=%40n8n%2Fn8n-nodes-langchain.vectorStoreSupabase | Official n8n docs for the Supabase Vector Store node                                                                       |
| Ensure all credentials (OpenAI, Supabase, LINE, Gmail) are securely set up in n8n’s Credentials section before activating the workflow.                                                                                                                                  | General best practice                                                                                                       |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.