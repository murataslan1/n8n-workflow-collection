AI-Powered WhatsApp Chatbot for Text, Voice, Images, and PDF with RAG

https://n8nworkflows.xyz/workflows/ai-powered-whatsapp-chatbot-for-text--voice--images--and-pdf-with-rag-4827


# AI-Powered WhatsApp Chatbot for Text, Voice, Images, and PDF with RAG

### 1. Workflow Overview

This workflow implements an AI-powered WhatsApp chatbot designed to handle diverse input types including text, voice messages, images, and PDF documents, leveraging Retrieval-Augmented Generation (RAG) to provide context-aware responses. It integrates WhatsApp message triggers, media downloads, content extraction and processing, vector embedding generation, vector database search, and AI language models to generate answers enriched by conversation memory.

The workflow is logically organized into the following blocks:

- **1.1 Manual Document Import and Indexing:** Import product documentation from Google Docs, chunk and embed content, and store vectors in MongoDB for fast retrieval.
- **1.2 WhatsApp Message Reception and Routing:** Listen for incoming WhatsApp messages of various types and route them appropriately.
- **1.3 Media Download and Preprocessing:** Download media content (audio, image, document) from WhatsApp, adjust MIME types, and extract relevant text or binary data.
- **1.4 Document Processing and Vector Storage:** Split documents into chunks, generate embeddings, and insert them into MongoDB vector store.
- **1.5 Knowledge Base Search and AI Response Generation:** Use embeddings to query vector store, apply conversation memory, generate AI responses with GPT-4o-mini, and send replies back via WhatsApp.
- **1.6 Error Handling and Unsupported File Types:** Detect unsupported file types and notify users accordingly.

---

### 2. Block-by-Block Analysis

#### 2.1 Manual Document Import and Indexing

- **Overview:** Allows manual execution to import Google Docs product documentation, chunk text, generate embeddings, and store vectors in MongoDB for future RAG queries.
- **Nodes Involved:**  
  - When clicking "Execute Workflow"  
  - Google Docs Importer  
  - Document Chunker  
  - Document Section Loader  
  - OpenAI Embeddings Generator  
  - MongoDB Vector Store Inserter  
  - Sticky Note (Instruction)

- **Node Details:**
  - **When clicking "Execute Workflow"**  
    - Type: Manual Trigger  
    - Role: Entry point for manual import  
    - No inputs, outputs to Google Docs Importer  
    - Edge cases: Manual start required; no automation here.

  - **Google Docs Importer**  
    - Type: Google Docs node  
    - Role: Fetches document content via URL  
    - Configured to get content from a specific Google Docs URL  
    - Requires Google Docs OAuth2 credentials  
    - Edge cases: OAuth failures, document not found, access denied.

  - **Document Chunker**  
    - Type: Recursive Character Text Splitter  
    - Role: Splits long text into 3000-character chunks with 200-character overlap, preserving markdown formatting  
    - Inputs: Raw document content from Google Docs Importer  
    - Outputs: Chunks to Document Section Loader  
    - Edge cases: Incorrect chunk size or overlap could affect context.

  - **Document Section Loader**  
    - Type: Document Data Loader  
    - Role: Prepares chunks with metadata for embedding  
    - Inputs: Text chunks  
    - Outputs: Data to OpenAI Embeddings Generator  
    - Edge cases: Metadata extraction failures.

  - **OpenAI Embeddings Generator**  
    - Type: OpenAI Embeddings node  
    - Role: Generates vector embeddings for document chunks  
    - Requires OpenAI API credentials  
    - Outputs embeddings to MongoDB Vector Store Inserter  
    - Edge cases: API rate limits, network errors.

  - **MongoDB Vector Store Inserter**  
    - Type: MongoDB Vector Store node (insert mode)  
    - Role: Stores embeddings with metadata in MongoDB Atlas collection "n8n-template" under index "data_index"  
    - Requires MongoDB credentials  
    - Edge cases: Connection issues, insertion failures.

  - **Sticky Note**  
    - Content: "Run this workflow manually to import and index Google Docs product documentation into MongoDB with vector embeddings for fast search."

---

#### 2.2 WhatsApp Message Reception and Routing

- **Overview:** Listens to WhatsApp messages and routes messages based on type (text, audio, image, document) for appropriate processing.
- **Nodes Involved:**  
  - WhatsApp Trigger  
  - Route Types (Switch node)  
  - Sticky Note1 (Overview of workflow)

- **Node Details:**
  - **WhatsApp Trigger**  
    - Type: WhatsApp Trigger node  
    - Role: Listens for incoming WhatsApp messages (all types) via webhook  
    - Uses WhatsApp OAuth credentials  
    - Outputs to Route Types  
    - Edge cases: Webhook misconfiguration, auth errors.

  - **Route Types**  
    - Type: Switch node  
    - Role: Routes messages by type field: text, audio, image, document  
    - Outputs: Four distinct branches for each message type  
    - Edge cases: Unexpected or missing message type values.

  - **Sticky Note1**  
    - Content: "This workflow listens for WhatsApp messages (text, audio, image, documents), converts them into embeddings, searches MongoDB, and uses GPT-4o-mini to provide context-aware answers with conversation memory."

---

#### 2.3 Media Download and Preprocessing

- **Overview:** For non-text messages, obtains media URLs from WhatsApp API, downloads content, and prepares data for further processing.
- **Nodes Involved:**  
  - Gets WhatsApp Voicemail Source URL  
  - Download Voicemail  
  - OpenAI (Audio Translate)  
  - Gets WhatsApp Image Source URL  
  - Download Image  
  - OpenAI1 (Image Analyze)  
  - Gets WhatsApp Document Source URL  
  - Download Document  
  - Map file extensions (Code node)  
  - Route Document Types (Switch node)  
  - Map JSON  
  - Extract from PDF  
  - Extract from XLS  
  - Extract from XLSX  
  - Send Unsupported Response

- **Node Details:**

  - **Gets WhatsApp Voicemail Source URL**  
    - Type: WhatsApp node  
    - Role: Retrieves download URL for audio message from WhatsApp using media ID  
    - Inputs: Audio message ID  
    - Edge cases: Media ID invalid, API failures.

  - **Download Voicemail**  
    - Type: HTTP Request  
    - Role: Downloads audio file from URL with header auth  
    - Uses HTTP Header Auth credentials  
    - Edge cases: Download failures, auth errors.

  - **OpenAI (Audio Translate)**  
    - Type: OpenAI Audio Translate  
    - Role: Translates audio to text via OpenAI's speech-to-text  
    - Requires OpenAI API credentials  
    - Edge cases: Audio format issues, API errors.

  - **Gets WhatsApp Image Source URL**  
    - Same pattern as voicemail but for image media ID.

  - **Download Image**  
    - Downloads image from URL using header auth.

  - **OpenAI1 (Image Analyze)**  
    - Type: OpenAI Image Analysis  
    - Role: Uses GPT-4o-mini model to analyze base64 image input  
    - Outputs description used in prompt  
    - Edge cases: Large images, unsupported formats, API limits.

  - **Gets WhatsApp Document Source URL**  
    - Retrieves document download URL.

  - **Download Document**  
    - Downloads document with header auth.

  - **Map file extensions (Code node)**  
    - Role: Normalizes MIME type values for calendar, XML, and sets fallback MIME type when missing  
    - Inputs: Downloaded document metadata  
    - Outputs modified requests with corrected MIME types  
    - Edge cases: Unexpected MIME types.

  - **Route Document Types (Switch node)**  
    - Routes documents by MIME type into categories: CSV, HTML, Calendar, RTF, TXT, XML, PDF, JSON, XLS, XLSX, ELSE  
    - Edge cases: Unrecognized MIME types routed to ELSE.

  - **Map JSON**  
    - Sets JSON text content for document types like XLS, XLSX, JSON (parsed data).

  - **Extract from PDF, Extract from XLS, Extract from XLSX**  
    - Extract text or data from respective file types.

  - **Send Unsupported Response**  
    - Sends WhatsApp message notifying user of unsupported file type  
    - Uses WhatsApp credentials  
    - Edge cases: Failures sending message.

---

#### 2.4 Document Processing and Vector Storage

- **Overview:** Processes extracted or parsed document content, generates embeddings, and stores them in the vector database for retrieval.
- **Nodes Involved:**  
  - Map document prompt  
  - Document Chunker (for some documents)  
  - Document Section Loader  
  - OpenAI Embeddings Generator  
  - MongoDB Vector Store Inserter

- **Node Details:**

  - **Map document prompt**  
    - Type: Set node  
    - Role: Constructs prompt text combining parsed text, document captions, and MIME type for AI processing  
    - Includes expressions referencing other nodes’ outputs  
    - Outputs to Document Chunker or directly to embeddings generation based on document type.

  - **Document Chunker, Document Section Loader, OpenAI Embeddings Generator, MongoDB Vector Store Inserter**  
    - Same as in Manual Import block but here used for uploaded documents.

---

#### 2.5 Knowledge Base Search and AI Response Generation

- **Overview:** Uses embedded query text from WhatsApp input to search MongoDB vector store, applies conversation memory, generates AI responses, and sends answers via WhatsApp.
- **Nodes Involved:**  
  - Map text prompt  
  - Simple Memory  
  - Embeddings OpenAI  
  - MongoDB Vector Search  
  - OpenAI Chat Model  
  - Knowledge Base Agent  
  - Send Response

- **Node Details:**

  - **Map text prompt**  
    - Type: Set node  
    - Role: Extracts user text message body for embedding and querying  
    - Input: Raw WhatsApp text message  
    - Output: Text field for embeddings

  - **Embeddings OpenAI**  
    - Generates embedding vector for the user query text using OpenAI API.

  - **MongoDB Vector Search**  
    - Retrieves relevant documents from MongoDB vector index using user query embedding as tool input  
    - Operates in "retrieve-as-tool" mode with tool name "productDocs" and description  
    - Outputs relevant context documents.

  - **Simple Memory**  
    - Manages conversation memory buffer keyed by WhatsApp user ID (wa_id)  
    - Stores recent conversation history for context continuity  
    - Outputs memory to Knowledge Base Agent as ai_memory input

  - **OpenAI Chat Model**  
    - Provides GPT-4o-mini chat completions as ai_languageModel input to Knowledge Base Agent  
    - Uses OpenAI API credentials

  - **Knowledge Base Agent**  
    - Central node combining user text, retrieved documents, conversation memory, and AI model to generate context-aware responses  
    - Outputs final text reply

  - **Send Response**  
    - Sends the AI-generated response back to the WhatsApp user  
    - Uses WhatsApp API credentials  
    - Edge cases: Message send failures.

---

#### 2.6 Error Handling and Unsupported File Types

- **Overview:** Detects document types that are unsupported and sends a polite notification to the user.
- **Nodes Involved:**  
  - Route Document Types (ELSE output)  
  - Send Unsupported Response

- **Node Details:**  
  - Triggered when document MIME type does not match any supported types  
  - Sends message: "The File type you provided is unsupported." to user's WhatsApp  
  - Edge cases: Failures in sending notification.

---

### 3. Summary Table

| Node Name                      | Node Type                                  | Functional Role                                 | Input Node(s)                      | Output Node(s)                      | Sticky Note                                                                                                 |
|--------------------------------|--------------------------------------------|------------------------------------------------|----------------------------------|-----------------------------------|-------------------------------------------------------------------------------------------------------------|
| When clicking "Execute Workflow"| Manual Trigger                             | Manual start for Google Docs import             | None                             | Google Docs Importer               | Run this workflow manually to import and index Google Docs product documentation into MongoDB with vector embeddings for fast search. |
| Google Docs Importer            | Google Docs                                | Imports product documentation                    | When clicking "Execute Workflow" | MongoDB Vector Store Inserter      |                                                                                                             |
| Document Chunker               | Text Splitter                              | Splits long documents into chunks                | Google Docs Importer             | Document Section Loader           |                                                                                                             |
| Document Section Loader         | Document Loader                            | Prepares document chunks for embedding           | Document Chunker                | OpenAI Embeddings Generator       |                                                                                                             |
| OpenAI Embeddings Generator     | OpenAI Embeddings                          | Generates embeddings for document chunks         | Document Section Loader          | MongoDB Vector Store Inserter      |                                                                                                             |
| MongoDB Vector Store Inserter   | MongoDB Vector Store                       | Inserts document embeddings into MongoDB         | OpenAI Embeddings Generator      | None                            |                                                                                                             |
| WhatsApp Trigger               | WhatsApp Trigger                           | Listens for incoming WhatsApp messages           | None                             | Route Types                      | This workflow listens for WhatsApp messages (text, audio, image, documents), converts them into embeddings, searches MongoDB, and uses GPT-4o-mini to provide context-aware answers with conversation memory. |
| Route Types                   | Switch                                    | Routes messages by type (text, audio, image, document) | WhatsApp Trigger               | Map text prompt, Gets WhatsApp Voicemail Source URL, Gets WhatsApp Image Source URL, Gets WhatsApp Document Source URL |                                                                                                             |
| Gets WhatsApp Voicemail Source URL | WhatsApp                                 | Retrieves audio media URL                         | Route Types (Audio)             | Download Voicemail               |                                                                                                             |
| Download Voicemail             | HTTP Request                              | Downloads audio file                              | Gets WhatsApp Voicemail Source URL | OpenAI (Audio Translate)           |                                                                                                             |
| OpenAI                       | OpenAI Audio Translate                     | Translates audio to text                          | Download Voicemail              | Knowledge Base Agent             |                                                                                                             |
| Gets WhatsApp Image Source URL | WhatsApp                                  | Retrieves image media URL                         | Route Types (Image)             | Download Image                  |                                                                                                             |
| Download Image                | HTTP Request                              | Downloads image file                             | Gets WhatsApp Image Source URL  | OpenAI1 (Image Analyze)          |                                                                                                             |
| OpenAI1                      | OpenAI Image Analysis                      | Analyzes image content                            | Download Image                 | Map image prompt                 |                                                                                                             |
| Map image prompt              | Set                                       | Builds prompt text from image analysis           | OpenAI1                        | Knowledge Base Agent             |                                                                                                             |
| Gets WhatsApp Document Source URL | WhatsApp                                | Retrieves document media URL                      | Route Types (Document)          | Download Document              |                                                                                                             |
| Download Document             | HTTP Request                              | Downloads document file                           | Gets WhatsApp Document Source URL | Map file extensions            |                                                                                                             |
| Map file extensions           | Code                                      | Normalizes MIME types                             | Download Document               | Route Document Types            |                                                                                                             |
| Route Document Types          | Switch                                    | Routes documents by MIME type                     | Map file extensions             | Extract from PDF/XLS/XLSX/Map JSON/Send Unsupported Response |                                                                                                             |
| Extract from PDF              | Extract from File                          | Extracts text from PDF                            | Route Document Types (PDF)      | Map document prompt             |                                                                                                             |
| Extract from XLS              | Extract from File                          | Extracts data from XLS                            | Route Document Types (XLS)      | Map JSON                       |                                                                                                             |
| Extract from XLSX             | Extract from File                          | Extracts data from XLSX                           | Route Document Types (XLSX)     | Map JSON                       |                                                                                                             |
| Map JSON                     | Set                                       | Sets JSON content from parsed XLS/XLSX data      | Extract from XLS/XLSX           | Map document prompt             |                                                                                                             |
| Map document prompt          | Set                                       | Builds prompt text from document content          | Extract from PDF/Map JSON/Route Document Types | Knowledge Base Agent             |                                                                                                             |
| Map text prompt              | Set                                       | Extracts user text message body                    | Route Types (Text)              | Knowledge Base Agent             |                                                                                                             |
| Simple Memory                | Memory Buffer Window                      | Maintains conversation memory per WhatsApp user   | WhatsApp Trigger (via wa_id)   | Knowledge Base Agent             |                                                                                                             |
| Embeddings OpenAI            | OpenAI Embeddings                         | Generates embedding vector for user query          | Map text prompt                | MongoDB Vector Search           |                                                                                                             |
| MongoDB Vector Search        | MongoDB Vector Store                      | Searches MongoDB vector store for relevant docs    | Embeddings OpenAI             | Knowledge Base Agent             |                                                                                                             |
| OpenAI Chat Model            | OpenAI Chat Model                         | GPT-4o-mini chat completions                       | Knowledge Base Agent           | Knowledge Base Agent            |                                                                                                             |
| Knowledge Base Agent         | LangChain Agent                          | Combines query, memory, search results and LM output | Map text prompt, Simple Memory, MongoDB Vector Search, OpenAI Chat Model | Send Response                  |                                                                                                             |
| Send Response               | WhatsApp                                  | Sends AI-generated response to WhatsApp user       | Knowledge Base Agent           | None                          |                                                                                                             |
| Send Unsupported Response   | WhatsApp                                  | Sends message for unsupported file types            | Route Document Types (ELSE)    | None                          |                                                                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - No parameters  
   - Named: "When clicking \"Execute Workflow\""

2. **Add Google Docs Importer**  
   - Type: Google Docs  
   - Operation: "get"  
   - Document URL: Provide Google Docs URL of product documentation  
   - Credentials: Configure Google Docs OAuth2 credentials  
   - Connect "When clicking \"Execute Workflow\"" → "Google Docs Importer"

3. **Add Document Chunker**  
   - Type: Recursive Character Text Splitter  
   - Chunk Size: 3000 characters  
   - Chunk Overlap: 200 characters  
   - Split Code: "markdown"  
   - Connect "Google Docs Importer" → "Document Chunker"

4. **Add Document Section Loader**  
   - Type: Document Default Data Loader  
   - Metadata: Set "doc_id" using expression `{{$json.documentId}}`  
   - JSON Data: Use expression `{{$json.content}}`  
   - JSON Mode: expressionData  
   - Connect "Document Chunker" → "Document Section Loader"

5. **Add OpenAI Embeddings Generator**  
   - Type: OpenAI Embeddings  
   - Credentials: OpenAI API  
   - Connect "Document Section Loader" → "OpenAI Embeddings Generator"

6. **Add MongoDB Vector Store Inserter**  
   - Type: MongoDB Vector Store (Insert mode)  
   - Mongo Collection: Select collection (e.g., "n8n-template")  
   - Vector Index Name: "data_index"  
   - Credentials: MongoDB Atlas credentials  
   - Connect "OpenAI Embeddings Generator" → "MongoDB Vector Store Inserter"

7. **Add WhatsApp Trigger**  
   - Type: WhatsApp Trigger  
   - Webhook: Configure webhook ID  
   - Credentials: WhatsApp OAuth  
   - Connect no input (entry point)

8. **Add Route Types (Switch)**  
   - Type: Switch  
   - Conditions based on `{{$json.messages[0].type}}` with outputs: Text, Audio, Image, Document  
   - Connect "WhatsApp Trigger" → "Route Types"

9. **For Text Branch:**  
   - Add "Map text prompt" (Set node)  
     - Set field "text" to `{{$json.messages[0].text.body}}`  
   - Connect "Route Types" (Text) → "Map text prompt"

10. **For Audio Branch:**  
    - Add "Gets WhatsApp Voicemail Source URL" (WhatsApp node)  
      - Resource: media  
      - Operation: mediaUrlGet  
      - mediaGetId: `{{$json.messages[0].audio.id}}`  
      - Credentials: WhatsApp API  
    - Connect "Route Types" (Audio) → "Gets WhatsApp Voicemail Source URL"

    - Add "Download Voicemail" (HTTP Request)  
      - URL: `{{$json.url}}`  
      - Authentication: HTTP Header Auth  
      - Credentials: Header Auth account  
    - Connect "Gets WhatsApp Voicemail Source URL" → "Download Voicemail"

    - Add OpenAI node (Audio translate)  
      - Resource: audio  
      - Operation: translate  
      - Credentials: OpenAI API  
    - Connect "Download Voicemail" → OpenAI

11. **For Image Branch:**  
    - Add "Gets WhatsApp Image Source URL" (WhatsApp node)  
      - mediaGetId: `{{$json.messages[0].image.id}}`  
      - Credentials: WhatsApp API  
    - Connect "Route Types" (Image) → "Gets WhatsApp Image Source URL"

    - Add "Download Image" (HTTP Request)  
      - URL: `{{$json.url}}`  
      - Authentication: HTTP Header Auth  
      - Credentials: Header Auth account  
    - Connect "Gets WhatsApp Image Source URL" → "Download Image"

    - Add OpenAI node (Image analyze)  
      - Model: gpt-4o-mini  
      - Resource: image  
      - Input Type: base64  
      - Operation: analyze  
      - Credentials: OpenAI API  
    - Connect "Download Image" → OpenAI1

    - Add "Map image prompt" (Set node)  
      - Field "text" with description and caption from OpenAI1 and WhatsApp message caption  
    - Connect OpenAI1 → "Map image prompt"

12. **For Document Branch:**  
    - Add "Gets WhatsApp Document Source URL" (WhatsApp node)  
      - mediaGetId: `{{$json.messages[0].document.id}}`  
      - Credentials: WhatsApp API  
    - Connect "Route Types" (Document) → "Gets WhatsApp Document Source URL"

    - Add "Download Document" (HTTP Request)  
      - URL: `{{$json.url}}`  
      - Authentication: HTTP Header Auth  
      - Credentials: Header Auth account  
    - Connect "Gets WhatsApp Document Source URL" → "Download Document"

    - Add "Map file extensions" (Code node)  
      - JavaScript code to normalize MIME types and assign fallback  
    - Connect "Download Document" → "Map file extensions"

    - Add "Route Document Types" (Switch node)  
      - Conditions on normalized MIME types routing to CSV, HTML, Calendar, RTF, TXT, XML, PDF, JSON, XLS, XLSX, ELSE

    - For PDF: Add "Extract from PDF" → "Map document prompt"  
    - For XLS/XLSX: Add "Extract from XLS"/"Extract from XLSX" → "Map JSON" → "Map document prompt"  
    - For unsupported types (ELSE): Connect to "Send Unsupported Response"

13. **Add "Map document prompt" (Set node)**  
    - Compose prompt text combining parsed text, captions, and MIME type  
    - Connect respective extractors or Map JSON to this node

14. **Add Embeddings OpenAI (for user query)**  
    - Input: "Map text prompt"  
    - Credentials: OpenAI API

15. **Add MongoDB Vector Search**  
    - Mode: retrieve-as-tool  
    - Tool Name: productDocs  
    - Mongo Collection: same as inserter  
    - Credentials: MongoDB Atlas

16. **Add Simple Memory (Memory Buffer Window)**  
    - Session Key: `memory_{{$json.contacts[0].wa_id}}` to keep per-user memory  
    - Connect WhatsApp Trigger to Simple Memory (ai_memory input)

17. **Add OpenAI Chat Model**  
    - Model: gpt-4o-mini  
    - Credentials: OpenAI API

18. **Add Knowledge Base Agent**  
    - Input text: From "Map text prompt" or other mapped prompts  
    - Inputs: ai_languageModel (OpenAI Chat Model), ai_tool (MongoDB Vector Search), ai_memory (Simple Memory)  
    - Outputs: AI-generated response text

19. **Add Send Response (WhatsApp)**  
    - Text Body: `{{$json.output}}` (response from Knowledge Base Agent)  
    - Credentials: WhatsApp API  
    - Connect Knowledge Base Agent → Send Response

20. **Add Send Unsupported Response (WhatsApp)**  
    - Sends message for unsupported document types  
    - Connect Route Document Types (ELSE) → Send Unsupported Response

21. **Add Sticky Notes**  
    - Add descriptive sticky notes to explain workflow blocks and nodes as per content in original workflow

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                                                                                                          |
|----------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| Run this workflow manually to import and index Google Docs product documentation into MongoDB with vector embeddings for fast search. | Instruction for manual document import block.                                                                             |
| This workflow listens for WhatsApp messages (text, audio, image, documents), converts them into embeddings, searches MongoDB, and uses GPT-4o-mini to provide context-aware answers with conversation memory. | Overview sticky note summarizing main workflow purpose.                                                                   |
| Search Index Example JSON schema describing MongoDB vector index mapping for documents with fields for text, embeddings, source, and doc_id. | Provides insight into MongoDB vector index structure used for similarity search.                                          |
| OpenAI account credentials are required for embeddings, chat completions, audio translation, and image analysis.       | Credential setup note.                                                                                                    |
| WhatsApp OAuth account and API credentials are required for receiving messages and sending responses.                  | Credential setup note.                                                                                                    |
| HTTP Header Auth credentials used for downloading WhatsApp media via URLs requiring authentication headers.           | Credential setup note.                                                                                                    |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly adheres to applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.