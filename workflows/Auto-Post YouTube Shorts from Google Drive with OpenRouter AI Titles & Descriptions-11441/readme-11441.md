Auto-Post YouTube Shorts from Google Drive with OpenRouter AI Titles & Descriptions

https://n8nworkflows.xyz/workflows/auto-post-youtube-shorts-from-google-drive-with-openrouter-ai-titles---descriptions-11441


# Auto-Post YouTube Shorts from Google Drive with OpenRouter AI Titles & Descriptions

---

### 1. Workflow Overview

This workflow automates the process of posting YouTube Shorts videos directly from a Google Drive folder. It is designed for content creators or marketers who want to maintain a consistent publishing schedule without manual intervention. The workflow selects the next unposted video from a designated Google Drive folder, uses an AI language model to generate optimized YouTube metadata (title, description, hashtags), uploads the video to YouTube using the resumable upload API, and then moves the processed video to a separate "Posted" folder to avoid duplication.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger & Video Selection**: Periodically triggers the workflow and fetches the next video file from Google Drive.
- **1.2 AI Metadata Generation**: Calls an AI model to generate YouTube Shorts metadata (title, description, hashtags) based on input variables.
- **1.3 Metadata Cleaning & Formatting**: Cleans and parses the AI-generated JSON metadata to prepare it for YouTube upload.
- **1.4 YouTube Upload Preparation and Execution**: Initializes the YouTube resumable upload, downloads the video file from Google Drive, and uploads it to YouTube.
- **1.5 Post-Upload File Management**: Moves the uploaded video file from the input folder to a "Posted" folder in Google Drive to mark it as processed.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger & Video Selection

- **Overview:**  
  This block runs on a defined schedule (hourly intervals from 13:00 to 23:00) and retrieves the next available video from a specified Google Drive folder for processing.

- **Nodes Involved:**  
  - Pick next video (Schedule Trigger)  
  - Get next video from folder (Google Drive File Listing)  
  - Sticky Note (explaining this block)

- **Node Details:**

  - **Pick next video**  
    - Type: Schedule Trigger  
    - Role: Initiates workflow runs at specified hours daily.  
    - Configuration: Triggers at hours 13 through 23 (1 PM to 11 PM).  
    - Inputs: None (trigger node)  
    - Outputs: Connects to "Get next video from folder"  
    - Edge Cases: Workflow will not run outside defined hours. No videos available results in no further processing.

  - **Get next video from folder**  
    - Type: Google Drive (List Files)  
    - Role: Fetches the first video file found in the configured Google Drive folder.  
    - Configuration:  
      - Folder ID set to "1Gmal44X9qe3O_djokfRQ_Ega0bZaBkQA" (user must replace with their own input folder ID).  
      - Limits results to 1 file.  
      - Retrieves fields: id, mimeType, name, webViewLink.  
    - Inputs: Triggered by schedule node.  
    - Outputs: Passes video metadata to metadata generation block.  
    - Edge Cases: Folder empty → no file to process; API quota or auth failures.  
    - Credentials: Requires Google Drive OAuth2.  

  - **Sticky Note (Pick next video)**  
    - Content: Explains the purpose of this block as fetching the next video for processing.

---

#### 1.2 AI Metadata Generation

- **Overview:**  
  Uses an OpenRouter-powered AI chat model to generate SEO-optimized YouTube Shorts metadata: title, description, and relevant hashtags tailored to an online shopping discount coupon campaign.

- **Nodes Involved:**  
  - OpenRouter Chat Model1  
  - Generate title & description (LangChain LLM Chain)  
  - Clean LLM JSON (Code node)  
  - Sticky Note (explaining this block)

- **Node Details:**

  - **OpenRouter Chat Model1**  
    - Type: LangChain OpenRouter Chat Model  
    - Role: Executes the AI language model call.  
    - Configuration: Default options, requires OpenRouter API credential.  
    - Inputs: Triggered by "Get next video from folder".  
    - Outputs: Sends AI response to "Generate title & description".  
    - Edge Cases: API key missing, rate limits, model errors.

  - **Generate title & description**  
    - Type: LangChain LLM Chain  
    - Role: Formulates the prompt to generate YouTube Shorts metadata.  
    - Configuration:  
      - Prompt instructs the AI to produce a JSON object with title, description, hashtags.  
      - Injected variables from the workflow include store name, country, coupon code, tone, website, Instagram, TikTok links.  
      - Output format strictly JSON for easy parsing.  
    - Inputs: AI chat model output.  
    - Outputs: Raw AI-generated JSON string to "Clean LLM JSON".  
    - Edge Cases: AI returns malformed or invalid JSON.  
    - Notes: Prompt is customizable for tone or regional style.

  - **Clean LLM JSON**  
    - Type: Code (JavaScript)  
    - Role: Cleans the AI output by removing markdown code fences and parses it into JSON.  
    - Configuration: Robust parsing attempts with fallback eval() to handle slight formatting errors.  
    - Inputs: Raw text from AI output.  
    - Outputs: Structured JSON with keys: title, description, hashtags.  
    - Edge Cases: Parsing failure throws error halting workflow.

  - **Sticky Note (Generate metadata)**  
    - Content: Explains that this block generates metadata using AI and cleans JSON output for YouTube.

---

#### 1.3 Metadata Cleaning & Formatting

- **Overview:**  
  Prepares the cleaned metadata for YouTube by assigning it to the appropriate fields in the video upload request.

- **Nodes Involved:**  
  - YouTube video metadata (Set node)  
  - Sticky Note (explaining this block)

- **Node Details:**

  - **YouTube video metadata**  
    - Type: Set  
    - Role: Maps AI-generated fields into YouTube API’s snippet and status format.  
    - Configuration:  
      - snippet.title ← AI-generated title  
      - snippet.description ← AI-generated description + concatenated hashtags + "#shorts"  
      - snippet.categoryId ← "24" (YouTube category for "Entertainment")  
      - status.privacyStatus ← "public"  
      - defaultLanguage ← "ar" (Arabic)  
    - Inputs: Cleaned JSON from previous node.  
    - Outputs: Feeds "Initialize resumable upload" node.  
    - Edge Cases: Missing or empty metadata fields could cause upload errors.

---

#### 1.4 YouTube Upload Preparation and Execution

- **Overview:**  
  Initializes a resumable upload session with YouTube, downloads the video file from Google Drive, and uploads the video content to YouTube.

- **Nodes Involved:**  
  - Initialize resumable upload (HTTP Request)  
  - Download video file (Google Drive)  
  - Upload video file (HTTP Request)  
  - Sticky Note (explaining this block)

- **Node Details:**

  - **Initialize resumable upload**  
    - Type: HTTP Request  
    - Role: Starts YouTube's resumable upload session by POSTing video metadata.  
    - Configuration:  
      - URL: YouTube API endpoint with uploadType=resumable and parts snippet,status.  
      - Method: POST  
      - Headers:  
        - X-Upload-Content-Type: "video/mp4"  
        - Content-Type: "application/json; charset=UTF-8"  
      - Body: JSON containing snippet, status, and defaultLanguage from previous node.  
      - Auth: Uses predefined YouTube OAuth2 credential.  
      - Response: Full HTTP response with “Location” header containing upload URL.  
    - Inputs: YouTube video metadata.  
    - Outputs: Provides upload URL to "Download video file".  
    - Edge Cases: OAuth token expiration, API quota, malformed metadata.

  - **Download video file**  
    - Type: Google Drive (Download)  
    - Role: Downloads the video file binary from Google Drive by file URL.  
    - Configuration:  
      - File ID dynamically extracted from "Get next video from folder" node’s webViewLink.  
      - Operation: Download file binary.  
    - Inputs: Receives upload URL from previous node (triggered sequentially).  
    - Outputs: Passes binary data to "Upload video file".  
    - Edge Cases: File not found, permission denied, network errors.  
    - Credentials: Requires Google Drive OAuth2.

  - **Upload video file**  
    - Type: HTTP Request  
    - Role: Uploads the video binary data to YouTube's resumable upload URL via PUT.  
    - Configuration:  
      - URL: Taken dynamically from the “Location” header of the resumable upload initialization response.  
      - Method: PUT  
      - Content Type: binaryData  
      - Input field: "data" (binary from previous node)  
    - Inputs: Binary video data.  
    - Outputs: Connects to "Move video to Posted".  
    - Edge Cases: Upload failures, network timeouts, incomplete uploads.

---

#### 1.5 Post-Upload File Management

- **Overview:**  
  Moves the successfully uploaded video file from the input folder to a "Posted" folder in Google Drive, preventing duplicate processing.

- **Nodes Involved:**  
  - Move video to Posted (Google Drive Move File)  
  - Sticky Note (explaining this block)

- **Node Details:**

  - **Move video to Posted**  
    - Type: Google Drive (Move File)  
    - Role: Moves the file to the designated "Posted" folder after successful upload.  
    - Configuration:  
      - File ID: Taken from "Get next video from folder" node.  
      - Drive ID: "My Drive" (default).  
      - Folder ID: "1Xc27qsxlZMSuo6bugWKPN1BC-jOoPXT8" (user must replace with their own posted folder ID).  
      - Operation: Move file.  
    - Inputs: Triggered after successful upload.  
    - Edge Cases: Permissions missing, folder not found, concurrent moves.  
    - Credentials: Requires Google Drive OAuth2.

---

### 3. Summary Table

| Node Name                 | Node Type                                 | Functional Role                            | Input Node(s)               | Output Node(s)                    | Sticky Note                                                                                                                |
|---------------------------|-------------------------------------------|--------------------------------------------|-----------------------------|----------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| Pick next video           | Schedule Trigger                          | Triggers workflow on schedule              | None                        | Get next video from folder       | ## Pick next video<br>Runs on a schedule and fetches one video from the selected Google Drive folder.                      |
| Get next video from folder | Google Drive (List Files)                 | Fetches next video file from Drive folder  | Pick next video             | OpenRouter Chat Model1, Generate title & description |                                                                                                                            |
| OpenRouter Chat Model1    | LangChain OpenRouter Chat Model           | Executes AI call to generate metadata      | Get next video from folder  | Generate title & description      |                                                                                                                            |
| Generate title & description | LangChain Chain LLM                      | Formulates prompt to generate metadata     | OpenRouter Chat Model1      | Clean LLM JSON                   | ## Generate metadata<br>Uses an AI model to generate a title, description, and hashtags.                                   |
| Clean LLM JSON            | Code                                     | Parses and cleans AI-generated JSON        | Generate title & description | YouTube video metadata           |                                                                                                                            |
| YouTube video metadata    | Set                                      | Maps AI output to YouTube API snippet      | Clean LLM JSON             | Initialize resumable upload       | ## Upload to YouTube<br>Initializes a resumable upload, downloads the file, and streams it to YouTube.                      |
| Initialize resumable upload | HTTP Request                            | Starts YouTube resumable upload session    | YouTube video metadata     | Download video file               |                                                                                                                            |
| Download video file       | Google Drive (Download)                   | Downloads video file binary from Drive     | Initialize resumable upload | Upload video file                 |                                                                                                                            |
| Upload video file         | HTTP Request                             | Uploads video binary to YouTube            | Download video file         | Move video to Posted             |                                                                                                                            |
| Move video to Posted      | Google Drive (Move File)                  | Moves uploaded video to Posted folder      | Upload video file           | None                            | ## Move processed file<br>Moves the video to the “Posted” folder to avoid duplicates and confirm successful upload.         |
| Sticky Note               | Sticky Note                              | Informational                             | None                        | None                            | ## How it works<br>This workflow automates posting YouTube Shorts directly from a Google Drive folder...                    |
| Sticky Note1              | Sticky Note                              | Informational                             | None                        | None                            | ## Pick next video<br>Runs on a schedule and fetches one video from the selected Google Drive folder.                      |
| Sticky Note2              | Sticky Note                              | Informational                             | None                        | None                            | ## Generate metadata<br>Uses an AI model to generate a title, description, and hashtags.                                   |
| Sticky Note3              | Sticky Note                              | Informational                             | None                        | None                            | ## Upload to YouTube<br>Initializes a resumable upload, downloads the file, and streams it to YouTube.                      |
| Sticky Note4              | Sticky Note                              | Informational                             | None                        | None                            | ## Move processed file<br>Moves the video to the “Posted” folder to avoid duplicates and confirm successful upload.         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Name: "Pick next video"  
   - Type: Schedule Trigger  
   - Configure to trigger hourly at 13:00 through 23:00 (hours 13-23).  
   - No inputs.  

2. **Add a Google Drive node to list files**  
   - Name: "Get next video from folder"  
   - Type: Google Drive (File/Folder resource)  
   - Operation: List Files in Folder  
   - Folder ID: Replace with your own Google Drive folder ID containing videos.  
   - Limit: 1 (fetch only next unprocessed video)  
   - Fields to retrieve: id, mimeType, name, webViewLink  
   - Credential: Google Drive OAuth2  
   - Connect output of "Pick next video" to this node’s input.

3. **Add an OpenRouter Chat Model node**  
   - Name: "OpenRouter Chat Model1"  
   - Type: LangChain OpenRouter Chat Model  
   - Credentials: Set OpenRouter API key (OpenRouter API credential)  
   - Use default options.  
   - Connect output of "Get next video from folder" to this node’s input.

4. **Add a LangChain Chain LLM node**  
   - Name: "Generate title & description"  
   - Type: LangChain Chain LLM  
   - Configure the prompt with the detailed instruction provided, ensuring to inject workflow variables: storeName, country, couponCode, tone, website, instagram, tiktok.  
   - Define output as strictly valid JSON with keys: title, description, hashtags.  
   - Connect input from "OpenRouter Chat Model1".

5. **Add a Code node for JSON cleaning**  
   - Name: "Clean LLM JSON"  
   - Type: Code (JavaScript)  
   - Paste the provided JS snippet that strips markdown code fences and parses JSON robustly.  
   - Connect input from "Generate title & description".

6. **Add a Set node to prepare YouTube video metadata**  
   - Name: "YouTube video metadata"  
   - Type: Set  
   - Assignments:  
     - snippet.title ← {{$json.title}}  
     - snippet.description ← {{$json.description}} + space + {{$json.hashtags}} + " #shorts"  
     - snippet.categoryId ← "24" (Entertainment category)  
     - status.privacyStatus ← "public"  
     - defaultLanguage ← "ar" (Arabic; change if needed)  
   - Connect input from "Clean LLM JSON".

7. **Add HTTP Request node to initialize resumable upload**  
   - Name: "Initialize resumable upload"  
   - Type: HTTP Request  
   - Method: POST  
   - URL: https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status  
   - Headers:  
     - X-Upload-Content-Type: video/mp4  
     - Content-Type: application/json; charset=UTF-8  
   - Body: JSON with snippet, status, defaultLanguage from previous node.  
   - Authentication: YouTube OAuth2 credential (predefined).  
   - Response: Full HTTP response to capture “Location” header.  
   - Connect input from "YouTube video metadata".

8. **Add Google Drive node to download video file**  
   - Name: "Download video file"  
   - Type: Google Drive (Download)  
   - File ID: Extract from "Get next video from folder" node’s webViewLink (use expression).  
   - Operation: Download file binary.  
   - Credential: Google Drive OAuth2.  
   - Connect input from "Initialize resumable upload".

9. **Add HTTP Request node to upload video binary**  
   - Name: "Upload video file"  
   - Type: HTTP Request  
   - Method: PUT  
   - URL: Extract dynamically from the “Location” header of "Initialize resumable upload" response.  
   - Content-Type: binaryData  
   - Input data field: "data" (binary from downloaded video)  
   - Connect input from "Download video file".

10. **Add Google Drive node to move processed video**  
    - Name: "Move video to Posted"  
    - Type: Google Drive (Move File)  
    - File ID: From "Get next video from folder" node (original file id).  
    - Drive ID: "My Drive" (default)  
    - Folder ID: Replace with your Google Drive folder ID for posted videos.  
    - Operation: Move file  
    - Credential: Google Drive OAuth2.  
    - Connect input from "Upload video file".

11. **Add Sticky Notes for documentation** (optional but recommended)  
    - Add descriptive sticky notes as per the blocks explained above to clarify workflow sections.

12. **Verify all connections** follow this order:  
    Pick next video → Get next video from folder → OpenRouter Chat Model1 → Generate title & description → Clean LLM JSON → YouTube video metadata → Initialize resumable upload → Download video file → Upload video file → Move video to Posted.

13. **Set credentials and test**  
    - Ensure Google Drive OAuth2 and YouTube OAuth2 credentials are properly configured with necessary scopes.  
    - Add OpenRouter API credentials.  
    - Test individual nodes to confirm successful API calls and data flow.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                   | Context or Link                                                                                             |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| This workflow automates YouTube Shorts posting directly from Google Drive, including AI-generated titles and descriptions for promotional video content.      | Main workflow description and purpose.                                                                     |
| Replace folder IDs in “Get next video from folder” and “Move video to Posted” nodes to match your Google Drive structure.                                    | Customization step required for personal Google Drive setup.                                               |
| The AI prompt is customizable in the "Generate title & description" node to fit different brands, tones, or languages.                                       | Allows adjustment of marketing style and regional targeting.                                              |
| Uses YouTube's resumable upload API to handle potentially large video files reliably.                                                                         | Ensures robustness for video upload process.                                                               |
| OpenRouter AI requires an API key and proper credential setup in n8n to function correctly.                                                                   | Credential setup prerequisite.                                                                              |
| Google Drive and YouTube nodes require OAuth2 credentials with appropriate scopes (e.g., drive.file, youtube.upload).                                         | Credential authorization requirements.                                                                     |
| For more detailed guidance on YouTube resumable uploads, see: https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol                   | Official YouTube API documentation.                                                                         |
| To customize the schedule, modify the “Pick next video” node’s trigger hours as needed.                                                                       | Scheduling flexibility for publishing times.                                                               |

---

**Disclaimer:** The text provided derives exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.

---