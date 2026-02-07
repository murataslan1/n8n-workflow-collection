AI YouTube Playlist & Video Analyst Chatbot

https://n8nworkflows.xyz/workflows/ai-youtube-playlist---video-analyst-chatbot-3408


# AI YouTube Playlist & Video Analyst Chatbot

### 1. Workflow Overview

This workflow, titled **AI YouTube Playlist & Video Analyst Chatbot**, is designed to transform YouTube playlists or individual videos into interactive, AI-powered knowledge bases. Users provide a YouTube playlist or video URL, and the workflow automatically fetches video details and transcripts, processes the content with Google Gemini AI, stores embeddings in a Qdrant vector database, and maintains conversational context using Redis. The user can then interactively chat with the AI agent to get summaries, key points, and detailed answers about the video content without watching the videos.

The workflow is logically divided into the following blocks:

- **1.1 Chat Interaction & Intent Detection:** Receives user input, detects intent (playlist, video, or none), and manages conversation context.
- **1.2 Routing & Pre-processing Checks:** Routes the workflow based on intent and processing status, checks if content is already processed.
- **1.3 Playlist Processing Pipeline:** Fetches playlist data, limits videos, retrieves transcripts, summarizes, embeds, and stores data.
- **1.4 Video Processing Pipeline:** Fetches single video data, transcript, summarizes, embeds, and stores data.
- **1.5 Embedding Storage & Final Summary:** Manages vector store updates, chunking, embedding generation, and final summary creation.
- **1.6 Query Handling & Chat Response:** Handles user queries using conversational AI with vector store retrieval and memory.

---

### 2. Block-by-Block Analysis

#### 2.1 Chat Interaction & Intent Detection

**Overview:**  
This block initiates the workflow via a chat interface, retrieves previous conversation context from Redis, analyzes the user message to detect if it contains a YouTube playlist URL, video URL, or neither, and updates the context accordingly.

**Nodes Involved:**  
- Chat  
- Get Previous Context Intent  
- Message Intent  
- Structured Output Parser1  
- Default Intent  
- Process Status  
- Update Context Intent  

**Node Details:**

- **Chat**  
  - Type: Chat Trigger  
  - Role: Entry point for user interaction; prompts user for YouTube playlist or video URL.  
  - Configuration: Public webhook with initial message prompting for URL.  
  - Inputs: External user chat input.  
  - Outputs: User chat message JSON.  
  - Edge Cases: No input or invalid URL from user.  

- **Get Previous Context Intent**  
  - Type: Redis (Get)  
  - Role: Retrieves stored conversation context keyed by session ID.  
  - Configuration: Redis key pattern `context_intent_{{sessionId}}`.  
  - Inputs: Session ID from Chat node.  
  - Outputs: Previous context JSON or empty.  
  - Edge Cases: Redis connection failure, missing context.  

- **Message Intent**  
  - Type: Langchain Agent (AI)  
  - Role: Analyzes user message to classify intent as PLAYLIST, VIDEO, or NONE; extracts URL, ID, limit, and status.  
  - Configuration: System message defines rules for URL validation and output JSON format.  
  - Inputs: User chat input, previous context.  
  - Outputs: Structured intent JSON.  
  - Edge Cases: Ambiguous or malformed URLs, missing parameters.  

- **Structured Output Parser1**  
  - Type: Output Parser Structured  
  - Role: Parses AI agent output into strict JSON format.  
  - Configuration: JSON schema example with fields intent, url, id, limit, status.  
  - Inputs: Raw AI output.  
  - Outputs: Parsed JSON object.  
  - Edge Cases: Parsing errors if AI output deviates from schema.  

- **Default Intent**  
  - Type: Code  
  - Role: Uses previous context if current intent is NONE or empty; otherwise passes current intent.  
  - Configuration: JavaScript logic to fallback on previous context.  
  - Inputs: Message Intent output, previous context.  
  - Outputs: Final intent JSON for routing.  
  - Edge Cases: Missing previous context or inconsistent data.  

- **Process Status**  
  - Type: Code  
  - Role: Updates status field based on intent and limit; sets READY or PENDING accordingly.  
  - Configuration: JavaScript logic setting status to READY if video or playlist with limit > 0, else PENDING.  
  - Inputs: Default Intent output.  
  - Outputs: Updated intent JSON with status.  
  - Edge Cases: Incorrect limit values or missing fields.  

- **Update Context Intent**  
  - Type: Redis (Set)  
  - Role: Stores updated intent and context back into Redis for session continuity.  
  - Configuration: Redis key `context_intent_{{sessionId}}`, storing intent, url, id, limit, status as a hash.  
  - Inputs: Process Status output.  
  - Outputs: Confirmation of Redis write.  
  - Edge Cases: Redis write failures.  

---

#### 2.2 Routing & Pre-processing Checks

**Overview:**  
Routes the workflow based on detected intent and processing status. Checks if embeddings already exist in Qdrant vector store to avoid redundant processing. If playlist limit is missing, prompts user to provide it.

**Nodes Involved:**  
- Route Message Intent  
- Qdrant Vector Store2 (Load)  
- Count Content  
- If (Check if embeddings exist)  
- Update Context Intent1  
- Playlist Limit  
- Numb of Videos  
- Playlist or Video  
- Simple Memory  
- Simple Memory3  
- Sticky Notes (for documentation)  

**Node Details:**

- **Route Message Intent**  
  - Type: Switch  
  - Role: Routes messages to PROCESS (playlist/video) or QUERY (none or done).  
  - Configuration: Conditions based on intent and status fields.  
  - Inputs: Default Intent output.  
  - Outputs: PROCESS or QUERY branches.  
  - Edge Cases: Unexpected or missing intent/status values.  

- **Qdrant Vector Store2 (Load)**  
  - Type: Vector Store Qdrant (Load)  
  - Role: Checks if documents exist in vector store for given ID.  
  - Configuration: Collection ID from current intent ID.  
  - Inputs: Updated context intent.  
  - Outputs: Document count or empty.  
  - Edge Cases: API errors, empty collections.  

- **Count Content**  
  - Type: Summarize (used as counter)  
  - Role: Counts documents returned from vector store load.  
  - Inputs: Qdrant Vector Store2 output.  
  - Outputs: Count of documents.  
  - Edge Cases: Empty or malformed data.  

- **If (Check if embeddings exist)**  
  - Type: If  
  - Role: Branches workflow based on whether documents exist in vector store (count > 0).  
  - Inputs: Count Content output.  
  - Outputs: True (exists) or False (not exists).  
  - Edge Cases: Count parsing errors.  

- **Update Context Intent1**  
  - Type: Redis (Set)  
  - Role: Updates context status to DONE if embeddings exist, skipping processing.  
  - Inputs: Process Status output.  
  - Outputs: Redis confirmation.  
  - Edge Cases: Redis write failure.  

- **Playlist Limit**  
  - Type: If  
  - Role: Checks if playlist intent has limit <= 0, indicating missing number of videos to process.  
  - Inputs: Process Status output.  
  - Outputs: True (limit missing) or False (limit present).  
  - Edge Cases: Limit field missing or invalid.  

- **Numb of Videos**  
  - Type: Langchain Agent  
  - Role: Prompts user to provide number of videos to process for playlist.  
  - Configuration: System message instructs to ask user for number.  
  - Inputs: User chat input.  
  - Outputs: User response with number.  
  - Edge Cases: User provides invalid number or no response.  

- **Playlist or Video**  
  - Type: Switch  
  - Role: Routes to playlist or video processing pipelines based on intent.  
  - Inputs: Process Status output.  
  - Outputs: PLAYLIST or VIDEO branches.  
  - Edge Cases: Unexpected intent values.  

- **Simple Memory & Simple Memory3**  
  - Type: Memory Buffer Window  
  - Role: Maintains short-term chat memory for intents and number of videos.  
  - Inputs: Chat session ID.  
  - Outputs: Memory context for AI agents.  
  - Edge Cases: Memory overflow or session mismatch.  

---

#### 2.3 Playlist Processing Pipeline

**Overview:**  
Fetches playlist page, extracts video details, limits videos if specified, fetches transcripts for each video, concatenates transcripts, summarizes each transcript, merges data, and prepares for embedding.

**Nodes Involved:**  
- Playlist HTTP Request  
- Get Playlist Videos Data  
- Split Out1  
- Limit  
- YouTube Transcript  
- Split Out  
- Concatenate  
- Merge  
- Summarize & Analyze Transcript  
- Edit Fields  
- Delete Collection  

**Node Details:**

- **Playlist HTTP Request**  
  - Type: HTTP Request  
  - Role: Fetches HTML content of the playlist URL.  
  - Inputs: Playlist URL from context.  
  - Outputs: HTML body of playlist page.  
  - Edge Cases: HTTP errors, rate limits, captcha pages.  

- **Get Playlist Videos Data**  
  - Type: Code  
  - Role: Parses playlist HTML to extract playlist metadata and video list using modified play-dl logic.  
  - Inputs: Playlist HTTP Request output.  
  - Outputs: Playlist object with videos array.  
  - Edge Cases: YouTube layout changes, parsing errors, captcha detection.  

- **Split Out1**  
  - Type: Split Out  
  - Role: Splits playlist videos array into individual video items for processing.  
  - Inputs: Get Playlist Videos Data output.  
  - Outputs: Individual video JSON objects.  
  - Edge Cases: Empty or malformed video list.  

- **Limit**  
  - Type: Limit  
  - Role: Limits number of videos processed based on user-specified limit.  
  - Inputs: Split Out1 output, limit from context.  
  - Outputs: Limited subset of videos.  
  - Edge Cases: Limit zero or negative, no videos.  

- **YouTube Transcript**  
  - Type: Community Node (youtubeTranscripter)  
  - Role: Fetches transcript for each video by video ID.  
  - Inputs: Video ID from limited video list.  
  - Outputs: Transcript data per video.  
  - Edge Cases: Transcript unavailable, API errors, rate limits.  

- **Split Out**  
  - Type: Split Out  
  - Role: Splits transcript array for further processing.  
  - Inputs: YouTube Transcript output.  
  - Outputs: Individual transcript entries.  
  - Edge Cases: Empty transcripts.  

- **Concatenate**  
  - Type: Summarize (concatenate)  
  - Role: Concatenates transcript text by YouTube ID for summarization.  
  - Inputs: Split Out output.  
  - Outputs: Concatenated transcript text per video.  
  - Edge Cases: Large transcript size, text encoding issues.  

- **Merge**  
  - Type: Merge (SQL Combine)  
  - Role: Joins concatenated transcripts with video titles and metadata.  
  - Inputs: Concatenate output and Video Titles output.  
  - Outputs: Merged video data with transcript text.  
  - Edge Cases: Mismatched keys, missing titles.  

- **Summarize & Analyze Transcript**  
  - Type: Langchain Chain LLM  
  - Role: Uses Google Gemini AI to create structured summaries of each transcript.  
  - Configuration: Prompt instructs markdown formatting, key points extraction, 300-400 character limit.  
  - Inputs: Merged transcript text and metadata.  
  - Outputs: Summary text per video.  
  - Edge Cases: AI timeout, prompt failures, incomplete summaries.  

- **Edit Fields**  
  - Type: Set  
  - Role: Assigns structured fields including video number, title, summary, transcript text, and playlist ID.  
  - Inputs: Summarize & Analyze Transcript output.  
  - Outputs: Structured JSON for embedding.  
  - Edge Cases: Missing fields or data inconsistencies.  

- **Delete Collection**  
  - Type: HTTP Request  
  - Role: Deletes existing points in Qdrant collection for the playlist ID to avoid duplicates.  
  - Inputs: Playlist ID from context.  
  - Outputs: Confirmation of deletion.  
  - Edge Cases: API errors, permission issues.  

---

#### 2.4 Video Processing Pipeline

**Overview:**  
Fetches single video page, extracts title and description, fetches transcript, concatenates transcript, summarizes, merges data, and prepares for embedding.

**Nodes Involved:**  
- Video HTTP Request  
- YouTube Transcript1  
- Split Out2  
- Concatenate1  
- Get Title and Desc  
- Merge  
- Summarize & Analyze Transcript (shared with playlist pipeline)  
- Edit Fields (shared)  
- Delete Collection (shared)  

**Node Details:**

- **Video HTTP Request**  
  - Type: HTTP Request  
  - Role: Fetches HTML content of the single video URL.  
  - Inputs: Video URL from context.  
  - Outputs: HTML body of video page.  
  - Edge Cases: HTTP errors, captcha, rate limits.  

- **YouTube Transcript1**  
  - Type: Community Node (youtubeTranscripter)  
  - Role: Fetches transcript for the single video by video ID.  
  - Inputs: Video ID from context.  
  - Outputs: Transcript data.  
  - Edge Cases: Transcript unavailable, API errors.  

- **Split Out2**  
  - Type: Split Out  
  - Role: Splits transcript array for processing.  
  - Inputs: YouTube Transcript1 output.  
  - Outputs: Individual transcript entries.  
  - Edge Cases: Empty transcripts.  

- **Concatenate1**  
  - Type: Summarize (concatenate)  
  - Role: Concatenates transcript text by YouTube ID.  
  - Inputs: Split Out2 output.  
  - Outputs: Concatenated transcript text.  
  - Edge Cases: Large transcript size.  

- **Get Title and Desc**  
  - Type: Code  
  - Role: Parses video HTML to extract title, description, and duration using modified play-dl logic.  
  - Inputs: Video HTTP Request output.  
  - Outputs: Video metadata.  
  - Edge Cases: Parsing errors, captcha detection.  

- **Merge**  
  - Type: Merge (SQL Combine)  
  - Role: Joins concatenated transcript with video metadata.  
  - Inputs: Concatenate1 output and Get Title and Desc output.  
  - Outputs: Merged video data.  
  - Edge Cases: Mismatched keys.  

- **Summarize & Analyze Transcript**  
  - See playlist pipeline.  

- **Edit Fields**  
  - See playlist pipeline.  

- **Delete Collection**  
  - See playlist pipeline.  

---

#### 2.5 Embedding Storage & Final Summary

**Overview:**  
Loads processed data, splits text into chunks, generates embeddings with Google Gemini, stores embeddings in Qdrant, updates context status to DONE, concatenates summaries, and generates a final comprehensive summary.

**Nodes Involved:**  
- Default Data Loader  
- Recursive Character Text Splitter  
- Embeddings Google Gemini  
- Qdrant Vector Store  
- Update Context Process Done1  
- Get Fields for Summary  
- Full Summary  
- AI Agent  
- Chat Buffer Memory1  

**Node Details:**

- **Default Data Loader**  
  - Type: Document Default Data Loader  
  - Role: Loads structured video summary data with metadata for embedding.  
  - Inputs: Edit Fields output.  
  - Outputs: Document objects with metadata.  
  - Edge Cases: Missing metadata fields.  

- **Recursive Character Text Splitter**  
  - Type: Text Splitter  
  - Role: Splits long text into chunks of 1200 characters with 200 overlap for embedding.  
  - Inputs: Default Data Loader output.  
  - Outputs: Text chunks.  
  - Edge Cases: Very short or very long texts.  

- **Embeddings Google Gemini**  
  - Type: Embeddings (Google Gemini)  
  - Role: Generates vector embeddings for text chunks.  
  - Inputs: Text chunks.  
  - Outputs: Embeddings vectors.  
  - Edge Cases: API rate limits, embedding failures.  

- **Qdrant Vector Store**  
  - Type: Vector Store Qdrant (Insert)  
  - Role: Inserts embeddings into Qdrant collection keyed by playlist or video ID.  
  - Inputs: Embeddings output.  
  - Outputs: Confirmation of insertion.  
  - Edge Cases: API errors, collection not found.  

- **Update Context Process Done1**  
  - Type: Redis (Set)  
  - Role: Updates context status to DONE after processing completes.  
  - Inputs: Process Status output.  
  - Outputs: Redis confirmation.  
  - Edge Cases: Redis write failure.  

- **Get Fields for Summary**  
  - Type: Code  
  - Role: Retrieves all edited fields for summary concatenation.  
  - Inputs: Edit Fields output.  
  - Outputs: Array of summaries.  
  - Edge Cases: Empty input.  

- **Full Summary**  
  - Type: Summarize (concatenate)  
  - Role: Concatenates all individual video summaries into a full summary overview.  
  - Inputs: Get Fields for Summary output.  
  - Outputs: Combined summary text.  
  - Edge Cases: Very large text size.  

- **AI Agent**  
  - Type: Langchain Agent  
  - Role: Generates a verbose, exhaustive final summary overview using the concatenated summaries and user query.  
  - Configuration: Uses tool `chat_playlist_data` to analyze video content.  
  - Inputs: User chat input, Full Summary output.  
  - Outputs: Final AI-generated summary response.  
  - Edge Cases: AI timeouts, incomplete responses.  

- **Chat Buffer Memory1**  
  - Type: Memory Buffer Window  
  - Role: Maintains conversational memory for AI Agent responses.  
  - Inputs: Chat session ID.  
  - Outputs: Memory context.  
  - Edge Cases: Memory overflow.  

---

#### 2.6 Query Handling & Chat Response

**Overview:**  
Handles user queries after processing is done or if no new URL is provided. Uses conversational AI with chat memory and vector store retrieval to answer questions about the playlist or video content.

**Nodes Involved:**  
- Handle Queries  
- Chat Buffer Memory  
- Answer questions with a vector store  
- Google Gemini Chat Model1  

**Node Details:**

- **Handle Queries**  
  - Type: Langchain Agent  
  - Role: Conversational AI agent that answers user queries based on stored vector embeddings and context.  
  - Configuration: System message instructs exhaustive, structured markdown replies using `chat_playlist_data` tool.  
  - Inputs: User chat input, chat memory, vector store tool.  
  - Outputs: AI-generated answer to user query.  
  - Edge Cases: Missing context, ambiguous queries.  

- **Chat Buffer Memory**  
  - Type: Memory Buffer Window  
  - Role: Maintains chat session memory for query handling.  
  - Inputs: Chat session ID.  
  - Outputs: Memory context.  
  - Edge Cases: Session mismatch.  

- **Answer questions with a vector store**  
  - Type: Langchain Tool Vector Store  
  - Role: Retrieves relevant documents from Qdrant vector store to support AI answers.  
  - Inputs: User query, playlist/video ID.  
  - Outputs: Retrieved documents for AI context.  
  - Edge Cases: Empty vector store, retrieval errors.  

- **Google Gemini Chat Model1**  
  - Type: Language Model (Google Gemini)  
  - Role: Provides language model capabilities for the Handle Queries agent.  
  - Inputs: Query and retrieved documents.  
  - Outputs: AI-generated response.  
  - Edge Cases: API errors, rate limits.  

---

### 3. Summary Table

| Node Name                   | Node Type                                   | Functional Role                                  | Input Node(s)                     | Output Node(s)                     | Sticky Note                                                                                         |
|-----------------------------|---------------------------------------------|-------------------------------------------------|----------------------------------|-----------------------------------|---------------------------------------------------------------------------------------------------|
| Chat                        | Chat Trigger                                | Entry point for user chat input                  | -                                | Get Previous Context Intent        | Hi there! 👋 Please provide a URL of a Youtube playlist you would like me to analise.              |
| Get Previous Context Intent | Redis (Get)                                 | Retrieve previous conversation context          | Chat                             | Message Intent                    | ## Message intent routing - Retrieves the previous context for continuity.                         |
| Message Intent              | Langchain Agent                             | Detect user intent and extract URL/ID/limit     | Get Previous Context Intent      | Structured Output Parser1          | ## Message intent routing - Ensures data integrity before processing.                             |
| Structured Output Parser1   | Output Parser Structured                    | Parse AI output into structured JSON             | Message Intent                  | Default Intent                   |                                                                                                   |
| Default Intent              | Code                                        | Use previous context if current intent is NONE  | Structured Output Parser1        | Route Message Intent              |                                                                                                   |
| Process Status              | Code                                        | Update processing status based on intent/limit  | Route Message Intent             | Update Context Intent             |                                                                                                   |
| Update Context Intent       | Redis (Set)                                 | Store updated context in Redis                    | Process Status                  | Qdrant Vector Store2              | ## Update Context - Updates any issues detected in the context.                                   |
| Route Message Intent        | Switch                                      | Route workflow based on intent and status        | Default Intent                  | Process Status, Handle Queries    | ## Message intent routing - Routes incoming messages based on intent.                             |
| Qdrant Vector Store2        | Vector Store Qdrant (Load)                   | Check if embeddings exist for current ID         | Update Context Intent           | Count Content                    | ## Already Processed? - Check if we already have embeddings in the vector store.                   |
| Count Content               | Summarize                                   | Count documents in vector store                   | Qdrant Vector Store2            | If                              |                                                                                                   |
| If                         | If                                          | Branch based on existence of embeddings           | Count Content                  | Update Context Intent1, Playlist Limit | ## Process or ask for more details - Decides next steps based on workflow conditions.              |
| Update Context Intent1      | Redis (Set)                                 | Update context status to DONE                      | If (true branch)               | Handle Queries                   |                                                                                                   |
| Playlist Limit              | If                                          | Check if playlist limit is missing                 | If (false branch)              | Numb of Videos, Playlist or Video |                                                                                                   |
| Numb of Videos              | Langchain Agent                             | Ask user for number of playlist videos to process | Playlist Limit (true branch)   | Simple Memory3                  | ## Ask number of Playlist videos to process                                                        |
| Playlist or Video           | Switch                                      | Route to playlist or video processing pipeline    | Playlist Limit (false branch)  | Playlist HTTP Request, Video HTTP Request |                                                                                                   |
| Playlist HTTP Request       | HTTP Request                               | Fetch playlist page HTML                           | Playlist or Video (playlist)   | Get Playlist Videos Data         | ## Fetch and prepare Playlist video transcripts data for processing                               |
| Get Playlist Videos Data    | Code                                        | Parse playlist HTML to extract videos and metadata | Playlist HTTP Request          | Split Out1                     |                                                                                                   |
| Split Out1                 | Split Out                                   | Split playlist videos array into individual items | Get Playlist Videos Data        | Limit                          |                                                                                                   |
| Limit                      | Limit                                       | Limit number of videos to process                  | Split Out1                    | YouTube Transcript             |                                                                                                   |
| YouTube Transcript          | Community Node (youtubeTranscripter)        | Fetch transcripts for each video                   | Limit                         | Split Out                     |                                                                                                   |
| Split Out                  | Split Out                                   | Split transcripts array for processing             | YouTube Transcript             | Concatenate                   |                                                                                                   |
| Concatenate                | Summarize (concatenate)                      | Concatenate transcript text by video ID            | Split Out                     | Merge                        |                                                                                                   |
| Video Titles               | Split Out                                   | Extract video titles from playlist videos          | Limit                         | Merge                        |                                                                                                   |
| Merge                      | Merge (SQL Combine)                          | Join transcript text with video titles and metadata | Concatenate, Video Titles      | Summarize & Analyze Transcript |                                                                                                   |
| Summarize & Analyze Transcript | Langchain Chain LLM                      | Generate structured summaries from transcripts     | Merge                        | Edit Fields                  | ## Summarize & Analyze Transcript - Creates summarized data from transcripts.                    |
| Edit Fields                | Set                                         | Assign structured fields for embedding and storage | Summarize & Analyze Transcript | Delete Collection            |                                                                                                   |
| Delete Collection          | HTTP Request                               | Delete existing points in Qdrant collection         | Edit Fields                  | Get Videos                   |                                                                                                   |
| Get Videos                 | Code                                        | Prepare video data for embedding                     | Delete Collection            | Qdrant Vector Store           |                                                                                                   |
| Qdrant Vector Store        | Vector Store Qdrant (Insert)                  | Insert embeddings into Qdrant collection             | Default Data Loader          | Update Context Process Done1  | ## Store Embeddings - Saves embedded data for future use.                                        |
| Default Data Loader        | Document Default Data Loader                  | Load documents with metadata for embedding           | Recursive Character Text Splitter | Qdrant Vector Store          |                                                                                                   |
| Recursive Character Text Splitter | Text Splitter                           | Split text into chunks for embedding                  | Default Data Loader          | Embeddings Google Gemini      |                                                                                                   |
| Embeddings Google Gemini   | Embeddings (Google Gemini)                     | Generate vector embeddings for text chunks            | Recursive Character Text Splitter | Qdrant Vector Store          |                                                                                                   |
| Update Context Process Done1 | Redis (Set)                               | Update context status to DONE after processing        | Qdrant Vector Store          | Get Fields for Summary        |                                                                                                   |
| Get Fields for Summary     | Code                                        | Retrieve all edited fields for summary concatenation  | Update Context Process Done1 | Full Summary                 |                                                                                                   |
| Full Summary              | Summarize (concatenate)                        | Concatenate all video summaries into full summary     | Get Fields for Summary       | AI Agent                    | ## First Summary Analysis - Conducts initial analysis of summarized data.                         |
| AI Agent                  | Langchain Agent                               | Generate final comprehensive summary overview          | Full Summary, Chat           | Answer questions with a vector store1 |                                                                                                   |
| Chat Buffer Memory1       | Memory Buffer Window                          | Maintain chat memory for AI Agent                      | Chat                         | AI Agent                    |                                                                                                   |
| Video HTTP Request        | HTTP Request                               | Fetch single video page HTML                            | Playlist or Video (video)    | YouTube Transcript1, Get Title and Desc | ## Fetch and prepare single video transcripts data for processing                                |
| YouTube Transcript1       | Community Node (youtubeTranscripter)        | Fetch transcript for single video                      | Video HTTP Request           | Split Out2                  |                                                                                                   |
| Split Out2                | Split Out                                   | Split transcript array for single video                | YouTube Transcript1          | Concatenate1                |                                                                                                   |
| Concatenate1              | Summarize (concatenate)                      | Concatenate transcript text for single video           | Split Out2                   | Merge                      |                                                                                                   |
| Get Title and Desc        | Code                                        | Extract title, description, duration from video HTML   | Video HTTP Request           | Merge                      |                                                                                                   |
| Answer questions with a vector store | Langchain Tool Vector Store           | Retrieve relevant documents from Qdrant for queries    | Qdrant Vector Store3, Qdrant Vector Store4 | Handle Queries, AI Agent |                                                                                                   |
| Handle Queries            | Langchain Agent                             | Conversational AI agent answering user queries         | Chat, Chat Buffer Memory, Answer questions with a vector store | Google Gemini Chat Model1 | ## RAG & Reply to User Query - Retrieves and provides answers to user queries combining retrieval-augmented generation. |
| Chat Buffer Memory        | Memory Buffer Window                          | Maintain chat memory for query handling                 | Chat                         | Handle Queries              |                                                                                                   |
| Google Gemini Chat Model1 | Language Model (Google Gemini)                 | Language model for query answering                       | Handle Queries               | -                          |                                                                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Chat Trigger Node**  
   - Type: `@n8n/n8n-nodes-langchain.chatTrigger`  
   - Configure as public webhook.  
   - Initial message: "Hi there! 👋 Please provide a URL of a Youtube playlist you would like me to analise."  

2. **Add Redis Get Node (Get Previous Context Intent)**  
   - Type: Redis (Get)  
   - Key: `context_intent_{{ $json.sessionId }}`  
   - Retrieve previous context for session continuity.  

3. **Add Langchain Agent Node (Message Intent)**  
   - Type: Langchain Agent  
   - Input: User chat input from Chat node.  
   - System message: Define rules to detect if input contains YouTube playlist URL, video URL, or none.  
   - Output: JSON with fields intent, url, id, limit, status.  

4. **Add Output Parser Structured Node**  
   - Parse AI output into strict JSON format matching schema.  

5. **Add Code Node (Default Intent)**  
   - Logic: If current intent is NONE and previous context exists, use previous context; else use current intent.  

6. **Add Code Node (Process Status)**  
   - Logic: Set status to READY if intent is VIDEO or PLAYLIST with limit > 0; else PENDING.  

7. **Add Redis Set Node (Update Context Intent)**  
   - Store updated intent and status in Redis with key `context_intent_{{ $json.sessionId }}`.  

8. **Add Switch Node (Route Message Intent)**  
   - Route based on intent and status: PROCESS if intent VIDEO or PLAYLIST and status not DONE; QUERY otherwise.  

9. **Add Qdrant Vector Store Load Node (Qdrant Vector Store2)**  
   - Check if embeddings exist for current ID.  

10. **Add Summarize Node (Count Content)**  
    - Count documents returned from Qdrant load.  

11. **Add If Node**  
    - Condition: If count > 0 (embeddings exist).  
    - True branch: Update context status to DONE (Redis Set node Update Context Intent1).  
    - False branch: Check playlist limit.  

12. **Add If Node (Playlist Limit)**  
    - Condition: If intent is PLAYLIST and limit <= 0.  
    - True branch: Langchain Agent node (Numb of Videos) to ask user for number of videos.  
    - False branch: Switch node (Playlist or Video) to route to processing pipelines.  

13. **Playlist Processing Pipeline:**  
    - HTTP Request node (Playlist HTTP Request) to fetch playlist page.  
    - Code node (Get Playlist Videos Data) to parse playlist and extract videos.  
    - Split Out node (Split Out1) to split videos.  
    - Limit node to limit videos processed.  
    - Community Node (YouTube Transcript) to fetch transcripts per video.  
    - Split Out node (Split Out) to split transcripts.  
    - Summarize node (Concatenate) to concatenate transcript text by video ID.  
    - Split Out node (Video Titles) to extract titles.  
    - Merge node to join transcripts and titles.  
    - Langchain Chain LLM node (Summarize & Analyze Transcript) to summarize transcripts.  
    - Set node (Edit Fields) to assign structured fields.  
    - HTTP Request node (Delete Collection) to clear existing Qdrant data.  
    - Code node (Get Videos) to prepare data for embedding.  

14. **Video Processing Pipeline:**  
    - HTTP Request node (Video HTTP Request) to fetch video page.  
    - Community Node (YouTube Transcript1) to fetch transcript.  
    - Split Out node (Split Out2) to split transcript.  
    - Summarize node (Concatenate1) to concatenate transcript text.  
    - Code node (Get Title and Desc) to extract video metadata.  
    - Merge node to join transcript and metadata.  
    - Use shared Summarize & Analyze Transcript and Edit Fields nodes.  
    - Use shared Delete Collection node.  

15. **Embedding Storage & Final Summary:**  
    - Document Default Data Loader node (Default Data Loader) to load documents with metadata.  
    - Text Splitter node (Recursive Character Text Splitter) to chunk text.  
    - Embeddings node (Embeddings Google Gemini) to generate embeddings.  
    - Vector Store node (Qdrant Vector Store) to insert embeddings.  
    - Redis Set node (Update Context Process Done1) to update status to DONE.  
    - Code node (Get Fields for Summary) to retrieve summaries.  
    - Summarize node (Full Summary) to concatenate summaries.  
    - Langchain Agent node (AI Agent) to generate final comprehensive summary.  
    - Memory Buffer Window node (Chat Buffer Memory1) for AI Agent memory.  

16. **Query Handling & Chat Response:**  
    - Langchain Agent node (Handle Queries) to answer user queries.  
    - Memory Buffer Window node (Chat Buffer Memory) for query memory.  
    - Langchain Tool Vector Store node (Answer questions with a vector store) to retrieve relevant documents.  
    - Google Gemini Chat Model node (Google Gemini Chat Model1) as language model for query handling.  

17. **Credential Setup:**  
    - Configure credentials for:  
      - Google Gemini (PaLM API) for all AI nodes.  
      - Qdrant API for vector store nodes.  
      - Redis for context storage nodes.  
    - Install community node `youtubeTranscripter` for transcript fetching (`npm install n8n-nodes-youtube-transcription-dmr`).  
    - Ensure self-hosted n8n instance for community node support.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                          | Context or Link                                                                                                  |
|-------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| This workflow uses the community node `youtubeTranscripter` which requires a self-hosted n8n instance.                              | Installation: `npm install n8n-nodes-youtube-transcription-dmr`                                                 |
| Redis is used to maintain conversation context and status between interactions.                                                     | Redis instance and credentials must be configured in n8n.                                                      |
| Google Gemini (PaLM) API is used for AI language modeling and embeddings generation.                                                 | Credentials must be configured with valid Google Cloud API keys.                                               |
| Qdrant vector database stores embeddings for efficient retrieval and similarity search.                                             | Qdrant API credentials must be configured.                                                                      |
| The workflow uses modified code from the `play-dl` library licensed under GNU GPLv3 for parsing YouTube playlist and video metadata.| See https://github.com/play-dl/play-dl and https://www.gnu.org/licenses/gpl-3.0.en.html                          |
| The workflow supports follow-up questions by maintaining chat memory windows with Langchain memory buffer nodes.                   | Enables conversational context for natural user interactions.                                                  |
| Sample prompts include asking for summaries, key points, elaborations, and specific topic queries on playlists or videos.          | See workflow description for example prompts.                                                                   |

---

This document provides a comprehensive, structured reference for understanding, reproducing, and modifying the **AI YouTube Playlist & Video Analyst Chatbot** workflow in n8n. It covers all nodes, their roles, configurations, and interconnections, enabling advanced users and AI agents to work effectively with the workflow.