Answer WhatsApp Questions from PDF Documents using RAG, Google Drive and Pinecone

https://n8nworkflows.xyz/workflows/answer-whatsapp-questions-from-pdf-documents-using-rag--google-drive-and-pinecone-10980


# Answer WhatsApp Questions from PDF Documents using RAG, Google Drive and Pinecone

### 1. Workflow Overview

This workflow implements a Retrieval-Augmented Generation (RAG) system to answer WhatsApp questions based on PDF documents stored in Google Drive. The main use case is to enable a chatbot that leverages a user’s own documents as a knowledge base, allowing natural, context-aware responses to incoming WhatsApp queries.

The workflow is logically divided into three main blocks:

- **1.1 Document Processing & Embeddings**  
  Watches a specific PDF file on Google Drive; downloads it upon changes, processes its text by splitting into chunks, generates embeddings using OpenAI, and stores these vectors in a Pinecone vector database. This block prepares the searchable knowledge base.

- **1.2 WhatsApp Message Reception**  
  Listens for incoming WhatsApp messages via a webhook, triggering the AI query process.

- **1.3 AI Retrieval, Reasoning & Response**  
  Retrieves relevant document vectors from Pinecone based on the WhatsApp query, uses an AI Agent combined with a Google Gemini chat model to generate an answer grounded in the retrieved context, and sends the response back via WhatsApp.

---

### 2. Block-by-Block Analysis

#### 2.1 Document Processing & Embeddings

- **Overview:**  
  Monitors a specific PDF file on Google Drive. When the file updates, it downloads the file, extracts and splits its text into manageable chunks, generates vector embeddings via OpenAI, and inserts them into a Pinecone index for semantic search.

- **Nodes Involved:**  
  - Google Drive Trigger  
  - Download file  
  - Recursive Character Text Splitter1  
  - Default Data Loader  
  - Embeddings OpenAI1  
  - Pinecone Vector Store

- **Node Details:**

  - **Google Drive Trigger**  
    - *Type:* Trigger node listening for changes on Google Drive.  
    - *Config:* Polls every minute monitoring one specific file via its file ID.  
    - *Connections:* Outputs file metadata to "Download file".  
    - *Edge Cases:* Potential auth errors, file access permissions, rate limits on polling.

  - **Download file**  
    - *Type:* Google Drive node to download the identified file.  
    - *Config:* Uses dynamic file ID from trigger JSON (`{{$json.id}}`).  
    - *Connections:* Sends binary file data to "Pinecone Vector Store".  
    - *Edge Cases:* Download failures, network timeouts, file not found.

  - **Default Data Loader**  
    - *Type:* LangChain data loader for document ingestion.  
    - *Config:* Loads binary data, attaches metadata with the file name dynamically from the downloaded file (`{{$('Download file').item.json.name}}`), uses custom text splitting mode.  
    - *Connections:* Outputs document chunks to "Pinecone Vector Store".  
    - *Edge Cases:* Unsupported file content, empty documents.

  - **Recursive Character Text Splitter1**  
    - *Type:* Text splitter node to chunk document text.  
    - *Config:* Splits text into 100-character chunks with 20-character overlap for context preservation.  
    - *Connections:* Feeds chunks into the Data Loader.  
    - *Edge Cases:* Overlapping logic errors, very short texts.

  - **Embeddings OpenAI1**  
    - *Type:* Embeddings node generating vector embeddings from text chunks.  
    - *Config:* Uses OpenAI embedding model with 512 dimensions.  
    - *Connections:* Outputs embeddings to "Pinecone Vector Store".  
    - *Credentials:* Requires valid OpenAI API key.  
    - *Edge Cases:* API rate limits, invalid credentials, malformed input text.

  - **Pinecone Vector Store**  
    - *Type:* Vector store node for inserting embeddings into Pinecone.  
    - *Config:* Insert mode targeting the "restaurant" Pinecone index.  
    - *Credentials:* Requires Pinecone API key and index name.  
    - *Edge Cases:* Pinecone API errors, network failures, index misconfiguration.

- **Sticky Note:**  
  *“Document Processing & Embeddings: Processes uploaded Drive files, splits text into chunks, creates embeddings with OpenAI, and stores them in the Pinecone vector index.”*

---

#### 2.2 WhatsApp Message Reception

- **Overview:**  
  Listens for incoming WhatsApp messages via a webhook to trigger the AI response process.

- **Nodes Involved:**  
  - WhatsApp Trigger

- **Node Details:**

  - **WhatsApp Trigger**  
    - *Type:* Trigger node for WhatsApp messages.  
    - *Config:* Listens for message updates.  
    - *Credentials:* Requires WhatsApp API credentials with webhook setup.  
    - *Connections:* Passes incoming message JSON to "AI Agent".  
    - *Edge Cases:* Webhook setup errors, invalid phone numbers, connectivity issues.

- **Sticky Note:**  
  *“WhatsApp Message Flow: Receives incoming WhatsApp messages, sends the query to the AI Agent, and returns the generated answer to the user.”*

---

#### 2.3 AI Retrieval, Reasoning & Response

- **Overview:**  
  Takes the user's WhatsApp message, retrieves relevant context from Pinecone, uses a Google Gemini chat model via an AI Agent to generate a concise, context-aware reply, and sends the response back to WhatsApp.

- **Nodes Involved:**  
  - AI Agent  
  - Pinecone Vector Store1  
  - Simple Memory  
  - Google Gemini Chat Model  
  - Send message

- **Node Details:**

  - **AI Agent**  
    - *Type:* LangChain AI agent combining retrieval and language model interaction.  
    - *Config:* Receives user message in the format: "User : {{ $json.messages[0].text.body }}". Uses a system prompt instructing it to answer only from retrieved context, speak naturally, keep replies short, and avoid hallucination.  
    - *Connections:*  
      - Takes input from WhatsApp Trigger and "Pinecone Vector Store1" (retrieval tool).  
      - Uses "Simple Memory" for session-based context memory.  
      - Outputs generated text to "Send message".  
      - Uses "Google Gemini Chat Model" as the language model.  
    - *Edge Cases:* Model API failures, misinterpretation of prompt, empty retrieval results.

  - **Pinecone Vector Store1**  
    - *Type:* Vector store retrieval node.  
    - *Config:* Retrieves top 5 relevant vectors from the same "restaurant" Pinecone index, described as storing restaurant-related embeddings.  
    - *Credentials:* Pinecone API credentials required.  
    - *Connections:* Acts as retrieval tool for AI Agent.  
    - *Edge Cases:* No relevant retrieval, API failures.

  - **Simple Memory**  
    - *Type:* Memory buffer node to maintain conversational context.  
    - *Config:* Uses a fixed session key "1".  
    - *Connections:* Connected as AI Agent memory input.  
    - *Edge Cases:* Memory overflow, session key collisions.

  - **Google Gemini Chat Model**  
    - *Type:* Language model node using Google Gemini (PaLM) API.  
    - *Credentials:* Requires Google Palm API credentials.  
    - *Connections:* Provides language model capability to AI Agent.  
    - *Edge Cases:* API quota exhaustion, latency issues.

  - **Send message**  
    - *Type:* WhatsApp node to send outgoing messages.  
    - *Config:* Sends the AI Agent’s output as the message body to the phone number of the incoming WhatsApp message (`{{$('WhatsApp Trigger').item.json.messages[0].from}}`). Requires sender phone number ID.  
    - *Credentials:* WhatsApp API credentials required.  
    - *Edge Cases:* Message send failures, invalid recipient numbers.

- **Sticky Note:**  
  *“AI Retrieval & Response Logic: The AI Agent retrieves relevant vectors from Pinecone and uses them as context to generate accurate answers through RAG.”*

---

### 3. Summary Table

| Node Name                  | Node Type                                    | Functional Role                               | Input Node(s)             | Output Node(s)         | Sticky Note                                                                                          |
|----------------------------|----------------------------------------------|-----------------------------------------------|---------------------------|------------------------|----------------------------------------------------------------------------------------------------|
| Google Drive Trigger        | Google Drive Trigger                         | Watches Google Drive for file updates          | -                         | Download file          |                                                                                                    |
| Download file              | Google Drive                                 | Downloads the triggered file                    | Google Drive Trigger       | Pinecone Vector Store   |                                                                                                    |
| Recursive Character Text Splitter1 | LangChain Text Splitter                  | Splits document text into chunks                | -                         | Default Data Loader     |                                                                                                    |
| Default Data Loader         | LangChain Document Loader                    | Loads and prepares document chunks              | Recursive Character Text Splitter1 | Pinecone Vector Store | *Document Processing & Embeddings:* Processes uploaded Drive files, splits text into chunks, creates embeddings with OpenAI, and stores them in the Pinecone vector index. |
| Embeddings OpenAI1          | LangChain Embeddings OpenAI                  | Generates vector embeddings from text chunks    | Default Data Loader        | Pinecone Vector Store   |                                                                                                    |
| Pinecone Vector Store       | Pinecone Vector Store (Insert)               | Inserts embeddings into Pinecone index           | Embeddings OpenAI1, Download file, Default Data Loader | -                |                                                                                                    |
| WhatsApp Trigger            | WhatsApp Trigger                             | Listens for incoming WhatsApp messages          | -                         | AI Agent               | *WhatsApp Message Flow:* Receives incoming WhatsApp messages, sends the query to the AI Agent, and returns the generated answer to the user. |
| AI Agent                   | LangChain AI Agent                           | Processes user query, retrieves context, generates answer | WhatsApp Trigger, Pinecone Vector Store1, Simple Memory, Google Gemini Chat Model | Send message          | *AI Retrieval & Response Logic:* The AI Agent retrieves relevant vectors from Pinecone and uses them as context to generate accurate answers through RAG. |
| Pinecone Vector Store1      | Pinecone Vector Store (Retrieve)              | Retrieves relevant vectors from Pinecone        | Embeddings OpenAI          | AI Agent               |                                                                                                    |
| Simple Memory               | LangChain Memory Buffer                      | Maintains session conversational context        | -                         | AI Agent               |                                                                                                    |
| Google Gemini Chat Model    | LangChain Language Model (Google Gemini)    | Provides natural language generation            | -                         | AI Agent               |                                                                                                    |
| Send message                | WhatsApp                                     | Sends AI-generated response back to user        | AI Agent                  | -                      |                                                                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Drive Trigger Node:**  
   - Type: Google Drive Trigger  
   - Configure to poll every minute ("everyMinute").  
   - Set to trigger on a specific file by its ID (e.g., `1qz6aQrwo6LyWhPLlij-v0RZE4DtZe85L`).  
   - Connect Google Drive OAuth2 credentials.

2. **Create Download file Node:**  
   - Type: Google Drive (download operation)  
   - Set fileId parameter dynamically: `={{ $json.id }}` from Google Drive Trigger output.  
   - Connect Google Drive OAuth2 credentials.  
   - Connect "Google Drive Trigger" output to this node’s input.

3. **Create Recursive Character Text Splitter Node:**  
   - Type: LangChain Recursive Character Text Splitter  
   - Configure chunkSize: 100 characters  
   - Configure chunkOverlap: 20 characters

4. **Create Default Data Loader Node:**  
   - Type: LangChain Default Data Loader  
   - Set dataType to binary (to accept the downloaded PDF).  
   - Use custom text splitting mode.  
   - Add metadata field "file-name" with value from `={{ $('Download file').item.json.name }}`.  
   - Connect Recursive Character Text Splitter output to this node’s input.

5. **Create Embeddings OpenAI Node (Embeddings OpenAI1):**  
   - Type: LangChain Embeddings OpenAI  
   - Set embedding dimensions to 512.  
   - Connect OpenAI API credentials.  
   - Connect Default Data Loader output to this node’s input.

6. **Create Pinecone Vector Store Node (Insert Mode):**  
   - Type: Pinecone Vector Store  
   - Set mode to "insert".  
   - Select or specify Pinecone index name (e.g., "restaurant").  
   - Connect Pinecone API credentials.  
   - Connect Embeddings OpenAI1 output and also connect Download file and Default Data Loader outputs as document and embedding inputs.

7. **Create WhatsApp Trigger Node:**  
   - Type: WhatsApp Trigger  
   - Configure webhook to listen for message updates.  
   - Connect WhatsApp API credentials.

8. **Create Pinecone Vector Store Node (Retrieve Mode):**  
   - Type: Pinecone Vector Store  
   - Set mode to "retrieve-as-tool".  
   - Set topK to 5 (number of results to retrieve).  
   - Use the same Pinecone index as above.  
   - Add a descriptive toolDescription explaining its purpose.  
   - Connect Pinecone API credentials.

9. **Create Simple Memory Node:**  
   - Type: LangChain Memory Buffer Window  
   - Set sessionKey to "1" (or another unique session identifier).

10. **Create Google Gemini Chat Model Node:**  
    - Type: LangChain LM Chat Google Gemini  
    - Connect Google Palm API credentials.

11. **Create AI Agent Node:**  
    - Type: LangChain AI Agent  
    - Set prompt text to: `"User : {{ $json.messages[0].text.body }}"`.  
    - Configure system message with the instructions to use only retrieved context, speak naturally, keep responses short, and avoid guessing.  
    - Connect inputs:  
      - Main input from WhatsApp Trigger.  
      - ai_tool input from Pinecone Vector Store (Retrieve).  
      - ai_memory input from Simple Memory.  
      - ai_languageModel input from Google Gemini Chat Model.  
    - Connect output to "Send message" node.

12. **Create Send message Node:**  
    - Type: WhatsApp (send message)  
    - Set textBody to `={{ $json.output }}` (the AI Agent’s generated answer).  
    - Set recipientPhoneNumber to `={{ $('WhatsApp Trigger').item.json.messages[0].from }}`.  
    - Input sender phone number ID in the parameters.  
    - Connect WhatsApp API credentials.

13. **Wire connections:**  
    - Google Drive Trigger → Download file  
    - Download file → Default Data Loader & Pinecone Vector Store (Insert)  
    - Recursive Character Text Splitter → Default Data Loader  
    - Default Data Loader → Embeddings OpenAI1  
    - Embeddings OpenAI1 → Pinecone Vector Store (Insert)  
    - WhatsApp Trigger → AI Agent  
    - Pinecone Vector Store (Retrieve) → AI Agent (ai_tool)  
    - Simple Memory → AI Agent (ai_memory)  
    - Google Gemini Chat Model → AI Agent (ai_languageModel)  
    - AI Agent → Send message

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                              | Context or Link                                                                                                          |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| This workflow creates a RAG-based WhatsApp chatbot using your own documents. Upload PDFs to Google Drive to build the knowledge base, then ask questions via WhatsApp for context-aware answers. | Sticky Note content overview from the workflow’s documentation.                                                          |
| Setup Steps: Connect Google Drive, Pinecone API + index, OpenAI API for embeddings, WhatsApp trigger and sender nodes, configure AI Agent with the model, upload test docs, and verify.       | Found in the initial Sticky Note for user guidance.                                                                       |
| Pinecone is used as the vector store for semantic search; ensure proper API keys and index creation. OpenAI embeddings require API key with usage quota.                                   | API and credential setup best practices.                                                                                   |
| Google Gemini (PaLM) is used for natural language generation; requires Google Palm API credentials and appropriate quota.                                                                  | Model selection note; alternative LLMs can be substituted if needed.                                                      |
| WhatsApp integration requires webhook setup and valid phone number IDs for sending and receiving messages.                                                                                 | WhatsApp API documentation and webhook configuration.                                                                     |

---

**Disclaimer:** The provided text is exclusively derived from an automated workflow created with n8n, an integration and automation tool. The process strictly adheres to content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.