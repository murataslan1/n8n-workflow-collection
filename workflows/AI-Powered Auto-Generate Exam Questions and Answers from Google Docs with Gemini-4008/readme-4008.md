AI-Powered Auto-Generate Exam Questions and Answers from Google Docs with Gemini

https://n8nworkflows.xyz/workflows/ai-powered-auto-generate-exam-questions-and-answers-from-google-docs-with-gemini-4008


# AI-Powered Auto-Generate Exam Questions and Answers from Google Docs with Gemini

---

# Comprehensive Reference Document:  
**AI-Powered Auto-Generate Exam Questions and Answers from Google Docs with Gemini** (n8n Workflow)

---

## 1. Workflow Overview

This n8n workflow automates the generation of exam questions — both open-ended and multiple-choice — from educational content stored in Google Docs. Leveraging AI models (Google Gemini), OpenAI embeddings, and a vector database (Qdrant), it transforms textual educational materials into a structured, validated question bank. The final output is saved in Google Sheets, separating open and closed questions for easy educator use.

The workflow is designed for educators, e-learning platforms, and corporate training environments, enabling scalable, high-quality assessment creation with minimal manual effort.

### Logical Blocks

- **1.1 Initialization & Collection Setup**  
  Trigger workflow and prepare the Qdrant vector database collection.

- **1.2 Document Retrieval & Conversion**  
  Fetch Google Docs content and convert it to Markdown format for structured processing.

- **1.3 Text Chunking & Embedding Creation**  
  Split document into manageable chunks, generate embeddings with OpenAI, and insert into Qdrant.

- **1.4 Open-ended Question Generation & Answer Retrieval**  
  Use Google Gemini to generate open-ended questions, retrieve context-aware answers via vector search, and write results to Google Sheets.

- **1.5 Multiple-choice Question Generation with RAG Validation**  
  Generate MCQs with Google Gemini, validate correct answers and plausible distractors using Retrieval-Augmented Generation (RAG) with Qdrant, then write validated MCQs to Google Sheets.

---

## 2. Block-by-Block Analysis

---

### 2.1 Initialization & Collection Setup

**Overview:**  
Starts the workflow manually and prepares the Qdrant collection by creating or refreshing it to store document embeddings.

**Nodes Involved:**  
- When clicking ‘Test workflow’ (Manual Trigger)  
- Create collection (HTTP Request)  
- Refresh collection (HTTP Request)  
- Sticky Note2 (Informational)  
- Sticky Note3 (Instructions)  
- Sticky Note4 (Instructions)

**Node Details:**

- **When clicking ‘Test workflow’**  
  - Type: Manual Trigger  
  - Role: Starts workflow on user command.  
  - Inputs: None  
  - Outputs: Triggers "Refresh collection"  
  - Edge Cases: None, manual initiation only.

- **Create collection**  
  - Type: HTTP Request  
  - Role: Sends PUT request to Qdrant API to create a vector collection with specified size (1536) and cosine distance metric.  
  - Configuration: URL placeholder `http://QDRANT_URL/collections/COLLECTIONS` (replace with actual URL and collection name).  
  - Headers: Content-Type: application/json  
  - Body: JSON defining vector size, distance metric, shard, replication, and consistency factor.  
  - Input: Triggered by manual start (not directly connected in main flow, likely preparatory).  
  - Output: None connected in main flow.  
  - Failures: HTTP errors, authentication failures, invalid JSON, or collection already existing.

- **Refresh collection**  
  - Type: HTTP Request  
  - Role: Deletes all points in the Qdrant collection to refresh vector data before ingestion.  
  - Configuration: POST to `http://QDRANT_URL/collections/COLLECTIONS/points/delete` with empty filter (delete all points).  
  - Auth: Generic HTTP header with API key.  
  - Input: Triggered by Manual Trigger.  
  - Output: Triggers "Get Doc" to proceed with document processing.  
  - Failure Modes: HTTP errors, auth failures, invalid URL, empty or missing collection.

- **Sticky Notes**  
  - Provide setup instructions and reminders to replace placeholders (QDRANT_URL, COLLECTION name).  
  - No technical functionality.

---

### 2.2 Document Retrieval & Conversion

**Overview:**  
Fetches the Google Docs document, extracts structured content, and converts it to Markdown format for downstream AI processing.

**Nodes Involved:**  
- Get Doc (Google Docs)  
- Converto di MD (Code)  
- Convert to File (Convert to File node)  
- Sticky Note (Instructions for this block)

**Node Details:**

- **Get Doc**  
  - Type: Google Docs node  
  - Role: Retrieves the full structured JSON content of the specified Google Doc.  
  - Configuration: Uses OAuth2 credentials, documentURL parameter must be replaced with the target Google Doc URL or ID.  
  - Output: JSON object representing the full document content, including paragraphs, styles, text runs, etc.  
  - Failure: Permissions errors, invalid document ID, API rate limits.

- **Converto di MD**  
  - Type: Code (JavaScript) node  
  - Role: Converts Google Docs JSON content into Markdown text respecting headings, bold, and italic styling.  
  - Key Logic: Maps Google Docs heading styles to Markdown headers (#, ##, etc.), applies bold (**), italic (*) formatting, and concatenates paragraphs.  
  - Input: JSON from Get Doc  
  - Output: Single JSON with `markdown` property containing the Markdown string.  
  - Edge Cases: Unexpected document structure, missing text runs, or unsupported styles may result in incomplete Markdown.

- **Convert to File**  
  - Type: Convert to File node  
  - Role: Converts the Markdown string into a file format (text), preparing data for vector processing.  
  - Input: Markdown string from "Converto di MD"  
  - Output: Binary/text file data containing Markdown content.  
  - Failure: Conversion errors if input is malformed.

- **Sticky Note**  
  - Explains document ingestion and conversion purpose.

---

### 2.3 Text Chunking & Embedding Creation

**Overview:**  
Splits the Markdown document into overlapping chunks, generates vector embeddings for semantic representation using OpenAI, and inserts them into the Qdrant vector store.

**Nodes Involved:**  
- Token Splitter (Text Splitter)  
- Default Data Loader (Document Loader)  
- Embeddings OpenAI (OpenAI embeddings)  
- Qdrant Vector Store (Insert mode)  
- Sticky Note4 (Instructions)

**Node Details:**

- **Token Splitter**  
  - Type: LangChain Text Splitter (Token Splitter)  
  - Role: Splits the Markdown text into chunks of 450 tokens with 50 tokens overlap to preserve context.  
  - Input: Markdown text file from "Convert to File" node  
  - Output: Array of text chunks  
  - Edge Cases: Very short documents produce fewer chunks; large documents split properly.

- **Default Data Loader**  
  - Type: LangChain Document Default Data Loader  
  - Role: Loads text chunks as documents for embedding generation.  
  - Input: Text chunks from Token Splitter  
  - Output: Document format for embedding node  
  - Dependency: Must handle binary data properly.

- **Embeddings OpenAI**  
  - Type: LangChain OpenAI Embeddings node  
  - Role: Generates 1536-dimensional vector embeddings for each text chunk using OpenAI API.  
  - Configuration: Uses OpenAI API key credentials.  
  - Input: Document chunks from Data Loader  
  - Output: Embeddings results for vector storage  
  - Failure Modes: API rate limits, invalid API key, network errors.

- **Qdrant Vector Store**  
  - Type: LangChain Qdrant Vector Store node  
  - Role: Inserts the generated embeddings into the specified Qdrant collection (`ai_article_test`).  
  - Configuration: Auth with Qdrant API key and URL  
  - Input: Embeddings from OpenAI node  
  - Output: Confirmation of insert operation  
  - Failures: Qdrant unavailable, auth errors, duplicate collections.

- **Sticky Note4**  
  - Advises to replace QDRANTURL and COLLECTION placeholders.

---

### 2.4 Open-ended Question Generation & Answer Retrieval

**Overview:**  
Generates 10 open-ended, critical-thinking questions from the article using Google Gemini, retrieves context-aware answers by querying the vector store, and writes the question-answer pairs to Google Sheets.

**Nodes Involved:**  
- Open questions (LangChain LLM Chain)  
- Item List Output Parser (Output parsing for list of questions)  
- Loop Over Items (Split in Batches)  
- Answer questions (Chain Retrieval QA)  
- Google Gemini Chat Model (AI language model for question generation)  
- Google Gemini Chat Model1 (AI language model for answer generation)  
- Vector Store Retriever (Retriever from Qdrant)  
- Write open (Google Sheets append)  
- Sticky Note (Step 3 instructions)

**Node Details:**

- **Open questions**  
  - Type: Chain LLM (LangChain)  
  - Role: Uses Google Gemini (gemini-2.0-flash-exp model) to generate exactly 10 open-ended questions testing comprehension, inference, and application without answers.  
  - Input: Markdown article text as prompt input  
  - Prompt: Detailed instructions for question types and formatting (no numbering, clear wording, mix of difficulties).  
  - Output: Raw AI text of 10 questions.  
  - Edge Cases: AI hallucination or unclear questions, language mismatch.

- **Item List Output Parser**  
  - Type: Output Parser (Item List)  
  - Role: Parses AI output into separate items (questions), ensuring exactly 10 discrete questions.  
  - Input: AI output text from Open questions node  
  - Output: List of question items  
  - Failure: Parsing errors if AI output format deviates.

- **Loop Over Items**  
  - Type: Split In Batches  
  - Role: Iterates over each open question item one by one for processing.  
  - Input: List of questions  
  - Output: Single question per iteration to next node.

- **Answer questions**  
  - Type: Chain Retrieval QA  
  - Role: Queries the vector store retriever with the question to fetch relevant context and generate an answer using Google Gemini (gemini-2.0-pro-exp).  
  - Configuration: System prompt instructs AI to only answer if context is known, otherwise reply “I don’t know.” Plain text output.  
  - Input: Single question text from loop  
  - Output: Answer text to be saved  
  - Failure: Retrieval errors, AI hallucination, connectivity issues.

- **Google Gemini Chat Model (for Open Questions)**  
  - Used inside "Open questions" and "Answer questions" nodes as LLM backend.

- **Vector Store Retriever**  
  - Type: Retriever node linked to Qdrant collection "ai_article_test"  
  - Role: Fetches relevant document chunks based on question embeddings for context in answer generation.

- **Write open**  
  - Type: Google Sheets Append  
  - Role: Writes question and generated answer to the “Open questions” tab in the specified Google Sheet.  
  - Configuration: Columns mapped for QUESTION and ANSWER.  
  - Input: Answers matched to questions from the loop.  
  - Failures: Permissions, invalid Sheet ID, API limits.

- **Sticky Note**  
  - Describes the step: generating open questions and their answers by vector store consultation.

---

### 2.5 Multiple-choice Question Generation with RAG Validation

**Overview:**  
Generates 10 multiple-choice questions (MCQs) with Google Gemini, uses Retrieval-Augmented Generation (RAG) over Qdrant to verify correct answers and generate plausible distractors, then writes these validated MCQs to a separate Google Sheets tab.

**Nodes Involved:**  
- Closed questions (LangChain Chain LLM)  
- Item List Output Parser1 (Output parsing for MCQs)  
- Loop Over Items1 (Split In Batches over MCQs)  
- Answer and create options (LangChain Agent with RAG)  
- RAG (LangChain Tool Vector Store)  
- Structured Output Parser (Parses correct answer + distractors)  
- Google Gemini Chat Model2, 3, 4 (LM for generation and validation)  
- Qdrant Vector Store1, Vector Store2 (For embedding and retrieval)  
- Embeddings OpenAI1, Embeddings OpenAI2 (For embeddings creation)  
- Write closed (Google Sheets Append)  
- Sticky Note1 (Step 4 instructions)

**Node Details:**

- **Closed questions**  
  - Type: Chain LLM  
  - Role: Generates 10 MCQs from article text with four options each (A-D), without indicating correct answer.  
  - Model: Google Gemini “gemini-2.0-flash-exp”  
  - Prompt: Detailed instructions enforcing plausible distractors, varied question types, and no numbering.  
  - Input: Markdown article text  
  - Output: Raw text of 10 MCQs.

- **Item List Output Parser1**  
  - Parses MCQ text output into individual question items.

- **Loop Over Items1**  
  - Iterates over each MCQ for further processing.

- **Answer and create options**  
  - Type: LangChain Agent with RAG tool  
  - Role: For each MCQ, uses RAG to retrieve accurate context from Qdrant, formulates the correct answer, and generates three plausible but incorrect options.  
  - System Message: Strict constraints to only use RAG data for correctness, ensure plausible distractors, no markdown or meta-info.  
  - Input: Single MCQ text from loop.  
  - Output: JSON with `correct` answer string and `answers` array of 4 options total.  
  - Failure: Retrieval errors, AI hallucination, formatting errors.

- **RAG**  
  - Type: Tool Vector Store node  
  - Role: Retrieves context from Qdrant to feed the agent during MCQ answer validation and distractor generation.

- **Structured Output Parser**  
  - Parses agent output into structured JSON object with `correct` answer and `answers` array.

- **Google Gemini Chat Models 2, 3, 4**  
  - Used as LLM backends for MCQ generation, answer validation, and RAG interaction.

- **Qdrant Vector Store1, Qdrant Vector Store2**  
  - Used for embedding insertion and retrieval during RAG validation.

- **Embeddings OpenAI1, Embeddings OpenAI2**  
  - Generate embeddings for MCQ-related vector operations.

- **Write closed**  
  - Type: Google Sheets Append  
  - Role: Appends validated MCQs with options and correct answer to the “Closed questions” tab in the Google Sheet.  
  - Columns: QUESTION, ANSWER A-D, CORRECT (correct answer string).  
  - Input: Structured output from MCQ agent.  
  - Failures: Permissions issues, invalid Sheet ID, API limits.

- **Sticky Note1**  
  - Explains the closed questions generation and validation process.

---

## 3. Summary Table

| Node Name                 | Node Type                                  | Functional Role                                        | Input Node(s)                 | Output Node(s)                  | Sticky Note                                  |
|---------------------------|--------------------------------------------|-------------------------------------------------------|-------------------------------|---------------------------------|----------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger                           | Initiates workflow manually                            | None                          | Refresh collection              |                                              |
| Create collection          | HTTP Request                              | Creates Qdrant vector collection                       | None (manual prep)             | None                           | # STEP 1: Replace QDRANTURL and COLLECTION   |
| Refresh collection         | HTTP Request                              | Clears Qdrant collection points for fresh ingestion   | When clicking ‘Test workflow’  | Get Doc                       | # STEP 1: Replace QDRANTURL and COLLECTION   |
| Get Doc                   | Google Docs                               | Retrieves Google Docs content as JSON                  | Refresh collection             | Converto di MD                 |                                              |
| Converto di MD            | Code                                      | Converts Google Docs JSON to Markdown text             | Get Doc                       | Closed questions, Convert to File, Open questions |                                              |
| Convert to File           | Convert To File                           | Converts Markdown text to file format                   | Converto di MD                | Qdrant Vector Store            |                                              |
| Token Splitter            | LangChain Text Splitter                   | Splits Markdown into chunks                             | Convert to File               | Default Data Loader            | # STEP 2: Replace QDRANTURL and COLLECTION   |
| Default Data Loader       | LangChain Document Loader                  | Loads chunked text as documents                         | Token Splitter                | Qdrant Vector Store            | # STEP 2: Replace QDRANTURL and COLLECTION   |
| Embeddings OpenAI         | LangChain Embeddings (OpenAI)              | Generates embeddings for document chunks               | Default Data Loader           | Qdrant Vector Store            |                                              |
| Qdrant Vector Store       | LangChain Vector Store (Qdrant)            | Inserts embeddings into Qdrant collection               | Embeddings OpenAI, Convert to File | None                       | # STEP 2: Replace QDRANTURL and COLLECTION   |
| Open questions            | LangChain Chain LLM                       | Generates 10 open-ended questions from article         | Converto di MD               | Loop Over Items                | # STEP 3: Open questions generation           |
| Item List Output Parser   | LangChain Output Parser (Item List)        | Parses open question list                               | Open questions               | Loop Over Items                | # STEP 3: Open questions generation           |
| Loop Over Items           | Split In Batches                          | Splits open questions to process individually           | Item List Output Parser       | Answer questions              | # STEP 3: Open questions processing           |
| Google Gemini Chat Model  | LangChain LLM (Google Gemini)               | AI model for question generation                        | Open questions               | Open questions                |                                              |
| Google Gemini Chat Model1 | LangChain LLM (Google Gemini)               | AI model for answer generation                          | Loop Over Items              | Answer questions              |                                              |
| Vector Store Retriever    | LangChain Retriever (Qdrant)                | Retrieves context from Qdrant for retrieval QA          | Qdrant Vector Store1          | Answer questions              |                                              |
| Answer questions          | LangChain Chain Retrieval QA              | Generates answers based on retrieved context            | Loop Over Items              | Write open                   |                                              |
| Write open                | Google Sheets Append                      | Writes open-ended questions and answers to Google Sheets | Answer questions             | Loop Over Items (next batch)  |                                              |
| Closed questions          | LangChain Chain LLM                       | Generates 10 multiple-choice questions from article     | Converto di MD               | Item List Output Parser1       | # STEP 4: Closed questions generation          |
| Item List Output Parser1  | LangChain Output Parser (Item List)        | Parses MCQ question list                                | Closed questions             | Loop Over Items1              | # STEP 4: Closed questions generation          |
| Loop Over Items1          | Split In Batches                          | Splits MCQs to process individually                      | Item List Output Parser1      | Answer and create options     | # STEP 4: MCQ processing                       |
| Google Gemini Chat Model2 | LangChain LLM (Google Gemini)               | AI model for MCQ generation                             | Closed questions             | Item List Output Parser1       |                                              |
| Google Gemini Chat Model3 | LangChain LLM (Google Gemini)               | AI model for MCQ answer validation                      | Loop Over Items1             | Answer and create options     |                                              |
| Google Gemini Chat Model4 | LangChain LLM (Google Gemini)               | AI model used by RAG tool                               | RAG                         | Answer and create options     |                                              |
| RAG                       | LangChain Tool Vector Store (Qdrant)        | Retrieval augmented generation for MCQ validation      | Qdrant Vector Store2          | Answer and create options     |                                              |
| Qdrant Vector Store1      | LangChain Vector Store (Qdrant)            | Embedding storage for MCQ context                       | Embeddings OpenAI1           | Vector Store Retriever        |                                              |
| Qdrant Vector Store2      | LangChain Vector Store (Qdrant)            | Vector store used by RAG tool                           | Embeddings OpenAI2           | RAG                          |                                              |
| Embeddings OpenAI1        | LangChain Embeddings (OpenAI)              | Embeddings for MCQ chunks                               | Loop Over Items1             | Qdrant Vector Store1          |                                              |
| Embeddings OpenAI2        | LangChain Embeddings (OpenAI)              | Embeddings for RAG retrieval                            | Loop Over Items1             | Qdrant Vector Store2          |                                              |
| Structured Output Parser  | LangChain Output Parser (Structured JSON)   | Parses MCQ output into correct answer and distractors  | Answer and create options    | Write closed                 |                                              |
| Answer and create options | LangChain Agent with RAG                   | Validates MCQ answers and generates distractors        | Loop Over Items1             | Structured Output Parser      |                                              |
| Write closed              | Google Sheets Append                      | Writes MCQs with options and correct answer to Google Sheets | Structured Output Parser    | Loop Over Items1 (next batch) |                                              |
| Sticky Notes (various)    | Sticky Note nodes                          | Provide instructions, setup guidance, and context      | None                        | None                        | See detailed notes in sections above          |

---

## 4. Reproducing the Workflow from Scratch

To manually recreate this workflow in n8n, follow these ordered steps:

### Setup Prerequisites

- Create and configure credentials for:  
  - Google Docs OAuth2 (read access)  
  - Google Sheets OAuth2 (write access)  
  - OpenAI API key (for embeddings)  
  - Google Gemini / PaLM API key (for question generation)  
  - Qdrant API key and base URL (self-hosted or cloud)

---

### Step 1: Initialization & Qdrant Setup

1. Create a **Manual Trigger** node named `When clicking ‘Test workflow’`.

2. Add an **HTTP Request** node named `Create collection`:  
   - Method: PUT  
   - URL: `http://<QDRANT_URL>/collections/<COLLECTION_NAME>`  
   - Headers: Content-Type: application/json  
   - Body (JSON):  
     ```json
     {
       "vectors": {
         "size": 1536,
         "distance": "Cosine"
       },
       "shard_number": 1,
       "replication_factor": 1,
       "write_consistency_factor": 1
     }
     ```
   - Use HTTP Header Auth credential with Qdrant API key.

3. Add an **HTTP Request** node named `Refresh collection`:  
   - Method: POST  
   - URL: `http://<QDRANT_URL>/collections/<COLLECTION_NAME>/points/delete`  
   - Headers: Content-Type: application/json  
   - Body (JSON): `{ "filter": {} }`  
   - Use same Qdrant credentials.

4. Connect `When clicking ‘Test workflow’` → `Refresh collection`.

5. Connect `Refresh collection` → next step (Get Doc).

---

### Step 2: Document Retrieval & Conversion

6. Add a **Google Docs** node named `Get Doc`:  
   - Operation: Get document content  
   - Document URL: Replace with your Google Doc URL or ID  
   - Credentials: Google Docs OAuth2

7. Add a **Code** node named `Converto di MD` to convert JSON to Markdown:  
   - Paste the JavaScript function that maps Google Docs JSON to Markdown (headings, bold, italic).  
   - Input: JSON from `Get Doc`  
   - Output: JSON with `markdown` string.

8. Add a **Convert To File** node named `Convert to File`:  
   - Operation: toText  
   - Source Property: `markdown` from previous node  
   - Output: Text file for processing

---

### Step 3: Text Chunking & Embedding

9. Add **LangChain Text Splitter (Token Splitter)** node:  
   - Chunk size: 450 tokens  
   - Chunk overlap: 50 tokens  
   - Input: Text file from `Convert to File`

10. Add **LangChain Default Data Loader** node:  
    - Loader: textLoader  
    - Input: Chunks from Token Splitter

11. Add **LangChain Embeddings OpenAI** node:  
    - Credentials: OpenAI API key  
    - Input: Loaded documents from previous node

12. Add **LangChain Qdrant Vector Store** node:  
    - Mode: Insert  
    - Collection: `<COLLECTION_NAME>`  
    - Credentials: Qdrant API key and URL  
    - Input: Embeddings output

13. Connect nodes in order: `Convert to File` → `Token Splitter` → `Default Data Loader` → `Embeddings OpenAI` → `Qdrant Vector Store`

---

### Step 4: Open-ended Question Generation & Answering

14. Add **LangChain Chain LLM** node named `Open questions`:  
    - Text: Include prompt with article markdown (`{{ $json.markdown }}`)  
    - Model: Google Gemini (gemini-2.0-flash-exp)  
    - Configure prompt as per detailed instructions for open questions.

15. Add **LangChain Output Parser Item List** node to parse 10 questions.

16. Add **Split In Batches** node named `Loop Over Items` to process questions individually.

17. Add **LangChain Chain Retrieval QA** node named `Answer questions`:  
    - System prompt instructing answer generation using retrieved context or “I don’t know.”  
    - Model: Google Gemini (gemini-2.0-pro-exp)  
    - Configure retriever to use Qdrant vector store retriever node.

18. Add **LangChain Retriever Vector Store** node connected to Qdrant collection for retrieval.

19. Add **Google Sheets** node named `Write open`:  
    - Operation: Append row  
    - Sheet ID and tab for open questions  
    - Map columns: QUESTION (question text), ANSWER (answer text)  

20. Connect flow: `Converto di MD` → `Open questions` → `Item List Output Parser` → `Loop Over Items` → `Answer questions` → `Write open`

---

### Step 5: Multiple-choice Question Generation & Validation

21. Add **LangChain Chain LLM** node named `Closed questions`:  
    - Text prompt detailed for MCQ generation with 4 options, no answers included.  
    - Model: Google Gemini (gemini-2.0-flash-exp)  
    - Input: Markdown article

22. Add **LangChain Output Parser Item List** node to parse MCQs.

23. Add **Split In Batches** node named `Loop Over Items1` for MCQs.

24. Add **LangChain Agent** node named `Answer and create options`:  
    - System prompt instructs to generate correct answer and 3 plausible distractors using RAG only.  
    - Model: Google Gemini (gemini-2.0-pro-exp)  
    - Use LangChain Tool Vector Store node named `RAG` connected to Qdrant.

25. Add **LangChain Tool Vector Store (RAG)** node connected to Qdrant vector store.

26. Add **LangChain Output Parser Structured** node:  
    - Schema expects object with `correct` (string), `answers` (array of 4 strings).

27. Add **Google Sheets** node named `Write closed`:  
    - Operation: Append row  
    - Sheet ID and tab for closed questions  
    - Map columns QUESTION, ANSWER A-D, CORRECT

28. Connect flow:  
    `Converto di MD` → `Closed questions` → `Item List Output Parser1` → `Loop Over Items1` → `Answer and create options` → `Structured Output Parser` → `Write closed`

---

### Finalize Workflow Connections

- Connect `When clicking ‘Test workflow’` → `Refresh collection` → `Get Doc` → (Document retrieval & conversion sequence)  
- Connect embedding and vector store nodes accordingly.  
- Connect open questions and closed questions branches independently to their respective sheets.

---

## 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                     | Context or Link                                                                                  |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow automates creating curriculum-aligned exam questions from Google Docs content using cutting-edge AI and vector databases. It significantly reduces manual test preparation time.                                                                                                                                                                    | Workflow Overview section                                                                        |
| Replace all placeholder URLs and IDs in HTTP requests and Google Docs/Sheets nodes before running.                                                                                                                                                                                                                                                            | Sticky Notes in workflow                                                                         |
| Google Gemini (PaLM) models require API access and credentials; ensure correct setup and usage limits.                                                                                                                                                                                                                                                         | Node credentials                                                                                |
| Qdrant vector database is critical for semantic retrieval; ensure the collection is properly created and refreshed before ingestion.                                                                                                                                                                                                                          | Sticky Notes and HTTP Request nodes setup                                                      |
| The prompt design in LLM nodes is critical — ensure prompts for question generation are maintained or adapted carefully to preserve output quality.                                                                                                                                                                                                           | Nodes `Open questions`, `Closed questions` prompt details                                      |
| For large documents, adjust chunk size and overlap in the Token Splitter node to balance context preservation and performance.                                                                                                                                                                                                                                | Token Splitter node parameters                                                                  |
| The workflow currently targets English content but can be adapted for other languages by modifying prompts accordingly.                                                                                                                                                                                                                                        | Prompt instructions in question generation nodes                                               |
| Contact info for workflow customization or support: [info@n3w.it](mailto:info@n3w.it), LinkedIn: [https://www.linkedin.com/in/davideboizza/](https://www.linkedin.com/in/davideboizza/)                                                                                                                                                                         | Contact section                                                                                |
| Video walkthrough and detailed setup guides may be available on the author's blog or site (not included here).                                                                                                                                                                                                                                                | Suggested external resources                                                                    |

---

This concludes the detailed, structured documentation of the n8n workflow **"Generate Exam Questions"** with AI-powered generation from Google Docs using Gemini and Qdrant.