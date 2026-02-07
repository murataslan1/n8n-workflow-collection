AI Crew to Automate Fundamental Stock Analysis - Q&A Workflow  

https://n8nworkflows.xyz/workflows/ai-crew-to-automate-fundamental-stock-analysis---q-a-workflow---2183


# AI Crew to Automate Fundamental Stock Analysis - Q&A Workflow  

### 1. Workflow Overview

This workflow automates fundamental stock analysis by implementing a Stock Q&A engine that answers questions using SEC 10K data. It is designed as the back-end component of a two-part system, where the front-end (either CrewAI agents or a fully visual n8n template) automatically generates relevant questions. The workflow ingests company annual reports in PDF format, processes them into searchable vector embeddings, stores them in a vector database (Qdrant), and finally answers user questions by retrieving and analyzing relevant document chunks.

The workflow is logically divided into two main blocks:

- **1.1 PDF Ingestion and Indexing:** Fetches a company’s annual report PDF from Google Drive, splits the content into manageable chunks, generates embeddings, and inserts those into a Qdrant vector store for later retrieval.
- **1.2 Question & Answer Engine:** Receives incoming chat questions via webhook, queries the Qdrant vector store to retrieve relevant document sections, and processes the retrieved data with an OpenAI-powered retrieval-based QA chain to generate precise answers, which are then returned as webhook responses.

---

### 2. Block-by-Block Analysis

#### 1.1 PDF Ingestion and Indexing

**Overview:**  
This block prepares the foundational data by fetching a PDF report from Google Drive, splitting it into chunks, generating vector embeddings, and storing them in Qdrant. This enables efficient semantic search for later question answering.

**Nodes Involved:**  
- When clicking "Execute Workflow"  
- Google Drive  
- Default Data Loader  
- Recursive Character Text Splitter1  
- Embeddings OpenAI  
- Qdrant Vector Store  
- Sticky Note (Step 1 explanation)

**Node Details:**

- **When clicking "Execute Workflow"**  
  - Type: Manual Trigger  
  - Role: Initiates the workflow manually for testing or batch processing  
  - Config: No parameters  
  - Input: None  
  - Output: Triggers Google Drive node  
  - Potential Failures: Manual trigger unavailable if disabled

- **Google Drive**  
  - Type: Google Drive node (OAuth2)  
  - Role: Downloads the PDF annual report from a predefined Google Drive file ID  
  - Config: Operation set to "download", fileId hardcoded to a PDF (e.g., crowdstrike.pdf)  
  - Input: Trigger from manual node  
  - Output: Binary PDF file data forwarded  
  - Credentials: Google Drive OAuth2 account required  
  - Potential Failures: Auth errors, file not found, permission denied  

- **Default Data Loader**  
  - Type: Langchain document loader node  
  - Role: Loads binary PDF data and prepares the document for chunking  
  - Config: `splitPages` enabled to separate by PDF pages  
  - Input: Binary PDF from Google Drive  
  - Output: Document object(s) for splitting  
  - Potential Failures: Unsupported file format, parsing errors  

- **Recursive Character Text Splitter1**  
  - Type: Langchain text splitter  
  - Role: Splits loaded documents into chunks of 3000 characters with 200 character overlap  
  - Config: chunkSize=3000, chunkOverlap=200  
  - Input: Document data from Default Data Loader  
  - Output: Text chunks for embedding  
  - Edge Cases: Very large documents may lead to many chunks, possible token limit considerations  

- **Embeddings OpenAI**  
  - Type: OpenAI embeddings node  
  - Role: Generates vector embeddings for each text chunk using OpenAI API  
  - Config: Default options, uses configured OpenAI API key  
  - Input: Text chunks from Recursive Character Text Splitter1  
  - Output: Embeddings for insertion into vector store  
  - Credentials: OpenAI API key required  
  - Potential Failures: API rate limits, auth errors  

- **Qdrant Vector Store**  
  - Type: Qdrant vector storage node  
  - Role: Inserts embeddings and associated metadata into the Qdrant collection named "crowd"  
  - Config: Insert mode, collection ID hardcoded as "crowd"  
  - Input: Embeddings from Embeddings OpenAI and document chunks from Default Data Loader  
  - Output: Confirmation of insertion  
  - Credentials: Qdrant API credentials required  
  - Potential Failures: Connectivity issues, auth errors, collection not found  

- **Sticky Note (Step 1)**  
  - Content: Explains that this block fetches the PDF, splits it into chunks, and inserts into Supabase index (note: actual vector store used is Qdrant in this workflow)  
  - Role: Documentation aid

---

#### 1.2 Question & Answer Engine

**Overview:**  
This block listens for incoming questions via webhook, retrieves relevant document chunks from Qdrant using vector similarity, then uses an OpenAI chat model in a retrieval-augmented QA chain to produce detailed, context-aware answers. The answers are returned through the webhook response.

**Nodes Involved:**  
- Webhook  
- Retrieval QA Chain  
- Vector Store Retriever  
- Qdrant Vector Store1  
- Embeddings OpenAI1  
- OpenAI Chat Model  
- Respond to Webhook  
- Sticky Note1 (Step 2 explanation)

**Node Details:**

- **Webhook**  
  - Type: HTTP Webhook (POST method)  
  - Role: Entry point for receiving stock analysis questions in JSON format  
  - Config: Path configured as a unique identifier; responseMode set to respond from node  
  - Input: Incoming HTTP POST requests with question payload (e.g., JSON with `body.input`)  
  - Output: Triggers Retrieval QA Chain  
  - Edge Cases: Invalid JSON, unexpected payload structure, security considerations  

- **Retrieval QA Chain**  
  - Type: Langchain Retrieval QA Chain  
  - Role: Processes user question text, retrieves relevant context via retriever, and generates AI answer using OpenAI chat model  
  - Config: Uses input text from webhook JSON fields; prompt type set to "define"  
  - Input: Question text from webhook or chat input  
  - Output: Textual answer passed to Respond to Webhook  
  - Edge Cases: Missing input text, retrieval failure, OpenAI API errors  

- **Vector Store Retriever**  
  - Type: Langchain retriever node  
  - Role: Retrieves top 5 most similar document chunks from Qdrant based on question embeddings  
  - Config: `topK=5` to limit number of returned chunks  
  - Input: Query embeddings from Embeddings OpenAI1 and Qdrant Vector Store1  
  - Output: Retrieved document context for QA chain  
  - Edge Cases: Empty retrieval results, Qdrant connection issues  

- **Qdrant Vector Store1**  
  - Type: Qdrant vector store (retrieval mode)  
  - Role: Retrieves vectors from a dynamic collection based on company name provided in webhook JSON (`$json.body.company`)  
  - Config: Collection ID dynamically set from incoming request  
  - Input: Embeddings from Embeddings OpenAI1  
  - Output: Vectors forwarded to Vector Store Retriever  
  - Credentials: Qdrant API credentials  
  - Edge Cases: Missing or invalid company parameter, collection not found  

- **Embeddings OpenAI1**  
  - Type: OpenAI embeddings node  
  - Role: Generates embeddings for the incoming question text for similarity search  
  - Config: Default options  
  - Input: Text from webhook JSON body  
  - Output: Query embeddings for retrieval  
  - Credentials: OpenAI API key  
  - Edge Cases: API limits, invalid input  

- **OpenAI Chat Model**  
  - Type: OpenAI Chat Completion (GPT-4o-mini)  
  - Role: Generates final natural language answer from retrieved context and user question  
  - Config: Model set to "gpt-4o-mini" for cost-effective yet capable responses  
  - Input: QA chain documents and question  
  - Output: Answer text for webhook response  
  - Credentials: OpenAI API key  
  - Edge Cases: API failures, timeout, token limit exceeded  

- **Respond to Webhook**  
  - Type: n8n standard respond node  
  - Role: Sends the generated answer text back as HTTP response to the webhook caller  
  - Config: Responds with plain text, response body set to the QA chain output field `$json.response.text`  
  - Input: Answer text from Retrieval QA Chain  
  - Output: HTTP response to client  
  - Edge Cases: Response formatting errors  

- **Sticky Note1 (Step 2)**  
  - Content: Explains that incoming messages from webhook are queried against the Supabase vector store (actually Qdrant here) and responses sent back via webhook  
  - Role: Documentation aid

---

### 3. Summary Table

| Node Name                   | Node Type                                  | Functional Role                      | Input Node(s)                 | Output Node(s)               | Sticky Note                                                                                           |
|-----------------------------|--------------------------------------------|-----------------------------------|------------------------------|------------------------------|-----------------------------------------------------------------------------------------------------|
| When clicking "Execute Workflow" | Manual Trigger                           | Initiate PDF ingestion process     | -                            | Google Drive                 |                                                                                                     |
| Google Drive                | Google Drive OAuth2                        | Download annual report PDF          | When clicking "Execute Workflow" | Qdrant Vector Store          |                                                                                                     |
| Default Data Loader         | Langchain Document Loader                  | Load and parse PDF into documents   | Recursive Character Text Splitter1 | Qdrant Vector Store          |                                                                                                     |
| Recursive Character Text Splitter1 | Langchain Text Splitter                  | Split document into chunks          | Default Data Loader           | Qdrant Vector Store          |                                                                                                     |
| Embeddings OpenAI           | OpenAI Embeddings                          | Generate vector embeddings          | Recursive Character Text Splitter1 | Qdrant Vector Store          |                                                                                                     |
| Qdrant Vector Store         | Qdrant Vector Store                        | Insert embeddings into vector DB    | Google Drive, Embeddings OpenAI, Default Data Loader | -                            | Step 1: Fetch file, split into chunks and insert into Supabase index (Qdrant here)                  |
| Webhook                    | HTTP Webhook                              | Receive user Q&A requests           | -                            | Retrieval QA Chain           | Step 2: Incoming message queried from vector store and response provided back through webhook       |
| Embeddings OpenAI1          | OpenAI Embeddings                          | Generate query embeddings for Q&A  | Webhook                      | Qdrant Vector Store1         |                                                                                                     |
| Qdrant Vector Store1        | Qdrant Vector Store                        | Retrieve vectors from company index | Embeddings OpenAI1           | Vector Store Retriever       |                                                                                                     |
| Vector Store Retriever      | Vector Store Retriever                     | Retrieve relevant document chunks  | Qdrant Vector Store1          | Retrieval QA Chain           |                                                                                                     |
| Retrieval QA Chain          | Langchain Retrieval QA Chain               | Process question and generate answer | Webhook, Vector Store Retriever, OpenAI Chat Model | Respond to Webhook           |                                                                                                     |
| OpenAI Chat Model           | OpenAI Chat Completion                      | Generate final answer text          | Retrieval QA Chain           | Retrieval QA Chain           |                                                                                                     |
| Respond to Webhook          | Respond To Webhook                         | Return answer via HTTP response     | Retrieval QA Chain           | -                            |                                                                                                     |
| Sticky Note                 | Sticky Note                               | Documentation (Step 1)              | -                            | -                            | Step 1: Upserting the PDF - Fetch file from Google Drive, split it into chunks and insert into Supabase index |
| Sticky Note1                | Sticky Note                               | Documentation (Step 2)              | -                            | -                            | Step 2: Setup the Q&A - Incoming message from webhook queried from vector store and response provided in webhook |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: To start the ingestion process manually for testing  

2. **Create Google Drive Node**  
   - Type: Google Drive (OAuth2)  
   - Operation: Download file  
   - Parameter: Set `fileId` to the target PDF (e.g., company 10K report)  
   - Credentials: Configure Google Drive OAuth2 credentials  
   - Connect "Manual Trigger" → "Google Drive"  

3. **Create Default Data Loader Node**  
   - Type: Langchain Document Default Data Loader  
   - Parameter: Enable `splitPages` option to true  
   - Input: Set to receive binary PDF from Google Drive  
   - Connect "Google Drive" → "Default Data Loader"  

4. **Create Recursive Character Text Splitter Node**  
   - Type: Langchain Recursive Character Text Splitter  
   - Parameters: `chunkSize`=3000, `chunkOverlap`=200  
   - Connect "Default Data Loader" → "Recursive Character Text Splitter"  

5. **Create Embeddings OpenAI Node**  
   - Type: OpenAI Embeddings  
   - Parameters: Default  
   - Credentials: Configure OpenAI API key  
   - Connect "Recursive Character Text Splitter" → "Embeddings OpenAI"  

6. **Create Qdrant Vector Store Node (Insert Mode)**  
   - Type: Qdrant Vector Store  
   - Mode: Insert  
   - Parameter: Set Qdrant collection ID to "crowd" (or your target collection)  
   - Credentials: Configure Qdrant API credentials  
   - Connect "Google Drive" (binary data), "Default Data Loader" (documents), and "Embeddings OpenAI" (embeddings) to this node appropriately  

7. **Create Webhook Node**  
   - Type: Webhook (POST)  
   - Path: Set a unique path identifier  
   - Response Mode: Respond from node  
   - Purpose: Receive incoming chat questions for analysis  

8. **Create Embeddings OpenAI Node (Query Embeddings)**  
   - Duplicate Embeddings OpenAI node  
   - Input: Extract question text from webhook JSON body (e.g., `$json.body.input`)  
   - Connect "Webhook" → "Embeddings OpenAI1"  

9. **Create Qdrant Vector Store Node (Retrieve Mode)**  
   - Type: Qdrant Vector Store  
   - Mode: Retrieval  
   - Collection ID: Dynamically set from webhook JSON property (e.g., `$json.body.company`)  
   - Credentials: Use Qdrant API credentials  
   - Connect "Embeddings OpenAI1" → "Qdrant Vector Store1"  

10. **Create Vector Store Retriever Node**  
    - Type: Vector Store Retriever  
    - Parameter: `topK=5`  
    - Connect "Qdrant Vector Store1" → "Vector Store Retriever"  

11. **Create OpenAI Chat Model Node**  
    - Type: OpenAI Chat Completion  
    - Model: Set to "gpt-4o-mini" for cost-effective GPT-4 variant  
    - Credentials: OpenAI API key  
    - Connect "Vector Store Retriever" → "Retrieval QA Chain" (as AI retriever)  
    - Connect "OpenAI Chat Model" → "Retrieval QA Chain" (as language model)  

12. **Create Retrieval QA Chain Node**  
    - Type: Langchain Retrieval QA Chain  
    - Text Input: Use `$json.body.input` or `$json.chatInput` from webhook  
    - Connect "Webhook" → "Retrieval QA Chain" (text input)  
    - Connect "Vector Store Retriever" → "Retrieval QA Chain" (retriever)  
    - Connect "OpenAI Chat Model" → "Retrieval QA Chain" (language model)  

13. **Create Respond to Webhook Node**  
    - Type: Respond to Webhook  
    - Respond With: Text  
    - Response Body: Use `$json.response.text` from Retrieval QA Chain output  
    - Connect "Retrieval QA Chain" → "Respond to Webhook"  

14. **Add Sticky Notes** (Optional)  
    - Add notes describing Step 1 (PDF ingestion) and Step 2 (Q&A setup) for documentation and clarity  

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                                                                                            |
|-----------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| Front-end options include CrewAI environment on Replit or fully visual n8n template for question generation | [CrewAI Agent Environment](https://replit.com/@DerekCheung9/AI-Automation-For-Finance)                                      |
| Detailed Youtube overview of the AI Crew system for financial data analysis                                | [Youtube Overview Video](https://www.youtube.com/watch?v=pMvizUx5n1g)                                                       |
| Workflow uses Qdrant as vector store rather than Supabase as described in sticky notes                     | Important to ensure correct vector DB credentials and collection names                                                     |
| OpenAI model used for answering is "gpt-4o-mini" for balance of cost and capability                        | Alternative models can be substituted as needed                                                                             |

---

This documentation enables advanced users and AI agents to understand the workflow’s structure, replicate it fully, and anticipate integration challenges such as API limits, credential setup, and dynamic collection handling.