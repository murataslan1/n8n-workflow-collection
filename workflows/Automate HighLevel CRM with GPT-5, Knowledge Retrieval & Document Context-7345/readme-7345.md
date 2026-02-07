Automate HighLevel CRM with GPT-5, Knowledge Retrieval & Document Context

https://n8nworkflows.xyz/workflows/automate-highlevel-crm-with-gpt-5--knowledge-retrieval---document-context-7345


# Automate HighLevel CRM with GPT-5, Knowledge Retrieval & Document Context

### 1. Workflow Overview

This workflow automates integration between HighLevel CRM and AI-driven intelligent processing using GPT-5, knowledge retrieval, and document context extraction. It is designed for advanced CRM automation scenarios where contact and opportunity management in HighLevel is augmented by AI for chat interaction, knowledge search, document processing, and real-time data enrichment.

The workflow is logically divided into these main blocks:

- **1.1 Input Reception:** Multiple triggers listen for incoming chat messages or external events from Slack, Telegram, Gmail, WhatsApp, and LangChain MCP (Modular Chat Processor) servers.
- **1.2 AI Orchestration and Processing:** The core AI agent (“GHL orchestrator”) manages chat memory, language model interaction (GPT-5), and invokes multiple AI tools for embeddings, reranking, and knowledge retrieval.
- **1.3 HighLevel CRM Operations:** Nodes performing actions on contacts, opportunities, tasks, and calendar appointments within HighLevel via MCP server interfaces.
- **1.4 Document and Knowledge Management:** Google Drive file search, download, extraction (PDF, CSV, images, audio transcription), and vector embedding for personal data storage and knowledge retrieval.
- **1.5 Knowledge Retrieval and Search:** Real-time web search, tabular Google Sheets data querying, and vector store querying combined with AI reranking to augment answers.
- **1.6 Messaging and Response Delivery:** Sending processed message outputs back to the originating platform (Telegram, WhatsApp, Slack, Gmail).

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Captures inbound messages or events from multiple platforms to trigger the workflow.
- **Nodes Involved:** Slack Trigger, Telegram Trigger, Gmail Trigger, WhatsApp Trigger (disabled), When chat message received (LangChain chatTrigger), GHL MCP server (LangChain MCP trigger).

##### Node Details

- **Slack Trigger**
  - Type: Event trigger for Slack incoming messages.
  - Configuration: Listens for new messages or events.
  - Connections: Outputs to Edit Fields node.
  - Edge Cases: Slack API auth failures, webhook misconfiguration.

- **Telegram Trigger**
  - Type: Event trigger for Telegram incoming messages.
  - Configuration: Listens for new Telegram messages.
  - Connections: Outputs to Edit Fields node.
  - Edge Cases: Telegram bot token invalid, message parsing errors.

- **Gmail Trigger**
  - Type: Event trigger for new Gmail emails.
  - Configuration: Monitors Gmail inbox for new emails.
  - Connections: Outputs to Edit Fields node.
  - Edge Cases: Gmail OAuth token expiration, quota limits.

- **WhatsApp Trigger** (disabled)
  - Type: Event trigger for WhatsApp messages.
  - Configuration: Disabled, no active listening.
  - Edge Cases: None active.

- **When chat message received**
  - Type: LangChain chat-trigger node for receiving chat messages.
  - Configuration: Webhook-based, receives structured chat input.
  - Connections: Outputs to GHL orchestrator.
  - Edge Cases: Webhook availability, payload format correctness.

- **GHL MCP server**
  - Type: LangChain MCP (Modular Chat Processor) trigger node.
  - Configuration: Webhook to receive MCP-based requests.
  - Connections: Outputs to HighLevel CRM MCP server and knowledge MCP nodes.
  - Edge Cases: Webhook downtime, MCP protocol errors.

#### 2.2 AI Orchestration and Processing

- **Overview:** Core AI agent (“GHL orchestrator”) processes chat inputs, uses GPT-5 language model, manages chat memory, and invokes AI tools.
- **Nodes Involved:** GHL orchestrator (LangChain agent), GPT 5 (LM chat OpenAI), Chat Memory (Postgres chat memory), MCP Client GHL, MCP Client Knowledge.

##### Node Details

- **GHL orchestrator**
  - Type: LangChain agent node controlling the AI-driven logic.
  - Configuration: Uses GPT-5 language model and chat memory for context.
  - Connections: Receives input from multiple triggers and MCP clients; outputs to messaging nodes.
  - Edge Cases: Language model rate limits, memory DB connection issues, expression evaluation failures.

- **GPT 5**
  - Type: OpenAI GPT-5 chat language model node.
  - Configuration: Configured for chat completions with advanced parameters.
  - Connections: Feeds output to GHL orchestrator.
  - Edge Cases: OpenAI API key expiration, rate limits, prompt formatting errors.

- **Chat Memory**
  - Type: Postgres-based chat memory storage for context retention.
  - Configuration: Stores and retrieves previous chat conversation states.
  - Connections: Connected to GHL orchestrator as memory source.
  - Edge Cases: Postgres connection failures, data corruption.

- **MCP Client GHL & MCP Client Knowledge**
  - Type: LangChain MCP client nodes.
  - Configuration: Interface with MCP server nodes to delegate tasks.
  - Connections: Inputs to GHL orchestrator; outputs to MCP servers.
  - Edge Cases: MCP server unavailability, protocol mismatch.

#### 2.3 HighLevel CRM Operations

- **Overview:** Handles CRUD actions on contacts, opportunities, tasks, and calendar appointments in HighLevel CRM via MCP server.
- **Nodes Involved:** Create or update a contact, Get many contacts, Update a contact, Delete a contact, Get many opportunities, Create an opportunity, Get an opportunity, Update an opportunity, Book appointment in calendar, Get free slots calendar, Create a task, Delete a task, Get a task, Update a task, GHL MCP server.

##### Node Details

- Each HighLevel node:
  - Type: HighLevelTool node for specific CRM entity operations.
  - Configuration: Uses pre-configured credentials to perform respective API actions.
  - Connections: Inputs from MCP server node; outputs return results to MCP server or orchestrator.
  - Edge Cases: API authentication failures, entity not found errors, rate limiting.

- **GHL MCP server**
  - Acts as the central MCP server managing all HighLevel API calls.
  - Receives tool requests from MCP clients, dispatches to appropriate HighLevel nodes.

#### 2.4 Document and Knowledge Management

- **Overview:** Searches, downloads, extracts, and processes files from Google Drive; extracts text from PDFs, CSVs, images, and audio; stores vector embeddings for knowledge retrieval.
- **Nodes Involved:** Google Drive MCP Server, Search Files from Gdrive, Read File From GDrive, Download File, FileType1 (switch), Extract from PDF1, Extract from CSV1, Analyse Image1, Transcribe Audio1, Get PDF Response1, Get CSV Response1, Vectorized personal data.

##### Node Details

- **Google Drive MCP Server**
  - Type: LangChain MCP trigger node for Google Drive file operations.
  - Connections: Receives requests from Google Drive tool nodes; outputs to orchestrator.
  - Edge Cases: Google Drive API token expiration, file not found.

- **Search Files from Gdrive**
  - Type: Google Drive search tool node.
  - Configuration: Searches files based on query parameters.
  - Connections: Outputs file metadata for further processing.
  - Edge Cases: Search query syntax errors, access denied.

- **Read File From GDrive**
  - Type: LangChain tool workflow node.
  - Configuration: Reads file content from GDrive.
  - Connections: Outputs file content to extraction nodes.
  - Edge Cases: Large file size, access permissions.

- **Download File**
  - Type: Google Drive download node.
  - Configuration: Downloads file for local processing.
  - Connections: Outputs to FileType1 switch node.

- **FileType1**
  - Type: Switch node determining file type.
  - Configuration: Routes files to appropriate extractors: PDF, CSV, image, or audio.
  - Connections: Branches to Extract from PDF1, Extract from CSV1, Analyse Image1, Transcribe Audio1.

- **Extract from PDF1 / Extract from CSV1**
  - Type: File extraction nodes.
  - Configuration: Extracts text content from PDF/CSV files.
  - Connections: Outputs to Set nodes that prepare responses.

- **Analyse Image1 / Transcribe Audio1**
  - Type: OpenAI nodes for image analysis and audio transcription.
  - Configuration: Uses OpenAI models for content extraction.
  - Edge Cases: Unsupported file formats, transcription inaccuracies.

- **Vectorized personal data**
  - Type: Supabase vector store node.
  - Configuration: Stores embeddings from OpenAI embeddings node.
  - Connections: Input from Embeddings OpenAI; output to Knowledge MCP.

#### 2.5 Knowledge Retrieval and Search

- **Overview:** Performs real-time web search, retrieves tabular data, and uses vector embeddings with AI reranking to provide enhanced knowledge context.
- **Nodes Involved:** Real time web search (Perplexity), Tabular data (Google Sheets), Reranker Cohere, Embeddings OpenAI, Knowledge MCP.

##### Node Details

- **Real time web search**
  - Type: Perplexity tool node.
  - Configuration: Performs live web search queries.
  - Connections: Output to Knowledge MCP.
  - Edge Cases: API quota limits, network errors.

- **Tabular data**
  - Type: Google Sheets tool node.
  - Configuration: Queries tabular data from Google Sheets.
  - Connections: Output to Knowledge MCP.

- **Embeddings OpenAI**
  - Type: OpenAI embeddings node.
  - Configuration: Generates text embeddings for vector storage.
  - Connections: Outputs to Vectorized personal data node.

- **Reranker Cohere**
  - Type: AI reranker node using Cohere API.
  - Configuration: Reranks search results or documents based on relevance.
  - Connections: Outputs to Vectorized personal data node.

- **Knowledge MCP**
  - Type: LangChain MCP trigger node for knowledge retrieval.
  - Configuration: Aggregates results from tabular data, vector store, and web search to feed GHL orchestrator.

#### 2.6 Messaging and Response Delivery

- **Overview:** Sends AI-generated responses back to users through their original communication channels.
- **Nodes Involved:** Send a text message (Telegram), Send message (WhatsApp, disabled), Send a message (Slack), Send a message1 (Gmail).

##### Node Details

- Each messaging node:
  - Type: Messaging platform output node.
  - Configuration: Uses platform-specific credentials and chat IDs.
  - Connections: Receives output from GHL orchestrator node.
  - Edge Cases: Messaging API failures, invalid recipient IDs.

---

### 3. Summary Table

| Node Name                       | Node Type                            | Functional Role               | Input Node(s)                | Output Node(s)                          | Sticky Note                        |
|--------------------------------|------------------------------------|------------------------------|------------------------------|----------------------------------------|----------------------------------|
| Slack Trigger                  | Slack Trigger                      | Receives Slack messages      | -                            | Edit Fields                           |                                  |
| Telegram Trigger               | Telegram Trigger                   | Receives Telegram messages   | -                            | Edit Fields                           |                                  |
| Gmail Trigger                 | Gmail Trigger                     | Receives Gmail emails        | -                            | Edit Fields                           |                                  |
| WhatsApp Trigger (disabled)   | WhatsApp Trigger                  | Receives WhatsApp messages   | -                            | Edit Fields                           |                                  |
| When chat message received    | LangChain Chat Trigger            | Receives chat messages       | -                            | GHL orchestrator                      |                                  |
| GHL MCP server               | LangChain MCP Trigger             | MCP server for HighLevel API | MCP Clients                  | HighLevel CRM operation nodes          |                                  |
| Edit Fields                   | Set                              | Prepares data fields         | Slack / Telegram / Gmail / WhatsApp triggers | GHL orchestrator                 |                                  |
| GHL orchestrator              | LangChain Agent                  | AI chat agent orchestrator   | When chat message received, MCP Clients | Messaging nodes                     |                                  |
| GPT 5                        | OpenAI GPT-5 chat model           | Language model processing    | GHL orchestrator             | GHL orchestrator                      |                                  |
| Chat Memory                  | Postgres chat memory              | Stores chat context          | GHL orchestrator             | GHL orchestrator                      |                                  |
| MCP Client GHL               | LangChain MCP Client              | Delegates tasks to MCP server | GHL orchestrator             | GHL MCP server                       |                                  |
| MCP Client Knowledge         | LangChain MCP Client              | Delegates knowledge queries | GHL orchestrator             | Knowledge MCP                       |                                  |
| Create or update a contact in HighLevel | HighLevelTool               | Create/update CRM contacts   | GHL MCP server               | GHL MCP server                       |                                  |
| Get many contacts in HighLevel | HighLevelTool                    | Read multiple contacts       | GHL MCP server               | GHL MCP server                       |                                  |
| Update a contact in HighLevel | HighLevelTool                    | Update contact info          | GHL MCP server               | GHL MCP server                       |                                  |
| Delete a contact in HighLevel | HighLevelTool                    | Delete a contact             | GHL MCP server               | GHL MCP server                       |                                  |
| Get many opportunities in HighLevel | HighLevelTool               | Read multiple opportunities  | GHL MCP server               | GHL MCP server                       |                                  |
| Create an opportunity in HighLevel | HighLevelTool                | Create opportunity           | GHL MCP server               | GHL MCP server                       |                                  |
| Get an opportunity in HighLevel | HighLevelTool                  | Read opportunity             | GHL MCP server               | GHL MCP server                       |                                  |
| Update an opportunity in HighLevel | HighLevelTool                | Update opportunity           | GHL MCP server               | GHL MCP server                       |                                  |
| Book appointment in a calendar in HighLevel | HighLevelTool           | Book calendar appointment    | GHL MCP server               | GHL MCP server                       |                                  |
| Get free slots of a calendar in HighLevel | HighLevelTool             | Get calendar free slots      | GHL MCP server               | GHL MCP server                       |                                  |
| Create a task in HighLevel    | HighLevelTool                    | Create a task                | GHL MCP server               | GHL MCP server                       |                                  |
| Delete a task in HighLevel    | HighLevelTool                    | Delete a task                | GHL MCP server               | GHL MCP server                       |                                  |
| Get a task in HighLevel       | HighLevelTool                    | Read a task                  | GHL MCP server               | GHL MCP server                       |                                  |
| Update a task in HighLevel    | HighLevelTool                    | Update a task                | GHL MCP server               | GHL MCP server                       |                                  |
| Google Drive MCP Server       | LangChain MCP Trigger            | MCP server for Google Drive  | Google Drive tool nodes      | GHL orchestrator                      |                                  |
| Search Files from Gdrive      | Google Drive Tool                | Search files on Google Drive | -                            | Google Drive MCP Server              |                                  |
| Read File From GDrive         | LangChain Tool Workflow          | Reads file content           | -                            | Google Drive MCP Server              |                                  |
| Download File                | Google Drive                    | Downloads file               | Operation switch             | FileType1 switch                    |                                  |
| FileType1                    | Switch                         | File type routing            | Download File                | Extract from PDF1 / CSV1 / Analyse Image1 / Transcribe Audio1 |                                  |
| Extract from PDF1            | Extract from File              | Extract text from PDF        | FileType1                   | Get PDF Response1                   |                                  |
| Extract from CSV1            | Extract from File              | Extract text from CSV        | FileType1                   | Get CSV Response1                   |                                  |
| Analyse Image1               | OpenAI                         | Image content analysis       | FileType1                   | -                                  |                                  |
| Transcribe Audio1            | OpenAI                         | Audio transcription          | FileType1                   | -                                  |                                  |
| Get PDF Response1            | Set                            | Prepare PDF response         | Extract from PDF1            | -                                  |                                  |
| Get CSV Response1            | Set                            | Prepare CSV response         | Extract from CSV1            | -                                  |                                  |
| Vectorized personal data     | LangChain vectorStoreSupabase  | Stores vector embeddings     | Embeddings OpenAI            | Knowledge MCP                      |                                  |
| Embeddings OpenAI            | LangChain embeddingsOpenAI     | Generates text embeddings    | -                            | Vectorized personal data           |                                  |
| Reranker Cohere              | LangChain rerankerCohere       | Reranks vector search results| -                            | Vectorized personal data           |                                  |
| Knowledge MCP                | LangChain MCP Trigger          | Knowledge retrieval server   | Tabular data, Real time web search, Vectorized personal data | GHL orchestrator           |                                  |
| Real time web search         | Perplexity Tool                | Performs live web searches   | -                            | Knowledge MCP                      |                                  |
| Tabular data                 | Google Sheets Tool             | Queries Google Sheets data   | -                            | Knowledge MCP                      |                                  |
| Send a text message          | Telegram                       | Sends Telegram responses    | GHL orchestrator             | -                                  |                                  |
| Send message                | WhatsApp (disabled)            | Sends WhatsApp responses    | GHL orchestrator             | -                                  |                                  |
| Send a message              | Slack                         | Sends Slack responses       | GHL orchestrator             | -                                  |                                  |
| Send a message1             | Gmail                         | Sends Gmail email responses | GHL orchestrator             | -                                  |                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Input Triggers:**
   - Add Slack Trigger node; configure with Slack app credentials and event subscriptions.
   - Add Telegram Trigger node; configure Telegram bot token.
   - Add Gmail Trigger node; configure Gmail OAuth2 credentials.
   - (Optional) Add WhatsApp Trigger node and disable it initially.
   - Add LangChain Chat Trigger node (`When chat message received`), configure webhook.
   - Add LangChain MCP Trigger node (`GHL MCP server`), configure webhook for MCP requests.

2. **Add Data Preparation Node:**
   - Create a Set node named `Edit Fields` to standardize incoming data fields from all triggers.
   - Connect all trigger nodes to `Edit Fields`.

3. **Configure AI Orchestration:**
   - Add a LangChain Agent node named `GHL orchestrator`.
   - Connect `Edit Fields` and `When chat message received` outputs to `GHL orchestrator`.
   - Add Postgres Chat Memory node and configure PostgreSQL connection.
   - Link Chat Memory node as memory input to `GHL orchestrator`.
   - Add OpenAI GPT-5 LM Chat node, configure OpenAI API key, and connect to `GHL orchestrator` as language model.
   - Add two LangChain MCP Client Tool nodes: `MCP Client GHL` and `MCP Client Knowledge`, connect both as AI tools inputs to `GHL orchestrator`.
   - Connect `GHL orchestrator` output to messaging output nodes (Slack, Telegram, Gmail, WhatsApp (disabled)).

4. **Setup HighLevel CRM MCP Server:**
   - Add LangChain MCP Trigger node `GHL MCP server` with webhook.
   - Add HighLevelTool nodes for each CRM operation:
     - Create or update contact, Get many contacts, Update contact, Delete contact.
     - Get many opportunities, Create opportunity, Get opportunity, Update opportunity.
     - Book appointment, Get free slots calendar.
     - Create, delete, get, update task.
   - Configure each with HighLevel API credentials.
   - Connect all HighLevelTool nodes inputs to `GHL MCP server` as AI tools.
   - Connect MCP Client GHL node to `GHL MCP server`.

5. **Configure Document and Knowledge Management:**
   - Add LangChain MCP Trigger node `Google Drive MCP Server` with webhook.
   - Add Google Drive Tool nodes: `Search Files from Gdrive`, `Download File`.
   - Add LangChain Tool Workflow node `Read File From GDrive`.
   - Connect download to switch node `FileType1`.
   - Configure `FileType1` to route file types to:
     - PDF extractor node.
     - CSV extractor node.
     - OpenAI image analysis node.
     - OpenAI audio transcription node.
   - Add Set nodes for PDF and CSV response preparation.
   - Connect extraction outputs accordingly.
   - Connect Google Drive tool nodes’ outputs to `Google Drive MCP Server`.
   - Connect `Google Drive MCP Server` as AI tool input to `GHL orchestrator`.
   
6. **Add Knowledge Retrieval Nodes:**
   - Add Perplexity Tool node for real-time web search.
   - Add Google Sheets Tool node for tabular data retrieval.
   - Add OpenAI embeddings node.
   - Add LangChain reranker node (Cohere).
   - Add Supabase vector store node for vectorized personal data.
   - Link Embeddings OpenAI output to vector store.
   - Connect Reranker Cohere output to vector store.
   - Connect vector store, Perplexity, and Google Sheets nodes outputs to LangChain MCP Trigger node `Knowledge MCP`.
   - Connect `Knowledge MCP` output to `GHL orchestrator`.

7. **Configure Messaging Outputs:**
   - Add Telegram node, Slack node, Gmail node, and WhatsApp node (disabled).
   - Configure each with respective API credentials.
   - Connect outputs from `GHL orchestrator` main output to all messaging nodes.

8. **Credentials Setup:**
   - Set up OpenAI API key for GPT-5, embeddings, and OpenAI nodes.
   - Configure Google Drive OAuth2 credentials.
   - Provide HighLevel API credentials.
   - Configure Slack, Telegram, Gmail, WhatsApp credentials.

9. **Testing and Validation:**
   - Test each trigger separately.
   - Validate AI orchestration by sending chat messages.
   - Test HighLevel API operations via MCP requests.
   - Verify document search and extraction flows.
   - Confirm message responses sent to correct platforms.

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                                                                  |
|-----------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| The workflow leverages LangChain framework for modular AI orchestration and MCP client-server pattern.     | https://docs.langchain.com/docs/integrations/n8n                                               |
| Google Drive integration requires careful OAuth2 credential setup to avoid access issues.                   | https://developers.google.com/drive/api/v3/about-auth                                          |
| HighLevel CRM nodes require API key setup with correct permissions on contacts, opportunities, tasks.       | https://developers.gohighlevel.com/api-reference                                               |
| OpenAI GPT-5 usage requires API keys and rate limit management to avoid call failures.                      | https://platform.openai.com/docs/api-reference/chat/create                                      |
| Cohere reranker node needs Cohere API key and may improve relevance in knowledge retrieval.                 | https://docs.cohere.com/docs/rerank                                                            |
| Perplexity tool integration enables up-to-date web search augmentation.                                    | https://www.perplexity.ai/                                                                     |
| The workflow structure supports expansion by adding new MCP clients or triggers for additional platforms. |                                                                                                |

---

_Disclaimer: The provided content is generated from an n8n automation workflow and complies with all current content policies. No illegal or protected data is involved._