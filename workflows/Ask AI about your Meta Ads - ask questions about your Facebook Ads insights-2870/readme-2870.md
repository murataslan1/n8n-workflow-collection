Ask AI about your Meta Ads - ask questions about your Facebook Ads insights

https://n8nworkflows.xyz/workflows/ask-ai-about-your-meta-ads---ask-questions-about-your-facebook-ads-insights-2870


# Ask AI about your Meta Ads - ask questions about your Facebook Ads insights

### 1. Workflow Overview

This workflow enables marketing professionals to interact with an AI assistant that answers questions about their Meta (Facebook) Ads performance metrics. Users can chat via Telegram (or replace with other chat apps) to request insights such as impressions, spend, reach, conversions, CTR, CPC, and more. The AI processes user queries, fetches relevant Meta Ads data via API, performs calculations if needed, and returns answers in natural language.

The workflow is logically divided into these blocks:

- **1.1 Input Reception:** Captures user messages from Telegram or a generic chat trigger, filters by chat ID, and initializes session context.
- **1.2 AI Processing Core:** Uses LangChain AI Agent with OpenAI Chat Model, memory buffers, and tools to interpret queries, fetch Meta Ads data, and perform calculations.
- **1.3 Meta Ads Data Retrieval:** HTTP request tool configured to query Meta Ads API for metrics.
- **1.4 Memory Management:** Maintains conversational context via memory buffer windows and a memory manager node.
- **1.5 Output Delivery:** Sends AI-generated responses back to the user via Telegram.
- **1.6 Workflow Orchestration & Utilities:** Includes nodes for session ID setting, workflow triggers, and memory cleaning.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
This block listens for incoming chat messages from Telegram or a generic chat interface, filters messages by authorized chat IDs, and sets a session ID to maintain conversation context.

**Nodes Involved:**  
- Telegram Trigger  
- When chat message received  
- Filter by chat ID  
- Set sessionId  

**Node Details:**

- **Telegram Trigger**  
  - Type: Telegram Trigger  
  - Role: Listens for new Telegram messages from users.  
  - Configuration: Uses webhook with a unique webhook ID.  
  - Inputs: External Telegram messages.  
  - Outputs: Passes message data downstream.  
  - Edge Cases: Telegram API downtime, webhook misconfiguration, unauthorized chat IDs.  

- **When chat message received**  
  - Type: LangChain Chat Trigger  
  - Role: Generic chat message listener (alternative to Telegram).  
  - Configuration: Webhook enabled with unique ID.  
  - Inputs: External chat messages.  
  - Outputs: Passes message data downstream.  
  - Edge Cases: Webhook failures, message format errors.  

- **Filter by chat ID**  
  - Type: Filter  
  - Role: Filters incoming messages to allow only authorized chat IDs.  
  - Configuration: Conditions set to match allowed chat IDs (not explicitly shown).  
  - Inputs: Messages from Telegram Trigger.  
  - Outputs: Passes allowed messages; blocks others.  
  - Edge Cases: Incorrect chat ID filtering, blocking valid users.  

- **Set sessionId**  
  - Type: Set  
  - Role: Assigns a session ID to the message to track conversation context.  
  - Configuration: Likely sets sessionId based on chat/user ID or message metadata.  
  - Inputs: Filtered messages.  
  - Outputs: Passes data with sessionId to AI Agent.  
  - Edge Cases: Missing or malformed sessionId causing memory/context loss.  

---

#### 2.2 AI Processing Core

**Overview:**  
This block processes user queries using an AI Agent powered by LangChain and OpenAI Chat Model. It integrates tools for calculations and Meta Ads data retrieval, and manages conversation memory.

**Nodes Involved:**  
- AI Agent  
- OpenAI Chat Model  
- Calculator  
- Meta Ads Insights  
- Chat memory (two instances)  
- Clean Memory  
- Chat Memory Manager  

**Node Details:**

- **AI Agent**  
  - Type: LangChain Agent  
  - Role: Central AI processing node that interprets user queries, calls tools, and generates responses.  
  - Configuration: Connected to OpenAI Chat Model, Calculator, Meta Ads Insights, and memory nodes as tools and memory sources.  
  - Inputs: Session data, chat memory, tool outputs.  
  - Outputs: AI-generated responses to be sent back to user.  
  - Edge Cases: API rate limits, tool invocation failures, unexpected input formats.  

- **OpenAI Chat Model**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Provides natural language understanding and generation capabilities.  
  - Configuration: Uses OpenAI credentials (API key), default or customized model parameters.  
  - Inputs: Prompts from AI Agent.  
  - Outputs: Text completions/responses.  
  - Edge Cases: API key invalid, quota exceeded, model errors.  

- **Calculator**  
  - Type: LangChain Calculator Tool  
  - Role: Performs arithmetic or metric calculations requested by the AI.  
  - Configuration: Standard calculator tool with no extra parameters.  
  - Inputs: Calculation requests from AI Agent.  
  - Outputs: Calculation results back to AI Agent.  
  - Edge Cases: Invalid expressions, division by zero, malformed input.  

- **Meta Ads Insights**  
  - Type: LangChain HTTP Request Tool  
  - Role: Queries Meta Ads API to retrieve ad metrics based on AI requests.  
  - Configuration: HTTP request parameters (endpoint, headers, auth) set to Meta Ads API (details abstracted).  
  - Inputs: API query parameters from AI Agent.  
  - Outputs: API response data with ad metrics.  
  - Edge Cases: API authentication errors, rate limits, network timeouts, malformed queries.  

- **Chat memory (two instances)**  
  - Type: LangChain Memory Buffer Window  
  - Role: Stores recent conversation history to maintain context in AI interactions.  
  - Configuration: Buffer window size controls how many past messages are retained.  
  - Inputs: Conversation messages and AI responses.  
  - Outputs: Contextual memory passed to AI Agent and Memory Manager.  
  - Edge Cases: Memory overflow, session mismatch, data loss.  

- **Clean Memory**  
  - Type: LangChain Tool Workflow  
  - Role: Clears or resets conversation memory when needed.  
  - Configuration: Invoked by AI Agent to manage memory lifecycle.  
  - Inputs: Commands from AI Agent.  
  - Outputs: Confirmation or cleared memory state.  
  - Edge Cases: Failure to clear memory causing stale context.  

- **Chat Memory Manager**  
  - Type: LangChain Memory Manager  
  - Role: Oversees memory buffers, manages multiple sessions, and ensures coherent context.  
  - Configuration: Connected downstream of memory buffers and workflow triggers.  
  - Inputs: Memory data and session info.  
  - Outputs: Managed memory state to AI Agent or other nodes.  
  - Edge Cases: Session collisions, memory corruption.  

---

#### 2.3 Meta Ads Data Retrieval

**Overview:**  
This block is responsible for fetching real-time or aggregated Meta Ads metrics via HTTP requests to the Meta Ads API, triggered by AI Agent tool calls.

**Nodes Involved:**  
- Meta Ads Insights  

**Node Details:**

- **Meta Ads Insights**  
  - (Described above in AI Processing Core)  
  - Key role here is to interface with Meta Ads API endpoints to retrieve metrics like impressions, spend, reach, conversions, CTR, CPC, etc.  
  - Requires valid Meta Ads API credentials and proper query parameters.  
  - Potential failures include API authentication errors, quota limits, or malformed requests.  

---

#### 2.4 Memory Management

**Overview:**  
Maintains conversational context across user interactions by buffering chat history and managing session-specific memory.

**Nodes Involved:**  
- Chat memory (two instances)  
- Chat Memory Manager  
- Clean Memory  

**Node Details:**  
(As described in AI Processing Core)  

---

#### 2.5 Output Delivery

**Overview:**  
Sends the AI-generated response messages back to the user via Telegram.

**Nodes Involved:**  
- Send message  

**Node Details:**

- **Send message**  
  - Type: Telegram  
  - Role: Sends text messages to Telegram users.  
  - Configuration: Uses Telegram credentials (bot token), targets chat ID from session data.  
  - Inputs: AI Agent output messages.  
  - Outputs: Messages delivered to Telegram chat.  
  - Edge Cases: Telegram API errors, invalid chat ID, message formatting issues.  

---

#### 2.6 Workflow Orchestration & Utilities

**Overview:**  
Includes nodes that facilitate workflow execution, session handling, and integration with other workflows.

**Nodes Involved:**  
- When Executed by Another Workflow  
- Set sessionId (also part of Input Reception)  

**Node Details:**

- **When Executed by Another Workflow**  
  - Type: Execute Workflow Trigger  
  - Role: Allows this workflow to be triggered by other workflows for memory management or other purposes.  
  - Configuration: Standard execute workflow trigger node.  
  - Inputs: External workflow calls.  
  - Outputs: Passes data to Chat Memory Manager.  
  - Edge Cases: Workflow invocation errors, parameter mismatches.  

- **Set sessionId**  
  - (Described above)  

---

### 3. Summary Table

| Node Name                  | Node Type                          | Functional Role                          | Input Node(s)                 | Output Node(s)               | Sticky Note                            |
|----------------------------|----------------------------------|----------------------------------------|------------------------------|-----------------------------|--------------------------------------|
| Telegram Trigger            | Telegram Trigger                 | Receives Telegram messages              | External                     | Filter by chat ID            |                                      |
| When chat message received | LangChain Chat Trigger           | Receives generic chat messages          | External                     | Set sessionId                |                                      |
| Filter by chat ID           | Filter                          | Filters messages by authorized chat ID | Telegram Trigger             | Set sessionId                |                                      |
| Set sessionId               | Set                             | Assigns session ID for context          | Filter by chat ID, When chat message received | AI Agent                   |                                      |
| AI Agent                   | LangChain Agent                 | Core AI processing and orchestration    | Set sessionId, Calculator, Meta Ads Insights, Chat memory | Send message                |                                      |
| OpenAI Chat Model           | LangChain OpenAI Chat Model     | Provides NLP capabilities                | AI Agent                     | AI Agent                    |                                      |
| Calculator                 | LangChain Calculator Tool        | Performs calculations                    | AI Agent                     | AI Agent                    |                                      |
| Meta Ads Insights           | LangChain HTTP Request Tool     | Fetches Meta Ads metrics via API        | AI Agent                     | AI Agent                    |                                      |
| Chat memory (first instance)| LangChain Memory Buffer Window  | Stores recent conversation context      | AI Agent                     | Chat Memory Manager         |                                      |
| Chat Memory Manager         | LangChain Memory Manager        | Manages conversation memory             | Chat memory, When Executed by Another Workflow | AI Agent                    |                                      |
| Chat memory (second instance)| LangChain Memory Buffer Window  | Stores conversation context              | AI Agent                     | Chat Memory Manager         |                                      |
| Clean Memory               | LangChain Tool Workflow          | Clears conversation memory               | AI Agent                     | AI Agent                    |                                      |
| Send message               | Telegram                        | Sends AI responses back to Telegram     | AI Agent                     | External                    |                                      |
| When Executed by Another Workflow | Execute Workflow Trigger    | Allows external workflow invocation      | External                     | Chat Memory Manager         |                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Configure webhook with unique ID.  
   - Set credentials for Telegram Bot API.  
   - This node listens for incoming Telegram messages.

2. **Create LangChain Chat Trigger Node**  
   - Type: LangChain Chat Trigger  
   - Configure webhook with unique ID.  
   - Allows generic chat message reception (alternative to Telegram).

3. **Create Filter Node ("Filter by chat ID")**  
   - Type: Filter  
   - Set condition to allow only authorized Telegram chat IDs.  
   - Connect Telegram Trigger output to this node.

4. **Create Set Node ("Set sessionId")**  
   - Type: Set  
   - Configure to assign a sessionId based on incoming message metadata (e.g., chat ID).  
   - Connect outputs of Filter by chat ID and When chat message received nodes to this node.

5. **Create OpenAI Chat Model Node**  
   - Type: LangChain OpenAI Chat Model  
   - Configure with OpenAI API credentials (API key).  
   - Use default or custom model parameters as needed.

6. **Create Calculator Node**  
   - Type: LangChain Calculator Tool  
   - No special configuration needed.

7. **Create Meta Ads Insights Node**  
   - Type: LangChain HTTP Request Tool  
   - Configure HTTP request to Meta Ads API endpoint.  
   - Set authentication headers with Meta Ads API credentials.  
   - Define query parameters to fetch metrics like impressions, spend, reach, conversions, CTR, CPC.

8. **Create Chat Memory Nodes (two instances)**  
   - Type: LangChain Memory Buffer Window  
   - Configure buffer window size (e.g., number of messages to retain).  
   - These nodes store recent conversation history.

9. **Create Chat Memory Manager Node**  
   - Type: LangChain Memory Manager  
   - Connect outputs of Chat memory nodes and When Executed by Another Workflow node.  
   - Manages session-specific memory.

10. **Create Clean Memory Node**  
    - Type: LangChain Tool Workflow  
    - Used by AI Agent to clear conversation memory when needed.

11. **Create AI Agent Node**  
    - Type: LangChain Agent  
    - Connect inputs:  
      - From Set sessionId (main input)  
      - From OpenAI Chat Model (ai_languageModel)  
      - From Calculator (ai_tool)  
      - From Meta Ads Insights (ai_tool)  
      - From Chat memory (ai_memory)  
      - From Clean Memory (ai_tool)  
    - Configure to orchestrate AI processing, tool usage, and memory.

12. **Create Send message Node**  
    - Type: Telegram  
    - Configure with Telegram Bot credentials.  
    - Connect AI Agent output to this node to send responses back to users.

13. **Create When Executed by Another Workflow Node**  
    - Type: Execute Workflow Trigger  
    - Connect output to Chat Memory Manager.  
    - Allows external workflows to trigger memory management.

14. **Connect nodes as per the following flow:**  
    - Telegram Trigger → Filter by chat ID → Set sessionId → AI Agent → Send message  
    - When chat message received → Set sessionId → AI Agent  
    - OpenAI Chat Model → AI Agent (ai_languageModel)  
    - Calculator → AI Agent (ai_tool)  
    - Meta Ads Insights → AI Agent (ai_tool)  
    - Chat memory (both instances) → Chat Memory Manager → AI Agent (ai_memory)  
    - Clean Memory → AI Agent (ai_tool)  
    - When Executed by Another Workflow → Chat Memory Manager  

15. **Set credentials:**  
    - Telegram Bot API credentials for Telegram Trigger and Send message nodes.  
    - OpenAI API key for OpenAI Chat Model node.  
    - Meta Ads API credentials (access token, app secret) for Meta Ads Insights HTTP Request node.

16. **Test the workflow:**  
    - Send a message via Telegram to the bot.  
    - Verify that the AI Agent processes the query, fetches Meta Ads data, performs calculations if needed, and replies correctly.  
    - Check memory context retention across multiple messages.

---

### 5. General Notes & Resources

| Note Content                                                                                  | Context or Link                                             |
|-----------------------------------------------------------------------------------------------|-------------------------------------------------------------|
| Template designed for marketing professionals to analyze Meta Ads data via AI chat assistant. | Workflow description                                        |
| Supports 85+ languages via OpenAI language model.                                            | Workflow description                                        |
| Telegram node can be replaced with WhatsApp, Slack, or Discord nodes for chat integration.   | Workflow description                                        |
| Setup instructions are embedded within the workflow nodes.                                   | Workflow description                                        |
| Creator’s other templates available at: [https://n8n.io/creators/solomon/](https://n8n.io/creators/solomon/) | External resource                                           |

---

This documentation provides a detailed, structured reference for understanding, reproducing, and modifying the "Ask AI about your Meta Ads" workflow, ensuring robustness and clarity for both human users and automation agents.