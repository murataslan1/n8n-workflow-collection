AI-Powered Stock Analysis with AI Scoring and Gmail Report Delivery

https://n8nworkflows.xyz/workflows/ai-powered-stock-analysis-with-ai-scoring-and-gmail-report-delivery-6823


# AI-Powered Stock Analysis with AI Scoring and Gmail Report Delivery

### 1. Workflow Overview

This workflow automates AI-powered stock market analysis and deep report generation using Danelfin’s advanced financial scoring API, complemented by vector-based data retrieval from a Supabase vector store. It targets users who want detailed, AI-enhanced insights on stocks, industries, and sectors, with scoring and strategy insights, delivered conveniently via Gmail email reports.

The workflow is logically divided into these main blocks:

**1.1 Input Reception and Context Setup**  
Receives user queries via a chat trigger, manages conversation memory to preserve context, and sets up the AI reasoning model for processing.

**1.2 AI Stock Analysis Agent (Danelfin API Integration)**  
Processes user input to query Danelfin’s REST API endpoints (`/ranking`, `/sectors`, `/industries`) and retrieves stock scores, sector, and industry data. Uses embedded vector data from Supabase for enhanced context and reranking of results.

**1.3 Data Embedding and Vector Store Management**  
Handles loading and embedding of documents (like PDFs) into the Supabase vector store, enabling efficient vector-based retrieval during analysis.

**1.4 Report Generation and Delivery**  
Converts AI-generated markdown reports into HTML and sends them via Gmail to a predefined recipient.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Context Setup

**Overview:**  
This block captures incoming user chat messages, maintains conversation memory in Postgres, and configures the AI language model for reasoning.

**Nodes Involved:**  
- When chat message received  
- Postgres Chat Memory1  
- Set a reasoning model

**Node Details:**  

- **When chat message received**  
  - Type: Chat trigger (LangChain)  
  - Role: Entry point for user queries requesting stock analysis  
  - Config: Default webhook, activated on incoming chat messages  
  - Inputs: External user message  
  - Outputs: Passes raw user input downstream  
  - Edge cases: Unhandled malformed messages, webhook failures

- **Postgres Chat Memory1**  
  - Type: LangChain Postgres chat memory  
  - Role: Stores and retrieves conversation history to maintain context  
  - Config: Connected to Postgres with proper credentials, no extra parameters  
  - Inputs: User message from trigger  
  - Outputs: Contextualized conversation for AI agent  
  - Edge cases: Postgres connection errors, data corruption

- **Set a reasoning model**  
  - Type: LangChain chat language model (OpenRouter)  
  - Role: Provides AI model configuration for reasoning (model: x-ai/grok-4)  
  - Config: Uses OpenRouter API credentials, no special options  
  - Inputs: Conversation context from memory node  
  - Outputs: Prepared AI model instance for downstream agent  
  - Edge cases: API downtime, authentication failures

---

#### 2.2 AI Stock Analysis Agent (Danelfin API Integration)

**Overview:**  
This core block executes the main AI agent that interprets user requests, calls Danelfin’s financial data API endpoints, and integrates vector retrieval and reranking for precision. It generates a deep analytical report as markdown text.

**Nodes Involved:**  
- Danelfin request  
- ranking  
- sectors  
- industries  
- Supabase Vector Store1  
- Embeddings OpenAI  
- Reranker Cohere  
- Think  
- Markdown to HTML  
- Send report

**Node Details:**

- **Danelfin request**  
  - Type: LangChain agent node  
  - Role: Main AI agent interpreting the query and orchestrating API calls  
  - Config:  
    - System message defines expert API instruction to interact with Danelfin REST API  
    - Enforces authentication header, base URL, and detailed processing rules  
    - Calls Supabase Vector Store tool for knowledge of Danelfin technology and strategy  
  - Inputs: User query + AI model from previous block  
  - Outputs: AI-generated markdown report sent to Markdown to HTML node  
  - Edge cases: API auth errors (403), bad request (400), fallback on date queries, expression evaluation errors

- **ranking**  
  - Type: HTTP Request tool for Danelfin `/ranking` endpoint  
  - Role: Retrieves ticker scores and rankings using dynamic query parameters from the AI agent  
  - Config: Uses API key in HTTP header (danelfin credential), passes query params dynamically  
  - Inputs: Query params from AI agent prompts  
  - Outputs: Stock ranking JSON data to Danelfin request agent  
  - Edge cases: API timeouts, malformed queries, unauthorized access

- **sectors**  
  - Type: HTTP Request tool for Danelfin `/sectors` endpoint  
  - Role: Retrieves sector data for analysis  
  - Config: Similar to ranking node with header auth and dynamic queries  
  - Inputs/Outputs: Connected to Danelfin request agent  
  - Edge cases: Same as ranking node

- **industries**  
  - Type: HTTP Request tool for Danelfin `/industries` endpoint  
  - Role: Retrieves industry data for detailed analysis  
  - Config: As above with auth and parameters  
  - Inputs/Outputs: Linked with Danelfin request agent  
  - Edge cases: Same as ranking node

- **Supabase Vector Store1**  
  - Type: LangChain vector store (Supabase) in retrieval mode  
  - Role: Provides vector-based retrieval for Danelfin scoring and strategy knowledge, enhancing AI agent responses  
  - Config: Retrieves top 5 relevant vectors, uses reranker (Cohere), no metadata included  
  - Inputs: Embeddings from OpenAI and reranker outputs  
  - Outputs: Contextual data to Danelfin request agent  
  - Edge cases: Supabase connection failures, embedding mismatches

- **Embeddings OpenAI**  
  - Type: LangChain OpenAI embeddings node  
  - Role: Generates 1536-dimensional embeddings for vector store queries  
  - Config: Uses OpenAI API credentials, standard embedding size  
  - Inputs: Text data from AI agent or documents  
  - Outputs: Embeddings for Supabase Vector Store1  
  - Edge cases: Rate limits, API errors

- **Reranker Cohere**  
  - Type: LangChain reranker using Cohere model "rerank-english-v3.0"  
  - Role: Reranks retrieved vectors from Supabase for relevance  
  - Config: Uses Cohere API credentials, English model version 3.0  
  - Inputs: Retrieved vectors from Supabase Vector Store1  
  - Outputs: Ranked vectors back to Supabase Vector Store1  
  - Edge cases: API errors, model update incompatibilities

- **Think**  
  - Type: LangChain Tool Think node  
  - Role: Assists Danelfin request agent by providing additional reasoning or intermediate thinking steps  
  - Config: Default with empty parameters, acts as helper tool for AI agent  
  - Inputs: From Supabase Vector Store1  
  - Outputs: Back to Danelfin request agent  
  - Edge cases: Expression evaluation problems

- **Markdown to HTML**  
  - Type: Markdown conversion node  
  - Role: Converts AI-generated markdown report into HTML for email formatting  
  - Config: Converts `{{$json.output}}` markdown to HTML, no special options  
  - Inputs: Markdown text from Danelfin request node  
  - Outputs: HTML content to Send report node  
  - Edge cases: Malformed markdown causing conversion errors

- **Send report**  
  - Type: Gmail node  
  - Role: Sends the final HTML report via email  
  - Config:  
    - Recipient: paul@taskmorphr.com  
    - Subject: "Report"  
    - Message: HTML content from Markdown to HTML node  
    - Credentials: Gmail OAuth2 configured  
  - Inputs: HTML report from Markdown to HTML  
  - Outputs: Email sent confirmation  
  - Edge cases: Gmail API quota limits, authentication failures, email delivery issues

---

#### 2.3 Data Embedding and Vector Store Management

**Overview:**  
This block handles loading external documents, splitting text recursively, generating embeddings, and inserting them into the Supabase vector store to ensure up-to-date knowledge base for AI analysis.

**Nodes Involved:**  
- Default Data Loader  
- Recursive Character Text Splitter  
- Embeddings OpenAI1  
- Supabase Vector Store

**Node Details:**

- **Default Data Loader**  
  - Type: LangChain document loader for binary data (PDFs etc.)  
  - Role: Loads external documents (e.g., PDFs) for embedding  
  - Config: Uses custom text splitting mode “markdown,” with empty metadata  
  - Inputs: Binary document files (external upload or URL)  
  - Outputs: Text documents to text splitter  
  - Edge cases: Unsupported file types, load failures

- **Recursive Character Text Splitter**  
  - Type: LangChain text splitter  
  - Role: Splits large documents into chunks (~700 characters) recursively for better embedding  
  - Config: Markdown split code, chunk size 700 characters  
  - Inputs: Text from data loader  
  - Outputs: Text chunks to embeddings node  
  - Edge cases: Improper splits if documents not markdown, chunk size mismatch

- **Embeddings OpenAI1**  
  - Type: LangChain OpenAI embeddings node  
  - Role: Creates embeddings for document chunks  
  - Config: Same as Embeddings OpenAI node, 1536 dimensions  
  - Inputs: Text chunks from splitter  
  - Outputs: Embeddings to Supabase Vector Store  
  - Edge cases: API rate limits

- **Supabase Vector Store**  
  - Type: LangChain vector store in insert mode  
  - Role: Inserts new embeddings into Supabase vector database under “danelfin” table  
  - Config: Uses Supabase API credentials, no extra metadata stored  
  - Inputs: Embeddings from OpenAI node  
  - Outputs: Confirmation of insertion  
  - Edge cases: Data insertion failures, API credential expiry

---

### 3. Summary Table

| Node Name                 | Node Type                                  | Functional Role                         | Input Node(s)               | Output Node(s)            | Sticky Note                                                                                                                |
|---------------------------|--------------------------------------------|---------------------------------------|-----------------------------|---------------------------|----------------------------------------------------------------------------------------------------------------------------|
| When chat message received| @n8n/n8n-nodes-langchain.chatTrigger      | Entry point for user queries           | External webhook             | Danelfin request           | Ask about any stock, industries, sectors, potential trade, etc                                                              |
| Postgres Chat Memory1      | @n8n/n8n-nodes-langchain.memoryPostgresChat| Maintains conversation memory          | When chat message received   | Danelfin request           |                                                                                                                            |
| Set a reasoning model      | @n8n/n8n-nodes-langchain.lmChatOpenRouter | Configures AI model for reasoning      | Postgres Chat Memory1        | Danelfin request           |                                                                                                                            |
| Danelfin request           | @n8n/n8n-nodes-langchain.agent             | Main AI agent interacting with Danelfin API and Supabase | When chat message received, Postgres Chat Memory1, Set a reasoning model, Supabase Vector Store1, Think, ranking, sectors, industries, Reranker Cohere, Embeddings OpenAI | Markdown to HTML            | Main Agent /danelfin scoring                                                                                                |
| ranking                   | n8n-nodes-base.httpRequestTool              | Calls Danelfin /ranking endpoint       | Danelfin request             | Danelfin request           |                                                                                                                            |
| sectors                   | n8n-nodes-base.httpRequestTool              | Calls Danelfin /sectors endpoint       | Danelfin request             | Danelfin request           |                                                                                                                            |
| industries                | n8n-nodes-base.httpRequestTool              | Calls Danelfin /industries endpoint    | Danelfin request             | Danelfin request           |                                                                                                                            |
| Supabase Vector Store1     | @n8n/n8n-nodes-langchain.vectorStoreSupabase | Vector retrieval for Danelfin knowledge | Embeddings OpenAI, Reranker Cohere | Danelfin request           |                                                                                                                            |
| Embeddings OpenAI          | @n8n/n8n-nodes-langchain.embeddingsOpenAi  | Generates embeddings for vector search | Supabase Vector Store1       | Supabase Vector Store1     |                                                                                                                            |
| Reranker Cohere            | @n8n/n8n-nodes-langchain.rerankerCohere    | Reranks retrieved vectors              | Supabase Vector Store1       | Supabase Vector Store1     |                                                                                                                            |
| Think                     | @n8n/n8n-nodes-langchain.toolThink          | Assists reasoning in AI agent          | Supabase Vector Store1       | Danelfin request           |                                                                                                                            |
| Markdown to HTML           | n8n-nodes-base.markdown                      | Converts markdown report to HTML       | Danelfin request             | Send report                |                                                                                                                            |
| Send report                | n8n-nodes-base.gmail                         | Sends report via Gmail                  | Markdown to HTML             |                           |                                                                                                                            |
| Default Data Loader        | @n8n/n8n-nodes-langchain.documentDefaultDataLoader | Loads documents for embedding          | Recursive Character Text Splitter | Supabase Vector Store     | Load a pdf with the following information: [Doc1](https://docs.google.com/document/d/1wxnTMb4ZwBq1X25QXkvh49WhWz3-DYT2IdbEa8K6opw/edit?usp=sharing), [Doc2](https://docs.google.com/document/d/1U6pkrK6sIXuQ9plLHum6puTVVEv-p6ZvP0NGqKlSS5s/edit?usp=sharing) |
| Recursive Character Text Splitter | @n8n/n8n-nodes-langchain.textSplitterRecursiveCharacterTextSplitter | Splits text for embeddings             | Default Data Loader          | Embeddings OpenAI1         |                                                                                                                            |
| Embeddings OpenAI1         | @n8n/n8n-nodes-langchain.embeddingsOpenAi  | Generates embeddings for documents     | Recursive Character Text Splitter | Supabase Vector Store     |                                                                                                                            |
| Supabase Vector Store      | @n8n/n8n-nodes-langchain.vectorStoreSupabase | Inserts embeddings into vector DB      | Embeddings OpenAI1           |                           | Load data to vector database                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Chat Trigger Node**  
   - Type: LangChain Chat Trigger  
   - Configure webhook to receive user messages

2. **Add Postgres Chat Memory Node**  
   - Type: LangChain Postgres Chat Memory  
   - Configure with Postgres credentials (host, port, user, password, database)  
   - Connect input from Chat Trigger node

3. **Set a Reasoning Model Node**  
   - Type: LangChain LM Chat OpenRouter  
   - Model: x-ai/grok-4  
   - Configure OpenRouter credentials  
   - Connect input from Postgres Chat Memory node

4. **Create HTTP Request Nodes for Danelfin API**  
   - For `/ranking`, `/sectors`, `/industries` endpoints  
   - Configure each with URL: `https://apirest.danelfin.com/{endpoint}`  
   - Use HTTP Header Authentication with Danelfin API key  
   - Enable dynamic query parameters via expressions  
   - Connect these nodes to the Danelfin agent node (next step)

5. **Create Supabase Vector Store Retrieval Node**  
   - Type: LangChain VectorStoreSupabase (mode: retrieve-as-tool)  
   - Table name: `danelfin`  
   - Configure Supabase API credentials  
   - Set topK to 5, enable reranker

6. **Create Embeddings Node with OpenAI**  
   - Type: LangChain EmbeddingsOpenAI  
   - Set dimensions to 1536  
   - Configure OpenAI API credentials  
   - Connect output to Supabase Vector Store retrieval node

7. **Create Reranker Node with Cohere**  
   - Type: LangChain RerankerCohere  
   - Model: rerank-english-v3.0  
   - Configure Cohere API credentials  
   - Connect input from Supabase Vector Store retrieval node

8. **Create Think Tool Node**  
   - Type: LangChain Tool Think  
   - Default parameters  
   - Connect input from Supabase Vector Store retrieval node  
   - Connect output to Danelfin Agent node

9. **Create Danelfin Agent Node**  
   - Type: LangChain Agent  
   - Set system prompt to detailed Danelfin REST API instructions (include authentication, endpoints, error handling, processing rules)  
   - Configure to invoke HTTP request nodes (`ranking`, `sectors`, `industries`), Supabase Vector Store retrieval, embeddings, reranker, and Think node as tools  
   - Connect inputs from Chat Trigger, Postgres Chat Memory, Set a Reasoning Model nodes  
   - Output to Markdown to HTML node

10. **Create Markdown to HTML Node**  
    - Type: Markdown node  
    - Mode: markdownToHtml  
    - Input: `{{$json.output}}` from Danelfin agent node

11. **Create Gmail Node to Send Report**  
    - Type: Gmail node  
    - Configure recipient email (e.g., paul@taskmorphr.com)  
    - Subject: "Report"  
    - Message: HTML output from Markdown to HTML node  
    - Configure Gmail OAuth2 credentials  
    - Connect input from Markdown to HTML node

12. **Create Default Data Loader Node for Document Loading**  
    - Type: LangChain Document Default Data Loader  
    - Data type: binary (for PDFs)  
    - Text splitting mode: custom (markdown)  
    - Connect output to Recursive Character Text Splitter node

13. **Create Recursive Character Text Splitter Node**  
    - Type: LangChain Recursive Character Text Splitter  
    - Chunk size: 700 characters  
    - Split code: markdown  
    - Connect output to Embeddings OpenAI1 node

14. **Create Embeddings OpenAI1 Node for Document Embeddings**  
    - Same configuration as Embeddings OpenAI node  
    - Connect output to Supabase Vector Store Insert Node

15. **Create Supabase Vector Store Insert Node**  
    - Type: LangChain VectorStoreSupabase (mode: insert)  
    - Table name: `danelfin`  
    - Configure Supabase API credentials  
    - Connect input from Embeddings OpenAI1 node

16. **Connect all nodes as per described flow:**  
    - Chat Trigger → Postgres Chat Memory → Set a Reasoning Model → Danelfin Agent → Markdown to HTML → Send Report  
    - Danelfin Agent uses Supabase Vector Store (retrieval), HTTP Request nodes, Embeddings, Reranker, Think tool as sub-tools  
    - Document loading chain: Default Data Loader → Recursive Character Text Splitter → Embeddings OpenAI1 → Supabase Vector Store (insert)

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                           | Context or Link                                                                                                                                |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| Main agent node "Danelfin request" contains a detailed system prompt explaining the Danelfin REST API usage, endpoints, parameters, error codes, and processing rules.                                                                | Node: Danelfin request                                                                                                                        |
| Load PDF documents with relevant financial data to enrich vector knowledge base. Two example Google Docs provided for content reference.                                                                                            | [Doc1](https://docs.google.com/document/d/1wxnTMb4ZwBq1X25QXkvh49WhWz3-DYT2IdbEa8K6opw/edit?usp=sharing), [Doc2](https://docs.google.com/document/d/1U6pkrK6sIXuQ9plLHum6puTVVEv-p6ZvP0NGqKlSS5s/edit?usp=sharing) |
| Workflow description and setup guide included as a sticky note inside the workflow for reference by maintainers and users.                                                                                                          | Sticky Note3 node                                                                                                                             |
| For custom automation workflow requests and cost-saving ROI calculator, refer users to https://taskmorphr.com/contact and https://taskmorphr.com/cost-comparison respectively.                                                        | Sticky Note4 node                                                                                                                             |
| Full template pack of ready-made workflows coming soon at https://n8n.io/creators/diagopl/                                                                                                                                            | Sticky Note6 node                                                                                                                             |

---

**Disclaimer:**  
The text provided is derived exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.