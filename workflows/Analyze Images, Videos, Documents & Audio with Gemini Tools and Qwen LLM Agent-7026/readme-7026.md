Analyze Images, Videos, Documents & Audio with Gemini Tools and Qwen LLM Agent

https://n8nworkflows.xyz/workflows/analyze-images--videos--documents---audio-with-gemini-tools-and-qwen-llm-agent-7026


# Analyze Images, Videos, Documents & Audio with Gemini Tools and Qwen LLM Agent

### 1. Workflow Overview

This workflow is designed to analyze various media types—images, videos, documents, and audio—using Google Gemini Tools integrated with the Qwen large language model (LLM) agent. It targets use cases where user input may include text queries accompanied by file uploads, enabling automated multi-modal content analysis and AI-driven responses.

The workflow consists of these logical blocks:

- **1.1 Input Reception and Validation:** Accept user chat input via a webhook, including optional file uploads; verify presence of files.
- **1.2 File Processing and Upload:** If files exist, split and upload them individually to Google Gemini, then aggregate metadata.
- **1.3 Input Preparation:** Combine chat input with file metadata to generate a structured prompt for AI processing.
- **1.4 Multi-Modal Analysis:** Use dedicated Google Gemini tools to analyze images, videos, documents, and audio files in parallel.
- **1.5 AI Agent Execution:** Route processed inputs and media analysis results through a Qwen LLM-based AI agent supported by memory buffer.
- **1.6 Response Generation:** Produce clear, concise responses to user queries enriched by analysis results.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Validation

- **Overview:**  
Receives chat input and optional files through a LangChain chatTrigger webhook node. Checks if files are attached to determine processing path.

- **Nodes Involved:**  
  - Input (chatTrigger)  
  - If Not Files (If node)  

- **Node Details:**  
  - **Input (chatTrigger):**  
    - Type: LangChain chatTrigger node  
    - Role: Entry point receiving user chat and files via HTTP webhook  
    - Config: Allows file uploads  
    - Input: External webhook request  
    - Output: JSON with chatInput, sessionId, action, files (optional)  
    - Edge cases: Missing webhook trigger, malformed requests, no files present  
  - **If Not Files (If node):**  
    - Type: Condition node  
    - Role: Checks if the 'files' field is absent or empty in input JSON  
    - Config: Uses array operation "notExists" on `{{$json.files}}`  
    - Input: Output of Input node  
    - Output: Branch 1 (no files) proceeds to Merge node; Branch 2 (files present) proceeds to Split Out Files node  
    - Edge cases: Edge cases in JSON path evaluation, false negatives if files field is present but empty  

---

#### 2.2 File Processing and Upload

- **Overview:**  
Handles splitting of the uploaded files array, uploads each file individually to Google Gemini, collects their metadata, and aggregates back into a unified data structure.

- **Nodes Involved:**  
  - Split Out Files  
  - Loop Over Items  
  - Upload a file  
  - File data  
  - Aggregate  
  - Update Input  

- **Node Details:**  
  - **Split Out Files:**  
    - Type: SplitOut node  
    - Role: Splits the 'files' array into individual file items, preserving other fields and including binary data under 'files' field  
    - Input: Output from If Not Files (files-present branch)  
    - Output: Single file items iteratively processed downstream  
    - Edge cases: Files array empty or malformed; binary data missing  
  - **Loop Over Items:**  
    - Type: SplitInBatches node  
    - Role: Processes files one by one or in batches; reset option disabled to maintain state  
    - Input: Output from Split Out Files  
    - Output: Feeds each file to Upload a file node  
    - Edge cases: Large file sets may cause delays or API rate limits  
  - **Upload a file:**  
    - Type: Google Gemini file upload node  
    - Role: Uploads binary file to Google Gemini’s file resource endpoint  
    - Config: Reads binary data from dynamic property `data{{$runIndex}}`  
    - Credential: Google Gemini (PaLM) API account  
    - Input: Single file binary data  
    - Output: Upload result including file URI  
    - Edge cases: Upload failures, authentication errors, file size limits  
  - **File data:**  
    - Type: Set node  
    - Role: Extracts and sets metadata fields: file URL from upload, original file name, MIME type from input file info  
    - Input: Upload a file node output and Split Out Files output (for filename)  
    - Output: Structured metadata for aggregated files  
    - Edge cases: Missing or inconsistent metadata fields  
  - **Aggregate:**  
    - Type: Aggregate node  
    - Role: Aggregates individual file metadata into an array under 'file' field, excludes binary data for performance  
    - Input: Output from Loop Over Items (File data branch)  
    - Output: Aggregated file metadata array  
  - **Update Input:**  
    - Type: Set node  
    - Role: Updates input JSON to replace 'files' field with aggregated file metadata array; copies sessionId, action, chatInput fields from original input  
    - Input: Output from Aggregate node and original Input node (session info)  
    - Output: Updated input JSON for next processing steps  
    - Edge cases: Loss of other fields if not explicitly copied  

---

#### 2.3 Input Preparation

- **Overview:**  
Prepares the final chat input string combining user text and serialized file metadata, preserving session and action context for AI processing.

- **Nodes Involved:**  
  - Merge  
  - Generate chat Input  

- **Node Details:**  
  - **Merge:**  
    - Type: Merge node (version 3.2)  
    - Role: Combines two input branches: one from updated input with files, another from input without files  
    - Input: Outputs from Update Input (with files) and If Not Files (no files)  
    - Output: Unified input JSON for chat generation  
    - Edge cases: Merge conflicts or data loss if input structures differ  
  - **Generate chat Input:**  
    - Type: Set node  
    - Role: Constructs a string named 'chatInput' combining original chat input and serialized file metadata (if any) as “Media: [...]”  
    - Also sets sessionId and action fields for context  
    - Input: Output from Merge node  
    - Output: Final structured prompt for AI Agent  
    - Edge cases: Large file metadata causing very long strings; null or empty inputs  

---

#### 2.4 Multi-Modal Analysis

- **Overview:**  
Executes parallel analysis of media types (image, video, audio, document) through dedicated Google Gemini tool nodes, each configured for specific resource types.

- **Nodes Involved:**  
  - IMG (Google Gemini image analysis)  
  - VIDEO (Google Gemini video analysis)  
  - AUDIO (Google Gemini audio analysis)  
  - DOCUMENT (Google Gemini document analysis)  

- **Node Details (commonalities):**  
  - Type: Google Gemini Tool node (LangChain integration)  
  - Role: Analyze specific media type by sending URLs and text input to Google Gemini models  
  - Credential: Google Gemini (PaLM) API account  
  - Configuration:  
    - Text: dynamic from 'Text_Input' AI override (linked to chatInput)  
    - Model ID: varies (e.g., "gemma-3-27b-it" for images, "gemini-2.0-flash-lite" for others)  
    - Resource: image, video, audio, or document accordingly  
    - Operation: analyze  
    - Input URLs: dynamic from 'URL_s_' AI override, representing URLs of media files  
  - Inputs: Receive chatInput and URLs, triggered by AI Agent's ai_tool input  
  - Outputs: Analysis results fed back to AI Agent node for integration  
  - Edge cases: Invalid URLs, API rate limits, unsupported media formats, authentication errors  

---

#### 2.5 AI Agent Execution

- **Overview:**  
Central AI agent node orchestrates language model queries and tool invocations, incorporating memory context and multi-modal analysis outputs to generate final user responses.

- **Nodes Involved:**  
  - AI Agent (LangChain agent)  
  - Model (Groq Qwen LLM)  
  - Memory (LangChain memoryBufferWindow)  

- **Node Details:**  
  - **AI Agent:**  
    - Type: LangChain agent node  
    - Role: Coordinates input processing, utilizes AI language model and external tools (Google Gemini nodes), integrates memory for contextual replies  
    - Config: System message defines assistant persona: helpful, concise, proactive, uses external tools autonomously  
    - Inputs:  
      - ai_languageModel from Model node (Qwen LLM)  
      - ai_tool from image, video, audio, document analysis nodes  
      - ai_memory from Memory node  
    - Outputs: Final AI-generated response text to webhook or downstream processes  
    - Edge cases: Timeout, model API errors, tool invocation failures, memory overflow  
  - **Model:**  
    - Type: LangChain lmChatGroq node  
    - Role: Provides conversational AI model backend (Qwen 3 32B) for AI Agent  
    - Credential: Groq account  
    - Input: Chat prompts from AI Agent  
    - Output: Language model completions to AI Agent  
    - Edge cases: API rate limits, authentication errors, model version mismatches  
  - **Memory:**  
    - Type: LangChain memoryBufferWindow  
    - Role: Maintains limited conversation context window (length 15) for AI Agent to preserve state across interactions  
    - Input/Output: Context messages to/from AI Agent  
    - Edge cases: Context overflow, loss on restart  

---

#### 2.6 Response Generation

- **Overview:**  
Implicit in the AI Agent node, after processing inputs, tools, and memory, the system generates a concise, actionable response to the user based on all gathered data.

- **Nodes Involved:**  
  - AI Agent (final output)  

- **Node Details:**  
  - See AI Agent above; output is the final user-facing message  
  - Edge cases: Response timeouts, incomplete data, inability to answer due to missing info  

---

### 3. Summary Table

| Node Name         | Node Type                          | Functional Role                         | Input Node(s)           | Output Node(s)           | Sticky Note                                                                                  |
|-------------------|----------------------------------|---------------------------------------|------------------------|--------------------------|----------------------------------------------------------------------------------------------|
| Input             | LangChain chatTrigger            | Receive user chat and files via webhook | -                      | If Not Files             |                                                                                            |
| If Not Files      | If                              | Check presence of files in input      | Input                  | Merge, Split Out Files    | ## If files **Upload all files to Google**                                                  |
| Split Out Files   | SplitOut                        | Split files array into individual files | If Not Files           | Loop Over Items          |                                                                                            |
| Loop Over Items   | SplitInBatches                  | Iterate over individual files         | Split Out Files        | Aggregate, Upload a file  |                                                                                            |
| Upload a file     | Google Gemini file upload       | Upload single file to Google Gemini   | Loop Over Items        | File data                |                                                                                            |
| File data         | Set                             | Extract and set file metadata          | Upload a file          | Loop Over Items          |                                                                                            |
| Aggregate         | Aggregate                      | Aggregate file metadata array           | Loop Over Items        | Update Input             |                                                                                            |
| Update Input      | Set                             | Update input JSON with aggregated files | Aggregate, Input       | Merge                    |                                                                                            |
| Merge             | Merge                           | Combine input branches (with/without files) | Update Input, If Not Files | Generate chat Input     |                                                                                            |
| Generate chat Input | Set                            | Generate final chatInput string with media info | Merge                 | AI Agent                 | ## The real chat input                                                                       |
| IMG               | Google Gemini Tool (image)      | Analyze images                        | AI Agent (ai_tool)     | AI Agent (ai_tool)       |                                                                                            |
| VIDEO             | Google Gemini Tool (video)      | Analyze videos                        | AI Agent (ai_tool)     | AI Agent (ai_tool)       |                                                                                            |
| AUDIO             | Google Gemini Tool (audio)      | Analyze audio                        | AI Agent (ai_tool)     | AI Agent (ai_tool)       |                                                                                            |
| DOCUMENT          | Google Gemini Tool (document)   | Analyze documents                    | AI Agent (ai_tool)     | AI Agent (ai_tool)       |                                                                                            |
| Model             | LangChain lmChatGroq            | Qwen LLM conversational model          | AI Agent (ai_languageModel) | AI Agent               |                                                                                            |
| Memory            | LangChain memoryBufferWindow    | Maintain conversation context          | AI Agent (ai_memory)   | AI Agent                 |                                                                                            |
| AI Agent          | LangChain agent                 | Main orchestrator: AI processing & tool integration | IMG, VIDEO, AUDIO, DOCUMENT, Model, Memory, Generate chat Input | -                     | ## The Agent                                                                                |
| Sticky Note       | Sticky Note                    | Visual comments                        | -                      | -                        | ## Start                                                                                   |
| Sticky Note1      | Sticky Note                    | Visual comments                        | -                      | -                        | ## If files **Upload all files to Google**                                                  |
| Sticky Note2      | Sticky Note                    | Visual comments                        | -                      | -                        | ## The real chat input                                                                       |
| Sticky Note3      | Sticky Note                    | Visual comments                        | -                      | -                        | ## The Agent                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Input Node:**  
   - Add a **LangChain chatTrigger** node named "Input".  
   - Configure webhook with file upload enabled.  
   - This node listens for user messages plus optional files.

2. **Add an If Node to Check Files:**  
   - Add an **If** node named "If Not Files".  
   - Configure condition to check if `{{$json.files}}` does not exist (operation: array notExists).  
   - Connect "Input" output to "If Not Files" input.

3. **Branch for File Upload:**  
   - On the branch where files exist, add a **SplitOut** node named "Split Out Files".  
   - Configure to split out the "files" array, include binary data under field "files".  
   - Connect "If Not Files" (files exist branch) to "Split Out Files".

4. **Process Each File Individually:**  
   - Add a **SplitInBatches** node named "Loop Over Items".  
   - Connect "Split Out Files" output to "Loop Over Items".  
   - Disable reset option.

5. **Upload Each File to Google Gemini:**  
   - Add a **Google Gemini** node named "Upload a file" set to resource "file" and input type "binary".  
   - Set binary property name dynamically as `data{{$runIndex}}`.  
   - Connect "Loop Over Items" output to "Upload a file".  
   - Configure Google Gemini (PaLM) API credentials.

6. **Extract File Metadata:**  
   - Add a **Set** node named "File data".  
   - Configure to assign:  
     - `file.url` = `{{$json.fileUri}}` (uploaded file URI)  
     - `file.name` = `{{$node["Split Out Files"].item.json.files.fileName}}` (original filename)  
     - `mimeType` = `{{$json.mimeType}}`  
   - Connect "Upload a file" output to "File data".

7. **Aggregate File Metadata:**  
   - Connect "File data" output back to "Loop Over Items" to continue batch processing.  
   - Add an **Aggregate** node named "Aggregate".  
   - Configure to aggregate the "file" field into an array, exclude binaries.  
   - Connect one output of "Loop Over Items" (probably first main) to "Aggregate".

8. **Update Input with Aggregated Files:**  
   - Add a **Set** node named "Update Input".  
   - Assign:  
     - `files` = `{{$json.file}}` (aggregated files array)  
     - `sessionId`, `action`, `chatInput` copied from the original "Input" node JSON.  
   - Connect "Aggregate" output and "Input" node to "Update Input" (allow multiple inputs).

9. **Merge Input Branches:**  
   - Add a **Merge** node named "Merge".  
   - Connect "If Not Files" no-files branch and "Update Input" (files branch) to "Merge".  
   - Merge mode default (probably append or wait for all).

10. **Generate Final Chat Input String:**  
    - Add a **Set** node named "Generate chat Input".  
    - Assign:  
      - `chatInput` = original chatInput plus serialized `files` array if present, prefixed by "Media: "  
      - Pass through `sessionId` and `action`.  
    - Connect "Merge" output to this node.

11. **Add Google Gemini Analysis Nodes:**  
    - Add four separate **Google Gemini Tool** nodes named:  
      - "IMG" (resource: image, model: gemma-3-27b-it)  
      - "VIDEO" (resource: video, model: gemini-2.0-flash-lite)  
      - "AUDIO" (resource: audio, model: gemini-2.0-flash-lite)  
      - "DOCUMENT" (resource: document, model: gemini-2.0-flash-lite)  
    - Configure each with:  
      - Dynamic text input from `chatInput`  
      - Dynamic URLs input from file URLs list  
      - Operation: analyze  
      - Google Gemini (PaLM) API credentials

12. **Add Qwen LLM Model Node:**  
    - Add a **LangChain lmChatGroq** node named "Model".  
    - Configure model to "qwen/qwen3-32b".  
    - Connect credential for Groq API.

13. **Add Memory Node:**  
    - Add a **LangChain memoryBufferWindow** node named "Memory".  
    - Set context window length to 15.

14. **Add AI Agent Node:**  
    - Add a **LangChain agent** node named "AI Agent".  
    - Configure system message to define assistant persona (helpful, concise, proactive).  
    - Connect inputs:  
      - ai_languageModel from "Model" node  
      - ai_tool from each Gemini analysis node ("IMG", "VIDEO", "AUDIO", "DOCUMENT")  
      - ai_memory from "Memory" node  
      - main input from "Generate chat Input" node

15. **Connect outputs of all Gemini nodes and Model, Memory nodes into AI Agent accordingly.**

16. **Test the workflow:**  
    - Trigger webhook with text and optional files.  
    - Observe files upload and analysis, AI agent response generation.

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                                                |
|-------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------|
| System message instructs AI Agent to be clear, concise, proactive, and use external tools autonomously. | AI Agent node configuration                                                    |
| Google Gemini Tools require valid Google PaLM API credentials for multimedia analysis.          | Google Gemini (PaLM) Api account credential setup                             |
| The workflow uses Qwen LLM via Groq API for conversational AI.                                  | Groq API credential setup for Model node                                      |
| Memory buffer window length set to 15 messages to maintain context without overload.            | Memory node configuration                                                     |
| Sticky Notes provide helpful visual labels for workflow sections: "Start", "If files", "The real chat input", "The Agent". | Visual aid nodes for workflow clarity                                         |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly adheres to current content policies and contains no illegal, offensive, or protected material. All manipulated data is legal and public.