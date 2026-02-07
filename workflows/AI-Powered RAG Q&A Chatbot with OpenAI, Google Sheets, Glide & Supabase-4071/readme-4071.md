AI-Powered RAG Q&A Chatbot with OpenAI, Google Sheets, Glide & Supabase

https://n8nworkflows.xyz/workflows/ai-powered-rag-q-a-chatbot-with-openai--google-sheets--glide---supabase-4071


# AI-Powered RAG Q&A Chatbot with OpenAI, Google Sheets, Glide & Supabase

### 1. Workflow Overview

This workflow implements an advanced AI-powered Retrieval-Augmented Generation (RAG) chatbot system. It integrates multiple services including OpenAI (GPT-4 and embeddings), Google Sheets, Glide frontend, Supabase (optional), and n8n automation to provide contextual question answering enriched with relevant data retrieval and optional media handling.

The workflow is structured into the following logical blocks:

- **1.1 Input Reception and Tracking:** Receives user questions from Glide frontend via webhook and logs/tracks requests.
- **1.2 Data Preparation and Vector Store Management:** Loads documents from Google Drive, processes them into embeddings, and stores or refreshes them in a Qdrant vector store.
- **1.3 Embedding and Vector Search:** Converts user queries to embeddings and retrieves relevant documents from the vector store.
- **1.4 RAG Prompting and Answer Generation:** Uses GPT-4 and LangChain nodes to generate context-aware answers based on vector search results.
- **1.5 Calendar and Appointment Handling (Optional):** Handles calendar-related queries through Google Calendar integration.
- **1.6 Response Delivery:** Sends structured answers back to Glide frontend or the requesting client.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Input Reception and Tracking

**Overview:**  
This block captures incoming user questions via webhooks, performs basic logging/tracking, and routes the requests to further processing or external API calls.

**Nodes Involved:**  
- n8n_order (Webhook)  
- API URL Tracking (HTTP Request)  
- Tracking response (Set)  
- Webhook tracking response (Respond to Webhook)

**Node Details:**

- **n8n_order**  
  - Type: Webhook  
  - Role: Entry point for receiving user questions from Glide frontend.  
  - Configuration: Listens on a fixed webhook URL (replaceable for your Glide app).  
  - Inputs: External HTTP POST from Glide app.  
  - Outputs: Passes data to API URL Tracking node.  
  - Failures: Network issues, malformed requests, or missing data could cause failure.

- **API URL Tracking**  
  - Type: HTTP Request  
  - Role: Calls an external API or logs request data (likely for analytics/tracking).  
  - Configuration: URL and method not preset; should be customized.  
  - Inputs: Receives webhook payload.  
  - Outputs: Passes results to Tracking response node.  
  - Failures: Connection errors, invalid URLs, or authorization issues.

- **Tracking response**  
  - Type: Set  
  - Role: Formats or enriches response data for the webhook reply.  
  - Inputs: From API URL Tracking.  
  - Outputs: To Webhook tracking response node.

- **Webhook tracking response**  
  - Type: Respond to Webhook  
  - Role: Sends HTTP response back to the Glide frontend confirming tracking success.  
  - Inputs: From Tracking response.  
  - Outputs: None.  
  - Failures: Timeout or connection loss during response.

---

#### 2.2 Data Preparation and Vector Store Management

**Overview:**  
Loads documents from Google Drive, processes them into embeddings, splits text tokens, and manages Qdrant vector store collections for efficient semantic search.

**Nodes Involved:**  
- When clicking ‘Test workflow’ (Manual Trigger)  
- Create collection (HTTP Request)  
- Refresh collection (HTTP Request)  
- Get folder (Google Drive)  
- Download Files (Google Drive)  
- Default Data Loader (LangChain document loader)  
- Token Splitter (LangChain text splitter)  
- Embeddings OpenAI (LangChain embeddings)  
- Qdrant Vector Store (LangChain vector store)

**Node Details:**

- **When clicking ‘Test workflow’**  
  - Type: Manual Trigger  
  - Role: Allows manual testing of data loading and vector store refresh.  
  - Inputs: None.  
  - Outputs: Triggers Create collection and Refresh collection nodes.

- **Create collection**  
  - Type: HTTP Request  
  - Role: Creates a new collection in Qdrant vector store to hold embeddings.  
  - Configuration: HTTP POST with collection details (URL and auth to be customized).  
  - Inputs: Triggered manually.  
  - Outputs: To Refresh collection.

- **Refresh collection**  
  - Type: HTTP Request  
  - Role: Refreshes or updates the collection with new or updated data.  
  - Inputs: From Create collection.  
  - Outputs: To Get folder node.

- **Get folder**  
  - Type: Google Drive  
  - Role: Retrieves the list of files in a specified Google Drive folder containing documents.  
  - Configuration: Requires Google Drive OAuth2 credentials and folder ID.  
  - Inputs: From Refresh collection.  
  - Outputs: To Download Files.

- **Download Files**  
  - Type: Google Drive  
  - Role: Downloads the documents from the folder to process content.  
  - Inputs: From Get folder.  
  - Outputs: To Default Data Loader.

- **Default Data Loader**  
  - Type: LangChain documentDefaultDataLoader  
  - Role: Loads and normalizes document content for embedding.  
  - Inputs: Raw file data.  
  - Outputs: To Qdrant Vector Store for document storage.  
  - Failures: Unsupported file types or corrupted files.

- **Token Splitter**  
  - Type: LangChain textSplitterTokenSplitter  
  - Role: Splits large texts into token-based chunks suitable for embedding.  
  - Inputs: Document content from Default Data Loader.  
  - Outputs: To Embeddings OpenAI.

- **Embeddings OpenAI**  
  - Type: LangChain embeddingsOpenAi  
  - Role: Converts text chunks into vector embeddings using OpenAI embedding model (e.g., text-embedding-ada-002).  
  - Inputs: Tokenized text.  
  - Outputs: To Qdrant Vector Store.  
  - Failures: API key issues, rate limits, or malformed text.

- **Qdrant Vector Store**  
  - Type: LangChain vectorStoreQdrant  
  - Role: Stores vectors and metadata into Qdrant for semantic search.  
  - Inputs: Embeddings from OpenAI.  
  - Outputs: None; data stored externally.  
  - Failures: Connection errors, authentication errors to Qdrant.

---

#### 2.3 Embedding and Vector Search

**Overview:**  
When a user query arrives, it is embedded and used to query the Qdrant vector store to retrieve the most relevant documents.

**Nodes Involved:**  
- n8n_rag (Webhook)  
- Embeddings OpenAI2 (LangChain embeddingsOpenAi)  
- Retrive Qdrant Vector Store (LangChain vectorStoreQdrant)  
- OpenAI Chat Model2 (LangChain lmChatOpenAi)  
- Retrive Agent (LangChain agent)  
- RAG (LangChain toolVectorStore)  
- Webhook RAG response (Respond to Webhook)

**Node Details:**

- **n8n_rag**  
  - Type: Webhook  
  - Role: Entry point for RAG queries from Glide frontend or other clients.  
  - Inputs: HTTP POST with user question.  
  - Outputs: To Embeddings OpenAI2.

- **Embeddings OpenAI2**  
  - Type: LangChain embeddingsOpenAi  
  - Role: Creates embedding vector from user question.  
  - Inputs: From n8n_rag.  
  - Outputs: To Retrive Qdrant Vector Store.

- **Retrive Qdrant Vector Store**  
  - Type: LangChain vectorStoreQdrant  
  - Role: Searches vector store using user query embeddings to retrieve top relevant documents.  
  - Inputs: From Embeddings OpenAI2.  
  - Outputs: To RAG and OpenAI Chat Model2.

- **OpenAI Chat Model2**  
  - Type: LangChain lmChatOpenAi  
  - Role: Language model node that processes retrieved documents for answer generation.  
  - Inputs: From Retrive Qdrant Vector Store.  
  - Outputs: To Retrive Agent.

- **Retrive Agent**  
  - Type: LangChain agent  
  - Role: Coordinates between vector retrieval and language model to produce final answer.  
  - Inputs: From OpenAI Chat Model2 and RAG.  
  - Outputs: To Webhook RAG response.

- **RAG**  
  - Type: LangChain toolVectorStore  
  - Role: Acts as the interface tool for vector store retrieval inside the agent.  
  - Inputs: From Retrive Qdrant Vector Store and OpenAI Chat Model1.  
  - Outputs: To Retrive Agent.

- **Webhook RAG response**  
  - Type: Respond to Webhook  
  - Role: Sends the generated answer back to the requesting frontend.  
  - Inputs: From Retrive Agent.  
  - Outputs: None.  
  - Failures: Timeout, incomplete response, or network errors.

---

#### 2.4 Calendar and Appointment Handling (Optional)

**Overview:**  
Handles queries related to calendar events or appointments by integrating Google Calendar and generating structured outputs.

**Nodes Involved:**  
- n8n_appointment (Webhook)  
- OpenAI Chat Model3 (LangChain lmChatOpenAi)  
- Concert start date (LangChain chainLlm)  
- Google Calendar (Google Calendar node)  
- Calendar response (Set)  
- Webhook calendar response (Respond to Webhook)  
- Structured Output Parser (LangChain outputParserStructured)

**Node Details:**

- **n8n_appointment**  
  - Type: Webhook  
  - Role: Receives calendar-related queries.  
  - Inputs: HTTP POST.  
  - Outputs: To OpenAI Chat Model3.

- **OpenAI Chat Model3**  
  - Type: LangChain lmChatOpenAi  
  - Role: Processes calendar queries with GPT-4.  
  - Inputs: From n8n_appointment.  
  - Outputs: To Concert start date.

- **Concert start date**  
  - Type: LangChain chainLlm  
  - Role: Extracts or calculates relevant date information via chain logic.  
  - Inputs: From OpenAI Chat Model3 and Structured Output Parser.  
  - Outputs: To Google Calendar.

- **Google Calendar**  
  - Type: Google Calendar  
  - Role: Interacts with Google Calendar API to fetch or manipulate events.  
  - Inputs: From Concert start date.  
  - Outputs: To Calendar response.

- **Calendar response**  
  - Type: Set  
  - Role: Prepares the calendar data for response.  
  - Inputs: From Google Calendar.  
  - Outputs: To Webhook calendar response.

- **Webhook calendar response**  
  - Type: Respond to Webhook  
  - Role: Sends calendar query results back to the frontend.  
  - Inputs: From Calendar response.  
  - Outputs: None.

- **Structured Output Parser**  
  - Type: LangChain outputParserStructured  
  - Role: Parses structured data from language model output for accurate date/event extraction.  
  - Inputs: From OpenAI Chat Model3.  
  - Outputs: To Concert start date.  
  - Failures: Parsing errors if GPT output is malformed.

---

#### 2.5 Ancillary and Helper Nodes

- **Sticky Note nodes**: These are used for internal comments or guidance in the workflow canvas but contain no operational logic.

---

### 3. Summary Table

| Node Name                 | Node Type                                  | Functional Role                         | Input Node(s)              | Output Node(s)                  | Sticky Note                          |
|---------------------------|--------------------------------------------|---------------------------------------|----------------------------|--------------------------------|------------------------------------|
| n8n_order                 | Webhook                                    | Receives user questions from Glide    | External HTTP request       | API URL Tracking               |                                    |
| API URL Tracking          | HTTP Request                              | External API call for tracking        | n8n_order                  | Tracking response              |                                    |
| Tracking response         | Set                                        | Formats tracking response              | API URL Tracking           | Webhook tracking response      |                                    |
| Webhook tracking response | Respond to Webhook                         | Sends tracking confirmation            | Tracking response           | None                          |                                    |
| When clicking ‘Test workflow’ | Manual Trigger                        | Manual test trigger for vector store  | None                       | Create collection, Refresh collection |                             |
| Create collection         | HTTP Request                              | Creates Qdrant collection              | When clicking ‘Test workflow’ | Refresh collection             |                                    |
| Refresh collection        | HTTP Request                              | Refreshes Qdrant collection            | Create collection           | Get folder                    |                                    |
| Get folder                | Google Drive                              | Lists files in Google Drive folder     | Refresh collection          | Download Files                |                                    |
| Download Files            | Google Drive                              | Downloads files for processing         | Get folder                  | Default Data Loader           |                                    |
| Default Data Loader       | LangChain documentDefaultDataLoader       | Loads documents for embedding          | Download Files              | Qdrant Vector Store           |                                    |
| Token Splitter            | LangChain textSplitterTokenSplitter        | Splits text into token chunks           | Default Data Loader         | Embeddings OpenAI             |                                    |
| Embeddings OpenAI         | LangChain embeddingsOpenAi                 | Creates embeddings from text            | Token Splitter              | Qdrant Vector Store           |                                    |
| Qdrant Vector Store       | LangChain vectorStoreQdrant                | Stores embeddings in vector DB          | Embeddings OpenAI           | None                         |                                    |
| n8n_rag                   | Webhook                                    | Receives RAG queries                    | External HTTP request       | Embeddings OpenAI2            |                                    |
| Embeddings OpenAI2        | LangChain embeddingsOpenAi                 | Embeds user query                       | n8n_rag                    | Retrive Qdrant Vector Store   |                                    |
| Retrive Qdrant Vector Store | LangChain vectorStoreQdrant              | Retrieves relevant vectors              | Embeddings OpenAI2          | RAG, OpenAI Chat Model2       |                                    |
| OpenAI Chat Model2        | LangChain lmChatOpenAi                      | Processes vector results via GPT-4     | Retrive Qdrant Vector Store | Retrive Agent                |                                    |
| Retrive Agent             | LangChain agent                            | Coordinates retrieval and generation    | OpenAI Chat Model2, RAG     | Webhook RAG response          |                                    |
| RAG                       | LangChain toolVectorStore                   | Vector store interface for agent       | Retrive Qdrant Vector Store, OpenAI Chat Model1 | Retrive Agent         |                                    |
| Webhook RAG response      | Respond to Webhook                         | Sends final AI-generated answer         | Retrive Agent              | None                         |                                    |
| n8n_appointment           | Webhook                                    | Receives calendar queries               | External HTTP request       | OpenAI Chat Model3            |                                    |
| OpenAI Chat Model3        | LangChain lmChatOpenAi                      | Processes calendar query                | n8n_appointment            | Concert start date            |                                    |
| Concert start date        | LangChain chainLlm                          | Extracts date info from response        | OpenAI Chat Model3, Structured Output Parser | Google Calendar        |                                    |
| Google Calendar           | Google Calendar                            | Fetches/manages calendar events         | Concert start date          | Calendar response             |                                    |
| Calendar response         | Set                                        | Formats calendar data for reply         | Google Calendar             | Webhook calendar response     |                                    |
| Webhook calendar response | Respond to Webhook                         | Sends calendar response back             | Calendar response           | None                         |                                    |
| Structured Output Parser  | LangChain outputParserStructured            | Parses structured AI output              | OpenAI Chat Model3          | Concert start date            |                                    |
| API URL Tracking          | HTTP Request                              | External API call for tracking          | n8n_order                  | Tracking response             |                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node (n8n_order):**  
   - Type: Webhook (HTTP POST)  
   - Purpose: Receive questions from Glide frontend.  
   - Configure webhook URL and parameters as per your Glide app.

2. **Add HTTP Request Node (API URL Tracking):**  
   - Type: HTTP Request  
   - Purpose: Send tracking info to external API or analytics.  
   - Configure URL, method, headers, and body as needed.

3. **Add Set Node (Tracking response):**  
   - Type: Set  
   - Purpose: Format or enrich tracking response before reply.

4. **Add Respond to Webhook Node (Webhook tracking response):**  
   - Type: Respond to Webhook  
   - Purpose: Send success response back to Glide.

5. **Setup Manual Trigger Node (When clicking ‘Test workflow’):**  
   - Type: Manual Trigger  
   - Purpose: To manually test vector store creation and refresh.

6. **Add HTTP Request Node (Create collection):**  
   - Type: HTTP Request  
   - Purpose: Create Qdrant collection.  
   - Configure with Qdrant API endpoint and credentials.

7. **Add HTTP Request Node (Refresh collection):**  
   - Type: HTTP Request  
   - Purpose: Refresh or update Qdrant collection.  
   - Connect from Create collection.

8. **Add Google Drive Node (Get folder):**  
   - Type: Google Drive  
   - Purpose: List files from a specific folder.  
   - Configure OAuth2 credentials and folder ID.

9. **Add Google Drive Node (Download Files):**  
   - Type: Google Drive  
   - Purpose: Download files listed in previous node.

10. **Add LangChain Document Loader (Default Data Loader):**  
    - Type: documentDefaultDataLoader  
    - Purpose: Load and prepare documents for embedding.

11. **Add LangChain Text Splitter (Token Splitter):**  
    - Type: textSplitterTokenSplitter  
    - Purpose: Split documents into token chunks.

12. **Add LangChain Embeddings Node (Embeddings OpenAI):**  
    - Type: embeddingsOpenAi  
    - Purpose: Generate embeddings using OpenAI model.  
    - Configure with OpenAI API key and model (e.g., text-embedding-ada-002).

13. **Add LangChain Vector Store Node (Qdrant Vector Store):**  
    - Type: vectorStoreQdrant  
    - Purpose: Store embeddings in Qdrant vector database.  
    - Configure Qdrant host, API key, and collection details.

14. **Create Webhook Node (n8n_rag):**  
    - Type: Webhook  
    - Purpose: Entry point for user question queries for RAG.

15. **Add LangChain Embeddings Node (Embeddings OpenAI2):**  
    - Type: embeddingsOpenAi  
    - Purpose: Embed user query text.

16. **Add LangChain Vector Store Node (Retrive Qdrant Vector Store):**  
    - Type: vectorStoreQdrant  
    - Purpose: Search vector store with user query embedding.

17. **Add LangChain LM Chat Node (OpenAI Chat Model2):**  
    - Type: lmChatOpenAi  
    - Purpose: Process retrieved documents with GPT-4.

18. **Add LangChain Tool Vector Store Node (RAG):**  
    - Type: toolVectorStore  
    - Purpose: Interface vector store as a tool in agent.

19. **Add LangChain Agent Node (Retrive Agent):**  
    - Type: agent  
    - Purpose: Coordinates vector retrieval and language model.  
    - Connect OpenAI Chat Model2 and RAG nodes as inputs.

20. **Add Respond to Webhook Node (Webhook RAG response):**  
    - Type: Respond to Webhook  
    - Purpose: Return generated answer to frontend.

21. **Create Webhook Node (n8n_appointment):**  
    - Type: Webhook  
    - Purpose: Entry for calendar-related queries.

22. **Add LangChain LM Chat Node (OpenAI Chat Model3):**  
    - Type: lmChatOpenAi  
    - Purpose: Process calendar queries.

23. **Add LangChain Chain LLM Node (Concert start date):**  
    - Type: chainLlm  
    - Purpose: Extract concert or appointment date.

24. **Add LangChain Output Parser (Structured Output Parser):**  
    - Type: outputParserStructured  
    - Purpose: Parse structured data from GPT output.

25. **Add Google Calendar Node:**  
    - Type: Google Calendar  
    - Purpose: Fetch and manage calendar events.  
    - Configure with Google Calendar OAuth2 credentials.

26. **Add Set Node (Calendar response):**  
    - Type: Set  
    - Purpose: Format calendar data.

27. **Add Respond to Webhook Node (Webhook calendar response):**  
    - Type: Respond to Webhook  
    - Purpose: Return calendar info to client.

28. **Optional: Add Sticky Note nodes** for documentation or reminders in n8n editor.

29. **Configure all credentials:**  
    - OpenAI API key with GPT-4 and embeddings access.  
    - Google Drive and Google Calendar OAuth2 credentials.  
    - Qdrant API key and host.  
    - Glide webhook URLs replaced with actual endpoints.

30. **Test end-to-end:**  
    - Submit questions via Glide.  
    - Verify embedding, retrieval, GPT-4 generation, and response delivery.

---

### 5. General Notes & Resources

| Note Content                                                                                                  | Context or Link                                                                                   |
|---------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Requires installation of Community Node: @n8n/n8n-nodes-openai-embeddings                                      | Node installation via n8n community packages                                                    |
| Glide frontend handles user interactions and sends webhook requests                                           | Glide app setup must match webhook URLs                                                         |
| OpenAI API key must have access to GPT-4 and text-embedding-ada-002 models                                    | Manage API keys and rate limits on OpenAI platform                                              |
| Supabase optional usage for hosting media URLs linked in Google Sheets                                        | Use Supabase S3-compatible storage for images or media referenced in answers                     |
| Google Apps Script can be used for forms and media upload handling                                           | External to this workflow but part of full system integration                                   |
| Error handling and logging recommended for production deployments                                            | Use additional nodes or external database for robust monitoring                                 |
| Rate-limiting or debouncing Glide requests advisable to prevent API overuse                                  | Can be implemented by n8n or external middleware                                                |
| Video tutorial available: https://youtu.be/SOME_VIDEO_LINK (replace with actual if provided)                  | Helpful resource for setup and debugging                                                        |

---

**Disclaimer:**  
The provided explanation and instructions derive exclusively from this automated n8n workflow. All data and operations comply strictly with current content and usage policies. No illegal or protected content is included. All credentials and endpoints must be secured and managed by the user.