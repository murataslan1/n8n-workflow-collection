AI YouTube Trend Explorer – n8n Automation Workflow with Gemini/ChatGPT

https://n8nworkflows.xyz/workflows/ai-youtube-trend-explorer---n8n-automation-workflow-with-gemini-chatgpt-5296


# AI YouTube Trend Explorer – n8n Automation Workflow with Gemini/ChatGPT

### 1. Workflow Overview

This workflow, titled **"AI YouTube Trend Explorer – n8n Automation Workflow with Gemini/ChatGPT"**, is designed as a **YouTube video search and data extraction sub-workflow**. Its primary purpose is to search YouTube for videos based on a dynamically provided search term, filter and collect detailed metadata for relevant videos, and aggregate this information for further processing or integration. The workflow is structured to be triggered by another workflow, making it modular and reusable in larger automation scenarios, such as AI trend analysis or content curation pipelines via Gemini/ChatGPT or other AI tools.

The logical blocks of the workflow are:

- **1.1 Input Reception**: Receives the search term from an external workflow.
- **1.2 Video Search**: Queries YouTube API to find videos matching the search term.
- **1.3 Batch Processing & Detailed Video Data Retrieval**: Processes the found videos in batches, fetching detailed metadata for each.
- **1.4 Filtering and Data Structuring**: Filters videos by duration, structures relevant details into a clean data format.
- **1.5 Data Aggregation and Sanitization**: Aggregates all results into a sanitized global memory variable for use beyond this sub-workflow.
- **1.6 Output Preparation**: Prepares the response payload to be passed back to the calling workflow.

---

### 2. Block-by-Block Analysis

#### Block 1.1: Input Reception

- **Overview:**  
  This block listens for execution triggers from other workflows and accepts input data, specifically the search term used for YouTube queries.

- **Nodes Involved:**  
  - When Executed by Another Workflow

- **Node Details:**  

  - **When Executed by Another Workflow**  
    - Type: Execute Workflow Trigger  
    - Role: Entry point that receives inputs from an external workflow.  
    - Configuration: Input source set to "passthrough" to forward received data unchanged.  
    - Inputs: None (triggered externally)  
    - Outputs: Passes received JSON data (expected to contain `query.search_term`) downstream.  
    - Edge Cases: If the external workflow does not provide the expected input structure, downstream nodes may fail or return empty results.

---

#### Block 1.2: Video Search

- **Overview:**  
  Uses the YouTube API to search for videos matching the search term, limited to recent videos (published within the last 2 days) and sorted by relevance.

- **Nodes Involved:**  
  - Youtube - Get Video

- **Node Details:**  

  - **Youtube - Get Video**  
    - Type: YouTube node  
    - Role: Performs video search based on the input search term.  
    - Configuration:  
      - Limit: 3 videos  
      - Filters:  
        - Query (`q`): Dynamic expression from input JSON: `{{$json.query.search_term}}`  
        - Region: US  
        - Published After: 2 days ago (calculated by JS expression)  
      - Options: Order by relevance, moderate safe search  
      - Resource: video  
    - Inputs: Receives search term from previous node  
    - Outputs: List of videos metadata (limited set)  
    - Credentials: Uses OAuth2 credential named "YouTube - toan.ngo"  
    - Edge Cases: API quota limits, auth errors, no videos found, invalid search term.

---

#### Block 1.3: Batch Processing & Detailed Video Data Retrieval

- **Overview:**  
  Processes the search results in batches, retrieves detailed video information (content details, snippet, statistics) for each video.

- **Nodes Involved:**  
  - Loop Over Items  
  - HTTP - Find Video Data

- **Node Details:**  

  - **Loop Over Items**  
    - Type: Split In Batches  
    - Role: Iterates over each video item individually for detailed processing.  
    - Configuration: Default batch size (processes one item per iteration).  
    - Inputs: List of videos from "Youtube - Get Video" node.  
    - Outputs: Single video per iteration.  
    - Edge Cases: Empty input, batch processing delays.

  - **HTTP - Find Video Data**  
    - Type: HTTP Request  
    - Role: Calls YouTube videos API endpoint to fetch detailed metadata for each video ID.  
    - Configuration:  
      - URL: `https://www.googleapis.com/youtube/v3/videos?`  
      - Query Parameters:  
        - id: Extracted dynamically from current item (`{{$json.id.videoId}}`)  
        - part: contentDetails, snippet, statistics  
      - Authentication: Predefined YouTube OAuth2 credential.  
    - Inputs: One video ID per iteration from Loop Over Items  
    - Outputs: Detailed video metadata JSON.  
    - Edge Cases: API rate limit, missing video ID, auth errors, HTTP timeouts.

---

#### Block 1.4: Filtering and Data Structuring

- **Overview:**  
  Filters videos to keep only those longer than 3 minutes and 30 seconds, and extracts key video data fields into a clean, consistent format.

- **Nodes Involved:**  
  - If - Longer Than 3  
  - Field - Group Data

- **Node Details:**  

  - **If - Longer Than 3**  
    - Type: If  
    - Role: Evaluates if video duration exceeds 210 seconds (3 minutes 30 seconds).  
    - Configuration:  
      - Condition uses a JS expression to convert ISO 8601 duration to seconds, then compares.  
      - Returns true path if duration > 210 seconds, otherwise false.  
    - Inputs: Video metadata from HTTP - Find Video Data  
    - Outputs:  
      - True: Passes to Field - Group Data  
      - False: Passes back to Loop Over Items for next processing (skipping short videos)  
    - Edge Cases: Malformed duration strings, missing duration data.

  - **Field - Group Data**  
    - Type: Set  
    - Role: Maps and assigns relevant video metadata fields to simplified output fields.  
    - Configuration: Extracts:  
      - id, viewCount, likeCount, commentCount, description, title, channelTitle, tags (joined as string), channelId  
    - Inputs: Filtered video metadata (longer than 3 min 30 sec)  
    - Outputs: Structured video data item  
    - Edge Cases: Missing fields, empty tags array.

---

#### Block 1.5: Data Aggregation and Sanitization

- **Overview:**  
  Saves and accumulates all processed video data into a global static memory variable, sanitizing text fields to remove URLs, emojis, line breaks, and excess spaces.

- **Nodes Involved:**  
  - Code - Save Data To Memory

- **Node Details:**  

  - **Code - Save Data To Memory**  
    - Type: Code (JavaScript)  
    - Role:  
      - Retrieves global static data storage.  
      - Sanitizes video description and the entire item JSON string by removing URLs, emojis, line breaks, and extra spaces.  
      - Appends the sanitized item data to a cumulative `lastExecution.response` string with separator `" ### NEXT VIDEO FOUND: ### "`.  
    - Inputs: Structured video data from Field - Group Data  
    - Outputs: Updated global static data object with the aggregated response string  
    - Edge Cases: Missing description, malformed text, static data unavailability or write errors.

---

#### Block 1.6: Output Preparation

- **Overview:**  
  Retrieves the aggregated response data from global memory and prepares it as a string output for downstream workflows or processes.

- **Nodes Involved:**  
  - Code - Retrieve Data From Memory  
  - Field - Response

- **Node Details:**  

  - **Code - Retrieve Data From Memory**  
    - Type: Code (JavaScript)  
    - Role: Reads the global static data variable `lastExecution` and returns it for output.  
    - Inputs: Triggered by batch loop completion  
    - Outputs: Last saved aggregated response object  
    - Edge Cases: No saved data available (returns undefined or empty).  

  - **Field - Response**  
    - Type: Set  
    - Role: Sets a single string field `response` containing the entire aggregated data for output.  
    - Configuration: Assigns value as stringified input data (`{{$input.all()}}`)  
    - Inputs: Output from Code - Retrieve Data From Memory  
    - Outputs: Final output payload for returning to calling workflow or endpoint.

---

### 3. Summary Table

| Node Name                    | Node Type                   | Functional Role                        | Input Node(s)                  | Output Node(s)               | Sticky Note                                                                                                                                        |
|------------------------------|-----------------------------|-------------------------------------|-------------------------------|------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| When Executed by Another Workflow | Execute Workflow Trigger    | Entry point; receives external input | None                          | Youtube - Get Video           |                                                                                                                                                    |
| Youtube - Get Video           | YouTube                     | Search YouTube for videos            | When Executed by Another Workflow | Loop Over Items               |                                                                                                                                                    |
| Loop Over Items               | Split In Batches            | Process each video individually      | Youtube - Get Video            | Code - Retrieve Data From Memory, HTTP - Find Video Data |                                                                                                                                                    |
| HTTP - Find Video Data        | HTTP Request                | Retrieve detailed video metadata     | Loop Over Items                | If - Longer Than 3           |                                                                                                                                                    |
| If - Longer Than 3            | If                         | Filter videos by duration > 3m30s    | HTTP - Find Video Data         | Field - Group Data (true), Loop Over Items (false) |                                                                                                                                                    |
| Field - Group Data            | Set                         | Extract and structure video fields   | If - Longer Than 3 (true)      | Code - Save Data To Memory   |                                                                                                                                                    |
| Code - Save Data To Memory    | Code                        | Aggregate and sanitize data into global static storage | Field - Group Data             | Loop Over Items              |                                                                                                                                                    |
| Code - Retrieve Data From Memory | Code                      | Retrieve aggregated response data    | Loop Over Items                | Field - Response             |                                                                                                                                                    |
| Field - Response              | Set                         | Set final output response string     | Code - Retrieve Data From Memory | None                        |                                                                                                                                                    |
| Sticky Note                  | Sticky Note                 | Project social & contact links       | None                          | None                         | ## Sub - Youtube Search Website https://www.agentcircle.ai/ Discord Global https://discord.com/invite/jySQ2PNm FB Page Global https://www.facebook.com/agentcircle/ FB Group Global https://www.facebook.com/groups/aiagentcircle/ Gumroad http://agentcircle.gumroad.com/ X https://x.com/agent_circle YouTube https://www.youtube.com/@agentcircle Linkedin https://www.linkedin.com/company/agentcircle |

---

### 4. Reproducing the Workflow from Scratch

Follow these steps to rebuild the "Sub - Youtube Search" workflow in n8n:

1. **Create Trigger Node:**  
   - Add **Execute Workflow Trigger** node named `When Executed by Another Workflow`.  
   - Set **Input Source** to `passthrough`.

2. **Add YouTube Search Node:**  
   - Add **YouTube** node named `Youtube - Get Video`.  
   - Set **Resource** to `video`.  
   - Configure **Filters**:  
     - `q` (query) = expression: `{{$json.query.search_term}}`  
     - `regionCode` = `US`  
     - `publishedAfter` = expression: `{{ new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }}` (2 days ago)  
   - Set **Options**: order by `relevance`, safeSearch to `moderate`.  
   - Set **Limit** to `3`.  
   - Link **Credentials**: Use YouTube OAuth2 credentials (e.g., `"YouTube - toan.ngo"`).

3. **Add Batch Processing Node:**  
   - Add **Split In Batches** node named `Loop Over Items`.  
   - Leave batch size default (process one per iteration).  
   - Connect output of `Youtube - Get Video` to `Loop Over Items`.

4. **Add HTTP Request Node for Detailed Data:**  
   - Add **HTTP Request** node named `HTTP - Find Video Data`.  
   - Set URL to: `https://www.googleapis.com/youtube/v3/videos?`  
   - Under Query Parameters add:  
     - `id` = expression: `{{$json.id.videoId}}`  
     - `part` = `contentDetails,snippet,statistics`  
   - Set **Authentication** to use the same YouTube OAuth2 credentials.  
   - Connect `Loop Over Items` output to this node.

5. **Add Filtering Node:**  
   - Add **If** node named `If - Longer Than 3`.  
   - Use expression condition (JavaScript) that:  
     - Parses ISO 8601 duration string from `$json.items[0].contentDetails.duration`.  
     - Converts it to seconds.  
     - Checks if duration > 210 seconds (3 min 30 sec).  
   - Connect `HTTP - Find Video Data` output to `If - Longer Than 3`.

6. **Add Data Mapping Node:**  
   - Add **Set** node named `Field - Group Data`.  
   - Map fields from `$json.items[0]`:  
     - `id` = `{{$json.items[0].id}}`  
     - `viewCount` = `{{$json.items[0].statistics.viewCount}}`  
     - `likeCount` = `{{$json.items[0].statistics.likeCount}}`  
     - `commentCount` = `{{$json.items[0].statistics.commentCount}}`  
     - `description` = `{{$json.items[0].snippet.description}}`  
     - `title` = `{{$json.items[0].snippet.title}}`  
     - `channelTitle` = `{{$json.items[0].snippet.channelTitle}}`  
     - `tags` = `{{$json.items[0].snippet.tags.join(', ')}}`  
     - `channelId` = `{{$json.items[0].snippet.channelId}}`  
   - Connect **True** output of `If - Longer Than 3` to this node.

7. **Add Code Node to Save Data:**  
   - Add **Code** node named `Code - Save Data To Memory`.  
   - Set mode to `runOnceForEachItem`.  
   - Paste this JavaScript code:

     ```javascript
     const workflowStaticData = $getWorkflowStaticData('global');

     if (!workflowStaticData.lastExecution || typeof workflowStaticData.lastExecution.response !== 'string') {
       workflowStaticData.lastExecution = { response: '' };
     }

     const regexes = [
       { pattern: /https?:\/\/\S+|www\.\S+/g, replace: '' },
       { pattern: /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, replace: '' },
       { pattern: /[\r\n\\]+/g, replace: ' ' },
       { pattern: / {2,}/g, replace: ' ' }
     ];

     function sanitize(text) {
       return regexes.reduce((str, { pattern, replace }) => str.replace(pattern, replace), text).trim();
     }

     const item = { ...$input.item };
     if (item.description) {
       item.description = sanitize(item.description);
     }

     const sanitizedItem = sanitize(JSON.stringify(item));

     if (workflowStaticData.lastExecution.response) {
       workflowStaticData.lastExecution.response += ' ### NEXT VIDEO FOUND: ### ';
     }
     workflowStaticData.lastExecution.response += sanitizedItem;

     return workflowStaticData.lastExecution;
     ```

   - Connect `Field - Group Data` output to this node.

8. **Loop Back for Next Items:**  
   - Connect **Output** of `Code - Save Data To Memory` back to `Loop Over Items` input to continue batch processing.

9. **Add Code Node to Retrieve Aggregated Data:**  
   - Add **Code** node named `Code - Retrieve Data From Memory`.  
   - Paste this JavaScript code:

     ```javascript
     const workflowStaticData = $getWorkflowStaticData('global');
     const lastExecution = workflowStaticData.lastExecution;
     return lastExecution;
     ```

   - Connect `Loop Over Items` output (after batch completion) to this node.

10. **Add Final Output Node:**  
    - Add **Set** node named `Field - Response`.  
    - Set one field:  
      - Name: `response`  
      - Value: expression: `{{$input.all()}}` (stringify all input data)  
    - Connect `Code - Retrieve Data From Memory` output to this node.

11. **Optional:**  
    - Add a **Sticky Note** with project info and links as per original workflow for documentation.

12. **Finalize:**  
    - Save workflow, test by triggering from another workflow with JSON input containing `query.search_term`.  
    - Ensure YouTube OAuth2 credentials are properly configured and authorized.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                     | Context or Link                                                                                              |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| Project and community links for AgentCircle AI, including website, Discord, Facebook pages/groups, Gumroad, X (Twitter), YouTube, and Linkedin.                                 | Provided on Sticky Note node in workflow.                                                                   |
| Official website: https://www.agentcircle.ai/                                                                                                                                   | Project home page.                                                                                           |
| Discord invite: https://discord.com/invite/jySQ2PNm                                                                                                                             | Join the global community for support and updates.                                                         |
| Facebook Page: https://www.facebook.com/agentcircle/                                                                                                                             | Official Facebook presence.                                                                                  |
| Facebook Group: https://www.facebook.com/groups/aiagentcircle/                                                                                                                   | Community Facebook group for AI enthusiasts.                                                                |
| Gumroad Shop: http://agentcircle.gumroad.com/                                                                                                                                   | For paid resources and products.                                                                             |
| X (Twitter): https://x.com/agent_circle                                                                                                                                          | Social media updates and announcements.                                                                     |
| YouTube Channel: https://www.youtube.com/@agentcircle                                                                                                                           | Video tutorials and content.                                                                                  |
| Linkedin Profile: https://www.linkedin.com/company/agentcircle                                                                                                                   | Professional business page.                                                                                   |

---

**Disclaimer:**  
The text provided is exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly adheres to content policies and contains no illegal, offensive, or protected material. All data processed is legal and publicly available.