 Build an AI-Powered Tech Radar Advisor with SQL DB, RAG, and Routing Agents

https://n8nworkflows.xyz/workflows/-build-an-ai-powered-tech-radar-advisor-with-sql-db--rag--and-routing-agents-3151


#  Build an AI-Powered Tech Radar Advisor with SQL DB, RAG, and Routing Agents

### 1. Workflow Overview

This workflow, titled **"Build an AI-Powered Tech Radar Advisor with SQL DB, RAG, and Routing Agents"**, is designed to create an AI-driven platform that helps organizations analyze and interact with their technology adoption landscape. It leverages data from a ThoughtWorks Tech Radar Google Sheet, transforming it into both a structured MySQL database and a vector database for semantic search. The workflow supports an interactive AI chat interface that intelligently routes user queries to specialized AI agents for precise and context-aware responses.

**Target Use Cases:**
- Tech audit, governance, and strategic technology adoption analysis.
- Interactive AI chat for technology insights across multiple companies.
- Combining structured SQL queries with Retrieval-Augmented Generation (RAG) for deep semantic search.
- Maintaining synchronized data ingestion pipelines from Google Sheets and Google Docs into databases.

**Logical Blocks:**

- **1.1 Data Ingestion and Transformation**
  - Ingest Tech Radar data from Google Sheets.
  - Transform tabular data into paragraph-style text.
  - Update a Google Doc with transformed data.
  - Download updated Google Docs and split content for vector embedding.
  - Insert embeddings into Pinecone vector database.
  - Sync structured data into MySQL database.

- **1.2 AI Chat Query Routing and Processing**
  - Receive user queries via webhook.
  - Use an LLM to determine whether to route the query to the SQL Agent or RAG Agent.
  - Execute the corresponding sub-workflow for SQL or RAG processing.
  - Use an Output Guardrail Agent to validate and refine the AI response.
  - Return the final response to the user.

- **1.3 Scheduled Data Sync**
  - A cron-triggered process to periodically clear and reload the MySQL database with fresh data from Google Sheets.

---

### 2. Block-by-Block Analysis

#### 2.1 Data Ingestion and Transformation

**Overview:**  
This block ingests technology radar data from a Google Sheet, transforms it into a paragraph format suitable for vector embedding, updates a Google Doc with this content, and then processes the document to create vector embeddings stored in Pinecone. Simultaneously, it syncs the structured data into a MySQL database for SQL-based querying.

**Nodes Involved:**  
- Google Sheets - Tech Radar  
- Code - Transform table into rows  
- Google Docs - Update GDoc  
- Google Drive - Doc File Updated  
- Download Doc File From Google Drive  
- Doc File Data Loader  
- Content - Recursive Character Text Splitter  
- Embeddings - Tech Radar Data Embedding  
- Pinecone - Vector Store for Embedding Content  
- MySQL - delete all data  
- Google Sheets - Read TechRadar  
- MySQL - insert all from sheets  

**Node Details:**

- **Google Sheets - Tech Radar**  
  - Type: Google Sheets node  
  - Role: Reads the Tech Radar data from a specific Google Sheet (document ID and sheet name configured).  
  - Inputs: Triggered manually or via cron downstream.  
  - Outputs: Rows of tech radar data as JSON.  
  - Edge Cases: API rate limits, sheet access permissions, empty or malformed data.

- **Code - Transform table into rows**  
  - Type: Code node (JavaScript)  
  - Role: Converts each row of the sheet into a formatted paragraph text block for vector ingestion.  
  - Key Expression: Constructs a multi-line string with fields like name, ring, quadrant, strategic direction, usage by child companies, status, and description.  
  - Inputs: Rows from Google Sheets node.  
  - Outputs: JSON with a `textBlock` field.  
  - Edge Cases: Missing fields, null values, formatting errors.

- **Google Docs - Update GDoc**  
  - Type: Google Docs node  
  - Role: Inserts the transformed paragraph text into a Google Doc, updating the document content.  
  - Configuration: Uses service account authentication; document URL is fixed.  
  - Inputs: Text blocks from the Code node.  
  - Outputs: Confirmation of document update.  
  - Edge Cases: API quota, document access permissions, concurrent edits.

- **Google Drive - Doc File Updated**  
  - Type: Google Drive Trigger node  
  - Role: Watches a specific Google Drive folder for updated documents to trigger downstream vector ingestion.  
  - Inputs: Triggered on file update event every minute.  
  - Outputs: Metadata of updated document.  
  - Edge Cases: Missed events, folder permission issues.

- **Download Doc File From Google Drive**  
  - Type: Google Drive node  
  - Role: Downloads the updated Google Doc file binary content for processing.  
  - Inputs: File metadata from Drive trigger.  
  - Outputs: Binary content of the document.  
  - Edge Cases: File not found, download failures.

- **Doc File Data Loader**  
  - Type: LangChain Document Data Loader node  
  - Role: Loads the binary document content for further processing.  
  - Inputs: Binary document data.  
  - Outputs: Document content for splitting.  
  - Edge Cases: Unsupported file format, corrupted file.

- **Content - Recursive Character Text Splitter**  
  - Type: LangChain Text Splitter node  
  - Role: Splits the document content recursively into chunks (chunk size 1024, overlap 100) for embedding.  
  - Inputs: Document content.  
  - Outputs: Array of text chunks.  
  - Edge Cases: Very large documents, chunk overlap misconfiguration.

- **Embeddings - Tech Radar Data Embedding**  
  - Type: LangChain Embeddings node (Google Gemini)  
  - Role: Generates vector embeddings for each text chunk using Google Gemini embedding model.  
  - Inputs: Text chunks from splitter.  
  - Outputs: Embeddings vectors.  
  - Edge Cases: API limits, embedding failures.

- **Pinecone - Vector Store for Embedding Content**  
  - Type: LangChain Vector Store node (Pinecone)  
  - Role: Inserts embeddings into the Pinecone index named `techradardata`.  
  - Inputs: Embeddings vectors.  
  - Outputs: Confirmation of insertion.  
  - Edge Cases: API key issues, index not found, insertion errors.

- **MySQL - delete all data**  
  - Type: MySQL node  
  - Role: Deletes all existing data from the `techradar` table to prepare for fresh data insertion.  
  - Inputs: Triggered by Cron node.  
  - Outputs: Confirmation of deletion.  
  - Edge Cases: Connection errors, permission issues.

- **Google Sheets - Read TechRadar**  
  - Type: Google Sheets node  
  - Role: Reads the Tech Radar data again for insertion into MySQL.  
  - Inputs: Triggered after deletion.  
  - Outputs: Rows of data.  
  - Edge Cases: Same as previous Google Sheets node.

- **MySQL - insert all from sheets**  
  - Type: MySQL node  
  - Role: Inserts rows from Google Sheets into the `techradar` table with specified columns.  
  - Configuration: Uses `ignore` option to avoid duplicate errors, high priority.  
  - Inputs: Rows from Google Sheets.  
  - Outputs: Confirmation of insertion.  
  - Edge Cases: Data type mismatches, constraint violations.

---

#### 2.2 AI Chat Query Routing and Processing

**Overview:**  
This block handles incoming user chat queries, determines which AI agent (SQL or RAG) is best suited to answer the query, executes the corresponding sub-workflow, and applies an output guardrail to ensure response quality and relevance before returning the answer.

**Nodes Involved:**  
- API Request - Webhook  
- LLM - Determine - Agent Input Router  
- Determine if is 'RAG' (If node)  
- Code - Simplify Mapping to Original Query  
- Codes - Simplify Mapping to Original Query  
- Execute Workflow - RAG Agent  
- Execute Workflow - Sql Agent  
- AI Agent - Output Guardrail  
- API Response - Respond to Webhook  
- User Conversation history  
- AI Agent - Output Guardrail (LangChain Agent node)  
- AI Chat Model - llama3-8b (Groq)  
- AI Chatmodel - Deepseek 32B (Groq)  
- AI Chat Model - QwQ 32b (Groq)  
- AI Agent - RAG (LangChain Agent node)  
- AI Agent - DB Sql Agent (LangChain Agent node, disabled)  

**Node Details:**

- **API Request - Webhook**  
  - Type: Webhook node  
  - Role: Entry point for user chat queries via HTTP POST at `/radar-rag`.  
  - Inputs: External HTTP requests with JSON body containing `chatInput`.  
  - Outputs: User query JSON to routing logic.  
  - Edge Cases: Invalid requests, CORS issues, payload size limits.

- **LLM - Determine - Agent Input Router**  
  - Type: LangChain LLM Chain node  
  - Role: Uses an LLM prompt to classify the user question as best answered by either "SQL" or "RAG" agent.  
  - Configuration: Custom prompt with examples and data schema description.  
  - Inputs: User query from webhook.  
  - Outputs: Text response "SQL" or "RAG".  
  - Edge Cases: Ambiguous queries, LLM API errors, misclassification.

- **Determine if is 'RAG'**  
  - Type: If node  
  - Role: Checks if LLM output equals "RAG" to route accordingly.  
  - Inputs: Output from LLM router.  
  - Outputs: True branch to RAG workflow, false branch to SQL workflow.  
  - Edge Cases: Case sensitivity, empty or unexpected values.

- **Code - Simplify Mapping to Original Query**  
  - Type: Code node  
  - Role: Extracts the original user query from the webhook payload for passing to sub-workflows.  
  - Inputs: Output from If node (RAG branch).  
  - Outputs: JSON with `query` field.  
  - Edge Cases: Missing or malformed webhook data.

- **Codes - Simplify Mapping to Original Query**  
  - Type: Code node  
  - Role: Same as above but for SQL branch.  
  - Inputs: Output from If node (SQL branch).  
  - Outputs: JSON with `query` field.  
  - Edge Cases: Same as above.

- **Execute Workflow - RAG Agent**  
  - Type: Execute Workflow node  
  - Role: Runs the RAG sub-workflow to process the query using vector search.  
  - Configuration: Waits for sub-workflow completion before continuing.  
  - Inputs: Query JSON from code node.  
  - Outputs: RAG agent response.  
  - Edge Cases: Sub-workflow errors, timeout.

- **Execute Workflow - Sql Agent**  
  - Type: Execute Workflow node  
  - Role: Runs the SQL sub-workflow to process the query using SQL database.  
  - Configuration: Waits for sub-workflow completion before continuing.  
  - Inputs: Query JSON from code node.  
  - Outputs: SQL agent response.  
  - Edge Cases: Sub-workflow errors, timeout.

- **AI Agent - Output Guardrail**  
  - Type: LangChain Agent node  
  - Role: Validates and refines the answer from either agent to ensure it is on-topic, accurate, and aligned with strategic direction.  
  - Configuration: System message with strict guardrails and user question context. Uses Groq llama3-8b model.  
  - Inputs: Output from RAG or SQL agent workflows and original user question.  
  - Outputs: Final validated response.  
  - Edge Cases: Over-filtering, hallucination, API errors.

- **API Response - Respond to Webhook**  
  - Type: Respond to Webhook node  
  - Role: Sends the final AI response back to the user as HTTP response.  
  - Inputs: Output from Output Guardrail agent.  
  - Outputs: HTTP response.  
  - Edge Cases: Response size limits, connection issues.

- **User Conversation history**  
  - Type: LangChain Memory Buffer Window node  
  - Role: Stores conversation history keyed by user query for context retention.  
  - Inputs: User query and AI response.  
  - Outputs: Memory context for Output Guardrail.  
  - Edge Cases: Memory overflow, session key collisions.

- **AI Chat Model - llama3-8b**  
  - Type: LangChain LLM Chat node (Groq)  
  - Role: Language model used by Output Guardrail agent.  
  - Inputs: Prompt from Output Guardrail node.  
  - Outputs: Refined AI response.  
  - Edge Cases: API limits, model availability.

- **AI Chatmodel - Deepseek 32B**  
  - Type: LangChain LLM Chat node (Groq)  
  - Role: Language model used by LLM Determine router node.  
  - Inputs: User question prompt.  
  - Outputs: Classification response.  
  - Edge Cases: Same as above.

- **AI Chat Model - QwQ 32b**  
  - Type: LangChain LLM Chat node (Groq)  
  - Role: Language model used by RAG agent sub-workflow (disabled in main workflow).  
  - Inputs: Query prompt.  
  - Outputs: RAG agent response.  
  - Edge Cases: Same as above.

- **AI Agent - RAG**  
  - Type: LangChain Agent node  
  - Role: Executes vector search tool to answer user queries semantically.  
  - Inputs: Query from Execute Workflow node.  
  - Outputs: Answer from vector database.  
  - Edge Cases: Vector index availability, retrieval errors.

- **AI Agent - DB Sql Agent** (disabled)  
  - Type: LangChain Agent node  
  - Role: Executes SQL queries on structured data to answer user queries.  
  - Inputs: Query from Execute Workflow node.  
  - Outputs: SQL query results.  
  - Edge Cases: SQL errors, injection risks.

---

#### 2.3 Scheduled Data Sync

**Overview:**  
This block periodically triggers a refresh of the MySQL database by deleting all existing data and reloading it from the Google Sheets source, ensuring the SQL agent has up-to-date information.

**Nodes Involved:**  
- Cron  
- MySQL - delete all data  
- Google Sheets - Read TechRadar  
- MySQL - insert all from sheets  

**Node Details:**

- **Cron**  
  - Type: Cron node  
  - Role: Triggers the data sync process monthly at 22:00 hours.  
  - Inputs: Time-based trigger.  
  - Outputs: Triggers MySQL delete node.  
  - Edge Cases: Missed triggers due to downtime.

- **MySQL - delete all data**  
  - See details in 2.1.

- **Google Sheets - Read TechRadar**  
  - See details in 2.1.

- **MySQL - insert all from sheets**  
  - See details in 2.1.

---

### 3. Summary Table

| Node Name                         | Node Type                               | Functional Role                                  | Input Node(s)                       | Output Node(s)                      | Sticky Note                                                                                                                        |
|----------------------------------|---------------------------------------|-------------------------------------------------|-----------------------------------|-----------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| Download Doc File From Google Drive | Google Drive                          | Downloads updated Google Doc for vector ingestion | Google Drive - Doc File Updated    | Doc File Data Loader               | #2. Convert Document into Vector database (RAG ingestion)                                                                         |
| Doc File Data Loader              | LangChain Document Data Loader         | Loads binary doc content for processing          | Download Doc File From Google Drive | Pinecone - Vector Store for Embedding Content | #2. Convert Document into Vector database (RAG ingestion)                                                                         |
| Sticky Note                      | Sticky Note                           | Explains rag-friendly document transformation    |                                   |                                   | #1.Rag-friendly Document: Convert Tech Radar Gsheet into GDoc paragraphs for vector DB ingestion.                                 |
| Cron                            | Cron                                  | Triggers monthly data sync                        |                                   | MySQL - delete all data           |                                                                                                                                   |
| MySQL - delete all data          | MySQL                                 | Deletes all data in techradar table               | Cron, Google Sheets - Read TechRadar | Google Sheets - Read TechRadar    |                                                                                                                                   |
| MySQL - insert all from sheets   | MySQL                                 | Inserts fresh data from Google Sheets into MySQL | Google Sheets - Read TechRadar    |                                   |                                                                                                                                   |
| Sticky Note1                    | Sticky Note                           | Setup instructions for API keys, Pinecone, etc.  |                                   |                                   | Detailed setup steps for Google Cloud, Pinecone, Google Drive, and n8n credentials.                                                |
| Google Sheets - Tech Radar       | Google Sheets                         | Reads Tech Radar data from Google Sheets          |                                   | Code - Transform table into rows  |                                                                                                                                   |
| Code - Transform table into rows | Code (JavaScript)                     | Transforms sheet rows into paragraph text blocks  | Google Sheets - Tech Radar        | Google Docs - Update GDoc         |                                                                                                                                   |
| Google Docs - Update GDoc        | Google Docs                          | Updates Google Doc with transformed text          | Code - Transform table into rows  |                                   |                                                                                                                                   |
| Sticky Note2                    | Sticky Note                           | Explains vector DB ingestion from document updates |                                   |                                   | #2. Convert Document into Vector database (RAG ingestion)                                                                         |
| Google Drive - Doc File Updated  | Google Drive Trigger                  | Watches Google Drive folder for doc updates       |                                   | Download Doc File From Google Drive |                                                                                                                                   |
| Content - Recursive Character Text Splitter | LangChain Text Splitter               | Splits document content into chunks for embedding | Doc File Data Loader              | Embeddings - Tech Radar Data Embedding |                                                                                                                                   |
| Embeddings - Tech Radar Data Embedding | LangChain Embeddings (Google Gemini) | Generates embeddings for text chunks              | Content - Recursive Character Text Splitter | Pinecone - Vector Store for Embedding Content |                                                                                                                                   |
| Pinecone - Vector Store for Embedding Content | LangChain Vector Store (Pinecone)     | Inserts embeddings into Pinecone vector DB         | Embeddings - Tech Radar Data Embedding |                                   |                                                                                                                                   |
| Google Sheets - Read TechRadar   | Google Sheets                         | Reads Tech Radar data for MySQL insertion          | MySQL - delete all data           | MySQL - insert all from sheets    |                                                                                                                                   |
| Sticky Note3                    | Sticky Note                           | Explains syncing Gsheet into MySQL DB              |                                   |                                   | #3. Convert Gsheet into MYSQL database for SQL agent interaction.                                                                 |
| Sticky Note4                    | Sticky Note                           | Blank/placeholder                                  |                                   |                                   |                                                                                                                                   |
| Sticky Note11                   | Sticky Note                           | Setup label                                        |                                   |                                   | SETUP                                                                                                                             |
| Code - Simplify Mapping to Original Query | Code (JavaScript)                     | Extracts original user query for RAG agent         | Determine if is 'RAG'             | Execute Workflow - RAG Agent      |                                                                                                                                   |
| Codes - Simplify Mapping to Original Query | Code (JavaScript)                     | Extracts original user query for SQL agent         | Determine if is 'RAG'             | Execute Workflow - Sql Agent      |                                                                                                                                   |
| Execute Workflow - Sql Agent     | Execute Workflow                     | Runs SQL agent sub-workflow                         | Codes - Simplify Mapping to Original Query | AI Agent - Output Guardrail       |                                                                                                                                   |
| Execute Workflow - RAG Agent     | Execute Workflow                     | Runs RAG agent sub-workflow                         | Code - Simplify Mapping to Original Query | AI Agent - Output Guardrail       |                                                                                                                                   |
| AI Agent - Output Guardrail      | LangChain Agent                     | Validates and refines AI responses                  | Execute Workflow - Sql Agent, Execute Workflow - RAG Agent | API Response - Respond to Webhook |                                                                                                                                   |
| API Response - Respond to Webhook | Respond to Webhook                   | Sends final AI response to user                     | AI Agent - Output Guardrail       |                                   |                                                                                                                                   |
| User Conversation history        | LangChain Memory Buffer Window       | Stores conversation history for context             | AI Agent - Output Guardrail       | AI Agent - Output Guardrail       |                                                                                                                                   |
| AI Chat Model - llama3-8b        | LangChain LLM Chat (Groq)             | Language model for Output Guardrail agent           | AI Agent - Output Guardrail       |                                   |                                                                                                                                   |
| AI Chatmodel - Deepseek 32B      | LangChain LLM Chat (Groq)             | Language model for LLM Determine router             | LLM - Determine - Agent Input Router |                                   |                                                                                                                                   |
| AI Chat Model - QwQ 32b          | LangChain LLM Chat (Groq)             | Language model for RAG agent (disabled)              | AI Agent - RAG                   |                                   |                                                                                                                                   |
| AI Agent - RAG                  | LangChain Agent                     | Executes vector search tool for RAG queries          | Execute Workflow - RAG Agent      | AI Agent - Output Guardrail       |                                                                                                                                   |
| AI Agent - DB Sql Agent          | LangChain Agent (disabled)            | Executes SQL queries for SQL agent                   | Execute Workflow - Sql Agent      | AI Agent - Output Guardrail       |                                                                                                                                   |
| LLM - Determine - Agent Input Router | LangChain Chain LLM                  | Classifies user query to route to SQL or RAG agent  | API Request - Webhook             | Determine if is 'RAG'             |                                                                                                                                   |
| Determine if is 'RAG'            | If                                   | Routes query based on LLM classification             | LLM - Determine - Agent Input Router | Code - Simplify Mapping to Original Query, Codes - Simplify Mapping to Original Query |                                                                                                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Sheets node ("Google Sheets - Tech Radar")**  
   - Operation: Read rows from Google Sheet  
   - Document ID: Set to your Tech Radar Google Sheet ID  
   - Sheet Name: Set to the first sheet (gid=0)  
   - Credentials: Google Sheets OAuth2  

2. **Add Code node ("Code - Transform table into rows")**  
   - Purpose: Convert each row into a formatted paragraph text block  
   - JavaScript: Map each row to a multi-line string with fields (name, ring, quadrant, etc.)  
   - Input: Connect from Google Sheets node  

3. **Add Google Docs node ("Google Docs - Update GDoc")**  
   - Operation: Update document by inserting text  
   - Document URL: Your target Google Doc URL for storing transformed data  
   - Authentication: Use Google Service Account credentials  
   - Input: Connect from Code node  

4. **Add Google Drive Trigger node ("Google Drive - Doc File Updated")**  
   - Event: File updated  
   - Folder to watch: Set to your Google Drive folder containing the Google Doc  
   - Polling: Every minute  
   - Credentials: Google Drive OAuth2  

5. **Add Google Drive node ("Download Doc File From Google Drive")**  
   - Operation: Download file by ID (from trigger)  
   - Input: Connect from Google Drive Trigger node  

6. **Add LangChain Document Data Loader node ("Doc File Data Loader")**  
   - Data Type: Binary  
   - Binary Field: Use the field containing downloaded document content  
   - Input: Connect from Download Doc File node  

7. **Add LangChain Text Splitter node ("Content - Recursive Character Text Splitter")**  
   - Chunk Size: 1024  
   - Chunk Overlap: 100  
   - Input: Connect from Document Data Loader node  

8. **Add LangChain Embeddings node ("Embeddings - Tech Radar Data Embedding")**  
   - Model: Google Gemini text-embedding-004  
   - Credentials: Google Gemini API key  
   - Input: Connect from Text Splitter node  

9. **Add LangChain Vector Store node ("Pinecone - Vector Store for Embedding Content")**  
   - Mode: Insert  
   - Pinecone Index: Use your Pinecone index (e.g., "techradardata")  
   - Credentials: Pinecone API key  
   - Input: Connect from Embeddings node  

10. **Add Cron node ("Cron")**  
    - Schedule: Monthly at 22:00 hours  
    - Output: Connect to MySQL delete node  

11. **Add MySQL node ("MySQL - delete all data")**  
    - Operation: Delete all data from `techradar` table  
    - Credentials: MySQL connection to your techradar database  
    - Input: Connect from Cron node  

12. **Add Google Sheets node ("Google Sheets - Read TechRadar")**  
    - Same configuration as step 1  
    - Input: Connect from MySQL delete node  

13. **Add MySQL node ("MySQL - insert all from sheets")**  
    - Operation: Insert rows into `techradar` table  
    - Columns: name, ring, quadrant, isStrategicDirection, isUsedByChildCompany1, isUsedByChildCompany2, isUsedByChildCompany3, isNew, status, description  
    - Options: Ignore duplicates, high priority  
    - Input: Connect from Google Sheets read node  

14. **Add Webhook node ("API Request - Webhook")**  
    - HTTP Method: POST  
    - Path: `/radar-rag`  
    - Response Mode: Respond with node  
    - Allowed Origins: * (for CORS)  

15. **Add LangChain Chain LLM node ("LLM - Determine - Agent Input Router")**  
    - Model: Groq Deepseek 32B or equivalent  
    - Prompt: Custom prompt to classify query as "SQL" or "RAG"  
    - Input: Connect from Webhook node  

16. **Add If node ("Determine if is 'RAG'")**  
    - Condition: Check if LLM output equals "RAG" (case sensitive)  
    - Input: Connect from LLM Determine node  

17. **Add Code node ("Code - Simplify Mapping to Original Query")**  
    - Purpose: Extract original user query for RAG agent  
    - Input: Connect from If node (true branch)  

18. **Add Code node ("Codes - Simplify Mapping to Original Query")**  
    - Purpose: Extract original user query for SQL agent  
    - Input: Connect from If node (false branch)  

19. **Add Execute Workflow node ("Execute Workflow - RAG Agent")**  
    - Workflow ID: Your RAG sub-workflow ID  
    - Wait for completion: True  
    - Input: Connect from Code node (RAG branch)  

20. **Add Execute Workflow node ("Execute Workflow - Sql Agent")**  
    - Workflow ID: Your SQL sub-workflow ID  
    - Wait for completion: True  
    - Input: Connect from Code node (SQL branch)  

21. **Add LangChain Agent node ("AI Agent - Output Guardrail")**  
    - Model: Groq llama3-8b or equivalent  
    - System Message: Guardrails to keep answers on-topic and accurate  
    - Input: Connect from both Execute Workflow nodes (merge outputs)  

22. **Add LangChain Memory Buffer Window node ("User Conversation history")**  
    - Session Key: Use user query as custom key  
    - Input: Connect from Webhook node and output guardrail node for context  

23. **Add Respond to Webhook node ("API Response - Respond to Webhook")**  
    - Respond with: All incoming items  
    - Input: Connect from AI Agent - Output Guardrail node  

24. **Configure Credentials**  
    - Google Sheets OAuth2  
    - Google Drive OAuth2  
    - Google Service Account for Google Docs  
    - Google Gemini (PaLM) API key  
    - Pinecone API key  
    - MySQL database credentials  
    - Groq API key for Groq LLM models  

25. **Sub-Workflow Setup**  
    - **SQL Agent Sub-Workflow:**  
      - Accepts `query` input parameter  
      - Uses MySQL nodes and LangChain Agent to execute SQL queries and return results  
    - **RAG Agent Sub-Workflow:**  
      - Accepts `query` input parameter  
      - Uses Pinecone vector store and LangChain Agent to perform semantic search and return results  

26. **Testing and Validation**  
    - Test data ingestion by manually triggering the Cron node or updating Google Sheets  
    - Test chat endpoint by sending POST requests with sample queries  
    - Verify routing logic correctly directs queries to SQL or RAG agents  
    - Validate output guardrail responses for accuracy and relevance  

---

This detailed reference document provides a comprehensive understanding of the workflow’s structure, logic, and configuration to facilitate reproduction, modification, and troubleshooting.