AI Knowledge Base Assistant with OpenAI, Supabase & Google Drive Doc Sync

https://n8nworkflows.xyz/workflows/ai-knowledge-base-assistant-with-openai--supabase---google-drive-doc-sync-6538


# AI Knowledge Base Assistant with OpenAI, Supabase & Google Drive Doc Sync

---

## 1. Workflow Overview

This workflow is designed as an **AI Knowledge Base Assistant** that integrates **OpenAI**, **Supabase Vector Database**, and **Google Drive** to create an automated, intelligent chatbot system. It supports ingestion and update of documents from Google Drive into a vector store and enables users to query the knowledge base via Telegram with voice or text input. The system uses Retrieval-Augmented Generation (RAG) to provide accurate information sourced from company documents.

### Target Use Cases
- Internal company assistants for HR, ops, or knowledge management
- Customer support bots answering FAQs based on up-to-date documentation
- SaaS or consulting agencies needing AI-powered knowledge retrieval
- Voice-enabled chatbot interactions with transcription capabilities

### Logical Blocks

**1.1 RAG Chatbot Interaction**  
Handles incoming Telegram messages (voice or text), transcribes voice if needed, queries the vector database for relevant info, and sends AI-generated answers back.

**1.2 New File Processing Workflow**  
Triggered by new files uploaded to a specific Google Drive folder. Downloads and extracts text, splits it into chunks, generates embeddings, and inserts them into Supabase vector store.

**1.3 Update File Processing Workflow**  
Triggered by file updates in the same Google Drive folder. Deletes old database entries related to the file, reprocesses the file text, regenerates embeddings, and reinserts updated data.

---

## 2. Block-by-Block Analysis

### 2.1 RAG Chatbot Interaction

**Overview:**  
This block listens for incoming Telegram messages (voice or text), converts voice messages to text, and routes the text query through a RAG agent that searches the Supabase vector store for relevant document chunks. The final AI-generated response is sent back to the Telegram user.

**Nodes Involved:**  
- Telegram Trigger  
- Voice or Text (Switch)  
- Download File2 (Telegram)  
- Transcribe (OpenAI Whisper)  
- Text (Set)  
- RAG Agent (LangChain agent)  
- MarketingLadder (Vector Store Tool)  
- Supabase Vector Store3  
- Embeddings OpenAI3  
- OpenAI Chat Model3  
- Window Buffer Memory1  
- Response (Telegram)  
- Sticky Notes (for documentation)

**Node Details:**

- **Telegram Trigger**  
  - Type: trigger node for incoming Telegram messages  
  - Config: listens to "message" updates  
  - Credentials: Telegram Bot OAuth2  
  - Outputs: sends JSON with message data  

- **Voice or Text** (Switch)  
  - Type: switch node to route voice or text message  
  - Logic: checks if message contains voice file_id or text field  
  - Outputs: two paths - "voice" and "Text"  

- **Download File2**  
  - Type: Telegram node to download voice file  
  - Input: voice file_id from Telegram message  
  - Credentials: Telegram OAuth2  
  - Output: audio file data for transcription  

- **Transcribe**  
  - Type: OpenAI Whisper transcription node  
  - Input: audio from Download File2  
  - Credentials: OpenAI API key  
  - Output: text transcription  

- **Text**  
  - Type: Set node  
  - Input: raw text message from Telegram (for text path)  
  - Sets variable "text" with message text  

- **RAG Agent**  
  - Type: LangChain Agent node configured as RAG assistant  
  - Input: text query from either transcription or direct text  
  - Config:  
    - System message instructs to search vector DB only, no hallucination  
    - Uses "MarketingLadder" vector store tool  
  - Output: AI-generated answer  

- **MarketingLadder**  
  - Type: Vector Store Tool (LangChain)  
  - Role: queries Supabase vector DB for relevant docs  
  - Inputs: query from RAG Agent  
  - Outputs: context data for agent  

- **Supabase Vector Store3**  
  - Type: LangChain Supabase vector store node  
  - Role: vector search backend for MarketingLadder tool  
  - Credentials: Supabase API key  
  - Table: "documents"  

- **Embeddings OpenAI3**  
  - Type: OpenAI Embeddings node  
  - Role: compute embeddings for vector search (used internally)  

- **OpenAI Chat Model3**  
  - Type: OpenAI Chat completion node (GPT-4o)  
  - Role: generates final answer using retrieved context  

- **Window Buffer Memory1**  
  - Type: LangChain memory buffer  
  - Role: maintains session-based chat history keyed by Telegram chat ID  

- **Response**  
  - Type: Telegram node to send message  
  - Input: final generated text from RAG Agent  
  - Credentials: Telegram OAuth2  
  - Sends answer back to the user  

- **Sticky Notes**  
  - Used extensively to document workflow parts visually  
  - No runtime impact  

**Edge Cases / Potential Failures:**  
- Telegram voice file download failure or missing file_id  
- OpenAI transcription or completion API errors (rate limits, auth)  
- Vector DB connection or query failures  
- Session memory key mismanagement causing context loss  
- Input messages without text or voice fields  

---

### 2.2 New File Processing Workflow

**Overview:**  
Monitors a designated Google Drive folder for newly uploaded files. On detection, downloads the file (converted to plain text), extracts content, splits text into manageable chunks, generates embeddings using OpenAI, and inserts them into Supabase vector store with metadata.

**Nodes Involved:**  
- New File (Google Drive Trigger)  
- Set ID (Set)  
- Download File (Google Drive)  
- Extract from File  
- Recursive Character Text Splitter  
- Default Data Loader  
- Embeddings OpenAI  
- Supabase Vector Store  
- Sticky Notes  

**Node Details:**

- **New File**  
  - Type: Google Drive Trigger node  
  - Event: fileCreated in specific folder (ID: 1UHQhCrwZg_ZEzBIKv4LR_RWtAyHbxZsg)  
  - Credentials: Google Drive OAuth2  
  - Output: file metadata including file ID  

- **Set ID**  
  - Type: Set node  
  - Purpose: assigns the file ID from trigger JSON to variable "id" for downstream use  

- **Download File**  
  - Type: Google Drive node (download)  
  - Operation: download and convert Google Docs to plain text  
  - Input: file ID from Set ID node  
  - Credentials: Google Drive OAuth2  

- **Extract from File**  
  - Type: Extract text content from downloaded file  
  - Operation: extract plain text from file data  

- **Recursive Character Text Splitter**  
  - Type: Text splitter (recursive character)  
  - Config: chunk size 500 chars, overlap 100 chars  
  - Purpose: splits long document into smaller chunks for embedding  

- **Default Data Loader**  
  - Type: Document loader node  
  - Config: attaches metadata "file_id" from the Set ID node for each chunk  

- **Embeddings OpenAI**  
  - Type: OpenAI Embeddings node  
  - Purpose: generates vector embeddings for chunks  

- **Supabase Vector Store**  
  - Type: Vector store insert node  
  - Table: "documents"  
  - Credentials: Supabase API key  
  - Inserts embeddings and metadata into vector DB  

- **Sticky Notes**  
  - Mark stages: Upload, Fix Formatting, Extract Text, Update Vector DB  

**Edge Cases / Potential Failures:**  
- Google Drive trigger delay or missed events  
- File format incompatibility or extraction errors  
- OpenAI embedding API failures (auth, quota)  
- Supabase insertion errors (connectivity, schema mismatch)  
- Large files exceeding chunk size or rate limits  

---

### 2.3 Update File Processing Workflow

**Overview:**  
Triggered when an existing file in the Google Drive folder is updated. It deletes all previous vector DB entries for that file, re-downloads and processes the updated file, regenerates embeddings, and reinserts the new data to keep the knowledge base current.

**Nodes Involved:**  
- File Updated (Google Drive Trigger)  
- Delete Row(s) (Supabase)  
- Get FIle ID (Set)  
- Reformat (Limit)  
- Download File1 (Google Drive)  
- Extract from File1  
- Recursive Character Text Splitter1  
- Default Data Loader1  
- Embeddings OpenAI1  
- Supabase Vector Store1  
- Sticky Notes  

**Node Details:**

- **File Updated**  
  - Type: Google Drive Trigger node  
  - Event: fileUpdated in same folder as New File  
  - Credentials: Google Drive OAuth2  

- **Delete Row(s)**  
  - Type: Supabase node (delete operation)  
  - Filter: deletes entries where metadata->>file_id matches updated file ID  
  - Credentials: Supabase API key  

- **Get FIle ID**  
  - Type: Set node  
  - Purpose: stores updated file ID as "file_id" for processing  

- **Reformat**  
  - Type: Limit node (default 1)  
  - Purpose: limits message throughput for stability  

- **Download File1**  
  - Type: Google Drive node  
  - Downloads updated file as plain text  

- **Extract from File1**  
  - Extracts text content from downloaded file  

- **Recursive Character Text Splitter1**  
  - Splits text into chunks (chunk size 300, overlap 50)  

- **Default Data Loader1**  
  - Loads document chunks with metadata including file_id  

- **Embeddings OpenAI1**  
  - Generates embeddings for new chunks  

- **Supabase Vector Store1**  
  - Inserts new embeddings and metadata into "documents" table  

- **Sticky Notes**  
  - Document stages: Update File, Get File to Update, Delete Rows, Fix Formatting, Extract Text, Update Vector DB  

**Edge Cases / Potential Failures:**  
- Deletion filter failure causing stale data persistence  
- Download or extraction errors on updated files  
- OpenAI or Supabase API errors during reindexing  
- Race conditions if multiple updates happen rapidly  

---

## 3. Summary Table

| Node Name                   | Node Type                                  | Functional Role                         | Input Node(s)                  | Output Node(s)                   | Sticky Note                                                                                               |
|-----------------------------|--------------------------------------------|---------------------------------------|-------------------------------|---------------------------------|-----------------------------------------------------------------------------------------------------------|
| Telegram Trigger            | telegramTrigger                           | Entry point for Telegram messages     | —                             | Voice or Text                   | # RAG Chatbot                                                                                              |
| Voice or Text              | switch                                    | Routes message to voice or text path  | Telegram Trigger              | Download File2, Text            | ## Convert Message to Text                                                                                  |
| Download File2             | telegram                                  | Downloads voice file                   | Voice or Text (voice path)    | Transcribe                     |                                                                                                           |
| Transcribe                 | openAi (Whisper)                          | Transcribes audio to text              | Download File2                | RAG Agent                     |                                                                                                           |
| Text                       | set                                       | Sets text variable for text messages  | Voice or Text (text path)     | RAG Agent                     |                                                                                                           |
| RAG Agent                  | langchain.agent                           | Processes query with RAG using vector store | Text, Transcribe             | Response                      | ## RAG System                                                                                              |
| MarketingLadder            | langchain.toolVectorStore                 | Vector store search tool               | OpenAI Chat Model2, RAG Agent | RAG Agent                    |                                                                                                           |
| Supabase Vector Store3     | langchain.vectorStoreSupabase             | Supabase vector DB for search         | Embeddings OpenAI3            | MarketingLadder               |                                                                                                           |
| Embeddings OpenAI3         | langchain.embeddingsOpenAi                 | Generates embeddings for search       | —                            | Supabase Vector Store3        |                                                                                                           |
| OpenAI Chat Model3         | langchain.lmChatOpenAi                     | LLM for generating answer             | MarketingLadder               | RAG Agent                    |                                                                                                           |
| Window Buffer Memory1      | langchain.memoryBufferWindow               | Maintains session chat history        | Telegram Trigger              | RAG Agent                    |                                                                                                           |
| Response                   | telegram                                  | Sends answer back to Telegram chat    | RAG Agent                    | —                            | ## Send Output as Message                                                                                  |
| New File                   | googleDriveTrigger                        | Triggers on new file upload            | —                            | Set ID                       | # Upload New File into Knowledge Base                                                                      |
| Set ID                     | set                                       | Sets file ID variable                  | New File                     | Download File                 |                                                                                                           |
| Download File              | googleDrive                              | Downloads and converts new file        | Set ID                       | Extract from File            | ## Fix Formatting                                                                                           |
| Extract from File          | extractFromFile                          | Extracts text from downloaded file     | Download File                | Supabase Vector Store         | ## Extract File Text                                                                                        |
| Recursive Character Text Splitter | langchain.textSplitterRecursiveCharacterTextSplitter | Splits text into chunks                | Default Data Loader          | Default Data Loader           |                                                                                                           |
| Default Data Loader        | langchain.documentDefaultDataLoader       | Loads document chunks with metadata   | Recursive Character Text Splitter | Supabase Vector Store     |                                                                                                           |
| Embeddings OpenAI          | langchain.embeddingsOpenAi                 | Generates embeddings for chunks       | Default Data Loader          | Supabase Vector Store         |                                                                                                           |
| Supabase Vector Store      | langchain.vectorStoreSupabase              | Inserts embeddings into Supabase DB   | Embeddings OpenAI            | —                            | ## Update Vector Database                                                                                   |
| File Updated               | googleDriveTrigger                        | Triggers on file update in folder      | —                            | Delete Row(s)                | # Update File in Knowledge Base                                                                             |
| Delete Row(s)              | supabase                                  | Deletes existing DB entries for file  | File Updated                 | Get FIle ID                  | ## Delete Rows                                                                                              |
| Get FIle ID                | set                                       | Sets updated file ID                   | Delete Row(s)                | Reformat                     |                                                                                                           |
| Reformat                   | limit                                     | Limits data throughput                  | Get FIle ID                  | Download File1               |                                                                                                           |
| Download File1             | googleDrive                              | Downloads updated file                  | Reformat                     | Extract from File1           | ## Fix Formatting                                                                                           |
| Extract from File1         | extractFromFile                          | Extracts text                          | Download File1               | Supabase Vector Store1        | ## Extract File Text                                                                                        |
| Recursive Character Text Splitter1 | langchain.textSplitterRecursiveCharacterTextSplitter | Splits updated text into chunks        | Default Data Loader1         | Default Data Loader1          |                                                                                                           |
| Default Data Loader1       | langchain.documentDefaultDataLoader       | Loads updated chunks with metadata    | Recursive Character Text Splitter1 | Supabase Vector Store1    |                                                                                                           |
| Embeddings OpenAI1         | langchain.embeddingsOpenAi                 | Embeddings for updated chunks         | Default Data Loader1         | Supabase Vector Store1        |                                                                                                           |
| Supabase Vector Store1     | langchain.vectorStoreSupabase              | Inserts updated embeddings             | Embeddings OpenAI1           | —                            | ## Update Vector Database                                                                                   |

---

## 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Triggers on incoming "message" updates  
   - Connect Telegram OAuth2 credentials  
   - Output to a Switch node  

2. **Create Switch Node "Voice or Text"**  
   - Conditions:  
     - Output "voice": message.voice.file_id exists  
     - Output "Text": message.text exists  
   - Connect outputs: voice → Download File2, text → Set Text node  

3. **Create Telegram Node "Download File2"**  
   - Operation: Download file with fileId from message.voice.file_id  
   - Credentials: Telegram OAuth2  
   - Output to OpenAI Whisper Transcribe node  

4. **Create OpenAI Node "Transcribe"**  
   - Resource: Audio  
   - Operation: Transcribe  
   - Input: audio from Download File2  
   - Credentials: OpenAI API  
   - Output to RAG Agent  

5. **Create Set Node "Text"**  
   - Assign variable "text" = message.text  
   - Input from Switch text output  
   - Output to RAG Agent  

6. **Create LangChain Agent Node "RAG Agent"**  
   - Input: text from Transcribe or Set  
   - Configure system message to instruct searching only vector DB; do not hallucinate  
   - Add tool "MarketingLadder" (Vector Store Tool) linked to Supabase vector store  
   - Attach window buffer memory node for chat session history keyed by Telegram chat ID  
   - Output to Telegram Response node  

7. **Create LangChain Tool "MarketingLadder"**  
   - Vector store tool description about Marketing Ladder agency info  
   - Connect to Supabase Vector Store3 node  

8. **Create LangChain Supabase Vector Store Node "Supabase Vector Store3"**  
   - Mode: insert or query (for search)  
   - Table: "documents"  
   - Credentials: Supabase API key  

9. **Create OpenAI Embeddings Node "Embeddings OpenAI3"**  
   - Used internally by vector store for embedding calculations  

10. **Create OpenAI Chat Completion Node "OpenAI Chat Model3"**  
    - Model: GPT-4o (or similar)  
    - Used by RAG Agent to generate final answer  

11. **Create LangChain Memory Node "Window Buffer Memory1"**  
    - Session Key: Telegram chat id from trigger  
    - Used to maintain chat history  

12. **Create Telegram Node "Response"**  
    - Sends text message to user with output from RAG Agent  
    - Credentials: Telegram OAuth2  

---

**New File Processing**

13. **Create Google Drive Trigger "New File"**  
    - Event: fileCreated  
    - Folder to watch: Google Drive folder ID for knowledge base  
    - Credentials: Google Drive OAuth2  

14. **Create Set Node "Set ID"**  
    - Assign file id from trigger JSON to "id"  

15. **Create Google Drive Node "Download File"**  
    - Operation: download file by ID  
    - Convert Google Docs to plain text  

16. **Create Extract Text Node "Extract from File"**  
    - Extract plain text from downloaded file  

17. **Create Text Splitter Node "Recursive Character Text Splitter"**  
    - Chunk size: 500  
    - Overlap: 100  

18. **Create Document Loader Node "Default Data Loader"**  
    - Add metadata: file_id from Set ID  

19. **Create Embeddings Node "Embeddings OpenAI"**  
    - Generate embeddings for chunks  

20. **Create Supabase Vector Store Node "Supabase Vector Store"**  
    - Mode: insert  
    - Table: "documents"  
    - Credentials: Supabase API key  

---

**Update File Processing**

21. **Create Google Drive Trigger "File Updated"**  
    - Event: fileUpdated  
    - Same folder as New File  

22. **Create Supabase Node "Delete Row(s)"**  
    - Operation: delete from "documents" where metadata->>file_id matches updated file id  

23. **Create Set Node "Get FIle ID"**  
    - Store updated file ID as "file_id"  

24. **Create Limit Node "Reformat"**  
    - Limit to 1 item per execution (default)  

25. **Create Google Drive Node "Download File1"**  
    - Download updated file as plain text  

26. **Create Extract Text Node "Extract from File1"**  
    - Extract text from updated file  

27. **Create Text Splitter Node "Recursive Character Text Splitter1"**  
    - Chunk size: 300  
    - Overlap: 50  

28. **Create Document Loader Node "Default Data Loader1"**  
    - Add metadata: file_id from Get FIle ID  

29. **Create Embeddings Node "Embeddings OpenAI1"**  
    - Generate embeddings for updated chunks  

30. **Create Supabase Vector Store Node "Supabase Vector Store1"**  
    - Insert updated embeddings into "documents" table  

---

## 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                  | Context or Link                                                                                          |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| # Company RAG Knowledge Base Agent Overview: Turn your docs into AI-powered assistant using Telegram, Supabase vector search, and Google Drive auto-sync. Supports voice and text input with transcription and context retrieval. Suitable for startups, SaaS, support teams. Setup involves Telegram bot, OpenAI keys, Supabase, and Google Drive folders.                             | Sticky Note describing workflow purpose and setup                                                       |
| Hey, I'm Abdul 👋 I build growth systems for consultants & agencies. For collaboration or automation help, visit https://www.builtbyabdul.com/ or email builtbyabdul@gmail.com. Have a lovely day ;)                                                                                                                                                                                | Sticky Note with author contact and branding                                                            |
| Workflow uses OpenAI Whisper for transcription, GPT-4o for chat completions, and pgvector-enabled Supabase as vector DB. Google Drive integration automates document ingestion and updates.                                                                                                                                                                                     | Implied by node credentials and configuration                                                          |
| Can be customized by swapping Supabase for other vector DBs (Pinecone, Weaviate), or replacing Telegram with other chat platforms or web widgets. Additional logic can be added for fallback responses or escalation.                                                                                                                                                           | Sticky Note usage and description                                                                       |
| Documentation nodes (Sticky Notes) are included for clarity but have no functional role.                                                                                                                                                                                                                                                                                      | Multiple sticky notes across the workflow                                                              |

---

**Disclaimer:** The provided workflow and documentation are generated exclusively from an n8n automation workflow. The process respects all content policies and handles only legal and public data. No illegal, offensive, or protected content is included or implied.

---