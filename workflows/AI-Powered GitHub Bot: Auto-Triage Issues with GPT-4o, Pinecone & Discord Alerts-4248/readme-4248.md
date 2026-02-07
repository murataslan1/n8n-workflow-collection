AI-Powered GitHub Bot: Auto-Triage Issues with GPT-4o, Pinecone & Discord Alerts

https://n8nworkflows.xyz/workflows/ai-powered-github-bot--auto-triage-issues-with-gpt-4o--pinecone---discord-alerts-4248


# AI-Powered GitHub Bot: Auto-Triage Issues with GPT-4o, Pinecone & Discord Alerts

### 1. Workflow Overview

This workflow automates the triage of GitHub issues using advanced AI capabilities powered by GPT-4o, Pinecone vector databases, and Discord alert integration (implied by the title). It is designed to receive GitHub issues via webhook, analyze and classify them intelligently based on code and documentation context, and respond accordingly, streamlining issue management in software projects. The logical structure is divided into these blocks:

- **1.1 Input Reception:** Receives GitHub issue data through a webhook and prepares it for processing.
- **1.2 Contextual Embedding & Vector Search:** Generates embeddings for the issue text and queries Pinecone vector stores containing code and documentation vectors to retrieve relevant context.
- **1.3 AI Processing and Triage:** Uses Langchain agents with OpenAI GPT-4o to analyze the issue with retrieved context and generate triage hints or classifications.
- **1.4 Response Delivery:** Sends the AI-generated triage response back to the webhook caller (likely GitHub or an integration endpoint).
- **1.5 Configuration and Notes:** Nodes for setting parameters and informational sticky notes guiding customization.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:** Captures incoming GitHub issue data via a webhook to trigger the workflow and kick off processing.
- **Nodes Involved:** Webhook, CHANGE THESE!!!, These too if you want
- **Node Details:**
  
  - **Webhook**
    - Type: Webhook trigger node
    - Role: Receives HTTP POST requests containing GitHub issue events.
    - Configuration: Uses a unique webhook ID; no special parameters configured.
    - Inputs: External HTTP request from GitHub or integration.
    - Outputs: Passes data to "CHANGE THESE!!!" node.
    - Edge Cases: Missing or malformed webhook payloads; invalid HTTP methods.

  - **CHANGE THESE!!!**
    - Type: Set node
    - Role: Intended for user to customize or map incoming data fields (placeholder name).
    - Configuration: Empty by default; user expected to define variables or set data fields.
    - Inputs: Data from Webhook node.
    - Outputs: Passes modified data to "These too if you want" node.
    - Edge Cases: If not configured properly, downstream nodes may receive incomplete or wrong data.

  - **These too if you want**
    - Type: Set node
    - Role: Additional optional data transformations or settings.
    - Configuration: Empty by default; for user customization.
    - Inputs: From "CHANGE THESE!!!"
    - Outputs: Passes data to "Github Issue Hints" node.
    - Edge Cases: Same as above, depends on user customization.

#### 1.2 Contextual Embedding & Vector Search

- **Overview:** Produces vector embeddings of the issue text and queries Pinecone vector stores to find relevant code and documentation context to assist AI analysis.
- **Nodes Involved:** Use Text Embedding 3 LARGE, Docs Vector Read, Code Vector Read
- **Node Details:**

  - **Use Text Embedding 3 LARGE**
    - Type: OpenAI embeddings node
    - Role: Generates high-dimensional text embeddings from issue content.
    - Configuration: Uses OpenAI embeddings API (likely text-embedding-3-large model).
    - Inputs: Receives issue text (direct or via previous set nodes).
    - Outputs: Embeddings sent to "Docs Vector Read" and "Code Vector Read".
    - Edge Cases: API authentication failure, rate limits, or malformed text input.

  - **Docs Vector Read**
    - Type: Pinecone vector store read node
    - Role: Searches documentation vector database with embeddings to find related docs.
    - Configuration: Connected to Pinecone index (documentation).
    - Inputs: Embeddings from "Use Text Embedding 3 LARGE".
    - Outputs: Returns relevant documentation vectors to "Github Issue Hints" AI agent.
    - Edge Cases: Pinecone connection failures, empty results.

  - **Code Vector Read**
    - Type: Pinecone vector store read node
    - Role: Searches code vector database with embeddings to find related code snippets.
    - Configuration: Connected to Pinecone index (code).
    - Inputs: Embeddings from "Use Text Embedding 3 LARGE".
    - Outputs: Returns relevant code vectors to "Github Issue Hints" AI agent.
    - Edge Cases: Same as above.

#### 1.3 AI Processing and Triage

- **Overview:** Uses Langchain agent interacting with GPT-4o to analyze the issue description enhanced with code and documentation context to generate triage hints or suggestions.
- **Nodes Involved:** 4o, 4o-mini, etc1, Github Issue Hints
- **Node Details:**

  - **4o, 4o-mini, etc1**
    - Type: OpenAI Chat Language Model node (Langchain)
    - Role: Provides GPT-4o or similar model interface for chat-based AI reasoning.
    - Configuration: No parameters shown, but typically includes model name, temperature, max tokens.
    - Inputs: Connected as AI language model input for "Github Issue Hints" node.
    - Outputs: AI-generated completions to "Github Issue Hints".
    - Edge Cases: API key authorization errors, timeouts, rate limits.

  - **Github Issue Hints**
    - Type: Langchain Agent node
    - Role: Central AI agent orchestrating prompt construction, calling vector store tools, and invoking language model to produce triage outputs.
    - Configuration: Uses AI tools "Code Vector Read" and "Docs Vector Read" and AI language model "4o, 4o-mini, etc1".
    - Inputs: Receives processed issue data from "These too if you want" node, and results from vector stores and language model.
    - Outputs: Sends triage response to "Respond to Webhook".
    - Edge Cases: Errors in chaining AI tools, missing context, or unexpected AI output formats.

#### 1.4 Response Delivery

- **Overview:** Sends the AI-generated triage result back to the originator of the webhook request.
- **Nodes Involved:** Respond to Webhook
- **Node Details:**

  - **Respond to Webhook**
    - Type: Respond to Webhook node
    - Role: Returns HTTP response to complete webhook call with triage information.
    - Configuration: Default settings.
    - Inputs: From "Github Issue Hints".
    - Outputs: None (terminal node).
    - Edge Cases: Issues with response formatting or timing out leading to webhook call failure.

#### 1.5 Configuration and Notes

- **Overview:** Placeholder nodes to guide users on what to configure or customize; includes sticky notes for documentation.
- **Nodes Involved:** Sticky Note1, Sticky Note2, Sticky Note3
- **Node Details:**

  - **Sticky Note1, Sticky Note2, Sticky Note3**
    - Type: Sticky Note
    - Role: Provide human-readable annotations or instructions.
    - Content: Empty or unspecified in the exported JSON.
    - Inputs/Outputs: None.
    - Edge Cases: None.

---

### 3. Summary Table

| Node Name               | Node Type                                 | Functional Role                       | Input Node(s)              | Output Node(s)           | Sticky Note                      |
|-------------------------|-------------------------------------------|-------------------------------------|----------------------------|--------------------------|----------------------------------|
| Webhook                 | Webhook (trigger)                         | Receives GitHub issue webhook       | External HTTP request       | CHANGE THESE!!!          |                                  |
| CHANGE THESE!!!          | Set                                       | User customization of input data    | Webhook                    | These too if you want     |                                  |
| These too if you want    | Set                                       | Additional data adjustments          | CHANGE THESE!!!            | Github Issue Hints        |                                  |
| Use Text Embedding 3 LARGE | OpenAI Embeddings                         | Generates text embeddings            | From issue text (via sets) | Docs Vector Read, Code Vector Read |                                  |
| Docs Vector Read        | Pinecone Vector Store Read                | Retrieves doc context vectors        | Use Text Embedding 3 LARGE | Github Issue Hints (ai_tool)  |                                  |
| Code Vector Read        | Pinecone Vector Store Read                | Retrieves code context vectors       | Use Text Embedding 3 LARGE | Github Issue Hints (ai_tool)  |                                  |
| 4o, 4o-mini, etc1       | OpenAI Chat Language Model (Langchain)   | Provides GPT-4o language model       | To Github Issue Hints (ai_languageModel) | Github Issue Hints (ai_languageModel) |                                  |
| Github Issue Hints      | Langchain Agent                           | AI agent orchestrating triage        | These too if you want, Docs Vector Read, Code Vector Read, 4o, 4o-mini, etc1 | Respond to Webhook         |                                  |
| Respond to Webhook      | Respond to Webhook                        | Sends triage result response         | Github Issue Hints          | None                     |                                  |
| Sticky Note1            | Sticky Note                              | Guidance / Documentation             | None                       | None                     |                                  |
| Sticky Note2            | Sticky Note                              | Guidance / Documentation             | None                       | None                     |                                  |
| Sticky Note3            | Sticky Note                              | Guidance / Documentation             | None                       | None                     |                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**
   - Type: Webhook
   - Purpose: Receive GitHub issue payloads.
   - Configure with a unique webhook path and HTTP POST method.
   - Save and activate webhook.

2. **Create Set Node Named "CHANGE THESE!!!"**
   - Type: Set
   - Purpose: Map or transform incoming webhook data to desired format for AI processing.
   - Configure fields as needed (e.g., extract issue title, body).
   - Connect Webhook node output to this node.

3. **Create Set Node Named "These too if you want"**
   - Type: Set
   - Purpose: Optional further data preparation.
   - Configure fields as necessary.
   - Connect "CHANGE THESE!!!" node output to this node.

4. **Create OpenAI Embeddings Node Named "Use Text Embedding 3 LARGE"**
   - Type: Langchain OpenAI Embeddings
   - Purpose: Generate embeddings from issue text.
   - Configure with OpenAI API credentials.
   - Set embedding model to "text-embedding-3-large" or similar.
   - Input: Connect from "These too if you want" with the textual data (issue description or title).

5. **Create Pinecone Vector Store Read Node Named "Docs Vector Read"**
   - Type: Langchain Pinecone Vector Store Read
   - Purpose: Query documentation vector database.
   - Configure Pinecone credentials and specify docs index.
   - Connect input from "Use Text Embedding 3 LARGE" embedding output.

6. **Create Pinecone Vector Store Read Node Named "Code Vector Read"**
   - Type: Langchain Pinecone Vector Store Read
   - Purpose: Query code vector database.
   - Configure Pinecone credentials and specify code index.
   - Connect input from "Use Text Embedding 3 LARGE" embedding output.

7. **Create OpenAI Chat Language Model Node Named "4o, 4o-mini, etc1"**
   - Type: Langchain OpenAI Chat LLM
   - Purpose: Generate contextual AI completions using GPT-4o.
   - Configure OpenAI credentials.
   - Set model to "gpt-4o" or preferred variant.
   - No direct input; connected as AI language model input to the agent.

8. **Create Langchain Agent Node Named "Github Issue Hints"**
   - Type: Langchain Agent
   - Purpose: Orchestrate vector store queries and language model calls to generate triage hints.
   - Configure AI tools: Connect "Docs Vector Read" and "Code Vector Read" as AI tools.
   - Configure AI language model: Connect "4o, 4o-mini, etc1".
   - Connect input from "These too if you want" node (issue data).
   - Connect AI tool inputs from vector store nodes and AI language model node.
   - Connect output to "Respond to Webhook".

9. **Create Respond to Webhook Node**
   - Type: Respond to Webhook
   - Purpose: Send back triage results as HTTP response.
   - Connect input from "Github Issue Hints".

10. **Create Sticky Notes for Documentation**
    - Add three sticky notes anywhere on the canvas.
    - Use them to document configuration tips or reminders for "CHANGE THESE!!!" and other set nodes.

11. **Credential Setup**
    - Configure OpenAI credentials for embeddings and chat LLM nodes.
    - Configure Pinecone credentials for vector store nodes.
    - Ensure webhook URL is registered with GitHub or source system.

---

### 5. General Notes & Resources

| Note Content                                                                                  | Context or Link                          |
|-----------------------------------------------------------------------------------------------|----------------------------------------|
| The workflow integrates GPT-4o, a cutting-edge OpenAI chat model, for intelligent issue triage. | AI-powered triage core                  |
| Pinecone vector stores must be pre-populated with relevant code and documentation embeddings. | Prerequisite for contextual search     |
| Webhook URL must be securely registered in GitHub repository webhook settings.                | GitHub integration                      |
| Customize the "CHANGE THESE!!!" and "These too if you want" nodes to adapt input data format.  | User configuration points               |
| See Langchain n8n node docs for advanced configuration of AI agents and vector store nodes.   | https://docs.n8n.io/integrations/ai    |

---

This comprehensive documentation enables advanced users and automation agents to understand, reproduce, and modify the AI-powered GitHub issue triage workflow effectively while anticipating integration and runtime considerations.