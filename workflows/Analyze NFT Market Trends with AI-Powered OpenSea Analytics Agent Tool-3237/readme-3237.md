Analyze NFT Market Trends with AI-Powered OpenSea Analytics Agent Tool

https://n8nworkflows.xyz/workflows/analyze-nft-market-trends-with-ai-powered-opensea-analytics-agent-tool-3237


# Analyze NFT Market Trends with AI-Powered OpenSea Analytics Agent Tool

### 1. Workflow Overview

The **OpenSea Analytics Agent Tool** is an AI-powered n8n workflow designed to provide real-time, structured insights into the NFT market by integrating OpenSea’s API with advanced AI processing (GPT-4o-mini). It targets NFT traders, collectors, and investors who require detailed analytics on NFT collections, wallet transactions, and market trends.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception**  
  Receives user queries and session data via an n8n workflow trigger node.

- **1.2 AI Processing Core**  
  Uses GPT-4o-mini as the “Analytics Agent Brain” to interpret user queries and decide which OpenSea API endpoint to call. It maintains conversation context with a memory buffer.

- **1.3 OpenSea API Integration Tools**  
  Contains multiple HTTP request nodes configured as AI tools to call specific OpenSea API endpoints:
  - Collection statistics
  - Global events
  - Events filtered by wallet address
  - Events filtered by collection slug
  - Events filtered by specific NFT (chain, contract, token ID)

- **1.4 AI Agent Orchestration**  
  The “OpenSea Analytics Agent” node acts as an AI agent that orchestrates calls to the appropriate OpenSea API tool based on the interpreted user query, ensuring API compliance and error handling.

- **1.5 Documentation and Support Notes**  
  Sticky notes provide detailed guidance, usage instructions, error handling tips, and contact information for support.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block receives incoming user queries and session identifiers to initiate the workflow.

- **Nodes Involved:**  
  - Workflow Input Trigger

- **Node Details:**  
  - **Workflow Input Trigger**  
    - Type: `executeWorkflowTrigger`  
    - Role: Entry point for the workflow, accepts inputs named `message` (user query) and `sessionId` (to track conversation context).  
    - Configuration: Expects external triggers (e.g., webhook, Telegram integration) to pass these inputs.  
    - Inputs: External trigger  
    - Outputs: Passes data to “OpenSea Analytics Agent” node  
    - Edge Cases: Missing or malformed inputs could cause downstream errors; input validation is recommended before triggering.

#### 2.2 AI Processing Core

- **Overview:**  
  This block interprets user queries using GPT-4o-mini and maintains conversational context for multi-turn interactions.

- **Nodes Involved:**  
  - Analytics Agent Brain  
  - Analytics Agent Memory

- **Node Details:**  
  - **Analytics Agent Brain**  
    - Type: `lmChatOpenAi` (OpenAI GPT-4o-mini model)  
    - Role: Processes natural language queries, interprets intent, and formulates API call parameters.  
    - Configuration: Uses GPT-4o-mini model with default options; connected to OpenAI credentials.  
    - Inputs: None directly; used as AI language model by the agent node.  
    - Outputs: Provides interpreted query data to the agent node.  
    - Edge Cases: API rate limits, model unavailability, or malformed prompts could cause failures.

  - **Analytics Agent Memory**  
    - Type: `memoryBufferWindow`  
    - Role: Stores recent conversation history to maintain context across multiple queries.  
    - Configuration: Default buffer window; no parameters set explicitly.  
    - Inputs: Conversation data from the agent node.  
    - Outputs: Context data to the agent node.  
    - Edge Cases: Memory overflow or loss could cause context loss; session management is critical.

#### 2.3 OpenSea API Integration Tools

- **Overview:**  
  This block contains multiple HTTP request nodes configured as AI tools to fetch NFT market data from OpenSea’s API endpoints.

- **Nodes Involved:**  
  - OpenSea Get Collection Stats  
  - OpenSea Get Events  
  - OpenSea Get Events by Account  
  - OpenSea Get Events by Collection  
  - OpenSea Get Events by NFT

- **Node Details:**  

  - **OpenSea Get Collection Stats**  
    - Type: `toolHttpRequest`  
    - Role: Retrieves collection-wide statistics such as floor price, volume, sales count, and market cap.  
    - Configuration:  
      - URL: `https://api.opensea.io/api/v2/collections/{collection_slug}/stats`  
      - Headers: Accept: application/json  
      - Authentication: HTTP Header Auth with OpenSea API key  
      - Parameters: `collection_slug` (dynamic)  
    - Inputs: Called by the AI agent with collection slug parameter.  
    - Outputs: JSON stats data.  
    - Edge Cases: Invalid slug returns 404; missing API key causes auth errors.

  - **OpenSea Get Events**  
    - Type: `toolHttpRequest`  
    - Role: Fetches NFT-related events globally filtered by event type, timestamps, and pagination.  
    - Configuration:  
      - URL: `https://api.opensea.io/api/v2/events`  
      - Query Parameters: event_type, after, before, limit, next (all optional)  
      - Headers: Accept: application/json  
      - Authentication: HTTP Header Auth with OpenSea API key  
    - Inputs: Called by AI agent with optional filters.  
    - Outputs: JSON list of events.  
    - Edge Cases: Invalid parameters cause 400 errors; API downtime causes 500 errors.

  - **OpenSea Get Events by Account**  
    - Type: `toolHttpRequest`  
    - Role: Retrieves NFT events related to a specific wallet address.  
    - Configuration:  
      - URL: `https://api.opensea.io/api/v2/events/accounts/{address}`  
      - Query Parameters: after, before, chain, event_type, limit, next (optional)  
      - Headers: Accept: application/json  
      - Authentication: HTTP Header Auth with OpenSea API key  
    - Inputs: Wallet address and optional filters from AI agent.  
    - Outputs: JSON list of wallet-specific events.  
    - Edge Cases: Invalid address or unsupported chain causes errors.

  - **OpenSea Get Events by Collection**  
    - Type: `toolHttpRequest`  
    - Role: Fetches events for a specific NFT collection.  
    - Configuration:  
      - URL: `https://api.opensea.io/api/v2/events/collection/{collection_slug}`  
      - Query Parameters: after, before, event_type, limit, next (optional)  
      - Headers: Accept: application/json  
      - Authentication: HTTP Header Auth with OpenSea API key  
    - Inputs: Collection slug and optional filters.  
    - Outputs: JSON event data for the collection.  
    - Edge Cases: Invalid slug or parameters cause errors.

  - **OpenSea Get Events by NFT**  
    - Type: `toolHttpRequest`  
    - Role: Retrieves historical events for a specific NFT identified by blockchain, contract address, and token ID.  
    - Configuration:  
      - URL: `https://api.opensea.io/api/v2/events/chain/{chain}/contract/{address}/nfts/{identifier}`  
      - Query Parameters: after, before, event_type, limit, next (optional)  
      - Headers: Accept: application/json  
      - Authentication: HTTP Header Auth with OpenSea API key  
    - Inputs: Chain, contract address, token ID, and optional filters.  
    - Outputs: JSON event history for the NFT.  
    - Edge Cases: Invalid chain (must use allowed list), address, or identifier causes errors.

#### 2.4 AI Agent Orchestration

- **Overview:**  
  The “OpenSea Analytics Agent” node acts as the central AI agent that receives user queries, interprets them using the AI brain and memory, and dynamically calls the appropriate OpenSea API tool nodes to fetch data.

- **Nodes Involved:**  
  - OpenSea Analytics Agent

- **Node Details:**  
  - Type: `agent` (Langchain AI Agent)  
  - Role: Orchestrates API calls based on user input, enforces API rules, and formats responses.  
  - Configuration:  
    - Input text expression: `={{ $json.message }}` (user query)  
    - System message: Detailed instructions defining the agent’s role, available tools, API endpoints, usage rules, error handling, and example queries.  
    - Tools linked: All OpenSea API HTTP request nodes and AI brain/memory nodes.  
  - Inputs: Receives user query from Workflow Input Trigger.  
  - Outputs: Returns structured analytics insights.  
  - Edge Cases:  
    - Invalid or ambiguous queries may cause incorrect API calls.  
    - API rate limits or errors propagate here.  
    - Must enforce blockchain name rules (e.g., replace “polygon” with “matic”).  
  - Version Requirements: Compatible with n8n Langchain agent v1.8+.

#### 2.5 Documentation and Support Notes

- **Overview:**  
  Sticky notes provide comprehensive documentation, usage instructions, error handling guidance, and support contact information embedded within the workflow canvas for user reference.

- **Nodes Involved:**  
  - Sticky Note  
  - Sticky Note1  
  - Sticky Note2

- **Node Details:**  
  - **Sticky Note**  
    - Content: Overview of workflow features, node functions, and API endpoint descriptions.  
    - Role: Acts as in-workflow documentation for maintainers and users.

  - **Sticky Note1**  
    - Content: Step-by-step usage instructions and example API queries.  
    - Role: Guides users on how to input data, trigger API calls, and interpret results.

  - **Sticky Note2**  
    - Content: Error codes, troubleshooting tips, and LinkedIn contact info for support.  
    - Role: Helps users resolve common issues and connect with the author.

---

### 3. Summary Table

| Node Name                   | Node Type                          | Functional Role                              | Input Node(s)           | Output Node(s)           | Sticky Note                                                                                      |
|-----------------------------|----------------------------------|----------------------------------------------|-------------------------|--------------------------|-------------------------------------------------------------------------------------------------|
| Workflow Input Trigger       | executeWorkflowTrigger            | Receives user queries and session data       | External trigger        | OpenSea Analytics Agent   | See Sticky Note1 for usage instructions                                                        |
| Analytics Agent Brain        | lmChatOpenAi                     | AI model to interpret queries (GPT-4o-mini) | None (used by agent)    | OpenSea Analytics Agent   | See Sticky Note for node functions overview                                                    |
| Analytics Agent Memory       | memoryBufferWindow               | Maintains conversation context                | None (used by agent)    | OpenSea Analytics Agent   | See Sticky Note for node functions overview                                                    |
| OpenSea Get Collection Stats| toolHttpRequest                  | Fetches NFT collection statistics             | OpenSea Analytics Agent | OpenSea Analytics Agent   | See Sticky Note for API endpoint details                                                       |
| OpenSea Get Events           | toolHttpRequest                  | Retrieves global NFT events                    | OpenSea Analytics Agent | OpenSea Analytics Agent   | See Sticky Note for API endpoint details                                                       |
| OpenSea Get Events by Account| toolHttpRequest                  | Retrieves NFT events for a wallet address     | OpenSea Analytics Agent | OpenSea Analytics Agent   | See Sticky Note for API endpoint details                                                       |
| OpenSea Get Events by Collection| toolHttpRequest               | Retrieves NFT events for a collection          | OpenSea Analytics Agent | OpenSea Analytics Agent   | See Sticky Note for API endpoint details                                                       |
| OpenSea Get Events by NFT    | toolHttpRequest                  | Retrieves historical events for a specific NFT| OpenSea Analytics Agent | OpenSea Analytics Agent   | See Sticky Note for API endpoint details                                                       |
| OpenSea Analytics Agent      | agent                           | Orchestrates AI interpretation and API calls | Workflow Input Trigger  | (Outputs structured data) | See Sticky Note for detailed system message and API usage rules                               |
| Sticky Note                 | stickyNote                      | Documentation and overview                     | None                   | None                     | Workflow overview and node functions                                                           |
| Sticky Note1                | stickyNote                      | Usage instructions and example queries        | None                   | None                     | How to use the workflow and example API calls                                                 |
| Sticky Note2                | stickyNote                      | Error handling and support info                | None                   | None                     | Error codes, troubleshooting, and LinkedIn contact                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Workflow Input Trigger Node**  
   - Type: `executeWorkflowTrigger`  
   - Configure inputs: Add two workflow inputs named `message` (string) and `sessionId` (string).  
   - Position: Starting point of the workflow.

2. **Add Analytics Agent Brain Node**  
   - Type: `lmChatOpenAi`  
   - Model: Select `gpt-4o-mini`  
   - Credentials: Connect your OpenAI API credentials.  
   - Leave options as default.

3. **Add Analytics Agent Memory Node**  
   - Type: `memoryBufferWindow`  
   - No special parameters needed; default buffer window is sufficient.

4. **Add OpenSea API HTTP Request Nodes**  
   For each of the following, create a `toolHttpRequest` node with HTTP Header Authentication using your OpenSea API key credential:

   - **OpenSea Get Collection Stats**  
     - URL: `https://api.opensea.io/api/v2/collections/{collection_slug}/stats`  
     - Headers: `Accept: application/json`  
     - Authentication: HTTP Header Auth with OpenSea API key  
     - Parameters: Path parameter `collection_slug` (dynamic)

   - **OpenSea Get Events**  
     - URL: `https://api.opensea.io/api/v2/events`  
     - Query Parameters (optional): `event_type`, `after`, `before`, `limit`, `next`  
     - Headers: `Accept: application/json`  
     - Authentication: HTTP Header Auth

   - **OpenSea Get Events by Account**  
     - URL: `https://api.opensea.io/api/v2/events/accounts/{address}`  
     - Query Parameters (optional): `after`, `before`, `chain`, `event_type`, `limit`, `next`  
     - Headers: `Accept: application/json`  
     - Authentication: HTTP Header Auth

   - **OpenSea Get Events by Collection**  
     - URL: `https://api.opensea.io/api/v2/events/collection/{collection_slug}`  
     - Query Parameters (optional): `after`, `before`, `event_type`, `limit`, `next`  
     - Headers: `Accept: application/json`  
     - Authentication: HTTP Header Auth

   - **OpenSea Get Events by NFT**  
     - URL: `https://api.opensea.io/api/v2/events/chain/{chain}/contract/{address}/nfts/{identifier}`  
     - Query Parameters (optional): `after`, `before`, `event_type`, `limit`, `next`  
     - Headers: `Accept: application/json`  
     - Authentication: HTTP Header Auth

5. **Add OpenSea Analytics Agent Node**  
   - Type: `agent` (Langchain AI Agent)  
   - Input Text: Set expression to `={{ $json.message }}` to receive user queries.  
   - System Message: Paste the detailed system message defining the agent’s role, API endpoints, usage rules, error handling, and example queries (as provided in the original workflow).  
   - Link the following tools to this agent:  
     - Analytics Agent Brain (as AI language model)  
     - Analytics Agent Memory (as AI memory)  
     - All OpenSea API HTTP request nodes (as AI tools)  
   - Connect the Workflow Input Trigger node’s main output to this agent node’s main input.

6. **Connect Nodes**  
   - Connect Workflow Input Trigger → OpenSea Analytics Agent  
   - The agent internally calls the AI brain, memory, and HTTP request nodes as tools (no explicit connections needed).  
   - Ensure all HTTP request nodes have valid OpenSea API credentials configured.

7. **Add Sticky Notes for Documentation (Optional but Recommended)**  
   - Add sticky notes with workflow overview, usage instructions, error handling, and support contact info for maintainers and users.

8. **Credential Setup**  
   - Configure OpenAI API credentials for the Analytics Agent Brain node.  
   - Configure OpenSea API key as HTTP Header Authentication credential for all HTTP request nodes.

9. **Deploy and Test**  
   - Trigger the workflow with sample queries such as:  
     - “Get stats for the Bored Ape Yacht Club collection.”  
     - “Show me all NFT sales from the last 24 hours.”  
     - “Fetch all NFT transfers for wallet 0x123...abc on Ethereum.”  
   - Verify that the AI agent correctly interprets the query, calls the appropriate API, and returns structured insights.

---

### 5. General Notes & Resources

| Note Content                                                                                                          | Context or Link                                                                                   |
|-----------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| The workflow enforces strict blockchain input rules: use `matic` instead of `polygon`. Using unsupported chains causes errors. | See system message in OpenSea Analytics Agent node for full blockchain list and rules.          |
| Example queries include retrieving collection stats, wallet transactions, and NFT event histories.                   | Provided in Sticky Note1 and system message for user guidance.                                  |
| Error codes to watch for: 200 (success), 400 (bad request), 404 (not found), 500 (server error).                      | See Sticky Note2 for troubleshooting tips.                                                      |
| For support or custom automation requests, contact Don Jayamaha on LinkedIn: http://linkedin.com/in/donjayamahajr     | Provided in Sticky Note2.                                                                        |
| OpenSea API documentation and API key signup: https://docs.opensea.io/reference/api-keys                             | Required to obtain API key and understand endpoint usage.                                       |
| The AI agent uses GPT-4o-mini model for cost-effective yet powerful natural language understanding.                   | Ensure OpenAI credentials have access to this model.                                            |

---

This comprehensive documentation enables advanced users and AI agents to understand, reproduce, and maintain the OpenSea Analytics Agent Tool workflow effectively.