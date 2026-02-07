AI-Powered Accounting Reports from Sabre EDI with GPT-4 and Pinecone RAG

https://n8nworkflows.xyz/workflows/ai-powered-accounting-reports-from-sabre-edi-with-gpt-4-and-pinecone-rag-5130


# AI-Powered Accounting Reports from Sabre EDI with GPT-4 and Pinecone RAG

### 1. Workflow Overview

**Purpose:**  
This workflow automates the processing of Sabre EDI files to generate AI-powered accounting reports, leveraging GPT-4 and Pinecone vector database for Retrieval-Augmented Generation (RAG). It extracts data from EDI files stored in Google Drive, performs text extraction and embedding, stores and queries semantic data in Pinecone, and generates various accounting reports such as Accounts Receivable and Tax & Surcharges reports.

**Target Use Cases:**  
- Travel agencies or accounting departments needing automated extraction and summarization of accounting data from Sabre EDI files.  
- Financial reporting automation integrating AI to interpret complex EDI formats with external knowledge base support.  
- Use cases requiring accurate, context-aware accounting reports without manual data entry.

**Logical Blocks:**  
- **1.1 Input Reception and File Acquisition:** Triggering the workflow and retrieving EDI files from Google Drive.  
- **1.2 Data Extraction and Text Processing:** Downloading files, extracting raw text, and splitting into manageable chunks.  
- **1.3 Embeddings and Vector Store Insertion:** Creating semantic embeddings of file content and storing in Pinecone for knowledge retrieval.  
- **1.4 AI Agents for Report Generation:** Separate agents utilizing GPT-4 with Pinecone retrieval to generate specific accounting reports (Accounts Receivable, Tax & Surcharges).  
- **1.5 Supporting Nodes and Documentation:** Sticky notes providing context and guidelines for the workflow and reports.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and File Acquisition

**Overview:**  
This block triggers the workflow manually and fetches all relevant EDI files from a specified Google Drive folder for processing.

**Nodes Involved:**  
- When clicking ‘Test workflow’  
- Google Drive: extract files  
- Google Drive: download file contents

**Node Details:**

- **When clicking ‘Test workflow’**  
  - Type: Manual Trigger  
  - Role: Entry point for manual execution.  
  - Configuration: No parameters, simply triggers the workflow.  
  - Inputs: None  
  - Outputs: To “Google Drive: extract files”  
  - Failure modes: None expected; manual trigger.

- **Google Drive: extract files**  
  - Type: Google Drive node  
  - Role: Lists all files in a specific folder (EDIFileForProcessing) on Google Drive.  
  - Configuration: Folder ID set to folder containing EDI files; returns all files.  
  - Inputs: Trigger from manual node  
  - Outputs: File metadata array to “Google Drive: download file contents”  
  - Failure modes: Authentication errors, folder access permission issues, empty folder.

- **Google Drive: download file contents**  
  - Type: Google Drive node  
  - Role: Downloads the content of each EDI file identified.  
  - Configuration: File ID dynamically mapped from previous node output.  
  - Inputs: File metadata from previous node  
  - Outputs: Binary file content to “Extract from File”  
  - Failure modes: Download failures, permission denied, file not found.

---

#### 1.2 Data Extraction and Text Processing

**Overview:**  
Converts binary EDI files to text, preparing content for semantic processing.

**Nodes Involved:**  
- Extract from File  
- Account Receivable Agent (connected later)  

**Node Details:**

- **Extract from File**  
  - Type: Extract from File node  
  - Role: Extracts text content from binary EDI files.  
  - Configuration: Operation set to “text”.  
  - Inputs: Binary data from Google Drive download node  
  - Outputs: Text data JSON to “Account Receivable Agent”  
  - Failure modes: Unsupported file format, extraction errors, corrupted files.

---

#### 1.3 Embeddings and Vector Store Insertion

**Overview:**  
Processes documents by splitting text, generating embeddings via OpenAI, and inserting them into Pinecone for semantic search.

**Nodes Involved:**  
- Recursive Character Text Splitter1  
- Default Data Loader1  
- Embeddings OpenAI1  
- Pinecone Vector Store1

**Node Details:**

- **Recursive Character Text Splitter1**  
  - Type: Text Splitter  
  - Role: Splits large text documents into smaller chunks with 50 characters overlap for embedding.  
  - Configuration: Default options, chunk overlap of 50.  
  - Inputs: Text from Default Data Loader1  
  - Outputs: Split text chunks to Default Data Loader1  
  - Failure modes: Expression failures if input invalid.

- **Default Data Loader1**  
  - Type: Document Loader  
  - Role: Converts binary data to document format expected by embedding process.  
  - Configuration: Data type set to binary.  
  - Inputs: From Recursive Character Text Splitter1  
  - Outputs: Document chunks to Embeddings OpenAI1  
  - Failure modes: Data format mismatch.

- **Embeddings OpenAI1**  
  - Type: OpenAI Embeddings  
  - Role: Generates vector embeddings from text chunks using OpenAI API.  
  - Configuration: Default embedding options, OpenAI credentials configured.  
  - Inputs: Document chunks  
  - Outputs: Embeddings to Pinecone Vector Store1  
  - Failure modes: API rate limits, auth errors, network timeouts.

- **Pinecone Vector Store1**  
  - Type: Pinecone Vector Store (Insert mode)  
  - Role: Indexes embeddings in Pinecone under “package1536” index.  
  - Configuration: Insert mode, Pinecone credentials configured.  
  - Inputs: Embeddings from OpenAI  
  - Outputs: None (final insertion)  
  - Failure modes: Pinecone API errors, quota exceeded, network issues.

---

#### 1.4 AI Agents for Report Generation

**Overview:**  
Two agents process the extracted data and generate specific accounting reports (Accounts Receivable and Tax & Surcharges), querying Pinecone as a knowledge base to resolve ambiguities.

**Nodes Involved:**  
- Account Receivable Agent  
- OpenAI Chat Model  
- Pinecone Vector Store (for retrieval)  
- Embeddings OpenAI (for retrieval embedding)  
- Tax and Surcharges Report  
- OpenAI Chat Model1  
- Pinecone Vector Store2  
- Embeddings OpenAI2

**Node Details:**

- **Account Receivable Agent**  
  - Type: Langchain Agent  
  - Role: Generates Accounts Receivable report from EDI text data.  
  - Configuration:  
    - System message defines role as Accounting and Finance Reporting Expert with instructions to query Pinecone vector DB for unknown data.  
    - Input prompt includes raw extracted EDI data.  
    - Output is a JSON-extractable tabular report of passengers and receivable amounts.  
  - Inputs: Text data (extracted EDI) and AI tools (OpenAI Chat Model + Pinecone retrieval).  
  - Outputs: Report JSON.  
  - Failure modes: Misinterpretation of EDI data, Pinecone query failures, OpenAI API limits.

- **OpenAI Chat Model**  
  - Type: Language Model (GPT-4 variant)  
  - Role: Provides language generation for Account Receivable Agent.  
  - Configuration: Model set to “gpt-4o-mini” with default options.  
  - Inputs: From Agent node prompt.  
  - Outputs: Generated text to Agent.  
  - Failure modes: API errors, network issues.

- **Pinecone Vector Store (Account Receivable)**  
  - Type: Vector Store (Retrieve as Tool mode)  
  - Role: Provides retrieval support to Agent by querying Pinecone index for accounting info.  
  - Configuration: Index “package1536”, tool name “PackageDetails”, empty namespace.  
  - Inputs: Queries from Agent.  
  - Outputs: Retrieved relevant documents for Agent.  
  - Failure modes: Query errors, empty results, Pinecone downtime.

- **Embeddings OpenAI**  
  - Type: Embeddings for retrieval queries  
  - Role: Generates embeddings for queries sent to Pinecone.  
  - Configuration: Default options, linked to OpenAI credentials.  
  - Inputs: Query text from Agent.  
  - Outputs: Embeddings to Pinecone retrieval node.  
  - Failure modes: API quota, errors.

- **Tax and Surcharges Report**  
  - Type: Langchain Agent  
  - Role: Generates Tax and Surcharges report similarly by analyzing EDI files.  
  - Configuration:  
    - System message tailored for Tax and Surcharges expert role.  
    - Query Pinecone for guidelines when uncertain.  
    - Outputs JSON array with tax types and amounts.  
  - Inputs: EDI data text, AI tools (OpenAI Chat Model1 + Pinecone Vector Store2).  
  - Outputs: Tax report JSON.  
  - Failure modes: Same as Accounts Receivable agent.

- **OpenAI Chat Model1**  
  - Type: Language Model node for Tax report  
  - Role: GPT-4 model for generating tax report content.  
  - Configuration: Same as other OpenAI Chat Model.  
  - Inputs: Agent prompt.  
  - Outputs: Text back to Tax agent.  
  - Failure modes: API errors.

- **Pinecone Vector Store2**  
  - Type: Vector Store (Retrieve as Tool) for Tax report  
  - Role: Retrieval support for Tax and Surcharges Report agent.  
  - Configuration: Same index, different tool name and description related to tax.  
  - Inputs: Query embeddings.  
  - Outputs: Retrieved tax-related info.  
  - Failure modes: As above.

- **Embeddings OpenAI2**  
  - Type: Embeddings for Tax report queries  
  - Role: Embeddings generation for tax report queries.  
  - Configuration: Same as others.  
  - Inputs: Query text.  
  - Outputs: Embeddings for Pinecone retrieval.  
  - Failure modes: API issues.

---

#### 1.5 Supporting Nodes and Documentation

**Overview:**  
Sticky notes providing explanatory text and high-level context related to Sabre IUR and the types of reports generated by this workflow.

**Nodes Involved:**  
- Sticky Note  
- Sticky Note1

**Node Details:**

- **Sticky Note**  
  - Content: Explanation of Sabre Interface User Record (IUR) and its role in travel agency back-office functions including Ticketing, Invoicing, and Itinerary data transmission.  
  - Position: Top left, large note.  
  - Role: Contextual information for users and maintainers.

- **Sticky Note1**  
  - Content: Lists the various accounting reports produced from the EDI files, including AR, AP, Tax, Passenger Revenue, Daily Sales, Commission, Audit, Ticketing, and Profit Margin reports.  
  - Role: Summary of outputs from the workflow.

---

### 3. Summary Table

| Node Name                      | Node Type                                   | Functional Role                                   | Input Node(s)                   | Output Node(s)                | Sticky Note                                                                                                         |
|-------------------------------|---------------------------------------------|--------------------------------------------------|--------------------------------|------------------------------|---------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’  | Manual Trigger                              | Workflow entry trigger                            | None                           | Google Drive: extract files    |                                                                                                                     |
| Google Drive: extract files    | Google Drive                               | Lists EDI files from target Drive folder         | When clicking ‘Test workflow’  | Google Drive: download file contents |                                                                                                                     |
| Google Drive: download file contents | Google Drive                         | Downloads EDI file contents                        | Google Drive: extract files    | Extract from File             |                                                                                                                     |
| Extract from File              | Extract from File                          | Extracts text from binary EDI files               | Google Drive: download file contents | Account Receivable Agent     |                                                                                                                     |
| Account Receivable Agent       | Langchain Agent                           | Generates Accounts Receivable report              | Extract from File, OpenAI Chat Model, Pinecone Vector Store | None                       |                                                                                                                     |
| OpenAI Chat Model              | OpenAI Language Model                     | Language generation for AR report                  | Account Receivable Agent       | Account Receivable Agent      |                                                                                                                     |
| Pinecone Vector Store          | Pinecone Vector Store (Retrieve as Tool) | Retrieval tool for AR agent                        | Embeddings OpenAI              | Account Receivable Agent      |                                                                                                                     |
| Embeddings OpenAI             | OpenAI Embeddings                         | Embeddings generation for Pinecone retrieval      | Account Receivable Agent       | Pinecone Vector Store         |                                                                                                                     |
| Recursive Character Text Splitter1 | Text Splitter                        | Splits documents for embedding                     | Default Data Loader1           | Default Data Loader1          |                                                                                                                     |
| Default Data Loader1           | Document Data Loader                      | Loads documents from binary data                   | Recursive Character Text Splitter1 | Embeddings OpenAI1           |                                                                                                                     |
| Embeddings OpenAI1            | OpenAI Embeddings                         | Embeddings generation for Pinecone insertion      | Default Data Loader1           | Pinecone Vector Store1        |                                                                                                                     |
| Pinecone Vector Store1         | Pinecone Vector Store (Insert mode)       | Inserts embeddings into Pinecone vector DB         | Embeddings OpenAI1             | None                         |                                                                                                                     |
| Tax and Surcharges Report      | Langchain Agent                           | Generates Tax and Surcharges report                | OpenAI Chat Model1, Pinecone Vector Store2, Extract from File | None                      |                                                                                                                     |
| OpenAI Chat Model1             | OpenAI Language Model                     | Language generation for Tax report                  | Tax and Surcharges Report      | Tax and Surcharges Report     |                                                                                                                     |
| Pinecone Vector Store2         | Pinecone Vector Store (Retrieve as Tool) | Retrieval tool for Tax report agent                 | Embeddings OpenAI2             | Tax and Surcharges Report     |                                                                                                                     |
| Embeddings OpenAI2            | OpenAI Embeddings                         | Embeddings generation for Pinecone retrieval       | Tax and Surcharges Report      | Pinecone Vector Store2        |                                                                                                                     |
| Sticky Note                   | Sticky Note                               | Provides explanation of Sabre IUR                   | None                          | None                         | Explains Sabre Interface User Record (IUR) supporting back-office travel agency functions.                          |
| Sticky Note1                  | Sticky Note                               | Lists types of accounting reports generated         | None                          | None                         | Lists 10 accounting reports produced by this workflow, including AR, AP, Tax, Passenger Revenue, Sales, etc.       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: To start workflow execution manually.

2. **Add Google Drive Node to List Files**  
   - Type: Google Drive  
   - Operation: List files in folder  
   - Resource: fileFolder  
   - Parameters:  
     - Folder ID: `172VdwV-JNLv0H7i7OXRMjYqIshg6ow1O` (EDIFileForProcessing folder)  
   - Credentials: OAuth2 Google Drive account with access to folder.  
   - Connect output to next node.

3. **Add Google Drive Node to Download File Contents**  
   - Type: Google Drive  
   - Operation: Download  
   - Resource: file  
   - Parameters: File ID set dynamically from previous node output: `={{ $json.id }}`  
   - Credentials: Same as above.  
   - Connect input from previous node.

4. **Add Extract from File Node**  
   - Type: Extract from File  
   - Operation: Text extraction  
   - Input: Binary from Google Drive download  
   - Output: Text representation of file content.

5. **Add Account Receivable Agent Node**  
   - Type: Langchain Agent  
   - Parameters:  
     - Text: Use expression to include extracted EDI text (`{{ $json.data }}`).  
     - System Role Message: Accounting and Finance Expert, instructions to generate AR report, querying Pinecone if unsure.  
     - Output: Structured JSON table of accounts receivable.  
   - Connect input from Extract from File node.

6. **Add OpenAI Chat Model Node for AR Agent**  
   - Type: LM Chat OpenAI  
   - Model: GPT-4 variant (`gpt-4o-mini`)  
   - Credentials: OpenAI API key (ensure sufficient quota).  
   - Connect as AI language model input to Account Receivable Agent node.

7. **Add Pinecone Vector Store Node for AR Agent Retrieval**  
   - Type: Vector Store Pinecone (Retrieve as Tool)  
   - Index: `package1536`  
   - Tool Name: `PackageDetails`  
   - Tool Description: "Return the Accounts Payable details reading the information from the input file."  
   - Credentials: Pinecone API key.  
   - Connect as AI tool input to Account Receivable Agent.

8. **Add Embeddings OpenAI Node for AR Agent**  
   - Type: Embeddings OpenAI  
   - Credentials: Same OpenAI API key  
   - Connect as AI embedding for Pinecone Vector Store node.

9. **Add Recursive Character Text Splitter Node**  
   - Type: Text Splitter (Recursive Character)  
   - Parameters: Chunk overlap: 50 characters  
   - Connect input from Default Data Loader1.

10. **Add Default Data Loader Node**  
    - Type: Document Default Data Loader  
    - Data Type: Binary  
    - Connect input from Recursive Character Text Splitter.

11. **Add Embeddings OpenAI Node for Vector Store Insertion**  
    - Type: Embeddings OpenAI  
    - Credentials: OpenAI API key  
    - Connect input from Default Data Loader.

12. **Add Pinecone Vector Store Node for Insertion**  
    - Type: Vector Store Pinecone (Insert mode)  
    - Index: `package1536`  
    - Credentials: Pinecone API key  
    - Connect input from Embeddings OpenAI node.

13. **Add Tax and Surcharges Report Agent Node**  
    - Type: Langchain Agent  
    - Parameters:  
      - Text: Use expression to include extracted EDI text (`{{ $json.data }}`).  
      - System Role Message: Accounting and Finance Expert specialized for Tax & Surcharges report, instructions to query Pinecone if unsure.  
      - Output: JSON table of tax types and amounts.  
    - Connect input from Extract from File node.

14. **Add OpenAI Chat Model Node for Tax Report**  
    - Type: LM Chat OpenAI  
    - Model: GPT-4 variant (`gpt-4o-mini`)  
    - Credentials: OpenAI API key  
    - Connect as AI language model input to Tax and Surcharges Report node.

15. **Add Pinecone Vector Store Node for Tax Report Retrieval**  
    - Type: Vector Store Pinecone (Retrieve as Tool)  
    - Index: `package1536`  
    - Tool Name: `PackageDetails` (same as AR but used here for tax context)  
    - Tool Description: "Return the Tax Summary aligning to the input file"  
    - Credentials: Pinecone API key  
    - Connect as AI tool input to Tax and Surcharges Report node.

16. **Add Embeddings OpenAI Node for Tax Report Queries**  
    - Type: Embeddings OpenAI  
    - Credentials: OpenAI API key  
    - Connect as AI embedding for Pinecone Vector Store node (Tax).

17. **Add Sticky Notes**  
    - Add two sticky notes with content:  
      - Explanation of Sabre IUR and its role.  
      - List of all accounting reports generated by workflow.

18. **Connect Nodes as per dependencies described above.**

19. **Validate Credentials:**  
    - Ensure Google Drive OAuth2 with access to required folders/files.  
    - OpenAI API key with GPT-4 access and sufficient quota.  
    - Pinecone API key with access to the “package1536” index.

20. **Test Workflow:**  
    - Run manual trigger.  
    - Confirm files are retrieved, processed, and reports generated successfully.

---

### 5. General Notes & Resources

| Note Content                                                                                                                 | Context or Link                                                                                  |
|------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Sabre Interface User Record (IUR) is essential for travel back-office processes including Ticketing, Invoicing, and Itinerary. | Sticky Note node content in workflow.                                                          |
| The workflow produces multiple accounting reports such as AR, AP, Tax & Surcharges, Passenger Revenue, Daily Sales, etc.       | Sticky Note1 node content lists all reports generated.                                         |
| For detailed Pinecone setup and index management, refer to: https://www.pinecone.io/docs/                                     | Recommended external documentation for Pinecone vector store integration.                      |
| OpenAI GPT-4 model “gpt-4o-mini” is used for cost-effective yet powerful language generation.                                | Credential and model choice references in OpenAI nodes.                                       |
| Ensure API quotas and rate limits are monitored to prevent workflow failures during embeddings or chat model invocations.     | Operational best practice for long-running or batch workflows.                                 |

---

**Disclaimer:**  
The provided text is exclusively from an automated workflow created using n8n, an integration and automation tool. This processing strictly complies with applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.