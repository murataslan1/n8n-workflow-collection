Automate a 'Chat with your PDF' Bot on Telegram with Google Gemini & Pinecone

https://n8nworkflows.xyz/workflows/automate-a--chat-with-your-pdf--bot-on-telegram-with-google-gemini---pinecone-10077


# Automate a 'Chat with your PDF' Bot on Telegram with Google Gemini & Pinecone

---

### 1. Workflow Overview

This workflow automates a "Chat with your PDF" bot on Telegram, leveraging Google Gemini AI models and Pinecone vector database for Retrieval-Augmented Generation (RAG). It enables Telegram users to upload PDF documents, which are then processed, indexed, and made searchable via natural language queries through the chat interface.

Logical blocks:

- **1.1 Trigger & Input Routing:** Listens to Telegram messages and routes them based on whether the input is a document or plain text.
- **1.2 Document Processing & Indexing:** Downloads and converts uploaded PDFs, splits text into chunks, generates embeddings using Google Gemini, and indexes them into Pinecone.
- **1.3 Query Processing & Answer Generation:** For text queries, retrieves relevant document chunks from Pinecone and generates context-aware answers using Google Gemini Chat.
- **1.4 Telegram Responses & Error Handling:** Sends responses back to users and manages errors gracefully.

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger & Input Routing

- **Overview:**  
  This block listens to incoming Telegram messages and determines if the message contains a document (PDF upload) or plain text question, routing accordingly.

- **Nodes Involved:**  
  - Telegram Message Trigger  
  - Check If is a document (If)  
  - Sticky Notes (for documentation)

- **Node Details:**

  - **Telegram Message Trigger**  
    - Type: Telegram Trigger  
    - Role: Starts the workflow on any message received by the Telegram bot.  
    - Config: Listens for "message" updates only.  
    - Inputs: Telegram webhook  
    - Outputs: Message JSON containing text or document  
    - Failure modes: Telegram API connectivity, webhook registration errors  
    - Credentials: Telegram API OAuth2 credentials

  - **Check If is a document**  
    - Type: If  
    - Role: Checks if the incoming Telegram message contains a `document` object.  
    - Config: Condition tests if `$json.message.document` exists (strict validation).  
    - Inputs: Output from Telegram Message Trigger  
    - Outputs: Two branches: TRUE (document uploaded), FALSE (text message)  
    - Edge cases: Messages with no document or malformed JSON may cause false negatives.

---

#### 2.2 Document Processing & Indexing

- **Overview:**  
  Processes uploaded PDFs by downloading the file, adjusting binary metadata, loading and splitting the document text, generating embeddings, and inserting them into Pinecone vector database.

- **Nodes Involved:**  
  - Telegram get File  
  - Change to application/pdf  
  - Default Data Loader  
  - Recursive Character Text Splitter  
  - Embeddings Google Gemini  
  - Pinecone Vector Store  
  - Limit to 1  
  - Telegram Response about Database  
  - Stop and Error1  
  - Sticky Notes (for documentation)

- **Node Details:**

  - **Telegram get File**  
    - Type: Telegram Node (File resource)  
    - Role: Downloads the uploaded document file from Telegram servers.  
    - Config: Uses `file_id` from message.document to fetch file.  
    - Inputs: TRUE branch from "Check If is a document" node  
    - Outputs: Binary file data  
    - Credentials: Telegram API OAuth2  
    - Failure types: File not found, Telegram API errors

  - **Change to application/pdf**  
    - Type: Code (JavaScript)  
    - Role: Ensures the downloaded file metadata correctly identifies it as PDF.  
    - Config: Modifies binary metadata to set MIME type and filename extension to `.pdf`.  
    - Inputs: Output from "Telegram get File"  
    - Outputs: Modified binary file metadata  
    - Edge cases: Files without binary data or unexpected formats

  - **Default Data Loader**  
    - Type: Langchain Document Loader  
    - Role: Loads the PDF document content from binary data for text processing.  
    - Config: Reads data as binary; uses default loader for PDF.  
    - Inputs: Output from "Recursive Character Text Splitter" (text chunks)  
    - Outputs: Document text ready for embeddings  
    - Edge cases: Corrupt or unreadable PDFs

  - **Recursive Character Text Splitter**  
    - Type: Langchain Text Splitter  
    - Role: Splits large document text into chunks for embedding.  
    - Config: Chunk size = 3000 characters; overlap = 200 characters for context continuity.  
    - Inputs: Document text from "Default Data Loader"  
    - Outputs: Array of text chunks  
    - Edge cases: Very small documents may result in single chunk; large chunk sizes may impact performance

  - **Embeddings Google Gemini**  
    - Type: Langchain Embeddings Node (Google Gemini)  
    - Role: Converts text chunks into vector embeddings.  
    - Config: Model name `models/gemini-embedding-001`  
    - Inputs: Text chunks from "Recursive Character Text Splitter"  
    - Outputs: Vector embeddings for each chunk  
    - Credentials: Google Palm API (Gemini)  
    - Edge cases: API rate limits, invalid credentials, model access issues

  - **Pinecone Vector Store**  
    - Type: Langchain Vector Store (Pinecone)  
    - Role: Inserts the embeddings into the Pinecone index named "telegram".  
    - Config: Mode set to `insert`  
    - Inputs: Embeddings from "Embeddings Google Gemini"  
    - Outputs: Confirmation of insert operation  
    - Credentials: Pinecone API key  
    - Edge cases: Index not found, API quota exceeded, network errors

  - **Limit to 1**  
    - Type: Limit  
    - Role: Passes only the first item downstream, used to limit the response size.  
    - Inputs: Output from "Pinecone Vector Store"  
    - Outputs: Single confirmation item  
    - Edge cases: Zero items could cause downstream issues

  - **Telegram Response about Database**  
    - Type: Telegram Node  
    - Role: Sends a confirmation message to the user indicating how many PDF pages were saved.  
    - Config: Sends text like `{{ $json.metadata.pdf.totalPages }} pages saved on Pinecone`.  
    - Inputs: Output from "Limit to 1"  
    - Outputs: Message sent to Telegram chat  
    - Credentials: Telegram API OAuth2  
    - Edge cases: Missing metadata, Telegram message failures

  - **Stop and Error1**  
    - Type: Stop and Error  
    - Role: Terminates workflow on error during indexing confirmation.  
    - Config: Error message "An error occurred."  
    - Inputs: Error branch from "Telegram Response about Database"  
    - Outputs: Workflow stops with error

---

#### 2.3 Query Processing & Answer Generation

- **Overview:**  
  Handles plain text questions by retrieving relevant document chunks from Pinecone and generating context-aware answers using Google Gemini Chat model, formatting the response for Telegram.

- **Nodes Involved:**  
  - Question and Answer Chain  
  - Vector Store Retriever  
  - Pinecone Vector Store1  
  - Embeddings Google Gemini1  
  - Google Gemini Chat Model  
  - Telegram Response  
  - Stop and Error  
  - Sticky Notes (for documentation)

- **Node Details:**

  - **Pinecone Vector Store1**  
    - Type: Langchain Vector Store (Pinecone)  
    - Role: Provides the vector store backend for retrieval.  
    - Config: Index "telegram", mode `list` (read-only)  
    - Inputs: Embeddings from "Embeddings Google Gemini1"  
    - Outputs: Vector store object for retrieval  
    - Credentials: Pinecone API  
    - Edge cases: Index not found, connectivity issues

  - **Embeddings Google Gemini1**  
    - Type: Langchain Embeddings Node (Google Gemini)  
    - Role: Generates embeddings for the user's query text.  
    - Config: Model `models/gemini-embedding-001`  
    - Inputs: User's question text from Telegram message  
    - Outputs: Query embeddings  
    - Credentials: Google Palm API  
    - Edge cases: API limits, invalid input text

  - **Vector Store Retriever**  
    - Type: Langchain Retriever  
    - Role: Retrieves top relevant documents from Pinecone based on query embeddings.  
    - Config: Default retrieval options  
    - Inputs: Vector store from "Pinecone Vector Store1" and query embeddings  
    - Outputs: Retrieved context documents for answer generation  
    - Edge cases: No matching documents found, API errors

  - **Google Gemini Chat Model**  
    - Type: Langchain Chat Model (Google Gemini)  
    - Role: Generates natural language answer based on retrieved context and user question.  
    - Config: Uses Google Gemini chat API  
    - Inputs: User question and retrieved context from "Vector Store Retriever"  
    - Outputs: Contextual answer text formatted per prompt instructions  
    - Credentials: Google Palm API  
    - Edge cases: Model timeouts, malformed prompts

  - **Question and Answer Chain**  
    - Type: Langchain Retrieval QA Chain  
    - Role: Core RAG engine that integrates retriever and chat model to produce final answer.  
    - Config:  
      - Prompt enforces answer ONLY using retrieved context.  
      - Response format: Telegram HTML Parse Mode with `<b>` tags and newline `\n`.  
    - Inputs: User question JSON, retriever, and language model outputs  
    - Outputs: Formatted answer text JSON  
    - Edge cases: Missing context, prompt evaluation errors

  - **Telegram Response**  
    - Type: Telegram Node  
    - Role: Sends the generated answer back to the Telegram user.  
    - Config:  
      - Text input: `={{ $json.response.text }}` from QA Chain  
      - Parse mode: HTML (to render bold tags and newlines correctly)  
    - Inputs: Output from "Question and Answer Chain"  
    - Outputs: Telegram message sent  
    - Credentials: Telegram API  
    - Edge cases: Message delivery failures

  - **Stop and Error**  
    - Type: Stop and Error  
    - Role: Stops workflow on error in response sending.  
    - Config: Error message "An error occurred"  
    - Inputs: Error branch from "Telegram Response"  
    - Outputs: Workflow termination on failure

---

#### 2.4 Telegram Responses & Error Handling

- **Overview:**  
  Manages user feedback and error handling by sending appropriate Telegram messages and stopping workflow execution on errors.

- **Nodes Involved:**  
  - Telegram Response about Database  
  - Telegram Response  
  - Stop and Error  
  - Stop and Error1

- **Node Details:**  

  - See nodes detailed above in blocks 2.2 and 2.3. These nodes ensure the user is informed of indexing success or answer delivery, and the workflow stops with clear error messages on failure.

---

### 3. Summary Table

| Node Name                   | Node Type                                      | Functional Role                | Input Node(s)             | Output Node(s)                  | Sticky Note                                                                                                                                                                  |
|-----------------------------|------------------------------------------------|-------------------------------|---------------------------|-------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Telegram Message Trigger     | Telegram Trigger                               | Entry point, listens to messages | None                      | Check If is a document          | ## 1. **Trigger & Router** This node is the starting point. It listens for *any* message on Telegram bot. Outputs text or document to next node.                              |
| Check If is a document       | If                                             | Routes based on message type    | Telegram Message Trigger   | Telegram get File (TRUE branch), Question and Answer Chain (FALSE branch) | ## 2. **Router Node** Checks if message contains a document; routes accordingly to indexing or query.                                                                          |
| Telegram get File            | Telegram (File resource)                        | Downloads uploaded PDF          | Check If is a document     | Change to application/pdf       |                                                                                                                                                                              |
| Change to application/pdf    | Code (JavaScript)                              | Adjusts binary metadata to PDF | Telegram get File          | Pinecone Vector Store           |                                                                                                                                                                              |
| Default Data Loader          | Langchain Document Loader                      | Loads PDF content from binary  | Recursive Character Text Splitter | Pinecone Vector Store        | ## 5. **Text Splitter** Breaks large PDF text into chunks for indexing, configured for RAG accuracy.                                                                          |
| Recursive Character Text Splitter | Langchain Text Splitter                   | Splits document text into chunks | Default Data Loader        | Default Data Loader             |                                                                                                                                                                              |
| Embeddings Google Gemini     | Langchain Embeddings (Google Gemini)           | Creates embeddings from chunks | Recursive Character Text Splitter | Pinecone Vector Store         | ## 4. **Embeddings (Indexing)** Converts text chunks into vectors using Gemini embedding model.                                                                               |
| Pinecone Vector Store        | Langchain Vector Store (Pinecone)              | Inserts embeddings into index  | Embeddings Google Gemini   | Limit to 1                     | ## 6. **Vector Store: Indexing** Inserts embeddings into Pinecone index 'telegram'.                                                                                           |
| Limit to 1                  | Limit                                           | Limits output to one item      | Pinecone Vector Store      | Telegram Response about Database |                                                                                                                                                                              |
| Telegram Response about Database | Telegram Message                           | Sends indexing confirmation   | Limit to 1                | Stop and Error1                | ## 8. **Final Telegram Response** Sends confirmation of pages saved to Pinecone.                                                                                              |
| Stop and Error1             | Stop and Error                                  | Stops workflow on error        | Telegram Response about Database (error branch) | None                         |                                                                                                                                                                              |
| Question and Answer Chain    | Langchain Retrieval QA Chain                    | Generates answer from context  | Check If is a document (FALSE branch), Vector Store Retriever | Telegram Response          | ## 7. **Core RAG Engine** Produces context-based answer strictly using retrieved documents with Telegram HTML formatting.                                                    |
| Pinecone Vector Store1       | Langchain Vector Store (Pinecone)              | Vector store for retrieval     | Embeddings Google Gemini1  | Vector Store Retriever          |                                                                                                                                                                              |
| Embeddings Google Gemini1    | Langchain Embeddings (Google Gemini)           | Embeds user query text        | Question and Answer Chain  | Pinecone Vector Store1         |                                                                                                                                                                              |
| Vector Store Retriever       | Langchain Retriever                            | Retrieves relevant vectors     | Pinecone Vector Store1     | Question and Answer Chain       |                                                                                                                                                                              |
| Google Gemini Chat Model     | Langchain Chat Model (Google Gemini)            | Generates answer text          | Vector Store Retriever     | Question and Answer Chain       |                                                                                                                                                                              |
| Telegram Response            | Telegram Message                               | Sends answer back to user      | Question and Answer Chain  | Stop and Error                 | ## 8. **Final Telegram Response** Sends LLM answer with HTML parse mode for formatting.                                                                                       |
| Stop and Error              | Stop and Error                                  | Stops workflow on error        | Telegram Response (error branch) | None                         |                                                                                                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Message Trigger**  
   - Type: Telegram Trigger  
   - Configure webhook to listen for `"message"` updates.  
   - Set Telegram OAuth2 credentials.  

2. **Add "Check If is a document" Node (If)**  
   - Condition: Check if `$json.message.document` exists (object exists).  
   - Connect output of Telegram Trigger to this node.  

3. **Document Upload Path (TRUE branch):**

   3.1. **Add "Telegram get File" Node**  
        - Type: Telegram (File resource)  
        - Parameter: Set `fileId` to `{{$json.message.document.file_id}}`.  
        - Credentials: Telegram OAuth2.  
        - Connect from TRUE branch of If node.  

   3.2. **Add "Change to application/pdf" Node (Code)**  
        - JavaScript code to modify binary data metadata: set MIME type to `application/pdf`, ensure filename ends with `.pdf`.  
        - Connect from "Telegram get File".

   3.3. **Add "Recursive Character Text Splitter" Node**  
        - Type: Langchain Text Splitter  
        - Parameters: Chunk size = 3000, Overlap = 200.  
        - Connect from "Change to application/pdf".

   3.4. **Add "Default Data Loader" Node**  
        - Type: Langchain Document Default Data Loader  
        - Data type: Binary.  
        - Connect from "Recursive Character Text Splitter".

   3.5. **Add "Embeddings Google Gemini" Node**  
        - Type: Langchain Embeddings (Google Gemini)  
        - Model: `models/gemini-embedding-001`.  
        - Credentials: Google Palm API OAuth2.  
        - Connect from "Default Data Loader".

   3.6. **Add "Pinecone Vector Store" Node**  
        - Type: Langchain Vector Store (Pinecone)  
        - Mode: Insert  
        - Index name: `telegram`.  
        - Credentials: Pinecone API key.  
        - Connect from "Embeddings Google Gemini".

   3.7. **Add "Limit to 1" Node**  
        - Type: Limit  
        - Connect from "Pinecone Vector Store".

   3.8. **Add "Telegram Response about Database" Node**  
        - Type: Telegram Message  
        - Text: `={{ $json.metadata.pdf.totalPages }} pages saved on Pinecone`.  
        - Chat ID: `={{ $json.message.chat.id }}` (from Telegram Trigger).  
        - Credentials: Telegram OAuth2.  
        - Connect from "Limit to 1".

   3.9. **Add "Stop and Error1" Node**  
        - Type: Stop and Error  
        - Error message: "An error occurred."  
        - Connect from error output of "Telegram Response about Database".

4. **Text Query Path (FALSE branch):**

   4.1. **Add "Embeddings Google Gemini1" Node**  
        - Type: Langchain Embeddings (Google Gemini)  
        - Model: `models/gemini-embedding-001`.  
        - Credentials: Google Palm API OAuth2.  
        - Connect from FALSE branch of "Check If is a document".

   4.2. **Add "Pinecone Vector Store1" Node**  
        - Type: Langchain Vector Store (Pinecone)  
        - Mode: List (read-only)  
        - Index: `telegram`  
        - Credentials: Pinecone API.  
        - Connect from "Embeddings Google Gemini1".

   4.3. **Add "Vector Store Retriever" Node**  
        - Type: Langchain Retriever Vector Store  
        - Connect from "Pinecone Vector Store1".

   4.4. **Add "Google Gemini Chat Model" Node**  
        - Type: Langchain Chat Model (Google Gemini)  
        - Credentials: Google Palm API OAuth2.  
        - Connect from "Vector Store Retriever".

   4.5. **Add "Question and Answer Chain" Node**  
        - Type: Langchain Retrieval QA Chain  
        - Parameters:  
          - Prompt enforces answer ONLY using retrieved context.  
          - Format output for Telegram HTML parse mode (`<b>`, `\n`).  
        - Connect main input from FALSE branch of "Check If is a document".  
        - Connect retriever input from "Vector Store Retriever".  
        - Connect language model input from "Google Gemini Chat Model".

   4.6. **Add "Telegram Response" Node**  
        - Type: Telegram Message  
        - Text: `={{ $json.response.text }}` (output from QA Chain)  
        - Chat ID: `={{ $json.message.chat.id }}` (from Telegram Trigger)  
        - Parse Mode: HTML  
        - Credentials: Telegram OAuth2.  
        - Connect from "Question and Answer Chain".

   4.7. **Add "Stop and Error" Node**  
        - Type: Stop and Error  
        - Error message: "An error occurred"  
        - Connect from error output of "Telegram Response".

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                    | Context or Link                                                                                   |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| The workflow enforces strict formatting rules in responses to comply with Telegram's HTML Parse Mode, using `<b>` tags for emphasis and `\n` for line breaks instead of HTML tags. | Important for correct text rendering in Telegram messages.                                      |
| Pinecone index name is fixed as "telegram" for storing vector embeddings. Ensure your Pinecone project has this index created before running the workflow.                      | Pinecone dashboard: https://app.pinecone.io/                                                    |
| Google Gemini API credentials require access to the models `models/gemini-embedding-001` and chat API. Setup is needed in Google Cloud Console for Palm API access.             | Google Cloud Palm API: https://cloud.google.com/palm                                            |
| Telegram bot credentials must be configured with a bot token that has access to the chat and file APIs. Ensure webhook URLs are correctly registered in Telegram BotFather.    | Telegram Bot API docs: https://core.telegram.org/bots/api                                      |
| The workflow uses Langchain nodes for document loading, splitting, embedding, and chat integration, assuming n8n version supports these nodes (n8n v0.2023+ recommended).         | Verify Langchain node versions in n8n marketplace.                                              |
| The code node for changing MIME type expects that the Telegram file download produces binary data under `binary.data`. Ensure this field exists to avoid runtime errors.        |                                                                                                 |
| Error nodes stop the workflow with a clear message, but the Telegram response nodes are configured to continue on error to avoid complete workflow failure.                     | This allows partial failure management and graceful user experience.                            |

---

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

---