AI-Powered Document Chat with Nextcloud Files using LangChain and OpenAI

https://n8nworkflows.xyz/workflows/ai-powered-document-chat-with-nextcloud-files-using-langchain-and-openai-4465


# AI-Powered Document Chat with Nextcloud Files using LangChain and OpenAI

### 1. Workflow Overview

This workflow, titled **"AI-Powered Document Chat with Nextcloud Files using LangChain and OpenAI,"** enables interactive AI-driven chat queries on documents stored in Nextcloud folders. It integrates LangChain AI agents with OpenAI’s language models to provide contextual answers about file contents dynamically fetched and processed from Nextcloud storage.

**Target Use Cases:**
- Interactive document querying within Nextcloud folders
- AI-assisted content summarization and chat on PDFs, Markdown, and DOCX files stored in Nextcloud
- Automating document content extraction and aggregation for conversational AI

**Logical Blocks:**

- **1.1 Chat Input Reception:** Listens for incoming chat messages to trigger AI response.
- **1.2 AI Agent Setup:** Configures LangChain AI agent, memory, and connects it with OpenAI Chat Model and Nextcloud Tool for document interaction.
- **1.3 Nextcloud File Retrieval (Sub-Workflow):** Fetches files from a specified Nextcloud folder path, downloads, and processes them according to file type.
- **1.4 File Type Processing:** Routes files through type-specific extraction nodes (PDF, Markdown, DOCX).
- **1.5 Aggregation and Output:** Aggregates processed file data into a single response sent back to the AI agent for reply.

---

### 2. Block-by-Block Analysis

#### 2.1 Chat Input Reception

- **Overview:** Waits for a chat message to be received via a webhook, initiating the AI-driven document chat process.
- **Nodes Involved:**  
  - When chat message received
- **Node Details:**

| Node Name               | Details                                                                                                       |
|-------------------------|---------------------------------------------------------------------------------------------------------------|
| When chat message received | - Type: LangChain Chat Trigger (Webhook listener) <br>- Configuration: Public webhook, initial greeting message "Hi there! 👋 My name is Johan. How can I assist you today?" <br>- Inputs: External chat message via webhook <br>- Outputs: Message to AI Agent node <br>- Edge Cases: Webhook unavailability, malformed messages |

---

#### 2.2 AI Agent Setup

- **Overview:** Sets up the AI agent with memory, language model, and integrates the Nextcloud tool workflow for document content querying.
- **Nodes Involved:**  
  - OpenAI Chat Model  
  - Simple Memory  
  - AI Nextcloud  
  - Nextcloud Tool  
- **Node Details:**

| Node Name         | Details                                                                                                                          |
|-------------------|----------------------------------------------------------------------------------------------------------------------------------|
| OpenAI Chat Model | - Type: LangChain OpenAI Chat Model <br>- Config: Model set to a custom "qwen3-235b-a22b" with no additional options <br>- Credentials: Uses configured OpenAI API key <br>- Inputs: Messages from chat trigger <br>- Outputs: Responses to AI Nextcloud agent <br>- Edge Cases: API auth failure, rate limits, invalid model name |
| Simple Memory     | - Type: LangChain Memory Buffer Window <br>- Config: Default (no parameters) <br>- Role: Maintains conversational context <br>- Inputs: Chat messages from OpenAI Chat Model <br>- Outputs: Context to AI Nextcloud agent <br>- Edge Cases: Memory overload or truncation in long conversations |
| AI Nextcloud      | - Type: LangChain AI Agent <br>- Config: Default agent options <br>- Inputs: Connected to Chat Model, Memory, and Nextcloud Tool <br>- Outputs: AI responses <br>- Edge Cases: Agent failure in processing, tool invocation errors |
| Nextcloud Tool    | - Type: LangChain Tool Workflow <br>- Config: Calls sub-workflow "nextcloud-folder" with input parameter "path" (folder path) <br>- Role: Reads files from Nextcloud folder and returns content <br>- Inputs: Folder path from AI agent <br>- Outputs: File content data to AI agent <br>- Edge Cases: Invalid path, Nextcloud API failures |

---

#### 2.3 Nextcloud File Retrieval (Sub-Workflow)

- **Overview:** Triggered externally or by the AI tool workflow; lists files in a given Nextcloud folder path, downloads readable files, and prepares them for content extraction.
- **Nodes Involved:**  
  - When Executed by Another Workflow  
  - test data (Code)  
  - Get Files (Nextcloud)  
  - If readable (Switch)  
  - Download File (Nextcloud)  
- **Node Details:**

| Node Name                  | Details                                                                                                                       |
|----------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| When Executed by Another Workflow | - Type: Execute Workflow Trigger <br>- Config: Accepts input parameter "path" (folder path) <br>- Role: Starts sub-workflow externally or from tool <br>- Inputs: Path parameter <br>- Outputs: Passes path to test data node <br>- Edge Cases: Missing input parameters |
| test data                  | - Type: Code Node <br>- JS Code: Ensures a default path "/test/folder" if none provided <br>- Role: Prepares path for file listing <br>- Inputs: Path from trigger <br>- Outputs: Modified path to Get Files <br>- Edge Cases: path null or undefined |
| Get Files                  | - Type: Nextcloud Folder List <br>- Config: Lists files at provided folder path in Nextcloud <br>- Credentials: Nextcloud API configured <br>- Inputs: Folder path <br>- Outputs: List of files metadata <br>- Edge Cases: Invalid path, API auth failure, empty folder |
| If readable                | - Type: If Node <br>- Config: Checks if file content type is PDF, Markdown, or DOCX <br>- Inputs: File metadata from Get Files <br>- Outputs: Routes readable files to download <br>- Edge Cases: Unsupported file types filtered out |
| Download File              | - Type: Nextcloud Download <br>- Config: Downloads file by path URL-decoded <br>- Credentials: Nextcloud API <br>- Inputs: File path from If readable <br>- Outputs: File binary data to Switch for processing <br>- Edge Cases: File not found, download errors |

---

#### 2.4 File Type Processing

- **Overview:** Processes downloaded files based on their content type using specialized extraction nodes for PDF, Markdown, and DOCX formats. Then attaches the original folder path for traceability.
- **Nodes Involved:**  
  - Switch  
  - PDF (Extract from File)  
  - Markdown (Extract from File)  
  - DOCX (Word2Text)  
  - add path 1, add path 2, add path 3 (Code nodes)  
- **Node Details:**

| Node Name       | Details                                                                                                                  |
|-----------------|--------------------------------------------------------------------------------------------------------------------------|
| Switch          | - Type: Switch Node <br>- Config: Routes files by contentType to PDF, Markdown, or DOCX extraction nodes <br>- Inputs: Downloaded file <br>- Outputs: To respective extractor nodes <br>- Edge Cases: Unknown content types cause drop or no output |
| PDF             | - Type: Extract From File (PDF) <br>- Config: Extracts text content from PDF binary <br>- Inputs: PDF files from Switch <br>- Outputs: Extracted text to add path 1 <br>- Edge Cases: Corrupt PDFs, extraction failure |
| Markdown        | - Type: Extract From File (Text) <br>- Config: Extracts plain text from markdown files <br>- Inputs: Markdown files from Switch <br>- Outputs: Extracted text to add path 2 <br>- Edge Cases: Malformed markdown |
| DOCX            | - Type: Word2Text (Community Node) <br>- Config: Converts DOCX binary to text <br>- Inputs: DOCX files from Switch <br>- Outputs: Extracted text to add path 3 <br>- Edge Cases: Unsupported DOCX versions, conversion errors |
| add path 1,2,3  | - Type: Code Nodes <br>- JS Code: Adds the original folder path from Switch node JSON to the extracted text items <br>- Inputs: Extracted text items <br>- Outputs: To Aggregate node <br>- Edge Cases: Missing path in JSON |

---

#### 2.5 Aggregation and Output

- **Overview:** Aggregates all extracted file content into a single data set and formats it as an output for further AI processing or response generation.
- **Nodes Involved:**  
  - Aggregate  
  - output  
- **Node Details:**

| Node Name  | Details                                                                                                  |
|------------|----------------------------------------------------------------------------------------------------------|
| Aggregate  | - Type: Aggregate Node <br>- Config: Aggregates all input items into a single array <br>- Inputs: Extracted and path-augmented file data from add path nodes <br>- Outputs: Single aggregated data object <br>- Edge Cases: Empty input leads to empty aggregation |
| output     | - Type: Set Node <br>- Config: Sets output field "output" with aggregated data from previous node <br>- Inputs: Aggregated data <br>- Outputs: Final output data for AI agent or external use <br>- Edge Cases: Null or empty data |

---

### 3. Summary Table

| Node Name                  | Node Type                             | Functional Role                         | Input Node(s)                    | Output Node(s)                  | Sticky Note                                                                                                  |
|----------------------------|-------------------------------------|---------------------------------------|---------------------------------|--------------------------------|--------------------------------------------------------------------------------------------------------------|
| When chat message received  | LangChain Chat Trigger              | Receives chat message to start flow   | -                               | AI Nextcloud                   |                                                                                                              |
| OpenAI Chat Model           | LangChain OpenAI Chat Model         | Provides AI language model responses  | When chat message received       | AI Nextcloud                   |                                                                                                              |
| Simple Memory               | LangChain Memory Buffer Window      | Maintains chat context                 | OpenAI Chat Model                | AI Nextcloud                   |                                                                                                              |
| AI Nextcloud               | LangChain AI Agent                  | Coordinates AI processing and tools   | When chat message received, Simple Memory, OpenAI Chat Model, Nextcloud Tool | -                              |                                                                                                              |
| Nextcloud Tool              | LangChain Tool Workflow             | Calls sub-workflow to read Nextcloud files | AI Nextcloud                    | AI Nextcloud                   |                                                                                                              |
| When Executed by Another Workflow | Execute Workflow Trigger            | Sub-workflow entry point with path input | -                               | test data                     | # Subworkflow  \n\n## Nextcloud\n\nList Files in a gigven path and returns Dile contents form docs\n\nRequired Community Node:\nhttps://www.npmjs.com/package/n8n-nodes-word2text |
| test data                  | Code                               | Ensures default folder path            | When Executed by Another Workflow | Get Files                     |                                                                                                              |
| Get Files                  | Nextcloud Folder List              | Lists files in folder                  | test data                       | If readable                   |                                                                                                              |
| If readable                | If Node                           | Filters for readable file types        | Get Files                      | Download File                 |                                                                                                              |
| Download File              | Nextcloud File Download            | Downloads file binary                   | If readable                    | Switch                       |                                                                                                              |
| Switch                    | Switch                            | Routes files by type                    | Download File                  | PDF, Markdown, DOCX           |                                                                                                              |
| PDF                       | Extract From File (PDF)             | Extracts text from PDF files            | Switch (pdf output)             | add path 1                   |                                                                                                              |
| Markdown                  | Extract From File (Text)            | Extracts text from Markdown files       | Switch (md output)              | add path 2                   |                                                                                                              |
| DOCX                      | Word2Text (Community Node)          | Converts DOCX to text                    | Switch (docx output)            | add path 3                   |                                                                                                              |
| add path 1                | Code                              | Adds folder path to PDF extracted data | PDF                            | Aggregate                    |                                                                                                              |
| add path 2                | Code                              | Adds folder path to Markdown extracted data | Markdown                       | Aggregate                    |                                                                                                              |
| add path 3                | Code                              | Adds folder path to DOCX extracted data | DOCX                          | Aggregate                    |                                                                                                              |
| Aggregate                 | Aggregate                         | Aggregates all extracted file contents | add path 1, add path 2, add path 3 | output                      |                                                                                                              |
| output                    | Set                              | Prepares final output data              | Aggregate                      | -                            |                                                                                                              |
| Sticky Note               | Sticky Note                      | Notes on sub-workflow and required nodes | -                             | -                            | # Subworkflow \n\n## Nextcloud\n\nList Files in a gigven path and returns Dile contents form docs\n\nRequired Community Node:\nhttps://www.npmjs.com/package/n8n-nodes-word2text |
| Sticky Note1              | Sticky Note                      | Notes on main workflow AI agent purpose | -                             | -                            | # Main Workflow\n\n## AI Agent\n\nAnswers question to  folder contents. \n\nPut the Path to the folder into your question. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Chat Input Trigger:**
   - Add the **"When chat message received"** node (LangChain Chat Trigger).
   - Set it as public webhook.
   - Configure the initial message greeting as:  
     `Hi there! 👋\nMy name is Johan. How can I assist you today?`

2. **Configure the OpenAI Chat Model:**
   - Add **"OpenAI Chat Model"** node (LangChain LM Chat OpenAI).
   - Set the model to `"qwen3-235b-a22b"` (custom or replace with your model).
   - Attach your OpenAI API credentials.
   - Connect input from "When chat message received".

3. **Add Memory for Context:**
   - Add **"Simple Memory"** node (LangChain Memory Buffer Window).
   - No special parameters required.
   - Connect input from "OpenAI Chat Model".

4. **Set up AI Agent:**
   - Add **"AI Nextcloud"** node (LangChain Agent).
   - Connect inputs from "When chat message received" (main), "Simple Memory" (ai_memory), "OpenAI Chat Model" (ai_languageModel), and "Nextcloud Tool" (ai_tool).

5. **Create the Nextcloud Tool Workflow:**
   - Create a separate workflow named "nextcloud-folder" with input parameter "path" (string).
   - In main workflow, add **"Nextcloud Tool"** node (LangChain Tool Workflow).
   - Configure it to call the "nextcloud-folder" workflow, passing the `path` parameter as input.
   - Connect "Nextcloud Tool" output to "AI Nextcloud" node (ai_tool).

6. **In the Sub-Workflow ("nextcloud-folder") Setup:**

   a. **Trigger:**
      - Add **"When Executed by Another Workflow"** node.
      - Configure input parameter "path" (string).

   b. **Prepare Path:**
      - Add a **Code** node named "test data":
        ```js
        for (const item of $input.all()) {
          item.json.path = item.json.path || '/test/folder';
        }
        return $input.all();
        ```
      - Connect from trigger.

   c. **List Files:**
      - Add **"Get Files"** node (Nextcloud).
      - Set operation: list files in folder.
      - Use `={{ $json.path }}` to pass path.
      - Connect from "test data".
      - Attach Nextcloud API credentials.

   d. **Filter Readable Files:**
      - Add **"If readable"** (If Node).
      - Configure OR conditions matching contentType containing "pdf", "markdown", or equals DOCX MIME type.
      - Connect from "Get Files".

   e. **Download Files:**
      - Add **"Download File"** node (Nextcloud).
      - Operation: download file by `={{ $json.path.urlDecode() }}`.
      - Connect from "If readable" true output.
      - Attach Nextcloud API credentials.

   f. **Route By File Type:**
      - Add **"Switch"** node.
      - Define outputs for "pdf", "md", and "docx" based on contentType matching.

   g. **Extract Content:**
      - For PDF: Add **"PDF"** node (Extract From File, operation pdf).
      - For Markdown: Add **"Markdown"** node (Extract From File, operation text).
      - For DOCX: Add **"DOCX"** node (Word2Text community node).
      - Connect corresponding outputs of Switch to each extraction node.

   h. **Add Folder Path:**
      - Add three **Code** nodes ("add path 1", "add path 2", "add path 3") for PDF, Markdown, DOCX respectively:
        ```js
        for (const item of $input.all()) {
          item.json.path = $('Switch').first().json.path;
        }
        return $input.all();
        ```
      - Connect each extractor node output to respective code node.

   i. **Aggregate and Output:**
      - Add **"Aggregate"** node (aggregate all item data).
      - Connect outputs of all "add path" code nodes to Aggregate node.
      - Add **"output"** node (Set node).
      - Configure to set `output` field with `={{ $json.data }}` from Aggregate.
      - Connect Aggregate output to "output".

7. **Connect Sub-Workflow:**
   - Back in main workflow, ensure "Nextcloud Tool" node is configured to call the sub-workflow with proper input mapping.

---

### 5. General Notes & Resources

| Note Content                                                                                                    | Context or Link                                                                                          |
|----------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| This workflow uses the community node Word2Text for DOCX conversion.                                            | https://www.npmjs.com/package/n8n-nodes-word2text                                                      |
| The sub-workflow lists files in a given Nextcloud folder path and returns document contents for AI querying.    | Sticky note in workflow labeled "Subworkflow"                                                          |
| Main workflow handles AI agent interaction and expects that folder path is included in user chat questions.     | Sticky note labeled "Main Workflow"                                                                     |
| Ensure Nextcloud API credentials have sufficient permissions to read folders and download files.                 | n8n credential management                                                                                |
| The OpenAI model used is a custom named model "qwen3-235b-a22b" — replace with your own valid OpenAI model name.| OpenAI API documentation                                                                                 |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, a workflow automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly accessible.