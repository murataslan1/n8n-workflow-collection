Automate AI Video Production & Distribution with Veo3, YouTube & Google Suite

https://n8nworkflows.xyz/workflows/automate-ai-video-production---distribution-with-veo3--youtube---google-suite-6374


# Automate AI Video Production & Distribution with Veo3, YouTube & Google Suite

### 1. Workflow Overview

This workflow automates the end-to-end production and distribution of AI-generated videos using Google Veo3, Google Sheets, Google Drive, and YouTube via Upload-Post API. It is designed for users who want to trigger video generation from a Google Sheet prompt, track generation status, store videos on Google Drive, generate optimized YouTube titles via GPT-4o, upload videos to YouTube, and log all results back into the Google Sheet for reporting.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Trigger:** Starting point of the workflow, reading new prompts from Google Sheets.
- **1.2 AI Video Generation:** Sending prompt to Google Veo3 API to create videos and polling for completion.
- **1.3 Title Generation:** Generating SEO-optimized YouTube video titles using GPT-4o.
- **1.4 Video Retrieval & Storage:** Downloading completed videos and uploading them to Google Drive.
- **1.5 YouTube Upload & Logging:** Uploading videos to YouTube using Upload-Post API and updating the Google Sheet with video and YouTube URLs.
- **1.6 Scheduling & Manual Trigger:** Supports both manual triggering and scheduled automation for periodic execution.
- **1.7 Documentation & Setup Guidance:** Sticky notes provide detailed user instructions and configuration steps.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Trigger

- **Overview:** Starts the workflow either via manual trigger or scheduled trigger, then reads new video prompts from a Google Sheet.
- **Nodes Involved:**  
  - *When clicking ‘Test workflow’* (Manual Trigger)  
  - *Schedule Trigger* (Scheduled Trigger)  
  - *Get new video* (Google Sheets Read)

- **Node Details:**

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Allows manual initiation of the workflow for testing or ad-hoc runs.  
    - Configuration: No parameters, triggers on user action.  
    - Input: None  
    - Output: Triggers *Get new video* node.  
    - Edge cases: User forgets to trigger manually; no data read if sheet empty.

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Automates the workflow execution every few minutes (default every 1 minute, adjustable).  
    - Configuration: Interval set to minutes (configurable).  
    - Input: None  
    - Output: Not directly connected in JSON but implied for automated runs (likely manual trigger used here).  
    - Edge cases: Quota limits, overlapping executions if interval too short.

  - **Get new video**  
    - Type: Google Sheets  
    - Role: Reads entries (prompts) from the Google Sheet to process new video generation requests.  
    - Configuration: Reads from a specific spreadsheet and sheet (gid=0).  
    - Key Variables: Reads PROMPT column and row_number for updates.  
    - Input: Trigger from manual or scheduled trigger.  
    - Output: Data passed to *Create Video with AI/ML API* node.  
    - Edge cases: Empty rows, API quota, authentication errors.  
    - Credentials: Google Sheets OAuth2.

---

#### 1.2 AI Video Generation

- **Overview:** Sends prompt to AI API to create video, waits 30 seconds, polls for video generation status until completion.
- **Nodes Involved:**  
  - *Create Video with AI/ML API* (HTTP Request)  
  - *Wait 30 sec.* (Wait node)  
  - *Get status* (HTTP Request)  
  - *Completed?* (If node)

- **Node Details:**

  - **Create Video with AI/ML API**  
    - Type: HTTP Request  
    - Role: Posts video generation request to Veo3 API with prompt from sheet.  
    - Configuration: POST to `https://api.aimlapi.com/v2/generate/video/google/generation`  
      - Headers: Bearer Auth with API Key  
      - Body: JSON containing prompt and model (`google/veo3`)  
    - Input: PROMPT from *Get new video*  
    - Output: Contains generation ID for status polling.  
    - Edge cases: API key missing/invalid, network timeouts, malformed prompt.  
    - Credentials: Bearer Auth.

  - **Wait 30 sec.**  
    - Type: Wait  
    - Role: Pauses workflow for 30 seconds before polling status to allow video processing.  
    - Configuration: Fixed 30-second delay.  
    - Input: From *Create Video with AI/ML API*  
    - Output: Triggers *Get status*.  
    - Edge cases: If video completes faster, delay adds latency; if longer, multiple cycles needed.

  - **Get status**  
    - Type: HTTP Request  
    - Role: Polls the video generation status using generation_id from previous node.  
    - Configuration: GET request to API endpoint with generation_id query parameter.  
      - Auth: Bearer Token.  
    - Input: generation_id from *Create Video with AI/ML API* (passed through Wait node).  
    - Output: JSON including status field (`completed` or other).  
    - Edge cases: Timeout, invalid ID, API rate limits.  

  - **Completed?**  
    - Type: If  
    - Role: Checks if video generation status is `"completed"`.  
    - Configuration: Condition `$json.status == "completed"`  
    - Input: Result from *Get status*  
    - Output:  
      - True branch: Proceeds to *Generate title with AI/ML API*.  
      - False branch: Loops back to *Wait 30 sec.* to poll again.  
    - Edge cases: Infinite loop if status never completes, API errors.

---

#### 1.3 Title Generation

- **Overview:** Generates an SEO-optimized and catchy YouTube title based on the prompt using GPT-4o model.
- **Nodes Involved:**  
  - *Generate title with AI/ML API* (AI/ML API node)

- **Node Details:**

  - **Generate title with AI/ML API**  
    - Type: AI/ML API (aimlapi node)  
    - Role: Uses GPT-4o to create an optimized video title.  
    - Configuration:  
      - Model: `openai/gpt-4o`  
      - Prompt: A detailed instruction to create a title based on the original prompt from *Get new video* node.  
      - Output: Title string only, max 60 chars, SEO optimized, same language as input.  
    - Input: Prompt from *Get new video*.  
    - Output: Title for use in upload.  
    - Credentials: AI/ML API key.  
    - Edge cases: Rate limiting, malformed prompt, unexpected responses.

---

#### 1.4 Video Retrieval & Storage

- **Overview:** Downloads the completed video file, uploads it to Google Drive with a timestamped name, and prepares for YouTube upload.
- **Nodes Involved:**  
  - *Get Video File* (HTTP Request)  
  - *Upload Video* (Google Drive)

- **Node Details:**

  - **Get Video File**  
    - Type: HTTP Request  
    - Role: Downloads the video file from the URL provided in the completed status response.  
    - Configuration: GET request to the video URL extracted from status check node.  
    - Input: Video URL from *Completed?* true branch → *Generate title* → *Get Video File*.  
    - Output: Binary video data sent to *Upload Video* and *HTTP Request* (upload to YouTube).  
    - Edge cases: Download failure, invalid URL, network issues.

  - **Upload Video**  
    - Type: Google Drive  
    - Role: Uploads video file to a specified Google Drive folder.  
    - Configuration:  
      - File name: timestamp + prompt content + `.mp4`  
      - Folder ID: specified Drive folder for AI videos.  
    - Input: Binary data from *Get Video File*.  
    - Output: Google Drive file metadata including webContentLink.  
    - Credentials: Google Drive OAuth2.  
    - Edge cases: Storage quota limits, API errors, permissions.

---

#### 1.5 YouTube Upload & Logging

- **Overview:** Uploads the video file to YouTube using Upload-Post API, then updates the Google Sheet with video and YouTube URLs.
- **Nodes Involved:**  
  - *HTTP Request* (Upload-Post API video upload)  
  - *Update Youtube URL* (Google Sheets update)  
  - *Update result* (Google Sheets update)

- **Node Details:**

  - **HTTP Request** (Upload Video to YouTube)  
    - Type: HTTP Request  
    - Role: Uploads the video file to YouTube through Upload-Post API.  
    - Configuration:  
      - POST to `https://api.upload-post.com/api/upload`  
      - Multipart form data including:  
        - title: generated title from *Generate title with AI/ML API*  
        - user: User’s Upload-Post username (must be configured)  
        - platform[]: "youtube"  
        - video: binary data from *Get Video File*  
      - Authentication: HTTP Header with `Authorization: Apikey YOUR_API_KEY`  
    - Input: Binary video, title string.  
    - Output: JSON with YouTube video ID and URL.  
    - Edge cases: Authentication failure, upload errors, quota limits.

  - **Update Youtube URL**  
    - Type: Google Sheets  
    - Role: Updates the row in Google Sheet with YouTube URL after upload.  
    - Configuration:  
      - Matches row_number from *Get new video*.  
      - Updates column `YOUTUBE_URL` with `https://youtu.be/{{ video_id }}`.  
    - Input: response from Upload-Post API.  
    - Credentials: Google Sheets OAuth2.  
    - Edge cases: Sheet API errors, mismatched row numbers.

  - **Update result**  
    - Type: Google Sheets  
    - Role: Updates the Google Sheet with the Google Drive video link after upload to Drive.  
    - Configuration:  
      - Matches row_number from *Get new video*.  
      - Updates column `VIDEO` with `webContentLink` from Drive upload.  
    - Input: output from *Upload Video*.  
    - Credentials: Google Sheets OAuth2.

---

#### 1.6 Scheduling & Manual Trigger

- **Overview:** Supports workflow execution by manual trigger or by schedule for automation.
- **Nodes Involved:**  
  - *When clicking ‘Test workflow’* (Manual trigger)  
  - *Schedule Trigger* (Scheduled trigger)

- **Node Details:**  
  - Already detailed in 1.1.

---

#### 1.7 Documentation & Setup Guidance

- **Overview:** Multiple sticky notes explain configuration steps, usage instructions, and API key setup.
- **Nodes Involved:**  
  - Sticky Note1 to Sticky Note12

- **Key Contents:**  
  - Step 1: Google Sheet setup with template link and column instructions.  
  - Step 2: Obtaining API key from AIMLAPI with authentication setup.  
  - Step 3: Upload-Post API key and profile configuration for YouTube upload.  
  - Step 4: Main flow description including trigger options and automation settings.  
  - Notes on setting username, API keys, and folder links.  
  - Branding and high-level workflow summary.

- **Edge cases:**  
  - Missing or incomplete user setup leads to workflow failure.  
  - Sticky notes serve as in-app documentation for users.

---

### 3. Summary Table

| Node Name                   | Node Type             | Functional Role                       | Input Node(s)                | Output Node(s)                     | Sticky Note                                                                                                          |
|-----------------------------|-----------------------|------------------------------------|-----------------------------|----------------------------------|----------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’| Manual Trigger        | Manual start of workflow            | None                        | Get new video                    |                                                                                                                      |
| Schedule Trigger            | Schedule Trigger       | Scheduled start of workflow         | None                        | (Implied trigger, not connected) |                                                                                                                      |
| Get new video               | Google Sheets          | Read new prompts from Google Sheet  | When clicking ‘Test workflow’| Create Video with AI/ML API      |                                                                                                                      |
| Create Video with AI/ML API | HTTP Request           | Request AI video generation         | Get new video               | Wait 30 sec.                    | Set API Key created in Step 2                                                                                        |
| Wait 30 sec.                | Wait                   | Pause before polling status         | Create Video with AI/ML API  | Get status                     |                                                                                                                      |
| Get status                  | HTTP Request           | Poll video generation status        | Wait 30 sec.                | Completed?                     | Set API Key created in Step 2                                                                                        |
| Completed?                  | If                     | Check if video generation complete  | Get status                  | Generate title with AI/ML API, Wait 30 sec. (if not completed) |                                                                                                                      |
| Generate title with AI/ML API| AI/ML API (aimlapi)   | Generate SEO-optimized video title  | Completed?                  | Get Video File                 |                                                                                                                      |
| Get Video File              | HTTP Request           | Download generated video file       | Generate title with AI/ML API| Upload Video, HTTP Request      |                                                                                                                      |
| Upload Video                | Google Drive           | Upload video file to Google Drive   | Get Video File              | Update result                  | Create and insert link to your `output` GoogleDrive folder                                                          |
| HTTP Request               | HTTP Request           | Upload video to YouTube via Upload-Post API | Get Video File              | Update Youtube URL             | Set YOUR_USERNAME in Step 3                                                                                          |
| Update Youtube URL          | Google Sheets          | Update YouTube URL in sheet         | HTTP Request (Upload)       | None                          |                                                                                                                      |
| Update result               | Google Sheets          | Update Google Drive video link      | Upload Video                | None                          |                                                                                                                      |
| Sticky Note1                | Sticky Note            | Title note for video generation block| None                     | None                          | # Generate Video via VEO-3                                                                                           |
| Sticky Note2                | Sticky Note            | Title note for title generation     | None                        | None                          | ### Generate Title via GPT-4o                                                                                        |
| Sticky Note3                | Sticky Note            | Workflow summary and purpose        | None                        | None                          | **AI Video Automation: Google Veo3 → Google Drive → YouTube**                                                       |
| Sticky Note4                | Sticky Note            | Instructions for Google Sheet setup | None                        | None                          | Step 1: Set up your Google Sheet with template and columns                                                          |
| Sticky Note5                | Sticky Note            | Main flow usage instructions        | None                        | None                          | Step 4: Main flow trigger and schedule setup                                                                        |
| Sticky Note6                | Sticky Note            | API Key retrieval instructions      | None                        | None                          | Step 2: Obtain your API key from AIMLAPI                                                                             |
| Sticky Note7                | Sticky Note            | Reminder to set API key              | None                        | None                          | Set API Key created in Step 2                                                                                        |
| Sticky Note8                | Sticky Note            | YouTube upload API setup instructions| None                       | None                          | Step 3: Configure YouTube upload with Upload-Post API                                                               |
| Sticky Note9                | Sticky Note            | Upload video block title            | None                        | None                          | Upload your video                                                                                                    |
| Sticky Note10               | Sticky Note            | Automation settings header          | None                        | None                          | Select your automating settings                                                                                      |
| Sticky Note11               | Sticky Note            | Reminder for API key in Step 2      | None                        | None                          | Set API Key created in Step 2                                                                                        |
| Sticky Note12               | Sticky Note            | Google Drive folder link reminder   | None                        | None                          | Create and insert link to your `output` GoogleDrive folder                                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: Start workflow manually for testing.

2. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set interval to every 1 or 5 minutes as needed.  
   - Purpose: Automate periodic workflow runs.

3. **Create Google Sheets Read Node ("Get new video")**  
   - Type: Google Sheets  
   - Operation: Read rows from the Google Sheet (use your sheet ID and sheet gid=0).  
   - Authentication: Google Sheets OAuth2 credentials.  
   - Purpose: Retrieve new video prompts.

4. **Connect Trigger Nodes to "Get new video"**  
   - Manual Trigger and Schedule Trigger both connect to this node.

5. **Create HTTP Request Node ("Create Video with AI/ML API")**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.aimlapi.com/v2/generate/video/google/generation`  
   - Authentication: HTTP Bearer Auth with your AIMLAPI key.  
   - Headers: Content-Type: application/json  
   - Body Parameters: JSON with keys "prompt" (from Google Sheets PROMPT column) and "model":"google/veo3".  
   - Input: Data from "Get new video".  
   - Purpose: Initiate AI video generation.

6. **Create Wait Node ("Wait 30 sec.")**  
   - Type: Wait  
   - Set to 30 seconds.  
   - Input: From "Create Video with AI/ML API".  
   - Purpose: Pause before polling status.

7. **Create HTTP Request Node ("Get status")**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://api.aimlapi.com/v2/generate/video/google/generation`  
   - Query Parameter: generation_id from previous node JSON.  
   - Authentication: Bearer Auth same as before.  
   - Input: From "Wait 30 sec."  
   - Purpose: Poll generation status.

8. **Create If Node ("Completed?")**  
   - Type: If  
   - Condition: `$json.status == "completed"`  
   - Input: From "Get status".  
   - True: Proceed to title generation.  
   - False: Loop back to "Wait 30 sec.".

9. **Create AI/ML API Node ("Generate title with AI/ML API")**  
   - Type: AI/ML API (aimlapi)  
   - Model: `openai/gpt-4o`  
   - Prompt: Detailed instructions to generate a catchy YouTube title based on prompt from Google Sheets.  
   - Input: From "Completed?" true branch data (original prompt).  
   - Credentials: AIMLAPI key.  
   - Purpose: Generate SEO-friendly video title.

10. **Create HTTP Request Node ("Get Video File")**  
    - Type: HTTP Request  
    - Method: GET  
    - URL: From the completed video URL in "Completed?" node JSON.  
    - Input: From "Generate title with AI/ML API" node.  
    - Purpose: Download the generated video.

11. **Create Google Drive Node ("Upload Video")**  
    - Type: Google Drive  
    - Operation: Upload file  
    - Filename: Timestamp + prompt + `.mp4`  
    - Folder: Specify your Google Drive folder ID.  
    - Input: Binary data from "Get Video File".  
    - Credentials: Google Drive OAuth2.  
    - Purpose: Store video in Drive.

12. **Create HTTP Request Node ("HTTP Request" for Upload-Post)**  
    - Type: HTTP Request  
    - URL: `https://api.upload-post.com/api/upload`  
    - Method: POST  
    - Content-Type: multipart/form-data  
    - Body Parameters:  
      - title: Output from title generation node  
      - user: Your Upload-Post username  
      - platform[]: "youtube"  
      - video: Binary data from "Get Video File"  
    - Authentication: HTTP Header Auth with `Authorization: Apikey YOUR_API_KEY`.  
    - Input: Binary data from "Get Video File" and title from title node.  
    - Purpose: Upload video to YouTube.

13. **Create Google Sheets Node ("Update Youtube URL")**  
    - Type: Google Sheets  
    - Operation: Update row  
    - Match by `row_number` from "Get new video".  
    - Update column "YOUTUBE_URL" with YouTube video link from Upload-Post API response.  
    - Credentials: Google Sheets OAuth2.

14. **Create Google Sheets Node ("Update result")**  
    - Type: Google Sheets  
    - Operation: Update row  
    - Match by `row_number`.  
    - Update column "VIDEO" with Google Drive webContentLink from "Upload Video" node.  
    - Credentials: Google Sheets OAuth2.

15. **Connect nodes appropriately:**  
    - "When clicking ‘Test workflow’" → "Get new video"  
    - "Get new video" → "Create Video with AI/ML API"  
    - "Create Video with AI/ML API" → "Wait 30 sec."  
    - "Wait 30 sec." → "Get status"  
    - "Get status" → "Completed?"  
    - "Completed?" true → "Generate title with AI/ML API"  
    - "Completed?" false → loop back to "Wait 30 sec."  
    - "Generate title with AI/ML API" → "Get Video File"  
    - "Get Video File" → "Upload Video" and "HTTP Request" (Upload-Post) in parallel  
    - "Upload Video" → "Update result"  
    - "HTTP Request" (upload) → "Update Youtube URL"

16. **Add sticky notes** to document steps and configuration for users, including links to Google Sheet templates, API key setup, and Upload-Post configuration.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                            | Context or Link                                                                                                                             |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| Copy [this Google Sheets template](https://docs.google.com/spreadsheets/d/1PXFCgY9zKHjX0HEhtrjMMiwefuwUP-bHIbwJ1gc-cAI/edit?usp=sharing) to start.                                   | Step 1: Google Sheet setup                                                                                                                  |
| Obtain your AIMLAPI key at [https://aimlapi.com/app/keys](https://aimlapi.com/app/keys?utm_source=n8n-workflows&utm_medium=github&utm_campaign=integration) and configure Bearer Auth. | Step 2: API Key for AI/ML calls                                                                                                            |
| Set your Upload-Post API key and username from [https://app.upload-post.com/](https://app.upload-post.com/) to enable YouTube uploads.                                                 | Step 3: YouTube upload API setup                                                                                                           |
| Main flow can be triggered manually or scheduled every 5 minutes for near real-time processing.                                                                                          | Automation scheduling instructions                                                                                                         |
| Video filenames formatted with timestamp and prompt content for easy organization.                                                                                                       | Naming convention details                                                                                                                  |
| Ensure quota limits and API rate limits are respected for AIMLAPI, Google Sheets, Google Drive, and Upload-Post API.                                                                    | Operational constraints                                                                                                                    |
| Workflow fully automates AI video creation, storage, title optimization, YouTube upload, and status logging.                                                                             | Overall workflow summary                                                                                                                   |

---

**Disclaimer:** The provided text is extracted exclusively from an automated n8n workflow. It is fully compliant with content policies and contains no illegal or protected content. All data handled is legal and public.