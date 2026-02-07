Auto-upload Instagram Videos to YouTube with GPT-4o and Google Sheets Tracking

https://n8nworkflows.xyz/workflows/auto-upload-instagram-videos-to-youtube-with-gpt-4o-and-google-sheets-tracking-11830


# Auto-upload Instagram Videos to YouTube with GPT-4o and Google Sheets Tracking

### 1. Workflow Overview

This workflow automates the process of uploading Instagram videos to YouTube by leveraging AI-generated titles and descriptions, while tracking uploads in Google Sheets. It is designed to run on a schedule (every 6 hours), fetch recent Instagram media, filter and process videos published on the current day, generate optimized metadata using GPT-4o (OpenAI’s language model), upload videos to YouTube, and log the upload status for tracking.

The workflow’s logic is divided into the following functional blocks:

- **1.1 Scheduled Trigger & Instagram Media Fetching:** Periodically fetches Instagram videos posted today.
- **1.2 Video Filtering & Batch Processing:** Filters videos to today’s date and processes them one by one.
- **1.3 Upload Status Check & Deduplication:** Checks Google Sheets to skip already uploaded videos.
- **1.4 AI Metadata Generation:** Generates YouTube video titles and tags using GPT-4o with LangChain nodes.
- **1.5 Video Download & Upload to YouTube:** Downloads Instagram videos and uploads them to YouTube.
- **1.6 Logging & Tracking:** Logs successful uploads to Google Sheets for future reference.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger & Instagram Media Fetching

- **Overview:** This block initiates the workflow every 6 hours, fetching Instagram media using Facebook Graph API.
- **Nodes Involved:**  
  - Schedule Every 6 Hours  
  - Fetch Instagram Media  
  - Split Media Items  

- **Node Details:**

  - **Schedule Every 6 Hours**  
    - Type: Schedule Trigger  
    - Role: Starts workflow execution every 6 hours automatically.  
    - Config: Default trigger interval set to 6 hours.  
    - Inputs: None  
    - Outputs: Triggers "Fetch Instagram Media" node.  
    - Edge Cases: May trigger during Instagram API downtime; no retries configured.

  - **Fetch Instagram Media**  
    - Type: Facebook Graph API  
    - Role: Retrieves Instagram media posts via Facebook Graph API integration.  
    - Config: Uses Instagram Business account credentials connected via Facebook Graph API node credentials.  
    - Inputs: Trigger from schedule node.  
    - Outputs: Passes media array to "Split Media Items."  
    - Edge Cases: API rate limits or permission errors; handle with credential refresh or error catch.

  - **Split Media Items**  
    - Type: Split Out  
    - Role: Splits the array of media items into individual items for separate processing.  
    - Config: Default split mode set to output each item as one message.  
    - Inputs: Media array from previous node.  
    - Outputs: Sends single media items to "Filter Today's Videos."  
    - Edge Cases: Empty media array leads to no downstream executions.

---

#### 1.2 Video Filtering & Batch Processing

- **Overview:** Filters media items posted today and processes them sequentially in batches.
- **Nodes Involved:**  
  - Filter Today's Videos (IF node)  
  - Process Videos One by One (Split In Batches)  

- **Node Details:**

  - **Filter Today's Videos**  
    - Type: IF  
    - Role: Filters media items based on published date matching current date.  
    - Config: Expression compares media timestamp with today’s date.  
    - Inputs: Single media item from "Split Media Items."  
    - Outputs: True branch to batch processing; false branch discards item.  
    - Edge Cases: Timezone differences may cause mismatches; ensure date normalization.

  - **Process Videos One by One**  
    - Type: Split In Batches  
    - Role: Processes each selected video individually to manage rate limits and resource usage.  
    - Config: Batch size set to 1 for sequential processing.  
    - Inputs: Filtered media items.  
    - Outputs: Sends each video to "Get Already Uploaded Videos" on second output (for deduplication) or forward processing.  
    - Edge Cases: Large batch size could overwhelm APIs; batch size 1 is safe default.

---

#### 1.3 Upload Status Check & Deduplication

- **Overview:** Checks Google Sheets for previously uploaded videos to avoid duplicate uploads.
- **Nodes Involved:**  
  - Get Already Uploaded Videos (Google Sheets)  
  - Check Upload Status (Code node)  
  - Skip If Already Uploaded (IF node)  

- **Node Details:**

  - **Get Already Uploaded Videos**  
    - Type: Google Sheets (Read)  
    - Role: Reads existing uploaded video records from a dedicated Google Sheet.  
    - Config: Spreadsheet ID and sheet name configured to match tracking sheet. Reads all rows or relevant columns.  
    - Inputs: Triggered from batch processing node.  
    - Outputs: Passes existing video list to "Check Upload Status."  
    - Edge Cases: API quota limits, invalid sheet ID or permissions, empty sheet.

  - **Check Upload Status**  
    - Type: Code (JavaScript)  
    - Role: Checks if the current Instagram video ID is already present in the sheet data.  
    - Config: Script compares current video ID against rows fetched.  
    - Inputs: Current video data + list of uploaded videos.  
    - Outputs: Boolean flag to "Skip If Already Uploaded."  
    - Edge Cases: Code errors on unexpected data structure; validate inputs.

  - **Skip If Already Uploaded**  
    - Type: IF  
    - Role: Decides to skip metadata generation and upload if video was already uploaded.  
    - Config: Evaluates boolean from previous node.  
    - Inputs: Upload status boolean.  
    - Outputs: True branch skips to next video; false branch continues workflow for processing.  
    - Edge Cases: Incorrect flag could cause duplicate uploads or missed uploads.

---

#### 1.4 AI Metadata Generation

- **Overview:** Uses OpenAI GPT-4o via LangChain nodes to generate optimized titles and tags for YouTube uploads.
- **Nodes Involved:**  
  - Generate Title and Tags (LangChain Agent)  
  - OpenAI Chat Model (Language Model Node)  
  - Simple Memory (Memory Buffer Window)  
  - Structured Output Parser  

- **Node Details:**

  - **Generate Title and Tags**  
    - Type: LangChain Agent  
    - Role: Coordinates the AI prompt workflow to generate video metadata.  
    - Config: Connected to memory, language model, and output parser nodes.  
    - Inputs: Receives video info for context.  
    - Outputs: Structured metadata to "Format Metadata."  
    - Edge Cases: API timeout, malformed responses, token limits.

  - **OpenAI Chat Model**  
    - Type: LangChain OpenAI Chat Model  
    - Role: Executes GPT-4o model calls with prompt inputs.  
    - Config: Uses OpenAI API credentials with GPT-4o model selected.  
    - Inputs: Prompts from Agent node.  
    - Outputs: Raw AI response to output parser.  
    - Edge Cases: Auth errors, rate limits, unexpected API response format.

  - **Simple Memory**  
    - Type: LangChain memory buffer window  
    - Role: Maintains short conversational context window for the AI agent.  
    - Config: Configured with window size to keep recent messages.  
    - Inputs: Conversation data.  
    - Outputs: Memory to Agent node.  
    - Edge Cases: Overflow or memory corruption could cause context loss.

  - **Structured Output Parser**  
    - Type: LangChain Output Parser Structured  
    - Role: Parses AI response into structured JSON format for easy downstream processing.  
    - Config: Expected output schema defined for title and tags.  
    - Inputs: Raw AI text from Chat Model.  
    - Outputs: Parsed metadata to Agent node.  
    - Edge Cases: Parsing failures if AI format changes.

---

#### 1.5 Video Download & Upload to YouTube

- **Overview:** Downloads the selected Instagram video and uploads it to YouTube with the generated metadata.
- **Nodes Involved:**  
  - Format Metadata (Set)  
  - Download Instagram Video (HTTP Request)  
  - Wait 3 Seconds (Wait Node)  
  - Upload to YouTube  

- **Node Details:**

  - **Format Metadata**  
    - Type: Set  
    - Role: Prepares and formats video metadata (title, description, tags) for YouTube upload.  
    - Config: Sets fields from AI-generated structured output and video info.  
    - Inputs: AI metadata and video info.  
    - Outputs: Passes formatted metadata to download node.  
    - Edge Cases: Missing or invalid metadata fields.

  - **Download Instagram Video**  
    - Type: HTTP Request  
    - Role: Downloads video file from Instagram video URL.  
    - Config: GET request to Instagram media URL with authentication headers if needed.  
    - Inputs: Video metadata with download URL.  
    - Outputs: Binary video data to "Wait 3 Seconds."  
    - Edge Cases: Download failures, URL expiry, network timeouts.

  - **Wait 3 Seconds**  
    - Type: Wait  
    - Role: Pauses execution for 3 seconds to avoid rate limits or timing issues.  
    - Config: Fixed 3-second delay.  
    - Inputs: Video binary data.  
    - Outputs: Passes data to upload node.  
    - Edge Cases: None significant; can be adjusted for timing.

  - **Upload to YouTube**  
    - Type: YouTube Node  
    - Role: Uploads video to YouTube channel with metadata.  
    - Config: Uses OAuth2 credentials for YouTube API; uploads video file with title, description, tags.  
    - Inputs: Video binary and metadata.  
    - Outputs: Upload success info to logging.  
    - Edge Cases: Upload failures, quota limits, auth token expiry.

---

#### 1.6 Logging & Tracking

- **Overview:** Logs uploaded video details into Google Sheets for tracking and future deduplication.
- **Nodes Involved:**  
  - Log Upload to Sheet (Google Sheets)  

- **Node Details:**

  - **Log Upload to Sheet**  
    - Type: Google Sheets (Write)  
    - Role: Appends a new row with video upload metadata (Instagram ID, YouTube URL, timestamp).  
    - Config: Spreadsheet ID and sheet name configured to track uploads.  
    - Inputs: Upload success data from "Upload to YouTube."  
    - Outputs: Loops back to "Process Videos One by One" for next item.  
    - Edge Cases: Write failures, API quota, data format mismatches.

---

### 3. Summary Table

| Node Name                  | Node Type                               | Functional Role                         | Input Node(s)                  | Output Node(s)                  | Sticky Note |
|----------------------------|----------------------------------------|---------------------------------------|-------------------------------|-------------------------------|-------------|
| Schedule Every 6 Hours      | Schedule Trigger                       | Initiates workflow periodically       | None                          | Fetch Instagram Media          |             |
| Fetch Instagram Media       | Facebook Graph API                     | Retrieves Instagram media posts       | Schedule Every 6 Hours         | Split Media Items              |             |
| Split Media Items           | Split Out                             | Splits media array into single items  | Fetch Instagram Media          | Filter Today's Videos          |             |
| Filter Today's Videos       | IF                                    | Filters videos posted today            | Split Media Items              | Process Videos One by One      |             |
| Process Videos One by One   | Split In Batches                      | Processes videos sequentially          | Filter Today's Videos          | Get Already Uploaded Videos, Generate Title and Tags |             |
| Get Already Uploaded Videos | Google Sheets (Read)                  | Retrieves list of uploaded videos     | Process Videos One by One (2nd output) | Check Upload Status          |             |
| Check Upload Status         | Code                                 | Checks if video is already uploaded   | Get Already Uploaded Videos    | Skip If Already Uploaded       |             |
| Skip If Already Uploaded    | IF                                    | Skips upload if video exists           | Check Upload Status            | Generate Title and Tags, Process Videos One by One |             |
| Generate Title and Tags     | LangChain Agent                      | Generates AI metadata (title, tags)   | Skip If Already Uploaded (false branch) | Format Metadata              |             |
| OpenAI Chat Model           | LangChain OpenAI Chat Model          | Runs GPT-4o model for generation      | Generate Title and Tags        | Structured Output Parser       |             |
| Simple Memory               | LangChain Memory Buffer Window       | Maintains AI conversational context   | Generate Title and Tags        | Generate Title and Tags        |             |
| Structured Output Parser    | LangChain Output Parser Structured   | Parses AI response into JSON          | OpenAI Chat Model             | Generate Title and Tags        |             |
| Format Metadata            | Set                                  | Formats video metadata for upload     | Generate Title and Tags        | Download Instagram Video       |             |
| Download Instagram Video    | HTTP Request                        | Downloads video from Instagram URL    | Format Metadata               | Wait 3 Seconds                |             |
| Wait 3 Seconds             | Wait                                 | Delays execution by 3 seconds         | Download Instagram Video       | Upload to YouTube             |             |
| Upload to YouTube           | YouTube                              | Uploads video with metadata            | Wait 3 Seconds                | Log Upload to Sheet            |             |
| Log Upload to Sheet         | Google Sheets (Write)                 | Logs upload info for tracking         | Upload to YouTube             | Process Videos One by One      |             |
| Sticky Note                | Sticky Note                          | Visual notes                          | None                          | None                          |             |
| Sticky Note1               | Sticky Note                          | Visual notes                          | None                          | None                          |             |
| Sticky Note2               | Sticky Note                          | Visual notes                          | None                          | None                          |             |
| Sticky Note3               | Sticky Note                          | Visual notes                          | None                          | None                          |             |
| Sticky Note4               | Sticky Note                          | Visual notes                          | None                          | None                          |             |
| Sticky Note5               | Sticky Note                          | Visual notes                          | None                          | None                          |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Configure to run every 6 hours (e.g., 0 0/6 * * *).  
   - No credentials needed.

2. **Add Facebook Graph API Node**  
   - Type: Facebook Graph API  
   - Configure credentials for Facebook Graph API with access to Instagram Business account.  
   - Set API call to fetch Instagram media posts (e.g., `/me/media?fields=id,media_url,timestamp`).  
   - Connect Schedule Trigger output to this node.

3. **Add Split Out Node**  
   - Type: Split Out  
   - Set to split the media array from Facebook Graph API node into individual items.  
   - Connect output of Facebook Graph API node to this node.

4. **Add IF Node to Filter Today's Videos**  
   - Type: IF  
   - Configure condition to check if the media item’s `timestamp` matches today’s date (consider timezone).  
   - Connect Split Out node output to this IF node.

5. **Add Split In Batches Node**  
   - Type: Split In Batches  
   - Set batch size to 1 for sequential processing.  
   - Connect IF node’s "true" output to this node.

6. **Add Google Sheets Node (Read)**  
   - Type: Google Sheets (Read)  
   - Configure with Google Sheets credentials.  
   - Set Spreadsheet ID and sheet name where uploaded video records are stored.  
   - Connect second output of Split In Batches node (empty batch output) to this node for deduplication data retrieval.

7. **Add Code Node**  
   - Type: Code  
   - Write JavaScript to check if current Instagram video ID exists in Google Sheets data.  
   - Inputs: Current video ID and sheet data.  
   - Outputs: Boolean flag indicating presence.  
   - Connect Google Sheets node output to Code node.

8. **Add IF Node to Skip Already Uploaded Videos**  
   - Type: IF  
   - Configure to check boolean from Code node.  
   - True branch skips to next batch (connect back to Split In Batches node).  
   - False branch continues to AI metadata generation.

9. **Add LangChain Agent Node**  
   - Type: LangChain Agent  
   - Configure to generate title and tags based on video info.  
   - Connect False output of skip IF node to this node.

10. **Add LangChain OpenAI Chat Model Node**  
    - Type: LangChain OpenAI Chat Model  
    - Configure with OpenAI API credentials (GPT-4o model).  
    - Connect Agent node AI language model input to this node.

11. **Add LangChain Memory Buffer Window Node**  
    - Type: LangChain Memory Buffer Window  
    - Set window size to maintain conversational context for AI.  
    - Connect Agent node memory input to this node.

12. **Add LangChain Structured Output Parser Node**  
    - Type: LangChain Output Parser Structured  
    - Define expected JSON schema for title and tags.  
    - Connect OpenAI Chat Model output to this node and output to Agent node.

13. **Add Set Node to Format Metadata**  
    - Type: Set  
    - Map AI-generated title, description, tags, and video URL into fields for YouTube upload.  
    - Connect Agent node output to this node.

14. **Add HTTP Request Node to Download Instagram Video**  
    - Type: HTTP Request  
    - Configure GET request to download video from Instagram media URL.  
    - Connect Set node output to this node.

15. **Add Wait Node**  
    - Type: Wait  
    - Set fixed wait time to 3 seconds.  
    - Connect HTTP Request output to this node.

16. **Add YouTube Node to Upload Video**  
    - Type: YouTube  
    - Configure OAuth2 credentials for YouTube API.  
    - Set video upload parameters (title, description, tags, binary video).  
    - Connect Wait node output to this node.

17. **Add Google Sheets Node (Write)**  
    - Type: Google Sheets (Write)  
    - Configure to append upload record (Instagram ID, YouTube URL, timestamp).  
    - Connect YouTube node output to this node.

18. **Connect Google Sheets Write node output back to Split In Batches node**  
    - To enable processing of next video in batch.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                   | Context or Link                                                |
|-----------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| This workflow relies on OpenAI GPT-4o model accessed via LangChain nodes for AI metadata generation. Ensure you have valid OpenAI API keys.  | OpenAI API documentation: https://platform.openai.com/docs  |
| Google Sheets API credentials must have read/write access to the tracking spreadsheet.                                                       | Google Sheets API guide: https://developers.google.com/sheets/api |
| Facebook Graph API credentials require permissions for Instagram Business accounts.                                                          | Facebook for Developers: https://developers.facebook.com/docs/instagram-api |
| Wait node delays help avoid API rate limits and ensure sequential processing stability.                                                       | n8n Wait Node docs: https://docs.n8n.io/nodes/n8n-nodes-base.wait/ |
| Use appropriate error handling on API and network calls for production deployments to avoid silent failures.                                 | n8n Error Handling concepts: https://docs.n8n.io/nodes/error-handling/ |

---

**Disclaimer:** The provided content is extracted from an automated n8n workflow and complies with all applicable content policies. All data processed is legal and publicly accessible.