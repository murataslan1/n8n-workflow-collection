AI-Powered MIS Agent

https://n8nworkflows.xyz/workflows/ai-powered-mis-agent-4341


# AI-Powered MIS Agent

### 1. Workflow Overview

This workflow, titled **AI-Powered MIS Agent**, is designed to automate the processing, classification, and management of incoming data related to Management Information Systems (MIS). It integrates multiple data sources including Gmail, Google Drive, Google Sheets, and a PostgreSQL database, and uses AI models (OpenAI and LangChain) for natural language understanding, classification, and intelligent response generation.

The workflow is organized into logical blocks as follows:

- **1.1 Input Reception and Triggering**: Listens for incoming emails, Google Drive changes, scheduled times, and chat messages to initiate processing.
- **1.2 Data Retrieval and Preparation**: Retrieves files and data from Google Drive and Google Sheets, setting up necessary context.
- **1.3 Content Classification and Routing**: Uses AI-based classifiers to analyze incoming content and direct it to appropriate processing paths.
- **1.4 AI Processing and Agent Execution**: Employs OpenAI language models and LangChain agents to interpret data, perform calculations, query databases, and generate responses.
- **1.5 Data Storage and Update**: Updates Google Sheets and PostgreSQL databases with processed and enriched data.
- **1.6 Vector Store Management**: Manages document embeddings with Pinecone for efficient semantic search and retrieval.
- **1.7 Orchestration and Merging**: Coordinates parallel data flows, merges outputs, and manages workflow execution states.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Triggering

**Overview:**  
This block listens for various triggers to start the workflow, including new emails, scheduled times, Google Drive events, and chat message reception.

**Nodes Involved:**  
- Gmail Trigger  
- Gmail  
- Schedule Trigger  
- Google Drive Trigger (4 instances)  
- When chat message received  
- When Executed by Another Workflow (Sub-workflow trigger)

**Node Details:**

- **Gmail Trigger**  
  - Type: Gmail trigger  
  - Role: Listens for new emails in the connected Gmail account to start workflow processing.  
  - Configuration: Default settings, monitoring inbox or specific labels.  
  - Connections: Outputs to Gmail node.  
  - Potential Failures: Authentication errors, Gmail API rate limits, connectivity issues.

- **Gmail**  
  - Type: Gmail node (email fetch)  
  - Role: Fetches email content after trigger fires.  
  - Configuration: Default; uses webhook ID.  
  - Connections: Outputs to Text Classifier.  
  - Potential Failures: Email fetch errors, missing permissions.

- **Schedule Trigger**  
  - Type: Scheduler  
  - Role: Triggers workflow at defined intervals (e.g., daily) for batch processing or routine checks.  
  - Configuration: Default schedule parameters (not detailed).  
  - Connections: Outputs to Drive Folders URL node.  
  - Potential Failures: Scheduler misconfiguration.

- **Google Drive Trigger (4 instances)**  
  - Type: Google Drive trigger  
  - Role: Listens for changes in Google Drive folders to initiate processing of new or updated files.  
  - Configuration: Each instance monitors different folders or file types.  
  - Connections: Lead to Edit Fields nodes for data preparation.  
  - Potential Failures: Drive API permission issues, missing folders.

- **When chat message received**  
  - Type: LangChain chat trigger  
  - Role: Listens for incoming chat messages to initiate AI agent interaction.  
  - Configuration: Uses webhook for real-time chat input.  
  - Connections: Outputs to MIS Agent1.  
  - Potential Failures: Webhook issues, chat platform integration errors.

- **When Executed by Another Workflow**  
  - Type: Execute Workflow Trigger  
  - Role: Enables this workflow to be called as a sub-workflow by other workflows.  
  - Configuration: Standard execute workflow trigger.  
  - Connections: Outputs to Operation Classifier.  
  - Potential Failures: Sub-workflow invocation errors.

---

#### 2.2 Data Retrieval and Preparation

**Overview:**  
This block handles the retrieval of files and data from Google Drive and Google Sheets, and prepares data fields for subsequent processing.

**Nodes Involved:**  
- Multiple Google Drive nodes (Google Drive1, Google Drive2, Google Drive3,... Google Drive10)  
- Google Sheets nodes (Google Sheets, Google Sheets2, Google Sheets3, Google Sheets4, Google Sheets6, Google Sheets8)  
- Set nodes (Daily Sales, Address, customer_info, Drive Folders URL, Drive Folders URL1, Edit Fields series)  
- Code nodes (Code, Code2, Code3, Code4, Code5, Code6, Code7, Code8, Code10)  
- Convert to File (Convert to File, Convert to File1, Convert to File2)  
- Merge and Merge2  
- Loop Over Items

**Node Details:**

- **Google Drive nodes**  
  - Type: Google Drive  
  - Role: Access and retrieve files or folders from Google Drive. Some nodes fetch folders, others files; a few handle error continuation on failure.  
  - Configuration: Each node targets specific folders or files (e.g., Daily Sales Folder, Address Folder).  
  - Connections: Feed into subsequent processing nodes or merge nodes.  
  - Failures: API quota exceeded, missing files/folders, permission issues.

- **Google Sheets nodes**  
  - Type: Google Sheets / Google Sheets Tool  
  - Role: Read, write, or update data in Google Sheets spreadsheets.  
  - Configuration: Specific sheets and ranges set for data update or retrieval.  
  - Connections: Often follow Edit Fields or Code nodes for data transformation.  
  - Failures: Sheet not found, permission errors, invalid ranges.

- **Set nodes (Edit Fields, Daily Sales, Address, customer_info, etc.)**  
  - Type: Set  
  - Role: Define or modify data fields for downstream nodes.  
  - Configuration: Custom fields set, sometimes preparing data for classification or storage.  
  - Connections: Input from triggers or prior nodes; output to if/switch or processing nodes.  
  - Failures: Expression errors, missing variables.

- **Code nodes**  
  - Type: Code (JavaScript)  
  - Role: Perform custom data transformations, parsing, or aggregation logic not covered by standard nodes.  
  - Configuration: Custom code snippets acting on input data.  
  - Connections: Often follow Google Drive or Set nodes; output to Convert to File or Merge nodes.  
  - Failures: Syntax errors, runtime exceptions, invalid input data.

- **Convert to File nodes**  
  - Type: Convert to File  
  - Role: Converts JSON or other data formats into files for storage or further processing.  
  - Connections: Typically lead to Google Drive nodes to upload generated files.  
  - Failures: Conversion errors, unsupported data formats.

- **Merge nodes**  
  - Type: Merge  
  - Role: Combine multiple data streams into one for unified processing or output.  
  - Configuration: Default merge operations.  
  - Connections: Merge outputs feed into Wait nodes or storage nodes.  
  - Failures: Data mismatch, empty inputs.

- **Loop Over Items**  
  - Type: Split In Batches  
  - Role: Iterates over array items to process them individually or in batches.  
  - Connections: Often used for vector store updates or file downloads.  
  - Failures: Large batch size causing timeouts.

---

#### 2.3 Content Classification and Routing

**Overview:**  
This logic block uses AI text classifiers to categorize incoming data and route it to appropriate processing branches.

**Nodes Involved:**  
- Text Classifier  
- Operation Classifier  
- If, If1, If2, If3, If5  
- Switch, Switch1  
- JSON PARSER (Join)

**Node Details:**

- **Text Classifier**  
  - Type: LangChain textClassifier  
  - Role: Classifies input text (e.g., email content) into categories like Daily Sales, Address, customer_info, etc.  
  - Connections: Routes outputs to corresponding Set nodes (Daily Sales, Address, customer_info).  
  - Failures: Classification inaccuracies, model API errors.

- **Operation Classifier**  
  - Type: LangChain textClassifier  
  - Role: Further classifies operations or tasks based on input data.  
  - Connections: Routes to JSON PARSER (Join), OpenAI nodes, or Drive Folders URL1.  
  - Failures: Same as Text Classifier.

- **If and Switch nodes**  
  - Type: Conditional nodes  
  - Role: Route data based on classification results or conditions.  
  - Configuration: Conditions based on data fields or classification labels.  
  - Connections: Branch to different processing paths or data updates.  
  - Failures: Condition expression errors.

- **JSON PARSER (Join)**  
  - Type: Information Extractor (LangChain)  
  - Role: Extracts structured information from unstructured text using AI.  
  - Connections: Feeds into Switch1 for further routing.  
  - Failures: Parsing failures, unexpected input format.

---

#### 2.4 AI Processing and Agent Execution

**Overview:**  
This block performs AI-driven processing using OpenAI chat models, LangChain agents, and associated tools to analyze data, perform calculations, and generate intelligent responses.

**Nodes Involved:**  
- OpenAI Chat Model1, OpenAI Chat Model3, OpenAI Chat Model4, OpenAI Chat Model7  
- OpenAI, OpenAI1  
- MIS Agent1 (LangChain Agent)  
- Calculator (LangChain Tool)  
- Postgres (LangChain Tool)  
- Simple Memory1 (LangChain Memory Buffer)  
- Call n8n Workflow Tool1 (LangChain Tool invoking sub-workflows)  

**Node Details:**

- **OpenAI Chat Model Nodes**  
  - Type: LangChain lmChatOpenAi  
  - Role: Use OpenAI’s chat API to process natural language queries, generate summaries, or interpret data.  
  - Configuration: Different nodes may have different prompt templates and parameters.  
  - Connections: Feed into classifiers, parsers, or agents.  
  - Failures: API rate limits, authentication errors, prompt failures.

- **OpenAI Nodes**  
  - Type: LangChain openAi  
  - Role: Similar to chat models, but may be used for specific tasks like text completion or classification.  
  - Failures: Same as above.

- **MIS Agent1**  
  - Type: LangChain agent  
  - Role: Central AI agent that integrates tools like Calculator and Postgres to answer queries intelligently.  
  - Configuration: Connected to memory buffer and AI tools for context-aware processing.  
  - Connections: Receives chat input, queries tools, produces output.  
  - Failures: Tool invocation failure, context loss, timeout.

- **Calculator and Postgres Tools**  
  - Type: LangChain tools  
  - Role: Calculator performs numerical computations; Postgres tool queries a PostgreSQL database for data retrieval or updates.  
  - Failures: Tool errors, database connection issues.

- **Simple Memory1**  
  - Type: LangChain memoryBufferWindow  
  - Role: Maintains conversation history or context for the MIS Agent.  
  - Failures: Memory overflow or context truncation.

- **Call n8n Workflow Tool1**  
  - Type: LangChain toolWorkflow  
  - Role: Invokes other n8n workflows as part of AI toolchain for modular processing.  
  - Failures: Sub-workflow invocation errors.

---

#### 2.5 Data Storage and Update

**Overview:**  
This block updates data sources such as Google Sheets and PostgreSQL with processed results, ensuring data synchronization.

**Nodes Involved:**  
- Google Sheets (multiple instances)  
- Postgres2  
- Edit Fields series (Edit Fields8, Edit Fields9, Edit Fields11, Edit Fields12, Edit Fields13, Edit Fields14, Edit Fields15)  

**Node Details:**

- **Google Sheets nodes**  
  - Role: Insert or update rows in Google Sheets for reports or data logs.  
  - Failures: Permissions, incorrect ranges.

- **Postgres2**  
  - Type: PostgreSQL node  
  - Role: Executes SQL queries to update or insert data in PostgreSQL database.  
  - Failures: SQL errors, connection issues.

- **Edit Fields nodes**  
  - Role: Prepare and format data before storage, adding necessary metadata or transformations.  
  - Failures: Expression errors, missing data.

---

#### 2.6 Vector Store Management

**Overview:**  
Manages document embeddings using Pinecone vector database for semantic search capabilities, enabling retrieval of relevant knowledge base documents.

**Nodes Involved:**  
- Pinecone Vector Store  
- Embeddings OpenAI  
- Default Data Loader  
- Recursive Character Text Splitter  
- Knowledge_base  
- Download files  
- Loop Over Items

**Node Details:**

- **Pinecone Vector Store**  
  - Type: LangChain vectorStorePinecone  
  - Role: Stores and indexes vector embeddings for fast semantic retrieval.  
  - Connections: Receives embeddings from Embeddings OpenAI; interacts with Loop Over Items.  
  - Failures: Pinecone API errors, connectivity.

- **Embeddings OpenAI**  
  - Type: LangChain embeddingsOpenAi  
  - Role: Generates embeddings from text data for vector store insertion.  
  - Failures: API errors.

- **Default Data Loader**  
  - Role: Loads default documents for indexing.  
  - Connections: Feeds Recursive Character Text Splitter.  
  - Failures: Data load errors.

- **Recursive Character Text Splitter**  
  - Role: Splits large documents into manageable chunks for embedding.  
  - Failures: Split errors on unusual input.

- **Knowledge_base & Download files**  
  - Role: Google Drive nodes to fetch documents for embedding.  
  - Failures: Permissions, missing files.

- **Loop Over Items**  
  - Iterates through documents or chunks for embedding and insertion.

---

#### 2.7 Orchestration and Merging

**Overview:**  
Coordinates multiple parallel processes, merges data, and manages workflow state transitions.

**Nodes Involved:**  
- Merge  
- Merge2  
- Wait  
- Wait1  
- Switch  
- Switch1

**Node Details:**

- **Merge and Merge2**  
  - Combine data from parallel branches for unified processing.  
  - Failures: Empty inputs.

- **Wait and Wait1**  
  - Introduce delays or wait for external events (e.g., webhook completions).  
  - Failures: Timeout if events do not occur.

- **Switch and Switch1**  
  - Route data conditionally among multiple branches.  
  - Failures: Condition misconfigurations.

---

### 3. Summary Table

| Node Name                  | Node Type                                   | Functional Role                                   | Input Node(s)                         | Output Node(s)                        | Sticky Note                                   |
|----------------------------|---------------------------------------------|--------------------------------------------------|--------------------------------------|-------------------------------------|-----------------------------------------------|
| Gmail Trigger              | Gmail Trigger                               | Trigger on new emails                             |                                      | Gmail                               |                                               |
| Gmail                     | Gmail                                       | Fetches email content                             | Gmail Trigger                       | Text Classifier                     |                                               |
| Schedule Trigger           | Schedule Trigger                            | Triggers workflow on schedule                     |                                      | Drive Folders URL                   |                                               |
| Google Drive Trigger       | Google Drive Trigger                        | Trigger on Google Drive changes                   |                                      | Edit Fields8, Edit Fields9, ...    |                                               |
| When chat message received | LangChain Chat Trigger                      | Trigger on chat messages                           |                                      | MIS Agent1                        |                                               |
| When Executed by Another Workflow | Execute Workflow Trigger                | Trigger when called as sub-workflow               |                                      | Operation Classifier                |                                               |
| Text Classifier            | LangChain Text Classifier                   | Classify input text                               | Gmail                              | Daily Sales, Address, customer_info |                                               |
| Operation Classifier       | LangChain Text Classifier                   | Classify operation type                           | When Executed by Another Workflow  | JSON PARSER (Join), OpenAI1, ...   |                                               |
| Daily Sales                | Set                                         | Prepare daily sales data fields                   | Text Classifier                    | If1                               |                                               |
| Address                   | Set                                         | Prepare address data fields                        | Text Classifier                    | If2                               |                                               |
| customer_info             | Set                                         | Prepare customer information fields               | Text Classifier                    | If                                |                                               |
| If, If1, If2, If3, If5    | If Nodes                                    | Conditional branching                             | Various                           | Various                           |                                               |
| Switch, Switch1           | Switch Nodes                                | Conditional routing                               | Various                           | Various                           |                                               |
| Google Drive nodes (1-10) | Google Drive                                | Retrieve files/folders                            | Various                           | Various                           |                                               |
| Google Sheets nodes       | Google Sheets / Tool                        | Read/write spreadsheet data                       | Various                           | Various                           |                                               |
| Postgres2                 | PostgreSQL                                  | Database operations                              | Edit Fields8, Edit Fields9, ...    |                                  |                                               |
| Edit Fields series        | Set                                         | Data transformation and preparation               | Various                           | Various                           |                                               |
| Code nodes (1-10)         | Code (JavaScript)                           | Custom data processing                            | Various                           | Various                           |                                               |
| Convert to File nodes     | Convert To File                             | Convert data to file format                        | Code nodes                       | Google Drive nodes               |                                               |
| Merge, Merge2             | Merge                                       | Merge multiple data streams                        | Various                           | Wait, Wait1                      |                                               |
| Wait, Wait1               | Wait                                        | Delay or wait for external events                  | Merge, Merge2                    | If3                              |                                               |
| MIS Agent1                | LangChain Agent                             | AI agent for intelligent processing               | When chat message received, Postgres, Calculator |                                |                                               |
| Calculator                | LangChain Tool                              | Performs calculations                             |                                  | MIS Agent1                      |                                               |
| Postgres                  | LangChain Tool                              | Database querying tool                            |                                  | MIS Agent1                      |                                               |
| Simple Memory1            | LangChain Memory Buffer                     | Conversation/context memory                        |                                  | MIS Agent1                      |                                               |
| Call n8n Workflow Tool1   | LangChain Workflow Tool                     | Invokes other workflows                           |                                  | MIS Agent1                      |                                               |
| Pinecone Vector Store     | LangChain Vector Store                      | Stores and retrieves document embeddings          | Embeddings OpenAI                | Loop Over Items                 |                                               |
| Embeddings OpenAI         | LangChain Embeddings                        | Generates text embeddings                         | Recursive Character Text Splitter | Pinecone Vector Store           |                                               |
| Default Data Loader       | LangChain Document Loader                   | Loads default documents                           | Recursive Character Text Splitter | Pinecone Vector Store           |                                               |
| Recursive Character Text Splitter | LangChain Text Splitter                | Splits large text into smaller chunks             | Default Data Loader              | Embeddings OpenAI               |                                               |
| Knowledge_base            | Google Drive                                | Source folder for knowledge documents              |                                  | Download files                 |                                               |
| Download files            | Google Drive                                | Downloads files for processing                     | Knowledge_base                  | Loop Over Items                 |                                               |
| Loop Over Items           | Split In Batches                            | Processes items individually                        | Pinecone Vector Store, Download files | Pinecone Vector Store or downstream |                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create triggers:**
   - Add **Gmail Trigger** node with default settings, authenticate with Gmail credentials.
   - Add **Schedule Trigger** node; configure desired schedule (e.g., daily).
   - Add multiple **Google Drive Trigger** nodes; configure each to monitor specific Google Drive folders.
   - Add **When chat message received** LangChain Chat Trigger; configure webhook.
   - Add **Execute Workflow Trigger** for sub-workflow execution.

2. **Set up Gmail fetch:**
   - Add **Gmail** node connected from Gmail Trigger; configure to fetch new emails.

3. **Add AI classification nodes:**
   - Add **Text Classifier** node connected from Gmail; configure with models for content classification.
   - Add **Operation Classifier** node connected from Execute Workflow Trigger; configure for operation type classification.

4. **Create Set nodes to prepare data:**
   - Add **Daily Sales**, **Address**, and **customer_info** Set nodes connected from Text Classifier to set structured data fields.
   - Add **Drive Folders URL** and **Drive Folders URL1** Set nodes for folder URLs.
   - Create multiple **Edit Fields** nodes for data transformation throughout the flow.

5. **Add Google Drive nodes to retrieve files and folders:**
   - Configure **Google Drive1** to **Google Drive10** nodes to access specific folders/files referenced by Drive Folders URL nodes.
   - Set up error handling where needed (e.g., continue on error).

6. **Add Google Sheets nodes:**
   - Configure Google Sheets nodes for reading/writing data across the workflow with correct sheet IDs and ranges.

7. **Create If and Switch nodes:**
   - Add conditional **If** nodes for routing based on classification results.
   - Add **Switch** nodes for multi-branch routing.

8. **Add Code nodes:**
   - Insert **Code** nodes to perform necessary data processing, parsing, and aggregation. Input custom JavaScript code relevant to data structure.

9. **Add Convert to File nodes:**
   - Add nodes to convert processed data to file format before uploading to Google Drive.

10. **Add Merge and Wait nodes:**
    - Use **Merge** nodes to combine branches.
    - Use **Wait** nodes to manage timing and asynchronous events.

11. **Set up AI processing nodes:**
    - Add **OpenAI Chat Model1, 3, 4, 7** nodes; configure with OpenAI credentials and prompt templates.
    - Add **OpenAI** nodes for various completion or embedding tasks.
    - Add **MIS Agent1** LangChain agent node; configure with:
      - Tools: Calculator, Postgres, Call n8n Workflow Tool1
      - Memory: Simple Memory1
    - Add **Calculator** tool node.
    - Add **Postgres** tool node; configure PostgreSQL credentials.
    - Add **Call n8n Workflow Tool1** node to invoke sub-workflows as needed.

12. **Configure Vector Store management:**
    - Add **Knowledge_base** Google Drive node to specify document folder.
    - Add **Download files** node connected to Knowledge_base.
    - Add **Loop Over Items** node to iterate over downloaded files.
    - Add **Recursive Character Text Splitter** node.
    - Add **Default Data Loader** node.
    - Add **Embeddings OpenAI** node; configure OpenAI credentials.
    - Add **Pinecone Vector Store** node; configure Pinecone credentials.

13. **Finalize:**
    - Connect all nodes according to logical flows outlined above.
    - Configure credentials for Gmail, Google Drive, Google Sheets, OpenAI, Pinecone, and PostgreSQL.
    - Validate all expression fields and test for edge cases such as missing data, API limits, or authentication errors.
    - Deploy and monitor workflow execution.

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                                                                       |
|-------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| The workflow integrates multiple AI capabilities via LangChain and OpenAI, enabling complex MIS operations. | AI-powered MIS automation combining email, chat, database, and vector search integration.           |
| Google Drive folders URLs are set in variables for easy maintenance and reference.                | Folder URLs for Daily Sales, Address, Customer Info, and Master data stored in Drive Folders URL1.   |
| The workflow uses Pinecone vector store for semantic search capabilities on knowledge base documents. | Pinecone integration requires API keys and index setup.                                             |
| Postgres nodes require proper database credentials and SQL query knowledge for data operations.  | PostgreSQL connection details must be securely configured.                                          |
| Chat triggers and LangChain agents enable conversational AI interactions with MIS data.          | Chat integration webhook must be secured and tested for correct routing.                            |
| Error handling in Google Drive nodes often set to continue on error to avoid workflow halt.      | Helps maintain robustness on missing or inaccessible files/folders.                                |
| Several nodes rely on custom JavaScript in Code nodes for complex transformations.                | Developers must review and maintain code for data consistency and error handling.                   |
| The workflow supports execution as a sub-workflow, allowing modular integration in larger automations. | Use "When Executed by Another Workflow" trigger for chaining workflows.                             |

---

**Disclaimer:**  
The provided content is generated from an n8n automated workflow export. It complies with all current content policies and contains no illegal, offensive, or protected material. All data processed is lawful and publicly available.