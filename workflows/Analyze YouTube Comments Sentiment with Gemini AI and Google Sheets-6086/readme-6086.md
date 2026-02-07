Analyze YouTube Comments Sentiment with Gemini AI and Google Sheets

https://n8nworkflows.xyz/workflows/analyze-youtube-comments-sentiment-with-gemini-ai-and-google-sheets-6086


# Analyze YouTube Comments Sentiment with Gemini AI and Google Sheets

### 1. Workflow Overview

This n8n workflow, titled **"YouTube - Audience Comment Analyzer"**, is designed to automate the extraction, sentiment analysis, and storage of YouTube video comments. It targets creators, social media managers, marketing teams, and agencies who want to understand audience sentiment beyond mere view counts.

The workflow consists of three main logical blocks:

- **1.1 Input Reception and Filtering**: Fetch video URLs marked as "Ready" from a Google Sheet and validate them.

- **1.2 Fetch YouTube Comments**: For each valid video URL, retrieve comments via the YouTube API, validate response success, and split comment data into individual entries.

- **1.3 Sentiment Analysis and Data Storage**: Analyze each comment's sentiment using Google Gemini AI, store the results back into a Google Sheet, and update the video URL status to "Finished" to avoid reprocessing.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Filtering

**Overview:**  
This block initiates the workflow by manually triggering the process. It retrieves video URLs marked as "Ready" from the "Video URLs" tab in a connected Google Sheet and filters out any empty or invalid URLs.

**Nodes Involved:**  
- When clicking ‘Test workflow’ (Manual Trigger)  
- Get Video URLs (Google Sheets)  
- Check If Video URL is Not Empty (If)

**Node Details:**

- **When clicking ‘Test workflow’**  
  - *Type:* Manual Trigger  
  - *Role:* Starts the workflow on user command (test or execution)  
  - *Configuration:* Default manual trigger, no parameters  
  - *Input:* None (trigger node)  
  - *Output:* Triggers "Get Video URLs" node  
  - *Edge cases:* None specific; user-dependent trigger

- **Get Video URLs**  
  - *Type:* Google Sheets Read  
  - *Role:* Fetch rows from the "Video URLs" tab where the "status" column equals "Ready"  
  - *Configuration:*  
    - Document ID: Connected Google Sheet unique ID  
    - Sheet Name: "Video URLs" tab  
    - Filter: status column = "Ready"  
  - *Input:* Manual trigger output  
  - *Output:* List of video URL rows with status "Ready"  
  - *Credentials:* Google Sheets OAuth2 credentials required  
  - *Edge cases:* Empty result if no videos marked "Ready"; permission or connectivity errors with Google Sheets

- **Check If Video URL is Not Empty**  
  - *Type:* If node  
  - *Role:* Validates that each video URL is not empty before proceeding  
  - *Configuration:* Checks if `video_url` field is not empty (loose type validation)  
  - *Input:* Output from "Get Video URLs"  
  - *Output:*  
    - True branch: continues with non-empty URLs  
    - False branch: filtered out; no further processing  
  - *Edge cases:* Empty or malformed URLs filtered out here

---

#### 2.2 Fetch YouTube Comments

**Overview:**  
This block loops over each valid video URL, makes an authenticated request to the YouTube API to fetch comments, verifies the response, and splits the comment data into individual items for further processing.

**Nodes Involved:**  
- Loop Over Items (SplitInBatches)  
- HTTP Request - Get Comments  
- Check If - Success Response (If)  
- Split Out (SplitOut)  

**Node Details:**

- **Loop Over Items**  
  - *Type:* SplitInBatches  
  - *Role:* Processes video URLs one at a time to handle API requests sequentially and avoid rate limits  
  - *Configuration:* Default batching options (processes one item per batch)  
  - *Input:* True branch from "Check If Video URL is Not Empty"  
  - *Output:* Passes video URL per batch to "HTTP Request - Get Comments"  
  - *Edge cases:* Potential delays with large lists; batch size configurable

- **HTTP Request - Get Comments**  
  - *Type:* HTTP Request  
  - *Role:* Calls YouTube API endpoint `commentThreads` to fetch comments for the given video ID  
  - *Configuration:*  
    - Method: GET  
    - URL: `https://www.googleapis.com/youtube/v3/commentThreads`  
    - Query Parameters:  
      - part=snippet  
      - videoId extracted dynamically from video_url using regex  
      - limit=100  
    - Authentication: OAuth2 (YouTube API credentials)  
    - Pagination: Handles multiple pages using `pageToken` until no nextPageToken  
  - *Input:* Current video URL from loop  
  - *Output:* API response with comment threads  
  - *Credentials:* YouTube OAuth2 API credentials required  
  - *Edge cases:* API rate limits, invalid video IDs, authentication errors, empty comments, network timeouts

- **Check If - Success Response**  
  - *Type:* If  
  - *Role:* Verifies the HTTP status code equals 200 (success)  
  - *Configuration:* Compares `statusCode` in response to 200  
  - *Input:* Response from YouTube HTTP Request  
  - *Output:*  
    - True branch: proceeds to split comments  
    - False branch: stops or error handling (not explicitly shown)  
  - *Edge cases:* Non-200 responses due to quota exceeded, invalid requests, or network issues

- **Split Out**  
  - *Type:* SplitOut  
  - *Role:* Extracts and splits `body.items` (comment threads) into individual comment items for analysis  
  - *Configuration:* Splits based on `body.items` field  
  - *Input:* Success response branch from "Check If - Success Response"  
  - *Output:* Individual comment objects sent downstream  
  - *Edge cases:* Empty or missing `items` array (handled downstream)

---

#### 2.3 Sentiment Analysis and Data Storage

**Overview:**  
This final block checks if comments exist, analyzes each comment’s sentiment using the Google Gemini AI chat model, appends or updates the analyzed data into the "Results" tab in Google Sheets, and updates the original video URL’s status to "Finished".

**Nodes Involved:**  
- Check If - Comment Exists (If)  
- Google Gemini Chat Model  
- AI Agent - Analyze Sentiment Of Every Comment  
- Insert Comment Data & Analysis (Google Sheets)  
- Update Video Status (Google Sheets)

**Node Details:**

- **Check If - Comment Exists**  
  - *Type:* If  
  - *Role:* Checks if the `snippet.videoId` field exists in the comment data, indicating comments are present  
  - *Configuration:* Checks existence of `snippet.videoId`  
  - *Input:* Output of "Split Out" (individual comments)  
  - *Output:*  
    - True branch: proceeds to sentiment analysis  
    - False branch: triggers update of video status to "Finished" immediately  
  - *Edge cases:* Videos with no comments skip analysis and directly update status

- **Google Gemini Chat Model**  
  - *Type:* Langchain AI Language Model Node  
  - *Role:* Connects to Google Gemini AI for conversation/chat-based sentiment analysis  
  - *Configuration:*  
    - Model Name: `models/gemini-2.0-flash`  
    - No additional options configured  
  - *Input:* Feeds the comment text from "AI Agent - Analyze Sentiment Of Every Comment"  
  - *Credentials:* Google PaLM API credentials required  
  - *Edge cases:* API quota limits, authentication failures, response timeouts

- **AI Agent - Analyze Sentiment Of Every Comment**  
  - *Type:* Langchain Sentiment Analysis Node  
  - *Role:* Uses the Google Gemini Chat Model to classify comment text sentiment as Positive, Neutral, or Negative  
  - *Configuration:*  
    - Categories: Positive, Neutral, Negative  
    - System Prompt: Custom prompt instructing the model to output exactly one JSON object with the sentiment classification  
    - Input Text: The original comment text (`snippet.topLevelComment.snippet.textOriginal`)  
  - *Input:* Output from "Google Gemini Chat Model" node  
  - *Output:* Sentiment classification attached to comment data  
  - *Edge cases:* Model misunderstanding prompt, malformed response, or API errors

- **Insert Comment Data & Analysis**  
  - *Type:* Google Sheets Append or Update  
  - *Role:* Saves each comment along with its metadata and sentiment classification into the "Results" tab of the Google Sheet  
  - *Configuration:*  
    - Mapping:  
      - video_url  
      - comment_id (used as key for update)  
      - comment text  
      - author_name  
      - likes count  
      - reply count  
      - sentiment category from AI analysis  
      - published_at date/time formatted  
    - Operation: Append or update by `comment_id`  
    - Sheet Name: "Results" tab (gid=0)  
  - *Input:* Sentiment-analyzed comment data  
  - *Credentials:* Google Sheets OAuth2  
  - *Edge cases:* Duplicate comment IDs, Google Sheets API quota or permission errors

- **Update Video Status**  
  - *Type:* Google Sheets Update  
  - *Role:* Updates the status of the processed video URL in the "Video URLs" tab to "Finished" and logs the last fetched time  
  - *Configuration:*  
    - Match by `row_number` to update correct row  
    - Fields updated:  
      - status = "Finished"  
      - last_fetched_time = current timestamp (ISO formatted, converted to local time format)  
    - Sheet Name: "Video URLs" tab (gid=426418282)  
  - *Input:* Triggered after comment processing or if no comments found  
  - *Credentials:* Google Sheets OAuth2  
  - *Edge cases:* Sheet lock conflicts, incorrect row matching, permission issues

---

### 3. Summary Table

| Node Name                         | Node Type                          | Functional Role                                | Input Node(s)                  | Output Node(s)                        | Sticky Note                                                                                                                              |
|----------------------------------|----------------------------------|-----------------------------------------------|-------------------------------|-------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’     | Manual Trigger                   | Starts the workflow manually                   | None                          | Get Video URLs                      |                                                                                                                                          |
| Get Video URLs                   | Google Sheets                    | Fetches video URLs marked "Ready"              | When clicking ‘Test workflow’  | Check If Video URL is Not Empty     | ## 1. Read Ready Video URLs - The workflow begins by pulling all the rows marked as **Ready** in **Column A** from the **Video URLs** tab. |
| Check If Video URL is Not Empty  | If                              | Filters out empty video URLs                    | Get Video URLs                 | Loop Over Items                     | ## 1. Read Ready Video URLs - The workflow begins by pulling all the rows marked as **Ready** in **Column A** from the **Video URLs** tab. |
| Loop Over Items                  | SplitInBatches                  | Processes video URLs one at a time              | Check If Video URL is Not Empty | HTTP Request - Get Comments         | ## 2. Fetch Comments Via YouTube API - Loops through each valid video URL to fetch comments via YouTube API.                              |
| HTTP Request - Get Comments      | HTTP Request                    | Fetches YouTube comments for each video URL    | Loop Over Items                | Check If - Success Response         | ## 2. Fetch Comments Via YouTube API - Sends GET request to YouTube API to retrieve comments.                                             |
| Check If - Success Response      | If                              | Checks if YouTube API response is successful   | HTTP Request - Get Comments    | Split Out                         | ## 2. Fetch Comments Via YouTube API - Checks response success before processing.                                                         |
| Split Out                       | SplitOut                       | Splits comment threads into individual comments | Check If - Success Response    | Check If - Comment Exists           | ## 2. Fetch Comments Via YouTube API - Splits comment data for analysis.                                                                  |
| Check If - Comment Exists        | If                              | Determines if comments exist for the video     | Split Out                     | AI Agent - Analyze Sentiment Of Every Comment (True) / Update Video Status (False) | ## 3. Analyze Comment Sentiment, Update Results And Video Status - Checks if comments exist to proceed with sentiment analysis or update status. |
| Google Gemini Chat Model         | Langchain AI Model              | Connects to Google Gemini AI for chat-based sentiment analysis | AI Agent - Analyze Sentiment Of Every Comment | AI Agent - Analyze Sentiment Of Every Comment | ## 3. Analyze Comment Sentiment, Update Results And Video Status - Uses Google Gemini for sentiment classification.                      |
| AI Agent - Analyze Sentiment Of Every Comment | Langchain Sentiment Analysis | Analyzes comment sentiment (Positive, Neutral, Negative) | Google Gemini Chat Model       | Insert Comment Data & Analysis      | ## 3. Analyze Comment Sentiment, Update Results And Video Status - Classifies sentiment of each comment.                                  |
| Insert Comment Data & Analysis   | Google Sheets                  | Stores analyzed comment data into "Results" tab | AI Agent - Analyze Sentiment Of Every Comment | Update Video Status               | ## 3. Analyze Comment Sentiment, Update Results And Video Status - Saves sentiment results and comment metadata.                         |
| Update Video Status              | Google Sheets                  | Marks video URL status as "Finished" to avoid reprocessing | Check If - Comment Exists (False) / Insert Comment Data & Analysis | Loop Over Items                 | ## 3. Analyze Comment Sentiment, Update Results And Video Status - Updates video processing status to "Finished".                         |
| Sticky Note                     | Sticky Note                    | Documentation and instructions                  | None                          | None                              | ## [n8n Automation] YouTube Comments Analyzer - Try It Out! (Detailed workflow description and setup instructions)                       |
| Sticky Note1                    | Sticky Note                    | Documentation for block 1                        | None                          | None                              | ## 1. Read Ready Video URLs - Explanation of initial data fetch step.                                                                      |
| Sticky Note2                    | Sticky Note                    | Documentation for block 2                        | None                          | None                              | ## 2. Fetch Comments Via YouTube API - Explanation of comments fetch and splitting.                                                       |
| Sticky Note3                    | Sticky Note                    | Documentation for block 3                        | None                          | None                              | ## 3. Analyze Comment Sentiment, Update Results And Video Status - Explanation of sentiment analysis and data storage.                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node** named "When clicking ‘Test workflow’" to manually start the workflow.

2. **Add a Google Sheets node** named "Get Video URLs" configured to:
   - Operation: Read rows.
   - Document ID: Your connected Google Sheet for this project.
   - Sheet Name: "Video URLs".
   - Filter: Only rows where the "status" column equals "Ready".
   - Connect credentials for Google Sheets OAuth2.
   - Connect output to the next node.

3. **Add an If node** named "Check If Video URL is Not Empty":
   - Condition: `video_url` field is not empty (string, not empty).
   - Use loose type validation.
   - Connect input from "Get Video URLs".
   - True branch output connects to the next node.

4. **Add a SplitInBatches node** named "Loop Over Items":
   - Purpose: to process each video URL one by one.
   - Default batch size (1).
   - Connect input from the True branch of the previous If node.

5. **Add an HTTP Request node** named "HTTP Request - Get Comments":
   - Method: GET.
   - URL: `https://www.googleapis.com/youtube/v3/commentThreads`.
   - Query parameters:  
     - `part=snippet`  
     - `videoId` extracted dynamically from `video_url` using regex: `={{ $json.video_url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/)[1] || '' }}`  
     - `limit=100`.
   - Authentication: Set to YouTube OAuth2 credentials (YouTube API with proper scopes).
   - Enable pagination by `pageToken` until no nextPageToken.
   - Connect input from "Loop Over Items".

6. **Add an If node** named "Check If - Success Response":
   - Condition: `statusCode` equals 200.
   - Connect input from "HTTP Request - Get Comments".
   - True branch connects to next node.

7. **Add a SplitOut node** named "Split Out":
   - Split field: `body.items` (comment threads).
   - Connect input from True branch of "Check If - Success Response".

8. **Add an If node** named "Check If - Comment Exists":
   - Condition: `snippet.videoId` exists (string exists).
   - Connect input from "Split Out".
   - True branch proceeds to sentiment analysis.
   - False branch connects to "Update Video Status" node (step 14).

9. **Add a Langchain Google Gemini Chat Model node** named "Google Gemini Chat Model":
   - Model Name: `models/gemini-2.0-flash`.
   - Credentials: Google PaLM API credentials for Gemini.
   - Connect input from the True branch of "Check If - Comment Exists".

10. **Add a Langchain Sentiment Analysis node** named "AI Agent - Analyze Sentiment Of Every Comment":
    - Categories: Positive, Neutral, Negative.
    - System prompt: "You are a highly intelligent and precise sentiment analysis system... Respond with exactly one JSON object and nothing else."
    - Input Text: `={{ $json.snippet.topLevelComment.snippet.textOriginal }}`.
    - Connect input from "Google Gemini Chat Model".

11. **Add a Google Sheets node** named "Insert Comment Data & Analysis":
    - Operation: Append or Update.
    - Document ID: same Google Sheet.
    - Sheet Name: "Results" tab (gid=0).
    - Mapping columns:  
      - video_url: `"=https://www.youtube.com/watch?v={{ $json.snippet.videoId }}"`  
      - comment_id: `snippet.topLevelComment.id` (unique key)  
      - comment: `snippet.topLevelComment.snippet.textOriginal`  
      - author_name: `snippet.topLevelComment.snippet.authorDisplayName`  
      - likes: `snippet.topLevelComment.snippet.likeCount`  
      - reply: `snippet.totalReplyCount`  
      - sentiment: `sentimentAnalysis.category` (from AI analysis)  
      - published_at: formatted date/time from `snippet.topLevelComment.snippet.publishedAt`  
    - Credentials: Google Sheets OAuth2.
    - Connect input from "AI Agent - Analyze Sentiment Of Every Comment".

12. **Connect the output of "Insert Comment Data & Analysis" to "Update Video Status" node.**

13. **Add a Google Sheets node** named "Update Video Status":
    - Operation: Update row.
    - Document ID: same Google Sheet.
    - Sheet Name: "Video URLs" tab (gid=426418282).
    - Match column: `row_number` to identify row to update.
    - Update fields:  
      - status = "Finished"  
      - last_fetched_time = current timestamp formatted as `YYYY-MM-DD HH:mm:ss`.
    - Credentials: Google Sheets OAuth2.
    - Connect inputs:  
      - From False branch of "Check If - Comment Exists" (for videos without comments)  
      - From "Insert Comment Data & Analysis" (after comment processing).

14. **Connect output of "Update Video Status" to the "Loop Over Items" node's second output to continue looping.**

15. **Add appropriate sticky notes** for user guidance and documentation inside the workflow canvas.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Context or Link                                                                                                          |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| This workflow demonstrates automated YouTube comment extraction and sentiment analysis using Google Gemini AI and Google Sheets integration. It is ideal for creators, marketers, and social media professionals aiming to understand audience feedback comprehensively.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Overview of workflow purpose                                                                                              |
| Setup requires Google Cloud Console configuration with OAuth or API key methods enabled for YouTube API, Google Sheets API, and Google Gemini AI access. Credentials must be correctly configured in n8n nodes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Credentials and API setup requirements                                                                                     |
| To automate beyond manual triggers, consider adding a Google Sheets trigger node that watches for new "Ready" entries in the "Video URLs" tab and triggers the workflow automatically.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Automation enhancement suggestion                                                                                          |
| The AI sentiment categories and prompt are customizable inside the "AI Agent - Analyze Sentiment Of Every Comment" node. You can swap the AI model or adjust categories to tailor to specific needs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Customization advice                                                                                                       |
| For assistance, customization, or tailored AI agent development, visit Agent Circle community and resources:  
Website: https://www.agentcircle.ai/  
Discord: https://discord.gg/d8SkCzKwnP  
YouTube: https://www.youtube.com/@agentcircle  
LinkedIn: https://www.linkedin.com/company/agentcircle                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Support and community resources                                                                                            |
| Workflow template Google Sheet (required): https://docs.google.com/spreadsheets/d/18-3CmJPbC73MycmNiSWotdsyGBAAzqESf33vktwnYmM/edit?usp=drivesdk                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Google Sheet template for video URLs and results                                                                           |

---

**Disclaimer:**  
The provided text originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This process complies strictly with applicable content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.