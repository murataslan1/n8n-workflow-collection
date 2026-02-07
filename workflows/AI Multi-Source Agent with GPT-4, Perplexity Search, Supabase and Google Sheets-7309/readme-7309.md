AI Multi-Source Agent with GPT-4, Perplexity Search, Supabase and Google Sheets

https://n8nworkflows.xyz/workflows/ai-multi-source-agent-with-gpt-4--perplexity-search--supabase-and-google-sheets-7309


# AI Multi-Source Agent with GPT-4, Perplexity Search, Supabase and Google Sheets

### 1. Workflow Overview

This workflow is an AI multi-source conversational agent designed to receive chat messages, process them through multiple knowledge sources and AI tools, and provide enriched, context-aware responses. It integrates GPT-4 (via OpenAI chat model), Perplexity real-time web search, Supabase vectorized personal data, a custom knowledge MCP (multi-channel platform), and Google Sheets tabular data. The workflow orchestrates these various inputs to enhance the AI agent’s understanding and answer quality.

Logical blocks:

- **1.1 Input Reception**: Listens to incoming chat messages via a chat trigger.
- **1.2 Chat Memory and Language Model Setup**: Manages conversation memory and language model interaction.
- **1.3 Knowledge Source Integration**: Queries various knowledge sources (Perplexity search, Supabase vector store, Google Sheets, MCP client) and applies embeddings and reranking.
- **1.4 AI Agent Processing and Response**: Combines inputs from memory, language model, and knowledge sources to generate the final response.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
This block captures incoming chat messages from users, triggering the workflow to start processing.

**Nodes Involved:**  
- When chat message received

**Node Details:**

- **When chat message received**  
  - **Type:** Chat Trigger (webhook-based trigger)  
  - **Role:** Entry point; listens for new chat messages as webhook events.  
  - **Configuration:** Uses a webhook ID for receiving chat messages. No additional parameters set.  
  - **Inputs:** External chat system (e.g., chat UI or platform).  
  - **Outputs:** Triggers downstream nodes, specifically the AI Agent node.  
  - **Version:** 1.3  
  - **Edge cases:**  
    - Webhook connectivity issues  
    - Malformed chat message payloads  
    - Unauthorized access if webhook not secured  

---

#### 2.2 Chat Memory and Language Model Setup

**Overview:**  
Manages conversation state and invokes the OpenAI GPT-4 chat model to generate language-based responses.

**Nodes Involved:**  
- OpenAI Chat Model  
- Postgres Chat Memory  
- AI Agent

**Node Details:**

- **OpenAI Chat Model**  
  - **Type:** Language Model (LLM) Chat OpenAI  
  - **Role:** Provides chat completion capabilities using OpenAI GPT-4.  
  - **Configuration:** Default settings for GPT-4 (implied from node type).  
  - **Inputs:** Connected from AI Agent as language model input.  
  - **Outputs:** Produces AI-generated chat completions to AI Agent.  
  - **Version:** 1.2  
  - **Edge cases:**  
    - API quota exceeded  
    - Authentication failures (API key)  
    - API timeout or latency issues  

- **Postgres Chat Memory**  
  - **Type:** Memory Node (Postgres-based chat memory)  
  - **Role:** Stores and retrieves conversation history for context preservation.  
  - **Configuration:** Connected to a Postgres database; manages chat state persistence.  
  - **Inputs:** Feeds memory context to AI Agent.  
  - **Outputs:** Provides memory context for AI processing.  
  - **Version:** 1.3  
  - **Edge cases:**  
    - Database connectivity issues  
    - Data consistency or corruption  
    - Memory retrieval latency  

- **AI Agent**  
  - **Type:** LangChain Agent Node  
  - **Role:** Central orchestrator that integrates memory, language model, and external tools to formulate a response.  
  - **Configuration:** Receives inputs from chat trigger, memory, language model, and multiple AI tools.  
  - **Inputs:**  
    - Chat messages (main input)  
    - Language model output  
    - Memory context  
    - External AI tools outputs  
  - **Outputs:** Final AI response; sends output downstream or back to chat interface.  
  - **Version:** 2.2  
  - **Edge cases:**  
    - Failure in integrating multiple inputs  
    - Timeout if external tools are slow  
    - Expression or data format errors  

---

#### 2.3 Knowledge Source Integration

**Overview:**  
Aggregates information from multiple sources including a real-time web search engine, vectorized personal data, tabular data, and a multi-channel platform client. Applies embeddings and reranking to optimize retrieval relevance.

**Nodes Involved:**  
- Real time web search (Perplexity tool)  
- Vectorized personal data (Supabase vector store)  
- Tabular data (Google Sheets tool)  
- Knowledge MCP (MCP trigger)  
- MCP Client knowledge (MCP client tool)  
- Embeddings OpenAI  
- Reranker Cohere

**Node Details:**

- **Real time web search**  
  - **Type:** Perplexity Tool  
  - **Role:** Performs real-time internet search queries to fetch up-to-date information.  
  - **Configuration:** Default perplexity search parameters.  
  - **Inputs:** Triggered by Knowledge MCP node as an AI tool input.  
  - **Outputs:** Feeds search results to Knowledge MCP.  
  - **Version:** 1  
  - **Edge cases:**  
    - Search API rate limits or failures  
    - Network issues impacting live search  

- **Vectorized personal data**  
  - **Type:** Vector Store Supabase  
  - **Role:** Retrieves semantically relevant personal data using vector similarity search.  
  - **Configuration:** Supabase credentials and vector search enabled; uses embeddings and reranking.  
  - **Inputs:** Receives embeddings from Embeddings OpenAI and reranker from Reranker Cohere. Provides output to Knowledge MCP.  
  - **Outputs:** Knowledge MCP AI tool input.  
  - **Version:** 1.3  
  - **Edge cases:**  
    - Supabase connectivity or authentication errors  
    - Vector search returning no or irrelevant results  

- **Tabular data**  
  - **Type:** Google Sheets Tool  
  - **Role:** Provides access to structured data in Google Sheets.  
  - **Configuration:** Connected with appropriate Google credentials; used as a data source for Knowledge MCP.  
  - **Inputs:** Feeds data to Knowledge MCP AI tool input.  
  - **Outputs:** Knowledge MCP AI tool input.  
  - **Version:** 4.6  
  - **Edge cases:**  
    - Google Sheets API quota limits  
    - Sheet permission or sharing issues  
    - Data format inconsistencies  

- **Knowledge MCP**  
  - **Type:** MCP Trigger (custom multi-channel platform trigger)  
  - **Role:** Aggregates inputs from multiple AI tools (Perplexity, Supabase, Google Sheets) into a unified knowledge source.  
  - **Configuration:** Webhook-based trigger with ID, connected to AI tools outputs.  
  - **Inputs:** Receives AI tool results from Real time web search, Vectorized personal data, and Tabular data.  
  - **Outputs:** Feeds aggregated knowledge to MCP Client knowledge.  
  - **Version:** 2  
  - **Edge cases:**  
    - Webhook failures or delays  
    - Aggregation errors or inconsistent data  

- **MCP Client knowledge**  
  - **Type:** MCP Client Tool  
  - **Role:** Acts as a client interface to the MCP knowledge base, feeding processed knowledge to the AI Agent.  
  - **Configuration:** Standard MCP client parameters.  
  - **Inputs:** Receives knowledge from Knowledge MCP.  
  - **Outputs:** Provides AI tool input to AI Agent.  
  - **Version:** 1.1  
  - **Edge cases:**  
    - Client communication errors  
    - Data format mismatches  

- **Embeddings OpenAI**  
  - **Type:** OpenAI Embeddings Node (LangChain)  
  - **Role:** Generates vector embeddings for input data to support semantic search in Supabase vector store.  
  - **Configuration:** Uses OpenAI embedding models; no special parameters specified.  
  - **Inputs:** Feeds embeddings to Vectorized personal data node.  
  - **Outputs:** Vector embeddings output.  
  - **Version:** 1.2  
  - **Edge cases:**  
    - OpenAI API failures or limits  
    - Embedding model version mismatches  

- **Reranker Cohere**  
  - **Type:** Cohere Reranker Node (LangChain)  
  - **Role:** Reranks candidate documents or search results for relevance improvement.  
  - **Configuration:** Default reranker settings.  
  - **Inputs:** Consumes initial search or vector results; outputs reordered results to Vectorized personal data.  
  - **Outputs:** Reranked results.  
  - **Version:** 1  
  - **Edge cases:**  
    - API authentication or quota issues  
    - Reranking algorithm errors  

---

### 3. Summary Table

| Node Name               | Node Type                             | Functional Role                       | Input Node(s)                 | Output Node(s)               | Sticky Note                     |
|-------------------------|-------------------------------------|------------------------------------|------------------------------|-----------------------------|--------------------------------|
| When chat message received | Chat Trigger                       | Entry trigger for incoming messages | External chat system          | AI Agent                    |                                |
| AI Agent                 | LangChain Agent                     | Orchestrates AI reasoning and response | When chat message received, MCP Client knowledge, OpenAI Chat Model, Postgres Chat Memory | OpenAI Chat Model, AI response output |                                |
| OpenAI Chat Model        | Language Model Chat OpenAI          | Generates GPT-4 chat completions    | AI Agent (language model input) | AI Agent                   |                                |
| Postgres Chat Memory     | Memory Postgres Chat                | Manages chat conversation memory   |                              | AI Agent                    |                                |
| MCP Client knowledge     | MCP Client Tool                    | Provides aggregated knowledge input | Knowledge MCP                | AI Agent                    |                                |
| Knowledge MCP            | MCP Trigger                       | Aggregates multiple AI tool inputs  | Real time web search, Vectorized personal data, Tabular data | MCP Client knowledge       |                                |
| Real time web search     | Perplexity Tool                   | Performs live web search queries    |                              | Knowledge MCP               |                                |
| Vectorized personal data | Vector Store Supabase             | Provides vector similarity search   | Embeddings OpenAI, Reranker Cohere | Knowledge MCP            |                                |
| Embeddings OpenAI        | Embeddings OpenAI                 | Generates text embeddings           |                              | Vectorized personal data    |                                |
| Reranker Cohere          | Reranker Cohere                  | Reranks search or vector results    |                              | Vectorized personal data    |                                |
| Tabular data             | Google Sheets Tool                | Accesses structured tabular data    |                              | Knowledge MCP               |                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "When chat message received" node**  
   - Type: LangChain Chat Trigger  
   - Configure webhook with unique ID  
   - No additional parameters needed  
   - This node triggers the workflow on incoming chat messages.

2. **Create "Postgres Chat Memory" node**  
   - Type: LangChain Memory Postgres Chat  
   - Configure with Postgres credentials (host, user, password, database)  
   - Set up tables for chat memory if not existing  
   - This node manages conversation context persistence.

3. **Create "OpenAI Chat Model" node**  
   - Type: LangChain LM Chat OpenAI  
   - Configure with OpenAI API credentials (API key)  
   - Select GPT-4 model or equivalent  
   - No special parameters unless custom temperature or max tokens are desired.

4. **Create "Embeddings OpenAI" node**  
   - Type: LangChain Embeddings OpenAI  
   - Configure with OpenAI API credentials  
   - Use default embedding model (e.g., text-embedding-ada-002).

5. **Create "Reranker Cohere" node**  
   - Type: LangChain Reranker Cohere  
   - Configure with Cohere API credentials  
   - Default reranking parameters.

6. **Create "Vectorized personal data" node**  
   - Type: LangChain Vector Store Supabase  
   - Configure with Supabase credentials (URL, anon key, service role key if needed)  
   - Connect embeddings input from "Embeddings OpenAI" node  
   - Connect reranking input from "Reranker Cohere" node.

7. **Create "Tabular data" node**  
   - Type: Google Sheets Tool  
   - Configure OAuth2 credentials for Google Sheets API  
   - Provide spreadsheet ID and sheet name or range for data access.

8. **Create "Real time web search" node**  
   - Type: Perplexity Tool  
   - No special API credentials needed (or configure if required)  
   - Default search parameters.

9. **Create "Knowledge MCP" node**  
   - Type: LangChain MCP Trigger  
   - Configure webhook ID  
   - Connect AI tool inputs from: "Real time web search", "Vectorized personal data", and "Tabular data" nodes.  
   - This node aggregates knowledge from multiple sources.

10. **Create "MCP Client knowledge" node**  
    - Type: LangChain MCP Client Tool  
    - Configure with matching MCP server or service credentials  
    - Connect input from "Knowledge MCP" node  
    - Connect output to "AI Agent" node.

11. **Create "AI Agent" node**  
    - Type: LangChain Agent  
    - Configure to receive:  
      - Main input from "When chat message received"  
      - Memory from "Postgres Chat Memory"  
      - Language model from "OpenAI Chat Model"  
      - AI tools input from "MCP Client knowledge"  
    - Output connects back to chat interface or downstream processing.

12. **Connect nodes as follows:**  
    - "When chat message received" → "AI Agent" (main)  
    - "Postgres Chat Memory" → "AI Agent" (memory)  
    - "OpenAI Chat Model" → "AI Agent" (language model)  
    - "MCP Client knowledge" → "AI Agent" (AI tool)  
    - "Knowledge MCP" → "MCP Client knowledge"  
    - "Real time web search" → "Knowledge MCP" (AI tool)  
    - "Vectorized personal data" → "Knowledge MCP" (AI tool)  
    - "Tabular data" → "Knowledge MCP" (AI tool)  
    - "Embeddings OpenAI" → "Vectorized personal data" (embedding)  
    - "Reranker Cohere" → "Vectorized personal data" (reranker)

13. **Credentials Setup:**  
    - OpenAI API Key for Embeddings and Chat Model nodes  
    - Cohere API Key for Reranker node  
    - Supabase credentials for Vector Store  
    - Google OAuth2 for Google Sheets access  
    - MCP platform credentials for MCP nodes  

14. **Optional:**  
    - Add error handling and retry logic on API calls  
    - Secure webhooks with authentication tokens or IP restrictions

---

### 5. General Notes & Resources

| Note Content                                                                                            | Context or Link                                                      |
|-------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------|
| Uses multiple advanced AI integrations including GPT-4, Perplexity search, and Supabase vector stores.| Workflow purpose and architecture                                   |
| MCP (Multi-Channel Platform) nodes aggregate multi-source knowledge for enhanced AI responses.        | MCP platform custom integration                                     |
| Google Sheets is used as a structured data source alongside unstructured vector and web search data.  | Google Sheets API integration                                       |
| OpenAI GPT-4 and Cohere are leveraged for natural language understanding and reranking respectively.  | AI model and reranker usage                                         |
| Workflow is designed to be extensible with additional AI tools or data sources as needed.             | Modular design principle                                            |

---

*Disclaimer: The provided content is derived exclusively from an automated workflow created with n8n, respecting all content policies and legal frameworks. All processed data is lawful and publicly available.*