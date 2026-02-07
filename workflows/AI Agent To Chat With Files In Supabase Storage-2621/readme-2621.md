AI Agent To Chat With Files In Supabase Storage

https://n8nworkflows.xyz/workflows/ai-agent-to-chat-with-files-in-supabase-storage-2621


# AI Agent To Chat With Files In Supabase Storage

### 1. Workflow Overview

This n8n workflow, **"AI Agent To Chat With Files In Supabase Storage,"** enables users to interact conversationally with documents stored in Supabase storage by leveraging AI-powered vector search and chat capabilities. It is designed for users managing large collections of documents—such as researchers, analysts, or business owners—who require efficient and contextual retrieval of information from text-heavy files including PDFs and plain text.

The workflow logically divides into two major functional blocks:

**1.1 Document Ingestion and Vectorization**  
- Fetches the list of files stored in a Supabase bucket  
- Filters out already processed files and empty folder placeholders  
- Downloads new files and extracts content based on file type (PDF or text)  
- Splits large text content into manageable chunks  
- Creates vector embeddings of text chunks using OpenAI embeddings  
- Stores vectorized data into a Supabase vector store for future querying  

**1.2 AI Chatbot Interaction**  
- Listens for user chat messages via webhook trigger  
- Queries the Supabase vector store for relevant document chunks based on user input  
- Uses an AI agent combining OpenAI chat models and vector store tools to generate context-aware responses  
- Returns conversational answers referencing the uploaded documents  

This modular design supports easy extension and maintenance, and it integrates Supabase securely with AI capabilities through OpenAI, ensuring that users can query their document repository without external services like Google Drive.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Document Ingestion and Vectorization

**Overview:**  
This block automates file retrieval from Supabase storage, filters and processes new files, extracts content, chunks it, generates vector embeddings, and stores them in a Supabase vector store.

**Nodes Involved:**  
- When clicking ‘Test workflow’ (Manual Trigger)  
- Get All Files (Supabase)  
- Aggregate (Aggregate)  
- Get All files (HTTP Request to Supabase Storage)  
- Loop Over Items (Split In Batches)  
- If (Conditional Check)  
- Download (HTTP Request)  
- Switch (File Type Routing)  
- Extract Document PDF (Extract from File)  
- Merge (Merge Data)  
- Default Data Loader (Langchain Document Loader)  
- Recursive Character Text Splitter (Text Splitter)  
- Embeddings OpenAI (Langchain Embeddings)  
- Create File record2 (Supabase Insert)  
- Insert into Supabase Vectorstore (Langchain Vector Store)  
- Sticky Notes (for setup reminders)  

**Node Details:**

- **When clicking ‘Test workflow’**  
  - Type: Manual Trigger  
  - Role: Entry point to manually start file ingestion  
  - Config: No special parameters  
  - Input: None  
  - Output: Triggers "Get All Files"  
  - Failures: None expected  

- **Get All Files**  
  - Type: Supabase node (Get All operation)  
  - Role: Retrieve all existing file records from the Supabase `files` table  
  - Config: Table ID set to "files"  
  - Input: Trigger from manual node  
  - Output: Outputs all file records for duplicate checking  
  - Failures: Potential auth errors if credentials invalid  

- **Aggregate**  
  - Type: Aggregate node  
  - Role: Aggregate all items from "Get All Files" into a single data array for easy comparison  
  - Config: Aggregate all item data  
  - Input: Output from "Get All Files"  
  - Output: Aggregated list of existing files  
  - Failures: None expected  

- **Get All files**  
  - Type: HTTP Request  
  - Role: Fetch the list of files from Supabase Storage bucket (private) via Supabase Storage API  
  - Config: POST request with JSON body to list objects with limit 100, offset 0, sorted by name ascending  
  - Credentials: Supabase API credentials for access  
  - Input: Aggregated file list from previous step  
  - Output: List of files currently in storage  
  - Failures: API errors, network timeouts, malformed JSON response  
  - Sticky Note: Reminder to replace storage name, database ID, and credentials  

- **Loop Over Items**  
  - Type: Split in Batches  
  - Role: Process one file at a time from the list of files fetched from storage  
  - Config: Batch size = 1  
  - Input: List of files from "Get All files"  
  - Output: Individual file data for processing  
  - Failures: None expected  

- **If**  
  - Type: Conditional Node  
  - Role: Filter out files already processed or placeholders named ".emptyFolderPlaceholder"  
  - Config: Two conditions:  
    1. File ID is *not* found in existing files list  
    2. File name is *not* ".emptyFolderPlaceholder"  
  - Input: Current file from "Loop Over Items" and existing files data  
  - Output: True branch proceeds to download, False branch skips  
  - Failures: Expression evaluation errors if data missing or malformed  

- **Download**  
  - Type: HTTP Request  
  - Role: Download file content from Supabase Storage using file name and private access  
  - Config: GET request to Supabase Storage URL with file name parameter  
  - Credentials: Supabase API credentials  
  - Input: File info from "If" node (true branch)  
  - Output: Binary file data for processing  
  - Failures: Download failures, auth errors, timeouts  
  - Sticky Note: Reminder to replace storage name, database ID, and credentials  

- **Switch**  
  - Type: Switch node  
  - Role: Route files by type for processing: PDF or text (default to text if extension missing)  
  - Config: Checks binary data file extension to select output path "pdf" or "txt"  
  - Input: Downloaded file binary data  
  - Output:  
    - PDF files to "Extract Document PDF"  
    - Text/default files to "Merge" (merge text data)  
  - Failures: File extension missing or unexpected types  

- **Extract Document PDF**  
  - Type: Extract from File  
  - Role: Extract text content from PDF files  
  - Config: Operation set to "pdf"  
  - Input: PDF binary from "Switch"  
  - Output: Extracted text content JSON  
  - Failures: PDF extract errors if file corrupted or unsupported format  

- **Merge**  
  - Type: Merge node  
  - Role: Combine extracted PDF content or direct text content for uniform processing  
  - Config: Default merge mode (append)  
  - Input: Text from "Switch" (txt branch) or "Extract Document PDF" (pdf branch)  
  - Output: Unified text content for further processing  

- **Default Data Loader**  
  - Type: Langchain Document Default Data Loader  
  - Role: Load and prepare document text with metadata for chunking and embedding  
  - Config:  
    - Uses expression to load either `data` or `text` field from "Merge" node  
    - Metadata includes file_id extracted from JSON property `id`  
  - Input: Merged text content and file metadata  
  - Output: Document object with metadata for chunking  
  - Failures: Expression errors if expected fields missing  

- **Recursive Character Text Splitter**  
  - Type: Langchain Text Splitter  
  - Role: Split large text into chunks of 500 characters with 200 character overlap  
  - Config: Chunk size 500, overlap 200  
  - Input: Document from "Default Data Loader"  
  - Output: Array of text chunks for embedding  

- **Embeddings OpenAI**  
  - Type: Langchain Embeddings (OpenAI)  
  - Role: Generate vector embeddings for text chunks using OpenAI embedding model  
  - Config: Model "text-embedding-3-small"  
  - Credentials: OpenAI API credentials  
  - Input: Chunks from "Recursive Character Text Splitter"  
  - Output: Embedding vectors with metadata  

- **Create File record2**  
  - Type: Supabase Insert  
  - Role: Insert new file record metadata into Supabase `files` table to mark as processed  
  - Config: Fields:  
    - name: file name  
    - storage_id: file storage id  
  - Credentials: Supabase API credentials  
  - Input: File info from "Loop Over Items"  
  - Output: Confirmation of record creation  

- **Insert into Supabase Vectorstore**  
  - Type: Langchain Vector Store Supabase  
  - Role: Insert generated embeddings into Supabase vector store named "documents"  
  - Config: Insert mode, queryName "match_documents", table "documents"  
  - Credentials: Supabase API credentials  
  - Input: Embeddings from "Embeddings OpenAI" and file record confirmation  
  - Output: Vector store insertion confirmation  
  - Failures: DB insertion errors, credential issues  

- **Sticky Notes**  
  - Provide reminders to replace credentials, storage names, and database IDs as per user environment  

---

#### 2.2 AI Chatbot Interaction

**Overview:**  
This block handles conversational interactions with users, querying the vector store for relevant document information and generating AI-based chat responses.

**Nodes Involved:**  
- When chat message received (Langchain Chat Trigger)  
- AI Agent (Langchain Agent)  
- OpenAI Chat Model1 (Langchain Chat Model)  
- Vector Store Tool1 (Langchain Tool Vector Store)  
- Supabase Vector Store (Langchain Vector Store)  
- OpenAI Chat Model2 (Langchain Chat Model)  
- Embeddings OpenAI2 (Langchain Embeddings)  
- Sticky Notes (for setup reminders)  

**Node Details:**

- **When chat message received**  
  - Type: Langchain Chat Trigger (Webhook)  
  - Role: Triggered by user chat messages for AI interaction  
  - Config: Webhook ID configured for external integration  
  - Input: User chat message payload  
  - Output: Passes message to AI Agent chain  
  - Failures: Webhook configuration errors, invalid payloads  

- **AI Agent**  
  - Type: Langchain Agent  
  - Role: Core AI logic combining chat model and vector store tool for document-aware responses  
  - Config: Default options  
  - Input: Chat message from trigger, vector store search results, and chat model responses  
  - Output: Final chat response to user  
  - Failures: API errors, malformed inputs  

- **OpenAI Chat Model1**  
  - Type: Langchain Chat Model (OpenAI)  
  - Role: Generate language model responses for AI Agent  
  - Credentials: OpenAI API credentials  
  - Input: User query and context from vector store tool  
  - Output: Candidate responses for AI Agent  
  - Failures: Rate limit, auth errors  

- **Vector Store Tool1**  
  - Type: Langchain Tool Vector Store  
  - Role: Query Supabase vector store for top 8 matching document chunks relevant to user query  
  - Config: Name "knowledge_base", topK=8  
  - Input: Query text from AI Agent / Chat Model  
  - Output: Retrieved document chunks with metadata  
  - Failures: Query errors, connection issues  

- **Supabase Vector Store**  
  - Type: Langchain Vector Store Supabase  
  - Role: Interface to Supabase vector store for searching document embeddings  
  - Config: Table "documents", metadata filter example with file_id provided (sample)  
  - Credentials: Supabase API credentials  
  - Input: Query from Vector Store Tool1  
  - Output: Matching document vectors  
  - Failures: DB query errors, credential issues  

- **OpenAI Chat Model2**  
  - Type: Langchain Chat Model (OpenAI)  
  - Role: Secondary chat model to process search results and refine answers  
  - Credentials: OpenAI API credentials  
  - Input: Document chunks, user query  
  - Output: Enhanced chat responses  
  - Failures: Same as Chat Model1  

- **Embeddings OpenAI2**  
  - Type: Langchain Embeddings (OpenAI)  
  - Role: Generate embeddings for chat queries if needed (used internally)  
  - Credentials: OpenAI API credentials  
  - Input: Query text  
  - Output: Embeddings for vector store search  
  - Failures: Same as other embedding nodes  

- **Sticky Notes**  
  - Provide reminders to replace credentials for OpenAI and Supabase where used  

---

### 3. Summary Table

| Node Name                  | Node Type                               | Functional Role                               | Input Node(s)                     | Output Node(s)                     | Sticky Note                                                        |
|----------------------------|---------------------------------------|----------------------------------------------|----------------------------------|----------------------------------|-------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger                        | Entry point to start file ingestion          | None                             | Get All Files                    |                                                                   |
| Get All Files              | Supabase (Get All)                     | Retrieve list of processed files from DB     | When clicking ‘Test workflow’    | Aggregate                       |                                                                   |
| Aggregate                  | Aggregate                             | Aggregate all file records for comparison    | Get All Files                   | Get All files                   |                                                                   |
| Get All files              | HTTP Request (Supabase Storage API)   | Fetch list of files in Supabase storage      | Aggregate                      | Loop Over Items                 | ### Replace Storage name, database ID and credentials.            |
| Loop Over Items            | Split In Batches                      | Iterate over each file individually           | Get All files                  | If, (null)                    |                                                                   |
| If                        | If                                   | Filter out duplicates and placeholders        | Loop Over Items                | Download (true branch), (false) |                                                                   |
| Download                   | HTTP Request                         | Download file content from Supabase           | If                            | Switch                         | ### Replace Storage name, database ID and credentials.            |
| Switch                     | Switch                              | Route files by type (pdf or text)             | Download                      | Extract Document PDF (pdf), Merge (txt) |                                                                   |
| Extract Document PDF       | Extract from File                    | Extract text from PDF files                     | Switch (pdf)                  | Merge                         |                                                                   |
| Merge                      | Merge                               | Merge extracted PDF or text data               | Switch (txt), Extract Document PDF | Default Data Loader          |                                                                   |
| Default Data Loader        | Langchain Document Loader           | Prepare document with metadata for chunking   | Merge                         | Recursive Character Text Splitter |                                                                   |
| Recursive Character Text Splitter | Langchain Text Splitter           | Split text into chunks (500 size, 200 overlap) | Default Data Loader           | Embeddings OpenAI             |                                                                   |
| Embeddings OpenAI          | Langchain Embeddings (OpenAI)       | Generate embeddings for text chunks           | Recursive Character Text Splitter | Insert into Supabase Vectorstore | ### Replace credentials.                                          |
| Create File record2        | Supabase Insert                      | Insert new file record in DB                    | Loop Over Items               | Insert into Supabase Vectorstore | ### Replace credentials.                                          |
| Insert into Supabase Vectorstore | Langchain Vector Store Supabase    | Store embeddings into Supabase vector store   | Embeddings OpenAI, Create File record2 | Loop Over Items             | ### Replace credentials.                                          |
| When chat message received | Langchain Chat Trigger              | Webhook trigger for user chat messages        | None                         | AI Agent                     |                                                                   |
| AI Agent                  | Langchain Agent                     | Core AI logic for chat combining chat model and vector store | When chat message received, OpenAI Chat Model1, Vector Store Tool1 | None |                                                                   |
| OpenAI Chat Model1        | Langchain Chat Model (OpenAI)       | Generate chat responses                        | When chat message received     | AI Agent                     | ### Replace credentials.                                          |
| Vector Store Tool1        | Langchain Tool Vector Store         | Query vector store for relevant document chunks | OpenAI Chat Model2            | AI Agent                     | ### Replace credentials.                                          |
| Supabase Vector Store     | Langchain Vector Store Supabase      | Interface to Supabase vector store             | Vector Store Tool1             | OpenAI Chat Model2           | ### Replace credentials.                                          |
| OpenAI Chat Model2        | Langchain Chat Model (OpenAI)       | Secondary chat model processing vector results | Supabase Vector Store         | Vector Store Tool1           | ### Replace credentials.                                          |
| Embeddings OpenAI2        | Langchain Embeddings (OpenAI)       | Embeddings for chat queries                    | OpenAI Chat Model2            | Supabase Vector Store        | ### Replace credentials.                                          |
| Sticky Note / Sticky Note1-10 | Sticky Note                      | Setup reminders and branding                    | N/A                           | N/A                          | See individual notes in Workflow Overview and node details       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node named "When clicking ‘Test workflow’".**

2. **Add a Supabase node named "Get All Files":**  
   - Operation: Get All  
   - Table ID: `files`  
   - Credentials: Configure with your Supabase API credentials  
   - Connect output from the manual trigger to this node.

3. **Add an Aggregate node named "Aggregate":**  
   - Operation: Aggregate all item data  
   - Connect input from "Get All Files".

4. **Add an HTTP Request node named "Get All files":**  
   - Method: POST  
   - URL: `https://<your-supabase-url>.supabase.co/storage/v1/object/list/private`  
   - Authentication: Use your Supabase credentials  
   - Body (JSON):  
     ```json
     {
       "prefix": "",
       "limit": 100,
       "offset": 0,
       "sortBy": { "column": "name", "order": "asc" }
     }
     ```  
   - Send Body: true, specify body as JSON  
   - Connect input from "Aggregate".

5. **Add a Split In Batches node named "Loop Over Items":**  
   - Batch Size: 1  
   - Connect input from "Get All files".

6. **Add an If node named "If":**  
   - Condition 1: Expression that checks if the current file's `id` is NOT in the aggregated list from "Aggregate" node.  
   - Condition 2: File name does NOT equal `.emptyFolderPlaceholder`  
   - Connect input from "Loop Over Items".  
   - True branch proceeds to download, False branch ends.

7. **Add an HTTP Request node named "Download":**  
   - Method: GET  
   - URL: `https://<your-supabase-url>.supabase.co/storage/v1/object/private/{{ $json.name }}`  
   - Authentication: Supabase credentials  
   - Connect input from "If" node true branch.

8. **Add a Switch node named "Switch":**  
   - Define two outputs:  
     - Output "pdf": Condition when `{{$binary.data.fileExtension}}` equals `pdf`  
     - Output "txt": Default when fileExtension is undefined or not pdf (treat as text)  
   - Connect input from "Download".

9. **Add an Extract from File node named "Extract Document PDF":**  
   - Operation: pdf extraction  
   - Connect input from "Switch" node pdf output.

10. **Add a Merge node named "Merge":**  
    - Connect inputs from "Switch" node txt output and "Extract Document PDF" node output.

11. **Add a Langchain Document Default Data Loader node named "Default Data Loader":**  
    - JSON Data expression: `={{ $('Merge').item.json.data ?? $('Merge').item.json.text }}`  
    - Metadata: Add `file_id` from `={{ $json.id }}`  
    - Connect input from "Merge".

12. **Add a Langchain Recursive Character Text Splitter node named "Recursive Character Text Splitter":**  
    - Chunk size: 500  
    - Chunk overlap: 200  
    - Connect input from "Default Data Loader".

13. **Add a Langchain Embeddings OpenAI node named "Embeddings OpenAI":**  
    - Model: `text-embedding-3-small`  
    - Credentials: OpenAI API credentials  
    - Connect input from "Recursive Character Text Splitter".

14. **Add a Supabase Insert node named "Create File record2":**  
    - Table ID: `files`  
    - Fields:  
      - `name`: `={{ $('Loop Over Items').item.json.name }}`  
      - `storage_id`: `={{ $('Loop Over Items').item.json.id }}`  
    - Credentials: Supabase API credentials  
    - Connect input from "Loop Over Items".

15. **Add a Langchain Vector Store Supabase node named "Insert into Supabase Vectorstore":**  
    - Mode: Insert  
    - Table Name: `documents`  
    - Query Name: `match_documents`  
    - Credentials: Supabase API credentials  
    - Connect two inputs:  
      - From "Embeddings OpenAI" (embedding data)  
      - From "Create File record2" (file metadata)  
    - Output loops back to "Loop Over Items" to continue batch processing.

---

16. **Add a Langchain Chat Trigger node named "When chat message received":**  
    - Configure webhook for external chat messages.  
    - Connect output to "AI Agent".

17. **Add a Langchain Chat Model OpenAI node named "OpenAI Chat Model1":**  
    - Credentials: OpenAI API credentials  
    - Connect input from "When chat message received".  
    - Output connects to "AI Agent".

18. **Add a Langchain Vector Store Supabase node named "Supabase Vector Store":**  
    - Table Name: `documents`  
    - Metadata filter example: file_id if needed  
    - Credentials: Supabase API credentials  

19. **Add a Langchain Embeddings OpenAI node named "Embeddings OpenAI2":**  
    - Model: `text-embedding-3-small`  
    - Credentials: OpenAI API credentials  

20. **Add a Langchain Chat Model OpenAI node named "OpenAI Chat Model2":**  
    - Credentials: OpenAI API credentials  

21. **Add a Langchain Tool Vector Store node named "Vector Store Tool1":**  
    - Name: `knowledge_base`  
    - topK: 8 (retrieve top 8 relevant documents)  
    - Connect input from "OpenAI Chat Model2" and "Supabase Vector Store".  
    - Output connects to "AI Agent".

22. **Add a Langchain Agent node named "AI Agent":**  
    - Connect inputs from "When chat message received", "OpenAI Chat Model1", and "Vector Store Tool1".  
    - Output is the chatbot’s final reply.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                   | Context or Link                                                                                     |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Detailed video guide (10 minutes) explaining setup and implementation of this workflow.                                                                                                                                                                                                                                                                                                       | [YouTube Video](https://www.youtube.com/watch?v=glWUkdZe_3w)                                        |
| Replace storage bucket names, database IDs, and Supabase credentials wherever indicated with your own environment’s values.                                                                                                                                                                                                                                                                    | Workflow Sticky Notes throughout nodes                                                             |
| Replace OpenAI API credentials with your own keys to enable embedding and chat model nodes.                                                                                                                                                                                                                                                                                                     | Workflow Sticky Notes throughout nodes                                                             |
| This workflow was created by Mark Shcherbakov from the 5minAI community.                                                                                                                                                                                                                                                                                                                       | [LinkedIn](https://www.linkedin.com/in/marklowcoding/), [5minAI Skool](https://www.skool.com/5minai-2861) |
| The vector store uses the default Supabase `documents` table and schema for seamless integration.                                                                                                                                                                                                                                                                                              | Supabase documentation on vector store schema                                                     |
| Ensure your Supabase Storage bucket is set to private if using private access URLs, and configure credentials accordingly in HTTP Request nodes.                                                                                                                                                                                                                                              | Supabase Storage API documentation                                                                 |

---

This structured documentation provides a comprehensive understanding of the workflow’s architecture, node configuration, data flow, integration points, and operational guidelines to enable users or automation agents to replicate, modify, or troubleshoot the workflow efficiently.