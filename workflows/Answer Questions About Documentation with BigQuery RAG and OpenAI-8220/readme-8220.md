Answer Questions About Documentation with BigQuery RAG and OpenAI

https://n8nworkflows.xyz/workflows/answer-questions-about-documentation-with-bigquery-rag-and-openai-8220


# Answer Questions About Documentation with BigQuery RAG and OpenAI

### 1. Workflow Overview

This workflow, titled **"Answer Questions About Documentation with BigQuery RAG and OpenAI"**, is designed to implement a Retrieval-Augmented Generation (RAG) system using BigQuery as a vector database and OpenAI models to answer user questions regarding **n8n** documentation. It enables natural language queries to retrieve relevant documentation snippets stored as embeddings in BigQuery, then uses an AI agent to generate structured, Markdown-formatted answers based on those retrieved documents.

The workflow is logically divided into two main parts:

- **1.1 Input Reception and AI Agent Processing**: Handles incoming chat messages, routes them to an AI agent configured with a system prompt instructing it to query the vector database and format responses in Markdown.

- **1.2 Document Retrieval Subworkflow (BigQuery RAG OpenAI)**: Invoked as a tool by the AI agent to convert the question into an embedding using OpenAI, query BigQuery’s vector store, and return the most relevant documents to the AI agent for answer generation.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and AI Agent Processing

- **Overview:**  
  This block listens for incoming chat messages, triggers the workflow, and passes the user's question to the AI agent. The AI agent uses a system prompt to query the BigQuery vector store (via a subworkflow tool) and formats the final answer in Markdown.

- **Nodes Involved:**  
  - When chat message received  
  - AI Agent  
  - OpenAI Chat Model  
  - Simple Memory  
  - BigQuery RAG OpenAI (Tool Workflow node)  
  - Sticky Notes (for documentation)

- **Node Details:**

  - **When chat message received**  
    - *Type:* LangChain Chat Trigger  
    - *Role:* Entry point triggered by incoming chat messages.  
    - *Config:* Uses a webhook ID, no additional parameters.  
    - *Connections:* Outputs to AI Agent.  
    - *Edge Cases:* Webhook connectivity issues, malformed input messages.

  - **AI Agent**  
    - *Type:* LangChain Agent Node  
    - *Role:* Core logic node that processes user input, queries vector DB via tool, and generates Markdown-formatted answers.  
    - *Config:* System message instructs to use the connected vector store, format answers in Markdown with sections, lists, code blocks, and images when relevant.  
    - *Connections:* Inputs from chat trigger, connected to OpenAI Chat Model (language model), Simple Memory (context), and BigQuery RAG OpenAI (tool).  
    - *Edge Cases:* Failure in querying tool, language model errors, formatting issues.

  - **OpenAI Chat Model**  
    - *Type:* LangChain OpenAI Chat Model  
    - *Role:* Provides GPT-4.1-mini model for text generation.  
    - *Config:* Model set to `gpt-4.1-mini` for cost efficiency. Credentials required for OpenAI API.  
    - *Connections:* Used by AI Agent as language model.  
    - *Edge Cases:* API rate limits, authentication errors, model unavailability.

  - **Simple Memory**  
    - *Type:* LangChain Memory Buffer Window  
    - *Role:* Maintains conversation context for the AI Agent.  
    - *Config:* Default buffer window (no additional parameters).  
    - *Connections:* Connected to AI Agent for context.  
    - *Edge Cases:* Memory overflow in longer conversations, context loss.

  - **BigQuery RAG OpenAI**  
    - *Type:* LangChain Tool Workflow (Subworkflow call)  
    - *Role:* Tool invoked by AI Agent to retrieve documents relevant to the user’s question from BigQuery vector store.  
    - *Config:* Calls subworkflow with input parameter `vector_search_question`, which is the user's question in natural language.  
    - *Connections:* Used as a tool by AI Agent.  
    - *Edge Cases:* Subworkflow errors, parameter mismatches.

#### 2.2 Document Retrieval Subworkflow (BigQuery RAG OpenAI)

- **Overview:**  
  This subworkflow, triggered by the AI Agent, converts the input question into an embedding using OpenAI, queries the BigQuery vector store to find the most relevant documentation, and returns these documents for answer generation.

- **Nodes Involved:**  
  - When Executed by Another Workflow  
  - Set field - question  
  - OpenAI - Create Embedding (HTTP Request)  
  - Set Field - Embedding  
  - BigQuery - Vector Retriever - n8n docs (HTTP Request)  
  - Documents retrieved (Set node)  
  - Sticky Notes (documentation)

- **Node Details:**

  - **When Executed by Another Workflow**  
    - *Type:* Execute Workflow Trigger  
    - *Role:* Entry point triggered when AI Agent calls the tool.  
    - *Config:* Accepts `vector_search_question` input parameter.  
    - *Connections:* Outputs to Set field - question.  
    - *Edge Cases:* Missing or malformed input parameters.

  - **Set field - question**  
    - *Type:* Set Node  
    - *Role:* Assigns the input parameter `vector_search_question` to a field named `question` for downstream use.  
    - *Config:* Sets `question` = `{{$json.vector_search_question}}`.  
    - *Connections:* Outputs to OpenAI - Create Embedding.  
    - *Edge Cases:* Empty or undefined input question.

  - **OpenAI - Create Embedding**  
    - *Type:* HTTP Request  
    - *Role:* Calls OpenAI API to generate an embedding vector for the input question.  
    - *Config:* POST request to `https://api.openai.com/v1/embeddings` with body containing the question and model `text-embedding-3-large`. Requires OpenAI API credentials.  
    - *Connections:* Outputs embedding data to Set Field - Embedding.  
    - *Edge Cases:* API errors, authentication failure, rate limits, invalid input text.

  - **Set Field - Embedding**  
    - *Type:* Set Node  
    - *Role:* Extracts the embedding array from the OpenAI response and sets it in the `embedding` field.  
    - *Config:* Sets `embedding` = `{{$json.data[0].embedding}}`.  
    - *Connections:* Outputs to BigQuery - Vector Retriever - n8n docs.  
    - *Edge Cases:* Missing or malformed embedding data.

  - **BigQuery - Vector Retriever - n8n docs**  
    - *Type:* HTTP Request  
    - *Role:* Sends a SQL query to BigQuery to perform a vector similarity search using the embedding to retrieve top 10 relevant documents from the `n8n-docs-rag.n8n_docs.n8n_docs_embeddings` table.  
    - *Config:* POST request to BigQuery queries API endpoint (replace `<YOUR-PROJECT-ID>` with actual project ID). Query uses `VECTOR_SEARCH` function with cosine similarity and brute-force enabled. Requires Google BigQuery OAuth2 credentials.  
    - *Connections:* Outputs query results to Documents retrieved.  
    - *Edge Cases:* Authentication errors, quota exceeded, invalid SQL syntax, missing or incorrect project ID, network timeouts.

  - **Documents retrieved**  
    - *Type:* Set Node  
    - *Role:* Converts the BigQuery response rows to JSON string and stores in `documents` field to pass back to the AI Agent.  
    - *Config:* Sets `documents` = `{{$json.rows.toJsonString()}}`.  
    - *Connections:* Output of subworkflow back to AI Agent tool.  
    - *Edge Cases:* Empty query results, JSON conversion errors.

---

### 3. Summary Table

| Node Name                    | Node Type                          | Functional Role                                     | Input Node(s)                | Output Node(s)                   | Sticky Note                                                                                                  |
|------------------------------|----------------------------------|----------------------------------------------------|------------------------------|---------------------------------|--------------------------------------------------------------------------------------------------------------|
| When chat message received    | LangChain Chat Trigger            | Entry point for incoming chat messages             | —                            | AI Agent                        | When a chat message is received, it triggers the workflow and forwards to AI Agent.                           |
| AI Agent                     | LangChain Agent                   | Processes user input, queries vector DB, generates answer | When chat message received     | OpenAI Chat Model, Simple Memory, BigQuery RAG OpenAI | AI Agent uses system prompt to query BigQuery RAG OpenAI tool and formats answers in Markdown.                 |
| OpenAI Chat Model            | LangChain LM Chat OpenAI          | Provides GPT-4.1-mini model for text generation    | AI Agent                     | AI Agent (language model)       | Default model is gpt-4.1-mini, chosen for cost efficiency.                                                   |
| Simple Memory               | LangChain Memory Buffer Window    | Maintains conversation context                      | AI Agent                     | AI Agent (memory)               | Provides conversation context; can be replaced by Postgres Chat Memory for production.                        |
| BigQuery RAG OpenAI         | LangChain Tool Workflow           | Subworkflow tool to retrieve documents from BigQuery | AI Agent                     | AI Agent (tool)                 | Triggers subworkflow to query BigQuery vector store using `vector_search_question`.                           |
| When Executed by Another Workflow | Execute Workflow Trigger         | Entry point for subworkflow invoked by AI Agent    | —                            | Set field - question            | Subworkflow triggered by AI Agent passing `vector_search_question`.                                           |
| Set field - question        | Set Node                         | Assigns `vector_search_question` to `question` field | When Executed by Another Workflow | OpenAI - Create Embedding     | Sets the question field, enabling embedding generation.                                                      |
| OpenAI - Create Embedding   | HTTP Request                     | Calls OpenAI API to generate embedding vector      | Set field - question          | Set Field - Embedding           | Generates embedding using model `text-embedding-3-large`.                                                    |
| Set Field - Embedding       | Set Node                         | Extracts and sets embedding vector for BigQuery query | OpenAI - Create Embedding     | BigQuery - Vector Retriever - n8n docs | Sets embedding field from OpenAI response.                                                                   |
| BigQuery - Vector Retriever - n8n docs | HTTP Request                     | Queries BigQuery vector table to retrieve relevant docs | Set Field - Embedding         | Documents retrieved             | Queries BigQuery with cosine similarity; replace `<YOUR-PROJECT-ID>` with actual ID.                          |
| Documents retrieved         | Set Node                         | Converts BigQuery results to JSON string for AI Agent | BigQuery - Vector Retriever - n8n docs | BigQuery RAG OpenAI (subworkflow output) | Stores retrieved documents for final answer generation.                                                      |
| Sticky Notes (multiple)      | Sticky Note                      | Documentation and explanations                      | —                            | —                               | Various notes provide context, instructions, and links for nodes and overall workflow.                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "When chat message received" node**  
   - Type: `@n8n/n8n-nodes-langchain.chatTrigger`  
   - Configure with a unique webhook ID to receive chat messages.

2. **Create "AI Agent" node**  
   - Type: `@n8n/n8n-nodes-langchain.agent`  
   - Set system message with instructions to:  
     - Query connected vector store tool for documentation retrieval  
     - Format answers in Markdown with sections, lists, images, and code blocks  
     - Provide accurate, context-aware answers  
   - Connect inputs from "When chat message received".  
   - Connect outputs to:  
     - "OpenAI Chat Model" as language model  
     - "Simple Memory" as memory context  
     - "BigQuery RAG OpenAI" as the tool.

3. **Create "OpenAI Chat Model" node**  
   - Type: `@n8n/n8n-nodes-langchain.lmChatOpenAi`  
   - Select model: `gpt-4.1-mini` (cost-efficient GPT-4 variant).  
   - Set OpenAI API credentials (OAuth or API key).  
   - Connect as language model input to AI Agent.

4. **Create "Simple Memory" node**  
   - Type: `@n8n/n8n-nodes-langchain.memoryBufferWindow`  
   - No special parameters by default.  
   - Connect to AI Agent to provide conversation context.

5. **Create "BigQuery RAG OpenAI" node**  
   - Type: `@n8n/n8n-nodes-langchain.toolWorkflow`  
   - Configure to call subworkflow (create next) with input parameter `vector_search_question`.  
   - Connect as tool input to AI Agent.

6. **Create Subworkflow for BigQuery RAG OpenAI Tool**

   a. **Create "When Executed by Another Workflow" node**  
      - Type: `n8n-nodes-base.executeWorkflowTrigger`  
      - Add workflow input parameter: `vector_search_question` (string).

   b. **Create "Set field - question" node**  
      - Type: `Set` node  
      - Set field `question` = `{{$json.vector_search_question}}`.  
      - Connect output of workflow trigger to this node.

   c. **Create "OpenAI - Create Embedding" node**  
      - Type: `HTTP Request` node  
      - URL: `https://api.openai.com/v1/embeddings`  
      - Method: POST  
      - Body parameters:  
        - `input` = `{{$json.question}}`  
        - `model` = `text-embedding-3-large`  
      - Authentication: OpenAI API credentials.  
      - Connect from "Set field - question".

   d. **Create "Set Field - Embedding" node**  
      - Type: `Set` node  
      - Set field `embedding` = `{{$json.data[0].embedding}}`.  
      - Connect from "OpenAI - Create Embedding".

   e. **Create "BigQuery - Vector Retriever - n8n docs" node**  
      - Type: `HTTP Request` node  
      - URL: `https://bigquery.googleapis.com/bigquery/v2/projects/<YOUR-PROJECT-ID>/queries` (replace `<YOUR-PROJECT-ID>`)  
      - Method: POST  
      - Body parameters:  
        - `query`: SQL vector search query using embedding from previous node (see SQL example below)  
        - `useLegacySql`: false  
      - Authentication: Google BigQuery OAuth2 credentials.  
      - Connect from "Set Field - Embedding".

   f. **Create "Documents retrieved" node**  
      - Type: `Set` node  
      - Set field `documents` = `{{$json.rows.toJsonString()}}`.  
      - Connect from "BigQuery - Vector Retriever - n8n docs".

7. **Connect Subworkflow output** back to the "BigQuery RAG OpenAI" tool node in the main workflow.

---

**SQL Query Example to use in BigQuery Node:**

```sql
WITH query AS (
  SELECT ARRAY(
    SELECT CAST(x AS FLOAT64)
    FROM UNNEST([{{ $json.embedding.join(',') }}]) AS x
  ) AS embedding
)
SELECT
  t.base.text,
  t.base.metadata,
  t.distance AS cosine_distance
FROM VECTOR_SEARCH(
  TABLE `n8n-docs-rag.n8n_docs.n8n_docs_embeddings`,
  'embedding',
  TABLE query,
  top_k => 10,
  distance_type => 'COSINE',
  options => '{"use_brute_force": true}'
) AS t
ORDER BY t.distance;
```

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Context or Link                                                                                             |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| This workflow demonstrates how to leverage BigQuery’s vector capabilities for Retrieval-Augmented Generation combined with OpenAI embeddings and LLMs. It is ideal when organizations already use BigQuery and want to avoid introducing an additional vector database.                                                                                                                                                                                                                                                                                                                                                              | Workflow purpose and rationale.                                                                             |
| The public BigQuery table used stores n8n documentation embeddings: `n8n-docs-rag.n8n_docs.n8n_docs_embeddings`. Replace with your own table for other use cases.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | BigQuery table for embeddings.                                                                               |
| BigQuery uses a *requester pays* model; testing with a small table (~40 MB) and few queries should incur minimal or no cost due to monthly free quota (1 TB).                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | BigQuery pricing and usage note: https://cloud.google.com/bigquery/pricing?hl=en                             |
| For conversation memory, this workflow uses Simple Memory, which buffers recent messages. For production, consider using [Postgres Chat Memory](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.memorypostgreschat/) for durability and scale.                                                                                                                                                                                                                                                                                                                                                     | Memory configuration note with link.                                                                        |
| The AI Agent’s system prompt instructs strict use of retrieved documentation for answers, Markdown formatting, inclusion of images and code snippets where relevant, and clear indication when information is insufficient.                                                                                                                                                                                                                                                                                                                                                                                                                 | AI Agent system message instructions.                                                                       |
| The OpenAI Chat Model uses the GPT-4.1-mini variant for a balance of cost efficiency and performance.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Model choice note.                                                                                           |
| SQL query in BigQuery explicitly uses `options => '{"use_brute_force": true}'` to enforce brute-force vector search for small datasets, which is the default behavior when no index is available. The field `distance` represents cosine similarity; lower values indicate higher relevance.                                                                                                                                                                                                                                                                                                                                              | Technical SQL query note and explanation.                                                                    |

---

**Disclaimer:**  
The content described is from an automated workflow designed in n8n, fully compliant with content policies, and processes only legal and public data.