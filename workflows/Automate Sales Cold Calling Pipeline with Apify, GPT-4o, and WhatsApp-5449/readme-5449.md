Automate Sales Cold Calling Pipeline with Apify, GPT-4o, and WhatsApp

https://n8nworkflows.xyz/workflows/automate-sales-cold-calling-pipeline-with-apify--gpt-4o--and-whatsapp-5449


# Automate Sales Cold Calling Pipeline with Apify, GPT-4o, and WhatsApp

---

### 1. Workflow Overview

This workflow automates a **sales cold calling pipeline** targeting restaurant leads by integrating data scraping, enrichment, vector storage, AI-powered analysis, and communication channels. It leverages Apify for restaurant data scraping, OpenAI GPT-4o for natural language understanding and generation, Supabase for vector storage of documents and leads, Google Sheets and Google Drive for data management, and WhatsApp integration for conversational outreach.

The workflow is logically grouped into the following blocks:

- **1.1 Data Acquisition and Cleaning**  
  Automates scraping restaurant data from Google Maps via Apify, downloads and cleans data, and stores it in Google Sheets.

- **1.2 Data Vectorization and Storage**  
  Transforms cleaned restaurant lead data into embeddings using OpenAI, and inserts/updates these vectors in Supabase vector stores.

- **1.3 AI-Powered Knowledge Base and Query Handling**  
  Implements LangChain agents with access to company documents and restaurant lead knowledge bases for business intelligence and lead generation queries.

- **1.4 Chatbot Interaction and Messaging**  
  Responds to incoming chat messages (e.g., WhatsApp via WAHA trigger), processes them through AI agents with chat memory, and sends replies based on knowledge base retrieval.

- **1.5 Trigger and Orchestration Nodes**  
  Initiates workflow execution through triggers such as manual execution, Google Drive file updates, and Google Sheets changes.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Data Acquisition and Cleaning

**Overview:**  
This block scrapes restaurant data from Google Maps (via Apify), downloads files from Google Drive, cleans and formats the data, and updates a Google Sheets database with enriched restaurant lead information.

**Nodes Involved:**  
- Set Location  
- Scrape Maps  
- Get Result  
- Append Leads  
- Google Drive Trigger  
- Search File  
- Get Data  
- Loop Over Items  
- Clean Data  
- Update Data  

**Node Details:**

- **Set Location**  
  - *Type:* Set  
  - *Role:* Defines the search location parameter for scraping (default: "Bali").  
  - *Config:* Assigns a string variable `lokasi` used in subsequent API calls.  
  - *Connections:* Output → Scrape Maps  
  - *Edge Cases:* Location string must be valid; no dynamic update in current config.

- **Scrape Maps**  
  - *Type:* HTTP Request  
  - *Role:* Sends POST request to Apify to scrape Google Maps data for restaurants in the specified location.  
  - *Config:* JSON body includes parameters like `locationQuery` (from `lokasi`), search strings (["Restoran"]), and scrape options.  
  - *Connections:* Output → Get Result  
  - *Errors:* API call failures, invalid location, rate limits.

- **Get Result**  
  - *Type:* HTTP Request  
  - *Role:* Retrieves scraping results from Apify via a GET API call.  
  - *Connections:* Output → Append Leads  
  - *Errors:* Network failures, empty or invalid data.

- **Append Leads**  
  - *Type:* Google Sheets  
  - *Role:* Appends new scraped lead data into the Google Sheets Restaurant database.  
  - *Config:* Maps relevant fields such as phone, price, title, rating, address.  
  - *Connections:* Output → (Disabled HTTP Request1 node)  
  - *Credentials:* Google Sheets with service account.  
  - *Errors:* Sheet access issues, data mapping mismatches.

- **Google Drive Trigger**  
  - *Type:* Google Drive Trigger  
  - *Role:* Watches for file updates in a specific Google Drive folder.  
  - *Config:* Watches folder ID "1dh1Rr2yrhSdoSYpiR8s1yXiSWLYxpoLJ".  
  - *Connections:* Output → Search File  
  - *Credentials:* Google Drive OAuth2.  
  - *Errors:* Auth errors, permission issues.

- **Search File**  
  - *Type:* Google Drive  
  - *Role:* Lists files in the target folder.  
  - *Connections:* Output → Get Data  
  - *Credentials:* Google Drive OAuth2.  
  - *Errors:* Folder access, empty results.

- **Get Data**  
  - *Type:* Google Drive  
  - *Role:* Downloads a file based on file ID from the previous step.  
  - *Connections:* Output → Loop Over Items  
  - *Credentials:* Google Drive OAuth2.  
  - *Errors:* File missing, download errors.

- **Loop Over Items**  
  - *Type:* Split In Batches  
  - *Role:* Processes each item/file in batches for vector storage.  
  - *Connections:* Output → Supabase Vector Store  
  - *Errors:* Large data sets may cause timeouts.

- **Clean Data**  
  - *Type:* Code (JavaScript)  
  - *Role:* Parses and cleans raw scraped data; converts JSON fields to readable arrays; computes lead score and quality; formats business summary string.  
  - *Connections:* Output → Update Data  
  - *Edge Cases:* Malformed JSON fields, missing data, unexpected formats.

- **Update Data**  
  - *Type:* Google Sheets  
  - *Role:* Updates existing rows in Google Sheets with cleaned and enriched lead data.  
  - *Config:* Uses `row_number` as matching key for update; maps multiple columns like rating, phone, lead score.  
  - *Credentials:* Google Sheets with service account.  
  - *Errors:* Row mismatch, sheet lock, permission.

---

#### 1.2 Data Vectorization and Storage

**Overview:**  
Transforms clean lead and document data into vector embeddings using OpenAI embeddings and inserts or updates them in Supabase vector stores for semantic search and retrieval.

**Nodes Involved:**  
- Google Sheets Trigger  
- Transform for Vector  
- Check Existing Data  
- Supabase Vector Store2  
- small3 (Embeddings OpenAI)  
- Default Data Loader2  
- Recursive Character Text Splitter1  
- Supabase Vector Store  
- Embeddings OpenAI  
- Default Data Loader  
- Recursive Character Text Splitter  

**Node Details:**

- **Google Sheets Trigger**  
  - *Type:* Google Sheets Trigger  
  - *Role:* Watches the main Google Sheets Restaurant sheet for changes every hour.  
  - *Connections:* Output → Transform for Vector  
  - *Credentials:* Google Sheets OAuth2.  
  - *Errors:* Polling delays, missed updates.

- **Transform for Vector**  
  - *Type:* Code  
  - *Role:* Prepares new or updated rows from Google Sheets to a structured format with business summary for vector embedding.  
  - *Connections:* Output → Check Existing Data  
  - *Edge Cases:* Empty titles skipped; missing fields defaulted.

- **Check Existing Data**  
  - *Type:* Code  
  - *Role:* Checks if data already exists in Supabase vector DB and prepares insert/update payloads with metadata and unique IDs.  
  - *Connections:* Output → Supabase Vector Store2  
  - *Errors:* Data inconsistency, malformed unique IDs.

- **Supabase Vector Store2**  
  - *Type:* Supabase Vector Store (LangChain)  
  - *Role:* Inserts or updates restaurant lead vectors in Supabase table `restaurant_leads`.  
  - *Connections:* None (end of this path)  
  - *Credentials:* Supabase API (REcharge)  
  - *Errors:* DB connection issues, quota limits.

- **small3 (Embeddings OpenAI)**  
  - *Type:* OpenAI Embeddings  
  - *Role:* Generates embeddings for lead data prepared by Transform for Vector.  
  - *Connections:* Output → Supabase Vector Store2  
  - *Credentials:* OpenAI API  
  - *Errors:* API quota exhausted, network errors.

- **Default Data Loader2**  
  - *Type:* Document Loader (LangChain)  
  - *Role:* Loads documents for vectorization; used for leads.  
  - *Connections:* Output → Recursive Character Text Splitter1  
  - *Errors:* Invalid data formats.

- **Recursive Character Text Splitter1**  
  - *Type:* Text Splitter  
  - *Role:* Splits documents into chunks with overlap for better embedding granularity.  
  - *Connections:* Output → small3  
  - *Parameters:* Chunk overlap 200 characters.

- **Supabase Vector Store**  
  - *Type:* Supabase Vector Store  
  - *Role:* Inserts general documents vectors into Supabase `documents` table.  
  - *Connections:* Output → Loop Over Items (for batch processing)  
  - *Credentials:* Supabase API  
  - *Errors:* Same as Supabase Vector Store2.

- **Embeddings OpenAI**  
  - *Type:* OpenAI Embeddings  
  - *Role:* Generates embeddings for general company documents.  
  - *Connections:* Output → Supabase Vector Store  
  - *Credentials:* OpenAI API

- **Default Data Loader**  
  - *Type:* Document Loader  
  - *Role:* Loads general business documents for embedding.  
  - *Connections:* Output → Recursive Character Text Splitter  

- **Recursive Character Text Splitter**  
  - *Type:* Text Splitter  
  - *Role:* Splits long documents recursively for embedding.  
  - *Connections:* Output → Default Data Loader  

---

#### 1.3 AI-Powered Knowledge Base and Query Handling

**Overview:**  
Provides AI agents that serve as business intelligence assistants. They query company document and restaurant lead vector stores to answer user questions accurately and contextually, enforcing strict tool selection protocols.

**Nodes Involved:**  
- AI Agent  
- AI Agent1  
- RAG  
- RAG1  
- Leads  
- Leads1  
- Embeddings OpenAI1  
- Embeddings OpenAI2  
- Embeddings OpenAI3  
- Embeddings OpenAI4  
- Reranker Cohere  
- Reranker Cohere1  
- Postgres Chat Memory  
- Chat Memory  
- OpenAI Chat Model  
- Chat Model  
- When chat message received  

**Node Details:**

- **AI Agent**  
  - *Type:* LangChain Agent  
  - *Role:* Handles user queries by utilizing CompanyDocuments and RestaurantLeads vector stores with embedded tool selection logic.  
  - *Config:* Uses system message defining roles and knowledge sources.  
  - *Connections:* Integrates with RAG and Leads tools, uses OpenAI Chat Model and Postgres memory.  
  - *Errors:* Tool selection failures, context window limits.

- **AI Agent1**  
  - *Type:* LangChain Agent  
  - *Role:* Similar to AI Agent but responds to chat triggers and uses rerankers for refined retrieval.  
  - *Connections:* Uses RAG1 and Leads1 with rerankers Cohere, Chat Model, and Chat Memory.  
  - *Errors:* As above, plus chat webhook issues.

- **RAG / RAG1**  
  - *Type:* Supabase Vector Store (retrieve-as-tool)  
  - *Role:* Retrieves top documents from `documents` table for company-related queries.  
  - *Config:* RAG1 uses reranker Cohere and enables reranking.  
  - *Errors:* DB connection, retrieval errors.

- **Leads / Leads1**  
  - *Type:* Supabase Vector Store (retrieve-as-tool)  
  - *Role:* Retrieves top restaurant leads from `restaurant_leads` table for lead-related queries.  
  - *Config:* Leads1 uses reranker Cohere1.  
  - *Errors:* Same as above.

- **Embeddings OpenAI1-4**  
  - *Type:* OpenAI Embeddings  
  - *Role:* Provides embeddings for AI agents' queries.  
  - *Connections:* Feeds into RAG, Leads, RAG1, Leads1 respectively.  
  - *Errors:* API limits.

- **Reranker Cohere / Reranker Cohere1**  
  - *Type:* LangChain Reranker (Cohere)  
  - *Role:* Improves document retrieval relevance by reranking top results.  
  - *Errors:* API auth, rate limits.

- **Postgres Chat Memory / Chat Memory**  
  - *Type:* LangChain Memory (Postgres)  
  - *Role:* Maintains chat context with session keys tied to user IDs (e.g., WhatsApp remoteJid).  
  - *Errors:* DB connection, session management.

- **OpenAI Chat Model / Chat Model**  
  - *Type:* LangChain Chat Model  
  - *Role:* Generates conversational AI responses using GPT-4o-mini.  
  - *Errors:* API failures, token limits.

- **When chat message received**  
  - *Type:* LangChain Chat Trigger  
  - *Role:* Listens for incoming chat messages (e.g., WhatsApp integration).  
  - *Connections:* Output → AI Agent1  
  - *Errors:* Webhook issues, message parsing.

---

#### 1.4 Chatbot Interaction and Messaging

**Overview:**  
Handles inbound chat messages, processes user inputs through AI agents with memory and knowledge base access, and sends responses back to users.

**Nodes Involved:**  
- When chat message received  
- AI Agent1  
- Chat Memory  
- Chat Model  
- Sticky Note3 (comment: "Respond as a chatbot")  
- WAHA Trigger (disabled)  
- AI Agent (related to WAHA trigger)  

**Node Details:**

- **When chat message received**  
  - *Role:* Entry point for chat interactions.  
  - *Config:* Receives messages and triggers AI Agent1.

- **AI Agent1**  
  - *Role:* Processes incoming chat queries using knowledge bases and AI models.

- **Chat Memory**  
  - *Role:* Maintains conversational history per user session.

- **Chat Model**  
  - *Role:* Generates chat responses.

- **WAHA Trigger**  
  - *Role:* (Disabled) WhatsApp webhook trigger for messages. Can activate AI Agent.

- **Sticky Note3**  
  - *Comment:* Reminds that this block handles chatbot responses.

---

#### 1.5 Trigger and Orchestration Nodes

**Overview:**  
Initiates workflow processes based on various triggers such as manual execution, Google Drive file updates, and Google Sheets changes.

**Nodes Involved:**  
- When clicking ‘Execute workflow’  
- Google Drive Trigger  
- Google Sheets Trigger  

**Node Details:**

- **When clicking ‘Execute workflow’**  
  - *Type:* Manual Trigger  
  - *Role:* Allows manual start of the workflow for testing or on-demand runs.  
  - *Connections:* Output → Set Location.

- **Google Drive Trigger**  
  - *Role:* Triggers when files in the designated Drive folder are updated.

- **Google Sheets Trigger**  
  - *Role:* Triggers on changes in the Google Sheets Restaurant database.

---

### 3. Summary Table

| Node Name                  | Node Type                                   | Functional Role                                  | Input Node(s)             | Output Node(s)                 | Sticky Note                                         |
|----------------------------|---------------------------------------------|-------------------------------------------------|---------------------------|-------------------------------|----------------------------------------------------|
| Set Location               | Set                                         | Sets search location parameter                   | When clicking ‘Execute workflow’ | Scrape Maps                |                                                    |
| Scrape Maps                | HTTP Request                                | Calls Apify to scrape Google Maps data           | Set Location              | Get Result                    |                                                    |
| Get Result                 | HTTP Request                                | Retrieves scraping results                        | Scrape Maps               | Append Leads                  |                                                    |
| Append Leads               | Google Sheets                               | Appends new leads to Google Sheets                | Get Result                | HTTP Request1 (disabled)      |                                                    |
| Google Drive Trigger       | Google Drive Trigger                        | Watches for file updates in Drive folder          |                           | Search File                   |                                                    |
| Search File                | Google Drive                                | Lists files in folder                             | Google Drive Trigger      | Get Data                     |                                                    |
| Get Data                   | Google Drive                                | Downloads file                                    | Search File               | Loop Over Items               |                                                    |
| Loop Over Items            | Split In Batches                            | Processes each data item in batches                | Get Data                  | Supabase Vector Store         |                                                    |
| Clean Data                 | Code                                        | Cleans and formats scraped data                   | Get Leads                 | Update Data                  |                                                    |
| Update Data                | Google Sheets                               | Updates lead info in Google Sheets                 | Clean Data                |                               |                                                    |
| Google Sheets Trigger      | Google Sheets Trigger                       | Triggers on sheet changes                          |                           | Transform for Vector         |                                                    |
| Transform for Vector       | Code                                        | Prepares data for vector embedding                 | Google Sheets Trigger     | Check Existing Data          |                                                    |
| Check Existing Data        | Code                                        | Prepares insert/update data for vector DB          | Transform for Vector      | Supabase Vector Store2       |                                                    |
| Supabase Vector Store2     | Supabase Vector Store                       | Inserts/updates restaurant leads vectors           | Check Existing Data       |                               |                                                    |
| small3 (Embeddings OpenAI) | OpenAI Embeddings                           | Generates embeddings for leads                     | Recursive Character Text Splitter1 | Supabase Vector Store2 |                                                    |
| Default Data Loader2       | Document Loader                            | Loads lead documents for embedding                 | Recursive Character Text Splitter1 | small3                   |                                                    |
| Recursive Character Text Splitter1 | Text Splitter                      | Splits lead documents into chunks                  | Default Data Loader2      | small3                       |                                                    |
| Supabase Vector Store      | Supabase Vector Store                       | Inserts general document vectors                    | Loop Over Items           | Loop Over Items              |                                                    |
| Embeddings OpenAI          | OpenAI Embeddings                           | Generates embeddings for company documents          | Recursive Character Text Splitter | Supabase Vector Store   |                                                    |
| Default Data Loader        | Document Loader                            | Loads company documents                             | Recursive Character Text Splitter | Embeddings OpenAI         |                                                    |
| Recursive Character Text Splitter | Text Splitter                          | Splits company documents for embedding             | Default Data Loader       | Embeddings OpenAI            |                                                    |
| AI Agent                   | LangChain Agent                            | Handles AI queries with knowledge base search      | RAG, Leads, OpenAI Chat Model, Postgres Chat Memory |  |                                                    |
| AI Agent1                  | LangChain Agent                            | Chatbot AI agent with rerankers and chat memory    | RAG1, Leads1, Chat Model, Chat Memory |                      |                                                    |
| RAG                        | Supabase Vector Store                      | Retrieves company documents for AI agent           | Embeddings OpenAI1        | AI Agent                     |                                                    |
| RAG1                       | Supabase Vector Store                      | Retrieves company documents with reranker          | Embeddings OpenAI3, Reranker Cohere | AI Agent1               |                                                    |
| Leads                      | Supabase Vector Store                      | Retrieves restaurant leads for AI agent             | Embeddings OpenAI2        | AI Agent                     |                                                    |
| Leads1                     | Supabase Vector Store                      | Retrieves restaurant leads with reranker           | Embeddings OpenAI4, Reranker Cohere1 | AI Agent1            |                                                    |
| Embeddings OpenAI1-4       | OpenAI Embeddings                          | Embeddings for AI agents' retrieval                 | Various document loaders  | RAG, RAG1, Leads, Leads1     |                                                    |
| Reranker Cohere / Cohere1  | LangChain Reranker (Cohere)                | Improves retrieval relevance                         | RAG1, Leads1              | RAG1, Leads1                 |                                                    |
| Postgres Chat Memory       | LangChain Memory (Postgres)                 | Maintains chat sessions for AI Agent                |                           | AI Agent                     |                                                    |
| Chat Memory                | LangChain Memory (Postgres)                 | Maintains chat sessions for AI Agent1               |                           | AI Agent1                    |                                                    |
| OpenAI Chat Model          | LangChain Chat Model                       | Generates AI responses                               |                           | AI Agent                     |                                                    |
| Chat Model                 | LangChain Chat Model                       | Generates AI chat responses                          |                           | AI Agent1                    |                                                    |
| When chat message received | LangChain Chat Trigger                     | Receives incoming chat messages                      |                           | AI Agent1                    |                                                    |
| When clicking ‘Execute workflow’ | Manual Trigger                        | Manual workflow start                                |                           | Set Location                 |                                                    |
| WAHA Trigger               | WhatsApp Trigger (disabled)                | WhatsApp webhook trigger (disabled)                  |                           | AI Agent                     |                                                    |
| Sticky Notes (multiple)    | Sticky Note                                | Comments and explanations                            |                           |                             | # Company Knowledge Base; # Scrapping and data Cleaning; # Potential Leads Knowledge Base; # Respond as a chatbot; # Send Message |

---

### 4. Reproducing the Workflow from Scratch

To recreate this workflow in n8n, follow these steps:

1. **Create a Manual Trigger node** named `When clicking ‘Execute workflow’`.

2. **Add a Set node** `Set Location`:  
   - Set variable `lokasi` with default value `"Bali"`.  
   - Connect manual trigger output to this node.

3. **Add HTTP Request node** `Scrape Maps`:  
   - Method: POST  
   - URL: Your Apify Google Maps scraping endpoint  
   - Body type: JSON  
   - Body: Include parameters such as `locationQuery` with expression `{{ $json.lokasi }}`, search strings `["Restoran"]`, scrape options as per original.  
   - Connect `Set Location` output to this node.

4. **Add HTTP Request node** `Get Result`:  
   - Method: GET  
   - URL: Your Apify results endpoint  
   - Connect `Scrape Maps` output to this node.

5. **Add Google Sheets node** `Append Leads`:  
   - Operation: Append  
   - Set document ID and sheet name to your Restaurant database sheet  
   - Map fields from `Get Result` data to columns, e.g., Phone, Price, Title, Rating, etc.  
   - Connect `Get Result` output to this node.  
   - Configure credentials with Google Sheets service account.

6. **Add Google Drive Trigger node** `Google Drive Trigger`:  
   - Watch for file updates in your designated folder (ID from your Drive).  
   - Configure OAuth2 credentials.  

7. **Add Google Drive node** `Search File`:  
   - Resource: fileFolder  
   - Folder ID: same as watched folder  
   - Return all files.  
   - Connect `Google Drive Trigger` output to this node.

8. **Add Google Drive node** `Get Data`:  
   - Operation: Download  
   - File ID: use expression to get file ID from `Search File` output  
   - Connect `Search File` output to this node.

9. **Add Split In Batches node** `Loop Over Items`:  
   - No special config needed.  
   - Connect `Get Data` output to this node.

10. **Add Code node** `Clean Data`:  
    - Paste the provided JavaScript to parse and clean the data fields, compute lead score and quality, and format business summary.  
    - Connect `Get Leads` output (Google Sheets read node) to this node.

11. **Add Google Sheets node** `Update Data`:  
    - Operation: Update  
    - Use `row_number` as matching column for update.  
    - Map cleaned data fields to columns.  
    - Connect `Clean Data` output to this node.

12. **Add Google Sheets Trigger node** `Google Sheets Trigger`:  
    - Configure to watch your Restaurant sheet for changes every hour.  
    - Connect to `Transform for Vector`.

13. **Add Code node** `Transform for Vector`:  
    - Prepare data for embedding with business summary and metadata as per original code.  
    - Connect `Google Sheets Trigger` output to this node.

14. **Add Code node** `Check Existing Data`:  
    - Checks if lead data exists in vector DB and prepares insert/update payload.  
    - Connect `Transform for Vector` output to this node.

15. **Add Supabase Vector Store node** `Supabase Vector Store2`:  
    - Mode: Insert  
    - Table: `restaurant_leads`  
    - Credentials: Your Supabase API  
    - Connect `Check Existing Data` output to this node.

16. **Add OpenAI Embeddings node** `small3`:  
    - Configure with OpenAI API credentials.  
    - Connect `Recursive Character Text Splitter1` output to this node.  
    - Connect `small3` output to `Supabase Vector Store2`.

17. **Add Default Data Loader node** `Default Data Loader2`:  
    - Loads documents for embedding.  
    - Connect to `Recursive Character Text Splitter1`.

18. **Add Recursive Character Text Splitter node** `Recursive Character Text Splitter1`:  
    - Set chunk overlap to 200 characters.  
    - Connect to `small3`.

19. **Add similar nodes for general company documents embedding** following the pattern:  
    - `Default Data Loader` → `Recursive Character Text Splitter` → `Embeddings OpenAI` → `Supabase Vector Store`.

20. **Add LangChain Agent node** `AI Agent`:  
    - Configure system message to define business intelligence assistant role and knowledge sources.  
    - Connect vector store nodes `RAG` and `Leads` as tools.  
    - Connect to `OpenAI Chat Model` and `Postgres Chat Memory`.  

21. **Add similar LangChain Agent node `AI Agent1` for chat processing:**  
    - Use rerankers (`Reranker Cohere`, `Reranker Cohere1`) and vector stores with reranking enabled (`RAG1`, `Leads1`).  
    - Connect to `Chat Model` and `Chat Memory`.  
    - Connect input from `When chat message received` trigger.

22. **Add LangChain Chat Trigger node** `When chat message received`:  
    - Set webhook to receive chat messages.  
    - Connect output to `AI Agent1`.

23. **Add LangChain Memory nodes** `Postgres Chat Memory` and `Chat Memory`:  
    - Configure PostgreSQL credentials pointing to your ReCharge Database.  
    - Use session keys based on user identifiers.

24. **Add LangChain Chat Model nodes** `OpenAI Chat Model` and `Chat Model`:  
    - Set model to `gpt-4o-mini`.  
    - Configure OpenAI API credentials.

25. **Add Google Drive Trigger and Google Sheets Trigger nodes** as workflow entry points.

26. **Add Sticky Note nodes** to document workflow sections for clarity and maintenance.

27. **Configure all credentials properly:**  
    - Google Drive OAuth2  
    - Google Sheets OAuth2 or service account  
    - Supabase API  
    - OpenAI API  
    - Cohere API for reranker  
    - Postgres database for memory  

---

### 5. General Notes & Resources

| Note Content                                                                                                               | Context or Link                                                                                         |
|----------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| The workflow integrates Apify scraping, OpenAI GPT-4o, Supabase vector store, and Google Workspace for lead generation.   | Workflow description                                                                                   |
| See Apify Google Maps scraper documentation for API usage details: https://apify.com/docs/actors/quick-start                 | Apify API documentation                                                                                |
| OpenAI GPT-4o-mini model is used for chat completions and embeddings; ensure API keys have access to this model.             | OpenAI docs: https://platform.openai.com/docs/models/gpt-4o-mini                                      |
| Supabase vector store requires a configured Postgres database with vector extension like pgvector.                          | Supabase pgvector docs: https://supabase.com/docs/guides/database/extensions/pgvector                 |
| Cohere reranker model `rerank-multilingual-v3.0` is used to improve semantic search relevance.                              | Cohere reranker docs: https://docs.cohere.ai/docs/rerankers                                            |
| This workflow uses LangChain nodes extensively for AI orchestration and vector retrieval.                                   | LangChain n8n nodes: https://docs.n8n.io/nodes/n8n-nodes-langchain/                                   |
| WhatsApp integration via WAHA node is present but currently disabled; requires webhook setup and credentials.               | WAHA node: https://n8n.io/integrations/n8n-nodes-waha                                                 |
| The workflow enforces strict tool selection protocols in AI agents to avoid hallucinations and ensure accurate responses.  | See AI Agent system message for detailed instructions                                                |

---

**Disclaimer:** The text above is exclusively generated from an automated n8n workflow analysis respecting all content policies. It contains no illegal, offensive, or protected elements. All handled data is legal and public.

---