AI-Driven Video Creation & Upload to Instagram, TikTok & YouTube from Drive

https://n8nworkflows.xyz/workflows/ai-driven-video-creation---upload-to-instagram--tiktok---youtube-from-drive-10614


# AI-Driven Video Creation & Upload to Instagram, TikTok & YouTube from Drive

### 1. Workflow Overview

This workflow automates the creation of AI-driven videos from images and scripts, then uploads finalized videos with generated voice and captions to multiple social media platforms (Instagram, TikTok, YouTube, Facebook, LinkedIn). It integrates Google Drive for media storage, Google Sheets for data management, OpenAI for AI content generation, and external APIs for video rendering and social media uploads.

The workflow consists of the following logical blocks:

- **1.1 Initialization & Scheduling:** Sets up API keys and triggers the workflow on a schedule.
- **1.2 Data Loading & Validation:** Loads input data from Google Sheets and validates its formatting.
- **1.3 Prompt & Script Generation:** Uses OpenAI to generate image prompts, video scripts, and captions.
- **1.4 Image Generation & Processing:** Calls external APIs to generate images from prompts, handles retries and error checking.
- **1.5 Video Creation:** Converts generated images to video, merges with generated audio, and renders final videos.
- **1.6 Audio Generation & Upload:** Generates voice audio from scripts, uploads to Google Drive, and sets permissions.
- **1.7 Video & Caption Pairing:** Matches video clips with captions for final combination.
- **1.8 Final Video Upload:** Uploads the finished video to Google Drive and updates the Google Sheet.
- **1.9 Social Media Publishing:** Extracts audio from videos, generates social media descriptions, and uploads videos with descriptions to multiple platforms.
- **1.10 Notifications:** Sends notifications via Discord, Telegram, and a third-party service (Rapiwa).
- **1.11 Error Handling & Retry:** Checks for failures, manages wait times, and retries API calls as needed.

---

### 2. Block-by-Block Analysis

#### 1.1 Initialization & Scheduling

- **Overview:** Sets up necessary API keys and triggers the workflow on a schedule.
- **Nodes Involved:** `Schedule`, `Set API Keys`
- **Node Details:**
  - **Schedule**
    - Type: Schedule Trigger
    - Role: Periodically triggers the workflow start.
    - Config: Runs based on a predefined schedule (e.g., daily or hourly).
    - Input: None
    - Output: Triggers `Set API Keys`
  - **Set API Keys**
    - Type: Set
    - Role: Stores or injects API keys and credentials needed for downstream nodes.
    - Config: Preconfigured with environment-specific secrets.
    - Input: From Schedule
    - Output: To `Load Google Sheet`
    - Notes: Marked as "SET BEFORE STARTING" indicating it must be configured before running.

#### 1.2 Data Loading & Validation

- **Overview:** Loads input data from Google Sheets and validates the data format before use.
- **Nodes Involved:** `Load Google Sheet`, `Validate list formatting`, `Create List`
- **Node Details:**
  - **Load Google Sheet**
    - Type: Google Sheets
    - Role: Reads rows from a Google Sheet containing video creation data.
    - Config: Points to a specific spreadsheet and worksheet.
    - Input: From `Set API Keys`
    - Output: To `Generate Video Captions`
  - **Validate list formatting**
    - Type: If
    - Role: Checks that the loaded data meets expected format or structure.
    - Input: From `Create List`
    - Output: Three outputs:
      - Valid: Triggers `Generate Image Prompts`
      - Invalid: Triggers `Generate Video Captions` (fallback)
      - Another path: Triggers `Match captions with videos`
  - **Create List**
    - Type: Code
    - Role: Processes loaded sheet data into a suitable list format for further processing.
    - Input: From `Generate Video Captions`
    - Output: To `Validate list formatting`

#### 1.3 Prompt & Script Generation

- **Overview:** Uses OpenAI to generate creative prompts for images, video scripts, and video captions.
- **Nodes Involved:** `Generate Image Prompts`, `Calculate Token Usage`, `Generate Image`, `Generate Script`, `Generate Video Captions`
- **Node Details:**
  - **Generate Image Prompts**
    - Type: OpenAI (Langchain)
    - Role: Generates descriptive prompts for image creation.
    - Input: Validated list items
    - Output: To `Calculate Token Usage`
  - **Calculate Token Usage**
    - Type: Code
    - Role: Calculates token usage for OpenAI API calls, possibly for cost or quota management.
    - Input: From `Generate Image Prompts`
    - Output: To `Generate Image`
  - **Generate Image**
    - Type: HTTP Request
    - Role: Calls an external API to create images from prompts.
    - Input: From `Calculate Token Usage`
    - Output: To `Wait 3min`
    - Edge Cases: May fail due to API limits or network errors.
  - **Generate Script**
    - Type: OpenAI (Langchain)
    - Role: Generates the video script based on the prompts or input data.
    - Input: From `Validate list formatting` (valid path)
    - Output: To `Generate voice`
  - **Generate Video Captions**
    - Type: OpenAI (Langchain)
    - Role: Creates captions for videos.
    - Input: From `Load Google Sheet` or fallback from validation.
    - Output: To `Create List`

#### 1.4 Image Generation & Processing

- **Overview:** Retrieves generated images, checks for failures, and retries as necessary.
- **Nodes Involved:** `Get image`, `Check for failures`, `Wait 5min`, `Wait 3min`, `Fail check`, `Wait to retry`, `Image-to-Video`, `Wait 10min`, `Get Video`
- **Node Details:**
  - **Get image**
    - Type: HTTP Request
    - Role: Fetches the generated images from the external API.
    - Input: From `Wait 3min`
    - Output: To `Check for failures`
  - **Check for failures**
    - Type: If
    - Role: Determines if image generation succeeded or failed.
    - Input: From `Get image`
    - Outputs:
      - Failure: Triggers `Wait 5min` then retries via `Generate Image`
      - Success: Triggers `Image-to-Video`
  - **Wait 5min**, **Wait 3min**, **Wait 10min**, **Wait to retry**
    - Type: Wait
    - Role: Introduce delays for API processing and retry intervals.
    - Input/Output: Various flows to control timing between API calls.
  - **Fail check**
    - Type: If
    - Role: Checks for video generation failures.
    - Input: From `Get Video`
    - Outputs:
      - Failure: Triggers `Wait to retry`
      - Success: Triggers `Match captions with videos`
  - **Image-to-Video**
    - Type: HTTP Request
    - Role: Converts images into video clips.
    - Input: From `Wait to retry` or success path.
    - Output: To `Wait 10min`
  - **Get Video**
    - Type: HTTP Request
    - Role: Retrieves the video generated from images.
    - Input: From `Wait 10min`
    - Output: To `Fail check`

#### 1.5 Video Creation

- **Overview:** Pairs video clips with generated audio, renders final videos, and waits for processing.
- **Nodes Involved:** `Generate voice`, `Upload Voice Audio`, `Set Access Permissions`, `List Elements1`, `Pair Videos with Audio`, `Render Final Video`, `Wait1`, `Get Final Video`
- **Node Details:**
  - **Generate voice**
    - Type: HTTP Request
    - Role: Uses TTS or similar service to generate voice audio from the generated script.
    - Input: From `Generate Script`
    - Output: To `Upload Voice Audio`
    - Edge Cases: May fail if TTS API is down.
  - **Upload Voice Audio**
    - Type: Google Drive
    - Role: Uploads generated voice audio files to Google Drive.
    - Input: From `Generate voice`
    - Output: To `Set Access Permissions`
  - **Set Access Permissions**
    - Type: Google Drive
    - Role: Sets sharing permissions on the uploaded audio files.
    - Input: From `Upload Voice Audio`
    - Output: To `List Elements1`
  - **List Elements1**
    - Type: Code
    - Role: Processes lists to prepare for pairing audio with video.
    - Input: From `Set Access Permissions`
    - Output: To `Pair Videos with Audio`
  - **Pair Videos with Audio**
    - Type: Merge
    - Role: Combines video clips and audio tracks into single units.
    - Input: From `List Elements` and `List Elements1`
    - Output: To `Render Final Video`
  - **Render Final Video**
    - Type: HTTP Request
    - Role: Calls external service to render the final combined video.
    - Input: From `Pair Videos with Audio`
    - Output: To `Wait1`
  - **Wait1**
    - Type: Wait
    - Role: Waits for rendering to complete.
    - Input: From `Render Final Video`
    - Output: To `Get Final Video`
  - **Get Final Video**
    - Type: HTTP Request
    - Role: Retrieves the rendered final video.
    - Input: From `Wait1`
    - Output: To `Get Raw File`

#### 1.6 Audio Generation & Upload

- **Overview:** Handles video and audio file management in Google Drive and updates permissions.
- **Nodes Involved:** `Get Raw File`, `Upload Final Video`, `Set Permissions`, `Update Google Sheet`
- **Node Details:**
  - **Get Raw File**
    - Type: HTTP Request
    - Role: Downloads the final video file.
    - Input: From `Get Final Video`
    - Output: To `Upload Final Video` and `Write video`
  - **Upload Final Video**
    - Type: Google Drive
    - Role: Uploads the final video file to Google Drive.
    - Input: From `Get Raw File`
    - Output: To `Set Permissions`
  - **Set Permissions**
    - Type: Google Drive
    - Role: Adjusts sharing permissions for the uploaded video.
    - Input: From `Upload Final Video`
    - Output: To `Update Google Sheet`
  - **Update Google Sheet**
    - Type: Google Sheets
    - Role: Updates the sheet with video upload details/status.
    - Input: From `Set Permissions`
    - Output: To `Notify me on Discord`, `Send a text message`, `Rapiwa`

#### 1.7 Video & Caption Pairing

- **Overview:** Matches generated captions with corresponding videos for final packaging.
- **Nodes Involved:** `Match captions with videos`, `List Elements`
- **Node Details:**
  - **Match captions with videos**
    - Type: Merge
    - Role: Combines captions and videos based on matching criteria.
    - Input: From `Fail check`
    - Output: To `List Elements`
  - **List Elements**
    - Type: Code
    - Role: Processes lists, preparing them for pairing with audio.
    - Input: From `Match captions with videos`
    - Output: To `Pair Videos with Audio`

#### 1.8 Social Media Publishing

- **Overview:** Extracts audio from videos, generates descriptions, and uploads videos with descriptions to multiple social media platforms.
- **Nodes Involved:** `Get Audio from Video`, `Generate Description for Videos  in Tiktok and Instagram`, `Read Video from Google Drive`, `Upload Video and Description to Tiktok`, `Upload Video and Description to Instagram`, `Upload Video and Description to Youtube`, `Upload Video and Description to Facebook`, `Upload Video and Description to Linkedin`, `Get row(s) in sheet in Google Sheets`
- **Node Details:**
  - **Get Audio from Video**
    - Type: OpenAI (Langchain)
    - Role: Extracts audio to assist with description generation.
    - Input: From `Write video`
    - Output: To `Generate Description for Videos  in Tiktok and Instagram`
    - Notes: Retries enabled with wait between tries.
  - **Generate Description for Videos  in Tiktok and Instagram**
    - Type: OpenAI (Langchain)
    - Role: Generates social media descriptions from the extracted audio.
    - Input: From `Get Audio from Video`
    - Output: To `Read Video from Google Drive`
  - **Read Video from Google Drive**
    - Type: Read Binary File
    - Role: Reads video files from Google Drive for upload.
    - Input: From `Generate Description for Videos  in Tiktok and Instagram`
    - Output: To multiple social upload nodes
  - **Upload Video and Description to [Platforms]**
    - Type: HTTP Request
    - Role: Uploads videos and descriptions to respective social media platforms using upload-post.com API.
    - Input: From `Read Video from Google Drive`
    - Output: None
    - Notes: Each upload node requires an API key with header `Authorization: Apikey (token here)` generated at upload-post.com.

#### 1.9 Notifications

- **Overview:** Sends notifications upon workflow completion or status updates.
- **Nodes Involved:** `Notify me on Discord`, `Send a text message`, `Rapiwa`
- **Node Details:**
  - **Notify me on Discord**
    - Type: Discord
    - Role: Sends a message notification on Discord.
    - Input: From `Update Google Sheet`
  - **Send a text message**
    - Type: Telegram
    - Role: Sends a Telegram message.
    - Input: From `Update Google Sheet`
  - **Rapiwa**
    - Type: Rapiwa (third-party service)
    - Role: Sends notification or logging information.
    - Input: From `Update Google Sheet`

#### 1.10 Error Handling & Retry

- **Overview:** Handles failures in image and video generation by waiting and retrying.
- **Nodes Involved:** `Fail check`, `Check for failures`, `Wait to retry`, `Wait 5min`, `Wait 3min`
- **Node Details:**
  - **Fail check**
    - Type: If
    - Role: Checks if video generation succeeded.
    - Failure path triggers wait before retry.
  - **Check for failures**
    - Type: If
    - Role: Checks if image generation succeeded.
    - Failure path triggers wait and retries.
  - **Wait nodes**
    - Used to pause workflow execution before retrying API calls.

---

### 3. Summary Table

| Node Name                                | Node Type                    | Functional Role                                  | Input Node(s)                     | Output Node(s)                      | Sticky Note                                                                                     |
|-----------------------------------------|------------------------------|-------------------------------------------------|----------------------------------|-----------------------------------|------------------------------------------------------------------------------------------------|
| Schedule                                | Schedule Trigger             | Triggers workflow on schedule                    | None                             | Set API Keys                      |                                                                                                |
| Set API Keys                            | Set                         | Sets API keys and credentials                    | Schedule                        | Load Google Sheet                 | SET BEFORE STARTING                                                                            |
| Load Google Sheet                       | Google Sheets               | Loads input data                                 | Set API Keys                   | Generate Video Captions           |                                                                                                |
| Validate list formatting                | If                          | Validates loaded data format                      | Create List                    | Generate Image Prompts, Generate Video Captions, Match captions with videos |                                                                                                |
| Create List                            | Code                        | Processes sheet data into list                    | Generate Video Captions        | Validate list formatting          |                                                                                                |
| Generate Image Prompts                 | OpenAI (Langchain)          | Generates image prompts                           | Validate list formatting       | Calculate Token Usage             |                                                                                                |
| Calculate Token Usage                  | Code                        | Calculates OpenAI token usage                     | Generate Image Prompts         | Generate Image                   |                                                                                                |
| Generate Image                        | HTTP Request                | Calls API to generate images                      | Calculate Token Usage          | Wait 3min                       |                                                                                                |
| Wait 3min                            | Wait                        | Waits 3 minutes after image generation            | Generate Image                | Get image                       |                                                                                                |
| Get image                           | HTTP Request                | Retrieves generated images                        | Wait 3min                    | Check for failures              |                                                                                                |
| Check for failures                   | If                          | Checks image generation success                   | Get image                    | Wait 5min, Image-to-Video       |                                                                                                |
| Wait 5min                           | Wait                        | Waits 5 minutes before retry                      | Check for failures           | Generate Image                  |                                                                                                |
| Image-to-Video                      | HTTP Request                | Converts images to video                          | Wait to retry, Check for failures | Wait 10min                    |                                                                                                |
| Wait to retry                      | Wait                        | Waits before retrying failed video generation    | Fail check                   | Image-to-Video                  |                                                                                                |
| Wait 10min                         | Wait                        | Waits 10 minutes for video processing             | Image-to-Video               | Get Video                      |                                                                                                |
| Get Video                          | HTTP Request                | Retrieves generated video                         | Wait 10min                   | Fail check                    |                                                                                                |
| Fail check                        | If                          | Checks video generation success                   | Get Video                   | Wait to retry, Match captions with videos |                                                                                                |
| Generate Script                   | OpenAI (Langchain)          | Generates video script                            | Validate list formatting (valid) | Generate voice                |                                                                                                |
| Generate voice                   | HTTP Request                | Generates voice audio from script                 | Generate Script              | Upload Voice Audio             |                                                                                                |
| Upload Voice Audio              | Google Drive               | Uploads voice audio to Google Drive               | Generate voice              | Set Access Permissions         |                                                                                                |
| Set Access Permissions          | Google Drive               | Sets sharing permissions on uploaded audio       | Upload Voice Audio          | List Elements1                |                                                                                                |
| List Elements1                 | Code                        | Prepares lists for video-audio pairing            | Set Access Permissions       | Pair Videos with Audio        |                                                                                                |
| Match captions with videos       | Merge                       | Matches captions and videos                       | Fail check                   | List Elements                |                                                                                                |
| List Elements                  | Code                        | Processes lists for pairing                        | Match captions with videos   | Pair Videos with Audio        |                                                                                                |
| Pair Videos with Audio          | Merge                       | Combines video clips with audio                   | List Elements, List Elements1 | Render Final Video           |                                                                                                |
| Render Final Video              | HTTP Request                | Renders final combined video                       | Pair Videos with Audio       | Wait1                       |                                                                                                |
| Wait1                        | Wait                        | Waits for final video rendering                    | Render Final Video           | Get Final Video             |                                                                                                |
| Get Final Video               | HTTP Request                | Retrieves final rendered video                     | Wait1                      | Get Raw File                |                                                                                                |
| Get Raw File                 | HTTP Request                | Downloads final video file                          | Get Final Video             | Upload Final Video, Write video |                                                                                                |
| Write video                 | Write Binary File           | Writes video file locally                           | Get Raw File                | Get Audio from Video         |                                                                                                |
| Get Audio from Video           | OpenAI (Langchain)          | Extracts audio from video for descriptions        | Write video                 | Generate Description for Videos in Tiktok and Instagram | Extract the audio from video for generate the description                                      |
| Generate Description for Videos  in Tiktok and Instagram | OpenAI (Langchain)          | Generates social media descriptions                | Get Audio from Video         | Read Video from Google Drive | Request to OpenAi for generate description with the audio extracted from the video             |
| Read Video from Google Drive   | Read Binary File            | Reads video file for upload                         | Generate Description for Videos in Tiktok and Instagram | Upload Video and Description to Tiktok, Instagram, Youtube, Facebook, Linkedin |                                                                                                |
| Upload Video and Description to Tiktok | HTTP Request                | Uploads video and description to TikTok            | Read Video from Google Drive | None                        | Generate in upload-post.com the token and add to the credentials in the header-> Authorization: Apikey (token here) |
| Upload Video and Description to Instagram | HTTP Request                | Uploads video and description to Instagram          | Read Video from Google Drive | None                        | Generate in upload-post.com the token and add to the credentials in the header-> Authorization: Apikey (token here) |
| Upload Video and Description to Youtube | HTTP Request                | Uploads video and description to YouTube            | Read Video from Google Drive | None                        | Generate in upload-post.com the token and add to the credentials in the header-> Authorization: Apikey (token here) |
| Upload Video and Description to Facebook | HTTP Request                | Uploads video and description to Facebook           | Read Video from Google Drive | None                        | Generate in upload-post.com the token and add to the credentials in the header-> Authorization: Apikey (token here) |
| Upload Video and Description to Linkedin | HTTP Request                | Uploads video and description to LinkedIn           | Read Video from Google Drive | None                        | Generate in upload-post.com the token and add to the credentials in the header-> Authorization: Apikey (token here) |
| Upload Final Video             | Google Drive               | Uploads final video to Google Drive                  | Get Raw File                | Set Permissions             |                                                                                                |
| Set Permissions               | Google Drive               | Sets sharing permissions on final video             | Upload Final Video          | Update Google Sheet         |                                                                                                |
| Update Google Sheet           | Google Sheets              | Updates sheet with upload info/status                | Set Permissions             | Notify me on Discord, Send a text message, Rapiwa |                                                                                                |
| Notify me on Discord           | Discord                    | Sends Discord notification                           | Update Google Sheet         | None                        |                                                                                                |
| Send a text message            | Telegram                   | Sends Telegram notification                          | Update Google Sheet         | None                        |                                                                                                |
| Rapiwa                       | Rapiwa                     | Sends notification/log                                 | Update Google Sheet         | None                        |                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node** (`Schedule`) to trigger the workflow on your desired interval.

2. **Add a Set node** (`Set API Keys`) immediately after `Schedule`:
   - Configure to input all necessary API keys and credentials (OpenAI, Google Drive, Google Sheets, upload-post.com tokens).
   - Mark this node with a note "SET BEFORE STARTING".

3. **Add a Google Sheets node** (`Load Google Sheet`):
   - Connect from `Set API Keys`.
   - Configure to read the spreadsheet and worksheet with video creation data.
   - Enable "Always Output Data".

4. **Add an OpenAI node** (`Generate Video Captions`):
   - Connect from `Load Google Sheet`.
   - Configure prompt templates to generate video captions.

5. **Add a Code node** (`Create List`):
   - Connect from `Generate Video Captions`.
   - Write JavaScript to transform sheet data into a list format.

6. **Add an If node** (`Validate list formatting`):
   - Connect from `Create List`.
   - Configure to check data validity:
     - If valid, continue to `Generate Image Prompts`
     - If invalid, fallback to `Generate Video Captions`
     - Another path to `Match captions with videos`

7. **Add an OpenAI node** (`Generate Image Prompts`):
   - Connect from `Validate list formatting` (valid path).
   - Configure prompt to generate descriptive image prompts.

8. **Add a Code node** (`Calculate Token Usage`):
   - Connect from `Generate Image Prompts`.
   - Implement token usage calculation logic for OpenAI.

9. **Add an HTTP Request node** (`Generate Image`):
   - Connect from `Calculate Token Usage`.
   - Configure to call your image generation API with the prompts.
   - Disable retry on fail for controlled error handling.

10. **Add a Wait node** (`Wait 3min`):
    - Connect from `Generate Image`.
    - Configure to wait 3 minutes for image generation processing.

11. **Add an HTTP Request node** (`Get image`):
    - Connect from `Wait 3min`.
    - Configure to retrieve generated images from the API.

12. **Add an If node** (`Check for failures`):
    - Connect from `Get image`.
    - Configure to check if image generation was successful.
    - On failure: connect to `Wait 5min`, then back to `Generate Image` for retry.
    - On success: connect to `Image-to-Video`.

13. **Add a Wait node** (`Wait 5min`):
    - Connect from failure output of `Check for failures`.
    - Configure to wait 5 minutes before retrying.

14. **Add an HTTP Request node** (`Image-to-Video`):
    - Connect from success output of `Check for failures` and from `Wait to retry`.
    - Configure to convert images into video clips.

15. **Add a Wait node** (`Wait 10min`):
    - Connect from `Image-to-Video`.
    - Configure to wait 10 minutes for video processing.

16. **Add an HTTP Request node** (`Get Video`):
    - Connect from `Wait 10min`.
    - Configure to retrieve the generated video.

17. **Add an If node** (`Fail check`):
    - Connect from `Get Video`.
    - Configure to check video generation success.
    - On failure: connect to `Wait to retry`.
    - On success: connect to `Match captions with videos`.

18. **Add a Wait node** (`Wait to retry`):
    - Connect from failure output of `Fail check`.
    - Configure wait time before retrying video generation.
    - Connect output to `Image-to-Video`.

19. **Add an OpenAI node** (`Generate Script`):
    - Connect from `Validate list formatting` (valid path).
    - Configure to generate the video script.

20. **Add an HTTP Request node** (`Generate voice`):
    - Connect from `Generate Script`.
    - Configure TTS API call to generate voice audio.

21. **Add a Google Drive node** (`Upload Voice Audio`):
    - Connect from `Generate voice`.
    - Configure to upload audio files to Drive.

22. **Add a Google Drive node** (`Set Access Permissions`):
    - Connect from `Upload Voice Audio`.
    - Configure sharing permissions for uploaded audio.

23. **Add a Code node** (`List Elements1`):
    - Connect from `Set Access Permissions`.
    - Prepare audio list for pairing.

24. **Add a Merge node** (`Match captions with videos`):
    - Connect from success output of `Fail check`.
    - Merge captions and videos.

25. **Add a Code node** (`List Elements`):
    - Connect from `Match captions with videos`.
    - Prepare video list for pairing.

26. **Add a Merge node** (`Pair Videos with Audio`):
    - Connect from `List Elements` and `List Elements1`.
    - Merge video clips and audio files.

27. **Add an HTTP Request node** (`Render Final Video`):
    - Connect from `Pair Videos with Audio`.
    - Configure to call external rendering API.

28. **Add a Wait node** (`Wait1`):
    - Connect from `Render Final Video`.
    - Wait for rendering completion.

29. **Add an HTTP Request node** (`Get Final Video`):
    - Connect from `Wait1`.
    - Retrieve the rendered video.

30. **Add an HTTP Request node** (`Get Raw File`):
    - Connect from `Get Final Video`.
    - Download the video file.

31. **Add a Google Drive node** (`Upload Final Video`):
    - Connect from `Get Raw File`.
    - Upload the final video to Drive.

32. **Add a Google Drive node** (`Set Permissions`):
    - Connect from `Upload Final Video`.
    - Set sharing permissions.

33. **Add a Google Sheets node** (`Update Google Sheet`):
    - Connect from `Set Permissions`.
    - Update status or links in the sheet.

34. **Add notification nodes**:
    - `Notify me on Discord`: Connect from `Update Google Sheet`.
    - `Send a text message` (Telegram): Connect from `Update Google Sheet`.
    - `Rapiwa`: Connect from `Update Google Sheet`.

35. **Add a Write Binary File node** (`Write video`):
    - Connect from `Get Raw File`.
    - Save video locally if needed.

36. **Add an OpenAI node** (`Get Audio from Video`):
    - Connect from `Write video`.
    - Extract audio for description generation.

37. **Add an OpenAI node** (`Generate Description for Videos  in Tiktok and Instagram`):
    - Connect from `Get Audio from Video`.
    - Generate social media descriptions.

38. **Add a Read Binary File node** (`Read Video from Google Drive`):
    - Connect from `Generate Description for Videos  in Tiktok and Instagram`.
    - Reads video file for upload.

39. **Add HTTP Request nodes** for uploading videos to social media:
    - `Upload Video and Description to Tiktok`
    - `Upload Video and Description to Instagram`
    - `Upload Video and Description to Youtube`
    - `Upload Video and Description to Facebook`
    - `Upload Video and Description to Linkedin`
    - Connect all from `Read Video from Google Drive`.
    - Configure each to use upload-post.com API with API key in header `Authorization: Apikey (token here)`.

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                                                                          |
|-----------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| The nodes `Upload Video and Description to [Platforms]` require API keys generated on upload-post.com.    | Each node's HTTP request headers must include `Authorization: Apikey (token here)`                      |
| "SET BEFORE STARTING" note on `Set API Keys` node indicates critical setup step before workflow execution. |                                                                                                        |
| Audio extraction from video is performed with OpenAI node `Get Audio from Video` to improve description.  |                                                                                                        |
| Notifications are sent via Discord, Telegram, and Rapiwa on workflow completion.                           |                                                                                                        |
| Multiple wait nodes control pacing and retries to handle asynchronous external API processes.             |                                                                                                        |

---

**Disclaimer:** The text provided comes exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.