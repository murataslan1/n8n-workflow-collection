AI-Powered RAG Workflow For Stock Earnings Report Analysis

https://n8nworkflows.xyz/workflows/ai-powered-rag-workflow-for-stock-earnings-report-analysis-2741


# AI-Powered RAG Workflow For Stock Earnings Report Analysis

### 1. Workflow Overview

This workflow is designed to automate the analysis of quarterly earnings reports for a company (specifically Google/Alphabet Inc. in this example) by leveraging AI-powered retrieval-augmented generation (RAG). It ingests PDF earnings reports, processes and indexes their content into a Pinecone vector database, and then uses AI agents to generate detailed financial analysis reports saved as Google Docs.

The workflow is logically divided into three main blocks:

- **1.1 Data Loading and Indexing:**  
  Fetches PDF links from a Google Sheet, downloads the PDFs from Google Drive, parses and splits the text, generates embeddings using Google Gemini AI, and stores these embeddings in Pinecone for semantic search.

- **1.2 AI Agent Report Generation (RAG):**  
  Uses an AI Agent node configured with a system prompt to orchestrate querying the Pinecone vector store and synthesizing financial insights. It employs a Vector Store Tool for retrieval and language models (OpenAI GPT-4o-mini and Google Gemini Chat) for processing.

- **1.3 Report Delivery:**  
  Saves the generated financial report as a Google Doc in a specified Google Drive location.

---

### 2. Block-by-Block Analysis

#### 2.1 Data Loading and Indexing

**Overview:**  
This block automates the ingestion of earnings report PDFs by retrieving file URLs from a Google Sheet, downloading the files from Google Drive, extracting and splitting their text content, generating semantic embeddings, and inserting these embeddings into a Pinecone vector database for later retrieval.

**Nodes Involved:**  
- List Of Files To Load (Google Sheets)  
- Loop Over Items  
- Download File From Google Drive  
- Default Data Loader  
- Recursive Character Text Splitter  
- Embeddings Google Gemini  
- Pinecone Vector Store  
- Sticky Note1 ("Loading data to Pinecone vector store")

**Node Details:**

- **List Of Files To Load (Google Sheets)**  
  - *Type:* Google Sheets node  
  - *Role:* Reads a Google Sheet containing URLs of earnings report PDFs.  
  - *Configuration:* Points to a specific Google Sheet and sheet tab containing file URLs.  
  - *Input:* Triggered by workflow start or upstream nodes.  
  - *Output:* Emits rows with file URLs for processing.  
  - *Edge Cases:* Sheet access permission errors, empty or malformed URLs.

- **Loop Over Items**  
  - *Type:* SplitInBatches node  
  - *Role:* Iterates over each file URL from the Google Sheet to process sequentially.  
  - *Configuration:* Default batch size (usually 1).  
  - *Input:* Receives list of files from Google Sheets node.  
  - *Output:* Passes single file data to downstream nodes.  
  - *Edge Cases:* Empty input array, batch processing errors.

- **Download File From Google Drive**  
  - *Type:* Google Drive node  
  - *Role:* Downloads the PDF file from Google Drive using the URL from the current batch item.  
  - *Configuration:* Uses expression to extract fileId from the Google Sheet row (`={{ $('List Of Files To Load (Google Sheets)').item.json['File URL'] }}`).  
  - *Input:* Receives file URL from Loop Over Items.  
  - *Output:* Binary PDF data for parsing.  
  - *Edge Cases:* File not found, permission denied, invalid fileId.

- **Default Data Loader**  
  - *Type:* Document Default Data Loader (LangChain)  
  - *Role:* Parses the downloaded PDF binary into text documents.  
  - *Configuration:* Uses built-in PDF loader, expects binary input.  
  - *Input:* PDF binary from Download File node.  
  - *Output:* Extracted text documents.  
  - *Edge Cases:* Corrupt PDF, unsupported format.

- **Recursive Character Text Splitter**  
  - *Type:* Text Splitter (LangChain)  
  - *Role:* Splits extracted text into manageable chunks for embedding.  
  - *Configuration:* Default recursive character splitting options.  
  - *Input:* Text documents from Data Loader.  
  - *Output:* Text chunks for embedding.  
  - *Edge Cases:* Very large documents causing performance issues.

- **Embeddings Google Gemini**  
  - *Type:* Embeddings node (Google Gemini AI)  
  - *Role:* Generates semantic vector embeddings for each text chunk.  
  - *Configuration:* Uses model `models/text-embedding-004`.  
  - *Input:* Text chunks from Text Splitter.  
  - *Output:* Embeddings vectors.  
  - *Edge Cases:* API quota limits, network errors.

- **Pinecone Vector Store**  
  - *Type:* Pinecone Vector Store node (LangChain)  
  - *Role:* Inserts embeddings and associated text chunks into the Pinecone index `company-earnings`.  
  - *Configuration:* Insert mode, index name `company-earnings`.  
  - *Input:* Embeddings from Google Gemini node.  
  - *Output:* Confirmation of insertion, triggers next batch iteration.  
  - *Credentials:* Pinecone API key configured.  
  - *Edge Cases:* API key invalid, index not found, insertion errors.

- **Sticky Note1**  
  - *Content:* "Loading data to Pinecone vector store" — contextual annotation for this block.

---

#### 2.2 AI Agent Report Generation (RAG)

**Overview:**  
This block uses an AI Agent node configured with a detailed system prompt to query the Pinecone vector store for relevant financial data and generate a structured earnings report. It integrates multiple AI models and tools to synthesize and format the report.

**Nodes Involved:**  
- When clicking ‘Test workflow’ (Manual Trigger)  
- AI Agent  
- Vector Store Tool  
- Pinecone Vector Store (Retrieval)  
- Embeddings Google Gemini (retrieval)  
- OpenAI Chat Model  
- Google Gemini Chat Model1  
- Sticky Note2 ("AI Agent Report Generation using RAG")

**Node Details:**

- **When clicking ‘Test workflow’**  
  - *Type:* Manual Trigger node  
  - *Role:* Entry point to manually start the report generation process.  
  - *Input:* User-initiated trigger.  
  - *Output:* Starts AI Agent node.  
  - *Edge Cases:* None.

- **AI Agent**  
  - *Type:* LangChain Agent node  
  - *Role:* Core orchestrator that processes user queries, retrieves data, and generates reports.  
  - *Configuration:*  
    - System prompt defines role as a financial analyst specialized in Google earnings.  
    - Uses two tools: Vector Store Tool (for Pinecone retrieval) and Google Docs Tool (for saving reports).  
    - User prompt example: "Give me a report on Google's last 3 quarter earnings. Format it in markdown. Focus on the differences and trends. Spot any outliers."  
  - *Input:* Trigger from Manual Trigger node.  
  - *Output:* Generated report text.  
  - *Edge Cases:* Prompt parsing errors, API failures, incomplete retrieval.

- **Vector Store Tool**  
  - *Type:* LangChain Tool node  
  - *Role:* Provides the AI Agent access to the Pinecone vector store for semantic search.  
  - *Configuration:* Named `company_financial_earnings_data_tool`, description provided.  
  - *Input:* Queries from AI Agent.  
  - *Output:* Retrieved relevant text chunks.  
  - *Edge Cases:* Retrieval failures, empty results.

- **Pinecone Vector Store (Retrieval)**  
  - *Type:* Pinecone Vector Store node (LangChain)  
  - *Role:* Performs vector similarity search on the `company-earnings` index to retrieve relevant documents.  
  - *Configuration:* Retrieval mode, index name `company-earnings`.  
  - *Input:* Embeddings from Embeddings Google Gemini (retrieval).  
  - *Output:* Retrieved documents to Vector Store Tool.  
  - *Credentials:* Pinecone API key.  
  - *Edge Cases:* Index not found, query errors.

- **Embeddings Google Gemini (retrieval)**  
  - *Type:* Embeddings node (Google Gemini AI)  
  - *Role:* Generates embeddings for the AI Agent's query to perform vector search.  
  - *Configuration:* Model `models/text-embedding-004`.  
  - *Input:* Query text from Vector Store Tool.  
  - *Output:* Query embeddings for Pinecone retrieval.  
  - *Edge Cases:* API limits, network issues.

- **OpenAI Chat Model**  
  - *Type:* Language Model node (OpenAI GPT)  
  - *Role:* Provides advanced language generation capabilities for the AI Agent.  
  - *Configuration:* Default GPT model (GPT-4o-mini or similar).  
  - *Input:* AI Agent's language model input.  
  - *Output:* Generated text responses.  
  - *Credentials:* OpenAI API key.  
  - *Edge Cases:* Rate limits, API errors.

- **Google Gemini Chat Model1**  
  - *Type:* Language Model node (Google Gemini)  
  - *Role:* Alternative or complementary language model used by the Vector Store Tool.  
  - *Configuration:* Model `models/gemini-2.0-flash-exp`.  
  - *Input:* Queries from Vector Store Tool.  
  - *Output:* Responses to support retrieval and generation.  
  - *Credentials:* Google AI API key.  
  - *Edge Cases:* API quota, latency.

- **Sticky Note2**  
  - *Content:* "AI Agent Report Generation using RAG" — contextual annotation for this block.

---

#### 2.3 Report Delivery

**Overview:**  
This block saves the AI-generated financial report into a Google Doc for easy access, sharing, and further editing.

**Nodes Involved:**  
- Save Report to Google Docs

**Node Details:**

- **Save Report to Google Docs**  
  - *Type:* Google Docs node  
  - *Role:* Inserts the generated report text into a specified Google Doc.  
  - *Configuration:*  
    - Operation: Update document.  
    - Document URL: Points to a specific Google Doc where the report is saved.  
    - Action: Inserts the AI Agent's output text into the document.  
  - *Input:* Receives report text from AI Agent node.  
  - *Output:* Confirmation of document update.  
  - *Credentials:* Google Docs OAuth2.  
  - *Edge Cases:* Document access permission errors, invalid URL, API quota.

---

### 3. Summary Table

| Node Name                         | Node Type                                      | Functional Role                            | Input Node(s)                      | Output Node(s)                      | Sticky Note                                                                                      |
|----------------------------------|------------------------------------------------|--------------------------------------------|-----------------------------------|-----------------------------------|------------------------------------------------------------------------------------------------|
| List Of Files To Load (Google Sheets) | Google Sheets                                  | Fetch list of PDF file URLs                 | -                                 | Loop Over Items                   |                                                                                                |
| Loop Over Items                  | SplitInBatches                                  | Iterate over each file URL                   | List Of Files To Load              | Download File From Google Drive   |                                                                                                |
| Download File From Google Drive  | Google Drive                                    | Download PDF file from Google Drive         | Loop Over Items                   | Default Data Loader               |                                                                                                |
| Default Data Loader              | Document Default Data Loader (LangChain)       | Parse PDF binary into text documents         | Download File From Google Drive   | Recursive Character Text Splitter |                                                                                                |
| Recursive Character Text Splitter | Text Splitter (LangChain)                      | Split text into chunks for embedding         | Default Data Loader               | Embeddings Google Gemini          |                                                                                                |
| Embeddings Google Gemini         | Embeddings (Google Gemini AI)                   | Generate embeddings for text chunks          | Recursive Character Text Splitter | Pinecone Vector Store             |                                                                                                |
| Pinecone Vector Store            | Vector Store (Pinecone)                         | Insert embeddings into Pinecone index         | Embeddings Google Gemini          | Loop Over Items                   |                                                                                                |
| Sticky Note1                    | Sticky Note                                     | Annotation for data loading block             | -                                 | -                                 | Loading data to Pinecone vector store                                                          |
| When clicking ‘Test workflow’    | Manual Trigger                                  | Manual start of AI report generation          | -                                 | AI Agent                        |                                                                                                |
| AI Agent                       | LangChain Agent                                 | Orchestrate query, retrieval, and report generation | When clicking ‘Test workflow’     | Save Report to Google Docs        |                                                                                                |
| Vector Store Tool               | LangChain Tool                                  | Provide Pinecone retrieval to AI Agent        | AI Agent                        | AI Agent                        |                                                                                                |
| Pinecone Vector Store (Retrieval) | Vector Store (Pinecone)                         | Retrieve relevant documents from Pinecone     | Embeddings Google Gemini (retrieval) | Vector Store Tool               |                                                                                                |
| Embeddings Google Gemini (retrieval) | Embeddings (Google Gemini AI)                   | Generate embeddings for AI Agent queries      | Vector Store Tool               | Pinecone Vector Store (Retrieval) |                                                                                                |
| OpenAI Chat Model               | Language Model (OpenAI GPT)                      | Language generation for AI Agent               | AI Agent                        | AI Agent                        |                                                                                                |
| Google Gemini Chat Model1       | Language Model (Google Gemini)                   | Language generation for Vector Store Tool     | Vector Store Tool               | Vector Store Tool               |                                                                                                |
| Save Report to Google Docs      | Google Docs                                     | Save generated report into Google Doc          | AI Agent                        | -                                 |                                                                                                |
| Sticky Note2                    | Sticky Note                                     | Annotation for AI Agent report generation block | -                                 | -                                 | AI Agent Report Generation using RAG                                                           |
| Sticky Note                     | Sticky Note                                     | Setup instructions and credentials overview    | -                                 | -                                 | See section 5 for full setup instructions                                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Sheets Node: "List Of Files To Load (Google Sheets)"**  
   - Type: Google Sheets  
   - Configure OAuth2 credentials for Google Sheets.  
   - Set Document ID to your Google Sheet containing PDF URLs.  
   - Set Sheet Name to the tab with the URLs.  
   - Output: Rows with file URLs.

2. **Add SplitInBatches Node: "Loop Over Items"**  
   - Type: SplitInBatches  
   - Connect input from Google Sheets node.  
   - Default batch size (1).  
   - Purpose: Process each file URL individually.

3. **Add Google Drive Node: "Download File From Google Drive"**  
   - Type: Google Drive  
   - Configure OAuth2 credentials for Google Drive.  
   - Operation: Download.  
   - File ID: Use expression to extract from current batch item, e.g., `={{ $json["File URL"] }}` or `={{ $('List Of Files To Load (Google Sheets)').item.json['File URL'] }}`.  
   - Output: Binary PDF data.

4. **Add Document Default Data Loader Node: "Default Data Loader"**  
   - Type: Document Default Data Loader (LangChain)  
   - Loader: PDF Loader  
   - Input: Binary data from Google Drive node.  
   - Output: Extracted text documents.

5. **Add Text Splitter Node: "Recursive Character Text Splitter"**  
   - Type: Recursive Character Text Splitter (LangChain)  
   - Use default splitting options.  
   - Input: Text documents from Data Loader.  
   - Output: Text chunks.

6. **Add Embeddings Node: "Embeddings Google Gemini"**  
   - Type: Embeddings (Google Gemini AI)  
   - Configure Google AI API key credentials.  
   - Model: `models/text-embedding-004`.  
   - Input: Text chunks.  
   - Output: Embeddings vectors.

7. **Add Pinecone Vector Store Node: "Pinecone Vector Store"**  
   - Type: Vector Store Pinecone (LangChain)  
   - Configure Pinecone API credentials.  
   - Mode: Insert.  
   - Index: `company-earnings`.  
   - Input: Embeddings from previous node.  
   - Output: Confirmation, triggers next batch.

8. **Connect Pinecone Vector Store output back to "Loop Over Items"**  
   - To continue processing all files.

9. **Add Manual Trigger Node: "When clicking ‘Test workflow’"**  
   - Type: Manual Trigger  
   - Purpose: Start report generation manually.

10. **Add AI Agent Node: "AI Agent"**  
    - Type: LangChain Agent  
    - Configure OpenAI and Google Gemini API credentials for language models.  
    - System prompt: Use detailed financial analyst prompt specifying tools (Vector Store Tool and Google Docs Tool) and task instructions.  
    - User prompt: Example query about Google's last 3 quarters earnings.  
    - Connect input from Manual Trigger node.

11. **Add Vector Store Tool Node: "Vector Store Tool"**  
    - Type: LangChain Tool  
    - Name: `company_financial_earnings_data_tool`  
    - Description: "Retrieve information about the last 3 quarters of Google Earnings"  
    - Connect input from AI Agent node (ai_tool).  
    - Configure Pinecone retrieval node and embeddings for query processing.

12. **Add Pinecone Vector Store Node: "Pinecone Vector Store (Retrieval)"**  
    - Type: Vector Store Pinecone (LangChain)  
    - Mode: Retrieval  
    - Index: `company-earnings`  
    - Configure Pinecone API credentials.  
    - Connect input from Embeddings Google Gemini (retrieval).

13. **Add Embeddings Node: "Embeddings Google Gemini (retrieval)"**  
    - Type: Embeddings (Google Gemini AI)  
    - Model: `models/text-embedding-004`  
    - Configure Google AI API credentials.  
    - Input: Query text from Vector Store Tool.  
    - Output: Query embeddings for Pinecone retrieval.

14. **Add OpenAI Chat Model Node: "OpenAI Chat Model"**  
    - Type: Language Model (OpenAI GPT)  
    - Configure OpenAI API credentials.  
    - Connect input from AI Agent node (ai_languageModel).

15. **Add Google Gemini Chat Model Node: "Google Gemini Chat Model1"**  
    - Type: Language Model (Google Gemini)  
    - Model: `models/gemini-2.0-flash-exp`  
    - Configure Google AI API credentials.  
    - Connect input from Vector Store Tool (ai_languageModel).

16. **Add Google Docs Node: "Save Report to Google Docs"**  
    - Type: Google Docs  
    - Configure Google Docs OAuth2 credentials.  
    - Operation: Update document.  
    - Document URL: Set to your target Google Doc URL for report saving.  
    - Action: Insert text from AI Agent output.  
    - Connect input from AI Agent node.

17. **Connect AI Agent output to "Save Report to Google Docs"**  
    - To save generated report.

18. **Add Sticky Notes (Optional)**  
    - Add notes for setup instructions and block annotations as per original workflow.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Context or Link                                                                                         |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| **Setup Steps:** 1. Create Google Cloud Project and enable Vertex AI API. 2. Obtain Google AI API key from Google AI Studio. 3. Create Pinecone account, get API key, and create index `company-earnings`. 4. Download quarterly earnings PDFs, save to Google Drive, and list URLs in a Google Sheet. 5. Configure OAuth2 credentials for Google Sheets, Drive, Docs, Google Gemini API, and Pinecone API in n8n. 6. Import and configure workflow nodes with your specific document IDs and URLs. | See Sticky Note content in workflow and section 1 description.                                        |
| The AI Agent uses a detailed system prompt to act as a financial analyst specialized in Google earnings reports, leveraging vector search and document generation tools.                                                                                                                                                                                                                                                                                                                                                                                                | System prompt embedded in AI Agent node configuration.                                               |
| Pinecone vector store index `company-earnings` must be pre-created and accessible with correct API credentials.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Pinecone dashboard and API documentation.                                                             |
| Google Gemini Embeddings model `models/text-embedding-004` and Chat model `models/gemini-2.0-flash-exp` require valid Google AI API key with Vertex AI enabled.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Google Cloud Vertex AI and Google AI Studio documentation.                                           |
| OpenAI Chat Model node uses GPT-4o-mini or similar model; requires OpenAI API key.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | OpenAI API documentation.                                                                             |
| Google Docs node requires the target Google Doc URL to be accessible and editable by the OAuth2 credentials used.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Google Docs API documentation.                                                                        |
| The workflow is designed for extensibility: you can replace Google Sheets with other data sources, or adapt the AI Agent prompt for other companies or financial analysis tasks.                                                                                                                                                                                                                                                                                                                                                                                                            | n8n LangChain and AI integration best practices.                                                     |
| Video and blog resources on n8n AI integrations and Pinecone vector stores can help deepen understanding.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | n8n community forums and Pinecone tutorials.                                                         |

---

This document provides a comprehensive reference for understanding, reproducing, and maintaining the "AI-Powered RAG Workflow For Stock Earnings Report Analysis" in n8n. It covers all nodes, configurations, and integration points, enabling advanced users and AI agents to work effectively with the workflow.