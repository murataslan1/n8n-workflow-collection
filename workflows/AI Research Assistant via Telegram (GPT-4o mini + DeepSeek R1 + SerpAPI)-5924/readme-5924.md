AI Research Assistant via Telegram (GPT-4o mini + DeepSeek R1 + SerpAPI)

https://n8nworkflows.xyz/workflows/ai-research-assistant-via-telegram--gpt-4o-mini---deepseek-r1---serpapi--5924


# AI Research Assistant via Telegram (GPT-4o mini + DeepSeek R1 + SerpAPI)

---

### 1. Workflow Overview

This workflow implements an **AI-powered research assistant accessible via Telegram**, designed to receive user queries and return concise, up-to-date, and well-structured research summaries. It targets users who seek quick, AI-enhanced answers to questions about products, technology, or general decision-making, with results sourced from live web data.

The workflow is logically divided into these functional blocks:

- **1.1 Input Reception:** Captures incoming Telegram messages from users.
- **1.2 Query Understanding and Reformulation:** Uses DeepSeek R1 AI Agent with short-term memory to clarify and structure the user’s original question.
- **1.3 Live Research and Summarization:** Employs GPT-4o mini combined with SerpAPI to perform real-time web searches and generate concise, relevant summaries based solely on retrieved data.
- **1.4 Response Delivery:** Sends the formulated answer back to the user on Telegram.

This modular design ensures high-quality input interpretation, reliable live data retrieval, and user-friendly output formatting.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block triggers the workflow when a Telegram user sends a message, extracting the message text and chat ID for downstream processing.

- **Nodes Involved:**  
  - Telegram Trigger

- **Node Details:**

  - **Telegram Trigger**  
    - *Type:* Trigger node  
    - *Role:* Starts the workflow upon receiving new Telegram messages (specifically "message" updates).  
    - *Configuration:*  
      - Listens for "message" updates from Telegram API.  
      - Uses Telegram API credentials linked to a bot created via BotFather.  
      - Extracts message text and chat information to pass downstream.  
    - *Inputs:* None (trigger)  
    - *Outputs:* JSON containing full Telegram message data, including user chat ID and message text.  
    - *Edge Cases:*  
      - Telegram API connectivity failures or invalid bot token.  
      - Messages without text (e.g., stickers, media) might require filtering or cause unexpected behavior if not handled.  
    - *Sticky Notes:* Detailed setup instructions and link to official node docs.

---

#### 1.2 Query Understanding and Reformulation

- **Overview:**  
  This block refines the user’s input question using an AI agent specialized in understanding intent and context, maintaining short-term conversational memory for multi-turn interactions.

- **Nodes Involved:**  
  - DeepSeek R1 AI Agent  
  - DeepSeek Chat Model  
  - Simple Memory

- **Node Details:**

  - **DeepSeek R1 AI Agent**  
    - *Type:* LangChain AI Agent node  
    - *Role:* Interprets and reformulates the user's original message to produce a clearer, more focused research query.  
    - *Configuration:*  
      - Text input is the Telegram message text (`{{$json.message.text}}`).  
      - System message instructs the agent to act as an intelligent assistant, clarifying user queries and maintaining context without performing actual research.  
      - Uses DeepSeek Chat Model as the language model backend.  
    - *Inputs:* Message text from Telegram Trigger.  
    - *Outputs:* Refined/clarified question text.  
    - *Edge Cases:*  
      - Failures in API connectivity or authentication with DeepSeek.  
      - Inadequate reformulation if user input is ambiguous or very short.  
    - *Sticky Notes:* Setup and usage instructions with link.

  - **DeepSeek Chat Model**  
    - *Type:* LangChain Language Model node (DeepSeek)  
    - *Role:* Provides AI language model capabilities to the DeepSeek R1 AI Agent.  
    - *Configuration:*  
      - Model set to "deepseek-reasoner."  
      - Uses DeepSeek API credentials (requires valid account and API key).  
    - *Inputs:* Receives prompt text from DeepSeek R1 AI Agent.  
    - *Outputs:* AI-generated reformulated query text.  
    - *Edge Cases:* API quota limits or authentication errors.

  - **Simple Memory**  
    - *Type:* LangChain Memory node  
    - *Role:* Maintains short-term conversational context per Telegram chat session to enable multi-turn dialogue coherence.  
    - *Configuration:*  
      - Session key derived from Telegram chat ID (`{{$json.message.chat.id}}`).  
      - Uses "customKey" session ID type, ensuring separation between different user sessions.  
    - *Inputs:* Connected to DeepSeek R1 AI Agent for memory recall and update.  
    - *Outputs:* Contextual memory data to assist AI agent's response.  
    - *Edge Cases:* Memory overflow or loss if session keys collide; memory persistence depends on n8n instance configuration.

---

#### 1.3 Live Research and Summarization

- **Overview:**  
  This block conducts live web research using the refined query, leveraging SerpAPI to retrieve real-time search data and GPT-4o mini to analyze and summarize results, ensuring answers are strictly based on retrieved information.

- **Nodes Involved:**  
  - Research AI Agent  
  - OpenAI Chat Model  
  - SerpAPI

- **Node Details:**

  - **Research AI Agent**  
    - *Type:* LangChain AI Agent node  
    - *Role:* Processes the refined query, conducts web searches via SerpAPI, and summarizes findings clearly with relevant links and images.  
    - *Configuration:*  
      - Input text is the output from DeepSeek R1 AI Agent (refined question).  
      - System message instructs the agent to rely exclusively on SerpAPI data, avoid speculation, and format results user-friendly with bullets, emojis, and direct links/images.  
      - Uses OpenAI GPT-4o mini as the underlying language model.  
      - Uses SerpAPI as an AI tool for live data retrieval.  
    - *Inputs:* Refined query text from DeepSeek R1 AI Agent and search results from SerpAPI.  
    - *Outputs:* Formatted textual summary of research results.  
    - *Edge Cases:*  
      - SerpAPI rate limits or failures.  
      - OpenAI API authentication or quota errors.  
      - No useful search results found scenario (agent replies transparently).  
    - *Sticky Notes:* Setup instructions and links included.

  - **OpenAI Chat Model**  
    - *Type:* LangChain Language Model node (OpenAI)  
    - *Role:* Provides GPT-4o mini model for natural language generation in the Research AI Agent.  
    - *Configuration:*  
      - Model set to "gpt-4o-mini".  
      - Requires OpenAI API credentials with valid API key and balance.  
    - *Inputs:* Receives prompt from Research AI Agent.  
    - *Outputs:* Generated natural language summaries.  
    - *Edge Cases:* API connectivity, authentication, or quota issues.

  - **SerpAPI**  
    - *Type:* LangChain Tool node (SerpAPI)  
    - *Role:* Retrieves live search engine results based on the refined query.  
    - *Configuration:*  
      - Uses SerpAPI API credentials (valid key required).  
      - No additional options configured, defaults used.  
    - *Inputs:* Query text from Research AI Agent.  
    - *Outputs:* Structured search results (titles, snippets, prices, images, links).  
    - *Edge Cases:* API quota exceeded, network errors, or invalid API keys.

---

#### 1.4 Response Delivery

- **Overview:**  
  Sends the final AI-generated research summary back to the Telegram user in the original chat.

- **Nodes Involved:**  
  - Send a text message

- **Node Details:**

  - **Send a text message**  
    - *Type:* Telegram node (message operation)  
    - *Role:* Delivers the AI response message back to the user on Telegram.  
    - *Configuration:*  
      - Resource: Message  
      - Operation: Send Message  
      - Chat ID extracted dynamically from Telegram Trigger's original message (`{{$json["message"]["chat"]["id"]}}`).  
      - Text content set from the output of the Research AI Agent node.  
      - Uses the same Telegram bot credentials as the trigger node for authentication.  
      - Attribution disabled to keep message clean.  
    - *Inputs:* Final summary text from Research AI Agent.  
    - *Outputs:* Confirmation of sent message (not used downstream).  
    - *Edge Cases:* Telegram API errors, invalid chat ID, or network issues.  
    - *Sticky Notes:* Setup details and official documentation link.

---

### 3. Summary Table

| Node Name             | Node Type                               | Functional Role                          | Input Node(s)             | Output Node(s)            | Sticky Note                                                                                                            |
|-----------------------|---------------------------------------|----------------------------------------|---------------------------|---------------------------|------------------------------------------------------------------------------------------------------------------------|
| Telegram Trigger      | n8n-nodes-base.telegramTrigger         | Input reception from Telegram users    | —                         | DeepSeek R1 AI Agent      | Starts workflow on Telegram message; setup via BotFather; extracts message text and chat ID. [Node docs](https://docs.n8n.io/integrations/builtin/trigger-nodes/n8n-nodes-base.telegramtrigger/?utm_source=n8n_app&utm_medium=node_settings_modal-credential_link&utm_campaign=n8n-nodes-base.telegramTrigger) |
| DeepSeek R1 AI Agent  | @n8n/n8n-nodes-langchain.agent         | Query understanding and reformulation | Telegram Trigger          | Research AI Agent         | Reformulates user question using DeepSeek R1; relies on Simple Memory for context. [Node docs](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/?utm_source=n8n_app&utm_medium=node_settings_modal-credential_link&utm_campaign=%40n8n%2Fn8n-nodes-langchain.agent) |
| DeepSeek Chat Model   | @n8n/n8n-nodes-langchain.lmChatDeepSeek| Language model backend for DeepSeek    | DeepSeek R1 AI Agent      | DeepSeek R1 AI Agent      | DeepSeek API model "deepseek-reasoner" for query reformulation.                                                        |
| Simple Memory         | @n8n/n8n-nodes-langchain.memoryBufferWindow | Maintains short-term conversational memory | Telegram Trigger          | DeepSeek R1 AI Agent      | Provides session-based memory keyed by chat ID.                                                                        |
| Research AI Agent     | @n8n/n8n-nodes-langchain.agent         | Live research and summarization        | DeepSeek R1 AI Agent, SerpAPI, OpenAI Chat Model | Send a text message       | Summarizes SerpAPI results using GPT-4o mini; responds with bullet points and links. [Node docs](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/?utm_source=n8n_app&utm_medium=node_settings_modal-credential_link&utm_campaign=%40n8n%2Fn8n-nodes-langchain.agent) |
| OpenAI Chat Model     | @n8n/n8n-nodes-langchain.lmChatOpenAi  | GPT-4o mini language model             | Research AI Agent         | Research AI Agent         | GPT-4o mini model from OpenAI; requires valid API key and balance.                                                     |
| SerpAPI               | @n8n/n8n-nodes-langchain.toolSerpApi   | Real-time web search data retrieval    | Research AI Agent         | Research AI Agent         | Fetches live search results; requires SerpAPI API key.                                                                 |
| Send a text message   | n8n-nodes-base.telegram                 | Response delivery back to Telegram user | Research AI Agent         | —                         | Sends final formatted summary; uses Telegram bot credentials; dynamic chat ID from original message. [Node docs](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.telegram/message-operations/#send-message) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Bot:**
   - Use BotFather on Telegram to create a new bot.
   - Retrieve the bot token.

2. **Add Telegram Credentials in n8n:**
   - Create Telegram API credentials in n8n using the bot token.

3. **Add "Telegram Trigger" Node:**
   - Set node type to `telegramTrigger`.
   - Configure to listen for "message" updates.
   - Assign Telegram credentials.
   - This node will start the workflow when a Telegram message is received.

4. **Add "Simple Memory" Node:**
   - Type: `@n8n/n8n-nodes-langchain.memoryBufferWindow`.
   - Set `sessionKey` to `{{$json.message.chat.id}}`.
   - Set `sessionIdType` to "customKey".
   - Purpose: maintain short-term context per user chat.

5. **Add DeepSeek Credentials:**
   - Sign up at https://platform.deepseek.com.
   - Obtain API key.
   - Add DeepSeek API credentials in n8n.

6. **Add "DeepSeek Chat Model" Node:**
   - Type: `@n8n/n8n-nodes-langchain.lmChatDeepSeek`.
   - Set model to "deepseek-reasoner".
   - Assign DeepSeek credentials.

7. **Add "DeepSeek R1 AI Agent" Node:**
   - Type: `@n8n/n8n-nodes-langchain.agent`.
   - Set `text` input to `{{$json.message.text}}` (incoming Telegram message text).
   - Provide a system prompt instructing the agent to clarify and reformulate queries without conducting live research.
   - Set `promptType` to "define".
   - Connect the "Telegram Trigger" node output to this node's main input.
   - Connect "Simple Memory" node to this node’s AI memory input.
   - Connect "DeepSeek Chat Model" node to this node’s AI language model input.

8. **Add OpenAI Credentials:**
   - Sign up at https://platform.openai.com.
   - Obtain API key with GPT-4o mini access and balance.
   - Add OpenAI API credentials in n8n.

9. **Add "OpenAI Chat Model" Node:**
   - Type: `@n8n/n8n-nodes-langchain.lmChatOpenAi`.
   - Set model to "gpt-4o-mini".
   - Assign OpenAI credentials.

10. **Add SerpAPI Credentials:**
    - Sign up at https://serpapi.com.
    - Obtain API key.
    - Add SerpAPI credentials in n8n.

11. **Add "SerpAPI" Node:**
    - Type: `@n8n/n8n-nodes-langchain.toolSerpApi`.
    - Assign SerpAPI credentials.

12. **Add "Research AI Agent" Node:**
    - Type: `@n8n/n8n-nodes-langchain.agent`.
    - Set `text` input to `{{$json.output}}` (output from DeepSeek R1 AI Agent).
    - Provide a system message instructing to use only SerpAPI results for answering, summarizing top results with links and images, no speculation.
    - Set `promptType` to "define".
    - Connect "DeepSeek R1 AI Agent" node output to this node's main input.
    - Connect "OpenAI Chat Model" node to this node’s AI language model input.
    - Connect "SerpAPI" node to this node’s AI tool input.

13. **Add "Send a text message" Node:**
    - Type: `telegram`.
    - Resource: Message.
    - Operation: Send Message.
    - Set `Chat ID` to `{{$json["message"]["chat"]["id"]}}` (from Telegram Trigger).
    - Set `Text` to the output of the Research AI Agent node (`{{$json.output}}`).
    - Assign Telegram credentials.
    - Connect Research AI Agent node output to this node.

14. **Connect the Workflow:**
    - Telegram Trigger → DeepSeek R1 AI Agent (main input)
    - Simple Memory → DeepSeek R1 AI Agent (AI memory input)
    - DeepSeek Chat Model → DeepSeek R1 AI Agent (AI language model input)
    - DeepSeek R1 AI Agent → Research AI Agent (main input)
    - OpenAI Chat Model → Research AI Agent (AI language model input)
    - SerpAPI → Research AI Agent (AI tool input)
    - Research AI Agent → Send a text message (main input)

15. **Test the Workflow:**
    - Ensure n8n instance is publicly accessible for Telegram webhook.
    - Send a test message to your Telegram bot.
    - Verify that the bot replies with a researched, summarized response.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                         | Context or Link                                                                                                                      |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| This workflow is designed for users seeking AI-powered research summaries via Telegram, ideal for frequent questions on products, technology, or decision-making with answers sourced in real time from the web.                                                                                                                                                                                                                                      | Overview from main sticky note                                                                                                     |
| Telegram Trigger setup requires creating a bot via BotFather and adding the token to n8n credentials. It extracts the user message and chat ID for processing.                                                                                                                                                                                                                                                                                      | [Telegram Trigger node docs](https://docs.n8n.io/integrations/builtin/trigger-nodes/n8n-nodes-base.telegramtrigger/?utm_source=n8n_app&utm_medium=node_settings_modal-credential_link&utm_campaign=n8n-nodes-base.telegramTrigger) |
| DeepSeek R1 Agent uses AI with short-term memory to clarify user questions before live research. DeepSeek is a paid service requiring an API key and credits.                                                                                                                                                                                                                                                                                      | [AI Agent node docs](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/?utm_source=n8n_app&utm_medium=node_settings_modal-credential_link&utm_campaign=%40n8n%2Fn8n-nodes-langchain.agent) |
| Research AI Agent relies exclusively on live SerpAPI data combined with GPT-4o mini for summarization, never generating unsupported content.                                                                                                                                                                                                                                                                                                         | Same as above                                                                                                                      |
| Send Telegram Message node uses the same bot credentials to deliver answers, pulling chat ID dynamically from original messages.                                                                                                                                                                                                                                                                                                                   | [Telegram Send Message node docs](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.telegram/message-operations/#send-message) |

---

**Disclaimer:**  
The provided text and workflow are generated exclusively from an automated n8n workflow designed with legal and publicly available data. It complies with content policies and contains no illegal, offensive, or protected content.

---