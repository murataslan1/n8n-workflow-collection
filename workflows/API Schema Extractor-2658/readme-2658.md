API Schema Extractor

https://n8nworkflows.xyz/workflows/api-schema-extractor-2658


# API Schema Extractor

### 1. Workflow Overview

**Purpose:**  
The "API Schema Extractor" workflow automates the multi-stage process of discovering, extracting, and generating API schemas from various online services. It is designed to support teams and projects that require systematic cataloging and documentation of APIs by combining web search, web scraping, vector-based document storage, and large language model (LLM) processing.

**Target Use Cases:**  
- Cataloging APIs for development teams  
- API documentation automation  
- Creating standardized API schema collections  
- API discovery from service websites and documentation  

**Logical Blocks:**  
- **1.1 Input & Event Routing:** Accepts manual triggers or events, routes tasks based on workflow stages (research, extraction, generation).  
- **1.2 Stage 1 - Research:** Fetches pending services, performs Google search for API docs, scrapes webpages, filters relevant content, stores embeddings in vector store, updates progress in Google Sheet.  
- **1.3 Stage 2 - Extraction:** Processes services with successful research, queries vector database for products and API docs, extracts API operations via Gemini LLM, stores operations in Google Sheet, updates status.  
- **1.4 Stage 3 - Generation:** Retrieves API operations for services ready for schema generation, aggregates and transforms operations into custom JSON schema, uploads the schema to Google Drive, updates final status in Google Sheet.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Input & Event Routing

**Overview:**  
Handles manual trigger or external event input, extracts execution metadata, and routes workflow execution to one of three main stages: research, extraction, or generation.

**Nodes Involved:**  
- When clicking ‘Test workflow’ (Manual Trigger)  
- Execution Data  
- EventRouter (Switch)  

**Node Details:**  
- **When clicking ‘Test workflow’**  
  - Type: Manual Trigger  
  - Role: Initiates workflow manually  
  - Config: No parameters  
  - Output: Triggers next node  
  - Edge Cases: None typical, manual trigger requires user interaction  
- **Execution Data**  
  - Type: Execution Data (set values)  
  - Role: Extracts and saves eventType, executedById, service from input JSON  
  - Key Expressions: `$json.eventType`, `$json.executedById`, `$json.data.service`  
  - Edge Cases: Missing keys may cause expression failures  
- **EventRouter**  
  - Type: Switch  
  - Role: Routes flow based on `eventType` field  
  - Conditions: Matches `research`, `extract`, or `generate` values  
  - Outputs: Three branches directing to corresponding workflow stages  
  - Edge Cases: Unexpected or missing `eventType` halts routing  

---

#### 2.2 Stage 1 - Research

**Overview:**  
Fetches services pending research from Google Sheets, performs a Google search for API documentation using Apify’s scraper, scrapes relevant webpage contents, filters and deduplicates results, embeds content into Qdrant vector store, and updates progress.

**Nodes Involved:**  
- Get All Research (Google Sheets)  
- All Research Done? (If)  
- For Each Research… (SplitInBatches)  
- Research Pending (Google Sheets Update)  
- Research Event (Set)  
- Research (Execute Workflow)  
- Web Search For API Schema (HTTP Request)  
- Has Results? (If)  
- Results to List (SplitOut)  
- Filter Results (Filter)  
- Remove Dupes (RemoveDuplicates)  
- Scrape Webpage Contents (HTTP Request)  
- Successful Runs (Filter)  
- Has Results?1 (If)  
- Has API Documentation? (Text Classifier - LLM)  
- Has Results?3 (If)  
- Set Embedding Variables (Set)  
- For Each Document… (SplitInBatches)  
- Content Chunking @ 50k Chars (Set)  
- Split Out Chunks (SplitOut)  
- Default Data Loader (Document Loader)  
- Embeddings Google Gemini (Embeddings)  
- Store Document Embeddings (Vector Store Qdrant)  
- Research Result / Research Error (Google Sheets Update)  
- Wait (Wait)  

**Node Details Highlights:**  
- **Get All Research:** Reads services with empty `Stage 1 - Research` status (pending research).  
- **Research Pending:** Updates Google Sheet row marking research as "pending".  
- **Research Event:** Packages research event JSON for sub-workflow.  
- **Research:** Executes sub-workflow for each service in research stage; waits for completion.  
- **Web Search For API Schema:** Uses Apify act to perform Google search with tailored search terms filtering for API docs.  
- **Has Results?:** Checks if search results exist; branches accordingly.  
- **Filter Results & Remove Dupes:** Filters normal type results and removes duplicates based on URL.  
- **Scrape Webpage Contents:** Uses Apify web scraper act to extract page title and cleaned body HTML; batches 2 pages every 30 seconds.  
- **Has API Documentation?:** Uses Gemini LLM to classify if scraped content contains API schema documentation.  
- **Set Embedding Variables:** Prepares metadata and content for embedding.  
- **Default Data Loader:** Prepares data chunks for embedding ingestion.  
- **Embeddings Google Gemini:** Generates embeddings for chunked content.  
- **Store Document Embeddings:** Inserts embeddings into Qdrant collection.  
- **Research Result / Research Error:** Updates Google Sheet with "ok" or "error" status.  
- **Wait:** Adds delay to control execution pacing.  

**Edge Cases & Failure Types:**  
- Google Sheets read/write errors (auth, permission)  
- Apify API failures or rate limits  
- Empty or missing search results  
- LLM classification false negatives or timeouts  
- Vector store insert failures  
- Workflow sub-execution errors or timeouts  

---

#### 2.3 Stage 2 - Extraction

**Overview:**  
Processes services with successful research, queries Qdrant vector database to identify products and solutions, queries again for relevant API documentation, uses Gemini LLM to extract API operations, stores operations in Google Sheets, and updates extraction status.

**Nodes Involved:**  
- Get All Extract (Google Sheets)  
- All Extract Done? (If)  
- For Each Extract… (SplitInBatches)  
- Extract Pending (Google Sheets Update)  
- Extract Event (Set)  
- Extract (Execute Workflow)  
- Query Templates (Set)  
- Template to List (SplitOut)  
- Identify Service Products (Information Extractor - LLM)  
- Extract API Templates (Set)  
- For Each Template… (SplitInBatches)  
- Search in Relevant Docs (Vector Store Qdrant Load)  
- Combine Docs (Aggregate)  
- Query & Docs (Set)  
- Google Gemini Chat Model2 (LLM Chat)  
- For Each Template…1 (SplitInBatches)  
- Extract API Operations (Information Extractor - LLM)  
- Search in Relevant Docs1 (Vector Store Qdrant Load)  
- Combine Docs1 (Aggregate)  
- Query & Docs1 (Set)  
- Embeddings Google Gemini1 & Embeddings Google Gemini2 (Embeddings)  
- Merge Lists (Code)  
- Has Operations? (If)  
- Remove Duplicates (RemoveDuplicates)  
- Append Row (Google Sheets Append)  
- Extract Result / Extract Error (Google Sheets Update)  
- Wait1 (Wait)  

**Node Details Highlights:**  
- **Get All Extract:** Fetches services with research stage "ok" but extraction stage empty.  
- **Extract Pending:** Marks extraction as "pending" in Google Sheets.  
- **Extract Event:** Forms extract event JSON for sub-workflow trigger.  
- **Query Templates & Template to List:** Holds and splits predefined question templates to guide LLM queries.  
- **Identify Service Products:** Extracts product or solution names and descriptions from vector store documents using Gemini LLM.  
- **Extract API Templates:** Builds API query strings referencing products/solutions.  
- **Search in Relevant Docs:** Queries vector store for documents matching API-related queries.  
- **Extract API Operations:** Uses Gemini LLM with system prompt to extract API endpoints, operations, descriptions, methods from docs.  
- **Merge Lists & Remove Duplicates:** Consolidates extracted operations and removes duplicates by method and URL.  
- **Append Row:** Appends extracted API operations to a dedicated Google Sheet tab.  
- **Extract Result / Extract Error:** Updates extraction status in Google Sheet.  
- **Wait1:** Controls pacing of extraction batch processing.  

**Edge Cases & Failure Types:**  
- Empty or no relevant documents in vector store  
- LLM extraction yielding empty or invalid data  
- Google Sheets permission or API quota issues  
- Vector store query or load errors  
- Sub-workflow execution failures  

---

#### 2.4 Stage 3 - Generation

**Overview:**  
Fetches services with completed extraction, retrieves all API operations, composes a structured JSON schema grouping operations by resource, uploads the schema file to Google Drive, and updates final status in Google Sheet.

**Nodes Involved:**  
- Get All Generate (Google Sheets)  
- All Generate Done? (If)  
- For Each Generate… (SplitInBatches)  
- Generate Pending (Google Sheets Update)  
- Generate Event (Set)  
- Generate (Execute Workflow)  
- Get API Operations (Google Sheets Read)  
- Contruct JSON Schema (Code)  
- Set Upload Fields (Set)  
- Upload to Drive (Google Drive Upload)  
- Response OK2 (Set)  
- Generate Result / Generate Error (Google Sheets Update)  
- Wait2 (Wait)  

**Node Details Highlights:**  
- **Get All Generate:** Reads services with research and extraction marked "ok" but generation stage empty.  
- **Generate Pending:** Marks generation as "pending" in Google Sheets.  
- **Generate Event:** Forms generate event JSON for sub-workflow execution.  
- **Get API Operations:** Reads all API operations for the service from Google Sheets.  
- **Contruct JSON Schema:** Aggregates API operations by resource, formats operations with capitalized labels and shortened descriptions, produces a JSON object representing a custom schema.  
- **Set Upload Fields:** Prepares filename and stringifies JSON schema for upload.  
- **Upload to Drive:** Creates a new text file in specified Google Drive folder with the JSON schema.  
- **Generate Result / Generate Error:** Updates Google Sheet with filename and status.  
- **Wait2:** Controls pacing between generation batches.  

**Edge Cases & Failure Types:**  
- Google Sheets read/write or filtering errors  
- Google Drive upload permission or quota issues  
- Code node JSON construction errors due to invalid input  
- Sub-workflow errors or timeouts  

---

### 3. Summary Table

| Node Name                    | Node Type                         | Functional Role                                 | Input Node(s)                          | Output Node(s)                      | Sticky Note                                                                                              |
|------------------------------|----------------------------------|------------------------------------------------|--------------------------------------|-----------------------------------|--------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger                   | Entry point for manual workflow launch          | -                                    | Execution Data                     |                                                                                                        |
| Execution Data               | Execution Data                   | Extracts event metadata                          | When clicking ‘Test workflow’         | EventRouter                       |                                                                                                        |
| EventRouter                 | Switch                           | Routes to research, extraction, or generation   | Execution Data                       | Web Search For API Schema, Query Templates, Get API Operations |                                                                                                        |
| Get All Research            | Google Sheets                   | Fetches services pending research                | When clicking ‘Test workflow’         | All Research Done?                 |                                                                                                        |
| All Research Done?          | If                              | Checks if any research pending                   | Get All Research                     | For Each Research..., Get All Extract |                                                                                                        |
| For Each Research...        | SplitInBatches                  | Processes each service for research              | All Research Done?                   | Research Pending, Research Event  |                                                                                                        |
| Research Pending            | Google Sheets                   | Marks research stage as pending                   | For Each Research...                 | Research                          |                                                                                                        |
| Research Event              | Set                             | Creates research event JSON                       | For Each Research...                 | Research                         |                                                                                                        |
| Research                   | Execute Workflow                | Runs research sub-workflow                        | Research Event                      | Research Result, Research Error   |                                                                                                        |
| Web Search For API Schema  | HTTP Request                   | Uses Apify to perform Google search              | EventRouter (research)              | Has Results?                     |                                                                                                        |
| Has Results?               | If                              | Checks if search results exist                    | Web Search For API Schema           | Results to List, Response Empty  |                                                                                                        |
| Results to List            | SplitOut                       | Splits search results                             | Has Results?                       | Filter Results                    |                                                                                                        |
| Filter Results             | Filter                         | Filters normal type results                       | Results to List                    | Remove Dupes                    |                                                                                                        |
| Remove Dupes               | RemoveDuplicates               | Removes duplicate URLs                            | Filter Results                    | Scrape Webpage Contents          |                                                                                                        |
| Scrape Webpage Contents    | HTTP Request                   | Uses Apify scraper to read page contents          | Remove Dupes                      | Successful Runs                   |                                                                                                        |
| Successful Runs            | Filter                         | Filters only successful scrapes                   | Scrape Webpage Contents           | Has Results?1                    |                                                                                                        |
| Has Results?1              | If                              | Checks if scraped content exists                  | Successful Runs                   | Has API Documentation?, Response Scrape Error |                                                                                                        |
| Has API Documentation?     | Text Classifier (LLM)          | Classifies if page contains API docs              | Has Results?1                    | Has Results?3                   |                                                                                                        |
| Has Results?3              | If                              | Checks if any docs with API docs                   | Has API Documentation?           | Set Embedding Variables, Response No API Docs |                                                                                                        |
| Set Embedding Variables    | Set                             | Prepares fields for embedding                      | Has Results?3                    | For Each Document...              |                                                                                                        |
| For Each Document...       | SplitInBatches                  | Processes each document chunk                      | Set Embedding Variables           | Response OK, Content Chunking @ 50k Chars |                                                                                                        |
| Content Chunking @ 50k Chars | Set                           | Splits content into 50k char chunks               | For Each Document...              | Split Out Chunks                 |                                                                                                        |
| Split Out Chunks           | SplitOut                       | Splits array of chunks                             | Content Chunking @ 50k Chars       | Store Document Embeddings        |                                                                                                        |
| Default Data Loader        | Document Loader (Langchain)     | Loads chunked data for embedding                   | Recursive Character Text Splitter1 | Store Document Embeddings        |                                                                                                        |
| Embeddings Google Gemini   | Embeddings (Langchain)          | Generates vector embeddings                         | Default Data Loader               | Store Document Embeddings        |                                                                                                        |
| Store Document Embeddings | Vector Store Qdrant             | Inserts embeddings into Qdrant                      | Embeddings Google Gemini          | For Each Document...              |                                                                                                        |
| Research Result            | Google Sheets Update            | Updates research status as "ok"                     | Research                          | Wait                            |                                                                                                        |
| Research Error             | Google Sheets Update            | Updates research status as "error"                  | Research                          | Wait                            |                                                                                                        |
| Wait                      | Wait                           | Controls pacing between batches                     | Research Result, Research Error   | For Each Research...             |                                                                                                        |
| Get All Extract            | Google Sheets                   | Fetches services pending extraction                 | All Research Done?                | All Extract Done?                |                                                                                                        |
| All Extract Done?          | If                              | Checks if extraction is complete                    | Get All Extract                  | For Each Extract..., Get All Generate |                                                                                                        |
| For Each Extract...        | SplitInBatches                  | Processes each service for extraction               | All Extract Done?                | Extract Pending, Extract Event    |                                                                                                        |
| Extract Pending            | Google Sheets Update            | Marks extraction stage as pending                    | For Each Extract...              | Extract                         |                                                                                                        |
| Extract Event              | Set                             | Creates extraction event JSON                        | For Each Extract...              | Extract                         |                                                                                                        |
| Extract                   | Execute Workflow                | Runs extraction sub-workflow                         | Extract Event                   | Extract Result, Extract Error    |                                                                                                        |
| Extract Result            | Google Sheets Update            | Updates extraction status as "ok"                    | Extract                        | Wait1                          |                                                                                                        |
| Extract Error             | Google Sheets Update            | Updates extraction status as "error"                 | Extract                        | Wait1                          |                                                                                                        |
| Wait1                     | Wait                           | Controls pacing between extraction batches           | Extract Result, Extract Error   | For Each Extract...             |                                                                                                        |
| Query Templates           | Set                             | Holds question templates for LLM queries              | EventRouter (extraction)        | Template to List                |                                                                                                        |
| Template to List          | SplitOut                       | Splits query templates into individual queries        | Query Templates                | For Each Template...            |                                                                                                        |
| For Each Template...      | SplitInBatches                  | Processes each query template                          | Query & Docs                   | Identify Service Products, Search in Relevant Docs |                                                                                                        |
| Identify Service Products | Information Extractor (LLM)     | Extracts service products and descriptions             | For Each Template...            | Extract API Templates           |                                                                                                        |
| Extract API Templates     | Set                             | Builds API query strings referencing products          | Identify Service Products       | For Each Template...1           |                                                                                                        |
| For Each Template...1     | SplitInBatches                  | Processes each API query template                       | Query & Docs1                  | Extract API Operations, Search in Relevant Docs1 |                                                                                                        |
| Search in Relevant Docs   | Vector Store Qdrant Load        | Queries vector store for relevant docs with filters    | For Each Template...            | Combine Docs                   |                                                                                                        |
| Combine Docs              | Aggregate                      | Aggregates all retrieved documents                      | Search in Relevant Docs         | Query & Docs                   |                                                                                                        |
| Query & Docs              | Set                             | Prepares query and documents for LLM processing         | Combine Docs                   | For Each Template...            |                                                                                                        |
| Google Gemini Chat Model2 | LLM Chat (Gemini)               | Processes LLM queries for service products              | For Each Template...1           | Extract API Operations          |                                                                                                        |
| Extract API Operations    | Information Extractor (LLM)     | Extracts API operations and endpoints                     | For Each Template...1           | Merge Lists                   |                                                                                                        |
| Merge Lists               | Code                           | Flattens and merges extracted operation lists            | Extract API Operations          | Has Operations?               |                                                                                                        |
| Has Operations?           | If                              | Checks if any API operations found                        | Merge Lists                   | Remove Duplicates, Response Empty1 |                                                                                                        |
| Remove Duplicates         | RemoveDuplicates               | Removes duplicate API operations by method and URL       | Has Operations?                | Append Row                    |                                                                                                        |
| Append Row                | Google Sheets Append           | Appends extracted operations to Google Sheet             | Remove Duplicates             | Response OK1                 |                                                                                                        |
| Response OK1              | Set                             | Sets successful response flag                            | Append Row                   | Wait1                          |                                                                                                        |
| Response Empty1           | Set                             | Sets flag for empty extraction result                     | Has Operations?               | Wait1                          |                                                                                                        |
| Get All Generate          | Google Sheets                   | Fetches services ready for schema generation              | All Extract Done?             | All Generate Done?             |                                                                                                        |
| All Generate Done?        | If                              | Checks if generation is complete                           | Get All Generate             | For Each Generate..., (empty)  |                                                                                                        |
| For Each Generate...      | SplitInBatches                  | Processes each service for schema generation               | All Generate Done?            | Generate Pending              |                                                                                                        |
| Generate Pending          | Google Sheets Update            | Marks generation stage as pending                           | For Each Generate...          | Generate                     |                                                                                                        |
| Generate Event            | Set                             | Creates generation event JSON                              | For Each Generate...          | Generate                     |                                                                                                        |
| Generate                  | Execute Workflow                | Runs generation sub-workflow                                | Generate Event               | Generate Result, Generate Error |                                                                                                        |
| Get API Operations        | Google Sheets                   | Reads all API operations for a service                      | EventRouter (generate)        | Contruct JSON Schema          |                                                                                                        |
| Contruct JSON Schema      | Code                           | Aggregates operations into JSON schema grouped by resource | Get API Operations            | Set Upload Fields           |                                                                                                        |
| Set Upload Fields         | Set                             | Prepares filename and JSON string for upload                | Contruct JSON Schema          | Upload to Drive             |                                                                                                        |
| Upload to Drive           | Google Drive                   | Uploads JSON schema file to Google Drive                     | Set Upload Fields             | Response OK2                |                                                                                                        |
| Response OK2              | Set                             | Sets successful response with file info                      | Upload to Drive               | Generate Result             |                                                                                                        |
| Generate Result           | Google Sheets Update            | Updates generation status and file location                   | Generate                      | Wait2                      |                                                                                                        |
| Generate Error            | Google Sheets Update            | Updates generation status as error                            | Generate                      | Wait2                      |                                                                                                        |
| Wait2                     | Wait                           | Controls pacing for generation batches                        | Generate Result, Generate Error | For Each Generate...         |                                                                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node:**  
   - Type: Manual Trigger  
   - Purpose: To start workflow manually.

2. **Add Execution Data Node:**  
   - Extract `eventType`, `executedById`, and `service` from trigger input.

3. **Add Switch Node (EventRouter):**  
   - Route based on `eventType` field: `research`, `extract`, `generate`.  
   - Connect Execution Data output to this node.

---

#### Stage 1 - Research

4. **Add Google Sheets Node (Get All Research):**  
   - Operation: Read rows where `Stage 1 - Research` is empty (pending).  
   - Credentials: Google Sheets OAuth2.  
   - Connect EventRouter `research` output.

5. **Add If Node (All Research Done?):**  
   - Condition: Input empty? Branch accordingly.

6. **Add SplitInBatches Node (For Each Research…):**  
   - Process each service row one at a time.

7. **Add Google Sheets Node (Research Pending):**  
   - Operation: Update row, set `Stage 1 - Research` to "pending".

8. **Add Set Node (Research Event):**  
   - Compose JSON with eventType `research`, service, URL, row_number, collection.

9. **Add Execute Workflow Node (Research):**  
   - Mode: Each, Wait for sub-workflow to complete.  
   - Calls same workflow to process research stage.

10. **Inside Research Sub-workflow:**  
    - Add HTTP Request Node (Web Search For API Schema) using Apify act for Google search with custom search terms targeting the service URL.  
    - Add If Node (Has Results?) to check for search results.  
    - Add SplitOut Node (Results to List) to split results.  
    - Add Filter Node (Filter Results) to select normal results.  
    - Add RemoveDuplicates Node to remove duplicate URLs.  
    - Add HTTP Request Node (Scrape Webpage Contents) using Apify web scraper act to scrape page content; batch size 2, 30s interval.  
    - Add Filter Node (Successful Runs) to keep successful scrapes.  
    - Add If Node (Has Results?1) to check if any content scraped.  
    - Add Text Classifier Node (Has API Documentation?) using Gemini LLM to detect presence of API docs.  
    - Add If Node (Has Results?3) to check classification result.  
    - Add Set Node (Set Embedding Variables) to prepare content, service, and URL fields.  
    - Add SplitInBatches Node (For Each Document...) to process documents.  
    - Add Set Node (Content Chunking @ 50k Chars) to chunk contents.  
    - Add SplitOut Node (Split Out Chunks).  
    - Add Recursive Character Text Splitter Node to split chunks recursively if needed.  
    - Add Document Loader Node (Default Data Loader) to load chunked data with metadata.  
    - Add Embeddings Node (Embeddings Google Gemini) to generate embeddings.  
    - Add Vector Store Node (Store Document Embeddings) to insert into Qdrant collection.  
    - Add Google Sheets Update Nodes (Research Result and Research Error) to update status "ok" or "error".  
    - Add Wait Node for pacing.

11. **Connect nodes in above order and set error handling to continue on errors where needed.**

---

#### Stage 2 - Extraction

12. **Add Google Sheets Node (Get All Extract):**  
    - Read rows where `Stage 1 - Research` is "ok" and `Stage 2 - Extraction` is empty.

13. **Add If Node (All Extract Done?):**  
    - Check if input empty, branch accordingly.

14. **Add SplitInBatches Node (For Each Extract…):**  
    - Process each row individually.

15. **Add Google Sheets Node (Extract Pending):**  
    - Update row: set `Stage 2 - Extraction` to "pending".

16. **Add Set Node (Extract Event):**  
    - Compose JSON with eventType `extract`, service, URL, row_number, collection.

17. **Add Execute Workflow Node (Extract):**  
    - Mode: Each, wait for sub-workflow.

18. **Inside Extraction Sub-workflow:**  
    - Add Set Node (Query Templates) with predefined queries for LLM.  
    - Add SplitOut Node (Template to List).  
    - Add SplitInBatches Node (For Each Template...).  
    - Add Vector Store Query Node (Search in Relevant Docs) to load documents for the service.  
    - Add Aggregate Node (Combine Docs).  
    - Add Set Node (Query & Docs) to set query and concatenated documents.  
    - Add Information Extractor Node (Identify Service Products) using Gemini LLM.  
    - Add Set Node (Extract API Templates) to generate API-specific queries based on products.  
    - Add SplitInBatches Node (For Each Template...1).  
    - Add Vector Store Query Node (Search in Relevant Docs1) for API docs.  
    - Add Aggregate Node (Combine Docs1).  
    - Add Set Node (Query & Docs1).  
    - Add LLM Chat Node (Google Gemini Chat Model2) for product queries.  
    - Add Information Extractor Node (Extract API Operations) with system prompt to extract endpoints.  
    - Add Code Node (Merge Lists) to flatten results.  
    - Add If Node (Has Operations?) to check for extracted data.  
    - Add RemoveDuplicates Node to remove duplicate operations by method and URL.  
    - Add Google Sheets Append Node (Append Row) to store extracted operations.  
    - Add Google Sheets Update Nodes (Extract Result, Extract Error) to update status.  
    - Add Wait Node (Wait1) to pace execution.

---

#### Stage 3 - Generation

19. **Add Google Sheets Node (Get All Generate):**  
    - Read rows where `Stage 1 - Research` and `Stage 2 - Extraction` are "ok" but `Stage 3 - Output File` is empty.

20. **Add If Node (All Generate Done?):**  
    - Check if input empty.

21. **Add SplitInBatches Node (For Each Generate...):**  
    - Process each row individually.

22. **Add Google Sheets Node (Generate Pending):**  
    - Update row: set `Stage 3 - Output File` to "pending".

23. **Add Set Node (Generate Event):**  
    - Compose JSON event with `generate` type.

24. **Add Execute Workflow Node (Generate):**  
    - Mode: Each, wait for sub-workflow.

25. **Inside Generation Sub-workflow:**  
    - Add Google Sheets Node (Get API Operations) to retrieve all stored API operations for the service.  
    - Add Code Node (Contruct JSON Schema) to group operations by resource, format data into JSON schema.  
    - Add Set Node (Set Upload Fields) to create filename and stringify JSON.  
    - Add Google Drive Upload Node (Upload to Drive) to save schema JSON file.  
    - Add Set Node (Response OK2) to prepare success response.  
    - Add Google Sheets Update Nodes (Generate Result, Generate Error) to update status and file location.  
    - Add Wait Node (Wait2) for pacing.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                           | Context or Link                                                                                                                     |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| Kudos to [Jim Le](https://n8n.io/creators/jimleuk/) for helping build this sophisticated multi-stage workflow automating API documentation processing using web scraping, vector search, and LLMs.                                                        | Credits                                                                                                                            |
| Example Google Sheet used for tracking services and stages: [Google Sheet Example](https://docs.google.com/spreadsheets/d/1UJtksHQV0NRNhsDdVdkdIoNssuvoTWso/edit?usp=sharing&ouid=108234606433343029350&rtpof=true&sd=true)                             | Setup instructions                                                                                                                 |
| Requires accounts and credentials for Google (Sheets, Drive), Apify (scraping), Qdrant (vector DB), and Gemini API for LLM and embeddings.                                                                                                           | Prerequisites                                                                                                                      |
| Workflow uses Apify acts for Google search and website scraping with batching and proxy configuration to manage rate limits and avoid blocking.                                                                                                       | Integration details                                                                                                                |
| LLM (Gemini) is used for classification, information extraction, and chat-based queries, tailored with system prompts to identify API documentation and extract operations accurately.                                                                | AI Processing details                                                                                                             |
| Google Sheets serves as the primary database for tracking service progress across three stages and storing extracted API operations.                                                                                                                | Data management                                                                                                                   |
| Google Drive is used to store final generated JSON schema files for API operations.                                                                                                                                                                   | Output storage                                                                                                                    |
| System prompts and queries are carefully designed to maximize relevant API documentation extraction and schema generation while filtering out unrelated content.                                                                                      | Customization notes                                                                                                              |
| The workflow includes sub-workflow recursive calls to handle per-service processing in each stage, with error handling to continue processing remaining items on failures.                                                                           | Workflow design                                                                                                                  |

---

This documentation captures all nodes, their functional roles, configurations, and connectivity necessary to understand, reproduce, and maintain the API Schema Extractor workflow. It also highlights potential errors and integration points for robust operation.