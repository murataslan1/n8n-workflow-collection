Auto-Update Knowledge Base with Google Drive, LlamaIndex & Azure OpenAI Embeddings

https://n8nworkflows.xyz/workflows/auto-update-knowledge-base-with-google-drive--llamaindex---azure-openai-embeddings-9174


# Auto-Update Knowledge Base with Google Drive, LlamaIndex & Azure OpenAI Embeddings

### 1. Workflow Overview

This workflow automates the updating of a knowledge base by monitoring a specific Google Drive document, parsing its content through LlamaIndex’s cloud API, generating embeddings with Azure OpenAI, and storing the processed data in an in-memory vector store via LangChain. It is designed for use cases where knowledge bases need to be continuously updated from documents stored in Google Drive, enabling AI-powered search or retrieval features through vector embeddings.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Trigger**: Watches a defined Google Drive document for updates.
- **1.2 Document Download**: Downloads the updated document from Google Drive.
- **1.3 Document Parsing via LlamaIndex**: Uploads the document to LlamaIndex for parsing and monitors the parsing job asynchronously.
- **1.4 Content Retrieval & Embeddings Generation**: Retrieves the parsed content, generates vector embeddings using Azure OpenAI, and inserts the data into an in-memory vector store.
- **1.5 Control Flow & Status Checking**: Implements polling and conditional checks to handle asynchronous parsing status and retries.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Trigger

**Overview:**  
This block detects changes to a specific Google Drive document. It triggers the workflow whenever the targeted file is updated.

**Nodes Involved:**  
- Knowledge Base Updated Trigger

**Node Details:**

- **Knowledge Base Updated Trigger**  
  - **Type:** Google Drive Trigger  
  - **Role:** Watches a single specific file on Google Drive for any changes, triggering the workflow on updates.  
  - **Configuration:**  
    - Polls every minute.  
    - Watches a specific Google Doc identified by its file ID (`10maY1IaeelAKV5xBe5DsHiKEXCoAeAFuH2sWfZkvXa4`).  
    - Uses Google Drive OAuth2 credentials for access.  
  - **Input:** None (trigger node)  
  - **Output:** Trigger event with file metadata  
  - **Potential Failures:**  
    - OAuth token expiration or revocation.  
    - Google API quota exceeded or permission denied.  
    - Network issues causing missed triggers.  
  - **Credentials Required:** Google Drive OAuth2 (configured with client ID/secret and OAuth flow).

---

#### 2.2 Document Download

**Overview:**  
Downloads the updated document from Google Drive to prepare it for parsing.

**Nodes Involved:**  
- Download Knowledge Document

**Node Details:**

- **Download Knowledge Document**  
  - **Type:** Google Drive node  
  - **Role:** Downloads the updated document binary content from Google Drive.  
  - **Configuration:**  
    - Uses the same file ID as the trigger node.  
    - Operation set to “download”.  
    - Uses Google Drive OAuth2 credentials.  
  - **Input:** Trigger event from Knowledge Base Updated Trigger  
  - **Output:** Binary file data of the downloaded document  
  - **Potential Failures:**  
    - File access revoked or deleted after trigger.  
    - Google API errors or quota limits.  
    - Download interruptions or corrupt file data.  
  - **Credentials Required:** Google Drive OAuth2

---

#### 2.3 Document Parsing via LlamaIndex

**Overview:**  
Sends the downloaded document to the LlamaIndex cloud API for parsing. Subsequently, it monitors the asynchronous parsing job status until completion.

**Nodes Involved:**  
- Parse Document via LlamaIndex  
- Monitor Document Processing  
- Check Parsing Completion1  
- Wait Before Status Recheck

**Node Details:**

- **Parse Document via LlamaIndex**  
  - **Type:** HTTP Request  
  - **Role:** Uploads the binary document to LlamaIndex API endpoint `/api/v1/parsing/upload` via multipart form data.  
  - **Configuration:**  
    - POST method, multipart-form-data content type.  
    - Authentication via HTTP header with Bearer token (LlamaIndex API key).  
    - Sends the binary file as the `file` parameter.  
  - **Input:** Binary document data from Download Knowledge Document  
  - **Output:** JSON response containing a job ID for parsing.  
  - **Potential Failures:**  
    - API key invalid or revoked (authorization error).  
    - File too large or unsupported format errors.  
    - Network timeouts or HTTP errors.  
  - **Credentials Required:** HTTP Header Auth with LlamaIndex API key.

- **Monitor Document Processing**  
  - **Type:** HTTP Request  
  - **Role:** Polls the LlamaIndex API endpoint `/api/v1/parsing/job/{{jobId}}` to check job status.  
  - **Configuration:**  
    - GET method, authenticated with the same HTTP header token.  
    - Uses dynamic URL with job ID from the previous node.  
  - **Input:** JSON with job ID from Parse Document via LlamaIndex and Wait Before Status Recheck  
  - **Output:** JSON with job status (e.g., SUCCESS, PENDING).  
  - **Potential Failures:**  
    - Job ID invalid or expired.  
    - API rate limits.  
    - Network errors during polling.  
  - **Credentials Required:** HTTP Header Auth.

- **Check Parsing Completion1**  
  - **Type:** If (conditional node)  
  - **Role:** Evaluates if the parsing job status equals "SUCCESS".  
  - **Configuration:**  
    - Checks `$json.status` property strictly equals “SUCCESS”.  
    - If true, proceeds to retrieve parsed content.  
    - If false, triggers a wait before re-check.  
  - **Input:** JSON status from Monitor Document Processing  
  - **Output:** Branches to either Retrieve Parsed Content or Wait Before Status Recheck  
  - **Potential Failures:**  
    - Missing or malformed JSON status property causing expression errors.  
    - Infinite polling if status never becomes SUCCESS.  

- **Wait Before Status Recheck**  
  - **Type:** Wait node  
  - **Role:** Pauses execution for 10 seconds before polling status again.  
  - **Configuration:**  
    - Fixed wait time of 10 seconds.  
  - **Input:** False branch from Check Parsing Completion1  
  - **Output:** Triggers Monitor Document Processing again for polling loop.  
  - **Potential Failures:**  
    - Workflow timeouts if polling takes too long (depending on n8n execution limits).

---

#### 2.4 Content Retrieval & Embeddings Generation

**Overview:**  
Once parsing is complete, this block retrieves the parsed document content in markdown format, generates embeddings using Azure OpenAI, and inserts the data into an in-memory vector store.

**Nodes Involved:**  
- Retrieve Parsed Content  
- Embeddings Azure OpenAI  
- Default Data Loader1  
- Insert Data to Store

**Node Details:**

- **Retrieve Parsed Content**  
  - **Type:** HTTP Request  
  - **Role:** Retrieves the parsed document result in markdown format from LlamaIndex API.  
  - **Configuration:**  
    - GET method to `/api/v1/parsing/job/{{jobId}}/result/markdown`.  
    - Authenticated with HTTP header token.  
  - **Input:** True branch from Check Parsing Completion1 (job ID JSON)  
  - **Output:** Parsed document content in JSON format containing markdown text.  
  - **Potential Failures:**  
    - Job result unavailable or expired.  
    - API authentication errors.  
    - Unexpected response formats causing downstream failures.  
  - **Credentials Required:** HTTP Header Auth.

- **Embeddings Azure OpenAI**  
  - **Type:** LangChain Azure OpenAI Embeddings Node  
  - **Role:** Generates vector embeddings from the parsed markdown content.  
  - **Configuration:**  
    - Uses Azure OpenAI model deployment named "3small".  
    - No additional options configured.  
    - Requires Azure OpenAI credentials with API key and endpoint.  
  - **Input:** Document content from Default Data Loader1 (which processes the parsed content)  
  - **Output:** Embeddings vector data  
  - **Potential Failures:**  
    - Azure OpenAI quota exceeded or invalid credentials.  
    - Model deployment not found or misconfigured.  
    - Text input too large or malformed.  
  - **Credentials Required:** Azure OpenAI API.

- **Default Data Loader1**  
  - **Type:** LangChain Document Default Data Loader  
  - **Role:** Acts as a document loader, preparing parsed content for embedding generation.  
  - **Configuration:** Default options only.  
  - **Input:** Parsed content from Retrieve Parsed Content  
  - **Output:** Document object for embedding node input  
  - **Potential Failures:**  
    - Invalid document formats or empty content.  

- **Insert Data to Store**  
  - **Type:** LangChain Vector Store In-Memory Node  
  - **Role:** Inserts embeddings and document data into an in-memory vector store under the key “n8n KB”.  
  - **Configuration:**  
    - Mode set to “insert”.  
    - Memory key is a list named “n8n KB”.  
  - **Input:**  
    - AI document input from Default Data Loader1.  
    - AI embedding input from Embeddings Azure OpenAI.  
    - Main input from Retrieve Parsed Content.  
  - **Output:** Updated in-memory vector store with new knowledge base data.  
  - **Potential Failures:**  
    - Memory overflow or loss on workflow restart (since in-memory is volatile).  
    - Mismatched document and embedding data causing insertion errors.

---

#### 2.5 Control Flow & Status Checking

**Overview:**  
This block manages the asynchronous nature of the parsing job by using conditional checks and waits to poll the job status until completion.

**Nodes Involved:**  
- Check Parsing Completion1  
- Wait Before Status Recheck  
- Monitor Document Processing

(Described above as part of 2.3, but logically serves as a control flow loop.)

---

### 3. Summary Table

| Node Name                   | Node Type                                     | Functional Role                                  | Input Node(s)                  | Output Node(s)                   | Sticky Note                                                                                                            |
|-----------------------------|-----------------------------------------------|-------------------------------------------------|-------------------------------|---------------------------------|------------------------------------------------------------------------------------------------------------------------|
| Sticky Note                 | Sticky Note                                   | Title block for Knowledge Base                   |                               |                                 | # Knowledge Base                                                                                                        |
| Knowledge Base Updated Trigger | Google Drive Trigger                          | Watches Google Drive file for updates            |                               | Download Knowledge Document     |                                                                                                                        |
| Download Knowledge Document | Google Drive                                  | Downloads updated document binary                 | Knowledge Base Updated Trigger | Parse Document via LlamaIndex    |                                                                                                                        |
| Parse Document via LlamaIndex | HTTP Request                                 | Uploads document to LlamaIndex for parsing       | Download Knowledge Document    | Monitor Document Processing      |                                                                                                                        |
| Monitor Document Processing | HTTP Request                                  | Polls LlamaIndex API for parsing job status      | Parse Document via LlamaIndex, Wait Before Status Recheck | Check Parsing Completion1        |                                                                                                                        |
| Check Parsing Completion1   | If                                            | Checks if parsing job status is SUCCESS           | Monitor Document Processing    | Retrieve Parsed Content, Wait Before Status Recheck |                                                                                                                        |
| Wait Before Status Recheck  | Wait                                          | Waits 10 seconds before polling status again      | Check Parsing Completion1      | Monitor Document Processing      |                                                                                                                        |
| Retrieve Parsed Content     | HTTP Request                                  | Retrieves parsed markdown content from LlamaIndex | Check Parsing Completion1      | Default Data Loader1, Insert Data to Store |                                                                                                                        |
| Default Data Loader1        | LangChain Document Default Data Loader       | Prepares document for embedding generation        | Retrieve Parsed Content        | Insert Data to Store             |                                                                                                                        |
| Embeddings Azure OpenAI     | LangChain Azure OpenAI Embeddings             | Generates vector embeddings from document         | Default Data Loader1           | Insert Data to Store             |                                                                                                                        |
| Insert Data to Store        | LangChain Vector Store In-Memory               | Inserts document and embeddings into vector store | Default Data Loader1, Embeddings Azure OpenAI, Retrieve Parsed Content |                                 |                                                                                                                        |
| Sticky Note1                | Sticky Note                                   | Credentials Setup Guide                           |                               |                                 | # 📋 Credentials Setup Guide\n\n## Required Credentials\n\n### 1. Azure OpenAI API\nNode: Embeddings Azure OpenAI\nSetup instructions and links\n\n### 2. LlamaIndex API\nNode: Parse Document via LlamaIndex\nSetup instructions and links\n\n### 3. Google Drive OAuth2\nNode: Knowledge Base Updated Trigger & Download Knowledge Document\nSetup instructions and links |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node: Knowledge Base Updated Trigger**  
   - Type: Google Drive Trigger  
   - Configure to poll every minute watching a specific file by ID (`10maY1IaeelAKV5xBe5DsHiKEXCoAeAFuH2sWfZkvXa4`)  
   - Set Google Drive OAuth2 credentials with valid client ID/secret and authorized redirect URI.

2. **Create Node: Download Knowledge Document**  
   - Type: Google Drive  
   - Operation: Download  
   - File ID: Same as trigger node  
   - Use the same Google Drive OAuth2 credentials  
   - Connect input from Knowledge Base Updated Trigger.

3. **Create Node: Parse Document via LlamaIndex**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.cloud.llamaindex.ai/api/v1/parsing/upload`  
   - Authentication: HTTP Header Auth with LlamaIndex API key (header name `Authorization`, value `Bearer YOUR_API_KEY`)  
   - Send body as multipart-form-data with parameter `file` linked to the binary data from Download Knowledge Document  
   - Set `accept` header to `application/json`  
   - Connect input from Download Knowledge Document.

4. **Create Node: Monitor Document Processing**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://api.cloud.llamaindex.ai/api/v1/parsing/job/{{ $json.id }}` (job ID from previous node)  
   - Authentication: Same HTTP Header Auth credential  
   - Set `accept` header to `application/json`  
   - Connect input from Parse Document via LlamaIndex and Wait Before Status Recheck.

5. **Create Node: Check Parsing Completion1**  
   - Type: If  
   - Condition: Check if `$json.status` strictly equals `SUCCESS`  
   - Connect input from Monitor Document Processing.

6. **Create Node: Wait Before Status Recheck**  
   - Type: Wait  
   - Amount: 10 seconds  
   - Connect input from false branch of Check Parsing Completion1.

7. **Create Node: Retrieve Parsed Content**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://api.cloud.llamaindex.ai/api/v1/parsing/job/{{ $json.id }}/result/markdown`  
   - Authentication: Same HTTP Header Auth  
   - Set `accept` header to `application/json`  
   - Connect input from true branch of Check Parsing Completion1.

8. **Create Node: Default Data Loader1**  
   - Type: LangChain Document Default Data Loader  
   - Default settings  
   - Connect input from Retrieve Parsed Content.

9. **Create Node: Embeddings Azure OpenAI**  
   - Type: LangChain Azure OpenAI Embeddings  
   - Model: `3small` (Azure OpenAI deployment)  
   - Configure Azure OpenAI credentials (API key, endpoint, deployment name)  
   - Connect input from Default Data Loader1.

10. **Create Node: Insert Data to Store**  
    - Type: LangChain Vector Store In-Memory  
    - Mode: Insert  
    - Memory Key: List named `n8n KB`  
    - Connect AI document input from Default Data Loader1  
    - Connect AI embedding input from Embeddings Azure OpenAI  
    - Connect main input from Retrieve Parsed Content.

11. **Create Sticky Notes (optional but recommended)**  
    - Add a large sticky note titled “Knowledge Base” as a header.  
    - Add a credentials setup sticky note detailing instructions for Azure OpenAI, LlamaIndex API, and Google Drive OAuth2 with relevant links.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Context or Link                                                                               |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|
| Azure OpenAI API setup requires creating a resource in the [Azure Portal](https://portal.azure.com), obtaining the key, endpoint, and creating a deployment named “3small”.                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Azure Portal                                                                                  |
| LlamaIndex API key can be generated from [LlamaIndex Cloud](https://cloud.llamaindex.ai) after account signup. Use HTTP Header Auth in n8n with header `Authorization: Bearer YOUR_API_KEY`.                                                                                                                                                                                                                                                                                                                                                                                                                                      | LlamaIndex Cloud                                                                             |
| Google Drive OAuth2 credentials require setting up a project in [Google Cloud Console](https://console.cloud.google.com), enabling Drive API, and creating OAuth 2.0 credentials with proper redirect URIs matching n8n’s OAuth callback.                                                                                                                                                                                                                                                                                                                                                                                           | Google Cloud Console                                                                          |
| The in-memory vector store is volatile; consider persistent storage for production use.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | LangChain Vector Store In-Memory Node documentation                                         |
| The workflow uses polling with a 10-second wait to handle asynchronous parsing; adjust wait time or implement timeout logic as needed to avoid infinite loops.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | n8n documentation on Wait and If nodes                                                      |

---

**Disclaimer:** The provided text is extracted exclusively from an automated n8n workflow. It complies strictly with current content policies and contains no illegal, offensive, or protected elements. All data processed is lawful and public.