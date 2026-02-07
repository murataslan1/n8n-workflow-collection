Answer Questions from Documents with RAG using Supabase, OpenAI & Cohere Reranker

https://n8nworkflows.xyz/workflows/answer-questions-from-documents-with-rag-using-supabase--openai---cohere-reranker-6345


# Answer Questions from Documents with RAG using Supabase, OpenAI & Cohere Reranker

### 1. Workflow Overview

This workflow implements a Retrieval-Augmented Generation (RAG) system designed to answer questions from a domain-specific document — in this case, the "Rules of Golf" PDF. It combines document ingestion, vectorization with metadata, and a multi-stage AI question-answering pipeline using Supabase as a vector store, OpenAI for embeddings and language modeling, and Cohere for relevance re-ranking. The workflow supports both document ingestion and question answering via chat.

**Target Use Cases:**  
- Ingest and index domain documents with metadata for semantic search  
- Answer user questions referencing indexed content with context-aware retrieval  
- Use AI reranking to improve result relevance  
- Support real-time chat interaction with knowledge grounded in documents

**Logical Blocks:**

- **1.1 Document Ingestion and Vectorization:** Download PDF, extract text, split into logical sections with metadata, generate embeddings, and upload to Supabase vector store.  
- **1.2 RAG Question-Answering Agent:** Receive chat input, use metadata extraction agent to interpret queries, retrieve relevant documents from Supabase with reranking, and answer using an OpenAI chat model.  
- **1.3 Auxiliary and Support Nodes:** Manual trigger for ingestion start, sticky notes for documentation, and multiple AI nodes for embedding, reranking, and retrieval.

---

### 2. Block-by-Block Analysis

#### 2.1 Document Ingestion and Vectorization

- **Overview:**  
Downloads the rules PDF from Google Drive, extracts text, splits it into individual rules with metadata, generates embeddings for each, and uploads them into a Supabase vector store for retrieval.

- **Nodes Involved:**  
  - Manual Trigger  
  - Download File (Google Drive)  
  - Extract from File (PDF extraction)  
  - Code (Text splitting and metadata extraction)  
  - Default Data Loader (Prepare documents with metadata)  
  - Embeddings OpenAI1 (Create vector embeddings)  
  - Upload to Supabase (Insert embeddings into vector DB)  
  - Embeddings OpenAI (alternative embedding node)  
  - Sticky Note (Documentation)

- **Node Details:**

  - **Manual Trigger**  
    - Type: Trigger  
    - Role: Starts ingestion flow manually  
    - Inputs: None  
    - Outputs: Triggers "Download File" node  
    - Edge Cases: None

  - **Download File**  
    - Type: Google Drive node  
    - Role: Downloads specified PDF by file ID  
    - Configuration: File ID hardcoded pointing to "Rules_of_Golf_Simplified.pdf"  
    - Credentials: Google Drive OAuth2 with authorized account  
    - Inputs: Trigger output  
    - Outputs: Binary PDF file data to "Extract from File"  
    - Failure Modes: File not found, permission denied, network issues

  - **Extract from File**  
    - Type: PDF extraction  
    - Role: Extracts raw text content from PDF binary data  
    - Inputs: PDF binary from "Download File"  
    - Outputs: Text content for code splitting  
    - Failure Modes: Corrupt PDF, unsupported format

  - **Code**  
    - Type: JavaScript code node  
    - Role: Splits full text into discrete rule sections, extracts rule numbers and titles, outputs array of JSON items with metadata fields (`ruleNumber`, `ruleTitle`, `fullText`, `originalIndex`)  
    - Key Expressions: Uses RegExp to split by "Rule X" and parse titles  
    - Inputs: Text from "Extract from File"  
    - Outputs: Structured JSON for each rule section  
    - Edge Cases: Unexpected text formatting, missing rule numbers

  - **Default Data Loader**  
    - Type: Document loader (LangChain default)  
    - Role: Converts JSON data into document format with metadata, using `ruleNumber` from the code output  
    - Inputs: JSON data from "Code" node  
    - Outputs: Document objects for embedding  
    - Edge Cases: Metadata missing or malformed

  - **Embeddings OpenAI1**  
    - Type: AI embedding node (OpenAI)  
    - Role: Generates vector embeddings for each document chunk  
    - Credentials: OpenAI API key  
    - Inputs: Document data from Default Data Loader  
    - Outputs: Embedding vectors for Supabase insertion  
    - Edge Cases: API key invalid, rate limits

  - **Upload to Supabase**  
    - Type: Vector store node (Supabase)  
    - Role: Inserts embeddings with metadata into Supabase table `documents`  
    - Credentials: Supabase API with proper access  
    - Inputs: Embeddings from OpenAI node  
    - Outputs: Confirmation of insertion  
    - Edge Cases: DB connection issues, table schema mismatch

  - **Sticky Note**  
    - Type: Documentation node  
    - Content: "# Vectorize Document w/ Metadata (this code node is set up for the golf rules PDF specifically)"  
    - Role: Provides high-level context for this block

#### 2.2 RAG Question-Answering Agent

- **Overview:**  
Handles incoming chat messages, extracts the relevant rule number from the question, retrieves contextually relevant documents using Supabase with Cohere reranking, then uses OpenAI chat models to generate an accurate answer grounded in the retrieved data.

- **Nodes Involved:**  
  - When chat message received (Chat trigger)  
  - Metadata Agent (AI agent for rule number extraction)  
  - RAG Agent / RAG Agent 2 (Primary AI agents for answering)  
  - Supabase Vector Store / Supabase Vector Store1 (Vector retrieval with metadata filters)  
  - Reranker Cohere / Reranker Cohere1 (Re-ranks retrieved results)  
  - Embeddings OpenAI / Embeddings OpenAI2 (Embeddings for query vectorization)  
  - GPT 4.1-mini / GPT 4.1-mini1 (OpenAI chat model nodes)  
  - Sticky Notes (Documentation)

- **Node Details:**

  - **When chat message received**  
    - Type: Chat trigger  
    - Role: Entry point for user queries via chat interface  
    - Outputs: Feeds query into "RAG Agent" node  
    - Edge Cases: Empty input, malformed chat messages

  - **Metadata Agent**  
    - Type: LangChain AI agent  
    - Role: Parses user input to extract the relevant `ruleNumber` for metadata filtering  
    - Configuration: System message instructs agent to output only rule number  
    - Input: User query text from chat node  
    - Output: Extracted rule number (e.g., "27")  
    - Edge Cases: Ambiguous or no rule number present, output formatting errors

  - **RAG Agent / RAG Agent 2**  
    - Type: LangChain AI agent  
    - Role: Processes user question, uses the Supabase vector store as a tool to retrieve relevant documents, and generates an answer  
    - Configuration: System message frames agent as golf rules expert using Supabase Vector Store tool  
    - Inputs: User query, retrieved documents  
    - Outputs: Final chat response  
    - Edge Cases: Model timeouts, incomplete context, ambiguous queries

  - **Supabase Vector Store / Supabase Vector Store1**  
    - Type: Vector retrieval tool node  
    - Role: Executes similarity search against Supabase `documents` table, optionally filtered by metadata such as `ruleNumber`  
    - Configuration: Top K=20 results, reranker enabled, tool description for agent use  
    - Credentials: Supabase API  
    - Inputs: Query embeddings from embedding nodes  
    - Outputs: Retrieved documents with metadata  
    - Edge Cases: No matching documents, DB connection errors

  - **Reranker Cohere / Reranker Cohere1**  
    - Type: AI reranker node (Cohere)  
    - Role: Re-ranks retrieved documents to improve relevance before final answer generation  
    - Credentials: Cohere API key  
    - Inputs: Retrieved documents from Supabase nodes  
    - Outputs: Re-ranked documents passed back to Supabase node for tool use  
    - Edge Cases: API errors, rate limiting

  - **Embeddings OpenAI / Embeddings OpenAI2**  
    - Type: Embedding nodes for query vectorization  
    - Role: Converts user question into embedding vectors for vector store querying  
    - Credentials: OpenAI API key  
    - Inputs: User question text  
    - Outputs: Query embeddings  
    - Edge Cases: Invalid API key, rate limiting

  - **GPT 4.1-mini / GPT 4.1-mini1**  
    - Type: OpenAI chat model nodes (via OpenRouter)  
    - Role: Language model to generate final user answer after retrieval and reranking  
    - Credentials: OpenRouter API key  
    - Inputs: Query and retrieved context  
    - Outputs: Final response text  
    - Edge Cases: API throttling, malformed prompts

  - **Sticky Notes**  
    - "RAG Agent" block notes the AI agent role and setup  
    - "Vector Store w/ Reranker" explains retrieval enhancements  
    - "Metadata Agent" documents the specific agent for rule number extraction

---

### 3. Summary Table

| Node Name               | Node Type                              | Functional Role                         | Input Node(s)                           | Output Node(s)                         | Sticky Note                                                                                         |
|-------------------------|--------------------------------------|---------------------------------------|---------------------------------------|---------------------------------------|---------------------------------------------------------------------------------------------------|
| Manual Trigger          | Trigger                              | Start document ingestion               | None                                  | Download File                         |                                                                                                   |
| Download File           | Google Drive File                    | Download Rules PDF                     | Manual Trigger                        | Extract from File                    |                                                                                                   |
| Extract from File       | PDF Extractor                       | Extract text from PDF                  | Download File                        | Code                                 |                                                                                                   |
| Code                    | JavaScript Code                    | Split text into rules with metadata   | Extract from File                    | Default Data Loader, Upload to Supabase | # Vectorize Document w/ Metadata (this code node is set up for the golf rules PDF specifically)   |
| Default Data Loader     | Document Loader (LangChain)         | Prepare documents with metadata       | Code                                | Upload to Supabase                  |                                                                                                   |
| Embeddings OpenAI1      | Embeddings (OpenAI)                  | Create embeddings for documents       | Default Data Loader                  | Upload to Supabase                  |                                                                                                   |
| Upload to Supabase      | Vector Store (Supabase)              | Insert embeddings into vector DB      | Code, Embeddings OpenAI1             |                                   |                                                                                                   |
| When chat message received | Chat trigger                       | Entry point for user questions         | None                              | RAG Agent                           | # RAG Agent                                                                                       |
| Metadata Agent          | AI Agent (LangChain)                 | Extract rule number from question     | GPT 4.1-mini1                       | RAG Agent 2                        | # Metadata Agent                                                                                   |
| RAG Agent               | AI Agent (LangChain)                 | Process user query and answer         | When chat message received, Supabase Vector Store |                                | # RAG Agent                                                                                       |
| RAG Agent 2             | AI Agent (LangChain)                 | Process user query with metadata      | Metadata Agent                     |                                   |                                                                                                   |
| Supabase Vector Store   | Vector Store (Supabase)              | Retrieve documents for question       | Reranker Cohere                    | RAG Agent                         | ## Vector Store w/ Reranker                                                                       |
| Supabase Vector Store1  | Vector Store (Supabase)              | Retrieve documents with metadata      | Reranker Cohere1                   | RAG Agent 2                       | ## Vector Store w/ Reranker & Metadata                                                           |
| Reranker Cohere         | AI Reranker (Cohere)                 | Rerank retrieved documents            | Supabase Vector Store              | Supabase Vector Store              |                                                                                                   |
| Reranker Cohere1        | AI Reranker (Cohere)                 | Rerank retrieved documents            | Supabase Vector Store1             | Supabase Vector Store1             |                                                                                                   |
| Embeddings OpenAI       | Embeddings (OpenAI)                  | Create query embeddings                | GPT 4.1-mini                      | Supabase Vector Store              |                                                                                                   |
| Embeddings OpenAI2      | Embeddings (OpenAI)                  | Create query embeddings                | GPT 4.1-mini1                     | Supabase Vector Store1             |                                                                                                   |
| GPT 4.1-mini            | Chat Model (OpenAI via OpenRouter)  | Generate answer from retrieved data   | When chat message received         | RAG Agent                        |                                                                                                   |
| GPT 4.1-mini1           | Chat Model (OpenAI via OpenRouter)  | Generate answer with metadata filtering | Metadata Agent                   | RAG Agent 2                      |                                                                                                   |
| Sticky Note             | Documentation                       | Notes on document vectorization       | None                              | None                              | # Vectorize Document w/ Metadata (this code node is set up for the golf rules PDF specifically)   |
| Sticky Note1            | Documentation                       | Notes on RAG Agent                     | None                              | None                              | # RAG Agent                                                                                       |
| Sticky Note2            | Documentation                       | Notes on Vector Store with Reranker   | None                              | None                              | ## Vector Store w/ Reranker                                                                       |
| Sticky Note3            | Documentation                       | Notes on RAG Agent                     | None                              | None                              | # RAG Agent                                                                                       |
| Sticky Note4            | Documentation                       | Notes on Vector Store w/ Reranker & Metadata | None                        | None                              | ## Vector Store w/ Reranker & Metadata                                                           |
| Sticky Note5            | Documentation                       | Notes on Metadata Agent                | None                              | None                              | # Metadata Agent                                                                                   |
| Sticky Note6            | Documentation                       | Setup guide and credits                | None                              | None                              | # 🛠️ Setup Guide  \n**Author:** [Nate Herk](https://www.youtube.com/@nateherk) ... See section 5 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node:**  
   - Purpose: to manually start the document ingestion flow.

2. **Add a Google Drive node (Download File):**  
   - Operation: Download  
   - File ID: Set to the PDF file to ingest (e.g., "16ahWlNwBvd53xFHA4UUh6EbkFd8ogxBv")  
   - Credentials: Connect Google Drive OAuth2 credentials with access to the file.  
   - Connect Manual Trigger → Download File.

3. **Add Extract from File node:**  
   - Operation: PDF extraction  
   - Input: Connect from Download File node output.  
   - Purpose: Extract raw text from the downloaded PDF.

4. **Add a Code node to split text into rule sections:**  
   - Paste the provided JavaScript code that:  
     - Takes the extracted text input  
     - Splits by "Rule X" pattern  
     - Extracts `ruleNumber`, `ruleTitle`, and full text for each rule  
   - Connect Extract from File → Code.

5. **Add Default Data Loader node (LangChain Document Loader):**  
   - Mode: expressionData  
   - JSON data: Set to `={{ $('Code').item.json.fullText }}` or whole array  
   - Metadata: Map `ruleNumber` from code output  
   - Connect Code → Default Data Loader.

6. **Add Embeddings OpenAI node:**  
   - Credentials: Configure OpenAI API key (recommended model: text-embedding-3-small or similar)  
   - Connect Default Data Loader → Embeddings OpenAI.

7. **Add Upload to Supabase node:**  
   - Mode: Insert  
   - Table name: `documents` (or your table)  
   - Credentials: Set Supabase API key with write access  
   - Connect Embeddings OpenAI → Upload to Supabase.

8. **Create Chat Trigger node (When chat message received):**  
   - Sets up webhook to receive chat messages.

9. **Add Metadata Agent (LangChain AI Agent):**  
   - System message instructs to extract only the rule number from user input.  
   - Connect GPT 4.1-mini1 output → Metadata Agent.

10. **Add GPT 4.1-mini1 node:**  
    - Language model using OpenRouter API key (OpenAI)  
    - Connect When chat message received → GPT 4.1-mini1.

11. **Add Embeddings OpenAI2 node:**  
    - Credentials: Same OpenAI API key  
    - Connect GPT 4.1-mini1 → Embeddings OpenAI2.

12. **Add Supabase Vector Store1 node:**  
    - Mode: Retrieve-as-tool  
    - Table: `documents`  
    - Use reranker enabled  
    - Metadata filter: Use ruleNumber from Metadata Agent output to filter results  
    - Credentials: Supabase API key  
    - Connect Embeddings OpenAI2 → Supabase Vector Store1.

13. **Add Reranker Cohere1 node:**  
    - Credentials: Cohere API key  
    - Connect Supabase Vector Store1 → Reranker Cohere1 → Supabase Vector Store1 (reranked results).

14. **Add RAG Agent 2 node:**  
    - System message: Expert golf rules AI using "Supabase Vector Store" tool  
    - Text input: From chat message  
    - Connect Supabase Vector Store1 → RAG Agent 2.  
    - Also connect Metadata Agent → RAG Agent 2.

15. **Add RAG Agent node:**  
    - Similar setup for non-metadata filtered queries if needed  
    - Connect When chat message received → GPT 4.1-mini → RAG Agent → Supabase Vector Store → Reranker Cohere → Supabase Vector Store.

16. **Add Sticky Notes as documentation nodes:**  
    - Add notes explaining each functional block and instructions.

17. **Credential Setup:**  
    - Google Drive OAuth2 for downloading files  
    - Supabase API key for vector store access  
    - OpenAI API key for embeddings and chat models (via OpenRouter)  
    - Cohere API key for reranking

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Context or Link                                                                                                    |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| # 🛠️ Setup Guide  \n**Author:** [Nate Herk](https://www.youtube.com/@nateherk)  \n\nFollow the steps below to get your Retrieval-Augmented Generation (RAG) workflow up and running:\n\n### ✅ Step 1: Connect Your [Supabase](https://supabase.com/) Vector Store  \nEnsure your Supabase instance is ready and accessible. This will store your embedded documents with metadata.\nHere is a [video tutorial](https://youtu.be/JjBofKJnYIU) on setting that up.\n\n### ✅ Step 2: Connect Your [OpenAI](https://platform.openai.com/account/api-keys) Embeddings  \nUse the `text-embedding-3-small` or similar model for embedding your documents. Make sure your API key is active.\n\n### ✅ Step 3: Connect Your [OpenAI API Key](https://platform.openai.com/account/api-keys)  \nThis powers your embedding generation model. Add it via the HTTP Request node or a credential.\n\n### ✅ Step 4: Add Your [OpenRouter](https://openrouter.ai/) API Key  \nUse this for your main RAG agent—add your key via HTTP request or credential node.\n\n### ✅ Step 5: Connect a [Cohere](https://dashboard.cohere.com/api-keys) Re-Ranker  \nThe re-ranker improves answer quality. Add your API key for better relevance ranking on retrieved documents.\n\n### ✅ Step 6: Vectorize Documents with Metadata  \nEnsure your data ingestion process tags documents with meaningful metadata before vectorization. This helps with structured retrieval.\n\n### 💬 Final Step: Start Chatting  \nPrompt your agent and test the RAG flow end-to-end—watch it pull context-rich answers from your vector store. | Setup guide sticky note inside the workflow, includes author credit and resource links                   |
| The workflow is tailored specifically to the "Rules of Golf" PDF document, with custom text splitting code to segment rules and extract metadata. For other documents, the splitting logic and metadata extraction must be adapted accordingly.                                                                                                                                                                                                                                                                                              | General caution about custom code node and document-specific logic                                            |
| The Cohere reranker node is used to improve retrieval relevance, which requires a valid Cohere API key and internet access.                                                                                                                                                                                                                                                                                                                                                                                                           | Notes on reranker usage                                                                                          |
| The workflow uses OpenRouter to access OpenAI GPT-4.1 language models, requiring an OpenRouter API key configured in credentials.                                                                                                                                                                                                                                                                                                                                                                                                    | Notes on language model access                                                                                   |

---

**Disclaimer:** The provided text is exclusively generated from an automated workflow realized with n8n, a tool for integration and automation. This processing strictly complies with current content policies and contains no illegal, offensive, or protected material. All handled data is legal and public.