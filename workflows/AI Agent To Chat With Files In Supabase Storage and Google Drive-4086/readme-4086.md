AI Agent To Chat With Files In Supabase Storage and Google Drive

https://n8nworkflows.xyz/workflows/ai-agent-to-chat-with-files-in-supabase-storage-and-google-drive-4086


# AI Agent To Chat With Files In Supabase Storage and Google Drive

---

## 1. Workflow Overview

This workflow implements an AI-powered document management and interaction system that integrates Supabase Storage, Google Drive, and an AI agent within n8n. It enables users to upload, parse, and query documents stored across these platforms, automating file ingestion, content extraction, vectorization, and AI-driven conversational querying.

The workflow logically separates into four main blocks:

- **1.1 File Collection and Deduplication from Supabase Storage:**  
  Retrieves all files from Supabase storage, compares them against existing records in the database to avoid duplicate processing, and creates new file records as needed.

- **1.2 File Processing and Parsing via LlamaParse:**  
  Downloads files from Supabase or Google Drive, uploads them to LlamaParse API for parsing, monitors parsing job status, retrieves parsed content, and processes the text for embedding and storage.

- **1.3 Google Drive Integration and Monitoring:**  
  Monitors a specific Google Drive folder for newly created or updated files, downloads these files, removes old document records linked to them, and triggers the parsing and vectorization process to keep the database up-to-date.

- **1.4 AI Agent Interaction and Query Handling:**  
  Sets up a webhook to receive chat messages, manages session memory, retrieves relevant vectorized documents from Supabase, and uses an AI agent (powered by OpenAI GPT models) to answer user queries based on the stored knowledge base.

---

## 2. Block-by-Block Analysis

### 2.1 File Collection and Deduplication from Supabase Storage

**Overview:**  
This block fetches all files stored in the Supabase private bucket, compares them against existing file records in the Supabase database to prevent duplicate processing, and creates new file records for any files not yet recorded.

**Nodes Involved:**  
- When clicking ‘Test workflow’ (Manual Trigger)  
- Get All Files (Supabase)  
- Aggregate  
- Get All files (HTTP Request to Supabase Storage API)  
- Loop Over Items (Split in Batches)  
- If (Conditional check)  
- Create File record2 (Supabase)  
- Download (HTTP Request to Supabase Storage)  

**Node Details:**  

- **When clicking ‘Test workflow’**  
  - *Type:* Manual Trigger  
  - *Role:* Entry point for manual execution/testing.  
  - *Config:* Disabled by default.  
  - *Connections:* Triggers Get All Files node.

- **Get All Files**  
  - *Type:* Supabase node (getAll operation)  
  - *Role:* Retrieves all existing file records from 'files' table in Supabase.  
  - *Credentials:* Supabase API credentials required.  
  - *Output:* List of file records.

- **Aggregate**  
  - *Type:* Aggregate node  
  - *Role:* Aggregates all items from previous node into a single array for easier lookup.  
  - *Output:* Aggregated data array.

- **Get All files**  
  - *Type:* HTTP Request  
  - *Role:* Calls Supabase Storage API to list objects in the private bucket (limit 100, sorted by name ascending).  
  - *Authentication:* Uses Supabase API credentials.  
  - *Key Expression:* JSON body includes prefix, limit, offset, and sorting parameters.  
  - *Output:* List of files currently in storage.

- **Loop Over Items**  
  - *Type:* Split in Batches (batchSize=1)  
  - *Role:* Processes files one by one from the storage listing.  
  - *Output:* Single file item per iteration.

- **If**  
  - *Type:* Conditional (version 2.2)  
  - *Role:* Checks if the current file from storage is not already present in the database records and is not a placeholder file (name not ".emptyFolderPlaceholder").  
  - *Expression:* Uses aggregated file data to check for existence by matching storage_id.  
  - *Outputs:*  
    - True branch: File is new and should be processed.  
    - False branch: File already processed or placeholder; skips further processing.

- **Create File record2**  
  - *Type:* Supabase node (insert operation)  
  - *Role:* Inserts new file record into 'files' table with 'name' and 'storage_id' fields.  
  - *Input:* File name and id from Loop Over Items.  
  - *Credentials:* Supabase API credentials.

- **Download**  
  - *Type:* HTTP Request  
  - *Role:* Downloads the actual file from Supabase storage for further processing.  
  - *Authentication:* Supabase API credentials.  
  - *URL:* Constructed dynamically using file name from Loop Over Items.  
  - *Output:* Binary file data.

**Edge Cases & Failure Types:**  
- API authentication failures due to invalid or expired Supabase credentials.  
- Empty or malformed file lists from Supabase storage.  
- Network timeouts during HTTP requests.  
- Handling files with same names but different IDs.  
- Placeholder files ignored by design.

---

### 2.2 File Processing and Parsing via LlamaParse

**Overview:**  
This block handles file parsing using the LlamaParse API. It uploads files (from Supabase or Google Drive), polls job status until completion, retrieves parsed text data, splits text into chunks, creates embeddings via OpenAI, and inserts the processed documents into Supabase vector store.

**Nodes Involved:**  
- Upload File / Upload File1 (HTTP Request)  
- Get Processing Status / Get Processing Status1 (HTTP Request)  
- Is Job Ready? / Is Job Ready?1 (Switch)  
- Wait to stay within service limits / Wait to stay within service limits1 (Wait)  
- Stop and Error / Stop and Error1 (Stop and Error)  
- Get Parsed Data / Get Parsed Data1 (HTTP Request)  
- Set Text / Set Text3 (Set)  
- Recursive Character Text Splitter / Recursive Character Text Splitter1 (Text Splitter)  
- Default Data Loader / Default Data Loader1 (LangChain Document Loader)  
- Embeddings OpenAI / Embeddings OpenAI3 (LangChain Embeddings)  
- Insert into Supabase Vectorstore / Insert into Supabase Vectorstore1 (LangChain Vector Store Supabase)  
- Create File record1 (Supabase)  

**Node Details:**  

- **Upload File / Upload File1**  
  - *Type:* HTTP Request (multipart/form-data POST)  
  - *Role:* Uploads the file binary to LlamaParse API for parsing.  
  - *Headers:* Authorization via Bearer token (LlamaParse API key).  
  - *Parameters:* File binary in form data, with "do_not_cache" flag set true.  
  - *Output:* Returns a job ID for parsing.

- **Get Processing Status / Get Processing Status1**  
  - *Type:* HTTP Request  
  - *Role:* Polls LlamaParse API job status endpoint using job ID.  
  - *Error Handling:* Continues on error to allow retries.  
  - *Headers:* Authorization as above.

- **Is Job Ready? / Is Job Ready?1**  
  - *Type:* Switch node  
  - *Role:* Branches logic based on job status: PENDING, SUCCESS, ERROR, CANCELED.  
  - *Outputs:*  
    - PENDING: Loop back to wait.  
    - SUCCESS: Proceed to get parsed data.  
    - ERROR/CANCELED: Stop workflow with error.

- **Wait to stay within service limits / Wait to stay within service limits1**  
  - *Type:* Wait node  
  - *Role:* Pauses execution (7 seconds) to avoid hitting API rate limits.

- **Stop and Error / Stop and Error1**  
  - *Type:* Stop and Error node  
  - *Role:* Halts workflow with error message if parsing fails.

- **Get Parsed Data / Get Parsed Data1**  
  - *Type:* HTTP Request  
  - *Role:* Retrieves parsed document content in markdown format from LlamaParse API.  
  - *Authentication:* Same as above.

- **Set Text / Set Text3**  
  - *Type:* Set node  
  - *Role:* Extracts and sets parsed markdown text to a 'text' field for further processing.

- **Recursive Character Text Splitter / Recursive Character Text Splitter1**  
  - *Type:* LangChain Text Splitter  
  - *Role:* Splits long texts into chunks with 500 characters and 200 overlap to prepare for embedding.

- **Default Data Loader / Default Data Loader1**  
  - *Type:* LangChain Document Loader  
  - *Role:* Converts split text chunks into LangChain document objects with metadata including file IDs.

- **Embeddings OpenAI / Embeddings OpenAI3**  
  - *Type:* LangChain Embeddings using OpenAI  
  - *Role:* Creates embeddings (vector representations) of document chunks using OpenAI embedding models (text-embedding-3-small).  
  - *Credentials:* OpenAI API key required.

- **Insert into Supabase Vectorstore / Insert into Supabase Vectorstore1**  
  - *Type:* LangChain Vector Store Supabase node  
  - *Role:* Inserts document embeddings and metadata into Supabase 'documents' table for vector search.  
  - *Credentials:* Supabase API credentials.

- **Create File record1**  
  - *Type:* Supabase insert node  
  - *Role:* Inserts new file record with fields 'name' and 'google_drive_id' after processing a Google Drive file.

**Edge Cases & Failure Types:**  
- LlamaParse API failures or timeouts.  
- Parsing jobs stuck in PENDING or returning ERROR/CANCELED status.  
- Rate limit exceeding for LlamaParse API (mitigated by wait nodes).  
- Missing or malformed parsed data responses.  
- OpenAI API credential issues or rate limits.  
- Supabase vector store write failures (e.g., schema mismatch, connection errors).

---

### 2.3 Google Drive Integration and Monitoring

**Overview:**  
This block monitors a designated Google Drive folder for new or updated files, downloads them (converting Google Docs/Sheets/Slides to PDF), deletes old related document records, uploads files for parsing, and processes parsed content to update the Supabase database and vector store.

**Nodes Involved:**  
- File Created (Google Drive Trigger)  
- File Updated (Google Drive Trigger)  
- Set File ID (Set)  
- Delete Old Doc Rows (Supabase)  
- Download File (Google Drive)  
- Upload File1 (HTTP Request to LlamaParse)  
- Get Processing Status1 (HTTP Request)  
- Is Job Ready?1 (Switch)  
- Wait to stay within service limits1 (Wait)  
- Stop and Error1 (Stop and Error)  
- Get Parsed Data1 (HTTP Request)  
- Set Text3 (Set)  
- Create File record1 (Supabase)  
- Recursive Character Text Splitter1  
- Default Data Loader1  
- Embeddings OpenAI3  
- Insert into Supabase Vectorstore1  

**Node Details:**  

- **File Created / File Updated**  
  - *Type:* Google Drive Trigger  
  - *Role:* Watches a specific Google Drive folder for new or modified files, triggering workflow execution every minute.  
  - *Folder:* Folder ID configured explicitly.  
  - *Authentication:* Google Drive OAuth2 credentials.  
  - *Output:* File metadata including ID and extension.

- **Set File ID**  
  - *Type:* Set node  
  - *Role:* Extracts and assigns 'file_id' and file extension from trigger data for downstream use.

- **Delete Old Doc Rows**  
  - *Type:* Supabase delete operation  
  - *Role:* Deletes old document records from 'documents' table where metadata matches the current Google Drive file ID to avoid duplication.

- **Download File**  
  - *Type:* Google Drive node (download operation)  
  - *Role:* Downloads the actual file. Converts Google Docs/Sheets/Slides to PDF before download for standardized processing.

- **Upload File1**  
  - *As described in Block 2.2.*

- **Get Processing Status1 / Is Job Ready?1 / Wait to stay within service limits1 / Stop and Error1 / Get Parsed Data1 / Set Text3 / Recursive Character Text Splitter1 / Default Data Loader1 / Embeddings OpenAI3 / Insert into Supabase Vectorstore1 / Create File record1**  
  - *As described in Block 2.2.*  
  - This sequence processes the downloaded Google Drive file similarly to Supabase files to update the database and vector store.

**Edge Cases & Failure Types:**  
- Google Drive API auth failures or token expiry.  
- Folder ID misconfiguration causing no file detection.  
- Large files or unsupported file types causing download or conversion errors.  
- Failure to delete old records leading to stale data.  
- Parsing and embedding errors as in Block 2.2.

---

### 2.4 AI Agent Interaction and Query Handling

**Overview:**  
This block enables chat-based interaction with users via a webhook, maintaining conversational context via session memory, retrieving relevant documents from Supabase vector store based on embeddings, and generating AI-powered responses using OpenAI GPT models.

**Nodes Involved:**  
- Webhook  
- Edit Fields1  
- Edit Fields  
- Merge  
- AI Agent1  
- OpenAI Chat Model  
- Simple Memory  
- Supabase Vector Store  
- When chat message received (LangChain chatTrigger)  

**Node Details:**  

- **Webhook**  
  - *Type:* HTTP Webhook (POST)  
  - *Role:* Entry point for receiving chat messages with session ID and message content.  
  - *Path:* Fixed webhook path configured.  
  - *Response Mode:* Last node output.

- **Edit Fields1**  
  - *Type:* Set node  
  - *Role:* Extracts 'session_id' and 'message' fields from webhook body for processing.

- **Edit Fields**  
  - *Type:* Set node  
  - *Role:* Extracts 'session_id' and 'message' from LangChain chatTrigger node (alternative chat entry).  

- **Merge**  
  - *Type:* Merge node  
  - *Role:* Combines data from webhook and chat trigger to unify input format for AI agent.

- **AI Agent1**  
  - *Type:* LangChain Agent  
  - *Role:* Core AI agent that processes user messages using OpenAI GPT model and retrieved knowledge base.  
  - *System Message:* Instructed to always use the knowledge base to respond.  
  - *Input:* User message text.  
  - *Connections:* Uses OpenAI Chat Model for language model, Simple Memory for session context, and Supabase Vector Store as a knowledge tool.

- **OpenAI Chat Model**  
  - *Type:* LangChain Chat Model Node  
  - *Role:* Provides GPT-4o-mini language model for conversational AI.  
  - *Credentials:* OpenAI API key required.

- **Simple Memory**  
  - *Type:* LangChain Memory Buffer Window  
  - *Role:* Maintains chat session context using session_id as key, enabling context continuity.

- **Supabase Vector Store**  
  - *Type:* LangChain Vector Store (retrieve-as-tool mode)  
  - *Role:* Retrieves relevant documents from Supabase vector store to aid AI agent in answering queries.  
  - *Credentials:* Supabase API credentials.

- **When chat message received**  
  - *Type:* LangChain chatTrigger node  
  - *Role:* Alternative trigger for chat messages, integrated with Edit Fields and Merge.

**Edge Cases & Failure Types:**  
- Invalid or missing session IDs causing memory retrieval issues.  
- OpenAI API errors or rate limits.  
- Supabase vector store connection failures.  
- Webhook request malformations or unauthorized access.  
- AI agent generating irrelevant or incomplete answers if knowledge base is insufficient.

---

## 3. Summary Table

| Node Name                 | Node Type                                  | Functional Role                                  | Input Node(s)                      | Output Node(s)                            | Sticky Note                                                                                                  |
|---------------------------|--------------------------------------------|-------------------------------------------------|----------------------------------|------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger                            | Manual start for testing                         | -                                | Get All Files                            |                                                                                                              |
| Get All Files             | Supabase getAll                            | Retrieve all file records from DB                | When clicking ‘Test workflow’    | Aggregate                               | ### Replace credentials.                                                                                      |
| Aggregate                 | Aggregate                                  | Aggregate file records                            | Get All Files                    | Get All files                            |                                                                                                              |
| Get All files             | HTTP Request                              | List all files in Supabase storage bucket        | Aggregate                       | Loop Over Items                         | ### Replace Storage name, database ID and credentials.                                                        |
| Loop Over Items           | Split In Batches                           | Process files one by one                          | Get All files                   | If                                      |                                                                                                              |
| If                        | Conditional                               | Check if file is new and not placeholder         | Loop Over Items                 | Download (true branch), skip (false)   |                                                                                                              |
| Download                  | HTTP Request                              | Download file from Supabase storage               | If                             | If1                                     | ### Replace Storage name, database ID and credentials.                                                        |
| If1                       | Conditional                               | Check if parsed data exists                        | Download                       | Upload File (true), Set Text (false)   |                                                                                                              |
| Upload File               | HTTP Request                              | Upload file to LlamaParse API                      | If1                            | Get Processing Status                    | ### Add Llamaparse Header auth Authorization: Bearer <api_key>                                               |
| Get Processing Status     | HTTP Request                              | Poll parsing job status                            | Upload File                    | Is Job Ready?                            |                                                                                                              |
| Is Job Ready?             | Switch                                    | Branch based on job status                         | Get Processing Status          | Wait / Stop and Error / Get Parsed Data |                                                                                                              |
| Wait to stay within service limits | Wait                                 | Pause for API rate limits                         | Is Job Ready? (PENDING)         | Get Processing Status                    |                                                                                                              |
| Stop and Error            | Stop and Error                            | Stop workflow on parsing error                     | Is Job Ready? (ERROR/CANCELED) | -                                       |                                                                                                              |
| Get Parsed Data           | HTTP Request                              | Retrieve parsed document text                      | Is Job Ready? (SUCCESS)         | Set Text                                |                                                                                                              |
| Set Text                  | Set                                       | Extract text from parsed data                      | Get Parsed Data                | Merge Text                              |                                                                                                              |
| Merge Text                | Merge                                     | Combine parsed text with other text                | Set Text, Set Text1             | Create File record2                      |                                                                                                              |
| Create File record2       | Supabase insert                           | Insert new file record                              | Merge Text                    | Insert into Supabase Vectorstore         | ### Replace credentials.                                                                                      |
| Insert into Supabase Vectorstore | LangChain Vector Store Supabase           | Insert embeddings into Supabase vector store       | Default Data Loader, Create File record2 | Loop Over Items (next batch)           | ### Replace credentials.                                                                                      |
| Default Data Loader       | LangChain Document Loader                  | Load document data for vector storage              | Recursive Character Text Splitter | Insert into Supabase Vectorstore        |                                                                                                              |
| Recursive Character Text Splitter | LangChain Text Splitter                  | Split text into chunks                              | Default Data Loader             | Default Data Loader                      |                                                                                                              |
| File Created              | Google Drive Trigger                      | Trigger on new file creation in Google Drive folder | -                              | Set File ID                             | ### Replace credentials.                                                                                      |
| File Updated              | Google Drive Trigger                      | Trigger on file updates in Google Drive folder      | -                              | Set File ID                             |                                                                                                              |
| Set File ID               | Set                                       | Extract file ID and extension                       | File Created, File Updated     | Delete Old Doc Rows                      |                                                                                                              |
| Delete Old Doc Rows       | Supabase delete                           | Delete old document records related to file         | Set File ID                   | Download File                           | ### Replace credentials.                                                                                      |
| Download File             | Google Drive                              | Download file from Google Drive                      | Delete Old Doc Rows            | Upload File1                           |                                                                                                              |
| Upload File1              | HTTP Request                              | Upload Google Drive file to LlamaParse API          | Download File                 | Get Processing Status1                  | ### Add Llamaparse Header auth Authorization: Bearer <api_key>                                               |
| Get Processing Status1    | HTTP Request                              | Poll parsing job status for Google Drive file       | Upload File1                  | Is Job Ready?1                         |                                                                                                              |
| Is Job Ready?1            | Switch                                    | Branch based on parsing job status                   | Get Processing Status1         | Wait / Stop and Error1 / Get Parsed Data1 |                                                                                                              |
| Wait to stay within service limits1 | Wait                                 | Pause for API rate limits                           | Is Job Ready?1 (PENDING)        | Get Processing Status1                  |                                                                                                              |
| Stop and Error1           | Stop and Error                            | Stop workflow on parsing error                        | Is Job Ready?1 (ERROR/CANCELED) | -                                       |                                                                                                              |
| Get Parsed Data1          | HTTP Request                              | Retrieve parsed text for Google Drive file           | Is Job Ready?1 (SUCCESS)        | Set Text3                              |                                                                                                              |
| Set Text3                 | Set                                       | Extract text field from parsed data                   | Get Parsed Data1              | Create File record1                     |                                                                                                              |
| Create File record1       | Supabase insert                           | Insert new file record for Google Drive file          | Set Text3                    | Insert into Supabase Vectorstore1       | ### Replace credentials.                                                                                      |
| Recursive Character Text Splitter1 | LangChain Text Splitter                  | Split parsed text into chunks                          | Default Data Loader1           | Default Data Loader1                    |                                                                                                              |
| Default Data Loader1      | LangChain Document Loader                  | Load document chunks for vector storage                | Recursive Character Text Splitter1 | Insert into Supabase Vectorstore1      |                                                                                                              |
| Embeddings OpenAI3        | LangChain Embeddings OpenAI                | Create embeddings for Google Drive file text           | Default Data Loader1           | Insert into Supabase Vectorstore1      | ### Replace credentials.                                                                                      |
| Insert into Supabase Vectorstore1 | LangChain Vector Store Supabase           | Insert embeddings into vector store for Google Drive files | Embeddings OpenAI3            | -                                      | ### Replace credentials.                                                                                      |
| Webhook                   | HTTP Webhook                              | Receive chat messages with session context             | -                            | Edit Fields1                           |                                                                                                              |
| Edit Fields1              | Set                                       | Extract session ID and message from webhook body       | Webhook                      | Merge                                  |                                                                                                              |
| Edit Fields               | Set                                       | Extract session ID and message from chat trigger        | When chat message received    | Merge                                  |                                                                                                              |
| Merge                     | Merge                                     | Combine message sources for AI agent                    | Edit Fields, Edit Fields1     | AI Agent1                             |                                                                                                              |
| AI Agent1                 | LangChain Agent                           | AI conversational agent using knowledge base           | Merge                        | -                                      |                                                                                                              |
| OpenAI Chat Model         | LangChain Chat Model OpenAI               | Language model for AI responses                          | AI Agent1                    | AI Agent1 (ai_languageModel)           |                                                                                                              |
| Simple Memory             | LangChain Memory Buffer Window             | Maintains session context for chat                       | AI Agent1                    | AI Agent1 (ai_memory)                   |                                                                                                              |
| Supabase Vector Store     | LangChain Vector Store Supabase (retrieve) | Retrieves relevant documents for AI agent                | AI Agent1                    | AI Agent1 (ai_tool)                     |                                                                                                              |
| When chat message received | LangChain chatTrigger                     | Alternative chat message trigger                          | -                            | Edit Fields                            |                                                                                                              |

---

## 4. Reproducing the Workflow from Scratch

### Block 1: File Collection and Deduplication from Supabase Storage

1. **Create a Manual Trigger node** named "When clicking ‘Test workflow’" (disabled by default).  
2. **Add a Supabase node** named "Get All Files": configure to use your Supabase credentials, set operation to getAll on the 'files' table.  
3. **Add an Aggregate node** to combine all items from "Get All Files".  
4. **Add an HTTP Request node** named "Get All files":  
   - Method: POST  
   - URL: `https://<project_id>.supabase.co/storage/v1/object/list/private` (replace `<project_id>` accordingly)  
   - Authentication: Supabase API credentials  
   - Body (JSON):  
     ```json
     {
       "prefix": "",
       "limit": 100,
       "offset": 0,
       "sortBy": {
         "column": "name",
         "order": "asc"
       }
     }
     ```  
5. **Add a Split In Batches node** named "Loop Over Items" with batchSize=1. Connect "Get All files" to this node.  
6. **Add an If node**:  
   - Condition: Check if current file's storage_id does not exist in aggregated database records AND file name is not ".emptyFolderPlaceholder" (use expression to compare).  
7. **On True branch:**  
   - Add HTTP Request node "Download": URL dynamically constructed as `https://<project_id>.supabase.co/storage/v1/object/private/{{ $json.name }}`, use Supabase API credentials.  
   - Add another If node ("If1") after "Download" to check if parsed data exists.  
   - If true, continue to "Upload File" node (see below). If false, set text and proceed with vector storage.  
8. **On False branch:** skip or end processing for that file.  
9. **Add Supabase node "Create File record2"** to insert new file data into 'files' table with fields 'name' and 'storage_id'.  
10. Connect "Create File record2" to "Insert into Supabase Vectorstore" node (see Block 2).

### Block 2: File Processing and Parsing via LlamaParse

1. **Add HTTP Request node "Upload File"**:  
   - Method: POST  
   - URL: `https://api.cloud.llamaindex.ai/api/parsing/upload`  
   - Authentication: HTTP Header Auth with Bearer token (LlamaParse API key)  
   - Content-Type: multipart/form-data  
   - Body: file binary from previous node, parameter name "file", and "do_not_cache" set to true.  
2. **Add HTTP Request node "Get Processing Status"** to poll job status using job ID from "Upload File".  
3. **Add Switch node "Is Job Ready?"** with outputs for PENDING, SUCCESS, ERROR, CANCELED based on job status field.  
   - PENDING: Connect to a Wait node "Wait to stay within service limits" (7 seconds delay), which loops back to "Get Processing Status".  
   - SUCCESS: Connect to "Get Parsed Data" node.  
   - ERROR or CANCELED: Connect to "Stop and Error" node with error message.  
4. **Add HTTP Request node "Get Parsed Data"** to retrieve parsed markdown text.  
5. Add a Set node "Set Text" to extract the markdown text into a 'text' field.  
6. Add a LangChain "Recursive Character Text Splitter" node to split text into chunks (chunkSize=500, chunkOverlap=200).  
7. Add LangChain "Default Data Loader" node, configure metadata to include file_id from context.  
8. Add LangChain "Embeddings OpenAI" node to embed text chunks (model: text-embedding-3-small), connect your OpenAI credentials.  
9. Add LangChain "Insert into Supabase Vectorstore" node to insert embeddings into 'documents' table in Supabase, connecting your Supabase credentials.  
10. For Google Drive files, replicate similar steps using "Upload File1", "Get Processing Status1", etc., as in Block 3.

### Block 3: Google Drive Integration and Monitoring

1. **Add Google Drive Trigger nodes** "File Created" and "File Updated":  
   - Configure to watch specific folder ID in Google Drive.  
   - Use Google Drive OAuth2 credentials.  
2. **Add Set node "Set File ID"** to extract file_id and file extension from trigger data.  
3. **Add Supabase node "Delete Old Doc Rows"** to delete document records where metadata matches the Google Drive file_id.  
4. **Add Google Drive node "Download File"**:  
   - Operation: download  
   - Enable Google file conversion to PDF for Docs, Sheets, Slides, Drawings.  
5. **Connect to LlamaParse upload and parsing flow** (Upload File1, Get Processing Status1, etc.) as described in Block 2.  
6. **Add Supabase node "Create File record1"** to insert new file record with 'name' and 'google_drive_id'.  
7. Continue with recursive text splitting, default data loader, embeddings, and vector store insertion as in Block 2.

### Block 4: AI Agent Interaction and Query Handling

1. **Add HTTP Webhook node "Webhook"**:  
   - Method: POST  
   - Path: unique webhook path  
   - Response Mode: Last node  
2. **Add Set node "Edit Fields1"**: extract 'session_id' and 'message' from webhook request body.  
3. **Add LangChain chatTrigger node "When chat message received"** as an alternative starting point.  
4. **Add Set node "Edit Fields"**: extract 'session_id' and 'message' from chatTrigger node.  
5. **Add Merge node "Merge"** to combine outputs from both paths into unified format.  
6. **Add LangChain Agent node "AI Agent1"**:  
   - Configure system message instructing to always use knowledge base.  
   - Input message from merged node.  
7. **Add LangChain Chat Model "OpenAI Chat Model"**: connect to AI Agent node as language model, use OpenAI GPT-4o-mini.  
8. **Add LangChain Memory Buffer Window "Simple Memory"**: keyed by session_id for session continuity, connected to AI Agent node.  
9. **Add LangChain Vector Store Supabase node "Supabase Vector Store"**: configured for 'retrieve-as-tool' mode, to retrieve documents to assist AI agent.  
10. Connect all nodes accordingly to flow user messages through memory, vector store retrieval, and language model to produce chat responses.

### Credential Setup

- **Supabase API Credentials:** Required for all Supabase nodes and HTTP requests to Supabase storage.  
- **OpenAI API Credentials:** Required for embedding and chat language model nodes.  
- **Google Drive OAuth2:** Required for Drive triggers and download nodes.  
- **LlamaParse API Key:** Set as HTTP Header Auth credential for parsing API calls.

---

## 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                   | Context or Link                                               |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| Video guide illustrating the entire process of building the AI agent with Supabase and Google Drive in n8n workflows.                                                                                                                                                                                                                                          | [YouTube Video](https://youtu.be/NB6LhvObiL4)                 |
| Workflow designed for developers, data scientists, and business users to automate document management and enable AI-powered interactions.                                                                                                                                                                                                                     | Description at start of workflow                               |
| Replace all placeholder values such as Supabase project ID, storage bucket name, and all credentials before running workflow.                                                                                                                                                                                                                                  | Sticky notes across workflow nodes                             |
| Use private buckets in Supabase storage to ensure secure file handling.                                                                                                                                                                                                                                                                                         | Setup instructions                                             |
| Prepare Supabase database with 'files' and 'documents' tables; enable vector search capabilities as needed.                                                                                                                                                                                                                                                    | Setup instructions                                             |
| LlamaParse API requires API key in HTTP Header Authorization: Bearer <api_key>.                                                                                                                                                                                                                                                                                 | Sticky notes on Upload File nodes                              |
| AI Agent configured to use GPT-4o-mini model and maintain session context through Simple Memory node.                                                                                                                                                                                                                                                          | AI Agent node configuration                                   |
| Ensure Google Drive folder ID is correct and OAuth2 credentials are valid for Drive triggers to work.                                                                                                                                                                                                                                                           | Google Drive Trigger nodes                                     |
| This workflow automates file ingestion, parsing, vectorization, and AI conversational querying to streamline document handling and knowledge retrieval.                                                                                                                                                                                                        | Overall workflow summary                                       |
| Project credits: Made by Mark Shcherbakov from community 5minAI.                                                                                                                                                                                                                                                                                                | Sticky Note with branding and author info                      |

---

**Disclaimer:**  
The provided text originates exclusively from an automated n8n workflow. This content fully complies with current content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.

---