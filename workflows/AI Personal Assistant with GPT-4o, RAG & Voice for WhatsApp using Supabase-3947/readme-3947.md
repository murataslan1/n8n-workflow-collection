AI Personal Assistant with GPT-4o, RAG & Voice for WhatsApp using Supabase

https://n8nworkflows.xyz/workflows/ai-personal-assistant-with-gpt-4o--rag---voice-for-whatsapp-using-supabase-3947


# AI Personal Assistant with GPT-4o, RAG & Voice for WhatsApp using Supabase

### 1. Workflow Overview

This workflow implements a sophisticated AI Personal Assistant designed to interact via WhatsApp (and other channels) using GPT-4o, augmented with Retrieval-Augmented Generation (RAG) and voice capabilities. Its main use cases include understanding and responding to user inputs in multiple formats (text, voice, documents, images), managing knowledge bases, scheduling, and memory per user session. It leverages Supabase for vector storage and metadata, PostgreSQL for chat memory, Redis for message buffering, and integrates with external messaging APIs (Evolution API) for WhatsApp.

The workflow is logically organized into the following blocks:

- **1.1 Input Reception & Authentication**: Receives incoming messages (via webhook), authenticates sender, and routes based on message type.
- **1.2 Message Parsing & Preprocessing**: Converts inputs into processable formats (file conversion, extraction, transcription).
- **1.3 Knowledge Base Management & Indexing**: Handles document ingestion, text splitting, embedding generation, and updates the vector store in Supabase.
- **1.4 AI Processing and Intent Handling**: Uses LangChain agents and OpenAI GPT-4o models for intent classification, RAG queries, chat memory, and response generation.
- **1.5 Memory and Prompt Management**: Maintains user session memory in PostgreSQL and manages dynamic prompt updates.
- **1.6 Output & Multi-Channel Response Dispatching**: Sends AI-generated responses back to the user via WhatsApp (Evolution API) and other integrated channels.
- **1.7 Tools & Modular Extensions**: Supports auxiliary workflows for email handling, scheduling, knowledge base add/delete operations.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Authentication

**Overview:**  
This block receives incoming messages through a webhook, authenticates the user (admin or regular), and routes the flow based on message type (text, document, audio, image).

**Nodes Involved:**  
- Webhook  
- config (Set)  
- auth (If)  
- mensagem_tipo (Switch)  
- mensagem_cliente_inicial (Set)  
- Lista Mensagens1 (Redis)  
- Puxar as Mensagens (Redis)  
- If1 (If)  
- Edit Fields / Edit Fields2 (Set)  

**Node Details:**

- **Webhook**  
  - Type: HTTP webhook node to receive incoming messages.  
  - Configured to listen for external API calls (Evolution or WhatsApp API).  
  - Outputs raw incoming data as the initial trigger.  
  - Potential failure: Network errors, invalid webhook path, unauthorized calls.

- **config (Set)**  
  - Sets workflow-wide configuration variables such as admin number, API keys, and flags for admin-only usage.  
  - Input: Webhook output.  
  - Output: Configuration data merged with incoming message.  
  - Edge cases: Missing or misconfigured admin number or API key.

- **auth (If)**  
  - Checks if the incoming message is from an authorized number (admin or allowed user).  
  - Routes unauthorized requests to stop or return error.  
  - Inputs: Config and Webhook data.  
  - Outputs: Authorized messages proceed; unauthorized blocked.  
  - Failure: Authentication logic misfires, causing false positives/negatives.

- **mensagem_tipo (Switch)**  
  - Determines the message type: text, file, audio, image, etc.  
  - Routes accordingly to specialized processing nodes.  
  - Inputs: Auth approved message.  
  - Outputs: Branches for different media types.  
  - Edge cases: Unknown or unsupported media types.

- **mensagem_cliente_inicial (Set)**  
  - Prepares the initial client message object for further processing.  
  - Inputs: Routed message data.  
  - Outputs: Formatted message object.  

- **Lista Mensagens1 / Puxar as Mensagens (Redis)**  
  - Retrieve recent messages or buffers for context or session management.  
  - Inputs: Client identifier.  
  - Outputs: Message history or buffers.  
  - Failure: Redis connectivity issues, data inconsistency.

- **If1 (If)**  
  - Conditional logic to decide further steps based on message contents or state.  
  - Inputs: Message buffers and flags.  
  - Outputs: Routes for processing or waiting.

- **Edit Fields / Edit Fields2 (Set)**  
  - Adjust or enrich message data fields for downstream nodes.

---

#### 1.2 Message Parsing & Preprocessing

**Overview:**  
Converts various input formats to standardized files, extracts text from documents, transcribes audio, and prepares data for embedding or AI analysis.

**Nodes Involved:**  
- Convert to File  
- convert_to_file  
- tipo_arquivo (Switch)  
- extrair_pdf (Extract From File)  
- exportar_texto (Set)  
- base64 (Set)  

**Node Details:**

- **Convert to File / convert_to_file**  
  - Converts incoming raw input (base64, binary) into an n8n file object for processing.  
  - Inputs: Raw message content.  
  - Outputs: Standardized file object.  
  - Failure: Conversion errors if input format is unexpected.

- **tipo_arquivo (Switch)**  
  - Branches processing based on file type (PDF, audio, image, etc.).  
  - Inputs: Converted file.  
  - Outputs: Routes to appropriate extraction or transcription nodes.  
  - Edge cases: Unsupported file types or corrupted files.

- **extrair_pdf (Extract From File)**  
  - Extracts text content from PDF files.  
  - Inputs: PDF file object.  
  - Outputs: Raw text extracted.  
  - Failure: PDFs with complex layouts or encryption.

- **exportar_texto (Set)**  
  - Stores or formats extracted text for embedding.  
  - Inputs: Extracted text.  
  - Outputs: Text ready for embedding or indexing.

- **base64 (Set)**  
  - Handles base64 encoded data preparation for file conversion.

---

#### 1.3 Knowledge Base Management & Indexing

**Overview:**  
Manages ingestion of documents into the knowledge base, including splitting long texts, generating embeddings, and storing/updating vectors in Supabase.

**Nodes Involved:**  
- Recursive Character Text Splitter  
- Default Data Loader  
- Embeddings OpenAI / Embeddings OpenAI1  
- supabase_vectorstore / Supabase Vector Store  
- setar_supabase_tabelas_vectoriais (Postgres)  
- atualizar_lista_de_arquivos (Postgres)  
- criar_cerebro (Postgres)  
- criar_rag_controle (Postgres)  
- deletar_arquivos_antigos (Supabase)  
- deletar_arquivo (Postgres)  
- resumo (Chain LLM)  

**Node Details:**

- **Recursive Character Text Splitter**  
  - Splits documents/texts into manageable chunks for embedding.  
  - Inputs: Large text blocks.  
  - Outputs: Array of text chunks.  
  - Edge cases: Text too short or too long chunks causing performance issues.

- **Default Data Loader**  
  - Loads processed data chunks for embedding and indexing.  
  - Inputs: Split text chunks.  
  - Outputs: Data prepared for embedding generation.

- **Embeddings OpenAI / Embeddings OpenAI1**  
  - Generates vector embeddings via OpenAI Embeddings API.  
  - Inputs: Text chunks.  
  - Outputs: Embedding vectors.  
  - Failure: API limits, authentication errors, malformed input.

- **supabase_vectorstore / Supabase Vector Store**  
  - Stores and updates document embeddings and metadata in Supabase vector DB.  
  - Inputs: Embeddings and metadata.  
  - Outputs: Confirmation of storage.  
  - Failure: DB connectivity, malformed data.

- **setar_supabase_tabelas_vectoriais (Postgres)**  
  - Initializes required Supabase/Postgres tables for vector storage and document metadata.  
  - Inputs: None or setup queries.  
  - Outputs: Table creation confirmation.

- **atualizar_lista_de_arquivos (Postgres)**  
  - Updates metadata and list of indexed files in the database after processing.  
  - Inputs: Document summary or metadata.  
  - Outputs: DB updated state.

- **criar_cerebro (Postgres)**  
  - Sets up prompt or knowledge base related tables or data structures.  

- **criar_rag_controle (Postgres)**  
  - Creates control records for RAG processes, such as summaries and indexing status.

- **deletar_arquivos_antigos (Supabase) / deletar_arquivo (Postgres)**  
  - Removes outdated or replaced files and associated vectors from databases.

- **resumo (Chain LLM)**  
  - Summarizes documents to generate metadata or short descriptions for indexing.

---

#### 1.4 AI Processing and Intent Handling

**Overview:**  
Handles AI-driven processing including intent classification, RAG queries, chat memory integration, and response generation using LangChain agents and OpenAI GPT-4o.

**Nodes Involved:**  
- classificador_de_intencao (Agent)  
- Switch  
- OpenAI Chat Model / OpenAI Chat Model1 / OpenAI Chat Model2  
- RAG (toolVectorStore)  
- recepcionista (Agent)  
- puxar_prompt (Postgres)  
- rag_resumos (Postgres)  
- Postgres Chat Memory / Postgres Chat Memory1  
- Merge / Merge Database Data1 / Merge Database Data2 / Merge Database Data3  
- atualizar_prompt (Execute Workflow)  
- tratamento (Set)  

**Node Details:**

- **classificador_de_intencao (Agent)**  
  - AI agent classifying user intent from input messages.  
  - Inputs: User message text.  
  - Outputs: Intent classification routing.

- **Switch**  
  - Routes processing flow based on classified intent or context.

- **OpenAI Chat Model / Chat Model1 / Chat Model2**  
  - Core GPT-4o models for chat interaction, summarization, and RAG integration.  
  - Inputs: Prompts, retrieved knowledge, chat history.  
  - Outputs: AI-generated responses.  
  - Edge cases: API rate limits, prompt overload, timeout.

- **RAG (toolVectorStore)**  
  - Performs retrieval-augmented generation using vector store for context-aware answers.  
  - Inputs: User query, vector DB embeddings.  
  - Outputs: Contextual AI responses.

- **recepcionista (Agent)**  
  - Main AI agent handling final user interaction, integrating memory, tools, and multi-channel outputs.  
  - Inputs: Combined prompts, context, memory.  
  - Outputs: Final AI response.

- **puxar_prompt (Postgres)**  
  - Fetches dynamic prompt templates or memory entries for AI models.

- **rag_resumos (Postgres)**  
  - Retrieves summaries for RAG context.

- **Postgres Chat Memory / Chat Memory1**  
  - Stores and retrieves chat memory by user session for contextual continuity.

- **Merge / Merge Database Data* Nodes**  
  - Aggregates data from multiple database queries for comprehensive context.

- **atualizar_prompt (Execute Workflow)**  
  - Sub-workflow node to update prompt templates or memory based on interaction.

- **tratamento (Set)**  
  - Final data processing before response dispatch.

---

#### 1.5 Memory and Prompt Management

**Overview:**  
Manages persistent chat memory per user and prompt updates to improve AI contextual awareness and customization.

**Nodes Involved:**  
- Postgres Chat Memory  
- puxar_prompt (Postgres)  
- atualizar_prompt (Execute Workflow)  

**Node Details:**

- **Postgres Chat Memory**  
  - Reads/writes chat session memory to Postgres DB.  
  - Inputs: User ID, conversation data.  
  - Outputs: Retrieved memory or confirmation of write.

- **puxar_prompt**  
  - Fetches current prompt or context specific to the user/session.

- **atualizar_prompt**  
  - Updates prompt templates or user-specific context dynamically via sub-workflow.

---

#### 1.6 Output & Multi-Channel Response Dispatching

**Overview:**  
Sends generated AI responses back to users via WhatsApp and other integrated channels such as Instagram, Facebook, or email.

**Nodes Involved:**  
- recepcionista (Agent)  
- agendamentos (toolWorkflow)  
- emails (toolWorkflow)  
- adicionar_conhecimento (toolWorkflow)  
- buscar_conhecimento (toolWorkflow)  
- excluir_rag_arquivo (toolWorkflow)  
- excluir_conhecimento (toolWorkflow)  

**Node Details:**

- **recepcionista (Agent)**  
  - Final node that dispatches AI-generated responses through selected channels.  
  - Inputs: AI response text, user session info.  
  - Outputs: Messages sent via Evolution API or other connectors.  
  - Failure: API auth errors, message format errors.

- **agendamentos (toolWorkflow)**  
  - Handles calendar events and scheduling integration.  
  - Inputs: Scheduling commands or queries.  
  - Outputs: Calendar updates or confirmations.

- **emails (toolWorkflow)**  
  - Manages sending and searching emails as part of user assistant capabilities.

- **adicionar_conhecimento / buscar_conhecimento / excluir_rag_arquivo / excluir_conhecimento**  
  - Modular workflows to add, search, or delete knowledge base entries or RAG documents.

---

### 3. Summary Table

| Node Name                       | Node Type                                | Functional Role                             | Input Node(s)                  | Output Node(s)                   | Sticky Note                                                                                      |
|--------------------------------|----------------------------------------|---------------------------------------------|-------------------------------|---------------------------------|-------------------------------------------------------------------------------------------------|
| Webhook                        | Webhook                                | Entry point for incoming messages          |                               | config                          |                                                                                                 |
| config                         | Set                                    | Sets configuration and admin parameters    | Webhook                       | auth                           |                                                                                                 |
| auth                          | If                                     | Authenticate sender                         | config                        | mensagem_tipo                  |                                                                                                 |
| mensagem_tipo                  | Switch                                 | Route based on message type                 | auth                         | arquivo_id, Convert to File, base, edit2 |                                                                                                 |
| arquivo_id                    | Set                                    | Set file id for document management         | mensagem_tipo                | deletar_arquivos_antigos         |                                                                                                 |
| deletar_arquivos_antigos       | Supabase                               | Delete old files in Supabase                 | arquivo_id                   | resumo                         |                                                                                                 |
| resumo                        | Chain LLM                             | Summarize documents                          | deletar_arquivo              | atualizar_lista_de_arquivos     |                                                                                                 |
| atualizar_lista_de_arquivos    | Postgres                              | Update file metadata list                     | resumo                       |                              |                                                                                                 |
| Convert to File               | Convert to File                       | Convert raw input to file format              | base                         | OpenAI                        |                                                                                                 |
| OpenAI                        | OpenAI (LangChain)                   | GPT-4o chat processing                        | Convert to File              | edit1                         |                                                                                                 |
| edit1                         | Set                                   | Prepare message data                          | OpenAI                       | mensagem_cliente_inicial       |                                                                                                 |
| mensagem_cliente_inicial       | Set                                   | Format client message for further processing | edit1                        | Lista Mensagens1              |                                                                                                 |
| Lista Mensagens1              | Redis                                 | Retrieve message buffers                      | mensagem_cliente_inicial      | Puxar as Mensagens             |                                                                                                 |
| Puxar as Mensagens            | Redis                                 | Pull messages for context                      | Lista Mensagens1             | If1                           |                                                                                                 |
| If1                           | If                                    | Conditional routing on messages              | Puxar as Mensagens           | Edit Fields2                   |                                                                                                 |
| Edit Fields2                  | Set                                   | Edit message fields                           | If1                          | mensagem_cliente               |                                                                                                 |
| mensagem_cliente              | Set                                   | Prepare final message for AI processing       | Edit Fields2                 | puxar_prompt, rag_resumos      |                                                                                                 |
| puxar_prompt                 | Postgres                             | Pull prompt/template for AI                     | mensagem_cliente             | Merge                         |                                                                                                 |
| rag_resumos                  | Postgres                             | Retrieve RAG summaries                          | mensagem_cliente             | Merge                         |                                                                                                 |
| Merge                        | Aggregate                             | Combine multiple DB data                        | puxar_prompt, rag_resumos, Merge Database Data2 | classificador_de_intencao      |                                                                                                 |
| classificador_de_intencao      | LangChain Agent                      | Intent classification                          | Merge                        | Switch                        |                                                                                                 |
| Switch                       | Switch                               | Route based on intent                          | classificador_de_intencao    | tratamento, recepcionista      |                                                                                                 |
| tratamento                   | Set                                   | Prepare data for prompt update                  | Switch                       | atualizar_prompt              |                                                                                                 |
| atualizar_prompt             | Execute Workflow                     | Update prompt via sub-workflow                  | tratamento                   | OpenAI Chat Model             |                                                                                                 |
| OpenAI Chat Model            | LangChain LM Chat                   | Main GPT-4o chat model                         | atualizar_prompt             | recepcionista, classificador_de_intencao |                                                                                                 |
| recepcionista                | LangChain Agent                    | Final AI assistant with memory and tools       | OpenAI Chat Model, RAG, agendamentos, emails, adicionar_conhecimento, buscar_conhecimento, excluir_rag_arquivo, excluir_conhecimento, Postgres Chat Memory | (Outputs to messaging APIs)   |                                                                                                 |
| RAG                         | LangChain Tool Vector Store         | Retrieval-Augmented Generation with Supabase   | OpenAI Chat Model2           | recepcionista                 |                                                                                                 |
| OpenAI Chat Model2           | LangChain LM Chat                   | GPT-4o model for RAG workflow                   | Supabase Vector Store        | RAG                          |                                                                                                 |
| Supabase Vector Store        | LangChain Vector Store Supabase     | Vector store interface for embeddings           | Embeddings OpenAI            | OpenAI Chat Model2            |                                                                                                 |
| Embeddings OpenAI            | LangChain Embeddings OpenAI         | Generate vector embeddings                       | Default Data Loader          | Supabase Vector Store         |                                                                                                 |
| Default Data Loader          | LangChain Document Default Data Loader | Load documents for embedding                      | Recursive Character Text Splitter | Embeddings OpenAI           |                                                                                                 |
| Recursive Character Text Splitter | LangChain Text Splitter           | Split text into chunks for embedding            |                            | Default Data Loader           |                                                                                                 |
| agendamentos                | Tool Workflow                      | Scheduling integration                            |                             | recepcionista                 |                                                                                                 |
| emails                      | Tool Workflow                      | Email management                                  |                             | recepcionista                 |                                                                                                 |
| adicionar_conhecimento      | Tool Workflow                      | Add knowledge base entries                        |                             | recepcionista                 |                                                                                                 |
| buscar_conhecimento         | Tool Workflow                      | Search knowledge base                             |                             | recepcionista                 |                                                                                                 |
| excluir_rag_arquivo         | Tool Workflow                      | Delete RAG indexed files                          |                             | recepcionista                 |                                                                                                 |
| excluir_conhecimento        | Tool Workflow                      | Delete knowledge base entries                     |                             | recepcionista                 |                                                                                                 |
| Postgres Chat Memory        | LangChain Memory Postgres           | Memory storage for chat sessions                  |                             | recepcionista                 |                                                                                                 |
| puxar_prompt                | Postgres                          | Fetch prompt templates                             |                             | Merge                        |                                                                                                 |
| atualizar_lista_de_arquivos | Postgres                          | Update file metadata                               | resumo                      |                             |                                                                                                 |
| criar_cerebro               | Postgres                          | Initialize prompt/knowledge base tables           |                             |                             |                                                                                                 |
| criar_rag_controle          | Postgres                          | Initialize RAG control tables                      |                             |                             |                                                                                                 |
| deletar_arquivo             | Postgres                          | Delete file entries                                |                             | resumo                       |                                                                                                 |
| deletar_conhecimento        | Postgres                          | Delete knowledge entries                            |                             |                             |                                                                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - Purpose: Receive incoming messages from Evolution API or WhatsApp.  
   - Configure path and HTTP method as per your provider.  
   - No credentials needed.

2. **Create Config Node (Set)**  
   - Type: Set  
   - Parameters:  
     - `adminNumero`: your WhatsApp/admin number  
     - `evolutionApiKey`: API key for Evolution or messaging platform  
     - `utilizacaoApenasViaAdmin`: boolean flag for admin-only access  
   - Connect Webhook → Config.

3. **Create Auth Node (If)**  
   - Type: If  
   - Condition: Check if message sender equals `adminNumero` or allowed user.  
   - Connect Config → Auth.

4. **Create mensagem_tipo Node (Switch)**  
   - Type: Switch  
   - Branch on message content type: text, document, audio, image.  
   - Connect Auth (true) → mensagem_tipo.

5. **Create arquivo_id Node (Set)**  
   - Type: Set  
   - Purpose: Assign ID for document processing.  
   - Connect mensagem_tipo (document branch) → arquivo_id.

6. **Create deletar_arquivos_antigos Node (Supabase)**  
   - Type: Supabase node  
   - Operation: Delete old files from Supabase vector store.  
   - Connect arquivo_id → deletar_arquivos_antigos.

7. **Create resumo Node (Chain LLM)**  
   - Type: Chain LLM  
   - Purpose: Summarize documents for indexing metadata.  
   - Connect deletar_arquivo → resumo.

8. **Create atualizar_lista_de_arquivos Node (Postgres)**  
   - Type: Postgres  
   - Operation: Update file metadata list after processing.  
   - Connect resumo → atualizar_lista_de_arquivos.

9. **Create Convert to File Node**  
   - Type: Convert to File  
   - Purpose: Convert raw message content into file format.  
   - Connect mensagem_tipo (file branch) → Convert to File.

10. **Create OpenAI Node (LangChain OpenAI)**  
    - Type: OpenAI Chat Model  
    - Model: GPT-4o (configured with your OpenAI credentials)  
    - Connect Convert to File → OpenAI.

11. **Create edit1 Node (Set)**  
    - Type: Set  
    - Purpose: Format message data for next steps.  
    - Connect OpenAI → edit1.

12. **Create mensagem_cliente_inicial Node (Set)**  
    - Type: Set  
    - Purpose: Prepare initial client message object.  
    - Connect edit1 → mensagem_cliente_inicial.

13. **Create Redis Nodes for Message Buffer**  
    - Lista Mensagens1: Redis get buffer  
    - Puxar as Mensagens: Redis pull messages  
    - Connect mensagem_cliente_inicial → Lista Mensagens1 → Puxar as Mensagens.

14. **Create If1 Node (If)**  
    - Type: If  
    - Condition: Check message context or buffer state.  
    - Connect Puxar as Mensagens → If1.

15. **Create Edit Fields2 Node (Set)**  
    - Type: Set  
    - Purpose: Edit and enrich message fields.  
    - Connect If1 (true) → Edit Fields2.

16. **Create mensagem_cliente Node (Set)**  
    - Type: Set  
    - Purpose: Final message formatting for AI processing.  
    - Connect Edit Fields2 → mensagem_cliente.

17. **Create puxar_prompt Node (Postgres)**  
    - Type: Postgres  
    - Operation: Fetch prompt templates.  
    - Connect mensagem_cliente → puxar_prompt.

18. **Create rag_resumos Node (Postgres)**  
    - Type: Postgres  
    - Operation: Retrieve RAG summaries.  
    - Connect mensagem_cliente → rag_resumos.

19. **Create Merge Node (Aggregate)**  
    - Combine puxar_prompt, rag_resumos, and other DB data.  
    - Connect puxar_prompt, rag_resumos, Merge Database Data2 → Merge.

20. **Create classificador_de_intencao (Agent)**  
    - LangChain Agent for intent classification.  
    - Connect Merge → classificador_de_intencao.

21. **Create Switch Node**  
    - Route based on classified intent.  
    - Connect classificador_de_intencao → Switch.

22. **Create tratamento Node (Set)**  
    - Prepare data for prompt updates.  
    - Connect Switch (first branch) → tratamento.

23. **Create atualizar_prompt Node (Execute Workflow)**  
    - Sub-workflow to update prompt data.  
    - Connect tratamento → atualizar_prompt.

24. **Create OpenAI Chat Model Node**  
    - Main GPT-4o chat model node.  
    - Connect atualizar_prompt → OpenAI Chat Model.

25. **Create recepcionista Node (Agent)**  
    - Final AI agent for response generation and dispatch.  
    - Inputs: OpenAI Chat Model, RAG, Postgres Chat Memory, and tool workflows (emails, agendamentos, knowledge management).  
    - Connect OpenAI Chat Model → recepcionista.

26. **Create RAG Node (toolVectorStore)**  
    - RAG retrieval tool integrated with Supabase.  
    - Connect OpenAI Chat Model2 → RAG → recepcionista.

27. **Create Supabase Vector Store Node**  
    - Vector store interface for embeddings.  
    - Connect Embeddings OpenAI → Supabase Vector Store.

28. **Create Embeddings OpenAI Node**  
    - Generate vector embeddings from text.  
    - Connect Default Data Loader → Embeddings OpenAI.

29. **Create Default Data Loader Node**  
    - Load documents for embedding.  
    - Connect Recursive Character Text Splitter → Default Data Loader.

30. **Create Recursive Character Text Splitter Node**  
    - Split text into chunks for embedding.  
    - Connect document text extraction nodes → Recursive Character Text Splitter.

31. **Create agendamentos, emails, and knowledge management toolWorkflows**  
    - Load and configure sub-workflows for scheduling, emails, knowledge add/search/delete.  
    - Connect them to recepcionista AI agent as tools.

32. **Create Postgres Chat Memory Node**  
    - Manage chat session memory.  
    - Connect to recepcionista and classificador_de_intencao agents.

33. **Create database initialization nodes**  
    - criar_cerebro, criar_rag_controle, setar_supabase_tabelas_vectoriais  
    - Execute these once to set up necessary tables.

---

### 5. General Notes & Resources

| Note Content                                                                                             | Context or Link                             |
|--------------------------------------------------------------------------------------------------------|--------------------------------------------|
| Workflow uses LangChain agents, OpenAI GPT-4o, Supabase, Redis, and PostgreSQL for complex AI workflows. | Core technology stack for AI assistant.    |
| Requires n8n self-hosted environment or n8n Cloud with community nodes enabled.                          | Setup requirement                          |
| Workflow modularity allows integration with Google Calendar, email systems, and multiple chat channels. | Extensibility and multi-channel support.  |
| Project Credits: Amanda (creator), available workflows at [https://iloveflows.com](https://iloveflows.com) | Creator’s site and workflow marketplace    |
| Use n8n Cloud with partner link for easy deployment: [https://n8n.partnerlinks.io/amanda](https://n8n.partnerlinks.io/amanda) | Deployment option and referral link        |

---

This document fully details the AI Personal Assistant workflow structure, allowing advanced users and automation agents to understand, reproduce, and extend the workflow confidently.