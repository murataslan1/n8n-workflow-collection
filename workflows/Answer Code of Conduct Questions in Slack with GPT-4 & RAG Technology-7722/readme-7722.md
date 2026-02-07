Answer Code of Conduct Questions in Slack with GPT-4 & RAG Technology

https://n8nworkflows.xyz/workflows/answer-code-of-conduct-questions-in-slack-with-gpt-4---rag-technology-7722


# Answer Code of Conduct Questions in Slack with GPT-4 & RAG Technology

### 1. Workflow Overview

This workflow implements a Retrieval-Augmented Generation (RAG) powered Slack chatbot designed to answer employee questions about the company’s Code of Conduct. It enables HR and compliance teams to automate policy-related inquiries and provides employees quick, AI-generated responses directly within Slack. The workflow leverages GPT-4 for natural language understanding, an embedded vector store for document retrieval, and integrates Slack, OpenAI, and Google Drive.

The workflow is logically divided into two main functional blocks:

- **1.1 Document Upload & Embedding Pipeline:**  
  Handles uploading the official Code of Conduct PDF, parsing it, generating vector embeddings using OpenAI, storing those embeddings in an in-memory vector store, and backing up the document to Google Drive.

- **1.2 Slack Chatbot Query Processing:**  
  Listens for user messages in Slack via a webhook, filters valid user queries, runs a GPT-4-based agent with RAG to answer questions using the embedded Code of Conduct data, fetches user info for personalization, and posts the response back into the Slack channel.

---

### 2. Block-by-Block Analysis

#### 2.1 Document Upload & Embedding Pipeline

**Overview:**  
This block enables HR or admin users to upload the Code of Conduct PDF via an n8n form node. The PDF is parsed, chunked, and embedded into vector representations using OpenAI embeddings. These vectors are stored in an in-memory vector store for fast retrieval during chatbot queries. The original document is also backed up to a designated Google Drive folder.

**Nodes Involved:**  
- Upload your PDF document here (formTrigger)  
- Default Data Loader (documentDefaultDataLoader)  
- Insert Data to Store (vectorStoreInMemory)  
- Code (code)  
- Embeddings OpenAI (embeddingsOpenAi)  
- Backup document(s) to Google Drive (googleDrive)

**Node Details:**

- **Upload your PDF document here**  
  - Type: Form Trigger (HTTP webhook with form)  
  - Role: Entry point for uploading PDF files through a form interface.  
  - Config: Accepts `.pdf` files only, required field.  
  - Input/Output: Receives uploaded file(s) binary, outputs to parsing nodes.  
  - Edge Cases: File type validation failure, large file upload timeouts.  

- **Default Data Loader**  
  - Type: Document Data Loader (LangChain)  
  - Role: Parses the uploaded PDF binary content into structured text chunks for embedding.  
  - Config: Uses default parsing with binary input.  
  - Input: Binary PDF from form trigger (passed through Code node).  
  - Output: Structured document chunks.  
  - Edge Cases: Parsing errors if PDF corrupted or non-text content.  

- **Code**  
  - Type: Code Node (JavaScript)  
  - Role: Extracts and forwards binary data labeled with prefix `CV_` from input for further processing.  
  - Config: Custom JS script that filters binary data keys.  
  - Input: Uploaded file binary and metadata.  
  - Output: Individual binary items for each document chunk.  
  - Edge Cases: No binary data with expected prefix results in empty output.  

- **Embeddings OpenAI**  
  - Type: OpenAI Embedding Node (LangChain)  
  - Role: Converts document chunks into vector embeddings by calling OpenAI Embedding API.  
  - Config: Uses OpenAI credentials, default embedding options.  
  - Input: Document chunks from Data Loader.  
  - Output: Vector embeddings for each chunk.  
  - Edge Cases: API rate limits, network errors, invalid input format.  

- **Insert Data to Store**  
  - Type: Vector Store Node (in-memory)  
  - Role: Inserts generated embeddings into an in-memory vector store under a named memory key.  
  - Config: Mode set to 'insert', memory key named `vector_store_key`.  
  - Input: Embeddings from previous node.  
  - Output: Confirmation of data insertion.  
  - Edge Cases: Memory overflow, data corruption.  

- **Backup document(s) to Google Drive**  
  - Type: Google Drive Node  
  - Role: Saves uploaded PDFs into a specified Google Drive folder as backups.  
  - Config: File named with timestamp and original filename, saved under folder ID `1ObNNVJFR2vcKqP8p-ZnX_eaZy4gBHgha`.  
  - Input: Uploaded binary PDF from Code node output.  
  - Output: Google Drive file metadata.  
  - Edge Cases: Authentication errors, quota exceeded, network failures.  

---

#### 2.2 Slack Chatbot Query Processing

**Overview:**  
This block listens for Slack user messages via a webhook, filters out irrelevant events, processes user questions through a GPT-4 based AI agent augmented with document retrieval (RAG), and posts formatted answers back to the Slack channel, personalized with user details.

**Nodes Involved:**  
- Webhook (webhook)  
- Is user message? (if)  
- No Operation, do nothing (noOp)  
- Code Of Conduct Agent (agent)  
- Query Data Tool (vectorStoreInMemory, retrieve-as-tool)  
- gpt4-1 model (lmChatOpenAi)  
- Get information about a user (Slack)  
- Send result in the mentioned channel (Slack)

**Node Details:**

- **Webhook**  
  - Type: Webhook Trigger  
  - Role: Entry point, receives Slack events as POST requests.  
  - Config: Path set to unique webhook ID for Slack event subscription, HTTP POST method, response mode set to last node output.  
  - Input: Slack event JSON payload.  
  - Output: Event data forwarded for filtering.  
  - Edge Cases: Missing/invalid Slack tokens, malformed events, webhook URL misconfiguration.  

- **Is user message?**  
  - Type: If node  
  - Role: Filters incoming events to process only user-generated messages (event type existence check).  
  - Config: Checks if `body.event.type` exists and is non-empty (indicating a user message event).  
  - Input: Webhook event data.  
  - Output: Routes valid user messages to AI agent, others to No Operation.  
  - Edge Cases: Slack system messages, bot messages, or events without `event.type`.  

- **No Operation, do nothing**  
  - Type: No Operation  
  - Role: Sink node for non-user message events, halts further processing.  

- **Code Of Conduct Agent**  
  - Type: LangChain Agent Node  
  - Role: Main AI chat agent combining GPT-4 and a retrieval tool to answer user inquiries based on embedded Code of Conduct data.  
  - Config:  
    - Model: GPT-4 (via linked `gpt4-1 model` node)  
    - Tools: Uses `Query Data Tool` for vector store retrieval  
    - System Message: Provides assistant instructions to answer clearly and professionally, referencing document sections, and avoiding hallucinations  
    - User Prompt: Injects Slack user’s message text dynamically  
    - Output Parser: Enabled for structured output  
  - Input: Valid user message JSON from If node.  
  - Output: Formatted AI-generated response text in Slack Markdown.  
  - Edge Cases: OpenAI API errors, empty or irrelevant queries, retrieval failures.  

- **Query Data Tool**  
  - Type: Vector Store Retrieval Tool (in-memory)  
  - Role: Retrieves relevant embedded chunks from the vector store using user query as prompt context.  
  - Config:  
    - Mode: retrieve-as-tool  
    - Tool Name: `knowledge_base`  
    - Memory Key: `vector_store_key` (same as insertion)  
    - Tool Description: specifies usage context for the agent  
  - Input: User query text from agent node.  
  - Output: Retrieved relevant document chunks for GPT-4 context.  
  - Edge Cases: Empty vector store, query ambiguity, retrieval timeout.  

- **gpt4-1 model**  
  - Type: OpenAI Chat Language Model (LangChain)  
  - Role: Provides GPT-4 based completions for the agent node.  
  - Config: Model set to "gpt-4.1-mini" variant, uses OpenAI API credentials.  
  - Input: Prompt constructed by agent including system and user messages plus retrieved context.  
  - Output: Generated text completion.  
  - Edge Cases: API quota exhaustion, network issues, prompt size limits.  

- **Get information about a user**  
  - Type: Slack API (users.info)  
  - Role: Fetches user profile and metadata to personalize the chatbot response.  
  - Config: Uses OAuth2 Slack credentials, queries Slack user ID from event payload.  
  - Input: Slack user ID from webhook event.  
  - Output: User details JSON (e.g., display name, ID).  
  - Edge Cases: OAuth token expiry, user not found, permission errors.  

- **Send result in the mentioned channel**  
  - Type: Slack API (chat.postMessage)  
  - Role: Posts the AI-generated answer back into the originating Slack channel, mentioning the user.  
  - Config:  
    - Text: Mentions user ID and includes AI response from `Code Of Conduct Agent` node  
    - Channel: Uses the channel ID from the original Slack event  
    - Format: Slack Markdown enabled for rich formatting  
    - Credentials: Slack Bot token with chat:write permission  
  - Input: User details + AI response.  
  - Output: Confirmation of message sent.  
  - Edge Cases: Insufficient Slack permissions, channel archived, rate limits.  

---

### 3. Summary Table

| Node Name                      | Node Type                          | Functional Role                          | Input Node(s)                       | Output Node(s)                     | Sticky Note                                                                                                                       |
|--------------------------------|----------------------------------|----------------------------------------|-----------------------------------|----------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| Webhook                        | Webhook Trigger                  | Receives Slack event POSTs              | —                                 | Is user message?                  | 1. 🟢 Webhook Trigger (Slack Event) Listens for Slack user messages via POST webhook.                                            |
| Is user message?               | If                              | Filters valid user messages             | Webhook                          | Code Of Conduct Agent, No Operation, do nothing | 2. 🧠 Message Validation Checks if event is a valid user message, else no-op.                                                     |
| No Operation, do nothing       | No Operation                    | Stops processing for invalid events    | Is user message?                  | —                                |                                                                                                                                  |
| Code Of Conduct Agent          | LangChain Agent                 | AI agent answering Code of Conduct Qs  | Is user message?                  | Get information about a user      | 3. 🤖 Code of Conduct Agent (GPT-4 + Query Tool) Combines GPT-4 with RAG retrieval.                                               |
| Query Data Tool                | Vector Store (retrieve-as-tool) | Retrieves relevant document chunks     | Embeddings OpenAI, Insert Data to Store (shared vector store) | Code Of Conduct Agent           |                                                                                                                                  |
| gpt4-1 model                  | OpenAI Chat Model (GPT-4)        | Provides GPT-4 completions              | Code Of Conduct Agent (agent uses) | Code Of Conduct Agent            |                                                                                                                                  |
| Get information about a user   | Slack API (users.info)           | Gets Slack user profile info            | Code Of Conduct Agent             | Send result in the mentioned channel | 5. 💬 Post Response to Slack Fetches user info to personalize reply & posts message back.                                         |
| Send result in the mentioned channel | Slack API (chat.postMessage) | Posts AI response in Slack channel      | Get information about a user      | —                                |                                                                                                                                  |
| Upload your PDF document here  | Form Trigger                    | Input for uploading Code of Conduct PDF | —                                 | Insert Data to Store, Code        | 1. 🟢 Upload PDF Document Allows HR/admin users to upload official Code of Conduct PDF.                                          |
| Code                          | Code                            | Extracts binary data for processing     | Upload your PDF document here     | Backup document(s) to Google Drive | 2. 📑 Parse PDF Content Processes PDF content into structured format.                                                            |
| Default Data Loader            | Document Data Loader (LangChain)| Parses uploaded PDF into text chunks    | Code                           | Insert Data to Store              | 3. 🤖 Parse PDF Content Loads PDF for embedding.                                                                                  |
| Embeddings OpenAI             | OpenAI Embeddings (LangChain)   | Generates vector embeddings from chunks | Default Data Loader              | Insert Data to Store, Query Data Tool | 4. 🧬 Generate Embeddings Generates OpenAI embeddings for document chunks.                                                        |
| Insert Data to Store           | Vector Store In-Memory          | Stores embeddings in memory for RAG     | Embeddings OpenAI, Default Data Loader | Query Data Tool                 |                                                                                                                                  |
| Backup document(s) to Google Drive | Google Drive                   | Saves uploaded PDFs as backup           | Code                           | —                                | 4. ☁️ Backup to Google Drive Saves uploaded PDF backups to Google Drive folder.                                                   |
| Sticky Note                   | Sticky Note                    | Documentation, instructions             | —                                 | —                                | Contains full workflow explanation, setup instructions, and customization notes with video link.                                  |
| Sticky Note1                  | Sticky Note                    | Visual aid / screenshot                  | —                                 | —                                |                                                                                                                                  |
| Sticky Note2                  | Sticky Note                    | Upload PDF doc guidance                   | —                                 | —                                |                                                                                                                                  |
| Sticky Note3                  | Sticky Note                    | PDF parsing explanation                   | —                                 | —                                |                                                                                                                                  |
| Sticky Note4                  | Sticky Note                    | Embedding generation explanation         | —                                 | —                                |                                                                                                                                  |
| Sticky Note5                  | Sticky Note                    | Google Drive backup explanation           | —                                 | —                                |                                                                                                                                  |
| Sticky Note6                  | Sticky Note                    | Webhook trigger explanation                | —                                 | —                                |                                                                                                                                  |
| Sticky Note7                  | Sticky Note                    | Message validation explanation             | —                                 | —                                |                                                                                                                                  |
| Sticky Note8                  | Sticky Note                    | Agent node explanation                      | —                                 | —                                |                                                                                                                                  |
| Sticky Note9                  | Sticky Note                    | Post response explanation                   | —                                 | —                                |                                                                                                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Slack App and Obtain Credentials:**  
   - Setup Slack Bot with required scopes: `chat:write`, `users:read`, `commands`.  
   - Obtain OAuth2 credentials and bot token.

2. **Configure OpenAI Credentials:**  
   - Create OpenAI API key with access to GPT-4 and embedding models.

3. **Configure Google Drive Credentials (optional):**  
   - Setup OAuth2 for Google Drive with write access to backup folder.

4. **Document Upload Pipeline Setup:**

   4.1. Create a **Form Trigger** node named `Upload your PDF document here`:  
       - Set form to accept `.pdf` files only, required.  
       - This node will receive uploaded Code of Conduct PDFs.

   4.2. Add a **Code** node named `Code`:  
       - Paste the JavaScript code to extract binary data from the form upload:  
         ```js
         const data = $input.item.json;
         const binaryData = $input.item.binary;
         let output = [];
         Object.keys(binaryData)
           .filter(label => label.startsWith("CV_"))
           .forEach(label => {
             output.push({
               json: data,
               binary: { data: binaryData[label] }
             });
           });
         return output;
         ```
       - Connect the form trigger output to this node.

   4.3. Add a **Default Data Loader** (LangChain) node named `Default Data Loader`:  
       - Set dataType to binary.  
       - Connect output of `Code` node to this.

   4.4. Add **Embeddings OpenAI** (LangChain) node named `Embeddings OpenAI`:  
       - Use OpenAI credentials.  
       - Connect `Default Data Loader` output here.

   4.5. Add **Insert Data to Store** (vectorStoreInMemory) node named `Insert Data to Store`:  
       - Set mode to `insert`.  
       - Use memory key `vector_store_key`.  
       - Connect outputs from `Embeddings OpenAI` and `Default Data Loader` to this node.

   4.6. Add **Backup document(s) to Google Drive** node:  
       - Configure to upload files with name pattern: `document-{{ $now.toFormat("yyyyLLdd-HHmmss") }}-{{$binary.data.fileName}}`.  
       - Set folder ID to backup folder in Google Drive.  
       - Connect output of `Code` node here.

5. **Slack Chatbot Query Processing Setup:**

   5.1. Add a **Webhook** node named `Webhook`:  
       - Configure POST method with unique webhook path.  
       - This will receive Slack events.

   5.2. Add an **If** node named `Is user message?`:  
       - Condition: Check existence of `body.event.type` field (string exists).  
       - Connect output of `Webhook` to this node.

   5.3. Add a **No Operation** node named `No Operation, do nothing`:  
       - Connect the `false` output of `Is user message?` here.

   5.4. Add a **LangChain Agent** node named `Code Of Conduct Agent`:  
       - Configure system prompt:  
         ```
         You are an AI assistant trained to help employees understand and comply with the company's Code of Conduct...
         ```
       - User prompt dynamically inserts `{{ $json.body.event.text }}`.  
       - Add tool `Query Data Tool` (see next).  
       - Use GPT-4 model node (see next).  
       - Connect `true` output from `Is user message?` here.

   5.5. Add a **Vector Store In-Memory** node named `Query Data Tool`:  
       - Set mode to `retrieve-as-tool`.  
       - Tool name: `knowledge_base`.  
       - Memory key: `vector_store_key`.  
       - Tool description: instructs agent to use for answering questions.  
       - Connect output to `Code Of Conduct Agent` tool input.

   5.6. Add an **OpenAI Chat Model** node named `gpt4-1 model`:  
       - Model: `gpt-4.1-mini` or equivalent.  
       - Use OpenAI credentials.  
       - Connect as AI language model for `Code Of Conduct Agent`.

   5.7. Add a **Slack** node named `Get information about a user`:  
       - Resource: `user`  
       - Operation: `get`  
       - User ID: `={{ $json.body.event.user }}`  
       - Use Slack OAuth2 credentials.  
       - Connect output of `Code Of Conduct Agent` here.

   5.8. Add a **Slack** node named `Send result in the mentioned channel`:  
       - Operation: `postMessage`  
       - Channel ID: `={{ $json.body.event.channel }}`  
       - Text: `<@{{ $json.id }}> {{ $('Code Of Conduct Agent').item.json.output }}`  
       - Enable markdown formatting.  
       - Use Slack Bot credentials.  
       - Connect output of `Get information about a user` here.

6. **Testing and Deployment:**  
   - Deploy the webhook URL in Slack event subscriptions for message events.  
   - Test uploading the Code of Conduct PDF and querying in Slack channels mentioning the bot.  
   - Monitor logs for errors or failed message processing.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                       | Context or Link                                                                                                           |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| Video demo of the Code of Conduct Q&A Slack chatbot using RAG and GPT-4.                                                                                                                                                                                                                                                                                                                          | https://www.youtube.com/watch?v=2EWgC5UKiBQ                                                                               |
| Sample Slack app manifest to create the bot with required OAuth scopes and event subscriptions.                                                                                                                                                                                                                                                                                                   | https://wisestackai.s3.ap-southeast-1.amazonaws.com/slack_bot_manifest.json                                               |
| Sample Code of Conduct PDF used for testing and demonstration.                                                                                                                                                                                                                                                                                                                                    | https://wisestackai.s3.ap-southeast-1.amazonaws.com/20220419-ingrs-code-of-conduct-policy-en.pdf                            |
| Customization tips: edit prompt style, add multiple PDFs for richer knowledge base, swap embedding/vector store engines, or extend multilingual support by preprocessing Slack metadata.                                                                                                                                                                                                         | Provided in workflow sticky notes.                                                                                        |
| Requirements: n8n self-hosted or cloud, Slack app with proper scopes, OpenAI GPT-4 and embedding API access, Google Drive integration for backup, and uploaded Code of Conduct PDF.                                                                                                                                                                                                                 |                                                                                                                           |

---

**Disclaimer:**  
The provided content is derived exclusively from an automated workflow designed with n8n, adhering strictly to content policies. It contains no illegal, offensive, or protected elements. All processed data is legal and publicly accessible.