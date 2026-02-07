Automate Cold Calling with Web Scraping, GPT-4o & WhatsApp

https://n8nworkflows.xyz/workflows/automate-cold-calling-with-web-scraping--gpt-4o---whatsapp-5476


# Automate Cold Calling with Web Scraping, GPT-4o & WhatsApp

---

## 1. Workflow Overview

This workflow automates lead generation and outreach for cold calling by integrating web scraping, AI-powered data enrichment, and communication via WhatsApp. It is designed for businesses seeking to identify and qualify restaurant leads using data from Google Maps, process and store enriched data, and enable intelligent conversational interactions with leads. The workflow involves several logical blocks as follows:

- **1.1 Data Acquisition & Scraping:**  
  Fetches restaurant lead data by scraping Google Maps using an external Apify API based on a specified location.

- **1.2 Data Cleaning & Transformation:**  
  Cleans, parses, and enriches scraped data to prepare structured lead profiles with calculated lead scores and summaries.

- **1.3 Data Storage & Indexing:**  
  Updates leads into Google Sheets for record keeping and inserts or updates vector embeddings into a Supabase vector store for semantic search.

- **1.4 Business Knowledge Base Management:**  
  Manages company documents and lead knowledge bases, embedding textual data for AI-driven retrieval and use in conversational agents.

- **1.5 AI-Powered Conversational Agents:**  
  Implements AI agents powered by GPT-4o and LangChain that leverage vector stores for context-aware business intelligence and lead interaction.

- **1.6 Triggering & Orchestration:**  
  Uses various triggers (Google Drive updates, Google Sheets changes, chat message receipt) to orchestrate scraping, data processing, and AI interactions.

- **1.7 Communication & Outreach:**  
  Integrates with WhatsApp (via WAHA) to receive chat messages and respond intelligently using AI agents linked to company and lead data.

---

## 2. Block-by-Block Analysis

### 1.1 Data Acquisition & Scraping

**Overview:**  
This block initiates lead data retrieval by scraping Google Maps locations using an external scraping API, triggered manually or by setting a location.

**Nodes Involved:**  
- When clicking ‘Execute workflow’ (Manual Trigger)  
- Set Location  
- Scrape Maps  
- Get Result  
- Append Leads  

**Node Details:**

- **When clicking ‘Execute workflow’**  
  - Type: Manual Trigger  
  - Role: Starts the workflow on demand.  
  - Config: No parameters.  
  - Inputs: None  
  - Outputs: Connects to `Set Location`.  
  - Edge Cases: Manual start required; no errors expected.

- **Set Location**  
  - Type: Set  
  - Role: Defines a static location string ("Bali") to feed the scraping request.  
  - Config: Assigns variable `lokasi` = "Bali".  
  - Inputs: From manual trigger.  
  - Outputs: Connects to `Scrape Maps`.  
  - Edge Cases: Hardcoded location; change needed for dynamic locations.

- **Scrape Maps**  
  - Type: HTTP Request  
  - Role: Calls an external Apify API to scrape Google Maps data filtered by location and search string ("Restoran").  
  - Config: POST method with JSON body including parameters such as language, max places, and search strings.  
  - Inputs: Location variable from `Set Location`.  
  - Outputs: Connects to `Get Result`.  
  - Edge Cases: API URL placeholder must be replaced; network errors, rate limits, or malformed responses possible.

- **Get Result**  
  - Type: HTTP Request  
  - Role: Retrieves scraping results from Apify API.  
  - Config: GET request to a specified Apify result URL (placeholder).  
  - Inputs: From `Scrape Maps`.  
  - Outputs: Connects to `Append Leads`.  
  - Edge Cases: API key expirations, empty results, timeout.

- **Append Leads**  
  - Type: Google Sheets (Append)  
  - Role: Appends raw scraped lead data into a Google Sheets document for further processing.  
  - Config: Maps scraped fields (phone, price, title, rating, etc.) into specific columns; uses service account auth.  
  - Inputs: JSON data from `Get Result`.  
  - Outputs: Connects to `HTTP Request1` (disabled).  
  - Edge Cases: Sheet access permission issues; malformed data; rate limits from Google API.

---

### 1.2 Data Cleaning & Transformation

**Overview:**  
This block processes raw data from sheets or scraping, cleans and parses complex JSON fields, calculates lead scores, generates AI-friendly summaries, and updates clean data back to a spreadsheet.

**Nodes Involved:**  
- Get Leads (Google Sheets Read)  
- Clean Data (Code)  
- Update Data (Google Sheets Update)  

**Node Details:**

- **Get Leads**  
  - Type: Google Sheets (Read)  
  - Role: Reads lead data from a Google Sheet to provide input for cleaning.  
  - Config: Reads from a specified sheet and document via service account authentication.  
  - Inputs: From `Webhook` or manual triggers.  
  - Outputs: Connects to `Clean Data`.  
  - Edge Cases: Empty or missing data; auth failures.

- **Clean Data**  
  - Type: Code (JavaScript)  
  - Role: Parses and cleans complex JSON string fields (advantages, facilities, payment, categories, opening hours), normalizes data, calculates a lead score based on rating, reviews, contact info, and prepares a comprehensive business description for AI.  
  - Config: Custom JS code with detailed parsing, error handling, and scoring logic.  
  - Inputs: From `Get Leads`.  
  - Outputs: Connects to `Update Data`.  
  - Edge Cases: Malformed JSON fields, missing data, unexpected data formats.

- **Update Data**  
  - Type: Google Sheets (Update)  
  - Role: Updates the cleaned and enriched data back into the original Google Sheet, matching rows by `row_number`.  
  - Config: Maps cleaned and enriched fields to sheet columns; service account auth.  
  - Inputs: Cleaned data from `Clean Data`.  
  - Outputs: None.  
  - Edge Cases: Sheet lock conflicts, mismatches in row_number, Google API errors.

---

### 1.3 Data Storage & Indexing

**Overview:**  
This block transforms updated leads into vector embeddings for semantic search and inserts them into a Supabase vector store, handling new data and updates.

**Nodes Involved:**  
- Google Sheets Trigger  
- Transform for Vector (Code)  
- Check Existing Data (Code)  
- Embeddings OpenAI (multiple nodes for different databases)  
- Supabase Vector Store (multiple nodes)  
- Loop Over Items  
- Recursive Character Text Splitter (for documents)  
- Default Data Loader (for documents)  

**Node Details:**

- **Google Sheets Trigger**  
  - Type: Google Sheets Trigger  
  - Role: Watches the leads Google Sheet for changes every hour to trigger vector updating.  
  - Config: Polls every hour on specified sheet and document; OAuth2 credentials.  
  - Inputs: None (trigger).  
  - Outputs: Connects to `Transform for Vector`.  
  - Edge Cases: Poll delay; OAuth token expiration.

- **Transform for Vector**  
  - Type: Code  
  - Role: Prepares a business summary string and metadata object from the updated Google Sheet data to create vector store input. Filters out empty data.  
  - Inputs: From `Google Sheets Trigger`.  
  - Outputs: Connects to `Check Existing Data`.  
  - Edge Cases: Missing or empty rows skipped.

- **Check Existing Data**  
  - Type: Code  
  - Role: Prepares vector data including unique IDs based on name and address, formats metadata, and flags updates vs. inserts.  
  - Inputs: Output from `Transform for Vector`.  
  - Outputs: Connects to `Supabase Vector Store2`.  
  - Edge Cases: Duplicate entries, malformed data.

- **Embeddings OpenAI (multiple instances)**  
  - Type: LangChain OpenAI Embeddings  
  - Role: Converts business summaries into vector embeddings for semantic search.  
  - Config: Uses OpenAI API credentials; no special options.  
  - Inputs: Text data from loaders or transform nodes.  
  - Outputs: Connects to respective Supabase Vector Store nodes.  
  - Edge Cases: API rate limits, invalid API keys.

- **Supabase Vector Store (multiple instances)**  
  - Type: LangChain Supabase Vector Store  
  - Role: Inserts or updates vector embeddings into specific Supabase tables: `documents`, `restaurant_leads`, etc.  
  - Config: Uses Supabase API credentials; table names specified; insert mode.  
  - Inputs: Embeddings from OpenAI nodes or formatted data.  
  - Outputs: Loop over items or no further output depending on node.  
  - Edge Cases: Connection failures, table permission errors.

- **Loop Over Items**  
  - Type: SplitInBatches  
  - Role: Processes vector store inserts in batches to avoid timeouts or rate limits.  
  - Inputs: From Supabase Vector Store node.  
  - Outputs: Each batch output to `Supabase Vector Store`.  
  - Edge Cases: Batch size misconfiguration.

- **Default Data Loader & Recursive Character Text Splitter**  
  - Type: LangChain Document Loader and Text Splitter  
  - Role: Loads and splits large document data for embedding insertion.  
  - Inputs: Binary or text documents.  
  - Outputs: To Embeddings OpenAI and then to Supabase Vector Store.  
  - Edge Cases: Large documents may cause slowdowns; splitting configuration critical.

---

### 1.4 Business Knowledge Base Management

**Overview:**  
Manages company documents knowledge base with vector embeddings to support AI retrieval for business intelligence questions.

**Nodes Involved:**  
- Google Drive Trigger  
- Search File  
- Get Data  
- Default Data Loader  
- Recursive Character Text Splitter  
- Embeddings OpenAI  
- Supabase Vector Store  

**Node Details:**

- **Google Drive Trigger**  
  - Type: Google Drive Trigger  
  - Role: Watches a specific Google Drive folder for file updates to refresh company documents knowledge base.  
  - Config: Folder ID specified; polling daily at midnight; OAuth2 credentials.  
  - Inputs: None (trigger).  
  - Outputs: To `Search File`.  
  - Edge Cases: API limits, folder permission issues.

- **Search File**  
  - Type: Google Drive (List Files/Folders)  
  - Role: Lists files in the specified folder to find updated documents.  
  - Inputs: From Drive Trigger.  
  - Outputs: To `Get Data`.  
  - Edge Cases: Large folder may cause pagination issues.

- **Get Data**  
  - Type: Google Drive (Download File)  
  - Role: Downloads each listed file for processing.  
  - Inputs: From `Search File`.  
  - Outputs: To `Loop Over Items`.  
  - Edge Cases: File access permissions.

- **Loop Over Items**  
  - Type: SplitInBatches  
  - Role: Processes files in batches to feed into data loaders and vector stores.  
  - Inputs: From `Get Data`.  
  - Outputs: To `Default Data Loader`.  
  - Edge Cases: Batch size tuning needed.

- **Default Data Loader & Recursive Character Text Splitter**  
  - As described above, load and split documents.  
  - Outputs: To `Embeddings OpenAI`.

- **Embeddings OpenAI & Supabase Vector Store**  
  - As described, embed documents and insert into Supabase `documents` table.  
  - Edge Cases: Similar to above.

---

### 1.5 AI-Powered Conversational Agents

**Overview:**  
Implements AI agents that respond to chat messages by querying company documents and restaurant leads knowledge bases, integrating chat memory and reranking for enhanced response relevance.

**Nodes Involved:**  
- When chat message received (Chat Trigger)  
- AI Agent1 (LangChain Agent)  
- Chat Memory (Postgres)  
- Chat Model (OpenAI GPT-4o-mini)  
- RAG1 (Supabase Vector Store retrieval)  
- Leads1 (Supabase Vector Store retrieval)  
- Embeddings OpenAI3 & 4  
- Reranker Cohere & Reranker Cohere1  

**Node Details:**

- **When chat message received**  
  - Type: LangChain Chat Trigger  
  - Role: Listens for incoming chat messages (presumably from WhatsApp via WAHA integration).  
  - Inputs: Incoming chat webhook.  
  - Outputs: To `AI Agent1`.  
  - Edge Cases: Disabled in current workflow; webhook setup required.

- **AI Agent1**  
  - Type: LangChain Agent  
  - Role: Processes user queries using embedded knowledge bases and GPT-4o-mini model, following strict tool usage rules to select appropriate knowledge bases.  
  - Config: Detailed system prompt instructing it on tool selection, language handling, and response guidelines.  
  - Inputs: Chat trigger and context from memory and vector stores.  
  - Outputs: To chat model and back to chat.  
  - Edge Cases: Misclassification of query may lead to irrelevant responses.

- **Chat Memory**  
  - Type: Postgres Chat Memory  
  - Role: Stores and retrieves conversation context to maintain dialogue continuity.  
  - Config: Uses session key from chat remoteJid; context window length 20 messages.  
  - Inputs: From chat trigger and AI agent.  
  - Outputs: To AI agent and chat model.  
  - Edge Cases: Database connectivity issues.

- **Chat Model**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Generates GPT-4o-mini responses based on retrieved context and prompt.  
  - Inputs: From AI agent and memory.  
  - Outputs: To AI agent for final processing.  
  - Edge Cases: OpenAI API limits or errors.

- **RAG1 and Leads1**  
  - Type: Supabase Vector Store retrieval (retrieval-as-tool mode)  
  - Role: Retrieve relevant documents and restaurant leads from vector stores using top K = 20 results.  
  - Config: Uses reranker Cohere models for reordering results.  
  - Inputs: Query from AI agent.  
  - Outputs: To AI agent for knowledge context.  
  - Edge Cases: Vector store sync issues, reranker API errors.

- **Embeddings OpenAI3 & 4**  
  - Type: LangChain OpenAI Embeddings  
  - Role: Supports embedding of new queries or data for retrieval.  
  - Inputs: Query text.  
  - Outputs: To RAG1 and Leads1 nodes.  
  - Edge Cases: API limits.

- **Reranker Cohere & Reranker Cohere1**  
  - Type: LangChain Reranker Cohere  
  - Role: Reranks retrieved documents/leads for relevance.  
  - Config: Uses multilingual reranker model v3.0.  
  - Inputs: Retrieval results from Supabase vector stores.  
  - Outputs: To RAG1 and Leads1 retrieval nodes respectively.  
  - Edge Cases: Reranker API unavailability.

---

### 1.6 Triggering & Orchestration

**Overview:**  
Orchestrates workflow execution by using triggers that respond to file updates, sheet changes, manual execution, or chat messages.

**Nodes Involved:**  
- Google Drive Trigger  
- Google Sheets Trigger  
- When clicking ‘Execute workflow’ (Manual Trigger)  
- When chat message received (Chat Trigger)  
- WAHA Trigger (disabled)  

**Node Details:**

- **Google Drive Trigger**  
  - Watches a specified folder for new or updated files to refresh company documents base.  
  - Edge Cases: Polling frequency and API quota.

- **Google Sheets Trigger**  
  - Watches the leads spreadsheet for changes to update vector store embeddings.  
  - Edge Cases: Delay in detecting changes.

- **Manual Trigger**  
  - Allows manual start for scraping and lead data acquisition.  
  - Edge Cases: Requires user action.

- **Chat Trigger**  
  - Listens for chat messages to respond with AI. Currently disabled.  
  - Edge Cases: Webhook setup needed.

- **WAHA Trigger**  
  - Intended for WhatsApp integration to receive messages; currently disabled.  
  - Edge Cases: Requires WAHA credentials and webhook URL.

---

### 1.7 Communication & Outreach

**Overview:**  
Supports sending messages through WhatsApp or other channels after lead data preparation; includes placeholders for HTTP requests to external endpoints.

**Nodes Involved:**  
- HTTP Request1 (disabled)  
- Append Leads (Google Sheets append)  

**Node Details:**

- **HTTP Request1**  
  - Intended for posting processed lead data or notifications to an external webhook.  
  - Disabled in current config; URL placeholder.  
  - Edge Cases: Requires valid webhook URL and endpoint.

- **Append Leads**  
  - Appends newly scraped leads into Google Sheets for record and outreach.  
  - Edge Cases: See above.

---

## 3. Summary Table

| Node Name                 | Node Type                                  | Functional Role                                     | Input Node(s)                 | Output Node(s)                  | Sticky Note                                                                                          |
|---------------------------|--------------------------------------------|----------------------------------------------------|------------------------------|---------------------------------|----------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                          | Manual start of scraping workflow                  | None                         | Set Location                   |                                                                                                    |
| Set Location              | Set                                        | Sets static location variable for scraping         | When clicking ‘Execute workflow’ | Scrape Maps                  |                                                                                                    |
| Scrape Maps              | HTTP Request                               | Calls Apify to scrape Google Maps leads             | Set Location                 | Get Result                    | API URL placeholder must be replaced with actual Apify endpoint.                                   |
| Get Result               | HTTP Request                               | Retrieves scraping results from Apify               | Scrape Maps                  | Append Leads                  |                                                                                                    |
| Append Leads             | Google Sheets (Append)                      | Appends raw scraped leads into Google Sheets        | Get Result                   | HTTP Request1 (disabled)       |                                                                                                    |
| HTTP Request1            | HTTP Request (disabled)                     | Intended for posting lead data externally            | Append Leads                 | None                         | Disabled; URL placeholder must be configured if used.                                              |
| Get Leads                | Google Sheets (Read)                        | Reads leads data for cleaning                         | Webhook                      | Clean Data                   |                                                                                                    |
| Clean Data               | Code                                       | Cleans, parses, enriches lead data                    | Get Leads                   | Update Data                  | Contains complex parsing and scoring logic; errors if JSON fields malformed.                       |
| Update Data              | Google Sheets (Update)                      | Updates cleaned lead data back to Google Sheets      | Clean Data                   | None                         | Matches rows by row_number; requires sheet edit permissions.                                       |
| Google Drive Trigger     | Google Drive Trigger                        | Triggers on file updates to refresh knowledge base   | None                        | Search File                  |                                                                                                    |
| Search File              | Google Drive (List files)                   | Lists files in specified folder                       | Google Drive Trigger         | Get Data                     |                                                                                                    |
| Get Data                 | Google Drive (Download files)               | Downloads files for processing                        | Search File                  | Loop Over Items              |                                                                                                    |
| Loop Over Items          | SplitInBatches                             | Processes multiple files as batches                   | Get Data                    | Default Data Loader          |                                                                                                    |
| Default Data Loader      | LangChain Document Loader                   | Loads document data for embedding                     | Loop Over Items             | Recursive Character Text Splitter |                                                                                                    |
| Recursive Character Text Splitter | LangChain Text Splitter                 | Splits documents into text chunks                      | Default Data Loader         | Embeddings OpenAI            |                                                                                                    |
| Embeddings OpenAI        | LangChain OpenAI Embeddings                  | Creates text embeddings for documents                  | Recursive Character Text Splitter | Supabase Vector Store      |                                                                                                    |
| Supabase Vector Store    | LangChain Supabase Vector Store              | Inserts embeddings into documents table                | Embeddings OpenAI           | Loop Over Items              |                                                                                                    |
| Google Sheets Trigger    | Google Sheets Trigger                        | Triggers on sheet changes to update vector store      | None                        | Transform for Vector         |                                                                                                    |
| Transform for Vector     | Code                                       | Transforms spreadsheet data for vector embedding       | Google Sheets Trigger       | Check Existing Data          | Filters out empty data; prepares business summary string.                                         |
| Check Existing Data      | Code                                       | Prepares and flags data for insert/update in vector store | Transform for Vector       | Supabase Vector Store2       |                                                                                                    |
| Supabase Vector Store2   | LangChain Supabase Vector Store              | Inserts or updates vector embeddings for restaurant leads | Check Existing Data        | None                         |                                                                                                    |
| Embeddings OpenAI        | LangChain OpenAI Embeddings                  | Embeds business summary text                           | Transform for Vector         | Supabase Vector Store        | Multiple instances for different tables.                                                          |
| RAG                      | LangChain Supabase Vector Store (retrieve)  | Retrieves company documents for AI agent              | Embeddings OpenAI1          | AI Agent                    |                                                                                                    |
| Leads                    | LangChain Supabase Vector Store (retrieve)  | Retrieves restaurant leads for AI agent                | Embeddings OpenAI2          | AI Agent                    |                                                                                                    |
| AI Agent                 | LangChain Agent                             | AI agent using GPT-4o-mini to answer queries          | RAG, Leads                  | OpenAI Chat Model           |                                                                                                    |
| OpenAI Chat Model        | LangChain OpenAI Chat Model                  | Generates AI text responses                            | AI Agent                    | Postgres Chat Memory        |                                                                                                    |
| Postgres Chat Memory     | LangChain Postgres Chat Memory                | Maintains chat conversation context                    | OpenAI Chat Model           | AI Agent                    |                                                                                                    |
| When chat message received | LangChain Chat Trigger (disabled)           | Listens for incoming chat messages                      | None                        | AI Agent1                   | Disabled; requires webhook setup for chat integration.                                           |
| AI Agent1                | LangChain Agent                             | AI agent for chat interactions with tool selection logic | When chat message received | Chat Model                 |                                                                                                    |
| Chat Model               | LangChain OpenAI Chat Model                  | Generates chat responses                                | AI Agent1                   | Chat Memory                 |                                                                                                    |
| Chat Memory              | LangChain Postgres Chat Memory                | Maintains chat memory                                   | Chat Model                  | AI Agent1                   |                                                                                                    |
| RAG1                     | LangChain Supabase Vector Store (retrieve)  | Retrieves company documents for chat AI agent          | Reranker Cohere             | AI Agent1                   |                                                                                                    |
| Leads1                   | LangChain Supabase Vector Store (retrieve)  | Retrieves restaurant leads for chat AI agent            | Reranker Cohere1            | AI Agent1                   |                                                                                                    |
| Reranker Cohere          | LangChain Reranker Cohere                    | Re-ranks company documents retrieval results           | RAG                        | RAG1                       |                                                                                                    |
| Reranker Cohere1         | LangChain Reranker Cohere                    | Re-ranks restaurant leads retrieval results            | Leads                      | Leads1                     |                                                                                                    |
| Sticky Note              | Sticky Note                                 | Visual annotation for Company Knowledge Base           | None                        | None                       | "# Company Knowledge Base"                                                                          |
| Sticky Note1             | Sticky Note                                 | Visual annotation for Scraping and Data Cleaning       | None                        | None                       | "# Scrapping and data Cleaning"                                                                    |
| Sticky Note2             | Sticky Note                                 | Visual annotation for Potential Leads Knowledge Base   | None                        | None                       | "# Potential Leads Knowledge Base"                                                                 |
| Sticky Note3             | Sticky Note                                 | Visual annotation for chatbot response block           | None                        | None                       | "# Respond as a chatbot"                                                                            |
| Sticky Note4             | Sticky Note                                 | Visual annotation for Send Message block                | None                        | None                       | "# Send Message"                                                                                   |

---

## 4. Reproducing the Workflow from Scratch

1. **Manual Trigger Node**  
   - Create a "Manual Trigger" node named `When clicking ‘Execute workflow’`. No parameters.  
   - Connect output to next node.

2. **Set Node**  
   - Create a "Set" node named `Set Location`.  
   - Add a string variable `lokasi` with value `"Bali"`.  
   - Connect input from the manual trigger. Output connects to scraping.

3. **HTTP Request Node (Scrape Maps)**  
   - Create an "HTTP Request" node named `Scrape Maps`.  
   - Method: POST  
   - URL: Replace `<your apify url>` with actual Apify endpoint.  
   - Body Type: JSON  
   - JSON Body: Include parameters such as `includeWebResults: false`, `language: "id"`, `locationQuery` set to expression `{{$json.lokasi}}`, `searchStringsArray` = ["Restoran"], etc.  
   - Connect input from `Set Location`. Output connects to `Get Result`.

4. **HTTP Request Node (Get Result)**  
   - Create an "HTTP Request" node named `Get Result`.  
   - Method: GET  
   - URL: Replace `<your apify get>` with actual Apify results URL.  
   - Connect input from `Scrape Maps`. Output connects to `Append Leads`.

5. **Google Sheets Node (Append Leads)**  
   - Create a "Google Sheets" node named `Append Leads`.  
   - Operation: Append  
   - Document ID and Sheet Name: Connect to your leads spreadsheet (e.g. Restaurant sheet).  
   - Authentication: Use service account credentials.  
   - Map columns such as Phone, Title, Rating, Address, Category, etc. from scraped JSON fields.  
   - Connect input from `Get Result`.

6. **Google Sheets Trigger Node**  
   - Create a "Google Sheets Trigger" node named `Google Sheets Trigger`.  
   - Configure to watch your leads sheet for changes every hour.  
   - Authentication: OAuth2.  
   - Connect output to `Transform for Vector`.

7. **Code Node (Transform for Vector)**  
   - Create a "Code" node named `Transform for Vector`.  
   - Paste JS code that creates a business summary string and metadata for vector embedding from spreadsheet row data.  
   - Connect input from `Google Sheets Trigger`. Output connects to `Check Existing Data`.

8. **Code Node (Check Existing Data)**  
   - Create a "Code" node named `Check Existing Data`.  
   - Paste JS code to prepare data with unique IDs and metadata for vector store insert or update.  
   - Connect input from `Transform for Vector`. Output connects to `Supabase Vector Store2`.

9. **LangChain Embeddings Node**  
   - Create "Embeddings OpenAI" nodes as needed with OpenAI API credentials for embedding business summaries.  
   - Connect input from transform node or loaders as appropriate. Output connects to Supabase nodes.

10. **Supabase Vector Store Nodes**  
    - Create "Supabase Vector Store" nodes for inserting embeddings into tables like `restaurant_leads` and `documents`.  
    - Credentials: Supabase API key with write permissions.  
    - Connect input from embeddings nodes.

11. **Google Drive Trigger Node**  
    - Create a "Google Drive Trigger" node to watch a folder for document updates (e.g. company knowledge base folder).  
    - Configure with OAuth2 credentials and folder ID.  
    - Connect output to `Search File`.

12. **Google Drive Nodes (Search File & Get Data)**  
    - Create "Google Drive" nodes to list files and download them from the watched folder.  
    - Connect outputs to `Loop Over Items`.

13. **Loop Over Items Node**  
    - Create a "SplitInBatches" node to process files and leads in manageable chunks.  
    - Connect inputs from download nodes and outputs to document loaders or vector stores.

14. **LangChain Document Loader & Text Splitter**  
    - Create nodes to load and split document contents for embedding.  
    - Connect outputs to embeddings nodes.

15. **AI Agent Nodes**  
    - Create LangChain "Agent" nodes named `AI Agent` and `AI Agent1`.  
    - Configure system prompts to define behavior and tool selection rules for company documents and restaurant leads.  
    - Connect inputs from vector store retrieval nodes and chat triggers.

16. **LangChain Chat Trigger**  
    - Create a "Chat Trigger" node for incoming chat messages (e.g., WhatsApp integration).  
    - Configure webhook and outputs to AI Agent nodes.

17. **Chat Model & Memory Nodes**  
    - Create LangChain "Chat Model" nodes with GPT-4o-mini model and Postgres-based chat memory nodes.  
    - Connect inputs and outputs to AI Agents for conversational context.

18. **Supabase Vector Store Retrieval & Reranker Nodes**  
    - Create Supabase vector store retrieval nodes configured in "retrieve-as-tool" mode for company documents and leads.  
    - Create Cohere reranker nodes to reorder retrieval results.  
    - Connect rerankers between retrieval nodes and AI Agents.

19. **WAHA Trigger (Optional)**  
    - If WhatsApp integration is required, create WAHA Trigger node with valid webhook and credentials.  
    - Connect outputs to AI Agent nodes.

20. **Sticky Note Nodes (Optional)**  
    - Add sticky notes for visual documentation in n8n canvas where helpful.

---

## 5. General Notes & Resources

| Note Content                                                                                                                             | Context or Link                                                                                                         |
|------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|
| Workflow title: Automate Cold Calling with Web Scraping, GPT-4o & WhatsApp                                                                | Workflow metadata                                                                                                       |
| Apify API URLs are placeholders and must be replaced with actual scraping endpoint URLs                                                  | Refer to Apify documentation or your configured scraping actor                                                         |
| Google Sheets: Use service account for append/update operations; OAuth2 for triggers                                                     | Service account recommended for automation; OAuth2 for user session-based triggers                                       |
| Supabase vector store used for semantic search and storage of business documents and lead data                                           | Supabase project must have vector extensions and table schemas prepared                                                |
| OpenAI API key required for embedding and chat model nodes; GPT-4o-mini model used                                                        | Ensure sufficient quota and correct model availability                                                                  |
| Cohere API key required for reranker nodes                                                                                              | Trial or paid Cohere account needed; monitor usage                                                                      |
| WhatsApp integration via WAHA node is currently disabled; requires webhook URL and credentials                                           | See https://github.com/devlikeapro/n8n-nodes-waha for setup                                                             |
| System prompt for AI Agent1 defines strict tool usage rules for company vs restaurant lead queries, enforcing accuracy and source citation | Important for maintaining correct AI behavior and compliance                                                           |
| Data cleaning code includes parsing of JSON fields from scraped data and lead scoring based on multiple criteria                         | Critical to adapt if data source structure changes                                                                      |

---

# Disclaimer

The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.

---