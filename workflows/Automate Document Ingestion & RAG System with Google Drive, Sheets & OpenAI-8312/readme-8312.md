Automate Document Ingestion & RAG System with Google Drive, Sheets & OpenAI

https://n8nworkflows.xyz/workflows/automate-document-ingestion---rag-system-with-google-drive--sheets---openai-8312


# Automate Document Ingestion & RAG System with Google Drive, Sheets & OpenAI

---

## 1. Workflow Overview

This workflow automates document ingestion from a specific Google Drive folder into a Retrieval-Augmented Generation (RAG) system using Pinecone vector storage and OpenAI embeddings. It manages a record of processed documents in Google Sheets to avoid duplication and supports updating the knowledge base when documents change. Additionally, it exposes a user-facing form to ask questions against the ingested knowledge base, leveraging LangChain agents and OpenAI chat models for AI-powered responses.

The workflow is logically divided into these main blocks:

- **1.1 Google Drive File Monitoring & Retrieval**: Watches a Google Drive folder for new or updated files, lists files, downloads them, and filters out non-downloadable items (folders).

- **1.2 Document Processing & Vectorization**: Processes each document by creating hashes, splitting text, generating embeddings with OpenAI, and inserting/updating vectors in Pinecone.

- **1.3 Record Management**: Maintains a Google Sheets database that tracks file IDs, names, and content hashes to determine whether documents are new, updated, or unchanged.

- **1.4 AI Query Interface**: Provides a web form for users to ask questions, which are answered by an AI agent that retrieves relevant information from Pinecone and responds using OpenAI chat models.

---

## 2. Block-by-Block Analysis

### 2.1 Google Drive File Monitoring & Retrieval

**Overview:**  
This block monitors a designated Google Drive folder for newly created or updated files. It lists all files within this folder, filters out folders, and downloads the actual files for ingestion.

**Nodes Involved:**  
- create (Google Drive Trigger - fileCreated)  
- update (Google Drive Trigger - fileUpdated)  
- Search files and folders (Google Drive)  
- Loop Over Items (SplitInBatches)  
- nonDownloadableFile (If)  
- Download file (Google Drive)  

**Node Details:**

- **create**  
  - Type: Google Drive Trigger  
  - Role: Watches for new files created in the specified folder (folderId "1vQo4Er5h-4KEZoYCmHX-J4S9TRK5zpj-")  
  - Polling Interval: Every minute  
  - Output: Triggers downstream nodes when a new file is detected  
  - Edge Cases: Missing folder permissions or API rate limits may cause missed triggers  

- **update**  
  - Type: Google Drive Trigger  
  - Role: Watches for files updated in the same folder as above  
  - Polling Interval: Every minute  
  - Output: Triggers downstream nodes when a file is updated  
  - Edge Cases: Similar to create node  

- **Search files and folders**  
  - Type: Google Drive (list files/folders)  
  - Role: Lists all files and folders in the target folder  
  - Filter: folderId set to the target folder  
  - Returns All: True  
  - Fields retrieved: mimeType, id, name  
  - Edge Cases: Pagination issues if folder very large, API errors  

- **Loop Over Items**  
  - Type: SplitInBatches  
  - Role: Processes files one by one or in small batches for manageable workflow operation  
  - Edge Cases: Large batch sizes could cause timeouts; empty list input  

- **nonDownloadableFile**  
  - Type: If  
  - Role: Checks if the current item is a folder (mimeType "application/vnd.google-apps.folder")  
  - True path: Skips downloading, loops back to process next item  
  - False path: Proceeds to download file  
  - Edge Cases: Files with unknown mime types or corrupted metadata  

- **Download file**  
  - Type: Google Drive (download)  
  - Role: Downloads the file content (binary) for processing  
  - Input: Current file id from Loop Over Items  
  - Edge Cases: File permission errors, large file download failures, network timeouts  

---

### 2.2 Document Processing & Vectorization

**Overview:**  
This block processes downloaded documents by generating content hashes, splitting text into chunks, embedding text with OpenAI, and inserting or updating vectors in the Pinecone vector store.

**Nodes Involved:**  
- createHash (Crypto)  
- searchRecordManger (Google Sheets)  
- Switch (Switch)  
- Default Data Loader (LangChain document loader)  
- Recursive Character Text Splitter (LangChain text splitter)  
- Embeddings OpenAI (LangChain embeddings)  
- Pinecone Vector Store (LangChain Pinecone insert)  
- Pinecone Vector Store1 (LangChain Pinecone insert with clearNamespace option)  
- Download file1 (Google Drive)  
- Download file2 (Google Drive)  

**Node Details:**

- **createHash**  
  - Type: Crypto (SHA256)  
  - Role: Computes SHA256 hash of the downloaded file binary data for change detection  
  - Input: Binary from Download file  
  - Output: JSON with hash string  
  - Edge Cases: Binary data missing or corrupted  

- **searchRecordManger**  
  - Type: Google Sheets  
  - Role: Searches the record manager sheet for existing record matching current file ID  
  - Filter: Lookup by file ID in column "Id"  
  - Sheet: gid=0 of a specific Google Sheet document  
  - Edge Cases: API limit, sheet access issues, multiple matches  

- **Switch**  
  - Type: Switch  
  - Role: Routes processing based on whether document is new, already processed, or updated  
  - Conditions:  
    - New Document: No record found in sheet (empty JSON)  
    - Already processed: Hash matches existing record  
    - Updated Document: Hash differs from existing record  
  - Edge Cases: Expression evaluation failures, empty or malformed data  

- **Default Data Loader**  
  - Type: LangChain Document Loader  
  - Role: Loads document content for embedding, splits into pages (splitPages: true)  
  - Metadata: Adds file_id and file_name for each loaded document  
  - Input: Binary data from Download file1 or Download file2  
  - Edge Cases: Unsupported file types, loading failures  

- **Recursive Character Text Splitter**  
  - Type: LangChain Text Splitter  
  - Role: Splits document text into chunks with 10-character overlap for context preservation  
  - Input: Output of Default Data Loader  
  - Edge Cases: Very short documents or unusual formats might produce odd chunking  

- **Embeddings OpenAI**  
  - Type: LangChain Embeddings Node  
  - Role: Generates vector embeddings using OpenAI’s "text-embedding-3-large" model  
  - Input: Chunks from Recursive Character Text Splitter  
  - Credential: OpenAI API key  
  - Edge Cases: API rate limits, model unavailability, network errors  

- **Pinecone Vector Store**  
  - Type: LangChain Pinecone Vector Store Insert (mode: insert)  
  - Role: Inserts document embeddings into Pinecone index, using namespace named after the file name  
  - Credential: Pinecone API key  
  - Edge Cases: API rate limits, namespace conflicts, insertion failures  

- **Pinecone Vector Store1**  
  - Similar to above but with clearNamespace set to true, used for updates to replace existing vectors  

- **Download file1 & Download file2**  
  - Type: Google Drive download  
  - Role: Downloads files again as needed for new or updated entries before vector insertion  
  - Edge Cases: Same as Download file node  

---

### 2.3 Record Management

**Overview:**  
This block updates the Google Sheets record manager to track file IDs, names, and content hashes, enabling the system to detect new, updated, or unchanged documents.

**Nodes Involved:**  
- Add to Record Manger (Google Sheets)  
- Update the RecordManger (Google Sheets)  

**Node Details:**

- **Add to Record Manger**  
  - Type: Google Sheets (appendOrUpdate)  
  - Role: Adds new file record with Id, name, and hashId to the record manager sheet  
  - Matching Column: Id (to avoid duplicates)  
  - Edge Cases: Sheet access issues, duplicate entries, data conversion errors  

- **Update the RecordManger**  
  - Type: Google Sheets (appendOrUpdate)  
  - Role: Updates existing file record’s hashId when document content changes  
  - Matching Column: Id  
  - Edge Cases: Same as Add to Record Manger  

---

### 2.4 AI Query Interface

**Overview:**  
This block provides an interactive web form for users to submit questions. The questions are processed by a LangChain AI agent that utilizes the Pinecone vector store as a knowledge base and OpenAI chat models to generate answers.

**Nodes Involved:**  
- On form submission (Form Trigger)  
- AI Agent (LangChain agent)  
- Pinecone Vector Store2 (LangChain Pinecone retrieve-as-tool)  
- Embeddings OpenAI1 (LangChain embeddings for query)  
- OpenAI Chat Model (LangChain chat model)  
- Form (Form node to show results)  

**Node Details:**

- **On form submission**  
  - Type: Form Trigger  
  - Role: Accepts user-submitted questions via a web form titled "Ask Knowledge base"  
  - Webhook ID: Unique webhook for receiving requests  
  - Edge Cases: Malformed input, slow responses  

- **AI Agent**  
  - Type: LangChain Agent node  
  - Role: Processes the question text, retrieves relevant knowledge via Pinecone, and produces final answer  
  - System Message: Customized prompt instructing to answer based on manuals, extract page numbers, output in HTML  
  - Input: Question from form submission  
  - Edge Cases: Retrieval failures, empty results, prompt misinterpretation  

- **Pinecone Vector Store2**  
  - Type: LangChain Pinecone vector store (retrieve-as-tool)  
  - Role: Used by AI Agent as a tool to fetch relevant documents for answering  
  - Namespace: Fixed as "pinecorn-namespce" (likely a typo, should verify)  
  - Edge Cases: Misspelled namespace causing no retrievals, API errors  

- **Embeddings OpenAI1**  
  - Type: LangChain Embeddings node  
  - Role: Generates embeddings of the user question to query Pinecone  
  - Model: "text-embedding-3-large"  
  - Edge Cases: API limits, embedding failures  

- **OpenAI Chat Model**  
  - Type: LangChain Chat Model (OpenAI GPT-4.1-mini)  
  - Role: Generates conversational answers based on retrieved info and prompt instructions  
  - Credential: OpenAI API key  
  - Edge Cases: API rate limits, generation timeouts  

- **Form**  
  - Type: Form (Completion)  
  - Role: Displays the AI agent’s response in formatted HTML to the user  
  - Custom CSS: Enhances readability and styling of form and results  
  - Edge Cases: HTML rendering issues on client side  

---

## 3. Summary Table

| Node Name             | Node Type                                  | Functional Role                          | Input Node(s)           | Output Node(s)                    | Sticky Note                                  |
|-----------------------|--------------------------------------------|----------------------------------------|-------------------------|----------------------------------|----------------------------------------------|
| create                | Google Drive Trigger                        | Trigger on new file in folder          |                         | Search files and folders          |                                              |
| update                | Google Drive Trigger                        | Trigger on file update in folder       |                         | Search files and folders          |                                              |
| Search files and folders | Google Drive                              | Lists all files/folders in target folder | create, update          | Loop Over Items                  |                                              |
| Loop Over Items       | SplitInBatches                             | Processes files in batches              | Search files and folders | nonDownloadableFile, Download file |                                              |
| nonDownloadableFile   | If                                         | Filters out folders                     | Loop Over Items          | Loop Over Items (if folder), Download file (if not) |                                              |
| Download file         | Google Drive                               | Downloads file binary                   | nonDownloadableFile      | createHash                      |                                              |
| createHash            | Crypto (SHA256)                            | Creates hash of file content            | Download file            | searchRecordManger              |                                              |
| searchRecordManger    | Google Sheets                              | Searches record for file id             | createHash               | Switch                         |                                              |
| Switch                | Switch                                    | Routes based on document status         | searchRecordManger       | Add to Record Manger, Loop Over Items, Update the RecordManger |                                              |
| Add to Record Manger  | Google Sheets                              | Adds new document record                | Switch                   | Download file1                  |                                              |
| Download file1        | Google Drive                               | Downloads file for new document ingestion | Add to Record Manger    | Pinecone Vector Store          |                                              |
| Pinecone Vector Store | LangChain Pinecone Vector Store           | Inserts embeddings for new documents    | Download file1           |                                  | ## Generate the knowledge base                |
| Download file2        | Google Drive                               | Downloads file for updated document     | Update the RecordManger  | Pinecone Vector Store1         |                                              |
| Pinecone Vector Store1| LangChain Pinecone Vector Store           | Inserts embeddings with clear namespace for updates | Download file2  |                                  | ## Update the knowledge base                   |
| Update the RecordManger| Google Sheets                             | Updates document record hash            | Switch                   | Download file2                  |                                              |
| Default Data Loader   | LangChain Document Loader                  | Loads and splits documents               | Pinecone Vector Store, Pinecone Vector Store1 (ai_document) |                                  |                                              |
| Recursive Character Text Splitter | LangChain Text Splitter              | Splits document text into chunks        | Default Data Loader      | Embeddings OpenAI              |                                              |
| Embeddings OpenAI     | LangChain Embeddings OpenAI                | Generates embeddings for document chunks| Recursive Character Text Splitter | Pinecone Vector Store, Pinecone Vector Store1 |                                              |
| On form submission    | Form Trigger                               | Receives user questions                  |                         | AI Agent                      |                                              |
| AI Agent              | LangChain Agent                            | Processes questions, retrieves info, creates answer | On form submission, Pinecone Vector Store2, OpenAI Chat Model | Form | ## Ask Knowledge base                        |
| Pinecone Vector Store2| LangChain Pinecone Vector Store (retrieve) | Retrieves relevant document vectors     | Embeddings OpenAI1       | AI Agent                      |                                              |
| Embeddings OpenAI1    | LangChain Embeddings OpenAI                | Embeds user query                        | AI Agent                 | Pinecone Vector Store2         |                                              |
| OpenAI Chat Model     | LangChain Chat Model (OpenAI GPT-4)        | Generates answers from retrieved info   | AI Agent                 | AI Agent                      |                                              |
| Form                  | Form                                       | Displays AI responses                    | AI Agent                 |                              |                                              |
| Sticky Note           | Sticky Note                                | Visual annotation                       |                         |                              | ## Record Manger                             |
| Sticky Note1          | Sticky Note                                | Visual annotation                       |                         |                              | ## Ask Knowledge base                        |
| Sticky Note2          | Sticky Note                                | Visual annotation                       |                         |                              | ## Generate the knowledge base               |
| Sticky Note3          | Sticky Note                                | Visual annotation                       |                         |                              | ## Update the knowledge base                 |

---

## 4. Reproducing the Workflow from Scratch

1. **Create Google Drive Triggers**  
   - Node Type: Google Drive Trigger (2 nodes)  
   - Configure one for "fileCreated" event, the other for "fileUpdated" event  
   - Set the folder to watch: Folder ID "1vQo4Er5h-4KEZoYCmHX-J4S9TRK5zpj-"  
   - Poll every minute  
   - Connect both triggers to the next node: "Search files and folders"  

2. **Search Files and Folders**  
   - Node Type: Google Drive (list files/folders)  
   - Resource: fileFolder  
   - Operation: List all files/folders in the folder ID above  
   - Return all: true  
   - Fields: mimeType, id, name  
   - Connect to "Loop Over Items"  

3. **Loop Over Items**  
   - Node Type: SplitInBatches  
   - Default batch size  
   - Connect to "nonDownloadableFile"  

4. **nonDownloadableFile**  
   - Node Type: If  
   - Condition: mimeType equals "application/vnd.google-apps.folder"  
   - True (folder): connect back to "Loop Over Items" to skip  
   - False (file): connect to "Download file"  

5. **Download file**  
   - Node Type: Google Drive (download)  
   - File ID: use current item's id  
   - Connect to "createHash"  

6. **createHash**  
   - Node Type: Crypto  
   - Algorithm: SHA256  
   - Use binary data from "Download file"  
   - Connect to "searchRecordManger"  

7. **searchRecordManger**  
   - Node Type: Google Sheets  
   - Operation: Lookup rows in sheet named "dataBase" (gid=0)  
   - Document ID: Google Sheet ID "1HxJuA-ph6qvFmLzccKpM1XJeJHzELmvQzqJeqiRaC0U"  
   - Filter: LookupValue = current file id, LookupColumn = "Id"  
   - Connect to "Switch"  

8. **Switch**  
   - Node Type: Switch  
   - Add three outputs:  
     - New Document: Condition if searchRecordManger returns empty (no record)  
     - Already processed: Condition if hashId equals current hash from createHash  
     - Updated Document: Condition if hashId does not equal current hash  
   - Connect "New Document" to "Add to Record Manger"  
   - Connect "Already processed" to "Loop Over Items" (skip processing)  
   - Connect "Updated Document" to "Update the RecordManger"  

9. **Add to Record Manger**  
   - Node Type: Google Sheets (appendOrUpdate)  
   - Sheet: "dataBase" (gid=0) in the same Google Sheet  
   - Columns: Id, name, hashId (from current item and createHash)  
   - Matching Column: Id  
   - Connect to "Download file1"  

10. **Download file1**  
    - Node Type: Google Drive (download)  
    - File ID: current item id  
    - Connect to "Default Data Loader"  

11. **Default Data Loader**  
    - Node Type: LangChain Document Loader  
    - DataType: binary  
    - SplitPages: true  
    - Metadata: set file_id and file_name from current item  
    - Connect to "Recursive Character Text Splitter"  

12. **Recursive Character Text Splitter**  
    - Node Type: LangChain Text Splitter  
    - Chunk Overlap: 10 characters  
    - Connect to "Embeddings OpenAI"  

13. **Embeddings OpenAI**  
    - Node Type: LangChain Embeddings  
    - Model: "text-embedding-3-large"  
    - Credential: OpenAI API  
    - Connect to "Pinecone Vector Store" and "Pinecone Vector Store1" (as ai_embedding)  

14. **Pinecone Vector Store**  
    - Node Type: LangChain Vector Store Pinecone  
    - Mode: Insert  
    - Namespace: Current item's name  
    - Pinecone Index: "n8n-nodes"  
    - Credential: Pinecone API  
    - Connect to no further nodes (end)  

15. **Update the RecordManger**  
    - Node Type: Google Sheets (appendOrUpdate)  
    - Sheet and document same as Add to Record Manger  
    - Columns: Id and updated hashId  
    - Matching Column: Id  
    - Connect to "Download file2"  

16. **Download file2**  
    - Node Type: Google Drive (download)  
    - File ID: current item id  
    - Connect to "Pinecone Vector Store1"  

17. **Pinecone Vector Store1**  
    - Node Type: LangChain Vector Store Pinecone  
    - Mode: Insert  
    - Option: clearNamespace = true (to replace old vectors)  
    - Namespace: Current item's name  
    - Pinecone Index: "n8n-nodes"  
    - Credential: Pinecone API  
    - Connect to no further nodes (end)  

18. **AI Query Interface Setup**  
    - Create "On form submission" node (Form Trigger)  
      - Form Title: "Ask Knowledge base"  
      - Add field "Question" (required)  
      - Set webhook ID  
    - Connect to "AI Agent"  

19. **AI Agent**  
    - Node Type: LangChain Agent  
    - Text Input: "question:{{ $json.Question }}"  
    - System message: Prompt instructing to answer based on knowledge base, extract page number, output HTML  
    - Connect to "Form" output for response display  
    - Configure tool: "Knowledge base" linked to "Pinecone Vector Store2"  

20. **Pinecone Vector Store2**  
    - Node Type: LangChain Vector Store Pinecone (retrieve-as-tool)  
    - Namespace: "pinecorn-namespce" (verify and correct if needed)  
    - Pinecone Index: "n8n-nodes"  
    - Credential: Pinecone API  
    - Connect to AI Agent as tool  

21. **Embeddings OpenAI1**  
    - Node Type: LangChain Embeddings  
    - Model: "text-embedding-3-large"  
    - Credential: OpenAI API  
    - Connect input question to Pinecone Vector Store2  

22. **OpenAI Chat Model**  
    - Node Type: LangChain Chat Model  
    - Model: "gpt-4.1-mini"  
    - Credential: OpenAI API  
    - Connect to AI Agent (ai_languageModel)  

23. **Form**  
    - Node Type: Form (Completion)  
    - Operation: Completion  
    - Completion Title: "Result"  
    - Completion Message: Use AI Agent output  
    - Custom CSS: Use provided styling for readability  

---

## 5. General Notes & Resources

| Note Content                                                                                             | Context or Link                                                                                  |
|----------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| The "pinecorn-namespce" namespace in Pinecone Vector Store2 appears misspelled; verify and correct it.   | Could cause retrieval failures in AI query block                                               |
| Sticky notes provide visual annotations in the workflow editor for clarity on knowledge base generation, record management, and AI query interface. | Visual aid within n8n editor                                                                   |
| Google Sheets document ID "1HxJuA-ph6qvFmLzccKpM1XJeJHzELmvQzqJeqiRaC0U" acts as the record manager database. | Ensure appropriate sharing and API access                                                      |
| Google Drive folder ID "1vQo4Er5h-4KEZoYCmHX-J4S9TRK5zpj-" is the monitored folder for document ingestion. | Permissions required for API access                                                            |
| OpenAI models used: "text-embedding-3-large" for embeddings and "gpt-4.1-mini" for chat completions.     | Requires valid OpenAI API key with access to these models                                      |
| Pinecone index used throughout is named "n8n-nodes".                                                    | Pinecone API key with this index access required                                              |

---

**Disclaimer:** The provided text is exclusively sourced from an n8n automated workflow. It fully complies with content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.

---