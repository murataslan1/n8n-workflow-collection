Airline Web Check-in Data Extraction with Ollama AI, Google Sheets & Postgres Vector DB

https://n8nworkflows.xyz/workflows/airline-web-check-in-data-extraction-with-ollama-ai--google-sheets---postgres-vector-db-5474


# Airline Web Check-in Data Extraction with Ollama AI, Google Sheets & Postgres Vector DB

### 1. Workflow Overview

This workflow automates the extraction, structuring, and storage of airline web check-in data by orchestrating several key operations. It targets use cases where airline check-in and policy information, often presented in inconsistent or unstructured webpage formats, need to be gathered, parsed, and stored for easy access and semantic search.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Trigger**: Receives an external trigger to initiate the workflow.
- **1.2 Fetch Airline URLs**: Retrieves a list of airline check-in URLs from a Google Sheets document.
- **1.3 Iterative Processing Loop**: Processes each airline URL in batches, enabling scalable scraping and extraction.
- **1.4 Webpage Scraping**: Sends HTTP requests to airline check-in URLs to fetch raw HTML/text content.
- **1.5 AI Extraction with Language Model (LLM)**: Uses an Ollama AI language model to parse raw webpage content into a clean, structured JSON format following a strict schema.
- **1.6 Data Storage**: Updates the structured data back into Google Sheets and generates embeddings for vector-based semantic search stored in a Postgres PGVector database.
- **1.7 Flow Control and Throttling**: Implements wait times between batches to avoid rate limiting or overloading external services.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Trigger

- **Overview:** This block starts the workflow by waiting for an external chat trigger webhook, allowing manual or automated invocation.
- **Nodes Involved:** `Chat Trigger - Start`
- **Node Details:**
  - **Type:** `@n8n/n8n-nodes-langchain.chatTrigger`
  - **Role:** Public webhook trigger node to start workflow execution.
  - **Configuration:** Public webhook enabled with a unique webhook ID. No authentication or parameters required.
  - **Inputs:** None (trigger node).
  - **Outputs:** Connected to `Fetch Airline URLs`.
  - **Failure cases:** Webhook not reached; ensure webhook URL is accessible publicly.
  - **Version:** 1.1

#### 1.2 Fetch Airline URLs

- **Overview:** Retrieves a spreadsheet containing airline check-in URLs and metadata to be processed.
- **Nodes Involved:** `Fetch Airline URLs`
- **Node Details:**
  - **Type:** Google Sheets node
  - **Role:** Reads data from a specific spreadsheet and sheet.
  - **Configuration:**
    - Document ID: Linked to a Google Sheet containing airline URLs.
    - Sheet Name: "Sheet1" (ID: 2125635496).
    - Authentication: Uses a Google service account credential.
  - **Inputs:** From `Chat Trigger - Start`
  - **Outputs:** Outputs rows to `Loop Over Items`.
  - **Potential failures:** Google API auth errors, quota limits, missing/changed sheet or document.
  - **Version:** 4.5

#### 1.3 Iterative Processing Loop

- **Overview:** Processes each airline URL item individually by splitting the set into batches.
- **Nodes Involved:** `Loop Over Items`
- **Node Details:**
  - **Type:** SplitInBatches
  - **Role:** Batch processing control to handle each airline URL one by one.
  - **Configuration:** Default options (batch size unspecified, defaults to 1).
  - **Inputs:** From `Fetch Airline URLs`
  - **Outputs:** Main output to `Scrape Airline Webpage` node.
  - **Edge cases:** Large input sets may require batch size tuning; misconfigured batch sizes can cause slowdowns or memory issues.
  - **Version:** 3

#### 1.4 Webpage Scraping

- **Overview:** Sends a POST HTTP request to scrape content from airline check-in URLs.
- **Nodes Involved:** `Scrape Airline Webpage`
- **Node Details:**
  - **Type:** HTTP Request
  - **Role:** Fetch airline webpage content for parsing.
  - **Configuration:**
    - URL template: `https://r.jina.ai/{{ $json['WEB CHECK IN URL'] }}` (dynamic URL substitution).
    - Method: POST.
    - Headers: JSON formatted with preset cookies.
    - Authentication: HTTP Header Auth using a configured credential.
  - **Inputs:** From `Loop Over Items`
  - **Outputs:** Raw HTML/text data to `Extract Info with LLM`.
  - **Potential failures:**
    - HTTP errors (404, 500).
    - Authentication failures (expired/invalid header token).
    - Network timeouts.
    - URL missing or malformed in input JSON.
  - **Version:** 4.2

#### 1.5 AI Extraction with Language Model (LLM)

- **Overview:** Uses Ollama AI via a LangChain node to parse raw webpage text into a structured JSON object following a strict airline check-in data schema.
- **Nodes Involved:** `Extract Info with LLM`, `Chat Model`
- **Node Details:**
  - **Extract Info with LLM**
    - **Type:** LangChain Chain LLM
    - **Role:** Applies a prompt template to the webpage text and extracts structured data.
    - **Configuration:** 
      - Input text: Raw webpage content (`{{ $json.data }}`).
      - Prompt: A detailed natural language prompt instructing the AI to extract fields like check-in availability, baggage policy, refund/cancellation policies, customer support, FAQ, and additional info in strict JSON format.
    - **Inputs:** From `Scrape Airline Webpage`
    - **Outputs:** AI-generated JSON text to `Wait for Response`.
    - **Edge cases:** Poor webpage text quality, AI returning invalid JSON, missing fields, or excessive verbosity.
    - **Version:** 1.5
  - **Chat Model**
    - **Type:** LangChain LM Chat Ollama
    - **Role:** The actual AI model executing the prompt.
    - **Configuration:** Linked to Ollama API credentials.
    - **Inputs:** From `Extract Info with LLM` (as ai_languageModel).
    - **Outputs:** AI text response to `Wait for Response`.
    - **Failure modes:** API limits, network errors, malformed prompts.
    - **Version:** 1

#### 1.6 Data Storage

- **Overview:** Saves the structured JSON results back into Google Sheets and prepares the data for semantic vector storage in Postgres.
- **Nodes Involved:** `Wait for Response`, `Store Extracted Info`, `Generate Embeddings`, `Prepare Text for Vector DB`, `Split Long Text`, `Save to Vector DB`
- **Node Details:**
  - **Wait for Response**
    - **Type:** Wait node
    - **Role:** Synchronizes workflow to wait for AI response before proceeding.
    - **Inputs:** From `Extract Info with LLM`
    - **Outputs:** To `Store Extracted Info`
    - **Version:** 1.1
  - **Store Extracted Info**
    - **Type:** Google Sheets
    - **Role:** Updates the original sheet with extracted JSON data.
    - **Configuration:**
      - Uses row_number to update correct row.
      - Updates "web check in details" column with cleaned JSON text (stripping markdown code blocks and HTML tags).
      - Authentication: Google service account.
    - **Inputs:** From `Wait for Response`
    - **Outputs:** To `Save to Vector DB`
    - **Failure modes:** Google API errors, row mismatch, JSON cleaning errors.
    - **Version:** 4.5
  - **Generate Embeddings**
    - **Type:** LangChain Embeddings Ollama
    - **Role:** Converts textual JSON data to vector embeddings.
    - **Inputs:** From `Store Extracted Info`
    - **Outputs:** To `Save to Vector DB`
    - **Credentials:** Ollama API
    - **Version:** 1
  - **Prepare Text for Vector DB**
    - **Type:** LangChain Document Data Loader
    - **Role:** Prepares the text document structure for vector DB insertion.
    - **Inputs:** From `Split Long Text`
    - **Outputs:** To `Save to Vector DB`
    - **Version:** 1
  - **Split Long Text**
    - **Type:** LangChain Text Splitter Token Splitter
    - **Role:** Splits long texts into smaller chunks (max 10,000 tokens) for embedding.
    - **Inputs:** From `Generate Embeddings`
    - **Outputs:** To `Prepare Text for Vector DB`
    - **Version:** 1
  - **Save to Vector DB**
    - **Type:** LangChain Vector Store PGVector
    - **Role:** Inserts the embedding vectors and metadata into a Postgres vector database.
    - **Configuration:**
      - Mode: Insert
      - Collection: Uses existing collection
      - Credentials: Postgres connection
    - **Inputs:** From `Generate Embeddings` and `Prepare Text for Vector DB`
    - **Outputs:** To `Wait Before Next Batch`
    - **Failures:** DB connection issues, insertion errors, vector size mismatches.
    - **Version:** 1

#### 1.7 Flow Control and Throttling

- **Overview:** Implements a wait period between batches to prevent API rate limiting or server overload.
- **Nodes Involved:** `Wait Before Next Batch`
- **Node Details:**
  - **Type:** Wait
  - **Role:** Pauses execution for 15 seconds before processing the next batch.
  - **Configuration:** Wait amount set to 15 seconds.
  - **Inputs:** From `Save to Vector DB`
  - **Outputs:** Back to `Loop Over Items` to continue processing.
  - **Version:** 1.1

#### Additional Node: Sticky Note

- **Overview:** Provides detailed documentation on the LLM prompt used for data extraction.
- **Node Details:**
  - **Type:** Sticky Note
  - **Content:** Explains the purpose, usage, and structure of the AI prompt guiding the LLM to extract structured data from airline webpages.
  - **Position:** Off to the side for reference only.

---

### 3. Summary Table

| Node Name               | Node Type                                   | Functional Role                          | Input Node(s)               | Output Node(s)                    | Sticky Note                                                                                       |
|-------------------------|---------------------------------------------|----------------------------------------|-----------------------------|----------------------------------|-------------------------------------------------------------------------------------------------|
| Chat Trigger - Start     | @n8n/n8n-nodes-langchain.chatTrigger       | Workflow trigger (webhook)              | None                        | Fetch Airline URLs               |                                                                                                 |
| Fetch Airline URLs       | n8n-nodes-base.googleSheets                 | Retrieve airline URLs                   | Chat Trigger - Start         | Loop Over Items                  |                                                                                                 |
| Loop Over Items          | n8n-nodes-base.splitInBatches               | Batch processing of airline URLs       | Fetch Airline URLs           | Scrape Airline Webpage           |                                                                                                 |
| Scrape Airline Webpage   | n8n-nodes-base.httpRequest                   | Download raw webpage content            | Loop Over Items              | Extract Info with LLM            |                                                                                                 |
| Extract Info with LLM    | @n8n/n8n-nodes-langchain.chainLlm           | AI parsing of raw webpage to JSON      | Scrape Airline Webpage       | Wait for Response               | See sticky note for LLM prompt details guiding structured data extraction                       |
| Chat Model              | @n8n/n8n-nodes-langchain.lmChatOllama       | AI model execution for extraction      | Extract Info with LLM (ai_languageModel) | Wait for Response          |                                                                                                 |
| Wait for Response        | n8n-nodes-base.wait                          | Synchronize on AI response              | Extract Info with LLM        | Store Extracted Info             |                                                                                                 |
| Store Extracted Info     | n8n-nodes-base.googleSheets                  | Update Google Sheet with extracted data| Wait for Response            | Generate Embeddings, Save to Vector DB |                                                                                                 |
| Generate Embeddings      | @n8n/n8n-nodes-langchain.embeddingsOllama   | Generate vector embeddings from text   | Store Extracted Info         | Save to Vector DB, Split Long Text |                                                                                                 |
| Split Long Text          | @n8n/n8n-nodes-langchain.textSplitterTokenSplitter | Split long text for vector embedding   | Generate Embeddings          | Prepare Text for Vector DB       |                                                                                                 |
| Prepare Text for Vector DB | @n8n/n8n-nodes-langchain.documentDefaultDataLoader | Prepare documents for vector DB insert | Split Long Text              | Save to Vector DB                |                                                                                                 |
| Save to Vector DB        | @n8n/n8n-nodes-langchain.vectorStorePGVector | Insert embeddings and metadata in DB   | Generate Embeddings, Prepare Text for Vector DB | Wait Before Next Batch          |                                                                                                 |
| Wait Before Next Batch   | n8n-nodes-base.wait                          | Throttling pause between batches        | Save to Vector DB            | Loop Over Items                  |                                                                                                 |
| Sticky Note              | n8n-nodes-base.stickyNote                    | Documentation on LLM prompt             | None                        | None                           | Detailed explanation of AI prompt for structured airline check-in data extraction               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger:**
   - Add a **Chat Trigger** node.
   - Set it to be public.
   - Note the webhook URL for external triggering.

2. **Fetch Airline URLs:**
   - Add a **Google Sheets** node.
   - Set operation to "Read Rows" from your Google Sheet.
   - Configure document ID and sheet name where URLs are stored.
   - Authenticate using a Google Service Account credential.

3. **Batch Processing Setup:**
   - Add a **SplitInBatches** node.
   - Connect it to the Google Sheets node.
   - Use default batch size (1) or configure as needed.

4. **Scrape Airline Webpage:**
   - Add an **HTTP Request** node.
   - Set method to POST.
   - URL: Use expression to build URL dynamically: `https://r.jina.ai/{{ $json['WEB CHECK IN URL'] }}`
   - Set headers as JSON with necessary cookies.
   - Use HTTP Header Auth credential for authentication.
   - Connect from `Loop Over Items` node.

5. **Extract Info with LLM:**
   - Add a **LangChain Chain LLM** node.
   - Input text: Set expression to `{{ $json.data }}` (raw webpage content).
   - Provide the detailed prompt (as per sticky note content) instructing the AI to extract structured JSON with the airline check-in schema.
   - Connect HTTP Request node to this node.

6. **Chat Model Node:**
   - Add a **LangChain LM Chat Ollama** node.
   - Select Ollama API credentials.
   - Connect this node’s output to the Chain LLM node’s AI language model input.

7. **Wait for AI Response:**
   - Add a **Wait** node.
   - Connect from the Chain LLM node.
   - This ensures the workflow waits for the AI response before continuing.

8. **Store Extracted Info:**
   - Add a **Google Sheets** node.
   - Set operation to update row.
   - Map the row_number from input.
   - For the "web check in details" column, map cleaned AI JSON output: remove markdown and HTML tags.
   - Authenticate with the same Google Service Account.
   - Connect from the Wait node.

9. **Generate Embeddings:**
   - Add a **LangChain Embeddings Ollama** node.
   - Authenticate with Ollama API credentials.
   - Connect from Google Sheets update node.

10. **Split Long Text:**
    - Add a **LangChain Text Splitter Token Splitter** node.
    - Set chunk size to 10,000 tokens.
    - Connect from Embeddings node.

11. **Prepare Text for Vector DB:**
    - Add a **LangChain Document Default Data Loader** node.
    - Connect from Split Long Text node.

12. **Save to Vector DB:**
    - Add a **LangChain Vector Store PGVector** node.
    - Set mode to "insert".
    - Use existing collection.
    - Configure Postgres credentials.
    - Connect from both Generate Embeddings and Prepare Text for Vector DB nodes.

13. **Wait Before Next Batch:**
    - Add a **Wait** node.
    - Set wait time to 15 seconds.
    - Connect from Save to Vector DB node.

14. **Loop Back:**
    - Connect Wait node output back to the **SplitInBatches** node to process next batch.

15. **Add Sticky Note:**
    - (Optional) Add a sticky note node with the detailed prompt explanation for documentation purposes.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                     | Context or Link                                                                                                                            |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| The LLM prompt is designed to enforce consistent JSON extraction from messy airline webpages with no empty or null fields. It includes detailed schema instructions covering check-in, baggage, refund, support, and FAQs.         | Sticky Note node content inside the workflow                                                                                              |
| Use Google Service Account credentials for Sheets API access to avoid manual OAuth consent and ensure scalability.                                                                                                             | Google Sheets nodes                                                                                                                        |
| Ollama AI is used both for chat model execution and embeddings generation; ensure API keys and rate limits are managed appropriately.                                                                                           | LangChain Ollama nodes                                                                                                                     |
| Postgres PGVector is used as vector storage enabling semantic search over extracted airline data, useful for downstream querying and AI applications.                                                                        | Vector DB nodes                                                                                                                            |
| Be mindful of rate limits and use the wait node to throttle requests between batches to external APIs (Ollama, HTTP requests).                                                                                                | Wait Before Next Batch node                                                                                                                |
| Workflow assumes that airline URLs and basic metadata are maintained in a Google Sheet with defined columns including "WEB CHECK IN URL" and row_number for update matching.                                                    | Google Sheets structure                                                                                                                    |

---

**Disclaimer:**  
The text provided is extracted solely from an automated n8n workflow. It complies fully with current content policies and contains no illegal, offensive, or protected data. All processed data are legal and publicly accessible.

---

This documentation enables detailed understanding, modification, and reimplementation of the workflow for scraping, AI-based parsing, and vector storage of airline web check-in data.