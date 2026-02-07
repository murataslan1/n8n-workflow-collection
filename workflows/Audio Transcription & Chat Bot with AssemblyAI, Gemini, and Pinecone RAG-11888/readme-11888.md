Audio Transcription & Chat Bot with AssemblyAI, Gemini, and Pinecone RAG

https://n8nworkflows.xyz/workflows/audio-transcription---chat-bot-with-assemblyai--gemini--and-pinecone-rag-11888


# Audio Transcription & Chat Bot with AssemblyAI, Gemini, and Pinecone RAG

### 1. Workflow Overview

This workflow enables an end-to-end audio transcription and conversational AI chatbot system, leveraging AssemblyAI for transcription and summarization, Google Gemini (PaLM) for embeddings and chat, and Pinecone as a vector database. It is designed for scenarios where users upload audio files, which are transcribed and summarized automatically, then stored as embeddings in Pinecone for later retrieval. A chatbot uses this indexed data to provide context-aware answers based on previous audio content.

**Logical Blocks:**

- **1.1 Audio Upload & Transcription Request:** Accepts audio files via a form and uploads them to AssemblyAI for transcription and summarization.
- **1.2 Polling & Transcript Retrieval:** Waits and polls AssemblyAI for completed transcription results including speaker labels and bullet-point summaries.
- **1.3 Transcript Processing & Vector Storage:** Converts the transcript text to files, splits, embeds with Google Gemini, and inserts vectors into Pinecone. Also logs uploads to Google Sheets.
- **1.4 Conversational Agent Initialization:** Listens for chat messages, retrieves relevant information from Pinecone vector store, and uses Google Gemini chat with memory to respond to users.

---

### 2. Block-by-Block Analysis

#### 2.1 Audio Upload & Transcription Request

- **Overview:** This block handles the initial audio file upload, sending the binary audio to AssemblyAI’s upload endpoint, then triggering a transcription request with specific options for speaker labeling and summarization.

- **Nodes Involved:**  
  - On form submission  
  - HTTP Request (upload audio)  
  - HTTP Request1 (create transcript request)  

- **Node Details:**

  - **On form submission**  
    - *Type:* Form Trigger  
    - *Role:* Accepts user audio file upload via form with a single required file field.  
    - *Configuration:* Form titled "upload files" with one required file input labeled "file".  
    - *Input/Output:* Triggers workflow with form data; outputs uploaded file data.  
    - *Edge Cases:* File size limits, unsupported file types, or incomplete submission may cause failures.

  - **HTTP Request (upload audio)**  
    - *Type:* HTTP Request  
    - *Role:* Uploads binary audio file to AssemblyAI API at `/v2/upload`.  
    - *Configuration:* POST method; sends raw binary data from form file; Authorization header expected (AssemblyAI API key).  
    - *Expressions:* Uses incoming file binary data as body.  
    - *Input/Output:* Input from form; outputs JSON with `upload_url`.  
    - *Edge Cases:* Network errors, API authentication failure, or file corruption on upload can cause request failure. Retries enabled with 2 max tries.

  - **HTTP Request1 (create transcript request)**  
    - *Type:* HTTP Request  
    - *Role:* Requests transcription creation on AssemblyAI with options for speaker labels and bullet summary.  
    - *Configuration:* POST to `/v2/transcript`; JSON body includes `audio_url` (from previous upload), `speaker_labels:true`, `summarization:true`, summary type as bullets, and summary model as informative.  
    - *Expressions:* Uses `{{$json.upload_url}}` from upload response to specify audio source.  
    - *Headers:* Authorization and Content-Type: application/json.  
    - *Input/Output:* Input from upload response; outputs transcript job ID and status.  
    - *Edge Cases:* API key issues, invalid audio URL, or rate limiting.

---

#### 2.2 Polling & Transcript Retrieval

- **Overview:** After requesting transcription, this block repeatedly waits and polls AssemblyAI until the transcript status is no longer "processing", ensuring the transcription and summarization are complete before further processing.

- **Nodes Involved:**  
  - Wait  
  - HTTP Request2 (get transcript status)  
  - If (check transcript status)  

- **Node Details:**

  - **Wait**  
    - *Type:* Wait  
    - *Role:* Pauses workflow execution to allow AssemblyAI time to finish transcription.  
    - *Configuration:* Default wait period (not customized).  
    - *Input/Output:* Receives from transcription request; outputs after delay.  
    - *Edge Cases:* Insufficient wait time may lead to premature status checks.

  - **HTTP Request2 (get transcript status)**  
    - *Type:* HTTP Request  
    - *Role:* Polls AssemblyAI transcript endpoint to get current status and results.  
    - *Configuration:* GET request to `/v2/transcript/{{$json.id}}` where `id` is transcript job ID. Authorization header included.  
    - *Input/Output:* Input from Wait node; outputs current transcript status and data.  
    - *Edge Cases:* API errors, network failure, or invalid ID.

  - **If**  
    - *Type:* Conditional  
    - *Role:* Checks if the transcript status is not "processing" (i.e., completed or failed).  
    - *Configuration:* Condition: `$json.status != "processing"` (strict, case sensitive).  
    - *Input/Output:* Routes success (transcription done) to next block; otherwise loops back to Wait node for another pause.  
    - *Edge Cases:* Status other than "completed" or "failed" not handled explicitly.

---

#### 2.3 Transcript Processing & Vector Storage

- **Overview:** Once transcription is complete, the full transcript text is converted to a text file, split into chunks with overlap, embedded using Google Gemini embeddings, and inserted into Pinecone vector database. The upload is also logged in a Google Sheet.

- **Nodes Involved:**  
  - Convert to File  
  - Pinecone Vector Store  
  - Recursive Character Text Splitter  
  - Default Data Loader  
  - Embeddings Google Gemini  
  - Append row in sheet  

- **Node Details:**

  - **Convert to File**  
    - *Type:* Convert To File  
    - *Role:* Converts transcript text JSON property to a text file format to be processed by vector store.  
    - *Configuration:* Operation “toText”, source property is `text` from transcript JSON.  
    - *Input/Output:* Input from If node (transcript complete); output is a text file version of transcript.  
    - *Edge Cases:* Missing or empty transcript text could cause failure.

  - **Recursive Character Text Splitter**  
    - *Type:* Text Splitter (Langchain)  
    - *Role:* Splits transcript text into chunks with 100-character overlap to preserve context for embedding.  
    - *Configuration:* Chunk overlap set to 100 characters; default chunk size implied.  
    - *Input/Output:* Input is transcript text file; output is array of text chunks for embedding.  
    - *Edge Cases:* Very short transcripts may produce insufficient chunks.

  - **Default Data Loader**  
    - *Type:* Document Data Loader (Langchain)  
    - *Role:* Loads text chunks as documents into Langchain pipeline for embedding.  
    - *Configuration:* Data type set to binary; text splitting mode custom (uses splitter node).  
    - *Input/Output:* Input from Text Splitter; output documents for embedding.  
    - *Edge Cases:* Data format mismatches.

  - **Embeddings Google Gemini**  
    - *Type:* Embeddings (Langchain)  
    - *Role:* Generates vector embeddings for the text chunks using Google Gemini (PaLM) embeddings API.  
    - *Configuration:* Uses credentials linked to Google Palm API account.  
    - *Input/Output:* Receives documents; outputs vectors for insertion.  
    - *Edge Cases:* API quota limits, authentication errors.

  - **Pinecone Vector Store**  
    - *Type:* Vector Store (Langchain)  
    - *Role:* Inserts vector embeddings into Pinecone index "n8n-rag-chat-bot".  
    - *Configuration:* Insert mode; uses Pinecone API credentials; index name specified.  
    - *Input/Output:* Receives vectors; outputs confirmation; triggers Google Sheets append.  
    - *Edge Cases:* Pinecone API errors, index misconfiguration.

  - **Append row in sheet**  
    - *Type:* Google Sheets  
    - *Role:* Logs uploaded file name and status "uploaded" to specified Google Sheet.  
    - *Configuration:* Append operation to "Sheet1" of spreadsheet with columns `file` and `status`.  
    - *Input/Output:* Input from Pinecone insert confirmation; output is append confirmation.  
    - *Edge Cases:* Google Sheets API quota, permission errors, invalid spreadsheet ID.

---

#### 2.4 Conversational Agent Initialization

- **Overview:** This block handles incoming chat messages, retrieves relevant context from Pinecone vector store based on embeddings, uses Google Gemini chat model with memory buffer for conversation state, and responds to users with context-aware answers.

- **Nodes Involved:**  
  - When chat message received  
  - AI Agent  
  - Pinecone Vector Store1 (retrieve mode)  
  - Embeddings Google Gemini1  
  - Google Gemini Chat Model  
  - Simple Memory  

- **Node Details:**

  - **When chat message received**  
    - *Type:* Langchain Chat Trigger  
    - *Role:* Entry point for chatbot messages via webhook.  
    - *Configuration:* Default options; triggers workflow on chat message.  
    - *Input/Output:* Receives chat message JSON; outputs chat context data.  
    - *Edge Cases:* Unauthorized or malformed chat messages.

  - **Embeddings Google Gemini1**  
    - *Type:* Embeddings  
    - *Role:* Generates embeddings for user's chat query to use in retrieval.  
    - *Configuration:* Uses same Google Gemini (PaLM) API credentials.  
    - *Input/Output:* Input from chat message; outputs query vector.  
    - *Edge Cases:* API limits or errors.

  - **Pinecone Vector Store1**  
    - *Type:* Vector Store (Langchain)  
    - *Role:* Retrieves top 5 relevant vectors from Pinecone index "audio-summaries" using query embeddings.  
    - *Configuration:* Retrieve-as-tool mode; topK=5; uses Pinecone API credentials.  
    - *Input/Output:* Input query vectors; outputs retrieved documents for context.  
    - *Edge Cases:* Empty results, API errors.

  - **Simple Memory**  
    - *Type:* Memory Buffer (Langchain)  
    - *Role:* Maintains recent conversation context window for the AI agent.  
    - *Configuration:* Default window size; buffer memory.  
    - *Input/Output:* Receives conversation history; outputs memory state.  
    - *Edge Cases:* Memory overflow or reset.

  - **Google Gemini Chat Model**  
    - *Type:* Language Model Chat (Langchain)  
    - *Role:* Processes user input and retrieved context to generate a chat response.  
    - *Configuration:* Uses Google Gemini chat API credentials.  
    - *Input/Output:* Inputs chat context and memory; outputs AI chat response.  
    - *Edge Cases:* API quota, latency, or malformed responses.

  - **AI Agent**  
    - *Type:* Langchain Agent  
    - *Role:* Coordinates embeddings retrieval, memory, and language model to produce final chatbot answer.  
    - *Configuration:* Connects to Pinecone vector store tool, chat model, and memory nodes.  
    - *Input/Output:* Receives chat message; outputs chatbot response.  
    - *Edge Cases:* Handling of no relevant documents, errors in subnodes.

---

### 3. Summary Table

| Node Name                 | Node Type                              | Functional Role                          | Input Node(s)                 | Output Node(s)                  | Sticky Note                                                                                                                                            |
|---------------------------|--------------------------------------|----------------------------------------|------------------------------|-------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| On form submission        | Form Trigger                         | Receive audio file upload               | —                            | HTTP Request                  | ## 1. upload file to AssemblyAi for stt                                                                                                               |
| HTTP Request             | HTTP Request                        | Upload audio binary to AssemblyAI       | On form submission            | HTTP Request1                 | ## 1. upload file to AssemblyAi for stt                                                                                                               |
| HTTP Request1            | HTTP Request                        | Request transcription and summarization | HTTP Request                 | Wait                         | ## 1. upload file to AssemblyAi for stt                                                                                                               |
| Wait                     | Wait                               | Pause to allow transcription processing | HTTP Request1, If (loop back) | HTTP Request2                | ## 2. get transcripts and prepare to upload in vector store                                                                                            |
| HTTP Request2            | HTTP Request                        | Poll transcription status and results   | Wait                        | If                           | ## 2. get transcripts and prepare to upload in vector store                                                                                            |
| If                       | If                                 | Check if transcription is complete      | HTTP Request2                | Convert to File (true), Wait (false) | ## 2. get transcripts and prepare to upload in vector store                                                                                            |
| Convert to File          | Convert To File                    | Convert transcript text to file          | If (true)                   | Pinecone Vector Store         | ## 3. Upload to vectore store and log everything                                                                                                      |
| Recursive Character Text Splitter | Text Splitter (Langchain)          | Split transcript text into chunks       | Default Data Loader (output) | Default Data Loader (input)   | ## 3. Upload to vectore store and log everything                                                                                                      |
| Default Data Loader       | Document Loader (Langchain)        | Load text chunks as documents            | Recursive Character Text Splitter | Embeddings Google Gemini     | ## 3. Upload to vectore store and log everything                                                                                                      |
| Embeddings Google Gemini  | Embeddings (Langchain)             | Generate embeddings for transcript chunks | Default Data Loader           | Pinecone Vector Store         | ## 3. Upload to vectore store and log everything                                                                                                      |
| Pinecone Vector Store     | Vector Store (Langchain)            | Insert embeddings into Pinecone index    | Convert to File, Embeddings Google Gemini | Append row in sheet          | ## 3. Upload to vectore store and log everything                                                                                                      |
| Append row in sheet       | Google Sheets                      | Log file upload and status               | Pinecone Vector Store         | —                            | ## 3. Upload to vectore store and log everything                                                                                                      |
| When chat message received | Langchain Chat Trigger             | Receive incoming chatbot messages        | —                            | AI Agent                     | ## chatbot with context of audio files                                                                                                                |
| Embeddings Google Gemini1 | Embeddings (Langchain)             | Generate embeddings for chat queries     | When chat message received    | Pinecone Vector Store1        | ## chatbot with context of audio files                                                                                                                |
| Pinecone Vector Store1    | Vector Store (Langchain)            | Retrieve vectors for chatbot context     | Embeddings Google Gemini1     | AI Agent                     | ## chatbot with context of audio files                                                                                                                |
| Simple Memory            | Memory Buffer (Langchain)           | Maintain conversational memory           | AI Agent                     | AI Agent                     | ## chatbot with context of audio files                                                                                                                |
| Google Gemini Chat Model  | Language Model Chat (Langchain)    | Generate chat responses from context     | AI Agent                     | AI Agent                     | ## chatbot with context of audio files                                                                                                                |
| AI Agent                 | Langchain Agent                    | Orchestrate chatbot retrieval and reply | When chat message received, Pinecone Vector Store1, Simple Memory, Google Gemini Chat Model | —                            | ## chatbot with context of audio files                                                                                                                |
| Sticky Note              | Sticky Note                       | Explains workflow purpose and setup      | —                            | —                            | #### Transcribe Audio, Summarize with AI, and Chat<br>### How it works...<br>### Setup instructions with API keys and sheet info                     |
| Sticky Note1             | Sticky Note                       | Notes chatbot block                      | —                            | —                            | ## chatbot with context of audio files                                                                                                                |
| Sticky Note2             | Sticky Note                       | Notes audio upload and transcription    | —                            | —                            | ## 1. upload file to AssemblyAi for stt                                                                                                               |
| Sticky Note3             | Sticky Note                       | Notes transcript retrieval and prep     | —                            | —                            | ## 2. get transcripts and prepare to upload in vector store                                                                                            |
| Sticky Note4             | Sticky Note                       | Notes vector store upload and logging   | —                            | —                            | ## 3. Upload to vectore store and log everything                                                                                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Form Trigger node**:  
   - Name: `On form submission`  
   - Set form title to "upload files".  
   - Add one required file field labeled "file".  
   - This node will trigger the workflow when a user uploads an audio file.

2. **Add HTTP Request node**:  
   - Name: `HTTP Request`  
   - Purpose: Upload binary audio to AssemblyAI.  
   - Method: POST  
   - URL: `https://api.assemblyai.com/v2/upload`  
   - Send binary data from the form submission file field as body.  
   - Include header `Authorization` with your AssemblyAI API key credential.  
   - Connect input from `On form submission`.

3. **Add HTTP Request node for transcript creation**:  
   - Name: `HTTP Request1`  
   - Method: POST  
   - URL: `https://api.assemblyai.com/v2/transcript`  
   - Set Content-Type to `application/json`.  
   - Body (JSON):  
     ```json
     {
       "audio_url": "{{$json.upload_url}}",
       "speaker_labels": true,
       "summarization": true,
       "summary_type": "bullets",
       "summary_model": "informative"
     }
     ```  
   - Include `Authorization` header with AssemblyAI API key.  
   - Connect input from `HTTP Request`.

4. **Add Wait node**:  
   - Name: `Wait`  
   - Default parameters (e.g., wait a few seconds to avoid API rate limits).  
   - Connect input from `HTTP Request1` and also from conditional loop (step 7).

5. **Add HTTP Request node for polling transcript status**:  
   - Name: `HTTP Request2`  
   - Method: GET  
   - URL: `https://api.assemblyai.com/v2/transcript/{{$json.id}}` (replace `id` dynamically).  
   - Include Authorization header.  
   - Connect input from `Wait`.

6. **Add If node to check transcription status**:  
   - Name: `If`  
   - Condition: Check if `$json.status` not equal to string `"processing"`.  
   - If true, proceed to transcript processing.  
   - If false, loop back to `Wait`.  
   - Connect input from `HTTP Request2`.

7. **Add Convert To File node**:  
   - Name: `Convert to File`  
   - Operation: toText  
   - Source Property: `text` (full transcript text from AssemblyAI)  
   - Connect input from `If` (true branch).

8. **Add Recursive Character Text Splitter node**:  
   - Name: `Recursive Character Text Splitter`  
   - Set chunk overlap to 100 characters.  
   - Connect input from `Default Data Loader` (step 10).

9. **Add Default Data Loader node**:  
   - Name: `Default Data Loader`  
   - Data type: binary  
   - Text splitting mode: custom (to use splitter node)  
   - Connect input from `Recursive Character Text Splitter`.

10. **Add Embeddings node (Google Gemini)**:  
    - Name: `Embeddings Google Gemini`  
    - Credential: Google Palm API account linked to Google Gemini.  
    - Connect input from `Default Data Loader`.

11. **Add Pinecone Vector Store node**:  
    - Name: `Pinecone Vector Store`  
    - Mode: insert  
    - Pinecone index: specify your "n8n-rag-chat-bot" index.  
    - Credential: Pinecone API key.  
    - Connect inputs from `Convert to File` and `Embeddings Google Gemini`.

12. **Add Google Sheets node**:  
    - Name: `Append row in sheet`  
    - Operation: append  
    - Spreadsheet ID: your Google Sheets file ID.  
    - Sheet name: e.g. "Sheet1" (gid=0).  
    - Columns: map `file` to the original uploaded filename, and `status` to "uploaded".  
    - Credential: Google Sheets OAuth2 account.  
    - Connect input from `Pinecone Vector Store`.

13. **Set up Chatbot entry point with Chat Trigger node**:  
    - Name: `When chat message received`  
    - Default configuration for receiving chat messages.  

14. **Add Embeddings node for chat queries**:  
    - Name: `Embeddings Google Gemini1`  
    - Use same Google Palm API credential.  
    - Connect input from `When chat message received`.

15. **Add Pinecone Vector Store node for retrieval**:  
    - Name: `Pinecone Vector Store1`  
    - Mode: retrieve-as-tool  
    - TopK: 5  
    - Pinecone index: your "audio-summaries" index.  
    - Credential: Pinecone API key.  
    - Connect input from `Embeddings Google Gemini1`.

16. **Add Simple Memory node**:  
    - Name: `Simple Memory`  
    - Default buffer window memory for conversation.  
    - Connect input from `AI Agent` (step 18).

17. **Add Google Gemini Chat Model node**:  
    - Name: `Google Gemini Chat Model`  
    - Credential: Google Palm API account.  
    - Connect input from `AI Agent`.

18. **Add AI Agent node**:  
    - Name: `AI Agent`  
    - Set to receive main input from `When chat message received`.  
    - Configure to use Pinecone Vector Store1 as tool for retrieval, Google Gemini Chat Model as language model, and Simple Memory for conversation context.  
    - Connect outputs and inputs accordingly.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                      | Context or Link                                                                                   |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| #### Transcribe Audio, Summarize with AI, and Chat<br>1. Upload audio file via form.<br>2. Workflow sends audio to AssemblyAI for transcription and bullet-point summary.<br>3. Transcript chunked, embedded with Google Gemini, stored in Pinecone.<br>4. Upload logged in Google Sheets.<br>5. Chatbot answers questions with Pinecone retrieval and Google Gemini chat. | Workflow overview sticky note in the workflow.                                                  |
| Setup Instructions:<br>- Connect AssemblyAI API key.<br>- Connect Pinecone API key and specify index.<br>- Connect Google Gemini (PaLM) API account.<br>- Connect Google Sheets with columns `file` and `status`.                   | Workflow setup instructions included in sticky note.                                            |
| Chatbot block processes chat messages with context from audio files stored in Pinecone, using Google Gemini for embeddings and chat model.                                                                                      | Sticky notes on chatbot nodes.                                                                   |
| Be aware of potential API rate limits and authentication errors in AssemblyAI, Pinecone, and Google Gemini services.<br>Ensure valid credentials are configured for all external APIs.                                            | General caution for all API integrations.                                                       |
| Google Sheets logs each uploaded audio file with status for audit and tracking purposes.                                                                                                                                          | Included in the Append row in sheet node description.                                           |

---

**Disclaimer:** The provided text is generated from an automated n8n workflow created with adherence to content policies. It contains no illegal, offensive, or protected elements. All data processed is legal and public.