AI Youtube Trend Finder Based On Niche

https://n8nworkflows.xyz/workflows/ai-youtube-trend-finder-based-on-niche-2606


# AI Youtube Trend Finder Based On Niche

### 1. Workflow Overview

This n8n workflow, titled **"AI Youtube Trend Finder Based On Niche"**, is designed to help YouTube content creators discover trending video topics within a specified niche by analyzing recent video data. It leverages YouTube APIs combined with an AI language model to generate insightful summaries of trending themes, tags, and engagement metrics from videos published within the last two days.

The workflow logically consists of the following blocks:

- **1.1 Input Reception:** Receives user queries via chat, verifying or prompting for a niche.
- **1.2 AI Agent Processing:** Uses a GPT-based AI node to understand the niche, generate search terms, invoke YouTube search, and analyze aggregated video data.
- **1.3 YouTube Video Search and Data Retrieval:** Searches YouTube for relevant videos, then fetches detailed metadata and statistics about each video.
- **1.4 Video Filtering and Data Aggregation:** Filters videos by duration (only >3m30s), cleans and sanitizes metadata, stores it in memory, and prepares consolidated data.
- **1.5 Output Generation:** Compiles insights based on video data and delivers them back to the user.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block waits for a user’s chat message, which should include a niche query or content preference. If the niche is missing, the AI agent prompts the user to specify one.

- **Nodes Involved:**  
  - `chat_message_received`

- **Node Details:**  
  - **chat_message_received**  
    - Type: Chat Trigger (LangChain)  
    - Role: Entry point listening for user input via chat webhook.  
    - Configuration: Default options; webhook enabled with ID `ff9622a4-a6ec-4396-b9de-c95bd834c23c`.  
    - Inputs: External user chat messages.  
    - Outputs: Passes received query to AI Agent.  
    - Edge cases: Missing niche input from user; handled by AI Agent prompting for niche.

#### 2.2 AI Agent Processing

- **Overview:**  
  The core AI node interprets user input, ensures a niche is selected, dynamically creates up to three search terms relevant to the niche, calls the YouTube search tool workflow with these terms, receives video lists, analyzes video metadata, and generates a comprehensive trend summary.

- **Nodes Involved:**  
  - `AI Agent`  
  - `window_buffer_memory` (AI context memory)  
  - `openai_llm` (language model backend)

- **Node Details:**  
  - **AI Agent**  
    - Type: LangChain Agent node  
    - Role: Conversational AI orchestrator and decision-maker.  
    - Configuration:  
      - Uses a system prompt instructing the agent to verify niche input, generate search terms, call the `youtube_search` tool workflow up to 3 times, analyze returned video info, and produce trend insights.  
      - Output format includes video URLs and channel URLs.  
      - Emphasis on identifying patterns in tags and titles.  
    - Inputs: User chat message, AI memory context, outputs from YouTube search tool.  
    - Outputs: Textual trend summary and video data for further processing.  
    - Edge cases: Expression evaluation errors, tool call failures, missing or malformed API responses, or incomplete video data.

  - **window_buffer_memory**  
    - Type: Memory Buffer (LangChain)  
    - Role: Maintains conversation context across steps, improving AI response relevance.  
    - Connected as AI memory source to `AI Agent`.  
    - Edge cases: Memory overflow or data corruption could cause context loss.

  - **openai_llm**  
    - Type: OpenAI chat language model node  
    - Role: Backend LLM for AI Agent.  
    - Configuration: Default OpenAI chat settings; connected to AI Agent.  
    - Edge cases: API rate limits, authentication errors, network timeouts.

#### 2.3 YouTube Video Search and Data Retrieval

- **Overview:**  
  This block performs video searches based on AI-generated queries, retrieves batches of videos from the last two days, and fetches detailed metadata including snippet, statistics, and content details.

- **Nodes Involved:**  
  - `youtube_search` (calls sub-workflow)  
  - `get_videos1` (YouTube API search)  
  - `loop_over_items1` (batch processing)  
  - `find_video_data1` (HTTP request for video details)  
  - `if_longer_than_3_` (filter videos by duration)

- **Node Details:**  
  - **youtube_search**  
    - Type: Tool Workflow (calls external workflow)  
    - Role: Invokes the sub-workflow named "Youtube Search Workflow" to perform YouTube searches.  
    - Inputs: search_term parameter, supplied by AI Agent.  
    - Outputs: List of videos matching search term and filters.  
    - Edge cases: Sub-workflow must be active and correctly set up; parameter schema enforced.

  - **get_videos1**  
    - Type: YouTube node (native)  
    - Role: Queries YouTube API for videos matching the search term, limited to 3 results, with filters: US region, published in the last 2 days, ordered by relevance, moderate safe search.  
    - Inputs: search_term from AI Agent.  
    - Outputs: Video list with video IDs and metadata.  
    - Credentials: YouTube OAuth2 required.  
    - Edge cases: API quota limits, auth errors, no results returned.

  - **loop_over_items1**  
    - Type: SplitInBatches  
    - Role: Processes videos one by one to fetch detailed data.  
    - Inputs: list of videos from `get_videos1`.  
    - Outputs: Iterates each video to `find_video_data1` and `retrieve_data_from_memory1`.  
    - Edge cases: Large batches could slow workflow; must handle empty input gracefully.

  - **find_video_data1**  
    - Type: HTTP Request  
    - Role: Calls YouTube Data API v3 `videos` endpoint to get video details: contentDetails, snippet, statistics.  
    - Inputs: video ID from current batch item.  
    - Outputs: Detailed video info JSON.  
    - Credentials: API key from environment variable `GOOGLE_API_KEY`.  
    - Edge cases: API failure, invalid video ID, quota limits.

  - **if_longer_than_3_**  
    - Type: If node  
    - Role: Filters videos with duration longer than 3 minutes 30 seconds (210 seconds).  
    - Inputs: video contentDetails.duration field.  
    - Logic: Parses ISO 8601 duration to seconds, proceeds only if >210s.  
    - Outputs: True branch to data grouping; false branch loops back to process next item.  
    - Edge cases: Malformed duration strings, missing duration fields.

#### 2.4 Video Filtering and Data Aggregation

- **Overview:**  
  After filtering, this block extracts relevant data fields, sanitizes text to remove URLs and emojis, and accumulates the processed data into a global memory buffer for AI analysis.

- **Nodes Involved:**  
  - `group_data1`  
  - `save_data_to_memory1`  
  - `retrieve_data_from_memory1`  
  - `response1`

- **Node Details:**  
  - **group_data1**  
    - Type: Set  
    - Role: Extracts key fields from the detailed video JSON such as video ID, viewCount, likeCount, commentCount, description, title, channelTitle, tags (joined string), and channelId.  
    - Inputs: filtered video data from `if_longer_than_3_`.  
    - Outputs: Structured video metadata for sanitizing and storage.  
    - Edge cases: Missing tags or fields cause empty strings or nulls.

  - **save_data_to_memory1**  
    - Type: Code  
    - Role: Cleans descriptions by removing URLs, emojis, and extraneous whitespace; converts data to sanitized strings; appends to a global static memory under `lastExecution.response`.  
    - Configuration: Runs once per video item.  
    - Inputs: grouped video data.  
    - Outputs: updated memory state.  
    - Edge cases: Unicode issues with emoji removal; large memory payloads.

  - **retrieve_data_from_memory1**  
    - Type: Code  
    - Role: Retrieves accumulated video data from global static memory for output.  
    - Inputs: none (reads global memory).  
    - Outputs: passes memory string to `response1`.  
    - Edge cases: Empty or stale memory data.

  - **response1**  
    - Type: Set  
    - Role: Packages the final response string (aggregated video data) for delivery back to the AI Agent or user.  
    - Inputs: data from `retrieve_data_from_memory1`.  
    - Outputs: Final structured result.  
    - Edge cases: Large string sizes; formatting errors.

#### 2.5 Output Generation

- **Overview:**  
  The AI Agent uses aggregated data to generate a natural language response summarizing trends, patterns in tags and titles, and engagement metrics, returning this to the user via the chat interface.

- **Nodes Involved:**  
  - `AI Agent` (final response generation)  
  - `chat_message_received` (initial trigger)  

- **Node Details:**  
  - Already described in 2.2, the AI Agent composes the final user-facing message based on data retrieved and stored in memory.  
  - Edge cases: AI failing to parse data correctly or generating incomplete responses.

---

### 3. Summary Table

| Node Name             | Node Type                                 | Functional Role                                  | Input Node(s)              | Output Node(s)             | Sticky Note                                                                                     |
|-----------------------|-------------------------------------------|-------------------------------------------------|----------------------------|----------------------------|------------------------------------------------------------------------------------------------|
| chat_message_received  | @n8n/n8n-nodes-langchain.chatTrigger      | Entry point for user input via chat webhook     | External                   | AI Agent                   |                                                                                                |
| AI Agent              | @n8n/n8n-nodes-langchain.agent            | Core AI logic: niche verification, search term generation, calls YouTube search, analyzes data, generates output | chat_message_received, youtube_search, window_buffer_memory, openai_llm | youtube_search, window_buffer_memory, chat_message_received (response) |                                                                                                |
| window_buffer_memory  | @n8n/n8n-nodes-langchain.memoryBufferWindow | Maintains AI conversation context                | None                       | AI Agent                   |                                                                                                |
| openai_llm            | @n8n/n8n-nodes-langchain.lmChatOpenAi     | LLM backend for AI Agent                          | None                       | AI Agent                   |                                                                                                |
| youtube_search         | @n8n/n8n-nodes-langchain.toolWorkflow     | Calls sub-workflow "Youtube Search Workflow" to perform YouTube search | AI Agent                   | AI Agent                   |                                                                                                |
| get_videos1            | @n8n/nodes-base.youTube                    | Search YouTube videos matching query             | youtube_search             | loop_over_items1           |                                                                                                |
| loop_over_items1       | @n8n/nodes-base.splitInBatches             | Processes videos one-by-one for detailed data    | get_videos1                | find_video_data1, retrieve_data_from_memory1 |                                                                                                |
| find_video_data1       | @n8n/nodes-base.httpRequest                 | Fetches video details (snippet, statistics, contentDetails) | loop_over_items1           | if_longer_than_3_          |                                                                                                |
| if_longer_than_3_      | @n8n/nodes-base.if                          | Filters videos longer than 3m30s                  | find_video_data1           | group_data1 (true), loop_over_items1 (false) |                                                                                                |
| group_data1            | @n8n/nodes-base.set                         | Extracts and organizes video metadata fields     | if_longer_than_3_          | save_data_to_memory1       |                                                                                                |
| save_data_to_memory1   | @n8n/nodes-base.code                        | Cleans and accumulates video data in global memory | group_data1                | loop_over_items1           |                                                                                                |
| retrieve_data_from_memory1 | @n8n/nodes-base.code                    | Retrieves aggregated video data from memory      | loop_over_items1           | response1                  |                                                                                                |
| response1              | @n8n/nodes-base.set                         | Packages final response for user                  | retrieve_data_from_memory1 |                            |                                                                                                |
| Sticky Note1           | n8n-nodes-base.stickyNote                   | Visual grouping labeled "Main Workflow"           | None                       | None                       |                                                                                                |
| Sticky Note2           | n8n-nodes-base.stickyNote                   | Notes that YouTube search should be abstracted to sub-workflow | None                       | None                       | This part should be abstracted to another workflow and called inside the "youtube_search" tool of the main AI Agent. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Chat Trigger Node:**  
   - Name: `chat_message_received`  
   - Type: `@n8n/n8n-nodes-langchain.chatTrigger`  
   - Configure webhook with unique ID to receive chat messages.

2. **Create AI Agent Node:**  
   - Name: `AI Agent`  
   - Type: `@n8n/n8n-nodes-langchain.agent`  
   - Set system message prompt as per the workflow description: verify niche input, generate up to 3 search terms, call YouTube search tool, analyze video data, summarize trends.  
   - Connect `chat_message_received` output to this node’s main input.

3. **Create OpenAI LLM Node:**  
   - Name: `openai_llm`  
   - Type: `@n8n/n8n-nodes-langchain.lmChatOpenAi`  
   - Configure OpenAI API credentials.  
   - Connect output to `AI Agent` under AI Language Model input.

4. **Create Window Buffer Memory Node:**  
   - Name: `window_buffer_memory`  
   - Type: `@n8n/n8n-nodes-langchain.memoryBufferWindow`  
   - No special parameters needed.  
   - Connect output to `AI Agent` under AI memory input.

5. **Create YouTube Search Tool Workflow:**  
   - Implement a separate workflow named e.g., `Youtube Search Workflow` for video searching and details fetching (see steps 6-12 below).  
   - In the main workflow, add a `youtube_search` node:  
     - Type: `@n8n/n8n-nodes-langchain.toolWorkflow`  
     - Set reference to the above sub-workflow by ID or name.  
     - Define input schema with a single parameter `search_term`.  
   - Connect `AI Agent` AI tool output to `youtube_search` input.

6. **In the YouTube Search Sub-Workflow:**  

   - Create `get_videos1` node:  
     - Type: `YouTube` node  
     - Configure with YouTube OAuth2 credentials.  
     - Parameters:  
       - Limit: 3  
       - Filters: query = `={{ $json.query.search_term }}`, regionCode = "US", publishedAfter = two days ago (ISO string)  
       - Order: relevance  
       - SafeSearch: moderate  

7. **Create `loop_over_items1` node:**  
   - Type: `SplitInBatches`  
   - No special parameters.  
   - Connect `get_videos1` output to this node.

8. **Create `find_video_data1` node:**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://www.googleapis.com/youtube/v3/videos`  
   - Query parameters:  
     - key: `={{ $env["GOOGLE_API_KEY"] }}`  
     - id: `={{ $json.id.videoId }}`  
     - part: `contentDetails,snippet,statistics`  
   - Connect `loop_over_items1` output to this.

9. **Create `if_longer_than_3_` node:**  
   - Type: If node  
   - Condition: Check if video duration (ISO8601 in contentDetails.duration) converted to seconds is greater than 210 (3m30s).  
   - True branch connects to `group_data1`.  
   - False branch loops back to `loop_over_items1` to process next item.

10. **Create `group_data1` node:**  
    - Type: Set  
    - Extract fields: id, viewCount, likeCount, commentCount, description, title, channelTitle, tags (joined with commas), channelId from the first item in input JSON.

11. **Create `save_data_to_memory1` node:**  
    - Type: Code  
    - JavaScript:  
      - Remove emojis and URLs from description and other text fields.  
      - Append sanitized JSON string to global static data under `lastExecution.response`.  
    - Connect `group_data1` output here, then back to `loop_over_items1` for next item.

12. **Create `retrieve_data_from_memory1` node:**  
    - Type: Code  
    - JavaScript: retrieve `lastExecution` global static memory data.  
    - Connect output to `response1`.

13. **Create `response1` node:**  
    - Type: Set  
    - Assign final response string to a field named `response`.  
    - Output to the main workflow or AI Agent.

14. **Back in the main workflow:**  
    - Connect `youtube_search` output to `AI Agent` AI tool input.  
    - Connect `window_buffer_memory` output to `AI Agent` AI memory input.  
    - Connect `openai_llm` output to `AI Agent` AI language model input.  
    - Connect `chat_message_received` output to `AI Agent` main input.

15. **Credentials Setup:**  
    - Configure OpenAI API credentials for `openai_llm`.  
    - Configure YouTube OAuth2 credentials for `get_videos1`.  
    - Set environment variable `GOOGLE_API_KEY` with a valid Google API key for `find_video_data1` HTTP request node.

16. **Final Testing:**  
    - Trigger workflow by sending chat message with or without niche.  
    - Confirm AI Agent prompts for niche if missing.  
    - Confirm YouTube search tool runs and data is fetched, filtered, cleaned, and summarized.  
    - Confirm user receives trend insights with video and channel URLs.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                              | Context or Link                                                                                      |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| The sub-workflow for YouTube search and video data retrieval is recommended to be abstracted and maintained separately for clarity and reuse.                                             | Sticky Note2 in workflow                                                                           |
| YouTube Data API usage requires proper quota management; ensure credentials have sufficient quota to avoid failures during frequent searches.                                            | YouTube API documentation: https://developers.google.com/youtube/v3                              |
| The AI agent system prompt is carefully crafted to avoid focusing on individual videos, instead emphasizing overall trends and patterns in video metadata.                                | System prompt text in `AI Agent` node parameters                                                  |
| The memory buffer node enhances AI contextual awareness but may accumulate large data over time; consider resetting memory periodically if workflow is reused extensively.                | General best practice for LangChain memory nodes                                                  |
| Video duration filtering ensures that only substantial content is analyzed, avoiding short clips which might distort trend analysis.                                                     | `if_longer_than_3_` node logic                                                                    |
| Example of niche input: "digital marketing" produces trends around "mental triggers," "psychological marketing," and common tags like "SEO" and "Conversion Rates."                      | From workflow description and example output                                                     |

---

This detailed documentation should enable advanced users and AI agents to understand, reproduce, and maintain the AI Youtube Trend Finder workflow effectively.