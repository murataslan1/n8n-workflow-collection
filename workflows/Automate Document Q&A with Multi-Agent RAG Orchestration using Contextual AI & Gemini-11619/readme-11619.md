Automate Document Q&A with Multi-Agent RAG Orchestration using Contextual AI & Gemini

https://n8nworkflows.xyz/workflows/automate-document-q-a-with-multi-agent-rag-orchestration-using-contextual-ai---gemini-11619


# Automate Document Q&A with Multi-Agent RAG Orchestration using Contextual AI & Gemini

### 1. Workflow Overview

This workflow, titled **Automate Document Q&A with Multi-Agent RAG Orchestration using Contextual AI & Gemini**, is designed to automate the creation, management, and querying of multiple Retrieval-Augmented Generation (RAG) AI agents. It targets use cases where users want to create AI agents tailored to specific document datastores (e.g., support knowledge base, research documents) and query them dynamically via a conversational interface. The workflow orchestrates multi-agent querying by selecting the most relevant agent for a user query and returning grounded responses using Contextual AI tools integrated with Google Gemini 2.5 Flash LLM.

The workflow is logically divided into two main blocks:

- **1.1 Agent Creation and Document Ingestion**: Handles user input for new agent creation, document uploads, agent instantiation, and asynchronous monitoring of document ingestion status.

- **1.2 Query Handling and Agent Orchestration**: Manages incoming user queries, dynamically selects the best matching agent, and generates contextual answers using a multi-agent orchestration approach with LLM support.

---

### 2. Block-by-Block Analysis

#### 1.1 Agent Creation and Document Ingestion

**Overview:**  
This block enables users to create new AI agents by submitting a form with agent details and documents. It processes the uploaded files, creates the agent in Contextual AI, and monitors the ingestion status of uploaded documents asynchronously until completion.

**Nodes Involved:**  
- Submit Agent Information  
- Preprocessing Step  
- Create Agent  
- Split Out  
- Iterate over each files  
- Wait  
- Get Document Ingestion Status  
- If

**Node Details:**

- **Submit Agent Information**  
  - Type: Form Trigger  
  - Role: Entry point for user input to create a new AI agent with metadata and files.  
  - Configuration: Collects agent name, description, datastore name, and document files (.pdf, .docx, .doc, .ppt). Required fields enforce mandatory inputs.  
  - Input: User HTTP form submission  
  - Output: JSON with form data and binary files  
  - Edge Cases: Missing required fields, unsupported file types, large file uploads causing timeouts.

- **Preprocessing Step**  
  - Type: Code Node  
  - Role: Extracts binary keys from uploaded files for later processing.  
  - Configuration: JavaScript snippet collects all binary keys and returns them as a comma-separated string in `binaryKeys`.  
  - Input: Form submission data with binary files  
  - Output: JSON containing `binaryKeys` and original binary data  
  - Edge Cases: No files uploaded, binary keys extraction fails due to unexpected input structure.

- **Create Agent**  
  - Type: Contextual AI Node (Contextual AI API)  
  - Role: Creates a new AI agent on Contextual AI platform using submitted form data.  
  - Configuration: Uses expressions to map form fields to agentName, datastoreName, agentDescription, and binaryPropertyName (file keys).  
  - Credentials: Contextual AI API key required  
  - Input: Output of preprocessing step (agent metadata and files)  
  - Output: JSON with agent creation response containing datastore IDs  
  - Edge Cases: API authentication failure, invalid input data, file upload errors, Contextual AI service downtime.

- **Split Out**  
  - Type: Split Out  
  - Role: Splits the array of uploaded files to individually process each.  
  - Input: Output of Create Agent node containing uploaded files array  
  - Output: Each file as separate item  
  - Edge Cases: Empty file array, malformed input data.

- **Iterate over each files**  
  - Type: Split In Batches  
  - Role: Processes files one at a time to check ingestion status asynchronously.  
  - Input: Output of Split Out node  
  - Output: Batch items for downstream processing  
  - Edge Cases: Empty batches, failure in batch handling.

- **Wait**  
  - Type: Wait  
  - Role: Delays execution by 30 seconds before re-checking ingestion status, enabling polling.  
  - Input: After processing each file batch  
  - Output: Trigger for next ingestion status check  
  - Edge Cases: Timeout if ingestion never completes, user impatience.

- **Get Document Ingestion Status**  
  - Type: Contextual AI Node (Datastore operation)  
  - Role: Retrieves ingestion metadata for a document using documentId and datastoreId obtained from Create Agent output.  
  - Credentials: Contextual AI API key  
  - Input: Document ID from current file item, datastore ID from created agent  
  - Output: JSON with ingestion status (e.g., "completed")  
  - Edge Cases: API errors, document ID mismatches, network issues.

- **If**  
  - Type: Conditional  
  - Role: Checks if ingestion status equals "completed".  
  - Input: Output of Get Document Ingestion Status  
  - Output: Branches into either continuing iteration or waiting before retry  
  - Edge Cases: Status missing or unexpected, JSON parsing errors.

---

#### 1.2 Query Handling and Agent Orchestration

**Overview:**  
This block handles incoming user queries, orchestrates multi-agent selection using Contextual AI tools, and generates response messages grounded in stored data using Google Gemini LLM.

**Nodes Involved:**  
- Chat  
- Agent Orchestrator  
- Google Gemini Chat Model  
- Simple Memory  
- Query Agent Tool  
- List Agents Tool

**Node Details:**

- **Chat**  
  - Type: Langchain Chat Trigger  
  - Role: Entry point for receiving user chat queries via webhook.  
  - Input: User chat message via webhook  
  - Output: Triggers Agent Orchestrator  
  - Edge Cases: Webhook connectivity issues, malformed requests.

- **Agent Orchestrator**  
  - Type: Langchain Agent Node  
  - Role: Core logic to orchestrate which RAG agent to query based on user input and agent metadata.  
  - Configuration:  
    - System message explains usage of two Contextual AI tools: `list_agents` (to fetch agents) and `query` (to query an agent).  
    - Logic: If user provides agent name, find matching agent ID; else pick agent by intent relevance.  
    - Calls `query` tool with agent ID and user question, returning grounded response.  
  - Input: User query from Chat node  
  - Output: Final response message  
  - Linked Nodes: Receives memory from Simple Memory, uses AI tools (List Agents Tool and Query Agent Tool), and language model (Google Gemini Chat Model)  
  - Edge Cases: Agent name mismatch, empty agent list, API failures, LLM timeout.

- **Google Gemini Chat Model**  
  - Type: Langchain Google Gemini LLM  
  - Role: Language model for generating responses with advanced contextual understanding.  
  - Credentials: Google Palm API key required  
  - Input: System prompt and user query from Agent Orchestrator  
  - Output: LLM-generated text response  
  - Edge Cases: API quota limits, latency, malformed prompts.

- **Simple Memory**  
  - Type: Langchain Memory Buffer Window  
  - Role: Maintains context window of last 10 interactions to preserve conversation history.  
  - Input: Connected to Agent Orchestrator’s AI memory input  
  - Output: Provides context to Agent Orchestrator  
  - Edge Cases: Memory overflow if conversation is too long, context dilution.

- **Query Agent Tool**  
  - Type: Contextual AI Tool Node  
  - Role: Sends query to a specific Contextual AI agent identified by agent ID.  
  - Credentials: Contextual AI API key  
  - Input: Query text and agent ID from Agent Orchestrator  
  - Output: Agent’s answer to query  
  - Edge Cases: Invalid agent ID, query malformed, API errors.

- **List Agents Tool**  
  - Type: Contextual AI Tool Node  
  - Role: Lists available AI agents for selection by Agent Orchestrator.  
  - Credentials: Contextual AI API key  
  - Input: Triggered by Agent Orchestrator to fetch agent list  
  - Output: List of agent names and IDs  
  - Edge Cases: API errors, empty agent list.

---

### 3. Summary Table

| Node Name                 | Node Type                         | Functional Role                             | Input Node(s)               | Output Node(s)              | Sticky Note                                                                                              |
|---------------------------|----------------------------------|---------------------------------------------|-----------------------------|-----------------------------|--------------------------------------------------------------------------------------------------------|
| Submit Agent Information   | Form Trigger                     | Collect agent info and document uploads     |                             | Preprocessing Step           | Users submit a form to create a new RAG agent with metadata and files. Document ingestion is async.    |
| Preprocessing Step         | Code Node                       | Extracts binary file keys                    | Submit Agent Information     | Create Agent                |                                                                                                        |
| Create Agent              | Contextual AI API Node           | Creates AI agent and datastore with files   | Preprocessing Step           | Split Out                   |                                                                                                        |
| Split Out                 | Split Out                       | Splits uploaded files for individual processing | Create Agent                | Iterate over each files      |                                                                                                        |
| Iterate over each files    | Split In Batches                | Processes each file to check ingestion status | Split Out                  | (empty branch) / Wait        |                                                                                                        |
| Wait                      | Wait Node                      | Delays 30 seconds before rechecking status  | Iterate over each files      | Get Document Ingestion Status |                                                                                                        |
| Get Document Ingestion Status | Contextual AI API Node         | Retrieves ingestion status for each document | Wait                       | If                          |                                                                                                        |
| If                        | Conditional                    | Checks if ingestion status is 'completed'  | Get Document Ingestion Status | Iterate over each files / Wait |                                                                                                        |
| Chat                      | Langchain Chat Trigger          | Receives user chat queries                   |                             | Agent Orchestrator           | Users enter queries; workflow identifies the best agent and returns grounded answers.                   |
| Agent Orchestrator         | Langchain Agent Node            | Selects and queries appropriate AI agent    | Chat, Simple Memory, List Agents Tool, Query Agent Tool, Google Gemini Chat Model |                             |                                                                                                        |
| Google Gemini Chat Model   | Langchain LLM Node              | Generates response text                       | Agent Orchestrator          |                             |                                                                                                        |
| Simple Memory             | Langchain Memory Buffer Window  | Maintains conversation context               |                             | Agent Orchestrator           |                                                                                                        |
| Query Agent Tool           | Contextual AI Tool Node          | Queries a specific AI agent                   | Agent Orchestrator          |                             |                                                                                                        |
| List Agents Tool           | Contextual AI Tool Node          | Lists available AI agents                     | Agent Orchestrator          |                             |                                                                                                        |
| Sticky Note               | Sticky Note                    | Documentation and instructions                |                             |                             | # RAG Multi-Agent Orchestration with Contextual AI Query Tool and Gemini 2.5 Flash                      |
| Sticky Note1              | Sticky Note                    | Instructions for form submission & ingestion |                             |                             | Users submit a form to create a new RAG agent by providing agent info and documents. Async ingestion.  |
| Sticky Note2              | Sticky Note                    | Instructions for query and retrieval          |                             |                             | Users enter queries; workflow identifies most relevant agent and provides answers.                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Form Trigger node**  
   - Name: Submit Agent Information  
   - Purpose: Collect agent metadata and upload documents.  
   - Configure form fields:  
     - Agent Name (required, text)  
     - Agent Description (required, text)  
     - Datastore Name (required, text)  
     - Files (required, file upload, accept `.pdf`, `.docx`, `.doc`, `.ppt`)  
   - Set webhook ID or leave auto-generated.

2. **Add a Code node**  
   - Name: Preprocessing Step  
   - Purpose: Extract binary keys from uploaded files.  
   - JavaScript code:  
     ```javascript
     const item = $input.first();
     const binaries = item.binary;
     const keys = Object.keys(binaries);
     return [{ json: { binaryKeys: keys.join(', ') }, binary: binaries }];
     ```
   - Connect output from Submit Agent Information.

3. **Add Contextual AI API node**  
   - Name: Create Agent  
   - Purpose: Create new AI agent with provided metadata and files.  
   - Resource: Agent  
   - Operation: Create  
   - Parameters:  
     - Agent Name: `={{ $('Submit Agent Information').item.json['Agent Name'] }}`  
     - Datastore Name: `={{ $('Submit Agent Information').item.json['Datastore Name'] }}`  
     - Agent Description: `={{ $('Submit Agent Information').item.json['Agent Description'] }}`  
     - Binary Property Name: `={{ $json.binaryKeys }}`  
   - Attach Contextual AI API credentials with valid API key.  
   - Connect output from Preprocessing Step.

4. **Add Split Out node**  
   - Name: Split Out  
   - Purpose: Split array of uploaded files for individual processing.  
   - Field to split out: `uploaded` (or as per Create Agent output)  
   - Connect output from Create Agent.

5. **Add Split In Batches node**  
   - Name: Iterate over each files  
   - Purpose: Process each file separately to check ingestion status.  
   - Connect output from Split Out.

6. **Add Wait node**  
   - Name: Wait  
   - Purpose: Delay 30 seconds before retrying ingestion status check.  
   - Amount: 30 seconds  
   - Connect second output of Iterate over each files (failure branch) to Wait.

7. **Add Contextual AI API node**  
   - Name: Get Document Ingestion Status  
   - Resource: Datastore  
   - Operation: Get Document Metadata  
   - Document ID: `={{ $json.documentId }}` (from current batch item)  
   - Datastore ID: `={{ $('Create Agent').item.json.datastoreIds[0] }}`  
   - Attach Contextual AI API credentials.  
   - Connect output from Wait.

8. **Add If node**  
   - Name: If  
   - Condition: Check if `{{ $json.metadata.parseJson().status }}` equals `completed`.  
   - True branch connects back to Iterate over each files (to process next file or end).  
   - False branch connects back to Wait (to re-check after delay).

---

9. **Add Langchain Chat Trigger node**  
   - Name: Chat  
   - Purpose: Receive user queries via webhook.  
   - Configure webhook ID.

10. **Add Langchain Agent node**  
    - Name: Agent Orchestrator  
    - Purpose: Orchestrate multi-agent selection and query.  
    - System message:  
      ```
      You can use two Contextual AI tools: list_agents (to get agent names and IDs) and query (to ask an agent).
      For each user query:

      If an agent name is given, call list_agents, find the matching agent ID, and use it.

      If no name is given, call list_agents, pick the most relevant agent by intent.

      Call query with that agent ID and the user’s question.

      Return the response grounded in the response from query tool.
      ```
    - Connect input from Chat node.

11. **Add Langchain Google Gemini Chat Model node**  
    - Name: Google Gemini Chat Model  
    - Purpose: Generate contextual responses.  
    - Attach Google Palm API credentials (Google Gemini key).  
    - Connect output to Agent Orchestrator’s AI Language Model input.

12. **Add Langchain Memory Buffer Window node**  
    - Name: Simple Memory  
    - Purpose: Maintain last 10 message context.  
    - Configure context window length: 10  
    - Connect output to Agent Orchestrator’s AI memory input.

13. **Add Contextual AI Tool node**  
    - Name: Query Agent Tool  
    - Resource: Query  
    - Parameters: Query text and Agent ID passed dynamically from Agent Orchestrator.  
    - Attach Contextual AI API credentials.  
    - Connect output to Agent Orchestrator’s AI tool input.

14. **Add Contextual AI Tool node**  
    - Name: List Agents Tool  
    - Operation: List Agents  
    - Attach Contextual AI API credentials.  
    - Connect output to Agent Orchestrator’s AI tool input.

15. **Wire nodes as follows:**  
    - Submit Agent Information → Preprocessing Step → Create Agent → Split Out → Iterate over each files  
    - Iterate over each files (false branch) → Wait → Get Document Ingestion Status → If  
    - If (true branch) → Iterate over each files (continue)  
    - Chat → Agent Orchestrator (with inputs from Simple Memory, List Agents Tool, Query Agent Tool, Google Gemini Chat Model)  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                      | Context or Link                                                                                                                                |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| This workflow automates multi-agent RAG orchestration using Contextual AI Query Tool and Gemini 2.5 Flash to dynamically select and query the most relevant AI agent for user questions. It supports asynchronous document ingestion and contextual chat interactions.                                                                                             | Workflow description embedded in the sticky note.                                                                                            |
| To get started, create a free [Contextual AI account](https://app.contextual.ai/) and obtain your `CONTEXTUALAI_API_KEY`. Add it as an environment variable in n8n.                                                                                                                                                                                               | https://app.contextual.ai/                                                                                                                    |
| For the language model, use Google Gemini 2.5 Flash, and obtain your Gemini API key [here](https://ai.google.dev/gemini-api/docs/api-key).                                                                                                                                                                                                                        | https://ai.google.dev/gemini-api/docs/api-key                                                                                                |
| You can customize this workflow by replacing the Form Trigger with Webhook Trigger or manual inputs, swapping Gemini with other LLM providers, adjusting wait times, or fine-tuning the system prompt for orchestration logic.                                                                                                                                       | Customization notes from sticky note.                                                                                                        |
| Contextual AI API reference for agent creation and usage: [https://docs.contextual.ai/api-reference/agents/create-agent](https://docs.contextual.ai/api-reference/agents/create-agent)                                                                                                                                                                              | API documentation link                                                                                                                        |
| For feedback or support, contact feedback@contextual.ai                                                                                                                                                                                                                                                                                                          | Support email                                                                                                                                |

---

**Disclaimer:** The provided text is exclusively derived from an automated workflow created using n8n, adhering strictly to current content policies and containing no illegal, offensive, or protected elements. All processed data is legal and publicly available.