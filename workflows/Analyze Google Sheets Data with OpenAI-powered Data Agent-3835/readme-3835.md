Analyze Google Sheets Data with OpenAI-powered Data Agent

https://n8nworkflows.xyz/workflows/analyze-google-sheets-data-with-openai-powered-data-agent-3835


# Analyze Google Sheets Data with OpenAI-powered Data Agent

### 1. Workflow Overview

This workflow, titled **"Analyze Google Sheets Data with OpenAI-powered Data Agent"**, implements an interactive AI assistant named **Ozki**, designed to analyze data from Google Sheets and provide insightful analysis including key performance indicators (KPIs). The workflow is tailored for users who want to leverage AI to extract meaningful insights from spreadsheet data without manual data processing.

**Target Use Cases:**  
- Business users seeking automated data analysis from Google Sheets.  
- Analysts requiring quick KPI extraction and trend analysis from sales or telemetry data.  
- Teams wanting conversational interaction with their data via chat.

**Logical Blocks:**  
- **1.1 Input Reception:** Captures user chat messages initiating interaction.  
- **1.2 Agent Initialization and Setup Validation:** Guides user through setup checks including memory and Google Sheets credentials.  
- **1.3 Data Retrieval:** Fetches the Google Sheets data based on user-provided URL.  
- **1.4 AI Processing and Memory:** Processes user input and data with OpenAI, maintaining conversational context via memory.  
- **1.5 User Interaction and Output:** Returns analysis results and instructions back to the user.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block listens for incoming chat messages from the user to trigger the workflow.

- **Nodes Involved:**  
  - When chat message received

- **Node Details:**  
  - **When chat message received**  
    - Type: `@n8n/n8n-nodes-langchain.chatTrigger`  
    - Role: Entry point webhook node that triggers the workflow upon receiving a chat message.  
    - Configuration: Default options, webhook ID assigned for external chat integration.  
    - Inputs: External chat message via webhook.  
    - Outputs: Passes user input to the Agent node.  
    - Edge Cases: Webhook connectivity issues, malformed chat input.  
    - Version: 1.1

---

#### 1.2 Agent Initialization and Setup Validation

- **Overview:**  
  This block runs the AI Agent that welcomes the user, checks for proper setup of memory and Google Sheets credentials, and prompts the user accordingly before proceeding.

- **Nodes Involved:**  
  - Agent  
  - Sticky Note (documentation node)

- **Node Details:**  
  - **Agent**  
    - Type: `@n8n/n8n-nodes-langchain.agent`  
    - Role: Core conversational AI agent that manages dialogue, setup validation, and analysis instructions.  
    - Configuration:  
      - Uses a defined prompt with embedded logic to:  
        - Display welcome message.  
        - Check if memory tool is connected; if not, instruct user to add Simple Memory.  
        - Check if Google Sheets credentials are configured; if not, instruct user to connect account.  
        - Once setup is complete, prompt user for Google Sheet URL and explain analysis scope (KPIs for sales or telemetry data).  
      - System message instructs agent to be friendly, concise, and hide internal instructions from user.  
    - Inputs: User chat message from "When chat message received".  
    - Outputs: Sends messages to OpenAI Model, Google Sheets tool, and Simple Memory nodes as AI language model, AI tool, and AI memory respectively.  
    - Edge Cases: Missing credentials, incomplete memory setup, invalid user inputs, prompt expression failures.  
    - Version: 1.7

  - **Sticky Note**  
    - Type: `n8n-nodes-base.stickyNote`  
    - Role: Provides detailed user instructions and configuration notes for the workflow.  
    - Content:  
      - Explains purpose of Ozki agent.  
      - Lists configuration steps for OpenAI, memory, and Google Sheets credentials.  
      - Provides user instructions to start interaction and supply Google Sheet URL.  
    - Inputs/Outputs: None (documentation only).  
    - Version: 1

---

#### 1.3 Data Retrieval

- **Overview:**  
  Retrieves data from the Google Sheet URL provided by the user for analysis.

- **Nodes Involved:**  
  - Google Sheets

- **Node Details:**  
  - **Google Sheets**  
    - Type: `n8n-nodes-base.googleSheetsTool`  
    - Role: Fetches data from a specified Google Sheet document and sheet name.  
    - Configuration:  
      - `documentId` extracted dynamically from user input URL via expression.  
      - `sheetName` dynamically set, defaulting to "Sheet" or as overridden by AI.  
      - Uses OAuth2 credentials for Google Sheets access.  
    - Inputs: Receives AI tool command from Agent node.  
    - Outputs: Returns spreadsheet data to Agent node for analysis.  
    - Edge Cases: Invalid or inaccessible Google Sheet URL, permission errors, API rate limits, empty or malformed sheets.  
    - Version: 4.5

---

#### 1.4 AI Processing and Memory

- **Overview:**  
  Processes the conversation and data using OpenAI language model and maintains context with memory.

- **Nodes Involved:**  
  - OpenAI Model  
  - Simple Memory

- **Node Details:**  
  - **OpenAI Model**  
    - Type: `@n8n/n8n-nodes-langchain.lmChatOpenAi`  
    - Role: Executes chat completions using OpenAI API to generate responses and analysis.  
    - Configuration:  
      - Uses OpenAI API credentials (configured with user’s OpenAI account).  
      - No additional options specified, defaults used.  
    - Inputs: Receives prompt from Agent node as AI language model.  
    - Outputs: Returns generated text back to Agent node.  
    - Edge Cases: API quota exceeded, network timeouts, invalid API key, unexpected response format.  
    - Version: 1

  - **Simple Memory**  
    - Type: `@n8n/n8n-nodes-langchain.memoryBufferWindow`  
    - Role: Maintains conversational memory buffer to provide context continuity in the chat.  
    - Configuration: Default buffer window memory (no custom parameters).  
    - Inputs: Receives memory updates from Agent node.  
    - Outputs: Supplies memory context to Agent node.  
    - Edge Cases: Memory overflow, loss of context on restart, memory sync issues.  
    - Version: 1.3

---

#### 1.5 User Interaction and Output

- **Overview:**  
  The Agent node consolidates outputs from AI model, memory, and Google Sheets data to generate final responses and send them back to the user.

- **Nodes Involved:**  
  - Agent (same as in 1.2, acts as central hub)

- **Node Details:**  
  - **Agent** (continued)  
    - Combines data fetched from Google Sheets and AI-generated insights.  
    - Formats analysis results including KPIs, trends, comparisons, distributions, and anomalies.  
    - Handles user follow-up requests such as detailed reports.  
    - Sends final messages back through the chat interface.  
    - Edge Cases: Misinterpretation of data, incomplete data sets, user requests outside scope, failure to parse Google Sheets data.

---

### 3. Summary Table

| Node Name               | Node Type                                    | Functional Role                        | Input Node(s)              | Output Node(s)                | Sticky Note                                                                                               |
|-------------------------|----------------------------------------------|-------------------------------------|----------------------------|------------------------------|-----------------------------------------------------------------------------------------------------------|
| When chat message received | @n8n/n8n-nodes-langchain.chatTrigger        | Entry point for chat input           | (Webhook external)          | Agent                        |                                                                                                           |
| Sticky Note             | n8n-nodes-base.stickyNote                     | Documentation and user instructions  | None                       | None                         | Welcome to Ozki Your Data Analyst Agent V1. Instructions on setup, usage, and configuration.              |
| Agent                   | @n8n/n8n-nodes-langchain.agent                | Conversational AI agent, setup check, analysis | When chat message received | OpenAI Model, Google Sheets, Simple Memory |                                                                                                           |
| OpenAI Model            | @n8n/n8n-nodes-langchain.lmChatOpenAi         | Executes OpenAI chat completions     | Agent                      | Agent                        |                                                                                                           |
| Simple Memory           | @n8n/n8n-nodes-langchain.memoryBufferWindow   | Maintains conversation memory       | Agent                      | Agent                        |                                                                                                           |
| Google Sheets           | n8n-nodes-base.googleSheetsTool                | Retrieves data from Google Sheets    | Agent                      | Agent                        |                                                                                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Trigger Node:**  
   - Add a **When chat message received** node (`@n8n/n8n-nodes-langchain.chatTrigger`).  
   - Configure webhook with default options to receive chat messages.

2. **Add the Agent Node:**  
   - Add an **Agent** node (`@n8n/n8n-nodes-langchain.agent`).  
   - Connect output of "When chat message received" to input of Agent.  
   - Configure Agent with:  
     - Prompt text containing:  
       - Welcome message.  
       - Setup validation logic for memory and Google Sheets credentials using expressions referencing `$agentInfo`.  
       - Instructions for user to provide Google Sheet URL.  
       - Analysis description including KPIs for sales and telemetry data.  
     - System message instructing friendly tone and hiding internal instructions.  
     - Set `promptType` to `define`.  
     - Disable `executeOnce` and `retryOnFail` for continuous interaction.

3. **Add OpenAI Model Node:**  
   - Add **OpenAI Model** node (`@n8n/n8n-nodes-langchain.lmChatOpenAi`).  
   - Connect Agent node's AI language model output to OpenAI Model input.  
   - Configure credentials with your OpenAI API key or select n8n free OpenAI credits.

4. **Add Simple Memory Node:**  
   - Add **Simple Memory** node (`@n8n/n8n-nodes-langchain.memoryBufferWindow`).  
   - Connect Agent node's AI memory output to Simple Memory input.  
   - No additional parameters needed (default buffer window memory).  

5. **Add Google Sheets Node:**  
   - Add **Google Sheets** node (`n8n-nodes-base.googleSheetsTool`).  
   - Connect Agent node's AI tool output to Google Sheets input.  
   - Configure:  
     - `documentId` parameter set to extract from user input URL dynamically (expression mode: URL).  
     - `sheetName` parameter default to "Sheet" or dynamically set by AI.  
   - Configure Google Sheets OAuth2 credentials with your Google account authorized to access the relevant sheets.

6. **Connect Outputs Back to Agent:**  
   - Connect outputs of OpenAI Model, Simple Memory, and Google Sheets nodes back to the Agent node on their respective input channels (`ai_languageModel`, `ai_memory`, `ai_tool`) to enable the agent to use these services.

7. **Add Sticky Note (Optional):**  
   - Add a **Sticky Note** node for documentation inside the workflow.  
   - Paste the welcome and configuration instructions for user reference.

8. **Activate Workflow:**  
   - Save and activate the workflow.  
   - Ensure all credentials are properly configured and authorized.  
   - Test by sending "Hi" via the chat interface to start interaction.

---

### 5. General Notes & Resources

| Note Content                                                                                                              | Context or Link                                                                                      |
|---------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| The agent uses a friendly conversational style to guide users through setup and analysis.                                  | Workflow design principle                                                                            |
| KPIs are dynamically chosen based on the nature of the data (sales or telemetry).                                          | Embedded in Agent prompt logic                                                                      |
| Setup requires configuring OpenAI credentials and Google Sheets OAuth2 credentials in n8n.                                 | n8n credential management                                                                           |
| Memory tool must be connected as "Simple Memory" for conversational context.                                              | Agent setup instructions                                                                            |
| For detailed analysis, user can request a "detailed report" in conversation.                                               | Agent prompt instructions                                                                           |
| Google Sheets document ID is extracted from the URL provided by the user dynamically via expressions.                      | Google Sheets node configuration                                                                    |
| Workflow is inactive by default; activate after credential setup.                                                          | Workflow settings                                                                                   |
| For more information on n8n AI Agents and LangChain integration, visit: https://n8n.io/integrations/n8n-nodes-langchain | External resource                                                                                   |

---

This completes the comprehensive reference documentation for the **"Analyze Google Sheets Data with OpenAI-powered Data Agent"** workflow.