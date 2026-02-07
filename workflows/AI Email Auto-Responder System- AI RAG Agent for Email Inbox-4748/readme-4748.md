AI Email Auto-Responder System- AI RAG Agent for Email Inbox

https://n8nworkflows.xyz/workflows/ai-email-auto-responder-system--ai-rag-agent-for-email-inbox-4748


# AI Email Auto-Responder System- AI RAG Agent for Email Inbox

---

### 1. Workflow Overview

The **AI Email Auto-Responder System - AI RAG Agent for Email Inbox** workflow automates the process of receiving emails, analyzing their content with AI, searching relevant information in vector stores, and composing intelligent responses. It is designed to serve as an AI-powered email assistant that understands queries, extracts context, searches a knowledge base, and replies appropriately via Gmail.

The workflow can be logically divided into the following functional blocks:

- **1.1 Input Reception:** Listens for incoming emails and external workflow triggers, loading new data from Google Drive when updated.
- **1.2 Email Content Processing:** Prepares and classifies the incoming email content, determining if it contains a question.
- **1.3 Knowledge Retrieval & AI Reasoning:** Uses vector stores and AI language models to search for relevant information and generate answers.
- **1.4 Response Composition and Delivery:** Writes the final reply using AI agents and sends the response via Gmail.
- **1.5 Knowledge Base Maintenance:** Loads and processes documents from Google Drive into a Pinecone vector store for up-to-date information retrieval.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** This block detects new email messages via Gmail triggers and initiates the workflow. It also listens for Google Drive document changes and external workflow calls to update or retrieve data as needed.
- **Nodes Involved:**  
  - Gmail Trigger  
  - Google Drive Trigger  
  - Google Drive  
  - When Executed by Another Workflow  
  - Notion  
  - Aggregate  
  - Edit Fields

- **Node Details:**

  - **Gmail Trigger**  
    - Type: Trigger node for Gmail inbox monitoring  
    - Config: Default listening for incoming emails (no filters specified)  
    - Input: External event (new email received)  
    - Output: Email data forwarded to "Set Data" node  
    - Failures: Gmail API auth errors, quota limits, connection timeouts

  - **Google Drive Trigger**  
    - Type: Trigger node monitoring changes in Google Drive  
    - Config: Default settings monitoring unspecified folders or files  
    - Input: Google Drive file change event  
    - Output: Triggers "Google Drive" node to fetch updated files  
    - Failures: Drive API auth errors, file access permissions

  - **Google Drive**  
    - Type: File retrieval node from Google Drive  
    - Config: Fetches documents triggered by Google Drive Trigger  
    - Input: Trigger event from Google Drive Trigger  
    - Output: Passes document data to "Pinecone Vector Store" for indexing  
    - Failures: File not found, permission denied, API timeout

  - **When Executed by Another Workflow**  
    - Type: Execute Workflow Trigger node  
    - Config: Receives input from external workflows  
    - Input: External workflow calls  
    - Output: Passes data to "Notion" node  
    - Failures: Workflow invocation errors, parameter mismatches

  - **Notion**  
    - Type: Integration node for Notion database access  
    - Config: Reads or aggregates notion data (parameters not detailed)  
    - Input: From "When Executed by Another Workflow" node  
    - Output: Passes data to "Aggregate" node  
    - Failures: Notion API errors, authentication

  - **Aggregate**  
    - Type: Aggregation node  
    - Config: Aggregates data from Notion or other sources for further processing  
    - Input: Notion data  
    - Output: Passes aggregated data to "Edit Fields" node  
    - Failures: Data format inconsistencies

  - **Edit Fields**  
    - Type: Set node to edit or set fields in the data  
    - Config: Adjusts data fields for downstream processing  
    - Input: Aggregated data  
    - Output: Feeds into later processing blocks  
    - Failures: Expression errors or invalid field references

---

#### 2.2 Email Content Processing

- **Overview:** This block formats incoming email data and determines if the email contains a question that requires an AI-generated response.
- **Nodes Involved:**  
  - Set Data  
  - Check if Question  
  - OpenAI Chat Model2  
  - If

- **Node Details:**

  - **Set Data**  
    - Type: Data transformation node (Set)  
    - Config: Prepares and structures email data for AI processing  
    - Input: Email data from Gmail Trigger  
    - Output: Passes formatted data to "Check if Question"  
    - Failures: Incorrect data mapping or missing fields

  - **Check if Question**  
    - Type: Chain LLM node using OpenAI (or similar)  
    - Config: Uses a language model to analyze email text to detect if it contains a question  
    - Input: Prepared email data  
    - Output: Passes result to "If" node for branching  
    - Failures: AI model timeout, ambiguous input, API errors

  - **OpenAI Chat Model2**  
    - Type: Language Model node (OpenAI Chat)  
    - Role: Supports "Check if Question" by providing AI inference  
    - Input: Email text or derived prompt  
    - Output: AI-generated classification or analysis  
    - Failures: API limits, auth errors

  - **If**  
    - Type: Conditional branching node  
    - Config: Routes workflow based on whether incoming email is a question  
    - Input: Result from "Check if Question"  
    - Output: If yes, continues to search information; else, may skip AI response generation  
    - Failures: Logical expression misconfiguration

---

#### 2.3 Knowledge Retrieval & AI Reasoning

- **Overview:** This block queries a vector store (Pinecone) with embeddings to find relevant knowledge and uses AI models to reason and generate answers.
- **Nodes Involved:**  
  - Search Information  
  - Simple Memory  
  - Get Brand brief  
  - OpenAI Chat Model  
  - Pinecone Vector Store1  
  - Embeddings OpenAI  
  - Answer questions with a vector store  
  - OpenAI Chat Model1  
  - OpenAI Chat Model3

- **Node Details:**

  - **Search Information**  
    - Type: Langchain AI agent node  
    - Config: Uses AI language model and tools to query vector store and retrieve relevant answers  
    - Input: Email question text and context from memory and brand brief  
    - Output: Passes AI-generated response to "Response writer"  
    - Failures: API errors, vector store timeouts, incomplete context

  - **Simple Memory**  
    - Type: Memory Buffer node for AI context  
    - Config: Maintains a sliding window of conversation history to provide context for AI agents  
    - Input: Conversation history and new inputs  
    - Output: Provides enriched context to "Search Information"  
    - Failures: Memory overflow, data loss

  - **Get Brand brief**  
    - Type: Workflow tool node  
    - Config: Calls a sub-workflow that retrieves brand-specific information to enrich AI responses  
    - Input: Triggered within "Search Information" AI tool context  
    - Output: Brand brief text or data for AI context  
    - Failures: Sub-workflow errors, missing data

  - **OpenAI Chat Model**  
    - Type: AI language model node  
    - Config: Used as the primary language model for query understanding and generation  
    - Input: Receives prompts from "Search Information" and other agents  
    - Output: Sends AI-generated text to vector store tool and further agents  
    - Failures: API quota, auth failure

  - **Pinecone Vector Store1**  
    - Type: Vector store node connected to Pinecone  
    - Config: Stores and retrieves vectors for semantic search  
    - Input: Embeddings from "Embeddings OpenAI"  
    - Output: Provides matching documents to "Answer questions with a vector store"  
    - Failures: Network errors, index consistency

  - **Embeddings OpenAI**  
    - Type: Embeddings generation node (OpenAI)  
    - Config: Converts text data into vector embeddings for Pinecone  
    - Input: Text data from documents or queries  
    - Output: Vector embeddings for storage or querying  
    - Failures: API failures, rate limiting

  - **Answer questions with a vector store**  
    - Type: Langchain tool node combining vector search and LLM  
    - Config: Uses vector store results and AI model to answer questions accurately  
    - Input: Embeddings and AI prompts  
    - Output: Sends refined answer to "Search Information"  
    - Failures: Mismatched data, empty results

  - **OpenAI Chat Model1**  
    - Type: Language model node  
    - Role: Supports answer construction from vector store results  
    - Input: Receives context from vector store tool  
    - Output: Passes refined answers to "Answer questions with a vector store"  
    - Failures: API or expression errors

  - **OpenAI Chat Model3**  
    - Type: Language model node  
    - Role: Used in the response writing phase to finalize output text  
    - Input: Receives processed answer from "Response writer" agent  
    - Output: Final email reply text  
    - Failures: API limits, malformed prompts

---

#### 2.4 Response Composition and Delivery

- **Overview:** This block formats the AI-generated answer into a coherent email reply and sends it via Gmail.
- **Nodes Involved:**  
  - Response writer  
  - Gmail

- **Node Details:**

  - **Response writer**  
    - Type: Langchain AI agent node  
    - Config: Takes AI-generated information and crafts a polished response email  
    - Input: Answer from "Search Information" and language model outputs  
    - Output: Sends email content to "Gmail" node  
    - Failures: Model timeouts, incomplete data

  - **Gmail**  
    - Type: Gmail node to send emails  
    - Config: Uses OAuth2 credentials for Gmail account to send replies  
    - Input: Email content from "Response writer"  
    - Output: Sends the email reply to the original sender  
    - Failures: Authentication errors, quota limits, invalid email addresses

---

#### 2.5 Knowledge Base Maintenance

- **Overview:** This block manages document ingestion from Google Drive, splitting, embedding, and storing them in Pinecone for up-to-date knowledge retrieval.
- **Nodes Involved:**  
  - Default Data Loader  
  - Recursive Character Text Splitter  
  - Embeddings OpenAI1  
  - Pinecone Vector Store

- **Node Details:**

  - **Default Data Loader**  
    - Type: Document loader node  
    - Config: Loads documents from Google Drive files for processing  
    - Input: Files from "Google Drive" node  
    - Output: Passes document content to "Recursive Character Text Splitter"  
    - Failures: File parsing errors, unsupported formats

  - **Recursive Character Text Splitter**  
    - Type: Text splitter node  
    - Config: Splits long documents into smaller chunks recursively to optimize embeddings  
    - Input: Loaded document text  
    - Output: Smaller text chunks to "Embeddings OpenAI1"  
    - Failures: Splitting logic errors, empty chunks

  - **Embeddings OpenAI1**  
    - Type: Embeddings generation node  
    - Config: Generates vector embeddings for document chunks  
    - Input: Text chunks from splitter  
    - Output: Provides embeddings to "Pinecone Vector Store"  
    - Failures: API rate limits, malformed input

  - **Pinecone Vector Store**  
    - Type: Vector store node connected to Pinecone  
    - Config: Stores document embeddings to enable semantic search  
    - Input: Embeddings from "Embeddings OpenAI1"  
    - Output: Updates vector index for querying by AI agents  
    - Failures: Network errors, vector index issues

---

### 3. Summary Table

| Node Name                  | Node Type                                         | Functional Role                           | Input Node(s)                          | Output Node(s)                         | Sticky Note |
|----------------------------|--------------------------------------------------|-----------------------------------------|--------------------------------------|---------------------------------------|-------------|
| Gmail Trigger              | n8n-nodes-base.gmailTrigger                       | Email inbox event listener               | (External)                          | Set Data                              |             |
| Set Data                   | n8n-nodes-base.set                               | Prepares email data for AI processing    | Gmail Trigger                      | Check if Question                     |             |
| Check if Question          | @n8n/n8n-nodes-langchain.chainLlm                | Classifies if email contains a question | Set Data                          | If                                   |             |
| OpenAI Chat Model2         | @n8n/n8n-nodes-langchain.lmChatOpenAi             | Supports question classification         | (Internal AI use)                  | Check if Question                     |             |
| If                        | n8n-nodes-base.if                                | Branches workflow based on question check| Check if Question                 | Search Information / End              |             |
| Search Information         | @n8n/n8n-nodes-langchain.agent                    | Queries vector store and generates answer| If                              | Response writer                      |             |
| Simple Memory              | @n8n/n8n-nodes-langchain.memoryBufferWindow      | Maintains AI conversation context        | (Internal AI context)              | Search Information                   |             |
| Get Brand brief            | @n8n/n8n-nodes-langchain.toolWorkflow             | Provides brand context for AI             | (Internal AI tool)                 | Search Information                   |             |
| OpenAI Chat Model          | @n8n/n8n-nodes-langchain.lmChatOpenAi             | Core AI language model                    | Search Information                | Answer questions with a vector store |             |
| Pinecone Vector Store1     | @n8n/n8n-nodes-langchain.vectorStorePinecone      | Vector store for semantic search          | Embeddings OpenAI                 | Answer questions with a vector store |             |
| Embeddings OpenAI          | @n8n/n8n-nodes-langchain.embeddingsOpenAi         | Creates text embeddings                    | (Document or query text)          | Pinecone Vector Store1               |             |
| Answer questions with a vector store | @n8n/n8n-nodes-langchain.toolVectorStore   | Combines vector store results and LLM    | Pinecone Vector Store1, OpenAI Chat Model | Search Information               |             |
| OpenAI Chat Model1         | @n8n/n8n-nodes-langchain.lmChatOpenAi             | Refines answers from vector store        | Answer questions with a vector store | Search Information                  |             |
| Response writer            | @n8n/n8n-nodes-langchain.agent                    | Crafts email reply from AI-generated info | Search Information               | Gmail                               |             |
| OpenAI Chat Model3         | @n8n/n8n-nodes-langchain.lmChatOpenAi             | Finalizes response text                   | Response writer                   | Gmail                               |             |
| Gmail                     | n8n-nodes-base.gmail                              | Sends email response                      | Response writer                   | (External)                         |             |
| Google Drive Trigger       | n8n-nodes-base.googleDriveTrigger                 | Monitors Google Drive for updates        | (External)                      | Google Drive                        |             |
| Google Drive               | n8n-nodes-base.googleDrive                        | Fetches updated documents                 | Google Drive Trigger             | Pinecone Vector Store               |             |
| Pinecone Vector Store      | @n8n/n8n-nodes-langchain.vectorStorePinecone      | Stores embeddings of documents            | Embeddings OpenAI1               | (AI querying nodes)                 |             |
| Default Data Loader        | @n8n/n8n-nodes-langchain.documentDefaultDataLoader | Loads documents from files                 | Google Drive                    | Recursive Character Text Splitter   |             |
| Recursive Character Text Splitter | @n8n/n8n-nodes-langchain.textSplitterRecursiveCharacterTextSplitter | Splits documents into chunks              | Default Data Loader             | Embeddings OpenAI1                 |             |
| Embeddings OpenAI1         | @n8n/n8n-nodes-langchain.embeddingsOpenAi         | Embeds document chunks                     | Recursive Character Text Splitter | Pinecone Vector Store              |             |
| When Executed by Another Workflow | n8n-nodes-base.executeWorkflowTrigger          | Receives external workflow calls          | (External)                      | Notion                            |             |
| Notion                    | n8n-nodes-base.notion                             | Reads/aggregates Notion data               | When Executed by Another Workflow | Aggregate                        |             |
| Aggregate                 | n8n-nodes-base.aggregate                          | Aggregates Notion data                     | Notion                         | Edit Fields                      |             |
| Edit Fields               | n8n-nodes-base.set                               | Adjusts/sets data fields                    | Aggregate                      | (Downstream nodes)               |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Gmail Trigger node**  
   - Type: Gmail Trigger  
   - Credentials: Configure with Gmail OAuth2 credentials for reading emails  
   - Purpose: Listen for new incoming emails

2. **Add a Set node named "Set Data"**  
   - Purpose: Format and extract relevant data fields from the Gmail Trigger output (e.g., subject, body, sender)  
   - Connect Gmail Trigger → Set Data

3. **Add a Chain LLM node "Check if Question"**  
   - Type: Langchain Chain LLM node  
   - Language Model: Connect to OpenAI Chat Model credentials  
   - Purpose: Analyze email content to determine if it contains a question  
   - Connect Set Data → Check if Question

4. **Add an OpenAI Chat Model node "OpenAI Chat Model2"**  
   - Type: Langchain LM Chat OpenAI node  
   - Configure with OpenAI API credentials  
   - Connect to "Check if Question" as language model support

5. **Add an If node**  
   - Configure condition based on "Check if Question" output to detect if email is a question  
   - Connect Check if Question → If

6. **Create "Search Information" agent node**  
   - Type: Langchain Agent  
   - Configure with OpenAI Chat Model as language model  
   - Add tools: Vector Store search, Brand brief workflow tool, and Memory buffer  
   - Connect If (true branch) → Search Information

7. **Add "Simple Memory" node**  
   - Type: Memory Buffer Window for AI context  
   - Connect to "Search Information" ai_memory input

8. **Add "Get Brand brief" node**  
   - Type: Workflow Tool node  
   - Configure to call a brand brief sub-workflow (create separately if missing)  
   - Connect to Search Information ai_tool input

9. **Add OpenAI Chat Model node "OpenAI Chat Model"**  
   - Connect as languageModel input to Search Information

10. **Add Pinecone Vector Store nodes**  
    - Add "Pinecone Vector Store1" for querying  
    - Add "Embeddings OpenAI" to generate embeddings  
    - Connect Embeddings OpenAI → Pinecone Vector Store1 → Answer questions with a vector store → Search Information

11. **Add "Answer questions with a vector store" tool node**  
    - Connect inputs from Pinecone Vector Store1 and OpenAI Chat Model1  
    - Connect output to Search Information

12. **Add "OpenAI Chat Model1" node**  
    - Connect as languageModel input to "Answer questions with a vector store" node

13. **Add "Response writer" agent node**  
    - Type: Langchain Agent  
    - Configure to take output from Search Information and produce final answer text  
    - Connect Search Information → Response writer

14. **Add "OpenAI Chat Model3" node**  
    - Connect as languageModel input to Response writer for final text polishing

15. **Add a Gmail node**  
    - Configure with Gmail OAuth2 credentials for sending emails  
    - Connect Response writer → Gmail to send generated reply

16. **Set up Knowledge Base Maintenance:**  
    - Add Google Drive Trigger node to listen to document changes  
    - Add Google Drive node to fetch changed documents  
    - Add Default Data Loader node to load documents  
    - Add Recursive Character Text Splitter to chunk text  
    - Add Embeddings OpenAI1 node to create embeddings  
    - Add Pinecone Vector Store node to store embeddings  
    - Connect nodes in the order: Google Drive Trigger → Google Drive → Default Data Loader → Recursive Character Text Splitter → Embeddings OpenAI1 → Pinecone Vector Store

17. **Add external trigger "When Executed by Another Workflow"**  
    - Connect to Notion node to fetch additional data if needed  
    - Connect Notion → Aggregate → Edit Fields for data preparation

18. **Configure all OpenAI nodes with correct API keys and settings**  
    - Set model names (e.g., gpt-4 or gpt-3.5-turbo) as per requirements  
    - Manage rate limits and error handling policies

19. **Configure Pinecone nodes**  
    - Provide API keys and environment details  
    - Create or link correct indexes for vector storage and retrieval

20. **Test the entire flow**  
    - Send emails with questions to the connected Gmail  
    - Verify AI response generation and email reply sending  
    - Update documents in Google Drive and check vector store updating

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                                       |
|-----------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| This workflow uses OpenAI GPT-based language models for AI processing and Pinecone as a vector database.  | Ensure API keys and quotas are correctly set up for both services.   |
| For best performance, maintain updated document embeddings in Pinecone by monitoring Google Drive changes.| Google Drive Trigger node automates this process.                    |
| Brand brief sub-workflow is used to inject company-specific context into AI responses.                     | Customizable per organization; create as a separate workflow.        |
| Gmail node requires OAuth2 credentials with send and read permissions.                                    | Avoid Gmail API quota issues by managing usage and caching results.  |
| AI memory buffer helps maintain conversational context for multi-turn interactions.                       | Adjust memory window size to balance context and performance.        |

---

**Disclaimer:** The provided text stems exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.

---