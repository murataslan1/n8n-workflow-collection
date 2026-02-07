Adaptive RAG with Google Gemini & Qdrant: Context-Aware Query Answering

https://n8nworkflows.xyz/workflows/adaptive-rag-with-google-gemini---qdrant--context-aware-query-answering-4043


# Adaptive RAG with Google Gemini & Qdrant: Context-Aware Query Answering

---

### 1. Workflow Overview

This workflow implements an Adaptive Retrieval-Augmented Generation (RAG) system integrating Google Gemini language models and the Qdrant vector store. It aims to classify incoming user queries into four distinct types — Factual, Analytical, Opinion, or Contextual — and apply tailored retrieval and response strategies accordingly. The workflow then fetches the most relevant documents from a vector database and generates a context-aware answer, providing more precise, comprehensive, or nuanced replies based on query classification.

The workflow’s logical blocks include:

- **1.1 Input Reception & Standardization:** Receives user queries with associated metadata and standardizes inputs.
- **1.2 Query Classification:** Classifies the user query into one of four categories using Google Gemini.
- **1.3 Adaptive Strategy Application:** Based on classification, applies a corresponding query reformulation or decomposition strategy using specialized Google Gemini agents.
- **1.4 Prompt Preparation:** Sets up system prompts and outputs tailored to each query type for downstream generation.
- **1.5 Document Retrieval:** Uses the restructured query to retrieve relevant documents from a Qdrant vector store.
- **1.6 Context Concatenation:** Aggregates retrieved document contents into a single context string.
- **1.7 Answer Generation:** Generates the final answer using Google Gemini, leveraging the concatenated context and chat memory.
- **1.8 Response Delivery:** Sends the generated answer back to the user via webhook.

Additionally, the workflow incorporates chat memory buffers for each strategy path to maintain conversational context, and includes comprehensive sticky notes for user guidance and strategy descriptions.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Standardization

- **Overview:**  
Receives external triggers either from chatbot interface or other workflows, then standardizes incoming data fields for consistent downstream processing.

- **Nodes Involved:**  
  - When Executed by Another Workflow  
  - Chat  
  - Combined Fields

- **Node Details:**

  - **When Executed by Another Workflow**  
    - Type: Execute Workflow Trigger  
    - Role: Entry point when called from other workflows, expecting inputs `user_query`, `chat_memory_key`, `vector_store_id`.  
    - Inputs: External workflow trigger  
    - Outputs: Passes inputs to Combined Fields node  
    - Failure Modes: Missing inputs or malformed data could cause downstream failures.

  - **Chat**  
    - Type: LangChain Chat Trigger  
    - Role: Entry point for chat interface triggering  
    - Inputs: Incoming chat messages  
    - Outputs: Passes chat data to Combined Fields  
    - Failure Modes: Webhook/connection issues; malformed chat input.

  - **Combined Fields**  
    - Type: Set  
    - Role: Normalizes inputs by creating uniform variables:  
      - `user_query` (from either `user_query` or `chatInput`)  
      - `chat_memory_key` (from input or chat session ID)  
      - `vector_store_id` (from input or placeholder)  
    - Inputs: From Chat or When Executed by Another Workflow  
    - Outputs: Standardized JSON for next nodes  
    - Failure Modes: Missing or empty inputs; fallback default vector_store_id may require manual update.

#### 2.2 Query Classification

- **Overview:**  
Classifies the user query into one of four categories (Factual, Analytical, Opinion, Contextual) using a Google Gemini classification agent, enabling adaptive downstream handling.

- **Nodes Involved:**  
  - Query Classification  
  - Gemini Classification  
  - Switch  
  - Sticky Note6 (for user guidance)

- **Node Details:**

  - **Query Classification**  
    - Type: LangChain Agent (Google Gemini)  
    - Role: Classifies `user_query` text into one category only  
    - Configuration:  
      - System Message instructs strict classification into one of four categories without explanation  
      - Input expression: `"Classify this query: {{ $('Combined Fields').item.json.user_query }}"`  
    - Input: Combined Fields (user_query)  
    - Output: JSON with `output` containing the category name  
    - Version: 1.8  
    - Potential Failures: Model API errors, ambiguous queries leading to misclassification or no output.

  - **Gemini Classification**  
    - Type: LangChain LM Chat Google Gemini  
    - Role: Underlying LM for classification node  
    - Model: `models/gemini-2.0-flash-lite`  
    - Credentials: Google Palm API  
    - Input: Receives classification prompt  
    - Output: Classification result forwarded to Query Classification node  

  - **Switch**  
    - Type: Switch  
    - Role: Routes workflow based on classification output (`Factual`, `Analytical`, `Opinion`, `Contextual`)  
    - Conditions use exact, case-sensitive comparison on trimmed output  
    - Inputs: Output from `Query Classification`  
    - Outputs: One output per classification path  
    - Failure Modes: Classification output mismatch, fallback output disabled (index 0 chosen if no match).

#### 2.3 Adaptive Strategy Application

- **Overview:**  
Applies query-specific adaptation strategies to enhance retrieval effectiveness: precision for factual, decomposition for analytical, viewpoint listing for opinion, and context inference for contextual queries.

- **Nodes Involved:**  
  - Factual Strategy - Focus on Precision  
  - Analytical Strategy - Comprehensive Coverage  
  - Opinion Strategy - Diverse Perspectives  
  - Contextual Strategy - User Context Integration  
  - Gemini Factual, Gemini Analytical, Gemini Opinion, Gemini Contextual  
  - Chat Buffer Memory nodes (one per strategy)  
  - Sticky Notes 1 to 4 (strategy descriptions)

- **Node Details:**

  - **Factual Strategy - Focus on Precision**  
    - Type: LangChain Agent (Google Gemini)  
    - Purpose: Reformulates factual queries to be more precise, focusing on key entities and relationships  
    - Input: Original `user_query` from Combined Fields  
    - System Message: Asks to enhance query precision without explanation  
    - Output: Enhanced factual query string  
    - Connected LM: Gemini Factual (model `gemini-2.0-flash`)  
    - Chat Buffer Memory Factual: Maintains conversational context with 10 recent messages keyed by `chat_memory_key`  
    - Failure Modes: LM timeouts, vague reformulations, loss of intent.

  - **Analytical Strategy - Comprehensive Coverage**  
    - Type: LangChain Agent (Google Gemini)  
    - Purpose: Breaks down analytical queries into 3 sub-questions covering diverse aspects  
    - Input: Original `user_query`  
    - System Message: Generate exactly 3 sub-questions, one per line  
    - Output: List of sub-questions for retrieval  
    - Connected LM: Gemini Analytical  
    - Chat Buffer Memory Analytical: Same memory config as factual  
    - Failure Modes: LM misinterpretation, incomplete coverage.

  - **Opinion Strategy - Diverse Perspectives**  
    - Type: LangChain Agent (Google Gemini)  
    - Purpose: Identifies 3 different viewpoints on subjective queries  
    - Input: Original `user_query`  
    - System Message: Return exactly 3 diverse perspectives  
    - Output: List of viewpoints  
    - Connected LM: Gemini Opinion  
    - Chat Buffer Memory Opinion: Tracks conversation context  
    - Failure Modes: Bias in viewpoints, limited perspective coverage.

  - **Contextual Strategy - User Context Integration**  
    - Type: LangChain Agent (Google Gemini)  
    - Purpose: Infers implied context not explicitly stated in the query  
    - Input: Original `user_query`  
    - System Message: Return brief description of implied context  
    - Output: Context description string  
    - Connected LM: Gemini Contextual  
    - Chat Buffer Memory Contextual: Context-aware memory buffer  
    - Failure Modes: Missing critical context, overgeneralization.

#### 2.4 Prompt Preparation

- **Overview:**  
Prepares system prompts and output variables customized to each query type to guide the final answer generation step.

- **Nodes Involved:**  
  - Factual Prompt and Output  
  - Analytical Prompt and Output  
  - Opinion Prompt and Output  
  - Contextual Prompt and Output  
  - Set Prompt and Output  
  - Sticky Notes 0 to 3 (strategy details and instructions)

- **Node Details:**

  - **Factual Prompt and Output**  
    - Type: Set  
    - Role: Sets variables `output` (enhanced query) and `prompt` (system instructions) for factual queries  
    - Prompt instructs focus on accuracy and precision, and acknowledgement of info limitations  
    - Inputs: Output from Factual Strategy node  
    - Outputs: Variables for downstream use

  - **Analytical Prompt and Output**  
    - Similar structure for analytical queries  
    - Prompt instructs comprehensive analysis covering multiple aspects

  - **Opinion Prompt and Output**  
    - Sets prompt directing fair representation of diverse opinions  
    - Acknowledges limited viewpoints if applicable

  - **Contextual Prompt and Output**  
    - Prompt instructs to consider both query and inferred context  
    - Encourages connection between context and documents

  - **Set Prompt and Output**  
    - Receives the prompt and output from the above nodes (one of four paths)  
    - Assigns standardized variables `prompt` and `output` for document retrieval and answer generation  
    - Connects forward to document retrieval node

#### 2.5 Document Retrieval

- **Overview:**  
Retrieves the top 10 relevant documents from Qdrant vector store using the adaptive query generated in previous steps.

- **Nodes Involved:**  
  - Embeddings  
  - Retrieve Documents from Vector Store  
  - Sticky Note4 (adaptive retrieval instruction)

- **Node Details:**

  - **Embeddings**  
    - Type: LangChain Embeddings using Google Gemini  
    - Purpose: Converts text query to embedding vector (model: `text-embedding-004`)  
    - Inputs: Output query from Set Prompt and Output  
    - Credentials: Google Palm API  
    - Outputs: Embedding vector for retrieval  
    - Failure Modes: API errors, embedding quality issues.

  - **Retrieve Documents from Vector Store**  
    - Type: LangChain Vector Store Qdrant  
    - Role: Uses embeddings to query Qdrant collection for top 10 matches  
    - Parameters:  
      - `vector_store_id` from Combined Fields node  
      - `topK`: 10  
      - Prompt includes both system prompt and adaptive output query for better contextual search  
    - Credentials: Qdrant API  
    - Outputs: Retrieved document chunks with metadata  
    - Failure Modes: Connection issues, incorrect collection ID, empty results.

#### 2.6 Context Concatenation

- **Overview:**  
Aggregates retrieved document chunks’ textual contents into a single concatenated string separated by delimiters, forming a coherent context for answer generation.

- **Nodes Involved:**  
  - Concatenate Context

- **Node Details:**

  - **Concatenate Context**  
    - Type: Summarize (aggregation)  
    - Role: Concatenates `document.pageContent` fields from retrieved documents, separated by "\n\n---\n\n"  
    - Inputs: Retrieved documents from Qdrant node  
    - Outputs: Single string field `concatenated_document_pageContent`  
    - Failure Modes: Empty retrieval input, overly large concatenation possibly exceeding model token limit.

#### 2.7 Answer Generation

- **Overview:**  
Generates the final user-facing answer using Google Gemini language model, integrating user query, concatenated context, chat history, and adaptive system prompt.

- **Nodes Involved:**  
  - Answer  
  - Gemini Answer  
  - Chat Buffer Memory  
  - Sticky Note5 (reply integration guidance)

- **Node Details:**

  - **Answer**  
    - Type: LangChain Agent (Google Gemini)  
    - Role: Produces final response using:  
      - User query  
      - System prompt from Set Prompt and Output node  
      - Concatenated context (delimited by <ctx></ctx>)  
      - Chat history from buffer memory  
    - Version: 1.8  
    - Failure Modes: LM API timeouts, context length limits, incomplete or inaccurate answers.

  - **Gemini Answer**  
    - LM node for Answer agent  
    - Model: `models/gemini-2.0-flash`  
    - Credentials: Google Palm API

  - **Chat Buffer Memory**  
    - Shared memory buffer with 10-message window keyed by `chat_memory_key`  
    - Inputs conversation history to answer generation for context continuity

#### 2.8 Response Delivery

- **Overview:**  
Returns the generated answer to the user via the webhook response.

- **Nodes Involved:**  
  - Respond to Webhook

- **Node Details:**

  - **Respond to Webhook**  
    - Type: Respond to Webhook  
    - Role: Sends the final answer JSON to the calling client or chatbot interface  
    - Inputs: Answer node output  
    - Failure Modes: Network issues, timeout, malformed response payload

---

### 3. Summary Table

| Node Name                          | Node Type                              | Functional Role                                | Input Node(s)                  | Output Node(s)                          | Sticky Note                                                                                       |
|-----------------------------------|--------------------------------------|-----------------------------------------------|-------------------------------|---------------------------------------|-------------------------------------------------------------------------------------------------|
| When Executed by Another Workflow | Execute Workflow Trigger              | External workflow entry point                  | External trigger              | Combined Fields                       |                                                                                                 |
| Chat                              | LangChain Chat Trigger                | Chat interface entry point                      | External chat webhook         | Combined Fields                       |                                                                                                 |
| Combined Fields                   | Set                                  | Normalizes and standardizes input variables    | Chat, When Executed by Another Workflow | Query Classification                 |                                                                                                 |
| Query Classification              | LangChain Agent (Google Gemini)      | Classifies user query into one of four types   | Combined Fields               | Switch                               | ## User query classification\nClassify the query into one of four categories: Factual, Analytical, Opinion, or Contextual. |
| Gemini Classification            | LangChain LM Chat Google Gemini      | Language model for query classification         | Query Classification (behind) | Query Classification                 |                                                                                                 |
| Switch                           | Switch                               | Routes workflow based on query classification  | Query Classification          | Factual Strategy, Analytical Strategy, Opinion Strategy, Contextual Strategy |                                                                                                 |
| Factual Strategy - Focus on Precision | LangChain Agent (Google Gemini)   | Reformulates factual queries for precision     | Switch (Factual output)       | Factual Prompt and Output            | ## Factual Strategy\nRetrieve precise facts and figures.                                        |
| Gemini Factual                   | LangChain LM Chat Google Gemini      | Language model for factual strategy            | Factual Strategy              | Factual Strategy                    |                                                                                                 |
| Chat Buffer Memory Factual       | Memory Buffer Window                  | Maintains chat memory for factual queries      | Factual Strategy              | Factual Strategy                    |                                                                                                 |
| Analytical Strategy - Comprehensive Coverage | LangChain Agent (Google Gemini) | Breaks down analytical queries into sub-questions | Switch (Analytical output)    | Analytical Prompt and Output         | ## Analytical Strategy\nProvide comprehensive coverage of topics and explore different aspects.  |
| Gemini Analytical               | LangChain LM Chat Google Gemini      | Language model for analytical strategy          | Analytical Strategy           | Analytical Strategy                 |                                                                                                 |
| Chat Buffer Memory Analytical    | Memory Buffer Window                  | Maintains chat memory for analytical queries   | Analytical Strategy           | Analytical Strategy                 |                                                                                                 |
| Opinion Strategy - Diverse Perspectives | LangChain Agent (Google Gemini) | Identifies diverse viewpoints for opinion queries | Switch (Opinion output)       | Opinion Prompt and Output            | ## Opinion Strategy\nGather diverse viewpoints on a subjective issue.                          |
| Gemini Opinion                 | LangChain LM Chat Google Gemini      | Language model for opinion strategy             | Opinion Strategy              | Opinion Strategy                   |                                                                                                 |
| Chat Buffer Memory Opinion       | Memory Buffer Window                  | Maintains chat memory for opinion queries      | Opinion Strategy              | Opinion Strategy                   |                                                                                                 |
| Contextual Strategy - User Context Integration | LangChain Agent (Google Gemini) | Infers implied context for contextual queries  | Switch (Contextual output)    | Contextual Prompt and Output         | ## Contextual Strategy\nIncorporate user-specific context to fine-tune the retrieval.           |
| Gemini Contextual             | LangChain LM Chat Google Gemini      | Language model for contextual strategy          | Contextual Strategy           | Contextual Strategy                |                                                                                                 |
| Chat Buffer Memory Contextual    | Memory Buffer Window                  | Maintains chat memory for contextual queries   | Contextual Strategy           | Contextual Strategy                |                                                                                                 |
| Factual Prompt and Output        | Set                                  | Prepares prompt and output for factual queries | Factual Strategy              | Set Prompt and Output               |                                                                                                 |
| Analytical Prompt and Output     | Set                                  | Prepares prompt and output for analytical queries | Analytical Strategy           | Set Prompt and Output               |                                                                                                 |
| Opinion Prompt and Output        | Set                                  | Prepares prompt and output for opinion queries | Opinion Strategy              | Set Prompt and Output               |                                                                                                 |
| Contextual Prompt and Output     | Set                                  | Prepares prompt and output for contextual queries | Contextual Strategy           | Set Prompt and Output               |                                                                                                 |
| Set Prompt and Output            | Set                                  | Consolidates prompt and output for retrieval   | Factual/Analytical/Opinion/Contextual Prompt and Output | Retrieve Documents from Vector Store | ## Perform adaptive retrieval\nFind document considering both query and context.               |
| Embeddings                      | LangChain Embeddings (Google Gemini) | Converts text to embedding vector for retrieval | Set Prompt and Output         | Retrieve Documents from Vector Store |                                                                                                 |
| Retrieve Documents from Vector Store | LangChain Vector Store Qdrant     | Retrieves top documents from Qdrant vector store | Embeddings                   | Concatenate Context                |                                                                                                 |
| Concatenate Context             | Summarize (concatenate)              | Concatenates retrieved document contents       | Retrieve Documents from Vector Store | Answer                             |                                                                                                 |
| Answer                         | LangChain Agent (Google Gemini)      | Generates final answer using query, context, and chat memory | Concatenate Context, Set Prompt and Output, Chat Buffer Memory | Respond to Webhook                  | ## Reply to the user integrating retrieval context                                            |
| Gemini Answer                  | LangChain LM Chat Google Gemini      | LM for answer generation                         | Answer                       | Answer                             |                                                                                                 |
| Chat Buffer Memory             | Memory Buffer Window                  | Maintains chat memory for final answer generation | Answer                       | Answer                             |                                                                                                 |
| Respond to Webhook             | Respond to Webhook                   | Sends generated answer back to the user         | Answer                       | None                              |                                                                                                 |
| Sticky Note (multiple)         | Sticky Note                         | Provides contextual explanations and instructions | Various                      | N/A                               | See notes for each sticky covering strategy descriptions and usage instructions                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**  
   - Add a **LangChain Chat Trigger** node named `Chat` for chatbot interface input.  
   - Add an **Execute Workflow Trigger** node named `When Executed by Another Workflow` expecting inputs: `user_query`, `chat_memory_key`, `vector_store_id`.

2. **Standardize Inputs:**  
   - Add a **Set** node `Combined Fields` connected from both triggers.  
   - Configure fields:  
     - `user_query`: `{{$json.user_query || $json.chatInput}}`  
     - `chat_memory_key`: `{{$json.chat_memory_key || $('Chat').item.json.sessionId}}`  
     - `vector_store_id`: `{{$json.vector_store_id || "<ID HERE>"}}` (replace `<ID HERE>` with actual Qdrant collection ID).

3. **Query Classification:**  
   - Add a **LangChain Agent** node `Query Classification` (version 1.8).  
   - Use Google Gemini model `models/gemini-2.0-flash-lite` via a **LangChain LM Chat Google Gemini** node named `Gemini Classification` with proper API credentials.  
   - Set node prompt:  
     ```
     You are an expert at classifying questions. 
     Classify the given query into exactly one of these categories:
     - Factual
     - Analytical
     - Opinion
     - Contextual
     
     Return ONLY the category name, without any explanation or additional text.
     ```  
   - Input expression: `Classify this query: {{ $('Combined Fields').item.json.user_query }}`  
   - Connect `Combined Fields` → `Gemini Classification` → `Query Classification`.

4. **Switch Node for Routing:**  
   - Add a **Switch** node `Switch`.  
   - Configure four outputs with conditions checking if the trimmed `output` from `Query Classification` equals `"Factual"`, `"Analytical"`, `"Opinion"`, or `"Contextual"`.  
   - Connect `Query Classification` → `Switch`.

5. **Adaptive Strategy Nodes:**  
   - For each classification output, create a corresponding **LangChain Agent** to adapt the query:

     **Factual:**  
     - Node: `Factual Strategy - Focus on Precision` (v1.7)  
     - Model: `models/gemini-2.0-flash` (Google Gemini)  
     - Prompt:  
       ```
       You are an expert at enhancing search queries.

       Your task is to reformulate the given factual query to make it more precise and specific for information retrieval. Focus on key entities and their relationships.

       Provide ONLY the enhanced query without any explanation.
       ```
     - Input: `Enhance this factual query: {{ $('Combined Fields').item.json.user_query }}`  
     - Add **Memory Buffer Window** node `Chat Buffer Memory Factual` with session key from `chat_memory_key`, window length 10, connected to the strategy node.

     **Analytical:**  
     - Node: `Analytical Strategy - Comprehensive Coverage` (v1.7)  
     - Same model and credentials as above  
     - Prompt:  
       ```
       You are an expert at breaking down complex questions.

       Generate sub-questions that explore different aspects of the main analytical query.
       These sub-questions should cover the breadth of the topic and help retrieve comprehensive information.

       Return a list of exactly 3 sub-questions, one per line.
       ```
     - Input: `Generate sub-questions for this analytical query: {{ $('Combined Fields').item.json.user_query }}`  
     - Memory node: `Chat Buffer Memory Analytical`.

     **Opinion:**  
     - Node: `Opinion Strategy - Diverse Perspectives` (v1.7)  
     - Prompt:  
       ```
       You are an expert at identifying different perspectives on a topic.

       For the given query about opinions or viewpoints, identify different perspectives that people might have on this topic.

       Return a list of exactly 3 different viewpoint angles, one per line.
       ```
     - Memory node: `Chat Buffer Memory Opinion`.

     **Contextual:**  
     - Node: `Contextual Strategy - User Context Integration` (v1.7)  
     - Prompt:  
       ```
       You are an expert at understanding implied context in questions.

       For the given query, infer what contextual information might be relevant or implied but not explicitly stated. Focus on what background would help answering this query.

       Return a brief description of the implied context.
       ```
     - Memory node: `Chat Buffer Memory Contextual`.

6. **Prompt and Output Preparation:**  
   - For each strategy node, add a **Set** node to prepare system prompt and output variables:

     - **Factual Prompt and Output:**  
       - Assign `output` = strategy node output  
       - Assign `prompt` =  
         ```
         You are a helpful assistant providing factual information. Answer the question based on the provided context. Focus on accuracy and precision. If the context doesn't contain the information needed, acknowledge the limitations.
         ```

     - **Analytical Prompt and Output:** Similar with analytical prompt text.

     - **Opinion Prompt and Output:** Similar with opinion prompt text.

     - **Contextual Prompt and Output:** Similar with contextual prompt text.

   - Connect each strategy node → respective prompt/output node.

7. **Unified Prompt and Output Set:**  
   - Add a **Set** node `Set Prompt and Output` that consolidates `output` and `prompt` from the four paths.  
   - Connect each prompt/output node → `Set Prompt and Output`.

8. **Embeddings and Document Retrieval:**  
   - Add **LangChain Embeddings (Google Gemini)** node `Embeddings` using `models/text-embedding-004`.  
   - Connect `Set Prompt and Output` → `Embeddings`.  
   - Add **LangChain Vector Store Qdrant** node `Retrieve Documents from Vector Store` configured with:  
     - Mode: `load`  
     - TopK: 10  
     - Prompt includes both `prompt` and `output` fields from previous set node.  
     - Qdrant collection ID from `vector_store_id` field.  
     - Credentials: Qdrant API.  
   - Connect `Embeddings` → `Retrieve Documents from Vector Store`.

9. **Concatenate Context:**  
   - Add **Summarize** node `Concatenate Context` to concatenate `document.pageContent` fields from retrieved documents.  
   - Use custom separator: `\n\n---\n\n`.  
   - Connect `Retrieve Documents from Vector Store` → `Concatenate Context`.

10. **Answer Generation:**  
    - Add **LangChain Agent** node `Answer` (v1.8) with prompt:  
      ```
      {{$json.prompt}}

      Use the following context (delimited by <ctx></ctx>) and the chat history to answer the user query.
      <ctx>
      {{$json.concatenated_document_pageContent}}
      </ctx>
      User query: {{ $('Combined Fields').item.json.user_query }}
      ```  
    - Connect `Concatenate Context` and `Set Prompt and Output` outputs to this node (ensure proper data merging).  
    - Add **LangChain LM Chat Google Gemini** node `Gemini Answer` with model `models/gemini-2.0-flash` and Google Palm API credentials connected to `Answer`.  
    - Add **Memory Buffer Window** node `Chat Buffer Memory` with `chat_memory_key` and window 10 connected to `Answer`.

11. **Respond to Webhook:**  
    - Add a **Respond to Webhook** node connected to `Answer` to send final output back to the user.

12. **Add Sticky Notes:**  
    - Add sticky notes to explain each strategy (Factual, Analytical, Opinion, Contextual) near respective nodes.  
    - Add instructional notes for usage, such as updating `vector_store_id` for chat mode, strategy descriptions, and workflow overview.

13. **Credentials Setup:**  
    - Configure Google Palm API credentials for all Google Gemini nodes.  
    - Configure Qdrant API credentials for vector store retrieval.

14. **Testing and Validation:**  
    - Test by sending queries of different types through chat interface or workflow trigger.  
    - Verify that classification, strategy adaptation, retrieval, and answer generation behave as expected.  
    - Monitor memory buffers for session consistency.

---

### 5. General Notes & Resources

| Note Content                                                                                                      | Context or Link                                                                                                          |
|------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| Update the `vector_store_id` variable to your Qdrant collection ID before running in chat mode.                   | Sticky Note8: Ensures document retrieval targets correct vector store.                                                  |
| Workflow applies Adaptive RAG principles: classifies query, applies tailored retrieval and generation strategies. | General design principle; see Sticky Note7 for detailed Turkish description of workflow purpose and flow.               |
| Strategy-specific prompts are designed for precise, comprehensive, diverse, or context-aware answer generation.  | Sticky Notes 0-3 provide user guidance on each strategy’s function and expected behavior.                                |
| Google Gemini models used: `gemini-2.0-flash-lite` for classification; `gemini-2.0-flash` for generation tasks.   | Requires valid Google Palm API credentials configured in n8n.                                                           |
| Qdrant vector store integration enables semantic search over document embeddings.                                 | Requires valid Qdrant API credentials and configured collection ID.                                                      |
| Chat Buffer Memory nodes maintain conversational context with a sliding window of 10 messages per session key.    | Ensures context continuity in multi-turn conversations.                                                                  |
| For advanced customization, adjust system messages in LangChain agents to fine-tune classification and retrieval.| Sticky notes inside workflow contain detailed prompt texts and instructions.                                            |
| Refer to official n8n and Google Gemini documentation for detailed node and credential setup instructions.       | n8n: https://docs.n8n.io/ , Google Gemini: https://developers.generativeai.google/                                        |

---

**Disclaimer:** The provided text is exclusively derived from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with applicable content policies and contains no illegal, offensive, or protected elements. All manipulated data are legal and public.

---