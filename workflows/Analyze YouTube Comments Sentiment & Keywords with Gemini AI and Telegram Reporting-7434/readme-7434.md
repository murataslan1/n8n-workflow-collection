Analyze YouTube Comments Sentiment & Keywords with Gemini AI and Telegram Reporting

https://n8nworkflows.xyz/workflows/analyze-youtube-comments-sentiment---keywords-with-gemini-ai-and-telegram-reporting-7434


# Analyze YouTube Comments Sentiment & Keywords with Gemini AI and Telegram Reporting

### 1. Workflow Overview

This workflow automates the process of analyzing YouTube comments for sentiment and keyword extraction using an LLM (Gemini AI via OpenRouter) and delivers summarized reports through Telegram. It is designed for content analysts, social media managers, or marketers who want to monitor audience feedback on YouTube videos listed in a Google Sheet. The workflow is structured into the following logical blocks:

- **1.1 Scheduled Trigger & Input Data Fetch**: Periodically triggers the workflow and fetches YouTube video data (video IDs and URLs) from a Google Sheet.
- **1.2 YouTube Comment Retrieval & Flattening**: For each video, calls the YouTube Data API to retrieve top-level comments, then flattens the API response into individual comment items.
- **1.3 AI Sentiment & Keyword Analysis**: Sends each comment’s text with metadata to the Gemini AI LLM to classify sentiment, score, keywords, and language. Parses and normalizes the LLM output.
- **1.4 Data Storage & Aggregation**: Appends or updates analyzed comment data back into Google Sheets and aggregates sentiment counts and keywords across all comments per video.
- **1.5 Reporting via Telegram**: Summarizes the aggregated data into a concise report and sends it to a configured Telegram chat.

The workflow includes multiple error handling considerations, batching for scalability, and strict JSON output parsing to ensure data consistency.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger & Input Data Fetch

- **Overview:**  
  This block initiates the workflow on a schedule, then reads video identifiers and URLs from a Google Sheet to process each video sequentially.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Get row(s) in sheet  
  - Youtube API Key

- **Node Details:**

  1. **Schedule Trigger**  
     - Type: `Schedule Trigger`  
     - Role: Starts the workflow at regular intervals (default daily, can be customized).  
     - Configuration: Runs at a specified interval (default empty placeholder, to be configured as needed).  
     - Inputs: None  
     - Outputs: Triggers `Get row(s) in sheet` node.  
     - Edge Cases: Misconfigured schedule or excessive frequency could cause quota exhaustion or rate limits.

  2. **Get row(s) in sheet**  
     - Type: `Google Sheets` (Read)  
     - Role: Reads rows from a configured Google Sheets document that contains the list of YouTube videos to analyze.  
     - Configuration: Requires `documentId` and `sheetName` to specify the exact sheet.  
     - Key Expressions: None directly; outputs rows containing `video_id`, `video_url`, and likely API key fields.  
     - Inputs: Triggered by Schedule Trigger.  
     - Outputs: Passes data to "Youtube API Key" node.  
     - Edge Cases: Sheet access issues, empty rows, or missing video IDs.

  3. **Youtube API Key**  
     - Type: `Set`  
     - Role: Adds the YouTube API key field to each item for downstream nodes.  
     - Configuration: Hardcoded string `"YOUR_YOUTUBE_API_KEY"` (should be replaced with a credential or environment variable).  
     - Inputs: Rows from Google Sheets.  
     - Outputs: Each item enriched with YouTube API Key, forwarded to batch processing.  
     - Edge Cases: Hardcoded key may lead to exposure risks; better to use n8n credentials. If key missing or invalid, YouTube API calls will fail.

---

#### 2.2 YouTube Comment Retrieval & Flattening

- **Overview:**  
  For each video, this block batches processing, fetches up to 100 top-level comments from YouTube API, and flattens the JSON response to individual comments with relevant metadata.

- **Nodes Involved:**  
  - Loop Over Items (splitInBatches)  
  - HTTP Request  
  - Code (flattening)  
  - No Operation, do nothing (placeholder for flow control)

- **Node Details:**

  1. **Loop Over Items**  
     - Type: `SplitInBatches`  
     - Role: Processes videos one by one or in batches to avoid API rate limits.  
     - Configuration: Default batch size.  
     - Inputs: Items including video_id and API key.  
     - Outputs: Two branches:  
       - One to "No Operation, do nothing" (unused path or fallback)  
       - One to "HTTP Request" to fetch comments.  
     - Edge Cases: Large numbers of videos may cause delays; batching helps but requires tuning.

  2. **HTTP Request**  
     - Type: `HTTP Request`  
     - Role: Calls YouTube Data API `commentThreads` endpoint to fetch top-level comments for the video.  
     - Configuration:  
       - URL constructed dynamically using video_id and API key from previous nodes.  
       - Request method: GET  
       - No pagination implemented (max 100 comments per video).  
     - Inputs: Video data from batch.  
     - Outputs: JSON response containing comments.  
     - Edge Cases: API quota limits, invalid video IDs, missing keys, network errors, malformed response.

  3. **Code (Flattening)**  
     - Type: `Code` (JavaScript)  
     - Role: Parses the YouTube API JSON response to extract one item per comment with fields: comment_id, video_id, author, text, like_count, published_at, author_channel_id, author_channel_url.  
     - Inputs: HTTP Request result.  
     - Outputs: List of comment items ready for AI processing.  
     - Edge Cases: Unexpected response structure, missing fields.  
     - Key expressions: Uses safe navigation and defaults to ensure no errors on missing data.

  4. **No Operation, do nothing**  
     - Type: `NoOp`  
     - Role: Placeholder node; no functional role, possibly for flow branching clarity.  
     - Inputs: Loop Over Items alternate path.  
     - Outputs: None.  
     - Edge Cases: None.

---

#### 2.3 AI Sentiment & Keyword Analysis

- **Overview:**  
  This block sends each comment’s text and metadata to an LLM model (Gemini AI via OpenRouter) for concise sentiment analysis and keyword extraction, then validates and normalizes the output JSON.

- **Nodes Involved:**  
  - OpenRouter Chat Model  
  - Basic LLM Chain  
  - Structured Output Parser  
  - Code1 (Normalization)

- **Node Details:**

  1. **OpenRouter Chat Model**  
     - Type: `Langchain LM Chat (OpenRouter)`  
     - Role: Sends prompt and message to Gemini 2.0 Flash model, retrieving AI-generated outputs.  
     - Configuration: Uses model `google/gemini-2.0-flash-exp:free`.  
     - Inputs: Comment text and like_count via prompt.  
     - Outputs: Raw LLM outputs for parsing.  
     - Edge Cases: API failures, rate limits, inconsistent output.

  2. **Basic LLM Chain**  
     - Type: `Langchain Chain`  
     - Role: Defines the prompt instructions for the AI, enforcing JSON-only output with specific keys (sentiment, score, keywords, language).  
     - Configuration: Includes detailed rules to normalize sentiment scale, keyword extraction, language codes, and spam handling.  
     - Inputs: Passes message to OpenRouter Chat Model.  
     - Outputs: Receives and forwards AI response to parser.  
     - Edge Cases: Prompt misinterpretation, malformed responses.

  3. **Structured Output Parser**  
     - Type: `Langchain Output Parser (Structured)`  
     - Role: Validates that the AI response strictly matches the expected JSON schema.  
     - Configuration: Uses example JSON schema as guide.  
     - Inputs: AI raw output from Basic LLM Chain.  
     - Outputs: Parsed JSON object.  
     - Edge Cases: Parsing failures or malformed AI responses.

  4. **Code1 (Normalization)**  
     - Type: `Code` (JavaScript)  
     - Role: Normalizes parsed JSON fields to safe and consistent formats for storage:  
       - Sentiment is forced to one of {positive, neutral, negative}  
       - Score clamped between -1 and 1  
       - Keywords filtered, trimmed, limited to 8  
       - Language code trimmed to two letters, default 'en'  
     - Inputs: Parsed LLM output.  
     - Outputs: Clean JSON for Google Sheets.  
     - Edge Cases: Missing or invalid fields, stringified JSON inside JSON.

---

#### 2.4 Data Storage & Aggregation

- **Overview:**  
  This block appends or updates each analyzed comment in Google Sheets, then aggregates sentiment counts and keyword frequencies across all comments for a video.

- **Nodes Involved:**  
  - Append or update row in sheet  
  - Aggregate  
  - Code2 (Summary)

- **Node Details:**

  1. **Append or update row in sheet**  
     - Type: `Google Sheets` (Write)  
     - Role: Inserts or updates rows in a Google Sheet containing comment metadata plus AI analysis results. Matching is done on `comment_id` to avoid duplicates.  
     - Configuration:  
       - Document ID and sheet name to be set.  
       - Columns mapped: author, keywords, video_id, sentiment, comment_id, like_count, comment_text, published_at, sentiment_score, author_channel_id, author_channel_url.  
     - Inputs: Normalized comment JSON from Code1.  
     - Outputs: Passes data to Aggregate node.  
     - Edge Cases: Sheet access errors, schema mismatches, concurrency issues.

  2. **Aggregate**  
     - Type: `Aggregate`  
     - Role: Aggregates arrays of `sentiment`, `sentiment_score`, and `keywords` across all input comments.  
     - Configuration: Aggregates these fields into arrays for summarization.  
     - Inputs: Data from Google Sheets append/update node.  
     - Outputs: Aggregated arrays forwarded to Code2.  
     - Edge Cases: Empty data sets, partial data.

  3. **Code2 (Summary)**  
     - Type: `Code` (JavaScript)  
     - Role: Summarizes aggregated arrays or individual items into counts and percentages of positive, neutral, and negative sentiments, and computes top 10 keywords with frequencies.  
     - Inputs: Aggregated data or raw items.  
     - Outputs: Summary JSON object with:  
       - total_comments  
       - positive, neutral, negative counts and percentages  
       - top_keywords as array of strings with counts  
     - Edge Cases: Handling empty arrays, inconsistent data formats.

---

#### 2.5 Reporting via Telegram

- **Overview:**  
  Final block sends the summary report to a Telegram chat, formatted with key metrics and top keywords.

- **Nodes Involved:**  
  - Send a text message

- **Node Details:**

  1. **Send a text message**  
     - Type: `Telegram`  
     - Role: Sends a formatted text message to a Telegram chat containing video URL, comment sentiment distribution, and top keywords.  
     - Configuration:  
       - `chatId` must be set to the target Telegram chat ID.  
       - Message template uses expressions to include summary data and video URL.  
       - Attribution disabled.  
     - Inputs: Summary JSON from Code2, video URL from Google Sheets node.  
     - Outputs: None.  
     - Edge Cases: Invalid chat ID, bot not authorized, network errors.

---

### 3. Summary Table

| Node Name                  | Node Type                         | Functional Role                               | Input Node(s)               | Output Node(s)               | Sticky Note                                                                                                                      |
|----------------------------|----------------------------------|-----------------------------------------------|-----------------------------|-----------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger           | Schedule Trigger                 | Initiates workflow at scheduled intervals     | None                        | Get row(s) in sheet          | - Run the workflow on a schedule.                                                                                               |
| Get row(s) in sheet        | Google Sheets                   | Reads video list from Google Sheet             | Schedule Trigger             | Youtube API Key              | - Fetch the data row that contains the video_id and video_url from the spreadsheet.                                              |
| Youtube API Key            | Set                            | Adds YouTube API key to each item              | Get row(s) in sheet          | Loop Over Items              | - Add a YouTube API key field so that subsequent records (HTTP requests to the YouTube API) can access it.                      |
| Loop Over Items            | SplitInBatches                 | Batch processing of videos                      | Youtube API Key              | No Operation, do nothing; HTTP Request | - Fetch data from the previous node and process it either one by one or in batches.                                               |
| No Operation, do nothing  | NoOp                           | Placeholder node, no operation                  | Loop Over Items              | None                        |                                                                                                                                  |
| HTTP Request              | HTTP Request                   | Calls YouTube API to get comments               | Loop Over Items              | Code                        | - Call the YouTube Data API endpoint.                                                                                           |
| Code                      | Code                           | Flattens API response into individual comments | HTTP Request                 | Basic LLM Chain              | - Receive the JSON results from the YouTube API and flatten the response so that each comment becomes a separate item.           |
| Basic LLM Chain           | Langchain Chain                | Sends prompt to LLM for sentiment & keywords  | Code                        | Code1                       | - Use the LLM model to analyze the comment text.                                                                                |
| OpenRouter Chat Model     | Langchain LM Chat (OpenRouter) | LLM model invocation (Gemini AI)                | Basic LLM Chain (ai_languageModel) | Basic LLM Chain             | - Use the LLM model to analyze the comment text.                                                                                |
| Structured Output Parser  | Langchain Output Parser         | Ensures strict JSON output format               | Basic LLM Chain (ai_outputParser) | Basic LLM Chain             | - Ensure the LLM output follows a strict JSON structure based on the example schema.                                             |
| Code1                     | Code                           | Normalizes LLM JSON output                       | Basic LLM Chain              | Append or update row in sheet | - Normalize the LLM JSON output.                                                                                                |
| Append or update row in sheet | Google Sheets               | Saves analyzed comment data                      | Code1                        | Aggregate                   | - Save the analysis results along with the comment metadata to Google Sheets.                                                    |
| Aggregate                 | Aggregate                      | Aggregates sentiments and keywords               | Append or update row in sheet | Code2                       | - Combine values from multiple comment analysis columns.                                                                        |
| Code2                     | Code                           | Summarizes sentiment counts and top keywords    | Aggregate                    | Send a text message         | - Create a summary based on the aggregated results.                                                                            |
| Send a text message       | Telegram                       | Sends report to Telegram chat                     | Code2                        | Loop Over Items             | - Send the summary report to a Telegram chat.                                                                                   |
| Sticky Note1              | Sticky Note                   | Documentation block - Full workflow description | None                        | None                        | See section 5 for full content.                                                                                                |
| Sticky Note               | Sticky Note                   | Documentation block - Scheduling and input       | None                        | None                        | See section 5 for full content.                                                                                                |
| Sticky Note2              | Sticky Note                   | Documentation block - Comment fetching and parsing | None                        | None                        | See section 5 for full content.                                                                                                |
| Sticky Note3              | Sticky Note                   | Documentation block - AI analysis and normalization | None                        | None                        | See section 5 for full content.                                                                                                |
| Sticky Note4              | Sticky Note                   | Documentation block - Aggregation and Telegram reporting | None                        | None                        | See section 5 for full content.                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a `Schedule Trigger` node**  
   - Set the desired interval to run the workflow (e.g., daily at a specific time).  
   - No inputs required.

2. **Add a `Google Sheets` node (Read operation)**  
   - Set credentials for Google Sheets OAuth2.  
   - Configure to read rows from the sheet containing YouTube video data.  
   - Specify `documentId` and `sheetName`.  
   - Output to next node.

3. **Add a `Set` node named "Youtube API Key"**  
   - Add a field named `Youtube API Key` with your actual YouTube Data API key as a string value.  
   - Connect from Google Sheets node.

4. **Add a `SplitInBatches` node named "Loop Over Items"**  
   - Connect from "Youtube API Key" node.  
   - Set batch size as needed (e.g., 1 for sequential processing).

5. **Add a `No Operation` (NoOp) node**  
   - Connect one output branch of "Loop Over Items" to this node (optional, for flow branching).

6. **Add an `HTTP Request` node**  
   - Connect the second output branch from "Loop Over Items" to this node.  
   - Configure as GET request.  
   - URL expression:  
     ```
     https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId={{ $json.video_id }}&maxResults=100&key={{ $json['Youtube API Key'] }}
     ```  
   - No authentication needed beyond API key in URL.

7. **Add a `Code` node to flatten YouTube API response**  
   - Connect from HTTP Request node.  
   - Paste the provided JavaScript code that extracts comment details into separate items.

8. **Add a `Langchain LM Chat (OpenRouter)` node**  
   - Connect from the Code node.  
   - Configure OpenRouter credentials and select model `google/gemini-2.0-flash-exp:free`.  
   - Set prompt messages according to the Basic LLM Chain node’s configuration.

9. **Add a `Langchain Chain` node named "Basic LLM Chain"**  
   - Connect to OpenRouter node’s language model input.  
   - Define prompt text and rules for AI to return strict JSON with sentiment, score, keywords, language.

10. **Add a `Langchain Output Parser (Structured)` node**  
    - Connect OpenRouter output to this parser node.  
    - Provide example JSON schema for validation.

11. **Add a `Code` node (Code1) for normalization**  
    - Connect from Basic LLM Chain node.  
    - Paste normalization JavaScript code to ensure consistent sentiment, score, keywords, language.

12. **Add a `Google Sheets` node (Write operation)**  
    - Configure credentials and set to append or update rows in the results sheet.  
    - Map columns for all comment metadata and AI analysis fields.  
    - Set matching columns to `comment_id`.  
    - Connect from Code1 node.

13. **Add an `Aggregate` node**  
    - Connect from Google Sheets write node.  
    - Configure to aggregate `sentiment`, `sentiment_score`, and `keywords` fields into arrays.

14. **Add a `Code` node (Code2) to summarize aggregated results**  
    - Connect from Aggregate node.  
    - Paste the provided JavaScript summarization code.

15. **Add a `Telegram` node**  
    - Connect from Code2 node.  
    - Configure Telegram Bot credentials and set target `chatId`.  
    - Configure text message template with placeholders for summary and video URL.

16. **Connect Telegram node’s output back to “Loop Over Items”**  
    - This allows continuous processing over batch items.

17. **Test the workflow with sample data**  
    - Ensure all credentials are properly set.  
    - Replace placeholder API keys and chat IDs with your actual values.  
    - Adjust Google Sheets document and sheet names accordingly.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Context or Link                                                                                                   |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| This workflow automatically retrieves comments from YouTube videos listed in Google Sheets, analyzes sentiment and keywords using an LLM, stores the results, then generates an aggregate summary and sends a report to Telegram. Key features include automated scheduling, Google Sheets integration, YouTube comment retrieval (up to 100 comments per video), AI sentiment and keyword analysis with strict JSON output validation, and Telegram reporting. Required credentials include Google Sheets OAuth2, YouTube Data API key, OpenRouter API key, and Telegram Bot API. Benefits include end-to-end automation, no duplication, data transparency, actionable insights, scalability, and cross-platform reporting. | See Sticky Note1 content in node "Sticky Note1" at position [-660,-400]                                         |
| - Run the workflow on a schedule. - Fetch the data row that contains the video_id and video_url from the spreadsheet. - Add a YouTube API key field so that subsequent records (HTTP requests to the YouTube API) can access it.                                                                                                                                                                                                                                                                                                                                                                               | See Sticky Note at position [-40,-220]                                                                            |
| - Fetch data from the previous node and process it either one by one or in batches. - Call the YouTube Data API endpoint. - Receive the JSON results from the YouTube API and flatten the response so that each comment becomes a separate item.                                                                                                                                                                                                                                                                                                                                                                   | See Sticky Note2 at position [660,-300]                                                                           |
| - Use the LLM model to analyze the comment text. - Ensure the LLM output follows a strict JSON structure based on the example schema, with no incorrect formats or keys. - Normalize the LLM JSON output. - Save the analysis results along with the comment metadata to Google Sheets.                                                                                                                                                                                                                                                                                                                        | See Sticky Note3 at position [1360,-80]                                                                            |
| - Combine values from multiple comment analysis columns. - Create a summary based on the aggregated results. - Send the summary report to a Telegram chat.                                                                                                                                                                                                                                                                                                                                                                                                                                               | See Sticky Note4 at position [2180,-80]                                                                            |

---

This documentation enables full understanding, modification, and accurate reconstruction of the "YouTube Comment Sentiment & Keyword Extractor" workflow using n8n, ensuring robust AI-powered social listening and reporting automation.