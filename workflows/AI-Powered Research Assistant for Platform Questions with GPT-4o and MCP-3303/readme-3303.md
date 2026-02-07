AI-Powered Research Assistant for Platform Questions with GPT-4o and MCP

https://n8nworkflows.xyz/workflows/ai-powered-research-assistant-for-platform-questions-with-gpt-4o-and-mcp-3303


# AI-Powered Research Assistant for Platform Questions with GPT-4o and MCP

### 1. Workflow Overview

This workflow implements an AI-powered research assistant designed to answer questions related to the n8n platform. It targets users ranging from beginners to advanced developers and teams who want quick, accurate, and context-aware responses about n8n functionalities, documentation, community discussions, and example workflows.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Captures user questions sent as chat messages.
- **1.2 AI Processing:** Uses OpenAI GPT-4o-mini to interpret the query and manage the AI agent’s reasoning.
- **1.3 Research and Tool Lookup:** Queries the Multi-Channel Platform (MCP) client tools to search n8n documentation, forums, and example workflows.
- **1.4 Tool Execution and Response Generation:** Executes the selected MCP tool with parameters derived from AI analysis to retrieve relevant information and generate a comprehensive answer.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block listens for incoming chat messages containing user questions about the n8n platform. It acts as the entry point for the workflow.

- **Nodes Involved:**  
  - When chat message received

- **Node Details:**

  - **When chat message received**  
    - Type: Chat Trigger (LangChain)  
    - Role: Listens for chat messages to trigger the workflow.  
    - Configuration: Default options; webhook ID set to receive chat messages.  
    - Expressions/Variables: None.  
    - Input: External chat message event.  
    - Output: Passes the chat message content to the AI agent node.  
    - Version: 1.1  
    - Edge Cases:  
      - Failure if webhook is not properly configured or accessible.  
      - Message format issues could cause downstream parsing errors.  
    - Sub-workflow: None.

#### 2.2 AI Processing

- **Overview:**  
  This block uses the OpenAI GPT-4o-mini model to analyze the incoming question and orchestrate the AI agent’s reasoning. It sets the system context for the AI agent to interact with the MCP tools.

- **Nodes Involved:**  
  - OpenAI Chat Model2  
  - n8n Research AI Agent

- **Node Details:**

  - **OpenAI Chat Model2**  
    - Type: OpenAI Chat Model (LangChain)  
    - Role: Provides the language model backend (GPT-4o-mini) for natural language understanding and generation.  
    - Configuration: Model set to "gpt-4o-mini" with default options.  
    - Expressions/Variables: None.  
    - Input: Receives prompt from previous nodes (in this case, connected to the AI agent).  
    - Output: Passes processed language model output to the AI agent.  
    - Version: 1.2  
    - Edge Cases:  
      - API authentication errors if credentials are invalid.  
      - Timeout or rate limiting from OpenAI API.  
      - Unexpected model output format.  
    - Credentials: OpenAI API credentials required.

  - **n8n Research AI Agent**  
    - Type: AI Agent (LangChain)  
    - Role: Acts as the central AI orchestrator that interprets user queries, interacts with MCP tools, and generates tailored responses.  
    - Configuration:  
      - System message defines the assistant’s role as integrated with the n8n MCP, instructing it to fetch tools and content relevant to n8n questions.  
      - Emphasizes clarity, actionable responses, and relevance to n8n platform queries.  
    - Expressions/Variables: Uses AI-driven expressions to dynamically select tools and generate parameters.  
    - Input: Receives chat message from trigger and language model output.  
    - Output: Sends tool lookup and execution requests to MCP client nodes.  
    - Version: 1.8  
    - Edge Cases:  
      - Failure to correctly parse or interpret user intent.  
      - Miscommunication with MCP tools if tool names or parameters are malformed.  
      - Potential infinite loops if AI agent repeatedly requests tools without resolution.  
    - Sub-workflow: None.

#### 2.3 Research and Tool Lookup

- **Overview:**  
  This block queries the MCP client tool to discover available tools and content related to the user’s question, enabling the AI agent to identify relevant resources.

- **Nodes Involved:**  
  - n8n-assistant Tool Lookup

- **Node Details:**

  - **n8n-assistant Tool Lookup**  
    - Type: MCP Client Tool (Community Node)  
    - Role: Queries the MCP server to retrieve a list of available tools and content relevant to n8n platform questions.  
    - Configuration: Uses MCP client API credentials linked to the configured MCP server URL (https://smithery.ai/server/@onurpolat05/n8n-assistant).  
    - Expressions/Variables: None explicitly configured; acts as a lookup endpoint.  
    - Input: Receives AI agent’s request for tool information.  
    - Output: Returns available tools and content metadata to the AI agent.  
    - Version: 1  
    - Edge Cases:  
      - Authentication failure if MCP credentials are invalid.  
      - Network errors connecting to MCP server.  
      - Empty or incomplete tool list if MCP server is misconfigured.  
    - Credentials: MCP client API credentials required.

#### 2.4 Tool Execution and Response Generation

- **Overview:**  
  This block executes the specific MCP tool selected by the AI agent with parameters generated dynamically, retrieving detailed information and generating the final response to the user.

- **Nodes Involved:**  
  - n8n-assistant Execute Tool

- **Node Details:**

  - **n8n-assistant Execute Tool**  
    - Type: MCP Client Tool (Community Node)  
    - Role: Executes a specific tool on the MCP server using parameters provided by the AI agent to fetch relevant data or perform actions.  
    - Configuration:  
      - Tool name is dynamically set from AI agent output (`{{$fromAI("tool","Set this specific tool name")}}`).  
      - Operation fixed to "executeTool".  
      - Tool parameters are dynamically generated JSON from AI agent output (`{{$fromAI('Tool_Parameters', ``, 'json')}}`).  
    - Expressions/Variables: Uses AI-driven expressions to dynamically set tool name and parameters.  
    - Input: Receives tool execution request from AI agent.  
    - Output: Returns execution results (e.g., search results, documentation snippets) back to the AI agent or final output node.  
    - Version: 1  
    - Edge Cases:  
      - Invalid tool name or parameters causing execution failure.  
      - MCP server errors or timeouts during tool execution.  
      - JSON parsing errors if AI-generated parameters are malformed.  
    - Credentials: MCP client API credentials required.

---

### 3. Summary Table

| Node Name                 | Node Type                         | Functional Role                         | Input Node(s)              | Output Node(s)             | Sticky Note                                                                                          |
|---------------------------|----------------------------------|---------------------------------------|----------------------------|----------------------------|----------------------------------------------------------------------------------------------------|
| When chat message received | Chat Trigger (LangChain)          | Entry point, receives user questions  | External chat message       | n8n Research AI Agent       |                                                                                                    |
| OpenAI Chat Model2         | OpenAI Chat Model (LangChain)    | Provides GPT-4o-mini language model   | n8n Research AI Agent       | n8n Research AI Agent       |                                                                                                    |
| n8n Research AI Agent      | AI Agent (LangChain)              | Orchestrates AI reasoning and tool use| When chat message received, OpenAI Chat Model2 | n8n-assistant Tool Lookup, n8n-assistant Execute Tool |                                                                                                    |
| n8n-assistant Tool Lookup  | MCP Client Tool (Community Node) | Retrieves available MCP tools/content | n8n Research AI Agent       | n8n Research AI Agent       | Requires MCP client API credentials; connects to MCP server at https://smithery.ai/server/@onurpolat05/n8n-assistant |
| n8n-assistant Execute Tool | MCP Client Tool (Community Node) | Executes specific MCP tool with params| n8n Research AI Agent       | n8n Research AI Agent       | Parameter "toolName" must be set dynamically from AI output; ensure "operation" is "executeTool"; requires MCP client API credentials |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node:**  
   - Add a **Chat Trigger** node (type: `@n8n/n8n-nodes-langchain.chatTrigger`).  
   - Configure webhook ID or default settings to receive chat messages.  
   - Position it as the workflow entry point.

2. **Add OpenAI Chat Model Node:**  
   - Add an **OpenAI Chat Model** node (type: `@n8n/n8n-nodes-langchain.lmChatOpenAi`).  
   - Set the model to `"gpt-4o-mini"`.  
   - Configure OpenAI API credentials (ensure valid API key).  
   - Connect the output of the AI Agent node to this node’s input for language model processing.

3. **Add AI Agent Node:**  
   - Add an **AI Agent** node (type: `@n8n/n8n-nodes-langchain.agent`).  
   - Configure the system message to:  
     > "You are an assistant integrated with the n8n Multi-Channel Platform (MCP). Your primary role is to interact with the MCP to retrieve available tools and content based on user queries about n8n. When a user asks for information or assistance regarding n8n, first send a request to the MCP to fetch the relevant tools and content. Analyze the retrieved data to understand the available options, then create a tailored response that addresses their specific needs regarding n8n functionalities, documentation, forum posts, or example workflows. Ensure that your responses are clear, actionable, and directly related to the user's queries about n8n."  
   - Set the node version to 1.8.  
   - Connect the **Chat Trigger** node output to this node’s input.  
   - Connect this node’s AI language model output to the **OpenAI Chat Model** node input.  
   - Connect this node’s AI tool outputs to the MCP client nodes (next steps).

4. **Add MCP Client Tool Node for Tool Lookup:**  
   - Add an **MCP Client Tool** node (community node: `n8n-nodes-mcp.mcpClientTool`).  
   - Name it "n8n-assistant Tool Lookup".  
   - Configure credentials with MCP client API credentials pointing to:  
     `https://smithery.ai/server/@onurpolat05/n8n-assistant`.  
   - No additional parameters needed for lookup.  
   - Connect the AI tool output from the AI Agent node to this node’s input.

5. **Add MCP Client Tool Node for Tool Execution:**  
   - Add another **MCP Client Tool** node (community node: `n8n-nodes-mcp.mcpClientTool`).  
   - Name it "n8n-assistant Execute Tool".  
   - Configure credentials with the same MCP client API credentials.  
   - Set parameters:  
     - `toolName`: Use expression `{{$fromAI("tool","Set this specific tool name")}}` to dynamically receive the tool name from AI agent output.  
     - `operation`: Set to `"executeTool"`.  
     - `toolParameters`: Use expression `{{$fromAI('Tool_Parameters', ``, 'json')}}` to dynamically receive JSON parameters from AI agent output.  
   - Connect the AI tool output from the AI Agent node to this node’s input.

6. **Connect Nodes:**  
   - Connect **When chat message received** → **n8n Research AI Agent** (main).  
   - Connect **n8n Research AI Agent** → **OpenAI Chat Model2** (ai_languageModel).  
   - Connect **n8n Research AI Agent** → **n8n-assistant Tool Lookup** (ai_tool).  
   - Connect **n8n Research AI Agent** → **n8n-assistant Execute Tool** (ai_tool).

7. **Credentials Setup:**  
   - Configure OpenAI API credentials with a valid API key.  
   - Configure MCP client API credentials with access to the MCP server URL above.

8. **Testing:**  
   - Deploy the workflow.  
   - Send a chat message with an n8n-related question to trigger the workflow.  
   - Verify the AI agent queries MCP tools and returns a relevant answer.

---

### 5. General Notes & Resources

| Note Content                                                                                                  | Context or Link                                                                                  |
|---------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow requires installation of the community MCP client nodes (`n8n-nodes-mcp.mcpClientTool`).          | Community nodes must be installed on self-hosted n8n instances before importing this workflow.  |
| MCP server URL for research capabilities: https://smithery.ai/server/@onurpolat05/n8n-assistant               | Used by MCP client credentials to connect and search n8n documentation, forums, and workflows. |
| The parameter in the "n8n-assistant Execute Tool" node must be set to "specific" (corrected from "spesific").  | Important for correct tool execution behavior.                                                  |
| Target users include new n8n users, experienced developers, and teams seeking efficient n8n platform support. |                                                                                                 |
| The workflow leverages GPT-4o-mini model for AI processing.                                                   | Requires valid OpenAI API credentials.                                                         |

---

This documentation provides a complete, structured reference for understanding, reproducing, and maintaining the "AI-Powered Research Assistant for Platform Questions with GPT-4o and MCP" workflow in n8n.