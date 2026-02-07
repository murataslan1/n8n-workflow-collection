Adaptive RAG Strategy with Query Classification & Retrieval (Gemini & Qdrant)

https://n8nworkflows.xyz/workflows/adaptive-rag-strategy-with-query-classification---retrieval--gemini---qdrant--3459


# Adaptive RAG Strategy with Query Classification & Retrieval (Gemini & Qdrant)

### 1. Workflow Overview

This workflow implements an Adaptive Retrieval-Augmented Generation (RAG) framework that dynamically adjusts its information retrieval and response generation strategy based on the classification of the user's query. It is designed for scenarios where different types of questions (factual, analytical, opinion, contextual) require tailored handling to maximize relevance and accuracy of the answers. The workflow can be triggered either directly via n8n’s Chat interface or as a sub-workflow called by other workflows, receiving inputs such as the user query, chat session ID, and vector store collection ID.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Standardization:** Receives and standardizes inputs from chat or external workflows.
- **1.2 Query Classification:** Classifies the user query into one of four categories.
- **1.3 Adaptive Strategy Selection:** Routes the workflow based on query classification.
- **1.4 Strategy-Specific Query Adaptation:** Applies a tailored query adaptation strategy per category.
- **1.5 Prompt & Output Preparation:** Sets up the prompt and output text for retrieval and answer generation.
- **1.6 Document Retrieval:** Retrieves relevant documents from the Qdrant vector store.
- **1.7 Context Concatenation:** Combines retrieved document content into a single context block.
- **1.8 Answer Generation:** Generates the final answer using Google Gemini with context and chat memory.
- **1.9 Response Delivery:** Sends the generated answer back to the user.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Standardization

**Overview:**  
This block handles inputs from two possible triggers: the built-in Chat interface or an external workflow trigger. It standardizes the inputs into a unified format for downstream processing.

**Nodes Involved:**  
- Chat (Chat Trigger)  
- When Executed by Another Workflow (Execute Workflow Trigger)  
- Combined Fields (Set)  

**Node Details:**

- **Chat**  
  - Type: Chat Trigger  
  - Role: Entry point for direct chat interaction.  
  - Configuration: Uses default webhook ID for chat interface.  
  - Inputs: User chat input.  
  - Outputs: Passes data to Combined Fields.  
  - Edge Cases: Webhook connectivity issues, missing chat input.  

- **When Executed by Another Workflow**  
  - Type: Execute Workflow Trigger  
  - Role: Allows this workflow to be called by others, passing parameters.  
  - Configuration: Expects inputs `user_query`, `chat_memory_key`, `vector_store_id`.  
  - Inputs: External workflow parameters.  
  - Outputs: Passes data to Combined Fields.  
  - Edge Cases: Missing or malformed inputs from caller workflows.  

- **Combined Fields**  
  - Type: Set  
  - Role: Normalizes inputs by setting `user_query`, `chat_memory_key`, and `vector_store_id` from either source.  
  - Configuration: Uses expressions to fallback between chat input and workflow inputs.  
  - Key Expressions:  
    - `user_query = $json.user_query || $json.chatInput`  
    - `chat_memory_key = $json.chat_memory_key || $('Chat').item.json.sessionId`  
    - `vector_store_id = $json.vector_store_id || "<ID HERE>"` (default placeholder)  
  - Inputs: From Chat or Execute Workflow Trigger.  
  - Outputs: To Query Classification.  
  - Edge Cases: Missing vector store ID requires manual update; fallback logic may fail if both inputs missing.

---

#### 1.2 Query Classification

**Overview:**  
Classifies the user query into one of four categories: Factual, Analytical, Opinion, or Contextual, which determines the retrieval strategy.

**Nodes Involved:**  
- Gemini Classification (Google Gemini LM Chat)  
- Query Classification (LangChain Agent)  
- Switch (Switch node)  
- Sticky Note6 (comment)  

**Node Details:**

- **Gemini Classification**  
  - Type: Google Gemini LM Chat  
  - Role: Uses Google Gemini model `models/gemini-2.0-flash-lite` to classify query.  
  - Configuration: No special options; uses Google Palm API credentials.  
  - Inputs: From Combined Fields (user_query).  
  - Outputs: Classification text to Query Classification node.  
  - Edge Cases: API errors, rate limits, ambiguous classification.  

- **Query Classification**  
  - Type: LangChain Agent  
  - Role: Processes classification prompt with system message instructing to return exactly one category name.  
  - Configuration: Prompt uses the user query from Combined Fields.  
  - Key Expression: `Classify this query: {{ $('Combined Fields').item.json.user_query }}`  
  - Outputs: Classification result to Switch node.  
  - Edge Cases: Unexpected output format, empty response.  

- **Switch**  
  - Type: Switch  
  - Role: Routes workflow based on classification output string (trimmed).  
  - Configuration: Four cases matching exact strings: "Factual", "Analytical", "Opinion", "Contextual".  
  - Outputs: To respective strategy blocks.  
  - Edge Cases: Classification output mismatch leads to fallback route (none configured).  

- **Sticky Note6**  
  - Content: Explains query classification purpose.  

---

#### 1.3 Adaptive Strategy Selection

**Overview:**  
Directs the workflow into one of four strategy branches based on the query classification.

**Nodes Involved:**  
- Switch (from previous block)  

**Node Details:**  
- Already described above; this node is the routing mechanism.

---

#### 1.4 Strategy-Specific Query Adaptation

**Overview:**  
Each branch applies a tailored query adaptation strategy using Google Gemini agents to prepare the query or sub-queries for retrieval.

**Nodes Involved:**  
- Factual Strategy - Focus on Precision (LangChain Agent)  
- Analytical Strategy - Comprehensive Coverage (LangChain Agent)  
- Opinion Strategy - Diverse Perspectives (LangChain Agent)  
- Contextual Strategy - User Context Integration (LangChain Agent)  
- Chat Buffer Memory Factual / Analytical / Opinion / Contextual (Memory Buffer Window)  
- Gemini Factual / Analytical / Opinion / Contextual (Google Gemini LM Chat)  
- Factual Prompt and Output / Analytical Prompt and Output / Opinion Prompt and Output / Contextual Prompt and Output (Set nodes)  
- Sticky Note, one per strategy (Sticky Note, Sticky Note1, Sticky Note2, Sticky Note3)  

**Node Details:**

- **Factual Strategy - Focus on Precision**  
  - Type: LangChain Agent  
  - Role: Reformulates factual queries to be precise and entity-focused.  
  - Configuration: System message instructs to enhance query without explanation.  
  - Input: User query from Combined Fields.  
  - Output: Enhanced query string.  
  - Connected to: Factual Prompt and Output, Chat Buffer Memory Factual.  
  - Edge Cases: Over-simplification or loss of intent.  

- **Analytical Strategy - Comprehensive Coverage**  
  - Type: LangChain Agent  
  - Role: Generates exactly 3 sub-questions covering different aspects of the analytical query.  
  - Configuration: System message instructs breadth coverage.  
  - Input: User query from Combined Fields.  
  - Output: List of 3 sub-questions (one per line).  
  - Connected to: Analytical Prompt and Output, Chat Buffer Memory Analytical.  
  - Edge Cases: Sub-questions may be off-topic or incomplete.  

- **Opinion Strategy - Diverse Perspectives**  
  - Type: LangChain Agent  
  - Role: Identifies exactly 3 different viewpoints related to the opinion query.  
  - Configuration: System message instructs unbiased diverse perspectives.  
  - Input: User query from Combined Fields.  
  - Output: List of 3 viewpoints (one per line).  
  - Connected to: Opinion Prompt and Output, Chat Buffer Memory Opinion.  
  - Edge Cases: Bias in perspectives, missing key viewpoints.  

- **Contextual Strategy - User Context Integration**  
  - Type: LangChain Agent  
  - Role: Infers implied or relevant context not explicitly stated in the query.  
  - Configuration: System message instructs brief description of implied context.  
  - Input: User query from Combined Fields.  
  - Output: Brief context description.  
  - Connected to: Contextual Prompt and Output, Chat Buffer Memory Contextual.  
  - Edge Cases: Incorrect or irrelevant inferred context.  

- **Chat Buffer Memory Nodes (Factual, Analytical, Opinion, Contextual)**  
  - Type: Memory Buffer Window  
  - Role: Maintain chat history context for each strategy branch using `chat_memory_key`.  
  - Configuration: Uses sessionKey from Combined Fields, context window length 10.  
  - Input: Connected to respective strategy agent nodes.  
  - Edge Cases: Memory overflow, missing chat_memory_key.  

- **Gemini Factual / Analytical / Opinion / Contextual**  
  - Type: Google Gemini LM Chat  
  - Role: These nodes are the underlying language model calls for the respective strategy agents.  
  - Configuration: Use `models/gemini-2.0-flash` model with Google Palm API credentials.  
  - Input: From strategy LangChain agent nodes.  
  - Output: Strategy-specific adapted query or context.  
  - Edge Cases: API errors, rate limits.  

- **Factual Prompt and Output / Analytical Prompt and Output / Opinion Prompt and Output / Contextual Prompt and Output**  
  - Type: Set  
  - Role: Prepare the output and tailored system prompt for the final answer generation step.  
  - Configuration: Set `output` to strategy output and `prompt` to a system message tailored to the query type, instructing how to answer.  
  - Input: From respective strategy agent nodes.  
  - Output: To Set Prompt and Output node.  
  - Edge Cases: Missing or malformed prompt text.  

- **Sticky Notes (Sticky Note, Sticky Note1, Sticky Note2, Sticky Note3)**  
  - Content: Describe the retrieval strategy focus for each category.  

---

#### 1.5 Prompt & Output Preparation

**Overview:**  
Consolidates the output from the selected strategy and its corresponding prompt into a unified structure for document retrieval.

**Nodes Involved:**  
- Set Prompt and Output (Set)  
- Sticky Note4 (comment)  

**Node Details:**

- **Set Prompt and Output**  
  - Type: Set  
  - Role: Assigns `output` and `prompt` fields from the incoming data (strategy output and prompt).  
  - Configuration: Simple pass-through of these two fields.  
  - Input: From one of the four Prompt and Output nodes depending on classification.  
  - Output: To Retrieve Documents from Vector Store.  
  - Edge Cases: Missing fields if upstream nodes fail.  

- **Sticky Note4**  
  - Content: Explains this step performs adaptive retrieval considering query and context.  

---

#### 1.6 Document Retrieval

**Overview:**  
Retrieves the top relevant documents from the specified Qdrant vector store collection using the adapted query and prompt.

**Nodes Involved:**  
- Embeddings (Google Gemini Embeddings)  
- Retrieve Documents from Vector Store (Qdrant Vector Store)  

**Node Details:**

- **Embeddings**  
  - Type: Google Gemini Embeddings  
  - Role: Generates text embeddings for the adapted query to use in vector search.  
  - Configuration: Uses model `models/text-embedding-004` with Google Palm API credentials.  
  - Input: From Set Prompt and Output (output field).  
  - Output: Embeddings passed to Retrieve Documents node.  
  - Edge Cases: API errors, embedding quality issues.  

- **Retrieve Documents from Vector Store**  
  - Type: Qdrant Vector Store  
  - Role: Searches the vector store collection specified by `vector_store_id` for top 10 relevant documents.  
  - Configuration:  
    - Mode: load  
    - topK: 10  
    - Prompt: Combines prompt and output for context.  
    - Qdrant collection ID: from Combined Fields `vector_store_id`.  
    - Credentials: Qdrant API credentials required.  
  - Input: Embeddings from previous node.  
  - Output: Retrieved document chunks to Concatenate Context.  
  - Edge Cases: Connection failures, empty results, invalid collection ID.  

---

#### 1.7 Context Concatenation

**Overview:**  
Concatenates the retrieved document chunks into a single text block separated by delimiters, preparing context for final answer generation.

**Nodes Involved:**  
- Concatenate Context (Summarize)  

**Node Details:**

- **Concatenate Context**  
  - Type: Summarize (concatenate aggregation)  
  - Role: Aggregates the `pageContent` field from retrieved documents, separated by `\n\n---\n\n`.  
  - Configuration:  
    - Field to summarize: `document.pageContent`  
    - Aggregation: concatenate  
    - Separator: `\n\n---\n\n`  
  - Input: Retrieved documents from Qdrant node.  
  - Output: Single concatenated context string to Answer node.  
  - Edge Cases: Empty input array, very large concatenated text.  

---

#### 1.8 Answer Generation

**Overview:**  
Generates the final user response using Google Gemini, combining the concatenated context, original user query, tailored prompt, and chat history.

**Nodes Involved:**  
- Gemini Answer (Google Gemini LM Chat)  
- Answer (LangChain Agent)  
- Chat Buffer Memory (Memory Buffer Window)  
- Sticky Note5 (comment)  

**Node Details:**

- **Gemini Answer**  
  - Type: Google Gemini LM Chat  
  - Role: Underlying LM call for the final answer generation agent.  
  - Configuration: Uses `models/gemini-2.0-flash` with Google Palm API credentials.  
  - Input: From Answer node.  
  - Output: Final answer text to Respond to Webhook.  
  - Edge Cases: API errors, rate limits.  

- **Answer**  
  - Type: LangChain Agent  
  - Role: Generates answer based on:  
    - System prompt from Set Prompt and Output  
    - Concatenated context wrapped in `<ctx></ctx>` tags  
    - Original user query  
    - Chat history from Chat Buffer Memory  
  - Configuration:  
    - Prompt includes:  
      ```
      {{ $('Set Prompt and Output').item.json.prompt }}

      Use the following context (delimited by <ctx></ctx>) and the chat history to answer the user query.
      <ctx>
      {{ $json.concatenated_document_pageContent }}
      </ctx>
      ```
    - Text input: `User query: {{ $('Combined Fields').item.json.user_query }}`  
  - Input: Concatenated context, prompt, chat memory.  
  - Output: To Gemini Answer node.  
  - Edge Cases: Missing context, incomplete chat memory, prompt formatting errors.  

- **Chat Buffer Memory**  
  - Type: Memory Buffer Window  
  - Role: Provides chat history context for final answer generation.  
  - Configuration: Uses `chat_memory_key` from Combined Fields, context window length 10.  
  - Input: From Combined Fields.  
  - Output: To Answer node.  
  - Edge Cases: Missing or invalid chat memory key.  

- **Sticky Note5**  
  - Content: Explains this step replies to user integrating retrieval context.  

---

#### 1.9 Response Delivery

**Overview:**  
Sends the generated answer back to the user via the webhook response.

**Nodes Involved:**  
- Respond to Webhook  

**Node Details:**

- **Respond to Webhook**  
  - Type: Respond to Webhook  
  - Role: Returns the final answer to the chat interface or calling workflow.  
  - Configuration: Default response options.  
  - Input: From Answer node (final answer).  
  - Edge Cases: Webhook timeout, network issues.  

---

### 3. Summary Table

| Node Name                         | Node Type                              | Functional Role                              | Input Node(s)                         | Output Node(s)                           | Sticky Note                                                                                     |
|----------------------------------|--------------------------------------|----------------------------------------------|-------------------------------------|-----------------------------------------|------------------------------------------------------------------------------------------------|
| Chat                             | Chat Trigger                         | Entry point for chat interface input         | -                                   | Combined Fields                         | ## ⚠️  If using in Chat mode Update the `vector_store_id` variable to the corresponding Qdrant ID needed to perform the documents retrieval. |
| When Executed by Another Workflow| Execute Workflow Trigger             | Entry point for external workflow calls      | -                                   | Combined Fields                         |                                                                                                |
| Combined Fields                  | Set                                 | Standardizes inputs (user_query, memory key, vector store ID) | Chat, When Executed by Another Workflow | Query Classification                    | ## User query classification **Classify the query into one of four categories: Factual, Analytical, Opinion, or Contextual.** |
| Gemini Classification           | Google Gemini LM Chat                | Classifies query into category                | Combined Fields                     | Query Classification                    |                                                                                                |
| Query Classification            | LangChain Agent                     | Processes classification prompt               | Gemini Classification              | Switch                                 |                                                                                                |
| Switch                         | Switch                             | Routes workflow based on query category       | Query Classification               | Factual Strategy, Analytical Strategy, Opinion Strategy, Contextual Strategy |                                                                                                |
| Factual Strategy - Focus on Precision | LangChain Agent                     | Refines factual queries for precision         | Switch                            | Factual Prompt and Output               | ## Factual Strategy **Retrieve precise facts and figures.**                                   |
| Analytical Strategy - Comprehensive Coverage | LangChain Agent                     | Breaks analytical queries into sub-questions | Switch                            | Analytical Prompt and Output            | ## Analytical Strategy **Provide comprehensive coverage of a topics and exploring different aspects.** |
| Opinion Strategy - Diverse Perspectives | LangChain Agent                     | Identifies diverse viewpoints for opinion queries | Switch                            | Opinion Prompt and Output               | ## Opinion Strategy **Gather diverse viewpoints on a subjective issue.**                      |
| Contextual Strategy - User Context Integration | LangChain Agent                     | Infers implied context for contextual queries | Switch                            | Contextual Prompt and Output            | ## Contextual Strategy **Incorporate user-specific context to fine-tune the retrieval.**      |
| Chat Buffer Memory Factual       | Memory Buffer Window                | Maintains chat history for factual strategy   | Factual Strategy                  | Factual Strategy                       |                                                                                                |
| Chat Buffer Memory Analytical    | Memory Buffer Window                | Maintains chat history for analytical strategy| Analytical Strategy               | Analytical Strategy                    |                                                                                                |
| Chat Buffer Memory Opinion       | Memory Buffer Window                | Maintains chat history for opinion strategy   | Opinion Strategy                 | Opinion Strategy                      |                                                                                                |
| Chat Buffer Memory Contextual    | Memory Buffer Window                | Maintains chat history for contextual strategy| Contextual Strategy              | Contextual Strategy                   |                                                                                                |
| Gemini Factual                  | Google Gemini LM Chat                | LM call for factual strategy                   | Factual Strategy                 | Factual Strategy - Focus on Precision  |                                                                                                |
| Gemini Analytical              | Google Gemini LM Chat                | LM call for analytical strategy                | Analytical Strategy              | Analytical Strategy - Comprehensive Coverage |                                                                                                |
| Gemini Opinion                 | Google Gemini LM Chat                | LM call for opinion strategy                    | Opinion Strategy                 | Opinion Strategy - Diverse Perspectives |                                                                                                |
| Gemini Contextual             | Google Gemini LM Chat                | LM call for contextual strategy                 | Contextual Strategy              | Contextual Strategy - User Context Integration |                                                                                                |
| Factual Prompt and Output       | Set                                 | Prepares output and prompt for factual queries| Factual Strategy                | Set Prompt and Output                  |                                                                                                |
| Analytical Prompt and Output    | Set                                 | Prepares output and prompt for analytical queries| Analytical Strategy             | Set Prompt and Output                  |                                                                                                |
| Opinion Prompt and Output       | Set                                 | Prepares output and prompt for opinion queries| Opinion Strategy                | Set Prompt and Output                  |                                                                                                |
| Contextual Prompt and Output    | Set                                 | Prepares output and prompt for contextual queries| Contextual Strategy             | Set Prompt and Output                  |                                                                                                |
| Set Prompt and Output           | Set                                 | Consolidates prompt and output for retrieval  | Factual/Analytical/Opinion/Contextual Prompt and Output | Retrieve Documents from Vector Store | ## Perform adaptive retrieval **Find document considering both query and context.**           |
| Embeddings                     | Google Gemini Embeddings            | Generates embeddings for adapted query         | Set Prompt and Output           | Retrieve Documents from Vector Store   |                                                                                                |
| Retrieve Documents from Vector Store | Qdrant Vector Store                 | Retrieves top relevant documents from vector store | Embeddings                    | Concatenate Context                    |                                                                                                |
| Concatenate Context            | Summarize                          | Concatenates retrieved document contents       | Retrieve Documents from Vector Store | Answer                               |                                                                                                |
| Answer                        | LangChain Agent                     | Generates final answer using context and chat memory | Concatenate Context, Chat Buffer Memory, Set Prompt and Output | Gemini Answer                       | ## Reply to the user integrating retrieval context                                           |
| Gemini Answer                 | Google Gemini LM Chat                | LM call for final answer generation             | Answer                         | Respond to Webhook                    |                                                                                                |
| Chat Buffer Memory            | Memory Buffer Window                | Maintains chat history for final answer         | Combined Fields                | Answer                               |                                                                                                |
| Respond to Webhook            | Respond to Webhook                  | Sends final answer back to user                  | Gemini Answer                 | -                                   |                                                                                                |
| Sticky Note                   | Sticky Note                        | Comments on Factual Strategy                      | -                             | -                                   | ## Factual Strategy **Retrieve precise facts and figures.**                                   |
| Sticky Note1                  | Sticky Note                        | Comments on Analytical Strategy                   | -                             | -                                   | ## Analytical Strategy **Provide comprehensive coverage of a topics and exploring different aspects.** |
| Sticky Note2                  | Sticky Note                        | Comments on Opinion Strategy                      | -                             | -                                   | ## Opinion Strategy **Gather diverse viewpoints on a subjective issue.**                      |
| Sticky Note3                  | Sticky Note                        | Comments on Contextual Strategy                   | -                             | -                                   | ## Contextual Strategy **Incorporate user-specific context to fine-tune the retrieval.**      |
| Sticky Note4                  | Sticky Note                        | Comments on adaptive retrieval step               | -                             | -                                   | ## Perform adaptive retrieval **Find document considering both query and context.**           |
| Sticky Note5                  | Sticky Note                        | Comments on final reply step                        | -                             | -                                   | ## Reply to the user integrating retrieval context                                           |
| Sticky Note6                  | Sticky Note                        | Comments on query classification                    | -                             | -                                   | ## User query classification **Classify the query into one of four categories: Factual, Analytical, Opinion, or Contextual.** |
| Sticky Note7                  | Sticky Note                        | Overall workflow description                        | -                             | -                                   | # Adaptive RAG Workflow (full description and usage notes)                                   |
| Sticky Note8                  | Sticky Note                        | Chat mode usage warning                             | -                             | -                                   | ## ⚠️  If using in Chat mode Update the `vector_store_id` variable to the corresponding Qdrant ID needed to perform the documents retrieval. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**
   - Add a **Chat Trigger** node named `Chat` for direct chat input.
   - Add an **Execute Workflow Trigger** node named `When Executed by Another Workflow` with inputs: `user_query`, `chat_memory_key`, `vector_store_id`.

2. **Standardize Inputs:**
   - Add a **Set** node named `Combined Fields`.
   - Set fields:
     - `user_query`: Expression `{{$json.user_query || $json.chatInput}}`
     - `chat_memory_key`: Expression `{{$json.chat_memory_key || $('Chat').item.json.sessionId}}`
     - `vector_store_id`: Expression `{{$json.vector_store_id || "<ID HERE>"}}`
   - Connect outputs of `Chat` and `When Executed by Another Workflow` to `Combined Fields`.

3. **Query Classification:**
   - Add a **Google Gemini LM Chat** node named `Gemini Classification`.
     - Model: `models/gemini-2.0-flash-lite`
     - Credentials: Configure Google Palm API credentials.
   - Add a **LangChain Agent** node named `Query Classification`.
     - Prompt: `Classify this query: {{ $('Combined Fields').item.json.user_query }}`
     - System message:
       ```
       You are an expert at classifying questions.

       Classify the given query into exactly one of these categories:
       - Factual: Queries seeking specific, verifiable information.
       - Analytical: Queries requiring comprehensive analysis or explanation.
       - Opinion: Queries about subjective matters or seeking diverse viewpoints.
       - Contextual: Queries that depend on user-specific context.

       Return ONLY the category name, without any explanation or additional text.
       ```
   - Connect `Combined Fields` → `Gemini Classification` → `Query Classification`.

4. **Switch Node for Strategy Routing:**
   - Add a **Switch** node named `Switch`.
   - Configure rules to match trimmed output string exactly to: "Factual", "Analytical", "Opinion", "Contextual".
   - Connect `Query Classification` → `Switch`.

5. **Create Strategy Branches:**

   For each category, create the following nodes and connections:

   - **Factual Branch:**
     - **LangChain Agent** `Factual Strategy - Focus on Precision`
       - Prompt: `Enhance this factual query: {{ $('Combined Fields').item.json.user_query }}`
       - System message:
         ```
         You are an expert at enhancing search queries.

         Your task is to reformulate the given factual query to make it more precise and specific for information retrieval. Focus on key entities and their relationships.

         Provide ONLY the enhanced query without any explanation.
         ```
     - **Chat Buffer Memory** `Chat Buffer Memory Factual`
       - Session key: `={{ $('Combined Fields').item.json.chat_memory_key }}`
       - Context window length: 10
     - **Google Gemini LM Chat** `Gemini Factual`
       - Model: `models/gemini-2.0-flash`
       - Credentials: Google Palm API
     - **Set** `Factual Prompt and Output`
       - Assign:
         - `output` = `{{$json.output}}`
         - `prompt` =  
           ```
           You are a helpful assistant providing factual information. Answer the question based on the provided context. Focus on accuracy and precision. If the context doesn't contain the information needed, acknowledge the limitations.
           ```
     - Connect `Switch` (Factual output) → `Factual Strategy - Focus on Precision` → `Chat Buffer Memory Factual` → `Gemini Factual` → `Factual Prompt and Output`.

   - **Analytical Branch:**
     - **LangChain Agent** `Analytical Strategy - Comprehensive Coverage`
       - Prompt: `Generate sub-questions for this analytical query: {{ $('Combined Fields').item.json.user_query }}`
       - System message:
         ```
         You are an expert at breaking down complex questions.

         Generate sub-questions that explore different aspects of the main analytical query.
         These sub-questions should cover the breadth of the topic and help retrieve comprehensive information.

         Return a list of exactly 3 sub-questions, one per line.
         ```
     - **Chat Buffer Memory** `Chat Buffer Memory Analytical` (same config as above)
     - **Google Gemini LM Chat** `Gemini Analytical` (same config as above)
     - **Set** `Analytical Prompt and Output`
       - Assign:
         - `output` = `{{$json.output}}`
         - `prompt` =  
           ```
           You are a helpful assistant providing analytical insights. Based on the provided context, offer a comprehensive analysis of the topic. Cover different aspects and perspectives in your explanation. If the context has gaps, acknowledge them while providing the best analysis possible.
           ```
     - Connect `Switch` (Analytical output) → `Analytical Strategy - Comprehensive Coverage` → `Chat Buffer Memory Analytical` → `Gemini Analytical` → `Analytical Prompt and Output`.

   - **Opinion Branch:**
     - **LangChain Agent** `Opinion Strategy - Diverse Perspectives`
       - Prompt: `Identify different perspectives on: {{ $('Combined Fields').item.json.user_query }}`
       - System message:
         ```
         You are an expert at identifying different perspectives on a topic.

         For the given query about opinions or viewpoints, identify different perspectives that people might have on this topic.

         Return a list of exactly 3 different viewpoint angles, one per line.
         ```
     - **Chat Buffer Memory** `Chat Buffer Memory Opinion`
     - **Google Gemini LM Chat** `Gemini Opinion`
     - **Set** `Opinion Prompt and Output`
       - Assign:
         - `output` = `{{$json.output}}`
         - `prompt` =  
           ```
           You are a helpful assistant discussing topics with multiple viewpoints. Based on the provided context, present different perspectives on the topic. Ensure fair representation of diverse opinions without showing bias. Acknowledge where the context presents limited viewpoints.
           ```
     - Connect `Switch` (Opinion output) → `Opinion Strategy - Diverse Perspectives` → `Chat Buffer Memory Opinion` → `Gemini Opinion` → `Opinion Prompt and Output`.

   - **Contextual Branch:**
     - **LangChain Agent** `Contextual Strategy - User Context Integration`
       - Prompt: `Infer the implied context in this query: {{ $('Combined Fields').item.json.user_query }}`
       - System message:
         ```
         You are an expert at understanding implied context in questions.

         For the given query, infer what contextual information might be relevant or implied but not explicitly stated. Focus on what background would help answering this query.

         Return a brief description of the implied context.
         ```
     - **Chat Buffer Memory** `Chat Buffer Memory Contextual`
     - **Google Gemini LM Chat** `Gemini Contextual`
     - **Set** `Contextual Prompt and Output`
       - Assign:
         - `output` = `{{$json.output}}`
         - `prompt` =  
           ```
           You are a helpful assistant providing contextually relevant information. Answer the question considering both the query and its context. Make connections between the query context and the information in the provided documents. If the context doesn't fully address the specific situation, acknowledge the limitations.
           ```
     - Connect `Switch` (Contextual output) → `Contextual Strategy - User Context Integration` → `Chat Buffer Memory Contextual` → `Gemini Contextual` → `Contextual Prompt and Output`.

6. **Consolidate Prompt and Output:**
   - Add a **Set** node named `Set Prompt and Output`.
   - Assign fields:
     - `output` = `{{$json.output}}`
     - `prompt` = `{{$json.prompt}}`
   - Connect all four Prompt and Output nodes to this node.

7. **Generate Embeddings:**
   - Add a **Google Gemini Embeddings** node named `Embeddings`.
   - Model: `models/text-embedding-004`
   - Credentials: Google Palm API
   - Connect `Set Prompt and Output` → `Embeddings`.

8. **Retrieve Documents:**
   - Add a **Qdrant Vector Store** node named `Retrieve Documents from Vector Store`.
   - Mode: load
   - topK: 10
   - Prompt:  
     ```
     {{$json.prompt}}

     User query: 
     {{$json.output}}
     ```
   - Collection ID: Expression `={{ $('Combined Fields').item.json.vector_store_id }}`
   - Credentials: Qdrant API credentials
   - Connect `Embeddings` → `Retrieve Documents from Vector Store`.

9. **Concatenate Context:**
   - Add a **Summarize** node named `Concatenate Context`.
   - Fields to summarize: `document.pageContent`
   - Aggregation: concatenate
   - Separator: `\n\n---\n\n`
   - Connect `Retrieve Documents from Vector Store` → `Concatenate Context`.

10. **Final Answer Generation:**
    - Add a **Memory Buffer Window** node named `Chat Buffer Memory`.
      - Session key: `={{ $('Combined Fields').item.json.chat_memory_key }}`
      - Context window length: 10
    - Add a **LangChain Agent** node named `Answer`.
      - Text: `User query: {{ $('Combined Fields').item.json.user_query }}`
      - System message:  
        ```
        {{$json.prompt}}

        Use the following context (delimited by <ctx></ctx>) and the chat history to answer the user query.
        <ctx>
        {{ $json.concatenated_document_pageContent }}
        </ctx>
        ```
    - Add a **Google Gemini LM Chat** node named `Gemini Answer`.
      - Model: `models/gemini-2.0-flash`
      - Credentials: Google Palm API
    - Connect `Concatenate Context` → `Answer`
    - Connect `Chat Buffer Memory` → `Answer` (as memory input)
    - Connect `Answer` → `Gemini Answer`.

11. **Respond to User:**
    - Add a **Respond to Webhook** node named `Respond to Webhook`.
    - Connect `Gemini Answer` → `Respond to Webhook`.

12. **Sticky Notes (Optional):**
    - Add sticky notes near relevant nodes to document strategy descriptions and usage instructions as per the original workflow.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                  | Context or Link                                                                                  |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow implements an Adaptive RAG approach, dynamically adjusting retrieval strategies based on query classification to improve relevance and accuracy.                                                                                                                                                                                                              | Overall workflow purpose                                                                        |
| Requires Google Gemini (PaLM) API credentials configured in n8n for language model and embeddings nodes.                                                                                                                                                                                                                                                                      | Credential setup                                                                               |
| Requires Qdrant API credentials configured in n8n for vector store document retrieval.                                                                                                                                                                                                                                                                                        | Credential setup                                                                               |
| When using the workflow in Chat mode, update the `vector_store_id` variable in the Combined Fields node to the appropriate Qdrant collection ID for your knowledge base.                                                                                                                                                                                                    | Sticky Note8                                                                                   |
| The query categories and associated strategies (Factual, Analytical, Opinion, Contextual) are examples and can be customized to fit specific domains or use cases.                                                                                                                                                                                                          | Usage & Flexibility section                                                                    |
| The workflow supports both direct chat interaction and invocation as a sub-workflow, making it flexible for integration into larger automation pipelines.                                                                                                                                                                                                                   | Usage & Flexibility section                                                                    |
| For best results, ensure the Qdrant collection contains well-indexed documents relevant to the expected query types.                                                                                                                                                                                                                                                         | Integration note                                                                              |
| The memory buffer nodes maintain conversation context to enable coherent multi-turn interactions. Adjust `contextWindowLength` as needed based on expected conversation length and memory constraints.                                                                                                                                                                        | Memory management                                                                             |
| For detailed understanding of Google Gemini models and Qdrant vector stores, consult official documentation:  
- Google Gemini: https://developers.generativeai.google/  
- Qdrant: https://qdrant.tech/documentation/                                                                                                                                                                                                                                                                    | External resources                                                                            |

---

This structured documentation provides a comprehensive understanding of the Adaptive RAG workflow, enabling advanced users and AI agents to analyze, reproduce, and modify it confidently.