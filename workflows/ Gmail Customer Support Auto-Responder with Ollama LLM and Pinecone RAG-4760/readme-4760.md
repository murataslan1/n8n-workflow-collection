 Gmail Customer Support Auto-Responder with Ollama LLM and Pinecone RAG

https://n8nworkflows.xyz/workflows/-gmail-customer-support-auto-responder-with-ollama-llm-and-pinecone-rag-4760


#  Gmail Customer Support Auto-Responder with Ollama LLM and Pinecone RAG

### 1. Workflow Overview

This workflow automates customer support email responses by integrating Gmail with advanced AI capabilities. Upon receiving an email in Gmail, it classifies the content, enriches context via a retrieval-augmented generation (RAG) approach using Pinecone vector search, and generates a relevant reply using Ollama large language models (LLMs). It then labels the processed email and sends the AI-generated response back to the customer.

The workflow is logically divided into these main blocks:

- **1.1 Input Reception:** Detect incoming Gmail messages to trigger the workflow.
- **1.2 Email Content Classification:** Use an AI text classifier to categorize the email content.
- **1.3 AI Processing and Context Enrichment:** Utilize Ollama LLMs combined with Pinecone vector store for RAG to formulate an informed response.
- **1.4 Email Labeling and Response Dispatch:** Label the email in Gmail for tracking and send the AI-generated reply.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block triggers the workflow upon receiving new emails in the connected Gmail account.

- **Nodes Involved:**  
  - Gmail Trigger

- **Node Details:**  
  - **Gmail Trigger**  
    - **Type:** Trigger node, Gmail integration  
    - **Role:** Listens for new incoming emails to initiate the workflow  
    - **Configuration:** No advanced filters or labels specified, triggers on all new emails  
    - **Inputs:** External Gmail inbox events  
    - **Outputs:** Passes the received email data downstream  
    - **Failure Modes:** Connectivity issues with Gmail API, OAuth token expiration, rate limiting by Gmail API  

#### 2.2 Email Content Classification

- **Overview:**  
  This block uses an AI text classifier to categorize the incoming email, aiding the AI agent in understanding the email’s intent or topic.

- **Nodes Involved:**  
  - Text Classifier  
  - Ollama Model (language model used by the classifier)

- **Node Details:**  
  - **Text Classifier**  
    - **Type:** Langchain AI node, text classification  
    - **Role:** Classifies email content into categories relevant for routing or response tailoring  
    - **Configuration:** Uses Ollama LLM as the underlying language model for classification  
    - **Inputs:** Email content from Gmail Trigger  
    - **Outputs:** Classification result to AI Agent node  
    - **Failure Modes:** Misclassification due to ambiguous input, model latency, expression evaluation errors  

  - **Ollama Model**  
    - **Type:** Language model node (LLM)  
    - **Role:** Provides LLM capabilities to the Text Classifier for natural language understanding  
    - **Configuration:** Ollama LLM endpoint configured, no explicit prompt override visible  
    - **Inputs:** Text Classifier’s requests  
    - **Outputs:** Classification inference results  
    - **Failure Modes:** Model unavailability, API connectivity issues  

#### 2.3 AI Processing and Context Enrichment

- **Overview:**  
  This block combines memory, language models, and external vector search to generate contextually relevant responses through retrieval-augmented generation.

- **Nodes Involved:**  
  - AI Agent  
  - Simple Memory  
  - Ollama Chat Model  
  - Pinecone Vector Store  
  - Embeddings Ollama

- **Node Details:**  
  - **AI Agent**  
    - **Type:** Langchain AI agent node  
    - **Role:** Orchestrates the AI response generation using input classification, memory, language model, and external tools  
    - **Configuration:** Connected to Simple Memory (for conversation history), Ollama Chat Model (for generating chat responses), and Pinecone Vector Store (for retrieval)  
    - **Inputs:** Classification results, memory context, Pinecone search results  
    - **Outputs:** Final AI-generated response to be sent via Gmail  
    - **Failure Modes:** Model timeout, missing or invalid memory context, Pinecone query failures, expression errors  

  - **Simple Memory**  
    - **Type:** Memory buffer node  
    - **Role:** Stores conversation context to maintain state across interactions  
    - **Configuration:** Uses a windowed buffer to keep recent history  
    - **Inputs:** Data from previous AI agent runs or other nodes  
    - **Outputs:** Contextual memory to AI Agent  
    - **Failure Modes:** Memory overflow, data corruption  

  - **Ollama Chat Model**  
    - **Type:** Language model node for chat  
    - **Role:** Generates conversational AI responses based on prompts and context  
    - **Configuration:** Ollama chat-specific LLM configured for dialogue generation  
    - **Inputs:** Prompts and context from AI Agent  
    - **Outputs:** Generated chat response text  
    - **Failure Modes:** Latency, incorrect response generation  

  - **Pinecone Vector Store**  
    - **Type:** Vector search tool node  
    - **Role:** Enables retrieval of relevant documents or knowledge from Pinecone to enrich AI responses (RAG)  
    - **Configuration:** Connected to Embeddings Ollama for vector embedding generation, queries Pinecone index for similar content  
    - **Inputs:** Embeddings from Embeddings Ollama  
    - **Outputs:** Relevant documents or content snippets to AI Agent  
    - **Failure Modes:** Pinecone API connection failures, empty or irrelevant retrievals  

  - **Embeddings Ollama**  
    - **Type:** Embeddings generation node  
    - **Role:** Converts textual data into vector embeddings to enable similarity search with Pinecone  
    - **Configuration:** Uses Ollama embeddings model  
    - **Inputs:** Text data to encode, likely from AI Agent or email content  
    - **Outputs:** Vector embeddings to Pinecone Vector Store  
    - **Failure Modes:** Embedding quality issues, API errors  

#### 2.4 Email Labeling and Response Dispatch

- **Overview:**  
  After the AI generates a response, this block labels the email in Gmail for workflow tracking and sends the AI response back to the email sender.

- **Nodes Involved:**  
  - Label  
  - Send

- **Node Details:**  
  - **Label**  
    - **Type:** Gmail node (modify message)  
    - **Role:** Applies a Gmail label to the processed email for organization and tracking  
    - **Configuration:** Uses Gmail credentials, label parameters configured (label name not explicitly shown but implied)  
    - **Inputs:** AI Agent output triggering labeling  
    - **Outputs:** Passes data to Send node  
    - **Failure Modes:** Gmail API rate limits, label not found, authentication errors  

  - **Send**  
    - **Type:** Gmail node (send email)  
    - **Role:** Sends the AI-generated response email to the original sender  
    - **Configuration:** Uses Gmail OAuth2 credentials, configured to construct reply emails automatically  
    - **Inputs:** Labeled email data and AI-generated response text  
    - **Outputs:** Workflow completion  
    - **Failure Modes:** Email sending failures, invalid recipient addresses, Gmail quota limits  

---

### 3. Summary Table

| Node Name           | Node Type                                | Functional Role                        | Input Node(s)             | Output Node(s)            | Sticky Note |
|---------------------|-----------------------------------------|-------------------------------------|---------------------------|---------------------------|-------------|
| Sticky Note         | stickyNote                              | Informational placeholder           | —                         | —                         |             |
| Gmail Trigger       | gmailTrigger                           | Entry trigger on new email          | —                         | Text Classifier           |             |
| Text Classifier     | @n8n/n8n-nodes-langchain.textClassifier | Classifies email content            | Gmail Trigger, Ollama Model| AI Agent                  |             |
| Ollama Model        | @n8n/n8n-nodes-langchain.lmOllama      | Provides LLM for classification     | Text Classifier            | Text Classifier           |             |
| AI Agent            | @n8n/n8n-nodes-langchain.agent         | Orchestrates AI response generation | Text Classifier, Simple Memory, Ollama Chat Model, Pinecone Vector Store | Label                    |             |
| Simple Memory       | @n8n/n8n-nodes-langchain.memoryBufferWindow | Maintains conversation memory       | —                         | AI Agent                  |             |
| Ollama Chat Model   | @n8n/n8n-nodes-langchain.lmChatOllama  | Generates chat responses            | AI Agent                   | AI Agent                  |             |
| Pinecone Vector Store | @n8n/n8n-nodes-langchain.vectorStorePinecone | Provides retrieval for RAG          | Embeddings Ollama          | AI Agent                  |             |
| Embeddings Ollama   | @n8n/n8n-nodes-langchain.embeddingsOllama | Generates vector embeddings         | —                         | Pinecone Vector Store     |             |
| Label               | gmail                                  | Labels processed email in Gmail     | AI Agent                   | Send                      |             |
| Send                | gmail                                  | Sends AI-generated email response   | Label                      | —                         |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in n8n named “Gmail Customer Support Auto-Responder with Ollama LLM and Pinecone RAG.”

2. **Add a Gmail Trigger node**:
   - Purpose: Trigger on new incoming emails.
   - Configuration: Connect Gmail OAuth2 credentials.
   - Leave default trigger conditions (listens to all incoming emails).
   - Position this as the workflow entry point.

3. **Add an Ollama Model node**:
   - Purpose: Provide the language model for classification.
   - Configure connection to Ollama LLM endpoint.
   - No additional prompt overrides needed.

4. **Add a Text Classifier node**:
   - Purpose: Classify incoming email text.
   - Connect its AI languageModel input to the Ollama Model node.
   - Connect its main input to the Gmail Trigger node.
   - Configure any classification labels or categories as per your use case (default or custom).
   
5. **Add a Simple Memory node**:
   - Purpose: Maintain conversation context.
   - Use a buffer window memory type.
   - No special parameters needed; default buffer size is sufficient.

6. **Add an Ollama Chat Model node**:
   - Purpose: Generate chat-style AI responses.
   - Configure connection to Ollama chat endpoint.
   - Connect this node’s output to the AI Agent node.

7. **Add an Embeddings Ollama node**:
   - Purpose: Generate embeddings for texts to enable similarity search.
   - Connect its output to Pinecone Vector Store node.

8. **Add a Pinecone Vector Store node**:
   - Purpose: Connect to Pinecone to retrieve relevant documents for RAG.
   - Configure with Pinecone API keys and index name.
   - Connect its output to the AI Agent node as an AI tool.

9. **Add an AI Agent node**:
   - Purpose: Orchestrate the overall AI response generation.
   - Connect main input to Text Classifier’s main output.
   - Connect ai_languageModel input to Ollama Chat Model.
   - Connect ai_memory input to Simple Memory.
   - Connect ai_tool input to Pinecone Vector Store.
   - Configure prompt templates and chaining logic if needed.

10. **Add a Label node (Gmail)**:
    - Purpose: Apply a label to processed emails to track workflow handling.
    - Connect input from AI Agent’s main output.
    - Configure Gmail credentials.
    - Specify the label name to apply (e.g., “Auto-Responded”).

11. **Add a Send node (Gmail)**:
    - Purpose: Send the AI-generated response email.
    - Connect input from Label node.
    - Configure Gmail credentials.
    - Set to reply to the original sender with generated content from AI Agent.

12. **Connect nodes in sequence**:
    - Gmail Trigger → Text Classifier  
    - Ollama Model → Text Classifier (ai_languageModel)  
    - Text Classifier → AI Agent  
    - Ollama Chat Model → AI Agent (ai_languageModel)  
    - Simple Memory → AI Agent (ai_memory)  
    - Embeddings Ollama → Pinecone Vector Store (ai_embedding)  
    - Pinecone Vector Store → AI Agent (ai_tool)  
    - AI Agent → Label → Send

13. **Credentials Setup**:
    - Gmail nodes require OAuth2 credentials with read/write email permissions.
    - Ollama nodes require API or local endpoint configured for LLM and embeddings.
    - Pinecone node requires API key, environment, and index name.

14. **Test and validate**:
    - Send test emails to the Gmail account.
    - Observe classification, AI response generation, labeling, and response sending.
    - Monitor logs for errors such as API timeouts or authentication failures.

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                           |
|-------------------------------------------------------------------------------------------------|-----------------------------------------------------------|
| This workflow uses Ollama LLM and embeddings models for both classification and response generation. | Ollama.ai platform for local or cloud LLM services.       |
| Pinecone is used as a vector database for retrieval-augmented generation (RAG) to improve response relevance. | https://www.pinecone.io/                                  |
| Gmail OAuth2 credentials must have appropriate scopes for reading, labeling, and sending emails. | Google Cloud Console & Gmail API documentation            |
| For best results, customize classification categories and AI prompt templates according to your support domain. | n8n Langchain node documentation and prompt engineering   |

---

**Disclaimer:**  
The text provided derives exclusively from an automated n8n workflow created with n8n, an integration and automation tool. This process strictly respects applicable content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.