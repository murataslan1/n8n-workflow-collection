AI-Powered Company Documents Q&A Assistant with Google Drive and GPT-4 Mini

https://n8nworkflows.xyz/workflows/ai-powered-company-documents-q-a-assistant-with-google-drive-and-gpt-4-mini-10947


# AI-Powered Company Documents Q&A Assistant with Google Drive and GPT-4 Mini

### 1. Workflow Overview

This workflow implements an AI-powered Q&A assistant designed to answer user questions by leveraging company documents stored in Google Drive. It uses GPT-4 Mini for natural language understanding and a vector store for semantic search over indexed document content.

The workflow is logically divided into two main blocks:

- **1.1 Document Processing Block:**  
  Monitors a specific Google Drive folder for new documents. When a new document is detected, it is downloaded, processed into searchable chunks, embedded into vector representations, and stored in an in-memory vector store (knowledge base). This enables semantic search across company documents.

- **1.2 Chat Interface and AI Query Block:**  
  Exposes a webhook to receive user questions. Upon receiving a query, the workflow maintains conversation history for context, searches the knowledge base for relevant information, and uses an AI agent (GPT-4 Mini) to generate accurate, citation-supported answers. The response is then sent back to the user.

---

### 2. Block-by-Block Analysis

#### 2.1 Document Processing Block

**Overview:**  
This block automates ingestion of company documents into a semantic search knowledge base. It listens for new files in a Google Drive folder, downloads them, extracts and splits their content into chunks, generates embeddings for those chunks, and stores these embeddings in an in-memory vector store for later retrieval.

**Nodes Involved:**  
- Watch Company Docs Folder  
- Fetch New Document  
- Store in Knowledge Base  
- Load Document Content  
- Split into Searchable Chunks  
- Generate Document Embeddings

**Node Details:**

- **Watch Company Docs Folder**  
  - Type: Google Drive Trigger  
  - Role: Monitors a specific Google Drive folder for new file creation events.  
  - Config: Polls every minute; triggers only on the selected folder.  
  - Inputs: None (trigger node)  
  - Outputs: Emits metadata of newly created files including file ID.  
  - Edge cases: Folder access permission issues, missing folder configuration, rate limits.

- **Fetch New Document**  
  - Type: Google Drive (Download)  
  - Role: Downloads the detected new document file from Google Drive using a Service Account.  
  - Config: Downloads binary data of the file based on file ID from trigger node.  
  - Inputs: File ID from the "Watch Company Docs Folder" node.  
  - Outputs: Binary file data for downstream processing.  
  - Edge cases: Authentication failure, file not found, file format unsupported, download timeouts.

- **Store in Knowledge Base**  
  - Type: Langchain Vector Store (In-Memory)  
  - Role: Inserts document embeddings into an in-memory vector database under the key "company docs".  
  - Config: Mode set to "insert"; memoryKey named "company docs".  
  - Inputs: Embeddings and document content from "Load Document Content" and "Generate Document Embeddings".  
  - Outputs: Confirmation of insertion.  
  - Edge cases: Memory limits, data corruption, concurrency conflicts.

- **Load Document Content**  
  - Type: Langchain Document Default Data Loader  
  - Role: Extracts text content from binary document data for further processing.  
  - Config: Input is binary data field; uses custom text splitting mode.  
  - Inputs: Binary document from "Split into Searchable Chunks" (indirect via connection).  
  - Outputs: Text content ready for chunking.  
  - Edge cases: Unsupported file types, extraction errors, empty content.

- **Split into Searchable Chunks**  
  - Type: Langchain Text Splitter (Recursive Character)  
  - Role: Splits document text into overlapping chunks to optimize semantic search.  
  - Config: Chunk overlap set to 200 characters to preserve context.  
  - Inputs: Text content from "Load Document Content".  
  - Outputs: Array of text chunks for embedding.  
  - Edge cases: Chunking too granular or too coarse, splitting errors.

- **Generate Document Embeddings**  
  - Type: OpenAI Embeddings (via Langchain)  
  - Role: Converts text chunks into vector embeddings for semantic similarity search.  
  - Config: Uses OpenAI embeddings with default options; requires OpenAI API credentials.  
  - Inputs: Text chunks from "Split into Searchable Chunks".  
  - Outputs: Embeddings for insertion into vector store.  
  - Edge cases: API failures, rate limits, malformed input.

---

#### 2.2 Chat Interface and AI Query Block

**Overview:**  
This block handles incoming user questions via a webhook, maintains conversational context, searches the document knowledge base for relevant information, and generates well-cited answers using GPT-4 Mini.

**Nodes Involved:**  
- Receive User Question  
- Company Knowledge Assistant  
- Search Company Documents  
- Conversation History  
- OpenAI Chat Model  
- Send Answer to User

**Node Details:**

- **Receive User Question**  
  - Type: Webhook (POST)  
  - Role: Entry point for user questions submitted via HTTP POST requests.  
  - Config: Path "chat-input"; expects POST with JSON containing "data" (question) and "session_id" (conversation context ID).  
  - Inputs: External HTTP requests.  
  - Outputs: Passes question payload to AI agent.  
  - Edge cases: Invalid/missing parameters, unauthorized access, webhook downtime.

- **Company Knowledge Assistant**  
  - Type: Langchain Agent (AI agent)  
  - Role: Main AI logic node that processes user queries, queries vector store, and generates answers with citations based on company documents.  
  - Config: Uses GPT-4 Mini model; system prompt instructs to answer accurately, cite sources, and be professional.  
  - Inputs: User question (from webhook), conversation history, vector store tool, and OpenAI Chat Model.  
  - Outputs: Generated answer text.  
  - Edge cases: Model timeouts, incomplete retrieval, hallucination risk, prompt injection.

- **Search Company Documents**  
  - Type: Langchain Vector Store (In-Memory)  
  - Role: Retrieves top 5 relevant document chunks from the vector store based on user query.  
  - Config: Retrieval mode as a tool for the agent; memoryKey "company docs".  
  - Inputs: Query text from AI agent.  
  - Outputs: Relevant context chunks for AI to use.  
  - Edge cases: Empty knowledge base, retrieval errors.

- **Conversation History**  
  - Type: Langchain Memory Buffer Window  
  - Role: Maintains last 10 message exchanges per user session to provide context-aware responses.  
  - Config: Uses custom session key from request JSON "session_id".  
  - Inputs: Incoming questions and AI responses.  
  - Outputs: Context window for AI agent.  
  - Edge cases: Session ID missing/invalid, memory overflow.

- **OpenAI Chat Model**  
  - Type: Langchain LM Chat OpenAI  
  - Role: Underlying language model (GPT-4 Mini) used by AI agent for text generation.  
  - Config: Model set to "gpt-4.1-mini"; requires OpenAI API key.  
  - Inputs: Prompt + context from AI agent.  
  - Outputs: Generated text completions.  
  - Edge cases: API quota exceeded, network errors, model unavailability.

- **Send Answer to User**  
  - Type: Respond to Webhook  
  - Role: Sends the generated answer text back as an HTTP response to the webhook caller.  
  - Config: Responds with plain text extracted from AI agent output.  
  - Inputs: AI-generated answer.  
  - Outputs: HTTP response to user.  
  - Edge cases: Response timeout, malformed output, webhook connection lost.

---

### 3. Summary Table

| Node Name                  | Node Type                            | Functional Role                                | Input Node(s)                  | Output Node(s)               | Sticky Note                                                                                       |
|----------------------------|------------------------------------|-----------------------------------------------|-------------------------------|-----------------------------|-------------------------------------------------------------------------------------------------|
| Watch Company Docs Folder   | Google Drive Trigger                | Detect new files in specific Drive folder     | None                          | Fetch New Document           | ## Document Processing<br>Drive trigger detects new files → Downloads document → Extracts and chunks text → Generates embeddings → Stores in vector database |
| Fetch New Document          | Google Drive (Download)             | Download new document file                      | Watch Company Docs Folder      | Store in Knowledge Base      | ## Document Processing<br>Drive trigger detects new files → Downloads document → Extracts and chunks text → Generates embeddings → Stores in vector database |
| Store in Knowledge Base     | Langchain Vector Store (In-Memory) | Insert embeddings into vector DB                | Fetch New Document, Load Document Content, Generate Document Embeddings |                             | ## Document Processing<br>Drive trigger detects new files → Downloads document → Extracts and chunks text → Generates embeddings → Stores in vector database |
| Load Document Content       | Langchain Document Default Data Loader | Extract text content from binary document     | Split into Searchable Chunks   | Store in Knowledge Base      | ## Document Processing<br>Drive trigger detects new files → Downloads document → Extracts and chunks text → Generates embeddings → Stores in vector database |
| Split into Searchable Chunks| Langchain Text Splitter             | Split document text into chunks for embedding | Load Document Content          | Generate Document Embeddings | ## Document Processing<br>Drive trigger detects new files → Downloads document → Extracts and chunks text → Generates embeddings → Stores in vector database |
| Generate Document Embeddings| OpenAI Embeddings                   | Generate vector embeddings from text chunks    | Split into Searchable Chunks   | Store in Knowledge Base, Search Company Documents | ## Document Processing<br>Drive trigger detects new files → Downloads document → Extracts and chunks text → Generates embeddings → Stores in vector database |
| Receive User Question       | Webhook POST                       | Receive user queries for company knowledge Q&A | None                          | Company Knowledge Assistant  | ## Chat Flow<br>Webhook receives questions → AI agent searches vector store → GPT-4 generates answers with citations → Response sent back to user |
| Company Knowledge Assistant | Langchain Agent                    | Process queries, search knowledge base, generate answers | Receive User Question, Conversation History, Search Company Documents, OpenAI Chat Model | Send Answer to User          | ## Chat Flow<br>Webhook receives questions → AI agent searches vector store → GPT-4 generates answers with citations → Response sent back to user |
| Search Company Documents    | Langchain Vector Store (In-Memory) | Retrieve relevant document chunks for queries | Company Knowledge Assistant    | Company Knowledge Assistant  | ## Chat Flow<br>Webhook receives questions → AI agent searches vector store → GPT-4 generates answers with citations → Response sent back to user |
| Conversation History        | Langchain Memory Buffer            | Maintain conversation context per user session | Receive User Question          | Company Knowledge Assistant  | ## Chat Flow<br>Webhook receives questions → AI agent searches vector store → GPT-4 generates answers with citations → Response sent back to user |
| OpenAI Chat Model           | Langchain LM Chat OpenAI           | GPT-4 Mini language model for answer generation | Company Knowledge Assistant    | Company Knowledge Assistant  |                                                                                                |
| Send Answer to User         | Respond to Webhook                  | Return generated answer text as HTTP response | Company Knowledge Assistant    | None                        | ## Chat Flow<br>Webhook receives questions → AI agent searches vector store → GPT-4 generates answers with citations → Response sent back to user |
| Sticky Note                 | Sticky Note                        | Workflow explanation and setup instructions    | None                          | None                        | ## How it works... (Full content in node details)                                               |
| Sticky Note1                | Sticky Note                        | Chat flow summary                               | None                          | None                        | ## Chat Flow... (Full content in node details)                                                  |
| Sticky Note2                | Sticky Note                        | Document processing summary                      | None                          | None                        | ## Document Processing... (Full content in node details)                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Drive Trigger Node ("Watch Company Docs Folder")**  
   - Type: Google Drive Trigger  
   - Configure to monitor a specific folder for new file creation events.  
   - Set polling interval to every minute.  
   - Connect your Google Drive OAuth2 credentials.  
   - Select the folder to watch.

2. **Create Google Drive Node ("Fetch New Document")**  
   - Type: Google Drive (Download)  
   - Set operation to "download" using Service Account authentication.  
   - Configure `fileId` parameter to use the ID from the trigger node (`={{ $json.id }}`).  
   - Output binary data property set to "data".  
   - Connect input from "Watch Company Docs Folder".

3. **Create Langchain Vector Store Node ("Store in Knowledge Base")**  
   - Type: Vector Store In-Memory  
   - Set mode to "insert".  
   - Set memoryKey to "company docs".  
   - Connect input from nodes that load document content and generate embeddings.

4. **Create Langchain Document Default Data Loader Node ("Load Document Content")**  
   - Type: Document Default Data Loader  
   - Set input data type to "binary" and binary mode to "specificField".  
   - Connect input from "Split into Searchable Chunks".  
   - Output text content for chunking.

5. **Create Langchain Text Splitter Node ("Split into Searchable Chunks")**  
   - Type: Recursive Character Text Splitter  
   - Set chunk overlap to 200 characters for context preservation.  
   - Connect input from "Load Document Content".  
   - Output chunks for embedding generation.

6. **Create Langchain OpenAI Embeddings Node ("Generate Document Embeddings")**  
   - Type: OpenAI Embeddings  
   - Use default options; connect your OpenAI API credentials.  
   - Connect input from "Split into Searchable Chunks".  
   - Output embeddings to "Store in Knowledge Base" and "Search Company Documents".

7. **Create Webhook Node ("Receive User Question")**  
   - Type: Webhook (POST)  
   - Set path to "chat-input".  
   - Expect POST body JSON with fields: "data" (question text), "session_id" (session identifier).  
   - Configure to respond via response node.  
   - No credentials needed unless secured.

8. **Create Langchain Memory Buffer Node ("Conversation History")**  
   - Type: Memory Buffer Window  
   - Session key set dynamically from `{{$json.body.session_id}}`.  
   - Context window length set to 10 messages.  
   - Connect input from "Receive User Question".

9. **Create Langchain Vector Store Node ("Search Company Documents")**  
   - Type: Vector Store In-Memory  
   - Set mode to "retrieve-as-tool".  
   - Set topK to 5 (top five relevant chunks).  
   - Use memoryKey "company docs".  
   - Describe tool purpose for clarity.

10. **Create Langchain Agent Node ("Company Knowledge Assistant")**  
    - Type: Langchain Agent  
    - Set prompt text to user message (`={{ $json.body.data }}`).  
    - Define system message instructing the agent to answer accurately using company documents, cite sources, be professional, and admit if info not found.  
    - Use GPT-4 Mini model.  
    - Attach AI memory from "Conversation History".  
    - Attach AI tool from "Search Company Documents".  
    - Attach AI language model "OpenAI Chat Model".  
    - Connect input from "Receive User Question".

11. **Create Langchain LM Chat OpenAI Node ("OpenAI Chat Model")**  
    - Type: OpenAI Chat Model  
    - Set model to "gpt-4.1-mini".  
    - Connect output to "Company Knowledge Assistant" AI language model input.  
    - Add OpenAI API credentials.

12. **Create Respond to Webhook Node ("Send Answer to User")**  
    - Type: Respond to Webhook  
    - Configure to respond with plain text using `={{ $json.output }}` from "Company Knowledge Assistant".  
    - Connect input from "Company Knowledge Assistant" main output.

13. **Connect Workflow**  
    - Chain nodes as follows:

      - Document Processing:  
        Watch Company Docs Folder → Fetch New Document → Store in Knowledge Base  
        Fetch New Document → Load Document Content → Split into Searchable Chunks → Generate Document Embeddings → Store in Knowledge Base & Search Company Documents  

      - Chat Flow:  
        Receive User Question → Conversation History → Company Knowledge Assistant → Send Answer to User  
        Company Knowledge Assistant connects to Search Company Documents and OpenAI Chat Model nodes.

14. **Credentials Setup**  
    - Google Drive OAuth2 for folder monitoring (Watch Company Docs Folder).  
    - Google Service Account for file downloads (Fetch New Document).  
    - OpenAI API key for embeddings and chat model nodes.

15. **Testing**  
    - Test webhook with a POST request JSON:  
      ```json
      { "data": "your question here", "session_id": "user123" }
      ```  
    - Confirm documents are processed when added to the monitored Drive folder.  
    - Verify responses include citations and accurate answers.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                             | Context or Link                                                                                  |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow creates an AI assistant that answers questions using your company's documents. It has two independent flows: Document Processing and Chat Interface. Setup steps include connecting Google Drive OAuth2, selecting the folder, adding OpenAI API keys, configuring Google Service Account, and testing the webhook endpoint.          | See Sticky Note content in the workflow for detailed explanation.                              |
| Chat Flow: Webhook receives questions → AI agent searches vector store → GPT-4 generates answers with citations → Response sent back to user.                                                                                                                                                                                           | Sticky Note near Chat Flow nodes.                                                              |
| Document Processing: Drive trigger detects new files → Downloads document → Extracts and chunks text → Generates embeddings → Stores in vector database.                                                                                                                                                                                 | Sticky Note near Document Processing nodes.                                                    |
| Recommended to monitor API usage limits for OpenAI to avoid quota issues. Handle errors gracefully especially in API calls and Google Drive access.                                                                                                                                                                                      | Best practice advice.                                                                           |
| For improved persistence beyond memory limits, consider integrating a persistent vector store like Pinecone or Weaviate instead of in-memory vector store.                                                                                                                                                                              | Enhancement suggestion.                                                                        |
| Google Service Account credentials require appropriate Drive API access permissions for file download operations.                                                                                                                                                                                                                         | Credential configuration note.                                                                 |
| For production, secure webhook with authentication or IP filtering to prevent unauthorized access.                                                                                                                                                                                                                                         | Security best practice.                                                                         |

---

**Disclaimer:**  
The text provided is exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.