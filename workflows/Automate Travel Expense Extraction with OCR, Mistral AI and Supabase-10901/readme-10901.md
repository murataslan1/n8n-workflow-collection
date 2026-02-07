Automate Travel Expense Extraction with OCR, Mistral AI and Supabase

https://n8nworkflows.xyz/workflows/automate-travel-expense-extraction-with-ocr--mistral-ai-and-supabase-10901


# Automate Travel Expense Extraction with OCR, Mistral AI and Supabase

---

### 1. Workflow Overview

This workflow automates the extraction and calculation of travel expenses from uploaded receipts, invoices, hotel bills, PDFs, and images using OCR, AI processing, and a Supabase database. It is designed primarily for business travel expense management, enabling users to upload expense documents via chat and receive structured expense summaries with computed totals.

The workflow consists of the following logical blocks:

- **1.1 Chat Input & File Reception:** Captures user chat messages with optional file uploads, manages session context.
- **1.2 File Validation & Preprocessing:** Checks for uploaded files, extracts and normalizes binary data for OCR processing.
- **1.3 OCR Processing & Storage:** Sends files to an OCR API, parses returned JSONL output, and stores results in Supabase.
- **1.4 Data Retrieval & Merging:** Retrieves stored OCR data from Supabase and merges with chat input when no new file is uploaded.
- **1.5 AI Processing & Calculation:** Uses Mistral AI and LangChain agents with memory buffers and calculator tools to extract structured expense data, infer missing values, and compute totals.
- **1.6 Output Delivery:** Returns a structured expense summary to the user chat interface.

---

### 2. Block-by-Block Analysis

#### 2.1 Chat Input & File Reception

- **Overview:**  
  Receives user chat messages and optional file uploads via a chat trigger node. Maintains session context with memory buffer nodes.

- **Nodes Involved:**  
  - When chat message received  
  - Simple Memory  

- **Node Details:**  

  - **When chat message received**  
    - Type: Chat Trigger (LangChain)  
    - Role: Entry point for user messages and file uploads, with session handling via sessionId.  
    - Configuration: Public webhook; allows file uploads; custom CSS branding for chat UI; initial welcome messages instructing users to upload documents.  
    - Key expressions: Uses `sessionId` to track session data.  
    - Inputs: HTTP webhook requests from chat UI  
    - Outputs: Passes message and file payload downstream.  
    - Edge cases: Missing or malformed sessionId, unsupported file types, large files, or upload interruptions.

  - **Simple Memory**  
    - Type: LangChain Memory Buffer Window  
    - Role: Maintains short-term chat context with window length of 10 messages to provide conversation continuity.  
    - Configuration: Context window length = 10.  
    - Input: Connected to “When chat message received”.  
    - Output: Feeds context into AI agent nodes downstream.  
    - Edge cases: Memory overflow if window not managed; possible desynchronization with session state.

#### 2.2 File Validation & Preprocessing

- **Overview:**  
  Checks if the incoming chat message includes an uploaded file. If present, extracts the first binary file and normalizes its structure for OCR processing.

- **Nodes Involved:**  
  - CHECK IF BINARY FILE IS PRESENT OR NOT (IF node)  
  - Split Out  
  - NORMALIZE binary file  

- **Node Details:**  

  - **CHECK IF BINARY FILE IS PRESENT OR NOT**  
    - Type: IF node  
    - Role: Evaluates presence of `files` array in the incoming JSON payload.  
    - Configuration: Condition checks if `$json.files` array exists and is non-empty.  
    - Inputs: From “When chat message received”.  
    - Outputs:  
      - True branch: file present → Split Out node  
      - False branch: no file → Merge node (skips OCR)  
    - Edge cases: Payload without `files` key, empty file uploads, false positives if file field malformed.

  - **Split Out**  
    - Type: SplitOut  
    - Role: Extracts the first binary file from the uploaded files array and places it under the `data` binary field for standardization.  
    - Configuration: Extracts first binary key, includes binary in output.  
    - Inputs: From IF node (true branch).  
    - Outputs: Normalized binary to next node.  
    - Edge cases: Multiple files uploads (only first processed), files with unusual binary keys.

  - **NORMALIZE binary file**  
    - Type: Code (JavaScript)  
    - Role: Normalizes binary data by selecting the first binary key and returning it as `binary.data` to maintain consistent payload shape for OCR.  
    - Configuration: Custom JavaScript that maps input items to output with `binary.data`.  
    - Inputs: From Split Out.  
    - Outputs: Prepared binary for OCR uploading.  
    - Edge cases: Items with no binary data, empty binaries, malformed binary content.

#### 2.3 OCR Processing & Storage

- **Overview:**  
  Sends the normalized binary file to an OCR API endpoint, expects JSONL output with blocks of parsed text, and stores the parsed OCR results in Supabase temporary storage keyed by session.

- **Nodes Involved:**  
  - OCR (ANY OCR API )  
  - STORE OCR OUTPUT  

- **Node Details:**  

  - **OCR (ANY OCR API )**  
    - Type: HTTP Request  
    - Role: Uploads the binary file as multipart/form-data to OCR service.  
    - Configuration: POST method; multipart-form-data; parameters include mode=single, output_type=jsonl, include_images=false; file sent as form binary data named `data`.  
    - Inputs: From NORMALIZE binary file.  
    - Outputs: OCR JSONL response.  
    - Edge cases: OCR service downtime, malformed response, timeout, file size limits.

  - **STORE OCR OUTPUT**  
    - Type: Supabase node  
    - Role: Inserts OCR parsed data into the `temp_table` Supabase table for storage and later retrieval.  
    - Configuration: Inserts fields `session_id` (from chat session), `file` (OCR parsed blocks), and `file_name` (source filename).  
    - Inputs: From OCR node.  
    - Outputs: Passes stored data to Merge node.  
    - Edge cases: Database connectivity issues, permission or schema mismatch, large data size.

#### 2.4 Data Retrieval & Merging

- **Overview:**  
  Merges OCR results and chat inputs into a single item for AI processing. If no file is uploaded, retrieves previously stored OCR data for the session from Supabase.

- **Nodes Involved:**  
  - Merge  
  - Supabase Get  

- **Node Details:**  

  - **Merge**  
    - Type: Merge  
    - Role: Combines two data streams—OCR output with chat input or just chat input alone—into one unified object for the agent.  
    - Configuration: Defaults (mode: append or merge).  
    - Inputs:  
      - From STORE OCR OUTPUT (OCR data)  
      - From IF node false branch (no new file, direct chat input)  
    - Outputs: Single merged item to AI agent.  
    - Edge cases: Mismatched data shapes, empty merges.

  - **Supabase Get**  
    - Type: Supabase node (Get All)  
    - Role: Fetches stored OCR data from `temp_table` filtered by current session_id to supply past OCR data to AI agent when no new file is uploaded.  
    - Configuration: Filter condition `session_id = current chat sessionId`.  
    - Inputs: Connected as AI tool input to Travel reimbursement agent.  
    - Outputs: Supplies past OCR data for agent reference.  
    - Edge cases: No records found, database access issues.

#### 2.5 AI Processing & Calculation

- **Overview:**  
  Processes the merged chat and OCR data with a sophisticated AI agent that extracts structured travel expense fields, infers missing data, and computes totals using a calculator tool. The agent uses Mistral Cloud language model and maintains short-term memory context.

- **Nodes Involved:**  
  - Travel reimbursement agent  
  - Mistral Cloud Chat Model  
  - Calculator1  
  - Simple Memory1  

- **Node Details:**  

  - **Travel reimbursement agent**  
    - Type: LangChain Agent  
    - Role: Core AI logic that parses uploaded expenses (vendor, category, dates, currency, amounts), infers missing info, sums totals, and answers user queries about travel expenses.  
    - Configuration:  
      - System message defines strict rules to never respond with "unclear", to always estimate missing values, and to extract required fields including vendor_name, category, invoice_date, checkin_date, checkout_date, time, currency, total_amount, notes, and estimated flag.  
      - Uses calculator tool for summing totals.  
      - Uses Supabase data retrieval to fetch previously stored expenses.  
      - Enforces professional, concise business tone.  
    - Inputs:  
      - Main input: Merged chat + OCR data.  
      - AI tool inputs: Calculator1 and Supabase Get nodes.  
      - AI language model: Mistral Cloud Chat Model.  
      - AI memory: Simple Memory1.  
    - Outputs: Expense summary response to chat.  
    - Edge cases: Incomplete OCR data, conflicting totals, API failures, inference errors.

  - **Mistral Cloud Chat Model**  
    - Type: LangChain Language Model (Mistral Cloud)  
    - Role: Provides natural language processing and understanding capabilities to the agent.  
    - Configuration: Model set to "mistral-medium-latest", temperature 0.2 for controlled creativity.  
    - Inputs: Connected as AI language model to the agent.  
    - Edge cases: API key expiration, rate limits, model availability.

  - **Calculator1**  
    - Type: LangChain Calculator Tool  
    - Role: Performs arithmetic calculations, sums totals, and handles currency logic for expense computation.  
    - Configuration: Default.  
    - Inputs: Connected as AI tool for agent's use.  
    - Edge cases: Numeric parsing errors, currency inconsistencies.

  - **Simple Memory1**  
    - Type: LangChain Memory Buffer Window  
    - Role: Maintains AI agent conversational context.  
    - Inputs: Connected as AI memory to the agent.  
    - Edge cases: Context overflow, synchronization issues.

---

### 3. Summary Table

| Node Name                         | Node Type                          | Functional Role                                            | Input Node(s)                   | Output Node(s)                 | Sticky Note                                                                                                                       |
|----------------------------------|----------------------------------|------------------------------------------------------------|--------------------------------|-------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| When chat message received        | Chat Trigger (LangChain)          | Receives user chat and uploads, manages sessionId           | (Webhook request)              | CHECK IF BINARY FILE IS PRESENT OR NOT | Chat Trigger / UI: Receives user messages and optional uploads. `allowFileUploads` must be true. Uses sessionId for sessions.    |
| Simple Memory                    | Memory Buffer Window (LangChain) | Maintains short-term chat context                            | When chat message received     | (to agent)                    | Memory & Calculator: Memory retains short session context...                                                                     |
| CHECK IF BINARY FILE IS PRESENT OR NOT | IF node                         | Checks if uploaded file exists                               | When chat message received     | Split Out (true), Merge (false) | Binary Presence Check: IF node verifies presence of `files` in the payload. Routes accordingly.                                  |
| Split Out                       | SplitOut                         | Extracts first binary file into `data` field                 | CHECK IF BINARY FILE IS PRESENT OR NOT (true) | NORMALIZE binary file          | Split Out (binary -> data): Extracts first binary object into `data` field.                                                      |
| NORMALIZE binary file           | Code                            | Normalizes binary to consistent shape for OCR                | Split Out                     | OCR (ANY OCR API )            | NORMALIZE binary file: picks first binary key, returns as `binary.data`.                                                        |
| OCR (ANY OCR API )               | HTTP Request                    | Sends file to OCR API, expects JSONL blocks                  | NORMALIZE binary file          | STORE OCR OUTPUT              | OCR (ANY OCR API): Sends multipart file to OCR endpoint, expects JSONL with `blocks`.                                            |
| STORE OCR OUTPUT                | Supabase Insert                 | Stores OCR results in Supabase table `temp_table`            | OCR (ANY OCR API )             | Merge                         | STORE OCR OUTPUT (Supabase)                                                                                                      |
| Merge                          | Merge                          | Combines OCR results and chat input into one item            | STORE OCR OUTPUT, CHECK IF BINARY FILE IS PRESENT OR NOT (false) | Travel reimbursement agent    | Merge: Combines OCR results and non-file input into single item for AI agent.                                                   |
| Supabase Get                   | Supabase Get                   | Retrieves stored OCR data by session_id                       | (AI Tool input to agent)       | (AI Tool input)               | Security & Retention: Follow zero-retention, encrypt credentials, limit Supabase access.                                         |
| Travel reimbursement agent     | LangChain Agent                | Extracts structured expense data, infers missing fields, calculates totals | Merge                         | (chat response)               | Travel Reimbursement Agent (core): Parses OCR into fields, infers missing, sums totals, never returns "unclear".                 |
| Mistral Cloud Chat Model       | LangChain Language Model       | Provides NLP for agent                                        | (AI language model input)      | Travel reimbursement agent    | Memory & Calculator: Uses Mistral AI model with controlled temperature for accuracy.                                             |
| Calculator1                   | LangChain Calculator Tool       | Performs numeric calculations and sums                        | (AI tool input)                | Travel reimbursement agent    | Memory & Calculator: Performs numeric sums and currency handling for agent.                                                     |
| Simple Memory1                | Memory Buffer Window (LangChain) | Maintains AI agent conversational context                    | (AI memory input)              | Travel reimbursement agent    | Memory & Calculator                                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Chat Trigger Node**  
   - Type: `@n8n/n8n-nodes-langchain.chatTrigger`  
   - Set webhook to public, enable file uploads (`allowFileUploads = true`).  
   - Customize UI CSS as provided for branding.  
   - Add initial messages greeting the user and instructions.  
   - Store incoming sessionId for session tracking.

2. **Add Simple Memory Node (for Chat Context)**  
   - Type: `@n8n/n8n-nodes-langchain.memoryBufferWindow`  
   - Configure `contextWindowLength` = 10.  
   - Connect input from Chat Trigger node.  

3. **Add IF Node to Check Binary Presence**  
   - Type: IF  
   - Condition: Check if `$json.files` array exists and has at least one element (`array exists`).  
   - Input: Chat Trigger node output.  
   - True branch: proceed to Split Out; False branch: proceed to Merge node.

4. **Add Split Out Node**  
   - Type: SplitOut  
   - Configure to extract first binary key from incoming payload to a new binary field named `data`.  
   - Input: IF node true branch.

5. **Add Code Node to Normalize Binary File**  
   - Type: Code  
   - JavaScript: Map items, extract first binary key, return as `binary.data`.  
   - Input: Split Out node output.

6. **Add HTTP Request Node for OCR API**  
   - Type: HTTP Request  
   - Method: POST  
   - Content-Type: multipart-form-data  
   - Body parameters:  
     - mode: single  
     - output_type: jsonl  
     - include_images: false  
     - files: mapped from `binary.data`  
   - Input: Code normalization node.  
   - Configure with OCR API endpoint URL and credentials if required.

7. **Add Supabase Insert Node to Store OCR Output**  
   - Type: Supabase Insert  
   - Table: `temp_table` (must exist in Supabase)  
   - Fields:  
     - `session_id`: from chat `sessionId`  
     - `file`: OCR API response parsed blocks (convert JSONL as needed)  
     - `file_name`: from OCR response source field  
   - Input: OCR HTTP Request node.

8. **Add Merge Node**  
   - Type: Merge  
   - Configure to combine two inputs:  
     - Input 1: output of Supabase Insert (OCR data)  
     - Input 2: IF node false branch (no file upload, direct chat input)  
   - Output: Unified item for AI agent.

9. **Add Supabase Get Node**  
   - Type: Supabase Get All  
   - Table: `temp_table`  
   - Filter: `session_id` equals current chat sessionId (use expression).  
   - This node will be connected as an AI tool input for the agent.

10. **Add LangChain Mistral Cloud Chat Model Node**  
    - Type: LangChain LM Chat Mistral Cloud  
    - Model: `mistral-medium-latest`  
    - Temperature: 0.2 (low temperature for factual answers)  
    - Credentials: Configure Mistral Cloud API key.

11. **Add LangChain Calculator Tool Node**  
    - Type: Calculator Tool  
    - Default configuration suffices.  
    - Used for summing totals and computations by the agent.

12. **Add Second Simple Memory Node for AI Agent Context**  
    - Type: LangChain Memory Buffer Window  
    - Default parameters or empty.  
    - Provides context memory for the agent.

13. **Add LangChain Agent Node (Travel Reimbursement Agent)**  
    - Type: LangChain Agent  
    - Text input: from merged chat + OCR data.  
    - System message: Use detailed prompt specifying extraction rules, required fields, inference rules, and final response format as per the original workflow.  
    - Connect AI tools: Calculator1, Supabase Get.  
    - Connect AI language model: Mistral Cloud Chat Model.  
    - Connect AI memory: Simple Memory1.  
    - Output: To chat response.

14. **Connect Nodes According to Flow:**  
    - Chat Trigger → IF Node  
    - IF True → Split Out → Normalize → OCR → Store OCR → Merge → Agent  
    - IF False → Merge → Agent  
    - Supabase Get and Calculator connected as AI tools to Agent  
    - Mistral Model and Simple Memory1 connected to Agent.

15. **Credential Setup:**  
    - Configure Supabase API credentials with correct project URL and API key.  
    - Configure Mistral Cloud API credentials.  
    - Ensure OCR API endpoint is reachable and supports multipart uploads.

16. **Database Setup:**  
    - Create `temp_table` in Supabase with fields: `session_id` (text), `file` (JSON/JSONB), `file_name` (text).  
    - Set appropriate permissions limiting access to relevant rows/columns.

17. **Testing & Validation:**  
    - Test with single image uploads and multi-page PDFs.  
    - Verify OCR output storage in Supabase.  
    - Validate AI agent extraction and total calculations.  
    - Confirm chat UI outputs expense summaries correctly.

---

### 5. General Notes & Resources

| Note Content                                                                                                                         | Context or Link                                                                                                      |
|--------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| Zero-retention policy: Credentials are encrypted, and Supabase access limited to necessary rows and columns only.                    | Security & Retention sticky note.                                                                                   |
| Chat UI is custom branded with Nosta colors and includes DigitalBiz Tech logo with CSS customization.                                | Chat Trigger node CSS styling.                                                                                       |
| OCR node expects JSONL output with `blocks` key containing parsed text blocks.                                                       | OCR (ANY OCR API) sticky note.                                                                                       |
| Travel reimbursement agent prompt enforces strict rules to always extract or infer values, never returning “unclear” or asking for clearer images. | Travel Reimbursement Agent sticky note.                                                                              |
| Mistral Cloud model selected for accuracy with controlled creativity (temperature 0.2).                                             | Mistral Cloud Chat Model sticky note.                                                                                |
| Calculator tool ensures numeric totals are computed accurately, including summing multiple charges.                                  | Calculator sticky note.                                                                                              |
| Workflow designed for business travel expense automation with ability to handle multiple receipts and queries about expenses.       | Workflow overview sticky note.                                                                                       |
| Supabase `temp_table` schema and permissions must be preconfigured before workflow use.                                              | Setup steps in overview note.                                                                                        |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, a workflow automation tool. This processing strictly complies with content policies and contains no illegal, offensive, or protected elements. All data handled is lawful and public.