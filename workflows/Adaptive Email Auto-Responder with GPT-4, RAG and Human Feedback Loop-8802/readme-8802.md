Adaptive Email Auto-Responder with GPT-4, RAG and Human Feedback Loop

https://n8nworkflows.xyz/workflows/adaptive-email-auto-responder-with-gpt-4--rag-and-human-feedback-loop-8802


# Adaptive Email Auto-Responder with GPT-4, RAG and Human Feedback Loop

### 1. Workflow Overview

This workflow implements an **Adaptive Email Auto-Responder** leveraging GPT-4, Retrieval-Augmented Generation (RAG) with Supabase vector stores, and a human feedback loop for continuous improvement. It targets email communication automation, particularly to dynamically generate context-aware, relevant replies based on the incoming email content and curated knowledge bases, while enabling human review and feedback integration.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Initial Processing:** Captures incoming emails and triggers the workflow. Parses and extracts key information from emails.
- **1.2 Dynamic Prompt Retrieval:** Retrieves context-sensitive prompt templates from Google Sheets depending on conditions.
- **1.3 AI Processing and RAG Integration:** Utilizes OpenAI GPT-4 models combined with Supabase vector stores for knowledge retrieval and response generation. This block includes embedding generation, vector search, language model invocation, output parsing, and AI agent orchestration.
- **1.4 Response Formatting and Decision Logic:** Processes AI-generated content, applies structured parsers, and determines the correct output path (auto-response or manual intervention).
- **1.5 Email Sending and Feedback Loop:** Sends the generated emails via Gmail, logs interactions and feedback in Google Sheets, and supports human-in-the-loop quality control.
- **1.6 Auxiliary Data Preparation and Text Splitting:** Supports vector store updating and document handling with recursive text splitting for efficient knowledge retrieval.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Initial Processing

- **Overview:**  
  Captures incoming Gmail messages via trigger nodes, applies conditional checks, and extracts structured information to prepare for AI processing.

- **Nodes Involved:**  
  - Gmail Trigger1  
  - If2  
  - Get Dynamic Prompt  
  - Original Reply  
  - Edit Fields  
  - AI Agent

- **Node Details:**  
  - **Gmail Trigger1**  
    - *Type:* Gmail Trigger  
    - *Role:* Listens for new incoming emails to start the workflow.  
    - *Config:* Uses OAuth2 credentials for Gmail.  
    - *Connections:* Outputs to If2 node.  
    - *Potential Failures:* Authentication errors, rate limits, network timeouts.

  - **If2**  
    - *Type:* Conditional (If)  
    - *Role:* Applies filtering logic (e.g., email subject, sender, or other conditions) to decide if the email should be processed.  
    - *Connections:* True branch to Get Dynamic Prompt, False branch ignored.  
    - *Potential Failures:* Expression misconfigurations causing incorrect branching.

  - **Get Dynamic Prompt**  
    - *Type:* Google Sheets  
    - *Role:* Fetches prompt templates dynamically from a Google Sheet based on input parameters.  
    - *Config:* Uses Google OAuth2 credentials.  
    - *Input:* Filtered email metadata.  
    - *Output:* Template for AI prompt.  
    - *Failures:* API limits, credential issues, sheet schema changes.

  - **Original Reply**  
    - *Type:* Markdown  
    - *Role:* Formats the fetched prompt/template into Markdown for further processing.  
    - *Potential Failures:* Template syntax errors.

  - **Edit Fields**  
    - *Type:* Set  
    - *Role:* Prepares and modifies data fields to match AI agent input schema.  
    - *Connections:* Outputs to AI Agent node.

  - **AI Agent**  
    - *Type:* Langchain Agent  
    - *Role:* Central orchestrator invoking language models and tools for response generation.  
    - *Connections:* Outputs to If node for decision branching.  
    - *Failures:* Model API limits, invalid model parameters, tool invocation errors.

---

#### 1.2 Dynamic Prompt Retrieval

- **Overview:**  
  Retrieves different prompt templates from Google Sheets triggered by user edits or other triggers to customize AI prompt construction in multiple contexts.

- **Nodes Involved:**  
  - Google Sheets Trigger  
  - If1  
  - Get Dynamic Prompt1  
  - Information Extractor  
  - OpenAI Chat Model2

- **Node Details:**  
  - **Google Sheets Trigger**  
    - *Type:* Google Sheets Trigger  
    - *Role:* Watches for updates in specific Google Sheets to trigger workflow parts for prompt updates or data extraction.  
    - *Failures:* Network, auth, or sheet permission issues.

  - **If1**  
    - *Type:* If  
    - *Role:* Conditional branching based on sheet event data to determine next action.  
    - *Connections:* True branch to Get Dynamic Prompt1.

  - **Get Dynamic Prompt1**  
    - *Type:* Google Sheets  
    - *Role:* Fetches prompt templates for information extraction tasks.  
    - *Failures:* Same as Get Dynamic Prompt.

  - **Information Extractor**  
    - *Type:* Langchain Information Extractor  
    - *Role:* Extracts structured data from text using OpenAI model outputs.  
    - *Connections:* Outputs to Markdown1 and Switch nodes.  
    - *Failures:* Model misinterpretation, output formatting errors.

  - **OpenAI Chat Model2**  
    - *Type:* Langchain OpenAI Chat Model  
    - *Role:* Provides underlying language model calls for information extraction.  
    - *Failures:* API limits, request timeouts.

---

#### 1.3 AI Processing and RAG Integration

- **Overview:**  
  Embeds email content and knowledge base documents, searches vector stores, and generates context-aware AI responses.

- **Nodes Involved:**  
  - Embeddings OpenAI  
  - Supabase Vector Store  
  - OpenAI Chat Model  
  - AI Agent  
  - Auto-fixing Output Parser  
  - OpenAI Chat Model1  
  - Structured Output Parser  
  - Switch  
  - Supabase Vector Store1  
  - Embeddings OpenAI1  
  - Default Data Loader  
  - Recursive Character Text Splitter

- **Node Details:**  
  - **Embeddings OpenAI & Embeddings OpenAI1**  
    - *Type:* Langchain Embeddings OpenAI  
    - *Role:* Converts text to vector embeddings for semantic search.  
    - *Failures:* API limits, embedding service outages.

  - **Supabase Vector Store & Supabase Vector Store1**  
    - *Type:* Vector Store (Supabase)  
    - *Role:* Stores and queries document embeddings for retrieval.  
    - *Failures:* DB connection issues, query errors.

  - **OpenAI Chat Model & OpenAI Chat Model1**  
    - *Type:* Langchain OpenAI Chat Model  
    - *Role:* GPT-4-based language model for chat completion tasks.  
    - *Failures:* Rate limits, invalid prompts.

  - **AI Agent**  
    - *Role:* Coordinates calls to vector store and chat model, applying agents’ logic for RAG.  

  - **Auto-fixing Output Parser**  
    - *Type:* Langchain Output Parser with auto-correction  
    - *Role:* Parses and fixes AI outputs, ensuring structured and valid JSON or expected formats.  
    - *Failures:* Parsing errors if output is malformed beyond auto-fix capability.

  - **Structured Output Parser**  
    - *Type:* Langchain Structured Output Parser  
    - *Role:* Enforces strict output format (e.g., JSON schema) from AI responses.

  - **Switch**  
    - *Type:* Switch conditional node  
    - *Role:* Decides which vector store or processing path to use based on extracted info.

  - **Default Data Loader & Recursive Character Text Splitter**  
    - *Type:* Document Loader and Text Splitter  
    - *Role:* Prepares documents for embedding by splitting large texts into manageable chunks.  
    - *Failures:* Improper chunking, data loading errors.

---

#### 1.4 Response Formatting and Decision Logic

- **Overview:**  
  Handles AI-generated content formatting, applies conditionals to determine if auto-response is appropriate, and prepares final output.

- **Nodes Involved:**  
  - If  
  - Markdown  
  - Google Sheets  
  - Gmail

- **Node Details:**  
  - **If**  
    - *Type:* Conditional branching  
    - *Role:* Determines if the AI-generated response meets criteria for automatic sending.  
    - *Outputs:* To Markdown for formatting or Gmail for sending.

  - **Markdown**  
    - *Role:* Formats AI response into email-ready Markdown content.

  - **Google Sheets**  
    - *Role:* Logs interactions and stores reply data or feedback.

  - **Gmail**  
    - *Role:* Sends the auto-generated email reply to the original sender using Gmail OAuth2 credentials.  
    - *Failures:* Authentication errors, sending limits.

---

#### 1.5 Email Sending and Feedback Loop

- **Overview:**  
  Manages sending emails back to users and logging responses; supports receiving feedback for iterative improvement.

- **Nodes Involved:**  
  - Gmail1  
  - Markdown1  
  - Google Sheets1

- **Node Details:**  
  - **Markdown1**  
    - *Role:* Formats response for human review or feedback email.

  - **Gmail1**  
    - *Role:* Sends final email replies or feedback requests.

  - **Google Sheets1**  
    - *Role:* Logs feedback and tracks conversation state for continuous learning.

---

#### 1.6 Auxiliary Data Preparation and Text Splitting

- **Overview:**  
  Supports knowledge base maintenance by loading documents, splitting texts, and embedding new data into vector stores.

- **Nodes Involved:**  
  - Recursive Character Text Splitter  
  - Default Data Loader  
  - Embeddings OpenAI1  
  - Supabase Vector Store1

- **Node Details:**  
  - **Recursive Character Text Splitter**  
    - *Role:* Splits large text documents recursively by characters ensuring semantic chunks.

  - **Default Data Loader**  
    - *Role:* Loads default documents for embedding.

  - **Embeddings OpenAI1**  
    - *Role:* Generates embeddings for split text chunks.

  - **Supabase Vector Store1**  
    - *Role:* Indexes new embeddings into the vector database.

---

### 3. Summary Table

| Node Name                      | Node Type                                | Functional Role                          | Input Node(s)               | Output Node(s)                | Sticky Note                           |
|--------------------------------|----------------------------------------|----------------------------------------|-----------------------------|------------------------------|-------------------------------------|
| Gmail Trigger1                 | Gmail Trigger                          | Starts workflow on incoming email      |                             | If2                          |                                     |
| If2                           | If (Conditional)                      | Filters incoming emails                 | Gmail Trigger1              | Get Dynamic Prompt            |                                     |
| Get Dynamic Prompt             | Google Sheets                         | Retrieves prompt templates              | If2                         | Original Reply                |                                     |
| Original Reply                | Markdown                             | Formats prompt template                 | Get Dynamic Prompt           | Edit Fields                  |                                     |
| Edit Fields                   | Set                                  | Prepares data fields for AI Agent      | Original Reply              | AI Agent                     |                                     |
| AI Agent                     | Langchain Agent                      | Orchestrates AI calls                   | Edit Fields                 | If                          |                                     |
| If                            | If (Conditional)                      | Decides auto-response path              | AI Agent                    | Markdown / Gmail             |                                     |
| Markdown                      | Markdown                             | Formats AI response                     | If                         | Google Sheets                |                                     |
| Google Sheets                 | Google Sheets                        | Logs email interaction                  | Markdown                    |                              |                                     |
| Gmail                        | Gmail                               | Sends auto-generated email              | If                         |                              |                                     |
| Google Sheets Trigger         | Google Sheets Trigger                | Triggers workflow on sheet changes      |                             | If1                         |                                     |
| If1                          | If (Conditional)                      | Branches based on sheet event           | Google Sheets Trigger       | Get Dynamic Prompt1          |                                     |
| Get Dynamic Prompt1           | Google Sheets                       | Retrieves info extraction prompt        | If1                        | Information Extractor        |                                     |
| Information Extractor         | Langchain Information Extractor      | Extracts structured info from text      | Get Dynamic Prompt1         | Markdown1, Switch            |                                     |
| Markdown1                    | Markdown                             | Formats extracted info                   | Information Extractor       | Gmail1                      |                                     |
| Gmail1                      | Gmail                               | Sends feedback/human response           | Markdown1                  |                              |                                     |
| Switch                      | Switch                              | Decides vector store path                | Information Extractor       | Google Sheets1, Supabase Vector Store1 |                                     |
| Google Sheets1               | Google Sheets                      | Logs feedback and email data             | Switch                     |                              |                                     |
| Supabase Vector Store        | Langchain Vector Store (Supabase)   | Queries vector embeddings                | Embeddings OpenAI          | AI Agent                    |                                     |
| Embeddings OpenAI            | Langchain Embeddings OpenAI          | Generates embeddings                      |                             | Supabase Vector Store       |                                     |
| OpenAI Chat Model            | Langchain OpenAI Chat Model          | Primary GPT-4 language model             |                             | AI Agent                    |                                     |
| Auto-fixing Output Parser    | Langchain Output Parser (Auto-fixing)| Parses and corrects AI outputs            | OpenAI Chat Model1          | AI Agent                    |                                     |
| OpenAI Chat Model1           | Langchain OpenAI Chat Model          | Secondary GPT-4 model for output parsing |                             | Auto-fixing Output Parser   |                                     |
| Structured Output Parser     | Langchain Structured Output Parser   | Enforces strict output format             |                             | Auto-fixing Output Parser   |                                     |
| Supabase Vector Store1       | Langchain Vector Store (Supabase)    | Stores vector embeddings for new docs    | Embeddings OpenAI1, Default Data Loader |                       |                                     |
| Embeddings OpenAI1           | Langchain Embeddings OpenAI          | Embeds document chunks                    |                             | Supabase Vector Store1      |                                     |
| Default Data Loader          | Langchain Document Default Data Loader| Loads documents for embedding             | Recursive Character Text Splitter | Supabase Vector Store1      |                                     |
| Recursive Character Text Splitter | Langchain Text Splitter            | Splits text recursively                    |                             | Default Data Loader         |                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger Node:**  
   - Type: Gmail Trigger  
   - Configure OAuth2 credentials for Gmail API.  
   - Set to trigger on new incoming emails.

2. **Add Conditional Node (If2):**  
   - Type: If  
   - Define expressions to filter emails by subject, sender, or other criteria.

3. **Add Google Sheets Node (Get Dynamic Prompt):**  
   - Connect from If2 true branch.  
   - Configure OAuth2 credentials.  
   - Set up to read prompt templates dynamically based on email metadata.

4. **Add Markdown Node (Original Reply):**  
   - Connect from Get Dynamic Prompt.  
   - Format the prompt template into Markdown for AI input.

5. **Add Set Node (Edit Fields):**  
   - Connect from Original Reply.  
   - Adjust data structure to match AI agent input requirements.

6. **Add Langchain Agent Node (AI Agent):**  
   - Connect from Edit Fields.  
   - Configure with OpenAI GPT-4 credentials and define use of vector store tools.  
   - Connect embeddings and vector store nodes as tools.

7. **Add If Node (If):**  
   - Connect from AI Agent output.  
   - Define logic to decide if auto-response will be sent or if manual intervention needed.

8. **Add Markdown Node:**  
   - Connect If true branch for formatting AI response into email content.

9. **Add Google Sheets Node:**  
   - Connect from Markdown node to log the response data.

10. **Add Gmail Node:**  
    - Connect If false branch to send email.  
    - Configure OAuth2 credentials for Gmail.

11. **Create Google Sheets Trigger Node:**  
    - Configure to watch for sheet changes that influence prompt templates or feedback.

12. **Add If1 Conditional Node:**  
    - Branches based on Google Sheets trigger event content.

13. **Add Google Sheets Node (Get Dynamic Prompt1):**  
    - Connect from If1 true branch to fetch information extraction prompts.

14. **Add Langchain Information Extractor Node:**  
    - Connect from Get Dynamic Prompt1.  
    - Configure with OpenAI GPT-4 credentials.

15. **Add Markdown Node (Markdown1):**  
    - Connect from Information Extractor for formatting extracted data.

16. **Add Gmail Node (Gmail1):**  
    - Connect from Markdown1 to send feedback or human-in-the-loop emails.

17. **Add Switch Node:**  
    - Connect from Information Extractor to route to appropriate vector store or Google Sheets logger.

18. **Add Google Sheets Node (Google Sheets1):**  
    - For logging feedback and conversation data.

19. **Add Supabase Vector Store Nodes:**  
    - Create two Supabase vector store nodes for querying and storing embeddings.  
    - Configure with Supabase credentials.

20. **Add Langchain Embeddings OpenAI Nodes:**  
    - Two nodes for embedding email content and documents.

21. **Add OpenAI Chat Model Nodes:**  
    - Primary model for generation and secondary for output parsing.

22. **Add Output Parsers:**  
    - Auto-fixing and structured output parsers connected to OpenAI Chat Model outputs.

23. **Add Document Loading and Text Splitting Nodes:**  
    - Recursive Character Text Splitter to split large docs.  
    - Default Data Loader to load documents.  
    - Connect to embedding and vector store nodes.

24. **Connect all nodes respecting the dependencies and data flows as per above.**

25. **Test with real emails and monitor logs for errors, adjust conditional logic and model parameters as needed.**

---

### 5. General Notes & Resources

| Note Content                                                                                   | Context or Link                                   |
|-----------------------------------------------------------------------------------------------|--------------------------------------------------|
| Workflow uses GPT-4 and Langchain integration heavily; ensure OpenAI API key has GPT-4 access. | OpenAI API documentation                          |
| Supabase vector store requires proper setup of database and API keys with correct permissions.| Supabase docs: https://supabase.com/docs          |
| Gmail OAuth2 credentials must have read/write permissions for email access and sending.       | Google Cloud Console for OAuth2 setup             |
| Google Sheets used for dynamic prompt management and logging; maintain consistent schema.     | Google Sheets API docs                            |
| Output parsers improve stability by correcting malformed AI responses automatically.           | Langchain output parser docs                       |
| Human feedback loop implemented to gradually improve AI responses and update knowledge base.  | Best practices for human-in-the-loop AI systems  |
| Recursive text splitter ensures efficient semantic chunking for embedding large documents.    | Langchain text splitter documentation             |

---

**Disclaimer:** The provided text is exclusively derived from an n8n automated workflow. It complies strictly with applicable content policies and contains no illegal, offensive, or protected material. All data manipulated is legal and public.